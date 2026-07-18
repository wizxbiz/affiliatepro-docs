/**
 * =====================================================
 * 🏭 TECHMATION M8M/M10M KNOWLEDGE DATABASE (UNIFIED)
 * =====================================================
 *
 * ระบบฐานความรู้ครบถ้วนสำหรับ Techmation M8M / M10M Controller
 * พัฒนาโดย: อาจารย์วิทยา
 * Version: 3.0.0 (Unified & Complete)
 *
 * รวมข้อมูลจาก:
 * - HMI Controller & Software Manual (Standard Version)
 * - Parameter Index, Alarm Codes, I/O Channels
 * - System Settings, Mold Database, Transducer Reset
 */

// =====================================================
// 📚 TECHMATION KNOWLEDGE PROMPT (UNIFIED)
// =====================================================

const TECHMATION_KNOWLEDGE_PROMPT = `
## 🏭 ความรู้เฉพาะทาง: ระบบควบคุม Techmation M8M / M10M

คุณมีความเชี่ยวชาญพิเศษด้านระบบควบคุมเครื่องฉีดพลาสติก Techmation รุ่น M8M และ M10M
ซึ่งเป็นระบบ HMI Controller มาตรฐานที่นิยมใช้ในเครื่องฉีดพลาสติกหลายยี่ห้อ

---

### 📋 ข้อมูลระบบ Techmation

**รุ่นที่รองรับ:**
- **Techmation M8M:** หน้าจอ 8 นิ้ว (TFT LCD) เหมาะสำหรับเครื่องฉีดขนาดเล็กถึงกลาง (Small-Medium Tonnage)
- **Techmation M10M:** หน้าจอ 10.4 นิ้ว (TFT LCD) เหมาะสำหรับเครื่องฉีดขนาดกลางถึงใหญ่ (Medium-Large Tonnage)
- **จุดที่เหมือนกัน:** ทั้งสองรุ่นใช้ซอฟต์แวร์และโครงสร้างเมนู (Menu Structure) เดียวกัน

**คำเตือนความปลอดภัย:**
- อ่านคู่มือเครื่องจักรของผู้ผลิตควบคู่กับคู่มือนี้เสมอ
- เปลี่ยนแม่พิมพ์ตามขั้นตอนความปลอดภัย (Safety Procedure)
- ใช้งานเฉพาะผู้ที่ผ่านการฝึกอบรม

---

### 🖥️ โครงสร้างหน้าจอและปุ่มกด (Screen & Key Structure)

ระบบใช้ปุ่มฟังก์ชัน **F1-F10** ในการเลือกหน้าจอ โดยแบ่งเป็น 2 เมนูหลัก
กดปุ่ม **F10 (Next)** เพื่อสลับระหว่าง Menu A และ Menu B

**Menu A (Operation Screens - หน้าจอหลัก):**
| ปุ่ม | หน้าจอ | ฟังก์ชันหลัก |
|------|--------|--------------|
| **F1** | **Mold (Clamp)** | ตั้งค่าการปิด/เปิดแม่พิมพ์, ระยะทาง, แรงดัน, ความเร็ว |
| **F2** | **Eject (Ejector)** | ตั้งค่ากระทุ้ง, จำนวนครั้ง, Air Blast (เป่าลม) |
| **F3** | **Inject (Injection)** | ตั้งค่าการฉีด, ความเร็ว/แรงดัน 5-6 จังหวะ, Holding Pressure |
| **F4** | **Charge (Plasticizing)** | ตั้งค่าการป้อนเม็ด (Charge), ดูดกลับ (Suck-back), Auto Purge |
| **F5** | **Temp (Temperature)** | ตั้งค่าอุณหภูมิ Barrel, Oil Temp, PID, Standby |
| **F6** | **Core (Core Pull)** | ตั้งค่าแกน (Core A/B/C), โหมดการทำงาน (Insert/Pull) |
| **F7** | **Fast (Fast Set)** | หน้าจอลัดสำหรับตั้งค่าพารามิเตอร์สำคัญ |
| **F8** | **Curve (Graph)** | ดูกราฟแรงดัน/ความเร็วการฉีดแบบ Real-time |
| **F9** | **Monitor** | หน้าจอตรวจสอบสถานะการผลิต, Cycle Time, Counter |
| **F10**| **Next** | สลับไป Menu B |

**Menu B (System Screens - หน้าจอตั้งค่า/ระบบ):**
| ปุ่ม | หน้าจอ | ฟังก์ชันหลัก |
|------|--------|--------------|
| **F1** | **Alarm** | ดูประวัติ Alarm, ข้อความแจ้งเตือนปัจจุบัน (หน้า 47) |
| **F2** | **I/O (Diagnosis)** | ตรวจสอบสถานะ Input/Output (PB/PC) (หน้า 53-55) |
| **F3** | **Data (Mold Data)** | บันทึก/โหลดข้อมูลแม่พิมพ์ (Save/Load Mold) (หน้า 57-61) |
| **F4** | **System** | ตั้งค่าระบบ, ภาษา, วันที่/เวลา, Screen Saver (หน้า 63-65) |
| **F5** | **Install (Setup)** | ตั้งค่า Machine Parameters (ต้องใช้ Password) |
| **F6** | **Reset/Zero** | รีเซ็ตค่าต่างๆ (Transducer Zero Point) (หน้า 52) |
| **F7** | **Other** | ตั้งค่าอื่นๆ เช่น Lubrication, Robot |

---

### 🎛️ รายละเอียดหน้าจอย่อย (Sub-Screens)

**1. หน้าจอ Mold (F1):**
- **F1 Mold:** ตั้งค่าระยะ (Position) การปิด/เปิดแม่พิมพ์
- **F2 Func:** ตั้งค่าฟังก์ชันพิเศษ เช่น Fast Close, Cycle Delay, Open Link
- **F3 Para:** ตั้งค่าแรงดัน (Pressure) และความเร็ว (Flow) ของแต่ละช่วง

**2. หน้าจอ Injection (F3):**
- **F1 Injt:** ตั้งค่า Profile การฉีด (Pressure/Speed/Position)
- **F2 Func:** ตั้งค่า Accumulator, Injection Shut-off, Inject Fast
- **F3 Prof:** ดูกราฟ Profile การฉีด (Pressure-Position Graph)
- **F4 Para:** ตั้งค่า Charge (Back Pressure, Speed) และ Suck-back

**3. หน้าจอ Ejector (F2):**
- **F1 Ejet:** ตั้งค่าโหมด (Count/Vibration), ระยะหน้า/หลัง
- **F2 Func:** ตั้งค่า Air Blast (เป่าลม) Moving/Stationary Platen
- **F3 Para:** ตั้งค่าแรงดัน/ความเร็วการกระทุ้ง

**4. หน้าจอ Temperature (F5):**
- **F1 Temp:** ตั้งค่าอุณหภูมิแต่ละโซน, ฟังก์ชัน Keep Warm
- **F2 Para:** ตั้งค่า Tolerance (Upper/Lower Limit), PID
- **F3 Func:** ตั้งค่า Timer สำหรับ Preheat

---

### 🔍 I/O CHANNEL DIAGNOSTICS (Menu B → F2)

**Sub-screens:**
| ปุ่ม | หน้าจอ | ฟังก์ชัน |
|------|--------|----------|
| **F1 PB1** | Input Diagnostics (Ch 0-48) | ตรวจสอบ Input Signals |
| **F2 PB2** | Input Diagnostics (Ch 49-96) | ตรวจสอบ Input Signals |
| **F3 PC1** | Output Diagnostics (Ch 0-48) | ทดสอบ Output Channels |
| **F4 PC2** | Output Diagnostics (Ch 49-96) | ทดสอบ Output Channels |
| **F6 A PB** | Input Reassignment | เปลี่ยนหมายเลข Input Channel |
| **F7 A PC** | Output Reassignment | เปลี่ยนหมายเลข Output Channel |
| **F8 DIAG** | Machine Diagram | สำหรับ Engineer เท่านั้น |

**วิธีการใช้:**
- **Input (PB):** ดูค่า "1" = ได้รับสัญญาณ, "0" = ไม่ได้รับ
- **Output (PC):** ใส่ค่า "1" เพื่อ activate hardware → **รีเซ็ตเป็น "0" หลังทดสอบเสร็จ**
- **Reassignment:** ใช้เมื่อมี hardware problem ต้องเปลี่ยน channel

---

### 💾 MOLD SET DATABASE (Menu B → F3)

**Sub-screens:**
| ปุ่ม | หน้าจอ | ฟังก์ชัน |
|------|--------|----------|
| **F1 Save** | Mold Save | บันทึกแม่พิมพ์ (Max 200 records) |
| **F2 Read** | Mold Read | โหลดแม่พิมพ์ที่บันทึกไว้ |
| **F3 Copy** | Mold Copy | คัดลอกข้อมูลสำรอง |
| **F4 Delete** | Mold Delete | ลบแม่พิมพ์ที่ไม่ใช้ |
| **F5 Machine** | Machine Set | บันทึกพารามิเตอร์เครื่องลง MMC card |
| **F6 Record** | Modify Record | ดูประวัติการแก้ไขพารามิเตอร์ |

**คำเตือนสำคัญ:**
- บันทึก Mold Set ก่อนโหลดแม่พิมพ์ใหม่เสมอ
- ออกจากหน้าจอก่อนปิดเครื่อง (ไม่งั้นข้อมูลจะหาย)
- ตรวจสอบว่าบันทึกแล้วก่อนปิดเครื่อง

---

### ⚙️ SYSTEM SETTINGS (Menu B → F4)

**Sub-screens:**
| ปุ่ม | หน้าจอ | ฟังก์ชัน |
|------|--------|----------|
| **F1 System** | System Settings | Screen Saver, Language, Date/Time, Network |
| **F2 Data** | Data Base | ⚠️ สำหรับ Engineer เท่านั้น |
| **F3 SEQN** | Information IMCS | เปลี่ยนรหัสผ่าน |
| **F4 CONT** | DSP Syst | ⚠️ สำหรับ Engineer เท่านั้น |
| **F5 RESET** | System Reset | ⚠️ ลบข้อมูลทั้งหมด! |

**System Reset (F5 RESET):**
- ต้องอยู่ในโหมด Manual Operation
- **คำเตือน:** จะลบข้อมูลผู้ใช้และ Mold Set Database ทั้งหมด!
- ปิดเครื่องหลัง reset ก่อนเริ่มทำงานใหม่

---

### 🔧 TRANSDUCER ZERO POINT RESET (Menu B → F6)

**วัตถุประสงค์:** รีเซ็ตตำแหน่งศูนย์ของ Transducer หลังเปลี่ยนหรือปรับเครื่อง

**ขั้นตอน:**
1. อยู่ในโหมด **Manual Operation Mode**
2. เข้าหน้า Transducer Zero Point Reset
3. ใส่รหัสผ่าน **"66"**
4. ขยับ Transducer ไปที่ตำแหน่งสุด (End Position)
5. ใส่ค่า **"1"** ในช่องที่ต้องการรีเซ็ต แล้วกด **Enter**

**Transducers ที่รีเซ็ตได้:**
- Inject Position, Clamp Position, Eject Position
- Nozzle Position, Inject Pressure, System Pressure

---

### 📊 พารามิเตอร์การทำงาน (Parameter Index)

**1. การปิดแม่พิมพ์ (Mold Close):**
- Cls Start Ramp Time: เวลาหน่วงเริ่มออกตัว
- Close Pres/Flow Ramp: ความชันกราฟแรงดัน/ความเร็ว
- Auto Adj Protect Time: เวลาป้องกันในโหมดปรับตั้งอัตโนมัติ
- Cls Low/Hi Pres Valve Dly: เวลาหน่วงวาล์ว

**2. การเปิดแม่พิมพ์ (Mold Open):**
- Mold Open Pres/Flow Ramp: เวลาเปลี่ยนแรงดัน/ความเร็วช่วงเปิด
- Open Drain Time: เวลาคลายแรงดันก่อนเปิด
- Mold Open Effect Area: ช่วงตำแหน่งที่อนุญาตให้กระทุ้ง/แกนทำงาน

**3. การฉีด (Injection):**
- Inject Pres/Flow Ramp: เวลาเปลี่ยนแรงดัน/ความเร็วระหว่างช่วงการฉีด
- Inject Dly: เวลาหน่วงก่อนฉีด
- Inject End Valve Dly Off: เวลาหน่วงปิดวาล์วหลังฉีดจบ
- Hold Pressure: แรงดันย้ำ

**4. การป้อน/ดูดกลับ (Charge/Suck-Back):**
- Charge Pres/Flow Ramp: เวลาเปลี่ยนแรงดัน/ความเร็วช่วงป้อน
- Charge Valve Dly: เวลาหน่วงเปิดวาล์วป้อน
- Suck End Valve Dly Off: เวลาหน่วงปิดวาล์วหลังดูดกลับ

**5. อุณหภูมิ (Temperature):**
- Temp Ramp: ขีดจำกัดการเพิ่มอุณหภูมิของแต่ละโซน (Zone 1-9)
- Oil Temp Up/Low Limit: ขีดจำกัดอุณหภูมิน้ำมันไฮดรอลิก
- Temp Cooler On/Off: อุณหภูมิเปิด/ปิดพัดลมระบายความร้อน

**6. การกระทุ้ง (Ejection):**
- Eject Pres/Flow Ramp: เวลาเปลี่ยนแรงดัน/ความเร็ว
- Vibrate Eject Time: เวลากระทุ้งแบบสั่น
- Eject Ret. Effect Area: ช่วงตำแหน่งที่อนุญาตให้กระทุ้งถอยบางส่วน

**7. การหล่อลื่น (Lubrication):**
- Lubricator Count: จำนวนรอบการผลิตต่อการหล่อลื่น 1 ครั้ง
- Lubricator Time: เวลาทำงานของปั๊มหล่อลื่น

---

### 🚨 รหัสแจ้งเตือน (Alarm/Error Messages)

**รหัสที่พบบ่อย:**
| รหัส | ข้อความ | สาเหตุ/วิธีแก้ไข |
|------|---------|------------------|
| **01** | Temperature Error | อุณหภูมิ Barrel ผิดปกติ → เช็ค Heater/Thermocouple |
| **05** | Oil Temp. Over | น้ำมันไฮดรอลิกร้อน/เย็นเกิน → เช็ค Cooling System |
| **06** | Cycle Time Exceeded | รอบการผลิตนานเกินค่า Monitor → เช็คว่าติดขัดขั้นตอนไหน |
| **09** | Inject Cushion Error | ระยะหมอนรองฉีดผิดปกติ → เช็ค Check Ring/รั่วไหล |
| **13** | Mold Open Time Out | เปิดแม่พิมพ์ไม่สุดในเวลาที่กำหนด |
| **16** | Mold Close End Error | ปิดแม่พิมพ์ไม่สุดในเวลาที่กำหนด |
| **19** | Lubr. Oil Level Error | น้ำมันหล่อลื่นหมด → เติมน้ำมัน |
| **24** | Mold Protection Error | แม่พิมพ์ปิดไม่ได้ในช่วง Low Pressure → มีของติด/ตั้งค่าผิด |
| **26** | Charge End Error | ป้อนเม็ดไม่ถึงระยะที่ตั้ง → พลาสติกหมด/สกรูลื่น |
| **34** | Adjust End Touched | แท่นท้ายถอยสุดสวิตช์ → ระวังชน |
| **53** | Motor Overload | มอเตอร์กินกระแสเกิน → งานหนัก/ระบบขัดข้อง |
| **57** | Temperature not up | อุณหภูมิไม่ขึ้นตามค่าที่ตั้ง → เช็ค Heater |

**การดู Alarm:** Menu B → F1 Alarm
- เก็บ Error ได้ 100 รายการล่าสุด
- ตั้ง Reset = "1" เพื่อลบ Error Log

---

### 📈 MONITORING SETTINGS (Menu A → F9 → F1)

**Auto Alarm Modes:**
- **0** = ยังไม่เปิด Auto Alarm
- **1** = Auto Alarm เปิดแล้ว
- **2** = ตั้ง Reference Values ใหม่

**สูตรคำนวณ Limit:**
- Upper Limit = RV + (RV × x/100) + y
- Lower Limit = RV - (RV × x/100) - y
- RV = Reference Value, x = Delta %, y = Delta Absolute

**Parameters ที่ Monitor:**
Cls Mold, Mold Prot, Cls H.Prs, Mold Opn, Eject, Cycle, Inj Time, Cushion, Charge, Inj Start

---

### 🔧 วิธีการตั้งค่าพื้นฐาน

**1. การเปลี่ยนแม่พิมพ์:**
1. เข้าโหมด Manual
2. ใช้ปุ่ม Mold Thin/Thick ปรับความสูง
3. เข้าหน้า Other เพื่อตั้งค่า Mold Height Adjustment
4. ทำ Auto Adjustment หรือปรับ Manual จนได้แรงบีบที่เหมาะสม

**2. การตั้งค่าฉีด:**
1. ตั้งค่า V-P Switchover ที่ประมาณ 95-98% ของชิ้นงาน
2. ตั้งค่า Holding Pressure และ Time
3. ตั้งค่า Cooling Time ให้เพียงพอ

**3. การตั้งค่าป้องกันแม่พิมพ์:**
1. ตั้งระยะ Low Pressure Start ให้เริ่มก่อนแม่พิมพ์ชนกันเล็กน้อย
2. ตั้ง Low Pressure ให้ต่ำที่สุดเท่าที่จะดันแม่พิมพ์ไหว
3. ตั้ง Protection Time ให้เหมาะสม

---

## 🎯 วิธีการตอบคำถามเกี่ยวกับ Techmation

เมื่อได้รับคำถามเกี่ยวกับ Techmation ให้ตอบด้วย:
1. **ระบุว่าเป็นระบบ Techmation** (M8M/M10M)
2. **อธิบายความหมาย** ของพารามิเตอร์หรือ Alarm ที่ผู้ใช้ถาม
3. **แนะนำวิธีแก้ไข** หรือขั้นตอนการตั้งค่าตามคู่มือ
4. **ระบุตำแหน่งหน้าจอ (Path)** เช่น "กด F3 (Inject) → F1 (Injt)"
5. **เตือนเรื่องความปลอดภัย** หากเกี่ยวข้องกับเครื่องจักร

**ตัวอย่าง:**
"Alarm **'Mold Protection Error' (รหัส 24)** หมายถึงแม่พิมพ์ปิดไม่ได้ในช่วงแรงดันต่ำครับ
**สาเหตุ:** อาจมีชิ้นงานค้าง หรือตั้งค่า Low Pressure ต่ำ/เร็วเกินไป
**วิธีแก้:**
1. เปิดแม่พิมพ์ เช็คสิ่งกีดขวาง
2. เข้าหน้า **Mold (F1)** → **Para (F3)**
3. ลองเพิ่มค่า Pressure ช่วง Low Pressure เล็กน้อย หรือขยายระยะ Protection ครับ"
`;

