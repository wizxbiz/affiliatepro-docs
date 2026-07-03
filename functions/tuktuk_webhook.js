/**
 * 🛺 TUKTUK THAILAND LINE WEBHOOK
 * Super App ท้องถิ่น — ตลาด SME/OTOP + วินมอเตอร์ไซค์ดิจิทัล + ชุมชนไทย
 * 
 * VERSION: 3.0.0 - ULTRA PREMIUM UI
 * ปรับปรุง: Glassmorphism, Gradients, Micro-interactions
 */

const { onRequest } = require("firebase-functions/v2/https");
const crypto = require("crypto");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getTuktukClient, getTuktukConfig, secrets } = require("./line_client");
const tuktukFlex = require("./tuktukFlexMessages");

// ============================================================
// ⚙️ CONFIGURATION
// ============================================================
const SUPER_ADMIN_IDS = [
    "Ud9bec6d2ea945cf4330a69cb74ac93cf",
    "U9b40807cbcc8182928a12e3b6b73330e",
];

const TUKTUK_BASE_URL = "https://tuktukfeed.com";

// 🌈 Premium Color Palette
const COLORS = {
    primary: "#00D2FF",
    primaryDark: "#0088CC",
    primaryGradient: ["#00D2FF", "#0088CC"],
    secondary: "#FF6B2B",
    secondaryDark: "#E54B1A",
    secondaryGradient: ["#FF6B2B", "#FF4500"],
    success: "#00E676",
    successGradient: ["#00E676", "#00C853"],
    warning: "#FFD600",
    warningGradient: ["#FFD600", "#FFB300"],
    error: "#FF3B3B",
    errorGradient: ["#FF3B3B", "#D32F2F"],
    purple: "#8B5CF6",
    purpleGradient: ["#8B5CF6", "#6366F1"],
    blue: "#3B82F6",
    blueGradient: ["#3B82F6", "#2563EB"],
    bg: "#0A0E21",
    surface: "#12192DF2",
    surfaceLight: "#1C263CF2",
    text: "#FFFFFF",
    textSecondary: "#FFFFFFB3",
    textMuted: "#FFFFFF80",
};

// ============================================================
// 🎨 UI UTILITIES - Premium Flex Components
// ============================================================

/**
 * สร้าง Header แบบ Premium พร้อม Gradient
 */
function createPremiumHeader(icon, title, subtitle, gradient = COLORS.primaryGradient) {
    return {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        background: {
            type: "linearGradient",
            angle: "135deg",
            startColor: gradient[0],
            endColor: gradient[1],
        },
        contents: [
            {
                type: "box",
                layout: "horizontal",
                contents: [
                    {
                        type: "box",
                        layout: "vertical",
                        width: "48px",
                        height: "48px",
                        backgroundColor: "#FFFFFF33",
                        cornerRadius: "24px",
                        justifyContent: "center",
                        contents: [
                            { type: "text", text: icon, size: "3xl", align: "center" },
                        ],
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "md",
                        flex: 1,
                        contents: [
                            { type: "text", text: title, weight: "bold", size: "xl", color: COLORS.text },
                            { type: "text", text: subtitle, size: "xs", color: "#FFFFFFCC", margin: "xs" },
                        ],
                    },
                ],
            },
        ],
    };
}

/**
 * สร้าง Stat Card แบบ Premium
 */
function createStatCard(icon, label, value, color = COLORS.primary, backgroundColor = "#00D2FF1A") {
    return {
        type: "box",
        layout: "vertical",
        backgroundColor,
        cornerRadius: "12px",
        paddingAll: "15px",
        flex: 1,
        contents: [
            {
                type: "box",
                layout: "horizontal",
                contents: [
                    { type: "text", text: icon, size: "xl", flex: 0 },
                    { type: "text", text: label, size: "xs", color: COLORS.textMuted, margin: "sm", flex: 1 },
                ],
            },
            { type: "text", text: String(value), size: "xxl", weight: "bold", color, align: "end", margin: "sm" },
        ],
    };
}

/**
 * สร้าง Command Chip แบบ Premium
 */
function createCommandChip(cmd, desc, color = COLORS.primary) {
    return {
        type: "box",
        layout: "horizontal",
        paddingAll: "12px",
        backgroundColor: "#FFFFFF08",
        cornerRadius: "10px",
        margin: "xs",
        contents: [
            {
                type: "box",
                layout: "vertical",
                width: "60px",
                backgroundColor: `${color}20`,
                cornerRadius: "6px",
                paddingAll: "4px",
                contents: [
                    { type: "text", text: cmd, size: "xxs", weight: "bold", color, align: "center" },
                ],
            },
            {
                type: "text",
                text: desc,
                size: "xs",
                color: COLORS.textSecondary,
                margin: "md",
                flex: 1,
                wrap: true,
            },
        ],
    };
}

/**
 * สร้าง Progress Bar แบบ Premium
 */
function createProgressBar(percentage, color = COLORS.success, label = "", value = "") {
    return {
        type: "box",
        layout: "vertical",
        margin: "sm",
        contents: [
            ...(label ? [{
                type: "box",
                layout: "horizontal",
                contents: [
                    { type: "text", text: label, size: "xs", color: COLORS.textMuted, flex: 1 },
                    ...(value ? [{ type: "text", text: value, size: "xs", weight: "bold", color, align: "end" }] : []),
                ],
            }] : []),
            {
                type: "box",
                layout: "vertical",
                margin: "xs",
                contents: [
                    {
                        type: "box",
                        layout: "vertical",
                        contents: [],
                        width: `${percentage}%`,
                        height: "6px",
                        backgroundColor: color,
                        cornerRadius: "3px",
                    },
                ],
                backgroundColor: "#FFFFFF1A",
                height: "6px",
                cornerRadius: "3px",
            },
        ],
    };
}

/**
 * สร้าง Button แบบ Premium
 */
function createPremiumButton(_label, action, style = "primary", color = COLORS.primary) {
    const btn = {
        type: "button",
        style,
        height: "sm",
        action,
    };
    if (style === "primary" || style === "secondary") btn.color = color;
    return btn;
}

/**
 * สร้าง Divider แบบ Premium
 */
function createPremiumDivider() {
    return {
        type: "separator",
        margin: "lg",
        color: "#FFFFFF1A",
    };
}

/**
 * สร้าง Error Flex แบบ Premium
 */
function createPremiumError(message) {
    return {
        type: "flex",
        altText: `❌ ${message}`,
        contents: {
            type: "bubble",
            size: "nano",
            body: {
                type: "box",
                layout: "horizontal",
                paddingAll: "16px",
                backgroundColor: "#FF3B3B1A",
                cornerRadius: "12px",
                borderWidth: "1px",
                borderColor: "#FF3B3B4D",
                contents: [
                    { type: "text", text: "❌", size: "xl", flex: 0 },
                    { type: "text", text: message, size: "sm", color: COLORS.error, margin: "md", wrap: true, flex: 1 },
                ],
            },
        },
    };
}


// ============================================================
// 🛺 CLOUD FUNCTION ENTRY POINT
// ============================================================
const lineWebhookTuktuk = onRequest({
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [secrets.tuktuk.channelSecret, secrets.tuktuk.channelAccessToken],
}, async (req, res) => {
    console.log("\n🛺 TUKTUK WEBHOOK RECEIVED");

    const tuktukClient = getTuktukClient();
    const tuktukConfig = getTuktukConfig();

    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    // Signature validation
    const signature = req.headers["x-line-signature"];
    const channelSecret = tuktukConfig.channelSecret;
    if (!signature) return res.status(401).send("Unauthorized - Missing signature");

    const body = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const hash = crypto.createHmac("SHA256", channelSecret).update(body).digest("base64");
    if (hash !== signature) {
        console.log("❌ Invalid signature");
        return res.status(401).send("Invalid signature");
    }

    if (!tuktukClient) {
        console.error("❌ TukTuk Client not initialized");
        return res.status(500).send("TukTuk Client not configured");
    }

    try {
        const events = req.body.events || [];
        console.log(`📨 Processing ${events.length} TukTuk event(s)`);

        for (const event of events) {
            switch (event.type) {
                case "message":
                    await handleTuktukMessage(event, tuktukClient);
                    break;
                case "follow":
                    await handleTuktukFollow(event, tuktukClient);
                    break;
                case "unfollow":
                    await handleTuktukUnfollow(event);
                    break;
                case "postback":
                    await handleTuktukPostback(event, tuktukClient);
                    break;
                default:
                    console.log(`⚠️ Unhandled event type: ${event.type}`);
            }
        }
        return res.status(200).send("OK");
    } catch (error) {
        console.error("❌ TukTuk webhook error:", error);
        return res.status(500).send("Internal Server Error");
    }
});

