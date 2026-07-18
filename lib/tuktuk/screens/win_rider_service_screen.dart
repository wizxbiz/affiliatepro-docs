import 'dart:async';
import 'dart:math' show sqrt, pow;
import 'dart:ui'; // ✅ For BackdropFilter

import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/register_screen.dart';
import 'package:caculateapp/tuktuk/screens/win_rider_chat_screen.dart';
import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/tuktuk_item.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';
import 'package:webview_flutter/webview_flutter.dart'; // ✅ Added for Map

/// Top-level helper: finds the nearest active [win_stations] doc within its
/// own serviceRadiusM. Returns {id, name, lat, lng} or null if none in range.
Future<Map<String, dynamic>?> resolveNearestStation(
  double lat,
  double lng,
) async {
  try {
    final snap = await FirebaseFirestore.instance
        .collection('win_stations')
        .where('isActive', isEqualTo: true)
        .get()
        .timeout(const Duration(seconds: 6));

    Map<String, dynamic>? best;
    double bestDist = double.infinity;

    for (final doc in snap.docs) {
      final s = doc.data();
      final sLat = (s['lat'] as num?)?.toDouble();
      final sLng = (s['lng'] as num?)?.toDouble();
      if (sLat == null || sLng == null) continue;

      final dLat = (lat - sLat) * 111000.0;
      final dLng = (lng - sLng) * 111000.0 * 0.985;
      final distMSq = dLat * dLat + dLng * dLng;
      final serviceR = (s['serviceRadiusM'] as num?)?.toDouble() ?? 3000.0;

      if (distMSq < serviceR * serviceR && distMSq < bestDist) {
        bestDist = distMSq;
        best = {
          'id': doc.id,
          'name': s['name'] ?? '',
          'lat': sLat,
          'lng': sLng,
        };
      }
    }
    return best;
  } catch (_) {
    return null;
  }
}

class WinRiderServiceScreen extends StatefulWidget {
  const WinRiderServiceScreen({super.key});

  @override
  State<WinRiderServiceScreen> createState() => _WinRiderServiceScreenState();
}

