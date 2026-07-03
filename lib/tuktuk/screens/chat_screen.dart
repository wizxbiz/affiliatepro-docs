import 'dart:async';
import 'dart:io';
import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:caculateapp/tuktuk/services/chat_service.dart';
import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:caculateapp/tuktuk/utils/profanity_filter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';

import 'call_screen.dart';

// ─────────────────────────────────────────────────────────────
// TukTuk Chat Screen — Premium LINE-Clone Edition™
// ─────────────────────────────────────────────────────────────
class ChatScreen extends StatefulWidget {
  final String conversationId;
  final String otherUserId;
  final String otherUserName;
  final String? otherUserPhoto;
  final String collection;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserPhoto,
    this.collection = 'conversations',
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  final ChatService _chatService = ChatService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  // ✅ Live UID: ดึงทุกครั้งจาก session หรือ FirebaseAuth — ไม่ cache ตอน init
  String? get _currentUid {
    final session = TukTukBridge().currentSession;
    if (session != null) {
      return (session['lineUserId'] as String?) ?? (session['uid'] as String?);
    }
    return FirebaseAuth.instance.currentUser?.uid;
  }

  // Animations
  late AnimationController _typingAnimationController;
  late AnimationController _sendButtonAnimationController;
  late AnimationController _pulseAnimationController;

  // State
  final FocusNode _focusNode = FocusNode();
  bool _isOtherUserTyping = false;
  bool _isSendingImage = false;
  bool _isTyping = false;
  bool _isRecording = false;
  bool _showEmojiPicker = false;
  bool _showProductTag = true;


  int _pickerTab = 0; // 0: Emoji, 1: Stickers
  String? _chatBackground;
  String? _editingMessageId; // ✅ New: For message editing
  String? _editingInitialText;

  final List<String> _stickerUrls = [
    'https://cdn-icons-png.flaticon.com/512/4710/4710478.png',
    'https://cdn-icons-png.flaticon.com/512/4710/4710515.png',
    'https://cdn-icons-png.flaticon.com/512/4710/4710499.png',
    'https://cdn-icons-png.flaticon.com/512/4710/4710487.png',
    'https://cdn-icons-png.flaticon.com/512/4692/4692083.png',
    'https://cdn-icons-png.flaticon.com/512/4692/4692097.png',
    'https://cdn-icons-png.flaticon.com/512/4692/4692113.png',
    'https://cdn-icons-png.flaticon.com/512/4692/4692119.png',
  ];

  // LINE Official Colors — TukTuk Premium White Edition
  static const Color lineGreen = Color(0xFF06C755);
  static const Color lineWhite = Colors.white;
  static const Color lineBackground = Color(0xFFF8F9FA); // Premium Soft White
  static const Color lineInputBg = Color(0xFFFFFFFF);
  static const Color tuktukDark = Color(0xFF0F172A);

  final List<String> _quickReplies = [
    'สวัสดีครับ 👋',
    'สนใจสินค้าครับ 🛒',
    'ขอรายละเอียดเพิ่มเติม',
    'ราคาเท่าไหร่ครับ 💰',
    'ส่งฟรีไหมครับ 🚚',
    'ขอบคุณครับ 🙏',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // ✅ รอ TukTukBridge โหลด session จาก SharedPreferences ก่อนสร้าง UID
    TukTukBridge().ensureInitialized().then((_) {
      if (mounted) {
        _initServices();
        setState(() {}); // rebuild หลัง session พร้อม — แก้ white screen
      }
    });
    _setupTypingListener();
    _messageController.addListener(_onTypingChanged);
    _chatService.setOnlineStatus(true);
    _loadChatBackground();

    _typingAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _pulseAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _sendButtonAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );

    _focusNode.addListener(() {
      if (_focusNode.hasFocus) {
        setState(() => _showEmojiPicker = false);
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _chatService.setOnlineStatus(true);
    } else {
      _chatService.setOnlineStatus(false);
    }
  }

  void _initServices() {
    if (widget.collection == 'product_chats') {
      _chatService.markProductChatAsRead(widget.conversationId);
    } else {
      _chatService.markAsRead(widget.conversationId);
    }
  }

  void _setupTypingListener() {
    FirebaseFirestore.instance
        .collection(widget.collection)
        .doc(widget.conversationId)
        .snapshots()
        .listen((snapshot) {
      if (mounted) {
        final typing = snapshot.data()?['typing'] as Map<String, dynamic>?;
        setState(() {
          _isOtherUserTyping = typing?[widget.otherUserId] == true;
        });
      }
    });
  }

  void _onTypingChanged() {
    final hasText = _messageController.text.isNotEmpty;
    if (hasText != _isTyping) {
      setState(() => _isTyping = hasText);
      _chatService.updateTypingStatus(
        widget.conversationId,
        _isTyping,
        widget.collection,
      );
      if (hasText) {
        _sendButtonAnimationController.forward();
      } else {
        _sendButtonAnimationController.reverse();
      }
    }
  }

  void _handleSendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    if (ProfanityFilter.hasProfanity(text)) {
      _showSnackBar('กรุณาใช้คำสุภาพ', isError: true);
      return;
    }

    if (_editingMessageId != null) {
      // ✅ Handle Editing
      await _chatService.editMessage(
        widget.collection,
        widget.conversationId,
        _editingMessageId!,
        text,
      );
      setState(() {
        _editingMessageId = null;
        _editingInitialText = null;
      });
      _messageController.clear();
      HapticFeedback.mediumImpact();
      return;
    }

    if (widget.collection == 'conversations') {
      final canSend = await _chatService.canSendMessage(widget.conversationId);
      if (!canSend) {
        _showSnackBar('ส่งได้ 1 ข้อความ รอให้อีกฝ่ายตอบรับก่อน', isError: true);
        return;
      }
    }

    if (widget.collection == 'product_chats') {
      _chatService.sendProductMessage(
        widget.conversationId,
        text,
        widget.otherUserId,
      );
    } else {
      _chatService.sendMessage(widget.conversationId, text);
    }
    _messageController.clear();
    HapticFeedback.lightImpact();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _handleSendSticker(String url) {
    if (widget.collection == 'product_chats') {
      _chatService.sendProductMessage(
        widget.conversationId,
        '[สติกเกอร์]',
        widget.otherUserId,
        imageUrl: url,
      );
    } else {
      _chatService.sendMessage(
        widget.conversationId,
        '[สติกเกอร์]',
        type: 'sticker',
        imageUrl: url,
      );
    }
    setState(() => _showEmojiPicker = false);
    HapticFeedback.mediumImpact();
    // Scroll will happen automatically via stream update
  }

  void _showBubbleOptions(
    BuildContext context,
    String messageId,
    String text,
    bool isMe,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (text.isNotEmpty &&
                  text != '[รูปภาพ]' &&
                  text != '[สติกเกอร์]')
                ListTile(
                  leading: const Icon(Icons.copy_rounded, color: Colors.blue),
                  title: Text('คัดลอกข้อความ', style: GoogleFonts.kanit()),
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: text));
                    Navigator.pop(context);
                    _showSnackBar('คัดลอกแล้ว');
                  },
                ),
              if (isMe) ...[
                ListTile(
                  leading: const Icon(Icons.edit_rounded, color: Colors.green),
                  title: Text('แก้ไขข้อความ', style: GoogleFonts.kanit()),
                  onTap: () {
                    Navigator.pop(context);
                    setState(() {
                      _editingMessageId = messageId;
                      _editingInitialText = text;
                      _messageController.text = text;
                      _focusNode.requestFocus();
                    });
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.undo_rounded, color: Colors.orange),
                  title:
                      Text('ยกเลิกการส่ง (Unsend)', style: GoogleFonts.kanit()),
                  subtitle: Text(
                    'ผู้รับจะไม่เห็นข้อความนี้',
                    style: GoogleFonts.kanit(fontSize: 12),
                  ),
                  onTap: () {
                    _chatService.unsendMessage(
                      widget.collection,
                      widget.conversationId,
                      messageId,
                    );
                    Navigator.pop(context);
                  },
                ),
              ],
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'ยกเลิก',
                  style: GoogleFonts.kanit(color: Colors.grey),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleQuickReply(String text) {
    _messageController.text = text;
    _handleSendMessage();
  }

  void _handleImagePick() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (pickedFile != null) {
      setState(() => _isSendingImage = true);
      final url = await _chatService.uploadChatImage(
        widget.conversationId,
        File(pickedFile.path),
        widget.collection,
      );
      if (url != null) {
        if (widget.collection == 'product_chats') {
          _chatService.sendProductMessage(
            widget.conversationId,
            '[รูปภาพ]',
            widget.otherUserId,
            imageUrl: url,
          );
        } else {
          _chatService.sendMessage(
            widget.conversationId,
            '[รูปภาพ]',
            imageUrl: url,
          );
        }
      }
      if (mounted) setState(() => _isSendingImage = false);
    }
  }

  Future<void> _loadChatBackground() async {
    final prefs = await SharedPreferences.getInstance();
    final bg = prefs.getString('chat_bg_${widget.conversationId}');
    // ✅ Clear stale path if file no longer exists (prevents white screen)
    if (bg != null && !File(bg).existsSync()) {
      await prefs.remove('chat_bg_${widget.conversationId}');
      if (mounted) setState(() => _chatBackground = null);
      return;
    }
    if (mounted) setState(() => _chatBackground = bg);
  }

  Future<void> _changeChatBackground() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        'chat_bg_${widget.conversationId}',
        pickedFile.path,
      );
      if (mounted) {
        setState(() => _chatBackground = pickedFile.path);
        _showSnackBar('เปลี่ยนพื้นหลังเรียบร้อยแล้ว');
      }
    }
  }

  void _handleVoiceRecord() {
    HapticFeedback.mediumImpact();
    setState(() => _isRecording = !_isRecording);
  }

  void _toggleEmojiPicker() {
    if (_showEmojiPicker) {
      _focusNode.requestFocus();
    } else {
      _focusNode.unfocus();
    }
    setState(() => _showEmojiPicker = !_showEmojiPicker);
  }

  String _formatMessageTime(DateTime time) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    if (time.isAfter(today)) {
      return DateFormat('HH:mm').format(time);
    } else if (time.isAfter(today.subtract(const Duration(days: 1)))) {
      return 'เมื่อวาน ${DateFormat('HH:mm').format(time)}';
    } else {
      return DateFormat('d MMM HH:mm', 'th').format(time);
    }
  }

  bool _shouldShowDate(List<QueryDocumentSnapshot> messages, int index) {
    if (index == messages.length - 1) return true;
    final curr = (messages[index].data() as Map)['timestamp'] ??
        (messages[index].data() as Map)['sentAt'];
    final older = (messages[index + 1].data() as Map)['timestamp'] ??
        (messages[index + 1].data() as Map)['sentAt'];
    if (curr == null || older == null) return false;
    final cD = (curr as Timestamp).toDate();
    final oD = (older as Timestamp).toDate();
    return DateTime(cD.year, cD.month, cD.day) !=
        DateTime(oD.year, oD.month, oD.day);
  }

  void _showSnackBar(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.kanit()),
        backgroundColor: isError ? Colors.redAccent : lineGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showImagePreview(String url) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            InteractiveViewer(child: CachedNetworkImage(imageUrl: url)),
            Positioned(
              top: 48,
              right: 16,
              child: GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 24),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _focusNode.dispose();
    _chatService.updateTypingStatus(
      widget.conversationId,
      false,
      widget.collection,
    );
    _chatService.setOnlineStatus(false);
    _typingAnimationController.dispose();
    _pulseAnimationController.dispose();
    _sendButtonAnimationController.dispose();
    _messageController.removeListener(_onTypingChanged);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ─────────────────────────────────────────────
  // ⚙️ POWERFUL SETTINGS (CONTROL CENTER)
  // ─────────────────────────────────────────────
  void _showPowerfulSettings() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: lineGreen.withValues(alpha: 0.1),
                      backgroundImage: widget.otherUserPhoto != null
                          ? CachedNetworkImageProvider(widget.otherUserPhoto!)
                          : null,
                      child: widget.otherUserPhoto == null
                          ? const Icon(Icons.person, color: lineGreen, size: 30)
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.otherUserName,
                            style: GoogleFonts.kanit(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: tuktukDark,
                            ),
                          ),
                          Text(
                            'ตั้งค่าการสื่อสารระดับสูง',
                            style: GoogleFonts.kanit(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.qr_code_scanner_rounded),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Settings Grid
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  children: [
                    _buildSettingsSection('การเชื่อมต่อ', [
                      _buildSettingsItem(
                        Icons.notifications_active_outlined,
                        'ปิดแจ้งเตือนแชทนี้',
                        'บล็อกคำขอชั่วคราว',
                        Colors.blue,
                        trailing: Switch(
                          value: true,
                          activeColor: lineGreen,
                          onChanged: (v) {},
                        ),
                      ),
                      _buildSettingsItem(
                        Icons.search_rounded,
                        'ค้นหาในแชท',
                        'ค้นหาข้อความหรือวันที่',
                        Colors.orange,
                        onTap: () {},
                      ),
                    ]),
                    _buildSettingsSection('สื่อและไฟล์', [
                      _buildSettingsItem(
                        Icons.perm_media_outlined,
                        'รูปภาพและวิดีโอ',
                        'ดูสื่อทั้งหมดที่ได้รับ',
                        Colors.purple,
                        onTap: () {},
                      ),
                      _buildSettingsItem(
                        Icons.link_rounded,
                        'ลิงก์ที่แชร์',
                        'เปิดดูประวัติลิงก์',
                        Colors.teal,
                        onTap: () {},
                      ),
                    ]),
                    _buildSettingsSection('รูปลักษณ์และความเป็นส่วนตัว', [
                      _buildSettingsItem(
                        Icons.palette_outlined,
                        'เปลี่ยนวอลเปเปอร์',
                        'เลือกจากคลังภาพหรือสีพื้น',
                        Colors.pink,
                        onTap: () {
                          Navigator.pop(context);
                          _changeChatBackground();
                        },
                      ),
                      _buildSettingsItem(
                        Icons.lock_outline_rounded,
                        'เข้ารหัสข้อมูลแชท',
                        'E2E Encryption: Active',
                        lineGreen,
                        isPremium: true,
                      ),
                    ]),
                    _buildSettingsSection('ความปลอดภัย', [
                      _buildSettingsItem(
                        Icons.cleaning_services_outlined,
                        'ล้างประวัติการแชท',
                        'ลบข้อความทั้งหมดในเครื่องเรา',
                        Colors.blueGrey,
                        onTap: () {},
                      ),
                      _buildSettingsItem(
                        Icons.report_gmailerrorred_rounded,
                        'รายงานปัญหา / บล็อก',
                        'จัดการปัญหาความไม่ปลอดภัย',
                        Colors.red,
                        onTap: () {},
                      ),
                    ]),
                    const SizedBox(height: 40),
                    Center(
                      child: Text(
                        'TukTuk Powered by Go Engine',
                        style: GoogleFonts.kanit(
                          fontSize: 10,
                          color: Colors.grey.shade400,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
          child: Text(
            title,
            style: GoogleFonts.kanit(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: lineGreen,
              letterSpacing: 0.5,
            ),
          ),
        ),
        ...items,
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildSettingsItem(
    IconData icon,
    String title,
    String subtitle,
    Color color, {
    VoidCallback? onTap,
    Widget? trailing,
    bool isPremium = false,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Row(
        children: [
          Text(
            title,
            style: GoogleFonts.kanit(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: tuktukDark,
            ),
          ),
          if (isPremium)
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.amber.shade100,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(
                Icons.verified_user_rounded,
                size: 10,
                color: Colors.amber,
              ),
            ),
        ],
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.kanit(fontSize: 12, color: Colors.grey.shade600),
      ),
      trailing: trailing ??
          Icon(
            Icons.arrow_forward_ios_rounded,
            size: 14,
            color: Colors.grey.shade300,
          ),
    );
  }

  String _formatNumber(dynamic n) {
    if (n == null) return '0';
    if (n is int) {
      if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
      if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
      return n.toString();
    }
    return n.toString();
  }

  // ─────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        _focusNode.unfocus();
        setState(() => _showEmojiPicker = false);
      },
      child: Scaffold(
        backgroundColor: lineBackground,
        appBar: _buildAppBar(),
        body: Stack(
          children: [
            Positioned.fill(
              child:
                  _chatBackground != null && File(_chatBackground!).existsSync()
                      ? Image.file(
                          File(_chatBackground!),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _defaultChatBg(),
                        )
                      : _defaultChatBg(),
            ),
            Column(
              children: [
                _buildOfflineBanner(),
                if (widget.collection == 'conversations') _buildFriendBanner(),
                Expanded(
                  child: Stack(
                    children: [
                      _buildMessageArea(),
                      // 🌟 Smart Product Tag (Floating, Non-intrusive)
                      if (widget.collection == 'product_chats')
                        Positioned(
                          top: 8,
                          left: 16,
                          right: 16,
                          child: _buildSmartProductTag(),
                        ),
                    ],
                  ),
                ),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: _isOtherUserTyping
                      ? _buildTypingIndicator()
                      : const SizedBox(key: ValueKey('no_typing')),
                ),
                _buildMessageInput(),
                if (_showEmojiPicker) _buildEmojiPicker(),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfflineBanner() {
    return StreamBuilder<List<ConnectivityResult>>(
        stream: Connectivity().onConnectivityChanged,
        builder: (context, connSnap) {
          final results = connSnap.data ?? [];
          final isConnected = results.isNotEmpty &&
              results.any((r) => r != ConnectivityResult.none);

          if (!isConnected) {
            return Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6),
              color: Colors.redAccent.withOpacity(0.9),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.cloud_off_rounded,
                      size: 14, color: Colors.white),
                  const SizedBox(width: 8),
                  Text('ขาดการติดต่อ — กำลังรอสัญญาณ...',
                      style: GoogleFonts.kanit(
                          fontSize: 12,
                          color: Colors.white,
                          fontWeight: FontWeight.w500)),
                ],
              ),
            );
          }

          // 📡 If connected but Firestore is still hitting cache only
          final msgStream = widget.collection == 'product_chats'
              ? _chatService.getProductMessages(widget.conversationId)
              : _chatService.getMessages(widget.conversationId);

          return StreamBuilder<QuerySnapshot>(
            stream: msgStream,
            builder: (context, snapshot) {
              // Only show "From Cache" if we are CERTAIN we are offline or syncing takes too long
              if (snapshot.hasData &&
                  snapshot.data!.metadata.isFromCache &&
                  !isConnected) {
                return Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  color: Colors.orange.withOpacity(0.85),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.history_rounded,
                          size: 14, color: Colors.white),
                      const SizedBox(width: 6),
                      Text('กำลังแสดงข้อมูลสำรอง',
                          style: GoogleFonts.kanit(
                              fontSize: 11, color: Colors.white)),
                    ],
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          );
        });
  }

  Widget _buildFriendBanner() {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection(widget.collection)
          .doc(widget.conversationId)
          .snapshots(),
      builder: (context, snap) {
        if (!snap.hasData || !snap.data!.exists) return const SizedBox.shrink();
        final data = snap.data!.data() as Map<String, dynamic>;
        final status = data['status'] ?? 'accepted';
        if (status == 'pending' && data['requestBy'] != _currentUid) {
          return _buildFriendRequestBanner();
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildMessageArea() {
    return StreamBuilder<QuerySnapshot>(
      stream: widget.collection == 'product_chats'
          ? _chatService.getProductMessages(widget.conversationId)
          : _chatService.getMessages(widget.conversationId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildShimmer();
        }
        if (snapshot.hasError) return _buildError();
        final messages =
            List<QueryDocumentSnapshot>.from(snapshot.data?.docs ?? []);
        if (messages.isEmpty) return _buildEmptyChat();
        return _buildMessageList(messages);
      },
    );
  }

  // ─────────────────────────────────────────────
  // APP BAR
  // ─────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0.5,
      shadowColor: Colors.black12,
      surfaceTintColor: Colors.white,
      leading: IconButton(
        icon: const Icon(
          Icons.arrow_back_ios_new_rounded,
          color: Colors.black87,
          size: 20,
        ),
        onPressed: () => Navigator.pop(context),
      ),
      title: StreamBuilder<bool>(
        stream: _chatService.getUserOnlineStatus(widget.otherUserId),
        builder: (context, onlineSnap) {
          final isOnline = onlineSnap.data ?? false;
          return InkWell(
            onTap: _showPowerfulSettings,
            child: Row(
              children: [
                Stack(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isOnline
                              ? lineGreen.withValues(alpha: 0.7)
                              : Colors.white24,
                          width: 2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isOnline
                                ? lineGreen.withValues(alpha: 0.3)
                                : Colors.transparent,
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 19,
                        backgroundColor: Colors.grey.shade800,
                        backgroundImage: widget.otherUserPhoto != null &&
                                widget.otherUserPhoto!.isNotEmpty
                            ? CachedNetworkImageProvider(widget.otherUserPhoto!)
                            : null,
                        child: (widget.otherUserPhoto == null ||
                                widget.otherUserPhoto!.isEmpty)
                            ? const Icon(
                                Icons.person,
                                color: Colors.white,
                                size: 22,
                              )
                            : null,
                      ),
                    ),
                    if (isOnline)
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 13,
                          height: 13,
                          decoration: BoxDecoration(
                            color: lineGreen,
                            shape: BoxShape.circle,
                            border: Border.all(color: tuktukDark, width: 2),
                          ),
                        ),
                      ),
                  ],
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
                              widget.otherUserName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.kanit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          // LINE Verified Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: lineGreen,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'VERIFIED',
                              style: GoogleFonts.kanit(
                                color: Colors.white,
                                fontSize: 7,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          if (isOnline)
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: lineGreen,
                                shape: BoxShape.circle,
                              ),
                            ),
                          if (isOnline) const SizedBox(width: 4),
                          Text(
                            _isOtherUserTyping
                                ? 'กำลังพิมพ์...'
                                : isOnline
                                    ? 'ออนไลน์ตอนนี้'
                                    : 'ออฟไลน์',
                            style: GoogleFonts.kanit(
                              fontSize: 11,
                              fontWeight: isOnline
                                  ? FontWeight.w500
                                  : FontWeight.normal,
                              color: _isOtherUserTyping
                                  ? lineGreen
                                  : isOnline
                                      ? lineGreen
                                      : Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.videocam_outlined,
              color: Colors.black87, size: 24),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.settings_suggest_outlined,
              color: Colors.black87, size: 24),
          onPressed: _showPowerfulSettings,
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  // ─────────────────────────────────────────────
  // PRODUCT HEADER
  // ─────────────────────────────────────────────
  Widget _buildSmartProductTag() {
    return AnimatedSize(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOutBack,
      child: _showProductTag
          ? FutureBuilder<DocumentSnapshot>(
              future: FirebaseFirestore.instance
                  .collection('product_chats')
                  .doc(widget.conversationId)
                  .get(),
              builder: (context, snap) {
                if (!snap.hasData || !snap.data!.exists) {
                  return const SizedBox();
                }
                final data = snap.data!.data() as Map<String, dynamic>;
                final productName = data['productName'] ?? 'สินค้า';
                final productImage = data['productImageUrl'];
                final price = data['price'] ?? 0;

                return Dismissible(
                  key: const Key('product_tag'),
                  direction: DismissDirection.horizontal,
                  onDismissed: (_) {
                    setState(() => _showProductTag = false);
                  },
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      border: Border.all(color: Colors.grey.shade100),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (productImage != null)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: productImage,
                              width: 36,
                              height: 36,
                              fit: BoxFit.cover,
                            ),
                          ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.auto_awesome_rounded,
                                    size: 10,
                                    color: Colors.orange,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'แท็กสินค้า',
                                    style: GoogleFonts.kanit(
                                      color: Colors.orange,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                productName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.kanit(
                                  color: tuktukDark,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (price > 0)
                          Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: Text(
                              '฿${_formatNumber(price)}',
                              style: GoogleFonts.kanit(
                                color: lineGreen,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        IconButton(
                          icon: const Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: Colors.grey,
                          ),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () =>
                              setState(() => _showProductTag = false),
                        ),
                      ],
                    ),
                  ),
                );
              },
            )
          : const SizedBox(),
    );
  }

  // ─────────────────────────────────────────────
  // SHIMMER LOADING
  // ─────────────────────────────────────────────
  // ── Default Chat Background ──────────────────────────────────
  Widget _defaultChatBg() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF7BA7C4), // LINE Classic Blue
            Color(0xFF6E96B5),
            Color(0xFF5D84A3),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    // Fixed sizes to avoid math.Random() rebuild issues
    final widths = [0.55, 0.42, 0.65, 0.38, 0.60, 0.45, 0.50, 0.40];
    final heights = [44.0, 52.0, 38.0, 60.0, 44.0, 38.0, 52.0, 44.0];
    return Shimmer.fromColors(
      baseColor: Colors.white.withValues(alpha: 0.25),
      highlightColor: Colors.white.withValues(alpha: 0.55),
      child: ListView.builder(
        reverse: true,
        padding: const EdgeInsets.all(16),
        itemCount: 8,
        itemBuilder: (_, i) {
          final isMe = i % 3 != 0;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment:
                  isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
              children: [
                if (!isMe)
                  Container(
                    width: 30,
                    height: 30,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                  ),
                Container(
                  width: MediaQuery.of(context).size.width * widths[i],
                  height: heights[i],
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isMe ? 18 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 18),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
            ),
            child: const Icon(
              Icons.error_outline_rounded,
              color: Colors.redAccent,
              size: 44,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'โหลดข้อความไม่ได้',
            style: GoogleFonts.kanit(color: Colors.white, fontSize: 16),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => setState(() {}),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.withValues(alpha: 0.15),
              foregroundColor: Colors.redAccent,
              elevation: 0,
            ),
            child: Text('ลองอีกครั้ง', style: GoogleFonts.kanit()),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // EMPTY CHAT — LINE Clone Premium
  // ─────────────────────────────────────────────
  Widget _buildEmptyChat() {
    return ListView(
      reverse: true,
      padding: const EdgeInsets.all(24),
      children: [
        Center(
          child: Column(
            children: [
              const SizedBox(height: 40),
              // Cloned LINE Avatar — the KEY differentiator
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 48,
                  backgroundColor: Colors.grey.shade300,
                  backgroundImage: widget.otherUserPhoto != null &&
                          widget.otherUserPhoto!.isNotEmpty
                      ? CachedNetworkImageProvider(widget.otherUserPhoto!)
                      : null,
                  child: (widget.otherUserPhoto == null ||
                          widget.otherUserPhoto!.isEmpty)
                      ? Icon(
                          Icons.person,
                          size: 50,
                          color: Colors.grey.shade600,
                        )
                      : null,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                widget.otherUserName,
                style: GoogleFonts.kanit(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  shadows: [
                    const Shadow(
                      color: Colors.black38,
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              // LINE Badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: lineGreen.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.verified_rounded,
                      color: Colors.white,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'เชื่อมต่อผ่าน LINE — TukTuk Verified',
                      style: GoogleFonts.kanit(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white24),
                ),
                child: Text(
                  '🔒 ข้อความเข้ารหัส E2E\nโคลนโปรไฟล์จาก LINE โดยตรง',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.kanit(
                    color: Colors.white70,
                    fontSize: 12,
                    height: 1.5,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              // Quick Reply Chips
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: _quickReplies.take(4).map((r) {
                  return GestureDetector(
                    onTap: () => _handleQuickReply(r),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        r,
                        style: GoogleFonts.kanit(
                          color: tuktukDark,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ─────────────────────────────────────────────
  // MESSAGE LIST
  // ─────────────────────────────────────────────
  Widget _buildMessageList(List<QueryDocumentSnapshot> messages) {
    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final doc = messages[index];
        final msg = doc.data() as Map<String, dynamic>;
        final isMe = msg['senderId'] == _currentUid;
        final ts = (msg['timestamp'] ?? msg['sentAt']) as Timestamp?;
        final time = ts?.toDate();
        final isLastFromSender = index == 0 ||
            (messages[index - 1].data() as Map)['senderId'] != msg['senderId'];

        final isUnsent = msg['isUnsent'] == true || msg['type'] == 'unsent';

        return Column(
          children: [
            if (_shouldShowDate(messages, index) && time != null)
              _buildDateDivider(time),
            GestureDetector(
              onLongPress: isUnsent
                  ? null
                  : () => _showBubbleOptions(
                        context,
                        doc.id,
                        msg['text'] ?? '',
                        isMe,
                      ),
              child: _buildBubble(
                text: msg['text'] ?? '',
                isMe: isMe,
                time: time,
                status: msg['status'] ?? 'sent',
                imageUrl: msg['imageUrl'] as String?,
                isLastFromSender: isLastFromSender,
                type: msg['type'] as String?,
                isUnsent: isUnsent,
                isEdited: msg['isEdited'] == true,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDateDivider(DateTime date) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.22),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            DateFormat('d MMMM yyyy', 'th').format(date),
            style: GoogleFonts.kanit(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // MESSAGE BUBBLE — LINE Premium Clone
  // ─────────────────────────────────────────────
  Widget _buildBubble({
    required String text,
    required bool isMe,
    required DateTime? time,
    required String status,
    required bool isLastFromSender,
    String? imageUrl,
    String? type,
    bool isUnsent = false,
    bool isEdited = false,
  }) {
    if (isUnsent) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              isMe ? 'คุณยกเลิกการส่งข้อความแล้ว' : 'ข้อความถูกยกเลิกการส่ง',
              style: GoogleFonts.kanit(color: Colors.white60, fontSize: 11),
            ),
          ),
        ),
      );
    }

    if (type == 'sticker' && imageUrl != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment:
              isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!isMe && isLastFromSender)
              CircleAvatar(
                radius: 17,
                backgroundImage: widget.otherUserPhoto != null
                    ? CachedNetworkImageProvider(widget.otherUserPhoto!)
                    : null,
                child: widget.otherUserPhoto == null
                    ? const Icon(Icons.person)
                    : null,
              ),
            if (!isMe && !isLastFromSender) const SizedBox(width: 34),
            const SizedBox(width: 8),
            if (isMe && time != null) _buildMessageMeta(time, status, isMe),
            CachedNetworkImage(
              imageUrl: imageUrl,
              width: 120,
              height: 120,
              fit: BoxFit.contain,
            ),
            if (!isMe && time != null) _buildMessageMeta(time, status, isMe),
          ],
        ),
      );
    }

    final bubbleColor = isMe ? lineGreen : lineWhite;
    final textColor = isMe ? Colors.white : Colors.black87;

    return Padding(
      padding: EdgeInsets.only(
        top: 2,
        bottom: isLastFromSender ? 6 : 2,
        left: isMe ? 48 : 0,
        right: isMe ? 0 : 48,
      ),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Other user avatar (LINE-cloned from LINE profile)
          if (!isMe) ...[
            if (isLastFromSender)
              Container(
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 17,
                  backgroundColor: Colors.white,
                  backgroundImage: widget.otherUserPhoto != null &&
                          widget.otherUserPhoto!.isNotEmpty
                      ? CachedNetworkImageProvider(widget.otherUserPhoto!)
                      : null,
                  child: (widget.otherUserPhoto == null ||
                          widget.otherUserPhoto!.isEmpty)
                      ? Icon(
                          Icons.person,
                          size: 18,
                          color: Colors.grey.shade400,
                        )
                      : null,
                ),
              )
            else
              const SizedBox(width: 42),
          ],

          if (isMe && time != null) _buildMessageMeta(time, status, isMe),

          // Bubble content
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (imageUrl != null)
                  GestureDetector(
                    onTap: () => _showImagePreview(imageUrl),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 4),
                      constraints: BoxConstraints(
                        maxWidth: MediaQuery.of(context).size.width * 0.62,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(18),
                          topRight: const Radius.circular(18),
                          bottomLeft: Radius.circular(isMe ? 18 : 4),
                          bottomRight: Radius.circular(isMe ? 4 : 18),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(18),
                          topRight: const Radius.circular(18),
                          bottomLeft: Radius.circular(isMe ? 18 : 4),
                          bottomRight: Radius.circular(isMe ? 4 : 18),
                        ),
                        child: CachedNetworkImage(
                          imageUrl: imageUrl,
                          placeholder: (_, __) => Container(
                            height: 150,
                            width: 200,
                            color: Colors.grey.shade200,
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: lineGreen,
                                strokeWidth: 2,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                if (text.isNotEmpty && text != '[รูปภาพ]')
                  Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.68,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: bubbleColor,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(isMe ? 18 : 4),
                        bottomRight: Radius.circular(isMe ? 4 : 18),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.07),
                          blurRadius: 3,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: text,
                            style: GoogleFonts.kanit(
                              color: textColor,
                              fontSize: 15,
                              letterSpacing: 0.2,
                            ),
                          ),
                          if (isEdited)
                            TextSpan(
                              text: ' (แก้ไขแล้ว)',
                              style: GoogleFonts.kanit(
                                color: textColor.withValues(alpha: 0.6),
                                fontSize: 10,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          if (!isMe && time != null) _buildMessageMeta(time, status, isMe),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // TYPING INDICATOR — LINE Style
  // ─────────────────────────────────────────────
  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
      child: Row(
        children: [
          CircleAvatar(
            radius: 17,
            backgroundColor: Colors.white,
            backgroundImage: widget.otherUserPhoto != null &&
                    widget.otherUserPhoto!.isNotEmpty
                ? CachedNetworkImageProvider(widget.otherUserPhoto!)
                : null,
            child: (widget.otherUserPhoto == null ||
                    widget.otherUserPhoto!.isEmpty)
                ? Icon(Icons.person, size: 18, color: Colors.grey.shade400)
                : null,
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            decoration: BoxDecoration(
              color: lineWhite,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(18),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.07),
                  blurRadius: 3,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) {
                return AnimatedBuilder(
                  animation: _typingAnimationController,
                  builder: (_, __) {
                    final delay = i * 0.33;
                    final v = math.sin(
                          (_typingAnimationController.value + delay) * math.pi,
                        ) *
                        4;
                    return Transform.translate(
                      offset: Offset(0, -v),
                      child: Container(
                        width: 7,
                        height: 7,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade400,
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  },
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // EMOJI PICKER
  // ─────────────────────────────────────────────
  Widget _buildEmojiPicker() {
    final emojis = [
      '😊',
      '😂',
      '❤️',
      '👍',
      '🔥',
      '😍',
      '🎉',
      '🙏',
      '😢',
      '👏',
      '🤣',
      '😭',
      '🥰',
      '😎',
      '🤩',
      '🤔',
      '😅',
      '🥳',
      '💯',
    ];

    return Container(
      height: 280,
      decoration: BoxDecoration(
        color: lineInputBg,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        children: [
          // Tab Switcher
          Container(
            height: 40,
            color: Colors.white,
            child: Row(
              children: [
                _buildPickerTab(0, Icons.emoji_emotions_outlined, 'อิโมจิ'),
                _buildPickerTab(1, Icons.face_rounded, 'สติกเกอร์'),
              ],
            ),
          ),
          Expanded(
            child: _pickerTab == 0
                ? GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                    ),
                    itemCount: emojis.length,
                    itemBuilder: (_, i) => GestureDetector(
                      onTap: () {
                        _messageController.text += emojis[i];
                      },
                      child: Center(
                        child: Text(
                          emojis[i],
                          style: const TextStyle(fontSize: 26),
                        ),
                      ),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 4,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                    ),
                    itemCount: _stickerUrls.length,
                    itemBuilder: (_, i) => GestureDetector(
                      onTap: () => _handleSendSticker(_stickerUrls[i]),
                      child: CachedNetworkImage(
                        imageUrl: _stickerUrls[i],
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildPickerTab(int index, IconData icon, String label) {
    final bool isSelected = _pickerTab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _pickerTab = index),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected ? lineGreen : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? lineGreen : Colors.grey),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.kanit(
                  fontSize: 12,
                  color: isSelected ? lineGreen : Colors.grey,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageMeta(DateTime time, String status, bool isMe) {
    return Padding(
      padding:
          EdgeInsets.only(left: isMe ? 0 : 6, right: isMe ? 6 : 0, bottom: 2),
      child: Column(
        crossAxisAlignment:
            isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isMe && status == 'read')
            Text(
              'อ่านแล้ว',
              style: GoogleFonts.kanit(color: Colors.white70, fontSize: 10),
            ),
          Text(
            _formatMessageTime(time),
            style: GoogleFonts.kanit(color: Colors.white70, fontSize: 10),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────
  // MESSAGE INPUT — LINE Premium
  // ─────────────────────────────────────────────
  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
      decoration: BoxDecoration(
        color: lineInputBg,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!_isTyping && _editingMessageId == null)
              SizedBox(
                height: 38,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _quickReplies.length,
                  itemBuilder: (_, i) => GestureDetector(
                    onTap: () => _handleQuickReply(_quickReplies[i]),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Text(
                        _quickReplies[i],
                        style: GoogleFonts.kanit(
                          color: Colors.black87,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            if (_editingMessageId != null)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: Colors.green.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.edit_rounded,
                      size: 14,
                      color: Colors.green,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'กำลังแก้ไข: ${_editingInitialText ?? ""}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.kanit(
                          fontSize: 12,
                          color: Colors.green.shade700,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _editingMessageId = null;
                          _editingInitialText = null;
                          _messageController.clear();
                        });
                      },
                      child: const Icon(
                        Icons.close_rounded,
                        size: 16,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            if (!_isTyping && _editingMessageId == null)
              const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Plus button (image)
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _showAttachmentMenu,
                    borderRadius: BorderRadius.circular(24),
                    child: Padding(
                      padding: const EdgeInsets.all(9),
                      child: _isSendingImage
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: lineGreen,
                              ),
                            )
                          : Icon(
                              Icons.add_circle_outline_rounded,
                              color: Colors.grey.shade600,
                              size: 28,
                            ),
                    ),
                  ),
                ),

                // Text field
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            focusNode: _focusNode,
                            style: GoogleFonts.kanit(
                              color: Colors.black87,
                              fontSize: 15,
                            ),
                            maxLines: null,
                            minLines: 1,
                            textInputAction: TextInputAction.newline,
                            onTap: () {
                              if (_showEmojiPicker) {
                                setState(() => _showEmojiPicker = false);
                              }
                            },
                            decoration: InputDecoration(
                              hintText: 'พิมพ์ข้อความ...',
                              hintStyle: GoogleFonts.kanit(
                                color: Colors.grey.shade400,
                                fontSize: 15,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                            ),
                          ),
                        ),
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: _toggleEmojiPicker,
                            borderRadius: BorderRadius.circular(20),
                            child: Padding(
                              padding: const EdgeInsets.all(9),
                              child: Icon(
                                Icons.sentiment_satisfied_alt_rounded,
                                color: _showEmojiPicker
                                    ? lineGreen
                                    : Colors.grey.shade400,
                                size: 22,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Send / Mic button
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: _isTyping ? lineGreen : Colors.transparent,
                    shape: BoxShape.circle,
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap:
                          _isTyping ? _handleSendMessage : _handleVoiceRecord,
                      borderRadius: BorderRadius.circular(24),
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Icon(
                          _isTyping
                              ? Icons.send_rounded
                              : _isRecording
                                  ? Icons.stop_rounded
                                  : Icons.mic_none_rounded,
                          color: _isTyping
                              ? Colors.white
                              : _isRecording
                                  ? Colors.red
                                  : Colors.grey.shade600,
                          size: 26,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────
  // FRIEND REQUEST BANNER
  // ─────────────────────────────────────────────
  Widget _buildFriendRequestBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: lineGreen.withValues(alpha: 0.1),
        border:
            Border(bottom: BorderSide(color: lineGreen.withValues(alpha: 0.2))),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                    color: lineGreen, shape: BoxShape.circle),
                child: const Icon(
                  Icons.person_add_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'คำขอเป็นเพื่อน',
                      style: GoogleFonts.kanit(
                        color: tuktukDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      '${widget.otherUserName} ต้องการพูดคุยกับคุณ',
                      style: GoogleFonts.kanit(
                        color: Colors.black54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _chatService.acceptConversation(
                    widget.conversationId,
                    widget.otherUserId,
                  ),
                  icon: const Icon(Icons.check_rounded, size: 16),
                  label: Text('ยอมรับ', style: GoogleFonts.kanit()),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: lineGreen,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.grey.shade700,
                    side: BorderSide(color: Colors.grey.shade300),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: Text('ไว้ทีหลัง', style: GoogleFonts.kanit()),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAttachmentMenu() {
    _focusNode.unfocus();
    setState(() => _showEmojiPicker = false);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 8),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildAttachmentItem(
                    Icons.image_rounded,
                    'รูปภาพ',
                    Colors.purple,
                    _handleImagePick,
                  ),
                  _buildAttachmentItem(
                    Icons.videocam_rounded,
                    'วิดีโอ',
                    Colors.red,
                    () {},
                  ),
                  _buildAttachmentItem(
                    Icons.location_on_rounded,
                    'ตำแหน่ง',
                    Colors.green,
                    () {},
                  ),
                  _buildAttachmentItem(
                    Icons.call_rounded,
                    'โทร',
                    Colors.blue,
                    _handleStartCall,
                  ),
                  _buildAttachmentItem(
                    Icons.person_add_rounded,
                    'ผู้ติดต่อ',
                    Colors.orange,
                    () {},
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'ยกเลิก',
                  style: GoogleFonts.kanit(color: Colors.grey),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAttachmentItem(
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: () {
        Navigator.pop(context);
        onTap();
      },
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.kanit(fontSize: 12, color: Colors.black54),
          ),
        ],
      ),
    );
  }

  void _handleStartCall() {
    // Check if conversation is accepted first for privacy
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CallScreen(
          channelName: widget.conversationId,
          otherUserName: widget.otherUserName,
          otherUserPhoto: widget.otherUserPhoto,
        ),
      ),
    );
  }
}
