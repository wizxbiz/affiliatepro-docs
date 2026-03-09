/**
 * FANUC ROBOSHOT Knowledge Prompt
 * ความรู้เครื่องฉีดพลาสติก FANUC ROBOSHOT α-SiB Series
 * Source: fanuc machine.pdf (25 pages)
 * Version: 1.0
 */

const FANUC_KNOWLEDGE_PROMPT = `
## FANUC ROBOSHOT α-SiB Series - All Electric Injection Moulding Machine

### ข้อมูลทั่วไป FANUC ROBOSHOT
- **ผู้ผลิต**: FANUC Corporation (Japan)
- **ประเภท**: เครื่องฉีดพลาสติกไฟฟ้าทั้งหมด (All Electric)
- **ประสบการณ์**: มากกว่า 35 ปีในเทคโนโลยี ROBOSHOT
- **มาตรฐานความปลอดภัย**: EN ISO 20430:2020
- **เว็บไซต์**: www.fanuc.eu

### ข้อดีหลักของ FANUC ROBOSHOT
1. **ความแม่นยำสูงสุด** (Maximum Precision)
2. **ความน่าเชื่อถือพิสูจน์แล้ว** (Proven Reliability)
3. **การทำซ้ำได้ดีเยี่ยม** (Excellent Repeatability)
4. **การควบคุมกระบวนการขั้นสูง** (Ultimate Process Control)
5. **ซ่อมบำรุงต่ำมาก** (Very Low Maintenance)
6. **ต้นทุนรวมต่ำสุด** (Lowest Cost of Ownership)

### Total Cost of Ownership (TCO) เปรียบเทียบ
| รายการ | FANUC ROBOSHOT | Electric IMM อื่น | Hydraulic IMM |
|--------|----------------|-------------------|---------------|
| ค่าเริ่มต้น | ใกล้เคียง | ใกล้เคียงหรือสูงกว่า | ต่ำกว่า |
| ค่าดำเนินการ | ประหยัดพลังงานสูงสุด | สูงกว่า 5-10% | สูงกว่า 50-70% |
| ค่าซ่อมบำรุง | ต่ำสุดในตลาด | สูงกว่า 25-30% | สูงกว่า 80-90% |
| ค่า Downtime | ต่ำสุดในตลาด | สูงกว่า 10-20% | สูงกว่า 50-70% |
| มูลค่าขายต่อ | สูง | ปานกลาง | ต่ำ |

**ค่าใช้จ่ายเฉลี่ย**: เพียง **€555/ปี** (ชิ้นส่วนและบริการ)
- ข้อมูลจาก 11 บริษัท, 98 เครื่อง ROBOSHOT, รวม 65 ปี

---

### Panel iHPro Controller (หน้าจอควบคุม)
- **หน้าจอ**: 21.5" Full HD Colour Touchscreen
- **การแสดงผล**: Split Screen, Simultaneous Display
- **การทำงาน**: Swipe และ Pinch Gestures
- **ภาษา**: รองรับ 23 ภาษา
- **Response Time**: ปรับปรุงให้เร็วขึ้น

**ความจุ Log ที่เพิ่มขึ้น**:
- Alarm Log: 5,000 → **50,000** รายการ
- Last Change Log: 10,000 → **100,000** รายการ
- Operations Log: 10,000 → **100,000** รายการ
- Process Monitor History: 40 items x 100,000 shots

**การเชื่อมต่อ**:
- LAN Ports: 1 → **2 พอร์ต** (มาตรฐาน)
- USB Ports: 1 → **2 พอร์ต** (USB 3.0)
- รองรับ **Euromap 77**
- VNC Remote Display
- ROBOSHOT-LINKi2 Production Monitoring

---

### รุ่นและขนาดเครื่อง α-SiB Series

#### ขนาดเล็ก (Small Tonnage)
| รุ่น | แรงปิดแม่พิมพ์ | Tie Bar Spacing (HxV) | Platen Size |
|------|---------------|----------------------|-------------|
| **α-S30iB** | 300 kN (30 ton) | 310 x 290 mm | 440 x 420 mm |
| **α-S50iB** | 500-650 kN (50-65 ton) | 360 x 320 mm | 500 x 470 mm |
| **α-S100iB** | 1000-1250 kN (100-125 ton) | 460 x 410 mm | 660 x 610 mm |

#### ขนาดกลาง (Medium Tonnage)
| รุ่น | แรงปิดแม่พิมพ์ | Tie Bar Spacing (HxV) | Platen Size |
|------|---------------|----------------------|-------------|
| **α-S130iB** | 1300 kN (130 ton) | 530 x 530 mm | 730 x 730 mm |
| **α-S150iB** | 1500-1800 kN (150-180 ton) | 560 x 510 mm | 800 x 750 mm |
| **α-S220iB** | 2200 kN (220 ton) | 650 x 650 mm | 900 x 900 mm |

#### ขนาดใหญ่ (Large Tonnage)
| รุ่น | แรงปิดแม่พิมพ์ | Tie Bar Spacing (HxV) | Platen Size |
|------|---------------|----------------------|-------------|
| **α-S250iB** | 2500-3000 kN (250-300 ton) | 710 x 635 mm | 1030 x 960 mm |
| **α-S300iB** | 3000-3500 kN (300-350 ton) | 810 x 710 mm | 1130 x 1030 mm |
| **α-S450iB** | 4500-5000 kN (450-500 ton) | 920 x 920 mm | 1300 x 1300 mm |

---

### Injection Unit Specifications

#### ความเร็วฉีด (Injection Speed Options)
- **200 mm/s** - Standard
- **350 mm/s** - High Speed
- **550 mm/s** - Ultra High Speed
- **600 mm/s** - Maximum (บางรุ่น)

#### Screw Diameter Range (ตามรุ่น)
| รุ่น | Screw Diameter Range |
|------|---------------------|
| α-S30iB | 14-22 mm |
| α-S50iB | 18-32 mm |
| α-S100iB | 22-40 mm |
| α-S130iB | 26-40 mm |
| α-S150iB | 22-52 mm |
| α-S220iB | 32-56 mm |
| α-S300iB | 32-72 mm |
| α-S450iB | 40-100 mm |

#### Max Injection Pressure
- **High-pressure filling mode**: สูงถึง 380 MPa
- **W/C injection unit**: 160-310 MPa
- **PAL injection unit**: 150-280 MPa

#### Injection Control Features
- **10 stages** of injection speed & pressure control
- **6 stages** of holding pressure control
- **6 stages** of plasticising control
- Position control resolution: **10 micron**
- Pressure control: **1 bar** increments
- Temperature control: **0.1°C** increments

---

### Clamping Unit Features

**Toggle Mechanism**: 5-point toggle mechanism

**Die Height**:
| รุ่น | Max Die Height | Min Die Height |
|------|----------------|----------------|
| α-S30iB | 330 mm | 150 mm |
| α-S100iB | 450-550 mm | 150 mm |
| α-S150iB | 500-600 mm | 200-275 mm |
| α-S300iB | 650-750 mm | 300 mm |
| α-S450iB | 1000 mm | 350 mm |

**Clamping Stroke**:
- α-S30iB: 230 mm
- α-S50iB: 250 mm
- α-S100iB: 350 mm
- α-S130iB: 400 mm
- α-S150iB: 440 mm
- α-S220iB: 550 mm
- α-S300iB: 600 mm
- α-S450iB: 900 mm

**Ejector System**:
- Ball drive ejector system
- SPI Ejector hole pattern (standard)
- Linear guide rails
- AI Ejector Protection

**Ejector Force by Model**:
| รุ่น | Ejector Points | Ejector Force | Ejector Stroke |
|------|---------------|---------------|----------------|
| α-S30iB | 1 | 8 kN (0.8 ton) | 60 mm |
| α-S50iB | 5 | 20-60 kN (2-6 ton) | 70 mm |
| α-S100iB | 5 | 25-60 kN (2.5-6 ton) | 100 mm |
| α-S150iB | 5 | 35-80 kN (3.5-8 ton) | 150 mm |
| α-S300iB | 9 | 80 kN (8 ton) | 200 mm |
| α-S450iB | 17 | 150 kN (15 ton) | 250 mm |

---

### AI Features (Artificial Intelligence)

#### AI Mould Protection
- ป้องกันแม่พิมพ์ตลอดการเปิด-ปิด
- วัด Motor Torque และหยุดทันทีเมื่อพบสิ่งกีดขวาง
- ไม่ลดความเร็วปิดแม่พิมพ์
- แจ้งเตือนเมื่อต้องหล่อลื่นหรือแม่พิมพ์สึกหรอ

#### AI Ejector Protection
- ป้องกันทั้งทิศทางเดินหน้าและถอยหลัง
- ปรับปรุง Ejector Acceleration

#### AI Metering Control
- ใช้ Torque Control แทน Speed Control
- Variable Screw Rotation Speed
- เสถียรในการ Plasticising

#### AI Backflow Monitor
- แสดงสถานะภายใน Check Valve
- ตรวจสอบ Closing Characteristics
- แจ้งเตือนการสึกหรอของ Check Ring
- ไม่ต้องถอดชุด Barrel เพื่อตรวจสอบ

#### AI Pressure Profile Trace Control
- ควบคุม Pressure Curve
- รักษาเสถียรภาพแม้มี Internal Violation

---

### Energy Saving (การประหยัดพลังงาน)

**เทียบกับเครื่อง Hydraulic**: ประหยัด **50-70%**
**เทียบกับเครื่อง Electric อื่น**: ประหยัด **5-10%**

**Power Consumption Screen** (มาตรฐาน):
- แสดงการใช้พลังงานในแต่ละขั้นตอน
- Energy Analysis Page
- ระบุ Regenerative Power
- ช่วยลด CO₂ และ Ecological Footprint

**ข้อดีเพิ่มเติม**:
- ไม่มีน้ำมันไฮดรอลิก → ไม่มีค่าน้ำมันและรีไซเคิล
- ชิ้นส่วนน้อยกว่า
- ความร้อนปล่อยสู่บรรยากาศต่ำกว่า

---

### Special Moulding Capabilities

#### 1. Thin Wall Moulding
- Light guide ความหนา **0.1 mm**
- High speed injection สูงถึง **550 mm/s**

#### 2. Micro-Injection Moulding
- Repeatable shot weights ตั้งแต่ **0.1 g**

#### 3. Multi-Component Moulding
- Vertical Injection Unit (SI-20A)
- Horizontal Injection Unit (SI-300HA)
- ฉีดได้ถึง 3 components พร้อมกัน

#### 4. LSR Moulding (Liquid Silicone Rubber)
- Cylinder modules with modified screws
- Shut Off Nozzle for LSR
- Integrated mould heating
- Fully integrated vacuum system

#### 5. Metal/Ceramic Injection Moulding (MIM/CIM)
- High precision moulding capability
- High stability at low back pressure
- Pre-injection function
- Pre-ejector function

#### 6. Thermoset Injection
- Special Screw & Barrel combinations
- Thermoset Special Nozzle
- Stability of temperature control

---

### Precise Metering Functions

#### FANUC Precise Metering 2
- Advanced decompression control
- Reverse rotation of screw after plasticising

#### FANUC Precise Metering 3
- ตรวจสอบ Volume หลัง plasticising
- Automatic V-P adjustment
- Decompression adjustment อัตโนมัติ
- ไม่ต้องตั้งค่าหลายพารามิเตอร์

**ประโยชน์**:
- Constant plasticising volume
- ลดการเปลี่ยนแปลงน้ำหนักชิ้นงาน
- หลีกเลี่ยง Bubbles และ Silver Strings

---

### Clamp Force Adjustment

**FANUC Clamp Force Adjustment**:
- ตรวจสอบและปรับ Minimum Clamp Force อัตโนมัติ
- เพิ่มความปลอดภัย
- ไม่ต้องปรับแรงปิดแม่พิมพ์เอง

**ประโยชน์**:
- ลดการสึกหรอแม่พิมพ์
- เพิ่มอายุเครื่อง
- ลดข้อบกพร่องชิ้นงาน
- ประหยัดพลังงาน
- ลดเวลา Start-up

---

### ROBOSHOT-LINKi2 (Production Monitoring)

**ความสามารถ**:
- จัดการได้ถึง **1,000 เครื่อง** แบบ Real-time
- เข้าถึงผ่าน Web Browser บน PC หรือ Tablet
- แสดงบน Split Screen Display
- เชื่อมต่อผ่าน Euromap 63 หรือ 77
- เก็บ Log Data ได้ถึง **120 เดือน**

**Status Monitor**:
- ลดต้นทุนและเพิ่ม Operation Rate
- ตรวจสอบการใช้พลังงาน
- ตรวจสอบ Process Parameters
- Upload/Download Mould Files
- Productivity & Efficiency Data

**Quality Information**:
- Traceability และ Advanced Quality Analysis
- สืบค้นสาเหตุความล้มเหลว
- Export เป็น CSV (Configurable)

**Diagnosis**:
- Alarm History
- Operation/Parameter Change History
- Remote Operation Functions
- Resin Evaluation Tool

---

### Multi Cavity Pressure Monitoring

- รองรับสูงถึง **16 Multi Cavity Pressure Channels**
- Cavity Balance Monitoring
- Historical Data Collection
- ตรวจสอบผ่าน CNC โดยตรง

---

### Industry Applications

#### 1. Automotive Industry
- High-volume component production
- Gas venting functions
- 6 different screw sizes for versatility
- Fast cycle times

#### 2. Medical Industry
- ความโปร่งใสของผลิตภัณฑ์
- Pre-injection และ AI Metering Control
- Quality, Reliability, Repeatability
- Traceability (Euromap 63/77, LINKi2)

#### 3. Electrical Industry
- Small electrical components
- Thin wall capability
- Viscosity compensation
- Active gas venting

#### 4. Optical Industry
- Injection speed ต่ำถึง **0.5 mm/s**
- High-pressure moulding
- Optimised screw/barrel for transparent materials
- Thick wall capability

#### 5. Construction & Furniture
- Precise temperature control
- Integrated hot-runner controller
- Small parts (wall ties, packers, shims)

#### 6. Consumer Goods & Packaging
- Speed and consistency
- Cost-effective operations
- Ultra-low maintenance

---

### Connectivity & Interfaces

**มาตรฐาน**:
- 2 LAN Ports (100Base-TX/1000Base-T)
- 2 USB Ports (3.0/2.0/1.1)
- E67 Robot Interface
- 12 Machine Status Inputs
- 8 Machine Status Outputs

**Optional**:
- Ethernet Hub 5 ports
- E67/73 Robot interface
- 12 programmable outputs, 8 inputs
- Valve Gate Interface (8 or 16 circuits)
- Analog Input/Output
- Additional Axis Control (up to 4 servo cores)

**Communication Protocols**:
- SPI Protocol - Mould Temperature, Dryers, Loaders, Chillers
- SPI Protocol - Hot Runner
- Euromap 63
- Euromap 77
- VNC (Virtual Network Computing)

---

### Vertical Injection Unit SI-20A

**สำหรับ**: 100-300 ton machines
**ติดตั้ง**: บนเครื่อง ROBOSHOT

| Specification | SI-20A |
|--------------|--------|
| Screw Diameter | 14-22 mm |
| Screw Stroke | 56-75 mm |
| Max Injection Volume | 9-29 cm³ |
| Max Injection Speed | 300 mm/s |
| Max Injection Pressure | 120-200 MPa |
| Nozzle Touch Force | 3 kN (0.3 ton) |
| Machine Weight | ~0.65 ton (injection) + ~0.15 ton (control) |

---

### Horizontal Injection Unit SI-300HA

**สำหรับ**: α-SiA models, 100+ ton
**ติดตั้ง**: ด้านข้างเครื่อง

| Specification | SI-300HA |
|--------------|----------|
| Screw Diameter | 26-40 mm |
| Screw Stroke | 95-144 mm |
| Max Injection Volume | 50-181 cm³ |
| Max Injection Speed | 330 mm/s |
| Max Injection Pressure | 160-260 MPa |
| Nozzle Touch Force | 15 kN (1.5 ton) |
| Machine Weight | ~2.0 ton |

---

### Robot Integration (QSSR)

**FANUC Quick & Simple Start up of Robotisation (QSSR)**:
- ติดตั้ง FANUC Robot ได้ในไม่กี่ขั้นตอน
- Plug and Play connectivity
- Loading/Unloading, Assembly, Pick & Place
- ความแม่นยำ **±0.01 mm** (ขึ้นอยู่กับรุ่น Robot)

**iRVision Integration**:
- Visual Error Proofing
- Part Placement and Orientation
- Cavity Identification
- Defect Detection

---

### Maintenance & Support

**Maintenance Services**:
- Preventive, Predictive, Reactive
- Visual Maintenance Interface
- Early Warning System

**Spare Parts**:
- Availability: **99.98%**
- 20+ Parts Centres in Europe
- Direct Online Access

**Training**: FANUC Academy
- Beginner to Expert courses
- On-site training
- Cross-machine training

**Extended Warranty**:
- Standard 24 months
- Up to 5 years available

**FANUC Assisted Reality (FAR)**:
- Remote Diagnosis
- Remote Support during Field Service
- Reduce Downtime

---

### Machine Weight Summary

| รุ่น | น้ำหนักเครื่อง (Double/Single Platen) |
|------|--------------------------------------|
| α-S30iB | ~2.0-2.9 ton |
| α-S50iB | ~4.25-4.4 ton |
| α-S100iB | ~4.25-4.4 ton |
| α-S130iB | ~4.9 ton |
| α-S150iB | ~6.15-7.2 ton |
| α-S220iB | ~8.7-8.85 ton |
| α-S250iB | ~12.5 ton |
| α-S300iB | ~13.7-14.2 ton |
| α-S450iB | ~24.8-29.7 ton |

---

### Locating Ring Diameter

| รุ่น | Locating Ring |
|------|--------------|
| α-S30iB | Ø 100 mm |
| α-S50iB, S100iB, S130iB | Ø 125 mm |
| α-S150iB+ | Ø 160 mm |
| α-S450iB | Ø 200 mm |

---

### Troubleshooting Guide

**ปัญหาทั่วไปและแนวทางแก้ไข**:

| ปัญหา | สาเหตุที่เป็นไปได้ | แนวทางแก้ไข |
|-------|-------------------|-------------|
| ชิ้นงานไม่เต็ม | - ความเร็วฉีดต่ำ | - เพิ่ม Injection Speed |
| | - แรงดันไม่พอ | - เพิ่ม Injection Pressure |
| | - อุณหภูมิต่ำ | - เพิ่มอุณหภูมิ Barrel |
| Flash (เกินแนว) | - แรงปิดแม่พิมพ์ไม่พอ | - ใช้ Clamp Force Adjustment |
| | - แรงดันฉีดสูง | - ลด Injection Pressure |
| Silver Strings | - ความชื้นในวัสดุ | - อบวัสดุให้แห้ง |
| | - ปริมาตรฉีดไม่คงที่ | - ใช้ Precise Metering 3 |
| Bubbles | - Gas ในวัสดุ | - ใช้ Pre-injection function |
| | - Back pressure ต่ำ | - เพิ่ม Back Pressure |
| น้ำหนักไม่คงที่ | - Check Valve สึกหรอ | - ตรวจด้วย AI Backflow Monitor |
| | - Decompression ไม่เหมาะสม | - ใช้ Precise Metering 2 |

---

### ข้อมูลติดต่อ FANUC
- **เว็บไซต์**: www.fanuc.eu
- **Service**: www.fanuc.eu/service
- **Global Network**: Sales, Support, Service ทั่วโลก
`;

module.exports = { FANUC_KNOWLEDGE_PROMPT };
