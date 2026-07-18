/**
 * 🛺 TUKTUK THAILAND FLEX MESSAGE TEMPLATES
 * Flex messages สำหรับแจ้งเตือนและตอบกลับผู้ขาย
 */

/**
 * 🔗 Smart Link Helper
 * Returns smartUri = redirect page that tries tuktukfeed:// app scheme first,
 * falls back to web URL automatically. Works for both app users and web users.
 */
function createSmartLink(feature) {
    // Web paths ที่มีอยู่จริงบน tuktukfeed.com (cleanUrls=true ไม่ต้องใส่ .html)
    const webPaths = {
        feed: "/index.html",         // index.html = TukTuk main feed 
        nearby: "/marketplace",        // marketplace.html 
        marketplace: "/marketplace",        // marketplace.html 
        win: "/win-service",        // win-service.html 
        register: "/win-rider-register", // win-rider-register.html 
        delivery: "/win-service",        // ไม่มี /delivery → วินรับส่งสินค้าด้วย
        login: "/auth",               // auth.html 
        seller: "/seller-dashboard",   // seller-dashboard.html 
        otop: "/marketplace",        // marketplace.html 
        community: "/index.html",         // เปลี่ยนกลับไป index.html (Career Hub) 
    };
    return {
        appUri: `tuktukfeed://${feature}`,
        webUri: `https://tuktukfeed.com${webPaths[feature] || "/"}`,
        // smartUri: redirect page tries app first, falls back to web
        smartUri: `https://tuktukfeed.com/go?f=${feature}`,
    };
}

function createTuktukFriendWelcomeMessage(displayName) {
    const name = displayName || "คุณ";

    return {
        type: "flex",
        altText: `🛺 ยินดีต้อนรับสู่ TukTuk Thailand คุณ${name}! กดดูบริการที่นี่👇`,
        contents: {
            type: "carousel",
            contents: [
                // 🎟️ BUBBLE 1: MAIN HERO / WELCOME
                {
                    type: "bubble",
                    size: "giga",
                    hero: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "0px",
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                paddingAll: "24px",
                                background: {
                                    type: "linearGradient",
                                    angle: "135deg",
                                    startColor: "#020617",
                                    endColor: "#1e1b4b",
                                },
                                contents: [
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        alignItems: "center",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "🛺",
                                                size: "3xl",
                                                flex: 0,
                                                gravity: "center"
                                            },
                                            {
                                                type: "box",
                                                layout: "vertical",
                                                margin: "lg",
                                                contents: [
                                                    {
                                                        type: "text",
                                                        text: "TukTuk TH",
                                                        weight: "bold",
                                                        size: "xxl",
                                                        color: "#FFFFFF",
                                                    },
                                                    {
                                                        type: "text",
                                                        text: "Super App ของคนไทย",
                                                        size: "xs",
                                                        color: "#6366f1",
                                                        weight: "bold"
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: "text",
                                        text: `สวัสดี ${name}! 🎉`,
                                        size: "md",
                                        color: "#e2e8f0",
                                        margin: "xl",
                                        wrap: true,
                                        weight: "bold"
                                    },
                                    {
                                        type: "text",
                                        text: "ปัดขวา ➡️ เพื่อค้นพบบริการทั้งหมดของเรา",
                                        size: "xs",
                                        color: "#94a3b8",
                                        margin: "sm",
                                    },
                                ],
                            }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: "#ffffff",
                        contents: [
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                contents: [
                                    createPremiumFeatureTile("📱", "ฟีดดูเพลิน", "คอมมิวนิตี้ & ข่าว", "feed"),
                                    createPremiumFeatureTile("🛒", "ตลาด OTOP", "ซื้อง่ายขายคล่อง", "marketplace"),
                                ],
                            },
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "16px",
                        contents: [
                            {
                                type: "button",
                                style: "primary",
                                height: "sm",
                                action: {
                                    type: "uri",
                                    label: "🚀 เข้าใช้งานทันที",
                                    uri: createSmartLink("feed").smartUri,
                                },
                                color: "#4f46e5",
                            }
                        ]
                    }
                },

                // 🎟️ BUBBLE 2: FEATURES
                {
                    type: "bubble",
                    size: "giga",
                    header: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "16px",
                        backgroundColor: "#f8fafc",
                        contents: [
                            {
                                type: "text",
                                text: "✨ บริการสุดล้ำของเรา",
                                weight: "bold",
                                size: "lg",
                                color: "#0f172a"
                            }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: "#ffffff",
                        spacing: "md",
                        contents: [
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                contents: [
                                    createPremiumFeatureTile("🛺", "เรียกวิน", "รวดเร็ว ปลอดภัย", "win"),
                                    createPremiumFeatureTile("📦", "ส่งด่วน", "ถึงมือใน 1 ชม.", "delivery"),
                                ],
                            },
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                contents: [
                                    createPremiumFeatureTile("📍", "ใกล้ฉัน", "ค้นหาของดีพื้นที่", "nearby"),
                                    createPremiumFeatureTile("🏘️", "ชุมชน", "หาเพื่อน หาช่าง", "community"),
                                ],
                            },
                        ]
                    },
                },

                // 🎟️ BUBBLE 3: CREATORS & SELLERS
                {
                    type: "bubble",
                    size: "giga",
                    header: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "16px",
                        backgroundColor: "#fff7ed",
                        contents: [
                            {
                                type: "text",
                                text: "💸 สร้างรายได้",
                                weight: "bold",
                                size: "lg",
                                color: "#c2410c"
                            }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        paddingAll: "20px",
                        backgroundColor: "#ffffff",
                        spacing: "md",
                        contents: [
                            {
                                type: "box",
                                layout: "horizontal",
                                spacing: "sm",
                                contents: [
                                    createPremiumFeatureTile("🏍️", "สมัครวิน", "รายได้ดี งานอิสระ", "register"),
                                    createPremiumFeatureTile("📈", "ขายของ", "ระบบจัดการอัจฉริยะ", "seller"),
                                ],
                            },
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        paddingAll: "16px",
                        contents: [
                            {
                                type: "button",
                                style: "primary",
                                height: "sm",
                                action: {
                                    type: "message",
                                    label: "🔑 ขอรหัสเข้าระบบ (PIN)",
                                    text: "รหัส",
                                },
                                color: "#ea580c",
                            }
                        ]
                    }
                }
            ]
        }
    };
}

