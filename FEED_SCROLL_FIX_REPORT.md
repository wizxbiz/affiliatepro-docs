# รายงานการแก้ไข: TukTuk Feed ไถไม่ขึ้น / ทำงานแค่ช่วงบนจอ

**วันที่:** 2026-03-15
**Branch:** V.4-Ultra
**ไฟล์ที่แก้ไข:** 4 ไฟล์ (feed-renderer.js, new-scripts.js, mobile-header.js, tuktuk_feed.css)

---

## ปัญหาที่พบ (เพิ่มเติม)

| # | อาการ | อุปกรณ์ | สถานะ |
|---|-------|---------|-------|
| 3 | หน้าจอค้าง/โหลดไม่ขึ้น (SyntaxError: Identifier already declared) | ทุกอุปกรณ์ | ✅ แก้ไขแล้ว |
| 4 | PC Mode กด Sidebar ไม่ได้ (Menu items unresponsive) | Desktop/PC | ✅ แก้ไขแล้ว |

---

## Root Cause Analysis

### ปัญหา 1 — Laggy (หน่วง)

**สาเหตุ:** `mobile-header.js` ลงทะเบียน `touchmove` listener บน `document` ด้วย `{ passive: false }`

```javascript
// ❌ ก่อนแก้
document.addEventListener('touchmove', _onFeedTouchMove, { passive: false });
```

**กลไก:** เมื่อ listener เป็น `{ passive: false }` บน `document`:
- iOS Safari ต้อง **รอ** ให้ JavaScript รันก่อนทุกครั้งที่ผู้ใช้ขยับนิ้ว
- Browser ไม่สามารถใช้ **fast-path native scroll** ได้
- ผลลัพธ์: ฟีดหน่วง ตอบสนองช้า รู้สึกไม่ลื่น

---

### ปัญหา 2 — ทำงานแค่ช่วงบนจอ

**สาเหตุ:** `.main-app-container` มี CSS `overflow: hidden` + `position: relative` + `height: 100dvh`

```css
/* index-core.css — ไม่ได้แก้ แต่เป็นตัวก่อปัญหา */
.main-app-container {
    height: 100dvh;
    overflow: hidden;   /* ← ตัวการ */
    position: relative; /* ← ตัวการ */
}
```

**กลไก (iOS Safari Bug):**
- iOS Safari ใช้ **DOM paint order** ในการตัดสินว่า element ไหนรับ touch
- `.main-app-container` อยู่ในโครงสร้าง DOM **ก่อน** `#tuktukFeed`
- แม้ `#tuktukFeed` จะมี `z-index: 9900` สูงกว่า แต่ `overflow: hidden` ทำให้ iOS สร้าง scroll layer ที่ **ดักจับ touch** ในพื้นที่ที่มัน render
- ช่วงบนจอทำงานได้ เพราะ `#mobileHeader` (z-index: 10001) มี `pointer-events: none` อยู่แล้ว → touch ผ่านลงไปถึง feed ได้
- ช่วงกลาง-ล่าง: `.main-app-container` ดักจับ touch ก่อน feed ไม่ได้รับ

---

## วิธีแก้ไข

### แก้ 1: `pointer-events: none` บน `.main-app-container` (CSS)

**ไฟล์:** `public/css/tuktuk_feed.css`

```css
/* เมื่อ feed active: ปิด pointer-events ของ sibling ที่ขัดขวาง */
body.feed-mode-active .main-app-container {
  pointer-events: none !important;
}

/* คืน pointer-events ให้ nav bars ยังกดได้ */
body.feed-mode-active .bottom-nav,
body.feed-mode-active #bottomNav,
body.feed-mode-active #mobileHeader,
body.feed-mode-active #mobileHeader * {
  pointer-events: auto !important;
}
```

**ผล:** Touch events ทะลุ `.main-app-container` ลงไปถึง `#tuktukFeed` ได้ทั้งหน้าจอ

---

### แก้ 2: `touch-action: pan-y` บน Feed Container (CSS)

**ไฟล์:** `public/css/tuktuk_feed.css`

```css
#tuktukFeed.tuktuk-feed-container {
  /* ... existing styles ... */
  touch-action: pan-y;  /* ← เพิ่ม */
}
```

**ผล:**
- บอก browser ว่า "handle vertical scroll นี้เอง" → fast native scroll
- ป้องกัน iOS back/forward navigation gesture โดย browser โดยตรง (ไม่ต้องใช้ `e.preventDefault()`)

---

### แก้ 3: เปลี่ยน `touchmove` เป็น `{ passive: true }` (JS)

**ไฟล์:** `public/js/mobile-header.js`

```javascript
// ❌ ก่อนแก้
document.addEventListener('touchmove', _onFeedTouchMove, { passive: false });

// ✅ หลังแก้
document.addEventListener('touchmove', _onFeedTouchMove, { passive: true });
```

พร้อมลบ `e.preventDefault()` ออกจาก `_onFeedTouchMove` (ใช้ไม่ได้กับ passive listener):

```javascript
// ❌ ลบออก (เคยป้องกัน browser back/forward gesture)
if (dx > dy * 1.2 && dx > 10) e.preventDefault();

// ✅ แทนที่ด้วย touch-action: pan-y ใน CSS (ดูข้างบน)
```

**ผล:** iOS Safari ใช้ fast-path native scroll ได้ → ฟีดลื่นทันที

---

## สรุป Flow หลังแก้

```
ผู้ใช้ขยับนิ้ว (ทุกพื้นที่หน้าจอ)
        │
        ▼
.main-app-container  →  pointer-events: none  →  ทะลุผ่าน
        │
        ▼
#tuktukFeed (position:fixed; inset:0; z-index:9900)
        │
        ├── touch-action: pan-y  →  browser scroll เอง (fast)
        ├── scroll-snap-type: y mandatory  →  snap ทีละ slide
        └── -webkit-overflow-scrolling: touch  →  momentum scroll
```

---

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `public/css/tuktuk_feed.css` | เพิ่ม `@media (max-width: 767px)` หุ้ม `pointer-events: none` เพื่อป้องกันบั๊กบน PC, เพิ่ม `touch-action: pan-y`, เปลี่ยน `height` เป็น `inset: 0` |
| `public/js/mobile-header.js` | เปลี่ยน `touchmove` listener เป็น `{ passive: true }`, ลบ `e.preventDefault()` |
| `public/js/new-scripts.js` | ลบการประกาศ `let/const` ซ้ำซ้อน, เปลี่ยนไปใช้ `var` สำหรับ `categoryLabels` และ `authorCache` เพื่อแชร์ cache |
| `public/js/feed-renderer.js` | แก้ไข `SyntaxError` โดยใช้ `var` และเช็ค `window` object ก่อนประกาศตัวแปร Global |

