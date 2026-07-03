# 🛺 TukTuk Backend — รายงานวิเคราะห์และแผนพัฒนา
> **วันที่จัดทำ:** 2026-03-11 | **Version:** 3.0 Ultra Premium  
> **จัดทำโดย:** Antigravity AI Backend Analysis

---

## 🏗️ สถาปัตยกรรมระบบ (Architecture Overview)

TukTuk ใช้สถาปัตยกรรมแบบ **Dual-Layer Backend** ซึ่งประกอบด้วย 2 ชั้นหลัก:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Flutter App / Web)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐       ┌──────────────────────┐
│  Go Engine      │       │  Firebase Cloud Func  │
│  (Fly.io SIN)   │       │  (us-central1)        │
│  tuktuk-engine  │       │  linewebhooktuktuk    │
│                 │       │                       │
│  - Feed API     │       │  - LINE Webhook       │
│  - Analytics    │       │  - Marketplace API    │
│  - Storage      │       │  - Auth / PIN         │
│  - Caching      │       │  - Escrow / Payment   │
└────────┬────────┘       └──────────┬────────────┘
         │                           │
         └────────────┬──────────────┘
                      ▼
          ┌───────────────────────┐
          │     Firestore DB      │
          │  (Firebase / GCP)     │
          └───────────────────────┘
```

---

## 📦 Layer 1: Go Engine (tuktuk-backend)

### ข้อมูลทั่วไป

| รายการ | ค่า |
|--------|-----|
| Language | Go 1.22+ |
| Framework | Gin (HTTP Router) |
| Deploy | Fly.io — Region: Singapore (SIN) |
| App Name | `tuktuk-engine` |
| Port | 8080 (Force HTTPS) |
| RAM | shared-cpu-1x (256MB Free Tier) |
| Cache L1 | In-Memory (MemoryCache) |
| Cache L2 | Redis (ถ้ามี `REDIS_ADDR` env) |
| DB Primary | Cloud Firestore |
| DB Analytics | PostgreSQL (ผ่าน `DATABASE_URL`) |
| Storage | Cloudflare R2 |

### โครงสร้างไฟล์

```
tuktuk-backend/
├── main.go                         ← Entry point, DI, Router setup
├── Dockerfile                      ← Docker build config
├── fly.toml                        ← Fly.io deployment config
├── go.mod / go.sum                 ← Dependencies
├── serviceAccountKey.json          ← Firebase credentials (local dev)
└── internal/
    ├── models/
    │   ├── post.go                 ← Post, FeedResponse, News, Notification structs
    │   ├── analytics.go            ← SellerReport, CommunityTrend structs
    │   ├── provinces.go            ← Thai Province codes + names
    │   └── telemetry.go            ← Telemetry event types
    ├── services/
    │   ├── feed_service.go         ← Feed ranking, Products, Leaderboard, Live
    │   ├── analytics_service.go    ← Seller Dashboard Stats, Community Insights
    │   └── storage_service.go      ← Cloudflare R2 presigned URL generator
    ├── repository/
    │   ├── firestore_repo.go       ← Firestore CRUD operations
    │   ├── redis_repo.go           ← Redis caching wrapper
    │   └── sql_repo.go             ← PostgreSQL analytics queries
    ├── cache/
    │   ├── memory_cache.go         ← In-memory LRU cache
    │   └── redis_cache.go          ← Redis cache adapter
    └── observability/
        └── logger.go               ← Structured logging (slog), Metrics
```

### API Endpoints

| Method | Path | Auth | คำอธิบาย |
|--------|------|------|---------|
| `GET` | `/health` | ❌ | Health check + Metrics |
| `GET` | `/api/v1/feed` | ❌ | Personalized Feed (Posts + News + Notif + Tags) |
| `GET` | `/api/v1/news` | ❌ | Verified News (limit query param) |
| `GET` | `/api/v1/products` | ❌ | Marketplace Products (limit) |
| `GET` | `/api/v1/analytics/seller/:id` | ✅ IAM | Seller Dashboard Stats |
| `GET` | `/api/v1/analytics/community` | ✅ IAM | Community Insights (by province) |
| `POST` | `/api/v1/presign` | ❌ | Cloudflare R2 Presigned URL |

### Feed Ranking Algorithm (Anti-Gaming v2)

```
FinalScore = InteractionScore × DecayFactor × PersonalizationMultiplier

