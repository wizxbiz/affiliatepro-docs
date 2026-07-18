import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// WIN RIDER Chat Screen — separate from normal community chat.
/// Collection: win_rider_chats/{chatId}/messages
/// chatId = sorted([currentUserId, riderId]).join('_')
/// History: auto-purge messages older than 3 days on screen open.
class WinRiderChatScreen extends StatefulWidget {
  final String currentUserId;
  final String riderId;
  final String riderName;
  final String? riderPhotoUrl;
  final String? vehicleLabel; // e.g. "🏍️ มอเตอร์ไซค์"

  const WinRiderChatScreen({
    super.key,
    required this.currentUserId,
    required this.riderId,
    required this.riderName,
    this.riderPhotoUrl,
    this.vehicleLabel,
  });

  @override
  State<WinRiderChatScreen> createState() => _WinRiderChatScreenState();
}

class _WinRiderChatScreenState extends State<WinRiderChatScreen> {
  late final String _chatId;
  late final CollectionReference<Map<String, dynamic>> _messagesRef;
  final TextEditingController _textCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    // chatId is deterministic: sort both IDs so both sides get same doc
    final ids = [widget.currentUserId, widget.riderId]..sort();
    _chatId = ids.join('_');
    _messagesRef = FirebaseFirestore.instance
        .collection('win_rider_chats')
        .doc(_chatId)
        .collection('messages');

    _initChat();
  }

  Future<void> _initChat() async {
    // Create/update metadata so both parties can discover the chat
    await FirebaseFirestore.instance
        .collection('win_rider_chats')
        .doc(_chatId)
        .set(
      {
        'participants': [widget.currentUserId, widget.riderId],
        'riderId': widget.riderId,
        'riderName': widget.riderName,
        'updatedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    // Purge messages older than 3 days
    final cutoff = DateTime.now().subtract(const Duration(days: 3));
    final old = await _messagesRef
        .where('createdAt', isLessThan: Timestamp.fromDate(cutoff))
        .get();
    for (final doc in old.docs) {
      await doc.reference.delete();
    }
  }

  Future<void> _sendMessage() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty || _isSending) return;

    setState(() => _isSending = true);
    _textCtrl.clear();

    try {
      await _messagesRef.add({
        'senderId': widget.currentUserId,
        'text': text,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Update chat metadata with last message preview
      await FirebaseFirestore.instance
          .collection('win_rider_chats')
          .doc(_chatId)
          .update({
        'lastMessage': text,
        'lastSenderId': widget.currentUserId,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Scroll to bottom after send
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollCtrl.hasClients) {
          _scrollCtrl.animateTo(
            _scrollCtrl.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } catch (e) {
      debugPrint('WinRiderChat send error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('ส่งข้อความไม่สำเร็จ', style: GoogleFonts.kanit()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  void dispose() {
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // 3-day history notice
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            color: const Color(0xFF00D2FF).withValues(alpha: 0.08),
            child: Text(
              'ประวัติแชทเก็บไว้ 3 วัน · เฉพาะคุณและวินเห็น',
              textAlign: TextAlign.center,
              style: GoogleFonts.kanit(
                color: Colors.white38,
                fontSize: 11,
              ),
            ),
          ),
          Expanded(child: _buildMessageList()),
          _buildInputBar(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF0A0E21),
      elevation: 0,
      leading: IconButton(
        onPressed: () => Navigator.pop(context),
        icon: const Icon(
          Icons.arrow_back_ios_new_rounded,
          color: Colors.white,
          size: 20,
        ),
      ),
      title: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFF00D2FF).withValues(alpha: 0.2),
            backgroundImage: (widget.riderPhotoUrl?.isNotEmpty == true)
                ? CachedNetworkImageProvider(widget.riderPhotoUrl!)
                : null,
            child: (widget.riderPhotoUrl?.isNotEmpty != true)
                ? const Icon(
                    Icons.person_rounded,
                    color: Color(0xFF00D2FF),
                    size: 18,
                  )
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.riderName,
                  style: GoogleFonts.kanit(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (widget.vehicleLabel != null)
                  Text(
                    widget.vehicleLabel!,
                    style: GoogleFonts.kanit(
                      color: Colors.white38,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          color: Colors.white.withValues(alpha: 0.08),
        ),
      ),
    );
  }

  Widget _buildMessageList() {
    // Query only messages within the last 3 days
    final cutoff = Timestamp.fromDate(
      DateTime.now().subtract(const Duration(days: 3)),
    );

    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: _messagesRef
          .where('createdAt', isGreaterThan: cutoff)
          .orderBy('createdAt', descending: false)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: Color(0xFF00D2FF)),
          );
        }

        final docs = snapshot.data?.docs ?? [];

        if (docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.04),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.chat_bubble_outline_rounded,
                    color: Color(0xFF00D2FF),
                    size: 40,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'เริ่มต้นการสนทนา',
                  style: GoogleFonts.kanit(
                    color: Colors.white54,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'ส่งข้อความถึง ${widget.riderName}',
                  style: GoogleFonts.kanit(
                    color: Colors.white24,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          );
        }

        // Scroll to bottom when messages load
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollCtrl.hasClients) {
            _scrollCtrl.jumpTo(_scrollCtrl.position.maxScrollExtent);
          }
        });

        return ListView.builder(
          controller: _scrollCtrl,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data();
            final isMe = data['senderId'] == widget.currentUserId;
            final ts = data['createdAt'] as Timestamp?;
            return _buildBubble(
              text: data['text'] ?? '',
              isMe: isMe,
              time: ts?.toDate(),
            );
          },
        );
      },
    );
  }

  Widget _buildBubble({
    required String text,
    required bool isMe,
    DateTime? time,
  }) {
    final timeStr = time != null
        ? '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}'
        : '';

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        decoration: BoxDecoration(
          gradient: isMe
              ? const LinearGradient(
                  colors: [Color(0xFF00D2FF), Color(0xFF0088CC)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isMe ? null : Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isMe ? 18 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 18),
          ),
          border: isMe
              ? null
              : Border.all(color: Colors.white.withValues(alpha: 0.12)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              text,
              style: GoogleFonts.kanit(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
            if (timeStr.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                timeStr,
                style: GoogleFonts.kanit(
                  color: isMe
                      ? Colors.white.withValues(alpha: 0.6)
                      : Colors.white.withValues(alpha: 0.35),
                  fontSize: 10,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: 12 + MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0E21),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
                child: TextField(
                  controller: _textCtrl,
                  style: GoogleFonts.kanit(color: Colors.white, fontSize: 14),
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _sendMessage(),
                  decoration: InputDecoration(
                    hintText: 'พิมพ์ข้อความ...',
                    hintStyle: GoogleFonts.kanit(
                      color: Colors.white38,
                      fontSize: 14,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 12,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: _sendMessage,
              child: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF00D2FF), Color(0xFF0088CC)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00D2FF).withValues(alpha: 0.4),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: _isSending
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(
                        Icons.send_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
