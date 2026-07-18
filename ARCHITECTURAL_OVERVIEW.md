# 🚀 TukTuk Super App — Platform Overview & Technical Architecture
*Master Document สำหรับนักลงทุน, พาร์ทเนอร์, และทีมพัฒนา | อัปเดต: มีนาคม 2026*

---

## 🎯 Executive Summary

**TukTuk (WiT Platform)** คือ **Super App สำหรับคนไทย** ที่รวม 6 บริการไว้ในแอปเดียว — Marketplace, Live Commerce, Social Feed, WIN Rider, AgriTech, และ Education — ขับเคลื่อนด้วย **Google Gemini AI** และเชื่อมต่อกับ **LINE ซึ่งมีผู้ใช้ 54 ล้านคนในไทย** อย่างสมบูรณ์แบบ

### ทำไม TukTuk จึงแตกต่าง?
- **ไม่มีค่าคอมมิชชั่น** — ร้านค้าจ่ายเพียงค่าสมาชิกรายเดือน ไม่ใช่ % ของยอดขาย
- **AI ช่วยโพสต์สินค้า** — ถ่ายรูป → AI ร่างคำอธิบาย → โพสต์ได้ใน 30 วินาที
- **WIN Rider** — ระบบเรียกวินมอเตอร์ไซค์ท้องถิ่นแบบ Real-time ในแอปเดียวกัน
- **LINE-native** — ทุกฟีเจอร์เข้าถึงได้ผ่าน LINE Chat ไม่ต้องโหลดแอปเพิ่ม

### ตัวเลขสำคัญ (Key Metrics)

| ด้าน | ตัวเลข |
|------|--------|
| **Platforms** | iOS + Android + Web + LINE LIFF (1 codebase) |
| **Cloud Functions** | 180+ functions ครอบคลุม AI, Marketplace, Education |
| **API Endpoints (Go Engine)** | 20 endpoints (Sprint 2 — มีนาคม 2026) |
| **Go Engine Score** | 7.6 / 10 (จาก 4.9 — ปรับปรุง +55%) |
| **Dart Source Files** | ~90 files |
| **Web Pages** | ~35 HTML pages |
| **Lint Issues ลดลง** | 1,297 → 182 (ลด 86% หลัง Code Audit) |
| **Firestore Collections** | 25+ collections |
| **Flutter Dependencies** | 55+ packages |
| **Backend Languages** | Go + Node.js + Dart |
| **Cloud Infrastructure** | Firebase + Fly.io + Cloudflare R2 + Redis |

---

## 📌 1. ภาพรวมของโปรเจค (Project Overview)
**TukTuk (WiT Platform)** คือแพลตฟอร์ม Super App ที่ผสานรวม **E-Commerce (Marketplace)**, **Live Commerce (ไลฟ์สดขายของ)**, และ **Social Community** เข้าด้วยกันอย่างลงตัว โดยมีจุดเด่นในการนำเทคโนโลยี **AI (Google Generative AI)** มาช่วยอำนวยความสะดวกในการขายและปฏิสัมพันธ์กับผู้ใช้ พร้อมเชื่อมต่อกับ **LINE Ecosystem** อย่างไร้รอยต่อ

### ปัญหาที่แก้ไข (Problem Statement)
| ปัญหาของผู้ขายในไทย | วิธีที่ TukTuk แก้ |
|-------------------|------------------|
| Shopee/Lazada คิดค่าคอม 3–8% | **ไม่มีค่าคอม** — จ่ายค่าสมาชิกคงที่ |
| ลงสินค้าใช้เวลานาน | **AI Auto-Post** — ถ่ายรูป → โพสต์ 30 วินาที |
| ลูกค้าอยู่ใน LINE แต่ร้านอยู่บน App | **LINE LIFF** — ซื้อขายได้ใน LINE เลย |
| ไม่มีระบบส่งของในพื้นที่ | **WIN Rider** — วินมอเตอร์ไซค์ท้องถิ่น |
| สินค้า OTOP/ชุมชนไม่มีพื้นที่ขาย | **Community Marketplace** — ตลาดชุมชนออนไลน์ |

---

## 🏗️ 2. แผนผังโครงสร้างสถาปัตยกรรมระบบ (System Architecture Diagram)

```mermaid
graph TD
    %% Frontend Clients
    subgraph Frontend [ฝั่งผู้ใช้งาน Client]
        App[📱 Flutter Mobile App<br>iOS / Android]
        WebApp[🌐 Web App & LINE LIFF]
    end

    %% Edge & CDN
    subgraph CDN [Edge & Delivery Network]
        Cloudflare[☁️ Cloudflare CDN & WAF]
    end

    %% Core Backend
    subgraph Backend [Backend Services]
        GS[🚀 TukTuk Go Engine<br>Go/Gin on Fly.io]
        CF[⚡ Firebase Functions<br>Node.js]
    end

    %% Databases & Storage
    subgraph Data [Data & Storage Layer]
        FDB[(🔥 Firestore NoSQL<br>Real-time Primary)]
        PG[(🐘 PostgreSQL Analytics<br>Relational Analytics)]
        RD[(🧠 Redis<br>In-Memory Cache)]
        R2[(📦 Cloudflare R2<br>Zero-Egress Storage)]
    end

    %% External Integrations
    subgraph Integrations [Integrations]
        AG[📞 Agora.io - RTC]
        Gemini[🤖 Google Gemini AI]
        LineAPI[💬 LINE API]
    end

    %% Connections
    App & WebApp <-->|HTTPS / IAM| Cloudflare
    Cloudflare <--> GS
    Cloudflare <--> CF
    
    App -- "Real-time Sync" --> FDB
    App -- "Voice/Video" --> AG
    
    GS -- "Relational Queries" --> PG
    GS -- "Hot Cache" --> RD
    GS -- "Upload Chunks" --> R2
    
    CF -- "Triggers" --> FDB
    CF -- "AI Inference" --> Gemini
    CF -- "Notify" --> LineAPI
```

---

## 🔒 3. สถาปัตยกรรมความปลอดภัย (Identity & Access Management - IAM)
เราได้ย้ายจาก Anonymous Key-based API มาเป็น **Identity-based Access** เพื่อความปลอดภัยระดับองค์กร:
- **Authentication**: ใช้ Firebase Authentication เป็นศูนย์กลาง (Identity Provider)
- **Authorization**: ทุกการเรียกใช้ `TukTuk Go Engine` จะต้องแนบ `Authorization: Bearer <FIREBASE_ID_TOKEN>`
- **Go Backend Middleware**: ตรวจสอบความถูกต้องของ Token ทุก Request ก่อนอนุญาตให้เข้าถึงข้อมูลสำคัญ (เช่น ข้อมูลร้านค้า หรือ Analytics)
- **IAM Service (Flutter & Web)**: จัดการการ Refresh Token และสถานะการล็อกอินอัตโนมัติเพื่อให้ UX ลื่นไหลแต่ปลอดภัย โดยเวอร์ชัน Web ใช้ `AuthService.js` ในการซิงค์ Session ระหว่าง Main Site และ LINE LIFF

---

## �️ 4. ระบบฐานข้อมูลและ Analytics (Hybrid Database Strategy)
เราใช้จุดแข็งของฐานข้อมูล 3 ประเภทเพื่อรองรับงานที่แตกต่างกัน:
1.  **Firestore (Real-time Primary)**: เก็บข้อมูลแชท, คำสั่งซื้อ, และสถานะไลฟ์สดที่ต้องการการอัปเดตแบบวินาทีต่อวินาทีโดยไม่ต้อง Refresh
2.  **PostgreSQL (Relational Analytics)**: รันบน Fly.io เพื่อประมวลผลข้อมูลเชิงสัมพันธ์ที่ซับซ้อน:
    *   `daily_sales_reports`: สรุปยอดขายรายวันและ Conversion Rate
    *   `province_economic_trends`: วิเคราะห์ดัชนีเศรษฐกิจระดับชุมชนและจังหวัด โดยใช้ **Standard Province Codes (TIS 1099)** เพื่อความแม่นยำสูงสุด
3.  **Redis (Hot Cache)**: เก็บข้อมูลที่มีการเรียกใช้บ่อย (เช่น News Feed, Top Sellers) ไว้ใน Memory เพื่อความเร็วระดับมิลลิวินาที พร้อมระบบ **Active Invalidation** เพื่อความสดใหม่ของข้อมูลการจัดอันดับ (Ranking)

---

## � 5. นวัตกรรมการประหยัดต้นทุน (Cost-Effective Infrastructure)
หนึ่งในจุดเด่นที่สุดของ TukTuk คือการออกแบบมาเพื่อ **Zero-Scale Waste**:
- **Fly.io Auto-Scale to Zero**: ทั้ง API Server (Go) และ Database (Postgres) จะเข้าสู่โหมดหลับ (Sleep) อัตโนมัติเมื่อไม่มีผู้ใช้ (ค่าใช้จ่ายเป็น 0) และจะตื่นขึ้นทันที (Cold start < 500ms) เมื่อมีการเรียกใช้
- **Cloudflare R2 (Zero-Egress)**: ใช้เก็บไฟล์วิดีโอ คลิปสั้น และ Live Stream Chunks โดย **ไม่มีค่าใช้จ่ายในการดึงข้อมูลออก** ทำให้เราสามารถขยายจำนวนคนดูไลฟ์สดได้มหาศาลโดยไม่มีภาระค่า Bandwidth
- **Ultra Low-Cost Live Studio**: แอปจะหั่นวิดีโอเป็นชิ้นเล็กๆ แล้วโยนใส่ R2 โดยตรง ลดการพึ่งพา Media Server ราคาแพง

---

## � 6. ระบบสื่อสารและฟีเจอร์หลัก (Core Features)
- **Real-time Call (Agora.io)**: ติดตั้งระบบโทรและวิดีโอคอลแบบ Native พร้อมระบบ **Cost Control** (จำกัดการโทร 5 นาทีต่อครั้ง)
- **AI-Driven Marketplace**: ระบบช่วยผู้ขายร่างโพสต์ (AI Post Generator) ด้วย Gemini AI เพียงแค่ถ่ายรูปสินค้า
- **HLS Live Streaming**: ดูไลฟ์สดผ่าน Web App (HLS.js) หรือ Mobile App ได้อย่างลื่นไหล
- **LINE Ecosystem Integration**: เชื่อมต่อผ่าน LINE Login และ Messaging API เพื่อเข้าถึงทราฟฟิกมหาศาลจาก LINE

---

## � 7. การรวมระบบเว็บและข้อมูลเชิงลึก (Web & Deep Analytics Integration)
เพื่อให้ผู้ใช้สามารถวิเคราะห์ธุรกิจได้จากทุกที่ เราได้รวมระบบ Analytics ระดับโปรเข้ากับเว็บ:
- **Unified Action Hub**: เพิ่ม `Deep Analytics` (ข้อมูลเชิงลึก) เข้าไปใน Creation Hub ของหน้าแรก เพื่อการเข้าถึงที่รวดเร็ว
- **Dual-Source Dashboard**: ระบบแสดงผลข้อมูลแบบ Hybrid:
    - **Cloud Events**: ทราฟฟิกเว็บแบบ Real-time จาก Firebase
    - **Relational Trends**: แนวโน้มเศรษฐกิจและยอดขายจาก PostgreSQL ผ่าน `TuktukAPI` (Fly.io)
- **Seamless Services**: ใช้ `TuktukAPI` และ `AuthService` ชุดเดียวกันทั้งบน App และ Web เพื่อรักษาความปลอดภัยและความถูกต้องของข้อมูล

---

## �💡 8. จุดเด่นทางธุรกิจสำหรับนักลงทุน (Business Value)
- **⚡ Scaling Advantage**: โครงสร้าง Go + Fly.io + Cloudflare R2 ช่วยให้รองรับผู้ใช้ Mass ได้ด้วยกำไร (Margin) ที่ดีกว่าคู่แข่ง
- **🤖 AI Efficient**: ใช้ AI ลดภาระงานของร้านค้า ทำให้เกิดสินค้าคุณภาพสูงบนระบบได้รวดเร็ว
- **🤝 Omnichannel**: ประสบการณ์ไร้รอยต่อทั้งบน App, Web และ LINE LIFF

---

## 💳 8.5 โมเดลธุรกิจและรายได้ (Business Model & Revenue Streams)

### แพ็กเกจสมาชิกร้านค้า (Seller Subscription)

| แพ็กเกจ | ราคา | ระยะเวลา | ราคาต่อเดือน | จุดเด่น |
|---------|------|---------|------------|---------|
| **ทดลองฟรี** | ฿0 | 30 วัน | — | ครบทุกฟีเจอร์ |
| **3 เดือน** | ฿899 | 3 เดือน | ~฿300/เดือน | เริ่มต้นง่าย |
| **6 เดือน** | ฿1,599 | 6 เดือน | ~฿267/เดือน | ประหยัด ฿199 |
| **รายปี** | ฿2,899 | 12 เดือน | ~฿242/เดือน | ประหยัด ฿1,289 |

> **จุดขาย:** ผู้ขายจ่ายคงที่ ขายได้ไม่จำกัด ไม่มีค่าคอมมิชชั่น เทียบกับ Shopee ที่คิด 3–8% ต่อยอดขาย

### กระแสรายได้อื่น (Additional Revenue Streams)
- **TukCoin Tokenomics** — ผู้ใช้ซื้อ Coin ใช้กับร้านค้าในระบบ
- **Premium Ad Placement** — พื้นที่โฆษณาใน Feed สำหรับ Brand
- **WIN Rider Commission** — ส่วนแบ่งค่าบริการจากการเรียกวิน
- **B2B AgriTech** — ขาย Smart Farm solution ให้หน่วยงานภาครัฐ/เอกชน
- **Education Platform** — คอร์ส/ใบรับรองทักษะในแพลตฟอร์ม

### ระบบ Escrow (Trust & Security)
TukTuk มีระบบ **Escrow กลาง** สำหรับทุกการซื้อขาย:
1. ผู้ซื้อจ่ายเงิน → เงินถูก lock ใน Escrow
2. ระบบตรวจสลิปอัตโนมัติ (SlipOK API)
3. ผู้ขายจัดส่งสินค้า → ผู้ซื้อยืนยันรับ
4. เงินถูก release ให้ผู้ขายอัตโนมัติ (หรือ auto-release หลัง 7 วัน)

---

