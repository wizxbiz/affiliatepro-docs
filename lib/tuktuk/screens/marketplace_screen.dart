import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';

import '../services/search_service.dart';
import '../services/tuktuk_bridge.dart';
import '../widgets/common/tuktuk_error_widget.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/search_filter_sheet.dart';
import 'create_post_screen.dart';
import 'post_product_screen.dart';
import 'product_detail_screen.dart';
import 'register_screen.dart';
import 'seller_dashboard_screen.dart';

// ==================== ธีมและการปรับแต่ง ====================
class MarketplaceTheme {
  // โหมดสี
  static const Map<String, ColorScheme> colorSchemes = {
    'cosmic': ColorScheme.dark(
      primary: Color(0xFF00D2FF),
      secondary: Color(0xFF7C3AED),
      surface: Color(0xFF1A1F35),
      background: Color(0xFF0A0E21),
      error: Color(0xFFFF4D4D),
      onPrimary: Colors.black,
      onSecondary: Colors.white,
      onSurface: Colors.white,
      onBackground: Colors.white,
    ),
    'midnight': ColorScheme.dark(
      primary: Color(0xFF60A5FA),
      secondary: Color(0xFFA78BFA),
      surface: Color(0xFF1E293B),
      background: Color(0xFF0F172A),
      error: Color(0xFFF87171),
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.white,
      onBackground: Colors.white,
    ),
    'emerald': ColorScheme.dark(
      primary: Color(0xFF10B981),
      secondary: Color(0xFF059669),
      surface: Color(0xFF064E3B),
      background: Color(0xFF022C22),
      error: Color(0xFFEF4444),
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.white,
      onBackground: Colors.white,
    ),
    'royal': ColorScheme.dark(
      primary: Color(0xFF8B5CF6),
      secondary: Color(0xFFD946EF),
      surface: Color(0xFF2E1065),
      background: Color(0xFF1E1B4B),
      error: Color(0xFFF87171),
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.white,
      onBackground: Colors.white,
    ),
  };

  // รูปแบบการ์ด
  static const Map<String, Map<String, dynamic>> cardStyles = {
    'modern': {
      'borderRadius': 20.0,
      'elevation': 10.0,
      'borderWidth': 0.5,
      'hasShadow': true,
      'hasGradient': true,
    },
    'classic': {
      'borderRadius': 12.0,
      'elevation': 4.0,
      'borderWidth': 1.0,
      'hasShadow': true,
      'hasGradient': false,
    },
    'minimal': {
      'borderRadius': 8.0,
      'elevation': 2.0,
      'borderWidth': 1.0,
      'hasShadow': false,
      'hasGradient': false,
    },
    'neon': {
      'borderRadius': 24.0,
      'elevation': 15.0,
      'borderWidth': 2.0,
      'hasShadow': true,
      'hasGradient': true,
      'glowEffect': true,
    },
  };
}

// ==================== คลาสจัดการธีม ====================
class MarketplaceConfig extends ChangeNotifier {
  String _currentTheme = 'cosmic';
  String _currentCardStyle = 'modern';
  bool _showAnimations = true;
  bool _showStats = true;
  bool _showTrends = true;
  bool _showBanner = true;
  bool _showFeaturedSellers = true;
  bool _compactMode = false;
  double _gridColumns = 2;
  String _viewMode = 'grid'; // grid หรือ list

  String get currentTheme => _currentTheme;
  String get currentCardStyle => _currentCardStyle;
  bool get showAnimations => _showAnimations;
  bool get showStats => _showStats;
  bool get showTrends => _showTrends;
  bool get showBanner => _showBanner;
  bool get showFeaturedSellers => _showFeaturedSellers;
  bool get compactMode => _compactMode || _gridColumns > 2;
  double get gridColumns => _gridColumns;
  String get viewMode => _viewMode;

  ColorScheme get colorScheme =>
      MarketplaceTheme.colorSchemes[_currentTheme] ??
      MarketplaceTheme.colorSchemes['cosmic']!;

  Map<String, dynamic> get cardConfig =>
      MarketplaceTheme.cardStyles[_currentCardStyle] ??
      MarketplaceTheme.cardStyles['modern']!;

  void setTheme(String theme) {
    _currentTheme = theme;
    notifyListeners();
  }

  void setCardStyle(String style) {
    _currentCardStyle = style;
    notifyListeners();
  }

  void toggleAnimations() {
    _showAnimations = !_showAnimations;
    notifyListeners();
  }

  void toggleStats() {
    _showStats = !_showStats;
    notifyListeners();
  }

  void toggleTrends() {
    _showTrends = !_showTrends;
    notifyListeners();
  }

  void toggleBanner() {
    _showBanner = !_showBanner;
    notifyListeners();
  }

  void toggleFeaturedSellers() {
    _showFeaturedSellers = !_showFeaturedSellers;
    notifyListeners();
  }

  void toggleCompactMode() {
    _compactMode = !_compactMode;
    notifyListeners();
  }

  void setGridColumns(double columns) {
    _gridColumns = columns;
    notifyListeners();
  }

