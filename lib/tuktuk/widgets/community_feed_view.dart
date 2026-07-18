import 'package:better_player_plus/better_player_plus.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/screens/idea_lab_screen.dart';
import 'package:caculateapp/tuktuk/screens/post_detail_screen.dart';
import 'package:caculateapp/tuktuk/screens/product_detail_screen.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/tuktuk_item.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

class CommunityFeedView extends StatefulWidget {
  final List<TukTukItem> items;
  final bool isLoading;
  final bool hasMore;
  final Future<void> Function() onRefresh;
  final VoidCallback onLoadMore;
  final Function(String) onFilterChanged;
  final VoidCallback onPostTap;
  final VoidCallback onCameraTap;
  final VoidCallback onVoiceTap;
  final String? selectedProvince; // ✅ Added Local Context

  const CommunityFeedView({
    super.key,
    required this.items,
    required this.isLoading,
    required this.hasMore,
    required this.onRefresh,
    required this.onLoadMore,
    required this.onFilterChanged,
    required this.onPostTap,
    required this.onCameraTap,
    required this.onVoiceTap,
    this.selectedProvince,
  });

  @override
  State<CommunityFeedView> createState() => _CommunityFeedViewState();
}

class _CommunityFeedViewState extends State<CommunityFeedView> {
  final ScrollController _scrollController = ScrollController();
  String _selectedFilter = 'all';

