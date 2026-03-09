// create_post_screen.dart
import 'dart:io';

import 'package:caculateapp/tuktuk/screens/live_studio_screen.dart';
import 'package:caculateapp/tuktuk/screens/media_editor_screen.dart';
import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_compress/video_compress.dart';

import '../services/tuktuk_storage_bridge.dart';

class CreatePostScreen extends StatefulWidget {
  final XFile? imageFile;
  const CreatePostScreen({super.key, this.imageFile});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _hashtagController = TextEditingController();
  final TextEditingController _videoUrlController = TextEditingController();
  bool _isUploading = false;
  String _uploadStatus = 'กำลังอัปโหลด...';
  final List<XFile> _uploadedMedia = [];
  int? _mainImageIndex;
  final Map<int, List<dynamic>> _mediaOverlays = {};
  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;

  // Privacy & Settings
  bool _isPublic = true;
  bool _isPinned = false;
  String _selectedCategory = 'General';
  bool _isLocationEnabled = false;
  String? _locationLabel;
  Map<String, dynamic>? _locationCoords;

  // --- Mode & Professional Text Decoration State ---
  bool _isLiveMode = false;
  Color _selectedTextColor = Colors.white;
  TextAlign _textAlign = TextAlign.start;
  bool _isBold = false;
  final List<Color> _textColors = [
    Colors.white,
    const Color(0xFFFBBF24),
    const Color(0xFFEF4444),
    const Color(0xFF10B981),
    const Color(0xFF3B82F6),
    const Color(0xFFD946EF),
  ];