---

## โครงสร้างหน้าหลัก (index.html)

โครงสร้าง DOM ทั้งหมดของหน้าหลัก เพื่อให้เข้าใจว่า element ไหนซ้อนอยู่บน/ใต้ feed

```
<body>
│
├── #welcomeSplash  .welcome-splash
│       └── [Splash screen โหลดแอป — display:none หลัง auth]
│
├── #launchHubOverlay  .launch-hub-overlay
│       └── [Loading overlay สำหรับ Live Commerce — display:none ปกติ]
│
├── #pullToRefresh  .pull-to-refresh
│       position: fixed | top: -80px (ซ่อนอยู่บนจอ) | z-index: 10500
│       pointer-events: none  ✅ ไม่บัง
│
├── #persistent-ui-root
│       pointer-events: none  ✅ (แต่ > * มี pointer-events: auto)
│       └── .bottom-nav          position: fixed | bottom: 0 | z-index: 11000
│               ├── .bottom-nav-item  ×4  (Home / Search / + / Cart / Profile)
│               └── .center-btn  (TukTuk circle button)
│       └── .creation-overlay    position: fixed | inset: 0 | z-index: 10000000
│               display: none ปกติ  ✅ ไม่บัง
│       └── .creation-hub        position: fixed | z-index: 10000001
│       └── .center-hub-title    position: fixed | z-index: 10000002
│
├── #notificationPanel  .notification-panel
│       position: fixed | z-index: (ดู hub-panel CSS) | ซ่อนอยู่ปกติ
│
├── #mobileHeader                          ← 📌 สำคัญ
│       position: fixed | top: 0 | z-index: 10001
│       pointer-events: none  (ตัว parent)  ✅
│       └── #mobileHeader *  pointer-events: auto  (เฉพาะปุ่ม/แท็บ)
│               ├── .mh-tabs
│               │       ├── [ดูเพลิน]  data-cat="all"
│               │       ├── [ใกล้ฉัน]  data-cat="near_me"
│               │       └── [อาชีพ]    data-cat="community"
│               └── .mh-pill-row  (แจ้งเตือน + เสียง)
│
├── #mobileDrawerOverlay  .mobile-drawer-overlay
│       position: fixed | display: none ปกติ  ✅
│
├── #mobileDrawer  .mobile-drawer
│       position: fixed | transform: translateX(-100%) ปกติ  ✅
│
├── .main-app-container                    ← ⚠️ ตัวการปัญหา
│       position: relative
│       height: 100dvh
│       overflow: hidden  ← iOS สร้าง scroll layer ดักจับ touch
│       [feed-mode-active] → pointer-events: none !important  ✅ FIX
│       │
│       ├── #promoBannerSection  .promo-banner-section
│       │       [Banner โปรโมชั่น]
│       │
│       └── .pc-layout-container  (PC 3-column layout)
│               ├── <aside>  PC left sidebar
│               │       └── .pc-menu-item ×n  (ลิงก์เมนู)
│               ├── .pc-main-feed  (คอลัมน์กลาง)
│               │       ├── #standardFeed   [โหมด PC / non-video]
│               │       └── #postsContainer  (รายการโพสต์)
│               └── <aside>  PC right sidebar
│                       ├── #pcNewsSection
│                       └── #pcRecommendedProducts
│
├── .admin-fab-container  #adminFab
│       position: fixed | display: none (เฉพาะ admin)
│
├── [Modals: #adManagerModal, #postModal, #deleteModal, #commentModal]
│       .modal.fade — display: none ปกติ  ✅
│
├── #inChatOverlay
│       position: fixed | inset: 0 | z-index: 9000
│       display: none ปกติ  ✅  (z-index ต่ำกว่า feed 9900)
│
├── #inChatPanel
│       position: fixed | right: 0 | z-index: (ดู chat-panel.css)
│       ซ่อนอยู่ปกติ  ✅
│
├── #mobileOpenChat  .ic-fab
│       position: fixed | bottom: 80px | right: 18px | z-index: 8000
│       z-index ต่ำกว่า feed (9900)  ✅ ไม่บัง
│
└── #tuktukFeed  .tuktuk-feed-container    ← 🎯 เป้าหมาย
        position: fixed | inset: 0 | z-index: 9900
        overflow-y: scroll
        scroll-snap-type: y mandatory
        touch-action: pan-y               ← FIX 2026-03-15
        display: none → block (เมื่อ switchCategory เรียก)
        │
        └── .tuktuk-video-item ×n         (แต่ละสไลด์)
                height: 100dvh
                scroll-snap-align: start
                ├── <video> หรือ <img>    (เนื้อหา)
                ├── .right-sidebar        (ปุ่ม like/share/comment)
                └── .bottom-info          (ชื่อ/คำอธิบาย)
```

---

## z-index Reference Map

| Element | z-index | pointer-events (feed mode) | หมายเหตุ |
|---------|---------|---------------------------|---------|
| `.creation-overlay` | 10,000,000 | none (display:none) | เปิดเฉพาะตอน + กด |
| `.center-hub-title` | 10,000,002 | none | — |
| `.bottom-nav` | 11,000 | **auto** ✅ | nav กดได้ |
| `#pullToRefresh` | 10,500 | none | ไม่บัง |
| `#mobileHeader` | 10,001 | none (parent) / auto (children) | แท็บกดได้ |
| `#tuktukFeed` | **9,900** | — | **เป้าหมายรับ touch** |
| `#inChatOverlay` | 9,000 | none (display:none) | ต่ำกว่า feed |
| `.ic-fab` | 8,000 | auto | ต่ำกว่า feed |
| `.main-app-container` | auto | **none** ✅ FIX | เคยดัก touch |

---

## Deploy

```
firebase deploy --only hosting
✓ hosting[appinjproject]: release complete
URL: https://appinjproject.web.app
```

---

## หมายเหตุทางเทคนิค

