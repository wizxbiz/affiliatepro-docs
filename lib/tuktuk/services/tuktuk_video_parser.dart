import 'package:youtube_player_iframe/youtube_player_iframe.dart';

enum VideoSourceType {
  native,   // mp4, webm, mov, avi, mkv — direct BetterPlayer
  hls,      // .m3u8 HLS stream — BetterPlayer with liveStream:true
  youtube,
  tiktok,
  facebook,
  instagram,
  twitter,
  webEmbed, // raw <iframe> HTML
  image,
  unknown
}

class TuktukVideoParser {
  // ── R2 / CDN patterns ──────────────────────────────────────────────────────
  // Cloudflare R2 public URL patterns:
  //   https://pub-xxx.r2.dev/...
  //   https://<accountId>.r2.cloudflarestorage.com/...
  static bool isR2Url(String url) {
    final lower = url.toLowerCase();
    return lower.contains('.r2.dev/') ||
        lower.contains('.r2.cloudflarestorage.com/') ||
        lower.contains('r2.cloudflarestorage.com');
  }

  // ── HLS stream detection ───────────────────────────────────────────────────
  /// Returns true for HLS manifests (.m3u8) and known HLS CDN patterns.
  static bool isHlsStream(String url) {
    final lower = url.toLowerCase().split('?').first;
    if (lower.endsWith('.m3u8')) return true;
    // Common HLS CDN path patterns
    return lower.contains('/hls/') ||
        lower.contains('/live/') && lower.contains('.m3u8') ||
        lower.contains('manifest.m3u8') ||
        lower.contains('playlist.m3u8') ||
        lower.contains('/stream/') && lower.contains('.m3u8');
  }

  // ── Source detection ───────────────────────────────────────────────────────
  static VideoSourceType detectSource(String url) {
    if (url.isEmpty) return VideoSourceType.unknown;
    if (url.contains('<iframe')) return VideoSourceType.webEmbed;

    final lowerUrl = url.toLowerCase();

    // Social platforms — check before generic file checks
    if (lowerUrl.contains('youtube.com') || lowerUrl.contains('youtu.be')) {
      return VideoSourceType.youtube;
    }
    if (lowerUrl.contains('tiktok.com')) return VideoSourceType.tiktok;
    if (lowerUrl.contains('facebook.com') ||
        lowerUrl.contains('fb.watch') ||
        lowerUrl.contains('fb.com')) {
      return VideoSourceType.facebook;
    }
    if (lowerUrl.contains('instagram.com')) return VideoSourceType.instagram;
    if (lowerUrl.contains('twitter.com') || lowerUrl.contains('x.com')) {
      return VideoSourceType.twitter;
    }

    // HLS before generic video check (m3u8 files are not caught by isVideoFile)
    if (isHlsStream(url)) return VideoSourceType.hls;

    // R2 / CDN hosted files — treat as native even without a file extension
    // (e.g. pre-signed URLs or path-based routes that omit extension)
    if (isR2Url(url)) return VideoSourceType.native;

    if (isVideoFile(url)) return VideoSourceType.native;
    if (isImageFile(url)) return VideoSourceType.image;

    return VideoSourceType.unknown;
  }

  // ── File type helpers ──────────────────────────────────────────────────────
  static bool isVideoFile(String url) {
    final lower = url.toLowerCase().split('?').first;
    return lower.endsWith('.mp4') ||
        lower.endsWith('.mov') ||
        lower.endsWith('.avi') ||
        lower.endsWith('.mkv') ||
        lower.endsWith('.webm') ||
        lower.endsWith('.ts'); // HLS segment (should not normally appear as a post URL, but just in case)
  }

  static bool isImageFile(String url) {
    final lower = url.toLowerCase().split('?').first;
    return lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.heic') ||
        lower.endsWith('.gif');
  }

  // ── YouTube helpers ────────────────────────────────────────────────────────
  static String extractYoutubeId(String url) {
    try {
      return YoutubePlayerController.convertUrlToId(url) ?? '';
    } catch (_) {
      final shortsMatch = RegExp(r'shorts/([a-zA-Z0-9_-]+)').firstMatch(url);
      return shortsMatch?.group(1) ?? '';
    }
  }

  /// Returns the highest-quality YouTube thumbnail available for [url].
  /// Priority: maxresdefault → hqdefault → mqdefault → sddefault
  static String? extractYoutubeThumbnail(String url) {
    final id = extractYoutubeId(url);
    if (id.isEmpty) return null;
    // maxresdefault (1280×720) — may 404 for older/unlisted videos; caller should fallback
    return 'https://img.youtube.com/vi/$id/hqdefault.jpg';
  }

