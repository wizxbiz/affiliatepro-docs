import 'package:caculateapp/tuktuk/screens/profile_screen.dart';
import 'package:caculateapp/tuktuk/screens/video_viewer_screen.dart';
import 'package:caculateapp/tuktuk/screens/product_detail_screen.dart';
import 'package:flutter/material.dart';

/// Service สำหรับจัดการ Deep Links ของ TukTuk
/// รองรับ: วิดีโอ, โปรไฟล์สมาชิก (QR Code), และลิงก์แชร์
class TukTukDeepLinkHandler {
  static TukTukDeepLinkHandler? _instance;
  static TukTukDeepLinkHandler get instance =>
      _instance ??= TukTukDeepLinkHandler._();

  TukTukDeepLinkHandler._();

  // ============================================================
  // MAIN ENTRY POINT
  // ============================================================

  /// Parse และ handle deep link
  /// Returns true ถ้า handle สำเร็จ
  bool handleDeepLink(BuildContext context, String link) {
    final uri = Uri.tryParse(link);
    if (uri == null) return false;

    // 1. Handle profile links (QR Code scan → navigate to member profile)
    if (_isProfileLink(uri)) {
      final uid = _extractUid(uri);
      if (uid != null && uid.isNotEmpty) {
        _navigateToProfile(context, uid);
        return true;
      }
    }

    // 2. Handle video links
    if (_isVideoLink(uri)) {
      final postId = _extractPostId(uri);
      if (postId != null && postId.isNotEmpty) {
        _navigateToVideo(context, postId);
        return true;
      }
    }

    // 3. Handle marketplace product links
    if (_isProductLink(uri)) {
      final productId = _extractProductId(uri);
      if (productId != null && productId.isNotEmpty) {
        _navigateToProduct(context, productId);
        return true;
      }
    }

    return false;
  }

  // ============================================================
  // PROFILE DEEP LINK  (tuktuk://profile?uid=XXX&source=qr)
  // ============================================================

  /// ตรวจสอบว่าเป็นลิงก์โปรไฟล์สมาชิกหรือไม่
  bool _isProfileLink(Uri uri) {
    // tuktuk://profile?uid=...
    if (uri.scheme == 'tuktuk' && uri.host == 'profile') return true;

    // https://wizmobiz.com/tuktuk/profile/{uid}
    if (uri.host == 'wizmobiz.com' &&
        uri.pathSegments.length >= 3 &&
        uri.pathSegments[0] == 'tuktuk' &&
        uri.pathSegments[1] == 'profile') {
      return true;
    }

    // Query parameter uid (fallback)
    if (uri.queryParameters.containsKey('uid') &&
        !uri.queryParameters.containsKey('postId')) {
      return true;
    }

    return false;
  }

  /// ดึง UID สมาชิกจาก URI
  String? _extractUid(Uri uri) {
    // tuktuk://profile?uid=XXX
    if (uri.queryParameters.containsKey('uid')) {
      return uri.queryParameters['uid'];
    }

    // https://wizmobiz.com/tuktuk/profile/{uid}
    if (uri.pathSegments.length >= 3 && uri.pathSegments[1] == 'profile') {
      return uri.pathSegments[2];
    }

    return null;
  }

