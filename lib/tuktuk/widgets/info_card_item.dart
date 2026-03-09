import 'dart:ui';

import 'package:animate_do/animate_do.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../screens/marketplace_screen.dart';

class InfoCardItem extends StatefulWidget {
  final Map<String, dynamic> data;
  final bool isActive;
  final bool isAutoScrollEnabled;
  final VoidCallback? onTimerEnd;
  final Position? userPosition;

  const InfoCardItem({
    super.key,
    required this.data,
    required this.isActive,
    this.isAutoScrollEnabled = false,
    this.onTimerEnd,
    this.userPosition,
  });

  @override
  State<InfoCardItem> createState() => _InfoCardItemState();
}

class _InfoCardItemState extends State<InfoCardItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  bool _isPaused = false;
  bool isBookmarked = false;

  @override
  void initState() {
    super.initState();
    _checkBookmarkStatus();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 15), // Auto-scroll time
    );

    if (widget.isActive && widget.isAutoScrollEnabled) {
      _startCountdown();
    }
  }

  void _startCountdown() {
    if (_isPaused) return;
    _progressController.reset();
    _progressController.forward().then((_) {
      if (mounted && widget.isActive && !_isPaused) {
        widget.onTimerEnd?.call();
      }
    });
  }

  @override
  void didUpdateWidget(InfoCardItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      if (widget.isAutoScrollEnabled) {
        _startCountdown();
      }
    } else if (!widget.isActive && oldWidget.isActive) {
      _progressController.stop();
      _progressController.reset();
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  Future<void> _checkBookmarkStatus() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    // Check if this news ID exists in user's saved collection
    try {
      final docId =
          widget.data['id'] ?? widget.data['title'].hashCode.toString();
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('saved_news')
          .doc(docId)
          .get();

      if (mounted) {
        setState(() {
          isBookmarked = doc.exists;
        });
      }
    } catch (e) {
      if (e.toString().contains('permission-denied')) {
        debugPrint(
            'Bookmark status: Permission denied for current user. UI will show unbookmarked state.',);
      } else {
        debugPrint('Error checking bookmark: $e');
      }
    }
  }

  Future<void> _toggleBookmark() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กรุณาเข้าสู่ระบบเพื่อบันทึกข่าว')),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    final docId = widget.data['id'] ?? widget.data['title'].hashCode.toString();
    final userNewsRef = FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('saved_news')
        .doc(docId);

    setState(() {
      isBookmarked = !isBookmarked;
    });

    try {
      if (isBookmarked) {
        // Save COPY of news to user's collection (Permanent Retention)
        await userNewsRef.set({
          ...widget.data,
          'savedAt': FieldValue.serverTimestamp(),
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('บันทึกข่าวลงคลังส่วนตัวแล้ว 📚')),
          );
        }
      } else {
        await userNewsRef.delete();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('ลบข่าวออกจากคลังแล้ว')),
          );
        }
      }
    } catch (e) {
      // Revert if failed
      if (mounted) setState(() => isBookmarked = !isBookmarked);
      debugPrint('Bookmark error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final String title = widget.data['title'] ?? 'หัวข้อข่าวสาร';
    final String imageUrl = widget.data['imageUrl'] ??
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000';
    final String source = widget.data['source'] ?? 'Google Feed';
    final String summary =
        widget.data['summary'] ?? 'สรุปเนื้อหาข่าวสารที่น่าสนใจประจำวัน...';

    return GestureDetector(
      onLongPressStart: (_) {
        setState(() => _isPaused = true);
        _progressController.stop();
      },
      onLongPressEnd: (_) {
        setState(() => _isPaused = false);
        if (widget.isActive && widget.isAutoScrollEnabled) {
          _progressController.forward();
        }
      },
      child: Stack(
        children: [
          // 🖼️ 1. Background Layer (Blurred context)
          Positioned.fill(
            child: Stack(
              children: [
                (imageUrl.startsWith('assets/') || !imageUrl.startsWith('http'))
                    ? Image.asset(
                        imageUrl.isEmpty ? 'assets/images/logo.png' : imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Container(color: const Color(0xFF0D0D0D)),
                      )
                    : Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Container(color: const Color(0xFF0D0D0D)),
                      ),
                // Blur Effect
                Positioned.fill(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 📝 2. Main Content Card
          Center(
            child: FadeInUp(
              duration: const Duration(milliseconds: 800),
              child: Container(
                width: MediaQuery.of(context).size.width * 0.9,
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.75,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B).withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                      color: Colors.white.withValues(alpha: 0.1), width: 1.5,),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 30,
                      offset: const Offset(0, 15),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Top Image Section
                    Stack(
                      children: [
                        SizedBox(
                          height: 220,
                          width: double.infinity,
                          child: (imageUrl.startsWith('assets/') ||
                                  !imageUrl.startsWith('http'))
                              ? Image.asset(
                                  imageUrl.isEmpty
                                      ? 'assets/images/logo.png'
                                      : imageUrl,
                                  fit: BoxFit.cover,
                                )
                              : Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                ),
                        ),
                        // Trending Badge
                        Positioned(
                          top: 20,
                          left: 20,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6,),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFF5F00),
                                  borderRadius: BorderRadius.circular(10),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFFFF5F00)
                                          .withValues(alpha: 0.5),
                                      blurRadius: 10,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                                child: Text(
                                  'TRENDING NOW',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                        // Bookmark Button
                        Positioned(
                          top: 10,
                          right: 10,
                          child: IconButton(
                            onPressed: _toggleBookmark,
                            icon: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.4),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isBookmarked
                                    ? Icons.bookmark
                                    : Icons.bookmark_border,
                                color: isBookmarked
                                    ? Colors.orangeAccent
                                    : Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Content Section
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Source Line
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: source.toLowerCase().contains('google')
                                      ? Colors.orange
                                      : Colors.blue,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                source.toUpperCase(),
                                style: GoogleFonts.inter(
                                  color: Colors.white60,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.5,
                                ),
                              ),
                              if (widget.data['isVerified'] == true) ...[
                                const SizedBox(width: 8),
                                const Icon(Icons.verified,
                                    color: Colors.blueAccent, size: 14,),
                              ],
                            ],
                          ),
                          const SizedBox(height: 15),

                          // Headline
                          Text(
                            title,
                            style: GoogleFonts.kanit(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              height: 1.25,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 12),

                          // Summary
                          Text(
                            summary,
                            style: GoogleFonts.kanit(
                              color: Colors.white70,
                              fontSize: 15,
                              height: 1.5,
                            ),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),

                          const SizedBox(height: 25),

                          // Action Button
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.mediumImpact();
                              _showAISummarySheet(context);
                            },
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: widget.data['isVerified'] == true
                                      ? [
                                          const Color(0xFF6366F1),
                                          const Color(0xFF8B5CF6),
                                        ]
                                      : [
                                          const Color(0xFF475569),
                                          const Color(0xFF64748B),
                                        ],
                                ),
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: (widget.data['isVerified'] == true
                                            ? const Color(0xFF6366F1)
                                            : Colors.black)
                                        .withValues(alpha: 0.3),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                      widget.data['isVerified'] == true
                                          ? Icons.auto_awesome
                                          : Icons.article_outlined,
                                      color: Colors.white,
                                      size: 18,),
                                  const SizedBox(width: 12),
                                  Text(
                                    widget.data['isVerified'] == true
                                        ? 'ดูสรุปและวิเคราะห์ AI'
                                        : 'ดูรายละเอียดข่าว',
                                    style: GoogleFonts.kanit(
                                      color: Colors.white,
                                      fontSize: 16,
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
                  ],
                ),
              ),
            ),
          ),

          // ⏳ Progress Bar (Auto-scroll visualizer)
          if (widget.isActive && widget.isAutoScrollEnabled)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
                  child: AnimatedBuilder(
                    animation: _progressController,
                    builder: (context, child) => LinearProgressIndicator(
                      value: _progressController.value,
                      backgroundColor: Colors.white12,
                      valueColor:
                          const AlwaysStoppedAnimation<Color>(Colors.orange),
                      minHeight: 2,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showAISummarySheet(BuildContext context) {
    HapticFeedback.heavyImpact();
    final List<dynamic> points = widget.data['summaryPoints'] ?? [];

    // ✨ Fallback Detection: Check if this is a raw news item awaiting AI
    final bool isFallback =
        points.any((p) => p.toString().contains('รอการตรวจสอบ'));
    final List<dynamic> displayPoints = isFallback
        ? [
            '⏳ ระบบกำลังวิเคราะห์เนื้อหาเชิงลึก...',
            '📰 คุณสามารถอ่านข่าวต้นฉบับได้ที่ปุ่มด้านล่าง',
            '🤖 AI จะกลับมาสรุปให้อีกครั้งในภายหลัง',
          ]
        : (points.isEmpty ? ['ไม่มีข้อมูลสรุป'] : points);

    // 🧠 Smart Action Logic
    final String? targetCategory = widget.data['targetCategory'];
    final String? sourceUrl = widget.data['sourceUrl'];

    // Determine if we should go to marketplace or external link
    final bool hasMarketplaceLink =
        targetCategory != null && targetCategory.isNotEmpty;
    final bool canLaunchSource = sourceUrl != null && sourceUrl.isNotEmpty;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF121212),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
          border: Border(top: BorderSide(color: Color(0xFF333333), width: 1)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 25),

            // News Headline (Always show in detail)
            Text(
              widget.data['title'] ?? '',
              style: GoogleFonts.kanit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'แหล่งข่าว: ${widget.data['source'] ?? 'ไม่ระบุ'}',
              style: GoogleFonts.kanit(
                fontSize: 14,
                color: Colors.orangeAccent,
              ),
            ),
            const SizedBox(height: 15),
            const Divider(color: Colors.white12),
            const SizedBox(height: 15),

            Row(
              children: [
                Spin(
                  infinite: !isFallback,
                  duration: const Duration(seconds: 3),
                  child: Icon(
                      isFallback ? Icons.hourglass_top : Icons.auto_awesome,
                      color:
                          isFallback ? Colors.orange : const Color(0xFFBB86FC),
                      size: 24,),
                ),
                const SizedBox(width: 12),
                Text(
                  isFallback
                      ? 'วิเคราะห์ AI กำลังดำเนินการ'
                      : 'บทสรุปโดย AI Gemini',
                  style: GoogleFonts.kanit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Expanded(
              child: ListView.builder(
                itemCount: displayPoints.length,
                itemBuilder: (context, index) => FadeInLeft(
                  delay: Duration(milliseconds: 100 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('•',
                            style:
                                TextStyle(color: Colors.orange, fontSize: 20),),
                        const SizedBox(width: 15),
                        Expanded(
                          child: Text(
                            displayPoints[index].toString(),
                            style: GoogleFonts.kanit(
                              fontSize: 16,
                              color: Colors.white.withValues(alpha: 0.9),
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            if (!isFallback || hasMarketplaceLink)
              FadeInUp(
                delay: const Duration(milliseconds: 500),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context);

                      if (hasMarketplaceLink) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MarketplaceScreen(
                              initialCategory: targetCategory,
                              initialSearchQuery: widget.data['title'],
                            ),
                          ),
                        );
                      } else if (canLaunchSource) {
                        final Uri url = Uri.parse(sourceUrl);
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url,
                              mode: LaunchMode.externalApplication,);
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text('ไม่สามารถเปิดลิงก์ได้'),),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: hasMarketplaceLink
                          ? Colors.orange[800]
                          : Colors.blue[700],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                      elevation: 5,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          hasMarketplaceLink
                              ? Icons.shopping_cart
                              : Icons.launch,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          hasMarketplaceLink
                              ? 'ดูสินค้าที่เกี่ยวข้อง'
                              : 'อ่านข่าวจากต้นฉบับ',
                          style: GoogleFonts.kanit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 20),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
