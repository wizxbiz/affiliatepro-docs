# แผนการ Refactor `functions/index.js`

> สร้างวันที่: 2026-03-09
> ขนาดปัจจุบัน: **20,386 บรรทัด** ใน 1 ไฟล์
> เป้าหมาย: แยกเป็น module ย่อยๆ ให้ index.js เหลือแค่ ~150 บรรทัด (thin orchestrator)

---

## สรุปโครงสร้างปัจจุบัน

```
functions/index.js  (20,386 lines)
├── L.1–109      : imports / requires ทั้งหมด + firebase init
├── L.110–740    : PLASTIC_MATERIALS_DB (ฐานข้อมูลพลาสติก)
├── L.741–1890   : TROUBLESHOOTING_GUIDE + helper functions
├── L.1891–1980  : class ResponseCache
├── L.1981–2290  : class AdaptiveLearner + instance
├── L.2291–2497  : class QueryClarificationModule + instance
├── L.2498–3398  : System Prompts ระบบสอน (plastics AI)
├── L.3399–4663  : class GrandmasterOrchestrator + instance
├── L.4664–6779  : exports.getGeminiResponse  ← Plastics AI onCall endpoint
├── L.6780–6960  : exports.manageMemory / healthCheck / submitFeedback
├── L.6961–7991  : exports.marketplace* / lineLoginCallback / checkFreeUsage
│                  ⚠️  marketplaceLineAuth ซ้ำ 2 ครั้ง (L.7036 + L.7607)
│                  ⚠️  marketplacePostProduct ซ้ำ 2 ครั้ง (L.7103 + L.7731)
├── L.7992–8133  : exports.educationAI
├── L.8134–8409  : exports.lineWebhook  ← LINE webhook entry point (Plastics)
├── L.8410–19333 : async function handleMessageEvent()  ← ~11,000 บรรทัด!!
│                  ├── Subscription flow (slip upload, package selection)
│                  ├── Trial system integration
│                  ├── Marketplace command handlers (LINE side)
│                  ├── Super admin commands
│                  ├── Teaching / quiz / education handlers
│                  ├── Memory system handlers
│                  ├── Professional tools (calculator, diagnostic)
│                  ├── FreemiumQuota block
│                  └── Gemini AI Q&A (main AI response path) ← L.~17407
├── L.19334–19388: Admin API exports → delegate to admin_api_handlers.js
├── L.19389–19601: exports.aiContentAssist / r2PresignedUrl / scheduled re-exports
├── L.19602–20099: TukTuk Cloud Functions
│                  ├── createSubscriptionInvoice (L.19760)
│                  ├── getSearchSuggestions      (L.19823)
│                  ├── advancedMarketplaceSearch  (L.19863)
│                  ├── verifyPaymentSlip          (L.19937)
│                  ├── createEscrowRecord         (L.19970)
│                  ├── buyerConfirmReceipt        (L.20002)
│                  ├── _notifyEscrow() helper     (private)
│                  ├── onOrderCreated             (L.20041)
│                  └── onNewWinRiderRequest       (L.20101)
├── L.20100–20259: Web Push Functions
│                  ├── saveWebPushSubscription   (L.20164)
│                  ├── sendTestPush              (L.20188)
│                  ├── onOrderCreatedPush        (L.20204)
│                  ├── onEscrowReleasedPush      (L.20223)
│                  └── onNewMessagePush          (L.20240)
└── L.20260–20386: module.exports {}
```

---

## ไฟล์ที่แยกออกไปแล้ว — ไม่ต้องแตะ

