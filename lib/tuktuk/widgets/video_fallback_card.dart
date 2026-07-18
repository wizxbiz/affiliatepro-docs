// VideoFallbackCard
// Shown in-feed when a social video (YouTube / TikTok / Facebook) fails to load.
// Fetches a random active marketplace product (or verified news as fallback)
// and presents it as "สินค้าแนะนำ" so the feed slot stays useful.
import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class VideoFallbackCard extends StatefulWidget {
  final String failedUrl;
  final String mediaType; // 'video' or 'image'
  final VoidCallback? onRetry;

  const VideoFallbackCard({
    super.key,
    required this.failedUrl,
    this.mediaType = 'video',
    this.onRetry,
  });

  @override
  State<VideoFallbackCard> createState() => _VideoFallbackCardState();
}

class _VideoFallbackCardState extends State<VideoFallbackCard> {
  Map<String, dynamic>? _item;
  bool _isProduct = true;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      // 1. Try marketplace_items first
      final snap = await FirebaseFirestore.instance
          .collection('marketplace_items')
          .where('status', isEqualTo: 'active')
          .orderBy('createdAt', descending: true)
          .limit(20)
          .get();

      if (snap.docs.isNotEmpty) {
        final docs = List.from(snap.docs)..shuffle(Random());
        if (mounted) {
          setState(() {
            _item = {
              'id': docs.first.id,
              ...docs.first.data() as Map<String, dynamic>
            };
            _isProduct = true;
            _loading = false;
          });
        }
        return;
      }

      // 2. Fallback: verified_news
      final news = await FirebaseFirestore.instance
          .collection('verified_news')
          .orderBy('publishedAt', descending: true)
          .limit(10)
          .get();

      if (news.docs.isNotEmpty && mounted) {
        final docs = List.from(news.docs)..shuffle(Random());
        setState(() {
          _item = docs.first.data() as Map<String, dynamic>;
          _isProduct = false;
          _loading = false;
        });
      } else if (mounted) {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  // domain label extracted from the failed URL
  String get _domain {
    try {
      return Uri.parse(widget.failedUrl).host.replaceFirst('www.', '');
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildErrorBanner(),
          const SizedBox(height: 20),
          if (_loading)
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                color: Color(0xFF00C4CC),
                strokeWidth: 2,
              ),
            )
          else if (_item != null) ...[
            Text(
              _isProduct ? 'สินค้าแนะนำสำหรับคุณ' : 'ข่าวแนะนำ',
              style: GoogleFonts.kanit(
                color: Colors.white60,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 10),
            _isProduct ? _buildProductCard() : _buildNewsCard(),
          ] else
            Text(
              'ไม่มีเนื้อหาแนะนำในขณะนี้',
              style: GoogleFonts.kanit(color: Colors.white38, fontSize: 12),
            ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.broken_image_outlined,
            color: Colors.white38,
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _domain.isNotEmpty
                  ? 'โหลด${widget.mediaType == 'video' ? 'วิดีโอ' : 'รูปภาพ'}จาก $_domain ไม่สำเร็จ'
                  : 'โหลด${widget.mediaType == 'video' ? 'วิดีโอ' : 'รูปภาพ'}ไม่สำเร็จ',
              style: GoogleFonts.kanit(color: Colors.white54, fontSize: 11),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (widget.onRetry != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: widget.onRetry,
              child: Text(
                'ลองใหม่',
                style: GoogleFonts.kanit(
                  color: const Color(0xFF00C4CC),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProductCard() {
    final s = _item!;
    final imageUrl = _resolveImage(s);
    final name = s['productName'] ?? s['title'] ?? 'สินค้า';
    final rawPrice = s['price'];
    final price = rawPrice is num
        ? rawPrice.toInt().toString()
        : rawPrice?.toString() ?? '0';
    final sellerName = s['sellerName'] ?? s['shopName'] ?? '';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFF1a1a2e), Color(0xFF0d1b2a)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: const Color(0xFF00C4CC).withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              bottomLeft: Radius.circular(16),
            ),
            child: imageUrl != null
                ? CachedNetworkImage(
                    imageUrl: imageUrl,
                    width: 96,
                    height: 96,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => _placeholderBox(),
                  )
                : _placeholderBox(),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '฿$price',
                    style: GoogleFonts.kanit(
                      color: const Color(0xFF00C4CC),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (sellerName.isNotEmpty)
                    Text(
                      sellerName,
                      style: GoogleFonts.kanit(
                        color: Colors.white38,
                        fontSize: 10,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF00C4CC),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'ดูสินค้า',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNewsCard() {
    final s = _item!;
    final title = s['title'] ?? 'ข่าวสาร';
    final imageUrl = s['imageUrl'] ?? s['thumbnailUrl'];
    final source = s['source'] ?? s['sourceName'] ?? '';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white.withValues(alpha: 0.07),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          if (imageUrl != null)
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                width: 86,
                height: 86,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) =>
                    _placeholderBox(icon: Icons.article_rounded),
              ),
            ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (source.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      source,
                      style: GoogleFonts.kanit(
                        color: Colors.white38,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholderBox({IconData icon = Icons.shopping_bag_rounded}) {
    return Container(
      width: 96,
      height: 96,
      color: Colors.white10,
      child: Icon(icon, color: Colors.white24, size: 32),
    );
  }

  String? _resolveImage(Map<String, dynamic> data) {
    final direct = data['imageUrl']?.toString() ??
        data['thumbnailUrl']?.toString() ??
        data['thumb']?.toString();
    if (direct != null && direct.isNotEmpty) return direct;
    final images = data['images'];
    if (images is List && images.isNotEmpty) {
      final first = images.first;
      if (first is Map) return first['url']?.toString();
      if (first is String) return first;
    }
    return null;
  }
}
