import 'package:caculateapp/tuktuk/services/tuktuk_video_parser.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

enum TukTukItemType {
  video,
  image,
  product,
  welcome,
  infoCard,
  recommendation,
  ideaLab,
  winRider, // Win Rider registration promo card (non-rider customers)
  riderJob, // Rider job feed card — rider sees pending jobs
  riderProfile, // Customer sees an available rider card with Book button
  featuredSeller, // 🆕 Featured seller/shop card injected every 15 videos
  live, // 🎥 Live Streaming (Official News / Verified Creators)
}

class TukTukItem {
  final String id;
  final TukTukItemType type;
  final Map<String, dynamic> data;
  final String collectionName;

  TukTukItem({
    required this.id,
    required this.type,
    required this.data,
    required this.collectionName,
  });

  factory TukTukItem.fromPost(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    TukTukItemType type = TukTukItemType.image; // Default to image

    // 🎥 Robust detection: Check top-level video fields first
    bool hasVideoUrl = (data['videoUrl']?.toString().isNotEmpty ?? false) ||
        (data['video_url']?.toString().isNotEmpty ?? false) ||
        (data['videoEmbed']?.toString().isNotEmpty ?? false) ||
        (data['youtubeUrl']?.toString().isNotEmpty ?? false) ||
        (data['youtube_url']?.toString().isNotEmpty ?? false) ||
        (data['category'] == 'video') ||
        (data['type'] == 'video');

    bool hasVideoInImages = false;
    if (!hasVideoUrl && data['images'] is List) {
      for (final img in data['images'] as List) {
        final url = (img is Map) ? img['url']?.toString() : img.toString();
        if (url != null && url.isNotEmpty) {
          final source = TuktukVideoParser.detectSource(url);
          if (source != VideoSourceType.image &&
              source != VideoSourceType.unknown) {
            hasVideoInImages = true;
            break;
          }
        }
      }
    }

    if (hasVideoUrl || hasVideoInImages) {
      type = TukTukItemType.video;
    }

    data['id'] = doc.id;
    data['originCollection'] = 'community_posts';

    // ✅ Pre-extract video URL for better performance in UI loops
    String videoUrl = data['videoUrl']?.toString() ??
        data['video_url']?.toString() ??
        data['videoEmbed']?.toString() ??
        data['youtubeUrl']?.toString() ??
        data['youtube_url']?.toString() ??
        '';
    if (videoUrl.isEmpty && data['images'] is List) {
      for (final img in data['images'] as List) {
        final url = (img is Map) ? img['url']?.toString() : img.toString();
        if (url != null && url.isNotEmpty) {
          final source = TuktukVideoParser.detectSource(url);
          if (source != VideoSourceType.image &&
              source != VideoSourceType.unknown) {
            videoUrl = url;
            break;
          }
        }
      }
    }
    data['extractedVideoUrl'] = videoUrl;

    // Guard: if we typed this as video but found no playable URL,
    // fall back to image so the video player is never launched with
    // an empty URL (prevents "ไม่พบลิงก์วิดีโอ" error screen).
    if (videoUrl.isEmpty && type == TukTukItemType.video) {
      type = TukTukItemType.image;
    }

    return TukTukItem(
      id: doc.id,
      type: type,
      data: data,
      collectionName: 'community_posts',
    );
  }

  factory TukTukItem.fromProduct(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    data['id'] = doc.id;
    data['originCollection'] = 'marketplace_items';

    return TukTukItem(
      id: doc.id,
      type: TukTukItemType.product,
      data: data,
      collectionName: 'marketplace_items',
    );
  }

  factory TukTukItem.fromInfoCard(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    data['id'] = doc.id;
    data['originCollection'] = 'news_feed';

    return TukTukItem(
      id: doc.id,
      type: TukTukItemType.infoCard,
      data: data,
      collectionName: 'news_feed',
    );
  }

