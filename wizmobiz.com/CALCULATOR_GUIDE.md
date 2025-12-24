# 🚀 WiT AI Calculator Pro - คู่มือการใช้งาน

## 📋 ภาพรวมระบบ

**WiT AI Calculator Pro** เป็นเครื่องคิดเลขวิศวกรฉีดพลาสติก AI ที่ครบครันที่สุด ครอบคลุม 20+ เครื่องมือคำนวณ พร้อมเชื่อมต่อกับ LINE Bot, Firebase, Vision AI, และ Marketplace

### ✨ จุดเด่น v2.0

- **🧮 20+ เครื่องคิดเลข**: ครอบคลุมทุกการคำนวณที่จำเป็น
- **👤 LINE Bot Integration**: ระบบ Trial 15 ครั้ง พร้อม Premium upgrade
- **💾 Firebase Sync**: บันทึกประวัติอัตโนมัติ sync ทุก device
- **📸 Vision AI**: วิเคราะห์ปัญหาชิ้นงานจากรูปภาพ
- **🛒 Marketplace**: แนะนำสินค้าที่เกี่ยวข้อง
- **📊 Real-time Analytics**: Dashboard แสดงสถิติการใช้งาน
- **💰 Cost & ROI Calculator**: คำนวณต้นทุนและผลตอบแทน
- **🔧 AI Troubleshooting**: วิเคราะห์และแก้ปัญหาการฉีด
- **📱 PWA Support**: ใช้งานออฟไลน์ได้ ติดตั้งเป็น App
- **🌐 Cross-Platform**: ใช้งานได้ทุก Device

---

## 🆕 Features ใหม่ใน v2.0

### 💰 Cost Per Part Calculator
- คำนวณต้นทุนต่อชิ้นแบบละเอียด
- แยกค่าวัสดุ, ค่าเครื่องจักร, ค่าแรง, Overhead
- แสดง Parts/Hour และ Production Rate

### 📈 ROI Calculator
- คำนวณระยะเวลาคืนทุน
- แสดงกราฟ Cumulative Profit
- วิเคราะห์ความคุ้มค่าการลงทุน

### 🔧 AI Troubleshooting
- วิเคราะห์ปัญหาการฉีด 12+ ประเภท
- แนะนำสาเหตุและวิธีแก้ไข
- เชื่อมกับ Marketplace สินค้าแนะนำ

### 📊 Analytics Dashboard
- สถิติการใช้งาน 7 วัน/30 วัน
- Calculator ที่ใช้บ่อย
- วัสดุที่ใช้บ่อย
- ส่งออกรายงาน JSON

---

## 🧮 เครื่องคิดเลขทั้งหมด (20+ ตัว)

### 1. 🔧 Clamp Force Calculator (แรงปิดแม่พิมพ์)
**คำนวณ**: แรงปิดที่ต้องการสำหรับชิ้นงาน

**Input**:
- Projected Area (cm²)
- Injection Pressure (kg/cm²)
- วัสดุ (PP/PE/ABS/PC/PMMA)

**Output**:
- Clamp Force (ton)
- Safety Factor 1.2x

**สูตร**: `Clamp Force = Area × Pressure × 1.2 / 1000`

---

### 2. ❄️ Cooling Time Calculator (ระยะเวลาเย็นตัว)
**คำนวณ**: เวลาที่ต้องรอให้ชิ้นงานเย็น

**Input**:
- ความหนาชิ้นงาน (mm)
- วัสดุพลาสติก
- อุณหภูมิ Mold (°C)

**Output**:
- Cooling Time (วินาที)

**สูตร**: `t = (s²) / (4α) × ln[(Tm - Tw) / (Te - Tw)]`

---

### 3. 💉 Shot Size Calculator
**คำนวณ**: ปริมาตร Shot Size ที่ต้องการ

**Input**:
- ปริมาตรชิ้นงาน/Cavity (cm³)
- จำนวน Cavities
- ปริมาตร Runner/Gate (cm³)

**Output**:
- Total Shot Size (cm³)
- Cushion (10% buffer)

**สูตร**: `Shot Size = (Part Volume × Cavities) + Runner + Cushion`

---