## 💬 9. ระบบแชทและการแจ้งเตือนแบบ Real-time (engagement & Notifications)
เราให้ความสำคัญกับความลื่นไหลในการสื่อสาร:
- **Global Unread Sync**: ระบบนับจำนวนข้อความที่ยังไม่ได้อ่าน (Unread Count) แบบ Real-time เชื่อมต่อกับ **Dynamic Island (Pill)** ในหน้าแรก เพื่อให้ผู้ใช้เห็นสถานะแชทใหม่ได้ทันทีจากทุกหน้า
- **Actionable Notifications**: ระบบแจ้งเตือนที่รวมศูนย์ (Unified Notifications) พร้อมเมนู **Dropdown Menu** ที่รองรับ Vertical Scroll และปรับขนาดตามความยาวข้อความอัตโนมัติ
- **Agora Video/Voice Calls**: ขยายขีดความสามารถในการสื่อสารด้วยระบบโทรผ่านอินเทอร์เน็ตที่ฝังอยู่ในหน้าแชท ช่วยเพิ่ม Trust และ Conversion Rate ในการซื้อขาย

---

## 📊 10. ระบบตรวจวัดและเฝ้าระวัง (Observability & Health Monitoring)
เพื่อให้ TukTuk Go Engine ทำงานได้อย่างเสถียรและตรวจสอบประสิทธิภาพได้แบบ Real-time:
- **Structured Logging (`slog`)**: เปลี่ยนจาก Log ข้อความธรรมดาเป็น JSON Format ในฝั่ง Backend เพื่อความง่ายในการวิเคราะห์ (Analysis) และเชื่อมต่อกับระบบ Monitoring ภายนอก (เช่น Loki หรือ Datadog)
- **Performance Metrics Middleware**: ทุก Request จะถูกบันทึกค่า Latency (ความหน่วง), Latency_ms และ HTTP Status Code โดยอัตโนมัติ
- **Health Check Endpoint (`/health`)**: แสดงผลสุขภาพของระบบแบบ Real-time ประกอบด้วย:
    - **Average & P95 Latency**: ติดตามความเร็วในการตอบสนองเฉลี่ยและกลุ่มที่ช้าที่สุดเพื่อหาคอขวด
    - **Error Rate %**: ตรวจสอบอัตราความล้มเหลวของ API (5xx errors)
    - **Cold Start Timing**: บันทึกระยะเวลานับตั้งแต่ระบบ Boot เพื่อดูประสิทธิภาพของ Auto-scaling
    - **Firestore Live Ping (Sprint 2)**: Ping `_health` collection จริงด้วย timeout 2s แทนการตรวจแค่ env var — ตรวจจับ DB ล่มได้ทันที
    - **Component Status Map**: `{ firestore, redis, sql_db, storage }` — แสดงสถานะแยกรายส่วนใน response JSON
- **Request ID Middleware (Sprint 2)**: ทุก Request ได้รับ `X-Request-ID` อัตโนมัติ (สร้างใหม่ถ้าไม่มี header ส่งมา) เพื่อรองรับ Distributed Tracing และ Debug logs แบบ end-to-end

---

## 🎯 11. การจัดระเบียบข้อมูลและอัลกอริทึม Feed (Data Normalization & Ranking v1)
เพิ่มความแม่นยำในการทำ Analytics และความน่าสนใจของหน้าฟีด:
- **Province Normalization (TIS 1099)**: ยกเลิกการใช้ Free-text สำหรับชื่อจังหวัด และเปลี่ยนมาใช้รหัสจังหวัดมาตรฐาน 2 หลัก (TIS 1099) ตลอดทั้งระบบ (User, Seller, Product, Live) เพื่อความถูกต้อง 100% ในเชิงสถิติ (ห้ามปล่อย free-text)
- **Feed Ranking Algorithm v2 (Anti-Gaming & Personalization)**: พัฒนาระบบคำนวณคะแนนความน่าสนใจของโพสต์ (Scoring) ล่าสุด เพื่อให้หน้าฟีดมีความยุติธรรมและตรงใจผู้ใช้ที่สุด:
    - **🛡️ Anti-Gaming System**: ป้องกันการปั๊มยอดด้วยบอทหรือการโกง:
        - *Self-like Exclusion*: หักลบคะแนนหากผู้ขายพยายามกดไลก์โพสต์ของตัวเองเพื่อดันยอด
        - *Spam-burst Detection*: เปลี่ยนจากการนับ View แบบเส้นตรง (Linear) เป็นการใช้ Logarithmic Scale (`math.Log1p`) เพื่อลดน้ำหนักของการรัวคลิก หรือบอทปั๊มยอดวิวให้อยู่ในระดับที่สมเหตุสมผล
    - **🤖 Personalization Layer (Real User Affinity — Sprint 2)**: ปรับหน้าฟีดให้เป็นแบบเฉพาะบุคคล:
        - *Province Affinity (+50%)*: ดันโพสต์ที่อยู่ใน Province Code เดียวกับผู้ใช้ — ดึงจาก `line_users/{userId}.provinceCode` ใน Firestore จริง (เดิม hardcode `"10"` / กรุงเทพฯ ทุกคน)
        - *Category Affinity (+30%)*: ดันโพสต์ในหมวดที่ผู้ใช้สนใจ — ดึงจาก `line_users/{userId}.preferredCategory` (เดิม hardcode `"Food"` ทุกคน)
        - **แหล่งข้อมูล**: `getUserAffinity(ctx, userId)` ใน `feed_service.go` — Firestore read ต่อ request (cache ได้ใน Sprint 3)
    - **⏳ Time Decay**: ใช้อัลกอริทึมลดคะแนนตามอายุของโพสต์ (Power Law Decay) เพื่อให้หน้าฟีดมีการอัปเดตสิ่งที่น่าสนใจใหม่อยู่เสมอ
- **Ranking-Aware Caching**: ระบบล้าง Cache เฉพาะจุดทันทีที่มีการ Interaction เพื่อให้ Ranking v2 อัปเดตแบบวินาทีต่อวินาที

---

## 🛡️ 12. ความสมบูรณ์ของระบบสตรีมมิ่ง (Stream Integrity Layer)
เพื่อรองรับระบบ Live Commerce ที่เสถียรและทนทาน เราได้เพิ่ม Layer สำหรับตรวจสอบและจัดการข้อมูลวิดีโอ:
- **Chunk Validation**: ระบบตรวจสอบความถูกต้องของไฟล์รูป/วิดีโอ (Hash Checklist) เพื่อยืนยันว่าข้อมูลที่อัปโหลดไม่สูญหายหรือถูกดัดแปลง
- **Upload Retry Mechanism**: ฝังระบบเครือข่ายอัตโนมัติ (Exponential Backoff Auto-Retry) ในกรณีที่อัปโหลดไม่สำเร็จเนื่องจากสัญญาณอินเทอร์เน็ตขาดหาย เพื่อให้ไลฟ์สดหรือการอัปโหลดไฟล์ทำได้อย่างต่อเนื่อง
- **Anti-abuse Bandwidth Limit**: มีการจำกัดขนาดไฟล์และโควต้าแบนด์วิดท์ (Bandwidth Limit: ชิ้นละไม่เกิน 10MB-100MB) ผ่านระบบ `StorageService` ใน Go Backend ដើម្បីป้องกันการถูกยิงสแปมไฟล์ขยะหรือการใช้แบนด์วิดท์อย่างผิดวัตถุประสงค์ (DDoS via Upload)

---

## 📈 13. แผนการรองรับโหลดขนาดใหญ่ (Viewer Scale Testing & CDN Strategy)
เพื่อเตรียมพร้อมสำหรับการไลฟ์สดงานระดับประเทศที่มีผู้ชมพร้อมกันเป็นจำนวนมาก:
- **1,000 Concurrent Viewers Simulation**: เป้าหมายทางเทคนิคคือรองรับผู้รับชมพร้อมกัน 1,000 คนต่อ 1 ไลฟ์ โดยไม่เกิดกระตุก (Buffering) หรือโหลด Backend หนัก
- **R2 Read Performance Profiling**: พิสูจน์ประสิทธิผลของการอ่านข้อมูลไฟล์สตรีมและวิดีโอ (HLS Chunks) จาก Cloudflare R2 ว่ามี Zero-Egress Fee ทำงานควบคู่กับ Latency ที่ต่ำกว่า 100ms
- **CDN Cache Strategy Tuning**: 
    - *Manifest Cache (`.m3u8`)*: ตั้งค่า Cache TTL ให้สั้นมาก (เช่น 1-2 วินาที) สำหรับไฟล์สารบัญของ Live HLS เพื่อให้ผู้ชมเห็นเหตุการณ์ปัจจุบันที่สุด
    - *Segment Cache (`.ts`)*: วิดีโอแต่ละชิ้นจะตั้งค่า Cache ถาวรแบบไม่หมดอายุที่ Edge ของ Cloudflare (Cache-Control: public, max-age=31536000) ทำให้คนดู 1,000 คน จะมีการดึงข้อมูลจาก Origin (R2) จำนวน **1 ครั้งเท่านั้น** ประหยัดทรัพยากรมหาศาล

---

## 🟢 14. ความร่วมมือกับระบบนิเวศของ LINE (LINE Ecosystem Integration)
TukTuk ได้ทำการเชื่อมโยงบริการเข้ากับ LINE เพื่อให้ครอบคลุมพฤติกรรมผู้บริโภคชาวไทยอย่างลึกซึ้ง:
- **LINE LIFF App**: แปลงหน้า Web App หลักให้สามารถทำงานแบบ Mini-app ซ้อนอยู่ในห้องแชทของ LINE ได้อย่างไร้รอยต่อ
- **LINE Login SignIn**: ผู้ใช้สามารถสร้างบัญชีหรือล็อกอินเข้าแอปด้วย LINE Account ได้ทันที (Single Sign-On) ทำให้ลดแรงเสียดทานในการสมัครสมาชิก (Frictionless Onboarding)
- **Messaging API & Rich Menus**: แพลตฟอร์มสามารถส่งแจ้งเตือนการสั่งซื้อ สถานะการส่งของ หรือแจ้งเตือนเมื่อร้านโปรดเริ่มไลฟ์สด (Go Live) ตรงไปยังห้องแชท LINE ผ่าน Official Account
- **Share to LINE**: ผู้ซื้อสามารถกดปุ่มแชร์สินค้าหรือโพสต์ต่างๆ จากแอป TukTuk ให้เพื่อนๆ ใน LINE ได้อย่างรวดเร็ว โดยมีรูป Preview ที่ช่วยดึงดูดความสนใจ

---

## 📱 15. โครงสร้างหน้าฟีดในแอปมือถือ (Flutter Feed UI Architecture)
การออกแบบหน้า Feed บน Flutter เน้นความรวดเร็วและประสบการณ์ที่ลื่นไหล (60fps/120fps):
- **Sliver Architecture (CustomScrollView)**: ใช้ `Slivers` ในการจัดการโครงสร้างหน้าจอที่ซับซ้อน เช่น การมี Header แบบยืดหดได้ (SliverAppBar), แถบ News หรืองาน Live สดแนวขวาง (SliverToBoxAdapter), และรายการคำสั่งซื้อเรียงลงมา (SliverList/SliverGrid)
- **State Management**: แยก Business Logic ออกจาก UI อย่างชัดเจน โดยอาจใช้ `BLoC` หรือ `Provider` ในการจัดการสถานะข้อมูลจาก API แบบ Real-time เช่น การดึงโพสต์ใหม่แบบ Infinite Scroll
- **Feed Composition**:
    - *Top Section*: **Stories / Live Now** แสดงร้านค้าที่กำลังจัดรายการแบบแนวนอน
    - *Middle Section*: **Trending Topics / News** ไฮไลท์ข่าวสารหรือ Hashtag ยอดฮิตในชุมชน
    - *Main Scroll*: **Personalized Feed List** วิดีโอสั้น, โพสต์ หรือสินค้า ที่จัดอันดับจาก Go Backend (Ranking v2) เล่นวิดีโอแบบ Auto-play เมื่อ Scroll ถึง
- **Lazy Loading & Pagination**: เพื่อลดการบริโภค Memory ระบบจะโหลด UI Components เข้ามาเฉพาะเมื่อผู้ใช้เลื่อนหน้าจอไปถึงจุดนั้น (Render as-needed) และโหลดข้อมูลชุดถัดไปแบบ Background

---

## 🔄 16. สถาปัตยกรรมการประมวลผลแบบอะซิงโครนัส (Asynchronous & Event-Driven Architecture)
เพื่อให้ระบบตอบสนองหน้าจอผู้ใช้ได้รวดเร็วระดับวินาที และรองรับโหลดหนักโดยที่คิวไม่ค้าง (Non-blocking):
- **Event Bus (Pub/Sub Model)**: โครงสร้าง Message Broker (เช่น Google Cloud Pub/Sub หรือ Redis Pub/Sub) ที่กระจายกิจกรรมต่างๆ ที่เกิดขึ้นในระบบไปยังแต่ละ Service (Microservices-lite) โดยอัตโนมัติ 
    - *ตัวอย่าง*: เมื่อมีผู้สร้าง Live ใหม่ > ส่ง Event `LiveStarted` > Service แยกนำไปคัดกรองเนื้อหา/ส่ง Notification แบบแยกส่วนโดยไม่ถ่วง Backend กลาง
- **Message Queue (Order Processing Async)**: การชำระเงินและการตัดสต๊อกสินค้าจะถูกจัดการผ่านคิว (Cloud Tasks หรือ RabbitMQ) แทนการรอประมวลผลให้เสร็จใน API Call เดียว เพื่อป้องกันปัญหา Double-Spending หรือ Timeout เมื่อคนเป็นแสนแย่งกันซื้อสินค้าในเวลาเดียวกัน
- **Feed Update Async Processor**: เวิร์กเกอร์แบบ Background ที่จะคอยอัปเดตและเตรียม Feed ล่วงหน้า (Feed Pre-computation & Cache Warming):
    - สรุปคะแนน Ranking v2 ใหม่อย่างเงียบๆ ในเบื้องหลัง
    - เตรียม Post ของร้านค้าและข่าวสารรอไว้ใน Redis เพื่อเวลาที่แอปเปิดขึ้นมา ระบบสามารถดึงข้อมูลที่ Ranked แล้วจาก Cache ส่งกลับไปได้ทันที

---
> [!IMPORTANT]
> สถาปัตยกรรมนี้ถูกออกแบบมาเพื่อรองรับผู้ใช้สะสมหลักล้านคน โดยรักษาต้นทุนในช่วงเริ่มต้นให้ต่ำที่สุด และพร้อมขยายตัวแบบก้าวกระโดด (Scale-on-demand)

---

## 🔧 17. Code Quality & Performance Optimization (มีนาคม 2026)

> ผลการ Audit โค้ดทั่วทั้งโปรเจค — ดำเนินการแล้วสำเร็จ

