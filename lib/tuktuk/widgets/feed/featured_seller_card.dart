import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/tuktuk_item.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FeaturedSellerCard extends StatelessWidget {
  final TukTukItem item;

  const FeaturedSellerCard({
    super.key,
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<QuerySnapshot>(
      future: FirebaseFirestore.instance
          .collection('marketplace_items')
          .where('status', isEqualTo: 'active')
          .orderBy('viewCount', descending: true)
          .limit(5)
          .get(),
      builder: (context, snapshot) {
        // Return nothing if no data found to avoid blank/broken cards in feed
        if (snapshot.connectionState == ConnectionState.done &&
            (!snapshot.hasData || snapshot.data!.docs.isEmpty)) {
          return const SizedBox.shrink();
        }

        // Show skeleton only while explicitly loading
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildFeaturedSellerSkeleton();
        }

        final docs = snapshot.data!.docs;
        // Pick a doc based on where in the feed this card appears
        final insertedAfter = item.data['insertedAfterVideo'] as int? ?? 15;
        final idx = ((insertedAfter ~/ 15) - 1) % docs.length;
        final sellerData = docs[idx].data() as Map<String, dynamic>;
        final sellerName =
            sellerData['sellerName'] ?? sellerData['authorName'] ?? 'ผู้ขาย';
        final shopName =
            sellerData['shopName'] ?? sellerData['storeName'] ?? sellerName;
        final productName =
            sellerData['productName'] ?? sellerData['title'] ?? 'สินค้าแนะนำ';
        final imageUrl =
            sellerData['imageUrl'] ?? sellerData['thumbnailUrl'] ?? '';
        final price = sellerData['price'];
        final sellerId = sellerData['sellerId'] ?? sellerData['userId'] ?? '';
        final productId = docs[idx].id;

        return Stack(
          children: [
            // Background image
            if (imageUrl.isNotEmpty)
              Positioned.fill(
                child: CachedNetworkImage(
                  imageUrl: imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      Container(color: const Color(0xFF1A1A2E)),
                  errorWidget: (_, __, ___) =>
                      Container(color: const Color(0xFF1A1A2E)),
                ),
              ),
            // Dark gradient overlay
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.3),
                      Colors.black.withValues(alpha: 0.9),
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),

            // Top banner
            Positioned(
              top: 60,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF6B35), Color(0xFFFF8C42)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF6B35).withValues(alpha: 0.4),
                        blurRadius: 12,
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.store_mall_directory_rounded,
                        color: Colors.white,
                        size: 14,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '✨ ร้านค้าแนะนำ',
                        style: GoogleFonts.kanit(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Bottom info panel
            Positioned(
              bottom: 100,
              left: 16,
              right: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shop name
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      '🏪 $shopName',
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Product name
                  Text(
                    productName,
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      height: 1.2,
                      shadows: const [
                        Shadow(
                          blurRadius: 10,
                          color: Colors.black54,
                        ),
                      ],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (price != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF00C853), Color(0xFF69F0AE)],
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '฿${price is num ? price.toStringAsFixed(0) : price}',
                            style: GoogleFonts.kanit(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 16),
                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            if (productId.isNotEmpty) {
                              Navigator.pushNamed(
                                context,
                                '/product-detail',
                                arguments: {
                                  'productId': productId,
                                  'data': sellerData,
                                },
                              );
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [
                                  Color(0xFFFF6B35),
                                  Color(0xFFFF3D71),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFFF6B35)
                                      .withValues(alpha: 0.4),
                                  blurRadius: 15,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                '🛍️ ดูสินค้า',
                                style: GoogleFonts.kanit(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      if (sellerId.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            Navigator.pushNamed(
                              context,
                              '/profile',
                              arguments: {'userId': sellerId},
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 18,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.3),
                              ),
                            ),
                            child: const Icon(
                              Icons.person_pin_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildFeaturedSellerSkeleton() {
    return Container(
      color: const Color(0xFF0D0D0D),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: const CircularProgressIndicator(
                color: Color(0xFFFF6B35),
                strokeWidth: 2,
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: 150,
              height: 10,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
