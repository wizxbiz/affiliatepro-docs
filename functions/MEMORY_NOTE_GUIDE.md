# 📒 Memory Note System - คู่มือการใช้งาน

## 🎯 ภาพรวม

ระบบบันทึกส่วนตัวสำหรับ LINE Bot ที่ช่วยให้ผู้ใช้สามารถ:
- ✅ บันทึกข้อความ/งาน/นัดหมาย
- ✅ ดูบันทึกตามวันที่
- ✅ ค้นหาบันทึก
- ✅ จัดการบันทึก (ลบ, เปลี่ยนสถานะ)
- ✅ จัดหมวดหมู่อัตโนมัติ (งาน, ประชุม, ช็อปปิ้ง, อื่นๆ)

---

## 📋 คำสั่งที่รองรับ

### 1. สร้างบันทึกใหม่

```
บันทึก [ข้อความ]
/note [ข้อความ]
/memo [ข้อความ]
จดไว้ [ข้อความ]
```

**ตัวอย่าง:**
```
บันทึก ประชุมกับลูกค้า 14:00 น.
/note ซื้อของพรุ่งนี้
จดไว้ 15/12/2568 ส่งรายงาน
memo urgent task
```

### 2. ดูบันทึก

```
/memory              → เมนูหลัก
/memory วันนี้        → ดูบันทึกวันนี้
/memory เมื่อวาน     → ดูบันทึกเมื่อวาน
/memory พรุ่งนี้       → ดูบันทึกพรุ่งนี้
/memory ล่าสุด        → ดูบันทึก 10 รายการล่าสุด
/memory 12/12/2568   → ดูบันทึกวันที่ระบุ
ดูบันทึก             → เมนูหลัก
```

### 3. ค้นหาบันทึก

```
/memory ค้นหา [คำค้น]
/memory search [keyword]
```

**ตัวอย่าง:**
```
/memory ค้นหา ประชุม
/memory search urgent
```

---

## 🎨 ฟีเจอร์ขั้นสูง

### การระบุวันที่และเวลา

ระบบจะแยกวันที่และเวลาอัตโนมัติจากข้อความ:

**รูปแบบวันที่ที่รองรับ:**
- `12/12/2568` (วัน/เดือน/ปี พ.ศ.)
- `12-12-2025` (วัน-เดือน-ปี ค.ศ.)
- `วันนี้`, `พรุ่งนี้`, `มะรืน`, `เมื่อวาน`

**รูปแบบเวลาที่รองรับ:**
- `14:00 น.`
- `14.00`
- `2โมง`

**ตัวอย่าง:**
```
บันทึก ประชุมพรุ่งนี้ 14:00 น.
→ วันที่: พรุ่งนี้
→ เวลา: 14:00

บันทึก 15/12/2568 ส่งรายงาน
→ วันที่: 15/12/2568
→ เวลา: ไม่ระบุ
```

### การจัดหมวดหมู่อัตโนมัติ

ระบบจะจัดหมวดหมู่อัตโนมัติตามคำสำคัญ:

| หมวดหมู่ | Icon | คำสำคัญ |
|---------|------|---------|
| งาน | 📋 | ทำ, งาน, task, work |
| ประชุม | 🤝 | ประชุม, meeting, นัด |
| ช็อปปิ้ง | 🛒 | ซื้อ, ช็อป, shopping |
| การเงิน | 💰 | จ่าย, pay, เงิน |
| อื่นๆ | 📝 | (ไม่ตรงหมวดหมู่ใด) |

---

## 📊 โครงสร้าง Firestore

### Collection: `user_notes/{userId}/notes/{noteId}`

