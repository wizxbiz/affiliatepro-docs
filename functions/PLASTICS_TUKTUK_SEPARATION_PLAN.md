# แผนการแยก Plastics ออกจาก TukTuk Thailand
> วิเคราะห์วันที่: 2026-03-09
> ไฟล์เป้าหมาย: `functions/plastics_webhook.js` (lineWebhook) + `functions/tuktuk_webhook.js` (lineWebhookTuktuk)

---

## 🔴 ปัญหาเร่งด่วน: Gemini API ยังโดน Block ทุก Model

### Root Cause (แท้จริง)
```
403 API_KEY_HTTP_REFERRER_BLOCKED
reason: "API_KEY_HTTP_REFERRER_BLOCKED"
httpReferrer: "<empty>"
```

**ปัญหาไม่ได้อยู่ที่ model** — ไม่ว่าจะใช้ `gemini-2.5-pro` หรือ `gemini-2.0-flash`
ปัญหาอยู่ที่ **GEMINI_API_KEY มีการตั้ง HTTP Referrer Restriction** ใน Google Cloud Console
Cloud Functions ไม่ส่ง `Referer` header → ทุก request ถูก block

### วิธีแก้ (ต้องทำก่อนทุกอย่าง)

#### Option A — แก้ที่ Google Cloud Console (แนะนำ)
1. ไปที่ [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. คลิก API Key ที่ใช้กับ Gemini
4. ใต้ "API restrictions" → "Application restrictions"
5. เปลี่ยนจาก **"HTTP referrers (web sites)"** → **"None"** หรือ **"IP addresses"**
6. บันทึก → รอ ~5 นาที

#### Option B — แก้ในโค้ด (Workaround ถ้าแก้ Console ไม่ได้)
เพิ่ม Referer header ผ่าน REST API ตรงๆ แทน SDK:

```javascript
// เพิ่ม helper ใน plastics_ai_engine.js
async function callGeminiREST(apiKey, model, systemPrompt, history, userMessage, config = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      ...history,
      { role: "user", parts: [{ text: userMessage }] }
    ],
    generationConfig: {
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxOutputTokens ?? 2048,
    }
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://appinjproject.web.app",  // ← key: ส่ง Referer ที่ allowed
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(JSON.stringify(err));
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
```

---

## วิเคราะห์ปัญหาการปนกัน

### ❌ TukTuk content ที่อยู่ใน `plastics_webhook.js` (ไม่ควรมี)

| # | บรรทัด | ปัญหา | ระดับ |
|---|--------|--------|-------|
| 1 | L.308–316 | `handleQuickReply()` greeting → กล่าวถึง "TukTuk Thailand", "TukTuk Feed" | 🟡 แก้แล้วบางส่วน |
| 2 | L.10700–10738 | `handleFollowEvent()` → ส่ง `tuktukFlex.createTuktukFriendWelcomeMessage()` | 🔴 Critical Bug |
| 3 | L.10708 | `tuktukFlex.createTuktukFriendWelcomeMessage()` → `tuktukFlex` ไม่ได้ import! | 🔴 ReferenceError |
| 4 | L.47 | `require("./marketplaceSystem")` → Marketplace module โหลดอยู่ใน plastics | 🟡 ไม่จำเป็น |
| 5 | L.588–594 | `isMarketplaceCommand()` + `handleMarketplace()` ใน text handler | 🟡 ปนกัน |
| 6 | L.425–432 | `handleMarketplace()` ใน image handler (marketplace image flow) | 🟡 ปนกัน |
| 7 | L.460 | Image analysis system prompt → กล่าวถึง "ผู้ช่วย TukTuk Thailand" | 🟡 ปนกัน |
| 8 | L.1121, L.1145 | PIN reply → link `https://tuktukfeed.com/login.html` | 🟢 ยอมรับได้ (shared) |
| 9 | L.257–258 | `analyzeQuestionContext()` → feed/content/video detection | 🟡 แก้แล้ว |

### ✅ สิ่งที่อยู่ถูกที่แล้วใน `plastics_webhook.js`
- Injection Molding Q&A, Professional Tools, Admin commands
- Teaching/Quiz/Education system (injection molding)
- Memory system, Freemium quota
- PIN system (ใช้ร่วมกับ TukTuk ได้ → shared `line_users`)
- Feedback like/unlike

### ❌ Plastics content ที่อาจปนใน `tuktuk_webhook.js`
> ตรวจแล้ว: **ไม่มีปัญหา** — `tuktuk_webhook.js` แยกสะอาดแล้ว
> ใช้ `getTuktukClient()` แยกจาก `getInjectionClient()`
> Gemini ปิดอยู่ (`Gemini disabled for TukTuk` — L.2546)

---

## แผนงาน (Phase 1–4)

### Phase 1 — แก้ Gemini API Key (🔴 ด่วนที่สุด)

**ทำก่อนทุกอย่าง — ปัจจุบัน AI ตอบไม่ได้เลย**

```
Option A: Google Cloud Console → ลบ HTTP Referrer Restriction จาก GEMINI_API_KEY
Option B: เพิ่ม callGeminiREST() helper ใน plastics_ai_engine.js ส่ง Referer header
```

**ไฟล์ที่แก้:**
- `functions/plastics_ai_engine.js` (ถ้าใช้ Option B)

---

### Phase 2 — แก้ `handleFollowEvent()` (🔴 Critical Bug)

**ปัญหา:** `tuktukFlex` ไม่ได้ import → ReferenceError ทุกครั้งที่ user เพิ่ม bot เป็นเพื่อน

**ก่อน:**
```javascript
async function handleFollowEvent(event) {
  const profile = await lineClient.getProfile(userId);
  // 🛺 ใช้ TukTuk Thailand Welcome Message  ← ผิด!
  const welcomeFlex = tuktukFlex.createTuktukFriendWelcomeMessage(profile.displayName);
  // ...TukTuk specific text...
}
```

**หลัง:**
```javascript
async function handleFollowEvent(event) {
  const profile = await lineClient.getProfile(userId);

  // 🏭 ส่ง Plastics Welcome Message
  await lineClient.pushMessage(userId, {
    type: "text",
    text: `👋 สวัสดีครับคุณ ${profile.displayName}!\n\n` +
      `🏭 ยินดีต้อนรับสู่ระบบผู้ช่วย AI ด้านวิศวกรรมพลาสติก\n\n` +
      `ถามผมได้ทุกเรื่อง:\n` +
      `🔧 พารามิเตอร์ฉีดขึ้นรูป\n` +
      `🧪 คุณสมบัติพลาสติก PP/ABS/PA/PC\n` +
      `⚠️ การแก้ Defects: Sink mark, Warpage, Flash\n` +
      `🤖 ตั้งค่าเครื่อง Porcheson/Toshiba/FANUC/Yushin\n\n` +
      `💬 พิมพ์ถามได้เลยครับ!`,
  });
}
```

**ไฟล์ที่แก้:** `functions/plastics_webhook.js` L.10700–10738

---

### Phase 3 — แยก Marketplace Handler (🟡 กลาง)

**ปัญหา:** `handleMarketplace()` ถูกเรียกใน plastics webhook ทั้ง text (L.588) และ image (L.425)
Marketplace เป็นฟีเจอร์ TukTuk Thailand → ควรอยู่ใน `tuktuk_webhook.js` เท่านั้น

**วิเคราะห์:** ทั้ง plastics bot และ TukTuk bot ใช้ `line_users` collection เดียวกัน
แต่ Marketplace commands เช่น `ขาย`, `หาของ`, `โพสต์สินค้า` ควรตอบว่า "ใช้ TukTuk LINE แทน"

**แก้ใน `plastics_webhook.js`:**
```javascript
// ก่อน (L.588): เรียก handleMarketplace ตรงๆ
if (isMarketplaceCommand(message.text)) {
  const handled = await handleMarketplace({lineClient, db}, event, userData);
  if (handled) return;
}

// หลัง: redirect แจ้ง user
if (isMarketplaceCommand(message.text)) {
  await lineClient.replyMessage(replyToken, {
    type: "text",
    text: `🛒 สำหรับ Marketplace กรุณาใช้งานผ่าน TukTuk Thailand LINE Bot\n\nช่องทางนี้รองรับเฉพาะคำถามด้านพลาสติกและการฉีดขึ้นรูปครับ`
  });
  return;
}
```

**ไฟล์ที่แก้:** `functions/plastics_webhook.js` L.425–432, L.588–594, L.11096

---

### Phase 4 — แก้ Image Analysis System Prompt (🟡 กลาง)

**ปัญหา:** L.460 — system prompt ระบุ "ผู้ช่วย TukTuk Thailand" ใน plastics image handler

**ก่อน (L.460):**
```javascript
คุณคือ "ผู้ช่วย TukTuk Thailand" AI อัจฉริยะประจำแพลตฟอร์ม Social Commerce
```

**หลัง:**
```javascript
คุณคือ "ผู้ช่วย AI ด้านวิศวกรรมพลาสติกและการฉีดขึ้นรูป"
วิเคราะห์ภาพที่ได้รับในบริบทของงานพลาสติก:
- ถ้าเป็นรูปชิ้นงาน: วิเคราะห์ defect ที่เห็น
- ถ้าเป็นรูปเครื่องจักร: ระบุรุ่น/ยี่ห้อ และให้คำแนะนำ
- ถ้าเป็นรูปสูตรพลาสติก: อ่านค่าและแปลผล
```

**ไฟล์ที่แก้:** `functions/plastics_webhook.js` L.454–534

---

## สรุปลำดับการทำงาน

| # | Phase | งาน | ไฟล์ | เวลา | ความเสี่ยง |
|---|-------|-----|------|------|-----------|
| 1 | API Key Fix | ลบ HTTP Referrer Restriction | Google Cloud Console หรือ `plastics_ai_engine.js` | 5 นาที | 🔴 ด่วน |
| 2 | Follow Event | แทน TukTuk welcome → Plastics welcome | `plastics_webhook.js` L.10700 | 10 นาที | 🔴 Bug |
| 3 | Marketplace | Redirect แทน handle ตรงๆ | `plastics_webhook.js` L.425, 588, 11096 | 15 นาที | 🟡 กลาง |
| 4 | Image Prompt | แก้ system prompt ไม่กล่าวถึง TukTuk | `plastics_webhook.js` L.460 | 10 นาที | 🟡 กลาง |
| 5 | Deploy | `firebase deploy --only functions:lineWebhook --force` | — | 5 นาที | 🟢 ต่ำ |

---

## สถานะหลังแก้ไขครบ

| Feature | lineWebhook (Plastics) | lineWebhookTuktuk (TukTuk) |
|---------|----------------------|--------------------------|
| Greeting | 🏭 AI พลาสติก | 🛺 TukTuk Thailand |
| Follow welcome | 🏭 Injection Molding | 🛺 Feature showcase |
| Image analysis | 🔬 Defect/Machine analysis | (ปิดอยู่) |
| Marketplace | ❌ Redirect → TukTuk bot | ✅ Full support |
| Gemini Q&A | ✅ ไม่โดน block | ✅ ไม่ใช้ Gemini |
| PIN system | ✅ ใช้ร่วมกัน (`line_users`) | ✅ ใช้ร่วมกัน |
| Admin commands | ✅ Full admin panel | ✅ TukTuk admin |

---

## Dependency Graph (ปัจจุบัน vs เป้าหมาย)

### ปัจจุบัน (ปนกัน ❌)
```
plastics_webhook.js
    ├── marketplaceSystem.js   ← TukTuk feature
    ├── tuktukFlexMessages.js  ← ไม่ได้ import (ReferenceError!)
    ├── GEMINI_API_KEY         ← blocked by referrer restriction
    └── injection molding modules ✅
```

### เป้าหมาย (แยกสะอาด ✅)
```
plastics_webhook.js                    tuktuk_webhook.js
    ├── injection_molding_expert  ✅       ├── marketplaceSystem ✅
    ├── plastic_materials_prompt  ✅       ├── tuktukFlexMessages ✅
    ├── professional_tools        ✅       ├── win_rider logic ✅
    ├── teaching_handler          ✅       └── TukTuk LINE client ✅
    ├── callGeminiREST()          ✅
    └── Plastics LINE client      ✅
```
