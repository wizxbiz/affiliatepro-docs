# Homepage UI Development Report
**วันที่:** 2026-03-14
**Branch:** V.4-Ultra
**ขอบเขต:** `public/index.html` · `public/js/index-ui-init.js` · `public/js/app-init.js`

---

## สรุปสิ่งที่พัฒนา

### 1. Profile Card (PC Left Sidebar) — Dynamic User Data

**ก่อน:** Badge "PREMIUM" และ username "@tuktuk_pro" เป็น hardcoded ตายตัว
**หลัง:** โหลดจาก localStorage user session แบบ real-time

| Element | ID ใหม่ | Logic |
|---------|---------|-------|
| Badge tier | `pcProfileBadgeText` | map `tier` → label + gradient color |
| Username | `pcProfileUsername` | `@lineUserId` หรือ `@uid.substring(0,8)` |
| Display name | `pcProfileName` (มีอยู่แล้ว) | `displayName` หรือ `name` จาก session |
| Top nav name | `pcTopNavigatorName` (มีอยู่แล้ว) | sync กับ name เดียวกัน |
| Drawer name | `drawerUserName` | sync |
| Drawer sub | `drawerUserPhone` | แสดง handle แทน phone |

**Tier badge mapping:**
```
trial       → "ทดลองฟรี"  (gray gradient)
starter     → "Starter"   (blue gradient)
premium     → "Premium"   (purple gradient)
yearly_12m  → "Gold"      (amber gradient)
ค่าอื่นๆ    → "สมาชิก"   (indigo gradient)
```

**File:** `public/js/index-ui-init.js` (lines 106–155)

---

### 2. PC Left Sidebar Shortcuts — Real Navigation

**ก่อน:** 4 ปุ่มใช้ `showToast()` (แค่ popup ข้อความ ไม่มีการนำทาง)
**หลัง:** Link ไปยังหน้าจริง

| Shortcut | ก่อน | หลัง |
|----------|------|------|
| บันทึกไว้ | `showToast(...)` | `channel.html` (saved posts ในโปรไฟล์) |
| การสั่งซื้อ | `showToast(...)` | `marketplace.html?tab=orders` |
| ส่วนลด | `showToast(...)` | `marketplace.html?tab=deals` |
| ช่วยเหลือ | `showToast(...)` | `official.html` |

**File:** `public/index.html` (lines 595–622)

---

### 3. Sponsor Card (PC Right Sidebar) — Dynamic from Firestore

**ก่อน:** Hardcoded Unsplash image URL + fixed text
**หลัง:** โหลดจาก Firestore collection `ads` (type=card, active=true, orderBy order)

**Firestore query:**
```javascript
db.collection('ads')
  .where('type', '==', 'card')
  .where('active', '==', true)
  .orderBy('order', 'asc')
  .limit(1)
```

**Fallback:** ถ้า collection ว่าง → แสดง default TukTuk Marketplace content (ไม่แตก)

**IDs เพิ่ม:**
- `pcSponsorCard` — ทั้ง card (สำหรับ onclick dynamic URL)
- `pcSponsorContent` — inner content (inject HTML จาก JS)

**File:** `public/index.html` (line 693) + `public/js/app-init.js` (`pcLoadSponsor()`)

---

### 4. PC Stories Bar — ลบ Hardcoded Dummy Data

**ก่อน:** `index-ui-init.js` inject 5 dummy stories (Unsplash + pravatar URLs)
**หลัง:** แสดง skeleton cards → `pcInit()` โหลดจาก Firestore `community_posts` แทน

**Query (มีอยู่แล้วใน pcLoadStories):**
```javascript
db.collection('community_posts')
  .where('published', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(15)  // filter เอาเฉพาะที่มีรูป → แสดงสูงสุด 6 stories
```

**File:** `public/js/index-ui-init.js` (lines 242–265 ลบออก → แทนด้วย skeleton)

---

### 5. PC Contacts — ลบ Hardcoded Dummy Data

**ก่อน:** `index-ui-init.js` inject 5 dummy contacts (pravatar URLs + ชื่อสุ่ม)
**หลัง:** `pcLoadContacts()` โหลดจาก Firestore `users` (isOnline=true, limit 6)

**File:** `public/js/index-ui-init.js` (lines 267–284 ลบออก)

---

### 6. PC Right Sidebar — เพิ่ม 2 Loaders ที่หายไป

**ก่อน:** `pcInit()` ใน app-init.js ไม่ได้เรียก `pcLoadNewsSection` และ `pcLoadRecommendedProducts`
**หลัง:** เพิ่มใน `Promise.all` ของ `pcInit()`

**Promise.all เดิม (4 tasks):**
```javascript
Promise.all([
    pcLoadSocialFeed(),
    pcLoadStories ? pcLoadStories() : Promise.resolve(),
    pcLoadTrendingSellers ? pcLoadTrendingSellers() : Promise.resolve(),
    pcLoadContacts ? pcLoadContacts() : Promise.resolve(),
])
```

