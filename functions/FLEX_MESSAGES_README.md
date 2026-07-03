# 📊 Flex Messages Documentation

## ภาพรวม (Overview)

ระบบ Flex Messages ที่ปรับปรุงใหม่สำหรับแสดงผลข้อมูลแบบสวยงามและใช้งานได้ 100% บน LINE Bot

## ✨ ฟีเจอร์หลัก (Key Features)

### 1. **Stats Dashboard** - แสดงสถานะระบบ
- แสดงการใช้หน่วยความจำ (Memory Usage) พร้อม Progress Bar
- แสดงเวลาทำงานระบบ (Uptime)
- แสดง Node.js version
- เปลี่ยนสีตามระดับการใช้งาน:
  - 🟢 **ปกติ** (0-70%): สีเขียว
  - 🟡 **ใช้งานสูง** (70-90%): สีส้ม/เหลือง
  - 🔴 **วิกฤต** (>90%): สีแดง

### 2. **Calculation Dashboard** - แสดงผลการคำนวณ
- แสดงรายละเอียดการคำนวณแบบตาราง
- รองรับหลายค่าพร้อมหน่วย (label, value, unit)
- แสดงคำแนะนำ (Recommendation)
- ใช้สีสลับแถวเพื่อความอ่านง่าย

## 🛠️ การใช้งาน (Usage)

### ติดตั้ง Dependencies
```bash
npm install @line/bot-sdk
```

### Import Functions
```javascript
const { createStatsDashboard, createCalculationDashboard } = require('./flexMessageGenerator');
```

### ตัวอย่างการใช้งาน Stats Dashboard

```javascript
const stats = {
  memory: {
    heapUsed: process.memoryUsage().heapUsed,
    heapTotal: process.memoryUsage().heapTotal,
    rss: process.memoryUsage().rss
  },
  uptime: process.uptime(),
  nodeVersion: process.version,
  timestamp: new Date().toISOString()
};

const flexMessage = createStatsDashboard(stats);

// ส่งผ่าน LINE Bot SDK
await lineClient.replyMessage(replyToken, flexMessage);
```

### ตัวอย่างการใช้งาน Calculation Dashboard

```javascript
const title = 'คำนวณอัตราส่วนการผสม';
const data = [
  { label: 'วัตถุดิบ A', value: '100', unit: 'กรัม' },
  { label: 'วัตถุดิบ B', value: '50', unit: 'กรัม' },
  { label: 'น้ำ', value: '200', unit: 'มิลลิลิตร' }
];
const recommendation = 'ควรผสมวัตถุดิบในสัดส่วนที่กำหนด';

const flexMessage = createCalculationDashboard(title, data, recommendation);

// ส่งผ่าน LINE Bot SDK
await lineClient.replyMessage(replyToken, flexMessage);
```

## 📋 API Reference

### `createStatsDashboard(stats)`

สร้าง Flex Message สำหรับแสดงสถานะระบบ

**Parameters:**
- `stats` (Object) - ข้อมูลสถานะระบบ
  - `memory` (Object) - ข้อมูลหน่วยความจำ
    - `heapUsed` (Number) - Heap memory ที่ใช้ (bytes)
    - `heapTotal` (Number) - Heap memory ทั้งหมด (bytes)
    - `rss` (Number) - RSS memory (bytes)
  - `uptime` (Number) - เวลาทำงาน (seconds)
  - `nodeVersion` (String) - Node.js version
  - `timestamp` (String) - เวลาที่บันทึก

**Returns:**
- Flex Message Object หรือ `null` ถ้าข้อมูลไม่ถูกต้อง

**Example:**
```javascript
{
  memory: {
    heapUsed: 52428800,    // 50 MB
    heapTotal: 104857600,  // 100 MB
    rss: 125829120         // 120 MB
  },
  uptime: 3600,           // 1 hour
  nodeVersion: 'v20.19.5',
  timestamp: '2024-12-07T10:30:00.000Z'
}
```

### `createCalculationDashboard(title, data, recommendation)`

สร้าง Flex Message สำหรับแสดงผลการคำนวณ

**Parameters:**
- `title` (String) - หัวข้อการคำนวณ (จำกัด 60 ตัวอักษร)
- `data` (Array) - รายการข้อมูล
  - `label` (String) - ชื่อรายการ
  - `value` (String/Number) - ค่า
  - `unit` (String, optional) - หน่วย
- `recommendation` (String) - คำแนะนำ

**Returns:**
- Flex Message Object หรือ `null` ถ้าข้อมูลไม่ถูกต้อง

**Example:**
```javascript
createCalculationDashboard(
  'การคำนวณกำลังไฟฟ้า',
  [
    { label: 'แรงดันไฟฟ้า', value: '220', unit: 'V' },
    { label: 'กระแสไฟฟ้า', value: '15.5', unit: 'A' },
    { label: 'กำลังไฟฟ้า', value: '3410', unit: 'W' }
  ],
  'แนะนำให้ตรวจสอบระบบไฟฟ้าเป็นประจำ'
);
```

