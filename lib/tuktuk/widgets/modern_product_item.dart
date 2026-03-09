import 'dart:ui';

import 'package:animate_do/animate_do.dart';
import 'package:better_player_plus/better_player_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/product_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ModernProductItem extends StatefulWidget {
  final Map<String, dynamic> productData;
  final bool isActive;
  final bool isAutoScrollEnabled;
  final VoidCallback onTimerEnd;

  const ModernProductItem({
    super.key,
    required this.productData,
    required this.isActive,
    required this.isAutoScrollEnabled,
    required this.onTimerEnd,
  });

  @override
  State<ModernProductItem> createState() => _ModernProductItemState();
}

class _ModernProductItemState extends State<ModernProductItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  BetterPlayerController? _videoController;
  bool _showVideo = false;
  bool _isPaused = false;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
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
          aspectRatio: 9 / 16,
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
        ),
      );

      _videoController!.addEventsListener((event) {
        if (event.betterPlayerEventType == BetterPlayerEventType.finished) {
          if (mounted) {
            setState(() {
              _showVideo = false;
            });
            // If video finished and no images, we might want to stay or skip
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

  @override
  void didUpdateWidget(ModernProductItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      if (widget.isAutoScrollEnabled) {
        _isPaused = false;
        _startCountdown();
      }
      _videoController?.play();
    } else if (!widget.isActive) {
      _progressController.stop();
      _videoController?.pause();
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    _videoController?.dispose();
    super.dispose();
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
    final String imageUrl = widget.productData['imageUrl']?.toString() ?? '';
    final String productName =
        widget.productData['productName'] ?? 'สินค้ามาตรฐาน';
    final String price = widget.productData['price']?.toString() ?? '0';
    final String sellerName =
        widget.productData['sellerName'] ?? 'ร้านค้าสมาชิก';
    final String? sellerPic = widget.productData['sellerImage'];
    final String? location =
        widget.productData['sellerLocation'] ?? widget.productData['province'];

    return GestureDetector(
      onTap: _navigateToDetail,
      onLongPressStart: (_) {
        setState(() => _isPaused = true);
        _progressController.stop();
        _videoController?.pause();
      },
      onLongPressEnd: (_) {
        setState(() => _isPaused = false);
        if (widget.isActive && widget.isAutoScrollEnabled) {
          _progressController.forward();
        }
        _videoController?.play();
      },
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Background (Blurred)
          CachedNetworkImage(
            imageUrl: imageUrl,
            fit: BoxFit.cover,
            errorWidget: (context, error, stackTrace) =>
                Container(color: Colors.black),
          ),
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(color: Colors.black.withValues(alpha: 0.4)),
          ),

          // 2. Main Content (Center)
          Center(
            child: Hero(
              tag: 'product_${widget.productData['id']}',
              child: Container(
                width: MediaQuery.of(context).size.width * 0.9,
                height: MediaQuery.of(context).size.height * 0.7,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 30,
                      offset: const Offset(0, 15),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (_showVideo && _videoController != null)
                        BetterPlayer(controller: _videoController!)
                      else
                        CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                        ),

                      // Hot Deal Badge
                      Positioned(
                        top: 20,
                        right: 20,
                        child: FadeInRight(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFF0050),
                              borderRadius: BorderRadius.circular(15),
                              boxShadow: [
                                const BoxShadow(
                                    color: Colors.black26, blurRadius: 5),
                              ],
                            ),
                            child: const Text(
                              'LIVE DEAL',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
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
          ),

          // 3. Bottom Info Overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 40, 20, 40),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.9)
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  FadeInUp(
                    duration: const Duration(milliseconds: 500),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                productName,
                                style: GoogleFonts.prompt(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 12,
                                    backgroundImage: (sellerPic != null &&
                                            sellerPic.isNotEmpty &&
                                            sellerPic.startsWith('http'))
                                        ? CachedNetworkImageProvider(sellerPic)
                                        : null,
                                    child: (sellerPic == null ||
                                            sellerPic.isEmpty ||
                                            !sellerPic.startsWith('http'))
                                        ? const Icon(Icons.person, size: 15)
                                        : null,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    sellerName,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              if (location != null && location.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.location_on,
                                        color: Colors.white54,
                                        size: 12,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        location,
                                        style: const TextStyle(
                                          color: Colors.white54,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'ราคาพิเศษ',
                              style: TextStyle(
                                color: Color(0xFF00F2EA),
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              '฿$price',
                              style: GoogleFonts.oswald(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Action Buttons
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    delay: const Duration(milliseconds: 200),
                    child: Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _navigateToDetail,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 15),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                            ),
                            child: const Text(
                              'ดูรายละเอียดสินค้า',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF00F2EA),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: IconButton(
                            onPressed: () {
                              // Share or like logic
                            },
                            icon: const Icon(Icons.share, color: Colors.black),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 4. Progress Bar (Top)
          if (widget.isAutoScrollEnabled)
            Positioned(
              top: MediaQuery.of(context).padding.top + 5,
              left: 20,
              right: 20,
              child: AnimatedBuilder(
                animation: _progressController,
                builder: (context, child) {
                  return LinearProgressIndicator(
                    value: _progressController.value,
                    backgroundColor: Colors.white24,
                    valueColor:
                        const AlwaysStoppedAnimation<Color>(Color(0xFF00F2EA)),
                    minHeight: 3,
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
