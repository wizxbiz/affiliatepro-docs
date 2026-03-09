/**
 * TukTuk LIFF Configuration — แก้ไขที่นี่จุดเดียว
 * ─────────────────────────────────────────────────
 * ขั้นตอนการรับ LIFF ID:
 *   1. ไปที่ https://developers.line.biz/console/
 *   2. เลือก Channel → แท็บ LIFF → Add
 *   3. ตั้งค่า:
 *      • LIFF app name : ชื่อใด ก็ได้ (เช่น TukTuk Seller)
 *      • Size          : Full
 *      • Endpoint URL  : https://appinjproject.web.app/liff-seller.html
 *   4. คัดลอก LIFF ID (รูปแบบ 1234567890-XXXXXXXX) มาใส่ด้านล่าง
 *
 * ทำซ้ำสำหรับแต่ละ LIFF page (seller / customer / analytics / live)
 */

window.TUKTUK_LIFF = {
    /** liff-seller.html — Seller & Rider Dashboard */
    seller:    "2009159046-wkIGSDHg",

    /** liff-customer.html — Customer Service Center */
    customer:  "2009159046-baMRqwMy",

    /** liff-advanced-seller.html — Advanced Analytics */
    analytics: "2009159046-oVRHuOdv",

    /** liff-live-commerce.html — Live Commerce Studio */
    live:      "2009159046-X9TyhKqw",

    /**
     * Go Backend base URL — tuktuk-engine on Fly.io (Singapore)
     * Endpoints: /api/v1/feed, /news, /products, /leaderboard, /presign
     */
    apiBase: "https://tuktuk-engine.fly.dev",
};

/**
 * Firebase Web Push (FCM) — VAPID key
 * รับจาก Firebase Console → Project Settings → Cloud Messaging
 *              → Web Push certificates → Generate key pair → copy "Key pair"
 *
 * ใส่ค่า VAPID key ด้านล่างเพื่อเปิด push notification บนเว็บ seller-dashboard.html
 */
window.FIREBASE_VAPID_KEY = "BDsZBxU7OWZwzFKcEtVcllugq1Hdx10tiCqcSEYO3pR50t58xwzBZan_nvmrwh42qk6bXgwFDqEf-_Vk5500e0Q";
