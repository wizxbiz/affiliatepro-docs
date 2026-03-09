import 'dart:convert';
import 'dart:io';

import 'package:badges/badges.dart' as badges;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';

import '../services/chat_service.dart';
import '../services/tuktuk_bridge.dart';
import '../services/tuktuk_go_service.dart';
import '../services/tuktuk_storage_bridge.dart';
import '../widgets/common/tuktuk_error_widget.dart';
import 'chat_screen.dart';
import 'edit_profile_screen.dart';
import 'message_list_screen.dart';
import 'notifications_screen.dart';
import 'post_product_screen.dart';
import 'transaction_history_screen.dart';

// 🛡️ CRITICAL: This file contains the Seller Dashboard logic.
// Do not replace with placeholders. Keep Firestore fallbacks active to prevent data loss.

class SellerDashboardScreen extends StatefulWidget {
  final String? sellerId;
  final String? sellerName;

  const SellerDashboardScreen({
    super.key,
    this.sellerId,
    this.sellerName,
  });

  @override
  State<SellerDashboardScreen> createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  final _goService = TukTukGoService();
  bool _isLoading = true;
  Map<String, dynamic>? _reportData;
  Map<String, dynamic>? _analyticsData;
  Map<String, dynamic>? _shopStats; // Local Firestore Stats
  List<Map<String, dynamic>>? _recentOrders; // Local Firestore Orders
  List<Map<String, dynamic>>? _products; // Local Firestore Products
  Map<String, dynamic>? _userSession;
  String? _error;
  bool _isSeller = false;
  bool _isPremium = false;
  String _productSearchQuery = '';
  String _productFilter = 'all'; // all, active, sold_out
  bool _showInventory = true;
  final Map<String, int> _pendingStock = {};

  @override
  void initState() {
    super.initState();
    _loadCachedData(); // Fast first paint from cache
    _fetchData();
  }

  Future<void> _loadCachedData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedStats =
          prefs.getString('seller_cached_stats_${widget.sellerId}');
      final cachedProducts =
          prefs.getString('seller_cached_products_${widget.sellerId}');

