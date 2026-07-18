/**
 * 🛒 WiT MARKETPLACE SYSTEM v1.0
 * ระบบตลาดซื้อขายสินค้าแบบ C2C ผ่าน LINE OA
 *
 * Features:
 * - Selling Flow: ลงขายสินค้าพร้อมรูป
 * - Buying Flow: ค้นหาสินค้า + Carousel
 * - State Machine: จัดการ Flow การลงขาย
 * - AI Tags: สร้าง Tags อัตโนมัติ
 *
 * @author WiT Team
 * @version 1.0.0
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

// Lazy load Gemini to avoid deployment timeout
let GoogleGenerativeAI = null;
function getGoogleGenerativeAI() {
  if (!GoogleGenerativeAI) {
    GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
  }
  return GoogleGenerativeAI;
}

// =====================================================
// � RETRY HELPER WITH EXPONENTIAL BACKOFF
// =====================================================

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @return {Promise<any>} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // If rate limited (429), wait longer
      // Also retry on 5xx errors which might be temporary
      if (error.statusCode === 429 || (error.statusCode >= 500 && error.statusCode < 600)) {
        const delay = baseDelay * Math.pow(2, i) * (1 + Math.random() * 0.1);
        console.log(`⏳ API Error ${error.statusCode}, waiting ${Math.round(delay)}ms before retry ${i + 1}/${maxRetries}`);

        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
}

// =====================================================
// �📦 CONSTANTS & CONFIGURATION
// =====================================================

const BOT_LINE_ID = "@563eikqn"; // LINE Bot ID for VOOM sharing
const MARKETPLACE_COLLECTION = "marketplace_items";
const USER_STATE_COLLECTION = "user_marketplace_states";
const AI_POST_USAGE_COLLECTION = "ai_post_usage"; // สำหรับนับการใช้ฟรี
const WEB_BASE_URL = "https://tuktukfeed.com";
const FREE_AI_POST_LIMIT = 3; // จำกัดการใช้ฟรี 3 ครั้ง

// User States for State Machine
const USER_STATES = {
  IDLE: "IDLE",
  WAITING_FOR_PRODUCT_IMAGE: "WAITING_FOR_PRODUCT_IMAGE",
  WAITING_FOR_CONFIRMATION: "WAITING_FOR_CONFIRMATION",
  WAITING_FOR_AI_POST_IMAGE: "WAITING_FOR_AI_POST_IMAGE",
};

// Product Status
const PRODUCT_STATUS = {
  ACTIVE: "active",
  SOLD: "sold",
  DELETED: "deleted",
};

// =====================================================
// 🎁 FREE USAGE TRACKING
// =====================================================

/**
 * Get user's AI Post free usage count
 * @param {string} userId - LINE User ID
 * @return {Promise<Object>} { usageCount, isPremium, canUseForFree }
 */
async function getAIPostUsage(userId) {
  const db = getFirestore();
  const usageRef = db.collection(AI_POST_USAGE_COLLECTION).doc(userId);
  const usageDoc = await usageRef.get();

  // Check if user is premium (from line_users collection)
  const userRef = db.collection("line_users").doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const isPremium = userData.subscriptionStatus === "active" ||
    userData.role === "premium" ||
    userData.isPremium === true;

  if (!usageDoc.exists) {
    return { usageCount: 0, isPremium, canUseForFree: true, remaining: FREE_AI_POST_LIMIT };
  }

  const usageData = usageDoc.data();
  const usageCount = usageData.count || 0;
  const canUseForFree = isPremium || usageCount < FREE_AI_POST_LIMIT;
  const remaining = isPremium ? "ไม่จำกัด" : Math.max(0, FREE_AI_POST_LIMIT - usageCount);

  return { usageCount, isPremium, canUseForFree, remaining };
}

/**
 * Increment user's AI Post usage count
 * @param {string} userId - LINE User ID
 */
