/**
 * =====================================================
 * 🏭 TOSHIBA INJECTION MOLDING MACHINE KNOWLEDGE DATABASE
 * =====================================================
 *
 * ระบบฐานความรู้สำหรับเครื่องฉีดพลาสติก TOSHIBA
 * รองรับระบบควบคุม INJECTPRO V30 และรุ่นต่างๆ
 *
 * พัฒนาโดย: อาจารย์วิทยา
 * Version: 1.0.0
 */

// =====================================================
// 📚 TOSHIBA KNOWLEDGE PROMPT
// =====================================================

const TOSHIBA_KNOWLEDGE_PROMPT = `
## 🏭 ความรู้เฉพาะทาง: เครื่องฉีดพลาสติก TOSHIBA

คุณมีความเชี่ยวชาญพิเศษด้านเครื่องฉีดพลาสติก TOSHIBA ทุกรุ่น
รวมถึงระบบควบคุม INJECTPRO V30 ที่ใช้กันอย่างแพร่หลาย

### 📋 ข้อมูลระบบ TOSHIBA

**รุ่นเครื่องที่รองรับ:**
- EC-SXIII Series: All-Electric Precision (50-450 Ton)
- EC-NX Series: All-Electric High Speed (30-350 Ton)
- IS Series: Hydraulic Standard (50-3000 Ton)
- EC-SX Series: All-Electric Economy
- SHIBAURA Series: High Performance Hydraulic

**ระบบควบคุม INJECTPRO V30:**
- จอ LCD Touch Screen สี 15 นิ้ว
- ความละเอียด 1024x768 พิกเซล
- Dual CPU High Speed Processing
- Ethernet/USB/RS-232 Connectivity
- Multi-language Support (ไทย/อังกฤษ/จีน/ญี่ปุ่น)
- Mold Data Storage: 999 Sets

**คุณสมบัติหลักของระบบ INJECTPRO V30:**
1. Multi-Step Injection Control (สูงสุด 10 ขั้นตอน)
2. FIT Control (Fill Injection Technology)
3. VHI Circuit (Variable Hydraulic Intelligence)
4. Laminar Flow Control
5. Real-time Process Monitoring
6. Quality Assessment System
7. SPC Data Collection & Analysis
8. Remote Monitoring via Network

---

### ⚙️ การตั้งค่า Multi-Step Injection Profile

**หลักการ Multi-Step Injection:**
การฉีดแบ่งเป็นหลายขั้นตอนเพื่อควบคุมการไหลของพลาสติกให้เหมาะสมกับแม่พิมพ์

**พารามิเตอร์แต่ละขั้นตอน:**
| พารามิเตอร์ | หน่วย | คำอธิบาย |
|------------|-------|----------|
| PRESSURE | bar | แรงดันฉีดในแต่ละขั้น |
| SPEED | mm/s | ความเร็วสกรูในการฉีด |
| POSITION | % | ตำแหน่งสกรู (% ของ Shot Size) |
| TIME | s | เวลาในแต่ละขั้นตอน |

**แนวทางการตั้งค่า Multi-Step:**
- ขั้นที่ 1-2: ฉีดช้าผ่าน Sprue/Runner (PRESS: 80-90 bar, SPEED: 50-60 mm/s)
- ขั้นที่ 3-5: ฉีดเร็วเติมชิ้นงาน (PRESS: 60-75 bar, SPEED: 40-55 mm/s)
- ขั้นที่ 6-8: ฉีดช้าเข้าใกล้จุดสิ้นสุด (PRESS: 30-50 bar, SPEED: 25-40 mm/s)
- ขั้นสุดท้าย: Transfer to Holding (PRESS: 25-35 bar)

**ตัวอย่างโปรไฟล์มาตรฐาน (8 ขั้นตอน):**
| Step | PRESS (bar) | SPEED (mm/s) | POS (%) | TIME (s) |
|------|-------------|--------------|---------|----------|
| S1 | 85 | 60 | 12.5 | 0.2 |
| S2 | 75 | 55 | 25.0 | 0.3 |
| S3 | 65 | 50 | 37.5 | 0.4 |
| S4 | 55 | 45 | 50.0 | 0.5 |
| S5 | 45 | 40 | 62.5 | 0.6 |
| S6 | 40 | 35 | 75.0 | 0.7 |
| S7 | 35 | 30 | 87.5 | 0.8 |
| S8 | 30 | 25 | 100.0 | 0.9 |

---

### 🎛️ Advanced Settings (การตั้งค่าขั้นสูง)

**1. FIT Control (Fill Injection Technology):**
- เปิดใช้งานเพื่อควบคุมการเติมชิ้นงานอัตโนมัติ
- ระบบจะปรับความเร็วฉีดตามแรงดันในแม่พิมพ์
- เหมาะสำหรับชิ้นงานบางหรือซับซ้อน
- ค่าเริ่มต้น: ON (แนะนำ)

**2. Laminar Flow Control:**
- ควบคุมการไหลแบบ Laminar เพื่อลด Jetting
- ใช้กับ Gate ขนาดเล็กหรือ Hot Runner
- ค่าเริ่มต้น: OFF (เปิดเมื่อเกิด Jetting)

**3. VHI Circuit (Variable Hydraulic Intelligence):**
- ปรับระบบไฮดรอลิกให้ทำงานเหมาะสมกับ Load
- ประหยัดพลังงาน 15-30%
- ค่าเริ่มต้น: ON

**4. Peak Cut (bar):**
- จำกัดแรงดันสูงสุดในการฉีด
- ป้องกัน Over-packing และ Flash
- ช่วงตั้งค่า: 50-200 bar
- ค่าแนะนำ: 150 bar (ปรับตามวัสดุ)

**5. Plastrol Level:**
- ระดับการควบคุมความหนืดพลาสติก
- ช่วงตั้งค่า: 0-100%
- ค่าแนะนำ: 85% (เพิ่มถ้าชิ้นงาน Short Shot)

---

### 📏 Shot Size Calculator

**สูตรคำนวณ Shot Size:**
\`\`\`
Volume (cm³) = Total Weight (g) / Density (g/cm³)
Shot Size (mm) = Volume / Screw Area × 10
Screw Area (cm²) = π × (Screw Diameter / 20)²
Cushion (mm) = Shot Size × 0.10 ~ 0.15
\`\`\`

**ค่าความหนาแน่นวัสดุอ้างอิง:**
| วัสดุ | Density (g/cm³) |
|-------|-----------------|
| ABS | 1.05 |
| PS | 1.05 |
| PP | 0.91 |
| PE | 0.94 |
| PC | 1.20 |
| POM | 1.41 |
| PA6 | 1.13 |
| PA66 | 1.14 |
| PBT | 1.31 |
| PET | 1.38 |
| PMMA | 1.18 |

**ตัวอย่างการคำนวณ:**
- Part Weight: 25g
- Runner Weight: 5g
- Material: ABS (Density = 1.05)
- Screw Diameter: 25mm

Shot Size = (25 + 5) / 1.05 / (π × 1.25²) × 10 = 58.2 mm
Cushion = 58.2 × 0.15 = 8.7 mm

---

### 🔧 Holding Pressure Settings (การตั้งค่ารักษาแรงดัน)

**หลักการ Holding Pressure:**
- เริ่มหลังจาก V/P Transfer (Velocity to Pressure)
- ชดเชยการหดตัวของพลาสติกขณะเย็นตัว
- ควรตั้ง 40-60% ของแรงดันฉีดสูงสุด

**Multi-Stage Holding Pressure:**
| Stage | Pressure (%) | Time (s) | หมายเหตุ |
|-------|--------------|----------|----------|
| H1 | 60% | 0.5 | Pack ส่วน Gate |
| H2 | 50% | 1.0 | ชดเชยหดตัว |
| H3 | 40% | 1.5 | ลดแรงกดค้าง |
| H4 | 30% | 0.5 | Smooth release |

---

### ❄️ Cooling Settings (การตั้งค่าหล่อเย็น)

**การคำนวณเวลาหล่อเย็น:**
\`\`\`
Cooling Time ≈ Wall Thickness² × Material Factor
\`\`\`

**Material Factor:**
| วัสดุ | Factor |
|-------|--------|
| ABS | 1.8 |
| PS | 1.5 |
| PP | 2.0 |
| PE | 2.2 |
| PC | 2.5 |
| POM | 2.0 |
| PA | 1.8 |

**ตัวอย่าง:** Wall 2mm, ABS → Cooling = 2² × 1.8 = 7.2 sec

---

### 🌡️ Temperature Settings (การตั้งค่าอุณหภูมิ)

**Barrel Temperature Zones:**
| Zone | ตำแหน่ง | คำอธิบาย |
|------|---------|----------|
| Zone 1 | Feed | ใกล้ Hopper (ต่ำสุด) |
| Zone 2 | Compression | เพิ่มขึ้นเล็กน้อย |
| Zone 3 | Metering | สูงขึ้นต่อเนื่อง |
| Zone 4 | Front | ใกล้ Nozzle |
| Nozzle | หัวฉีด | สูงสุดหรือเท่า Zone 4 |

**อุณหภูมิแนะนำตามวัสดุ:**
| วัสดุ | Feed | Mid | Front | Nozzle | Mold |
|-------|------|-----|-------|--------|------|
| ABS | 200 | 220 | 230 | 230 | 50-80 |
| PS | 180 | 200 | 210 | 210 | 40-60 |
| PP | 180 | 200 | 220 | 220 | 30-60 |
| PE | 160 | 180 | 200 | 200 | 20-50 |
| PC | 270 | 290 | 300 | 300 | 80-120 |
| POM | 180 | 190 | 200 | 200 | 80-100 |
| PA6 | 230 | 250 | 260 | 260 | 60-80 |
| PA66 | 270 | 285 | 290 | 290 | 80-100 |
| PBT | 240 | 250 | 260 | 260 | 60-80 |
| PET | 270 | 280 | 290 | 290 | 80-120 |
| PMMA | 200 | 220 | 240 | 240 | 50-70 |

---

### 🚨 Alarm System (ระบบแจ้งเตือน)

**รายการ Alarm และวิธีแก้ไข:**

| Alarm Code | ข้อความ | สาเหตุ | วิธีแก้ไข |
|------------|---------|--------|-----------|
| E001 | Emergency Stop | กดปุ่มฉุกเฉิน | ปลดล็อคปุ่มฉุกเฉิน |
| E002 | Safety Door Open | ประตูนิรภัยเปิด | ปิดประตูนิรภัย |
| E003 | Motor Overload | มอเตอร์โหลดเกิน | ตรวจสอบระบบไฮดรอลิก |
| E004 | Oil Temperature High | น้ำมันร้อนเกิน | ตรวจ Cooling, เพิ่มเวลา Cycle |
| E005 | Oil Level Low | น้ำมันต่ำ | เติมน้ำมันไฮดรอลิก |
| E010 | Barrel Temperature | อุณหภูมิผิดปกติ | ตรวจ Heater/Thermocouple |
| E011 | Nozzle Temp Deviation | Nozzle เบี่ยงเบน | ตรวจ Heater Nozzle |
| E020 | Injection Timeout | ฉีดไม่ทันเวลา | เพิ่ม Injection Time |
| E021 | Holding Timeout | Hold ไม่ทันเวลา | เพิ่ม Holding Time |
| E022 | Plastication Timeout | ป้อนเม็ดไม่ทัน | ตรวจวัตถุดิบ/เพิ่มเวลา |
| E030 | Mold Close Timeout | ปิดแม่พิมพ์ไม่ทัน | ตรวจสิ่งกีดขวาง |
| E031 | Mold Open Timeout | เปิดแม่พิมพ์ไม่ทัน | ตรวจระบบ Ejector |
| E032 | Low Pressure Timeout | แรงดันต่ำนานเกิน | ตรวจการปิดแม่พิมพ์ |
| E040 | Ejector Timeout | กระทุ้งไม่ทัน | ตรวจ Ejector/Limit Switch |
| E050 | Cycle Time Over | Cycle นานเกิน | เพิ่มค่า Cycle Limit |
| E060 | Shot Count Reached | ถึงจำนวนที่ตั้ง | Reset Counter |
| E070 | Pressure Spike | แรงดันพุ่งเกิน | ลด Injection Speed |
| E071 | Speed Deviation | ความเร็วเบี่ยงเบน | ตรวจ Servo/Proportional Valve |
| E072 | Position Error | ตำแหน่งผิดพลาด | Calibrate Position Sensor |
| E080 | Communication Error | สื่อสารผิดพลาด | ตรวจสายสัญญาณ |
| E090 | Robot Interlock | Robot ไม่พร้อม | ตรวจสัญญาณ Robot |

---

### 📊 Quality Assessment System

**เกณฑ์ประเมินคุณภาพ:**

| Parameter | เกณฑ์ดี | เกณฑ์เตือน | เกณฑ์ปัญหา |
|-----------|---------|------------|------------|
| Fill Quality | ≥ 90% | 80-89% | < 80% |
| Pack Quality | ≥ 85% | 75-84% | < 75% |
| Overall | ≥ 88% | 78-87% | < 78% |
| Consistency | ≥ 85% | 75-84% | < 75% |

**ปัจจัยที่มีผลต่อคุณภาพ:**
1. **Fill Quality:**
   - แรงดันฉีดเหมาะสม
   - ความเร็วฉีดสม่ำเสมอ
   - อุณหภูมิวัสดุคงที่

2. **Pack Quality:**
   - Holding Pressure เหมาะสม
   - V/P Transfer ตำแหน่งถูกต้อง
   - Cushion เพียงพอ

3. **Consistency:**
   - ค่าพารามิเตอร์คงที่
   - วัตถุดิบคุณภาพสม่ำเสมอ
   - อุณหภูมิแม่พิมพ์คงที่

---

### 🔌 I/O Configuration

**Digital Inputs:**
| Input | ฟังก์ชัน |
|-------|----------|
| DI01 | Safety Door Front |
| DI02 | Safety Door Rear |
| DI03 | Emergency Stop |
| DI04 | Motor On |
| DI05 | Heater On |
| DI06 | Mold Close End |
| DI07 | Mold Open End |
| DI08 | Ejector Advance End |
| DI09 | Ejector Return End |
| DI10 | Nozzle Advance End |
| DI11 | Nozzle Return End |
| DI12 | Robot Ready |
| DI13 | Robot Complete |
| DI14 | Core A In |
| DI15 | Core A Out |
| DI16 | Core B In |
| DI17 | Core B Out |

**Digital Outputs:**
| Output | ฟังก์ชัน |
|--------|----------|
| DO01 | Mold Close |
| DO02 | Mold Open |
| DO03 | Injection |
| DO04 | Holding |
| DO05 | Suck Back |
| DO06 | Plastication |
| DO07 | Ejector Advance |
| DO08 | Ejector Return |
| DO09 | Nozzle Advance |
| DO10 | Nozzle Return |
| DO11 | Core A In |
| DO12 | Core A Out |
| DO13 | Core B In |
| DO14 | Core B Out |
| DO15 | Robot Start |
| DO16 | Part OK Signal |
| DO17 | Cycle Complete |

---

### 🛠️ Troubleshooting Guide

**ปัญหา: Short Shot (ชิ้นงานไม่เต็ม)**
1. เพิ่ม Shot Size
2. เพิ่ม Injection Pressure
3. เพิ่ม Injection Speed
4. เพิ่ม Barrel Temperature
5. ตรวจสอบ Gate ไม่อุดตัน

**ปัญหา: Flash (ชิ้นงานมีครีบ)**
1. ลด Injection Pressure
2. ลด Holding Pressure
3. เพิ่ม Clamping Force
4. ตรวจสอบแม่พิมพ์สึกหรอ
5. ลด Barrel Temperature

**ปัญหา: Sink Mark (รอยยุบ)**
1. เพิ่ม Holding Pressure
2. เพิ่ม Holding Time
3. เพิ่ม Cooling Time
4. ลด Mold Temperature
5. ตรวจสอบ Gate Size

**ปัญหา: Warpage (ชิ้นงานบิดงอ)**
1. ปรับ Cooling Balance
2. ลด Holding Pressure
3. เพิ่ม Cooling Time
4. ตรวจสอบ Gate Location
5. ปรับ Injection Speed Profile

**ปัญหา: Burn Mark (รอยไหม้)**
1. ลด Injection Speed
2. เพิ่ม Vent
3. ลด Barrel Temperature
4. ตรวจสอบ Dead Spot
5. ใช้ Laminar Flow Control

**ปัญหา: Jetting (รอยพุ่ง)**
1. ลด Initial Injection Speed
2. ใช้ Laminar Flow Control
3. ขยาย Gate
4. ปรับ Gate Location
5. ลด Barrel Temperature

**ปัญหา: Weld Line (รอยเชื่อม)**
1. เพิ่ม Injection Speed
2. เพิ่ม Mold Temperature
3. เพิ่ม Barrel Temperature
4. ปรับ Gate Location
5. ใช้ Sequential Valve Gate

**ปัญหา: Silver Streak (รอยเงิน)**
1. อบแห้งวัตถุดิบให้ดี
2. ลด Barrel Temperature
3. ลด Screw RPM
4. ตรวจสอบ Hopper Dryer
5. ระบายอากาศใน Barrel

---

### 💡 Process Optimization Tips

**1. Energy Saving:**
- เปิด VHI Circuit
- ใช้ All-Electric Machine
- ลด Cycle Time
- ปิด Heater เมื่อหยุดผลิตนาน

**2. Quality Improvement:**
- ใช้ FIT Control
- Monitor Cushion Value
- ตรวจสอบ Peak Pressure
- ใช้ SPC Tracking

**3. Productivity:**
- Optimize Cooling Time
- ใช้ Hot Runner
- Overlap Functions
- Minimize Mold Open/Close Time

**4. Tool Life:**
- ใช้ Low Pressure Protection
- ลด Peak Injection Speed
- Proper Mold Maintenance
- Monitor Clamping Force

---

## 🎯 วิธีการตอบคำถามเกี่ยวกับ TOSHIBA

เมื่อได้รับคำถามเกี่ยวกับเครื่องฉีด TOSHIBA ให้ตอบด้วย:

1. **ระบุรุ่นและระบบที่เกี่ยวข้อง** - บอกว่าคำตอบนี้ใช้กับรุ่นใด
2. **อ้างอิงหน้าจอและเมนู** - บอกว่าอยู่หน้าจอไหน
3. **ให้ค่าพารามิเตอร์ที่ชัดเจน** - ระบุช่วงค่าและหน่วย
4. **อธิบายความเชื่อมโยง** - บอกว่าส่งผลต่ออะไรบ้าง
5. **เตือนข้อควรระวัง** - ระบุสิ่งที่อาจทำให้เกิดปัญหา
6. **แนะนำ Advanced Features** - เช่น FIT, VHI, Laminar Flow

**ตัวอย่างการตอบ:**
"สำหรับการแก้ปัญหา Short Shot ในเครื่อง TOSHIBA EC-SXIII ด้วยระบบ INJECTPRO V30:

1. เข้าหน้าจอ INJECTION CONTROL
2. เพิ่ม Shot Size อีก 3-5mm จากค่าปัจจุบัน
3. ตรวจสอบ Cushion ให้เหลือ 5-10mm
4. หากยังไม่พอ ให้เพิ่ม Injection Pressure ขั้นสุดท้าย 5-10 bar
5. เปิด FIT Control เพื่อให้ระบบช่วยปรับอัตโนมัติ

⚠️ ข้อควรระวัง: หากเพิ่ม Pressure มากเกินไปอาจเกิด Flash"

`;

