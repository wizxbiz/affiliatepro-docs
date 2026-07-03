/**
 * 🎓 WiT AI - Student Learning Module (Enhanced)
 * ระบบเรียนรู้สำหรับนักเรียน/นักศึกษา ด้านการฉีดพลาสติก
 *
 * Features:
 * - Progress Tracking System
 * - AI Integration (Gemini)
 * - Interactive Learning Tools
 * - Comprehensive Flex Messages
 * - 🆕 Integration with Teaching System (24 Lessons)
 *
 * @author WiT AI System
 * @version 3.0.0
 * @created 2025-12-09
 * @updated 2025-12-21
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔗 Import Teaching System
const {
  TEXTBOOK_TEACHING_PROMPT,
  QUIZ_DATABASE
} = require('./textbook_teaching_prompt');
const lessonsData = require('./lessons_database.json');

// =====================================================
// 🔧 AI CONFIGURATION
// =====================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =====================================================
// 📊 PROGRESS TRACKING SYSTEM
// =====================================================

/**
 * โครงสร้างข้อมูล Progress ของผู้เรียน
 */
const PROGRESS_STRUCTURE = {
  lessonsCompleted: [], // บทเรียนที่เรียนจบ
  quizzesPassed: [], // แบบทดสอบที่ผ่าน
  totalScore: 0, // คะแนนรวม
  badges: [], // เหรียญ/รางวัล
  studyTime: 0, // เวลาเรียนรวม (นาที)
  lastActivity: null, // กิจกรรมล่าสุด
  streak: 0, // จำนวนวันเรียนต่อเนื่อง
  level: 1, // ระดับผู้เรียน
};

/**
 * ระบบ Badge/Achievement
 */
const BADGES = {
  firstLesson: {
    id: "firstLesson",
    name: "🌟 เริ่มต้นดี",
    description: "เรียนบทแรกสำเร็จ",
    icon: "🌟",
    requirement: "เรียนจบบทที่ 1",
  },
  quickLearner: {
    id: "quickLearner",
    name: "⚡ เรียนรู้เร็ว",
    description: "เรียนจบ 3 บทใน 1 วัน",
    icon: "⚡",
    requirement: "เรียนจบ 3 บทใน 1 วัน",
  },
  perfectQuiz: {
    id: "perfectQuiz",
    name: "🏆 คะแนนเต็ม",
    description: "ทำแบบทดสอบได้ 100%",
    icon: "🏆",
    requirement: "ทำแบบทดสอบได้คะแนนเต็ม",
  },
  allLessons: {
    id: "allLessons",
    name: "🎓 นักเรียนดีเด่น",
    description: "เรียนจบทุกบทเรียน",
    icon: "🎓",
    requirement: "เรียนจบทั้ง 5 บท",
  },
  weekStreak: {
    id: "weekStreak",
    name: "🔥 เรียนต่อเนื่อง",
    description: "เรียนติดต่อกัน 7 วัน",
    icon: "🔥",
    requirement: "เรียนต่อเนื่อง 7 วัน",
  },
  aiExplorer: {
    id: "aiExplorer",
    name: "🤖 นักสำรวจ AI",
    description: "ถาม AI 10 คำถาม",
    icon: "🤖",
    requirement: "ถาม AI 10 คำถาม",
  },
  labExpert: {
    id: "labExpert",
    name: "🔬 ผู้เชี่ยวชาญห้องแล็บ",
    description: "ใช้ Virtual Lab 5 ครั้ง",
    icon: "🔬",
    requirement: "ใช้ Virtual Lab 5 ครั้ง",
  },
  calculatorMaster: {
    id: "calculatorMaster",
    name: "🧮 เจ้าแห่งการคำนวณ",
    description: "ใช้เครื่องคิดเลข 10 ครั้ง",
    icon: "🧮",
    requirement: "ใช้เครื่องคิดเลข 10 ครั้ง",
  },
};

/**
 * ระบบระดับผู้เรียน
 */
const LEARNER_LEVELS = {
  1: { name: "🌱 ผู้เริ่มต้น", minScore: 0, maxScore: 50 },
  2: { name: "🌿 ผู้เรียนรู้", minScore: 51, maxScore: 150 },
  3: { name: "🌳 ผู้ชำนาญ", minScore: 151, maxScore: 300 },
  4: { name: "⭐ ผู้เชี่ยวชาญ", minScore: 301, maxScore: 500 },
  5: { name: "👑 ปรมาจารย์", minScore: 501, maxScore: Infinity },
};

// =====================================================
// 📚 LESSON CONTENT - บทเรียนพื้นฐาน (Enhanced)
// =====================================================

const LESSONS = {
  // บทที่ 1: พื้นฐานการฉีดพลาสติก
  lesson1: {
    id: "lesson1",
    title: "🏭 พื้นฐานการฉีดพลาสติก",
    subtitle: "Introduction to Injection Molding",
    duration: "15 นาที",
    level: "เริ่มต้น",
    content: `
📖 **บทที่ 1: พื้นฐานการฉีดพลาสติก**

🔹 **การฉีดพลาสติกคืออะไร?**
การฉีดพลาสติก (Injection Molding) คือกระบวนการขึ้นรูปพลาสติกโดยการหลอมเม็ดพลาสติก แล้วฉีดเข้าไปในแม่พิมพ์ที่มีรูปทรงตามต้องการ

🔹 **ส่วนประกอบหลักของเครื่องฉีด:**
1. **Hopper** - ถังเก็บเม็ดพลาสติก
2. **Barrel & Screw** - กระบอกฉีดและสกรู หลอมพลาสติก
3. **Nozzle** - หัวฉีด ส่งพลาสติกเข้าแม่พิมพ์
4. **Mold** - แม่พิมพ์ กำหนดรูปทรงชิ้นงาน
5. **Clamping Unit** - หน่วยล็อคแม่พิมพ์

🔹 **วงจรการฉีด (Injection Cycle):**
1. ปิดแม่พิมพ์ (Mold Close)
2. ฉีดพลาสติก (Injection)
3. การอัด (Holding/Packing)
4. ทำให้เย็น (Cooling)
5. เปิดแม่พิมพ์ (Mold Open)
6. ดีดชิ้นงาน (Ejection)

⏱️ **Cycle Time** = เวลารวมทั้งหมดในการผลิต 1 ชิ้นงาน
`,
    quiz: ["q1_1", "q1_2", "q1_3"],
  },

  // บทที่ 2: ชนิดพลาสติก
  lesson2: {
    id: "lesson2",
    title: "🧪 ชนิดของพลาสติก",
    subtitle: "Types of Plastics",
    duration: "20 นาที",
    level: "เริ่มต้น",
    content: `
📖 **บทที่ 2: ชนิดของพลาสติก**

🔹 **พลาสติก 2 ประเภทหลัก:**

**1. Thermoplastic (เทอร์โมพลาสติก)**
- หลอมแล้วขึ้นรูปใหม่ได้ ♻️
- ตัวอย่าง: PP, PE, ABS, PC, PA

**2. Thermoset (เทอร์โมเซ็ต)**
- หลอมแล้วขึ้นรูปใหม่ไม่ได้ ❌
- ตัวอย่าง: Epoxy, Phenolic

🔹 **พลาสติกที่นิยมในงานฉีด:**

| พลาสติก | อุณหภูมิหลอม | จุดเด่น |
|---------|-------------|--------|
| PP | 200-280°C | ราคาถูก ทนเคมี |
| ABS | 220-260°C | แข็งแรง ชุบโลหะได้ |
| PC | 280-320°C | ใส ทนแรงกระแทก |
| PA (Nylon) | 260-290°C | ทนสึกหรอ แข็งแรง |
| POM | 180-220°C | ลื่น แม่นยำสูง |

🔹 **การเลือกพลาสติก พิจารณาจาก:**
1. ความแข็งแรงที่ต้องการ
2. อุณหภูมิใช้งาน
3. ความทนทานต่อสารเคมี
4. ราคา
5. ความสวยงาม (สี, ความใส)
`,
    quiz: ["q2_1", "q2_2", "q2_3"],
  },

  // บทที่ 3: พารามิเตอร์การฉีด
  lesson3: {
    id: "lesson3",
    title: "⚙️ พารามิเตอร์การฉีด",
    subtitle: "Injection Parameters",
    duration: "25 นาที",
    level: "กลาง",
    content: `
📖 **บทที่ 3: พารามิเตอร์การฉีด**

🔹 **พารามิเตอร์หลัก 4 ด้าน:**

**1. 🌡️ อุณหภูมิ (Temperature)**
- Barrel Temp: อุณหภูมิกระบอกฉีด
- Mold Temp: อุณหภูมิแม่พิมพ์
- สูงเกิน → พลาสติกไหม้, ย่อยสลาย
- ต่ำเกิน → ไหลไม่เต็ม, ไม่หลอม

**2. 💨 ความดัน (Pressure)**
- Injection Pressure: ความดันฉีด
- Holding Pressure: ความดันอัด (60-80% ของ Inj.)
- Back Pressure: ความดันหลัง
- สูงเกิน → Flash, เครียด
- ต่ำเกิน → Short shot, Sink mark

**3. 🚀 ความเร็ว (Speed)**
- Injection Speed: ความเร็วฉีด
- Screw Speed: ความเร็วหมุนสกรู
- เร็วเกิน → Jetting, Burn mark
- ช้าเกิน → Flow mark, Weld line

**4. ⏱️ เวลา (Time)**
- Injection Time: เวลาฉีด
- Holding Time: เวลาอัด
- Cooling Time: เวลาเย็น (มากสุด 60-80%)
- Cycle Time: เวลาต่อรอบ

🔹 **สูตรคำนวณ Cooling Time:**
\`\`\`
t = (s²/π²α) × ln(8(Tm-Tw)/π²(Te-Tw))

s = ความหนาผนัง (mm)
α = Thermal Diffusivity
Tm = อุณหภูมิหลอม
Tw = อุณหภูมิแม่พิมพ์
Te = อุณหภูมิดีดชิ้นงาน
\`\`\`
`,
    quiz: ["q3_1", "q3_2", "q3_3"],
  },

  // บทที่ 4: ปัญหาและการแก้ไข
  lesson4: {
    id: "lesson4",
    title: "🔧 ปัญหาและการแก้ไข",
    subtitle: "Defects & Troubleshooting",
    duration: "30 นาที",
    level: "กลาง",
    content: `
📖 **บทที่ 4: ปัญหาและการแก้ไข**

🔹 **6 ปัญหาที่พบบ่อย:**

**1. Short Shot (ฉีดไม่เต็ม)**
- สาเหตุ: ความดันต่ำ, อุณหภูมิต่ำ, Gate เล็ก
- แก้ไข: เพิ่มความดัน/อุณหภูมิ, ขยาย Gate

**2. Flash (ครีบ/เกินขอบ)**
- สาเหตุ: ความดันสูง, แรงปิดไม่พอ, แม่พิมพ์สึก
- แก้ไข: ลดความดัน, เพิ่มแรงปิด, ซ่อมแม่พิมพ์

**3. Sink Mark (ยุบ)**
- สาเหตุ: Holding ไม่พอ, Cooling เร็ว, ผนังหนา
- แก้ไข: เพิ่ม Holding, เพิ่มเวลา Cooling

**4. Warpage (บิดงอ)**
- สาเหตุ: เย็นไม่สม่ำเสมอ, เครียดภายใน
- แก้ไข: ปรับอุณหภูมิแม่พิมพ์, ลดความเร็ว

**5. Burn Mark (ไหม้)**
- สาเหตุ: อากาศค้าง, ความเร็วสูง, อุณหภูมิสูง
- แก้ไข: เพิ่มระบายอากาศ, ลดความเร็ว

**6. Weld Line (รอยเชื่อม)**
- สาเหตุ: พลาสติกไหลมาบรรจบกัน
- แก้ไข: เพิ่มอุณหภูมิ, ย้ายตำแหน่ง Gate

🔹 **หลักการแก้ปัญหา:**
1. สังเกตอาการ → วิเคราะห์สาเหตุ
2. ปรับทีละพารามิเตอร์
3. จดบันทึกการปรับ
4. ทดสอบซ้ำ
`,
    quiz: ["q4_1", "q4_2", "q4_3"],
  },

  // บทที่ 5: การคำนวณพื้นฐาน
  lesson5: {
    id: "lesson5",
    title: "🔢 การคำนวณพื้นฐาน",
    subtitle: "Basic Calculations",
    duration: "20 นาที",
    level: "กลาง",
    content: `
📖 **บทที่ 5: การคำนวณพื้นฐาน**

🔹 **1. แรงปิดแม่พิมพ์ (Clamping Force)**
\`\`\`
F = A × P × S

F = แรงปิด (ตัน)
A = พื้นที่ฉาย (cm²)
P = ความดันโพรง (kg/cm²) ≈ 300-500
S = Safety Factor ≈ 1.1-1.2
\`\`\`

**ตัวอย่าง:** ชิ้นงาน 10×15 cm
F = (10×15) × 400 × 1.1 / 1000 = 66 ตัน
→ ใช้เครื่อง 80-100 ตัน

🔹 **2. ขนาด Shot (Shot Size)**
\`\`\`
Shot = น้ำหนักชิ้นงาน + Runner
ใช้ 30-80% ของ Max Shot
\`\`\`

🔹 **3. Cooling Time (เวลาเย็น)**
\`\`\`
สูตรประมาณ:
t ≈ s² × K

s = ความหนา (mm)
K = 2-4 (ขึ้นกับพลาสติก)
\`\`\`

**ตัวอย่าง:** ผนังหนา 3mm, PP
t ≈ 3² × 2.5 = 22.5 วินาที

🔹 **4. Cycle Time**
\`\`\`
Cycle = Injection + Holding + Cooling + Mold Open/Close + Ejection

ปกติ: 15-60 วินาที
ชิ้นงานบาง: 10-20 วินาที
ชิ้นงานหนา: 30-120 วินาที
\`\`\`

🔹 **5. กำลังผลิต**
\`\`\`
ชิ้น/ชม. = 3600 / Cycle Time × จำนวน Cavity
ชิ้น/วัน = ชิ้น/ชม. × ชั่วโมงทำงาน × OEE
\`\`\`
`,
    quiz: ["q5_1", "q5_2", "q5_3"],
  },
};

// =====================================================
// 📝 QUIZ QUESTIONS - แบบทดสอบ
// =====================================================