> **iOS Safari touch hit-testing bug:** element ที่มี `overflow: hidden` จะสร้าง internal scroll layer ที่ intercept touch events โดยใช้ DOM paint order ไม่ใช่ CSS z-index
> ดังนั้นการ set `pointer-events: none` เป็นวิธีเดียวที่เชื่อถือได้ในการให้ element ที่อยู่ใน DOM ก่อน "ยอมแพ้" touch events ให้กับ fixed overlay ที่มี z-index สูงกว่า

> **passive: true ข้อดี:** browser สามารถเริ่ม native scroll ได้ทันทีโดยไม่รอ JS
> ต้องแลกด้วยการไม่สามารถ call `e.preventDefault()` → ใช้ `touch-action` CSS แทน ซึ่งมีประสิทธิภาพดีกว่า

---

## การแก้ไขเพิ่มเติม (รอบที่ 2) — ความเสถียรและความเข้ากันได้

### แก้ 4: แก้ไข SyntaxError (Duplicate Declaration)
**สาเหตุ:** มีการใช้ `let` และ `const` ประกาศตัวแปรซ้ำกันในหลายไฟล์ (เช่น `postToDelete`, `isAdmin`) เนื่องจากไฟล์ถูกโหลดรวมกันใน `index.html`
**วิธีแก้:**
- ใช้ `var` แทน `let` สำหรับตัวแปร Global ที่ต้องการแชร์กัน
- ใช้ Pattern `var name = window.name || value;` เพื่อป้องกันการเขียนทับค่าเดิม
- ย้ายการประกาศหลักไปไว้ที่ `firebase-init.js` หรือ `app-init.js`

### แก้ 5: PC Mode Compatibility (Sidebar Fix)
**สาเหตุ:** จากการแก้ปัญหา Touch บน iOS ด้วย `pointer-events: none` บน `.main-app-container` ส่งผลให้ Sidebar บน PC (ซึ่งอยู่ใน container นี้) กดไม่ได้
**วิธีแก้:**
- ใช้ **Media Query** เจาะจงเฉพาะ Mobile (`max-width: 767px`)
- ```css
@media (max-width: 767px) {
  body.feed-mode-active .main-app-container {
    pointer-events: none !important;
  }
}
  ```
- ทำให้บน PC ตัวแปร `pointer-events` ยังเป็น `auto` ปกติ สามารถใช้งาน Sidebar ได้

### แก้ 6: Global Data Sharing
**วิธีแก้:** เปลี่ยน `categoryLabels` และ `authorCache` ให้เป็น `var` และเก็บไว้บน `window` เพื่อให้ทั้ง `new-scripts.js` และ `feed-renderer.js` ใช้ข้อมูลชุดเดียวกัน ลดการโหลดซ้ำและประหยัดหน่วยความจำ

---

## การแก้ไขเพิ่มเติม (รอบที่ 3) — 2026-03-15

> ✅ ยืนยัน: ทุกการแก้ไขในรอบนี้ **ไม่กระทบ PC** เนื่องจาก `pointer-events: none` ถูกจำกัดด้วย `@media (max-width: 767px)` และการเปลี่ยนแปลง JS เป็น platform-agnostic

| ไฟล์ | บรรทัด | ปัญหา | สถานะ |
|------|--------|-------|-------|
| `public/js/new-scripts.js` | 260-262 | Bootstrap Modal double-init | ✅ แก้ไขแล้ว |
| `public/js/new-scripts.js` | 338-341 | Global stats ไม่มี `window.` prefix | ✅ แก้ไขแล้ว |
| `public/js/feed-renderer.js` | ~4965 | Community mode ไม่ add `feed-mode-active` | ✅ แก้ไขแล้ว |

---

### แก้ 7: Bootstrap Modal Double-Initialization

**ไฟล์:** `public/js/new-scripts.js`

**สาเหตุ:** `new-scripts.js` (deferred) DOMContentLoaded handler ทำงานหลัง `feed-renderer.js` handler เสมอ (เพราะ feed-renderer.js เป็น non-deferred script จึง register handler ก่อน) แต่ใช้ `new bootstrap.Modal(element)` โดยไม่ตรวจสอบว่ามี instance เดิมหรือไม่ — ทำให้ Bootstrap สร้าง instance ใหม่ทับของเดิม, event listeners จาก instance แรกยังคงค้างอยู่

**กลไกที่ทำให้ผิด:**
- Bootstrap 5 เก็บ instance ผ่าน `Data.set(element, KEY, instance)` บน element
- การเรียก `new bootstrap.Modal(el)` ซ้ำ → `Data.set()` overwrite instance เก่า
- แต่ event listeners ที่ผูกกับ instance เก่าไม่ถูก cleanup → modal อาจทำงานซ้ำหรือ event fire สองครั้ง

```javascript
// ❌ ก่อนแก้ — new-scripts.js
if (commentEl) commentModal = new bootstrap.Modal(commentEl);
if (postEl) postModal = new bootstrap.Modal(postEl);
if (deleteEl) deleteModal = new bootstrap.Modal(deleteEl);

// ✅ หลังแก้
if (commentEl) window.commentModal = bootstrap.Modal.getOrCreateInstance(commentEl);
if (postEl) window.postModal = bootstrap.Modal.getOrCreateInstance(postEl);
if (deleteEl) window.deleteModal = bootstrap.Modal.getOrCreateInstance(deleteEl);
```

**ผล:**
- `getOrCreateInstance()` คืน instance เดิมถ้ามีอยู่แล้ว → ไม่มี double-init
- ใช้ `window.` prefix เพื่อเขียนทับ global อย่างชัดเจน
- **ไม่กระทบ PC** — Bootstrap Modal ทำงานเหมือนกันทั้ง mobile และ desktop

---

### แก้ 8: Global Stats Counter ไม่มี `window.` Prefix

**ไฟล์:** `public/js/new-scripts.js`

**สาเหตุ:** `firebase-init.js` ประกาศ `window.totalPostsCount = 0` และ `window.totalLikesCount = 0` แต่ `updateStats()` ใน `new-scripts.js` อ้างถึงโดยตรงว่า `totalPostsCount = ...` — TypeScript checker ใน VS Code แจ้ง hint ว่าหาตัวแปรไม่เจอ เพราะไม่มีการประกาศใน scope นี้ อาจทำให้ runtime ล้มเหลวในบาง JS engine ที่ strict กว่า

```javascript
// ❌ ก่อนแก้
totalPostsCount = posts.length;
totalLikesCount = posts.reduce((sum, p) => sum + (p.likes || 0), 0);

// ✅ หลังแก้
window.totalPostsCount = posts.length;
window.totalLikesCount = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
```