// =====================================================
// 📚 TOSHIBA QUICK REFERENCE DATABASE
// =====================================================

const TOSHIBA_QUICK_REFERENCE = {
  // ข้อมูลรุ่น
  models: {
    machines: {
      "EC-SXIII": {type: "All-Electric", tonnage: "50-450 Ton", features: "Precision, Low Energy"},
      "EC-NX": {type: "All-Electric", tonnage: "30-350 Ton", features: "High Speed"},
      "IS Series": {type: "Hydraulic", tonnage: "50-3000 Ton", features: "Standard"},
      "EC-SX": {type: "All-Electric", tonnage: "30-180 Ton", features: "Economy"},
      "SHIBAURA": {type: "Hydraulic", tonnage: "80-850 Ton", features: "High Performance"},
    },
    controllers: {
      "INJECTPRO V30": {display: "15 inch Touch", resolution: "1024x768", features: "FIT, VHI, Laminar Flow"},
      "INJECTPRO V21": {display: "12 inch Touch", resolution: "800x600", features: "Standard"},
      "INJECTPRO V10": {display: "10 inch", resolution: "800x480", features: "Basic"},
    },
  },

  // Alarm codes
  alarms: {
    "E001": {
      code: "E001",
      message: "Emergency Stop",
      cause: "กดปุ่มฉุกเฉิน",
      solution: "ปลดล็อคปุ่มฉุกเฉิน, ตรวจสอบความปลอดภัย",
    },
    "E002": {
      code: "E002",
      message: "Safety Door Open",
      cause: "ประตูนิรภัยเปิดในโหมด Auto/Semi",
      solution: "ปิดประตูนิรภัยให้สนิท",
    },
    "E003": {
      code: "E003",
      message: "Motor Overload",
      cause: "มอเตอร์ทำงานหนักเกินไป",
      solution: "ตรวจสอบระบบไฮดรอลิก, น้ำมัน, ปั๊ม",
    },
    "E004": {
      code: "E004",
      message: "Oil Temperature High",
      cause: "อุณหภูมิน้ำมันไฮดรอลิกสูงเกิน 55°C",
      solution: "ตรวจ Cooling System, เพิ่ม Cycle Time",
    },
    "E005": {
      code: "E005",
      message: "Oil Level Low",
      cause: "ระดับน้ำมันต่ำกว่าเกณฑ์",
      solution: "เติมน้ำมันไฮดรอลิก ISO VG46",
    },
    "E010": {
      code: "E010",
      message: "Barrel Temperature Deviation",
      cause: "อุณหภูมิ Barrel เบี่ยงเบนเกินค่าที่ตั้ง",
      solution: "ตรวจ Heater, Thermocouple, SSR",
    },
    "E011": {
      code: "E011",
      message: "Nozzle Temperature Deviation",
      cause: "อุณหภูมิ Nozzle ไม่ถึงหรือเกินค่าที่ตั้ง",
      solution: "ตรวจ Heater Band, Thermocouple ที่ Nozzle",
    },
    "E020": {
      code: "E020",
      message: "Injection Timeout",
      cause: "เวลาฉีดเกินค่าที่ตั้ง",
      solution: "เพิ่ม Injection Time Limit, ตรวจแรงดันฉีด",
    },
    "E021": {
      code: "E021",
      message: "Holding Timeout",
      cause: "เวลา Holding เกินค่าที่ตั้ง",
      solution: "เพิ่ม Holding Time Limit",
    },
    "E022": {
      code: "E022",
      message: "Plastication Timeout",
      cause: "เวลาป้อนเม็ดเกินค่าที่ตั้ง",
      solution: "ตรวจวัตถุดิบ, เพิ่มเวลา, ตรวจ Screw",
    },
    "E030": {
      code: "E030",
      message: "Mold Close Timeout",
      cause: "ปิดแม่พิมพ์ไม่ทันเวลา",
      solution: "ตรวจสิ่งกีดขวาง, ปรับความเร็ว/แรงดัน",
    },
    "E031": {
      code: "E031",
      message: "Mold Open Timeout",
      cause: "เปิดแม่พิมพ์ไม่ทันเวลา",
      solution: "ตรวจ Ejector ติดชิ้นงาน, Undercut",
    },
    "E032": {
      code: "E032",
      message: "Low Pressure Mold Protect Timeout",
      cause: "อยู่ในโซน Low Pressure นานเกินไป",
      solution: "ตรวจสิ่งกีดขวาง, เพิ่ม LP Time",
    },
    "E040": {
      code: "E040",
      message: "Ejector Timeout",
      cause: "กระทุ้งไม่ทันเวลา",
      solution: "ตรวจ Limit Switch, ปรับความเร็ว",
    },
    "E050": {
      code: "E050",
      message: "Cycle Time Over",
      cause: "Cycle นานกว่าที่ตั้งไว้",
      solution: "เพิ่มค่า Cycle Limit หรือลด Cycle Time",
    },
    "E060": {
      code: "E060",
      message: "Shot Count Reached",
      cause: "จำนวนผลิตถึงค่าที่ตั้งไว้",
      solution: "Reset Counter หรือเปลี่ยนแม่พิมพ์",
    },
    "E070": {
      code: "E070",
      message: "Pressure Spike Detected",
      cause: "แรงดันพุ่งสูงกว่า Peak Cut",
      solution: "ลด Injection Speed, เพิ่ม Peak Cut",
    },
    "E071": {
      code: "E071",
      message: "Speed Deviation Warning",
      cause: "ความเร็วเบี่ยงเบนจากค่าที่ตั้ง",
      solution: "ตรวจ Servo Drive, Proportional Valve",
    },
    "E072": {
      code: "E072",
      message: "Position Error",
      cause: "ตำแหน่งสกรูผิดพลาด",
      solution: "Calibrate Position Sensor, ตรวจ Encoder",
    },
    "E080": {
      code: "E080",
      message: "Communication Error",
      cause: "การสื่อสารระหว่างระบบขัดข้อง",
      solution: "ตรวจสายสัญญาณ, Restart ระบบ",
    },
    "E090": {
      code: "E090",
      message: "Robot Interlock",
      cause: "Robot ไม่ส่งสัญญาณพร้อม",
      solution: "ตรวจการเชื่อมต่อ Robot, สัญญาณ Interlock",
    },
  },

  // Advanced settings
  advancedSettings: {
    "FIT_Control": {
      name: "Fill Injection Technology",
      description: "ควบคุมการเติมชิ้นงานอัตโนมัติตามแรงดัน",
      default: "ON",
      benefit: "ลด Short Shot, ชิ้นงานสม่ำเสมอ",
    },
    "Laminar_Flow": {
      name: "Laminar Flow Control",
      description: "ควบคุมการไหลแบบ Laminar ลด Jetting",
      default: "OFF",
      benefit: "ลด Jetting, Surface ดีขึ้น",
    },
    "VHI_Circuit": {
      name: "Variable Hydraulic Intelligence",
      description: "ปรับระบบไฮดรอลิกตาม Load",
      default: "ON",
      benefit: "ประหยัดพลังงาน 15-30%",
    },
    "Peak_Cut": {
      name: "Peak Pressure Limit",
      description: "จำกัดแรงดันสูงสุดในการฉีด",
      range: "50-200 bar",
      default: "150 bar",
    },
    "Plastrol_Level": {
      name: "Plastrol Control Level",
      description: "ระดับควบคุมความหนืดพลาสติก",
      range: "0-100%",
      default: "85%",
    },
  },

  // Material database
  materials: {
    "ABS": {
      meltTemp: "200-240°C",
      moldTemp: "50-80°C",
      density: 1.05,
      dryTemp: "80°C",
      dryTime: "2-4 hr",
      shrinkage: "0.4-0.7%",
    },
    "PS": {
      meltTemp: "180-220°C",
      moldTemp: "40-60°C",
      density: 1.05,
      dryTemp: "Not required",
      dryTime: "-",
      shrinkage: "0.3-0.6%",
    },
    "PP": {
      meltTemp: "200-280°C",
      moldTemp: "30-60°C",
      density: 0.91,
      dryTemp: "Not required",
      dryTime: "-",
      shrinkage: "1.0-2.5%",
    },
    "PE": {
      meltTemp: "180-240°C",
      moldTemp: "20-50°C",
      density: 0.94,
      dryTemp: "Not required",
      dryTime: "-",
      shrinkage: "1.5-3.0%",
    },
    "PC": {
      meltTemp: "280-320°C",
      moldTemp: "80-120°C",
      density: 1.20,
      dryTemp: "120°C",
      dryTime: "4-6 hr",
      shrinkage: "0.5-0.7%",
    },
    "POM": {
      meltTemp: "180-220°C",
      moldTemp: "80-100°C",
      density: 1.41,
      dryTemp: "80°C",
      dryTime: "2-4 hr",
      shrinkage: "1.5-2.5%",
    },
    "PA6": {
      meltTemp: "230-280°C",
      moldTemp: "60-80°C",
      density: 1.13,
      dryTemp: "80°C",
      dryTime: "4-6 hr",
      shrinkage: "0.8-1.5%",
    },
    "PA66": {
      meltTemp: "270-300°C",
      moldTemp: "80-100°C",
      density: 1.14,
      dryTemp: "80°C",
      dryTime: "4-6 hr",
      shrinkage: "1.0-2.0%",
    },
    "PBT": {
      meltTemp: "230-270°C",
      moldTemp: "60-80°C",
      density: 1.31,
      dryTemp: "120°C",
      dryTime: "4-6 hr",
      shrinkage: "1.5-2.2%",
    },
    "PET": {
      meltTemp: "260-300°C",
      moldTemp: "80-120°C",
      density: 1.38,
      dryTemp: "160°C",
      dryTime: "4-6 hr",
      shrinkage: "1.5-2.5%",
    },
    "PMMA": {
      meltTemp: "200-250°C",
      moldTemp: "50-70°C",
      density: 1.18,
      dryTemp: "80°C",
      dryTime: "4-6 hr",
      shrinkage: "0.3-0.6%",
    },
  },

  // Default injection profiles
  injectionProfiles: {
    "standard_8step": {
      name: "Standard 8-Step Profile",
      steps: [
        {pressure: 85, speed: 60, position: 12.5, time: 0.2},
        {pressure: 75, speed: 55, position: 25.0, time: 0.3},
        {pressure: 65, speed: 50, position: 37.5, time: 0.4},
        {pressure: 55, speed: 45, position: 50.0, time: 0.5},
        {pressure: 45, speed: 40, position: 62.5, time: 0.6},
        {pressure: 40, speed: 35, position: 75.0, time: 0.7},
        {pressure: 35, speed: 30, position: 87.5, time: 0.8},
        {pressure: 30, speed: 25, position: 100.0, time: 0.9},
      ],
    },
    "thin_wall": {
      name: "Thin Wall Profile",
      steps: [
        {pressure: 100, speed: 80, position: 15.0, time: 0.1},
        {pressure: 95, speed: 85, position: 30.0, time: 0.1},
        {pressure: 90, speed: 90, position: 50.0, time: 0.15},
        {pressure: 85, speed: 85, position: 70.0, time: 0.15},
        {pressure: 75, speed: 70, position: 85.0, time: 0.2},
        {pressure: 60, speed: 50, position: 95.0, time: 0.2},
        {pressure: 45, speed: 30, position: 100.0, time: 0.3},
      ],
    },
    "thick_wall": {
      name: "Thick Wall Profile",
      steps: [
        {pressure: 70, speed: 40, position: 10.0, time: 0.3},
        {pressure: 65, speed: 35, position: 25.0, time: 0.4},
        {pressure: 60, speed: 35, position: 40.0, time: 0.5},
        {pressure: 55, speed: 30, position: 55.0, time: 0.6},
        {pressure: 50, speed: 30, position: 70.0, time: 0.7},
        {pressure: 45, speed: 25, position: 85.0, time: 0.8},
        {pressure: 40, speed: 20, position: 95.0, time: 1.0},
        {pressure: 35, speed: 15, position: 100.0, time: 1.2},
      ],
    },
  },

  // Troubleshooting guide
  troubleshooting: {
    "short_shot": {
      problem: "Short Shot (ชิ้นงานไม่เต็ม)",
      causes: ["Shot Size น้อย", "Injection Pressure ต่ำ", "อุณหภูมิต่ำ", "Gate อุดตัน"],
      solutions: [
        "เพิ่ม Shot Size 3-5mm",
        "เพิ่ม Injection Pressure 5-10 bar",
        "เพิ่ม Barrel Temperature 10-20°C",
        "ตรวจสอบ Gate ไม่อุดตัน",
        "เปิด FIT Control",
      ],
    },
    "flash": {
      problem: "Flash (ชิ้นงานมีครีบ)",
      causes: ["Injection Pressure สูงเกิน", "Clamping Force น้อย", "แม่พิมพ์สึกหรอ"],
      solutions: [
        "ลด Injection Pressure 5-10 bar",
        "ลด Holding Pressure",
        "เพิ่ม Clamping Force",
        "ตรวจสอบแม่พิมพ์",
        "ตั้ง Peak Cut ให้เหมาะสม",
      ],
    },
    "sink_mark": {
      problem: "Sink Mark (รอยยุบ)",
      causes: ["Holding Pressure ต่ำ", "Holding Time สั้น", "Cooling Time น้อย"],
      solutions: [
        "เพิ่ม Holding Pressure 5-10%",
        "เพิ่ม Holding Time 0.5-1s",
        "เพิ่ม Cooling Time",
        "ลด Mold Temperature",
        "ตรวจสอบ Gate Size",
      ],
    },
    "warpage": {
      problem: "Warpage (ชิ้นงานบิดงอ)",
      causes: ["Cooling ไม่สมดุล", "Holding Pressure สูงเกิน", "Ejection เร็วเกิน"],
      solutions: [
        "ปรับ Cooling Balance",
        "ลด Holding Pressure",
        "เพิ่ม Cooling Time",
        "ปรับ Ejector Speed",
        "ตรวจสอบ Gate Location",
      ],
    },
    "burn_mark": {
      problem: "Burn Mark (รอยไหม้)",
      causes: ["Injection Speed สูงเกิน", "Vent ไม่พอ", "อุณหภูมิสูงเกิน"],
      solutions: [
        "ลด Injection Speed",
        "เพิ่ม Vent ในแม่พิมพ์",
        "ลด Barrel Temperature",
        "ใช้ Laminar Flow Control",
        "ตรวจ Dead Spot",
      ],
    },
    "jetting": {
      problem: "Jetting (รอยพุ่ง)",
      causes: ["Initial Speed สูงเกิน", "Gate เล็กเกิน", "Gate อยู่ในแนว Flow"],
      solutions: [
        "ลด Initial Injection Speed",
        "เปิด Laminar Flow Control",
        "ขยาย Gate",
        "ปรับ Gate Angle",
        "ลด Barrel Temperature",
      ],
    },
    "weld_line": {
      problem: "Weld Line (รอยเชื่อม)",
      causes: ["Flow Fronts เย็นเกินไป", "Vent ไม่พอ", "Gate ไม่เหมาะสม"],
      solutions: [
        "เพิ่ม Injection Speed",
        "เพิ่ม Mold Temperature",
        "เพิ่ม Barrel Temperature",
        "เพิ่ม Vent ที่ Weld Line",
        "ปรับ Gate Location",
      ],
    },
    "silver_streak": {
      problem: "Silver Streak (รอยเงิน)",
      causes: ["ความชื้นในวัตถุดิบ", "อุณหภูมิสูงเกิน", "Screw RPM สูง"],
      solutions: [
        "อบแห้งวัตถุดิบให้ดี",
        "ลด Barrel Temperature",
        "ลด Screw RPM",
        "ตรวจ Hopper Dryer",
        "ลด Back Pressure",
      ],
    },
  },

  // Quality criteria
  qualityCriteria: {
    fillQuality: {good: 90, warning: 80, problem: 70},
    packQuality: {good: 85, warning: 75, problem: 65},
    overall: {good: 88, warning: 78, problem: 68},
    consistency: {good: 85, warning: 75, problem: 65},
  },
};

