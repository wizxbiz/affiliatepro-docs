# 🔐 Firestore Security Rules Setup

## ปัญหาที่พบ

```
[cloud_firestore/permission-denied] The caller does not have permission to execute the specified operation.
```

**สาเหตุ**: Firestore Security Rules ไม่อนุญาตให้ Super Admin เขียน/อ่านข้อมูลใน collection `super_admin_chats`

## วิธีแก้ไข

### Option 1: Deploy Rules ผ่าน Firebase CLI (แนะนำ)

1. **ติดตั้ง Firebase CLI** (ถ้ายังไม่มี):
```bash
npm install -g firebase-tools
```

2. **Login เข้า Firebase**:
```bash
firebase login
```

3. **Initialize Firebase ในโปรเจค** (ถ้ายังไม่ได้ทำ):
```bash
cd d:\Flutterapp\caculateapp
firebase init firestore
```
   - เลือก existing project: `appinjproject`
   - Firestore Rules file: `firestore.rules` (ใช้ไฟล์ที่สร้างไว้แล้ว)
   - Firestore Indexes file: `firestore.indexes.json`

4. **Deploy Security Rules**:
```bash
firebase deploy --only firestore:rules
```

5. **ตรวจสอบว่า deploy สำเร็จ**:
   - ไปที่ [Firebase Console](https://console.firebase.google.com/project/appinjproject/firestore/rules)
   - ตรวจสอบว่า Rules ถูกอัปเดตแล้ว

---

### Option 2: Copy & Paste ใน Firebase Console (ง่ายกว่า)

1. **เปิด Firebase Console**:
   - ไปที่: https://console.firebase.google.com/project/appinjproject/firestore/rules

2. **Copy Rules จากไฟล์ `firestore.rules`** ทั้งหมด

3. **Paste ใน Firebase Console**:
   - ลบ Rules เก่าทั้งหมด
   - Paste Rules ใหม่
   - คลิก **"Publish"**

4. **รอสักครู่** (30-60 วินาที) ให้ Rules มีผลทั้งหมด

---

## ตรวจสอบว่า Super Admin มีสิทธิ์

Rules ใหม่จะตรวจสอบว่าผู้ใช้เป็น Super Admin โดยดูจาก:

### 1. ตรวจสอบ `adminRole` field ใน Firestore:

```javascript
/users/{uid}/
  - adminRole: 'super_admin'
```

### 2. หรือตรวจสอบจาก email (Hardcoded):

```javascript
request.auth.token.email == 'imtthailand2019@gmail.com'
```

**วิธีตั้งค่า adminRole ใน Firestore**:

1. ไปที่ [Firestore Database](https://console.firebase.google.com/project/appinjproject/firestore/data)
2. เปิด collection `users`
3. หา document ของ Super Admin (uid)
4. เพิ่ม/แก้ไข field:
   - **Field**: `adminRole`
   - **Type**: `string`
   - **Value**: `super_admin`

---

## ทดสอบว่า Rules ทำงาน

หลังจาก deploy rules แล้ว ให้ทดสอบ:

### 1. ทดสอบใน Super Admin Chat:
```dart
// ส่งข้อความใหม่
_sendMessage('Test message');

// ตรวจสอบ logs
// ควรเห็น: ✅ Saved: Test message
// ไม่ควรเห็น: ❌ Error saving chat message: [permission-denied]
```

### 2. ทดสอบโหลดประวัติ:
```dart
// โหลด sessions
_loadChatSessions();

// ตรวจสอบ logs
// ควรเห็น: ✅ Loaded X chat sessions
// ไม่ควรเห็น: ❌ Error getting chat sessions: [permission-denied]
```

---

## สาเหตุที่เกิด Permission Denied

### ปัญหาที่พบบ่อย:

1. **ไม่มี `adminRole` field** ใน `/users/{uid}`
   - **แก้**: เพิ่ม field `adminRole: 'super_admin'` ใน Firestore

2. **Email ไม่ตรง** (ถ้าใช้ hardcoded email)
   - **แก้**: ตรวจสอบ email ใน `request.auth.token.email`

3. **Rules ยังไม่ deploy**
   - **แก้**: Deploy rules ใหม่และรอ 30-60 วินาที

4. **User ยังไม่ login**
   - **แก้**: Logout และ Login ใหม่

5. **Token หมดอายุ**
   - **แก้**: Logout และ Login ใหม่เพื่อ refresh token

---

## ตรวจสอบ Rules แบบ Real-time (Firebase Console)

1. ไปที่ [Firestore Rules Playground](https://console.firebase.google.com/project/appinjproject/firestore/rules)
2. คลิกที่ Tab **"Rules Playground"**
3. ทดสอบ operation:
   - **Location**: `super_admin_chats/{sessionId}`
   - **Operation**: `get` / `create` / `update`
   - **Auth**: เลือก User ที่ต้องการทดสอบ
4. คลิก **"Run"**

---

## การตรวจสอบ Debug

### ดู Logs ใน Flutter App:

```dart
// ดู user UID และ email
print('UID: ${FirebaseAuth.instance.currentUser?.uid}');
print('Email: ${FirebaseAuth.instance.currentUser?.email}');

// ดู adminRole จาก Firestore
final userDoc = await FirebaseFirestore.instance
    .collection('users')
    .doc(FirebaseAuth.instance.currentUser?.uid)
    .get();
print('Admin Role: ${userDoc.data()?['adminRole']}');
```

### ดู Error Details:

```dart
try {
  await FirebaseFirestore.instance
      .collection('super_admin_chats')
      .doc('test')
      .set({'test': true});
} catch (e) {
  print('Full Error: $e');
}
```

---

## 🎯 Summary - สิ่งที่ต้องทำ

1. ✅ **Deploy Firestore Rules** (ใช้ Option 1 หรือ 2)
2. ✅ **ตั้งค่า adminRole** ใน `/users/{uid}` = `'super_admin'`
3. ✅ **Logout และ Login ใหม่** เพื่อ refresh token
4. ✅ **ทดสอบส่งข้อความ** ใน Super Admin Chat
5. ✅ **ตรวจสอบ logs** ว่าไม่มี permission-denied

---

## 📞 ติดปัญหา?

หากยังพบปัญหา กรุณาตรวจสอบ:

1. Firebase Console > Firestore > Rules (ตรวจสอบว่า rules deploy แล้ว)
2. Firebase Console > Firestore > Data > users > {uid} (ตรวจสอบ adminRole)
3. Flutter App Logs (ตรวจสอบ error message แบบเต็ม)
4. Firebase Console > Rules Playground (ทดสอบ rules)

---

**หมายเหตุ**: หลังจาก deploy rules แล้ว อาจต้องรอ 30-60 วินาทีให้ rules มีผลทั่ว global network ของ Firebase