/**
 * Premium Feature tile component
 */
function createPremiumFeatureTile(emoji, title, subtitle, feature) {
    const link = createSmartLink(feature);
    return {
        type: "box",
        layout: "vertical",
        action: {
            type: "uri",
            label: title,
            uri: link.smartUri,
        },
        backgroundColor: "#f8fafc",
        cornerRadius: "16px",
        paddingAll: "16px",
        flex: 1,
        borderColor: "#e2e8f0",
        borderWidth: "1px",
        contents: [
            {
                type: "text",
                text: emoji,
                size: "3xl",
                align: "center",
            },
            {
                type: "text",
                text: title,
                size: "sm",
                weight: "bold",
                align: "center",
                margin: "md",
                color: "#0f172a",
            },
            {
                type: "text",
                text: subtitle,
                size: "xxs",
                color: "#64748b",
                align: "center",
                wrap: true,
                margin: "xs",
            },
        ],
    };
}

/**
 * 📦 New Order Notification
 */
function createNewOrderFlex(order) {
    const productName = order.productName || order.title || "สินค้า";
    const totalAmount = parseFloat(order.totalAmount || 0);
    const buyerName = order.buyerName || order.customerName || "ไม่ระบุ";
    const orderId = order.id || "N/A";
    const statusText = order.status === "pending" ? "รอชำระเงิน" : order.status;
    const statusColor = order.status === "pending" ? "#F59E0B" : "#00B900";

    return {
        type: "flex",
        altText: "📦 ออเดอร์ใหม่เข้าแล้วรวยๆ!",
        contents: {
            type: "bubble",
            size: "kilo",
            hero: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "🎉 ออเดอร์ใหม่!",
                        weight: "bold",
                        size: "xxl",
                        color: "#FFFFFF",
                    },
                    {
                        type: "text",
                        text: `#${orderId.substring(0, 8).toUpperCase()}`,
                        size: "xs",
                        color: "#e2e8f0",
                        margin: "sm",
                    },
                ],
                background: {
                    type: "linearGradient",
                    angle: "90deg",
                    startColor: "#3b82f6",
                    endColor: "#8b5cf6"
                },
                paddingAll: "24px",
            },
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                contents: [
                    {
                        type: "text",
                        text: productName,
                        weight: "bold",
                        size: "lg",
                        color: "#1e293b",
                        wrap: true,
                    },
                    {
                        type: "separator",
                        margin: "lg",
                        color: "#e2e8f0"
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "lg",
                        contents: [
                            {
                                type: "text",
                                text: "ยอดสุทธิ",
                                color: "#64748b",
                                size: "sm",
                                flex: 1,
                            },
                            {
                                type: "text",
                                text: `฿${totalAmount.toLocaleString()}`,
                                wrap: true,
                                color: "#10b981",
                                size: "xl",
                                weight: "bold",
                                flex: 2,
                                align: "end"
                            },
                        ],
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "md",
                        contents: [
                            {
                                type: "text",
                                text: "ลูกค้า",
                                color: "#64748b",
                                size: "sm",
                                flex: 1,
                            },
                            {
                                type: "text",
                                text: buyerName,
                                wrap: true,
                                size: "sm",
                                color: "#334155",
                                weight: "bold",
                                flex: 2,
                                align: "end"
                            },
                        ],
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "md",
                        contents: [
                            {
                                type: "text",
                                text: "สถานะ",
                                color: "#64748b",
                                size: "sm",
                                flex: 1,
                            },
                            {
                                type: "text",
                                text: statusText,
                                wrap: true,
                                size: "sm",
                                color: statusColor,
                                weight: "bold",
                                flex: 2,
                                align: "end"
                            },
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                paddingAll: "16px",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "📱 จัดการออเดอร์เลย",
                            uri: createSmartLink("seller").smartUri,
                        },
                        color: "#4f46e5",
                    },
                    {
                        type: "button",
                        style: "secondary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "💬 ทักแชทลูกค้า",
                            uri: `https://tuktukfeed.com/chat`,
                        },
                        margin: "sm"
                    },
                ],
            },
        },
    };
}