// ============================================================
// 👋 FOLLOW EVENT — Premium Welcome
// ============================================================
async function handleTuktukFollow(event, tuktukClient) {
    const userId = event.source.userId;
    console.log(`👋 TukTuk Follow: ${userId}`);

    try {
        const db = getFirestore();
        const profile = await tuktukClient.getProfile(userId);

        await db.collection("line_users").doc(userId).set({
            lineUserId: userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl || "",
            followedAt: FieldValue.serverTimestamp(),
            status: "active",
            source: "tuktuk",
        }, { merge: true });

        // ส่ง Welcome Flex แบบ Premium อัปเกรดสูงสุด ทรงพลัง
        const welcomeMessage = {
            type: "flex",
            altText: `🛺 ยินดีต้อนรับ ${profile.displayName} สู่ TukTuk Thailand!`,
            contents: {
                type: "carousel",
                contents: [
                    // --- BUBBLE 1: HERO & WELCOME ---
                    {
                        type: "bubble",
                        size: "mega",
                        header: {
                            type: "box", layout: "vertical", paddingAll: "0px",
                            contents: [
                                {
                                    type: "box", layout: "vertical", height: "130px",
                                    background: {
                                        type: "linearGradient",
                                        angle: "135deg",
                                        startColor: "#0f172a",
                                        endColor: "#334155"
                                    },
                                    justifyContent: "center", alignItems: "center",
                                    contents: [
                                        { type: "text", text: "TUKTUK THAILAND", weight: "bold", size: "xl", color: "#ffffff" },
                                        { type: "text", text: "SUPER APP ท้องถิ่น", size: "xs", color: "#94a3b8", margin: "md", weight: "bold" }
                                    ]
                                },
                                {
                                    type: "box", layout: "vertical",
                                    position: "absolute", offsetBottom: "-30px", offsetStart: "20px",
                                    width: "70px", height: "70px", cornerRadius: "35px",
                                    backgroundColor: "#ffffff", paddingAll: "3px",
                                    contents: [
                                        { type: "image", url: profile.pictureUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png", aspectMode: "cover" }
                                    ]
                                }
                            ]
                        },
                        body: {
                            type: "box", layout: "vertical", paddingAll: "20px", paddingTop: "45px", backgroundColor: "#ffffff",
                            contents: [
                                { type: "text", text: `สวัสดีคุณ ${profile.displayName} 👋`, weight: "bold", size: "xl", color: "#1e293b" },
                                { type: "text", text: "แพลตฟอร์มที่รวมทุกความสะดวกสบายในท้องถิ่นของคุณไว้ในที่เดียว!", size: "sm", color: "#64748b", wrap: true, margin: "md" },
                                { type: "separator", margin: "xl", color: "#f1f5f9" },
                                {
                                    type: "box", layout: "vertical", margin: "lg", spacing: "md",
                                    contents: [
                                        {
                                            type: "box", layout: "horizontal", alignItems: "center", backgroundColor: "#faf5ff", paddingAll: "10px", cornerRadius: "8px",
                                            contents: [
                                                { type: "box", layout: "vertical", width: "36px", height: "36px", cornerRadius: "18px", backgroundColor: "#e9d5ff", justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: "▶️", size: "sm" }] },
                                                { type: "text", text: "ดูฟีดวิดีโอสั้น ชุมชนคนท้องถิ่น", size: "sm", color: "#7e22ce", margin: "md", weight: "bold" }
                                            ]
                                        },
                                        {
                                            type: "box", layout: "horizontal", alignItems: "center", backgroundColor: "#f8fafc", paddingAll: "10px", cornerRadius: "8px",
                                            contents: [
                                                { type: "box", layout: "vertical", width: "36px", height: "36px", cornerRadius: "18px", backgroundColor: "#e0f2fe", justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: "🛒", size: "sm" }] },
                                                { type: "text", text: "ช้อปปิ้งสินค้า OTOP & SME", size: "sm", color: "#334155", margin: "md", weight: "bold" }
                                            ]
                                        },
                                        {
                                            type: "box", layout: "horizontal", alignItems: "center", backgroundColor: "#f8fafc", paddingAll: "10px", cornerRadius: "8px",
                                            contents: [
                                                { type: "box", layout: "vertical", width: "36px", height: "36px", cornerRadius: "18px", backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: "🛺", size: "sm" }] },
                                                { type: "text", text: "เรียกวินมอเตอร์ไซค์ง่ายๆ", size: "sm", color: "#334155", margin: "md", weight: "bold" }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        footer: {
                            type: "box", layout: "vertical", paddingAll: "20px", paddingTop: "0px", backgroundColor: "#ffffff", spacing: "sm",
                            contents: [
                                { type: "button", style: "primary", color: "#7e22ce", action: { type: "uri", label: "▶️ ดูฟีดวิดีโอเลย!", uri: "https://tuktukfeed.com/index.html" }, height: "sm" },
                                { type: "button", style: "secondary", color: "#0ea5e9", action: { type: "message", label: "📱 เริ่มต้นใช้งาน", text: "เมนู" }, height: "sm" }
                            ]
                        }
                    },
                    // --- BUBBLE 2: MARKETPLACE ---
                    {
                        type: "bubble",
                        size: "mega",
                        header: {
                            type: "box", layout: "vertical", paddingAll: "20px",
                            background: { type: "linearGradient", angle: "135deg", startColor: "#f59e0b", endColor: "#d97706" },
                            contents: [
                                { type: "text", text: "🛒 MARKETPLACE", weight: "bold", size: "xl", color: "#ffffff" },
                                { type: "text", text: "ตลาดออนไลน์สินค้าท้องถิ่น", size: "xs", color: "#fef3c7", margin: "xs", weight: "bold" }
                            ]
                        },
                        body: {
                            type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: "#fffbeb",
                            contents: [
                                { type: "text", text: "สนับสนุนสินค้าชุมชน ซื้อขายง่าย ปลอดภัย", size: "sm", color: "#b45309", wrap: true },
                                {
                                    type: "box", layout: "horizontal", margin: "xl", spacing: "md",
                                    contents: [
                                        {
                                            type: "box", layout: "vertical", backgroundColor: "#ffffff", paddingAll: "15px", cornerRadius: "12px", flex: 1, alignItems: "center", borderWidth: "1px", borderColor: "#fde68a", action: { type: "message", label: "ตลาด", text: "ตลาด" },
                                            contents: [
                                                { type: "text", text: "🛍️", size: "xxl" },
                                                { type: "text", text: "ซื้อสินค้า", size: "xs", color: "#d97706", margin: "md", weight: "bold" }
                                            ]
                                        },
                                        {
                                            type: "box", layout: "vertical", backgroundColor: "#ffffff", paddingAll: "15px", cornerRadius: "12px", flex: 1, alignItems: "center", borderWidth: "1px", borderColor: "#fde68a", action: { type: "message", label: "สมัครขาย", text: "สมัครขาย" },
                                            contents: [
                                                { type: "text", text: "🏪", size: "xxl" },
                                                { type: "text", text: "เปิดร้าน", size: "xs", color: "#d97706", margin: "md", weight: "bold" }
                                            ]
                                        }
                                    ]
                                },
                                { type: "text", text: "✅ ลงทะเบียนร้านค้า OTOP ฟรี!", size: "xs", color: "#b45309", margin: "md", align: "center", weight: "bold" }
                            ]
                        },
                        footer: {
                            type: "box", layout: "vertical", paddingAll: "20px", paddingTop: "0px", backgroundColor: "#fffbeb",
                            contents: [
                                { type: "button", style: "primary", color: "#d97706", action: { type: "message", label: "ทางเข้าตลาด", text: "ตลาด" }, height: "sm" }
                            ]
                        }
                    },
                    // --- BUBBLE 3: WIN RIDER ---
                    {
                        type: "bubble",
                        size: "mega",
                        header: {
                            type: "box", layout: "vertical", paddingAll: "20px",
                            background: { type: "linearGradient", angle: "135deg", startColor: "#10b981", endColor: "#059669" },
                            contents: [
                                { type: "text", text: "🛺 WIN RIDER", weight: "bold", size: "xl", color: "#ffffff" },
                                { type: "text", text: "นัดหมายวินมอเตอร์ไซค์ดิจิทัล", size: "xs", color: "#d1fae5", margin: "xs", weight: "bold" }
                            ]
                        },
                        body: {
                            type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: "#f0fdf4",
                            contents: [
                                { type: "text", text: "สะดวก รวดเร็ว ปลอดภัย รู้ราคาก่อนออกเดินทาง", size: "sm", color: "#047857", wrap: true },
                                {
                                    type: "box", layout: "vertical", margin: "xl", paddingAll: "15px", backgroundColor: "#ffffff", cornerRadius: "12px", borderWidth: "1px", borderColor: "#a7f3d0",
                                    contents: [
                                        {
                                            type: "box", layout: "horizontal", alignItems: "center",
                                            contents: [
                                                { type: "box", layout: "vertical", width: "32px", height: "32px", cornerRadius: "16px", backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: "📍", size: "xs" }] },
                                                { type: "text", text: "แชร์ Location รับ-ส่งแม่นยำ", size: "sm", color: "#059669", margin: "md", weight: "bold" }
                                            ]
                                        },
                                        { type: "separator", margin: "md", color: "#ecfdf5" },
                                        {
                                            type: "box", layout: "horizontal", alignItems: "center", margin: "md",
                                            contents: [
                                                { type: "box", layout: "vertical", width: "32px", height: "32px", cornerRadius: "16px", backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: "💵", size: "xs" }] },
                                                { type: "text", text: "ระบบคำนวณราคามาตรฐาน", size: "sm", color: "#059669", margin: "md", weight: "bold" }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        footer: {
                            type: "box", layout: "vertical", paddingAll: "20px", paddingTop: "0px", backgroundColor: "#f0fdf4",
                            contents: [
                                { type: "button", style: "primary", color: "#059669", action: { type: "message", label: "เรียกวิน/สมัครขับ", text: "วิน" }, height: "sm" }
                            ]
                        }
                    },
                    // --- BUBBLE 4: COMMUNITY FEED ---
                    {
                        type: "bubble",
                        size: "mega",
                        header: {
                            type: "box", layout: "vertical", paddingAll: "20px",
                            background: { type: "linearGradient", angle: "135deg", startColor: "#a855f7", endColor: "#7e22ce" },
                            contents: [
                                { type: "text", text: "📱 ฟีด ดูเพลิน", weight: "bold", size: "xl", color: "#ffffff" },
                                { type: "text", text: "วิดีโอสั้นและชุมชนคนในท้องถิ่น", size: "xs", color: "#f3e8ff", margin: "xs", weight: "bold" }
                            ]
                        },
                        body: {
                            type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: "#faf5ff",
                            contents: [
                                { type: "text", text: "อัปเดตข่าวสาร โปรโมชั่นร้านค้า และรับชมวิดีโอสั้นรีวิวของดีในชุมชน", size: "sm", color: "#6b21a8", wrap: true },
                                {
                                    type: "box", layout: "vertical", margin: "xl", paddingAll: "15px", backgroundColor: "#ffffff", cornerRadius: "12px", borderWidth: "1px", borderColor: "#e9d5ff",
                                    contents: [
                                        {
                                            type: "box", layout: "horizontal", alignItems: "center",
                                            contents: [
                                                { type: "box", layout: "vertical", width: "32px", height: "32px", cornerRadius: "16px", backgroundColor: "#f3e8ff", justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: "▶️", size: "xs" }] },
                                                { type: "text", text: "ดูคลิปวิดีโอสั้นเพลินๆ", size: "sm", color: "#7e22ce", margin: "md", weight: "bold" }
                                            ]
                                        },
                                        { type: "separator", margin: "md", color: "#f3e8ff" },
                                        {
                                            type: "box", layout: "horizontal", alignItems: "center", margin: "md",
                                            contents: [
                                                { type: "box", layout: "vertical", width: "32px", height: "32px", cornerRadius: "16px", backgroundColor: "#f3e8ff", justifyContent: "center", alignItems: "center", contents: [{ type: "text", text: "👥", size: "xs" }] },
                                                { type: "text", text: "พบปะพูดคุยกับคนในชุมชน", size: "sm", color: "#7e22ce", margin: "md", weight: "bold" }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        footer: {
                            type: "box", layout: "vertical", paddingAll: "20px", paddingTop: "0px", backgroundColor: "#faf5ff",
                            contents: [
                                { type: "button", style: "primary", color: "#7e22ce", action: { type: "uri", label: "▶️ เข้าสู่ ฟีด ดูเพลิน", uri: "https://tuktukfeed.com/index.html" }, height: "sm" }
                            ]
                        }
                    }
                ]
            }
        };

        await tuktukClient.pushMessage({ to: userId, messages: [welcomeMessage] });
        console.log(`✅ Premium welcome sent to ${profile.displayName}`);
    } catch (error) {
        console.error("❌ Follow error:", error);
    }
}

// ============================================================
// 👋 UNFOLLOW EVENT
// ============================================================
async function handleTuktukUnfollow(event) {
    const userId = event.source.userId;
    console.log(`👋 TukTuk Unfollow: ${userId}`);
    try {
        await getFirestore().collection("line_users").doc(userId).set(
            { status: "unfollowed", unfollowedAt: FieldValue.serverTimestamp() },
            { merge: true }
        );
    } catch (error) {
        console.error("❌ Unfollow error:", error);
    }
}

// ============================================================
// 💬 MESSAGE EVENT — Premium Handler
// ============================================================
async function handleTuktukMessage(event, tuktukClient) {
    const userId = event.source.userId;
    const replyToken = event.replyToken;
    const msg = event.message;

    // Handle image messages
    if (msg.type === "image") {
        await handleImageMessage(event, tuktukClient);
        return;
    }

    if (msg.type !== "text") return;

    const text = (msg.text || "").trim();
    const lower = text.toLowerCase();
    console.log(`💬 TukTuk [${userId}]: ${text}`);

    try {
        const db = getFirestore();
        const isSuperAdmin = SUPER_ADMIN_IDS.includes(userId);

        // ──────────────────────────────────────────────────────
        // 🛡️ ADMIN COMMANDS
        // ──────────────────────────────────────────────────────
        if (isSuperAdmin) {
            const adminHandled = await handleAdminCommand(lower, text, userId, replyToken, tuktukClient, db);
            if (adminHandled) return;
        }

        // ──────────────────────────────────────────────────────
        // 📋 MAIN MENU
        // ──────────────────────────────────────────────────────
        if (/^(เมนู|menu|หน้าหลัก|main|home|เริ่ม|start|\?)$/.test(lower)) {
            await tuktukClient.replyMessage({
                replyToken,
                messages: [createPremiumMainMenu()],
            });
            return;
        }

        // ──────────────────────────────────────────────────────
        // 🛒 MARKETPLACE
        // ──────────────────────────────────────────────────────
        if (/ตลาด|marketplace|ซื้อของ|หาของ|ช้อปปิ้ง|shopping/.test(lower)) {
            await handlePremiumMarketplaceMenu(replyToken, tuktukClient);
            return;
        }

        if (/otop|โอท็อป|สินค้าท้องถิ่น|ของดี/.test(lower)) {
            await handlePremiumOtopShowcase(replyToken, tuktukClient, db);
            return;
        }

        // ค้นหาสินค้า
        const buySearchMatch = text.match(/^(?:หา|ค้นหา|search)\s+(.+)/i);
        if (buySearchMatch) {
            await handlePremiumBuyerSearch(buySearchMatch[1], replyToken, tuktukClient, db);
            return;
        }

        // ──────────────────────────────────────────────────────
        // 🛺 WIN RIDER
        // ──────────────────────────────────────────────────────
        if (/วิน|win\s*rider|มอเตอร์ไซค์รับจ้าง|เรียกวิน/.test(lower)) {
            await handlePremiumWinRiderMenu(replyToken, tuktukClient);
            return;
        }

        if (/สมัครวิน|สมัครเป็นคนขับ|register.*rider|rider.*register/.test(lower)) {
            await handlePremiumWinRiderRegister(replyToken, tuktukClient);
            return;
        }

        // ──────────────────────────────────────────────────────
        // 🏪 SELLER TOOLS
        // ──────────────────────────────────────────────────────
        if (/สถิติ|dashboard|ภาพรวมร้าน/.test(lower)) {
            const stats = await getSellerStats(userId);
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumDashboard(stats)] });
            return;
        }

        if (/ออเดอร์|orders|คำสั่งซื้อ/.test(lower)) {
            await handlePremiumOrdersList(userId, replyToken, tuktukClient, db);
            return;
        }

        // ค้นหาสินค้าตัวเอง
        const sellSearchMatch = text.match(/สินค้า\s+(.+)/i);
        if (sellSearchMatch) {
            await handleSellerProductSearch(userId, sellSearchMatch[1], replyToken, tuktukClient);
            return;
        }

        // อัปเดตสต็อก
        const stockMatch = text.match(/เพิ่มสต็อก\s+(\S+)\s+(\d+)/i);
        if (stockMatch) {
            const result = await updateStock(userId, stockMatch[1], parseInt(stockMatch[2]));
            await tuktukClient.replyMessage({
                replyToken,
                messages: [result.success
                    ? createPremiumStockUpdateSuccess(result)
                    : createPremiumError(result.error)
                ],
            });
            return;
        }

        if (/สมัครขาย|เปิดร้าน|open.*shop|register.*seller/.test(lower)) {
            await handlePremiumSellerOnboarding(replyToken, tuktukClient);
            return;
        }

        // ──────────────────────────────────────────────────────
        // 🔑 PIN
        // ──────────────────────────────────────────────────────
        if (/รหัส|pin|เข้าสู่ระบบ|login/.test(lower)) {
            await handlePremiumPinRequest(userId, replyToken, tuktukClient, db, isSuperAdmin);
            return;
        }

        // ──────────────────────────────────────────────────────
        // ℹ️ ABOUT / HELP
        // ──────────────────────────────────────────────────────
        if (/เกี่ยวกับ|about|tuktuk.*คือ|วิธีใช้|help|ช่วยด้วย/.test(lower)) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumAbout()] });
            return;
        }

        // ──────────────────────────────────────────────────────
        // 📋 DEFAULT FALLBACK — Show Menu instead of AI
        // ──────────────────────────────────────────────────────
        await tuktukClient.replyMessage({
            replyToken,
            messages: [createPremiumMainMenu()],
        });

    } catch (error) {
        console.error("❌ TukTuk message error:", error);
        await tuktukClient.replyMessage({
            replyToken,
            messages: [createPremiumError("⚠️ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")],
        }).catch(() => { });
    }
}


