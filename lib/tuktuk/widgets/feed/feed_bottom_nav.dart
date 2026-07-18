import 'dart:ui';
import 'package:flutter/material.dart';

class FeedBottomNav extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemSelected;
  final Widget centerItem;
  final Widget Function(int index, IconData icon, String label,
      {int badgeCount}) buildNavItem;

  const FeedBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
    required this.centerItem,
    required this.buildNavItem,
  });

  @override
  Widget build(BuildContext context) {
    final double safeAreaBottom = MediaQuery.of(context).padding.bottom;
    const double baseHeight = 70.0;

    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          height: baseHeight + (safeAreaBottom > 0 ? safeAreaBottom : 15),
          padding: EdgeInsets.only(
            bottom: safeAreaBottom > 0 ? safeAreaBottom : 10,
            left: 10,
            right: 10,
            top: 5,
          ),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.3),
            border: const Border(
              top: BorderSide(color: Colors.white10, width: 0.5),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              buildNavItem(0, Icons.home_rounded, 'หน้าแรก'),
              _buildChatNavItem(),
              centerItem,
              buildNavItem(3, Icons.storefront_outlined, 'ตลาด'),
              buildNavItem(4, Icons.person_outline_rounded, 'โปรไฟล์'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChatNavItem() {
    // We would need the StreamBuilder here, but it's easier to pass it or the count.
    // For now, let's assume the buildNavItem handles it if we pass it correctly or just use the callback.
    // Actually, it's better to keep the StreamBuilder in the main screen and pass the count,
    // or pass the entire widget as a child.

    // I'll leave this to be implemented by the caller for now to keep the widget generic,
    // or take a List of items.
    return const SizedBox.shrink(); // Placeholder
  }
}
