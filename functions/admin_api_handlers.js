const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const crypto = require("crypto");
const axios = require("axios");

// LINE client will be initialized at runtime within each function
const { getInjectionClient } = require("./line_client");

/**
 * 🛠️ Helper to get LINE client at runtime
 */
function getLineClient() {
    return getInjectionClient();
}

/**
 * 🔑 Admin Create PIN for User
 */
exports.adminCreatePin = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
        const { userId, adminId } = req.body;
        const SUPER_ADMIN_IDS = ["Ud9bec6d2ea945cf4330a69cb74ac93cf", "U9b40807cbcc8182928a12e3b6b73330e"];
        if (adminId && !SUPER_ADMIN_IDS.includes(adminId)) return res.status(403).json({ success: false, error: "Unauthorized" });

        const db = getFirestore();
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const userSnap = await db.collection("line_users").doc(userId).get();
        const userData = userSnap.exists ? userSnap.data() : {};

        await db.collection("web_pins").doc(pin).set({
            pin, userId, displayName: userData.displayName || "User",
            createdAt: FieldValue.serverTimestamp(), expiresAt, used: false
        });

        const lineClient = getLineClient();
        if (lineClient) {
            await lineClient.pushMessage(userId, {
                type: "text",
                text: `🔑 รหัสเข้าหน้าเว็บของคุณคือ: ${pin}`
            });
        }

        res.json({ success: true, pin, userId, expiresAt: expiresAt.toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🔐 Verify Web Login PIN
 */
exports.verifyWebPin = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
        console.log(`📡 verifyWebPin: REQUEST BODY = ${JSON.stringify(req.body)}`);
        const { pin, deviceId } = req.body;
        console.log(`🔐 verifyWebPin called for PIN: ${pin}, deviceId: ${deviceId}`);

        if (!pin) {
            console.warn("⚠️ No PIN provided in request body");
            return res.status(400).json({
                success: false,
                error: "PIN is required"
            });
        }

        const db = getFirestore();

        // PIN verification from web_pins collection
        const pinDoc = await db.collection("web_pins").doc(pin).get();

        if (!pinDoc.exists) {
            console.warn(`❌ PIN not found: ${pin}`);
            return res.status(400).json({
                success: false,
                error: "PIN ไม่ถูกต้อง หรือหมดอายุแล้ว"
            });
        }

        const pinData = pinDoc.data();
        if (pinData.used) {
            console.warn(`🕒 PIN already used: ${pin}`);
            return res.status(400).json({
                success: false,
                error: "PIN นี้ถูกใช้งานไปแล้ว กรุณาขอ PIN ใหม่"
            });
        }

        const userId = pinData.userId;
        if (!userId) {
            console.error(`❌ PIN document ${pin} has no userId!`);
            throw new Error("PIN document has no associated userId");
        }

        // Mark PIN as used
        await db.collection("web_pins").doc(pin).update({
            used: true,
            usedAt: FieldValue.serverTimestamp(),
            deviceId: deviceId || "unknown"
        });

        // ดึงข้อมูลโปรไฟล์ผู้ใช้เพื่อส่งกลับไปยัง App
        let userData = {};
        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            userData = userSnap.data();
        }

        // เสมอ: ถ้า displayName หรือ pictureUrl ยังขาดอยู่ ให้ดึงจาก line_users
        // (users doc มีแค่ stats, ชื่อ/รูปจริงอยู่ใน line_users)
        if (!userData.displayName || !userData.pictureUrl) {
            try {
                const lineUserSnap = await db.collection("line_users").doc(userId).get();
                if (lineUserSnap.exists) {
                    const lineData = lineUserSnap.data();
                    userData.displayName = userData.displayName
                        || lineData.displayName || lineData.name || lineData.userName;
                    userData.pictureUrl = userData.pictureUrl
                        || lineData.pictureUrl || lineData.picture
                        || lineData.photoURL || lineData.avatar;
                    console.log(`ℹ️ Merged LINE profile: ${userData.displayName}`);
                }
            } catch (e) {
                console.warn("Could not fetch line_users for profile merge:", e.message);
            }
        }

        // Create Custom Token for Firebase Auth
        console.log(`🔑 Creating Custom Token for userId: ${userId}`);
        const auth = getAuth();
        const customToken = await auth.createCustomToken(userId, {
            provider: 'pin',
            isPremium: userData.isPremium || false,
            isAdmin: userData.isAdmin || false,
            displayName: userData.displayName || 'User'
        });

        console.log(`✅ verifyWebPin success for user: ${userId} (${userData.displayName || 'Unknown'})`);

        res.json({
            success: true,
            userId: userId,
            sessionToken: customToken,
            user: {
                uid: userId,
                lineUserId: userId,
                displayName: userData.displayName || "User",
                pictureUrl: userData.pictureUrl || "",
                isPremium: userData.isPremium || false,
                isAdmin: userData.isAdmin || false,
                subscriptionStatus: userData.subscriptionStatus || "none",
                sellerStatus: userData.sellerStatus || "none",
                ...userData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง",
            debug: {
                message: error.message,
                code: error.code,
                stack: error.stack
            }
        });
    }
});