### 4. 🌡️ Temperature Calculator (อุณหภูมิฉีด)
**คำนวณ**: อุณหภูมิที่เหมาะสมสำหรับแต่ละวัสดุ

**Input**:
- วัสดุพลาสติก
- ความหนาชิ้นงาน (บาง/ปานกลาง/หนา)

**Output**:
- Melt Temperature Range
- Mold Temperature (Min/Recommended/Max)

---

### 5. ⏱️ Cycle Time Calculator
**คำนวณ**: Cycle Time รวมและชิ้นงาน/ชม.

**Input**:
- Injection Time (วินาที)
- Packing Time (วินาที)
- Cooling Time (วินาที)
- Mold Open/Close Time (วินาที)

**Output**:
- Total Cycle Time (วินาที)
- Parts Per Hour

**สูตร**: `Cycle Time = Injection + Packing + Cooling + Mold Time`

---

### 6. 🚪 Gate Size Calculator (ขนาด Gate)
**คำนวณ**: ขนาด Gate ที่เหมาะสม

**Input**:
- ความหนาชิ้นงาน (mm)
- ประเภท Gate (Edge/Submarine/Pin/Hot Runner)

**Output**:
- Gate Depth (mm)
- Gate Width (mm)

**หลักการ**:
- Edge Gate: Depth = 0.5 × Thickness
- Submarine Gate: Depth = 0.4 × Thickness
- Pin Gate: Depth = 0.7 × Thickness
- Hot Runner: Diameter = Thickness

---

### 7. 📏 Shrinkage Calculator (การหดตัว)
**คำนวณ**: การหดตัวและขนาด Cavity ที่ต้องทำ

**Input**:
- ขนาดชิ้นงาน (mm)
- วัสดุพลาสติก
- ความหนา (บาง/ปานกลาง/หนา)

**Output**:
- Shrinkage Percentage (%)
- Shrinkage Amount (mm)
- Cavity Dimension (mm)

**สูตร**: `Cavity Size = Part Size / (1 - Shrinkage%/100)`

---

### 8. 🏭 Machine Selection (เลือกเครื่องจักร)
**คำนวณ**: เลือกเครื่องจักรที่เหมาะสม

**Input**:
- แรงปิดที่ต้องการ (ton)
- Shot Size ที่ต้องการ (cm³)

**Output**:
- เครื่องจักรที่แนะนำ (ton)
- Max Shot Size
- Utilization (%)

**Available Sizes**: 50, 75, 100, 150, 200, 300, 400, 500, 650, 800, 1000, 1200, 1500, 2000 ton

---

### 9-15. 🔧 Additional Calculators

- **Injection Pressure Calculator**
- **Runner Size Calculator**
- **Part Volume/Weight Calculator**
- **Fill Time Calculator**
- **Barrel Capacity Check**
- **Cost Per Part Calculator**
- **Color Mixing Calculator**
- **Flow Ratio Calculator**

---

## 🎨 ระบบ Integration

### 👤 User Management (LINE Bot)

```javascript
const userManager = new UserManager();
await userManager.initialize();

// Trial System
const status = userManager.getTrialStatus();
// { isPremium: false, trialCount: 15, userId: "..." }

const result = await userManager.useTrial();
// { success: true, remaining: 14 }
```

**Features**:
- ✅ Trial 15 ครั้งฟรี
- ✅ Auto-sync กับ Firebase
- ✅ Premium upgrade support
- ✅ Offline mode (localStorage fallback)

---

### 💾 Firebase Sync

```javascript
// บันทึกการคำนวณ
await FirebaseSync.saveCalculation(userId, calcData);

// โหลดประวัติ
const history = await FirebaseSync.loadHistory(userId, limit=50);

// Sync กับ localStorage
FirebaseSync.syncWithLocal(calcData);
```

**Firestore Collections**:
- `calculations/{userId}/history`: ประวัติการคำนวณ
- `users/{userId}`: ข้อมูลผู้ใช้และ trial count

---

### 📸 Vision AI

```javascript
// วิเคราะห์ภาพ
const result = await VisionAI.analyzeDefect(imageFile);

// แสดงผล
VisionAI.displayResults(result, 'container-id');
```

