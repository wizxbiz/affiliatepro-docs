รายงานสรุปการพัฒนาและปรับปรุงวิดีโอฟีด (TukTuk Web Feed Enhancement) - ฉบับที่ 7 (Sidebar UX + Home Nav + Near Me Fix)
รายงานฉบับนี้แก้ไข 4 รายการ: (1) More Options ไม่มีวงกลมครอบ, (2) รูปโปรไฟล์ขนาด 48px, (3) ปุ่มหน้าแรกสลับแทปแทนโหลดใหม่, (4) Near Me ระบุตำแหน่งพร้อม fallback จังหวัด

---

🛠 รายการพัฒนาล่าสุด (ฉบับที่ 7)

7. 🎯 ปรับปรุง Sidebar UX + Navigation + Near Me (2026-03-13)

7.1 More Options ไม่ครอบวงกลม
- ลบ div.action-icon-wrapper ออกจากปุ่ม 3 จุด (More Options)
- เหลือแค่ <i class="fas fa-ellipsis-h"> ลอยๆ — สะอาดกว่าและไม่ซ้ำกับปุ่มอื่น
- font-size ขยายเป็น 1rem, opacity: 0.8 เพื่อให้มองเห็นชัดขึ้น

7.2 รูปโปรไฟล์ใน Sidebar ขยายเป็น 48px
- width/height เพิ่มจาก 24px → 48px
- border เพิ่มจาก 1px → 2px solid white + box-shadow
- ปุ่ม Follow (+) ขยายจาก 11px → 18px รองรับนิ้วกดได้ง่ายขึ้น

7.3 ปุ่มหน้าแรก — ไม่โหลดฟีดใหม่ถ้าอยู่หน้า index แล้ว
- เพิ่ม handleHomeClick() ใน PersistentUI (persistent-ui.js)
- ถ้า URL เป็น index.html/tuktuk.html → เรียก switchCategoryMobile('all') ตรงๆ
- ฟีดสลับไป Tab "ดูเพลิน" โดยไม่ reload ทั้งหน้า
- ถ้าอยู่หน้าอื่น → navigate ไป index.html ตามปกติ

7.4 Near Me — แก้ permission denied + HTTPS check + fallback province picker
- เพิ่ม HTTPS protocol check ก่อนขอพิกัด (geolocation ต้องใช้ HTTPS)
- ตรวจ navigator.permissions.query ก่อนเรียก getCurrentPosition
- ถ้า permission === 'denied' → แสดง toast + เปิด Province Picker อัตโนมัติ
- Error code 1 (denied): แสดงคำแนะนำ "กรุณาอนุญาตในการตั้งค่า" + เปิด picker
- Error code 2 (unavailable): "ไม่สามารถระบุตำแหน่งได้ในขณะนี้"
- Error code 3 (timeout): "หมดเวลาการระบุตำแหน่ง"
- Cache อัปเกรดจาก 1 min → 5 min (300000ms)
- Timeout อัปเกรดจาก 8s → 10s

---

---

🛠 รายการพัฒนาที่สำคัญล่าสุด (Key Updates & Bug Fixes)

1. 💬 แก้ไขระบบความคิดเห็น (Comment Functionality Fix)
เราได้ทำการตรวจสอบและแก้ไขปัญหาที่ผู้ใช้กดปุ่มคอมเมนต์แล้วไม่ทำงาน:

Fix ID Mismatch: แก้ไขความผิดพลาดในการเรียกใช้ ID ระหว่าง commentList (ใน HTML) และ commentsList (ใน JS) ให้ตรงกันทั้งหมด
Unified Modal Instance: ปรับปรุงลอจิกให้ทุกส่วนของแอปพลิเคชันเรียกใช้ window.commentModal ตัวเดียวกัน เพื่อป้องกันการสร้างอินสแตนซ์ซ้ำซ้อนจนเกิดอาการ "นิ่ง" หรือ "ไม่แสดงผล" เมื่อกดปุ่ม
Real-time Comments: ปรับปรุงมาใช้ระบบ onSnapshot ใน community_feed_integration.js เพื่อให้คอมเมนต์แสดงผลแบบเรียลไทม์ทันทีที่มีคนส่งข้อความใหม่
Conflict Resolution: แก้ไขไฟล์ tuktuk-feed-vertical.js ไม่ให้ไปเขียนทับฟังก์ชันคอมเมนต์หลัก เพื่อให้ลอจิกการโหลดข้อมูลทำงานได้ถูกต้องในทุกหน้าจอ
Modal Tab 0/1 Fix: เพิ่มการเรียก injectCommunityModals() ใน renderTukTukSlides() เพื่อให้ #commentModal DOM ถูกสร้างก่อน Tab 0/1 จะมีการคลิก (ก่อนหน้านี้ถูกเรียกเฉพาะ Tab 2 เท่านั้น)