**Promise.all ใหม่ (7 tasks):**
```javascript
Promise.all([
    pcLoadSocialFeed(),
    pcLoadStories(),
    pcLoadTrendingSellers(),
    pcLoadContacts(),
    pcLoadNewsSection(),        // ← ใหม่
    pcLoadRecommendedProducts(),// ← ใหม่
    pcLoadSponsor(),            // ← ใหม่
])
```

**File:** `public/js/app-init.js` (lines 1538–1546)

---

### 7. Functions ใหม่ใน app-init.js

| Function | Collection | Render |
|----------|-----------|--------|
| `pcLoadNewsSection()` | `community_posts` published=true, limit 5 | รายการข่าวพร้อม thumbnail + relative time |
| `pcLoadRecommendedProducts()` | `marketplace_items` status=active, limit 4 | 2×2 grid รูป + ชื่อ + ราคา |
| `pcLoadSponsor()` | `ads` type=card, active=true, limit 1 | inject ลงใน `#pcSponsorContent` |

---

## ไฟล์ที่เปลี่ยนแปลง (รอบที่ 1)

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `public/index.html` | +IDs (`pcProfileBadgeText`, `pcProfileUsername`, `pcSponsorCard`, `pcSponsorContent`) · shortcuts เปลี่ยนเป็น real href |
| `public/js/index-ui-init.js` | profile load ครอบคลุมมากขึ้น · ลบ hardcoded stories/contacts |
| `public/js/app-init.js` | เพิ่ม 3 functions · Promise.all ขยายเป็น 7 tasks · pcInit sync name ทั้ง 2 elements |

---

## Backlog รอบที่ 2 — พัฒนาแล้ว ✅

### 1. ลบ Legacy Tab Bar (`index.html`)
ลบ `<div class="tab-nav-container d-none d-lg-block">` ทั้งบล็อก (~72 บรรทัด) ออกจาก index.html
- แทนด้วย hidden div ขนาดเล็กที่เก็บ badge ID anchors (`pillBadge`, `pillBadgeExp` ฯลฯ) ไว้ให้ JS badge-sync null-guard ทำงานได้
- Tab switching บน Desktop ทำผ่าน `#pcTopNav` แทน (มีอยู่แล้ว)

### 2. `bookmarks.html` — หน้าเก็บความทรงจำ (ใหม่)

**Features:**
- Tab 2 หมวด: **บันทึกไว้** (Firestore `user_bookmarks/{uid}.postIds`) + **ถูกใจ** (localStorage `tuktuk_liked_posts`)
- Query ด้วย `FieldPath.documentId() in [...]` (chunk 10 IDs ทีละรอบ)
- แสดงเป็น 2-column grid พร้อม thumbnail, ชื่อ, stats
- ปุ่ม ✕ ลบออกจาก bookmark (Firestore `arrayRemove`)
- Auth: รองรับทั้ง Firebase Auth + LINE session (localStorage fallback)
- Skeleton loading state

**Firestore:**
```
user_bookmarks/{uid}
  postIds: string[]       ← อ่าน/เขียนโดย tuktuk_feed_logic.js
```

### 3. `orders.html` — หน้าประวัติการสั่งซื้อ (ใหม่)

**Features:**
- Tab filter: ทั้งหมด / รอชำระ / ระหว่างดำเนินการ / เสร็จสิ้น / ยกเลิก
- Summary bar: จำนวน, เสร็จสิ้น, กำลังดำเนินการ, ยอดรวม
- Order card แต่ละใบ: รูปสินค้า, ชื่อ, ร้านค้า, ราคา, สถานะ, action buttons
- Action ตาม status:
  - `pending` → ปุ่มยกเลิก + ชำระเงิน
  - `paid_escrow` → ปุ่มติดตามสินค้า + ยืนยันรับของ (Firestore update → `completed`)
  - `completed` → ปุ่มสั่งซื้ออีกครั้ง
- Fallback query (ไม่มี orderBy index → sort ใน client)
- Auth: Firebase Auth + LINE session fallback

**Firestore:**
```
product_orders/{orderId}
  buyerId: string
  status: 'pending' | 'paid_escrow' | 'completed' | 'cancelled' | 'refunded'
  productName, shopName, productImages, totalAmount, quantity, createdAt
```

### 4. Index.html Shortcuts Update
| Shortcut | ก่อน | หลัง |
|----------|------|------|
| บันทึกไว้ | `channel.html` (ชั่วคราว) | `bookmarks.html` ✅ |
| การสั่งซื้อ | `marketplace.html?tab=orders` | `orders.html` ✅ |

---

## ไฟล์ที่เปลี่ยนแปลง (รอบที่ 2)

