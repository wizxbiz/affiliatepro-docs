# 👥 TukTuk Super Admin Configuration

## 🔐 Super Admin Accounts

ระบบรองรับ Super Admin 2 บัญชี ที่มีสิทธิ์เท่าเทียมกันทุกมิติ:

### Admin 1
- **LINE User ID**: `Ud9bec6d2ea945cf4330a69cb74ac93cf`
- **Display Name**: TukTuk Super Admin 1
- **Status**: ✅ Active

### Admin 2
- **LINE User ID**: `U9b40807cbcc8182928a12e3b6b73330e`
- **Display Name**: TukTuk Super Admin 2
- **Status**: ✅ Active

---

## 🎯 สิทธิ์และความสามารถ

ทั้ง 2 Admin มีสิทธิ์เท่าเทียมกันในทุกมิติ:

### ✅ Authentication & Access
- ✅ Login ด้วย PIN ปกติจาก LINE OA (แนะนำ)
- ✅ Google Sign-In (ถ้ามี Email ลงทะเบียน)
- ✅ Firebase Custom Token Authentication

### ✅ Premium Features
- ✅ `isPremium: true`
- ✅ `subscriptionStatus: 'active'`
- ✅ `subscriptionType: 'premium'`
- ✅ `role: 'premium'`

### ✅ Seller & Marketplace
- ✅ `isSeller: true`
- ✅ `isVerified: true`
- ✅ `sellerStatus: 'verified'`
- ✅ เข้าถึง Seller Dashboard
- ✅ จัดการ Marketplace Items
- ✅ ดูและแก้ไข Community Products

### ✅ Admin Privileges
- ✅ `isAdmin: true`
- ✅ เข้าถึง Admin Dashboard
- ✅ จัดการผู้ใช้ทั้งหมด
- ✅ ดู Analytics และ Stats
- ✅ จัดการ Transactions
- ✅ อนุมัติ/ปฏิเสธ Seller Applications

---

## 🔧 Database Configuration

### Collections Updated
1. **`users`** - Main user profiles
2. **`line_users`** - LINE-specific data
3. **`system_admins`** - Admin whitelist

### Fields Set
```javascript
{
  uid: '<LINE_USER_ID>',
  lineUserId: '<LINE_USER_ID>',
  displayName: 'TukTuk Super Admin X',
  role: 'premium',
  isAdmin: true,
  isPremium: true,
  sellerStatus: 'verified',
  isSeller: true,
  isVerified: true,
  subscriptionStatus: 'active',
  subscriptionType: 'premium'
}
```

---

## 🚀 วิธีใช้งาน

### 1. Login ด้วย PIN ปกติ (วิธีมาตรฐาน)

1. เปิด LINE OA: `@tuktukfeed`
2. พิมพ์: `ขอรหัสผ่าน`
3. รับ PIN 6 หลัก
4. ใช้ PIN นั้น Login ในแอป/เว็บ

### 2. Login ด้วย Google (ถ้ามี Email)

1. กด "Login with Google"
2. เลือก Google Account
3. ระบบจะเชื่อมโยงกับ LINE Account อัตโนมัติ

---

## 🛠️ Scripts สำหรับ Admin

### ตั้งค่า Super Admin
```bash
cd functions
node set_joint_admins.js
```

### สร้าง PIN ใหม่
```bash
cd functions
node create_pin.js
```

### ตรวจสอบ PINs
```bash
cd functions
node check_pins.js
```

### ตรวจสอบ User Data
```bash
cd functions
node check_user_data.js
```

---

## 📊 Data Access

### Community Posts
```javascript
// Query posts by either admin
db.collection('community_posts')
  .where('authorId', 'in', [
    'Ud9bec6d2ea945cf4330a69cb74ac93cf',
    'U9b40807cbcc8182928a12e3b6b73330e'
  ])
```

### Marketplace Items
```javascript
// Query items by either admin
db.collection('marketplace_items')
  .where('sellerId', 'in', [
    'Ud9bec6d2ea945cf4330a69cb74ac93cf',
    'U9b40807cbcc8182928a12e3b6b73330e'
  ])
```

---

## 🔒 Security Notes

1. **Emergency PINs** (`957087`, `957088`):
   - ไม่มีวันหมดอายุ
   - ใช้สำหรับ Emergency Access เท่านั้น
   - ควรเก็บเป็นความลับ

2. **Regular PINs**:
   - หมดอายุใน 24 ชั่วโมง
   - ใช้ได้ครั้งเดียว
   - ปลอดภัยกว่า Emergency PIN

3. **Google Sign-In**:
   - ต้องมี Email ลงทะเบียนใน Firestore
   - ระบบจะเชื่อมโยงกับ LINE Account อัตโนมัติ

---

## 📝 Changelog

### 2026-02-10
- ✅ เพิ่ม Admin 2: `U9b40807cbcc8182928a12e3b6b73330e`
- ✅ สร้าง Emergency PIN: `957088`
- ✅ อัปเดต `verifyWebPin` Cloud Function
- ✅ อัปเดต Flutter `verifyPin` method
- ✅ Sync ข้อมูลทั้ง 3 collections

---

## 🆘 Troubleshooting

### ปัญหา: Login ไม่ได้ด้วย PIN
**วิธีแก้:**
1. ตรวจสอบว่า PIN ที่กรอกถูกต้อง (6 หลักจาก LINE OA)
2. ตรวจสอบว่า PIN ยังไม่หมดอายุ (24 ชม.)
3. ตรวจสอบว่า Deploy Cloud Function เสร็จแล้ว
4. ลองกด "ขอรหัสผ่าน" ใน LINE OA ใหม่อีกครั้ง
5. Rebuild Flutter App: `flutter clean && flutter run`

### ปัญหา: ไม่เห็นข้อมูล Community Posts
**วิธีแก้:**
1. ตรวจสอบว่า `uid` ใน Session = LINE User ID
2. รัน `node check_user_data.js` เพื่อดูข้อมูล
3. ตรวจสอบ Firestore Rules

### ปัญหา: Google Sign-In ไม่เชื่อมโยง
**วิธีแก้:**
1. ตรวจสอบว่า Email ตรงกันใน `users` collection
2. ลบแอปแล้ว Login ใหม่
3. ตรวจสอบ Firebase Console → Authorized Domains

---

## 📞 Support

หากมีปัญหาติดต่อ:
- LINE OA: `@tuktukfeed`
- Email: support@tuktukfeed.com
