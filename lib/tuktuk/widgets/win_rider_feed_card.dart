import 'dart:ui';

import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WinRiderPromoCard  ← Injected once into the feed as a registration CTA
// ─────────────────────────────────────────────────────────────────────────────
class WinRiderPromoCard extends StatefulWidget {
  final VoidCallback? onRegisterTap;
  const WinRiderPromoCard({super.key, this.onRegisterTap});

  @override
  State<WinRiderPromoCard> createState() => _WinRiderPromoCardState();
}

class _WinRiderPromoCardState extends State<WinRiderPromoCard>
    with TickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late AnimationController _floatCtrl;
  late Animation<double> _pulseAnim;
  late Animation<double> _floatAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _floatCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _pulseAnim = Tween<double>(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );

    _floatAnim = Tween<double>(begin: -8.0, end: 8.0).animate(
      CurvedAnimation(parent: _floatCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _floatCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0A0A1A),
            Color(0xFF0D1B2A),
            Color(0xFF1A0A2E),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Background glow orbs
          Positioned(
            top: -60,
            left: -40,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF6C3FFF).withValues(alpha: 0.25),
                  Colors.transparent,
                ],),
              ),
            ),
          ),
          Positioned(
            bottom: -40,
            right: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF00D2FF).withValues(alpha: 0.15),
                  Colors.transparent,
                ],),
              ),
            ),
          ),

          // Main content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Floating tuktuk icon
                  AnimatedBuilder(
                    animation: _floatAnim,
                    builder: (ctx, child) => Transform.translate(
                      offset: Offset(0, _floatAnim.value),
                      child: child,
                    ),
                    child: AnimatedBuilder(
                      animation: _pulseAnim,
                      builder: (ctx, child) => Transform.scale(
                        scale: _pulseAnim.value,
                        child: child,
                      ),
                      child: Container(
                        width: 110,
                        height: 110,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6C3FFF), Color(0xFF00D2FF)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6C3FFF).withValues(alpha: 0.5),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text('🛺', style: TextStyle(fontSize: 52)),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      color: const Color(0xFF6C3FFF).withValues(alpha: 0.2),
                      border: Border.all(
                          color: const Color(0xFF6C3FFF).withValues(alpha: 0.5),),
                    ),
                    child: Text(
                      '🏍️ WIN RIDER PROGRAM',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF9D7FFF),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Title
                  FadeInDown(
                    child: Text(
                      'สมัครเป็น\nWin Rider',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontSize: 40,
                        fontWeight: FontWeight.w800,
                        height: 1.1,
                        shadows: [
                          Shadow(
                            color: const Color(0xFF6C3FFF).withValues(alpha: 0.8),
                            blurRadius: 20,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  Text(
                    'รับงานส่งพัสดุ — ออนไลน์เมื่อไหร่ก็ได้\nสร้างรายได้ตามใจคุณ 24/7',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.kanit(
                      color: Colors.white60,
                      fontSize: 16,
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Benefits chips
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _chip('💰 รายได้ทุกวัน', const Color(0xFF10B981)),
                      _chip('🗺️ งานใกล้บ้าน', const Color(0xFF3B82F6)),
                      _chip('⏰ เลือกเวลาเอง', const Color(0xFFF59E0B)),
                      _chip('🔒 ปลอดภัย 100%', const Color(0xFF8B5CF6)),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // CTA Button
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      widget.onRegisterTap?.call();
                    },
                    child: AnimatedBuilder(
                      animation: _pulseAnim,
                      builder: (ctx, child) => Transform.scale(
                        scale: 0.98 + (_pulseAnim.value - 1.0) * 0.5,
                        child: child,
                      ),
                      child: Container(
                        width: double.infinity,
                        height: 58,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6C3FFF), Color(0xFF00D2FF)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6C3FFF).withValues(alpha: 0.4),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.electric_moped_rounded,
                                color: Colors.white, size: 22,),
                            const SizedBox(width: 10),
                            Text(
                              'สมัคร Win Rider เลย!',
                              style: GoogleFonts.kanit(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Skip hint
                  const Text(
                    'ปัดขึ้นเพื่อข้ามหรือดูเนื้อหาต่อ',
                    style: TextStyle(color: Colors.white30, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: color.withValues(alpha: 0.15),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: GoogleFonts.kanit(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RiderJobFeedCard  ← Shows a live pending job from win_rider_requests
// ─────────────────────────────────────────────────────────────────────────────
class RiderJobFeedCard extends StatefulWidget {
  final Map<String, dynamic> jobData;
  final String? currentRiderId;
  final VoidCallback? onAccept;
  final VoidCallback? onPass;

  const RiderJobFeedCard({
    super.key,
    required this.jobData,
    this.currentRiderId,
    this.onAccept,
    this.onPass,
  });

  @override
  State<RiderJobFeedCard> createState() => _RiderJobFeedCardState();
}

class _RiderJobFeedCardState extends State<RiderJobFeedCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _glowCtrl;
  late Animation<double> _glowAnim;
  bool _isExpanded = false;

  static const _statusColors = {
    'pending': Color(0xFFF59E0B),
    'accepted': Color(0xFF10B981),
    'in_progress': Color(0xFF3B82F6),
    'completed': Color(0xFF6B7280),
    'cancelled': Color(0xFFEF4444),
  };

  @override
  void initState() {
    super.initState();
    _glowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _glowAnim = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _glowCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _glowCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final job = widget.jobData;
    final status = job['status'] ?? 'pending';
    final isPending = status == 'pending';
    final from = job['pickupAddress'] ?? job['from'] ?? 'ต้นทาง';
    final to = job['dropoffAddress'] ?? job['to'] ?? 'ปลายทาง';
    final price = job['estimatedPrice'] ?? job['price'] ?? '—';
    final weight = job['weightKg']?.toString();
    final isExpress = job['isExpress'] == true;
    final customerName = job['customerName'] ?? job['requesterName'] ?? '';
    final customerPic = job['customerPhotoURL'] ?? job['userPic'] ?? '';
    final productName = job['productName'] ?? job['description'] ?? '';
    final distance = job['distanceKm']?.toString();
    final Color statusColor = _statusColors[status] ?? const Color(0xFFF59E0B);

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF0A0F1E),
            Color(0xFF0D1B2A),
            Color(0xFF0A0F1E),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Animated glow at top for pending
          if (isPending)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              child: AnimatedBuilder(
                animation: _glowAnim,
                builder: (ctx, _) => Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        statusColor.withValues(alpha: _glowAnim.value),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Header Row ───────────────────────────────────────────
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 5,),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          color: statusColor.withValues(alpha: 0.15),
                          border: Border.all(
                              color: statusColor.withValues(alpha: 0.5), width: 1,),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: statusColor,
                                boxShadow: [
                                  BoxShadow(
                                      color: statusColor,
                                      blurRadius: 6,
                                      spreadRadius: 1,),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _statusLabel(status),
                              style: GoogleFonts.outfit(
                                color: statusColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      if (isExpress)
                        Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4,),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: const LinearGradient(
                              colors: [Color(0xFFEF4444), Color(0xFFF97316)],
                            ),
                          ),
                          child: Text('⚡ EXPRESS',
                              style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,),),
                        ),
                      if (distance != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4,),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: Colors.white.withValues(alpha: 0.06),
                            border: Border.all(color: Colors.white12),
                          ),
                          child: Text('📍 $distance กม.',
                              style: const TextStyle(
                                  color: Colors.white70, fontSize: 11,),),
                        ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ── Customer info ─────────────────────────────────────────
                  if (customerName.isNotEmpty)
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundImage: customerPic.isNotEmpty &&
                                  customerPic.startsWith('http')
                              ? CachedNetworkImageProvider(customerPic)
                              : null,
                          backgroundColor: Colors.white12,
                          child: customerPic.isEmpty ||
                                  !customerPic.startsWith('http')
                              ? const Icon(Icons.person,
                                  color: Colors.white54, size: 20,)
                              : null,
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(customerName,
                                style: GoogleFonts.kanit(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,),),
                            if (productName.isNotEmpty)
                              Text('📦 $productName',
                                  style: const TextStyle(
                                      color: Colors.white54, fontSize: 12,),),
                          ],
                        ),
                      ],
                    ),

                  const SizedBox(height: 20),

                  // ── Route Card ────────────────────────────────────────────
                  FadeInUp(
                    duration: const Duration(milliseconds: 400),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.1),),
                          ),
                          child: Column(
                            children: [
                              _routeRow(
                                icon: Icons.circle,
                                iconColor: const Color(0xFF10B981),
                                label: 'รับพัสดุ',
                                address: from,
                              ),
                              Padding(
                                padding: const EdgeInsets.only(
                                    left: 11, top: 4, bottom: 4,),
                                child: Container(
                                  width: 2,
                                  height: 30,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        const Color(0xFF10B981)
                                            .withValues(alpha: 0.7),
                                        const Color(0xFFEF4444)
                                            .withValues(alpha: 0.7),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              _routeRow(
                                icon: Icons.location_on,
                                iconColor: const Color(0xFFEF4444),
                                label: 'จัดส่งถึง',
                                address: to,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Price & Meta ──────────────────────────────────────────
                  Row(
                    children: [
                      // Price chip
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10,),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF10B981), Color(0xFF059669)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF10B981).withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text('฿',
                                style: TextStyle(
                                    color: Colors.white70, fontSize: 14,),),
                            const SizedBox(width: 4),
                            Text(
                              price.toString(),
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      if (weight != null)
                        _metaChip('⚖️ ${weight}kg', Colors.blue),
                      const Spacer(),
                      // Expand bonus info toggle
                      GestureDetector(
                        onTap: () => setState(() => _isExpanded = !_isExpanded),
                        child: Icon(
                          _isExpanded
                              ? Icons.keyboard_arrow_up_rounded
                              : Icons.keyboard_arrow_down_rounded,
                          color: Colors.white38,
                          size: 28,
                        ),
                      ),
                    ],
                  ),

                  // ── Expanded bonus info ───────────────────────────────────
                  AnimatedCrossFade(
                    crossFadeState: _isExpanded
                        ? CrossFadeState.showSecond
                        : CrossFadeState.showFirst,
                    duration: const Duration(milliseconds: 300),
                    firstChild: const SizedBox.shrink(),
                    secondChild: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          color: Colors.white.withValues(alpha: 0.04),
                          child: Column(
                            children: [
                              _infoRow('หมายเหตุ',
                                  job['note'] ?? job['remark'] ?? 'ไม่มี',),
                              if (job['createdAt'] != null)
                                _infoRow(
                                    'เวลาสั่ง', _formatTime(job['createdAt']),),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  const Spacer(),

                  // ── Action Buttons ────────────────────────────────────────
                  if (isPending) ...[
                    Row(
                      children: [
                        // Pass
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              widget.onPass?.call();
                            },
                            child: Container(
                              height: 54,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                color: Colors.white.withValues(alpha: 0.08),
                                border: Border.all(color: Colors.white12),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.close_rounded,
                                      color: Colors.white54, size: 20,),
                                  const SizedBox(width: 6),
                                  Text('ข้ามงานนี้',
                                      style: GoogleFonts.kanit(
                                          color: Colors.white54, fontSize: 15,),),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Accept
                        Expanded(
                          flex: 2,
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.mediumImpact();
                              widget.onAccept?.call();
                            },
                            child: Container(
                              height: 54,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0xFF10B981),
                                    Color(0xFF059669),
                                  ],
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF10B981)
                                        .withValues(alpha: 0.4),
                                    blurRadius: 14,
                                    offset: const Offset(0, 6),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.check_circle_rounded,
                                      color: Colors.white, size: 20,),
                                  const SizedBox(width: 8),
                                  Text('รับงานนี้',
                                      style: GoogleFonts.kanit(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    // Non-pending: show status + optional detail
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: statusColor.withValues(alpha: 0.1),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(_statusIcon(status),
                              color: statusColor, size: 20,),
                          const SizedBox(width: 8),
                          Text(_statusLabel(status),
                              style: GoogleFonts.kanit(
                                  color: statusColor,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,),),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _routeRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String address,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, color: iconColor, size: 14),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(
                    color: iconColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,),),
            Text(
              address.length > 45 ? '${address.substring(0, 42)}...' : address,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ],
        ),
      ],
    );
  }

  Widget _metaChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w600,),),
    );
  }

  Widget _infoRow(String key, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$key: ',
              style: const TextStyle(color: Colors.white54, fontSize: 12),),
          Expanded(
            child: Text(value,
                style: const TextStyle(color: Colors.white70, fontSize: 12),),
          ),
        ],
      ),
    );
  }

  String _statusLabel(String s) {
    switch (s) {
      case 'pending':
        return 'รอรับงาน';
      case 'accepted':
        return 'รับงานแล้ว';
      case 'in_progress':
        return 'กำลังส่ง';
      case 'completed':
        return 'สำเร็จ';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return s;
    }
  }

  IconData _statusIcon(String s) {
    switch (s) {
      case 'accepted':
        return Icons.check_circle_outline;
      case 'in_progress':
        return Icons.local_shipping_outlined;
      case 'completed':
        return Icons.verified_outlined;
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.pending_outlined;
    }
  }

  String _formatTime(dynamic ts) {
    try {
      if (ts == null) return '';
      DateTime dt;
      if (ts is DateTime) {
        dt = ts;
      } else {
        // Firestore Timestamp
        dt = (ts as dynamic).toDate() as DateTime;
      }
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m น.';
    } catch (_) {
      return '';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WinRiderAvailableCard  ← Full-screen card shown to CUSTOMERS
//   Displays a specific online rider: photo, name, plate, rating, services
//   "เรียกวิน" button opens the booking bottom sheet
// ─────────────────────────────────────────────────────────────────────────────
class WinRiderAvailableCard extends StatefulWidget {
  final Map<String, dynamic> riderData;
  final Map<String, dynamic>? currentUser; // logged-in customer info

  const WinRiderAvailableCard({
    super.key,
    required this.riderData,
    this.currentUser,
  });

  @override
  State<WinRiderAvailableCard> createState() => _WinRiderAvailableCardState();
}

class _WinRiderAvailableCardState extends State<WinRiderAvailableCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _pingCtrl;
  late Animation<double> _pingAnim;

  @override
  void initState() {
    super.initState();
    _pingCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _pingAnim = Tween<double>(begin: 0.5, end: 1.4).animate(
      CurvedAnimation(parent: _pingCtrl, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _pingCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.riderData;
    final name = r['name'] ?? r['fullName'] ?? 'วินไรเดอร์';
    final plate = r['plate'] ?? r['vehiclePlate'] ?? '-';
    final area = r['area'] ?? r['serviceArea'] ?? '-';
    final rating = (r['rating'] ?? 5.0).toDouble();
    final trips = r['totalTrips'] ?? r['tripCount'] ?? 0;
    final basePrice = r['basePrice'] ?? r['price'] ?? 25;
    final photo = r['photoUrl'] ?? r['photoURL'] ?? '';
    final vehicleType = r['vehicleType'] ?? 'motorcycle';
    final services = List<String>.from(r['services'] ?? ['delivery']);
    final phone = r['phone'] ?? '';
    final isOnline = r['isOnline'] == true;

    final serviceIcons = {
      'delivery': '📦',
      'passenger': '🧑',
      'express': '⚡',
      'heavy': '🏋️',
    };

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF050A14), Color(0xFF0B1628), Color(0xFF050A14)],
        ),
      ),
      child: Stack(
        children: [
          // Glow background
          Positioned(
            top: -80,
            right: -60,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF00D2FF).withValues(alpha: 0.12),
                  Colors.transparent,
                ],),
              ),
            ),
          ),

          SafeArea(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                children: [
                  // ── WIN RIDER badge ─────────────────────────────────────
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 5,),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          color: const Color(0xFF00D2FF).withValues(alpha: 0.12),
                          border: Border.all(
                              color: const Color(0xFF00D2FF).withValues(alpha: 0.35),),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Live ping dot
                            AnimatedBuilder(
                              animation: _pingAnim,
                              builder: (_, __) => Stack(
                                alignment: Alignment.center,
                                children: [
                                  Container(
                                    width: 16 * _pingAnim.value,
                                    height: 16 * _pingAnim.value,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: const Color(0xFF00E676)
                                          .withValues(alpha: 
                                              1.4 - _pingAnim.value,),
                                    ),
                                  ),
                                  const CircleAvatar(
                                    radius: 4,
                                    backgroundColor: Color(0xFF00E676),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'WIN RIDER — พร้อมรับงาน',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF00D2FF),
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      _vehicleChip(vehicleType),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // ── Rider profile ────────────────────────────────────────
                  Row(
                    children: [
                      // Avatar with online ring
                      Stack(
                        children: [
                          Container(
                            width: 88,
                            height: 88,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFF00D2FF), Color(0xFF6C3FFF)],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF00D2FF)
                                      .withValues(alpha: 0.35),
                                  blurRadius: 20,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(3),
                              child: ClipOval(
                                child: photo.isNotEmpty
                                    ? CachedNetworkImage(
                                        imageUrl: photo,
                                        fit: BoxFit.cover,
                                        errorWidget: (_, __, ___) =>
                                            _defaultAvatar(name),
                                      )
                                    : _defaultAvatar(name),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 4,
                            right: 4,
                            child: Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isOnline
                                    ? const Color(0xFF00E676)
                                    : Colors.grey,
                                border:
                                    Border.all(color: Colors.black, width: 2),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(width: 20),

                      // Name + plate + area
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: GoogleFonts.kanit(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.two_wheeler_rounded,
                                    color: Color(0xFF00D2FF), size: 14,),
                                const SizedBox(width: 4),
                                Text(
                                  plate,
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF00D2FF),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.location_on,
                                    color: Colors.white38, size: 13,),
                                const SizedBox(width: 3),
                                Flexible(
                                  child: Text(
                                    area,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        color: Colors.white54, fontSize: 12,),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ── Stats Row ────────────────────────────────────────────
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 14,),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _statCol('⭐', rating.toStringAsFixed(1),
                                'คะแนน',),
                            _divider(),
                            _statCol('🏍️', trips.toString(), 'งาน'),
                            _divider(),
                            _statCol('฿', '$basePrice+', 'เริ่มต้น'),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Services ─────────────────────────────────────────────
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: services
                        .map((s) => _serviceChip(
                            '${serviceIcons[s] ?? '🔧'} ${_serviceLabel(s)}',),)
                        .toList(),
                  ),

                  const Spacer(),

                  // ── Action buttons ───────────────────────────────────────
                  Row(
                    children: [
                      // Phone call
                      if (phone.isNotEmpty)
                        GestureDetector(
                          onTap: () => launchUrl(Uri.parse('tel:$phone')),
                          child: Container(
                            width: 54,
                            height: 54,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              color: Colors.white.withValues(alpha: 0.07),
                              border: Border.all(color: Colors.white12),
                            ),
                            child: const Icon(Icons.call_rounded,
                                color: Color(0xFF00E676), size: 24,),
                          ),
                        ),
                      if (phone.isNotEmpty) const SizedBox(width: 10),

                      // Book NOW
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.mediumImpact();
                            showWinRiderBookingSheet(
                              context,
                              riderData: widget.riderData,
                              currentUser: widget.currentUser,
                            );
                          },
                          child: Container(
                            height: 54,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: const LinearGradient(
                                colors: [Color(0xFF00D2FF), Color(0xFF0088AA)],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      const Color(0xFF00D2FF).withValues(alpha: 0.35),
                                  blurRadius: 18,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.electric_moped_rounded,
                                    color: Colors.black, size: 22,),
                                const SizedBox(width: 8),
                                Text(
                                  'เรียกวิน — ฿$basePrice+',
                                  style: GoogleFonts.kanit(
                                    color: Colors.black,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  const Text(
                    'ปัดขึ้นเพื่อดูวินคนถัดไป',
                    style:
                        TextStyle(color: Colors.white24, fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _defaultAvatar(String name) {
    return Container(
      color: const Color(0xFF1A2240),
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: GoogleFonts.kanit(
              color: Colors.white, fontSize: 28, fontWeight: FontWeight.w700,),
        ),
      ),
    );
  }

  Widget _vehicleChip(String type) {
    final map = {
      'motorcycle': ('🏍️', 'มอไซค์'),
      'bicycle': ('🚲', 'จักรยาน'),
      'scooter': ('🛵', 'สกู๊ตเตอร์'),
      'pickup': ('🛻', 'กระบะ'),
    };
    final (icon, label) = map[type] ?? ('🏍️', type);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: Colors.white.withValues(alpha: 0.06),
        border: Border.all(color: Colors.white12),
      ),
      child: Text('$icon $label',
          style: const TextStyle(color: Colors.white60, fontSize: 11),),
    );
  }

  Widget _statCol(String icon, String value, String label) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 18)),
        const SizedBox(height: 2),
        Text(value,
            style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w700,),),
        Text(label,
            style: const TextStyle(color: Colors.white38, fontSize: 10),),
      ],
    );
  }

  Widget _divider() => Container(
      width: 1, height: 36, color: Colors.white.withValues(alpha: 0.08),);

  Widget _serviceChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: const Color(0xFF00D2FF).withValues(alpha: 0.08),
        border:
            Border.all(color: const Color(0xFF00D2FF).withValues(alpha: 0.25)),
      ),
      child: Text(label,
          style: GoogleFonts.kanit(
              color: const Color(0xFF00D2FF),
              fontSize: 11,
              fontWeight: FontWeight.w500,),),
    );
  }

  String _serviceLabel(String s) {
    const m = {
      'delivery': 'รับส่งพัสดุ',
      'passenger': 'รับผู้โดยสาร',
      'express': 'Express ด่วน',
      'heavy': 'ของหนัก',
    };
    return m[s] ?? s;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// showWinRiderBookingSheet  ← Bottom sheet: customer fills pickup/delivery
// Writes to win_rider_requests and sends notification to selected rider
// ─────────────────────────────────────────────────────────────────────────────
Future<void> showWinRiderBookingSheet(
  BuildContext context, {
  required Map<String, dynamic> riderData,
  Map<String, dynamic>? currentUser,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _WinRiderBookingSheet(
      riderData: riderData,
      currentUser: currentUser,
    ),
  );
}

class _WinRiderBookingSheet extends StatefulWidget {
  final Map<String, dynamic> riderData;
  final Map<String, dynamic>? currentUser;

  const _WinRiderBookingSheet({
    required this.riderData,
    this.currentUser,
  });

  @override
  State<_WinRiderBookingSheet> createState() => _WinRiderBookingSheetState();
}

class _WinRiderBookingSheetState extends State<_WinRiderBookingSheet> {
  final _pickupCtrl = TextEditingController();
  final _deliveryCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _isExpress = false;
  bool _isSubmitting = false;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    // Pre-fill customer phone if available
    final phone = widget.currentUser?['phone'] ??
        widget.currentUser?['phoneNumber'] ?? '';
    _phoneCtrl.text = phone;
  }

  @override
  void dispose() {
    _pickupCtrl.dispose();
    _deliveryCtrl.dispose();
    _noteCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final pickup = _pickupCtrl.text.trim();
    final delivery = _deliveryCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    if (pickup.isEmpty || delivery.isEmpty) return;

    setState(() => _isSubmitting = true);

    try {
      final rider = widget.riderData;
      final user = widget.currentUser;
      final riderId = rider['lineUserId'] ?? rider['id'] ?? rider['userId'] ?? '';
      final requesterId = user?['lineUserId'] ?? user?['uid'] ?? '';

      // Write request doc
      final ref = await FirebaseFirestore.instance
          .collection('win_rider_requests')
          .add({
        'riderId': riderId,
        'riderName': rider['name'] ?? rider['fullName'] ?? '',
        'riderPhone': rider['phone'] ?? '',
        'riderPlate': rider['plate'] ?? '',
        'requesterId': requesterId,
        'requesterName':
            user?['displayName'] ?? user?['name'] ?? 'ลูกค้า',
        'requesterPhone': phone,
        'pickupAddress': pickup,
        'deliveryAddress': delivery,
        'note': _noteCtrl.text.trim(),
        'isExpress': _isExpress,
        'status': 'pending',
        'source': 'flutter_app',
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Notify rider
      if (riderId.isNotEmpty) {
        await FirebaseFirestore.instance.collection('notifications').add({
          'recipientId': riderId,
          'title': '⚡ มีงานใหม่! WIN RIDER',
          'message':
              '${user?['displayName'] ?? 'ลูกค้า'} ต้องการรับส่ง: $pickup → $delivery',
          'type': 'win_rider_request',
          'requestId': ref.id,
          'isRead': false,
          'createdAt': FieldValue.serverTimestamp(),
        });
      }

      if (mounted) setState(() => _submitted = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('ผิดพลาด: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rider = widget.riderData;
    final riderName = rider['name'] ?? rider['fullName'] ?? 'วินไรเดอร์';
    final plate = rider['plate'] ?? '';
    final basePrice = rider['basePrice'] ?? 25;

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0B1628),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: _submitted ? _buildSuccess(context) : _buildForm(context, riderName, plate, basePrice, scrollCtrl),
      ),
    );
  }

  Widget _buildForm(BuildContext ctx, String riderName, String plate, dynamic basePrice, ScrollController scrollCtrl) {
    return ListView(
      controller: scrollCtrl,
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 12,
        bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
      ),
      children: [
        // Handle
        Center(
          child: Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Header: rider info
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                gradient: const LinearGradient(
                  colors: [Color(0xFF00D2FF), Color(0xFF0088AA)],
                ),
              ),
              child: const Icon(Icons.electric_moped_rounded,
                  color: Colors.black, size: 24,),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('เรียกวิน — $riderName',
                    style: GoogleFonts.kanit(
                        color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700,),),
                Text('$plate  •  เริ่มต้น ฿$basePrice',
                    style: const TextStyle(color: Color(0xFF00D2FF), fontSize: 13),),
              ],
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Pickup
        _label('จุดรับพัสดุ / ต้นทาง *'),
        _field(_pickupCtrl, 'เช่น หน้าร้านสะดวกซื้อ ถนน...', Icons.circle, const Color(0xFF10B981)),
        const SizedBox(height: 14),

        // Delivery
        _label('จุดส่ง / ปลายทาง *'),
        _field(_deliveryCtrl, 'เช่น บ้านเลขที่ 123 ซอย...', Icons.location_on, const Color(0xFFEF4444)),
        const SizedBox(height: 14),

        // Phone
        _label('เบอร์โทรของคุณ *'),
        _field(_phoneCtrl, '08x-xxx-xxxx', Icons.phone_rounded, const Color(0xFF00D2FF),
            keyboardType: TextInputType.phone,),
        const SizedBox(height: 14),

        // Note
        _label('หมายเหตุ (ไม่บังคับ)'),
        TextField(
          controller: _noteCtrl,
          maxLines: 2,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'ขนาด/น้ำหนักสินค้า หรือข้อความเพิ่มเติม',
            hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.05),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF00D2FF)),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Express toggle
        GestureDetector(
          onTap: () => setState(() => _isExpress = !_isExpress),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: _isExpress
                  ? const Color(0xFFEF4444).withValues(alpha: 0.12)
                  : Colors.white.withValues(alpha: 0.04),
              border: Border.all(
                color: _isExpress
                    ? const Color(0xFFEF4444).withValues(alpha: 0.4)
                    : Colors.white12,
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.bolt_rounded,
                    color: _isExpress
                        ? const Color(0xFFEF4444)
                        : Colors.white38,
                    size: 22,),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Express ด่วน',
                          style: GoogleFonts.kanit(
                            color: _isExpress
                                ? const Color(0xFFEF4444)
                                : Colors.white60,
                            fontWeight: FontWeight.w600,
                          ),),
                      const Text('เร่งด่วน — อาจมีค่าบริการเพิ่ม',
                          style: TextStyle(
                              color: Colors.white30, fontSize: 11,),),
                    ],
                  ),
                ),
                Icon(
                  _isExpress
                      ? Icons.check_circle_rounded
                      : Icons.circle_outlined,
                  color: _isExpress
                      ? const Color(0xFFEF4444)
                      : Colors.white24,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Submit
        GestureDetector(
          onTap: _isSubmitting ? null : _submit,
          child: Container(
            height: 54,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: _pickupCtrl.text.isNotEmpty && _deliveryCtrl.text.isNotEmpty
                  ? const LinearGradient(
                      colors: [Color(0xFF00D2FF), Color(0xFF0088AA)],
                    )
                  : null,
              color: _pickupCtrl.text.isNotEmpty && _deliveryCtrl.text.isNotEmpty
                  ? null
                  : Colors.white12,
            ),
            child: Center(
              child: _isSubmitting
                  ? const CircularProgressIndicator(
                      color: Colors.black, strokeWidth: 2,)
                  : Text(
                      '🏍️  ยืนยันเรียกวิน',
                      style: GoogleFonts.kanit(
                        color: Colors.black,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccess(BuildContext ctx) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        Container(
          width: 80, height: 80,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [Color(0xFF00D2FF), Color(0xFF00E676)],
            ),
          ),
          child: const Icon(Icons.check_rounded, color: Colors.black, size: 44),
        ),
        const SizedBox(height: 20),
        Text('ส่งคำขอสำเร็จ! 🏍️',
            style: GoogleFonts.kanit(
                color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700,),),
        const SizedBox(height: 8),
        const Text('วินจะติดต่อกลับเพื่อยืนยัน\nและแจ้งค่าบริการ',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 14, height: 1.6),),
        const SizedBox(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: GestureDetector(
            onTap: () => Navigator.pop(ctx),
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: Colors.white.withValues(alpha: 0.08),
                border: Border.all(color: Colors.white12),
              ),
              child: Center(
                child: Text('ปิด',
                    style: GoogleFonts.kanit(color: Colors.white, fontSize: 16),),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.w600,),),
      );

  Widget _field(
    TextEditingController ctrl,
    String hint,
    IconData icon,
    Color iconColor, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: iconColor, size: 18),
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: iconColor.withValues(alpha: 0.6)),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WinRiderOnlineToggle  ← Rider-mode header widget
//   Shows the rider's current online status and toggle button
// ─────────────────────────────────────────────────────────────────────────────
class WinRiderOnlineToggle extends StatelessWidget {
  final bool isOnline;
  final bool isLoading;
  final VoidCallback onToggle;
  final VoidCallback? onMapTap;