// =====================================================
// 📚 TECHMATION QUICK REFERENCE DATABASE (UNIFIED)
// =====================================================

const TECHMATION_QUICK_REFERENCE = {
  // ข้อมูลรุ่น
  models: {
    m8m: {
      name: "Techmation M8M",
      screen_size: "8 นิ้ว TFT LCD",
      suitable_for: "เครื่องฉีดขนาดเล็กถึงกลาง (Small-Medium Tonnage)",
    },
    m10m: {
      name: "Techmation M10M",
      screen_size: "10.4 นิ้ว TFT LCD",
      suitable_for: "เครื่องฉีดขนาดกลางถึงใหญ่ (Medium-Large Tonnage)",
    },
  },

  // Alarm Codes (รหัส 1-61)
  alarms: {
    "1": {code: 1, message: "Temperature Error", thai: "อุณหภูมิผิดปกติ", solution: "เช็ค Heater/Thermocouple"},
    "2": {code: 2, message: "Please Close Door", thai: "กรุณาปิดประตู", solution: "ปิดประตูนิรภัย"},
    "5": {code: 5, message: "Oil Temp. Over", thai: "อุณหภูมิน้ำมันสูง/ต่ำเกินไป", solution: "เช็ค Cooling System"},
    "6": {code: 6, message: "Cycle Time Exceeded", thai: "รอบการผลิตนานเกินกำหนด", solution: "เช็ค Monitor Settings"},
    "8": {code: 8, message: "Eject Position Error", thai: "ตำแหน่งกระทุ้งผิดพลาด", solution: "เช็ค Potentiometer"},
    "9": {code: 9, message: "Inject Cushion Error", thai: "ระยะหมอนรองฉีดผิดปกติ", solution: "เช็ค Check Ring/รั่วไหล"},
    "10": {code: 10, message: "Purge Guard Opened", thai: "ฝาครอบหัวฉีดเปิดอยู่", solution: "ปิดฝาครอบ"},
    "11": {code: 11, message: "Robot Malfunction", thai: "หุ่นยนต์ขัดข้อง", solution: "เช็คสถานะ Robot"},
    "12": {code: 12, message: "No. of Shots Reached", thai: "ถึงจำนวนรอบที่ตั้งไว้", solution: "รีเซ็ต Counter"},
    "13": {code: 13, message: "Mold Open Time Out", thai: "เปิดแม่พิมพ์ไม่ทันเวลา", solution: "เช็คการตั้งค่า Mold Open"},
    "14": {code: 14, message: "Part Not Dropped", thai: "ชิ้นงานไม่หลุด", solution: "เช็ค Photo Sensor"},
    "15": {code: 15, message: "Hopper Empty", thai: "ถังพลาสติกว่างเปล่า", solution: "เติมวัตถุดิบ"},
    "16": {code: 16, message: "Mold Close End Error", thai: "ปิดแม่พิมพ์ไม่สุดตามเวลา", solution: "เช็คการตั้งค่า Mold Close"},
    "19": {code: 19, message: "Lubr. Oil Level Error", thai: "น้ำมันหล่อลื่นหมด", solution: "เติมน้ำมันหล่อลื่น"},
    "24": {code: 24, message: "Mold Protection Error", thai: "แม่พิมพ์ปิดไม่ได้ (Low Pressure)", solution: "เช็คสิ่งกีดขวาง/ปรับ Low Pressure"},
    "26": {code: 26, message: "Charge End Error", thai: "ป้อนเม็ดไม่สุด", solution: "เช็ควัตถุดิบ/สกรูลื่น"},
    "34": {code: 34, message: "Adjust End Touched", thai: "แท่นท้ายถอยสุดสวิตช์", solution: "หยุดเคลื่อนที่"},
    "48": {code: 48, message: "Motor Fail", thai: "มอเตอร์ปั๊มขัดข้อง", solution: "เช็คมอเตอร์"},
    "53": {code: 53, message: "Motor Overload", thai: "มอเตอร์โอเวอร์โหลด", solution: "เช็คโหลด/ระบบไฟฟ้า"},
    "57": {code: 57, message: "Temperature not up", thai: "อุณหภูมิไม่ขึ้น", solution: "เช็ค Heater"},
  },

  // พารามิเตอร์สำคัญ
  parameters: {
    mold_close: ["Cls Start Ramp Time", "Close Pres Ramp", "Close Flow Ramp", "Auto Adj Protect Time", "Cls Low/Hi Pres Valve Dly"],
    mold_open: ["Mold Open Pres Ramp", "Mold Open Flow Ramp", "Open Drain Time", "Mold Open Effect Area"],
    injection: ["Inject Pres Ramp", "Inject Flow Ramp", "Inject Dly", "Inject End Valve Dly Off"],
    charge: ["Charge Pres Ramp", "Charge Flow Ramp", "Charge Valve Dly", "Suck End Valve Dly Off"],
    temperature: ["Temp Ramp", "Oil Temp Up Limit", "Oil Temp Low Limit", "Temp Cooler On", "Temp Cooler Off"],
    ejection: ["Eject Pres Ramp", "Eject Flow Ramp", "Vibrate Eject Time", "Eject Ret. Effect Area"],
    lubrication: ["Lubricator Count", "Lubricator Time"],
  },

  // หน้าจอสำคัญ
  screens: {
    menu_a: {
      f1: {name: "Mold", path: "Menu A → F1 Mold"},
      f2: {name: "Eject", path: "Menu A → F2 Eject"},
      f3: {name: "Inject", path: "Menu A → F3 Inject"},
      f4: {name: "Charge", path: "Menu A → F4 Charge"},
      f5: {name: "Temp", path: "Menu A → F5 Temp"},
      f6: {name: "Core", path: "Menu A → F6 Core"},
      f7: {name: "Fast", path: "Menu A → F7 Fast"},
      f8: {name: "Curve", path: "Menu A → F8 Curve"},
      f9: {name: "Monitor", path: "Menu A → F9 Monitor"},
    },
    menu_b: {
      f1: {name: "Alarm", path: "Menu B → F1 Alarm", page: 47},
      f2: {name: "I/O", path: "Menu B → F2 I/O", page: 53},
      f3: {name: "Data", path: "Menu B → F3 Data", page: 57},
      f4: {name: "System", path: "Menu B → F4 System", page: 63},
      f5: {name: "Install", path: "Menu B → F5 Install"},
      f6: {name: "Reset", path: "Menu B → F6 Reset", page: 52},
      f7: {name: "Other", path: "Menu B → F7 Other"},
    },
  },

  // I/O Diagnostics
  io_diagnostics: {
    path: "Menu B → F2 I/O",
    input_pb1: {channels: "0-48", page: 53},
    input_pb2: {channels: "49-96", page: 53},
    output_pc1: {channels: "0-48", page: 54},
    output_pc2: {channels: "49-96", page: 54},
    reassign_input: {path: "F6 A PB", page: 55},
    reassign_output: {path: "F7 A PC", page: 55},
  },

  // Mold Database
  mold_database: {
    path: "Menu B → F3 Data",
    max_records: 200,
    sub_screens: ["F1 Save", "F2 Read", "F3 Copy", "F4 Delete", "F5 Machine", "F6 Record"],
    pages: {save: 57, read: 58, copy: 59, delete: 60, machine: 60, record: 61},
  },

  // Transducer Reset
  transducer_reset: {
    path: "Menu B → F6 Reset",
    password: "66",
    page: 52,
    transducers: ["Inject Position", "Clamp Position", "Eject Position", "Nozzle Position", "Inject Pressure", "System Pressure"],
  },

  // System Settings
  system_settings: {
    path: "Menu B → F4 System",
    sub_screens: {
      system: {name: "System Settings", page: 63},
      data: {name: "Data Base", warning: "Engineer Only", page: 64},
      seqn: {name: "Information IMCS", page: 64},
      cont: {name: "DSP Syst", warning: "Engineer Only", page: 65},
      reset: {name: "System Reset", warning: "ลบข้อมูลทั้งหมด!", page: 65},
    },
  },
};