const QUIZ_QUESTIONS = {
  // บทที่ 1
  q1_1: {
    id: "q1_1",
    lesson: "lesson1",
    question: "ส่วนประกอบใดของเครื่องฉีดทำหน้าที่หลอมพลาสติก?",
    options: [
      "A. Hopper",
      "B. Barrel & Screw",
      "C. Nozzle",
      "D. Clamping Unit",
    ],
    answer: "B",
    explanation: "Barrel & Screw (กระบอกฉีดและสกรู) ทำหน้าที่หลอมเม็ดพลาสติกด้วยความร้อนและแรงเสียดทาน",
  },
  q1_2: {
    id: "q1_2",
    lesson: "lesson1",
    question: "ขั้นตอนใดใช้เวลานานที่สุดในวงจรการฉีด?",
    options: [
      "A. Injection (ฉีด)",
      "B. Holding (อัด)",
      "C. Cooling (เย็น)",
      "D. Ejection (ดีด)",
    ],
    answer: "C",
    explanation: "Cooling Time ใช้เวลามากที่สุด ประมาณ 60-80% ของ Cycle Time ทั้งหมด",
  },
  q1_3: {
    id: "q1_3",
    lesson: "lesson1",
    question: "Cycle Time คืออะไร?",
    options: [
      "A. เวลาในการฉีดพลาสติก",
      "B. เวลาในการทำให้เย็น",
      "C. เวลารวมทั้งหมดในการผลิต 1 ชิ้นงาน",
      "D. เวลาในการเปิด-ปิดแม่พิมพ์",
    ],
    answer: "C",
    explanation: "Cycle Time คือเวลารวมทั้งหมดตั้งแต่เริ่มปิดแม่พิมพ์จนถึงดีดชิ้นงานออก สำหรับการผลิต 1 ชิ้นงาน",
  },

  // บทที่ 2
  q2_1: {
    id: "q2_1",
    lesson: "lesson2",
    question: "พลาสติกชนิดใดหลอมแล้วขึ้นรูปใหม่ได้?",
    options: [
      "A. Thermoset",
      "B. Thermoplastic",
      "C. Epoxy",
      "D. Phenolic",
    ],
    answer: "B",
    explanation: "Thermoplastic (เทอร์โมพลาสติก) สามารถหลอมแล้วขึ้นรูปใหม่ได้หลายครั้ง ต่างจาก Thermoset ที่ขึ้นรูปใหม่ไม่ได้",
  },
  q2_2: {
    id: "q2_2",
    lesson: "lesson2",
    question: "พลาสติกชนิดใดเหมาะกับงานที่ต้องการความใส?",
    options: [
      "A. PP",
      "B. ABS",
      "C. PC",
      "D. PA",
    ],
    answer: "C",
    explanation: "PC (Polycarbonate) มีคุณสมบัติใส ทนแรงกระแทกสูง นิยมใช้ทำแว่นตานิรภัย, กระจกกันกระสุน",
  },
  q2_3: {
    id: "q2_3",
    lesson: "lesson2",
    question: "พลาสติก PP มีอุณหภูมิหลอมประมาณเท่าไร?",
    options: [
      "A. 150-180°C",
      "B. 200-280°C",
      "C. 280-320°C",
      "D. 320-350°C",
    ],
    answer: "B",
    explanation: "PP (Polypropylene) มีอุณหภูมิหลอมประมาณ 200-280°C",
  },

  // บทที่ 3
  q3_1: {
    id: "q3_1",
    lesson: "lesson3",
    question: "Holding Pressure ควรตั้งเท่าไรเทียบกับ Injection Pressure?",
    options: [
      "A. 20-40%",
      "B. 60-80%",
      "C. 100%",
      "D. 120%",
    ],
    answer: "B",
    explanation: "Holding Pressure ควรตั้งประมาณ 60-80% ของ Injection Pressure เพื่อชดเชยการหดตัว",
  },
  q3_2: {
    id: "q3_2",
    lesson: "lesson3",
    question: "ถ้าความเร็วฉีดเร็วเกินไป อาจเกิดปัญหาใด?",
    options: [
      "A. Short Shot",
      "B. Sink Mark",
      "C. Burn Mark",
      "D. Warpage",
    ],
    answer: "C",
    explanation: "ความเร็วฉีดที่เร็วเกินไปทำให้อากาศถูกอัดและเกิดความร้อนสูง ส่งผลให้เกิด Burn Mark (รอยไหม้)",
  },
  q3_3: {
    id: "q3_3",
    lesson: "lesson3",
    question: "Cooling Time คิดเป็นสัดส่วนเท่าไรของ Cycle Time?",
    options: [
      "A. 20-30%",
      "B. 40-50%",
      "C. 60-80%",
      "D. 90-95%",
    ],
    answer: "C",
    explanation: "Cooling Time มักใช้เวลา 60-80% ของ Cycle Time ทั้งหมด จึงเป็นจุดสำคัญในการลด Cycle Time",
  },

  // บทที่ 4
  q4_1: {
    id: "q4_1",
    lesson: "lesson4",
    question: "ปัญหา Short Shot เกิดจากสาเหตุใด?",
    options: [
      "A. ความดันสูงเกินไป",
      "B. ความดันต่ำเกินไป",
      "C. อุณหภูมิสูงเกินไป",
      "D. แรงปิดแม่พิมพ์ไม่พอ",
    ],
    answer: "B",
    explanation: "Short Shot (ฉีดไม่เต็ม) เกิดจากความดันฉีดต่ำ อุณหภูมิต่ำ หรือ Gate เล็กเกินไป",
  },
  q4_2: {
    id: "q4_2",
    lesson: "lesson4",
    question: "ปัญหา Flash (ครีบ) แก้ไขได้อย่างไร?",
    options: [
      "A. เพิ่มความดันฉีด",
      "B. ลดความดันฉีด",
      "C. เพิ่มอุณหภูมิ",
      "D. ลดแรงปิดแม่พิมพ์",
    ],
    answer: "B",
    explanation: "Flash เกิดจากพลาสติกล้นออกขอบแม่พิมพ์ แก้โดยลดความดัน เพิ่มแรงปิด หรือซ่อมแม่พิมพ์",
  },
  q4_3: {
    id: "q4_3",
    lesson: "lesson4",
    question: "Sink Mark แก้ไขได้โดยวิธีใด?",
    options: [
      "A. ลด Holding Pressure",
      "B. เพิ่ม Holding Pressure และ Time",
      "C. ลดอุณหภูมิแม่พิมพ์",
      "D. เพิ่มความเร็วฉีด",
    ],
    answer: "B",
    explanation: "Sink Mark (รอยยุบ) เกิดจากการหดตัว แก้โดยเพิ่ม Holding Pressure และ Holding Time เพื่อชดเชยการหดตัว",
  },

  // บทที่ 5
  q5_1: {
    id: "q5_1",
    lesson: "lesson5",
    question: "ชิ้นงานขนาด 8×10 cm ความดันโพรง 400 kg/cm² ต้องใช้แรงปิดแม่พิมพ์เท่าไร?",
    options: [
      "A. 32 ตัน",
      "B. 35 ตัน",
      "C. 40 ตัน",
      "D. 80 ตัน",
    ],
    answer: "B",
    explanation: "F = A × P × S = (8×10) × 400 × 1.1 / 1000 = 35.2 ตัน (ใช้เครื่อง 50 ตันขึ้นไป)",
  },
  q5_2: {
    id: "q5_2",
    lesson: "lesson5",
    question: "ชิ้นงานผนังหนา 4mm ใช้ PP จะใช้ Cooling Time ประมาณเท่าไร?",
    options: [
      "A. 16 วินาที",
      "B. 24 วินาที",
      "C. 40 วินาที",
      "D. 60 วินาที",
    ],
    answer: "C",
    explanation: "t ≈ s² × K = 4² × 2.5 = 40 วินาที (K สำหรับ PP ประมาณ 2.5)",
  },
  q5_3: {
    id: "q5_3",
    lesson: "lesson5",
    question: "ถ้า Cycle Time 30 วินาที แม่พิมพ์ 4 Cavity จะผลิตได้กี่ชิ้นต่อชั่วโมง?",
    options: [
      "A. 120 ชิ้น",
      "B. 240 ชิ้น",
      "C. 480 ชิ้น",
      "D. 720 ชิ้น",
    ],
    answer: "C",
    explanation: "ชิ้น/ชม. = (3600/30) × 4 = 120 × 4 = 480 ชิ้น/ชั่วโมง",
  },
};

// =====================================================
// � ENHANCED EXAM SYSTEM - ระบบข้อสอบทรงพลัง
// เชื่อมโยงกับ Teaching System (24 บท)
// =====================================================

/**
 * ข้อสอบขั้นสูงจากหนังสือเรียน IMT Thailand
 * รวม 6 Levels ครอบคลุมทุกหัวข้อ
 */
