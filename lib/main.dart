import 'dart:async';

import 'package:caculateapp/firebase_options.dart';
import 'package:caculateapp/tuktuk/screens/login_screen.dart';
import 'package:caculateapp/tuktuk/screens/register_screen.dart';
import 'package:caculateapp/tuktuk/screens/splash_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_line_sdk/flutter_line_sdk.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';

// LINE Login Channel ID — can override at build time:
//   flutter run --dart-define=LINE_CHANNEL_ID=YOUR_CHANNEL_ID
const String _lineChannelId = String.fromEnvironment(
  'LINE_CHANNEL_ID',
  defaultValue: '2009159046', // Tuktukfeed Thailand LINE Login channel
);

void main() {
  runZonedGuarded(() async {
    debugPrint('Starting app within zone...');
    WidgetsFlutterBinding.ensureInitialized();

    // Initialize LINE SDK from dart-define/default before any login() call.
    final String finalLineId = _lineChannelId;
    try {
      await LineSDK.instance.setup(finalLineId);
      debugPrint('LINE SDK initialized with channel: $finalLineId');
    } catch (e) {
      debugPrint('LINE SDK setup warning: $e');
    }

    // Initialize Locale data
    await initializeDateFormatting('th', null);

    // Initialize Firebase
    try {
      if (Firebase.apps.isEmpty) {
        debugPrint('Initializing Firebase with options...');
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );

        // 💾 Enable Firestore Persistence (Offline Storage — bounded 512MB to prevent OOM)
        FirebaseFirestore.instance.settings = const Settings(
          persistenceEnabled: true,
          cacheSizeBytes:
              512 * 1024 * 1024, // ✅ 512MB max; prevents runaway disk usage
        );

        debugPrint('Firebase initialized with persistence.');
      } else {
        debugPrint('Firebase already initialized.');
      }
    } catch (e) {
      // In case of any race condition or weird state, just log and continue.
      // The goal is not to crash main().
      debugPrint('Firebase initialization warning: $e');
    }

    // Initialize Firebase App Check
    try {
      debugPrint('Initializing Firebase App Check...');
      await FirebaseAppCheck.instance.activate(
        // ✅ Use new non-deprecated provider class instances
        providerAndroid: kDebugMode
            ? const AndroidDebugProvider()
            : const AndroidPlayIntegrityProvider(),
        providerApple: kDebugMode
            ? const AppleDebugProvider()
            : const AppleAppAttestProvider(),
      );
      debugPrint('Firebase App Check initialized.');
    } catch (e) {
      debugPrint('Firebase App Check initialization failed: $e');
    }

    // ✅ MEMORY OPTIMIZATION: Cap CachedNetworkImage in-memory cache
    // Prevents OOM when scrolling through hundreds of product/user images in feed
    PaintingBinding.instance.imageCache.maximumSize = 200; // max 200 images
    PaintingBinding.instance.imageCache.maximumSizeBytes =
        100 * 1024 * 1024; // 100 MB cap

    // Set transparent status bar
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    // 🛡️ Suppress known Flutter framework debug assertions that are not our code.
    // mouse_tracker.dart assertion fires on Android USB-debug when CameraPreview
    // sends synthetic pointer events (Flutter issue #116653). Non-fatal, debug-only.
    // All other errors are still shown normally.
    if (kDebugMode) {
      FlutterError.onError = (FlutterErrorDetails details) {
        final msg = details.exception.toString();
        if (msg.contains('mouse_tracker') ||
            msg.contains('PointerAddedEvent') ||
            msg.contains('PointerRemovedEvent')) {
          // Silently discard — known framework bug, not our code.
          return;
        }
        // All real errors still shown
        FlutterError.presentError(details);
      };
    }

    debugPrint('Running app...');
    runApp(const TukTukApp());
  }, (error, stack) {
    debugPrint('Caught unhandled error: $error');
    debugPrint(stack.toString());
  });
}

class TukTukApp extends StatelessWidget {
  const TukTukApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TukTuk Feed',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.orange,
        scaffoldBackgroundColor: Colors.black,
        // Using a more resilient way to set fonts
        textTheme: _buildTheme(context),
      ),
      home: const TukTukSplashScreen(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/register_seller': (context) => const RegisterScreen(),
      },
    );
  }

  TextTheme _buildTheme(BuildContext context) {
    try {
      return GoogleFonts.kanitTextTheme(ThemeData.dark().textTheme);
    } catch (e) {
      debugPrint('GoogleFonts Error: $e');
      return ThemeData.dark().textTheme;
    }
  }
}
