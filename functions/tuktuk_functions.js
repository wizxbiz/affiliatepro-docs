"use strict";

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// =====================================================
// 🛒 SELLER SUBSCRIPTION BILLING
// =====================================================

/**
 * createSubscriptionInvoice — สร้างใบแจ้งหนี้ร้านค้า
 * Called from Flutter when seller selects a subscription plan.
 * Returns invoice details; actual payment verification + activation stays in the app.
 */
exports.createSubscriptionInvoice = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");

  const PLANS = {
    quarter_3m: { name: "3 เดือน", amount: 899, months: 3 },
    half_6m: { name: "6 เดือน", amount: 1599, months: 6 },
    yearly_12m: { name: "รายปี 12 เดือน", amount: 2899, months: 12 },
  };

  const { planId } = request.data;
  const plan = PLANS[planId];
  if (!plan) throw new HttpsError("invalid-argument", `Unknown planId: ${planId}`);

  const db = getFirestore();
  const sellerSnap = await db.collection("seller_profiles").doc(uid).get();
  const seller = sellerSnap.data() || {};

  // ต่อจาก trial/expiry ที่เหลือ ไม่ใช่ reset
  const curExpiry = seller.subscriptionPlan?.expiryDate
    ? new Date(seller.subscriptionPlan.expiryDate)
    : seller.subscriptionPlan?.trialEndDate
      ? new Date(seller.subscriptionPlan.trialEndDate)
      : new Date();
  const base = curExpiry > new Date() ? curExpiry : new Date();
  const expiryDate = new Date(base);
  expiryDate.setMonth(expiryDate.getMonth() + plan.months);

  const invoiceId = `INV-${Date.now()}-${uid.substring(0, 6).toUpperCase()}`;
  const dueDate = new Date(Date.now() + 7 * 86400000); // 7 days

  await db.collection("invoices").doc(invoiceId).set({
    invoiceId,
    sellerId: uid,
    shopName: seller.shopName || "",
    planId,
    planName: plan.name,
    amount: plan.amount,
    durationMonths: plan.months,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    dueDate: dueDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
  });

  console.log(`📋 Invoice created: ${invoiceId} for seller ${uid} plan=${planId}`);
  return {
    invoiceId,
    amount: plan.amount,
    planName: plan.name,
    dueDate: dueDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
  };
});

// =====================================================
// 🔍 SEARCH & FILTER CLOUD FUNCTIONS
// =====================================================

/**
 * Autocomplete suggestions — prefix search on productNameLower
 * across marketplace_items + community_products
 */
exports.getSearchSuggestions = onCall(async (request) => {
  const { query, limit = 8 } = request.data || {};
  if (!query || query.length < 2) return { suggestions: [] };
  const q = query.toLowerCase().trim();

  try {
    const db = getFirestore();
    const [itemsSnap, communitySnap] = await Promise.all([
      db.collection('marketplace_items')
        .where('status', '==', 'active')
        .where('productNameLower', '>=', q)
        .where('productNameLower', '<', q + '\uf8ff')
        .limit(20)
        .get(),
      db.collection('community_products')
        .where('productNameLower', '>=', q)
        .where('productNameLower', '<', q + '\uf8ff')
        .limit(10)
        .get(),
    ]);

    const seen = new Set();
    const suggestions = [];
    [...itemsSnap.docs, ...communitySnap.docs].forEach((doc) => {
      const name = doc.data().productName || '';
      if (name && !seen.has(name)) {
        seen.add(name);
        suggestions.push(name);
      }
    });
    return { suggestions: suggestions.slice(0, limit) };
  } catch (err) {
    console.error('getSearchSuggestions error:', err.message);
    return { suggestions: [] };
  }
});

/**
 * Advanced marketplace search with server-side filtering:
 * category, province, price range, sort, OTOP toggle
 */
exports.advancedMarketplaceSearch = onCall(async (request) => {
  const {
    query = '',
    category,
    province,
    minPrice,
    maxPrice,
    sortBy = 'newest',
    isOtop = false,
    limit = 40,
  } = request.data || {};

  const db = getFirestore();
  const col = isOtop ? 'community_products' : 'marketplace_items';
  let ref = db.collection(col).where('status', '==', 'active');

  if (category && category !== 'all' && category !== 'ทั้งหมด') {
    ref = ref.where('category', '==', category);
  }
  if (province) {
    ref = ref.where('province', '==', province);
  }

  if (sortBy === 'price_asc') ref = ref.orderBy('price', 'asc');
  else if (sortBy === 'price_desc') ref = ref.orderBy('price', 'desc');
  else if (sortBy === 'popular') ref = ref.orderBy('viewCount', 'desc');
  else ref = ref.orderBy('createdAt', 'desc');

  try {
    const snap = await ref.limit(limit * 2).get();
    let results = snap.docs.map((d) => ({ id: d.id, source: col, ...d.data() }));

    // Client-side: price range (Firestore can't filter on multiple range fields)
    if (minPrice != null) results = results.filter((p) => (p.price || 0) >= minPrice);
    if (maxPrice != null) results = results.filter((p) => (p.price || 0) <= maxPrice);

    // Text filter
    if (query.trim()) {
      const ql = query.toLowerCase();
      results = results.filter(
        (p) =>
          (p.productName || '').toLowerCase().includes(ql) ||
          (p.description || '').toLowerCase().includes(ql) ||
          (p.tags || []).some((t) => (t || '').toLowerCase().includes(ql))
      );
    }

    return { results: results.slice(0, limit), total: results.length };
  } catch (err) {
    console.error('advancedMarketplaceSearch error:', err.message);
    return { results: [], total: 0 };
  }
});