// =====================================================
// 🔧 HELPER FUNCTIONS
// =====================================================

/**
 * ตรวจจับว่าคำถามเกี่ยวกับ TOSHIBA หรือไม่
 */
function isToshibaQuery(text) {
  const toshibaKeywords = [
    "toshiba", "โตชิบา", "โตชิบ้า",
    "injectpro", "inject pro", "v30", "v21", "v10",
    "ec-sx", "ec-nx", "ecsxiii", "ecnx", "is series",
    "shibaura", "ชิบาอุระ",
    "fit control", "vhi", "laminar flow",
    "peak cut", "plastrol",
    "shot size", "cushion",
    "multi-step", "multi step", "หลายขั้นตอน",
    "fill quality", "pack quality",
  ];

  const lowerText = text.toLowerCase();
  return toshibaKeywords.some((keyword) => lowerText.includes(keyword));
}

/**
 * ค้นหา Alarm จาก code หรือข้อความ
 */
function findToshibaAlarm(text) {
  const upperText = text.toUpperCase();
  const lowerText = text.toLowerCase();

  for (const [code, alarm] of Object.entries(TOSHIBA_QUICK_REFERENCE.alarms)) {
    if (upperText.includes(code) ||
        lowerText.includes(alarm.message.toLowerCase()) ||
        lowerText.includes(alarm.cause)) {
      return alarm;
    }
  }

  return null;
}