// ============================================================
// 🛡️ PREMIUM ADMIN COMMANDS
// ============================================================

async function handleAdminCommand(lower, text, userId, replyToken, tuktukClient, db) {

    // ─────────────────────────────────────────
    // 📋 PREMIUM ADMIN HELP
    // ─────────────────────────────────────────
    if (/^(admin|help|ช่วยเหลือ|คำสั่ง)$/.test(lower)) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "🛡️ TukTuk Admin Commands",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("🛡️", "Admin Panel", "TukTuk Thailand Super Admin", [COLORS.purple, COLORS.blue]),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            { type: "text", text: "📊 สถิติระบบ", size: "xs", weight: "bold", color: COLORS.textMuted, margin: "sm" },
                            createCommandChip("ระบบ", "ดูสถานะระบบทั้งหมด", COLORS.primary),
                            createCommandChip("ผู้ใช้", "ผู้ใช้ล่าสุด 5 คน", COLORS.success),
                            createCommandChip("ร้านค้า", "ร้านค้าล่าสุด 5 ร้าน", COLORS.secondary),
                            createCommandChip("ดูวิน", "สถานะวินมอเตอร์ไซค์", COLORS.purple),
                            createCommandChip("ออเดอร์ทั้งหมด", "ออเดอร์ล่าสุด 5 รายการ", COLORS.warning),
                            createPremiumDivider(),
                            { type: "text", text: "🔍 ค้นหา", size: "xs", weight: "bold", color: COLORS.textMuted, margin: "md" },
                            createCommandChip("user [userId]", "ดูโปรไฟล์ user", COLORS.blue),
                            createCommandChip("pin [userId]", "ดู PIN ปัจจุบัน", COLORS.purple),
                            createPremiumDivider(),
                            { type: "text", text: "📤 ส่งข้อความ", size: "xs", weight: "bold", color: COLORS.textMuted, margin: "md" },
                            createCommandChip("ส่ง [userId] [msg]", "push message หา user", COLORS.success),
                            createCommandChip("ส่งทุกคน [msg]", "broadcast ทุกคน", COLORS.warning),
                        ],
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            createPremiumButton("📊 ดูสถานะระบบ", { type: "message", label: "📊 ดูสถานะระบบ", text: "ระบบ" }, "primary", COLORS.primary),
                        ],
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 📊 PREMIUM SYSTEM STATUS
    // ─────────────────────────────────────────
    if (/^(ระบบ|system)$/.test(lower)) {
        const [usersSnap, sellersSnap, productsSnap, ordersSnap, ridersOnSnap, ridersAllSnap] = await Promise.all([
            db.collection("line_users").count().get(),
            db.collection("seller_profiles").count().get(),
            db.collection("marketplace_items").where("status", "==", "active").count().get(),
            db.collection("product_orders").count().get(),
            db.collection("win_riders").where("isOnline", "==", true).count().get(),
            db.collection("win_riders").count().get(),
        ]);

        const onlineRiders = ridersOnSnap.data().count;
        const allRiders = ridersAllSnap.data().count;
        const now = new Date();

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "📊 System Status",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("📊", "System Status", now.toLocaleString("th-TH"), COLORS.blueGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "md",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                contents: [
                                    createStatCard("👥", "ผู้ใช้", usersSnap.data().count.toLocaleString(), COLORS.primary, `${COLORS.primary}10`),
                                    createStatCard("🏪", "ร้านค้า", sellersSnap.data().count.toLocaleString(), COLORS.success, `${COLORS.success}10`),
                                ],
                            },
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                margin: "sm",
                                contents: [
                                    createStatCard("📦", "สินค้า", productsSnap.data().count.toLocaleString(), COLORS.secondary, `${COLORS.secondary}10`),
                                    createStatCard("🛒", "ออเดอร์", ordersSnap.data().count.toLocaleString(), COLORS.warning, `${COLORS.warning}10`),
                                ],
                            },
                            createPremiumDivider(),
                            {
                                type: "box",
                                layout: "horizontal",
                                contents: [
                                    { type: "text", text: "🛺 วินมอเตอร์ไซค์", size: "sm", weight: "bold", color: COLORS.text, flex: 1 },
                                    { type: "text", text: `${onlineRiders}/${allRiders} ออนไลน์`, size: "sm", color: onlineRiders > 0 ? COLORS.success : COLORS.error, align: "end" },
                                ],
                            },
                            createProgressBar(
                                allRiders > 0 ? (onlineRiders / allRiders) * 100 : 0,
                                onlineRiders > 0 ? COLORS.success : COLORS.error,
                                "",
                                `${onlineRiders} คัน`
                            ),
                        ],
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            {
                                type: "text",
                                text: onlineRiders > 0 ? `✅ ${onlineRiders} วินออนไลน์ — ระบบทำงานปกติ` : "⚠️ ไม่มีวินออนไลน์",
                                size: "xs",
                                color: onlineRiders > 0 ? COLORS.success : COLORS.warning,
                                align: "center",
                            },
                        ],
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 👥 PREMIUM USERS LIST
    // ─────────────────────────────────────────
    if (/^(ผู้ใช้|users)$/.test(lower)) {
        const snap = await db.collection("line_users").orderBy("followedAt", "desc").limit(5).get();
        if (snap.empty) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumError("ไม่พบข้อมูลผู้ใช้")] });
            return true;
        }

        const userRows = snap.docs.map((d, i) => {
            const u = d.data();
            const date = u.followedAt ? u.followedAt.toDate().toLocaleDateString("th-TH") : "-";
            const shortId = d.id.substring(0, 12) + "…";
            return {
                type: "box",
                layout: "vertical",
                paddingAll: "12px",
                backgroundColor: i % 2 === 0 ? "#FFFFFF05" : "#FFFFFF0D",
                cornerRadius: "8px",
                margin: "xs",
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                            { type: "text", text: u.displayName || "ไม่ระบุชื่อ", size: "sm", weight: "bold", color: COLORS.text, flex: 3, wrap: true },
                            { type: "text", text: date, size: "xxs", color: COLORS.textMuted, flex: 2, align: "end" },
                        ],
                    },
                    { type: "text", text: shortId, size: "xxs", color: COLORS.textMuted, margin: "xs" },
                ],
            };
        });

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "👥 ผู้ใช้ล่าสุด",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("👥", "ผู้ใช้ล่าสุด", `${snap.size} คน (เรียงตามวันที่ติดตาม)`, COLORS.successGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: userRows,
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            createPremiumButton("📊 ดูสถิติระบบ", { type: "message", label: "📊 ดูสถิติระบบ", text: "ระบบ" }, "primary", COLORS.primary),
                        ],
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 🏪 PREMIUM SELLERS LIST
    // ─────────────────────────────────────────
    if (/^(ร้านค้า|sellers)$/.test(lower)) {
        const snap = await db.collection("seller_profiles").orderBy("createdAt", "desc").limit(5).get();
        if (snap.empty) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumError("ยังไม่มีร้านค้า")] });
            return true;
        }

        const shopRows = snap.docs.map((d, i) => {
            const s = d.data();
            return {
                type: "box",
                layout: "vertical",
                paddingAll: "12px",
                backgroundColor: i % 2 === 0 ? "#FFFFFF05" : "#FFFFFF0D",
                cornerRadius: "8px",
                margin: "xs",
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                            { type: "text", text: "🏪", size: "md", flex: 0 },
                            { type: "text", text: s.shopName || "ไม่ระบุชื่อร้าน", size: "sm", weight: "bold", color: COLORS.text, flex: 3, margin: "sm", wrap: true },
                            { type: "text", text: `${s.totalProducts || 0} สินค้า`, size: "xxs", color: COLORS.success, flex: 2, align: "end" },
                        ],
                    },
                    { type: "text", text: `👤 ${s.displayName || "-"}`, size: "xxs", color: COLORS.textMuted, margin: "xs" },
                ],
            };
        });

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "🏪 ร้านค้าล่าสุด",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("🏪", "ร้านค้าล่าสุด", `${snap.size} ร้าน`, COLORS.secondaryGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: shopRows,
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 🛺 PREMIUM RIDERS STATUS
    // ─────────────────────────────────────────
    if (/^(ดูวิน|วินทั้งหมด|riders)$/.test(lower)) {
        const snap = await db.collection("win_riders").orderBy("isOnline", "desc").limit(10).get();
        if (snap.empty) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumError("ยังไม่มีวินลงทะเบียน")] });
            return true;
        }

        let online = 0;
        const riderRows = snap.docs.map((d) => {
            const r = d.data();
            if (r.isOnline) online++;
            return {
                type: "box",
                layout: "horizontal",
                paddingAll: "12px",
                backgroundColor: r.isOnline ? "#00E6760D" : "#FF3B3B0D",
                cornerRadius: "8px",
                margin: "xs",
                contents: [
                    { type: "text", text: r.isOnline ? "🟢" : "🔴", size: "md", flex: 0 },
                    {
                        type: "box",
                        layout: "vertical",
                        flex: 1,
                        margin: "sm",
                        contents: [
                            { type: "text", text: r.displayName || "วิน", size: "sm", color: COLORS.text, weight: "bold" },
                            { type: "text", text: r.stationName || r.stationId || "ไม่ระบุสถานี", size: "xxs", color: COLORS.textMuted },
                        ],
                    },
                    {
                        type: "text",
                        text: r.isOnline ? "Online" : "Offline",
                        size: "xxs",
                        color: r.isOnline ? COLORS.success : COLORS.error,
                        align: "end",
                        flex: 0,
                    },
                ],
            };
        });

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "🛺 สถานะวิน",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("🛺", "WIN Riders", `🟢 Online ${online} | 🔴 Offline ${snap.size - online}`, COLORS.purpleGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: riderRows,
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            {
                                type: "text",
                                text: online > 0 ? `✅ ${online} วินพร้อมให้บริการ` : "⚠️ ไม่มีวินออนไลน์ขณะนี้",
                                size: "xs",
                                color: online > 0 ? COLORS.success : COLORS.warning,
                                align: "center",
                            },
                        ],
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 🛒 PREMIUM ALL ORDERS
    // ─────────────────────────────────────────
    if (/^(ออเดอร์ทั้งหมด|all orders|allorders)$/.test(lower)) {
        const snap = await db.collection("product_orders").orderBy("createdAt", "desc").limit(5).get();
        if (snap.empty) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumError("ยังไม่มีออเดอร์")] });
            return true;
        }

        const statusColors = {
            completed: COLORS.success,
            shipped: COLORS.primary,
            pending: COLORS.warning,
            cancelled: COLORS.error,
        };

        const orderRows = snap.docs.map((d, i) => {
            const o = d.data();
            const id = "#" + d.id.substring(0, 8).toUpperCase();
            const amount = "฿" + parseFloat(o.totalAmount || 0).toLocaleString();
            const statusText = getOrderStatusText(o.status);
            const statusColor = statusColors[o.status] || COLORS.textMuted;
            return {
                type: "box",
                layout: "vertical",
                paddingAll: "12px",
                backgroundColor: i % 2 === 0 ? "#FFFFFF05" : "#FFFFFF0D",
                cornerRadius: "8px",
                margin: "xs",
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                            { type: "text", text: id, size: "xs", weight: "bold", color: COLORS.primary, flex: 2 },
                            { type: "text", text: amount, size: "xs", weight: "bold", color: COLORS.success, flex: 2, align: "center" },
                            { type: "text", text: statusText, size: "xxs", color: statusColor, flex: 2, align: "end" },
                        ],
                    },
                    { type: "text", text: o.productName || o.title || "สินค้า", size: "xxs", color: COLORS.textMuted, margin: "xs", wrap: true },
                ],
            };
        });

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "🛒 ออเดอร์ล่าสุด",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("🛒", "ออเดอร์ล่าสุด", `${snap.size} รายการ (ทั้งระบบ)`, COLORS.warningGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: orderRows,
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 🔍 PREMIUM USER LOOKUP
    // ─────────────────────────────────────────
    const userLookupMatch = text.match(/^user\s+(U[a-zA-Z0-9]+)/i);
    if (userLookupMatch) {
        const targetId = userLookupMatch[1];
        const snap = await db.collection("line_users").doc(targetId).get();
        if (!snap.exists) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumError(`ไม่พบผู้ใช้ ${targetId.substring(0, 16)}…`)] });
            return true;
        }
        const u = snap.data();
        const followDate = u.followedAt ? u.followedAt.toDate().toLocaleString("th-TH") : "-";
        const sub = u.subscription;

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: `👤 ${u.displayName || "User Info"}`,
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("👤", u.displayName || "ไม่ระบุชื่อ", "LINE User Profile", COLORS.blueGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                contents: [
                                    createStatCard("🆔", "User ID", targetId.substring(0, 16) + "…", COLORS.primary, `${COLORS.primary}10`),
                                    createStatCard("📅", "ติดตาม", followDate, COLORS.success, `${COLORS.success}10`),
                                ],
                            },
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                margin: "sm",
                                contents: [
                                    createStatCard("📱", "Source", u.source || "line", COLORS.secondary, `${COLORS.secondary}10`),
                                    createStatCard("🔄", "Status", u.status || "active", u.status === "unfollowed" ? COLORS.error : COLORS.success, `${COLORS.success}10`),
                                ],
                            },
                            ...(sub ? [{
                                type: "box",
                                layout: "vertical",
                                margin: "md",
                                paddingAll: "12px",
                                backgroundColor: "#8B5CF61A",
                                cornerRadius: "8px",
                                contents: [
                                    { type: "text", text: "💎 Premium", size: "xs", weight: "bold", color: COLORS.purple },
                                    { type: "text", text: `แผน: ${sub.plan || "-"} · สถานะ: ${sub.status || "-"}`, size: "xxs", color: COLORS.textMuted, margin: "xs" },
                                ],
                            }] : []),
                        ],
                    },
                    footer: {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            createPremiumButton("📌 ดู PIN", { type: "message", label: "📌 ดู PIN", text: `pin ${targetId}` }, "primary", COLORS.primary),
                            createPremiumButton("📤 ส่งข้อความ", { type: "message", label: "📤 ส่งข้อความ", text: `ส่ง ${targetId} สวัสดีครับ` }, "secondary"),
                        ],
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 🔑 PREMIUM PIN LOOKUP
    // ─────────────────────────────────────────
    const pinLookupMatch = text.match(/^pin\s+(U[a-zA-Z0-9]+)/i);
    if (pinLookupMatch) {
        const targetId = pinLookupMatch[1];
        const pinSnap = await db.collection("web_pins")
            .where("userId", "==", targetId).orderBy("createdAt", "desc").limit(1).get();

        if (pinSnap.empty) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumError(`ไม่พบ PIN ของ ${targetId.substring(0, 16)}…`)] });
            return true;
        }

        const p = pinSnap.docs[0].data();
        const created = p.createdAt ? p.createdAt.toDate().toLocaleString("th-TH") : "-";
        const expires = p.expiresAt ? p.expiresAt.toDate().toLocaleString("th-TH") : "-";
        const isExpired = p.expiresAt && p.expiresAt.toDate() < new Date();

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "🔑 PIN Info",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("🔑", "PIN Information", targetId.substring(0, 20) + "…", COLORS.purpleGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                paddingAll: "20px",
                                backgroundColor: "#00D2FF1A",
                                cornerRadius: "12px",
                                borderWidth: "1px",
                                borderColor: "#00D2FF4D",
                                contents: [{
                                    type: "text",
                                    text: p.pin ? p.pin.slice(0, 3) + "  " + p.pin.slice(3) : "--- ---",
                                    size: "3xl",
                                    weight: "bold",
                                    color: COLORS.primary,
                                    align: "center",
                                }],
                            },
                            createPremiumDivider(),
                            {
                                type: "box",
                                layout: "vertical",
                                spacing: "sm",
                                margin: "md",
                                contents: [
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            { type: "text", text: "📅 สร้างเมื่อ", size: "xs", color: COLORS.textMuted, flex: 1 },
                                            { type: "text", text: created, size: "xs", color: COLORS.text, align: "end" },
                                        ],
                                    },
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            { type: "text", text: "⏰ หมดอายุ", size: "xs", color: COLORS.textMuted, flex: 1 },
                                            { type: "text", text: expires, size: "xs", color: isExpired ? COLORS.error : COLORS.success, align: "end" },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 📤 PREMIUM SEND MESSAGE
    // ─────────────────────────────────────────
    const sendMatch = text.match(/^ส่ง\s+(U[a-zA-Z0-9]+)\s+(.+)/s);
    if (sendMatch) {
        const targetId = sendMatch[1];
        const sendMsg = sendMatch[2].trim();
        try {
            await tuktukClient.pushMessage({ to: targetId, messages: [{ type: "text", text: `📢 ข้อความจาก Admin TukTuk:\n\n${sendMsg}` }] });
            await tuktukClient.replyMessage({
                replyToken,
                messages: [{
                    type: "flex",
                    altText: "✅ ส่งข้อความสำเร็จ",
                    contents: {
                        type: "bubble",
                        size: "mega",
                        header: createPremiumHeader("✅", "ส่งข้อความสำเร็จ", targetId.substring(0, 20) + "…", COLORS.successGradient),
                        body: {
                            type: "box",
                            layout: "vertical",
                            paddingAll: "20px",
                            backgroundColor: COLORS.bg,
                            contents: [
                                {
                                    type: "box",
                                    layout: "vertical",
                                    paddingAll: "16px",
                                    backgroundColor: "#FFFFFF08",
                                    cornerRadius: "10px",
                                    borderWidth: "1px",
                                    borderColor: "#FFFFFF1A",
                                    contents: [
                                        { type: "text", text: "ข้อความที่ส่ง:", size: "xs", color: COLORS.textMuted },
                                        { type: "text", text: sendMsg, size: "sm", color: COLORS.text, margin: "sm", wrap: true },
                                    ],
                                },
                            ],
                        },
                    },
                }],
            });
        } catch (err) {
            await tuktukClient.replyMessage({ replyToken, messages: [createPremiumError(`ส่งไม่สำเร็จ: ${err.message.substring(0, 60)}`)] });
        }
        return true;
    }

    // ─────────────────────────────────────────
    // 📢 PREMIUM BROADCAST
    // ─────────────────────────────────────────
    const broadcastMatch = text.match(/^ส่งทุกคน\s+(.+)/s);
    if (broadcastMatch) {
        const broadcastMsg = broadcastMatch[1].trim();
        const countSnap = await db.collection("line_users").where("status", "==", "active").count().get();
        const totalCount = countSnap.data().count;

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "📢 Broadcast Preview",
                contents: {
                    type: "bubble",
                    size: "mega",
                    header: createPremiumHeader("📢", "Broadcast Preview", `${totalCount.toLocaleString()} คน`, COLORS.warningGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "horizontal",
                                margin: "sm",
                                contents: [
                                    { type: "text", text: "👥 ผู้รับ", size: "xs", color: COLORS.textMuted, flex: 1 },
                                    { type: "text", text: `${totalCount.toLocaleString()} คน`, size: "xs", weight: "bold", color: COLORS.primary, align: "end" },
                                ],
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                paddingAll: "16px",
                                margin: "md",
                                backgroundColor: "#FFFFFF08",
                                cornerRadius: "10px",
                                borderWidth: "1px",
                                borderColor: "#FFFFFF1A",
                                contents: [
                                    { type: "text", text: "ข้อความ:", size: "xs", color: COLORS.textMuted },
                                    { type: "text", text: broadcastMsg, size: "sm", color: COLORS.text, margin: "sm", wrap: true },
                                ],
                            },
                            {
                                type: "text",
                                text: "⚠️ Broadcast จำนวนมากต้องใช้ LINE Messaging API (rate limit 200/sec)",
                                size: "xxs",
                                color: COLORS.warning,
                                margin: "md",
                                wrap: true,
                            },
                        ],
                    },
                },
            }],
        });
        return true;
    }

    // ─────────────────────────────────────────
    // 🧪 TEST COMMANDS
    // ─────────────────────────────────────────
    if (/เทสต์\s*welcome|test\s*welcome/.test(lower)) {
        // Trigger follow handler directly so it sends the message using pushMessage
        await handleTuktukFollow({ source: { userId } }, tuktukClient);
        return true;
    }

    if (/เทสต์\s*login|test\s*login/.test(lower)) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [tuktukFlex.createLoginFlowFlex("marketplace")]
        });
        return true;
    }

    if (/เทสต์\s*menu|test\s*menu/.test(lower)) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [createPremiumMainMenu()]
        });
        return true;
    }

    return false;
}

