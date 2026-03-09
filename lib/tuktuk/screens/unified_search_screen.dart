import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/post_detail_screen.dart';
import 'package:caculateapp/tuktuk/screens/product_detail_screen.dart';
import 'package:caculateapp/tuktuk/screens/profile_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:flutter/material.dart';

import '../services/search_service.dart';
import '../widgets/search_bar_widget.dart';

class UnifiedSearchScreen extends StatefulWidget {
  final String? initialQuery;
  const UnifiedSearchScreen({super.key, this.initialQuery});

  @override
  State<UnifiedSearchScreen> createState() => _UnifiedSearchScreenState();
}

class _UnifiedSearchScreenState extends State<UnifiedSearchScreen>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;

  List<Map<String, dynamic>> _userResults = [];
  List<Map<String, dynamic>> _postResults = [];
  List<Map<String, dynamic>> _productResults = [];

  bool _isLoading = false;
  Timer? _debounce;
  final TukTukBridge _bridge = TukTukBridge();
  final SearchService _searchSvc = SearchService();
  List<String> _searchHistory = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadHistory();
    if (widget.initialQuery != null) {
      _searchController.text = widget.initialQuery!;
      _performSearch(widget.initialQuery!);
    }
  }

  Future<void> _loadHistory() async {
    final h = await _searchSvc.getHistory();
    if (mounted) setState(() => _searchHistory = h);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    if (_debounce?.isActive ?? false) _debounce!.cancel();

    if (query.isEmpty) {
      setState(() {
        _userResults = [];
        _postResults = [];
        _productResults = [];
      });
      return;
    }

    await _searchSvc.addToHistory(query.trim());
    unawaited(_loadHistory());

    _debounce = Timer(const Duration(milliseconds: 500), () async {
      if (!mounted) return;
      setState(() => _isLoading = true);

      try {
        final results = await Future.wait([
          _bridge.searchUsers(query),
          _bridge.searchCommunityPosts(query),
          _bridge.searchMarketplace(query),
        ]);

        if (mounted) {
          final users = List<Map<String, dynamic>>.from(results[0]);
          final posts = List<Map<String, dynamic>>.from(results[1]);
          final productsRaw = List<Map<String, dynamic>>.from(results[2]);

          // Apply fuzzy ranking to products if query is long enough
          List<Map<String, dynamic>> products;
          if (query.length >= 2) {
            final scored = _searchSvc.search(query, productsRaw);
            products = scored.map((s) => s.product).toList();
          } else {
            products = productsRaw;
          }

          setState(() {
            _userResults = users;
            _postResults = posts;
            _productResults = products;
            _isLoading = false;
          });
        }
      } catch (e) {
        if (mounted) setState(() => _isLoading = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: TukTukSearchBar(
          controller: _searchController,
          hintText: 'ค้นหาทุกอย่างใน TukTuk...',
          onChanged: _performSearch,
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.orange,
          labelColor: Colors.orange,
          unselectedLabelColor: Colors.white54,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'ผู้ใช้'),
            Tab(text: 'วิดีโอ'),
            Tab(text: 'สินค้า'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
          : _searchController.text.isEmpty
              ? _buildHistoryPanel()
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildUserList(),
                    _buildPostList(),
                    _buildProductList(),
                  ],
                ),
    );
  }

  Widget _buildUserList() {
    if (_userResults.isEmpty) return _buildEmptyState('ไม่พบผู้ใช้งาน');
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 10),
      itemCount: _userResults.length,
      itemBuilder: (context, index) => _buildUserTile(_userResults[index]),
    );
  }

  Widget _buildPostList() {
    if (_postResults.isEmpty) return _buildEmptyState('ไม่พบวิดีโอหรือโพสต์');
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 10),
      itemCount: _postResults.length,
      itemBuilder: (context, index) => _buildPostTile(_postResults[index]),
    );
  }

  Widget _buildProductList() {
    if (_productResults.isEmpty) return _buildEmptyState('ไม่พบสินค้า');
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 10),
      itemCount: _productResults.length,
      itemBuilder: (context, index) =>
          _buildProductTile(_productResults[index]),
    );
  }

  Widget _buildHistoryPanel() {
    if (_searchHistory.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_rounded, size: 60, color: Colors.white10),
            SizedBox(height: 12),
            Text('ค้นหาสิ่งที่คุณต้องการ',
                style: TextStyle(color: Colors.white24),),
          ],
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'ค้นหาล่าสุด',
                style: TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              TextButton(
                onPressed: () async {
                  await _searchSvc.clearHistory();
                  unawaited(_loadHistory());
                },
                child: const Text(
                  'ล้างทั้งหมด',
                  style: TextStyle(color: Colors.orange, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _searchHistory.map((q) {
              return ActionChip(
                avatar: const Icon(
                  Icons.history,
                  size: 15,
                  color: Colors.white38,
                ),
                label: Text(
                  q,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
                ),
                backgroundColor: Colors.white10,
                side: const BorderSide(color: Colors.white12),
                onPressed: () {
                  _searchController.text = q;
                  _performSearch(q);
                },
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off_rounded, size: 60, color: Colors.white10),
          const SizedBox(height: 15),
          Text(message, style: const TextStyle(color: Colors.white24)),
        ],
      ),
    );
  }

  Widget _buildUserTile(Map<String, dynamic> user) {
    final String displayName = user['displayName'] ?? 'ผู้ใช้งาน';
    final String? pictureUrl = user['pictureUrl'] ?? user['photoURL'];
    final String uid = user['uid'] ?? '';
    final String? shopName = user['shopName'];
    final bool isSeller =
        user['isSeller'] == true || user['sellerStatus'] != 'none';

    return ListTile(
      onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) =>
                  ProfileScreen(userId: uid, isBackButtonEnabled: true),),),
      leading: CircleAvatar(
        radius: 25,
        backgroundColor: Colors.grey[900],
        backgroundImage: (pictureUrl != null && pictureUrl.startsWith('http'))
            ? CachedNetworkImageProvider(pictureUrl)
            : null,
        child: (pictureUrl == null || !pictureUrl.startsWith('http'))
            ? const Icon(Icons.person, color: Colors.white)
            : null,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(displayName,
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold,),),
          ),
          if (isSeller)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text('SELLER',
                  style: TextStyle(
                      color: Colors.orange,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,),),
            ),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (shopName != null && shopName.isNotEmpty)
            Text(shopName,
                style:
                    const TextStyle(color: Colors.orangeAccent, fontSize: 13),),
          Text('@${uid.length > 8 ? uid.substring(0, 8) : uid}',
              style: const TextStyle(color: Colors.white54, fontSize: 11),),
        ],
      ),
      trailing: OutlinedButton(
        onPressed: () => _bridge.toggleFollow(uid),
        style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Colors.orange),
            foregroundColor: Colors.orange,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),),),
        child: const Text('ติดตาม'),
      ),
    );
  }

  Widget _buildPostTile(Map<String, dynamic> post) {
    final String description =
        post['description'] ?? post['content'] ?? 'ไม่มีคำบรรยาย';
    final String? thumb = post['thumbnailUrl'] ?? post['imageUrl'];

    return ListTile(
      onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (_) => PostDetailScreen(postData: post)),),
      leading: Container(
        width: 50,
        height: 70,
        decoration: BoxDecoration(
            color: Colors.grey[900], borderRadius: BorderRadius.circular(8),),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: thumb != null
              ? CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover)
              : const Icon(Icons.play_circle_fill, color: Colors.white24),
        ),
      ),
      title: Text(description,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: Colors.white, fontSize: 14),),
      subtitle: Text(post['authorName'] ?? 'TukTuker',
          style: const TextStyle(color: Colors.white38, fontSize: 11),),
    );
  }

  Widget _buildProductTile(Map<String, dynamic> product) {
    final String title = product['title'] ?? product['productName'] ?? 'สินค้า';
    final String price = product['price']?.toString() ?? '0';
    final String? thumb = product['imageUrl'] ?? product['thumbnailUrl'];

    return ListTile(
      onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => ProductDetailScreen(productData: product),),),
      leading: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
            color: Colors.grey[900], borderRadius: BorderRadius.circular(8),),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: thumb != null
              ? CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover)
              : const Icon(Icons.shopping_bag, color: Colors.white24),
        ),
      ),
      title: Text(title,
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.bold,),),
      subtitle: Text('฿$price',
          style: const TextStyle(
              color: Colors.orangeAccent, fontWeight: FontWeight.bold,),),
      trailing: const Icon(Icons.chevron_right, color: Colors.white24),
    );
  }
}
