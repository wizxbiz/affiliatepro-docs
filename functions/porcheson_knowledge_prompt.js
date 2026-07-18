/**
 * =====================================================
 * 🏭 PORCHESON TX118 V3.0 KNOWLEDGE DATABASE
 * =====================================================
 *
 * ระบบฐานความรู้สำหรับบอร์ดควบคุมเครื่องฉีดพลาสติก PORCHESON
 * รองรับรุ่น PS660AM, PS860AM, PS960AM
 *
 * พัฒนาโดย: อาจารย์วิทยา
 * Version: 1.0.0
 */

// =====================================================
// 📚 PORCHESON KNOWLEDGE PROMPT
// =====================================================

const PORCHESON_KNOWLEDGE_PROMPT = `
## 🏭 ความรู้เฉพาะทาง: ระบบควบคุม PORCHESON TX118 V3.0

คุณมีความเชี่ยวชาญพิเศษด้านระบบควบคุมเครื่องฉีดพลาสติก PORCHESON รุ่น TX118 V3.0 
ซึ่งรองรับบอร์ดควบคุม PS660AM, PS860AM และ PS960AM

### 📋 ข้อมูลระบบ PORCHESON

**รุ่นบอร์ดควบคุมที่รองรับ:**
- PS660AM: 24 input / 24+7+3 Electronic Ruler
- PS860AM: 27/28 input + 10+6 Electronic Ruler  
- PS960AM: 48 input / 48+7+4 Electronic Ruler + 4 Pressure Sensor

**รุ่นคีย์บอร์ด:**
- TB118: จอสี 800x480, 7 นิ้ว
- TC118: จอสี 800x480, 7 นิ้ว (พร้อม Touch + Fingerprint)
- TH118: จอสี 800x480, 10.2 นิ้ว (พร้อม Touch + Fingerprint + CAN-bus)

**คุณสมบัติหลักของระบบ:**
1. ออกแบบ Dual CPU ความเร็วสูง ควบคุมแม่นยำ เสถียร
2. จอ LCD สีสว่าง 800x480 พิกเซล
3. เก็บข้อมูลแม่พิมพ์ได้ 999 ชุด พร้อมตั้งชื่อภาษาไทย/อังกฤษ
4. ควบคุมอุณหภูมิ PID 6+1 โซน (รองรับถึง 10 โซนใน PS960AM)
5. รองรับ Ethernet เชื่อมต่อเครือข่ายจัดการได้ 255 เครื่อง
6. ระบบลายนิ้วมือ 6 ระดับสิทธิ์
7. รองรับ USB อัปโหลด/ดาวน์โหลดข้อมูล

---

### ⚙️ การติดตั้งและ Debug ระบบ (Installation & Debugging)

**ข้อควรระวังในการติดตั้ง:**
1. ติดตั้งตู้ควบคุมในที่มีการระบายอากาศดี กันน้ำมันและฝุ่น
2. อุณหภูมิภายในตู้ไม่เกิน 50°C
3. แยกสายไฟแรงดันสูงออกจากสายควบคุมคอมพิวเตอร์
4. สายดินต้องมีความต้านทานต่ำกว่า 10 โอห์ม
5. ห้ามตัดต่อหรือดัดแปลงสายไฟโดยพลการ

**ขั้นตอนตรวจสอบหลังติดตั้ง:**
1. ตรวจสอบการเชื่อมต่อสายทั้งหมด
2. ตรวจวัดแรงดันไฟจาก Power Pack PW450 ก่อนเปิดใช้งาน
3. แรงดันออก: +5V (3A), +24V (3A/8A), +38V/+40V (3A)
4. เมื่อเปิดเครื่อง หน้าจอ LCD จะแสดงหน้าหลัก ไฟ RUN กระพริบ
5. หมุนสวิตช์หยุดฉุกเฉินเพื่อตรวจสอบการทำงาน

**การเชื่อมต่อประตูนิรภัย (Safety Door):**

*Mode 1 (PS860AM):*
- ประตูหน้า: X00, X01 (Front Door 1, 2)
- ประตูหลัง: X15, X16 (Back Door 1, 2)
- เมื่อ X00=ON/X15=OFF หรือ X00=OFF/X15=ON ระบบจะ Alarm "Safety Door Failure" ใน 2 วินาที

*Mode 2:*
- ประตูหน้า: X00
- ประตูหลัง: X15

**ในโหมด Semi-Auto:**
- เงื่อนไขเปิด/ปิดประตู: เวลาจาก LS1,LS2,LS3,LS4 ทั้งหมด OFF ไปเป็น ON ต้องมากกว่า 0.5 วินาที
- เพื่อป้องกันสวิตช์กระตุกทำให้เกิดการทำงานผิดพลาด

---

### 🎛️ ปุ่มควบคุมและฟังก์ชัน (Key Operations)

**ปุ่มฟังก์ชันหลัก:**
| ปุ่ม | ฟังก์ชัน |
|------|----------|
| M.PLT | ตั้งค่าการเปิด/ปิดแม่พิมพ์ |
| INJECTION | ตั้งค่าการฉีดและรักษาแรงดัน |
| FEEDING | ตั้งค่าการป้อนวัตถุดิบและดูดกลับ |
| NOZZ/ADJ | ตั้งค่าหัวฉีดและปรับแม่พิมพ์ |
| EJE/CORE | ตั้งค่าการกระทุ้งและแกน |
| TIME | ตั้งค่าเวลาและจำนวนนับ |
| TEMP | ตั้งค่าอุณหภูมิและอุ่นล่วงหน้า |
| DATUM | ตั้งค่าข้อมูลแม่พิมพ์ |
| MONITOR | กลับหน้าจอหลัก |
| HELP | แสดงคำแนะนำออนไลน์ |
| CELERITY SET | ตั้งค่าเร็ว 1, 2 |

**โหมดการทำงาน:**
| ปุ่ม | โหมด | หมายเหตุ |
|------|------|----------|
| MANUAL | แมนนวล | ค่าเริ่มต้นเมื่อเปิดเครื่อง |
| SEMI.AUTO | กึ่งอัตโนมัติ | ต้องรออุณหภูมิถึงค่าที่ตั้ง |
| SENR.AUTO | อัตโนมัติตามเซ็นเซอร์ | Electric Eye |
| TIME.AUTO | อัตโนมัติตามเวลา | |

**ปุ่มควบคุมความร้อนและมอเตอร์:**
- HEATER ON/OFF: เปิด/ปิดระบบทำความร้อน
- MOTOR ON/OFF: เปิด/ปิดมอเตอร์ไฮดรอลิก
- กดซ้ำเพื่อสลับ ON/OFF
- เมื่อกด Emergency Stop มอเตอร์จะหยุดทันทีแต่ไม่กระทบระบบความร้อน

---

### 🔧 ปุ่มควบคุมแมนนวล (Manual Operation Keys)

**การควบคุมแม่พิมพ์:**
| ปุ่ม | การทำงาน | เงื่อนไข |
|------|----------|----------|
| MOLD CLOSE | ปิดแม่พิมพ์ | ประตูนิรภัยปิด, แท่งกระทุ้งถอยกลับ, ยังไม่ถึงตำแหน่งสุด, สัญญาณ Robot (ถ้าเลือกใช้) |
| MOLD OPEN | เปิดแม่พิมพ์ | ยังไม่ถึงตำแหน่งสุด |
| MOLD THIN | ปรับแม่พิมพ์บาง | เลือกใช้โหมดปรับแม่พิมพ์, ยังไม่ถึงตำแหน่งสุด |
| MOLD THICK | ปรับแม่พิมพ์หนา | ยังไม่ถึงตำแหน่งสุด |

**การควบคุมการฉีด:**
| ปุ่ม | การทำงาน | เงื่อนไข |
|------|----------|----------|
| INJECT | ฉีดพลาสติก | อุณหภูมิอยู่ในช่วง (ไม่มี Temp Alarm), เวลา/ตำแหน่งยังไม่ครบ |
| CHARGE | ป้อนเม็ดพลาสติก | อุณหภูมิปกติ, ผ่านเวลา Cold Start, ยังไม่ถึงตำแหน่งสุด |
| SUCK BACK | ดูดกลับ | เวลา/ตำแหน่งยังไม่ครบ |
| AUTO PURGE | ล้างวัตถุดิบอัตโนมัติ | เลือกใช้ฟังก์ชัน, จำนวนครั้งยังไม่ครบ |

**การควบคุมกระทุ้งและแกน:**
| ปุ่ม | การทำงาน | เงื่อนไข |
|------|----------|----------|
| EJECT ADV. | กระทุ้งออก | แม่พิมพ์เปิดถึงตำแหน่ง, แกนถอยกลับ (ถ้าใช้) |
| EJECT RET. | กระทุ้งกลับ | เวลา/ตำแหน่งยังไม่ครบ |
| EJECTOR | กระทุ้งหลายครั้ง | เหมือนกระทุ้งออก/กลับ |
| CORE A IN/OUT | แกน A เข้า/ออก | เลือกใช้แกน A, ตำแหน่ง/เวลายังไม่ครบ |
| CORE B IN/OUT | แกน B เข้า/ออก | เลือกใช้แกน B, ตำแหน่ง/เวลายังไม่ครบ |

**การควบคุมหัวฉีดและอื่นๆ:**
| ปุ่ม | การทำงาน | เงื่อนไข |
|------|----------|----------|
| NOZZLE ADV. | หัวฉีดเข้า | ขึ้นกับการตั้งค่า Block Limit |
| NOZZLE RET. | หัวฉีดออก | ไม่มีเงื่อนไข |
| AIR BLST. MOV. | เป่าลมแม่พิมพ์ตัวผู้ | เลือกใช้, เวลายังไม่หมด |
| AIR BLST. STN. | เป่าลมแม่พิมพ์ตัวเมีย | เลือกใช้, เวลายังไม่หมด |
| LUBR. | หล่อลื่น | เวลาหล่อลื่นยังไม่หมด |
| MOLD ADJ. | เลือกโหมดปรับแม่พิมพ์ | กดครั้งแรก=แมนนวล, กดซ้ำ=อัตโนมัติ |

---

### 🚨 ระบบแจ้งเตือน (Alarm System)

**รายการ Alarm และวิธีแก้ไข:**

| Alarm | สาเหตุ | วิธีแก้ไข |
|-------|--------|-----------|
| Exits unclosed | ประตูนิรภัยไม่ปิด ในโหมด Semi-Auto | ตรวจสอบสวิตช์ X00, X01, X15, X16 |
| Failure of sensor inspection | เซ็นเซอร์ไม่ทำงานหลังกระทุ้งกลับ | ตรวจสอบการเชื่อมต่อ X04, สายสัญญาณ, ตัวเซ็นเซอร์ |
| Mold opening not fixed | แม่พิมพ์เปิดไม่ถึงตำแหน่ง (Manual Eject Adv.) | ตรวจสอบตำแหน่ง, ไม้บรรทัดอิเล็กทรอนิกส์, X12 |
| Low pressure mold protecting time over | เวลาป้องกันแรงดันต่ำหมด | ตรวจสอบสิ่งกีดขวางในแม่พิมพ์, เพิ่มเวลาป้องกัน |
| Failure of Exit | กระทุ้งไม่ทำงาน | แก้ไขปัญหาที่กระทุ้ง, ตรวจสอบสวิตช์จำกัด |
| Plastic melting not completed | ป้อนเม็ดไม่ทันเวลา | ตรวจสอบวัตถุดิบ, เพิ่มเวลาป้อน |
| Failure of plastic injection | ไม้บรรทัด/สวิตช์ X20 ไม่ถึงจุด | ปรับค่า deviation, ตรวจสอบกระบวนการฉีด |
| Failure of motor | มอเตอร์ขัดข้อง | ตรวจสอบ Relay ป้องกัน Overload, X27 |
| Cycle time over | รอบการผลิตนานเกินค่าตั้ง | เพิ่มค่า Cycle Time |
| Clamping/mold open not fixed | ปิด/เปิดแม่พิมพ์ไม่ทันเวลา | ตรวจสอบกระบวนการ, เพิ่มเวลาจำกัด |
| Knockout core A/B not completed | แกน A/B ไม่เสร็จสมบูรณ์ | ตรวจสอบสวิตช์ X25, X26, X30, X31 |
| Set output reached | ถึงจำนวนผลิตที่ตั้ง | รีเซ็ตจำนวน หรือ ปิดฟังก์ชัน "Stop after alarm" |

**Alarm อุณหภูมิ:**
- High temperature: อุณหภูมิจริง > (ค่าตั้ง + ค่าเบี่ยงเบนบน)
- Low temperature: อุณหภูมิจริง < (ค่าตั้ง - ค่าเบี่ยงเบนล่าง)
- Temperature short circuit: วงจร Thermocouple ขาด

---

### 📊 หน้าจอตั้งค่าการทำงาน (Setting Pages)

**1. ตั้งค่าปิดแม่พิมพ์ (Mold Close):**
- กระบวนการ: ปิดช้า → ปิดเร็ว → แรงดันต่ำ → แรงดันสูง
- พารามิเตอร์: Pressure, Flux, Place (ตำแหน่ง mm)
- Slow mold close time: เวลาปิดช้า (เมื่อไม่ใช้ Electronic Ruler)
- Low pressure protect time: เวลาป้องกันแรงดันต่ำ (ตั้งให้พอดี ไม่ยาวเกินไป)
- Mold close limit: เวลาจำกัดการปิด (ตั้งให้นานกว่าเวลาจริง)
- Differential mold close: เปิด/ปิด Y12 สำหรับปิดแม่พิมพ์เร็ว

**2. ตั้งค่าเปิดแม่พิมพ์ (Mold Open):**
- กระบวนการ: เปิดช้า → เปิดเร็ว → เปิดกลาง → เปิดต่ำ
- พารามิเตอร์: Pressure, Flux, Place
- Mechanic hand: เปิดใช้เมื่อต้องการส่งสัญญาณ Robot

**3. ตั้งค่าการฉีด (Injection):**
- กระบวนการ: ฉีดขั้น 1 → 2 → 3 → 4 → 5 → รักษาแรงดัน
- พารามิเตอร์: Pressure, Flux, Place/Time ของแต่ละขั้น
- Injector total time: เวลาฉีดทั้งหมด (ตั้งให้นานกว่าเวลาจริง)
- Injector method: 
  * ใช้ Electronic Ruler: เลือก Position หรือ Time
  * ไม่ใช้ Electronic Ruler: เลือก Trip หรือ Time

**4. ตั้งค่ารักษาแรงดัน (Hold Pressure):**
- กระบวนการ: รักษาแรงดัน 1 → 2 → 3 → 4 → หน่วงเวลาป้อนเม็ด
- พารามิเตอร์: Pressure, Flux, Time, Slope ของแต่ละขั้น
- Slope: ควบคุมความชันการเปลี่ยนแรงดัน (1.0-16.0)
- Injection check: ตรวจสอบตำแหน่งสกรูขณะรักษาแรงดัน

**5. ตั้งค่าป้อนเม็ด/ดูดกลับ/หล่อเย็น (Feed/Suck back/Cooling):**
- กระบวนการ: ดูดกลับหน้า → ป้อน 1 → ป้อน 2 → ดูดกลับหลัง
- พารามิเตอร์: Pressure, Flux, Back pressure, Place
- Feed limit time: เวลาจำกัดการป้อน (Alarm "Plastic melting not completed" ถ้าหมดเวลา)
- Cooling time: เวลาหล่อเย็น (เริ่มนับหลังรักษาแรงดัน)

**6. ตั้งค่าหัวฉีด (Nozzle):**
- พารามิเตอร์: Pressure, Flux สำหรับ Advance slow/fast, Return
- Auto Nozzle return: ถอยหัวฉีดอัตโนมัติ (ปิด/ป้อนเม็ดเสร็จ/หล่อเย็นเสร็จ)
- Nozzle return end method: Position หรือ Time

**7. ตั้งค่าปรับแม่พิมพ์ (Mold Adjusting):**
- Adjust method: Manual หรือ Auto
- Fine adjust method: Time หรือ Gear number
- แรงดันปรับแม่พิมพ์: 20-50 bar, ความเร็ว: 30-60%
- วิธีใช้ Auto: กดปุ่ม Mold Adj. แล้วกด Auto Mold Adjusting

**8. ตั้งค่ากระทุ้ง (Ejector):**
- Ejector times: จำนวนครั้งกระทุ้ง
- Ejector method: 
  * Times: กระทุ้งตามจำนวนครั้ง
  * Vibrating: กระทุ้งสั่น
  * Retaining: ค้างไว้จนกว่าจะปิดแม่พิมพ์รอบถัดไป
- Forward/Backward delay: เวลาหน่วง
- Keep: แรงดัน/อัตราไหล/เวลาค้างหลังกระทุ้งเสร็จ

**9. ตั้งค่าแกน (Core A/B/C/D):**
- Core function: เปิด/ปิดการใช้งาน
- Method: Time, Stroke, Count (สำหรับเกลียว)
- Start way: ตำแหน่งเริ่มต้น (ก่อนปิดแม่พิมพ์, ก่อนแรงดันต่ำ, ก่อนแรงดันสูง, ปิดแม่พิมพ์หยุด, ฯลฯ)
- Start place: ตำแหน่งเริ่มต้นเป็น mm

**10. ตั้งค่าเป่าลม (Air Blow):**
- Function method: เปิด/ปิด
- Delay: เวลาหน่วงก่อนเป่า
- Time: เวลาเป่า
- Start way: ก่อน/หลังเปิดแม่พิมพ์

**11. ตั้งค่าเวลา/จำนวนนับ (Time/Count):**
- Lubricate mold number: จำนวนแม่พิมพ์ก่อนหล่อลื่น
- Lubricate total time: เวลาหล่อลื่นทั้งหมด
- Lubricate time: เวลาหล่อลื่นแต่ละครั้ง
- Lubricate intermittent: เวลาพักระหว่างหล่อลื่น
- Cycle waiting time: เวลารอระหว่างรอบ
- Cycle time: เวลาจำกัดรอบการผลิต
- Manual action time limit: เวลาจำกัดการทำงานแมนนวล
- Fault alarm time: เวลาสัญญาณเตือนสูงสุด

**12. ตั้งค่าอุณหภูมิ (Temperature):**
- แสดงและตั้งค่า: Nozzle, Segment 1-5, Oil temperature
- Actual/Setup: อุณหภูมิจริง/ค่าตั้ง
- Maximum/Minimum: ค่าเบี่ยงเบนบน/ล่าง
- Ejector method: Open-loop / Close-loop
- Half temperature: อุ่นครึ่งค่าก่อนเปิดใช้งาน
- Cold boot: เวลา Cold Start ก่อนป้อนเม็ด/ฉีด

**ข้อมูลอ้างอิงอุณหภูมิพลาสติก:**
| วัสดุ | ความหนาแน่น | อุณหภูมิ (°C) |
|-------|-------------|---------------|
| ABS | 1.01-1.05 | 190-270 |
| PS | 1.05 | 190-240 |
| PP | 0.98-0.90 | 200-290 |
| PC | 1.2-1.22 | 280-320 |
| POM | 1.41-1.42 | 190-230 |
| PA/NYLON | 1.08-1.17 | 230-290 |
| NYLON66 | 1.03-1.15 | 280-330 |
| PVC/S | 1.20-1.40 | 150-180 |
| PVC/H | 1.30-1.58 | 160-200 |
| PET | 1.38-1.41 | 280-310 |
| PMMA | 1.17-1.20 | 180-260 |
| PPO | 1.08-1.09 | 260-330 |

**13. ตั้งค่าอุ่นล่วงหน้า (Pre-heat):**
- ตั้งเวลาเปิด/ปิดความร้อนล่วงหน้า 7 วัน
- ใช้รูปแบบ 24 ชั่วโมง (00:00 = เที่ยงคืน)

**14. ตั้งค่าข้อมูลแม่พิมพ์ (Mold Data):**
- เก็บได้ 999 ชุด
- ฟังก์ชัน: Save, Read, Delete, Browse
- Read: ทำได้เฉพาะในโหมด Manual เพื่อป้องกันอุบัติเหตุ

---

### 🛠️ การตั้งค่าวิศวกรรม (Engineer Settings)

**ต้องใส่รหัสผ่านเพื่อเข้าถึง**

**1. Delay Setting:**
- Start Delay: หน่วงเวลาก่อนเปิดวาล์ว → แรงดัน → อัตราไหล
- End Delay: หน่วงเวลาก่อนปิดแรงดัน → อัตราไหล → วาล์ว
- ช่วงตั้งค่า: 0.0-0.5 หรือ 0.0-2.0 วินาที

**2. Pressure/Flow Slope:**
- ควบคุมความชันการเปลี่ยนแรงดัน/อัตราไหล
- 1.0 = เปลี่ยนช้าที่สุด, 16.0 = เปลี่ยนเร็วที่สุด

**3. Pressure Pre-adjustment:**
- ปรับค่าแรงดัน 0-160 bar ให้ตรงกับเกจวัด
- ใช้ Initial data กระจายค่าเริ่มต้น
- กระแสมาตรฐาน: 0-800mA, Impedance: 10-20Ω

**4. Flow Pre-adjustment:**
- ปรับค่าอัตราไหล 0-99% ให้ตรงกับ Tachometer
- กระแสมาตรฐาน: 0-800mA, Impedance: 40Ω

**5. Back Pressure Pre-adjustment:**
- ปรับค่าแรงดันหลัง 0-160 bar
- ทำงานคล้าย Pressure Pre-adjustment

**6. Electronic Ruler Setting:**
- Function: Enable/Disable
- Value: ค่าตำแหน่งปัจจุบัน
- Total: ความยาวทั้งหมด
- Limit: ตำแหน่งสูงสุดที่ตั้งได้
- Set zero: ปรับศูนย์

**7. Special Functions:**
- Motor idle running & auto stop: หยุดมอเตอร์อัตโนมัติเมื่อไม่ใช้งาน (2-99 นาที)
- Motor Y-Δ conversion: การแปลงสตาร์ท-เดลต้า (2.0-99.9 วินาที)
- Manual base advance limit: จำกัดการเคลื่อนที่หัวฉีดแมนนวล
- Mold opening with melt: เปิดแม่พิมพ์พร้อมป้อนเม็ด
- Melt key locking: ล็อคปุ่มป้อนเม็ด
- Core start method: Position หรือ Stroke
- Ejector stop type: Stroke หรือ Time
- Mold adjustment activation: Hydraulic หรือ Electric
- High temperature alarm: เตือนอุณหภูมิสูง
- Injector protective cover: ใช้ฝาครอบป้องกัน X02

**8. Pressure/Flux Upper Limit:**
- กำหนดค่าสูงสุดที่ตั้งได้ในแต่ละการทำงาน

**9. Lubrication Settings:**
- First mold lubrication: หล่อลื่นเมื่อเปิดมอเตอร์ครั้งแรก
- Interval lubrication: หล่อลื่นเป็นช่วงๆ
- Oil lack delay alarm: เตือนเมื่อน้ำมันหล่อลื่นไม่พอ X32

**10. Standby Function:**
- โอนย้ายจุด Output: เมื่อจุดใดเสียหาย โอนไปใช้จุดอื่น
- โอนย้ายจุด Input: เมื่อจุดใดเสียหาย โอนไปใช้จุดอื่น

**11. Programmable Standby Function:**
- กำหนด Output พิเศษให้ทำงานในช่วงที่ต้องการ
- เช่น Y01 ทำงานระหว่าง [High Pressure] ถึง [Feed Complete]
- รหัส: A=fast mold close, B=low pressure, C=high pressure, D=mold close stop, E=nozzle advance, F=inject, G=hold pressure, H=feed, I=inject return, J=nozzle return, K=mold open slow, L=fast mold open, M=low mold open, N=ejector, O=core, P=mold adjust

**12. Temperature Parameter:**
- P (Proportion): ค่าสัดส่วน (0-300)
- D (Differential): ค่าอนุพันธ์ (0-300)
- Oil temperature alarm: เตือนอุณหภูมิน้ำมัน

**13. Servo Driver Setup (PS960AM):**
- ตั้งค่าพารามิเตอร์ Servo Driver
- รองรับ CAN communication

---

### 📈 ระบบจัดการการผลิต (Production Management)

**1. Production Information:**
- Setup mold number: จำนวนแม่พิมพ์ที่ตั้งผลิต
- One mold number: จำนวนชิ้นต่อแม่พิมพ์
- Output number: จำนวนผลผลิต
- Good product: จำนวนชิ้นงานดี
- Inferior product: จำนวนชิ้นงานเสีย
- Warn stop: หยุดเมื่อถึงจำนวน (Enable/Disable)

**2. SPC Tracking Record:**
- บันทึก 9 พารามิเตอร์สำคัญ
- เก็บ 999 รายการล่าสุด
- Intermittent cycle: บันทึกทุกกี่รอบ
- Recording cycle: จำนวนรอบที่บันทึก

**3. Pressure/Speed Curve:**
- แสดงกราฟแรงดันฉีด, แรงดันรักษา, แรงดันปิดแม่พิมพ์

**4. Temperature Track Curve:**
- แสดงประวัติอุณหภูมิย้อนหลัง 6 ชั่วโมง
- ช่วงเวลาบันทึก: 5 นาที

**5. Alarm History:**
- เก็บ 999 รายการ Alarm ล่าสุด

**6. Amend History:**
- บันทึกการแก้ไขพารามิเตอร์ 999 รายการ

---

### 🔌 Input/Output Mapping

**PS660AM Input (28 จุด):**
- X00-X07: Front door, Low/High pressure, Mold close stop, Electric Eye, Feed stop, Nozzle advance/return stop
- X10-X17: Fast/Slow mold open, Mold open stop, Ejector advance/return stop, Back door, Inject check, Inject Segment 2
- X20-X27: Inject Segment 3, Mold adjust stop (front/back), Core B advance/return stop, Core A advance/return stop, Motor fault

**PS860AM Input (33 จุด):**
- X00-X07: Front door 1/2, Injector protective cover, Mold close stop, Electric Eye, Feed rotation speed, Nozzle stop (before/after)
- X10-X17: Standby x2, Ejector return fender, Ejector stop (before/return), Back door 1/2, Motor start
- X20-X27: Fine adjust teeth number, Mold adjust stop (front/back), Mechanic hand (mold close/eject), Core A in/out, Motor fault
- X30-X32: Core B advance/return, Oil short

**PS860AM Output (34 จุด):**
- Y00-Y07: Mold close, Nozzle advance, Inject, Feed, Suck back, Nozzle return, Mold open, Ejector advance
- Y10-Y17: Ejector return, Mold thin, Differential mold close, Mold thick, Machine mold open/ejector stop, Low/High pressure mold close
- Y20-Y27: Fault alarm, Big pump, Middle pump, Mold open buffer, Core A in/out, Core B in/out
- Y30-Y33: Blow male/female, Standby x2

**Proportional Valve Output:**
- P: Pressure proportional valve
- F/S: Flow/Speed proportional valve
- Back Pressure: Back pressure proportional valve (PS860AM+)

**Temperature Control (HC0-HC5):**
- HC0: Nozzle
- HC1-HC5: Segment 1-5
- Oil temperature: แสดงค่าอย่างเดียว (ไม่ควบคุม)

---

### 🌐 ระบบเครือข่าย (Network)

**Ethernet Configuration:**
- IP Address, Subnet Mask, Gateway
- Remote OPWIN Update: Allow/Forbid
- รองรับการจัดการ 255 เครื่องจาก PC เดียว

**CAN-bus (TH118):**
- รองรับ 1 คีย์บอร์ดเชื่อมต่อหลายบอร์ดควบคุม
- Own ID และ Acceptance ID (5 คู่)

---

### 👆 ระบบลายนิ้วมือ (Fingerprint System)

**ระดับสิทธิ์ 6 ระดับ:**
1. Average (ทั่วไป)
2. Manage (จัดการ)
3. System (ระบบ)
4. Intermediate (กลาง)
5. Advanced (สูง)
6. Super (สูงสุด)

**Fingerprint Logon List:**
- บันทึก: ชื่อ, ระดับ, เวลา Login/Logout, จำนวนผลิต

---

### 💾 USB Functions

- Formula download/upload: ดาวน์โหลด/อัปโหลดข้อมูลแม่พิมพ์
- System download/upload: ดาวน์โหลด/อัปโหลดข้อมูลระบบ
- Host replication: อัปเดตโปรแกรมบอร์ดควบคุม (.PIN)
- Update OPWIN: อัปเดตโปรแกรมคีย์บอร์ด (.PS6)
- Update background: อัปเดตหน้าจอเริ่มต้น (.BMP)

---

### 📐 ขนาดติดตั้ง

**คีย์บอร์ด:**
| รุ่น | กว้าง x สูง (mm) |
|------|-----------------|
| TB118 | 470 x 228 |
| TC118 | 470 x 250 |
| TH118 | 510 x 280 |

**บอร์ดควบคุม:**
| รุ่น | กว้าง x สูง (mm) |
|------|-----------------|
| PS660AM | 170 x 190 |
| PS860AM | 210 x 300 |
| PS960AM | 242 x 355 |

**Power Supply:**
- PW450: 125 x 248 mm

---

### ⚡ การลดสัญญาณรบกวน (Interference Suppression)

**1. Contact Interference:**
- ติดตั้ง RC Snubber ขนานกับหน้าสัมผัส

**2. Coil Interference:**
- ติดตั้ง Diode ขนานกับคอยล์ (Flyback Diode)

**3. Motor End Interference:**
- ติดตั้ง Capacitor และ RC Filter ที่ขั้วมอเตอร์

---

### 🔧 การแก้ปัญหาเบื้องต้น (Troubleshooting)

**ปัญหา: หน้าจอไม่แสดงผล**
1. ตรวจสอบสาย 15-core ระหว่างคีย์บอร์ดและบอร์ดหลัก
2. ตรวจสอบแรงดันไฟจาก Power Pack
3. ตรวจสอบการเชื่อมต่อ DC plug

**ปัญหา: ไฟ RUN ไม่กระพริบ**
1. หมุนสวิตช์ Emergency Stop
2. ตรวจสอบการเชื่อมต่อ Emergency circuit

**ปัญหา: วาล์วไม่ทำงาน**
1. ตรวจสอบ YCOM (Oil valve outlet public port)
2. ตรวจสอบการเชื่อมต่อ Output
3. ตรวจสอบหน้าจอ Output Check

**ปัญหา: อุณหภูมิไม่ถึงค่าที่ตั้ง**
1. ตรวจสอบ Thermocouple (K-type)
2. ตรวจสอบ Heater และ SSR/Relay
3. ตรวจสอบค่า PID

**ปัญหา: ไม้บรรทัดอิเล็กทรอนิกส์แสดงค่าผิด**
1. ตรวจสอบการเชื่อมต่อสายสัญญาณ
2. ตรวจสอบค่า Total Length
3. ทำ Set Zero ใหม่

---

## 🎯 วิธีการตอบคำถามเกี่ยวกับ PORCHESON

เมื่อได้รับคำถามเกี่ยวกับระบบ PORCHESON ให้ตอบด้วย:

1. **ระบุรุ่นและหน้าจอที่เกี่ยวข้อง** - บอกว่าคำตอบนี้ใช้กับรุ่นใด
2. **อ้างอิงตำแหน่งในเมนู** - บอกว่าอยู่หน้าจอไหน กดปุ่มอะไร
3. **ให้ค่าพารามิเตอร์ที่ชัดเจน** - ระบุช่วงค่าและหน่วย
4. **อธิบายความเชื่อมโยง** - บอกว่าส่งผลต่ออะไรบ้าง
5. **เตือนข้อควรระวัง** - ระบุสิ่งที่อาจทำให้เกิดปัญหา

**ตัวอย่างการตอบ:**
"สำหรับการตั้งค่าเวลาป้องกันแรงดันต่ำ (Low Pressure Protect Time) ใน PS860AM:
- กดปุ่ม M.PLT เพื่อเข้าหน้าจอ Mold Close
- ค่าอยู่ที่ช่อง 'low pressure protect(s)'
- ช่วงตั้งค่า: 0.00-600.00 วินาที
- แนะนำ: ตั้งให้พอดีกับเวลาจริงที่ใช้ปิดแม่พิมพ์ช่วงแรงดันต่ำ +10%
- หากตั้งน้อยเกินไป จะ Alarm 'Low pressure mold protecting time over' บ่อย
- หากตั้งมากเกินไป จะไม่สามารถป้องกันแม่พิมพ์เมื่อมีสิ่งกีดขวาง"

`;

