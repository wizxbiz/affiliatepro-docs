import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import 'chat_screen.dart';
import 'post_detail_screen.dart';
import 'profile_screen.dart';

class NotificationsScreen extends StatefulWidget {
  final bool isBackButtonEnabled;

  const NotificationsScreen({
    super.key,
    this.isBackButtonEnabled = false,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with TickerProviderStateMixin {
  late AnimationController _mainAnimationController;
  late AnimationController _pulseAnimationController;
  late Animation<double> _fadeAnimation;
  String _selectedFilter = 'all';
  bool _isRefreshing = false;

  final Map<String, NotificationTypeConfig> _typeConfigs = {
    'like': NotificationTypeConfig(
      color: const Color(0xFFFF3B5C),
      icon: Icons.favorite_rounded,
      label: 'ถูกใจ',
      gradient: const LinearGradient(
        colors: [Color(0xFFFF3B5C), Color(0xFFFF6B6B)],
      ),
    ),
    'follow': NotificationTypeConfig(
      color: const Color(0xFF3B9BFF),
      icon: Icons.person_add_alt_1_rounded,
      label: 'ติดตาม',
      gradient: const LinearGradient(
        colors: [Color(0xFF3B9BFF), Color(0xFF6B9BFF)],
      ),
    ),
    'comment': NotificationTypeConfig(
      color: const Color(0xFF00C48C),
      icon: Icons.chat_bubble_rounded,
      label: 'ความคิดเห็น',
      gradient: const LinearGradient(
        colors: [Color(0xFF00C48C), Color(0xFF00E676)],
      ),
    ),
    'system': NotificationTypeConfig(
      color: const Color(0xFFA367DC),
      icon: Icons.notifications_active_rounded,
      label: 'ระบบ',
      gradient: const LinearGradient(
        colors: [Color(0xFFA367DC), Color(0xFFC767DC)],
      ),
    ),
    'admin': NotificationTypeConfig(
      color: const Color(0xFFA367DC),
      icon: Icons.admin_panel_settings_rounded,
      label: 'แอดมิน',
      gradient: const LinearGradient(
        colors: [Color(0xFFA367DC), Color(0xFFC767DC)],
      ),
    ),
    'message': NotificationTypeConfig(
      color: const Color(0xFF00D2FF),
      icon: Icons.message_rounded,
      label: 'ข้อความ',
      gradient: const LinearGradient(
        colors: [Color(0xFF00D2FF), Color(0xFF0088CC)],
      ),
    ),
    'product_chat': NotificationTypeConfig(
      color: const Color(0xFFFFB443),
      icon: Icons.shopping_bag_rounded,
      label: 'สินค้า',
      gradient: const LinearGradient(
        colors: [Color(0xFFFFB443), Color(0xFFFF8E8E)],
      ),
    ),
    'order': NotificationTypeConfig(
      color: const Color(0xFFFFB443),
      icon: Icons.shopping_cart_rounded,
      label: 'คำสั่งซื้อ',
      gradient: const LinearGradient(
        colors: [Color(0xFFFFB443), Color(0xFFFF8E8E)],
      ),
    ),
  };

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _mainAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _mainAnimationController, curve: Curves.easeInOut,),
    );
    _mainAnimationController.forward();

    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _mainAnimationController.dispose();
    _pulseAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Map<String, dynamic>?>(
      stream: TukTukBridge().sessionStream,
      initialData: TukTukBridge().currentSession,
      builder: (context, sessionSnapshot) {
        final session = sessionSnapshot.data;

        return Scaffold(
          backgroundColor: const Color(0xFF0A0E21),
          appBar: _buildAppBar(),
          body: session == null
              ? _buildLoginPrompt()
              : RefreshIndicator(
                  onRefresh: _refreshNotifications,
                  color: const Color(0xFF00F2EA),
                  backgroundColor: const Color(0xFF1A1F35),
                  child: _buildBody(session),
                ),
        );
      },
    );
  }

  Future<void> _refreshNotifications() async {
    setState(() => _isRefreshing = true);
    await Future.delayed(const Duration(milliseconds: 800));
    setState(() => _isRefreshing = false);
  }

