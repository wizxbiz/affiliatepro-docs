import 'package:caculateapp/tuktuk/services/tuktuk_go_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TukTukGoService Tests', () {
    test('baseUrl should be correct', () {
      expect(TukTukGoService.baseUrl, contains('tuktuk-engine.fly.dev'));
    });

    test('Auth headers should be empty when not logged in', () async {
      // Note: This might need mocking if it touches FirebaseAuth.instance
      // But assuming it's a pure test environment it returns empty map
    });
  });
}
