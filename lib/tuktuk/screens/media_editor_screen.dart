import 'dart:io';

import 'package:caculateapp/tuktuk/models/text_overlay.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:video_player/video_player.dart';

class MediaEditorScreen extends StatefulWidget {
  final File file;
  final bool isVideo;

  const MediaEditorScreen({
    super.key,
    required this.file,
    required this.isVideo,
  });

  @override
  State<MediaEditorScreen> createState() => _MediaEditorScreenState();
}

class _MediaEditorScreenState extends State<MediaEditorScreen> {
  final List<TextOverlay> _overlays = [];
  VideoPlayerController? _videoController;
  TextOverlay? _activeOverlay;
  double _baseScale = 1.0;

  @override
  void initState() {
    super.initState();
    if (widget.isVideo) {
      _videoController = VideoPlayerController.file(widget.file)
        ..initialize().then((_) {
          if (mounted) setState(() {});
          _videoController!.setLooping(true);
          _videoController!.play();
        }).catchError((e) {
          debugPrint('Video init error: $e');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('ไม่สามารถเปิดไฟล์วิดีโอนี้ได้: $e')),
            );
          }
        });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  void _addText() {
    _showTextEditorDialog();
  }

  void _handleTextSave(String text, Color color, TextStyleType style,
      String fontName, double scale, TextOverlay? existing,) {
    setState(() {
      if (existing != null) {
        existing.text = text;
        existing.color = color;
        existing.style = style;
        existing.fontName = fontName;
        existing.scale = scale;
      } else {
        _overlays.add(TextOverlay(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: text,
          color: color,
          style: style,
          fontName: fontName,
          scale: scale,
        ),);
      }
    });
  }

  void _showTextEditorDialog({TextOverlay? existing}) {
    final TextEditingController textController =
        TextEditingController(text: existing?.text ?? '');
    Color selectedColor = existing?.color ?? Colors.white;
    TextStyleType selectedStyle = existing?.style ?? TextStyleType.classic;
    String selectedFont = existing?.fontName ?? 'Kanit';
    double selectedScale = existing?.scale ?? 1.0;

    final List<String> fonts = [
      'Kanit',
      'Prompt',
      'Sarabun',
      'Mitr',
      'Chakra Petch',
      'Pattaya',
      'Charm',
      'Mali',
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.black, // Opaque black
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height, // Full screen height
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom +
                20, // Add padding above keyboard
            left: 20,
            right: 20,
            top: 40, // Increased top padding
          ),
          child: Column(
            children: [
              // Header Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('ยกเลิก',
                        style: TextStyle(color: Colors.white54),),
                  ),
                  const Text('ปรับแต่งข้อความ',
                      style: TextStyle(
                          color: Colors.white, fontWeight: FontWeight.bold,),),
                  TextButton(
                    onPressed: () {
                      if (textController.text.isNotEmpty) {
                        Navigator.pop(context);
                        _handleTextSave(
                          textController.text,
                          selectedColor,
                          selectedStyle,
                          selectedFont,
                          selectedScale,
                          existing,
                        );
                      }
                    },
                    child: const Text('เสร็จสิ้น',
                        style: TextStyle(
                            color: Colors.orange, fontWeight: FontWeight.bold,),),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Text Preview Input (Flexible to take remaining space)
              Expanded(
                child: Center(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: TextField(
                      controller: textController,
                      autofocus: true,
                      cursorColor: Colors.orange,
                      textAlign: TextAlign.center,
                      maxLines: null,
                      minLines: 1, // Ensure size
                      style: _getSafeFontStyle(
                        selectedFont,
                        TextStyle(
                          color: selectedColor,
                          fontSize: 24 * selectedScale,
                          fontWeight: FontWeight.bold,
                          shadows: selectedStyle == TextStyleType.neon
                              ? [
                                  Shadow(color: selectedColor, blurRadius: 10),
                                  Shadow(color: selectedColor, blurRadius: 20),
                                ]
                              : [
                                  Shadow(
                                      color: Colors.black.withValues(alpha: 0.5),
                                      blurRadius: 4,
                                      offset: const Offset(2, 2),),
                                ],
                        ),
                      ),
                      decoration: const InputDecoration(
                        hintText: 'พิมพ์ข้อความ...',
                        hintStyle: TextStyle(color: Colors.white54),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.all(20),
                        isDense: true,
                      ),
                    ),
                  ),
                ),
              ),

              // TOOLS PANEL
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Font Size Slider
                  Row(
                    children: [
                      const Icon(Icons.text_fields,
                          color: Colors.white54, size: 16,),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Slider(
                          value: selectedScale,
                          min: 0.5,
                          max: 3.0,
                          activeColor: Colors.orange,
                          inactiveColor: Colors.white24,
                          onChanged: (value) =>
                              setModalState(() => selectedScale = value),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // FONT SELECTOR
                  SizedBox(
                    height: 50,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: fonts.length,
                      itemBuilder: (context, index) {
                        final font = fonts[index];
                        final isSelected = selectedFont == font;
                        return GestureDetector(
                          onTap: () => setModalState(() => selectedFont = font),
                          child: Container(
                            margin: const EdgeInsets.only(right: 10),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8,),
                            decoration: BoxDecoration(
                              color: isSelected ? Colors.white : Colors.white10,
                              borderRadius: BorderRadius.circular(25),
                              border: Border.all(
                                  color: isSelected
                                      ? Colors.transparent
                                      : Colors.white24,),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              font,
                              style: _getSafeFontStyle(
                                font,
                                TextStyle(
                                  color:
                                      isSelected ? Colors.black : Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 15),

                  // STYLE SELECTOR
                  SizedBox(
                    height: 40,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: TextStyleType.values.map((type) {
                        final isSelected = selectedStyle == type;
                        return GestureDetector(
                          onTap: () =>
                              setModalState(() => selectedStyle = type),
                          child: Container(
                            margin: const EdgeInsets.only(right: 10),
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color:
                                  isSelected ? Colors.orange : Colors.white10,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              type.name.toUpperCase(),
                              style: TextStyle(
                                color:
                                    isSelected ? Colors.white : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 15),

                  // COLOR SELECTOR
                  SizedBox(
                    height: 45,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        Colors.white,
                        Colors.black,
                        Colors.redAccent,
                        Colors.pinkAccent,
                        Colors.orangeAccent,
                        Colors.yellowAccent,
                        Colors.greenAccent,
                        Colors.lightBlueAccent,
                        Colors.purpleAccent,
                        const Color(0xFF18FFFF), // Cyan
                        const Color(0xFFFF4081), // Hot Pink
                      ].map((color) {
                        final isSelected = selectedColor == color;
                        return GestureDetector(
                          onTap: () =>
                              setModalState(() => selectedColor = color),
                          child: Container(
                            margin: const EdgeInsets.only(right: 12),
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: isSelected
                                  ? Border.all(color: Colors.white, width: 3)
                                  : Border.all(color: Colors.white24, width: 1),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                          color: color.withValues(alpha: 0.5),
                                          blurRadius: 8,),
                                    ]
                                  : null,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  TextStyle _getSafeFontStyle(String fontName, TextStyle baseStyle) {
    try {
      return GoogleFonts.getFont(fontName, textStyle: baseStyle);
    } catch (e) {
      debugPrint('Font load error: $e');
      return baseStyle; // Fallback
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Media Layer
          Center(
            child: widget.isVideo
                ? _videoController != null &&
                        _videoController!.value.isInitialized
                    ? AspectRatio(
                        aspectRatio: _videoController!.value.aspectRatio,
                        child: VideoPlayer(_videoController!),
                      )
                    : const CircularProgressIndicator()
                : Image.file(widget.file),
          ),

          // Overlays Layer
          ..._overlays
              .map(_buildDraggableOverlay)
              ,

          // UI Layer
          Positioned(
            top: MediaQuery.of(context).padding.top,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context, _overlays),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'บันทึก',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Tools Layer
          Positioned(
            right: 16,
            top: 100,
            child: Column(
              children: [
                _buildToolButton(
                  icon: Icons.text_fields_rounded,
                  label: 'ข้อความ',
                  onTap: _addText,
                ),
                const SizedBox(height: 20),
                // Only show Video Cut for video (Placeholder for now)
                if (widget.isVideo)
                  _buildToolButton(
                    icon: Icons.cut_rounded,
                    label: 'ตัดต่อ',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('ฟีเจอร์ตัดต่อกำลังมาเร็วๆ นี้'),),
                      );
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black54,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white24),
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              shadows: [Shadow(color: Colors.black, blurRadius: 4)],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDraggableOverlay(TextOverlay overlay) {
    return Positioned(
      left: MediaQuery.of(context).size.width * overlay.x -
          100, // Center based on width
      top: MediaQuery.of(context).size.height * overlay.y - 50,
      child: GestureDetector(
        onScaleStart: (_) {
          setState(() {
            _activeOverlay = overlay;
            _baseScale = overlay.scale;
          });
        },
        onScaleUpdate: (details) {
          if (_activeOverlay == overlay) {
            setState(() {
              // Move
              overlay.x += details.focalPointDelta.dx /
                  MediaQuery.of(context).size.width;
              overlay.y += details.focalPointDelta.dy /
                  MediaQuery.of(context).size.height;
              // Scale
              if (details.scale != 1.0) {
                overlay.scale = _baseScale * details.scale;
              }
              // Clamp
              if (overlay.scale < 0.5) overlay.scale = 0.5;
              if (overlay.scale > 4.0) overlay.scale = 4.0;
            });
          }
        },
        onTap: () => _showTextEditorDialog(existing: overlay),
        child: Transform.scale(
          scale: overlay.scale,
          child: Container(
            constraints: const BoxConstraints(minWidth: 50, maxWidth: 300),
            padding: const EdgeInsets.all(8),
            decoration: overlay.style == TextStyleType.box
                ? BoxDecoration(
                    color: overlay.color,
                    borderRadius: BorderRadius.circular(8),
                  )
                : null,
            child: Text(
              overlay.text,
              textAlign: TextAlign.center,
              style: _getTextStyle(overlay),
            ),
          ),
        ),
      ),
    );
  }

  TextStyle _getTextStyle(TextOverlay overlay) {
    const double fontSize = 24.0;

    // Apply Font Safely
    TextStyle baseStyle;
    try {
      baseStyle = GoogleFonts.getFont(overlay.fontName);
    } catch (e) {
      baseStyle = const TextStyle(fontFamily: 'Kanit'); // Fallback
    }

    switch (overlay.style) {
      case TextStyleType.classic:
        return baseStyle.copyWith(
            color: overlay.color,
            fontSize: fontSize,
            fontWeight: FontWeight.bold,
            shadows: [
              Shadow(
                  color: Colors.black.withValues(alpha: 0.5),
                  blurRadius: 2,
                  offset: const Offset(1, 1),),
            ],);
      case TextStyleType.neon:
        return baseStyle.copyWith(
          color: Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(color: overlay.color, blurRadius: 10),
            Shadow(color: overlay.color, blurRadius: 20),
            Shadow(color: overlay.color, blurRadius: 30),
          ],
        );
      case TextStyleType.outline:
        return baseStyle.copyWith(
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          foreground: Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 3
            ..color = overlay.color,
        );
      case TextStyleType.box:
        return baseStyle.copyWith(
          color: overlay.color.computeLuminance() > 0.5
              ? Colors.black
              : Colors.white,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
        );
    }
  }
}