InteractionScore = (Likes × 12.0) + (log(ViewCount+1) × 5.0)
DecayFactor      = 1 / (Age_hours + 2)^1.5     ← Power law decay
Personalization  = 1.0 + ProvinceBoost(+0.5) + CategoryBoost(+0.3)
Anti-Gaming      = Self-like excluded, Log scale views (bot-resistant)
```

### Cache Strategy

```
Request → Redis Cache (hit?) → Firestore
              ↑ Miss: fetch + write back (TTL: 4 min)
WarmAll() goroutine runs every 4 min (startup + ticker)
7 collections warmed in parallel goroutines
```

---

## 📦 Layer 2: Cloud Functions (Firebase / Node.js)

### ข้อมูลทั่วไป

| รายการ | ค่า |
|--------|-----|
| Runtime | Node.js 22 |
| Platform | Firebase Cloud Functions v2 |
| Region | us-central1 |
| Service Name | `linewebhooktuktuk` |
| Memory | 256MiB – 1GiB (ขึ้นกับ function) |

### ไฟล์ Cloud Functions

| ไฟล์ | บรรทัด | หน้าที่หลัก |
|------|-------:|------------|
| `tuktuk_webhook.js` | 3,035 | LINE Webhook: message handling, PIN, Menu |
| `tuktuk_functions.js` | 413 | Subscription, Search, Escrow, FCM |
| `marketplace_functions.js` | 1,107 | Auth, Post Product, AI Vision, LINE Login |
| `admin_api_handlers.js` | 574 | Admin APIs, PIN Auth, Magic Token |
| `scheduled_tasks.js` | 497 | 7 Cron Jobs |
| `web_push_functions.js` | 112 | Web Push + Firestore Triggers |
| `tuktukFlexMessages.js` | 1,232 | Flex Message Templates |

### Cloud Functions ทั้งหมด

#### 🔐 Authentication
| Function | Type | คำอธิบาย |
|----------|------|---------|
| `verifyWebPin` | HTTP | PIN 6 หลัก → Firebase Custom Token |
| `generateLineToken` | HTTP | สร้าง Magic Link (10 min TTL) |
| `verifyLineToken` | HTTP | ตรวจสอบ Magic Token → Custom Token |
| `verifyLineLogin` | HTTP | LINE Profile → Firebase Token |
| `lineLoginCallback` | HTTP | OAuth 2.0 Code Exchange |
| `marketplaceLineAuth` | HTTP | LINE User ID Auth สำหรับ Marketplace |

#### 🛒 Marketplace
| Function | Type | คำอธิบาย |
|----------|------|---------|
| `marketplacePostProduct` | HTTP | ลงขายสินค้า + อัปโหลดรูป |
| `marketplaceAIGeneratePost` | HTTP | Gemini Vision เขียนโพสต์จากรูป |
| `getSearchSuggestions` | Callable | Autocomplete ชื่อสินค้า |
| `advancedMarketplaceSearch` | Callable | ค้นหาขั้นสูง (category/price/province) |

#### 💳 Payment & Escrow
| Function | Type | คำอธิบาย |
|----------|------|---------|
| `verifyPaymentSlip` | Callable | ตรวจสลิปผ่าน SlipOK API |
| `createEscrowRecord` | Callable | Lock เงินใน Escrow |
| `buyerConfirmReceipt` | Callable | Release เงินให้ร้านค้า |
| `createSubscriptionInvoice` | Callable | สร้างใบแจ้งหนี้สมาชิก |

#### 📊 Admin
| Function | Type | คำอธิบาย |
|----------|------|---------|
| `adminCreatePin` | HTTP | สร้าง PIN ให้ User |
| `adminGetStats` | HTTP | สถิติระบบ (users, products) |
| `adminBroadcast` | HTTP | ส่งข้อความ LINE |
| `adminRecordTransaction` | HTTP | บันทึก Transaction |
| `adminGetTransactions` | HTTP | ดู Transactions |
| `adminGetWebhookLogs` | HTTP | ดู Webhook Logs |

#### 🔔 Notifications (Firestore Triggers)
| Function | Trigger | คำอธิบาย |
|----------|---------|---------|
| `onOrderCreated` | `product_orders/{id}` created | FCM แจ้ง Seller |
| `onNewWinRiderRequest` | `win_rider_requests/{id}` created | FCM แจ้ง Riders 5km |
| `onOrderCreatedPush` | `product_orders/{id}` created | Web Push แจ้ง Seller |
| `onEscrowReleasedPush` | `escrow_records/{id}` updated | Web Push เมื่อ Escrow Release |
| `onNewMessagePush` | `conversations/{}/messages/{}` created | Web Push แจ้ง Recipient |

#### ⏰ Scheduled Tasks (Cron)
| Function | ตารางเวลา | หน้าที่ |
|----------|----------|--------|
| `dailyReset` | `0 0 * * *` (00:00 ทุกวัน) | Reset AI Quota ผู้ใช้ทุกคน |
| `scheduledPremiumCheck` | `0 */6 * * *` (ทุก 6 ชม.) | ตรวจ Premium หมดอายุ |
| `scheduledWeeklyCleanup` | `0 3 * * 0` (อาทิตย์ 03:00) | ลบ PIN เก่า + Logs เก่า |
| `scheduledPublisher` | `*/5 * * * *` (ทุก 5 นาที) | Publish Scheduled Products |
| `scheduledNewsAutomator` | `0 */4 * * *` (ทุก 4 ชม.) | ดึงข่าว Google RSS + AI วิเคราะห์ |
| `checkSellerTrialExpiry` | `0 8 * * *` (08:00 ทุกวัน) | ตรวจ Trial ร้านค้า |
| `autoReleaseEscrow` | `0 2 * * *` (02:00 ทุกวัน) | Auto Release Escrow 7 วัน |

---

## 🗂️ Firestore Collections

| Collection | สถานะ | หมายเหตุ |
|-----------|-------|---------|
| `line_users` | ✅ ใช้งาน | ข้อมูล User หลัก (LINE) |
| `users` | ✅ ใช้งาน | Firebase Auth Users |
| `marketplace_items` | ✅ ใช้งาน | สินค้า Marketplace |
| `community_products` | ✅ ใช้งาน | สินค้า OTOP |
| `product_orders` | ✅ ใช้งาน | Orders ทั้งหมด |
| `escrow_records` | ✅ ใช้งาน | Escrow Lock/Release |
| `seller_profiles` | ✅ ใช้งาน | โปรไฟล์ร้านค้า |
| `web_pins` | ✅ ใช้งาน | PIN Login (6 หลัก) |
| `line_auto_tokens` | ✅ ใช้งาน | Magic Login Token |
| `invoices` | ✅ ใช้งาน | ใบแจ้งหนี้ |
| `win_riders` | ✅ ใช้งาน | ข้อมูลวินมอเตอร์ไซค์ |
| `win_rider_requests` | ✅ ใช้งาน | คำขอเรียกวิน |
| `conversations` | ⚠️ Trigger เท่านั้น | ไม่มี CF สำหรับสร้าง/ส่ง |
| `push_subscriptions` | ✅ ใช้งาน | Web Push subscriptions |
| `news_feed` | ✅ ใช้งาน | ข่าวจาก AI Bot |
| `transactions` | ✅ ใช้งาน | บันทึกธุรกรรม Admin |
| `webhook_logs` | ✅ ใช้งาน | Debug logs |
| `ai_post_usage` | ✅ ใช้งาน | Quota AI สร้างโพสต์ |
| `edu_free_usage` | ✅ ใช้งาน | Education quota |
| `withdrawal_requests` | ⚠️ มีแต่ Pattern | ไม่มี Approval Flow CF |
| `product_reviews` | ❌ ยังไม่มี | ต้องสร้างระบบรีวิว |
| `loyalty_points` | ❌ ยังไม่มี | Loyalty System |
| `promotions` | ❌ ยังไม่มี | Promo Code System |
| `rider_locations` | ❌ ยังไม่มี | Real-time WIN Tracker |

---

## ⚠️ Bug ที่พบและสถานะ

| # | Bug | ไฟล์ | ความรุนแรง | สถานะ |
|---|-----|------|-----------|-------|
| 1 | `letterSpacing` ใน LINE Flex (400 Error) | `tuktuk_webhook.js` | 🔴 | **แก้แล้ว ✅** |
| 2 | Gemini `v1beta` URL ทำให้ 404 | `plastics_webhook.js`, `plastics_ai_engine.js` | 🔴 | **แก้แล้ว ✅** |
| 3 | LINE Channel Secret Hardcoded ในโค้ด | `admin_api_handlers.js`, `marketplace_functions.js` | 🔴 Security | **รอแก้** |
| 4 | `scheduledPremiumCheck` ใช้ Plastics LINE Client แทน TukTuk | `scheduled_tasks.js` | 🔴 | **รอแก้** |
| 5 | `adminBroadcast` รองรับแค่ 1 target | `admin_api_handlers.js` | 🟡 | Sprint 2 |
| 6 | Image Bucket `appinjproject-storage` hardcoded | `marketplace_functions.js` | 🟡 | Sprint 2 |
| 7 | Distance ใช้ Euclidean แทน Haversine | `tuktuk_functions.js` | 🟡 | Sprint 3 |
| 8 | `getUserAffinity` in Go return hardcoded `"10"` (Bangkok only) | `feed_service.go` | 🟡 | Sprint 3 |
| 9 | `AnalyticsService` ส่ง Mock Data เมื่อ SQL ไม่เชื่อมต่อ | `analytics_service.go` | 🟢 | Noted |
| 10 | `WarmAll()` warm 7 goroutines พร้อมกัน อาจ Throttle Firestore | `feed_service.go` | 🟢 | Noted |

---

## ✅ จุดแข็งของระบบ (Strengths)

### Go Engine
- ✅ **Concurrent Architecture** — Goroutines ทำ 4-7 tasks พร้อมกัน (Feed, News, Notif, Tags)
- ✅ **Anti-Gaming Feed Algorithm** — Log scale views, self-like exclusion, time decay
- ✅ **Dual Cache** — Memory fallback + Redis L2 (สลับอัตโนมัติ)
- ✅ **Cache Warmer** — Pre-warm ทุก 4 นาที ทำให้ Response ไว
- ✅ **IAM Middleware** — Firebase Token verify บน Protected Routes
- ✅ **Multi-DB** — Firestore (main) + PostgreSQL (analytics) + Redis (cache)
- ✅ **Observability** — Structured logging (slog), Metrics endpoint

### Cloud Functions
- ✅ **Complete Auth Flow** — PIN, Magic Link, LINE OAuth ครบ
- ✅ **Escrow System** — Verify → Lock → Release → Auto Release ครบวงจร
- ✅ **AI Integration** — Gemini Vision สำหรับสร้างโพสต์ขาย + News Bot
- ✅ **Scheduled Automation** — 7 Cron Jobs ครอบคลุม
- ✅ **Multi-Channel Notification** — LINE Push + FCM + Web Push

---

## ❌ สิ่งที่ขาด (Gaps by Priority)

### 🔴 Priority 1 — Critical

#### P1.1 ย้าย Secrets ออกจาก Code
```bash
# ตั้งค่าใน Firebase Secret Manager
firebase functions:secrets:set LINE_LOGIN_CHANNEL_SECRET
```
```javascript
// แทนที่ hardcode ด้วย
secrets: ["LINE_LOGIN_CHANNEL_SECRET"]
const secret = process.env.LINE_LOGIN_CHANNEL_SECRET;
```

#### P1.2 Fix scheduledPremiumCheck Channel
```javascript
// scheduled_tasks.js
// ❌ ปัจจุบัน
const lineClient = getInjectionClient(); // Plastics Channel!

