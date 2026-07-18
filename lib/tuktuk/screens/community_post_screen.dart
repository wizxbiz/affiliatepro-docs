import 'dart:io';

import 'package:caculateapp/tuktuk/services/tuktuk_tokenomics.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/tuktuk_storage_bridge.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:intl/intl.dart';

/// 🚀 Enhanced Community Post Screen
class CommunityPostScreen extends StatefulWidget {
  final String? initialCategory;
  final String? draftId;

  const CommunityPostScreen({
    super.key,
    this.initialCategory,
    this.draftId,
  });

  @override
  State<CommunityPostScreen> createState() => _CommunityPostScreenState();
}

class _CommunityPostScreenState extends State<CommunityPostScreen>
    with TickerProviderStateMixin {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _contentController = TextEditingController();
  final TextEditingController _videoUrlController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  List<File> _selectedImages = [];
  String _selectedCategory = 'general';
  bool _isPosting = false;
  bool _isSavingDraft = false;
  String _privacy = 'public';

  // 📍 Location
  Position? _currentLocation;
  String? _locationName;
  bool _isLoadingLocation = false;

  // 📊 Poll
  bool _hasPoll = false;
  final List<TextEditingController> _pollOptions = [
    TextEditingController(),
    TextEditingController(),
  ];
  int _pollDuration = 7;

  // ⏰ Schedule
  DateTime? _scheduledTime;

  // 🏷️ Tags
  List<String> _hashtags = [];
  List<String> _mentions = [];

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'eco_merchants',
      'label': 'ค้าขาย/อาหาร',
      'icon': Icons.restaurant_menu,
      'color': const Color(0xFFFF6B6B),
      'isOfficial': true,
    },
    {
      'id': 'eco_delivery',
      'label': 'วิน/ขนส่ง',
      'icon': Icons.moped,
      'color': const Color(0xFF4ECDC4),
      'isOfficial': true,
    },
    {
      'id': 'eco_pros',
      'label': 'ช่าง/บริการ',
      'icon': Icons.handyman_rounded,
      'color': const Color(0xFFA8E6CF),
      'isOfficial': true,
    },
    {
      'id': 'groups',
      'label': 'กลุ่มจอยคนไทย',
      'icon': Icons.groups_3_rounded,
      'color': const Color(0xFFD4A5FF),
      'isOfficial': true,
    },
    {
      'id': 'discussion',
      'label': 'วิถีชุมชน',
      'icon': Icons.forum,
      'color': const Color(0xFFFFD93D),
    },
    {
      'id': 'video',
      'label': 'วิดีโอ',
      'icon': Icons.play_circle,
      'color': const Color(0xFFFF9F1C),
    },
    {
      'id': 'question',
      'label': 'ถาม-ตอบ',
      'icon': Icons.help_outline,
      'color': const Color(0xFF6C5CE7),
    },
    {
      'id': 'general',
      'label': 'ทั่วไป',
      'icon': Icons.public,
      'color': const Color(0xFFA0A0A0),
    },
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _animationController.forward();

    if (widget.initialCategory != null) {
      _selectedCategory = widget.initialCategory!;
    }
    if (widget.draftId != null) {
      _loadDraft();
    }
    _extractTags();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _titleController.dispose();
    _contentController.dispose();
    _videoUrlController.dispose();
    _locationController.dispose();
    for (final controller in _pollOptions) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadDraft() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('drafts')
          .doc(widget.draftId)
          .get();

      if (doc.exists) {
        final data = doc.data()!;
        setState(() {
          _titleController.text = data['title'] ?? '';
          _contentController.text = data['content'] ?? '';
          _videoUrlController.text = data['videoUrl'] ?? '';
          _selectedCategory = data['category'] ?? 'general';
          _privacy = data['privacy'] ?? 'public';
        });
      }
    } catch (e) {
      debugPrint('Error loading draft: $e');
    }
  }

  Future<void> _saveDraft() async {
    setState(() => _isSavingDraft = true);

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('กรุณาเข้าสู่ระบบ');

      final draftData = {
        'title': _titleController.text.trim(),
        'content': _contentController.text.trim(),
        'videoUrl': _videoUrlController.text.trim(),
        'category': _selectedCategory,
        'privacy': _privacy,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .collection('drafts')
          .doc(widget.draftId ??
              DateTime.now().millisecondsSinceEpoch.toString(),)
          .set(draftData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.save_rounded, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '💾 บันทึกแบบร่างแล้ว',
                    style: GoogleFonts.kanit(color: Colors.white),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error saving draft: $e');
    } finally {
      setState(() => _isSavingDraft = false);
    }
  }

  Future<void> _pickImages() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(imageQuality: 80);
      if (images.isNotEmpty) {
        setState(() {
          _selectedImages.addAll(images.map((img) => File(img.path)));
          if (_selectedImages.length > 10) {
            _selectedImages = _selectedImages.sublist(0, 10);
          }
        });
      }
    } catch (e) {
      debugPrint('Image picker error: $e');
    }
  }

  Future<void> _pickImageFromCamera() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 80,
      );
      if (image != null) {
        setState(() {
          _selectedImages.add(File(image.path));
          if (_selectedImages.length > 10) {
            _selectedImages = _selectedImages.sublist(0, 10);
          }
        });
      }
    } catch (e) {
      debugPrint('Camera error: $e');
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);

    try {
      final bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('กรุณาเปิดบริการตำแหน่ง');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('กรุณาอนุญาตการเข้าถึงตำแหน่งในการตั้งค่า');
      }

      final position = await Geolocator.getCurrentPosition();
      setState(() {
        _currentLocation = position;
        _locationName =
            '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
        _locationController.text = _locationName!;
      });
    } catch (e) {
      debugPrint('Location error: $e');
    } finally {
      setState(() => _isLoadingLocation = false);
    }
  }

  void _extractTags() {
    _contentController.addListener(() {
      final text = _contentController.text;
      final hashtagRegex = RegExp(r'#\w+');
      final mentionRegex = RegExp(r'@\w+');

      setState(() {
        _hashtags =
            hashtagRegex.allMatches(text).map((m) => m.group(0)!).toList();
        _mentions =
            mentionRegex.allMatches(text).map((m) => m.group(0)!).toList();
      });
    });
  }

  void _addPollOption() {
    if (_pollOptions.length < 10) {
      setState(() {
        _pollOptions.add(TextEditingController());
      });
    }
  }

  void _removePollOption(int index) {
    if (_pollOptions.length > 2) {
      setState(() {
        _pollOptions[index].dispose();
        _pollOptions.removeAt(index);
      });
    }
  }

  Future<void> _submitPost() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();

    if (title.isEmpty && content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'กรุณาระบุหัวข้อหรือเนื้อหา',
                  style: GoogleFonts.kanit(color: Colors.white),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
      return;
    }

    if (ProfanityFilter.hasProfanity(title) ||
        ProfanityFilter.hasProfanity(content)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline_rounded, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '⚠️ เนื้อหาของคุณขัดต่อกฎการใช้งาน (ใช้คำไม่สุภาพ)',
                    style: GoogleFonts.kanit(color: Colors.white),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
      return;
    }

    setState(() => _isPosting = true);

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('กรุณาเข้าสู่ระบบก่อนโพสต์');

      final List<String> imageUrls = [];
      if (_selectedImages.isNotEmpty) {
        for (int i = 0; i < _selectedImages.length; i++) {
          final url = await TukTukStorageBridge().upload(
            _selectedImages[i],
            'community',
            contentType: 'image/jpeg',
          );
          if (url != null) imageUrls.add(url);
        }
      }

      final videoUrl = _videoUrlController.text.trim();
      final bool hasVideo = videoUrl.isNotEmpty;
      final bool isCreatingGroup =
          _selectedCategory == 'groups' || _selectedCategory.startsWith('eco_');

      final postData = {
        'title': title,
        'content': content,
        'description': content,
        'imageUrl': imageUrls.isNotEmpty ? imageUrls.first : null,
        'images': imageUrls,
        'videoUrl': hasVideo ? videoUrl : null,
        'isOfficialGroup': _selectedCategory.startsWith('eco_'),
        'youtubeUrl':
            hasVideo && videoUrl.contains('youtube') ? videoUrl : null,
        'authorId': user.uid,
        'authorName': user.displayName ?? 'สมาชิก',
        'authorAvatar': user.photoURL,
        'authorPictureUrl': user.photoURL,
        'likes': 0,
        'commentsCount': 0,
        'sharesCount': 0,
        'viewsCount': 0,
        'category': _selectedCategory,
        'createdAt': _scheduledTime != null
            ? Timestamp.fromDate(_scheduledTime!)
            : FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'status': _scheduledTime != null ? 'scheduled' : 'active',
        'published': _scheduledTime == null,
        'privacy': _privacy,
        'isGroup': isCreatingGroup,
        'type': isCreatingGroup
            ? 'group'
            : (hasVideo
                ? 'video'
                : (_selectedImages.isNotEmpty ? 'image' : 'text')),
        'location': _currentLocation != null
            ? {
                'latitude': _currentLocation!.latitude,
                'longitude': _currentLocation!.longitude,
                'name': _locationName,
              }
            : null,
        'hashtags': _hashtags,
        'mentions': _mentions,
        'hasPoll': _hasPoll,
        'poll': _hasPoll
            ? {
                'options': _pollOptions
                    .map((c) => c.text.trim())
                    .where((t) => t.isNotEmpty)
                    .map((option) => {
                          'text': option,
                          'votes': 0,
                        },)
                    .toList(),
                'totalVotes': 0,
                'endsAt': Timestamp.fromDate(
                    DateTime.now().add(Duration(days: _pollDuration)),),
              }
            : null,
      };

      if (isCreatingGroup) {
        postData['groupAdmins'] = [user.uid];
        postData['groupMembers'] = [user.uid];
        postData['memberCount'] = 1;
        postData['groupName'] = title;
      }

      await FirebaseFirestore.instance
          .collection('posts')
          .add(postData);

      if (_currentLocation != null) {
        await TukTukTokenomics().awardPoints(
          MissionType.locationPin,
          description: 'ปักหมุดสถานที่ในโพสต์',
        );
      }

      if (hasVideo) {
        await TukTukTokenomics().awardPoints(
          MissionType.postCreation,
          description: 'สร้างโพสต์วิดีโอ',
        );
      } else {
        await TukTukTokenomics().awardPoints(
          MissionType.postCreation,
          description: 'สร้างโพสต์ในชุมชน',
        );
      }

      if (widget.draftId != null) {
        await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .collection('drafts')
            .doc(widget.draftId)
            .delete();
      }

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(
                  _scheduledTime != null ? Icons.schedule : Icons.check_circle,
                  color: Colors.white,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _scheduledTime != null
                        ? '⏰ กำหนดเวลาโพสต์สำเร็จ!'
                        : '🚀 เผยแพร่โพสต์และได้รับเหรียญแล้ว!',
                    style: GoogleFonts.kanit(color: Colors.white),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Post error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('เกิดข้อผิดพลาด: $e'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Scaffold(
        backgroundColor: const Color(0xFF0A0E21),
        appBar: _buildAppBar(),
        body: _buildBody(),
        bottomNavigationBar: _buildBottomBar(),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final isEco = _selectedCategory.startsWith('eco_');
    final category = _categories.firstWhere(
      (c) => c['id'] == _selectedCategory,
      orElse: () => _categories.last,
    );

    return AppBar(
      backgroundColor: const Color(0xFF1A1F35),
      elevation: 0,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: const Icon(Icons.close, color: Colors.white, size: 20),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  category['color'].withValues(alpha: 0.2),
                  category['color'].withValues(alpha: 0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              category['icon'],
              color: category['color'],
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEco
                      ? 'โพสต์เข้ากลุ่มอาชีพ'
                      : (_selectedCategory == 'groups'
                          ? 'สร้างกลุ่มใหม่'
                          : 'สร้างโพสต์ใหม่'),
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (isEco)
                  Text(
                    category['label'],
                    style: GoogleFonts.kanit(
                      color: category['color'],
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        // Save Draft
        Container(
          margin: const EdgeInsets.only(right: 8),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: _isSavingDraft
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.save_outlined,
                      color: Colors.white70, size: 18,),
            ),
            onPressed: _isSavingDraft ? null : _saveDraft,
          ),
        ),
        // Post Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: _buildPostButton(),
        ),
      ],
    );
  }

  Widget _buildPostButton() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      child: ElevatedButton(
        onPressed: _isPosting ? null : _submitPost,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00f2ea),
          foregroundColor: Colors.black,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        ),
        child: _isPosting
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.black,
                  strokeWidth: 2,
                ),
              )
            : Row(
                children: [
                  const Icon(Icons.send_rounded, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'โพสต์',
                    style: GoogleFonts.kanit(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildBody() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildUserInfo(),
          const SizedBox(height: 24),
          _buildCategorySelector(),
          const SizedBox(height: 16),
          if (_selectedCategory.startsWith('eco_')) _buildEcoBanner(),
          const SizedBox(height: 16),
          _buildTitleField(),
          const SizedBox(height: 8),
          _buildContentField(),
          if (_hashtags.isNotEmpty || _mentions.isNotEmpty) _buildTags(),
          const SizedBox(height: 16),
          _buildVideoUrlField(),
          const SizedBox(height: 16),
          if (_currentLocation != null) _buildLocationBadge(),
          const SizedBox(height: 16),
          if (_hasPoll) _buildPollSection(),
          const SizedBox(height: 16),
          if (_selectedImages.isNotEmpty) _buildImageGrid(),
          const SizedBox(height: 16),
          if (_scheduledTime != null) _buildScheduleBadge(),
        ],
      ),
    );
  }

  Widget _buildUserInfo() {
    final user = FirebaseAuth.instance.currentUser;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white.withValues(alpha: 0.05),
            Colors.white.withValues(alpha: 0.02),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: Colors.white.withValues(alpha: 0.05),
                backgroundImage: user?.photoURL != null
                    ? NetworkImage(user!.photoURL!)
                    : null,
                child: user?.photoURL == null
                    ? const Icon(Icons.person, color: Colors.white38, size: 30)
                    : null,
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFF1A1F35),
                      width: 2,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.displayName ?? 'สมาชิกทั่วไป',
                  style: GoogleFonts.kanit(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _buildPrivacySelector(),
                    const SizedBox(width: 8),
                    if (_selectedCategory == 'groups')
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4,),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.purple.withValues(alpha: 0.2),
                              Colors.purple.withValues(alpha: 0.1),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border:
                              Border.all(color: Colors.purple.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.group_add_rounded,
                                color: Colors.purpleAccent, size: 12,),
                            const SizedBox(width: 4),
                            Text(
                              'โหมดสร้างกลุ่ม',
                              style: GoogleFonts.kanit(
                                fontSize: 10,
                                color: Colors.purpleAccent,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat['id'];

          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedCategory = cat['id'];
                if (cat['id'] == 'groups') {
                  _privacy = 'private';
                }
              });
            },
            child: Container(
              width: 90,
              margin: const EdgeInsets.only(right: 10),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? LinearGradient(
                        colors: [
                          cat['color'].withValues(alpha: 0.3),
                          cat['color'].withValues(alpha: 0.1),
                        ],
                      )
                    : null,
                color: isSelected ? null : Colors.white.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected
                      ? cat['color'].withValues(alpha: 0.5)
                      : Colors.white.withValues(alpha: 0.1),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: cat['color'].withValues(alpha: isSelected ? 0.2 : 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      cat['icon'],
                      color: isSelected ? cat['color'] : Colors.white54,
                      size: 24,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      cat['label'],
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.kanit(
                        color: isSelected ? Colors.white : Colors.white54,
                        fontSize: 10,
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEcoBanner() {
    final category = _categories.firstWhere(
      (c) => c['id'] == _selectedCategory,
      orElse: () => _categories.first,
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            category['color'].withValues(alpha: 0.2),
            Colors.transparent,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: category['color'].withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: category['color'].withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              category['icon'],
              color: category['color'],
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'กลุ่ม: ${category['label']}',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'พื้นที่แบ่งปันประสบการณ์ แรงบันดาลใจ และช่วยเหลือกันเพื่อคนไทย',
                  style: GoogleFonts.kanit(
                    color: Colors.white70,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.eco_rounded,
                color: Colors.greenAccent, size: 20,),
          ),
        ],
      ),
    );
  }

  Widget _buildTitleField() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: TextField(
        controller: _titleController,
        style: GoogleFonts.kanit(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        decoration: InputDecoration(
          hintText: _selectedCategory == 'groups'
              ? 'ชื่อกลุ่มของคุณ...'
              : 'หัวข้อเรื่อง...',
          hintStyle: GoogleFonts.kanit(
            color: Colors.white24,
            fontSize: 20,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildContentField() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: TextField(
        controller: _contentController,
        maxLines: null,
        minLines: 8,
        style: GoogleFonts.kanit(
          fontSize: 15,
          height: 1.6,
          color: Colors.white70,
        ),
        decoration: InputDecoration(
          hintText: _selectedCategory == 'groups'
              ? 'บรรยายรายละเอียดเกี่ยวกับกลุ่ม...'
              : 'แบ่งปันเรื่องราวของคุณที่นี่...\n\nใช้ #แฮชแท็ก และ @กล่าวถึง',
          hintStyle: GoogleFonts.kanit(
            color: Colors.white24,
            fontSize: 15,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildTags() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'แท็กที่พบ',
            style: GoogleFonts.kanit(
              color: Colors.white54,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ..._hashtags.map((tag) => Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      tag,
                      style: GoogleFonts.kanit(
                        color: Colors.blueAccent,
                        fontSize: 12,
                      ),
                    ),
                  ),),
              ..._mentions.map((mention) => Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      mention,
                      style: GoogleFonts.kanit(
                        color: Colors.greenAccent,
                        fontSize: 12,
                      ),
                    ),
                  ),),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVideoUrlField() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.link, color: Colors.redAccent, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: _videoUrlController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'วางลิงก์ YouTube หรือวิดีโอ',
                hintStyle: GoogleFonts.kanit(
                  color: Colors.white24,
                  fontSize: 14,
                ),
                border: InputBorder.none,
              ),
            ),
          ),
          if (_videoUrlController.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear, color: Colors.white24, size: 18),
              onPressed: _videoUrlController.clear,
            ),
        ],
      ),
    );
  }

  Widget _buildLocationBadge() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green.withValues(alpha: 0.1),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.location_on, color: Colors.greenAccent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ปักหมุดตำแหน่งแล้ว',
                  style: GoogleFonts.kanit(
                    color: Colors.greenAccent,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _locationName ?? 'กำลังโหลด...',
                  style: GoogleFonts.kanit(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white54, size: 16),
            ),
            onPressed: () {
              setState(() {
                _currentLocation = null;
                _locationName = null;
                _locationController.clear();
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPollSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.purple.withValues(alpha: 0.1),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.purple.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.poll, color: Colors.purpleAccent),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '📊 สร้างโพล',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                  ),
                  child:
                      const Icon(Icons.close, color: Colors.white54, size: 16),
                ),
                onPressed: () {
                  setState(() {
                    _hasPoll = false;
                    for (final controller in _pollOptions) {
                      controller.clear();
                    }
                  });
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...List.generate(_pollOptions.length, (index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: Colors.purple.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: GoogleFonts.kanit(
                          color: Colors.purpleAccent,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _pollOptions[index],
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'ตัวเลือกที่ ${index + 1}',
                        hintStyle: const TextStyle(
                            color: Colors.white24, fontSize: 14,),
                        filled: true,
                        fillColor: const Color(0xFF1A1F35),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12,),
                      ),
                    ),
                  ),
                  if (_pollOptions.length > 2)
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline,
                          color: Colors.redAccent,),
                      onPressed: () => _removePollOption(index),
                    ),
                ],
              ),
            );
          }),
          if (_pollOptions.length < 10)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: TextButton.icon(
                onPressed: _addPollOption,
                icon: const Icon(Icons.add, color: Colors.purpleAccent),
                label: Text(
                  'เพิ่มตัวเลือก',
                  style: GoogleFonts.kanit(color: Colors.purpleAccent),
                ),
                style: TextButton.styleFrom(
                  backgroundColor: Colors.purple.withValues(alpha: 0.1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.timer, color: Colors.white54, size: 18),
              const SizedBox(width: 8),
              Text(
                'ระยะเวลาโพล:',
                style: GoogleFonts.kanit(color: Colors.white70),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.purple.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
                ),
                child: DropdownButton<int>(
                  value: _pollDuration,
                  dropdownColor: const Color(0xFF1A1F35),
                  style: GoogleFonts.kanit(color: Colors.white),
                  underline: Container(),
                  icon: const Icon(Icons.arrow_drop_down,
                      color: Colors.purpleAccent,),
                  items: [1, 3, 7, 14, 30].map((days) {
                    return DropdownMenuItem(
                      value: days,
                      child: Text('$days วัน'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() => _pollDuration = value!);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildImageGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: _selectedImages.length,
      itemBuilder: (context, index) {
        return Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.file(
                _selectedImages[index],
                width: double.infinity,
                height: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedImages.removeAt(index);
                  });
                },
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                  ),
                  child: const Icon(
                    Icons.close,
                    color: Colors.white,
                    size: 14,
                  ),
                ),
              ),
            ),
            if (index == 0)
              Positioned(
                top: 4,
                left: 4,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.orangeAccent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'ปก',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildScheduleBadge() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.orange.withValues(alpha: 0.1),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.schedule, color: Colors.orangeAccent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'กำหนดเวลาโพสต์',
                  style: GoogleFonts.kanit(
                    color: Colors.orangeAccent,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('d MMM yyyy, HH:mm', 'th').format(_scheduledTime!),
                  style: GoogleFonts.kanit(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white54, size: 16),
            ),
            onPressed: () {
              setState(() => _scheduledTime = null);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 8,
        left: 8,
        right: 8,
        top: 8,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF1A1F35),
            Color(0xFF0A0E21),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildToolButton(
              icon: Icons.image,
              label: 'รูปภาพ',
              color: const Color(0xFF34A853),
              onTap: _pickImages,
            ),
            _buildToolButton(
              icon: Icons.camera_alt,
              label: 'กล้อง',
              color: const Color(0xFFEA4335),
              onTap: _pickImageFromCamera,
            ),
            _buildToolButton(
              icon: Icons.location_on,
              label: 'ตำแหน่ง',
              color: _currentLocation != null
                  ? Colors.greenAccent
                  : Colors.white54,
              isLoading: _isLoadingLocation,
              onTap: _isLoadingLocation ? null : _getCurrentLocation,
            ),
            _buildToolButton(
              icon: Icons.poll,
              label: 'โพล',
              color: _hasPoll ? Colors.purpleAccent : Colors.white54,
              onTap: () => setState(() => _hasPoll = !_hasPoll),
            ),
            _buildToolButton(
              icon: Icons.schedule,
              label: 'กำหนดเวลา',
              color:
                  _scheduledTime != null ? Colors.orangeAccent : Colors.white54,
              onTap: _pickSchedule,
            ),
            const SizedBox(width: 20),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified_user_outlined,
                      color: Colors.white38, size: 14,),
                  const SizedBox(width: 4),
                  Text(
                    'ระบบคัดกรอง',
                    style: GoogleFonts.kanit(
                      color: Colors.white38,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToolButton({
    required IconData icon,
    required String label,
    required Color color,
    VoidCallback? onTap,
    bool isLoading = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(30),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                if (isLoading)
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: color,
                      strokeWidth: 2,
                    ),
                  )
                else
                  Icon(icon, color: color, size: 18),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: GoogleFonts.kanit(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPrivacySelector() {
    IconData icon;
    String label;
    Color color;

    switch (_privacy) {
      case 'private':
        icon = Icons.lock_outline;
        label = 'กลุ่มปิด';
        color = Colors.redAccent;
        break;
      case 'followers':
        icon = Icons.people_outline;
        label = 'เฉพาะผู้ติดตาม';
        color = Colors.blueAccent;
        break;
      default:
        icon = Icons.public;
        label = 'สาธารณะ';
        color = Colors.greenAccent;
    }

    return GestureDetector(
      onTap: _showPrivacyPicker,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              color.withValues(alpha: 0.1),
              color.withValues(alpha: 0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: GoogleFonts.kanit(
                fontSize: 11,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
            Icon(Icons.arrow_drop_down, size: 14, color: color),
          ],
        ),
      ),
    );
  }

  void _showPrivacyPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'ใครบ้างที่จะเห็นโพสต์นี้?',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 20),
            _buildPrivacyOption(
              icon: Icons.public,
              title: 'สาธารณะ',
              subtitle: 'ทุกคนใน TukTuk สามารถเห็นได้',
              color: Colors.greenAccent,
              value: 'public',
            ),
            _buildPrivacyOption(
              icon: Icons.people_outline,
              title: 'เฉพาะผู้ติดตาม',
              subtitle: 'เพื่อนและผู้ที่ติดตามคุณเท่านั้น',
              color: Colors.blueAccent,
              value: 'followers',
            ),
            _buildPrivacyOption(
              icon: Icons.lock_outline,
              title: 'ส่วนตัว / สมาชิกกลุ่ม',
              subtitle: 'เห็นได้เฉพาะคุณหรือสมาชิกที่ได้รับอนุญาต',
              color: Colors.redAccent,
              value: 'private',
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildPrivacyOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required String value,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(
        title,
        style: GoogleFonts.kanit(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.kanit(
          color: Colors.white54,
          fontSize: 12,
        ),
      ),
      onTap: () {
        setState(() => _privacy = value);
        Navigator.pop(context);
      },
    );
  }

  Future<void> _pickSchedule() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Colors.orangeAccent,
              onPrimary: Colors.black,
              surface: Color(0xFF1A1F35),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.now(),
        builder: (context, child) {
          return Theme(
            data: ThemeData.dark().copyWith(
              colorScheme: const ColorScheme.dark(
                primary: Colors.orangeAccent,
                onPrimary: Colors.black,
                surface: Color(0xFF1A1F35),
                onSurface: Colors.white,
              ),
            ),
            child: child!,
          );
        },
      );

      if (time != null) {
        setState(() {
          _scheduledTime = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }
}
