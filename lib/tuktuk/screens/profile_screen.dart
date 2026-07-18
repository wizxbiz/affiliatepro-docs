import 'dart:async';
import 'dart:math' as math;
import 'package:url_launcher/url_launcher.dart';

import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/chat_screen.dart';
import 'package:caculateapp/tuktuk/screens/creator_studio_screen.dart';
import 'package:caculateapp/tuktuk/screens/edit_profile_screen.dart';
import 'package:caculateapp/tuktuk/screens/login_screen.dart';
import 'package:caculateapp/tuktuk/screens/mission_center_screen.dart';
import 'package:caculateapp/tuktuk/screens/security_settings_screen.dart';
import 'package:caculateapp/tuktuk/screens/video_viewer_screen.dart';
import 'package:caculateapp/tuktuk/services/chat_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/widgets/video_thumbnail.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';

class ProfileScreen extends StatefulWidget {
  final String? userId;
  final bool isBackButtonEnabled;

  const ProfileScreen({
    super.key,
    this.userId,
    this.isBackButtonEnabled = false,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  // ============== DATA STATE ==============
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _isMe = false;
  bool _isFollowing = false;
  List<DocumentSnapshot> _userPosts = [];
  List<Map<String, dynamic>> _followers = [];
  List<Map<String, dynamic>> _following = [];
  List<Map<String, dynamic>> _suggestedUsers = [];
  bool _isLoadingPosts = false;
  bool _isLoadingFollows = false;
  List<DocumentSnapshot> _userProducts = [];
  bool _isLoadingProducts = false;
  bool _showLogin = false;

  // ✅ Real-time sync
  StreamSubscription<DocumentSnapshot>? _userDataSubscription;

  // ============== ANIMATION CONTROLLERS ==============
  late AnimationController _mainAnimationController;
  late AnimationController _statsAnimationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  late TabController _tabController;

  // ============== STORY HIGHLIGHTS ==============
  final List<Map<String, dynamic>> _storyHighlights = [];
  bool _isLoadingStories = false;

  // ============== ACHIEVEMENTS ==============
  final List<Map<String, dynamic>> _achievements = [];

  // ============== ADDITIONAL UI STATE ==============
  final bool _isStatsExpanded = false;
  final ScrollController _scrollController = ScrollController();
  StreamSubscription<Map<String, dynamic>?>? _sessionSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeControllers();
    _fetchProfileData();
    _setupSessionListener();
  }

  void _setupSessionListener() {
    _sessionSubscription?.cancel();
    _sessionSubscription = TukTukBridge().sessionStream.listen((session) {
      if (!mounted) return;

      // Only refresh if we are currently looking at "Me" or if we were not logged in
      final String? currentUid = session?['uid'] ?? session?['lineUserId'];
      final bool wasNotLoggedIn = _userData == null;

      if (wasNotLoggedIn && currentUid != null) {
        _refreshData();
      } else if (_isMe) {
        // If it's me, always refresh to reflect potential profile updates
        _refreshData();
      }
    });
  }

  void _initializeControllers() {
    _tabController = TabController(length: 4, vsync: this);

    _mainAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _statsAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainAnimationController,
        curve: Curves.easeInOut,
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _mainAnimationController,
        curve: Curves.easeOut,
      ),
    );