// =====================================================
// 🔒 PHASE 3: ESCROW PAYMENT SYSTEM (Firestore)
// =====================================================

async function _notifyEscrow(sellerId, type, orderId, amount) {
  try {
    const db = getFirestore();
    const snap = await db.collection("users").doc(sellerId).get();
    const lineId = snap.data()?.lineUserId || snap.data()?.lineId;
    if (!lineId) return;
    const messages = type === "created"
      ? [{ type: "text", text: `🛒 มีออเดอร์ใหม่! ยอด ฿${Number(amount).toLocaleString()} กำลังพักในระบบ Escrow\nออเดอร์: ${orderId}\n\nลูกค้าต้องกดยืนยันรับสินค้าเพื่อโอนเงินให้คุณ 🛺` }]
      : [{ type: "text", text: `💰 ได้รับเงิน ฿${Number(amount).toLocaleString()} จากออเดอร์ ${orderId} แล้ว!\nดูยอดเงินได้ใน LIFF ร้านค้า 🛺` }];
    const { getTuktukClient } = require("./line_client");
    const client = getTuktukClient();
    await client.pushMessage({ to: lineId, messages });
  } catch (e) {
    console.warn("_notifyEscrow failed:", e.message);
  }
}

exports.verifyPaymentSlip = onCall({ secrets: ["SLIPOK_API_KEY", "SLIPOK_BRANCH_ID"] }, async (request) => {
  const { slipBase64, orderId, expectedAmount } = request.data;
  if (!slipBase64 || !orderId) throw new HttpsError("invalid-argument", "Missing slipBase64 or orderId");
  const apiKey    = process.env.SLIPOK_API_KEY    || "";
  const branchId  = process.env.SLIPOK_BRANCH_ID  || "";
  if (!apiKey || !branchId) throw new HttpsError("failed-precondition", "SlipOK credentials not configured");

  try {
    const buffer = Buffer.from(slipBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const form = new FormData();
    form.append("amount", String(expectedAmount || 0));
    form.append("files", blob, "slip.jpg");

    // SlipOK endpoint: POST /api/line/apikey/{branchId}
    const resp = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: "POST",
      headers: { "x-lib-apikey": apiKey },
      body: form,
    });
    const result = await resp.json();
    if (!result.success) throw new HttpsError("aborted", result.message || "Slip rejected by SlipOK");
    return {
      success: true,
      transId: result.data?.transRef || `SLP-${Date.now()}`,
      actualAmount: result.data?.amount,
    };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    throw new HttpsError("internal", `SlipOK error: ${e.message}`);
  }
});

exports.createEscrowRecord = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");
  const { orderId, slipTransId, amount, sellerId } = request.data;
  if (!orderId || !slipTransId || !amount || !sellerId)
    throw new HttpsError("invalid-argument", "Missing orderId, slipTransId, amount, or sellerId");

  const db = getFirestore();
  const escrowId = `ESC-${Date.now()}-${orderId.substring(0, 6).toUpperCase()}`;
  const autoReleaseAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const batch = db.batch();

  batch.set(db.collection("escrow_records").doc(escrowId), {
    escrowId, orderId, buyerId: uid, sellerId,
    amount: parseFloat(amount), slipTransId,
    status: "held",
    createdAt: FieldValue.serverTimestamp(),
    autoReleaseAt,
  });
  batch.update(db.collection("product_orders").doc(orderId), {
    status: "paid_escrow", slipTransId, escrowId,
    paidAt: FieldValue.serverTimestamp(),
  });
  batch.update(db.collection("users").doc(sellerId), {
    escrow_balance: FieldValue.increment(parseFloat(amount)),
  });
  await batch.commit();

  await _notifyEscrow(sellerId, "created", orderId, parseFloat(amount));
  return { success: true, escrowId };
});