/**
 * 💰 Payment Received Notification
 */
function createPaymentReceivedFlex(order) {
    const orderId = order.id || "N/A";
    const totalAmount = parseFloat(order.totalAmount || 0);
    const productName = order.productName || order.title || "สินค้า";

    return {
        type: "flex",
        altText: "✅ ได้รับชำระเงินแล้ว!",
        contents: {
            type: "bubble",
            hero: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "✅ ชำระเงินสำเร็จ!",
                        weight: "bold",
                        size: "xl",
                        color: "#FFFFFF",
                    },
                ],
                backgroundColor: "#00B900",
                paddingAll: "20px",
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: productName,
                        weight: "bold",
                        size: "md",
                        wrap: true,
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "md",
                        contents: [
                            {
                                type: "text",
                                text: "ออเดอร์:",
                                color: "#aaaaaa",
                                size: "sm",
                                flex: 1,
                            },
                            {
                                type: "text",
                                text: `#${orderId.substring(0, 8)}`,
                                wrap: true,
                                size: "sm",
                                flex: 2,
                            },
                        ],
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "md",
                        contents: [
                            {
                                type: "text",
                                text: "ยอดเงิน:",
                                color: "#aaaaaa",
                                size: "sm",
                                flex: 1,
                            },
                            {
                                type: "text",
                                text: `฿${totalAmount.toLocaleString()}`,
                                wrap: true,
                                color: "#00B900",
                                size: "lg",
                                weight: "bold",
                                flex: 2,
                            },
                        ],
                    },
                    {
                        type: "separator",
                        margin: "lg",
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        contents: [
                            {
                                type: "text",
                                text: "⏰ ต้องจัดส่งภายใน 2 วัน",
                                size: "sm",
                                color: "#F59E0B",
                                weight: "bold",
                            },
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "เตรียมจัดส่ง",
                            uri: `https://tuktukfeed.com/seller/orders/${orderId}`,
                        },
                        color: "#00B900",
                    },
                    {
                        type: "button",
                        style: "link",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "พิมพ์ใบปะหน้า",
                            uri: `https://tuktukfeed.com/seller/orders/${orderId}/print`,
                        },
                    },
                ],
            },
        },
    };
}

