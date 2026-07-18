"use strict";

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { notifyUser } = require("./notifications");

/**
 * saveWebPushSubscription — รับ subscription จาก browser แล้วบันทึก Firestore
 * Called by push-notifications.js after PushManager.subscribe()
 */
exports.saveWebPushSubscription = onCall(async (request) => {
  const { subscription, uid: bodyUid } = request.data;
  const uid = request.auth?.uid || bodyUid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");
  if (!subscription?.endpoint) throw new HttpsError("invalid-argument", "Invalid subscription");

  const db = getFirestore();
  // Use last 20 chars of endpoint as device ID (stable per browser)
  const deviceId = Buffer.from(subscription.endpoint).toString("base64").slice(-20).replace(/[^a-zA-Z0-9]/g, "X");

  await db.collection("push_subscriptions").doc(uid).collection("devices").doc(deviceId).set({
    subscription,
    userAgent: (request.rawRequest?.headers?.["user-agent"] || "").slice(0, 120),
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true, deviceId };
});

/**
 * sendTestPush — ทดสอบส่ง notification ให้ตัวเอง (dev only)
 */
exports.sendTestPush = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");
  await notifyUser(uid, "promo", {
    title: "🎉 ทดสอบ Notification",
    body: "TukTuk Web Push ทำงานแล้ว!",
    url: "/",
  });
  return { success: true };
});

// ── Firestore Triggers → Push ──────────────────────────────────────────────

/**
 * Trigger: product_orders/{orderId} created → notify seller
 */
exports.onOrderCreatedPush = onDocumentCreated(
  { document: "product_orders/{orderId}", region: "asia-southeast1" },
  async (event) => {
    const order = event.data?.data();
    if (!order) return;
    const { sellerId, buyerName, productName, totalAmount, orderId } = order;
    if (!sellerId) return;
    await notifyUser(sellerId, "new_order", {
      buyerName: buyerName || "ลูกค้า",
      productName: productName || "สินค้า",
      amount: totalAmount || order.price || 0,
      orderId: orderId || event.params.orderId,
    });
  }
);

/**
 * Trigger: escrow_records/{id} updated status=released → notify seller
 */
exports.onEscrowReleasedPush = onDocumentUpdated(
  { document: "escrow_records/{escrowId}", region: "asia-southeast1" },
  async (event) => {
    const before = event.data?.before?.data();
    const after  = event.data?.after?.data();
    if (!after || before?.status === after?.status) return;
    if (after.status !== "released") return;
    await notifyUser(after.sellerId, "escrow_released", {
      amount: after.amount,
      orderId: after.orderId,
    });
  }
);

/**
 * Trigger: conversations/{threadId}/messages/{msgId} created → notify recipient
 */
exports.onNewMessagePush = onDocumentCreated(
  { document: "conversations/{threadId}/messages/{msgId}", region: "asia-southeast1" },
  async (event) => {
    const msg = event.data?.data();
    if (!msg) return;
    const { senderId, recipientId, text, senderName, senderAvatar } = msg;
    if (!recipientId || !senderId) return;
    await notifyUser(recipientId, "new_message", {
      senderName: senderName || "ข้อความใหม่",
      senderAvatar,
      message: (text || "").slice(0, 80),
      threadId: event.params.threadId,
    });
  }
);

module.exports = {
  saveWebPushSubscription: exports.saveWebPushSubscription,
  sendTestPush: exports.sendTestPush,
  onOrderCreatedPush: exports.onOrderCreatedPush,
  onEscrowReleasedPush: exports.onEscrowReleasedPush,
  onNewMessagePush: exports.onNewMessagePush,
};