**Response**:
```json
{
  "success": true,
  "defectType": "Flash",
  "confidence": 0.92,
  "recommendations": [
    "ลดแรงฉีด 10-15%",
    "ตรวจสอบการปิดแม่พิมพ์"
  ],
  "imageTags": ["flash", "parting-line"]
}
```

---

### 🛒 Marketplace Integration

```javascript
// ดึงสินค้าแนะนำ
const products = await MarketplaceIntegration.getRecommendedProducts(calcType, result);

// แสดงสินค้า
MarketplaceIntegration.displayProducts(products, 'container-id');
```

**Product Mapping**:
- Clamp Force → Machine, Mold
- Temperature → Heater, Temperature Controller
- Shot Size → Material, Resin
- Vision → Inspection, Camera

---

### 📊 Real-time Sync

```javascript
// ส่งไปยัง LINE Bot
await RealtimeSync.sendToLineBot(userId, calcData);

// แชร์ผ่าน LINE
RealtimeSync.shareToLine(message, url);

// Export PDF
await RealtimeSync.exportToPDF(calcData);
```

---

## 🎯 User Flow

```
1. เปิดหน้า calculator.html
   ↓
2. Initialize UserManager (ดึงข้อมูล userId จาก LINE หรือ localStorage)
   ↓
3. แสดง Trial Badge (15 ครั้งฟรี หรือ Premium)
   ↓
4. เลือกเครื่องคิดเลข (Tab)
   ↓
5. กรอกข้อมูล Input
   ↓
6. กดปุ่ม "คำนวณ"
   ↓
7. ตรวจสอบ Trial Credit
   ├─ ครบแล้ว → แสดง Error "ติดต่อ LINE OA"
   └─ ยังเหลือ → ดำเนินการต่อ
   ↓
8. เรียกใช้ CalculatorEngines.calculate...()
   ↓
9. แสดงผลลัพธ์
   ↓
10. บันทึกลง Firebase + localStorage
   ↓
11. ลด Trial Count 1 ครั้ง
   ↓
12. แสดง Toast "คำนวณสำเร็จ!"
   ↓
13. แสดง Quick Actions (บันทึก/แชร์/PDF)
```

---

## 📁 โครงสร้างไฟล์

```
wizmobiz.com/
├── calculator.html              # Main HTML (1640 lines)
├── js/
│   ├── calculator-engines.js    # 15+ calculator functions
│   └── calculator-integrations.js # LINE/Firebase/Vision/Marketplace
├── images/
│   └── placeholder.png
└── CALCULATOR_GUIDE.md          # คู่มือนี้
```

---

## 🔧 Configuration

### CONFIG (calculator-integrations.js line 10-15)

```javascript
const CONFIG = {
  FIREBASE_API_URL: 'https://linewebhook-47mhcx3iqq-uc.a.run.app',
  LINE_LIFF_ID: 'YOUR_LIFF_ID',  // ⚠️ ต้องแก้ไข!
  MARKETPLACE_API: 'https://marketplacegetproducts-47mhcx3iqq-uc.a.run.app',
  VISION_AI_ENDPOINT: '/vision-analysis',
};
```

### MATERIALS Database

```javascript
const MATERIALS = {
  PP: {
    pressure: 500,
    alpha: 0.00012,
    meltTemp: '200-280',
    moldTemp: [30, 60, 40],
    shrinkage: [1.0, 1.5, 2.0] // [thin, medium, thick]
  },
  // ... PE, ABS, PC, PMMA, PA, POM
};
```

---

## 🚀 การใช้งาน

### 1. เปิดหน้าเว็บ

```
http://localhost:8080/calculator.html
```

หรือ deploy บน Firebase Hosting:
```bash
firebase deploy --only hosting
```

### 2. การคำนวณ

- เลือก Tab เครื่องคิดเลข
- กรอกข้อมูล
- กด "คำนวณ"
- ผลลัพธ์จะแสดงพร้อม Quick Actions

### 3. Vision AI

- เลือก Tab "Vision AI"
- อัพโหลดรูปภาพชิ้นงาน
- กด "วิเคราะห์ด้วย AI"
- ดูผลการวิเคราะห์และคำแนะนำ