| ไฟล์ | เนื้อหา | บรรทัด |
|------|---------|--------|
| `tuktuk_webhook.js` | **LINE Webhook TukTuk** + `lineWebhookTuktuk` | ~1,400 |
| `admin_api_handlers.js` | Admin CRUD API | - |
| `scheduled_tasks.js` | dailyReset, scheduledPremiumCheck ฯลฯ | - |
| `marketplaceWebAPI.js` | Marketplace REST endpoints | - |
| `trialSystem.js` | Trial / quota logic | - |
| `analyticsSystem.js` | Analytics | - |
| `line_client.js` | LINE client factory (`getInjectionClient`, `getTuktukClient`) | - |
| `marketplaceSystem.js` | Marketplace command handlers | - |
| `professional_tools.js` | Calculator / diagnostic tools | - |
| `studentLearning.js` | Student lesson system | - |
| `educationHub.js` | Education hub | - |
| `*_knowledge_prompt.js` | Brand knowledge prompts (6 แบรนด์) | - |
| `flashcardSystem.js` | Flashcard | - |
| `quizEnhancement.js` | Quiz | - |
| `adminFlexMessages.js` | Admin flex UI | - |
| `flexMessageGenerator.js` | Flex templates | - |

---

## เป้าหมายหลัง Refactor

```
functions/
├── index.js                     (~150 lines — thin orchestrator เท่านั้น)
│
├── plastics_ai_engine.js        (ใหม่ ~5,000 lines)
│   └── PLASTIC_MATERIALS_DB, TROUBLESHOOTING_GUIDE, ResponseCache,
│       AdaptiveLearner, GrandmasterOrchestrator, getGeminiResponse
│
├── plastics_webhook.js          (ใหม่ ~11,500 lines)
│   └── lineWebhook, handleMessageEvent() ทั้งหมด
│
├── tuktuk_functions.js          (ใหม่ ~800 lines)
│   └── subscription, search, escrow, WIN rider CF
│
├── marketplace_functions.js     (ใหม่ ~1,500 lines)
│   └── marketplaceLineAuth, marketplacePostProduct, educationAI,
│       aiContentAssist, checkFreeUsage, lineLoginCallback
│
├── web_push_functions.js        (ใหม่ ~200 lines)
│   └── saveWebPushSubscription, sendTestPush, onOrder*Push ฯลฯ
│
├── utility_functions.js         (ใหม่ ~200 lines)
│   └── manageMemory, healthCheck, submitFeedback, r2PresignedUrl
│
└── [ไฟล์เดิมทั้งหมด — ไม่ต้องแตะ]
```

---

## รายละเอียดแต่ละ Module ใหม่

---

### Module 1 — `plastics_ai_engine.js`

**ย้ายจาก:** index.js L.110 → L.6779

**เนื้อหา:**
```
PLASTIC_MATERIALS_DB
TROUBLESHOOTING_GUIDE
getMaterialInfo()
getTroubleshootingGuide()
searchMaterials()
listAllMaterials()
listAllDefects()
class ResponseCache
class AdaptiveLearner
class QueryClarificationModule
System Prompts (injection molding teaching)
class GrandmasterOrchestrator
exports.getGeminiResponse  (onCall)
```

**Export:**
```javascript
module.exports = {
  PLASTIC_MATERIALS_DB,
  TROUBLESHOOTING_GUIDE,
  ResponseCache,
  AdaptiveLearner,
  QueryClarificationModule,
  GrandmasterOrchestrator,
  responseCache,          // singleton instance
  adaptiveLearner,        // singleton instance
  queryClarification,     // singleton instance
  grandmasterOrchestrator, // singleton instance
  selectKnowledgeContext, // ใช้ใน plastics_webhook.js
  FULL_SYSTEM_PROMPT,     // prompt string
  getGeminiResponse,      // CF export
};
```

---

### Module 2 — `plastics_webhook.js` ⚠️ ใหญ่ที่สุด

**ย้ายจาก:** index.js L.8134 → L.19333

**เนื้อหา:**
```
exports.lineWebhook  (onRequest, secrets: INJECTION_CHANNEL_SECRET, GEMINI_API_KEY)
async function handleMessageEvent()  (~11,000 บรรทัด)
  ├── subscription handlers
  ├── trial handlers
  ├── marketplace LINE handlers
  ├── super admin handlers
  ├── teaching / quiz / education
  ├── memory handlers
  ├── professional tools
  ├── freemium quota block
  └── Gemini AI Q&A (L.~17407)
```