**ผล:** อัปเดต global state ชัดเจน, ไม่มี implicit global assignment, ลบ VS Code hints

---

### แก้ 10 (Root Cause ที่แท้จริง): `html, body { overflow: hidden !important }` ใน `index-core.css`

**ไฟล์:** `public/css/tuktuk_feed.css`

**สาเหตุที่ปัญหา 1 และ 2 ยังคงอยู่หลังการแก้ครั้งก่อน:**

การแก้ในรอบก่อน (passive:true, touch-action:pan-y, pointer-events:none) ถูกต้อง แต่มีอีกหนึ่งตัวที่ขัดขวางทั้งสองปัญหาพร้อมกัน:

```css
/* index-core.css line 3-11 — โหลดที่ line 85 ใน index.html */
html, body {
    overflow: hidden !important;   ← ตัวการ
    overscroll-behavior-y: none;
}
```

`tuktuk_feed.css` โหลดที่ line 48 (ก่อน `index-core.css` ที่ line 85) ดังนั้น `index-core.css` override ทับทุกอย่างที่ใช้ specificity เท่ากัน

**กลไกที่ทำให้ผิด (ทั้ง 2 ปัญหาพร้อมกัน):**

| ปัญหา | กลไก |
|-------|------|
| Laggy (ทุกอุปกรณ์) | `body { overflow:hidden }` → iOS Safari เห็นหน้าเป็น "locked viewport" → ปิดกั้น native fast-path scroll → ทุก touchmove ต้องรอ JS sync → หน่วง |
| Touch ช่วงกลาง-ล่างไม่ตอบสนอง | `html { overflow:hidden }` + `body { overflow:hidden }` → iOS สร้าง touch capture layer ที่ html/body ดักจับ touch events ก่อน `position:fixed` elements จะได้รับ |

**วิธีแก้ — ใช้ CSS Specificity เอาชนะ `!important`:**

CSS Cascade ด้วย `!important`: เมื่อทั้งสอง rule มี `!important` ตัวที่ **specificity สูงกว่า** ชนะ โดยไม่สนใจลำดับการโหลด

```
body.feed-mode-active  → specificity (0,1,1)  ← สูงกว่า
body (ใน html, body)  → specificity (0,0,1)  ← ต่ำกว่า
```

```css
/* ✅ เพิ่มใน tuktuk_feed.css — ชนะ index-core.css แม้โหลดก่อน */
body.feed-mode-active {
  overflow: auto !important;   /* Unlock body: iOS จะ route touch ถึง #tuktukFeed */
}
```

**ผล:**
- iOS Safari เห็น body เป็น scrollable context → เปิด native fast-path scroll → ฟีดลื่นทันที
- Touch events ถูก route ถึง `position:fixed #tuktukFeed` ได้ทั้งหน้าจอ ไม่ใช่แค่ช่วงบน
- **ไม่กระทบ PC** — `body.pc-mode { overflow: visible !important }` ใน `pc-layout.css` (specificity 0,1,1 เท่ากัน แต่โหลดหลัง → เขียนทับ) + PC ใช้ scroll ปกติ ไม่ได้อยู่ใน feed-mode-active context

---

### แก้ 9: Community Mode ไม่ Add `feed-mode-active`

**ไฟล์:** `public/js/feed-renderer.js`

**สาเหตุ:** `switchCategory()` ใน `feed-renderer.js` มี early-return สำหรับ community mode โดยไม่ได้ add `feed-mode-active` ก่อน return — ถ้า user เปิดหน้าแอปพร้อม URL query `?cat=community` หรือกดแท็บ community เป็นครั้งแรกก่อนที่ `initTukTukFeed()` จะถูกเรียก, class จะไม่ถูก add, ทำให้ `pointer-events: none` fix ไม่ทำงานสำหรับ community feed

**กลไก (edge case):**
- App โหลด → `mobileInit()` เรียก `window.initTukTukFeed(cat)` ตาม `sessionStorage`
- ถ้า `cat = 'community'` → `switchCategory('community')` → early-return โดยไม่ผ่าน `initTukTukFeed` → `feed-mode-active` ไม่ถูก add
- ผล: `.main-app-container` ยังดัก touch อยู่ ฟีด community ตอบสนองช่วงกลาง-ล่างไม่ได้

```javascript
// ✅ หลังแก้ — เพิ่มก่อน early-return ของ community
if (isTuktukMode) {
    document.body.classList.add('feed-mode-active');
}

if (isCommunity) {
    if (typeof initCommunityFeed === 'function') {
        initCommunityFeed(tuktuk);
    }
    if (loader) loader.style.display = 'none';
    return;
}
```

**ผล:**
- `feed-mode-active` ถูก add ทุกครั้งที่ feed mode เปิด ไม่ว่าจะเป็น tab ไหน
- **ไม่กระทบ PC** — CSS `pointer-events: none` ถูกจำกัดด้วย `@media (max-width: 767px)` เท่านั้น → sidebar บน PC ยังใช้งานได้ปกติ

---

## โครงสร้างและฟีเจอร์ Mobile Header — อัพเดต 2026-03-16

> เอกสารนี้สรุปทุก component, state, gesture, และ event flow ของ `#mobileHeader` และ `#mobileDrawer` เพื่อใช้เป็น reference ในการ debug และ extend ต่อไป

---

### 1. HTML โครงสร้าง `#mobileHeader`

```
#mobileHeader  (position:fixed | top:0 | z-index:10001 | mobile only ≤991px)
│   pointer-events: none (container โปร่งใส — touch ผ่านลงไปถึง #tuktukFeed)
│   pointer-events: auto  (ใช้กับ * ทุก children)
│
├── .mh-top-row  (แถวบน — Logo + Tabs + Actions)
│   │
│   ├── .mh-left
│   │   └── .mh-icon-btn.menu-btn  ← ☰ Hamburger → toggleMobileDrawer()
│   │
│   ├── .mh-tabs  (touch-action: pan-x)
│   │   ├── .mh-tab[data-cat="all"]        ← ดูเพลิน  (active เริ่มต้น)
│   │   ├── .mh-tab[data-cat="near_me"]    ← ใกล้ฉัน
│   │   └── .mh-tab[data-cat="community"]  ← อาชีพ
│   │
│   └── .mh-right
│       └── [ปุ่มเพิ่มเติม — search / create]
│
└── .mh-pill-row  (แถวล่าง — collapsed pill)
    └── .mh-pill#mhPill  ← tap → toggleMhPill() → ขยาย/ยุบ
        ├── .mh-pill-notif#mhPillNotif  ← tap → handleMhNotifClick()
        │   ├── <i fa-bell>
        │   ├── #mhPillNotifBadge  (แสดงจำนวนแจ้งเตือน)
        │   └── .mh-pill-label "แจ้งเตือน"
        └── .mh-pill-mute#mhPillMute  ← tap → handleMhMuteClick()
            ├── <i fa-volume-up/off> #mhPillMuteIcon
            └── .mh-pill-label #mhPillMuteLabel "เปิดเสียง/ปิดเสียง"
```

