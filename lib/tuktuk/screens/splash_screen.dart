import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/tuktuk_feed_screen.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class TukTukSplashScreen extends StatefulWidget {
  const TukTukSplashScreen({super.key});

  @override
  State<TukTukSplashScreen> createState() => _TukTukSplashScreenState();
}

class _TukTukSplashScreenState extends State<TukTukSplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    // Initialize Controller
    try {
      _controller = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 2000),
      );

      _scaleAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeInOutCubic),
      );

      _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeIn),
      );

      _controller.forward();
    } catch (e) {
      debugPrint("Animation Init Error: $e");
    }

    // Navigate as soon as logo animation is visible (~1.5s feels snappy)
    _navigateToHome(delay: 1500);
  }

  void _navigateToHome({required int delay}) {
    Future.delayed(Duration(milliseconds: delay), () {
      if (mounted) {
        debugPrint("Splash -> Feed Screen");
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                const TukTukFeedScreen(),
            transitionsBuilder:
                (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
            transitionDuration: const Duration(milliseconds: 800),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background Gradient Animation
          FadeIn(
            duration: const Duration(seconds: 2),
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.2),
                  radius: 1.5,
                  colors: [
                    const Color(0xFF00d9ff).withValues(alpha: 0.15),
                    const Color(0xFFff0050).withValues(alpha: 0.05),
                    Colors.black,
                  ],
                ),
              ),
            ),
          ),

          // Central Logo Animation
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedBuilder(
                  animation: _controller,
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _scaleAnimation.value,
                      child: Opacity(
                        opacity: _opacityAnimation.value,
                        child: Container(
                          width: 150,
                          height: 150,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF00d9ff).withValues(alpha: 0.4),
                                blurRadius: 40,
                                spreadRadius: 5,
                              ),
                              BoxShadow(
                                color: const Color(0xFFff0050).withValues(alpha: 0.3),
                                blurRadius: 60,
                                spreadRadius: -10,
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: Image.asset(
                              'assets/images/tuktuk.png',
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 30),
                FadeInUp(
                  delay: const Duration(milliseconds: 500),
                  duration: const Duration(milliseconds: 1000),
                  child: Text(
                    'TukTuk',
                    style: GoogleFonts.kanit(
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 2,
                      shadows: [
                        Shadow(
                          color: const Color(0xFF00d9ff).withValues(alpha: 0.8),
                          blurRadius: 20,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                FadeInUp(
                  delay: const Duration(milliseconds: 800),
                  child: Text(
                    'The Future of Thai Social',
                    style: GoogleFonts.kanit(
                      fontSize: 16,
                      color: Colors.white54,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Loading Indicator at bottom
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: FadeIn(
                delay: const Duration(milliseconds: 1000),
                child: SizedBox(
                  width: 30,
                  height: 30,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                        const Color(0xFF00d9ff).withValues(alpha: 0.7),),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