// ============================================================
// 📋 PREMIUM MAIN MENU
// ============================================================
function createPremiumMainMenu() {
    return {
        type: "flex",
        altText: "🛺 TukTuk Thailand — เมนูหลัก",
        contents: {
            type: "bubble",
            size: "mega",
            header: createPremiumHeader("🛺", "TukTuk Thailand", "Super App ท้องถิ่น เพื่อคนไทย", COLORS.primaryGradient),
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                backgroundColor: COLORS.bg,
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        contents: [
                            createPremiumMenuButton("🛒", "ตลาด", "ตลาด", COLORS.primary),
                            createPremiumMenuButton("🛺", "วิน", "วิน", COLORS.secondary),
                        ],
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        margin: "sm",
                        contents: [
                            createPremiumMenuButton("📊", "สถิติ", "สถิติ", COLORS.success),
                            createPremiumMenuButton("📦", "ออเดอร์", "ออเดอร์", COLORS.warning),
                        ],
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        margin: "sm",
                        contents: [
                            createPremiumMenuButton("🔑", "รหัส", "รหัส", COLORS.purple),
                            createPremiumMenuButton("ℹ️", "เกี่ยวกับ", "เกี่ยวกับ", COLORS.blue),
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                backgroundColor: COLORS.bg,
                contents: [
                    createPremiumButton("🌐 เปิดเว็บ TukTuk", { type: "uri", label: "🌐 เปิดเว็บ TukTuk", uri: TUKTUK_BASE_URL }, "primary", COLORS.primary),
                ],
            },
        },
    };
}