/**
 * 📊 Admin Get Stats
 */
exports.adminGetStats = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try {
        const db = getFirestore();
        const usersSnap = await db.collection("line_users").get();
        const productsSnap = await db.collection("marketplace_items").get();

        res.json({
            success: true,
            stats: {
                totalUsers: usersSnap.size,
                totalProducts: productsSnap.size
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 💰 Record Transaction
 */
exports.adminRecordTransaction = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try {
        const { userId, amount, packageType, adminId } = req.body;
        const db = getFirestore();
        await db.collection("transactions").add({
            userId, amount, packageType, adminId,
            createdAt: FieldValue.serverTimestamp()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📤 Broadcast Message
 */
exports.adminBroadcast = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
        const { message, target } = req.body;
        const lineClient = getLineClient();
        if (lineClient) {
            // Logic for broadcast (simplified for now)
            await lineClient.pushMessage(target, { type: "text", text: message });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🧹 Cleanup Data
 */
exports.adminCleanup = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try {
        const db = getFirestore();
        // Cleanup logic here...
        res.json({ success: true, message: "Cleanup completed" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📊 Get Transactions List
 */
exports.adminGetTransactions = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try {
        const db = getFirestore();
        const snap = await db.collection("transactions").orderBy("createdAt", "desc").limit(50).get();
        const transactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📋 Get Webhook Logs
 */
exports.adminGetWebhookLogs = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    try {
        const db = getFirestore();
        const snap = await db.collection("webhook_logs").orderBy("timestamp", "desc").limit(50).get();
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * 🔐 Verify LINE Login & Create Custom Token
 * (Used when client already has profile info)
 */
exports.verifyLineLogin = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
        console.log(`📡 verifyLineLogin: REQUEST BODY = ${JSON.stringify(req.body)}`);
        const { userId, displayName, pictureUrl, email } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: "userId is required" });
        }

        const db = getFirestore();
        const auth = getAuth();

        // 1. Update/Create User Profile in Firestore (Admin access - bypasses rules)
        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();
        const existingData = userSnap.exists ? userSnap.data() : null;

        const updateData = {
            displayName: displayName || existingData?.displayName || "User",
            pictureUrl: pictureUrl || existingData?.pictureUrl || "",
            lineUserId: userId,
            lastLoginAt: FieldValue.serverTimestamp(),
            provider: 'line',
            sellerStatus: existingData?.sellerStatus || 'verified', // Preserve or set verified for LINE
            isSeller: existingData?.isSeller ?? true,
        };

        if (email) updateData.email = email;
        if (!existingData) updateData.createdAt = FieldValue.serverTimestamp();

        await userRef.set(updateData, { merge: true });

        // 2. Create Custom Token for Firebase Auth
        const customToken = await auth.createCustomToken(userId, {
            provider: 'line',
            isPremium: existingData?.isPremium || false,
            isAdmin: existingData?.isAdmin || false,
            displayName: updateData.displayName
        });

        console.log(`✅ verifyLineLogin success for user: ${userId}`);

        res.json({
            success: true,
            userId: userId,
            sessionToken: customToken,
            user: {
                uid: userId,
                ...updateData,
                isPremium: existingData?.isPremium || false,
                isAdmin: existingData?.isAdmin || false
            }
        });
    } catch (error) {
        console.error("❌ verifyLineLogin error:", error);
        res.status(500).json({
            success: false,
            error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ LINE",
            debug: error.message
        });
    }
});

/**
 * 🔗 Generate Magic Login Token for LINE Users
 * Called by the LINE webhook to create a one-time login URL
 */
exports.generateLineToken = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");
    try {
        const { lineUserId, displayName, pictureUrl } = req.body;
        if (!lineUserId) return res.status(400).json({ success: false, error: "lineUserId required" });

        const db = getFirestore();
        const token = crypto.randomBytes(20).toString("hex");

        await db.collection("line_auto_tokens").doc(token).set({
            lineUserId,
            displayName: displayName || "",
            pictureUrl: pictureUrl || "",
            createdAt: FieldValue.serverTimestamp(),
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
            used: false,
        });

        res.json({ success: true, token });
    } catch (error) {
        console.error("generateLineToken error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🔐 Verify Magic Login Token (called from login.html on mobile)
 * Returns Firebase custom token + user session
 */
exports.verifyLineToken = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, error: "token required" });

        const db = getFirestore();
        const authAdmin = getAuth();
        const tokenRef = db.collection("line_auto_tokens").doc(token);
        const tokenSnap = await tokenRef.get();

        if (!tokenSnap.exists) {
            return res.status(404).json({ success: false, error: "ไม่พบ token หรือหมดอายุแล้ว" });
        }

        const tokenData = tokenSnap.data();

        if (tokenData.used) {
            return res.status(400).json({ success: false, error: "token ถูกใช้ไปแล้ว" });
        }
        if (Date.now() > tokenData.expiresAt) {
            await tokenRef.delete();
            return res.status(400).json({ success: false, error: "token หมดอายุแล้ว กรุณาขอลิงก์ใหม่" });
        }

        // Mark used immediately (prevent replay attack)
        await tokenRef.update({ used: true });

        const { lineUserId, displayName, pictureUrl } = tokenData;

        // Get existing user profile
        const userRef = db.collection("line_users").doc(lineUserId);
        const userSnap = await userRef.get();
        const userData = userSnap.exists ? userSnap.data() : {};

        // Update Firestore with latest data
        await userRef.set({
            lineUserId,
            displayName: displayName || userData.displayName || "ผู้ใช้",
            pictureUrl: pictureUrl || userData.pictureUrl || "",
            lastLoginAt: FieldValue.serverTimestamp(),
            loginSource: "web_magic_link",
        }, { merge: true });

        // Create Firebase custom token
        const customToken = await authAdmin.createCustomToken(lineUserId, {
            provider: "line",
            isPremium: userData?.isPremium || false,
            isAdmin: userData?.isAdmin || false,
        });

        // Delete used token
        await tokenRef.delete();

        console.log(`✅ verifyLineToken success for user: ${lineUserId}`);
        res.json({
            success: true,
            customToken,
            user: {
                uid: lineUserId,
                lineUserId,
                displayName: displayName || userData.displayName || "ผู้ใช้",
                pictureUrl: pictureUrl || userData.pictureUrl || "",
                isPremium: userData?.isPremium || userData?.subscriptionStatus === "active" || false,
                isAdmin: userData?.isAdmin || false,
                sellerStatus: userData?.sellerStatus || "none",
                provider: "line",
                loginAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("verifyLineToken error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🔐 LINE Login Web Callback (OAuth 2.0 Exchange)
 * Exchanges authorization code for tokens, fetches profile, and creates Firebase Token
 */
exports.lineLoginCallback = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
        const { code, redirectUri } = req.body;
        if (!code) return res.status(400).json({ success: false, error: "code is required" });

        const LINE_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID || "2009159046";
        const LINE_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET;
        if (!LINE_CHANNEL_SECRET) return res.status(500).json({ success: false, error: "LINE Login secret not configured" });

        // 1. Exchange code for access token
        const tokenParams = new URLSearchParams();
        tokenParams.append("grant_type", "authorization_code");
        tokenParams.append("code", code);
        tokenParams.append("redirect_uri", redirectUri || "https://appinjproject.web.app/login.html");
        tokenParams.append("client_id", LINE_CHANNEL_ID);
        tokenParams.append("client_secret", LINE_CHANNEL_SECRET);

        const tokenResp = await axios.post("https://api.line.me/oauth2/v2.1/token", tokenParams, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const { access_token } = tokenResp.data;

        // 2. Fetch user profile
        const profileResp = await axios.get("https://api.line.me/v2/profile", {
            headers: { "Authorization": `Bearer ${access_token}` }
        });

        const { userId, displayName, pictureUrl } = profileResp.data;

        // 3. Update Firestore User Profile
        const db = getFirestore();
        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();
        const existingData = userSnap.exists ? userSnap.data() : null;

        const updateData = {
            displayName: displayName || existingData?.displayName || "User",
            pictureUrl: pictureUrl || existingData?.pictureUrl || "",
            lineUserId: userId,
            lastLoginAt: FieldValue.serverTimestamp(),
            provider: "line_web_login"
        };
        if (!existingData) updateData.createdAt = FieldValue.serverTimestamp();

        // Save to users collection
        await userRef.set(updateData, { merge: true });

        // Save to line_users collection for backward compatibility
        await db.collection("line_users").doc(userId).set(updateData, { merge: true });

        // 4. Create Firebase Custom Token
        const auth = getAuth();
        const customToken = await auth.createCustomToken(userId, {
            provider: "line",
            isPremium: existingData?.isPremium || false,
            isAdmin: existingData?.isAdmin || false,
            displayName: updateData.displayName
        });

        // 5. Send Success Response matching what login.html expects
        res.json({
            success: true,
            user: {
                uid: userId,
                lineUserId: userId,
                displayName: updateData.displayName,
                pictureUrl: updateData.pictureUrl,
                isPremium: existingData?.isPremium || false,
                isAdmin: existingData?.isAdmin || false,
                sessionToken: customToken
            }
        });

    } catch (error) {
        console.error("lineLoginCallback error:", error?.response?.data || error.message);
        res.status(500).json({ success: false, error: "LINE Authentication failed" });
    }
});

/**
 * 🔄 refreshWebSession
 * Issues a fresh Firebase Custom Token for an existing user session.
 * Called by app-init.js on page load when Firebase Auth is missing but
 * localStorage session exists (e.g. user logged in before this fix).
 *
 * Body: { userId: string }
 * Response: { success: true, sessionToken: string }
 */
exports.refreshWebSession = onRequest({
    region: "us-central1",
    cors: true,
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

    try {
        const { userId } = req.body;
        if (!userId || typeof userId !== "string" || userId.length < 5) {
            return res.status(400).json({ success: false, error: "Invalid userId" });
        }

        const db = getFirestore();

        // Verify user exists in Firestore (users or line_users)
        const [userSnap, lineSnap] = await Promise.all([
            db.collection("users").doc(userId).get(),
            db.collection("line_users").doc(userId).get(),
        ]);

        if (!userSnap.exists && !lineSnap.exists) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const userData = userSnap.exists ? userSnap.data() : lineSnap.data();

        // Issue fresh custom token
        const auth = getAuth();
        const customToken = await auth.createCustomToken(userId, {
            provider: "refresh",
            isPremium: userData?.isPremium || false,
            isAdmin: userData?.isAdmin || false,
        });

        console.log(`🔄 refreshWebSession: issued token for ${userId}`);
        res.json({ success: true, sessionToken: customToken });

    } catch (error) {
        console.error("refreshWebSession error:", error.message);
        res.status(500).json({ success: false, error: "Token refresh failed" });
    }
});

