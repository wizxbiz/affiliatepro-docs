import 'package:caculateapp/tuktuk/widgets/video_player_item.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

/// Screen สำหรับเปิดดูวิดีโอแบบเต็มจอ
/// รองรับการเปิดจาก Deep Link และการกดจาก Profile Grid
class VideoViewerScreen extends StatefulWidget {
  final String? postId;
  final Map<String, dynamic>? postData;
  final String? videoUrl;
  final List<DocumentSnapshot>? posts; // For viewing multiple posts
  final int initialIndex;
  final String? collectionOverride;

  const VideoViewerScreen({
    super.key,
    this.postId,
    this.postData,
    this.videoUrl,
    this.posts,
    this.initialIndex = 0,
    this.collectionOverride,
  });

  @override
  State<VideoViewerScreen> createState() => _VideoViewerScreenState();
}

class _VideoViewerScreenState extends State<VideoViewerScreen> {
  Map<String, dynamic>? _postData;
  String? _videoUrl;
  bool _isLoading = true;
  String? _error;
  late PageController _pageController;
  int _currentIndex = 0;

  // Single post mode vs multi-post mode
  bool get _isMultiMode => widget.posts != null && widget.posts!.isNotEmpty;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);

    setState(() {
      _postData = widget.postData;
      _extractVideoUrl();
      _isLoading = false;
    });
  }

  void _extractVideoUrl() {
    if (_postData == null) return;

    // Robust extraction (aligned with community post model)
    String url =
        (_postData!['videoUrl'] ?? _postData!['videoEmbed'] ?? '').toString();

    if (url.isEmpty && _postData!['images'] is List) {
      for (final item in (_postData!['images'] as List)) {
        if (item is String) {
          if (item.toLowerCase().contains('.mp4') ||
              item.toLowerCase().contains('.mov')) {
            url = item;
            break;
          }
        } else if (item is Map) {
          if (item['type'] == 'video' ||
              item['url']?.toString().toLowerCase().contains('.mp4') == true) {
            url = item['url']?.toString() ?? '';
            break;
          }
        }
      }
    }

    if (url.isEmpty) url = _postData!['imageUrl']?.toString() ?? '';
    if (url.isEmpty &&
        _postData!['images'] != null &&
        (_postData!['images'] as List).isNotEmpty) {
      final first = (_postData!['images'] as List).first;
      url = (first is Map) ? (first['url'] ?? '').toString() : first.toString();
    }

    _videoUrl = url;
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Colors.orange),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 60, color: Colors.orange),
              const SizedBox(height: 20),
              Text(
                _error!,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 30),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                child: const Text('กลับ'),
              ),
            ],
          ),
        ),
      );
    }

    // Multi-post mode (from Profile grid)
    if (_isMultiMode) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              itemCount: widget.posts!.length,
              onPageChanged: (index) => setState(() => _currentIndex = index),
              itemBuilder: (context, index) {
                final doc = widget.posts![index];
                final data = doc.data() as Map<String, dynamic>;
                data['id'] = doc.id;
                if (widget.collectionOverride != null) {
                  data['originCollection'] = widget.collectionOverride;
                }

                // Robust Video URL/Media extraction (aligned with channel.html)
                String videoUrl = data['videoUrl']?.toString() ?? '';
                if (videoUrl.isEmpty) {
                  videoUrl = data['videoEmbed']?.toString() ?? '';
                }

                if (videoUrl.isEmpty &&
                    data['images'] is List &&
                    (data['images'] as List).isNotEmpty) {
                  for (final item in (data['images'] as List)) {
                    if (item is String) {
                      if (item.toLowerCase().contains('.mp4') ||
                          item.toLowerCase().contains('.mov')) {
                        videoUrl = item;
                        break;
                      }
                    } else if (item is Map) {
                      if (item['type'] == 'video' ||
                          item['url']
                                  ?.toString()
                                  .toLowerCase()
                                  .contains('.mp4') ==
                              true) {
                        videoUrl = item['url']?.toString() ?? '';
                        break;
                      }
                    }
                  }
                }

                // If still empty, fall back to first image or main imageUrl
                if (videoUrl.isEmpty) {
                  videoUrl = data['imageUrl']?.toString() ?? '';
                  if (videoUrl.isEmpty &&
                      data['images'] is List &&
                      (data['images'] as List).isNotEmpty) {
                    final first = (data['images'] as List).first;
                    videoUrl = (first is Map)
                        ? (first['url'] ?? '').toString()
                        : first.toString();
                  }
                }

                return VideoPlayerItem(
                  key: ValueKey('post_${data['id']}_$videoUrl'),
                  videoUrl: videoUrl,
                  postData: data,
                  isActive: _currentIndex == index,
                  onTimerEnd: () => _pageController.nextPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeIn,),
                );
              },
            ),
            // Back button
            Positioned(
              top: MediaQuery.of(context).padding.top + 10,
              left: 15,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white24),
                  ),
                  child: const Icon(Icons.arrow_back,
                      color: Colors.white, size: 20,),
                ),
              ),
            ),
            // Post counter
            Positioned(
              top: MediaQuery.of(context).padding.top + 15,
              right: 15,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${_currentIndex + 1}/${widget.posts!.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Single post mode
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          if (_videoUrl != null && _videoUrl!.isNotEmpty)
            VideoPlayerItem(
              videoUrl: _videoUrl!,
              postData: _postData ?? {},
              isActive: true,
            )
          else
            const Center(
              child: Text(
                'ไม่พบวิดีโอ',
                style: TextStyle(color: Colors.white54),
              ),
            ),
          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 15,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white24),
                ),
                child:
                    const Icon(Icons.arrow_back, color: Colors.white, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
