# แผนการ Modularize `public/index.html`

> วิเคราะห์วันที่: 2026-03-09
> ขนาดปัจจุบัน: **11,077 บรรทัด**
> เป้าหมาย: index.html เหลือเพียงโครงสร้าง HTML หลัก (~500 บรรทัด)

---

## สถานะปัจจุบัน — สิ่งที่ทำเสร็จแล้ว ✅

### CSS — แยกออกไปแล้ว (8 ไฟล์)

| ไฟล์ | ขนาด | เนื้อหา |
|------|-----:|---------|
| `css/index-vars.css` | 509 B | CSS variables / design tokens |
| `css/index-animations.css` | 3.0 KB | Keyframe animations |
| `css/index-core.css` | 3.9 KB | Core layout, base styles |
| `css/overlays-premium.css` | 3.2 KB | Premium overlay UI |
| `css/index-components.css` | 3.0 KB | Reusable component styles |
| `css/index-pc-layout.css` | 938 B | PC-specific layout |
| `css/creator-studio.css` | 1.1 KB | Creator Studio panel |
| `css/chat-panel.css` | 10.9 KB | Chat panel styles |
| `css/pc-layout.css` | 29.4 KB | Full PC layout (ใหญ่ที่สุด) |
| `css/tuktuk_feed.css` | 20.4 KB | Feed styles |
| `css/persistent-ui.css` | 10.5 KB | Persistent UI elements |
| `css/tab-nav.css` | 6.0 KB | Tab navigation |
| `css/mobile-header.css` | 6.2 KB | Mobile header |

### JavaScript — แยกออกไปแล้ว (35+ ไฟล์)

| ไฟล์ | เนื้อหา |
|------|---------|
| `js/firebase-init.js` | Firebase initialization |
| `js/auth.js` | Authentication |
| `js/core-utils.js` | Core utilities |
| `js/admin-controller.js` | Admin controls |
| `js/chat-web.js` | Web chat |
| `js/ui-helpers.js` | UI helper functions |
| `js/ad-system.js` | Ad system |
| `js/interleaved-engine.js` | Feed interleaving |
| `js/gallery-engine.js` | Gallery/media |
| `js/news-feed.js` | News feed |
| `js/tuktuk-engine.js` | TukTuk core engine |
| `js/creator-engine.js` | Creator Studio |
| `js/pc-feed-engine.js` | PC feed |
| `js/main-feed-engine.js` | Main feed |
| `js/pwa-manager.js` | PWA management |
| `js/spa-router.js` | SPA routing |
| `js/pwa-lifecycle.js` | PWA lifecycle |
| `js/chat-panel.js` | Chat panel logic |
| `js/pwa-install.js` | PWA install prompt |
| `js/push-notifications.js` | Push notifications |
| `js/app-init.js` | App initialization |
| `js/mobile-header.js` | Mobile header logic |
| `js/persistent-ui.js` | Persistent UI |
| `js/tuktuk_cache.js` | Cache layer |
| `js/tuktuk_telemetry.js` | Analytics/telemetry |

---

## สิ่งที่ยังเหลืออยู่ใน index.html ❌

### Inline `<style>` blocks — 4 บล็อก ยังไม่ย้าย

| บรรทัด | เนื้อหา | ย้ายไปที่ |
|--------|---------|----------|
| L.155–3983 | `.ai-assistant-btn`, `.premium-*`, `.creator-*` และอื่นๆ (~3,800 บรรทัด!) | `css/index-core.css` หรือ module ใหม่ |
| L.3996–4006 | Empty placeholder (comment เท่านั้น) | **ลบทิ้ง** |
| L.4364–4366 | Comment เท่านั้น "moved to tab-nav.css" | **ลบทิ้ง** |
| L.4954–5426 | `.admin-fab-container`, `.creator-studio-*` (~470 บรรทัด) | `css/admin-fab.css` (ใหม่) |

### Inline `<script>` blocks — ยังไม่ย้าย

| บรรทัด | เนื้อหา | ย้ายไปที่ |
|--------|---------|----------|
| L.4012–4171 | Profile image auto-update, `window.load` handler | `js/index-ui-init.js` (มีอยู่แล้ว) |
| L.4368–4571 | `setPillNotifCount()`, `updatePillUI()`, mute pill logic | `js/tab-nav-controller.js` (ใหม่) |
| L.9671–11077 | Creator panel scripts, video player, marketplace inline handlers | กระจายตาม module |

### CSS ที่ load ซ้ำ ⚠️

```html
<!-- L.53 -->  <link rel="stylesheet" href="css/pc-layout.css">
<!-- L.84 -->  <link rel="stylesheet" href="css/pc-layout.css">   ← ซ้ำ!
```
**ต้องลบ** L.53 ออก (เหลือแค่ L.84)

---

## แผนงานที่เหลือ

### Phase A — ลบ empty/comment `<style>` blocks (5 นาที)

```
ลบ L.3996–4006  (empty style block)
ลบ L.4364–4366  (comment-only style block)
ลบ L.53         (duplicate pc-layout.css link)
```

### Phase B — ย้าย inline `<style>` L.4954–5426

สร้างไฟล์ใหม่: `css/admin-fab.css`
- `.admin-fab-container`
- `.creator-studio-*` styles ที่ยังไม่ได้ย้าย

### Phase C — ย้าย inline `<script>` L.4012–4171

ย้ายเข้า `js/index-ui-init.js` (ไฟล์นี้มีอยู่แล้ว)
- Profile image update logic
- localStorage user_data reader

### Phase D — ย้าย inline `<script>` L.4368–4571

สร้างไฟล์ใหม่: `js/tab-nav-controller.js`
- `setPillNotifCount()`
- `updatePillUI()`
- Mute pill logic

### Phase E — ย้าย inline `<style>` L.155–3983 (ใหญ่สุด ~3,800 บรรทัด)

⚠️ **ต้องระวังที่สุด** — ต้อง audit ก่อนว่ามี style ใดบ้างที่ยังไม่มีใน external CSS

แนะนำ: audit ทีละส่วน แล้ว append เข้าไฟล์ที่เหมาะสม:

| เนื้อหา | ไฟล์ปลายทาง |
|---------|------------|
| `.ai-assistant-btn` | `css/index-components.css` |
| `.premium-*` overlays | `css/overlays-premium.css` |
| `.creator-*` | `css/creator-studio.css` |
| `.admin-*` | `css/admin-fab.css` (ใหม่) |
| ที่เหลือ | `css/index-core.css` |

### Phase F — ย้าย inline scripts ใน creator/marketplace (L.9671–11077)

Scripts เหล่านี้อยู่ลึกใน HTML structure:
- Creator panel event handlers → `js/creator-engine.js`
- Video player inline init → `js/gallery-engine.js`
- Marketplace inline handlers → `js/tuktuk-engine.js`

---

## สรุปสถานะ

