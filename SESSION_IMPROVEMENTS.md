# Session Improvements Log
_อัปเดต: 2026-02-21_

---

## 1. TukTukBridge — ขยาย Method Coverage

**ไฟล์:** `lib/tuktuk/services/tuktuk_bridge.dart`
**ก่อน:** ~770 บรรทัด | **หลัง:** ~1650+ บรรทัด

### เพิ่ม 7 sections ใหม่ (37 methods):

| Section | Methods | คำอธิบาย |
|---------|---------|----------|
| 10 | 10 | Seller & Shop Management |
| 11 | 6  | Product Management Extended (pagination, banners) |
| 12 | 6  | Comments System (stream, CRUD, like) |
| 13 | 5  | User Profile Extended (stream, posts, stats) |
| 14 | 4  | Notifications Extended (stream, CRUD) |
| 15 | 4  | Drafts (get, list, save, delete) |
| 16 | 7  | Chat Extended & Real-time Streams |

### เหตุผล:
Screen หลายหน้าเรียก Firestore โดยตรงแทนที่จะผ่าน Bridge — เพิ่มทุก method เข้า Bridge เพื่อให้เป็น single entry point

---

## 2. แก้ Circular Dependency (StackOverflow)

**ไฟล์:**
- `lib/tuktuk/services/tuktuk_bridge.dart`
- `lib/tuktuk/services/tuktuk_tokenomics.dart`

**ปัญหา:** `TukTukBridge._internal()` init `TukTukTokenomics()` และ `TukTukTokenomics._internal()` init `TukTukBridge()` พร้อมกัน → Infinite recursion → StackOverflow

**วิธีแก้:** เปลี่ยน `final` → `late final` ในทั้งสองไฟล์

```dart
// ก่อน (ทำให้ crash)
final TukTukTokenomics _tokenomics = TukTukTokenomics();

// หลัง (lazy init — ปลอดภัย)
late final TukTukTokenomics _tokenomics = TukTukTokenomics();
```

---

## 3. Gemini API Key Security

**ไฟล์:** `lib/tuktuk/services/tuktuk_bridge.dart`

**ก่อน:** Hardcoded API key ใน source code
**หลัง:** ระบบ 2 ชั้น

### ชั้นที่ 1 — Build-time inject (dev):
```dart
static const String _geminiApiKey =
    String.fromEnvironment('GEMINI_API_KEY', defaultValue: '');
```
ใช้ flag: `--dart-define=GEMINI_API_KEY=AIza...` ตอน build

### ชั้นที่ 2 — Cloud Functions proxy (production):
```dart
// ถ้า key ว่าง → ตกไปใช้ Cloud Function อัตโนมัติ
if (_geminiApiKey.isEmpty) {
  return callGeminiViaFunction(prompt, image: image);
}
```

`callGeminiViaFunction()` ใช้ Firebase SDK เรียก `getGeminiResponse` (us-central1)
→ Key อยู่ใน Secret Manager เท่านั้น ไม่เคยอยู่ใน Flutter app

---

## 4. Secret Manager Setup

**Command ที่รัน:**
```bash
firebase functions:secrets:set GEMINI_API_KEY
# ตั้งค่า: AIzaSyCLCWsYWIG3QDYgV0dH_c7G19PKdr5d06Q
# Version: 10 (ล่าสุด)
```

**5 Functions ที่ได้รับ Secret ใหม่:**
- `marketplaceAIGeneratePost` (us-central1)
- `aiContentAssist` (us-central1)
- `lineWebhook` (us-central1)
- `getGeminiResponse` (us-central1)
- `educationAI` (us-central1)

**ไฟล์ที่แก้:**
`functions/.env.yaml` — ลบ `GEMINI_API_KEY` plaintext ออก (ย้ายไป Secret Manager แล้ว)

---

## 5. Flutter Bridge — ใช้ Firebase SDK สำหรับ Gemini

**ก่อน:** `callGeminiViaFunction()` เรียก `callGemini` ผ่าน raw HTTP → **404** (function ไม่มีอยู่)

**หลัง:** ใช้ Firebase Callable SDK เรียก `getGeminiResponse` ที่มีอยู่แล้ว:

```dart
// เพิ่ม import
import 'package:cloud_functions/cloud_functions.dart';

// แก้ callGeminiViaFunction()
final functions = FirebaseFunctions.instanceFor(region: 'us-central1');
final callable = functions.httpsCallable('getGeminiResponse');
final result = await callable.call({
  'text': fullPrompt,
  'sessionId': uid,
  'userName': displayName,
  'chatHistory': [],
});
```

---

## 6. Like Button Analysis

**ผลการตรวจสอบ:** บันทึก Firestore **ถูกต้อง** ✅

**Flow:**
```
_handleLike() → TukTukBridge().toggleLike(postId, collection)
  → runTransaction():
      user_likes/{userId}.postIds  (array add/remove)
      {collection}/{postId}.likes  (FieldValue.increment(±1))
```

**Bug ที่พบ (ยังไม่แก้):**
- `video_player_item.dart` ไม่มี StreamBuilder → Like จากคนอื่นไม่อัปเดต real-time
- `image_post_item.dart` ไม่มี optimistic count update

---

## 7. Lint Fixes

รัน `dart fix --apply` → แก้ 62 issues อัตโนมัติ
แก้เพิ่มเติมด้วยมือ:
- `unawaited()` wrapper สำหรับ fire-and-forget futures
- `curly_braces_in_flow_control_structures` ใน if/else chains
- `const` สำหรับ string literals ที่ไม่เปลี่ยนแปลง

