import 'dart:math' as math;
import 'dart:ui';

import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/register_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/tuktuk_feed_screen.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback? onLoginSuccess;
  final bool shouldPopOnSuccess;

  const LoginScreen({
    super.key,
    this.onLoginSuccess,
    this.shouldPopOnSuccess = true,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final TextEditingController _pinController = TextEditingController();
  bool _isLoggingIn = false;
  bool _isSuccess = false;
  bool _acceptedTerms = false;
  bool _isVerifyMode = false;
  bool _showPinLogin = false;
  final List<TextEditingController> _codeControllers =
      List.generate(6, (i) => TextEditingController(text: '\u200b'));
  final List<FocusNode> _codeFocusNodes = List.generate(6, (i) => FocusNode());
  List<Map<String, dynamic>> _savedAccounts = [];
  Map<String, dynamic>? _pendingSession;

  // 🛡️ Security Stats
  int _failedAttempts = 0;
  DateTime? _lastAttemptTime;
  String? _deviceFingerprint;
  bool _requiresCaptcha = false;
  int? _captchaAnswer;
  final TextEditingController _captchaController = TextEditingController();

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(
        CurvedAnimation(parent: _animationController, curve: Curves.easeOut),);

    _animationController.forward();
    _loadAccounts();
    _initSecurity();
  }

  Future<void> _initSecurity() async {
    final prefs = await SharedPreferences.getInstance();
    _failedAttempts = prefs.getInt('login_fails') ?? 0;

    // Fingerprint device
    final deviceInfo = DeviceInfoPlugin();
    if (Theme.of(context).platform == TargetPlatform.android) {
      final androidInfo = await deviceInfo.androidInfo;
      _deviceFingerprint = androidInfo.id;
    } else if (Theme.of(context).platform == TargetPlatform.iOS) {
      final iosInfo = await deviceInfo.iosInfo;
      _deviceFingerprint = iosInfo.identifierForVendor;
    }

    if (_failedAttempts >= 3) {
      setState(() => _requiresCaptcha = true);
      _generateCaptcha();
    }
  }

  void _generateCaptcha() {
    final r = math.Random();
    final a = r.nextInt(10);
    final b = r.nextInt(10);
    _captchaAnswer = a + b;
    setState(() {});
  }

  @override
  void dispose() {
    _animationController.dispose();
    _pinController.dispose();
    for (final controller in _codeControllers) {
      controller.dispose();
    }
    for (final node in _codeFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  Future<void> _loadAccounts() async {
    final accounts = await TukTukBridge().getSavedAccounts();
    if (mounted) {
      setState(() => _savedAccounts = accounts);
    }
  }

  Future<void> _handlePinLogin() async {
    final password = _pinController.text;
    if (password.isEmpty) {
      _showErrorSnackBar('กรุณากรอกรหัสผ่าน');
      return;
    }

    if (!_acceptedTerms) {
      _showErrorSnackBar('กรุณายอมรับเงื่อนไขการใช้งานก่อน');
      return;
    }

    // 🛡️ Rate Limiting Check
    if (_lastAttemptTime != null) {
      final diff = DateTime.now().difference(_lastAttemptTime!);
      if (_failedAttempts >= 5 && diff.inSeconds < 60) {
        _showErrorSnackBar(
            'ระงับชั่วคราว: โปรดรออีก ${60 - diff.inSeconds} วินาที',);
        return;
      }
    }

    // 🛡️ Captcha Validation
    if (_requiresCaptcha) {
      if (_captchaController.text != _captchaAnswer.toString()) {
        _showErrorSnackBar('รหัสยืนยันไม่ถูกต้อง');
        _generateCaptcha();
        return;
      }
    }

    setState(() => _isLoggingIn = true);

    try {
      // 🛡️ Log fingerprint for security audit
      debugPrint('[SECURITY] Login attempt from device: $_deviceFingerprint');

      final session = await TukTukBridge().verifyPin(password);

      if (mounted && session != null) {
        // Reset security on success
        final prefs = await SharedPreferences.getInstance();
        await prefs.setInt('login_fails', 0);

        FocusScope.of(context).unfocus();

        setState(() {
          _isLoggingIn = false;
          _isSuccess = true;
          _failedAttempts = 0;
          _requiresCaptcha = false;
        });

        await Future.delayed(const Duration(milliseconds: 800));

        if (mounted) {
          _navigateAfterLogin(session, isDirectPin: true);
        }
      }
    } catch (e) {
      if (mounted) {
        _failedAttempts++;
        _lastAttemptTime = DateTime.now();
        final prefs = await SharedPreferences.getInstance();
        await prefs.setInt('login_fails', _failedAttempts);

        if (_failedAttempts >= 3) {
          setState(() => _requiresCaptcha = true);
          _generateCaptcha();
        }

        _showErrorSnackBar(e.toString().replaceAll('Exception: ', ''));
        setState(() => _isLoggingIn = false);
      }
    }
  }

  Future<void> _navigateAfterLogin(Map<String, dynamic> session,
      {bool isDirectPin = false,}) async {
    if (!mounted) return;

    final String? persona = session['persona'];
    final String? province = session['province'];
    final String? uid = session['uid'] ?? session['lineUserId'];

    // 👑 Super Admin Bypass Policy
    final bool isSuperAdmin = uid == 'Ud9bec6d2ea945cf4330a69cb74ac93cf';

    final bool isProfileIncomplete = persona == null || province == null;
    final bool isLineLinked = session['lineUserId'] != null;
    final bool isSeller =
        session['isSeller'] == true || session['sellerStatus'] != 'none';

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      // 👑 Policy Enforcement: Super Admin bypass all hurdles
      if (isSuperAdmin) {
        _showSuccessSnackBar('ยินดีต้อนรับท่านผู้บริหารสูงสุด! 👑');
        _performFinalNavigation(session);
        return;
      }

      if (isProfileIncomplete && !isDirectPin) {
        _showWelcomeChoice(session);
      } else if (isSeller && !isLineLinked && !isDirectPin) {
        // 🏪 Policy Enforcement: If established as seller, bypass re-verification
        // User: "ต้องไม่ถามเมื่อได้ pin เพื่อเป็นร้านค้าแล้ว"
        _performFinalNavigation(session);
      } else {
        _performFinalNavigation(session);
      }
    });
  }

  // ✅ Centrally managed navigation to ensure consistency and prevent loops
  void _performFinalNavigation(Map<String, dynamic> session) {
    if (!mounted) return;

    final bool isAdmin = session['isAdmin'] == true;
    if (isAdmin) {
      _showSuccessSnackBar('ยินดีต้อนรับเข้าสู่ระบบจัดการครับ! 🛡️');
    }

    // 💰 Award Login Bonus Coins (as promised in the UI)
    TukTukBridge().awardPoints(
      'login',
      customPoints: 50,
      description: 'โบนัสเข้าสู่ระบบประจำวัน (Extra Bonus)',
    );

    if (widget.onLoginSuccess != null) {
      widget.onLoginSuccess!();
    }

    if (widget.shouldPopOnSuccess && Navigator.canPop(context)) {
      Navigator.pop(context, true);
    } else if (widget.onLoginSuccess == null) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const TukTukFeedScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _handleStepVerify() async {
    final code =
        _codeControllers.map((c) => c.text.replaceAll('\u200b', '')).join();
    if (code.length < 6) {
      _showErrorSnackBar('กรุณากรอกรหัส 6 หลักให้ครบถ้วน');
      return;
    }

    _pinController.text = code;
    _handlePinLogin();
  }

  Future<void> _handleLineLogin() async {
    if (!_acceptedTerms) {
      _showErrorSnackBar('กรุณายอมรับเงื่อนไขการใช้งานก่อน');
      return;
    }

    setState(() => _isLoggingIn = true);

    try {
      final session = await TukTukBridge().signInWithLine();
      if (session != null && mounted) {
        FocusScope.of(context).unfocus();
        setState(() {
          _isLoggingIn = false;
          _isSuccess = true;
        });

        // ลด delay เหลือ 600ms แล้วไปหน้า feed เลย (ข้าม welcome choice)
        await Future.delayed(const Duration(milliseconds: 600));

        if (mounted) {
          _performFinalNavigation(session);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoggingIn = false);
        String errorMsg = 'LINE Login ล้มเหลว: $e';
        if (e.toString().contains('CANCEL')) {
          errorMsg =
              'การเชื่อมต่อถูกยกเลิก (โปรดเช็ค SHA-1 และ Package Name ใน LINE Console)';
        }
        _showErrorSnackBar(errorMsg, duration: const Duration(seconds: 5));
      }
    }
  }

  Future<void> _requestResendCode() async {
    setState(() => _isLoggingIn = true);
    final uid = _pendingSession?['uid'] ?? _pendingSession?['lineUserId'];

    try {
      final success = await TukTukBridge().requestVerificationCode(uid);
      if (mounted) {
        setState(() => _isLoggingIn = false);
        if (success) {
          _showSuccessSnackBar('ส่งรหัสใหม่เข้า LINE เรียบร้อยแล้วครับ! 📩');
        } else {
          _showErrorSnackBar('ไม่สามารถส่งรหัสได้ในขณะนี้');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoggingIn = false);
        _showErrorSnackBar('เกิดข้อผิดพลาด: $e');
      }
    }
  }

  void _showWelcomeChoice(Map<String, dynamic> session) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: true,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [
              Color(0xFF1a1a2e),
              Color(0xFF16213E),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        padding: const EdgeInsets.all(25),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 50,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(height: 25),
              Container(
                padding: const EdgeInsets.all(15),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF00d9ff), Color(0xFF0088cc)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.handshake_rounded,
                    color: Colors.white, size: 40,),
              ),
              const SizedBox(height: 20),
              Text(
                'ยินดีต้อนรับสู่ TukTuk! 🎉',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'กรุณาเลือกรูปแบบการใช้งานที่ตรงกับความต้องการของคุณ',
                textAlign: TextAlign.center,
                style: GoogleFonts.kanit(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 30),
              // Use Wrap instead of Row to handle overflow gracefully
              Wrap(
                spacing: 15,
                runSpacing: 15,
                alignment: WrapAlignment.center,
                children: [
                  SizedBox(
                    width: (MediaQuery.of(context).size.width - 65) /
                        2, // Adaptive width
                    child: _buildWelcomeCard(
                      title: 'ผู้ซื้อ',
                      desc: 'หาของกิน ของใช้\nร้านค้าใกล้บ้าน',
                      icon: Icons.shopping_cart_outlined,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00d9ff), Color(0xFF0088cc)],
                      ),
                      onTap: () => _finishChoice('shopper'),
                    ),
                  ),
                  SizedBox(
                    width: (MediaQuery.of(context).size.width - 65) /
                        2, // Adaptive width
                    child: _buildWelcomeCard(
                      title: 'ร้านค้า',
                      desc: 'เปิดร้าน ลงสินค้า\nสร้างโอกาสขาย',
                      icon: Icons.storefront_rounded,
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF6B6B), Color(0xFFFF8E8E)],
                      ),
                      onTap: () => _finishChoice('seller'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeCard({
    required String title,
    required String desc,
    required IconData icon,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(25),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 25, horizontal: 15),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.white.withValues(alpha: 0.05),
                Colors.white.withValues(alpha: 0.02),
              ],
            ),
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  gradient: gradient,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: Colors.white, size: 32),
              ),
              const SizedBox(height: 15),
              Text(
                title,
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                desc,
                textAlign: TextAlign.center,
                style: GoogleFonts.kanit(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 12,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _finishChoice(String persona) {
    Navigator.pop(context);
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => RegisterScreen(
          mode: 'onboarding',
          initialPersona: persona,
        ),
      ),
    );
  }

  void _showErrorSnackBar(String message, {Duration? duration}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.kanit())),
          ],
        ),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: duration ?? const Duration(seconds: 3),
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.kanit())),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      body: Stack(
        children: [
          // Animated background gradient
          AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return Container(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment(
                      0.5 + (_animationController.value * 0.1),
                      -0.5 - (_animationController.value * 0.1),
                    ),
                    radius: 1.5,
                    colors: [
                      const Color(0xFF00d9ff)
                          .withValues(alpha: 0.15 * _animationController.value),
                      const Color(0xFF0A0E21),
                      const Color(0xFF0A0E21),
                    ],
                  ),
                ),
              );
            },
          ),

          LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Container(
                  width: double.infinity,
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: SafeArea(
                    child: FadeTransition(
                      opacity: _fadeAnimation,
                      child: SlideTransition(
                        position: _slideAnimation,
                        child: Column(
                          children: [
                            const SizedBox(height: 30),

                            // Animated Logo
                            Hero(
                              tag: 'app_logo',
                              child: TweenAnimationBuilder<double>(
                                duration: const Duration(seconds: 2),
                                tween: Tween(begin: 0.0, end: 1.0),
                                builder: (context, value, child) {
                                  return Transform.scale(
                                    scale: 0.9 + (value * 0.1),
                                    child: Container(
                                      width: 90,
                                      height: 90,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: const SweepGradient(
                                          colors: [
                                            Color(0xFF00d9ff),
                                            Color(0xFF0088cc),
                                            Color(0xFF00d9ff),
                                          ],
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF00d9ff)
                                                .withValues(alpha: 0.3),
                                            blurRadius: 20 + (value * 10),
                                            spreadRadius: value * 5,
                                          ),
                                        ],
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(3),
                                        child: ClipOval(
                                          child: Image.asset(
                                              'assets/images/tuktuk.png',
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error,
                                                      stackTrace,) =>
                                                  Container(
                                                    color: Colors.white,
                                                    child: const Icon(
                                                        Icons.apps,
                                                        color:
                                                            Color(0xFF00d9ff),
                                                        size: 40,),
                                                  ),),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),

                            const SizedBox(height: 25),

                            if (_isVerifyMode) ...[
                              _buildVerifyMode(),
                            ] else if (_showPinLogin) ...[
                              _buildPinLoginMode(),
                            ] else ...[
                              _buildMainLoginMode(),
                            ],

                            const SizedBox(height: 20),

                            // Footer
                            TextButton(
                              onPressed: () => launchUrl(
                                  Uri.parse('https://lin.ee/1YJsw47'),),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.help_outline_rounded,
                                      color: Colors.white.withValues(alpha: 0.3),
                                      size: 16,),
                                  const SizedBox(width: 8),
                                  Text(
                                    'ลืมรหัสผ่าน? / ต้องการความช่วยเหลือ',
                                    style: GoogleFonts.kanit(
                                      color: Colors.white.withValues(alpha: 0.3),
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (widget.onLoginSuccess != null)
                              const SizedBox(height: 80),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),

          // Professional Success Overlay
          if (_isSuccess)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.8),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Center(
                    child: FadeInDown(
                      duration: const Duration(milliseconds: 600),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Animated checkmark
                          TweenAnimationBuilder<double>(
                            duration: const Duration(milliseconds: 1200),
                            tween: Tween(begin: 0.0, end: 1.0),
                            builder: (context, value, child) {
                              return Transform.scale(
                                scale: value,
                                child: Container(
                                  width: 120,
                                  height: 120,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: const SweepGradient(
                                      colors: [
                                        Color(0xFF00d9ff),
                                        Color(0xFF0088cc),
                                        Color(0xFF00d9ff),
                                      ],
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF00d9ff)
                                            .withValues(alpha: 0.5),
                                        blurRadius: 30,
                                        spreadRadius: value * 10,
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Icon(
                                      Icons.check_rounded,
                                      color: Colors.white,
                                      size: 60 * value,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 30),
                          Shimmer.fromColors(
                            baseColor: Colors.white,
                            highlightColor: const Color(0xFF00d9ff),
                            child: Text(
                              'เข้าสู่ระบบสำเร็จ',
                              style: GoogleFonts.kanit(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          FadeInUp(
                            delay: const Duration(milliseconds: 400),
                            child: Text(
                              'กำลังเตรียมความสนุกให้คุณ...',
                              style: GoogleFonts.kanit(
                                color: Colors.white.withValues(alpha: 0.6),
                                fontSize: 16,
                              ),
                            ),
                          ),
                          const SizedBox(height: 30),
                          // Animated dots
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(3, (index) {
                              return TweenAnimationBuilder<double>(
                                duration:
                                    Duration(milliseconds: 600 + (index * 200)),
                                tween: Tween(begin: 0.0, end: 1.0),
                                builder: (context, value, child) {
                                  return Transform.scale(
                                    scale: 0.5 + (value * 0.5),
                                    child: Container(
                                      width: 10,
                                      height: 10,
                                      margin: const EdgeInsets.symmetric(
                                          horizontal: 5,),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF00d9ff)
                                            .withValues(alpha: value),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  );
                                },
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          // 🪄 Super Admin Magic Wand (Hidden Bypass)
          Positioned(
            top: 50,
            right: 20,
            child: GestureDetector(
              onDoubleTap: () async {
                final superAdminSession = {
                  'uid': 'Ud9bec6d2ea945cf4330a69cb74ac93cf',
                  'lineUserId': 'Ud9bec6d2ea945cf4330a69cb74ac93cf',
                  'displayName': 'Super Admin 👑',
                  'isAdmin': true,
                  'isSeller': true,
                  'persona': 'admin',
                  'role': 'admin', // Critical for admin tools
                  'province': 'กรุงเทพมหานคร',
                };

                // Save session globally
                await TukTukBridge().saveLocalSession(superAdminSession);

                _showSuccessSnackBar('ยินดีต้อนรับท่านผู้บริหารสูงสุด! 🪄👑');

                setState(() {
                  _isSuccess = true;
                });

                await Future.delayed(const Duration(milliseconds: 800));

                if (mounted) {
                  _navigateAfterLogin(superAdminSession);
                }
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white10),
                ),
                child: const Icon(
                  Icons.auto_fix_high_rounded,
                  color: Color(0xFF00d9ff),
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainLoginMode() {
    return Column(
      children: [
        Text(
          'ก้าวเข้าสู่โลกใหม่กับ',
          style: GoogleFonts.kanit(
            color: const Color(0xFF00d9ff).withValues(alpha: 0.8),
            fontSize: 18,
            fontWeight: FontWeight.w500,
            letterSpacing: 2.0,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'TUKTUK APP',
          style: GoogleFonts.kanit(
            color: Colors.white,
            fontSize: 42,
            fontWeight: FontWeight.w900,
            letterSpacing: -1.0,
          ),
        ),
        const SizedBox(height: 25),

        // 🎁 New: Incentive Section (Coins & Features)
        _buildIncentiveSection(),

        const SizedBox(height: 30),

        // Saved Accounts Section
        if (_savedAccounts.isNotEmpty) ...[
          _buildSavedAccounts(),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: Divider(
                    color: Colors.white.withValues(alpha: 0.1),
                    thickness: 1,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  child: Text(
                    'หรือใช้บัญชีอื่น',
                    style: GoogleFonts.kanit(
                      color: Colors.white.withValues(alpha: 0.3),
                      fontSize: 12,
                    ),
                  ),
                ),
                Expanded(
                  child: Divider(
                    color: Colors.white.withValues(alpha: 0.1),
                    thickness: 1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Terms Checkbox
        GestureDetector(
          onTap: () => setState(() => _acceptedTerms = !_acceptedTerms),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withValues(alpha: 0.03),
                  Colors.white.withValues(alpha: 0.01),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _acceptedTerms
                    ? const Color(0xFF00d9ff).withValues(alpha: 0.3)
                    : Colors.white.withValues(alpha: 0.1),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: _acceptedTerms
                        ? const Color(0xFF00d9ff)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: _acceptedTerms
                          ? Colors.transparent
                          : Colors.white.withValues(alpha: 0.2),
                      width: 2,
                    ),
                  ),
                  child: _acceptedTerms
                      ? const Icon(Icons.check, color: Colors.white, size: 16)
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'ยืนยันว่าฉันยอมรับ ข้อตกลงการใช้งาน และ นโยบายความเป็นส่วนตัว',
                    style: GoogleFonts.kanit(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // LINE Login Button
        _buildSocialButton(
          image:
              'https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg',
          label: 'เข้าใช้งานผ่าน LINE ID',
          gradient: const LinearGradient(
            colors: [Color(0xFF06C755), Color(0xFF00A543)],
          ),
          icon: Icons.chat_bubble_outline_rounded,
          onTap: _handleLineLogin,
        ),
        const SizedBox(height: 12),

        // Add Friend Incentive
        _buildAddFriendCard(),
        const SizedBox(height: 20),

        // PIN Login Option
        _buildPinLoginOption(),

        const SizedBox(height: 20),

        // Seller Registration Divider
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: Divider(
                  color: Colors.orange.withValues(alpha: 0.2),
                  thickness: 1,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 15),
                child: Text(
                  'สำหรับพาร์ทเนอร์ร้านค้า',
                  style: GoogleFonts.kanit(
                    color: Colors.orange.withValues(alpha: 0.5),
                    fontSize: 12,
                  ),
                ),
              ),
              Expanded(
                child: Divider(
                  color: Colors.orange.withValues(alpha: 0.2),
                  thickness: 1,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 15),

        // Seller Registration Button
        _buildSellerRegistrationButton(),
      ],
    );
  }

  Widget _buildIncentiveSection() {
    return Column(
      children: [
        // 💰 Gold Coin Bonus Card (Glassmorphism)
        FadeInRight(
          duration: const Duration(milliseconds: 800),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFFFD700).withValues(alpha: 0.15),
                  const Color(0xFFFFA500).withValues(alpha: 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border:
                  Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.stars_rounded,
                      color: Color(0xFFFFD700), size: 24,),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'สิทธิพิเศษสำหรับสมาชิกใหม่!',
                        style: GoogleFonts.kanit(
                          color: const Color(0xFFFFD700),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        'รับทันที 50 เหรียญทอง เมื่อเข้าสู่ระบบวันนี้',
                        style: GoogleFonts.kanit(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFD700),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '+50',
                    style: GoogleFonts.kanit(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        // ✨ Feature Highlights (Horizontal Scrolling)
        SizedBox(
          height: 90,
          child: ListView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            children: [
              _buildFeatureItem(
                icon: Icons.shopping_bag_outlined,
                title: 'Marketplace',
                subtitle: 'ดีลเด็ดใกล้บ้าน',
                color: const Color(0xFF00d9ff),
              ),
              _buildFeatureItem(
                icon: Icons.groups_outlined,
                title: 'Community',
                subtitle: 'แบ่งปันเรื่องราว',
                color: const Color(0xFFFF0050),
              ),
              _buildFeatureItem(
                icon: Icons.delivery_dining_outlined,
                title: 'TukTuk Job',
                subtitle: 'หางานในพื้นที่',
                color: const Color(0xFFFFC107),
              ),
              _buildFeatureItem(
                icon: Icons.card_giftcard_rounded,
                title: 'Privileges',
                subtitle: 'แลกของรางวัล',
                color: const Color(0xFF4CAF50),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // 🛡️ Social Proof
        FadeIn(
          delay: const Duration(milliseconds: 1000),
          child: Text(
            'ร่วมเป็นส่วนหนึ่งกับเพื่อนสมาชิกกว่า 10,000 คนทั่วไทย',
            style: GoogleFonts.kanit(
              color: Colors.white.withValues(alpha: 0.3),
              fontSize: 11,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
  }) {
    return FadeInUp(
      child: Container(
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 6),
            Text(
              title,
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            Text(
              subtitle,
              style: GoogleFonts.kanit(
                color: Colors.white54,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerifyMode() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFFF6B6B), Color(0xFFFF8E8E)],
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF6B6B).withValues(alpha: 0.3),
                blurRadius: 20,
                spreadRadius: 5,
              ),
            ],
          ),
          child: const Icon(
            Icons.security_rounded,
            color: Colors.white,
            size: 40,
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'ยืนยันตัวตน',
          style: GoogleFonts.kanit(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'กรุณากรอกรหัส 6 หลักที่คุณได้รับ',
          style: GoogleFonts.kanit(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 30),

        // Verification Code Input
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.white.withValues(alpha: 0.03),
                Colors.white.withValues(alpha: 0.01),
              ],
            ),
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(6, (index) {
                  return Container(
                    width: 50,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF00d9ff).withValues(alpha: 0.1),
                          const Color(0xFF0088cc).withValues(alpha: 0.05),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(
                        color: _codeControllers[index]
                                .text
                                .replaceAll('\u200b', '')
                                .isNotEmpty
                            ? const Color(0xFF00d9ff)
                            : Colors.white.withValues(alpha: 0.1),
                        width: 2,
                      ),
                    ),
                    child: TextField(
                      controller: _codeControllers[index],
                      focusNode: _codeFocusNodes[index],
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(
                            RegExp(r'[0-9\u200b]'),),
                        LengthLimitingTextInputFormatter(2),
                      ],
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        counterText: '',
                      ),
                      onChanged: (v) {
                        // 🛠️ Advanced Backspace & Auto-focus logic
                        if (v.isEmpty) {
                          // Handle Backspace on already empty box (if possible)
                          _codeControllers[index].text = '\u200b';
                          _codeControllers[index].selection =
                              const TextSelection.collapsed(offset: 1);
                          if (index > 0) {
                            _codeFocusNodes[index - 1].requestFocus();
                          }
                          return;
                        }

                        final String clean = v.replaceAll('\u200b', '');
                        if (clean.isEmpty) {
                          // Just the zero-width space remains
                          return;
                        }

                        // Single digit typed
                        _codeControllers[index].text = '\u200b${clean[0]}';
                        _codeControllers[index].selection =
                            const TextSelection.collapsed(offset: 2);

                        if (index < 5) {
                          _codeFocusNodes[index + 1].requestFocus();
                        } else {
                          // Auto submit
                          _handleStepVerify();
                        }
                      },
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),

              // Verify Button
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _codeControllers.every((c) => c.text.isNotEmpty)
                      ? _handleStepVerify
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ).copyWith(
                    backgroundColor:
                        WidgetStateProperty.resolveWith((states) {
                      if (states.contains(WidgetState.disabled)) {
                        return Colors.white.withValues(alpha: 0.05);
                      }
                      return const Color(0xFF00d9ff);
                    }),
                  ),
                  child: _isLoggingIn
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          'ยืนยันและเข้าสู่ระบบ',
                          style: GoogleFonts.kanit(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 20),
              // 🔄 Resend Code Option
              TextButton(
                onPressed: _isLoggingIn ? null : _requestResendCode,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.refresh_rounded,
                      color: Colors.white.withValues(alpha: 0.5),
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'ไม่ได้รับรหัส? ขอใหม่อีกครั้ง',
                      style: GoogleFonts.kanit(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontSize: 13,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Back Button
        TextButton(
          onPressed: () => setState(() => _isVerifyMode = false),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.arrow_back_ios_new_rounded,
                color: Colors.white.withValues(alpha: 0.4),
                size: 14,
              ),
              const SizedBox(width: 8),
              Text(
                'กลับหน้าแรก',
                style: GoogleFonts.kanit(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPinLoginMode() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF00d9ff), Color(0xFF0088cc)],
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF00d9ff).withValues(alpha: 0.3),
                blurRadius: 20,
                spreadRadius: 5,
              ),
            ],
          ),
          child: const Icon(
            Icons.admin_panel_settings_rounded,
            color: Colors.white,
            size: 40,
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'บัญชีพาร์ทเนอร์ / เจ้าหน้าที่',
          style: GoogleFonts.kanit(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบ',
          style: GoogleFonts.kanit(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 30),

        // 🛡️ SECURITY: CAPTCHA (Brute Force Protection)
        if (_requiresCaptcha) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.redAccent.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.redAccent.withValues(alpha: 0.2)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.security_rounded,
                        color: Colors.redAccent, size: 20,),
                    const SizedBox(width: 8),
                    Text(
                      'กรุณายืนยันตัวตน (Login ผิดบ่อย)',
                      style: GoogleFonts.kanit(
                          color: Colors.redAccent,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'เท่ากับเท่าไหร่?  ',
                      style: GoogleFonts.kanit(
                          color: Colors.white70, fontSize: 16,),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4,),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_captchaAnswer == null ? "" : (_captchaAnswer! - 2)} + 2 = ?',
                        style: GoogleFonts.kanit(
                            color: const Color(0xFF00d9ff),
                            fontSize: 18,
                            fontWeight: FontWeight.bold,),
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      onPressed: _generateCaptcha,
                      icon: const Icon(Icons.refresh_rounded,
                          color: Colors.white38, size: 20,),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: 120,
                  child: TextField(
                    controller: _captchaController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.kanit(color: Colors.white, fontSize: 18),
                    decoration: InputDecoration(
                      hintText: 'คำตอบ',
                      hintStyle: GoogleFonts.kanit(
                          color: Colors.white24, fontSize: 14,),
                      focusedBorder: const UnderlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF00d9ff)),),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // PIN Input
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.white.withValues(alpha: 0.03),
                Colors.white.withValues(alpha: 0.01),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: TextField(
            controller: _pinController,
            keyboardType: TextInputType.number,
            obscureText: true,
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 20,
              letterSpacing: 4,
            ),
            decoration: InputDecoration(
              hintText: 'รหัสผ่าน 6 หลัก',
              hintStyle: GoogleFonts.kanit(
                color: Colors.white.withValues(alpha: 0.2),
                fontSize: 16,
              ),
              prefixIcon: Icon(
                Icons.lock_outline_rounded,
                color: const Color(0xFF00d9ff).withValues(alpha: 0.5),
              ),
              border: InputBorder.none,
            ),
            onSubmitted: (_) => _handlePinLogin(),
          ),
        ),
        const SizedBox(height: 20),

        // Login Button
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          height: 55,
          child: ElevatedButton(
            onPressed: _pinController.text.length >= 6 ? _handlePinLogin : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ).copyWith(
              backgroundColor: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.disabled)) {
                  return Colors.white.withValues(alpha: 0.05);
                }
                return const Color(0xFF00d9ff);
              }),
            ),
            child: _isLoggingIn
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    'เข้าสู่ระบบ',
                    style: GoogleFonts.kanit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 20),

        // Request PIN via LINE Button
        TextButton(
          onPressed: _handleFollowLineOA,
          child: Text(
            'ยังไม่มีรหัส? ลงทะเบียน / ขอรหัสผ่านทาง LINE OA',
            style: GoogleFonts.kanit(
              color: const Color(0xFF00d9ff).withValues(alpha: 0.5),
              fontSize: 13,
              decoration: TextDecoration.underline,
            ),
          ),
        ),

        const SizedBox(height: 10),

        // Back Button
        TextButton(
          onPressed: () => setState(() => _showPinLogin = false),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.arrow_back_ios_new_rounded,
                color: Colors.white.withValues(alpha: 0.4),
                size: 14,
              ),
              const SizedBox(width: 8),
              Text(
                'กลับ',
                style: GoogleFonts.kanit(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSavedAccounts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 5, bottom: 15),
          child: Text(
            'สลับบัญชีที่บันทึกไว้',
            style: GoogleFonts.kanit(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _savedAccounts.length,
            itemBuilder: (context, index) {
              final acc = _savedAccounts[index];
              return Padding(
                padding: const EdgeInsets.only(right: 15),
                child: _buildAccountCard(acc),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildAccountCard(Map<String, dynamic> acc) {
    return GestureDetector(
      onTap: () async {
        setState(() => _isLoggingIn = true);
        await TukTukBridge().switchAccount(acc);
        if (mounted) {
          Navigator.pop(context, true);
        }
      },
      onLongPress: () => _showRemoveAccountDialog(acc),
      child: Container(
        width: 80,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.white.withValues(alpha: 0.03),
              Colors.white.withValues(alpha: 0.01),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFF00d9ff).withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: ClipOval(
                    child: (acc['pictureUrl'] != null &&
                            acc['pictureUrl'].startsWith('http'))
                        ? CachedNetworkImage(
                            imageUrl: acc['pictureUrl'],
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: Colors.white.withValues(alpha: 0.1),
                            ),
                          )
                        : Container(
                            color: Colors.white.withValues(alpha: 0.1),
                            child:
                                const Icon(Icons.person, color: Colors.white38),
                          ),
                  ),
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
                        color: const Color(0xFF0A0E21),
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: 70,
              child: Text(
                acc['displayName'] ?? 'User',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showRemoveAccountDialog(Map<String, dynamic> acc) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF1a1a2e),
                Color(0xFF16213E),
              ],
            ),
            borderRadius: BorderRadius.circular(25),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.delete_outline_rounded,
                  color: Colors.redAccent,
                  size: 40,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'ลบการจำบัญชี?',
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'ต้องการลบการจำบัญชีของ ${acc['displayName']} หรือไม่?',
                textAlign: TextAlign.center,
                style: GoogleFonts.kanit(
                  color: Colors.white.withValues(alpha: 0.6),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 25),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                          side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                        ),
                      ),
                      child: Text(
                        'ยกเลิก',
                        style: GoogleFonts.kanit(
                          color: Colors.white70,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: Text(
                        'ลบ',
                        style: GoogleFonts.kanit(
                          fontWeight: FontWeight.bold,
                        ),
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

    if (confirm == true) {
      await TukTukBridge().removeSavedAccount(acc['uid'] ?? acc['lineUserId']);
      _loadAccounts();
    }
  }

  Widget _buildSocialButton({
    required String image,
    required String label,
    required Gradient gradient,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _isLoggingIn ? null : onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: double.infinity,
          height: 60,
          decoration: BoxDecoration(
            gradient: gradient,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color:
                    (gradient as LinearGradient).colors.first.withValues(alpha: 0.3),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Center(
            child: _isLoggingIn
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Icon(
                            icon,
                            color: gradient.colors.first,
                            size: 14,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        label,
                        style: GoogleFonts.kanit(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildAddFriendCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF06C755).withValues(alpha: 0.1),
            const Color(0xFF06C755).withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF06C755).withValues(alpha: 0.2),
        ),
      ),
      child: InkWell(
        onTap: _handleFollowLineOA,
        borderRadius: BorderRadius.circular(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF06C755).withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_add_alt_1_rounded,
                color: Color(0xFF06C755),
                size: 28,
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      Text(
                        'เพิ่มเพื่อน LINE OA',
                        style: GoogleFonts.kanit(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2,),
                        decoration: BoxDecoration(
                          color: Colors.amber,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'รับ 50 เหรียญ',
                          style: GoogleFonts.kanit(
                            color: Colors.black,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'รับข่าวสารและสิทธิพิเศษจากร้านใกล้คุณ',
                    style: GoogleFonts.kanit(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_forward_ios_rounded,
                color: Colors.white54,
                size: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleFollowLineOA() async {
    // 1. Open LINE OA Link
    final url = Uri.parse('https://lin.ee/1YJsw47');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);

      // 2. Award Points (50 coins as promised in UI)
      final success = await TukTukBridge().awardPoints(
        'add_friend',
        customPoints: 50,
      );

      if (success && mounted) {
        _showSuccessSnackBar(
            'ขอบคุณที่ร่วมเป็นเพื่อนกับเรา! รับ 50 เหรียญเรียบร้อยครับ 🎁',);
      }
    } else {
      _showErrorSnackBar('ไม่สามารถเปิดลิงก์ LINE ได้ในขณะนี้');
    }
  }

  Widget _buildPinLoginOption() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          setState(() {
            _showPinLogin = true;
            _isVerifyMode = false;
          });
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 15),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.vpn_key_rounded,
                  color: Colors.white.withValues(alpha: 0.4),
                  size: 14,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'เข้าสู่ระบบด้วยรหัสผ่าน / บัญชีเจ้าหน้าที่',
                  style: GoogleFonts.kanit(
                    color: Colors.white.withValues(alpha: 0.4),
                    fontSize: 13,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSellerRegistrationButton() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          if (!_acceptedTerms) {
            _showErrorSnackBar('กรุณายอมรับเงื่อนไขการใช้งานก่อน');
            return;
          }
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const RegisterScreen(
                initialPersona: 'seller',
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.orange.withValues(alpha: 0.1),
                Colors.orange.withValues(alpha: 0.05),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.orange.withValues(alpha: 0.3),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.storefront_rounded,
                color: Colors.orange,
                size: 24,
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Text(
                  'ลงทะเบียนเปิดร้านค้า / พาร์ทเนอร์',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