// =====================================================
// 📚 PORCHESON QUICK REFERENCE DATABASE
// =====================================================

const PORCHESON_QUICK_REFERENCE = {
  // ข้อมูลรุ่น
  models: {
    controllers: {
      "PS660AM": {inputs: 24, outputs: "24+7+3 Electronic Ruler", features: "Basic"},
      "PS860AM": {inputs: "27/28", outputs: "10+6 Electronic Ruler", features: "Standard"},
      "PS960AM": {inputs: 48, outputs: "48+7+4 Electronic Ruler + 4 Pressure Sensor", features: "Advanced"},
    },
    keyboards: {
      "TB118": {display: "7 inch", resolution: "800x480", touch: false, fingerprint: false},
      "TC118": {display: "7 inch", resolution: "800x480", touch: true, fingerprint: true},
      "TH118": {display: "10.2 inch", resolution: "800x480", touch: true, fingerprint: true, canbus: true},
    },
  },

  // Alarm codes
  alarms: {
    "exits_unclosed": {
      message: "Exits unclosed / ประตูนิรภัยไม่ปิด",
      cause: "ประตูนิรภัยไม่ปิดในโหมด Semi-Auto",
      solution: "ตรวจสอบสวิตช์ X00, X01, X15, X16",
    },
    "sensor_failure": {
      message: "Failure of sensor inspection",
      cause: "เซ็นเซอร์ Electric Eye ไม่ทำงานหลังกระทุ้งกลับ",
      solution: "ตรวจสอบ X04, สายสัญญาณ, ตัวเซ็นเซอร์",
    },
    "low_pressure_timeout": {
      message: "Low pressure mold protecting time over",
      cause: "เวลาป้องกันแรงดันต่ำหมดก่อนเข้าแรงดันสูง",
      solution: "ตรวจสอบสิ่งกีดขวางในแม่พิมพ์, เพิ่มเวลาป้องกัน",
    },
    "plastic_melting": {
      message: "Plastic melting not completed on time",
      cause: "ป้อนเม็ดไม่ทันเวลาที่กำหนด",
      solution: "ตรวจสอบวัตถุดิบ, เพิ่มเวลา Feed limit",
    },
    "injection_failure": {
      message: "Failure of plastic injection",
      cause: "ไม้บรรทัด/สวิตช์ X20 ไม่ถึงจุดตรวจสอบ",
      solution: "ปรับค่า deviation, ตรวจสอบกระบวนการฉีด",
    },
    "motor_fault": {
      message: "Failure of motor",
      cause: "มอเตอร์ขัดข้อง (Overload)",
      solution: "ตรวจสอบ Relay ป้องกัน, X27",
    },
    "cycle_timeout": {
      message: "Cycle time is over",
      cause: "รอบการผลิตนานกว่าค่าที่ตั้ง",
      solution: "เพิ่มค่า Cycle Time",
    },
  },

  // Input mapping
  inputs: {
    ps860am: {
      "X00": "Front door 1",
      "X01": "Front door 2",
      "X02": "Injector protective cover",
      "X03": "Mold close stop",
      "X04": "Electric Eye enter",
      "X05": "Feed rotation speed",
      "X06": "Before nozzle stop",
      "X07": "After nozzle stop",
      "X10": "Standby",
      "X11": "Standby",
      "X12": "Ejector return fender",
      "X13": "Ejector before stop",
      "X14": "Ejector return stop",
      "X15": "Back door 1",
      "X16": "Back door 2",
      "X17": "Motor start",
      "X20": "Fine adjust teeth number",
      "X21": "Front mold adjust stop",
      "X22": "Back mold adjust stop",
      "X23": "Mechanic hand mold close",
      "X24": "Mechanic hand eject",
      "X25": "Core A in / Count",
      "X26": "Core A out",
      "X27": "Motor fault",
      "X30": "Core B advance / Count",
      "X31": "Core B return",
      "X32": "Oil short",
    },
  },

  // Output mapping
  outputs: {
    ps860am: {
      "Y00": "Mold close",
      "Y01": "Nozzle advance",
      "Y02": "Inject",
      "Y03": "Feed",
      "Y04": "Suck back",
      "Y05": "Nozzle return",
      "Y06": "Mold open",
      "Y07": "Ejector advance",
      "Y10": "Ejector return",
      "Y11": "Mold thin",
      "Y12": "Differential mold close",
      "Y13": "Mold thick",
      "Y14": "Machine mold open stop",
      "Y15": "Machine ejector stop",
      "Y16": "Low pressure mold close",
      "Y17": "High pressure mold close",
      "Y20": "Fault alarm",
      "Y21": "Big pump",
      "Y22": "Middle pump",
      "Y23": "Mold open buffer",
      "Y24": "Core A in",
      "Y25": "Core A out",
      "Y26": "Core B in",
      "Y27": "Core B out",
      "Y30": "Blow male",
      "Y31": "Blow female",
      "Y32": "Standby",
      "Y33": "Standby",
    },
  },

  // Temperature zones
  temperature: {
    zones: ["Nozzle", "Segment 1", "Segment 2", "Segment 3", "Segment 4", "Segment 5", "Oil temperature"],
    control: {
      "K-type_thermocouple": true,
      "PID_control": true,
      "max_zones": 6,
      "ps960am_max_zones": 10,
    },
  },

  // Material reference
  materials: {
    "ABS": {meltTemp: "190-270°C", moldTemp: "50-80°C", density: "1.01-1.05"},
    "PS": {meltTemp: "190-240°C", moldTemp: "40-60°C", density: "1.05"},
    "PP": {meltTemp: "200-290°C", moldTemp: "50-80°C", density: "0.98-0.90"},
    "PC": {meltTemp: "280-320°C", moldTemp: "80-120°C", density: "1.2-1.22"},
    "POM": {meltTemp: "190-230°C", moldTemp: "80-120°C", density: "1.41-1.42"},
    "PA": {meltTemp: "230-290°C", moldTemp: "80-100°C", density: "1.08-1.17"},
    "NYLON66": {meltTemp: "280-330°C", moldTemp: "80-100°C", density: "1.03-1.15"},
    "PVC_S": {meltTemp: "150-180°C", moldTemp: "30-50°C", density: "1.20-1.40"},
    "PVC_H": {meltTemp: "160-200°C", moldTemp: "30-50°C", density: "1.30-1.58"},
    "PET": {meltTemp: "280-310°C", moldTemp: "80-120°C", density: "1.38-1.41"},
    "PMMA": {meltTemp: "180-260°C", moldTemp: "50-80°C", density: "1.17-1.20"},
    "PPO": {meltTemp: "260-330°C", moldTemp: "80-120°C", density: "1.08-1.09"},
  },
};

