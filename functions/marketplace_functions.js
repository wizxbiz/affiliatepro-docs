"use strict";

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

// =====================================================
// 🔐 MARKETPLACE LINE AUTH (L.7607 version)
// =====================================================

/**
 * 🔐 LINE Auth for Marketplace
 * POST /api/marketplace/line-auth
 * Body: { lineUserId: "LINE_USER_ID" }
 * Returns: User info (no Firebase token needed - backend handles auth)
 */
exports.marketplaceLineAuth = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    const { lineUserId } = req.body;

    if (!lineUserId) {
      res.status(400).json({ success: false, error: "lineUserId is required" });
      return;
    }

    console.log("🔐 Verifying LINE user for marketplace:", lineUserId);

    const admin = require("firebase-admin");
    const db = admin.firestore();

    // Check if LINE user exists in our system
    const lineUserDoc = await db.collection("line_users").doc(lineUserId).get();

    if (!lineUserDoc.exists) {
      console.log("⚠️ LINE user not found in line_users:", lineUserId);

      // Try to find in users collection as fallback
      const usersSnapshot = await db.collection("users")
        .where("lineUserId", "==", lineUserId)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        // Found in users collection
        const userData = usersSnapshot.docs[0].data();
        console.log("✅ Found user in users collection:", userData.displayName);

        // Create line_users document for future use
        await db.collection("line_users").doc(lineUserId).set({
          lineUserId: lineUserId,
          displayName: userData.displayName || "LINE User",
          pictureUrl: userData.pictureUrl || null,
          isPremium: userData.isPremium || false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Get usage count for AI post
        const usageRef = db.collection("ai_post_usage").doc(lineUserId);
        const usageDoc = await usageRef.get();
        const usageData = usageDoc.exists ? usageDoc.data() : { count: 0 };

        res.set("Access-Control-Allow-Origin", "*");
        res.status(200).json({
          success: true,
          user: {
            lineUserId: lineUserId,
            displayName: userData.displayName || "LINE User",
            pictureUrl: userData.pictureUrl || null,
            isPremium: userData.isPremium || false,
            aiPostUsage: usageData.count || 0,
            aiPostLimit: 3,
          },
        });
        return;
      }

      // Not found anywhere - require add friend
      res.set("Access-Control-Allow-Origin", "*");
      res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูลผู้ใช้ กรุณาเพิ่มเพื่อน LINE OA ก่อน",
        requireAddFriend: true,
      });
      return;
    }

    const userData = lineUserDoc.data();

    // Get usage count for AI post
    const usageRef = db.collection("ai_post_usage").doc(lineUserId);
    const usageDoc = await usageRef.get();
    const usageData = usageDoc.exists ? usageDoc.data() : { count: 0 };

    console.log("✅ LINE user verified:", lineUserId, userData.displayName);

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      success: true,
      user: {
        lineUserId: lineUserId,
        displayName: userData.displayName || "LINE User",
        pictureUrl: userData.pictureUrl || null,
        isPremium: userData.isPremium || false,
        aiPostUsage: usageData.count || 0,
        aiPostLimit: 3,
      },
    });
  } catch (error) {
    console.error("❌ LINE Auth error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =====================================================
// 📦 MARKETPLACE POST PRODUCT (L.7731 version)
// =====================================================

/**
 * 📦 Post Product to Marketplace (LINE Auth)
 * POST /api/marketplace/post-product
 * Body: { productData: {...}, lineUserId: "LINE_USER_ID", imageBase64: "..." }
 */
exports.marketplacePostProduct = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  cors: true,
}, async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const { productData, lineUserId, imageBase64, additionalImages } = req.body;

    // Validate lineUserId
    if (!lineUserId) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(400).json({ success: false, error: "lineUserId is required" });
      return;
    }

    // Verify LINE user exists in our database
    const lineUserDoc = await db.collection("line_users").doc(lineUserId).get();
    let userData = null;

    if (lineUserDoc.exists) {
      userData = lineUserDoc.data();
    } else {
      // Try users collection
      const usersSnapshot = await db.collection("users")
        .where("lineUserId", "==", lineUserId)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        userData = usersSnapshot.docs[0].data();
      }
    }

    if (!userData) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(401).json({
        success: false,
        error: "ไม่พบข้อมูลผู้ใช้ กรุณาเพิ่มเพื่อน LINE OA ก่อน",
        requireAddFriend: true,
      });
      return;
    }

    console.log("📦 Posting product for LINE user:", lineUserId, userData.displayName);

    if (!productData || !productData.productName) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(400).json({ success: false, error: "productData is required" });
      return;
    }

    let imageUrl = productData.imageUrl;

    // Upload image if base64 provided
    if (imageBase64 && !imageUrl) {
      try {
        // Use explicit bucket name
        const bucket = admin.storage().bucket("appinjproject-storage");
        const fileName = `marketplace/${Date.now()}_${lineUserId}.jpg`;
        const file = bucket.file(fileName);

        const imageBuffer = Buffer.from(imageBase64, "base64");

        await file.save(imageBuffer, {
          metadata: {
            contentType: "image/jpeg",
          },
        });

        await file.makePublic();
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log("📸 Image uploaded:", imageUrl);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        res.status(500).json({ success: false, error: "Failed to upload image" });
        return;
      }
    }

    // Upload additional images if provided
    const additionalImageUrls = [];
    if (additionalImages && Array.isArray(additionalImages) && additionalImages.length > 0) {
      try {
        const bucket = admin.storage().bucket("appinjproject-storage");

        for (let i = 0; i < additionalImages.length; i++) {
          const additionalBase64 = additionalImages[i];
          if (!additionalBase64) continue;

          const fileName = `marketplace/${Date.now()}_${lineUserId}_${i + 1}.jpg`;
          const file = bucket.file(fileName);
          const imageBuffer = Buffer.from(additionalBase64, "base64");

          await file.save(imageBuffer, {
            metadata: {
              contentType: "image/jpeg",
            },
          });

          await file.makePublic();
          const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          additionalImageUrls.push(url);
          console.log(`📸 Additional image ${i + 1} uploaded:`, url);
        }
      } catch (uploadError) {
        console.error("Additional images upload error:", uploadError);
        // Continue without additional images
      }
    }

    // Prepare product document
    const newProduct = {
      productName: productData.productName,
      price: parseInt(productData.price) || 0,
      description: productData.description || "",
      category: productData.category || "other",
      imageUrl: imageUrl || "",
      additionalImages: additionalImageUrls, // Added for consistency with community_products
      images: additionalImageUrls.length > 0 ? [imageUrl, ...additionalImageUrls] : (imageUrl ? [imageUrl] : []),
      tags: productData.tags || [productData.category || "other"],
      sellerName: productData.sellerName || userData.displayName || "LINE User",
      sellerPhone: productData.sellerPhone || "",
      sellerLineId: productData.sellerLineId || "",
      sellerLocation: productData.sellerLocation || "",
      sellerId: lineUserId, // LINE userId
      lineUserId: lineUserId, // Add explicit lineUserId field for queries
      status: "active",
      viewCount: 0,
      contactCount: 0,
      source: "web",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("marketplace_items").add(newProduct);

    console.log("✅ Product posted:", docRef.id);

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      success: true,
      productId: docRef.id,
      message: "สินค้าลงขายสำเร็จ!",
    });
  } catch (error) {
    console.error("❌ Post product error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =====================================================
// 🤖 AI PRODUCT POST GENERATOR
// =====================================================

/**
 * 🤖 AI Product Post Generator API
 * POST /api/marketplace/ai-generate-post
 * Body: { imageBase64: "base64-encoded-image", additionalInfo: "optional info", lineUserId: "optional" }
 */
exports.marketplaceAIGeneratePost = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  cors: true,
  secrets: ["GEMINI_API_KEY"],
}, async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    const { imageBase64, additionalInfo = "", lineUserId = null } = req.body;

    if (!imageBase64) {
      res.status(400).json({ success: false, error: "imageBase64 is required" });
      return;
    }

    console.log("🤖 AI Product Post Generator - Processing image...");
    if (lineUserId) {
      console.log("📱 LINE User ID:", lineUserId);
    }

    // ตรวจสอบและบันทึกการใช้งานถ้ามี lineUserId
    let usageData = { count: 0 };
    let isPremium = false;
    let usageRef = null;
    const SUPER_ADMIN_ID = "Ud9bec6d2ea945cf4330a69cb74ac93cf";

    if (lineUserId) {
      const { getFirestore } = require("firebase-admin/firestore");
      const db = getFirestore();
      const FREE_LIMIT = 3;

      // Super Admin ได้รับ Premium โดยอัตโนมัติ
      if (lineUserId === SUPER_ADMIN_ID) {
        isPremium = true;
        console.log(`👑 Super Admin detected - auto Premium`);
      } else {
        usageRef = db.collection("ai_post_usage").doc(lineUserId);
        const usageDoc = await usageRef.get();
        usageData = usageDoc.exists ? usageDoc.data() : { count: 0 };

        // ตรวจสอบว่าเป็น Premium หรือไม่ (จาก line_users collection)
        const userRef = db.collection("line_users").doc(lineUserId);
        const userDoc = await userRef.get();
        isPremium = userDoc.exists && userDoc.data().isPremium === true;
      }

      // ถ้าไม่ใช่ Premium และใช้ครบ 3 ครั้งแล้ว
      console.log(`📊 Checking quota: count=${usageData.count}, isPremium=${isPremium}, FREE_LIMIT=${FREE_LIMIT}`);

      if (!isPremium && usageData.count >= FREE_LIMIT) {
        console.log(`🔒 Quota exhausted for ${lineUserId}: ${usageData.count}/${FREE_LIMIT}`);
        res.set("Access-Control-Allow-Origin", "*");
        res.status(403).json({
          success: false,
          error: `หมดสิทธิ์ใช้ฟรีแล้ว (${FREE_LIMIT}/${FREE_LIMIT} ครั้ง) กรุณาสมัคร Premium`,
          quotaExhausted: true,
          usageCount: usageData.count,
          freeLimit: FREE_LIMIT,
        });
        return;
      }

      console.log(`📊 Usage check: ${usageData.count}/${FREE_LIMIT} for ${lineUserId} (will increment after success)`);
    }

    // Initialize Gemini
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Add customHeaders to bypass API key HTTP Referrer restriction
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.0-flash" },
      { customHeaders: { "Referer": "https://tuktukfeed.com/" } }
    );

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    };

    const prompt = `
คุณเป็นผู้เชี่ยวชาญการเขียนโพสต์ขายของออนไลน์ที่ดึงดูดลูกค้า

📸 วิเคราะห์รูปสินค้านี้และสร้างข้อความโพสต์ขายที่น่าสนใจ

${additionalInfo ? `ข้อมูลเพิ่มเติม: ${additionalInfo}` : ""}

ให้สร้างผลลัพธ์ในรูปแบบ JSON ดังนี้:
{
  "productName": "ชื่อสินค้าที่เดาได้จากรูป",
  "suggestedPrice": "ช่วงราคาที่แนะนำ (เช่น 199-299 บาท)",
  "category": "หมวดหมู่สินค้า",
  "title": "หัวข้อโพสต์สั้นๆ ดึงดูด มี emoji",
  "description": "รายละเอียดสินค้า 2-3 บรรทัด บอกจุดเด่น คุณสมบัติ มี emoji ให้น่าสนใจ",
  "callToAction": "ข้อความเรียกร้องให้ซื้อ เช่น 'สนใจทักแชทเลยค่ะ 💬'",
  "hashtags": ["แฮชแท็กที่เกี่ยวข้อง", "ไม่เกิน5อัน"],
  "emojis": "อีโมจิที่เหมาะกับสินค้า 3-5 ตัว"
}

⚠️ ตอบเฉพาะ JSON เท่านั้น ไม่ต้องอธิบายเพิ่ม
`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("🤖 AI Generated Post:", parsed.productName);

      // บันทึกการใช้งานหลัง AI สำเร็จ (increment)
      if (lineUserId && usageRef) {
        await usageRef.set({
          count: (usageData.count || 0) + 1,
          lastUsed: new Date(),
          isPremium: isPremium,
        }, { merge: true });
        console.log(`📊 Usage recorded: ${usageData.count + 1}/3 for ${lineUserId}`);
      }

      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json({
        success: true,
        data: parsed,
      });
      return;
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("❌ AI Vision error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =====================================================
// 🔐 LINE LOGIN OAUTH CALLBACK
// =====================================================

/**
 * 🔐 LINE Login OAuth Callback
 * POST /lineLoginCallback
 * Body: { code: "OAUTH_CODE", redirectUri: "REDIRECT_URI" }
 * Returns: User info after exchanging code for tokens
 */
exports.lineLoginCallback = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, async (req, res) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      res.status(400).json({
        success: false,
        error: "code and redirectUri are required",
      });
      return;
    }

    console.log("🔐 Processing LINE Login callback...");

    // LINE Login credentials — Channel: Tuktukfeed Thailand LINE Login (2009159046)
    const LINE_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID || "2009159046";
    const LINE_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("🔐 Token response:", tokenData.access_token ? "OK" : "FAILED");

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      res.set("Access-Control-Allow-Origin", "*");
      res.status(400).json({
        success: false,
        error: tokenData.error_description || "Failed to get access token",
      });
      return;
    }

    // Get user profile with access token
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileResponse.json();
    console.log("🔐 Got LINE profile:", profile.displayName);

    if (!profile.userId) {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(400).json({
        success: false,
        error: "Failed to get user profile",
      });
      return;
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();
    const lineUserId = profile.userId;

    // Save/update user in line_users collection
    const lineUserRef = db.collection("line_users").doc(lineUserId);
    const lineUserDoc = await lineUserRef.get();

    let userData;
    if (lineUserDoc.exists) {
      // Update existing user
      userData = lineUserDoc.data();
      await lineUserRef.update({
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || null,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        loginMethod: "line_login_oauth",
      });
      userData.displayName = profile.displayName;
      userData.pictureUrl = profile.pictureUrl;
    } else {
      // Create new user
      userData = {
        lineUserId: lineUserId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || null,
        isPremium: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        loginMethod: "line_login_oauth",
      };
      await lineUserRef.set(userData);
    }

    // Get usage count for AI post
    const usageRef = db.collection("ai_post_usage").doc(lineUserId);
    const usageDoc = await usageRef.get();
    const usageData = usageDoc.exists ? usageDoc.data() : { count: 0 };

    console.log("✅ LINE Login successful:", profile.displayName);

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({
      success: true,
      user: {
        lineUserId: lineUserId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || null,
        isPremium: userData.isPremium || false,
        aiPostUsage: usageData.count || 0,
        aiPostLimit: 3,
      },
    });
  } catch (error) {
    console.error("❌ LINE Login callback error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =====================================================
// 🎁 CHECK FREE USAGE (Anti-Bypass with Device Fingerprint)
// =====================================================

/**
 * 🎁 Check Free Usage (Anti-Bypass with Device Fingerprint)
 * POST /checkFreeUsage
 * Body: { fingerprint: "DEVICE_FINGERPRINT", date: "YYYY-MM-DD", action: "check" | "increment" }
 * Returns: { count, remaining, limit, date }
 */
exports.checkFreeUsage = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, async (req, res) => {
  try {
    // Handle CORS preflight
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    const { fingerprint, date, action } = req.body;

    if (!fingerprint || fingerprint.length < 16) {
      res.status(400).json({
        success: false,
        error: "Invalid fingerprint",
      });
      return;
    }

    const admin = require("firebase-admin");
    const db = admin.firestore();

    const FREE_LIMIT = 7;
    const today = date || new Date().toISOString().split('T')[0];

    // Use fingerprint as document ID (truncate to valid Firestore ID)
    const docId = `fp_${fingerprint.substring(0, 24)}`;
    const usageRef = db.collection("edu_free_usage").doc(docId);
    const usageDoc = await usageRef.get();

    let usageData = {
      count: 0,
      date: today,
      fingerprint: fingerprint,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (usageDoc.exists) {
      usageData = usageDoc.data();

      // Reset count if different day
      if (usageData.date !== today) {
        usageData = {
          count: 0,
          date: today,
          fingerprint: fingerprint,
          createdAt: usageData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await usageRef.set(usageData);
      }
    } else {
      await usageRef.set(usageData);
    }

    // Action: increment
    if (action === "increment" && usageData.count < FREE_LIMIT) {
      usageData.count = (usageData.count || 0) + 1;
      usageData.lastUsedAt = admin.firestore.FieldValue.serverTimestamp();
      await usageRef.update({
        count: usageData.count,
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`🎁 Free usage incremented: fp=${docId}, count=${usageData.count}/${FREE_LIMIT}`);
    }

    res.status(200).json({
      success: true,
      count: usageData.count || 0,
      remaining: Math.max(0, FREE_LIMIT - (usageData.count || 0)),
      limit: FREE_LIMIT,
      date: today,
    });

  } catch (error) {
    console.error("❌ Check free usage error:", error);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(500).json({
      success: false,
      error: error.message,
      count: 0,
      remaining: 7,
      limit: 7,
    });
  }
});

// =====================================================
// 🎓 EDUCATION AI - Web Homework Assistant
// =====================================================

exports.educationAI = onRequest({
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "512MiB",
  cors: true,
  secrets: ["GEMINI_API_KEY"],
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  console.log('🎓 Education AI Request received');

  try {
    const { question, subject, level, mode, history } = req.body;

    if (!question) {
      res.status(400).json({ success: false, error: 'Missing question' });
      return;
    }

    // Map subject to Thai
    const subjectMap = {
      'math': 'คณิตศาสตร์',
      'science': 'วิทยาศาสตร์',
      'physics': 'ฟิสิกส์',
      'chemistry': 'เคมี',
      'biology': 'ชีววิทยา',
      'thai': 'ภาษาไทย',
      'english': 'ภาษาอังกฤษ',
      'social': 'สังคมศึกษา',
      'history': 'ประวัติศาสตร์',
      'coding': 'การเขียนโปรแกรม',
      'general': 'ทั่วไป'
    };

    // Map level to Thai
    const levelMap = {
      'p1-3': 'ประถมศึกษาตอนต้น (ป.1-3)',
      'p4-6': 'ประถมศึกษาตอนปลาย (ป.4-6)',
      'm1-3': 'มัธยมศึกษาตอนต้น (ม.1-3)',
      'm4-6': 'มัธยมศึกษาตอนปลาย (ม.4-6)',
      'university': 'มหาวิทยาลัย'
    };

    // Map mode to instruction
    const modeInstructions = {
      'explain': 'อธิบายแนวคิดอย่างละเอียด ใช้ภาษาที่เข้าใจง่าย',
      'stepbystep': 'แสดงวิธีทำทีละขั้นตอนอย่างชัดเจน พร้อมอธิบายทุกขั้นตอน',
      'example': 'ให้ตัวอย่างที่หลากหลายและเกี่ยวข้องกับชีวิตจริง',
      'quiz': 'สร้างคำถามทดสอบความเข้าใจ พร้อมเฉลย',
      'summary': 'สรุปใจความสำคัญอย่างกระชับ'
    };

    const subjectThai = subjectMap[subject] || 'ทั่วไป';
    const levelThai = levelMap[level] || 'มัธยมศึกษา';
    const modeInstruction = modeInstructions[mode] || 'อธิบายอย่างละเอียด';

    // Build conversation history
    let conversationContext = '';
    if (history && history.length > 0) {
      conversationContext = '\n\nบทสนทนาก่อนหน้า:\n' +
        history.map(h => `${h.role === 'user' ? 'นักเรียน' : 'ครู AI'}: ${h.content}`).join('\n');
    }

    // Create system prompt
    const systemPrompt = `คุณคือ "WiT 365 AI Tutor" ครูสอนพิเศษอัจฉริยะ ผู้เชี่ยวชาญการสอนทุกวิชา

🎯 **บทบาทของคุณ:**
- เป็นครูที่ใจดี อดทน และเข้าใจนักเรียน
- สอนด้วยความกระตือรือร้นและให้กำลังใจ
- อธิบายเรื่องยากให้เข้าใจง่าย
- ใช้ตัวอย่างที่เกี่ยวข้องกับชีวิตประจำวัน

📚 **ข้อมูลผู้เรียน:**
- วิชา: ${subjectThai}
- ระดับ: ${levelThai}
- รูปแบบที่ต้องการ: ${modeInstruction}

📝 **กฎการตอบ:**
1. ตอบเป็นภาษาไทยเป็นหลัก (ยกเว้นศัพท์เฉพาะ)
2. ใช้ภาษาที่เหมาะสมกับระดับของผู้เรียน
3. ${modeInstruction}
4. ใช้ emoji เพื่อทำให้เนื้อหาน่าสนใจ
5. สำหรับคณิตศาสตร์และวิทยาศาสตร์ แสดงสูตรและขั้นตอนชัดเจน
6. ให้กำลังใจและชมเชยเมื่อนักเรียนเข้าใจ
7. หากนักเรียนทำผิด ให้ชี้แนะอย่างนุ่มนวลและอธิบายเพิ่มเติม

✨ **เป้าหมาย:** ทำให้การเรียนรู้สนุกและน่าจดจำ!
${conversationContext}`;

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const prompt = `${systemPrompt}\n\n📝 คำถามจากนักเรียน: ${question}`;

    console.log(`🎓 Processing: ${subject}/${level}/${mode} - "${question.substring(0, 50)}..."`);

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('✅ AI Response generated successfully');

    res.json({
      success: true,
      response: response,
      metadata: {
        subject: subjectThai,
        level: levelThai,
        mode: mode,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Education AI Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      message: error.message
    });
  }
});

// =====================================================
// 🤖 AI CONTENT ASSIST
// =====================================================

exports.aiContentAssist = onRequest({
  region: "us-central1",
  cors: true,
  secrets: ["GEMINI_API_KEY"],
}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { mode, title, content, category } = req.body;

    if (!content && !title) {
      res.status(400).json({ success: false, error: "กรุณาใส่หัวข้อหรือเนื้อหา" });
      return;
    }

    // Build prompt based on mode
    const categoryName = {
      news: "📰 ข่าวสาร",
      update: "🔄 อัปเดต",
      tip: "💡 เคล็ดลับ",
      event: "📅 กิจกรรม",
      promo: "🏷️ โปรโมชั่น"
    }[category] || "ทั่วไป";

    const inputText = title ? `หัวข้อ: ${title}\n\n${content}` : content;

    const prompts = {
      summarize: `คุณเป็นนักเขียนมืออาชีพ ช่วยสรุปเนื้อหาต่อไปนี้ให้กระชับ ชัดเจน และน่าสนใจ รักษาใจความสำคัญไว้

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่สรุปแล้ว (สั้นกระชับ)", "content": "เนื้อหาที่สรุปแล้ว (ไม่เกิน 200 คำ)"}`,

      expand: `คุณเป็นนักเขียนมืออาชีพ ช่วยขยายความเนื้อหาต่อไปนี้ให้ละเอียดขึ้น มีตัวอย่าง มีข้อมูลเพิ่มเติม และอ่านน่าสนใจ

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่ปรับปรุงแล้ว", "content": "เนื้อหาที่ขยายความแล้ว (อย่างน้อย 300 คำ) มีรายละเอียด ตัวอย่าง และข้อมูลเพิ่มเติม"}`,

      engaging: `คุณเป็นนักการตลาดดิจิทัลมืออาชีพ ช่วยเขียนเนื้อหาให้น่าสนใจ ดึงดูดผู้อ่าน มี Call to Action ที่ชัดเจน

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่ดึงดูดความสนใจ (มี Emoji)", "content": "เนื้อหาที่น่าสนใจ ใช้ภาษาที่กระตุ้นอารมณ์ มี emoji และ Call to Action"}`,

      professional: `คุณเป็นนักเขียนธุรกิจมืออาชีพ ช่วยเขียนเนื้อหาในโทนที่เป็นทางการ น่าเชื่อถือ เหมาะกับองค์กร

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่เป็นมืออาชีพ", "content": "เนื้อหาที่เขียนอย่างเป็นทางการ ชัดเจน น่าเชื่อถือ"}`,

      friendly: `คุณเป็นคนเขียน Social Media ที่มีความเป็นกันเอง ช่วยเขียนเนื้อหาให้เป็นมิตร อ่านง่าย รู้สึกเหมือนคุยกับเพื่อน

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่เป็นกันเอง (มี Emoji)", "content": "เนื้อหาที่เป็นกันเอง อ่านง่าย มี emoji เหมาะสม"}`,

      check: `คุณเป็นบรรณาธิการมืออาชีพ ช่วยเรียบเรียงเนื้อหาต่อไปนี้ใหม่ให้อ่านง่าย ถูกหลักไวยากรณ์ และสละสลวย

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่ปรับแก้แล้ว", "content": "เนื้อหาที่เรียบเรียงใหม่ ถูกหลักภาษา อ่านง่าย"}`,

      seo: `คุณเป็นผู้เชี่ยวชาญ SEO และ Social Media Marketing ช่วยปรับปรุงเนื้อหาต่อไปนี้ให้มี:
1. Hashtag ที่เกี่ยวข้อง (5-10 hashtag)
2. Keywords ที่ช่วยให้ค้นหาเจอ
3. โครงสร้างที่เหมาะกับการแชร์บน Social Media

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่มี Keywords (ไม่มี Hashtag ในหัวข้อ)", "content": "เนื้อหาที่ปรับปรุงแล้ว\\n\\n#Hashtag1 #Hashtag2 #Hashtag3 ... (5-10 hashtags ท้ายโพสต์)"}`,

      emoji: `คุณเป็นผู้เชี่ยวชาญ Social Media ช่วยเพิ่ม Emoji ให้เนื้อหาต่อไปนี้ให้ดูสดใส น่าอ่าน และดึงดูดใจ โดยใช้ Emoji ที่เหมาะสมกับบริบท

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อพร้อม Emoji ที่เหมาะสม", "content": "เนื้อหาที่เพิ่ม emoji ให้สดใส น่าอ่าน (ใช้ emoji พอสมควร ไม่มากเกินไป)"}`,

      headline: `คุณเป็นบรรณาธิการข่าวมืออาชีพ ช่วยสร้างหัวข้อที่น่าสนใจ ดึงดูดคลิก สำหรับเนื้อหาต่อไปนี้
ให้เสนอ 3-5 หัวข้อทางเลือก

หมวดหมู่: ${categoryName}

เนื้อหาเดิม:
${inputText}

ตอบในรูปแบบ JSON:
{"title": "หัวข้อที่ดีที่สุด (เลือก 1 ข้อ)", "content": "หัวข้อทางเลือก:\\n\\n1. [หัวข้อ 1]\\n2. [หัวข้อ 2]\\n3. [หัวข้อ 3]\\n\\n---\\n\\n[เนื้อหาเดิมที่แก้ไขเล็กน้อย]"}`,

      moderate: `คุณเป็นผู้เชี่ยวชาญด้านการตรวจสอบเนื้อหา (Content Moderator) ของสังคมออนไลน์ไทย
ช่วยตรวจสอบเนื้อหาต่อไปนี้ว่ามีสิ่งต่อไปนี้หรือไม่:
1. คำหยาบคาย หรือภาษาที่ไม่เหมาะสม
2. การคุกคาม กลั่นแกล้ง หรือสร้างความเกลียดชัง (Hate Speech)
3. เนื้อหาที่ผิดกฎหมาย หรือส่งเสริมความรุนแรง
4. ข้อมูลเท็จที่มีอันตราย

เนื้อหาที่จะตรวจสอบ:
${inputText}

ตอบในรูปแบบ JSON เท่านั้น:
{
  "isSafe": true หรือ false,
  "reason": "สรุปเหตุผลสั้นๆ ถ้าไม่ปลอดภัย (ภาษาไทย)",
  "cleanedContent": "เนื้อหาที่เซ็นเซอร์คำหยาบแล้ว (ถ้ามี) หรือเนื้อหาเดิมที่ปรับปรุงให้สุภาพขึ้น"
}`
    };

    const selectedPrompt = prompts[mode] || prompts.engaging;

    // Use Gemini API - Updated to gemini-2.0-flash
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: selectedPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const responseText = result.response.text();

    // Try to parse JSON from response
    let parsed = { content: responseText };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("JSON parse warning:", e.message);
    }

    const responseData = {
      success: true,
      title: parsed.title || title,
      content: parsed.content || responseText
    };

    // Special fields for moderation mode
    if (mode === "moderate") {
      responseData.isSafe = parsed.isSafe !== undefined ? parsed.isSafe : true;
      responseData.reason = parsed.reason || "";
      if (parsed.cleanedContent) {
        responseData.content = parsed.cleanedContent;
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error("AI Content Assist error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = {
  marketplaceLineAuth: exports.marketplaceLineAuth,
  marketplacePostProduct: exports.marketplacePostProduct,
  marketplaceAIGeneratePost: exports.marketplaceAIGeneratePost,
  lineLoginCallback: exports.lineLoginCallback,
  checkFreeUsage: exports.checkFreeUsage,
  educationAI: exports.educationAI,
  aiContentAssist: exports.aiContentAssist,
};
