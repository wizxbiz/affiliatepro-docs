import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;

class CommentsSheet extends StatefulWidget {
  final String postId;
  final String collection; // 'community_posts' or 'posts'

  const CommentsSheet({
    super.key,
    required this.postId,
    this.collection = 'community_posts',
  });

  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet>
    with SingleTickerProviderStateMixin {
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  final TukTukBridge _bridge = TukTukBridge();

  bool _isPosting = false;
  Map<String, dynamic>? _currentUser;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _loadCurrentUser();
    _animationController.forward();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _focusNode.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentUser() async {
    final user = await _bridge.getCurrentUser();
    if (mounted) {
      setState(() => _currentUser = user);
    }
  }

  void _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    if (_currentUser == null) {
      _showLoginPrompt();
      return;
    }

    if (ProfanityFilter.hasProfanity(text)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กรุณาใช้คำสุภาพและหลีกเลี่ยงเนื้อหาที่ไม่เหมาะสม'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isPosting = true);

    try {
      final userId =
          (_currentUser!['uid'] ?? _currentUser!['lineUserId'])?.toString() ??
              'unknown';

      // Use TukTukBridge for atomic write + points award
      await _bridge.addCommentToPost(
        widget.collection,
        widget.postId,
        {
          'text': text,
          'userId': userId,
          'userName': _currentUser!['displayName']?.toString() ?? 'User',
          'userPic': _currentUser!['pictureUrl']?.toString() ?? '',
        },
      );

      final postRef = FirebaseFirestore.instance
          .collection(widget.collection)
          .doc(widget.postId);

      // Send notification to author
      try {
        final postDoc = await postRef.get();
        if (postDoc.exists) {
          final postData = postDoc.data() as Map<String, dynamic>;
          final authorId = postData['authorId'] ?? postData['userId'];
          if (authorId != null && authorId != userId) {
            await _bridge.sendNotification(
              recipientId: authorId,
              type: 'comment',
              title: 'แสดงความคิดเห็นในโพสต์ของคุณ',
              message: text,
              relatedId: widget.postId,
              relatedCollection: widget.collection,
              imageUrl: postData['thumbnailUrl'] ??
                  postData['videoUrl'] ??
                  postData['imageUrl'],
            );
          }
        }
      } catch (e) {
        debugPrint('Comment notification error: $e');
      }

      _commentController.clear();
      _focusNode.unfocus();

      if (!mounted) return;
      // Show success animation
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 10),
              Text('ส่งความคิดเห็นสำเร็จ'),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 2),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('ส่งความคิดเห็นล้มเหลว: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  void _showLoginPrompt() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF2C2C2C),
        title: const Text('กรุณาเข้าสู่ระบบ',
            style: TextStyle(color: Colors.white),),
        content: const Text(
          'คุณต้องเข้าสู่ระบบก่อนแสดงความคิดเห็น',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('ปิด'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to login screen
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
            child: const Text('เข้าสู่ระบบ'),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleLikeComment(String commentId, int currentLikes) async {
    if (_currentUser == null) {
      _showLoginPrompt();
      return;
    }

    try {
      final userId =
          (_currentUser!['uid'] ?? _currentUser!['lineUserId'])?.toString() ??
              'unknown';
      final commentRef = FirebaseFirestore.instance
          .collection(widget.collection)
          .doc(widget.postId)
          .collection('comments')
          .doc(commentId);

      final likeRef = commentRef.collection('likes').doc(userId);
      final likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        // Unlike
        await likeRef.delete();
        await commentRef.update({'likes': FieldValue.increment(-1)});
      } else {
        // Like
        await likeRef.set({
          'userId': userId,
          'timestamp': FieldValue.serverTimestamp(),
        });
        await commentRef.update({'likes': FieldValue.increment(1)});
      }
    } catch (e) {
      debugPrint('Error toggling comment like: $e');
    }
  }

  Future<void> _deleteComment(String commentId) async {
    try {
      await FirebaseFirestore.instance
          .collection(widget.collection)
          .doc(widget.postId)
          .collection('comments')
          .doc(commentId)
          .delete();

      // Update comment count
      await FirebaseFirestore.instance
          .collection(widget.collection)
          .doc(widget.postId)
          .update({'commentsCount': FieldValue.increment(-1)});

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ลบความคิดเห็นแล้ว'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('ไม่สามารถลบได้: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showCommentOptions(String commentId, String? commentUserId) {
    final currentUid = _currentUser?['uid']?.toString();
    final currentLineId = _currentUser?['lineUserId']?.toString();
    final isOwner = _currentUser != null &&
        commentUserId != null &&
        (commentUserId == currentUid || commentUserId == currentLineId);

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF2C2C2C),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isOwner)
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: const Text('ลบความคิดเห็น',
                    style: TextStyle(color: Colors.red),),
                onTap: () {
                  Navigator.pop(context);
                  _deleteComment(commentId);
                },
              ),
            ListTile(
              leading: const Icon(Icons.report_outlined, color: Colors.orange),
              title: const Text('รายงานความคิดเห็น',
                  style: TextStyle(color: Colors.white),),
              onTap: () {
                Navigator.pop(context);
                // Implement report functionality
              },
            ),
            ListTile(
              leading: const Icon(Icons.close, color: Colors.white54),
              title:
                  const Text('ยกเลิก', style: TextStyle(color: Colors.white54)),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animationController,
      child: Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Color(0xFF1E1E1E),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(vertical: 15),
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.white10)),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Text(
                      'ความคิดเห็น',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,),
                    ),
                  ),
                  Positioned(
                    right: 15,
                    top: 0,
                    bottom: 0,
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: const Icon(Icons.close,
                          color: Colors.white, size: 20,),
                    ),
                  ),
                ],
              ),
            ),

            // Comments List
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection(widget.collection)
                    .doc(widget.postId)
                    .collection('comments')
                    .orderBy('timestamp', descending: true)
                    .limit(50) // Show first 50 comments
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline,
                              size: 48, color: Colors.red,),
                          const SizedBox(height: 10),
                          Text('เกิดข้อผิดพลาด: ${snapshot.error}',
                              style: const TextStyle(color: Colors.white54),),
                        ],
                      ),
                    );
                  }

                  if (!snapshot.hasData) {
                    return const Center(
                      child: CircularProgressIndicator(color: Colors.orange),
                    );
                  }

                  final comments = snapshot.data!.docs;

                  if (comments.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline,
                              size: 48, color: Colors.white24,),
                          const SizedBox(height: 10),
                          const Text('ยังไม่มีความคิดเห็น',
                              style: TextStyle(color: Colors.white54),),
                          const SizedBox(height: 5),
                          const Text('เป็นคนแรกที่แสดงความคิดเห็น',
                              style: TextStyle(
                                  color: Colors.white24, fontSize: 12,),),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: _focusNode.requestFocus,
                            icon: const Icon(Icons.edit),
                            label: const Text('เขียนความคิดเห็น'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: comments.length,
                    itemBuilder: (context, index) {
                      final doc = comments[index];
                      final data = doc.data() as Map<String, dynamic>;
                      final date = (data['timestamp'] as Timestamp?)?.toDate();
                      final timeAgo =
                          date != null ? timeago.format(date) : 'เมื่อสักครู่';

                      return _buildCommentItem(
                        commentId: doc.id,
                        data: data,
                        timeAgo: timeAgo,
                      );
                    },
                  );
                },
              ),
            ),

            // Input Field
            Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 10,
                top: 10,
                left: 16,
                right: 16,
              ),
              decoration: const BoxDecoration(
                color: Color(0xFF2C2C2C),
                border: Border(top: BorderSide(color: Colors.white10)),
              ),
              child: Row(
                children: [
                  if (_currentUser?['pictureUrl'] != null &&
                      _currentUser?['pictureUrl']
                              .toString()
                              .startsWith('http') ==
                          true)
                    CircleAvatar(
                      radius: 16,
                      backgroundImage:
                          NetworkImage(_currentUser!['pictureUrl'].toString()),
                      backgroundColor: Colors.grey[800],
                    )
                  else
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.grey[800],
                      child: const Icon(Icons.person,
                          size: 16, color: Colors.white54,),
                    ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      focusNode: _focusNode,
                      style: const TextStyle(color: Colors.white),
                      maxLines: null,
                      textInputAction: TextInputAction.newline,
                      decoration: InputDecoration(
                        hintText: 'เพิ่มความคิดเห็น...',
                        hintStyle: const TextStyle(color: Colors.white38),
                        filled: true,
                        fillColor: Colors.black26,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10,),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _postComment(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  _isPosting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.orange,),
                        )
                      : IconButton(
                          icon: const Icon(Icons.send, color: Colors.orange),
                          onPressed: _postComment,
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentItem({
    required String commentId,
    required Map<String, dynamic> data,
    required String timeAgo,
  }) {
    final userId =
        (_currentUser?['uid'] ?? _currentUser?['lineUserId'])?.toString();

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundImage: (data['userPic'] != null &&
                    data['userPic'].toString().startsWith('http'))
                ? NetworkImage(data['userPic'].toString())
                : null,
            backgroundColor: Colors.grey[800],
            child: (data['userPic'] == null ||
                    !data['userPic'].toString().startsWith('http'))
                ? const Icon(Icons.person, color: Colors.white54, size: 18)
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Flexible(
                            child: Text(
                              data['userName']?.toString() ?? 'User',
                              style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            timeAgo,
                            style: const TextStyle(
                                color: Colors.white24, fontSize: 11,),
                          ),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () => _showCommentOptions(
                          commentId, data['userId']?.toString(),),
                      child: const Icon(Icons.more_vert,
                          color: Colors.white24, size: 18,),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  data['text']?.toString() ?? '',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
                const SizedBox(height: 8),
                // Like button
                StreamBuilder<DocumentSnapshot>(
                  stream: FirebaseFirestore.instance
                      .collection(widget.collection)
                      .doc(widget.postId)
                      .collection('comments')
                      .doc(commentId)
                      .collection('likes')
                      .doc(userId)
                      .snapshots(),
                  builder: (context, likeSnapshot) {
                    final isLiked = likeSnapshot.data?.exists ?? false;
                    return GestureDetector(
                      onTap: () =>
                          _toggleLikeComment(commentId, data['likes'] ?? 0),
                      child: Row(
                        children: [
                          Icon(
                            isLiked ? Icons.favorite : Icons.favorite_border,
                            color: isLiked ? Colors.red : Colors.white24,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${data['likes'] ?? 0}',
                            style: TextStyle(
                              color: isLiked ? Colors.red : Colors.white24,
                              fontSize: 12,
                              fontWeight:
                                  isLiked ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