function createPremiumMenuButton(icon, label, command, color) {
    return {
        type: "box",
        layout: "vertical",
        flex: 1,
        backgroundColor: `${color}20`,
        cornerRadius: "12px",
        paddingAll: "12px",
        action: { type: "message", label, text: command },
        contents: [
            { type: "text", text: icon, size: "xl", align: "center" },
            { type: "text", text: label, size: "xs", color: COLORS.text, align: "center", margin: "xs", wrap: true },
        ],
    };
}

// ============================================================
// 🛒 PREMIUM MARKETPLACE MENU
// ============================================================
async function handlePremiumMarketplaceMenu(replyToken, tuktukClient) {
    await tuktukClient.replyMessage({
        replyToken,
        messages: [{
            type: "flex",
            altText: "🛒 ตลาด TukTuk Thailand",
            contents: {
                type: "bubble",
                size: "mega",
                header: createPremiumHeader("🛒", "ตลาด TukTuk", "สินค้า SME และ OTOP จากคนไทย", COLORS.primaryGradient),
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        {
                            type: "text",
                            text: "🔍 ค้นหาสินค้า",
                            size: "sm",
                            weight: "bold",
                            color: COLORS.text,
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            paddingAll: "16px",
                            backgroundColor: "#FFFFFF08",
                            cornerRadius: "12px",
                            borderWidth: "1px",
                            borderColor: "#FFFFFF1A",
                            contents: [
                                { type: "text", text: "พิมพ์: หา [ชื่อสินค้า]", size: "xs", color: COLORS.textSecondary },
                                { type: "text", text: "เช่น: หา มะม่วงอบแห้ง", size: "xs", color: COLORS.primary, margin: "xs" },
                            ],
                        },
                        createPremiumDivider(),
                        {
                            type: "text",
                            text: "📂 หมวดหมู่สินค้า",
                            size: "sm",
                            weight: "bold",
                            color: COLORS.text,
                            margin: "md",
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            spacing: "sm",
                            margin: "xs",
                            contents: [
                                createCategoryChipPremium("🌾 เกษตร", "หา ผลิตภัณฑ์เกษตร"),
                                createCategoryChipPremium("🥘 อาหาร", "หา อาหาร"),
                                createCategoryChipPremium("👗 เสื้อผ้า", "หา เสื้อผ้า"),
                            ],
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            spacing: "sm",
                            margin: "xs",
                            contents: [
                                createCategoryChipPremium("🏠 ของใช้", "หา ของใช้"),
                                createCategoryChipPremium("🎁 ของฝาก", "หา OTOP"),
                                createCategoryChipPremium("🌿 สมุนไพร", "หา สมุนไพร"),
                            ],
                        },
                    ],
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        createPremiumButton("🌐 ดูตลาดทั้งหมด", { type: "uri", label: "🌐 ดูตลาดทั้งหมด", uri: `${TUKTUK_BASE_URL}/marketplace` }, "primary", COLORS.primary),
                        createPremiumButton("🏪 สมัครเปิดร้านค้า", { type: "message", label: "🏪 สมัครเปิดร้านค้า", text: "สมัครขาย" }, "secondary"),
                    ],
                },
            },
        }],
    });
}

function createCategoryChipPremium(label, command) {
    return {
        type: "box",
        layout: "vertical",
        flex: 1,
        backgroundColor: "#FFFFFF0D",
        cornerRadius: "8px",
        paddingAll: "8px",
        action: { type: "message", label, text: command },
        contents: [
            { type: "text", text: label, size: "xs", align: "center", color: COLORS.text, wrap: true },
        ],
    };
}

// ============================================================
// 🔍 PREMIUM BUYER SEARCH
// ============================================================
async function handlePremiumBuyerSearch(query, replyToken, tuktukClient, db) {
    console.log(`🔍 Buyer search: "${query}"`);
    const products = [];
    const queryLower = query.toLowerCase();

    try {
        const snap = await db.collection("marketplace_items")
            .where("status", "==", "active")
            .limit(30)
            .get();

        snap.docs.forEach(doc => {
            const data = doc.data();
            const name = (data.productName || data.title || "").toLowerCase();
            const desc = (data.description || "").toLowerCase();
            if (name.includes(queryLower) || desc.includes(queryLower)) {
                products.push({ id: doc.id, ...data });
            }
        });
    } catch (error) {
        console.error("Search error:", error);
    }

    if (products.length === 0) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "🔍 ไม่พบสินค้า",
                contents: {
                    type: "bubble",
                    size: "nano",
                    body: {
                        type: "box",
                        layout: "horizontal",
                        paddingAll: "16px",
                        backgroundColor: "#FFFFFF08",
                        cornerRadius: "12px",
                        borderWidth: "1px",
                        borderColor: "#FFFFFF1A",
                        contents: [
                            { type: "text", text: "🔍", size: "xl", flex: 0 },
                            { type: "text", text: `ไม่พบสินค้า "${query}"`, size: "sm", color: COLORS.textSecondary, margin: "md", wrap: true, flex: 1 },
                        ],
                    },
                },
            }],
        });
        return;
    }

    const bubbles = products.slice(0, 10).map(p => {
        const name = p.productName || p.title || "สินค้า";
        const price = parseFloat(p.price || 0);
        const stock = parseInt(p.stock || p.productStock || 0);
        const image = (p.imageUrl || p.images?.[0] || "").substring(0, 2000);

        return {
            type: "bubble",
            size: "micro",
            ...(image ? {
                hero: {
                    type: "image",
                    url: image,
                    size: "full",
                    aspectRatio: "20:13",
                    aspectMode: "cover",
                },
            } : {}),
            body: {
                type: "box",
                layout: "vertical",
                spacing: "xs",
                paddingAll: "12px",
                backgroundColor: COLORS.bg,
                contents: [
                    { type: "text", text: name, weight: "bold", size: "sm", wrap: true, maxLines: 2, color: COLORS.text },
                    { type: "text", text: `฿${price.toLocaleString()}`, size: "lg", color: COLORS.primary, weight: "bold", margin: "xs" },
                    stock > 0
                        ? { type: "text", text: `สต็อก: ${stock} ชิ้น`, size: "xxs", color: COLORS.success }
                        : { type: "text", text: "หมดสต็อก", size: "xxs", color: COLORS.error },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "8px",
                contents: [{
                    type: "button",
                    style: "primary",
                    color: COLORS.primary,
                    action: { type: "uri", label: "ดูสินค้า", uri: `${TUKTUK_BASE_URL}/product?id=${p.id}` },
                }],
            },
        };
    });

    await tuktukClient.replyMessage({
        replyToken,
        messages: [
            {
                type: "flex",
                altText: `🔍 พบ ${products.length} รายการ`,
                contents: {
                    type: "bubble",
                    size: "nano",
                    body: {
                        type: "box",
                        layout: "horizontal",
                        paddingAll: "12px",
                        backgroundColor: "#00D2FF1A",
                        cornerRadius: "12px",
                        contents: [
                            { type: "text", text: "🔍", size: "lg", flex: 0 },
                            { type: "text", text: `พบ ${products.length} รายการสำหรับ "${query}"`, size: "xs", color: COLORS.primary, margin: "sm", flex: 1 },
                        ],
                    },
                },
            },
            {
                type: "flex",
                altText: `สินค้า: ${query}`,
                contents: { type: "carousel", contents: bubbles },
            },
        ],
    });
}

// ============================================================
// 🌟 PREMIUM OTOP SHOWCASE
// ============================================================
async function handlePremiumOtopShowcase(replyToken, tuktukClient, db) {
    let featuredProducts = [];
    try {
        const snap = await db.collection("marketplace_items")
            .where("status", "==", "active")
            .where("isOtop", "==", true)
            .limit(6)
            .get();

        if (snap.empty) {
            const fallback = await db.collection("marketplace_items")
                .where("status", "==", "active")
                .orderBy("createdAt", "desc")
                .limit(6)
                .get();
            fallback.docs.forEach(d => featuredProducts.push({ id: d.id, ...d.data() }));
        } else {
            snap.docs.forEach(d => featuredProducts.push({ id: d.id, ...d.data() }));
        }
    } catch (error) {
        console.error("OTOP fetch error:", error);
    }

    if (featuredProducts.length === 0) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "🌟 สินค้า OTOP",
                contents: {
                    type: "bubble",
                    size: "nano",
                    body: {
                        type: "box",
                        layout: "horizontal",
                        paddingAll: "16px",
                        backgroundColor: "#FFFFFF08",
                        cornerRadius: "12px",
                        contents: [
                            { type: "text", text: "🌟", size: "xl", flex: 0 },
                            { type: "text", text: "ยังไม่มีสินค้า OTOP ในระบบ", size: "sm", color: COLORS.textSecondary, margin: "md", wrap: true, flex: 1 },
                        ],
                    },
                },
            }],
        });
        return;
    }

    const bubbles = featuredProducts.map(p => {
        const name = p.productName || p.title || "สินค้า";
        const price = parseFloat(p.price || 0);
        return {
            type: "bubble",
            size: "micro",
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "12px",
                backgroundColor: COLORS.bg,
                contents: [
                    { type: "text", text: "🌟 OTOP", size: "xxs", color: COLORS.warning, weight: "bold" },
                    { type: "text", text: name, weight: "bold", size: "sm", wrap: true, maxLines: 2, color: COLORS.text, margin: "xs" },
                    { type: "text", text: `฿${price.toLocaleString()}`, size: "lg", color: COLORS.primary, weight: "bold", margin: "xs" },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "8px",
                contents: [{
                    type: "button",
                    style: "primary",
                    color: COLORS.warning,
                    action: { type: "uri", label: "ดูสินค้า", uri: `${TUKTUK_BASE_URL}/product?id=${p.id}` },
                }],
            },
        };
    });

    await tuktukClient.replyMessage({
        replyToken,
        messages: [
            { type: "text", text: "🌟 สินค้า OTOP และของดีท้องถิ่น" },
            { type: "flex", altText: "สินค้า OTOP", contents: { type: "carousel", contents: bubbles } },
        ],
    });
}

// ============================================================
// 🛺 PREMIUM WIN RIDER MENU
// ============================================================
async function handlePremiumWinRiderMenu(replyToken, tuktukClient) {
    await tuktukClient.replyMessage({
        replyToken,
        messages: [{
            type: "flex",
            altText: "🛺 WIN Rider — วินมอเตอร์ไซค์ดิจิทัล",
            contents: {
                type: "bubble",
                size: "mega",
                header: createPremiumHeader("🛺", "WIN Rider", "วินมอเตอร์ไซค์ดิจิทัล — เร็ว ปลอดภัย", COLORS.secondaryGradient),
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        {
                            type: "box",
                            layout: "horizontal",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "vertical",
                                    flex: 1,
                                    backgroundColor: "#00D2FF1A",
                                    cornerRadius: "12px",
                                    paddingAll: "12px",
                                    contents: [
                                        { type: "text", text: "⚡", size: "xl", align: "center" },
                                        { type: "text", text: "เร็ว", weight: "bold", size: "sm", align: "center", color: COLORS.primary },
                                        { type: "text", text: "รับงานทันที", size: "xxs", align: "center", color: COLORS.textMuted },
                                    ],
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    flex: 1,
                                    backgroundColor: "#00E6761A",
                                    cornerRadius: "12px",
                                    paddingAll: "12px",
                                    contents: [
                                        { type: "text", text: "🛡️", size: "xl", align: "center" },
                                        { type: "text", text: "ปลอดภัย", weight: "bold", size: "sm", align: "center", color: COLORS.success },
                                        { type: "text", text: "วินตรวจสอบแล้ว", size: "xxs", align: "center", color: COLORS.textMuted },
                                    ],
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    flex: 1,
                                    backgroundColor: "#FF6B2B1A",
                                    cornerRadius: "12px",
                                    paddingAll: "12px",
                                    contents: [
                                        { type: "text", text: "💰", size: "xl", align: "center" },
                                        { type: "text", text: "ราคาธรรม", weight: "bold", size: "sm", align: "center", color: COLORS.secondary },
                                        { type: "text", text: "ตามมิเตอร์จริง", size: "xxs", align: "center", color: COLORS.textMuted },
                                    ],
                                },
                            ],
                        },
                        createPremiumDivider(),
                        {
                            type: "text",
                            text: "📍 วิธีใช้งาน WIN Rider",
                            size: "sm",
                            weight: "bold",
                            color: COLORS.text,
                            margin: "md",
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            paddingAll: "16px",
                            backgroundColor: "#FFFFFF08",
                            cornerRadius: "12px",
                            contents: [
                                { type: "text", text: "1. เปิดแอป TukTuk Thailand", size: "xs", color: COLORS.textSecondary },
                                { type: "text", text: "2. กดปุ่ม \"เรียกวิน\"", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                                { type: "text", text: "3. ระบุจุดรับและจุดส่ง", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                                { type: "text", text: "4. ยืนยันราคา → วินรับงาน", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                            ],
                        },
                    ],
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        createPremiumButton("🛺 เรียกวินผ่านแอป", { type: "uri", label: "🛺 เรียกวินผ่านแอป", uri: `${TUKTUK_BASE_URL}/win-service` }, "primary", COLORS.secondary),
                        createPremiumButton("🏍️ สมัครเป็นคนขับวิน", { type: "message", label: "🏍️ สมัครเป็นคนขับวิน", text: "สมัครวิน" }, "secondary"),
                    ],
                },
            },
        }],
    });
}