async function incrementAIPostUsage(userId) {
  const db = getFirestore();
  const usageRef = db.collection(AI_POST_USAGE_COLLECTION).doc(userId);

  await usageRef.set({
    count: FieldValue.increment(1),
    lastUsedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

// =====================================================
// 🗄️ DATABASE HELPERS
// =====================================================

/**
 * Get user's current marketplace state
 * @param {string} userId - LINE User ID
 * @return {Promise<Object>} User state data
 */
async function getUserMarketplaceState(userId) {
  const db = getFirestore();
  const stateRef = db.collection(USER_STATE_COLLECTION).doc(userId);
  const stateDoc = await stateRef.get();

  if (!stateDoc.exists) {
    return { state: USER_STATES.IDLE, pendingData: null };
  }

  return stateDoc.data();
}

/**
 * Set user's marketplace state
 * @param {string} userId - LINE User ID
 * @param {string} state - New state
 * @param {Object} pendingData - Data waiting for completion
 */
async function setUserMarketplaceState(userId, state, pendingData = null) {
  const db = getFirestore();
  const stateRef = db.collection(USER_STATE_COLLECTION).doc(userId);

  await stateRef.set({
    state,
    pendingData,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * Clear user's marketplace state
 * @param {string} userId - LINE User ID
 */
async function clearUserMarketplaceState(userId) {
  const db = getFirestore();
  const stateRef = db.collection(USER_STATE_COLLECTION).doc(userId);

  await stateRef.set({
    state: USER_STATES.IDLE,
    pendingData: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Save product to marketplace
 * @param {Object} productData - Product information
 * @return {Promise<string>} Product ID
 */
async function saveProductToMarketplace(productData) {
  const db = getFirestore();
  const itemRef = db.collection(MARKETPLACE_COLLECTION).doc();

  const product = {
    ...productData,
    id: itemRef.id,
    status: PRODUCT_STATUS.ACTIVE,
    productNameLower: (productData.productName || '').toLowerCase(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    viewCount: 0,
    contactCount: 0,
  };

  await itemRef.set(product);
  console.log(`✅ Product saved: ${itemRef.id}`);

  return itemRef.id;
}

/**
 * Search products by keyword
 * @param {string} keyword - Search keyword
 * @param {number} limit - Max results
 * @return {Promise<Array>} Matching products
 */
async function searchProducts(keyword, limit = 10) {
  const db = getFirestore();
  const keywordLower = keyword.toLowerCase().trim();

  // Search by productName (contains)
  const itemsRef = db.collection(MARKETPLACE_COLLECTION);
  const querySnapshot = await itemsRef
    .where("status", "==", PRODUCT_STATUS.ACTIVE)
    .orderBy("createdAt", "desc")
    .limit(50) // Get more to filter
    .get();

  const results = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const productNameLower = (data.productName || "").toLowerCase();
    const tags = (data.tags || []).map((t) => t.toLowerCase());

    // Match by name or tags
    if (productNameLower.includes(keywordLower) ||
      tags.some((tag) => tag.includes(keywordLower))) {
      results.push({ id: doc.id, ...data });
    }
  });

  return results.slice(0, limit);
}

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @return {Promise<Object|null>} Product data
 */
async function getProductById(productId) {
  const db = getFirestore();
  const docRef = db.collection(MARKETPLACE_COLLECTION).doc(productId);
  const doc = await docRef.get();

  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Get user's products
 * @param {string} sellerId - Seller's LINE User ID
 * @return {Promise<Array>} User's products
 */
async function getUserProducts(sellerId) {
  const db = getFirestore();
  const querySnapshot = await db.collection(MARKETPLACE_COLLECTION)
    .where("sellerId", "==", sellerId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const products = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });

  return products;
}

/**
 * Update product status
 * @param {string} productId - Product ID
 * @param {string} status - New status
 */
async function updateProductStatus(productId, status) {
  const db = getFirestore();
  await db.collection(MARKETPLACE_COLLECTION).doc(productId).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Increment product view/contact count
 * @param {string} productId - Product ID
 * @param {string} field - 'viewCount' or 'contactCount'
 */
async function incrementProductStat(productId, field) {
  const db = getFirestore();
  await db.collection(MARKETPLACE_COLLECTION).doc(productId).update({
    [field]: FieldValue.increment(1),
  });
}

// =====================================================
// 🤖 AI VISION - PRODUCT POST GENERATOR
// =====================================================

/**
 * AI Vision: Analyze product image and generate attractive post caption
 * @param {Buffer} imageBuffer - Product image buffer
 * @param {string} additionalInfo - Additional product info (optional)
 * @return {Promise<Object>} Generated post with title, description, hashtags
 */
async function generateAIProductPost(imageBuffer, additionalInfo = "") {
  try {
    const GoogleGenerativeAI = getGoogleGenerativeAI();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
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
      console.log("🤖 AI Generated Post:", parsed);
      return {
        success: true,
        data: parsed,
      };
    }

    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("❌ AI Vision error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create Flex Message showing AI-generated product post with web link
 * @param {Object} aiPost - AI generated post data
 * @param {string} imageUrl - Product image URL
 * @param {string} userId - User LINE ID for tracking
 * @param {Object} usageInfo - Free usage info { remaining, isPremium }
 * @return {Object} Flex Message
 */
function createAIPostResultFlex(aiPost, imageUrl, userId = "", usageInfo = {}) {
  const { productName, suggestedPrice, category, title, description, callToAction, hashtags, emojis } = aiPost;

  const hashtagText = hashtags ? hashtags.map((h) => `#${h}`).join(" ") : "";
  const fullPost = `${title}\n\n${description}\n\n${callToAction}\n\n${hashtagText}`;

  // Encode data for URL (เข้ารหัสเพื่อส่งไปเว็บ)
  const postData = Buffer.from(JSON.stringify({
    productName,
    suggestedPrice,
    category,
    title,
    description,
    callToAction,
    hashtags,
    emojis,
    fullPost,
    createdAt: new Date().toISOString(),
  })).toString("base64");

  const webUrl = `${WEB_BASE_URL}/post-product.html?aipost=${encodeURIComponent(postData)}`;

  // แสดงจำนวนครั้งที่เหลือ
  const usageText = usageInfo.isPremium
    ? "👑 Premium: ใช้ได้ไม่จำกัด"
    : `🎁 ใช้ฟรีคงเหลือ: ${usageInfo.remaining || 0}/${FREE_AI_POST_LIMIT} ครั้ง`;

  return {
    type: "flex",
    altText: `🤖 AI สร้างโพสต์: ${productName}`,
    contents: {
      type: "bubble",
      size: "mega",
      hero: imageUrl ? {
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "4:3",
        aspectMode: "cover",
      } : undefined,
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🤖 AI สร้างโพสต์ให้แล้ว!", weight: "bold", color: "#ffffff", size: "lg" },
          { type: "text", text: emojis || "✨🛒💫", color: "#ffffffcc", size: "sm", margin: "sm" },
        ],
        backgroundColor: "#667eea",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          // Usage Info Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: usageText, size: "xs", color: usageInfo.isPremium ? "#FFD700" : "#4CAF50", align: "center", flex: 1 },
            ],
            backgroundColor: usageInfo.isPremium ? "#1a1a2e" : "#E8F5E9",
            paddingAll: "8px",
            cornerRadius: "20px",
            margin: "none",
          },
          // Product Info
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📦 สินค้า:", weight: "bold", size: "sm", flex: 0, color: "#666666" },
              { type: "text", text: productName || "ไม่ระบุ", size: "sm", wrap: true, flex: 1, margin: "sm" },
            ],
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "💰 ราคาแนะนำ:", weight: "bold", size: "sm", flex: 0, color: "#666666" },
              { type: "text", text: suggestedPrice || "ไม่ระบุ", size: "sm", color: "#FF5722", flex: 1, margin: "sm" },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📁 หมวดหมู่:", weight: "bold", size: "sm", flex: 0, color: "#666666" },
              { type: "text", text: category || "ทั่วไป", size: "sm", flex: 1, margin: "sm" },
            ],
          },
          { type: "separator", margin: "lg" },
          // Generated Post Preview (ย่อ)
          { type: "text", text: "📝 ตัวอย่างโพสต์:", weight: "bold", size: "sm", margin: "lg", color: "#333333" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: title || "", weight: "bold", size: "sm", wrap: true, maxLines: 2 },
              { type: "text", text: description || "", size: "xs", wrap: true, margin: "sm", color: "#444444", maxLines: 3 },
            ],
            backgroundColor: "#f5f5f5",
            paddingAll: "10px",
            cornerRadius: "8px",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          // ปุ่มหลัก: ไปคัดลอกที่เว็บ
          {
            type: "button",
            style: "primary",
            color: "#667eea",
            action: {
              type: "uri",
              label: "📋 ไปคัดลอกโพสต์ที่เว็บ",
              uri: webUrl,
            },
            height: "sm",
          },
          // ปุ่มคัดลอกในไลน์
          {
            type: "button",
            style: "secondary",
            action: {
              type: "clipboard",
              label: "📋 คัดลอกทันที",
              clipboardText: fullPost,
            },
            height: "sm",
          },
          // ปุ่มสร้างใหม่
          {
            type: "button",
            style: "link",
            action: { type: "message", label: "🔄 สร้างใหม่", text: "/โพสต์" },
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * Handle AI Post command - set state waiting for image
 * @param {Object} context - LINE context
 * @param {string} userId - User ID
 * @param {string} replyToken - Reply token
 */
async function handleAIPostCommand(context, userId, replyToken) {
  const { lineClient } = context;

  try {
    // 1. ตรวจสอบการใช้ฟรีก่อน
    const usageInfo = await getAIPostUsage(userId);

    // สร้าง URL พร้อม userId สำหรับติดตามการใช้งาน
    const webUrl = `${WEB_BASE_URL}/post-product.html?lineUserId=${encodeURIComponent(userId)}`;

    // แสดงจำนวนครั้งที่เหลือ
    const usageText = usageInfo.isPremium
      ? "👑 Premium: ใช้ได้ไม่จำกัด"
      : usageInfo.canUseForFree
        ? `🎁 ใช้ฟรีคงเหลือ: ${usageInfo.remaining}/${FREE_AI_POST_LIMIT} ครั้ง`
        : `🔒 หมดสิทธิ์ใช้ฟรีแล้ว (${FREE_AI_POST_LIMIT}/${FREE_AI_POST_LIMIT})`;

    const usageBgColor = usageInfo.isPremium ? "#1a1a2e" : (usageInfo.canUseForFree ? "#E8F5E9" : "#FFEBEE");
    const usageTextColor = usageInfo.isPremium ? "#FFD700" : (usageInfo.canUseForFree ? "#4CAF50" : "#F44336");

    // 2. ส่ง Flex Message นำทางไปเว็บ (ไม่รอรับรูปจาก LINE แล้ว)
    const navigateFlex = {
      type: "flex",
      altText: "🤖 AI ช่วยสร้างโพสต์ - กดเปิดเว็บ",
      contents: {
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🤖", size: "xxl" },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    { type: "text", text: "AI สร้างโพสต์", weight: "bold", color: "#ffffff", size: "xl" },
                    { type: "text", text: "วิเคราะห์รูปสินค้าอัตโนมัติ", color: "#ffffffcc", size: "sm" },
                  ],
                  flex: 1,
                  margin: "lg",
                },
              ],
              alignItems: "center",
            },
          ],
          backgroundColor: "#667eea",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "lg",
          contents: [
            // Usage Badge
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: usageText, size: "sm", color: usageTextColor, align: "center", flex: 1, weight: "bold" },
              ],
              backgroundColor: usageBgColor,
              paddingAll: "12px",
              cornerRadius: "25px",
            },
            // Features List
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                { type: "text", text: "✨ ฟีเจอร์ AI วิเคราะห์รูป", size: "md", weight: "bold", color: "#333333" },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "📸", size: "sm" },
                    { type: "text", text: "อัพโหลดรูปสินค้าจากเครื่อง", size: "sm", color: "#666666", flex: 1, margin: "sm" },
                  ],
                  margin: "md",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "🎯", size: "sm" },
                    { type: "text", text: "AI วิเคราะห์และสร้างโพสต์ทันที", size: "sm", color: "#666666", flex: 1, margin: "sm" },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "📋", size: "sm" },
                    { type: "text", text: "คัดลอกข้อความได้เลย", size: "sm", color: "#666666", flex: 1, margin: "sm" },
                  ],
                },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "✏️", size: "sm" },
                    { type: "text", text: "แก้ไขได้ก่อนใช้งาน", size: "sm", color: "#666666", flex: 1, margin: "sm" },
                  ],
                },
              ],
              margin: "md",
            },
            // Tip Box
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "💡 เคล็ดลับ: ถ่ายรูปให้ชัดเจน", size: "xs", color: "#FF9800", align: "center" },
                { type: "text", text: "แสงสว่างดี เห็นรายละเอียดสินค้า", size: "xs", color: "#FF9800", align: "center" },
              ],
              backgroundColor: "#FFF3E0",
              paddingAll: "12px",
              cornerRadius: "10px",
              margin: "lg",
            },
          ],
          paddingAll: "20px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#667eea",
              action: {
                type: "uri",
                label: "🚀 เปิดหน้าสร้างโพสต์",
                uri: webUrl,
              },
              height: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "เปิดใน LINE Browser", size: "xs", color: "#999999", align: "center", flex: 1 },
              ],
              margin: "sm",
            },
          ],
          paddingAll: "15px",
        },
      },
    };

    // Use retry with backoff for sending message
    await retryWithBackoff(async () => {
      await lineClient.replyMessage(replyToken, navigateFlex);
    }, 3, 1000);
  } catch (error) {
    console.error("❌ Error in handleAIPostCommand:", error);
    // If rate limited, inform user to wait
    if (error.statusCode === 429) {
      console.log("⚠️ Rate limit hit - too many requests");
      // Cannot reply as reply token might be expired, and we're rate limited
      return;
    }
    throw error;
  }
}

