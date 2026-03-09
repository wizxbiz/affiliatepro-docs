import 'package:better_player_plus/better_player_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/marketplace_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import 'login_screen.dart';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const _bg = Color(0xFF080C18);
const _surface = Color(0xFF0F1629);
const _card = Color(0xFF141C30);
const _cardAlt = Color(0xFF1A2240);
const _border = Color(0xFF1E2D4A);
const _cyan = Color(0xFF00F2EA);
const _cyanDim = Color(0xFF00C4BD);
const _amber = Color(0xFFFFBB33);
const _purple = Color(0xFF7C3AED);
const _green = Color(0xFF22C55E);
const _textHi = Color(0xFFF1F5F9);
const _textMid = Color(0xFF94A3B8);
const _textLow = Color(0xFF475569);

class ProductDetailScreen extends StatefulWidget {
  final Map<String, dynamic> productData;
  const ProductDetailScreen({super.key, required this.productData});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen>
    with TickerProviderStateMixin {
  // ─── State ───────────────────────────────────────────────────────────────
  final List<Map<String, dynamic>> _reviews = [];
  bool _isLoadingReviews = true;
  Map<String, dynamic>? _currentUser;
  Map<String, dynamic>? _liveProductData;
  Map<String, dynamic>? _sellerProfile; // from seller_profiles collection
  BetterPlayerController? _videoController;
  final PageController _pageController = PageController();
  List<Map<String, dynamic>> _recommendedProducts = [];
  bool _isLoadingRecommended = true;
  bool _isFollowing = false;
  int _currentImageIndex = 0;
  final ValueNotifier<bool> _isVideoActive = ValueNotifier<bool>(true);

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _liveProductData = Map.from(widget.productData);
    _fadeController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600),);
    _fadeAnimation =
        CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.forward();

    _incrementViewCount();
    _checkUser();
    _fetchReviews();
    _fetchLiveProductData();
    _fetchSellerProfile();
    _fetchRecommendedProducts();
    _initVideo();
  }

  Future<void> _fetchRecommendedProducts() async {
    try {
      final category =
          widget.productData['category'] ?? _liveProductData?['category'];
      final String currentId =
          widget.productData['id'] ?? _liveProductData?['id'] ?? '';
      final String source =
          widget.productData['source'] ?? _liveProductData?['source'] ?? '';

      CollectionReference collectionRef;
      if (source == 'community') {
        collectionRef =
            FirebaseFirestore.instance.collection('community_products');
      } else {
        collectionRef =
            FirebaseFirestore.instance.collection('marketplace_items');
      }

      Query query = collectionRef.where('status', isEqualTo: 'active');
      if (category != null && category.toString().isNotEmpty) {
        query = query.where('category', isEqualTo: category);
      }
      query = query.orderBy('createdAt', descending: true).limit(10);

      final snapshot = await query.get();
      if (mounted) {
        setState(() {
          _recommendedProducts = snapshot.docs
              .map((d) => d.data() as Map<String, dynamic>)
              .toList();
          _recommendedProducts.removeWhere((p) =>
              p['id'] == currentId ||
              p['productId'] == currentId ||
              p['uid'] == currentId,);
          _isLoadingRecommended = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching recommended: $e');
      if (mounted) setState(() => _isLoadingRecommended = false);
    }
  }

  void _initVideo() {
    final videoUrl = widget.productData['videoUrl']?.toString();
    if (videoUrl != null && videoUrl.isNotEmpty) {
      if (_videoController != null) return;

      _videoController = BetterPlayerController(
        const BetterPlayerConfiguration(
          aspectRatio: 1,
          autoPlay: true,
          looping: false,
          fit: BoxFit.cover,
          controlsConfiguration: BetterPlayerControlsConfiguration(
            showControls: false,
            enableSkips: false,
            enableFullscreen: false,
            enablePlayPause: false,
          ),
        ),
        betterPlayerDataSource: BetterPlayerDataSource(
          BetterPlayerDataSourceType.network,
          videoUrl,
          bufferingConfiguration: const BetterPlayerBufferingConfiguration(
            minBufferMs: 5000,
            maxBufferMs: 15000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          ),
        ),
      );

      _videoController!.addEventsListener((event) {
        if (!mounted || _videoController == null) return;

        if (event.betterPlayerEventType == BetterPlayerEventType.finished) {
          if (_pageController.hasClients) {
            _pageController.nextPage(
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            );
          }
        }
      });
    }
  }

  Future<void> _fetchSellerProfile() async {
    final sellerId =
        widget.productData['sellerId'] ?? widget.productData['authorId'];
    if (sellerId == null) return;
    try {
      final doc = await FirebaseFirestore.instance
          .collection('seller_profiles')
          .doc(sellerId)
          .get();
      if (doc.exists && mounted) {
        setState(() => _sellerProfile = doc.data());
      }
    } catch (e) {
      debugPrint('Error fetching seller profile: $e');
    }
  }

  Future<void> _incrementContactCount() async {
    final id = widget.productData['id'];
    if (id == null) return;
    final source = widget.productData['source'] ?? 'marketplace';
    final collection =
        source == 'community' ? 'community_products' : 'marketplace_items';
    try {
      await FirebaseFirestore.instance.collection(collection).doc(id).update({
        'contactCount': FieldValue.increment(1),
      });
    } catch (_) {}
  }

  Future<void> _fetchLiveProductData() async {
    final id = widget.productData['id'];
    final source = widget.productData['source'] ?? 'marketplace';
    final collection =
        source == 'community' ? 'community_products' : 'marketplace_items';
    if (id == null) return;
    try {
      final doc =
          await FirebaseFirestore.instance.collection(collection).doc(id).get();
      if (doc.exists && mounted) {
        setState(() {
          _liveProductData = doc.data();
          _liveProductData!['id'] = doc.id;
          _liveProductData!['source'] = source;
        });
      }
    } catch (e) {
      debugPrint('Error fetching live product data: $id');
    }
  }

  Future<void> _checkUser() async {
    final user = await TukTukBridge().getCurrentUser();
    if (mounted) setState(() => _currentUser = user);
  }

  Future<void> _fetchReviews() async {
    final id = widget.productData['id'];
    if (id == null) return;
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('marketplace_reviews')
          .where('productId', isEqualTo: id)
          .orderBy('createdAt', descending: true)
          .limit(20)
          .get();
      final List<Map<String, dynamic>> reviews = snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
      if (mounted) {
        setState(() {
          _reviews.clear();
          _reviews.addAll(reviews);
          _isLoadingReviews = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching reviews: $e');
      if (mounted) setState(() => _isLoadingReviews = false);
    }
  }

  Future<void> _incrementViewCount() async {
    final id = widget.productData['id'];
    final source = widget.productData['source'] ?? 'marketplace';
    if (id == null) return;
    final collection =
        source == 'community' ? 'community_products' : 'marketplace_items';
    try {
      await FirebaseFirestore.instance.collection(collection).doc(id).update({
        'viewCount': FieldValue.increment(1),
      });
    } catch (e) {
      debugPrint('Error incrementing view: $e');
    }
  }

  Future<void> _launchURL(String url) async {
    if (url.isEmpty) return;
    final uri = Uri.parse(url);
    try {
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw Exception('Could not launch $url');
      }
    } catch (e) {
      debugPrint('Launch Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('ไม่สามารถเปิดลิงก์ได้ กรุณาตรวจสอบลิงก์อีกครั้ง'),),
        );
      }
    }
  }

  @override
  void dispose() {
    // 1. Mark video as inactive to trigger UI rebuild/removal
    _isVideoActive.value = false;

    // 2. Capture controller to dispose safely
    final controller = _videoController;
    _videoController = null;

    // 3. Safely dispose after a delay to ensure UI transition finishes
    if (controller != null) {
      try {
        controller.pause();
        // Give a short delay for the widget tree to remove BetterPlayer
        Future.delayed(const Duration(milliseconds: 500), () {
          try {
            controller.dispose();
          } catch (e) {
            debugPrint('Error in delayed video dispose: $e');
          }
        });
      } catch (e) {
        debugPrint('Error pausing video controller: $e');
      }
    }

    _isVideoActive.dispose();
    _pageController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _navigateToLogin() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => LoginScreen(
          onLoginSuccess: () {
            _checkUser();
            _fetchLiveProductData();
          },
        ),
      ),
    );
  }

  // ─── Build ────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final productData = _liveProductData ?? widget.productData;

    // ─── Robust Image Extraction ───
    final images = productData['images'] as List?;
    final Set<String> urlSet = {};

    if (images != null) {
      for (final img in images) {
        String? url;
        if (img is Map) {
          url = img['url'];
        } else if (img is String) url = img;
        if (url != null && url.trim().isNotEmpty) urlSet.add(url.trim());
      }
    }

    // Fallbacks
    final List<String> fallbackFields = [
      'imageUrl',
      'coverImage',
      'videoThumbnail',
    ];
    for (final field in fallbackFields) {
      final val = productData[field];
      if (val is String && val.trim().isNotEmpty) {
        urlSet.add(val.trim());
      }
    }

    final List<String> imageUrls = urlSet.toList();

    final price = productData['price']?.toString() ?? '0';
    final name =
        productData['productName'] ?? productData['title'] ?? 'สินค้ามาตรฐาน';
    final description =
        productData['description'] ?? 'ไม่มีรายละเอียดเพิ่มเติม';
    final sellerName = productData['sellerName'] ??
        productData['authorName'] ??
        'ร้านค้าสมาชิก';
    final location = productData['location'] ?? 'ประเทศไทย';
    final condition = productData['condition'] ?? 'ใหม่';
    final category = productData['category'] ?? 'ทั่วไป';
    final sellerId = productData['sellerId'] ?? productData['authorId'];
    final isSold = productData['status'] == 'sold';
    final isService = productData['type'] == 'service';

    return Scaffold(
      backgroundColor: _bg,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Stack(
          children: [
            CustomScrollView(
              slivers: [
                // ── Media AppBar ──────────────────────────────────────────
                _buildSliverAppBar(context, imageUrls, productData),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Price Row ───────────────────────────────────
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (isService)
                                    Text('เริ่มต้น',
                                        style: GoogleFonts.kanit(
                                            color: _textMid, fontSize: 12,),),
                                  Text(
                                    '฿$price',
                                    style: GoogleFonts.outfit(
                                      color: _cyan,
                                      fontSize: 36,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -1.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                _buildConditionBadge(condition),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(Icons.visibility_outlined,
                                        color: _textLow, size: 13,),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${productData['viewCount'] ?? 0} คนดู',
                                      style: GoogleFonts.kanit(
                                          color: _textLow, fontSize: 11,),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        // ── Product Name ────────────────────────────────
                        Text(
                          name,
                          style: GoogleFonts.kanit(
                            color: _textHi,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            height: 1.3,
                          ),
                        ),

                        const SizedBox(height: 10),

                        // ── Badges (OTOP / Organic / Stock / Sold) ──────
                        Builder(builder: (context) {
                          final badges = <Widget>[];
                          if (productData['isOtop'] == true) {
                            badges.add(_buildBadge('OTOP', _amber));
                          }
                          if (productData['isOrganic'] == true) {
                            badges.add(_buildBadge('ออร์แกนิค', _green));
                          }
                          if (productData['stock'] != null) {
                            badges.add(_buildBadge(
                                'คงเหลือ ${productData['stock']}', _cyan,),);
                          }
                          if (isSold) {
                            badges.add(_buildBadge('ขายแล้ว', Colors.red));
                          }
                          if (badges.isEmpty) return const SizedBox.shrink();
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Wrap(
                                spacing: 8, runSpacing: 6, children: badges,),
                          );
                        },),

                        const SizedBox(height: 4),

                        // ── Location & Category ─────────────────────────
                        Row(
                          children: [
                            _buildMetaChip(
                                Icons.location_on_rounded, location, _amber,),
                            const SizedBox(width: 8),
                            _buildMetaChip(
                                Icons.category_rounded, category, _cyan,),
                          ],
                        ),

                        // ── Service Info ────────────────────────────────
                        if (isService) ...[
                          const SizedBox(height: 16),
                          _buildServiceInfoRow(
                              Icons.access_time_rounded,
                              'เวลาให้บริการ',
                              productData['workingHours'] ?? '9:00 - 18:00',),
                          const SizedBox(height: 8),
                          _buildServiceInfoRow(
                              Icons.map_rounded,
                              'พื้นที่บริการ',
                              productData['serviceArea'] ?? 'ในพื้นที่',),
                        ],

                        const SizedBox(height: 24),

                        // ── Specialized Info (Options / Custom Fields) ──
                        _buildSpecializedInfo(productData),

                        // ── Seller Section ──────────────────────────────
                        _buildSellerSection(
                            context, sellerName, sellerId, productData,),

                        const SizedBox(height: 24),
                        _buildSectionDivider(),

                        // ── Description ─────────────────────────────────
                        _buildSectionHeader(
                            'รายละเอียดสินค้า', Icons.description_rounded,),
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: _surface,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: _border),
                          ),
                          child: Text(
                            description,
                            style: GoogleFonts.kanit(
                                color: _textMid, fontSize: 14, height: 1.8,),
                          ),
                        ),

                        const SizedBox(height: 28),
                        _buildSectionDivider(),

                        // ── Reviews ─────────────────────────────────────
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildSectionHeader(
                                'รีวิวจากลูกค้า', Icons.star_rounded,),
                            GestureDetector(
                              onTap: _showReviewDialog,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 8,),
                                decoration: BoxDecoration(
                                  color: _cyan.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                      color: _cyan.withValues(alpha: 0.25),),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.rate_review_rounded,
                                        size: 14, color: _cyan,),
                                    const SizedBox(width: 6),
                                    Text('เขียนรีวิว',
                                        style: GoogleFonts.kanit(
                                            color: _cyan,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,),),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        _isLoadingReviews
                            ? const Center(
                                child: CircularProgressIndicator(
                                    color: _cyan, strokeWidth: 2,),)
                            : _reviews.isEmpty
                                ? _buildEmptyReviews()
                                : Column(
                                    children: _reviews
                                        .map(_buildReviewCard)
                                        .toList(),),

                        const SizedBox(height: 28),
                        _buildSectionDivider(),

                        // ── Recommended ──────────────────────────────────
                        _buildSectionHeader(
                            'สินค้าแนะนำสำหรับคุณ', Icons.auto_awesome_rounded,),
                        const SizedBox(height: 14),
                        _isLoadingRecommended
                            ? const Center(
                                child: CircularProgressIndicator(
                                    color: _textLow, strokeWidth: 2,),)
                            : SizedBox(
                                height: 220,
                                child: ListView.builder(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: _recommendedProducts.length,
                                  itemBuilder: (context, index) =>
                                      _buildRecommendedCard(
                                          _recommendedProducts[index],),
                                ),
                              ),

                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // ── Bottom Bar ───────────────────────────────────────────────
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: _buildBottomBar(context, productData),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Sliver AppBar / Media Gallery ───────────────────────────────────────
  Widget _buildSliverAppBar(BuildContext context, List<String> imageUrls,
      Map<String, dynamic> productData,) {
    return SliverAppBar(
      expandedHeight: 420,
      backgroundColor: _bg,
      pinned: true,
      elevation: 0,
      leading: Padding(
        padding: const EdgeInsets.all(10),
        child: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded,
                color: Colors.white, size: 16,),
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.all(10),
          child: GestureDetector(
            onTap: () {
              final productData = _liveProductData ?? widget.productData;
              final name = productData['productName'] ??
                  productData['title'] ??
                  'สินค้า';
              final price = productData['price']?.toString() ?? '0';
              final id = productData['id'] ?? '';
              SharePlus.instance.share(
                ShareParams(
                  text:
                      '$name\n฿$price\nhttps://appinjproject.web.app/product.html?id=$id',
                ),
              );
            },
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              padding: const EdgeInsets.all(8),
              child: const Icon(Icons.share_rounded,
                  color: Colors.white, size: 18,),
            ),
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: imageUrls.isEmpty
            ? Container(
                color: _surface,
                child: const Center(
                  child: Icon(Icons.image_not_supported_rounded,
                      size: 80, color: _textLow,),
                ),
              )
            : Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    controller: _pageController,
                    itemCount: imageUrls.length +
                        (productData['videoUrl'] != null ? 1 : 0),
                    onPageChanged: (i) {
                      if (!mounted) return;
                      setState(() {
                        final offset = productData['videoUrl'] != null ? 1 : 0;
                        _currentImageIndex =
                            (i - offset).clamp(0, imageUrls.length - 1);
                      });
                    },
                    itemBuilder: (context, index) {
                      if (productData['videoUrl'] != null && index == 0) {
                        return ValueListenableBuilder<bool>(
                          valueListenable: _isVideoActive,
                          builder: (context, active, child) {
                            final vController = _videoController;
                            if (active && vController != null && mounted) {
                              return BetterPlayer(
                                key: ValueKey(vController.hashCode),
                                controller: vController,
                              );
                            }
                            // Show thumbnail or loading while disposing/inactive
                            return _buildUniversalImage(
                                productData['videoThumbnail'] ??
                                    imageUrls.first,);
                          },
                        );
                      }
                      final imageIndex =
                          productData['videoUrl'] != null ? index - 1 : index;
                      return GestureDetector(
                        onTap: () =>
                            _openGallery(context, imageUrls, imageIndex),
                        child: Hero(
                          tag: 'product_img_${productData['id']}_$imageIndex',
                          child: _buildUniversalImage(imageUrls[imageIndex]),
                        ),
                      );
                    },
                  ),
                  // Gradient overlay bottom
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 120,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _bg,
                            _bg.withValues(alpha: 0.7),
                            Colors.transparent,
                          ],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                      ),
                    ),
                  ),
                  // Image counter dots
                  if (imageUrls.length > 1)
                    Positioned(
                      bottom: 18,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(imageUrls.length, (i) {
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: i == _currentImageIndex ? 20 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: i == _currentImageIndex
                                  ? _cyan
                                  : Colors.white38,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ),
                    ),
                ],
              ),
      ),
    );
  }

  // ─── Helpers / Sub-Widgets ────────────────────────────────────────────────

  Widget _buildMetaChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Text(label,
              style: GoogleFonts.kanit(
                  color: color, fontSize: 12, fontWeight: FontWeight.w500,),),
        ],
      ),
    );
  }

  Widget _buildServiceInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
              color: _cyan.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),),
          child: Icon(icon, size: 14, color: _cyan),
        ),
        const SizedBox(width: 10),
        Text('$label: ',
            style: GoogleFonts.kanit(color: _textMid, fontSize: 13),),
        Expanded(
            child: Text(value,
                style: GoogleFonts.kanit(
                    color: _textHi,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,),),),
      ],
    );
  }

  Widget _buildSectionDivider() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Container(height: 1, color: _border),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_cyan, _cyanDim]),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 15, color: Colors.black),
        ),
        const SizedBox(width: 10),
        Text(title,
            style: GoogleFonts.kanit(
                color: _textHi, fontSize: 17, fontWeight: FontWeight.bold,),),
      ],
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(label,
          style: GoogleFonts.kanit(
              color: color, fontWeight: FontWeight.bold, fontSize: 12,),),
    );
  }

  Widget _buildContactInfoRow(IconData icon, String label, String value,
      {VoidCallback? onTap,}) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                  color: _cyan.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),),
              child: Icon(icon, size: 14, color: _cyan),
            ),
            const SizedBox(width: 10),
            Text('$label: ',
                style: GoogleFonts.kanit(color: _textMid, fontSize: 13),),
            Expanded(
              child: Text(value,
                  style: GoogleFonts.kanit(
                      color: onTap != null ? _cyan : _textHi,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,),),
            ),
            if (onTap != null)
              const Icon(Icons.open_in_new_rounded, color: _textLow, size: 13),
          ],
        ),
      ),
    );
  }

  Widget _buildConditionBadge(String cond) {
    final isNew = cond == 'ใหม่';
    final color = isNew ? _green : _amber;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(cond,
          style: GoogleFonts.kanit(
              color: color, fontWeight: FontWeight.bold, fontSize: 12,),),
    );
  }

  // Placeholder for any other widgets

  Widget _buildSellerSection(BuildContext context, String sellerName,
      String? sellerId, Map<String, dynamic> productData,) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Avatar
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: _amber, width: 2),
                ),
                child: ClipOval(
                  child: _buildUniversalImage(
                    productData['sellerAvatar'] ??
                        productData['sellerPictureUrl'] ??
                        productData['authorPic'] ??
                        productData['authorAvatar'] ??
                        productData['sellerImage'] ??
                        'https://www.w3schools.com/howto/img_avatar.png',
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(sellerName,
                              style: GoogleFonts.kanit(
                                  color: _textHi,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,),),
                        ),
                        const SizedBox(width: 5),
                        const Icon(Icons.verified_rounded,
                            color: Colors.blueAccent, size: 15,),
                      ],
                    ),
                    Text('ตอบกลับภายใน 1 ชม. • ส่งตรงเวลา 99%',
                        style:
                            GoogleFonts.kanit(color: _textLow, fontSize: 11),),
                  ],
                ),
              ),
            ],
          ),
          // ── Seller profile contact info from seller_profiles ──
          if (_sellerProfile != null) ...[
            const SizedBox(height: 14),
            Container(height: 1, color: _border),
            const SizedBox(height: 10),
            if ((_sellerProfile!['phone'] ?? '').toString().isNotEmpty)
              _buildContactInfoRow(
                Icons.phone_rounded,
                'โทร',
                _sellerProfile!['phone'].toString(),
                onTap: () => _launchURL('tel:${_sellerProfile!['phone']}'),
              ),
            if ((_sellerProfile!['lineId'] ?? '').toString().isNotEmpty)
              _buildContactInfoRow(
                Icons.chat_rounded,
                'LINE',
                _sellerProfile!['lineId'].toString(),
              ),
            if ((_sellerProfile!['bankName'] ?? '').toString().isNotEmpty &&
                (_sellerProfile!['bankAccount'] ?? '').toString().isNotEmpty)
              _buildContactInfoRow(
                Icons.account_balance_rounded,
                _sellerProfile!['bankName'].toString(),
                _sellerProfile!['bankAccount'].toString(),
                onTap: () => Clipboard.setData(ClipboardData(
                    text: _sellerProfile!['bankAccount'].toString(),),),
              ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    if (sellerId != null) {
                      Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MarketplaceScreen(
                                initialSellerId: sellerId,
                                initialSellerName: sellerName,),
                          ),);
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: _border),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),),
                  ),
                  child: Text('ดูร้านค้า',
                      style: GoogleFonts.kanit(color: _textHi, fontSize: 13),),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => setState(() => _isFollowing = !_isFollowing),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isFollowing ? _card : _amber,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),),
                  ),
                  child: Text(
                    _isFollowing ? '✓ ติดตามแล้ว' : 'ติดตามร้าน',
                    style: GoogleFonts.kanit(
                      color: _isFollowing ? _textMid : Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSpecializedInfo(Map<String, dynamic> data) {
    final List? options = data['productOptions'] as List?;
    final List? customFields = data['customFields'] as List?;
    if ((options == null || options.isEmpty) &&
        (customFields == null || customFields.isEmpty)) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (options != null && options.isNotEmpty) ...[
          _buildSectionHeader(
              'รายการเลือกเพิ่มเติม', Icons.add_circle_outline_rounded,),
          const SizedBox(height: 12),
          ...options.map((opt) {
            final name = opt['name'] ?? 'ไม่มีชื่อ';
            final price = opt['price']?.toString() ?? '0';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: _surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(name,
                      style: GoogleFonts.kanit(color: _textMid, fontSize: 13),),
                  Text('+ ฿$price',
                      style: GoogleFonts.outfit(
                          color: _cyan,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,),),
                ],
              ),
            );
          }),
          const SizedBox(height: 20),
        ],
        if (customFields != null && customFields.isNotEmpty) ...[
          _buildSectionHeader('ข้อมูลทางเทคนิค', Icons.info_outline_rounded),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: customFields.map((field) {
              final label = field['label'] ?? '';
              final value = field['value'] ?? '';
              return Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: _surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(label,
                        style:
                            GoogleFonts.kanit(color: _textLow, fontSize: 11),),
                    const SizedBox(height: 2),
                    Text(value,
                        style: GoogleFonts.kanit(
                            color: _textHi,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,),),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),
        ],
      ],
    );
  }

  Widget _buildEmptyReviews() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        children: [
          const Icon(Icons.rate_review_outlined, color: _textLow, size: 36),
          const SizedBox(height: 10),
          Text('ยังไม่มีรีวิวสินค้านี้',
              style: GoogleFonts.kanit(color: _textLow, fontSize: 14),),
          const SizedBox(height: 6),
          Text('เป็นคนแรกที่รีวิว!',
              style: GoogleFonts.kanit(color: _cyan, fontSize: 12),),
        ],
      ),
    );
  }

  Widget _buildReviewCard(Map<String, dynamic> review) {
    final authorName = review['authorName'] ?? 'ลูกค้าทั่วไป';
    final comment = review['comment'] ?? '';
    final reviewLink = review['reviewLink'] ?? '';
    final createdAt =
        (review['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: _cardAlt,
                  shape: BoxShape.circle,
                  border: Border.all(color: _border),
                ),
                child:
                    const Icon(Icons.person_rounded, color: _textMid, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(authorName,
                        style: GoogleFonts.kanit(
                            color: _textHi,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,),),
                    Text(
                      '${createdAt.day}/${createdAt.month}/${createdAt.year}',
                      style: GoogleFonts.kanit(color: _textLow, fontSize: 10),
                    ),
                  ],
                ),
              ),
              Row(
                children: List.generate(
                    5,
                    (i) => const Icon(Icons.star_rounded,
                        color: _amber, size: 13,),),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(comment,
              style: GoogleFonts.kanit(
                  color: _textMid, fontSize: 13, height: 1.6,),),
          if (reviewLink.isNotEmpty) ...[
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => _launchURL(reviewLink),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: _cyan.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _cyan.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.link_rounded, color: _cyan, size: 14),
                    const SizedBox(width: 6),
                    Text('ดูรีวิวเพิ่มเติม',
                        style: GoogleFonts.kanit(
                            color: _cyan,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,),),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRecommendedCard(Map<String, dynamic> product) {
    final name = product['productName'] ?? product['title'] ?? 'สินค้า';
    final price = product['price']?.toString() ?? '0';
    final imageUrl = _getFirstImageUrl(product);

    return GestureDetector(
      onTap: () => Navigator.pushReplacement(
        context,
        MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productData: product),),
      ),
      child: Container(
        width: 155,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              child: imageUrl != null
                  ? _buildUniversalImage(imageUrl, height: 120)
                  : Container(
                      height: 120,
                      color: _card,
                      child: const Center(
                          child: Icon(Icons.shopping_bag_rounded,
                              color: _textLow,),),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.kanit(
                        color: _textHi,
                        fontSize: 13,
                        height: 1.3,
                        fontWeight: FontWeight.w500,),
                  ),
                  const SizedBox(height: 5),
                  Text('฿$price',
                      style: GoogleFonts.outfit(
                          color: _cyan,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,),),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Bottom Bar ───────────────────────────────────────────────────────────
  Widget _buildBottomBar(
      BuildContext context, Map<String, dynamic> productData,) {
    final isSold = productData['status'] == 'sold';
    final isService = productData['type'] == 'service';
    final sellerId = productData['sellerId'] ?? productData['authorId'];
    final ctaColor = isSold ? _card : (isService ? _purple : _cyan);
    final ctaTextColor =
        isSold ? _textLow : (isService ? Colors.white : Colors.black);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: BoxDecoration(
        color: _surface,
        border: const Border(top: BorderSide(color: _border)),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.4),
              blurRadius: 20,
              offset: const Offset(0, -5),),
        ],
      ),
      child: Row(
        children: [
          // Store button
          _buildIconBtn(Icons.storefront_rounded, 'ร้านค้า', () {
            if (sellerId != null) {
              Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => MarketplaceScreen(
                      initialSellerId: sellerId,
                      initialSellerName: productData['sellerName'] ?? 'ผู้ขาย',
                    ),
                  ),);
            }
          }),
          const SizedBox(width: 10),
          // Chat button
          _buildIconBtn(Icons.chat_bubble_rounded, 'แชท', () {
            if (sellerId == null) return;
            if (_currentUser == null) {
              _navigateToLogin();
              return;
            }
            if (_currentUser!['uid'] == sellerId ||
                _currentUser!['lineUserId'] == sellerId) {
              ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('คุณไม่สามารถแชทกับตัวเองได้')),);
              return;
            }
            _incrementContactCount();
            _showProductChatSheet(context, productData, sellerId);
          }),
          const SizedBox(width: 12),
          // Main CTA
          Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              height: 52,
              decoration: BoxDecoration(
                color: isSold ? _card : null,
                gradient: isSold
                    ? null
                    : LinearGradient(
                        colors: isService
                            ? [const Color(0xFF5B21B6), _purple]
                            : [_cyan, _cyanDim],
                      ),
                borderRadius: BorderRadius.circular(16),
                border: isSold ? Border.all(color: _border) : null,
                boxShadow: isSold
                    ? null
                    : [
                        BoxShadow(
                          color: ctaColor.withValues(alpha: 0.3),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: isSold
                      ? null
                      : () {
                          if (isService) {
                            _showServiceActionSheet(context, productData);
                          } else {
                            _showBuyRequestDialog(context);
                          }
                        },
                  child: Center(
                    child: Text(
                      isSold
                          ? 'จะมีสินค้าเร็วๆ นี้'
                          : (isService
                              ? 'จองคิว / โทรหาช่าง'
                              : 'ขอซื้อ / เสนอราคา'),
                      style: GoogleFonts.kanit(
                          color: ctaTextColor,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIconBtn(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: _card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: _textHi, size: 20),
            const SizedBox(height: 3),
            Text(label,
                style: GoogleFonts.kanit(color: _textMid, fontSize: 10),),
          ],
        ),
      ),
    );
  }

  // ─── Dialogs / Sheets ─────────────────────────────────────────────────────
  void _showServiceActionSheet(
      BuildContext context, Map<String, dynamic> productData,) {
    showModalBottomSheet(
      context: context,
      backgroundColor: _surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: _textLow, borderRadius: BorderRadius.circular(2),),),
              const SizedBox(height: 20),
              Text('เลือกช่องทางติดต่อ',
                  style: GoogleFonts.kanit(
                      color: _textHi,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,),),
              const SizedBox(height: 20),
              _buildContactTile(
                icon: Icons.phone_rounded,
                color: _green,
                title: 'โทรศัพท์',
                subtitle: productData['phone'] ?? '08x-xxx-xxxx',
                onTap: () {
                  Navigator.pop(context);
                  _launchURL('tel:${productData['phone'] ?? ''}');
                },
              ),
              const Divider(color: _border, height: 20),
              _buildContactTile(
                icon: Icons.chat_bubble_rounded,
                color: _cyan,
                title: 'แชทกับผู้ให้บริการ',
                subtitle: 'ส่งข้อความโดยตรง',
                onTap: () {
                  Navigator.pop(context);
                  final sid =
                      productData['sellerId'] ?? productData['authorId'];
                  if (sid != null) {
                    _incrementContactCount();
                    _showProductChatSheet(context, productData, sid);
                  }
                },
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContactTile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(title,
          style:
              GoogleFonts.kanit(color: _textHi, fontWeight: FontWeight.w600),),
      subtitle: Text(subtitle,
          style: GoogleFonts.kanit(color: _textMid, fontSize: 12),),
      trailing: const Icon(Icons.arrow_forward_ios_rounded,
          color: _textLow, size: 14,),
    );
  }

  void _showReviewDialog() {
    if (_currentUser == null) {
      _navigateToLogin();
      return;
    }

    final commentController = TextEditingController();
    final linkController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: _surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                      color: _textLow, borderRadius: BorderRadius.circular(2),),),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('เขียนรีวิวสินค้า',
                      style: GoogleFonts.kanit(
                          color: _textHi,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,),),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                          color: _card,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _border),),
                      child: const Icon(Icons.close_rounded,
                          color: _textMid, size: 16,),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text('ความคิดเห็นของคุณ',
                  style: GoogleFonts.kanit(color: _textMid, fontSize: 13),),
              const SizedBox(height: 8),
              TextField(
                controller: commentController,
                maxLines: 4,
                style: GoogleFonts.kanit(color: _textHi),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: _card,
                  hintText: 'สินค้านี้คุณภาพเป็นอย่างไร...',
                  hintStyle: GoogleFonts.kanit(color: _textLow),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,),
                ),
              ),
              const SizedBox(height: 16),
              Text('ลิงก์รีวิวเพิ่มเติม (ถ้ามี)',
                  style: GoogleFonts.kanit(color: _textMid, fontSize: 13),),
              const SizedBox(height: 8),
              TextField(
                controller: linkController,
                style: GoogleFonts.kanit(color: _textHi),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: _card,
                  hintText: 'https://...',
                  hintStyle: GoogleFonts.kanit(color: _textLow),
                  prefixIcon:
                      const Icon(Icons.link_rounded, color: _textMid, size: 18),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () async {
                    if (commentController.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('กรุณาใส่ความคิดเห็น')),);
                      return;
                    }
                    try {
                      await FirebaseFirestore.instance
                          .collection('marketplace_reviews')
                          .add({
                        'productId': widget.productData['id'],
                        'authorId': _currentUser!['uid'],
                        'authorName': _currentUser!['displayName'] ?? 'ลูกค้า',
                        'authorAvatar': _currentUser!['pictureUrl'] ?? '',
                        'comment': commentController.text.trim(),
                        'reviewLink': linkController.text.trim(),
                        'createdAt': FieldValue.serverTimestamp(),
                        'rating': 5,
                      });
                      if (context.mounted) {
                        Navigator.pop(context);
                        _fetchReviews();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('บันทึกรีวิวของคุณแล้ว ขอบคุณครับ'),
                              backgroundColor: Colors.green,),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('เกิดข้อผิดพลาด: $e')),);
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _cyan,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),),
                  ),
                  child: Text('โพสต์รีวิว',
                      style: GoogleFonts.kanit(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,),),
                ),
              ),
              const SizedBox(height: 28),
            ],
          ),
        );
      },
    );
  }

  void _showBuyRequestDialog(BuildContext context) {
    final qtyController = TextEditingController(text: '1');
    final noteController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: _surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                      color: _textLow, borderRadius: BorderRadius.circular(2),),),
              Text('ส่งคำขอซื้อ',
                  style: GoogleFonts.kanit(
                      color: _textHi,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,),),
              const SizedBox(height: 20),
              Text('จำนวน',
                  style: GoogleFonts.kanit(color: _textMid, fontSize: 13),),
              const SizedBox(height: 8),
              TextField(
                controller: qtyController,
                keyboardType: TextInputType.number,
                style: GoogleFonts.kanit(color: _textHi),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: _card,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,),
                ),
              ),
              const SizedBox(height: 16),
              Text('ข้อความถึงผู้ขาย (ถ้ามี)',
                  style: GoogleFonts.kanit(color: _textMid, fontSize: 13),),
              const SizedBox(height: 8),
              TextField(
                controller: noteController,
                maxLines: 3,
                style: GoogleFonts.kanit(color: _textHi),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: _card,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,),
                  hintText: 'สนใจสินค้าชิ้นนี้ สะดวกนัดรับที่...',
                  hintStyle: GoogleFonts.kanit(color: _textLow),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () async {
                    final currentUser = await TukTukBridge().getCurrentUser();
                    if (currentUser == null) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('กรุณาเข้าสู่ระบบก่อนทำรายการ'),
                            backgroundColor: Colors.red,),
                      );
                      return;
                    }

                    final qty = int.tryParse(qtyController.text) ?? 1;
                    final sellerId = widget.productData['sellerId'] ??
                        widget.productData['authorId'];

                    if (sellerId == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('ไม่พบข้อมูลผู้ขาย'),
                            backgroundColor: Colors.red,),
                      );
                      return;
                    }

                    final orderRef = FirebaseFirestore.instance
                        .collection('product_orders')
                        .doc();
                    await orderRef.set({
                      'orderId': orderRef.id,
                      'productId': widget.productData['id'],
                      'productName': widget.productData['productName'] ??
                          widget.productData['title'],
                      'productImage': widget.productData['imageUrl'] ??
                          widget.productData['coverImage'],
                      'price': widget.productData['price'] ?? 0,
                      'sellerId': sellerId,
                      'buyerId':
                          currentUser['lineUserId'] ?? currentUser['uid'],
                      'buyerName': currentUser['displayName'],
                      'buyerPic': currentUser['pictureUrl'],
                      'quantity': qty,
                      'note': noteController.text.trim(),
                      'status': 'pending',
                      'createdAt': FieldValue.serverTimestamp(),
                    });

                    await TukTukBridge().sendNotification(
                      recipientId: sellerId,
                      type: 'order',
                      title: 'มีคำสั่งซื้อใหม่!',
                      message:
                          'คุณได้รับคำสั่งซื้อ ${qty}x ${widget.productData['productName'] ?? 'สินค้า'}',
                      relatedId: orderRef.id,
                      relatedCollection: 'product_orders',
                      imageUrl: widget.productData['imageUrl'] ??
                          widget.productData['coverImage'],
                    );

                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text(
                                'ส่งคำขอซื้อเรียบร้อยแล้ว! ผู้ขายจะติดต่อกลับ',),
                            backgroundColor: Colors.green,),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _cyan,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),),
                  ),
                  child: Text('ยืนยันการขอซื้อ',
                      style: GoogleFonts.kanit(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,),),
                ),
              ),
              const SizedBox(height: 28),
            ],
          ),
        );
      },
    );
  }

  String? _checkProfanity(String text) {
    if (ProfanityFilter.hasProfanity(text)) {
      return 'profanity'; // Centralized check
    }
    return null;
  }

  Future<void> _reportProfanity(String chatId, String senderId,
      String senderName, String text, String word,) async {
    try {
      await FirebaseFirestore.instance.collection('chat_reports').add({
        'chatId': chatId,
        'senderId': senderId,
        'senderName': senderName,
        'messageText': text,
        'matchedWord': word,
        'timestamp': FieldValue.serverTimestamp(),
        'status': 'pending',
        'type': 'profanity',
      });
    } catch (_) {}
  }

  // ─── Product Chat (product_chats collection) ──────────────────────────────
  void _showProductChatSheet(
      BuildContext context, Map<String, dynamic> productData, String sellerId,) {
    final productId = productData['id'] ?? '';
    final buyerId = _currentUser?['lineUserId'] ??
        _currentUser?['uid'] ??
        'guest_${DateTime.now().millisecondsSinceEpoch}';
    final buyerName = _currentUser?['displayName'] ?? 'ลูกค้า';
    final chatId = '${productId}_$buyerId';
    final msgController = TextEditingController();
    final scrollController = ScrollController();
    bool quickRepliesVisible = true;

    // Pre-create / merge chat document
    FirebaseFirestore.instance.collection('product_chats').doc(chatId).set({
      'productId': productId,
      'productName': productData['productName'] ?? productData['title'] ?? '',
      'productImageUrl':
          productData['imageUrl'] ?? productData['coverImage'] ?? '',
      'sellerId': sellerId,
      'sellerName':
          productData['sellerName'] ?? productData['authorName'] ?? '',
      'lineUserId': sellerId,
      'buyerId': buyerId,
      'buyerName': buyerName,
      'buyerPic': _currentUser?['pictureUrl'] ?? '',
      'status': 'active',
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true),);

    final productName =
        productData['productName'] ?? productData['title'] ?? 'แชทสินค้า';
    final productImageUrl =
        productData['imageUrl'] ?? productData['coverImage'] ?? '';
    final double productPrice = (productData['price'] ?? 0.0).toDouble();
    final String productUnit = productData['unit'] ?? 'ชิ้น';

    void scrollToBottom() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (scrollController.hasClients) {
          scrollController.animateTo(
            scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOut,
          );
        }
      });
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: _surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            void sendMessage(String text) {
              text = text.trim();
              if (text.isEmpty) return;

              // Profanity check
              final badWord = _checkProfanity(text);
              if (badWord != null) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text('⚠️ กรุณาใช้คำสุภาพในการสนทนา',
                      style: GoogleFonts.kanit(),),
                  backgroundColor: Colors.orange,
                ),);
                _reportProfanity(chatId, buyerId, buyerName, text, badWord);
                return;
              }

              msgController.clear();
              if (quickRepliesVisible) {
                setSheetState(() => quickRepliesVisible = false);
              }
              _sendChatMsg(
                chatId: chatId,
                senderId: buyerId,
                senderName: buyerName,
                sellerId: sellerId,
                text: text,
              ).then((_) => scrollToBottom());
            }

            return DraggableScrollableSheet(
              expand: false,
              initialChildSize: 0.80,
              minChildSize: 0.45,
              maxChildSize: 0.95,
              builder: (_, __) => Column(
                children: [
                  // ── Header ─────────────────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    decoration: const BoxDecoration(
                      color: _card,
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(24)),
                      border: Border(bottom: BorderSide(color: _border)),
                    ),
                    child: Column(
                      children: [
                        // Drag handle
                        Container(
                            width: 40,
                            height: 4,
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                                color: _textLow,
                                borderRadius: BorderRadius.circular(2),),),
                        Row(
                          children: [
                            // Product thumbnail
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: productImageUrl.isNotEmpty
                                  ? CachedNetworkImage(
                                      imageUrl: productImageUrl,
                                      width: 44,
                                      height: 44,
                                      fit: BoxFit.cover,
                                      errorWidget: (_, __, ___) => Container(
                                          width: 44,
                                          height: 44,
                                          color: _cardAlt,
                                          child: const Icon(
                                              Icons.broken_image_rounded,
                                              color: _textLow,
                                              size: 18,),),
                                    )
                                  : Container(
                                      width: 44,
                                      height: 44,
                                      color: _cardAlt,
                                      child: const Icon(
                                          Icons.storefront_rounded,
                                          color: _textLow,
                                          size: 20,),),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    productName,
                                    style: GoogleFonts.kanit(
                                        color: _textHi,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    '฿${productPrice.toStringAsFixed(0)} / $productUnit',
                                    style: GoogleFonts.kanit(
                                        color: _cyan,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,),
                                  ),
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.pop(ctx),
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                    color: _cardAlt,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: _border),),
                                child: const Icon(Icons.close_rounded,
                                    color: _textMid, size: 16,),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // ── Messages ────────────────────────────────────────────────
                  Expanded(
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('product_chats')
                          .doc(chatId)
                          .collection('messages')
                          .orderBy('sentAt', descending: false)
                          .snapshots(),
                      builder: (_, snap) {
                        if (!snap.hasData) {
                          return const Center(
                              child: CircularProgressIndicator(
                                  color: _cyan, strokeWidth: 2,),);
                        }
                        final docs = snap.data!.docs;

                        WidgetsBinding.instance
                            .addPostFrameCallback((_) => scrollToBottom());

                        return ListView.builder(
                          controller: scrollController,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12,),
                          itemCount: docs.isEmpty ? 1 : docs.length + 1,
                          itemBuilder: (_, i) {
                            // [0] = product context card
                            if (i == 0) {
                              return Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: _card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: _border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'หัวข้อหลัก: สอบถามสินค้า',
                                      style: GoogleFonts.kanit(
                                          color: _textLow,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          letterSpacing: 0.5,),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        if (productImageUrl.isNotEmpty)
                                          ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(6),
                                            child: CachedNetworkImage(
                                              imageUrl: productImageUrl,
                                              width: 40,
                                              height: 40,
                                              fit: BoxFit.cover,
                                              errorWidget: (_, __, ___) =>
                                                  Container(
                                                      width: 40,
                                                      height: 40,
                                                      color: _cardAlt,),
                                            ),
                                          ),
                                        if (productImageUrl.isNotEmpty)
                                          const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                productName,
                                                style: GoogleFonts.kanit(
                                                    color: _textHi,
                                                    fontSize: 13,
                                                    fontWeight:
                                                        FontWeight.w700,),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              Text(
                                                '฿${productPrice.toStringAsFixed(0)}',
                                                style: GoogleFonts.kanit(
                                                    color: _cyan,
                                                    fontSize: 13,
                                                    fontWeight:
                                                        FontWeight.w600,),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            }

                            if (docs.isEmpty) return const SizedBox.shrink();

                            final msg =
                                docs[i - 1].data() as Map<String, dynamic>;
                            final isMe = msg['senderId'] == buyerId;
                            final Timestamp? ts = msg['sentAt'] as Timestamp?;
                            final timeStr = ts != null
                                ? TimeOfDay.fromDateTime(ts.toDate().toLocal())
                                    .format(context)
                                : '';

                            return Align(
                              alignment: isMe
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Column(
                                crossAxisAlignment: isMe
                                    ? CrossAxisAlignment.end
                                    : CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    margin:
                                        const EdgeInsets.symmetric(vertical: 3),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 10,),
                                    constraints: BoxConstraints(
                                        maxWidth:
                                            MediaQuery.of(context).size.width *
                                                0.72,),
                                    decoration: BoxDecoration(
                                      color: isMe
                                          ? _cyan.withValues(alpha: 0.18)
                                          : _cardAlt,
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                          color: isMe
                                              ? _cyan.withValues(alpha: 0.3)
                                              : _border,),
                                    ),
                                    child: Text(
                                      msg['text'] ?? '',
                                      style: GoogleFonts.kanit(
                                          color: _textHi, fontSize: 14,),
                                    ),
                                  ),
                                  if (timeStr.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(
                                          bottom: 2, left: 4, right: 4,),
                                      child: Text(
                                        timeStr,
                                        style: GoogleFonts.kanit(
                                            color: _textLow, fontSize: 10,),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),

                  // ── Quick Replies ────────────────────────────────────────
                  if (quickRepliesVisible)
                    Container(
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                      decoration: const BoxDecoration(
                          border: Border(top: BorderSide(color: _border)),),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            'สนใจสินค้านี้ครับ/ค่ะ 😊',
                            'ต่อรองราคาได้ไหมครับ/ค่ะ',
                            'ยังมีสินค้าอยู่ไหมครับ/ค่ะ',
                            'จัดส่งพัสดุได้ไหมครับ/ค่ะ',
                            'ขอดูรูปเพิ่มเติมได้ไหมครับ/ค่ะ',
                          ]
                              .map((t) => Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: GestureDetector(
                                      onTap: () => sendMessage(t),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 14, vertical: 8,),
                                        decoration: BoxDecoration(
                                            color: _cardAlt,
                                            borderRadius:
                                                BorderRadius.circular(20),
                                            border: Border.all(color: _border),),
                                        child: Text(t,
                                            style: GoogleFonts.kanit(
                                                color: _textMid, fontSize: 12,),),
                                      ),
                                    ),
                                  ),)
                              .toList(),
                        ),
                      ),
                    ),

                  // ── Input row ──────────────────────────────────────────
                  Container(
                    padding: EdgeInsets.only(
                      left: 12,
                      right: 12,
                      top: 10,
                      bottom: MediaQuery.of(ctx).viewInsets.bottom + 14,
                    ),
                    decoration: const BoxDecoration(
                        border: Border(top: BorderSide(color: _border)),),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: msgController,
                            style:
                                GoogleFonts.kanit(color: _textHi, fontSize: 14),
                            maxLines: null,
                            keyboardType: TextInputType.multiline,
                            textInputAction: TextInputAction.newline,
                            onSubmitted: (_) => sendMessage(msgController.text),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: _card,
                              hintText: 'พิมพ์ข้อความถึงผู้ขาย...',
                              hintStyle: GoogleFonts.kanit(color: _textLow),
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 10,),
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: BorderSide.none,),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        GestureDetector(
                          onTap: () => sendMessage(msgController.text),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                  colors: [_cyan, _cyanDim],),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.send_rounded,
                                color: Colors.black, size: 20,),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _sendChatMsg({
    required String chatId,
    required String senderId,
    required String senderName,
    required String sellerId,
    required String text,
  }) async {
    final batch = FirebaseFirestore.instance.batch();
    final msgRef = FirebaseFirestore.instance
        .collection('product_chats')
        .doc(chatId)
        .collection('messages')
        .doc();
    final chatRef =
        FirebaseFirestore.instance.collection('product_chats').doc(chatId);
    final isBuyer = senderId != sellerId;

    batch.set(msgRef, {
      'senderId': senderId,
      'senderName': senderName,
      'text': text,
      'sentAt': FieldValue.serverTimestamp(),
      'isRead': false,
    });
    batch.update(chatRef, {
      'lastMessage': text,
      'lastMessageAt': FieldValue.serverTimestamp(),
      if (isBuyer)
        'unreadCountSeller': FieldValue.increment(1)
      else
        'unreadCountBuyer': FieldValue.increment(1),
    });
    await batch.commit();

    // 🔔 Send Notification
    try {
      final isBuyer = senderId != sellerId;
      // If it's the buyer, recipient is seller. If it's the seller, recipient is buyer.
      // chatId is productId_buyerId
      final buyerId = chatId.contains('_') ? chatId.split('_').last : '';
      final recipientId = isBuyer ? sellerId : buyerId;

      if (recipientId.isNotEmpty) {
        await TukTukBridge().sendNotification(
          recipientId: recipientId,
          type: 'product_chat',
          title: isBuyer
              ? '💬 สอบถามสินค้า: $senderName'
              : '✉️ ร้านค้าตอบกลับแชทสินค้า',
          message: text,
          relatedId: chatId,
          relatedCollection: 'product_chats',
          senderId: senderId,
          senderName: senderName,
          imageUrl: _currentUser?['pictureUrl'],
        );
      }
    } catch (_) {}
  }

  void _openGallery(BuildContext context, List<String> images, int index) {
    Navigator.push(
      context,
      MaterialPageRoute(
          builder: (_) =>
              FullScreenImageGallery(images: images, initialIndex: index),),
    );
  }

  String? _getFirstImageUrl(Map<String, dynamic> data) {
    // 1. Check images list
    final List? images = data['images'] as List?;
    if (images != null && images.isNotEmpty) {
      for (final img in images) {
        String? url;
        if (img is Map) {
          url = img['url'];
        } else if (img is String) url = img;
        if (url != null && url.trim().isNotEmpty) return url.trim();
      }
    }
    // 2. Check direct fields
    final List<String> fields = ['imageUrl', 'coverImage', 'videoThumbnail'];
    for (final f in fields) {
      final val = data[f];
      if (val is String && val.trim().isNotEmpty) return val.trim().toString();
    }
    return null;
  }

  Widget _buildUniversalImage(String url, {double? height, double? width}) {
    if (url.startsWith('assets/') || !url.startsWith('http')) {
      return Image.asset(
        url.isEmpty ? 'assets/images/logo.png' : url,
        height: height,
        width: width,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          height: height,
          width: width,
          color: _card,
          child: const Icon(Icons.broken_image_rounded, color: _textLow),
        ),
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      height: height,
      width: width,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(
        height: height,
        width: width,
        color: _surface,
        child: const Center(
          child: CircularProgressIndicator(color: _cyan, strokeWidth: 2),
        ),
      ),
      errorWidget: (_, __, ___) => Container(
        height: height,
        width: width,
        color: _card,
        child: const Icon(Icons.broken_image_rounded, color: _textLow),
      ),
    );
  }
}