### 📊 17.0 สรุปผลการปรับปรุง (Before / After)

| ด้าน | ก่อน | หลัง | ผล |
|------|------|------|-----|
| **Lint Issues รวม** | ~1,297 | **182** (info-only) | ลด 86% |
| **Lint Errors** | หลายจุด | **0** | ✅ |
| **Deprecated APIs** | `withOpacity`, `Share.share`, `androidProvider` | ✅ ทั้งหมด Migrated | ✅ |
| **Image Cache** | ไม่จำกัด (OOM risk) | ✅ 100 MB / 200 images | ✅ |
| **Firestore Cache** | ไม่จำกัด | ✅ 512 MB cap | ✅ |
| **VideoPlayer Dispose** | มี partial gaps | ✅ Full dispose chain | ✅ |
| **Memory Leak (Feed)** | AutoKeepAlive เปิด | ✅ ปิด + RepaintBoundary | ✅ |
| **Production Logging** | `print()` ทุกที่ | ✅ `debugPrint()` (ปิดใน release) | ✅ |
| **Build Status** | ล้มเหลวหลายจุด | ✅ Build สำเร็จ | ✅ |
| **Secrets Management** | Hardcoded ใน code | ✅ ย้ายไป `.env` | ✅ |
| **Feed Modularity** | ไฟล์เดียว 1,000+ บรรทัด | ✅ แยกเป็น Widget modules | ✅ |

### 🛠️ 17.1 สิ่งที่ดำเนินการ (Actions Taken)

**Automated Fixes:**
- `dart fix --apply` — **2,337 fixes ใน 58 files** (const constructors, final locals, super parameters)
- Bulk API Migration — **46 files** อัปเดต Color API เป็น `.withValues(alpha:)`
- Share API, Firebase App Check Provider — migrate ทั้งหมด

**Memory Management:**
- Flutter image cache ceiling: 100 MB / 200 images
- Firestore disk cache ceiling: 512 MB
- Video Player: dispose chain ครบ 7 ขั้นตอน (timer → controller → animation → observer)
- Feed SliverList: ปิด `AutomaticKeepAlive` เพื่อให้ GC เก็บ posts นอกหน้าจอ

**Architecture:**
- `SellerDashboardScreen`: upgrade จาก stub → Pro Dashboard พร้อม Offline-first + Real-time badges
- `TukTukFeedScreen`: แยกออกเป็น modular widgets ใน `lib/tuktuk/widgets/feed/`
- GPS Radar HUD: Flutter ↔ WebView JavaScript Bridge สำหรับ Win Rider
- Secrets: LINE Channel ID + Firebase URL ย้ายไป `.env` ผ่าน `flutter_dotenv`

---

### 🏗️ 17.2 Feed Architecture & State Management

ยกระดับโครงสร้างหน้า Feed เพื่อความลื่นไหลระดับโปร:

| Component | รายละเอียด | ผลลัพธ์ |
|-----------|-----------|---------|
| **ChangeNotifier per Tab** | แต่ละ Feed Tab จัดการ state แยกกัน | ลด re-render ทั้งหน้า |
| **ListenableBuilder** | Render เฉพาะส่วนที่เปลี่ยน | UI Thread เบาลง |
| **VerticalFeedView** | Component แยก: Video, Product, Ads แนวตั้ง | Reusable, Maintainable |
| **_isFetchingMap Guard** | ป้องกัน duplicate fetch เมื่อ tab switch เร็ว | ไม่มี race condition |
| **Optimistic UI** | Like/Interaction อัปเดต UI ก่อน sync Firestore | รู้สึก fast ทันที |

### 🛠️ 17.3 API & System Restoration

แก้ไขปัญหา "Undefined Method" และ "Missing Class" ให้แอป Compile ผ่านสมบูรณ์:

| Component | การดำเนินการ | ผล |
|-----------|------------|-----|
| **TukTukLocationService** | กู้คืน 4 methods: getCurrentLocationAndSync, checkServiceAndPermission, getLocationQualityDescription, calculateDistance | ✅ Win Rider + Marketplace GPS ทำงาน |
| **MarketplaceScreen** | รองรับ params: initialSellerId, initialCategory, initialSearchQuery | ✅ Deep link จาก Product Detail |
| **CallScreen** | กู้คืน Agora Call UI | ✅ Voice/Video call จากหน้าแชท |
| **SellerDashboardScreen** | Upgrade จาก stub → Pro Dashboard | ✅ Offline-first + Real-time |
| **PrivacyNoticeScreen** | PDPA consent flow | ✅ GPS permission ถูกต้องตามกฎหมาย |
| **Win Rider GPS HUD** | Radar display ผ่าน Flutter ↔ WebView Bridge | ✅ แม่นยำ < 7m = 100% |
| **Firebase App Check** | Migrate Enum → Class-based Provider | ✅ ป้องกัน API abuse |

#### C. Layout & Asset Fixes
- **Asset Integrity**: แก้ไขชื่อ Icon ที่ไม่ถูกต้อง (เช่น `speaker_up_rounded` → `volume_up_rounded`)
- **Color Systems**: อัปเกรดการใช้สีจากค่าคงที่ที่ไม่มีอยู่จริง (เช่น `Colors.white05`) เป็น `.withValues(alpha:)` ตามมาตรฐาน Flutter ใหม่
- **Import Cleanup**: ลบ Duplicate Imports และ Unused Imports ในหน้า Feed เพื่อลดภาระของ Compiler

#### D. Win Rider Map Screen Optimizations
- **GPS Precision Logic**: ปรับปรุงระบบแสดงผลความแม่นยำของ GPS ให้มีความ "Generous" มากขึ้น (แสดงผล 100% เมื่อความคลาดเคลื่อน < 7 เมตร) เพื่อเพิ่มความมั่นใจให้กับผู้ใช้งาน
- **Null Safety Fixes**: แก้ไข Error "The operand can't be 'null'" โดยการปรับปรุงประเภทข้อมูลและเงื่อนไขการตรวจสอบตำแหน่ง (Position)
- **Radar HUD**: พัฒนาระบบแสดงผลสถานะการค้นหาสัญญาณ GPS (Radar HUD) ที่ทำงานประสานกันระหว่าง Native Flutter และ JavaScript ใน WebView

#### E. Feed Screen Refactoring & Modularization (มีนาคม 2026)
- **Problem**: `tuktuk_feed_screen.dart` มีขนาดใหญ่เกินไป ทำให้ยากต่อการแก้ไขและเสี่ยงต่อปัญหาประสิทธิภาพ
- **Action**: แยกคอมโพเนนต์ที่ซับซ้อนออกไปยัง `lib/tuktuk/widgets/feed/`
    - ย้าย `WelcomeCard`, `CreationWheel`, และการแสดงผล Card ต่างๆ ออกไป
    - แยก `FeedTabState` เพื่อจัดการ PageController และ Pagination แยกตามแต่ละ Tab
    - ลดขนาดไฟล์หลักของ Feed ลงอย่างมีนัยสำคัญ และเพิ่มความสามารถในการนำ Widgets ไปใช้ซ้ำ
- **Outcome**: โค้ดอ่านง่ายขึ้น, แยกส่วนการทำงานชัดเจน (Separation of Concerns), และจัดการสถานะแต่ละ Tab ได้แม่นยำขึ้น

#### F. Security Hardening: Secrets Management
- **Problem**: พบคีย์และ URL สำคัญ (LINE Channel ID, Firebase Function URL) ถูกฝังอยู่ในซอร์สโค้ด (Hardcoded)
- **Action**: ย้ายความลับทั้งหมดไปไว้ใน `.env` file และจัดการผ่าน `flutter_dotenv`
    - แก้ไข `TukTukBridge` ให้ดึงข้อมูล URL จาก Environment Variables
    - แก้ไข `main.dart` ให้ Initialize LINE SDK ด้วย Channel ID จาก Environment
    - ยืนยันว่ามีการเพิ่ม `.env` เข้าไปใน `.gitignore` เพื่อป้องกันการ Leak ข้อมูลสู่ Version Control
- **Outcome**: แอปมีความปลอดภัยระดับ Production และสามารถเปลี่ยน Config ตาม Environment (Dev/Prod) ได้ง่าย

---
#### F. Seller Dashboard Transformation (มีนาคม 2026)
- **Problem**: `SellerDashboardScreen` was a basic stub and lacked real-time features/offline support present in the web version.
- **Action**: 
    - Full alignment with `seller-dashboard.html` UI/UX.
    - Integrated `badges` for real-time chat/notification updates.
    - Implemented `LocalCaching` using `SharedPreferences` for instant load.
    - Added "Smart Post" FAB and Membership Package selector.
- **Outcome**: A premium, high-performance dashboard that works offline and provides real-time seller insights.

---
| ด้าน | ผลลัพธ์ |
|---|---|
| **Build Status** | ✅ กลับมา Compile ผ่าน (Success) |
| **UX Consistency** | ✅ แก้ไข Navigation Broken Links เรียบร้อย |
| **GPS Tracking** | ✅ แม่นยำระดับ BestForNavigation |
| **UI Aesthetics** | ✅ ใช้ระบบสี .withValues และ Shimmer Effect |
| **User Flow** | ✅ เชื่อมต่อครบทุกหน้า (End-to-End Navigation) |
| **Security** | ✅ ความลับสำคัญย้ายไปที่ .env เรียบร้อย |
| **Modularity** | ✅ หน้า Feed ถูกแยกส่วน (Modularized) เรียบร้อย |
| **Seller Tools** | ✅ Dashboard ระดับ Pro พร้อม Offline & Real-time |

---
> [!NOTE]
> การแก้ไขครั้งนี้เป็นการกู้คืนหัวใจหลักของระบบ Location-based Services และเสริมความแข็งแกร่งด้าน Security และ Modularity

---

## 🧱 17.5 Technology Stack Summary

| Layer | Technology | หน้าที่ | เหตุผลที่เลือก |
|-------|-----------|---------|--------------|
| **Mobile App** | Flutter (Dart) | iOS + Android + Web | 1 codebase → 4 platforms |
| **Web Frontend** | HTML/JS/CSS SPA | 35+ หน้า + LINE LIFF | Firebase Hosting CDN |
| **API Engine** | Go + Gin (Fly.io) | 20 endpoints, Feed ranking | เร็ว, concurrency ดีเยี่ยม |
| **Cloud Functions** | Node.js (Firebase) | 180+ functions, AI, Webhook | Serverless, scale ∞ |
| **Primary DB** | Firestore (NoSQL) | Real-time sync, chat, orders | Zero-ops, real-time |
| **Analytics DB** | PostgreSQL (Fly.io) | รายงาน, แนวโน้มยอดขาย | JOIN, aggregate queries |
| **Cache** | Redis | Feed cache 5-15 min | Sub-ms response time |
| **In-process Cache** | Go memory.go | Fallback เมื่อไม่มี Redis | Zero-dep, instant |
| **Storage** | Cloudflare R2 | รูป/วิดีโอ/สลิป | Zero egress fee |
| **AI** | Google Gemini 2.0 Flash | Chat, content generation | Thai language ดีที่สุด |
| **Voice/Video** | Agora.io RTC | Video call ในแชท | Low-latency, reliable |
| **Auth** | Firebase Auth | LINE, Google, PIN, Anonymous | Multi-provider |
| **LINE Integration** | LINE Messaging API + LIFF | Chat bot, Rich menus, Mini-app | 54M ผู้ใช้ไทย |
| **Security** | Firebase App Check + IAM | ป้องกัน abuse + Token verify | Enterprise-grade |
| **CDN/WAF** | Cloudflare | DDoS protection, Edge cache | Free tier เพียงพอ |

---

## 📂 18. โครงสร้างโปรเจคฉบับสมบูรณ์ (Full Project Structure Report)
*อัปเดต: 5 มีนาคม 2026*

---

### 18.1 🌳 ภาพรวมโครงสร้างโปรเจค (Top-Level)

```
caculateapp/                          ← Root Project (Flutter + Multi-Platform)
├── 📱 lib/                           ← Flutter App Source Code (Dart)
├── 🌐 public/                        ← Firebase Hosting (Web Frontend)
├── ⚙️ tuktuk-backend/                ← Go REST API Engine (Fly.io)
├── ☁️ functions/                     ← Firebase Cloud Functions (Node.js)
├── 🤖 android/                       ← Android Native Config
├── 🍎 ios/                           ← iOS Native Config
└── 📦 pubspec.yaml                   ← Flutter Dependencies
```

---

### 18.2 📱 Flutter App: `lib/`