/**
 * Handle /ดูโพสต์ command - View AI generated posts
 */
async function handleViewAIPostsCommand(context, userId, replyToken) {
  const { lineClient } = context;

  try {
    const db = getFirestore();

    // Get latest 3 AI posts for this user
    const postsSnapshot = await db.collection("ai_posts")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get();

    if (postsSnapshot.empty) {
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "❌ ยังไม่มีโพสต์ที่สร้างไว้\n\n💡 ลองใช้คำสั่ง /โพสต์ เพื่อสร้างโพสต์ใหม่",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🤖 สร้างโพสต์", text: "/โพสต์" } },
          ],
        },
      });
      return;
    }

    // Create Flex Message for each post
    const bubbles = [];
    for (const doc of postsSnapshot.docs) {
      const post = doc.data();

      // Check if it's an error post
      if (post.error) {
        bubbles.push({
          type: "bubble",
          size: "kilo",
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "❌ เกิดข้อผิดพลาด", weight: "bold", color: "#FF0000", size: "md" },
              { type: "text", text: post.errorMessage || "ไม่สามารถวิเคราะห์รูปได้", size: "sm", wrap: true, margin: "md" },
              { type: "text", text: formatTimestamp(post.createdAt), size: "xxs", color: "#999999", margin: "md" },
            ],
            paddingAll: "15px",
          },
        });
        continue;
      }

      // Normal post
      bubbles.push({
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "🤖 AI สร้างโพสต์", weight: "bold", color: "#ffffff", size: "md", align: "center" },
            { type: "text", text: `📦 ${post.productName}`, color: "#ffffffcc", size: "sm", align: "center", margin: "sm" },
          ],
          backgroundColor: "#667eea",
          paddingAll: "12px",
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            { type: "text", text: `🎯 ${post.title}`, weight: "bold", size: "md", wrap: true, color: "#333333" },
            { type: "separator", margin: "md" },
            { type: "text", text: post.description, size: "sm", wrap: true, color: "#555555", margin: "md" },
            { type: "separator", margin: "md" },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "💰 ราคาแนะนำ:", size: "sm", color: "#888888", flex: 1 },
                { type: "text", text: post.suggestedPrice || "ไม่ระบุ", size: "sm", weight: "bold", color: "#FF6B6B", align: "end", flex: 1 },
              ],
              margin: "md",
            },
            { type: "separator", margin: "md" },
            { type: "text", text: Array.isArray(post.hashtags) ? post.hashtags.map(h => `#${h}`).join(" ") : "#สินค้า", size: "xs", wrap: true, color: "#667eea", margin: "md" },
            { type: "text", text: formatTimestamp(post.createdAt), size: "xxs", color: "#999999", margin: "md" },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              action: {
                type: "clipboard",
                label: "📋 คัดลอกโพสต์",
                clipboardText: post.postText,
              },
              style: "primary",
              color: "#667eea",
            },
          ],
          paddingAll: "12px",
        },
      });
    }

    // Send carousel of posts
    await lineClient.replyMessage(replyToken, {
      type: "flex",
      altText: `📋 โพสต์ที่สร้างไว้ ${postsSnapshot.size} รายการ`,
      contents: {
        type: "carousel",
        contents: bubbles,
      },
      quickReply: {
        items: [
          { type: "action", action: { type: "message", label: "🤖 สร้างโพสต์ใหม่", text: "/โพสต์" } },
        ],
      },
    });

    // Mark posts as viewed
    const batch = db.batch();
    postsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { viewed: true });
    });
    await batch.commit();

  } catch (error) {
    console.error("❌ Error in handleViewAIPostsCommand:", error);
    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: "❌ เกิดข้อผิดพลาดในการดึงโพสต์\nกรุณาลองใหม่อีกครั้ง",
    });
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days < 7) return `${days} วันที่แล้ว`;

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/**
 * Handle image upload for AI Post generation
 * @param {Object} context - LINE context
 * @param {Object} event - LINE event
 * @param {string} userId - User ID
 */
