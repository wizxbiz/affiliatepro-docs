import 'dart:convert';
import 'dart:io';

import 'package:better_player_plus/better_player_plus.dart';
import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/tuktuk_storage_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart'; // ✅ Added for pinning
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PostProductScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  const PostProductScreen({super.key, this.initialData});

  @override
  State<PostProductScreen> createState() => _PostProductScreenState();
}

class _PostProductScreenState extends State<PostProductScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _priceController;
  late final TextEditingController _stockController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _productLinkController;
  late final TextEditingController _productUnitController;
  late final TextEditingController _sellerNameController;
  late final TextEditingController _sellerPhoneController;
  late final TextEditingController _sellerLineIdController;
  late final TextEditingController _sellerFacebookController;

  @override
  void initState() {
    super.initState();
    _nameController =
        TextEditingController(text: widget.initialData?['productName'] ?? '');
    _priceController =
        TextEditingController(text: widget.initialData?['price'] ?? '');
    _stockController =
        TextEditingController(text: widget.initialData?['stock'] ?? '1');
    _descriptionController =
        TextEditingController(text: widget.initialData?['description'] ?? '');
    _productLinkController = TextEditingController();
    _productUnitController = TextEditingController();
    _sellerNameController = TextEditingController();
    _sellerPhoneController = TextEditingController();
    _sellerLineIdController = TextEditingController();
    _sellerFacebookController = TextEditingController();

    if (widget.initialData?['marketType'] != null) {
      _selectedMarketType = widget.initialData!['marketType'] as String;
    }
    if (widget.initialData?['category'] != null) {
      _selectedCategory = widget.initialData!['category'] as String;
    }
    if (widget.initialData?['sellerLocation'] != null) {
      _selectedProvince = widget.initialData!['sellerLocation'] as String;
    }

    // Load specialized data if editing
    if (widget.initialData?['productOptions'] != null) {
      _productOptions = List<Map<String, dynamic>>.from(
          widget.initialData!['productOptions'] as List,);
    }
    if (widget.initialData?['customFields'] != null) {
      _customFields = List<Map<String, dynamic>>.from(
          widget.initialData!['customFields'] as List,);
    }

    // OTOP/Organic flags
    _isOTOP = widget.initialData?['isOTOP'] == true;
    _isOrganic = widget.initialData?['isOrganic'] == true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    _descriptionController.dispose();
    _productLinkController.dispose();
    _productUnitController.dispose();
    _sellerNameController.dispose();
    _sellerPhoneController.dispose();
    _sellerLineIdController.dispose();
    _sellerFacebookController.dispose();
    super.dispose();
  }

  String _selectedMarketType =
      'secondhand'; // 'secondhand', 'community', or 'consignment'
  String _selectedCategory = 'retail_online';
  String _selectedProvince = ''; // จังหวัด
  XFile? _mainImage;
  XFile? _productVideo;
  BetterPlayerController? _videoPlayerController;
  final List<XFile> _additionalImages = [];
  bool _isUploading = false;
  String _uploadStatus = 'กําลังอัปโหลด...';
  bool _isAnalyzing = false;
  bool _isOTOP = false;
  bool _isOrganic = false;
  String _userTier = 'free'; // 'free', 'trial', 'pro', 'yearly'

  // 📍 Location Pinning Variables
  Position? _currentPosition;
  String _currentAddress = 'ยังไม่ได้ระบุตำแหน่งร้านค้า';
  bool _isLocationLoading = false;

  // 🍔 Food & Service Policies (New Features)
  List<Map<String, dynamic>> _productOptions = []; // {name, price}
  List<Map<String, dynamic>> _customFields = []; // {label, value}

  final List<Map<String, String>> _categoriesList = [
    {'value': 'agriculture', 'label': 'เกษตรกรรม (พืช/สัตว์/ประมง)'},
    {'value': 'otop_food', 'label': 'อาหาร / อาหารแปรรูป / OTOP'},
    {'value': 'retail_online', 'label': 'ค้าปลีก / พ่อค้าแม่ค้าออนไลน์'},
    {'value': 'secondhand', 'label': 'สินค้ามือสอง / ของใช้แล้ว'},
    {'value': 'electronics', 'label': 'เครื่องใช้ไฟฟ้า / ไอที'},
    {'value': 'services', 'label': 'งานบริการ / ช่าง / ขนส่ง'},
    {'value': 'other', 'label': 'อื่นๆ'},
  ];

  final List<String> _provinces = [
    'กรุงเทพมหานคร',
    'กระบี่',
    'กาญจนบุรี',
    'กาฬสินธุ์',
    'กำแพงเพชร',
    'ขอนแก่น',
    'จันทบุรี',
    'ฉะเชิงเทรา',
    'ชลบุรี',
    'ชัยนาท',
    'ชัยภูมิ',
    'ชุมพร',
    'เชียงราย',
    'เชียงใหม่',
    'ตรัง',
    'ตราด',
    'ตาก',
    'นครนายก',
    'นครปฐม',
    'นครพนม',
    'นครราชสีมา',
    'นครศรีธรรมราช',
    'นครสวรรค์',
    'นนทบุรี',
    'นราธิวาส',
    'น่าน',
    'บึงกาฬ',
    'บุรีรัมย์',
    'ปทุมธานี',
    'ประจวบคีรีขันธ์',
    'ปราจีนบุรี',
    'ปัตตานี',
    'พระนครศรีอยุธยา',
    'พะเยา',
    'พังงา',
    'พัทลุง',
    'พิจิตร',
    'พิษณุโลก',
    'เพชรบุรี',
    'เพชรบูรณ์',
    'แพร่',
    'ภูเก็ต',
    'มหาสารคาม',
    'มุกดาหาร',
    'แม่ฮ่องสอน',
    'ยโสธร',
    'ยะลา',
    'ร้อยเอ็ด',
    'ระนอง',
    'ระยอง',
    'ราชบุรี',
    'ลพบุรี',
    'ลำปาง',
    'ลำพูน',
    'เลย',
    'ศรีสะเกษ',
    'สกลนคร',
    'สงขลา',
    'สตูล',
    'สมุทรปราการ',
    'สมุทรสงคราม',
    'สมุทรสาคร',
    'สระแก้ว',
    'สระบุรี',
    'สิงห์บุรี',
    'สุโขทัย',
    'สุพรรณบุรี',
    'สุราษฎร์ธานี',
    'สุรินทร์',
    'หนองคาย',
    'หนองบัวลำภู',
    'อ่างทอง',
    'อำนาจเจริญ',
    'อุดรธานี',
    'อุตรดิตถ์',
    'อุทัยธานี',
    'อุบลราชธานี',
  ];

  final int _maxAdditionalImages = 3;
  final int _freeAILimit = 3;

  Future<void> _pinLocation() async {
    setState(() => _isLocationLoading = true);
    try {
      final pos = await TukTukLocationService().getCurrentLocationAndSync();
      if (pos != null) {
        final addr = await TukTukLocationService()
            .getAddressFromCoords(pos.latitude, pos.longitude);

        setState(() {
          _currentPosition = pos;
          _currentAddress = '${addr['district']}, ${addr['province']}';

          // Auto-select province if found
          if (addr['province'] != null) {
            final String foundProvince = addr['province']!;
            for (final p in _provinces) {
              if (foundProvince.contains(p) || p.contains(foundProvince)) {
                _selectedProvince = p;
                break;
              }
            }
          }
        });
        _showToast('📍 บันทึกพิกัดร้านค้าสำเร็จ!', Colors.green);
      } else {
        _showToast('❌ ไม่สามารถเข้าถึงตำแหน่งของคุณได้', Colors.red);
      }
    } catch (e) {
      debugPrint('Pin Location Error: $e');
      _showToast('เกิดข้อผิดพลาดในการระบุตำแหน่ง', Colors.red);
    } finally {
      if (mounted) setState(() => _isLocationLoading = false);
    }
  }

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1E293B),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 10),
              Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),),),
              const SizedBox(height: 15),
              const Text('เลือกวิดีโอรีวิวสินค้า',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold,),),
              const SizedBox(height: 10),
              ListTile(
                leading: const Icon(Icons.videocam, color: Color(0xFF00D2FF)),
                title: const Text('ถ่ายวิดีโอใหม่ (จำกัด 60 วิ)',
                    style: TextStyle(color: Colors.white),),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
              ListTile(
                leading:
                    const Icon(Icons.video_library, color: Color(0xFF00D2FF)),
                title: const Text('เลือกจากคลังวิดีโอ',
                    style: TextStyle(color: Colors.white),),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );

    if (source != null) {
      try {
        final pickedFile = await picker.pickVideo(
          source: source,
          maxDuration: const Duration(seconds: 60), // Increased limit
        );

        if (pickedFile != null) {
          // Validate Size
          final file = File(pickedFile.path);
          final sizeInMb = await file.length() / (1024 * 1024);
          if (sizeInMb > 100) {
            _showToast('ไฟล์วิดีโอใหญ่เกินไป (จำกัด 100MB)', Colors.red);
            return;
          }

          setState(() {
            _productVideo = pickedFile;
            _initVideoPlayer();
          });
        }
      } catch (e) {
        debugPrint('Pick Video Error: $e');
        _showToast('ไม่สามารถเลือกวิดีโอได้', Colors.red);
      }
    }
  }

  void _initVideoPlayer() {
    if (_productVideo == null) return;
    _videoPlayerController?.dispose();
    _videoPlayerController = BetterPlayerController(
      const BetterPlayerConfiguration(
        aspectRatio: 1,
        autoPlay: true,
        looping: true,
        fit: BoxFit.cover,
        controlsConfiguration: BetterPlayerControlsConfiguration(
          showControls: false,
        ),
      ),
      betterPlayerDataSource: BetterPlayerDataSource(
        BetterPlayerDataSourceType.file,
        _productVideo!.path,
      ),
    );
  }

  Future<void> _pickMainImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _mainImage = pickedFile);
    }
  }

  Future<void> _pickAdditionalImages() async {
    if (_additionalImages.length >= _maxAdditionalImages) {
      _showToast('เพิ่มรูปได้สูงสุด $_maxAdditionalImages รูป', Colors.orange);
      return;
    }

    final picker = ImagePicker();
    final pickedFiles = await picker.pickMultiImage();
    if (pickedFiles.isNotEmpty) {
      setState(() {
        final remaining = _maxAdditionalImages - _additionalImages.length;
        _additionalImages.addAll(pickedFiles.take(remaining));
      });
    }
  }

  Future<bool> _checkAIQuota() async {
    try {
      final user = await TukTukBridge().getCurrentUser();

      // Determine tier
      final tier = user?['subscriptionPlan']?['tier'] ?? 'free';
      _userTier = tier;

      // Premium/Pro users have unlimited access
      if (tier == 'pro' || tier == 'yearly' || user?['isPremium'] == true) {
        return true;
      }

      final userId = user?['lineUserId'] ?? user?['uid'];

      if (userId != null) {
        // Check Firestore usage
        final usageDoc = await FirebaseFirestore.instance
            .collection('ai_post_usage')
            .doc(userId)
            .get();

        final usedCount = usageDoc.data()?['count'] ?? 0;

        if (usedCount >= _freeAILimit) {
          _showQuotaExhaustedDialog();
          return false;
        }
      } else {
        // Check local storage for guest users
        final prefs = await SharedPreferences.getInstance();
        final usedCount = prefs.getInt('ai_free_usage') ?? 0;

        if (usedCount >= _freeAILimit) {
          _showQuotaExhaustedDialog();
          return false;
        }
      }

      return true;
    } catch (e) {
      debugPrint('Error checking AI quota: $e');
      return true; // Allow on error
    }
  }

  Future<void> _incrementAIUsage() async {
    try {
      final user = await TukTukBridge().getCurrentUser();
      final userId = user?['lineUserId'] ?? user?['uid'];

      if (userId != null) {
        await FirebaseFirestore.instance
            .collection('ai_post_usage')
            .doc(userId)
            .set({
          'count': FieldValue.increment(1),
          'lastUsed': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true),);
      } else {
        final prefs = await SharedPreferences.getInstance();
        final currentCount = prefs.getInt('ai_free_usage') ?? 0;
        await prefs.setInt('ai_free_usage', currentCount + 1);
      }
    } catch (e) {
      debugPrint('Error incrementing AI usage: $e');
    }
  }

  void _showQuotaExhaustedDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome,
                  size: 40, color: Colors.orange,),
            ),
            const SizedBox(height: 16),
            const Text(
              'สิทธิ์ใช้งาน AI ฟรีหมดแล้ว',
              textAlign: TextAlign.center,
              style:
                  TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'คุณใช้สิทธิ์วิเคราะห์สินค้าฟรีครบ 3 ครั้งแล้ว\nอัปเกรดเป็น Pro เพื่อใช้งานได้ไม่จำกัด!',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 20),
            _buildUpgradeFeature(Icons.check_circle, 'ใช้งาน AI ได้ไม่จำกัด'),
            _buildUpgradeFeature(
                Icons.check_circle, 'ฟีเจอร์ AI SEO Boost (รายปี)',),
            _buildUpgradeFeature(Icons.check_circle, 'ไม่มีค่าธรรมเนียมการขาย'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('ไว้ทีหลัง',
                style: TextStyle(color: Colors.white30),),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to subscription or show plans
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orangeAccent,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),),
            ),
            child: const Text('อัปเกรดเป็น Pro',
                style: TextStyle(
                    fontWeight: FontWeight.bold, color: Colors.black,),),
          ),
        ],
      ),
    );
  }

  Widget _buildUpgradeFeature(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.greenAccent, size: 16),
          const SizedBox(width: 8),
          Text(text,
              style: const TextStyle(color: Colors.white60, fontSize: 12),),
        ],
      ),
    );
  }

  Future<void> _analyzeWithAI() async {
    if (_mainImage == null) {
      _showToast('กรุณาเลือกรูปสินค้าก่อน', Colors.red);
      return;
    }

    final canUse = await _checkAIQuota();
    if (!canUse) return;

    setState(() => _isAnalyzing = true);

    try {
      // Convert image to base64
      final bytes = await File(_mainImage!.path).readAsBytes();
      final base64Image = base64Encode(bytes);

      // Call AI API
      final response = await http.post(
        Uri.parse(
            'https://tuktukfeed-api.imtthailand2019.workers.dev/marketplaceAIGeneratePost',),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'imageBase64': base64Image,
          'additionalInfo': '',
          'lineUserId': null,
        }),
      );

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        if (result['success'] == true) {
          final data = result['data'];

          // Fill form with AI results
          setState(() {
            final isYearly = _userTier == 'yearly';

            if (data['productName'] != null) {
              _nameController.text = data['productName'];
            }

            if (data['suggestedPrice'] != null) {
              final priceStr = data['suggestedPrice'].toString();
              final priceNum =
                  int.tryParse(priceStr.replaceAll(RegExp(r'[^\d]'), ''));
              if (priceNum != null && priceNum > 0) {
                _priceController.text = priceNum.toString();
              }
            }

            // Build description
            String desc = '';
            if (isYearly) {
              desc +=
                  '🚀 [AI SEO Optimized Title]: ${data['title'] ?? data['productName']}\n\n';
            } else {
              if (data['title'] != null) desc += '${data['title']}\n\n';
            }

            if (data['description'] != null) {
              desc += '${data['description']}\n\n';
            }

            // Bonus for Yearly: Added Marketing Keywords & Emotional Branding
            if (isYearly) {
              desc += '✨ สรุปจุดเด่นระดับพรีเมียม:\n';
              desc += '• การันตีความคุ้มค่า\n';
              desc += '• สินค้าคัดเกรดคุณภาพสูง\n';
              desc += '• บริการรวดเร็วและเป็นมืออาชีพ\n\n';
            }

            if (data['callToAction'] != null) {
              desc += '${data['callToAction']}\n\n';
            }

            if (data['hashtags'] != null && data['hashtags'] is List) {
              desc += (data['hashtags'] as List).map((h) => '#$h').join(' ');
            }

            if (isYearly) {
              desc += '\n#SEO_Boost #PremiumSeller #TukTukThailand';
            }

            _descriptionController.text = desc.trim();

            // Map category
            if (data['category'] != null) {
              _selectedCategory = _mapCategory(data['category']);
            }
          });

          await _incrementAIUsage();
          _showToast('✅ AI วิเคราะห์สำเร็จ!', Colors.green);
        } else {
          throw Exception(result['error'] ?? 'AI processing failed');
        }
      } else {
        throw Exception('API request failed');
      }
    } catch (e) {
      debugPrint('AI Analysis Error: $e');
      _showToast('เกิดข้อผิดพลาดในการวิเคราะห์', Colors.red);
    } finally {
      setState(() => _isAnalyzing = false);
    }
  }

  String _mapCategory(String aiCategory) {
    final categoryMap = {
      'เกษตร': 'agriculture',
      'ผัก': 'agriculture',
      'ผลไม้': 'agriculture',
      'อาหาร': 'otop_food',
      'กิน': 'otop_food',
      'OTOP': 'otop_food',
      'ขาย': 'retail_online',
      'ใหม่': 'retail_online',
      'ของใช้': 'secondhand',
      'คอม': 'electronics',
      'มือถือ': 'electronics',
      'ไอที': 'electronics',
      'บริการ': 'services',
      'ช่าง': 'services',
    };

    for (final entry in categoryMap.entries) {
      if (aiCategory.contains(entry.key)) {
        return entry.value;
      }
    }
    return 'other';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final description = _descriptionController.text.trim();

    if (ProfanityFilter.hasProfanity(name) ||
        ProfanityFilter.hasProfanity(description)) {
      _showToast('⚠️ กรุณาใช้คำสุภาพในชื่อสินค้าและคำอธิบาย', Colors.orange);
      return;
    }
    if (_mainImage == null && widget.initialData?['imageUrl'] == null) {
      _showToast('กรุณาเพิ่มรูปภาพสินค้าหลัก', Colors.red);
      return;
    }
    if (_selectedProvince.isEmpty) {
      _showToast('กรุณาเลือกจังหวัด', Colors.red);
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadStatus = 'กําลังเตรียมข้อมูล...';
    });

    try {
      final user = await TukTukBridge().getCurrentUser();
      final sellerId = user?['lineUserId'] ?? user?['uid'];

      if (sellerId == null) throw 'ไม่พบข้อมูลผู้ใช้';

      // 1. Upload Media to Storage
      final List<String> imageUrls = [];
      String? videoUrl;

      // Upload Video if exists
      // Upload Video if exists
      if (_productVideo != null) {
        setState(() => _uploadStatus = 'กําลังอัปโหลดวิดีโอรีวิว...');
        final fileToUpload = File(_productVideo!.path);

        videoUrl = await TukTukStorageBridge().upload(
          fileToUpload,
          'marketplace_videos',
          contentType: 'video/mp4',
        );
      }

      // Upload main image
      if (_mainImage != null) {
        setState(() => _uploadStatus = 'กําลังอัปโหลดรูปภาพหลัก...');
        final mainUrl = await TukTukStorageBridge().upload(
          File(_mainImage!.path),
          'marketplace_items',
          contentType: 'image/jpeg',
        );
        if (mainUrl != null) imageUrls.add(mainUrl);
      } else if (widget.initialData?['imageUrl'] != null) {
        imageUrls.add(widget.initialData!['imageUrl']);
      }

      // Upload additional images
      for (var i = 0; i < _additionalImages.length; i++) {
        setState(() => _uploadStatus = 'กําลังอัปโหลดรูปภาพที่ ${i + 1}...');
        final addUrl = await TukTukStorageBridge().upload(
          File(_additionalImages[i].path),
          'marketplace_items',
          contentType: 'image/jpeg',
        );
        if (addUrl != null) imageUrls.add(addUrl);
      }

      setState(() => _uploadStatus = 'กําลังบันทึกข้อมูลสินค้า...');

      // 2. Prepare product data
      final productData = {
        'productName': _nameController.text.trim(),
        'price': double.tryParse(_priceController.text) ?? 0,
        'description': _descriptionController.text.trim(),
        'category': _selectedCategory,
        'imageUrl': imageUrls.first,
        'images': imageUrls,
        'sellerId': sellerId,
        'sellerName': _sellerNameController.text.trim().isNotEmpty
            ? _sellerNameController.text.trim()
            : (user?['displayName'] ?? 'ผู้ขาย'),
        'sellerImage': user?['pictureUrl'],
        'sellerPhone': _sellerPhoneController.text.trim(),
        'sellerLineId': _sellerLineIdController.text.trim(),
        'sellerFacebook': _sellerFacebookController.text.trim(),
        'sellerLocation': _selectedProvince,
        'videoUrl': videoUrl,
        'status': _selectedMarketType == 'consignment' ? 'pending' : 'active',
        'isConsignment': _selectedMarketType == 'consignment',
        'commissionRate': _selectedMarketType == 'consignment' ? 0.05 : 0.0,
        'viewCount': 0,
        'createdAt': FieldValue.serverTimestamp(),
        // Specialized Data
        'productOptions': _productOptions,
        'customFields': _customFields,
      };

      // 🚨 Add Precise Location (Use pinned location first)
      try {
        Position? finalPos = _currentPosition;

        // If not pinned, try one last time to get current location
        finalPos ??= await TukTukLocationService().getCurrentLocationAndSync();

        if (finalPos != null) {
          productData['lat'] = finalPos.latitude;
          productData['lng'] = finalPos.longitude;
          productData['geohash'] =
              ''; // Todo: Add geohash if using geoflutterfire later
        }
      } catch (e) {
        debugPrint('Location error: $e');
      }

      // 3. Add market-specific fields
      if (_selectedMarketType == 'secondhand') {
        productData['stock'] = int.tryParse(_stockController.text) ?? 0;

        // Create or Update
        if (widget.initialData?['id'] != null) {
          await FirebaseFirestore.instance
              .collection('marketplace_items')
              .doc(widget.initialData!['id'])
              .update(productData);
        } else {
          await FirebaseFirestore.instance
              .collection('marketplace_items')
              .add(productData);
        }
      } else if (_selectedMarketType == 'consignment') {
        productData['stock'] = int.tryParse(_stockController.text) ?? 1;
        productData['consignmentStatus'] = 'pending_approval';

        // Create or Update
        if (widget.initialData?['id'] != null) {
          await FirebaseFirestore.instance
              .collection('consignment_products')
              .doc(widget.initialData!['id'])
              .update(productData);
        } else {
          await FirebaseFirestore.instance
              .collection('consignment_products')
              .add(productData);
        }
      } else {
        // Community market
        productData['productUnit'] = _productUnitController.text.trim();
        productData['productLink'] = _productLinkController.text.trim();
        productData['isOTOP'] = _isOTOP;
        productData['isOrganic'] = _isOrganic;
        productData['productType'] = 'product'; // Not a short video

        // Create or Update
        if (widget.initialData?['id'] != null) {
          await FirebaseFirestore.instance
              .collection('community_products')
              .doc(widget.initialData!['id'])
              .update(productData);
        } else {
          await FirebaseFirestore.instance
              .collection('community_products')
              .add(productData);
        }
      }

      // 4. Update Global Seller Specialized Data (If any)
      if (_productOptions.isNotEmpty || _customFields.isNotEmpty) {
        // We already added them to productData which is saved above
        // But we could also update the seller_profiles if this is a "default" for their shop
      }

      if (mounted) {
        // ✅ Strategy 3: Award Points for Video Review Incentive
        if (_productVideo != null) {
          await TukTukBridge().awardPoints('product_review');
          _showToast('✅ ลงขายสำเร็จ! คุณได้รับโบนัสวิดีโอมาร์เก็ตเพลส 🎁',
              Colors.green,);
        } else {
          _showToast('✅ ลงขายสินค้าเรียบร้อยแล้ว', Colors.green);
        }

        Navigator.pop(context, true);
      }
    } catch (e) {
      debugPrint('Submit Error: $e');
      _showToast('เกิดข้อผิดพลาด: $e', Colors.red);
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _showToast(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('ลงขายสินค้าใหม่'),
        elevation: 0,
      ),
      body: _isUploading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(color: Color(0xFF00D2FF)),
                  const SizedBox(height: 20),
                  Text(
                    _uploadStatus,
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Market Type Selector
                    _buildSectionTitle('เลือกประเภทตลาด'),
                    _buildMarketTypeSelector(),
                    const SizedBox(height: 25),

                    // Main Image Picker
                    _buildSectionTitle('รูปภาพหลักและวิดีโอรีวิว'),
                    Row(
                      children: [
                        Expanded(child: _buildMainImagePicker()),
                        const SizedBox(width: 15),
                        Expanded(child: _buildVideoPicker()),
                      ],
                    ),
                    const SizedBox(height: 15),

                    // AI Analyze Button
                    if (_mainImage != null) _buildAIAnalyzeButton(),
                    const SizedBox(height: 20),

                    // Additional Images
                    _buildSectionTitle(
                        'รูปภาพเพิ่มเติม (${_additionalImages.length}/$_maxAdditionalImages)',),
                    _buildAdditionalImagesPicker(),
                    const SizedBox(height: 25),

                    // Input Fields
                    _buildLabel('ชื่อสินค้า'),
                    _buildTextField(
                        _nameController, 'เช่น iPhone 13 Pro Max', false,),
                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('ราคา (บาท)'),
                              _buildTextField(_priceController, '0', true),
                            ],
                          ),
                        ),
                        const SizedBox(width: 15),
                        if (_selectedMarketType == 'secondhand')
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('จำนวนสต็อก'),
                                _buildTextField(_stockController, '1', true),
                              ],
                            ),
                          ),
                        if (_selectedMarketType == 'community')
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('หน่วย'),
                                _buildTextField(
                                    _productUnitController, 'กก./ชิ้น', false,),
                              ],
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 20),
                    _buildLabel('หมวดหมู่'),
                    _buildCategoryDropdown(),

                    const SizedBox(height: 20),
                    _buildLabel('รายละเอียดสินค้า'),
                    _buildTextField(_descriptionController,
                        'รายละเอียดเพิ่มเติมเกี่ยวกับสินค้า...', false,
                        maxLines: 5,),

                    const SizedBox(height: 30),
                    _buildSectionTitle(
                        '📍 ที่ตั้งร้านค้า (ปักหมุดเพื่อช่วยลูกค้าให้ค้นพบคุณ)',),
                    _buildLocationPicker(),

                    // Contact Information Section
                    const SizedBox(height: 30),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(color: Colors.white10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.contact_page,
                                  color: Color(0xFF00D2FF),),
                              SizedBox(width: 10),
                              Text('ข้อมูลติดต่อ',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,),),
                            ],
                          ),
                          const SizedBox(height: 20),
                          _buildLabel('ชื่อผู้ขาย *'),
                          _buildTextField(_sellerNameController,
                              'ชื่อที่ต้องการให้แสดง', false,),
                          const SizedBox(height: 15),
                          _buildLabel('เบอร์โทรศัพท์ *'),
                          _buildTextField(
                              _sellerPhoneController, '08x-xxx-xxxx', false,),
                          const SizedBox(height: 15),
                          _buildLabel('LINE ID'),
                          _buildTextField(
                              _sellerLineIdController, '@yourlineid', false,),
                          const SizedBox(height: 15),
                          _buildLabel('Facebook Messenger (ไม่บังคับ)'),
                          _buildTextField(_sellerFacebookController,
                              'Username หรือ Page ID', false,),
                          const SizedBox(height: 15),
                          _buildLabel('จังหวัด *'),
                          _buildProvinceDropdown(),
                        ],
                      ),
                    ),

                    // Community Market Specific Fields
                    if (_selectedMarketType == 'community') ...[
                      const SizedBox(height: 20),
                      _buildLabel('ลิงก์สินค้า (ถ้ามี)'),
                      _buildTextField(_productLinkController,
                          'https://example.com/product', false,),
                      const SizedBox(height: 15),
                      _buildCheckbox('สินค้า OTOP', _isOTOP, (val) {
                        setState(() => _isOTOP = val ?? false);
                      }),
                      _buildCheckbox('สินค้าออร์แกนิค', _isOrganic, (val) {
                        setState(() => _isOrganic = val ?? false);
                      }),
                    ],

                    // 🍔 Food Options Section (Dynamic)
                    if (_selectedCategory == 'otop_food') ...[
                      const SizedBox(height: 30),
                      _buildSectionTitle('🍱 เมนูเพิ่มเติม / ทอปปิ้ง'),
                      _buildOptionsManager(),
                    ],

                    // 🛠️ Service Custom Fields Section
                    if (_selectedCategory == 'services' ||
                        _selectedCategory == 'other') ...[
                      const SizedBox(height: 30),
                      _buildSectionTitle('📋 ข้อมูลเพิ่มเติมเฉพาะด้าน'),
                      _buildCustomFieldsManager(),
                    ],

                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: ElevatedButton(
                        onPressed: _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00D2FF),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),),
                        ),
                        child: const Text('ยืนยันการลงขาย',
                            style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,),),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildLocationPicker() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: _currentPosition != null
              ? const Color(0xFF00D2FF).withValues(alpha: 0.5)
              : Colors.white10,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _currentPosition != null
                      ? const Color(0xFF00D2FF).withValues(alpha: 0.1)
                      : Colors.white.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _currentPosition != null
                      ? Icons.location_on
                      : Icons.location_off_outlined,
                  color: _currentPosition != null
                      ? const Color(0xFF00D2FF)
                      : Colors.white30,
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _currentAddress,
                      style: TextStyle(
                        color: _currentPosition != null
                            ? Colors.white
                            : Colors.white38,
                        fontSize: 14,
                        fontWeight: _currentPosition != null
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                    if (_currentPosition != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'พิกัด: ${_currentPosition!.latitude.toStringAsFixed(4)}, ${_currentPosition!.longitude.toStringAsFixed(4)}',
                        style: const TextStyle(
                          color: Colors.white30,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (_isLocationLoading)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Color(0xFF00D2FF),),
                )
              else
                IconButton(
                  onPressed: _pinLocation,
                  icon: const Icon(Icons.my_location, color: Color(0xFF00D2FF)),
                  tooltip: 'ปักหมุดตำแหน่งปัจจุบัน',
                ),
            ],
          ),
          if (_currentPosition == null) ...[
            const SizedBox(height: 10),
            const Text(
              '⚠️ การปักหมุดช่วยให้ร้านค้าของคุณปรากฏในแถบ "ใกล้คุณ"',
              style: TextStyle(color: Colors.orangeAccent, fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title,
          style: const TextStyle(
              color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold,),),
    );
  }

  Widget _buildMarketTypeSelector() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMarketOption(
                'secondhand',
                '🛒 ตลาดมือสอง',
                'สินค้ามือสอง/ของใช้แล้ว',
                Icons.shopping_bag,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMarketOption(
                'community',
                '🌾 ตลาดชุมชน',
                'สินค้าเกษตร/OTOP',
                Icons.agriculture,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildMarketOption(
          'consignment',
          '🤝 บริการฝากขาย (Consignment)',
          'ค่าธรรมเนียมเพียง 5% (รออนุมัติจาก Admin)',
          Icons.handshake_rounded,
        ),
      ],
    );
  }

  Widget _buildMarketOption(
      String type, String title, String subtitle, IconData icon,) {
    final isSelected = _selectedMarketType == type;
    return GestureDetector(
      onTap: () => setState(() => _selectedMarketType = type),
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF00D2FF).withValues(alpha: 0.1)
              : Colors.white.withValues(alpha: 0.05),
          border: Border.all(
            color: isSelected ? const Color(0xFF00D2FF) : Colors.white10,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Column(
          children: [
            Icon(icon,
                color: isSelected ? const Color(0xFF00D2FF) : Colors.white54,
                size: 32,),
            const SizedBox(height: 8),
            Text(title,
                style: TextStyle(
                    color: isSelected ? const Color(0xFF00D2FF) : Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,),),
            const SizedBox(height: 4),
            Text(subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white54, fontSize: 11),),
          ],
        ),
      ),
    );
  }

  Widget _buildMainImagePicker() {
    return GestureDetector(
      onTap: _pickMainImage,
      child: Container(
        height: 200,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: Colors.white10, width: 2),
        ),
        child: _mainImage == null
            ? const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_photo_alternate,
                      color: Colors.white54, size: 50,),
                  SizedBox(height: 10),
                  Text('แตะเพื่อเลือกรูปภาพ',
                      style: TextStyle(color: Colors.white54),),
                ],
              )
            : Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(13),
                    child: Image.file(
                      File(_mainImage!.path),
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: GestureDetector(
                      onTap: () => setState(() => _mainImage = null),
                      child: const CircleAvatar(
                        radius: 18,
                        backgroundColor: Colors.red,
                        child: Icon(Icons.close, size: 18, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildVideoPicker() {
    return GestureDetector(
      onTap: _pickVideo,
      child: Container(
        height: 200,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: Colors.white10, width: 2),
        ),
        child: _productVideo == null
            ? const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.video_call, color: Colors.white54, size: 50),
                  SizedBox(height: 10),
                  Text('วิดีโอรีวิว (ไม่บังคับ)',
                      style: TextStyle(color: Colors.white54, fontSize: 12),),
                  Text('สูงสุด 60 วินาที',
                      style: TextStyle(color: Colors.white24, fontSize: 10),),
                ],
              )
            : Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(13),
                    child: BetterPlayer(controller: _videoPlayerController!),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _productVideo = null;
                          _videoPlayerController?.dispose();
                          _videoPlayerController = null;
                        });
                      },
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: Colors.black.withValues(alpha: 0.5),
                        child: const Icon(Icons.close,
                            color: Colors.white, size: 20,),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4,),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.videocam,
                              color: Color(0xFF00D2FF), size: 12,),
                          SizedBox(width: 4),
                          Text('VIDEO REVIEW',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,),),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildAIAnalyzeButton() {
    final isPremium = _userTier == 'pro' || _userTier == 'yearly';
    final isYearly = _userTier == 'yearly';

    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          boxShadow: isPremium
              ? [
                  BoxShadow(
                    color: isYearly
                        ? Colors.orange.withValues(alpha: 0.3)
                        : Colors.purple.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: ElevatedButton.icon(
          onPressed: _isAnalyzing ? null : _analyzeWithAI,
          icon: _isAnalyzing
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white,),)
              : Icon(isYearly ? Icons.stars : Icons.auto_awesome),
          label: Text(_isAnalyzing
              ? 'กำลังวิเคราะห์...'
              : isYearly
                  ? '🤖 AI SEO Boost (Yearly Edition)'
                  : isPremium
                      ? '🤖 วิเคราะห์ด้วย AI (Pro Unlimited)'
                      : '🤖 วิเคราะห์ด้วย AI (ฟรี 3 ครั้ง)',),
          style: ElevatedButton.styleFrom(
            backgroundColor: isYearly ? Colors.orange : Colors.purple,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
    );
  }

  Widget _buildAdditionalImagesPicker() {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _additionalImages.length + 1,
        itemBuilder: (context, index) {
          if (index == _additionalImages.length) {
            return GestureDetector(
              onTap: _pickAdditionalImages,
              child: Container(
                width: 100,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24),
                ),
                child: const Icon(Icons.add_a_photo, color: Colors.white54),
              ),
            );
          }
          return Stack(
            children: [
              Container(
                width: 100,
                margin: const EdgeInsets.only(right: 10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: DecorationImage(
                    image: FileImage(File(_additionalImages[index].path)),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                right: 15,
                top: 5,
                child: GestureDetector(
                  onTap: () =>
                      setState(() => _additionalImages.removeAt(index)),
                  child: const CircleAvatar(
                    radius: 12,
                    backgroundColor: Colors.red,
                    child: Icon(Icons.close, size: 14, color: Colors.white),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildCategoryDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedCategory,
          isExpanded: true,
          dropdownColor: const Color(0xFF1E293B),
          style: const TextStyle(color: Colors.white),
          onChanged: (val) => setState(() => _selectedCategory = val!),
          items: _categoriesList
              .map((c) => DropdownMenuItem(
                    value: c['value'],
                    child: Text(c['label']!),
                  ),)
              .toList(),
        ),
      ),
    );
  }

  Widget _buildProvinceDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedProvince.isEmpty ? null : _selectedProvince,
          hint: const Text('-- เลือกจังหวัด --',
              style: TextStyle(color: Colors.white54),),
          isExpanded: true,
          dropdownColor: const Color(0xFF1E293B),
          style: const TextStyle(color: Colors.white),
          onChanged: (val) => setState(() => _selectedProvince = val ?? ''),
          items: _provinces
              .map((p) => DropdownMenuItem(value: p, child: Text(p)))
              .toList(),
        ),
      ),
    );
  }

  Widget _buildOptionsManager() {
    return Column(
      children: [
        ..._productOptions.asMap().entries.map((entry) {
          final int idx = entry.key;
          final Map<String, dynamic> option = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: _buildMiniTextField(
                    initialValue: option['name'],
                    hint: 'ชื่อตัวเลือก (เช่น ไข่ดาว)',
                    onChanged: (val) => _productOptions[idx]['name'] = val,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: _buildMiniTextField(
                    initialValue: option['price']?.toString(),
                    hint: '+ บาท',
                    isNumber: true,
                    onChanged: (val) => _productOptions[idx]['price'] =
                        double.tryParse(val) ?? 0,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline,
                      color: Colors.redAccent,),
                  onPressed: () =>
                      setState(() => _productOptions.removeAt(idx)),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () {
            setState(() {
              _productOptions.add({'name': '', 'price': 0.0});
            });
          },
          icon: const Icon(Icons.add, size: 18),
          label: const Text('เพิ่มตัวเลือกเมนู / ทอปปิ้ง'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF00D2FF),
            side: const BorderSide(color: Color(0xFF00D2FF)),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      ],
    );
  }

  Widget _buildCustomFieldsManager() {
    return Column(
      children: [
        ..._customFields.asMap().entries.map((entry) {
          final int idx = entry.key;
          final Map<String, dynamic> field = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Expanded(
                  child: _buildMiniTextField(
                    initialValue: field['label'],
                    hint: 'หัวข้อ (เช่น แบรนด์)',
                    onChanged: (val) => _customFields[idx]['label'] = val,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildMiniTextField(
                    initialValue: field['value'],
                    hint: 'ข้อมูล (เช่น Toyota)',
                    onChanged: (val) => _customFields[idx]['value'] = val,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline,
                      color: Colors.redAccent,),
                  onPressed: () => setState(() => _customFields.removeAt(idx)),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () {
            setState(() {
              _customFields.add({'label': '', 'value': ''});
            });
          },
          icon: const Icon(Icons.add, size: 18),
          label: const Text('เพิ่มฟิลด์ข้อมูลกำหนดเอง'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF00D2FF),
            side: const BorderSide(color: Color(0xFF00D2FF)),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      ],
    );
  }

  Widget _buildMiniTextField({
    String? initialValue,
    required String hint,
    required Function(String) onChanged,
    bool isNumber = false,
  }) {
    return TextFormField(
      initialValue: initialValue,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      onChanged: onChanged,
    );
  }

  Widget _buildCheckbox(String label, bool value, Function(bool?) onChanged) {
    return CheckboxListTile(
      title: Text(label, style: const TextStyle(color: Colors.white)),
      value: value,
      onChanged: onChanged,
      activeColor: const Color(0xFF00D2FF),
      checkColor: Colors.black,
      tileColor: Colors.white.withValues(alpha: 0.05),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text,
          style: const TextStyle(color: Colors.white70, fontSize: 14),),
    );
  }

  Widget _buildTextField(
      TextEditingController controller, String hint, bool isNumber,
      {int maxLines = 1,}) {
    return TextFormField(
      controller: controller,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white24),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 15, vertical: 15),
      ),
      validator: (val) =>
          (val == null || val.isEmpty) ? 'กรุณากรอกข้อมูล' : null,
    );
  }
}