---

### 2. HTML โครงสร้าง `#mobileDrawer` (Side Menu ซ้าย)

```
#mobileDrawerOverlay  position:fixed | z-index:20000 | opacity:0 ปกติ
#mobileDrawer         position:fixed | left:0 | z-index:20001
│                     transform:translateX(-100%) ปกติ → translateX(0) เมื่อ active
│                     touch-action: pan-y
│                     overscroll-behavior: contain
│
├── .drawer-header  (gradient orange)
│   ├── .drawer-close-btn  ← ✕ → toggleMobileDrawer()
│   ├── .drawer-user#drawerUserSection  ← tap → drawerGo('channel.html')
│   │   ├── img.drawer-avatar#drawerAvatar
│   │   └── .drawer-user-info
│   │       ├── <span>#drawerUserName
│   │       └── <small>#drawerUserTier  (free / Premium / Pro)
│   └── .drawer-header-row
│       ├── .drawer-notif-chip  ← drawerGoNotif()
│       │   ├── <i fa-bell>
│       │   ├── #drawerNotifLabel
│       │   └── .drawer-badge#drawerNotifBadge
│       └── .drawer-theme-chip  ← drawerToggleTheme()
│           ├── <i fa-moon/sun>#drawerThemeIcon
│           └── #drawerThemeLabel "กลางวัน/กลางคืน"
│
├── .drawer-content  (min-height:0 — CRITICAL flexbox scroll fix | overflow-y:auto)
│   │
│   ├── ── Section: ฟีด ──
│   │   ├── [หน้าหลัก]         → toggleMobileDrawer() + href index.html
│   │   ├── [ดูเพลิน]          → drawerSwitchTab('all')
│   │   ├── [ใกล้ฉัน]          → drawerSwitchTab('near_me')
│   │   ├── [อาชีพ / คอมมูนิตี้] → drawerSwitchTab('community')
│   │   └── [ตลาดนัด]          → toggleMobileDrawer() + href marketplace.html
│   │
│   ├── ── Section: บัญชีของฉัน ──
│   │   ├── [โปรไฟล์ของฉัน]   → drawerGo('channel.html')
│   │   ├── [ร้านค้าของฉัน]    → drawerGo('seller-dashboard.html')
│   │   ├── [ประวัติคำสั่งซื้อ] → drawerGo('marketplace.html?tab=orders')
│   │   └── [กระเป๋าเงิน]      → drawerGo('seller-dashboard.html?tab=wallet')
│   │       └── #drawerBalance  (แสดงยอดเงิน sync จาก #pudBalance PC)
│   │
│   ├── ── Section: สร้าง ──
│   │   ├── [สร้างโพสต์ใหม่]   → drawerCreatePost()
│   │   ├── [เรียกวินมอเตอร์ไซค์] → drawerGo('win-service.html')
│   │   └── [สมัครเป็นวินไรเดอร์] → drawerGo('win-rider-register.html')
│   │
│   └── ── Section: ระบบ ──
│       ├── [รีเฟรชฟีด]  → drawerClearCache() + PTR animation
│       └── [ออกจากระบบ] → drawerLogout()  (สีแดง)
│
└── .drawer-footer
    ├── [ข้อกำหนดการใช้งาน] → /tos.html
    ├── [นโยบายความเป็นส่วนตัว] → /privacy.html
    └── "TukTuk Version 4.0.0"
```

---

### 3. State Variables (mobile-header.js)

| ตัวแปร | ค่าเริ่มต้น | เก็บที่ | คำอธิบาย |
|--------|-----------|---------|----------|
| `currentMobileCategory` | `'all'` | module scope + `window` (getter) | tab ที่ active อยู่ปัจจุบัน |
| `isMhPillExpanded` | `false` | module scope | pill ขยายอยู่หรือไม่ |
| `isTuktukGlobalMuted` | localStorage | localStorage `tuktuk_muted` | สถานะ mute ทั้งแอป |
| `isTuktukAutoScroll` | `true` | localStorage `tuktuk_autoscroll` | auto-play เปิด/ปิด |
| `mhNotifCount` | `0` | module scope | จำนวน notification |
| `mhChatCount` | `0` | module scope | จำนวน chat unread |
| `_is2x` | `false` | module scope | 2× speed active |
| `_touchStartTime` | `0` | module scope | timestamp touchstart (0 = ไม่มี active touch) |

---

### 4. Tab Navigation Flow

```
ผู้ใช้กด Tab หรือ Swipe
        │
        ▼
switchCategoryMobile(category, element)   ← mobile-header.js
        │
        ├── isSameTab?
        │   ├── near_me → showProvincePicker()
        │   └── other   → scrollTo(top) + loadPosts()
        │
        ├── อัพเดต .mh-tab.active
        ├── currentMobileCategory = category
        ├── navigator.vibrate(5)
        │
        ▼
window.switchCategory(category)           ← feed-renderer.js
        │
        ├── FeedRenderer.currentCategory = category
        ├── อัพเดต .tab-btn.active        (legacy PC tabs)
        ├── อัพเดต .mh-tab.active         ← FIX 2026-03-16
        ├── feed-mode-active class
        │
        ├── community? → initCommunityFeed()
        └── other      → initTukTukFeed(category)
```

---

### 5. Gesture System (Feed + Tabs)

**Zone ที่รับ touch:**
```
Guard: e.target.closest('#tuktukFeed') || e.target.closest('.mh-tabs')
```

| Gesture | Threshold | Action |
|---------|-----------|--------|
| Horizontal swipe | `absDx >= 55px` และ `absDx >= absDy × 1.8` | เปลี่ยน tab (ซ้าย=next, ขวา=prev) |
| Short tap (< 400ms, ไม่เคลื่อน) | ไม่ใช่ button/a/mh-tab | เปิด Speed Menu |
| Long-press (≥ 400ms, ไม่เคลื่อน) | ไม่ใช่ button/a/mh-tab | 2× playback speed |
| Release long-press | — | คืน 1× speed |