async function handlePremiumWinRiderRegister(replyToken, tuktukClient) {
    await tuktukClient.replyMessage({
        replyToken,
        messages: [{
            type: "flex",
            altText: "🏍️ สมัครเป็นวิน WIN Rider",
            contents: {
                type: "bubble",
                header: createPremiumHeader("🏍️", "สมัคร WIN Rider", "รายได้เสริม ทำงานอิสระ", COLORS.successGradient),
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        {
                            type: "text",
                            text: "📋 คุณสมบัติเบื้องต้น",
                            size: "sm",
                            weight: "bold",
                            color: COLORS.text,
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            paddingAll: "16px",
                            backgroundColor: "#FFFFFF08",
                            cornerRadius: "12px",
                            contents: [
                                { type: "text", text: "• มีรถมอเตอร์ไซค์เป็นของตัวเอง", size: "xs", color: COLORS.textSecondary },
                                { type: "text", text: "• มีใบขับขี่ประเภทที่ 1 ขึ้นไป", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                                { type: "text", text: "• อายุ 18-65 ปี", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                                { type: "text", text: "• สมาร์ทโฟนที่ใช้งานได้", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                            ],
                        },
                        createPremiumDivider(),
                        {
                            type: "text",
                            text: "💵 รายได้โดยประมาณ",
                            size: "sm",
                            weight: "bold",
                            color: COLORS.text,
                            margin: "md",
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            paddingAll: "16px",
                            backgroundColor: "#00E6761A",
                            cornerRadius: "12px",
                            contents: [
                                { type: "text", text: "💰", size: "xl", flex: 0 },
                                { type: "text", text: "300-800 บาท/วัน", size: "lg", weight: "bold", color: COLORS.success, margin: "sm", flex: 1 },
                            ],
                        },
                    ],
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        createPremiumButton("📝 สมัครออนไลน์", { type: "uri", label: "📝 สมัครออนไลน์", uri: `${TUKTUK_BASE_URL}/win-rider-register` }, "primary", COLORS.success),
                    ],
                },
            },
        }],
    });
}

// ============================================================
// 🏪 PREMIUM SELLER ONBOARDING
// ============================================================
async function handlePremiumSellerOnboarding(replyToken, tuktukClient) {
    await tuktukClient.replyMessage({
        replyToken,
        messages: [{
            type: "flex",
            altText: "🏪 เปิดร้านค้าบน TukTuk Thailand",
            contents: {
                type: "bubble",
                header: createPremiumHeader("🏪", "เปิดร้านค้า TukTuk", "ขายของออนไลน์ ต้นทุนต่ำ", COLORS.successGradient),
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        {
                            type: "box",
                            layout: "horizontal",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "vertical",
                                    flex: 1,
                                    backgroundColor: "#00E6761A",
                                    cornerRadius: "8px",
                                    paddingAll: "8px",
                                    contents: [
                                        { type: "text", text: "✅", size: "lg", align: "center" },
                                        { type: "text", text: "ฟรี", size: "xs", align: "center", color: COLORS.success },
                                    ],
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    flex: 1,
                                    backgroundColor: "#00D2FF1A",
                                    cornerRadius: "8px",
                                    paddingAll: "8px",
                                    contents: [
                                        { type: "text", text: "📱", size: "lg", align: "center" },
                                        { type: "text", text: "ผ่าน LINE", size: "xs", align: "center", color: COLORS.primary },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "box",
                            layout: "horizontal",
                            spacing: "sm",
                            margin: "xs",
                            contents: [
                                {
                                    type: "box",
                                    layout: "vertical",
                                    flex: 1,
                                    backgroundColor: "#FF6B2B1A",
                                    cornerRadius: "8px",
                                    paddingAll: "8px",
                                    contents: [
                                        { type: "text", text: "🚚", size: "lg", align: "center" },
                                        { type: "text", text: "จัดส่ง", size: "xs", align: "center", color: COLORS.secondary },
                                    ],
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    flex: 1,
                                    backgroundColor: "#8B5CF61A",
                                    cornerRadius: "8px",
                                    paddingAll: "8px",
                                    contents: [
                                        { type: "text", text: "💳", size: "lg", align: "center" },
                                        { type: "text", text: "รับชำระ", size: "xs", align: "center", color: COLORS.purple },
                                    ],
                                },
                            ],
                        },
                        createPremiumDivider(),
                        {
                            type: "text",
                            text: "🚀 เริ่มต้นง่าย 3 ขั้นตอน",
                            size: "sm",
                            weight: "bold",
                            color: COLORS.text,
                            margin: "md",
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            paddingAll: "16px",
                            backgroundColor: "#FFFFFF08",
                            cornerRadius: "12px",
                            contents: [
                                { type: "text", text: "1️⃣ ลงทะเบียนผ่านเว็บไซต์", size: "xs", color: COLORS.textSecondary },
                                { type: "text", text: "2️⃣ ตั้งค่าร้านและเพิ่มสินค้า", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                                { type: "text", text: "3️⃣ รับออเดอร์ผ่าน LINE ทันที!", size: "xs", color: COLORS.textSecondary, margin: "xs" },
                            ],
                        },
                    ],
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        createPremiumButton("🏪 สมัครเปิดร้านเลย", { type: "uri", label: "🏪 สมัครเปิดร้านเลย", uri: `${TUKTUK_BASE_URL}/register` }, "primary", COLORS.success),
                    ],
                },
            },
        }],
    });
}

// ============================================================
// 📦 PREMIUM ORDERS LIST
// ============================================================
async function handlePremiumOrdersList(userId, replyToken, tuktukClient, db) {
    const orders = await getRecentOrders(userId, 5);

    if (orders.length === 0) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "📋 ยังไม่มีออเดอร์",
                contents: {
                    type: "bubble",
                    size: "nano",
                    body: {
                        type: "box",
                        layout: "horizontal",
                        paddingAll: "16px",
                        backgroundColor: "#FFFFFF08",
                        cornerRadius: "12px",
                        contents: [
                            { type: "text", text: "📋", size: "xl", flex: 0 },
                            { type: "text", text: "ยังไม่มีออเดอร์", size: "sm", color: COLORS.textSecondary, margin: "md", flex: 1 },
                        ],
                    },
                },
            }],
        });
        return;
    }

    let orderText = "📋 ออเดอร์ล่าสุด 5 รายการ\n\n";
    orders.forEach((order, i) => {
        const id = order.id.substring(0, 8).toUpperCase();
        const name = order.productName || order.title || "สินค้า";
        const amount = parseFloat(order.totalAmount || 0);
        const status = getOrderStatusText(order.status);
        orderText += `${i + 1}. #${id}\n   📦 ${name}\n   ฿${amount.toLocaleString()} · ${status}\n\n`;
    });

    await tuktukClient.replyMessage({
        replyToken,
        messages: [
            { type: "text", text: orderText },
            {
                type: "flex",
                altText: "ตัวเลือกเพิ่มเติม",
                contents: {
                    type: "bubble",
                    size: "nano",
                    body: {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        paddingAll: "12px",
                        backgroundColor: COLORS.surface,
                        cornerRadius: "12px",
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                flex: 1,
                                action: { type: "uri", label: "🌐 ดูทั้งหมด", uri: `${TUKTUK_BASE_URL}/seller-dashboard` },
                                contents: [
                                    { type: "text", text: "🌐", size: "xl", align: "center" },
                                    { type: "text", text: "ดูทั้งหมด", size: "xxs", color: COLORS.textSecondary, align: "center" },
                                ],
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                flex: 1,
                                action: { type: "message", label: "📊 สถิติ", text: "สถิติ" },
                                contents: [
                                    { type: "text", text: "📊", size: "xl", align: "center" },
                                    { type: "text", text: "สถิติ", size: "xxs", color: COLORS.textSecondary, align: "center" },
                                ],
                            },
                        ],
                    },
                },
            },
        ],
    });
}