async function handleAIPostImage(context, event, userId) {
  const { lineClient } = context;

  try {
    console.log(`🤖 Processing AI Post for ${userId}`);

    // 1. ตรวจสอบการใช้ฟรี
    const usageInfo = await getAIPostUsage(userId);

    if (!usageInfo.canUseForFree) {
      // หมดสิทธิ์ใช้ฟรี - แนะนำให้สมัคร Premium
      await lineClient.replyMessage(event.replyToken, {
        type: "flex",
        altText: "🔒 หมดสิทธิ์ใช้ฟรี",
        contents: {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🔒 หมดสิทธิ์ใช้ฟรี", weight: "bold", color: "#ffffff", size: "lg", align: "center" },
            ],
            backgroundColor: "#FF5722",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
              { type: "text", text: `คุณใช้ฟรีครบ ${FREE_AI_POST_LIMIT} ครั้งแล้ว`, size: "sm", wrap: true, align: "center" },
              { type: "text", text: "🌟 สมัคร Premium เพื่อใช้ได้ไม่จำกัด!", size: "sm", wrap: true, align: "center", margin: "md", color: "#667eea", weight: "bold" },
              { type: "separator", margin: "lg" },
              { type: "text", text: "✨ Premium สิทธิพิเศษ:", size: "xs", color: "#666666", margin: "md" },
              { type: "text", text: "• AI สร้างโพสต์ไม่จำกัด", size: "xs", color: "#666666" },
              { type: "text", text: "• ฟีเจอร์ขั้นสูงทั้งหมด", size: "xs", color: "#666666" },
              { type: "text", text: "• สนับสนุนพิเศษ", size: "xs", color: "#666666" },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#667eea",
                action: { type: "message", label: "💎 สมัคร Premium", text: "/premium" },
                height: "sm",
              },
              {
                type: "button",
                style: "link",
                action: { type: "message", label: "📞 ติดต่อแอดมิน", text: "/ติดต่อ" },
                height: "sm",
              },
            ],
            paddingAll: "15px",
          },
        },
      });

      await clearUserMarketplaceState(userId);
      return true;
    }

    // 2. Get image from LINE
    const stream = await lineClient.getMessageContent(event.message.id);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);

    // 3. Generate AI post
    const aiResult = await generateAIProductPost(imageBuffer);

    // 4. Clear user state
    await clearUserMarketplaceState(userId);

    if (aiResult.success) {
      // 5. Increment usage count (เพิ่มจำนวนครั้งที่ใช้)
      if (!usageInfo.isPremium) {
        await incrementAIPostUsage(userId);
      }

      // Get updated usage info for display
      const updatedUsage = await getAIPostUsage(userId);

      // 6. Create and send Flex Message with result + web link
      const flexMessage = createAIPostResultFlex(aiResult.data, null, userId, updatedUsage);
      await lineClient.replyMessage(event.replyToken, flexMessage);
      console.log(`✅ AI Post sent successfully for ${userId} (remaining: ${updatedUsage.remaining})`);
    } else {
      // AI failed to analyze
      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ ไม่สามารถวิเคราะห์รูปได้\n\n💡 ลองถ่ายรูปใหม่:\n• แสงสว่างชัดเจน\n• เห็นสินค้าครบ\n• ไม่เบลอ",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🔄 ลองใหม่", text: "/โพสต์" } },
          ],
        },
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Error in handleAIPostImage:", error);

    // Clear user state on error
    await clearUserMarketplaceState(userId);

    // Handle different error types
    let errorMessage = "❌ ระบบ LINE เกิดข้อผิดพลาด\n\nกรุณาลองใหม่อีกครั้ง หรือติดต่อแอดมิน";

    if (error.statusCode === 429) {
      errorMessage = "⚠️ ระบบ LINE มีการใช้งานหนาแน่น\n\nกรุณารอสักครู่แล้วลองใหม่";
    } else if (error.message?.includes("timeout") || error.code === "ETIMEDOUT") {
      errorMessage = "⏱️ การประมวลผลใช้เวลานานเกินไป\n\nกรุณาลองใหม่อีกครั้ง";
    }

    try {
      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: errorMessage,
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "🔄 ลองใหม่", text: "/โพสต์" } },
          ],
        },
      });
    } catch (replyError) {
      console.error("Failed to send error message:", replyError);
    }

    return true;
  }
}

/**
 * Process AI Post Task (Background Worker)
 * @param {Object} taskData - Task data from Firestore
 * @param {Object} context - Context with lineClient
 */
async function processAIPostTask(taskData, context) {
  const { lineClient } = context;
  const { userId, messageId } = taskData;

  try {
    console.log(`⚙️ Processing AI Post Task for ${userId}`);

    // Get image from LINE
    // Note: Message content is available for a limited time
    const stream = await lineClient.getMessageContent(messageId);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const imageBuffer = Buffer.concat(chunks);

    // Generate AI post (without uploading image)
    const aiResult = await generateAIProductPost(imageBuffer);

    if (aiResult.success) {
      // Save result to Firestore instead of sending pushMessage
      const data = aiResult.data;

      // Convert arrays to strings
      const hashtagsStr = Array.isArray(data.hashtags) ? data.hashtags.map((h) => `#${h}`).join(" ") : (data.hashtags || "");
      const emojisStr = Array.isArray(data.emojis) ? data.emojis.join(" ") : (data.emojis || "");

      const postText = `🎯 ${data.title}\n\n${data.description}\n\n💰 ราคาแนะนำ: ${data.suggestedPrice}\n\n${hashtagsStr}\n\n${emojisStr}`;

      // Save to Firestore
      const db = getFirestore();
      await db.collection("ai_posts").add({
        userId: userId,
        productName: data.productName,
        title: data.title,
        description: data.description,
        suggestedPrice: data.suggestedPrice,
        category: data.category || "ไม่ระบุ",
        hashtags: data.hashtags,
        emojis: data.emojis,
        postText: postText,
        createdAt: FieldValue.serverTimestamp(),
        viewed: false
      });

      console.log(`✅ AI Post saved to Firestore for user ${userId}`);
    } else {
      // Save error status to Firestore
      const db = getFirestore();
      await db.collection("ai_posts").add({
        userId: userId,
        error: true,
        errorMessage: "ไม่สามารถวิเคราะห์รูปได้",
        createdAt: FieldValue.serverTimestamp(),
        viewed: false
      });

      console.log(`❌ AI Post generation failed for user ${userId}`);
    }
  } catch (error) {
    console.error("❌ Error in processAIPostTask:", error);
    // Save error to Firestore
    try {
      const db = getFirestore();
      await db.collection("ai_posts").add({
        userId: userId,
        error: true,
        errorMessage: error.message || "เกิดข้อผิดพลาดในการประมวลผล",
        createdAt: FieldValue.serverTimestamp(),
        viewed: false
      });
    } catch (e) {
      console.error("Failed to save error to Firestore:", e);
    }
  }
}

// =====================================================
// 🧠 AI TAG GENERATION
// =====================================================

/**
 * Generate AI tags for product
 * @param {string} productName - Product name
 * @param {Buffer} imageBuffer - Product image (optional)
 * @return {Promise<Array>} Generated tags
 */
async function generateProductTags(productName, imageBuffer = null) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let prompt = `
    สร้าง Tags สำหรับสินค้าชื่อ "${productName}" ในตลาดออนไลน์
    
    ให้ตอบเป็น Tags ภาษาไทยและอังกฤษ คั่นด้วยเครื่องหมาย , (comma)
    Tags ควรเกี่ยวกับ: หมวดหมู่, ประเภทสินค้า, คำค้นหาที่เกี่ยวข้อง
    
    ตัวอย่างผลลัพธ์: ผลไม้, ทุเรียน, fruit, durian, food, fresh
    
    ตอบเฉพาะ Tags ไม่ต้องอธิบาย:
    `;

    let result;

    if (imageBuffer) {
      // Include image analysis
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      prompt = `
      วิเคราะห์รูปภาพนี้และสร้าง Tags สำหรับสินค้าชื่อ "${productName}"
      
      ให้ตอบเป็น Tags ภาษาไทยและอังกฤษ คั่นด้วยเครื่องหมาย , (comma)
      Tags ควรเกี่ยวกับ: สิ่งที่เห็นในรูป, หมวดหมู่, ประเภทสินค้า, สี, ขนาด
      
      ตอบเฉพาะ Tags ไม่ต้องอธิบาย:
      `;

      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    // Parse tags from response
    const tags = text
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0 && tag.length < 30);

    console.log(`🏷️ Generated tags: ${tags.join(", ")}`);
    return tags.slice(0, 10); // Max 10 tags
  } catch (error) {
    console.error("❌ Tag generation error:", error);
    // Fallback: Basic tags from product name
    return [productName.toLowerCase(), "สินค้า", "ขาย"];
  }
}

// =====================================================
// 📤 IMAGE UPLOAD TO FIREBASE STORAGE
// =====================================================

/**
 * Upload image to Firebase Storage
 * @param {Buffer} imageBuffer - Image data
 * @param {string} userId - User ID for folder organization
 * @param {string} productId - Product ID for filename
 * @return {Promise<string>} Public URL of uploaded image
 */
async function uploadProductImage(imageBuffer, userId, productId) {
  try {
    // Use explicit bucket name - appinjproject.appspot.com
    const bucket = getStorage().bucket("appinjproject.appspot.com");
    const filename = `marketplace/${userId}/${productId}_${Date.now()}.jpg`;
    const file = bucket.file(filename);

    await file.save(imageBuffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          uploadedBy: userId,
          productId: productId,
        },
      },
    });

    // Make file public and get URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log(`📤 Image uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Image upload error:", error);
    throw error;
  }
}

// =====================================================
// 🛒 SELLING FLOW LOGIC
// =====================================================

/**
 * Parse sell command from user text
 * @param {string} text - User message text
 * @return {Object|null} Parsed product info or null
 */
