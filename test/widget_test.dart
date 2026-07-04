import 'package:caculateapp/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('TukTuk App load test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    // Note: Since this app uses Firebase and VideoPlayer,
    // real widget tests would need mock dependencies.
    await tester.pumpWidget(const TukTukApp());

    // Basic check to see if the app starts
    expect(find.byType(TukTukApp), findsOneWidget);
  });
}
