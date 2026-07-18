import 'dart:async';
import 'dart:ui';

import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/screens/activity_screen.dart';
import 'package:caculateapp/tuktuk/screens/community_post_screen.dart';
import 'package:caculateapp/tuktuk/screens/create_post_screen.dart';
import 'package:caculateapp/tuktuk/screens/idea_lab_screen.dart';
import 'package:caculateapp/tuktuk/screens/login_screen.dart';
import 'package:caculateapp/tuktuk/screens/marketplace_screen.dart';
import 'package:caculateapp/tuktuk/screens/message_list_screen.dart';
import 'package:caculateapp/tuktuk/screens/post_product_screen.dart';
import 'package:caculateapp/tuktuk/screens/profile_screen.dart';
import 'package:caculateapp/tuktuk/screens/register_screen.dart';
import 'package:caculateapp/tuktuk/screens/seller_dashboard_screen.dart';
import 'package:caculateapp/tuktuk/screens/unified_search_screen.dart';
import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/tuktuk_item.dart';
import 'package:caculateapp/tuktuk/widgets/career_hub_view.dart';
import 'package:caculateapp/tuktuk/widgets/feed/creation_wheel.dart';
import 'package:caculateapp/tuktuk/widgets/feed/featured_seller_card.dart';
import 'package:caculateapp/tuktuk/widgets/feed/feed_tab_state.dart';
import 'package:caculateapp/tuktuk/widgets/feed/idea_lab_card.dart';
import 'package:caculateapp/tuktuk/widgets/feed/recommendation_card.dart';
import 'package:caculateapp/tuktuk/widgets/feed/welcome_card.dart';
import 'package:caculateapp/tuktuk/widgets/vertical_feed_view.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:rxdart/rxdart.dart';

class TukTukFeedScreen extends StatefulWidget {
  const TukTukFeedScreen({super.key});

  @override
  State<TukTukFeedScreen> createState() => _TukTukFeedScreenState();
}

