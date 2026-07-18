import 'dart:io';

import 'package:caculateapp/tuktuk/services/tuktuk_bridge.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:rxdart/rxdart.dart';

class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// The ID used by the WEB side for buyerId/sellerId is always the LINE User ID
  /// (or the document key in line_users/users). Firebase Auth UID is NOT used by the web.
  /// Therefore we prefer the session lineUserId first, then fall back to Firebase UID.
  String? get currentUserId {
    // Prefer lineUserId from session (= what web writes to sellerId/buyerId)
    final session = TukTukBridge().currentSession;
    if (session != null) {
      return session['lineUserId'] as String? ?? session['uid'] as String?;
    }
    return _auth.currentUser?.uid;
  }

  // ─── Online Presence ────────────────────────────────────────────────────────

  /// Call this on app resume / init to mark user online.
  Future<void> setOnlineStatus(bool isOnline) async {
    final uid = currentUserId;
    if (uid == null) return;
    try {
      final update = {
        'isOnline': isOnline,
        'lastSeen': FieldValue.serverTimestamp(),
      };

      // Update both collections to ensure web/app sync consistency
      final batch = _firestore.batch();

      final userRef = _firestore.collection('users').doc(uid);
      final lineUserRef = _firestore.collection('line_users').doc(uid);

      // Check if document exists before setting if you want to be careful,
      // but merge: true is usually enough.
      batch.set(userRef, update, SetOptions(merge: true));
      batch.set(lineUserRef, update, SetOptions(merge: true));

      await batch.commit();
    } catch (e) {
      debugPrint('⚠️ Error updating online status: $e');
    }
  }

  Future<String?> uploadChatImage(
    String conversationId,
    File file,
    String collection,
  ) async {
    final uid = currentUserId;
    if (uid == null) return null;
    try {
      final ext = file.path.split('.').last;
      final ref = FirebaseStorage.instance
          .ref()
          .child('chats')
          .child(collection)
          .child(conversationId)
          .child('${DateTime.now().millisecondsSinceEpoch}.$ext');
      await ref.putFile(file);
      return await ref.getDownloadURL();
    } catch (e) {
      debugPrint('Error uploading chat image: $e');
      return null;
    }
  }

  /// Stream of online status for another user (checks both collections).
  Stream<bool> getUserOnlineStatus(String uid) {
    if (uid.isEmpty) return Stream.value(false);
    final userStream = _firestore.collection('users').doc(uid).snapshots();
    final lineUserStream =
        _firestore.collection('line_users').doc(uid).snapshots();

    return Rx.combineLatest2(userStream, lineUserStream, (snap1, snap2) {
      final isOnline1 = snap1.data()?['isOnline'] == true;
      final isOnline2 = snap2.data()?['isOnline'] == true;
      return isOnline1 || isOnline2;
    });
  }

  // ─── Typing Indicator ───────────────────────────────────────────────────────

  /// Update typing state in the conversation doc (syncs to web).
  Future<void> updateTypingStatus(
    String conversationId,
    bool isTyping,
    String collection,
  ) async {
    final uid = currentUserId;
    if (uid == null) return;
    try {
      await _firestore.collection(collection).doc(conversationId).set(
        {
          'typing': {uid: isTyping},
        },
        SetOptions(merge: true),
      );
    } catch (_) {}
  }

  // ─── Conversations ──────────────────────────────────────────────────────────

  /// Get or create a conversation between two users.
  Future<String> getOrCreateConversation(String otherUserId) async {
    if (currentUserId == null) throw Exception('User not logged in');

    final participants = [currentUserId!, otherUserId]..sort();

    final query = await _firestore
        .collection('conversations')
        .where('participants', isEqualTo: participants)
        .limit(1)
        .get();

    if (query.docs.isNotEmpty) {
      return query.docs.first.id;
    } else {
      final doc = await _firestore.collection('conversations').add({
        'participants': participants,
        'lastMessage': '',
        'lastMessageAt': FieldValue.serverTimestamp(),
        'unreadCount_${currentUserId!}': 0,
        'unreadCount_$otherUserId': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'platform': 'app',
        'status': 'pending', // ✅ New: Pending acceptance
        'requestBy': currentUserId, // ✅ New: Track who started it
        'createdBy': currentUserId,
      });
      return doc.id;
    }
  }

  /// Stream of all conversations for current user — works with web schema.
  Stream<QuerySnapshot> getConversations() {
    return TukTukBridge().sessionStream.switchMap((session) {
      final uid =
          session?['lineUserId'] ?? session?['uid'] ?? _auth.currentUser?.uid;
      if (uid == null) return const Stream.empty();
      return _firestore
          .collection('conversations')
          .where('participants', arrayContains: uid)
          .orderBy('lastMessageAt', descending: true)
          .snapshots();
    });
  }

  /// Stream of total unread count across all conversations (for nav badge).
  Stream<int> getTotalUnreadStream() {
    return TukTukBridge().sessionStream.switchMap((session) {
      final uid =
          session?['lineUserId'] ?? session?['uid'] ?? _auth.currentUser?.uid;
      if (uid == null) return Stream.value(0);
      return _firestore
          .collection('conversations')
          .where('participants', arrayContains: uid)
          .snapshots()
          .map((snap) {
        int total = 0;
        for (final doc in snap.docs) {
          final data = doc.data();
          total += (data['unreadCount_$uid'] ?? 0) as int;
        }
        return total;
      });
    });
  }

  /// Stream of total unread count for product_chats.
  Stream<int> getTotalProductUnreadStream() {
    return TukTukBridge().sessionStream.switchMap((session) {
      final uid =
          session?['lineUserId'] ?? session?['uid'] ?? _auth.currentUser?.uid;
      if (uid == null) return Stream.value(0);

      final buyerStream = _firestore
          .collection('product_chats')
          .where('buyerId', isEqualTo: uid)
          .snapshots();

      final sellerIdStream = _firestore
          .collection('product_chats')
          .where('sellerId', isEqualTo: uid)
          .snapshots();

      final lineUserIdStream = _firestore
          .collection('product_chats')
          .where('lineUserId', isEqualTo: uid)
          .snapshots();

      return Rx.combineLatest3(buyerStream, sellerIdStream, lineUserIdStream,
          (snapBuyer, snapSellerId, snapLineId) {
        final uniqueDocs = <String, Map<String, dynamic>>{};

        for (final doc in snapBuyer.docs) {
          uniqueDocs[doc.id] = {...doc.data(), 'isMeBuyer': true};
        }

        for (final doc in snapSellerId.docs) {
          final existing = uniqueDocs[doc.id];
          uniqueDocs[doc.id] = {
            ...doc.data(),
            'isMeSeller': true,
            if (existing != null) 'isMeBuyer': existing['isMeBuyer'],
          };
        }
        for (final doc in snapLineId.docs) {
          final existing = uniqueDocs[doc.id];
          uniqueDocs[doc.id] = {
            ...doc.data(),
            'isMeSeller': true,
            if (existing != null) 'isMeBuyer': existing['isMeBuyer'],
          };
        }

        int total = 0;
        uniqueDocs.forEach((id, data) {
          if (data['isMeBuyer'] == true) {
            total += (data['unreadCountBuyer'] ?? 0) as int;
          }
          if (data['isMeSeller'] == true) {
            total += (data['unreadCountSeller'] ?? 0) as int;
          }
        });
        return total;
      });
    });
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  /// Send a message in a general conversation.
  Future<void> sendMessage(
    String conversationId,
    String text, {
    String type = 'text',
    String? imageUrl,
    Map<String, dynamic>? metadata,
  }) async {
    if (currentUserId == null) return;

    final batch = _firestore.batch();

    final messageRef = _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .doc();
    batch.set(messageRef, {
      'senderId': currentUserId,
      'text': text,
      'type': type,
      'timestamp': FieldValue.serverTimestamp(),
      'sentAt': FieldValue.serverTimestamp(),
      'status': 'sent',
      'isUnsent': false, // ✅ New: Support for unsending
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (metadata != null) 'metadata': metadata,
    });

    final convRef = _firestore.collection('conversations').doc(conversationId);
    final convDoc = await convRef.get();
    final participants =
        List<String>.from(convDoc.data()?['participants'] ?? []);
    final otherUserId = participants.firstWhere(
      (id) => id != currentUserId,
      orElse: () => '',
    );

    batch.update(convRef, {
      'lastMessage': text,
      'lastMessageAt': FieldValue.serverTimestamp(),
      'lastSenderId': currentUserId,
      'platform': 'app',
      if (otherUserId.isNotEmpty)
        'unreadCount_$otherUserId': FieldValue.increment(1),
    });

    await batch.commit();

    // 🔔 Push notification
    if (otherUserId.isNotEmpty) {
      try {
        final currentUser = await TukTukBridge().getCurrentUser();
        await TukTukBridge().sendNotification(
          recipientId: otherUserId,
          type: 'message',
          title: currentUser?['displayName'] ?? 'ข้อความใหม่',
          message: text,
          relatedId: conversationId,
          relatedCollection: 'conversations',
          imageUrl: currentUser?['pictureUrl'],
        );
      } catch (_) {}
    }
  }

  /// Stream of messages.
  Stream<QuerySnapshot> getMessages(String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .limit(100)
        .snapshots();
  }

  /// Unsend a message (True delete for sender, "Unsent message" for receiver)
  Future<void> unsendMessage(
    String collection,
    String conversationId,
    String messageId,
  ) async {
    if (currentUserId == null) return;
    try {
      await _firestore
          .collection(collection)
          .doc(conversationId)
          .collection('messages')
          .doc(messageId)
          .update({
        'isUnsent': true,
        'text': 'ยกเลิกการส่งข้อความ',
        'type': 'unsent',
        'unsentAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Error unsending message: $e');
    }
  }

  /// Mark conversation as read.
  Future<void> markAsRead(String conversationId) async {
    if (currentUserId == null) return;
    await _firestore.collection('conversations').doc(conversationId).update({
      'unreadCount_$currentUserId': 0,
    });
    // Also mark messages as read
    await _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .where('senderId', isNotEqualTo: currentUserId)
        .where('status', isEqualTo: 'sent')
        .limit(20)
        .get()
        .then((snap) {
      final batch = _firestore.batch();
      for (final doc in snap.docs) {
        batch.update(doc.reference, {'status': 'read'});
      }
      return batch.commit();
    });
  }

  /// Edit a sent message
  Future<void> editMessage(
    String collection,
    String conversationId,
    String messageId,
    String newText,
  ) async {
    if (currentUserId == null) return;
    try {
      await _firestore
          .collection(collection)
          .doc(conversationId)
          .collection('messages')
          .doc(messageId)
          .update({
        'text': newText,
        'isEdited': true,
        'lastEditedAt': FieldValue.serverTimestamp(),
      });

      // Update last message in conversation if it was the last one
      final convRef = _firestore.collection(collection).doc(conversationId);
      final convDoc = await convRef.get();
      if (convDoc.exists && convDoc.data()?['lastMessage'] != null) {
        // Simple check: if we are editing, we might want to update the preview too.
        // For performance, we only update if it was likely the last message (not strictly checked here for brevity)
        await convRef.update({'lastMessage': newText});
      }
    } catch (e) {
      debugPrint('Error editing message: $e');
    }
  }

  // ─── Product Chats ──────────────────────────────────────────────────────────

  Stream<QuerySnapshot> getProductConversations() {
    return TukTukBridge().sessionStream.switchMap((session) {
      final uid =
          session?['lineUserId'] ?? session?['uid'] ?? _auth.currentUser?.uid;
      if (uid == null) return const Stream.empty();
      return _firestore
          .collection('product_chats')
          .where('buyerId', isEqualTo: uid)
          .snapshots();
    });
  }

  /// Stream of product_chats where current user is the SELLER.
  /// Queries BOTH 'sellerId' and 'lineUserId' to handle documents created
  /// by the web (product.html writes both fields) and returns a merged,
  /// deduplicated list sorted by lastMessageAt.
  Stream<List<QueryDocumentSnapshot>> getSellerProductDocs() {
    return TukTukBridge().sessionStream.switchMap((session) {
      final uid =
          session?['lineUserId'] ?? session?['uid'] ?? _auth.currentUser?.uid;
      if (uid == null) return Stream.value([]);

      final bySellerIdStream = _firestore
          .collection('product_chats')
          .where('sellerId', isEqualTo: uid)
          .snapshots()
          .map((s) => s.docs);

      final byLineUserIdStream = _firestore
          .collection('product_chats')
          .where('lineUserId', isEqualTo: uid)
          .snapshots()
          .map((s) => s.docs);

      return Rx.combineLatest2(bySellerIdStream, byLineUserIdStream,
          (List<QueryDocumentSnapshot> a, List<QueryDocumentSnapshot> b) {
        final seen = <String>{};
        final merged = <QueryDocumentSnapshot>[];
        for (final doc in [...a, ...b]) {
          if (seen.add(doc.id)) merged.add(doc);
        }
        merged.sort((x, y) {
          final tx = (x.data() as Map)['lastMessageAt'];
          final ty = (y.data() as Map)['lastMessageAt'];
          if (tx is Timestamp && ty is Timestamp) return ty.compareTo(tx);
          return 0;
        });
        return merged;
      });
    });
  }

  // Kept for backward compat — wraps getSellerProductDocs as QuerySnapshot stream
  Stream<QuerySnapshot> getSellerProductConversations() {
    // Falls back to the simplest sellerId-only query for places that still expect QuerySnapshot
    if (currentUserId == null) return const Stream.empty();
    return _firestore
        .collection('product_chats')
        .where('sellerId', isEqualTo: currentUserId)
        .snapshots();
  }

  Stream<QuerySnapshot> getLineProductConversations() {
    if (currentUserId == null) return const Stream.empty();
    return _firestore
        .collection('product_chats')
        .where('lineUserId', isEqualTo: currentUserId)
        .snapshots();
  }

  Stream<QuerySnapshot> getProductMessages(String chatId) {
    return _firestore
        .collection('product_chats')
        .doc(chatId)
        .collection('messages')
        .snapshots();
  }

  Future<void> sendProductMessage(
    String chatId,
    String text,
    String otherUserId, {
    String? imageUrl,
    String type = 'text',
  }) async {
    if (currentUserId == null) return;

    final batch = _firestore.batch();
    final msgRef = _firestore
        .collection('product_chats')
        .doc(chatId)
        .collection('messages')
        .doc();
    final chatRef = _firestore.collection('product_chats').doc(chatId);

    final chatDoc = await chatRef.get();
    final chatData = chatDoc.data() ?? {};
    final isSeller = chatData['sellerId'] == currentUserId ||
        chatData['lineUserId'] == currentUserId;
    final senderName = (await getCurrentUserName()) ?? 'ผู้ใช้';

    batch.set(msgRef, {
      'senderId': currentUserId,
      'senderName': senderName,
      'text': text,
      'sentAt': FieldValue.serverTimestamp(),
      'timestamp': FieldValue.serverTimestamp(),
      'isRead': false,
      'status': 'sent',
      'type': type,
      'isUnsent': false,
      if (imageUrl != null) 'imageUrl': imageUrl,
    });

    batch.set(
      chatRef,
      {
        'lastMessage': text,
        'lastMessageAt': FieldValue.serverTimestamp(),
        'lastSenderId': currentUserId,
        'platform': 'app',
        'unreadCount_${isSeller ? "Buyer" : "Seller"}': FieldValue.increment(1),
      },
      SetOptions(merge: true),
    );

    await batch.commit();

    // 🔔 Push notification
    if (otherUserId.isNotEmpty) {
      try {
        final currentUser = await TukTukBridge().getCurrentUser();
        await TukTukBridge().sendNotification(
          recipientId: otherUserId,
          type: 'product_message',
          title: '${currentUser?['displayName'] ?? 'ผู้ใช้'} (แชทสินค้า)',
          message: text,
          relatedId: chatId,
          relatedCollection: 'product_chats',
          imageUrl: currentUser?['pictureUrl'],
        );
      } catch (_) {}
    }
  }

  Future<void> markProductChatAsRead(String chatId) async {
    if (currentUserId == null) return;
    final doc = await _firestore.collection('product_chats').doc(chatId).get();
    if (!doc.exists) return;
    final data = doc.data()!;
    // isSeller = matches either sellerId OR lineUserId (web writes both)
    final isSeller = data['sellerId'] == currentUserId ||
        data['lineUserId'] == currentUserId;
    await doc.reference.update({
      if (isSeller) 'unreadCountSeller': 0 else 'unreadCountBuyer': 0,
    });
    // Mark messages as read too
    await _firestore
        .collection('product_chats')
        .doc(chatId)
        .collection('messages')
        .where('senderId', isNotEqualTo: currentUserId)
        .where('isRead', isEqualTo: false)
        .limit(20)
        .get()
        .then((snap) {
      final batch = _firestore.batch();
      for (final doc in snap.docs) {
        batch.update(doc.reference, {'isRead': true, 'status': 'read'});
      }
      return batch.commit();
    });
  }

  Future<String?> getCurrentUserName() async {
    final user = await TukTukBridge().getCurrentUser();
    return user?['displayName'] ?? user?['name'];
  }

  /// ✅ New: Accept a friend request / conversation
  Future<void> acceptConversation(
    String conversationId,
    String otherUserId,
  ) async {
    if (currentUserId == null) return;

    // 1. Update status
    await _firestore.collection('conversations').doc(conversationId).update({
      'status': 'accepted',
      'acceptedAt': FieldValue.serverTimestamp(),
    });

    // 2. Mutual Follow (Friendship)
    try {
      await TukTukBridge().toggleFollow(otherUserId); // Follow them
      // Note: In some systems, friendship is mutual follow.
      // TukTukBridge.toggleFollow might need to be called by both?
      // For simplicity here, we mark as accepted in chat which unlocks messaging.
    } catch (e) {
      debugPrint('Error in auto-follow on accept: $e');
    }
  }

  /// ✅ New: Check if user can send message (1 message limit for pending)
  Future<bool> canSendMessage(String conversationId) async {
    if (currentUserId == null) return false;

    final doc =
        await _firestore.collection('conversations').doc(conversationId).get();
    if (!doc.exists) return true;

    final data = doc.data()!;
    final status = data['status'] ?? 'accepted';

    if (status == 'accepted') return true;

    // If pending, check if I have already sent a message
    final messages = await _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .where('senderId', isEqualTo: currentUserId)
        .limit(1)
        .get();

    return messages.docs.isEmpty;
  }
}

// ─── Helper: wraps a merged doc list as a QuerySnapshot ─────────────────────
