"use strict";

// ============================================================
// renewal_codes.js — transferable subscription renewal codes
// ------------------------------------------------------------
// • issueRenewalCode()  → mint a one-time code (RENEW-XXXX-XXXX)
// • redeemRenewalCode() → redeem once, extend the user's premiumExpiry
// • Flex builders for the LINE replies
//
// DB: Firestore today. ALL Firestore access is isolated behind
// getDb()/FieldValue here — when migrating to MongoDB, only this
// file (and slip_verifier stays as-is) needs new collection calls.
// Collection: `renewal_codes`  (doc id = the code itself).
// ============================================================

const crypto = require("crypto");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getPlan } = require("./subscription_plans");

const COLLECTION = "renewal_codes";
// no ambiguous chars (O/0, I/1, L) so codes are easy to read/type
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function _rand(n) {
  const bytes = crypto.randomBytes(n);
  let s = "";
  for (let i = 0; i < n; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

function _makeCode() {
  return `RENEW-${_rand(4)}-${_rand(4)}`;
}

const CODE_RE = /^RENEW-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
function isRenewalCode(text) {
  return CODE_RE.test(String(text || "").trim());
}

/**
 * Mint a one-time renewal code.
 * @param {object} o
 * @param {string} o.priceCode   e.g. "99","259","699" (matched in subscription_plans)
 * @param {number} [o.months]     override duration
 * @param {string} [o.packageName]
 * @param {string} [o.issuedBy]   admin userId / "slipok-auto" / "system"
 * @param {string|null} [o.boundUserId]  if set, only this user may redeem
 * @param {string} [o.refNote]    free text (e.g. slip transRef)
 * @param {number} [o.validDays]  days until the code itself expires (default 60)
 * @returns {Promise<{code,months,packageName,codeExpiresAt}>}
 */
async function issueRenewalCode(o = {}) {
  const db = getFirestore();
  const plan = getPlan(o.priceCode);
  const months = o.months || (plan ? plan.months : 1);
  const packageName = o.packageName || (plan ? plan.name : "Premium");
  const validDays = o.validDays || 60;

  // generate a unique code (retry on rare collision)
  let code, exists = true, tries = 0;
  while (exists && tries < 8) {
    code = _makeCode();
    const snap = await db.collection(COLLECTION).doc(code).get();
    exists = snap.exists;
    tries++;
  }
  const codeExpiresAt = new Date(Date.now() + validDays * 86400000).toISOString();

  await db.collection(COLLECTION).doc(code).set({
    code,
    months,
    packageName,
    priceCode: o.priceCode != null ? String(o.priceCode) : null,
    status: "unused",
    issuedBy: o.issuedBy || "system",
    boundUserId: o.boundUserId || null,
    refNote: o.refNote || "",
    createdAt: FieldValue.serverTimestamp(),
    codeExpiresAt,
  });
  return { code, months, packageName, codeExpiresAt };
}

/**
 * Redeem a renewal code for a user, extending premiumExpiry by code.months.
 * Atomic (transaction) → cannot be double-redeemed.
 * @returns {Promise<{success, message, newExpiry?, months?, packageName?}>}
 */
async function redeemRenewalCode(rawCode, userId) {
  const db = getFirestore();
  const code = String(rawCode || "").trim().toUpperCase();
  if (!isRenewalCode(code)) return { success: false, message: "รูปแบบรหัสไม่ถูกต้อง (ตัวอย่าง: RENEW-AB12-CD34)" };
  if (!userId) return { success: false, message: "ไม่พบบัญชีผู้ใช้" };

  const codeRef = db.collection(COLLECTION).doc(code);
  const userRef = db.collection("line_users").doc(userId);

  return db.runTransaction(async (tx) => {
    // ── all reads first (Firestore requirement) ──
    const codeSnap = await tx.get(codeRef);
    if (!codeSnap.exists) return { success: false, message: "ไม่พบรหัสนี้ในระบบ" };
    const d = codeSnap.data();
    if (d.status === "used") return { success: false, message: "รหัสนี้ถูกใช้งานไปแล้ว" };
    if (d.boundUserId && d.boundUserId !== userId) return { success: false, message: "รหัสนี้ไม่ได้ออกให้บัญชีของคุณ" };
    if (d.codeExpiresAt && new Date(d.codeExpiresAt) < new Date()) return { success: false, message: "รหัสนี้หมดอายุการใช้งานแล้ว" };

    const userSnap = await tx.get(userRef);
    const u = userSnap.exists ? userSnap.data() : {};

    // extend from current expiry if still active, else from now (no truncation)
    let base = new Date();
    const cur = u.premiumExpiry;
    const curDate = cur && cur.toDate ? cur.toDate() : (cur ? new Date(cur) : null);
    if (curDate && curDate > base) base = curDate;
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + (d.months || 1));

    // ── writes ──
    tx.update(codeRef, { status: "used", usedBy: userId, usedAt: FieldValue.serverTimestamp() });
    tx.set(userRef, {
      isPremium: true,
      subscriptionStatus: "active",
      selectedPackage: d.packageName,
      premiumExpiry: newExpiry,
      premiumStartDate: u.premiumStartDate || FieldValue.serverTimestamp(),
      lastRenewalCode: code,
      lastRenewalAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true, message: "ต่ออายุสำเร็จ", newExpiry, months: d.months || 1, packageName: d.packageName };
  });
}

// ── Flex builders (LINE) ────────────────────────────────────

function buildRenewalSuccessFlex(userName, packageName, expiryStr, code) {
  return {
    type: "flex",
    altText: `✅ ต่ออายุสำเร็จ — ${packageName} ถึง ${expiryStr}`,
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "md",
        contents: [
          { type: "text", text: "✅ ต่ออายุสำเร็จ", weight: "bold", size: "xl", color: "#16A34A", align: "center" },
          { type: "text", text: `ยินดีด้วยครับ คุณ${userName || "ผู้ใช้"} 🎉`, size: "sm", color: "#555555", align: "center", wrap: true },
          { type: "separator", margin: "md" },
          { type: "box", layout: "vertical", spacing: "sm", margin: "md", contents: [
            { type: "box", layout: "baseline", contents: [
              { type: "text", text: "แพ็คเกจ", size: "sm", color: "#999999", flex: 2 },
              { type: "text", text: String(packageName || "Premium"), size: "sm", color: "#111111", flex: 4, wrap: true, weight: "bold" },
            ]},
            { type: "box", layout: "baseline", contents: [
              { type: "text", text: "หมดอายุ", size: "sm", color: "#999999", flex: 2 },
              { type: "text", text: String(expiryStr || "-"), size: "sm", color: "#111111", flex: 4, wrap: true },
            ]},
            { type: "box", layout: "baseline", contents: [
              { type: "text", text: "รหัส", size: "sm", color: "#999999", flex: 2 },
              { type: "text", text: String(code || "-"), size: "xs", color: "#999999", flex: 4, wrap: true },
            ]},
          ]},
        ],
      },
    },
  };
}

