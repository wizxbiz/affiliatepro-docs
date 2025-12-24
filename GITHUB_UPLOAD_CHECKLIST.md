# ✅ GitHub Upload Checklist

## 🔒 ขั้นตอนการอัปโหลดอย่างปลอดภัย

### 1. ตรวจสอบ .gitignore

✅ ไฟล์ที่ต้อง ignore:
- [x] `**/config.json` - LINE Channel Access Token
- [x] `**/google-services.json` - Firebase config
- [x] `**/serviceAccount*.json` - Service account keys
- [x] `**/.env` - Environment variables
- [x] `node_modules/` - Dependencies
- [x] `build/` - Build artifacts

### 2. สร้าง Config Templates

✅ สร้างไฟล์ example:
- [x] `admin_dashboard/config.json.example` - Template สำหรับ config

### 3. ไฟล์ที่จะอัปโหลด (wizmobiz.com/)

✅ ไฟล์หลัก:
- [x] `calculator.html` (1641 lines)
- [x] `js/calculator-engines.js` (569 lines)
- [x] `js/calculator-integrations.js` (526 lines)
- [x] `CALCULATOR_GUIDE.md`
- [x] `README.md`

### 4. คำสั่งอัปโหลด

#### วิธีที่ 1: ใช้ Script (แนะนำ)

```bash
cd /d/Flutterapp/caculateapp
./upload-to-github.sh
```

#### วิธีที่ 2: Manual Git Commands

```bash
cd /d/Flutterapp/caculateapp

# 1. Initialize (ถ้ายังไม่มี git)
git init
git remote add origin https://github.com/wizxbiz/affiliatepro-docs.git

# 2. ตรวจสอบสถานะ
git status

# 3. เพิ่มไฟล์ wizmobiz.com เท่านั้น
git add wizmobiz.com/calculator.html
git add wizmobiz.com/js/calculator-engines.js
git add wizmobiz.com/js/calculator-integrations.js
git add wizmobiz.com/CALCULATOR_GUIDE.md
git add wizmobiz.com/README.md
git add admin_dashboard/config.json.example
git add .gitignore

# 4. ตรวจสอบไฟล์ที่จะ commit
git status

# 5. Commit
git commit -m "🚀 Add WiT AI Calculator Pro with full integration"

# 6. Push
git push origin main
# หรือ
git push origin master
```

### 5. หลังอัปโหลด - ตรวจสอบ

✅ ตรวจสอบใน GitHub:
1. เปิด https://github.com/wizxbiz/affiliatepro-docs
2. ตรวจสอบว่าไม่มี `config.json` (มีแต่ `.example` เท่านั้น)
3. ตรวจสอบว่าไม่มี `google-services.json`
4. ตรวจสอบว่าไม่มี sensitive data

### 6. ข้อมูลที่ต้องระวัง ⚠️

❌ **ห้ามอัปโหลด**:
```
LINE_CHANNEL_ACCESS_TOKEN: 8N02+/vDPk/M/kx+Fbu8ZiTM...
SUPER_ADMIN_USER_ID: Ud9bec6d2ea945cf4330a69cb74ac93cf
FIREBASE_PROJECT_ID: appinjproject
GOOGLE_API_KEY: AIza...
```

✅ **อัปโหลดได้** (ใน config.json.example):
```
LINE_CHANNEL_ACCESS_TOKEN: YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE
SUPER_ADMIN_USER_ID: YOUR_SUPER_ADMIN_USER_ID
FIREBASE_PROJECT_ID: YOUR_FIREBASE_PROJECT_ID
```

### 7. ถ้าอัปโหลด Sensitive Data ไปแล้ว

```bash
# ลบไฟล์ออกจาก git history
git filter-branch --force --index-filter \
"git rm --cached --ignore-unmatch admin_dashboard/config.json" \
--prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all

# แล้วเปลี่ยน tokens/keys ทั้งหมดทันที!
```

---

## 📊 สรุปไฟล์ที่สร้าง

| ไฟล์ | ขนาด | คำอธิบาย |
|------|------|----------|
| calculator.html | 1641 lines | UI หลัก + 8 calculators |
| calculator-engines.js | 569 lines | 15+ calculator functions |
| calculator-integrations.js | 526 lines | LINE/Firebase/Vision AI |
| CALCULATOR_GUIDE.md | 350+ lines | คู่มือฉบับสมบูรณ์ |
| README.md | - | Documentation |
| config.json.example | - | Config template |

## 🎯 Next Steps หลังอัปโหลด

1. ✅ ตรวจสอบ GitHub repository
2. ✅ แชร์ link กับทีม
3. ✅ อัพเดท wiki/documentation
4. ✅ ตั้งค่า GitHub Actions (optional)
5. ✅ เพิ่ม contributors

---

**Repository URL**: https://github.com/wizxbiz/affiliatepro-docs

สร้างโดย Claude Sonnet 4.5 🤖 | 2025-12-12