const ADVANCED_EXAM_QUESTIONS = {
  // Level 0: พื้นฐาน Mindset
  level0: [
    {
      id: "adv_0_1",
      question: "หลัก 6M ในการฉีดพลาสติก M ตัวใดหมายถึง 'แม่พิมพ์'?",
      options: ["A. Material", "B. Machine", "C. Mold", "D. Method"],
      answer: "C",
      explanation: "6M ประกอบด้วย Material (วัตถุดิบ), Mold (แม่พิมพ์), Machine (เครื่องจักร), Method (วิธีการ), Man (คน), Management (การจัดการ)",
      level: 0,
      topic: "องค์ประกอบ 6M"
    },
    {
      id: "adv_0_2",
      question: "หลัก 3 สิ่งสำคัญในการฉีดพลาสติก ข้อใดถูกต้อง?",
      options: ["A. ความร้อน แรงดัน เวลา", "B. ความเย็น แรงดัน ความเร็ว", "C. อุณหภูมิ ความเร็ว พื้นที่", "D. แรงดัน ความหนืด Cycle"],
      answer: "A",
      explanation: "หลัก 3 สิ่งสำคัญ คือ ความร้อน (Heat) - หลอมพลาสติก, แรงดัน (Pressure) - ขับดันพลาสติก, เวลา (Time) - ควบคุมกระบวนการ",
      level: 0,
      topic: "หลัก 3 สิ่งสำคัญ"
    },
    {
      id: "adv_0_3",
      question: "ช่างเทคนิคมืออาชีพควรมี Mindset แบบใดมากที่สุด?",
      options: ["A. ทำงานให้เสร็จเร็วที่สุด", "B. ความปลอดภัยมาก่อน + เรียนรู้ต่อเนื่อง", "C. ทำตามคำสั่งอย่างเดียว", "D. หลีกเลี่ยงงานยาก"],
      answer: "B",
      explanation: "ช่างมืออาชีพต้องมี: ความรับผิดชอบ, ความปลอดภัยมาก่อน, เรียนรู้ไม่หยุด, ทำงานเป็นทีม",
      level: 0,
      topic: "Mindset ช่างเทคนิค"
    }
  ],

  // Level 1: พื้นฐานเครื่องจักร
  level1: [
    {
      id: "adv_1_1",
      question: "เครื่องฉีดพลาสติกมีกี่ส่วนหลัก และข้อใดถูกต้อง?",
      options: ["A. 2 ส่วน: Injection Unit, Mold", "B. 3 ส่วน: Clamping Unit, Injection Unit, Base Unit", "C. 4 ส่วน: Hopper, Barrel, Nozzle, Mold", "D. 5 ส่วน: Screw, Heater, Controller, Motor, Tank"],
      answer: "B",
      explanation: "เครื่องฉีดมี 3 ส่วนหลัก: Clamping Unit (ชุดปิด-เปิดแม่พิมพ์), Injection Unit (ชุดฉีดพลาสติก), Base Unit (ฐานเครื่อง)",
      level: 1,
      topic: "โครงสร้างเครื่องฉีด"
    },
    {
      id: "adv_1_2",
      question: "ระบบ Toggle System ใช้สำหรับอะไร?",
      options: ["A. หลอมเม็ดพลาสติก", "B. ปิด-เปิดแม่พิมพ์", "C. ดีดชิ้นงาน", "D. ควบคุมอุณหภูมิ"],
      answer: "B",
      explanation: "Toggle System (ระบบข้อศอก) เป็นระบบปิด-เปิดแม่พิมพ์ ใช้กลไกคานงัดเพิ่มแรงปิด ประหยัดพลังงาน",
      level: 1,
      topic: "ระบบปิด-เปิดแม่พิมพ์"
    },
    {
      id: "adv_1_3",
      question: "เครื่องฉีดแบบ All Electric มีข้อดีอย่างไร?",
      options: ["A. ราคาถูกกว่า", "B. ประหยัดพลังงาน 50%", "C. ซ่อมบำรุงง่าย", "D. ใช้กับพลาสติกได้ทุกชนิด"],
      answer: "B",
      explanation: "เครื่อง All Electric ประหยัดพลังงานได้ถึง 50% เมื่อเทียบกับ Full Hydraulic เพราะใช้เซอร์โวมอเตอร์ที่มีประสิทธิภาพสูง",
      level: 1,
      topic: "ระบบส่งกำลัง"
    },
    {
      id: "adv_1_4",
      question: "ปุ่ม Emergency Stop มีหน้าที่อะไร?",
      options: ["A. หยุดเครื่องทันทีในกรณีฉุกเฉิน", "B. หยุดพักเครื่อง", "C. รีเซ็ตเครื่อง", "D. เปลี่ยนโหมดทำงาน"],
      answer: "A",
      explanation: "Emergency Stop หยุดเครื่องทันทีเมื่อกด ใช้ในกรณีฉุกเฉินเพื่อความปลอดภัย ต้องกดปลดล็อคก่อนเดินเครื่องต่อ",
      level: 1,
      topic: "หน้าจอควบคุม"
    }
  ],

  // Level 2: ความรู้วัสดุ
  level2: [
    {
      id: "adv_2_1",
      question: "พลาสติก PC (Polycarbonate) ต้องอบที่อุณหภูมิและเวลาเท่าไร?",
      options: ["A. 80-85°C, 2-4 ชม.", "B. 120-130°C, 3-4 ชม.", "C. 150-165°C, 4-6 ชม.", "D. 80-90°C, 4-6 ชม."],
      answer: "B",
      explanation: "PC ต้องอบที่ 120-130°C เวลา 3-4 ชั่วโมง เพื่อลดความชื้นให้ต่ำกว่า 0.02%",
      level: 2,
      topic: "การอบเม็ดพลาสติก"
    },
    {
      id: "adv_2_2",
      question: "การตั้งอุณหภูมิกระบอกฉีด Zone ใดควรสูงที่สุด?",
      options: ["A. Zone 1 (Feeding)", "B. Zone 2 (Compression)", "C. Zone 4-Nozzle", "D. ทุก Zone เท่ากัน"],
      answer: "C",
      explanation: "Zone 4 และ Nozzle ควรสูงที่สุดเพราะเป็นจุดที่พลาสติกต้องหลอมละลายสมบูรณ์ก่อนฉีดเข้าแม่พิมพ์",
      level: 2,
      topic: "อุณหภูมิกระบอกฉีด"
    },
    {
      id: "adv_2_3",
      question: "พลาสติกชนิดใดเป็น Thermoset?",
      options: ["A. PP, PE, ABS", "B. PC, PA, POM", "C. Epoxy, Phenolic, Melamine", "D. PET, PMMA, PVC"],
      answer: "C",
      explanation: "Thermoset คือพลาสติกที่ร้อนแล้วแข็งถาวร ไม่สามารถหลอมขึ้นรูปใหม่ได้ ได้แก่ Epoxy, Phenolic, Melamine",
      level: 2,
      topic: "ประเภทพลาสติก"
    },
    {
      id: "adv_2_4",
      question: "ทำไมต้องอบเม็ดพลาสติกก่อนฉีด?",
      options: ["A. ให้พลาสติกนิ่มขึ้น", "B. ไล่ความชื้นออก ป้องกัน Silver Streak", "C. เพิ่มสีให้สวยขึ้น", "D. ลดต้นทุน"],
      answer: "B",
      explanation: "การอบไล่ความชื้นป้องกันปัญหา Silver Streak, Bubble, การย่อยสลายของพลาสติก โดยเฉพาะพลาสติกดูดความชื้น เช่น PC, PA, PET",
      level: 2,
      topic: "การอบเม็ดพลาสติก"
    }
  ],

  // Level 3: กระบวนการฉีด
  level3: [
    {
      id: "adv_3_1",
      question: "ขั้นตอนการฉีดมีกี่ระยะ และข้อใดเรียงถูกต้อง?",
      options: [
        "A. 3 ระยะ: ฉีด → เย็น → ดีด",
        "B. 4 ระยะ: ฉีดเร็ว → ฉีดช้า → อัด → เย็น",
        "C. 5 ระยะ: ปิดแม่พิมพ์ → ฉีด → อัด → เย็น → เปิด",
        "D. 6 ระยะ: เตรียม → ปิด → ฉีด → อัด → เย็น → ดีด"
      ],
      answer: "B",
      explanation: "การฉีดมี 4 ระยะ: 1) ฉีดเร็ว (Fast Injection) 2) ฉีดช้า/เติม (Slow Fill) 3) อัด (Packing/Holding) 4) เย็น (Cooling)",
      level: 3,
      topic: "ขั้นตอนการฉีด"
    },
    {
      id: "adv_3_2",
      question: "V-P Switchover คืออะไร?",
      options: [
        "A. จุดเปลี่ยนจากโหมด Manual เป็น Auto",
        "B. จุดเปลี่ยนจากการควบคุมความเร็ว เป็นควบคุมความดัน",
        "C. จุดเปลี่ยนอุณหภูมิ",
        "D. จุดเปลี่ยนทิศทางสกรู"
      ],
      answer: "B",
      explanation: "V-P Switchover (Velocity-Pressure) คือจุดที่เปลี่ยนจากการควบคุมความเร็วฉีด เป็นควบคุมความดันอัด มักตั้งที่ 95-98% ของการเติมเต็ม",
      level: 3,
      topic: "การควบคุมการฉีด"
    },
    {
      id: "adv_3_3",
      question: "Cushion คืออะไรและควรมีค่าเท่าไร?",
      options: [
        "A. ระยะพลาสติกเหลือหน้าสกรู ควร 3-10mm",
        "B. ระยะหยุดแม่พิมพ์ ควร 0mm",
        "C. แรงดันสูงสุด ควร 100%",
        "D. เวลาพักเครื่อง ควร 5 วินาที"
      ],
      answer: "A",
      explanation: "Cushion คือระยะพลาสติกที่เหลือหน้าสกรูหลังฉีด ควรมี 3-10mm เพื่อรักษาแรงดันอัดและป้องกันสกรูกระแทกหัวฉีด",
      level: 3,
      topic: "พารามิเตอร์การฉีด"
    },
    {
      id: "adv_3_4",
      question: "Back Pressure มีหน้าที่อะไร?",
      options: [
        "A. ดันพลาสติกเข้าแม่พิมพ์",
        "B. ช่วยผสมพลาสติกและไล่อากาศขณะ Plasticizing",
        "C. ปิดแม่พิมพ์",
        "D. ดีดชิ้นงาน"
      ],
      answer: "B",
      explanation: "Back Pressure ช่วยให้การผสมพลาสติกดีขึ้น สีเนียนสม่ำเสมอ และไล่อากาศออกขณะสกรูหมุนถอยหลัง (Plasticizing)",
      level: 3,
      topic: "พารามิเตอร์การฉีด"
    }
  ],

  // Level 4: การแก้ปัญหา
  level4: [
    {
      id: "adv_4_1",
      question: "ปัญหา Silver Streak เกิดจากสาเหตุใดเป็นหลัก?",
      options: [
        "A. อุณหภูมิต่ำเกินไป",
        "B. ความชื้นในเม็ดพลาสติก",
        "C. ความเร็วฉีดช้า",
        "D. แรงปิดแม่พิมพ์มากเกิน"
      ],
      answer: "B",
      explanation: "Silver Streak (รอยเงิน) เกิดจากความชื้นในเม็ดพลาสติก เมื่อถูกความร้อนจะกลายเป็นไอน้ำ แก้โดยอบเม็ดให้แห้งก่อนฉีด",
      level: 4,
      topic: "ปัญหาและการแก้ไข"
    },
    {
      id: "adv_4_2",
      question: "ปัญหา Jetting เกิดจากสาเหตุใดและแก้อย่างไร?",
      options: [
        "A. ความเร็วฉีดช้า → เพิ่มความเร็ว",
        "B. ความเร็วฉีดเร็วเกิน → ลดความเร็วช่วงแรก",
        "C. อุณหภูมิสูง → ลดอุณหภูมิ",
        "D. แรงดันต่ำ → เพิ่มแรงดัน"
      ],
      answer: "B",
      explanation: "Jetting (พลาสติกพุ่งเป็นเส้น) เกิดจากความเร็วฉีดช่วงแรกเร็วเกินไป แก้โดยลดความเร็ว Stage 1 หรือขยาย Gate",
      level: 4,
      topic: "ปัญหาและการแก้ไข"
    },
    {
      id: "adv_4_3",
      question: "ปัญหา Void (โพรงอากาศ) ต่างจาก Bubble อย่างไร?",
      options: [
        "A. Void เกิดจากความชื้น, Bubble เกิดจากการหดตัว",
        "B. Void เกิดจากการหดตัวภายใน, Bubble เกิดจากก๊าซ/ความชื้น",
        "C. เหมือนกันทุกประการ",
        "D. Void เกิดที่ผิว, Bubble เกิดภายใน"
      ],
      answer: "B",
      explanation: "Void เกิดจากการหดตัวภายในชิ้นงาน (สุญญากาศ) แก้โดยเพิ่ม Holding; Bubble เกิดจากก๊าซหรือความชื้น แก้โดยอบเม็ด/ไล่อากาศ",
      level: 4,
      topic: "ปัญหาและการแก้ไข"
    },
    {
      id: "adv_4_4",
      question: "การวิเคราะห์ปัญหาด้วยหลัก 6M เริ่มจากข้อใดก่อน?",
      options: [
        "A. Machine - ตรวจเครื่องจักร",
        "B. Material - ตรวจวัตถุดิบ",
        "C. Man - ตรวจผู้ปฏิบัติงาน",
        "D. ไม่มีลำดับ ตรวจพร้อมกันทุกข้อ"
      ],
      answer: "B",
      explanation: "เริ่มจาก Material ก่อน เพราะเป็นสาเหตุที่พบบ่อยที่สุด: ตรวจความชื้น, Lot เม็ด, การเก็บรักษา",
      level: 4,
      topic: "การวิเคราะห์ปัญหา"
    }
  ],

  // Level 5: เทคนิคขั้นสูง
  level5: [
    {
      id: "adv_5_1",
      question: "Scientific Molding คืออะไร?",
      options: [
        "A. การฉีดแบบดั้งเดิม",
        "B. การฉีดโดยใช้หลักวิทยาศาสตร์และข้อมูลเชิงตัวเลข",
        "C. การฉีดโดยใช้ AI",
        "D. การฉีดในห้องปฏิบัติการ"
      ],
      answer: "B",
      explanation: "Scientific Molding คือการกำหนดพารามิเตอร์โดยใช้หลักวิทยาศาสตร์ เช่น Viscosity Curve, RJG Decoupled Molding แทนการลองผิดลองถูก",
      level: 5,
      topic: "เทคนิคขั้นสูง"
    },
    {
      id: "adv_5_2",
      question: "Decoupled Molding II (D-II) มีหลักการอย่างไร?",
      options: [
        "A. ควบคุมทุกอย่างด้วยความดัน",
        "B. แยกการควบคุม Filling (V) และ Packing (P) อย่างชัดเจน",
        "C. ไม่ต้องใช้ Holding",
        "D. ฉีดด้วยความเร็วคงที่ตลอด"
      ],
      answer: "B",
      explanation: "Decoupled II แยกการควบคุม Filling (ความเร็ว) และ Packing (ความดัน) อย่างชัดเจน โดยใช้ V-P Switchover ที่ 95-98% Full",
      level: 5,
      topic: "Scientific Molding"
    },
    {
      id: "adv_5_3",
      question: "Cavity Pressure Sensor ใช้ทำอะไร?",
      options: [
        "A. วัดความดันน้ำมันไฮดรอลิก",
        "B. วัดความดันในโพรงแม่พิมพ์ขณะฉีด",
        "C. วัดแรงปิดแม่พิมพ์",
        "D. วัดอุณหภูมิแม่พิมพ์"
      ],
      answer: "B",
      explanation: "Cavity Pressure Sensor วัดความดันจริงในโพรงแม่พิมพ์ ใช้ควบคุม V-P Transfer และตรวจสอบคุณภาพ ถือเป็นข้อมูลสำคัญใน Scientific Molding",
      level: 5,
      topic: "เครื่องมือขั้นสูง"
    },
    {
      id: "adv_5_4",
      question: "ข้อใดเป็นประโยชน์ของ Hot Runner System?",
      options: [
        "A. ราคาถูกกว่า Cold Runner",
        "B. ไม่มี Runner Waste และ Cycle Time สั้นลง",
        "C. ใช้กับพลาสติกได้ทุกชนิด",
        "D. ไม่ต้องบำรุงรักษา"
      ],
      answer: "B",
      explanation: "Hot Runner ไม่มี Runner เหลือทิ้ง (Zero Waste) และ Cycle Time สั้นลงเพราะไม่ต้องรอ Runner เย็น แต่ราคาแพงและต้องดูแลรักษา",
      level: 5,
      topic: "ระบบ Runner"
    }
  ]
};

/**
 * ข้อสอบสถานการณ์จำลอง (Case Study)
 */
const CASE_STUDY_EXAMS = [
  {
    id: "case_1",
    title: "🏭 กรณีศึกษา: ปัญหา Short Shot",
    scenario: "คุณเป็นช่างฉีดพลาสติก พบว่าชิ้นงานฝาขวดน้ำ (PP) ฉีดไม่เต็มที่มุม แม่พิมพ์ 8 cavity พบปัญหาที่ cavity 3 และ 7",
    questions: [
      {
        q: "สาเหตุที่น่าจะเป็นไปได้มากที่สุดคือข้อใด?",
        options: ["A. Injection Pressure ต่ำ", "B. Runner/Gate ของ Cavity 3,7 อุดตันหรือเล็กเกินไป", "C. อุณหภูมิ Barrel สูงเกินไป", "D. Cooling Time นานเกินไป"],
        answer: "B",
        explanation: "เมื่อปัญหาเกิดเฉพาะบาง Cavity แสดงว่าสาเหตุน่าจะมาจาก Runner/Gate ไม่สมดุล ไม่ใช่ปัญหาจากเครื่องจักร"
      },
      {
        q: "ขั้นตอนแรกในการแก้ไขคืออะไร?",
        options: ["A. เพิ่ม Injection Pressure ทันที", "B. ตรวจสอบ Runner และ Gate ของ Cavity ที่มีปัญหา", "C. เปลี่ยนเม็ดพลาสติก Lot ใหม่", "D. ลด Cooling Time"],
        answer: "B",
        explanation: "ต้องหาสาเหตุที่แท้จริงก่อน โดยตรวจสอบ Runner/Gate ว่ามีการอุดตันหรือขนาดไม่สมดุลหรือไม่"
      }
    ]
  },
  {
    id: "case_2",
    title: "🔥 กรณีศึกษา: ปัญหา Burn Mark",
    scenario: "ผลิตชิ้นงานกล่องใส (PC) พบรอยไหม้สีเหลืองที่มุมชิ้นงาน เกิดขึ้นทุก Cavity เหมือนกัน",
    questions: [
      {
        q: "สาเหตุหลักที่น่าจะเป็นไปได้คือข้อใด?",
        options: ["A. PC ความชื้นสูง", "B. อากาศค้างในแม่พิมพ์ + ความเร็วฉีดสูง", "C. อุณหภูมิแม่พิมพ์ต่ำ", "D. Holding Pressure สูงเกินไป"],
        answer: "B",
        explanation: "Burn Mark ที่มุมมักเกิดจากอากาศถูกอัดและเกิดความร้อนสูง (Diesel Effect) เมื่อความเร็วฉีดสูงและระบายอากาศไม่ดี"
      },
      {
        q: "วิธีแก้ไขที่ดีที่สุดคือข้อใด?",
        options: ["A. ลดอุณหภูมิ Barrel", "B. เพิ่ม Vent ที่แม่พิมพ์ + ลดความเร็วฉีดช่วงท้าย", "C. เปลี่ยนเป็นพลาสติกอื่น", "D. เพิ่ม Cooling Time"],
        answer: "B",
        explanation: "ต้องเพิ่มช่องระบายอากาศที่ตำแหน่งเกิดปัญหา และลดความเร็วฉีดช่วง Filling สุดท้าย"
      }
    ]
  },
  {
    id: "case_3",
    title: "📏 กรณีศึกษา: ปัญหา Dimension เปลี่ยน",
    scenario: "ผลิตชิ้นงาน Gear (POM) มิติเริ่มผิดเพี้ยนหลังจากฉีดไป 4 ชั่วโมง ทั้งที่ตอนเริ่มงานปกติดี",
    questions: [
      {
        q: "สาเหตุที่น่าจะเป็นไปได้มากที่สุดคือข้อใด?",
        options: ["A. เครื่องเสีย", "B. อุณหภูมิน้ำหล่อเย็นเปลี่ยน (Mold Temp ไม่คงที่)", "C. พลาสติกหมด", "D. แม่พิมพ์แตก"],
        answer: "B",
        explanation: "มิติเปลี่ยนหลังจากฉีดไประยะหนึ่ง มักเกิดจาก Mold Temperature ไม่คงที่ ซึ่งส่งผลต่อการหดตัวของชิ้นงาน"
      },
      {
        q: "วิธีป้องกันปัญหานี้ในระยะยาวคืออะไร?",
        options: ["A. ลด Cycle Time", "B. ติดตั้ง Mold Temperature Controller (MTC)", "C. ใช้พลาสติกอื่น", "D. เพิ่มความเร็วฉีด"],
        answer: "B",
        explanation: "ต้องใช้ Mold Temperature Controller (MTC) เพื่อรักษาอุณหภูมิแม่พิมพ์ให้คงที่ตลอดการผลิต"
      }
    ]
  }
];

// =====================================================
// 🎯 EXAM PREPARATION - คู่มือเตรียมสอบ (Enhanced)
// =====================================================