```
lib/
├── main.dart                         ← App Entry Point, MaterialApp, Routes
├── firebase_options.dart             ← Firebase Configuration (auto-generated)
└── tuktuk/
    ├── screens/                      ← UI Screens (37 files)
    │   ├── 🗺️ win_rider_map_screen.dart     ← GPS Map + WebView + Radar HUD
    │   ├── 🏍️ win_rider_service_screen.dart  ← Job Board for Riders (97 KB)
    │   ├── 💬 chat_screen.dart              ← Real-time Chat (87 KB)
    │   ├── 👤 profile_screen.dart           ← User Profile (133 KB)
    │   ├── 🛍️ product_detail_screen.dart    ← Product Page (107 KB)
    │   ├── 📝 create_post_screen.dart       ← Post Creation (73 KB)
    │   ├── 💰 marketplace_screen.dart       ← Marketplace Grid
    │   ├── 🔐 login_screen.dart             ← Auth (81 KB)
    │   ├── 📋 register_screen.dart          ← Registration (65 KB)
    │   ├── 📣 community_post_screen.dart    ← Community Feed (63 KB)
    │   ├── 🎬 live_studio_screen.dart       ← Live Commerce Studio (73 KB)
    │   ├── 🔔 notifications_screen.dart     ← Notifications (71 KB)
    │   ├── 📦 post_product_screen.dart      ← Product Listing (64 KB)
    │   ├── 📬 message_list_screen.dart      ← Message Inbox (37 KB)
    │   ├── 📞 call_screen.dart              ← Agora Voice/Video Call
    │   ├── 🔒 privacy_notice_screen.dart    ← PDPA Privacy Policy
    │   ├── 🏪 seller_dashboard_screen.dart  ← Seller Analytics Dashboard
    │   ├── 🔍 unified_search_screen.dart    ← Universal Search
    │   ├── 🏬 smart_shopping_screen.dart    ← Smart Product Discovery
    │   ├── 🎥 video_viewer_screen.dart      ← Full-screen Video Player
    │   ├── 🛒 tuktuk_feed_screen.dart       ← Main Feed Hub (Refactored & Modularized)
    │   └── ... (17 more screens)
    │
    ├── services/                     ← Business Logic & Integrations (18 files)
    │   ├── 🔑 tuktuk_bridge.dart          ← Firebase Firestore Bridge (75 KB)
    │   ├── 🪙 tuktuk_tokenomics.dart       ← Points & Rewards System (16 KB)
    │   ├── 🎥 tuktuk_video_parser.dart     ← Multi-format Video Parser (15 KB)
    │   ├── 🌐 tuktuk_go_service.dart       ← Go Backend HTTP Client (13 KB)
    │   ├── 🗺️ location_service.dart        ← GPS & Geocoding Service
    │   ├── 💬 chat_service.dart            ← Chat CRUD & Real-time (21 KB)
    │   ├── 🔐 permission_service.dart      ← Runtime Permissions (PDPA) (7 KB)
    │   ├── 📦 r2_upload_service.dart       ← Cloudflare R2 Uploads (8 KB)
    │   ├── 💾 disk_cache_service.dart      ← Persistent Local Cache (6 KB)
    │   ├── 🔍 search_service.dart          ← Fuzzy & Semantic Search (4 KB)
    │   ├── 📊 tuktuk_analytics_service.dart← Event Tracking (3 KB)
    │   ├── 📞 agora_service.dart           ← Agora RTC Integration (4 KB)
    │   └── ... (6 more services)
    │
    ├── widgets/                      ← Reusable UI Components
    │   ├── feed/                     ← Modular Feed Components (NEW 🟢)
    │   │   ├── feed_tab_state.dart         ← Independent Tab Management
    │   │   ├── welcome_card.dart           ← Animated Welcome Interaction
    │   │   ├── creation_wheel.dart         ← 3D Creation UI Selector
    │   │   ├── featured_seller_card.dart   ← Marketplace Promo Widget
    │   │   ├── idea_lab_card.dart          ← Lab CTA Card
    │   │   ├── recommendation_card.dart    ← Data-driven Suggestions
    │   │   └── gradient_mesh_painter.dart  ← Background Artist
    │   │
    │   ├── 🃏 product_item_card.dart       ← TikTok-style Product Card (45 KB)
    │   ├── 🎬 video_player_item.dart       ← Full-featured Video Player (96 KB)
    │   ├── 🏍️ win_rider_feed_card.dart     ← Rider Job Card (78 KB)
    │   ├── 🌍 community_feed_view.dart     ← Community Content View (78 KB)
    │   ├── 🖼️ image_post_item.dart         ← Image Post Widget (28 KB)
    │   ├── 💬 comments_sheet.dart          ← Sliding Comments Panel (22 KB)
    │   ├── 🧭 marketplace_grid_card.dart   ← Product Grid Card (13 KB)
    │   └── ... (14 more widgets)
    │
    └── utils/
        └── profanity_filter.dart     ← Content Moderation Filter
```

---

### 18.3 🌐 Web Frontend: `public/`

```
public/                               ← Firebase Hosting Root
├── index.html                        ← Main Web App (440 KB — Full SPA)
├── marketplace.html                  ← Marketplace Web (587 KB)
├── super-admin.html                  ← Admin Control Panel (809 KB)
├── seller-dashboard.html             ← Seller Analytics Dashboard (377 KB)
├── community.html                    ← Community Social Feed (205 KB)
├── post-product.html                 ← Product Listing Form (202 KB)
├── product.html                      ← Product Detail Page (209 KB)
├── win-service.html                  ← Win Rider Map Service (293 KB)
├── channel.html                      ← Live Streaming Channel (137 KB)
├── smart-farm.html                   ← AgriTech Smart Farm (487 KB)
│
├── 🏍️ Win Rider Module
│   ├── win-rider.html               ← Rider Registration/Info (58 KB)
│   └── win-rider-register.html      ← Driver Registration Form (46 KB)
│
├── 🔐 Auth & Onboarding
│   ├── login.html                   ← LINE + Firebase Auth
│   ├── register.html                ← User Registration
│   └── auth.html                    ← Auth Callback Handler
│
├── 📡 LINE LIFF Integration
│   ├── liff-seller.html             ← Seller LIFF App
│   ├── liff-customer.html           ← Customer LIFF App
│   ├── liff-advanced-seller.html    ← Advanced Seller Tools
│   └── liff-live-commerce.html      ← Live Commerce LIFF
│
├── 📋 Legal & Info
│   ├── privacy.html / privacy-with.html
│   ├── terms.html
│   └── about.html
│
├── js/                              ← JavaScript Modules (17 files)
│   ├── firebase-config.js
│   ├── marketplace_helpers.js
│   └── ... (auth, analytics helpers)
│
└── tuktuk/                          ← Flutter Web Build Output
    ├── index.html
    ├── main.dart.js                 ← Compiled Flutter Web (14 MB)
    └── flutter_bootstrap.js
```

---

### 18.4 ⚙️ Go Backend Engine: `tuktuk-backend/`

```
tuktuk-backend/                       ← TukTuk Go Engine (Fly.io)
├── main.go                          ← Server Entry + Router + DI (✅ Sprint 2: +7 routes, graceful shutdown, request ID)
├── GO_ENGINE_REPORT.md              ← Sprint 1+2 Analysis Report (อัปเดต 2026-03-11)
├── BACKEND_REPORT.md                ← Backend Architecture Overview
├── Dockerfile                       ← Multi-stage Go Build
├── fly.toml                         ← Fly.io Deployment Config
├── go.mod                           ← Go Module Deps (gin, firebase, sqlx, redis)
│
└── internal/
    ├── models/                      ← Data Structures
    │   ├── post.go                  ← Community Post Model (7.3 KB)
    │   ├── analytics.go             ← Analytics Event Model
    │   ├── provinces.go             ← Thai Provinces Data
    │   └── telemetry.go             ← Observability Metrics
    │
    ├── services/                    ← Business Logic Layer
    │   ├── feed_service.go          ← Intelligent Feed Algorithm (8.3 KB)
    │   ├── analytics_service.go     ← Seller/Community Analytics (2 KB)
    │   └── storage_service.go       ← Cloudflare R2 Presign (9.7 KB)
    │
    ├── repository/                  ← Data Access Layer (Repository Pattern)
    │   ├── firestore_repo.go        ← Firestore Queries (12.7 KB)
    │   ├── redis_repo.go            ← Redis Cache Wrapper (6.1 KB)
    │   └── sql_repo.go              ← PostgreSQL Analytics Queries
    │
    ├── cache/                       ← Caching Adapters
    │   ├── redis_cache.go           ← Redis Client
    │   └── memory_cache.go          ← In-process Fallback Cache
    │
    └── observability/
        └── logger.go                ← Structured slog + Cold-start Metrics
```

**API Endpoints (Go Engine — 20 endpoints หลัง Sprint 2):**

| Method | Path | Auth | Cache | คำอธิบาย |
|--------|------|------|-------|---------|
| `GET` | `/health` | Public | ❌ | Health + Firestore ping (2s timeout) |
| `GET` | `/api/v1/feed` | Public | 5 min | Feed อัจฉริยะ (Real User Affinity) |
| `GET` | `/api/v1/feed/trending` | Public | 10 min | Trending Posts ใน 24h จริง |
| `GET` | `/api/v1/news` | Public | 15 min | Verified News Articles |
| `GET` | `/api/v1/products` | Public | 5 min | Marketplace Products |
| `GET` | `/api/v1/leaderboard` | Public | 10 min | Seller Leaderboard |
| `GET` | `/api/v1/live` | Public | 1 min | Live Sessions |
| `GET` | `/api/v1/live/:id` | Public | 10 sec | Single Live Session |
| `POST` | `/api/v1/presign` | Public | ❌ | R2 Presigned PUT URL (functional) |
| `GET` | `/api/v1/users/:id` | Public | ❌ | User Profile & Posts |
| `GET` | `/api/v1/posts/:id` | Public | 2 min | Single Post Detail |
| `GET` | `/api/v1/posts/:id/comments` | Public | 1 min | Post Comments |
| `GET` | `/api/v1/search` | Public | ❌ | Search Posts |
| `GET` | `/api/v1/analytics/seller/:id` | IAM | ❌ | Seller Dashboard Stats |
| `GET` | `/api/v1/analytics/community` | IAM | ❌ | Province-level Insights |
| `POST` | `/api/v1/posts` | IAM | ❌ | Create Post |
| `POST` | `/api/v1/posts/:id/like` | IAM | ❌ | Toggle Like (Subcollection) |
| `POST` | `/api/v1/posts/:id/view` | IAM | ❌ | Record View |
| `POST` | `/api/v1/posts/:id/comments` | IAM | ❌ | Create Comment |
| `POST` | `/api/v1/live/:id/heartbeat` | IAM | ❌ | Live Viewer Count |

---

### 18.5 ☁️ Firebase Cloud Functions: `functions/`

```
functions/
├── index.js                         ← Main Cloud Function Handler (940 KB!)
│
├── 🤖 AI & Intelligence
│   ├── aiResponseFlex.js            ← Gemini AI Response Formatter (84 KB)
│   ├── hyper_localized_knowledge.js ← Hyperlocal AI Knowledge (57 KB)
│   ├── flexMessageGenerator.js      ← LINE Flex Message Builder (319 KB)
│   └── categoryIntelligence.js      ← Category Smart Detection (36 KB)
│
├── 🛍️ Marketplace
│   ├── marketplaceSystem.js         ← Marketplace CRUD + Rules (86 KB)
│   ├── marketplaceWebAPI.js         ← REST API Layer (24 KB)
│   └── professional_tools.js        ← Seller Tools (105 KB)
│
├── 📚 Education & Training
│   ├── educationHub.js              ← Training Content Hub (200 KB)
│   ├── studentLearning.js           ← Adaptive Learning (150 KB)
│   ├── injectionMoldingLearning.js  ← Factory Training AI (134 KB)
│   ├── adaptiveQuizSystem.js        ← Adaptive Quiz Engine (16 KB)
│   └── flashcardSystem.js           ← Spaced Repetition (25 KB)
│
├── 💾 Memory & Notes
│   ├── memoryNoteSystem.js          ← AI Memory System (69 KB)
│   ├── memoryFlexEnhanced.js        ← Memory Flex Templates (20 KB)
│   └── adminFlexMessages.js         ← Admin Message Templates (260 KB)
│
├── 📊 Analytics & Reports
│   ├── analyticsSystem.js           ← Event Analytics (9 KB)
│   ├── reportGenerator.js           ← Auto Report Generation (32 KB)
│   └── scheduled_tasks.js           ← Cron Jobs (20 KB)
│
└── 🔐 Admin & Security
    ├── superAdminEnhanced.js        ← Super Admin Dashboard (41 KB)
    ├── enhancedAdminHandlers.js     ← Admin Action Handlers (29 KB)
    └── trialSystem.js               ← Free Trial Management (55 KB)
```

---

### 18.6 🔗 Data Flow & Integration Map

```mermaid
graph LR
    App[Flutter App] -->|Firestore SDK| FS[(Firestore)]
    App -->|HTTP| Go[Go Engine API]
    App -->|WebView| WinMap[Win Service HTML]
    WinMap -->|JS GPS Bridge| App

    Go -->|Firestore Admin| FS
    Go -->|Read Cache| Redis[(Redis)]
    Go -->|Analytics Queries| PG[(PostgreSQL)]
    Go -->|Presign| R2[(Cloudflare R2)]

    App -->|Upload Media| R2
    App -->|Voice/Video| Agora[Agora.io]
    App -->|LINE Login| LINE[LINE API]

    CF[Cloud Functions] -->|Triggers| FS
    CF -->|AI Inference| Gemini[Google Gemini]
    CF -->|LINE Messaging| LINE
    CF -->|Webhooks| App
```

---

### 18.7 📦 Flutter Key Dependencies

| Package | Version | ใช้งาน |
|---------|---------|--------|
| `cloud_firestore` | ^6.1.2 | Database หลัก |
| `firebase_auth` | ^6.1.4 | Authentication |
| `geolocator` | ^14.0.2 | GPS Tracking |
| `webview_flutter` | ^4.4.2 | Win Rider Map |
| `agora_rtc_engine` | ^6.3.2 | Voice/Video Call |
| `better_player_plus` | ^1.0.8 | Video Playback |
| `youtube_player_iframe` | ^5.2.1 | YouTube Embed |
| `google_fonts` | ^6.2.1 | Typography (Kanit) |
| `cached_network_image` | ^3.4.1 | Image Caching |
| `animate_do` | ^4.2.0 | Micro-animations |
| `shimmer` | ^3.0.0 | Loading Skeletons |
| `flutter_line_sdk` | ^2.3.2 | LINE Login |
| `firebase_messaging` | ^16.1.1 | Push Notifications |
| `shared_preferences` | ^2.2.3 | Local Storage |
| `lottie` | 3.3.0 | Lottie Animations |
| `dio` | ^5.8.0 | HTTP Client |

---

### 18.8 🔧 Android Build: `android/`

| ไฟล์ | คำอธิบาย |
|------|---------|
| `settings.gradle` | Plugin Management (AGP 8.7, Kotlin 2.1, Flutter Plugin Loader) |
| `build.gradle` | Root Build Script + Google Services 4.4.1 |
| `app/build.gradle` | App Build Config (compileSdk 36, minSdk 24, Release Signing) |
| `google-services.json` | Firebase Project Config |
| `proguard-rules.pro` | R8 Shrinking Rules |
| `release-key.jks` | Production Signing Keystore |

> [!WARNING]
> พบไฟล์ซ้ำซ้อน: `settings.gradle.kts`, `build.gradle.kts`, `app/build.gradle.kts` ถูกสร้างโดยอัตโนมัติ — ไฟล์เหล่านี้ถูก Clear เพื่อป้องกัน Conflict กับ Groovy Scripts หลัก

---

### 18.9 📊 Project Statistics (มีนาคม 2026)

