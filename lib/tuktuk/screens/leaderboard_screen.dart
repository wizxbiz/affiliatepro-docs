import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<Map<String, dynamic>> _topUsers = [];
  Map<String, dynamic>? _myRankData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    final leaderboard = await TukTukBridge().getLeaderboard(limit: 50);
    final user = await TukTukBridge().getCurrentUser();

    if (mounted) {
      setState(() {
        _topUsers = leaderboard;
        // Find my rank in the list
        final myIdx = leaderboard.indexWhere((u) => u['uid'] == user?['uid']);
        if (myIdx >= 0) {
          _myRankData = Map<String, dynamic>.from(leaderboard[myIdx]);
          _myRankData!['rank'] = myIdx + 1;
        } else {
          // If not in top 50
          _myRankData = {
            'rank': 100,
            'displayName': user?['displayName'] ?? 'Me',
            'pictureUrl': user?['pictureUrl'],
            'totalCoins': user?['coins'] ?? 0,
          };
        }
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'กระดานผู้นำบารมี',
          style: GoogleFonts.kanit(fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF00F2EA)),
            )
          : Column(
              children: [
                _buildTopThree(),
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.only(top: 20),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.02),
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(30)),
                    ),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 20,
                      ),
                      itemCount:
                          _topUsers.length > 3 ? _topUsers.length - 3 : 0,
                      itemBuilder: (context, index) {
                        final user = _topUsers[index + 3];
                        return _buildRankTile(index + 4, user);
                      },
                    ),
                  ),
                ),
                _buildMyRankFooter(),
              ],
            ),
    );
  }

  Widget _buildTopThree() {
    if (_topUsers.isEmpty) return const SizedBox();

    final user1 = _topUsers.isNotEmpty ? _topUsers[0] : null;
    final user2 = _topUsers.length > 1 ? _topUsers[1] : null;
    final user3 = _topUsers.length > 2 ? _topUsers[2] : null;

    return Container(
      height: 220,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (user2 != null) _buildPodium(user2, 2, 140, Colors.grey.shade400),
          const SizedBox(width: 15),
          if (user1 != null)
            _buildPodium(user1, 1, 180, const Color(0xFFFFD700)),
          const SizedBox(width: 15),
          if (user3 != null) _buildPodium(user3, 3, 120, Colors.brown.shade400),
        ],
      ),
    );
  }

  Widget _buildPodium(
    Map<String, dynamic> user,
    int rank,
    double height,
    Color color,
  ) {
    return FadeInUp(
      delay: Duration(milliseconds: rank * 200),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Stack(
            alignment: Alignment.topCenter,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 3),
                  boxShadow: [
                    BoxShadow(
                        color: color.withValues(alpha: 0.3), blurRadius: 15),
                  ],
                ),
                child: CircleAvatar(
                  radius: rank == 1 ? 40 : 30,
                  backgroundImage: (user['pictureUrl'] != null &&
                          user['pictureUrl'].toString().startsWith('http'))
                      ? CachedNetworkImageProvider(
                          user['pictureUrl'].toString())
                      : null,
                  child: (user['pictureUrl'] == null ||
                          !user['pictureUrl'].toString().startsWith('http'))
                      ? Icon(Icons.person,
                          size: rank == 1 ? 40 : 30, color: Colors.white24)
                      : null,
                ),
              ),
              if (rank == 1)
                const Positioned(
                  top: -15,
                  child: Icon(
                    Icons.workspace_premium_rounded,
                    color: Color(0xFFFFD700),
                    size: 30,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            user['displayName'] ?? 'User',
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Container(
            width: 80,
            height: height - 100,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  color.withValues(alpha: 0.3),
                  color.withValues(alpha: 0.05)
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '#$rank',
                    style: GoogleFonts.rubik(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  Text(
                    user['totalCoins'].toString(),
                    style:
                        GoogleFonts.rubik(color: Colors.white70, fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankTile(int rank, Map<String, dynamic> user) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              rank.toString(),
              style: GoogleFonts.rubik(
                color: Colors.white38,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          CircleAvatar(
            radius: 20,
            backgroundImage: (user['pictureUrl'] != null &&
                    user['pictureUrl'].toString().startsWith('http'))
                ? CachedNetworkImageProvider(user['pictureUrl'].toString())
                : null,
            child: (user['pictureUrl'] == null ||
                    !user['pictureUrl'].toString().startsWith('http'))
                ? const Icon(Icons.person, size: 20, color: Colors.white24)
                : null,
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Text(
              user['displayName'] ?? 'User',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Row(
            children: [
              const Icon(
                Icons.stars_rounded,
                color: Color(0xFFFFD700),
                size: 14,
              ),
              const SizedBox(width: 4),
              Text(
                user['totalCoins'].toString(),
                style: GoogleFonts.rubik(
                  color: Colors.white70,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMyRankFooter() {
    if (_myRankData == null) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1F35),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 20),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Text(
              '#${_myRankData!['rank']}',
              style: GoogleFonts.rubik(
                color: const Color(0xFF00F2EA),
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            const SizedBox(width: 15),
            CircleAvatar(
              radius: 22,
              backgroundImage: (_myRankData!['pictureUrl'] != null &&
                      _myRankData!['pictureUrl'].toString().startsWith('http'))
                  ? CachedNetworkImageProvider(
                      _myRankData!['pictureUrl'].toString())
                  : null,
              child: (_myRankData!['pictureUrl'] == null ||
                      !_myRankData!['pictureUrl'].toString().startsWith('http'))
                  ? const Icon(Icons.person, size: 22, color: Colors.white24)
                  : null,
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'อันดับของคุณ',
                    style:
                        GoogleFonts.kanit(color: Colors.white54, fontSize: 11),
                  ),
                  Text(
                    _myRankData!['displayName'] ?? 'Me',
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.stars_rounded,
                      color: Color(0xFFFFD700),
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _myRankData!['totalCoins'].toString(),
                      style: GoogleFonts.rubik(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
                Text(
                  'คอยน์ทั้งหมด',
                  style: GoogleFonts.kanit(color: Colors.white38, fontSize: 10),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