```
CSS modularization:
  ✅ External CSS files: 13 ไฟล์
  ❌ Inline <style> ยังเหลือ: 4 blocks (~4,300 บรรทัด)
  ⚠️  Duplicate CSS link: 1

JS modularization:
  ✅ External JS files: 35+ ไฟล์
  ❌ Inline <script> ยังเหลือ: ~8 blocks
  ❌ Deep-nested scripts: L.9671–11077

index.html ปัจจุบัน:
  Total: 11,077 บรรทัด
  เป้าหมาย: ~500 บรรทัด (HTML structure เท่านั้น)
  เหลืองาน: ~10,577 บรรทัดต้องย้ายออก
```

---

## ลำดับความสำคัญ

| # | Phase | ความเสี่ยง | เวลา |
|---|-------|-----------|------|
| A | ลบ empty blocks + duplicate CSS | 🟢 ต่ำ | 5 นาที |
| B | `css/admin-fab.css` (L.4954) | 🟢 ต่ำ | 15 นาที |
| C | `js/index-ui-init.js` (L.4012) | 🟢 ต่ำ | 10 นาที |
| D | `js/tab-nav-controller.js` (L.4368) | 🟡 กลาง | 20 นาที |
| E | ย้าย L.155–3983 (~3,800 บรรทัด) | 🔴 สูง | 2–3 ชั่วโมง |
| F | ย้าย deep scripts L.9671–11077 | 🔴 สูง | 1–2 ชั่วโมง |

> ทำ Phase A–D ก่อนเสมอ — ปลอดภัยและเห็นผลทันที
> Phase E–F ต้องทดสอบในแต่ละ feature หลังย้าย

---

## Completion Report — 2026-03-09

All 6 phases completed successfully.

### Final index.html Stats
| Metric | Before | After |
|--------|-------:|------:|
| Total lines | 11,077 | 5,129 |
| Inline `<style>` blocks | 4 | 0 |
| Inline `<script>` blocks | 7 | 0 |
| Reduction | — | -54% |

### Phase A — Duplicates & Empty Blocks ✅
- Removed duplicate `<link rel="stylesheet" href="css/pc-layout.css">` at L.53
- Moved 2 CSS rules from `<style>` block at L.3996–4006 to `css/index-core.css`
- Removed comment-only `<style>` block at L.4364–4366

### Phase B — `css/admin-fab.css` ✅
- **Created** `public/css/admin-fab.css` (540 lines, 12.6 KB)
- Extracted Admin FAB + Ad Manager Modal + Creator Studio Modal CSS
- Added `<link rel="stylesheet" href="css/admin-fab.css">` to head
- Removed `<style>` block spanning original L.4954–5426

### Phase C — `js/index-ui-init.js` ✅
- **Appended** 158 lines to `public/js/index-ui-init.js` (now 258 lines)
- Content: profile image auto-update, PC sidebar sync, search, stories bar, contacts
- Replaced inline `<script>` block with `<script src="js/index-ui-init.js"></script>`

### Phase D — `js/tab-nav-controller.js` ✅
- **Created** `public/js/tab-nav-controller.js` (202 lines, 11.5 KB)
- Content: `setPillNotifCount()`, `setPillChatCount()`, `updatePillUI()`, mute pill IIFE
- Replaced inline `<script>` block with `<script src="js/tab-nav-controller.js"></script>`

### Phase E — Large Inline Style Block (L.155–3983) ✅
- Extracted 3,829 lines of CSS and distributed:
  - `.ai-assistant-btn*`, `.ai-options`, `.ai-option-btn` → appended to `css/index-components.css`
  - `.admin-fab-container`, `.fab-main`, `.fab-menu` → appended to `css/admin-fab.css`
  - All remaining rules → appended to `css/index-core.css` (now 3,823 lines)
- No `.premium-*`, `.overlay-*`, `.creator-*`, `.studio-*` found in this block (already in separate files)
- Entire `<style>` block removed from index.html

### Phase F — Deep Nested Scripts ✅
- **4 inline `<script>` blocks** found and moved to `js/app-init.js`:
  1. Toast notification + `initPullToRefresh()` + SPA navigation interceptor (213 lines)
  2. In-page Chat Panel IIFE + SW registration + update detection (474 lines)
  3. PWA TukTukPWA.show() init (5 lines)
  4. SW NOTIF_CLICK message handler (27 lines)
  5. PC Layout V2 JS Engine IIFE (549 lines)
- `js/app-init.js` grew from 159 → 1,433 lines
- All duplicate body-level `<script src="js/app-init.js">` removed; single `defer` load in `<head>` retained

### Files Modified/Created
| File | Action | Final Size |
|------|--------|-----------|
| `public/index.html` | Reduced 11,077 → 5,129 lines | 228 KB |
| `public/css/admin-fab.css` | Created | 540 lines |
| `public/css/index-core.css` | Appended | 3,823 lines |
| `public/css/index-components.css` | Appended | 285 lines |
| `public/js/app-init.js` | Appended | 1,433 lines |
| `public/js/index-ui-init.js` | Appended | 258 lines |
| `public/js/tab-nav-controller.js` | Created | 202 lines |

---

## Bug Fix Report — 2026-03-09 (หลัง Deploy)

### ปัญหา: หน้าฟีดแสดง Raw Template Literals

**อาการ:** tuktukfeed.com แสดงข้อความเช่น `${escapeHtml(getAuthorInfo(post).name)}` แทนที่จะ render ฟีดปกติ

**สาเหตุ (Root Cause):**
ระหว่าง Phase E + F มีการวาง `</body></html>` ผิดตำแหน่ง — อยู่ที่ line 999 แต่ยังมี JavaScript + HTML อีก ~4,130 บรรทัดที่ตามมาหลัง `</html>`:

```
line  999: </body>        ← ถูกวางไว้เร็วเกินไป
line 1001: </html>        ← ถูกวางไว้เร็วเกินไป
line 1003: // Detect LINE in-app browser...  ← JS code ถูก browser ignore ทั้งหมด
...
line 4989: </script>      ← closing tag เดิมของ script block
line 4991: <script src="...  ← HTML content
...
line 5129: (ท้ายไฟล์)
```

Browser หยุด parse HTML ที่ `</html>` ทำให้:
- ฟังก์ชัน `renderTukTukFeed()` ไม่ถูก define
- ฟังก์ชัน `handleVideoError()`, `loadVideoSrc()` ไม่ถูก define
- `videoItem.innerHTML = \`...\`` ไม่ถูกเรียก → template literals แสดงเป็น raw text

**โค้ดที่ได้รับผลกระทบ (ทั้งหมดอยู่หลัง `</html>`):**
| ฟังก์ชัน | บรรทัด | หน้าที่ |
|----------|--------|---------|
| `renderTukTukFeed()` | ~1274 | Main feed renderer |
| `loadVideoSrc()` | ~1010 | LINE in-app video loader |
| `handleVideoError()` | ~1029 | Slow connection overlay |
| `retryVideoLoad()` | ~1048 | Retry button handler |
| `startVideoLoadTimer()` | ~1074 | 10s fallback timer |
| `extractYoutubeId()` | ~1251 | YouTube ID parser |
| `renderStandardFeed()` | ~2200 | Standard card feed |
| `changeGalleryMedia()` | ~3805 | Gallery navigation |
| `submitPost()`, `editPost()` | ~3900+ | Post CRUD |
| `getCurrentLocation()` | ~4421 | Geolocation |
| `initAutoPlayObserver()` | ~4700+ | Intersection Observer |
| `initParticles()` | ~4934 | Particle effects |
| Chat panel HTML | ~5009–5127 | In-page chat UI |