// =====================================================
// 🔧 HELPER FUNCTIONS
// =====================================================

/**
 * ตรวจจับว่าคำถามเกี่ยวกับ PORCHESON หรือไม่
 */
function isPorchesonQuery(text) {
  const porchesonKeywords = [
    "porcheson", "porchison", "พอร์ชิสัน", "พอชิสัน",
    "tx118", "ps660", "ps860", "ps960",
    "tb118", "tc118", "th118",
    "บอร์ดควบคุม", "control board", "controller board",
    "หน้าจอฉีด", "หน้าจอเครื่องฉีด",
    "alarm code", "error code", "รหัส alarm",
    "x00", "x01", "x15", "x16", "y00", "y01", // Input/Output points
    "mold close", "mold open", "ejector", "core",
    "electronic ruler", "ไม้บรรทัดอิเล็กทรอนิกส์",
  ];

  const lowerText = text.toLowerCase();
  return porchesonKeywords.some((keyword) => lowerText.includes(keyword));
}

/**
 * ค้นหา Alarm จากข้อความ
 */
function findAlarmInfo(text) {
  const lowerText = text.toLowerCase();

  for (const [key, alarm] of Object.entries(PORCHESON_QUICK_REFERENCE.alarms)) {
    if (lowerText.includes(key.replace("_", " ")) ||
        lowerText.includes(alarm.message.toLowerCase())) {
      return alarm;
    }
  }

  return null;
}

/**
 * ค้นหาข้อมูล Input/Output
 */
function findIOInfo(ioCode) {
  const upperCode = ioCode.toUpperCase();

  const inputs = PORCHESON_QUICK_REFERENCE.inputs.ps860am;
  const outputs = PORCHESON_QUICK_REFERENCE.outputs.ps860am;

  if (inputs[upperCode]) {
    return {type: "input", code: upperCode, description: inputs[upperCode]};
  }

  if (outputs[upperCode]) {
    return {type: "output", code: upperCode, description: outputs[upperCode]};
  }

  return null;
}

/**
 * ค้นหาข้อมูลวัสดุ
 */
function findMaterialInfo(material) {
  const upperMaterial = material.toUpperCase();

  if (PORCHESON_QUICK_REFERENCE.materials[upperMaterial]) {
    return {
      name: upperMaterial,
      ...PORCHESON_QUICK_REFERENCE.materials[upperMaterial],
    };
  }

  return null;
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  PORCHESON_KNOWLEDGE_PROMPT,
  PORCHESON_QUICK_REFERENCE,
  isPorchesonQuery,
  findAlarmInfo,
  findIOInfo,
  findMaterialInfo,
};
