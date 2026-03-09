import 'package:flutter/material.dart';

enum TextStyleType { classic, neon, outline, box }

class TextOverlay {
  String id;
  String text;
  double x;
  double y;
  double scale;
  double rotation;
  Color color;
  TextStyleType style;
  String fontName;

  TextOverlay({
    required this.id,
    required this.text,
    this.x = 0.5,
    this.y = 0.5,
    this.scale = 1.0,
    this.rotation = 0.0,
    this.color = Colors.white,
    this.style = TextStyleType.classic,
    this.fontName = 'Kanit',
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'x': x,
        'y': y,
        'scale': scale,
        'rotation': rotation,
        'color': color.value,
        'style': style.toString(),
        'fontName': fontName,
      };

  factory TextOverlay.fromJson(Map<String, dynamic> json) {
    return TextOverlay(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      x: (json['x'] ?? 0.5).toDouble(),
      y: (json['y'] ?? 0.5).toDouble(),
      scale: (json['scale'] ?? 1.0).toDouble(),
      rotation: (json['rotation'] ?? 0.0).toDouble(),
      color: Color(json['color'] ?? 0xFFFFFFFF),
      style: TextStyleType.values.firstWhere(
        (e) => e.toString() == json['style'],
        orElse: () => TextStyleType.classic,
      ),
      fontName: json['fontName'] ?? 'Kanit',
    );
  }
}