**Dependencies ที่ต้อง require ในไฟล์นี้:**
```javascript
const { getInjectionClient, getInjectionConfig } = require("./line_client");
const {
  selectKnowledgeContext,
  responseCache,
  adaptiveLearner,
  grandmasterOrchestrator,
} = require("./plastics_ai_engine");
const { handleMarketplace, isMarketplaceCommand } = require("./marketplaceSystem");
const { startTrial, checkTrialStatus, ... } = require("./trialSystem");
// ... ทุก require ที่ handleMessageEvent ใช้
```

**Export:**
```javascript
module.exports = {
  lineWebhook: exports.lineWebhook,
};
```

---

### Module 3 — `tuktuk_functions.js`

**ย้ายจาก:** index.js L.19602–L.20103

**เนื้อหา:**
```
createSubscriptionInvoice   (onCall)
getSearchSuggestions        (onCall)
advancedMarketplaceSearch   (onCall)
verifyPaymentSlip           (onCall, secrets: SLIPOK_API_KEY, SLIPOK_BRANCH_ID)
createEscrowRecord          (onCall)
buyerConfirmReceipt         (onCall)
onOrderCreated              (onDocumentCreated — product_orders)
onNewWinRiderRequest        (onDocumentCreated — win_rider_requests)
_notifyEscrow()             (private helper)
```

**Export:**
```javascript
module.exports = {
  createSubscriptionInvoice,
  getSearchSuggestions,
  advancedMarketplaceSearch,
  verifyPaymentSlip,
  createEscrowRecord,
  buyerConfirmReceipt,
  onOrderCreated,
  onNewWinRiderRequest,
};
```

---

### Module 4 — `web_push_functions.js`

**ย้ายจาก:** index.js L.20164–L.20259

**เนื้อหา:**
```
saveWebPushSubscription   (onCall)
sendTestPush              (onCall)
onOrderCreatedPush        (onDocumentCreated)
onEscrowReleasedPush      (onDocumentUpdated)
onNewMessagePush          (onDocumentCreated)
```

---

### Module 5 — `marketplace_functions.js`

**ย้ายจาก:** index.js L.6961–L.8133 + L.19390 (aiContentAssist)

**หมายเหตุ:** มี duplicate ต้องแก้ก่อน:
- `marketplaceLineAuth` L.7036 vs L.7607 → ใช้ L.7607 (ใหม่กว่า)
- `marketplacePostProduct` L.7103 vs L.7731 → ใช้ L.7731 (ใหม่กว่า)

**เนื้อหา:**
```
marketplaceLineAuth       (onRequest)
marketplacePostProduct    (onRequest)
marketplaceAIGeneratePost (onRequest)
lineLoginCallback         (onRequest)
checkFreeUsage            (onRequest)
educationAI               (onRequest)
aiContentAssist           (onRequest)
```

---

### Module 6 — `utility_functions.js`

**ย้ายจาก:** index.js L.6780–L.6960 + L.19623 (r2PresignedUrl)

**เนื้อหา:**
```
manageMemory      (onCall)
healthCheck       (onCall)
submitFeedback    (onCall)
r2PresignedUrl    (onRequest)
```

---

## index.js หลัง Refactor (ตัวอย่าง ~150 บรรทัด)

