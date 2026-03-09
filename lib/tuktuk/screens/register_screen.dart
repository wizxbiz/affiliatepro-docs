import 'dart:convert';
import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/screens/seller_dashboard_screen.dart';
import 'package:caculateapp/tuktuk/services/location_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_tokenomics.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

/// หน้าลงทะเบียนผู้ขาย (Seller Registration)
/// เชื่อมต่อกับ seller-dashboard.html และ seller_dashboard_screen.dart
class RegisterScreen extends StatefulWidget {
  final String? mode; // 'register' (default) or 'onboarding'
  final String? initialPersona;
  const RegisterScreen({super.key, this.mode, this.initialPersona});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _shopNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _ageController = TextEditingController();

  String _selectedCategory = '';
  String _selectedProvince = '';
  String _shopType = 'merchant'; // merchant, service_provider, delivery
  String _selectedGender = 'other'; // male, female, other
  String _selectedPersona = 'shopper'; // creator, shopper, seller, professional
  bool _isLoading = false;
  bool _isSyncingLocation = false;
  String? _errorMessage;
  bool _showSkipWarning = false; // New: To show point loss warning
  final TextEditingController _passwordController =
      TextEditingController(); // Optional Password

  // ── PIN Activation state ──────────────────────────────────
  bool _showPinActivation = false;
  bool _isPinLoading = false;
  String? _pinError;
  String? _registeredUid;
  final List<TextEditingController> _pinControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _pinFocusNodes =
      List.generate(6, (_) => FocusNode());

  // Categories (matching register.html)
  final List<Map<String, String>> _categories = [
    {'value': 'agriculture', 'label': 'เกษตรกรรม (พืช/สัตว์/ประมง)'},
    {'value': 'otop_food', 'label': 'อาหาร / อาหารแปรรูป / OTOP'},
    {'value': 'retail_online', 'label': 'ค้าปลีก / พ่อค้าแม่ค้าออนไลน์'},
    {'value': 'secondhand', 'label': 'สินค้ามือสอง / ของใช้แล้ว'},
    {'value': 'electronics', 'label': 'เครื่องใช้ไฟฟ้า / ไอที/มือถือ'},
    {'value': 'services', 'label': 'งานบริการ / ช่าง / ขนส่ง'},
    {'value': 'other', 'label': 'อื่นๆ'},
  ];

  bool _acceptConsignment = false;

  // Provinces (matching register.html)
  final List<String> _provinces = [
    'กรุงเทพมหานคร',
    'เชียงใหม่',
    'นครราชสีมา',
    'ขอนแก่น',
    'จันทบุรี',
    'ฉะเชิงเทรา',
    'ชลบุรี',
    'ระยอง',
    'อุบลราชธานี',
    'ภูเก็ต',
    'อื่นๆ',
  ];

  final List<Map<String, dynamic>> _personas = [
    {
      'id': 'shopper',
      'title': 'นักช้อป',
      'desc': 'เน้นค้นหาดีลเด็ดและสินค้าใกล้บ้าน',
      'icon': Icons.shopping_bag_outlined,
      'color': const Color(0xFF00d2ff),
    },
    {
      'id': 'creator',
      'title': 'คอนเทนต์ครีเอเตอร์',
      'desc': 'ชอบแชร์เรื่องราวและสร้างสีสันให้ชุมชน',
      'icon': Icons.auto_awesome,
      'color': const Color(0xFFFF0050),
    },
    {
      'id': 'seller',
      'title': 'เจ้าของธุรกิจ',
      'desc': 'มองหาโอกาสและขยายฐานลูกค้าในพื้นที่',
      'icon': Icons.storefront,
      'color': const Color(0xFFFFC107),
    },
    {
      'id': 'investor',
      'title': 'นักแสวงหา',
      'desc': 'ติดตามเทรนด์และการเติบโตของท้องถิ่น',
      'icon': Icons.explore_outlined,
      'color': const Color(0xFF4CAF50),
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialPersona != null) {
      _selectedPersona = widget.initialPersona!;
    }
    _loadExistingData();
  }