---

## 8. Profile Screen UI Analysis

**ไฟล์:** `lib/tuktuk/screens/profile_screen.dart` (3584 บรรทัด)

### โครงสร้าง Widget Tree หลัก:
```
FadeTransition
  └─ Scaffold (bg: #0A0E21)
      └─ RefreshIndicator
          └─ NestedScrollView (BouncingScrollPhysics)
              ├─ headerSliverBuilder: [SliverAppBar, SliverToBoxAdapter]
              └─ body: TabBarView (4 tabs)
```

### SliverAppBar: `_buildEnhancedPremiumAppBar()` (L.681-759)
- `expandedHeight: 200`
- Cover image + Gradient overlay (transparent → 30% → full dark)
- Leading: back button | Actions: settings/share

### Avatar: `_buildEnhancedProfileHeader()` (L.811-1007)
- `CircleAvatar(radius: 45)` → **90px diameter**
- Border: 3px cyan (#00F2EA) + glow shadow 20px blur
- `Transform.translate(offset: Offset(0, -25))` → ทับ cover 25px

### Stats Row: `_buildEnhancedStatsRow()` (L.1078-1120)
- 4 items: โพสต์ | ผู้ติดตาม | กำลังติดตาม | ถูกใจ
- ใช้ `SingleChildScrollView` + `Row(mainAxisAlignment: spaceAround)`

### Action Buttons (L.864-927)
- ถ้าเป็น "ตัวเอง": แก้ไข + analytics + wallet + QR
- ถ้าเป็นคนอื่น: แชท + ติดตาม/ติดตามแล้ว

### TabBar: `_buildPersistentTabs()` (L.1397-1442)
- 4 แท็บ: โพสต์ | สินค้า | กำลังติดตาม | ผู้ติดตาม
- `SliverPersistentHeader(pinned: true)` — ค้างที่ด้านบน

### ปัญหาที่พบ:

| Priority | ปัญหา | บรรทัด | ผลกระทบ |
|----------|-------|--------|---------|
| 🔴 High | `spaceAround` ใน `SingleChildScrollView` → stats ไม่กระจาย | L.1086 | Stats row ดูแน่น ไม่สม่ำเสมอ |
| 🟡 Medium | Action buttons ไม่มี max-width → overflow บนจอแคบ <320px | L.1009 | Text ล้นออกจากปุ่ม |
| 🟡 Medium | ไม่มี max-width บน tablet/desktop → ยืดเต็มหน้าจอ | L.825 | UX บน tablet แย่ |
| 🟢 Low | Y-offset hardcode `-25` → brittle ต่างหน้าจอ | L.832 | Avatar ตำแหน่งผิดบนบางอุปกรณ์ |
| 🟢 Low | Story highlights/Product image ขนาด hardcode 70/90px | L.1172, 1508 | ไม่ responsive |

---

## 9. Comment Count Fix (Root Cause Found & Fixed)

**ปัญหา:** จำนวนความคิดเห็นไม่แสดงในฟีด

### สาเหตุหลัก 3 ชั้น:

| # | สาเหตุ | ไฟล์ที่แก้ |
|---|--------|-----------|
| 1 | **Firestore Rules** ไม่อนุญาต update `commentsCount` โดยคนอื่น (non-owner) | `firestore.rules` |
| 2 | `createCommunityPost` ไม่ init `commentsCount: 0` → field ไม่มีใน document | `tuktuk_bridge.dart` |
| 3 | `addCommentToPost` ใช้ field ชื่อผิด (`commentCount` → `commentsCount`) | `tuktuk_bridge.dart` |

### แก้ไข:

**1. Firestore Rules** — เพิ่ม `commentsCount` ใน allowed update fields:
```
// ก่อน
hasOnly(['likes', 'views', 'updatedAt'])

// หลัง
hasOnly(['likes', 'views', 'updatedAt', 'commentsCount'])
```
Deploy แล้ว: `firebase deploy --only firestore:rules` ✅

**2. createCommunityPost** — เพิ่ม init:
```dart
'likes': 0,
'views': 0,
'commentsCount': 0,  // ← เพิ่มใหม่
```

**3. Field names** — แก้ทั้ง bridge + CommentsSheet ให้ใช้ `commentsCount` (plural) และ `timestamp` สม่ำเสมอ

---

## ปัญหาที่ยังค้างอยู่ (Pending)

| ปัญหา | ไฟล์ | Priority |
|-------|------|----------|
| `verifyWebPin` region conflict (asia-southeast1 vs us-central1) | `functions/index.js` | Medium |
| Video feed ไม่ real-time like count | `lib/tuktuk/widgets/video_player_item.dart` | Medium |
| `.env` root มี `GOOGLE_API_KEY` ที่ไม่ถูกต้อง (SHA-1 value) | `.env` | Low |

---

## Key Files Reference

| ไฟล์ | บทบาท |
|------|-------|
| `lib/tuktuk/services/tuktuk_bridge.dart` | Central service hub — ทุก Firestore call ผ่านที่นี่ |
| `lib/tuktuk/services/tuktuk_tokenomics.dart` | Token/points system — `late final` เพื่อหลีก circular init |
| `functions/index.js` | Firebase Cloud Functions entry point (~19,000+ lines) |
| `functions/.env.yaml` | LINE secrets only (Gemini ย้ายไป Secret Manager แล้ว) |
| `functions/.env` | LINE channel credentials |
| `.firebaserc` | Project: `appinjproject` |
