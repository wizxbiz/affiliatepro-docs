import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/chat_screen.dart';
import 'package:caculateapp/tuktuk/screens/user_search_screen.dart';
import 'package:caculateapp/tuktuk/services/chat_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class FriendCenterScreen extends StatefulWidget {
  const FriendCenterScreen({super.key});

  @override
  State<FriendCenterScreen> createState() => _FriendCenterScreenState();
}

class _FriendCenterScreenState extends State<FriendCenterScreen>
    with SingleTickerProviderStateMixin {
  final TukTukBridge _bridge = TukTukBridge();
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  late TabController _tabController;
  Map<String, dynamic>? _currentUser;
  String? _currentUid;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUser();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUser() async {
    final user = await _bridge.getCurrentUser();
    if (mounted) {
      setState(() {
        _currentUser = user;
        _currentUid = user?['uid'] as String?;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D0D0D),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 20,),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'ศูนย์เพื่อน',
          style: GoogleFonts.kanit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
        actions: [
          IconButton(
            icon:
                const Icon(Icons.search_rounded, color: Colors.white, size: 26),
            onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (context) => const UserSearchScreen(),),),
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.orange,
          indicatorWeight: 3,
          labelStyle:
              GoogleFonts.kanit(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle: GoogleFonts.kanit(fontSize: 14),
          labelColor: Colors.orange,
          unselectedLabelColor: Colors.white38,
          tabs: const [
            Tab(text: 'ค้นหา'),
            Tab(text: 'ผู้ติดตาม'),
            Tab(text: 'กำลังติดตาม'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDiscoverTab(),
          _buildFollowersTab(),
          _buildFollowingTab(),
        ],
      ),
    );
  }

  // ─── TAB 1: Discover ────────────────────────────────────────────────────────

  Widget _buildDiscoverTab() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        children: [
          _buildMyIDCard(),
          _buildActionGrid(),
          _buildSectionHeader('ผู้คนที่คุณอาจรู้จัก', () {}),
          _buildRecommendedList(),
        ],
      ),
    );
  }

  Widget _buildMyIDCard() {
    final uid = _currentUser?['uid'] ?? '...';
    final name = _currentUser?['displayName'] ??
        _currentUser?['name'] ??
        'ผู้ใช้งาน TukTuk';
    final photo = _currentUser?['pictureUrl'] ?? _currentUser?['photoURL'];

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1C1C1E), Color(0xFF2C2C2E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.15)),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withValues(alpha: 0.05),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border:
                  Border.all(color: Colors.orange.withValues(alpha: 0.5), width: 2),
            ),
            child: CircleAvatar(
              radius: 30,
              backgroundColor: Colors.white.withValues(alpha: 0.05),
              backgroundImage: (photo != null && (photo as String).isNotEmpty)
                  ? CachedNetworkImageProvider(photo)
                  : null,
              child: (photo == null || (photo as String).isEmpty)
                  ? const Icon(Icons.person, color: Colors.white38, size: 30)
                  : null,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      'ID: ',
                      style: GoogleFonts.kanit(
                          color: Colors.white38, fontSize: 13,),
                    ),
                    Expanded(
                      child: Text(
                        uid.length > 16 ? '${uid.substring(0, 16)}...' : uid,
                        style: GoogleFonts.kanit(
                          color: Colors.orange,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Copy ID button
          IconButton(
            icon:
                const Icon(Icons.copy_rounded, color: Colors.orange, size: 22),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: uid));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('คัดลอก ID แล้ว', style: GoogleFonts.kanit()),
                  backgroundColor: Colors.green,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildActionCard(
            'ค้นหาเพื่อน',
            'ค้นหาจากชื่อหรือ ID',
            Icons.person_search_rounded,
            const Color(0xFF6366F1),
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const UserSearchScreen()),
            ),
          ),
          const SizedBox(width: 12),
          _buildActionCard(
            'สแกน QR',
            'เพิ่มเพื่อนด้วย QR',
            Icons.qr_code_scanner_rounded,
            const Color(0xFFEC4899),
            _showQRDialog,
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(String title, String subtitle, IconData icon,
      Color color, VoidCallback onTap,) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withValues(alpha: 0.15)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 10),
              Text(
                title,
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.kanit(color: Colors.white38, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, VoidCallback? onSeeAll) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 8, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title,
              style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 17,),),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              child: Text('ดูทั้งหมด',
                  style: GoogleFonts.kanit(color: Colors.orange, fontSize: 13),),
            ),
        ],
      ),
    );
  }

  Widget _buildRecommendedList() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _bridge.getNearbyUsers('กรุงเทพมหานคร'),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Padding(
            padding: EdgeInsets.all(30),
            child:
                Center(child: CircularProgressIndicator(color: Colors.orange)),
          );
        }
        final users = snapshot.data!
            .where((u) => u['uid'] != _currentUid)
            .take(10)
            .toList();

        if (users.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(30),
            child: Text('ไม่พบผู้ใช้ในพื้นที่',
                style: GoogleFonts.kanit(color: Colors.white24),
                textAlign: TextAlign.center,),
          );
        }

        return ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: users.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, i) => _buildUserTile(users[i]),
        );
      },
    );
  }

  // ─── TAB 2: Followers ───────────────────────────────────────────────────────

  Widget _buildFollowersTab() {
    if (_currentUid == null) {
      return Center(
          child: Text('กรุณาเข้าสู่ระบบ',
              style: GoogleFonts.kanit(color: Colors.white38),),);
    }
    return StreamBuilder<DocumentSnapshot>(
      stream: _db.collection('users').doc(_currentUid).snapshots(),
      builder: (context, snap) {
        final data = snap.data?.data() as Map<String, dynamic>?;
        final followers = List<String>.from(data?['followers'] ?? []);

        if (followers.isEmpty) {
          return _buildEmptyFollowState(
            icon: Icons.people_outlined,
            title: 'ยังไม่มีผู้ติดตาม',
            subtitle: 'แชร์โปรไฟล์ของคุณให้คนรู้จักติดตาม',
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: followers.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, i) {
            return FutureBuilder<DocumentSnapshot>(
              future: _db.collection('users').doc(followers[i]).get(),
              builder: (context, userSnap) {
                final user =
                    userSnap.data?.data() as Map<String, dynamic>? ?? {};
                user['uid'] = followers[i];
                return _buildUserTile(user, showMessageButton: true);
              },
            );
          },
        );
      },
    );
  }

  // ─── TAB 3: Following ───────────────────────────────────────────────────────

  Widget _buildFollowingTab() {
    if (_currentUid == null) {
      return Center(
          child: Text('กรุณาเข้าสู่ระบบ',
              style: GoogleFonts.kanit(color: Colors.white38),),);
    }
    return StreamBuilder<DocumentSnapshot>(
      stream: _db.collection('users').doc(_currentUid).snapshots(),
      builder: (context, snap) {
        final data = snap.data?.data() as Map<String, dynamic>?;
        final following = List<String>.from(data?['following'] ?? []);

        if (following.isEmpty) {
          return _buildEmptyFollowState(
            icon: Icons.person_search_outlined,
            title: 'ยังไม่ได้ติดตามใคร',
            subtitle: 'ค้นหาและติดตามผู้ใช้ที่คุณสนใจ',
            action: ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (context) => const UserSearchScreen(),),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),),
                textStyle: GoogleFonts.kanit(fontWeight: FontWeight.bold),
              ),
              child: const Text('ค้นหาเพื่อน'),
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: following.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, i) {
            return FutureBuilder<DocumentSnapshot>(
              future: _db.collection('users').doc(following[i]).get(),
              builder: (context, userSnap) {
                final user =
                    userSnap.data?.data() as Map<String, dynamic>? ?? {};
                user['uid'] = following[i];
                return _buildUserTile(user,
                    isFollowing: true, showMessageButton: true,);
              },
            );
          },
        );
      },
    );
  }

  // ─── User Tile ──────────────────────────────────────────────────────────────

  Widget _buildUserTile(
    Map<String, dynamic> user, {
    bool isFollowing = false,
    bool showMessageButton = false,
  }) {
    final uid = user['uid'] as String? ?? '';
    final name = user['displayName'] ?? user['name'] ?? 'ผู้ใช้งาน';
    final photo = user['pictureUrl'] ?? user['photoURL'];
    final isOnline = user['isOnline'] == true;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          // Avatar
          Stack(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: Colors.grey[900],
                backgroundImage: (photo != null && (photo as String).isNotEmpty)
                    ? CachedNetworkImageProvider(photo)
                    : null,
                child: (photo == null || (photo as String).isEmpty)
                    ? const Icon(Icons.person, color: Colors.white38, size: 26)
                    : null,
              ),
              if (isOnline)
                Positioned(
                  bottom: 1,
                  right: 1,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: Colors.greenAccent,
                      shape: BoxShape.circle,
                      border:
                          Border.all(color: const Color(0xFF0D0D0D), width: 2),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          // Name & subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,),),
                Text(
                  isOnline ? 'ออนไลน์อยู่' : 'แนะนำโดยระบบ',
                  style: GoogleFonts.kanit(
                    color: isOnline ? Colors.greenAccent : Colors.white30,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          // Action buttons
          if (showMessageButton)
            IconButton(
              icon: const Icon(Icons.chat_bubble_outline_rounded,
                  color: Colors.orange, size: 22,),
              onPressed: () async {
                final chatService = ChatService();
                final convId = await chatService.getOrCreateConversation(uid);
                if (mounted) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(
                        conversationId: convId,
                        otherUserId: uid,
                        otherUserName: name,
                        otherUserPhoto: photo,
                      ),
                    ),
                  );
                }
              },
            ),
          _buildFollowButton(uid, isFollowing),
        ],
      ),
    );
  }

  Widget _buildFollowButton(String uid, bool initialIsFollowing) {
    return StatefulBuilder(
      builder: (context, setLocalState) {
        // Stream-based follow state
        return StreamBuilder<DocumentSnapshot>(
          stream: _currentUid != null
              ? _db.collection('users').doc(_currentUid).snapshots()
              : null,
          builder: (context, snap) {
            final data = snap.data?.data() as Map<String, dynamic>?;
            final following = List<String>.from(data?['following'] ?? []);
            final actuallyFollowing = following.contains(uid);

            return GestureDetector(
              onTap: () async {
                await _bridge.toggleFollow(uid);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: actuallyFollowing
                      ? Colors.white.withValues(alpha: 0.07)
                      : Colors.orange,
                  borderRadius: BorderRadius.circular(12),
                  border: actuallyFollowing
                      ? Border.all(color: Colors.white.withValues(alpha: 0.15))
                      : null,
                ),
                child: Text(
                  actuallyFollowing ? 'ติดตามแล้ว' : 'ติดตาม',
                  style: GoogleFonts.kanit(
                    color: actuallyFollowing ? Colors.white54 : Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // ─── Empty States ────────────────────────────────────────────────────────────

  Widget _buildEmptyFollowState({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? action,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.03),
                border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
              ),
              child: Icon(icon, size: 48, color: Colors.white12),
            ),
            const SizedBox(height: 20),
            Text(title,
                style: GoogleFonts.kanit(
                    color: Colors.white60,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,),),
            const SizedBox(height: 8),
            Text(subtitle,
                style: GoogleFonts.kanit(color: Colors.white24, fontSize: 13),
                textAlign: TextAlign.center,),
            if (action != null) ...[const SizedBox(height: 24), action],
          ],
        ),
      ),
    );
  }

  // ─── QR Dialog ───────────────────────────────────────────────────────────────

  void _showQRDialog() {
    final uid = _currentUser?['uid'] ?? '';
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: const Color(0xFF1C1C1E),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.orange.withValues(alpha: 0.2)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('QR Code ของคุณ',
                  style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,),),
              const SizedBox(height: 20),
              Container(
                width: 180,
                height: 180,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(Icons.qr_code_2_rounded,
                    color: Colors.black, size: 140,),
              ),
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  uid.length > 20 ? '${uid.substring(0, 20)}...' : uid,
                  style: GoogleFonts.kanit(
                      color: Colors.orange, fontSize: 13, letterSpacing: 0.5,),
                ),
              ),
              const SizedBox(height: 8),
              Text('สแกน QR เพื่อเพิ่มเป็นเพื่อน',
                  style: GoogleFonts.kanit(color: Colors.white38, fontSize: 12),
                  textAlign: TextAlign.center,),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('ปิด',
                          style: GoogleFonts.kanit(color: Colors.white38),),
                    ),
                  ),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: uid));
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('คัดลอก ID แล้ว',
                                style: GoogleFonts.kanit(),),
                            backgroundColor: Colors.green,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),),
                        textStyle:
                            GoogleFonts.kanit(fontWeight: FontWeight.bold),
                      ),
                      child: const Text('คัดลอก ID'),
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