// ✅ แก้เป็น
const { getTuktukClient } = require("./line_client");
const lineClient = getTuktukClient();
```

#### P1.3 Order Cancellation & Refund
```
cancelOrder(orderId, reason, cancelledBy)
  ├── status="pending" → cancel ทันที
  ├── status="paid_escrow" → Refund + อัปเดต Escrow
  └── แจ้ง LINE ทั้ง Buyer + Seller
```

---

### 🟡 Priority 2 — Important

#### P2.1 Real User Affinity (Go Engine)
```go
// feed_service.go
// ❌ ปัจจุบัน: Hardcoded
func (s *FeedService) getUserAffinity(userId string) UserAffinity {
    return UserAffinity{ProvinceCode: "10", Category: "Food"}
}

// ✅ ควรเป็น: Fetch จาก Firestore/Redis
func (s *FeedService) getUserAffinity(ctx context.Context, userId string) UserAffinity {
    // Fetch user.lastProvinceCode + user.topCategory จาก Cache
}
```

#### P2.2 Product Review System
```
Collection: product_reviews/{reviewId}
Fields: productId, buyerId, sellerId, orderId
        rating(1-5), comment, images[], helpful, createdAt

submitReview(orderId, rating, comment)
  → validate orderId.status = "completed"
  → update seller_profiles.averageRating
  → push LINE notification to seller
