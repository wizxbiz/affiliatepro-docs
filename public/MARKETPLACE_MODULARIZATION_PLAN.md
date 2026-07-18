# แผนการ Modularize `public/marketplace.html`

> วิเคราะห์วันที่: 2026-03-09
> ขนาดปัจจุบัน: **15,264 บรรทัด**
> เป้าหมาย: marketplace.html เหลือเพียงโครงสร้าง HTML หลัก (~2,000 บรรทัด)

---

## สถานะปัจจุบัน — วิเคราะห์

### Inline `<style>` blocks — 6 บล็อก = **8,505 บรรทัด**

| # | บรรทัด | ขนาด | เนื้อหา | ย้ายไปที่ |
|---|--------|-----:|---------|-----------|
| 1 | L.60–6201 | 6,141 บรรทัด | CSS variables, core layout, product cards, animations, components | แยกเป็น 4 ไฟล์ |
| 2 | L.6364–6595 | 231 บรรทัด | `.search-filters-row`, filter pills, province dropdown | `css/marketplace-filters.css` |
| 3 | L.7351–7991 | 640 บรรทัด | Community Product Modal styles | `css/marketplace-modals.css` |
| 4 | L.8285–8439 | 154 บรรทัด | Shop Settings Modal styles | `css/marketplace-modals.css` (append) |
| 5 | L.8441–8980 | 539 บรรทัด | Enhanced Seller Dashboard Modal styles | `css/marketplace-modals.css` (append) |
| 6 | L.13803–14603 | 800 บรรทัด | Admin Ads FAB + Admin modals styles | `css/marketplace-admin.css` |

### Inline `<script>` blocks — 3 บล็อก = **4,742 บรรทัด**

| # | บรรทัด | ขนาด | เนื้อหา | ย้ายไปที่ |
|---|--------|-----:|---------|-----------|
| 1 | L.6205–6211 | 6 บรรทัด | Embedded/LIFF detection | `js/marketplace-init.js` |
| 2 | L.9238–13786 | 4,548 บรรทัด | Firebase init + state + 176 functions | แยกเป็น 6 โมดูล |
| 3 | L.14723–14911 | 188 บรรทัด | Quick View, Guide, Cart helper functions | `js/marketplace-ui.js` |

### ปัญหาอื่น

| ปัญหา | บรรทัด | ผลกระทบ |
|-------|--------|---------|
| Bootstrap CDN โหลดซ้ำ 2 ครั้ง | L.9234 + L.15251 | โหลดไม่จำเป็น |
| `/js/analytics.js` โหลดซ้ำ 2 ครั้ง | L.43 + L.6202 | request ซ้ำ |
| Firebase SDK v9 + v10 ปน | L.36–40 vs L.9239 | อาจ conflict |

---

## สรุปขนาด

```
ไฟล์ปัจจุบัน:    15,264 บรรทัด
CSS inline:       8,505 บรรทัด  (56%)
JS inline:        4,742 บรรทัด  (31%)
HTML + includes:  2,017 บรานทัด (13%)

เป้าหมายหลังแยก: ~2,000 บรรทัด  (-87%)
```

---

## CSS Files ที่จะสร้าง (7 ไฟล์)

### จาก Style Block 1 (6,141 บรรทัด → แยก 4 ไฟล์)

| ไฟล์ | เนื้อหา | ขนาดประมาณ |
|------|---------|----------:|
| `css/marketplace-vars.css` | `:root` CSS variables, design tokens, color scheme | ~100 บรรทัด |
| `css/marketplace-layout.css` | Base layout, header, sticky nav, footer, tab system | ~1,500 บรรทัด |
| `css/marketplace-cards.css` | Product cards, card grid, hover effects, image gallery | ~2,500 บรรทัด |
| `css/marketplace-components.css` | Buttons, badges, tags, pills, toast, skeleton loaders, misc UI | ~2,000 บรรทัด |

### จาก Style Blocks 2–6

| ไฟล์ | แหล่งที่มา | เนื้อหา | ขนาด |
|------|-----------|---------|-----:|
| `css/marketplace-filters.css` | Style 2 | Filter pills, search bar, province dropdown, sort | 231 บรรทัด |
| `css/marketplace-modals.css` | Style 3+4+5 | Community modal, Shop settings, Seller dashboard | 1,333 บรรทัด |
| `css/marketplace-admin.css` | Style 6 | Admin Ads FAB, admin create/edit modals | 800 บรรทัด |

---

## JS Modules ที่จะสร้าง (6 โมดูล)

### จาก Script Block 2 (4,548 บรรทัด → แยก 6 ไฟล์)