const EXAM_TOPICS = {
  basic: {
    title: "📚 หัวข้อพื้นฐาน (Basic)",
    topics: [
      "1. ส่วนประกอบเครื่องฉีดพลาสติก",
      "2. วงจรการฉีด (Injection Cycle)",
      "3. ชนิดพลาสติก Thermoplastic vs Thermoset",
      "4. คุณสมบัติพลาสติกพื้นฐาน (PP, ABS, PC, PA)",
      "5. อุณหภูมิหลอมของพลาสติกแต่ละชนิด",
    ],
    linkedLessons: [1, 2, 3, 4] // เชื่อมโยงกับ lessons_database.json
  },
  parameters: {
    title: "⚙️ พารามิเตอร์ (Parameters)",
    topics: [
      "1. อุณหภูมิ: Barrel Temp, Mold Temp",
      "2. ความดัน: Injection, Holding, Back Pressure",
      "3. ความเร็ว: Injection Speed, Screw Speed",
      "4. เวลา: Injection, Holding, Cooling Time",
      "5. ความสัมพันธ์ของพารามิเตอร์",
    ],
    linkedLessons: [9, 10, 11, 12]
  },
  defects: {
    title: "🔧 ปัญหาและการแก้ไข (Defects)",
    topics: [
      "1. Short Shot - สาเหตุและวิธีแก้",
      "2. Flash - สาเหตุและวิธีแก้",
      "3. Sink Mark - สาเหตุและวิธีแก้",
      "4. Warpage - สาเหตุและวิธีแก้",
      "5. Burn Mark - สาเหตุและวิธีแก้",
      "6. Weld Line - สาเหตุและวิธีแก้",
    ],
    linkedLessons: [13, 14, 15, 16]
  },
  calculation: {
    title: "🔢 การคำนวณ (Calculations)",
    topics: [
      "1. แรงปิดแม่พิมพ์ (Clamping Force)",
      "2. Cooling Time",
      "3. Cycle Time",
      "4. กำลังผลิต (Production Capacity)",
      "5. Shot Size",
    ],
    linkedLessons: [17, 18, 19, 20]
  },
  advanced: {
    title: "🚀 เทคนิคขั้นสูง (Advanced)",
    topics: [
      "1. Scientific Molding",
      "2. Decoupled Molding",
      "3. Hot Runner System",
      "4. Multi-Shot Molding",
      "5. Industry 4.0 ในการฉีดพลาสติก",
    ],
    linkedLessons: [21, 22, 23, 24]
  }
};

// =====================================================
// 💬 Q&A - คำถามที่พบบ่อย
// =====================================================

const FAQ = [
  {
    q: "เริ่มเรียนการฉีดพลาสติกต้องรู้อะไรก่อน?",
    a: "เริ่มจาก 1) ส่วนประกอบเครื่องฉีด 2) วงจรการฉีด 3) ชนิดพลาสติก 4) พารามิเตอร์พื้นฐาน",
  },
  {
    q: "ทำไมต้องรู้คุณสมบัติพลาสติก?",
    a: "เพราะพลาสติกแต่ละชนิดมีอุณหภูมิหลอม ความหนืด และคุณสมบัติต่างกัน การตั้งค่าเครื่องจึงต้องเหมาะสมกับพลาสติกที่ใช้",
  },
  {
    q: "Cycle Time สำคัญอย่างไร?",
    a: "Cycle Time กำหนดกำลังผลิต ยิ่ง Cycle Time สั้น ยิ่งผลิตได้มาก แต่ต้องไม่กระทบคุณภาพชิ้นงาน",
  },
  {
    q: "ทำไม Cooling Time ถึงนานที่สุด?",
    a: "เพราะพลาสติกต้องเย็นตัวจนแข็งพอที่จะดีดออกได้โดยไม่เสียรูป การเย็นตัวขึ้นกับความหนาและการระบายความร้อน",
  },
  {
    q: "จะรู้ได้อย่างไรว่าตั้งค่าถูกต้อง?",
    a: "ดูจากคุณภาพชิ้นงาน: ไม่มี Short Shot, Flash, Sink Mark และ Cycle Time เหมาะสม",
  },
];

// =====================================================
// 🎨 FLEX MESSAGE CREATORS
// =====================================================

/**
 * สร้างเมนูหลักสำหรับนักเรียน
 */
function createStudentMenuFlex() {
  return {
    type: "flex",
    altText: "🎓 Wit365 Learning Center - ศูนย์การเรียนรู้วิศวกรรมพลาสติก",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🎓", size: "xxl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Wit365", weight: "bold", size: "xl", color: "#FFFFFF" },
                  { type: "text", text: "วิศวกรรมพลาสติก โดย อาจารย์ วิทยา", size: "xs", color: "#93C5FD" },
                ],
                paddingStart: "15px",
              },
            ],
            alignItems: "center",
          },
        ],
        backgroundColor: "#1E40AF",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "เลือกหัวข้อที่สนใจ:", weight: "bold", size: "sm", color: "#1E40AF" },
          { type: "separator", margin: "md" },
          // Lesson buttons
          {
            type: "box",
            layout: "vertical",
            contents: [
              createMenuButton("📖 บทเรียน", "เนื้อหาการฉีดพลาสติก", "/lesson"),
              createMenuButton("📝 แบบทดสอบ", "ทดสอบความรู้", "/quiz"),
              createMenuButton("🎯 เตรียมสอบ", "สรุปหัวข้อสำคัญ", "/exam"),
              createMenuButton("❓ คำถามที่พบบ่อย", "FAQ สำหรับผู้เริ่มต้น", "/faq"),
              createMenuButton("🧮 เครื่องคิดเลข", "คำนวณพารามิเตอร์", "/calculator"),
            ],
            spacing: "sm",
            margin: "lg",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "💡 Wit365 โดย อาจารย์ วิทยา", size: "xs", color: "#666666", wrap: true, align: "center" },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

function createMenuButton(title, subtitle, action) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: title, weight: "bold", size: "sm", color: "#333333" },
          { type: "text", text: subtitle, size: "xs", color: "#666666" },
        ],
        flex: 4,
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "▶", size: "lg", color: "#1E40AF", align: "center" },
        ],
        flex: 1,
        justifyContent: "center",
      },
    ],
    paddingAll: "12px",
    backgroundColor: "#F8FAFC",
    cornerRadius: "md",
    action: { type: "message", text: action },
  };
}

/**
 * สร้างรายการบทเรียน
 */
function createLessonListFlex() {
  const lessonBubbles = Object.values(LESSONS).map((lesson) => ({
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: lesson.title, weight: "bold", size: "md", color: "#FFFFFF", wrap: true },
        { type: "text", text: lesson.subtitle, size: "xs", color: "#93C5FD" },
      ],
      backgroundColor: "#1E40AF",
      paddingAll: "15px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: `⏱️ ${lesson.duration}`, size: "xs", color: "#666666" },
            { type: "text", text: `📊 ${lesson.level}`, size: "xs", color: "#666666", align: "end" },
          ],
        },
      ],
      paddingAll: "15px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "message", label: "เริ่มเรียน", text: `/lesson ${lesson.id}` },
          style: "primary",
          color: "#1E40AF",
          height: "sm",
        },
      ],
      paddingAll: "10px",
    },
  }));

  return {
    type: "flex",
    altText: "📚 รายการบทเรียน",
    contents: {
      type: "carousel",
      contents: lessonBubbles,
    },
  };
}

/**
 * สร้าง Flex แสดงเนื้อหาบทเรียนแบบละเอียด (Step-by-Step)
 */
function createLessonContentFlex(lessonId) {
  const lesson = LESSONS[lessonId];
  if (!lesson) return null;

  // เลือกฟังก์ชันสร้างเนื้อหาตามบทเรียน
  let contentBody = [];
  switch (lessonId) {
    case "lesson1":
      contentBody = createLesson1Body();
      break;
    case "lesson2":
      contentBody = createLesson2Body();
      break;
    case "lesson3":
      contentBody = createLesson3Body();
      break;
    case "lesson4":
      contentBody = createLesson4Body();
      break;
    case "lesson5":
      contentBody = createLesson5Body();
      break;
    default:
      contentBody = [
        { type: "text", text: "📖 เนื้อหาบทเรียนถูกส่งแล้ว", size: "sm", color: "#666666" },
      ];
  }

  return {
    type: "flex",
    altText: `📖 ${lesson.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: lesson.title, weight: "bold", size: "lg", color: "#FFFFFF" },
          { type: "text", text: lesson.subtitle, size: "xs", color: "#93C5FD" },
        ],
        backgroundColor: "#1E40AF",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          ...contentBody,
          { type: "separator", margin: "lg" },
          { type: "text", text: "💡 กดปุ่มด้านล่างเพื่อทำแบบทดสอบ", size: "xs", color: "#999999", margin: "lg", align: "center" },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "📝 ทำแบบทดสอบบทนี้", text: `/quiz ${lessonId}` },
            style: "primary",
            color: "#16A34A",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "📚 กลับไปรายการบทเรียน", text: "/lesson" },
            style: "secondary",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

// =====================================================
// 📖 LESSON BODY CREATORS
// =====================================================

function createStepBox(number, title, description, icon = "🔹") {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `${number}`, weight: "bold", size: "sm", color: "#FFFFFF", align: "center" },
        ],
        width: "24px",
        height: "24px",
        backgroundColor: "#1E40AF",
        cornerRadius: "12px",
        justifyContent: "center",
        flex: 0,
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: title, weight: "bold", size: "sm", color: "#333333" },
          { type: "text", text: description, size: "xs", color: "#666666", wrap: true, margin: "xs" },
        ],
        paddingStart: "10px",
      },
    ],
    margin: "md",
  };
}

function createInfoBox(title, items, color = "#F3F4F6") {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: title, weight: "bold", size: "sm", color: "#1E40AF" },
      ...items.map((item) => ({
        type: "text", text: `• ${item}`, size: "xs", color: "#333333", margin: "sm", wrap: true,
      })),
    ],
    paddingAll: "10px",
    backgroundColor: color,
    cornerRadius: "md",
    margin: "md",
  };
}

function createLesson1Body() {
  return [
    { type: "text", text: "กระบวนการฉีดพลาสติก (Injection Molding)", weight: "bold", size: "md", color: "#1E40AF" },
    { type: "text", text: "การขึ้นรูปพลาสติกโดยการหลอมและฉีดเข้าแม่พิมพ์", size: "xs", color: "#666666", margin: "sm" },
    { type: "separator", margin: "md" },
    createStepBox(1, "Hopper & Barrel", "เม็ดพลาสติกถูกป้อนเข้าถังและหลอมในกระบอกฉีด"),
    createStepBox(2, "Injection", "สกรูดันพลาสติกเหลวเข้าแม่พิมพ์ด้วยความดันสูง"),
    createStepBox(3, "Cooling", "พลาสติกเย็นตัวและแข็งตัวเป็นรูปร่างตามแม่พิมพ์"),
    createStepBox(4, "Ejection", "แม่พิมพ์เปิดออกและดีดชิ้นงานออกมา"),
    { type: "separator", margin: "lg" },
    createInfoBox("ส่วนประกอบสำคัญ", ["Hopper (ถังพัก)", "Screw (สกรู)", "Heater (ฮีตเตอร์)", "Mold (แม่พิมพ์)"]),
  ];
}

function createLesson2Body() {
  return [
    { type: "text", text: "ชนิดของพลาสติก (Plastic Types)", weight: "bold", size: "md", color: "#1E40AF" },
    { type: "text", text: "แบ่งเป็น 2 ประเภทหลักตามการคืนรูป", size: "xs", color: "#666666", margin: "sm" },
    { type: "separator", margin: "md" },
    createStepBox("A", "Thermoplastic", "หลอมใหม่ได้ ♻️ (นิยมใช้มากที่สุด)", "♻️"),
    createInfoBox("ตัวอย่าง Thermoplastic", ["PP (ถัง, กะละมัง)", "ABS (หมวกกันน็อค, ชิ้นส่วนรถ)", "PET (ขวดน้ำ)", "PC (ไฟหน้ารถ)"], "#ECFDF5"),
    createStepBox("B", "Thermoset", "หลอมใหม่ไม่ได้ ❌ (แข็งแรง ทนร้อน)", "🔥"),
    createInfoBox("ตัวอย่าง Thermoset", ["Melamine (จานชาม)", "Epoxy (กาว, เคลือบผิว)", "Bakelite (ด้ามกระทะ)"], "#FEF2F2"),
  ];
}

function createLesson3Body() {
  return [
    { type: "text", text: "พารามิเตอร์การฉีด (Parameters)", weight: "bold", size: "md", color: "#1E40AF" },
    { type: "text", text: "4 ปัจจัยหลักที่ควบคุมคุณภาพชิ้นงาน", size: "xs", color: "#666666", margin: "sm" },
    { type: "separator", margin: "md" },
    createStepBox("1", "Temperature (อุณหภูมิ)", "อุณหภูมิหลอม (Barrel) และแม่พิมพ์ (Mold)"),
    createStepBox("2", "Pressure (ความดัน)", "แรงดันฉีด (Injection) และแรงดันย้ำ (Holding)"),
    createStepBox("3", "Speed (ความเร็ว)", "ความเร็วในการฉีดพลาสติกเข้าแม่พิมพ์"),
    createStepBox("4", "Time (เวลา)", "เวลาฉีด, เวลาเย็นตัว (Cooling), เวลาวัฏจักร (Cycle)"),
    { type: "separator", margin: "lg" },
    { type: "text", text: "💡 เคล็ดลับ: การตั้งค่าต้องสมดุลกัน หากอุณหภูมิสูง อาจต้องลดความดัน", size: "xs", color: "#D97706", wrap: true, margin: "md" },
  ];
}

function createLesson4Body() {
  return [
    { type: "text", text: "ปัญหาและการแก้ไข (Defects)", weight: "bold", size: "md", color: "#DC2626" },
    { type: "text", text: "ปัญหาที่พบบ่อยในงานฉีดพลาสติก", size: "xs", color: "#666666", margin: "sm" },
    { type: "separator", margin: "md" },
    createStepBox("1", "Short Shot (ฉีดไม่เต็ม)", "พลาสติกไหลไม่เต็มแม่พิมพ์\n👉 แก้: เพิ่ม Temp, Pressure, Speed"),
    createStepBox("2", "Flash (ครีบ)", "พลาสติกเกินออกมาตามรอยต่อ\n👉 แก้: ลด Pressure, เพิ่ม Clamping Force"),
    createStepBox("3", "Sink Mark (รอยยุบ)", "ผิวชิ้นงานยุบตัวลง\n👉 แก้: เพิ่ม Holding Pressure/Time"),
    createStepBox("4", "Burn Mark (รอยไหม้)", "รอยดำจากการเผาไหม้\n👉 แก้: ลด Speed, เพิ่มช่องระบายอากาศ"),
    createStepBox("5", "Flow Mark (รอยไหล)", "รอยคลื่นบนผิวชิ้นงาน\n👉 แก้: เพิ่ม Mold Temp, Injection Speed"),
  ];
}

function createLesson5Body() {
  return [
    { type: "text", text: "การคำนวณพื้นฐาน (Calculations)", weight: "bold", size: "md", color: "#1E40AF" },
    { type: "text", text: "สูตรสำคัญสำหรับช่างฉีดพลาสติก", size: "xs", color: "#666666", margin: "sm" },
    { type: "separator", margin: "md" },
    createStepBox("1", "Clamping Force (แรงปิด)", "F = P × A\n(แรงปิด = ความดันในแม่พิมพ์ × พื้นที่หน้าตัด)"),
    createStepBox("2", "Shot Weight (น้ำหนักฉีด)", "W = Volume × Density\n(น้ำหนัก = ปริมาตร × ความหนาแน่น)"),
    createStepBox("3", "Cooling Time (เวลาเย็น)", "t ∝ s²\n(เวลาเย็นตัวแปรผันตรงกับความหนายกกำลังสอง)"),
    { type: "separator", margin: "lg" },
    {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "🧮 ลองใช้เครื่องคิดเลขในเมนูหลักเพื่อช่วยคำนวณได้เลย!", size: "xs", color: "#FFFFFF", align: "center" },
      ],
      paddingAll: "10px",
      backgroundColor: "#1E40AF",
      cornerRadius: "md",
      margin: "md",
    },
  ];
}

/**
 * สร้างคำถามแบบทดสอบ (Enhanced with Gamification)
 */
function createQuizQuestionFlex(questionId, questionNumber = 1, totalQuestions = 3, currentScore = 0, streak = 0) {
  const question = QUIZ_QUESTIONS[questionId];
  if (!question) return null;

  // Ensure options exist
  const options = question.options || ["A. ตัวเลือก A", "B. ตัวเลือก B", "C. ตัวเลือก C", "D. ตัวเลือก D"];

  const optionBoxes = options.map((opt, index) => {
    const choiceChar = String.fromCharCode(65 + index); // A, B, C, D
    const optText = opt || `${choiceChar}. ไม่พบข้อมูล`;

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: choiceChar, weight: "bold", size: "sm", color: "#FFFFFF", align: "center" },
          ],
          width: "24px",
          height: "24px",
          backgroundColor: "#7C3AED",
          cornerRadius: "12px",
          justifyContent: "center",
          flex: 0,
        },
        {
          type: "text",
          text: optText,
          size: "sm",
          color: "#333333",
          wrap: true,
          gravity: "center",
          flex: 1,
          margin: "md",
        },
      ],
      paddingAll: "12px",
      backgroundColor: "#F3F4F6",
      cornerRadius: "md",
      margin: "sm",
      action: {
        type: "message",
        label: `เลือก ${choiceChar}`,
        text: `/answer ${questionId} ${choiceChar}`,
      },
    };
  });

  // Streak Fire Logic
  const streakIcon = "🔥";
  let streakColor = "#EF4444"; // Red
  if (streak >= 3) streakColor = "#F59E0B"; // Orange
  if (streak >= 5) streakColor = "#10B981"; // Green

  return {
    type: "flex",
    altText: `📝 คำถามข้อ ${questionNumber}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📝 แบบทดสอบ", weight: "bold", size: "sm", color: "#C4B5FD" },
              { type: "text", text: `${questionNumber}/${totalQuestions}`, weight: "bold", size: "sm", color: "#FFFFFF", align: "end" },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: LESSONS[question.lesson]?.title || "แบบทดสอบ", weight: "bold", size: "lg", color: "#FFFFFF", flex: 1 },
              ...(streak > 1 ? [{
                type: "text",
                text: `${streakIcon} ${streak}`,
                weight: "bold",
                size: "md",
                color: streakColor,
                align: "end",
                flex: 0,
              }] : []),
            ],
            margin: "sm",
          },
          // Score & Progress
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: `⭐ ${currentScore}`, size: "xs", color: "#FFD700", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [],
                    width: `${Math.round((questionNumber / totalQuestions) * 100)}%`,
                    height: "4px",
                    backgroundColor: "#FFFFFF",
                  },
                ],
                backgroundColor: "#B8B8B8",
                height: "4px",
                margin: "md",
                cornerRadius: "sm",
                flex: 1,
                offsetTop: "4px",
              },
            ],
            margin: "md",
          },
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: question.question, weight: "bold", size: "md", wrap: true, color: "#333333" },
          { type: "separator", margin: "lg" },
          { type: "text", text: "เลือกคำตอบที่ถูกต้อง:", size: "xs", color: "#666666", margin: "lg" },
          ...optionBoxes,
        ],
        paddingAll: "20px",
      },
    },
  };
}