```javascript
{
  content: "ประชุมกับลูกค้า",
  category: "meeting",
  date: Timestamp,
  time: "14:00",
  completed: false,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### ดัชนี (Indexes)

สร้างดัชนีใน Firestore:

```
Collection: user_notes/{userId}/notes
Fields:
- date (Ascending)
- createdAt (Descending)
```

---

## 🔧 การติดตั้งและ Deploy

### 1. ตรวจสอบว่าโค้ดพร้อม

```bash
cd functions
node test-memory-system.js
```

ผลลัพธ์ที่ควรได้:
```
✅ All basic tests completed
📝 Memory Note System is ready to use
```

### 2. Deploy ไป Firebase

```bash
cd functions
firebase deploy --only functions:lineBotWebhook,functions:manageMemory
```

### 3. ตรวจสอบการ Deploy

ไปที่: [Firebase Console](https://console.firebase.google.com/project/appinjproject/functions)

ควรเห็น:
- ✅ `lineBotWebhook` (us-central1)
- ✅ `manageMemory` (us-central1)

---

## 🧪 การทดสอบ

### ทดสอบผ่าน LINE

1. **สร้างบันทึก:**
   ```
   บันทึก ทดสอบระบบ
   ```
   ✅ ควรได้ข้อความยืนยัน + Flex Message

2. **ดูบันทึกวันนี้:**
   ```
   /memory วันนี้
   ```
   ✅ ควรเห็นบันทึกที่เพิ่งสร้าง

3. **ทดสอบการจัดหมวดหมู่:**
   ```
   บันทึก ประชุมทีมพรุ่งนี้ 14:00 น.
   ```
   ✅ ควรจัดอยู่ในหมวด "ประชุม" 🤝

4. **ทดสอบการดูบันทึกล่าสุด:**
   ```
   /memory ล่าสุด
   ```
   ✅ ควรเห็นบันทึก 10 รายการล่าสุด

---

## 📱 Flex Message ที่รองรับ

### 1. Memory Menu
เมนูหลักสำหรับเข้าถึงฟีเจอร์ต่างๆ

### 2. Note Saved Confirmation
ยืนยันการบันทึกสำเร็จพร้อมรายละเอียด

### 3. Notes List
แสดงรายการบันทึกในรูปแบบ Carousel

### 4. Empty Notes
แสดงเมื่อไม่มีบันทึก

### 5. Delete Confirmation
ยืนยันก่อนลบบันทึก

---

## 🔍 การแก้ไขปัญหา

### ปัญหา: บันทึกไม่ขึ้น

**วิธีแก้:**
1. ตรวจสอบ Firestore Rules:
   ```javascript
   match /user_notes/{userId}/notes/{noteId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

2. ตรวจสอบ logs:
   ```bash
   firebase functions:log
   ```

### ปัญหา: วันที่แสดงผิด

**วิธีแก้:**
- ระบบใช้ timezone `Asia/Bangkok` (UTC+7)
- ตรวจสอบ `formatThaiDate()` function

### ปัญหา: Command ไม่ทำงาน

**วิธีแก้:**
1. ตรวจสอบว่า `isAnyMemoryCommand()` return true:
   ```javascript
   console.log(isAnyMemoryCommand("/memory"));
   // ควรได้ true
   ```

2. ตรวจสอบ integration ใน index.js:
   ```javascript
   if (isAnyMemoryCommand(message.text)) {
     const handled = await handleMemoryWebhook({lineClient, db}, event, userData);
     if (handled) return;
   }
   ```

---

## 📊 สถิติการใช้งาน

### Query สำหรับดูสถิติ

```javascript
// นับจำนวนบันทึกทั้งหมด
db.collection("user_notes").doc(userId).collection("notes").get()
  .then(snapshot => console.log(`Total: ${snapshot.size}`));

// นับบันทึกที่ยังไม่เสร็จ
db.collection("user_notes").doc(userId).collection("notes")
  .where("completed", "==", false).get()
  .then(snapshot => console.log(`Pending: ${snapshot.size}`));

// บันทึกวันนี้
const today = new Date();
today.setHours(0, 0, 0, 0);
db.collection("user_notes").doc(userId).collection("notes")
  .where("date", ">=", today).get()
  .then(snapshot => console.log(`Today: ${snapshot.size}`));
```

---

## 🚀 การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มในอนาคต

- [ ] การแจ้งเตือนก่อนถึงเวลา (Notifications)
- [ ] การแชร์บันทึกระหว่างผู้ใช้
- [ ] การซิงค์กับ Google Calendar
- [ ] การส่งออกเป็น PDF
- [ ] Rich Menu สำหรับเข้าถึงง่าย
- [ ] Voice notes (รับข้อความเสียง)
- [ ] รูปภาพประกอบบันทึก

### การเพิ่ม Rich Menu

```javascript
const richMenu = {
  size: {width: 2500, height: 1686},
  selected: true,
  name: "Memory Note Menu",
  chatBarText: "เมนูบันทึก",
  areas: [
    {
      bounds: {x: 0, y: 0, width: 1250, height: 843},
      action: {type: "message", text: "/memory วันนี้"}
    },
    {
      bounds: {x: 1250, y: 0, width: 1250, height: 843},
      action: {type: "message", text: "บันทึก "}
    },
    // ... เพิ่มเติม
  ]
};
```

---

## 📚 เอกสารอ้างอิง

### ไฟล์ที่เกี่ยวข้อง

- [memoryNoteSystem.js](./memoryNoteSystem.js) - Core functions
- [index.js:6436-6443](./index.js#L6436-L6443) - Integration
- [test-memory-system.js](./test-memory-system.js) - Test suite

### API Reference

#### `saveNote(userId, content, options)`
บันทึกข้อความใหม่

**Parameters:**
- `userId` (string) - LINE User ID
- `content` (string) - เนื้อหาบันทึก
- `options` (object) - ตัวเลือกเพิ่มเติม
  - `date` (Date) - วันที่
  - `time` (string) - เวลา
  - `category` (string) - หมวดหมู่

**Returns:** `Promise<{success, noteId, note}>`

#### `getNotesByDate(userId, date)`
ดึงบันทึกตามวันที่

**Parameters:**
- `userId` (string)
- `date` (Date)

**Returns:** `Promise<{success, notes, count}>`

#### `handleMemoryWebhook({lineClient, db}, event, userData)`
Handle LINE webhook events

**Parameters:**
- `lineClient` - LINE Bot SDK client
- `db` - Firestore instance
- `event` - LINE webhook event
- `userData` - User data object

**Returns:** `Promise<boolean>` - true if handled

---

## 🎓 Best Practices

### 1. Error Handling
```javascript
try {
  const result = await saveNote(userId, content);
  if (!result.success) {
    console.error("Save failed:", result.error);
  }
} catch (error) {
  console.error("Unexpected error:", error);
}
```

### 2. Input Validation
```javascript
if (!content || content.trim().length === 0) {
  return {success: false, error: "Content is required"};
}

if (content.length > 1000) {
  return {success: false, error: "Content too long"};
}
```

### 3. Performance
```javascript
// ใช้ limit เมื่อ query
const notes = await db.collection("user_notes")
  .doc(userId)
  .collection("notes")
  .orderBy("createdAt", "desc")
  .limit(10) // ⚡ Important!
  .get();
```

---

## ✅ Checklist สำหรับ Production

- [x] ✅ Unit tests ผ่าน
- [x] ✅ Deploy สำเร็จ
- [x] ✅ Firestore rules ตั้งค่าแล้ว
- [x] ✅ Command detection ทำงานถูกต้อง
- [x] ✅ Flex messages แสดงผล
- [ ] ⏳ Firestore indexes สร้างแล้ว (รอ auto-create)
- [ ] ⏳ Rich Menu (optional)
- [ ] ⏳ User guide สำหรับผู้ใช้งาน

---

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ logs: `firebase functions:log`
2. ดู error details ใน Firebase Console
3. ทดสอบด้วย `test-memory-system.js`

---

**เอกสารนี้สร้างโดย:** Claude Sonnet 4.5
**วันที่อัปเดต:** 2025-12-13
**เวอร์ชัน:** 1.0.0

✨ ระบบ Memory Note พร้อมใช้งาน!
