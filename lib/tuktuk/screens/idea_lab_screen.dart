import 'dart:convert';

import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/screens/login_screen.dart';
import 'package:caculateapp/tuktuk/screens/post_product_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

// ─── Color Palette ────────────────────────────────────────────────────────────
const _bgDeep = Color(0xFF060912);
const _bgCard = Color(0xFF0E1426);
const _bgSurface = Color(0xFF141B30);
const _accent1 = Color(0xFFFF6B6B);
const _accent2 = Color(0xFFFF8E53);
const _accent3 = Color(0xFFFFD166);
const _neonBlue = Color(0xFF38BDF8);
const _neonPurp = Color(0xFFC084FC);
const _textHi = Color(0xFFF1F5F9);
const _textMid = Color(0xFF94A3B8);
const _textLow = Color(0xFF475569);
const _border = Color(0xFF1E293B);

enum IdeaLabMode { buyer, seller, general }

class IdeaLabScreen extends StatefulWidget {
  final String? initialProvince;
  final IdeaLabMode mode;
  final Map<String, dynamic>? initialContext;

  const IdeaLabScreen({
    super.key,
    this.initialProvince,
    this.mode = IdeaLabMode.general,
    this.initialContext,
  });

  @override
  State<IdeaLabScreen> createState() => _IdeaLabScreenState();
}