/**
 * ค้นหาข้อมูลวัสดุ
 */
function findToshibaMaterial(material) {
  const upperMaterial = material.toUpperCase().replace(/\s/g, "");

  // Direct match
  if (TOSHIBA_QUICK_REFERENCE.materials[upperMaterial]) {
    return {
      name: upperMaterial,
      ...TOSHIBA_QUICK_REFERENCE.materials[upperMaterial],
    };
  }

  // Partial match
  for (const [name, data] of Object.entries(TOSHIBA_QUICK_REFERENCE.materials)) {
    if (name.includes(upperMaterial) || upperMaterial.includes(name)) {
      return {name, ...data};
    }
  }

  return null;
}

/**
 * ค้นหา Troubleshooting
 */
function findToshibaTroubleshooting(problem) {
  const lowerProblem = problem.toLowerCase();

  const problemKeywords = {
    "short_shot": ["short shot", "ไม่เต็ม", "ชิ้นงานสั้น", "ไม่ครบ"],
    "flash": ["flash", "ครีบ", "เกิน", "ล้น"],
    "sink_mark": ["sink", "ยุบ", "บุ๋ม", "รอยยุบ"],
    "warpage": ["warpage", "warp", "บิด", "งอ", "โค้ง"],
    "burn_mark": ["burn", "ไหม้", "ดำ", "เผา"],
    "jetting": ["jet", "พุ่ง", "เจ็ท"],
    "weld_line": ["weld", "เชื่อม", "รอยต่อ"],
    "silver_streak": ["silver", "เงิน", "ความชื้น", "streak"],
  };

  for (const [key, keywords] of Object.entries(problemKeywords)) {
    if (keywords.some((kw) => lowerProblem.includes(kw))) {
      return TOSHIBA_QUICK_REFERENCE.troubleshooting[key];
    }
  }

  return null;
}