/**
 * สร้างผลลัพธ์คำตอบ (Enhanced with Gamification)
 */
function createAnswerResultFlex(questionId, userAnswer, isCorrect, earnedPoints = 0, streak = 0, totalScore = 0) {
  const question = QUIZ_QUESTIONS[questionId];
  if (!question) return null;

  const headerColor = isCorrect ? "#16A34A" : "#DC2626";
  const headerText = isCorrect ? (streak > 2 ? "🔥 สุดยอด! Combo!" : "🎉 ถูกต้อง!") : "😢 ผิดครับ";

  return {
    type: "flex",
    altText: isCorrect ? "✅ ถูกต้อง!" : "❌ ไม่ถูกต้อง",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: headerText, weight: "bold", size: "xl", color: "#FFFFFF", align: "center" },
          (isCorrect ? {
            type: "text",
            text: `+${earnedPoints} คะแนน ${streak > 1 ? `(Combo x${streak})` : ""}`,
            size: "sm",
            color: "#BBF7D0",
            align: "center",
            margin: "sm",
          } : { type: "spacer", size: "xs" }),
        ],
        backgroundColor: headerColor,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: question.question, size: "xs", color: "#666666", wrap: true, maxLines: 2 },
          { type: "separator", margin: "md" },

          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "คำตอบของคุณ:", size: "xs", color: "#666666", flex: 1 },
              { type: "text", text: userAnswer, weight: "bold", size: "sm", color: isCorrect ? "#16A34A" : "#DC2626", flex: 2, align: "end" },
            ],
            margin: "md",
          },
          (!isCorrect ? {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "เฉลย:", size: "xs", color: "#666666", flex: 1 },
              { type: "text", text: question.answer, weight: "bold", size: "sm", color: "#16A34A", flex: 2, align: "end" },
            ],
            margin: "sm",
          } : { type: "spacer", size: "xs" }),

          { type: "box", layout: "vertical", contents: [], margin: "lg", height: "1px", backgroundColor: "#E5E7EB" },

          { type: "text", text: "💡 คำอธิบาย:", weight: "bold", size: "sm", color: "#333333", margin: "md" },
          { type: "text", text: question.explanation, size: "sm", color: "#666666", wrap: true, margin: "sm" },

          // AI Explanation Button
          {
            type: "button",
            action: {
              type: "message",
              label: "🤖 อธิบายลึกซึ้งด้วย AI",
              text: `/explain_ai ${questionId}`,
            },
            style: "secondary",
            height: "sm",
            margin: "md",
          },
        ],
        paddingAll: "20px",
      },
    },
  };
}

/**
 * สร้างเมนูเตรียมสอบ
 */
function createExamPrepFlex() {
  const topicBoxes = Object.values(EXAM_TOPICS).map((topic) => ({
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: topic.title, weight: "bold", size: "sm", color: "#1E40AF" },
      ...topic.topics.map((t) => ({ type: "text", text: t, size: "xs", color: "#666666", margin: "sm" })),
    ],
    paddingAll: "12px",
    backgroundColor: "#F8FAFC",
    cornerRadius: "md",
    margin: "md",
  }));

  return {
    type: "flex",
    altText: "🎯 คู่มือเตรียมสอบ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🎯 คู่มือเตรียมสอบ", weight: "bold", size: "lg", color: "#FFFFFF" },
          { type: "text", text: "Exam Preparation Guide", size: "xs", color: "#FCD34D" },
        ],
        backgroundColor: "#B45309",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: topicBoxes,
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "📝 ทำแบบทดสอบรวม", text: "/quiz all" },
            style: "primary",
            color: "#B45309",
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง FAQ Flex
 */
function createFAQFlex() {
  const faqBoxes = FAQ.map((item, idx) => ({
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: `❓ ${item.q}`, weight: "bold", size: "sm", color: "#1E40AF", wrap: true },
      { type: "text", text: `💡 ${item.a}`, size: "xs", color: "#333333", wrap: true, margin: "sm" },
    ],
    paddingAll: "12px",
    backgroundColor: idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
    margin: "sm",
  }));

  return {
    type: "flex",
    altText: "❓ คำถามที่พบบ่อย",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "❓ คำถามที่พบบ่อย", weight: "bold", size: "lg", color: "#FFFFFF" },
          { type: "text", text: "Frequently Asked Questions", size: "xs", color: "#93C5FD" },
        ],
        backgroundColor: "#0891B2",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: faqBoxes,
        paddingAll: "10px",
      },
    },
  };
}

/**
 * สร้างผลสรุปแบบทดสอบ (Enhanced)
 */
function createQuizResultFlex(correct, total, lessonId = null, totalScore = 0) {
  const percentage = Math.round((correct / total) * 100);
  let grade; let gradeColor; let message; let icon;

  if (percentage >= 80) {
    grade = "A";
    gradeColor = "#16A34A";
    message = "🎉 ยอดเยี่ยมมาก! คุณเข้าใจเนื้อหาได้ดีเยี่ยม";
    icon = "🏆";
  } else if (percentage >= 60) {
    grade = "B";
    gradeColor = "#2563EB";
    message = "👍 ดีมาก! ลองทบทวนเพิ่มเติมอีกนิด";
    icon = "🎖️";
  } else if (percentage >= 40) {
    grade = "C";
    gradeColor = "#D97706";
    message = "📚 ควรทบทวนเนื้อหาเพิ่มเติม";
    icon = "📖";
  } else {
    grade = "D";
    gradeColor = "#DC2626";
    message = "💪 ลองอ่านบทเรียนอีกครั้งแล้วทำใหม่นะ";
    icon = "💪";
  }

  return {
    type: "flex",
    altText: `📊 ผลคะแนน: ${correct}/${total} (${percentage}%)`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📊 ผลการทดสอบ", weight: "bold", size: "lg", color: "#FFFFFF", align: "center" },
          { type: "text", text: "Quiz Result", size: "xs", color: "#E0E0E0", align: "center" },
        ],
        backgroundColor: gradeColor,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: icon, size: "5xl", align: "center" },
          { type: "text", text: `${correct}/${total}`, weight: "bold", size: "3xl", color: "#333333", align: "center", margin: "md" },
          { type: "text", text: `คะแนนรวม: ${totalScore} แต้ม`, weight: "bold", size: "md", color: "#F59E0B", align: "center", margin: "sm" },
          { type: "text", text: message, size: "sm", color: "#666666", align: "center", wrap: true, margin: "lg" },

          { type: "separator", margin: "xl" },

          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🔄 ทำแบบทดสอบอีกครั้ง", text: lessonId ? `/quiz ${lessonId}` : "/quiz all" },
                style: "primary",
                color: gradeColor,
                height: "sm",
              },
              {
                type: "button",
                action: { type: "message", label: "🏠 กลับเมนูหลัก", text: "/student" },
                style: "secondary",
                height: "sm",
                margin: "sm",
              },
            ],
            margin: "lg",
          },
        ],
        paddingAll: "20px",
      },
    },
  };
}


// =====================================================
// 🤖 AI INTEGRATION - ระบบ AI ผู้ช่วยสอน
// =====================================================

/**
 * System Prompt สำหรับ AI ผู้เชี่ยวชาญการฉีดพลาสติก
 */
function getInjectionMoldingPrompt(userLevel = "beginner") {
  const levelDescriptions = {
    beginner: "ผู้เริ่มต้น ใช้ภาษาง่ายๆ อธิบายละเอียด มีตัวอย่างประกอบ",
    intermediate: "ระดับกลาง มีพื้นฐานแล้ว อธิบายลึกขึ้น ใช้ศัพท์เทคนิคได้",
    advanced: "ระดับสูง เชี่ยวชาญแล้ว เน้นเทคนิคขั้นสูง การ optimize",
  };

  return `คุณคือ "พี่วิทย์" 🧑‍🔬 ผู้เชี่ยวชาญด้านการฉีดพลาสติก (Injection Molding) ที่มีประสบการณ์มากกว่า 20 ปี

🎯 บทบาทของคุณ:
- ครูผู้สอนที่อธิบายเรื่องยากให้เข้าใจง่าย
- ที่ปรึกษาแก้ปัญหาการผลิตจริง
- ผู้เชี่ยวชาญคำนวณพารามิเตอร์

👤 ระดับผู้เรียน: ${levelDescriptions[userLevel] || levelDescriptions.beginner}

📚 ความรู้ที่คุณมี:
1. พื้นฐานการฉีดพลาสติก - เครื่องจักร, กระบวนการ, วงจรการฉีด
2. ชนิดพลาสติก - Thermoplastic, Thermoset, PP, ABS, PC, PA, POM
3. พารามิเตอร์การฉีด - อุณหภูมิ, ความดัน, ความเร็ว, เวลา
4. ปัญหาและการแก้ไข - Short shot, Flash, Sink mark, Warpage, Burn mark, Weld line
5. การคำนวณ - Clamping force, Shot size, Cooling time, Cycle time
6. การออกแบบแม่พิมพ์ - Gate, Runner, Cooling channel
7. การควบคุมคุณภาพ - SPC, CPK, Inspection

📝 หลักการตอบ:
1. ตอบเป็นภาษาไทย อ่านง่าย
2. ใช้อีโมจิให้เหมาะสม
3. แบ่งหัวข้อชัดเจน
4. มีตัวอย่างประกอบเสมอ
5. ถ้าเป็นการคำนวณ แสดงขั้นตอนทีละขั้น
6. ถ้าไม่แน่ใจ บอกตรงๆ
7. แนะนำให้ศึกษาเพิ่มเติมจากบทเรียนที่เกี่ยวข้อง

🚫 สิ่งที่ไม่ควรทำ:
- ไม่ตอบเรื่องที่ไม่เกี่ยวกับการฉีดพลาสติก/งานอุตสาหกรรม
- ไม่แนะนำสิ่งที่อาจเป็นอันตราย
- ไม่ใช้ศัพท์ยากเกินไปสำหรับผู้เริ่มต้น

💡 ตัวอย่างการตอบ:
- เมื่อถูกถามเรื่องปัญหา → วิเคราะห์สาเหตุ → แนะนำวิธีแก้ → อธิบายหลักการ
- เมื่อถูกถามเรื่องคำนวณ → บอกสูตร → แทนค่า → หาคำตอบ → อธิบายความหมาย`;
}

/**
 * ถาม AI เรื่องการฉีดพลาสติก
 */
