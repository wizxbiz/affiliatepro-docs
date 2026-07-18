import 'dart:math' as math;
import 'dart:ui';

import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/chat_screen.dart';
import 'package:caculateapp/tuktuk/screens/friend_center_screen.dart';
import 'package:caculateapp/tuktuk/screens/marketplace_screen.dart';
import 'package:caculateapp/tuktuk/screens/product_detail_screen.dart';
import 'package:caculateapp/tuktuk/screens/profile_screen.dart';
import 'package:caculateapp/tuktuk/screens/win_rider_service_screen.dart';
import 'package:caculateapp/tuktuk/services/chat_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:rxdart/rxdart.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:timeago/timeago.dart' as timeago;

// ==================== ธีมและการปรับแต่ง ====================
class MessageListTheme {
  // โหมดสี
  static const Map<String, ColorScheme> colorSchemes = {
    'light': ColorScheme.light(
      primary: Color(0xFF2563EB),
      secondary: Color(0xFF7C3AED),
      surface: Colors.white,
      background: Color(0xFFF8FAFC),
      error: Color(0xFFEF4444),
    ),
    'dark': ColorScheme.dark(
      primary: Color(0xFF3B82F6),
      secondary: Color(0xFF8B5CF6),
      surface: Color(0xFF1E293B),
      background: Color(0xFF0F172A),
      error: Color(0xFFF87171),
    ),
    'sunset': ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xFFF97316),
      onPrimary: Colors.white,
      secondary: Color(0xFFDB2777),
      onSecondary: Colors.white,
      surface: Color(0xFFFFF7ED),
      onSurface: Color(0xFF1E293B),
      background: Color(0xFFFFF3E0),
      onBackground: Color(0xFF1E293B),
      error: Color(0xFFEF4444),
      onError: Colors.white,
    ),
    'ocean': ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xFF0891B2),
      onPrimary: Colors.white,
      secondary: Color(0xFF0E7490),
      onSecondary: Colors.white,
      surface: Color(0xFFE0F2FE),
      onSurface: Color(0xFF0C4A6E),
      background: Color(0xFFF0F9FF),
      onBackground: Color(0xFF0C4A6E),
      error: Color(0xFFEF4444),
      onError: Colors.white,
    ),
    'forest': ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xFF059669),
      onPrimary: Colors.white,
      secondary: Color(0xFF047857),
      onSecondary: Colors.white,
      surface: Color(0xFFD1FAE5),
      onSurface: Color(0xFF064E3B),
      background: Color(0xFFECFDF5),
      onBackground: Color(0xFF064E3B),
      error: Color(0xFFEF4444),
      onError: Colors.white,
    ),
  };

  // ขนาดตัวอักษร
  static const Map<String, double> fontSizes = {
    'small': 12.0,
    'medium': 14.0,
    'large': 16.0,
    'xlarge': 18.0,
  };

  // รูปแบบการแสดงผล
  static const Map<String, Map<String, dynamic>> layouts = {
    'comfortable': {
      'avatarSize': 56.0,
      'spacing': 16.0,
      'padding': 16.0,
      'borderRadius': 20.0,
    },
    'compact': {
      'avatarSize': 48.0,
      'spacing': 12.0,
      'padding': 12.0,
      'borderRadius': 16.0,
    },
    'cozy': {
      'avatarSize': 52.0,
      'spacing': 14.0,
      'padding': 14.0,
      'borderRadius': 18.0,
    },
  };
}

// ==================== คลาสจัดการธีม ====================
class MessageListConfig extends ChangeNotifier {
  String _currentTheme = 'light';
  String _currentFontSize = 'medium';
  String _currentLayout = 'comfortable';
  bool _isRounded = true;
  bool _showAnimations = true;
  bool _showOnlineStatus = true;
  bool _showReadReceipts = true;
  bool _compactMode = false;

  String get currentTheme => _currentTheme;
  String get currentFontSize => _currentFontSize;
  String get currentLayout => _currentLayout;
  bool get isRounded => _isRounded;
  bool get showAnimations => _showAnimations;
  bool get showOnlineStatus => _showOnlineStatus;
  bool get showReadReceipts => _showReadReceipts;
  bool get compactMode => _compactMode;

  ColorScheme get colorScheme =>
      MessageListTheme.colorSchemes[_currentTheme] ??
      MessageListTheme.colorSchemes['light']!;

  Map<String, dynamic> get layoutConfig =>
      MessageListTheme.layouts[_currentLayout] ??
      MessageListTheme.layouts['comfortable']!;

  double get fontSize => MessageListTheme.fontSizes[_currentFontSize] ?? 14.0;

  void setTheme(String theme) {
    _currentTheme = theme;
    notifyListeners();
  }

  void setFontSize(String size) {
    _currentFontSize = size;
    notifyListeners();
  }

  void setLayout(String layout) {
    _currentLayout = layout;
    notifyListeners();
  }

  void toggleRounded() {
    _isRounded = !_isRounded;
    notifyListeners();
  }

  void toggleAnimations() {
    _showAnimations = !_showAnimations;
    notifyListeners();
  }

  void toggleOnlineStatus() {
    _showOnlineStatus = !_showOnlineStatus;
    notifyListeners();
  }

  void toggleReadReceipts() {
    _showReadReceipts = !_showReadReceipts;
    notifyListeners();
  }

  void toggleCompactMode() {
    _compactMode = !_compactMode;
    notifyListeners();
  }
}

// ==================== วิเจ็ตการตั้งค่า ====================
class MessageListSettings extends StatelessWidget {
  final MessageListConfig config;