2. ⚡ ระบบเลื่อนฟีดอัตโนมัติ (Improved Auto-scroll & Loop Control)
ปรับปรุงลอจิกการรับชมให้มีความยืดหยุ่นตามความต้องการของผู้ใช้:

Smart Video Transition: เมื่อเปิดโหมด "เล่นอัตโนมัติ" วิดีโอจะเล่นจนจบแล้วเลื่อนไปยังโพสต์ถัดไปทันทีผ่านเหตุการณ์ onended
Loop Control: หากผู้ใช้ปิดโหมดเล่นอัตโนมัติ วิดีโอจะทำการวนลูป (Loop) อยู่ที่เดิมตามปกติสไตล์ TikTok
Shared Scroll Logic: เชื่อมต่อ tuktuk_feed_logic.js เข้ากับระบบคำนวณการเลื่อนส่วนกลางของ feed-renderer.js เพื่อความเสถียร

3. 🚀 พัฒนาประสิทธิภาพการโหลด (Video Performance Optimization)
แก้ปัญหาเรื่องวิดีโอโหลดช้าและจอแก้วตอนเริ่มเล่น:

Smart Preloading: ระบบจะทำการโหลดวิดีโอล่วงหน้า (Buffered) สำหรับ 3 คลิปถัดไปเสมอ ทำให้การเลื่อนฟีดลื่นไหลไม่มีสะดุด
Poster Integration: ใช้รูปภาพหน้าปก (Poster) แสดงผลทันทีที่เริ่มโหลดวิดีโอ เพื่อกำจัดปัญหาจอสีดำหรืออาการแฟลชตอนเริ่มเล่น
Hardware Acceleration: บังคับใช้ CSS will-change: transform และ backface-visibility: hidden เพื่อรีดประสิทธิภาพจาก GPU ของมือถือ ทำให้การเลื่อนและเล่นวิดีโอมีความนุ่มนวล (60fps)

4. 📱 Sidebar & Options UI (Premium Look)
📏 Compact Sidebar: ปรับลดขนาด Sidebar ลง 40% ตามที่กำหนด เพื่อไม่ให้บดบังเนื้อหาวิดีโอหลัก
🔘 Action Sheet Options: เมื่อกดปุ่ม "More Options" (จุดสามจุด) ระบบจะแสดง Bottom Sheet สไตล์ iOS/Android ที่ทันสมัยแทน Windows Alert เดิม
✨ Glassmorphism: ใช้ดีไซน์กระจกฝ้าที่กระชับตามแบบใน tuktuk_feed_screen.dart ให้ความรู้สึกที่พรีเมียมและเรียบง่าย

5. 🧭 แก้ไขแถบนำทางด้านล่าง (Persistent Bottom Navigation Fix)
แก้ไขปัญหาแถบเมนูหลัก (หน้าแรก, แชท, ตลาด, โปรไฟล์) หายไประหว่างการใช้งาน:

Fix Layer Visibility: ปรับเปลี่ยนค่า z-index เป็น 11000 !important เพื่อให้แถบเมนูอยู่เหนือวิดีโอและองค์ประกอบอื่นๆ เสมอ แม้ในตอนที่กำลังเลื่อนฟีด
Remove Layout Conflicts: กำจัดคำสั่ง display: none ในไฟล์ new-styles.css ที่เคยบังแถบเมนูในบางขนาดหน้าจอโดยไม่ตั้งใจ
SPA Routing Consolidation: ยุบรวมระบบนำทาง SPA (Single Page Application) มาไว้ที่ศูนย์กลางเดียวใน spa-router.js เพื่อลดการทำงานที่ซ้ำซ้อนและป้องกันเมนูค้างหรือเพี้ยน

6. 🚨 แก้ไขวิกฤต: Bottom Nav หายและปุ่มนำทางไม่ทำงาน (2026-03-13)
วินิจฉัยและแก้ไข 4 root cause ที่ทำให้ Bottom Nav หายระหว่างเลื่อนฟีด และปุ่มทุกปุ่มนำทางไม่ได้:

Root Cause 1 — SPA iframe z-index ต่ำกว่า Feed (Bug ร้ายแรงที่สุด)
ไฟล์: js/spa-router.js

ปัญหา: spaIframeContainer มี z-index: 9000 แต่ #tuktukFeed มี z-index: 9900 ทำให้เมื่อกดปุ่มนำทางใดก็ตาม (ตลาด, แชท, โปรไฟล์) หน้านั้นจะโหลดใน iframe แต่ feed ทับอยู่ด้านบน ผู้ใช้มองไม่เห็นหน้าปลายทาง เหมือนปุ่มไม่ทำงาน
แก้ไข: เพิ่ม z-index จาก 9000 → 10500 (เหนือ feed 9900 แต่ต่ำกว่า nav 11000)

Root Cause 2 — Nav ขาด GPU Compositing Layer (iOS Safari ร่วง)
ไฟล์: css/persistent-ui.css

ปัญหา: บน iOS Safari ระหว่าง momentum scroll ของ feed container, .bottom-nav ที่ไม่มี compositing layer ของตัวเองจะถูก browser ลบออกจาก render tree ชั่วคราว ทำให้หายไปตอนเลื่อน
แก้ไข: เพิ่ม will-change: transform; -webkit-transform: translateZ(0); transform: translateZ(0); บังคับให้ nav มี GPU layer ของตัวเอง

Root Cause 3 — body.feed-mode-active ใช้ overflow:hidden ผิด
ไฟล์: css/tuktuk_feed.css

ปัญหา: overflow: hidden !important บน body ทำให้ iOS Safari เกิด clipping bug กับ position:fixed elements ในบาง viewport state ระหว่าง scroll
แก้ไข: ลบ overflow: hidden ออก เพราะ feed ใช้ position:fixed + overflow-y:auto ของตัวเองอยู่แล้ว body ไม่จำเป็นต้อง overflow:hidden

Root Cause 4 — body.modal-open ซ่อน nav เมื่อเปิด Comment/Share modal
ไฟล์: css/new-styles.css

ปัญหา: กฎ body.modal-open .bottom-nav { display: none !important } ทำให้ทุกครั้งที่ผู้ใช้กดคอมเมนต์หรือ share บนฟีด nav หายไปทันที
แก้ไข: comment out กฎนี้ออก nav ต้องคงอยู่เสมอแม้ modal จะเปิดอยู่

7. 🎬 Video Engine V2 — Flutter Alignment (2026-03-13)
พัฒนา Video Engine ใหม่ให้ตรงแบบกับ Flutter tuktuk_feed_screen.dart อย่างสมบูรณ์:

7.1 🎯 Smart Autoplay Observer (initTukTukSlideObserver)
ไฟล์: js/tuktuk_feed_logic.js

ปัญหาเดิม: initAutoPlayObserver เดิมใน feed-renderer.js ดู .news-video-container, .community-post-media เท่านั้น — ไม่ครอบคลุม .tuktuk-video-item ในฟีดหลัก ทำให้วิดีโอไม่มีระบบ play/pause อัตโนมัติเลย
แก้ไข: สร้าง initTukTukSlideObserver(container) ใหม่ด้วย IntersectionObserver threshold 0.5 (ตรงแบบ Flutter isActive flag)
  - สไลด์ที่มองเห็น ≥50%: เล่นวิดีโอ
  - สไลด์อื่นทั้งหมด: หยุดวิดีโอ ณ เวลาเดียวกัน (atomic pause)
  - Observer ล้างตัวเองและสร้างใหม่ทุกครั้งที่ renderTukTukSlides() ถูกเรียก

7.2 📦 Lazy Preloading ตามระยะห่าง (_updateNeighborPreloads)
ไฟล์: js/tuktuk_feed_logic.js

ปัญหาเดิม: ทุกวิดีโอมี preload="auto" — โหลดวิดีโอทั้งหมดพร้อมกัน เปลืองแบนด์วิดท์อย่างมาก บนมือถือ 4G ทำให้ฟีดช้า
แก้ไข: เปลี่ยนเป็น preload="none" ทั้งหมดตั้งต้น จากนั้น Observer ปรับตาม:
| ระยะห่างจาก active | preload |
|---------------------|---------|
| current ± 1 | auto (โหลดเต็ม) |
| current ± 2 | metadata (โหลดแค่ข้อมูล) |
| ไกลกว่านั้น | none (ไม่โหลด) |
ตรงแบบกับ Flutter VideoController preload-ahead ± 1 slide