// ─── Full Screen Gallery ───────────────────────────────────────────────────────
class FullScreenImageGallery extends StatefulWidget {
  final List<String> images;
  final int initialIndex;
  const FullScreenImageGallery(
      {super.key, required this.images, required this.initialIndex,});

  @override
  State<FullScreenImageGallery> createState() => _FullScreenImageGalleryState();
}

class _FullScreenImageGalleryState extends State<FullScreenImageGallery> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.images.length,
            onPageChanged: (index) => setState(() => _currentIndex = index),
            itemBuilder: (context, index) {
              return InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Center(
                  child: Hero(
                    tag: 'product_img_gallery_$index',
                    child: CachedNetworkImage(
                      imageUrl: widget.images[index],
                      fit: BoxFit.contain,
                      placeholder: (context, url) =>
                          const CircularProgressIndicator(color: Colors.white),
                      errorWidget: (context, url, error) =>
                          const Icon(Icons.error, color: Colors.white),
                    ),
                  ),
                ),
              );
            },
          ),
          // Close button
          Positioned(
            top: 52,
            left: 16,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white12),
                ),
                child: const Icon(Icons.close_rounded,
                    color: Colors.white, size: 20,),
              ),
            ),
          ),
          // Counter
          Positioned(
            top: 52,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white12),
              ),
              child: Text(
                '${_currentIndex + 1} / ${widget.images.length}',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,),
              ),
            ),
          ),
          // Dot indicator
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                  widget.images.length,
                  (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: i == _currentIndex ? 20 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: i == _currentIndex
                              ? Colors.white
                              : Colors.white38,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),),
            ),
          ),
        ],
      ),
    );
  }
}