/**
 * ⚠️ Low Stock Alert
 */
function createLowStockFlex(product, currentStock) {
    const productName = product.productName || product.title || "สินค้า";
    const productId = product.id || "N/A";
    const imageUrl = product.imageUrl || product.coverImage || "";

    return {
        type: "flex",
        altText: "🚨 แจ้งเตือน: สต็อกสินค้าใกล้หมด!",
        contents: {
            type: "bubble",
            size: "kilo",
            hero: imageUrl
                ? {
                    type: "image",
                    url: imageUrl,
                    size: "full",
                    aspectRatio: "20:13",
                    aspectMode: "cover",
                }
                : {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: "⚠️",
                            size: "5xl",
                            align: "center",
                        },
                    ],
                    backgroundColor: "#fef3c7",
                    paddingAll: "30px",
                },
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                            {
                                type: "text",
                                text: "🚨 รีบเติมด่วน!",
                                weight: "bold",
                                size: "sm",
                                color: "#dc2626",
                            },
                            {
                                type: "text",
                                text: "ขายดีจัด",
                                size: "sm",
                                color: "#64748b",
                                align: "end",
                            }
                        ]
                    },
                    {
                        type: "text",
                        text: productName,
                        weight: "bold",
                        size: "lg",
                        wrap: true,
                        margin: "md",
                        color: "#0f172a"
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        margin: "lg",
                        contents: [
                            {
                                type: "text",
                                text: "เหลือเพียง",
                                color: "#64748b",
                                size: "sm",
                                flex: 1,
                            },
                            {
                                type: "text",
                                text: `${currentStock} ชิ้น`,
                                wrap: true,
                                color: "#ea580c",
                                size: "xl",
                                weight: "bold",
                                flex: 1,
                                align: "end"
                            },
                        ],
                    },
                    {
                        type: "separator",
                        margin: "lg",
                    },
                    {
                        type: "text",
                        text: "💡 ลูกค้ากำลังให้ความสนใจ อย่าพลาดโอกาสทอง รีบเติมสต็อกเลย!",
                        size: "xs",
                        color: "#64748b",
                        wrap: true,
                        margin: "lg",
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                paddingAll: "16px",
                contents: [
                    {
                        type: "button",
                        style: "secondary",
                        height: "sm",
                        flex: 1,
                        action: {
                            type: "uri",
                            label: "ดูสินค้า",
                            uri: createSmartLink("seller").smartUri,
                        },
                    },
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        flex: 2,
                        action: {
                            type: "message",
                            label: "📦 เพิ่มสต็อก +10",
                            text: `เพิ่มสต็อก ${productId} 10`,
                        },
                        color: "#ea580c",
                    },
                ],
            },
        },
    };
}

/**
 * 📊 Daily Sales Summary
 */
function createDailySummaryFlex(stats) {
    const totalSales = parseFloat(stats.totalSales || 0);
    const orderCount = parseInt(stats.orderCount || 0);
    const totalViews = parseInt(stats.totalViews || 0);
    const pendingShipment = parseInt(stats.pendingShipment || 0);

    return {
        type: "flex",
        altText: "📈 สรุปยอดขายวันนี้",
        contents: {
            type: "bubble",
            hero: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "📈 สรุปยอดขายวันนี้",
                        weight: "bold",
                        size: "xl",
                        color: "#FFFFFF",
                    },
                    {
                        type: "text",
                        text: new Date().toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }),
                        size: "xs",
                        color: "#FFFFFF",
                        margin: "sm",
                    },
                ],
                backgroundColor: "#1E293B",
                paddingAll: "20px",
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                            createStatBox("💰", "ยอดขาย", `฿${totalSales.toLocaleString()}`),
                            createStatBox("📦", "ออเดอร์", `${orderCount} รายการ`),
                        ],
                    },
                    {
                        type: "separator",
                        margin: "md",
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        margin: "md",
                        contents: [
                            createStatBox("👀", "ยอดวิว", `${totalViews} ครั้ง`),
                            createStatBox("⏳", "รอจัดส่ง", `${pendingShipment} รายการ`),
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        action: {
                            type: "uri",
                            label: "ดูรายละเอียด",
                            uri: "https://tuktukfeed.com/seller",
                        },
                        color: "#00D2FF",
                    },
                ],
            },
        },
    };
}

