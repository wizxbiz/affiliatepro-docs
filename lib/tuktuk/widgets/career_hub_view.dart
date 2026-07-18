import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/screens/community_hub_screen.dart';
import 'package:caculateapp/tuktuk/screens/creator_studio_screen.dart';
import 'package:caculateapp/tuktuk/screens/win_rider_service_screen.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Live stats model — holds real-time data fetched from Firestore
// ─────────────────────────────────────────────────────────────────────────────
class _LiveStats {
  final String memberText;
  final int badgeCount; // notification dot (e.g. pending jobs)
  const _LiveStats({required this.memberText, this.badgeCount = 0});
}

// ─────────────────────────────────────────────────────────────────────────────
// CareerHubView  ← Embeddable (no Scaffold) grid shown in Tab 2
//
//  Features:
//   1. Live Stats  — real counts pulled from Firestore (replaces hardcoded)
//   2. Badge       — red dot on WIN RIDER showing pending-job count
//   3. Personalized — "ล่าสุด" highlight on last-visited card (SharedPrefs)
// ─────────────────────────────────────────────────────────────────────────────
class CareerHubView extends StatefulWidget {
  const CareerHubView({super.key});

  @override
  State<CareerHubView> createState() => _CareerHubViewState();
}

class _CareerHubViewState extends State<CareerHubView> {
  // ── Static career definitions (visual config only) ─────────────────────────
  static const List<_Career> _careers = [
    _Career(
      id: 'win_rider',
      emoji: '🏍️',
      title: 'WIN RIDER',
      subtitle: 'รับส่งพัสดุ 24/7',
      tag: 'HOT',
      colors: [Color(0xFF6C3FFF), Color(0xFF00D2FF)],
      fallbackMembers: '— วินออนไลน์',
    ),
    _Career(
      id: 'creator',
      emoji: '📹',
      title: 'Creator',
      subtitle: 'สร้างคอนเทนต์',
      tag: 'NEW',
      colors: [Color(0xFFFF0050), Color(0xFFFF6B35)],
      fallbackMembers: '— คอนเทนต์',
    ),
    _Career(
      id: 'community',
      emoji: '🏘️',
      title: 'ชุมชน',
      subtitle: 'กลุ่มอาชีพคนไทย',
      tag: null,
      colors: [Color(0xFF10B981), Color(0xFF059669)],
      fallbackMembers: '— โพสต์',
    ),
    _Career(
      id: 'pro_service',
      emoji: '🔧',
      title: 'ช่าง & บริการ',
      subtitle: 'หาลูกค้าในพื้นที่',
      tag: null,
      colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
      fallbackMembers: '— ช่าง',
    ),
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  Map<String, _LiveStats> _liveStats = {};
  String? _lastVisitedId;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _loadLastVisited();
    _fetchAllStats();
  }