async function askInjectionMoldingAI(question, userLevel = "beginner", context = "") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = getInjectionMoldingPrompt(userLevel);
    const contextInfo = context ? `\n\n📋 บริบทเพิ่มเติม: ${context}` : "";

    const prompt = `${systemPrompt}${contextInfo}

❓ คำถามจากผู้เรียน:
${question}

กรุณาตอบคำถามนี้ให้เหมาะสมกับระดับผู้เรียน:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Error:", error);
    return "❌ ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง";
  }
}

/**
 * ตรวจสอบว่าเป็นคำถามเกี่ยวกับการฉีดพลาสติกหรือไม่
 */
function isInjectionMoldingQuestion(text) {
  const keywords = [
    "ฉีด", "พลาสติก", "โมลด์", "mold", "injection", "molding",
    "barrel", "screw", "nozzle", "hopper", "clamping",
    "อุณหภูมิ", "ความดัน", "ความเร็ว", "เวลา", "cycle",
    "short shot", "flash", "sink", "warpage", "burn", "weld line",
    "pp", "abs", "pc", "pa", "pom", "pe", "nylon",
    "cooling", "holding", "ejection", "gate", "runner",
    "แม่พิมพ์", "เม็ดพลาสติก", "ชิ้นงาน", "ครีบ", "ยุบ", "บิด", "ไหม้",
    "พารามิเตอร์", "parameter", "คำนวณ", "แรงปิด", "shot",
  ];

  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

// =====================================================
// 🎮 INTERACTIVE LEARNING TOOLS
// =====================================================

/**
 * สร้าง Flashcard สำหรับการเรียนรู้
 */
const FLASHCARDS = {
  terms: [
    { front: "Injection Molding", back: "กระบวนการฉีดพลาสติกเข้าแม่พิมพ์เพื่อขึ้นรูป", category: "basic" },
    { front: "Cycle Time", back: "เวลารวมในการผลิต 1 ชิ้นงาน (ปิด→ฉีด→อัด→เย็น→เปิด→ดีด)", category: "basic" },
    { front: "Barrel Temperature", back: "อุณหภูมิกระบอกฉีด ใช้หลอมพลาสติก", category: "parameter" },
    { front: "Mold Temperature", back: "อุณหภูมิแม่พิมพ์ ควบคุมการเย็นตัว", category: "parameter" },
    { front: "Injection Pressure", back: "ความดันที่ใช้ดันพลาสติกเข้าแม่พิมพ์", category: "parameter" },
    { front: "Holding Pressure", back: "ความดันอัดหลังฉีด ป้องกัน Sink mark (60-80% ของ Inj.)", category: "parameter" },
    { front: "Cooling Time", back: "เวลาทำให้ชิ้นงานเย็นตัว (60-80% ของ Cycle)", category: "parameter" },
    { front: "Short Shot", back: "ปัญหาฉีดไม่เต็ม สาเหตุ: ความดัน/อุณหภูมิต่ำ", category: "defect" },
    { front: "Flash", back: "ปัญหาครีบ/เกิน สาเหตุ: ความดันสูง แรงปิดไม่พอ", category: "defect" },
    { front: "Sink Mark", back: "ปัญหายุบ สาเหตุ: Holding ไม่พอ ผนังหนา", category: "defect" },
    { front: "Warpage", back: "ปัญหาบิดงอ สาเหตุ: เย็นไม่สม่ำเสมอ เครียดภายใน", category: "defect" },
    { front: "Burn Mark", back: "ปัญหาไหม้ สาเหตุ: อากาศค้าง ความเร็ว/อุณหภูมิสูง", category: "defect" },
    { front: "PP (Polypropylene)", back: "พลาสติกราคาถูก ทนเคมี หลอม 200-280°C", category: "material" },
    { front: "ABS", back: "พลาสติกแข็งแรง ชุบโลหะได้ หลอม 220-260°C", category: "material" },
    { front: "PC (Polycarbonate)", back: "พลาสติกใส ทนแรงกระแทก หลอม 280-320°C", category: "material" },
    { front: "Clamping Force", back: "แรงปิดแม่พิมพ์ = พื้นที่ × ความดัน × Safety Factor", category: "calculation" },
  ],
};

/**
 * สร้าง Flashcard Flex Message
 */
function createFlashcardFlex(cardIndex = 0, showAnswer = false) {
  const card = FLASHCARDS.terms[cardIndex];
  if (!card) return null;

  const categoryColors = {
    basic: "#1E40AF",
    parameter: "#7C3AED",
    defect: "#DC2626",
    material: "#059669",
    calculation: "#D97706",
  };

  const categoryNames = {
    basic: "📚 พื้นฐาน",
    parameter: "⚙️ พารามิเตอร์",
    defect: "🔧 ปัญหา",
    material: "🧪 วัสดุ",
    calculation: "🔢 คำนวณ",
  };

  return {
    type: "flex",
    altText: `🃏 Flashcard: ${card.front}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: "🃏", size: "xl", flex: 0 },
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "Flashcard", weight: "bold", size: "md", color: "#FFFFFF" },
              { type: "text", text: `${cardIndex + 1}/${FLASHCARDS.terms.length} - ${categoryNames[card.category]}`, size: "xs", color: "#93C5FD" },
            ],
            paddingStart: "10px",
          },
        ],
        backgroundColor: categoryColors[card.category] || "#1E40AF",
        paddingAll: "15px",
        alignItems: "center",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "❓ คำถาม:", weight: "bold", size: "xs", color: "#666666" },
          { type: "text", text: card.front, weight: "bold", size: "lg", color: "#333333", wrap: true, margin: "sm" },
          ...(showAnswer ? [
            { type: "separator", margin: "lg" },
            { type: "text", text: "✅ คำตอบ:", weight: "bold", size: "xs", color: "#16A34A", margin: "lg" },
            { type: "text", text: card.back, size: "sm", color: "#333333", wrap: true, margin: "sm" },
          ] : []),
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          ...(showAnswer ? [] : [{
            type: "button",
            action: { type: "message", label: "👁️ ดูคำตอบ", text: `/flashcard ${cardIndex} show` },
            style: "primary",
            color: "#16A34A",
            height: "sm",
            flex: 1,
          }]),
          {
            type: "button",
            action: { type: "message", label: "⏭️ การ์ดถัดไป", text: `/flashcard ${(cardIndex + 1) % FLASHCARDS.terms.length}` },
            style: "secondary",
            height: "sm",
            flex: 1,
            margin: showAnswer ? "none" : "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

/**
 * Virtual Lab - จำลองการตั้งค่าพารามิเตอร์
 */
const VIRTUAL_LAB_SCENARIOS = {
  scenario1: {
    id: "scenario1",
    title: "🥤 ผลิตแก้วพลาสติก PP",
    description: "ฝึกตั้งค่าพารามิเตอร์สำหรับผลิตแก้วน้ำพลาสติก PP",
    material: "PP",
    product: "แก้วน้ำ 500ml",
    wallThickness: "1.5 mm",
    targetCycleTime: "12 วินาที",
    optimalSettings: {
      barrelTemp: "220-240°C",
      moldTemp: "30-40°C",
      injectionPressure: "80-100 bar",
      holdingPressure: "50-70 bar",
      injectionSpeed: "50-70%",
      coolingTime: "6-8 วินาที",
    },
    commonProblems: ["Short shot ถ้าอุณหภูมิต่ำ", "Flash ถ้าความดันสูงเกิน", "Warpage ถ้าเย็นไม่สม่ำเสมอ"],
  },
  scenario2: {
    id: "scenario2",
    title: "📱 ผลิตเคสมือถือ ABS",
    description: "ฝึกตั้งค่าพารามิเตอร์สำหรับผลิตเคสมือถือ ABS",
    material: "ABS",
    product: "เคสมือถือ",
    wallThickness: "2 mm",
    targetCycleTime: "25 วินาที",
    optimalSettings: {
      barrelTemp: "230-250°C",
      moldTemp: "50-60°C",
      injectionPressure: "100-120 bar",
      holdingPressure: "60-80 bar",
      injectionSpeed: "60-80%",
      coolingTime: "12-15 วินาที",
    },
    commonProblems: ["Burn mark ถ้าความเร็วสูงเกิน", "Sink mark ที่ส่วนหนา", "Weld line บริเวณรอยบรรจบ"],
  },
  scenario3: {
    id: "scenario3",
    title: "🔩 ผลิตเกียร์พลาสติก POM",
    description: "ฝึกตั้งค่าพารามิเตอร์สำหรับผลิตเกียร์ POM ความแม่นยำสูง",
    material: "POM",
    product: "เกียร์พลาสติก",
    wallThickness: "3 mm",
    targetCycleTime: "35 วินาที",
    optimalSettings: {
      barrelTemp: "190-210°C",
      moldTemp: "80-90°C",
      injectionPressure: "90-110 bar",
      holdingPressure: "70-90 bar",
      injectionSpeed: "40-60%",
      coolingTime: "18-22 วินาที",
    },
    commonProblems: ["Shrinkage สูง ต้องชดเชยในแม่พิมพ์", "Warpage ถ้าเย็นเร็วเกิน", "Void ถ้า holding ไม่พอ"],
  },
};

/**
 * สร้าง Virtual Lab Menu Flex
 */
function createVirtualLabMenuFlex() {
  const scenarioBubbles = Object.values(VIRTUAL_LAB_SCENARIOS).map((scenario) => ({
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: scenario.title, weight: "bold", size: "md", color: "#FFFFFF", wrap: true },
      ],
      backgroundColor: "#7C3AED",
      paddingAll: "15px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: scenario.description, size: "xs", color: "#666666", wrap: true },
        { type: "separator", margin: "md" },
        { type: "text", text: `📦 วัสดุ: ${scenario.material}`, size: "xs", color: "#333333", margin: "md" },
        { type: "text", text: `📐 ความหนา: ${scenario.wallThickness}`, size: "xs", color: "#333333" },
        { type: "text", text: `⏱️ เป้า Cycle: ${scenario.targetCycleTime}`, size: "xs", color: "#333333" },
      ],
      paddingAll: "15px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "message", label: "🔬 เริ่มฝึก", text: `/virtuallab ${scenario.id}` },
          style: "primary",
          color: "#7C3AED",
          height: "sm",
        },
      ],
      paddingAll: "10px",
    },
  }));

  return {
    type: "flex",
    altText: "🔬 Virtual Lab - เลือกสถานการณ์ฝึก",
    contents: {
      type: "carousel",
      contents: scenarioBubbles,
    },
  };
}

/**
 * สร้าง Virtual Lab Scenario Detail Flex
 */
function createVirtualLabScenarioFlex(scenarioId) {
  const scenario = VIRTUAL_LAB_SCENARIOS[scenarioId];
  if (!scenario) return null;

  const settingsItems = Object.entries(scenario.optimalSettings).map(([key, value]) => {
    const labels = {
      barrelTemp: "🌡️ Barrel Temp",
      moldTemp: "🌡️ Mold Temp",
      injectionPressure: "💨 Inj. Pressure",
      holdingPressure: "💨 Hold Pressure",
      injectionSpeed: "🚀 Inj. Speed",
      coolingTime: "❄️ Cooling Time",
    };
    return {
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: labels[key] || key, size: "xs", color: "#666666", flex: 5 },
        { type: "text", text: value, size: "xs", color: "#1E40AF", weight: "bold", flex: 4, align: "end" },
      ],
      margin: "sm",
    };
  });

  return {
    type: "flex",
    altText: `🔬 ${scenario.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🔬 Virtual Lab", weight: "bold", size: "sm", color: "#C4B5FD" },
          { type: "text", text: scenario.title, weight: "bold", size: "lg", color: "#FFFFFF" },
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📋 ข้อมูลงาน:", weight: "bold", size: "sm", color: "#333333" },
          { type: "text", text: `ผลิตภัณฑ์: ${scenario.product}`, size: "xs", color: "#666666", margin: "sm" },
          { type: "text", text: `วัสดุ: ${scenario.material} | หนา: ${scenario.wallThickness}`, size: "xs", color: "#666666" },
          { type: "separator", margin: "lg" },
          { type: "text", text: "⚙️ พารามิเตอร์แนะนำ:", weight: "bold", size: "sm", color: "#333333", margin: "lg" },
          ...settingsItems,
          { type: "separator", margin: "lg" },
          { type: "text", text: "⚠️ ปัญหาที่อาจพบ:", weight: "bold", size: "sm", color: "#DC2626", margin: "lg" },
          ...scenario.commonProblems.map((p) => ({
            type: "text", text: `• ${p}`, size: "xs", color: "#666666", margin: "sm", wrap: true,
          })),
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🧮 คำนวณ Cycle Time", text: `/calculate cycle ${scenario.material} ${scenario.wallThickness}` },
            style: "primary",
            color: "#059669",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "❓ ถาม AI เพิ่มเติม", text: `พี่วิทย์ ช่วยอธิบายการตั้งค่าฉีด ${scenario.material} สำหรับ ${scenario.product} หน่อย` },
            style: "secondary",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * Study Planner - แผนการเรียน
 */
const STUDY_PLANS = {
  beginner7days: {
    id: "beginner7days",
    name: "🌱 แผน 7 วัน สำหรับผู้เริ่มต้น",
    duration: "7 วัน",
    targetLevel: "เข้าใจพื้นฐานการฉีดพลาสติก",
    schedule: [
      { day: 1, topic: "บทที่ 1: พื้นฐานการฉีดพลาสติก", activities: ["อ่านบทเรียน", "ทำ Quiz", "ดู Flashcard"] },
      { day: 2, topic: "บทที่ 2: ชนิดของพลาสติก", activities: ["อ่านบทเรียน", "จำ Flashcard วัสดุ", "ทำ Quiz"] },
      { day: 3, topic: "ทบทวนบท 1-2", activities: ["ทำ Quiz รวม", "ถาม AI สิ่งที่ไม่เข้าใจ"] },
      { day: 4, topic: "บทที่ 3: พารามิเตอร์การฉีด", activities: ["อ่านบทเรียน", "ลอง Virtual Lab"] },
      { day: 5, topic: "บทที่ 4: ปัญหาและการแก้ไข", activities: ["อ่านบทเรียน", "จำ Flashcard ปัญหา"] },
      { day: 6, topic: "บทที่ 5: การคำนวณพื้นฐาน", activities: ["อ่านบทเรียน", "ใช้เครื่องคิดเลข"] },
      { day: 7, topic: "สอบรวม", activities: ["ทบทวนทุกบท", "ทำแบบทดสอบรวม", "รับ Certificate"] },
    ],
  },
  intensive3days: {
    id: "intensive3days",
    name: "⚡ แผน 3 วัน เข้มข้น",
    duration: "3 วัน",
    targetLevel: "ปูพื้นฐานเร็ว",
    schedule: [
      { day: 1, topic: "บท 1-2: พื้นฐาน + วัสดุ", activities: ["อ่านบทเรียน 2 บท", "ทำ Quiz 2 ชุด", "Flashcard 30 นาที"] },
      { day: 2, topic: "บท 3-4: พารามิเตอร์ + ปัญหา", activities: ["อ่านบทเรียน 2 บท", "Virtual Lab", "ถาม AI"] },
      { day: 3, topic: "บท 5 + สอบรวม", activities: ["อ่านบทคำนวณ", "ใช้เครื่องคิดเลข", "สอบรวม"] },
    ],
  },
};

/**
 * สร้าง Study Planner Menu Flex
 */
function createStudyPlannerMenuFlex() {
  const planBubbles = Object.values(STUDY_PLANS).map((plan) => ({
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: plan.name, weight: "bold", size: "md", color: "#FFFFFF", wrap: true },
        { type: "text", text: `⏱️ ${plan.duration}`, size: "xs", color: "#FCD34D" },
      ],
      backgroundColor: "#D97706",
      paddingAll: "15px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: "🎯 เป้าหมาย:", weight: "bold", size: "xs", color: "#666666" },
        { type: "text", text: plan.targetLevel, size: "xs", color: "#333333", wrap: true, margin: "sm" },
        { type: "separator", margin: "md" },
        { type: "text", text: `📅 ${plan.schedule.length} วัน | ${plan.schedule.reduce((sum, d) => sum + d.activities.length, 0)} กิจกรรม`, size: "xs", color: "#666666", margin: "md" },
      ],
      paddingAll: "15px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "message", label: "📋 ดูแผนเรียน", text: `/studyplan ${plan.id}` },
          style: "primary",
          color: "#D97706",
          height: "sm",
        },
      ],
      paddingAll: "10px",
    },
  }));

  return {
    type: "flex",
    altText: "📅 Study Planner - เลือกแผนการเรียน",
    contents: {
      type: "carousel",
      contents: planBubbles,
    },
  };
}

/**
 * สร้าง Study Plan Detail Flex
 */
function createStudyPlanDetailFlex(planId) {
  const plan = STUDY_PLANS[planId];
  if (!plan) return null;

  const dayItems = plan.schedule.map((day) => ({
    type: "box",
    layout: "vertical",
    contents: [
      { type: "text", text: `📅 วันที่ ${day.day}: ${day.topic}`, weight: "bold", size: "xs", color: "#1E40AF", wrap: true },
      ...day.activities.map((act) => ({
        type: "text", text: `  • ${act}`, size: "xs", color: "#666666",
      })),
    ],
    margin: "md",
    paddingAll: "10px",
    backgroundColor: "#F8FAFC",
    cornerRadius: "md",
  }));

  return {
    type: "flex",
    altText: `📅 ${plan.name}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📅 Study Planner", weight: "bold", size: "sm", color: "#FCD34D" },
          { type: "text", text: plan.name, weight: "bold", size: "lg", color: "#FFFFFF", wrap: true },
        ],
        backgroundColor: "#D97706",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `🎯 เป้าหมาย: ${plan.targetLevel}`, size: "sm", color: "#333333", wrap: true },
          { type: "separator", margin: "md" },
          ...dayItems,
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🚀 เริ่มเรียนวันที่ 1", text: `/lesson lesson1` },
            style: "primary",
            color: "#16A34A",
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

