console.log("");/**
 * 🎯 ADAPTIVE QUIZ QUESTIONS
 * คำถามแบบมีระดับความยาก (Beginner → Intermediate → Advanced → Expert)
 */

const ADAPTIVE_QUIZ_QUESTIONS = {
  // ========================================
  // 🌱 BEGINNER LEVEL
  // ========================================
  "adp_b1": {
    id: "adp_b1",
    difficulty: "beginner",
    lesson: "injection_basics",
    question: "อุปกรณ์หลักในเครื่องฉีดพลาสติกที่ใช้หลอมพลาสติกคืออะไร?",
    options: ["A. Clamping Unit", "B. Barrel & Screw", "C. Mold", "D. Hydraulic System"],
    answer: "B",
    explanation: "Barrel & Screw ทำหน้าที่หลอมเม็ดพลาสติกด้วยความร้อนและแรงเสียดทาน",
    timeLimit: 60,
    tags: ["basics", "equipment"],
  },

  "adp_b2": {
    id: "adp_b2",
    difficulty: "beginner",
    lesson: "injection_basics",
    question: "หน่วยวัดความดันในเครื่องฉีดพลาสติกคืออะไร?",
    options: ["A. Pascal", "B. Bar", "C. kg/cm²", "D. ถูกทุกข้อ"],
    answer: "D",
    explanation: "ทุกหน่วยใช้วัดความดันได้ โดย Bar และ kg/cm² นิยมใช้ในอุตสาหกรรม",
    timeLimit: 60,
    tags: ["basics", "pressure"],
  },

  "adp_b3": {
    id: "adp_b3",
    difficulty: "beginner",
    lesson: "injection_basics",
    question: "ขั้นตอนแรกของกระบวนการฉีดพลาสติกคืออะไร?",
    options: ["A. Injection", "B. Packing", "C. Cooling", "D. Mold Closing"],
    answer: "D",
    explanation: "ต้องปิดแม่พิมพ์ (Mold Closing) ก่อน จึงจะฉีดได้",
    timeLimit: 60,
    tags: ["basics", "process"],
  },

  // ========================================
  // ⭐ INTERMEDIATE LEVEL
  // ========================================
  "adp_i1": {
    id: "adp_i1",
    difficulty: "intermediate",
    lesson: "defect_analysis",
    question: "ถ้าชิ้นงานเกิด Short Shot (พลาสติกไม่เต็มโพรง) สาเหตุที่เป็นไปได้มากที่สุดคืออะไร?",
    options: [
      "A. ความดันฉีดต่ำเกินไป",
      "B. อุณหภูมิหลอมต่ำเกินไป",
      "C. Runner และ Gate เล็กเกินไป",
      "D. ถูกทุกข้อ",
    ],
    answer: "D",
    explanation: "Short Shot เกิดจากปัจจัยหลายอย่าง: ความดันต่ำ อุณหภูมิต่ำ หรือ runner/gate ไม่เหมาะสม",
    timeLimit: 45,
    tags: ["defects", "troubleshooting"],
  },

  "adp_i2": {
    id: "adp_i2",
    difficulty: "intermediate",
    lesson: "parameters",
    question: "V/P Switchover (จุดเปลี่ยนจาก Velocity เป็น Pressure) ควรตั้งที่เท่าไหร่?",
    options: [
      "A. 50-60% ของโพรง",
      "B. 70-80% ของโพรง",
      "C. 90-95% ของโพรง",
      "D. 100% ของโพรง",
    ],
    answer: "C",
    explanation: "V/P Switchover ควรอยู่ที่ 90-95% เพื่อให้มีเวลา Pack ชิ้นงานอย่างเหมาะสม",
    timeLimit: 45,
    tags: ["parameters", "injection"],
  },

  "adp_i3": {
    id: "adp_i3",
    difficulty: "intermediate",
    lesson: "material_properties",
    question: "PP (Polypropylene) มี Shrinkage Rate โดยเฉลี่ยประมาณเท่าไหร่?",
    options: ["A. 0.3-0.5%", "B. 0.5-1.0%", "C. 1.0-2.0%", "D. 2.0-3.0%"],
    answer: "C",
    explanation: "PP มี Shrinkage Rate ประมาณ 1.0-2.0% ซึ่งสูงกว่าพลาสติกทั่วไป",
    timeLimit: 45,
    tags: ["materials", "properties"],
  },

  // ========================================
  // 🔥 ADVANCED LEVEL
  // ========================================
  "adp_a1": {
    id: "adp_a1",
    difficulty: "advanced",
    lesson: "advanced_molding",
    question: "ในกรณีที่ทำ Gas-Assisted Injection Molding ก๊าซจะถูกฉีดเข้าไปในช่วงใด?",
    options: [
      "A. ก่อนฉีดพลาสติก",
      "B. พร้อมกับการฉีดพลาสติก",
      "C. หลังจากฉีดพลาสติกเสร็จ แต่ก่อน Packing",
      "D. ในช่วง Packing",
    ],
    answer: "C",
    explanation: "Gas จะถูกฉีดหลังฉีดพลาสติกเสร็จ (90-95%) แต่ก่อน Packing เพื่อดันพลาสติกให้เต็มโพรง",
    timeLimit: 30,
    tags: ["advanced", "gas_assisted"],
  },

  "adp_a2": {
    id: "adp_a2",
    difficulty: "advanced",
    lesson: "mold_design",
    question: "ถ้าต้องการลด Weld Line ในชิ้นงานที่มี Gate 2 จุด ควรทำอย่างไร?",
    options: [
      "A. เพิ่มอุณหภูมิแม่พิมพ์",
      "B. เพิ่มความเร็วการฉีด",
      "C. ลด Gate Size",
      "D. A และ B ถูก",
    ],
    answer: "D",
    explanation: "เพิ่มอุณหภูมิแม่พิมพ์และความเร็วฉีดจะทำให้พลาสติกร้อนกว่า เชื่อมดีขึ้น ลด Weld Line",
    timeLimit: 30,
    tags: ["advanced", "defects", "weld_line"],
  },

  "adp_a3": {
    id: "adp_a3",
    difficulty: "advanced",
    lesson: "process_control",
    question: "ในกรณีที่ชิ้นงานมีปัญหา Warpage จากการ Shrinkage ไม่สม่ำเสมอ วิธีแก้ที่ดีที่สุดคือ?",
    options: [
      "A. เพิ่ม Holding Pressure และ Holding Time",
      "B. ลดอุณหภูมิหลอม",
      "C. ปรับ Gate Location ให้สมดุล",
      "D. A และ C ถูก",
    ],
    answer: "D",
    explanation: "เพิ่ม Holding Pressure/Time และปรับ Gate Location จะช่วยให้ Shrinkage สม่ำเสมอ ลด Warpage",
    timeLimit: 30,
    tags: ["advanced", "warpage", "process_control"],
  },

  // ========================================
  // 👑 EXPERT LEVEL
  // ========================================
  "adp_e1": {
    id: "adp_e1",
    difficulty: "expert",
    lesson: "scientific_molding",
    question: "ในหลักการ Scientific Molding การหา Viscosity Curve ของ Material ใช้เพื่ออะไร?",
    options: [
      "A. หา Optimal Fill Speed",
      "B. กำหนด Process Window",
      "C. คำนวณ Injection Pressure",
      "D. ทั้งหมดถูก",
    ],
    answer: "D",
    explanation: "Viscosity Curve ใช้ทั้งหา Fill Speed, กำหนด Process Window, และคำนวณ Pressure ที่เหมาะสม",
    timeLimit: 20,
    tags: ["expert", "scientific_molding", "viscosity"],
  },

  "adp_e2": {
    id: "adp_e2",
    difficulty: "expert",
    lesson: "cavity_pressure",
    question: "Cavity Pressure Curve แบบ Over-Pack จะมีลักษณะอย่างไร?",
    options: [
      "A. Peak Pressure ต่ำ แล้วลดลงเรื่อยๆ",
      "B. Peak Pressure สูง แล้ว Hold Pressure ขึ้นอีก",
      "C. Peak Pressure สูง แล้วคงที่ตลอด",
      "D. Pressure Spike ขึ้นลงเป็นจังหวะ",
    ],
    answer: "B",
    explanation: "Over-Pack จะเห็น Peak Pressure สูง และ Hold Pressure ยังดันขึ้นอีก เพราะ Pack มากเกินไป",
    timeLimit: 20,
    tags: ["expert", "cavity_pressure", "scientific_molding"],
  },

  "adp_e3": {
    id: "adp_e3",
    difficulty: "expert",
    lesson: "rheology",
    question: "ค่า Melt Flow Index (MFI) สูง หมายความว่าอย่างไร?",
    options: [
      "A. Viscosity สูง, ไหลยาก",
      "B. Viscosity ต่ำ, ไหลง่าย",
      "C. Molecular Weight สูง",
      "D. Crystallinity สูง",
    ],
    answer: "B",
    explanation: "MFI สูง = Viscosity ต่ำ = ไหลง่าย (Molecular Weight ต่ำ) เหมาะกับชิ้นงานบาง",
    timeLimit: 20,
    tags: ["expert", "rheology", "mfi"],
  },
};

module.exports = {
  ADAPTIVE_QUIZ_QUESTIONS,
};