function parseSellCommand(text) {
  // Pattern: "ขาย [product] [price]" or "ขาย [product] ราคา [price]"
  const patterns = [
    /^ขาย\s+(.+?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท)?$/i,
    /^ขาย\s+(.+?)\s+ราคา\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท)?$/i,
    /^ลงขาย\s+(.+?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท)?$/i,
    /^ขายของ\s+(.+?)\s+(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท)?$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const productName = match[1].trim();
      const priceStr = match[2].replace(/,/g, "");
      const price = parseFloat(priceStr);

      if (productName && !isNaN(price) && price > 0) {
        return { productName, price };
      }
    }
  }

  return null;
}

/**
 * Check if text is a sell command trigger
 * @param {string} text - User message
 * @return {boolean}
 */
function isSellCommand(text) {
  const lowerText = text.toLowerCase().trim();

  // ❌ ไม่จับเป็น Marketplace ถ้าเป็นรูปแบบ Accounting
  // Pattern: มีหน่วยวัด (กก., กิโล, ลิตร, ถุง, ลัง, etc.) + ตัวเลข + บาท
  const accountingPattern = /\d+\s*(กก\.|กก|กิโล|kg|ลิตร|ถุง|ลัง|กระสอบ|ตัน|กล่อง|ชิ้น|อัน|ลูก|หวี|ไร่|งาน|แพ็ค|โหล)/i;
  const hasPriceWithBaht = /\d+\s*บาท/i.test(text);

  if (accountingPattern.test(text) && hasPriceWithBaht) {
    // This looks like an accounting entry, not marketplace listing
    console.log("🔄 Detected accounting pattern, skipping marketplace");
    return false;
  }

  return lowerText.startsWith("ขาย") ||
    lowerText.startsWith("ลงขาย") ||
    lowerText.startsWith("ขายของ");
}

/**
 * Handle sell command - Step 1
 * @param {Object} context - LINE context (lineClient, db)
 * @param {Object} event - LINE event
 * @param {Object} userData - User data
 * @return {Promise<boolean>} true if handled
 */
async function handleSellCommand(context, event, userData) {
  const { lineClient } = context;
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const text = event.message.text;

  // Parse sell command
  const parsed = parseSellCommand(text);

  if (!parsed) {
    // Invalid format
    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: "❌ รูปแบบไม่ถูกต้อง\n\n" +
        "📝 **วิธีลงขาย:**\n" +
        "พิมพ์: ขาย [ชื่อสินค้า] [ราคา]\n\n" +
        "📌 **ตัวอย่าง:**\n" +
        "• ขาย ทุเรียนหมอนทอง 500\n" +
        "• ขาย iPhone 15 Pro 35000\n" +
        "• ลงขาย รองเท้า Nike 2500",
      quickReply: {
        items: [
          { type: "action", action: { type: "message", label: "🛒 ดูตลาด", text: "ดูตลาด" } },
          { type: "action", action: { type: "message", label: "📦 สินค้าของฉัน", text: "สินค้าของฉัน" } },
        ],
      },
    });
    return true;
  }

  // Valid format - Set state and wait for image
  await setUserMarketplaceState(userId, USER_STATES.WAITING_FOR_PRODUCT_IMAGE, {
    productName: parsed.productName,
    price: parsed.price,
    sellerName: userData.displayName || "ผู้ขาย",
    startedAt: new Date().toISOString(),
  });

  console.log(`🛒 Sell command parsed: ${parsed.productName} - ${parsed.price} บาท`);

  // Reply asking for image
  await lineClient.replyMessage(replyToken, createWaitingForImageFlex(parsed.productName, parsed.price));

  return true;
}

/**
 * Handle product image upload - Step 2
 * @param {Object} context - LINE context
 * @param {Object} event - LINE event
 * @param {Buffer} imageBuffer - Image data
 * @return {Promise<boolean>} true if handled
 */
async function handleProductImageUpload(context, event, imageBuffer) {
  const { lineClient } = context;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // Check user state
  const userState = await getUserMarketplaceState(userId);

  if (userState.state !== USER_STATES.WAITING_FOR_PRODUCT_IMAGE) {
    return false; // Not in selling flow
  }

  const pendingData = userState.pendingData;

  if (!pendingData) {
    await clearUserMarketplaceState(userId);
    return false;
  }

  try {
    console.log(`📸 Processing product image for: ${pendingData.productName}`);

    // 1. Generate temporary product ID
    const tempProductId = `temp_${Date.now()}`;

    // 2. Upload image to Storage
    const imageUrl = await uploadProductImage(imageBuffer, userId, tempProductId);

    // 3. Generate AI tags
    const tags = await generateProductTags(pendingData.productName, imageBuffer);

    // 4. Save product to Firestore
    const productId = await saveProductToMarketplace({
      sellerId: userId,
      sellerName: pendingData.sellerName,
      productName: pendingData.productName,
      price: pendingData.price,
      imageUrl: imageUrl,
      tags: tags,
    });

    // 5. Clear user state
    await clearUserMarketplaceState(userId);

    // 6. Send confirmation with share button
    await lineClient.replyMessage(replyToken, createProductConfirmationFlex({
      id: productId,
      productName: pendingData.productName,
      price: pendingData.price,
      imageUrl: imageUrl,
      tags: tags,
    }));

    console.log(`✅ Product listed successfully: ${productId}`);
    return true;
  } catch (error) {
    console.error("❌ Error processing product image:", error);

    await clearUserMarketplaceState(userId);

    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: "❌ เกิดข้อผิดพลาดในการลงขายสินค้า\nกรุณาลองใหม่อีกครั้ง",
    });

    return true;
  }
}

// =====================================================
// 🔍 BUYING FLOW LOGIC
// =====================================================

/**
 * Check if text is a search/buy command
 * @param {string} text - User message
 * @return {boolean}
 */
function isSearchCommand(text) {
  const lowerText = text.toLowerCase().trim();
  return lowerText.startsWith("หา ") ||
    lowerText.startsWith("ค้นหา ") ||
    lowerText.startsWith("ซื้อ ") ||
    lowerText.startsWith("ต้องการ ") ||
    lowerText === "ดูตลาด" ||
    lowerText === "ตลาด" ||
    lowerText === "marketplace";
}

/**
 * Parse search keyword from text
 * @param {string} text - User message
 * @return {string} Search keyword
 */
function parseSearchKeyword(text) {
  const lowerText = text.toLowerCase().trim();

  // Remove prefix
  const prefixes = ["หา ", "ค้นหา ", "ซื้อ ", "ต้องการ "];
  for (const prefix of prefixes) {
    if (lowerText.startsWith(prefix)) {
      return text.substring(prefix.length).trim();
    }
  }

  return ""; // Browse all
}

/**
 * Handle search/buy command
 * @param {Object} context - LINE context
 * @param {Object} event - LINE event
 * @return {Promise<boolean>} true if handled
 */
async function handleSearchCommand(context, event) {
  const { lineClient } = context;
  const replyToken = event.replyToken;
  const text = event.message.text;

  const keyword = parseSearchKeyword(text);

  console.log(`🔍 Marketplace search: "${keyword || "all"}"`);

  // Search products
  let products;

  if (keyword) {
    products = await searchProducts(keyword, 10);
  } else {
    // Get recent products
    const db = getFirestore();
    const snapshot = await db.collection(MARKETPLACE_COLLECTION)
      .where("status", "==", PRODUCT_STATUS.ACTIVE)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    products = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
  }

  if (products.length === 0) {
    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: keyword ?
        `🔍 ไม่พบสินค้าที่ตรงกับ "${keyword}"\n\nลองค้นหาคำอื่น หรือพิมพ์ "ดูตลาด" เพื่อดูสินค้าทั้งหมด` :
        "📦 ยังไม่มีสินค้าในตลาด\n\nเป็นคนแรกที่ลงขาย!\nพิมพ์: ขาย [ชื่อสินค้า] [ราคา]",
      quickReply: {
        items: [
          { type: "action", action: { type: "message", label: "🛒 ลงขายสินค้า", text: "ขาย " } },
          { type: "action", action: { type: "message", label: "📦 สินค้าของฉัน", text: "สินค้าของฉัน" } },
        ],
      },
    });
    return true;
  }

  // Create carousel
  const carousel = createProductCarouselFlex(products, keyword);

  await lineClient.replyMessage(replyToken, carousel);

  return true;
}