// ============================================================
// 🔑 PREMIUM PIN REQUEST
// ============================================================
async function handlePremiumPinRequest(userId, replyToken, tuktukClient, db, isSuperAdmin) {
    const userRef = db.collection("line_users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists && !isSuperAdmin) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "ลงทะเบียน TukTuk Thailand",
                contents: {
                    type: "bubble",
                    header: createPremiumHeader("⚠️", "ยังไม่ได้ลงทะเบียน", "กรุณาลงทะเบียนก่อน", COLORS.warningGradient),
                    body: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            {
                                type: "text",
                                text: "กรุณาลงทะเบียนก่อนขอรหัสเข้าใช้งาน",
                                size: "sm",
                                color: COLORS.textSecondary,
                                wrap: true,
                            },
                        ],
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: COLORS.bg,
                        contents: [
                            createPremiumButton("📝 ลงทะเบียนเลย", { type: "uri", label: "📝 ลงทะเบียนเลย", uri: `${TUKTUK_BASE_URL}/register` }, "primary", COLORS.primary),
                        ],
                    },
                },
            }],
        });
        return;
    }

    const userData = userSnap.data() || {};
    const lastPin = userData.lastPinRequestAt ? userData.lastPinRequestAt.toDate() : null;
    const now = new Date();

    // ── ✅ PAYMENT GATE — ต้องเปิดร้าน/อัปเกรดแพ็กเกจก่อนขอรหัส ────────────
    const hasShopAccess = isSuperAdmin
        || userData.isAdmin === true
        || userData.isPremium === true
        || userData.sellerStatus === "verified"
        || ["active", "active_team", "approved"].includes(userData.subscriptionStatus || "");

    if (!hasShopAccess) {
        const subStatus = userData.subscriptionStatus || "none";
        let flexContent;

        if (subStatus === "slip_uploaded") {
            // จ่ายแล้ว รอแอดมินอนุมัติ
            flexContent = {
                type: "bubble",
                size: "mega",
                header: createPremiumHeader("⏳", "รอการอนุมัติ", "แอดมินกำลังตรวจสอบการชำระเงินของคุณ", COLORS.warningGradient),
                body: {
                    type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: COLORS.bg, spacing: "sm",
                    contents: [
                        { type: "text", text: "✅ ได้รับสลิปการชำระเงินแล้ว", weight: "bold", color: COLORS.warning, size: "sm" },
                        { type: "text", text: "แอดมินจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง หลังอนุมัติแล้วสามารถขอรหัสเข้าระบบได้ทันที", size: "xs", color: COLORS.textSecondary, wrap: true, margin: "sm" },
                    ],
                },
                footer: {
                    type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: COLORS.bg,
                    contents: [
                        createPremiumButton("💬 ติดต่อแอดมิน", { type: "uri", label: "💬 ติดต่อแอดมิน", uri: "https://lin.ee/1YJsw47" }, "secondary"),
                    ],
                },
            };
        } else if (subStatus === "package_selected") {
            // เลือกแพ็กเกจแล้ว ยังไม่จ่าย
            const pkg = userData.selectedPackage || "แพ็กเกจที่เลือก";
            const price = userData.packagePrice ? `${userData.packagePrice} บาท` : "";
            flexContent = {
                type: "bubble",
                size: "mega",
                header: createPremiumHeader("💳", "รอการชำระเงิน", `เลือกแพ็กเกจ ${pkg} แล้ว`, COLORS.secondaryGradient),
                body: {
                    type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: COLORS.bg, spacing: "sm",
                    contents: [
                        { type: "text", text: `กรุณาชำระเงิน${price ? " " + price : ""}`, weight: "bold", color: COLORS.secondary, size: "sm" },
                        { type: "text", text: "โอนตามข้อมูลที่ได้รับ แล้วถ่ายรูปสลิปส่งในแชทนี้ทันที", size: "xs", color: COLORS.textSecondary, wrap: true, margin: "sm" },
                        { type: "separator", margin: "md", color: "#FFFFFF1A" },
                        { type: "text", text: "📌 ส่งสลิปในแชทนี้หลังโอนเงิน เพื่อรับรหัสเข้าระบบ", size: "xs", color: COLORS.textMuted, align: "center", margin: "sm", wrap: true },
                    ],
                },
                footer: {
                    type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: COLORS.bg,
                    contents: [
                        createPremiumButton("📋 ดูข้อมูลการชำระเงินอีกครั้ง", { type: "message", label: "ดูข้อมูล", text: "วิธีชำระเงิน" }, "primary", COLORS.secondary),
                    ],
                },
            };
        } else {
            // ยังไม่ได้สมัคร — Upsell เปิดร้าน
            flexContent = {
                type: "bubble",
                size: "mega",
                header: createPremiumHeader("🏪", "เปิดร้านค้าออนไลน์", "รหัสสำหรับสมาชิกร้านค้าเท่านั้น", ["#06C755", "#04a545"]),
                body: {
                    type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: COLORS.bg, spacing: "sm",
                    contents: [
                        { type: "text", text: "สิทธิ์ที่ได้รับเมื่อเปิดร้าน", weight: "bold", color: COLORS.text, size: "sm" },
                        { type: "separator", margin: "sm", color: "#FFFFFF1A" },
                        ...[
                            ["🛍️", "จัดการสินค้าและคำสั่งซื้อ"],
                            ["📊", "ดูรายงานยอดขายและสถิติ"],
                            ["🤖", "AI ช่วยเขียนคำอธิบายสินค้า"],
                            ["♾️", "เพิ่มสินค้าได้ไม่จำกัด"],
                        ].map(([icon, text]) => ({
                            type: "box", layout: "horizontal", margin: "sm",
                            contents: [
                                { type: "text", text: icon, size: "sm", flex: 0 },
                                { type: "text", text, size: "sm", color: COLORS.textSecondary, margin: "sm", flex: 1 },
                            ],
                        })),
                        { type: "separator", margin: "md", color: "#FFFFFF1A" },
                        {
                            type: "box", layout: "horizontal", margin: "md",
                            contents: [
                                { type: "text", text: "เริ่มต้นเพียง", size: "xs", color: COLORS.textMuted, flex: 1 },
                                { type: "text", text: "99 ฿/เดือน", size: "lg", weight: "bold", color: "#06C755", align: "end", flex: 0 },
                            ],
                        },
                    ],
                },
                footer: {
                    type: "box", layout: "vertical", paddingAll: "20px", backgroundColor: COLORS.bg, spacing: "sm",
                    contents: [
                        createPremiumButton("🏪 สมัครเปิดร้านเลย", { type: "message", label: "สมัครเปิดร้าน", text: "สมัครเปิดร้าน" }, "primary", "#06C755"),
                        createPremiumButton("📦 ดูแพ็กเกจทั้งหมด", { type: "message", label: "ดูแพ็กเกจ", text: "แพ็กเกจ" }, "secondary"),
                    ],
                },
            };
        }

        await tuktukClient.replyMessage({
            replyToken,
            messages: [{ type: "flex", altText: "🏪 สมัครเปิดร้านเพื่อขอรหัสเข้าระบบ", contents: flexContent }],
        });
        return;
    }
    // ── END PAYMENT GATE ─────────────────────────────────────────────────────

    if (!isSuperAdmin && lastPin && (now - lastPin) < 24 * 60 * 60 * 1000) {
        const next = new Date(lastPin.getTime() + 24 * 60 * 60 * 1000);
        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "flex",
                altText: "⏳ ขอรหัสอีกครั้ง",
                contents: {
                    type: "bubble",
                    size: "nano",
                    body: {
                        type: "box",
                        layout: "horizontal",
                        paddingAll: "16px",
                        backgroundColor: "#FF6B2B1A",
                        cornerRadius: "12px",
                        borderWidth: "1px",
                        borderColor: "#FF6B2B4D",
                        contents: [
                            { type: "text", text: "⏳", size: "xl", flex: 0 },
                            { type: "text", text: `ขอใหม่ได้ ${next.toLocaleTimeString("th-TH")} น.`, size: "xs", color: COLORS.secondary, margin: "sm", flex: 1 },
                        ],
                    },
                },
            }],
        });
        return;
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.collection("web_pins").doc(pin).set({
        pin, userId,
        displayName: userData.displayName || "User",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
        used: false,
        source: "tuktuk",
    });

    await userRef.set({
        lineUserId: userId,
        lastPinRequestAt: FieldValue.serverTimestamp(),
        totalPinRequests: FieldValue.increment(1),
    }, { merge: true });

    // Generate one-time magic login token (10 min TTL)
    const magicToken = crypto.randomBytes(20).toString("hex");
    await getFirestore().collection("line_auto_tokens").doc(magicToken).set({
        lineUserId: userId,
        displayName: userData.displayName || "",
        pictureUrl: userData.pictureUrl || "",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        used: false,
    });
    const magicLoginUrl = `${TUKTUK_BASE_URL}/login.html?t=${magicToken}`;

    await tuktukClient.replyMessage({
        replyToken,
        messages: [{
            type: "flex",
            altText: "🔑 รหัสเข้าใช้งานของคุณ",
            contents: {
                type: "bubble",
                size: "mega",
                header: createPremiumHeader("🔑", "รหัสเข้าใช้งาน", "ใช้สำหรับเข้าสู่ระบบเว็บไซต์", COLORS.purpleGradient),
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        {
                            type: "box",
                            layout: "vertical",
                            paddingAll: "30px",
                            backgroundColor: "#8B5CF61A",
                            cornerRadius: "16px",
                            borderWidth: "2px",
                            borderColor: "#8B5CF64D",
                            contents: [{
                                type: "text",
                                text: pin.slice(0, 3) + "  " + pin.slice(3),
                                size: "3xl",
                                weight: "bold",
                                color: COLORS.purple,
                                align: "center",
                            }],
                        },
                        {
                            type: "text",
                            text: `⏰ หมดอายุ: ${expiresAt.toLocaleTimeString("th-TH")} น.`,
                            size: "xs",
                            color: COLORS.textMuted,
                            align: "center",
                        },
                        {
                            type: "separator",
                            margin: "md",
                            color: "#FFFFFF1A",
                        },
                        {
                            type: "text",
                            text: "หรือแตะปุ่มด้านล่างเพื่อเข้าระบบอัตโนมัติ (ไม่ต้องกรอกรหัส)",
                            size: "xs",
                            color: COLORS.textMuted,
                            align: "center",
                            wrap: true,
                            margin: "md",
                        },
                    ],
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    paddingAll: "20px",
                    backgroundColor: COLORS.bg,
                    contents: [
                        createPremiumButton("⚡ เข้าระบบอัตโนมัติ (แนะนำ)", { type: "uri", label: "⚡ เข้าระบบอัตโนมัติ", uri: magicLoginUrl }, "primary", COLORS.purple),
                        createPremiumButton("🌐 ไปที่เว็บไซต์", { type: "uri", label: "🌐 ไปที่เว็บไซต์", uri: TUKTUK_BASE_URL }, "secondary"),
                    ],
                },
            },
        }],
    });
    console.log(`✅ PIN ${pin} + magic token generated for ${userId}`);
}

// ============================================================
// 📷 IMAGE MESSAGE HANDLER
// ============================================================
async function handleImageMessage(event, tuktukClient) {
    const userId = event.source.userId;
    const replyToken = event.replyToken;
    console.log(`📷 Image received from ${userId} (Gemini disabled for TukTuk)`);

    try {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [{
                type: "text",
                text: "📷 ได้รับรูปภาพเรียบร้อยแล้วครับ\n\nหากเป็นสลิปโอนเงิน แอดมินจะตรวจสอบและยืนยันให้เร็วที่สุดครับ 🙏"
            }],
        });
    } catch (error) {
        console.error("❌ Image handling error:", error);
    }
}

// ============================================================
// ℹ️ PREMIUM ABOUT FLEX
// ============================================================
function createPremiumAbout() {
    return {
        type: "flex",
        altText: "ℹ️ ศูนย์ช่วยเหลือและข้อมูล TukTuk Thailand",
        contents: {
            type: "bubble",
            size: "mega",
            header: createPremiumHeader("🇹🇭", "TukTuk Thailand", "Super App ที่ดีที่สุดเพื่อคนไทย", COLORS.primaryGradient),
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                backgroundColor: COLORS.bg,
                contents: [
                    {
                        type: "text",
                        text: "แอปพลิเคชันที่รวบรวมทุกบริการเพื่อยกระดับชีวิตคนไทย! ครอบคลุมทั้งตลาดออนไลน์และบริการขนส่งท้องถิ่น ใช้งานง่าย ครบจบในที่เดียว 🚀",
                        size: "sm",
                        color: COLORS.text,
                        wrap: true,
                        weight: "bold"
                    },
                    createPremiumDivider(),
                    {
                        type: "text",
                        text: "🎯 หมวดหมู่การใช้งาน",
                        size: "sm",
                        weight: "bold",
                        color: COLORS.primary,
                        margin: "md",
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                flex: 1,
                                backgroundColor: "#00E6761A",
                                cornerRadius: "8px",
                                paddingAll: "12px",
                                action: { type: "message", label: "ตลาด", text: "ตลาด" },
                                contents: [
                                    { type: "text", text: "🛒", size: "lg", align: "center" },
                                    { type: "text", text: "ช้อปปิ้ง", size: "xs", align: "center", color: COLORS.success, weight: "bold", margin: "sm" }
                                ]
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                flex: 1,
                                backgroundColor: "#FF6B2B1A",
                                cornerRadius: "8px",
                                paddingAll: "12px",
                                action: { type: "message", label: "วิน", text: "วิน" },
                                contents: [
                                    { type: "text", text: "🛺", size: "lg", align: "center" },
                                    { type: "text", text: "เรียกวิน", size: "xs", align: "center", color: COLORS.secondary, weight: "bold", margin: "sm" }
                                ]
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                flex: 1,
                                backgroundColor: "#8B5CF61A",
                                cornerRadius: "8px",
                                paddingAll: "12px",
                                action: { type: "message", label: "สมัครขาย", text: "สมัครขาย" },
                                contents: [
                                    { type: "text", text: "🏪", size: "lg", align: "center" },
                                    { type: "text", text: "เปิดร้าน", size: "xs", align: "center", color: COLORS.purple, weight: "bold", margin: "sm" }
                                ]
                            }
                        ]
                    },
                    createPremiumDivider(),
                    {
                        type: "text",
                        text: "📖 คู่มือและคำอธิบาย (FAQ)",
                        size: "sm",
                        weight: "bold",
                        color: COLORS.text,
                        margin: "md",
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "16px",
                        backgroundColor: "#FFFFFF08",
                        cornerRadius: "12px",
                        contents: [
                            { type: "text", text: "• สถิติร้านค้า — พิมพ์ [สถิติ]", size: "xs", color: COLORS.textSecondary },
                            { type: "text", text: "• ดูรายการออเดอร์ — พิมพ์ [ออเดอร์]", size: "xs", color: COLORS.textSecondary, margin: "md" },
                            { type: "text", text: "• ขอ PIN เข้าเว็บแอป — พิมพ์ [รหัส]", size: "xs", color: COLORS.textSecondary, margin: "md" },
                            { type: "text", text: "• การค้นหา — พิมพ์ หา [ตามด้วยชื่อที่ต้องการ]", size: "xs", color: COLORS.textSecondary, margin: "md" },
                        ],
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        paddingAll: "12px",
                        backgroundColor: "#00D2FF1A",
                        cornerRadius: "8px",
                        contents: [
                            { type: "text", text: "💡 เคล็ดลับ AI: พิมพ์คำถามหรือสิ่งที่คุณต้องการให้ระบบเราช่วยเหลือได้เลย AI ของเราพร้อมตอบกลับคุณทันที!", size: "xs", color: COLORS.primary, wrap: true }
                        ]
                    }
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                paddingAll: "20px",
                backgroundColor: COLORS.bg,
                contents: [
                    createPremiumButton("🌐 เข้าสู่เว็บไซต์หลัก (แนะนำ)", { type: "uri", label: "🌐 เข้าสู่แพลตฟอร์ม", uri: TUKTUK_BASE_URL }, "primary", COLORS.primary),
                    createPremiumButton("💬 ติดต่อสอบถามทีมประสานงาน", { type: "uri", label: "💬 ติดต่อทีมงาน", uri: "https://lin.ee/1YJsw47" }, "secondary"),
                ],
            },
        },
    };
}

