import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../screens/product_detail_screen.dart';

class MarketplaceGridCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback? onViewed;

  const MarketplaceGridCard({super.key, required this.product, this.onViewed});

  @override
  Widget build(BuildContext context) {
    final images = product['images'] as List?;
    String? imageUrl;
    if (images != null && images.isNotEmpty) {
      final first = images[0];
      imageUrl =
          (first is Map) ? first['url'] : (first is String ? first : null);
    }
    imageUrl ??= product['imageUrl'];
    imageUrl ??= product['coverImage'];
    imageUrl ??= product['videoThumbnail'];

    final String productName =
        product['productName'] ?? product['title'] ?? 'สินค้า';
    final String price = product['price']?.toString() ?? '0';
    final String? province = product['province'] ?? product['location'];
    final bool isSold = product['status'] == 'sold';
    final bool isCommunity = product['source'] == 'community';

    return GestureDetector(
      onTap: () {
        if (onViewed != null) onViewed!();
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(productData: product),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            Expanded(
              flex: 12,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  (imageUrl != null &&
                          (imageUrl.startsWith('assets/') ||
                              !imageUrl.startsWith('http')))
                      ? Image.asset(
                          imageUrl.isEmpty
                              ? 'assets/images/logo.png'
                              : imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: Colors.white.withValues(alpha: 0.05),
                            child: const Center(
                              child: Icon(Icons.broken_image_rounded,
                                  color: Colors.white24, size: 24,),
                            ),
                          ),
                        )
                      : CachedNetworkImage(
                          imageUrl: imageUrl ?? '',
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: Colors.white.withValues(alpha: 0.05),
                            child: const Center(
                              child: CircularProgressIndicator(
                                  color: Color(0xFFEAB308), strokeWidth: 1,),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: Colors.white.withValues(alpha: 0.05),
                            child: const Center(
                              child: Icon(Icons.broken_image_rounded,
                                  color: Colors.white24, size: 24,),
                            ),
                          ),
                        ),
                  // Glossy Overlay Effect (Simulated)
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.white.withValues(alpha: 0.1),
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.3),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                  // Badges
                  if (isCommunity)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4,),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            const BoxShadow(color: Colors.black26, blurRadius: 4),
                          ],
                        ),
                        child: Text(
                          'COMMUNITY',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  // Location Badge
                  if (province != null)
                    Positioned(
                      bottom: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4,),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.location_on,
                                color: Colors.orange, size: 10,),
                            const SizedBox(width: 4),
                            Text(
                              province,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 9,),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // 🛠️ Service Badge
                  // 👁️ View Count Badge
                  Positioned(
                    top: 10,
                    right: product['type'] == 'service' ? 80 : 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2,),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.visibility_outlined,
                              color: Colors.white, size: 10,),
                          const SizedBox(width: 4),
                          Text(
                            '${product['viewCount'] ?? 0}',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 9,),
                          ),
                        ],
                      ),
                    ),
                  ),

                  if (isSold)
                    Positioned.fill(
                      child: Container(
                        color: Colors.black.withValues(alpha: 0.7),
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8,),
                            decoration: BoxDecoration(
                              color: Colors.redAccent,
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                const BoxShadow(color: Colors.black26, blurRadius: 10),
                              ],
                            ),
                            child: const Text(
                              'ขายแล้ว',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Info Section
            Expanded(
              flex: 8,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          productName,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.prompt(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.storefront,
                                color: Colors.white38, size: 10,),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                product['shopName'] ??
                                    product['sellerName'] ??
                                    'ร้านค้าทั่วไป',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.kanit(
                                  color: Colors.white38,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(bottom: 2),
                          child: Text(
                            '฿',
                            style: TextStyle(
                              color: Color(0xFFEAB308),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 2),
                        if (product['type'] == 'service')
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4, right: 4),
                            child: Text(
                              'เริ่มต้น',
                              style: GoogleFonts.kanit(
                                color: Colors.white60,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        Expanded(
                          child: Text(
                            price,
                            style: GoogleFonts.oswald(
                              color: const Color(0xFFEAB308),
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
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
}