### วิธีแก้

```python
# ย้าย </body></html> ออก แล้วห่อ JS ด้วย <script> tag
before = lines[:998]          # HTML content บรรทัดที่ 1-998
js_code = lines[1002:]        # JS+HTML ที่ orphaned (บรรทัด 1003 เป็นต้นไป)

result = before + ['\n<script>\n'] + js_code + ['\n</body>\n</html>\n']
```

จากนั้นลบ `</script>` ซ้ำที่ปลายไฟล์ออก (เนื่องจากมี `</script>` เดิมที่ line 4989 อยู่แล้ว)

**โครงสร้างที่ถูกต้องหลังแก้:**
```
line 1000: <script>                  ← เพิ่มใหม่
line 1001: // Detect LINE in-app...  ← JS เริ่ม
...
line 4989: </script>                 ← closing เดิม (ถูกต้อง)
line 4991: <script src="...">        ← external scripts
...
line 5009: <!-- In-page Chat Panel → ← HTML elements
...
line 5128: </body>
line 5129: </html>
```

### ผลลัพธ์
- ✅ `renderTukTukFeed()` ถูก define และเรียกได้
- ✅ ฟีดวิดีโอแสดงผลปกติ
- ✅ Chat panel HTML ถูก render ใน body
- ✅ Deploy สำเร็จ: https://appinjproject.web.app

### บทเรียน
> เมื่อลบ `<style>` หรือ `<script>` blocks ขนาดใหญ่ออกจาก HTML ต้องตรวจสอบว่า `</body></html>` ยังอยู่ **ท้ายไฟล์เสมอ** ไม่ใช่กลางไฟล์ หลังการ refactor ทุกครั้งควัน `grep -n "</body>\|</html>" index.html | tail -3` เพื่อยืนยัน

---

## PC Layout Enhancement Report — 2026-03-09

### ปัญหาที่พบหลัง Deploy

| ส่วน | อาการ | สาเหตุ |
|------|-------|--------|
| **ร้านค้ายอดนิยม** (`#pcTrendingSellers`) | แสดง "โหลดร้านค้าไม่ได้" | Query `seller_profiles` ใช้ `where('isVerified','==',true).orderBy('totalSales','desc')` — ต้องการ Firestore composite index ที่ยังไม่ได้สร้าง |
| **ข่าวสาร** | ไม่มี section | ไม่เคยสร้างมาก่อน |
| **สินค้าแนะนำ** | ไม่มี section | ไม่เคยสร้างมาก่อน |

### สิ่งที่แก้และเพิ่ม

#### 1. แก้ `pcLoadTrendingSellers()` — `public/js/pc-feed-engine.js`

**ก่อน:** Query `seller_profiles` พร้อม composite index
```javascript
// ❌ ต้องการ Firestore composite index (isVerified + totalSales)
window.db.collection('seller_profiles')
    .where('isVerified', '==', true)
    .orderBy('totalSales', 'desc')
    .limit(5)
```

**หลัง:** Query `marketplace_items` — single-field index เท่านั้น
```javascript
// ✅ ไม่ต้องการ composite index
window.db.collection('marketplace_items')
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(5)
```
แสดงรูปสินค้า + ชื่อ + ราคา + ชื่อร้านแทน seller profile

#### 2. เพิ่ม `pcLoadNewsSection()` — `public/js/pc-feed-engine.js`

ฟังก์ชันใหม่ใน PC Feed Engine IIFE:
- Query: `community_posts` where `published==true` orderBy `createdAt` limit 5
- Render: thumbnail รูป + หัวข้อ (55 ตัวอักษร) + เวลาสัมพัทธ์
- Target: `#pcNewsSection` ใน right sidebar
- Hover: `opacity: 0.75` เพื่อ feedback

#### 3. เพิ่ม `pcLoadRecommendedProducts()` — `public/js/pc-feed-engine.js`

ฟังก์ชันใหม่ใน PC Feed Engine IIFE:
- Query: `marketplace_items` where `status==active` orderBy `createdAt` limit 4
- Render: Grid 2×2 — รูปสินค้า + ชื่อ (18 ตัวอักษร) + ราคาสี indigo
- Target: `#pcRecommendedProducts` ใน right sidebar
- Hover: `scale(1.03)` transform

#### 4. อัปเดต `pcInit()` — `public/js/pc-feed-engine.js`

```javascript
// เพิ่ม 2 calls ใหม่ใน Promise.all
Promise.all([
    window.pcLoadSocialFeed(),
    window.pcLoadStories(),
    window.pcLoadTrendingSellers(),
    window.pcLoadContacts(),
    window.pcLoadNewsSection(),          // ← ใหม่
    window.pcLoadRecommendedProducts(),  // ← ใหม่
])
```

#### 5. เพิ่ม HTML cards — `public/index.html`

เพิ่ม 2 card ใน `<aside class="pc-sidebar-right">` ก่อน footer links:

```html
<!-- 📰 ข่าวสาร -->
<div class="pc-sidebar-card">
    <div class="pc-sidebar-card-title">
        <span>📰 ข่าวสาร</span>
        <a href="community.html">ดูทั้งหมด</a>
    </div>
    <div id="pcNewsSection"><!-- skeleton --></div>
</div>

<!-- 🛒 สินค้าแนะนำ -->
<div class="pc-sidebar-card">
    <div class="pc-sidebar-card-title">
        <span>🛒 สินค้าแนะนำ</span>
        <a href="marketplace.html">ดูทั้งหมด</a>
    </div>
    <div id="pcRecommendedProducts"><!-- 2×2 skeleton grid --></div>
</div>
```

### Right Sidebar — Layout หลัง Update

```
┌─────────────────────────────┐
│ 🔥 ร้านค้ายอดนิยม           │  ← แสดง marketplace_items แทน (fixed)
│   [img] สินค้า · ฿xxx       │
│   [img] สินค้า · ฿xxx       │
├─────────────────────────────┤
│ 📣 ผู้สนับสนุน               │  ← static (ไม่เปลี่ยน)
├─────────────────────────────┤
│ 👥 ผู้ติดต่อ                  │  ← Firestore users isOnline (ไม่เปลี่ยน)
├─────────────────────────────┤
│ 📰 ข่าวสาร          ✨ใหม่   │
│   [img] หัวข้อข่าว · 2 ชม.  │
│   [img] หัวข้อข่าว · 5 ชม.  │
├─────────────────────────────┤
│ 🛒 สินค้าแนะนำ      ✨ใหม่   │
│  [img][img]                  │
│  [img][img]                  │
├─────────────────────────────┤
│ footer links                 │
└─────────────────────────────┘
```

### ไฟล์ที่แก้

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `public/js/pc-feed-engine.js` | แก้ `pcLoadTrendingSellers`, เพิ่ม `pcLoadNewsSection`, `pcLoadRecommendedProducts`, อัปเดต `pcInit` |
| `public/index.html` | เพิ่ม `#pcNewsSection` และ `#pcRecommendedProducts` card HTML |

