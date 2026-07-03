"use strict";

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

// Import shared instances from plastics_ai_engine
const {
  responseCache,
  adaptiveLearner,
  getGeminiApiKey,
  logGeminiApiKeyStatus,
  getConversationMemory,
} = require("./plastics_ai_engine");

// =====================================================
// 🧠 ADDITIONAL MEMORY MANAGEMENT FUNCTIONS
// =====================================================

/**
 * 🧠 MEMORY MANAGEMENT FUNCTION
 */
exports.manageMemory = onCall({
  region: "us-central1",
  timeoutSeconds: 30,
}, async (request) => {
  const { action, userId, memoryId } = request.data;

  if (!userId) {
    throw new HttpsError("invalid-argument", "ต้องระบุ userId");
  }

  try {
    switch (action) {
      case "get_user_summary":
        const summaryDoc = await getConversationMemory().db
          .collection("conversation_memory")
          .doc(userId)
          .get();

        if (!summaryDoc.exists) {
          return { status: "no_data", message: "ไม่มีข้อมูลความจำสำหรับผู้ใช้นี้" };
        }

        return {
          status: "success",
          summary: summaryDoc.data(),
        };

      case "clear_memories":
        const memoriesSnapshot = await getConversationMemory().db
          .collection("conversation_memory")
          .doc(userId)
          .collection("memories")
          .get();

        const batch = getConversationMemory().db.batch();
        memoriesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        return { status: "success", message: "ลบความจำทั้งหมดเรียบร้อย" };

      default:
        throw new HttpsError("invalid-argument", "การกระทำไม่ถูกต้อง");
    }
  } catch (error) {
    console.error("Memory management error:", error);
    throw new HttpsError("internal", "การจัดการความจำล้มเหลว");
  }
});

// =====================================================
// 📊 ENHANCED HEALTH CHECK WITH MEMORY STATUS
// =====================================================

/**
 * 🧠 ENHANCED HEALTH CHECK FUNCTION
 */
exports.healthCheck = onCall({
  region: "us-central1",
  timeoutSeconds: 30,
}, async (request) => {
  const executionId = Math.random().toString(36).substring(2, 10);
  logGeminiApiKeyStatus();


  try {
    const apiKey = getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const result = await model.generateContent("สวัสดี");
    const response = await result.response;

    const feedbackAnalysis = adaptiveLearner.getFeedbackAnalysis();

    // 🧠 Check memory system status
    const memoryStatus = await getConversationMemory().db
      .collection("conversation_memory")
      .limit(1)
      .get()
      .then((snapshot) => ({
        operational: !snapshot.empty || true, // Firestore is operational
        totalUsers: "unknown", // Would need aggregation query
      }))
      .catch((error) => ({
        operational: false,
        error: error.message,
      }));

    return {
      ok: true,
      status: "healthy",
      executionId,
      timestamp: new Date().toISOString(),
      components: {
        gemini_api: "operational",
        memory_system: memoryStatus.operational ? "operational" : "degraded",
        adaptive_learning: feedbackAnalysis ? `active_${feedbackAnalysis.totalFeedback}_feedbacks` : "no_data",
        cache: `active_entries_${responseCache.cache.size}`,
      },
      performance: {
        response_time: "normal",
        memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
        memory_cache_size: getConversationMemory().memoryCache.size,
      },
    };
  } catch (error) {
    console.error(`🔴 HEALTH CHECK FAILED [${executionId}]:`, error);

    return {
      ok: false,
      status: "degraded",
      executionId,
      timestamp: new Date().toISOString(),
      error: error.message,
      components: {
        gemini_api: "unavailable",
        memory_system: "unknown",
        cache: `active_entries_${responseCache.cache.size}`,
      },
    };
  }
});

// =====================================================
// 📝 FEEDBACK COLLECTION FUNCTION
// =====================================================

/**
 * 🆕 FEEDBACK COLLECTION FUNCTION
 */
exports.submitFeedback = onCall({
  region: "us-central1",
  timeoutSeconds: 30,
}, async (request) => {
  const { question, response, rating, comments } = request.data;

  if (!question || !response || rating === undefined) {
    throw new HttpsError("invalid-argument", "ต้องระบุคำถาม, คำตอบ, และคะแนน");
  }

  if (rating < 1 || rating > 5) {
    throw new HttpsError("invalid-argument", "คะแนนต้องอยู่ระหว่าง 1-5");
  }

  adaptiveLearner.addFeedback(question, response, rating);

  console.log(`📝 FEEDBACK RECEIVED: Rating ${rating}/5`, {
    questionLength: question.length,
    responseLength: response.length,
    hasComments: !!comments,
  });

  return {
    status: "success",
    message: "ขอบคุณสำหรับ feedback ครับ!",
    timestamp: new Date().toISOString(),
    feedbackId: Math.random().toString(36).substring(2, 9),
  };
});