7.3 ⏱️ Product Card 8-Second Timer (_startProductTimer)
ไฟล์: js/tuktuk_feed_logic.js + css/tuktuk_feed.css

ตรงแบบ Flutter _buildProductCard ที่มี Timer(8 วินาที) auto-advance:
  - Gradient progress bar (แดง → เหลือง) animate ขึ้นบน product slide
  - ครบ 8 วินาที → scrollIntoView สไลด์ถัดไปอัตโนมัติ
  - หยุด/รีเซ็ต bar เมื่อสไลด์ออกจากหน้าจอ
  - ปุ่ม "ดูสินค้า →" ที่ด้านล่างสไลด์ Product (gradient แดง-ส้ม)

7.4 📄 Pagination Auto-Trigger
ไฟล์: js/tuktuk_feed_logic.js

ปัญหาเดิม: ฟีดโหลดครั้งเดียว ไม่มีการโหลดเพิ่มเมื่อเลื่อนถึงท้าย
แก้ไข (ฉบับ 4): IntersectionObserver บนสไลด์สุดท้าย threshold 0.1 → เรียก loadMixedFeed() เพื่อ append โพสต์เพิ่ม
แก้ไข (ฉบับ 5): Bug — ส่ง argument ผิด loadMixedFeed(true) แทน loadMixedFeed(container, mode) → แก้ส่ง container + currentMode ที่ถูกต้อง พร้อมแสดง pagination spinner ก่อนโหลด
ตรงแบบ Flutter cursor-based pagination (load at index >= items.length - 3)

7.5 ❤️ Optimistic Like with Rollback
ไฟล์: js/tuktuk_feed_logic.js

ปัญหาเดิม: likePost อัปเดต UI แบบ optimistic แต่ถ้า Firestore error ไม่มี rollback — ตัวเลขผิดค้างในหน้าจอ
แก้ไข:
  - บันทึก prevCount + wasLiked ก่อนอัปเดต UI
  - Firestore call ใน try/catch
  - On error: คืนค่า class, icon color, และ count กลับเป็นค่าก่อนคลิก + แสดง toast "เกิดข้อผิดพลาด"
  - เพิ่ม arrayRemove เมื่อ unlike (เดิมมีแค่ arrayUnion ทำให้ unlike ไม่ได้บันทึก)

---

🏗 การเปลี่ยนแปลงไฟล์ที่เกี่ยวข้อง (ฉบับที่ 4)

js/tuktuk_feed_logic.js:
- เพิ่ม initTukTukSlideObserver(container) — Video autoplay engine ใหม่
- เพิ่ม _updateNeighborPreloads() — ควบคุม preload ตามระยะห่าง
- เพิ่ม _startProductTimer() / _stopProductTimer() — ตัวจับเวลา 8 วินาที
- เปลี่ยน preload="auto" → preload="none" ในทุก video element ที่สร้าง
- เพิ่ม data-type / data-postId attribute ใน slide element
- เพิ่ม product-card-strip HTML (timer bar + seller name + CTA) ใน product slides
- เพิ่ม pagination IntersectionObserver บนสไลด์สุดท้าย
- ปรับปรุง likePost() — optimistic + rollback + arrayRemove support