### Deploy
✅ `firebase deploy --only hosting` — 2026-03-09 16:32

---

## สถานะวิเคราะห์จริง — 2026-03-11

### ผลการตรวจสอบไฟล์จริง

| ไฟล์ | ขนาดจริง | สถานะ |
|------|---------|-------|
| `public/index.html` | **5,159 บรรทัด** | ⚠️ ยังมี inline script ใหญ่ |
| `public/css/index-core.css` | **3,839 บรรทัด** | ✅ รับ style จาก Phase E |
| `public/js/app-init.js` | **1,434 บรรทัด** | ✅ รับ script จาก Phase F |
| `public/js/tab-nav-controller.js` | 11,477 bytes | ✅ |
| `public/css/admin-fab.css` | 12,569 bytes | ✅ |
| `public/js/tuktuk_feed_logic.js` | **53,283 bytes** | 🆕 ไฟล์ใหม่ขนาดใหญ่ |
| `public/js/community_feed_integration.js` | **61,472 bytes** | 🆕 ไฟล์ใหม่ขนาดใหญ่ |

### ❌ ปัญหาที่ยังค้างอยู่

#### 1. Inline `<script>` ขนาดใหญ่ L.1029–5018 (~3,990 บรรทัด) — ยังไม่ได้ย้าย
นี่คือ JS ที่ถูกห่อด้วย `<script>` tag ระหว่างการแก้ bug "template literals แสดงเป็น raw text"
เนื้อหาภายใน:
- `loadVideoSrc()`, `handleVideoError()` — video player (LINE in-app browser fix)
- `renderTukTukFeed()`, `renderStandardFeed()` — main feed renderers
- `submitPost()`, `editPost()`, `deletePost()` — post CRUD
- `getCurrentLocation()`, `initAutoPlayObserver()` — geolocation + intersection observer
- `initParticles()`, `changeGalleryMedia()` — UI effects
- `handleTukTukButtonClick()`, creator panel logic

**เป้าหมาย:** ย้ายเข้า `js/tuktuk_feed_logic.js` หรือ `js/main-feed-engine.js`

#### 2. HTML หลัง script close ยังมี indentation เยอะมาก (L.5019–5159)
```
L.5019–5026:  external script tags ลึก 60 space indent ← ไม่สะอาด
L.5041–5159:  In-page Chat Panel HTML ← HTML structure ควรอยู่ชิด left margin
```

#### 3. ไฟล์ขนาดใหญ่ที่เพิ่มมาใหม่ — อาจต้องแยกในอนาคต
| ไฟล์ | บรรทัด | ปัญหา |
|------|--------|-------|
| `js/app-init.js` | ~1,434 | รับ script จาก Phase F ทำให้ใหญ่ขึ้นมาก |
| `js/tuktuk_feed_logic.js` | ~53 KB | ไม่ได้อยู่ในแผนเดิม — ควร audit |
| `js/community_feed_integration.js` | ~61 KB | ไม่ได้อยู่ในแผนเดิม — ควร audit |

---

## แผนงานที่เหลือ (Phase G–I)

### Phase G — ย้าย inline script L.1029–5018 ออกเป็น external file (🔴 สำคัญที่สุด)

**เป้าหมาย:** index.html เหลือเพียง HTML structure ไม่มี `<script>` inline
**วิธี:**
1. ตัด content ระหว่าง `<script>` (L.1029) ถึง `</script>` (L.5018)
2. เขียนเข้า `js/feed-renderer.js` (ไฟล์ใหม่) หรือ append เข้า `js/tuktuk_feed_logic.js`
3. แทนที่ด้วย `<script src="js/feed-renderer.js"></script>`
4. ตรวจสอบว่าฟังก์ชันทั้งหมดถูก export/expose ถูกต้อง (`window.renderTukTukFeed` etc.)

```
ก่อน: <script> ~3,990 บรรทัด JS inline </script>
หลัง: <script src="js/feed-renderer.js"></script>
```

**ความเสี่ยง:** 🟡 กลาง — ต้องตรวจว่า function scope ยังถูกต้อง

### Phase H — ทำความสะอาด HTML structure (🟢 ง่าย)

1. **ลด indentation** ของ HTML ส่วน L.5019–5159 ให้อยู่ชิด left margin ปกติ
2. **จัดกลุ่ม** external `<script>` tags ให้อยู่ก่อน `</body>` อย่างเป็นระเบียบ
3. **เป้าหมายสุดท้าย:**

```html
<!-- ท้าย index.html ที่ถูกต้อง -->
  </main>

  <!-- In-page Chat Panel -->
  <div id="inChatPanel">...</div>

  <!-- Scripts -->
  <script src="js/feed-renderer.js"></script>
  <script src="js/community_feed_integration.js"></script>
  <script src="js/tuktuk_feed_logic.js"></script>
</body>
</html>
```

### Phase I — Audit ไฟล์ JS ขนาดใหญ่ที่เพิ่มใหม่ (🟡 กลาง)

| ไฟล์ | แนวทาง |
|------|--------|
| `js/tuktuk_feed_logic.js` | ตรวจว่าซ้ำกับ `js/main-feed-engine.js` ไหม |
| `js/community_feed_integration.js` | อาจแยกเป็น `community-posts.js` + `community-upload.js` |
| `js/app-init.js` (1,434 บรรทัด) | แยก PWA init กับ Chat Panel init ออกจากกัน |

---

## สถานะ Target สุดท้าย

```
index.html เป้าหมาย: ~500 บรรทัด (HTML structure เท่านั้น)
index.html ปัจจุบัน: 5,159 บรรทัด

สิ่งที่ต้องทำเพิ่ม:
  Phase G: ย้าย inline script 3,990 บรรทัด → js/feed-renderer.js
  Phase H: ทำความสะอาด indentation + จัด script tags
  Phase I: Audit ไฟล์ใหม่ขนาดใหญ่

หลังทำ G+H เสร็จ:
  index.html คาดว่าเหลือ ~1,170 บรรทัด (HTML + script tags)
```

### ลำดับความสำคัญ

| Phase | งาน | ความเสี่ยง | ผลทันที |
|-------|-----|-----------|---------|
| G | ย้าย inline script 3,990 บรรทัด | 🟡 กลาง | index.html ลดจาก 5,159 → ~1,170 บรรทัด |
| H | ทำความสะอาด HTML structure | 🟢 ต่ำ | code อ่านง่ายขึ้น |
| I | Audit JS ใหม่ขนาดใหญ่ | 🟡 กลาง | performance + maintainability |

---

## Completion Report — 2026-03-11 (Phase G, H + R2 Video + PC UI)

### Phase G — Extract Inline Script ✅

**ก่อน:** `index.html` มี `<script>` inline ขนาด 3,988 บรรทัด (L.1029–5018)
**หลัง:** ดึงออกเป็น `public/js/feed-renderer.js`

| Metric | ก่อน | หลัง |
|--------|-----:|-----:|
| index.html | 5,159 บรรทัด | **1,168 บรรทัด** |
| ลดลง | — | **-76%** |
| Inline `<script>` blocks | 1 (3,988 บรรทัด) | 0 |

