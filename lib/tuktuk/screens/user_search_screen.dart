import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/profile_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:flutter/material.dart';

class UserSearchScreen extends StatefulWidget {
  const UserSearchScreen({super.key});

  @override
  State<UserSearchScreen> createState() => _UserSearchScreenState();
}

class _UserSearchScreenState extends State<UserSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isLoading = false;
  final TukTukBridge _bridge = TukTukBridge();
  List<Map<String, dynamic>> _nearbySuggestions = [];
  bool _isLocating = false;

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }

    setState(() => _isLoading = true);
    final results = await _bridge.searchUsers(query);
    if (mounted) {
      setState(() {
        _searchResults = results;
        _isLoading = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchNearbySuggestions();
  }

  Future<void> _fetchNearbySuggestions() async {
    setState(() => _isLocating = true);
    final user = await _bridge.getCurrentUser();
    if (user != null && user['province'] != null) {
      final nearby = await _bridge.getNearbyUsers(user['province']);
      if (mounted) {
        setState(() {
          _nearbySuggestions =
              nearby.where((u) => u['uid'] != user['uid']).toList();
          _isLocating = false;
        });
      }
    } else {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: TextField(
            controller: _searchController,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'ค้นหาเพื่อน...',
              hintStyle: TextStyle(color: Colors.white54, fontSize: 14),
              prefixIcon: Icon(Icons.search, color: Colors.white54, size: 20),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(vertical: 10),
            ),
            onChanged: _performSearch,
          ),
        ),
        actions: [
          if (_searchController.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white54),
              onPressed: () {
                _searchController.clear();
                _performSearch('');
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
          : _searchResults.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  itemCount: _searchResults.length,
                  itemBuilder: (context, index) {
                    final user = _searchResults[index];
                    return FadeInUp(
                      duration: Duration(milliseconds: 300 + (index * 50)),
                      child: _buildUserTile(user),
                    );
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return SingleChildScrollView(
      child: Column(
        children: [
          const SizedBox(height: 60),
          Icon(Icons.person_search_outlined,
              size: 80, color: Colors.white.withValues(alpha: 0.1),),
          const SizedBox(height: 15),
          Text(
            _searchController.text.isEmpty
                ? 'ค้นหาเพื่อนใหม่ใน TukTuk'
                : 'ไม่พบผู้ใช้ที่ค้นหา',
            style: const TextStyle(color: Colors.white38, fontSize: 16),
          ),
          if (_searchController.text.isEmpty &&
              _nearbySuggestions.isNotEmpty) ...[
            const SizedBox(height: 60),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Icon(Icons.location_on, color: Colors.orange, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'เพื่อนแนะนำใกล้ตัวคุณ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            if (_isLocating)
              const Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.orange,),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _nearbySuggestions.length,
                itemBuilder: (context, index) {
                  return _buildUserTile(_nearbySuggestions[index]);
                },
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildUserTile(Map<String, dynamic> user) {
    final String displayName = user['displayName'] ?? 'ผู้ใช้งาน';
    final String? pictureUrl = user['pictureUrl'] ?? user['photoURL'];
    final String uid = user['uid'] ?? '';

    return ListTile(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProfileScreen(
              userId: uid,
              isBackButtonEnabled: true,
            ),
          ),
        );
      },
      leading: CircleAvatar(
        radius: 25,
        backgroundColor: Colors.grey[900],
        backgroundImage: (pictureUrl != null && pictureUrl.startsWith('http'))
            ? CachedNetworkImageProvider(pictureUrl)
            : null,
        child: (pictureUrl == null || !pictureUrl.startsWith('http'))
            ? const Icon(Icons.person, color: Colors.white)
            : null,
      ),
      title: Text(
        displayName,
        style: const TextStyle(
            color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16,),
      ),
      subtitle: Text(
        '@${uid.length > 10 ? uid.substring(0, 10) : uid}',
        style: const TextStyle(color: Colors.white54, fontSize: 12),
      ),
      trailing: ElevatedButton(
        onPressed: () {
          TukTukBridge().toggleFollow(uid);
          // Instant feedback
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('กำลังดำเนินการ...'),
                duration: Duration(milliseconds: 500),),
          );
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orange,
          foregroundColor: Colors.black,
          minimumSize: const Size(80, 32),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 12),
        ),
        child: const Text('ติดตาม',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),),
      ),
    );
  }
}
