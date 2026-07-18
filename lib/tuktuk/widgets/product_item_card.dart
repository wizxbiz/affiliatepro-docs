import 'dart:ui';

import 'package:animate_do/animate_do.dart';
import 'package:better_player_plus/better_player_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/product_detail_screen.dart';
import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/widgets/video_fallback_card.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

class ProductItemCard extends StatefulWidget {
  final Map<String, dynamic> productData;
  final bool isActive;
  final bool isAutoScrollEnabled;
  final VoidCallback onTimerEnd;
  final Position? userPosition;

  const ProductItemCard({
    super.key,
    required this.productData,
    required this.isActive,
    required this.isAutoScrollEnabled,
    required this.onTimerEnd,
    this.userPosition,
  });

  @override
  State<ProductItemCard> createState() => _ProductItemCardState();
}

class _ProductItemCardState extends State<ProductItemCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  bool _isPaused = false;
  BetterPlayerController? _videoController;
  bool _showVideo = false;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8), // Set back to 8 seconds
    );

    if (widget.isActive && widget.isAutoScrollEnabled) {
      _startCountdown();
    }

    _initVideoIfNeeded();
  }

  void _initVideoIfNeeded() {
    final videoUrl = widget.productData['videoUrl']?.toString();
    if (videoUrl != null && videoUrl.isNotEmpty) {
      _showVideo = true;
      _videoController = BetterPlayerController(
        const BetterPlayerConfiguration(
          aspectRatio: 1,
          autoPlay: true,
          looping: false,
          fit: BoxFit.cover,
          controlsConfiguration: BetterPlayerControlsConfiguration(
            showControls: false,
          ),
        ),
      );

      _videoController!.setupDataSource(
        BetterPlayerDataSource(
          BetterPlayerDataSourceType.network,
          videoUrl,
          bufferingConfiguration: const BetterPlayerBufferingConfiguration(
            minBufferMs: 2000,
            maxBufferMs: 5000,
          ),
        ),
      );

      _videoController!.addEventsListener((event) {
        if (event.betterPlayerEventType == BetterPlayerEventType.finished) {
          if (mounted) {
            setState(() {
              _showVideo = false;
            });
          }
        }
      });
    }
  }

  void _startCountdown() {
    if (_isPaused) return;
    _progressController.reset();
    _progressController.forward().then((_) {
      if (mounted && widget.isActive && !_isPaused) {
        widget.onTimerEnd();
      }
    });
  }

  void _togglePause(bool pause) {
    if (!widget.isAutoScrollEnabled) return;
    setState(() {
      _isPaused = pause;
      if (pause) {
        _progressController.stop();
      } else if (widget.isActive) {
        _progressController.forward();
      }
    });
  }

  @override
  void didUpdateWidget(ProductItemCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive && widget.isAutoScrollEnabled) {
      _isPaused = false;
      _startCountdown();

      // Resume video if we were showing video
      if (_showVideo && _videoController != null) {
        _videoController!.play();
      }
    } else if (!widget.isActive) {
      _isPaused = false;
      _progressController.stop();
      _progressController.reset();

      // Pause video to save resources
      _videoController?.pause();
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _launchProductUrl() async {
    final targetUrl = widget.productData['affiliateUrl'] ??
        widget.productData['targetUrl'] ??
        widget.productData['url'];

    if (targetUrl != null && targetUrl.toString().isNotEmpty) {
      final uri = Uri.parse(targetUrl.toString());
      try {
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('ไม่สามารถเปิดลิงก์ได้')),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    } else {
      // Navigate to internal detail page if no external URL found
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(
              productData: widget.productData,
            ),
          ),
        );
      }
    }
  }

  void _navigateToDetail() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailScreen(
          productData: widget.productData,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Extract data with proper null safety
    String imageUrl = widget.productData['imageUrl']?.toString() ??
        widget.productData['coverImage']?.toString() ??
        '';

    if ((imageUrl.isEmpty ||
            imageUrl == 'null' ||
            imageUrl == 'undefined' ||
            imageUrl.toLowerCase().contains('.mp4')) &&
        widget.productData['images'] != null) {
      final dynamic imagesData = widget.productData['images'];
      if (imagesData is List && imagesData.isNotEmpty) {
        final firstImage = imagesData[0];
        if (firstImage is String) {
          imageUrl = firstImage;
        } else if (firstImage is Map) {
          imageUrl = firstImage['url']?.toString() ??
              firstImage['thumbnailUrl']?.toString() ??
              '';
        }
      } else if (imagesData is Map) {
        imageUrl = imagesData['url']?.toString() ?? '';
      }
    }

    // Check thumbnail fallback
    if (imageUrl.isEmpty || imageUrl == 'null' || imageUrl == 'undefined') {
      imageUrl = widget.productData['thumbnailUrl']?.toString() ??
          widget.productData['thumb']?.toString() ??
          '';
    }

    // Final validation
    if (imageUrl.isEmpty ||
        imageUrl == 'null' ||
        imageUrl == 'undefined' ||
        !imageUrl.startsWith('http')) {
      imageUrl =
          'https://images.unsplash.com/photo-1557683316-973673baf926'; // High quality gradient fallback
    }

    final productName =
        widget.productData['productName']?.toString() ?? 'สินค้า';
    final price = widget.productData['price']?.toString() ?? '0';
    final sellerName = widget.productData['sellerName']?.toString() ??
        widget.productData['userName']?.toString() ??
        'Partner';
    final sellerPic = widget.productData['sellerPictureUrl']?.toString() ??
        widget.productData['userPic']?.toString() ??
        widget.productData['pictureUrl']?.toString() ??
        widget.productData['photoURL']?.toString() ??
        '';

    // Sanitize sellerPic
    final bool isSellerPicValid =
        sellerPic.startsWith('http') && sellerPic.length > 10;

    return RepaintBoundary(
      child: GestureDetector(
        onLongPressStart: (_) => _togglePause(true),
        onLongPressEnd: (_) => _togglePause(false),
        // Allow vertical drags to pass through to the parent PageView
        onVerticalDragUpdate: null,
        onVerticalDragStart: null,
        onVerticalDragEnd: null,

        onTapDown: (_) => _togglePause(true),
        onTapUp: (_) => _togglePause(false),
        onTapCancel: () => _togglePause(false),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // 1. Dynamic Background (Futuristic Deep Mesh)
            Container(
              decoration: const BoxDecoration(
                color: Color(0xFF050510),
                gradient: RadialGradient(
                  center: Alignment(-0.8, -0.6),
                  radius: 1.2,
                  colors: [
                    Color(0x1500F2EA),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0.8, 0.6),
                  radius: 1.2,
                  colors: [
                    Color(0x15FF0050),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
            CachedNetworkImage(
              imageUrl: imageUrl,
              fit: BoxFit.cover,
              color: Colors.black.withValues(alpha: 0.5),
              colorBlendMode: BlendMode.darken,
              placeholder: (context, url) => Container(color: Colors.black),
              errorWidget: (context, url, error) => Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
            BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
              child: Container(
                color: Colors.black.withValues(alpha: 0.4),
              ),
            ),

            // 2. Premium Countdown Bar
            if (widget.isActive && widget.isAutoScrollEnabled)
              Positioned(
                top: MediaQuery.of(context).padding.top + 15,
                left: 30,
                right: 30,
                child: Column(
                  children: [
                    FadeInDown(
                      duration: const Duration(milliseconds: 1000),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Stack(
                          children: [
                            AnimatedBuilder(
                              animation: _progressController,
                              builder: (context, child) {
                                return LinearProgressIndicator(
                                  value: _progressController.value,
                                  backgroundColor: Colors.white10,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    _isPaused
                                        ? Colors.white70
                                        : const Color(0xFF00D2FF),
                                  ),
                                  minHeight: 2,
                                );
                              },
                            ),
                            // Web-style Glow Overlay
                            AnimatedBuilder(
                              animation: _progressController,
                              builder: (context, child) {
                                return FractionallySizedBox(
                                  alignment: Alignment.centerLeft,
                                  widthFactor: _progressController.value,
                                  child: Container(
                                    height: 2,
                                    decoration: BoxDecoration(
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF00D2FF)
                                              .withValues(alpha: 0.5),
                                          blurRadius: 10,
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (_isPaused)
                      FadeIn(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF00f2ea).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: const Color(0xFF00f2ea)
                                  .withValues(alpha: 0.5),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.touch_app,
                                color: Color(0xFF00f2ea),
                                size: 10,
                              ),
                              SizedBox(width: 6),
                              Text(
                                'HOLDING TO VIEW',
                                style: TextStyle(
                                  color: Color(0xFF00f2ea),
                                  fontSize: 9,
                                  letterSpacing: 2,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),

            // 3. Main Content (Centered Product Image)
            Positioned.fill(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final screenWidth = constraints.maxWidth;
                  final screenHeight = constraints.maxHeight;
                  final isShort = screenHeight < 750;

                  // Adaptive proportions
                  final cardWidth =
                      screenWidth * (screenWidth > 600 ? 0.6 : 0.82);
                  final cardHeight =
                      isShort ? screenHeight * 0.35 : cardWidth * 1.0;

                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).padding.top +
                            (isShort ? 10 : 30),
                      ),
                      Stack(
                        alignment: Alignment.centerRight,
                        clipBehavior: Clip.none,
                        children: [
                          ZoomIn(
                            child: GestureDetector(
                              onTap: _navigateToDetail,
                              child: Container(
                                width: cardWidth,
                                height: cardHeight,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1E293B),
                                  borderRadius: BorderRadius.circular(25),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.08),
                                    width: 1,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.3),
                                      blurRadius: 30,
                                      offset: const Offset(0, 15),
                                    ),
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(25),
                                  child: Stack(
                                    children: [
                                      if (_showVideo &&
                                          _videoController != null)
                                        BetterPlayer(
                                          controller: _videoController!,
                                        )
                                      else
                                        CachedNetworkImage(
                                          imageUrl: imageUrl,
                                          width: double.infinity,
                                          height: double.infinity,
                                          fit: BoxFit.cover,
                                          placeholder: (context, url) =>
                                              Container(
                                            color: Colors.grey[900],
                                          ),
                                          errorWidget: (context, url, error) =>
                                              VideoFallbackCard(
                                            failedUrl: url,
                                            mediaType: 'image',
                                            onRetry: () => setState(() {}),
                                          ),
                                        ),
                                      // Smart Premium Badge System (from product.html)
                                      Positioned(
                                        top: isShort ? 10 : 15,
                                        left: isShort ? 10 : 15,
                                        child: _buildProductBadge(
                                          isShort: isShort,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                          // Floating Action Pill (Web Style)
                          Positioned(
                            right: -15,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(35),
                              child: BackdropFilter(
                                filter:
                                    ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                child: Container(
                                  padding: EdgeInsets.symmetric(
                                    vertical: isShort ? 15 : 20,
                                    horizontal: isShort ? 8 : 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.4),
                                    borderRadius: BorderRadius.circular(35),
                                    border: Border.all(color: Colors.white10),
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _buildPillAction(
                                        icon: Icons.shopping_bag,
                                        label: 'ซื้อเลย',
                                        color: const Color(0xFFFFD700),
                                        isShort: isShort,
                                      ),
                                      SizedBox(height: isShort ? 20 : 25),
                                      _buildPillAction(
                                        icon: Icons.share,
                                        label: 'แชร์',
                                        color: Colors.white70,
                                        isShort: isShort,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Spacer(flex: 3),
                    ],
                  );
                },
              ),
            ),

            // 4. Integrated Info Panel (Web Card Style)
            Positioned(
              bottom: MediaQuery.of(context).size.height < 750 ? 80 : 100,
              left: 15,
              right: 15,
              child: FadeInUp(
                duration: const Duration(milliseconds: 600),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isShort = MediaQuery.of(context).size.height < 750;
                    final hPadding = isShort ? 20.0 : 25.0;
                    final vPadding = isShort ? 18.0 : 25.0;

                    return ClipRRect(
                      borderRadius: BorderRadius.circular(isShort ? 25 : 35),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: hPadding,
                            vertical: vPadding,
                          ),
                          decoration: BoxDecoration(
                            color:
                                const Color(0xFF1A1A1A).withValues(alpha: 0.85),
                            borderRadius:
                                BorderRadius.circular(isShort ? 25 : 35),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.1),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Seller Meta info
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(2),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white24),
                                    ),
                                    child: CircleAvatar(
                                      radius: isShort ? 10 : 12,
                                      backgroundImage: isSellerPicValid
                                          ? CachedNetworkImageProvider(
                                              sellerPic,
                                            )
                                          : null,
                                      child: !isSellerPicValid
                                          ? Icon(
                                              Icons.person,
                                              size: isShort ? 12 : 14,
                                              color: Colors.white54,
                                            )
                                          : null,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    sellerName,
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: isShort ? 12 : 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const Spacer(),
                                  if (widget.userPosition != null &&
                                      widget.productData['lat'] != null &&
                                      widget.productData['lng'] != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.cyanAccent
                                            .withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: Colors.cyanAccent
                                              .withValues(alpha: 0.3),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            Icons.location_on,
                                            color: Colors.cyanAccent,
                                            size: 10,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            TukTukLocationService()
                                                .formatDistance(
                                              TukTukLocationService()
                                                  .calculateDistance(
                                                widget.userPosition!.latitude,
                                                widget.userPosition!.longitude,
                                                (widget.productData['lat'] ?? 0)
                                                    .toDouble(),
                                                (widget.productData['lng'] ?? 0)
                                                    .toDouble(),
                                              ),
                                            ),
                                            style: const TextStyle(
                                              color: Colors.cyanAccent,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                              SizedBox(height: isShort ? 8 : 12),
                              // Product Name
                              Text(
                                productName,
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: isShort ? 20 : 24,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Outfit',
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              // Price (Yellow Style)
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    '฿ ',
                                    style: TextStyle(
                                      color: const Color(0xFFFFD700),
                                      fontSize: isShort ? 14 : 18,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  Text(
                                    price,
                                    style: TextStyle(
                                      color: const Color(0xFFFFD700),
                                      fontSize: isShort ? 26 : 30,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Outfit',
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: isShort ? 6 : 10),
                              // Description snippet
                              Text(
                                widget.productData['description']?.toString() ??
                                    '$productName ✨ สเปคคุ้ม ราคาโดนใจ!',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  fontSize: isShort ? 12 : 13,
                                  height: 1.3,
                                ),
                                maxLines: isShort ? 1 : 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              SizedBox(height: isShort ? 15 : 20),
                              // Main Action Button (White Style)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(15),
                                child: Material(
                                  color: Colors.white,
                                  child: InkWell(
                                    onTap: () {
                                      debugPrint(
                                        'ProductItemCard: View Details tapped',
                                      );
                                      _launchProductUrl();
                                    },
                                    child: Container(
                                      width: double.infinity,
                                      height: isShort ? 48 : 55,
                                      alignment: Alignment.center,
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.shopping_cart,
                                            color: Colors.black,
                                            size: isShort ? 18 : 20,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'ดูรายละเอียดสินค้า',
                                            style: TextStyle(
                                              color: Colors.black,
                                              fontSize: isShort ? 14 : 16,
                                              fontWeight: FontWeight.w800,
                                              fontFamily: 'Outfit',
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
                    );
                  },
                ),
              ),
            ),

            // More Options for Owners
            Positioned(
              top: MediaQuery.of(context).padding.top + 60,
              right: 20,
              child: IconButton(
                onPressed: _showMoreOptions,
                icon: const Icon(Icons.more_vert, color: Colors.white70),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Smart product badge system ported from product.html
  /// Priority: OTOP 🏆 > Organic 🌿 > Hot 🔥 > Verified ✅ > RECOMMENDED
  Widget _buildProductBadge({bool isShort = false}) {
    final data = widget.productData;
    final bool isOTOP = data['isOTOP'] == true || data['otop'] == true;
    final bool isOrganic = data['isOrganic'] == true || data['organic'] == true;
    final int views = (data['viewCount'] ?? data['views'] ?? 0) as int;
    final bool isHot = views > 500 || data['isHot'] == true;
    final bool isVerified = data['isSellerVerified'] == true ||
        data['sellerVerified'] == true ||
        data['verified'] == true;

    Color badgeColor;
    String badgeLabel;

    if (isOTOP) {
      badgeColor = const Color(0xFFFF6B35);
      badgeLabel = '🏆 OTOP';
    } else if (isOrganic) {
      badgeColor = const Color(0xFF2ECC71);
      badgeLabel = '🌿 ออร์แกนิก';
    } else if (isHot) {
      badgeColor = const Color(0xFFE74C3C);
      badgeLabel = '🔥 HOT';
    } else if (isVerified) {
      badgeColor = const Color(0xFF667EEA);
      badgeLabel = '✅ Verified';
    } else {
      badgeColor = const Color(0xFFFF6B00);
      badgeLabel = 'RECOMMENDED';
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isShort ? 10 : 12,
        vertical: isShort ? 4 : 6,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [badgeColor, badgeColor.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: badgeColor.withValues(alpha: 0.4),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Text(
        badgeLabel,
        style: TextStyle(
          color: Colors.white,
          fontSize: isShort ? 9 : 10,
          fontWeight: FontWeight.w900,
          fontFamily: 'Outfit',
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  void _showMoreOptions() async {
    final user = await TukTukBridge().getCurrentUser();
    final sellerId = widget.productData['sellerId']?.toString() ??
        widget.productData['userId']?.toString() ??
        widget.productData['authorId']?.toString();

    final bool isOwner = user != null && user['uid'] == sellerId;

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.grey[900]?.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(25)),
          border: Border.all(color: Colors.white10),
        ),
        child: SafeArea(
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
              const SizedBox(height: 20),
              if (isOwner) ...[
                _buildOptionTile(
                  icon: Icons.edit_note,
                  label: 'แก้ไขข้อมูลสินค้า',
                  color: Colors.blueAccent,
                  onTap: () {
                    Navigator.pop(context);
                    _editProduct();
                  },
                ),
                _buildOptionTile(
                  icon: Icons.delete_outline,
                  label: 'ลบสินค้าออก',
                  color: Colors.redAccent,
                  onTap: () {
                    Navigator.pop(context);
                    _confirmDelete();
                  },
                ),
              ] else
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Text(
                    'ไม่มีตัวเลือกเพิ่มเติมสำหรับสินค้านี้',
                    style: TextStyle(color: Colors.white54),
                  ),
                ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(label, style: const TextStyle(color: Colors.white)),
      onTap: onTap,
    );
  }

  void _editProduct() {
    final TextEditingController nameController = TextEditingController(
      text: widget.productData['productName']?.toString() ?? '',
    );
    final TextEditingController priceController = TextEditingController(
      text: widget.productData['price']?.toString() ?? '0',
    );
    final TextEditingController descController = TextEditingController(
      text: widget.productData['description']?.toString() ?? '',
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'แก้ไขข้อมูลสินค้า',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 15),
                _buildTextField('ชื่อสินค้า', nameController),
                const SizedBox(height: 12),
                _buildTextField(
                  'ราคา',
                  priceController,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                _buildTextField('รายละเอียด', descController, maxLines: 3),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text(
                          'ยกเลิก',
                          style: TextStyle(color: Colors.white54),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: () async {
                          final String productId =
                              widget.productData['id'] ?? '';
                          if (productId.isEmpty) return;

                          // Determine collection base on data
                          String collection = 'marketplace_items';
                          if (widget.productData.containsKey('isOTOP') ||
                              widget.productData.containsKey('productUnit')) {
                            collection = 'community_products';
                          }

                          final updates = {
                            'productName': nameController.text.trim(),
                            'price':
                                double.tryParse(priceController.text) ?? 0.0,
                            'description': descController.text.trim(),
                            'updatedAt': DateTime.now().toIso8601String(),
                          };

                          try {
                            final success = await TukTukBridge()
                                .updateProduct(productId, collection, updates);

                            if (success && mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('อัปเดตข้อมูลสินค้าแล้ว'),
                                ),
                              );
                            }
                          } catch (e) {
                            debugPrint('Update product error: $e');
                          }
                        },
                        child: const Text(
                          'บันทึก',
                          style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
        const SizedBox(height: 5),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.05),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
      ],
    );
  }

  Future<void> _confirmDelete() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text(
          'ยืนยันการลบสินค้า',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'คุณแน่ใจหรือไม่ว่าต้องการลบรายการสินค้านี้?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('ยกเลิก', style: TextStyle(color: Colors.white54)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ลบ', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (result == true && mounted) {
      final String productId = widget.productData['id'] ?? '';
      if (productId.isEmpty) return;

      String collection = 'marketplace_items';
      if (widget.productData.containsKey('isOTOP') ||
          widget.productData.containsKey('productUnit')) {
        collection = 'community_products';
      }

      try {
        final success =
            await TukTukBridge().deleteProduct(productId, collection);
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('ลบสินค้าสำเร็จ')),
          );
        }
      } catch (e) {
        debugPrint('Delete product error: $e');
      }
    }
  }

  Widget _buildPillAction({
    required IconData icon,
    required String label,
    required Color color,
    required bool isShort,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: isShort ? 20 : 24),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.white70,
            fontSize: isShort ? 8 : 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