/**
 * Handle "My Products" command
 * @param {Object} context - LINE context
 * @param {Object} event - LINE event
 * @return {Promise<boolean>} true if handled
 */
async function handleMyProductsCommand(context, event) {
  const { lineClient } = context;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  const products = await getUserProducts(userId);

  if (products.length === 0) {
    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: "📦 คุณยังไม่มีสินค้าที่ลงขาย\n\n" +
        "🛒 **เริ่มลงขายสินค้า:**\n" +
        "พิมพ์: ขาย [ชื่อสินค้า] [ราคา]\n\n" +
        "📌 ตัวอย่าง: ขาย ทุเรียน 500",
      quickReply: {
        items: [
          { type: "action", action: { type: "message", label: "🛒 ลงขายสินค้า", text: "ขาย " } },
          { type: "action", action: { type: "message", label: "🔍 ดูตลาด", text: "ดูตลาด" } },
        ],
      },
    });
    return true;
  }

  // Create my products carousel
  const carousel = createMyProductsCarouselFlex(products);

  await lineClient.replyMessage(replyToken, carousel);

  return true;
}

/**
 * Check if text is "My Products" command
 * @param {string} text - User message
 * @return {boolean}
 */
function isMyProductsCommand(text) {
  const lowerText = text.toLowerCase().trim();
  return lowerText === "สินค้าของฉัน" ||
    lowerText === "สินค้าที่ลงขาย" ||
    lowerText === "ของที่ขาย" ||
    lowerText === "my products" ||
    lowerText === "/myproducts";
}

// =====================================================
// 🎨 FLEX MESSAGE GENERATORS
// =====================================================

/**
 * Create "Waiting for Image" Flex Message
 */
function createWaitingForImageFlex(productName, price) {
  return {
    type: "flex",
    altText: `📸 อัปโหลดรูป ${productName}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📸 อัปโหลดรูปสินค้า", weight: "bold", color: "#ffffff", size: "lg" },
          { type: "text", text: "ขั้นตอนที่ 2 จาก 2", color: "#ffffffcc", size: "xs" },
        ],
        backgroundColor: "#2196F3",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📦", size: "xl" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: productName, weight: "bold", size: "md", wrap: true },
                  { type: "text", text: `฿${price.toLocaleString()}`, color: "#FF5722", size: "lg", weight: "bold" },
                ],
                margin: "md",
              },
            ],
          },
          { type: "separator", margin: "lg" },
          {
            type: "text",
            text: "👆 กรุณาส่งรูปสินค้าเพื่อลงขาย",
            size: "sm",
            color: "#666666",
            align: "center",
            margin: "lg",
            wrap: true,
          },
          {
            type: "text",
            text: "💡 รูปที่ชัดจะช่วยให้ขายได้เร็วขึ้น!",
            size: "xs",
            color: "#999999",
            align: "center",
            wrap: true,
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "❌ ยกเลิก", text: "ยกเลิกการลงขาย" },
            height: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * Create Product Confirmation Flex Message
 */
function createProductConfirmationFlex(product) {
  const shareUrl = `https://line.me/R/nv/recommendOA/${BOT_LINE_ID.replace("@", "")}`;
  const webUrl = `${WEB_BASE_URL}/product/${product.id}`;

  return {
    type: "flex",
    altText: `✅ ลงขาย ${product.productName} สำเร็จ!`,
    contents: {
      type: "bubble",
      size: "mega",
      hero: {
        type: "image",
        url: product.imageUrl,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "✅", size: "xl" },
              { type: "text", text: "ลงขายสำเร็จ!", weight: "bold", size: "xl", color: "#4CAF50", margin: "sm" },
            ],
          },
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "lg",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📦 สินค้า:", color: "#666666", size: "sm", flex: 3 },
                  { type: "text", text: product.productName, weight: "bold", size: "sm", flex: 7, wrap: true },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💰 ราคา:", color: "#666666", size: "sm", flex: 3 },
                  { type: "text", text: `฿${product.price.toLocaleString()}`, weight: "bold", size: "lg", color: "#FF5722", flex: 7 },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🏷️ Tags:", color: "#666666", size: "sm", flex: 3 },
                  { type: "text", text: product.tags.slice(0, 5).join(", "), size: "xs", color: "#999999", flex: 7, wrap: true },
                ],
              },
            ],
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#00C300",
            action: { type: "uri", label: "📣 แชร์ไป LINE VOOM", uri: shareUrl },
            height: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "uri", label: "🌐 ดูบนเว็บ", uri: webUrl },
            height: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "📦 สินค้าของฉัน", text: "สินค้าของฉัน" },
            height: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * Create single Product Card Bubble
 */
function createProductBubble(product) {
  const webUrl = `${WEB_BASE_URL}/product/${product.id}`;
  // Use postback to trigger notification to seller
  const chatAction = {
    type: "postback",
    label: "💬 ทักแชทคนขาย",
    data: `action=contact_seller&productId=${product.id}&sellerId=${product.sellerId}`,
    displayText: `สนใจสินค้า: ${product.productName}`,
  };

  return {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: product.imageUrl || "https://via.placeholder.com/400x260?text=No+Image",
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
      action: { type: "uri", uri: webUrl },
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: product.productName,
          weight: "bold",
          size: "md",
          wrap: true,
          maxLines: 2,
        },
        {
          type: "text",
          text: `฿${product.price.toLocaleString()}`,
          weight: "bold",
          size: "xl",
          color: "#FF5722",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "👤", size: "xs" },
            { type: "text", text: product.sellerName || "ผู้ขาย", size: "xs", color: "#999999", margin: "sm" },
          ],
          margin: "md",
        },
      ],
      paddingAll: "12px",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#00C300",
          action: chatAction,
          height: "sm",
          flex: 1,
        },
        {
          type: "button",
          style: "secondary",
          action: { type: "uri", label: "🔗 ดูเพิ่ม", uri: webUrl },
          height: "sm",
          flex: 1,
        },
      ],
      paddingAll: "10px",
    },
  };
}

/**
 * Create Product Carousel Flex Message
 */
