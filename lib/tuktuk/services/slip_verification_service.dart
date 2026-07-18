import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class SlipVerificationService {
  // 🇹🇭 SlipOK API — inject ผ่าน --dart-define ตอน build/run
  // ตัวอย่าง: flutter run --dart-define=SLIPOK_API_KEY=sk_xxx
  // ถ้าไม่มี key จะ fallback เป็น Simulator โดยอัตโนมัติ
  static const String _apiKey =
      String.fromEnvironment('SLIPOK_API_KEY', defaultValue: '');
  static const String _branchId =
      String.fromEnvironment('SLIPOK_BRANCH_ID', defaultValue: '');

  /// ฟังก์ชันตรวจสอบสลิปอัตโนมัติ
  /// [price] ยอดเงินที่ต้องการตรวจสอบ
  /// [slipFile] ไฟล์รูปภาพสลิปที่ลูกค้าอัปโหลด
  Future<Map<String, dynamic>> verifySlip({
    required String price,
    required File slipFile,
  }) async {
    if (_apiKey.isNotEmpty) {
      return _verifyWithSlipOK(price: price, slipFile: slipFile);
    }
    return _simulateVerification(price: price, slipFile: slipFile);
  }

  /// เชื่อมต่อกับ SlipOK API จริง (ต้องมี SLIPOK_API_KEY)
  Future<Map<String, dynamic>> _verifyWithSlipOK({
    required String price,
    required File slipFile,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('https://api.slipok.com/api/v1/main/verify/'),
      );
      request.headers['x-lib-apikey'] = _apiKey;
      request.fields['amount'] = price.replaceAll(',', '');
      if (_branchId.isNotEmpty) {
        request.fields['branchId'] = _branchId;
      }
      request.files.add(
          await http.MultipartFile.fromPath('files', slipFile.path),);

      final response = await request.send();
      final responseData = await response.stream.bytesToString();
      final json = jsonDecode(responseData) as Map<String, dynamic>;

      if (response.statusCode == 200 && json['success'] == true) {
        return {
          'success': true,
          'message': 'ตรวจสอบสำเร็จ',
          'transId': json['data']?['transRef'] ??
              'SLP-${DateTime.now().millisecondsSinceEpoch}',
          'data': json['data'],
        };
      } else {
        return {
          'success': false,
          'message': json['message'] ?? 'สลิปไม่ถูกต้อง กรุณาลองใหม่',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'เกิดข้อผิดพลาดในการตรวจสอบ: $e',
      };
    }
  }

  /// ระบบจำลอง — ใช้เมื่อไม่มี SLIPOK_API_KEY
  Future<Map<String, dynamic>> _simulateVerification({
    required String price,
    required File slipFile,
  }) async {
    await Future.delayed(const Duration(seconds: 3));
    final requestedAmount = double.tryParse(price.replaceAll(',', '')) ?? 0;
    if (slipFile.existsSync() && requestedAmount > 0) {
      return {
        'success': true,
        'message': 'ตรวจสอบสำเร็จ (Demo Mode)',
        'transId': 'DEMO-${DateTime.now().millisecondsSinceEpoch}',
      };
    }
    return {
      'success': false,
      'message': 'ไม่พบลายน้ำธนาคาร หรือยอดเงินไม่ถูกต้อง กรุณาลองใหม่',
    };
  }
}