/**
 * 🛺 Seller Dashboard Summary
 */
function createDashboardFlex(stats) {
    const totalProducts = parseInt(stats.totalProducts || 0);
    const activeProducts = parseInt(stats.activeProducts || 0);
    const monthlySales = parseFloat(stats.monthlySales || 0);
    const totalViews = parseInt(stats.totalViews || 0);

    return {
        type: "flex",
        altText: "🛺 TukTuk Seller Dashboard",
        contents: {
            type: "bubble",
            hero: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "🛺 Seller Dashboard",
                        weight: "bold",
                        size: "xl",
                        color: "#FFFFFF",
                    },
                    {
                        type: "text",
                        text: new Date().toLocaleDateString("th-TH"),
                        color: "#FFFFFF",
                        size: "xs",
                        margin: "sm",
                    },
                ],
                backgroundColor: "#1E293B",
                paddingAll: "20px",
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                            createStatBox("📦", "สินค้าทั้งหมด", totalProducts),
                            createStatBox("✅", "กำลังขาย", activeProducts),
                        ],
                    },
                    {
                        type: "separator",
                        margin: "md",
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        margin: "md",
                        contents: [
                            createStatBox("💰", "ยอดขายเดือนนี้", `฿${monthlySales.toLocaleString()}`),
                            createStatBox("👀", "ยอดวิว", totalViews),
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        action: {
                            type: "uri",
                            label: "เปิด Seller Center",
                            uri: "https://tuktukfeed.com/seller",
                        },
                        color: "#00D2FF",
                    },
                ],
            },
        },
    };
}

/**
 * Helper: Create Stat Box for Flex Messages
 */
function createStatBox(icon, label, value) {
    return {
        type: "box",
        layout: "vertical",
        contents: [
            {
                type: "box",
                layout: "vertical",
                backgroundColor: "#f8fafc",
                cornerRadius: "12px",
                paddingAll: "12px",
                borderColor: "#e2e8f0",
                borderWidth: "1px",
                contents: [
                    {
                        type: "text",
                        text: icon,
                        size: "xl",
                        align: "center",
                    },
                    {
                        type: "text",
                        text: String(value),
                        size: "md",
                        weight: "bold",
                        align: "center",
                        margin: "sm",
                        color: "#0f172a"
                    },
                    {
                        type: "text",
                        text: label,
                        size: "xxs",
                        color: "#64748b",
                        align: "center",
                        wrap: true,
                    },
                ]
            }
        ],
        flex: 1,
    };
}

/**
 * 🔑 PIN Request Flex Message
 */
function createPINFlex(pin, expiresAt) {
    return {
        type: "flex",
        altText: "🔑 รหัสเข้าใช้งาน TukTuk ของคุณ",
        contents: {
            type: "bubble",
            size: "kilo",
            hero: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "🔐 รหัสของคุณพร้อมแล้ว",
                        weight: "bold",
                        size: "lg",
                        color: "#FFFFFF",
                        align: "center"
                    },
                ],
                background: {
                    type: "linearGradient",
                    angle: "90deg",
                    startColor: "#0f172a",
                    endColor: "#334155"
                },
                paddingAll: "16px",
            },
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "24px",
                contents: [
                    {
                        type: "text",
                        text: "โปรดนำรหัส (PIN) 6 หลักนี้ ไปกรอกในแอปหรือเว็ปไซต์",
                        size: "sm",
                        color: "#64748b",
                        wrap: true,
                        align: "center"
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        backgroundColor: "#f1f5f9",
                        cornerRadius: "8px",
                        paddingAll: "16px",
                        margin: "xl",
                        borderWidth: "1px",
                        borderColor: "#e2e8f0",
                        contents: [
                            {
                                type: "text",
                                text: pin,
                                size: "4xl",
                                weight: "bold",
                                align: "center",
                                color: "#0ea5e9",
                                style: "normal",
                                decoration: "none"
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        margin: "lg",
                        justifyContent: "center",
                        contents: [
                            {
                                type: "text",
                                text: `⏰ หมดอายุ: ${expiresAt}`,
                                color: "#ef4444",
                                size: "xs",
                                weight: "bold",
                                align: "center"
                            }
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                paddingAll: "16px",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "🚀 เข้าสู่ระบบทันที",
                            uri: createSmartLink("feed").smartUri,
                        },
                        color: "#0ea5e9",
                    }
                ],
            },
        },
    };
}