**วิธีที่ใช้ (Python):**
```python
# ตัด lines 1030–5017 (content ระหว่าง tags)
js_lines = lines[1028+1 : 5017]
# เขียนเป็น feed-renderer.js
open('js/feed-renderer.js','w').write('\n'.join(js_lines))
# แทนที่ใน index.html
new_lines = lines[:1028] + ['<script src="js/feed-renderer.js"></script>'] + lines[5017+1:]
```

**เนื้อหาใน `feed-renderer.js` (3,988 บรรทัด):**
- `loadVideoSrc()`, `handleVideoError()`, `retryVideoLoad()` — LINE in-app video player
- `renderTukTukFeed()`, `renderStandardFeed()` — feed renderers หลัก
- `submitPost()`, `editPost()`, `deletePost()` — post CRUD
- `getCurrentLocation()`, `initAutoPlayObserver()` — geolocation + intersection observer
- `initParticles()`, `changeGalleryMedia()` — UI effects
- `handleTukTukButtonClick()`, creator panel logic
- `uploadToR2()` — Cloudflare R2 upload service (server-side SigV4)

---

### Phase H — HTML Structure Cleanup ✅

1. **Removed deep indentation (60+ spaces)** จาก script tags + Chat Panel HTML หลัง L.1029
2. **Fixed duplicate `</body></html>`** — พบ closing tags ซ้ำ 2 ครั้ง (L.1165 + L.1168) → เหลือครั้งเดียวที่ L.1165/1167

**โครงสร้างท้าย index.html หลังแก้:**
```html
<script src="js/feed-renderer.js"></script>

<!--TukTuk Core Services-->
<script src="/js/auth-service.js"></script>
<script src="/js/tuktuk-api.js"></script>
<script src="js/community_feed_integration.js"></script>
<script src="js/tuktuk_feed_logic.js"></script>

<!-- In-page Chat Panel -->
<div id="inChatPanel">...</div>
<div id="inChatOverlay">...</div>
<button id="mobileOpenChat">...</button>
<link rel="stylesheet" href="css/chat-panel.css">

</body>
</html>
```

---

### R2 Video — Thumbnail Poster Support ✅

**ไฟล์:** `public/js/feed-renderer.js`

**ปัญหา:** R2 video objects มี `{ url, type, thumbnailUrl }` แต่ `thumbnailUrl` ไม่ถูกใช้เป็น poster → ผู้ใช้เห็นหน้าจอดำก่อนวิดีโอโหลด

**แก้ไข:** เพิ่ม `videoPoster` extraction + ใส่ `poster="..."` บน `<video>` element

```javascript
// ก่อน
const videoUrl = typeof videoFile === 'object' ? videoFile.url : videoFile;

// หลัง — R2 thumbnail support
const videoUrl    = typeof videoFile === 'object' ? videoFile.url : videoFile;
const videoPoster = (typeof videoFile === 'object' && videoFile.thumbnailUrl)
    ? videoFile.thumbnailUrl
    : (post.thumbnailUrl || '');

// <video> element
<video ... ${videoPoster ? `poster="${videoPoster}"` : ''} ...>
```

**ผล:** วิดีโอจาก Cloudflare R2 แสดง thumbnail ทันที ลด perceived loading time

---

### PC UI — Thai Platform Redesign ✅

**ไฟล์:** `public/css/pc-layout.css`

**เป้าหมาย:** แตกต่างจาก Facebook — ใช้ Thai color palette, warm dark theme

#### Color System เปลี่ยนจาก Indigo → Thai Orange

| Token | ก่อน (Indigo/Facebook) | หลัง (Thai Orange) |
|-------|----------------------|-------------------|
| `--color-primary-500` | `#6366f1` indigo | `#f97316` ส้มตุ๊กตุ๊ก |
| `--color-secondary-500` | `#a855f7` purple | `#f59e0b` ทองไทย |
| `--color-dark-bg` | `#0b0f19` cold blue-black | `#0e0a07` warm brown-black |
| `--color-dark-surface` | `#0f172a` slate | `#18120d` dark brown |
| `--shadow-glow` | indigo `rgba(99,102,241,0.3)` | ส้ม `rgba(249,115,22,0.25)` |

#### องค์ประกอบที่เปลี่ยน

| ส่วน | ก่อน | หลัง |
|------|------|------|
| **Background** | Cold blue mesh gradient | Warm amber/red/green Thai ambient |
| **Top Nav** | Slate gradient | Dark warm + 3-color accent line (ส้ม-ทอง-แดง) |
| **Sidebar Cards** | Cold glass morphism | Warm brown + gold shimmer top line |
| **Feed Cards** | Cold glass | Warm brown + ส้ม border + hover orange glow |
| **Avatar shape** | วงกลม (Facebook-style) | **สี่เหลี่ยมมน** `border-radius:10px` |
| **Scrollbar** | White transparent | ส้มโปร่งใส |
| **Online dot** | emerald | Thai green `#059669` |
| **Feed width** | 600px | **680px** (กว้างกว่า) |
| **Sidebar width** | 280+300px | **260+280px** (compact กว่า) |

#### เพิ่มใหม่ — Thai Marketplace Components

```css
/* Product Grid 2×2 — right sidebar */
.pc-product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pc-product-item { border-radius: 10px; border: 1px solid rgba(249,115,22,0.10); }
.pc-product-item:hover { box-shadow: var(--shadow-gold); transform: scale(1.03); }

/* News Item — thumbnail + title */
.pc-news-item { display: flex; gap: 8px; border-radius: 10px; }
.pc-news-thumb { width: 48px; height: 48px; border-radius: 8px; }
```

### ไฟล์ที่แก้/สร้าง

| ไฟล์ | Action | ขนาดหลัง |
|------|--------|---------|
| `public/index.html` | Reduced | **1,168 บรรทัด** (จาก 5,159) |
| `public/js/feed-renderer.js` | **Created** | 3,990 บรรทัด |
| `public/css/pc-layout.css` | Thai theme redesign | ~1,220 บรรทัด |

### Deploy
✅ `firebase deploy --only hosting` — 2026-03-11

---

## Phase J — Mobile Structure Alignment (2026-03-12) ✅

### ปัญหาที่พบ: Swipe Navigation ไปไม่ถึง Tab "อาชีพ"

#### Root Cause
`categoryList` ใน `feed-renderer.js` L.1974 กำหนดลำดับ category สำหรับ swipe gesture:

```javascript
// ❌ ก่อนแก้ — ไม่มี 'community' → swipe จาก ใกล้ฉัน ไปต่อไม่ได้
const categoryList = ['all', 'near_me', 'following', 'liked', 'trending', 'news', 'video'];
```

Mobile header tabs มีแค่ 3 tabs ตรงกับ Flutter:

| Web `data-cat` | Flutter Tab | หน้าที่ |
|---------------|-------------|---------|
| `all` | Tab 0 "ดูเพลิน" | `VerticalFeedView` — interleaved posts |
| `near_me` | Tab 1 "ใกล้ฉัน" | `VerticalFeedView` — location-based |
| `community` | Tab 2 "อาชีพ" | `CareerHubView` — WIN Rider + Jobs |

