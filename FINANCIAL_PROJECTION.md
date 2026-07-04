# 💰 FINANCIAL PROJECTION: TUKTUK ECOSYSTEM
## "ต้นทุน รายได้ และจุดคุ้มทุน (ROI Analysis)"

เอกสารนี้แสดงการประเมินตัวเลขทางการเงิน (Financial Forecast) สำหรับระยะเริ่มต้น (Phase 1-2) โดยอ้างอิงจากโครงสร้างต้นทุนจริงของ Tech Startup และโมเดลรายได้ที่วางแผนไว้

---

## 1. ต้นทุนการพัฒนาและการดำเนินงาน (Cost Structure)

### A. รายจ่ายลงทุนเบื้องต้น (CAPEX - One-time Cost)
*หากจ้างทีมพัฒนาภายนอก หรือประมูลโครงการ (Estimated Value)*
1.  **System Development (Core App & Backend):** 1,500,000 - 2,500,000 THB
    *   Android/iOS App (Flutter)
    *   Seller Dashboard (Web) & Back-office
2.  **UX/UI Design (Glassmorphism & Branding):** 150,000 - 300,000 THB
3.  **Infrastructure Setup (Server/Cloud Init):** 50,000 THB
4.  **Legal & Registration (Company, PDPA):** 30,000 THB
👉 **รวมมูลค่าการลงทุนเริ่มต้น (Estimated): ≈ 2,000,000 - 3,000,000 THB**
*(หมายเหตุ: หากคุณพัฒนาเอง มูลค่านี้คือสินทรัพย์ทางปัญญา (IP Asset) ที่นำไปต่อรองหุ้นได้)*

### B. รายจ่ายดำเนินงานรายเดือน (OPEX - Monthly Burn Rate)
*ประเมินที่ฐานผู้ใช้งาน (Active Users) 10,000 - 50,000 คน*
1.  **Cloud Server (Firebase Blaze Plan):**
    *   *Firestore (Database):* 3,000 - 5,000 THB (Optimized Reads)
    *   *Storage & Bandwidth (Video/Images):* 10,000 - 20,000 THB (วิดีโอคือส่วนที่แพงที่สุด)
    *   *Authentication (SMS OTP):* 2,000 - 5,000 THB
2.  **Third-party APIs:**
    *   *Google Maps Platform:* 5,000 - 10,000 THB (ใช้โควต้าเครดิตฟรี $200 แรกช่วยได้)
3.  **Personnel (ทีมงาน):**
    *   *Admin/Support (2 คน):* 30,000 - 40,000 THB (หรือใช้ AI Chatbot ช่วยลดคน)
    *   *Marketing (Ads Budget):* 20,000 - 50,000 THB
👉 **รวมค่าใช้จ่ายรายเดือน (Estimated): ≈ 70,000 - 130,000 THB / เดือน**

---

## 2. ประมาณการรายได้ (Revenue Projection)

### Scenario 1: ระยะเริ่มต้น (Conservative - 5,000 Users / 100 Shops)
*เป้าหมาย: สร้างความเชื่อมั่นและข้อมูลในระบบ*
1.  **Pro Sellers Subscription:** 20 ร้านค้า x 199 บ. = 3,980 THB
2.  **Transaction Fee (3%):** ยอดขายรวม 500,000 บ. = 15,000 THB
3.  **TukTuk Coins (Ad Boost):** 50 ครั้ง x 50 บ. = 2,500 THB
👉 **รายได้รวม: ≈ 21,480 THB / เดือน** *(ยังขาดทุนสะสม - ช่วงเผาเงินสร้างฐาน)*

### Scenario 2: ระยะเติบโต (Moderate - 50,000 Users / 1,000 Shops)
*เป้าหมาย: เริ่มมีกำไรจากการดำเนินงาน (Operational Profit)*
1.  **Pro Sellers Subscription (20% conversion):** 200 ร้านค้า x 199 บ. = **39,800 THB**
2.  **Transaction Fee (3%):** ยอดขายรวม 5,000,000 บ. = **150,000 THB**
3.  **Service Booking Fee (Lead Gen):** 500 งานสำเร็จ x 20 บ. = **10,000 THB**
4.  **Ad Tech (Sponsor/Pins):** 100 ร้านค้า x 500 บ.(เหมา) = **50,000 THB**
👉 **รายได้รวม: ≈ 249,800 THB / เดือน** *(กำไรสุทธิ ≈ 120,000+ THB หลังหัก OPEX)*

### Scenario 3: ระยะขยายตัว (Aggressive - 500,000+ Users / 10,000 Shops)
*เป้าหมาย: เป็นผู้นำตลาดในภูมิภาค*
1.  **Recurring Revenue (Subs + Ads):** ≈ 1,500,000 THB
2.  **Transaction & Service Fees:** ≈ 3,000,000 THB
👉 **รายได้รวม: ≈ 4,500,000+ THB / เดือน**

---

## 3. จุดคุ้มทุน (Break-even Point Analysis)
เพื่อให้คุ้มทุนค่าใช้จ่ายรายเดือน (≈ 100,000 บาท) คุณต้องมี:
1.  **Active Sellers:** อย่างน้อย **500 ร้านค้า** (ที่จ่ายค่า Pro หรือลงโฆษณา)
2.  **Transaction Volume:** ยอดขายหมุนเวียนในแอป (GMV) ประมาณ **3.3 ล้านบาท/เดือน** (เพื่อให้ได้ fee 100k)

**กลยุทธ์แนะนำเพื่อถึงจุดคุ้มทุนเร็วขึ้น:**
*   เน้นขาย **"แพ็คเกจเหมาจ่ายรายปี"** ให้ร้านค้า (เช่น 2,000 บาท/ปี) เพื่อดึงเงินสดก้อนแรก (Cash Upfront) มาหมุนเวียน
*   จับมือกับ **"อบต./เทศบาล"** เพื่อของบสนับสนุนโครงการ Digital Community (Smart City) เป็นรายได้ทางอ้อม (B2G)

---
**Prepared Analysis:** February 2026
**Note:** ตัวเลขนี้เป็นการประเมินเบื้องต้น ต้นทุนจริงอาจแปรผันตาม Traffic และนโยบายของผู้ให้บริการ Cloud (Google/Firebase)
