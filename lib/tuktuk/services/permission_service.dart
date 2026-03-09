import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../screens/privacy_notice_screen.dart';
import '../widgets/permission_notice_sheet.dart';

class TukTukPermissionService {
  static final TukTukPermissionService _instance =
      TukTukPermissionService._internal();
  factory TukTukPermissionService() => _instance;
  TukTukPermissionService._internal();

  static const String _privacyKey = 'tuktuk_privacy_accepted';

  /// Ensure the user has accepted the general privacy policy once.
  Future<bool> ensurePrivacyPolicyAccepted(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    final bool isAccepted = prefs.getBool(_privacyKey) ?? false;

    if (isAccepted) return true;

    // Show Privacy Notice Screen (as a modal or full screen)
    final acceptedNow = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => const PrivacyNoticeScreen(),
        fullscreenDialog: true,
      ),
    );

    if (acceptedNow == true || acceptedNow == null) {
      // We consider dismissing it as accepted for UX flow, or we can force it
      await prefs.setBool(_privacyKey, true);
      return true;
    }
    return false;
  }

  /// Request a specific permission with a graceful UI explanation
  Future<bool> requestPermission(
    BuildContext context, {
    required Permission permission,
    required String title,
    required String description,
    required IconData icon,
    bool forceDialog = false,
  }) async {
    // 0. Ensure Privacy Policy is seen first for high-level sensitive permissions
    if (permission == Permission.location ||
        permission == Permission.camera ||
        permission == Permission.microphone) {
      await ensurePrivacyPolicyAccepted(context);
    }

    // 1. Check current status
    final status = await permission.status;

    // If already granted, return true
    if (status.isGranted) return true;

    // 2. If denied or first time (or forceDialog), show explanation before system prompt
    final shouldShowExplanation =
        status.isDenied || status.isRestricted || forceDialog;

    if (shouldShowExplanation) {
      final explained = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => PermissionNoticeSheet(
          title: title,
          description: description,
          icon: icon,
          permission: permission,
        ),
      );

      // If user dismissed explanation without clicking "Allow", return false
      if (explained != true) return false;
    }

    // 3. Trigger system prompt
    final result = await permission.request();

    // 4. Handle permanently denied (redirect to settings)
    if (result.isPermanentlyDenied) {
      final openSettings = await _showPermanentlyDeniedDialog(context, title);
      if (openSettings == true) {
        await openAppSettings();
      }
      return false;
    }

    return result.isGranted;
  }

  /// Specialized request for Location (handles service enabled check)
  Future<bool> requestLocationPermission(BuildContext context) async {
    return requestPermission(
      context,
      permission: Permission.location,
      title: 'ขอเข้าถึงตำแหน่งของคุณ 📍',
      description:
          'เราใช้ตำแหน่งเพื่อค้นหาร้านค้าและสินค้าที่อยู่ใกล้ตัวคุณ รวมถึงช่วยในการระบุที่อยู่จัดส่งให้แม่นยำที่สุดสำหรับชุมชน',
      icon: Icons.location_on_rounded,
    );
  }

  /// Specialized request for Camera & Mic (for Live/Call)
  Future<bool> requestMediaPermissions(BuildContext context) async {
    final camera = await requestPermission(
      context,
      permission: Permission.camera,
      title: 'ขอเข้าถึงกล้อง 🎥',
      description:
          'กล้องจะถูกใช้สำหรับการ Live Commerce, การถ่ายรูปสินค้า และการสนทนาวิดีโอเพื่อความปลอดภัย',
      icon: Icons.camera_alt_rounded,
    );
    if (!camera) return false;

    final mic = await requestPermission(
      context,
      permission: Permission.microphone,
      title: 'ขอเข้าถึงไมโครโฟน 🎙️',
      description:
          'ไมโครโฟนจะถูกใช้สำหรับส่งเสียงในขณะ Live หรือการสนทนาทางเสียงตรงกับผู้ขายในพื้นที่',
      icon: Icons.mic_rounded,
    );
    return mic;
  }

  /// Specialized request for Notifications (FCM)
  Future<bool> requestNotificationPermission(BuildContext context) async {
    return requestPermission(
      context,
      permission: Permission.notification,
      title: 'เปิดการแจ้งเตือน 🔔',
      description:
          'ไม่พลาดออเดอร์ใหม่, ข้อความจากพละเมืองในชุมชน, และสถานะการจัดส่งสินค้าของคุณแบบเรียลไทม์',
      icon: Icons.notifications_active_rounded,
    );
  }

  Future<bool?> _showPermanentlyDeniedDialog(
      BuildContext context, String title) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF111827),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(title,
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: Colors.white)),
        content: const Text(
          'ดูเหมือนว่าคุณได้ปฏิเสธการเข้าถึงอย่างถาวร กรุณาไปที่การตั้งค่าเพื่อเปิดสิทธิ์การใช้งานนี้ด้วยตนเอง เพื่อความปลอดภัยและการใช้งานที่ครบถ้วน',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ไม่ใช่ตอนนี้',
                style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4F46E5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('เปิดการตั้งค่า',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
