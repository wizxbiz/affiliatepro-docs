# 🚀 WiT AI Calculator Pro

เครื่องคิดเลขวิศวกรฉีดพลาสติก AI ระดับโปร พร้อม LINE Bot Integration, Firebase Sync, Vision AI, และ Marketplace

## ✨ Features

- **🧮 15+ Calculators**: เครื่องคิดเลขครบครัน (Clamp Force, Cooling Time, Shot Size, Temperature, Cycle Time, Gate Size, Shrinkage, Machine Selection, และอื่นๆ)
- **👤 LINE Bot Integration**: ระบบ Trial 15 ครั้ง + Premium upgrade
- **💾 Firebase Sync**: บันทึกประวัติอัตโนมัติ sync ทุก device
- **📸 Vision AI**: วิเคราะห์ปัญหาชิ้นงานจากรูปภาพ
- **🛒 Marketplace**: แนะนำสินค้าที่เกี่ยวข้อง
- **📊 Real-time Sync**: แชร์ผล, ส่งออก PDF

## 📁 โครงสร้างไฟล์

```
wizmobiz.com/
├── calculator.html              # หน้าเครื่องคิดเลขหลัก (1641 lines)
├── js/
│   ├── calculator-engines.js    # 15+ calculator functions
│   └── calculator-integrations.js # LINE/Firebase/Vision/Marketplace
├── CALCULATOR_GUIDE.md          # คู่มือการใช้งานฉบับสมบูรณ์
└── images/
```

## 🚀 การติดตั้ง

### 1. Clone Repository

```bash
git clone https://github.com/wizxbiz/affiliatepro-docs.git
cd affiliatepro-docs/wizmobiz.com
```

### 2. ตั้งค่า Configuration

แก้ไขไฟล์ \`js/calculator-integrations.js\` บรรทัดที่ 12:

```javascript
const CONFIG = {
  FIREBASE_API_URL: 'https://YOUR_FIREBASE_URL',
  LINE_LIFF_ID: 'YOUR_LIFF_ID',  // ⚠️ ต้องแก้ไข!
  MARKETPLACE_API: 'https://YOUR_MARKETPLACE_API',
  VISION_AI_ENDPOINT: '/vision-analysis',
};
```

### 3. เปิดใช้งาน

```bash
# วิธีที่ 1: เปิดไฟล์ HTML โดยตรง
open calculator.html

# วิธีที่ 2: ใช้ local server
python -m http.server 8080
# จากนั้นเปิด http://localhost:8080/calculator.html
```

## 📖 คู่มือการใช้งาน

อ่านคู่มือฉบับสมบูรณ์ได้ที่ [CALCULATOR_GUIDE.md](./CALCULATOR_GUIDE.md)

## 🔐 Security

**⚠️ สำคัญ:** ไฟล์ต่อไปนี้ถูก ignore และไม่ควรอัปโหลดสู่ GitHub:

- \`**/config.json\` - LINE tokens และ API keys
- \`**/google-services.json\` - Firebase config
- \`**/serviceAccount*.json\` - Service account keys
- \`**/.env\` - Environment variables

กรุณาใช้ไฟล์ \`config.json.example\` เป็น template แทน

## 📊 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **UI Framework**: Bootstrap 5.3
- **Icons**: Font Awesome 6.4
- **Backend**: Firebase Functions (Node.js 20)
- **Database**: Firestore
- **LINE Bot**: @line/bot-sdk v10.5.0
- **AI**: Google Gemini API

## 📝 License

© 2025 WizMobiz. All rights reserved.

---

สร้างโดย Claude Sonnet 4.5 🤖 | Version 1.0.0 | 2025-12-12