แต่ `categoryList` ไม่มี `'community'` → `categoryList.indexOf('community')` คืน `-1` → `handleSwipe()` return ทันที → ไม่สามารถ swipe ไปถึง Tab 3 ได้

#### การแก้ไข
**ไฟล์:** `public/js/feed-renderer.js` L.1974

```javascript
// ✅ หลังแก้ — ตรงกับ Flutter 3-tab structure
const categoryList = ['all', 'near_me', 'community'];
```

#### การตรวจสอบ Flutter Structure

**`lib/tuktuk/tuktuk_feed_screen.dart`:**
- Tab 0 → `_buildVerticalFeed(0)` → `VerticalFeedView` (all posts, interleaved Live/Product/News)
- Tab 1 → `_buildVerticalFeed(1)` → `VerticalFeedView` (near me, location-based from `_fetchSmartNearbyProducts`)
- Tab 2 → `const CareerHubView()` → WIN Rider jobs + online riders + career cards

**`public/js/community_feed_integration.js`** — `initCommunityFeed()`:
- Renders CareerHub grid: **WIN RIDER** → `win-service.html`, **Creator** → `seller-dashboard.html`
- **ชุมชน** → `renderActualCommunityFeed()`, **ช่าง & บริการ** → `renderActualCommunityFeed(eco_pros)`
- Fetches live stats: จำนวนวิน online + จำนวน community posts
- ✅ ตรงกับ Flutter `CareerHubView` — โครงสร้างถูกต้องแล้ว

**`public/js/mobile-header.js`** — `switchCategoryMobile(cat, el)`:
- Delegates → `window.switchCategory(cat)` ใน `feed-renderer.js`
- Badge sync สำหรับ `#mhNotifBadge` + `#mhChatBadge`

#### สรุปปัญหาและสถานะ

| ปัญหา | สถานะ | หมายเหตุ |
|-------|--------|----------|
| Swipe ไปไม่ถึง Tab "อาชีพ" | ✅ แก้แล้ว | `categoryList` → `['all', 'near_me', 'community']` |
| CareerHub grid ไม่ตรง Flutter | ✅ ถูกต้องอยู่แล้ว | `initCommunityFeed()` render ครบ |
| `near_me` ไม่มี smart location filter | ⚠️ Partial | Web ใช้ `loadPosts()` ธรรมดา, Flutter ใช้ `_fetchSmartNearbyProducts()` + province filter |

#### near_me Gap (Sprint 4 TODO)
Flutter `_buildVerticalFeed(1)` ทำ:
1. `_fetchSmartNearbyProducts()` — ใช้ GPS lat/lng หา marketplace items ใกล้เคียง
2. Province-based filter บน posts
3. Interleave nearby products ทุก 5 posts

Web `near_me` ปัจจุบัน: เรียก `loadPosts()` โดยไม่ filter location — **ยังไม่ align กับ Flutter**

แนะนำ Sprint 4: เพิ่ม `?province=<userProvince>` parameter ใน Go Engine `/api/v1/feed?province=10` สำหรับ near_me tab

---

## Phase K — Mobile Feed + Glass Panel Bug Fixes (2026-03-12) ✅

### K.1 Vertical Feed Scrolling — CSS Missing Properties

**ไฟล์:** `public/css/tuktuk_feed.css`

| Property | ก่อน | หลัง | ผลกระทบ |
|----------|------|------|----------|
| `scroll-snap-stop` | ❌ ขาด | `always` | Fast swipe ข้ามหลาย post ได้ |
| `-webkit-overflow-scrolling` | ❌ ขาด | `touch` | iOS momentum scroll ไม่ smooth |
| `-webkit-backdrop-filter` (4 จุด) | ❌ ขาด | เพิ่มครบ | Safari ไม่แสดง glass effect |
| `-webkit-backdrop-filter` ordering (5 จุด) | ❌ ลำดับผิด | webkit ก่อน standard | CSS spec compliance |

---

### K.2 Glass Notification Panel ไม่เปิดบนมือถือ

**Root Cause:** Phase G (modularization) ย้าย `toggleNotifications()` และ `switchCategory()` จาก `index.html` inline script → `feed-renderer.js` แต่ทั้งสองฟังก์ชันยังคงอยู่ใน closure ลึก **ไม่ได้ assign ไปยัง `window`**

`mobile-header.js` เรียก:
```javascript
window.toggleNotifications();  // → undefined → bell ไม่ทำงาน
window.switchCategory(cat);    // → undefined → fallback legacyBtn.click()
```

**การแก้ไข** (`feed-renderer.js`):
```javascript
// หลัง toggleNotifications() definition:
window.toggleNotifications = toggleNotifications;

// หลัง switchCategory() definition:
window.switchCategory = switchCategory;
```

**ผลลัพธ์:**
- กดปุ่ม 🔔 → `#notificationPanel` เปิด slide-in จากขวา (glass `backdrop-filter: blur(30px)`)
- แตะ tab → `switchCategory()` ทำงาน direct ไม่ผ่าน fallback

---

### K.3 Mobile Drawer — `toggleMobileDrawer` เพิ่มใหม่

**ไฟล์:** `public/js/mobile-header.js`

```javascript
window.toggleMobileDrawer = function () {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (!drawer || !overlay) return;
    const isActive = drawer.classList.toggle('active');
    overlay.classList.toggle('active', isActive);
    // Sync user data (displayName, photoURL) when opening
    if (isActive && typeof WizmobizAuth !== 'undefined') { ... }
    if (navigator.vibrate) navigator.vibrate(5);
};
```

> **TODO:** เพิ่ม `#mobileDrawer` + `#mobileDrawerOverlay` HTML + CSS ใน `index.html` + `mobile-header.css`

---

### K.4 JavaScript Runtime Errors — Ad System Conflict

**Error 1:** `SyntaxError: Identifier 'adsManagerModal' has already been declared (at ad-system.js:1:1)`

**Root Cause:** Script loading order conflict:
- `feed-renderer.js` (line 1106, **no defer**) → รัน synchronously ก่อน → declare `let adsManagerModal` ที่ global scope
- `ad-system.js` (line 97, **defer**) → รันทีหลัง → พบ `adsManagerModal` ซ้ำ → SyntaxError → ทั้งไฟล์ fail

**Error 2 & 3:** `ReferenceError: loadAds is not defined`
- เกิดจาก `ad-system.js` fail (Error 1) → `loadAds()` ไม่ถูก define → DOMContentLoaded handler ใน `feed-renderer.js` เรียกแล้ว crash

#### การแก้ไข

**`feed-renderer.js`** — ลบ duplicate admin/ads block ทั้งหมด:
| ลบออก | เหตุผล |
|--------|--------|
| `let adsManagerModal;` | ซ้ำกับ global ใน ad-system.js |
| `let allAdsList = [];` | ซ้ำกับ global ใน ad-system.js |
| `openAdManager()` | ซ้ำ — ad-system.js มี |
| `loadAdsList()` | ซ้ำ — ad-system.js มี |
| `renderAdsList()` | ซ้ำ — ad-system.js มี |
| `showAdTab()`, `resetAdForm()`, `previewAdImage()`, `editAd()`, `handleSaveAd()`, `deleteAd()` | ย้ายไป ad-system.js |