class _TukTukFeedScreenState extends State<TukTukFeedScreen>
    with AutomaticKeepAliveClientMixin, TickerProviderStateMixin {
  @override
  bool get wantKeepAlive => true;

  late TabController _topTabController;
  final List<FeedTabState> _feedTabStates = List.generate(3, FeedTabState.new);

  int _selectedTabIndex = 0;
  int _selectedNavIndex = 0;
  bool _isAutoScrollEnabled = true;
  bool _isGlobalMuted = false; // 🔇 Global feed mute toggle
  bool _isPillExpanded = false; // 📦 Notification+Mute pill expand state

  // Shared variables (user-specific, not tab-specific)
  List<String> _userLikedIds = [];
  List<String> _userInterestedCategories = [];
  Map<String, int> _userInterestScores = {}; // ✅ AI Personalized Scoring
  final Map<int, bool> _isFetchingMap = {}; // ✅ Fetch Guard
  final Set<int> _activatedIndexes = {0}; // Track which tabs have been built
  final bool _isUiVisible = true; // ✅ Smart UI Visibility
  final String _communityFilter = 'all'; // ✅ Community Filter
  String? _selectedProvince; // ✅ Location-based Feed
  final List<String> _provinces = [
    'กรุงเทพมหานคร',
    'กระบี่',
    'กาญจนบุรี',
    'กาฬสินธุ์',
    'กำแพงเพชร',
    'ขอนแก่น',
    'จันทบุรี',
    'ฉะเชิงเทรา',
    'ชลบุรี',
    'ชัยนาท',
    'ชัยภูมิ',
    'ชุมพร',
    'เชียงราย',
    'เชียงใหม่',
    'ตรัง',
    'ตราด',
    'ตาก',
    'นครนายก',
    'นครปฐม',
    'นครพนม',
    'นครราชสีมา',
    'นครศรีธรรมราช',
    'นครสวรรค์',
    'นนทบุรี',
    'นราธิวาส',
    'น่าน',
    'บึงกาฬ',
    'บุรีรัมย์',
    'ปทุมธานี',
    'ประจวบคีรีขันธ์',
    'ปราจีนบุรี',
    'ปัตตานี',
    'พระนครศรีอยุธยา',
    'พะเยา',
    'พังงา',
    'พัทลุง',
    'พิจิตร',
    'พิษณุโลก',
    'เพชรบุรี',
    'เพชรบูรณ์',
    'แพร่',
    'ภูเก็ต',
    'มหาสารคาม',
    'มุกดาหาร',
    'แม่ฮ่องสอน',
    'ยโสธร',
    'ยะลา',
    'ร้อยเอ็ด',
    'ระนอง',
    'ระยอง',
    'ราชบุรี',
    'ลพบุรี',
    'ลำปาง',
    'ลำพูน',
    'เลย',
    'ศรีสะเกษ',
    'สกลนคร',
    'สงขลา',
    'สตูล',
    'สมุทรปราการ',
    'สมุทรสงคราม',
    'สมุทรสาคร',
    'สระแก้ว',
    'สระบุรี',
    'สิงห์บุรี',
    'สุโขทัย',
    'สุพรรณบุรี',
    'สุราษฎร์ธานี',
    'สุรินทร์',
    'หนองคาย',
    'หนองบัวลำภู',
    'อ่างทอง',
    'อำนาจเจริญ',
    'อุดรธานี',
    'อุตรดิตถ์',
    'อุทัยธานี',
    'อุบลราชธานี',
  ];

  final double _searchRadius =
      5.0; // ✅ Fixed 5km for automated nearby logic per USER request
  final bool _showRadiusSlider =
      false; // Note: Currently unused as logic is automated

  // State variables for authentication
  String? _userId;
  bool _isLoggedIn = false;
  bool _isRider = false; // ✅ Added rider flag
  StreamSubscription<User?>? _authSubscription;

  // Real-time update monitoring
  StreamSubscription<QuerySnapshot>? _realtimeSubscription;
  String? _lastTopId;
  bool _hasNewContent = false;

  void _toggleAutoScroll() {
    setState(() {
      _isAutoScrollEnabled = !_isAutoScrollEnabled;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isAutoScrollEnabled
              ? 'เปิดเล่นอัตโนมัติแล้ว'
              : 'ปิดเล่นอัตโนมัติแล้ว',
        ),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  void initState() {
    super.initState();

    // Initial check for authentication
    final user = FirebaseAuth.instance.currentUser;
    _userId = user?.uid;
    _isLoggedIn = user != null;
    if (_userId != null) _checkRiderStatus(_userId!);

    // Listen for auth state changes
    _authSubscription = FirebaseAuth.instance.authStateChanges().listen((user) {
      if (mounted) {
        setState(() {
          _userId = user?.uid;
          _isLoggedIn = user != null;
        });
        if (user != null) {
          _checkRiderStatus(user.uid);
          TukTukBridge().getCurrentUser(); // Trigger session sync
        }
      }
    });

    // Also listen to TukTukBridge session (important for LINE users)
    TukTukBridge().sessionStream.listen((session) {
      if (mounted && session != null) {
        setState(() {
          _userId = session['uid'] ?? session['lineUserId'];
          if (_userId != null) _isLoggedIn = true;
        });
        if (_userId != null) _checkRiderStatus(_userId!);
      }
    });

    // Immediate check of bridge session
    TukTukBridge().getCurrentUser().then((session) {
      if (mounted && session != null) {
        setState(() {
          _userId = session['uid'] ?? session['lineUserId'];
          if (_userId != null) _isLoggedIn = true;
        });
        if (_userId != null) _checkRiderStatus(_userId!);
      }
    });

    _topTabController = TabController(length: 3, vsync: this);
    _topTabController.addListener(() {
      if (_topTabController.indexIsChanging) return;

      final int newIndex = _topTabController.index;
      if (_selectedTabIndex != newIndex) {
        setState(() {
          _selectedTabIndex = newIndex;
        });

        // Smart Fetch: Only if empty and not fetching
        final state = _feedTabStates[newIndex];
        if (state.items.isEmpty &&
            !state.isLoading &&
            _isFetchingMap[newIndex] != true) {
          _fetchData(tabIndex: newIndex);
        }
      }
    });

    _fetchData(tabIndex: 0).then((_) {
      _initRealtimeListener();
      _checkLocationPermission();
    });
  }

  void _initLocation() async {
    // This function is now merged into _checkLocationPermission
    // and is kept here as a placeholder or for future separate logic.
  }

  void _checkLocationPermission() async {
    // Small delay to let the UI settle
    await Future.delayed(const Duration(seconds: 4));
    if (!mounted) return;

    final bool isLocationReady = await TukTukLocationService()
        .checkServiceAndPermission(context: context);

    if (isLocationReady && mounted) {
      debugPrint('Location service ready');
      final pos = await TukTukLocationService().getCurrentLocationAndSync();
      if (pos != null && mounted) {
        final addr = await TukTukLocationService()
            .getAddressFromCoords(pos.latitude, pos.longitude);
        if (addr['province'] != null && mounted) {
          setState(() => _selectedProvince = addr['province']);
          _fetchData(isRefresh: true, tabIndex: 1);
          _fetchData(isRefresh: true, tabIndex: 2);
        }
      }
    }
  }

  void _initRealtimeListener() {
    _realtimeSubscription?.cancel();

    // Listen for the very latest post to know if we should show "New Post" indicator
    _realtimeSubscription = FirebaseFirestore.instance
        .collection('posts')
        .orderBy('createdAt', descending: true)
        .limit(1)
        .snapshots()
        .listen((snapshot) {
      if (snapshot.docs.isNotEmpty) {
        final newestId = snapshot.docs.first.id;

        // Update top ID if we don't have one (initial load)
        if (_lastTopId == null && _feedTabStates[0].items.isNotEmpty) {
          final firstItem = _feedTabStates[0].items.firstWhere(
                (item) => item.type != TukTukItemType.welcome,
                orElse: () => _feedTabStates[0].items.first,
              );
          _lastTopId = firstItem.id;
        }

        // If newest ID is different from our last known top ID, we have new content
        if (_lastTopId != null && newestId != _lastTopId && !_hasNewContent) {
          setState(() {
            _hasNewContent = true;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _topTabController.dispose();
    _realtimeSubscription?.cancel();
    _authSubscription?.cancel();
    for (final state in _feedTabStates) {
      state.pageController.dispose();
    }
    super.dispose();
  }

  Future<void> _checkRiderStatus(String uid) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('win_riders')
          .doc(uid)
          .get();
      if (mounted) {
        setState(() => _isRider = doc.exists);
        // If we are on the service tab, refresh it with the new role
        if (_selectedTabIndex == 2) {
          _fetchData(isRefresh: true, tabIndex: 2);
        }
      }
    } catch (e) {
      debugPrint('Error checking rider status: $e');
    }
  }

  /// 🧠 Smart Feed Algorithm: Fetch & Sort by Distance
  Future<List<TukTukItem>> _fetchSmartNearbyProducts(String uid) async {
    try {
      Position? pos;
      try {
        // Try getting cached position quickly
        pos = await TukTukLocationService()
            .getCurrentLocationAndSync()
            .timeout(const Duration(seconds: 2));
      } catch (_) {}

      // 1. Fallback if no location data
      if (pos == null &&
          (_selectedProvince == null || _selectedProvince!.isEmpty)) {
        final Query q = FirebaseFirestore.instance
            .collection('marketplace_items')
            .where('status', isEqualTo: 'active')
            .orderBy('createdAt', descending: true)
            .limit(20);
        final snap = await q.get();
        return snap.docs.map(TukTukItem.fromProduct).toList();
      }

      // 2. Query by Province (Broad Filter)
      Query q = FirebaseFirestore.instance
          .collection('marketplace_items')
          .where('status', isEqualTo: 'active');

      if (_selectedProvince != null && _selectedProvince!.isNotEmpty) {
        q = q.where('sellerLocation', isEqualTo: _selectedProvince);
      }

      // Fetch larger batch to allow sorting
      q = q.limit(50);

      final snap = await q.get();
      final items = snap.docs.map(TukTukItem.fromProduct).toList();

      // 3. Radius-Based Sorting (1km, 5km, 10km prioritization)
      if (pos != null) {
        items.sort((a, b) {
          final double latA = (a.data['lat'] ?? 0).toDouble();
          final double lngA = (a.data['lng'] ?? 0).toDouble();
          final double latB = (b.data['lat'] ?? 0).toDouble();
          final double lngB = (b.data['lng'] ?? 0).toDouble();

          // Push items without location to the bottom
          if (latA == 0) return 1;
          if (latB == 0) return -1;

          final distA = Geolocator.distanceBetween(
            pos!.latitude,
            pos.longitude,
            latA,
            lngA,
          );
          final distB = Geolocator.distanceBetween(
            pos.latitude,
            pos.longitude,
            latB,
            lngB,
          );

          return distA.compareTo(distB);
        });

        // 4. Apply Dynamic Radius Filter (km to meters conversion)
        final radiusInMeters = _searchRadius * 1000;
        final filteredItems = items.where((item) {
          final double lat = (item.data['lat'] ?? 0).toDouble();
          final double lng = (item.data['lng'] ?? 0).toDouble();
          if (lat == 0) return false;
          final distance = Geolocator.distanceBetween(
            pos!.latitude,
            pos.longitude,
            lat,
            lng,
          );
          return distance <= radiusInMeters;
        }).toList();

        return filteredItems.take(20).toList();
      }

      return items.take(20).toList(); // Return top 20 closest if no pos
    } catch (e) {
      debugPrint('Smart Feed Error: $e');
      return [];
    }
  }

  Future<void> _fetchData({bool isRefresh = true, int? tabIndex}) async {
    final targetTabIndex = tabIndex ?? _selectedTabIndex;
    final state = _feedTabStates[targetTabIndex];

    if (!mounted) return;
    if (_isFetchingMap[targetTabIndex] == true) return;
    if (state.isLoading && !isRefresh) return;

    _isFetchingMap[targetTabIndex] = true;

    // ── Instant cache: show Firestore offline data before any network call ──
    // Only for initial load (items empty). The network fetch below will
    // replace this with fresh data once it arrives.
    if (isRefresh && state.items.isEmpty && targetTabIndex == 0) {
      try {
        final cacheSnap = await FirebaseFirestore.instance
            .collection('posts')
            .where('status', isEqualTo: 'active')
            .orderBy('createdAt', descending: true)
            .limit(20)
            .get(const GetOptions(source: Source.cache));
        if (cacheSnap.docs.isNotEmpty && mounted) {
          setState(() {
            state.items = cacheSnap.docs.map(TukTukItem.fromPost).toList();
            state.isInitialLoading = false;
          });
          debugPrint('⚡ Instant cache: ${cacheSnap.docs.length} posts shown');
        }
      } catch (_) {
        // Cache miss on first install — network will cover it
      }
    }

    state.isLoading = true;
    if (isRefresh) {
      state.errorMessage = null;
      if (state.items.isEmpty) {
        state.isInitialLoading = true;
      }
    }

    try {
      debugPrint(
        'Fetching data (isRefresh: $isRefresh, Tab: $targetTabIndex)...',
      );
      final currentUser = FirebaseAuth.instance.currentUser;
      final String uid = currentUser?.uid ?? 'guest';

      // 1. Global Context Fetching (Personalization)
      if (isRefresh && uid != 'guest') {
        try {
          final userDoc = await FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .get()
              .timeout(const Duration(seconds: 8));
          if (userDoc.exists) {
            final data = userDoc.data();
            _userInterestedCategories =
                List<String>.from(data?['interests'] ?? []);
          }
          final likeDoc = await FirebaseFirestore.instance
              .collection('user_likes')
              .doc(uid)
              .get()
              .timeout(const Duration(seconds: 8));
          if (likeDoc.exists) {
            _userLikedIds = List<String>.from(likeDoc.data()?['postIds'] ?? []);
          }
          final scoreSnapshot = await FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .collection('interest_scores')
              .get()
              .timeout(const Duration(seconds: 8));
          _userInterestScores = {
            for (final doc in scoreSnapshot.docs)
              doc.id: (doc.data()['score'] ?? 0) as int,
          };
        } catch (e) {
          debugPrint('TukTukAlgorithm: Context update failed: $e');
        }
      }

      // --- LIVE SESSION FETCHING ---
      List<TukTukItem> liveSessions = [];
      if (isRefresh && (targetTabIndex == 0 || targetTabIndex == 1)) {
        try {
          final goLive = await TukTukBridge()
              .getGoLiveSessions(limit: 5)
              .timeout(const Duration(seconds: 3), onTimeout: () => []);
          if (goLive.isNotEmpty) {
            liveSessions = goLive.map(TukTukItem.fromLive).toList();
            debugPrint(
              '🎥 Go Engine: Live Sessions Loaded (${liveSessions.length})',
            );
          }
        } catch (e) {
          debugPrint('⚠️ Live Fetch failed: $e');
        }
      }

      List<TukTukItem> finalPosts = [];
      List<TukTukItem> finalProducts = [];
      DocumentSnapshot? newLastPostDoc;
      DocumentSnapshot? newLastProductDoc;
      bool usedGo = false;

      // --- ULTRA FAST GO ENGINE INTERCEPTION ---
      if (isRefresh) {
        try {
          if (targetTabIndex == 0) {
            final goPosts = await TukTukBridge()
                .getGoPowerfulFeed()
                .timeout(const Duration(seconds: 3), onTimeout: () => []);
            if (goPosts.isNotEmpty) {
              finalPosts = goPosts
                  .map((m) => TukTukItem.fromMap(m, 'posts'))
                  .toList();
              usedGo = true;
              debugPrint('🚀 Go Engine: For You Powered');
            }
          } else if (targetTabIndex == 1) {
            // NEARBY / LOCATION BASED FEED
            if (_selectedProvince != null && _selectedProvince!.isNotEmpty) {
              // Priority: Find products in this province
              Query pq = FirebaseFirestore.instance
                  .collection('marketplace_items')
                  .where('status', isEqualTo: 'active')
                  .where('sellerLocation', isEqualTo: _selectedProvince)
                  .orderBy('createdAt', descending: true)
                  .limit(15);

              if (!isRefresh && state.lastProductDoc != null) {
                pq = pq.startAfterDocument(state.lastProductDoc!);
              }

              final psnap = await pq.get().timeout(const Duration(seconds: 10));
              newLastProductDoc =
                  psnap.docs.isNotEmpty ? psnap.docs.last : null;
              finalProducts = psnap.docs.map(TukTukItem.fromProduct).toList();

              // Also find community posts in this province
              Query cq = FirebaseFirestore.instance
                  .collection('posts')
                  .where('province', isEqualTo: _selectedProvince)
                  .orderBy('createdAt', descending: true)
                  .limit(15);

              if (!isRefresh && state.lastPostDoc != null) {
                cq = cq.startAfterDocument(state.lastPostDoc!);
              }

              final csnap = await cq.get().timeout(const Duration(seconds: 10));
              newLastPostDoc = csnap.docs.isNotEmpty ? csnap.docs.last : null;
              finalPosts = csnap.docs.map(TukTukItem.fromPost).toList();

              usedGo = true;

              // If both are empty, we might want to fallback to trending or show empty
              if (finalPosts.isEmpty && finalProducts.isEmpty && isRefresh) {
                final goTrending = await TukTukBridge()
                    .getGoTrendingFeed()
                    .timeout(const Duration(seconds: 3), onTimeout: () => []);
                if (goTrending.isNotEmpty) {
                  finalPosts = goTrending
                      .map((m) => TukTukItem.fromMap(m, 'posts'))
                      .toList();
                  debugPrint(
                    '🔥 Go Engine: Nearby had no results, fallback to Trending',
                  );
                }
              }
            } else {
              // FALLBACK TO TRENDING IF NO PROVINCE SELECTED
              final goTrending = await TukTukBridge()
                  .getGoTrendingFeed()
                  .timeout(const Duration(seconds: 3), onTimeout: () => []);
              if (goTrending.isNotEmpty) {
                finalPosts = goTrending
                    .map((m) => TukTukItem.fromMap(m, 'posts'))
                    .toList();
                usedGo = true;
                debugPrint(
                  '🔥 Go Engine: Trending Powered (No Province Selected)',
                );
              }
            }
          }
        } catch (e) {
          debugPrint('⚠️ Go Fallback: $e');
        }
      }

      // 2. Fetch Logic Based on Tab (Only if Go wasn't used)
      if (!usedGo) {
        if (targetTabIndex == 0) {
          Query q = FirebaseFirestore.instance
              .collection('posts')
              .where('status', isEqualTo: 'active')
              .orderBy('createdAt', descending: true)
              .limit(20);

          if (!isRefresh && state.lastPostDoc != null) {
            q = q.startAfterDocument(state.lastPostDoc!);
          }

          final snap = await q.get().timeout(const Duration(seconds: 10));
          newLastPostDoc = snap.docs.isNotEmpty ? snap.docs.last : null;
          finalPosts = snap.docs.map(TukTukItem.fromPost).toList();
        } else if (targetTabIndex == 1) {
          // Standard tab 1 (Nearby) - fetched if Go didn't handle it
          final smartItems = await _fetchSmartNearbyProducts(uid);
          finalProducts = smartItems;
        } else if (targetTabIndex == 2) {
          // --- RIDERS / SERVICE TAB (Occupational Hub) ---
          List<TukTukItem> occupationalItems = [];
          if (_isRider) {
            // RIDER VIEW: See matching jobs (Pending status)
            Query q = FirebaseFirestore.instance
                .collection('win_rider_requests')
                .where('status', isEqualTo: 'pending')
                .orderBy('createdAt', descending: true)
                .limit(20);
            if (!isRefresh && state.lastPostDoc != null) {
              q = q.startAfterDocument(state.lastPostDoc!);
            }
            final snap = await q.get().timeout(const Duration(seconds: 10));
            newLastPostDoc = snap.docs.isNotEmpty ? snap.docs.last : null;
            occupationalItems = snap.docs.map(TukTukItem.fromRiderJob).toList();
          } else {
            // CUSTOMER VIEW: See nearby riders
            Query q = FirebaseFirestore.instance
                .collection('win_riders')
                .where('isOnline', isEqualTo: true)
                .limit(20);

            if (_selectedProvince != null && _selectedProvince!.isNotEmpty) {
              q = q.where('province', isEqualTo: _selectedProvince);
            }

            final snap = await q.get().timeout(const Duration(seconds: 10));
            occupationalItems =
                snap.docs.map(TukTukItem.fromRiderProfile).toList();
          }

          // Inject Win Rider promo if no riders found (Customer View)
          if (!_isRider && occupationalItems.isEmpty) {
            occupationalItems = [TukTukItem.winRiderPromo()];
          }
          finalPosts = occupationalItems;
        }
      }

      // 📰 ACCURATE NEWS DATA FETCH (PRIORITIZE GO ENGINE)
      List<TukTukItem> realNews = [];
      if (isRefresh && (targetTabIndex == 0 || targetTabIndex == 1)) {
        try {
          final goNews = await TukTukBridge().getGoVerifiedNews();
          if (goNews.isNotEmpty) {
            // News from Go are already Map<String, dynamic> due to bridge fix, but we can be safe
            realNews =
                goNews.map((m) => TukTukItem.fromMap(m, 'news_feed')).toList();
          }
          if (realNews.isEmpty) {
            Query nq = FirebaseFirestore.instance
                .collection('news_feed')
                .where('status', isEqualTo: 'active')
                .orderBy('createdAt', descending: true)
                .limit(10);
            final nsnap = await nq.get();
            realNews = nsnap.docs.map(TukTukItem.fromInfoCard).toList();
          }
        } catch (e) {
          debugPrint('Error fetching verification news: $e');
        }
      }

      // ─── COMPILE & MIX THE FEED ───
      final List<TukTukItem> compiledItems = [];

      // Interleave items based on type
      int liveIndex = 0;
      int productIndex = 0;

      for (int i = 0; i < finalPosts.length; i++) {
        compiledItems.add(finalPosts[i]);

        // Inject live every 3 posts
        if (i % 3 == 0 && liveIndex < liveSessions.length) {
          compiledItems.add(liveSessions[liveIndex++]);
        }
        // Inject product every 5
        if (i % 5 == 0 && productIndex < finalProducts.length) {
          compiledItems.add(finalProducts[productIndex++]);
        }
      }

      // Append remaining items
      if (productIndex < finalProducts.length) {
        compiledItems.addAll(finalProducts.sublist(productIndex));
      }

      // Mix news/infocards into Feed 1 & 2
      if (isRefresh &&
          (targetTabIndex == 0 || targetTabIndex == 1) &&
          realNews.isNotEmpty) {
        for (int i = 0; i < realNews.length; i++) {
          final int pos = (i + 1) * 4;
          if (pos < compiledItems.length) {
            compiledItems.insert(pos, realNews[i]);
          } else {
            compiledItems.add(realNews[i]);
          }
        }
      }

      final bool shouldShowIdeaLab = await TukTukBridge().shouldShowIdeaLab();

      if (mounted) {
        // Collect all items to inject
        final List<TukTukItem> finalItems = List.from(compiledItems);

        // 📰 News is already interleaved above, no need to insertAll(0, realNews)
        // which was causing the feed to be dominated by news cards at the start.

        // 🛡️ Registration/Recommendation Injection
        if (!_isLoggedIn &&
            finalItems.length >= 10 &&
            !finalItems.any((i) => i.type == TukTukItemType.recommendation)) {
          final insertIndex = finalItems.length >= 10 ? 10 : finalItems.length;
          finalItems.insert(
            insertIndex,
            TukTukItem(
              id: 'feed_register_recommendation',
              type: TukTukItemType.recommendation,
              data: {},
              collectionName: 'system',
            ),
          );
        }

        // 🔬 Inject TukTuk Idea Lab
        if (isRefresh &&
            finalItems.length >= 3 &&
            !finalItems.any((i) => i.id == 'feed_idea_lab_card') &&
            shouldShowIdeaLab) {
          finalItems.insert(
            2,
            TukTukItem(
              id: 'feed_idea_lab_card',
              type: TukTukItemType.ideaLab,
              data: {},
              collectionName: 'system',
            ),
          );
        }

        debugPrint(
            '✅ Feed Compiled: ${finalItems.length} items (Videos: ${finalItems.where((i) => i.type == TukTukItemType.video).length}, Images: ${finalItems.where((i) => i.type == TukTukItemType.image).length}, Prod: ${finalItems.where((i) => i.type == TukTukItemType.product).length}, News: ${finalItems.where((i) => i.type == TukTukItemType.infoCard).length})');

        // ONE BATCH UPDATE TO REDUCE REBUILDS
        if (isRefresh) {
          state.replaceItems(finalItems);
          state.hasMore = true;
        } else {
          state.appendItems(compiledItems); // Append only the new ones
        }

        if (newLastPostDoc != null) state.lastPostDoc = newLastPostDoc;
        if (newLastProductDoc != null) {
          state.lastProductDoc = newLastProductDoc;
        }

        if (!isRefresh && finalPosts.isEmpty && finalProducts.isEmpty) {
          state.hasMore = false;
        }

        state.isInitialLoading = false;
        state.isLoading = false;

        if (isRefresh && targetTabIndex == 0 && state.items.isNotEmpty) {
          setState(() => _hasNewContent = false);
          final firstReal = state.items.firstWhere(
            (item) => item.type != TukTukItemType.welcome,
            orElse: () => state.items.first,
          );
          _lastTopId = firstReal.id;
        }

        if (isRefresh && targetTabIndex == 0) {
          final pc = _feedTabStates[0].pageController;
          if (pc.hasClients && (pc.page ?? 0) > 0) {
            pc.jumpToPage(0);
          }
        }
      }
    } catch (e) {
      debugPrint('Error loading feed: $e');
      if (mounted) {
        state.isInitialLoading = false;
        state.isLoading = false;
        if (state.items.isEmpty) state.errorMessage = 'เกิดข้อผิดพลาด: $e';
      }
    } finally {
      _isFetchingMap[targetTabIndex] = false;
    }
  }

  Future<void> _handleImageAction(ImageSource source) async {
    final ImagePicker picker = ImagePicker();
    try {
      final XFile? image = await picker.pickImage(
        source: source,
        maxWidth: 1080,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (image != null && mounted) {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CreatePostScreen(imageFile: image),
          ),
        );

        if (result == true) {
          unawaited(_fetchData(isRefresh: true));
        }
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('ไม่สามารถเปิดใช้งานกล้องหรือคลังภาพได้: $e')),
        );
      }
    }
  }

  /// Opens CreatePostScreen (Tab 0) or CommunityPostScreen (Tab 2)
  Future<void> _openCreatePostScreen() async {
    if (!mounted) return;

    if (_selectedTabIndex == 2) {
      // ✅ Community Tab Logic
      final result = await showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => Container(
          height: MediaQuery.of(context).size.height * 0.9,
          decoration: const BoxDecoration(
            color: Color(0xFF111827), // Match unified Dark Mode
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          clipBehavior: Clip.antiAlias,
          child: CommunityPostScreen(
            initialCategory:
                _communityFilter != 'all' ? _communityFilter : null,
          ),
        ),
      );

      if (result == true) {
        unawaited(_fetchData(isRefresh: true, tabIndex: 2));
      }
    } else {
      // ✅ Default Feed Logic
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const CreatePostScreen(),
        ),
      );

      if (result == true && mounted) {
        unawaited(_fetchData(isRefresh: true));
      }
    }
  }

  void _onTimerEnd() {
    final state = _feedTabStates[_selectedTabIndex];

    // ✅ SAFETY: Don't auto-scrolling if user is interacting with the feed
    if (state.pageController.hasClients) {
      final pos = state.pageController.position;
      if (pos.userScrollDirection != ScrollDirection.idle) {
        debugPrint('TukTuk: Interaction detected. Postponing auto-scroll.');
        return;
      }
    }

    if (state.currentPage < state.items.length - 1) {
      state.pageController.nextPage(
        duration: const Duration(milliseconds: 500), // Faster transition
        curve: Curves.easeInOut, // Smoother curve
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          _getBody(),

          // 🆕 New Content Notification Bubble
          if (_hasNewContent &&
              _selectedNavIndex == 0 &&
              _selectedTabIndex == 0)
            Positioned(
              top: MediaQuery.of(context).padding.top + 70,
              left: 0,
              right: 0,
              child: Center(
                child: ZoomIn(
                  duration: const Duration(milliseconds: 400),
                  child: GestureDetector(
                    onTap: () {
                      // Hide button immediately so it doesn't stay stuck
                      // while the fetch is in-flight.
                      setState(() => _hasNewContent = false);
                      _fetchData(isRefresh: true);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF0050), Color(0xFF00F2EA)],
                        ),
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFF0050).withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.arrow_upward,
                            color: Colors.white,
                            size: 16,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'วิดีโอใหม่',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: AnimatedSlide(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        offset: _isUiVisible ? Offset.zero : const Offset(0, 1),
        child: _buildBottomNav(),
      ),
      extendBody: true,
    );
  }

  Widget _getBody() {
    return IndexedStack(
      index: _selectedNavIndex,
      children: [
        _buildFeedContent(), // Index 0: Home Feed (always built)
        _activatedIndexes.contains(1)
            ? const MessageListScreen() // ✅ Swapped from ActivityScreen
            : const SizedBox.shrink(),
        const SizedBox.shrink(), // Index 2: Center
        _activatedIndexes.contains(3)
            ? const MarketplaceScreen()
            : const SizedBox.shrink(),
        _activatedIndexes.contains(4)
            ? const ProfileScreen()
            : const SizedBox.shrink(),
      ],
    );
  }

  Widget _buildFeedContent() {
    return Stack(
      children: [
        // ✅ Removed RepaintBoundary here to fix MouseTracker assertion error.
        // Each tab child now has its own stable KeyedSubtree below.
        TabBarView(
          key: const ValueKey('main_feed_tabbar_view'), // Added stable key
          controller: _topTabController,
          children: [
            KeyedSubtree(
              key: const ValueKey('feed_tab_0_v2'),
              child: _buildVerticalFeed(0),
            ),
            KeyedSubtree(
              key: const ValueKey('feed_tab_1_v2'),
              child: _buildVerticalFeed(1),
            ),
            KeyedSubtree(
              key: const ValueKey('career_hub_tab_v2'),
              child: const CareerHubView(),
            ),
          ],
        ),
        // Top Navigation Overlay
        _buildTopNav(),

        // 📍 Automated Hyper-local logic (Radius fixed at 5km per user request)
        // Manual Radius Selector UI removed for a cleaner, automated experience
      ],
    );
  }

  // _buildRadiusSelector and related UI were removed in favor of automated 5km radius logic

  Widget _buildVerticalFeed(int tabIndex) {
    final state = _feedTabStates[tabIndex];
    return VerticalFeedView(
      tabIndex: tabIndex,
      state: state,
      isLoggedIn: _isLoggedIn,
      userId: _userId,
      isAutoScrollEnabled: _isAutoScrollEnabled,
      onTimerEnd: _onTimerEnd,
      onFetchMore: (index) => _fetchData(isRefresh: false, tabIndex: index),
      onRefresh: () => _fetchData(isRefresh: true, tabIndex: tabIndex),
      buildWelcomeCard: (item, key) => WelcomeCard(
        key: key,
        onFinished: () {
          final state = _feedTabStates[tabIndex];
          if (state.items.length > 1) {
            state.pageController
                .animateToPage(
              1,
              duration: const Duration(milliseconds: 800),
              curve: Curves.easeInOutExpo,
            )
                .then((_) {
              // Permanently remove the welcome card from the list after it's gone
              if (state.items.isNotEmpty &&
                  state.items[0].id == 'welcome_card') {
                state.removeItemAt(0);
                // After removal, all indices shift.
                // Since we're at page 1, we jump back to page 0 which now contains the first real content.
                state.pageController.jumpToPage(0);
                state.currentPage = 0;
              }
            });
          }
        },
        onCreateTap: () => _openCreationHub(isMarketplace: false),
      ),
      buildFeaturedSellerCard: (item, key) =>
          FeaturedSellerCard(key: key, item: item),
      buildIdeaLabCard: (key) => IdeaLabCard(
        key: key,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const IdeaLabScreen()),
        ),
      ),
      buildRecommendationCard: (key) => RecommendationCard(
        key: key,
        onLoginTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        ).then((_) {
          if (_isLoggedIn) _fetchData(isRefresh: true);
        }),
        onSellerTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const RegisterScreen()),
        ).then((_) {
          if (_isLoggedIn) _fetchData(isRefresh: true);
        }),
      ),
    );
  }

  Widget _buildTopNav() {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 6,
      left: 10,
      right: 10,
      child: AnimatedSlide(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
        offset: _isUiVisible ? Offset.zero : const Offset(0, -2.0),
        child: Column(
          children: [
            // ── Row 1: Tabs + Auto-scroll ──
            ClipRRect(
              borderRadius: BorderRadius.circular(30),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.2),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // 📌 Tab Items (expanded full width)
                      Expanded(
                        child: Row(
                          children: [
                            _buildTopTabItem(
                              0,
                              Icons.play_circle_fill_rounded,
                              'ดูเพลิน',
                            ),
                            _buildTopTabItem(
                              1,
                              Icons.explore_rounded,
                              _selectedProvince ?? 'ใกล้ฉัน',
                            ),
                            _buildTopTabItem(
                              2,
                              Icons.grid_view_rounded,
                              'อาชีพ',
                            ),
                          ],
                        ),
                      ),
                      // ⚡ Auto-scroll button
                      _buildTopNavActionRight(),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 8),

            // ── Row 2: Notification + Mute Pill ──
            _buildNotificationMutePill(),
          ],
        ),
      ),
    );
  }

  /// Glassmorphism pill: starts at 1/3 width (icon-only), expands on tap
  Widget _buildNotificationMutePill() {
    return StreamBuilder<int>(
      stream: _isLoggedIn && _userId != null
          ? TukTukBridge().getUnreadNotificationCount(_userId!)
          : const Stream.empty(),
      builder: (context, snapshot) {
        final int notifCount = snapshot.data ?? 0;
        final screenW =
            MediaQuery.of(context).size.width - 20; // match left/right: 10

        return GestureDetector(
          // Collapse when tapping outside (on the pill container itself)
          onTap: _isPillExpanded
              ? () => setState(() => _isPillExpanded = false)
              : () {
                  setState(() => _isPillExpanded = true);
                  // Auto-collapse after 4 seconds of inactivity
                  Future.delayed(const Duration(seconds: 4), () {
                    if (mounted) setState(() => _isPillExpanded = false);
                  });
                },
          child: AnimatedAlign(
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            alignment:
                _isPillExpanded ? Alignment.center : Alignment.centerRight,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              width: _isPillExpanded ? screenW : screenW / 3,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.2),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.18),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: _isPillExpanded
                        ? _buildPillExpanded(notifCount)
                        : _buildPillCollapsed(notifCount),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  /// Collapsed state: icons right-aligned inside the 1/3-width pill
  Widget _buildPillCollapsed(int notifCount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      mainAxisSize: MainAxisSize.max,
      children: [
        // 🔔 Bell icon with red dot badge
        Stack(
          clipBehavior: Clip.none,
          children: [
            Icon(
              notifCount > 0
                  ? Icons.notifications_active_rounded
                  : Icons.notifications_none_rounded,
              color: notifCount > 0 ? Colors.redAccent : Colors.white70,
              size: 22,
            ),
            if (notifCount > 0)
              Positioned(
                right: -3,
                top: -3,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      notifCount > 9 ? '+' : '$notifCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 6,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 12),
        // 🔇/🔊 Volume icon
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: Icon(
            _isGlobalMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
            key: ValueKey(_isGlobalMuted),
            color: _isGlobalMuted ? Colors.white38 : const Color(0xFF00F2EA),
            size: 22,
          ),
        ),
      ],
    );
  }

  /// Expanded state: full notification button + mute toggle with labels
  Widget _buildPillExpanded(int notifCount) {
    return Row(
      children: [
        // 🔔 Notification button (Expanded takes remaining space)
        Expanded(
          child: GestureDetector(
            onTap: () {
              setState(() => _isPillExpanded = false);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ActivityScreen()),
              );
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: notifCount > 0
                    ? Colors.red.withOpacity(0.18)
                    : Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: notifCount > 0
                      ? Colors.red.withOpacity(0.4)
                      : Colors.white.withOpacity(0.1),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(
                        notifCount > 0
                            ? Icons.notifications_active_rounded
                            : Icons.notifications_none_rounded,
                        color:
                            notifCount > 0 ? Colors.redAccent : Colors.white70,
                        size: 20,
                      ),
                      if (notifCount > 0)
                        Positioned(
                          right: -4,
                          top: -4,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 14,
                              minHeight: 14,
                            ),
                            child: Text(
                              notifCount > 9 ? '9+' : '$notifCount',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      notifCount > 0 ? 'แจ้งเตือน $notifCount' : 'แจ้งเตือน',
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.kanit(
                        color:
                            notifCount > 0 ? Colors.redAccent : Colors.white60,
                        fontSize: 13,
                        fontWeight: notifCount > 0
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(width: 8),

        // 🔇/🔊 Mute toggle
        GestureDetector(
          onTap: () {
            setState(() {
              _isGlobalMuted = !_isGlobalMuted;
              // keep expanded after mute toggle
            });
            // reset auto-collapse timer
            Future.delayed(const Duration(seconds: 4), () {
              if (mounted) setState(() => _isPillExpanded = false);
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            decoration: BoxDecoration(
              gradient: _isGlobalMuted
                  ? LinearGradient(
                      colors: [
                        Colors.grey.withOpacity(0.25),
                        Colors.grey.withOpacity(0.15),
                      ],
                    )
                  : LinearGradient(
                      colors: [
                        const Color(0xFF00F2EA).withOpacity(0.2),
                        const Color(0xFF4158D0).withOpacity(0.15),
                      ],
                    ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: _isGlobalMuted
                    ? Colors.grey.withOpacity(0.3)
                    : const Color(0xFF00F2EA).withOpacity(0.4),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    _isGlobalMuted
                        ? Icons.volume_off_rounded
                        : Icons.volume_up_rounded,
                    key: ValueKey(_isGlobalMuted),
                    color: _isGlobalMuted
                        ? Colors.white38
                        : const Color(0xFF00F2EA),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 4),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Text(
                    _isGlobalMuted ? 'ปิด' : 'เปิด',
                    key: ValueKey(_isGlobalMuted),
                    style: GoogleFonts.kanit(
                      color: _isGlobalMuted
                          ? Colors.white38
                          : const Color(0xFF00F2EA),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTopNavActionRight() {
    return GestureDetector(
      onTap: _toggleAutoScroll,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.only(left: 4),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: _isAutoScrollEnabled
              ? Colors.orange.withOpacity(0.25)
              : Colors.white.withOpacity(0.08),
          shape: BoxShape.circle,
          border: Border.all(
            color: _isAutoScrollEnabled
                ? Colors.orange.withOpacity(0.5)
                : Colors.transparent,
            width: 1,
          ),
        ),
        child: Icon(
          _isAutoScrollEnabled ? Icons.bolt_rounded : Icons.bolt_outlined,
          color: _isAutoScrollEnabled ? Colors.orange : Colors.white70,
          size: 18,
        ),
      ),
    );
  }

  Widget _buildTopTabItem(int index, IconData icon, String label) {
    final bool isSelected = _selectedTabIndex == index;

    // ✨ Define vibrant colors for each tab
    Color activeColor;
    switch (index) {
      case 0:
        activeColor = Colors.orangeAccent;
        break;
      case 1:
        activeColor = Colors.cyanAccent;
        break;
      case 2:
        activeColor = Colors.pinkAccent;
        break;
      default:
        activeColor = Colors.white;
    }

    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (_selectedTabIndex != index) {
            _topTabController.animateTo(index);
          } else if (index == 1) {
            _showProvincePicker();
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutQuart,
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected
                ? Colors.white.withOpacity(0.15)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(25),
            border: Border.all(
              color: isSelected
                  ? activeColor.withOpacity(0.4)
                  : Colors.transparent,
              width: 1,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: activeColor.withOpacity(0.2),
                      blurRadius: 10,
                      spreadRadius: -2,
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // 💫 Gentle Movement for active icon
              isSelected
                  ? Pulse(
                      infinite: true,
                      duration: const Duration(seconds: 2),
                      child: Icon(
                        icon,
                        color: activeColor,
                        size: 18,
                      ),
                    )
                  : Icon(
                      icon,
                      color: Colors.white60,
                      size: 16,
                    ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.kanit(
                    color: isSelected ? Colors.white : Colors.white60,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    final double safeAreaBottom = MediaQuery.of(context).padding.bottom;
    // Base height for the navigation content
    const double baseHeight = 70.0;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          // Dynamic height based on device's safe area to ensure it's always visible and correctly placed
          height: baseHeight + (safeAreaBottom > 0 ? safeAreaBottom : 15),
          padding: EdgeInsets.only(
            bottom: safeAreaBottom > 0 ? safeAreaBottom : 10,
            left: 10,
            right: 10,
            top: 5,
          ),
          decoration: BoxDecoration(
            color: Colors.black
                .withOpacity(0.3), // Glass 30% for better visibility with blur
            border: const Border(
              top: BorderSide(color: Colors.white10, width: 0.5),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _buildNavItem(0, Icons.home_rounded, 'หน้าแรก'),
              // Chat item with Badge (Swapped from Notifications)
              StreamBuilder<int>(
                stream: _isLoggedIn && _userId != null
                    ? Rx.combineLatest2(
                        TukTukBridge().chatService.getTotalUnreadStream(),
                        TukTukBridge()
                            .chatService
                            .getTotalProductUnreadStream(),
                        (int a, int b) => a + b,
                      )
                    : const Stream.empty(),
                builder: (context, snapshot) {
                  final int count = snapshot.data ?? 0;
                  return _buildNavItem(
                    1,
                    count > 0
                        ? Icons.message_rounded
                        : Icons.messenger_outline_rounded,
                    'แชท',
                    badgeCount: count,
                  );
                },
              ),
              _buildCenterNavItem(),
              _buildNavItem(3, Icons.storefront_outlined, 'ตลาด'),
              _buildNavItem(4, Icons.person_outline_rounded, 'โปรไฟล์'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData icon,
    String label, {
    int badgeCount = 0,
  }) {
    final bool isSelected = _selectedNavIndex == index;
    return GestureDetector(
      onTap: () {
        final int oldIndex = _selectedNavIndex;
        setState(() {
          _selectedNavIndex = index;
          _activatedIndexes.add(index);
        });
        _handleNavigation(index, oldIndex);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  color: isSelected ? Colors.white : Colors.white54,
                  size: isSelected ? 26 : 24,
                ),
                if (badgeCount > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white54,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleNavigation(int index, int oldIndex) {
    // When tapping Home, ensure we go back to feed
    if (index == 0) {
      if (oldIndex == 0) {
        // ✨ CORE FIX: If user is on a different top tab (e.g. Community),
        // clicking Home Nav should bring them back to "For You" (Tab 0) first.
        if (_selectedTabIndex != 0) {
          _topTabController.animateTo(0);
          return;
        }

        final state = _feedTabStates[_selectedTabIndex];
        if (state.items.isNotEmpty && state.pageController.hasClients) {
          int targetPage = 0;
          // Skip welcome card if it still exists at index 0
          if (state.items.isNotEmpty &&
              state.items[0].id == 'welcome_card' &&
              state.items.length > 1) {
            targetPage = 1;
          }

          final int currentPage = state.pageController.page?.round() ?? 0;
          final int distance = (currentPage - targetPage).abs();

          if (distance > 5) {
            // Optimization: If too far, jump closer first to avoid building all pages in between
            // This significantly reduces lag when scrolling to top from deep feed
            state.pageController.jumpToPage(targetPage + 3);
            state.pageController.animateToPage(
              targetPage,
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutCubic,
            );
          } else {
            state.pageController.animateToPage(
              targetPage,
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeOutCubic,
            );
          }
        }
      }
    }
  }

  Widget _buildCenterNavItem() {
    return GestureDetector(
      onTap: () => _openCreationHub(),
      child: Container(
        width: 65,
        height: 65,
        margin: const EdgeInsets.only(bottom: 5),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFFFF0050), Color(0xFF00F2EA)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: Colors.white.withOpacity(0.2),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFFF0050).withOpacity(0.4),
              blurRadius: 15,
              spreadRadius: 2,
              offset: const Offset(-3, 0),
            ),
            BoxShadow(
              color: const Color(0xFF00F2EA).withOpacity(0.4),
              blurRadius: 15,
              spreadRadius: 2,
              offset: const Offset(3, 0),
            ),
          ],
        ),
        child: ClipOval(
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Animated gradient background
              Container(
                decoration: const BoxDecoration(
                  gradient: SweepGradient(
                    colors: [
                      Color(0xFFFF0050),
                      Color(0xFF00F2EA),
                      Color(0xFFFF0050),
                    ],
                  ),
                ),
              ),
              // Logo or Icon
              Container(
                width: 55,
                height: 55,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/images/tuktuk.png',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.white,
                      child: const Center(
                        child: Icon(
                          Icons.add_circle,
                          color: Colors.black,
                          size: 30,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleShopAction(Widget screen) async {
    final user = await TukTukBridge().getCurrentUser();
    if (!mounted) return;

    if (user == null || user['uid'] == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กรุณาเข้าสู่ระบบก่อนใช้งาน')),
      );
      return;
    }

    // Any authenticated user (uid verified above) can open the seller dashboard.
    // The dashboard handles its own onboarding (trial, plan selection, KYC).
    Navigator.pop(context);
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => screen),
    );
  }

  void _showProvincePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Text(
                'เลือกจังหวัดเพื่อหาสินค้าใกล้ตัว',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 15),
              const Divider(color: Colors.white10),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: _provinces.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return ListTile(
                        leading: const Icon(
                          Icons.my_location,
                          color: Color(0xFF00F2EA),
                        ),
                        title: const Text(
                          'ตำแหน่งปัจจุบัน',
                          style: TextStyle(
                            color: Color(0xFF00F2EA),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          _initLocation();
                        },
                      );
                    }
                    final province = _provinces[index - 1];
                    final bool isSelected = _selectedProvince == province;
                    return ListTile(
                      title: Text(
                        province,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white70,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check, color: Color(0xFF00F2EA))
                          : null,
                      onTap: () {
                        setState(() {
                          _selectedProvince = province;
                        });
                        Navigator.pop(context);
                        _fetchData(isRefresh: true, tabIndex: 1);
                        _fetchData(isRefresh: true, tabIndex: 2);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCreationItem({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.2),
                  blurRadius: 20,
                  spreadRadius: -5,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.15),
                      width: 1.5,
                    ),
                    gradient: LinearGradient(
                      colors: [
                        color.withOpacity(0.4),
                        color.withOpacity(0.1),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      icon,
                      color: Colors.white,
                      size: 32,
                      shadows: [
                        Shadow(
                          color: color.withOpacity(0.8),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.kanit(
              color: Colors.white.withOpacity(0.9),
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  void _openCreationHub({bool isMarketplace = false}) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.52,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.85),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white12),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    children: [
                      const SizedBox(height: 25),
                      Text(
                        isMarketplace
                            ? 'Marketplace Hub'
                            : 'สร้างสรรค์เนื้อหาใหม่',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        isMarketplace
                            ? 'จัดการร้านค้าและสินค้าของคุณ'
                            : 'แชร์ประสบการณ์ของคุณให้กับโลกได้เห็น',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (isMarketplace)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              _buildCreationItem(
                                icon: Icons.add_business_rounded,
                                label: 'ลงขายสินค้า',
                                color: const Color(0xFFFF0050),
                                onTap: () => _handleShopAction(
                                  const PostProductScreen(),
                                ),
                              ),
                              Transform.translate(
                                offset: const Offset(0, -15),
                                child: _buildCreationItem(
                                  icon: Icons.store_rounded,
                                  label: 'ร้านค้าของฉัน',
                                  color: const Color(0xFFF59E0B),
                                  onTap: () => _handleShopAction(
                                    const SellerDashboardScreen(),
                                  ),
                                ),
                              ),
                              _buildCreationItem(
                                icon: Icons.search_rounded,
                                label: 'ค้นหาด่วน',
                                color: const Color(0xFF00F2EA),
                                onTap: () {
                                  Navigator.pop(context);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const UnifiedSearchScreen(),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        )
                      else
                        SizedBox(
                          height: 280,
                          width: double.infinity,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Semi-circle background guide
                              Positioned(
                                bottom: -100,
                                child: Container(
                                  width: 300,
                                  height: 300,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.white.withOpacity(0.05),
                                      width: 2,
                                    ),
                                  ),
                                ),
                              ),
                              // Interactive Semi-Circle Wheel
                              CreationWheelSelector(
                                onItemSelected: (index) {
                                  // HapticFeedback.selectionClick();
                                },
                                items: [
                                  CreationWheelItem(
                                    icon: Icons.storefront_rounded,
                                    label: 'ลงขาย',
                                    color: const Color(0xFF10B981),
                                    onTap: () => _handleShopAction(
                                      const PostProductScreen(),
                                    ),
                                  ),
                                  CreationWheelItem(
                                    icon: Icons.videocam,
                                    label: 'วิดีโอ',
                                    color: Colors.redAccent,
                                    onTap: () {
                                      Navigator.pop(context);
                                      _openCreatePostScreen();
                                    },
                                  ),
                                  CreationWheelItem(
                                    icon: Icons.camera_alt,
                                    label: 'กล้อง',
                                    color: Colors.greenAccent,
                                    onTap: () {
                                      Navigator.pop(context);
                                      _handleImageAction(ImageSource.camera);
                                    },
                                  ),
                                  CreationWheelItem(
                                    icon: Icons.grid_view_rounded,
                                    label: 'คลังภาพ',
                                    color: Colors.orangeAccent,
                                    onTap: () {
                                      Navigator.pop(context);
                                      _handleImageAction(ImageSource.gallery);
                                    },
                                  ),
                                  CreationWheelItem(
                                    icon: Icons.search_rounded,
                                    label: 'ค้นหา',
                                    color: const Color(0xFF00F2EA),
                                    onTap: () {
                                      Navigator.pop(context);
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              const UnifiedSearchScreen(),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).padding.bottom + 20,
                ),
                child: IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon:
                      const Icon(Icons.close, color: Colors.white54, size: 30),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