| ไฟล์ | ฟังก์ชันหลัก | ขนาดประมาณ |
|------|-------------|----------:|
| `js/marketplace-init.js` | Firebase config+init, state vars, SUPER_ADMIN_IDS, formatPrice, maskPhone, getTimeAgo, isNew/Hot, checkSuperAdmin, checkSavedSession | ~300 บรรทัด |
| `js/marketplace-products.js` | renderProductCard, renderSkeletons, renderProducts, renderEmptyState, deleteProduct, markAsSold, editProduct, confirmDelete, canManageProduct, shareProductCard | ~600 บรรทัด |
| `js/marketplace-search.js` | filterProducts, searchProducts, sortProducts, filterByPrice, filterByQuickCat, filterBySeller, onSearchInput, fetchSuggestions, showSuggestions, renderSearchHistory, updateCategoryCounts, setView, onProvinceChange, onOtopToggleChange | ~500 บรรทัด |
| `js/marketplace-seller.js` | Wishlist functions, Seller dashboard modal, Shop settings, AI Post Generator (generateAIPost, callGeminiVision, displayAIResult, checkAIQuota, postToMarketplace), PIN verification, membership modal | ~1,200 บรรทัด |
| `js/marketplace-admin.js` | Super Admin check, openAdminAdsModal, handleCreateAd, loadAdsList, editAd, toggleAdStatus, deleteAd, loadPromotions, renderPromoBanners, renderPromoCards, handlePromoClick, slider functions | ~800 บรรทัด |
| `js/marketplace-community.js` | switchMarket, loadCommunityProducts, filterCommunity, sortCommunityProducts, renderCommunityProductCard, viewCommunityProduct, addCommToCart, contactCommSeller, shareCommProduct, followSeller, loadCommunityVideos, addToCart | ~900 บรรทัด |

### จาก Script Block 3 (เพิ่มเข้า marketplace-ui.js)

| ไฟล์ | ฟังก์ชัน | ขนาด |
|------|---------|-----:|
| `js/marketplace-ui.js` | openGuide, closeGuide, openQuickView, closeQuickView, changeGalleryImage, openImageZoom, revealPhone, contactSeller, showToast, showLoading, hideLoading, toggleFooter, initFooterState | ~250 บรรทัด |

---

## แผนงาน (Phase A–H)

### Phase A — ลบ Duplicates (🟢 ต่ำ, 5 นาที)

```
ลบ Bootstrap CDN ที่ L.15251 (ซ้ำกับ L.9234)
ลบ /js/analytics.js ที่ L.6202 (ซ้ำกับ L.43)
```

### Phase B — แยก Style Blocks 2–6 (🟢 ต่ำ, 30 นาที)

```
สร้าง css/marketplace-filters.css  ← Style L.6364–6595
สร้าง css/marketplace-modals.css   ← Style L.7351–7991 + L.8285–8439 + L.8441–8980
สร้าง css/marketplace-admin.css    ← Style L.13803–14603
เพิ่ม <link> 3 รายการใน <head>
ลบ <style> blocks ทั้ง 4 บล็อก
```

### Phase C — แยก Script Block 3 (🟢 ต่ำ, 15 นาที)

```
สร้าง js/marketplace-ui.js ← Script L.14723–14911
เพิ่ม <script src="js/marketplace-ui.js" defer>
ลบ <script> block เดิม
```

### Phase D — แยก Script Block 1 (🟢 ต่ำ, 5 นาที)

```
สร้าง js/marketplace-init.js ← Script L.6205–6211 (LIFF detection)
เพิ่มเป็นส่วนแรกของ marketplace-init.js
ลบ <script> block เดิม
```

### Phase E — แยก Style Block 1 เป็น 4 ไฟล์ (🟡 กลาง, 60 นาที)

```
สร้าง css/marketplace-vars.css       ← :root, CSS variables
สร้าง css/marketplace-layout.css     ← layout, header, nav, footer
สร้าง css/marketplace-cards.css      ← product cards, grid
สร้าง css/marketplace-components.css ← buttons, badges, misc
เพิ่ม <link> 4 รายการใน <head>
ลบ <style> block L.60–6201
```

⚠️ **ต้อง audit** ก่อนว่ามี selector ซ้อนซ้อนกับ index.html หรือไม่

### Phase F — `js/marketplace-products.js` (🟡 กลาง, 30 นาที)

```
แยกฟังก์ชัน: renderProductCard, renderProducts,
  renderSkeletons, renderEmptyState, deleteProduct,
  markAsSold, editProduct, confirmDelete, shareProductCard
ขึ้นอยู่กับ: marketplace-init.js (state, formatPrice, etc.)
```

### Phase G — `js/marketplace-search.js` (🟡 กลาง, 30 นาที)

```
แยกฟังก์ชัน: filterProducts, searchProducts, sortProducts,
  filterByPrice, filterByQuickCat, filterBySeller,
  onSearchInput, fetchSuggestions, updateCategoryCounts
ขึ้นอยู่กับ: marketplace-init.js, marketplace-products.js
```