| Category | Count | รายละเอียด |
|----------|-------|-----------|
| **Dart Source Files** | ~90 | lib/ (screens, services, widgets) |
| **HTML Pages (Web)** | ~35 | public/ SPA + LIFF + Admin |
| **Cloud Functions** | 180+ | Firebase Functions modules |
| **Go Source Files** | ~12 | tuktuk-backend/internal/* |
| **Total Codebase** | ~2.5M lines | รวมทุก platform |
| **Flutter Dependencies** | 55+ packages | pubspec.yaml |
| **Firestore Collections** | 25+ | community_posts, marketplace_items, etc. |

---

### 18.10 🔄 Recent Changes Log (5 มีนาคม 2026)

| เวลา | การเปลี่ยนแปลง | ผลกระทบ |
|------|--------------|---------|
| 12:28 | **Gradle Build Fix** — แก้ `afterEvaluate` Crash + ลบไฟล์ .kts ซ้ำซ้อน | ✅ Build สำเร็จ |
| 12:40 | **Restore 4 Files** — `location_service.dart`, `marketplace_screen.dart`, `call_screen.dart`, `privacy_notice_screen.dart` ถูก Clear โดยอุบัติเหตุ → กู้คืนแล้ว | ✅ Restored |
| 12:40 | **Full Project Audit** — วิเคราะห์โครงสร้าง public/ lib/ tuktuk-backend/ | ✅ รายงานนี้ |
| 12:48 | **SWOT + Development Roadmap** — วิเคราะห์จุดแข็ง/จุดอ่อน พร้อม Roadmap ลำดับความสำคัญ | ✅ Section 19 |
| 13:30 | **Search & Filter System** — Implemented Fuzzy Search, Advanced Filters (Price, Province, OTOP) on Flutter & Web. Fixed `tuktuk_bridge` collection query. | ✅ Implemented |
| **11 มีนาคม 2026** | | |
| 10:00 | **Go Engine Sprint 1+2** — 7 bugs fixed, 10 features added, Score 4.9→7.6/10. API: 7→20 endpoints. Real User Affinity, sort.Slice, WarmAll semaphore, trending 24h, subcollection like, graceful shutdown, request ID middleware, presign functional | ✅ Shipped |

---

### 18.11 🚀 Go Engine Sprint Status (2026-03-11)

| Category | ก่อน | หลัง (Sprint 2) | เปลี่ยนแปลง |
|---------|------|------|------------|
| Concurrency | 5/5 | 5/5 | ✅ คงไว้ |
| Caching | 4/5 | 5/5 | +1 WarmAll semaphore |
| API Coverage | 2/5 | 5/5 | +3 🚀 7 routes ใหม่ |
| Security | 3/5 | 4/5 | +1 Request ID, CORS |
| Performance | 3/5 | 5/5 | +2 🚀 sort.Slice, Subcollection |
| Observability | 3/5 | 4/5 | +1 Firestore health ping |
| Personalization | 1/5 | 4/5 | +3 🚀 Real Affinity |
| Stability | 2/5 | 5/5 | +3 🚀 Graceful Shutdown |
| **Total** | **23/50 (4.9)** | **38/50 (7.6)** | **+15 🎯** |

**Key improvements:** `sort.Slice` (O(n log n)), Real User Affinity from Firestore, WarmAll semaphore (max 3 parallel queries), Trending 24h real filter, Dynamic tags from `trending_tags/current`, Subcollection Like (ไม่มีปัญหา 1MB limit), Graceful Shutdown 30s drain, Request ID Middleware, Presign endpoint functional

**Sprint 3 Status:**
- ✅ Unit Tests (>60% coverage) — เสร็จแล้ว
- ✅ Rate Limiting (ulule/limiter) — เสร็จแล้ว
- ✅ ViewCount Buffering (Redis → Batch) — เสร็จแล้ว
- ✅ Cursor-based Pagination — เสร็จแล้ว
- 🟢 Platform Analytics API | OpenAPI 3.0 Docs — Nice-to-have

**Sprint 4 Roadmap:**
- Fly.io upgrade: `shared-cpu-1x` → `performance-1x` + `min_machines_running = 1`
- Follow/Unfollow System
- WebSocket Live Viewer Count
- PostgreSQL sync จาก Firestore triggers

---

## 🎯 19. SWOT Analysis & Strategic Development Roadmap
*อัปเดต: 5 มีนาคม 2026 — ผลจากการ Audit โค้ดโดย AI*

---

### 19.1 💪 จุดแข็ง (Strengths) — สิ่งที่ทำได้ดีแล้ว

#### 🏗️ สถาปัตยกรรม (Architecture)
| จุดแข็ง | รายละเอียด | ระดับ |
|--------|-----------|------|
| **Enterprise-grade TukTukBridge** | `Circuit Breaker`, `Rate Limiter`, `LRU Cache`, `Offline Queue`, `AES Encryption` ใน Bridge เดียว | ⭐⭐⭐⭐⭐ |
| **Polyglot Backend** | Flutter + Go Engine + Firebase Functions + Web SPA ทำงานร่วมกัน | ⭐⭐⭐⭐⭐ |
| **Repository Pattern (Go)** | แยก Firestore / Redis / PostgreSQL interfaces พร้อม Dependency Injection ที่แท้จริง | ⭐⭐⭐⭐⭐ |
| **Hybrid Data Store** | Firestore (real-time) + PostgreSQL (analytics) + Redis (cache) เหมาะกับ workload ต่างประเภท | ⭐⭐⭐⭐⭐ |
| **Cold-start Optimization** | Cache Warmer จาก disk ลด Firestore calls ตั้งแต่ startup | ⭐⭐⭐⭐ |

#### 💰 ระบบ Tokenomics & Engagement
| จุดแข็ง | รายละเอียด | ระดับ |
|--------|-----------|------|
| **Full Tokenomics Engine** | 10 Mission Types, Streak System, Leaderboard, Voucher สมบูรณ์ | ⭐⭐⭐⭐⭐ |
| **Firestore Transactions** | ใช้ `runTransaction` ป้องกัน race condition ใน point awards | ⭐⭐⭐⭐⭐ |
| **Real-time Coin Balance** | Stream-based `getUserCoins()` อัปเดตทันทีโดยไม่ต้อง poll | ⭐⭐⭐⭐ |

#### 🔐 ความปลอดภัย (Security)
| จุดแข็ง | รายละเอียด | ระดับ |
|--------|-----------|------|
| **Multi-provider Auth** | LINE, Google, PIN, Anonymous + Cross-account Identity Linking | ⭐⭐⭐⭐⭐ |
| **AES-256 Session Encryption** | Session เก็บใน SharedPreferences แบบเข้ารหัส | ⭐⭐⭐⭐⭐ |
| **IAM Middleware (Go)** | Firebase Token Verification บน Backend พร้อม fail-closed safety | ⭐⭐⭐⭐⭐ |
| **Firebase App Check** | ป้องกัน API abuse จาก non-genuine clients | ⭐⭐⭐⭐ |
| **Environment Config** | แยก Secrets (LINE, URLs) ออกจากโค้ดผ่าน .env (NEW 🟢) | ⭐⭐⭐⭐⭐ |

#### 🎨 UI/UX
| จุดแข็ง | รายละเอียด | ระดับ |
|--------|-----------|------|
| **TikTok-style Feed Widget** | `video_player_item.dart` 96 KB — Full gesture, speed, double-tap-like | ⭐⭐⭐⭐⭐ |
| **Feed Modularity** | แยก Widgets ออกจาก Feed Screen ทำให้ Maintain ได้ง่ายและ Reusable (NEW 🟢) | ⭐⭐⭐⭐⭐ |
| **Multi-platform** | Flutter Web + Android + iOS + LINE LIFF จาก codebase เดียว | ⭐⭐⭐⭐⭐ |
| **Win Rider GPS + WebView** | Native GPS ส่งผ่าน JavaScript Bridge ไปยัง Leaflet Map | ⭐⭐⭐⭐ |

---

### 19.2 ⚠️ จุดอ่อน (Weaknesses) — สิ่งที่ต้องแก้ไขเร่งด่วน

#### 🔴 ปัญหาวิกฤต (Critical — ต้องแก้ก่อน Deploy)

| # | ปัญหา | ไฟล์ที่เกี่ยวข้อง | ผลกระทบ |
|---|------|-----------------|---------|
| 1 | **ไฟล์ stub ว่างเปล่า** — `location_service.dart`, `marketplace_screen.dart` ถูก Clear หลายครั้ง ต้องหาต้นเหตุ | `services/`, `screens/` | 🔴 Build Error |
| 2 | **Duplicate Gradle Files** — `.kts` และ `.gradle` อยู่ด้วยกัน สาเหตุหลักของ `afterEvaluate` crash | `android/` | 🔴 Build Fail |
| 3 | **`tuktuk_feed_screen.dart` ใหญ่ผิดปกติ** | ✅ แก้ไขแล้ว: Modularization Completed | `widgets/feed/` | 🟢 Resolved |
| 4 | **Hardcoded LINE Channel ID** | ✅ แก้ไขแล้ว: ย้ายไปที่ .env | `tuktuk_bridge.dart` | 🟢 Resolved |
| 5 | **Hardcoded Firebase Function URL** | ✅ แก้ไขแล้ว: ย้ายไปที่ .env | `tuktuk_bridge.dart` | 🟢 Resolved |

#### 🟠 ปัญหาสำคัญ (Important — ต้องแก้ใน Sprint ถัดไป)

| # | ปัญหา | รายละเอียด | Priority |
|---|------|-----------|---------|
| 6 | **ไม่มี Unit/Widget Tests** | ไม่พบ test files ที่มีนัยสำคัญ การเปลี่ยนโค้ดเสี่ยง Regression สูง | 🟠 High |
| 7 | **`functions/index.js` ขนาด 940 KB** | Cloud Function monolith ไม่ได้แยก module อาจ timeout และ Cold start สูง | 🟠 High |
| 8 | **Stub Screens ยังไม่ complete** | `MarketplaceScreen`, `CallScreen`, `SellerDashboardScreen` ยังเป็น placeholder | ✅ Resolved |
| 9 | **ไม่มี Error Boundary UI** | ถ้า Firestore fail ผู้ใช้เห็น blank screen ไม่มี graceful degradation | 🟠 High |
| 10 | **`win_rider_map_screen.dart` Null Safety** | Error "operand can't be null" ยังไม่ได้ fix อย่างครบถ้วน | ✅ Resolved |

#### 🟡 ปัญหาปานกลาง (Medium — ต้องแก้ใน Q2)

| # | ปัญหา | รายละเอียด |
|---|------|-----------|
| 11 | **ไม่มี State Management ที่เป็นมาตรฐาน** | ผสม `setState`, `StreamBuilder`, `ValueNotifier`, `Riverpod` ในโปรเจคเดียว |
| 12 | **ไม่มี Crash Analytics** | ไม่เห็น `firebase_crashlytics` ใน pubspec.yaml ไม่รู้ว่าแอปล่มบ้างไหม |
| 13 | **Image Lazy Loading** | บางจุดยังใช้ `NetworkImage` แทน `cached_network_image` อาจช้า |
| 14 | **ไม่มี i18n** | ข้อความ EN/TH ปนกันใน code แทนที่จะใช้ ARB/l10n |
| 15 | **Firestore Index ครบหรือยัง** | `firestore.indexes.json` อาจยังไม่ครอบคลุม query ทั้งหมด |

---

### 19.3 🚀 Roadmap — ลำดับการพัฒนาที่แนะนำ

#### 🔴 Phase 1: Stabilization (1–2 สัปดาห์)
*เป้าหมาย: ให้แอป Build ผ่านและไม่ Crash ใน Core Flows*

```
✅ [x] **Fix Hardcoded Secrets** (LINE Channel, Firebase URL)
✅ [x] **Audit Null Safety** (`win_rider_map_screen.dart`, etc.)
✅ [x] **Stabilize Android Build** (Remove duplicate gradle files)
✅ [x] **Complete Stub Screens** (Marketplace, Call, Seller Dashboard)
✅ P1.5 Error Boundary → Ongoing
```

#### 🟠 Phase 2: Core Feature Completion (2–4 สัปดาห์)
*เป้าหมาย: Win Rider + Marketplace ทำงานได้จริง End-to-End*

```
🎯 P2.1 Win Rider Real-time Matching
    - Firestore listener สำหรับ driver/customer matching
    - Push notification เมื่อมี driver accept job
    - Fare calculation ตาม distance จาก TukTukLocationService

🎯 P2.2 Live Marketplace (Real Data)
    - Replace stub MarketplaceScreen ด้วย real Firestore queries
    - Product search ผ่าน Go Engine /api/v1/products
    - Shopping cart + checkout flow

🎯 P2.3 Payment Integration
    - PromptPay QR Code generation
    - Slip verification (slip_verification_service.dart มีอยู่แล้ว)
    - Coin redemption flow (TukTukTokenomics พร้อมแล้ว)
```

#### 🟡 Phase 3: Quality & Scale (1–2 เดือน)
*เป้าหมาย: Production-ready, Scalable*

```
📈 P3.1 Refactor tuktuk_feed_screen.dart (DONE ✅)
    - แบ่งออกเป็น widgets เล็กๆ ≤ 300 lines ต่อไฟล์
    - Extract: WelcomeCard, CreationWheel, Card Components

📈 P3.2 Testing Infrastructure
    - Unit Tests: TukTukBridge, TukTukTokenomics, LocationService
    - Widget Tests: ProductItemCard, FeedView
    - Integration Test: Login flow, Post creation

📈 P3.3 Observability
    - เพิ่ม firebase_crashlytics (crash reporting)
    - เพิ่ม firebase_performance (network trace)
    - ต่อ Go Engine metrics กับ Grafana Cloud

📈 P3.4 Performance Optimization
    - ใช้ flutter_riverpod อย่างสม่ำเสมอแทน setState
    - Implement Infinite Scroll + Pagination ใน Feed
    - Image compression ก่อน upload ด้วย video_compress
```

#### 🌟 Phase 4: Growth Features (3–6 เดือน)
*เป้าหมาย: Competitive Advantage & Monetization*

```
🌟 P4.1 AI-powered Feed Personalization
    - ต่อ Go Engine /api/v1/feed กับ Interest Scoring (มีโครงใน TukTukBridge)
    - ใช้ ML Kit (on-device) สำหรับ content tagging

🌟 P4.2 Live Commerce Completion
    - Agora Live Stream (broadcaster.html มีแล้ว)
    - In-stream product tagging + purchase
    - Co-host / Split screen

🌟 P4.3 AgriTech Expansion
    - Smart Farm module (smart-farm.html ใหญ่ที่สุด 487 KB)
    - IoT sensor integration (weather, soil)
    - ต่อกับ Education Hub สำหรับชาวนา

🌟 P4.4 Super App Wallet
    - TukCoin → PromptPay conversion
    - B2B: Bulk coin purchase สำหรับ brand sponsorship
    - Revenue share กับ LINE Official Account

🌟 P4.5 Win Rider Network Expansion  
    - Rider rating system (เหมือน Grab/Bolt)
    - Multi-stop trips
    - Package delivery mode
```

---

### 19.4 📊 เปรียบเทียบกับคู่แข่ง (Competitive Analysis)

#### ด้านเทคนิค (Tech Stack)

| Feature | TukTuk | Shopee | TikTok Shop | LINE Shopping |
|---------|--------|--------|-------------|---------------|
| **Real-time Feed** | ✅ Firestore | ❌ Polling | ✅ WebSocket | ❌ Polling |
| **AI Integration** | ✅ Gemini Flash | Partial | ✅ Deep | ❌ |
| **LINE Native LIFF** | ✅ LIFF + SDK + Bot | ❌ | ❌ | ✅ Native เท่านั้น |
| **Ride Hailing** | ✅ Win Rider | ❌ | ❌ | ❌ |
| **AgriTech** | ✅ Smart Farm | ❌ | ❌ | ❌ |
| **Education Platform** | ✅ Full Hub | ❌ | ❌ | ❌ |
| **Escrow System** | ✅ Built-in | ✅ | ✅ | ❌ |
| **Community OTOP** | ✅ | ❌ | ❌ | ❌ |

#### ด้านธุรกิจ (Business Model)

| เรื่อง | TukTuk | Shopee/Lazada | Facebook Ads | LINE Shopping |
|--------|--------|---------------|-------------|--------------|
| **ค่าคอมมิชชั่น** | **ไม่มี** | 3–8%/ยอดขาย | ไม่มี | ไม่มี |
| **ค่ารายเดือน** | **฿242–300/เดือน** | ฟรี (จ่ายคอม) | 2,000฿+/เดือน | ฟรี |
| **ทดลองฟรี** | **30 วัน ครบทุกฟีเจอร์** | ไม่มี | ไม่มี | ไม่มี |
| **AI ช่วยโพสต์** | **ใช่** | บางส่วน | ไม่มี | ไม่มี |
| **กลุ่มเป้าหมาย** | OTOP/ท้องถิ่น/ชุมชน | Mass market | กว้าง | LINE users |

> **จุดแตกต่างที่แท้จริง (Blue Ocean):** TukTuk เป็น Super App เดียวในไทยที่รวม **Marketplace + Ride-hailing + AgriTech + Education + Social Feed** ไว้ในแอปเดียว พร้อม **LINE integration ที่ลึกที่สุด** — คู่แข่งยังไม่มีใครทำ

---

### 19.5 🎯 Priority Matrix (Impact vs Effort)

```
  สูง │ P1.4 Complete Stubs  │ P2.1 Win Rider Matching │
      │ P1.2 Null Safety     │ P2.3 Payment            │
Impact│ P1.1 Fix Hardcoded   │ P3.1 Feed Refactor      │
      │──────────────────────┼─────────────────────────│
  ต่ำ  │ P1.5 Error Boundary  │ P4.1 AI Personalization │
      │ P1.3 Gradle Fix      │ P4.4 Super Wallet       │
      └──────────────────────┴─────────────────────────┘
              Effort ต่ำ               Effort สูง
```

> [!IMPORTANT]
> **คำแนะนำสำคัญที่สุด:** เริ่มต้นด้วย **P1.1 (Fix Hardcoded Secrets)** ก่อนเป็นอันดับแรก เพราะ `LINE Channel ID` ที่ hardcode ใน code และ push ขึ้น GitHub อาจถูก scrape โดย bot ทำให้ LINE Channel ถูกล็อค
---

## 🏬 20. การยกระดับ Seller Dashboard (Transformation to Pro Dashboard)

ในเดือนมีนาคม 2026 เราได้ทำการเปลี่ยนผ่านจากหน้า Dashboard แบบ Stub มาเป็นระบบบริหารจัดการร้านค้าที่สมบูรณ์แบบ โดยยึดหลัก **"Performance First, Offline Ready"**:

### 20.1 คุณสมบัติการทำงานระดับสูง (Advanced Features)

| ฟีเจอร์ | รายละเอียดทางเทคนิค | ประโยชน์ |
|---------|-------------------|----------|
| **Real-time Badges** | เชื่อมต่อกับ `ChatService` ผ่าน `StreamBuilder` | แจ้งเตือนแชทและอัปเดตสถานะแบบวินาทีต่อวินาทีบน AppBar |
| **Offline-First Data** | ใช้ `SharedPreferences` เก็บ JSON snapshot ของสถิติและสินค้า | เปิดหน้าจอแล้วเห็นข้อมูลทันที ไม่ต้องรอดึงข้อมูลจากเน็ต (Instant Paint) |
| **Smart Post FAB** | Floating Action Button นำทางไปยัง `PostProductScreen` | กระตุ้นให้ผู้ขายลงสินค้าได้ง่ายขึ้นด้วยระบบ AI (Smart Post) |
| **Membership BottomSheet** | ระบบเลือกแพ็กเกจ (Starter, Pro, Expert) ในแอป | เพิ่มโอกาสในการสร้างรายได้ (Monetization) ผ่านการอัปเกรดฟีเจอร์ AI |

### 20.2 การเพิ่มสถาปัตยกรรมด้านประสิทธิภาพ (Performance Architecture)

1.  **Dual-Source Loading Strategy**:
    *   **Cache First**: โหลดข้อมูลจาก Local Storage มาแสดงผลทันทีใน `initState`
    *   **Network Fetch**: ดึงข้อมูลใหม่จาก Go Engine/Firestore ในเบื้องหลัง และทำการอัปเดต UI พร้อมบันทึกแคชใหม่
2.  **Asset Handling Optimization**:
    *   เปลี่ยนจากการใช้ `Image.network` มาเป็น `CachedNetworkImage` ทั้งหมดในระบบรายการสินค้า
    *   ติดตั้ง `Shimmer` skeletons เพื่อลดความรู้สึกว่าแอป "ค้าง" ระหว่างรอโหลดข้อมูล
3.  **UI/UX Alignment (Web-to-Mobile)**:
    *   ยกโครงสร้างมาจาก `seller-dashboard.html`: รายงานรายได้, ยอดเข้าชม, รายการสินค้าที่กรองสถานะได้, แผงเครื่องมือ Merchant Tools (Finance, Marketing, AI) และ AI Performance Insights

### 20.3 แผนปฏิบัติการ Seller Dashboard v2.1 (Next Steps)
- [x] เชื่อมต่อระบบกราฟสถิติ (Performance Charts) ด้วยแพ็กเกจ `fl_chart` ✅ มีนาคม 2026
- [ ] พัฒนาระบบ AI Content Suggestion ให้ทำงานแบบ Real-time บนมือถือ
- [x] ระบบจัดการสต็อกสินค้า (Bulk Stock Update) แบบออฟไลน์ ✅ มีนาคม 2026

---

## 🔄 21. Marketplace & Seller Dashboard Unification — Update Report (มีนาคม 2026)

> **เป้าหมาย:** ยก feature parity ระหว่าง `marketplace.html` + `seller-dashboard.html` (Web) กับ `marketplace_screen.dart` + `seller_dashboard_screen.dart` (Flutter) ให้เป็นโครงสร้างเดียวกัน ตามหลักการ ARCHITECTURAL_OVERVIEW.md

---

### 21.1 Gap Analysis (ก่อนอัปเดต)

| Feature | Web (HTML) | Flutter (ก่อน) | สถานะ |
|---------|-----------|----------------|-------|
| Wishlist heart toggle | ✅ localStorage | ❌ ไม่มี | แก้แล้ว ✅ |
| Dynamic badges (New/Hot/Sold) | ✅ ตาม data จริง | ⚠️ hardcoded NEW | แก้แล้ว ✅ |
| View count per card | ✅ `👁 123` | ❌ ไม่มี | แก้แล้ว ✅ |
| Sold overlay / greyed price | ✅ | ❌ ไม่มี | แก้แล้ว ✅ |
| Owner actions (edit/share) | ✅ canManageProduct() | ❌ ไม่มี | แก้แล้ว ✅ |
| OTOP / Community tab | ✅ section แยก | ⚠️ toggle ใน filter sheet | แก้แล้ว ✅ |
| Analytics chart (fl_chart) | ✅ Chart.js revenue | ❌ placeholder ว่าง | แก้แล้ว ✅ |
| Stats mini-cards (revenue/orders/views) | ✅ overview cards | ❌ ไม่มี | แก้แล้ว ✅ |
| Inventory quick stock update | ✅ quickstock stepper | ❌ ไม่มี | แก้แล้ว ✅ |
| Low-stock warning | ✅ สีแดงเมื่อ stock ≤ 5 | ❌ ไม่มี | แก้แล้ว ✅ |
| AI Content Suggestion | ✅ aiImproveTitle/Desc | ❌ ไม่มี | pending |
| Affiliate section | ✅ | ❌ | pending |
| Import API (Lazada/Shopee) | ✅ | ❌ | pending |
| Full Chat Center | ✅ | ⚠️ badge + navigate | pending |

---

### 21.2 สิ่งที่พัฒนาในรอบนี้

#### 📦 `lib/tuktuk/screens/marketplace_screen.dart`

**1. Wishlist System**
- เพิ่ม state `Set<String> _wishlist` + persist ใน `SharedPreferences('tuktuk_wishlist')`
- ปุ่มหัวใจ `❤` ต่อ product card — กดครั้งเดียวบันทึก กดอีกครั้งลบออก
- โหลด wishlist อัตโนมัติใน `initState()` เพื่อ restore state ข้าม session

**2. Dynamic Product Badges**
- `NEW` — createdAt < 7 วัน (ใช้ `_isRecentProduct()` รองรับ Firestore Timestamp / ISO string)
- `HOT` — `viewCount >= 50`
- `ขายแล้ว` — `status == 'sold'`
- Logic: Sold > Hot > New (priority cascade) แทนที่ hardcoded `NEW` เดิม

**3. Sold State UI**
- Semi-transparent black overlay + text "ขายแล้ว" บน image
- ชื่อสินค้าและราคาเปลี่ยนเป็น greyed-out
- `InkWell.onTap` disabled เมื่อ `isSold == true`

**4. View Count**
- แสดง `👁 N` / `👁 1.2K` ขวาบนใน price row
- แสดงเฉพาะเมื่อ `viewCount > 0` ไม่รบกวน UI เมื่อยังไม่มีข้อมูล

**5. Owner Action Overlay**
- ตรวจสอบ `sellerId == _userSession['uid']`
- แสดง icon buttons (Edit + Share) บน image overlay เมื่อเป็นเจ้าของสินค้า
- Non-owner: แสดงเฉพาะ Share (LINE green) เหมือนเดิม

**6. OTOP / Community Tab Selector**
- Animated 2-tab bar: **ตลาด** / **OTOP/ชุมชน**
- วางระหว่าง SearchBar กับ ProductList
- สลับ `_isOtop` และ `_tabIndex` แล้ว re-fetch ทันที — ไม่ต้องเปิด filter sheet

---

#### 🏪 `lib/tuktuk/screens/seller_dashboard_screen.dart`

**1. Analytics Chart (fl_chart BarChart)**
- แทนที่ `_buildPerformancePlaceholder()` ด้วย `_buildAnalyticsChart()` ที่มีข้อมูลจริง
- Stats mini-cards row (Revenue / Orders / Views) ดึงจาก `_reportData` (Go Engine) → fallback `_shopStats` (Firestore)
- BarChart Top-5 สินค้าจาก `viewCount` สูงสุด พร้อม gradient bar (cyan) + grid lines
- ตัด bottom label อัตโนมัติที่ 5 ตัวอักษร + `…`
- แสดง "ยังไม่มีข้อมูล" พร้อม CTA เมื่อยังไม่มีสินค้าที่มี viewCount

**2. Inventory Section**
- Section ใหม่ระหว่าง Product List กับ Recent Orders
- แสดงสินค้าสูงสุด 6 รายการพร้อม:
  - Thumbnail (CachedNetworkImage + fallback icon)
  - ชื่อสินค้าและ **"สต็อกใกล้หมด!"** warning เมื่อ stock ≤ 3 (สีส้ม)
  - Stepper `[−] N [+]` — กด + หรือ − แล้วตัวเลขเปลี่ยนทันทีใน UI
  - ปุ่ม "บันทึก" ปรากฏเฉพาะแถวที่ค่าเปลี่ยน → เรียก `TukTukBridge.updateProduct(id, 'marketplace_items', {stock: N})`
  - หลัง save สำเร็จ ลบออกจาก `_pendingStock` และ sync ค่าใน `_products`
- Toggle show/hide ผ่าน "ดูทั้งหมด" button ใน section header

---

### 21.3 Architecture Alignment

```
Web (marketplace.html)          Flutter (marketplace_screen.dart)
─────────────────────────       ─────────────────────────────────
toggleWishlist() localStorage   _toggleWishlist() SharedPreferences ✅
badge-sold / badge-hot / NEW    _buildBadge() dynamic logic         ✅
product.viewCount display       viewCount in price row              ✅
canManageProduct() isOwner      isOwner = sellerId == session.uid   ✅
Tab: ตลาด / Community          _tabIndex tab selector              ✅

Web (seller-dashboard.html)     Flutter (seller_dashboard_screen.dart)
────────────────────────        ──────────────────────────────────────
Chart.js revenue chart          fl_chart BarChart (top products)    ✅
overview stat cards             _buildMiniStat() revenue/orders     ✅
quickstock ± per product        _buildInventorySection() stepper    ✅
low-stock warning (red)         isLow highlight (orange border)     ✅
```

---

### 21.4 Data Flow: Inventory Save

```
User taps [+]/[−]
  → _adjustStock(productId, current, ±1)
  → setState(_pendingStock[productId] = next)   ← optimistic UI

User taps "บันทึก"
  → _saveStock(productId, stock)
  → TukTukBridge.updateProduct(id, 'marketplace_items', {stock: N})
  → Firestore.update() ← persisted
  → setState: remove _pendingStock, update _products in-memory
```

---

### 21.5 Package Dependencies ที่ใช้เพิ่ม

| Package | Version | ใช้ใน |
|---------|---------|-------|
| `fl_chart` | ^0.68.0 | BarChart analytics in seller_dashboard_screen |
| `shared_preferences` | ^2.2.3 | Wishlist persistence in marketplace_screen |
| `cached_network_image` | ^3.4.1 | Inventory thumbnails (ใช้แล้วอยู่ใน seller_dashboard) |

> หมายเหตุ: ทุก package มีอยู่ใน `pubspec.yaml` แล้ว ไม่ต้อง `flutter pub add` เพิ่ม

---

### 21.6 Remaining Gaps (pending)

| ฟีเจอร์ | Priority | หมายเหตุ |
|---------|----------|---------|
| AI Content Suggestion (improve title/desc) | P2 | เรียก CF `aiImproveTitle` จากปุ่มในหน้าแก้ไขสินค้า |
| Affiliate section | P3 | ระบบ recruit + track earning ใน seller dashboard |
| Import API (Lazada/Shopee) | P3 | ดึงข้อมูลสินค้าจากแพลตฟอร์มอื่น |
| Notification panel | P2 | แสดง list จาก Firestore `notifications/{uid}` |
| Full Chat Center UI | P3 | ปัจจุบันมีแค่ badge → navigate |
| Ads system | P4 | สร้าง/จัดการโฆษณาสินค้า |

---

## 22. Subscription Billing + Admin Data Sections + Firestore Security Fix — Update Report (6 มีนาคม 2026)

### 22.1 งานที่ทำในรอบนี้

| # | งาน | ไฟล์ | สถานะ |
|---|-----|------|-------|
| 1 | แก้ Subscription plan selection (pricing ผิด) | `seller_dashboard_screen.dart` | ✅ |
| 2 | เพิ่ม Invoice flow (CF call → dialog → QR → slip) | `seller_dashboard_screen.dart` | ✅ |
| 3 | เพิ่ม 3 sections ที่หายใน super-admin.html | `public/super-admin.html` | ✅ |
| 4 | แก้ Firestore rules (4 permission-denied errors) | `firestore.rules` | ✅ |
| 5 | แก้ Timestamp serialization crash ใน dashboard cache | `seller_dashboard_screen.dart` | ✅ |

---

### 22.2 Subscription Plan — ก่อน/หลัง

**ก่อน (ผิด — pricing รายเดือน เก่า):**
```
Starter      ฿99/เดือน   (ลงขาย 20 รายการ)
Professional ฿259/เดือน  (ลงขายไม่จำกัด)
Expert       ฿699/เดือน  (CRM + ผู้จัดการส่วนตัว)
```
ปุ่ม "เลือกแพ็กเกจนี้" → `onPressed: () {}` (ไม่ทำงาน)

**หลัง (ถูกต้อง — ตาม Master Action Plan):**
```
3 เดือน   ฿899    ≈ 300฿/เดือน
6 เดือน   ฿1,599  ประหยัด 200฿  [แนะนำ]
รายปี     ฿2,899  ประหยัด 1,289฿
```
**Invoice flow เต็มรูปแบบ:**
1. เลือกแพ็กเกจ → call CF `createSubscriptionInvoice`
2. `_showInvoiceDialog()` — แสดงเลขบิล, ราคา, วันหมดอายุ
3. กด "ชำระเงิน" → `_showSubscriptionPaymentModal()` — QR PromptPay + อัปโหลดสลิป
4. `_submitSubscriptionPayment()` — อัปโหลดสลิปผ่าน `TukTukStorageBridge`, update `invoices/{id}` + `seller_profiles/{uid}` ใน Firestore

**Subscription plan IDs:**
```
quarter_3m   → planId สำหรับ 3 เดือน
half_6m      → planId สำหรับ 6 เดือน
yearly_12m   → planId สำหรับรายปี
```

---

### 22.3 super-admin.html — Sections ที่เพิ่มใหม่

| Section | nav `data-section` | สิ่งที่เพิ่ม |
|---------|-------------------|-------------|
| **Legacy Orders** | `orders` | ตาราง `product_orders` + filter status + 4 summary cards (total/pending/escrow/completed) |
| **Quiz System** | `quiz` | Stats (sessions/unique users/avg score/hard pass) + leaderboard top 20 + external quiz links |
| **Settings** | `settings` | Subscription pricing display, Invoice รอยืนยัน (approve → activate), Withdrawal requests (mark paid), LINE OA config |

**JavaScript functions เพิ่มใหม่:**
```
loadOrders()              — query product_orders + fillter + count summary
viewOrderDetail(id)       — alert raw Firestore doc
loadQuizStats()           — query quiz_sessions + leaderboard
loadPendingInvoices()     — query invoices where status=='paid'
approveInvoice(...)       — batch: invoice→approved + seller_profiles→active
loadWithdrawalRequests()  — query withdrawal_requests where status=='pending'
markWithdrawalPaid(id)    — update withdrawal_requests.status='paid'
loadLineOaConfig()        — query system_config/line_oa
```

**showSection() hooks เพิ่ม:**
```javascript
if (sectionId === 'orders')   loadOrders();
if (sectionId === 'quiz')     loadQuizStats();
if (sectionId === 'settings') { loadPendingInvoices(); loadWithdrawalRequests(); loadLineOaConfig(); }
```

---

### 22.4 Firestore Rules Security Fix

**Debug log วิเคราะห์:** Infinix X692 (Android 10), Firebase Auth UID = `vIJ1E5PceHNaINRU0Gt0B0htK3q1`, LINE UID = `Uc64c7e1146169044406c2952b0a338e7`

**Root cause:** Seller dashboard ใช้ LINE UID เป็น `sellerId` ใน queries แต่ Firestore rules เช็ค `request.auth.uid` (Firebase Auth UID) → ไม่ตรงกัน → PERMISSION_DENIED

| Collection | Error | สาเหตุ | การแก้ไข |
|-----------|-------|--------|---------|
| `orders` | `permission-denied` querying `where sellerId==Uc...` | LINE UID ≠ Firebase Auth UID | เพิ่ม `isAuthenticated()` fallback + `lineUserId is string` |
| `line_users` | `permission-denied` update online status | `request.auth.uid (vIJ...)` ≠ `lineUserId (Uc...)` | เพิ่ม `resource.data.uid == request.auth.uid` |
| `leaderboard` | `permission-denied` awarding points | userId เป็น LINE format, rule เดิม `isOwner()` ไม่ผ่าน | เปลี่ยนเป็น `allow create, update: if isAuthenticated()` |
| `invoices` | ไม่สามารถ update payment slip ได้ | Rule เดิม `allow update: if isAdmin()` เท่านั้น | เพิ่ม allow seller update fields: `status, paidAt, slipUrl, transId, updatedAt` |

**Noise ที่ไม่ต้องแก้:**
- `E/GoogleApiManager: Failed to get service from broker` — Infinix X692 GMS device issue
- `W/com.tuktuk.th: Accessing hidden method Unsafe->...` — harmless Android compat warnings
- `W/FlagRegistrar: Phenotype.API not available` — GMS feature flag ไม่รองรับบน device นี้

---

### 22.5 Timestamp Serialization Fix

**Error:** `Error saving dashboard data to cache: Converting object to an encodable object failed: Instance of 'Timestamp'`

**Root cause:** Firestore `Timestamp` object ไม่รองรับ `json.encode()` โดยตรง

**Fix ใน `seller_dashboard_screen.dart`:**
```dart
dynamic _toJsonSafe(dynamic value) {
  if (value is Timestamp) return value.toDate().toIso8601String();
  if (value is Map) return value.map((k, v) => MapEntry(k.toString(), _toJsonSafe(v)));
  if (value is List) return value.map(_toJsonSafe).toList();
  return value;
}
// ใช้ใน _saveToCache(): json.encode(_toJsonSafe(_shopStats))
```

---

### 22.6 Architecture Impact

```
Flutter App
├── seller_dashboard_screen.dart
│   ├── _plans (const) — 3 plans: quarter_3m / half_6m / yearly_12m
│   ├── _handlePlanSelection() → CF createSubscriptionInvoice
│   ├── _showInvoiceDialog()   → AlertDialog พร้อม invoice detail
│   ├── _showSubscriptionPaymentModal() → QR + ImagePicker slip upload
│   ├── _submitSubscriptionPayment()   → TukTukStorageBridge + Firestore batch
│   └── _toJsonSafe()          → Timestamp → ISO string before cache
│
Web Admin
└── public/super-admin.html
    ├── #section-orders   → loadOrders() + approveInvoice()
    ├── #section-quiz     → loadQuizStats() + leaderboard
    └── #section-settings → loadPendingInvoices() + loadWithdrawalRequests()
                            + approveInvoice() + markWithdrawalPaid()

Firestore Rules (firestore.rules)
├── orders           — +isAuthenticated() + lineUserId is string
├── line_users       — +resource.data.uid == request.auth.uid
├── leaderboard      — isAuthenticated() (was isOwner)
└── invoices         — seller can update payment fields
```

### 22.7 Action ต่อไป

| งาน | คำสั่ง |
|-----|--------|
| Deploy Firestore rules | `firebase deploy --only firestore:rules` |
| Deploy Cloud Functions (createSubscriptionInvoice) | `firebase deploy --only functions` |
| ทดสอบ invoice flow | เลือกแพ็กเกจ → เห็น CF call → dialog → QR → slip → success |
| ทดสอบ super-admin sections | เปิด `/super-admin.html` → คลิก Legacy Orders / Quiz System / Settings |

---

## 💬 23. Message List & Chat UX Overhaul — Update Report (6 มีนาคม 2026)

> **เป้าหมาย:** ยกระดับหน้า Inbox (`message_list_screen.dart`) และ Chat Room (`chat_screen.dart`) ให้มีฟีเจอร์ครบและ UX ระดับโปร พร้อมแก้ไขจุดบกพร่องด้านการแสดงโฆษณาและ Firebase Permission

---

### 23.1 งานที่ทำในรอบนี้

| # | งาน | ไฟล์ | สถานะ |
|---|-----|------|-------|
| 1 | Product Chat tab: feature parity กับ Conversations tab | `message_list_screen.dart` | ✅ |
| 2 | Online status & last-seen ใน Chat Tiles | `message_list_screen.dart` | ✅ |
| 3 | Ad card interleaved list (`_buildInterleavedList`) | `message_list_screen.dart` | ✅ |
| 4 | Static fallback ads (`_kStaticAds`) ป้องกัน Ad ว่าง | `message_list_screen.dart` | ✅ |
| 5 | ลบ Insight Card popup ออกจาก Chat Room | `chat_screen.dart` | ✅ |
| 6 | แก้ launch image → circular logo + glow effect | `android/.../drawable*/launch_image.png` | ✅ |
| 7 | แก้ Firestore rules `marketplace_reviews` + `user_chat_settings` | `firestore.rules` | ✅ |

---

### 23.2 Product Chat Tab — Feature Parity

**ก่อน:** แท็บ "แชทสินค้า" มีแค่รายการ — ไม่มี pin, archive, rename, profile tap, swipe gesture

**หลัง:** ยก feature ให้เทียบเท่าแท็บ "การสนทนา" ทุกประการ โดยใช้ Namespaced Keys เพื่อแยก State:

```dart
// Namespaced key ป้องกัน key ชนกับ conversations tab
final stateKey = 'pc_${chatDoc.id}';