function createProductCarouselFlex(products, keyword = "") {
  const bubbles = products.map((product) => createProductBubble(product));

  return {
    type: "flex",
    altText: keyword ? `🔍 พบ ${products.length} สินค้าสำหรับ "${keyword}"` : `🛒 สินค้าในตลาด (${products.length} รายการ)`,
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

/**
 * Create My Products Carousel with management options
 */
function createMyProductsCarouselFlex(products) {
  const bubbles = products.map((product) => {
    const webUrl = `${WEB_BASE_URL}/product/${product.id}`;
    const statusEmoji = product.status === PRODUCT_STATUS.ACTIVE ? "🟢" : "🔴";
    const statusText = product.status === PRODUCT_STATUS.ACTIVE ? "กำลังขาย" : "ขายแล้ว";

    return {
      type: "bubble",
      size: "kilo",
      hero: {
        type: "image",
        url: product.imageUrl || "https://via.placeholder.com/400x260?text=No+Image",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: product.productName, weight: "bold", size: "md", flex: 4, wrap: true },
              { type: "text", text: `${statusEmoji} ${statusText}`, size: "xs", color: "#666666", align: "end", flex: 2 },
            ],
          },
          {
            type: "text",
            text: `฿${product.price.toLocaleString()}`,
            weight: "bold",
            size: "xl",
            color: "#FF5722",
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "lg",
            contents: [
              { type: "text", text: `👁️ ${product.viewCount || 0}`, size: "xs", color: "#999999" },
              { type: "text", text: `💬 ${product.contactCount || 0}`, size: "xs", color: "#999999" },
            ],
            margin: "md",
          },
        ],
        paddingAll: "12px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: product.status === PRODUCT_STATUS.ACTIVE ? "primary" : "secondary",
            color: product.status === PRODUCT_STATUS.ACTIVE ? "#FF5722" : "#999999",
            action: {
              type: "postback",
              label: product.status === PRODUCT_STATUS.ACTIVE ? "✅ ขายแล้ว" : "🔄 ขายต่อ",
              data: `action=toggle_status&productId=${product.id}&currentStatus=${product.status}`,
            },
            height: "sm",
            flex: 1,
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "🗑️ ลบ",
              data: `action=delete_product&productId=${product.id}`,
            },
            height: "sm",
            flex: 1,
          },
        ],
        paddingAll: "10px",
      },
    };
  });

  return {
    type: "flex",
    altText: `📦 สินค้าของคุณ (${products.length} รายการ)`,
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

/**
 * Create Marketplace Menu Flex
 */
function createMarketplaceMenuFlex() {
  return {
    type: "flex",
    altText: "🛒 WiT Marketplace - ตลาดซื้อขาย",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🛒", size: "xxl" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "WiT Marketplace", weight: "bold", color: "#ffffff", size: "xl" },
                  { type: "text", text: "ตลาดซื้อขายออนไลน์", color: "#ffffffcc", size: "sm" },
                ],
                margin: "lg",
              },
            ],
            alignItems: "center",
          },
        ],
        backgroundColor: "#FF5722",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "👇 เลือกสิ่งที่ต้องการทำ",
            size: "sm",
            color: "#666666",
            align: "center",
          },
          {
            type: "button",
            style: "primary",
            color: "#4CAF50",
            action: { type: "message", label: "🛒 ลงขายสินค้า", text: "ขาย " },
            height: "sm",
          },
          {
            type: "button",
            style: "primary",
            color: "#2196F3",
            action: { type: "message", label: "🔍 ค้นหาสินค้า", text: "หา " },
            height: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "📦 สินค้าของฉัน", text: "สินค้าของฉัน" },
            height: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "🏪 ดูตลาดทั้งหมด", text: "ดูตลาด" },
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "💡 พิมพ์ \"ขาย [สินค้า] [ราคา]\" เพื่อลงขาย",
            size: "xs",
            color: "#999999",
            align: "center",
            wrap: true,
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * Create Sell Options Flex Message - Shows web form and LINE options
 */
function createSellOptionsFlexMessage() {
  return {
    type: "flex",
    altText: "🛒 เลือกวิธีลงขายสินค้า",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🛒 ลงขายสินค้า", weight: "bold", color: "#ffffff", size: "xl", align: "center" },
          { type: "text", text: "เลือกวิธีที่สะดวก", color: "#ffffffcc", size: "sm", align: "center", margin: "sm" },
        ],
        backgroundColor: "#4CAF50",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        contents: [
          // Option 1: Web Form
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "🌐 ลงขายผ่านเว็บ", weight: "bold", size: "md" },
              { type: "text", text: "✓ อัปโหลดรูปได้หลายรูป", size: "xs", color: "#666666" },
              { type: "text", text: "✓ กรอกรายละเอียดครบถ้วน", size: "xs", color: "#666666" },
              { type: "text", text: "✓ ใส่เบอร์โทร, LINE ID ได้", size: "xs", color: "#666666" },
              {
                type: "button",
                style: "primary",
                color: "#FF5722",
                action: { type: "uri", label: "📝 กรอกฟอร์มลงขาย", uri: "https://tuktukfeed.com/post-product.html" },
                height: "sm",
                margin: "md",
              },
            ],
            paddingAll: "15px",
            backgroundColor: "#FFF3E0",
            cornerRadius: "10px",
          },
          // Separator
          { type: "separator", color: "#E0E0E0" },
          // Option 2: LINE Chat
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              { type: "text", text: "💬 ลงขายผ่าน LINE", weight: "bold", size: "md" },
              { type: "text", text: "✓ ง่าย รวดเร็ว ไม่ต้องออกจากแอป", size: "xs", color: "#666666" },
              { type: "text", text: "✓ พิมพ์: ขาย [สินค้า] [ราคา]", size: "xs", color: "#666666" },
              { type: "text", text: "✓ แล้วส่งรูปสินค้า", size: "xs", color: "#666666" },
              {
                type: "button",
                style: "secondary",
                action: { type: "message", label: "💬 พิมพ์ขายในแชท", text: "ขาย " },
                height: "sm",
                margin: "md",
              },
            ],
            paddingAll: "15px",
            backgroundColor: "#E3F2FD",
            cornerRadius: "10px",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📌 ตัวอย่าง: ขาย iPhone 15 35000", size: "xs", color: "#999999", align: "center" },
        ],
        paddingAll: "10px",
      },
    },
  };
}

// =====================================================
// 🎯 POSTBACK HANDLERS
// =====================================================

/**
 * Handle marketplace postback actions
 * @param {Object} context - LINE context
 * @param {Object} event - LINE postback event
 * @return {Promise<boolean>} true if handled
 */
async function handleMarketplacePostback(context, event) {
  const { lineClient } = context;
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const data = event.postback.data;

  // Parse postback data
  const params = new URLSearchParams(data);
  const action = params.get("action");

  if (!action || !action.includes("_")) {
    return false; // Not a marketplace action
  }

  console.log(`🎯 Marketplace postback: ${action}`);

  switch (action) {
    case "contact_seller": {
      const productId = params.get("productId");
      const sellerId = params.get("sellerId");

      // Increment contact count
      await incrementProductStat(productId, "contactCount");

      // Get product info
      const product = await getProductById(productId);

      if (!product) {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "❌ ไม่พบสินค้านี้แล้ว อาจถูกลบหรือขายแล้ว",
        });
        return true;
      }

      // Notify seller
      try {
        await lineClient.pushMessage(sellerId, {
          type: "text",
          text: `🔔 **มีคนสนใจสินค้าของคุณ!**\n\n` +
            `📦 สินค้า: ${product.productName}\n` +
            `💰 ราคา: ฿${product.price.toLocaleString()}\n\n` +
            `กรุณาตอบกลับลูกค้าโดยเร็วครับ 🙏`,
        });
      } catch (err) {
        console.error("Failed to notify seller:", err);
      }

      // Reply to buyer
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: `✅ ส่งข้อความถึงผู้ขายแล้ว!\n\n` +
          `📦 สินค้า: ${product.productName}\n` +
          `💰 ราคา: ฿${product.price.toLocaleString()}\n\n` +
          `ผู้ขายจะติดต่อกลับมาเร็วๆ นี้ครับ`,
      });

      return true;
    }

    case "toggle_status": {
      const productId = params.get("productId");
      const currentStatus = params.get("currentStatus");

      const newStatus = currentStatus === PRODUCT_STATUS.ACTIVE ?
        PRODUCT_STATUS.SOLD :
        PRODUCT_STATUS.ACTIVE;

      await updateProductStatus(productId, newStatus);

      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: newStatus === PRODUCT_STATUS.SOLD ?
          "✅ เปลี่ยนสถานะเป็น \"ขายแล้ว\" เรียบร้อย!" :
          "🔄 เปลี่ยนสถานะเป็น \"กำลังขาย\" เรียบร้อย!",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "📦 สินค้าของฉัน", text: "สินค้าของฉัน" } },
          ],
        },
      });

      return true;
    }

    case "delete_product": {
      const productId = params.get("productId");

      await updateProductStatus(productId, PRODUCT_STATUS.DELETED);

      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "🗑️ ลบสินค้าเรียบร้อยแล้ว!",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "📦 สินค้าของฉัน", text: "สินค้าของฉัน" } },
            { type: "action", action: { type: "message", label: "🛒 ลงขายใหม่", text: "ขาย " } },
          ],
        },
      });

      return true;
    }

    default:
      return false;
  }
}