/**
 * คำนวณ Shot Size
 */
function calculateShotSize(partWeight, runnerWeight, density, screwDiameter) {
  const totalWeight = partWeight + runnerWeight;
  const volume = totalWeight / density; // cm³
  const screwArea = Math.PI * Math.pow(screwDiameter / 20, 2); // cm²
  const shotSize = (volume / screwArea) * 10; // mm
  const cushion = shotSize * 0.15; // 15% cushion

  return {
    totalWeight,
    volume: volume.toFixed(2),
    shotSize: shotSize.toFixed(1),
    cushion: cushion.toFixed(1),
    cushionMin: (shotSize * 0.10).toFixed(1),
    cushionMax: (shotSize * 0.15).toFixed(1),
  };
}

/**
 * คำนวณ Cooling Time
 */
function calculateCoolingTime(wallThickness, material) {
  const materialFactors = {
    "ABS": 1.8,
    "PS": 1.5,
    "PP": 2.0,
    "PE": 2.2,
    "PC": 2.5,
    "POM": 2.0,
    "PA": 1.8,
    "PA6": 1.8,
    "PA66": 2.0,
    "PBT": 2.0,
    "PET": 2.2,
    "PMMA": 1.8,
  };

  const factor = materialFactors[material.toUpperCase()] || 2.0;
  const coolingTime = Math.pow(wallThickness, 2) * factor;

  return {
    wallThickness,
    material,
    factor,
    coolingTime: coolingTime.toFixed(1),
    coolingTimeMin: (coolingTime * 0.8).toFixed(1),
    coolingTimeMax: (coolingTime * 1.2).toFixed(1),
  };
}