### Phase H — `js/marketplace-seller.js` (🔴 สูง, 60 นาที)

```
แยกฟังก์ชัน: AI Post Generator ทั้งหมด (generateAIPost,
  callGeminiVision, checkAIQuota, postToMarketplace),
  Wishlist, Seller Dashboard, PIN verification
ขึ้นอยู่กับ: state, Firebase auth, Gemini API
```

### Phase I — `js/marketplace-admin.js` (🟡 กลาง, 30 นาที)

```
แยกฟังก์ชัน: checkSuperAdmin, openAdminAdsModal,
  handleCreateAd, loadAdsList, loadPromotions,
  renderPromoBanners, slider functions
ขึ้นอยู่กับ: marketplace-init.js (SUPER_ADMIN_IDS)
```

### Phase J — `js/marketplace-community.js` (🟡 กลาง, 45 นาที)

```
แยกฟังก์ชัน: switchMarket, loadCommunityProducts,
  filterCommunity, renderCommunityProductCard,
  viewCommunityProduct, addToCart, loadCommunityVideos
ขึ้นอยู่กับ: state, Firebase
```

### Phase K — `js/marketplace-init.js` (main Firebase init) (🔴 สูง, 30 นาที)

```
แยก: Firebase config, initializeApp, Firestore init,
  state variables, SUPER_ADMIN_IDS, window.onload handler
ต้องระวัง: ต้องโหลดก่อนทุก module อื่น (no defer)
```

---

## ลำดับความสำคัญ

| # | Phase | ความเสี่ยง | เวลา | ลด (บรรทัด) |
|---|-------|-----------|------|------------|
| A | ลบ Duplicates | 🟢 ต่ำ | 5 นาที | ~10 |
| B | CSS Style 2–6 → 3 ไฟล์ | 🟢 ต่ำ | 30 นาที | ~1,333 |
| C | Script 3 → marketplace-ui.js | 🟢 ต่ำ | 15 นาที | ~188 |
| D | Script 1 → marketplace-init.js | 🟢 ต่ำ | 5 นาที | ~6 |
| E | CSS Style 1 → 4 ไฟล์ | 🟡 กลาง | 60 นาที | ~6,141 |
| F | Script 2: products module | 🟡 กลาง | 30 นาที | ~600 |
| G | Script 2: search module | 🟡 กลาง | 30 นาที | ~500 |
| H | Script 2: seller+AI module | 🔴 สูง | 60 นาที | ~1,200 |
| I | Script 2: admin module | 🟡 กลาง | 30 นาที | ~800 |
| J | Script 2: community module | 🟡 กลาง | 45 นาที | ~900 |
| K | Script 2: Firebase init module | 🔴 สูง | 30 นาที | ~300 |

> ทำ Phase A–D ก่อนเสมอ — ปลอดภัย เห็นผลทันที ไม่กระทบ logic
> Phase E ต้อง audit CSS selectors ก่อนแยก
> Phase H, K มีความเสี่ยงสูง ต้องทดสอบทุก feature หลังแยก

---

## Script Load Order ที่ถูกต้องหลัง Modularize

```html
<!-- ใน <head> -->
<script src="js/marketplace-init.js"></script>        <!-- ต้องก่อนสุด (no defer) -->

<!-- defer ได้ -->
<script src="js/marketplace-ui.js" defer></script>
<script src="js/marketplace-products.js" defer></script>
<script src="js/marketplace-search.js" defer></script>
<script src="js/marketplace-seller.js" defer></script>
<script src="js/marketplace-admin.js" defer></script>
<script src="js/marketplace-community.js" defer></script>
```

---

## Dependency Graph

```
marketplace-init.js (state, Firebase, formatPrice)
    ├── marketplace-products.js  (renderProductCard → uses state, formatPrice)
    │       └── marketplace-search.js  (filterProducts → uses renderProducts)
    ├── marketplace-seller.js    (AI → uses Firebase auth, state)
    ├── marketplace-admin.js     (ads → uses SUPER_ADMIN_IDS, Firebase)
    ├── marketplace-community.js (community → uses state, Firebase)
    └── marketplace-ui.js        (UI helpers → standalone mostly)
```

---

## Verification Checklist หลังแต่ละ Phase

- [ ] สินค้าโหลดและแสดงผลได้
- [ ] ค้นหา / filter / sort ทำงาน
- [ ] Quick View modal เปิด-ปิดได้
- [ ] Wishlist toggle ทำงาน
- [ ] AI Post Generator รัน (ถ้า quota ยังเหลือ)
- [ ] Admin FAB แสดงสำหรับ super admin
- [ ] Community market tab สลับได้
- [ ] สินค้าชุมชน (OTOP) โหลดได้
- [ ] Province filter ทำงาน
- [ ] เพิ่มสินค้าใหม่ (seller) ได้