function buildCodeIssuedFlex(code, packageName, months, codeExpiresAt, boundUserId) {
  let expStr = "-";
  try { expStr = new Date(codeExpiresAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }); } catch (e) {}
  return {
    type: "flex",
    altText: `🔑 รหัสต่ออายุ ${code}`,
    contents: {
      type: "bubble",
      body: {
        type: "box", layout: "vertical", spacing: "md",
        contents: [
          { type: "text", text: "🔑 ออกรหัสต่ออายุแล้ว", weight: "bold", size: "lg", color: "#2563EB", align: "center" },
          { type: "box", layout: "vertical", margin: "md", paddingAll: "12px", backgroundColor: "#F1F5FF", cornerRadius: "10px", contents: [
            { type: "text", text: String(code), weight: "bold", size: "xl", color: "#1E3A8A", align: "center" },
          ]},
          { type: "box", layout: "vertical", spacing: "sm", margin: "md", contents: [
            { type: "box", layout: "baseline", contents: [
              { type: "text", text: "แพ็คเกจ", size: "sm", color: "#999999", flex: 2 },
              { type: "text", text: String(packageName || "Premium"), size: "sm", color: "#111111", flex: 4, wrap: true, weight: "bold" },
            ]},
            { type: "box", layout: "baseline", contents: [
              { type: "text", text: "ระยะเวลา", size: "sm", color: "#999999", flex: 2 },
              { type: "text", text: `${months || 1} เดือน`, size: "sm", color: "#111111", flex: 4 },
            ]},
            { type: "box", layout: "baseline", contents: [
              { type: "text", text: "ใช้ก่อน", size: "sm", color: "#999999", flex: 2 },
              { type: "text", text: expStr, size: "sm", color: "#111111", flex: 4 },
            ]},
            ...(boundUserId ? [{ type: "box", layout: "baseline", contents: [
              { type: "text", text: "ผูกบัญชี", size: "sm", color: "#999999", flex: 2 },
              { type: "text", text: String(boundUserId).substring(0, 12) + "…", size: "xs", color: "#999999", flex: 4 },
            ]}] : []),
          ]},
          { type: "text", text: "ส่งรหัสนี้ให้ลูกค้าพิมพ์ในแชทเพื่อต่ออายุทันที", size: "xs", color: "#999999", align: "center", wrap: true, margin: "md" },
        ],
      },
    },
  };
}

module.exports = {
  issueRenewalCode,
  redeemRenewalCode,
  isRenewalCode,
  buildRenewalSuccessFlex,
  buildCodeIssuedFlex,
};