// ============================================================
// 📊 PREMIUM DASHBOARD
// ============================================================
function createPremiumDashboard(stats) {
    const { totalProducts = 0, activeProducts = 0, monthlySales = 0, totalViews = 0 } = stats;
    const activePercentage = totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0;

    return {
        type: "flex",
        altText: "📊 สถิติร้านค้า",
        contents: {
            type: "bubble",
            size: "mega",
            header: createPremiumHeader("📊", "สถิติร้านค้า", "ภาพรวมธุรกิจของคุณ", COLORS.successGradient),
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                paddingAll: "20px",
                backgroundColor: COLORS.bg,
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        contents: [
                            createStatCard("📦", "สินค้า", totalProducts, COLORS.primary, `${COLORS.primary}10`),
                            createStatCard("💰", "ขายได้", `฿${monthlySales.toLocaleString()}`, COLORS.success, `${COLORS.success}10`),
                        ],
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        margin: "sm",
                        contents: [
                            createStatCard("👁️", "ยอดดู", totalViews.toLocaleString(), COLORS.secondary, `${COLORS.secondary}10`),
                            createStatCard("✅", "ขายอยู่", `${activeProducts}/${totalProducts}`, COLORS.purple, `${COLORS.purple}10`),
                        ],
                    },
                    createPremiumDivider(),
                    createProgressBar(activePercentage, COLORS.success, "สินค้าที่ขายอยู่", `${activePercentage}%`),
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                backgroundColor: COLORS.bg,
                contents: [
                    createPremiumButton("📈 ดูรายละเอียด", { type: "uri", label: "📈 ดูรายละเอียด", uri: `${TUKTUK_BASE_URL}/seller-dashboard` }, "primary", COLORS.success),
                ],
            },
        },
    };
}

function createPremiumStockUpdateSuccess(result) {
    return {
        type: "flex",
        altText: "✅ อัปเดตสต็อกสำเร็จ",
        contents: {
            type: "bubble",
            size: "mega",
            header: createPremiumHeader("✅", "อัปเดตสต็อกสำเร็จ", result.productName, COLORS.successGradient),
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                backgroundColor: COLORS.bg,
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        contents: [
                            createStatCard("📦", "สต็อกเดิม", result.oldStock, COLORS.textMuted, "#FFFFFF0D"),
                            createStatCard("➡️", "→", "", COLORS.textMuted, "transparent"),
                            createStatCard("📦", "สต็อกใหม่", result.newStock, COLORS.success, `${COLORS.success}10`),
                        ],
                    },
                ],
            },
        },
    };
}

// ============================================================
// 🔘 POSTBACK HANDLER
// ============================================================
async function handleBuyerConfirmReceipt(replyToken, userId, orderId, client) {
    if (!orderId) {
        await client.replyMessage({ replyToken, messages: [{ type: "text", text: "ไม่พบรหัสออเดอร์" }] });
        return;
    }
    const db = getFirestore();
    const snap = await db.collection("escrow_records")
        .where("orderId", "==", orderId)
        .where("buyerId", "==", userId)
        .where("status", "==", "held")
        .limit(1).get();

    if (snap.empty) {
        await client.replyMessage({ replyToken, messages: [{ type: "text", text: "ไม่พบรายการ Escrow หรือยืนยันแล้ว" }] });
        return;
    }
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

    await client.replyMessage({
        replyToken, messages: [{
            type: "text",
            text: `✅ ยืนยันรับสินค้าสำเร็จ!\nเงิน ฿${Number(amount).toLocaleString()} ถูกโอนให้ร้านค้าแล้ว\n\nขอบคุณที่ใช้บริการ TukTuk 🛺`,
        }]
    });
}

async function handleSellerWithdrawal(replyToken, userId, client) {
    const db = getFirestore();
    const snap = await db.collection("users").doc(userId).get();
    const data = snap.data() || {};
    const balance = data.available_balance || 0;

    if (balance <= 0) {
        await client.replyMessage({
            replyToken, messages: [{
                type: "text",
                text: "💳 ยอดเงินที่พร้อมถอนขณะนี้คือ ฿0\n\nรอให้ลูกค้ายืนยันรับสินค้าก่อนนะคะ",
            }]
        });
        return;
    }
    await db.collection("withdrawal_requests").add({
        sellerId: userId,
        amount: balance,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
    });
    await client.replyMessage({
        replyToken, messages: [{
            type: "text",
            text: `💳 ส่งคำขอถอนเงิน ฿${balance.toLocaleString()} สำเร็จ!\nทีมงานจะโอนภายใน 1-3 วันทำการ 🛺`,
        }]
    });
}

async function handleTuktukPostback(event, tuktukClient) {
    const userId = event.source.userId;
    const data = event.postback.data || "";
    console.log(`🔘 Postback: ${data} from ${userId}`);

    try {
        const params = new URLSearchParams(data);
        const action = params.get("action");
        const replyToken = event.replyToken;

        switch (action) {
            case "marketplace":
                await handlePremiumMarketplaceMenu(replyToken, tuktukClient);
                break;
            case "win_rider":
                await handlePremiumWinRiderMenu(replyToken, tuktukClient);
                break;
            case "main_menu":
                await tuktukClient.replyMessage({ replyToken, messages: [createPremiumMainMenu()] });
                break;
            case "login_flow":
                const feature = params.get("feature") || "marketplace";
                const loginFlex = tuktukFlex.createLoginFlowFlex(feature);
                await tuktukClient.replyMessage({ replyToken, messages: [loginFlex] });
                break;
            case "confirm_receipt":
                await handleBuyerConfirmReceipt(replyToken, userId, params.get("orderId"), tuktukClient);
                break;
            case "request_withdrawal":
                await handleSellerWithdrawal(replyToken, userId, tuktukClient);
                break;
            default:
                await tuktukClient.replyMessage({ replyToken, messages: [createPremiumMainMenu()] });
        }
    } catch (error) {
        console.error("❌ Postback error:", error);
    }
}

// ============================================================
// 🛠️ HELPER FUNCTIONS (unchanged)
// ============================================================

async function getSellerStats(userId) {
    const db = getFirestore();
    const stats = { totalProducts: 0, activeProducts: 0, monthlySales: 0, totalViews: 0 };

    try {
        const collections = ["marketplace_items", "community_products"];
        const ownerFields = ["sellerId", "authorId", "lineUserId"];

        for (const coll of collections) {
            for (const field of ownerFields) {
                const snap = await db.collection(coll).where(field, "==", userId).get();
                snap.docs.forEach(doc => {
                    const d = doc.data();
                    stats.totalProducts++;
                    if (d.status !== "sold" && d.status !== "draft") stats.activeProducts++;
                    stats.totalViews += parseInt(d.views || d.viewCount || 0);
                });
            }
        }

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const ordersSnap = await db.collection("product_orders")
            .where("sellerId", "==", userId)
            .where("createdAt", ">=", monthStart)
            .get();
        ordersSnap.docs.forEach(doc => {
            const d = doc.data();
            if (["completed", "shipped"].includes(d.status)) {
                stats.monthlySales += parseFloat(d.totalAmount || 0);
            }
        });
    } catch (error) {
        console.error("Stats error:", error);
    }
    return stats;
}

async function getRecentOrders(userId, limit = 5) {
    const db = getFirestore();
    try {
        const snap = await db.collection("product_orders")
            .where("sellerId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Orders error:", error);
        return [];
    }
}

async function handleSellerProductSearch(userId, query, replyToken, tuktukClient) {
    const db = getFirestore();
    const products = [];
    const queryLower = query.toLowerCase();
    const collections = ["marketplace_items", "community_products"];
    const ownerFields = ["sellerId", "authorId", "lineUserId"];

    try {
        for (const coll of collections) {
            for (const field of ownerFields) {
                const snap = await db.collection(coll).where(field, "==", userId).get();
                snap.docs.forEach(doc => {
                    const d = doc.data();
                    const name = (d.productName || d.title || "").toLowerCase();
                    if (name.includes(queryLower)) products.push({ id: doc.id, _coll: coll, ...d });
                });
            }
        }
    } catch (error) {
        console.error("Seller search error:", error);
    }

    if (products.length === 0) {
        await tuktukClient.replyMessage({
            replyToken,
            messages: [createPremiumError(`ไม่พบสินค้า "${query}" ในร้านของคุณ`)],
        });
        return;
    }

    let txt = `🔍 สินค้าของคุณที่ตรงกับ "${query}"\n\n`;
    products.slice(0, 5).forEach((p, i) => {
        const stock = p._coll === "community_products" ? parseInt(p.productStock || 0) : parseInt(p.stock || 0);
        txt += `${i + 1}. ${p.productName || p.title || "สินค้า"}\n   ฿${parseFloat(p.price || 0).toLocaleString()} | สต็อก: ${stock} | ${getProductStatusText(p.status)}\n   ID: ${p.id}\n\n`;
    });
    txt += "💡 เพิ่มสต็อก: \"เพิ่มสต็อก [ID] [จำนวน]\"";

    await tuktukClient.replyMessage({ replyToken, messages: [{ type: "text", text: txt }] });
}

async function updateStock(userId, productId, amount) {
    const db = getFirestore();
    const collections = ["marketplace_items", "community_products"];
    for (const coll of collections) {
        const ref = db.collection(coll).doc(productId);
        const doc = await ref.get();
        if (!doc.exists) continue;
        const d = doc.data();
        const ownerId = d.sellerId || d.authorId || d.lineUserId;
        if (ownerId !== userId) return { success: false, error: "คุณไม่มีสิทธิ์แก้ไขสินค้านี้" };
        const stockField = coll === "community_products" ? "productStock" : "stock";
        const oldStock = parseInt(d[stockField] || 0);
        const newStock = oldStock + amount;
        if (newStock < 0) return { success: false, error: "สต็อกไม่สามารถติดลบได้" };
        await ref.update({ [stockField]: newStock, updatedAt: FieldValue.serverTimestamp() });
        return { success: true, productName: d.productName || d.title || "สินค้า", oldStock, newStock };
    }
    return { success: false, error: "ไม่พบสินค้า ID นี้ในระบบ" };
}

function getOrderStatusText(status) {
    return {
        pending: "⏳ รอชำระเงิน", paid: "✅ ชำระแล้ว",
        pending_shipment: "📦 รอจัดส่ง", shipped: "🚚 จัดส่งแล้ว",
        completed: "✅ สำเร็จ", cancelled: "❌ ยกเลิก",
    }[status] || status;
}

function getProductStatusText(status) {
    return {
        active: "✅ ขายอยู่", sold: "💰 ขายแล้ว",
        draft: "📝 แบบร่าง", "pre-order": "⏰ Pre-Order",
    }[status] || status;
}

module.exports = {
    // Core exports
    lineWebhookTuktuk,

    // UI Components (for reuse)
    createPremiumHeader,
    createStatCard,
    createCommandChip,
    createProgressBar,
    createPremiumButton,
    createPremiumDivider,
    createPremiumError,
    createPremiumMainMenu,

    // Export colors for other modules
    COLORS,
};