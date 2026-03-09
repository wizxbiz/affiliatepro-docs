import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/screens/marketplace_screen.dart';
import 'package:caculateapp/tuktuk/widgets/marketplace_grid_card.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SmartShoppingDiscoverScreen extends StatefulWidget {
  const SmartShoppingDiscoverScreen({super.key});

  @override
  State<SmartShoppingDiscoverScreen> createState() =>
      _SmartShoppingDiscoverScreenState();
}

class _SmartShoppingDiscoverScreenState
    extends State<SmartShoppingDiscoverScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = true;
  List<Map<String, dynamic>> _trendingProducts = [];
  List<Map<String, dynamic>> _reliableShops = [];
  List<Map<String, dynamic>> _supplementProducts = [];

  String _selectedCategory = 'ทั้งหมด';
  final List<String> _quickCategories = [
    'ทั้งหมด',
    'อาหาร',
    'อาหารเสริม',
    'สุขภาพ',
    'ความงาม',
    'แฟชั่น',
    'ไอที',
  ];

  @override
  void initState() {
    super.initState();
    _fetchDiscoveryData();
  }

  Future<void> _fetchDiscoveryData({String? query}) async {
    setState(() => _isLoading = true);
    try {
      if (query != null && query.isNotEmpty) {
        // Search Logic: Combined Search + Popularity
        final lowerQuery = query.toLowerCase();

        final searchSnapshot = await FirebaseFirestore.instance
            .collection('marketplace_items')
            .where('status', isEqualTo: 'available')
            .limit(50)
            .get();

        final filtered = searchSnapshot.docs
            .where((doc) {
              final data = doc.data();
              final title = (data['productName'] ?? data['title'] ?? '')
                  .toString()
                  .toLowerCase();
              final desc = (data['description'] ?? '').toString().toLowerCase();
              return title.contains(lowerQuery) || desc.contains(lowerQuery);
            })
            .map(
                (doc) => {...doc.data(), 'id': doc.id, 'source': 'marketplace'},)
            .toList();

        // Sort by popularity (viewCount)
        filtered.sort(
            (a, b) => (b['viewCount'] ?? 0).compareTo(a['viewCount'] ?? 0),);

        if (mounted) {
          setState(() {
            _trendingProducts = filtered;
            _isLoading = false;
          });
        }
        return;
      }

      // Default Discovery Data
      final trendingSnapshot = await FirebaseFirestore.instance
          .collection('marketplace_items')
          .orderBy('viewCount', descending: true)
          .limit(10)
          .get();

      final shopsSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('sellerStatus', isEqualTo: 'verified')
          .limit(10)
          .get();

      final supplementSnapshot = await FirebaseFirestore.instance
          .collection('marketplace_items')
          .where('category', isEqualTo: 'อาหารเสริม')
          .limit(10)
          .get();

      if (mounted) {
        setState(() {
          _trendingProducts = trendingSnapshot.docs
              .map((doc) =>
                  {...doc.data(), 'id': doc.id, 'source': 'marketplace'},)
              .toList();
          _reliableShops = shopsSnapshot.docs
              .map((doc) => {...doc.data(), 'uid': doc.id})
              .toList();
          _supplementProducts = supplementSnapshot.docs
              .map((doc) =>
                  {...doc.data(), 'id': doc.id, 'source': 'marketplace'},)
              .toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('SmartShopping: Error fetching data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF060912),
      appBar: _buildAppBar(),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF00f2ea)),)
          : _buildBody(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF0E1426),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded,
            color: Colors.white, size: 20,),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        'ค้นหาของกินของใช้ด่วน',
        style: GoogleFonts.kanit(
            color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold,),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(70),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Container(
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'พิมพ์ชื่อสินค้าที่ต้องการ...',
                hintStyle: GoogleFonts.kanit(
                    color: Colors.white.withValues(alpha: 0.3), fontSize: 14,),
                prefixIcon:
                    const Icon(Icons.search_rounded, color: Color(0xFF00f2ea)),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onSubmitted: (val) {
                if (val.trim().isNotEmpty) {
                  _fetchDiscoveryData(query: val.trim());
                }
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCategorySelector(),
          const SizedBox(height: 25),
          _buildSectionHeader(
            '📈 สินค้าขายดี & ยอดนิยม',
            'ยอดขายเยอะ/ยอดวิวเยอะ',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const MarketplaceScreen(
                    initialCategory: 'ทั้งหมด',
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 15),
          _buildHorizontalProductList(_trendingProducts),
          const SizedBox(height: 30),
          _buildSectionHeader(
            '🥗 สมุนไพร & อาหารเสริม',
            'ร้านแนะนำยอดพรีเมียม',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const MarketplaceScreen(
                    initialCategory: 'อาหารเสริม',
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 15),
          _buildHorizontalProductList(_supplementProducts),
          const SizedBox(height: 30),
          _buildSectionHeader(
            '🛡️ ร้านค้าที่ได้รับความเชื่อถือ',
            'ยืนยันตัวตนแล้วโดย TukTuk',
            onTap: null, // Perhaps navigate to a seller list later
          ),
          const SizedBox(height: 15),
          _buildShopsList(),
          const SizedBox(height: 30),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF00f2ea).withValues(alpha: 0.2),
                    const Color(0xFF00f2ea).withValues(alpha: 0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                border:
                    Border.all(color: const Color(0xFF00f2ea).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome_rounded,
                      color: Color(0xFF00f2ea), size: 30,),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ฉลาดช้อปด้วยระบบวิเคราะห์ร้านค้า',
                          style: GoogleFonts.kanit(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,),
                        ),
                        Text(
                          'เราคัดกรองเฉพาะร้านที่มีผลตอบรับดีและส่งของจริงเท่านั้น',
                          style: GoogleFonts.kanit(
                              color: Colors.white.withValues(alpha: 0.6),
                              fontSize: 11,),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _quickCategories.length,
        itemBuilder: (context, index) {
          final cat = _quickCategories[index];
          final isSelected = _selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () {
                setState(() => _selectedCategory = cat);
                if (cat == 'ทั้งหมด') {
                  _fetchDiscoveryData();
                } else {
                  _fetchDiscoveryData(query: cat);
                }
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF00f2ea)
                      : Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  cat,
                  style: GoogleFonts.kanit(
                    color: isSelected
                        ? Colors.black
                        : Colors.white.withValues(alpha: 0.6),
                    fontWeight:
                        isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title, String subtitle,
      {VoidCallback? onTap,}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.kanit(
                      color: Colors.white.withValues(alpha: 0.4), fontSize: 11,),
                ),
              ],
            ),
          ),
          if (onTap != null)
            GestureDetector(
              onTap: onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  'ดูทั้งหมด',
                  style: GoogleFonts.kanit(
                      color: const Color(0xFF00f2ea),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHorizontalProductList(List<Map<String, dynamic>> products) {
    if (products.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(left: 16),
        child: Text('ไม่มีข้อมูลสินค้าในขณะนี้',
            style: TextStyle(color: Colors.white24, fontSize: 12),),
      );
    }
    return SizedBox(
      height: 240,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          return FadeInRight(
            delay: Duration(milliseconds: 100 * index),
            child: Container(
              width: 160,
              margin: const EdgeInsets.symmetric(horizontal: 6),
              child: MarketplaceGridCard(
                product: product,
                onViewed: () {
                  // Tracking handled by card internally or via callback
                },
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildShopsList() {
    if (_reliableShops.isEmpty) return const SizedBox();
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _reliableShops.length,
        itemBuilder: (context, index) {
          final shop = _reliableShops[index];
          return Padding(
            padding: const EdgeInsets.only(right: 20),
            child: Column(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      backgroundImage: shop['pictureUrl'] != null
                          ? NetworkImage(shop['pictureUrl'])
                          : null,
                      child: shop['pictureUrl'] == null
                          ? const Icon(Icons.store_rounded,
                              color: Colors.white30,)
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                            color: Colors.blue, shape: BoxShape.circle,),
                        child: const Icon(Icons.check,
                            color: Colors.white, size: 10,),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  shop['shopName'] ?? shop['displayName'] ?? 'Shop',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.kanit(color: Colors.white, fontSize: 10),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
