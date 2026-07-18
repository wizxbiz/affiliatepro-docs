import 'package:animate_do/animate_do.dart';
import 'package:better_player_plus/better_player_plus.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LivePlayerCard extends StatefulWidget {
  final Map<String, dynamic> liveData;
  final bool isActive;

  const LivePlayerCard({
    super.key,
    required this.liveData,
    required this.isActive,
  });

  @override
  State<LivePlayerCard> createState() => _LivePlayerCardState();
}

class _LivePlayerCardState extends State<LivePlayerCard> {
  BetterPlayerController? _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.isActive) {
      _initPlayer();
      _sendHeartbeat('join');
    }
  }

  @override
  void didUpdateWidget(LivePlayerCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _initPlayer();
      _sendHeartbeat('join');
    } else if (!widget.isActive && oldWidget.isActive) {
      _controller?.pause();
      _sendHeartbeat('leave');
    }
  }

  void _sendHeartbeat(String action) {
    final sessionId = widget.liveData['id'] ?? widget.liveData['sessionId'];
    if (sessionId != null) {
      TukTukBridge().sendLiveHeartbeat(sessionId.toString(), action);
    }
  }

  void _initPlayer() {
    if (_isInitialized) {
      _controller?.play();
      return;
    }

    final String playbackUrl =
        widget.liveData['playbackUrl'] ?? widget.liveData['streamUrl'] ?? '';
    if (playbackUrl.isEmpty) return;

    const config = BetterPlayerConfiguration(
      aspectRatio: 9 / 16,
      fit: BoxFit.cover,
      autoPlay: true,
      looping: true,
      showPlaceholderUntilPlay: true,
      controlsConfiguration: BetterPlayerControlsConfiguration(
        showControls: false,
      ),
    );

    final dataSource = BetterPlayerDataSource(
      BetterPlayerDataSourceType.network,
      playbackUrl,
      liveStream: true,
      bufferingConfiguration: const BetterPlayerBufferingConfiguration(
        minBufferMs: 2000,
        maxBufferMs: 5000,
        bufferForPlaybackMs: 1000,
        bufferForPlaybackAfterRebufferMs: 1500,
      ),
    );

    _controller = BetterPlayerController(config)..setupDataSource(dataSource);
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    if (widget.isActive) {
      _sendHeartbeat('leave');
    }
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String title = widget.liveData['title'] ?? 'LIVE NEWS';
    // broadcaster can be nested map or flat string
    final dynamic bc = widget.liveData['broadcaster'];
    final String broadcaster = (bc is Map ? bc['agencyName'] : null) ??
        widget.liveData['broadcasterName'] ??
        'Official Source';
    final int viewers = widget.liveData['viewerCount'] ?? 0;
    // headlines comes from Go as 'currentHeadlines' or 'headlines'
    final List<dynamic> headlines = widget.liveData['currentHeadlines'] ??
        widget.liveData['headlines'] ??
        [];

    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 🎥 Video Layer
          if (_isInitialized && _controller != null)
            BetterPlayer(controller: _controller!)
          else
            const Center(child: CircularProgressIndicator(color: Colors.red)),

          // 🔴 Live Badge
          Positioned(
            top: 60,
            left: 20,
            child: FadeInLeft(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.red.withValues(alpha: 0.5), blurRadius: 10,),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.circle, color: Colors.white, size: 10),
                    const SizedBox(width: 6),
                    Text(
                      'LIVE',
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 👁️ Viewer Count
          Positioned(
            top: 60,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black45,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Icon(Icons.remove_red_eye_rounded,
                      color: Colors.white, size: 14,),
                  const SizedBox(width: 6),
                  Text(
                    '$viewers',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),

          // 📰 Headline Ticker (The Revolution)
          if (headlines.isNotEmpty)
            Positioned(
              bottom: 120,
              left: 0,
              right: 0,
              child: Container(
                height: 40,
                color: Colors.black54,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: headlines.length,
                  separatorBuilder: (_, __) => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 10),
                    child: VerticalDivider(color: Colors.white24, width: 24),
                  ),
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8,),
                      child: Row(
                        children: [
                          const Icon(Icons.bolt,
                              color: Colors.yellow, size: 18,),
                          const SizedBox(width: 6),
                          Text(
                            headlines[index].toString(),
                            style: GoogleFonts.kanit(
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),

          // 👤 Broadcaster Info
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  broadcaster,
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    shadows: [const Shadow(blurRadius: 10)],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