| ไฟล์ | สถานะ | การเปลี่ยนแปลง |
|------|-------|---------------|
| `public/index.html` | แก้ไข | ลบ legacy tab bar · อัปเดต shortcuts |
| `public/bookmarks.html` | **สร้างใหม่** | หน้าบันทึกโพสต์ + ถูกใจ |
| `public/orders.html` | **สร้างใหม่** | ประวัติสั่งซื้อ + action buttons |

---

## รอบที่ 3 — PC Top Navigation Bar ครอบคลุมทุกหน้า ✅

**วันที่:** 2026-03-14

### เป้าหมาย
ใช้แถบ `#pcTopNav` เดียวกันกับหน้าหลัก (index.html) แสดงบน **marketplace.html** และ **seller-dashboard.html** โดยไม่ต้อง re-architect ทั้งหน้า

---

### marketplace.html

**ก่อน:** มี `<header class="header">` dark glass เป็นของตัวเอง (ไม่สอดคล้องกับหน้าหลัก)
**หลัง:** Desktop ≥992px → แสดง `#pcTopNav` แทน (ซ่อน `.header` เดิม)

**การเปลี่ยนแปลง:**

1. **เพิ่ม CSS override** (ก่อน `<style>` หลัก):
```css
@media (min-width: 992px) {
    header.header { display: none !important; }
    .marquee-container { margin-top: 64px; }
}
```
//firebase deploy --only hosting


2. **เพิ่ม `#pcTopNav` block** ก่อน `<header class="header">`:
   - Logo → `index.html`
   - Nav icons: หน้าหลัก / ดูเพลิน / **ตลาดนัด** (class `active` — active indicator)
   - Search box sync กับ `#searchInput` ของหน้า → เรียก `searchProducts()` ทันที
   - Bell / Chat → `index.html`, Store → `seller-dashboard.html`, Profile → `channel.html`

3. **Script load profile** จาก localStorage (`user_data` → `tuktuk_line_session` → `wizmobiz_session`)

---

### seller-dashboard.html

**ก่อน:** ไม่มี `pc-layout.css` เลย, มีแค่ custom `.sidebar` dark theme ของตัวเอง
**หลัง:** Desktop → แสดง `#pcTopNav` + ปรับ sidebar ลง 64px

**การเปลี่ยนแปลง:**

1. **เพิ่มใน `<head>`:**
```html
<link rel="stylesheet" href="css/pc-layout.css">
<link rel="stylesheet" href="css/index-vars.css">
```

2. **เพิ่ม CSS offset:**
```css
@media (min-width: 992px) {
    .sidebar       { top: 64px !important; height: calc(100vh - 64px) !important; }
    .main-content  { margin-top: 64px !important; }
    .mobile-toggle { top: 79px !important; }
}
```

3. **เพิ่ม `#pcTopNav` block** ก่อน `.mobile-toggle`:
   - Logo → `index.html`
   - Nav icons: หน้าหลัก / ดูเพลิน / ตลาดนัด (ทั้งหมด link ออกไป)
   - **Store icon** มี highlight สีส้ม (active visual = หน้าปัจจุบัน)
   - Bell / Chat → `index.html`, Profile → `channel.html`

4. **Script load profile** จาก localStorage (เหมือน marketplace.html)

---

### Pattern `#pcTopNav` (Mobile-Safe)

```
<div class="pc-top-nav" id="pcTopNav" style="display:none">
```

- `style="display:none"` — ซ่อนโดย default บนทุก screen
- `pc-layout.css` override ด้วย `display: flex !important` เฉพาะ `@media (min-width:992px)`
- **Mobile ไม่กระทบ** — header/sidebar เดิมของแต่ละหน้ายังทำงานปกติ

---

## ไฟล์ที่เปลี่ยนแปลง (รอบที่ 3)

| ไฟล์ | สถานะ | การเปลี่ยนแปลง |
|------|-------|---------------|
| `public/marketplace.html` | แก้ไข | เพิ่ม `#pcTopNav` · CSS ซ่อน `.header` บน desktop · search sync |
| `public/seller-dashboard.html` | แก้ไข | เพิ่ม `pc-layout.css` · `#pcTopNav` · CSS offset sidebar/main |

---

## สิ่งที่ยังพัฒนาต่อได้ (Remaining)

| รายการ | หมายเหตุ |
|--------|---------|
| Firestore `ads` collection | ต้อง seed ข้อมูล → sponsor card จะแสดงจริง |
| `product_orders` Firestore index | ต้องสร้าง composite index `buyerId + createdAt desc` |
| `user_bookmarks` index | single-field index (auto-managed) |
| `openPostModal()` on index.html | defined ใน `feed-renderer.js` — ตรวจว่า loaded ครบ |
| Search bar PC | `pcInitSearch` ใช้ `titleLower` field — ต้องมี index |
| Bell / Chat icons บน pcTopNav | ปัจจุบัน link กลับ `index.html` — ต่อเชื่อม real notification/chat overlay |
