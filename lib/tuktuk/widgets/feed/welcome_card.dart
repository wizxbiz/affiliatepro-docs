import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'gradient_mesh_painter.dart';

class WelcomeCard extends StatefulWidget {
  final VoidCallback onFinished;
  final VoidCallback? onCreateTap;

  const WelcomeCard({
    super.key,
    required this.onFinished,
    this.onCreateTap,
  });

  @override
  State<WelcomeCard> createState() => _WelcomeCardState();
}

class _WelcomeCardState extends State<WelcomeCard>
    with TickerProviderStateMixin {
  late AnimationController _rotateController;
  late AnimationController _floatController;
  late AnimationController _driveController;
  late AnimationController _particleController;
  late AnimationController _pulseController;
  bool _isDriving = false;

  // User data
  String? _userName;
  String? _userAvatar;
  bool _isLoggedIn = false;

  // Platform stats
  int _totalVideos = 1247;
  int _totalCreators = 892;
  int _todayViews = 45800;

  @override
  void initState() {
    super.initState();
    _initializeControllers();
    _loadUserData();
    _loadPlatformStats();
  }

  void _initializeControllers() {
    _rotateController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();

    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _particleController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _driveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    // Auto-transition after delay
    Future.delayed(const Duration(seconds: 6), () {
      if (mounted && !_isDriving) {
        _triggerDriveOff();
      }
    });
  }

  Future<void> _loadUserData() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final userDoc = await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .get()
            .timeout(const Duration(seconds: 5));

        if (mounted && userDoc.exists) {
          final data = userDoc.data();
          setState(() {
            _isLoggedIn = true;
            _userName = data?['displayName'] ?? data?['name'] ?? 'TukTuker';
            _userAvatar = data?['pictureUrl'] ?? data?['photoURL'];
          });
        }
      }
    } catch (e) {
      debugPrint('Error loading user: $e');
    }
  }

  Future<void> _loadPlatformStats() async {
    try {
      final statsDoc = await FirebaseFirestore.instance
          .collection('app_stats')
          .doc('tuktuk')
          .get()
          .timeout(const Duration(seconds: 5));

      if (mounted && statsDoc.exists) {
        final data = statsDoc.data();
        setState(() {
          _totalVideos = data?['totalVideos'] ?? _totalVideos;
          _totalCreators = data?['totalCreators'] ?? _totalCreators;
          _todayViews = data?['todayViews'] ?? _todayViews;
        });
      }
    } catch (e) {
      // Use default values
    }
  }

  void _triggerDriveOff() {
    if (_isDriving) return;
    setState(() => _isDriving = true);
    _driveController.forward().then((value) {
      widget.onFinished();
    });
  }

  @override
  void dispose() {
    _rotateController.dispose();
    _floatController.dispose();
    _driveController.dispose();
    _particleController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final topPadding = MediaQuery.of(context).padding.top;

    return GestureDetector(
      onVerticalDragEnd: (details) {
        if (details.primaryVelocity! < 0) {
          _triggerDriveOff();
        }
      },
      onTap: _triggerDriveOff,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF0D0D0D),
              Color(0xFF1A1A2E),
              Color(0xFF0D0D0D),
            ],
          ),
        ),
        child: Stack(
          children: [
            // 1. Animated Particles Background
            ...List.generate(20, (index) => _buildParticle(index, screenSize)),

            // 2. Gradient Mesh Background
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _rotateController,
                builder: (context, child) {
                  return CustomPaint(
                    painter: GradientMeshPainter(
                      animation: _rotateController.value,
                    ),
                  );
                },
              ),
            ),

            // 3. Main Content
            SafeArea(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final bool isCompact = constraints.maxHeight < 650;

                  return SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: constraints.maxHeight,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildUserGreeting(topPadding),
                          SizedBox(height: isCompact ? 10 : 20),
                          _buildCentralLogo(screenSize, isCompact: isCompact),
                          SizedBox(height: isCompact ? 15 : 25),
                          _buildBrandText(isCompact: isCompact),
                          SizedBox(height: isCompact ? 15 : 25),
                          if (!isCompact) _buildPlatformStats(),
                          SizedBox(height: isCompact ? 10 : 15),
                          _buildQuickActions(),
                          SizedBox(height: isCompact ? 15 : 25),
                          _buildScrollHint(),
                          SizedBox(height: isCompact ? 10 : 15),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParticle(int index, Size screenSize) {
    final random = index * 0.17;
    final size = 3.0 + (index % 5) * 2.0;

    return AnimatedBuilder(
      animation: _particleController,
      builder: (context, child) {
        final progress = (_particleController.value + random) % 1.0;
        final x = (random * screenSize.width * 3) % screenSize.width;
        final y = screenSize.height * (1 - progress);
        final opacity = (0.3 + (progress * 0.5)).clamp(0.0, 0.7);

        return Positioned(
          left: x,
          top: y,
          child: Opacity(
            opacity: opacity,
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: index % 3 == 0
                        ? Colors.orange.withValues(alpha: 0.8)
                        : index % 3 == 1
                            ? Colors.amber.withValues(alpha: 0.8)
                            : Colors.white.withValues(alpha: 0.6),
                    blurRadius: size * 2,
                    spreadRadius: 1,
                  ),
                ],
                color: index % 3 == 0
                    ? Colors.orange
                    : index % 3 == 1
                        ? Colors.amber
                        : Colors.white,
              ),
            ),
          ),
        );
      },
    );
  }

  // Add the missing helper methods from TukTukFeedScreen...
  // I need to copy those too.

  Widget _buildUserGreeting(double topPadding) {
    return AnimatedBuilder(
      animation: _driveController,
      builder: (context, child) {
        final slide = -50 * _driveController.value;
        final opacity = 1.0 - _driveController.value;
        return Opacity(
          opacity: opacity,
          child: Transform.translate(
            offset: Offset(0, slide),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white24, width: 2),
                      image: _userAvatar != null
                          ? DecorationImage(
                              image: NetworkImage(_userAvatar!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _userAvatar == null
                        ? const Icon(Icons.person, color: Colors.white70)
                        : null,
                  ),
                  const SizedBox(width: 15),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isLoggedIn ? 'สวัสดีคุณ,' : 'ยินดีต้อนรับสู่,',
                        style: const TextStyle(
                          color: Colors.white60,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        _isLoggedIn
                            ? (_userName ?? 'TukTuker')
                            : 'TukTuk Family',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.help_outline, color: Colors.white60),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCentralLogo(Size screenSize, {bool isCompact = false}) {
    final double logoSize = isCompact ? 160 : 220;
    return AnimatedBuilder(
      animation: _driveController,
      builder: (context, child) {
        // Curve the drive-away
        final driveProgress =
            Curves.easeInOutBack.transform(_driveController.value);
        final driveY = -screenSize.height * driveProgress;
        final driveScale = 1.0 + (driveProgress * 2);
        final driveRotate = driveProgress * 0.2;

        return Transform.translate(
          offset: Offset(0, driveY),
          child: Transform.rotate(
            angle: driveRotate,
            child: Transform.scale(
              scale: driveScale,
              child: Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Glow effect
                    AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        return Container(
                          width:
                              logoSize * (1.1 + 0.1 * _pulseController.value),
                          height:
                              logoSize * (1.1 + 0.1 * _pulseController.value),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF6B35).withValues(
                                    alpha: 0.3 * (1 - _pulseController.value)),
                                blurRadius: 40,
                                spreadRadius: 10,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    // TukTuk Logo Asset
                    AnimatedBuilder(
                      animation: _floatController,
                      builder: (context, child) {
                        return Transform.translate(
                          offset: Offset(0, 10 * _floatController.value),
                          child: Container(
                            width: logoSize,
                            height: logoSize,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFF1E1E2E), Color(0xFF111116)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.1),
                                width: 2,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: Colors.black54,
                                  blurRadius: 30,
                                  offset: Offset(0, 15),
                                ),
                              ],
                            ),
                            child: Image.asset(
                              'assets/images/tuktuk.png',
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.directions_transit,
                                      color: Color(0xFFFF6B35), size: 100),
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBrandText({bool isCompact = false}) {
    return AnimatedBuilder(
      animation: _driveController,
      builder: (context, child) {
        final opacity = 1.0 - _driveController.value;
        return Opacity(
          opacity: opacity,
          child: Column(
            children: [
              Text(
                'TUKTUK',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: isCompact ? 36 : 48,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 10,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white10),
                ),
                child: const Text(
                  '🎬 วิดีโอ  •  🛒 มาร์เก็ตเพลส  •  🤝 คอมมิวนิตี้',
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPlatformStats() {
    return AnimatedBuilder(
      animation: _driveController,
      builder: (context, child) {
        final opacity = 1.0 - _driveController.value;
        return Opacity(
          opacity: opacity,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 30),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatItem(
                  icon: Icons.play_circle_filled,
                  value: _formatNumber(_totalVideos),
                  label: 'วิดีโอ',
                  color: Colors.redAccent,
                ),
                _buildStatDivider(),
                _buildStatItem(
                  icon: Icons.people_alt,
                  value: _formatNumber(_totalCreators),
                  label: 'ครีเอเตอร์',
                  color: Colors.blueAccent,
                ),
                _buildStatDivider(),
                _buildStatItem(
                  icon: Icons.visibility,
                  value: _formatNumber(_todayViews),
                  label: 'ยอดชมวันนี้',
                  color: Colors.greenAccent,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(
      width: 1,
      height: 40,
      color: Colors.white12,
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  Widget _buildQuickActions() {
    return AnimatedBuilder(
      animation: _driveController,
      builder: (context, child) {
        final opacity = 1.0 - _driveController.value;
        return Opacity(
          opacity: opacity,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 30),
            child: Row(
              children: [
                Expanded(
                  child: _buildActionButton(
                    icon: Icons.explore,
                    label: 'สำรวจ',
                    gradient: const [Color(0xFFFF6B35), Color(0xFFFFA726)],
                    onTap: _triggerDriveOff,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildActionButton(
                    icon: Icons.add_circle_outline,
                    label: 'สร้าง',
                    gradient: const [Color(0xFF00D9FF), Color(0xFF00F2EA)],
                    onTap: widget.onCreateTap ?? _triggerDriveOff,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: gradient[0].withValues(alpha: 0.4),
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScrollHint() {
    return AnimatedBuilder(
      animation: _driveController,
      builder: (context, child) {
        final opacity = 1.0 - _driveController.value;
        return Opacity(
          opacity: opacity,
          child: Column(
            children: [
              AnimatedBuilder(
                animation: _floatController,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, -5 * _floatController.value),
                    child: Icon(
                      Icons.keyboard_arrow_up,
                      color: Colors.white.withValues(alpha: 0.6),
                      size: 32,
                    ),
                  );
                },
              ),
              const SizedBox(height: 5),
              Text(
                'เลื่อนขึ้นหรือแตะเพื่อเริ่มต้น',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 11,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
