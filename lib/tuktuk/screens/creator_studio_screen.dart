import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/tuktuk_bridge.dart';
import 'post_detail_screen.dart';

class CreatorStudioScreen extends StatefulWidget {
  const CreatorStudioScreen({super.key});

  @override
  State<CreatorStudioScreen> createState() => _CreatorStudioScreenState();
}

class _CreatorStudioScreenState extends State<CreatorStudioScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _myVideos = [];
  Map<String, dynamic>? _userSession;
  Map<String, dynamic> _stats = {
    'totalViews': 0,
    'totalLikes': 0,
    'totalShares': 0,
    'totalComments': 0,
    'followersCount': 0,
    'watchTimeHours': 0.0,
  };

  @override
  void initState() {
    super.initState();
    _fetchStudioData();
  }

  Future<void> _fetchStudioData() async {
    final session = await TukTukBridge().getCurrentUser();
    if (session == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    if (mounted) setState(() => _userSession = session);

    final String mainUid = session['uid'];
    final String? lineUid = session['lineUserId'];

    if (mounted) setState(() => _isLoading = true);

    try {
      // 1. Fetch User Stats (Followers etc.)
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(mainUid)
          .get();

      int followers = 0;
      if (userDoc.exists) {
        followers = userDoc.data()?['followersCount'] ?? 0;
      }

      // 2. Fetch Multi-ID Posts
      final List<String> idList = [mainUid];
      if (lineUid != null) idList.add(lineUid.toString());
      final distinctIds = idList.toSet().toList();

      var snapshot = await FirebaseFirestore.instance
          .collection('community_posts')
          .where('authorId', whereIn: distinctIds)
          .orderBy('createdAt', descending: true)
          .get();

      if (snapshot.docs.isEmpty) {
        snapshot = await FirebaseFirestore.instance
            .collection('community_posts')
            .where('authorId', whereIn: distinctIds)
            .get();
      }

      final videos = snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();

      int views = 0;
      int likes = 0;
      int shares = 0;
      int comments = 0;

      for (final v in videos) {
        views += (v['views'] ?? 0) as int;
        likes += (v['likesCount'] ?? v['likes'] ?? 0) as int;
        shares += (v['shares'] ?? 0) as int;
        comments += (v['commentsCount'] ?? 0) as int;
      }

      if (mounted) {
        setState(() {
          _myVideos = videos;
          _stats = {
            'totalViews': views,
            'totalLikes': likes,
            'totalShares': shares,
            'totalComments': comments,
            'followersCount': followers,
            'watchTimeHours': (views * 0.4) / 60, // Better estimated watch time
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Studio Error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildAppBar(),
          SliverToBoxAdapter(
            child: _isLoading
                ? _buildLoadingState()
                : Column(
                    children: [
                      _buildStatsGrid(),
                      _buildVideoSectionHeader(),
                      if (_myVideos.isEmpty)
                        _buildEmptyState()
                      else
                        _buildVideoList(),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    final pic = _userSession?['pictureUrl'];
    final name = _userSession?['displayName'] ?? 'Creator';

    return SliverAppBar(
      expandedHeight: 180,
      backgroundColor: const Color(0xFF1E293B),
      pinned: true,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            // Background Gradient
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF3B82F6), Color(0xFF1E293B)],
                ),
              ),
            ),
            // Decorative shapes
            Positioned(
              right: -50,
              top: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            // User Profile Info
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 80, 20, 20),
              child: Row(
                children: [
                  Container(
                    width: 70,
                    height: 70,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white24, width: 3),
                      boxShadow: [
                        const BoxShadow(color: Colors.black26, blurRadius: 10),
                      ],
                    ),
                    child: ClipOval(
                      child: pic != null
                          ? CachedNetworkImage(imageUrl: pic, fit: BoxFit.cover)
                          : const Icon(Icons.person,
                              color: Colors.white, size: 40,),
                    ),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.stars,
                                color: Colors.amber, size: 16,),
                            const SizedBox(width: 4),
                            Text(
                              'Verified Creator',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.7),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      title: const Text('Creator Studio'),
      actions: [
        IconButton(
          onPressed: _fetchStudioData,
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return Padding(
      padding: const EdgeInsets.only(top: 100),
      child: Center(
        child: Column(
          children: [
            const CircularProgressIndicator(color: Color(0xFF00D2FF)),
            const SizedBox(height: 16),
            Text('กำลังประมวลผลข้อมูลการเติบโตของคุณ...',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.5)),),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    return FadeInUp(
      duration: const Duration(milliseconds: 600),
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'ภาพรวมช่องของคุณ',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('Real-Time',
                      style: TextStyle(
                          color: Colors.greenAccent,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,),),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                    child: _buildLargeStat(
                        'ยอดรับชม',
                        _formatNumber(_stats['totalViews']),
                        Icons.visibility_rounded,
                        [const Color(0xFF3B82F6), const Color(0xFF2563EB)],),),
                const SizedBox(width: 12),
                Expanded(
                    child: _buildLargeStat(
                        'ผู้ติดตาม',
                        _formatNumber(_stats['followersCount']),
                        Icons.people_rounded,
                        [const Color(0xFF6366F1), const Color(0xFF4F46E5)],),),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                    child: _buildLargeStat(
                        'หัวใจสะสม',
                        _formatNumber(_stats['totalLikes']),
                        Icons.favorite_rounded,
                        [const Color(0xFFEC4899), const Color(0xFFDB2777)],),),
                const SizedBox(width: 12),
                Expanded(
                    child: _buildLargeStat(
                        'Watch Time',
                        '${_stats['watchTimeHours'].toStringAsFixed(1)}h',
                        Icons.query_stats_rounded,
                        [const Color(0xFFF59E0B), const Color(0xFFD97706)],),),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLargeStat(
      String label, String value, IconData icon, List<Color> colors,) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: colors),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: Colors.white, size: 14),
              ),
              const SizedBox(width: 8),
              Text(label,
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5), fontSize: 11,),),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoSectionHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'รายชื่อวิดีโอ (${_myVideos.length})',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          TextButton(
            onPressed: () {},
            child: const Text('ดูทั้งหมด',
                style: TextStyle(color: Color(0xFF3B82F6)),),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 40),
      itemCount: _myVideos.length,
      itemBuilder: (context, index) {
        final video = _myVideos[index];
        return FadeInUp(
          delay: Duration(milliseconds: 100 * index),
          child: _buildModernVideoCard(video),
        );
      },
    );
  }

  Widget _buildModernVideoCard(Map<String, dynamic> video) {
    final title =
        video['description'] ?? video['title'] ?? 'วิดีโอที่ไม่ได้ระบุชื่อ';
    final views = (video['views'] ?? 0) as int;
    final likes = (video['likesCount'] ?? video['likes'] ?? 0) as int;
    final comments = (video['commentsCount'] ?? 0) as int;
    final date = (video['createdAt'] as Timestamp?)?.toDate();

    // Thumbnail extraction logic
    String? img = video['imageUrl'];
    if (img == null || img.isEmpty) {
      final videoUrl = video['videoUrl']?.toString() ?? '';
      if (videoUrl.isNotEmpty) {
        if (videoUrl.contains('youtube.com') || videoUrl.contains('youtu.be')) {
          final ytId = videoUrl.contains('embed/')
              ? videoUrl.split('embed/')[1].split('?')[0]
              : (videoUrl.contains('v=')
                  ? videoUrl.split('v=')[1].split('&')[0]
                  : (videoUrl.contains('youtu.be/')
                      ? videoUrl.split('youtu.be/')[1].split('?')[0]
                      : ''));
          img = 'https://img.youtube.com/vi/$ytId/hqdefault.jpg';
        }
      }
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
              builder: (context) => PostDetailScreen(postData: video),),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: IntrinsicHeight(
            child: Row(
              children: [
                // Thumbnail
                Stack(
                  children: [
                    SizedBox(
                      width: 100,
                      height: 130,
                      child: (img != null && img.startsWith('http'))
                          ? CachedNetworkImage(
                              imageUrl: img,
                              fit: BoxFit.cover,
                              errorWidget: (_, __, ___) =>
                                  Container(color: Colors.black26),
                            )
                          : Container(color: Colors.black26),
                    ),
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.play_arrow_rounded,
                            color: Colors.white, size: 14,),
                      ),
                    ),
                  ],
                ),
                // Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const Icon(Icons.more_vert_rounded,
                                color: Colors.white38, size: 18,),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          date != null
                              ? '${date.day}/${date.month}/${date.year}'
                              : 'เพิ่งเมื่อครู่',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.3),
                              fontSize: 11,),
                        ),
                        const Spacer(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildVideoMiniStat(Icons.visibility_rounded, views,
                                const Color(0xFF3B82F6),),
                            _buildVideoMiniStat(Icons.favorite_rounded, likes,
                                const Color(0xFFEC4899),),
                            _buildVideoMiniStat(Icons.insert_comment_rounded,
                                comments, const Color(0xFFF59E0B),),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildVideoMiniStat(IconData icon, int value, Color color) {
    return Row(
      children: [
        Icon(icon, size: 14, color: color.withValues(alpha: 0.8)),
        const SizedBox(width: 4),
        Text(
          _formatNumber(value),
          style: const TextStyle(
              color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600,),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return FadeIn(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.only(top: 60, bottom: 80),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.03),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.videocam_off_rounded,
                    size: 80, color: Colors.white10,),
              ),
              const SizedBox(height: 24),
              const Text(
                'ยังไม่มีวิดีโอของคุณ',
                style: TextStyle(
                    color: Colors.white60,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,),
              ),
              const SizedBox(height: 8),
              const Text(
                'เริ่มต้นสร้างวิดีโอแรกของคุณเพื่อเข้าถึงผู้คนนับล้าน!',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white24, fontSize: 13),
              ),
              const SizedBox(height: 30),
              ElevatedButton.icon(
                onPressed: () {
                  // Navigate to post creation if possible
                },
                icon: const Icon(Icons.add_rounded),
                label: const Text('สร้างวิดีโอ'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) return '${(number / 1000000).toStringAsFixed(1)}M';
    if (number >= 1000) return '${(number / 1000).toStringAsFixed(1)}K';
    return number.toString();
  }
}