css/tuktuk_feed.css:
- เพิ่ม .product-card-strip + .product-strip-inner — container ที่ด้านล่างสไลด์ product
- เพิ่ม .product-timer-track + .product-timer-bar — progress bar gradient
- เพิ่ม .product-strip-btn — ปุ่ม "ดูสินค้า →"
- เพิ่ม .feed-loading-spinner + .feed-spinner-ring — orange spinner (#FF6D00 ตรงแบบ Flutter)
- เพิ่ม .feed-pagination-spinner — spinner เล็กท้ายฟีด
- เพิ่ม .feed-error-state + .feed-error-retry-btn — หน้าแสดง error + ปุ่ม retry
- เพิ่ม will-change: transform บน .feed-spinner-ring เพื่อให้ animation อยู่ใน GPU layer (ไม่ trigger Paint)

js/community_feed_integration.js: แก้ไข ID Mismatch และระบบ Real-time Comment
js/feed-renderer.js: ปรับปรุงศูนย์กลางการจัดการ Modal และระบบ Auto-scroll
js/tuktuk-feed-vertical.js: ปรับปรุงการ Preload และลด Conflict ของฟังก์ชันคอมเมนต์
js/ui-helpers.js: ยุบรวมระบบ Action Sheet และตัวเลือกเพิ่มเติม (More Options) ไว้ที่เดียว
js/spa-router.js: แก้ไข z-index ของ spaIframeContainer จาก 9000 → 10500
css/persistent-ui.css: เพิ่ม GPU compositing layer (will-change + translateZ) ให้ .bottom-nav + เพิ่ม -webkit-backdrop-filter ให้ .creation-overlay
css/new-styles.css: comment out กฎ body.modal-open .bottom-nav { display:none } + แก้ -webkit-backdrop-filter ที่ขาดหาย

---

8. 🎨 Sidebar Resize + Parallel Data Engine (ฉบับที่ 5 — 2026-03-13)

8.1 📱 Right Sidebar — ปรับขนาดใหม่ให้กดได้ง่าย (ไม่เล็กเกินไป)
ไฟล์: css/tuktuk_feed.css

ปัญหา: override block สุดท้ายใน CSS บังคับ !important ทำให้ sidebar เล็กกว่าที่ควรมาก
| รายการ | ก่อน (ฉบับ 4) | ฉบับ 5 | ฉบับ 6 |
|--------|--------------|--------|--------|
| .action-icon-wrapper | 22×22px | 40×40px | **70×70px** |
| .action-icon | 0.78rem | 1.15rem | **1.6rem** |
| .action-text | 0.46rem | 0.62rem | **0.7rem** |
| .right-sidebar gap | 3px | 8px | 8px (คงเดิม) |
| min-width (touch target) | ไม่กำหนด | 44px | **70px** |

แก้ไข (ฉบับ 6): เพิ่ม .action-icon-wrapper เป็น 70×70px ตามคำขอ — icon ใหญ่ชัดเจน มองเห็นง่ายบนมือถือ

8.2 🔧 Pagination Bug Fix
ไฟล์: js/tuktuk_feed_logic.js

ปัญหา: pagination observer เรียก loadMixedFeed(true) ซึ่งส่ง true เป็น container parameter → function ไม่ทำงานเลย
แก้ไข: เปลี่ยนเป็น loadMixedFeed(container, currentMode, false) — บันทึก container + mode ก่อน observer ถูกสร้าง
เพิ่ม: แสดง .feed-pagination-spinner (orange ring) ก่อนโหลดเพื่อ feedback ทันที

8.3 ⚡ Parallel Fetch Engine — Go Engine + Firebase พร้อมกัน
ไฟล์: js/tuktuk_feed_logic.js

ปัญหาเดิม (Sequential — ช้าที่สุด 13 วินาที):
Go Engine timeout 5,000ms → ล้มเหลว (Fly.io cold start) → Firebase timeout 8,000ms → รอรวม ~13 วินาที

แก้ใหม่ (Parallel — เร็วขึ้น ~5 เท่า):
Go Engine (2,500ms) ──┐
                       ├── Promise.allSettled() ใช้ผลแรกที่มาและมีข้อมูล
Firebase (6,000ms)  ───┘
รอสูงสุด ~3 วินาที (เวลา Firebase query จริง)

รายละเอียดการเปลี่ยนแปลง:
- fetchGoEngineFeed: timeout 5,000ms → 2,500ms (ถ้าช้ากว่านี้ แสดงว่า cold start หนัก → ให้ Firebase ชนะ)
- fetchFirebaseFeedData() ใหม่: ดึง 3 collections พร้อมกันใน Promise.allSettled() ภายใน function เดียว
- _interleaveFeedItems() ใหม่: แยก logic การผสม feed ออกจาก loadMixedFeed → ใช้ได้ทั้ง Go Engine data และ Firebase data โดยไม่ duplicate code
- loadMixedFeed: เปลี่ยนจาก await Go → await Firebase → เป็น await Promise.allSettled([Go, Firebase]) พร้อมกัน

ผลกระทบต่อ tuktuk-backend:
- Go Backend ยังคงเป็น primary source — ถ้าตอบภายใน 2.5 วินาที จะถูกใช้เสมอ
- Firebase เป็น hot standby — เริ่ม query พร้อม Go ตั้งแต่แรก ไม่ต้องรอ fallback
- Cold start ของ Fly.io ไม่ block ผู้ใช้อีกต่อไป

---

🏗 การเปลี่ยนแปลงไฟล์สะสมทั้งหมด (ฉบับที่ 5):

js/tuktuk_feed_logic.js (ฉบับ 4-5):
- initTukTukSlideObserver(container) — Video autoplay engine ใหม่
- _updateNeighborPreloads() — ควบคุม preload ตามระยะห่าง
- _startProductTimer() / _stopProductTimer() — ตัวจับเวลา 8 วินาที
- fetchGoEngineFeed() — timeout ลดเหลือ 2,500ms
- fetchFirebaseFeedData() — ดึง 3 collections พร้อมกัน (ใหม่ฉบับ 5)
- _interleaveFeedItems() — แยก interleave logic ออกมา (ใหม่ฉบับ 5)
- loadMixedFeed() — parallel fetch แทน sequential (ฉบับ 5)
- Pagination observer — แก้ argument bug (ฉบับ 5)
- likePost() — optimistic + rollback + arrayRemove

css/tuktuk_feed.css (ฉบับ 4-5):
- .right-sidebar — ปรับขนาดสมดุล (ฉบับ 5)
- .action-icon-wrapper — 40px + background circle (ฉบับ 5)
- .product-card-strip — container product strip
- .product-timer-track / .product-timer-bar — progress bar gradient
- .product-strip-btn — ปุ่ม "ดูสินค้า →"
- .feed-loading-spinner / .feed-spinner-ring — orange spinner
- .feed-pagination-spinner — spinner ท้ายฟีด
- .feed-error-state / .feed-error-retry-btn — error + retry

js/community_feed_integration.js, js/spa-router.js, css/persistent-ui.css, css/new-styles.css: (ฉบับ 3 — ไม่เปลี่ยน)

---

สรุป Z-Index Stack (ฉบับ 3-5 ไม่เปลี่ยน):
| Layer | Z-Index | หมายเหตุ |
|-------|---------|---------|
| #tuktukFeed (Feed) | 9900 | feed คลิปวิดีโอ |
| .modal-backdrop (Bootstrap) | 10100 | backdrop comment modal |
| #commentModal, #quickPostModal | 10200 | modal เหนือ feed |
| SPA Iframe Container | 10500 | เหนือ feed, ต่ำกว่า nav |
| Bottom Nav | 11000 | มองเห็นเสมอ |
| Center Button | 11002 | เหนือ nav |
| Creation Overlay | 10000000 | เฉพาะเมื่อเปิด hub |

---

สรุปการ Align กับ Flutter tuktuk_feed_screen.dart (อัปเดตฉบับ 5):
| Feature | Flutter | Web (ก่อน) | Web (ฉบับ 4) | Web (ฉบับ 5) |
|---------|---------|------------|--------------|--------------|
| Autoplay | isActive flag | ไม่มี | ✅ IntersectionObserver ≥50% | ✅ (คงเดิม) |
| Pause others | onPageChanged | ❌ | ✅ atomic pause | ✅ (คงเดิม) |
| Preload | ±1 VideoController | preload="auto" ทุกคลิป | ✅ none/metadata/auto | ✅ (คงเดิม) |
| Product timer | 8s auto-advance | ❌ | ✅ 8s + progress bar | ✅ (คงเดิม) |
| Product CTA | "ดูสินค้า" | sidebar เท่านั้น | ✅ product-strip-btn | ✅ (คงเดิม) |
| Pagination | index >= length-3 | ❌ | ✅ (มี bug arg) | ✅ แก้ bug แล้ว |
| Optimistic like | rollback on error | ไม่มี rollback | ✅ try/catch rollback | ✅ (คงเดิม) |
| Loading spinner | orange spinner | ❌ | ✅ #FF6D00 | ✅ + pagination spinner |
| Sidebar size | ~44px tap target | 22px (เล็กเกิน) | 40px | ✅ **70px** (ฉบับ 6) |
| Data source | - | Firebase เดี่ยว | Go Engine → Firebase | ✅ Parallel Race |
| Load time | - | ~8s (Firebase) | ~5-13s (sequential) | ✅ ~2-3s (parallel) |

---

สถานะปัจจุบัน (2026-03-13 ฉบับที่ 6):
✅ Video autoplay/pause อัตโนมัติตามการมองเห็น (IntersectionObserver)
✅ Lazy preloading ประหยัดแบนด์วิดท์ (preload="none" → ปรับตามระยะห่าง)
✅ Product card 8 วินาทีพร้อม progress bar และปุ่ม CTA
✅ Pagination โหลดเพิ่มอัตโนมัติ — แก้ bug argument แล้ว
✅ Optimistic like พร้อม rollback เมื่อ Firestore error
✅ Bottom Nav ไม่หายทุกสถานการณ์ (scroll, modal, iframe)
✅ Comment modal ทำงานได้บนทุก Tab (0, 1, 2)
✅ SPA navigation ทำงานได้ถูกต้อง (z-index stack สมบูรณ์)
✅ Sidebar icon 70×70px — กดง่าย มองชัด บนมือถือทุกขนาด
✅ ฟีดโหลดเร็วขึ้น 5 เท่า — Go Engine + Firebase parallel race (~2-3s)
✅ tuktuk-backend cold start ไม่ block ผู้ใช้อีกต่อไป
✅ **ระบบ Persistent UI เป็นหนึ่งเดียวทั่วทั้งแอป** (index, messages, marketplace, channel)
✅ **จดจำการเข้าระบบทันที** — ไม่มีหน้า Login กะพริบสำหรับผู้ใช้เก่า (Sync Auth Cache)

---

9. 🛡️ Global Persistent UI + Improved Session Persistence (2026-03-13)

9.1 การทำมาตรฐาน UI เดียวกันทั้งแอป (Unified Persistent UI)
- ปรับปรุง `index.html`, `messages.html`, `marketplace.html` และ `channel.html` ให้รองรับระบบนำทางเดียวกันจาก `persistent-ui.js/css`
- ลบโค้ด CSS และ HTML แถบนิ้วแบบเดิมที่ซ้ำซ้อนในแต่ละหน้าออก เพื่อลดโอกาสเกิด Bug สีเพี้ยน หรือตำแหน่งเลื่อน
- ใช้จุดเชื่อมต่อ `#persistent-ui-root` เป็นมาตรฐานเดียวกัน เพื่อให้การแก้ไขดีไซน์ในอนาคตทำได้ที่จุดเดียว

9.2 ระบบจดจำโปรไฟล์แบบรวดเร็ว (Instant Session Persistence)
- แก้ไขปัญหา "หน้า Login กะพริบ" (Flicker) ในหน้า `messages.html` โดยการซ่อน UI ทั้งหมดไว้ก่อนแล้วเช็ค `localStorage` ทันทีแบบ Synchronous
- ตรวจสอบเซสชันครอบคลุมทุก Key: `wizmobiz_session`, `tuktuk_line_session`, `tuktuk_session` และ `user_data`
- ทำให้ผู้ใช้ที่เคยเข้าสู่ระบบจากหน้าใดก็ตามในเครือข่าย TukTuk สามารถเข้าหน้าแชทได้ทันทีโดยไม่ต้องรอโหลด Firebase

9.3 การดึงรูปโปรไฟล์แบบหลายช่องทาง (Multi-source Profile Image)
- ปรับปรุง `PersistentUI.updateProfileImage()` ให้ค้นหารูปโปรไฟล์จากทุกแหล่งข้อมูลที่มีในเครื่อง (Google Auth, LINE Auth, หรือ Manual Profile)
- รับประกันว่ารูปโปรไฟล์ในแถบนำทางด้านล่างจะแสดงผลถูกต้องเสมอไม่ว่าผู้ใช้จะเข้าระบบด้วยวิธีใด
ดำเนินการปรับปรุงหน้าตาเมนูส่วนบน (Mobile Header) 
โครงสร้างหน้าหลัก (

index.html
) ของ TukTuk Web ในเวอร์ชันปัจจุบันได้ถูกออกแบบให้รองรับทั้ง Mobile (สไตล์แอป) และ PC (สไตล์ Social Media) โดยมีฟีเจอร์หลักๆ ที่คุณสามารถเช็คได้ดังนี้ครับ:

1. ระบบวิดีโอฟีด (TukTuk Feed Engine)
Vertical Scrolling Feed: การเลื่อนวิดีโอแนวตั้ง (TikTok/Reels Style) ในคอนเทนเนอร์ #tuktukFeed
Smart Autoplay: วิดีโอเล่นอัตโนมัติเมื่อเลื่อนมาถึงหน้าจอ (IntersectionObserver ≥ 50%) และหยุดคลิปอื่นในพื้นหลังทันที
Preloading System: โหลดวิดีโอล่วงหน้า ±1 คลิป เพื่อความลื่นไหล
Product Card Timer: สไลด์สินค้าที่มีแถบ Progress Bar วิ่ง 8 วินาทีแล้วเลื่อนไปคลิปถัดไปอัตโนมัติ
Like/Follow System: ระบบกดหัวใจและติดตามแบบ Optimistic (แสดงผลทันทีและมีระบบ Rollback ถ้าบันทึกไม่สำเร็จ)
2. ส่วนหัวและเมนูนำทาง (Navigation & Header)
Mobile Header V4:
Tabs (ดูเพลิน, ใกล้ฉัน, อาชีพ): สลับหมวดหมู่คอนเทนต์โดยไม่โหลดหน้าใหม่
Auto-Scroll (ปุ่มสายฟ้า): เปิด/ปิดโหมดเลื่อนขึ้นอัตโนมัติเมื่อวิดีโอจบ
Unified Search: ปุ่มค้นหาที่รวมผลลัพธ์ทุกประเภท
Floating Control Pill: แถบควบคุมขนาดจิ๋วที่แสดงจำนวนการแจ้งเตือนและปุ่มเปิด/ปิดเสียง (Mute/Unmute)
Side Drawer (Mobile Menu): เมนูบาร์ด้านข้างสำหรับเข้าถึงส่วนอื่นๆ เช่น การตั้งค่า, ศูนย์ช่วยเหลือ, หรือจัดการร้านค้า
3. ระบบจัดการและแจ้งเตือน (Hub & Modals)
Unified Hub Panel: หน้าต่างรวมการแจ้งเตือน (Notifications) และข้อความด่วน (Mini-Chat) ในจุดเดียว
Persistent UI (Bottom Nav): แถบเมนูด้านล่าง 5 ปุ่ม (หน้าหลัก, แชท, ปุ่มสร้างสรรค์, ตลาด, โปรไฟล์) ที่ติดอยู่ทุกหน้า
Creation Hub (ปุ่มกลาง): เมนูทางลัดสำหรับ สร้างโพสต์, ลงคลิปวิดีโอ, ไลฟ์สด หรือลงขายสินค้า
4. ส่วนเสริมและประสิทธิภาพ (Aesthetics & UX)
Premium Splash & Launch Hub: หน้าจอโหลดเข้าแอปที่นุ่มนวลและแสดงสถานะการเตรียมระบบ
Promotion Slider: รายการแบนเนอร์โปรโมชั่นที่ด้านบนของฟีด
Pull to Refresh: ระบบดึงหน้าจอเพื่อรีเฟรชข้อมูลใหม่
PC Layout: ดีไซน์สำหรับการใช้งานบนคอมพิวเตอร์ที่มี Sidebar ซ้าย-ขวา และ Top Navbar แบบ Facebook
ลดขนาดปุ่มสายฟ้า (Auto-Scroll): ปรับลดขนาดปุ่มสายฟ้าและปุ่มค้นหาจาก 44px เหลือ 38px พร้อมทั้งลดขนาดไอคอนและรัศมีขอบให้ดูสมดุลและกะทัดรัดขึ้นครับ
กระชับพื้นที่ Glassmorphism:
ลดค่า padding-bottom ของแถบเมนูลงอย่างมาก (จาก 25px เหลือ 8px)
ลดระยะห่างระหว่างแถว (Gap) จาก 12px เหลือ 8px
ผลลัพธ์: พื้นที่โปร่งแสงที่ใช้เอฟเฟกต์เบลอ (Backdrop Blur) จะแคบลงและชิดกับตัวปุ่มมากขึ้น
---
📝 สรุปสาระสำคัญในรอบนี้:
Mobile Header Refinement: ปรับลดขนาดปุ่มและกระชับพื้นที่ Glassmorphism เพื่อให้ส่วนบนของวิดีโอมีความคมชัดขึ้น ไม่ถูกเอฟเฟกต์เบลอมาบดบัง
Advanced Pull-to-Refresh:
เปลี่ยนมาใช้ไอคอน TukTuk (FontAwesome) สีฟ้านีออน แทนรูปภาพ
เพิ่มระบบ Orbital Line (เส้นวิ่งรอบคัน) และแอนิเมชัน Pulse ที่ตัวรถ
Haptic Feedback: ระบบจะสั่นตอบรับเบาๆ เมื่อดึงเพื่อรีเฟรช ให้ความรู้สึกที่พรีเมียมสไตล์ Native App
Clean UX: นำ Toast message "รีเฟรชสำเร็จ" ออก เพื่อให้หน้าจอสะอาดที่สุด และใช้แรงสั่นเป็นตัวบอกสถานะแทนครับ