class _IdeaLabScreenState extends State<IdeaLabScreen>
    with TickerProviderStateMixin {
  // ─── State ───────────────────────────────────────────────────────────────
  final List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  late AnimationController _typingAnimationController;
  late AnimationController _pulseAnimationController;
  late AnimationController _shimmerController;
  bool _isTyping = false;
  bool _inputHasFocus = false;

  // ─── Quick Actions ────────────────────────────────────────────────────────
  final List<Map<String, dynamic>> _quickActions = [
    {
      'icon': Icons.restaurant_menu,
      'label': 'ร้านอาหาร',
      'color': const Color(0xFFFF8E53),
      'prompt': 'อยากเปิดร้านอาหารและขายของกิน',
    },
    {
      'icon': Icons.delivery_dining,
      'label': 'ขนส่ง',
      'color': const Color(0xFF38BDF8),
      'prompt': 'อยากรับงานขนส่งและโลจิสติกส์',
    },
    {
      'icon': Icons.handyman,
      'label': 'ช่างบริการ',
      'color': const Color(0xFF4ADE80),
      'prompt': 'อยากเปิดบริการช่างซ่อม',
    },
    {
      'icon': Icons.shopping_bag,
      'label': 'ออนไลน์',
      'color': const Color(0xFFC084FC),
      'prompt': 'อยากขายของออนไลน์',
    },
    {
      'icon': Icons.coffee,
      'label': 'คาเฟ่',
      'color': const Color(0xFFFBBF24),
      'prompt': 'อยากเปิดคาเฟ่เล็กๆ',
    },
    {
      'icon': Icons.fitness_center,
      'label': 'ฟิตเนส',
      'color': const Color(0xFFF87171),
      'prompt': 'อยากเปิดธุรกิจเกี่ยวกับสุขภาพ',
    },
  ];

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _addWelcomeMessage();
    _chatController.addListener(() => setState(() {}));
  }

  void _initializeAnimations() {
    _typingAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  void _addWelcomeMessage() {
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        String welcomeText =
            '👋 **สวัสดีครับ!**\n\nผมคือ **AI พี่เลี้ยง** จาก TukTuk Idea Lab 🚀';
        List<Map<String, dynamic>>? welcomeActions;

        if (widget.mode == IdeaLabMode.buyer) {
          final prodName = widget.initialContext?['productName'] ??
              widget.initialContext?['title'];
          if (prodName != null) {
            welcomeText +=
                '\n\nเห็นคุณกำลังสนใจ **$prodName** อยู่ ผมสามารถช่วยวิเคราะห์ความน่าเชื่อถือ หรือแนะนำสินค้าคุณภาพใกล้เคียงให้ได้นะครับ';
          } else {
            welcomeText +=
                '\n\nวันนี้คุณกำลังมองหาอะไรอยู่ครับ? พิมพ์ชื่อสินค้าหรือสิ่งที่ต้องการ แล้วผมจะช่วยช่วยค้นหาร้านค้าที่น่าเชื่อถือที่สุดให้ครับ';
          }
          welcomeActions = [
            {
              'label': '🔍 แนะนำร้านค้าที่น่าเชื่อถือ',
              'icon': Icons.verified_user_rounded,
              'color': const Color(0xFF38BDF8),
              'onTap': () => _processAiIdea(
                  'ช่วยแนะนำวิธีเลือกร้านค้าที่น่าเชื่อถือในการซื้อสินค้าออนไลน์',),
            },
            {
              'label': '🛍️ ช่วยหาของราคาคุ้มค่า',
              'icon': Icons.shopping_bag_rounded,
              'color': const Color(0xFF4ADE80),
              'onTap': () => _processAiIdea(
                  'ช่วยแนะนำวิธีการเปรียบเทียบราคาสินค้าเพื่อให้ได้ของที่คุ้มค่าที่สุด',),
            },
          ];
        } else if (widget.mode == IdeaLabMode.seller) {
          welcomeText +=
              '\n\nยินดีต้อนรับสู่โหมด **พาร์ทเนอร์ระดับโปร** 📈\n\nผมพร้อมช่วยคุณวิเคราะห์ตลาด แนะนำการจัดหน้าร้าน และวางกลยุทธ์เพิ่มยอดขายแบบครบวงจรครับ';
          welcomeActions = [
            {
              'label': '🏪 ปรับแต่งหน้าร้านให้น่าเชื่อถือ',
              'icon': Icons.storefront_rounded,
              'color': const Color(0xFF38BDF8),
              'onTap': () => _processAiIdea(
                  'แนะนำขั้นตอนการเปิดร้านและปรับแต่งหน้าร้านให้ดูเป็นมืออาชีพและน่าเชื่อถือ',),
            },
            {
              'label': '📢 กลยุทธ์การยิงโฆษณาและคอนเทนต์',
              'icon': Icons.campaign_rounded,
              'color': const Color(0xFFFF6B6B),
              'onTap': () => _processAiIdea(
                  'ขอแผนการสร้างคอนเทนต์และกลยุทธ์การประชาสัมพันธ์ร้านค้าให้เข้าถึงกลุ่มเป้าหมาย',),
            },
            {
              'label': '📊 วิเคราะห์เทรนด์สินค้าขายดี',
              'icon': Icons.analytics_rounded,
              'color': const Color(0xFFFFD166),
              'onTap': () => _processAiIdea(
                  'วิเคราะห์แนวโน้มสินค้าที่กำลังเป็นที่ต้องการในพื้นที่ของฉัน',),
            },
          ];
        } else {
          welcomeText +=
              '\n\nวันนี้มีอะไรให้ผมช่วยไหมครับ? ผมสามารถให้คำปรึกษาได้ทั้งเรื่องการซื้อของและการทำธุรกิจครับ';
          welcomeActions = [
            {
              'label': '🛒 ปรึกษาเรื่องการซื้อของ',
              'icon': Icons.shopping_cart_checkout_rounded,
              'color': const Color(0xFF38BDF8),
              'onTap': () => _processAiIdea(
                  'อยากได้คำแนะนำในการเลือกซื้อสินค้าอย่างปลอดภัย',),
            },
            {
              'label': '💼 ปรึกษาเรื่องการขายของ',
              'icon': Icons.business_center_rounded,
              'color': const Color(0xFF4ADE80),
              'onTap': () => _processAiIdea(
                  'อยากเริ่มต้นขายของในระบบ TukTuk ต้องทำอย่างไรบ้าง',),
            },
          ];
        }

        _addSystemMessage(welcomeText, actions: welcomeActions);
      }
    });
  }

  @override
  void dispose() {
    _typingAnimationController.dispose();
    _pulseAnimationController.dispose();
    _shimmerController.dispose();
    _chatController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ─── Message Helpers ──────────────────────────────────────────────────────
  void _addSystemMessage(String text, {List<Map<String, dynamic>>? actions}) {
    setState(() {
      _messages.add({
        'isUser': false,
        'text': text,
        'timestamp': DateTime.now(),
        'actions': actions,
      });
    });
    _scrollToBottom();
  }

  void _addUserMessage(String text) {
    setState(() {
      _messages.add({
        'isUser': true,
        'text': text,
        'timestamp': DateTime.now(),
      });
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  // ─── AI Logic ─────────────────────────────────────────────────────────────
  Future<void> _processAiIdea(String prompt, {XFile? image}) async {
    if (!_isLoggedIn) {
      _showLoginPrompt();
      return;
    }

    if (ProfanityFilter.hasProfanity(prompt)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('⚠️ กรุณาใช้คำสุภาพในการสนทนากับ AI')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _isTyping = true;
      if (image == null) {
        _addUserMessage(prompt);
      }
    });

    try {
      final user = await TukTukBridge().getCurrentUser();
      final province =
          widget.initialProvince ?? user?['province'] ?? 'ประเทศไทย';
      final persona = user?['persona']?.toString() ?? 'shopper';
      final age = user?['age']?.toString() ?? 'unknown';

      String enhancedPrompt = '';
      if (widget.mode == IdeaLabMode.buyer) {
        String simplifiedContext = '';
        if (widget.initialContext != null) {
          final ctx = widget.initialContext!;
          simplifiedContext =
              'ข้อมูลสินค้า: ${ctx['productName'] ?? ctx['title'] ?? 'ไม่ระบุชื่อ'}, ราคา: ${ctx['price'] ?? 'ไม่ระบุ'}, รายละเอียด: ${ctx['description'] ?? 'ไม่มี'}.';
        }
        enhancedPrompt =
            'คุณคือ AI Personal Shopper จบจากหลักสูตรการดูแลลูกค้ามืออาชีพ $simplifiedContext คำถามผู้ใช้: $prompt. ช่วยค้นหาสินค้า แนะนำร้านค้าที่น่าเชื่อถือ ให้คำแนะนำเรื่องความคุ้มค่าและความปลอดภัยในการซื้อแบบสุภาพและเป็นกันเอง ห้ามแนะนำเรื่องการสร้างอาชีพเด็ดขาด.';
      } else if (widget.mode == IdeaLabMode.seller) {
        enhancedPrompt =
            'คุณคือ AI พี่เลี้ยงธุรกิจระดับโปร (Business Coach) ข้อมูลผู้ใช้: $persona อายุ $age พื้นที่ $province. คำถามผู้ใช้: $prompt. ช่วยวางแผนธุรกิจแบบครบวงจร ตั้งแต่การเปิดร้าน การคัดเลือกสินค้า กลยุทธ์การตลาด และการสร้างคอนเทนต์ให้น่าสนใจเพื่อเพิ่มยอดขาย ตอบแบบมืออาชีพและนำไปใช้งานได้จริง.';
      } else {
        enhancedPrompt =
            'คุณคือผู้ช่วยอัจฉริยะ ข้อมูล: $persona อายุ $age พื้นที่ $province. คำถาม: $prompt. ให้คำปรึกษาทั่วไปเกี่ยวกับการใช้งานระบบ TukTuk ทั้งในมุมผู้ซื้อและผู้ขาย.';
      }

      final response =
          await TukTukBridge().callGemini(enhancedPrompt, image: image);

      setState(() => _isTyping = false);

      if (widget.mode == IdeaLabMode.buyer ||
          widget.mode == IdeaLabMode.seller) {
        // Direct response for specialized modes
        _addSystemMessage(response);
      } else {
        // Try structure for General Idea mode
        try {
          final rawJson = _extractJson(response);
          final Map<String, dynamic> data = jsonDecode(rawJson);

          if (data['ideas'] != null && (data['ideas'] as List).isNotEmpty) {
            _addSystemMessage(
              '🎯 **เยี่ยมมากครับ!**\n\nนี่คือไอเดียที่ผมแนะนำสำหรับพื้นที่ของคุณ:',
              actions: (data['ideas'] as List)
                  .map((idea) => {
                        'label':
                            '✨ ${idea['level'] ?? ''}: ${idea['title'] ?? ''}',
                        'icon': Icons.lightbulb_outline,
                        'color': const Color(0xFFFFD166),
                        'onTap': () => _startOneClickPost(idea),
                      },)
                  .toList(),
            );
            for (final idea in data['ideas']) {
              _addSystemMessage(
                '**${idea['title']}**\n\n${idea['description']}\n\n💰 ราคาเริ่มต้น: ${idea['price']} บาท',
                actions: [
                  {
                    'label': '📝 ร่างโพสต์ขาย',
                    'icon': Icons.post_add,
                    'color': const Color(0xFF4ADE80),
                    'onTap': () => _startOneClickPost(idea),
                  },
                  {
                    'label': '📊 ดูแผนธุรกิจ',
                    'icon': Icons.analytics,
                    'color': const Color(0xFF38BDF8),
                    'onTap': () => _showBusinessPlan(idea),
                  },
                ],
              );
            }
          } else {
            _addSystemMessage(response);
          }
        } catch (e) {
          // Plain text fallback
          _addSystemMessage(response);
        }
      }
    } catch (e) {
      setState(() => _isTyping = false);
      _addSystemMessage(
          '❌ ขออภัยครับ เกิดข้อผิดพลาด: $e\n\nลองใหม่อีกครั้งนะครับ!',);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _extractJson(String input) {
    final int start = input.indexOf('{');
    final int end = input.lastIndexOf('}');
    if (start != -1 && end != -1) return input.substring(start, end + 1);
    return input;
  }

  void _startOneClickPost(Map<String, dynamic> idea) {
    if (!_isLoggedIn) {
      _showLoginPrompt();
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PostProductScreen(
          initialData: {
            'productName': idea['title'],
            'description': idea['starterPostDesc'] ?? idea['description'],
            'price': idea['price']?.toString() ?? '0',
            'marketType': 'community',
          },
        ),
      ),
    );
  }

  bool get _isLoggedIn => FirebaseAuth.instance.currentUser != null;

  Future<void> _pickImage() async {
    if (!_isLoggedIn) {
      _showLoginPrompt();
      return;
    }
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      _addUserMessage('📸 ถ่ายรูปวัตถุดิบ/สินค้า');
      _processAiIdea('วิเคราะห์ภาพวัตถุดิบและแนะนำไอเดียธุรกิจ', image: image);
    }
  }

  // ─── Business Plan Sheet ─────────────────────────────────────────────────
  void _showBusinessPlan(Map<String, dynamic> idea) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: _bgCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: _textLow,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF4158D0), Color(0xFFC850C0)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.business_center_rounded,
                        color: Colors.white, size: 20,),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('แผนธุรกิจ',
                            style: GoogleFonts.kanit(
                                color: _textMid, fontSize: 12,),),
                        Text(
                          idea['title'],
                          style: GoogleFonts.kanit(
                            color: _textHi,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: _bgSurface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _border),
                      ),
                      child: const Icon(Icons.close_rounded,
                          color: _textMid, size: 18,),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            const Divider(color: _border, height: 1),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildPlanSection('📊 ภาพรวมธุรกิจ', Icons.analytics_rounded,
                      idea['description'] ?? 'รายละเอียดธุรกิจ',),
                  const SizedBox(height: 12),
                  _buildPlanSection(
                    '💰 แผนการเงิน',
                    Icons.account_balance_wallet_rounded,
                    'เงินลงทุนเริ่มต้น: ${idea['price']} บาท\n\nค่าใช้จ่ายรายเดือนโดยประมาณ:\n• ค่าวัตถุดิบ: 5,000 บาท\n• ค่าเช่า: 3,000 บาท\n• ค่าแรง: 9,000 บาท\n\nรายได้คาดการณ์เดือนแรก: 15,000-20,000 บาท',
                  ),
                  const SizedBox(height: 12),
                  _buildPlanSection(
                    '📝 ขั้นตอนเริ่มต้น',
                    Icons.checklist_rounded,
                    '1. จัดเตรียมอุปกรณ์\n2. ลงทะเบียนร้านค้า\n3. ถ่ายรูปสินค้า\n4. โพสต์ขายใน TukTuk\n5. เริ่มรับออเดอร์',
                  ),
                  const SizedBox(height: 12),
                  _buildPlanSection(
                    '🎯 การตลาด',
                    Icons.trending_up_rounded,
                    '• โปรโมทผ่านโซเชียลมีเดีย\n• ทำโปรโมชั่นเปิดร้าน\n• ใช้ระบบแนะนำเพื่อน\n• ร่วมกิจกรรมชุมชน TukTuk',
                  ),
                ],
              ),
            ),

            // CTA
            Container(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: _border)),
                color: _bgCard,
              ),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: () => _startOneClickPost(idea),
                  icon: const Icon(Icons.rocket_launch_rounded, size: 18),
                  label: Text('เริ่มโพสต์ขายเลย',
                      style: GoogleFonts.kanit(
                          fontSize: 15, fontWeight: FontWeight.bold,),),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _accent1,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanSection(String title, IconData icon, String content) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _bgSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: _accent2.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: _accent2, size: 16),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.kanit(
                    color: _textHi,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style:
                GoogleFonts.kanit(color: _textMid, fontSize: 13, height: 1.7),
          ),
        ],
      ),
    );
  }

  // ─── Login Prompt ─────────────────────────────────────────────────────────
  void _showLoginPrompt() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(28, 24, 28, 40),
        decoration: const BoxDecoration(
          color: _bgCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: _textLow, borderRadius: BorderRadius.circular(2),),),
            const SizedBox(height: 28),

            // Icon with pulse
            ScaleTransition(
              scale: Tween(begin: 0.95, end: 1.0).animate(
                CurvedAnimation(
                    parent: _pulseAnimationController, curve: Curves.easeInOut,),
              ),
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [_accent1, _accent2],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                        color: _accent1.withValues(alpha: 0.35),
                        blurRadius: 24,
                        spreadRadius: 4,),
                  ],
                ),
                child: const Icon(Icons.lock_person_rounded,
                    color: Colors.white, size: 36,),
              ),
            ),
            const SizedBox(height: 24),

            Text('กรุณาเข้าสู่ระบบ',
                style: GoogleFonts.kanit(
                    color: _textHi, fontSize: 22, fontWeight: FontWeight.bold,),),
            const SizedBox(height: 10),
            Text(
              'เพื่อให้ AI พี่เลี้ยงสามารถจดจำคุณ\nและช่วยร่างแผนธุรกิจได้แม่นยำขึ้นครับ',
              textAlign: TextAlign.center,
              style:
                  GoogleFonts.kanit(color: _textMid, fontSize: 14, height: 1.6),
            ),
            const SizedBox(height: 28),

            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.push(context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _accent3,
                  foregroundColor: _bgDeep,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),),
                ),
                child: Text('เข้าสู่ระบบ / สมัครสมาชิก',
                    style: GoogleFonts.kanit(
                        fontSize: 15, fontWeight: FontWeight.bold,),),
              ),
            ),
            const SizedBox(height: 12),

            TextButton(
              onPressed: () async {
                await TukTukBridge().skipIdeaLab();
                if (mounted) {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                }
              },
              child: Text('ไว้ทีหลัง',
                  style: GoogleFonts.kanit(color: _textLow, fontSize: 14),),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Info Dialog ──────────────────────────────────────────────────────────
  void _showInfoDialog() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: _bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [_accent1, _accent2],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.auto_awesome_rounded,
                    color: Colors.white, size: 30,),
              ),
              const SizedBox(height: 18),
              Text('AI พี่เลี้ยงส่วนตัวของคุณ',
                  style: GoogleFonts.kanit(
                      color: _textHi,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,),),
              const SizedBox(height: 14),
              ...[
                '🎯 แนะนำไอเดียธุรกิจที่เหมาะกับคุณ',
                '🖼️ วิเคราะห์ภาพถ่ายสินค้า/วัตถุดิบ',
                '📝 ร่างแผนธุรกิจและโพสต์ขาย',
                '💰 คำนวณต้นทุนและกำไรเบื้องต้น',
                '📍 แนะนำการตลาดตามพื้นที่',
              ].map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Text(e.split(' ')[0],
                            style: const TextStyle(fontSize: 14),),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(e.substring(e.indexOf(' ') + 1),
                                style: GoogleFonts.kanit(
                                    color: _textMid, fontSize: 13,),),),
                      ],
                    ),
                  ),),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  style: TextButton.styleFrom(
                    backgroundColor: _bgSurface,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),),
                  ),
                  child: Text('เข้าใจแล้ว',
                      style: GoogleFonts.kanit(
                          color: _accent2, fontWeight: FontWeight.bold,),),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Format Time ──────────────────────────────────────────────────────────
  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    if (time.isAfter(today)) return DateFormat('HH:mm').format(time);
    return DateFormat('d MMM HH:mm', 'th').format(time);
  }

  // ─── Build ────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          Expanded(child: _buildMessageList()),
          if (_isTyping) _buildTypingIndicator(),
          _buildInputArea(),
        ],
      ),
    );
  }

  // ─── AppBar ───────────────────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: _bgCard,
      elevation: 0,
      scrolledUnderElevation: 0,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: _border),
      ),
      leading: Padding(
        padding: const EdgeInsets.all(10),
        child: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            decoration: BoxDecoration(
              color: _bgSurface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _border),
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded,
                color: _textMid, size: 16,),
          ),
        ),
      ),
      title: Row(
        children: [
          // Animated AI avatar
          AnimatedBuilder(
            animation: _pulseAnimationController,
            builder: (context, child) {
              final glow = _pulseAnimationController.value;
              return Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [_accent1, _accent2]),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: _accent1.withValues(alpha: 0.2 + 0.15 * glow),
                      blurRadius: 8 + 4 * glow,
                      spreadRadius: glow * 2,
                    ),
                  ],
                ),
                child: const Icon(Icons.auto_awesome_rounded,
                    color: Colors.white, size: 18,),
              );
            },
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Text('Idea Lab',
                      style: GoogleFonts.kanit(
                          color: _textHi,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,),),
                  const SizedBox(width: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: _accent3.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: _accent3.withValues(alpha: 0.35)),
                    ),
                    child: Text('BETA',
                        style: GoogleFonts.kanit(
                            color: _accent3,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,),),
                  ),
                ],
              ),
              Text('AI พี่เลี้ยงธุรกิจ',
                  style: GoogleFonts.kanit(color: _textLow, fontSize: 11),),
            ],
          ),
        ],
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: GestureDetector(
            onTap: _showInfoDialog,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _bgSurface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _border),
              ),
              child: const Icon(Icons.info_outline_rounded,
                  color: _textMid, size: 18,),
            ),
          ),
        ),
      ],
    );
  }

  // ─── Message List ─────────────────────────────────────────────────────────
  Widget _buildMessageList() {
    if (_messages.isEmpty) return _buildEmptyState();
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];
        return FadeInUp(
          delay: Duration(milliseconds: 40 * index.clamp(0, 10)),
          duration: const Duration(milliseconds: 350),
          child: _buildMessageBubble(msg),
        );
      },
    );
  }

  // ─── Empty State ──────────────────────────────────────────────────────────
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 800),
            tween: Tween(begin: 0.0, end: 1.0),
            curve: Curves.elasticOut,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [
                      _accent3.withValues(alpha: 0.18),
                      _accent1.withValues(alpha: 0.06),
                      Colors.transparent,
                    ],
                    stops: const [0, 0.6, 1],
                  ),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [_accent1, _accent2],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                            color: _accent1.withValues(alpha: 0.35),
                            blurRadius: 24,
                            spreadRadius: 4,),
                      ],
                    ),
                    child: const Icon(Icons.psychology_rounded,
                        size: 36, color: Colors.white,),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'พร้อมเริ่มสร้างไอเดียธุรกิจ?',
            style: GoogleFonts.kanit(
                color: _textHi, fontSize: 20, fontWeight: FontWeight.bold,),
          ),
          const SizedBox(height: 8),
          Text(
            'พิมพ์สิ่งที่คุณสนใจ หรือเลือกจากด้านล่าง',
            style: GoogleFonts.kanit(color: _textLow, fontSize: 14),
          ),
        ],
      ),
    );
  }

  // ─── Message Bubble ───────────────────────────────────────────────────────
  Widget _buildMessageBubble(Map<String, dynamic> msg) {
    final isUser = msg['isUser'] == true;
    final time = msg['timestamp'] as DateTime;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            // AI Avatar
            Container(
              width: 34,
              height: 34,
              margin: const EdgeInsets.only(bottom: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [_accent1, _accent2]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome_rounded,
                  color: Colors.white, size: 16,),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                // Bubble
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.72,
                  ),
                  decoration: BoxDecoration(
                    gradient: isUser
                        ? const LinearGradient(
                            colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : const LinearGradient(
                            colors: [_bgSurface, _bgCard],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isUser ? 18 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 18),
                    ),
                    border: isUser ? null : Border.all(color: _border),
                    boxShadow: isUser
                        ? [
                            BoxShadow(
                                color:
                                    const Color(0xFF4F46E5).withValues(alpha: 0.25),
                                blurRadius: 12,
                                offset: const Offset(0, 4),),
                          ]
                        : null,
                  ),
                  child: Text(
                    msg['text'],
                    style: GoogleFonts.kanit(
                      color: isUser ? Colors.white : _textMid,
                      fontSize: 14,
                      height: 1.6,
                    ),
                  ),
                ),

                // Timestamp
                Padding(
                  padding: const EdgeInsets.only(top: 5, left: 4, right: 4),
                  child: Text(
                    _formatTime(time),
                    style: GoogleFonts.kanit(color: _textLow, fontSize: 10),
                  ),
                ),

                // Action Buttons
                if (msg['actions'] != null) ...[
                  const SizedBox(height: 8),
                  ...(msg['actions'] as List).map((action) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _buildActionButton(action),
                      ),),
                ],
              ],
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }

  // ─── Action Button ────────────────────────────────────────────────────────
  Widget _buildActionButton(Map<String, dynamic> action) {
    final color = action['color'] as Color;
    return GestureDetector(
      onTap: action['onTap'],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(action['icon'] ?? Icons.lightbulb_outline,
                  color: color, size: 14,),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                action['label'],
                style: GoogleFonts.kanit(
                    color: _textHi, fontSize: 13, fontWeight: FontWeight.w500,),
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                color: color.withValues(alpha: 0.6), size: 16,),
          ],
        ),
      ),
    );
  }

  // ─── Typing Indicator ─────────────────────────────────────────────────────
  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [_accent1, _accent2]),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.auto_awesome_rounded,
                color: Colors.white, size: 16,),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: _bgSurface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: _border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (index) {
                return AnimatedBuilder(
                  animation: _typingAnimationController,
                  builder: (context, child) {
                    final delay = index * 0.3;
                    final val =
                        ((_typingAnimationController.value - delay) % 1.0 +
                                1.0) %
                            1.0;
                    final t = Curves.easeInOut.transform(val);
                    return Transform.translate(
                      offset: Offset(0, -4 * t),
                      child: Container(
                        width: 6,
                        height: 6,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          color: Color.lerp(_textLow, _accent2, t),
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  },
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Input Area ───────────────────────────────────────────────────────────
  Widget _buildInputArea() {
    return Container(
      decoration: const BoxDecoration(
        color: _bgCard,
        border: Border(top: BorderSide(color: _border)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Quick action chips
              SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _quickActions.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final action = _quickActions[index];
                    final color = action['color'] as Color;
                    return GestureDetector(
                      onTap: () => _processAiIdea(action['prompt']),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 7,),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: color.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(action['icon'], color: color, size: 13),
                            const SizedBox(width: 5),
                            Text(action['label'],
                                style: GoogleFonts.kanit(
                                    color: color,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,),),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 10),

              // Text input row
              Row(
                children: [
                  // Camera button
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: _bgSurface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: _border),
                      ),
                      child: const Icon(Icons.camera_alt_rounded,
                          color: _neonBlue, size: 20,),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Text field
                  Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: _bgSurface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _inputHasFocus
                              ? _accent1.withValues(alpha: 0.5)
                              : _border,
                          width: _inputHasFocus ? 1.5 : 1,
                        ),
                      ),
                      child: Focus(
                        onFocusChange: (v) =>
                            setState(() => _inputHasFocus = v),
                        child: TextField(
                          controller: _chatController,
                          style:
                              GoogleFonts.kanit(color: _textHi, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'พิมพ์ความสนใจของคุณ...',
                            hintStyle: GoogleFonts.kanit(
                                color: _textLow, fontSize: 14,),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12,),
                          ),
                          onSubmitted: (text) {
                            if (text.trim().isNotEmpty) {
                              _processAiIdea(text.trim());
                              _chatController.clear();
                            }
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Send button
                  GestureDetector(
                    onTap: () {
                      if (_chatController.text.trim().isNotEmpty) {
                        _processAiIdea(_chatController.text.trim());
                        _chatController.clear();
                      }
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        gradient: _chatController.text.isNotEmpty
                            ? const LinearGradient(
                                colors: [_accent1, _accent2],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,)
                            : null,
                        color: _chatController.text.isEmpty ? _bgSurface : null,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _chatController.text.isNotEmpty
                              ? Colors.transparent
                              : _border,
                        ),
                        boxShadow: _chatController.text.isNotEmpty
                            ? [
                                BoxShadow(
                                    color: _accent1.withValues(alpha: 0.35),
                                    blurRadius: 12,
                                    spreadRadius: 1,),
                              ]
                            : null,
                      ),
                      child: Icon(
                        Icons.send_rounded,
                        color: _chatController.text.isNotEmpty
                            ? Colors.white
                            : _textLow,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
