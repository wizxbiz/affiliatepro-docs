import 'dart:io';

import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> userData;
  const EditProfileScreen({super.key, required this.userData});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _usernameController;
  late TextEditingController _bioController;
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _locationController;
  late TextEditingController _websiteController;

  String? _selectedCategory;
  File? _imageFile;
  bool _isSaving = false;

  final List<Map<String, dynamic>> _categories = [
    {'label': 'ทั่วไป', 'icon': Icons.person_rounded},
    {'label': 'เกษตรกร/ผู้ผลิต', 'icon': Icons.agriculture_rounded},
    {'label': 'ร้านค้า/SME', 'icon': Icons.storefront_rounded},
    {'label': 'ผู้ซื้อ/โรงงาน', 'icon': Icons.factory_rounded},
    {'label': 'ผู้เชี่ยวชาญ/ที่ปรึกษา', 'icon': Icons.psychology_rounded},
  ];

  @override
  void initState() {
    super.initState();
    _nameController =
        TextEditingController(text: widget.userData['displayName'] ?? '');

    // Logic: Match ProfileScreen handle generation
    String initialHandle =
        widget.userData['handle'] ?? widget.userData['username'] ?? '';
    if (initialHandle.isEmpty) {
      final String disp = widget.userData['displayName'] ?? '';
      initialHandle = disp.replaceAll(' ', '').toLowerCase();
    }

    _usernameController = TextEditingController(text: initialHandle);
    _bioController = TextEditingController(text: widget.userData['bio'] ?? '');
    _phoneController =
        TextEditingController(text: widget.userData['phone'] ?? '');
    _emailController =
        TextEditingController(text: widget.userData['email'] ?? '');
    _locationController =
        TextEditingController(text: widget.userData['location'] ?? '');
    _websiteController =
        TextEditingController(text: widget.userData['website'] ?? '');
    _selectedCategory = widget.userData['userCategory'] ??
        widget.userData['category'] ??
        'ทั่วไป';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _bioController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _locationController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final bio = _bioController.text.trim();

    if (ProfanityFilter.hasProfanity(name) ||
        ProfanityFilter.hasProfanity(bio)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⚠️ ชื่อและคำแนะนำตัวของคุณมีเนื้อหาที่ไม่เหมาะสม'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    }

    setState(() => _isSaving = true);

    try {
      final uid = widget.userData['uid'];
      if (uid == null) throw 'ไม่พบรหัสผู้ใช้';

      final updates = {
        'displayName': _nameController.text.trim(),
        'handle': _usernameController.text
            .trim()
            .toLowerCase(), // Save as handle per ProfileScreen
        'username':
            _usernameController.text.trim().toLowerCase(), // Keep for legacy
        'bio': _bioController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'location': _locationController.text.trim(),
        'website': _websiteController.text.trim(),
        'userCategory': _selectedCategory,
        'category': _selectedCategory, // Dual save for compatibility
      };

      final success = await TukTukBridge().updateUserProfile(uid, updates);

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Text('บันทึกข้อมูลเรียบร้อยแล้ว', style: GoogleFonts.kanit()),
                ],
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),),
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        throw 'ไม่สามารถบันทึกข้อมูลลง Firestore ได้';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('เกิดข้อผิดพลาด: $e', style: GoogleFonts.kanit()),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      appBar: _buildAppBar(),
      body: FadeInUp(
        duration: const Duration(milliseconds: 500),
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          physics: const BouncingScrollPhysics(),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildAvatarSection(),
                const SizedBox(height: 32),
                _buildSectionHeader('ข้อมูลพื้นฐาน', Icons.badge_outlined),
                const SizedBox(height: 16),
                _buildModernTextField(
                  label: 'ชื่อที่แสดง',
                  controller: _nameController,
                  icon: Icons.person_outline_rounded,
                  validator: (v) => v!.isEmpty ? 'กรุณากรอกชื่อ' : null,
                ),
                const SizedBox(height: 16),
                _buildModernTextField(
                  label: 'ชื่อผู้ใช้ (Handle)',
                  controller: _usernameController,
                  icon: Icons.alternate_email_rounded,
                  hint: 'เช่น somchai_farm',
                  validator: (v) => v!.isEmpty ? 'กรุณากรอกชื่อผู้ใช้' : null,
                ),
                const SizedBox(height: 16),
                _buildModernTextField(
                  label: 'คำอธิบาย (Bio)',
                  controller: _bioController,
                  icon: Icons.notes_rounded,
                  maxLines: 4,
                  hint: 'บอกเล่าเรื่องราวของคุณ...',
                ),
                const SizedBox(height: 32),
                _buildSectionHeader('ประเภทผู้ผลิต', Icons.category_outlined),
                const SizedBox(height: 16),
                _buildCategorySelector(),
                const SizedBox(height: 32),
                _buildSectionHeader(
                    'ข้อมูลติดต่อ', Icons.contact_mail_outlined,),
                const SizedBox(height: 16),
                _buildModernTextField(
                  label: 'อีเมล',
                  controller: _emailController,
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                _buildModernTextField(
                  label: 'เบอร์โทรศัพท์',
                  controller: _phoneController,
                  icon: Icons.phone_android_rounded,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                _buildModernTextField(
                  label: 'ที่อยู่/จังหวัด',
                  controller: _locationController,
                  icon: Icons.location_on_outlined,
                ),
                const SizedBox(height: 16),
                _buildModernTextField(
                  label: 'เว็บไซต์/ลิงก์',
                  controller: _websiteController,
                  icon: Icons.link_rounded,
                  hint: 'https://...',
                ),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 20,),
        ),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        'แก้ไขโปรไฟล์',
        style: GoogleFonts.kanit(fontWeight: FontWeight.bold, fontSize: 20),
      ),
      actions: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ElevatedButton(
            onPressed: _isSaving ? null : _saveProfile,
            style: ElevatedButton.styleFrom(
              backgroundColor: _isSaving ? Colors.grey : Colors.orangeAccent,
              foregroundColor: Colors.black,
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),),
              padding: const EdgeInsets.symmetric(horizontal: 20),
            ),
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.black,),)
                : Text('บันทึก',
                    style: GoogleFonts.kanit(fontWeight: FontWeight.bold),),
          ),
        ),
      ],
    );
  }

  Widget _buildAvatarSection() {
    final currentPic =
        widget.userData['pictureUrl'] ?? widget.userData['photoURL'];

    return Center(
      child: Stack(
        children: [
          Container(
            width: 130,
            height: 130,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.orangeAccent.withValues(alpha: 0.2),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
              border:
                  Border.all(color: Colors.white.withValues(alpha: 0.1), width: 4),
            ),
            child: ClipOval(
              child: _imageFile != null
                  ? Image.file(_imageFile!, fit: BoxFit.cover)
                  : (currentPic != null && currentPic.startsWith('http')
                      ? CachedNetworkImage(
                          imageUrl: currentPic,
                          placeholder: (context, url) =>
                              Container(color: Colors.white10),
                          errorWidget: (context, url, error) => const Icon(
                              Icons.person,
                              size: 60,
                              color: Colors.white24,),
                          fit: BoxFit.cover,
                        )
                      : Container(
                          color: Colors.white.withValues(alpha: 0.05),
                          child: const Icon(Icons.person,
                              size: 60, color: Colors.white24,),
                        )),
            ),
          ),
          Positioned(
            bottom: 5,
            right: 5,
            child: GestureDetector(
              onTap: _pickImage,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orangeAccent,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF0A0E21), width: 3),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3), blurRadius: 10,),
                  ],
                ),
                child: const Icon(Icons.camera_enhance_rounded,
                    color: Colors.black, size: 20,),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: Colors.orangeAccent, size: 18),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.kanit(
            color: Colors.orangeAccent,
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.1,
          ),
        ),
      ],
    );
  }

  Widget _buildModernTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    int maxLines = 1,
    String? hint,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        validator: validator,
        style: GoogleFonts.kanit(color: Colors.white, fontSize: 16),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.kanit(color: Colors.white38, fontSize: 14),
          hintText: hint,
          hintStyle: GoogleFonts.kanit(color: Colors.white.withValues(alpha: 0.05)),
          prefixIcon: Icon(icon, color: Colors.white38, size: 22),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildCategorySelector() {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat['label'];

          return GestureDetector(
            onTap: () => setState(() => _selectedCategory = cat['label']),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 100,
              margin: const EdgeInsets.only(right: 12),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.orangeAccent.withValues(alpha: 0.15)
                    : Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? Colors.orangeAccent.withValues(alpha: 0.5)
                      : Colors.white.withValues(alpha: 0.08),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    cat['icon'],
                    color: isSelected ? Colors.orangeAccent : Colors.white38,
                    size: 28,
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(
                      cat['label'],
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.kanit(
                        color: isSelected ? Colors.white : Colors.white38,
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
}