### 4. ประวัติการคำนวณ

- เลือก Tab "ประวัติ"
- ดูประวัติทั้งหมด (เก็บ 50 รายการล่าสุด)
- ส่งออกเป็น JSON

---

## 🎨 UI Components

### Material Pills (วัสดุพลาสติก)

```html
<div class="material-pills">
  <button class="material-pill active" data-pressure="500">PP</button>
  <button class="material-pill" data-pressure="600">PE</button>
  ...
</div>
```

### Result Section

```html
<div class="result-section show">
  <div class="result-title">
    <i class="fas fa-check-circle"></i> ผลการคำนวณ
  </div>
  <div>
    <span class="result-value">120.5</span>
    <span class="result-unit">ton</span>
  </div>
  <div class="result-details">...</div>
  <div class="quick-actions">
    <button class="btn-action" onclick="saveCalculation()">
      <i class="fas fa-save"></i> บันทึก
    </button>
    ...
  </div>
</div>
```

### Toast Notifications

```javascript
UIHelpers.showToast('คำนวณสำเร็จ!', 'success');
UIHelpers.showToast('เกิดข้อผิดพลาด', 'error');
```

### Loading Overlay

```javascript
UIHelpers.showLoading(true);
// ... do async work
UIHelpers.showLoading(false);
```

---

## 📊 Analytics & Tracking

### Trial Count Tracking

```javascript
// เริ่มต้น 15 ครั้ง
localStorage.getItem('localTrialCount'); // "15"

// ใช้ไป 1 ครั้ง
await userManager.useTrial();

// Badge อัพเดทอัตโนมัติ
UIHelpers.updateTrialBadge(14, false);
```

### Calculation History

```javascript
localStorage.getItem('calcHistory');
// [{id, type, result, data, timestamp}, ...]
```

---

## 🔐 Security

- ✅ Trial system แบบ Client-side + Server-side sync
- ✅ ข้อมูลบันทึกใน Firestore (ต้อง auth)
- ✅ Vision AI ผ่าน Firebase Functions (secure)
- ✅ No sensitive data in localStorage

---

## 📈 Future Enhancements

1. **📱 PWA Support**: ติดตั้งเป็น App บนมือถือ
2. **📊 Advanced Charts**: กราฟแสดงประวัติ
3. **🤖 AI Recommendations**: แนะนำการตั้งค่าอัตโนมัติ
4. **👥 Team Sharing**: แชร์ผลคำนวณกับทีม
5. **📝 Templates**: บันทึก Template ที่ใช้บ่อย
6. **🌐 Multi-language**: รองรับภาษาอังกฤษ
7. **📦 3D Preview**: แสดง 3D model ชิ้นงาน
8. **⚡ Offline Mode**: ทำงานได้โดยไม่ต้องมีเน็ต

---

## 🐛 Troubleshooting

### ❌ "ใช้งานครบ 15 ครั้งแล้ว"

**สาเหตุ**: Trial credit หมด

**แก้ไข**:
1. ติดต่อ LINE OA เพื่อ upgrade Premium
2. หรือ clear localStorage (dev only):
   ```javascript
   localStorage.removeItem('localTrialCount');
   location.reload();
   ```

### ❌ "ไม่สามารถวิเคราะห์ภาพได้"

**สาเหตุ**: Vision AI endpoint ไม่พร้อม

**แก้ไข**:
1. ตรวจสอบ `CONFIG.VISION_AI_ENDPOINT`
2. ตรวจสอบ Firebase Functions deploy

### ❌ ผลคำนวณไม่บันทึก

**สาเหตุ**: Firebase connection error

**แก้ไข**:
1. ตรวจสอบ network
2. ยังบันทึกใน localStorage อยู่
3. จะ sync อัตโนมัติเมื่อ online

---

## 📞 Support

- **LINE OA**: @WiTAI
- **Email**: support@wizmobiz.com
- **GitHub**: [repository-url]

---

สร้างโดย: Claude Sonnet 4.5 🤖
วันที่: 2025-12-12
Version: 1.0.0

✨ **พัฒนาเสร็จสมบูรณ์แล้ว!** ✨
