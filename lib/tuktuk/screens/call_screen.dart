import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/agora_service.dart';

class CallScreen extends StatefulWidget {
  final String channelName;
  final String otherUserName;
  final String? otherUserPhoto;
  final bool isVideoCall;

  const CallScreen({
    super.key,
    required this.channelName,
    required this.otherUserName,
    this.otherUserPhoto,
    this.isVideoCall = true,
  });

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  final _agoraService = AgoraService();
  bool _localUserJoined = false;
  int? _remoteUid;
  bool _muted = false;
  bool _isCameraOff = false;
  int _secondsRemaining = 300;

  @override
  void initState() {
    super.initState();
    _initCall();
  }

  Future<void> _initCall() async {
    final hasPermission = await _agoraService.requestPermissions(context);
    if (!hasPermission) {
      if (mounted) Navigator.pop(context);
      return;
    }

    _agoraService.eventStream.listen((event) {
      if (!mounted) return;
      setState(() {
        switch (event) {
          case 'joined':
            _localUserJoined = true;
            break;
          case 'remote_joined':
            // Logic to get remote uid if needed, usually passed via events
            break;
          case 'remote_left':
            _remoteUid = null;
            break;
          case 'left':
            Navigator.pop(context);
            break;
          case 'timeout':
            _showTimeoutMessage();
            break;
        }
      });
    });

    // Handle remote user join specifically to get the UID
    _agoraService.engine?.registerEventHandler(
      RtcEngineEventHandler(
        onUserJoined: (connection, remoteUid, elapsed) {
          if (mounted) setState(() => _remoteUid = remoteUid);
        },
        onUserOffline: (connection, remoteUid, reason) {
          if (mounted) setState(() => _remoteUid = null);
        },
      ),
    );

    _agoraService.timeRemainingStream.listen((seconds) {
      if (mounted) setState(() => _secondsRemaining = seconds);
    });

    await _agoraService.joinCall(widget.channelName);
  }

  void _showTimeoutMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Call ended: Time limit reached (5 mins)')),
    );
  }

  @override
  void dispose() {
    _agoraService.dispose();
    super.dispose();
  }

  void _onToggleMute() {
    setState(() => _muted = !_muted);
    _agoraService.engine?.muteLocalAudioStream(_muted);
  }

  void _onToggleCamera() {
    setState(() => _isCameraOff = !_isCameraOff);
    _agoraService.engine?.enableLocalVideo(!_isCameraOff);
  }

  void _onSwitchCamera() {
    _agoraService.engine?.switchCamera();
  }

  void _onEndCall() {
    _agoraService.leaveCall();
  }

  String _formatTime(int seconds) {
    final mins = (seconds / 60).floor();
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Remote Video
          _buildRemoteVideo(),

          // Local Video (Overlay)
          _buildLocalVideo(),

          // Top Header (Timer & Name)
          _buildHeader(),

          // Bottom Controls
          _buildControls(),
        ],
      ),
    );
  }

  Widget _buildRemoteVideo() {
    if (_remoteUid != null) {
      return AgoraVideoView(
        controller: VideoViewController.remote(
          rtcEngine: _agoraService.engine!,
          canvas: VideoCanvas(uid: _remoteUid),
          connection: RtcConnection(channelId: widget.channelName),
        ),
      );
    } else {
      return Container(
        color: const Color(0xFF0A0E21),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: Color(0xFF00D2FF)),
              const SizedBox(height: 24),
              Text(
                'Waiting for ${_remoteUid == null ? widget.otherUserName : "Remote User"}...',
                style: GoogleFonts.kanit(color: Colors.white70, fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }
  }

  Widget _buildLocalVideo() {
    if (!_localUserJoined || _isCameraOff) {
      return Positioned(
        top: 60,
        right: 20,
        child: Container(
          width: 100,
          height: 150,
          decoration: BoxDecoration(
            color: Colors.grey[900],
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white24),
          ),
          child: const Icon(Icons.videocam_off_rounded, color: Colors.white24),
        ),
      );
    }

    return Positioned(
      top: 60,
      right: 20,
      child: Container(
        width: 100,
        height: 150,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 10,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: AgoraVideoView(
            controller: VideoViewController(
              rtcEngine: _agoraService.engine!,
              canvas: const VideoCanvas(uid: 0),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Positioned(
      top: 60,
      left: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.otherUserName,
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
              shadows: [const Shadow(blurRadius: 10, color: Colors.black)],
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: _secondsRemaining < 30
                  ? Colors.red.withValues(alpha: 0.6)
                  : Colors.black45,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.timer_outlined,
                  color: _secondsRemaining < 30
                      ? Colors.white
                      : const Color(0xFF00D2FF),
                  size: 14,
                ),
                const SizedBox(width: 6),
                Text(
                  _formatTime(_secondsRemaining),
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControls() {
    return Positioned(
      bottom: 50,
      left: 0,
      right: 0,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildControlButton(
            icon: _muted ? Icons.mic_off_rounded : Icons.mic_rounded,
            color: _muted ? Colors.red : Colors.white12,
            onPressed: _onToggleMute,
          ),
          _buildControlButton(
            icon: Icons.call_end_rounded,
            color: Colors.red,
            size: 70,
            iconSize: 32,
            onPressed: _onEndCall,
          ),
          _buildControlButton(
            icon: _isCameraOff
                ? Icons.videocam_off_rounded
                : Icons.videocam_rounded,
            color: _isCameraOff ? Colors.red : Colors.white12,
            onPressed: _onToggleCamera,
          ),
          _buildControlButton(
            icon: Icons.flip_camera_ios_rounded,
            color: Colors.white12,
            onPressed: _onSwitchCamera,
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
    double size = 56,
    double iconSize = 24,
  }) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border:
            color == Colors.white12 ? Border.all(color: Colors.white24) : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          customBorder: const CircleBorder(),
          child: Icon(icon, color: Colors.white, size: iconSize),
        ),
      ),
    );
  }
}