  const WinRiderOnlineToggle({
    super.key,
    required this.isOnline,
    required this.isLoading,
    required this.onToggle,
    this.onMapTap,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor =
        isOnline ? const Color(0xFF00E676) : const Color(0xFF607D8B);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          colors: isOnline
              ? [
                  const Color(0xFF00E676).withValues(alpha: 0.12),
                  const Color(0xFF050A14),
                ]
              : [const Color(0xFF0B1628), const Color(0xFF050A14)],
        ),
        border: Border.all(
          color: activeColor.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Status indicator
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: activeColor,
              boxShadow: isOnline
                  ? [
                      BoxShadow(
                          color: activeColor.withValues(alpha: 0.6),
                          blurRadius: 8,
                          spreadRadius: 2,),
                    ]
                  : [],
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isOnline ? 'พร้อมรับงาน' : 'ออฟไลน์',
                style: GoogleFonts.kanit(
                  color: activeColor,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                isOnline ? 'คุณปรากฏบนแผนที่ลูกค้า' : 'กดเพื่อเริ่มรับงาน',
                style:
                    const TextStyle(color: Colors.white38, fontSize: 10),
              ),
            ],
          ),
          const Spacer(),

          // Map button
          if (onMapTap != null)
            GestureDetector(
              onTap: onMapTap,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.white.withValues(alpha: 0.06),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.map_rounded,
                        color: Color(0xFF00D2FF), size: 16,),
                    const SizedBox(width: 4),
                    Text('แผนที่',
                        style: GoogleFonts.kanit(
                            color: const Color(0xFF00D2FF), fontSize: 12,),),
                  ],
                ),
              ),
            ),

          // Toggle button
          GestureDetector(
            onTap: isLoading ? null : onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: isOnline
                    ? LinearGradient(
                        colors: [
                          const Color(0xFFEF4444).withValues(alpha: 0.2),
                          const Color(0xFFEF4444).withValues(alpha: 0.1),
                        ],
                      )
                    : const LinearGradient(
                        colors: [Color(0xFF00E676), Color(0xFF059669)],
                      ),
                border: Border.all(
                  color: isOnline
                      ? const Color(0xFFEF4444).withValues(alpha: 0.4)
                      : Colors.transparent,
                ),
                boxShadow: isOnline
                    ? []
                    : [
                        BoxShadow(
                            color: const Color(0xFF00E676).withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),),
                      ],
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white,),)
                  : Text(
                      isOnline ? 'หยุด' : 'เริ่ม',
                      style: GoogleFonts.kanit(
                        color:
                            isOnline ? const Color(0xFFEF4444) : Colors.black,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
