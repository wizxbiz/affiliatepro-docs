# 💬 LINE Webhook Setup Guide (Cloudflare Workers)

**Updated:** 2026-07-13
**Runtime:** Cloudflare Workers (`tuktukfeed-api`) — ย้ายจาก Firebase Functions แล้ว
**Handler:** [`workers/handlers/line-webhook.js`](../workers/handlers/line-webhook.js)

> ⚠️ เอกสารเวอร์ชันเก่าอ้างถึง Firebase (`cloudfunctions.net/lineWebhook`, `firebase deploy`)
> ระบบปัจจุบัน **ไม่ได้ใช้ Firebase แล้ว** โปรดใช้ขั้นตอน Cloudflare ด้านล่างนี้เท่านั้น

---

## 🎯 Webhook URLs

ระบบรองรับ 2 บอทแยก channel:

| บอท | Webhook URL | ใช้สำหรับ |
|-----|-------------|-----------|
| **TukTuk Feed** | `https://tuktukfeed.com/api/webhook/line-tuktuk` | Marketplace, PIN, ค้นสินค้า, AI |
| **Injection (WiT365)** | `https://tuktukfeed.com/api/webhook/line` | ผู้ช่วยงานฉีดพลาสติก + AI |

> เส้นทางสำรอง (mount เดียวกัน): `POST /api/line/webhook` และ `POST /api/line/webhook-tuktuk`

---

## ⚙️ Setup Steps

### **Step 1: ตั้งค่า Secrets ผ่าน Wrangler**

Secret เก็บใน Cloudflare (ไม่ commit ลง repo) ตั้งด้วยคำสั่ง:

```bash
cd workers

# TukTuk channel
npx wrangler@3 secret put TUKTUK_CHANNEL_SECRET
npx wrangler@3 secret put TUKTUK_CHANNEL_ACCESS_TOKEN

# Injection (WiT365) channel
npx wrangler@3 secret put INJECTION_CHANNEL_SECRET
npx wrangler@3 secret put INJECTION_CHANNEL_ACCESS_TOKEN
```

**ค่า secret หาได้จาก** LINE Developers Console → Channel → Messaging API:
- `*_CHANNEL_SECRET` = Basic settings → Channel secret
- `*_CHANNEL_ACCESS_TOKEN` = Messaging API → Channel access token (long-lived)

> Handler รองรับ fallback: ถ้าไม่ได้ตั้ง `INJECTION_*` จะลองใช้ `LINE_CHANNEL_SECRET` /
> `LINE_CHANNEL_ACCESS_TOKEN` แทน (ดู `getLineCredentialCandidates`)

### **Step 2: ตรวจ env vars ที่ไม่ใช่ความลับ** ([`workers/wrangler.toml`](../workers/wrangler.toml))

```toml
LINE_CHANNEL_ID = "2009159046"
LINE_WEBHOOK_VERIFY_DISABLED = "false"           # ต้องเป็น false ใน production
TUKTUK_LINE_WEBHOOK_VERIFY_DISABLED = "false"
LINE_WEBHOOK_SIGNATURE_SOFT_FAIL = "false"       # ⬅️ ตั้ง false เมื่อ secret ครบแล้ว
TUKTUK_LINE_WEBHOOK_SIGNATURE_SOFT_FAIL = "false"
```

### **Step 3: Deploy**

```bash
cd workers
npx wrangler@3 deploy
```

### **Step 4: ตั้งค่า LINE Developers Console**

