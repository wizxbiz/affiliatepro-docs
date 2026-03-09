import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RecommendationCard extends StatelessWidget {
  final VoidCallback onLoginTap;
  final VoidCallback onSellerTap;

  const RecommendationCard({
    super.key,
    required this.onLoginTap,
    required this.onSellerTap,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 24),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.white10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.5),
              blurRadius: 40,
              offset: const Offset(0, 20),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blueAccent.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_add_rounded,
                color: Colors.blueAccent,
                size: 32,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'เริ่มต้นประสบการณ์ TukTuk',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'เข้าร่วมคอมมิวนิตี้ของเราเพื่อเข้าถึงฟีเจอร์ทั้งหมด',
              style: GoogleFonts.kanit(
                color: Colors.white60,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 30),
            _buildRecommendationOption(
              icon: Icons.person_rounded,
              title: 'สมัครสมาชิกทั่วไป',
              subtitle: 'สำหรับผู้ใช้งานและครีเอเตอร์',
              color: Colors.blueAccent,
              onTap: onLoginTap,
            ),
            const SizedBox(height: 15),
            _buildRecommendationOption(
              icon: Icons.storefront_rounded,
              title: 'สมัครเป็นผู้ขาย',
              subtitle: 'เปิดร้านค้าฟรี ยอดขายปัง',
              color: Colors.orangeAccent,
              onTap: onSellerTap,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendationOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            border: Border.all(color: color.withValues(alpha: 0.3)),
            borderRadius: BorderRadius.circular(16),
            color: color.withValues(alpha: 0.1),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.kanit(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                color: Colors.white.withValues(alpha: 0.5),
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
