import 'package:flutter/material.dart';

class GradientMeshPainter extends CustomPainter {
  final double animation;

  GradientMeshPainter({required this.animation});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    // Create moving gradient orbs
    final orb1Center = Offset(
      size.width * (0.3 + 0.2 * animation),
      size.height * (0.2 + 0.1 * (1 - animation)),
    );

    final orb2Center = Offset(
      size.width * (0.7 - 0.2 * animation),
      size.height * (0.7 - 0.1 * animation),
    );

    // Orb 1 - Orange
    paint.shader = RadialGradient(
      center: Alignment.center,
      radius: 0.8,
      colors: [
        const Color(0xFFFF6B35).withValues(alpha: 0.15),
        Colors.transparent,
      ],
    ).createShader(Rect.fromCircle(center: orb1Center, radius: 200));

    canvas.drawCircle(orb1Center, 200, paint);

    // Orb 2 - Cyan
    paint.shader = RadialGradient(
      center: Alignment.center,
      radius: 0.8,
      colors: [
        const Color(0xFF00F2EA).withValues(alpha: 0.1),
        Colors.transparent,
      ],
    ).createShader(Rect.fromCircle(center: orb2Center, radius: 180));

    canvas.drawCircle(orb2Center, 180, paint);
  }

  @override
  bool shouldRepaint(covariant GradientMeshPainter oldDelegate) {
    return oldDelegate.animation != animation;
  }
}