สำหรับ **แต่ละ** channel:
1. เข้า [LINE Developers Console](https://developers.line.biz/console/) → เลือก Channel
2. **Messaging API** → Webhook settings:
   - Webhook URL: ใส่ URL ตามตารางด้านบน (TukTuk / Injection)
   - Use webhook: **ON**
   - คลิก **Verify** → ควรได้ **Success** ✅
3. **Basic settings / Messaging API**:
   - Auto-reply messages: **Disabled**
   - Greeting messages: **Disabled** (บอทส่ง welcome เองผ่าน follow event)

---

## 🔐 Signature Verification & Soft-Fail

Handler ตรวจ `X-Line-Signature` ด้วย HMAC-SHA256 เทียบกับ channel secret

| ตัวแปร | ค่าแนะนำ | ความหมาย |
|--------|----------|----------|
| `*_VERIFY_DISABLED` | `false` | ถ้า `true` = ข้ามการตรวจ signature ทั้งหมด (อันตราย ใช้ debug เท่านั้น) |
| `*_SIGNATURE_SOFT_FAIL` | `false` | ถ้า `true` = signature ผิดก็ยัง**ประมวลผลต่อ** (แค่ warn) |

> 🔴 **ความปลอดภัย:** `SOFT_FAIL=true` เปิดช่องให้ยิง webhook ปลอมเข้ามาสั่ง PIN/ส่งข้อความได้
> ควรตั้ง `false` เสมอใน production หลังยืนยันว่า secret ตั้งถูกครบแล้ว
> ใช้ `true` ชั่วคราวเฉพาะตอน migrate/debug signature เท่านั้น

---

## 🧪 Testing

### **Test 1: Verify ใน Console**
คลิก **Verify** ใน Webhook settings → ควรได้ **Success**
(handler ตอบ `200 OK` ทันทีเมื่อ `events` ว่างเปล่า)

### **Test 2: เพิ่มเพื่อน → Welcome**
สแกน QR เพิ่มบอทเป็นเพื่อน → ควรได้ **ข้อความต้อนรับ + quick reply** ทันที
(follow event → `handleFollowEventsBackground` → `buildWelcomeMessages`)

### **Test 3: ส่งข้อความ**

| บอท | ทดสอบพิมพ์ | ผลที่คาดหวัง |
|-----|-----------|-------------|
| TukTuk | `รหัส` | Flex Message PIN 6 หลัก + ปุ่มเข้าสู่ระบบ |
| TukTuk | `ตลาด` | ลิงก์ Marketplace + quick reply |
| TukTuk | `หา เสื้อ` | Carousel สินค้า |
| TukTuk | `มีเสื้อสีดำไหม` | คำตอบจาก AI (ข้อความสั้นที่เป็นคำถามก็เข้า AI ได้) |
| Injection | `เมนู` | เมนู WiT365 + quick reply |
| Injection | `short shot แก้ยังไง` | ไล่สาเหตุ + วิธีแก้จาก knowledge/AI |

---

## 🔍 Monitoring & Debug

### **Debug endpoint (post-deploy):**
```
GET https://tuktukfeed.com/api/line/debug
```
คืนสถานะ token (boolean), ค่า verify/soft-fail และ log ล่าสุดจาก KV:
`lastWebhookError`, `lastReplyError`, `lastPinFlow`, `lastLineEvent`, `lastTuktukFeature`

### **Live logs:**
```bash
cd workers
npx wrangler@3 tail
```

---

## 🔧 Troubleshooting

| อาการ | สาเหตุที่พบบ่อย | วิธีแก้ |
|------|----------------|--------|
| Verify failed | ยังไม่ deploy / URL ผิด | `wrangler deploy` + ตรวจ URL ให้ตรงตาราง |
| `Invalid LINE signature` (401) | secret ไม่ตรง Console | ตั้ง `*_CHANNEL_SECRET` ใหม่ให้ตรง |
| บอทไม่ตอบ แต่ Verify ผ่าน | ไม่มี access token | ตั้ง `*_CHANNEL_ACCESS_TOKEN` |
| บอทตอบซ้ำ | LINE redelivery | มี dedup ผ่าน KV (`webhookEventId`) อยู่แล้ว 24h |
| ตอบช้า/timeout | งานหนักบน request path | handler ใช้ `waitUntil()` ตอบ 200 ก่อนอยู่แล้ว |

ดู error ล่าสุดผ่าน `GET /api/line/debug` → `lastWebhookError` / `lastReplyError`

---

## 📊 Features ปัจจุบัน

**TukTuk bot** (`/api/webhook/line-tuktuk`):
- ✅ PIN login (สุ่ม 6 หลัก → Flex + save D1)
- ✅ Feature commands: เมนู / ตลาด / ลงขาย / วิน / ค้นสินค้า / สินค้ายอดฮิต / คลิปยอดนิยม
- ✅ AI reply + product/video carousel
- ✅ Welcome message เมื่อ follow
- ✅ Duplicate dedup (KV)

**Injection bot** (`/api/webhook/line`):
- ✅ Welcome message เมื่อ follow
- ✅ เมนู + quick reply
- ✅ Knowledge base (RAG) → AI fallback (Workers AI → Forge → MaxPlus)

---

## 🏗️ สถาปัตยกรรม (สรุป)

```
LINE Platform
   ↓ POST /api/webhook/line(-tuktuk)
readVerifiedLineWebhook()   ← verify HMAC-SHA256 signature
   ↓
events ว่าง? → 200 OK (Verify request)
   ↓
isPinRequestText()? → processPinRequest() [waitUntil] → PIN Flex
   ↓
[waitUntil background]
   ├─ filterDuplicateEvents (KV, TTL 24h)
   ├─ TukTuk  → follow → feature → AI → fallback
   └─ Injection → follow → menu → knowledge → AI
```

จุดเด่น: ตอบ `200` ให้ LINE ภายใน ~10-50ms แล้วทำงานหนักใน `waitUntil()` ป้องกัน timeout

---

## 🔜 Future Enhancements
- [ ] Rich Menu (แทน text menu)
- [ ] Chat history ลง D1 ต่อ user
- [ ] Image/Sticker/Location support
- [ ] Group chat commands
- [ ] map credential ตรง channel ID (ลด HMAC loop 3 รอบ)

---

**Handler:** `workers/handlers/line-webhook.js`
**Config:** `workers/wrangler.toml`
**Debug:** `GET /api/line/debug`