```

#### P2.3 Chat Cloud Functions
```
createConversation(productId, buyerId, sellerId) → threadId
sendMessage(threadId, text, attachments[])
markRead(threadId, userId)
getConversations(userId, limit)
```

#### P2.4 Seller Withdrawal Flow
```
requestWithdrawal(amount, bankName, accountNo, accountName)
  → validate amount ≤ available_balance
  → create withdrawal_requests/{id}
  → notify Admin via LINE

approveWithdrawal(withdrawalId)   ← Super Admin only
rejectWithdrawal(withdrawalId, reason)

Cron: processWithdrawals() ทุกวันจันทร์ 09:00
```

#### P2.5 Enhanced Admin Stats API
```javascript
// adminGetStats — ปัจจุบัน: แค่ totalUsers + totalProducts
// ✅ เพิ่มเป็น:
{
  totalUsers, activeUsers30d, newUsersToday,
  totalProducts, activeProducts,
  totalOrders, ordersToday, pendingOrders,
  totalRevenue, revenueThisMonth, revenueToday,
  totalSellers, activeSellers,
  pendingWithdrawals, totalEscrowHeld,
  avgOrderValue
}
```

---

### 🟢 Priority 3 — Enhancement

#### P3.1 Full-Text Search (Algolia)
```
Trigger: marketplace_items/{id} created/updated
  → sync to Algolia index