/**
 * 🔐 Login / Auth Flow Flex
 * แสดงเมื่อผู้ใช้ต้องการ authenticate เพื่อใช้บริการ
 * @param {string} redirectFeature - feature ที่จะเปิดหลัง login เช่น 'marketplace', 'win'
 */
function createLoginFlowFlex(redirectFeature = "marketplace") {
    const link = createSmartLink(redirectFeature);
    const featureNames = {
        feed: "ฟีดชุมชน",
        nearby: "สินค้าใกล้ฉัน",
        marketplace: "ตลาดซื้อขาย",
        win: "เรียกวิน",
        register: "สมัครวิน",
        delivery: "ส่งสินค้า",
        seller: "แดชบอร์ดร้านค้า",
    };
    const featureName = featureNames[redirectFeature] || "บริการ";

    return {
        type: "flex",
        altText: `เข้าสู่ระบบ TukTuk เพื่อใช้ ${featureName}`,
        contents: {
            type: "bubble",
            size: "kilo",
            hero: {
                type: "box",
                layout: "vertical",
                paddingAll: "20px",
                backgroundColor: "#1A1A2E",
                contents: [
                    {
                        type: "text",
                        text: "🔐 เข้าสู่ระบบ",
                        weight: "bold",
                        size: "xl",
                        color: "#FFFFFF",
                    },
                    {
                        type: "text",
                        text: `ระบุตัวตนเพื่อใช้ ${featureName}`,
                        size: "xs",
                        color: "#888888",
                        margin: "sm",
                        wrap: true,
                    },
                ],
            },
            body: {
                type: "box",
                layout: "vertical",
                paddingAll: "16px",
                spacing: "md",
                contents: [
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        contents: [
                            { type: "text", text: "1️⃣", size: "xl", flex: 0 },
                            {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    { type: "text", text: "ขอรหัส PIN", weight: "bold", size: "sm" },
                                    { type: "text", text: 'พิมพ์ "รหัส" เพื่อรับ PIN 6 หลัก', size: "xs", color: "#666666", wrap: true },
                                ],
                            },
                        ],
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        contents: [
                            { type: "text", text: "2️⃣", size: "xl", flex: 0 },
                            {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    { type: "text", text: "เปิดแอป / เว็บ", weight: "bold", size: "sm" },
                                    { type: "text", text: "กรอก PIN เพื่อเข้าสู่ระบบอัตโนมัติ", size: "xs", color: "#666666", wrap: true },
                                ],
                            },
                        ],
                    },
                    {
                        type: "box",
                        layout: "horizontal",
                        spacing: "sm",
                        contents: [
                            { type: "text", text: "3️⃣", size: "xl", flex: 0 },
                            {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    { type: "text", text: `เปิด ${featureName}`, weight: "bold", size: "sm" },
                                    { type: "text", text: "ใช้งานได้ทันที ไม่ต้องจำรหัสผ่าน", size: "xs", color: "#666666", wrap: true },
                                ],
                            },
                        ],
                    },
                ],
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                paddingAll: "12px",
                contents: [
                    {
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "message",
                            label: "🔑 ขอรหัส PIN",
                            text: "รหัส",
                        },
                        color: "#00AACC",
                    },
                    {
                        type: "button",
                        style: "link",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: `เปิด ${featureName} (เว็บ/แอป)`,
                            uri: link.smartUri,
                        },
                    },
                ],
            },
        },
    };
}

module.exports = {
    createSmartLink,
    createTuktukFriendWelcomeMessage,
    createLoginFlowFlex,
    createNewOrderFlex,
    createPaymentReceivedFlex,
    createLowStockFlex,
    createDailySummaryFlex,
    createDashboardFlex,
    createPINFlex
};