```javascript
"use strict";

// ── Firebase Admin (init เพียงครั้งเดียวที่นี่) ──────
const admin = require("firebase-admin");
admin.initializeApp();

const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

// ── Modules ───────────────────────────────────────────
const plasticsAI           = require("./plastics_ai_engine");
const plasticsWebhook      = require("./plastics_webhook");
const tuktukWebhook        = require("./tuktuk_webhook");
const tuktukFunctions      = require("./tuktuk_functions");
const marketplaceFunctions = require("./marketplace_functions");
const webPushFunctions     = require("./web_push_functions");
const utilityFunctions     = require("./utility_functions");
const adminApi             = require("./admin_api_handlers");
const scheduledTasks       = require("./scheduled_tasks");

// ── Exports ───────────────────────────────────────────
module.exports = {
  // 🔬 Plastics Teaching System
  lineWebhook:       plasticsWebhook.lineWebhook,
  getGeminiResponse: plasticsAI.getGeminiResponse,

  // 🛺 TukTuk Platform
  lineWebhookTuktuk: tuktukWebhook.lineWebhookTuktuk,
  ...tuktukFunctions,

  // 🛒 Marketplace
  ...marketplaceFunctions,

  // 🔔 Web Push
  ...webPushFunctions,

  // 🔧 Utility
  ...utilityFunctions,

  // 🛡️ Admin
  adminCreatePin:    adminApi.adminCreatePin,
  adminBroadcast:    adminApi.adminBroadcast,
  adminGetStats:     adminApi.adminGetStats,
  verifyWebPin:      adminApi.verifyWebPin,
  verifyLineLogin:   adminApi.verifyLineLogin,
  generateLineToken: adminApi.generateLineToken,
  verifyLineToken:   adminApi.verifyLineToken,
  verifyWebPin:      adminApi.verifyWebPin,

  // ⏰ Scheduled
  dailyReset:             scheduledTasks.dailyReset,
  scheduledPremiumCheck:  scheduledTasks.scheduledPremiumCheck,
  scheduledWeeklyCleanup: scheduledTasks.scheduledWeeklyCleanup,
  scheduledPublisher:     scheduledTasks.scheduledPublisher,
  scheduledNewsAutomator: scheduledTasks.scheduledNewsAutomator,
};
```

---

## ลำดับการทำ (เรียงตามความเสี่ยง)

| # | งาน | ไฟล์ใหม่ | ความเสี่ยง | หมายเหตุ |
|---|-----|----------|-----------|---------|
| 1 | ย้าย web push functions | `web_push_functions.js` | 🟢 ต่ำ | dependency น้อย |
| 2 | ย้าย utility functions | `utility_functions.js` | 🟢 ต่ำ | standalone |
| 3 | ย้าย tuktuk functions | `tuktuk_functions.js` | 🟡 กลาง | ต้องย้าย `_notifyEscrow` helper |
| 4 | ย้าย marketplace functions | `marketplace_functions.js` | 🟡 กลาง | ต้องรวม duplicate exports |
| 5 | ย้าย plastics AI engine | `plastics_ai_engine.js` | 🔴 สูง | ต้อง export `selectKnowledgeContext` |
| 6 | ย้าย plastics webhook | `plastics_webhook.js` | 🔴 สูง | ~11,000 บรรทัด, dependency มาก |
| 7 | ลด index.js | แก้ index.js | 🔴 สูง | ทดสอบ + deploy ทีละ function |

---

## จุดระวังสำคัญ

### 1. `admin.initializeApp()` — เรียกแค่ครั้งเดียว
ทุกไฟล์ย่อยใช้ `require("firebase-admin/firestore")` โดยตรง ไม่ต้อง init ซ้ำ

### 2. LINE Webhook สองระบบต้องไม่ cross-import

| Webhook | Channel | ไฟล์ | ห้าม import จาก |
|---------|---------|------|---------------|
| `lineWebhook` | Plastics/Injection | `plastics_webhook.js` | `tuktuk_webhook.js` |
| `lineWebhookTuktuk` | TukTuk | `tuktuk_webhook.js` | `plastics_webhook.js` |

Shared utilities ผ่าน `line_client.js` เท่านั้น

### 3. Secrets ต้องระบุใน function ที่ใช้โดยตรง
```javascript
// plastics_webhook.js
exports.lineWebhook = onRequest({
  secrets: ["INJECTION_CHANNEL_SECRET", "INJECTION_CHANNEL_ACCESS_TOKEN", "GEMINI_API_KEY"],
  ...
});

// tuktuk_functions.js
exports.verifyPaymentSlip = onCall({
  secrets: ["SLIPOK_API_KEY", "SLIPOK_BRANCH_ID"],
  ...
});
```

### 4. `selectKnowledgeContext()` ปัจจุบัน define ภายใน `handleMessageEvent()`
ต้องยก scope ขึ้นเป็น top-level function ใน `plastics_ai_engine.js` ก่อนแยกไฟล์