  // ── Feature 3: Personalized — load / save last visited ────────────────────
  Future<void> _loadLastVisited() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() => _lastVisitedId = prefs.getString('career_hub_last'));
    }
  }

  Future<void> _saveLastVisited(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('career_hub_last', id);
  }

  // ── Feature 1 + 2: Live Stats + Badge ─────────────────────────────────────
  Future<void> _fetchAllStats() async {
    try {
      final results = await Future.wait([
        _fetchWinRiderStats(),
        _fetchCreatorStats(),
        _fetchCommunityStats(),
        _fetchProServiceStats(),
      ]);
      if (mounted) {
        setState(() {
          _liveStats = {
            'win_rider': results[0],
            'creator': results[1],
            'community': results[2],
            'pro_service': results[3],
          };
        });
      }
    } catch (_) {
      // silently fall back to hardcoded members text
    }
  }

  Future<_LiveStats> _fetchWinRiderStats() async {
    final fs = FirebaseFirestore.instance;
    final onlineSnap = await fs
        .collection('win_riders')
        .where('isOnline', isEqualTo: true)
        .count()
        .get()
        .timeout(const Duration(seconds: 6));
    final pendingSnap = await fs
        .collection('win_rider_requests')
        .where('status', isEqualTo: 'pending')
        .count()
        .get()
        .timeout(const Duration(seconds: 6));
    final online = onlineSnap.count ?? 0;
    final pending = pendingSnap.count ?? 0;
    return _LiveStats(
      memberText: '$online วินออนไลน์',
      badgeCount: pending,
    );
  }

  Future<_LiveStats> _fetchCreatorStats() async {
    final snap = await FirebaseFirestore.instance
        .collection('tuktuk_posts')
        .count()
        .get()
        .timeout(const Duration(seconds: 6));
    final count = snap.count ?? 0;
    return _LiveStats(memberText: _formatCount(count, 'คอนเทนต์'));
  }

  Future<_LiveStats> _fetchCommunityStats() async {
    final snap = await FirebaseFirestore.instance
        .collection('posts')
        .count()
        .get()
        .timeout(const Duration(seconds: 6));
    final count = snap.count ?? 0;
    return _LiveStats(memberText: _formatCount(count, 'โพสต์'));
  }

  Future<_LiveStats> _fetchProServiceStats() async {
    final snap = await FirebaseFirestore.instance
        .collection('posts')
        .where('category', isEqualTo: 'eco_pros')
        .count()
        .get()
        .timeout(const Duration(seconds: 6));
    final count = snap.count ?? 0;
    return _LiveStats(memberText: _formatCount(count, 'ช่าง'));
  }

  String _formatCount(int count, String unit) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}k $unit';
    }
    return '$count $unit';
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(child: _buildHeader(context)),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              childAspectRatio: 0.82,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) {
                final career = _careers[i];
                return FadeInUp(
                  delay: Duration(milliseconds: 80 * i),
                  duration: const Duration(milliseconds: 380),
                  child: _CareerCard(
                    career: career,
                    liveStats: _liveStats[career.id],
                    isLastVisited: _lastVisitedId == career.id,
                    onVisited: (id) {
                      setState(() => _lastVisitedId = id);
                      _saveLastVisited(id);
                    },
                  ),
                );
              },
              childCount: _careers.length,
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 120)),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, topPad + 76, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: Colors.orangeAccent.withValues(alpha: 0.12),
              border: Border.all(
                color: Colors.orangeAccent.withValues(alpha: 0.4),
              ),
            ),
            child: Text(
              '🚀 TukTuk Career Hub',
              style: GoogleFonts.outfit(
                color: Colors.orangeAccent,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'สร้างอาชีพ\n& บริการ',
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w800,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'เลือกหมวดหมู่และเริ่มสร้างรายได้วันนี้',
            style: TextStyle(color: Colors.white38, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Static career config
// ─────────────────────────────────────────────────────────────────────────────
class _Career {
  final String id;
  final String emoji;
  final String title;
  final String subtitle;
  final String? tag;
  final List<Color> colors;
  final String fallbackMembers;

  const _Career({
    required this.id,
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.tag,
    required this.colors,
    required this.fallbackMembers,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Career card
// ─────────────────────────────────────────────────────────────────────────────
class _CareerCard extends StatefulWidget {
  final _Career career;
  final _LiveStats? liveStats;
  final bool isLastVisited;
  final void Function(String id) onVisited;

  const _CareerCard({
    required this.career,
    required this.liveStats,
    required this.isLastVisited,
    required this.onVisited,
  });

  @override
  State<_CareerCard> createState() => _CareerCardState();
}

class _CareerCardState extends State<_CareerCard>
    with SingleTickerProviderStateMixin {
  bool _pressed = false;
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _maybeStartPulse();
  }

  @override
  void didUpdateWidget(_CareerCard old) {
    super.didUpdateWidget(old);
    _maybeStartPulse();
  }

  void _maybeStartPulse() {
    final hasBadge = (widget.liveStats?.badgeCount ?? 0) > 0;
    if (hasBadge && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (!hasBadge && _pulseController.isAnimating) {
      _pulseController.stop();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.career;
    final stats = widget.liveStats;
    final hasBadge = (stats?.badgeCount ?? 0) > 0;
    final memberText = stats?.memberText ?? c.fallbackMembers;

    // "ล่าสุด" overrides tag only when card has no tag (community / pro_service)
    final showLastVisitedTag = widget.isLastVisited && c.tag == null;

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        HapticFeedback.lightImpact();
        widget.onVisited(c.id);
        _navigate(context);
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.93 : 1.0,
        duration: const Duration(milliseconds: 130),
        child: _buildCardContainer(
          c: c,
          hasBadge: hasBadge,
          memberText: memberText,
          showLastVisitedTag: showLastVisitedTag,
          stats: stats,
        ),
      ),
    );
  }

  Widget _buildCardContainer({
    required _Career c,
    required bool hasBadge,
    required String memberText,
    required bool showLastVisitedTag,
    required _LiveStats? stats,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: LinearGradient(
          colors: c.colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        // Glowing ring for last-visited
        border: widget.isLastVisited
            ? Border.all(
                color: Colors.white.withValues(alpha: 0.55),
                width: 2,
              )
            : null,
        boxShadow: [
          BoxShadow(
            color: c.colors[0].withValues(
              alpha: widget.isLastVisited ? 0.55 : 0.38,
            ),
            blurRadius: widget.isLastVisited ? 26 : 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // ── Ghost background emoji ────────────────────────────────────
          Positioned(
            right: -10,
            bottom: -14,
            child: Text(
              c.emoji,
              style: TextStyle(
                fontSize: 72,
                color: Colors.white.withValues(alpha: 0.09),
              ),
            ),
          ),

          // ── Card content ─────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tag row (HOT / NEW / ล่าสุด / spacer)
                _buildTagRow(c, showLastVisitedTag),

                // Big emoji
                Text(c.emoji, style: const TextStyle(fontSize: 36)),

                const Spacer(),

                // Title + subtitle
                Text(
                  c.title,
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  c.subtitle,
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
                const SizedBox(height: 8),

                // Members row (live count + arrow)
                _buildMembersRow(memberText),
              ],
            ),
          ),

          // ── Feature 2: Notification badge (top-right) ─────────────────
          if (hasBadge)
            Positioned(
              top: 10,
              right: 10,
              child: ScaleTransition(
                scale: _pulseAnim,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF3B30),
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF3B30).withValues(alpha: 0.5),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: Text(
                    '${stats!.badgeCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTagRow(_Career c, bool showLastVisitedTag) {
    // Determine what tag to show
    final String? tagText = showLastVisitedTag ? 'ล่าสุด' : c.tag;
    // Also show "ล่าสุด" next to HOT/NEW if card has a tag
    final bool appendLastVisited = widget.isLastVisited && c.tag != null;

    if (tagText == null && !appendLastVisited) {
      return const SizedBox(height: 22);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (tagText != null)
              _TagBadge(
                label: tagText,
                highlighted: tagText == 'ล่าสุด',
              ),
            if (appendLastVisited) ...[
              const SizedBox(width: 4),
              const _TagBadge(label: 'ล่าสุด', highlighted: true),
            ],
          ],
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildMembersRow(String memberText) {
    return Row(
      children: [
        const Icon(Icons.people_rounded, color: Colors.white54, size: 11),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            memberText,
            style: const TextStyle(color: Colors.white54, fontSize: 10),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.2),
          ),
          child: const Icon(
            Icons.arrow_forward_rounded,
            color: Colors.white,
            size: 12,
          ),
        ),
      ],
    );
  }

  void _navigate(BuildContext context) {
    switch (widget.career.id) {
      case 'win_rider':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const WinRiderServiceScreen(),
          ),
        );
      case 'creator':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const CreatorStudioScreen(),
          ),
        );
      case 'community':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const CommunityHubScreen(),
          ),
        );
      case 'pro_service':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                const CommunityHubScreen(initialFilter: 'eco_pros'),
          ),
        );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable tag badge
// ─────────────────────────────────────────────────────────────────────────────
class _TagBadge extends StatelessWidget {
  final String label;
  final bool highlighted;

  const _TagBadge({required this.label, this.highlighted = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: highlighted
            ? Colors.white.withValues(alpha: 0.35)
            : Colors.white.withValues(alpha: 0.22),
        border: highlighted
            ? Border.all(color: Colors.white.withValues(alpha: 0.6))
            : null,
      ),
      child: Text(
        label,
        style: GoogleFonts.outfit(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
