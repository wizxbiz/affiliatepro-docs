import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// 🛡️ TukTuk IAM Service
/// ตัวช่วยจัดการสิทธิ์การเข้าถึง (Identity & Access Management)
class IAMService {
  static final IAMService _instance = IAMService._internal();
  factory IAMService() => _instance;
  IAMService._internal();

  /// ดึง Auth Headers สำหรับใช้กับ http client
  Future<Map<String, String>> getAuthHeaders({bool isJson = true}) async {
    final Map<String, String> headers = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        // ดึง ID Token ล่าสุด
        final String? idToken = await user.getIdToken();
        if (idToken != null) {
          headers['Authorization'] = 'Bearer $idToken';
          headers['X-TukTuk-Source'] = 'TukTuk-App-Flutter';
        }
      }
    } catch (e) {
      debugPrint('IAMService Error: $e');
    }

    return headers;
  }

  /// ตรวจสอบว่าผู้ใช้งานเข้าสู่ระบบแล้วหรือไม่
  bool get isAuthenticated => FirebaseAuth.instance.currentUser != null;

  /// ดึง UID ของผู้ใช้งานปัจจุบัน
  String? get currentUid => FirebaseAuth.instance.currentUser?.uid;
}