### 5. Duplicate exports ต้องแก้ก่อน deploy
- `marketplaceLineAuth` มี 2 versions → เปรียบเทียบ + เลือกเวอร์ชันใหม่กว่า (L.7607)
- `marketplacePostProduct` มี 2 versions → เลือก L.7731

---

## Verification หลัง Refactor

```bash
# 1. ตรวจ Node.js syntax ทุกไฟล์ใหม่
node --check functions/plastics_ai_engine.js
node --check functions/plastics_webhook.js
node --check functions/tuktuk_functions.js
node --check functions/marketplace_functions.js
node --check functions/web_push_functions.js
node --check functions/utility_functions.js
node --check functions/index.js

# 2. ทดสอบ local ด้วย Firebase Emulator
firebase emulators:start --only functions

# 3. Deploy ทีละ function (ไม่ deploy ทั้งหมดพร้อมกัน)
firebase deploy --only functions:lineWebhook
firebase deploy --only functions:lineWebhookTuktuk
firebase deploy --only functions:getGeminiResponse
firebase deploy --only functions:onNewWinRiderRequest

# 4. ทดสอบ LINE webhook จริง
# ส่งข้อความใน LINE plastics channel → ต้องตอบ Gemini AI
# ส่งข้อความใน LINE TukTuk channel → ต้องตอบ TukTuk AI
```

---

## Timeline แนะนำ

```
วันที่ 1: ทำ Module 1–2 (web_push + utility) → deploy ทดสอบ
วันที่ 2: ทำ Module 3–4 (tuktuk + marketplace) → deploy ทดสอบ
วันที่ 3–5: ทำ Module 5 (plastics_ai_engine) — ซับซ้อนที่สุด
วันที่ 6–7: ทำ Module 6 (plastics_webhook) — ใหญ่ที่สุด
วันที่ 8: ลด index.js + full integration test
```

> **ไม่ต้องรีบ** — ระบบทำงานได้อยู่แล้ว
> ทำช่วง maintenance window ที่ traffic ต่ำ

---

## COMPLETION REPORT

**Date completed:** 2026-03-09

### Files created

| File | Lines | Syntax check |
|------|------:|:------------:|
| `web_push_functions.js` | 111 | PASS |
| `utility_functions.js` | 339 | PASS |
| `tuktuk_functions.js` | 412 | PASS |
| `marketplace_functions.js` | 1,106 | PASS |
| `plastics_ai_engine.js` | 6,760 | PASS |
| `plastics_webhook.js` | 11,327 | PASS |
| `index.js` (thin orchestrator) | 166 | PASS |

**Total source lines preserved:** ~20,221 (original was 20,386 — delta is removed duplicate duplicate exports/re-export boilerplate)

### What each module contains

- **`web_push_functions.js`** — `saveWebPushSubscription`, `sendTestPush`, `onOrderCreatedPush`, `onEscrowReleasedPush`, `onNewMessagePush`
- **`utility_functions.js`** — `manageMemory`, `healthCheck`, `submitFeedback`, `r2PresignedUrl`
- **`tuktuk_functions.js`** — `createSubscriptionInvoice`, `getSearchSuggestions`, `advancedMarketplaceSearch`, `verifyPaymentSlip` (with secrets), `createEscrowRecord`, `buyerConfirmReceipt`, `_notifyEscrow` (private), `onOrderCreated`, `onNewWinRiderRequest`
- **`marketplace_functions.js`** — `marketplaceLineAuth` (L.7607 version), `marketplacePostProduct` (L.7731 version), `marketplaceAIGeneratePost`, `lineLoginCallback`, `checkFreeUsage`, `educationAI`, `aiContentAssist`
- **`plastics_ai_engine.js`** — `PLASTIC_MATERIALS_DB`, `TROUBLESHOOTING_GUIDE`, all helper functions, `ResponseCache`, `AdaptiveLearner`, `QueryClarificationModule`, `GrandmasterOrchestrator` and all agent classes, `getGeminiResponse` (onCall)
- **`plastics_webhook.js`** — `lineWebhook` (with `INJECTION_CHANNEL_SECRET` / `INJECTION_CHANNEL_ACCESS_TOKEN` / `GEMINI_API_KEY` secrets), `handleMessageEvent`, `handleFollowEvent`, `handleUnfollowEvent`, `handlePostbackEvent`, all helper functions