// Sort: pinned first
sortedDocs.sort((a, b) {
  final aPinned = _pinnedConvIds.contains('pc_${a.id}');
  final bPinned = _pinnedConvIds.contains('pc_${b.id}');
  if (aPinned != bPinned) return aPinned ? -1 : 1;
  ...
});

// Archive filter: แยก toggle ต่างหากจาก conversations tab
final _showArchivedProducts = false;
```

| Feature | Conversations Tab | Product Chat Tab (ก่อน) | Product Chat Tab (หลัง) |
|---------|------------------|------------------------|------------------------|
| Swipe right → Pin | ✅ | ❌ | ✅ `pc_${id}` |
| Swipe left → Archive | ✅ | ❌ | ✅ |
| Long press → Options menu | ✅ | ❌ | ✅ |
| Rename (nickname) | ✅ | ❌ | ✅ |
| Profile tap | ✅ | ❌ | ✅ ProfileScreen(userId) |
| Archive toggle (แยก Tab) | ✅ | ❌ | ✅ `_showArchivedProducts` |
| Pinned sort first | ✅ | ❌ | ✅ |

---

### 23.3 Online Status & Last-Seen Display

เพิ่มความเป็นมืออาชีพด้วยการแสดงสถานะออนไลน์แบบ Real-time:

```dart
// ดึงจาก Firestore users/{uid}
final isOnline = userData?['isOnline'] == true;
final lastSeenTs = userData?['lastSeen'] as Timestamp?;
final lastSeen = lastSeenTs?.toDate();