  Future<void> _loadExistingData() async {
    final user = await TukTukBridge().getCurrentUser();
    if (user != null && mounted) {
      setState(() {
        if (user['displayName'] != null && _shopNameController.text.isEmpty) {
          _shopNameController.text = user['displayName'];
        }
        if (user['phone'] != null && _phoneController.text.isEmpty) {
          _phoneController.text = user['phone'];
        }
        if (user['gender'] != null) {
          _selectedGender = user['gender'];
        }
        if (user['persona'] != null) {
          _selectedPersona = user['persona'];
        }
        if (user['province'] != null &&
            user['province'].toString().isNotEmpty) {
          _selectedProvince = user['province'];
          if (!_provinces.contains(_selectedProvince)) {
            _provinces.insert(0, _selectedProvince);
          }
        }
        if (user['age'] != null &&
            user['age'] != 0 &&
            _ageController.text.isEmpty) {
          _ageController.text = user['age'].toString();
        }
      });
    }
  }

  @override
  void dispose() {
    _shopNameController.dispose();
    _phoneController.dispose();
    _descriptionController.dispose();
    _ageController.dispose();
    _passwordController.dispose();
    for (final c in _pinControllers) { c.dispose(); }
    for (final f in _pinFocusNodes) { f.dispose(); }
    super.dispose();
  }

  void _handleSkip() {
    setState(() => _showSkipWarning = true);

    // Show persistent notification style snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.info_outline, color: Colors.white),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'คุณสามารถอัปเดตโปรไฟล์ภายหลังเพื่อรับ 50 เหรียญทองได้ที่หน้าโปรไฟล์ครับ',
                style: TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        action: SnackBarAction(
          label: 'ตกลง',
          textColor: Colors.orangeAccent,
          onPressed: () {
            Navigator.of(context).pop(); // Exit to main app
          },
        ),
        duration: const Duration(seconds: 5),
        backgroundColor: const Color(0xFF1a1a2e),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );

