import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';

class GreetingOverlay extends StatelessWidget {
  final bool showGreeting;
  final double greetingOpacity;
  final String greetingMessage;
  final List<Color> gradientColors;

  const GreetingOverlay({
    super.key,
    required this.showGreeting,
    required this.greetingOpacity,
    required this.greetingMessage,
    required this.gradientColors,
  });

  @override
  Widget build(BuildContext context) {
    if (!showGreeting && greetingOpacity == 0.0) return const SizedBox.shrink();

    return Positioned(
      top: MediaQuery.of(context).size.height * 0.2, // Move it up a bit
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: AnimatedOpacity(
          opacity: greetingOpacity,
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeInOut,
          child: Column(
            children: [
              FadeInDown(
                duration: const Duration(seconds: 1),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: gradientColors
                          .map((c) => c.withValues(alpha: 0.9))
                          .toList(),
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: gradientColors.first.withValues(alpha: 0.4),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                    border: Border.all(color: Colors.white24, width: 1.5),
                  ),
                  child: Text(
                    greetingMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                      shadows: [
                        Shadow(
                          color: Colors.black45,
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Optional: Pulsing effect or sparkles can be added here
            ],
          ),
        ),
      ),
    );
  }
}