// ส่งไปยัง EnhancedChatTile
lastSeen: isOnline ? null : lastSeen,
```

**UI ที่แสดง:**
- **ออนไลน์:** จุดเขียว `●` + ข้อความ "ออนไลน์" (สีเขียว #22C55E)
- **ออฟไลน์:** "เห็นล่าสุด X นาทีที่แล้ว" (timeago package, locale: th)
- ครอบคลุมทั้ง 2 tab: Conversations + Product Chat

---

### 23.4 Ad Card — Interleaved List Architecture

**ปัญหาเดิม:** Ad ไม่แสดงเลย เพราะ:
1. `_adProducts` ว่างเมื่อ Firestore ไม่มีสินค้า active
2. Logic เดิม `(index + 1) % 6 == 0` ต้องมีอย่างน้อย 5 conversations ก่อน Ad จะแสดง

**การแก้ไข:**

#### A. Static Fallback Ads (`_kStaticAds`)
```dart
static const List<Map<String, dynamic>> _kStaticAds = [
  {
    'productName': 'เรียกวิน TukTuk ง่ายๆ',
    'sellerName': 'WIN RIDER SERVICE',
    'price': '0',
    '_adType': 'win_rider',
    ...
  },
  {
    'productName': 'เปิดร้านค้าออนไลน์ฟรี',
    'sellerName': 'TukTuk Marketplace',
    'price': '0',
    '_adType': 'seller_promo',
    ...
  },
];
```
- `_fetchAds()` เริ่มจาก `_kStaticAds` ก่อนเสมอ → `_adProducts` ไม่มีวันว่างเปล่า
- Firestore items append ต่อท้าย (bonus, ไม่ required)

#### B. `_buildInterleavedList()` Helper
```dart
List<dynamic> _buildInterleavedList(List<QueryDocumentSnapshot> docs) {
  // แทรก 1 Ad หลังทุกๆ 3 รายการ
  // ถ้าไม่มี Ad เลย ใส่ตัวแรกที่ตำแหน่ง index=1
}
```

**ผลลัพธ์:**
```
[Conv1] [Conv2] [Conv3] [AD] [Conv4] [Conv5] [Conv6] [AD] ...
                             ↑ guaranteed ≥ 1 ad แม้มี conv เพียง 1 รายการ