  factory TukTukItem.fromMap(
    Map<String, dynamic> data,
    String collectionName, {
    String? id,
    DocumentSnapshot? doc,
  }) {
    final String finalId =
        id ?? data['id'] ?? data['ID'] ?? (doc != null ? doc.id : '');
    TukTukItemType type = TukTukItemType.image;

    if (collectionName == 'marketplace_items' ||
        collectionName == 'community_products') {
      type = TukTukItemType.product;
    } else if (collectionName == 'news_feed' || data['type'] == 'infoCard') {
      type = TukTukItemType.infoCard;
    } else {
      // 🎥 Robust detection: Check top-level video fields first
      bool hasVideoUrl = (data['videoUrl']?.toString().isNotEmpty ?? false) ||
          (data['video_url']?.toString().isNotEmpty ?? false) ||
          (data['videoEmbed']?.toString().isNotEmpty ?? false) ||
          (data['youtubeUrl']?.toString().isNotEmpty ?? false) ||
          (data['youtube_url']?.toString().isNotEmpty ?? false) ||
          (data['category'] == 'video') ||
          (data['type'] == 'video');

      // 🖼️ If not found in top-level, scan the images/media list for video signatures
      if (!hasVideoUrl && data['images'] is List) {
        for (final img in data['images'] as List) {
          final url = (img is Map) ? img['url']?.toString() : img.toString();
          if (url != null && url.isNotEmpty) {
            final source = TuktukVideoParser.detectSource(url);
            if (source != VideoSourceType.image &&
                source != VideoSourceType.unknown) {
              hasVideoUrl = true;
              break;
            }
          }
        }
      }

      if (hasVideoUrl) {
        type = TukTukItemType.video;
      }
    }

    data['id'] = finalId;
    data['originCollection'] = collectionName;

    // Extract a concrete playable URL so the feed can pass it straight
    // to VideoPlayerItem without re-scanning the data map each frame.
    // Mirrors the extraction logic in fromPost.
    if (type == TukTukItemType.video && data['extractedVideoUrl'] == null) {
      String extracted = data['videoUrl']?.toString() ??
          data['video_url']?.toString() ??
          data['videoEmbed']?.toString() ??
          data['youtubeUrl']?.toString() ??
          data['youtube_url']?.toString() ??
          '';
      if (extracted.isEmpty && data['images'] is List) {
        for (final img in data['images'] as List) {
          final url = (img is Map) ? img['url']?.toString() : img.toString();
          if (url != null && url.isNotEmpty) {
            final source = TuktukVideoParser.detectSource(url);
            if (source != VideoSourceType.image &&
                source != VideoSourceType.unknown) {
              extracted = url;
              break;
            }
          }
        }
      }
      data['extractedVideoUrl'] = extracted;
      // No playable URL found → downgrade to image to avoid empty player.
      if (extracted.isEmpty) type = TukTukItemType.image;
    }

    return TukTukItem(
      id: finalId,
      type: type,
      data: data,
      collectionName: collectionName,
    );
  }

  /// Creates a Win Rider registration promo card (no Firestore doc needed)
  factory TukTukItem.winRiderPromo() {
    return TukTukItem(
      id: 'win_rider_promo',
      type: TukTukItemType.winRider,
      data: {'cardType': 'winRider'},
      collectionName: 'win_riders',
    );
  }

  /// Creates a rider job card from a Firestore win_rider_requests document
  factory TukTukItem.fromRiderJob(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    data['id'] = doc.id;
    data['originCollection'] = 'win_rider_requests';
    return TukTukItem(
      id: doc.id,
      type: TukTukItemType.riderJob,
      data: data,
      collectionName: 'win_rider_requests',
    );
  }

  /// Creates a rider profile card from a Firestore win_riders document
  /// (shown to customers to browse and book available riders)
  factory TukTukItem.fromRiderProfile(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    data['id'] = doc.id;
    data['originCollection'] = 'win_riders';
    return TukTukItem(
      id: doc.id,
      type: TukTukItemType.riderProfile,
      data: data,
      collectionName: 'win_riders',
    );
  }

  factory TukTukItem.fromLive(Map<String, dynamic> data) {
    data['originCollection'] = 'live_sessions';
    return TukTukItem(
      id: data['sessionId'] ??
          data['id'] ??
          'live_${DateTime.now().millisecondsSinceEpoch}',
      type: TukTukItemType.live,
      data: data,
      collectionName: 'live_sessions',
    );
  }
}