  /// นำทางไปยังหน้าโปรไฟล์สมาชิก
  void _navigateToProfile(BuildContext context, String uid) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProfileScreen(
          userId: uid,
          isBackButtonEnabled: true,
        ),
      ),
    );
  }

  // ============================================================
  // VIDEO DEEP LINK
  // ============================================================

  /// ตรวจสอบว่าเป็นลิงก์วิดีโอหรือไม่
  bool _isVideoLink(Uri uri) {
    // Check for wizmobiz.com/tuktuk/video/...
    if (uri.host == 'wizmobiz.com' &&
        uri.pathSegments.length >= 3 &&
        uri.pathSegments[0] == 'tuktuk' &&
        uri.pathSegments[1] == 'video') {
      return true;
    }

    // Check for tuktuk://video/...
    if (uri.scheme == 'tuktuk' &&
        uri.pathSegments.isNotEmpty &&
        uri.pathSegments[0] == 'video') {
      return true;
    }

    // Check for query parameter postId
    if (uri.queryParameters.containsKey('postId')) {
      return true;
    }

    return false;
  }

  /// ดึง postId จาก URI
  String? _extractPostId(Uri uri) {
    // Path format: /tuktuk/video/{postId}
    if (uri.pathSegments.length >= 3 &&
        uri.pathSegments[0] == 'tuktuk' &&
        uri.pathSegments[1] == 'video') {
      return uri.pathSegments[2];
    }

    // tuktuk://video/{postId}
    if (uri.scheme == 'tuktuk' &&
        uri.pathSegments.isNotEmpty &&
        uri.pathSegments[0] == 'video' &&
        uri.pathSegments.length >= 2) {
      return uri.pathSegments[1];
    }

    // Query parameter: ?postId=xxx
    return uri.queryParameters['postId'];
  }

  /// นำทางไปยังหน้าดูวิดีโอ
  void _navigateToVideo(BuildContext context, String postId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoViewerScreen(postId: postId),
      ),
    );
  }

  // ============================================================
  // PRODUCT DEEP LINK
  // ============================================================

  /// ตรวจสอบว่าเป็นลิงก์สินค้าหรือไม่
  bool _isProductLink(Uri uri) {
    if ((uri.host == 'wizmobiz.com' || uri.host == 'tuktukfeed.com') &&
        uri.path.contains('market')) {
      return true;
    }
    if (uri.scheme == 'tuktuk' &&
        uri.pathSegments.isNotEmpty &&
        uri.pathSegments[0] == 'market') {
      return true;
    }
    if (uri.queryParameters.containsKey('product') ||
        uri.queryParameters.containsKey('productId')) {
      return true;
    }
    return false;
  }

  /// ดึง productId จาก URI
  String? _extractProductId(Uri uri) {
    if (uri.pathSegments.length >= 3 &&
        uri.pathSegments[0] == 'tuktuk' &&
        uri.pathSegments[1] == 'market') {
      return uri.pathSegments[2];
    }
    if (uri.scheme == 'tuktuk' &&
        uri.pathSegments.isNotEmpty &&
        uri.pathSegments[0] == 'market' &&
        uri.pathSegments.length >= 2) {
      return uri.pathSegments[1];
    }
    return uri.queryParameters['product'] ?? uri.queryParameters['productId'];
  }

  /// นำทางไปยังหน้าดูสินค้า
  void _navigateToProduct(BuildContext context, String productId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailScreen(productId: productId),
      ),
    );
  }

  // ============================================================
  // CONVENIENCE METHODS
  // ============================================================

  /// Open video directly from post ID
  void openVideo(BuildContext context, String postId) {
    _navigateToVideo(context, postId);
  }

  /// Open profile directly from UID (e.g., from QR scan result)
  void openProfile(BuildContext context, String uid) {
    _navigateToProfile(context, uid);
  }

  /// Open video from Map data
  void openVideoFromData(
    BuildContext context,
    Map<String, dynamic> postData,
    String videoUrl,
  ) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VideoViewerScreen(
          postData: postData,
          videoUrl: videoUrl,
        ),
      ),
    );
  }

  // ============================================================
  // LINK BUILDER HELPERS
  // ============================================================

  /// สร้าง deep link สำหรับโปรไฟล์สมาชิก (ใช้ใน QR Code)
  static String buildProfileLink(String uid, {String? displayName}) {
    final name = (displayName ?? 'user').replaceAll(' ', '_');
    return 'tuktuk://profile?uid=$uid&name=$name&source=qr&v=2';
  }

  /// สร้าง web fallback link สำหรับโปรไฟล์ (ใช้แชร์ออกนอกแอป)
  static String buildProfileWebLink(String uid) {
    return 'https://wizmobiz.com/tuktuk/profile/$uid';
  }

  /// สร้าง deep link สำหรับวิดีโอ
  static String buildVideoLink(String postId) {
    return 'tuktuk://video/$postId';
  }

  /// สร้าง deep link สำหรับสินค้า
  static String buildProductLink(String productId) {
    return 'tuktuk://market/$productId';
  }
}
