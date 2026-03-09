import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionNoticeSheet extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Permission permission;

  const PermissionNoticeSheet({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
    required this.permission,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = const Color(0xFF0F172A);
    final accentColor = const Color(0xFFFF6B6B);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 40,
            offset: const Offset(0, -10),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 32),

            // Icon with Glass Effect
            ZoomIn(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: accentColor.withValues(alpha: 0.2)),
                ),
                child: Icon(icon, color: accentColor, size: 40),
              ),
            ),
            const SizedBox(height: 24),

            // Title
            FadeInDown(
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: GoogleFonts.kanit(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Description
            FadeInDown(
              delay: const Duration(milliseconds: 100),
              child: Text(
                description,
                textAlign: TextAlign.center,
                style: GoogleFonts.kanit(
                  fontSize: 15,
                  color: Colors.white60,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 40),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: FadeInLeft(
                    delay: const Duration(milliseconds: 200),
                    child: TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        'ไม่ใช่ตอนนี้',
                        style: GoogleFonts.kanit(
                          color: Colors.white54,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: FadeInRight(
                    delay: const Duration(milliseconds: 200),
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        'อนุญาต',
                        style: GoogleFonts.kanit(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