**Tab Swipe Flow:**
```
_handleTabSwipe(delta)
        │
        ├── ขอบ tab (ไม่มีอีก) → _nudgeEdge()  (feed เขยิบแล้วกลับ 120ms)
        │
        └── switchCategoryMobile(cat, tab)
            + tab.scrollIntoView()
            + _showSwipeIndicator(cat)   (popup กลางจอ 900ms)
            + requestAnimationFrame sync .mh-tab.active
```

---

### 6. Notification & Mute Pill

```
.mh-pill (collapsed: แสดงแค่ icon ขนาดเล็ก)
        │
        ▼  tap
.mh-pill.expanded  (ขยาย full-width row)
        │
        ├── [🔔 แจ้งเตือน] → toggleNotifications()  [ถ้ามี badge แสดงจำนวน]
        └── [🔊 เสียง]     → toggle mute + syncTuktukVolume() + localStorage
        │
        auto-collapse หลัง 4 วินาที
```

**Badge update API:**
```javascript
window.updateMhNotifBadge(count)  // เรียกจาก feed-renderer.js
window.updateMhChatBadge(count)   // เรียกจาก chat service → sync bottom nav
```

---

### 7. Speed Menu (เปิดด้วย Tap บนฟีด)

```
#feedSpeedMenu  position:fixed | center screen | z-index:20000
├── [⚡ Auto]  toggle isTuktukAutoScroll → event 'tuktukAutoScrollChange'
├── [2× เร็ว] toggle 2× playback speed บน video ทุกตัว
└── [🔊 เสียง] toggle global mute
        │
        auto-hide หลัง 3.5 วินาที (reset เป็น 2.5s ทุกครั้งที่กด)
```

---

### 8. Drawer Sync ตอนเปิด (`_drawerSyncAll`)

| ฟังก์ชัน | ซิงค์อะไร |
|----------|----------|
| `_drawerSyncUser()` | ชื่อ / avatar / tier จาก `WizmobizAuth.getUser()` หรือ localStorage |
| `_drawerSyncNotif()` | badge จาก `mhNotifCount` |
| `_drawerSyncTheme()` | icon sun/moon ตาม `body.dark-mode` |
| `_drawerSyncBalance()` | ยอดเงินจาก `#pudBalance` (PC UserMenu) |

**Re-sync ตอน auth เปลี่ยน:**
```javascript
window._drawerSyncUser()  // เรียกจาก WizmobizAuth หลัง login
```

---

### 9. Province Picker (tab ใกล้ฉัน)

```
tap [ใกล้ฉัน] ครั้งที่ 2 (isSameTab = true)
        │
        ▼
showProvincePicker()
        │
        ├── รายการ 77 จังหวัด  (เลือกได้ → selectProvince(province))
        ├── [ตำแหน่งปัจจุบัน] → useCurrentLocation()
        │       └── GPS → Nominatim reverse geocoding → selectProvince()
        └── ค้นหาจังหวัดได้ (filter real-time)

selectProvince(province)
        │
        ├── localStorage 'selectedProvince' = province
        ├── อัพเดต .mh-tab[near_me] span text = province name
        ├── initTukTukFeed('near_me') หรือ switchCategory('near_me')
        └── showToast('📍 แสดงสินค้าในจังหวัด ${province}')
```

---

### 10. Bottom Nav — พฤติกรรมใน Feed Mode (FIX 2026-03-16)

| สถานะ | Bottom Nav | เหตุผล |
|-------|-----------|--------|
| ปกติ (ไม่ใช่ feed) | แสดง | — |
| `feed-mode-active` | `translateY(100%)` + `pointer-events:none` | ไม่บัง feed ช่วงล่าง (เคยเป็น dead zone ~60px) |

```css
body.feed-mode-active .bottom-nav,
body.feed-mode-active #bottomNav {
  transform: translateY(100%) !important;  /* slide ออกด้วย transition 0.3s ที่มีอยู่แล้ว */
  pointer-events: none !important;
}
```

---

### 11. ตาราง Fixes รอบ 2026-03-16

| # | ไฟล์ | สิ่งที่แก้ | ปัญหาที่แก้ |
|---|------|-----------|------------|
| F1 | `mobile-header.js:431` | ขยาย guard จาก `#tuktukFeed` เพิ่ม `.mh-tabs` | Swipe บน tab bar ไม่ทำงาน |
| F2 | `mobile-header.css:92` | เพิ่ม `touch-action: pan-x` บน `.mh-tabs` | iOS disambiguation delay 300ms |
| F3 | `tuktuk_feed.css:31` | แยก bottom-nav ออก → `translateY(100%) + pointer-events:none` | Dead zone 60px ล่างหน้าจอ |
| F4 | `feed-renderer.js:4945` | เพิ่ม `.mh-tab` sync ใน `switchCategory()` | Tab indicator ไม่ไปตาม swipe |
| F5 | `feed-renderer.js:5004` | Guard touchstart/end ด้วย `feed-mode-active` | Duplicate swipe handler + author profile pop-up ผิดที่ |

---

### 12. window API ที่ export ออกมา

```javascript
// Tab
window.switchCategoryMobile(category, element)
window.currentMobileCategory  // getter (read-only)

// Drawer
window.toggleMobileDrawer()
window.drawerGo(url)
window.drawerSwitchTab(cat)
window.drawerCreatePost()
window.drawerGoNotif()
window.drawerToggleTheme()
window.drawerLogout()
window._drawerSyncUser()   // เรียกหลัง login

// Province
window.showProvincePicker()
window.selectProvince(province)
window.useCurrentLocation()

// Pill / Mute
window.toggleMhPill(event)
window.handleMhNotifClick(event)
window.handleMhMuteClick(event)
window.updateMhNotifBadge(count)
window.updateMhChatBadge(count)

// Speed Menu (Feed)
window._fsmToggleAuto()
window._fsm2xToggle()
window._fsmToggleMute()
window._hideSpeedMenu()

// Auto-scroll
window.toggleAutoScrollMobile()
```

---

## Browser Compatibility Fixes — 2026-03-16

### สรุปปัญหา

