/**
 * chat-web.js — TukTuk Web Chat Service
 * Real-time Firestore chat, synced with Flutter app seamlessly.
 * Requires: firebase-config.js (db, auth, firebase)
 */

window.TukTukChat = (function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────
  const CONV_COLLECTION = 'conversations';
  const PROD_COLLECTION = 'product_chats';

  function ts() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  function sortedId(a, b) {
    return [a, b].sort().join('_');
  }

  // ── Online Presence ────────────────────────────────────────────────────────
  let _presenceUid = null;
  let _presenceUnsubscribe = null;

  function setOnline(uid) {
    if (!uid || _presenceUid === uid) return;
    _presenceUid = uid;

    const userRef = db.collection('users').doc(uid);
    userRef.update({ isOnline: true, lastSeen: ts() }).catch(() => {
      userRef.set({ isOnline: true, lastSeen: ts() }, { merge: true });
    });

    // Mark offline on page unload
    window.addEventListener('beforeunload', () => {
      userRef.update({ isOnline: false, lastSeen: ts() }).catch(() => { });
    });

    // Heartbeat every 60s to keep presence alive
    _presenceUnsubscribe = setInterval(() => {
      userRef.update({ isOnline: true, lastSeen: ts() }).catch(() => { });
    }, 60000);
  }

  function setOffline(uid) {
    if (!uid) return;
    clearInterval(_presenceUnsubscribe);
    db.collection('users').doc(uid)
      .update({ isOnline: false, lastSeen: ts() })
      .catch(() => { });
    _presenceUid = null;
  }

  // ── Conversation helpers ───────────────────────────────────────────────────
  async function getOrCreateConversation(myUid, otherUid) {
    const convId = sortedId(myUid, otherUid);
    const ref = db.collection(CONV_COLLECTION).doc(convId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        participants: [myUid, otherUid].sort(),
        lastMessage: '',
        lastMessageAt: ts(),
        lastSenderId: '',
        [`unreadCount_${myUid}`]: 0,
        [`unreadCount_${otherUid}`]: 0,
        status: 'pending',
        requestBy: myUid,
        createdAt: ts(),
        platform: 'web',
        typing: {},
      });
    }
    return convId;
  }

  // ── Listen: conversations list ─────────────────────────────────────────────
  function listenConversations(uid, callback) {
    return db.collection(CONV_COLLECTION)
      .where('participants', 'array-contains', uid)
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .onSnapshot(snap => {
        const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(convs);
      }, err => console.warn('[chat] listenConversations:', err));
  }

  // ── Listen: product chats (buyer + seller merged) ─────────────────────────
  function listenProductChats(uid, callback) {
    const asBuyer = db.collection(PROD_COLLECTION)
      .where('buyerId', '==', uid)
      .orderBy('lastMessageAt', 'desc').limit(30);
    const asSeller = db.collection(PROD_COLLECTION)
      .where('sellerId', '==', uid)
      .orderBy('lastMessageAt', 'desc').limit(30);
    const asSellerLine = db.collection(PROD_COLLECTION)
      .where('lineUserId', '==', uid)
      .orderBy('lastMessageAt', 'desc').limit(30);

    let _buyer = [], _seller = [], _sellerLine = [];
    const merge = () => {
      const seen = new Set();
      const all = [..._buyer, ..._seller, ..._sellerLine].filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      all.sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis?.() || 0;
        const tb = b.lastMessageAt?.toMillis?.() || 0;
        return tb - ta;
      });
      callback(all);
    };

    const u1 = asBuyer.onSnapshot(s => { _buyer = s.docs.map(d => ({ id: d.id, ...d.data(), _role: 'buyer' })); merge(); });
    const u2 = asSeller.onSnapshot(s => { _seller = s.docs.map(d => ({ id: d.id, ...d.data(), _role: 'seller' })); merge(); });
    const u3 = asSellerLine.onSnapshot(s => { _sellerLine = s.docs.map(d => ({ id: d.id, ...d.data(), _role: 'seller' })); merge(); });

    return () => { u1(); u2(); u3(); };
  }

  // ── Listen: messages ───────────────────────────────────────────────────────
  function listenMessages(convId, collection, callback) {
    const orderField = collection === PROD_COLLECTION ? 'sentAt' : 'timestamp';
    return db.collection(collection).doc(convId)
      .collection('messages')
      .orderBy(orderField, 'asc')
      .limitToLast(100)
      .onSnapshot(snap => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(msgs);
      }, err => console.warn('[chat] listenMessages:', err));
  }

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage(convId, collection, text, session, media = null) {
    if (!text.trim() && !media) return;
    const uid = session.uid || session.lineUserId;
    const name = session.displayName || 'ผู้ใช้';
    const batch = db.batch();
    const convRef = db.collection(collection).doc(convId);
    const msgRef = convRef.collection('messages').doc();

    const now = ts();
    const messageData = {
      senderId: uid,
      senderName: name,
      text: text.trim(),
      timestamp: now,
      sentAt: now,
      type: media ? 'image' : 'text',
      isRead: false,
      status: 'sent',
    };

    if (media && media.url) {
      messageData.imageUrl = media.url;
      if (!messageData.text) messageData.text = '📷 ส่งรูปภาพ';
    }

    batch.set(msgRef, messageData);

    const updateData = {
      lastMessage: messageData.text,
      lastMessageAt: now,
      lastSenderId: uid,
    };

    if (collection === CONV_COLLECTION) {
      const otherUid = await _getOtherParticipant(convId, uid);
      updateData[`unreadCount_${otherUid}`] = firebase.firestore.FieldValue.increment(1);
      updateData.status = 'pending';
    } else {
      const snap = await convRef.get();
      const data = snap.data() || {};
      const isBuyer = data.buyerId === uid;
      updateData[isBuyer ? 'unreadCountSeller' : 'unreadCountBuyer'] = firebase.firestore.FieldValue.increment(1);
    }

    batch.update(convRef, updateData);
    await batch.commit();

    // Clear draft on success
    clearDraft(convId);
  }

  // ── File Upload ────────────────────────────────────────────────────────────
  async function uploadFile(file, path = 'chat_media') {
    if (!file) return null;
    const storageRef = firebase.storage().ref();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fileRef = storageRef.child(`${path}/${fileName}`);
    const snapshot = await fileRef.put(file);
    const url = await snapshot.ref.getDownloadURL();
    return { url, name: file.name };
  }

  async function _getOtherParticipant(convId, myUid) {
    const snap = await db.collection(CONV_COLLECTION).doc(convId).get();
    const parts = snap.data()?.participants || [];
    return parts.find(p => p !== myUid) || '';
  }

  // ── Typing indicator (Performance Tuned) ──────────────────────────────────
  let _typingTimer = null;
  let _lastTypingState = false;

  function setTyping(convId, collection, uid, isTyping) {
    // Only update if state changes to save writes
    if (_lastTypingState === isTyping) return;
    _lastTypingState = isTyping;

    db.collection(collection).doc(convId)
      .update({ [`typing.${uid}`]: isTyping })
      .catch(() => { });
  }

  function handleTypingInput(convId, collection, uid) {
    setTyping(convId, collection, uid, true);
    clearTimeout(_typingTimer);
    _typingTimer = setTimeout(() => setTyping(convId, collection, uid, false), 3000);
  }

  // ── Message Drafts ──────────────────────────────────────────────────────────
  function saveDraft(convId, text) {
    if (!convId) return;
    const drafts = JSON.parse(localStorage.getItem('tuktuk_chat_drafts') || '{}');
    if (text && text.trim()) {
      drafts[convId] = text;
    } else {
      delete drafts[convId];
    }
    localStorage.setItem('tuktuk_chat_drafts', JSON.stringify(drafts));
  }

  function getDraft(convId) {
    if (!convId) return '';
    const drafts = JSON.parse(localStorage.getItem('tuktuk_chat_drafts') || '{}');
    return drafts[convId] || '';
  }

  function clearDraft(convId) {
    saveDraft(convId, '');
  }

  // ── Mark as read ───────────────────────────────────────────────────────────
  function markAsRead(convId, collection, uid) {
    const field = collection === CONV_COLLECTION
      ? `unreadCount_${uid}`
      : null; // determined by role below

    if (field) {
      db.collection(collection).doc(convId)
        .update({ [field]: 0 }).catch(() => { });
      return;
    }
    // product_chat: need role
    db.collection(collection).doc(convId).get().then(snap => {
      const data = snap.data() || {};
      const f = data.buyerId === uid ? 'unreadCountBuyer' : 'unreadCountSeller';
      db.collection(collection).doc(convId).update({ [f]: 0 }).catch(() => { });
    });
  }

  // ── Accept conversation ────────────────────────────────────────────────────
  function acceptConversation(convId) {
    return db.collection(CONV_COLLECTION).doc(convId).update({
      status: 'accepted',
      acceptedAt: ts(),
    });
  }

  // ── Get user profile ───────────────────────────────────────────────────────
  async function getUserProfile(uid) {
    if (!uid) return null;
    const [snap1, snap2] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('line_users').doc(uid).get(),
    ]);
    if (snap1.exists) return { id: snap1.id, ...snap1.data() };
    if (snap2.exists) return { id: snap2.id, ...snap2.data() };
    return null;
  }

  // ── Listen online status ───────────────────────────────────────────────────
  function listenOnlineStatus(uid, callback) {
    return db.collection('users').doc(uid)
      .onSnapshot(snap => {
        callback(snap.data()?.isOnline || false);
      });
  }

  // ── Total unread count ─────────────────────────────────────────────────────
  function listenTotalUnread(uid, callback) {
    let _dmTotal = 0, _prodTotal = 0;

    // Listen to DM unreads
    const u1 = db.collection(CONV_COLLECTION)
      .where('participants', 'array-contains', uid)
      .onSnapshot(snap => {
        _dmTotal = 0;
        snap.docs.forEach(d => { _dmTotal += d.data()[`unreadCount_${uid}`] || 0; });
        callback(_dmTotal + _prodTotal);
      });

    // Listen to Product Chat unreads
    const asBuyer = db.collection(PROD_COLLECTION).where('buyerId', '==', uid);
    const asSeller = db.collection(PROD_COLLECTION).where('sellerId', '==', uid);

    let _b = 0, _s = 0;
    const updateProd = () => {
      _prodTotal = _b + _s;
      callback(_dmTotal + _prodTotal);
    };

    const u2 = asBuyer.onSnapshot(snap => {
      _b = 0;
      snap.docs.forEach(d => { _b += d.data().unreadCountBuyer || 0; });
      updateProd();
    });
    const u3 = asSeller.onSnapshot(snap => {
      _s = 0;
      snap.docs.forEach(d => { _s += d.data().unreadCountSeller || 0; });
      updateProd();
    });

    return () => { u1(); u2(); u3(); };
  }

  // ── User Settings: Pinned/Archived ────────────────────────────────────────
  function listenChatSettings(uid, callback) {
    if (!uid) return () => {};
    return db.collection('user_chat_settings').doc(uid)
      .onSnapshot(snap => {
        callback(snap.data() || { pinned: [], archived: [] });
      }, err => console.warn('[chat] listenChatSettings:', err));
  }

  function togglePin(uid, convId, isPinned) {
    if (!uid || !convId) return Promise.reject('Missing parameters');
    const ref = db.collection('user_chat_settings').doc(uid);
    return ref.set({
      pinned: isPinned 
        ? firebase.firestore.FieldValue.arrayUnion(convId)
        : firebase.firestore.FieldValue.arrayRemove(convId)
    }, { merge: true });
  }

  function toggleArchive(uid, convId, isArchived) {
    if (!uid || !convId) return Promise.reject('Missing parameters');
    const ref = db.collection('user_chat_settings').doc(uid);
    return ref.set({
      archived: isArchived
        ? firebase.firestore.FieldValue.arrayUnion(convId)
        : firebase.firestore.FieldValue.arrayRemove(convId)
    }, { merge: true });
  }

  function deleteConversation(uid, convId, collection) {
    // Note: In a real app, delete might be complex (permissions).
    // Here we just remove it from user_chat_settings if relevant, 
    // or you could soft-delete in the main collection.
    return db.collection(collection).doc(convId).delete();
  }

  return {
    setOnline,
    setOffline,
    getOrCreateConversation,
    listenConversations,
    listenProductChats,
    listenMessages,
    sendMessage,
    uploadFile,
    saveDraft,
    getDraft,
    setTyping,
    handleTypingInput,
    markAsRead,
    acceptConversation,
    getUserProfile,
    listenOnlineStatus,
    listenTotalUnread,
    listenChatSettings,
    togglePin,
    toggleArchive,
    deleteConversation,
    CONV: CONV_COLLECTION,
    PROD: PROD_COLLECTION,
  };
})();