  // Categories
  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'news',
      'icon': Icons.newspaper,
      'label': 'ข่าวสาร',
      'color': Colors.blue,
    },
    {
      'id': 'video',
      'icon': Icons.play_circle,
      'label': 'วีดีโอ',
      'color': Colors.purple,
    },
    {
      'id': 'update',
      'icon': Icons.bolt,
      'label': 'อัปเดต',
      'color': Colors.amber,
    },
    {
      'id': 'tip',
      'icon': Icons.lightbulb,
      'label': 'เคล็ดลับ',
      'color': Colors.green,
    },
    {
      'id': 'event',
      'icon': Icons.calendar_today,
      'label': 'กิจกรรม',
      'color': Colors.orange,
    },
    {
      'id': 'promo',
      'icon': Icons.rocket_launch,
      'label': 'โปรโมชั่น',
      'color': Colors.red,
    },
  ];

  // Filters
  int _selectedFilter = 0;
  final List<Map<String, dynamic>> _filterOptions = [
    {
      'id': 0,
      'name': 'ต้นฉบับ',
      'icon': Icons.panorama_fish_eye,
      'matrix': null,
    },
    {
      'id': 1,
      'name': 'ออร่าเทพ',
      'icon': Icons.face_retouching_natural,
      'matrix': <double>[
        1.2,
        0,
        0,
        0,
        10,
        0,
        1.1,
        0,
        0,
        10,
        0,
        0,
        1.1,
        0,
        20,
        0,
        0,
        0,
        1,
        0,
      ],
    },
    {
      'id': 2,
      'name': 'สวยระดับโลก',
      'icon': Icons.auto_awesome,
      'matrix': <double>[
        1.3,
        0.1,
        0,
        0,
        0,
        0.1,
        1.3,
        0,
        0,
        0,
        0,
        0.1,
        1.3,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ],
    },
    {
      'id': 3,
      'name': 'มาสเตอร์พีซ',
      'icon': Icons.movie_filter_rounded,
      'matrix': <double>[
        1.1,
        0,
        0,
        0,
        0,
        0,
        1.0,
        0,
        0,
        0,
        0,
        0,
        0.9,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    if (widget.imageFile != null) {
      _uploadedMedia.add(widget.imageFile!);
      _mainImageIndex = 0;
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _descriptionController.dispose();
    _hashtagController.dispose();
    _videoUrlController.dispose();
    super.dispose();
  }

  bool _isFileSizeValid(File file) {
    const int maxBytes = 50 * 1024 * 1024;
    return file.lengthSync() <= maxBytes;
  }

  bool _containsProfanity(String text) {
    return ProfanityFilter.hasProfanity(text);
  }

  String _filterProfanity(String text) {
    return ProfanityFilter.censor(text);
  }

  List<String> _extractHashtags(String text) {
    final regex = RegExp(r'#(\w+)');
    final matches = regex.allMatches(text);
    return matches.map((m) => m.group(1)!.toLowerCase()).toList();
  }

  String? _validateContent() {
    final description = _descriptionController.text.trim();
    final hashtags = _hashtagController.text.trim();
    final videoUrl = _videoUrlController.text.trim();

    if (_uploadedMedia.isEmpty && videoUrl.isEmpty) {
      return 'กรุณาเพิ่มรูปภาพ, วิดีโอ หรือลิงก์อย่างน้อย 1 รายการ';
    }

    if (videoUrl.isNotEmpty) {
      if (!videoUrl.contains('http')) {
        return 'ลิงก์วิดีโอไม่ถูกต้อง (ต้องขึ้นต้นด้วย http)';
      }
    }

    for (final media in _uploadedMedia) {
      if (!_isFileSizeValid(File(media.path))) {
        final name = media.name;
        return 'ไฟล์ $name ใหญ่เกินไป (จำกัด 50MB)';
      }
    }

    if (description.isEmpty) {
      return 'กรุณาเขียนคำอธิบายโพสต์';
    }

    if (_containsProfanity(description)) {
      return '⚠️ เนื้อหาของคุณมีคำที่ไม่เหมาะสม กรุณาใช้คำสุภาพ';
    }

    if (_containsProfanity(hashtags)) {
      return '⚠️ แฮชแทคมีคำที่ไม่เหมาะสม กรุณาแก้ไข';
    }

    return null;
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    try {
      final List<XFile> images = await picker.pickMultiImage(
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 90,
      );

      if (images.isNotEmpty) {
        setState(() {
          _uploadedMedia.addAll(images);
          if (_mainImageIndex == null && _uploadedMedia.isNotEmpty) {
            _mainImageIndex = 0;
          }
        });
      }
    } catch (e) {
      debugPrint('Error picking images: $e');
    }
  }

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    try {
      final XFile? video = await picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(minutes: 10),
      );

      if (video != null) {
        setState(() {
          _uploadedMedia.add(video);
          if (_mainImageIndex == null && _uploadedMedia.isNotEmpty) {
            _mainImageIndex = 0;
          }
        });
      }
    } catch (e) {
      debugPrint('Error picking video: $e');
    }
  }

  Future<void> _showPickMediaOptions() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1625),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'เลือกสื่อที่ต้องการอัปโหลด',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 30),
            Row(
              children: [
                Expanded(
                  child: _buildPickerOption(
                    icon: Icons.image_rounded,
                    label: 'รูปภาพ',
                    color: Colors.blue,
                    onTap: () {
                      Navigator.pop(context);
                      _pickImage();
                    },
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: _buildPickerOption(
                    icon: Icons.video_collection_rounded,
                    label: 'วิดีโอ',
                    color: Colors.purple,
                    onTap: () {
                      Navigator.pop(context);
                      _pickVideo();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPickerOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 25),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              color.withValues(alpha: 0.2),
              color.withValues(alpha: 0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 40),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _removeMedia(int index) {
    setState(() {
      _uploadedMedia.removeAt(index);
      if (_uploadedMedia.isEmpty) {
        _mainImageIndex = null;
      } else if (_mainImageIndex == index) {
        _mainImageIndex = 0;
      } else if (_mainImageIndex != null && _mainImageIndex! > index) {
        _mainImageIndex = _mainImageIndex! - 1;
      }
      _mediaOverlays.remove(index);
    });
  }

  Future<void> _openEditor(int index) async {
    final file = _uploadedMedia[index];
    final isVideo = _isVideo(file.path);

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MediaEditorScreen(
          file: File(file.path),
          isVideo: isVideo,
        ),
      ),
    );

    if (result != null && result is List) {
      setState(() {
        _mediaOverlays[index] = result;
      });
    }
  }

  void _setMainImage(int index) {
    setState(() => _mainImageIndex = index);
  }

  bool _isVideo(String path) {
    final ext = path.toLowerCase();
    return ext.endsWith('.mp4') ||
        ext.endsWith('.mov') ||
        ext.endsWith('.avi') ||
        ext.endsWith('.mkv');
  }

  Future<File?> _compressVideo(String path) async {
    try {
      debugPrint('🎬 Starting video compression for: $path');
      final MediaInfo? mediaInfo = await VideoCompress.compressVideo(
        path,
        quality: VideoQuality.MediumQuality,
        deleteOrigin: false,
        includeAudio: true,
      );

      if (mediaInfo != null && mediaInfo.file != null) {
        debugPrint('✅ Compression success: ${mediaInfo.path}');
        debugPrint('📉 Size reduced: ${mediaInfo.filesize} bytes');
        return mediaInfo.file;
      }
      return null;
    } catch (e) {
      debugPrint('❌ Video compression error: $e');
      return null;
    }
  }

  Future<void> _uploadPost() async {
    if (_isUploading) return;

    final validationError = _validateContent();
    if (validationError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(validationError),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final user = await TukTukBridge().getCurrentUser();
      if (user == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('กรุณาเข้าสู่ระบบก่อนโพสต์'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
        setState(() => _isUploading = false);
        return;
      }

      final List<Map<String, dynamic>> uploadedMediaData = [];

      for (int i = 0; i < _uploadedMedia.length; i++) {
        final xFile = _uploadedMedia[i];
        final isVideo = _isVideo(xFile.path);
        final folder = isVideo ? 'videos' : 'images';

        File fileToUpload = File(xFile.path);

        if (isVideo) {
          setState(() {
            _uploadStatus =
                'กำลังบีบอัดวิดีโอ... (${i + 1}/${_uploadedMedia.length})';
          });
          final compressedFile = await _compressVideo(xFile.path);
          if (compressedFile != null) {
            fileToUpload = compressedFile;
          }
        }

        setState(() {
          _uploadStatus = 'กำลังอัปโหลด... (${i + 1}/${_uploadedMedia.length})';
        });

        final url = await TukTukStorageBridge().upload(
          fileToUpload,
          'community_posts/$folder',
          contentType: isVideo ? 'video/mp4' : 'image/jpeg',
        );

        if (url == null) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('อัปโหลดไฟล์ที่ ${i + 1} ไม่สำเร็จ กรุณาลองใหม่'),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
          setState(() => _isUploading = false);
          return;
        }

        uploadedMediaData.add({
          'url': url,
          'type': isVideo ? 'video' : 'image',
          'isMain': i == _mainImageIndex,
          'overlays': _mediaOverlays[i]?.map((e) => e.toJson()).toList(),
        });
      }

      final hashtagText = _hashtagController.text.trim();
      final hashtags = _extractHashtags(hashtagText);

      String videoUrl = _videoUrlController.text.trim();
      if (videoUrl.startsWith('//')) videoUrl = 'https:$videoUrl';

      final description = _descriptionController.text.trim();
      final filteredDescription = _filterProfanity(description);
      final displayTitle = description.length > 50
          ? '${description.substring(0, 47)}...'
          : (description.isEmpty ? 'โพสต์ใหม่' : description);

      final postData = {
        'title': displayTitle,
        'description': filteredDescription,
        'content': filteredDescription,
        'images': uploadedMediaData,
        'imageUrl':
            uploadedMediaData.isNotEmpty ? uploadedMediaData[0]['url'] : '',
        'videoUrl': videoUrl,
        'youtubeUrl': videoUrl,
        'type': (uploadedMediaData.any((m) => m['type'] == 'video') ||
                videoUrl.isNotEmpty)
            ? 'video'
            : 'image',
        'category': _selectedCategory,
        'isPublic': _isPublic,
        'isPinned': _isPinned,
        'published': _isPublic,
        'hashtags': hashtags,
        'visibility': _isPublic ? 'public' : 'private',
        'privacy': _isPublic ? 'public' : 'private',
        'filter_id': _selectedFilter,
        'originCollection': 'community_posts',
        'authorId': user['uid'],
        'authorName': user['displayName'],
        'authorAvatar': user['pictureUrl'],
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'clientTimestamp': DateTime.now().toIso8601String(),
        if (_isLocationEnabled && _locationLabel != null) ...{
          'location': _locationLabel,
          'province': _locationLabel,
          'coords': _locationCoords,
          'locationName': _locationLabel,
        },
      };

      final postId = await TukTukBridge().createCommunityPost(postData);

      if (postId != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 10),
                  Text(_isPublic
                      ? 'โพสต์สาธารณะสำเร็จ!'
                      : 'โพสต์ส่วนตัวสำเร็จ!',),
                ],
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),),
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw Exception('Failed to create post document');
      }
    } catch (e) {
      debugPrint('Error uploading post: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('เกิดข้อผิดพลาด: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  Future<void> _handleLocationToggle(bool enabled) async {
    if (!enabled) {
      setState(() {
        _isLocationEnabled = false;
        _locationLabel = null;
        _locationCoords = null;
      });
      return;
    }

    setState(() {
      _isLocationEnabled = true;
      _locationLabel = 'กำลังค้นหา...';
    });

    try {
      final pos = await TukTukLocationService().getCurrentLocationAndSync();
      if (pos != null) {
        final address = await TukTukLocationService()
            .getAddressFromCoords(pos.latitude, pos.longitude);
        if (mounted) {
          setState(() {
            _locationLabel =
                address['province'] ?? address['district'] ?? 'ตำแหน่งปัจจุบัน';
            _locationCoords = {
              'lat': pos.latitude,
              'lng': pos.longitude,
            };
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isLocationEnabled = false;
            _locationLabel = null;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('ไม่สามารถเข้าถึงตำแหน่งได้'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLocationEnabled = false;
          _locationLabel = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      body: Stack(
        children: [
          // Animated Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF1A1A2E),
                  Color(0xFF16213E),
                  Color(0xFF0F0F1A),
                ],
              ),
            ),
          ),

          // Main Content
          SafeArea(
            child: Column(
              children: [
                _buildAppBar(),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildModeSelector(),
                        const SizedBox(height: 25),
                        if (_isLiveMode) ...[
                          _buildLiveSetupView(),
                        ] else ...[
                          _buildHeader(),
                          const SizedBox(height: 25),
                          _buildCategorySection(),
                          const SizedBox(height: 25),
                          _buildMediaSection(),
                          const SizedBox(height: 25),
                          if (_uploadedMedia.isNotEmpty) _buildFilterSection(),
                          if (_uploadedMedia.isNotEmpty)
                            const SizedBox(height: 25),
                          _buildVideoUrlSection(),
                          const SizedBox(height: 25),
                          _buildDescriptionSection(),
                          const SizedBox(height: 25),
                          _buildHashtagSection(),
                          const SizedBox(height: 25),
                          _buildPrivacySection(),
                          const SizedBox(height: 30),
                          _buildPublishButton(),
                        ],
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Loading Overlay
          if (_isUploading) _buildLoadingOverlay(),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.close, color: Colors.white70, size: 22),
            ),
          ),
          const Expanded(
            child: Center(
              child: Text(
                'สร้างโพสต์ใหม่',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          GestureDetector(
            onTap: _isUploading ? null : _uploadPost,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Text(
                'โพสต์',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF6366F1).withValues(alpha: 0.2),
            const Color(0xFF8B5CF6).withValues(alpha: 0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              ),
              borderRadius: BorderRadius.circular(15),
            ),
            child:
                const Icon(Icons.auto_awesome, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'สตูดิโอสร้างสรรค์',
                        style: GoogleFonts.kanit(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4,),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                        border:
                            Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                      ),
                      child: const Text(
                        'PRO',
                        style: TextStyle(
                          color: Colors.amber,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  'อัปโหลดได้สูงสุด 10 รูป/วิดีโอ',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.category,
                    color: Color(0xFF6366F1), size: 16,),
              ),
              const SizedBox(width: 8),
              const Text(
                'เลือกหมวดหมู่',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _categories.map((cat) {
            final isSelected = _selectedCategory == cat['id'];
            return GestureDetector(
              onTap: () => setState(() => _selectedCategory = cat['id']),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? LinearGradient(
                          colors: [cat['color'], cat['color'].withValues(alpha: 0.7)],
                        )
                      : null,
                  color: isSelected ? null : Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(
                    color: isSelected
                        ? Colors.transparent
                        : Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(cat['icon'],
                        color: isSelected ? Colors.white : cat['color'],
                        size: 18,),
                    const SizedBox(width: 8),
                    Text(
                      cat['label'],
                      style: TextStyle(
                        color: isSelected
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.8),
                        fontSize: 14,
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildMediaSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.photo_library,
                    color: Colors.blue, size: 16,),
              ),
              const SizedBox(width: 8),
              const Text(
                'เพิ่มสื่อ',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        if (_uploadedMedia.isNotEmpty)
          SizedBox(
            height: 120,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _uploadedMedia.length + 1,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                if (index == _uploadedMedia.length) {
                  return _buildAddMediaCard();
                }
                return _buildMediaCard(index);
              },
            ),
          )
        else
          _buildEmptyMediaState(),
      ],
    );
  }

  Widget _buildEmptyMediaState() {
    return Row(
      children: [
        Expanded(
          child: _buildMediaOptionCard(
            icon: Icons.image_rounded,
            label: 'รูปภาพ',
            color: Colors.blue,
            onTap: _pickImage,
          ),
        ),
        const SizedBox(width: 15),
        Expanded(
          child: _buildMediaOptionCard(
            icon: Icons.video_collection_rounded,
            label: 'วิดีโอ',
            color: Colors.purple,
            onTap: _pickVideo,
          ),
        ),
      ],
    );
  }

  Widget _buildMediaOptionCard({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 150,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              color.withValues(alpha: 0.15),
              color.withValues(alpha: 0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.3), width: 2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ScaleTransition(
              scale: _pulseAnimation,
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 40),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,),
            ),
            const SizedBox(height: 4),
            Text(
              label == 'รูปภาพ' ? 'JPG, PNG, WEBP' : 'MP4, MOV, AVI',
              style:
                  TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddMediaCard() {
    return GestureDetector(
      onTap: _uploadedMedia.length < 10 ? _showPickMediaOptions : null,
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFF6366F1).withValues(alpha: 0.2),
              const Color(0xFF8B5CF6).withValues(alpha: 0.1),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: const Color(0xFF6366F1).withValues(alpha: 0.4), width: 2,),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.add_circle_outline,
                color: Color(0xFF6366F1), size: 30,),
            const SizedBox(height: 8),
            Text(
              'เพิ่มสื่อ',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (_uploadedMedia.length >= 10)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '(ครบแล้ว)',
                  style: TextStyle(
                      color: Colors.red.withValues(alpha: 0.8), fontSize: 10,),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaCard(int index) {
    final file = _uploadedMedia[index];
    final isMain = index == _mainImageIndex;
    final isVideo = _isVideo(file.path);

    return GestureDetector(
      onTap: () => _setMainImage(index),
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isMain
                ? const Color(0xFFFBBF24)
                : Colors.white.withValues(alpha: 0.2),
            width: isMain ? 3 : 2,
          ),
          boxShadow: isMain
              ? [
                  BoxShadow(
                    color: const Color(0xFFFBBF24).withValues(alpha: 0.4),
                    blurRadius: 10,
                    spreadRadius: 2,
                  ),
                ]
              : null,
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Media Preview
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: isVideo
                  ? Container(
                      color: Colors.black54,
                      child: const Center(
                        child: Icon(Icons.play_circle_filled,
                            color: Colors.white70, size: 40,),
                      ),
                    )
                  : ColorFiltered(
                      colorFilter:
                          _filterOptions[_selectedFilter]['matrix'] != null
                              ? ColorFilter.matrix(
                                  _filterOptions[_selectedFilter]['matrix'],)
                              : const ColorFilter.mode(
                                  Colors.transparent, BlendMode.multiply,),
                      child: Image.file(
                        File(file.path),
                        fit: BoxFit.cover,
                      ),
                    ),
            ),

            // Main Badge
            if (isMain)
              Positioned(
                top: 4,
                left: 4,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFBBF24),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(8),
                      bottomRight: Radius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'หลัก',
                    style: TextStyle(
                        color: Colors.black,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,),
                  ),
                ),
              ),

            // Media Type
            Positioned(
              bottom: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  isVideo ? 'VIDEO' : 'PHOTO',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,),
                ),
              ),
            ),

            // Edit Button
            Positioned(
              bottom: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => _openEditor(index),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.blue,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.edit, size: 12, color: Colors.white),
                ),
              ),
            ),

            // Remove Button
            Positioned(
              top: -6,
              right: -6,
              child: GestureDetector(
                onTap: () => _removeMedia(index),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, size: 12, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.filter_hdr,
                    color: Colors.orange, size: 16,),
              ),
              const SizedBox(width: 8),
              const Text(
                'เลือกฟิลเตอร์',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _filterOptions.map((filter) {
              final isSelected = _selectedFilter == filter['id'];
              return GestureDetector(
                onTap: () => setState(() => _selectedFilter = filter['id']),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.only(right: 12),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? const LinearGradient(
                            colors: [Color(0xFFF59E0B), Color(0xFFD97706)],)
                        : null,
                    color: isSelected ? null : Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : Colors.white.withValues(alpha: 0.1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        filter['icon'],
                        color: isSelected
                            ? Colors.white
                            : Colors.orange.withValues(alpha: 0.8),
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        filter['name'],
                        style: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.8),
                          fontSize: 14,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildVideoUrlSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.link, color: Colors.amber, size: 16),
              ),
              const SizedBox(width: 8),
              const Text(
                'ลิงก์วิดีโอ (ไม่บังคับ)',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: TextField(
            controller: _videoUrlController,
            style: const TextStyle(color: Colors.white, fontSize: 15),
            decoration: InputDecoration(
              hintText: 'https://youtube.com/watch?v=...',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
              prefixIcon: const Icon(Icons.link, color: Colors.amber),
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDescriptionSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child:
                        const Icon(Icons.edit, color: Colors.green, size: 16),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'คำอธิบายและข้อความ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text(
                        '✨ AI กำลังวิเคราะห์และช่วยคิดแคปชัน... (Coming Soon)',),
                    backgroundColor: Colors.indigo,
                  ),);
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],),
                    borderRadius: BorderRadius.circular(15),
                    boxShadow: [
                      BoxShadow(
                          color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                          blurRadius: 4,),
                    ],
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.auto_awesome, color: Colors.white, size: 14),
                      SizedBox(width: 4),
                      Text('AI ช่วยคิดแคปชัน',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,),),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Column(
            children: [
              TextField(
                controller: _descriptionController,
                maxLines: 5,
                textAlign: _textAlign,
                style: TextStyle(
                  color: _selectedTextColor,
                  fontSize: 16,
                  fontWeight: _isBold ? FontWeight.bold : FontWeight.normal,
                ),
                decoration: InputDecoration(
                  hintText: 'บอกเล่าเรื่องราวของคุณ...',
                  hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                      fontWeight: FontWeight.normal,),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(20),
                ),
              ),
              _buildTextDecorationBar(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextDecorationBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(15)),
        border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: _textColors.map((color) {
              final isSelected = _selectedTextColor == color;
              return GestureDetector(
                onTap: () => setState(() => _selectedTextColor = color),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: isSelected ? Colors.white : Colors.white24,
                        width: isSelected ? 2 : 1,),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                                color: color.withValues(alpha: 0.5), blurRadius: 6,),
                          ]
                        : null,
                  ),
                ),
              );
            }).toList(),
          ),
          Row(
            children: [
              GestureDetector(
                onTap: () => setState(() => _isBold = !_isBold),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: _isBold
                        ? Colors.white.withValues(alpha: 0.2)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(Icons.format_bold,
                      color: _isBold ? Colors.white : Colors.white54, size: 20,),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (_textAlign == TextAlign.start) {
                      _textAlign = TextAlign.center;
                    } else if (_textAlign == TextAlign.center)
                      _textAlign = TextAlign.right;
                    else
                      _textAlign = TextAlign.start;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    _textAlign == TextAlign.start
                        ? Icons.format_align_left
                        : _textAlign == TextAlign.center
                            ? Icons.format_align_center
                            : Icons.format_align_right,
                    color: Colors.white54,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModeSelector() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _isLiveMode = false),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: !_isLiveMode
                      ? const Color(0xFF6366F1).withValues(alpha: 0.8)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.edit_document,
                          color: !_isLiveMode ? Colors.white : Colors.white54,
                          size: 18,),
                      const SizedBox(width: 8),
                      Text(
                        'โพสต์ทั่วไป',
                        style: TextStyle(
                          color: !_isLiveMode ? Colors.white : Colors.white54,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () {
                // Navigate directly to the full Live Studio screen
                Navigator.push(
                  context,
                  PageRouteBuilder(
                    pageBuilder: (_, __, ___) => const LiveStudioScreen(),
                    transitionsBuilder: (_, anim, __, child) => FadeTransition(
                      opacity: anim,
                      child: ScaleTransition(
                        scale: Tween<double>(begin: 0.92, end: 1.0).animate(
                          CurvedAnimation(
                              parent: anim, curve: Curves.easeOutCubic,),
                        ),
                        child: child,
                      ),
                    ),
                    transitionDuration: const Duration(milliseconds: 400),
                  ),
                );
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _isLiveMode
                      ? const Color(0xFFEF4444).withValues(alpha: 0.9)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _isLiveMode
                      ? [
                          BoxShadow(
                              color: Colors.red.withValues(alpha: 0.3),
                              blurRadius: 10,),
                        ]
                      : null,
                ),
                child: Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ScaleTransition(
                        scale: _pulseAnimation,
                        child: Icon(Icons.sensors,
                            color: _isLiveMode ? Colors.white : Colors.white54,
                            size: 18,),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Live สด',
                        style: TextStyle(
                          color: _isLiveMode ? Colors.white : Colors.white54,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveSetupView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(25),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2B0A0A), Color(0xFF150202)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
                color: Colors.redAccent.withValues(alpha: 0.4), width: 1.5,),
            boxShadow: [
              BoxShadow(
                  color: Colors.redAccent.withValues(alpha: 0.15), blurRadius: 20,),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.cell_tower,
                    color: Colors.redAccent, size: 45,),
              ),
              const SizedBox(height: 20),
              const Text(
                'TukTuk Live Platform',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,),
              ),
              const SizedBox(height: 10),
              Text(
                'ระบบถ่ายทอดสดของ TukTuk ถูกออกแบบภายใต้โครงสร้าง "ข่าวสารที่น่าเชื่อถือ" (Credible Information Infrastructure)',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 13,
                    height: 1.5,),
              ),
              const SizedBox(height: 25),
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline,
                        color: Colors.amber, size: 22,),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'ในเฟส 1 การถ่ายทอดสดสงวนสิทธิ์เฉพาะ "สำนักข่าวพันธมิตร" ผ่านทาง Web Broadcaster Portal เท่านั้น',
                        style: TextStyle(
                            color: Colors.amber.shade100,
                            fontSize: 13,
                            height: 1.4,),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 35),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const LiveStudioScreen(),
                    ),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  decoration: BoxDecoration(
                    color: Colors.redAccent,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.redAccent.withValues(alpha: 0.4),
                          blurRadius: 15,
                          offset: const Offset(0, 5),),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ScaleTransition(
                        scale: _pulseAnimation,
                        child: const Icon(Icons.videocam, color: Colors.white),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'ตั้งค่าสตรีมของคุณ',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '💡 Live Commerce สำหรับทุกคน พบกันเร็วๆ นี้',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5), fontSize: 12,),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHashtagSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.purple.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.tag, color: Colors.purple, size: 16),
              ),
              const SizedBox(width: 8),
              const Text(
                'แฮชแท็ก',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: TextField(
            controller: _hashtagController,
            maxLines: 2,
            style: const TextStyle(color: Colors.white, fontSize: 15),
            decoration: InputDecoration(
              hintText: '#เที่ยวไทย #รีวิว #ทริคดีๆ',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.all(20),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPrivacySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.cyan.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child:
                    const Icon(Icons.privacy_tip, color: Colors.cyan, size: 16),
              ),
              const SizedBox(width: 8),
              const Text(
                'ตั้งค่าโพสต์',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Column(
            children: [
              _buildPrivacyOption(
                icon: _isPublic ? Icons.public : Icons.lock,
                iconColor: _isPublic ? Colors.green : Colors.orange,
                title: _isPublic ? 'โพสต์สาธารณะ' : 'โพสต์ส่วนตัว',
                subtitle: _isPublic
                    ? 'ทุกคนสามารถเห็นโพสต์นี้'
                    : 'เฉพาะคุณเห็นโพสต์นี้',
                value: _isPublic,
                onChanged: (v) => setState(() => _isPublic = v),
              ),
              const Divider(color: Colors.white10, height: 30),
              _buildPrivacyOption(
                icon: Icons.push_pin,
                iconColor: _isPinned ? Colors.amber : Colors.white54,
                title: 'ปักหมุดโพสต์',
                subtitle: 'แสดงเด่นบนโปรไฟล์',
                value: _isPinned,
                onChanged: (v) => setState(() => _isPinned = v),
              ),
              const Divider(color: Colors.white10, height: 30),
              _buildPrivacyOption(
                icon: Icons.location_on,
                iconColor: _isLocationEnabled ? Colors.blue : Colors.white54,
                title: 'ระบุตำแหน่ง',
                subtitle: _isLocationEnabled
                    ? (_locationLabel ?? 'กำลังระบุ...')
                    : 'เพิ่มตำแหน่งในโพสต์',
                value: _isLocationEnabled,
                onChanged: _handleLocationToggle,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPrivacyOption({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: iconColor, size: 24),
        ),
        const SizedBox(width: 15),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5), fontSize: 13,),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeColor: iconColor,
          activeTrackColor: iconColor.withValues(alpha: 0.5),
        ),
      ],
    );
  }

  Widget _buildPublishButton() {
    final isValid =
        _uploadedMedia.isNotEmpty || _videoUrlController.text.isNotEmpty;

    return GestureDetector(
      onTap: isValid && !_isUploading ? _uploadPost : null,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          gradient: isValid
              ? const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],)
              : LinearGradient(
                  colors: [Colors.grey.shade800, Colors.grey.shade900],),
          borderRadius: BorderRadius.circular(20),
          boxShadow: isValid
              ? [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.4),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _isPublic ? Icons.public : Icons.lock,
              color: Colors.white,
              size: 22,
            ),
            const SizedBox(width: 12),
            Text(
              isValid ? 'โพสต์เลย' : 'เพิ่มสื่อก่อนโพสต์',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingOverlay() {
    return Container(
      color: Colors.black.withValues(alpha: 0.7),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(40),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1625),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 80,
                    height: 80,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                          Color(0xFF8B5CF6),),
                      strokeWidth: 3,
                    ),
                  ),
                  Icon(Icons.cloud_upload, color: Colors.white, size: 40),
                ],
              ),
              const SizedBox(height: 25),
              Text(
                _uploadStatus,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'กรุณารอสักครู่',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6), fontSize: 14,),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