  // 🏛️ Official Occupational Groups (Managed by Admin/System)
  final List<Map<String, dynamic>> _officialGroups = [
    {
      'id': 'eco_merchants',
      'label': 'ค้าขาย/อาหาร',
      'icon': Icons.restaurant_menu,
      'color': Colors.orangeAccent,
      'members': '1.2k',
      'description': 'ศูนย์รวมร้านไทย',
    },
    {
      'id': 'eco_delivery',
      'label': 'วิน/ขนส่ง',
      'icon': Icons.moped,
      'color': Colors.cyanAccent,
      'members': '850',
      'description': 'เครือข่ายรถรับจ้าง',
    },
    {
      'id': 'eco_pros',
      'label': 'ช่าง/บริการ',
      'icon': Icons.handyman_rounded,
      'color': Colors.greenAccent,
      'members': '640',
      'description': 'รวมช่างฝีมือดี',
    },
    {
      'id': 'groups',
      'label': 'จอยคนไทย',
      'icon': Icons.groups_3_rounded,
      'color': const Color(0xFFA855F7),
      'members': '5.4k',
      'description': 'สังคมแบ่งปัน',
    },
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      widget.onLoadMore();
    }
  }

  void _setFilter(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
    widget.onFilterChanged(filter);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      color: Colors.indigo,
      backgroundColor: const Color(0xFF111827), // Dark Theme Background
      child: CustomScrollView(
        key: const ValueKey('comm_feed_scroll_view'),
        controller: _scrollController,
        slivers: [
          // 1. Header & Create Post Widget
          SliverToBoxAdapter(
            child: _buildHeaderSection(),
          ),

          // 2. Official Groups Hub (Pre-defined Occupational Channels)
          SliverToBoxAdapter(
            child: _buildOfficialGroupsHub(),
          ),

          // 3. Filter Chips
          SliverToBoxAdapter(
            child: _buildFilterSection(),
          ),

          // 3. Feed List (Unified structure for stability)
          SliverPadding(
            padding: const EdgeInsets.only(bottom: 100),
            sliver: (widget.items.isEmpty && !widget.isLoading)
                ? SliverToBoxAdapter(
                    key: const ValueKey('comm_empty_state_adapter'),
                    child: _buildEmptyState(),
                  )
                : SliverList(
                    key: const ValueKey('comm_feed_list'),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index == widget.items.length) {
                          return widget.hasMore
                              ? const Padding(
                                  padding: EdgeInsets.all(20),
                                  child: Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                )
                              : const SizedBox.shrink();
                        }

                        final item = widget.items[index];
                        // ✨ STABLE KEY: Ensure item type and ID are used for reliable tracking
                        final itemKey =
                            ValueKey('post_${item.collectionName}_${item.id}');

                        if (item.type == TukTukItemType.product) {
                          return _buildProductInterleave(item, key: itemKey);
                        }

                        if (item.type == TukTukItemType.recommendation) {
                          return _buildRecommendationCard(key: itemKey);
                        }

                        if (item.type == TukTukItemType.ideaLab) {
                          return _buildIdeaLabCard(key: itemKey);
                        }

                        return CommunityPostCard(
                          key: itemKey,
                          item: item,
                          onGroupTap: _setFilter,
                        );
                      },
                      childCount: widget.items.length + 1,
                      addAutomaticKeepAlives:
                          false, // ✅ Memory Optimization: Dispose off-screen items
                      addRepaintBoundaries: true,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildIdeaLabCard({Key? key}) {
    return Container(
      key: key,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.amber.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child:
                    const Icon(Icons.psychology, color: Colors.amber, size: 24),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TukTuk Idea Lab',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      'ห้องทดลองสร้างอาชีพด้วย AI',
                      style: TextStyle(color: Colors.white54, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'เปลี่ยนของรอบตัว หรือทักษะที่คุณมี ให้เป็นรายได้เสริมง่ายๆ ด้วยพลังของ AI + Location Data',
            style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const IdeaLabScreen()),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                '✨ เริ่มต้นสร้างอาชีพเลย',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfficialGroupsHub() {
    return Container(
      key: const ValueKey('comm_official_groups_hub'),
      padding: const EdgeInsets.symmetric(vertical: 8),
      color: const Color(0xFF111827),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 4,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.orangeAccent,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'กลุ่มหลักคนไทย',
                      style: GoogleFonts.kanit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const Text(
                  'ตรวจสอบข้อมูลและอาชีพ',
                  style: TextStyle(color: Colors.white38, fontSize: 10),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _officialGroups.length,
              itemBuilder: (context, index) {
                final group = _officialGroups[index];
                final bool isSelected = _selectedFilter == group['id'];

                return GestureDetector(
                  onTap: () => _setFilter(group['id']),
                  child: Container(
                    width: 140,
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? (group['color'] as Color).withValues(alpha: 0.2)
                          : const Color(0xFF1F2937),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? group['color'] as Color
                            : Colors.white.withValues(alpha: 0.05),
                        width: 1.5,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color:
                                    (group['color'] as Color).withValues(alpha: 0.2),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ]
                          : null,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Icon(
                              group['icon'] as IconData,
                              color: group['color'] as Color,
                              size: 24,
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                group['members'],
                                style: const TextStyle(
                                  color: Colors.white54,
                                  fontSize: 8,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              group['label'],
                              style: GoogleFonts.kanit(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              group['description'],
                              style: const TextStyle(
                                color: Colors.white38,
                                fontSize: 9,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderSection() {
    final bool isFiltered =
        _selectedFilter.startsWith('eco_') || _selectedFilter == 'groups';
    final activeGroup = isFiltered
        ? _officialGroups.firstWhere(
            (g) => g['id'] == _selectedFilter,
            orElse: () => _officialGroups.last,
          )
        : null;

    return Container(
      key: const ValueKey('comm_header_section'),
      color: const Color(0xFF111827),
      padding: EdgeInsets.fromLTRB(
        16,
        MediaQuery.of(context).padding.top + 60,
        16,
        0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dynamic Header based on Filter
          if (isFiltered && activeGroup != null)
            _buildDedicatedGroupHeader(activeGroup)
          else
            // Standard Title & Status Row
            _buildStandardHeader(),

          const SizedBox(height: 24),

          // "Create Post" Card (Only if not in a strict official group view or decide to allow)
          _buildPostInputCard(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildDedicatedGroupHeader(Map<String, dynamic> group) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            (group['color'] as Color).withValues(alpha: 0.4),
            const Color(0xFF1F2937),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: (group['color'] as Color).withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (group['color'] as Color).withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              group['icon'] as IconData,
              color: group['color'] as Color,
              size: 30,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'กลุ่ม${group['label']}',
                  style: GoogleFonts.kanit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const Text(
                  'พื้นที่แชร์ไอดีและแจ้งข้อมูลอาชีพ',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white54),
            onPressed: () => _setFilter('all'),
          ),
        ],
      ),
    );
  }

  Widget _buildStandardHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      widget.selectedProvince != null
                          ? 'ชุมชน${widget.selectedProvince}'
                          : 'ชุมชน',
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Community',
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w300,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              const Text(
                'แบ่งปันเรื่องราวและก้าวไปด้วยกัน',
                style: TextStyle(fontSize: 12, color: Colors.white54),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF1F2937),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white10),
          ),
          child: const Row(
            children: [
              Icon(Icons.public, color: Colors.blue, size: 14),
              SizedBox(width: 6),
              Text(
                'สาธารณะ',
                style: TextStyle(color: Colors.blue, fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPostInputCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ช่วยบอกต่อและแชร์เรื่องราว',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              // Avatar
              StreamBuilder<User?>(
                stream: FirebaseAuth.instance.authStateChanges(),
                builder: (context, snapshot) {
                  final user = snapshot.data;
                  final String? photoUrl = user?.photoURL;
                  return CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.grey.shade800,
                    backgroundImage:
                        (photoUrl != null && photoUrl.startsWith('http'))
                            ? NetworkImage(photoUrl)
                            : null,
                    child: (photoUrl == null || !photoUrl.startsWith('http'))
                        ? const Icon(
                            Icons.person,
                            size: 20,
                            color: Colors.white54,
                          )
                        : null,
                  );
                },
              ),
              const SizedBox(width: 12),
              // Input Field (Fake)
              Expanded(
                child: GestureDetector(
                  key: const ValueKey('comm_header_post_trigger'),
                  onTap: widget.onPostTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF111827),
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: const Text(
                      'เริ่มต้นบทสนทนาที่นี่...',
                      style: TextStyle(color: Colors.white54),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Mic Button
              GestureDetector(
                key: const ValueKey('comm_header_voice_trigger'),
                onTap: widget.onVoiceTap,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFF111827),
                    shape: BoxShape.circle,
                  ),
                  child:
                      const Icon(Icons.mic, color: Colors.redAccent, size: 20),
                ),
              ),
              const SizedBox(width: 4),
              // Image Button
              GestureDetector(
                key: const ValueKey('comm_header_image_trigger'),
                onTap: widget.onCameraTap,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFF111827),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.image,
                    color: Colors.blueAccent,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection() {
    return Container(
      key: const ValueKey('comm_filter_section'),
      height: 60,
      color: const Color(0xFF111827),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          _buildChip(
            'all',
            'ทั้งหมด',
            Icons.grid_view_rounded,
            const Color(0xFF4285F4),
          ),
          _buildChip(
            'eco_merchants',
            'ค้าขาย/อาหาร',
            Icons.restaurant_menu,
            Colors.orangeAccent,
          ),
          _buildChip(
            'eco_delivery',
            'วิน/ขนส่ง',
            Icons.moped,
            Colors.cyanAccent,
          ),
          _buildChip(
            'eco_pros',
            'ช่าง/บริการ',
            Icons.handyman_rounded,
            Colors.greenAccent,
          ),
          _buildChip(
            'groups',
            'กลุ่ม (Groups)',
            Icons.groups_rounded,
            const Color(0xFFA855F7),
          ),
          _buildChip(
            'discussion',
            'ประเด็นพูดคุย',
            Icons.forum_rounded,
            const Color(0xFF34A853),
          ),
          _buildChip(
            'news',
            'ข่าวสาร',
            Icons.newspaper_rounded,
            const Color(0xFFEA4335),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    final provinceText =
        widget.selectedProvince != null ? 'ใน${widget.selectedProvince}' : '';
    String title = 'เงียบเหงาจัง...';
    String msg = 'ยังไม่พบโพสต์ใหม่ในขณะนี้';
    String btnText = 'เริ่มบทสนทนาแรก';
    IconData icon = Icons.comment_bank_outlined;

    if (_selectedFilter == 'groups') {
      title = 'ชุมชนกลุ่มย่อย$provinceText';
      msg =
          'ยังไม่พบกลุ่มใหม่ๆ$provinceText หรืออยากเริ่มสร้างกลุ่มเพื่อรวบรวมสมาชิกที่มีความสนใจเหมือนกันไหม?';
      btnText = 'เริ่มสร้างกลุ่มใหม่';
      icon = Icons.groups_outlined;
    } else if (_selectedFilter == 'member_groups') {
      title = 'กลุ่มที่คุณเป็นสมาชิก';
      msg =
          'คุณยังไม่ได้เข้าร่วมกลุ่มใดเลย ลองค้นหากลุ่มที่น่าสนใจแล้วกดเข้าร่วมได้ที่นี่';
      btnText = 'ค้นหากลุ่มน่าสนใจ';
      icon = Icons.star_outline_rounded;
    } else if (_selectedFilter == 'discussion') {
      title = 'ไม่มีประเด็นพูดคุย$provinceText';
      msg =
          'ขณะนี้ยังไม่มีหัวข้อการสนทนา$provinceText มาร่วมสร้างหัวข้อที่น่าสนใจกันเถอะ';
      icon = Icons.forum_outlined;
    } else {
      title = 'เงียบเหงาจัง$provinceText...';
      msg =
          'ยังไม่พบโพสต์ใหม่$provinceTextในขณะนี้ มาสร้างสีสันให้กับชุมชนด้วยการเริ่มแชร์ความคิดเห็นของคุณกันเถอะ!';
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 48, color: Colors.grey.shade400),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              msg,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, height: 1.5),
            ),
            const SizedBox(height: 24),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: widget.onPostTap,
              icon: const Icon(Icons.add_circle_outline, size: 18),
              label: Text(btnText),
              style: ElevatedButton.styleFrom(
                backgroundColor: _selectedFilter == 'groups'
                    ? const Color(0xFFA855F7)
                    : const Color(0xFF4285F4),
                foregroundColor: Colors.white,
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(
    String id,
    String label,
    IconData icon,
    Color color, {
    bool isAction = false,
  }) {
    final isSelected = _selectedFilter == id;
    return GestureDetector(
      key: ValueKey('comm_chip_$id'),
      onTap: () {
        if (isAction) {
          // Handle AI action
          widget.onPostTap(); // For now just open create post
        } else {
          _setFilter(id);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color : const Color(0xFF1F2937),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : Colors.white10,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.white54,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white70,
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Returns true for URLs that should never be passed to CachedNetworkImage.
  bool _isVideoUrl(String url) {
    final lower = url.toLowerCase().split('?').first;
    return lower.endsWith('.mp4') ||
        lower.endsWith('.mov') ||
        lower.endsWith('.avi') ||
        lower.endsWith('.mkv') ||
        lower.endsWith('.webm') ||
        lower.endsWith('.m3u8');
  }

  // 🛒 Helper for Product Interleaving
  Widget _buildProductInterleave(TukTukItem item, {Key? key}) {
    // Pick the first non-video URL from images for the thumbnail.
    // Passing an .mp4 URL to CachedNetworkImage causes "Invalid image data".
    String imageUrl = item.data['imageUrl']?.toString() ?? '';
    if (imageUrl.isEmpty && item.data['images'] is List) {
      for (final img in item.data['images'] as List) {
        final url = (img is String)
            ? img
            : (img is Map ? img['url']?.toString() : null);
        if (url != null && url.isNotEmpty && !_isVideoUrl(url)) {
          imageUrl = url;
          break;
        }
      }
    }
    final String title = item.data['productName'] ?? item.data['title'] ?? '';
    final String price = item.data['price']?.toString() ?? '0';

    return Container(
      key: key,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
        gradient: const LinearGradient(
          colors: [Color(0xFF1F2937), Color(0xFF111827)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          // Product Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(
              imageUrl: imageUrl,
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              errorWidget: (c, e, s) => Container(
                color: Colors.grey.shade900,
                child: const Icon(
                  Icons.shopping_bag_outlined,
                  color: Colors.white24,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Product Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'MARKETPLACE',
                        style: TextStyle(
                          color: Colors.orangeAccent,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const Spacer(),
                    const Icon(
                      Icons.near_me_outlined,
                      color: Colors.white38,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      item.data['sellerLocation'] ?? 'ใกล้คุณ',
                      style:
                          const TextStyle(color: Colors.white38, fontSize: 10),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '฿$price',
                  style: GoogleFonts.oswald(
                    color: Colors.blueAccent,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      ProductDetailScreen(productData: item.data),
                ),
              );
            },
            icon: const Icon(
              Icons.arrow_forward_ios,
              color: Colors.white38,
              size: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationCard({Key? key}) {
    return Container(
      key: key,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const Icon(Icons.rocket_launch, color: Colors.white, size: 40),
          const SizedBox(height: 16),
          const Text(
            'ยกระดับประสบการณ์ของคุณ!',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          const Text(
            'เข้าสู่ระบบเพื่อบันทึกโพสต์ ติดตามเพื่อน และสะสมคะแนน TukTuk Rewards',
            style: TextStyle(color: Colors.white70, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => TukTukBridge().signInWithLine(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF4F46E5),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text(
              'เข้าสู่ระบบตอนนี้',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

class CommunityPostCard extends StatefulWidget {
  final TukTukItem item;
  final Function(String)? onGroupTap;

  const CommunityPostCard({super.key, required this.item, this.onGroupTap});

  @override
  State<CommunityPostCard> createState() => _CommunityPostCardState();
}

class _CommunityPostCardState extends State<CommunityPostCard> {
  bool _isLiked = false;
  int _likesCount = 0;
  bool _isExpanded = false; // ✅ Track expansion state

  @override
  void initState() {
    super.initState();
    _likesCount = widget.item.data['likes'] ?? 0; // Initialize from data
    _checkLikeStatus();
  }

  Future<void> _checkLikeStatus() async {
    final postId = widget.item.id;
    if (postId.startsWith('fallback_') || postId.startsWith('feed_')) return;

    final collection = widget.item.collectionName;
    final liked = await TukTukBridge().hasLiked(postId, collection);
    if (mounted) setState(() => _isLiked = liked);
  }

  Future<void> _handleLike() async {
    final postId = widget.item.id;
    final collection = widget.item.collectionName;

    setState(() {
      _isLiked = !_isLiked;
      _likesCount += _isLiked ? 1 : -1;
    });

    final success = await TukTukBridge().toggleLike(postId, collection);
    if (!success && mounted) {
      setState(() {
        _isLiked = !_isLiked; // Rollback
        _likesCount += _isLiked ? 1 : -1;
      });
    }
  }

  void _showCommentsModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CommentsSheet(item: widget.item),
    );
  }

  void _handleShare() {
    final String shareUrl = "https://wizmobiz.com/community/${widget.item.id}";
    Clipboard.setData(ClipboardData(text: shareUrl));

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'แชร์ความรู้ของคุณ',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'แบ่งปันเรื่องราวที่มีประโยชน์ให้กับเพื่อนร่วมชุมชน',
              style: TextStyle(color: Colors.black54, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildShareOption(
                  Icons.link,
                  'คัดลอกลิงก์',
                  Colors.blue,
                  isPrimary: true,
                ),
                _buildShareOption(Icons.facebook, 'Facebook', Colors.indigo),
                _buildShareOption(Icons.message, 'LINE', Colors.green),
              ],
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 8),
            Text(
              'คัดลอกลิงก์เรียบร้อยแล้ว!',
              style: TextStyle(
                color: Colors.green.shade700,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption(
    IconData icon,
    String label,
    Color color, {
    bool isPrimary = false,
  }) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: isPrimary ? color : color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
            boxShadow: isPrimary
                ? [
                    BoxShadow(
                      color: color.withValues(alpha: 0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Icon(icon, color: isPrimary ? Colors.white : color, size: 28),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.item.data;
    final authorName = data['authorName'] ?? 'Member';
    final authorPic = data['authorAvatar'] ?? data['authorPictureUrl'];
    final timestamp = data['createdAt'];
    final description = data['content'] ??
        data['description'] ??
        ''; // Match 'content' from web
    final title = data['title']; // Match 'title' from web
    final imageUrl = data['imageUrl'];
    final List images = data['images'] ?? [];
    final commentsCount = data['commentsCount'] ?? 0;
    final category = data['category'] ?? 'General';

    // Video extraction logic similar to web
    String? mediaUrl;
    bool isVideo = false;

    // Check main image/video field first
    if (imageUrl != null && imageUrl.toString().isNotEmpty) {
      mediaUrl = imageUrl;
      if (mediaUrl!.contains('.mp4') ||
          mediaUrl.contains('.mov') ||
          data['type'] == 'video') {
        isVideo = true;
      }
    } else if (images.isNotEmpty) {
      final first = images[0];
      if (first is Map && first['type'] == 'video') {
        isVideo = true;
        mediaUrl = first['url'];
      } else if (first is String) {
        mediaUrl = first;
        if (mediaUrl.contains('.mp4') || mediaUrl.contains('.mov')) {
          isVideo = true;
        }
      }
    }

    // YouTube logic
    bool isYoutube = false;
    String? youtubeId;
    if (mediaUrl != null &&
        (mediaUrl.contains('youtube.com') || mediaUrl.contains('youtu.be'))) {
      isYoutube = true;
      isVideo = true; // Treating as video for UI purpose
      // Simple regex for ID (improving on basics)
      final regExp = RegExp(
        r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})',
      );
      final match = regExp.firstMatch(mediaUrl.toString());
      if (match != null) youtubeId = match.group(1);
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.grey.shade200,
                  backgroundImage: (authorPic != null &&
                          authorPic.toString().startsWith('http'))
                      ? CachedNetworkImageProvider(authorPic.toString())
                      : null,
                  child: (authorPic == null ||
                          !authorPic.toString().startsWith('http'))
                      ? const Icon(Icons.person, color: Colors.grey)
                      : null,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              authorName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.blue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: Colors.blue.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    if (widget.onGroupTap != null) {
                                      widget.onGroupTap!(category);
                                    }
                                  },
                                  child: Text(
                                    data['isOfficialGroup'] == true
                                        ? 'OFFICIAL GROUP'
                                        : (category == 'eco_merchants'
                                            ? 'อาชีพ/ค้าขาย'
                                            : (category == 'eco_delivery'
                                                ? 'อาชีพ/ขนส่ง'
                                                : (category == 'eco_pros'
                                                    ? 'อาชีพ/ช่าง'
                                                    : category.toUpperCase()))),
                                    style: TextStyle(
                                      fontSize: 9,
                                      color: data['isOfficialGroup'] == true
                                          ? Colors.cyanAccent
                                          : Colors.blueAccent,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                if (data['isOfficialGroup'] == true) ...[
                                  const SizedBox(width: 4),
                                  const Icon(
                                    Icons.verified,
                                    color: Colors.cyanAccent,
                                    size: 10,
                                  ),
                                ],
                                if (isVideo) ...[
                                  const SizedBox(width: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 4,
                                      vertical: 1,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.blue,
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                    child: const Text(
                                      'VIDEO',
                                      style: TextStyle(
                                        fontSize: 8,
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Text(
                            _formatTimestamp(timestamp),
                            style: const TextStyle(
                              color: Colors.white38,
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            '•',
                            style: TextStyle(
                              color: Colors.white38,
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.public,
                            size: 10,
                            color: Colors.white38,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.more_horiz, color: Colors.grey),
                  onPressed: () {},
                ),
              ],
            ),
          ),

          // Content Body
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (title != null && title.toString().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      title,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                if (description.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        description,
                        maxLines: _isExpanded ? null : 3,
                        overflow: _isExpanded
                            ? TextOverflow.visible
                            : TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.5,
                          color: Colors.white70,
                        ),
                      ),
                      if (description.length > 100 && !_isExpanded)
                        GestureDetector(
                          onTap: () => setState(() => _isExpanded = true),
                          child: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'อ่านเพิ่มเติม...',
                              style: TextStyle(
                                color: Colors.blue.shade400,
                                fontSize: 13,
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
          // Potential subtle divider or just spacing
          const SizedBox(height: 4),

          // Media Display & Full Screen Navigation
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => PostDetailScreen(postData: data),
                ),
              );
            },
            child: (isVideo || (isYoutube && youtubeId != null))
                ? Stack(
                    alignment: Alignment.center,
                    children: [
                      CachedNetworkImage(
                        imageUrl: (isYoutube && youtubeId != null)
                            ? 'https://img.youtube.com/vi/$youtubeId/0.jpg'
                            : (imageUrl ?? mediaUrl ?? ''),
                        width: double.infinity,
                        height: 250,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          height: 250,
                          color: Colors.grey.shade900,
                        ),
                        errorWidget: (context, url, error) => Container(
                          height: 250,
                          color: Colors.black,
                          child: const Icon(
                            Icons.play_circle_outline,
                            color: Colors.white24,
                            size: 50,
                          ),
                        ),
                      ),
                      // Semi-transparent overlay to hint playability
                      Container(
                        height: 250,
                        width: double.infinity,
                        color: Colors.black26,
                      ),
                      // Play Button Icon
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.black45,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white24, width: 2),
                        ),
                        child: const Icon(
                          Icons.play_arrow_rounded,
                          color: Colors.white,
                          size: 40,
                        ),
                      ),
                      // Tag
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            isYoutube ? 'YOUTUBE' : 'VIDEO',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                : mediaUrl != null
                    ? Stack(
                        children: [
                          CachedNetworkImage(
                            imageUrl: mediaUrl,
                            width: double.infinity,
                            height: 300,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              height: 300,
                              color: Colors.grey.shade900,
                            ),
                          ),
                          if (images.length > 1)
                            Positioned(
                              bottom: 10,
                              right: 10,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.7),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '+${images.length - 1} รูป',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      )
                    : const SizedBox.shrink(),
          ),

          const Divider(height: 1, color: Colors.white12),

          // Footer Actions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
            child: Row(
              children: [
                _buildFooterBtn(
                  _isLiked ? Icons.thumb_up_rounded : Icons.thumb_up_outlined,
                  '$_likesCount',
                  _isLiked ? const Color(0xFF4285F4) : Colors.white70,
                  onTap: _handleLike,
                ),
                const SizedBox(width: 8),
                _buildFooterBtn(
                  Icons.chat_bubble_outline,
                  '$commentsCount ความเห็น',
                  Colors.white70,
                  onTap: () => _showCommentsModal(context),
                ),
                const Spacer(),
                _buildFooterBtn(
                  Icons.share_outlined,
                  'แชร์',
                  Colors.white70,
                  onTap: _handleShare,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterBtn(
    IconData icon,
    String label,
    Color color, {
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatTimestamp(dynamic timestamp) {
  if (timestamp == null) return '';
  if (timestamp is Timestamp) {
    final now = DateTime.now();
    final date = timestamp.toDate();
    final diff = now.difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes} นาทีที่แล้ว';
    if (diff.inHours < 24) return '${diff.inHours} ชม. ที่แล้ว';
    return DateFormat('d MMM yyyy').format(date);
  }
  return '';
}

class _CommentsSheet extends StatefulWidget {
  final TukTukItem item;
  const _CommentsSheet({required this.item});

  @override
  State<_CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<_CommentsSheet> {
  final TextEditingController _commentController = TextEditingController();
  bool _isPosting = false;

  Future<void> _submitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _isPosting = true);

    try {
      // 1. Add comment to subcollection
      await FirebaseFirestore.instance
          .collection(widget.item.collectionName)
          .doc(widget.item.id)
          .collection('comments')
          .add({
        'text': text,
        'userId': user.uid,
        'userName': user.displayName ?? 'User',
        'userAvatar': user.photoURL,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // 2. Update comment count on post
      await FirebaseFirestore.instance
          .collection(widget.item.collectionName)
          .doc(widget.item.id)
          .update({
        'commentsCount': FieldValue.increment(1),
      });

      _commentController.clear();
      FocusScope.of(context).unfocus();
    } catch (e) {
      debugPrint('Error posting comment: $e');
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                'ความคิดเห็น',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection(widget.item.collectionName)
                    .doc(widget.item.id)
                    .collection('comments')
                    .orderBy('createdAt', descending: true)
                    .snapshots(),
                builder: (context, snapshot) {
                  // ✅ Handle Mock/Fallback items immediately
                  if (widget.item.id.startsWith('fallback_') ||
                      widget.item.id.startsWith('feed_')) {
                    return _buildEmptyCommentsPlaceholder();
                  }

                  if (snapshot.hasError) {
                    return Center(
                      child: Text('เกิดข้อผิดพลาด: ${snapshot.error}'),
                    );
                  }

                  if (!snapshot.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  final docs = snapshot.data!.docs;
                  if (docs.isEmpty) {
                    return _buildEmptyCommentsPlaceholder();
                  }

                  return ListView.separated(
                    controller: controller,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: docs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final data = docs[index].data() as Map<String, dynamic>;

                      final String? avatar = data['userAvatar'];

                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: Colors.grey.shade100,
                            backgroundImage:
                                (avatar != null && avatar.startsWith('http'))
                                    ? CachedNetworkImageProvider(avatar)
                                    : null,
                            child:
                                (avatar == null || !avatar.startsWith('http'))
                                    ? const Icon(
                                        Icons.person,
                                        size: 16,
                                        color: Colors.grey,
                                      )
                                    : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: const BorderRadius.only(
                                  topRight: Radius.circular(16),
                                  bottomLeft: Radius.circular(16),
                                  bottomRight: Radius.circular(16),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    data['userName'] ?? 'สมาชิก',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    data['text'] ?? '',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.black54,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _formatTimestamp(data['createdAt']),
                                    style: TextStyle(
                                      color: Colors.grey.shade400,
                                      fontSize: 10,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(
                16,
                8,
                16,
                MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    offset: const Offset(0, -2),
                    blurRadius: 5,
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      decoration: InputDecoration(
                        hintText: 'แสดงความคิดเห็น...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _isPosting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : IconButton(
                          icon:
                              const Icon(Icons.send, color: Color(0xFF4285F4)),
                          onPressed: _submitComment,
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyCommentsPlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 48,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            'ยังไม่มีความคิดเห็น\nเป็นคนแรกที่แสดงความเห็น!',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }
}

class CommunityVideoPlayer extends StatefulWidget {
  final String url;
  final bool isYoutube;
  final String? thumbnailUrl;

  const CommunityVideoPlayer({
    super.key,
    required this.url,
    required this.isYoutube,
    this.thumbnailUrl,
  });

  @override
  State<CommunityVideoPlayer> createState() => _CommunityVideoPlayerState();
}

class _CommunityVideoPlayerState extends State<CommunityVideoPlayer> {
  bool _isPlaying = false;
  BetterPlayerController? _betterPlayerController;
  late YoutubePlayerController _youtubeController;

  @override
  void dispose() {
    _betterPlayerController?.dispose();
    if (_isPlaying && widget.isYoutube) {
      _youtubeController.close();
    }
    super.dispose();
  }

  void _playVideo() {
    setState(() {
      _isPlaying = true;
    });

    if (widget.isYoutube) {
      final videoId = YoutubePlayerController.convertUrlToId(widget.url);
      _youtubeController = YoutubePlayerController.fromVideoId(
        videoId: videoId ?? '',
        autoPlay: true,
        params: const YoutubePlayerParams(
          showControls: true,
          showFullscreenButton: true,
        ),
      );
    } else {
      _betterPlayerController = BetterPlayerController(
        const BetterPlayerConfiguration(
          aspectRatio: 16 / 9,
          autoPlay: true,
          looping: true,
          controlsConfiguration: BetterPlayerControlsConfiguration(
            enableSkips: false,
            enableFullscreen: true,
          ),
        ),
        betterPlayerDataSource: BetterPlayerDataSource(
          BetterPlayerDataSourceType.network,
          widget.url,
          cacheConfiguration: const BetterPlayerCacheConfiguration(
            useCache: true,
            maxCacheSize: 10 * 1024 * 1024,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isPlaying) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: GestureDetector(
          onTap: _playVideo,
          child: Stack(
            alignment: Alignment.center,
            children: [
              if (widget.thumbnailUrl != null)
                CachedNetworkImage(
                  imageUrl: widget.thumbnailUrl!,
                  width: double.infinity,
                  height: double.infinity,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(color: Colors.black),
                )
              else if (widget.isYoutube)
                CachedNetworkImage(
                  imageUrl:
                      'https://img.youtube.com/vi/${YoutubePlayerController.convertUrlToId(widget.url)}/0.jpg',
                  width: double.infinity,
                  height: double.infinity,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(color: Colors.black),
                ),
              // Gradient Overlay for Premium look
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.5),
                    ],
                  ),
                ),
              ),
              // Play Button Overlay
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white24, width: 2),
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  color: Colors.white,
                  size: 50,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (widget.isYoutube) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: YoutubePlayer(
          controller: _youtubeController,
          aspectRatio: 16 / 9,
        ),
      );
    } else if (_betterPlayerController != null) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: BetterPlayer(controller: _betterPlayerController!),
      );
    }

    return const AspectRatio(
      aspectRatio: 16 / 9,
      child: Center(child: CircularProgressIndicator()),
    );
  }
}