// =====================================================
// ☁️ R2 PRESIGNED URL - Secure Server-Side SigV4 Signing
// =====================================================
/**
 * Generate a pre-signed PUT URL for direct browser → R2 upload.
 * Credentials never leave the server.
 *
 * POST body:
 *   { folder: string, filename: string, contentType: string, lineUserId?: string }
 * Headers (optional):
 *   Authorization: Bearer <Firebase ID token>
 *
 * Response: { uploadUrl: string, publicUrl: string, key: string }
 */
exports.r2PresignedUrl = onRequest({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "128MiB",
}, async (req, res) => {
  // ✅ Explicit CORS Headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Handle Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { folder, filename, contentType, lineUserId } = req.body || {};

  // ── 1. Validate required fields ──────────────────────────────
  if (!folder || !filename || !contentType) {
    return res.status(400).json({ error: "Missing folder, filename, or contentType" });
  }

  // ── 2. Whitelist allowed folders ─────────────────────────────
  const ALLOWED_FOLDERS = [
    "community_posts", "community_posts/thumbs",
    "posts", "posts/thumbs",
    "products", "products/thumbs",
    "avatars", "stories"
  ];
  if (!ALLOWED_FOLDERS.some(f => folder === f || folder.startsWith(f + "/"))) {
    return res.status(400).json({ error: "Invalid upload folder" });
  }

  // ── 3. Whitelist allowed MIME types ─────────────────────────
  const ALLOWED_TYPES = [
    "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo",
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"
  ];
  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: "Unsupported file type: " + contentType });
  }

  // ── 4. Auth: Firebase ID token OR known LINE user ────────────
  let authed = false;
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      await getAuth().verifyIdToken(authHeader.slice(7));
      authed = true;
    } catch (_) { /* fall through to lineUserId check */ }
  }
  if (!authed && lineUserId) {
    try {
      const db = getFirestore();
      const snap = await db.collection("line_users").doc(lineUserId).get();
      if (snap.exists) authed = true;
    } catch (_) { /* ignore */ }
  }
  if (!authed) {
    return res.status(401).json({ error: "Unauthorized: valid Firebase token or lineUserId required" });
  }

  // ── 5. Build pre-signed URL (SigV4) ─────────────────────────
  const R2_ACCESS_KEY_ID = "c25a407afc0cdf23b985b2410cd75614";
  const R2_SECRET_ACCESS_KEY = "d167b0cd09c7ca519ea534f91380226479c6d741be1a7ad29924c62a2cb41cd6";
  const R2_ACCOUNT_ID = "3936ddcbff711649ab56a10375e82b67";
  const R2_BUCKET = "tuktuk-videos";
  const R2_PUBLIC_BASE = "https://pub-7e55074f08794361aaf305c1967f6ffa.r2.dev";
  const REGION = "auto";
  const EXPIRES_SECONDS = "900"; // 15 minutes

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const amzDate = `${dateStr}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const safeFilename = filename.replace(/[^a-zA-Z0-9._\-]/g, "_");
  const key = `${folder}/${Date.now()}_${safeFilename}`;
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const credentialScope = `${dateStr}/${REGION}/s3/aws4_request`;
  const credential = `${R2_ACCESS_KEY_ID}/${credentialScope}`;

  // Query params must be sorted alphabetically by key
  const queryParams = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", EXPIRES_SECONDS],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const canonicalQueryString = queryParams
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const canonicalRequest = [
    "PUT",
    `/${R2_BUCKET}/${encodedKey}`,
    canonicalQueryString,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const kDate = crypto.createHmac("sha256", `AWS4${R2_SECRET_ACCESS_KEY}`).update(dateStr).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(REGION).digest();
  const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const uploadUrl =
    `https://${host}/${R2_BUCKET}/${encodedKey}` +
    `?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  const publicUrl = `${R2_PUBLIC_BASE}/${key}`;

  return res.json({ uploadUrl, publicUrl, key });
});

module.exports = {
  manageMemory: exports.manageMemory,
  healthCheck: exports.healthCheck,
  submitFeedback: exports.submitFeedback,
  r2PresignedUrl: exports.r2PresignedUrl,
};