class _WinRiderServiceScreenState extends State<WinRiderServiceScreen>
    with TickerProviderStateMixin {
  // ── State ─────────────────────────────────────────────────────────────────
  bool _isRider = false;
  bool _isInitialLoading = true;
  bool _isRiderOnline = false;
  bool _isTogglingOnline = false;
  Map<String, dynamic>? _riderData;
  List<TukTukItem> _items = [];
  String? _userId;

  // Profile photo for rider (from registration driverPhotoUrl or LINE pictureUrl)
  String get _riderPhotoUrl =>
      _riderData?['driverPhotoUrl']?.toString() ??
      _riderData?['photoUrl']?.toString() ??
      _riderData?['pictureUrl']?.toString() ??
      '';
  final PageController _pageController = PageController();

  late AnimationController _pulseAnimationController;
  late AnimationController _slideAnimationController;
  late Animation<double> _fadeAnimation;

  int _pendingJobsCount = 0;
  int _onlineRidersCount = 0;
  bool _hasNewJob = false;
  int _selectedNavIndex = 0;

  // ── Real-time subscriptions ───────────────────────────────────────────────
  StreamSubscription<QuerySnapshot>? _jobsSub;
  StreamSubscription<DocumentSnapshot>? _myRequestSub;

  // ── Customer active booking tracking ─────────────────────────────────────
  String? _activeRequestId;
  Map<String, dynamic>? _activeRequest;
  bool _isPanelExpanded = false;
  final double _panelMinHeight = 110;
  final double _panelMaxHeight = 420;
  late AnimationController _panelAnimationController;

  // Search & Filter
  String _searchQuery = '';
  List<TukTukItem> _filteredItems = [];
  final TextEditingController _searchController = TextEditingController();

  // 🗺️ Map Logic
  WebViewController? _mapController;
  bool _isMapLoading = true;
  static const String _mapBaseUrl = 'https://tuktukfeed.com/win-service.html';

  @override
  void initState() {
    super.initState();
    // 🔍 Pick up current session immediately
    _userId = FirebaseAuth.instance.currentUser?.uid;

    // 🎭 Reactive Session Listener (ensures Profile login memory is instant)
    TukTukBridge().sessionStream.listen((session) {
      if (mounted && session != null) {
        setState(() {
          _userId = session['uid'] ?? session['lineUserId'];
        });
        _init(); // Re-run init to load jobs/rider data
      }
    });

    _initializeAnimations();
    _init();

    _panelAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _searchController.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text.toLowerCase();
      _filterItems();
    });
  }

  void _filterItems() {
    if (_searchQuery.isEmpty) {
      _filteredItems = _items;
    } else {
      _filteredItems = _items.where((item) {
        if (item.type == TukTukItemType.riderProfile) {
          final name = (item.data['name'] ?? '').toString().toLowerCase();
          return name.contains(_searchQuery);
        }
        if (item.type == TukTukItemType.riderJob) {
          final pickup =
              (item.data['pickupAddress'] ?? '').toString().toLowerCase();
          final dropoff =
              (item.data['dropoffAddress'] ?? '').toString().toLowerCase();
          return pickup.contains(_searchQuery) ||
              dropoff.contains(_searchQuery);
        }
        return false;
      }).toList();
    }
  }

  void _initializeAnimations() {
    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _slideAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _slideAnimationController,
        curve: Curves.easeInOut,
      ),
    );
    _slideAnimationController.forward();
  }

  @override
  void dispose() {
    _jobsSub?.cancel();
    _myRequestSub?.cancel();
    _pageController.dispose();
    _pulseAnimationController.dispose();
    _slideAnimationController.dispose();
    _panelAnimationController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  // ── Init: detect rider status + load first items ──────────────────────────
  Future<void> _init() async {
    // 🔍 Pick up session from Bridge (ensures LINE login & Profile login memory)
    final session = await TukTukBridge().getCurrentUser();
    if (session != null) {
      _userId = session['uid'] ?? session['lineUserId'];
    } else {
      _userId = FirebaseAuth.instance.currentUser?.uid;
    }

    if (_userId == null) {
      if (mounted) setState(() => _isInitialLoading = false);
      return;
    }

    try {
      final doc = await FirebaseFirestore.instance
          .collection('win_riders')
          .doc(_userId)
          .get();

      Map<String, dynamic>? resolvedData;
      bool resolvedIsRider = false;

      if (doc.exists) {
        resolvedData = doc.data() as Map<String, dynamic>;
        resolvedIsRider = true;
      } else {
        // Fallback: check win_rider_registrations for approved status
        // Supports both Firebase UID and LINE userId as document identifier
        final regQuery = await FirebaseFirestore.instance
            .collection('win_rider_registrations')
            .where('lineUserId', isEqualTo: _userId)
            .limit(1)
            .get();

        if (regQuery.docs.isNotEmpty) {
          final reg = regQuery.docs.first.data();
          if (reg['status'] == 'approved') {
            // Registration approved but win_riders doc not yet created
            // Auto-create from registration data so rider can start working
            resolvedData = {
              ...reg,
              'isOnline': false,
              'isVerified': true,
              'approvedAt': reg['updatedAt'],
            };
            resolvedIsRider = true;
            // Persist to win_riders so future loads are instant
            await FirebaseFirestore.instance
                .collection('win_riders')
                .doc(_userId)
                .set(resolvedData, SetOptions(merge: true));
          } else {
            // Still pending/rejected — expose registration data for profile display
            resolvedData = reg;
          }
        }
      }

      if (mounted) {
        setState(() {
          _isRider = resolvedIsRider;
          _riderData = resolvedData;
          if (resolvedIsRider) {
            _isRiderOnline = resolvedData?['isOnline'] == true;
          }
        });
        _initMap(); // Initialize map once user is detected
      }
      if (_isRider) {
        _subscribeToRiderJobs(); // real-time stream — no await
      } else {
        await _loadItems();
      }
      await _loadCounts();
    } catch (e) {
      debugPrint('WinRiderService init error: $e');
    } finally {
      if (mounted) setState(() => _isInitialLoading = false);
    }
  }

  Future<void> _initMap() async {
    Position? currentPos;
    try {
      // Ultra-Fast fetching: try cached/last-known first
      currentPos = await Geolocator.getLastKnownPosition();

      // If no valid cache, do a fast medium request
      currentPos ??= await TukTukLocationService().getCurrentLocationAndSync(
          forceRefresh: true,
          desiredAccuracy: LocationAccuracy.medium,
          timeout: const Duration(seconds: 4),
        );
    } catch (e) {
      debugPrint('Error getting fast location for map: $e');
    }

    final params = <String, String>{
      'mode': _isRider ? 'rider' : 'customer',
      if (_userId != null) _isRider ? 'riderId' : 'userId': _userId!,
      if (currentPos != null) ...{
        'lat': currentPos.latitude.toString(),
        'lng': currentPos.longitude.toString(),
      },
      'v': DateTime.now().millisecondsSinceEpoch.toString(),
      'mapLayer': 'satellite', // Hint for backend
    };

    final uri = Uri.parse(_mapBaseUrl).replace(queryParameters: params);

    if (_mapController == null) {
      _mapController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(const Color(0xFF0A0E21))
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (_) {
              if (mounted) setState(() => _isMapLoading = true);
              _mapController?.runJavaScript("""
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
                var _origShowToast2 = typeof showToast === 'function' ? showToast : null;
                window.showToast = function(msg, type, title) {
                  if (msg && (msg.indexOf('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2b\u0e32\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07\u0e44\u0e14\u0e49') !== -1 || msg.indexOf('Geolocation') !== -1)) {
                    console.log('[Native] suppressed GPS-error toast');
                    return;
                  }
                  if (_origShowToast2) _origShowToast2(msg, type, title);
                };
              """);
            },
            onPageFinished: (_) async {
              if (mounted) setState(() => _isMapLoading = false);

              await _mapController?.runJavaScript("""
                window._isNativeBridge = true;

                // Inject native position if already obtained
                (function() {
                  var lat = ${currentPos?.latitude ?? 'null'}, lng = ${currentPos?.longitude ?? 'null'};
                  if (lat !== null && lng !== null) {
                    if (typeof userLat !== 'undefined') userLat = lat;
                    if (typeof userLng !== 'undefined') userLng = lng;
                    if (typeof map !== 'undefined' && map) map.setView([lat, lng], 15);
                    if (typeof youMarker !== 'undefined' && youMarker) youMarker.setLatLng([lat, lng]);
                    var fakePos2 = {coords:{latitude:lat,longitude:lng,accuracy:10,altitude:null,altitudeAccuracy:null,heading:null,speed:null},timestamp:Date.now()};
                    window._lastNativePos = fakePos2;
                    if (window._geoQueue && window._geoQueue.length > 0) {
                      window._geoQueue.forEach(function(cb){ try{ cb.s(fakePos2); }catch(e){} });
                      window._geoQueue = [];
                    }
                  }
                })();

                // 🛰️ Map Layer Switch to Satellite & Visual Tweaks
                if (typeof map !== 'undefined' && map) {
                  // If the web version uses standard Leaflet layer management
                  if (typeof GoogleSatelliteLayer !== 'undefined') {
                       map.addLayer(GoogleSatelliteLayer);
                  } else {
                       // Generic fallback: try to find and click a satellite button if it exists
                       var satBtn = document.querySelector('.layer-control-satellite, [title*="Satellite"]');
                       if (satBtn) satBtn.click();
                  }
                }

                // 🛡️ Hide redundant/messy HTML elements when in Native App
                var style = document.createElement('style');
                style.innerHTML = `
                  .top-nav, .filter-row, .floating-actions, .mobile-promo-circles { display: none !important; }
                  #map-container { padding-top: 0 !important; }
                  .bottom-panel { display: none !important; }
                  .leaflet-control-zoom { margin-top: 100px !important; }
                  .search-bar { 
                    top: 10px !important; 
                    background: rgba(0,0,0,0.6) !important; /* Better contrast for satellite */
                    border: 1px solid rgba(255,255,255,0.2) !important;
                  } 
                `;
                document.head.appendChild(style);

                var originalToast = typeof showToast === 'function' ? showToast : null;
                window.showToast = function(msg, type, title) {
                  if (msg && (msg.indexOf('ไม่สามารถหาตำแหน่งได้') !== -1 || msg.indexOf('Geolocation') !== -1)) {
                    console.log('Ignored JS GPS Error Toast');
                    return;
                  }
                  if (originalToast) originalToast(msg, type, title);
                };
              """);
            },
          ),
        )
        ..loadRequest(uri);
      setState(() {});
    } else {
      await _mapController!.loadRequest(uri);
    }
  }

  Future<void> _loadCounts() async {
    try {
      if (_isRider) {
        final pendingSnap = await FirebaseFirestore.instance
            .collection('win_rider_requests')
            .where('status', isEqualTo: 'pending')
            .get();
        setState(() {
          _pendingJobsCount = pendingSnap.docs.length;
        });
      } else {
        final onlineSnap = await FirebaseFirestore.instance
            .collection('win_riders')
            .where('isOnline', isEqualTo: true)
            .get();
        setState(() {
          _onlineRidersCount = onlineSnap.docs.length;
        });
      }
    } catch (e) {
      debugPrint('loadCounts error: $e');
    }
  }

  // ── Real-time: rider job feed via Firestore snapshots ─────────────────────
  void _subscribeToRiderJobs() {
    _jobsSub?.cancel();
    _jobsSub = FirebaseFirestore.instance
        .collection('win_rider_requests')
        .where('status', isEqualTo: 'pending')
        .orderBy('createdAt', descending: true)
        .limit(20)
        .snapshots()
        .listen((snap) async {
      if (!mounted) return;

      // Compute distance for each job if we have location
      Position? myPos;
      try {
        myPos = await Geolocator.getLastKnownPosition();
        myPos ??= TukTukLocationService().getCachedPosition();
      } catch (_) {}

      final newJobs = snap.docs.map((doc) {
        final data = Map<String, dynamic>.from(doc.data());
        if (myPos != null && data['pickupLat'] != null && data['pickupLng'] != null) {
          final dlat = (data['pickupLat'] as num).toDouble() - myPos.latitude;
          final dlng = (data['pickupLng'] as num).toDouble() - myPos.longitude;
          final distKm = sqrt(pow(dlat * 111.0, 2) + pow(dlng * 111.0 * 0.985, 2));
          data['distance'] = double.parse(distKm.toStringAsFixed(1));
        }
        return TukTukItem.fromRiderJob(doc);
      }).toList();

      final prevCount = _items.where((i) => i.type == TukTukItemType.riderJob).length;
      final hasNew = newJobs.length > prevCount;

      setState(() {
        _items = newJobs;
        _filteredItems = newJobs;
        _pendingJobsCount = newJobs.length;
        if (hasNew) _hasNewJob = true;
      });

      if (hasNew) {
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) setState(() => _hasNewJob = false);
        });
      }
    }, onError: (e) => debugPrint('_subscribeToRiderJobs error: $e'));
  }

  // ── Real-time: customer tracks their active booking ───────────────────────
  void _listenToMyRequest(String requestId) {
    _myRequestSub?.cancel();
    setState(() {
      _activeRequestId = requestId;
      _activeRequest = {'status': 'pending'};
    });

    _myRequestSub = FirebaseFirestore.instance
        .collection('win_rider_requests')
        .doc(requestId)
        .snapshots()
        .listen((snap) {
      if (!snap.exists || !mounted) return;
      final data = snap.data()!;
      setState(() => _activeRequest = data);

      // Auto-clear when terminal state reached
      if (data['status'] == 'completed' || data['status'] == 'cancelled') {
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            setState(() {
              _activeRequestId = null;
              _activeRequest = null;
            });
          }
          _myRequestSub?.cancel();
        });
      }
    }, onError: (e) => debugPrint('_listenToMyRequest error: $e'),);
  }

  // ── Fare estimate (Thai WIN pricing) ─────────────────────────────────────
  /// Base 25 THB covers first 1 km; 7 THB per km after that.
  int _fareEstimate(double distanceKm) {
    const int base = 25;
    if (distanceKm <= 1.0) return base;
    return base + ((distanceKm - 1.0) * 7).round();
  }

  // ── Load feed items based on role ─────────────────────────────────────────
  Future<void> _loadItems() async {
    try {
      final List<TukTukItem> items = [];

      if (_isRider) {
        // Rider → pending jobs
        final snap = await FirebaseFirestore.instance
            .collection('win_rider_requests')
            .where('status', isEqualTo: 'pending')
            .orderBy('createdAt', descending: true)
            .limit(20)
            .get()
            .timeout(const Duration(seconds: 10));

        items.addAll(snap.docs.map(TukTukItem.fromRiderJob));

        // Check if there are new jobs
        if (items.length > _items.length) {
          setState(() => _hasNewJob = true);
          Future.delayed(const Duration(seconds: 3), () {
            if (mounted) setState(() => _hasNewJob = false);
          });
        }
      } else {
        // Customer → online riders, sorted by proximity
        items.add(TukTukItem.winRiderPromo());

        final snap = await FirebaseFirestore.instance
            .collection('win_riders')
            .where('isOnline', isEqualTo: true)
            .limit(20)
            .get()
            .timeout(const Duration(seconds: 8));

        // Get current position for distance calculation
        Position? myPos;
        try {
          myPos = await Geolocator.getLastKnownPosition();
          myPos ??= await TukTukLocationService().getCachedPosition();
        } catch (_) {}

        final riderItems = snap.docs.map((doc) {
          final data = doc.data();
          // Compute Euclidean approximation (good enough for sorting within city)
          if (myPos != null &&
              data['lat'] != null &&
              data['lng'] != null) {
            final dlat = (data['lat'] as num).toDouble() - myPos.latitude;
            final dlng = (data['lng'] as num).toDouble() - myPos.longitude;
            // degrees → km approx (1° lat ≈ 111 km, 1° lng ≈ 111*cos(lat) km)
            final distKm = sqrt(
              pow(dlat * 111.0, 2) + pow(dlng * 111.0 * 0.985, 2),
            );
            data['distance'] = double.parse(distKm.toStringAsFixed(1));
          }
          return TukTukItem.fromRiderProfile(doc);
        }).toList();

        // Sort nearest first
        if (myPos != null) {
          riderItems.sort((a, b) {
            final da = (a.data['distance'] as num?)?.toDouble() ?? 999.0;
            final db = (b.data['distance'] as num?)?.toDouble() ?? 999.0;
            return da.compareTo(db);
          });
        }

        items.addAll(riderItems);
      }

      if (mounted) {
        setState(() {
          _items = items;
          _filteredItems = items;
        });
      }
    } catch (e) {
      debugPrint('WinRiderService load error: $e');
    }
  }

  // ── WIN RIDER Actions ─────────────────────────────────────────────────────
  Future<void> _acceptJob(String requestId) async {
    if (_userId == null) return;

    try {
      await FirebaseFirestore.instance
          .collection('win_rider_requests')
          .doc(requestId)
          .update({
        'status': 'accepted',
        'riderId': _userId,
        'riderName': _riderData?['name'] ?? _riderData?['fullName'] ?? '',
        'riderPhone': _riderData?['phone'] ?? '',
        'riderPlate': _riderData?['plate'] ?? '',
        'acceptedAt': FieldValue.serverTimestamp(),
      });

      final reqDoc = await FirebaseFirestore.instance
          .collection('win_rider_requests')
          .doc(requestId)
          .get();

      final requesterId = reqDoc.data()?['requesterId'] ?? '';

      if (requesterId.isNotEmpty) {
        await FirebaseFirestore.instance.collection('notifications').add({
          'recipientId': requesterId,
          'title': '🏍️ วินรับงานแล้ว!',
          'text': '${_riderData?['name'] ?? 'วิน'} กำลังมาหาคุณ',
          'type': 'win_rider_accepted',
          'requestId': requestId,
          'isRead': false,
          'createdAt': FieldValue.serverTimestamp(),
        });
      }

      if (mounted) {
        await _loadItems();
        _showSuccessSnackBar('รับงานสำเร็จ! กำลังไปหาลูกค้า');
      }
    } catch (e) {
      debugPrint('acceptJob error: $e');
      if (mounted) _showErrorSnackBar('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }

  Future<void> _passJob(String requestId) async {
    if (_userId == null) return;

    try {
      await FirebaseFirestore.instance
          .collection('win_rider_requests')
          .doc(requestId)
          .update({
        'rejectedBy': FieldValue.arrayUnion([_userId]),
      });

      if (mounted) {
        setState(() => _items.removeWhere((item) => item.id == requestId));
        _showInfoSnackBar('ส่งต่องานเรียบร้อย');
      }
    } catch (e) {
      debugPrint('passJob error: $e');
    }
  }

  Future<void> _toggleRiderOnline() async {
    if (_userId == null || _isTogglingOnline) return;

    setState(() => _isTogglingOnline = true);

    try {
      final newOnline = !_isRiderOnline;
      final Map<String, dynamic> update = {
        'isOnline': newOnline,
        'lastOnlineAt': FieldValue.serverTimestamp(),
      };

      if (newOnline) {
        // Try to get fresh GPS; fallback to last-known if timeout
        Position? pos;
        try {
          pos = await TukTukLocationService()
              .getCurrentLocationAndSync(forceRefresh: true)
              .timeout(const Duration(seconds: 8));
        } catch (_) {}
        pos ??= await Geolocator.getLastKnownPosition();

        if (pos == null) {
          // Block going online without a valid GPS position —
          // rider marker would render at [0,0] on customer map.
          if (mounted) {
            _showErrorSnackBar('ไม่พบตำแหน่ง GPS กรุณาเปิด Location แล้วลองใหม่');
            setState(() => _isTogglingOnline = false);
          }
          return;
        }
        update['lat'] = pos.latitude;
        update['lng'] = pos.longitude;

        // Auto check-in: find nearest active station and attach it
        final stationInfo = await resolveNearestStation(pos.latitude, pos.longitude);
        if (stationInfo != null) {
          update['stationId']   = stationInfo['id'];
          update['stationName'] = stationInfo['name'];
          update['stationLat']  = stationInfo['lat'];
          update['stationLng']  = stationInfo['lng'];
        }
      }

      await FirebaseFirestore.instance
          .collection('win_riders')
          .doc(_userId)
          .update(update);

      if (mounted) {
        setState(() {
          _isRiderOnline = newOnline;
          _riderData?['isOnline'] = newOnline;
        });

        _showSuccessSnackBar(
          newOnline ? 'คุณกำลังออนไลน์ พร้อมรับงาน' : 'คุณออฟไลน์แล้ว',
        );
      }
    } catch (e) {
      debugPrint('toggleOnline error: $e');
      if (mounted) _showErrorSnackBar('ไม่สามารถเปลี่ยนสถานะได้');
    } finally {
      if (mounted) setState(() => _isTogglingOnline = false);
    }
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.kanit())),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.kanit())),
          ],
        ),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showInfoSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.info_outline_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.kanit())),
          ],
        ),
        backgroundColor: Colors.blue,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _togglePanel() {
    setState(() {
      _isPanelExpanded = !_isPanelExpanded;
      if (_isPanelExpanded) {
        _panelAnimationController.forward();
      } else {
        _panelAnimationController.reverse();
      }
    });
  }

  void _showSearchDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: const Color(0xFF0A0E21).withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                autofocus: true,
                style: GoogleFonts.kanit(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  hintText: 'ค้นหาวิน หรือ สถานที่...',
                  hintStyle: GoogleFonts.kanit(color: Colors.white38),
                  prefixIcon: const Icon(Icons.search, color: Colors.white38),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.05),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value.toLowerCase();
                    _filterItems();
                  });
                },
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: _buildFeed(),
            ),
          ],
        ),
      ),
    );
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF0A0E21).withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'ตัวกรอง',
              style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,),
            ),
            const SizedBox(height: 20),
            _buildFilterChip('ใกล้ที่สุด'),
            _buildFilterChip('คะแนนสูงสุด'),
            _buildFilterChip('ราคาต่ำสุด'),
            _buildFilterChip('บริการด่วน'),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(
          label,
          style: GoogleFonts.kanit(color: Colors.white70, fontSize: 16),
        ),
        trailing:
            const Icon(Icons.chevron_right_rounded, color: Colors.white38),
        onTap: () {
          Navigator.pop(context);
          _showInfoSnackBar('กำลังกรอง: $label');
        },
      ),
    );
  }

  void _showRiderIntelligentMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF0A0E21).withValues(alpha: 0.9),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
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
              const SizedBox(height: 24),
              Text(
                'เมนูอัจฉริยะ WIN RIDER',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'เลือกด่วนเพื่อเริ่มต้นการใช้งาน',
                style: GoogleFonts.kanit(color: Colors.white38, fontSize: 13),
              ),
              const SizedBox(height: 32),
              GridView.count(
                shrinkWrap: true,
                crossAxisCount: 3,
                mainAxisSpacing: 20,
                crossAxisSpacing: 20,
                children: [
                  _buildMenuButton(
                    Icons.motorcycle_rounded,
                    'เรียกตอนนี้',
                    const Color(0xFF00D2FF),
                    () => Navigator.pop(context),
                  ),
                  _buildMenuButton(
                    Icons.person_search_rounded,
                    'วินใกล้คุณ',
                    const Color(0xFF00D2FF),
                    () {
                      Navigator.pop(context);
                      _initMap();
                    },
                  ),
                  _buildMenuButton(
                    Icons.history_edu_rounded,
                    'ประวัติงาน',
                    Colors.orange,
                    () => Navigator.pop(context),
                  ),
                  if (!_isRider)
                    _buildMenuButton(
                      Icons.app_registration_rounded,
                      'สมัครวิน',
                      Colors.green,
                      () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const RegisterScreen(),),
                        );
                      },
                    ),
                  if (_isRider)
                    _buildMenuButton(
                      _isRiderOnline
                          ? Icons.power_settings_new_rounded
                          : Icons.offline_bolt_rounded,
                      _isRiderOnline ? 'ปิดระบบ' : 'เริ่มงาน',
                      _isRiderOnline ? Colors.red : Colors.green,
                      () {
                        Navigator.pop(context);
                        _toggleRiderOnline();
                      },
                    ),
                  _buildMenuButton(
                    Icons.help_outline_rounded,
                    'ช่วยเหลือ',
                    Colors.white54,
                    () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuButton(
      IconData icon, String label, Color color, VoidCallback onTap,) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.kanit(color: Colors.white, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Base Layer: The Map
          if (_mapController != null)
            WebViewWidget(
              controller: _mapController!,
            )
          else
            _buildBackgroundGradient(),

          // 2. Loading Overlay (Map)
          if (_isMapLoading && !_isInitialLoading)
            Container(
              color: const Color(0xFF0A0E21).withValues(alpha: 0.5),
              child: const Center(child: CircularProgressIndicator()),
            ),

          // 3. Content Overlays (Glassmorphism)
          _buildContent(),

          _buildTopBar(),

          if (_hasNewJob) _buildNewJobIndicator(),

          // Floating 'Near Me' Button
          _buildNearMeButton(),

          // Floating Action Menu
          _buildFloatingActionMenu(),
        ],
      ),
    );
  }

  Widget _buildFloatingActionMenu() {
    return Positioned(
      bottom: _isPanelExpanded ? _panelMaxHeight + 70 : _panelMinHeight + 70,
      right: 20,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: Column(
          key: ValueKey(_isPanelExpanded),
          children: [
            // Search Button
            _buildCircleFab(
              icon: Icons.search,
              label: 'ค้นหา',
              color: Colors.orange,
              onTap: _showSearchDialog,
            ),
            const SizedBox(height: 16),
            // Smart Menu Button
            _buildCircleFab(
              icon: Icons.grid_view_rounded,
              label: 'เมนู',
              color: const Color(0xFF00D2FF),
              onTap: _showRiderIntelligentMenu,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircleFab({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withValues(alpha: 0.7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.3),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
                width: 2,
              ),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.kanit(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackgroundGradient() {
    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.topRight,
          radius: 1.5,
          colors: [
            const Color(0xFF00D2FF).withValues(alpha: 0.1),
            Colors.transparent,
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 10,
      left: 16,
      right: 16,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // 🔙 Compact Header Pill
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0E21).withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 10,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.white, size: 16,),
                  const SizedBox(width: 8),
                  Text(
                    _isRider ? '🏍️ งานวิน' : '🏍️ WIN RIDER',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_isRider && _pendingJobsCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2,),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$_pendingJobsCount',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,),
                      ),
                    ),
                  ],
                  if (!_isRider && _onlineRidersCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2,),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$_onlineRidersCount',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          // 🔄 Refresh Button (Floating Pill)
          GestureDetector(
            onTap: _initMap,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0E21).withValues(alpha: 0.8),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 10,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: const Icon(Icons.refresh_rounded,
                  color: Color(0xFF00D2FF), size: 20,),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNearMeButton() {
    return Positioned(
      bottom: _isPanelExpanded ? _panelMaxHeight + 10 : _panelMinHeight + 10,
      right: 20,
      child: GestureDetector(
        onTap: _centerMap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.my_location_rounded,
                  color: Color(0xFF00D2FF),),
            ),
          ),
        ),
      ),
    );
  }

  void _centerMap() async {
    final pos = await TukTukLocationService()
        .getCurrentLocationAndSync(forceRefresh: true);
    if (pos != null) {
      await _mapController?.runJavaScript("""
        if (typeof map !== 'undefined' && map) map.setView([${pos.latitude}, ${pos.longitude}], 16);
        if (typeof youMarker !== 'undefined' && youMarker) youMarker.setLatLng([${pos.latitude}, ${pos.longitude}]);
      """);
      _showInfoSnackBar('กำลังซูมไปที่ตำแหน่งของคุณ');
    }
  }

  Widget _buildNewJobIndicator() {
    return Positioned(
      top: 100,
      left: 0,
      right: 0,
      child: FadeInDown(
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withValues(alpha: 0.3),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.notifications_active_rounded,
                    color: Colors.white, size: 16,),
                const SizedBox(width: 8),
                Text(
                  'มีงานใหม่! ปัดขึ้นเพื่อดู',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Main content ──────────────────────────────────────────────────────────
  Widget _buildContent() {
    if (_isInitialLoading) {
      return _buildLoadingShimmer();
    }

    if (_userId == null) {
      return _buildLoginPrompt();
    }

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        height: _isPanelExpanded ? _panelMaxHeight : _panelMinHeight,
        child: ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF0A0E21).withValues(alpha: 0.9),
                border: Border(
                  top: BorderSide(
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                ),
              ),
              child: Column(
                children: [
                  // Drag Handle
                  GestureDetector(
                    onTap: _togglePanel,
                    onVerticalDragUpdate: (details) {
                      if (details.primaryDelta! < -10) {
                        setState(() => _isPanelExpanded = true);
                        _panelAnimationController.forward();
                      } else if (details.primaryDelta! > 10) {
                        setState(() => _isPanelExpanded = false);
                        _panelAnimationController.reverse();
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      color: Colors.transparent,
                      width: double.infinity,
                      child: Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Search Bar (Visible when expanded)
                  if (_isPanelExpanded) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(25),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _searchController,
                                style: GoogleFonts.kanit(color: Colors.white),
                                decoration: InputDecoration(
                                  hintText: 'ค้นหาวิน...',
                                  hintStyle: GoogleFonts.kanit(
                                    color: Colors.white38,
                                    fontSize: 14,
                                  ),
                                  prefixIcon: const Icon(
                                    Icons.search,
                                    color: Colors.white38,
                                  ),
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ),
                            IconButton(
                              onPressed: _showFilterDialog,
                              icon: const Icon(Icons.tune_rounded,
                                  color: Colors.white38,),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Rider profile header (when expanded and logged-in as rider)
                  if (_isRider && _isPanelExpanded && _riderData != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: _buildRiderProfileCard(),
                    ),

                  if (_isRider)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildOnlineToggle(),
                    ),

                  // The Feed (Rider Profiles or Jobs)
                  Expanded(
                    child: _buildFeed(),
                  ),

                  // Customer active booking status panel
                  if (!_isRider && _activeRequest != null)
                    _buildActiveBookingPanel(),

                  // Bottom Navigation (Integrated in panel)
                  _buildCompactNav(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.white.withValues(alpha: 0.1),
      highlightColor: Colors.white.withValues(alpha: 0.2),
      child: ListView.builder(
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 80),
        itemCount: 5,
        itemBuilder: (context, index) => Container(
          margin: const EdgeInsets.all(16),
          height: 400,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(25),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginPrompt() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ScaleTransition(
            scale: _pulseAnimationController,
            child: Container(
              padding: const EdgeInsets.all(30),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF00D2FF), Color(0xFF0088CC)],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.electric_moped_rounded,
                  color: Colors.white, size: 60,),
            ),
          ),
          const SizedBox(height: 30),
          ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [Colors.white, Color(0xFF00D2FF)],
            ).createShader(bounds),
            child: Text(
              'เข้าสู่ระบบเพื่อใช้งาน WIN RIDER',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'รับงานส่งของ หรือเรียกวินในพื้นที่',
              textAlign: TextAlign.center,
              style: GoogleFonts.kanit(
                color: Colors.white54,
                fontSize: 15,
              ),
            ),
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00D2FF),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text('เข้าสู่ระบบ'),
          ),
        ],
      ),
    );
  }

  // ── Rider profile summary card (shown in expanded panel) ──────────────────
  Widget _buildRiderProfileCard() {
    final name = _riderData?['name']?.toString() ??
        _riderData?['fullName']?.toString() ??
        _riderData?['displayName']?.toString() ??
        'วินไรเดอร์';
    final plate = _riderData?['plate']?.toString() ?? '';
    final area = _riderData?['area']?.toString() ?? '';
    final vehicleMap = {
      'motorcycle': '🏍️ มอเตอร์ไซค์',
      'bicycle': '🚲 จักรยาน',
      'pickup': '🛻 กระบะ',
      'car': '🚗 รถยนต์',
    };
    final vehicleLabel =
        vehicleMap[_riderData?['vehicle']?.toString()] ?? '🏍️';
    final photoUrl = _riderPhotoUrl;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF00D2FF).withValues(alpha: 0.12),
            const Color(0xFF0088CC).withValues(alpha: 0.06),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF00D2FF).withValues(alpha: 0.25),
        ),
      ),
      child: Row(
        children: [
          // Avatar
          CircleAvatar(
            radius: 28,
            backgroundColor: const Color(0xFF00D2FF).withValues(alpha: 0.2),
            backgroundImage:
                photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null,
            child: photoUrl.isEmpty
                ? const Icon(Icons.person_rounded,
                    color: Color(0xFF00D2FF), size: 28,)
                : null,
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (plate.isNotEmpty)
                  Text(
                    '$vehicleLabel  $plate',
                    style: GoogleFonts.kanit(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                if (area.isNotEmpty)
                  Text(
                    '📍 $area',
                    style: GoogleFonts.kanit(
                      color: Colors.white38,
                      fontSize: 11,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          // Online dot
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _isRiderOnline ? Colors.greenAccent : Colors.redAccent,
              boxShadow: [
                BoxShadow(
                  color: (_isRiderOnline ? Colors.green : Colors.red)
                      .withValues(alpha: 0.5),
                  blurRadius: 6,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOnlineToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _isRiderOnline
                ? Colors.green.withValues(alpha: 0.2)
                : Colors.red.withValues(alpha: 0.2),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: _isRiderOnline ? Colors.green : Colors.red,
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: _isRiderOnline ? null : _toggleRiderOnline,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: !_isRiderOnline
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(25),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_isTogglingOnline && !_isRiderOnline)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.green,
                        ),
                      )
                    else
                      Icon(
                        Icons.power_settings_new_rounded,
                        color: !_isRiderOnline ? Colors.green : Colors.white38,
                        size: 18,
                      ),
                    const SizedBox(width: 8),
                    Text(
                      'ออฟไลน์',
                      style: GoogleFonts.kanit(
                        color: !_isRiderOnline ? Colors.green : Colors.white38,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: !_isRiderOnline ? null : _toggleRiderOnline,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _isRiderOnline
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(25),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_isTogglingOnline && _isRiderOnline)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.green,
                        ),
                      )
                    else
                      Icon(
                        Icons.wifi_rounded,
                        color: _isRiderOnline ? Colors.green : Colors.white38,
                        size: 18,
                      ),
                    const SizedBox(width: 8),
                    Text(
                      'ออนไลน์',
                      style: GoogleFonts.kanit(
                        color: _isRiderOnline ? Colors.green : Colors.white38,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Feed PageView ─────────────────────────────────────────────────────────
  Widget _buildFeed() {
    final displayItems = _searchQuery.isEmpty ? _items : _filteredItems;

    if (displayItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _isRider
                    ? Icons.warning_amber_rounded
                    : Icons.electric_moped_rounded,
                size: 60,
                color: const Color(0xFF00D2FF).withValues(alpha: 0.3),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              _searchQuery.isNotEmpty
                  ? 'ไม่พบผลการค้นหา'
                  : (_isRider ? 'ยังไม่มีงานใหม่' : 'ไม่มีวินออนไลน์'),
              style: GoogleFonts.kanit(
                color: Colors.white70,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'ลองคำค้นหาอื่น'
                  : (_isRider ? 'ปัดลงเพื่อรีเฟรช' : 'ลองเรียกใหม่อีกครั้ง'),
              style: GoogleFonts.kanit(
                color: Colors.white38,
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: displayItems.length,
      itemBuilder: (context, index) {
        final item = displayItems[index];
        final key = ValueKey('wrs_${item.type.name}_${item.id}_$index');

        if (item.type == TukTukItemType.winRider) {
          return WinRiderPromoCard(
            key: key,
            onRegisterTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const RegisterScreen()),
            ),
          );
        }
        if (item.type == TukTukItemType.riderJob) {
          return RiderJobFeedCard(
            key: key,
            jobData: item.data,
            currentRiderId: _userId,
            onAccept: () => _acceptJob(item.id),
            onPass: () => _passJob(item.id),
            onChat: _userId == null
                ? null
                : () {
                    final customerId =
                        item.data['requesterId']?.toString() ?? '';
                    if (customerId.isEmpty) return;
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => WinRiderChatScreen(
                          currentUserId: _userId!,
                          riderId: customerId,
                          riderName: item.data['requesterName']?.toString() ??
                              'ลูกค้า',
                          riderPhotoUrl:
                              item.data['requesterPhotoUrl']?.toString(),
                        ),
                      ),
                    );
                  },
          );
        }
        if (item.type == TukTukItemType.riderProfile) {
          return WinRiderAvailableCard(
            key: key,
            riderData: item.data,
            currentUserId: _userId,
            onChat: _userId == null
                ? null
                : () {
                    final riderId = item.data['uid'] ??
                        item.data['userId'] ??
                        item.data['lineUserId'] ??
                        '';
                    if (riderId.isEmpty) return;
                    final vehicleMap = {
                      'motorcycle': '🏍️ มอเตอร์ไซค์',
                      'bicycle': '🚲 จักรยาน',
                      'pickup': '🛻 กระบะ',
                      'car': '🚗 รถยนต์',
                    };
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => WinRiderChatScreen(
                          currentUserId: _userId!,
                          riderId: riderId,
                          riderName: item.data['name'] ??
                              item.data['fullName'] ??
                              'วิน',
                          riderPhotoUrl: item.data['driverPhotoUrl']?.toString() ??
                              item.data['photoUrl']?.toString() ??
                              item.data['pictureUrl']?.toString(),
                          vehicleLabel: vehicleMap[item.data['vehicle']?.toString()],
                        ),
                      ),
                    );
                  },
            onRequestCreated: _listenToMyRequest,
          );
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildActiveBookingPanel() {
    final status = _activeRequest?['status'] as String? ?? 'pending';
    final riderName = _activeRequest?['riderName'] as String? ?? '';
    final riderPhone = _activeRequest?['riderPhone'] as String? ?? '';
    final plate = _activeRequest?['riderPlate'] as String? ?? '';
    final fare = _activeRequest?['estimatedPrice'] as num? ?? 0;

    // Status values match what web rider writes: pending→accepted→in_progress→completed
    const steps = ['pending', 'accepted', 'in_progress', 'completed'];
    final stepLabels = ['รอวิน', 'รับงานแล้ว', 'กำลังเดินทาง', 'เสร็จสิ้น'];
    final stepIcons = [
      Icons.hourglass_top_rounded,
      Icons.check_circle_rounded,
      Icons.electric_moped_rounded,
      Icons.star_rounded,
    ];
    final currentStep = steps.indexOf(status).clamp(0, steps.length - 1);
    final isTerminal = status == 'completed' || status == 'cancelled';
    final color = isTerminal
        ? (status == 'completed' ? Colors.green : Colors.red)
        : const Color(0xFF00C4CC);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1B3E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.5)),
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 12)],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header row
          InkWell(
            onTap: () => setState(() => _isPanelExpanded = !_isPanelExpanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  Icon(stepIcons[currentStep], color: color, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      status == 'cancelled'
                          ? 'ยกเลิกการเรียกวิน'
                          : 'สถานะ: ${stepLabels[currentStep]}',
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    '฿${fare.toStringAsFixed(0)}',
                    style: GoogleFonts.kanit(color: color, fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    _isPanelExpanded ? Icons.expand_more : Icons.expand_less,
                    color: Colors.white54,
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
          // Progress steps
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: List.generate(steps.length, (i) {
                final done = i <= currentStep;
                return Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: done ? color : Colors.white12,
                        ),
                        child: Icon(stepIcons[i], size: 12,
                            color: done ? Colors.white : Colors.white38,),
                      ),
                      if (i < steps.length - 1)
                        Expanded(
                          child: Container(
                            height: 2,
                            color: i < currentStep ? color : Colors.white12,
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 8),
          // Expanded detail
          if (_isPanelExpanded && riderName.isNotEmpty) ...[
            const Divider(color: Colors.white12, height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  _infoRow(Icons.person_rounded, 'วิน', riderName),
                  if (riderPhone.isNotEmpty)
                    _infoRow(Icons.phone_rounded, 'โทรศัพท์', riderPhone),
                  if (plate.isNotEmpty)
                    _infoRow(Icons.confirmation_number_rounded, 'ทะเบียน', plate),
                ],
              ),
            ),
          ],
          if (isTerminal)
            TextButton(
              onPressed: () => setState(() {
                _activeRequest = null;
                _activeRequestId = null;
              }),
              child: Text('ปิด', style: GoogleFonts.kanit(color: Colors.white54)),
            ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Icon(icon, color: Colors.white38, size: 16),
          const SizedBox(width: 8),
          Text('$label: ', style: GoogleFonts.kanit(color: Colors.white38, fontSize: 13)),
          Expanded(
            child: Text(value,
                style: GoogleFonts.kanit(color: Colors.white, fontSize: 13),
                overflow: TextOverflow.ellipsis,),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactNav() {
    return Container(
      height: 70,
      decoration: BoxDecoration(
        color: Colors.transparent,
        border: Border(
          top: BorderSide(
            color: Colors.white.withValues(alpha: 0.1),
          ),
        ),
      ),
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom > 0 ? 10 : 0,),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: _isRider
            ? [
                _buildNavItem(0, Icons.map_rounded, 'แผนที่'),
                _buildNavItem(1, Icons.history_rounded, 'งานของฉัน'),
                _buildNavItem(2, Icons.notifications_none_rounded, 'แจ้งเตือน'),
                _buildNavItem(3, Icons.person_outline_rounded, 'โปรไฟล์'),
              ]
            : [
                _buildNavItem(0, Icons.map_rounded, 'เรียกรถ'),
                _buildNavItem(1, Icons.history_rounded, 'ประวัติ'),
                _buildNavItem(2, Icons.local_offer_rounded, 'โปรโมชั่น'),
                _buildNavItem(3, Icons.person_outline_rounded, 'โปรไฟล์'),
              ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final bool isSelected = _selectedNavIndex == index;
    final Color activeColor =
        _isRider ? const Color(0xFF00D2FF) : const Color(0xFFFF9900);

    return GestureDetector(
      onTap: () {
        setState(() => _selectedNavIndex = index);
        _showInfoSnackBar('กำลังเปิด $label');
      },
      child: Container(
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? activeColor : Colors.white38,
              size: 22,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.kanit(
                color: isSelected ? activeColor : Colors.white38,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Custom Card Widgets (Placeholder - should be in separate file) ─────────
class WinRiderPromoCard extends StatelessWidget {
  final VoidCallback onRegisterTap;

  const WinRiderPromoCard({
    super.key,
    required this.onRegisterTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        border: Border.all(color: const Color(0xFF00D2FF).withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon Box
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00D2FF), Color(0xFF0088CC)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF00D2FF).withValues(alpha: 0.4),
                  blurRadius: 10,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: const Icon(Icons.electric_moped_rounded,
                color: Colors.white, size: 26,),
          ),
          const SizedBox(width: 16),
          // Text Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'มาเป็นครอบครัว WIN RIDER',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'อิสระสร้างรายได้ รับส่งพัสดุ 24 ชม.',
                  style: GoogleFonts.kanit(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Call to Action Button
          ElevatedButton(
            onPressed: onRegisterTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00D2FF),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: Size.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              elevation: 0,
            ),
            child: Text(
              'สมัครเลย',
              style: GoogleFonts.kanit(
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class RiderJobFeedCard extends StatelessWidget {
  final Map<String, dynamic> jobData;
  final String? currentRiderId;
  final VoidCallback onAccept;
  final VoidCallback onPass;
  final VoidCallback? onChat;

  const RiderJobFeedCard({
    super.key,
    required this.jobData,
    required this.currentRiderId,
    required this.onAccept,
    required this.onPass,
    this.onChat,
  });

  @override
  Widget build(BuildContext context) {
    final distance = jobData['distance'] ?? 0.0;
    final price = jobData['price'] ?? 0;
    final pickup = jobData['pickupAddress'] ?? 'ไม่ระบุ';
    final dropoff = jobData['dropoffAddress'] ?? 'ไม่ระบุ';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child:
                        const Icon(Icons.delivery_dining, color: Colors.orange),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'งานใหม่ ระยะทาง ${distance.toStringAsFixed(1)} กม.',
                          style: GoogleFonts.kanit(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'ค่าส่ง ฿$price',
                          style: GoogleFonts.kanit(
                            color: Colors.orange,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(color: Colors.white10, height: 30),
              _buildLocationRow(Icons.my_location, 'จุดรับ', pickup),
              const SizedBox(height: 12),
              _buildLocationRow(Icons.location_on, 'จุดส่ง', dropoff),
              const SizedBox(height: 20),
              Row(
                children: [
                  // Pass button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onPass,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.05),
                        foregroundColor: Colors.white70,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                          side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                      ),
                      child: Text('ส่งต่อ', style: GoogleFonts.kanit()),
                    ),
                  ),
                  // Chat button (middle) — lets rider message the customer
                  if (onChat != null) ...[
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: onChat,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF00D2FF),
                        side: const BorderSide(color: Color(0xFF00D2FF)),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 14,),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: const Icon(
                        Icons.chat_bubble_outline_rounded,
                        size: 18,
                      ),
                    ),
                  ],
                  const SizedBox(width: 8),
                  // Accept button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onAccept,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: Text('รับงาน', style: GoogleFonts.kanit()),
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

  Widget _buildLocationRow(IconData icon, String label, String address) {
    return Row(
      children: [
        Icon(icon, color: Colors.white38, size: 18),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.kanit(
                  color: Colors.white38,
                  fontSize: 11,
                ),
              ),
              Text(
                address,
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 14,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class WinRiderAvailableCard extends StatelessWidget {
  final Map<String, dynamic> riderData;
  final String? currentUserId;
  final VoidCallback? onChat;
  final void Function(String requestId)? onRequestCreated;

  const WinRiderAvailableCard({
    super.key,
    required this.riderData,
    this.currentUserId,
    this.onChat,
    this.onRequestCreated,
  });

  static const _vehicleMap = {
    'motorcycle': '🏍️ มอเตอร์ไซค์',
    'bicycle': '🚲 จักรยาน',
    'pickup': '🛻 กระบะ',
    'car': '🚗 รถยนต์',
  };

  Future<void> _bookRider(BuildContext context) async {
    if (currentUserId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กรุณาเข้าสู่ระบบก่อนเรียกวิน')),
      );
      return;
    }

    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กำลังส่งคำขอเรียกวิน...'),
          duration: Duration(seconds: 1),
        ),
      );

      final riderId =
          riderData['uid'] ?? riderData['userId'] ?? riderData['lineUserId'] ?? '';
      if (riderId.isEmpty) return;

      // Gather customer identity from session / FirebaseAuth
      final fbUser = FirebaseAuth.instance.currentUser;
      final session = await TukTukBridge().getCurrentUser();
      final requesterName = session?['displayName'] ??
          session?['name'] ??
          fbUser?.displayName ??
          'ลูกค้า';
      final requesterPhone =
          session?['phone'] ?? fbUser?.phoneNumber ?? '';

      final pos = await TukTukLocationService()
          .getCurrentLocationAndSync()
          .timeout(const Duration(seconds: 8), onTimeout: () => null);

      // Resolve nearest station for routing priority
      final stationInfo = pos != null
          ? await resolveNearestStation(pos.latitude, pos.longitude)
          : null;

      final docRef = await FirebaseFirestore.instance.collection('win_rider_requests').add({
        'requesterId': currentUserId,
        'targetRiderId': riderId,   // pre-selected rider
        'riderId': null,            // filled by rider on accept
        'status': 'pending',        // matches rider dashboard query
        'rejectedBy': [],           // required for rider pass-job filter
        'requesterName': requesterName,
        'requesterPhone': requesterPhone,
        'pickupAddress': pos != null
            ? 'GPS (${pos.latitude.toStringAsFixed(5)}, ${pos.longitude.toStringAsFixed(5)})'
            : 'ไม่ทราบตำแหน่ง',
        'deliveryAddress': 'ปลายทางตามที่ตกลง',
        'pickupLat': pos?.latitude,
        'pickupLng': pos?.longitude,
        'estimatedPrice': (riderData['basePrice'] as num?)?.toInt() ?? 25,
        'serviceType': 'ride',
        'stationId':   stationInfo?['id'],
        'stationName': stationInfo?['name'],
        'routingMode': stationInfo != null ? 'station_first' : 'broadcast',
        'createdAt': FieldValue.serverTimestamp(),
        'type': 'direct_call',
        'source': 'flutter_app',
      });
      onRequestCreated?.call(docRef.id); // real-time status tracking for customer

      await FirebaseFirestore.instance.collection('notifications').add({
        'recipientId': riderId,
        'title': '🔔 มีลูกค้าเรียกคุณ!',
        'text': 'มีลูกค้าต้องการใช้บริการในบริเวณใกล้เคียง',
        'type': 'win_rider_call',
        'createdAt': FieldValue.serverTimestamp(),
        'isRead': false,
      });

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ส่งคำขอสำเร็จ! กรุณารอวินตอบกลับ'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('เกิดข้อผิดพลาดในการเรียกวิน'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = riderData['name'] ?? riderData['fullName'] ?? 'วิน';
    final plate = riderData['plate'] ?? 'ไม่ระบุ';
    final rating = riderData['rating'] ?? 4.5;
    final distance = (riderData['distance'] as num?)?.toDouble() ?? 1.2;
    final vehicleType = riderData['vehicle']?.toString() ?? '';
    final vehicleLabel = _vehicleMap[vehicleType] ?? '🏍️ มอเตอร์ไซค์';

    // Photo priority: driverPhotoUrl (from registration) → photoUrl → pictureUrl
    final driverPhotoUrl =
        riderData['driverPhotoUrl']?.toString().isNotEmpty == true
            ? riderData['driverPhotoUrl'].toString()
            : riderData['photoUrl']?.toString().isNotEmpty == true
                ? riderData['photoUrl'].toString()
                : riderData['pictureUrl']?.toString();

    final vehiclePhotoUrl = riderData['vehiclePhotoUrl']?.toString();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white.withValues(alpha: 0.05),
            Colors.white.withValues(alpha: 0.02),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header row: avatar + info ──────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Driver photo with online dot
              Stack(
                children: [
                  CircleAvatar(
                    radius: 38,
                    backgroundColor:
                        const Color(0xFF00D2FF).withValues(alpha: 0.15),
                    backgroundImage: driverPhotoUrl != null
                        ? CachedNetworkImageProvider(driverPhotoUrl)
                        : null,
                    child: driverPhotoUrl == null
                        ? const Icon(Icons.person,
                            color: Colors.white38, size: 34,)
                        : null,
                  ),
                  Positioned(
                    bottom: 2,
                    right: 2,
                    child: Container(
                      width: 14,
                      height: 14,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.fromBorderSide(
                          BorderSide(color: Color(0xFF0A0E21), width: 2),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              // Name + badges
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    // Vehicle type badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 3,),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00D2FF).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              const Color(0xFF00D2FF).withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        vehicleLabel,
                        style: GoogleFonts.kanit(
                          color: const Color(0xFF00D2FF),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        // Rating
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2,),
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.star_rounded,
                                  color: Colors.amber, size: 13,),
                              const SizedBox(width: 3),
                              Text(
                                rating.toString(),
                                style: const TextStyle(
                                    color: Colors.amber, fontSize: 11,),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Distance
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2,),
                          decoration: BoxDecoration(
                            color: Colors.blue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.near_me_rounded,
                                  color: Colors.blue, size: 13,),
                              const SizedBox(width: 3),
                              Text(
                                '${distance.toStringAsFixed(1)} กม.',
                                style: const TextStyle(
                                    color: Colors.blue, fontSize: 11,),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Vehicle photo thumbnail (if available)
              if (vehiclePhotoUrl != null && vehiclePhotoUrl.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: vehiclePhotoUrl,
                      width: 64,
                      height: 64,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        width: 64,
                        height: 64,
                        color: Colors.white.withValues(alpha: 0.05),
                        child: const Icon(Icons.directions_car_rounded,
                            color: Colors.white24, size: 28,),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        width: 64,
                        height: 64,
                        color: Colors.white.withValues(alpha: 0.05),
                        child: const Icon(Icons.directions_car_rounded,
                            color: Colors.white24, size: 28,),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),

          // ── Plate row ──────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(14),
              border:
                  Border.all(color: Colors.white.withValues(alpha: 0.07)),
            ),
            child: Row(
              children: [
                const Icon(Icons.confirmation_number_rounded,
                    color: Colors.orange, size: 18,),
                const SizedBox(width: 10),
                Text(
                  'ทะเบียน: $plate',
                  style: GoogleFonts.kanit(
                      color: Colors.white70, fontSize: 14,),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // ── Action buttons ─────────────────────────────────────────────
          Row(
            children: [
              // Chat button
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onChat,
                  icon: const Icon(Icons.chat_bubble_outline_rounded,
                      size: 16,),
                  label: Text(
                    'แชท',
                    style: GoogleFonts.kanit(fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF00D2FF),
                    side: const BorderSide(color: Color(0xFF00D2FF)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Book button
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: () => _bookRider(context),
                  icon: const Icon(Icons.electric_moped_rounded, size: 18),
                  label: Text(
                    'เรียกวินนี้',
                    style: GoogleFonts.kanit(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00D2FF),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