## 🔍 การทดสอบ (Testing)

รันไฟล์ทดสอบ:
```bash
node testFlexMessages.js
```

ไฟล์ทดสอบจะตรวจสอบ:
- ✅ การทำงานปกติ (Normal cases)
- ✅ การจัดการ Error (Error handling)
- ✅ Edge cases (ข้อมูลไม่ครบ, ข้อความยาว)
- ✅ การตรวจสอบ Validation
- ✅ การทำงานกับข้อมูลจริง

## 🎨 การออกแบบ (Design)

### Color Scheme

**Stats Dashboard:**
- Normal (0-70%): `#27ae60` (เขียว)
- High (70-90%): `#f39c12` (ส้ม)
- Critical (>90%): `#c0392b` (แดง)

**Calculation Dashboard:**
- Header: `#1e88e5` (น้ำเงิน)
- Body: `#ffffff` (ขาว)
- Recommendation Box: `#e3f2fd` (ฟ้าอ่อน)

### Layout Features
- ✨ Modern gradient headers
- 📊 Progress bars with percentage
- 🎯 Clear visual hierarchy
- 💡 Highlighted recommendations
- 📱 Mobile-optimized design

## ⚠️ Error Handling

ระบบมีการจัดการ Error แบบครอบคลุม:

1. **Input Validation**
   - ตรวจสอบข้อมูลก่อนสร้าง Flex Message
   - Return `null` ถ้าข้อมูลไม่ถูกต้อง

2. **Safe Defaults**
   - ใช้ค่าเริ่มต้นถ้าข้อมูลบางส่วนหายไป
   - ป้องกัน Division by zero

3. **Try-Catch Blocks**
   - จับ Error ทุกจุดที่อาจเกิดปัญหา
   - Log error messages สำหรับ debugging

4. **Validation Checks**
   - ตรวจสอบ Flex Message ก่อนส่ง
   - กรองเฉพาะ Message ที่ valid

## 📊 ตัวอย่าง Output

### Stats Dashboard (ปกติ)
```
สถานะระบบ: ปกติ ✅
Memory: 50% (50 MB / 100 MB)
[Progress Bar: 50%]
Uptime: 1.00 ชั่วโมง
```

### Stats Dashboard (วิกฤต)
```
สถานะระบบ: วิกฤต 🔴
Memory: 95% (95 MB / 100 MB)
[Progress Bar: 95%]
Uptime: 3.00 ชั่วโมง
```

### Calculation Dashboard
```
📊 ผลการคำนวณ
คำนวณอัตราส่วนการผสม

📋 รายละเอียด
วัตถุดิบ A     100 กรัม
วัตถุดิบ B      50 กรัม
น้ำ            200 มิลลิลิตร

💡 คำแนะนำ
ควรผสมวัตถุดิบในสัดส่วนที่กำหนด
```

## 🔧 Integration กับ index.js

ระบบถูก integrate แล้วใน [index.js](index.js) ที่บรรทัด:
- Line 6555: Import functions
- Line 6890-6900: สร้าง Stats Dashboard
- Line 6917-6933: สร้าง Calculation Dashboard
- Line 7031-7043: ตรวจสอบและส่ง Flex Messages

## 📝 Notes

- Flex Messages จำกัดสูงสุด 5 messages ต่อ reply
- System จะส่ง Text message + Flex messages (max 4 flex)
- Title ที่ยาวเกิน 60 ตัวอักษรจะถูกตัดและใส่ "..."
- Progress bar จะแสดงขั้นต่ำ 5% เพื่อให้มองเห็น

## 🚀 Performance

- Input validation: O(1)
- Data mapping: O(n) where n = จำนวนข้อมูลใน array
- Error handling: Minimal overhead
- Memory usage: Efficient JSON structure

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- ตรวจสอบ Console logs
- รัน `testFlexMessages.js` เพื่อ debug
- ตรวจสอบว่า LINE Bot SDK ติดตั้งถูกต้อง

## ✅ Changelog

### Version 2.0.0 (2024-12-07)
- ✨ เพิ่ม Progress Bar แบบ visual
- 🎨 ปรับปรุงดีไซน์ทั้งหมด
- 🔧 เพิ่ม Error Handling แบบครอบคลุม
- 📊 เพิ่มระบบ Color coding ตามสถานะ
- ✅ เพิ่มไฟล์ทดสอบครบถ้วน
- 🌐 รองรับภาษาไทยเต็มรูปแบบ
- 🛡️ เพิ่ม Input validation
- 📱 Optimize สำหรับ Mobile

---

🛠️ **พัฒนาโดย:** อาจารย์วิทยา เทคโมชั่น
📅 **อัพเดทล่าสุด:** 7 ธันวาคม 2024
✅ **สถานะ:** พร้อมใช้งาน 100%
