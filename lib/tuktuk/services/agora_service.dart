import 'dart:async';

import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';

import 'permission_service.dart';

class AgoraService {
  // ✅ Use your actual Agora App ID from console.agora.io
  static const String appId = "e3070461caf547c097284c8b7e5da187";

  RtcEngine? _engine;
  Timer? _callTimer;
  int _secondsRemaining = 300; // 5 minutes limit (300 seconds)

  final _timeController = StreamController<int>.broadcast();
  Stream<int> get timeRemainingStream => _timeController.stream;

  final _eventController = StreamController<String>.broadcast();
  Stream<String> get eventStream => _eventController.stream;

  Future<bool> requestPermissions(BuildContext context) async {
    return await TukTukPermissionService().requestMediaPermissions(context);
  }

  Future<void> initAgora() async {
    if (_engine != null) return;

    _engine = createAgoraRtcEngine();
    await _engine!.initialize(
      const RtcEngineContext(
        appId: appId,
        channelProfile: ChannelProfileType.channelProfileCommunication,
      ),
    );

    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          debugPrint("Local user ${connection.localUid} joined");
          _eventController.add("joined");
          _startCallTimer();
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          debugPrint("Remote user $remoteUid joined");
          _eventController.add("remote_joined");
        },
        onUserOffline: (
          RtcConnection connection,
          int remoteUid,
          UserOfflineReasonType reason,
        ) {
          debugPrint("Remote user $remoteUid left");
          _eventController.add("remote_left");
        },
        onLeaveChannel: (RtcConnection connection, RtcStats stats) {
          debugPrint("Left channel");
          _eventController.add("left");
          _stopCallTimer();
        },
        onError: (ErrorCodeType err, String msg) {
          debugPrint("Agora Error: $err, $msg");
          _eventController.add("error");
        },
      ),
    );

    await _engine!.enableVideo();
    await _engine!.setClientRole(role: ClientRoleType.clientRoleBroadcaster);
  }

  Future<void> joinCall(String channelName) async {
    if (_engine == null) await initAgora();
    _secondsRemaining = 300;

    await _engine!.joinChannel(
      token:
          "", // Set to empty string if your project doesn't have token enabled for testing
      channelId: channelName,
      uid: 0,
      options: const ChannelMediaOptions(
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
        clientRoleType: ClientRoleType.clientRoleBroadcaster,
      ),
    );
  }

  Future<void> leaveCall() async {
    await _engine?.leaveChannel();
    _stopCallTimer();
  }

  void _startCallTimer() {
    _callTimer?.cancel();
    _timeController.add(_secondsRemaining);

    _callTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        _secondsRemaining--;
        _timeController.add(_secondsRemaining);

        if (_secondsRemaining == 30) {
          _eventController.add("warning_30s");
        }
      } else {
        debugPrint("Time limit reached (5 mins)! Terminating call.");
        _eventController.add("timeout");
        leaveCall();
      }
    });
  }

  void _stopCallTimer() {
    _callTimer?.cancel();
    _callTimer = null;
  }

  RtcEngine? get engine => _engine;

  void dispose() {
    _engine?.release();
    _engine = null;
    _callTimer?.cancel();
    _timeController.close();
    _eventController.close();
  }
}
