import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/models/text_overlay.dart';
import 'package:caculateapp/tuktuk/screens/post_detail_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/widgets/comments_sheet.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:caculateapp/tuktuk/widgets/video_fallback_card.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

class ImagePostItem extends StatefulWidget {
  final Map<String, dynamic> postData;
  final bool isActive;
  final bool isAutoScrollEnabled;
  final VoidCallback? onTimerEnd;

  const ImagePostItem({
    super.key,
    required this.postData,
    required this.isActive,
    this.isAutoScrollEnabled = false,
    this.onTimerEnd,
  });

  @override
  State<ImagePostItem> createState() => _ImagePostItemState();
}

class _ImagePostItemState extends State<ImagePostItem>
    with SingleTickerProviderStateMixin {
  bool _isLiked = false;
  String _authorName = 'Member';
  String? _authorPic;
  int _followersCount = 0;
  int _viewsCount = 0;
  bool _viewTracked = false;
  late AnimationController _progressController;
  bool _isPaused = false;

  @override
  void initState() {
    super.initState();
    _authorName = widget.postData['authorName'] ?? 'Member';
    _authorPic = widget.postData['authorPictureUrl'];
    _followersCount = widget.postData['followersCount'] ?? 0;
    _viewsCount = widget.postData['views'] ?? 0;

    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    );

    _fetchAuthorDetails();
    _trackViewIfNeeded();

    if (widget.isActive && widget.isAutoScrollEnabled) {
      _startCountdown();
    }
  }

  void _startCountdown() {
    if (_isPaused) return;
    _progressController.reset();
    _progressController.forward().then((_) {
      if (mounted && widget.isActive && !_isPaused) {
        widget.onTimerEnd?.call();
      }
    });
  }

  void _trackViewIfNeeded() {
    if (widget.isActive && !_viewTracked) {
      final postId = widget.postData['id']?.toString();
      if (postId != null) {
        final collectionName =
            widget.postData['originCollection'] ?? 'posts';
        TukTukBridge().trackView(postId, collectionName);
        _viewTracked = true;
      }
    }
  }

  @override
  void didUpdateWidget(ImagePostItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _trackViewIfNeeded();
      if (widget.isAutoScrollEnabled) {
        _startCountdown();
      }
    } else if (!widget.isActive && oldWidget.isActive) {
      _progressController.stop();
      _progressController.reset();
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  Future<void> _fetchAuthorDetails() async {
    final authorId = widget.postData['authorId'];
    if (authorId == null || authorId == 'admin') return;

    try {
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(authorId)
          .get();

      if (userDoc.exists && mounted) {
        final userData = userDoc.data();
        if (userData != null) {
          setState(() {
            _authorName =
                userData['displayName'] ?? userData['name'] ?? _authorName;
            _authorPic = userData['pictureUrl'] ??
                userData['photoURL'] ??
                userData['picture'] ??
                userData['avatar'] ??
                _authorPic;

            // Sanitize
            if (_authorPic != null &&
                (!_authorPic!.startsWith('http') || _authorPic!.length < 10)) {
              _authorPic = null;
            }
            _followersCount = userData['followersCount'] ?? 0;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching author details: $e');
    }

    // Check if liked
    final postId = widget.postData['id']?.toString() ?? '';
    final collectionName =
        widget.postData['originCollection'] ?? 'posts';
    if (postId.isNotEmpty) {
      final liked = await TukTukBridge().hasLiked(postId, collectionName);
      if (mounted) setState(() => _isLiked = liked);
    }
  }

  Future<void> _handleLike() async {
    final postId = widget.postData['id'];
    if (postId == null) return;

    final collectionName =
        widget.postData['originCollection'] ?? 'posts';

    // Optimistic UI update
    setState(() => _isLiked = !_isLiked);

    final success = await TukTukBridge().toggleLike(postId, collectionName);
    if (!success && mounted) {
      // Rollback on failure
      setState(() => _isLiked = !_isLiked);
    }
  }

  void _handleShare() {
    final title = widget.postData['description'] ?? 'ชมรูปภาพนี้บน TukTuk Feed';
    final url = widget.postData['imageUrl'] ?? '';
    SharePlus.instance.share(ShareParams(text: '$title\n$url'));
  }

  void _showMoreOptions() async {
    final user = await TukTukBridge().getCurrentUser();
    final bool isOwner =
        user != null && user['uid'] == widget.postData['authorId'];

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.grey[900]?.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(25)),
          border: Border.all(color: Colors.white10),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              _buildOptionTile(
                icon: Icons.auto_mode,
                label: widget.isAutoScrollEnabled
                    ? 'เล่นอัตโนมัติ (เปิดอยู่)'
                    : 'เล่นอัตโนมัติ (ปิดอยู่)',
                color: Colors.orange,
                onTap: () => Navigator.pop(context),
              ),
              if (isOwner) ...[
                _buildOptionTile(
                  icon: Icons.edit_note,
                  label: 'แก้ไขโพสต์',
                  color: Colors.blueAccent,
                  onTap: () {
                    Navigator.pop(context);
                    _editPost();
                  },
                ),
                _buildOptionTile(
                  icon: Icons.delete_outline,
                  label: 'ลบโพสต์',
                  color: Colors.redAccent,
                  onTap: () {
                    Navigator.pop(context);
                    _confirmDelete();
                  },
                ),
              ],
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(label, style: const TextStyle(color: Colors.white)),
      onTap: onTap,
    );
  }

  Future<void> _confirmDelete() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text('ยืนยันการลบ', style: TextStyle(color: Colors.white)),
        content: const Text(
          'คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('ยกเลิก', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ลบ', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (result == true && mounted) {
      try {
        final postId = widget.postData['id'];
        final imageUrl = widget.postData['imageUrl'];
        if (postId == null) return;

        // Extract media URLs for storage cleanup
        final List<String> mediaUrls = [];
        if (imageUrl != null && imageUrl.isNotEmpty) mediaUrls.add(imageUrl);

        final success = await TukTukBridge()
            .deleteCommunityPost(postId, mediaUrls: mediaUrls);

        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('ลบโพสต์สำเร็จ')),
          );
        }
      } catch (e) {
        debugPrint('Delete error: $e');
      }
    }
  }

  void _editPost() {
    final TextEditingController descController =
        TextEditingController(text: widget.postData['description'] ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'แก้ไขคำบรรยาย',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 15),
              TextField(
                controller: descController,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'เขียนคำบรรยายของคุณ...',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.05),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text(
                        'ยกเลิก',
                        style: TextStyle(color: Colors.white54),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: () async {
                        final String newDesc = descController.text.trim();
                        final String postId = widget.postData['id'] ?? '';

                        if (postId.isNotEmpty) {
                          final success =
                              await TukTukBridge().updateCommunityPost(
                            postId,
                            {'description': newDesc},
                          );
                          if (success && mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('อัปเดตโพสต์แล้ว')),
                            );
                          }
                        }
                      },
                      child: const Text(
                        'บันทึก',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Use a smarter image resolution logic (similar to TuktukVideoParser)
    String imageUrl = widget.postData['imageUrl']?.toString() ?? '';
    if (imageUrl.isEmpty ||
        imageUrl.toLowerCase().contains('.mp4') ||
        imageUrl.toLowerCase().contains('.m3u8')) {
      // Fallback to images list if available
      final List? images = widget.postData['images'];
      if (images != null && images.isNotEmpty) {
        final first = images.first;
        if (first is Map)
          imageUrl = (first['url'] ?? first['thumbnailUrl'] ?? '').toString();
        else if (first is String) imageUrl = first;
      }
    }

    // Final fallback if still empty
    if (imageUrl.isEmpty) {
      imageUrl =
          (widget.postData['thumbnailUrl'] ?? widget.postData['thumb'] ?? '')
              .toString();
    }

    return RepaintBoundary(
      child: GestureDetector(
        onLongPressStart: (_) {
          setState(() => _isPaused = true);
          _progressController.stop();
        },
        onLongPressEnd: (_) {
          setState(() => _isPaused = false);
          if (widget.isActive && widget.isAutoScrollEnabled) {
            _progressController.forward();
          }
        },
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Image Background
            _buildFilteredImage(imageUrl),

            // Text Overlays
            ..._buildOverlays(imageUrl),

            // Dark Gradient for readability
            _buildGradientOverlay(),

            // Profile & Description Overlay (Bottom Left)
            Positioned(
              left: 15,
              bottom: 100,
              right: 90,
              child: _buildProfileSection(),
            ),

            // Side Actions Panel (Right)
            Positioned(
              right: 8,
              bottom: 120,
              child: _buildSideActionsPanel(),
            ),

            // ⏳ Progress Bar (Auto-scroll visualizer)
            if (widget.isActive && widget.isAutoScrollEnabled)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
                    child: AnimatedBuilder(
                      animation: _progressController,
                      builder: (context, child) => LinearProgressIndicator(
                        value: _progressController.value,
                        backgroundColor: Colors.white12,
                        valueColor:
                            const AlwaysStoppedAnimation<Color>(Colors.orange),
                        minHeight: 2,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.orange, width: 2),
              ),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: Colors.grey[900],
                backgroundImage:
                    (_authorPic != null && _authorPic!.startsWith('http'))
                        ? CachedNetworkImageProvider(_authorPic!)
                        : null,
                child: (_authorPic == null || !_authorPic!.startsWith('http'))
                    ? const Icon(Icons.person, color: Colors.white, size: 18)
                    : null,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _authorName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      shadows: [Shadow(blurRadius: 10, color: Colors.black)],
                    ),
                  ),
                  Text(
                    '$_followersCount ผู้ติดตาม • $_viewsCount การดู',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    PostDetailScreen(postData: widget.postData),
              ),
            );
          },
          child: Text(
            widget.postData['description'] ?? '',
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              height: 1.4,
              shadows: [Shadow(blurRadius: 10, color: Colors.black)],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSideActionsPanel() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildActionIcon(
          icon: Icons.more_horiz,
          onTap: _showMoreOptions,
        ),
        const SizedBox(height: 20),
        // Like Button with real-time count
        StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection(
                widget.postData['originCollection'] ?? 'posts',
              )
              .doc(widget.postData['id']?.toString())
              .snapshots(),
          builder: (context, snapshot) {
            int likesCount = widget.postData['likes'] ?? 0;
            if (snapshot.hasData && snapshot.data?.data() != null) {
              final data = snapshot.data!.data() as Map<String, dynamic>;
              likesCount = data['likesCount'] ?? data['likes'] ?? 0;
            }

            return _buildActionButton(
              icon: _isLiked ? Icons.favorite : Icons.favorite_border,
              label: '$likesCount',
              color: _isLiked ? Colors.redAccent : Colors.white,
              onTap: _handleLike,
            );
          },
        ),
        const SizedBox(height: 20),
        // Comment Button with real-time count
        StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection(
                widget.postData['originCollection'] ?? 'posts',
              )
              .doc(widget.postData['id']?.toString())
              .snapshots(),
          builder: (context, snapshot) {
            int commentsCount = widget.postData['commentsCount'] ?? 0;
            if (snapshot.hasData && snapshot.data?.data() != null) {
              final data = snapshot.data!.data() as Map<String, dynamic>;
              commentsCount =
                  data['commentsCount'] ?? data['commentCount'] ?? 0;
            }

            return _buildActionButton(
              icon: Icons.chat_bubble_outline,
              label: '$commentsCount',
              onTap: () {
                final postId = widget.postData['id']?.toString();
                if (postId == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('ไม่พบข้อมูลโพสต์')),
                  );
                  return;
                }
                final collectionName =
                    widget.postData['originCollection'] ?? 'posts';
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (context) => CommentsSheet(
                    postId: postId,
                    collection: collectionName,
                  ),
                );
              },
            );
          },
        ),
        const SizedBox(height: 20),
        _buildActionButton(
          icon: Icons.reply,
          label: 'แชร์',
          onTap: _handleShare,
        ),
      ],
    );
  }

  Widget _buildActionIcon({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Icon(
        icon,
        color: Colors.white70,
        size: 26,
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    Color? color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(
            icon,
            color: color ?? Colors.white,
            size: 30,
            shadows: const [Shadow(color: Colors.black54, blurRadius: 10)],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: color ?? Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradientOverlay() {
    return Positioned.fill(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.black.withValues(alpha: 0.2),
              Colors.transparent,
              Colors.transparent,
              Colors.black.withValues(alpha: 0.6),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: const [0.0, 0.2, 0.7, 1.0],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildOverlays(String currentImageUrl) {
    if (widget.postData['images'] == null) return [];

    // Find the image object matching current URL
    final List<dynamic> images = widget.postData['images'];
    final imageObj = images.firstWhere(
      (img) =>
          (img is Map && img['url'] == currentImageUrl) ||
          (img is String && img == currentImageUrl),
      orElse: () => null,
    );

    if (imageObj == null || imageObj is! Map || imageObj['overlays'] == null) {
      return [];
    }

    final List<dynamic> overlaysData = imageObj['overlays'];
    return overlaysData.map((data) {
      final overlay = TextOverlay.fromJson(data);
      return Positioned(
        left: MediaQuery.of(context).size.width * overlay.x - 100,
        top: MediaQuery.of(context).size.height * overlay.y - 50,
        child: Transform.scale(
          scale: overlay.scale,
          child: Container(
            constraints: const BoxConstraints(minWidth: 50, maxWidth: 300),
            padding: const EdgeInsets.all(8),
            decoration: overlay.style == TextStyleType.box
                ? BoxDecoration(
                    color: overlay.color,
                    borderRadius: BorderRadius.circular(8),
                  )
                : null,
            child: Text(
              overlay.text,
              textAlign: TextAlign.center,
              style: _getTextStyle(overlay),
            ),
          ),
        ),
      );
    }).toList();
  }

  TextStyle _getTextStyle(TextOverlay overlay) {
    const double fontSize = 24.0;

    // Apply Font
    final TextStyle baseStyle = GoogleFonts.getFont(overlay.fontName);

    switch (overlay.style) {
      case TextStyleType.classic:
        return baseStyle.copyWith(
          color: overlay.color,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 2,
              offset: const Offset(1, 1),
            ),
          ],
        );
      case TextStyleType.neon:
        return baseStyle.copyWith(
          color: Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(color: overlay.color, blurRadius: 10),
            Shadow(color: overlay.color, blurRadius: 20),
            Shadow(color: overlay.color, blurRadius: 30),
          ],
        );
      case TextStyleType.outline:
        return baseStyle.copyWith(
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          foreground: Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 3
            ..color = overlay.color,
        );
      case TextStyleType.box:
        return baseStyle.copyWith(
          color: overlay.color.computeLuminance() > 0.5
              ? Colors.black
              : Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
        );
    }
  }

  Widget _buildFilteredImage(String imageUrl) {
    // 0: Normal, 1: Smooth, 2: Vibrant, 3: Soft
    final int filterId = widget.postData['filter_id'] ?? 0;
    List<double>? matrix;

    switch (filterId) {
      case 1: // Smooth / Beauty
        matrix = <double>[
          1.1,
          0,
          0,
          0,
          0,
          0,
          1.05,
          0,
          0,
          0,
          0,
          0,
          1.05,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ];
        break;
      case 2: // Vibrant
        matrix = <double>[
          1.2,
          0,
          0,
          0,
          0,
          0,
          1.2,
          0,
          0,
          0,
          0,
          0,
          1.2,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ];
        break;
      case 3: // Soft / Cool
        matrix = <double>[
          1.0,
          0,
          0,
          0,
          0,
          0,
          1.0,
          0,
          0,
          0,
          0,
          0,
          1.1,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
        ];
        break;
      default:
        matrix = null;
    }

    final imageWidget = CachedNetworkImage(
      imageUrl: imageUrl,
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.orange),
        ),
      ),
      errorWidget: (context, url, error) => VideoFallbackCard(
        failedUrl: url,
        mediaType: 'image',
        onRetry: () => setState(() {}),
      ),
    );

    if (matrix != null) {
      return ColorFiltered(
        colorFilter: ColorFilter.matrix(matrix),
        child: imageWidget,
      );
    }
    return imageWidget;
  }
}