ระบบใช้ฟีเจอร์ CSS/JS ที่ทันสมัย ซึ่งบางส่วนไม่มี fallback สำหรับ iOS เก่า / Android mid-range

### ตาราง Browser Support

| Feature | ไฟล์ | iOS รองรับตั้งแต่ | Android Chrome | ความเสี่ยง |
|---------|------|-----------------|----------------|-----------|
| `100dvh` | หลายไฟล์ | **15.4+** | 108+ | ❌ iOS ≤ 15.3 → ค่า invalid → element สูงผิด |
| `overflow: clip` | `tuktuk_feed.css` | 16+ | 90+ | ✅ มี `@supports` guard แล้ว |
| `css :has()` | `tuktuk_feed.css` | 16+ | 105+ | ✅ อยู่ใน `@supports(overflow:clip)` block — double-guarded |
| `overscroll-behavior` | `mobile-drawer.css` | 16+ | 63+ | ⚠️ iOS ≤ 15 → drawer scroll chain ไปถึง body (ยังใช้งานได้ แค่ไม่มี overscroll stop) |
| `touch-action: pan-x/pan-y` | `mobile-header.css`, `tuktuk_feed.css` | 13+ | 35+ | ✅ รองรับกว้าง |
| `navigator.vibrate()` | `mobile-header.js` | **ไม่รองรับเลย** | 32+ | ✅ มี guard `if (navigator.vibrate)` — ไม่ crash |
| `backdrop-filter: blur()` | `mobile-drawer.css`, `index-core.css` | 9+ | 76+ | ⚠️ GPU heavy บน RAM ≤ 3GB — อาจ jank |
| `scroll-snap-type: y mandatory` | `tuktuk_feed.css` | 11+ | 69+ | ⚠️ iOS 11-12 มี bug — scroll lock ค้างได้ (base user < 1%) |
| `IntersectionObserver` | `tuktuk_feed_logic.js` | 12.2+ | 51+ | ✅ รองรับกว้าง |

---

### สิ่งที่แก้ไข — `100dvh` Fallback

**ปัญหา:** CSS อ่าน property ตามลำดับ และหยุดที่ค่าสุดท้ายที่ browser รู้จัก iOS ≤ 15.3 ไม่รู้จัก `dvh` → ค่าถูก ignore → element ใช้ height เดิมจาก property ก่อนหน้า (หรือ `auto`)

**วิธีแก้:** เพิ่ม `height: 100vh` ก่อน `height: 100dvh` ทุกจุด — browser รุ่นเก่าหยุดที่ `100vh`, รุ่นใหม่ override ด้วย `100dvh`

```css
/* ❌ ก่อนแก้ — iOS ≤ 15.3 ไม่มี height */
height: 100dvh;

/* ✅ หลังแก้ — progressive enhancement */
height: 100vh;   /* fallback: iOS ≤ 15.3, Android Chrome < 108 */
height: 100dvh;  /* override: iOS 15.4+, Chrome 108+ — tracks address bar show/hide */
```

| ไฟล์ | Element | บรรทัด |
|------|---------|--------|
| `tuktuk_feed.css` | community feed scroll container | 1106 |
| `tuktuk_feed.css` | `.feed-error-state` | 2019 |
| `mobile-drawer.css` | `.mobile-drawer` | 31 |
| `index-core.css` | `.main-app-container` | 32 |
| `index-core.css` | PC right sidebar panel | 2434 |
| `new-styles.css` | `.main-app-container` | 44 |
| `new-styles.css` | PC right sidebar panel | 2073 |

ไฟล์ที่มี fallback อยู่แล้ว (ไม่แก้):
- `tuktuk_feed.css` — `.tuktuk-video-item` ✅
- `tuktuk-feed-vertical.css` — feed container + video item ✅
- `tuktuk_feed_logic.js` — inline style `height:100vh;height:100dvh` ✅

---

### จุดที่ยอมรับได้ (ไม่แก้)

| จุด | เหตุผล |
|-----|--------|
| `navigator.vibrate()` iOS | มี guard แล้ว — ไม่มี haptic แต่ไม่ crash ✅ |
| `overscroll-behavior` iOS ≤ 15 | Progressive enhancement — drawer ยังใช้งานได้ปกติ เพียงแค่ scroll chain ไม่หยุด |
| `scroll-snap-type mandatory` iOS 11-12 | Base user < 1% — ไม่คุ้มที่จะลด UX ของคนส่วนใหญ่เพื่อรองรับ |
| `backdrop-filter` GPU heavy | ลดได้ด้วย `@media (prefers-reduced-motion)` ถ้าผู้ใช้เปิด — ยังไม่แก้ในรอบนี้ |

---

## การแก้ไขรอบสุดท้าย (Root Cause Analysis รอบที่ 4) — 2026-03-16

**อาการ:** เลื่อนฟีดได้เพียงบริเวณกลางจอขึ้นไป — ส่วนล่างหน้าจอ (ประมาณ 70-104px) ไม่ตอบสนองต่อ touch ในทุกอุปกรณ์

---

### การวิเคราะห์ก่อนแก้ไข

#### โครงสร้าง DOM ที่สำคัญ

```
<body>                                      ← html,body { overflow:hidden !important }
  <div id="persistent-ui-root"></div>       ← ว่างเปล่า (static, line 204)
  <div id="mobileHeader">…</div>            ← z-index:10001  (line 419)
  <div class="main-app-container">…</div>   ← position:relative (line 474–880)
  …modals, admin fab…
  <div id="tuktukFeed" style="display:none"> ← z-index:9900  (line 1489, direct <body> child)
  </div>
  ↑ JS-injected #persistent-ui-root > .bottom-nav  (z-index:11000, position:fixed, bottom:0)
</body>
```

`#tuktukFeed` เป็น direct child ของ `<body>` (ไม่ได้อยู่ใน `.main-app-container`) — ถูกออกแบบมาเพื่อหลีกเลี่ยง ancestor `overflow:hidden` block

---

### สาเหตุที่ 1 (หลัก — ทุกอุปกรณ์, ทุก browser)

**`body { padding-bottom: 70px }` ไม่ถูก reset ในโหมด feed**

`persistent-ui.css`:
```css
body:not(.is-embedded) {
    padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px)) !important;
    /* ≈ 70px บน Android, 104px บน iPhone ที่มี home indicator */
}
```