  Widget _buildLoginPrompt() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ScaleTransition(
            scale: _pulseAnimationController,
            child: Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  colors: [
                    Colors.orange.withValues(alpha: 0.2),
                    Colors.orange.withValues(alpha: 0.05),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_person_rounded,
                size: 80,
                color: Colors.orange,
              ),
            ),
          ),
          const SizedBox(height: 30),
          Text(
            'ยังไม่ได้เข้าสู่ระบบ',
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือนและอัปเดตต่างๆ',
              textAlign: TextAlign.center,
              style: GoogleFonts.kanit(
                color: Colors.white54,
                fontSize: 15,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 30),
          ElevatedButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/login'),
            icon: const Icon(Icons.login_rounded),
            label: const Text('เข้าสู่ระบบ'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF1A1F35),
      elevation: 0,
      leading: widget.isBackButtonEnabled
          ? IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white, size: 16,),
              ),
              onPressed: () => Navigator.maybePop(context),
            )
          : null,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFFF3B5C), Color(0xFFFFB443)],
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.notifications_rounded,
                color: Colors.white, size: 20,),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              'การแจ้งเตือน',
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      actions: [
        StreamBuilder<Map<String, dynamic>?>(
          stream: TukTukBridge().sessionStream,
          initialData: TukTukBridge().currentSession,
          builder: (context, sessionSnap) {
            final uid =
                sessionSnap.data?['uid'] ?? sessionSnap.data?['lineUserId'];
            if (uid == null) return const SizedBox();

            return Container(
              margin: const EdgeInsets.only(right: 8),
              child: IconButton(
                icon: Stack(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        shape: BoxShape.circle,
                        border:
                            Border.all(color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      child: const Icon(Icons.done_all_rounded,
                          color: Colors.orange, size: 18,),
                    ),
                  ],
                ),
                onPressed: () => _showMarkAllReadDialog(uid),
              ),
            );
          },
        ),
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
            ),
            child:
                const Icon(Icons.tune_rounded, color: Colors.white70, size: 18),
          ),
          onPressed: _showNotificationSettings,
        ),
      ],
    );
  }

  Future<void> _showMarkAllReadDialog(String uid) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1F35),
        title: const Text(
          'อ่านทั้งหมด',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'ต้องการทำเครื่องหมายว่าอ่านแจ้งเตือนทั้งหมดหรือไม่?',
          style: TextStyle(color: Colors.white70),
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('ยกเลิก', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('ยืนยัน'),
          ),
        ],
      ),
    );

    if (result == true) {
      await _markAllAsRead(uid);
    }
  }

  Future<void> _markAllAsRead(String uid) async {
    try {
      final snap = await FirebaseFirestore.instance
          .collection('notifications')
          .where('recipientId', whereIn: [uid, 'all'])
          .where('read', isEqualTo: false)
          .limit(50)
          .get();

      if (snap.docs.isEmpty) {
        _showSnackBar('ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน', isError: true);
        return;
      }

      final batch = FirebaseFirestore.instance.batch();
      for (final doc in snap.docs) {
        batch.update(doc.reference, {
          'read': true,
          'readAt': FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();

      _showSnackBar('อ่านแจ้งเตือนทั้งหมด ${snap.docs.length} รายการแล้ว');
    } catch (e) {
      _showSnackBar('เกิดข้อผิดพลาด: $e', isError: true);
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError
                  ? Icons.error_outline_rounded
                  : Icons.check_circle_rounded,
              color: Colors.white,
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.kanit())),
          ],
        ),
        backgroundColor: isError ? Colors.redAccent : Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Widget _buildBody(Map<String, dynamic> session) {
    final uid = session['uid'] ?? session['lineUserId'];
    final stream = FirebaseFirestore.instance
        .collection('notifications')
        .where('recipientId', whereIn: [uid, 'all'])
        .orderBy('createdAt', descending: true)
        .limit(100)
        .snapshots();

    return FadeTransition(
      opacity: _fadeAnimation,
      child: StreamBuilder<QuerySnapshot>(
        stream: stream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting &&
              !_isRefreshing) {
            return _buildLoadingShimmer();
          }

          if (snapshot.hasError) {
            return _buildErrorState(snapshot.error.toString());
          }

          final allNotifications = (snapshot.data?.docs ?? []).map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            data['id'] = doc.id;
            data['_ref'] = doc.reference;
            return data;
          }).toList();

          final filteredNotifications = _selectedFilter == 'all'
              ? allNotifications
              : allNotifications
                  .where((n) => n['type'] == _selectedFilter)
                  .toList();

          final unreadCount =
              allNotifications.where((n) => n['read'] == false).length;
          final typeCounts = _getTypeCounts(allNotifications);

          return Column(
            children: [
              _buildFilterBar(allNotifications, unreadCount, typeCounts),
              if (filteredNotifications.isEmpty)
                Expanded(child: _buildEmptyState())
              else
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
                    itemCount: filteredNotifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final note = filteredNotifications[index];
                      return _buildNotificationItem(note, index);
                    },
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Map<String, int> _getTypeCounts(List<Map<String, dynamic>> notifications) {
    final counts = <String, int>{};
    for (final n in notifications) {
      final type = n['type'] ?? 'system';
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return counts;
  }

  Widget _buildFilterBar(List<Map<String, dynamic>> all, int unreadCount,
      Map<String, int> typeCounts,) {
    final filters = [
      {
        'key': 'all',
        'label': 'ทั้งหมด',
        'count': all.length,
        'unread': unreadCount,
        'color': Colors.white,
      },
      {
        'key': 'message',
        'label': 'ข้อความ',
        'count': typeCounts['message'] ?? 0,
        'color': _typeConfigs['message']!.color,
      },
      {
        'key': 'product_chat',
        'label': 'สินค้า',
        'count': typeCounts['product_chat'] ?? 0,
        'color': _typeConfigs['product_chat']!.color,
      },
      {
        'key': 'like',
        'label': 'ถูกใจ',
        'count': typeCounts['like'] ?? 0,
        'color': _typeConfigs['like']!.color,
      },
      {
        'key': 'follow',
        'label': 'ติดตาม',
        'count': typeCounts['follow'] ?? 0,
        'color': _typeConfigs['follow']!.color,
      },
      {
        'key': 'comment',
        'label': 'ความคิดเห็น',
        'count': typeCounts['comment'] ?? 0,
        'color': _typeConfigs['comment']!.color,
      },
      {
        'key': 'order',
        'label': 'คำสั่งซื้อ',
        'count': typeCounts['order'] ?? 0,
        'color': _typeConfigs['order']!.color,
      },
      {
        'key': 'system',
        'label': 'ระบบ',
        'count': typeCounts['system'] ?? 0,
        'color': _typeConfigs['system']!.color,
      },
    ];

    return Container(
      height: 60,
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final filter = filters[i];
          final isSelected = _selectedFilter == filter['key'];
          final color = filter['color'] as Color;

          return Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () =>
                  setState(() => _selectedFilter = filter['key'] as String),
              borderRadius: BorderRadius.circular(25),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? LinearGradient(
                          colors: [
                            color.withValues(alpha: 0.3),
                            color.withValues(alpha: 0.1),
                          ],
                        )
                      : null,
                  color: isSelected ? null : Colors.white.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(
                    color: isSelected
                        ? color.withValues(alpha: 0.5)
                        : Colors.white.withValues(alpha: 0.1),
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      filter['label'] as String,
                      style: GoogleFonts.kanit(
                        color: isSelected ? color : Colors.white54,
                        fontSize: 13,
                        fontWeight:
                            isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    if ((filter['count'] as int) > 0) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2,),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? color
                              : Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          filter['count'].toString(),
                          style: GoogleFonts.kanit(
                            color: isSelected ? Colors.white : Colors.white54,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                    if (filter['key'] == 'all' && unreadCount > 0) ...[
                      const SizedBox(width: 6),
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLoadingShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.white.withValues(alpha: 0.1),
      highlightColor: Colors.white.withValues(alpha: 0.2),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 8,
        itemBuilder: (context, index) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      height: 16,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 100,
                      height: 12,
                      color: Colors.white,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
            ),
            child: const Icon(Icons.error_outline_rounded,
                size: 50, color: Colors.redAccent,),
          ),
          const SizedBox(height: 20),
          Text(
            'เกิดข้อผิดพลาด',
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              error.length > 100 ? '${error.substring(0, 100)}...' : error,
              textAlign: TextAlign.center,
              style: GoogleFonts.kanit(
                color: Colors.white54,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => setState(() {}),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent.withValues(alpha: 0.1),
              foregroundColor: Colors.redAccent,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.redAccent.withValues(alpha: 0.2)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text('ลองอีกครั้ง'),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> note, int index) {
    final type = note['type'] ?? 'system';
    final config = _typeConfigs[type] ?? _typeConfigs['system']!;
    final isRead = note['read'] ?? false;
    final timeAgo = _getTimeAgo(note['createdAt']);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _handleNotificationTap(note),
        onLongPress: () => _showNotificationActions(note),
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isRead
                  ? [
                      Colors.white.withValues(alpha: 0.02),
                      Colors.white.withValues(alpha: 0.01),
                    ]
                  : [
                      config.color.withValues(alpha: 0.1),
                      Colors.transparent,
                    ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isRead
                  ? Colors.white.withValues(alpha: 0.05)
                  : config.color.withValues(alpha: 0.3),
              width: isRead ? 1 : 1.5,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar with animated badge
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        colors: [
                          config.color.withValues(alpha: 0.2),
                          config.color.withValues(alpha: 0.05),
                        ],
                      ),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isRead
                            ? Colors.white.withValues(alpha: 0.1)
                            : config.color.withValues(alpha: 0.3),
                        width: 2,
                      ),
                    ),
                    child: CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.transparent,
                      backgroundImage: note['senderAvatar'] != null &&
                              note['senderAvatar'].isNotEmpty
                          ? CachedNetworkImageProvider(note['senderAvatar'])
                          : null,
                      child: note['senderAvatar'] == null ||
                              note['senderAvatar'].isEmpty
                          ? Icon(
                              config.icon,
                              color: config.color.withValues(alpha: 0.5),
                              size: 28,
                            )
                          : null,
                    ),
                  ),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: TweenAnimationBuilder<double>(
                      duration: Duration(milliseconds: 500 + (index * 50)),
                      tween: Tween(begin: 0.0, end: 1.0),
                      builder: (context, value, child) {
                        return Transform.scale(
                          scale: value,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              gradient: config.gradient,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFF0A0E21),
                                width: 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: config.color.withValues(alpha: 0.5),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Icon(config.icon,
                                size: 12, color: Colors.white,),
                          ),
                        );
                      },
                    ),
                  ),
                  if (!isRead)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 16),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            note['senderName'] ??
                                (type == 'system' ? 'ระบบ TukTuk' : 'ผู้ใช้'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.kanit(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight:
                                  isRead ? FontWeight.w500 : FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2,),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.03),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            timeAgo,
                            style: GoogleFonts.kanit(
                              color: Colors.white38,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Type badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2,),
                      decoration: BoxDecoration(
                        color: config.color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: config.color.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(config.icon, color: config.color, size: 10),
                          const SizedBox(width: 4),
                          Text(
                            config.label,
                            style: GoogleFonts.kanit(
                              color: config.color,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Notification text
                    Text(
                      note['text'] ?? note['title'] ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.kanit(
                        color: isRead ? Colors.white54 : Colors.white70,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),

                    // Image preview
                    if (note['postImage'] != null ||
                        note['imageUrl'] != null) ...[
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            CachedNetworkImage(
                              imageUrl: note['postImage'] ?? note['imageUrl'],
                              height: 80,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                color: Colors.white.withValues(alpha: 0.05),
                                child: const Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.orangeAccent,),
                                  ),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: Colors.white.withValues(alpha: 0.05),
                                child: const Icon(Icons.broken_image,
                                    color: Colors.white24,),
                              ),
                            ),
                            Positioned(
                              bottom: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4,),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.6),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.image_rounded,
                                        color: Colors.white70, size: 12,),
                                    SizedBox(width: 4),
                                    Text(
                                      'ดูรูป',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTimeAgo(dynamic timestamp) {
    if (timestamp == null) return '';

    DateTime date;
    if (timestamp is Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp is DateTime) {
      date = timestamp;
    } else if (timestamp is String) {
      date = DateTime.tryParse(timestamp) ?? DateTime.now();
    } else {
      return '';
    }

    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) return 'เมื่อสักครู่';
    if (diff.inMinutes < 60) return '${diff.inMinutes} นาที';
    if (diff.inHours < 24) return '${diff.inHours} ชั่วโมง';
    if (diff.inDays == 1) return 'เมื่อวาน';
    if (diff.inDays < 7) return '${diff.inDays} วัน';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()} สัปดาห์';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()} เดือน';
    return '${(diff.inDays / 365).floor()} ปี';
  }

  void _showNotificationActions(Map<String, dynamic> note) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading:
                  const Icon(Icons.mark_chat_read_rounded, color: Colors.blue),
              title: const Text('ทำเครื่องหมายว่าอ่านแล้ว'),
              onTap: () {
                Navigator.pop(context);
                FirebaseFirestore.instance
                    .collection('notifications')
                    .doc(note['id'])
                    .update({'read': true});
              },
            ),
            ListTile(
              leading:
                  const Icon(Icons.delete_outline_rounded, color: Colors.red),
              title: const Text('ลบการแจ้งเตือน'),
              onTap: () {
                Navigator.pop(context);
                _showDeleteConfirmDialog(note);
              },
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Future<void> _showDeleteConfirmDialog(Map<String, dynamic> note) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1F35),
        title:
            const Text('ลบการแจ้งเตือน', style: TextStyle(color: Colors.white)),
        content: const Text(
          'ต้องการลบการแจ้งเตือนนี้หรือไม่?',
          style: TextStyle(color: Colors.white70),
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('ยกเลิก', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('ลบ'),
          ),
        ],
      ),
    );

    if (result == true) {
      await FirebaseFirestore.instance
          .collection('notifications')
          .doc(note['id'])
          .delete();
      _showSnackBar('ลบการแจ้งเตือนแล้ว');
    }
  }

  String _formatTime(dynamic timestamp) {
    if (timestamp == null) return '';

    try {
      if (timestamp is Timestamp) {
        return DateFormat('dd MMM yyyy HH:mm', 'th').format(timestamp.toDate());
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  Future<void> _handleNotificationTap(Map<String, dynamic> note) async {
    if (note['read'] == false) {
      FirebaseFirestore.instance
          .collection('notifications')
          .doc(note['id'])
          .update({'read': true}).catchError(
              (e) => debugPrint('Read error: $e'),);
    }

    final type = note['type'];
    final senderId = note['senderId'];
    final relatedId = note['relatedId'];
    final relatedCollection = note['relatedCollection'] ?? 'community_posts';

    if (type == 'follow' && senderId != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              ProfileScreen(userId: senderId, isBackButtonEnabled: true),
        ),
      );
    } else if ((type == 'like' || type == 'comment') && relatedId != null) {
      _navigateToPost(relatedId, relatedCollection);
    } else if (type == 'message' && relatedId != null && senderId != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            conversationId: relatedId,
            otherUserId: senderId,
            otherUserName: note['senderName'] ?? 'ผู้ใช้',
            otherUserPhoto: note['senderAvatar'],
          ),
        ),
      );
    } else if (type == 'product_chat' &&
        relatedId != null &&
        senderId != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ChatScreen(
            conversationId: relatedId,
            otherUserId: senderId,
            otherUserName: note['senderName'] ?? 'ผู้ซื้อ/ขาย',
            otherUserPhoto: note['senderAvatar'],
            collection: 'product_chats',
          ),
        ),
      );
    } else {
      _showNotificationDetail(note);
    }
  }

  void _showNotificationDetail(Map<String, dynamic> note) {
    final type = note['type'] ?? 'system';
    final config = _typeConfigs[type] ?? _typeConfigs['system']!;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1A1F35), Color(0xFF0A0E21)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),

            // Header with gradient
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    config.color.withValues(alpha: 0.2),
                    Colors.transparent,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: config.gradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: config.color.withValues(alpha: 0.3),
                          blurRadius: 12,
                        ),
                      ],
                    ),
                    child: Icon(config.icon, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          note['title'] ?? 'การแจ้งเตือน',
                          style: GoogleFonts.kanit(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          note['senderName'] ?? 'ระบบ TukTuk',
                          style: GoogleFonts.kanit(
                            color: Colors.white54,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.05),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close,
                          color: Colors.white54, size: 20,),
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            const Divider(color: Colors.white10, height: 1),

            // Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  if (note['postImage'] != null || note['imageUrl'] != null)
                    Container(
                      height: 250,
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border:
                            Border.all(color: Colors.white.withValues(alpha: 0.1)),
                        image: DecorationImage(
                          image: CachedNetworkImageProvider(
                              note['postImage'] ?? note['imageUrl'],),
                          fit: BoxFit.cover,
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            bottom: 12,
                            right: 12,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.zoom_in_rounded,
                                      color: Colors.white70, size: 16,),
                                  SizedBox(width: 4),
                                  Text('แตะเพื่อขยาย',
                                      style: TextStyle(color: Colors.white70),),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.02),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: config.color.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(config.icon,
                                  color: config.color, size: 16,),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'รายละเอียด',
                              style: GoogleFonts.kanit(
                                color: Colors.white70,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          note['text'] ?? 'ไม่มีรายละเอียดเพิ่มเติม',
                          style: GoogleFonts.kanit(
                            color: Colors.white70,
                            fontSize: 16,
                            height: 1.6,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Metadata
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.02),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.access_time_rounded,
                            color: Colors.white38, size: 18,),
                        const SizedBox(width: 12),
                        Text(
                          'ได้รับเมื่อ ${_formatTime(note['createdAt'])}',
                          style: GoogleFonts.kanit(
                            color: Colors.white38,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Action buttons
                  if (note['type'] == 'follow' || note['type'] == 'message')
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              _handleNotificationTap(note);
                            },
                            icon: Icon(
                              note['type'] == 'follow'
                                  ? Icons.person
                                  : Icons.chat,
                            ),
                            label: Text(
                              note['type'] == 'follow'
                                  ? 'ดูโปรไฟล์'
                                  : 'ตอบกลับ',
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: config.color,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
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
    );
  }

  Future<void> _navigateToPost(String relatedId, String collection) async {
    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Colors.orangeAccent),
          ),
        ),
      );

      final doc = await FirebaseFirestore.instance
          .collection(collection)
          .doc(relatedId)
          .get();

      if (context.mounted) Navigator.pop(context);

      if (doc.exists) {
        final postData = doc.data() as Map<String, dynamic>;
        postData['id'] = doc.id;

        if (context.mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => PostDetailScreen(postData: postData),
            ),
          );
        }
      } else {
        if (context.mounted) {
          _showSnackBar('ไม่พบโพสต์นี้ (อาจถูกลบไปแล้ว)', isError: true);
        }
      }
    } catch (e) {
      if (context.mounted) Navigator.pop(context);
      debugPrint('Error fetching post: $e');
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated icon
            TweenAnimationBuilder<double>(
              duration: const Duration(seconds: 2),
              tween: Tween(begin: 0.0, end: 1.0),
              builder: (context, value, child) {
                return Transform.scale(
                  scale: 0.8 + (value * 0.2),
                  child: Container(
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          Colors.white.withValues(alpha: 0.05),
                          Colors.white.withValues(alpha: 0.02),
                        ],
                      ),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: const Icon(
                      Icons.notifications_none_rounded,
                      size: 80,
                      color: Colors.white24,
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 30),
            Text(
              _selectedFilter == 'all'
                  ? 'ไม่มีการแจ้งเตือน'
                  : 'ไม่มีการแจ้งเตือนประเภทนี้',
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                _selectedFilter == 'all'
                    ? 'เมื่อมีการแจ้งเตือนใหม่ จะปรากฏที่นี่'
                    : 'ยังไม่มีการแจ้งเตือนประเภทที่เลือก',
                textAlign: TextAlign.center,
                style: GoogleFonts.kanit(
                  color: Colors.white38,
                  fontSize: 15,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 40),
            ElevatedButton.icon(
              onPressed: () => setState(() {}),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('รีเฟรช'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: 0.05),
                foregroundColor: Colors.white70,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
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

  void _showNotificationSettings() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1F35),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFF6B6B), Color(0xFFFF8E8E)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.settings_rounded,
                        color: Colors.white, size: 24,),
                  ),
                  const SizedBox(width: 16),
                  const Text(
                    'ตั้งค่าการแจ้งเตือน',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: Colors.white10, height: 30),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildSettingsSection('ทั่วไป', [
                    _buildSettingTile(
                      icon: Icons.notifications_active_rounded,
                      title: 'การแจ้งเตือนทั้งหมด',
                      subtitle: 'เปิด/ปิดการแจ้งเตือนทั้งหมด',
                      color: Colors.orange,
                      value: true,
                    ),
                    _buildSettingTile(
                      icon: Icons.notifications_off_outlined,
                      title: 'โหมดห้ามรบกวน',
                      subtitle: 'ปิดเสียงแจ้งเตือนชั่วคราว',
                      color: Colors.blue,
                      value: false,
                    ),
                    _buildSettingTile(
                      icon: Icons.vibration,
                      title: 'สั่น',
                      subtitle: 'เมื่อมีการแจ้งเตือนใหม่',
                      color: Colors.purple,
                      value: true,
                    ),
                  ]),
                  const SizedBox(height: 24),
                  _buildSettingsSection('ประเภทการแจ้งเตือน', [
                    _buildSettingTile(
                      icon: Icons.favorite_rounded,
                      title: 'ถูกใจและความคิดเห็น',
                      subtitle: 'เมื่อมีคนถูกใจหรือคอมเมนต์',
                      color: const Color(0xFFFF3B5C),
                      value: true,
                    ),
                    _buildSettingTile(
                      icon: Icons.person_add_alt_1_rounded,
                      title: 'การติดตาม',
                      subtitle: 'เมื่อมีคนติดตามคุณ',
                      color: const Color(0xFF3B9BFF),
                      value: true,
                    ),
                    _buildSettingTile(
                      icon: Icons.message_rounded,
                      title: 'ข้อความ',
                      subtitle: 'เมื่อมีข้อความใหม่',
                      color: const Color(0xFF00D2FF),
                      value: true,
                    ),
                    _buildSettingTile(
                      icon: Icons.shopping_bag_rounded,
                      title: 'ออเดอร์และสินค้า',
                      subtitle: 'สถานะออเดอร์และการขาย',
                      color: const Color(0xFFFFB443),
                      value: false,
                    ),
                    _buildSettingTile(
                      icon: Icons.admin_panel_settings_rounded,
                      title: 'ระบบและโปรโมชั่น',
                      subtitle: 'ข่าวสารจาก TukTuk',
                      color: const Color(0xFFA367DC),
                      value: true,
                    ),
                  ]),
                  const SizedBox(height: 24),
                  _buildSettingsSection('เสียง', [
                    _buildSoundSetting(),
                  ]),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 12),
          child: Text(
            title,
            style: GoogleFonts.kanit(
              color: Colors.orangeAccent,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.02),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required bool value,
  }) {
    return StatefulBuilder(
      builder: (context, setState) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.kanit(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.kanit(
                      color: Colors.white38,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Switch.adaptive(
              value: value,
              onChanged: (v) => setState(() => value = v),
              activeColor: color,
              activeTrackColor: color.withValues(alpha: 0.3),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSoundSetting() {
    return StatefulBuilder(
      builder: (context, setState) {
        String selectedSound = 'เสียงมาตรฐาน';
        double volume = 0.7;

        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.volume_up_rounded,
                        color: Colors.green, size: 20,),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'เสียงแจ้งเตือน',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'เลือกรูปแบบเสียง',
                          style: TextStyle(color: Colors.white38, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedSound,
                dropdownColor: const Color(0xFF1A1F35),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.03),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                items:
                    ['เสียงมาตรฐาน', 'เสียงนุ่มนวล', 'เสียงดัง', 'ไม่มีเสียง']
                        .map((sound) => DropdownMenuItem(
                              value: sound,
                              child: Text(sound),
                            ),)
                        .toList(),
                onChanged: (v) => setState(() => selectedSound = v!),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.volume_down_rounded, color: Colors.white38),
                  Expanded(
                    child: Slider(
                      value: volume,
                      onChanged: (v) => setState(() => volume = v),
                      activeColor: Colors.green,
                    ),
                  ),
                  const Icon(Icons.volume_up_rounded, color: Colors.white38),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class NotificationTypeConfig {
  final Color color;
  final IconData icon;
  final String label;
  final LinearGradient gradient;

  NotificationTypeConfig({
    required this.color,
    required this.icon,
    required this.label,
    required this.gradient,
  });
}