**`ad-system.js`** — แก้ `renderAdsList()` (เดิมใช้ตัวแปร `banners`/`dots` ของ promo slider ผิดที่) + เพิ่ม admin UI functions ครบ

---

### สรุปไฟล์ที่แก้ในรอบนี้ (Phase J + K)

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `public/js/feed-renderer.js` | export `toggleNotifications` + `switchCategory` ไปยัง `window`; fix `categoryList`; ลบ admin/ads duplicates |
| `public/css/tuktuk_feed.css` | เพิ่ม `scroll-snap-stop: always`, `-webkit-overflow-scrolling: touch`, fix 9 × backdrop-filter |
| `public/js/ad-system.js` | fix `renderAdsList()` (broken promo vars); เพิ่ม admin UI functions 6 ตัว |
| `public/js/mobile-header.js` | เพิ่ม `window.toggleMobileDrawer` (drawer glass menu) |

---

## Phase L — PWA Cross-Browser Fix (2026-03-12) ✅

### ปัญหา: Triple SW Registration → PWA ใช้งานไม่ได้ทุกบราวเซอร์มือถือ

**Root Cause:** `navigator.serviceWorker.register('sw.js')` ถูกเรียก 3 ครั้งบนหน้าเดียวกัน:

| ไฟล์ | ประเภท | ผลกระทบ |
|------|--------|----------|
| `pwa-manager.js` | ✅ ถูกต้อง | เก็บไว้ (canonical) |
| `pwa-lifecycle.js` | ❌ duplicate | race condition, 2× update toast, 2× skipWaiting |
| `app-init.js` (L.799) | ❌ duplicate | 3× register, 3× listeners |

**อาการ:** Samsung Internet + Firefox Android ไม่ install PWA; Chrome mobile แสดง update toast ซ้ำ 2–3 ครั้ง; `skipWaiting` ถูก call หลายครั้ง → endless reload loop

### L.1 ลบ duplicate SW registration จาก pwa-lifecycle.js

ลบ block `if ('serviceWorker' in navigator) { ... }` (เดิม L.5–29) ออกทั้งหมด
เหลือแต่ utility functions: `_showSwUpdateToast`, `handleNotifClick`, `initPullToRefresh`

### L.2 ลบ duplicate SW registration จาก app-init.js

ลบ block `// PWA Service Worker Registration` (เดิม L.799–849) รวม `_showSwUpdateToast` ใน app-init.js

แทนด้วย comment: `// SW registration handled by pwa-manager.js`

### L.3 เพิ่ม explicit scope ใน pwa-manager.js

```javascript
// ก่อน:
navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
// หลัง:
navigator.serviceWorker.register('sw.js', { scope: '/', updateViaCache: 'none' })
```

เหตุผล: Firefox Android + Samsung Internet ต้องการ `scope` ชัดเจน ไม่งั้นจะ infer scope ผิด

### L.4 แก้ manifest.json start_url

```json
// ก่อน:
"start_url": "/index.html?pwa=true"
// หลัง:
"start_url": "/"
```

เหตุผล: Query param ทำให้ Samsung Internet คิดว่า start_url อยู่นอก scope → ไม่ยอม install PWA

### L.5 แก้ offline.html

| ปัญหา | ก่อน | หลัง |
|-------|------|------|
| Title ผิด | `ออฟไลน์ - Wizmobiz` | `ออฟไลน์ - TukTuk Thailand` |
| Google Fonts `@import` | ✅ load ตอนออฟไลน์ได้? ❌ ไม่ได้ | ลบออก → ใช้ system font fallback (`-apple-system, sans-serif`) |

เหตุผล: `@import url('https://fonts.googleapis.com/...')` ใน CSS ของหน้า offline ทำให้ browser ไปดึง font จากอินเทอร์เน็ตขณะออฟไลน์ → ตัวอักษรหาย + อาจ timeout delay

### สรุปไฟล์ที่แก้ในรอบนี้ (Phase L)

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `public/js/pwa-lifecycle.js` | ลบ duplicate SW registration (L.5–29 เดิม) |
| `public/js/app-init.js` | ลบ duplicate SW registration + `_showSwUpdateToast` (L.799–849 เดิม) |
| `public/js/pwa-manager.js` | เพิ่ม `scope: '/'` ใน register call |
| `public/manifest.json` | `start_url` เปลี่ยนจาก `"/index.html?pwa=true"` → `"/"` |
| `public/offline.html` | fix title (Wizmobiz→TukTuk Thailand); ลบ Google Fonts @import |

---

## Phase M — Mobile Feed Structure Fix (2026-03-12) ✅

### ปัญหา: ฟีดมือถือไม่แสดง TikTok-style และไม่ตรงกับ `tuktuk_feed_screen.dart`

#### โครงสร้าง Flutter ที่ต้องการ (Target)

```
Scaffold
  body: Stack
    TabBarView (3 tabs, controller: _topTabController)
      Tab 0 "ดูเพลิน":  VerticalFeedView(all)   — TikTok snap scroll
      Tab 1 "ใกล้ฉัน":  VerticalFeedView(near_me) — TikTok snap scroll + location
      Tab 2 "อาชีพ":    CareerHubView           — community layout
    _buildTopNav() — overlay header (transparent)
  bottomNavigationBar: BottomNav (5 items)
```

#### วิเคราะห์ Root Cause

**ระบบ Feed ที่ซ้อนกัน 2 ชุด (conflict):**

| ไฟล์ | หน้าที่เดิม | ปัญหา |
|------|------------|-------|
| `feed-renderer.js` | `switchCategory()` → `window.switchCategory` | เรียก `loadPosts()` ซึ่ง render ลง `#postsFeed` (ไม่ใช่ `#tuktukFeed`) |
| `tuktuk_feed_logic.js` | `initTukTukFeed()` → `renderGrid()` | render `.tuktuk-grid-card` (grid layout) แทน `.tuktuk-video-item` (full-screen slide) |

**ผลลัพธ์ที่เห็นบนมือถือ:**
- `#tuktukFeed` (position: fixed, height: 100dvh) ครอบทั้งหน้าจอ
- ด้านในเต็มไปด้วย `.tuktuk-grid-card` ขนาดเล็ก (ไม่ใช่ full-screen slides)
- ไม่มี scroll-snap → ไม่มี TikTok swipe behavior
- `switchCategory()` ที่ `mobile-header.js` เรียก → render ลงผิด container

#### M.1 `tuktuk_feed_logic.js` — renderGrid() mobile branch

**ก่อน:** เรียก `createNearMeGridCard()` → `.tuktuk-grid-card` (grid layout)

**หลัง:** เรียก `renderTukTukSlides()` → `.tuktuk-video-item` (full-screen TikTok slides)

```javascript
// ก่อน:
items.forEach(item => {
    if (isPC) {
        container.appendChild(createPCGridCard(item));
    } else {
        container.appendChild(createNearMeGridCard(item)); // ❌ grid card
    }
});

// หลัง:
if (!isPC) {
    container.style.display = 'block';
    renderTukTukSlides(container, items); // ✅ full-screen slides
    return;
}
container.style.display = 'block';
items.forEach(item => container.appendChild(createPCGridCard(item)));
```