กลไก:
- `body { overflow:hidden; padding-bottom:70px }` → body's box model รวม padding zone 70px ที่ด้านล่าง
- แม้ `overflow:hidden` จะซ่อน padding ทางสายตา แต่ **iOS/Android ยังคง route touch events ไปที่ body's padding zone** เพราะ padding เป็นส่วนหนึ่งของ element's hit-test box
- `#tuktukFeed { position:fixed; inset:0 }` ครอบพื้นที่นั้นทางสายตา แต่ body scroll context ได้รับ touch ก่อน
- Body `overflow:hidden` → scroll ไม่ได้ → gesture ถูกกลืนหายไป
- **ผลลัพธ์:** bottom ~70-104px เป็น dead zone ในทุกอุปกรณ์

---

### สาเหตุที่ 2 (Chrome 90-104, Android ปี 2021-2022)

**`html { overflow:hidden }` ไม่ถูก reset เพราะ `:has()` ไม่รองรับ**

```css
/* ปัจจุบัน (ก่อนแก้) */
@supports (overflow: clip) {
  html:has(body.feed-mode-active) { overflow: clip !important; }  ← ต้องการ :has()
  body.feed-mode-active { overflow: clip !important; }
}
```

| Browser | `overflow:clip` | `:has()` | html ถูก fix? |
|---------|----------------|---------|--------------|
| Chrome 90-104 (Android 2021-22) | ✅ | ❌ | **ไม่ได้** ← บั๊ก |
| Chrome 105+ | ✅ | ✅ | ✅ |
| iOS 16+ (Safari 16) | ✅ | ✅ | ✅ |
| iOS 15 (Safari 15) | ❌ | ❌ | **ไม่ได้** ← บั๊ก |

บน Chrome 90-104: `html { overflow:hidden }` ยังอยู่ → html scroll context ดัก touch events เพิ่มเติม

---

### สาเหตุที่ 3 (iOS 15 / Safari 15)

**`overflow:clip` ไม่รองรับ → ทั้ง html และ body ยังคง `overflow:hidden`**

`@supports (overflow:clip)` = `false` บน iOS 15 → block ทั้งหมดถูก skip → `html, body { overflow:hidden !important }` จาก `index-core.css` ทำงานต่อ → สร้าง scroll context 2 ชั้น → touch routing พัง

---

### สาเหตุที่ 4 (Tablet / Landscape Phone 768-991px)

**Breakpoint `@media (max-width: 767px)` แคบเกินไป**

```css
/* ก่อนแก้ */
@media (max-width: 767px) {
  body.feed-mode-active .main-app-container { pointer-events: none !important; }
}
```

Mobile header แสดงถึง `max-width: 991px` แต่ fix นี้ครอบถึงแค่ 767px → screens 768-991px `.main-app-container` ยังคง `pointer-events:auto` → iOS paint-order hit-test ส่ง touch ไปที่ container แทน feed

---

### สรุปลำดับความสำคัญ

| # | สาเหตุ | อุปกรณ์ที่กระทบ | ผลกระทบ |
|---|--------|----------------|---------|
| 1 | `body padding-bottom:70px` ไม่ reset | **ทุกอุปกรณ์** | Bottom ~70px dead zone ✴️ **หลัก** |
| 2 | `html:has()` ไม่ทำงาน Chrome 90-104 | Android 2021-22 | html scroll context รบกวนเพิ่ม |
| 3 | `overflow:clip` ไม่รองรับ iOS 15 | iPhone iOS 15 | html+body ล็อก touch ทั้งหมด |
| 4 | Breakpoint 767px ควรเป็น 991px | Tablet/landscape | pointer-events รั่วที่ container |

---

### การแก้ไข

#### FIX 1 — `public/css/tuktuk_feed.css` (Primary fix, ทุกอุปกรณ์)

```css
/* body padding-bottom reset */
body.feed-mode-active:not(.is-embedded) {
  padding-bottom: 0 !important;
}
```

ยกเลิก padding 70px ของ `persistent-ui.css` ในโหมด feed — ลบ body's padding dead zone ออกทันที

---

#### FIX 2 — `public/css/tuktuk_feed.css` + JS (Chrome 90-104)

**CSS:**
```css
@supports (overflow: clip) {
  html.feed-mode-active,           /* ← เพิ่ม: JS class fallback สำหรับ Chrome 90-104 */
  html:has(body.feed-mode-active) {
    overflow: clip !important;
  }
  body.feed-mode-active {
    overflow: clip !important;
  }
}
```

**JS — `tuktuk_feed_logic.js` (line 1623):**
```javascript
document.body.classList.add('feed-mode-active');
document.documentElement.classList.add('feed-mode-active'); // ← เพิ่ม: Chrome 90-104 fallback
```

**JS — `feed-renderer.js` (line 4972):**
```javascript
if (isTuktukMode) {
    document.body.classList.add('feed-mode-active');
    document.documentElement.classList.add('feed-mode-active'); // ← เพิ่ม
}
```

ทั้ง JS เพิ่ม class ที่ `<html>` โดยตรง → `html.feed-mode-active { overflow:clip }` ทำงานได้แม้ไม่มี `:has()`

---

#### FIX 3 — `public/css/tuktuk_feed.css` (iOS 15 / Safari 15)

```css
@supports not (overflow: clip) {
  html.feed-mode-active,
  body.feed-mode-active {
    overflow: visible !important;
  }
}
```

บน iOS 15 ที่ `overflow:clip` ไม่รองรับ → เปลี่ยนเป็น `visible` เพื่อหยุด html/body สร้าง scroll context
Content ยังถูก clip อยู่โดย `.main-app-container { overflow:hidden }` และ `#tuktukFeed { position:fixed; inset:0 }` → ไม่มี layout bleed

---

#### FIX 4 — `public/css/tuktuk_feed.css` (Tablet/Landscape)

```css
/* ก่อน */
@media (max-width: 767px) { … }

/* หลัง */
@media (max-width: 991px) { … }
```

ขยาย breakpoint ให้ครอบ tablet และ landscape phone ที่ mobile header ยังแสดงอยู่

---

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `public/css/tuktuk_feed.css` | FIX 1: padding reset / FIX 2: html.feed-mode-active selector / FIX 3: `@supports not` block / FIX 4: breakpoint 767→991px |
| `public/js/tuktuk_feed_logic.js` | FIX 2: เพิ่ม `documentElement.classList.add('feed-mode-active')` |
| `public/js/feed-renderer.js` | FIX 2: เพิ่ม `documentElement.classList.add('feed-mode-active')` |
