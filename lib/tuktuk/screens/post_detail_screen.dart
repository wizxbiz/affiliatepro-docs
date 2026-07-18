import 'dart:async';

import 'package:animate_do/animate_do.dart';
import 'package:better_player_plus/better_player_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/marketplace_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:webview_flutter/webview_flutter.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

class PostDetailScreen extends StatefulWidget {
  final Map<String, dynamic> postData;
  const PostDetailScreen({super.key, required this.postData});

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  BetterPlayerController? _betterPlayerController;
  YoutubePlayerController? _youtubeController;
  WebViewController? _webViewController;

  final TextEditingController _commentController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final TukTukBridge _bridge = TukTukBridge();

  bool _isInitialized = false;
  bool _isPosting = false;
  bool _isLiked = false;
  bool _isPlaying = true;
  bool _showTapFeedback = false;
  bool _lastTapWasPlay = true;
  bool _isFastForwarding = false;
  Map<String, dynamic>? _currentUser;
  String? _effectiveVideoUrl;

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
    _initializePlayer();
    _checkIfLiked();
  }

  Future<void> _checkIfLiked() async {
    final user = await _bridge.getCurrentUser();
    if (user != null) {
      final collectionName =
          widget.postData['originCollection'] ?? 'community_posts';
      final liked = await _bridge.hasLiked(
          widget.postData['id']?.toString() ?? '', collectionName,);
      if (mounted) setState(() => _isLiked = liked);
    }
  }

  void _handleLike() async {
    final user = await _bridge.getCurrentUser();
    if (user == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('กรุณาเข้าสู่ระบบเพื่อกดถูกใจ'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    }

    final postId = widget.postData['id']?.toString() ?? '';
    if (postId.isEmpty) return;

    final collectionName =
        widget.postData['originCollection'] ?? 'community_posts';

    // Optimistic Update
    final bool previouslyLiked = _isLiked;
    setState(() => _isLiked = !_isLiked);

    final success = await _bridge.toggleLike(postId, collectionName);
    if (!success && mounted) {
      // Rollback on failure
      setState(() => _isLiked = previouslyLiked);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ไม่สามารถดำเนินการได้ในขณะนี้'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _handleShare() {
    final title = widget.postData['description'] ?? 'ชมโพสต์นี้บน TukTuk Feed';
    final postId = widget.postData['id'] ?? '';
    final shareUrl = 'https://wizmobiz.com/community-share?id=$postId';
    Share.share('$title\n\n🎬 ดูต่อที่: $shareUrl');
  }

  @override
  void dispose() {
    _betterPlayerController?.dispose();
    _youtubeController?.close();
    _commentController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentUser() async {
    final user = await _bridge.getCurrentUser();
    if (mounted) setState(() => _currentUser = user);
  }

  void _initializePlayer() {
    String? videoUrl = widget.postData['videoUrl']?.toString();

    // ✅ NEW: Check images array if videoUrl is empty
    if (videoUrl == null || videoUrl.isEmpty) {
      final dynamic rawImages = widget.postData['images'];
      if (rawImages is List) {
        final videoItem = rawImages.firstWhere(
          (img) => img is Map && img['type'] == 'video',
          orElse: () => null,
        );
        if (videoItem != null) {
          videoUrl = videoItem['url']?.toString();
        }
      }
    }

    _effectiveVideoUrl = videoUrl;

    if (videoUrl == null || videoUrl.isEmpty) {
      setState(() => _isInitialized = true);
      return;
    }

    if (videoUrl.contains('youtube.com') || videoUrl.contains('youtu.be')) {
      final videoId = YoutubePlayerController.convertUrlToId(videoUrl);
      if (videoId != null) {
        _youtubeController = YoutubePlayerController.fromVideoId(
          videoId: videoId,
          params: const YoutubePlayerParams(
            showControls: true,
            showFullscreenButton: true,
            mute: false,
            loop: true,
          ),
        );
      }
    } else if (videoUrl.contains('tiktok.com') ||
        videoUrl.contains('facebook.com')) {
      _webViewController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.black)
        ..loadHtmlString(_getEmbedHtml(videoUrl));
    } else {
      // Better Player for mp4/etc
      _betterPlayerController = BetterPlayerController(
        const BetterPlayerConfiguration(
          autoPlay: true,
          looping: true,
          aspectRatio: 16 / 9,
          fit: BoxFit.contain,
          controlsConfiguration: BetterPlayerControlsConfiguration(
            showControls: false,
          ),
        ),
        betterPlayerDataSource: BetterPlayerDataSource(
          BetterPlayerDataSourceType.network,
          videoUrl,
        ),
      );

      // Listen to player state changes
      _betterPlayerController?.addEventsListener((BetterPlayerEvent event) {
        if (!mounted) return;

        if (event.betterPlayerEventType == BetterPlayerEventType.play) {
          setState(() => _isPlaying = true);
        } else if (event.betterPlayerEventType == BetterPlayerEventType.pause) {
          setState(() => _isPlaying = false);
        }
      });
    }
    setState(() => _isInitialized = true);
  }

  void _togglePlayPause() {
    if (!_isInitialized) return;

    if (_effectiveVideoUrl == null || _effectiveVideoUrl!.isEmpty) return;

    // Check actual player state
    final bool wasPlaying = _betterPlayerController?.isPlaying() ?? _isPlaying;

    setState(() {
      _showTapFeedback = true;
      _lastTapWasPlay = !wasPlaying;
      _isPlaying = !wasPlaying;
    });

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) setState(() => _showTapFeedback = false);
    });

    if (wasPlaying) {
      _betterPlayerController?.pause();
      _youtubeController?.pauseVideo();
    } else {
      _betterPlayerController?.play();
      _youtubeController?.playVideo();
    }
  }

  void _startFastForward() {
    if (_betterPlayerController == null) return;
    try {
      _betterPlayerController?.setSpeed(2.0);
      setState(() => _isFastForwarding = true);
    } catch (e) {
      debugPrint('Error setting playback speed: $e');
    }
  }

  void _stopFastForward() {
    if (_betterPlayerController == null) return;
    try {
      _betterPlayerController?.setSpeed(1.0);
      setState(() => _isFastForwarding = false);
    } catch (e) {
      debugPrint('Error resetting playback speed: $e');
    }
  }

  String _getEmbedHtml(String url) {
    if (url.contains('tiktok.com')) {
      final tiktokMatch = RegExp(r'video\/(\d+)').firstMatch(url);
      final videoId = tiktokMatch?.group(1);
      return '''
        <!DOCTYPE html><html><body style="margin:0;background:black;"><iframe src="https://www.tiktok.com/player/v1/$videoId" style="width:100%;height:100vh;" frameborder="0" allow="autoplay;fullscreen"></iframe></body></html>
      ''';
    }
    if (url.contains('facebook.com')) {
      return '''
        <!DOCTYPE html><html><body style="margin:0;background:black;"><iframe src="https://www.facebook.com/plugins/video.php?href=${Uri.encodeComponent(url)}&show_text=0" style="width:100%;height:100vh;" frameborder="0" allowfullscreen="true" allow="autoplay"></iframe></body></html>
      ''';
    }
    return '';
  }

  void _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty || _isPosting) return;

    if (_currentUser == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('กรุณาเข้าสู่ระบบ')));
      return;
    }

    if (ProfanityFilter.hasProfanity(text)) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('กรุณาใช้คำสุภาพ')));
      return;
    }

    setState(() => _isPosting = true);
    try {
      final userId =
          (_currentUser!['uid'] ?? _currentUser!['lineUserId'])?.toString() ??
              'unknown';

      final collectionName =
          widget.postData['originCollection'] ?? 'community_posts';

      await FirebaseFirestore.instance
          .collection(collectionName)
          .doc(widget.postData['id']?.toString())
          .collection('comments')
          .add({
        'text': text,
        'userId': userId,
        'userName': _currentUser!['displayName']?.toString() ?? 'User',
        'userPic': _currentUser!['pictureUrl']?.toString() ?? '',
        'timestamp': FieldValue.serverTimestamp(),
        'likes': 0,
      });

      // ✅ Update comment count dynamically
      await FirebaseFirestore.instance
          .collection(collectionName)
          .doc(widget.postData['id']?.toString())
          .update({
        'commentsCount': FieldValue.increment(1),
        'commentCount': FieldValue.increment(1), // Updated for consistency
      });

      _commentController.clear();
      _focusNode.unfocus();
    } catch (e) {
      debugPrint('Error posting comment: $e');
    } finally {
      setState(() => _isPosting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Mini Player / Image Top Area
            _buildMediaHeader(),

            // Content and Comments
            Expanded(
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(child: _buildPostInfo()),
                  const SliverToBoxAdapter(
                      child: Divider(color: Colors.white10),),
                  const SliverPadding(
                    padding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    sliver: SliverToBoxAdapter(
                      child: Text(
                        'ความคิดเห็น',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,),
                      ),
                    ),
                  ),
                  _buildCommentsList(),
                ],
              ),
            ),

            // Comment input
            _buildCommentInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaHeader() {
    final double mediaHeight = MediaQuery.of(context).size.height * 0.3;
    final videoUrl = _effectiveVideoUrl;
    final dynamic rawImages = widget.postData['images'];
    final List<dynamic>? images = rawImages is List ? rawImages : null;

    return Stack(
      children: [
        Container(
          height: mediaHeight,
          width: double.infinity,
          decoration: const BoxDecoration(
              color: Colors.black,
              border: Border(bottom: BorderSide(color: Colors.white10)),),
          child: !_isInitialized
              ? const Center(child: CircularProgressIndicator(color: Colors.orange))
              : (videoUrl != null && videoUrl.isNotEmpty)
                  ? Stack(
                      children: [
                        _buildVideoPlayer(),
                        // Top level gesture detector
                        Positioned.fill(
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onDoubleTap: () {
                              _handleLike();
                              setState(() {
                                _showTapFeedback = true;
                                _lastTapWasPlay = false;
                              });
                              Future.delayed(const Duration(milliseconds: 600),
                                  () {
                                if (mounted) {
                                  setState(() => _showTapFeedback = false);
                                }
                              });
                            },
                            onTap: _togglePlayPause,
                            onLongPress: _startFastForward,
                            onLongPressEnd: (details) => _stopFastForward(),
                          ),
                        ),
                        if (!_isPlaying && _isInitialized)
                          IgnorePointer(
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.all(20),
                                decoration: const BoxDecoration(
                                  color: Colors.black26,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.play_arrow_rounded,
                                    size: 80,
                                    color: Colors.white.withValues(alpha: 0.8),),
                              ),
                            ),
                          ),
                        if (_showTapFeedback)
                          IgnorePointer(
                            child: Center(
                              child: ElasticIn(
                                duration: const Duration(milliseconds: 400),
                                child: Icon(
                                  _lastTapWasPlay
                                      ? (_isPlaying
                                          ? Icons.play_arrow_rounded
                                          : Icons.pause_rounded)
                                      : Icons.favorite,
                                  size: _lastTapWasPlay ? 60 : 100,
                                  color: _lastTapWasPlay
                                      ? Colors.white70
                                      : Colors.red,
                                ),
                              ),
                            ),
                          ),
                        if (_isFastForwarding)
                          Positioned(
                            top: 80,
                            left: 0,
                            right: 0,
                            child: IgnorePointer(
                              child: Center(
                                child: FadeIn(
                                  duration: const Duration(milliseconds: 200),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 8,),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withValues(alpha: 0.7),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                          color: Colors.orange, width: 2,),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.fast_forward_rounded,
                                            color: Colors.orange, size: 20,),
                                        SizedBox(width: 8),
                                        Text(
                                          '2.0x Speed',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    )
                  : _buildImageGallery(images),
        ),
        Positioned(
          top: 10,
          left: 10,
          child: CircleAvatar(
            backgroundColor: Colors.black54,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVideoPlayer() {
    if (_youtubeController != null) {
      return YoutubePlayer(controller: _youtubeController!);
    } else if (_webViewController != null) {
      return WebViewWidget(controller: _webViewController!);
    } else if (_betterPlayerController != null) {
      return BetterPlayer(controller: _betterPlayerController!);
    }
    return const Center(child: Icon(Icons.error, color: Colors.red));
  }

  Widget _buildImageGallery(List<dynamic>? images) {
    if (images == null || images.isEmpty) {
      return const Center(
          child: Icon(Icons.image, size: 50, color: Colors.white24),);
    }

    final mainImage = images.firstWhere(
      (img) => img is Map && img['isMain'] == true,
      orElse: () => images.first,
    );

    String? imageUrl;
    if (mainImage is Map) {
      imageUrl = mainImage['url']?.toString();
    } else if (mainImage is String) {
      imageUrl = mainImage;
    }

    if (imageUrl == null || imageUrl.isEmpty) {
      return const Center(
          child: Icon(Icons.broken_image, color: Colors.white24),);
    }

    return CachedNetworkImage(
      imageUrl: imageUrl,
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(color: Colors.grey[900]),
      errorWidget: (context, url, error) => const Icon(Icons.error),
    );
  }

  Widget _buildPostInfo() {
    final authorName = widget.postData['authorName'] ?? 'Member';
    final authorPic = widget.postData['authorPictureUrl'];
    final description = widget.postData['description'] ?? '';
    final location = widget.postData['location'];

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () {
              final sellerId =
                  (widget.postData['authorId'] ?? widget.postData['userId'])
                      ?.toString();
              if (sellerId != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => MarketplaceScreen(
                      initialSellerId: sellerId,
                      initialSellerName: authorName,
                    ),
                  ),
                );
              }
            },
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: authorPic != null &&
                          authorPic.toString().startsWith('http')
                      ? CachedNetworkImageProvider(authorPic.toString())
                      : null,
                  child: authorPic == null ||
                          !authorPic.toString().startsWith('http')
                      ? const Icon(Icons.person)
                      : null,
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(authorName,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,),),
                    if (location != null)
                      Row(
                        children: [
                          Icon(
                              widget.postData['type'] == 'group'
                                  ? Icons.groups
                                  : Icons.location_on,
                              color: widget.postData['type'] == 'group'
                                  ? Colors.purpleAccent
                                  : Colors.orange,
                              size: 12,),
                          const SizedBox(width: 4),
                          Text(
                              widget.postData['type'] == 'group'
                                  ? '${widget.postData['memberCount'] ?? 0} สมาชิก'
                                  : (location ?? 'ทั่วประเทศ'),
                              style: const TextStyle(
                                  color: Colors.white54, fontSize: 12,),),
                        ],
                      ),
                  ],
                ),
                const Spacer(),
                if (widget.postData['type'] == 'group')
                  _buildJoinGroupButton()
                else
                  _buildVisitStoreButton(
                    (widget.postData['authorId'] ?? widget.postData['userId'])
                        ?.toString(),
                    authorName,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(description,
              style: const TextStyle(color: Colors.white, fontSize: 15, height: 1.5),),
          const SizedBox(height: 8),
          if (widget.postData['hashtags'] is List)
            Wrap(
              spacing: 8,
              children: (widget.postData['hashtags'] as List)
                  .map((tag) => Text('#$tag',
                      style: const TextStyle(color: Colors.blueAccent),),)
                  .toList(),
            ),
          const SizedBox(height: 20),
          _buildInteractionBar(),
        ],
      ),
    );
  }

  Widget _buildInteractionBar() {
    final collectionName =
        widget.postData['originCollection'] ?? 'community_posts';
    final String? postId = widget.postData['id']?.toString();
    if (postId == null || postId.isEmpty) return const SizedBox.shrink();

    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection(collectionName)
          .doc(postId)
          .snapshots(),
      builder: (context, snapshot) {
        int likes = widget.postData['likes'] ?? 0;
        int comments = widget.postData['commentsCount'] ?? 0;
        if (snapshot.hasData && snapshot.data?.exists == true) {
          final data = snapshot.data!.data() as Map<String, dynamic>;
          likes = data['likes'] ?? 0;
          comments = data['commentsCount'] ?? 0;
        }

        return Row(
          children: [
            _buildStatItem(
              icon: _isLiked ? Icons.favorite : Icons.favorite_border,
              label: '$likes',
              color: _isLiked ? Colors.red : Colors.white70,
              onTap: _handleLike,
            ),
            const SizedBox(width: 24),
            _buildStatItem(
              icon: Icons.chat_bubble_outline,
              label: '$comments',
              color: Colors.white70,
              onTap: _focusNode.requestFocus,
            ),
            const SizedBox(width: 24),
            _buildStatItem(
              icon: Icons.share_outlined,
              label: 'แชร์',
              color: Colors.white70,
              onTap: _handleShare,
            ),
            const Spacer(),
            const Icon(Icons.remove_red_eye_outlined,
                color: Colors.white30, size: 16,),
            const SizedBox(width: 4),
            Text('${widget.postData['views'] ?? 0}',
                style: const TextStyle(color: Colors.white30, fontSize: 13),),
          ],
        );
      },
    );
  }

  Widget _buildStatItem(
      {required IconData icon,
      required String label,
      required Color color,
      required VoidCallback onTap,}) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildCommentsList() {
    final collectionName =
        widget.postData['originCollection'] ?? 'community_posts';
    final String? postId = widget.postData['id']?.toString();
    if (postId == null || postId.isEmpty) {
      return const SliverFillRemaining(
        child: Center(
          child:
              Text('ข้อมูลไม่ถูกต้อง', style: TextStyle(color: Colors.white24)),
        ),
      );
    }

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection(collectionName)
          .doc(postId)
          .collection('comments')
          .orderBy('timestamp', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SliverFillRemaining(
              child: Center(
                  child: CircularProgressIndicator(color: Colors.orange),),);
        }
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(40.0),
              child: Center(
                  child: Text('ยังไม่มีความคิดเห็น',
                      style: TextStyle(color: Colors.white38),),),
            ),
          );
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final comment =
                  snapshot.data!.docs[index].data() as Map<String, dynamic>;
              return FadeInUp(
                duration: const Duration(milliseconds: 300),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundImage: comment['userPic'] != null &&
                                comment['userPic'].toString().isNotEmpty
                            ? CachedNetworkImageProvider(comment['userPic'])
                            : null,
                        child: comment['userPic'] == null
                            ? const Icon(Icons.person, size: 16)
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(comment['userName'] ?? 'User',
                                    style: const TextStyle(
                                        color: Colors.white70,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,),),
                                if (comment['timestamp'] != null)
                                  Text(
                                    timeago.format(
                                        (comment['timestamp'] as Timestamp)
                                            .toDate(),
                                        locale: 'th',),
                                    style: const TextStyle(
                                        color: Colors.white30, fontSize: 10,),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(comment['text'] ?? '',
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 14,),),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
            childCount: snapshot.data!.docs.length,
          ),
        );
      },
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: EdgeInsets.only(
          left: 16,
          right: 8,
          top: 8,
          bottom: MediaQuery.of(context).viewInsets.bottom + 8,),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        border: const Border(top: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundImage: _currentUser?['pictureUrl'] != null
                ? CachedNetworkImageProvider(_currentUser?['pictureUrl'])
                : null,
            child:
                _currentUser?['pictureUrl'] == null ? const Icon(Icons.person) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _commentController,
                focusNode: _focusNode,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'เพิ่มความคิดเห็น...',
                  hintStyle: TextStyle(color: Colors.white30),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          IconButton(
            onPressed: _postComment,
            icon: _isPosting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.orange,),)
                : const Icon(Icons.send, color: Colors.orange),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinGroupButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.purple.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.purpleAccent),
      ),
      child: const Text(
        'เข้าร่วมกลุ่ม',
        style: TextStyle(
            color: Colors.purpleAccent,
            fontSize: 12,
            fontWeight: FontWeight.bold,),
      ),
    );
  }

  Widget _buildVisitStoreButton(String? sellerId, String authorName) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF00f2ea)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Row(
        children: [
          Icon(Icons.storefront, color: Color(0xFF00f2ea), size: 14),
          SizedBox(width: 4),
          Text(
            'เยี่ยมชมร้านค้า',
            style: TextStyle(
                color: Color(0xFF00f2ea),
                fontSize: 12,
                fontWeight: FontWeight.bold,),
          ),
        ],
      ),
    );
  }
}
