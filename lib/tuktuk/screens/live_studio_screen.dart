// live_studio_screen.dart — PRODUCTION v2
// ✅ HLS Streaming: 4s video chunks → Firebase Storage → hls.js on Web
// ✅ Real camera beauty filters (BackdropFilter, ColorMatrix)
// ✅ Real session via Go backend + Firestore fallback
// ✅ Viewer count polling + heartbeat
// ✅ Zero mock paths

import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:camera/camera.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

// ─── Filter definition ────────────────────────────────────────────────────────
class _LiveFilter {
  final String id;
  final String name;
  final IconData icon;
  final Color blendColor;
  final double blendOpacity;
  final List<Color>? gradient;
  final List<double>? colorMatrix; // 4×5 RGBA ColorFilter.matrix
  final double softBlurSigma; // Meitu skin-smooth blur strength (0 = no blur)

  // ── Advanced beauty fields ──────────────────────────────────────────────────
  // glowOpacity: 0.0–0.18 — radial luminance glow centred on face area
  //   Simulates the "face light" that beauty cameras project.
  //   Implemented as a RadialGradient overlay (warm/cool depending on filter).
  final double glowOpacity;

  // glowColor: the colour of the glow sphere — warm peach for skin, cool white
  //   for glass-skin look, pink for rosy filters.
  final Color glowColor;

  // redDampen: 0.0–1.0 — reduces the R-channel luma offset proportional to
  //   _beautyLevel. Used for redness / blemish reduction without a full desaturate.
  //   At 1.0 full beauty, it subtracts ≈18 from the R offset → calms red patches.
  final double redDampen;

  const _LiveFilter({
    required this.id,
    required this.name,
    required this.icon,
    this.blendColor = Colors.transparent,
    this.blendOpacity = 0.0,
    this.gradient,
    this.colorMatrix,
    this.softBlurSigma = 0.0,
    this.glowOpacity = 0.0,
    this.glowColor = Colors.transparent,
    this.redDampen = 0.0,
  });
}

