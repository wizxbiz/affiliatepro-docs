/**
 * YUSHIN Robot Knowledge Prompt
 * ความรู้หุ่นยนต์ดึงชิ้นงาน YUSHIN
 * Note: PDF เป็น scanned image - ใช้ข้อมูลจากความรู้ทั่วไป
 * Version: 1.0
 */

const YUSHIN_KNOWLEDGE_PROMPT = `
## YUSHIN Take-Out Robot - หุ่นยนต์ดึงชิ้นงานพลาสติก

### ข้อมูลทั่วไป YUSHIN
- **ผู้ผลิต**: YUSHIN PRECISION EQUIPMENT Co., Ltd. (Japan)
- **ก่อตั้ง**: 1973
- **สำนักงานใหญ่**: Kyoto, Japan
- **ความเชี่ยวชาญ**: หุ่นยนต์ดึงชิ้นงานสำหรับเครื่องฉีดพลาสติก
- **ส่วนแบ่งตลาด**: ผู้นำตลาดหุ่นยนต์ดึงชิ้นงานระดับโลก

---

### ประเภทหุ่นยนต์ YUSHIN

#### 1. RC Series (Servo Traverse Robot)
- **รุ่น**: RC-II, RC-III
- **ประเภท**: หุ่นยนต์แนวนอน (Traverse Robot)
- **ใช้กับเครื่อง**: 50-4,000 ton
- **Payload**: 1-50 kg
- **ความเร็ว**: สูงมาก (High Speed)

#### 2. HSA Series (High Speed Arm)
- **รุ่น**: HSA-400, HSA-600
- **ประเภท**: แขนความเร็วสูง
- **ใช้กับเครื่อง**: 50-300 ton
- **เหมาะสำหรับ**: Thin wall packaging, Fast cycle

#### 3. YC Series (Cartesian Robot)
- **รุ่น**: YC-200, YC-500
- **ประเภท**: หุ่นยนต์แบบ Cartesian
- **ใช้กับเครื่อง**: 30-500 ton
- **ความยืดหยุ่น**: สูง

#### 4. YSV Series (Small Vertical Entry)
- **รุ่น**: YSV-10, YSV-20
- **ประเภท**: แนวตั้ง (Top Entry)
- **ใช้กับเครื่อง**: 30-150 ton
- **พื้นที่**: ประหยัดพื้นที่

---

### แกนการเคลื่อนที่ (Axes)

| แกน | ชื่อ | ทิศทาง | หน้าที่ |
|-----|------|--------|---------|
| **X** | Traverse | ซ้าย-ขวา | เคลื่อนที่ข้ามเครื่อง |
| **Y** | Cross Travel | หน้า-หลัง | เข้า-ออกแม่พิมพ์ |
| **Z** | Vertical | ขึ้น-ลง | ยกขึ้น-ลง |
| **A** | Swing | หมุน | หมุนมือจับ |
| **B** | Wrist Rotate | หมุนข้อมือ | ปรับมุมชิ้นงาน |
| **C** | Flip | พลิก | พลิกชิ้นงาน |

---

### Controller YUSHIN

#### YD-2000 Series Controller
- **หน้าจอ**: 10.4" Touch Screen
- **ภาษา**: หลายภาษา (รวมไทย)
- **การโปรแกรม**: Point Teaching, Graphic Programming
- **Memory**: 500+ Programs

**ฟังก์ชันหลัก**:
- Position Teaching (สอนตำแหน่ง)
- Cycle Time Monitor
- Production Counter
- Alarm History
- Remote Monitoring

---

### การติดตั้ง (Installation)

#### ตำแหน่งติดตั้ง
1. **Top Mount** - ติดบนเครื่อง (ทั่วไป)
2. **Side Mount** - ติดด้านข้าง
3. **Floor Mount** - ติดพื้น

#### การเชื่อมต่อกับเครื่องฉีด

**สัญญาณมาตรฐาน**:
| สัญญาณ | คำอธิบาย | ทิศทาง |
|--------|----------|--------|
| Mould Open Complete | แม่พิมพ์เปิดสุด | เครื่อง → Robot |
| Safety Gate | ประตูนิรภัย | Robot → เครื่อง |
| Robot In Mould | Robot อยู่ในแม่พิมพ์ | Robot → เครื่อง |
| Robot Out Mould | Robot ออกจากแม่พิมพ์ | Robot → เครื่อง |
| Ejector Forward | ดันกระทุ้งออก | เครื่อง → Robot |
| Ejector Back | ดันกระทุ้งกลับ | Robot → เครื่อง |
| Part Detected | ตรวจพบชิ้นงาน | Robot → เครื่อง |

**Interface Standards**:
- SPI (แนะนำ)
- Euromap 12
- Euromap 67
- Custom Interface

---

### Vacuum System (ระบบดูด)

#### Vacuum Generator Types
1. **Ejector Type** (ใช้ลม)
   - ง่าย, ไม่มีชิ้นส่วนเคลื่อนที่
   - ใช้ลมอัด 0.4-0.6 MPa

2. **Vacuum Pump** (ปั๊มดูด)
   - กำลังดูดสูงกว่า
   - ใช้กับชิ้นงานใหญ่

#### ข้อกำหนดถ้วยดูด (Suction Cup)

| ขนาดถ้วย | เส้นผ่านศูนย์กลาง | แรงยก (โดยประมาณ) |
|----------|------------------|-------------------|
| Small | 10-20 mm | 0.5-2 kg |
| Medium | 25-40 mm | 2-8 kg |
| Large | 50-80 mm | 8-25 kg |
| X-Large | 100-150 mm | 25-50 kg |

**วัสดุถ้วยดูด**:
- **Nitrile** (NBR): ทั่วไป, ราคาประหยัด
- **Silicone**: ทนความร้อน, Food Grade
- **Viton**: ทนสารเคมี, น้ำมัน
- **Polyurethane**: ทนการสึกหรอ

---

### Gripper Types (หัวจับ)

#### 1. Vacuum Gripper (หัวดูด)
- **ใช้กับ**: ชิ้นงานผิวเรียบ
- **ข้อดี**: ไม่ทำลายผิว, เร็ว
- **ข้อจำกัด**: ต้องมีพื้นที่ดูดเพียงพอ

#### 2. Mechanical Gripper (หัวจับกล)
- **ใช้กับ**: ชิ้นงานรูปร่างซับซ้อน
- **ข้อดี**: จับได้แน่น, หลากหลายรูปร่าง
- **ข้อจำกัด**: อาจทำลายผิว

#### 3. Combination Gripper
- **ใช้กับ**: งานพิเศษ
- **รวม**: ทั้งดูดและจับกล

---

### การตั้งค่า Cycle Time

#### ลำดับการทำงาน (Sequence)
1. รอแม่พิมพ์เปิด (Mould Open Wait)
2. เข้าแม่พิมพ์ (Arm In)
3. ลงหยิบชิ้นงาน (Down)
4. ดูดชิ้นงาน (Vacuum On)
5. ยกขึ้น (Up)
6. ออกจากแม่พิมพ์ (Arm Out)
7. เคลื่อนไปวางของ (Traverse)
8. วางชิ้นงาน (Place)
9. กลับตำแหน่งเริ่มต้น (Home)

#### เวลามาตรฐาน (ตัวอย่าง)
| ขั้นตอน | เวลา (วินาที) |
|---------|--------------|
| Arm In | 0.3-0.8 |
| Down | 0.2-0.5 |
| Vacuum | 0.1-0.3 |
| Up | 0.2-0.5 |
| Arm Out | 0.3-0.8 |
| Traverse | 0.5-1.5 |
| Place | 0.3-0.5 |
| Return | 0.5-1.5 |
| **รวม** | **2.4-6.4** |

---

### Safety Features (ความปลอดภัย)

#### ระบบนิรภัยมาตรฐาน
1. **Emergency Stop** - หยุดฉุกเฉิน
2. **Safety Gate Interlock** - ล็อคประตู
3. **Area Sensor** - เซ็นเซอร์พื้นที่
4. **Light Curtain** - ม่านแสง
5. **Motor Brake** - เบรคมอเตอร์

#### Safety Standards
- ISO 10218 (Robot Safety)
- ISO 13849 (Safety of Machinery)
- CE Marking
- JIS B 8433

---

### Troubleshooting Guide

#### ปัญหาทั่วไปและแนวทางแก้ไข

| ปัญหา | สาเหตุที่เป็นไปได้ | แนวทางแก้ไข |
|-------|-------------------|-------------|
| **ดูดชิ้นงานไม่ติด** | - ถ้วยดูดสกปรก/เสื่อม | - ทำความสะอาด/เปลี่ยนถ้วย |
| | - แรงดูดไม่พอ | - ตรวจสอบ Vacuum Generator |
| | - รอยรั่วในท่อ | - ตรวจหารอยรั่ว |
| | - ชิ้นงานมีรู | - ใช้ Mechanical Gripper |
| **Robot ไม่เข้าแม่พิมพ์** | - Mould Open Signal ไม่มา | - ตรวจสอบสายสัญญาณ |
| | - Safety Gate ไม่พร้อม | - ตรวจ Interlock |
| | - Limit Switch เสีย | - เปลี่ยน Limit Switch |
| **ชิ้นงานตกระหว่างทาง** | - แรงดูดไม่พอ | - เพิ่ม Vacuum Time |
| | - ความเร็วสูงเกินไป | - ลด Speed |
| | - ถ้วยไม่เหมาะสม | - เลือกถ้วยที่เหมาะสม |
| **Cycle Time ยาว** | - ความเร็วต่ำ | - ปรับเพิ่ม Speed |
| | - ตำแหน่งไม่เหมาะสม | - Optimize Teaching Points |
| | - รอสัญญาณนาน | - ตรวจ Timing กับเครื่องฉีด |
| **Robot สั่น** | - สกรูหลวม | - ขันสกรูให้แน่น |
| | - Speed สูงเกินไป | - ลด Acceleration |
| | - โครงสร้างไม่แข็งแรง | - เสริมโครงสร้าง |

---

### Maintenance Schedule

#### ประจำวัน (Daily)
- ตรวจถ้วยดูดและท่อลม
- เช็คการทำงานปกติ
- ตรวจ Emergency Stop

#### ประจำสัปดาห์ (Weekly)
- ทำความสะอาดถ้วยดูด
- ตรวจสอบสายสัญญาณ
- เช็คความดันลม
- หล่อลื่นจุดที่กำหนด

#### ประจำเดือน (Monthly)
- ตรวจสอบ Belt/Chain
- เช็ค Limit Switch
- ตรวจความแม่นยำตำแหน่ง
- สำรองโปรแกรม

#### ประจำปี (Annually)
- เปลี่ยน Belt/Chain (ถ้าจำเป็น)
- เช็คมอเตอร์และเกียร์
- ตรวจสอบระบบไฟฟ้า
- Calibrate ตำแหน่ง

---

### End-of-Arm Tooling (EOAT) Design

#### หลักการออกแบบมือจับ

1. **น้ำหนัก (Weight)**
   - ให้น้อยที่สุด
   - ไม่เกิน Payload ของ Robot

2. **ศูนย์ถ่วง (Center of Gravity)**
   - อยู่ใกล้แกน Robot
   - สมดุล

3. **จุดจับ (Grip Points)**
   - กระจายอย่างเหมาะสม
   - หลีกเลี่ยงจุด Gate

4. **เวลาจับ (Grip Time)**
   - รวดเร็ว
   - สัมพันธ์กับ Cycle Time

#### วัสดุมือจับแนะนำ
- **Aluminum**: เบา, แข็งแรง
- **Carbon Fiber**: เบามาก, แพง
- **3D Printed**: Prototype, รูปทรงซับซ้อน

---

### Robot Selection Guide

#### เลือก Robot ตามขนาดเครื่องฉีด

| ขนาดเครื่องฉีด | รุ่น Robot แนะนำ | หมายเหตุ |
|---------------|-----------------|----------|
| 30-80 ton | YSV-10, HSA-400 | Small Part |
| 80-150 ton | YSV-20, RC-II | General |
| 150-350 ton | RC-II | Medium Part |
| 350-850 ton | RC-III | Large Part |
| 850-2000 ton | RC-III Heavy | Heavy Part |
| 2000+ ton | Custom | Very Large |

#### เลือกตาม Application

| Application | รุ่นแนะนำ | เหตุผล |
|-------------|----------|--------|
| Thin Wall Packaging | HSA Series | ความเร็วสูง |
| Automotive | RC Series | Payload สูง |
| Medical | YSV Series | Clean, Precise |
| Electronics | YC Series | ความแม่นยำ |

---

### Integration with IMM

#### ขั้นตอนการ Integrate กับเครื่องฉีด

1. **กำหนดตำแหน่งติดตั้ง**
   - วัดพื้นที่
   - เลือก Mounting Type

2. **เดินสายสัญญาณ**
   - ต่อ Interface (SPI/Euromap)
   - ตั้งค่า Signal Timing

3. **ตั้งค่า Safety**
   - Interlock กับเครื่อง
   - ทดสอบ Emergency Stop

4. **Teaching Program**
   - สอนตำแหน่งเข้า-ออก
   - ปรับ Speed และ Timing

5. **Test Run**
   - ทดสอบแบบ Manual
   - ทดสอบแบบ Auto

---

### เปรียบเทียบ YUSHIN กับยี่ห้ออื่น

| คุณสมบัติ | YUSHIN | SEPRO | WITTMANN |
|-----------|--------|-------|----------|
| ความน่าเชื่อถือ | สูงมาก | สูง | สูง |
| ราคา | สูง | ปานกลาง | ปานกลาง |
| บริการในไทย | ดี | ดี | ดี |
| อะไหล่ | หาง่าย | หาง่าย | หาง่าย |
| ความเร็ว | สูงมาก | สูง | สูง |

---

### ข้อมูลติดต่อ YUSHIN

**YUSHIN PRECISION EQUIPMENT Co., Ltd.**
- **Headquarters**: Kyoto, Japan
- **Website**: www.yushin.com
- **Thailand Distributor**: ติดต่อตัวแทนจำหน่ายในประเทศไทย

**บริการ**:
- การติดตั้ง
- การฝึกอบรม
- อะไหล่
- ซ่อมบำรุง
`;

module.exports = { YUSHIN_KNOWLEDGE_PROMPT };
