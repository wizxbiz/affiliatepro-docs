import 'dart:async';

import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import 'package:webview_flutter/webview_flutter.dart';

class WinRiderMapScreen extends StatefulWidget {
  final String? userId;
  final String mode; // 'rider' or 'customer'

  const WinRiderMapScreen({
    super.key,
    this.userId,
    this.mode = 'rider',
  });

  @override
  State<WinRiderMapScreen> createState() => _WinRiderMapScreenState();
}

class _WinRiderMapScreenState extends State<WinRiderMapScreen>
    with TickerProviderStateMixin {
  late final WebViewController _controller;

  // ── Loading ────────────────────────────────
  bool _isLoading = true;
  bool _hasError = false;
  int _loadingProgress = 0;

  // ── Animations ─────────────────────────────
  late AnimationController _pulseAnimationController;
  late AnimationController _fadeAnimationController;
  late AnimationController _radarAnimationController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _radarScanAnimation;

  // ── Location State (mirrors win-service.html) ──
  StreamSubscription<Position>? _locationSubscription;
  Position? _lastPosition;
  String _accuracyLabel = 'กำลังซิงค์ GPS...';
  bool _isGpsLocked = false;
  bool _isRadarActive = false; // mirrors toggleRadar()

  // ── Map Layer State (mirrors setMapLayer() in win-service.html) ──
  String _currentMapLayer = 'satellite'; // default: ESRI satellite
  static const _layerCycle = ['satellite', 'hybrid', 'street'];
  static const _layerIcons = {
    'satellite': Icons.satellite_alt_rounded,
    'hybrid': Icons.layers_rounded,
    'street': Icons.map_rounded,
  };
  static const _layerLabels = {
    'satellite': 'ดาวเทียม',
    'hybrid': 'ไฮบริด',
    'street': 'แผนที่',
  };

  static const String _baseUrl = 'https://tuktukfeed.com/win-service.html';

  // ──────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _initAnimations();
    _initWebView();
  }

  // ── Animations ─────────────────────────────
  void _initAnimations() {
    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _fadeAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();

    // Radar spinner — mirrors CSS animation in win-service.html
    _radarAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(
        parent: _pulseAnimationController,
        curve: Curves.easeInOut,
      ),
    );

    _radarScanAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _radarAnimationController, curve: Curves.linear),
    );
  }

  // ── WebView init ───────────────────────────
  Future<void> _initWebView() async {
    // Initialize controller immediately to avoid LateInitializationError in build()
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0A0E21));

    final uri = await _buildUri();

    _controller
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
            }
            // Injection 1: GPS callback-queue stub — captures JS geolocation requests
            // and resolves them when native GPS is ready via _onPositionReceived.
            _controller.runJavaScript("""
              window._isNativeBridge = true;
              window._geoQueue = [];
              window._lastNativePos = null;
              navigator.geolocation = {
                getCurrentPosition: function(s, e, o) {
                  if (window._lastNativePos) { try { s(window._lastNativePos); } catch(_){} return; }
                  window._geoQueue.push({s: s, e: e});
                },
                watchPosition: function(s, e, o) {
                  if (window._lastNativePos) { try { s(window._lastNativePos); } catch(_){} }
                  window._geoQueue.push({s: s, e: null, watch: true});
                  return 1;
                },
                clearWatch: function() {}
              };
              // Suppress GPS-error toasts immediately (before showToast is defined)
              window._suppressedGpsToast = true;
              var _origShowToast = typeof showToast === 'function' ? showToast : null;
              window.showToast = function(msg, type, title) {
                if (msg && (msg.indexOf('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2b\u0e32\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07\u0e44\u0e14\u0e49') !== -1 || msg.indexOf('Geolocation') !== -1 || msg.indexOf('location') !== -1)) {
                  console.log('[Native] suppressed GPS-error toast');
                  return;
                }
                if (_origShowToast) _origShowToast(msg, type, title);
              };
            """);
          },
          onProgress: (p) {
            if (mounted) setState(() => _loadingProgress = p);
          },
          onPageFinished: (_) async {
            if (!mounted) return;
            setState(() => _isLoading = false);

            // Injection 2: Reinforce stub & Hide initial error toasts
            await _controller.runJavaScript("""
              window._isNativeBridge = true;
              var originalToast = typeof showToast === 'function' ? showToast : null;
              window.showToast = function(msg, type, title) {
                if (msg && msg.indexOf('ไม่สามารถหาตำแหน่งได้') !== -1) {
                  console.log('Ignored JS GPS Error Toast');
                  return;
                }
                if (originalToast) originalToast(msg, type, title);
              };
              if(typeof toggleRadar==='function') toggleRadar(true, 30000);
            """);

            _setRadar(true);
            _doGpsLock();
          },
          onWebResourceError: (e) {
            debugPrint('WinRiderMap error: ${e.description}');
            if (mounted) {
              setState(() {
                _hasError = true;
                _isRadarActive = false;
              });
            }
          },
        ),
      )
      ..loadRequest(uri);
  }

  // ── GPS Lock flow (Enhanced Reliability) ──────────────
  Future<void> _doGpsLock() async {
    final svc = TukTukLocationService();

    // 1. Basic Availability Check - Fast and non-intrusive
    final bool enabled = await svc.isLocationServiceEnabled();
    final isReady = await svc.checkServiceAndPermission();
    if (!enabled || !isReady) {
      _silentFallback();
      return;
    }

    try {
      // 2. Ultra-Fast Lock: Grab whatever recent location we have in cache or instantly available
      Position? pos = await Geolocator.getLastKnownPosition();

      // If no valid cache, do a fast medium accuracy request (Max 5 Sec)
      pos ??= await svc.getCurrentLocationAndSync(
        forceRefresh: true,
        desiredAccuracy: LocationAccuracy.medium,
        timeout: const Duration(seconds: 5),
      );

      if (!mounted) return;

      if (pos != null) {
        _onPositionReceived(pos, isInitial: true);
      } else {
        // Step 3: Silent Fallback to Default Center if GPS completely stalls
        _silentFallback();
      }
    } catch (e) {
      debugPrint('GPS Silent Catch: $e');
      if (mounted) _silentFallback();
    }

    // 4. Start Continuous Tracking - This will naturally elevate accuracy up to bestForNavigation!
    _startWatchPosition();
  }

  Future<void> _silentFallback() async {
    final svc = TukTukLocationService();
    // Vigorously try to retrieve ANY cached position
    Position? fallback = await svc.getCachedPosition();
    fallback ??= await Geolocator.getLastKnownPosition();

    // One last desperate attempt to grab current location with low accuracy
    if (fallback == null) {
      try {
        fallback = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.low,
          timeLimit: const Duration(seconds: 3),
        );
      } catch (_) {
        // Silently ignore
      }
    }

    if (fallback != null) {
      _onPositionReceived(fallback, isInitial: true);
    } else {
      // Just wait for _startWatchPosition to eventually get a coordinate.
      // Don't fly to a random center. Give a subtle toast if needed.
      await _controller.runJavaScript("""
        if(typeof showToast==='function') showToast('กำลังรอสัญญาณ GPS เพื่อระบุตำแหน่ง...', 'info', 'GPS');
      """);
      if (mounted) _setRadar(true);
    }
  }

  /// Called each time a new GPS position is available —
  /// mirrors the watchPosition callback in win-service.html.
  void _onPositionReceived(Position pos, {bool isInitial = false}) {
    if (!mounted) return;

    HapticFeedback.mediumImpact(); // Added Premium feel haptic
    final quality =
        TukTukLocationService().getLocationQualityDescription(pos.accuracy);
    setState(() {
      _lastPosition = pos;
      _isGpsLocked = true;
      _accuracyLabel = quality;
    });

    final lat = pos.latitude;
    final lng = pos.longitude;

    if (isInitial) {
      // Mirrors: map.flyTo([lat, lng], 16, { duration: 1.5 })
      //          youMarker.setLatLng([lat, lng])
      //          → 1 s delay → toggleRadar(false) → showToast('GPS Locked')
      _controller.runJavaScript("""
        (function(){
          var lat=${lat.toStringAsFixed(7)}, lng=${lng.toStringAsFixed(7)};
          if(typeof userLat!=='undefined'){ userLat=lat; userLng=lng; }
          if(typeof youMarker!=='undefined' && youMarker) youMarker.setLatLng([lat,lng]);
          if(typeof map!=='undefined' && map) map.flyTo([lat,lng],16,{duration:1.5});

          // Flush queued JS geolocation callbacks with native position
          var fakePos = {coords:{latitude:lat,longitude:lng,accuracy:10,altitude:null,altitudeAccuracy:null,heading:null,speed:null},timestamp:Date.now()};
          window._lastNativePos = fakePos;
          if (window._geoQueue && window._geoQueue.length > 0) {
            window._geoQueue.forEach(function(cb){ try{ cb.s(fakePos); }catch(e){} });
            window._geoQueue = [];
          }

          setTimeout(function(){
            if(typeof toggleRadar==='function') toggleRadar(false);
            if(typeof showToast==='function') showToast('📍 ล็อคตำแหน่งเรียบร้อย!','success','GPS Locked');
            if(typeof renderRiderMarkers==='function') renderRiderMarkers();
          }, 1000);

          // Feed initial position into navigation engine
          if(typeof updateNavPosition==='function') updateNavPosition(lat, lng);
        })();
      """);
      // Mirror Flutter-side: hide radar after 1 s delay
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) _setRadar(false);
      });
    } else {
      // Continuous update — mirrors watchPosition callback
      _controller.runJavaScript("""
        (function(){
          var lat=${lat.toStringAsFixed(7)}, lng=${lng.toStringAsFixed(7)};
          if(typeof userLat!=='undefined'){ userLat=lat; userLng=lng; }
          if(typeof youMarker!=='undefined' && youMarker) youMarker.setLatLng([lat,lng]);
          if(typeof map!=='undefined' && map) map.flyTo([lat,lng], map.getZoom(), { animate: true, duration: 1.0 });

          // Feed live position into navigation engine (turn detection + rerouting)
          if(typeof updateNavPosition==='function') updateNavPosition(lat, lng);
        })();
      """);
    }
  }

  /// Continuous stream — navigator.geolocation.watchPosition equivalent
  void _startWatchPosition() {
    _locationSubscription?.cancel();
    _locationSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 5, // update every 5 m (more reactive than default)
      ),
    ).listen(
      _onPositionReceived,
      onError: (_) {/* silently ignore stream errors */},
    );
  }

  void _setRadar(bool active) {
    if (!mounted) return;
    setState(() => _isRadarActive = active);
  }

  // ── Map Layer Cycle (satellite → hybrid → street → satellite) ──
  void _cycleMapLayer() {
    final nextIndex =
        (_layerCycle.indexOf(_currentMapLayer) + 1) % _layerCycle.length;
    final next = _layerCycle[nextIndex];
    setState(() => _currentMapLayer = next);
    _controller.runJavaScript(
      "if(typeof setMapLayer==='function') setMapLayer('$next');",
    );
  }

  // ── URI builder ────────────────────────────
  Future<Uri> _buildUri() async {
    Position? pos;
    try {
      // Quick initial position — will be updated by _doGpsLock after page loads
      pos = await Geolocator.getLastKnownPosition() ??
          await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.medium,
            timeLimit: const Duration(seconds: 6),
          );
    } catch (_) {}

    final params = <String, String>{
      'mode': widget.mode,
      if (widget.userId != null && widget.userId!.isNotEmpty)
        widget.mode == 'rider' ? 'riderId' : 'userId': widget.userId!,
      if (pos != null) ...{
        'lat': pos.latitude.toString(),
        'lng': pos.longitude.toString(),
      },
      'v': DateTime.now().millisecondsSinceEpoch.toString(),
    };
    return Uri.parse(_baseUrl).replace(queryParameters: params);
  }

  // ─────────────────────────────────────────────
  @override
  void dispose() {
    _locationSubscription?.cancel();
    _pulseAnimationController.dispose();
    _fadeAnimationController.dispose();
    _radarAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0E21),
        appBar: _buildAppBar(),
        body: Stack(
          children: [
            // WebView
            if (!_hasError)
              FadeTransition(
                opacity: _fadeAnimationController,
                child: WebViewWidget(
                  controller: _controller,
                ),
              ),

            // Error State
            if (_hasError) _buildErrorView(),

            // Loading Overlay
            if (_isLoading && !_hasError) _buildLoadingOverlay(),

            // ── Radar HUD Overlay (mirrors toggleRadar() from win-service.html) ──
            if (_isRadarActive) _buildRadarHud(),

            // ── GPS Accuracy Banner (bottom) ──
            if (_isGpsLocked && !_isLoading && !_hasError)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: _buildGpsBanner(),
              ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════
  // RADAR HUD (mirrors toggleRadar() / CSS radar animation)
  // ══════════════════════════════════════════════
  Widget _buildRadarHud() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      child: IgnorePointer(
        child: Container(
          color: Colors.black.withValues(alpha: 0.55),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Radar rings (CSS .radar equivalent)
              SizedBox(
                width: 180,
                height: 180,
                child: AnimatedBuilder(
                  animation: _radarScanAnimation,
                  builder: (_, __) {
                    return Stack(
                      alignment: Alignment.center,
                      children: [
                        // Outer ring pulse
                        Container(
                          width: 180,
                          height: 180,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFF00D2FF)
                                  .withValues(alpha: 0.2),
                              width: 1.5,
                            ),
                          ),
                        ),
                        // Middle ring
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFF00D2FF)
                                  .withValues(alpha: 0.35),
                              width: 1.5,
                            ),
                          ),
                        ),
                        // Inner filled circle
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color:
                                const Color(0xFF00D2FF).withValues(alpha: 0.08),
                            border: Border.all(
                              color: const Color(0xFF00D2FF)
                                  .withValues(alpha: 0.5),
                              width: 2,
                            ),
                          ),
                        ),
                        // Rotating scan line (the radar sweep)
                        Transform.rotate(
                          angle: _radarScanAnimation.value * 2 * 3.14159,
                          child: Container(
                            width: 90,
                            height: 2,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  const Color(0xFF00D2FF).withValues(alpha: 0),
                                  const Color(0xFF00D2FF),
                                ],
                              ),
                            ),
                          ),
                        ),
                        // Center dot
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF00D2FF),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),

              const SizedBox(height: 24),

              // Label — mirrors showToast text
              Shimmer.fromColors(
                baseColor: Colors.white54,
                highlightColor: const Color(0xFF00D2FF),
                child: Text(
                  'กำลังซิงค์สัญญาณ GPS...',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ),

              const SizedBox(height: 8),
              Text(
                'Tracking Location · enableHighAccuracy: true',
                style: GoogleFonts.kanit(
                  color: Colors.white30,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── GPS Accuracy banner (bottom of screen) ──
  Widget _buildGpsBanner() {
    final accuracy = _lastPosition?.accuracy ?? 0;
    final accuracyColor = accuracy <= 10
        ? Colors.green
        : accuracy <= 30
            ? const Color(0xFF00D2FF)
            : accuracy <= 100
                ? Colors.orange
                : Colors.red;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1226).withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accuracyColor.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: accuracyColor.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // GPS icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: accuracyColor.withValues(alpha: 0.15),
            ),
            child:
                Icon(Icons.gps_fixed_rounded, color: accuracyColor, size: 16),
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '📍 GPS LOCKED · $_accuracyLabel',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  accuracy > 0
                      ? 'ความแม่นยำ ±${accuracy.toStringAsFixed(0)} เมตร'
                      : 'รับสัญญาณ GPS สำเร็จ',
                  style: GoogleFonts.kanit(
                    color: accuracyColor.withValues(alpha: 0.8),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          // Accuracy bar
          _buildAccuracyBar(accuracy),
        ],
      ),
    );
  }

  Widget _buildAccuracyBar(double accuracy) {
    // Premium Logic: "Generous" Accuracy (The 100% Precision UX)
    // Most users consider < 10m as "Perfect"
    double score;
    String label;

    if (accuracy <= 3) {
      score = 1.0;
      label = '100%+';
    } else if (accuracy <= 7) {
      score = 1.0;
      label = '100%';
    } else if (accuracy <= 12) {
      score = 0.95;
      label = '95%';
    } else if (accuracy <= 20) {
      score = 0.85;
      label = '85%';
    } else if (accuracy <= 40) {
      score = 0.70;
      label = '70%';
    } else if (accuracy <= 100) {
      score = 0.50;
      label = '50%';
    } else {
      score = 0.20;
      label = '20%';
    }

    final color = score >= 0.90
        ? Colors.greenAccent
        : score >= 0.70
            ? const Color(0xFF00D2FF)
            : Colors.orangeAccent;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: GoogleFonts.kanit(
            color: color,
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        SizedBox(
          width: 50,
          height: 5,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: score,
              backgroundColor: Colors.white.withValues(alpha: 0.05),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ),
      ],
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF1A1F35),
      foregroundColor: Colors.white,
      elevation: 0,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      leadingWidth: 48,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
            size: 16,
          ),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF00D2FF), Color(0xFF0088CC)],
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.electric_moped_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'WIN RIDER',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'LIVE',
                      style: GoogleFonts.kanit(
                        color: Colors.green,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                widget.mode == 'rider'
                    ? 'แผนที่และระบบรับงาน'
                    : 'ค้นหาวินรอบตัวคุณ',
                style: GoogleFonts.kanit(
                  color: Colors.white38,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        // Accuracy Status Pill (The 100% Accuracy UX)
        if (_isGpsLocked)
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF00D2FF).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: const Color(0xFF00D2FF).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.gps_fixed_rounded,
                    color: Color(0xFF00D2FF),
                    size: 12,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _accuracyLabel,
                    style: GoogleFonts.kanit(
                      color: const Color(0xFF00D2FF),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Online indicator
        Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                _isGpsLocked
                    ? Colors.green.withValues(alpha: 0.2)
                    : Colors.orange.withValues(alpha: 0.2),
                _isGpsLocked
                    ? Colors.green.withValues(alpha: 0.1)
                    : Colors.orange.withValues(alpha: 0.1),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: (_isGpsLocked ? Colors.green : Colors.orange)
                  .withValues(alpha: 0.3),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ScaleTransition(
                scale: _pulseAnimation,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isGpsLocked ? Colors.green : Colors.orange,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                _isGpsLocked ? 'GPS LOCKED' : 'SYNCING...',
                style: GoogleFonts.kanit(
                  color: _isGpsLocked ? Colors.green : Colors.orange,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),

        // Map Layer Toggle button (satellite → hybrid → street)
        Container(
          margin: const EdgeInsets.only(right: 4),
          child: Tooltip(
            message: _layerLabels[_currentMapLayer] ?? 'เลเยอร์แผนที่',
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF00D2FF).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFF00D2FF).withValues(alpha: 0.35),
                  ),
                ),
                child: Icon(
                  _layerIcons[_currentMapLayer] ?? Icons.layers_rounded,
                  color: const Color(0xFF00D2FF),
                  size: 16,
                ),
              ),
              onPressed: _cycleMapLayer,
            ),
          ),
        ),

        // Reload button
        Container(
          margin: const EdgeInsets.only(right: 8),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: const Icon(
                Icons.refresh_rounded,
                color: Color(0xFF00D2FF),
                size: 18,
              ),
            ),
            onPressed: _reloadWebView,
          ),
        ),
      ],
    );
  }

  void _reloadWebView() {
    setState(() {
      _isLoading = true;
      _hasError = false;
      _loadingProgress = 0;
    });
    _controller.reload();
  }

  Widget _buildLoadingOverlay() {
    return Container(
      color: const Color(0xFF0A0E21),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated map icon with pulse
            ScaleTransition(
              scale: _pulseAnimation,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const RadialGradient(
                    colors: [
                      Color(0xFF00D2FF),
                      Color(0xFF0088CC),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00D2FF).withValues(alpha: 0.5),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const Center(
                  child: Icon(Icons.map_rounded, color: Colors.white, size: 60),
                ),
              ),
            ),
            const SizedBox(height: 40),

            // Loading progress
            SizedBox(
              width: 200,
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: _loadingProgress / 100,
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFF00D2FF),
                      ),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '$_loadingProgress%',
                    style: GoogleFonts.kanit(
                      color: const Color(0xFF00D2FF),
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Loading text with shimmer
            Shimmer.fromColors(
              baseColor: Colors.white.withValues(alpha: 0.3),
              highlightColor: Colors.white.withValues(alpha: 0.6),
              child: Text(
                'กำลังโหลดแผนที่...',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 16,
                ),
              ),
            ),

            const SizedBox(height: 8),

            Text(
              'WIN RIDER Service Map',
              style: GoogleFonts.kanit(
                color: Colors.white24,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return Container(
      color: const Color(0xFF0A0E21),
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated error icon
              TweenAnimationBuilder<double>(
                duration: const Duration(seconds: 2),
                tween: Tween(begin: 0.0, end: 1.0),
                builder: (context, value, child) {
                  return Transform.scale(
                    scale: 0.8 + (value * 0.2),
                    child: Container(
                      padding: const EdgeInsets.all(30),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            Colors.red.withValues(alpha: 0.2),
                            Colors.red.withValues(alpha: 0.05),
                          ],
                        ),
                        border: Border.all(
                          color: Colors.red.withValues(alpha: 0.3),
                          width: 2,
                        ),
                      ),
                      child: const Icon(
                        Icons.wifi_off_rounded,
                        color: Colors.redAccent,
                        size: 80,
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 30),

              Text(
                'การเชื่อมต่อมีปัญหา',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(20),
                  border:
                      Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Column(
                  children: [
                    _buildErrorOption(
                      icon: Icons.wifi,
                      title: 'ตรวจสอบการเชื่อมต่อ',
                      subtitle:
                          'โปรดตรวจสอบว่า Wi-Fi หรือ Mobile Data เปิดอยู่',
                    ),
                    const SizedBox(height: 16),
                    _buildErrorOption(
                      icon: Icons.map,
                      title: 'เซิร์ฟเวอร์แผนที่',
                      subtitle: 'อาจมีปัญหาในการโหลดแผนที่ กรุณาลองใหม่',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),

              // Retry button
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _reloadWebView,
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 40,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00D2FF), Color(0xFF0088CC)],
                      ),
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF00D2FF).withValues(alpha: 0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.refresh_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'ลองใหม่อีกครั้ง',
                          style: GoogleFonts.kanit(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Alternative actions
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, color: Colors.white38),
                    label: Text(
                      'กลับ',
                      style: GoogleFonts.kanit(color: Colors.white38),
                    ),
                  ),
                  const SizedBox(width: 20),
                  TextButton.icon(
                    onPressed: () {
                      // Open in external browser
                    },
                    icon: const Icon(
                      Icons.open_in_browser,
                      color: Colors.white38,
                    ),
                    label: Text(
                      'เปิดใน Browser',
                      style: GoogleFonts.kanit(color: Colors.white38),
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

  Widget _buildErrorOption({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.03),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.orangeAccent, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.kanit(
                  color: Colors.white38,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
