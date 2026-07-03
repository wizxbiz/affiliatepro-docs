/**
 * TukTuk Web Push Notification Service
 * ─────────────────────────────────────
 * VAPID Public  : BB1PIY55wKXv37de8hWFkxxyE3SMRu1PXOBwYPVY1dA5Tz5O7n9FHPpQDihraJ_G7qjnLVF6EiPGxI3XsU5m--Q
 * VAPID Private : set via env VAPID_PRIVATE_KEY (Firebase Functions config or Secret Manager)
 * Subject       : mailto:admin@appinjproject.web.app
 *
 * Firestore schema:
 *   push_subscriptions/{uid}/devices/{deviceId}
 *     endpoint   : string
 *     keys       : { p256dh, auth }
 *     userAgent  : string
 *     createdAt  : Timestamp
 *     active     : boolean
 */

'use strict';

const webpush = require('web-push');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const VAPID_PUBLIC  = 'BB1PIY55wKXv37de8hWFkxxyE3SMRu1PXOBwYPVY1dA5Tz5O7n9FHPpQDihraJ_G7qjnLVF6EiPGxI3XsU5m--Q';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'aISVa82toXoi-hWHDIk-jylpflPb6G5ZFOglII_i2sQ';
const VAPID_SUBJECT = 'mailto:admin@appinjproject.web.app';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// ── Payload builders ──────────────────────────────────────────────────────────

const ICON = '/assets/images/icon-192.png';
const BADGE = '/assets/images/icon-192-maskable.png';

function buildPayload(type, data) {
  const payloads = {
    new_order: {
      title: '🛒 มีออเดอร์ใหม่!',
      body:  `${data.buyerName || 'ลูกค้า'} สั่ง "${data.productName || 'สินค้า'}" ฿${data.amount || ''}`,
      icon:  ICON, badge: BADGE,
      tag:   `order-${data.orderId}`,
      data:  { url: '/seller-dashboard.html?tab=orders', orderId: data.orderId },
      actions: [
        { action: 'view',   title: '👀 ดูออเดอร์' },
        { action: 'dismiss', title: 'ปิด' },
      ],
    },
    new_message: {
      title: `💬 ${data.senderName || 'ข้อความใหม่'}`,
      body:  data.message || 'มีข้อความใหม่',
      icon:  data.senderAvatar || ICON, badge: BADGE,
      tag:   `msg-${data.threadId}`,
      data:  { url: `/messages.html?id=${data.threadId}&type=conv` },
      actions: [
        { action: 'reply',   title: '↩️ ตอบกลับ' },
        { action: 'dismiss', title: 'ปิด' },
      ],
    },
    escrow_released: {
      title: '💰 ได้รับเงินแล้ว!',
      body:  `฿${data.amount || ''} จากออเดอร์ ${data.orderId || ''} โอนเข้าบัญชีแล้ว`,
      icon:  ICON, badge: BADGE,
      tag:   `escrow-${data.orderId}`,
      data:  { url: '/liff-seller.html' },
    },
    order_shipped: {
      title: '📦 สินค้าถูกส่งแล้ว',
      body:  `ออเดอร์ ${data.orderId || ''} กำลังมาหาคุณ`,
      icon:  ICON, badge: BADGE,
      tag:   `shipped-${data.orderId}`,
      data:  { url: `/product.html?order=${data.orderId}` },
    },
    win_rider_accepted: {
      title: '🏍 วินรับงานแล้ว!',
      body:  `${data.riderName || 'วิน'} กำลังมา — ${data.eta || 'ไม่กี่นาที'}`,
      icon:  ICON, badge: BADGE,
      tag:   `win-${data.requestId}`,
      data:  { url: '/win-rider.html' },
    },
    subscription_expiring: {
      title: '⏰ แพ็กเกจใกล้หมดอายุ',
      body:  `เหลืออีก ${data.daysLeft || ''} วัน — ต่ออายุเพื่อขายต่อเนื่อง`,
      icon:  ICON, badge: BADGE,
      tag:   'sub-expiring',
      data:  { url: '/seller-dashboard.html?tab=subscription' },
    },
    promo: {
      title: data.title || '🎉 TukTuk Thailand',
      body:  data.body  || '',
      icon:  ICON, badge: BADGE,
      tag:   'promo',
      data:  { url: data.url || '/' },
      image: data.image || undefined,
    },
  };
  return payloads[type] || { title: 'TukTuk', body: data.body || '', icon: ICON, badge: BADGE, data: { url: '/' } };
}

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send web push to a single subscription object.
 * Returns true on success, false on expired/gone (caller should delete).
 */
async function sendToSubscription(subscription, payload) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 86400 }  // 24h
    );
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) return false; // expired
    console.warn('[Push] send error:', err.statusCode, err.message);
    return false;
  }
}

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Send notification to ALL devices of a user.
 * @param {string} uid   Firestore user uid
 * @param {string} type  Payload type key
 * @param {object} data  Payload data
 */
async function notifyUser(uid, type, data = {}) {
  const db = getFirestore();
  const devicesRef = db.collection('push_subscriptions').doc(uid).collection('devices');
  const snap = await devicesRef.where('active', '==', true).get();
  if (snap.empty) return;

  const payload = buildPayload(type, data);
  const expired = [];

  await Promise.all(snap.docs.map(async doc => {
    const sub = doc.data().subscription;
    const ok  = await sendToSubscription(sub, payload);
    if (!ok) expired.push(doc.ref);
  }));

  // Clean up expired subscriptions
  if (expired.length) {
    const batch = db.batch();
    expired.forEach(ref => batch.update(ref, { active: false }));
    await batch.commit();
  }
}

/**
 * Broadcast to multiple users.
 */
async function notifyUsers(uids, type, data = {}) {
  await Promise.all(uids.map(uid => notifyUser(uid, type, data)));
}

/**
 * Broadcast to all subscribed users (use sparingly — promos only).
 */
async function broadcastAll(type, data = {}) {
  const db = getFirestore();
  const snap = await db.collection('push_subscriptions').limit(500).get();
  const uids = snap.docs.map(d => d.id);
  await notifyUsers(uids, type, data);
}

module.exports = { notifyUser, notifyUsers, broadcastAll, buildPayload, VAPID_PUBLIC };
