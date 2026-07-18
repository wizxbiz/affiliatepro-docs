import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:flutter/material.dart';

class LocationRequestSheet extends StatefulWidget {
  const LocationRequestSheet({super.key});

  @override
  State<LocationRequestSheet> createState() => _LocationRequestSheetState();
}

class _LocationRequestSheetState extends State<LocationRequestSheet> {
  bool _isLoading = false;

  Future<void> _handleAllow() async {
    setState(() => _isLoading = true);
    try {
      final pos = await TukTukLocationService().getCurrentLocationAndSync();
      if (mounted) {
        if (pos != null) {
          Navigator.pop(context, true);
        } else {
          // If denied or error, we just close
          Navigator.pop(context, false);
        }
      }
    } catch (e) {
      if (mounted) Navigator.pop(context, false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 40,
            spreadRadius: 10,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle Bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Lottie or Icon
          ZoomIn(
            duration: const Duration(milliseconds: 600),
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFFFF0050).withValues(alpha: 0.2),
                    const Color(0xFF00F2EA).withValues(alpha: 0.2),
                  ],
                ),
              ),
              child: const Center(
                child: Icon(
                  Icons.location_on_rounded,
                  size: 50,
                  color: Colors.white,
                ),
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Title
          FadeInUp(
            duration: const Duration(milliseconds: 400),
            child: const Text(
              'เราต้องการตำแหน่งของคุณ',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          const SizedBox(height: 16),

          // Description
          FadeInUp(
            delay: const Duration(milliseconds: 200),
            duration: const Duration(milliseconds: 400),
            child: Text(
              'เพื่อให้ประสบการณ์การชม TukTuk ที่ดีที่สุด\nช่วยให้คุณค้นพบวิดีโอ เพื่อน และสินค้าใกล้ตัวได้แม่นยำยิ่งขึ้น',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.6),
                fontSize: 15,
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          const SizedBox(height: 40),

          // Buttons
          Column(
            children: [
              FadeInUp(
                delay: const Duration(milliseconds: 400),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleAllow,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.black,
                            ),
                          )
                        : const Text(
                            'อนุญาตให้เข้าถึง',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: TextButton(
                    onPressed:
                        _isLoading ? null : () => Navigator.pop(context, false),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white54,
                    ),
                    child: const Text(
                      'ไว้ทีหลัง',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Privacy note
          Text(
            'เราจะใช้ตำแหน่งของคุณเพื่อปรับปรุงเนื้อหาเท่านั้น\nศึกษาข้อมูลเพิ่มเติมได้ที่ นโยบายความเป็นส่วนตัว',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.3),
              fontSize: 11,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// Helper method to show the sheet
Future<bool?> showLocationRequestSheet(BuildContext context) {
  return showModalBottomSheet<bool>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (context) => const LocationRequestSheet(),
  );
}