// ─── Filter catalogue — Meitu-level beauty ────────────────────────────────────
// Color matrix layout (4×5 row-major):
//   R' = m[0]*R + m[1]*G + m[2]*B + m[3]*A + m[4]   (offset in 0-255 scale)
//   G' = m[5]*R + m[6]*G + m[7]*B + m[8]*A + m[9]
//   B' = m[10]*R+ m[11]*G+ m[12]*B+ m[13]*A+ m[14]
//   A' = m[15]*R+ m[16]*G+ m[17]*B+ m[18]*A+ m[19]
//
// glowOpacity + glowColor: RadialGradient overlay centred on face area — simulates
//   a beauty ring-light / soft-box for instant luminous glass-skin glow.
// redDampen: subtract up to 18 from R offset at max beauty → calms red patches.
const List<_LiveFilter> _kFilters = [
  // ── 0: ธรรมชาติ — no matrix; beauty slider drives warm+blur only ─────────
  _LiveFilter(
    id: 'natural',
    name: 'ธรรมชาติ',
    icon: Icons.circle_outlined,
    softBlurSigma: 0.0,
  ),

  // ── 1: ผิวขาว — Meitu 白皙 Whitening: lifts luma, reduces cool cast ──────
  _LiveFilter(
    id: 'whitening',
    name: 'ผิวขาว',
    icon: Icons.auto_awesome_rounded,
    gradient: [Color(0xFFFFECD2), Color(0xFFFFB3BA)],
    softBlurSigma: 1.4,
    blendColor: Color(0xFFFFF8F0),
    blendOpacity: 0.06,
    glowOpacity: 0.06,
    glowColor: Color(0xFFFFF4E8), // warm ivory glow
    colorMatrix: [
      1.10,
      0.05,
      0.00,
      0,
      18,
      0.00,
      1.05,
      0.00,
      0,
      10,
      0.00,
      -0.02,
      0.95,
      0,
      5,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ── 2: ผิวเนียน — 磨皮柔光 Skin Smooth: max blur + warm glow ─────────────
  //   Enhanced: sigma 2.2→2.8, peach glow added, deeper warm matrix
  _LiveFilter(
    id: 'smooth',
    name: 'ผิวเนียน',
    icon: Icons.face_retouching_natural_rounded,
    gradient: [Color(0xFFFFD1DC), Color(0xFFFFB6C1)],
    softBlurSigma: 2.8, // ↑ from 2.2 — silk-smooth like Meitu磨皮 max
    blendColor: Color(0xFFFFC0CB),
    blendOpacity: 0.07,
    glowOpacity: 0.08,
    glowColor: Color(0xFFFFDDF0), // soft peach-pink ring light
    colorMatrix: [
      // Warm high-key, reduce shadows, porcelain lift
      1.10, 0.06, 0.00, 0, 24,
      0.00, 1.04, 0.02, 0, 14,
      0.00, 0.00, 0.86, 0, 9,
      0.00, 0.00, 0.00, 1, 0,
    ],
  ),

  // ── 3: ญี่ปุ่น — 日系清新 Japanese Fresh: VSCO A-series, airy lifted ──────
  _LiveFilter(
    id: 'japan',
    name: 'ญี่ปุ่น',
    icon: Icons.filter_vintage_rounded,
    gradient: [Color(0xFFE8F4F8), Color(0xFFD4E9E2)],
    softBlurSigma: 0.9,
    blendColor: Color(0xFFE8F8FF),
    blendOpacity: 0.07,
    glowOpacity: 0.04,
    glowColor: Color(0xFFF0FAFF), // cool-white airy glow
    colorMatrix: [
      0.88,
      0.04,
      0.04,
      0,
      28,
      0.02,
      0.90,
      0.02,
      0,
      18,
      0.02,
      0.04,
      0.94,
      0,
      15,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ── 4: โรสกโลว์ — 网红粉调 Pink Influencer: TikTok warm rose ─────────────
  //   Enhanced: pink glow ring, slightly deeper rosy matrix
  _LiveFilter(
    id: 'rosy',
    name: 'โรสกโลว์',
    icon: Icons.favorite_rounded,
    gradient: [Color(0xFFFF7EB3), Color(0xFFFFD6E7)],
    softBlurSigma: 1.6,
    blendColor: Color(0xFFFF69B4),
    blendOpacity: 0.09,
    glowOpacity: 0.09,
    glowColor: Color(0xFFFF9ABF), // hot-pink ring light
    colorMatrix: [
      1.20,
      0.08,
      0.00,
      0,
      15,
      0.00,
      0.92,
      0.04,
      0,
      5,
      0.02,
      0.00,
      0.86,
      0,
      0,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ── 5: กลาสสกิน — 奶油肌 Cream Glass Skin: porcelain + strong centre glow ─
  //   Enhanced: glowOpacity 0→0.12 — the defining "IG glass-skin" light
  _LiveFilter(
    id: 'glass',
    name: 'กลาสสกิน',
    icon: Icons.wb_incandescent_rounded,
    gradient: [Color(0xFFFFFDE7), Color(0xFFFFECB3)],
    softBlurSigma: 1.9,
    blendColor: Color(0xFFFFFFF0),
    blendOpacity: 0.11,
    glowOpacity: 0.12,
    glowColor: Color(0xFFFFFAEE), // warm cream-white glow
    colorMatrix: [
      1.14,
      0.04,
      -0.02,
      0,
      25,
      0.02,
      1.08,
      0.00,
      0,
      18,
      0.00,
      0.00,
      0.90,
      0,
      12,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ── 6: ออร่าทอง — 金色魔幻 Golden Hour: warm cinematic, gold skin ─────────
  _LiveFilter(
    id: 'golden',
    name: 'ออร่าทอง',
    icon: Icons.wb_sunny_rounded,
    gradient: [Color(0xFFFF8C00), Color(0xFFFFD700)],
    softBlurSigma: 0.7,
    blendColor: Color(0xFFFFD700),
    blendOpacity: 0.11,
    glowOpacity: 0.07,
    glowColor: Color(0xFFFFE566), // golden ring light
    colorMatrix: [
      1.25,
      0.08,
      0.00,
      0,
      20,
      0.04,
      1.10,
      0.00,
      0,
      8,
      0.00,
      0.00,
      0.80,
      0,
      0,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ── 7: นีออน — 霓虹夜景 Neon Night: vivid saturation, night stream ─────────
  _LiveFilter(
    id: 'neon',
    name: 'นีออน',
    icon: Icons.nightlife_rounded,
    gradient: [Color(0xFF39FF14), Color(0xFF00BFFF)],
    softBlurSigma: 0.0,
    blendColor: Color(0xFF00FF88),
    blendOpacity: 0.06,
    // no beauty glow — aesthetic filter
    colorMatrix: [
      1.10,
      0.15,
      0.00,
      0,
      -5,
      0.00,
      1.25,
      0.10,
      0,
      -5,
      0.10,
      0.00,
      1.10,
      0,
      -5,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ── 8: ซีนีม่า — 电影质感 Cinema: desaturated warm filmic ──────────────────
  _LiveFilter(
    id: 'cinema',
    name: 'ซีนีม่า',
    icon: Icons.movie_filter_rounded,
    gradient: [Color(0xFF2C2C2C), Color(0xFF6B4226)],
    softBlurSigma: 0.0,
    blendColor: Color(0xFF4B3832),
    blendOpacity: 0.18,
    colorMatrix: [
      0.90,
      0.08,
      0.02,
      0,
      -8,
      0.02,
      0.85,
      0.05,
      0,
      -8,
      0.00,
      0.02,
      0.70,
      0,
      -10,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ── 9: กาแล็คซี่ — 深邃星空 Galaxy: purple-blue cosmic ─────────────────────
  _LiveFilter(
    id: 'galaxy',
    name: 'กาแล็คซี่',
    icon: Icons.blur_circular,
    gradient: [Color(0xFF6A0DAD), Color(0xFF00CED1)],
    softBlurSigma: 0.0,
    blendColor: Color(0xFF6A0DAD),
    blendOpacity: 0.14,
    colorMatrix: [
      0.85,
      0.00,
      0.25,
      0,
      -5,
      0.00,
      0.80,
      0.25,
      0,
      -5,
      0.20,
      0.08,
      1.20,
      0,
      5,
      0.00,
      0.00,
      0.00,
      1,
      0,
    ],
  ),

  // ════════════════════════════════════════════════════════════════════════════
  // ── BEAUTY-FOCUSED FILTERS (10-13) ──────────────────────────────────────────
  // Designed specifically for flawless, smooth face beautification.
  // ════════════════════════════════════════════════════════════════════════════

  // ── 10: ผิวไหม — Silk Skin: maximum smooth + warm ivory + peach ring light ──
  //   Cream-warm matrix + highest blur sigma = velvet skin no app can beat.
  _LiveFilter(
    id: 'silk',
    name: 'ผิวไหม',
    icon: Icons.spa_rounded,
    gradient: [Color(0xFFFFE4CC), Color(0xFFFFC8A0)],
    softBlurSigma: 3.2, // highest sigma in catalogue
    blendColor: Color(0xFFFFEDD8),
    blendOpacity: 0.08,
    glowOpacity: 0.10,
    glowColor: Color(0xFFFFDFBF), // warm peach ring
    colorMatrix: [
      // Creamy ivory: boost warm + lift shadows + neutral-warm mid
      1.10, 0.04, 0.00, 0, 25,
      0.02, 1.06, 0.01, 0, 16,
      0.00, 0.00, 0.88, 0, 10,
      0.00, 0.00, 0.00, 1, 0,
    ],
  ),

  // ── 11: กระจ่างใส — Luminous: high-key bright, glass-skin, skincare-ad look ─
  //   Cool-white glow + brightness lift = the "dewy skin" effect
  _LiveFilter(
    id: 'luminous',
    name: 'กระจ่างใส',
    icon: Icons.light_mode_rounded,
    gradient: [Color(0xFFE8F0FF), Color(0xFFD0E8FF)],
    softBlurSigma: 1.7,
    blendColor: Color(0xFFF8F0FF),
    blendOpacity: 0.06,
    glowOpacity: 0.14, // strongest glow — "dewy" highlight
    glowColor: Color(0xFFF0F4FF), // cool white-lavender glow
    colorMatrix: [
      // Very bright, cool-neutral — skin appears luminous not sallow
      1.08, 0.04, 0.00, 0, 30,
      0.02, 1.08, 0.00, 0, 22,
      0.00, 0.02, 1.00, 0, 18,
      0.00, 0.00, 0.00, 1, 0,
    ],
  ),

  // ── 12: ลบรอย — Flawless: redness reduction + smooth = blemish-free look ───
  //   redDampen reduces R offset → calms acne redness & uneven patches.
  //   Medium blur keeps texture visible but pores/redness fade.
  _LiveFilter(
    id: 'flawless',
    name: 'ลบรอย',
    icon: Icons.healing_rounded,
    gradient: [Color(0xFFFFEEEE), Color(0xFFFFCCCC)],
    softBlurSigma: 2.2,
    blendColor: Color(0xFFFFF0F0),
    blendOpacity: 0.05,
    glowOpacity: 0.06,
    glowColor: Color(0xFFFFF8F0),
    redDampen: 0.45, // moderate redness suppression via R-offset reduction
    colorMatrix: [
      // Reduce R dominance → calm red patches, even skin tone
      0.92, 0.06, 0.02, 0, 12,
      0.02, 1.05, 0.00, 0, 10,
      0.00, 0.03, 1.02, 0, 8,
      0.00, 0.00, 0.00, 1, 0,
    ],
  ),

  // ── 13: ผิวสมบูรณ์แบบ — Perfect: all beauty maximised simultaneously ────────
  //   Top-tier: max blur + max warm lift + strong glow + redness reduction.
  //   The single filter that does everything.
  _LiveFilter(
    id: 'perfect',
    name: 'สมบูรณ์แบบ',
    icon: Icons.auto_fix_high_rounded,
    gradient: [Color(0xFFFFD6CC), Color(0xFFFFB09A)],
    softBlurSigma: 3.0,
    blendColor: Color(0xFFFFECE0),
    blendOpacity: 0.08,
    glowOpacity: 0.11,
    glowColor: Color(0xFFFFE0CC), // warm peach-gold ring
    redDampen: 0.20, // slight redness calm alongside warm matrix
    colorMatrix: [
      // Ultimate beauty: warm, bright, lifted, porcelain
      1.14, 0.06, 0.00, 0, 28,
      0.02, 1.08, 0.02, 0, 18,
      0.00, 0.00, 0.86, 0, 10,
      0.00, 0.00, 0.00, 1, 0,
    ],
  ),
];

// ─── Main screen ──────────────────────────────────────────────────────────────
class LiveStudioScreen extends StatefulWidget {
  const LiveStudioScreen({super.key});

  @override
  State<LiveStudioScreen> createState() => _LiveStudioScreenState();
}

class _LiveStudioScreenState extends State<LiveStudioScreen>
    with TickerProviderStateMixin {
  // ── Camera ──────────────────────────────────────────────────────────────────
  List<CameraDescription> _cameras = [];
  CameraController? _camCtrl;
  bool _cameraReady = false;
  String? _camError;
  int _camIndex = 0;

  // ── Animations ──────────────────────────────────────────────────────────────
  late AnimationController _pulseCtrl;
  late AnimationController _glowCtrl;
  late AnimationController _countdownCtrl;
  late Animation<double> _pulseAnim;
  late Animation<double> _glowAnim;

  // ── Controllers ─────────────────────────────────────────────────────────────
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _tagCtrl = TextEditingController();

  // ── State ────────────────────────────────────────────────────────────────────
  bool _isLive = false;
  bool _isCounting = false;
  int _countdown = 3;
  Timer? _countdownTimer;

  int _selectedFilter = 0;
  int _liveType = 0;

  bool _isMicOn = true;
  bool _isBeautyOn = true;
  bool _showFilters = false;

  double _beautyLevel = 0.6;
  double _brightnessLevel = 0.5;
  double _zoomLevel = 1.0;

  int _viewerCount = 0;
  Timer? _viewerTimer;
  Timer? _heartbeatTimer;
  String? _sessionId; // Go backend session ID
  String? _firestoreSessionId; // Firestore doc ID (fallback)
  DateTime? _liveStartTime;

  // ── HLS Chunk Streaming state ─────────────────────────────────────────────────
  // Flutter records 4-second video chunks → uploads to Firebase Storage
  // → writes playlist.m3u8 → hls.js on web plays it (latency ≈ 8-15s)
  int _hlsChunkIndex = 0;
  final List<String> _hlsChunkUrls = [];
  bool _isHlsStreaming = false;
  bool _isRecordingChunk = false;
  String? _hlsPlaylistUrl; // public download URL of the live playlist.m3u8

  // ── Duration display ─────────────────────────────────────────────────────────
  Timer? _durationTimer;
  Duration _liveDuration = Duration.zero;

  final _firestore = FirebaseFirestore.instance;

  // ── Live type catalogue ──────────────────────────────────────────────────────
  final List<Map<String, dynamic>> _liveTypes = [
    {
      'id': 0,
      'icon': Icons.campaign_rounded,
      'label': 'ข่าวสาร',
      'sub': 'Official',
      'color': const Color(0xFF3B82F6),
      'locked': false,
    },
    {
      'id': 1,
      'icon': Icons.storefront_rounded,
      'label': 'Live Commerce',
      'sub': 'ขายสินค้า',
      'color': const Color(0xFF10B981),
      'locked': false,
    },
    {
      'id': 2,
      'icon': Icons.person_pin_circle_rounded,
      'label': 'ส่วนตัว',
      'sub': 'Personal',
      'color': const Color(0xFFD946EF),
      'locked': false,
    },
  ];

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),);

    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900),)
      ..repeat(reverse: true);
    _glowCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1800),)
      ..repeat(reverse: true);
    _countdownCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800),);

    _pulseAnim = Tween<double>(begin: 1.0, end: 1.15)
        .animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _glowAnim = Tween<double>(begin: 0.3, end: 1.0)
        .animate(CurvedAnimation(parent: _glowCtrl, curve: Curves.easeInOut));

    _initCamera();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _glowCtrl.dispose();
    _countdownCtrl.dispose();
    _countdownTimer?.cancel();
    _viewerTimer?.cancel();
    _heartbeatTimer?.cancel();
    _durationTimer?.cancel();
    _camCtrl?.dispose();
    _titleCtrl.dispose();
    _tagCtrl.dispose();
    super.dispose();
  }

  // ── Camera init ──────────────────────────────────────────────────────────────
  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        setState(() => _camError = 'ไม่พบกล้องในอุปกรณ์นี้');
        return;
      }
      _camIndex = _cameras.length > 1 ? 1 : 0;
      await _startCamera(_camIndex);
    } catch (e) {
      setState(() => _camError = 'เปิดกล้องไม่สำเร็จ: $e');
    }
  }

  Future<void> _startCamera(int index) async {
    final prev = _camCtrl;
    final ctrl = CameraController(
      _cameras[index],
      ResolutionPreset.high,
      enableAudio: _isMicOn,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );
    _camCtrl = ctrl;
    try {
      await ctrl.initialize();
      await prev?.dispose();
      if (!mounted) return;
      setState(() {
        _cameraReady = true;
        _camError = null;
      });
    } catch (e) {
      await ctrl.dispose();
      if (!mounted) return;
      setState(() => _camError = 'กล้องถูกปฏิเสธ: $e');
    }
  }

  Future<void> _flipCamera() async {
    if (_cameras.length < 2) {
      _showSnack('อุปกรณ์มีกล้องเพียงตัวเดียว', Colors.orange);
      return;
    }
    setState(() => _cameraReady = false);
    _camIndex = (_camIndex + 1) % _cameras.length;
    await _startCamera(_camIndex);
    HapticFeedback.lightImpact();
  }

  Future<void> _toggleMic() async {
    setState(() => _isMicOn = !_isMicOn);
    if (_cameraReady) {
      setState(() => _cameraReady = false);
      await _startCamera(_camIndex);
    }
  }

  Future<void> _setZoom(double z) async {
    final ctrl = _camCtrl;
    if (ctrl == null || !ctrl.value.isInitialized) return;
    final min = await ctrl.getMinZoomLevel();
    final max = await ctrl.getMaxZoomLevel();
    final clamped = z.clamp(min, max);
    await ctrl.setZoomLevel(clamped);
    setState(() => _zoomLevel = clamped);
  }

  // ── Start Live ────────────────────────────────────────────────────────────────
  void _startCountdown() {
    if (_titleCtrl.text.trim().isEmpty) {
      _showSnack('⚠️ กรุณาตั้งชื่อ Live ก่อนเริ่ม', Colors.orange);
      return;
    }
    setState(() {
      _isCounting = true;
      _countdown = 3;
    });
    HapticFeedback.heavyImpact();

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) async {
      if (!mounted) {
        t.cancel();
        return;
      }
      _countdownCtrl.forward(from: 0);
      HapticFeedback.lightImpact();

      if (_countdown == 1) {
        t.cancel();
        await _launchLiveSession();
      } else {
        setState(() => _countdown--);
      }
    });
  }

  Future<void> _launchLiveSession() async {
    final session = TukTukBridge().currentSession;
    final uid = session?['uid'] ?? 'guest';
    final displayName = session?['displayName'] ?? 'TukTuk Streamer';
    final pictureUrl = session?['pictureUrl'] ?? '';
    final title = _titleCtrl.text.trim();
    final type = _liveTypes[_liveType]['label'] as String;
    final tags = _tagCtrl.text.trim();

    final sessionData = {
      'title': title,
      'type': type,
      'tags': tags,
      'authorId': uid,
      'authorName': displayName,
      'authorPic': pictureUrl,
    };

    // 1. Try Go backend first
    String? sid;
    try {
      sid = await TukTukBridge().startLiveSession(sessionData);
    } catch (e) {
      debugPrint('Go backend startLive error: $e');
    }

    // 2. Always write to Firestore (source of truth + fallback)
    String fsDocId;
    try {
      final docRef = await _firestore.collection('live_sessions').add({
        'title': title,
        'type': type,
        'tags': tags,
        'authorId': uid,
        'authorName': displayName,
        'authorPic': pictureUrl,
        'status': 'live',
        'viewerCount': 0,
        'goSessionId': sid, // may be null if Go offline
        'startedAt': FieldValue.serverTimestamp(),
      });
      fsDocId = docRef.id;
    } catch (e) {
      debugPrint('Firestore live session create error: $e');
      // Fallback local ID so UI doesn't break
      fsDocId = 'local_${DateTime.now().millisecondsSinceEpoch}';
    }

    if (!mounted) return;
    _liveStartTime = DateTime.now();
    setState(() {
      _isCounting = false;
      _isLive = true;
      _viewerCount = 0;
      _sessionId = sid;
      _firestoreSessionId = fsDocId;
      _liveDuration = Duration.zero;
    });

    _startDurationTimer();
    _startViewerPolling();
    _startHeartbeat();

    // 3. Start HLS chunk streaming to Firebase Storage
    //    Web viewers discover the stream via Firestore hlsUrl field.
    _startHlsStreaming(fsDocId);

    HapticFeedback.heavyImpact();
    _showSnack(
      sid != null
          ? '🔴 Live! กำลัง stream ขึ้นเว็บ...'
          : '🔴 Live! (Firestore mode)',
      const Color(0xFF10B981),
    );
  }

  // ── Stop Live ─────────────────────────────────────────────────────────────────
  void _stopLive() {
    showDialog(context: context, builder: _endDialog);
  }

  Future<void> _endLiveSession() async {
    _viewerTimer?.cancel();
    _heartbeatTimer?.cancel();
    _durationTimer?.cancel();

    // End on Go backend
    final sid = _sessionId;
    if (sid != null) {
      try {
        await TukTukBridge().endLiveSession(sid);
      } catch (e) {
        debugPrint('Go endLiveSession error: $e');
      }
    }

    // Stop HLS streaming and write EXT-X-ENDLIST to m3u8
    final fsId = _firestoreSessionId;
    await _stopHlsStreaming(fsId ?? 'unknown');

    // Update Firestore record
    if (fsId != null && !fsId.startsWith('local_')) {
      try {
        await _firestore.collection('live_sessions').doc(fsId).update({
          'status': 'ended',
          'endedAt': FieldValue.serverTimestamp(),
          'durationSeconds': _liveDuration.inSeconds,
          'finalViewerCount': _viewerCount,
        });
      } catch (e) {
        debugPrint('Firestore endLive update error: $e');
      }
    }

    if (!mounted) return;
    setState(() {
      _isLive = false;
      _viewerCount = 0;
      _sessionId = null;
      _firestoreSessionId = null;
      _liveDuration = Duration.zero;
    });
    _showSnack('✅ จบไลฟ์แล้ว ขอบคุณที่ใช้ TukTuk Live', Colors.green);
  }

  // ── HLS Chunk Streaming ───────────────────────────────────────────────────────
  // Strategy: record 4s video clip → upload MP4 to Firebase Storage →
  // regenerate playlist.m3u8 → hls.js on web plays a sliding window of 8 chunks.

  void _startHlsStreaming(String sessionId) {
    if (_isHlsStreaming) return;
    _isHlsStreaming = true;
    _hlsChunkIndex = 0;
    _hlsChunkUrls.clear();
    _isRecordingChunk = false;
    _hlsPlaylistUrl = null;
    // Give the camera a moment to settle before recording starts
    Future.delayed(
        const Duration(milliseconds: 600), () => _captureNextChunk(sessionId),);
  }

  Future<void> _captureNextChunk(String sessionId) async {
    if (!_isHlsStreaming || !mounted) return;
    if (_isRecordingChunk) return; // guard against overlap
    final ctrl = _camCtrl;
    if (ctrl == null || !ctrl.value.isInitialized) {
      await Future.delayed(const Duration(seconds: 1));
      _captureNextChunk(sessionId);
      return;
    }
    _isRecordingChunk = true;
    try {
      await ctrl.startVideoRecording();
      await Future.delayed(const Duration(seconds: 4));
      if (!_isHlsStreaming || !mounted) {
        try {
          await ctrl.stopVideoRecording();
        } catch (_) {}
        _isRecordingChunk = false;
        return;
      }
      final xfile = await ctrl.stopVideoRecording();
      _isRecordingChunk = false;
      // Upload in background; start the next chunk immediately.
      debugPrint(
          '✅ HLS [Record] Chunk $_hlsChunkIndex captured: ${xfile.path}',);
      _uploadChunkAndContinue(sessionId, xfile);
    } catch (e) {
      _isRecordingChunk = false;
      debugPrint('❌ HLS [Record] Error: $e');
      await Future.delayed(const Duration(seconds: 2));
      if (_isHlsStreaming && mounted) _captureNextChunk(sessionId);
    }
  }

  /// Uploads a recorded chunk, updates the m3u8 playlist, then queues the next chunk.
  Future<void> _uploadChunkAndContinue(String sessionId, XFile xfile) async {
    // Start capturing the next chunk in parallel with this upload
    _captureNextChunk(sessionId);

    final chunkName = 'chunk_${_hlsChunkIndex.toString().padLeft(6, '0')}.mp4';
    debugPrint('🚀 HLS [Upload] Starting upload: $chunkName');
    final ref = FirebaseStorage.instance.ref('live/$sessionId/$chunkName');
    try {
      await ref.putFile(
        File(xfile.path),
        SettableMetadata(
          contentType: 'video/mp4',
          cacheControl: 'public, max-age=3600',
        ),
      );
      final url = await ref.getDownloadURL();
      debugPrint('✅ HLS [Upload] Success: $chunkName -> $url');

      _hlsChunkUrls.add(url);
      _hlsChunkIndex++;

      // Sliding window: keep last 8 chunks (≈32 seconds of buffer)
      while (_hlsChunkUrls.length > 8) {
        _hlsChunkUrls.removeAt(0);
      }

      await _publishM3u8Playlist(sessionId);

      // Cleanup old chunks to save storage (keep chunk window + 3 safety margin)
      if (_hlsChunkIndex > 12) {
        final oldName =
            'chunk_${(_hlsChunkIndex - 12).toString().padLeft(6, '0')}.mp4';
        try {
          await FirebaseStorage.instance
              .ref('live/$sessionId/$oldName')
              .delete();
          debugPrint('🗑️ HLS [Cleanup] Deleted old chunk: $oldName');
        } catch (_) {}
      }
    } catch (e) {
      debugPrint('❌ HLS [Upload] Error uploading $chunkName: $e');
    }
  }

  /// Generates and uploads the HLS .m3u8 playlist file so web viewers
  /// can play via hls.js. Also updates Firestore with the public URL on first write.
  Future<void> _publishM3u8Playlist(String sessionId,
      {bool isEnd = false,}) async {
    if (_hlsChunkUrls.isEmpty) return;
    final startSeq = _hlsChunkIndex - _hlsChunkUrls.length;
    final buf = StringBuffer()
      ..writeln('#EXTM3U')
      ..writeln('#EXT-X-VERSION:3')
      ..writeln('#EXT-X-TARGETDURATION:5')
      ..writeln('#EXT-X-MEDIA-SEQUENCE:$startSeq')
      ..writeln('#EXT-X-ALLOW-CACHE:NO');
    for (final url in _hlsChunkUrls) {
      buf
        ..writeln('#EXTINF:4.0,')
        ..writeln(url);
    }
    if (isEnd) buf.writeln('#EXT-X-ENDLIST');

    final bytes = Uint8List.fromList(buf.toString().codeUnits);
    final playlistRef =
        FirebaseStorage.instance.ref('live/$sessionId/playlist.m3u8');
    try {
      await playlistRef.putData(
        bytes,
        SettableMetadata(
          contentType: 'application/x-mpegURL',
          cacheControl: 'no-cache, no-store, must-revalidate',
        ),
      );
      // First time: save the public URL and update Firestore
      if (_hlsPlaylistUrl == null && !isEnd) {
        _hlsPlaylistUrl = await playlistRef.getDownloadURL();
        final fsId = _firestoreSessionId;
        if (fsId != null && !fsId.startsWith('local_')) {
          try {
            await _firestore.collection('live_sessions').doc(fsId).update({
              'hlsUrl': _hlsPlaylistUrl,
              'isStreamReady': true,
            });
          } catch (_) {}
        }
      }
    } catch (e) {
      debugPrint('HLS playlist publish error: $e');
    }
  }

  Future<void> _stopHlsStreaming(String sessionId) async {
    _isHlsStreaming = false;
    // Stop any ongoing recording
    final ctrl = _camCtrl;
    if (ctrl != null && ctrl.value.isRecordingVideo) {
      try {
        await ctrl.stopVideoRecording();
      } catch (_) {}
    }
    // Write EXT-X-ENDLIST so web player knows stream is over
    await _publishM3u8Playlist(sessionId, isEnd: true);
    // Update Firestore
    final fsId = _firestoreSessionId;
    if (fsId != null && !fsId.startsWith('local_')) {
      try {
        await _firestore.collection('live_sessions').doc(fsId).update({
          'isStreamReady': false,
          'hlsEnded': true,
        });
      } catch (_) {}
    }
    _hlsPlaylistUrl = null;
    _hlsChunkUrls.clear();
    _hlsChunkIndex = 0;
  }

  // ── Viewer polling (Go + Firestore fallback) ─────────────────────────────────
  void _startViewerPolling() {
    _viewerTimer = Timer.periodic(const Duration(seconds: 8), (t) async {
      if (!mounted || !_isLive) {
        t.cancel();
        return;
      }

      int? count;

      // Try Go backend
      final sid = _sessionId;
      if (sid != null) {
        try {
          final status = await TukTukBridge().getLiveSessionStatus(sid);
          if (status != null) {
            count = status['viewerCount'] as int?;
            if (status['status'] == 'ended') {
              t.cancel();
              if (mounted) {
                setState(() {
                  _isLive = false;
                  _viewerTimer?.cancel();
                });
              }
              return;
            }
          }
        } catch (e) {
          debugPrint('Viewer poll Go error: $e');
        }
      }

      // Fallback: read from Firestore live_sessions doc
      if (count == null) {
        final fsId = _firestoreSessionId;
        if (fsId != null && !fsId.startsWith('local_')) {
          try {
            final doc =
                await _firestore.collection('live_sessions').doc(fsId).get();
            if (doc.exists) {
              count = doc.data()?['viewerCount'] as int?;
            }
          } catch (e) {
            debugPrint('Viewer poll Firestore error: $e');
          }
        }
      }

      if (count != null && mounted) {
        setState(() => _viewerCount = count!);
      }
    });
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────────
  void _startHeartbeat() {
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (t) async {
      if (!mounted || !_isLive) {
        t.cancel();
        return;
      }

      final sid = _sessionId;
      if (sid != null) {
        try {
          await TukTukBridge().sendLiveHeartbeat(sid, 'streaming');
        } catch (e) {
          debugPrint('Heartbeat error: $e');
        }
      }

      // Also update Firestore keepalive timestamp
      final fsId = _firestoreSessionId;
      if (fsId != null && !fsId.startsWith('local_')) {
        try {
          await _firestore.collection('live_sessions').doc(fsId).update({
            'lastHeartbeat': FieldValue.serverTimestamp(),
          });
        } catch (_) {}
      }
    });
  }

  // ── Duration Timer ────────────────────────────────────────────────────────────
  void _startDurationTimer() {
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || !_isLive) return;
      setState(
          () => _liveDuration = DateTime.now().difference(_liveStartTime!),);
    });
  }

  String get _durationStr {
    final h = _liveDuration.inHours;
    final m = _liveDuration.inMinutes % 60;
    final s = _liveDuration.inSeconds % 60;
    if (h > 0) {
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  // ── Share Live ────────────────────────────────────────────────────────────────
  Future<void> _shareLive() async {
    final title = _titleCtrl.text.isNotEmpty ? _titleCtrl.text : 'TukTuk Live';
    final fsId = _firestoreSessionId;
    final sid = _sessionId;

    // Build deep link — prefer sessionId or Firestore doc id
    final liveId = sid ?? fsId ?? 'unknown';
    final link = 'https://tuktukfeed.com/live/$liveId';
    final shareText = '🔴 ดู Live "$title" ได้เลย!\n$link\n#TukTukLive #tuktuk';

    try {
      await Share.share(shareText, subject: '🔴 $title กำลัง Live อยู่!');
    } catch (e) {
      // Fallback: copy to clipboard
      await Clipboard.setData(ClipboardData(text: link));
      _showSnack('📋 คัดลอกลิงก์ Live แล้ว!', Colors.blue);
    }
  }

  void _showSnack(String msg, Color c) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold)),
      backgroundColor: c,
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),);
  }

  // ── Meitu-level Beauty ColorFilter matrix ────────────────────────────────────
  // Combines (in order):
  //  1. Base filter color matrix from selected _LiveFilter
  //  2. Brightness offset (user slider, ±30 luma units)
  //  3. Skin-warmth channel weighting: R boost, G mid-lift, B reduce → warmer skintone
  //  4. Highlight luma lift: raises pixel brightness in proportion to beauty slider
  //     (simulates Meitu's skin-highlight enhance)
  //  5. redDampen: filter-specific redness suppression — subtracts up to 18 from
  //     the R-channel offset at full beauty level, calming acne/redness patches
  //     without desaturating the whole image.
  List<double> _buildMatrix() {
    final filter = _kFilters[_selectedFilter];
    final base = filter.colorMatrix;

    // brightness: slider 0→1 maps to -30…+30 offset (255-scale col offset)
    final bright = (_brightnessLevel - 0.5) * 60;

    // beauty strength 0→1
    final bv = _isBeautyOn ? _beautyLevel : 0.0;

    // Skin-tone warm channel weights (Meitu whitening science):
    //   R: boost warm highlights
    //   G: slight lift for natural look
    //   B: reduce slightly → skin looks warmer/less sallow
    final skinWarmR = bv * 0.12; // +R warm
    final skinLiftG = bv * 0.06; // +G neutral
    final skinCoolB = bv * -0.08; // -B cool reduction
    final lumaLift = bv * 20.0; // luma offset (porcelain brightening)

    // redDampen: subtracts from R offset → calms red patches / blemishes.
    // Effect scales with both the filter's redDampen spec and beauty level.
    // Max reduction = 18 units (≈7% R channel at full beauty).
    final redSuppressR = bv * filter.redDampen * 18.0;

    if (base == null) {
      return [
        1.0 + skinWarmR,
        0.0,
        0.0,
        0,
        bright + lumaLift - redSuppressR,
        0.0,
        1.0 + skinLiftG,
        0.0,
        0,
        bright * 0.85 + lumaLift * 0.7,
        0.0,
        0.0,
        1.0 + skinCoolB,
        0,
        bright * 0.70 + lumaLift * 0.5,
        0.0,
        0.0,
        0.0,
        1,
        0,
      ];
    }

    // Compose: beauty offsets added on top of filter base matrix
    return [
      base[0] + skinWarmR,
      base[1],
      base[2],
      base[3],
      base[4] + bright + lumaLift - redSuppressR, // ← redness reduction on R
      base[5],
      base[6] + skinLiftG,
      base[7],
      base[8],
      base[9] + bright * 0.85 + lumaLift * 0.7,
      base[10],
      base[11],
      base[12] + skinCoolB,
      base[13],
      base[14] + bright * 0.70 + lumaLift * 0.5,
      base[15],
      base[16],
      base[17],
      base[18],
      base[19],
    ];
  }

  // ── Meitu-level blur amount for current filter + beauty slider ───────────────
  // Combines the filter's built-in softBlurSigma with the beauty slider.
  // Gives the user intuitive control: beauty slider ↑ = smoother skin.
  double get _effectiveBlurSigma {
    if (!_isBeautyOn) return 0.0;
    final filterBase = _kFilters[_selectedFilter].softBlurSigma;
    // beauty slider adds extra blur on top: max extra = 1.5 sigma
    final sliderExtra = _beautyLevel * 1.5;
    return (filterBase + sliderExtra).clamp(0.0, 4.0);
  }

  // ── Build ────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          _buildCameraLayer(),
          if (_isLive) _buildLiveHUD() else _buildSetupOverlay(),
          if (_isCounting) _buildCountdown(),
        ],
      ),
    );
  }

  // ─── Camera Layer — Meitu multi-layer stack ──────────────────────────────
  Widget _buildCameraLayer() {
    if (_camError != null) return _buildCameraError();
    if (!_cameraReady || _camCtrl == null) return _buildCameraLoading();

    final matrix = _buildMatrix();
    final blendFilter = _kFilters[_selectedFilter];
    final blurSigma = _effectiveBlurSigma;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Layer 1: SINGLE camera stream with color-graded matrix
        // ⚠️ DO NOT add a second CameraPreview here — ImageReader has maxImages=6
        //    and two CameraPreview widgets will exhaust buffers → FATAL crash.
        ColorFiltered(
          colorFilter: ColorFilter.matrix(matrix),
          child: CameraPreview(_camCtrl!),
        ),

        // Layer 2: Meitu 磨皮 Soft-Skin Blur
        // BackdropFilter blurs composited pixels of Layer 1 (single camera stream).
        // ⚠️ Child MUST be Colors.transparent — DO NOT use withOpacity() on transparent:
        //    Colors.transparent.withValues(alpha: x) = Color(0xNN000000) = BLACK overlay!
        //    That would progressively darken the camera as beauty slider increases.
        if (blurSigma > 0.1)
          Positioned.fill(
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(
                  sigmaX: blurSigma,
                  sigmaY: blurSigma,
                  tileMode: TileMode.clamp,
                ),
                // Pure transparent — blur only, no color distortion
                child: const SizedBox.expand(),
              ),
            ),
          ),

        // Layer 2.5: Face-centre luminance glow (glass skin / beauty ring light)
        // ─────────────────────────────────────────────────────────────────────
        // A RadialGradient sphere centred at Alignment(0, -0.13) — the upper-
        // centre where a face typically sits in a selfie frame.  Fades to fully
        // transparent at radius ≈ 0.72 × screen width so background is unaffected.
        //
        // Scales with _isBeautyOn and _beautyLevel so the user's beauty slider
        // also controls glow intensity (glow = 0 when beauty is OFF or at 0).
        //
        // Why a plain gradient instead of BlendMode.screen?
        //   CameraPreview renders into a Flutter hardware Texture widget — it is
        //   composited in a separate GPU layer.  CustomPaint with BlendMode.screen
        //   blends against that opaque layer, not the camera pixels.  A warm
        //   semi-transparent overlay at Normal blend achieves the same "lifted
        //   highlights" effect that beauty apps produce with their ring-lights,
        //   without the compositing artefacts.
        if (blendFilter.glowOpacity > 0.005 && _isBeautyOn)
          Positioned.fill(
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    // Slightly above centre — aligns with face in typical selfie
                    center: const Alignment(0.0, -0.13),
                    radius: 0.72,
                    colors: [
                      blendFilter.glowColor.withValues(alpha: 
                        (blendFilter.glowOpacity * _beautyLevel * 1.15)
                            .clamp(0.0, 0.20),
                      ),
                      blendFilter.glowColor.withValues(alpha: 0.0),
                    ],
                    stops: const [0.0, 1.0],
                  ),
                ),
              ),
            ),
          ),

        // Layer 3: Filter colour blend overlay (tinted glow e.g. Rosy, Glass Skin)
        if (blendFilter.blendOpacity > 0)
          Container(
              color:
                  blendFilter.blendColor.withValues(alpha: blendFilter.blendOpacity),),

        // Layer 4: Vignette edge darkening (cinematic depth)
        _buildVignette(),
      ],
    );
  }

  Widget _buildVignette() {
    return IgnorePointer(
      child: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.center,
            radius: 1.1,
            colors: [Colors.transparent, Colors.black.withValues(alpha: 0.35)],
            stops: const [0.6, 1.0],
          ),
        ),
      ),
    );
  }

  Widget _buildCameraLoading() {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
                color: Color(0xFFEF4444), strokeWidth: 2,),
            const SizedBox(height: 16),
            Text('เปิดกล้อง...',
                style: GoogleFonts.kanit(color: Colors.white70, fontSize: 16),),
          ],
        ),
      ),
    );
  }

  Widget _buildCameraError() {
    return Container(
      color: const Color(0xFF0D0014),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.videocam_off_rounded,
                  color: Colors.redAccent, size: 60,),
              const SizedBox(height: 16),
              Text(_camError ?? 'เกิดข้อผิดพลาด',
                  textAlign: TextAlign.center,
                  style:
                      GoogleFonts.kanit(color: Colors.white70, fontSize: 15),),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _initCamera,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('ลองอีกครั้ง'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Setup Overlay ────────────────────────────────────────────────────────
  Widget _buildSetupOverlay() {
    return Column(
      children: [
        _buildTopBar(),
        Expanded(
          child: GestureDetector(
            onScaleUpdate: (d) =>
                _setZoom((_zoomLevel * d.scale).clamp(1.0, 8.0)),
            child: const SizedBox.expand(),
          ),
        ),
        _buildBottomSetup(),
      ],
    );
  }

  Widget _buildTopBar() {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            _glassBtn(
                Icons.arrow_back_ios_new_rounded, () => Navigator.pop(context),),
            const Spacer(),
            GestureDetector(
              onTap: () => setState(() => _showFilters = !_showFilters),
              child: _glassPill(Icons.filter_b_and_w_rounded, 'ฟิลเตอร์',
                  _showFilters ? Colors.amber : Colors.white,),
            ),
            const SizedBox(width: 10),
            _glassBtn(Icons.flip_camera_ios_rounded, _flipCamera),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomSetup() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withValues(alpha: 0.88),
            Colors.black.withValues(alpha: 0.0),
          ],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedSize(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            child: _showFilters ? _buildFilterStrip() : const SizedBox.shrink(),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLiveTypeRow(),
                const SizedBox(height: 12),
                _buildTitleInput(),
                const SizedBox(height: 8),
                _buildTagInput(),
                const SizedBox(height: 12),
                _buildBeautyRow(),
                const SizedBox(height: 14),
                _buildGoLiveButton(),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildFilterStrip() {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _kFilters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final f = _kFilters[i];
          final sel = _selectedFilter == i;
          return GestureDetector(
            onTap: () {
              setState(() => _selectedFilter = i);
              HapticFeedback.selectionClick();
            },
            child: Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: f.gradient != null
                        ? LinearGradient(
                            colors: f.gradient!,
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,)
                        : null,
                    color: f.gradient == null
                        ? Colors.white.withValues(alpha: 0.1)
                        : null,
                    border: Border.all(
                      color:
                          sel ? Colors.white : Colors.white.withValues(alpha: 0.25),
                      width: sel ? 2.5 : 1,
                    ),
                    boxShadow: sel
                        ? [
                            BoxShadow(
                                color: (f.gradient?.first ?? Colors.white)
                                    .withValues(alpha: 0.6),
                                blurRadius: 14,),
                          ]
                        : null,
                  ),
                  child: Icon(f.icon, color: Colors.white, size: 22),
                ),
                const SizedBox(height: 4),
                Text(f.name,
                    style: TextStyle(
                        color: sel ? Colors.white : Colors.white54,
                        fontSize: 9,
                        fontWeight: sel ? FontWeight.bold : FontWeight.normal,),),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildLiveTypeRow() {
    return Row(
      children: _liveTypes.map((t) {
        final sel = _liveType == t['id'];
        final color = t['color'] as Color;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _liveType = t['id']),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: sel
                    ? color.withValues(alpha: 0.25)
                    : Colors.white.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: sel ? color : Colors.white.withValues(alpha: 0.15),
                    width: sel ? 1.5 : 1,),
              ),
              child: Column(
                children: [
                  Icon(t['icon'] as IconData,
                      color: sel ? color : Colors.white38, size: 22,),
                  const SizedBox(height: 4),
                  Text(t['label'] as String,
                      style: TextStyle(
                          color: sel ? Colors.white : Colors.white38,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,),),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTitleInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: TextField(
        controller: _titleCtrl,
        maxLength: 60,
        style: const TextStyle(color: Colors.white, fontSize: 15),
        decoration: InputDecoration(
          hintText: 'ชื่อรายการ Live ของคุณ...',
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.35)),
          prefixIcon:
              const Icon(Icons.title_rounded, color: Colors.purple, size: 20),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          counterStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
        ),
      ),
    );
  }

  Widget _buildTagInput() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: TextField(
        controller: _tagCtrl,
        style: const TextStyle(color: Colors.white, fontSize: 13),
        decoration: InputDecoration(
          hintText: '#tuktuk #ข่าวด่วน',
          hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
          prefixIcon:
              const Icon(Icons.tag_rounded, color: Colors.cyan, size: 18),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      ),
    );
  }

  Widget _buildBeautyRow() {
    return Row(
      children: [
        GestureDetector(
          onTap: () => setState(() => _isBeautyOn = !_isBeautyOn),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: _isBeautyOn
                  ? Colors.pinkAccent.withValues(alpha: 0.25)
                  : Colors.white.withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: _isBeautyOn
                      ? Colors.pinkAccent
                      : Colors.white.withValues(alpha: 0.2),),
            ),
            child: Row(children: [
              Icon(Icons.face_retouching_natural_rounded,
                  color: _isBeautyOn ? Colors.pinkAccent : Colors.white38,
                  size: 18,),
              const SizedBox(width: 6),
              Text('Beauty',
                  style: TextStyle(
                      color: _isBeautyOn ? Colors.white : Colors.white38,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,),),
            ],),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                thumbColor: _isBeautyOn ? Colors.pinkAccent : Colors.amber,
                activeTrackColor:
                    _isBeautyOn ? Colors.pinkAccent : Colors.amber,
                inactiveTrackColor:
                    (_isBeautyOn ? Colors.pinkAccent : Colors.amber)
                        .withValues(alpha: 0.2),
                trackHeight: 3,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
              ),
              child: Slider(
                value: _isBeautyOn ? _beautyLevel : _brightnessLevel,
                onChanged: (v) => setState(() {
                  if (_isBeautyOn) {
                    _beautyLevel = v;
                  } else {
                    _brightnessLevel = v;
                  }
                }),
              ),
            ),
          ),
        ),
        Icon(_isBeautyOn ? Icons.auto_fix_high_rounded : Icons.wb_sunny_rounded,
            color: _isBeautyOn ? Colors.pinkAccent : Colors.amber, size: 18,),
      ],
    );
  }

  Widget _buildGoLiveButton() {
    return AnimatedBuilder(
      animation: _glowAnim,
      builder: (_, __) => GestureDetector(
        onTap: _startCountdown,
        child: Container(
          width: double.infinity,
          height: 56,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
                colors: [Color(0xFFEF4444), Color(0xFFDC2626)],),
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFEF4444)
                    .withValues(alpha: 0.3 + 0.3 * _glowAnim.value),
                blurRadius: 22 + 10 * _glowAnim.value,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ScaleTransition(
                  scale: _pulseAnim,
                  child: const Icon(Icons.sensors_rounded,
                      color: Colors.white, size: 26,),),
              const SizedBox(width: 10),
              Text('เริ่ม LIVE',
                  style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,),),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Countdown ────────────────────────────────────────────────────────────
  Widget _buildCountdown() {
    return Container(
      color: Colors.black.withValues(alpha: 0.65),
      child: Center(
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.3, end: 1.0).animate(CurvedAnimation(
              parent: _countdownCtrl, curve: Curves.elasticOut,),),
          child: Text('$_countdown',
              style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 130,
                  fontWeight: FontWeight.w900,
                  shadows: [
                    Shadow(
                        color: Colors.redAccent.withValues(alpha: 0.9),
                        blurRadius: 40,),
                  ],),),
        ),
      ),
    );
  }

  // ─── Live HUD ─────────────────────────────────────────────────────────────
  Widget _buildLiveHUD() {
    return SafeArea(
      child: Stack(
        children: [
          // Pinch-to-zoom
          Positioned.fill(
              child: GestureDetector(
            behavior: HitTestBehavior.translucent,
            onScaleUpdate: (d) =>
                _setZoom((_zoomLevel * d.scale).clamp(1.0, 8.0)),
            child: const ColoredBox(color: Colors.transparent),
          ),),
          Positioned(top: 0, left: 0, right: 0, child: _buildLiveTopBar()),
          Positioned(
              right: 12,
              top: MediaQuery.of(context).size.height * 0.18,
              child: _buildSideFilters(),),
          Positioned(
              bottom: 0, left: 0, right: 0, child: _buildLiveBottomBar(),),
        ],
      ),
    );
  }

  Widget _buildLiveTopBar() {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.black.withValues(alpha: 0.6), Colors.transparent],
            ),
          ),
          child: Row(
            children: [
              // LIVE badge
              AnimatedBuilder(
                animation: _pulseAnim,
                builder: (_, __) => Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.redAccent,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.redAccent
                              .withValues(alpha: _pulseAnim.value * 0.7),
                          blurRadius: 14,),
                    ],
                  ),
                  child: const Row(children: [
                    Icon(Icons.circle, color: Colors.white, size: 8),
                    SizedBox(width: 5),
                    Text('LIVE',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,),),
                  ],),
                ),
              ),
              const SizedBox(width: 8),
              // Duration
              _glassPill(Icons.timer_outlined, _durationStr, Colors.white),
              const SizedBox(width: 8),
              // Viewer count
              _glassPill(
                  Icons.remove_red_eye_rounded, '$_viewerCount', Colors.white,),
              const Spacer(),
              // End live
              GestureDetector(
                onTap: _stopLive,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                  ),
                  child: const Row(children: [
                    Icon(Icons.stop_circle_outlined,
                        color: Colors.white, size: 16,),
                    SizedBox(width: 4),
                    Text('จบไลฟ์',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,),),
                  ],),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSideFilters() {
    return Column(
      children: List.generate(_kFilters.length, (i) {
        final f = _kFilters[i];
        final sel = _selectedFilter == i;
        return GestureDetector(
          onTap: () {
            setState(() => _selectedFilter = i);
            HapticFeedback.selectionClick();
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            margin: const EdgeInsets.only(bottom: 8),
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              gradient: f.gradient != null
                  ? LinearGradient(
                      colors: f.gradient!,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,)
                  : null,
              color: f.gradient == null ? Colors.black.withValues(alpha: 0.5) : null,
              borderRadius: BorderRadius.circular(13),
              border: Border.all(
                  color: sel ? Colors.white : Colors.white.withValues(alpha: 0.3),
                  width: sel ? 2.5 : 1,),
              boxShadow: sel
                  ? [
                      BoxShadow(
                          color: (f.gradient?.first ?? Colors.white)
                              .withValues(alpha: 0.5),
                          blurRadius: 10,),
                    ]
                  : null,
            ),
            child: Icon(f.icon, color: Colors.white, size: 20),
          ),
        );
      }),
    );
  }

  Widget _buildLiveBottomBar() {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 34),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
              colors: [Colors.black.withValues(alpha: 0.8), Colors.transparent],
            ),
          ),
          child: Column(
            children: [
              Text(
                _titleCtrl.text.isEmpty ? 'TukTuk Live' : _titleCtrl.text,
                style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _liveCtrlBtn(
                      _isMicOn ? Icons.mic_rounded : Icons.mic_off_rounded,
                      _isMicOn ? 'ไมค์เปิด' : 'ไมค์ปิด',
                      _isMicOn ? Colors.white : Colors.redAccent,
                      _toggleMic,),
                  _liveCtrlBtn(Icons.flip_camera_ios_rounded, 'สลับกล้อง',
                      Colors.white, _flipCamera,),
                  _liveCtrlBtn(
                      Icons.filter_b_and_w_rounded,
                      'ฟิลเตอร์',
                      Colors.amber,
                      () => setState(() => _showFilters = !_showFilters),),
                  _liveCtrlBtn(
                      Icons.share_rounded, 'แชร์', Colors.blue, _shareLive,),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _liveCtrlBtn(
      IconData icon, String label, Color color, VoidCallback onTap,) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(label,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.7),
                  fontSize: 10,
                  fontWeight: FontWeight.w600,),),
        ],
      ),
    );
  }

  // ─── End Dialog ───────────────────────────────────────────────────────────
  Widget _endDialog(BuildContext ctx) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
      child: Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: const Color(0xFF1A0D2E),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.stop_circle_rounded,
                  color: Colors.redAccent, size: 50,),
              const SizedBox(height: 14),
              const Text('จบการไลฟ์?',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,),),
              const SizedBox(height: 8),
              Text(
                'ผู้ชม $_viewerCount คน · เวลา $_durationStr',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.65)),
              ),
              const SizedBox(height: 26),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),),
                      ),
                      child: const Text('ไลฟ์ต่อ'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await _endLiveSession();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),),
                        elevation: 0,
                      ),
                      child: const Text('จบไลฟ์',
                          style: TextStyle(fontWeight: FontWeight.bold),),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  Widget _glassBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.45),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _glassPill(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Row(children: [
        Icon(icon, color: color, size: 13),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(
                color: color, fontSize: 12, fontWeight: FontWeight.bold,),),
      ],),
    );
  }
}