      if (cachedStats != null && mounted) {
        setState(() {
          _shopStats = json.decode(cachedStats);
        });
      }
      if (cachedProducts != null && mounted) {
        setState(() {
          _products =
              List<Map<String, dynamic>>.from(json.decode(cachedProducts));
        });
      }
    } catch (e) {
      debugPrint('Error loading cached dashboard data: $e');
    }
  }

  /// Recursively convert Firestore Timestamps and other non-JSON types to
  /// JSON-safe equivalents before caching.
  dynamic _toJsonSafe(dynamic value) {
    if (value is Timestamp) return value.toDate().toIso8601String();
    if (value is Map) {
      return value.map((k, v) => MapEntry(k.toString(), _toJsonSafe(v)));
    }
    if (value is List) return value.map(_toJsonSafe).toList();
    return value;
  }

  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_shopStats != null) {
        await prefs.setString('seller_cached_stats_${widget.sellerId}',
            json.encode(_toJsonSafe(_shopStats)));
      }
      if (_products != null) {
        await prefs.setString('seller_cached_products_${widget.sellerId}',
            json.encode(_toJsonSafe(_products)));
      }
    } catch (e) {
      debugPrint('Error saving dashboard data to cache: $e');
    }
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final bridge = TukTukBridge();
      final session = await bridge.getCurrentUser();

      if (session == null) {
        if (mounted) {
          setState(() {
            _error = 'กรุณาเข้าสู่ระบบก่อนเข้าใช้งานแดชบอร์ด';
            _isLoading = false;
          });
        }
        return;
      }

      final String currentSellerId = widget.sellerId ?? session['uid'];

      // Check if user is either own seller account or verified
      final bool isSeller =
          (widget.sellerId != null && widget.sellerId == session['uid']) ||
              session['isSeller'] == true ||
              session['sellerStatus'] == 'verified';

      // Parallel Fetch: Go Engine + Firestore (Primary) + Products
      final results = await Future.wait([
        _goService.getSellerReports(currentSellerId),
        _goService.getCommunityAnalytics(period: 'onemonth'),
        bridge.getShopStats(currentSellerId),
        bridge.getRecentOrders(currentSellerId),
        bridge.getMarketplaceProductsAdvanced(sellerId: currentSellerId),
      ]);

      if (mounted) {
        final products = results[4] as List<Map<String, dynamic>>?;
        final isPremium = session['isPremium'] == true ||
            session['subscriptionStatus'] == 'active' ||
            session['role'] == 'premium';

        setState(() {
          _userSession = session;
          _isSeller = isSeller;
          _isPremium = isPremium;
          _reportData = results[0] as Map<String, dynamic>?;
          _analyticsData = results[1] as Map<String, dynamic>?;
          _shopStats = results[2] as Map<String, dynamic>?;
          _recentOrders = results[3] as List<Map<String, dynamic>>?;
          _products = products;
          _isLoading = false;
        });
        _saveToCache(); // Persist for offline
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้: $e';
          _isLoading = false;
        });
      }
    }
  }

  Stream<int> _notificationCountStream() {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return Stream.value(0);
    return FirebaseFirestore.instance
        .collection('notifications')
        .where('uid', isEqualTo: uid)
        .where('isRead', isEqualTo: false)
        .snapshots()
        .map((snap) => snap.docs.length);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      appBar: _buildAppBar(),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFF00D2FF),
        child: _isLoading
            ? _buildShimmerLoading()
            : _error != null
                ? TukTukErrorWidget(message: _error!, onRetry: _fetchData)
                : !_isSeller
                    ? _buildNotSellerState()
                    : _buildMainContent(),
      ),
      floatingActionButton: _isSeller ? _buildSmartPostFAB() : null,
    );
  }

  Widget _buildSmartPostFAB() {
    return FloatingActionButton.extended(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const PostProductScreen()),
        );
      },
      backgroundColor: const Color(0xFF00D2FF),
      icon: const Icon(Icons.auto_awesome, color: Colors.black),
      label: Text(
        'Smart Post',
        style:
            GoogleFonts.kanit(color: Colors.black, fontWeight: FontWeight.bold),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF1A1F35),
      elevation: 0,
      title: Text(
        'Seller Dashboard',
        style: GoogleFonts.kanit(fontWeight: FontWeight.bold),
      ),
      actions: [
        _buildNotificationIcon(),
        _buildChatIcon(),
        IconButton(
          onPressed: () {
            if (_userSession != null) {
              Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => EditProfileScreen(userData: _userSession!)),
              );
            }
          },
          icon: const Icon(Icons.settings_outlined),
        ),
      ],
    );
  }

  Widget _buildNotificationIcon() {
    return StreamBuilder<int>(
      stream: _notificationCountStream(),
      builder: (context, snapshot) {
        final count = snapshot.data ?? 0;
        return _buildBadgeIcon(Icons.notifications_outlined, count, () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NotificationsScreen()),
          );
        });
      },
    );
  }

  Widget _buildChatIcon() {
    return StreamBuilder<int>(
      stream: ChatService().getTotalProductUnreadStream(),
      builder: (context, snapshot) {
        final count = snapshot.data ?? 0;
        return _buildBadgeIcon(Icons.chat_bubble_outline_rounded, count, () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MessageListScreen()),
          );
        });
      },
    );
  }

  Widget _buildBadgeIcon(IconData icon, int count, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0, top: 4.0),
      child: badges.Badge(
        position: badges.BadgePosition.topEnd(top: 0, end: 3),
        showBadge: count > 0,
        badgeContent: Text(
          count.toString(),
          style: const TextStyle(
              color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
        ),
        badgeStyle: const badges.BadgeStyle(
            badgeColor: Color(0xFFFF0050), padding: EdgeInsets.all(4)),
        child: IconButton(
          icon: Icon(icon),
          onPressed: onTap,
        ),
      ),
    );
  }

  Widget _buildMainContent() {
    final stats = _reportData?['stats'] ?? {};
    double totalSales = (stats['totalSales'] ?? 0.0).toDouble();
    int totalOrders = stats['totalOrders'] ?? 0;
    int totalViews = stats['totalViews'] ?? 0;

    // 🛡️ Primary Fallback to Firestore (Bridge) if Go Engine has no data
    if (totalSales == 0 && totalOrders == 0 && _shopStats != null) {
      totalSales = (_shopStats!['totalRevenue'] ?? 0.0).toDouble();
      totalOrders = _shopStats!['totalOrders'] ?? 0;
      totalViews = _shopStats!['totalViews'] ?? 0;
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildShopBanner(),
        const SizedBox(height: 32),
        _buildStatsGrid(totalSales, totalOrders, totalViews),
        const SizedBox(height: 32),
        if (!_isPremium) ...[
          _buildUpgradeCTA(),
          const SizedBox(height: 32),
        ],
        _buildSectionHeader('Product Management',
            onSeeAll: () => Navigator.pushNamed(context, '/my_products')),
        const SizedBox(height: 16),
        _buildProductSearchBox(),
        const SizedBox(height: 16),
        _buildProductFilterTabs(),
        const SizedBox(height: 16),
        _buildProductList(),
        const SizedBox(height: 32),
        _buildSectionHeader('Inventory', onSeeAll: () {
          setState(() => _showInventory = !_showInventory);
        }),
        const SizedBox(height: 16),
        _buildInventorySection(),
        const SizedBox(height: 32),
        _buildSectionHeader('Recent Orders',
            onSeeAll: () => Navigator.pushNamed(context, '/orders')),
        const SizedBox(height: 16),
        _buildRecentOrders(),
        const SizedBox(height: 32),
        _buildSectionHeader('AI Performance Insights'),
        const SizedBox(height: 16),
        _buildAnalyticsChart(),
        const SizedBox(height: 32),
        _buildSectionHeader('Merchant Tools'),
        const SizedBox(height: 16),
        _buildQuickTools(),
        const SizedBox(height: 32),
        _buildCommunityInsights(),
      ],
    );
  }

  Widget _buildShopBanner() {
    final String shopName =
        _userSession?['displayName'] ?? widget.sellerName ?? "ร้านค้าของคุณ";
    final String? pictureUrl = _userSession?['pictureUrl'];
    final String tier = _isPremium ? "PRO" : "STARTER";

    return Container(
      height: 180,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        image: const DecorationImage(
          image: NetworkImage(
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000'),
          fit: BoxFit.cover,
          opacity: 0.4,
        ),
        gradient: const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [Color(0xFF050A14), Colors.transparent],
        ),
        border:
            Border.all(color: const Color(0xFF00D2FF).withValues(alpha: 0.2)),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Row(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF00D2FF).withValues(alpha: 0.3),
                        blurRadius: 15,
                      )
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: pictureUrl != null
                        ? Image.network(pictureUrl, fit: BoxFit.cover)
                        : Container(
                            color: const Color(0xFF00D2FF),
                            child: Center(
                              child: Text(
                                shopName[0].toUpperCase(),
                                style: GoogleFonts.kanit(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white),
                              ),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shopName,
                        style: GoogleFonts.kanit(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF00E676),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'ร้านค้าได้รับการยืนยัน • $tier',
                              style: GoogleFonts.kanit(
                                color: const Color(0xFF00E676),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpgradeCTA() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF8B5CF6), Color(0xFF00D2FF)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.stars_rounded, color: Colors.white, size: 40),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Upgrade to Professional',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'ปลดล็อกระบบ AI อัจฉริยะและสถิติเชิงลึก',
                  style: GoogleFonts.kanit(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: _showMembershipPackages,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF8B5CF6),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            child: Text(
              'เลือกแผน',
              style: GoogleFonts.kanit(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductSearchBox() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F35),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: TextField(
        onChanged: (val) => setState(() => _productSearchQuery = val),
        style: GoogleFonts.kanit(color: Colors.white),
        decoration: InputDecoration(
          icon: const Icon(Icons.search, color: Color(0xFF00D2FF)),
          hintText: 'ค้นหาสินค้าของคุณ...',
          hintStyle: GoogleFonts.kanit(color: Colors.white38),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildProductFilterTabs() {
    final List<Map<String, String>> filters = [
      {'id': 'all', 'label': 'ทั้งหมด'},
      {'id': 'active', 'label': 'กำลังขาย'},
      {'id': 'sold_out', 'label': 'สินค้าหมด'},
    ];

    return Row(
      children: filters.map((f) {
        final bool isActive = _productFilter == f['id'];
        return GestureDetector(
          onTap: () => setState(() => _productFilter = f['id']!),
          child: Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              gradient: isActive
                  ? const LinearGradient(
                      colors: [Color(0xFF00D2FF), Color(0xFF0088CC)])
                  : null,
              color: isActive ? null : const Color(0xFF1A1F35),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              f['label']!,
              style: GoogleFonts.kanit(
                color: isActive ? Colors.white : Colors.white54,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                fontSize: 13,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildProductList() {
    final filtered = _products?.where((p) {
      if (_productSearchQuery.isNotEmpty) {
        final name = (p['name'] ?? p['title'] ?? '').toString().toLowerCase();
        if (!name.contains(_productSearchQuery.toLowerCase())) return false;
      }
      if (_productFilter == 'active') return p['stock'] != 0;
      if (_productFilter == 'sold_out') return p['stock'] == 0;
      return true;
    }).toList();

    if (filtered == null || filtered.isEmpty) {
      return Container(
        height: 120,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(
          child: Text('ไม่พบรายการสินค้า',
              style: GoogleFonts.kanit(color: Colors.white38)),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
      ),
      itemCount: filtered.length > 4 ? 4 : filtered.length,
      itemBuilder: (context, index) {
        final p = filtered[index];
        return _buildPremiumProductCard(p);
      },
    );
  }

  Widget _buildPremiumProductCard(Map<String, dynamic> p) {
    final name = p['name'] ?? p['title'] ?? 'สินค้า';
    final price = p['price'] ?? 0.0;
    final String? imageUrl =
        p['imageUrl'] ?? (p['images'] is List ? p['images'][0] : null);
    final int views = p['views'] ?? 0;
    final int sold = p['sold'] ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(20)),
              child: Stack(
                children: [
                  imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          placeholder: (context, url) =>
                              Container(color: Colors.white10),
                          errorWidget: (context, url, error) =>
                              const Icon(Icons.error),
                        )
                      : Container(color: Colors.white10),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E676),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('Active',
                          style: GoogleFonts.kanit(
                              color: Colors.black,
                              fontSize: 10,
                              fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  '฿$price',
                  style: GoogleFonts.kanit(
                      color: const Color(0xFF00D2FF),
                      fontWeight: FontWeight.bold,
                      fontSize: 16),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.remove_red_eye_outlined,
                            color: Colors.white38, size: 12),
                        const SizedBox(width: 4),
                        Text('$views',
                            style: GoogleFonts.kanit(
                                color: Colors.white38, fontSize: 10)),
                      ],
                    ),
                    Row(
                      children: [
                        const Icon(Icons.shopping_bag_outlined,
                            color: Colors.white38, size: 12),
                        const SizedBox(width: 4),
                        Text('$sold',
                            style: GoogleFonts.kanit(
                                color: Colors.white38, fontSize: 10)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickTools() {
    final List<Map<String, dynamic>> tools = [
      {
        'label': 'Analytics',
        'icon': Icons.insights_rounded,
        'color': const Color(0xFF00D2FF)
      },
      {
        'label': 'Finances',
        'icon': Icons.account_balance_wallet_rounded,
        'color': const Color(0xFF00E676)
      },
      {
        'label': 'Marketing',
        'icon': Icons.campaign_rounded,
        'color': const Color(0xFFFFD600)
      },
      {
        'label': 'AI Tools',
        'icon': Icons.psychology_rounded,
        'color': const Color(0xFF8B5CF6)
      },
      {
        'label': 'Customers',
        'icon': Icons.people_alt_rounded,
        'color': Colors.orangeAccent
      },
      {
        'label': 'Settings',
        'icon': Icons.settings_suggest_rounded,
        'color': Colors.blueGrey
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1.1,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
      ),
      itemCount: tools.length,
      itemBuilder: (context, index) {
        final tool = tools[index];
        return InkWell(
          onTap: () {
            switch (tool['label']) {
              case 'Analytics':
                _showAnalyticsDetails();
                break;
              case 'Finances':
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const TransactionHistoryScreen()),
                );
                break;
              case 'Marketing':
                _showMarketingCenter();
                break;
              case 'AI Tools':
                _showAISellerTools();
                break;
              case 'Customers':
                _showCustomerList();
                break;
              case 'Settings':
                if (_userSession != null) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            EditProfileScreen(userData: _userSession!)),
                  );
                }
                break;
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1A1F35),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: (tool['color'] as Color).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(tool['icon'] as IconData,
                      color: tool['color'] as Color, size: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  tool['label'] as String,
                  style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.normal),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatsGrid(dynamic sales, dynamic orders, dynamic views) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.4,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      children: [
        _buildStatCard('ยอดขายสะสม', '฿$sales', Icons.auto_graph_rounded,
            Colors.greenAccent),
        _buildStatCard('สินค้าทั้งหมด', '${_products?.length ?? 0}',
            Icons.inventory_2_rounded, const Color(0xFF8B5CF6)),
        _buildStatCard('คำสั่งซื้อ', '$orders', Icons.shopping_basket_rounded,
            const Color(0xFF00D2FF)),
        _buildStatCard('ยอดเข้าชม', '$views', Icons.visibility_rounded,
            Colors.orangeAccent),
      ],
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.kanit(color: Colors.white54, fontSize: 12),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          Text(
            value,
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, {VoidCallback? onSeeAll}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: GoogleFonts.kanit(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        if (onSeeAll != null)
          TextButton(
            onPressed: onSeeAll,
            child: Row(
              children: [
                Text(
                  'ดูทั้งหมด',
                  style: GoogleFonts.kanit(
                      color: const Color(0xFF00D2FF),
                      fontWeight: FontWeight.bold),
                ),
                const Icon(Icons.chevron_right_rounded,
                    color: Color(0xFF00D2FF), size: 20),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildAnalyticsChart() {
    // Build chart data from products (top 5 by views) or analytics fallback
    final rawProducts = _products ?? [];
    final chartItems = rawProducts
        .where((p) => (p['views'] ?? p['viewCount'] ?? 0) > 0)
        .toList()
      ..sort((a, b) => ((b['views'] ?? b['viewCount'] ?? 0) as num)
          .compareTo((a['views'] ?? a['viewCount'] ?? 0) as num));

    final topItems = chartItems.take(5).toList();

    // Summary stats row
    final double totalRevenue = (_reportData?['stats']?['totalSales'] ??
            _shopStats?['totalRevenue'] ??
            0)
        .toDouble();
    final int totalOrders = (_reportData?['stats']?['totalOrders'] ??
        _shopStats?['totalOrders'] ??
        0) as int;
    final int totalViews = (_reportData?['stats']?['totalViews'] ??
        _shopStats?['totalViews'] ??
        0) as int;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F35),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary stats
          Row(
            children: [
              _buildMiniStat('รายได้รวม', '฿${totalRevenue.toStringAsFixed(0)}',
                  const Color(0xFF00D2FF)),
              const SizedBox(width: 12),
              _buildMiniStat(
                  'คำสั่งซื้อ', '$totalOrders', const Color(0xFF00E676)),
              const SizedBox(width: 12),
              _buildMiniStat('ยอดชม', '$totalViews', const Color(0xFFFFB300)),
            ],
          ),
          if (topItems.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              'Top 5 สินค้าจากยอดชม',
              style: GoogleFonts.kanit(color: Colors.white54, fontSize: 12),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 160,
              child: BarChart(
                BarChartData(
                  backgroundColor: Colors.transparent,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: _chartMaxY(topItems) / 4,
                    getDrawingHorizontalLine: (_) => FlLine(
                      color: Colors.white.withValues(alpha: 0.05),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (idx < 0 || idx >= topItems.length) {
                            return const SizedBox.shrink();
                          }
                          final name = (topItems[idx]['name'] ??
                                  topItems[idx]['productName'] ??
                                  '')
                              .toString();
                          return Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              name.length > 5
                                  ? '${name.substring(0, 5)}…'
                                  : name,
                              style: GoogleFonts.kanit(
                                  color: Colors.white38, fontSize: 9),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  maxY: _chartMaxY(topItems) * 1.2,
                  barGroups: List.generate(topItems.length, (i) {
                    final views = ((topItems[i]['views'] ??
                            topItems[i]['viewCount'] ??
                            0) as num)
                        .toDouble();
                    return BarChartGroupData(
                      x: i,
                      barRods: [
                        BarChartRodData(
                          toY: views,
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              const Color(0xFF00D2FF).withValues(alpha: 0.6),
                              const Color(0xFF00D2FF),
                            ],
                          ),
                          width: 28,
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(6)),
                          backDrawRodData: BackgroundBarChartRodData(
                            show: true,
                            toY: _chartMaxY(topItems) * 1.2,
                            color: Colors.white.withValues(alpha: 0.03),
                          ),
                        ),
                      ],
                    );
                  }),
                ),
              ),
            ),
          ] else ...[
            const SizedBox(height: 20),
            Center(
              child: Text(
                'ยังไม่มีข้อมูลยอดชม\nลงสินค้าเพื่อเริ่มติดตามสถิติ',
                style: GoogleFonts.kanit(color: Colors.white24, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 20),
          ],
        ],
      ),
    );
  }

  double _chartMaxY(List items) {
    if (items.isEmpty) return 10;
    final max = items
        .map((p) => ((p['views'] ?? p['viewCount'] ?? 0) as num).toDouble())
        .reduce((a, b) => a > b ? a : b);
    return max < 1 ? 10 : max;
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value,
                style: GoogleFonts.outfit(
                    color: color, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(label,
                style: GoogleFonts.kanit(color: Colors.white38, fontSize: 10)),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentOrders() {
    final bool hasRealOrders =
        _recentOrders != null && _recentOrders!.isNotEmpty;
    final List<Map<String, dynamic>> displayOrders = hasRealOrders
        ? _recentOrders!
        : List.generate(
            3,
            (index) => {
              'id': 'TK-2024-${100 - index}',
              'customerName': index == 0
                  ? 'สมชาย ใจดี'
                  : index == 1
                      ? 'สมหญิง รักเรียน'
                      : 'วิชัย มั่งมี',
              'total': 1250.0 - (index * 200),
              'status': index == 0 ? 'กำลังเตรียม' : 'เสร็จสิ้น',
              'createdAt': DateTime.now()
                  .subtract(Duration(hours: index * 5))
                  .toIso8601String(),
              'isDemo': true,
            },
          );

    return Column(
      children: displayOrders.asMap().entries.map((entry) {
        final order = entry.value;
        final isDemo = order['isDemo'] == true;
        final status = order['status'] ?? 'รอดำเนินการ';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1F35),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isDemo
                  ? Colors.white.withValues(alpha: 0.05)
                  : const Color(0xFF00D2FF).withValues(alpha: 0.1),
            ),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: const Color(0xFF00D2FF).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.shopping_bag_outlined,
                        color: Color(0xFF00D2FF)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'คำสั่งซื้อ #${order['id']?.toString().split('-').last ?? order['id']}',
                          style: GoogleFonts.kanit(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          order['customerName'] ?? 'ลูกค้าทั่วไป',
                          style: GoogleFonts.kanit(
                              color: Colors.white54, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '฿${order['total']}',
                        style: GoogleFonts.kanit(
                          color: const Color(0xFF00D2FF),
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(status).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          status,
                          style: GoogleFonts.kanit(
                            color: _getStatusColor(status),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(color: Colors.white10),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildOrderActionBtn(
                    'ติดต่อ',
                    Icons.chat_bubble_outline_rounded,
                    const Color(0xFF00E676),
                    () => _contactCustomer(order),
                  ),
                  const SizedBox(width: 12),
                  _buildOrderActionBtn(
                    'ยอดรับ',
                    Icons.check_circle_outline_rounded,
                    const Color(0xFF00D2FF),
                    () => _updateOrderStatus(order['id'], 'เสร็จสิ้น'),
                  ),
                  const Spacer(),
                  _buildOrderActionBtn(
                    'ยกเลิก',
                    Icons.cancel_outlined,
                    const Color(0xFFFF3B3B),
                    () => _confirmCancelOrder(order),
                    isMinimal: true,
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Color _getStatusColor(String status) {
    if (status == 'เสร็จสิ้น') return const Color(0xFF00E676);
    if (status == 'ถูกยกเลิก') return const Color(0xFFFF3B3B);
    return const Color(0xFFFFD600);
  }

  Widget _buildOrderActionBtn(
      String label, IconData icon, Color color, VoidCallback onTap,
      {bool isMinimal = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.kanit(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommunityInsights() {
    final insights =
        _analyticsData?['insights'] ?? 'ไม่พบข้อมูลเจาะลึกในขณะนี้';
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF00D2FF).withValues(alpha: 0.1),
            const Color(0xFF0088CC).withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border:
            Border.all(color: const Color(0xFF00D2FF).withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome,
                  color: Color(0xFF00D2FF), size: 18),
              const SizedBox(width: 10),
              Text(
                'TukTuk AI Insights',
                style: GoogleFonts.kanit(
                  color: const Color(0xFF00D2FF),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            insights.toString(),
            style: GoogleFonts.kanit(
                color: Colors.white, fontSize: 14, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildInventorySection() {
    final items = _products ?? [];

    if (!_showInventory) {
      return Container(
        height: 52,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        ),
        child: Text(
          'แตะ "ดูทั้งหมด" เพื่อจัดการสต็อก',
          style: GoogleFonts.kanit(color: Colors.white38, fontSize: 13),
        ),
      );
    }

    if (items.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text('ยังไม่มีสินค้า',
              style: GoogleFonts.kanit(color: Colors.white38)),
        ),
      );
    }

    return Column(
      children: items.take(6).map((p) {
        final productId = (p['id'] ?? p['productId'] ?? '').toString();
        final name = (p['name'] ?? p['productName'] ?? 'สินค้า').toString();
        final String? imageUrl =
            p['imageUrl'] ?? (p['images'] is List ? p['images'][0] : null);
        final int baseStock = (p['stock'] ?? p['quantity'] ?? 0) as int;
        final int stock = _pendingStock[productId] ?? baseStock;
        final bool isLow = stock <= 3;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1F35),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isLow
                  ? const Color(0xFFFF5722).withValues(alpha: 0.3)
                  : Colors.white.withValues(alpha: 0.05),
            ),
          ),
          child: Row(
            children: [
              // Product thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              Container(color: Colors.white10),
                          errorWidget: (_, __, ___) => Container(
                              color: Colors.white10,
                              child: const Icon(Icons.image_outlined,
                                  color: Colors.white24, size: 20)),
                        )
                      : Container(
                          color: Colors.white10,
                          child: const Icon(Icons.inventory_2_outlined,
                              color: Colors.white24, size: 20)),
                ),
              ),
              const SizedBox(width: 14),
              // Name + low-stock warning
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.kanit(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600),
                    ),
                    if (isLow)
                      Text(
                        'สต็อกใกล้หมด!',
                        style: GoogleFonts.kanit(
                            color: const Color(0xFFFF5722), fontSize: 10),
                      ),
                  ],
                ),
              ),
              // Stock stepper
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildStockBtn(
                    Icons.remove,
                    stock <= 0,
                    () => _adjustStock(productId, stock, -1),
                  ),
                  Container(
                    width: 44,
                    alignment: Alignment.center,
                    child: Text(
                      '$stock',
                      style: GoogleFonts.outfit(
                        color: isLow ? const Color(0xFFFF5722) : Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _buildStockBtn(
                    Icons.add,
                    false,
                    () => _adjustStock(productId, stock, 1),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              // Save button — appears only when changed
              if (_pendingStock.containsKey(productId))
                GestureDetector(
                  onTap: () => _saveStock(productId, stock),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00E676).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color:
                              const Color(0xFF00E676).withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      'บันทึก',
                      style: GoogleFonts.kanit(
                          color: const Color(0xFF00E676),
                          fontSize: 11,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStockBtn(IconData icon, bool disabled, VoidCallback onTap) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: disabled
              ? Colors.white.withValues(alpha: 0.03)
              : const Color(0xFF00D2FF).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: disabled
                ? Colors.white.withValues(alpha: 0.05)
                : const Color(0xFF00D2FF).withValues(alpha: 0.3),
          ),
        ),
        child: Icon(
          icon,
          size: 16,
          color: disabled ? Colors.white24 : const Color(0xFF00D2FF),
        ),
      ),
    );
  }

  void _adjustStock(String productId, int current, int delta) {
    final next = (current + delta).clamp(0, 9999);
    setState(() => _pendingStock[productId] = next);
  }

  Future<void> _saveStock(String productId, int stock) async {
    try {
      await TukTukBridge()
          .updateProduct(productId, 'marketplace_items', {'stock': stock});
      setState(() {
        _pendingStock.remove(productId);
        final idx = _products
                ?.indexWhere((p) => (p['id'] ?? p['productId']) == productId) ??
            -1;
        if (idx >= 0) _products![idx]['stock'] = stock;
      });
    } catch (e) {
      debugPrint('Stock save error: $e');
    }
  }

  Widget _buildNotSellerState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: const Color(0xFF00D2FF).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.storefront_rounded,
                  size: 80, color: Color(0xFF00D2FF)),
            ),
            const SizedBox(height: 32),
            Text(
              'คุณยังไม่ได้เป็นผู้ขายกับ TukTuk',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'เปิดร้านค้าของคุณตอนนี้ เพื่อเริ่มขายสินค้าและสร้างรายได้ไปกับเรา!',
              style: GoogleFonts.kanit(color: Colors.white54, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/register_seller'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00D2FF),
                foregroundColor: Colors.black,
                padding:
                    const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30)),
              ),
              child: Text(
                'สมัครเป็นผู้ขายเลย',
                style: GoogleFonts.kanit(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: const Color(0xFF1A1F35),
      highlightColor: const Color(0xFF2A2F45),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(width: 200, height: 30, color: Colors.white),
          const SizedBox(height: 8),
          Container(width: 150, height: 15, color: Colors.white),
          const SizedBox(height: 24),
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 2,
            childAspectRatio: 1.5,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            children: List.generate(
                4,
                (_) => Container(
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20)))),
          ),
          const SizedBox(height: 32),
          Container(
              height: 200,
              decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20))),
        ],
      ),
    );
  }

  // ─── Subscription Plan Constants ───────────────────────────────────────────
  static const _plans = [
    {
      'planId': 'quarter_3m',
      'title': '3 เดือน',
      'price': 899,
      'subtitle': '≈ 300฿/เดือน',
      'months': 3,
      'features': ['ลงขายไม่จำกัด', 'ระบบ AI ช่วยโพสต์', 'สถิติเชิงลึก'],
      'popular': false,
    },
    {
      'planId': 'half_6m',
      'title': '6 เดือน',
      'price': 1599,
      'subtitle': 'ประหยัด 200฿',
      'months': 6,
      'features': ['ลงขายไม่จำกัด', 'บูสต์สินค้าหน้าแรก', 'สถิติเชิงลึก'],
      'popular': true,
    },
    {
      'planId': 'yearly_12m',
      'title': 'รายปี',
      'price': 2899,
      'subtitle': 'ประหยัด 1,289฿',
      'months': 12,
      'features': ['ทุกฟีเจอร์', 'ผู้จัดการส่วนตัว', 'ระบบ CRM ลูกค้า'],
      'popular': false,
    },
  ];

  void _showMembershipPackages() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _buildMembershipSelector(),
    );
  }

  Widget _buildMembershipSelector() {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'เลือกแพ็กเกจที่เหมาะกับคุณ',
            style: GoogleFonts.kanit(
                fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            'ไม่มีค่าคอมมิชชั่น • ทดลองฟรี 1 เดือน',
            style: GoogleFonts.kanit(fontSize: 13, color: Colors.white38),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView(
              children: _plans.map((plan) {
                final isPopular = plan['popular'] as bool;
                final color =
                    isPopular ? const Color(0xFF00C4CC) : Colors.blueAccent;
                return _buildPackageCard(plan, color, isPopular: isPopular);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPackageCard(Map<String, Object> plan, Color color,
      {bool isPopular = false}) {
    final price = plan['price'] as int;
    final subtitle = plan['subtitle'] as String;
    final title = plan['title'] as String;
    final features = plan['features'] as List;
    final planId = plan['planId'] as String;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: isPopular ? color : Colors.white10,
            width: isPopular ? 2 : 1),
      ),
      child: Column(
        children: [
          if (isPopular)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                  color: color, borderRadius: BorderRadius.circular(20)),
              child: const Text('แนะนำ',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
            ),
          Text(title,
              style: GoogleFonts.kanit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white70)),
          const SizedBox(height: 6),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                    text:
                        '฿${price.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',')}',
                    style: GoogleFonts.kanit(
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                        color: Colors.white)),
              ],
            ),
          ),
          Text(subtitle, style: GoogleFonts.kanit(fontSize: 13, color: color)),
          const SizedBox(height: 15),
          ...features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_rounded, size: 16, color: color),
                    const SizedBox(width: 8),
                    Text(f.toString(),
                        style: GoogleFonts.kanit(
                            fontSize: 13, color: Colors.white70)),
                  ],
                ),
              )),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _handlePlanSelection(planId, price);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: isPopular ? color : Colors.white10,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('เลือกแพ็กเกจนี้',
                  style: GoogleFonts.kanit(
                      fontWeight: FontWeight.bold,
                      color: isPopular ? Colors.white : Colors.white70)),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Invoice + Payment Flow ──────────────────────────────────────────────
  Future<void> _handlePlanSelection(String planId, int amount) async {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('createSubscriptionInvoice');
      final result = await callable.call({'planId': planId});
      if (!mounted) return;
      Navigator.pop(context); // close loading
      _showInvoiceDialog(Map<String, dynamic>.from(result.data as Map));
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('เกิดข้อผิดพลาด: $e',
              style: GoogleFonts.kanit(color: Colors.white)),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showInvoiceDialog(Map<String, dynamic> invoice) {
    final dueDate =
        DateTime.tryParse(invoice['dueDate'] ?? '') ?? DateTime.now();
    final expiryDate =
        DateTime.tryParse(invoice['expiryDate'] ?? '') ?? DateTime.now();
    final fmt = DateFormat('d MMM yyyy', 'th');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('ใบแจ้งชำระเงิน',
            style: GoogleFonts.kanit(
                color: Colors.white, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _invoiceRow('เลขบิล', invoice['invoiceId'] ?? '-'),
              _invoiceRow('แพ็กเกจ', invoice['planName'] ?? '-'),
              _invoiceRow('ยอดชำระ',
                  '฿${(invoice['amount'] as num? ?? 0).toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',')}'),
              _invoiceRow('ครบกำหนด', fmt.format(dueDate)),
              _invoiceRow('ใช้งานถึง', fmt.format(expiryDate)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.amber.withOpacity(0.4)),
                ),
                child: Text(
                  'กรุณาชำระภายใน 7 วัน มิฉะนั้นบิลจะถูกยกเลิกอัตโนมัติ',
                  style: GoogleFonts.kanit(fontSize: 12, color: Colors.amber),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child:
                Text('ยกเลิก', style: GoogleFonts.kanit(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _showSubscriptionPaymentModal(invoice);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00C4CC),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('ชำระเงิน',
                style: GoogleFonts.kanit(
                    fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _invoiceRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text('$label: ',
              style: GoogleFonts.kanit(fontSize: 13, color: Colors.white54)),
          Expanded(
            child: Text(value,
                style: GoogleFonts.kanit(
                    fontSize: 13,
                    color: Colors.white,
                    fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }

  // ─── Payment Modal (QR + Slip Upload) ───────────────────────────────────
  File? _slipFile;
  bool _isUploadingSlip = false;

  void _showSubscriptionPaymentModal(Map<String, dynamic> invoice) {
    _slipFile = null;
    _isUploadingSlip = false;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => Container(
          height: MediaQuery.of(context).size.height * 0.82,
          decoration: const BoxDecoration(
            color: Color(0xFF0F172A),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 20),
              Text('ชำระเงิน',
                  style: GoogleFonts.kanit(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 4),
              Text(
                'ยอด ฿${(invoice['amount'] as num? ?? 0).toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',')} — ${invoice['planName'] ?? ''}',
                style: GoogleFonts.kanit(fontSize: 14, color: Colors.white54),
              ),
              const SizedBox(height: 20),
              // QR Placeholder
              Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.qr_code_2_rounded,
                        size: 120, color: Color(0xFF0A0E21)),
                    const SizedBox(height: 8),
                    Text('โอน PromptPay',
                        style: GoogleFonts.kanit(
                            fontSize: 13,
                            color: Colors.black54,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(const ClipboardData(text: '0812345678'));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('คัดลอกเลขแล้ว',
                          style: GoogleFonts.kanit(color: Colors.white)),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
                child: Text('PromptPay: 081-234-5678',
                    style: GoogleFonts.kanit(
                        fontSize: 13,
                        color: const Color(0xFF00C4CC),
                        decoration: TextDecoration.underline)),
              ),
              const SizedBox(height: 20),
              const Divider(color: Colors.white12),
              const SizedBox(height: 12),
              // Slip upload
              if (_slipFile == null)
                OutlinedButton.icon(
                  onPressed: () async {
                    final picker = ImagePicker();
                    final picked =
                        await picker.pickImage(source: ImageSource.gallery);
                    if (picked != null) {
                      setLocal(() => _slipFile = File(picked.path));
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF00C4CC)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 14),
                  ),
                  icon: const Icon(Icons.upload_rounded,
                      color: Color(0xFF00C4CC)),
                  label: Text('แนบสลิปการโอนเงิน',
                      style: GoogleFonts.kanit(color: const Color(0xFF00C4CC))),
                )
              else
                GestureDetector(
                  onTap: () async {
                    final picker = ImagePicker();
                    final picked =
                        await picker.pickImage(source: ImageSource.gallery);
                    if (picked != null) {
                      setLocal(() => _slipFile = File(picked.path));
                    }
                  },
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child:
                        Image.file(_slipFile!, height: 120, fit: BoxFit.cover),
                  ),
                ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _slipFile == null || _isUploadingSlip
                      ? null
                      : () async {
                          setLocal(() => _isUploadingSlip = true);
                          await _submitSubscriptionPayment(invoice, setLocal);
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00C4CC),
                    disabledBackgroundColor: Colors.white12,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isUploadingSlip
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : Text('ยืนยันการชำระเงิน',
                          style: GoogleFonts.kanit(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitSubscriptionPayment(
      Map<String, dynamic> invoice, StateSetter setLocal) async {
    try {
      // Upload slip to R2 / Firebase Storage via storage bridge
      String? slipUrl;
      try {
        slipUrl = await TukTukStorageBridge()
            .upload(_slipFile!, 'subscription_slips');
      } catch (_) {
        // fallback: just store Firestore record without slip URL
        slipUrl = null;
      }

      final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      final invoiceId = invoice['invoiceId'] as String? ?? '';
      final planId = invoice['planId'] as String? ??
          (invoice['planName'] != null ? 'quarter_3m' : 'quarter_3m');

      // Mark invoice as paid in Firestore (Cloud Function will verify later)
      if (invoiceId.isNotEmpty) {
        await FirebaseFirestore.instance
            .collection('invoices')
            .doc(invoiceId)
            .update({
          'status': 'paid',
          'paidAt': FieldValue.serverTimestamp(),
          if (slipUrl != null) 'slipUrl': slipUrl,
        });
      }

      // Update seller subscriptionPlan
      if (uid.isNotEmpty) {
        await FirebaseFirestore.instance
            .collection('seller_profiles')
            .doc(uid)
            .set({
          'subscriptionPlan': {
            'planId': planId,
            'invoiceId': invoiceId,
            'paymentStatus': 'pending_verification',
            'expiryDate': invoice['expiryDate'] ?? '',
            'tier': 'starter',
          },
        }, SetOptions(merge: true));
      }

      if (!mounted) return;
      Navigator.pop(context); // close payment modal
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle_rounded,
                  color: Color(0xFF00C4CC), size: 64),
              const SizedBox(height: 16),
              Text('ส่งคำขอสำเร็จ!',
                  style: GoogleFonts.kanit(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 8),
              Text(
                'ทีมงานจะตรวจสอบสลิปและเปิดใช้งานภายใน 24 ชั่วโมง\nเลขบิล: $invoiceId',
                style: GoogleFonts.kanit(fontSize: 13, color: Colors.white54),
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C4CC),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('ตกลง',
                  style: GoogleFonts.kanit(
                      fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      );
    } catch (e) {
      setLocal(() => _isUploadingSlip = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('เกิดข้อผิดพลาด: $e',
              style: GoogleFonts.kanit(color: Colors.white)),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showAnalyticsDetails() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1F35),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
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
              'เจาะลึกข้อมูลวิเคราะห์ (Go Engine)',
              style: GoogleFonts.kanit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            _buildStatDetail('จำนวนเข้าชมทั้งหมด',
                _shopStats?['totalViews']?.toString() ?? '0', Icons.visibility),
            _buildStatDetail(
                'ยอดขายสุทธิ',
                '฿${_shopStats?['revenue']?.toString() ?? '0'}',
                Icons.payments),
            _buildStatDetail(
                'อัตราการซื้อ (Conversion)', '8.5%', Icons.trending_up),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00D2FF),
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
              ),
              child: Text('ตกลง',
                  style: GoogleFonts.kanit(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatDetail(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF00D2FF), size: 20),
          const SizedBox(width: 12),
          Text(label, style: GoogleFonts.kanit(color: Colors.white70)),
          const Spacer(),
          Text(value,
              style: GoogleFonts.kanit(
                  color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showMarketingCenter() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1F35),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Marketing Center',
                style: GoogleFonts.kanit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white)),
            const SizedBox(height: 16),
            const Text(
                'เครื่องมือส่งเสริมการขาย เช่น คูปองส่วนลด, ระบบ Affiliates และโฆษณา จะเปิดให้บริการเร็วๆ นี้',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 24),
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('ตกลง')),
          ],
        ),
      ),
    );
  }

  void _showAISellerTools() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1F35),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Go AI Assistant 🤖',
                style: GoogleFonts.kanit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white)),
            const SizedBox(height: 16),
            _buildStatDetail(
                'AI ช่วยตั้งชื่อสินค้า', 'ใช้งานได้', Icons.auto_fix_high),
            _buildStatDetail(
                'AI วิเคราะห์คู่แข่ง', 'Premium เท่านั้น', Icons.analytics),
            _buildStatDetail('AI เขียนคำบรรยาย', 'ใช้งานได้', Icons.edit_note),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.black),
              child: const Text('ลองใช้งานเลย'),
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomerList() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const MessageListScreen()),
    );
  }

  void _contactCustomer(Map<String, dynamic> order) {
    final customerUid = order['uid'] ?? order['customerUid'] ?? order['userId'];
    if (customerUid != null) {
      final myId = FirebaseAuth.instance.currentUser?.uid ?? '';
      final List<String> ids = [myId, customerUid];
      ids.sort();
      final convId = ids.join('_');

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            conversationId: convId,
            otherUserId: customerUid,
            otherUserName: order['userName'] ?? 'ลูกค้า',
            collection: 'product_chats',
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ไม่สามารถเริ่มแชทได้: ไม่พบรหัสลูกค้า')),
      );
    }
  }

  Future<void> _updateOrderStatus(String orderId, String status) async {
    try {
      await FirebaseFirestore.instance.collection('orders').doc(orderId).update(
          {'status': status, 'updatedAt': FieldValue.serverTimestamp()});

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('อัปเดตสถานะเป็น "$status" เรียบร้อยแล้ว'),
            backgroundColor: Colors.green,
          ),
        );
        _fetchData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('เกิดข้อผิดพลาด: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _confirmCancelOrder(Map<String, dynamic> order) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1F35),
        title: Text('ยกเลิกรายการสั่งซื้อ?',
            style: GoogleFonts.kanit(color: Colors.white)),
        content: Text(
            'รายการสินค้า "${order['productName'] ?? 'สินค้า'}" จะถูกยกเลิก คุณแน่ใจหรือไม่?',
            style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child:
                Text('ไม่ใช่', style: GoogleFonts.kanit(color: Colors.white)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _updateOrderStatus(order['id'], 'ถูกยกเลิก');
            },
            child: Text('ยกเลิกรายการ',
                style: GoogleFonts.kanit(
                    color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