    _mainAnimationController.forward();
    _statsAnimationController.forward();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _userDataSubscription?.cancel();
    _sessionSubscription?.cancel();
    _tabController.dispose();
    _mainAnimationController.dispose();
    _statsAnimationController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshData();
    }
  }

  // ============== DATA FETCHING (KEPT ORIGINAL) ==============
  Future<void> _fetchProfileData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final currentUser = await TukTukBridge().getCurrentUser();
    final currentUid = currentUser?['uid'] ?? currentUser?['lineUserId'];

    String? targetId = widget.userId;

    if (targetId == null && currentUid != null) {
      targetId = currentUid;
      _isMe = true;
    } else if (targetId == currentUid) {
      _isMe = true;
    }

    if (targetId == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      DocumentSnapshot doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(targetId)
          .get();

      if (!doc.exists) {
        // Try line_users if not in users
        doc = await FirebaseFirestore.instance
            .collection('line_users')
            .doc(targetId)
            .get();
      }

      if (doc.exists) {
        _userData = doc.data() as Map<String, dynamic>?;
        _userData?['uid'] = doc.id;
      } else if (_isMe) {
        // If it's me but no document exists yet, use session data
        _userData = currentUser;
        _userData?['uid'] = targetId;
      }

      if (_isMe) {
        final currentUser = await TukTukBridge().getCurrentUser();
        if (currentUser != null) {
          _userData = {
            ...currentUser,
            ...?_userData,
            'uid': _userData?['uid'] ?? currentUser['uid'],
          };
        } else {
          _userData ??= TukTukBridge().currentSession;
        }

        _listenToUserDataChanges(targetId);
      } else {
        _isFollowing = await TukTukBridge().isFollowing(targetId);
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
          _showLogin = false; // ปิด login overlay หลังดึงข้อมูลสำเร็จ
        });
        _fetchUserPosts(targetId);
        _fetchUserProducts(targetId);
        _fetchFollowLists(targetId);
        if (_isMe) {
          _fetchSuggestions();
          _fetchStoryHighlights();
          _fetchAchievements();
        }
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// ✅ Real-time listener for user data changes (coins, level, stats)
  void _listenToUserDataChanges(String uid) {
    _userDataSubscription?.cancel(); // Cancel previous subscription

    _userDataSubscription = FirebaseFirestore.instance
        .collection('users')
        .doc(uid)
        .snapshots()
        .listen(
      (snapshot) {
        if (!mounted) return;

        if (snapshot.exists) {
          final firestoreData = snapshot.data();

          setState(() {
            // Merge with current data, prioritizing Firestore
            _userData = {
              ...?_userData,
              ...?firestoreData,
              'uid': snapshot.id,
            };
          });

          // Re-calculate achievements when stats change
          _fetchAchievements();
        }
      },
      onError: (error) {
        debugPrint('Error listening to user data: $error');
      },
    );
  }

  Future<void> _fetchStoryHighlights() async {
    setState(() => _isLoadingStories = true);
    try {
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        setState(() {
          _storyHighlights.addAll([
            {
              'icon': Icons.emoji_events,
              'label': 'รางวัล',
              'color': Colors.amber,
            },
            {'icon': Icons.favorite, 'label': ' moments', 'color': Colors.red},
            {
              'icon': Icons.travel_explore,
              'label': 'ท่องเที่ยว',
              'color': Colors.blue,
            },
            {
              'icon': Icons.restaurant,
              'label': 'อาหาร',
              'color': Colors.orange,
            },
          ]);
          _isLoadingStories = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching stories: $e');
      setState(() => _isLoadingStories = false);
    }
  }

  Future<void> _fetchAchievements() async {
    if (_userData == null) return;

    try {
      final int followerCount =
          int.parse((_userData?['followersCount'] ?? 0).toString());
      final int postCount = _userPosts.length;
      final int productCount = _userProducts.length;
      final int likes = int.parse((_userData?['totalLikes'] ?? 0).toString());

      final List<Map<String, dynamic>> earned = [];

      if (followerCount > 10) {
        earned.add({
          'icon': Icons.trending_up_rounded,
          'label': 'Rising Star',
          'color': Colors.green,
        });
      }
      if (postCount > 20) {
        earned.add({
          'icon': Icons.auto_awesome_rounded,
          'label': 'Content King',
          'color': Colors.orange,
        });
      }
      if (productCount > 5) {
        earned.add({
          'icon': Icons.storefront_rounded,
          'label': 'Top Seller',
          'color': Colors.blue,
        });
      }
      if (likes > 50) {
        earned.add({
          'icon': Icons.favorite_rounded,
          'label': 'Super Liked',
          'color': Colors.pink,
        });
      }
      if (_userData?['isPremium'] == true) {
        earned.add({
          'icon': Icons.verified_rounded,
          'label': 'Verified',
          'color': Colors.cyan,
        });
      }

      if (earned.isEmpty) {
        earned.add({
          'icon': Icons.star_border_rounded,
          'label': 'Starter',
          'color': Colors.grey,
        });
      }

      if (mounted) {
        setState(() {
          _achievements.clear();
          _achievements.addAll(earned);
        });
      }
    } catch (e) {
      debugPrint('Intelligence Error in achievements: $e');
    }
  }

  Future<void> _refreshData() async {
    await _fetchProfileData();
    if (_isMe) {
      await _fetchStoryHighlights();
      await _fetchAchievements();
    }
  }

  Future<void> _handleFollow() async {
    final uid = _userData?['uid'];
    if (uid == null) return;

    setState(() {
      if (_isFollowing) {
        _userData?['followersCount'] = (_userData?['followersCount'] ?? 1) - 1;
      } else {
        _userData?['followersCount'] = (_userData?['followersCount'] ?? 0) + 1;
      }
      _isFollowing = !_isFollowing;
    });

    final success = await TukTukBridge().toggleFollow(uid);

    if (!success && mounted) {
      setState(() {
        if (_isFollowing) {
          _userData?['followersCount'] =
              (_userData?['followersCount'] ?? 1) - 1;
        } else {
          _userData?['followersCount'] =
              (_userData?['followersCount'] ?? 0) + 1;
        }
        _isFollowing = !_isFollowing;
      });
      _showSnackBar('เกิดข้อผิดพลาดในการติดตาม', isError: true);
    }
  }

  Future<void> _fetchFollowLists(String uid) async {
    if (_isLoadingFollows) return;
    setState(() => _isLoadingFollows = true);

    try {
      final followers = await TukTukBridge().getFollowers(uid);
      final following = await TukTukBridge().getFollowing(uid);

      if (mounted) {
        setState(() {
          _followers = followers;
          _following = following;
          _isLoadingFollows = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching follow lists: $e');
      if (mounted) setState(() => _isLoadingFollows = false);
    }
  }

  Future<void> _fetchSuggestions() async {
    try {
      final province = _userData?['province'];
      final bio = (_userData?['bio'] ?? '').toString().toLowerCase();
      final interests = ['อาหาร', 'เที่ยว', 'funny', 'music', 'art']
          .where(bio.contains)
          .toList();

      List<Map<String, dynamic>> suggestions = [];

      if (interests.isNotEmpty) {
        suggestions = await TukTukBridge().searchUsers(interests.first);
      }

      if (suggestions.isEmpty && province != null) {
        suggestions = await TukTukBridge().getNearbyUsers(province);
      }

      if (suggestions.isEmpty) {
        suggestions = await TukTukBridge().searchUsers('');
      }

      if (mounted) {
        setState(() {
          _suggestedUsers = suggestions
              .where((u) => u['uid'] != _userData?['uid'])
              .take(5)
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Intelligence Error fetching suggestions: $e');
    }
  }

  Future<void> _fetchUserPosts(String uid) async {
    if (_isLoadingPosts) return;
    setState(() => _isLoadingPosts = true);

    try {
      final List<String> idList = [uid];
      if (_userData?['lineUserId'] != null) {
        idList.add(_userData!['lineUserId'].toString());
      }
      final distinctIds = idList.toSet().toList();

      var querySnapshot = await FirebaseFirestore.instance
          .collection('posts')
          .where('authorId', whereIn: distinctIds)
          .orderBy('createdAt', descending: true)
          .limit(50)
          .get();

      if (querySnapshot.docs.isEmpty) {
        querySnapshot = await FirebaseFirestore.instance
            .collection('posts')
            .where('authorId', whereIn: distinctIds)
            .limit(50)
            .get();
      }

      if (mounted) {
        int totalViews = 0;
        int totalLikes = 0;
        for (final doc in querySnapshot.docs) {
          final data = doc.data();
          totalViews += int.parse((data['views'] ?? 0).toString());
          totalLikes += int.parse((data['likes'] ?? 0).toString());
        }

        setState(() {
          _userPosts = querySnapshot.docs;
          _isLoadingPosts = false;
          _userData?['totalViews'] = totalViews;
          _userData?['totalLikes'] = totalLikes;
        });
        _fetchAchievements();
      }
    } catch (e) {
      debugPrint('Error fetching posts: $e');
      if (mounted) setState(() => _isLoadingPosts = false);
    }
  }

  Future<void> _fetchUserProducts(String uid) async {
    if (_isLoadingProducts) return;
    setState(() => _isLoadingProducts = true);

    try {
      final List<String> idList = [uid];
      if (_userData?['lineUserId'] != null) {
        idList.add(_userData!['lineUserId'].toString());
      }
      final distinctIds = idList.toSet().toList();

      final List<Future<QuerySnapshot>> futures = [
        FirebaseFirestore.instance
            .collection('marketplace_items')
            .where('sellerId', whereIn: distinctIds)
            .get(),
        FirebaseFirestore.instance
            .collection('community_products')
            .where('sellerId', whereIn: distinctIds)
            .get(),
        FirebaseFirestore.instance
            .collection('consignment_products')
            .where('sellerId', whereIn: distinctIds)
            .get(),
      ];

      final results = await Future.wait(futures);
      final List<DocumentSnapshot> allProducts = [];
      for (final snapshot in results) {
        allProducts.addAll(snapshot.docs);
      }

      allProducts.sort((a, b) {
        final aTime =
            (a.data() as Map<String, dynamic>?)?['createdAt'] as Timestamp?;
        final bTime =
            (b.data() as Map<String, dynamic>?)?['createdAt'] as Timestamp?;
        if (aTime == null) return 1;
        if (bTime == null) return -1;
        return bTime.compareTo(aTime);
      });

      if (mounted) {
        setState(() {
          _userProducts = allProducts;
          _isLoadingProducts = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
      if (mounted) setState(() => _isLoadingProducts = false);
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError
                  ? Icons.error_outline_rounded
                  : Icons.check_circle_rounded,
              color: Colors.white,
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.kanit())),
          ],
        ),
        backgroundColor: isError ? Colors.redAccent : Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  // ============== ENHANCED BUILD METHODS ==============
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return _buildEnhancedLoadingShimmer();
    }

    if (_userData == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0E21),
        appBar: widget.isBackButtonEnabled ? _buildBackAppBar() : null,
        body: _buildLoginRequired(),
      );
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0E21),
        body: RefreshIndicator(
          onRefresh: _refreshData,
          color: const Color(0xFF00F2EA),
          backgroundColor: const Color(0xFF1A1F35),
          child: NestedScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(),
            headerSliverBuilder: (context, innerBoxIsScrolled) {
              return [
                _buildEnhancedPremiumAppBar(),
                SliverToBoxAdapter(child: _buildEnhancedProfileHeader()),
                if (_isMe)
                  SliverToBoxAdapter(child: _buildEnhancedStoryHighlights()),
                _buildPersistentTabs(),
              ];
            },
            body: TabBarView(
              controller: _tabController,
              children: [
                _buildPostsGridTab(),
                _buildEnhancedProductsTab(),
                _buildEnhancedFollowingTab(),
                _buildEnhancedFollowersTab(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildBackAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
        ),
        onPressed: () => Navigator.pop(context),
      ),
    );
  }

  Widget _buildEnhancedLoadingShimmer() {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      body: Shimmer.fromColors(
        baseColor: Colors.white.withValues(alpha: 0.05),
        highlightColor: Colors.white.withValues(alpha: 0.1),
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 200,
              backgroundColor: const Color(0xFF0A0E21),
              flexibleSpace: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withValues(alpha: 0.05),
                      Colors.white.withValues(alpha: 0.02),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 90,
                          height: 90,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: double.infinity,
                                height: 24,
                                color: Colors.white,
                              ),
                              const SizedBox(height: 8),
                              Container(
                                width: 150,
                                height: 18,
                                color: Colors.white,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      height: 80,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedPremiumAppBar() {
    final coverUrl = _userData?['coverUrl'];

    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      stretch: true,
      backgroundColor: const Color(0xFF0A0E21),
      elevation: 0,
      leading: widget.isBackButtonEnabled
          ? Padding(
              padding: const EdgeInsets.only(left: 16, top: 8),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(
                    Icons.arrow_back_ios_new,
                    color: Colors.white,
                    size: 18,
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            )
          : null,
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 8, top: 8),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(
                Icons.support_agent_rounded,
                color: Colors.white,
                size: 20,
              ),
              onPressed: () async {
                final url = Uri.parse('https://line.me/R/ti/p/@tuktukfeed');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
              },
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 16, top: 8),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: Icon(
                _isMe ? Icons.settings_rounded : Icons.share_rounded,
                color: Colors.white,
                size: 20,
              ),
              onPressed: () =>
                  _isMe ? _showEnhancedSettingsMenu() : _shareProfile(),
            ),
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (coverUrl != null &&
                coverUrl.isNotEmpty &&
                !coverUrl.toLowerCase().contains('.mp4') &&
                !coverUrl.toLowerCase().contains('.mov'))
              CachedNetworkImage(
                imageUrl: coverUrl,
                fit: BoxFit.cover,
                errorWidget: (context, url, error) =>
                    _buildEnhancedDefaultCover(),
              )
            else
              _buildEnhancedDefaultCover(),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    const Color(0xFF0A0E21).withValues(alpha: 0.3),
                    const Color(0xFF0A0E21),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedDefaultCover() {
    return Container(
      decoration: const BoxDecoration(
        gradient: SweepGradient(
          colors: [
            Color(0xFF4158D0),
            Color(0xFFC850C0),
            Color(0xFFFFCC70),
            Color(0xFF4158D0),
          ],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -50,
            right: -50,
            child: Transform.rotate(
              angle: math.pi / 4,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            left: -30,
            child: Transform.rotate(
              angle: -math.pi / 6,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedProfileHeader() {
    final String displayName =
        (_userData?['displayName'] ?? 'ผู้ใช้งาน').toString();
    final String rawHandle =
        _userData?['handle'] ?? displayName.replaceAll(' ', '').toLowerCase();
    final String handle = rawHandle.isNotEmpty
        ? rawHandle
        : (_userData?['uid']?.toString().substring(0, 8) ?? 'user');

    final bio = _userData?['bio'] ??
        (_isMe ? 'เพิ่มคำอธิบายตัวตนของคุณ...' : 'ยังไม่มีคำอธิบาย');
    final isPremium = _userData?['isPremium'] == true;
    final pic = _userData?['pictureUrl'];

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 45),
              Transform.translate(
                offset: const Offset(0, -45),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF00F2EA),
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF00F2EA).withValues(alpha: 0.3),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 45,
                        backgroundColor: const Color(0xFF1A1F35),
                        backgroundImage: (pic != null && pic.startsWith('http'))
                            ? CachedNetworkImageProvider(pic)
                            : null,
                        child: pic == null
                            ? const Icon(
                                Icons.person,
                                size: 40,
                                color: Colors.white54,
                              )
                            : null,
                      ),
                    ),
                    const Spacer(),
                    if (_isMe) ...[
                      _buildEnhancedActionButton(
                        icon: Icons.edit_rounded,
                        label: 'แก้ไข',
                        onTap: _navigateToEditProfile,
                        gradient: const [Color(0xFF4158D0), Color(0xFFC850C0)],
                      ),
                      const SizedBox(width: 8),
                      _buildHeaderIconButton(
                        icon: Icons.analytics_rounded,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const CreatorStudioScreen(),
                          ),
                        ),
                        gradient: const [Color(0xFFFFCC70), Color(0xFFFF0050)],
                      ),
                      const SizedBox(width: 8),
                      _buildHeaderIconButton(
                        icon: Icons.wallet_rounded,
                        onTap: _showEnhancedWallet,
                        gradient: const [Color(0xFFFF0050), Color(0xFFFF6B6B)],
                      ),
                      const SizedBox(width: 8),
                      _buildHeaderIconButton(
                        icon: Icons.qr_code_rounded,
                        onTap: _showEnhancedQRCode,
                        gradient: const [Color(0xFF00F2EA), Color(0xFFC850C0)],
                      ),
                    ] else ...[
                      _buildEnhancedActionButton(
                        icon: Icons.chat_bubble_rounded,
                        label: 'ส่งแชท',
                        onTap: () async {
                          final otherUid = _userData?['uid'];
                          if (otherUid == null) return;
                          final convId = await ChatService()
                              .getOrCreateConversation(otherUid);
                          if (mounted) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ChatScreen(
                                  conversationId: convId,
                                  otherUserId: otherUid,
                                  otherUserName:
                                      _userData?['displayName'] ?? 'ผู้ใช้งาน',
                                  otherUserPhoto: _userData?['pictureUrl'],
                                ),
                              ),
                            );
                          }
                        },
                        gradient: const [Color(0xFF00F2EA), Color(0xFF00D2FF)],
                      ),
                      const SizedBox(width: 10),
                      _buildEnhancedActionButton(
                        icon: _isFollowing
                            ? Icons.person_remove_rounded
                            : Icons.person_add_alt_1_rounded,
                        label: _isFollowing ? 'ติดตามแล้ว' : 'ติดตาม',
                        onTap: _handleFollow,
                        gradient: _isFollowing
                            ? [
                                Colors.white.withValues(alpha: 0.1),
                                Colors.white.withValues(alpha: 0.05),
                              ]
                            : const [Color(0xFFFF0050), Color(0xFFFF6B6B)],
                      ),
                    ],
                  ],
                ),
              ),
              Transform.translate(
                offset: const Offset(0, -30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            displayName,
                            style: GoogleFonts.kanit(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isPremium) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Color(0xFF00F2EA),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.verified_rounded,
                              size: 14,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '@$handle',
                      style: GoogleFonts.rubik(
                        color: const Color(0xFF00F2EA).withValues(alpha: 0.7),
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.03),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.05),
                        ),
                      ),
                      child: Text(
                        bio,
                        style: GoogleFonts.kanit(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontSize: 14,
                          height: 1.5,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildEnhancedStatsRow(),
                    if (_isMe) ...[
                      const SizedBox(height: 20),
                      _buildMissionCenterCard(),
                    ],
                    if (_isMe && _achievements.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      _buildEnhancedAchievements(),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEnhancedActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required List<Color> gradient,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 130),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: gradient.first.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.white),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMissionCenterCard() {
    final int coins = _userData?['coins'] ?? 0;
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const MissionCenterScreen()),
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1A1F35), Color(0xFF0A0E21)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
              color: const Color(0xFFFFD700).withValues(alpha: 0.2), width: 1,),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFFFD700).withValues(alpha: 0.05),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Row(
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFFFD700).withValues(alpha: 0.1),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.stars_rounded,
                    color: Color(0xFFFFD700), size: 30,),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ศูนย์รวมภารกิจ & รางวัล',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    'ทำภารกิจสะสมเหรียญ แลกของรางวัลพิศษ',
                    style: GoogleFonts.kanit(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  coins.toString(),
                  style: GoogleFonts.rubik(
                    color: const Color(0xFFFFD700),
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'คอยน์ของคุณ',
                  style: GoogleFonts.kanit(
                    color: Colors.white38,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderIconButton({
    required IconData icon,
    required VoidCallback onTap,
    required List<Color> gradient,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: gradient.first.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }

  Widget _buildEnhancedStatsRow() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Expanded(
            child: _buildEnhancedStatItem(
              'โพสต์',
              _userPosts.length,
              Icons.grid_on_rounded,
              const Color(0xFF4158D0),
            ),
          ),
          Expanded(
            child: _buildEnhancedStatItem(
              'ผู้ติดตาม',
              _userData?['followersCount'] ?? 0,
              Icons.people_rounded,
              const Color(0xFFC850C0),
            ),
          ),
          Expanded(
            child: _buildEnhancedStatItem(
              'กำลังติดตาม',
              _userData?['followingCount'] ?? 0,
              Icons.favorite_rounded,
              const Color(0xFFFFCC70),
            ),
          ),
          Expanded(
            child: _buildEnhancedStatItem(
              'ถูกใจ',
              _userData?['totalLikes'] ?? 0,
              Icons.thumb_up_rounded,
              const Color(0xFFFF0050),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedStatItem(
    String label,
    dynamic count,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(height: 8),
        Text(
          count.toString(),
          style: GoogleFonts.kanit(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.kanit(
            color: Colors.white38,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildEnhancedStoryHighlights() {
    if (_isLoadingStories) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: List.generate(
              5,
              (index) => Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Shimmer.fromColors(
                  baseColor: Colors.white.withValues(alpha: 0.05),
                  highlightColor: Colors.white.withValues(alpha: 0.1),
                  child: Column(
                    children: [
                      Container(
                        width: 70,
                        height: 70,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: 50,
                        height: 10,
                        color: Colors.white,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 20, bottom: 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.orangeAccent.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.star_rounded,
                    color: Colors.orangeAccent,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'ไฮไลท์',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 110,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _storyHighlights.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _buildEnhancedStoryAddButton();
                }
                final story = _storyHighlights[index - 1];
                return _buildEnhancedStoryItem(story);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedStoryAddButton() {
    return Padding(
      padding: const EdgeInsets.only(right: 16),
      child: Column(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4158D0), Color(0xFFC850C0)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4158D0).withValues(alpha: 0.3),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: const Icon(Icons.add, color: Colors.white, size: 30),
          ),
          const SizedBox(height: 8),
          Text(
            'เพิ่ม',
            style: GoogleFonts.kanit(
              fontSize: 12,
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedStoryItem(Map<String, dynamic> story) {
    return Padding(
      padding: const EdgeInsets.only(right: 16),
      child: Column(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  story['color'].withValues(alpha: 0.5),
                  story['color'],
                ],
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: story['color'].withValues(alpha: 0.3),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(story['icon'], color: Colors.white, size: 30),
          ),
          const SizedBox(height: 8),
          Text(
            story['label'],
            style: GoogleFonts.kanit(
              fontSize: 12,
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedAchievements() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.emoji_events_rounded,
                  color: Colors.amber,
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'ความสำเร็จ',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 60,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _achievements.length,
            itemBuilder: (context, index) {
              final achievement = _achievements[index];
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: achievement['color'].withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(
                      color: achievement['color'].withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        achievement['icon'],
                        color: achievement['color'],
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        achievement['label'],
                        style: GoogleFonts.kanit(
                          fontSize: 13,
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPersistentTabs() {
    return SliverPersistentHeader(
      pinned: true,
      delegate: _SliverAppBarDelegate(
        child: Container(
          color: const Color(0xFF0A0E21),
          child: Column(
            children: [
              TabBar(
                controller: _tabController,
                indicatorColor: const Color(0xFF00F2EA),
                indicatorWeight: 3,
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white38,
                labelStyle: GoogleFonts.kanit(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
                tabs: const [
                  Tab(
                    icon: Icon(Icons.grid_on_rounded),
                    text: 'โพสต์',
                  ),
                  Tab(
                    icon: Icon(Icons.storefront_rounded),
                    text: 'สินค้า',
                  ),
                  Tab(
                    icon: Icon(Icons.people_outline_rounded),
                    text: 'กำลังติดตาม',
                  ),
                  Tab(
                    icon: Icon(Icons.bookmark_border_rounded),
                    text: 'ผู้ติดตาม',
                  ),
                ],
              ),
              Container(
                height: 1,
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPostsGridTab() {
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [_buildEnhancedPostsGrid()],
    );
  }

  Widget _buildEnhancedProductsTab() {
    if (_isLoadingProducts) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF0050)),
        ),
      );
    }

    if (_userProducts.isEmpty) {
      return _buildEnhancedEmptyState(
        icon: Icons.inventory_2_outlined,
        message: 'ยังไม่มีรายการสินค้า',
        subtitle: 'เริ่มต้นขายสินค้าของคุณวันนี้',
        color: const Color(0xFFFF0050),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _userProducts.length,
      itemBuilder: (context, index) {
        final doc = _userProducts[index];
        final data = doc.data() as Map<String, dynamic>;
        final isConsignment = data['isConsignment'] == true;
        final status = data['status'] ?? 'active';
        final price = data['price'] ?? 0;

        return FadeInUp(
          delay: Duration(milliseconds: 50 * index),
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withValues(alpha: 0.05),
                  Colors.white.withValues(alpha: 0.02),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: InkWell(
              onTap: () {
                // Navigate to product detail
              },
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(15),
                      child: CachedNetworkImage(
                        imageUrl: data['imageUrl'] ?? '',
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: Colors.white.withValues(alpha: 0.05),
                          child: const Center(
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Color(0xFFFF0050),
                              ),
                            ),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: Colors.white.withValues(alpha: 0.05),
                          child: const Icon(
                            Icons.image_not_supported_outlined,
                            color: Colors.white24,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            data['productName'] ?? 'ไม่มีชื่อสินค้า',
                            style: GoogleFonts.kanit(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Text(
                                '฿${_formatNumber(price)}',
                                style: GoogleFonts.kanit(
                                  color: const Color(0xFFFF0050),
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (isConsignment) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: Colors.green.withValues(alpha: 0.2),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.verified_user_outlined,
                                        color: Colors.greenAccent,
                                        size: 10,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'ฝากขาย (ถอนจอง 5%)',
                                        style: GoogleFonts.kanit(
                                          color: Colors.greenAccent,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 8),
                          _buildEnhancedStatusBadge(status),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEnhancedStatusBadge(String status) {
    Color color = Colors.grey;
    String text = status;
    IconData icon = Icons.circle;

    switch (status) {
      case 'active':
        color = Colors.green;
        text = 'กำลังขาย';
        icon = Icons.check_circle_outline;
        break;
      case 'pending':
        color = Colors.orange;
        text = 'รอตรวจสอบ';
        icon = Icons.hourglass_empty;
        break;
      case 'sold':
        color = Colors.red;
        text = 'ขายแล้ว';
        icon = Icons.sell_outlined;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedFollowingTab() {
    final privacy = _userData?['privacySettings']?['following'] ?? 'public';
    if (!_isMe && privacy == 'private') {
      return _buildEnhancedPrivateState('รายการนี้เป็นส่วนตัว');
    }

    if (_isLoadingFollows) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF0050)),
        ),
      );
    }

    if (_following.isEmpty) {
      return _buildEnhancedEmptyState(
        icon: Icons.person_add_outlined,
        message: 'ยังไม่ได้ติดตามใคร',
        subtitle: 'เมื่อคุณติดตามใคร จะแสดงที่นี่',
        color: const Color(0xFF00F2EA),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 20),
      itemCount: _following.length,
      itemBuilder: (context, index) =>
          _buildEnhancedUserListTile(_following[index]),
    );
  }

  Widget _buildEnhancedFollowersTab() {
    final privacy = _userData?['privacySettings']?['followers'] ?? 'public';
    if (!_isMe && privacy == 'private') {
      return _buildEnhancedPrivateState('รายการนี้เป็นส่วนตัว');
    }

    if (_isLoadingFollows) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF0050)),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 20),
      children: [
        if (_isMe && _suggestedUsers.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.orangeAccent.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.person_add_alt_1,
                    color: Colors.orangeAccent,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'แนะนำสำหรับคุณ',
                  style: GoogleFonts.kanit(
                    color: Colors.orangeAccent,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          ..._suggestedUsers
              .map((u) => _buildEnhancedUserListTile(u, isSuggestion: true)),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Divider(
              color: Colors.white.withValues(alpha: 0.1),
              height: 1,
              indent: 20,
              endIndent: 20,
            ),
          ),
        ],
        if (_followers.isEmpty)
          _buildEnhancedEmptyState(
            icon: Icons.people_outline,
            message: 'ยังไม่มีผู้ติดตาม',
            subtitle: 'สร้างคอนเทนต์เพื่อเพิ่มผู้ติดตาม',
            color: const Color(0xFF4158D0),
          )
        else
          ..._followers.map(_buildEnhancedUserListTile),
      ],
    );
  }

  Widget _buildEnhancedUserListTile(
    Map<String, dynamic> user, {
    bool isSuggestion = false,
  }) {
    final String name = user['displayName'] ?? user['name'] ?? 'ผู้ใช้งาน';
    final String? pic = user['pictureUrl'] ?? user['photoURL'];
    final String uid = user['uid'] ?? user['lineUserId'] ?? '';

    return ListTile(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ProfileScreen(
            userId: uid,
            isBackButtonEnabled: true,
          ),
        ),
      ),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: Colors.white.withValues(alpha: 0.05),
            backgroundImage: (pic != null && pic.startsWith('http'))
                ? CachedNetworkImageProvider(pic)
                : null,
            child: pic == null
                ? const Icon(Icons.person, color: Colors.white24, size: 28)
                : null,
          ),
          if (isSuggestion)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.orangeAccent,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF0A0E21), width: 2),
                ),
                child: const Icon(Icons.star, color: Colors.white, size: 12),
              ),
            ),
        ],
      ),
      title: Text(
        name,
        style: GoogleFonts.kanit(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
      ),
      subtitle: Text(
        isSuggestion
            ? 'สนใจเรื่องเดียวกัน'
            : '${_formatNumber(user['followersCount'] ?? 0)} ผู้ติดตาม',
        style: GoogleFonts.kanit(
          color: Colors.white54,
          fontSize: 13,
        ),
      ),
      trailing: _isMe
          ? null
          : Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFFFF0050).withValues(alpha: 0.1),
                    const Color(0xFFFF6B6B).withValues(alpha: 0.1),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFFFF0050).withValues(alpha: 0.3),
                ),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => TukTukBridge().toggleFollow(uid),
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Text(
                      'ติดตาม',
                      style: GoogleFonts.kanit(
                        color: const Color(0xFFFF0050),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildEnhancedEmptyState({
    required IconData icon,
    required String message,
    String? subtitle,
    required Color color,
  }) {
    return Center(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(40),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withValues(alpha: 0.03),
                border: Border.all(color: color.withValues(alpha: 0.1)),
              ),
              child: Icon(
                icon,
                size: 60,
                color: color.withValues(alpha: 0.3),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              message,
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 12),
              Text(
                subtitle,
                style: GoogleFonts.kanit(
                  color: Colors.white38,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedPrivateState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.03),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: const Icon(
              Icons.lock_outline,
              size: 60,
              color: Colors.white24,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            message,
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'เฉพาะเจ้าของโปรไฟล์เท่านั้นที่เห็น',
            style: GoogleFonts.kanit(
              color: Colors.white38,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnhancedPostsGrid() {
    if (_isLoadingPosts) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(40),
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white10),
            ),
          ),
        ),
      );
    }
    if (_userPosts.isEmpty) {
      return SliverToBoxAdapter(
        child: _buildEnhancedEmptyState(
          icon: Icons.video_library_outlined,
          message: 'ยังไม่มีความเคลื่อนไหว',
          subtitle: 'เริ่มต้นแชร์วิดีโอแรกของคุณ',
          color: const Color(0xFF00F2EA),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          childAspectRatio: 0.7,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final post = _userPosts[index];
            final data = post.data() as Map<String, dynamic>;
            return FadeInUp(
              delay: Duration(milliseconds: 50 * index),
              child: _buildEnhancedGridItem(data, index),
            );
          },
          childCount: _userPosts.length,
        ),
      ),
    );
  }

  Widget _buildEnhancedGridItem(Map<String, dynamic> data, int index) {
    String? thumbUrl = data['thumbnailUrl']?.toString();
    if (thumbUrl == null || thumbUrl.isEmpty) {
      thumbUrl = data['imageUrl']?.toString() ?? data['coverImage']?.toString();
    }

    String videoUrl = data['videoUrl']?.toString() ?? '';
    final String? videoEmbed = data['videoEmbed']?.toString();
    bool isYoutube = false;
    bool isMp4 = false;

    if (data['images'] is List && (data['images'] as List).isNotEmpty) {
      for (final item in (data['images'] as List)) {
        String? itemUrl;
        String? itemThumb;
        bool isItemVideo = false;

        if (item is String) {
          itemUrl = item;
          isItemVideo = item.toLowerCase().contains('.mp4') ||
              item.toLowerCase().contains('.mov');
        } else if (item is Map) {
          itemUrl = item['url']?.toString();
          itemThumb =
              item['thumbnailUrl']?.toString() ?? item['thumb']?.toString();
          isItemVideo = item['type'] == 'video' ||
              itemUrl?.toLowerCase().contains('.mp4') == true;
        }

        if (itemUrl != null && itemUrl.isNotEmpty) {
          if (isItemVideo) {
            isMp4 = true;
            if (videoUrl.isEmpty) videoUrl = itemUrl;
            if (itemThumb != null && (thumbUrl == null || thumbUrl.isEmpty)) {
              thumbUrl = itemThumb;
            }
          } else {
            if (thumbUrl == null || thumbUrl.isEmpty) thumbUrl = itemUrl;
          }
        }
      }
    }

    String? ytId;
    if (videoUrl.isNotEmpty) {
      final regExp = RegExp(
        r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})',
      );
      final match = regExp.firstMatch(videoUrl);
      if (match != null) {
        ytId = match.group(1);
        isYoutube = true;
      }
    }

    if (ytId == null && videoEmbed != null && videoEmbed.isNotEmpty) {
      final regExp = RegExp(r'embed\/([^"?]+)');
      final match = regExp.firstMatch(videoEmbed);
      if (match != null) {
        ytId = match.group(1);
        isYoutube = true;
      }
    }

    if (isYoutube && ytId != null && (thumbUrl == null || thumbUrl.isEmpty)) {
      thumbUrl = 'https://img.youtube.com/vi/$ytId/hqdefault.jpg';
    }

    if (!isYoutube && videoUrl.isNotEmpty) {
      isMp4 = videoUrl.toLowerCase().contains('.mp4') ||
          videoUrl.toLowerCase().contains('.mov');
    }

    final bool thumbIsVideo = thumbUrl != null &&
        (thumbUrl.toLowerCase().contains('.mp4') ||
            thumbUrl.toLowerCase().contains('.mov'));

    final bool showVideoPreview =
        isMp4 && (thumbUrl == null || thumbUrl.isEmpty || thumbIsVideo);

    final bool hasVideo = isYoutube || isMp4 || videoUrl.isNotEmpty;
    final views = data['views'] ?? 0;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              VideoViewerScreen(posts: _userPosts, initialIndex: index),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (showVideoPreview && videoUrl.isNotEmpty)
              VideoThumbnail(videoUrl: videoUrl)
            else if (thumbUrl != null && thumbUrl.isNotEmpty && !thumbIsVideo)
              CachedNetworkImage(
                imageUrl: thumbUrl,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => Container(
                  color: Colors.white.withValues(alpha: 0.05),
                  child: Center(
                    child: Icon(
                      hasVideo
                          ? Icons.play_circle_outline
                          : Icons.image_outlined,
                      color: Colors.white24,
                      size: 30,
                    ),
                  ),
                ),
                placeholder: (_, __) => Container(
                  color: Colors.white.withValues(alpha: 0.05),
                  child: const Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Color(0xFFFF0050)),
                    ),
                  ),
                ),
              )
            else
              Container(
                color: Colors.white.withValues(alpha: 0.05),
                child: const Center(
                  child: Icon(
                    Icons.play_circle_outline,
                    color: Colors.white24,
                    size: 30,
                  ),
                ),
              ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.black.withValues(alpha: 0.8), Colors.transparent],
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                ),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Icon(
                  isYoutube
                      ? Icons.play_circle_filled
                      : isMp4
                          ? Icons.videocam
                          : Icons.photo,
                  color: Colors.white70,
                  size: 14,
                ),
              ),
            ),
            Positioned(
              bottom: 8,
              left: 8,
              right: 8,
              child: Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.remove_red_eye,
                          color: Colors.white70,
                          size: 12,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatNumber(
                            views is int
                                ? views
                                : (int.tryParse(views.toString()) ?? 0),
                          ),
                          style: GoogleFonts.kanit(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.favorite_rounded,
                          color: Colors.pinkAccent,
                          size: 12,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatNumber(data['likes'] ?? 0),
                          style: GoogleFonts.kanit(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginRequired() {
    if (_showLogin) {
      return Stack(
        children: [
          LoginScreen(
            shouldPopOnSuccess: false,
            onLoginSuccess: () {
              setState(() => _showLogin = false);
              _fetchProfileData();
            },
          ),
          Positioned(
            top: 40,
            left: 20,
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child:
                    const Icon(Icons.arrow_back, color: Colors.white, size: 20),
              ),
              onPressed: () => setState(() => _showLogin = false),
            ),
          ),
        ],
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: FadeInDown(
          duration: const Duration(milliseconds: 600),
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.1),
                        Colors.white.withValues(alpha: 0.02),
                      ],
                    ),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: Center(
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/tuktuk.png',
                        width: 100,
                        height: 100,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  'ยินดีต้อนรับสู่',
                  style: GoogleFonts.kanit(color: Colors.white70, fontSize: 18),
                ),
                Text(
                  'TukTuk Feed Thailand',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.03),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                  ),
                  child: const Text(
                    'ยิ่งใช้งาน ยิ่งได้! เปลี่ยนทุกไลฟ์สไตล์ให้เป็นสิทธิพิเศษ สะสมแต้มและรับส่วนลดมากมาย เพียงแค่ใช้งาน TukTuk Feed วันนี้',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                ),
                const SizedBox(height: 48),
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => setState(() => _showLogin = true),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: double.infinity,
                      height: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF0050), Color(0xFF00F2EA)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFF0050).withValues(alpha: 0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.login_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'เข้าสู่ระบบ TukTuk Ecosystem',
                              style: GoogleFonts.kanit(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    int num;
    if (number is int) {
      num = number;
    } else if (number is String) {
      num = int.tryParse(number) ?? 0;
    } else {
      num = number.toInt();
    }

    if (num >= 1000000) return '${(num / 1000000).toStringAsFixed(1)}M';
    if (num >= 1000) return '${(num / 1000).toStringAsFixed(1)}K';
    return num.toString();
  }

  // ============== ENHANCED MODAL SHEETS ==============
  void _showEnhancedSettingsMenu() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: BoxDecoration(
          color: const Color(0xFF0A0E21),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
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
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFF0050), Color(0xFF00F2EA)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.settings_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'การตั้งค่า',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.close,
                        color: Colors.white54,
                        size: 20,
                      ),
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white10, height: 30),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildEnhancedSettingsGroup('บัญชีของฉัน', [
                    _buildEnhancedSettingsTile(
                      icon: Icons.qr_code_scanner_rounded,
                      title: 'คิวอาร์โค้ดของฉัน',
                      subtitle: 'ให้เพื่อนสแกนเพื่อติดตามคุณ',
                      gradient: const [Color(0xFF00F2EA), Color(0xFFC850C0)],
                      onTap: _showEnhancedQRCode,
                    ),
                    _buildEnhancedSettingsTile(
                      icon: Icons.person_outline_rounded,
                      title: 'แก้ไขโปรไฟล์',
                      subtitle: 'จัดการชื่อ, รูปภาพ และข้อมูลส่วนตัว',
                      gradient: const [Color(0xFF4158D0), Color(0xFFC850C0)],
                      onTap: _navigateToEditProfile,
                    ),
                    _buildEnhancedSettingsTile(
                      icon: Icons.lock_outline_rounded,
                      title: 'ความปลอดภัย',
                      subtitle: 'รหัสผ่านและการยืนยันตัวตน',
                      gradient: const [Color(0xFF00F2EA), Color(0xFF00C9A7)],
                      onTap: _navigateToSecurity,
                    ),
                    _buildEnhancedSettingsTile(
                      icon: Icons.bookmark_border_rounded,
                      title: 'รายการที่บันทึก',
                      subtitle: 'โพสต์และสินค้าที่คุณชื่นชอบ',
                      gradient: const [Color(0xFFFFCC70), Color(0xFFFFA500)],
                      onTap: () {},
                    ),
                    _buildEnhancedSettingsTile(
                      icon: Icons.wallet_rounded,
                      title: 'กระเป๋าเงิน',
                      subtitle: 'ยอดคงเหลือและประวัติการทำรายการ',
                      gradient: const [Color(0xFFFF0050), Color(0xFFFF6B6B)],
                      onTap: _showEnhancedWallet,
                    ),
                  ]),
                  const SizedBox(height: 24),
                  _buildEnhancedSettingsGroup('การตั้งค่าแอป', [
                    _buildEnhancedSettingsTile(
                      icon: Icons.notifications_outlined,
                      title: 'การแจ้งเตือน',
                      subtitle: 'จัดการการแจ้งเตือนต่างๆ',
                      gradient: const [Color(0xFF4158D0), Color(0xFFC850C0)],
                      onTap: _showEnhancedNotificationSettings,
                    ),
                    _buildEnhancedSettingsTile(
                      icon: Icons.language,
                      title: 'ภาษา',
                      subtitle: 'ไทย (เริ่มต้น)',
                      gradient: const [Color(0xFF00F2EA), Color(0xFF00C9A7)],
                      onTap: _showEnhancedLanguageSelection,
                    ),
                    _buildEnhancedSettingsTile(
                      icon: Icons.dark_mode_outlined,
                      title: 'ธีม',
                      subtitle: 'โหมดมืด (เริ่มต้น)',
                      gradient: const [Color(0xFFFFCC70), Color(0xFFFFA500)],
                      onTap: _showEnhancedThemeSelection,
                    ),
                  ]),
                  const SizedBox(height: 24),
                  _buildEnhancedSettingsGroup('ช่วยเหลือและสนับสนุน', [
                    _buildEnhancedSettingsTile(
                      icon: Icons.help_outline_rounded,
                      title: 'ศูนย์ช่วยเหลือ',
                      subtitle: 'คำถามที่พบบ่อยและวิธีใช้งาน',
                      gradient: const [Color(0xFFFF0050), Color(0xFFFF6B6B)],
                      onTap: _showEnhancedHelpCenter,
                    ),
                    _buildEnhancedSettingsTile(
                      icon: Icons.info_outline_rounded,
                      title: 'เกี่ยวกับแอป',
                      subtitle: 'เวอร์ชัน 1.0.0',
                      gradient: const [Color(0xFF4158D0), Color(0xFFC850C0)],
                      onTap: _showEnhancedAboutApp,
                    ),
                  ]),
                  const SizedBox(height: 40),
                  Container(
                    width: double.infinity,
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: LinearGradient(
                        colors: [
                          Colors.redAccent.withValues(alpha: 0.1),
                          Colors.redAccent.withValues(alpha: 0.05),
                        ],
                      ),
                      border: Border.all(
                        color: Colors.redAccent.withValues(alpha: 0.3),
                      ),
                    ),
                    child: ElevatedButton(
                      onPressed: () async {
                        await TukTukBridge().logout();
                        if (mounted) {
                          setState(() {
                            _userData = null;
                            _isMe = false;
                            _isFollowing = false;
                          });
                          Navigator.pop(context);
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const LoginScreen(),
                            ),
                          );
                          if (mounted) _fetchProfileData();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.logout_rounded,
                            color: Colors.redAccent,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'ออกจากระบบ',
                            style: GoogleFonts.kanit(
                              color: Colors.redAccent,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedSettingsGroup(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            title,
            style: GoogleFonts.kanit(
              color: Colors.orangeAccent,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1A1F35),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            children: children
                .asMap()
                .map(
                  (index, child) => MapEntry(
                    index,
                    Column(
                      children: [
                        child,
                        if (index != children.length - 1)
                          Divider(
                            height: 1,
                            thickness: 1,
                            color: Colors.white.withValues(alpha: 0.05),
                            indent: 70,
                          ),
                      ],
                    ),
                  ),
                )
                .values
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildEnhancedSettingsTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      leading: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 24),
      ),
      title: Text(
        title,
        style: GoogleFonts.kanit(
          color: Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Text(
          subtitle,
          style: GoogleFonts.kanit(
            color: Colors.white38,
            fontSize: 12,
          ),
        ),
      ),
      trailing: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.chevron_right_rounded,
          color: Colors.white24,
          size: 20,
        ),
      ),
    );
  }

  void _showEnhancedNotificationSettings() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1F35),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF4158D0), Color(0xFFC850C0)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications,
                  color: Colors.white,
                  size: 30,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'การตั้งค่าการแจ้งเตือน',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              _buildEnhancedSwitchTile('การแจ้งเตือนออเดอร์', true),
              const SizedBox(height: 12),
              _buildEnhancedSwitchTile('ข้อความใหม่', true),
              const SizedBox(height: 12),
              _buildEnhancedSwitchTile('การอัปเดตระบบ', false),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orangeAccent,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'ปิด',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEnhancedSwitchTile(String title, bool value) {
    return StatefulBuilder(
      builder: (context, setState) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
            Switch(
              value: value,
              onChanged: (v) => setState(() => value = v),
              activeColor: Colors.orangeAccent,
              activeTrackColor: Colors.orangeAccent.withValues(alpha: 0.3),
            ),
          ],
        ),
      ),
    );
  }

  void _showEnhancedLanguageSelection() {
    const String currentLang = 'th';
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1F35),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF00F2EA), Color(0xFF00C9A7)],
                  ),
                  shape: BoxShape.circle,
                ),
                child:
                    const Icon(Icons.language, color: Colors.white, size: 30),
              ),
              const SizedBox(height: 16),
              const Text(
                'เลือกภาษา',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              _buildEnhancedRadioTile('ภาษาไทย', 'th', currentLang, (v) {
                Navigator.pop(context);
              }),
              const SizedBox(height: 12),
              _buildEnhancedRadioTile('English', 'en', currentLang, (v) {
                Navigator.pop(context);
              }),
            ],
          ),
        ),
      ),
    );
  }

  void _showEnhancedThemeSelection() {
    const String currentTheme = 'dark';
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1F35),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFFFCC70), Color(0xFFFFA500)],
                  ),
                  shape: BoxShape.circle,
                ),
                child:
                    const Icon(Icons.dark_mode, color: Colors.white, size: 30),
              ),
              const SizedBox(height: 16),
              const Text(
                'เลือกธีม',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              _buildEnhancedRadioTile('โหมดมืด', 'dark', currentTheme, (v) {
                Navigator.pop(context);
              }),
              const SizedBox(height: 12),
              _buildEnhancedRadioTile('โหมดสว่าง', 'light', currentTheme, (v) {
                Navigator.pop(context);
              }),
              const SizedBox(height: 12),
              _buildEnhancedRadioTile('ตามระบบ', 'system', currentTheme, (v) {
                Navigator.pop(context);
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEnhancedRadioTile(
    String title,
    String value,
    String groupValue,
    Function(String?) onChanged,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: RadioListTile<String>(
        title: Text(
          title,
          style: const TextStyle(color: Colors.white, fontSize: 14),
        ),
        value: value,
        groupValue: groupValue,
        activeColor: Colors.orangeAccent,
        onChanged: onChanged,
        contentPadding: EdgeInsets.zero,
      ),
    );
  }

  void _showEnhancedHelpCenter() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Color(0xFF0A0E21),
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
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
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFF0050), Color(0xFFFF6B6B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.help_outline,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'ศูนย์ช่วยเหลือ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white10, height: 30),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildEnhancedFaqItem(
                    'วิธีลงขายสินค้า',
                    'ไปที่หน้าแดชบอร์ดผู้ขายและกดปุ่ม "ลงสินค้า"',
                    Icons.shopping_bag,
                  ),
                  const SizedBox(height: 16),
                  _buildEnhancedFaqItem(
                    'การถอนเงิน',
                    'คุณสามารถตั้งค่าบัญชีธนาคารในเมนูการตั้งค่าร้านค้า',
                    Icons.account_balance_wallet,
                  ),
                  const SizedBox(height: 16),
                  _buildEnhancedFaqItem(
                    'ติดต่อทีมงาน',
                    'สามารถติดต่อได้ผ่าน LINE Official @tuktuk',
                    Icons.chat,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedFaqItem(String question, String answer, IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          colorScheme: const ColorScheme.dark().copyWith(
            primary: Colors.orangeAccent,
          ),
        ),
        child: ExpansionTile(
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.orangeAccent.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.orangeAccent, size: 20),
          ),
          title: Text(
            question,
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(60, 0, 16, 16),
              child: Text(
                answer,
                style: GoogleFonts.kanit(
                  color: Colors.white70,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showEnhancedAboutApp() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1F35),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.orangeAccent.withValues(alpha: 0.2),
                      Colors.orange.withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.shopping_bag_rounded,
                  size: 60,
                  color: Colors.orangeAccent,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'TukTuk Marketplace',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'เวอร์ชัน 1.2.4 (Premium Build)',
                  style: GoogleFonts.rubik(color: Colors.white54, fontSize: 12),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'TukTuk คือแพลตฟอร์มซื้อขายสินค้าและแลกเปลี่ยนประสบการณ์ที่เชื่อมต่อผู้คนทั่วประเทศไทยเข้าด้วยกัน ด้วยความปลอดภัยและรวดเร็วสูงสุด',
                textAlign: TextAlign.center,
                style: GoogleFonts.kanit(
                  color: Colors.white70,
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orangeAccent,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  'ปิด',
                  style: GoogleFonts.kanit(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEnhancedWallet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
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
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFFF0050), Color(0xFFFF6B6B)],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.wallet_rounded,
                color: Colors.white,
                size: 40,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'กระเป๋าเงิน',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4158D0), Color(0xFFC850C0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4158D0).withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'MY WALLET',
                        style: GoogleFonts.rubik(
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const Icon(
                        Icons.nfc_rounded,
                        color: Colors.white54,
                        size: 20,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '${_formatNumber(_userData?['coins'] ?? 0)} Coins',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '≈ ${((_userData?['coins'] ?? 0) / 100).toStringAsFixed(2)} บาท',
                    style: GoogleFonts.kanit(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildEnhancedWalletAction('เติมเงิน', Icons.add_card, () {
                  Navigator.pop(context);
                  _showSnackBar('ฟีเจอร์เติมเงินกำลังพัฒนา 🚀');
                }),
                _buildEnhancedWalletAction(
                    'ถอนเงิน', Icons.account_balance_wallet, () {
                  Navigator.pop(context);
                  _showSnackBar('ฟีเจอร์ถอนเงินกำลังพัฒนา 🚀');
                }),
                _buildEnhancedWalletAction('โอน', Icons.send, () {
                  Navigator.pop(context);
                  _showSnackBar('ฟีเจอร์โอนเงินกำลังพัฒนา 🚀');
                }),
                _buildEnhancedWalletAction('ประวัติ', Icons.history, () {
                  Navigator.pop(context);
                  _showSnackBar('ฟีเจอร์ประวัติกำลังพัฒนา 🚀');
                }),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedWalletAction(
    String label,
    IconData icon,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withValues(alpha: 0.08),
                  Colors.white.withValues(alpha: 0.04),
                ],
              ),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.kanit(
              color: Colors.white70,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  void _showEnhancedQRCode() {
    final uid = _userData?['uid'] ?? '';
    final name = _userData?['displayName'] ?? 'ผู้ใช้งาน';
    final handle = _userData?['handle'] ??
        name.toString().replaceAll(' ', '').toLowerCase();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(28),
        decoration: const BoxDecoration(
          color: Color(0xFF0A0E21),
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'คิวอาร์โค้ดของฉัน',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'ให้เพื่อนสแกนเพื่อติดตามคุณ',
              style: GoogleFonts.kanit(color: Colors.white38, fontSize: 13),
            ),
            const SizedBox(height: 32),
            Container(
              width: 240,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00F2EA).withValues(alpha: 0.3),
                    blurRadius: 30,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  SizedBox(
                    width: 200,
                    height: 200,
                    child: CachedNetworkImage(
                      imageUrl: 'https://api.qrserver.com/v1/create-qr-code/'
                          '?size=300x300'
                          '&margin=10'
                          '&color=0A0E21'
                          '&bgcolor=FFFFFF'
                          '&data=${Uri.encodeComponent("tuktuk://profile?uid=$uid")}',
                      fit: BoxFit.cover,
                      placeholder: (context, url) =>
                          const Center(child: CircularProgressIndicator()),
                      errorWidget: (context, url, error) => const Icon(
                        Icons.qr_code_2_rounded,
                        size: 100,
                        color: Color(0xFF0A0E21),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '@$handle',
                    style: GoogleFonts.rubik(
                      color: const Color(0xFF0A0E21),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.link_rounded,
                    color: Color(0xFF00F2EA),
                    size: 18,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'tuktuk.feed/profile/$uid',
                      style: GoogleFonts.rubik(
                        color: Colors.white60,
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.copy_rounded,
                      color: Color(0xFF00F2EA),
                      size: 18,
                    ),
                    onPressed: () {
                      // Simulating copy
                      _showSnackBar('คัดลอกลิงก์โปรไฟล์แล้ว');
                    },
                    constraints: const BoxConstraints(),
                    padding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _buildEnhancedActionButton(
              label: 'แชร์โปรไฟล์',
              icon: Icons.share_rounded,
              onTap: () {
                Navigator.pop(context);
                _shareProfile();
              },
              gradient: const [Color(0xFF4158D0), Color(0xFFC850C0)],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _shareProfile() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
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
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF00F2EA), Color(0xFF00C9A7)],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.share_rounded,
                color: Colors.white,
                size: 40,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'แชร์โปรไฟล์',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildEnhancedShareOption(
                  Icons.facebook,
                  'Facebook',
                  const Color(0xFF1877F2),
                  () {
                    Navigator.pop(context);
                    _showSnackBar('แชร์ไปยัง Facebook');
                  },
                ),
                _buildEnhancedShareOption(
                  Icons.chat,
                  'LINE',
                  const Color(0xFF06C755),
                  () {
                    Navigator.pop(context);
                    _showSnackBar('แชร์ไปยัง LINE');
                  },
                ),
                _buildEnhancedShareOption(
                  Icons.message,
                  'Messages',
                  Colors.green,
                  () {
                    Navigator.pop(context);
                    _showSnackBar('แชร์ไปยัง Messages');
                  },
                ),
                _buildEnhancedShareOption(
                  Icons.link,
                  'ลิงก์',
                  Colors.orange,
                  () {
                    Navigator.pop(context);
                    _showSnackBar('คัดลอกลิงก์แล้ว');
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedShareOption(
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
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
            style: GoogleFonts.kanit(
              color: Colors.white70,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  // ============== NAVIGATION (KEPT ORIGINAL) ==============
  void _navigateToSecurity() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SecuritySettingsScreen(),
      ),
    );
  }

  void _navigateToEditProfile() async {
    if (_userData == null) return;
    final refresh = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditProfileScreen(userData: _userData!),
      ),
    );
    if (refresh == true) _fetchProfileData();
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate({required this.child});
  final Widget child;

  @override
  double get minExtent => 80;
  @override
  double get maxExtent => 80;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(child: child);
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) => false;
}