  void toggleViewMode() {
    _viewMode = _viewMode == 'grid' ? 'list' : 'grid';
    notifyListeners();
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

class StarFieldBackground extends StatefulWidget {
  final Widget child;
  final ColorScheme colorScheme;

  const StarFieldBackground({
    super.key,
    required this.child,
    required this.colorScheme,
  });

  @override
  State<StarFieldBackground> createState() => _StarFieldBackgroundState();
}

class _StarFieldBackgroundState extends State<StarFieldBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<Star> _stars = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();

    for (int i = 0; i < 50; i++) {
      _stars.add(Star());
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
            ..._stars.map((star) => Positioned(
                  left: star.x * MediaQuery.of(context).size.width,
                  top: (star.y + _controller.value * star.speed) %
                          (MediaQuery.of(context).size.height + 100) -
                      50,
                  child: Opacity(
                    opacity: star.opacity *
                        (0.5 + 0.5 * math.sin(_controller.value * 2 * math.pi)),
                    child: Container(
                      width: star.size,
                      height: star.size,
                      decoration: BoxDecoration(
                        color: widget.colorScheme.primary,
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

class Star {
  double x = math.Random().nextDouble();
  double y = math.Random().nextDouble();
  double size = math.Random().nextDouble() * 3 + 1;
  double speed = math.Random().nextDouble() * 0.2 + 0.1;
  double opacity = math.Random().nextDouble() * 0.5 + 0.2;
}

// ==================== แผงการตั้งค่า ====================
class MarketplaceSettings extends StatelessWidget {
  final MarketplaceConfig config;

  const MarketplaceSettings({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: config.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Icon(Icons.palette_rounded, color: config.colorScheme.primary),
              const SizedBox(width: 12),
              Text(
                'ปรับแต่งหน้าตา',
                style: GoogleFonts.kanit(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white54),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // โหมดสี
          _buildSection(
            title: 'โหมดสี',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildThemeOption('cosmic', 'คอสมิก', const Color(0xFF00D2FF)),
                _buildThemeOption(
                    'midnight', 'เที่ยงคืน', const Color(0xFF60A5FA)),
                _buildThemeOption('emerald', 'มรกต', const Color(0xFF10B981)),
                _buildThemeOption('royal', 'ราชวงศ์', const Color(0xFF8B5CF6)),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // รูปแบบการ์ด
          _buildSection(
            title: 'สไตล์การ์ด',
            child: Row(
              children: [
                _buildCardStyleOption('modern', 'โมเดิร์น'),
                const SizedBox(width: 8),
                _buildCardStyleOption('classic', 'คลาสสิก'),
                const SizedBox(width: 8),
                _buildCardStyleOption('minimal', 'มินิมอล'),
                const SizedBox(width: 8),
                _buildCardStyleOption('neon', 'นีออน'),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // โหมดแสดงผล
          _buildSection(
            title: 'รูปแบบการแสดง',
            child: Row(
              children: [
                _buildViewModeOption('grid', 'ตาราง', Icons.grid_view_rounded),
                const SizedBox(width: 8),
                _buildViewModeOption('list', 'รายการ', Icons.view_list_rounded),
              ],
            ),
          ),

          if (config.viewMode == 'grid') ...[
            const SizedBox(height: 16),
            _buildSection(
              title: 'จำนวนคอลัมน์',
              child: Row(
                children: [
                  Expanded(
                    child: Slider(
                      value: config.gridColumns,
                      min: 1,
                      max: 3,
                      divisions: 2,
                      onChanged: config.setGridColumns,
                      activeColor: config.colorScheme.primary,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: config.colorScheme.primary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${config.gridColumns.toInt()} คอลัมน์',
                      style: GoogleFonts.kanit(
                        color: config.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 20),

          // ตัวเลือกการแสดงผล
          _buildSection(
            title: 'ส่วนประกอบ',
            child: Column(
              children: [
                _buildSwitchOption(
                    'แสดงแบนเนอร์', config.showBanner, config.toggleBanner),
                _buildSwitchOption(
                    'แสดงสถิติ', config.showStats, config.toggleStats),
                _buildSwitchOption(
                    'แสดงเทรนด์', config.showTrends, config.toggleTrends),
                _buildSwitchOption('แสดงผู้ขายแนะนำ',
                    config.showFeaturedSellers, config.toggleFeaturedSellers),
                _buildSwitchOption('แสดงอนิเมชั่น', config.showAnimations,
                    config.toggleAnimations),
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
            color: Colors.white.withOpacity(0.7),
          ),
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }

  Widget _buildThemeOption(String theme, String label, Color color) {
    return InkWell(
      onTap: () => config.setTheme(theme),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: config.currentTheme == theme
              ? LinearGradient(
                  colors: [color, color.withOpacity(0.7)],
                )
              : null,
          color: config.currentTheme == theme
              ? null
              : Colors.white.withOpacity(0.05),
          border: Border.all(
            color: config.currentTheme == theme
                ? Colors.transparent
                : Colors.white.withOpacity(0.1),
          ),
          borderRadius: BorderRadius.circular(16),
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
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.kanit(
                color:
                    config.currentTheme == theme ? Colors.black : Colors.white,
                fontWeight: config.currentTheme == theme
                    ? FontWeight.bold
                    : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardStyleOption(String style, String label) {
    return Expanded(
      child: InkWell(
        onTap: () => config.setCardStyle(style),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: config.currentCardStyle == style
                ? config.colorScheme.primary
                : Colors.white.withOpacity(0.05),
            border: Border.all(
              color: config.currentCardStyle == style
                  ? Colors.transparent
                  : Colors.white.withOpacity(0.1),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.kanit(
              color: config.currentCardStyle == style
                  ? Colors.black
                  : Colors.white,
              fontWeight: config.currentCardStyle == style
                  ? FontWeight.bold
                  : FontWeight.normal,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildViewModeOption(String mode, String label, IconData icon) {
    return Expanded(
      child: InkWell(
        onTap: () => config.toggleViewMode(),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: config.viewMode == mode
                ? config.colorScheme.primary
                : Colors.white.withOpacity(0.05),
            border: Border.all(
              color: config.viewMode == mode
                  ? Colors.transparent
                  : Colors.white.withOpacity(0.1),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color: config.viewMode == mode ? Colors.black : Colors.white,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.kanit(
                  color: config.viewMode == mode ? Colors.black : Colors.white,
                  fontWeight: config.viewMode == mode
                      ? FontWeight.bold
                      : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSwitchOption(String label, bool value, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.kanit(
              fontSize: 14,
              color: Colors.white,
            ),
          ),
          Switch(
            value: value,
            onChanged: (_) => onTap(),
            activeColor: config.colorScheme.primary,
            activeTrackColor: config.colorScheme.primary.withOpacity(0.3),
          ),
        ],
      ),
    );
  }
}

// ==================== วิเจ็ตการ์ดสินค้าปรับปรุง ====================
class EnhancedProductCard extends StatelessWidget {
  final dynamic product;
  final bool isWishlisted;
  final bool isOwner;
  final VoidCallback? onTap;
  final VoidCallback onWishlistTap;
  final VoidCallback onShareTap;
  final VoidCallback? onEditTap;
  final MarketplaceConfig config;
  final bool isSold;
  final bool isHot;
  final bool isNew;
  final String? badge;
  final int viewCount;
  final String location;
  final String name;
  final String price;
  final String? imageUrl;
  final String sellerName;
  final String? sellerPictureUrl;
  final String? sellerId;

  const EnhancedProductCard({
    super.key,
    required this.product,
    required this.isWishlisted,
    required this.isOwner,
    this.onTap,
    required this.onWishlistTap,
    required this.onShareTap,
    this.onEditTap,
    required this.config,
    required this.isSold,
    required this.isHot,
    required this.isNew,
    this.badge,
    required this.viewCount,
    required this.location,
    required this.name,
    required this.price,
    this.imageUrl,
    required this.sellerName,
    this.sellerPictureUrl,
    this.sellerId,
  });

  @override
  Widget build(BuildContext context) {
    final cardStyle = config.cardConfig;
    final borderRadius = cardStyle['borderRadius'] as double;
    final hasShadow = cardStyle['hasShadow'] as bool;
    final hasGradient = cardStyle['hasGradient'] as bool;
    final glowEffect = cardStyle['glowEffect'] as bool? ?? false;

    if (config.viewMode == 'list') {
      return _buildListTile(context);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      margin: EdgeInsets.all(config.compactMode ? 2 : 0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isSold ? null : onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          child: Container(
            decoration: BoxDecoration(
              gradient: hasGradient
                  ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        config.colorScheme.surface,
                        config.colorScheme.surface.withOpacity(0.8),
                      ],
                    )
                  : null,
              color: hasGradient ? null : config.colorScheme.surface,
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(
                color: isSold
                    ? Colors.white.withOpacity(0.05)
                    : config.colorScheme.primary.withOpacity(0.2),
                width: cardStyle['borderWidth'] as double,
              ),
              boxShadow: hasShadow
                  ? [
                      BoxShadow(
                        color: (glowEffect
                                ? config.colorScheme.primary
                                : Colors.black)
                            .withOpacity(glowEffect ? 0.3 : 0.2),
                        blurRadius: glowEffect ? 20 : 10,
                        spreadRadius: glowEffect ? 2 : 0,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(borderRadius),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        _buildProductImage(context),

                        // Sold overlay
                        if (isSold)
                          Container(
                            color: Colors.black.withOpacity(0.7),
                            child: Center(
                              child: Text(
                                'ขายแล้ว',
                                style: GoogleFonts.kanit(
                                  color: Colors.white70,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),

                        // Badge
                        if (!isSold && (isHot || isNew || badge != null))
                          Positioned(
                            top: 10,
                            left: 10,
                            child: _buildBadge(context),
                          ),

                        // Wishlist button
                        Positioned(
                          top: 8,
                          right: 8,
                          child: _buildWishlistButton(),
                        ),

                        // Owner actions
                        if (isOwner) _buildOwnerActions(),

                        // Share button for non-owners
                        if (!isOwner && !isSold) _buildShareButton(),

                        // Location bar
                        if (!config.compactMode) _buildLocationBar(),
                      ],
                    ),
                  ),
                  // Info section takes natural height, image section fills the rest
                  Padding(
                    padding: EdgeInsets.all(config.compactMode ? 8 : 12),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          maxLines: config.compactMode ? 1 : 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.kanit(
                            color: isSold ? Colors.white38 : Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: config.compactMode ? 12 : 13,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        _buildPriceRow(),
                        if (!config.compactMode) ...[
                          const SizedBox(height: 8),
                          _buildSellerInfo(context),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildListTile(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(
        horizontal: 16,
        vertical: config.compactMode ? 4 : 8,
      ),
      decoration: BoxDecoration(
        color: config.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: config.colorScheme.primary.withOpacity(0.2),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isSold ? null : onTap,
          borderRadius: BorderRadius.circular(16),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(16),
                ),
                child: SizedBox(
                  width: 100,
                  height: 100,
                  child: Stack(
                    children: [
                      _buildProductImage(context),
                      if (isSold)
                        Container(
                          color: Colors.black.withOpacity(0.7),
                          child: const Center(
                            child: Text(
                              'ขายแล้ว',
                              style: TextStyle(
                                  color: Colors.white70, fontSize: 12),
                            ),
                          ),
                        ),
                      if (!isSold && (isHot || isNew))
                        Positioned(
                          top: 4,
                          left: 4,
                          child: _buildBadge(context),
                        ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.kanit(
                          color: isSold ? Colors.white38 : Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.location_on_outlined,
                              color: config.colorScheme.primary, size: 12),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              location,
                              style: GoogleFonts.kanit(
                                color: Colors.white54,
                                fontSize: 11,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: _buildPriceRow()),
                          Row(
                            children: [
                              if (viewCount > 0) ...[
                                const Icon(Icons.visibility_rounded,
                                    color: Colors.white24, size: 14),
                                const SizedBox(width: 4),
                                Text(
                                  viewCount >= 1000
                                      ? '${(viewCount / 1000).toStringAsFixed(1)}K'
                                      : '$viewCount',
                                  style: GoogleFonts.kanit(
                                      color: Colors.white24, fontSize: 11),
                                ),
                              ],
                              const SizedBox(width: 12),
                              _buildWishlistButton(),
                            ],
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
      ),
    );
  }

  Widget _buildProductImage(BuildContext context) {
    final String? img = imageUrl;
    if (img != null &&
        img.toString().isNotEmpty &&
        !img.toString().startsWith('file:///')) {
      return Image.network(
        img,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildPlaceholderImage(),
      );
    }
    return _buildPlaceholderImage();
  }

  Widget _buildPlaceholderImage() {
    return Container(
      color: config.colorScheme.primary.withOpacity(0.1),
      child: Center(
        child: Icon(
          Icons.image_outlined,
          color: config.colorScheme.primary.withOpacity(0.3),
          size: 32,
        ),
      ),
    );
  }

  Widget _buildBadge(BuildContext context) {
    Color color;
    String label;

    if (isSold) {
      color = const Color(0xFF757575);
      label = 'ขายแล้ว';
    } else if (isHot) {
      color = const Color(0xFFFF5722);
      label = 'HOT';
    } else if (isNew) {
      color = config.colorScheme.primary;
      label = 'NEW';
    } else {
      color = config.colorScheme.secondary;
      label = badge ?? '';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color, color.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        label,
        style: GoogleFonts.outfit(
          color: Colors.white,
          fontSize: 8,
          fontWeight: FontWeight.w900,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildWishlistButton() {
    return GestureDetector(
      onTap: onWishlistTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
          border: Border.all(
            color: isWishlisted
                ? const Color(0xFFFF0050)
                : Colors.white.withOpacity(0.2),
          ),
        ),
        child: Icon(
          isWishlisted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          size: 16,
          color: isWishlisted ? const Color(0xFFFF0050) : Colors.white,
        ),
      ),
    );
  }

  Widget _buildOwnerActions() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 24,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildOwnerActionBtn(
            Icons.edit_rounded,
            const Color(0xFF00D2FF),
            onEditTap ?? () {},
          ),
          const SizedBox(width: 8),
          _buildOwnerActionBtn(
            Icons.ios_share_rounded,
            const Color(0xFF00B900),
            onShareTap,
          ),
        ],
      ),
    );
  }

  Widget _buildOwnerActionBtn(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        child: Icon(icon, color: color, size: 14),
      ),
    );
  }

  Widget _buildShareButton() {
    return Positioned(
      bottom: 28,
      right: 8,
      child: GestureDetector(
        onTap: onShareTap,
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [const Color(0xFF00B900), const Color(0xFF00D2FF)],
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF00B900).withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(Icons.share_rounded, color: Colors.white, size: 14),
        ),
      ),
    );
  }

  Widget _buildLocationBar() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.transparent,
            ],
          ),
        ),
        child: Row(
          children: [
            Icon(Icons.location_on_outlined,
                color: config.colorScheme.primary, size: 10),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                location,
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '฿',
          style: GoogleFonts.kanit(
            color: isSold ? Colors.white24 : config.colorScheme.primary,
            fontSize: config.compactMode ? 10 : 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(width: 2),
        Flexible(
          child: Text(
            price.toString(),
            style: GoogleFonts.outfit(
              color: isSold ? Colors.white24 : config.colorScheme.primary,
              fontWeight: FontWeight.bold,
              fontSize: config.compactMode ? 14 : 18,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (viewCount > 0 && !config.compactMode) ...[
          const SizedBox(width: 4),
          Icon(Icons.visibility_rounded,
              color: Colors.white24, size: config.compactMode ? 8 : 10),
          const SizedBox(width: 2),
          Text(
            viewCount >= 1000
                ? '${(viewCount / 1000).toStringAsFixed(1)}K'
                : '$viewCount',
            style: GoogleFonts.kanit(
              color: Colors.white24,
              fontSize: config.compactMode ? 8 : 9,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSellerInfo(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: sellerId != null
              ? () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => MarketplaceScreen(
                        initialSellerId: sellerId,
                        initialSellerName: sellerName,
                      ),
                    ),
                  );
                }
              : null,
          child: Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white24, width: 1),
            ),
            child: ClipOval(
              child: (sellerPictureUrl != null &&
                      sellerPictureUrl.toString().isNotEmpty &&
                      !sellerPictureUrl.toString().startsWith('file:///'))
                  ? Image.network(sellerPictureUrl!, fit: BoxFit.cover)
                  : Icon(Icons.person, size: 12, color: Colors.white24),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            sellerName,
            style: GoogleFonts.kanit(
              color: Colors.white54,
              fontSize: 10,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ==================== วิเจ็ตแบนเนอร์ปรับปรุง ====================
class EnhancedBanner extends StatelessWidget {
  final MarketplaceConfig config;

  const EnhancedBanner({super.key, required this.config});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      height: 180,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          colors: [
            config.colorScheme.primary.withOpacity(0.3),
            config.colorScheme.secondary.withOpacity(0.3),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: config.colorScheme.primary.withOpacity(0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: config.colorScheme.primary.withOpacity(0.2),
            blurRadius: 20,
            spreadRadius: 1,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Animated particles
          ...List.generate(10, (index) {
            return Positioned(
              left: math.Random().nextDouble() * 300,
              top: math.Random().nextDouble() * 150,
              child: AnimatedOpacity(
                duration: Duration(milliseconds: 500 + index * 100),
                opacity: 0.1 + 0.1 * math.sin(index.toDouble()),
                child: Container(
                  width: 20 + index * 5,
                  height: 20 + index * 5,
                  decoration: BoxDecoration(
                    color: config.colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          }),

          Positioned(
            right: -30,
            top: -20,
            child: Opacity(
              opacity: 0.1,
              child: Icon(
                Icons.shopping_bag_rounded,
                size: 200,
                color: Colors.white,
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFFFF5722),
                        const Color(0xFFFF9800)
                      ],
                    ),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Text(
                    'PROMO SPECIAL',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'สมัครวินฟรี 1 เดือน!',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'พิเศษเฉพาะสมาชิก TukTuk ที่ลงทะเบียนวันนี้เท่านั้น',
                  style: GoogleFonts.kanit(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00C300),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 12),
                    elevation: 8,
                  ),
                  child: Text(
                    'สมัครชื่อผู้ขายเลย',
                    style: GoogleFonts.kanit(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== หน้าจอหลักที่ปรับปรุง ====================
class MarketplaceScreen extends StatefulWidget {
  final String? initialSellerId;
  final String? initialSellerName;
  final String? initialCategory;
  final String? initialSearchQuery;

  const MarketplaceScreen({
    super.key,
    this.initialSellerId,
    this.initialSellerName,
    this.initialCategory,
    this.initialSearchQuery,
  });

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final _bridge = TukTukBridge();
  final _searchSvc = SearchService();
  final MarketplaceConfig _config = MarketplaceConfig();
  bool _isLoading = true;
  List<dynamic> _products = [];
  String? _error;

  String? _selectedCategory;
  String? _selectedProvince;
  bool _isOtop = false;
  double? _minPrice;
  double? _maxPrice;
  String _sortBy = 'newest';
  String _searchQuery = '';
  Map<String, dynamic>? _marketTrends;
  String? _selectedSellerId;
  String? _selectedSellerName;
  Map<String, dynamic>? _userSession;
  Set<String> _wishlist = {};
  int _tabIndex = 0;
  bool _showSettings = false;

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
    _searchQuery = widget.initialSearchQuery ?? '';
    _fetchProducts();
    _loadWishlist();
    _config.addListener(_onConfigChanged);
  }

  void _onConfigChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _config.removeListener(_onConfigChanged);
    _config.dispose();
    super.dispose();
  }

  Future<void> _fetchProducts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final session = await _bridge.getCurrentUser();
      if (mounted) setState(() => _userSession = session);

      final results = await _bridge.getMarketplaceProductsAdvanced(
        category: _selectedCategory,
        province: _selectedProvince,
        sellerId: _selectedSellerId ?? widget.initialSellerId,
        isOtop: _isOtop,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        sortBy: _sortBy,
      );

      _products = results;

      if (_searchQuery.isNotEmpty) {
        final scored = _searchSvc.search(
            _searchQuery, _products.cast<Map<String, dynamic>>());
        _products = scored.map((s) => s.product).toList();
      }

      if (mounted) {
        setState(() => _isLoading = false);
      }

      _fetchMarketTrends();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'ไม่สามารถโหลดข้อมูลสินค้าได้: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchMarketTrends() async {
    try {
      final trends = await _bridge.getMarketTrends(province: _selectedProvince);
      if (mounted) {
        setState(() => _marketTrends = trends);
      }
    } catch (e) {
      debugPrint('Error fetching trends: $e');
    }
  }

  Future<void> _loadWishlist() async {
    final prefs = await SharedPreferences.getInstance();
    final ids = prefs.getStringList('tuktuk_wishlist') ?? [];
    if (mounted) setState(() => _wishlist = ids.toSet());
  }

  Future<void> _toggleWishlist(String productId) async {
    if (productId.isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      if (_wishlist.contains(productId)) {
        _wishlist.remove(productId);
      } else {
        _wishlist.add(productId);
      }
    });
    await prefs.setStringList('tuktuk_wishlist', _wishlist.toList());
  }

  bool _isRecentProduct(dynamic createdAt) {
    if (createdAt == null) return false;
    try {
      DateTime dt;
      if (createdAt is DateTime) {
        dt = createdAt;
      } else if (createdAt is Map && createdAt['_seconds'] != null) {
        dt = DateTime.fromMillisecondsSinceEpoch(
            (createdAt['_seconds'] as int) * 1000);
      } else {
        dt = DateTime.parse(createdAt.toString());
      }
      return DateTime.now().difference(dt).inDays < 7;
    } catch (_) {
      return false;
    }
  }

  void _showSettingsDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) {
          return SingleChildScrollView(
            controller: scrollController,
            child: MarketplaceSettings(config: _config),
          );
        },
      ),
    ).then((_) {
      setState(() {
        _showSettings = false;
      });
    });
  }

  bool get _isFilterActive =>
      _selectedProvince != null ||
      _isOtop ||
      _minPrice != null ||
      _maxPrice != null ||
      _sortBy != 'newest';
  int get _activeFilterCount => [
        _selectedProvince != null,
        _isOtop,
        _minPrice != null,
        _maxPrice != null,
        _sortBy != 'newest'
      ].where((b) => b).length;

  void _showFilterSheet() async {
    final result = await showSearchFilterSheet(
      context,
      SearchFilters(
        province: _selectedProvince,
        isOtop: _isOtop,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        sortBy: _sortBy,
      ),
    );

    if (result != null) {
      setState(() {
        _selectedProvince = result.province;
        _isOtop = result.isOtop;
        _minPrice = result.minPrice;
        _maxPrice = result.maxPrice;
        _sortBy = result.sortBy;
      });
      _fetchProducts();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      config: _config,
      child: Scaffold(
        backgroundColor: _config.colorScheme.background,
        appBar: _buildAppBar(),
        body: _isLoading
            ? _buildShimmerGrid()
            : _error != null
                ? TukTukErrorWidget(message: _error!, onRetry: _fetchProducts)
                : _buildMainContent(),
        floatingActionButton: FloatingActionButton(
          onPressed: _showSettingsDialog,
          backgroundColor: _config.colorScheme.primary,
          child: const Icon(Icons.settings_rounded, color: Colors.white),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: _config.colorScheme.surface,
      elevation: 0,
      title: Text(
        _selectedSellerName ?? widget.initialSellerName ?? 'Marketplace',
        style: GoogleFonts.kanit(
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      actions: [
        IconButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => SellerDashboardScreen(
                  sellerId: _userSession?['uid'],
                  sellerName: _userSession?['displayName'],
                ),
              ),
            );
          },
          icon: Icon(Icons.storefront_rounded,
              color: _config.colorScheme.primary),
          tooltip: 'จัดการร้านค้า',
        ),
        IconButton(
          onPressed: _showFilterSheet,
          icon: Badge(
            isLabelVisible: _isFilterActive,
            label: Text(_activeFilterCount.toString()),
            child: Icon(Icons.tune_rounded, color: Colors.white),
          ),
          tooltip: 'ตัวกรอง',
        ),
        IconButton(
          onPressed: _config.toggleViewMode,
          icon: Icon(
            _config.viewMode == 'grid'
                ? Icons.view_list_rounded
                : Icons.grid_view_rounded,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    if (_config.showAnimations) {
      return StarFieldBackground(
        colorScheme: _config.colorScheme,
        child: _buildContent(),
      );
    }
    return AnimatedBackground(
      colorScheme: _config.colorScheme,
      child: _buildContent(),
    );
  }

  Widget _buildContent() {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: TukTukSearchBar(
                  onChanged: (q) {
                    setState(() => _searchQuery = q);
                    Future.microtask(_fetchProducts);
                  },
                  hintText: 'ค้นหาสินค้าในตลาด...',
                ),
              ),
              const SizedBox(height: 12),
              _buildTabSelector(),
            ],
          ),
        ),
        if (_config.showBanner)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: EnhancedBanner(config: _config),
            ),
          ),
        if (_config.showFeaturedSellers)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: _buildFeaturedSellers(),
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: _buildCategoryChips(),
          ),
        ),
        if (_config.showTrends && _marketTrends != null)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: _buildMarketTrends(),
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: _buildAIGenCTA(),
          ),
        ),
        if (_config.showStats)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: _buildStatsBanner(),
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'สินค้าแนะนำสำหรับคุณ',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        if (_products.isEmpty)
          SliverFillRemaining(
            child: _buildEmptyState(),
          )
        else if (_config.viewMode == 'grid')
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: _config.gridColumns.toInt(),
                childAspectRatio: 0.58,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final product = _products[index];
                  return _buildProductCard(product, context);
                },
                childCount: _products.length,
              ),
            ),
          )
        else
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final product = _products[index];
                return _buildProductCard(product, context);
              },
              childCount: _products.length,
            ),
          ),
      ],
    );
  }

  Widget _buildTabSelector() {
    final tabs = [
      {'icon': Icons.storefront_rounded, 'label': 'ตลาด'},
      {'icon': Icons.grass_rounded, 'label': 'OTOP/ชุมชน'},
    ];
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: _config.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Row(
        children: List.generate(tabs.length, (i) {
          final isActive = _tabIndex == i;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                if (_tabIndex == i) return;
                setState(() {
                  _tabIndex = i;
                  _isOtop = i == 1;
                });
                _fetchProducts();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  gradient: isActive
                      ? LinearGradient(
                          colors: [
                            _config.colorScheme.primary,
                            _config.colorScheme.secondary
                          ],
                        )
                      : null,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      tabs[i]['icon'] as IconData,
                      size: 16,
                      color: isActive ? Colors.black : Colors.white54,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      tabs[i]['label'] as String,
                      style: GoogleFonts.kanit(
                        color: isActive ? Colors.black : Colors.white54,
                        fontWeight:
                            isActive ? FontWeight.bold : FontWeight.normal,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(40),
      alignment: Alignment.center,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Opacity(
            opacity: 0.1,
            child: Icon(Icons.shopping_basket_outlined,
                size: 120, color: Colors.white),
          ),
          const SizedBox(height: 24),
          Text(
            'ร่วมสร้างสรรค์ตลาดใหม่ไปกับเรา',
            style: GoogleFonts.kanit(color: Colors.white38, fontSize: 18),
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const RegisterScreen()),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _config.colorScheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30)),
            ),
            child: Text('เปิดบัญชีผู้ขายเลย',
                style: GoogleFonts.kanit(
                    fontWeight: FontWeight.bold, color: Colors.black)),
          ),
        ],
      ),
    );
  }

  Widget _buildMarketTrends() {
    if (_marketTrends == null) return const SizedBox.shrink();

    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _config.colorScheme.surface.withOpacity(0.5),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: _config.colorScheme.primary.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: _config.colorScheme.primary.withOpacity(0.05),
            blurRadius: 20,
            spreadRadius: 1,
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.analytics_outlined,
                  color: _config.colorScheme.primary, size: 20),
              const SizedBox(width: 10),
              Text(
                'ข้อมูลเชิงลึกตลาด (Trends)',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _marketTrends!['growthRate'] ?? '',
                  style: GoogleFonts.outfit(
                      color: Colors.greenAccent,
                      fontSize: 10,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildTrendItem(
                  'หมวดหมู่ยอดนิยม',
                  _marketTrends!['topCategory'] ?? '',
                  Icons.local_fire_department_rounded),
              _buildTrendItem(
                  'สินค้าที่วางขาย',
                  _marketTrends!['activeMarketCount'].toString(),
                  Icons.inventory_2_outlined),
              _buildTrendItem(
                  'คนเข้าชมรวม',
                  _marketTrends!['totalMarketViews'].toString(),
                  Icons.visibility_outlined),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '📌 ข้อมูลอ้างอิงจาก ${_marketTrends!['provinceFocus']}',
            style: GoogleFonts.kanit(color: Colors.white38, fontSize: 10),
          ),
        ],
      ),
    );
  }

  Widget _buildTrendItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: _config.colorScheme.primary, size: 16),
        const SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.kanit(color: Colors.white38, fontSize: 10),
        ),
      ],
    );
  }

  Widget _buildStatsBanner() {
    final stats = [
      {'icon': Icons.people_outline, 'val': '1.2K+', 'lab': 'ผู้ขาย'},
      {'icon': Icons.shopping_bag_outlined, 'val': '8.5K+', 'lab': 'สินค้า'},
      {
        'icon': Icons.verified_user_outlined,
        'val': '100%',
        'lab': 'ยืนยันตัวตน'
      },
      {'icon': Icons.local_shipping_outlined, 'val': '24H', 'lab': 'ส่งไว'},
      {
        'icon': Icons.support_agent_outlined,
        'val': '24/7',
        'lab': 'ดูแลลูกค้า'
      },
    ];

    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: _config.colorScheme.surface.withOpacity(0.3),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _config.colorScheme.primary.withOpacity(0.1)),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: stats.map((s) {
            return Container(
              width: 85,
              margin: const EdgeInsets.only(right: 12),
              child: Column(
                children: [
                  Icon(s['icon'] as IconData,
                      color: _config.colorScheme.primary, size: 24),
                  const SizedBox(height: 8),
                  Text(
                    s['val'] as String,
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    s['lab'] as String,
                    style: GoogleFonts.kanit(
                      color: Colors.white38,
                      fontSize: 10,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildAIGenCTA() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      width: double.infinity,
      height: 100,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          colors: [_config.colorScheme.primary, _config.colorScheme.secondary],
        ),
        boxShadow: [
          BoxShadow(
            color: _config.colorScheme.primary.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreatePostScreen()),
          ),
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.auto_awesome_rounded,
                      color: Colors.white, size: 30),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI Post Generator',
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'แค่ถ่ายรูป AI ช่วยร่างโพสต์ให้ทันที',
                        style: GoogleFonts.kanit(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios_rounded,
                    color: Colors.white, size: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturedSellers() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _bridge.getLeaderboard(limit: 5),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty)
          return const SizedBox.shrink();
        final sellers = snapshot.data!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ผู้ขายแนะนำ',
              style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: sellers.length,
                separatorBuilder: (_, __) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  final seller = sellers[index];
                  final sellerId = seller['id'] ?? seller['uid'];
                  final sellerName = seller['displayName'];
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedSellerId = sellerId;
                        _selectedSellerName = sellerName;
                      });
                      _fetchProducts();
                    },
                    child: Column(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _config.colorScheme.primary,
                              width: 2,
                            ),
                          ),
                          child: CircleAvatar(
                            radius: 25,
                            backgroundImage: seller['pictureUrl'] != null
                                ? NetworkImage(seller['pictureUrl'])
                                : null,
                            child: seller['pictureUrl'] == null
                                ? Icon(Icons.person,
                                    color: _config.colorScheme.primary)
                                : null,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          sellerName ?? 'Seller',
                          style: GoogleFonts.kanit(
                              color: Colors.white70, fontSize: 10),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCategoryChips() {
    final categories = [
      {'name': 'ทั้งหมด', 'tag': null, 'icon': Icons.apps_rounded},
      {'name': 'iPhone', 'tag': 'iPhone', 'icon': Icons.phone_iphone_rounded},
      {'name': 'กล้อง', 'tag': 'กล้อง', 'icon': Icons.camera_alt_rounded},
      {'name': 'โน้ตบุ๊ก', 'tag': 'โน้ตบุ๊ก', 'icon': Icons.laptop_mac_rounded},
      {
        'name': 'มอเตอร์ไซค์',
        'tag': 'มอเตอร์ไซค์',
        'icon': Icons.motorcycle_rounded
      },
      {'name': 'ของกิน', 'tag': 'ของกิน', 'icon': Icons.restaurant_rounded},
      {
        'name': 'AI แนะนำ',
        'tag': 'AI แนะนำ',
        'icon': Icons.auto_awesome_rounded
      },
    ];
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final cat = categories[index];
          final tag = cat['tag'] as String?;
          final name = cat['name'] as String;
          final icon = cat['icon'] as IconData;
          final isSelected = _selectedCategory == tag;

          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedCategory = tag;
              });
              _fetchProducts();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? _config.colorScheme.primary
                    : _config.colorScheme.surface.withOpacity(0.5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? Colors.transparent
                      : _config.colorScheme.primary.withOpacity(0.2),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    size: 16,
                    color: isSelected ? Colors.black : Colors.white70,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    name,
                    style: GoogleFonts.kanit(
                      color: isSelected ? Colors.black : Colors.white70,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductCard(dynamic product, BuildContext context) {
    final name = product['productName'] ?? product['name'] ?? 'ไม่มีชื่อสินค้า';
    final price = product['price'] ?? 0;
    final imageUrl = product['imageUrl'] ?? product['thumbnail'];
    final sellerName = product['sellerName'] ?? 'ผู้ขาย';
    final location = product['province'] ?? product['location'] ?? 'ไม่ระบุ';
    final sellerId = product['sellerId'];
    final productId = (product['id'] ?? product['productId'] ?? '').toString();
    final int viewCount =
        (product['viewCount'] ?? product['views'] ?? 0) as int;
    final status = (product['status'] ?? '').toString();

    final bool isSold = status == 'sold';
    final bool isHot = !isSold && viewCount >= 50;
    final bool isNew =
        !isSold && !isHot && _isRecentProduct(product['createdAt']);
    final bool isWishlisted = _wishlist.contains(productId);
    final bool isOwner = sellerId != null &&
        sellerId == (_userSession?['uid'] ?? _userSession?['lineUserId']);

    return EnhancedProductCard(
      product: product,
      isWishlisted: isWishlisted,
      isOwner: isOwner,
      onTap: isSold
          ? null
          : () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ProductDetailScreen(
                    productData: product as Map<String, dynamic>,
                  ),
                ),
              );
            },
      onWishlistTap: () => _toggleWishlist(productId),
      onShareTap: () =>
          _bridge.shareProductToLine(product as Map<String, dynamic>),
      onEditTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const PostProductScreen()),
      ),
      config: _config,
      isSold: isSold,
      isHot: isHot,
      isNew: isNew,
      viewCount: viewCount,
      location: location,
      name: name,
      price: price.toString(),
      imageUrl: imageUrl,
      sellerName: sellerName,
      sellerPictureUrl: product['sellerPictureUrl'],
      sellerId: sellerId,
    );
  }

  Widget _buildShimmerGrid() {
    return Shimmer.fromColors(
      baseColor: _config.colorScheme.surface,
      highlightColor: _config.colorScheme.surface.withOpacity(0.7),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                height: 160,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverGrid(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: _config.gridColumns.toInt(),
                childAspectRatio: 0.58,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) => Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                childCount: 6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Provider ====================
class ChangeNotifierProvider extends InheritedWidget {
  final MarketplaceConfig config;

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
