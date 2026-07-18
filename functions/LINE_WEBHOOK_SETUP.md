# 💬 LINE Webhook Setup Guide

**Created:** 2025-11-28
**Status:** ⚠️ Pending Configuration

---

## 🎯 LINE Webhook URL

เมื่อ deploy สำเร็จแล้ว URL จะเป็น:

```
https://us-central1-appinjproject.cloudfunctions.net/lineWebhook
```

**วิธีใช้:**
1. เข้า [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel ของคุณ
3. ไปที่ **Messaging API** tab
4. ตั้งค่า **Webhook URL**:
   ```
   https://us-central1-appinjproject.cloudfunctions.net/lineWebhook
   ```
5. เปิด **Use webhook**: ON
6. คลิก **Verify** เพื่อทดสอบ

---

## ⚙️ Setup Steps

### **Step 1: ตั้งค่า Firebase Secrets**

ต้องตั้งค่า 2 secrets ก่อน deploy:

#### **Option A: ผ่าน Firebase CLI (แนะนำ)**

```bash
# 1. ตั้งค่า Channel Secret
firebase functions:secrets:set LINE_CHANNEL_SECRET
# พิมพ์: <REDACTED_MESSAGING_SECRET>

# 2. ตั้งค่า Channel Access Token
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
# พิมพ์: (ค่าจาก LINE Developers Console)
```

#### **Option B: ผ่าน Google Cloud Console**

1. เปิด [Secret Manager](https://console.cloud.google.com/security/secret-manager?project=appinjproject)
2. คลิก **+ CREATE SECRET**
3. สร้าง secret ทั้ง 2 ตัว:

**Secret 1:**
- Name: `LINE_CHANNEL_SECRET`
- Secret value: `<REDACTED_MESSAGING_SECRET>`

**Secret 2:**
- Name: `LINE_CHANNEL_ACCESS_TOKEN`
- Secret value: (ได้จาก LINE Developers Console → Messaging API → Channel access token)

---

### **Step 2: Deploy LINE Webhook Function**

```bash
cd functions
firebase deploy --only functions:lineWebhook
```

**Expected Output:**
```
✔ functions[lineWebhook(us-central1)] Successful create operation
```

---

### **Step 3: ตั้งค่า LINE Developers Console**

#### **3.1 เปิด Messaging API**

1. เข้า [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Provider → เลือก Channel
3. ไปที่ **Messaging API** tab
4. ใน **Webhook settings**:
   - Webhook URL: `https://us-central1-appinjproject.cloudfunctions.net/lineWebhook`
   - Use webhook: **ON**
   - Redelivery: **OFF** (หรือ ON ถ้าต้องการ)

#### **3.2 ปิด Auto-reply messages**

ไปที่ **Messaging API** → Basic settings:
- Auto-reply messages: **Disabled**
- Greeting messages: **Disabled** (หรือตั้งค่าเอง)

#### **3.3 เปิด Bot ให้ใช้งานได้**

ใน **Messaging API** tab:
- Allow bot to join group chats: **ON** (ถ้าต้องการ)
- Scan QR code: **ON** (ถ้าต้องการ)

---

## 🧪 Testing

### **Test 1: Webhook Verification**

ใน LINE Developers Console → Messaging API → Webhook settings:
1. คลิก **Verify**
2. ควรเห็น **Success** ✅

**ถ้าเจอ Error:**
- ตรวจสอบว่า deploy สำเร็จแล้ว
- ตรวจสอบว่า URL ถูกต้อง
- ดู logs: `firebase functions:log --only lineWebhook`

---

### **Test 2: เพิ่มเพื่อนและส่งข้อความ**

1. สแกน QR Code จาก LINE Developers Console
2. เพิ่ม Bot เป็นเพื่อน
3. ควรได้รับข้อความต้อนรับ 👋
4. ส่งข้อความทดสอบ เช่น "สวัสดี"
5. Bot ควรตอบกลับด้วย AI

**Expected Flow:**
```
User: สวัสดี
  ↓
LINE → Webhook → lineWebhook function
  ↓
getGeminiResponse (AI processing)
  ↓
LINE Bot Reply
  ↓
User: [ได้รับคำตอบจาก AI]
```

---

### **Test 3: Query Clarification**

ทดสอบว่า Query Clarification Module ทำงานผ่าน LINE:

```
User: เช็คระบบเพื่อพัฒนา
  ↓
Bot: คุณต้องการพัฒนาในด้านใดครับ?
     [A] ลดของเสีย
     [B] เพิ่มความเร็วการผลิต
     ... (และอื่นๆ)
  ↓
User: A
  ↓
Bot: [ประมวลผลด้วย enhanced query และตอบกลับ]
```

---

## 📊 Features ของ LINE Webhook

### **1. Message Handling** 💬
- รับข้อความจากผู้ใช้
- ส่งผ่าน getGeminiResponse AI
- ตอบกลับอัตโนมัติ
- รองรับ Query Clarification Module

### **2. Follow/Unfollow Events** 👋
- ส่งข้อความต้อนรับเมื่อผู้ใช้เพิ่มเพื่อน
- Log เมื่อผู้ใช้บล็อก/ลบบอท

### **3. Security** 🔒
- Signature validation (ป้องกัน unauthorized requests)
- Firebase Secrets (ข้อมูลลับไม่ hardcode)
- Error handling ครบถ้วน

### **4. Logging** 📝
- Log ทุก event type
- Log execution ID
- Log user information
- Error tracking

---

## 🔍 Monitoring & Logs

### **View Logs:**

```bash
# ดู logs ทั้งหมด
firebase functions:log --only lineWebhook

# ดู logs แบบ real-time
firebase functions:log --only lineWebhook --follow

# ดู logs จาก Firebase Console
https://console.firebase.google.com/project/appinjproject/functions/logs
```

### **Log Patterns:**

**Success:**
```
💬 LINE WEBHOOK RECEIVED [xxxxxxxx]
├── Method: POST
├── Path: /
└── Headers: [...]

✅ Signature validated
📨 Processing 1 event(s)
🎯 Event Type: message
💬 Message Event [xxxxxxxx]:
├── Type: text
├── Text: สวัสดี
└── Reply Token: ...

🤖 Calling getGeminiResponse...
✅ AI Response received (250 chars)
✅ Reply sent successfully
✅ Webhook processed successfully [xxxxxxxx]
```

**Error:**
```
❌ Invalid signature
❌ LINE Client not initialized
❌ Error handling message: ...
```

---

## 🔧 Troubleshooting

### **Issue 1: Webhook Verification Failed**

**Symptom:**
```
Webhook URL verification failed
```

**Solutions:**
1. ตรวจสอบว่า deploy สำเร็จ:
   ```bash
   firebase functions:list
   ```
2. ตรวจสอบ URL ว่าถูกต้อง
3. ดู logs:
   ```bash
   firebase functions:log --only lineWebhook
   ```

---

### **Issue 2: Invalid Signature**

**Symptom:**
```
❌ Invalid signature
```

**Solutions:**
1. ตรวจสอบว่า `LINE_CHANNEL_SECRET` ถูกต้อง:
   ```bash
   firebase functions:secrets:access LINE_CHANNEL_SECRET
   ```
2. ตรวจสอบว่า secret ตรงกับค่าใน LINE Developers Console

---

### **Issue 3: LINE Client Not Initialized**

**Symptom:**
```
❌ LINE Client not initialized
Please set LINE_CHANNEL_ACCESS_TOKEN
```

**Solutions:**
1. ตั้งค่า `LINE_CHANNEL_ACCESS_TOKEN`:
   ```bash
   firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
   ```
2. Deploy อีกครั้ง:
   ```bash
   firebase deploy --only functions:lineWebhook
   ```

---

### **Issue 4: Bot ไม่ตอบกลับ**

**Symptom:**
- User ส่งข้อความแต่ไม่ได้รับคำตอบ

**Solutions:**
1. ดู logs เพื่อหา error:
   ```bash
   firebase functions:log --only lineWebhook --follow
   ```
2. ตรวจสอบว่า Auto-reply messages ปิดแล้ว
3. ตรวจสอบว่า getGeminiResponse ทำงานปกติ:
   ```bash
   firebase functions:log --only getGeminiResponse
   ```

---

## 📋 Current Status

### ✅ **Completed:**
- [x] สร้าง lineWebhook function
- [x] เพิ่ม signature validation
- [x] เชื่อมต่อกับ getGeminiResponse
- [x] รองรับ follow/unfollow events
- [x] Error handling
- [x] Logging system

### ⚠️ **Pending:**
- [ ] ตั้งค่า Firebase Secrets (LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN)
- [ ] Deploy function
- [ ] ตั้งค่า LINE Developers Console
- [ ] ทดสอบการส่ง/รับข้อความ
- [ ] ทดสอบ Query Clarification ผ่าน LINE

### 🔜 **Future Enhancements:**
- [ ] เพิ่ม Chat History storage (บันทึก conversation ลง Firestore)
- [ ] เพิ่ม Rich Menu
- [ ] เพิ่ม Flex Message สำหรับคำตอบ
- [ ] เพิ่ม Quick Reply buttons
- [ ] เพิ่ม Image/Sticker support
- [ ] เพิ่ม Group chat support

---

## 🔗 Useful Links

### **LINE:**
- [LINE Developers Console](https://developers.line.biz/console/)
- [Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [Webhook Events Reference](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)

### **Firebase:**
- [Functions Console](https://console.firebase.google.com/project/appinjproject/functions)
- [Secret Manager](https://console.cloud.google.com/security/secret-manager?project=appinjproject)
- [Logs](https://console.firebase.google.com/project/appinjproject/functions/logs)

### **Documentation:**
- [QUERY_CLARIFICATION_MODULE.md](./QUERY_CLARIFICATION_MODULE.md)
- [LINE_SDK_INTEGRATION_REPORT.md](./LINE_SDK_INTEGRATION_REPORT.md)
- [DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md)

---

## 📝 Next Steps

1. **ตั้งค่า Secrets** (ใช้เวลา ~2 นาที):
   ```bash
   firebase functions:secrets:set LINE_CHANNEL_SECRET
   firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
   ```

2. **Deploy Function** (ใช้เวลา ~1 นาที):
   ```bash
   firebase deploy --only functions:lineWebhook
   ```

3. **ตั้งค่า LINE Console** (ใช้เวลา ~3 นาที):
   - เพิ่ม Webhook URL
   - ปิด Auto-reply
   - คลิก Verify

4. **ทดสอบ** (ใช้เวลา ~5 นาที):
   - สแกน QR Code
   - เพิ่มเพื่อน
   - ส่งข้อความทดสอบ

**Total Time:** ~11 นาที

---

**Created by:** Claude Code AI Assistant
**Last Updated:** 2025-11-28
**Status:** ✅ Function ready, ⚠️ Pending secrets configuration