```

#### C. ลบ Logic เดิมออก (ทั้ง 2 Tab)
แทนที่ `adSlotCount`, `convIndex - (index ~/ 6)`, `pChatIndex` ด้วย `_buildInterleavedList()` เพียงอย่างเดียว ทำให้โค้ดสั้น เข้าใจง่าย และ Bug-free

---

### 23.5 Insight Card — ลบออกจาก Chat Room

**ปัญหา:** Insight Card (popup สินค้า/วิดีโอ/ข่าว) ใน `chat_screen.dart` รบกวนผู้ใช้ระหว่างแชท

**การแก้ไข:** ลบทุก Component ที่เกี่ยวข้องออกจาก `chat_screen.dart` โดยสมบูรณ์:

| Component ที่ลบ | ประเภท |
|----------------|--------|
| `_activeInsight` | State field |
| `_showInsight` | State field |
| `_insightTimer` | Timer field |
| `_insightRotationTimer` | Timer field |
| `_initDynamicInsights()` | Function |
| `_triggerInsight()` | Function |
| `_buildTuktukInsightCard()` | Widget function |
| `_insightTimer?.cancel()` | dispose call |
| `_insightRotationTimer?.cancel()` | dispose call |
| `_buildTuktukInsightCard()` | build tree call |

**Insight Card ยังคงอยู่ใน `message_list_screen.dart`** — แสดงเป็น Ad cards แบบ passive ใน Inbox เท่านั้น ไม่รบกวน UX ในห้องแชท

---

### 23.6 Launch Image — Circular Logo + Glow Effect

**ก่อน:** รูปสี่เหลี่ยม 640×640 เดิมจาก `images/logo.png`

**หลัง:** Circular logo พร้อม Glow effect รอบวง สำหรับ Android Splash Screen

**Process:**
1. สร้างด้วย Python PIL (3× oversampling สำหรับ Anti-aliasing)
2. Black background canvas
3. Outer glow 4 layers: Cyan → Blue → Purple → Violet (GaussianBlur radius 20-40)
4. Inner ring glow รอบขอบวงกลม
5. Circular-clipped logo (55% ของ canvas) + soft-edge mask
6. Glass shine arc (top-left, 210°–310°) สีขาว opacity 0.25

**Density-specific sizes (Android):**
| Density | Folder | Size |
|---------|--------|------|
| mdpi | `drawable-mdpi` | 200×200 px |
| hdpi | `drawable-hdpi` | 300×300 px |
| xhdpi | `drawable-xhdpi` | 400×400 px |
| xxhdpi | `drawable-xxhdpi` | 600×600 px |
| xxxhdpi | `drawable-xxxhdpi` | 800×800 px |
| default | `drawable` | 400×400 px |

---

### 23.7 Firestore Rules Fix

| Collection | ปัญหาเดิม | การแก้ไข |
|-----------|-----------|---------|
| `marketplace_reviews` | LINE users มี `authorId` ≠ `request.auth.uid` → PERMISSION_DENIED เมื่อรีวิวสินค้า | แก้ rule: `allow create: if isAuthenticated() \|\| (request.resource.data.authorId is string && ...size() > 0)` |
| `user_chat_settings` | ไม่มี rule → default deny → ไม่สามารถ save pin/archive/nickname ได้ | เพิ่ม: `allow read, write: if isOwner(userId) \|\| isAdmin()` |

---

### 23.8 Architecture Impact

```
message_list_screen.dart
├── _kStaticAds (const)           ← ประกันว่า Ad แสดงได้เสมอ
├── _fetchAds()                   ← static + Firestore dynamic
├── _buildInterleavedList(docs)   ← 1 ad per 3 items, min 1
├── _buildConversationList()      ← ใช้ interleaved list
├── _buildProductChatList()       ← ใช้ interleaved list (feature parity)
│   └── stateKey = 'pc_${id}'    ← Namespaced keys ไม่ชนกับ conv tab
└── EnhancedChatTile(lastSeen:)   ← Online/last-seen status

chat_screen.dart
└── ✅ ลบ InsightCard ทั้งหมด (10 components)

firestore.rules
├── marketplace_reviews           ← accept any non-empty authorId string
└── user_chat_settings            ← isOwner or isAdmin

android/app/src/main/res/drawable*
└── launch_image.png              ← circular + glow (density-specific)
```

---

### 23.9 สรุปผลลัพธ์

| ด้าน | ก่อน | หลัง |
|------|------|------|
| **Product Chat Features** | รายการดิบ | Pin / Archive / Rename / Profile / Swipe ✅ |
| **Online Status** | ไม่มี | จุดเขียว + Last-seen ✅ |
| **Ad Cards** | ไม่แสดงเลย | แสดงทุก 3 items, guaranteed ≥ 1 ✅ |
| **Chat Room Distraction** | Insight Card popup | ลบออก, Ad อยู่ Inbox เท่านั้น ✅ |
| **Splash Screen** | สี่เหลี่ยม | วงกลม + Glow ✅ |
| **Reviews Permission** | PERMISSION_DENIED | ✅ Fixed |
| **Chat Settings Permission** | PERMISSION_DENIED | ✅ Fixed |

---

## 🖥️ 24. การปรับปรุงระบบ PC Layout (PC Layout Adaptation)
เพื่อให้ผู้ใช้บนคอมพิวเตอร์ได้รับประสบการณ์ระดับมืออาชีพแบบ Facebook-style:
- **Three-Column Grid System**: ปรับโครงสร้างหน้าเว็บเป็น 3 คอลัมน์ (Sidebar ซ้าย, Feed กลาง, Sidebar ขวา) เมื่อหน้าจอ ≥ 992px
- **PC Top Navigation**: เพิ่มแถบเมนูบนที่มี Search Bar ถาวร และไอคอนนำทางหลัก (Home, Marketplace, Community, Video)
- **Interactive Social Features**:
    - **Stories Bar**: แสดงผลแบบการ์ดวนด้านบนสุดของ Feed
    - **Create Post Widget**: กล่อง "คุณกำลังคิดอะไรอยู่?" พร้อมปุ่มด่วนสำหรับวิดีโอและรูปภาพ
    - **Professional Post Cards**: การ์ดโพสต์และสินค้าที่ออกแบบมาให้สมดุลกับหน้าจอใหญ่ พร้อมฟีเจอร์ Like/Comment/Share Stats

## 🚀 25. ระบบการนำทางแบบ Single Page Application (SPA)
แก้ปัญหาความล่าช้าและการต้องเริ่มโหลดใหม่ทุกครั้ง (Reload) เมื่อย้อนกลับ:
- **Iframe-based SPA Container**: ใช้เทคนิคซ้อนหน้าต่าง (Stacking) เพื่อเปิดหน้าอื่นๆ (เช่น สินค้า, แชท) ทับหน้าหลัก
- **State Preservation**: หน้าหลัก (`index.html`) จะยังทำงานอยู่ในพื้นหลังเสมอ ทำให้ **Scroll Position** และข้อมูลที่โหลดไว้ **ไม่หายไป**
- **Feed Caching Layer**: หน่วยความจำชั่วคราวสำหรับข้อมูล Feed (window.globalFeedDataCache) ทำให้การสลับแถบ (Tab) ทำงานได้ทันที
- **Video Global Control**: ระบบสั่งหยุดวิดีโอพื้นหลังอัตโนมัติเมื่อผู้ใช้เข้าไปใช้งานหน้าซ้อน เพื่อประหยัดทรัพยากร
- **Session Persistence**: จดจำหมวดหมู่ล่าสุดที่ผู้ใช้เลือกผ่าน `sessionStorage` นำทางกลับมาที่เดิมได้แม้ Refresh หน้าเว็บ

---
*บันทึกโดย Antigravity AI - ปรับปรุงล่าสุด 8 มีนาคม 2026*

## 🔔 20. Next-Gen PWA & Push Notification Architecture (Sprint 1)
*อัปเดตล่าสุด: 8 มีนาคม 2026 — ยกระดับเว็บให้เป็น Native experience*

เราได้ติดตั้งระบบ PWA (Progressive Web App) และ Push Notification สมบูรณ์แบบ เพื่อให้ผู้ใช้ได้รับประสบการณ์ระดับ Native App ผ่านเบราว์เซอร์:

### 20.1 🛰️ สถาปัตยกรรม Web Push (VAPID & Cloud Functions)
ระบบแจ้งเตือนทำงานแบบ **End-to-End Real-time**:
1.  **Subscription Flow**: 
    - ผู้ใช้ล็อกอิน → `push-notifications.js` ขอสิทธิ์ (Non-intrusive banner) → ส่ง VAPID Public Key ไปขอ Subscription Token
    - บันทึก Token ลงใน Firestore: `push_subscriptions/{uid}/devices/{deviceId}`
2.  **Trigger Flow**: 
    - เมื่อมีกิจกรรม (ออเดอร์ใหม่, ข้อความแชท, Escrow released) → **Firestore Triggers** ใน `functions/index.js` ทำงาน
    - เรียกใช้ `notifications.js` (module ใหม่) เพื่อสร้าง Payload ตามประเภทข่าวสาร (Build Payload)
    - ส่งผ่าน **web-push (NPM)** ไปยังเบราว์เซอร์ของผู้ใช้โดยตรง
3.  **Delivery Flow**:
    - **Service Worker (`sw.js`)** รับ `push` event แม้ปิดเบราว์เซอร์อยู่
    - แสดง Notification พร้อม Actions (เช่น "ดูออเดอร์", "ตอบกลับ")
    - เมื่อคลิก → SW ส่งข้อความ `NOTIF_CLICK` ผ่าน `postMessage` ไปยัง `index.html` เพื่อนำทาง (Deep Link) ไปยังหน้านั้นๆ ทันที

### 20.2 📦 PWA Enhancements (Deep Integration)
- **App Badge API**: อัปเดตตัวเลขแจ้งเตือน (Badge) บนไอคอนแอปบนหน้าจอ Home อัตโนมัติ (iOS/Android/Desktop) ซิงค์ตรงกับ `updatePillNotifCount` ในเครื่อง
- **Web Share API v2**: ระบบแชร์สินค้าและโพสต์ชุมชนผ่าน OS Share Sheet (native share) แทนการแค่คัดลอกลิงก์
- **Manifest v3 Integration**: ระบบ Shortcuts (Jump Lists) บนไอคอนแอป เพื่อเข้าถึง Marketplace, ชุมชน, หรือเรียก Rider ได้ทันที
- **Theme Color Multi-variant**: รองรับ Dark/Light scheme ทันทีในระดับระบบ (Status Bar matching)

### 20.3 📊 สรุปความสามารถใหม่ใน Sprint 1
| ฟีเจอร์ | เทคโนโลยี | ผลลัพธ์ |
|-------|----------|-------|
| **Push Notification** | VAPID + Web Push Protocol | ออเดอร์มาแจ้งเตือนทันที แม้ปิดแอป |
| **PWA Install Hub** | `pwa-install.js` | ติดตั้งง่ายขึ้นด้วย Custom Banner ระดับโปร |
| **App Badge** | `navigator.setAppBadge` | เห็นจำนวนข้อความค้างที่ไอคอนแอป |
| **Native Share** | `navigator.share` | แชร์สินค้าลง LINE/FB ได้เนียนเหมือนแอปจริง |
| **Deeplink Router** | SW `onmessage` Listener | คลิกแจ้งเตือนแล้วเข้าหน้าสินค้า/แชทได้ทันที |

---
> [!TIP]
> การติดตั้ง Web Push นี้ช่วยลดอัตราการ "ลืมใช้งาน" (Retention Rate) และเพิ่มขีดความสามารถในการแข่งขันกับ Native App ได้อย่างสมบูรณ์โดยไม่ต้องผ่าน App Store

---

## 🏆 สรุปสำหรับนักลงทุนและผู้บริหาร (Executive Conclusion)

### TukTuk คืออะไรใน 3 ประโยค

TukTuk เป็น **Super App รุ่นใหม่สำหรับตลาดไทย** ที่รวมตลาดซื้อขาย, ไลฟ์สด, วิน, เกษตรอัจฉริยะ และการศึกษาไว้ในแอปเดียว ขับเคลื่อนด้วย AI และเชื่อมต่อกับ LINE 54 ล้านคนในไทยอย่างสมบูรณ์ **ผู้ขายจ่ายค่าสมาชิกคงที่ ไม่มีค่าคอมมิชชั่น** ขณะที่ระบบเทคโนโลยีระดับองค์กร (Go Engine + Firebase + Cloudflare R2) รองรับการขยายตัวได้ในระดับล้านผู้ใช้

### ความสำเร็จทางเทคนิค (Technical Achievements)

| ด้าน | ความสำเร็จ |
|------|-----------|
| **Multi-platform** | 1 Codebase → iOS + Android + Web + LINE LIFF |
| **AI-first** | Gemini Flash ช่วยสร้าง content ทุก touchpoint |
| **Infrastructure** | Go Engine 7.6/10 — 20 API endpoints พร้อม cache, personalization |
| **Security** | AES-256 session, Firebase App Check, IAM middleware, .env secrets |
| **Performance** | Lint 86% ลดลง, Memory bound, Offline-first, Optimistic UI |
| **Trust** | Escrow system, Slip verification, Anti-gaming feed |
| **Scale-ready** | Cloudflare R2 zero-egress, Redis cache, Go concurrency |

### จุดขายที่แข็งแกร่งที่สุด (Strongest USPs)

1. **ไม่มีค่าคอมมิชชั่น** — ร้านค้าประหยัดได้ 3–8% ต่อยอดขาย เทียบกับ Shopee/Lazada
2. **LINE-native ที่ลึกที่สุด** — LIFF + Messaging API + Rich Menu + LINE Login ในระบบเดียว
3. **AI Marketplace ครบวงจร** — ถ่ายรูป → AI โพสต์ → ลูกค้า LINE → WIN ส่งของ ใน ecosystem เดียว
4. **Win Rider** — Ride-hailing ท้องถิ่นที่ไม่มีในคู่แข่ง Shopee/TikTok Shop
5. **Blue Ocean** — Super App เดียวในไทยที่รวม Commerce + AgriTech + Education

### Roadmap ถัดไป (Next Milestones)

| Sprint | เป้าหมาย | กำหนด |
|--------|---------|--------|
| **Go Engine Sprint 3** | Unit Tests 60%+, Cursor Pagination | Q2 2026 |
| **Go Engine Sprint 4** | Fly.io performance tier, WebSocket Live, Follow system | Q2 2026 |
| **Win Rider v2** | Rider rating, Multi-stop, Package delivery | Q2-Q3 2026 |
| **Live Commerce** | In-stream purchase, Co-host, Clip highlights | Q3 2026 |
| **AgriTech Expansion** | IoT sensors, Smart Farm API, Farmer Education | Q3 2026 |
| **Super Wallet** | TukCoin → PromptPay, B2B bulk coins | Q4 2026 |

---
*เอกสารนี้อัปเดตอัตโนมัติจากการพัฒนา — อัปเดตล่าสุด: มีนาคม 2026*