// =====================================================
// 📊 PROGRESS TRACKING FUNCTIONS
// =====================================================

/**
 * สร้าง Progress Dashboard Flex
 */
function createProgressDashboardFlex(userProgress) {
  const progress = userProgress || PROGRESS_STRUCTURE;
  const completedLessons = progress.lessonsCompleted?.length || 0;
  const totalLessons = Object.keys(LESSONS).length;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  // หาระดับผู้เรียน
  const currentLevel = Object.entries(LEARNER_LEVELS).find(
    ([_, level]) => progress.totalScore >= level.minScore && progress.totalScore <= level.maxScore,
  );
  const levelInfo = currentLevel ? currentLevel[1] : LEARNER_LEVELS[1];

  // สร้าง badge items
  const earnedBadges = progress.badges?.slice(0, 4) || [];
  const badgeText = earnedBadges.length > 0 ?
    earnedBadges.map((b) => BADGES[b]?.icon || "🏅").join(" ") :
    "🔒 ยังไม่มีเหรียญ";

  return {
    type: "flex",
    altText: "📊 ความก้าวหน้าของคุณ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: "📊", size: "xxl", flex: 0 },
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "ความก้าวหน้าของคุณ", weight: "bold", size: "lg", color: "#FFFFFF" },
              { type: "text", text: levelInfo.name, size: "sm", color: "#93C5FD" },
            ],
            paddingStart: "15px",
          },
        ],
        backgroundColor: "#1E40AF",
        paddingAll: "20px",
        alignItems: "center",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Progress Bar
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: `📚 บทเรียน: ${completedLessons}/${totalLessons}`, size: "sm", color: "#333333" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [],
                    backgroundColor: "#16A34A",
                    width: `${progressPercent}%`,
                    height: "8px",
                  },
                ],
                backgroundColor: "#E5E7EB",
                height: "8px",
                margin: "sm",
                cornerRadius: "md",
              },
            ],
          },
          { type: "separator", margin: "lg" },
          // Stats
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🏆", size: "xl", align: "center" },
                  { type: "text", text: `${progress.totalScore || 0}`, weight: "bold", size: "lg", align: "center", color: "#D97706" },
                  { type: "text", text: "คะแนน", size: "xs", align: "center", color: "#666666" },
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "📝", size: "xl", align: "center" },
                  { type: "text", text: `${progress.quizzesPassed?.length || 0}`, weight: "bold", size: "lg", align: "center", color: "#7C3AED" },
                  { type: "text", text: "Quiz ผ่าน", size: "xs", align: "center", color: "#666666" },
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🔥", size: "xl", align: "center" },
                  { type: "text", text: `${progress.streak || 0}`, weight: "bold", size: "lg", align: "center", color: "#DC2626" },
                  { type: "text", text: "วันต่อเนื่อง", size: "xs", align: "center", color: "#666666" },
                ],
                flex: 1,
              },
            ],
            margin: "lg",
          },
          { type: "separator", margin: "lg" },
          // Badges
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🏅 เหรียญที่ได้รับ:", weight: "bold", size: "sm", color: "#333333" },
              { type: "text", text: badgeText, size: "lg", margin: "sm", align: "center" },
            ],
            margin: "lg",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "📚 เรียนต่อ", text: "/lesson" },
            style: "primary",
            color: "#16A34A",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "🏅 ดูเหรียญทั้งหมด", text: "/badges" },
            style: "secondary",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Badges Gallery Flex
 */
function createBadgesGalleryFlex(earnedBadges = []) {
  const badgeItems = Object.values(BADGES).map((badge) => {
    const isEarned = earnedBadges.includes(badge.id);
    return {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: isEarned ? badge.icon : "🔒", size: "xxl", align: "center" },
        { type: "text", text: badge.name, weight: "bold", size: "xs", align: "center", color: isEarned ? "#333333" : "#999999", wrap: true },
        { type: "text", text: badge.description, size: "xxs", align: "center", color: "#666666", wrap: true, margin: "sm" },
      ],
      width: "100px",
      paddingAll: "10px",
      backgroundColor: isEarned ? "#FEF3C7" : "#F3F4F6",
      cornerRadius: "md",
      margin: "sm",
    };
  });

  // แบ่งเป็น 2 แถว
  const row1 = badgeItems.slice(0, 4);
  const row2 = badgeItems.slice(4, 8);

  return {
    type: "flex",
    altText: "🏅 รางวัลทั้งหมด",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🏅 รางวัลและเหรียญ", weight: "bold", size: "lg", color: "#FFFFFF" },
          { type: "text", text: `ได้รับแล้ว ${earnedBadges.length}/${Object.keys(BADGES).length} เหรียญ`, size: "xs", color: "#FCD34D" },
        ],
        backgroundColor: "#D97706",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: row1,
            justifyContent: "center",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: row2,
            justifyContent: "center",
            margin: "md",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
}

// =====================================================
// 💡 ENHANCED FLEX MESSAGES WITH EXAMPLES
// =====================================================

/**
 * สร้างเมนูเครื่องมือช่วยเรียนพร้อมตัวอย่างคำถาม
 */
function createToolsMenuFlex() {
  return {
    type: "flex",
    altText: "🛠️ เครื่องมือช่วยเรียน",
    contents: {
      type: "carousel",
      contents: [
        // Tool 1: AI Assistant
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🤖 ถาม AI พี่วิทย์", weight: "bold", size: "md", color: "#FFFFFF" },
            ],
            backgroundColor: "#7C3AED",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "ถามได้ทุกเรื่องเกี่ยวกับการฉีดพลาสติก", size: "xs", color: "#666666", wrap: true },
              { type: "separator", margin: "md" },
              { type: "text", text: "💡 ตัวอย่างคำถาม:", weight: "bold", size: "xs", color: "#7C3AED", margin: "md" },
              { type: "text", text: "• ชิ้นงานมี Flash ทำไงดี?", size: "xs", color: "#333333" },
              { type: "text", text: "• PP กับ ABS ต่างกันยังไง?", size: "xs", color: "#333333" },
              { type: "text", text: "• Cooling time คำนวณยังไง?", size: "xs", color: "#333333" },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "💬 ถาม AI", text: "พี่วิทย์ ช่วยอธิบายพื้นฐานการฉีดพลาสติกหน่อย" },
                style: "primary",
                color: "#7C3AED",
                height: "sm",
              },
            ],
            paddingAll: "10px",
          },
        },
        // Tool 2: Flashcards
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🃏 Flashcards", weight: "bold", size: "md", color: "#FFFFFF" },
            ],
            backgroundColor: "#059669",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "ท่องจำคำศัพท์และหลักการสำคัญ", size: "xs", color: "#666666", wrap: true },
              { type: "separator", margin: "md" },
              { type: "text", text: "📚 หมวดหมู่:", weight: "bold", size: "xs", color: "#059669", margin: "md" },
              { type: "text", text: "• พื้นฐาน (Basic)", size: "xs", color: "#333333" },
              { type: "text", text: "• พารามิเตอร์ (Parameters)", size: "xs", color: "#333333" },
              { type: "text", text: "• ปัญหา (Defects)", size: "xs", color: "#333333" },
              { type: "text", text: "• วัสดุ (Materials)", size: "xs", color: "#333333" },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🃏 เริ่มท่องจำ", text: "/flashcard 0" },
                style: "primary",
                color: "#059669",
                height: "sm",
              },
            ],
            paddingAll: "10px",
          },
        },
        // Tool 3: Virtual Lab
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🔬 Virtual Lab", weight: "bold", size: "md", color: "#FFFFFF" },
            ],
            backgroundColor: "#DC2626",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "จำลองการตั้งค่าพารามิเตอร์", size: "xs", color: "#666666", wrap: true },
              { type: "separator", margin: "md" },
              { type: "text", text: "🏭 สถานการณ์ฝึก:", weight: "bold", size: "xs", color: "#DC2626", margin: "md" },
              { type: "text", text: "• ผลิตแก้วพลาสติก PP", size: "xs", color: "#333333" },
              { type: "text", text: "• ผลิตเคสมือถือ ABS", size: "xs", color: "#333333" },
              { type: "text", text: "• ผลิตเกียร์ POM", size: "xs", color: "#333333" },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🔬 เข้า Lab", text: "/virtuallab" },
                style: "primary",
                color: "#DC2626",
                height: "sm",
              },
            ],
            paddingAll: "10px",
          },
        },
        // Tool 4: Study Planner
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "📅 Study Planner", weight: "bold", size: "md", color: "#FFFFFF" },
            ],
            backgroundColor: "#D97706",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "แผนการเรียนที่ออกแบบมาให้", size: "xs", color: "#666666", wrap: true },
              { type: "separator", margin: "md" },
              { type: "text", text: "📋 แผนที่มี:", weight: "bold", size: "xs", color: "#D97706", margin: "md" },
              { type: "text", text: "• แผน 7 วัน ผู้เริ่มต้น", size: "xs", color: "#333333" },
              { type: "text", text: "• แผน 3 วัน เข้มข้น", size: "xs", color: "#333333" },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📅 ดูแผนเรียน", text: "/studyplan" },
                style: "primary",
                color: "#D97706",
                height: "sm",
              },
            ],
            paddingAll: "10px",
          },
        },
        // Tool 5: Calculator
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🧮 เครื่องคิดเลข", weight: "bold", size: "md", color: "#FFFFFF" },
            ],
            backgroundColor: "#1E40AF",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "คำนวณพารามิเตอร์การฉีด", size: "xs", color: "#666666", wrap: true },
              { type: "separator", margin: "md" },
              { type: "text", text: "📐 สูตรที่มี:", weight: "bold", size: "xs", color: "#1E40AF", margin: "md" },
              { type: "text", text: "• Clamping Force", size: "xs", color: "#333333" },
              { type: "text", text: "• Cooling Time", size: "xs", color: "#333333" },
              { type: "text", text: "• Cycle Time", size: "xs", color: "#333333" },
              { type: "text", text: "• Shot Size", size: "xs", color: "#333333" },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🧮 คำนวณ", text: "/calculator" },
                style: "primary",
                color: "#1E40AF",
                height: "sm",
              },
            ],
            paddingAll: "10px",
          },
        },
        // Tool 6: Progress
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "📊 ความก้าวหน้า", weight: "bold", size: "md", color: "#FFFFFF" },
            ],
            backgroundColor: "#16A34A",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "ติดตามการเรียนของคุณ", size: "xs", color: "#666666", wrap: true },
              { type: "separator", margin: "md" },
              { type: "text", text: "📈 ข้อมูลที่แสดง:", weight: "bold", size: "xs", color: "#16A34A", margin: "md" },
              { type: "text", text: "• บทเรียนที่เรียนจบ", size: "xs", color: "#333333" },
              { type: "text", text: "• คะแนนสะสม", size: "xs", color: "#333333" },
              { type: "text", text: "• เหรียญรางวัล", size: "xs", color: "#333333" },
              { type: "text", text: "• ระดับผู้เรียน", size: "xs", color: "#333333" },
            ],
            paddingAll: "15px",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📊 ดูความก้าวหน้า", text: "/progress" },
                style: "primary",
                color: "#16A34A",
                height: "sm",
              },
            ],
            paddingAll: "10px",
          },
        },
      ],
    },
  };
}

// =====================================================
// 🆕 ENHANCED EXAM FUNCTIONS - ฟังก์ชันข้อสอบทรงพลัง
// เชื่อมโยงกับ Teaching System และ TEXTBOOK_TEACHING_PROMPT
// =====================================================

/**
 * สร้างข้อสอบแบบสุ่มตามระดับและจำนวน
 * @param {number} level - ระดับ (0-5)
 * @param {number} count - จำนวนข้อ
 * @returns {Array} - ข้อสอบที่สุ่มมา
 */
function generateRandomExam(level, count = 5) {
  let allQuestions = [];

  // ถ้าระบุ level ให้ดึงจากระดับนั้น
  if (level !== undefined && level !== null && level >= 0 && level <= 5) {
    const levelKey = `level${level}`;
    if (ADVANCED_EXAM_QUESTIONS[levelKey]) {
      allQuestions = [...ADVANCED_EXAM_QUESTIONS[levelKey]];
    }
  } else {
    // ถ้าไม่ระบุ level ให้รวมทุกระดับ
    Object.values(ADVANCED_EXAM_QUESTIONS).forEach(questions => {
      allQuestions = [...allQuestions, ...questions];
    });
  }

  // สุ่มข้อสอบ
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * สร้างข้อสอบผสมจากทุกแหล่ง (QUIZ_QUESTIONS + ADVANCED_EXAM_QUESTIONS)
 * @param {number} count - จำนวนข้อ
 * @returns {Array} - ข้อสอบผสม
 */
function generateMixedExam(count = 10) {
  let allQuestions = [];

  // เพิ่มจาก QUIZ_QUESTIONS (พื้นฐาน)
  Object.values(QUIZ_QUESTIONS).forEach(q => {
    allQuestions.push({
      ...q,
      source: 'basic',
      level: 1 // พื้นฐาน
    });
  });

  // เพิ่มจาก ADVANCED_EXAM_QUESTIONS (ขั้นสูง)
  Object.entries(ADVANCED_EXAM_QUESTIONS).forEach(([levelKey, questions]) => {
    questions.forEach(q => {
      allQuestions.push({
        ...q,
        source: 'advanced'
      });
    });
  });

  // สุ่มและคืนค่า
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * สร้างข้อสอบตามหัวข้อ (EXAM_TOPICS)
 * @param {string} topicKey - หัวข้อ (basic, parameters, defects, calculation, advanced)
 * @param {number} count - จำนวนข้อ
 * @returns {Array} - ข้อสอบตามหัวข้อ
 */
function generateExamByTopic(topicKey, count = 5) {
  const topicMapping = {
    basic: [0, 1],
    parameters: [2, 3],
    defects: [4],
    calculation: [3],
    advanced: [5]
  };

  const levels = topicMapping[topicKey] || [0, 1, 2, 3, 4, 5];
  let allQuestions = [];

  levels.forEach(level => {
    const levelKey = `level${level}`;
    if (ADVANCED_EXAM_QUESTIONS[levelKey]) {
      allQuestions = [...allQuestions, ...ADVANCED_EXAM_QUESTIONS[levelKey]];
    }
  });

  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * สร้าง Flex Message สำหรับเมนูข้อสอบขั้นสูง
 */
function createAdvancedExamMenuFlex() {
  return {
    type: "flex",
    altText: "🎯 ข้อสอบขั้นสูง - เลือกประเภทข้อสอบ",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🎯 ข้อสอบขั้นสูง", weight: "bold", size: "xl", color: "#FFFFFF" },
          { type: "text", text: "เชื่อมโยงกับหลักสูตร IMT Thailand", size: "xs", color: "#E0E0E0" }
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📊 เลือกประเภทข้อสอบ:", weight: "bold", size: "md", margin: "md" },
          { type: "separator", margin: "md" },
          // Level-based
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "Level 0", text: "/exam level 0" },
                style: "secondary",
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "Level 1", text: "/exam level 1" },
                style: "secondary",
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "Level 2", text: "/exam level 2" },
                style: "secondary",
                height: "sm",
                flex: 1
              }
            ],
            margin: "md",
            spacing: "sm"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "Level 3", text: "/exam level 3" },
                style: "secondary",
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "Level 4", text: "/exam level 4" },
                style: "secondary",
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "Level 5", text: "/exam level 5" },
                style: "secondary",
                height: "sm",
                flex: 1
              }
            ],
            margin: "sm",
            spacing: "sm"
          },
          { type: "separator", margin: "lg" },
          { type: "text", text: "📝 ตามหัวข้อ:", weight: "bold", size: "sm", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "📚 พื้นฐาน (Basic)", text: "/exam topic basic" },
                style: "secondary",
                height: "sm"
              },
              {
                type: "button",
                action: { type: "message", label: "⚙️ พารามิเตอร์ (Parameters)", text: "/exam topic parameters" },
                style: "secondary",
                height: "sm"
              },
              {
                type: "button",
                action: { type: "message", label: "🔧 ปัญหา/แก้ไข (Defects)", text: "/exam topic defects" },
                style: "secondary",
                height: "sm"
              }
            ],
            margin: "sm",
            spacing: "xs"
          },
          { type: "separator", margin: "lg" },
          { type: "text", text: "🏆 ข้อสอบพิเศษ:", weight: "bold", size: "sm", margin: "md" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🔄 ข้อสอบผสม 10 ข้อ", text: "/exam mixed 10" },
                style: "primary",
                color: "#7C3AED",
                height: "sm"
              },
              {
                type: "button",
                action: { type: "message", label: "🏭 กรณีศึกษา (Case Study)", text: "/exam case" },
                style: "primary",
                color: "#DC2626",
                height: "sm"
              }
            ],
            margin: "sm",
            spacing: "xs"
          }
        ],
        paddingAll: "15px"
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับข้อสอบข้อเดียว
 * @param {Object} question - ข้อสอบ
 * @param {number} currentIndex - ข้อปัจจุบัน
 * @param {number} totalCount - จำนวนข้อทั้งหมด
 */