#### M.2 `tuktuk_feed_logic.js` — ฟังก์ชันใหม่ `renderTukTukSlides(container, items)`

สร้าง `.tuktuk-video-item` elements (height: 100dvh, scroll-snap-align: start) ต่อ item ที่มี:
- Background: `<video>` หรือ `<img>` (absolute, object-fit: cover)
- `<div class="tuktuk-slide-gradient">` — dark overlay gradient ด้านล่าง
- `<div class="tuktuk-slide-info">` (left bottom) — author, title, desc, price badge
- `<div class="right-sidebar">` (right side) — like / comment / share / ซื้อเลย buttons
- Type badge (top left) — สินค้า (เหลือง) / ข่าว (เขียว)
- เรียก `initAutoPlayObserver()` หลัง render เสร็จ (video autoplay)

#### M.3 `feed-renderer.js` — switchCategory() ใช้ initTukTukFeed

**ก่อน:**
```javascript
loadPosts(); // ❌ render ลง #postsFeed (ไม่ใช่ #tuktukFeed)
```

**หลัง:**
```javascript
if (typeof initTukTukFeed === 'function') {
    initTukTukFeed(category); // ✅ render TikTok slides ลง #tuktukFeed
} else {
    loadPosts(); // fallback
}
```

เหตุผล: `mobile-header.js` → `window.switchCategory(cat)` → `feed-renderer.js::switchCategory()` → ต้องเรียก `initTukTukFeed` ของ `tuktuk_feed_logic.js`

#### M.4 `tuktuk_feed.css` — CSS สำหรับ slide overlay elements

CSS class ใหม่ที่เพิ่ม:

| Class | หน้าที่ |
|-------|--------|
| `.tuktuk-slide-gradient` | Dark gradient overlay ด้านล่าง (ให้ข้อความอ่านได้บน media) |
| `.tuktuk-slide-info` | Container ข้อมูล (bottom-left, above bottom nav) |
| `.tuktuk-slide-author` | แถวชื่อผู้โพสต์ + distance badge |
| `.tuktuk-slide-title` | ชื่อโพสต์/สินค้า (font-weight: 700, line-clamp: 2) |
| `.tuktuk-slide-desc` | คำอธิบายสั้น (80 chars) |
| `.tuktuk-slide-price` | ป้ายราคา (แดง, rounded, แตะเพื่อซื้อ) |
| `.tuktuk-slide-badge` | Distance badge (glass morphism, cyan) |
| `.tuktuk-slide-video` | Video element (absolute fill, object-fit: cover) |

#### Flutter ↔ Web Alignment หลัง Fix

| Flutter | Web |
|---------|-----|
| `Tab 0: VerticalFeedView('all')` | `initTukTukFeed('all')` → `renderTukTukSlides()` |
| `Tab 1: VerticalFeedView('near_me')` | `initTukTukFeed('near_me')` → `renderTukTukSlides()` (location-filtered) |
| `Tab 2: CareerHubView` | `initCommunityFeed()` (เดิม, ไม่เปลี่ยน) |
| Tab header (mobile header) | `#mobileHeader .mh-tab` → `window.switchCategoryMobile()` → `window.switchCategory()` → `initTukTukFeed()` |
| Right-side action buttons | `.right-sidebar` + `.action-btn` + `.action-icon-wrapper` (CSS เดิม) |
| Like / Share / ซื้อ | `TukTukNotify.shareProduct/sharePost()` ใน onclick |

### สรุปไฟล์ที่แก้ในรอบนี้ (Phase M)

| ไฟล์ | การเปลี่ยนแปลง |
|------|--------------|
| `public/js/tuktuk_feed_logic.js` | `renderGrid()` mobile branch → เรียก `renderTukTukSlides()` แทน `createNearMeGridCard()` |
| `public/js/tuktuk_feed_logic.js` | เพิ่ม `renderTukTukSlides(container, items)` ฟังก์ชันใหม่ |
| `public/js/feed-renderer.js` | `switchCategory()` เรียก `initTukTukFeed()` แทน `loadPosts()` |
| `public/css/tuktuk_feed.css` | เพิ่ม CSS 8 classes สำหรับ slide overlay elements |
---

## Phase L — Mobile Header Enhancement (2026-03-12) ✅

### L.1 Two-Row Flutter-Inspired Layout
**หน้าไฟล์:** `public/css/mobile-header.css`, `public/index.html`
- เปลี่ยนจากแถวเดียวเป็น **2 แถว**:
  - **แถวบน:** [เมนู] [โลโก้] + [Tab Navigation] + [Bolt Auto-scroll]
  - **แถวล่าง:** [Notification & Mute Pill] แบบลอย (Floating)
- เพิ่ม **Glassmorphism** และ `-webkit-backdrop-filter` ให้ครบทุกจุดสำหรับ iOS
- รองรับ **Safe Area Inset Top** สมบูรณ์แบบ

### L.2 "Near Me" Tab Intelligence
**ไฟล์:** `public/js/mobile-header.js`
- หากกด Tab "ใกล้ฉัน" ซ้ำขณะที่ active อยู่ จะเรียก `window.showProvincePicker()` ทันที (Match Flutter)
- แสดงชื่อจังหวัดที่เลือกแทนคำว่า "ใกล้ฉัน" บน Tab UI

### L.3 State Sync & Modular Logic
**ไฟล์:** `public/js/mobile-header.js`, `public/js/tuktuk-engine.js`
- **Bolt Button:** Sync กับ `isTuktukAutoScroll` (Highlight สีส้มเมื่อเปิด)
- **Mute Icon:** Sync กับ `isTuktukGlobalMuted` ทั้งระบบ
- **Badge Sync:** Override `updatePillNotifCount` เพื่อให้ Badge บน Pill ใน Header อัปเดตตาม Firebase Snapshot
- **Modularization:** Export functions (`updateBoltUI`, `updateMuteUI`) ไปที่ `window` เพื่อให้ module อื่นๆ เรียก sync UI กันได้

### L.4 UX & Polish
- เพิ่ม **Haptic Feedback** (Vibration API) เมื่อมีการเปลี่ยน Tab หรือกดปุ่ม Bolt/Mute
- **Expanding Pill:** Pill แจ้งเตือนจะขยาย (Expand) เมื่อกด เพื่อแสดง Label และหุบเข้า (Auto-collapse) เองใน 4 วินาที
- แก้ไขปัญหา **CSS Duplication** และ **Lint Errors** ที่ค้างอยู่

### สรุปสถานะ Mobile Header V5
| Feature | สถานะ |
|---------|-------|
| UI Design (Glassmorphism) | ✅ เรียบร้อย |
| Tab Logic (All, Near Me, Career) | ✅ เรียบร้อย |
| Auto-scroll Sync (Bolt) | ✅ เรียบร้อย |
| Notification Pill Logic | ✅ เรียบร้อย |
| Province Picker Integration | ✅ เรียบร้อย |
| Haptic Feedback | ✅ เรียบร้อย |

---