exports.buyerConfirmReceipt = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Login required");
  const { orderId } = request.data;
  if (!orderId) throw new HttpsError("invalid-argument", "Missing orderId");

  const db = getFirestore();
  const snap = await db.collection("escrow_records")
    .where("orderId", "==", orderId)
    .where("status", "==", "held")
    .limit(1).get();
  if (snap.empty) throw new HttpsError("not-found", "Escrow not found or already released");

  const escrowDoc = snap.docs[0];
  const { sellerId, amount } = escrowDoc.data();
  const batch = db.batch();
  batch.update(escrowDoc.ref, { status: "released", releasedAt: FieldValue.serverTimestamp() });
  batch.update(db.collection("product_orders").doc(orderId), {
    status: "completed", completedAt: FieldValue.serverTimestamp(),
  });
  batch.update(db.collection("users").doc(sellerId), {
    escrow_balance: FieldValue.increment(-amount),
    available_balance: FieldValue.increment(amount),
    total_earned: FieldValue.increment(amount),
  });
  await batch.commit();

  await _notifyEscrow(sellerId, "released", orderId, amount);
  return { success: true };
});

// =====================================================
// 🔔 FCM PUSH NOTIFICATION — ORDER TRIGGERS
// =====================================================

/**
 * onOrderCreated — fires when a new product_orders document is written.
 * Sends FCM push notification to the seller's device.
 */
exports.onOrderCreated = onDocumentCreated(
  { document: "product_orders/{orderId}", region: "us-central1" },
  async (event) => {
    const order = event.data?.data();
    if (!order) return;

    const { sellerId, productName, totalAmount, buyerName } = order;
    if (!sellerId) return;

    const db = getFirestore();
    const sellerSnap = await db.collection("users").doc(sellerId).get();
    const fcmToken = sellerSnap.data()?.fcmToken;
    if (!fcmToken) return;

    const amountStr = Number(totalAmount || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 0,
    });
    const buyer = buyerName || "ลูกค้า";
    const product = productName || "สินค้า";

    try {
      await getMessaging().send({
        token: fcmToken,
        notification: {
          title: "🛒 ออเดอร์ใหม่!",
          body: `${buyer} สั่งซื้อ ${product} ฿${amountStr}`,
        },
        data: {
          orderId: event.params.orderId,
          type: "new_order",
          sellerId,
        },
        android: { priority: "high" },
        apns: {
          payload: { aps: { sound: "default", badge: 1 } },
        },
      });
      console.log(`[FCM] Sent new_order notification to seller ${sellerId}`);
    } catch (err) {
      console.warn(`[FCM] Failed to notify seller ${sellerId}:`, err.message);
    }
  }
);

/**
 * onNewWinRiderRequest — fires when a new win_rider_requests document is created.
 * Finds all online riders within 5 km and sends FCM push notification.
 */
exports.onNewWinRiderRequest = onDocumentCreated(
  { document: "win_rider_requests/{requestId}", region: "us-central1" },
  async (event) => {
    const req = event.data?.data();
    if (!req || req.status !== "pending") return;

    const { pickupLat, pickupLng, requesterName, targetRiderId } = req;
    const db = getFirestore();
    const ridersSnap = await db.collection("win_riders").where("isOnline", "==", true).get();

    const RADIUS_KM = 5;
    const notifyTargets = [];

    for (const doc of ridersSnap.docs) {
      const riderData = doc.data();
      const fcmToken = riderData.fcmToken;
      if (!fcmToken) continue;
      if (targetRiderId && doc.id !== targetRiderId) continue;
      if (pickupLat != null && pickupLng != null && riderData.lat != null && riderData.lng != null) {
        const dlat = (riderData.lat - pickupLat) * 111.0;
        const dlng = (riderData.lng - pickupLng) * 111.0 * 0.985;
        if (Math.sqrt(dlat * dlat + dlng * dlng) > RADIUS_KM) continue;
      }
      notifyTargets.push({ uid: doc.id, fcmToken });
    }

    if (notifyTargets.length === 0) {
      console.log(`[WIN] No nearby online riders for request ${event.params.requestId}`);
      return;
    }

    const customer = requesterName || "ลูกค้า";
    await Promise.all(
      notifyTargets.map(({ uid, fcmToken }) =>
        getMessaging().send({
          token: fcmToken,
          notification: {
            title: "🛺 มีลูกค้าเรียกวิน!",
            body: `${customer} ต้องการใช้บริการ — แตะเพื่อดูรายละเอียด`,
          },
          data: {
            requestId: event.params.requestId,
            type: "win_rider_request",
            pickupLat: String(pickupLat ?? ""),
            pickupLng: String(pickupLng ?? ""),
          },
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default", badge: 1 } } },
        }).catch((err) => console.warn(`[WIN] FCM failed for rider ${uid}:`, err.message))
      )
    );
    console.log(`[WIN] Notified ${notifyTargets.length} rider(s) for request ${event.params.requestId}`);
  }
);

module.exports = {
  createSubscriptionInvoice: exports.createSubscriptionInvoice,
  getSearchSuggestions: exports.getSearchSuggestions,
  advancedMarketplaceSearch: exports.advancedMarketplaceSearch,
  verifyPaymentSlip: exports.verifyPaymentSlip,
  createEscrowRecord: exports.createEscrowRecord,
  buyerConfirmReceipt: exports.buyerConfirmReceipt,
  onOrderCreated: exports.onOrderCreated,
  onNewWinRiderRequest: exports.onNewWinRiderRequest,
};