Cloud Function: searchProducts(query, filters)
  → Algolia API (Thai tokenization, typo tolerance)
```

#### P3.2 WIN Rider Real-time Location
```go
// ใช้ Haversine แทน Euclidean
func haversineKm(lat1, lng1, lat2, lng2 float64) float64 {
    const R = 6371.0
    dLat := (lat2 - lat1) * math.Pi / 180
    dLng := (lng2 - lng1) * math.Pi / 180
    a := math.Sin(dLat/2)*math.Sin(dLat/2) +
         math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
         math.Sin(dLng/2)*math.Sin(dLng/2)
    return R * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}
```

#### P3.3 Loyalty Points System
```
Collection: loyalty_points/{userId}
Events:
  ซื้อสินค้าทุก 100฿ = +10 pts
  เขียนรีวิว         = +5 pts
  ชวนเพื่อน          = +50 pts
  สมัครร้านค้า       = +100 pts

redeemPoints(pts, reward: "discount_50" | "premium_7days")
```

#### P3.4 Promotion / Coupon System
```
Collection: promotions/{promoId}
Fields: code, discountType(percent|fixed), value,
        minOrder, maxUses, usedCount, expiresAt, createdBy

applyPromoCode(code, orderId) → {discount, finalAmount}
createPromo(data)  ← Admin only
listActivePromos()
```

#### P3.5 Go Engine Analytics Enhancement
```go
// เพิ่ม route ใหม่สำหรับ Dashboard
v1.GET("/analytics/platform", iamMiddleware, func(c *gin.Context) {
    // Platform-wide stats
    // Total DAU, MAU, Revenue, Orders, Top Categories
})

v1.GET("/analytics/feed-performance", iamMiddleware, func(c *gin.Context) {
    // Feed CTR, Scroll depth, Session duration
})
```

---

## 🏁 Roadmap สรุป

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint 1 (1-2 สัปดาห์) — Security & Quick Fixes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ letterSpacing FIX (LINE Flex 400 Error)
  ✅ Gemini v1beta → v1 FIX
  🔧 LINE_CHANNEL_SECRET → Secret Manager
  🔧 scheduledPremiumCheck → TukTuk LINE Client
  🔧 adminGetStats → ข้อมูลครบ
  🔧 PIN Rate Limiting (≤5 req/hr)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint 2 (3-5 สัปดาห์) — Core Missing Features
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔧 cancelOrder + Refund Flow
  🔧 Product Review System (submitReview CF)
  🔧 Chat: createConversation + sendMessage CF
  🔧 Withdrawal Approval Flow
  🔧 [Go] Real User Affinity (ดึงจาก Firestore แทน Hardcode)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint 3 (6-8 สัปดาห์) — Growth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔧 Promo/Coupon Code System
  🔧 Daily Sales Summary Bot (LINE push ทุกเช้า Admin)
  🔧 [Go] Platform Analytics API Endpoint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint 4 (2-3 เดือน) — Scale & Polish
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔧 Algolia Full-Text Search Integration
  🔧 WIN Rider Real-time Location (Haversine + live_locations)
  🔧 Loyalty Points System
  🔧 [Go] Upgrade VM: shared-cpu-1x → performance-1x
  🔧 [Go] Add Min Machines Running = 1 (ลด cold start)
```

---

## 🚀 Deploy Commands

```bash
# Go Engine — Deploy ไป Fly.io
cd tuktuk-backend
flyctl deploy

# ตั้งค่า Secrets (ทำครั้งเดียว)
flyctl secrets set GOOGLE_CREDENTIALS_JSON="$(cat serviceAccountKey.json)"
flyctl secrets set REDIS_ADDR=redis://xxx
flyctl secrets set DATABASE_URL=postgres://xxx

# Cloud Functions — Deploy
cd functions
firebase deploy --only functions:lineWebhookTuktuk
firebase deploy --only functions   # Deploy ทั้งหมด
```

---

> **สถานะ:** Active Development  
> **อัปเดตล่าสุด:** 2026-03-11  
> **Repository:** `d:\Flutterapp\caculateapp\tuktuk-backend`