  /// Same as [extractYoutubeThumbnail] but returns the max-resolution version.
  static String? extractYoutubeMaxResThumbnail(String url) {
    final id = extractYoutubeId(url);
    if (id.isEmpty) return null;
    return 'https://img.youtube.com/vi/$id/maxresdefault.jpg';
  }

  // ── TikTok helper ──────────────────────────────────────────────────────────
  static String extractTiktokId(String url) {
    final match =
        RegExp(r'tiktok\.com\/(?:.*\/video\/|.*v=)(\d+)').firstMatch(url) ??
            RegExp(r'tiktok\.com\/(?:t|v)\/([\w\d]+)').firstMatch(url) ??
            RegExp(r'(?:vm|vt)\.tiktok\.com\/([\w\d]+)').firstMatch(url);
    return match?.group(1) ?? '';
  }

  // ── Embed HTML ─────────────────────────────────────────────────────────────
  static String getEmbedHtml({
    required String url,
    bool isAutoScrollEnabled = false,
    bool isLive = false,
  }) {
    final source = detectSource(url);
    String innerHtml = '';

    if (url.contains('<iframe')) {
      innerHtml = url
          .replaceFirst(RegExp(r'width="[^"]*"'), 'width="100%"')
          .replaceFirst(RegExp(r'height="[^"]*"'), 'height="100%"');
    } else {
      switch (source) {
        case VideoSourceType.youtube:
          final id = extractYoutubeId(url);
          // origin must NOT be youtube.com — for locally-rendered HTML there is
          // no valid origin, so we omit the parameter entirely.  Passing
          // origin=https://www.youtube.com causes YouTube to reject the
          // postMessage commands used for pause/resume control.
          innerHtml = '''
            <iframe
              id="ytplayer"
              width="100%" height="100%"
              src="https://www.youtube.com/embed/$id?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1"
              frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen>
            </iframe>
          ''';
          break;

        case VideoSourceType.tiktok:
          final id = extractTiktokId(url);
          innerHtml = id.isNotEmpty
              ? '<iframe src="https://www.tiktok.com/player/v1/$id?music_info=1&description=1" allow="autoplay; fullscreen" style="width:100%; height:100%;"></iframe>'
              : '<iframe src="$url" style="width:100%; height:100%;"></iframe>';
          break;

        case VideoSourceType.facebook:
          innerHtml =
              '<iframe src="https://www.facebook.com/plugins/video.php?href=${Uri.encodeComponent(url)}&show_text=0" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; encrypted-media; picture-in-picture" style="width:100%; height:100%;"></iframe>';
          break;

        case VideoSourceType.instagram:
          // Instagram does not support direct oEmbed in WebView without auth;
          // best effort: link-out redirect overlay.
          innerHtml = '''
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:white;font-family:sans-serif;">
              <span style="font-size:40px;">📸</span>
              <p style="margin:12px 0 4px;font-size:16px;font-weight:bold;">Instagram Video</p>
              <a href="$url" target="_blank"
                 style="margin-top:12px;padding:10px 20px;background:linear-gradient(90deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);
                        color:white;border-radius:8px;text-decoration:none;font-size:14px;">
                เปิดใน Instagram
              </a>
            </div>
          ''';
          break;

        case VideoSourceType.twitter:
          innerHtml = '''
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#0f1419;color:white;font-family:sans-serif;">
              <span style="font-size:40px;">🐦</span>
              <p style="margin:12px 0 4px;font-size:16px;font-weight:bold;">X / Twitter Video</p>
              <a href="$url" target="_blank"
                 style="margin-top:12px;padding:10px 20px;background:#1d9bf0;
                        color:white;border-radius:8px;text-decoration:none;font-size:14px;">
                เปิดใน X
              </a>
            </div>
          ''';
          break;

        case VideoSourceType.hls:
          // HLS in WebView using HLS.js (fallback path — primary is BetterPlayer)
          innerHtml = '''
            <video id="player" autoplay playsinline
                   style="width:100%; height:100%; object-fit:contain;"
                   ${isLive ? '' : 'controls'}>
            </video>
            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js"></script>
            <script>
              const video = document.getElementById('player');
              const src = '$url';
              if (Hls.isSupported()) {
                const hls = new Hls({ lowLatencyMode: ${isLive ? 'true' : 'false'} });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  video.play().catch(() => { video.muted = true; video.play(); });
                });
                hls.on(Hls.Events.ERROR, (_, data) => {
                  if (data.fatal && window.AutoScroll) AutoScroll.postMessage('error: HLS fatal');
                });
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS (Safari/iOS)
                video.src = src;
                video.play().catch(() => { video.muted = true; video.play(); });
              }
              video.onended = () => { if (window.AutoScroll) AutoScroll.postMessage('ended'); };
            </script>
          ''';
          break;

        default:
          // native / R2 / unknown — use <video> tag
          final loop = isAutoScrollEnabled ? '' : 'loop';
          innerHtml = '''
            <video id="player" autoplay playsinline $loop style="width:100%; height:100%; object-fit:contain;">
              <source src="$url" type="video/mp4">
              <source src="$url" type="video/webm">
            </video>
          ''';
      }
    }

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: black; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    iframe, video { border: none; width: 100%; height: 100%; }
  </style>
</head>
<body>
  $innerHtml
  <script>
    const v = document.querySelector('video');
    if (v && !document.getElementById('hlsScript')) {
      v.onended = () => { if (window.AutoScroll) AutoScroll.postMessage('ended'); };
      v.onerror = (e) => { if (window.AutoScroll) AutoScroll.postMessage('error: ' + (v.error ? v.error.message : 'Unknown')); };
      const play = async () => {
        try { await v.play(); } catch(e) { v.muted = true; await v.play(); }
      };
      play();
      document.body.onclick = () => { v.muted = false; v.play(); };
    }
    if (document.getElementById('ytplayer')) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        new YT.Player('ytplayer', {
          events: {
            'onStateChange': (e) => {
              if (e.data == YT.PlayerState.ENDED && window.AutoScroll) AutoScroll.postMessage('ended');
            }
          }
        });
      };
    }
  </script>