// =====================================================
// 🚀 MAIN HANDLER
// =====================================================

/**
 * Check if message is marketplace-related
 * @param {string} text - Message text
 * @return {boolean}
 */
function isMarketplaceCommand(text) {
  const lowerText = text.toLowerCase().trim();

  // New simple commands
  if (lowerText === "/ขายสินค้า" || lowerText === "/ขาย") return true;
  if (lowerText.startsWith("/หาสินค้า") || lowerText.startsWith("/หา") || lowerText.startsWith("/ค้นหา") || lowerText.startsWith("/search")) return true;
  if (lowerText === "/ตลาด" || lowerText === "/market") return true;
  if (lowerText === "/สินค้าของฉัน" || lowerText === "/myproducts") return true;
  // AI Vision Post Generator (เปลี่ยนจาก /aiโพสต์ เป็น /โพสต์)
  if (lowerText === "/โพสต์" || lowerText === "/post" || lowerText === "โพสต์") return true;

  return isSellCommand(text) ||
    isSearchCommand(text) ||
    isMyProductsCommand(text) ||
    lowerText === "ยกเลิกการลงขาย" ||
    lowerText === "marketplace" ||
    lowerText === "/marketplace" ||
    lowerText === "เมนูตลาด" ||
    lowerText === "ดูตลาด";
}

/**
 * Main marketplace handler
 * @param {Object} context - LINE context { lineClient, db }
 * @param {Object} event - LINE event
 * @param {Object} userData - User data
 * @return {Promise<boolean>} true if handled
 */
async function handleMarketplace(context, event, userData) {
  const { lineClient } = context;
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // Handle postback events
  if (event.type === "postback") {
    return handleMarketplacePostback(context, event);
  }

  // Handle image messages (check if in selling flow or AI post)
  if (event.message?.type === "image") {
    const userState = await getUserMarketplaceState(userId);

    // Handle AI Post image
    if (userState.state === "WAITING_FOR_AI_POST_IMAGE") {
      await handleAIPostImage(context, event, userId);
      return true;
    }

    if (userState.state === USER_STATES.WAITING_FOR_PRODUCT_IMAGE) {
      // Get image content
      try {
        const stream = await lineClient.getMessageContent(event.message.id);
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const imageBuffer = Buffer.concat(chunks);

        return handleProductImageUpload(context, event, imageBuffer);
      } catch (error) {
        console.error("Error getting image content:", error);
        return false;
      }
    }

    return false;
  }

  // Only handle text messages from here
  if (event.message?.type !== "text") {
    return false;
  }

  const text = event.message.text;
  const lowerText = text.toLowerCase().trim();

  // Check if user wants to cancel
  if (lowerText === "ยกเลิกการลงขาย") {
    await clearUserMarketplaceState(userId);
    await lineClient.replyMessage(replyToken, {
      type: "text",
      text: "❌ ยกเลิกการลงขายเรียบร้อยแล้ว",
      quickReply: {
        items: [
          { type: "action", action: { type: "message", label: "🛒 ลงขายใหม่", text: "/ขายสินค้า" } },
          { type: "action", action: { type: "message", label: "🔍 ดูตลาด", text: "/ตลาด" } },
        ],
      },
    });
    return true;
  }

  // Show marketplace menu or view market
  if (lowerText === "marketplace" || lowerText === "/marketplace" || lowerText === "เมนูตลาด" ||
    lowerText === "/ตลาด" || lowerText === "/market" || lowerText === "ดูตลาด") {
    await lineClient.replyMessage(replyToken, createMarketplaceMenuFlex());
    return true;
  }

  // NEW: /ขายสินค้า or /ขาย - Show web form link
  if (lowerText === "/ขายสินค้า" || lowerText === "/ขาย") {
    await lineClient.replyMessage(replyToken, createSellOptionsFlexMessage());
    return true;
  }

  // NEW: /โพสต์ - AI Vision Post Generator (เปลี่ยนจาก /aiโพสต์)
  if (lowerText === "/โพสต์" || lowerText === "/post" || lowerText === "โพสต์") {
    await handleAIPostCommand(context, userId, replyToken);
    return true;
  }

  // NEW: /หาสินค้า [keyword] or /หา [keyword] or /ค้นหา [keyword]
  if (lowerText.startsWith("/หาสินค้า") || lowerText.startsWith("/หา ") ||
    lowerText.startsWith("/ค้นหา") || lowerText.startsWith("/search")) {
    // Extract search keyword
    let keyword = "";
    if (lowerText.startsWith("/หาสินค้า")) keyword = text.substring(9).trim();
    else if (lowerText.startsWith("/หา ")) keyword = text.substring(4).trim();
    else if (lowerText.startsWith("/ค้นหา")) keyword = text.substring(6).trim();
    else if (lowerText.startsWith("/search")) keyword = text.substring(7).trim();

    if (keyword) {
      // Search with keyword
      event.message.text = `ซื้อ ${keyword}`;
      return handleSearchCommand(context, event);
    } else {
      // No keyword - show search prompt
      await lineClient.replyMessage(replyToken, {
        type: "text",
        text: "🔍 **ค้นหาสินค้า**\n\n" +
          "📝 วิธีใช้:\n" +
          "• /หา [ชื่อสินค้า]\n" +
          "• /ค้นหา [ชื่อสินค้า]\n\n" +
          "📌 ตัวอย่าง:\n" +
          "• /หา ไอโฟน\n" +
          "• /ค้นหา รองเท้า\n" +
          "• /หา กระเป๋า gucci",
        quickReply: {
          items: [
            { type: "action", action: { type: "message", label: "📱 หาไอโฟน", text: "/หา ไอโฟน" } },
            { type: "action", action: { type: "message", label: "👟 หารองเท้า", text: "/หา รองเท้า" } },
            { type: "action", action: { type: "message", label: "👜 หากระเป๋า", text: "/หา กระเป๋า" } },
            { type: "action", action: { type: "message", label: "🏠 ของใช้บ้าน", text: "/หา ของใช้" } },
          ],
        },
      });
      return true;
    }
  }

  // NEW: /สินค้าของฉัน
  if (lowerText === "/สินค้าของฉัน" || lowerText === "/myproducts") {
    return handleMyProductsCommand(context, event);
  }

  // Handle sell commands
  if (isSellCommand(text)) {
    return handleSellCommand(context, event, userData);
  }

  // Handle search commands
  if (isSearchCommand(text)) {
    return handleSearchCommand(context, event);
  }

  // Handle my products command
  if (isMyProductsCommand(text)) {
    return handleMyProductsCommand(context, event);
  }

  return false;
}

// =====================================================
// 📦 EXPORTS
// =====================================================

module.exports = {
  // Main handler
  handleMarketplace,
  isMarketplaceCommand,

  // Sub handlers
  handleSellCommand,
  handleSearchCommand,
  handleMyProductsCommand,
  handleProductImageUpload,
  handleMarketplacePostback,

  // AI Vision Post Generator
  generateAIProductPost,
  handleAIPostCommand,
  handleAIPostImage,
  handleViewAIPostsCommand,
  createAIPostResultFlex,

  // State management
  getUserMarketplaceState,
  setUserMarketplaceState,
  clearUserMarketplaceState,

  // Database operations
  saveProductToMarketplace,
  searchProducts,
  getProductById,
  getUserProducts,
  updateProductStatus,
  incrementProductStat,

  // Utilities
  parseSellCommand,
  generateProductTags,
  uploadProductImage,

  // Flex generators
  createWaitingForImageFlex,
  createProductConfirmationFlex,
  createProductBubble,
  createProductCarouselFlex,
  createMyProductsCarouselFlex,
  createMarketplaceMenuFlex,
  createSellOptionsFlexMessage,
  createAIPostResultFlex,

  // Constants
  USER_STATES,
  PRODUCT_STATUS,
  MARKETPLACE_COLLECTION,

  // Background Workers
  processAIPostTask,
};
