import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class VideoThumbnail extends StatefulWidget {
  final String videoUrl;

  const VideoThumbnail({super.key, required this.videoUrl});

  @override
  State<VideoThumbnail> createState() => _VideoThumbnailState();
}

class _VideoThumbnailState extends State<VideoThumbnail> {
  VideoPlayerController? _controller;
  bool _initialized = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  void _initializeVideo() {
    if (widget.videoUrl.isEmpty) return;

    try {
      // Clean URL (remove seek param if present)
      String url = widget.videoUrl;
      if (url.contains('#')) {
        url = url.split('#')[0];
      }

      _controller = VideoPlayerController.networkUrl(Uri.parse(url))
        ..initialize().then((_) {
          if (mounted) {
            // Seek to 0.5 second to capture a frame
            _controller!.seekTo(const Duration(milliseconds: 500));
            _controller!.setVolume(0);
            setState(() {
              _initialized = true;
              _hasError = false;
            });
          }
        }).catchError((e) {
          debugPrint('TukTuk: Error initializing thumbnail video: $e');
          if (mounted) {
            setState(() {
              _hasError = true;
            });
          }
        });
    } catch (e) {
      debugPrint('TukTuk: Exception in thumbnail init: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
        });
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_initialized && _controller != null && !_hasError) {
      return SizedBox.expand(
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: _controller!.value.size.width,
            height: _controller!.value.size.height,
            child: VideoPlayer(_controller!),
          ),
        ),
      );
    }

    return Container(
      color: Colors.black12,
      child: Center(
        child: Icon(
          _hasError ? Icons.video_library_outlined : Icons.play_circle_outline,
          color: Colors.white24,
          size: 30,
        ),
      ),
    );
  }
}