</body>
</html>
''';
  }

  // ── Thumbnail resolution ───────────────────────────────────────────────────
  /// Resolves the best available thumbnail for a post.
  ///
  /// Resolution order:
  ///  1. Explicit thumbnail fields (thumbnailUrl / thumbnail / thumb)
  ///  2. First image in the `images` list
  ///  3. `imageUrl` / `authorPictureUrl` fallback fields
  ///  4. YouTube API thumbnail (derived from `videoUrl` field if YouTube)
  ///  5. null — caller shows a placeholder
  static String? getThumbnailUrl(Map<String, dynamic> postData) {
    // 1. Explicit thumbnail fields
    String? thumb = postData['thumbnailUrl']?.toString() ??
        postData['thumbnail']?.toString() ??
        postData['thumb']?.toString();
    if (thumb != null && thumb.isNotEmpty && !isVideoFile(thumb)) return thumb;

    // 2. Scan images/media list
    final dynamic rawImages = postData['images'];
    if (rawImages is List && rawImages.isNotEmpty) {
      for (final item in rawImages) {
        if (item is Map) {
          final itemThumb =
              item['thumbnailUrl']?.toString() ?? item['thumb']?.toString();
          if (itemThumb != null && itemThumb.isNotEmpty) return itemThumb;

          if (item['type'] == 'image') {
            final url = item['url']?.toString();
            if (url != null && url.isNotEmpty) return url;
          }

          final url = item['url']?.toString();
          if (url != null && url.isNotEmpty && !isVideoFile(url)) return url;
        } else if (item is String) {
          if (!isVideoFile(item)) return item;
        }
      }
    }

    // 3. Fallback image fields
    thumb = postData['imageUrl']?.toString() ??
        postData['authorPictureUrl']?.toString();
    if (thumb != null && thumb.isNotEmpty && !isVideoFile(thumb)) return thumb;

    // 4. YouTube thumbnail derived from videoUrl
    final videoUrl = postData['videoUrl']?.toString() ??
        postData['url']?.toString() ??
        postData['streamUrl']?.toString() ??
        postData['playbackUrl']?.toString();
    if (videoUrl != null && videoUrl.isNotEmpty) {
      final ytThumb = extractYoutubeThumbnail(videoUrl);
      if (ytThumb != null) return ytThumb;
    }

    return null;
  }

  // ── URL normalisation ──────────────────────────────────────────────────────
  static String normalizeUrl(String url) {
    final String u = url.trim();
    if (u.startsWith('//')) return 'https:$u';
    return u;
  }
}