  const MessageListSettings({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: config.colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(Icons.color_lens, color: config.colorScheme.primary),
              const SizedBox(width: 8),
              Text(
                'ปรับแต่งหน้าตา',
                style: GoogleFonts.kanit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: config.colorScheme.onSurface,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(Icons.close, color: config.colorScheme.onSurface),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // โหมดสี
          _buildSection(
            title: 'โหมดสี',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildColorOption('light', 'สว่าง', Colors.blue),
                _buildColorOption('dark', 'มืด', Colors.purple),
                _buildColorOption('sunset', 'พระอาทิตย์', Colors.orange),
                _buildColorOption('ocean', 'มหาสมุทร', Colors.cyan),
                _buildColorOption('forest', 'ป่าไม้', Colors.green),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ขนาดตัวอักษร
          _buildSection(
            title: 'ขนาดตัวอักษร',
            child: Row(
              children: [
                _buildSizeOption('small', 'เล็ก'),
                const SizedBox(width: 8),
                _buildSizeOption('medium', 'กลาง'),
                const SizedBox(width: 8),
                _buildSizeOption('large', 'ใหญ่'),
                const SizedBox(width: 8),
                _buildSizeOption('xlarge', 'ใหญ่พิเศษ'),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // รูปแบบการแสดงผล
          _buildSection(
            title: 'รูปแบบ',
            child: Row(
              children: [
                _buildLayoutOption('comfortable', 'สบายตา'),
                const SizedBox(width: 8),
                _buildLayoutOption('compact', 'กระชับ'),
                const SizedBox(width: 8),
                _buildLayoutOption('cozy', 'อบอุ่น'),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ตัวเลือกอื่นๆ
          _buildSection(
            title: 'ตัวเลือกเพิ่มเติม',
            child: Column(
              children: [
                _buildSwitchOption(
                    'มุมโค้งมน', config.isRounded, config.toggleRounded),
                _buildSwitchOption('แสดงอนิเมชั่น', config.showAnimations,
                    config.toggleAnimations),
                _buildSwitchOption('แสดงสถานะออนไลน์', config.showOnlineStatus,
                    config.toggleOnlineStatus),
                _buildSwitchOption('แสดงการอ่านแล้ว', config.showReadReceipts,
                    config.toggleReadReceipts),
                _buildSwitchOption('โหมดประหยัดพื้นที่', config.compactMode,
                    config.toggleCompactMode),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.kanit(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: config.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }

  Widget _buildColorOption(String theme, String label, Color color) {
    return InkWell(
      onTap: () => config.setTheme(theme),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: config.currentTheme == theme
              ? config.colorScheme.primary.withOpacity(0.1)
              : Colors.transparent,
          border: Border.all(
            color: config.currentTheme == theme
                ? config.colorScheme.primary
                : Colors.grey.withOpacity(0.3),
            width: 2,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: GoogleFonts.kanit(
                fontSize: 12,
                color: config.colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSizeOption(String size, String label) {
    return Expanded(
      child: InkWell(
        onTap: () => config.setFontSize(size),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: config.currentFontSize == size
                ? config.colorScheme.primary.withOpacity(0.1)
                : Colors.transparent,
            border: Border.all(
              color: config.currentFontSize == size
                  ? config.colorScheme.primary
                  : Colors.grey.withOpacity(0.3),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.kanit(
              fontSize: 12,
              color: config.colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLayoutOption(String layout, String label) {
    return Expanded(
      child: InkWell(
        onTap: () => config.setLayout(layout),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: config.currentLayout == layout
                ? config.colorScheme.primary.withOpacity(0.1)
                : Colors.transparent,
            border: Border.all(
              color: config.currentLayout == layout
                  ? config.colorScheme.primary
                  : Colors.grey.withOpacity(0.3),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.kanit(
              fontSize: 12,
              color: config.colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSwitchOption(String label, bool value, VoidCallback onTap) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.kanit(
            fontSize: 14,
            color: config.colorScheme.onSurface,
          ),
        ),
        Switch(
          value: value,
          onChanged: (_) => onTap(),
          activeColor: config.colorScheme.primary,
        ),
      ],
    );
  }
}

// ==================== วิเจ็ตตกแต่ง ====================
class AnimatedBackground extends StatelessWidget {
  final Widget child;
  final ColorScheme colorScheme;

  const AnimatedBackground({
    super.key,
    required this.child,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colorScheme.background,
            colorScheme.surface,
          ],
        ),
      ),
      child: child,
    );
  }
}

class ParticleBackground extends StatefulWidget {
  final Widget child;
  final ColorScheme colorScheme;

  const ParticleBackground({
    super.key,
    required this.child,
    required this.colorScheme,
  });

  @override
  State<ParticleBackground> createState() => _ParticleBackgroundState();
}

class _ParticleBackgroundState extends State<ParticleBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Particle> _particles = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    // สร้างอนุภาค
    for (int i = 0; i < 20; i++) {
      _particles.add(Particle());
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Stack(
          children: [
            ..._particles.map((particle) => Positioned(
                  left: particle.x * MediaQuery.of(context).size.width,
                  top: (particle.y + _controller.value * particle.speed) %
                          (MediaQuery.of(context).size.height + 100) -
                      50,
                  child: Opacity(
                    opacity: particle.opacity,
                    child: Container(
                      width: particle.size,
                      height: particle.size,
                      decoration: BoxDecoration(
                        color: widget.colorScheme.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                )),
            widget.child,
          ],
        );
      },
    );
  }
}

class Particle {
  double x = math.Random().nextDouble();
  double y = math.Random().nextDouble() * 2 - 1;
  double size = math.Random().nextDouble() * 30 + 10;
  double speed = math.Random().nextDouble() * 0.5 + 0.2;
  double opacity = math.Random().nextDouble() * 0.3 + 0.1;
}

// ==================== วิเจ็ตแชทไทล์ระดับพรีเมียม 🏁 ====================
class EnhancedChatTile extends StatelessWidget {
  final String name;
  final String? secondaryName;
  final String? photo;
  final String lastMessage;
  final DateTime? timestamp;
  final int unreadCount;
  final bool isOnline;
  final DateTime? lastSeen;
  final VoidCallback onTap;
  final GestureLongPressCallback? onLongPress;
  final VoidCallback? onProfileTap;
  final bool isLastMessageMine;
  final Color badgeColor;
  final MessageListConfig config;
  final bool isPinned;
  final bool isArchived;

  const EnhancedChatTile({
    super.key,
    required this.name,
    this.secondaryName,
    this.photo,
    required this.lastMessage,
    this.timestamp,
    required this.unreadCount,
    required this.isOnline,
    this.lastSeen,
    required this.onTap,
    this.onLongPress,
    this.onProfileTap,
    required this.isLastMessageMine,
    required this.badgeColor,
    required this.config,
    this.isPinned = false,
    this.isArchived = false,
  });

  @override
  Widget build(BuildContext context) {
    final avatarSize = config.compactMode ? 52.0 : 64.0;
    final borderRadius = config.isRounded ? 22.0 : 12.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          onLongPress: onLongPress,
          borderRadius: BorderRadius.circular(borderRadius),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isPinned
                  ? config.colorScheme.primary.withOpacity(0.08)
                  : unreadCount > 0
                      ? config.colorScheme.primary.withOpacity(0.06)
                      : config.colorScheme.surface.withOpacity(0.9),
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(
                color: isPinned
                    ? config.colorScheme.primary.withOpacity(0.25)
                    : unreadCount > 0
                        ? config.colorScheme.primary.withOpacity(0.15)
                        : config.colorScheme.onSurface.withOpacity(0.05),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: onProfileTap,
                  child: Stack(
                    children: [
                      Container(
                        width: avatarSize,
                        height: avatarSize,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color:
                                  config.colorScheme.primary.withOpacity(0.1),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            )
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(avatarSize / 2),
                          child: (photo != null && photo!.isNotEmpty)
                              ? CachedNetworkImage(
                                  imageUrl: photo!,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) =>
                                      Shimmer.fromColors(
                                    baseColor: config.colorScheme.onSurface
                                        .withOpacity(0.05),
                                    highlightColor: config.colorScheme.onSurface
                                        .withOpacity(0.02),
                                    child: Container(
                                        color: Colors.white,
                                        width: avatarSize,
                                        height: avatarSize),
                                  ),
                                  errorWidget: (context, url, error) =>
                                      _buildPlaceholder(avatarSize),
                                )
                              : _buildPlaceholder(avatarSize),
                        ),
                      ),
                      if (isOnline)
                        Positioned(
                          right: 2,
                          bottom: 2,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: const Color(0xFF22C55E),
                              shape: BoxShape.circle,
                              border:
                                  Border.all(color: Colors.white, width: 2.5),
                            ),
                          ),
                        ),
                      if (isPinned)
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            width: 16,
                            height: 16,
                            decoration: BoxDecoration(
                              color: config.colorScheme.primary,
                              shape: BoxShape.circle,
                              border:
                                  Border.all(color: Colors.white, width: 1.5),
                            ),
                            child: const Icon(Icons.push_pin_rounded,
                                size: 9, color: Colors.white),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.prompt(
                                      fontSize: config.fontSize + 1,
                                      fontWeight: unreadCount > 0
                                          ? FontWeight.w700
                                          : FontWeight.w600,
                                      color: config.colorScheme.onSurface,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                ),
                                if (name.contains('Shop') ||
                                    name.contains('Store') ||
                                    name.contains('Official')) ...[
                                  const SizedBox(width: 4),
                                  const Icon(Icons.verified_rounded,
                                      color: Color(0xFF3B82F6), size: 16),
                                ],
                              ],
                            ),
                          ),
                          if (timestamp != null)
                            Text(
                              timeago.format(timestamp!, locale: 'th'),
                              style: GoogleFonts.kanit(
                                fontSize: config.fontSize - 3,
                                color: config.colorScheme.onSurface
                                    .withOpacity(0.4),
                                fontWeight: unreadCount > 0
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                              ),
                            ),
                        ],
                      ),
                      // Online / Last-seen status
                      const SizedBox(height: 2),
                      if (isOnline)
                        Row(
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: Color(0xFF22C55E),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'ออนไลน์',
                              style: GoogleFonts.kanit(
                                fontSize: config.fontSize - 3,
                                color: const Color(0xFF22C55E),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        )
                      else if (lastSeen != null)
                        Text(
                          'เห็นล่าสุด ${timeago.format(lastSeen!, locale: 'th')}',
                          style: GoogleFonts.kanit(
                            fontSize: config.fontSize - 3,
                            color:
                                config.colorScheme.onSurface.withOpacity(0.4),
                          ),
                        ),
                      if (secondaryName != null) ...[
                        const SizedBox(height: 1),
                        Text(
                          '📦 $secondaryName',
                          style: GoogleFonts.kanit(
                            fontSize: config.fontSize - 1,
                            color: config.colorScheme.secondary,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              lastMessage.isEmpty
                                  ? 'ส่งข้อความทักทายเลย! 🇹🇭'
                                  : lastMessage,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.kanit(
                                fontSize: config.fontSize - 1,
                                color: unreadCount > 0
                                    ? config.colorScheme.onSurface
                                        .withOpacity(0.8)
                                    : config.colorScheme.onSurface
                                        .withOpacity(0.5),
                                fontWeight: unreadCount > 0
                                    ? FontWeight.w500
                                    : FontWeight.normal,
                              ),
                            ),
                          ),
                          if (unreadCount > 0)
                            Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    badgeColor,
                                    badgeColor.withOpacity(0.8)
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: [
                                  BoxShadow(
                                    color: badgeColor.withOpacity(0.3),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  )
                                ],
                              ),
                              child: Text(
                                unreadCount > 99
                                    ? '99+'
                                    : unreadCount.toString(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholder(double size) {
    return Container(
      color: config.colorScheme.primary.withOpacity(0.1),
      child: Center(
        child: Text(
          name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?',
          style: GoogleFonts.prompt(
            color: config.colorScheme.primary,
            fontWeight: FontWeight.bold,
            fontSize: size * 0.4,
          ),
        ),
      ),
    );
  }
}


// ==================== หน้าจอหลักระดับพรีเมียม 🇹🇭 ====================
class MessageListScreen extends StatefulWidget {
  const MessageListScreen({super.key});

  @override
  State<MessageListScreen> createState() => _MessageListScreenState();
}

class _MessageListScreenState extends State<MessageListScreen>
    with SingleTickerProviderStateMixin {
  final ChatService _chatService = ChatService();
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // Cached broadcast streams
  late Stream<int> _generalUnreadStream;
  late Stream<int> _productUnreadStream;
  late Stream<int> _totalUnreadStream;
  List<Map<String, dynamic>> _adProducts = [];

  // Static promo cards — always available even when Firestore is empty
  static const List<Map<String, dynamic>> _kStaticAds = [
    {
      'productName': 'เรียกวิน TukTuk ง่ายๆ',
      'sellerName': 'WIN RIDER SERVICE',
      'price': '0',
      'description':
          'รับ-ส่งสินค้าและผู้โดยสาร ราคาโปร่งใส ติดตามได้ real-time',
      '_adType': 'win_rider',
    },
    {
      'productName': 'เปิดร้านค้าออนไลน์ฟรี',
      'sellerName': 'TukTuk Marketplace',
      'price': '0',
      'description': 'ขายสินค้า ไม่มีค่าคอมมิชชั่น ทดลองฟรี 30 วัน',
      '_adType': 'seller_promo',
    },
  ];

  // Configuration
  final MessageListConfig _config = MessageListConfig();
  bool _showSettings = false;

  // ── Chat management state ──────────────────────────────────────────────────
  Set<String> _pinnedConvIds = {};
  Set<String> _archivedConvIds = {};
  Map<String, String> _nicknameMap = {}; // convId → custom nickname
  bool _showArchived = false;
  bool _showArchivedProducts = false;
  bool _showPromo = false;
  int _promoActiveIndex = 0;
  String _currentUidForSettings = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _setupTimeago();
    _fetchAds();
    _checkPromoVisibility();

    _generalUnreadStream =
        _chatService.getTotalUnreadStream().asBroadcastStream();
    _productUnreadStream =
        _chatService.getTotalProductUnreadStream().asBroadcastStream();

    _totalUnreadStream = Rx.combineLatest2(
      _generalUnreadStream,
      _productUnreadStream,
      (a, b) => a + b,
    ).asBroadcastStream();

    // Load chat settings after first frame (uid available from session)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final uid = TukTukBridge().currentSession?['lineUserId'] as String? ??
          TukTukBridge().currentSession?['uid'] as String? ??
          '';
      if (uid.isNotEmpty) _loadChatSettings(uid);
    });
  }

  Future<void> _checkPromoVisibility() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastClosed = prefs.getInt('promo_carousel_closed_at') ?? 0;
      final now = DateTime.now().millisecondsSinceEpoch;

      if (now - lastClosed > 3600000) {
        // 1 hour
        setState(() => _showPromo = true);
      }
    } catch (e) {
      debugPrint('Error checking promo visibility: $e');
    }
  }

  Future<void> _closePromo() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(
          'promo_carousel_closed_at', DateTime.now().millisecondsSinceEpoch);
      setState(() => _showPromo = false);
    } catch (e) {
      debugPrint('Error closing promo: $e');
      setState(() => _showPromo = false);
    }
  }

  void _setupTimeago() {
    timeago.setLocaleMessages('th', timeago.ThMessages());
    timeago.setLocaleMessages('th_short', timeago.ThShortMessages());
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _config.dispose();
    super.dispose();
  }

  // ── Chat Settings (Firestore) ─────────────────────────────────────────────

  Future<void> _loadChatSettings(String uid) async {
    if (uid.isEmpty) return;
    _currentUidForSettings = uid;
    try {
      final doc = await FirebaseFirestore.instance
          .collection('user_chat_settings')
          .doc(uid)
          .get();
      if (doc.exists && mounted) {
        final data = doc.data()!;
        setState(() {
          _pinnedConvIds = Set<String>.from(data['pinned'] ?? []);
          _archivedConvIds = Set<String>.from(data['archived'] ?? []);
          _nicknameMap = Map<String, String>.from(data['nicknames'] ?? {});
        });
      }
    } catch (e) {
      debugPrint('Load chat settings error: $e');
    }
  }

  Future<void> _saveChatSettings() async {
    if (_currentUidForSettings.isEmpty) return;
    try {
      await FirebaseFirestore.instance
          .collection('user_chat_settings')
          .doc(_currentUidForSettings)
          .set({
        'pinned': _pinnedConvIds.toList(),
        'archived': _archivedConvIds.toList(),
        'nicknames': _nicknameMap,
      });
    } catch (e) {
      debugPrint('Save chat settings error: $e');
    }
  }

  void _togglePin(String convId) {
    setState(() {
      if (_pinnedConvIds.contains(convId)) {
        _pinnedConvIds.remove(convId);
      } else {
        _pinnedConvIds.add(convId);
        _archivedConvIds.remove(convId); // ปักหมุดแล้วเอาออกจาก archive
      }
    });
    _saveChatSettings();
    HapticFeedback.mediumImpact();
  }

  void _toggleArchive(String convId) {
    setState(() {
      if (_archivedConvIds.contains(convId)) {
        _archivedConvIds.remove(convId);
      } else {
        _archivedConvIds.add(convId);
        _pinnedConvIds.remove(convId); // archive แล้วเลิกปักหมุด
      }
    });
    _saveChatSettings();
    HapticFeedback.mediumImpact();
  }

  Future<void> _deleteConversation(
      BuildContext context, String convId, String name) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('ลบการสนทนา',
            style: GoogleFonts.kanit(fontWeight: FontWeight.bold)),
        content: Text(
            'ลบแชทกับ "$name" ออกจากรายการ?\nข้อความจะยังคงอยู่ในระบบ',
            style: GoogleFonts.kanit()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('ยกเลิก', style: GoogleFonts.kanit()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(
                foregroundColor: _config.colorScheme.error),
            child: Text('ลบ',
                style: GoogleFonts.kanit(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      setState(() {
        _archivedConvIds.add(convId); // ซ่อนจากรายการโดยการ archive
        _pinnedConvIds.remove(convId);
        _nicknameMap.remove(convId);
      });
      _saveChatSettings();
    }
  }

  Future<void> _showNicknameDialog(
      BuildContext context, String convId, String currentName) async {
    final controller = TextEditingController(text: _nicknameMap[convId] ?? '');
    const emojis = ['😊', '❤️', '⭐', '🔥', '💯', '🎉', '💪', '🌟', '🙏', '👑'];
    String? result = await showDialog<String>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              const Text('✏️ '),
              Text('แก้ไขชื่อ',
                  style: GoogleFonts.kanit(fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('ชื่อเดิม: $currentName',
                    style: GoogleFonts.kanit(
                        fontSize: 12, color: Colors.grey[600])),
                const SizedBox(height: 12),
                TextField(
                  controller: controller,
                  autofocus: true,
                  maxLength: 30,
                  style: GoogleFonts.kanit(fontSize: 16),
                  decoration: InputDecoration(
                    hintText: 'ใส่ชื่อใหม่ + อิโมจิ ✨',
                    hintStyle: GoogleFonts.kanit(color: Colors.grey[400]),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () => controller.clear(),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text('อิโมจิด่วน:',
                    style: GoogleFonts.kanit(
                        fontSize: 12, color: Colors.grey[600])),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  children: emojis
                      .map((e) => GestureDetector(
                            onTap: () {
                              final pos = controller.selection.base.offset;
                              final text = controller.text;
                              final newText = pos < 0
                                  ? text + e
                                  : text.substring(0, pos) +
                                      e +
                                      text.substring(pos);
                              controller.value = TextEditingValue(
                                text: newText,
                                selection: TextSelection.collapsed(
                                    offset: (pos < 0 ? text.length : pos) +
                                        e.length),
                              );
                              setS(() {});
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child:
                                  Text(e, style: const TextStyle(fontSize: 20)),
                            ),
                          ))
                      .toList(),
                ),
              ]),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('ยกเลิก', style: GoogleFonts.kanit()),
            ),
            if (_nicknameMap.containsKey(convId))
              TextButton(
                onPressed: () => Navigator.pop(ctx, '__clear__'),
                style: TextButton.styleFrom(foregroundColor: Colors.orange),
                child: Text('รีเซ็ต', style: GoogleFonts.kanit()),
              ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              style: ElevatedButton.styleFrom(
                  backgroundColor: _config.colorScheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10))),
              child: Text('บันทึก',
                  style: GoogleFonts.kanit(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
    if (result == '__clear__') {
      setState(() => _nicknameMap.remove(convId));
      _saveChatSettings();
    } else if (result != null && result.isNotEmpty) {
      setState(() => _nicknameMap[convId] = result);
      _saveChatSettings();
    }
  }

  void _showChatOptions(
    BuildContext context, {
    required String convId,
    required String name,
    required String otherUserId,
    required String collection,
    Map<String, dynamic>? userData,
  }) {
    final isPinned = _pinnedConvIds.contains(convId);
    final isArchived = _archivedConvIds.contains(convId);
    final cs = _config.colorScheme;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: cs.onSurface.withOpacity(0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: cs.primary.withOpacity(0.1),
                    child: Text(
                      name.isNotEmpty ? name.substring(0, 1) : '?',
                      style: GoogleFonts.kanit(
                          color: cs.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 18),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                            style: GoogleFonts.kanit(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: cs.onSurface),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                        if (_nicknameMap.containsKey(convId))
                          Text('ชื่อที่แก้ไข: ${_nicknameMap[convId]}',
                              style: GoogleFonts.kanit(
                                  fontSize: 11, color: cs.primary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Options
            _optionTile(ctx,
                icon:
                    isPinned ? Icons.push_pin_outlined : Icons.push_pin_rounded,
                color: cs.primary,
                label: isPinned ? 'เลิกปักหมุด' : 'ปักหมุดการสนทนา', onTap: () {
              Navigator.pop(ctx);
              _togglePin(convId);
            }),
            _optionTile(ctx,
                icon: isArchived
                    ? Icons.unarchive_rounded
                    : Icons.archive_rounded,
                color: Colors.orange,
                label: isArchived ? 'ยกเลิกจัดเก็บ' : 'จัดเก็บการสนทนา',
                onTap: () {
              Navigator.pop(ctx);
              _toggleArchive(convId);
            }),
            _optionTile(ctx,
                icon: Icons.edit_rounded,
                color: Colors.purple,
                label: 'แก้ไขชื่อเพื่อน', onTap: () {
              Navigator.pop(ctx);
              _showNicknameDialog(context, convId, name);
            }),
            _optionTile(ctx,
                icon: Icons.person_rounded,
                color: Colors.teal,
                label: 'ดูโปรไฟล์', onTap: () {
              Navigator.pop(ctx);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ProfileScreen(
                    userId: otherUserId,
                    isBackButtonEnabled: true,
                  ),
                ),
              );
            }),
            _optionTile(ctx,
                icon: Icons.delete_outline_rounded,
                color: cs.error,
                label: 'ลบการสนทนา', onTap: () {
              Navigator.pop(ctx);
              _deleteConversation(context, convId, name);
            }),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _optionTile(BuildContext ctx,
      {required IconData icon,
      required Color color,
      required String label,
      required VoidCallback onTap}) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(label,
          style: GoogleFonts.kanit(
              fontSize: 15, color: _config.colorScheme.onSurface)),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  Future<void> _fetchAds() async {
    // Always start with static promos so ads show even if Firestore is empty
    final results = List<Map<String, dynamic>>.from(_kStaticAds);
    try {
      final snap = await FirebaseFirestore.instance
          .collection('marketplace_items')
          .where('status', isEqualTo: 'active')
          .orderBy('viewCount', descending: true)
          .limit(8)
          .get();
      results.addAll(snap.docs.map((d) => {...d.data(), 'id': d.id}));
    } catch (_) {
      try {
        final snap = await FirebaseFirestore.instance
            .collection('marketplace_items')
            .where('status', isEqualTo: 'active')
            .limit(8)
            .get();
        results.addAll(snap.docs.map((d) => {...d.data(), 'id': d.id}));
      } catch (e) {
        debugPrint('_fetchAds: $e');
      }
    }
    if (mounted) {
      setState(() {
        _adProducts = results..shuffle();
      });
    }
  }


  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _config,
      builder: (context, child) {
        return ChangeNotifierProvider(
          config: _config,
          child: StreamBuilder<Map<String, dynamic>?>(
            stream: TukTukBridge().sessionStream,
            initialData: TukTukBridge().currentSession,
            builder: (context, sessionSnapshot) {
              final currentSession = sessionSnapshot.data;
              final String uid = currentSession?['lineUserId'] as String? ??
                  currentSession?['uid'] as String? ??
                  _chatService.currentUserId ??
                  '';

              if (currentSession == null || uid.isEmpty) {
                return _buildNotLoggedIn(_config);
              }

              return _buildMainScreen(uid, _config);
            },
          ),
        );
      },
    );
  }

  Widget _buildMainScreen(String uid, MessageListConfig config) {
    return Scaffold(
      backgroundColor: config.colorScheme.background,
      body: Stack(
        children: [
          // พื้นหลังอนิเมชั่น
          if (config.showAnimations)
            ParticleBackground(
              colorScheme: config.colorScheme,
              child: _buildContent(uid, config),
            )
          else
            AnimatedBackground(
              colorScheme: config.colorScheme,
              child: _buildContent(uid, config),
            ),

          // ปุ่มเปิดการตั้งค่า
          Positioned(
            bottom: 20,
            right: 20,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              transform: Matrix4.rotationZ(_showSettings ? math.pi / 4 : 0),
              child: FloatingActionButton(
                onPressed: () {
                  setState(() {
                    _showSettings = !_showSettings;
                  });
                  if (_showSettings) {
                    _showSettingsDialog(context);
                  }
                },
                backgroundColor: config.colorScheme.primary,
                child: Icon(
                  _showSettings ? Icons.close : Icons.settings,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(String uid, MessageListConfig config) {
    return NestedScrollView(
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        _buildSliverAppBar(uid, config),
        _buildPromoSliver(config), // 🌟 Added premium promo carousel
        SliverPersistentHeader(
          pinned: true,
          delegate: _SliverHeaderDelegate(
            child: Container(
              height: 160,
              color: config.colorScheme.background,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildSearchBar(config),
                  _buildTabBar(uid, config),
                ],
              ),
            ),
            minHeight: 160,
            maxHeight: 160,
          ),
        ),
      ],
      body: Column(
        children: [
          // 📶 Offline Indicator
          StreamBuilder<QuerySnapshot>(
            stream: _chatService.getConversations(),
            builder: (context, snapshot) {
              if (snapshot.hasData && snapshot.data!.metadata.isFromCache) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  color: Colors.orange.withOpacity(0.1),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.cloud_off_rounded,
                        size: 14,
                        color: Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'โหมดออฟไลน์: กำลังแสดงข้อมูลในเครื่อง',
                        style: GoogleFonts.kanit(
                          fontSize: 11,
                          color: Colors.orange,
                        ),
                      ),
                    ],
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildConversationList(uid, config),
                _buildProductChatList(uid, config),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoSliver(MessageListConfig config) {
    if (!_showPromo || _adProducts.isEmpty || _searchQuery.isNotEmpty)
      return const SliverToBoxAdapter(child: SizedBox.shrink());

    return SliverToBoxAdapter(
      child: FadeInDown(
        duration: const Duration(milliseconds: 600),
        child: Container(
          height: 95,
          margin: const EdgeInsets.only(top: 6, bottom: 4),
          child: Stack(
            children: [
              CarouselSlider.builder(
                itemCount: _adProducts.length,
                options: CarouselOptions(
                  height: 95,
                  viewportFraction: 0.94,
                  autoPlay: true,
                  autoPlayInterval: const Duration(seconds: 6),
                  enlargeCenterPage: true,
                  onPageChanged: (index, reason) {
                    setState(() => _promoActiveIndex = index);
                  },
                ),
                itemBuilder: (context, index, realIndex) {
                  return _buildPromoCard(_adProducts[index], config);
                },
              ),
              // Close Action
              Positioned(
                right: 22,
                top: 6,
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _closePromo();
                  },
                  child: ClipOval(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: config.colorScheme.surface.withOpacity(0.4),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.close_rounded,
                            color:
                                config.colorScheme.onSurface.withOpacity(0.6),
                            size: 12),
                      ),
                    ),
                  ),
                ),
              ),
              // Indicator
              Positioned(
                bottom: 6,
                left: 0,
                right: 0,
                child: Center(
                  child: AnimatedSmoothIndicator(
                    activeIndex: _promoActiveIndex,
                    count: _adProducts.length,
                    effect: ScrollingDotsEffect(
                      dotHeight: 3,
                      dotWidth: 3,
                      activeDotColor: config.colorScheme.primary,
                      dotColor: config.colorScheme.onSurface.withOpacity(0.1),
                      spacing: 4,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPromoCard(
      Map<String, dynamic> product, MessageListConfig config) {
    final name =
        product['productName'] ?? product['name'] ?? 'ดีลพิเศษสำหรับคุณ';
    final price = product['price']?.toString() ?? '0';
    final imageUrl = product['imageUrl'] ?? product['thumbnail'];
    final shopName = product['sellerName'] ?? 'TukTuk Recommended';
    final isSpecial = product['_adType'] != null;

    final adType = product['_adType'] as String?;

    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        if (adType == 'win_rider') {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const WinRiderServiceScreen()),
          );
        } else if (adType == 'seller_promo') {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MarketplaceScreen()),
          );
        } else {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProductDetailScreen(productData: product),
            ),
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 2),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: isSpecial
                ? [
                    config.colorScheme.primary.withOpacity(0.8),
                    config.colorScheme.secondary.withOpacity(0.8),
                  ]
                : [
                    config.colorScheme.surface,
                    config.colorScheme.surface,
                  ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: config.colorScheme.onSurface.withOpacity(0.05),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              Positioned(
                right: -15,
                top: -15,
                child: Opacity(
                  opacity: 0.1,
                  child: Icon(
                    isSpecial ? Icons.star_rounded : Icons.shopping_bag_rounded,
                    size: 70,
                    color:
                        isSpecial ? Colors.white : config.colorScheme.primary,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Row(
                  children: [
                    // Image Section
                    Hero(
                      tag: 'promo_${product['id'] ?? name}',
                      child: Container(
                        width: 65,
                        height: 65,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            )
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: imageUrl != null &&
                                  imageUrl.toString().startsWith('http')
                              ? CachedNetworkImage(
                                  imageUrl: imageUrl,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(
                                    color: Colors.grey[200],
                                    child: const Center(
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2)),
                                  ),
                                )
                              : Container(
                                  color: config.colorScheme.primary
                                      .withOpacity(0.1),
                                  child: Icon(Icons.local_shipping_rounded,
                                      color: config.colorScheme.primary,
                                      size: 24),
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Content Section
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: isSpecial
                                  ? Colors.white.withOpacity(0.2)
                                  : config.colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              shopName.toUpperCase(),
                              style: GoogleFonts.prompt(
                                color: isSpecial
                                    ? Colors.white
                                    : config.colorScheme.primary,
                                fontSize: 7,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            name,
                            style: GoogleFonts.prompt(
                              color: isSpecial
                                  ? Colors.white
                                  : config.colorScheme.onSurface,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              height: 1.1,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                isSpecial ? 'CLICK TO VIEW' : '฿$price',
                                style: GoogleFonts.outfit(
                                  color: isSpecial
                                      ? Colors.white.withOpacity(0.8)
                                      : config.colorScheme.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const Spacer(),
                              Icon(
                                Icons.arrow_forward_ios_rounded,
                                color: isSpecial
                                    ? Colors.white.withOpacity(0.5)
                                    : config.colorScheme.onSurface
                                        .withOpacity(0.2),
                                size: 10,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSettingsDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) {
          return Container(
            decoration: BoxDecoration(
              color: _config.colorScheme.surface,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(30),
              ),
            ),
            child: SingleChildScrollView(
              controller: scrollController,
              child: MessageListSettings(config: _config),
            ),
          );
        },
      ),
    ).then((_) {
      setState(() {
        _showSettings = false;
      });
    });
  }

  Widget _buildNotLoggedIn(MessageListConfig config) {
    return AnimatedBackground(
      colorScheme: config.colorScheme,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 500),
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: config.colorScheme.primary.withOpacity(0.3),
                  ),
                  color: config.colorScheme.primary.withOpacity(0.1),
                ),
                child: Icon(
                  Icons.lock_person_rounded,
                  size: 56,
                  color: config.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'กล่องข้อความ',
                style: GoogleFonts.kanit(
                  color: config.colorScheme.onSurface,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pushNamed(context, '/login'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: config.colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'เข้าสู่ระบบตอนนี้',
                  style: GoogleFonts.kanit(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  SliverAppBar _buildSliverAppBar(String uid, MessageListConfig config) {
    return SliverAppBar(
      backgroundColor: Colors.transparent,
      floating: true,
      snap: true,
      elevation: 0,
      expandedHeight: 90,
      flexibleSpace: FlexibleSpaceBar(
        background: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    config.colorScheme.surface.withOpacity(0.7),
                    config.colorScheme.background.withOpacity(0.4),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
        ),
      ),
      titleSpacing: 20,
      title: Row(
        children: [
          Text(
            'ข้อความ',
            style: GoogleFonts.prompt(
              color: config.colorScheme.onSurface,
              fontWeight: FontWeight.w800,
              fontSize: 28,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(width: 12),
          // Live total unread badge
          StreamBuilder<int>(
            stream: _totalUnreadStream,
            builder: (context, snap) {
              final total = snap.data ?? 0;
              if (total == 0) return const SizedBox();
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: config.colorScheme.error,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: config.showAnimations
                      ? [
                          BoxShadow(
                            color: config.colorScheme.error.withOpacity(0.3),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  total > 99 ? '99+' : total.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.person_add_rounded,
              color: config.colorScheme.onSurface, size: 24),
          tooltip: 'ค้นหาเพื่อน',
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const FriendCenterScreen()),
          ),
        ),
        IconButton(
          icon: Icon(Icons.tune_rounded,
              color: config.colorScheme.onSurface, size: 24),
          tooltip: 'ตั้งค่าการแสดงผล',
          onPressed: () {
            setState(() => _showSettings = true);
            _showSettingsDialog(context);
          },
        ),
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildSearchBar(MessageListConfig config) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: 52,
        decoration: BoxDecoration(
          color: config.colorScheme.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(26),
          boxShadow: [
            BoxShadow(
              color: config.colorScheme.primary.withOpacity(0.06),
              blurRadius: 15,
              offset: const Offset(0, 5),
            )
          ],
          border: Border.all(
            color: config.colorScheme.onSurface.withOpacity(0.08),
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
            child: TextField(
              controller: _searchController,
              textAlignVertical: TextAlignVertical.center,
              style: GoogleFonts.kanit(
                color: config.colorScheme.onSurface,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
              onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
              decoration: InputDecoration(
                hintText: 'ค้นหาการสนทนาหรือสินค้า...',
                hintStyle: GoogleFonts.kanit(
                  color: config.colorScheme.onSurface.withOpacity(0.3),
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: config.colorScheme.primary,
                  size: 22,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(
                          Icons.cancel_rounded,
                          color: config.colorScheme.onSurface.withOpacity(0.2),
                          size: 18,
                        ),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabBar(String uid, MessageListConfig config) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      height: 48,
      decoration: BoxDecoration(
        color: config.colorScheme.onSurface.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
      ),
      child: TabBar(
        controller: _tabController,
        dividerColor: Colors.transparent,
        indicator: BoxDecoration(
          color: config.colorScheme.primary,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: config.colorScheme.primary.withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 6),
            )
          ],
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelStyle: GoogleFonts.prompt(
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
        unselectedLabelStyle: GoogleFonts.prompt(
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
        labelColor: Colors.white,
        unselectedLabelColor: config.colorScheme.onSurface.withOpacity(0.6),
        tabs: [
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Flexible(
                    child: Text('การสนทนา',
                        maxLines: 1, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: 4),
                StreamBuilder<int>(
                  stream: _generalUnreadStream,
                  builder: (context, snap) {
                    final count = snap.data ?? 0;
                    if (count == 0 || config.compactMode)
                      return const SizedBox.shrink();
                    return _smallBadge(count, config);
                  },
                ),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Flexible(
                    child: Text('สินค้า',
                        maxLines: 1, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: 4),
                StreamBuilder<int>(
                  stream: _productUnreadStream,
                  builder: (context, snap) {
                    final count = snap.data ?? 0;
                    if (count == 0 || config.compactMode)
                      return const SizedBox.shrink();
                    return _smallBadge(count, config);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _smallBadge(int count, MessageListConfig config) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        count > 99 ? '99+' : count.toString(),
        style: TextStyle(
          color: config.colorScheme.primary,
          fontSize: config.fontSize - 2,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  // ─── Conversation List ──────────────────────────────────────────────────────

  Widget _buildConversationList(String currentUid, MessageListConfig config) {
    return StreamBuilder<QuerySnapshot>(
      stream: _chatService.getConversations(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildShimmerList(config);
        }

        final docs = snapshot.data?.docs ?? [];
        var sortedDocs = List<QueryDocumentSnapshot>.from(docs);

        // Sort: pinned first → then by timestamp
        sortedDocs.sort((a, b) {
          final aPinned = _pinnedConvIds.contains(a.id) ? 0 : 1;
          final bPinned = _pinnedConvIds.contains(b.id) ? 0 : 1;
          if (aPinned != bPinned) return aPinned.compareTo(bPinned);
          final aTime =
              (a.data() as Map<String, dynamic>)['lastMessageAt'] as Timestamp?;
          final bTime =
              (b.data() as Map<String, dynamic>)['lastMessageAt'] as Timestamp?;
          if (aTime == null) return 1;
          if (bTime == null) return -1;
          return bTime.compareTo(aTime);
        });

        // Separate archived / visible
        final visibleDocs = sortedDocs
            .where((d) => _showArchived
                ? _archivedConvIds.contains(d.id)
                : !_archivedConvIds.contains(d.id))
            .toList();
        final archivedCount =
            sortedDocs.where((d) => _archivedConvIds.contains(d.id)).length;

        if (visibleDocs.isEmpty && archivedCount == 0) {
          return _buildEmptyState(
            config: config,
            icon: Icons.chat_bubble_outline_rounded,
            title: 'ยังไม่มีข้อความ',
            subtitle: 'เริ่มต้นพูดคุยกับเพื่อนของคุณ',
            actionLabel: 'ค้นหาเพื่อน',
            onAction: () => Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const FriendCenterScreen()),
            ),
          );
        }

        // Conversations list + archived toggle at bottom
        final totalItems = visibleDocs.length + 1; // +1 for archived btn

        return RefreshIndicator(
          onRefresh: () async => setState(() {}),
          color: config.colorScheme.primary,
          child: ListView.builder(
            padding: const EdgeInsets.only(top: 4, bottom: 20),
            itemCount: totalItems,
            itemBuilder: (context, index) {
              // Last item: archived toggle button
              if (index == totalItems - 1) {
                return _buildArchivedToggle(
                    archivedCount,
                    config,
                    _showArchived,
                    () => setState(() => _showArchived = !_showArchived));
              }

              final convDoc = visibleDocs[index];
              final convData = convDoc.data() as Map<String, dynamic>;
              final List participants = convData['participants'] ?? [];
              final otherUserId = participants
                  .firstWhere((id) => id != currentUid, orElse: () => '');
              if (otherUserId.isEmpty) return const SizedBox();

              final lastMessage = convData['lastMessage'] ?? '';
              final ts = convData['lastMessageAt'] as Timestamp?;
              final timestamp = ts?.toDate();
              final unreadCount =
                  (convData['unreadCount_$currentUid'] ?? 0) as int;
              final lastSenderId = convData['lastSenderId'] as String?;
              final isPinned = _pinnedConvIds.contains(convDoc.id);
              final isArchived = _archivedConvIds.contains(convDoc.id);

              return FutureBuilder<DocumentSnapshot>(
                future: FirebaseFirestore.instance
                    .collection('users')
                    .doc(otherUserId)
                    .get(),
                builder: (context, userSnap) {
                  final userData =
                      userSnap.data?.data() as Map<String, dynamic>?;
                  final rawName = userData?['displayName'] ??
                      userData?['name'] ??
                      'ผู้ใช้งาน';
                  // Apply custom nickname if set
                  final name = _nicknameMap[convDoc.id] ?? rawName;
                  final photo =
                      userData?['pictureUrl'] ?? userData?['photoURL'];
                  final isOnline = userData?['isOnline'] == true;
                  final lastSeenTs = userData?['lastSeen'] as Timestamp?;
                  final lastSeen = lastSeenTs?.toDate();

                  if (_searchQuery.isNotEmpty &&
                      !name.toLowerCase().contains(_searchQuery) &&
                      !rawName.toLowerCase().contains(_searchQuery)) {
                    return const SizedBox();
                  }

                  return Dismissible(
                    key: ValueKey('conv_${convDoc.id}'),
                    background: _swipeBg(
                        color: config.colorScheme.primary,
                        icon: isPinned
                            ? Icons.push_pin_outlined
                            : Icons.push_pin_rounded,
                        label: isPinned ? 'เลิกปักหมุด' : 'ปักหมุด',
                        alignment: Alignment.centerLeft),
                    secondaryBackground: _swipeBg(
                        color: Colors.orange,
                        icon: Icons.archive_rounded,
                        label: isArchived ? 'ยกเลิกจัดเก็บ' : 'จัดเก็บ',
                        alignment: Alignment.centerRight),
                    confirmDismiss: (direction) async {
                      if (direction == DismissDirection.startToEnd) {
                        _togglePin(convDoc.id);
                      } else {
                        _toggleArchive(convDoc.id);
                      }
                      return false; // never actually dismiss (just act)
                    },
                    child: EnhancedChatTile(
                      name: name,
                      photo: photo,
                      lastMessage: lastMessage,
                      timestamp: timestamp,
                      unreadCount: unreadCount,
                      isOnline: isOnline,
                      lastSeen: isOnline ? null : lastSeen,
                      isPinned: isPinned,
                      isArchived: isArchived,
                      isLastMessageMine: lastSenderId == currentUid,
                      badgeColor: config.colorScheme.error,
                      config: config,
                      onLongPress: () => _showChatOptions(context,
                          convId: convDoc.id,
                          name: name,
                          otherUserId: otherUserId,
                          collection: 'conversations',
                          userData: userData),
                      onProfileTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProfileScreen(
                            userId: otherUserId,
                            isBackButtonEnabled: true,
                          ),
                        ),
                      ),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ChatScreen(
                              conversationId: convDoc.id,
                              otherUserId: otherUserId,
                              otherUserName: rawName,
                              otherUserPhoto: photo,
                            ),
                          ),
                        );
                        _chatService.markAsRead(convDoc.id);
                      },
                    ),
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildArchivedToggle(int count, MessageListConfig config,
      bool showArchived, VoidCallback onToggle) {
    if (count == 0 && !showArchived) return const SizedBox(height: 8);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: GestureDetector(
        onTap: onToggle,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          decoration: BoxDecoration(
            color: config.colorScheme.surface.withOpacity(0.6),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color: config.colorScheme.onSurface.withOpacity(0.08)),
          ),
          child: Row(
            children: [
              Icon(
                showArchived
                    ? Icons.expand_less_rounded
                    : Icons.archive_rounded,
                color: Colors.orange,
                size: 20,
              ),
              const SizedBox(width: 10),
              Text(
                showArchived ? 'ซ่อนที่จัดเก็บ' : 'จัดเก็บ ($count รายการ)',
                style: GoogleFonts.kanit(
                  fontSize: 13,
                  color: config.colorScheme.onSurface.withOpacity(0.7),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _swipeBg({
    required Color color,
    required IconData icon,
    required String label,
    required Alignment alignment,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(22),
      ),
      alignment: alignment,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 26),
          const SizedBox(height: 4),
          Text(label,
              style: GoogleFonts.kanit(
                  color: color, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  // ─── Product Chat List ──────────────────────────────────────────────────────

  Widget _buildProductChatList(String currentUid, MessageListConfig config) {
    return StreamBuilder<List<QueryDocumentSnapshot>>(
      stream: Rx.combineLatest2(
        _chatService.getProductConversations().map((s) => s.docs),
        _chatService.getSellerProductDocs(),
        (List<QueryDocumentSnapshot> buyer,
            List<QueryDocumentSnapshot> seller) {
          final merged = <String, QueryDocumentSnapshot>{};
          for (final d in [...buyer, ...seller]) {
            merged[d.id] = d;
          }
          final sorted = merged.values.toList();
          sorted.sort((a, b) {
            final aKey = 'pc_${a.id}';
            final bKey = 'pc_${b.id}';
            final aPinned = _pinnedConvIds.contains(aKey) ? 0 : 1;
            final bPinned = _pinnedConvIds.contains(bKey) ? 0 : 1;
            if (aPinned != bPinned) return aPinned.compareTo(bPinned);
            final aTime = (a.data() as Map)['lastMessageAt'] as Timestamp?;
            final bTime = (b.data() as Map)['lastMessageAt'] as Timestamp?;
            if (aTime == null) return 1;
            if (bTime == null) return -1;
            return bTime.compareTo(aTime);
          });
          return sorted;
        },
      ).asBroadcastStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildShimmerList(config);
        }

        final allDocs = snapshot.data ?? [];

        // Separate archived / visible using namespaced keys
        final visibleDocs = allDocs.where((d) {
          final key = 'pc_${d.id}';
          return _showArchivedProducts
              ? _archivedConvIds.contains(key)
              : !_archivedConvIds.contains(key);
        }).toList();
        final archivedCount = allDocs
            .where((d) => _archivedConvIds.contains('pc_${d.id}'))
            .length;

        if (visibleDocs.isEmpty && archivedCount == 0) {
          return _buildEmptyState(
            config: config,
            icon: Icons.storefront_rounded,
            title: 'ยังไม่มีแชทสินค้า',
            subtitle: 'แชทกับผู้ขายจะปรากฏที่นี่',
          );
        }

        // Product chat tab: no ads — privacy first
        final totalItems = visibleDocs.length + 1; // +1 archived toggle

        return RefreshIndicator(
          onRefresh: () async => setState(() {}),
          color: config.colorScheme.primary,
          child: ListView.builder(
            padding: const EdgeInsets.only(top: 4, bottom: 20),
            itemCount: totalItems,
            itemBuilder: (context, index) {
              // Last item: archived toggle
              if (index == totalItems - 1) {
                return _buildArchivedToggle(
                  archivedCount,
                  config,
                  _showArchivedProducts,
                  () => setState(
                      () => _showArchivedProducts = !_showArchivedProducts),
                );
              }

              final chatDoc = visibleDocs[index];
              final chatData = chatDoc.data() as Map<String, dynamic>;
              final stateKey = 'pc_${chatDoc.id}';

              final isSeller = chatData['sellerId'] == currentUid ||
                  chatData['lineUserId'] == currentUid;
              final otherUserId = isSeller
                  ? chatData['buyerId'] as String?
                  : (chatData['sellerId'] ?? chatData['lineUserId']) as String?;
              if (otherUserId == null || otherUserId.isEmpty) {
                return const SizedBox();
              }

              final unreadCount = isSeller
                  ? (chatData['unreadCountSeller'] ?? 0) as int
                  : (chatData['unreadCountBuyer'] ?? 0) as int;
              final lastMessage = chatData['lastMessage'] ?? '';
              final ts = chatData['lastMessageAt'] as Timestamp?;
              final timestamp = ts?.toDate();
              final productName = chatData['productName'] ?? 'สินค้า';
              final productImage = chatData['productImageUrl'] as String?;
              final lastSenderId = chatData['lastSenderId'] as String?;
              final isPinned = _pinnedConvIds.contains(stateKey);
              final isArchived = _archivedConvIds.contains(stateKey);

              return FutureBuilder<List<DocumentSnapshot>>(
                future: Future.wait([
                  FirebaseFirestore.instance
                      .collection('users')
                      .doc(otherUserId)
                      .get(),
                  FirebaseFirestore.instance
                      .collection('line_users')
                      .doc(otherUserId)
                      .get(),
                ]),
                builder: (context, userSnap) {
                  final d1 = userSnap.data?[0].data() as Map<String, dynamic>?;
                  final d2 = userSnap.data?[1].data() as Map<String, dynamic>?;
                  final userData = (d1?.isNotEmpty == true) ? d1 : d2;

                  final rawName = userData?['displayName'] ??
                      userData?['name'] ??
                      chatData['buyerName'] ??
                      'ผู้ใช้งาน';
                  final name = _nicknameMap[stateKey] ?? rawName;
                  final photo = userData?['pictureUrl'] ?? productImage;
                  final isOnline = userData?['isOnline'] == true;
                  final lastSeenTs = userData?['lastSeen'] as Timestamp?;
                  final lastSeen = lastSeenTs?.toDate();

                  if (_searchQuery.isNotEmpty &&
                      !name.toLowerCase().contains(_searchQuery) &&
                      !rawName.toLowerCase().contains(_searchQuery) &&
                      !productName.toLowerCase().contains(_searchQuery)) {
                    return const SizedBox();
                  }

                  return Dismissible(
                    key: ValueKey('pconv_${chatDoc.id}'),
                    background: _swipeBg(
                      color: config.colorScheme.primary,
                      icon: isPinned
                          ? Icons.push_pin_outlined
                          : Icons.push_pin_rounded,
                      label: isPinned ? 'เลิกปักหมุด' : 'ปักหมุด',
                      alignment: Alignment.centerLeft,
                    ),
                    secondaryBackground: _swipeBg(
                      color: Colors.orange,
                      icon: Icons.archive_rounded,
                      label: isArchived ? 'ยกเลิกจัดเก็บ' : 'จัดเก็บ',
                      alignment: Alignment.centerRight,
                    ),
                    confirmDismiss: (direction) async {
                      if (direction == DismissDirection.startToEnd) {
                        _togglePin(stateKey);
                      } else {
                        _toggleArchive(stateKey);
                      }
                      return false;
                    },
                    child: EnhancedChatTile(
                      name: name,
                      secondaryName: productName,
                      photo: photo,
                      lastMessage: lastMessage,
                      timestamp: timestamp,
                      unreadCount: unreadCount,
                      isOnline: isOnline,
                      lastSeen: isOnline ? null : lastSeen,
                      isPinned: isPinned,
                      isArchived: isArchived,
                      isLastMessageMine: lastSenderId == currentUid,
                      badgeColor: Colors.orange,
                      config: config,
                      onLongPress: () => _showChatOptions(
                        context,
                        convId: stateKey,
                        name: name,
                        otherUserId: otherUserId,
                        collection: 'product_chats',
                        userData: userData,
                      ),
                      onProfileTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ProfileScreen(
                            userId: otherUserId,
                            isBackButtonEnabled: true,
                          ),
                        ),
                      ),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ChatScreen(
                              conversationId: chatDoc.id,
                              otherUserId: otherUserId,
                              otherUserName: rawName,
                              otherUserPhoto: photo,
                              collection: 'product_chats',
                            ),
                          ),
                        );
                        _chatService.markProductChatAsRead(chatDoc.id);
                      },
                    ),
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  Widget _buildEmptyState({
    required MessageListConfig config,
    required IconData icon,
    required String title,
    required String subtitle,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: config.colorScheme.primary.withOpacity(0.1),
              ),
              child: Icon(
                icon,
                size: 48,
                color: config.colorScheme.primary.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: GoogleFonts.kanit(
                color: config.colorScheme.onSurface,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: GoogleFonts.kanit(
                color: config.colorScheme.onSurface.withOpacity(0.5),
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  backgroundColor: config.colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 28,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      config.isRounded ? 14 : 8,
                    ),
                  ),
                  textStyle: GoogleFonts.kanit(fontWeight: FontWeight.bold),
                ),
                child: Text(actionLabel),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildShimmerList(MessageListConfig config) {
    return ListView.builder(
      padding: const EdgeInsets.only(top: 8),
      itemCount: 6,
      itemBuilder: (context, i) {
        return Shimmer.fromColors(
          baseColor: config.colorScheme.primary.withOpacity(0.1),
          highlightColor: config.colorScheme.primary.withOpacity(0.05),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white.withOpacity(0.3),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 140,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        height: 10,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─── Sliver Header Delegate ──────────────────────────────────────────────────

class _SliverHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final double minHeight;
  final double maxHeight;

  _SliverHeaderDelegate({
    required this.child,
    required this.minHeight,
    required this.maxHeight,
  });

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return child;
  }

  @override
  double get maxExtent => maxHeight;

  @override
  double get minExtent => minHeight;

  @override
  bool shouldRebuild(covariant _SliverHeaderDelegate oldDelegate) {
    return oldDelegate.child != child ||
        oldDelegate.minHeight != minHeight ||
        oldDelegate.maxHeight != maxHeight;
  }
}

// เพิ่ม Provider ที่จำเป็น
class ChangeNotifierProvider extends InheritedWidget {
  final MessageListConfig config;

  const ChangeNotifierProvider({
    super.key,
    required this.config,
    required super.child,
  });

  static ChangeNotifierProvider? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ChangeNotifierProvider>();
  }

  @override
  bool updateShouldNotify(ChangeNotifierProvider oldWidget) {
    return config != oldWidget.config;
  }
}
