import 'package:animate_do/animate_do.dart';
import 'package:caculateapp/tuktuk/screens/leaderboard_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MissionCenterScreen extends StatefulWidget {
  const MissionCenterScreen({super.key});

  @override
  State<MissionCenterScreen> createState() => _MissionCenterScreenState();
}

class _MissionCenterScreenState extends State<MissionCenterScreen> {
  int _coins = 0;
  final List<Map<String, dynamic>> _missions = [
    {
      'id': 'daily_login',
      'title': 'เช็คอินรายวันรับทรัพย์',
      'subtitle': 'เข้าใช้งานแอปทุกวัน รับเหรียญขวัญถุง',
      'reward': 10,
      'icon': Icons.calendar_today_rounded,
      'color': Colors.orange,
      'type': 'daily',
      'completed': false,
    },
    {
      'id': 'video_watch',
      'title': 'สายส่องต้องได้ดี',
      'subtitle': 'ดูวิดีโอครบ 10 นาที (วันนี้)',
      'reward': 20,
      'icon': Icons.play_circle_fill_rounded,
      'color': const Color(0xFFFF0050),
      'type': 'daily',
      'progress': 0.4,
      'completed': false,
    },
    {
      'id': 'post_creation',
      'title': 'นักสร้างคอนเทนต์มือทอง',
      'subtitle': 'ลงวิดีโอหรือรูปภาพตัวตนของคุณ',
      'reward': 50,
      'icon': Icons.add_a_photo_rounded,
      'color': const Color(0xFF00F2EA),
      'type': 'weekly',
      'completed': false,
    },
    {
      'id': 'referral',
      'title': 'ชวนเพื่อนรวยด้วยกัน',
      'subtitle': 'แนะนำแอปให้เพื่อนสมัครสมาชิก',
      'reward': 200,
      'icon': Icons.person_add_rounded,
      'color': Colors.purpleAccent,
      'type': 'legacy',
      'completed': false,
    },
    {
      'id': 'marketplace_review',
      'title': 'นักรีวิวใจดี',
      'subtitle': 'รีวิวสินค้าที่คุณซื้อพร้อมแนบรูป',
      'reward': 30,
      'icon': Icons.rate_review_rounded,
      'color': Colors.amber,
      'type': 'weekly',
      'completed': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchUserData();
  }

  Future<void> _fetchUserData() async {
    final user = await TukTukBridge().getCurrentUser();
    if (user != null) {
      if (mounted) {
        setState(() {
          _coins = user['coins'] ?? 0;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildSliverAppBar(),
          SliverToBoxAdapter(child: _buildCoinHeader()),
          SliverToBoxAdapter(child: _buildCampaignBanner()),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const SizedBox(height: 25),
                _buildSectionHeader('ภารกิจรายวัน', 'รับเหรียญง่ายๆ ทุกวัน'),
                ..._missions
                    .where((m) => m['type'] == 'daily')
                    .map(_buildMissionTile),
                const SizedBox(height: 30),
                _buildSectionHeader('แคมเปญพิเศษ', 'สะสมบารมี มีแต่ได้'),
                ..._missions
                    .where((m) => m['type'] != 'daily')
                    .map(_buildMissionTile),
                const SizedBox(height: 40),
                _buildRedeemSection(),
                const SizedBox(height: 50),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 0,
      pinned: true,
      backgroundColor: const Color(0xFF0A0E21),
      elevation: 0,
      centerTitle: true,
      title: Text(
        'ศูนย์รวมภารกิจ & รางวัล',
        style: GoogleFonts.kanit(fontWeight: FontWeight.bold, fontSize: 18),
      ),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, size: 18),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.history_rounded),
          onPressed: () {},
        ),
      ],
    );
  }

  Widget _buildCoinHeader() {
    return Container(
      padding: const EdgeInsets.all(30),
      child: Column(
        children: [
          FadeInDown(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFFFD700).withValues(alpha: 0.1),
                border:
                    Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.3)),
              ),
              child: const Icon(Icons.stars_rounded,
                  color: Color(0xFFFFD700), size: 40,),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'เหรียญสะสมของคุณ',
            style: GoogleFonts.kanit(color: Colors.white54, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                _coins.toString(),
                style: GoogleFonts.rubik(
                  color: Colors.white,
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'COINS',
                style: GoogleFonts.kanit(
                  color: const Color(0xFFFFD700),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCampaignBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4158D0), Color(0xFFC850C0)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFC850C0).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'แคมเปญ: นักสร้างสีสันชุมชน',
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'สะสมเหรียญให้ติด Top 10 ประจำเมือง รับสิทธิ์โปรโมทโพสต์ฟรี!',
                  style: GoogleFonts.kanit(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const LeaderboardScreen(),),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF4158D0),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: Text('ดูกระดานผู้นำ',
                      style: GoogleFonts.kanit(fontWeight: FontWeight.bold),),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          const Icon(Icons.workspace_premium_rounded,
              color: Colors.white, size: 60,),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            subtitle,
            style: GoogleFonts.kanit(
              color: Colors.white38,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissionTile(Map<String, dynamic> mission) {
    final bool isCompleted = mission['completed'] ?? false;
    final double? progress = mission['progress'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isCompleted
              ? Colors.green.withValues(alpha: 0.3)
              : Colors.white.withValues(alpha: 0.05),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (mission['color'] as Color).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(mission['icon'], color: mission['color'], size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  mission['title'],
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                Text(
                  mission['subtitle'],
                  style: GoogleFonts.kanit(
                    color: Colors.white38,
                    fontSize: 12,
                  ),
                ),
                if (progress != null && !isCompleted) ...[
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.white.withValues(alpha: 0.05),
                      valueColor:
                          AlwaysStoppedAnimation<Color>(mission['color']),
                      minHeight: 4,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            children: [
              Text(
                '+${mission['reward']}',
                style: GoogleFonts.rubik(
                  color: const Color(0xFFFFD700),
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              isCompleted
                  ? const Icon(Icons.check_circle_rounded,
                      color: Colors.green, size: 20,)
                  : Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4,),
                      decoration: BoxDecoration(
                        color: (mission['color'] as Color).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'ทำเลย',
                        style: GoogleFonts.kanit(
                          color: mission['color'],
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRedeemSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('แลกรางวัล', 'เปลี่ยนเหรียญเป็นความสุข'),
        Row(
          children: [
            _buildRedeemItem(
              title: 'ส่วนลด 50.-',
              cost: 500,
              icon: Icons.confirmation_number_rounded,
              color: Colors.tealAccent,
            ),
            const SizedBox(width: 12),
            _buildRedeemItem(
              title: 'ส่งฟรีพรีเมียม',
              cost: 300,
              icon: Icons.local_shipping_rounded,
              color: Colors.lightBlueAccent,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRedeemItem({
    required String title,
    required int cost,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 30),
            const SizedBox(height: 8),
            Text(
              title,
              style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.stars_rounded,
                    color: Color(0xFFFFD700), size: 12,),
                const SizedBox(width: 4),
                Text(
                  cost.toString(),
                  style: GoogleFonts.rubik(
                      color: const Color(0xFFFFD700),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _coins >= cost ? () {} : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: color.withValues(alpha: 0.2),
                  foregroundColor: color,
                  elevation: 0,
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),),
                ),
                child: Text('แลกเลย',
                    style: GoogleFonts.kanit(
                        fontSize: 11, fontWeight: FontWeight.bold,),),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