// =====================================================
// 🔧 HELPER FUNCTIONS
// =====================================================

/**
 * ตรวจจับว่าคำถามเกี่ยวกับ Techmation หรือไม่
 */
function isTechmotionQuery(text) {
  const keywords = [
    "techmation", "techmotion", "เทคมิชั่น", "เทคเมชั่น",
    "m8m", "m10m", "hmi", "f1 mold", "f3 inject",
    "mold protection", "alarm", "cycle time", "temperature error",
    "i/o channel", "pb1", "pb2", "pc1", "pc2",
    "mold save", "mold read", "transducer", "zero point",
  ];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

/**
 * ค้นหา Alarm จากข้อความหรือรหัส
 */
function findTechmotionAlarm(text) {
  const lowerText = text.toLowerCase();

  // ค้นหาด้วยรหัส
  const codeMatch = lowerText.match(/(?:alarm|error|รหัส)\s*(\d+)/);
  if (codeMatch && TECHMATION_QUICK_REFERENCE.alarms[codeMatch[1]]) {
    return TECHMATION_QUICK_REFERENCE.alarms[codeMatch[1]];
  }

  // ค้นหาด้วยข้อความ
  for (const alarm of Object.values(TECHMATION_QUICK_REFERENCE.alarms)) {
    if (lowerText.includes(alarm.message.toLowerCase()) ||
        lowerText.includes(alarm.thai.toLowerCase())) {
      return alarm;
    }
  }
  return null;
}

/**
 * ค้นหาหน้าจอจากข้อความ
 */
function findTechmotionScreen(text) {
  const lowerText = text.toLowerCase();
  const screens = [];

  // ค้นหา Menu A
  for (const [key, screen] of Object.entries(TECHMATION_QUICK_REFERENCE.screens.menu_a)) {
    if (lowerText.includes(screen.name.toLowerCase())) {
      screens.push({key, ...screen, menu: "A"});
    }
  }

  // ค้นหา Menu B
  for (const [key, screen] of Object.entries(TECHMATION_QUICK_REFERENCE.screens.menu_b)) {
    if (lowerText.includes(screen.name.toLowerCase())) {
      screens.push({key, ...screen, menu: "B"});
    }
  }

  return screens.length > 0 ? screens : null;
}

/**
 * สร้างคำตอบสำหรับ Alarm
 */
function generateAlarmResponse(alarm) {
  if (!alarm) return null;
  return {
    code: alarm.code,
    message: alarm.message,
    thai: alarm.thai,
    solution: alarm.solution,
    path: "Menu B → F1 Alarm",
  };
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  TECHMATION_KNOWLEDGE_PROMPT,
  TECHMATION_QUICK_REFERENCE,
  isTechmotionQuery,
  findTechmotionAlarm,
  findTechmotionScreen,
  generateAlarmResponse,
};