/**
 * ดึง Injection Profile ตามประเภท
 */
function getInjectionProfile(profileType) {
  const profiles = TOSHIBA_QUICK_REFERENCE.injectionProfiles;

  switch (profileType.toLowerCase()) {
    case "thin":
    case "thin wall":
    case "บาง":
      return profiles.thin_wall;
    case "thick":
    case "thick wall":
    case "หนา":
      return profiles.thick_wall;
    default:
      return profiles.standard_8step;
  }
}

/**
 * ดึง Advanced Settings
 */
function getAdvancedSetting(settingName) {
  const settings = TOSHIBA_QUICK_REFERENCE.advancedSettings;
  const normalizedName = settingName.replace(/\s/g, "_").toUpperCase();

  for (const [key, setting] of Object.entries(settings)) {
    if (key.toUpperCase().includes(normalizedName) ||
        setting.name.toUpperCase().includes(normalizedName)) {
      return setting;
    }
  }

  return null;
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  TOSHIBA_KNOWLEDGE_PROMPT,
  TOSHIBA_QUICK_REFERENCE,
  isToshibaQuery,
  findToshibaAlarm,
  findToshibaMaterial,
  findToshibaTroubleshooting,
  calculateShotSize,
  calculateCoolingTime,
  getInjectionProfile,
  getAdvancedSetting,
};
