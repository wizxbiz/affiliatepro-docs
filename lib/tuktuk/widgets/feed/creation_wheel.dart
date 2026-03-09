import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CreationWheelItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  CreationWheelItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
}

class CreationWheelSelector extends StatefulWidget {
  final List<CreationWheelItem> items;
  final Function(int) onItemSelected;

  const CreationWheelSelector({
    super.key,
    required this.items,
    required this.onItemSelected,
  });

  @override
  State<CreationWheelSelector> createState() => _CreationWheelSelectorState();
}

class _CreationWheelSelectorState extends State<CreationWheelSelector> {
  late PageController _pageController;
  // Center index: (5 items - 1) / 2 = 2
  double _currentPage = 2.0;

  @override
  void initState() {
    super.initState();
    _currentPage = (widget.items.length - 1) / 2;
    _pageController = PageController(
      viewportFraction: 0.3, // Visible portion of side items
      initialPage: _currentPage.toInt(),
    );
    _pageController.addListener(_onScroll);
  }

  void _onScroll() {
    setState(() {
      _currentPage = _pageController.page!;
    });
  }

  @override
  void dispose() {
    _pageController.removeListener(_onScroll);
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: PageView.builder(
        controller: _pageController,
        itemCount: widget.items.length,
        physics: const BouncingScrollPhysics(),
        onPageChanged: (index) {
          // Optional: Feedback or logic
        },
        itemBuilder: (context, index) {
          // normalized relative position from center of screen
          // 0 = center, -1 = left neighbor, +1 = right neighbor
          final double relativePos = index - _currentPage;

          // --- Physics / Geometry Config ---
          // Simulating a wheel where items rotate around a point BELOW the screen
          // This creates the "Hill" or "Arch" effect where center is highest.

          const double radius = 400.0; // Large radius for gentle curve
          const double angleStep = 25.0; // Degrees between items

          // Convert to radians
          final double angle = relativePos * angleStep * (math.pi / 180);

          // Calculate vertical offset (Arch effect)
          // At angle 0 (center), cos(0)=1, so offset is 0 (highest point)
          // As angle increases, cos decreases, so (1-cos)*R becomes positive (pushes down)
          final double dy = (1 - math.cos(angle)) * radius;

          // Calculate rotation (optional, to keep items upright or tilt them)
          // Rotate slightly with the wheel
          final double rotation = angle * 0.5;

          // Opacity & Scale for focus effect
          final double dist = relativePos.abs();
          final double scale = (1 - (dist * 0.3)).clamp(0.6, 1.1);
          final double opacity = (1 - (dist * 0.5)).clamp(0.2, 1.0);

          return Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.002) // Perspective depth
              ..translate(0.0, dy + 20) // Arch curve + base offset
              ..rotateZ(rotation) // Rotation
              ..scale(scale),
            child: Opacity(
              opacity: opacity,
              child: GestureDetector(
                onTap: () {
                  _pageController.animateToPage(
                    index,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutBack,
                  );
                  widget.items[index].onTap();
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    _buildGlassItem(widget.items[index], dist < 0.5),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGlassItem(CreationWheelItem item, bool isSelected) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: isSelected ? 80 : 64,
          height: isSelected ? 80 : 64,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(26),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: item.color.withValues(alpha: 0.4),
                      blurRadius: 30,
                      spreadRadius: -2,
                      offset: const Offset(0, 10),
                    ),
                  ]
                : null,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(26),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.12)
                      : Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(
                    color: isSelected
                        ? Colors.white.withValues(alpha: 0.3)
                        : Colors.white.withValues(alpha: 0.1),
                    width: isSelected ? 1.5 : 1.0,
                  ),
                  gradient: LinearGradient(
                    colors: isSelected
                        ? [
                            item.color.withValues(alpha: 0.5),
                            item.color.withValues(alpha: 0.15),
                          ]
                        : [
                            Colors.white.withValues(alpha: 0.15),
                            Colors.white.withValues(alpha: 0.05),
                          ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Icon(
                    item.icon,
                    color: isSelected ? Colors.white : Colors.white70,
                    size: isSelected ? 38 : 28,
                    shadows: isSelected
                        ? [
                            Shadow(
                              color: item.color.withValues(alpha: 0.8),
                              blurRadius: 10,
                            ),
                          ]
                        : null,
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: isSelected
              ? Text(
                  item.label,
                  key: ValueKey('${item.label}_sel'),
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                    shadows: [
                      Shadow(
                        color: item.color.withValues(alpha: 0.8),
                        blurRadius: 15,
                      ),
                    ],
                  ),
                )
              : Text(
                  item.label,
                  key: ValueKey('${item.label}_un'),
                  style: GoogleFonts.kanit(
                    color: Colors.white38,
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                  ),
                ),
        ),
      ],
    );
  }
}