    // Short delay then exit
    Future.delayed(const Duration(milliseconds: 3000), () {
      if (mounted && _showSkipWarning) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    });
  }

  Future<void> _syncProvinceWithLocation() async {
    setState(() => _isSyncingLocation = true);
    try {
      final pos = await TukTukLocationService().getCurrentLocationAndSync();
      if (pos != null) {
        final address = await TukTukLocationService()
            .getAddressFromCoords(pos.latitude, pos.longitude);
        final detectedProvince = address['province'] ?? '';

        if (detectedProvince.isNotEmpty && mounted) {
          // Normalize province if needed to match our list
          String? matchedProvince;
          for (final p in _provinces) {
            if (detectedProvince.contains(p) || p.contains(detectedProvince)) {
              matchedProvince = p;
              break;
            }
          }

          setState(() {
            _selectedProvince = matchedProvince ?? detectedProvince;
            if (!_provinces.contains(_selectedProvince)) {
              _provinces.insert(0, _selectedProvince);
            }
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('ซิงค์จังหวัดสำเร็จ: $_selectedProvince 📍'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Sync Error: $e');
    } finally {
      if (mounted) setState(() => _isSyncingLocation = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Check if user is logged in
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception('กรุณาเข้าสู่ระบบก่อนลงทะเบียนร้านค้า');
      }

      final now = DateTime.now();
      final trialEndDate = now.add(const Duration(days: 30));

      final shopData = {
        'uid': user.uid,
        'shopName': _shopNameController.text.trim(),
        'shopType': _shopType, // 🛠️ Include Shop Type
        'category': _selectedCategory,
        'location': _selectedProvince,
        'phone': _phoneController.text.trim(),
        'description': _descriptionController.text.trim(),
        'sellerStatus': 'trial', // Initial status is trial
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'subscriptionPlan': {
          'tier': 'trial',
          'trialStartDate': now.toIso8601String(),
          'trialEndDate': trialEndDate.toIso8601String(),
          'paymentStatus': 'pending', // pending, paid, grace_period
          'duration': 0,
        },
        'pictureUrl': user.photoURL ?? '', // Add pictureUrl
        'isVerified': false, // Add isVerified
        'isConsignmentReady': _acceptConsignment,
        'salesStats': {
          'totalRevenue': 0,
          'views': 0,
        },
        // 📊 Algorithm Meta Data
        'age': int.tryParse(_ageController.text) ?? 0,
        'gender': _selectedGender,
        'persona': _selectedPersona,
        'policyAccepted': true,
      };

      // 2. Save to seller_profiles collection
      await FirebaseFirestore.instance
          .collection('seller_profiles')
          .doc(user.uid)
          .set(shopData);

      // 3. Update users collection
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .update({
        'isSeller': true,
        'shopName': shopData['shopName'],
        'sellerStatus':
            'pending', // Status for user collection, indicating pending verification
        'updatedAt': FieldValue.serverTimestamp(),
        // Sync demographic data to users as well
        'age': int.tryParse(_ageController.text) ?? 0,
        'gender': _selectedGender,
        'persona': _selectedPersona,
        'province': _selectedProvince,
        'password': _passwordController.text.trim().isNotEmpty
            ? _passwordController.text.trim()
            : null,
      });

      // 4. Update TukTuk Bridge session
      await TukTukBridge.updateUserSession({
        'isSeller': true,
        'sellerStatus': 'pending',
        'age': int.tryParse(_ageController.text) ?? 0,
        'gender': _selectedGender,
        'persona': _selectedPersona,
        'province': _selectedProvince,
        'password': _passwordController.text.trim().isNotEmpty
            ? _passwordController.text.trim()
            : null,
      });

      // 4.5 Award points for completing profile
      try {
        final tokenomics = TukTukTokenomics();
        await tokenomics.awardPoints(
          MissionType.postCreation, // Fallback mission type
          pointsOverride: 50,
          description: 'โบนัสลงทะเบียนสมาร์ทสมาชิกครบถ้วน',
        );
      } catch (e) {
        debugPrint('Point awarding failed: $e');
      }

      if (!mounted) return;

      // 5. Switch to PIN activation screen
      _registeredUid = user.uid;
      setState(() {
        _showPinActivation = true;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  // ── PIN verification ─────────────────────────────────────────
  Future<void> _verifyPin() async {
    final pin = _pinControllers.map((c) => c.text).join();
    if (pin.length < 6) return;

    setState(() {
      _isPinLoading = true;
      _pinError = null;
    });

    try {
      const apiBase =
          'https://us-central1-appinjproject.cloudfunctions.net';
      final resp = await http.post(
        Uri.parse('$apiBase/verifyWebPin'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'pin': pin}),
      );
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      if (data['success'] != true) {
        throw Exception(data['error'] ?? 'PIN ไม่ถูกต้อง');
      }

      // Upgrade seller_profiles to verified
      final uid = _registeredUid ??
          FirebaseAuth.instance.currentUser?.uid;
      if (uid != null) {
        await FirebaseFirestore.instance
            .collection('seller_profiles')
            .doc(uid)
            .set(
              {'sellerStatus': 'verified',
               'updatedAt': FieldValue.serverTimestamp(),},
              SetOptions(merge: true),
            );
      }

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const SellerDashboardScreen()),
      );
    } catch (e) {
      setState(() {
        _pinError = e.toString().replaceAll('Exception: ', '');
        for (final c in _pinControllers) { c.clear(); }
        _pinFocusNodes.first.requestFocus();
      });
    } finally {
      if (mounted) setState(() => _isPinLoading = false);
    }
  }

  // ── PIN Activation Screen ────────────────────────────────────
  Widget _buildPinActivationScreen() {
    final pinFull =
        _pinControllers.every((c) => c.text.length == 1);

    return Container(
      constraints: const BoxConstraints(maxWidth: 500),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 50,
            offset: const Offset(0, 25),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Step tracker ──
          _buildStepTracker(),
          const SizedBox(height: 24),

          // ── Info box: register done ──
          _buildActivationInfoBox(
            icon: '🎉',
            title: 'ลงทะเบียนสำเร็จ!',
            body: 'ขั้นตอนต่อไป — เลือกแพ็กเกจเพื่อเปิดร้านและรับรหัสเข้าระบบ',
            isGreen: false,
          ),

          // ── Info box: how-to ──
          _buildActivationInfoBox(
            icon: '📋',
            title: 'วิธีการ',
            body: '1. กด "เปิด LINE OA" ด้านล่าง\n'
                '2. พิมพ์ "สมัครเปิดร้าน" หรือ "แพ็กเกจ"\n'
                '3. เลือกแพ็กเกจ → โอนเงิน → ส่งสลิป\n'
                '4. แอดมินอนุมัติภายใน 24 ชั่วโมง\n'
                '5. พิมพ์ "ขอรหัส" → รับ PIN 6 หลัก\n'
                '6. กรอก PIN ด้านล่างเพื่อเปิดร้าน ✅',
            isGreen: true,
          ),
          const SizedBox(height: 4),

          // ── Open LINE OA ──
          ElevatedButton.icon(
            onPressed: () => launchUrl(
              Uri.parse('https://lin.ee/1YJsw47'),
              mode: LaunchMode.externalApplication,
            ),
            icon: SvgPicture.network(
              'https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg',
              width: 20,
              height: 20,
              colorFilter: const ColorFilter.mode(
                  Colors.white, BlendMode.srcIn,),
            ),
            label: const Text('เปิด TukTuk LINE OA'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF06C755),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(13),),
              textStyle: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold,),
            ),
          ),
          const SizedBox(height: 20),

          // ── Divider ──
          Row(children: [
            Expanded(
                child: Divider(
                    color: Colors.white.withValues(alpha: 0.12),),),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text('หรือถ้ามี PIN แล้ว',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 12,),),
            ),
            Expanded(
                child: Divider(
                    color: Colors.white.withValues(alpha: 0.12),),),
          ],),
          const SizedBox(height: 16),

          // ── PIN icon + title ──
          Center(
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                ),
                borderRadius: BorderRadius.circular(50),
              ),
              alignment: Alignment.center,
              child: const Text('🔑', style: TextStyle(fontSize: 22)),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'ใส่ PIN เพื่อเปิดร้าน',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,),
          ),
          const SizedBox(height: 6),
          Text(
            'กรอกรหัส 6 หลักจาก TukTuk LINE OA',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 13, color: Colors.white.withValues(alpha: 0.55),),
          ),
          const SizedBox(height: 18),

          // ── PIN cells ──
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(6, (i) {
              return Container(
                width: 44,
                height: 52,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                child: TextField(
                  controller: _pinControllers[i],
                  focusNode: _pinFocusNodes[i],
                  maxLength: 1,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                  style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,),
                  decoration: InputDecoration(
                    counterText: '',
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.07),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(11),
                      borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.15),),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(11),
                      borderSide: const BorderSide(
                          color: Color(0xFF00d9ff), width: 2,),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(11),
                      borderSide: BorderSide(
                          color: Colors.white.withValues(alpha: 0.15),),
                    ),
                  ),
                  onChanged: (v) {
                    if (v.isNotEmpty && i < 5) {
                      _pinFocusNodes[i + 1].requestFocus();
                    }
                    if (v.isEmpty && i > 0) {
                      _pinFocusNodes[i - 1].requestFocus();
                    }
                    setState(() {}); // rebuild to check pinFull
                  },
                ),
              );
            }),
          ),
          const SizedBox(height: 16),

          // ── Error ──
          if (_pinError != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
              ),
              child: Text(
                '❌ $_pinError',
                style: const TextStyle(color: Colors.redAccent),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 12),
          ],

          // ── Activate button ──
          ElevatedButton.icon(
            onPressed: (pinFull && !_isPinLoading) ? _verifyPin : null,
            icon: _isPinLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white,),
                  )
                : const Icon(Icons.store_rounded),
            label: Text(_isPinLoading ? 'กำลังตรวจสอบ...' : 'เปิดร้านเลย!'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF06C755),
              disabledBackgroundColor: Colors.white12,
              foregroundColor: Colors.white,
              disabledForegroundColor: Colors.white38,
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(13),),
              textStyle: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold,),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepTracker() {
    final steps = [
      {'label': 'ลงทะเบียน', 'state': 'done'},
      {'label': 'เลือก\nแพ็กเกจ', 'state': 'active'},
      {'label': 'ใส่ PIN\nเปิดร้าน', 'state': 'pending'},
    ];
    return Row(
      children: steps.asMap().entries.map((entry) {
        final s = entry.value;
        final isDone = s['state'] == 'done';
        final isActive = s['state'] == 'active';
        final dotColor = isDone
            ? const Color(0xFF06C755)
            : isActive
                ? const Color(0xFF00d9ff)
                : Colors.white12;
        final labelColor = (isDone || isActive)
            ? Colors.white
            : Colors.white38;
        return Expanded(
          child: Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isActive
                        ? const Color(0xFF00d9ff)
                        : Colors.transparent,
                    width: 2,
                  ),
                ),
                alignment: Alignment.center,
                child: isDone
                    ? const Icon(Icons.check, size: 16, color: Colors.white)
                    : Text(
                        '${entry.key + 1}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color:
                              isActive ? Colors.black : Colors.white54,
                        ),
                      ),
              ),
              const SizedBox(height: 6),
              Text(
                s['label']!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  color: labelColor,
                  height: 1.3,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildActivationInfoBox({
    required String icon,
    required String title,
    required String body,
    required bool isGreen,
  }) {
    final accent =
        isGreen ? const Color(0xFF06C755) : const Color(0xFF00d9ff);
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accent.withValues(alpha: 0.25)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('$icon $title',
            style: TextStyle(
                fontWeight: FontWeight.bold,
                color: accent,
                fontSize: 14,),),
        const SizedBox(height: 8),
        Text(body,
            style: TextStyle(
                fontSize: 13,
                color: Colors.white.withValues(alpha: 0.65),
                height: 1.6,),),
      ],),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(0, -0.5),
            radius: 1.5,
            colors: [
              const Color(0xFF00d2ff).withValues(alpha: 0.3),
              Colors.black,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                children: [
                  // ── PIN Activation Screen (post-registration) ──
                  if (_showPinActivation) ...[
                    _buildPinActivationScreen(),
                  ] else ...[

                  // 🔐 Auth Check Prompt
                  if (FirebaseAuth.instance.currentUser == null)
                    _buildLoginPrompt(),

                  Container(
                    constraints: const BoxConstraints(maxWidth: 500),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.5),
                          blurRadius: 50,
                          offset: const Offset(0, 25),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 20,),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Header
                          _buildHeader(),
                          const SizedBox(height: 15),

                          // Error Message
                          if (_errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.all(15),
                              decoration: BoxDecoration(
                                color: Colors.red.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: Colors.red.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: Colors.red),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // 🛠️ Shop Type Selection
                          _buildShopTypeSelector(),
                          _buildShopTypeBenefits(),
                          const SizedBox(height: 15),

                          // Shop Name
                          _buildTextField(
                            controller: _shopNameController,
                            label: 'ชื่อร้านค้า / ชื่อผู้ใช้',
                            hint: 'เช่น ร้านค้า เกษตรอินทรีย์',
                            icon: Icons.store,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'กรุณากรอกชื่อร้านค้า';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // 🛠️ 1. Age & Gender Section
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 2,
                                child: _buildTextField(
                                  controller: _ageController,
                                  label: 'อายุ (ปี)',
                                  hint: 'เช่น 25',
                                  icon: Icons.calendar_today,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                  ],
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'กรุณากรอกอายุ';
                                    }
                                    if ((int.tryParse(value) ?? 0) < 13) {
                                      return 'ต้องมีอายุ 13 ปีขึ้นไป';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 15),
                              Expanded(
                                flex: 3,
                                child: _buildGenderSelector(),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // 🛠️ 2. Persona Selection (The "Cards")
                          _buildSectionTitle('คุณสนใจด้านไหนเป็นพิเศษ?',
                              'เพื่อจัดอัลกอริทึมให้ตรงใจคุณที่สุด',),
                          const SizedBox(height: 8),
                          _buildPersonaCards(),
                          const SizedBox(height: 15),

                          // 🛠️ 3. Optional Security (Password Setup)
                          if (widget.mode == 'onboarding') ...[
                            _buildSectionTitle('ความปลอดภัย (ไม่บังคับ)',
                                'คุณสามารถตั้งรหัสผ่านเพื่อใช้ล็อกอินในครั้งถัดไป',),
                            const SizedBox(height: 10),
                            _buildTextField(
                              controller: _passwordController,
                              label: 'ตั้งรหัสผ่านใหม่ (ถ้าต้องการ)',
                              hint: 'อย่างน้อย 6 ตัวอักษร',
                              icon: Icons.lock_outline,
                              obscureText: true,
                            ),
                            const SizedBox(height: 20),
                          ],

                          // Category
                          _buildDropdown(
                            label: 'หมวดหมู่สินค้าหลัก',
                            value: _selectedCategory.isEmpty
                                ? null
                                : _selectedCategory,
                            items: _categories
                                .map((cat) => DropdownMenuItem(
                                      value: cat['value'],
                                      child: Text(cat['label']!),
                                    ),)
                                .toList(),
                            onChanged: (value) {
                              setState(() {
                                _selectedCategory = value!;
                              });
                            },
                            hint: 'เลือกหมวดหมู่',
                            icon: Icons.category,
                          ),
                          const SizedBox(height: 12),

                          // Province with Sync
                          _buildProvinceWithSync(),

                          const SizedBox(height: 12),

                          // Phone
                          _buildTextField(
                            controller: _phoneController,
                            label: 'เบอร์โทรศัพท์ติดต่อ',
                            hint: '08x-xxx-xxxx',
                            icon: Icons.phone,
                            keyboardType: TextInputType.phone,
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'กรุณากรอกเบอร์โทรศัพท์';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Description
                          _buildTextField(
                            controller: _descriptionController,
                            label: 'รายละเอียดร้านค้าสั้นๆ',
                            hint: 'แนะนำร้านค้าของคุณให้ลูกค้าคนอื่นรู้จัก...',
                            icon: Icons.description,
                            maxLines: 3,
                          ),
                          // Consignment Opt-in
                          _buildConsignmentOption(),
                          const SizedBox(height: 15),

                          // Coin Reward Banner (Only for onboarding)
                          if (widget.mode == 'onboarding') _buildRewardBanner(),

                          const SizedBox(height: 15),

                          // Submit Button
                          _buildSubmitButton(),

                          // Skip Button (Only for onboarding)
                          if (widget.mode == 'onboarding') _buildSkipButton(),
                          const SizedBox(height: 20),

                          // Login Link
                          Center(
                            child: TextButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              child: RichText(
                                text: const TextSpan(
                                  style: TextStyle(
                                      color: Colors.white70, fontSize: 14,),
                                  children: [
                                    TextSpan(text: 'มีบัญชีอยู่แล้ว? '),
                                    TextSpan(
                                      text: 'เข้าสู่ระบบ',
                                      style: TextStyle(
                                        color: Color(0xFF00d2ff),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  ], // end else (registration form)
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginPrompt() {
    return Container(
      margin: const EdgeInsets.only(bottom: 25),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange.withValues(alpha: 0.2), Colors.red.withValues(alpha: 0.1)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          const Row(
            children: [
              Icon(Icons.lock_person_rounded, color: Colors.orangeAccent),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'กรุณาเข้าสู่ระบบก่อนเพื่อบันทึกข้อมูล',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'คุณสามารถกรอกข้อมูลทิ้งไว้ได้ แต่ต้องเข้าสู่ระบบก่อนกดบันทึกเพื่อยืนยันตัวตนเจ้าของร้านครับ',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Navigate back to LoginScreen
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orangeAccent,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('ไปที่หน้าเข้าสู่ระบบ',
                  style: TextStyle(fontWeight: FontWeight.bold),),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Logo
        Hero(
          tag: 'app_logo_register',
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00d2ff), Color(0xFF0066ff)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF00d2ff).withValues(alpha: 0.4),
                  blurRadius: 25,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(
              Icons.store,
              size: 30,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          widget.mode == 'onboarding'
              ? 'ยินดีต้อนรับสู่ TukTuk!'
              : 'ลงทะเบียนสมาร์ทสมาชิก',
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          widget.mode == 'onboarding'
              ? 'ตั้งค่าความสนใจเพื่อรับดีลและคอนเทนต์ที่ตรงใจคุณ'
              : 'ตอบโจทย์ทุกเพศทุกวัย เพื่ออัลกอริทึมที่แม่นยำเพื่อคุณ',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: Colors.white.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withValues(alpha: 0.5),
          ),
        ),
      ],
    );
  }

  Widget _buildGenderSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'เพศ',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.white.withValues(alpha: 0.6),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 56,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Row(
            children: [
              _buildGenderOption('male', 'ชาย', Icons.male),
              _buildGenderOption('female', 'หญิง', Icons.female),
              _buildGenderOption('other', 'อื่นๆ', Icons.transgender),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGenderOption(String value, String label, IconData icon) {
    final isSelected = _selectedGender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedGender = value),
        child: Container(
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF00d2ff) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Icon(
              icon,
              color: isSelected ? Colors.white : Colors.white38,
              size: 20,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPersonaCards() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.15, // Made cards shorter as requested
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: _personas.length,
      itemBuilder: (context, index) {
        final persona = _personas[index];
        final isSelected = _selectedPersona == persona['id'];
        return GestureDetector(
          onTap: () => setState(() => _selectedPersona = persona['id']),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                  ? (persona['color'] as Color).withValues(alpha: 0.2)
                  : Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: isSelected ? persona['color'] : Colors.white10,
                width: 2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(persona['icon'],
                    color: isSelected ? persona['color'] : Colors.white54,
                    size: 20,),
                const SizedBox(height: 4),
                Text(
                  persona['title'],
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.white70,
                    fontWeight: FontWeight.bold,
                    fontSize: 12, // Slightly smaller to fit long names
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  persona['desc'],
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 8.5, // Slightly smaller
                  ),
                  maxLines: 2, // Allow 2 lines for description
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildProvinceWithSync() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                'จังหวัดที่พำนัก / ร้าน',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.6),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            TextButton.icon(
              onPressed: _isSyncingLocation ? null : _syncProvinceWithLocation,
              icon: _isSyncingLocation
                  ? const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.orangeAccent,),)
                  : const Icon(Icons.my_location,
                      color: Colors.orangeAccent, size: 14,),
              label: Text(
                _isSyncingLocation
                    ? 'กำลังตรวจจับ...'
                    : 'Near Me (ยืนยันที่อยู่)',
                style:
                    const TextStyle(color: Colors.orangeAccent, fontSize: 12),
              ),
            ),
          ],
        ),
        _buildDropdown(
          label: '',
          value: _selectedProvince.isEmpty ? null : _selectedProvince,
          items: _provinces
              .map((province) => DropdownMenuItem(
                    value: province,
                    child: Text(province),
                  ),)
              .toList(),
          onChanged: (value) {
            setState(() {
              _selectedProvince = value!;
            });
          },
          hint: 'เลือกจังหวัดหรือซิงค์ Near Me',
          icon: Icons.location_on,
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
    required String hint,
    required IconData icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.white.withValues(alpha: 0.6),
          ),
        ),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true, // 🛠️ Fix Overflow
          items: items,
          onChanged: onChanged,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'กรุณาเลือก$label';
            }
            return null;
          },
          dropdownColor: const Color(0xFF1a1a2e),
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
            prefixIcon: Icon(icon, color: const Color(0xFF00d2ff), size: 20),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.07),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF00d2ff)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00d2ff),
          disabledBackgroundColor: Colors.grey,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    widget.mode == 'onboarding'
                        ? 'เริ่มต้นใช้งาน TukTuk'
                        : 'สร้างบัญชีร้านค้า',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Icon(Icons.arrow_forward, color: Colors.white),
                ],
              ),
      ),
    );
  }

  Widget _buildConsignmentOption() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _acceptConsignment
            ? const Color(0xFF00d2ff).withValues(alpha: 0.1)
            : Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: _acceptConsignment
              ? const Color(0xFF00d2ff)
              : Colors.white.withValues(alpha: 0.1),
        ),
      ),
      child: InkWell(
        onTap: () => setState(() => _acceptConsignment = !_acceptConsignment),
        child: Row(
          children: [
            Icon(
              _acceptConsignment ? Icons.handshake : Icons.handshake_outlined,
              color:
                  _acceptConsignment ? const Color(0xFF00d2ff) : Colors.white54,
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'สนใจบริการฝากขาย (Consignment)',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'ต้องการให้ทีมงานช่วยดูแลการขาย (ค่าธรรมเนียม 5%)',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Checkbox(
              value: _acceptConsignment,
              activeColor: const Color(0xFF00d2ff),
              onChanged: (v) => setState(() => _acceptConsignment = v ?? false),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShopTypeSelector() {
    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Expanded(
              child: _buildTypeOption(
                  'merchant', 'ค้าขาย/อาหาร', Icons.restaurant,),),
          Expanded(
              child: _buildTypeOption('delivery', 'วิน/ขนส่ง', Icons.moped),),
          Expanded(
              child: _buildTypeOption(
                  'service_provider', 'บริการ/ช่าง', Icons.handyman,),),
        ],
      ),
    );
  }

  Widget _buildShopTypeBenefits() {
    String benefit = '';
    IconData icon = Icons.info_outline;
    Color color = const Color(0xFF00d2ff);

    switch (_shopType) {
      case 'merchant':
        benefit =
            'ร้านค้า/อาหาร: ลูกค้าค้นหาคุณเจอใน Near Me ในพื้นที่ใกล้เคียง (500ม.-5กม.) พร้อมระบบปักหมุดร้านเพื่อรับออเดอร์ท้องถิ่น';
        icon = Icons.near_me;
        break;
      case 'delivery':
        benefit =
            'วิน/ขนส่ง: แสดงสถานะรับงานบนแผนที่ Near Me ทันที เพื่อให้คนในพื้นที่เรียกส่งของหรือโดยสารได้รวดเร็ว';
        icon = Icons.local_shipping;
        color = Colors.orangeAccent;
        break;
      case 'service_provider':
        benefit =
            'บริการ/ช่าง: ลงทะเบียนความชำนาญเพื่อรับงานซ่อมหรือบริการต่างๆ จากลูกค้าที่ต้องการความช่วยเหลือด่วนใกล้คุณ';
        icon = Icons.build_circle;
        color = Colors.greenAccent;
        break;
    }

    return FadeInUp(
      duration: const Duration(milliseconds: 500),
      child: Container(
        margin: const EdgeInsets.only(top: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                benefit,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 11.5,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeOption(String value, String label, IconData icon) {
    final isSelected = _shopType == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _shopType = value;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF00d2ff) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : Colors.white54,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white54,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardBanner() {
    return FadeIn(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 15),
        decoration: BoxDecoration(
          color: Colors.yellow.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.yellow.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            const Icon(Icons.monetization_on, color: Colors.yellow, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: RichText(
                text: const TextSpan(
                  style: TextStyle(color: Colors.white, fontSize: 12),
                  children: [
                    TextSpan(text: 'กรอกข้อมูลให้ครบ รับทันที '),
                    TextSpan(
                      text: '50 เหรียญทอง 🪙',
                      style: TextStyle(
                          color: Colors.yellow, fontWeight: FontWeight.bold,),
                    ),
                    TextSpan(text: ' เพื่อใช้ในแอป'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkipButton() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(top: 15),
        child: TextButton(
          onPressed: _handleSkip,
          child: Text(
            'ข้ามการตั้งค่าไปก่อน',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.3),
              fontSize: 14,
              decoration: TextDecoration.underline,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.white.withValues(alpha: 0.6),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          validator: validator,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
            prefixIcon: Icon(icon, color: const Color(0xFF00d2ff), size: 20),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.07),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF00d2ff)),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red),
            ),
          ),
        ),
      ],
    );
  }
}