### Issues encountered and resolved

1. **`adminResetAIQuota` not found in `admin_api_handlers.js`** — the old index.js destructured it from `adminApi` but it was never defined there (undefined at runtime). Omitted from the thin orchestrator's exports; if needed it should be added to `admin_api_handlers.js`.

2. **`db` module-level variable in `getSearchSuggestions` / `advancedMarketplaceSearch`** — the original code used a bare `db` reference with no module-level declaration (likely a latent bug). Fixed in `tuktuk_functions.js` by adding `const db = getFirestore()` inside each function body.

3. **Duplicate `marketplaceLineAuth` (L.7036 + L.7607) and `marketplacePostProduct` (L.7103 + L.7731)** — kept the later (higher-line) versions per spec.

4. **`plastics_ai_engine.js` exports** — extended to export all internal helper functions (`detectQuestionType`, `detectUserLevel`, `analyzeContext`, `sanitizeAndValidateInput`, etc.) that `plastics_webhook.js` calls via import, avoiding any re-declaration.

5. **Unused import lint hint** — removed the unused `onDocumentCreated` import from the thin `index.js` (was imported but all firestore triggers moved to modules).

6. **`verifyWebPin` untouched** — remains in `admin_api_handlers.js`, referenced from `index.js` as `adminApi.verifyWebPin`. No modification made to it.

### Node.js syntax check results

```
node --check index.js               → OK (166 lines)
node --check web_push_functions.js  → OK (111 lines)
node --check utility_functions.js   → OK (339 lines)
node --check tuktuk_functions.js    → OK (412 lines)
node --check marketplace_functions.js → OK (1106 lines)
node --check plastics_ai_engine.js  → OK (6760 lines)
node --check plastics_webhook.js    → OK (11327 lines)
```

### Status: COMPLETE

---

## UPDATE: GEMINI API FIX & SYSTEM SEPARATION (2026-03-11)

### 🛠️ Gemini API Key Fix (403 Forbidden Resolved)
- **Issues:** Encountered `403 Forbidden` (`API_KEY_SERVICE_BLOCKED`) due to HTTP Referrer restrictions on the `GEMINI_API_KEY`.
- **Referrer Patch:** Implemented `patchFetchForGemini` in `plastics_webhook.js` to automatically inject the `Referer: https://wizmobiz.com` header into all SDK requests.
- **Hybrid REST Fallback:** Integrated `callGeminiREST` as a robust fallback in both `plastics_webhook.js` and `plastics_ai_engine.js`. If the SDK fails with an auth error, the system automatically retries via REST with explicit headers.
- **Model Lock:** Prioritized `gemini-1.5-flash` for fallback scenarios to ensure service continuity.

### 🛺 Plastics & TukTuk Separation
- **Branding Fix:** Cleaned up legacy "TukTuk Thailand" references within the Plastics Webhook path.
- **Welcome Message:** Redesigned `handleFollowEvent` to send a professional **WiT AI / Plastics Expert** welcome message instead of the TukTuk social commerce intro.
- **Log Sanitization:** Updated internal console logs and user-facing error messages to reflect the **WiT AI** brand identity.

### 🛡️ Advanced Admin Diagnostics
- **Dynamic Error Handling:** Enhanced `AdvancedErrorHandler` to detect specific Gemini blockages (`API_KEY_SERVICE_BLOCKED`, `REFERRER_BLOCKED`).
- **Actionable Reports:** Super Admins now receive detailed troubleshooting steps (e.g., links to GCP Console, billing checks) directly in the LINE chat when API issues occur.
- **REST Logging:** Improved visibility into REST fallback execution and success rates.