function createAdvancedQuizFlex(question, currentIndex, totalCount) {
  const levelColors = {
    0: "#10B981", // เขียว - Mindset
    1: "#3B82F6", // ฟ้า - เครื่องจักร
    2: "#8B5CF6", // ม่วง - วัสดุ
    3: "#F59E0B", // ส้ม - กระบวนการ
    4: "#EF4444", // แดง - แก้ปัญหา
    5: "#1F2937"  // เทาดำ - ขั้นสูง
  };

  const levelNames = {
    0: "Mindset พื้นฐาน",
    1: "เครื่องจักร",
    2: "ความรู้วัสดุ",
    3: "กระบวนการฉีด",
    4: "แก้ปัญหา",
    5: "เทคนิคขั้นสูง"
  };

  const color = levelColors[question.level] || "#7C3AED";
  const levelName = levelNames[question.level] || "ทั่วไป";

  const optionButtons = question.options.map((opt, idx) => ({
    type: "button",
    action: {
      type: "message",
      label: opt.substring(0, 40), // จำกัดความยาว
      text: `/answer ${question.id} ${String.fromCharCode(65 + idx)}`
    },
    style: "secondary",
    height: "sm",
    margin: "sm"
  }));

  return {
    type: "flex",
    altText: `📝 ข้อสอบ ${currentIndex}/${totalCount}: ${question.question.substring(0, 30)}...`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: `📝 ข้อที่ ${currentIndex}/${totalCount}`, weight: "bold", size: "md", color: "#FFFFFF", flex: 0 },
              { type: "filler" },
              { type: "text", text: `Level ${question.level}`, size: "xs", color: "#E0E0E0", align: "end", flex: 0 }
            ]
          },
          { type: "text", text: levelName, size: "xs", color: "#E0E0E0" }
        ],
        backgroundColor: color,
        paddingAll: "15px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: question.question, weight: "bold", size: "md", wrap: true, color: "#333333" },
          { type: "text", text: `📌 หัวข้อ: ${question.topic || "ทั่วไป"}`, size: "xs", color: "#666666", margin: "md" },
          { type: "separator", margin: "lg" },
          ...optionButtons
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "⏭️ ข้าม", text: `/skip ${question.id}` },
            style: "secondary",
            height: "sm",
            flex: 1
          },
          {
            type: "button",
            action: { type: "message", label: "🏠 กลับเมนู", text: "/examMenu" },
            style: "secondary",
            height: "sm",
            flex: 1
          }
        ],
        spacing: "sm",
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับผลลัพธ์คำตอบ
 * @param {Object} question - ข้อสอบ
 * @param {string} userAnswer - คำตอบของผู้ใช้
 * @param {boolean} isCorrect - ถูกหรือผิด
 */
function createAdvancedAnswerResultFlex(question, userAnswer, isCorrect) {
  const color = isCorrect ? "#10B981" : "#EF4444";
  const icon = isCorrect ? "✅" : "❌";
  const title = isCorrect ? "ถูกต้อง! 🎉" : "ไม่ถูกต้อง 😅";

  return {
    type: "flex",
    altText: `${icon} ${title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `${icon} ${title}`, weight: "bold", size: "xl", color: "#FFFFFF", align: "center" }
        ],
        backgroundColor: color,
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `📝 ${question.question}`, weight: "bold", size: "sm", wrap: true, color: "#333333" },
          { type: "separator", margin: "md" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "คำตอบของคุณ:", size: "xs", color: "#666666", flex: 0 },
              { type: "text", text: userAnswer, weight: "bold", size: "sm", color: isCorrect ? "#10B981" : "#EF4444", align: "end" }
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "เฉลย:", size: "xs", color: "#666666", flex: 0 },
              { type: "text", text: question.answer, weight: "bold", size: "sm", color: "#10B981", align: "end" }
            ],
            margin: "sm"
          },
          { type: "separator", margin: "md" },
          { type: "text", text: "💡 อธิบาย:", weight: "bold", size: "sm", color: "#7C3AED", margin: "md" },
          { type: "text", text: question.explanation, size: "xs", wrap: true, color: "#333333", margin: "sm" },
          { type: "text", text: `📌 หัวข้อ: ${question.topic || "ทั่วไป"}`, size: "xs", color: "#666666", margin: "md" }
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "➡️ ข้อถัดไป", text: "/nextQuestion" },
            style: "primary",
            color: "#7C3AED",
            height: "sm",
            flex: 1
          },
          {
            type: "button",
            action: { type: "message", label: "🏠 เมนู", text: "/examMenu" },
            style: "secondary",
            height: "sm",
            flex: 1
          }
        ],
        spacing: "sm",
        paddingAll: "10px"
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับกรณีศึกษา (Case Study)
 * @param {Object} caseStudy - กรณีศึกษา
 */
function createCaseStudyFlex(caseStudy) {
  return {
    type: "flex",
    altText: `🏭 ${caseStudy.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: caseStudy.title, weight: "bold", size: "lg", color: "#FFFFFF", wrap: true }
        ],
        backgroundColor: "#DC2626",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📋 สถานการณ์:", weight: "bold", size: "md", color: "#DC2626" },
          { type: "text", text: caseStudy.scenario, size: "sm", wrap: true, color: "#333333", margin: "sm" },
          { type: "separator", margin: "lg" },
          { type: "text", text: `❓ ${caseStudy.questions[0].q}`, weight: "bold", size: "sm", wrap: true, color: "#333333", margin: "md" },
          ...caseStudy.questions[0].options.map((opt, idx) => ({
            type: "button",
            action: {
              type: "message",
              label: opt.substring(0, 40),
              text: `/caseAnswer ${caseStudy.id} 0 ${String.fromCharCode(65 + idx)}`
            },
            style: "secondary",
            height: "sm",
            margin: "sm"
          }))
        ],
        paddingAll: "15px"
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับเมนูกรณีศึกษาทั้งหมด
 */
function createCaseStudyMenuFlex() {
  const caseBubbles = CASE_STUDY_EXAMS.map(caseStudy => ({
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: caseStudy.title, weight: "bold", size: "sm", color: "#FFFFFF", wrap: true }
      ],
      backgroundColor: "#DC2626",
      paddingAll: "15px"
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: caseStudy.scenario.substring(0, 80) + "...", size: "xs", wrap: true, color: "#666666" }
      ],
      paddingAll: "10px"
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          action: { type: "message", label: "▶️ เริ่มทำ", text: `/case ${caseStudy.id}` },
          style: "primary",
          color: "#DC2626",
          height: "sm"
        }
      ],
      paddingAll: "10px"
    }
  }));

  return {
    type: "flex",
    altText: "🏭 กรณีศึกษา (Case Study)",
    contents: {
      type: "carousel",
      contents: caseBubbles
    }
  };
}

/**
 * สร้าง Flex Message สรุปผลข้อสอบ
 * @param {Object} examResult - ผลการสอบ
 */
function createExamSummaryFlex(examResult) {
  const { correct, total, percentage, level, timeTaken } = examResult;

  let grade, gradeColor, message;
  if (percentage >= 90) {
    grade = "A"; gradeColor = "#10B981"; message = "🏆 ยอดเยี่ยม! คุณเชี่ยวชาญมาก!";
  } else if (percentage >= 80) {
    grade = "B"; gradeColor = "#3B82F6"; message = "✨ ดีมาก! พร้อมขึ้น Level ถัดไป";
  } else if (percentage >= 70) {
    grade = "C"; gradeColor = "#F59E0B"; message = "👍 ผ่านเกณฑ์! ทบทวนเพิ่มอีกนิด";
  } else if (percentage >= 60) {
    grade = "D"; gradeColor = "#EF4444"; message = "📚 ต้องทบทวนเนื้อหาเพิ่ม";
  } else {
    grade = "F"; gradeColor = "#DC2626"; message = "💪 อย่าท้อ! กลับไปเรียนใหม่";
  }

  return {
    type: "flex",
    altText: `📊 สรุปผลข้อสอบ: ${correct}/${total} (${percentage}%)`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📊 สรุปผลข้อสอบ", weight: "bold", size: "xl", color: "#FFFFFF", align: "center" },
          { type: "text", text: level ? `Level ${level}` : "ข้อสอบผสม", size: "sm", color: "#E0E0E0", align: "center" }
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: grade, weight: "bold", size: "4xl", color: gradeColor, align: "center" },
                  { type: "text", text: "เกรด", size: "xs", color: "#666666", align: "center" }
                ],
                flex: 1
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: `${percentage}%`, weight: "bold", size: "3xl", color: "#333333", align: "center" },
                  { type: "text", text: `${correct}/${total} ข้อ`, size: "sm", color: "#666666", align: "center" }
                ],
                flex: 1
              }
            ],
            paddingAll: "15px"
          },
          { type: "separator", margin: "md" },
          { type: "text", text: message, weight: "bold", size: "md", wrap: true, color: gradeColor, margin: "lg", align: "center" },
          timeTaken ? { type: "text", text: `⏱️ ใช้เวลา: ${timeTaken} นาที`, size: "xs", color: "#666666", margin: "md", align: "center" } : { type: "filler" }
        ],
        paddingAll: "15px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🔄 ทำข้อสอบใหม่", text: "/examMenu" },
            style: "primary",
            color: "#7C3AED",
            height: "sm"
          },
          {
            type: "button",
            action: { type: "message", label: "📖 กลับไปเรียน", text: "/learn" },
            style: "secondary",
            height: "sm",
            margin: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
}

/**
 * ดึงข้อสอบกรณีศึกษาตาม ID
 * @param {string} caseId - ID ของกรณีศึกษา
 */
function getCaseStudyById(caseId) {
  return CASE_STUDY_EXAMS.find(c => c.id === caseId);
}

/**
 * ดึงข้อสอบตาม ID จากทุกแหล่ง
 * @param {string} questionId - ID ของข้อสอบ
 */
function getQuestionById(questionId) {
  // ค้นหาจาก QUIZ_QUESTIONS ก่อน
  if (QUIZ_QUESTIONS[questionId]) {
    return { ...QUIZ_QUESTIONS[questionId], id: questionId, source: 'basic' };
  }

  // ค้นหาจาก ADVANCED_EXAM_QUESTIONS
  for (const [levelKey, questions] of Object.entries(ADVANCED_EXAM_QUESTIONS)) {
    const found = questions.find(q => q.id === questionId);
    if (found) {
      return { ...found, source: 'advanced' };
    }
  }

  return null;
}

/**
 * ตรวจคำตอบและคืนค่าผลลัพธ์
 * @param {string} questionId - ID ข้อสอบ
 * @param {string} userAnswer - คำตอบผู้ใช้ (A, B, C, D)
 */
function checkAnswer(questionId, userAnswer) {
  const question = getQuestionById(questionId);
  if (!question) {
    return { success: false, error: "ไม่พบข้อสอบ" };
  }

  const isCorrect = userAnswer.toUpperCase() === question.answer.toUpperCase();

  return {
    success: true,
    question,
    userAnswer: userAnswer.toUpperCase(),
    isCorrect,
    explanation: question.explanation
  };
}

// =====================================================
// 📤 EXPORTS
// =====================================================

module.exports = {
  // Data
  LESSONS,
  QUIZ_QUESTIONS,
  EXAM_TOPICS,
  FAQ,
  BADGES,
  LEARNER_LEVELS,
  PROGRESS_STRUCTURE,
  FLASHCARDS,
  VIRTUAL_LAB_SCENARIOS,
  STUDY_PLANS,

  // 🆕 Enhanced Exam Data
  ADVANCED_EXAM_QUESTIONS,
  CASE_STUDY_EXAMS,

  // AI Functions
  getInjectionMoldingPrompt,
  askInjectionMoldingAI,
  isInjectionMoldingQuestion,

  // Original Flex Functions
  createStudentMenuFlex,
  createLessonListFlex,
  createLessonContentFlex,
  createQuizQuestionFlex,
  createAnswerResultFlex,
  createExamPrepFlex,
  createFAQFlex,
  createQuizResultFlex,

  // New Interactive Tools
  createFlashcardFlex,
  createVirtualLabMenuFlex,
  createVirtualLabScenarioFlex,
  createStudyPlannerMenuFlex,
  createStudyPlanDetailFlex,

  // Progress Tracking
  createProgressDashboardFlex,
  createBadgesGalleryFlex,

  // Tools Menu
  createToolsMenuFlex,

  // 🆕 Enhanced Exam Functions
  generateRandomExam,
  generateMixedExam,
  generateExamByTopic,
  createAdvancedExamMenuFlex,
  createAdvancedQuizFlex,
  createAdvancedAnswerResultFlex,
  createCaseStudyFlex,
  createCaseStudyMenuFlex,
  createExamSummaryFlex,
  getCaseStudyById,
  getQuestionById,
  checkAnswer,
};
