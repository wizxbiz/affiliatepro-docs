/**
 * 🎓 WiT AI - Education Hub (ศูนย์การศึกษาครบวงจร)
 * ระบบการศึกษาสำหรับทุกระดับ: ประถม-มัธยม-ปริญญาตรี-อาชีวะ
 * * @author WiT AI System
 * @version 1.0.0
 * @created 2025-12-10
 */

// =====================================================
// 📚 EDUCATION LEVELS - ระดับการศึกษา
// =====================================================

const EDUCATION_LEVELS = {
  primary: {
    id: "primary",
    name: "🎒 ประถมศึกษา",
    nameEn: "Primary School",
    grades: ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"],
    color: "#EC4899",
    icon: "🎒",
  },
  secondary: {
    id: "secondary",
    name: "📖 มัธยมศึกษา",
    nameEn: "Secondary School",
    grades: ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"],
    color: "#8B5CF6",
    icon: "📖",
  },
  vocational: {
    id: "vocational",
    name: "🔧 อาชีวศึกษา",
    nameEn: "Vocational Education",
    grades: ["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"],
    color: "#F59E0B",
    icon: "🔧",
  },
  university: {
    id: "university",
    name: "🎓 ปริญญาตรี",
    nameEn: "University",
    grades: ["ปี 1", "ปี 2", "ปี 3", "ปี 4"],
    color: "#3B82F6",
    icon: "🎓",
  },
};

// =====================================================
// 📖 SUBJECTS - วิชาเรียน
// =====================================================

const SUBJECTS = {
  // === วิชาสามัญ (ทุกระดับ) ===
  thai: {
    id: "thai",
    name: "ภาษาไทย",
    nameEn: "Thai Language",
    icon: "🇹🇭",
    levels: ["primary", "secondary"],
    category: "core",
  },
  math: {
    id: "math",
    name: "คณิตศาสตร์",
    nameEn: "Mathematics",
    icon: "🔢",
    levels: ["primary", "secondary", "vocational", "university"],
    category: "core",
  },
  science: {
    id: "science",
    name: "วิทยาศาสตร์",
    nameEn: "Science",
    icon: "🔬",
    levels: ["primary", "secondary"],
    category: "core",
  },
  social: {
    id: "social",
    name: "สังคมศึกษา",
    nameEn: "Social Studies",
    icon: "🌏",
    levels: ["primary", "secondary"],
    category: "core",
  },
  english: {
    id: "english",
    name: "ภาษาอังกฤษ",
    nameEn: "English",
    icon: "🇬🇧",
    levels: ["primary", "secondary", "vocational", "university"],
    category: "core",
  },

  // === วิชาเฉพาะทาง (มัธยม-ปริญญาตรี) ===
  physics: {
    id: "physics",
    name: "ฟิสิกส์",
    nameEn: "Physics",
    icon: "⚡",
    levels: ["secondary", "university"],
    category: "advanced",
  },
  chemistry: {
    id: "chemistry",
    name: "เคมี",
    nameEn: "Chemistry",
    icon: "⚗️",
    levels: ["secondary", "university"],
    category: "advanced",
  },
  biology: {
    id: "biology",
    name: "ชีววิทยา",
    nameEn: "Biology",
    icon: "🧬",
    levels: ["secondary", "university"],
    category: "advanced",
  },

  // === สายอาชีวะ ===
  mechanical: {
    id: "mechanical",
    name: "ช่างกลโรงงาน",
    nameEn: "Mechanical Engineering",
    icon: "⚙️",
    levels: ["vocational"],
    category: "vocational",
  },
  electrical: {
    id: "electrical",
    name: "ช่างไฟฟ้า",
    nameEn: "Electrical Engineering",
    icon: "💡",
    levels: ["vocational"],
    category: "vocational",
  },
  electronics: {
    id: "electronics",
    name: "ช่างอิเล็กทรอนิกส์",
    nameEn: "Electronics",
    icon: "📡",
    levels: ["vocational"],
    category: "vocational",
  },
  automotive: {
    id: "automotive",
    name: "ช่างยนต์",
    nameEn: "Automotive",
    icon: "🚗",
    levels: ["vocational"],
    category: "vocational",
  },
  construction: {
    id: "construction",
    name: "ช่างก่อสร้าง",
    nameEn: "Construction",
    icon: "🏗️",
    levels: ["vocational"],
    category: "vocational",
  },
  computerTech: {
    id: "computerTech",
    name: "คอมพิวเตอร์",
    nameEn: "Computer Technology",
    icon: "💻",
    levels: ["vocational", "university"],
    category: "vocational",
  },
  accounting: {
    id: "accounting",
    name: "การบัญชี",
    nameEn: "Accounting",
    icon: "📊",
    levels: ["vocational", "university"],
    category: "vocational",
  },

  // === ปริญญาตรี ===
  engineering: {
    id: "engineering",
    name: "วิศวกรรมศาสตร์",
    nameEn: "Engineering",
    icon: "👷",
    levels: ["university"],
    category: "university",
    subcategories: ["mechanical", "electrical", "civil", "industrial", "chemical"],
  },
  business: {
    id: "business",
    name: "บริหารธุรกิจ",
    nameEn: "Business Administration",
    icon: "💼",
    levels: ["university"],
    category: "university",
  },
  programming: {
    id: "programming",
    name: "วิทยาการคอมพิวเตอร์",
    nameEn: "Computer Science",
    icon: "👨‍💻",
    levels: ["university"],
    category: "university",
  },
};

// =====================================================
// 📚 COURSE CONTENT - เนื้อหาหลักสูตร
// =====================================================

// 🎯 ระดับความยากสำหรับแต่ละชั้นปี
const GRADE_DIFFICULTY = {
  "ป.1": {level: 1, ageRange: "6-7 ปี", complexity: "เริ่มต้น", vocabLimit: 50},
  "ป.2": {level: 2, ageRange: "7-8 ปี", complexity: "พื้นฐาน", vocabLimit: 100},
  "ป.3": {level: 3, ageRange: "8-9 ปี", complexity: "พื้นฐาน+", vocabLimit: 150},
  "ป.4": {level: 4, ageRange: "9-10 ปี", complexity: "กลาง", vocabLimit: 200},
  "ป.5": {level: 5, ageRange: "10-11 ปี", complexity: "กลาง+", vocabLimit: 300},
  "ป.6": {level: 6, ageRange: "11-12 ปี", complexity: "ท้าทาย", vocabLimit: 400},
};

const COURSES = {
  // ==================== ประถมศึกษา ป.1 ====================
  primary_math_p1: {
    id: "primary_math_p1",
    level: "primary",
    grade: "ป.1",
    subject: "math",
    title: "🔢 คณิตศาสตร์ ป.1",
    difficulty: GRADE_DIFFICULTY["ป.1"],
    units: [
      {id: "unit1", title: "การนับและจำนวน 1-20", topics: ["นับ 1-10", "นับ 11-20", "เปรียบเทียบจำนวน", "จำนวนเพิ่มขึ้น-ลดลง"]},
      {id: "unit2", title: "การบวก-ลบ ภายใน 20", topics: ["บวกภายใน 10", "ลบภายใน 10", "บวกภายใน 20", "ลบภายใน 20"]},
      {id: "unit3", title: "รูปทรงเรขาคณิต", topics: ["วงกลม", "สี่เหลี่ยม", "สามเหลี่ยม", "จัดหมวดหมู่รูปทรง"]},
    ],
  },
  primary_thai_p1: {
    id: "primary_thai_p1",
    level: "primary",
    grade: "ป.1",
    subject: "thai",
    title: "📜 ภาษาไทย ป.1",
    difficulty: GRADE_DIFFICULTY["ป.1"],
    units: [
      {id: "unit1", title: "พยัญชนะไทย", topics: ["ก-ฮ", "รูปพยัญชนะ", "เสียงพยัญชนะ", "การเขียนพยัญชนะ"]},
      {id: "unit2", title: "สระไทย", topics: ["สระเดี่ยว", "สระประสม", "การผสมสระและพยัญชนะ"]},
      {id: "unit3", title: "การอ่านคำง่ายๆ", topics: ["อ่านคำ 1 พยางค์", "อ่านคำ 2 พยางค์", "ประโยคสั้นๆ"]},
    ],
  },
  primary_english_p1: {
    id: "primary_english_p1",
    level: "primary",
    grade: "ป.1",
    subject: "english",
    title: "🇬🇧 ภาษาอังกฤษ ป.1",
    difficulty: GRADE_DIFFICULTY["ป.1"],
    units: [
      {id: "unit1", title: "Alphabet A-Z", topics: ["ตัวพิมพ์ใหญ่ A-Z", "ตัวพิมพ์เล็ก a-z", "การออกเสียง", "เขียน ABC"]},
      {id: "unit2", title: "Greetings", topics: ["Hello", "Goodbye", "Thank you", "Please"]},
      {id: "unit3", title: "Colors & Numbers", topics: ["สี 8 สี", "ตัวเลข 1-10", "How many?", "What color?"]},
    ],
  },
  primary_science_p1: {
    id: "primary_science_p1",
    level: "primary",
    grade: "ป.1",
    subject: "science",
    title: "🔬 วิทยาศาสตร์ ป.1",
    difficulty: GRADE_DIFFICULTY["ป.1"],
    units: [
      {id: "unit1", title: "ร่างกายของเรา", topics: ["ส่วนต่างๆ ของร่างกาย", "ประสาทสัมผัส 5", "การดูแลร่างกาย"]},
      {id: "unit2", title: "สิ่งมีชีวิตรอบตัว", topics: ["พืช", "สัตว์", "สิ่งมีชีวิต vs ไม่มีชีวิต"]},
      {id: "unit3", title: "โลกและท้องฟ้า", topics: ["กลางวัน-กลางคืน", "ดวงอาทิตย์", "ดวงจันทร์", "ดาว"]},
    ],
  },
  primary_social_p1: {
    id: "primary_social_p1",
    level: "primary",
    grade: "ป.1",
    subject: "social",
    title: "🌏 สังคมศึกษา ป.1",
    difficulty: GRADE_DIFFICULTY["ป.1"],
    units: [
      {id: "unit1", title: "ครอบครัวของฉัน", topics: ["สมาชิกในครอบครัว", "หน้าที่ในครอบครัว", "ความรักในครอบครัว"]},
      {id: "unit2", title: "โรงเรียนของเรา", topics: ["ห้องเรียน", "ครูและเพื่อน", "กฎระเบียบโรงเรียน"]},
      {id: "unit3", title: "ชุมชนของเรา", topics: ["บ้าน", "วัด", "ตลาด", "โรงพยาบาล"]},
    ],
  },

  // ==================== ประถมศึกษา ป.2 ====================
  primary_math_p2: {
    id: "primary_math_p2",
    level: "primary",
    grade: "ป.2",
    subject: "math",
    title: "🔢 คณิตศาสตร์ ป.2",
    difficulty: GRADE_DIFFICULTY["ป.2"],
    units: [
      {id: "unit1", title: "จำนวนนับ 1-1,000", topics: ["นับ 1-100", "นับ 100-1,000", "ค่าประจำหลัก", "เปรียบเทียบจำนวน"]},
      {id: "unit2", title: "การบวก-ลบ ภายใน 1,000", topics: ["บวกไม่มีทด", "บวกมีทด", "ลบไม่มีกู้", "ลบมีกู้"]},
      {id: "unit3", title: "การคูณ", topics: ["ความหมายของการคูณ", "สูตรคูณ 2-5", "โจทย์ปัญหาการคูณ"]},
      {id: "unit4", title: "การวัด", topics: ["ความยาว (ซม. ม.)", "น้ำหนัก (ก. กก.)", "เวลา (ชั่วโมง นาที)"]},
    ],
  },
  primary_thai_p2: {
    id: "primary_thai_p2",
    level: "primary",
    grade: "ป.2",
    subject: "thai",
    title: "📜 ภาษาไทย ป.2",
    difficulty: GRADE_DIFFICULTY["ป.2"],
    units: [
      {id: "unit1", title: "การอ่านคำควบกล้ำ", topics: ["คำควบแท้", "คำควบไม่แท้", "การอ่านออกเสียง"]},
      {id: "unit2", title: "การเขียนประโยค", topics: ["ประโยคบอกเล่า", "ประโยคคำถาม", "ประโยคปฏิเสธ"]},
      {id: "unit3", title: "วรรณยุกต์", topics: ["เสียงวรรณยุกต์ 5 เสียง", "การผันวรรณยุกต์", "อักษรสูง-กลาง-ต่ำ"]},
    ],
  },
  primary_english_p2: {
    id: "primary_english_p2",
    level: "primary",
    grade: "ป.2",
    subject: "english",
    title: "🇬🇧 ภาษาอังกฤษ ป.2",
    difficulty: GRADE_DIFFICULTY["ป.2"],
    units: [
      {id: "unit1", title: "My Family", topics: ["Father, Mother", "Brother, Sister", "This is my..."]},
      {id: "unit2", title: "Animals", topics: ["Farm animals", "Wild animals", "I like..."]},
      {id: "unit3", title: "Food & Drinks", topics: ["Fruits", "Vegetables", "I want..."]},
    ],
  },
  primary_science_p2: {
    id: "primary_science_p2",
    level: "primary",
    grade: "ป.2",
    subject: "science",
    title: "🔬 วิทยาศาสตร์ ป.2",
    difficulty: GRADE_DIFFICULTY["ป.2"],
    units: [
      {id: "unit1", title: "พืชรอบตัวเรา", topics: ["ส่วนต่างๆ ของพืช", "พืชต้องการอะไร", "ประโยชน์ของพืช"]},
      {id: "unit2", title: "สัตว์รอบตัวเรา", topics: ["สัตว์เลี้ยง", "สัตว์ป่า", "ที่อยู่ของสัตว์", "อาหารของสัตว์"]},
      {id: "unit3", title: "น้ำและอากาศ", topics: ["ความสำคัญของน้ำ", "สถานะของน้ำ", "อากาศรอบตัว"]},
    ],
  },

  // ==================== ประถมศึกษา ป.3 ====================
  primary_math_p3: {
    id: "primary_math_p3",
    level: "primary",
    grade: "ป.3",
    subject: "math",
    title: "🔢 คณิตศาสตร์ ป.3",
    difficulty: GRADE_DIFFICULTY["ป.3"],
    units: [
      {id: "unit1", title: "จำนวนนับ 1-100,000", topics: ["ค่าประจำหลัก", "การเขียนในรูปกระจาย", "เปรียบเทียบ-เรียงลำดับ"]},
      {id: "unit2", title: "การคูณ-หาร", topics: ["สูตรคูณ 2-12", "การหาร", "โจทย์ปัญหาคูณ-หาร"]},
      {id: "unit3", title: "เศษส่วน", topics: ["ความหมายเศษส่วน", "เศษส่วนอย่างง่าย", "เปรียบเทียบเศษส่วน"]},
      {id: "unit4", title: "เรขาคณิต", topics: ["เส้นตรง-รังสี-ส่วนของเส้นตรง", "มุม", "รูปสี่เหลี่ยม"]},
    ],
  },
  primary_thai_p3: {
    id: "primary_thai_p3",
    level: "primary",
    grade: "ป.3",
    subject: "thai",
    title: "📜 ภาษาไทย ป.3",
    difficulty: GRADE_DIFFICULTY["ป.3"],
    units: [
      {id: "unit1", title: "ตัวสะกด", topics: ["แม่ ก กา", "แม่ กน กม กง กก กด กบ", "คำที่มี ร ล ว"]},
      {id: "unit2", title: "คำและประโยค", topics: ["คำนาม", "คำกริยา", "คำวิเศษณ์", "การแต่งประโยค"]},
      {id: "unit3", title: "การเขียนเรื่อง", topics: ["เขียนเรื่องจากภาพ", "เขียนเล่าประสบการณ์", "เขียนจดหมาย"]},
    ],
  },
  primary_english_p3: {
    id: "primary_english_p3",
    level: "primary",
    grade: "ป.3",
    subject: "english",
    title: "🇬🇧 ภาษาอังกฤษ ป.3",
    difficulty: GRADE_DIFFICULTY["ป.3"],
    units: [
      {id: "unit1", title: "My Day", topics: ["Wake up, Eat, Study", "What time is it?", "Daily routines"]},
      {id: "unit2", title: "Weather", topics: ["Sunny, Rainy, Cloudy", "How is the weather?", "Seasons"]},
      {id: "unit3", title: "Places", topics: ["School, Market, Hospital", "Where is the...?", "Directions"]},
    ],
  },
  primary_science_p3: {
    id: "primary_science_p3",
    level: "primary",
    grade: "ป.3",
    subject: "science",
    title: "🔬 วิทยาศาสตร์ ป.3",
    difficulty: GRADE_DIFFICULTY["ป.3"],
    units: [
      {id: "unit1", title: "วงจรชีวิต", topics: ["วงจรชีวิตพืช", "วงจรชีวิตสัตว์", "การเจริญเติบโต"]},
      {id: "unit2", title: "สสารและวัสดุ", topics: ["ของแข็ง ของเหลว ก๊าซ", "คุณสมบัติวัสดุ", "การเปลี่ยนแปลงวัสดุ"]},
      {id: "unit3", title: "แรงและการเคลื่อนที่", topics: ["แรงดึง-แรงดัน", "แรงโน้มถ่วง", "การเคลื่อนที่ของวัตถุ"]},
    ],
  },

  // ==================== ประถมศึกษา ป.4 ====================
  primary_math_p4: {
    id: "primary_math_p4",
    level: "primary",
    grade: "ป.4",
    subject: "math",
    title: "🔢 คณิตศาสตร์ ป.4",
    difficulty: GRADE_DIFFICULTY["ป.4"],
    units: [
      {id: "unit1", title: "จำนวนนับมากกว่า 100,000", topics: ["หลักล้าน", "การเขียนในรูปกระจาย", "ค่าประมาณ"]},
      {id: "unit2", title: "การคูณ-หารขั้นสูง", topics: ["คูณจำนวนหลายหลัก", "หารลงตัว-ไม่ลงตัว", "โจทย์ปัญหาหลายขั้นตอน"]},
      {id: "unit3", title: "เศษส่วนและทศนิยม", topics: ["เศษส่วนแท้-เทียม", "จำนวนคละ", "ทศนิยม 1-2 ตำแหน่ง"]},
      {id: "unit4", title: "มุมและเส้นขนาน", topics: ["มุมฉาก มุมแหลม มุมป้าน", "เส้นขนาน", "เส้นตั้งฉาก"]},
    ],
  },
  primary_thai_p4: {
    id: "primary_thai_p4",
    level: "primary",
    grade: "ป.4",
    subject: "thai",
    title: "📜 ภาษาไทย ป.4",
    difficulty: GRADE_DIFFICULTY["ป.4"],
    units: [
      {id: "unit1", title: "หลักภาษาไทย", topics: ["ชนิดของคำ", "ประโยคและส่วนประกอบ", "คำราชาศัพท์"]},
      {id: "unit2", title: "การอ่านจับใจความ", topics: ["ใจความสำคัญ", "การสรุปความ", "การตีความ"]},
      {id: "unit3", title: "การเขียนเรียงความ", topics: ["คำนำ-เนื้อเรื่อง-สรุป", "เขียนบรรยาย", "เขียนพรรณนา"]},
    ],
  },
  primary_english_p4: {
    id: "primary_english_p4",
    level: "primary",
    grade: "ป.4",
    subject: "english",
    title: "🇬🇧 ภาษาอังกฤษ ป.4",
    difficulty: GRADE_DIFFICULTY["ป.4"],
    units: [
      {id: "unit1", title: "Present Simple Tense", topics: ["Subject + Verb", "Do/Does", "Routines", "Habits"]},
      {id: "unit2", title: "Describing People", topics: ["Tall, Short, Fat, Thin", "Hair, Eyes", "What does he look like?"]},
      {id: "unit3", title: "Hobbies", topics: ["I like + Verb-ing", "Sports", "Free time activities"]},
    ],
  },
  primary_science_p4: {
    id: "primary_science_p4",
    level: "primary",
    grade: "ป.4",
    subject: "science",
    title: "🔬 วิทยาศาสตร์ ป.4",
    difficulty: GRADE_DIFFICULTY["ป.4"],
    units: [
      {id: "unit1", title: "ระบบร่างกายมนุษย์", topics: ["ระบบย่อยอาหาร", "ระบบหายใจ", "ระบบไหลเวียนเลือด"]},
      {id: "unit2", title: "พลังงาน", topics: ["แหล่งพลังงาน", "การเปลี่ยนรูปพลังงาน", "การประหยัดพลังงาน"]},
      {id: "unit3", title: "ระบบสุริยะ", topics: ["ดวงอาทิตย์", "ดาวเคราะห์ 8 ดวง", "ดวงจันทร์และดาวเทียม"]},
    ],
  },
  primary_social_p4: {
    id: "primary_social_p4",
    level: "primary",
    grade: "ป.4",
    subject: "social",
    title: "🌏 สังคมศึกษา ป.4",
    difficulty: GRADE_DIFFICULTY["ป.4"],
    units: [
      {id: "unit1", title: "ประวัติศาสตร์ไทย", topics: ["สมัยก่อนประวัติศาสตร์", "อาณาจักรสุโขทัย", "อาณาจักรอยุธยา"]},
      {id: "unit2", title: "ภูมิศาสตร์", topics: ["ทิศและแผนที่", "ภูมิประเทศไทย", "ภาคต่างๆ ของประเทศไทย"]},
      {id: "unit3", title: "หน้าที่พลเมือง", topics: ["สิทธิและหน้าที่", "กฎหมายเบื้องต้น", "ประชาธิปไตย"]},
    ],
  },

  // ==================== ประถมศึกษา ป.5 ====================
  primary_math_p5: {
    id: "primary_math_p5",
    level: "primary",
    grade: "ป.5",
    subject: "math",
    title: "🔢 คณิตศาสตร์ ป.5",
    difficulty: GRADE_DIFFICULTY["ป.5"],
    units: [
      {id: "unit1", title: "เศษส่วนขั้นสูง", topics: ["บวก-ลบเศษส่วน", "คูณ-หารเศษส่วน", "โจทย์ปัญหาเศษส่วน"]},
      {id: "unit2", title: "ทศนิยม", topics: ["บวก-ลบทศนิยม", "คูณ-หารทศนิยม", "เปรียบเทียบทศนิยม"]},
      {id: "unit3", title: "ร้อยละ", topics: ["ความหมายร้อยละ", "ร้อยละกับทศนิยม", "โจทย์ปัญหาร้อยละ"]},
      {id: "unit4", title: "พื้นที่และปริมาตร", topics: ["พื้นที่สี่เหลี่ยม", "พื้นที่สามเหลี่ยม", "ปริมาตรทรงสี่เหลี่ยม"]},
    ],
  },
  primary_thai_p5: {
    id: "primary_thai_p5",
    level: "primary",
    grade: "ป.5",
    subject: "thai",
    title: "📜 ภาษาไทย ป.5",
    difficulty: GRADE_DIFFICULTY["ป.5"],
    units: [
      {id: "unit1", title: "ไวยากรณ์ขั้นสูง", topics: ["คำสมาส-สนธิ", "คำประสม", "สำนวน-สุภาษิต"]},
      {id: "unit2", title: "การอ่านวิเคราะห์", topics: ["วิเคราะห์เนื้อหา", "วิเคราะห์ตัวละคร", "การตีความหมาย"]},
      {id: "unit3", title: "การเขียนขั้นสูง", topics: ["เขียนโน้มน้าว", "เขียนรายงาน", "เขียนบทสนทนา"]},
    ],
  },
  primary_english_p5: {
    id: "primary_english_p5",
    level: "primary",
    grade: "ป.5",
    subject: "english",
    title: "🇬🇧 ภาษาอังกฤษ ป.5",
    difficulty: GRADE_DIFFICULTY["ป.5"],
    units: [
      {id: "unit1", title: "Past Simple Tense", topics: ["Regular verbs (-ed)", "Irregular verbs", "Yesterday, Last week"]},
      {id: "unit2", title: "Future Tense", topics: ["Will + Verb", "Going to", "Tomorrow, Next week"]},
      {id: "unit3", title: "Comparisons", topics: ["Adjective + er/est", "More/Most", "As...as"]},
    ],
  },
  primary_science_p5: {
    id: "primary_science_p5",
    level: "primary",
    grade: "ป.5",
    subject: "science",
    title: "🔬 วิทยาศาสตร์ ป.5",
    difficulty: GRADE_DIFFICULTY["ป.5"],
    units: [
      {id: "unit1", title: "การสืบพันธุ์และพันธุกรรม", topics: ["การสืบพันธุ์พืช", "การสืบพันธุ์สัตว์", "ลักษณะทางพันธุกรรม"]},
      {id: "unit2", title: "ไฟฟ้าและวงจร", topics: ["วงจรไฟฟ้าอย่างง่าย", "ตัวนำ-ฉนวน", "ความปลอดภัยไฟฟ้า"]},
      {id: "unit3", title: "ห่วงโซ่อาหาร", topics: ["ผู้ผลิต-ผู้บริโภค", "ห่วงโซ่อาหาร", "สายใยอาหาร"]},
    ],
  },

  // ==================== ประถมศึกษา ป.6 ====================
  primary_math_p6: {
    id: "primary_math_p6",
    level: "primary",
    grade: "ป.6",
    subject: "math",
    title: "🔢 คณิตศาสตร์ ป.6",
    difficulty: GRADE_DIFFICULTY["ป.6"],
    units: [
      {id: "unit1", title: "อัตราส่วนและสัดส่วน", topics: ["อัตราส่วน", "สัดส่วน", "โจทย์ปัญหาอัตราส่วน", "แผนภูมิ"]},
      {id: "unit2", title: "สมการและอสมการ", topics: ["สมการเชิงเส้น", "การแก้สมการ", "อสมการ", "โจทย์ปัญหาสมการ"]},
      {id: "unit3", title: "รูปเรขาคณิต 3 มิติ", topics: ["ทรงกลม ทรงกระบอก กรวย", "พื้นที่ผิว", "ปริมาตร"]},
      {id: "unit4", title: "สถิติและความน่าจะเป็น", topics: ["การเก็บข้อมูล", "กราฟและแผนภูมิ", "ความน่าจะเป็นเบื้องต้น"]},
    ],
  },
  primary_thai_p6: {
    id: "primary_thai_p6",
    level: "primary",
    grade: "ป.6",
    subject: "thai",
    title: "📜 ภาษาไทย ป.6",
    difficulty: GRADE_DIFFICULTY["ป.6"],
    units: [
      {id: "unit1", title: "วรรณคดี", topics: ["รามเกียรติ์", "ขุนช้างขุนแผน", "นิราศ", "โคลง-กลอน"]},
      {id: "unit2", title: "การพูดและการฟัง", topics: ["การพูดในโอกาสต่างๆ", "การอภิปราย", "การวิเคราะห์สาร"]},
      {id: "unit3", title: "เตรียมสอบ O-NET", topics: ["หลักภาษาทบทวน", "การอ่านจับใจความ", "ข้อสอบแนว O-NET"]},
    ],
  },
  primary_english_p6: {
    id: "primary_english_p6",
    level: "primary",
    grade: "ป.6",
    subject: "english",
    title: "🇬🇧 ภาษาอังกฤษ ป.6",
    difficulty: GRADE_DIFFICULTY["ป.6"],
    units: [
      {id: "unit1", title: "Tenses Review", topics: ["Present/Past/Future", "Progressive tenses", "Perfect tenses basics"]},
      {id: "unit2", title: "Reading Comprehension", topics: ["Main idea", "Details", "Inference"]},
      {id: "unit3", title: "Writing", topics: ["Paragraph writing", "Email & Letter", "Short stories"]},
    ],
  },
  primary_science_p6: {
    id: "primary_science_p6",
    level: "primary",
    grade: "ป.6",
    subject: "science",
    title: "🔬 วิทยาศาสตร์ ป.6",
    difficulty: GRADE_DIFFICULTY["ป.6"],
    units: [
      {id: "unit1", title: "ระบบนิเวศ", topics: ["องค์ประกอบระบบนิเวศ", "ความสัมพันธ์ในระบบนิเวศ", "การอนุรักษ์"]},
      {id: "unit2", title: "แรงและพลังงานขั้นสูง", topics: ["แรงลัพธ์", "งานและพลังงาน", "เครื่องกลอย่างง่าย"]},
      {id: "unit3", title: "โลกและอวกาศ", topics: ["โครงสร้างโลก", "ปรากฏการณ์ทางธรรมชาติ", "เทคโนโลยีอวกาศ"]},
    ],
  },
  primary_social_p6: {
    id: "primary_social_p6",
    level: "primary",
    grade: "ป.6",
    subject: "social",
    title: "🌏 สังคมศึกษา ป.6",
    difficulty: GRADE_DIFFICULTY["ป.6"],
    units: [
      {id: "unit1", title: "ประวัติศาสตร์ไทยสมัยใหม่", topics: ["รัตนโกสินทร์", "การเปลี่ยนแปลงการปกครอง", "ไทยในอดีต-ปัจจุบัน"]},
      {id: "unit2", title: "ภูมิศาสตร์โลก", topics: ["ทวีปต่างๆ", "ประเทศเพื่อนบ้าน ASEAN", "ภูมิอากาศโลก"]},
      {id: "unit3", title: "เศรษฐศาสตร์เบื้องต้น", topics: ["การผลิต การบริโภค", "รายได้-รายจ่าย", "การออม"]},
    ],
  },

  // ==================== มัธยมศึกษา ====================
  secondary_math_m1: {
    id: "secondary_math_m1",
    level: "secondary",
    grade: "ม.1",
    subject: "math",
    title: "คณิตศาสตร์ ม.1",
    units: [
      {id: "unit1", title: "จำนวนเต็ม", topics: ["จำนวนเต็มบวก-ลบ", "การบวก-ลบ-คูณ-หาร", "เลขยกกำลัง", "รากที่สอง"]},
      {id: "unit2", title: "พีชคณิต", topics: ["พจน์-พหุนาม", "การบวก-ลบพหุนาม", "การคูณ-หารพหุนาม", "สมการเชิงเส้น"]},
      {id: "unit3", title: "เรขาคณิต", topics: ["มุมและเส้นตรง", "รูปสามเหลี่ยม", "รูปสี่เหลี่ยม", "พื้นที่และปริมาตร"]},
    ],
  },

  secondary_physics_m4: {
    id: "secondary_physics_m4",
    level: "secondary",
    grade: "ม.4",
    subject: "physics",
    title: "ฟิสิกส์ ม.4",
    units: [
      {
        id: "unit1",
        title: "การเคลื่อนที่",
        topics: ["ความเร็ว-ความเร่ง", "การเคลื่อนที่แนวตรง", "การตกอิสระ", "กราฟการเคลื่อนที่"],
      },
      {
        id: "unit2",
        title: "แรงและการเคลื่อนที่",
        topics: ["กฎนิวตัน", "น้ำหนัก-มวล", "แรงเสียดทาน", "งานและพลังงาน"],
      },
      {
        id: "unit3",
        title: "ความร้อน",
        topics: ["อุณหภูมิ", "การขยายตัว", "การถ่ายเทความร้อน", "กฎก๊าซ"],
      },
    ],
  },

  // ==================== อาชีวศึกษา ====================
  vocational_mechanical_pvc1: {
    id: "vocational_mechanical_pvc1",
    level: "vocational",
    grade: "ปวช.1",
    subject: "mechanical",
    title: "ช่างกลโรงงาน ปวช.1",
    units: [
      {
        id: "unit1",
        title: "เครื่องมือช่างพื้นฐาน",
        topics: ["เครื่องมือวัด", "เครื่องมือตัด", "เครื่องมือยึด", "ความปลอดภัย"],
      },
      {
        id: "unit2",
        title: "การอ่านแบบ",
        topics: ["มุมมองแบบ", "สัญลักษณ์", "ขนาดและความเผื่อ", "ภาพประกอบ"],
      },
      {
        id: "unit3",
        title: "งานกลึง",
        topics: ["ส่วนประกอบเครื่องกลึง", "การจับงาน", "การกลึงหน้า", "การกลึงเจาะ"],
      },
      {
        id: "unit4",
        title: "งานไส",
        topics: ["เครื่องไส", "การจับงาน", "การไสระนาบ", "การไสร่อง"],
      },
      {
        id: "unit5",
        title: "งานเชื่อม",
        topics: ["ชนิดการเชื่อม", "เชื่อมไฟฟ้า", "เชื่อม MIG/TIG", "ความปลอดภัย"],
      },
    ],
  },

  vocational_electrical_pvc1: {
    id: "vocational_electrical_pvc1",
    level: "vocational",
    grade: "ปวช.1",
    subject: "electrical",
    title: "ช่างไฟฟ้า ปวช.1",
    units: [
      {
        id: "unit1",
        title: "ทฤษฎีไฟฟ้าพื้นฐาน",
        topics: ["กระแสไฟฟ้า", "แรงดันไฟฟ้า", "ความต้านทาน", "กฎของโอห์ม"],
      },
      {
        id: "unit2",
        title: "วงจรไฟฟ้า",
        topics: ["วงจรอนุกรม", "วงจรขนาน", "การวัดค่าไฟฟ้า", "กำลังไฟฟ้า"],
      },
      {
        id: "unit3",
        title: "เครื่องมือและอุปกรณ์",
        topics: ["มัลติมิเตอร์", "คีมย้ำสาย", "เครื่องมือเดินสาย", "ความปลอดภัย"],
      },
      {
        id: "unit4",
        title: "การเดินสายไฟ",
        topics: ["สายไฟ", "ท่อร้อยสาย", "เบรกเกอร์", "ปลั๊ก-สวิตช์"],
      },
    ],
  },

  vocational_automotive_pvc1: {
    id: "vocational_automotive_pvc1",
    level: "vocational",
    grade: "ปวช.1",
    subject: "automotive",
    title: "ช่างยนต์ ปวช.1",
    units: [
      {
        id: "unit1",
        title: "เครื่องยนต์สันดาปภายใน",
        topics: ["หลักการทำงาน", "4 จังหวะ", "ส่วนประกอบหลัก", "วงจรเครื่องยนต์"],
      },
      {
        id: "unit2",
        title: "ระบบส่งกำลัง",
        topics: ["คลัตช์", "เกียร์", "เพลาขับ", "เฟืองท้าย"],
      },
      {
        id: "unit3",
        title: "ระบบไฟฟ้า",
        topics: ["แบตเตอรี่", "ไดนาโม", "หัวเทียน", "ระบบจุดระเบิด"],
      },
      {
        id: "unit4",
        title: "ระบบเบรก",
        topics: ["เบรกดรัม", "เบรกดิสก์", "ของเหลวเบรก", "การตรวจสอบ"],
      },
    ],
  },

  vocational_computer_pvc1: {
    id: "vocational_computer_pvc1",
    level: "vocational",
    grade: "ปวช.1",
    subject: "computerTech",
    title: "คอมพิวเตอร์ ปวช.1",
    units: [
      {
        id: "unit1",
        title: "Hardware พื้นฐาน",
        topics: ["CPU", "RAM", "Hard Disk", "Motherboard", "การประกอบเครื่อง"],
      },
      {
        id: "unit2",
        title: "ระบบปฏิบัติการ",
        topics: ["Windows", "Linux พื้นฐาน", "การติดตั้ง", "การจัดการไฟล์"],
      },
      {
        id: "unit3",
        title: "เครือข่ายคอมพิวเตอร์",
        topics: ["LAN", "TCP/IP", "การเดินสาย", "การตั้งค่าเครือข่าย"],
      },
      {
        id: "unit4",
        title: "โปรแกรมสำนักงาน",
        topics: ["Word", "Excel", "PowerPoint", "การจัดพิมพ์"],
      },
    ],
  },

  // ==================== ปริญญาตรี ====================
  university_engineering_y1: {
    id: "university_engineering_y1",
    level: "university",
    grade: "ปี 1",
    subject: "engineering",
    title: "วิศวกรรมศาสตร์ ปี 1",
    units: [
      {
        id: "unit1",
        title: "Calculus I",
        topics: ["Limits", "Derivatives", "Integration", "Applications"],
      },
      {
        id: "unit2",
        title: "Physics for Engineers",
        topics: ["Mechanics", "Thermodynamics", "Electricity", "Magnetism"],
      },
      {
        id: "unit3",
        title: "Engineering Drawing",
        topics: ["Orthographic Projection", "Isometric", "Dimensioning", "CAD Basics"],
      },
      {
        id: "unit4",
        title: "Computer Programming",
        topics: ["C/Python Basics", "Algorithms", "Data Structures", "Problem Solving"],
      },
    ],
  },

  university_programming_y1: {
    id: "university_programming_y1",
    level: "university",
    grade: "ปี 1",
    subject: "programming",
    title: "วิทยาการคอมพิวเตอร์ ปี 1",
    units: [
      {
        id: "unit1",
        title: "Introduction to Programming",
        topics: ["Python Basics", "Variables & Data Types", "Control Flow", "Functions"],
      },
      {
        id: "unit2",
        title: "Data Structures",
        topics: ["Arrays", "Lists", "Stacks & Queues", "Trees", "Hash Tables"],
      },
      {
        id: "unit3",
        title: "Algorithms",
        topics: ["Sorting", "Searching", "Recursion", "Complexity Analysis"],
      },
      {
        id: "unit4",
        title: "Web Development",
        topics: ["HTML/CSS", "JavaScript", "Frontend Basics", "Git/GitHub"],
      },
    ],
  },

  university_business_y1: {
    id: "university_business_y1",
    level: "university",
    grade: "ปี 1",
    subject: "business",
    title: "บริหารธุรกิจ ปี 1",
    units: [
      {
        id: "unit1",
        title: "Principles of Management",
        topics: ["Planning", "Organizing", "Leading", "Controlling"],
      },
      {
        id: "unit2",
        title: "Marketing Principles",
        topics: ["4Ps", "Consumer Behavior", "Market Research", "Digital Marketing"],
      },
      {
        id: "unit3",
        title: "Accounting",
        topics: ["Financial Statements", "Debits & Credits", "Journal Entries", "Trial Balance"],
      },
      {
        id: "unit4",
        title: "Business Economics",
        topics: ["Supply & Demand", "Market Structures", "Cost Analysis", "Pricing"],
      },
    ],
  },
};

// =====================================================
// 📌 SAMPLE LESSONS - บทเรียนตัวอย่าง
// =====================================================

const SAMPLE_LESSONS = {
  // ตัวอย่างบทเรียนละเอียด - คณิต ป.1
  primary_math_p1_unit1_lesson1: {
    id: "primary_math_p1_unit1_lesson1",
    courseId: "primary_math_p1",
    unitId: "unit1",
    title: "การนับ 1-10",
    duration: "30 นาที",
    content: `
🎯 **วัตถุประสงค์:**
- นับจำนวน 1-10 ได้ถูกต้อง
- เขียนตัวเลข 1-10 ได้
- บอกจำนวนสิ่งของได้

📖 **เนื้อหา:**

**1️⃣ หนึ่ง** - 🍎 (แอปเปิ้ล 1 ลูก)
**2️⃣ สอง** - 🍎🍎 (แอปเปิ้ล 2 ลูก)
**3️⃣ สาม** - 🍎🍎🍎
**4️⃣ สี่** - 🍎🍎🍎🍎
**5️⃣ ห้า** - 🍎🍎🍎🍎🍎

ฝึกนับต่อ:
6 = หก, 7 = เจ็ด, 8 = แปด, 9 = เก้า, 10 = สิบ

🎮 **กิจกรรม:**
1. นับสิ่งของรอบตัว
2. ฝึกเขียนตัวเลข 1-10
3. จับคู่จำนวนกับตัวเลข
`,
    quiz: ["นับลูกบอลในรูป มีกี่ลูก?", "เขียนตัวเลข 7", "หา 5 + 2 ="],
  },

  // ตัวอย่างบทเรียน - ช่างกลโรงงาน ปวช.1
  vocational_mechanical_lathe_basics: {
    id: "vocational_mechanical_lathe_basics",
    courseId: "vocational_mechanical_pvc1",
    unitId: "unit3",
    title: "พื้นฐานงานกลึง",
    duration: "2 ชั่วโมง",
    content: `
🎯 **วัตถุประสงค์:**
- อธิบายส่วนประกอบเครื่องกลึงได้
- เลือกใช้มีดกลึงได้ถูกต้อง
- ปฏิบัติงานกลึงได้อย่างปลอดภัย

📖 **ส่วนประกอบเครื่องกลึง:**

**1. Headstock (หัวหมุน):**
- ติดตั้งชิ้นงาน
- หมุนชิ้นงาน
- ควบคุมความเร็วรอบ

**2. Tailstock (หัวนอน):**
- รองรับชิ้นงานยาว
- ใช้เจาะรู
- ปรับเลื่อนได้

**3. Carriage (รถเลื่อน):**
- เลื่อนมีดกลึง
- ป้อนอัตโนมัติ
- ควบคุมระยะตัด

**4. Tool Post (หัวจับมีด):**
- ติดตั้งมีดกลึง
- ปรับความสูงได้
- หมุนเปลี่ยนมีด

⚙️ **พารามิเตอร์การกลึง:**

**ความเร็วรอบ (RPM):**
\`\`\`
RPM = (Cutting Speed × 1000) / (π × Diameter)

ตัวอย่าง: เหล็ก Ø50mm, ความเร็ว 30 m/min
RPM = (30 × 1000) / (3.14 × 50) = 191 rpm
\`\`\`

**อัตราป้อน (Feed Rate):**
- งานหยาบ: 0.2-0.5 mm/rev
- งานปานกลาง: 0.1-0.2 mm/rev
- งานละเอียด: 0.05-0.1 mm/rev

**ความลึกตัด (Depth of Cut):**
- งานหยาบ: 2-5 mm
- งานปานกลาง: 0.5-2 mm
- งานละเอียด: 0.1-0.5 mm

🔧 **ชนิดมีดกลึง:**

| ชนิดมีด | ใช้กับงาน |
|---------|----------|
| Turning Tool | กลึงหน้า-เส้นผ่านศูนย์กลาง |
| Facing Tool | กลึงหน้า |
| Boring Tool | เจาะรูขยาย |
| Thread Tool | กลึงเกลียว |
| Parting Tool | ตัดขาด |

⚠️ **ความปลอดภัย:**
1. ✅ สวมแว่นนิรภัย
2. ✅ ห้ามสวมถุงมือขณะเครื่องทำงาน
3. ✅ ตรวจสอบชิ้นงานจับแน่น
4. ✅ ปรับความเร็วก่อนเปิดเครื่อง
5. ❌ ห้ามวัดขนาดขณะเครื่องหมุน
`,
    quiz: [
      "Headstock ทำหน้าที่อะไร?",
      "คำนวณ RPM สำหรับกลึงเหล็ก Ø40mm ความเร็ว 25 m/min",
      "งานละเอียดควรใช้อัตราป้อนเท่าไร?",
    ],
  },

  // ตัวอย่างบทเรียน - Programming
  university_programming_intro_python: {
    id: "university_programming_intro_python",
    courseId: "university_programming_y1",
    unitId: "unit1",
    title: "Python Basics: Variables & Data Types",
    duration: "1.5 hours",
    content: `
🎯 **Learning Objectives:**
- Understand Python variables
- Master basic data types
- Perform type conversions

📖 **Variables in Python:**

Variables are containers for storing data:

\`\`\`python
# Integer
age = 20
students = 150

# Float
price = 49.99
pi = 3.14159

# String
name = "John"
university = "MIT"

# Boolean
is_student = True
passed = False
\`\`\`

**Naming Rules:**
- Must start with letter or underscore
- Can contain letters, numbers, underscore
- Case-sensitive (age ≠ Age)
- No Python keywords (if, for, while, etc.)

📊 **Data Types:**

**1. Numbers:**
\`\`\`python
# Integer
x = 10
y = -5

# Float
temperature = 25.5
weight = 68.2

# Operations
sum = 10 + 5      # 15
diff = 10 - 3     # 7
product = 4 * 5   # 20
quotient = 20 / 4 # 5.0
power = 2 ** 3    # 8
modulo = 10 % 3   # 1
\`\`\`

**2. Strings:**
\`\`\`python
# Single or double quotes
message = 'Hello'
greeting = "Welcome"

# Multi-line
text = """This is
a multi-line
string"""

# Concatenation
first_name = "John"
last_name = "Doe"
full_name = first_name + " " + last_name
# Output: "John Doe"

# String methods
text = "python programming"
print(text.upper())      # PYTHON PROGRAMMING
print(text.capitalize()) # Python programming
print(len(text))         # 18
\`\`\`

**3. Boolean:**
\`\`\`python
is_raining = True
is_sunny = False

# Comparison operators
5 > 3   # True
10 == 5 # False
7 != 8  # True

# Logical operators
True and False  # False
True or False   # True
not True        # False
\`\`\`

🔄 **Type Conversion:**

\`\`\`python
# String to Integer
age_str = "25"
age_int = int(age_str)    # 25

# Integer to String
number = 100
text = str(number)        # "100"

# String to Float
price = "99.99"
price_float = float(price) # 99.99

# Float to Integer (truncates)
x = int(3.9)              # 3

# Check type
type(10)        # <class 'int'>
type("hello")   # <class 'str'>
\`\`\`

💻 **Practice Examples:**

\`\`\`python
# Example 1: Calculator
num1 = 15
num2 = 7
print("Sum:", num1 + num2)
print("Difference:", num1 - num2)
print("Product:", num1 * num2)
print("Division:", num1 / num2)

# Example 2: String formatting
name = "Alice"
age = 22
print(f"{name} is {age} years old")
# Output: Alice is 22 years old

# Example 3: Type conversion
x = "100"
y = "50"
result = int(x) + int(y)
print(result)  # 150 (not "10050")
\`\`\`
`,
    quiz: [
      "What is the result of: 10 // 3?",
      "Convert string \"3.14\" to float",
      "What does len(\"Python\") return?",
    ],
  },
};

// =====================================================
// 🎮 INTERACTIVE FEATURES - ฟีเจอร์เชิงโต้ตอบทันสมัย
// =====================================================

const STUDY_TOOLS = {
  // 🧠 AI-Powered Tools
  aiFlashcard: {
    id: "aiFlashcard",
    name: "🧠 AI Flashcard",
    description: "สร้างบัตรคำอัตโนมัติจาก AI พร้อมรูปภาพและเสียง",
    icon: "🃏",
    category: "ai",
    command: "/tool flashcard",
    features: ["สร้างคำศัพท์จากหัวข้อ", "เพิ่มรูปประกอบ", "ออกเสียง", "ทดสอบความจำ"],
    premium: false,
  },
  aiSummary: {
    id: "aiSummary",
    name: "📋 AI สรุปให้",
    description: "สรุปบทเรียน/หนังสือให้เข้าใจง่ายใน 3 นาที",
    icon: "📋",
    category: "ai",
    command: "/tool summary",
    features: ["สรุปจุดสำคัญ", "แปลงเป็น Bullet Points", "สร้าง Key Takeaways"],
    premium: false,
  },
  aiMindMap: {
    id: "aiMindMap",
    name: "🗺️ AI Mind Map",
    description: "สร้างแผนผังความคิดอัตโนมัติ",
    icon: "🗺️",
    category: "ai",
    command: "/tool mindmap",
    features: ["สร้าง Mind Map", "เชื่อมโยงความสัมพันธ์", "Export รูปภาพ"],
    premium: false,
  },
  aiQuizGen: {
    id: "aiQuizGen",
    name: "🎯 AI สร้างข้อสอบ",
    description: "สร้างข้อสอบจากเนื้อหาที่เรียน",
    icon: "🎯",
    category: "ai",
    command: "/tool quiz",
    features: ["สร้างโจทย์หลายแบบ", "ปรับระดับความยาก", "เฉลยพร้อมคำอธิบาย"],
    premium: false,
  },

  // ⏳ Productivity Tools
  pomodoro: {
    id: "pomodoro",
    name: "🍅 Pomodoro Timer",
    description: "จับเวลาเรียน 25 นาที พัก 5 นาที",
    icon: "🍅",
    category: "productivity",
    command: "/tool pomodoro",
    features: ["เริ่มจับเวลา 25 นาที", "แจ้งเตือนพัก", "นับรอบการเรียน", "สถิติการเรียน"],
    premium: false,
  },
  studyPlanner: {
    id: "studyPlanner",
    name: "📅 ตารางเรียน AI",
    description: "AI ช่วยจัดตารางเรียนให้เหมาะกับคุณ",
    icon: "📅",
    category: "productivity",
    command: "/tool planner",
    features: ["วางแผนรายวัน", "จัดตารางสอบ", "แจ้งเตือนการบ้าน"],
    premium: false,
  },
  goalTracker: {
    id: "goalTracker",
    name: "🎯 Goal Tracker",
    description: "ตั้งเป้าหมายและติดตามความก้าวหน้า",
    icon: "📊",
    category: "productivity",
    command: "/tool goal",
    features: ["ตั้งเป้าหมาย", "ติดตามความก้าวหน้า", "รับ Badge"],
    premium: false,
  },

  // 📚 Learning Tools
  voiceNote: {
    id: "voiceNote",
    name: "🎙️ Voice Note",
    description: "บันทึกเสียงและแปลงเป็นโน้ต",
    icon: "🎙️",
    category: "learning",
    command: "/tool voice",
    features: ["บันทึกเสียง", "แปลงเป็น Text", "สรุปอัตโนมัติ"],
    premium: true,
  },
  formulaHelper: {
    id: "formulaHelper",
    name: "🔢 สูตรคณิต/วิทย์",
    description: "รวมสูตรทุกระดับชั้น พร้อมตัวอย่าง",
    icon: "🔢",
    category: "learning",
    command: "/tool formula",
    features: ["ค้นหาสูตร", "ดูตัวอย่างการใช้", "คำนวณได้"],
    premium: false,
  },
  translator: {
    id: "translator",
    name: "🌏 แปลภาษา",
    description: "แปลไทย-อังกฤษ พร้อมคำอ่าน",
    icon: "🌏",
    category: "learning",
    command: "/tool translate",
    features: ["แปลไทย-อังกฤษ", "คำอ่าน IPA", "ประโยคตัวอย่าง"],
    premium: false,
  },
  dictionary: {
    id: "dictionary",
    name: "📖 พจนานุกรม",
    description: "ค้นหาความหมาย คำพ้อง คำตรงข้าม",
    icon: "📖",
    category: "learning",
    command: "/tool dict",
    features: ["ความหมาย", "คำพ้อง", "คำตรงข้าม", "ประโยคตัวอย่าง"],
    premium: false,
  },

  // 🧪 Interactive Labs
  virtualLab: {
    id: "virtualLab",
    name: "🧪 Virtual Lab",
    description: "ทดลองวิทย์เสมือนจริง",
    icon: "🧪",
    category: "lab",
    command: "/tool lab",
    features: ["ทดลองเคมี", "จำลองฟิสิกส์", "ดูผลลัพธ์"],
    premium: true,
  },
  calculator: {
    id: "calculator",
    name: "🧮 เครื่องคิดเลขวิทย์",
    description: "คำนวณสมการ กราฟ สูตรวิทย์",
    icon: "🧮",
    category: "lab",
    command: "/tool calc",
    features: ["คำนวณสมการ", "วาดกราฟ", "แปลงหน่วย"],
    premium: false,
  },

  // 🎮 Gamification
  quizBattle: {
    id: "quizBattle",
    name: "⚔️ Quiz Battle",
    description: "แข่งตอบคำถามกับเพื่อน",
    icon: "⚔️",
    category: "game",
    command: "/tool battle",
    features: ["แข่งขัน 1v1", "ได้ XP", "ไต่อันดับ"],
    premium: false,
  },
  dailyChallenge: {
    id: "dailyChallenge",
    name: "🌟 Challenge รายวัน",
    description: "ทำภารกิจรายวัน รับ XP และ Badge",
    icon: "🌟",
    category: "game",
    command: "/challenge",
    features: ["ภารกิจรายวัน", "รับ XP", "สะสม Badge"],
    premium: false,
  },
};

// =====================================================
// 💬 AI TUTOR FEATURES - ระบบติวเตอร์ AI
// =====================================================

const AI_TUTOR_MODES = {
  explain: {
    mode: "explain",
    name: "🎓 อธิบายเนื้อหา",
    description: "อธิบายเนื้อหาให้เข้าใจง่าย พร้อมยกตัวอย่าง",
  },
  practice: {
    mode: "practice",
    name: "✏️ ฝึกทำโจทย์",
    description: "สร้างโจทย์ฝึกหัดและอธิบายวิธีทำ",
  },
  exam: {
    mode: "exam",
    name: "📑 เตรียมสอบ",
    description: "สรุปหัวข้อสำคัญและข้อสอบแนวข้อสอบ",
  },
  homework: {
    mode: "homework",
    name: "📚 ช่วยการบ้าน",
    description: "ช่วยทำการบ้าน แนะนำวิธีคิด",
  },
  project: {
    mode: "project",
    name: "🎯 โครงงาน",
    description: "แนะนำการทำโครงงาน/งานวิจัย",
  },
};

// =====================================================
// 🎨 FLEX MESSAGE CREATORS
// =====================================================

/**
 * สร้างเมนูหลัก Education Hub
 */
function createEducationHubMenuFlex() {
  return {
    type: "flex",
    altText: "🎓 ศูนย์การศึกษาครบวงจร",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎓 ศูนย์การศึกษาครบวงจร",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: "Education Hub for All Levels",
            size: "sm",
            color: "#DBEAFE",
          },
        ],
        backgroundColor: "#1E40AF",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "เลือกระดับการศึกษา:",
            weight: "bold",
            size: "md",
            color: "#1E40AF",
            margin: "none",
          },
          {type: "separator", margin: "md"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              createLevelButton("🎒", "ประถมศึกษา", "Primary School", "#EC4899", "/edu primary"),
              createLevelButton("📖", "มัธยมศึกษา", "Secondary School", "#8B5CF6", "/edu secondary"),
              createLevelButton("🔧", "อาชีวศึกษา", "Vocational", "#F59E0B", "/edu vocational"),
              createLevelButton("🎓", "ปริญญาตรี", "University", "#3B82F6", "/edu university"),
            ],
            spacing: "md",
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
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "🧮 เครื่องมือ", text: "/edu tools"},
                style: "secondary",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "💬 ถาม WiT", text: "/edu tutor"},
                style: "primary",
                color: "#16A34A",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

function createLevelButton(icon, titleTh, titleEn, color, action) {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: icon,
        size: "xl",
        flex: 0,
        margin: "none",
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: titleTh, weight: "bold", size: "md", color: "#333333"},
          {type: "text", text: titleEn, size: "sm", color: "#666666"},
        ],
        paddingStart: "15px",
        flex: 4,
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "▶", size: "xl", color: color, align: "center"},
        ],
        flex: 1,
        justifyContent: "center",
      },
    ],
    paddingAll: "15px",
    backgroundColor: "#FFFFFF",
    cornerRadius: "md",
    borderWidth: "2px",
    borderColor: color,
    action: {type: "message", text: action},
  };
}

/**
 * 🆕 สร้างเมนูเลือกชั้น ป.1-ป.6 พร้อมระดับความยาก
 */
function createPrimaryGradeMenuFlex() {
  const grades = [
    {grade: "ป.1", emoji: "👶", age: "6-7 ปี", difficulty: "⭐", color: "#EC4899", desc: "เริ่มต้นเรียนรู้"},
    {grade: "ป.2", emoji: "🧒", age: "7-8 ปี", difficulty: "⭐⭐", color: "#F472B6", desc: "พื้นฐานแน่น"},
    {grade: "ป.3", emoji: "📖", age: "8-9 ปี", difficulty: "⭐⭐", color: "#F87171", desc: "เริ่มวิเคราะห์"},
    {grade: "ป.4", emoji: "📚", age: "9-10 ปี", difficulty: "⭐⭐⭐", color: "#FB923C", desc: "เนื้อหาลึกขึ้น"},
    {grade: "ป.5", emoji: "🎓", age: "10-11 ปี", difficulty: "⭐⭐⭐⭐", color: "#FBBF24", desc: "เตรียมสอบ"},
    {grade: "ป.6", emoji: "🏆", age: "11-12 ปี", difficulty: "⭐⭐⭐⭐⭐", color: "#A3E635", desc: "พร้อมสอบ O-NET"},
  ];

  const gradeButtons = grades.map((g) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {type: "text", text: g.emoji, size: "xxl", flex: 0},
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: g.grade, weight: "bold", size: "lg", color: g.color},
          {type: "text", text: `${g.desc} | อายุ ${g.age}`, size: "xs", color: "#666666"},
          {type: "text", text: `ความยาก: ${g.difficulty}`, size: "xs", color: "#999999"},
        ],
        paddingStart: "12px",
        flex: 3,
      },
      {type: "text", text: "▶", size: "lg", color: g.color, align: "end", flex: 1},
    ],
    paddingAll: "12px",
    backgroundColor: "#FEFCE8",
    cornerRadius: "md",
    margin: "sm",
    action: {type: "message", text: `/edu primary ${g.grade}`},
  }));

  return {
    type: "flex",
    altText: "🎒 เลือกชั้นประถมศึกษา",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🎒 ประถมศึกษา", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: "เลือกชั้นเรียนของน้อง", size: "sm", color: "#FDF4FF"},
        ],
        backgroundColor: "#EC4899",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "📊 เลือกระดับชั้น:", weight: "bold", size: "md", color: "#EC4899"},
          {type: "text", text: "แต่ละชั้นมีเนื้อหาและความยากเหมาะกับวัย", size: "xs", color: "#666666", margin: "sm"},
          {type: "separator", margin: "md"},
          {type: "box", layout: "vertical", contents: gradeButtons, margin: "md"},
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {type: "button", action: {type: "message", label: "◀ กลับ", text: "/edu"}, style: "secondary", height: "sm", flex: 1},
          {type: "button", action: {type: "message", label: "💬 ถาม WiT", text: "/tutor"}, style: "primary", color: "#16A34A", height: "sm", flex: 1, margin: "sm"},
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * 🆕 สร้างเมนูวิชาสำหรับชั้น ป.X พร้อมเนื้อหาเฉพาะชั้น
 */
function createPrimarySubjectsMenuFlex(grade) {
  const gradeInfo = GRADE_DIFFICULTY[grade];
  if (!gradeInfo) return createPrimaryGradeMenuFlex();

  // วิชาหลักสำหรับประถม
  const primarySubjects = [
    {id: "math", name: "คณิตศาสตร์", icon: "🔢", color: "#3B82F6"},
    {id: "thai", name: "ภาษาไทย", icon: "📜", color: "#EC4899"},
    {id: "english", name: "ภาษาอังกฤษ", icon: "🇬🇧", color: "#8B5CF6"},
    {id: "science", name: "วิทยาศาสตร์", icon: "🔬", color: "#10B981"},
    {id: "social", name: "สังคมศึกษา", icon: "🌏", color: "#F59E0B"},
  ];

  const subjectButtons = primarySubjects.map((s) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {type: "text", text: s.icon, size: "xl", flex: 0},
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: s.name, weight: "bold", size: "md", color: s.color},
          {type: "text", text: `เนื้อหาระดับ ${grade}`, size: "xs", color: "#666666"},
        ],
        paddingStart: "12px",
        flex: 3,
      },
      {type: "text", text: "▶", size: "lg", color: s.color, align: "end", flex: 1},
    ],
    paddingAll: "12px",
    backgroundColor: "#F8FAFC",
    cornerRadius: "md",
    margin: "sm",
    action: {type: "message", text: `/tutor explain สอน${s.name} ${grade}`},
  }));

  return {
    type: "flex",
    altText: `📚 วิชา ${grade}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: `📚 ${grade} - เลือกวิชา`, weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: `ระดับ: ${gradeInfo.complexity} | อายุ ${gradeInfo.ageRange}`, size: "sm", color: "#FDF4FF"},
        ],
        backgroundColor: "#EC4899",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "📖 เลือกวิชาที่ต้องการเรียน:", weight: "bold", size: "md", color: "#EC4899"},
          {type: "separator", margin: "md"},
          {type: "box", layout: "vertical", contents: subjectButtons, margin: "md"},
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {type: "button", action: {type: "message", label: "◀ เปลี่ยนชั้น", text: "/edu primary"}, style: "secondary", height: "sm", flex: 1},
          {type: "button", action: {type: "message", label: "💬 ถาม WiT", text: `/tutor explain สอน ${grade}`}, style: "primary", color: "#16A34A", height: "sm", flex: 1, margin: "sm"},
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้างเมนูวิชาตามระดับการศึกษา
 */
function createSubjectsMenuFlex(levelId) {
  const level = EDUCATION_LEVELS[levelId];
  if (!level) return null;

  // กรองวิชาเฉพาะระดับนั้น
  const subjectsForLevel = Object.values(SUBJECTS).filter((s) => s.levels.includes(levelId));

  const subjectButtons = subjectsForLevel.map((subject) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {type: "text", text: subject.icon, size: "lg", flex: 0},
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: subject.name, weight: "bold", size: "sm", color: "#333333"},
          {type: "text", text: subject.nameEn, size: "sm", color: "#666666"},
        ],
        paddingStart: "12px",
        flex: 3,
      },
      {
        type: "text",
        text: "▶",
        size: "lg",
        color: level.color,
        align: "end",
        flex: 1,
      },
    ],
    paddingAll: "12px",
    backgroundColor: "#F8FAFC",
    cornerRadius: "md",
    margin: "sm",
    action: {type: "message", text: `/edu ${levelId} ${subject.id}`},
  }));

  return {
    type: "flex",
    altText: `${level.icon} ${level.name}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: `${level.icon} ${level.name}`, weight: "bold", size: "lg", color: "#FFFFFF"},
          {type: "text", text: level.nameEn, size: "sm", color: "#DBEAFE"},
        ],
        backgroundColor: level.color,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "เลือกวิชาที่ต้องการเรียน:", weight: "bold", size: "sm", color: level.color},
          {type: "separator", margin: "md"},
          {
            type: "box",
            layout: "vertical",
            contents: subjectButtons,
            margin: "md",
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
            action: {type: "message", label: "◀ กลับเมนูหลัก", text: "/edu"},
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

/**
 * สร้างรายการหน่วยการเรียน
 */
function createCourseUnitsFlex(courseId) {
  const course = COURSES[courseId];
  if (!course) return null;

  const level = EDUCATION_LEVELS[course.level];
  const subject = SUBJECTS[course.subject];

  const unitBoxes = course.units.map((unit, idx) => ({
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: `${idx + 1}`,
            size: "lg",
            weight: "bold",
            color: "#FFFFFF",
            align: "center",
            flex: 0,
            backgroundColor: level.color,
            cornerRadius: "md",
            paddingAll: "8px",
            width: "35px",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: unit.title, weight: "bold", size: "sm", color: "#333333", wrap: true},
              {type: "text", text: `${unit.topics.length} หัวข้อ`, size: "sm", color: "#666666", margin: "sm"},
            ],
            paddingStart: "12px",
            flex: 3,
          },
          {
            type: "button",
            action: {type: "message", label: "เรียน", text: `/edu learn ${courseId} ${unit.id}`},
            style: "primary",
            color: level.color,
            height: "sm",
            flex: 1,
            margin: "sm",
          },
        ],
        alignItems: "center",
      },
      {
        type: "box",
        layout: "vertical",
        contents: unit.topics.slice(0, 3).map((topic) => ({
          type: "text",
          text: `• ${topic}`,
          size: "sm",
          color: "#666666",
          margin: "xs",
        })),
        margin: "md",
        paddingStart: "47px",
      },
    ],
    paddingAll: "12px",
    backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
    margin: "sm",
    cornerRadius: "md",
  }));

  return {
    type: "flex",
    altText: `${subject.icon} ${course.title}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: `${subject.icon} ${course.title}`, weight: "bold", size: "lg", color: "#FFFFFF"},
          {type: "text", text: `${level.name} | ${course.grade}`, size: "sm", color: "#DBEAFE"},
        ],
        backgroundColor: level.color,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "หน่วยการเรียน:", weight: "bold", size: "sm", color: level.color},
          {type: "separator", margin: "md"},
          {
            type: "box",
            layout: "vertical",
            contents: unitBoxes,
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "📝 แบบทดสอบ", text: `/edu quiz ${courseId}`},
                style: "primary",
                color: "#16A34A",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "◀ กลับ", text: `/edu ${course.level}`},
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

/**
 * สร้างเมนู AI Tutor
 */
function createAITutorMenuFlex() {
  const modeButtons = Object.values(AI_TUTOR_MODES).map((mode) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: mode.name, weight: "bold", size: "md", color: "#333333"},
          {type: "text", text: mode.description, size: "sm", color: "#555555", wrap: true},
        ],
        flex: 4,
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "▶", size: "lg", color: "#16A34A", align: "center"},
        ],
        flex: 1,
        justifyContent: "center",
      },
    ],
    paddingAll: "12px",
    backgroundColor: "#F8FAFC",
    cornerRadius: "md",
    margin: "sm",
    action: {type: "message", text: `/tutor ${mode.mode}`},
  }));

  return {
    type: "flex",
    altText: "💬 WiT Tutor - ติวเตอร์ส่วนตัว",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "💬 WiT Tutor", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: "ติวเตอร์ส่วนตัวของคุณ", size: "sm", color: "#D1FAE5"},
        ],
        backgroundColor: "#16A34A",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "เลือกโหมดการเรียนรู้:", weight: "bold", size: "md", color: "#16A34A"},
          {type: "separator", margin: "md"},
          {
            type: "box",
            layout: "vertical",
            contents: modeButtons,
            margin: "md",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "💡 พิมพ์คำถามหรือเนื้อหาที่ต้องการถาม WiT ได้เลย!",
            size: "sm",
            color: "#555555",
            wrap: true,
            align: "center",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

/**
 * 🆕 สร้างเมนูเครื่องมือช่วยเรียนทันสมัย - แบ่งตามหมวดหมู่
 */
function createStudyToolsMenuFlex() {
  // จัดกลุ่มเครื่องมือตามหมวดหมู่
  const categories = {
    ai: {name: "🤖 AI Tools", color: "#8B5CF6", tools: []},
    productivity: {name: "⏳ Productivity", color: "#F59E0B", tools: []},
    learning: {name: "📚 Learning", color: "#10B981", tools: []},
    lab: {name: "🧪 Lab & Calc", color: "#3B82F6", tools: []},
    game: {name: "🎮 Gamification", color: "#EC4899", tools: []},
  };

  // จัดกลุ่มเครื่องมือ
  Object.values(STUDY_TOOLS).forEach((tool) => {
    if (categories[tool.category]) {
      categories[tool.category].tools.push(tool);
    }
  });

  // สร้าง Carousel ของหมวดหมู่
  const categoryBubbles = Object.values(categories).map((cat) => ({
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {type: "text", text: cat.name, weight: "bold", size: "md", color: "#FFFFFF"},
      ],
      backgroundColor: cat.color,
      paddingAll: "15px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: cat.tools.slice(0, 4).map((tool) => ({
        type: "box",
        layout: "horizontal",
        contents: [
          {type: "text", text: tool.icon, size: "md", flex: 0},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: tool.name.replace(/^[^\s]+\s/, ""), weight: "bold", size: "xs", color: "#333333"},
              {type: "text", text: tool.description.substring(0, 25) + "...", size: "xxs", color: "#666666", wrap: false},
            ],
            paddingStart: "8px",
            flex: 3,
          },
          {type: "text", text: tool.premium ? "👑" : "▶", size: "sm", color: cat.color, align: "end", flex: 0},
        ],
        paddingAll: "8px",
        backgroundColor: "#F8FAFC",
        cornerRadius: "sm",
        margin: "sm",
        action: {type: "message", text: tool.command},
      })),
      paddingAll: "12px",
      spacing: "xs",
    },
  }));

  return {
    type: "flex",
    altText: "🧮 เครื่องมือช่วยเรียน - Study Tools",
    contents: {
      type: "carousel",
      contents: categoryBubbles,
    },
  };
}

/**
 * 🆕 สร้าง Quick Tools Menu สำหรับเข้าถึงเร็ว
 */
function createQuickToolsMenuFlex() {
  const quickTools = [
    {icon: "🃏", name: "Flashcard", cmd: "/tool flashcard", color: "#8B5CF6"},
    {icon: "📋", name: "สรุปให้", cmd: "/tool summary", color: "#10B981"},
    {icon: "🎯", name: "สร้างข้อสอบ", cmd: "/tool quiz", color: "#F59E0B"},
    {icon: "🍅", name: "Pomodoro", cmd: "/tool pomodoro", color: "#EF4444"},
    {icon: "🗺️", name: "Mind Map", cmd: "/tool mindmap", color: "#3B82F6"},
    {icon: "🌏", name: "แปลภาษา", cmd: "/tool translate", color: "#EC4899"},
  ];

  const toolButtons = quickTools.map((t) => ({
    type: "box",
    layout: "vertical",
    contents: [
      {type: "text", text: t.icon, size: "xxl", align: "center"},
      {type: "text", text: t.name, size: "xs", align: "center", color: "#333333", weight: "bold"},
    ],
    backgroundColor: "#FFFFFF",
    cornerRadius: "lg",
    paddingAll: "12px",
    borderWidth: "2px",
    borderColor: t.color,
    action: {type: "message", text: t.cmd},
  }));

  return {
    type: "flex",
    altText: "⚡ Quick Tools",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "⚡ Quick Study Tools", weight: "bold", size: "lg", color: "#FFFFFF"},
          {type: "text", text: "เครื่องมือยอดนิยม เข้าถึงเร็ว", size: "sm", color: "#DBEAFE"},
        ],
        backgroundColor: "#1E40AF",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: toolButtons.slice(0, 3),
            spacing: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: toolButtons.slice(3, 6),
            spacing: "md",
            margin: "md",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {type: "button", action: {type: "message", label: "📚 ดูทั้งหมด", text: "/tools all"}, style: "primary", color: "#1E40AF", height: "sm", flex: 1},
          {type: "button", action: {type: "message", label: "💬 ถาม WiT", text: "/tutor"}, style: "secondary", height: "sm", flex: 1, margin: "sm"},
        ],
        paddingAll: "15px",
      },
    },
  };
}

// =====================================================
// 🔍 SEARCH & RECOMMENDATION - ค้นหาและแนะนำ
// =====================================================

/**
 * ค้นหาคอร์สตามคำค้น
 */
function searchCourses(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  Object.values(COURSES).forEach((course) => {
    const subject = SUBJECTS[course.subject];
    if (
      course.title.toLowerCase().includes(lowerQuery) ||
      subject.name.toLowerCase().includes(lowerQuery) ||
      subject.nameEn.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        ...course,
        subjectName: subject.name,
        subjectIcon: subject.icon,
      });
    }
  });

  return results;
}

/**
 * แนะนำคอร์สตามระดับและความสนใจ
 */
function recommendCourses(level, interests = []) {
  const recommended = [];

  Object.values(COURSES).forEach((course) => {
    if (course.level === level) {
      const subject = SUBJECTS[course.subject];
      let score = 1;

      // เพิ่มคะแนนถ้าตรงกับความสนใจ
      interests.forEach((interest) => {
        if (subject.name.includes(interest) || subject.nameEn.toLowerCase().includes(interest.toLowerCase())) {
          score += 2;
        }
      });

      recommended.push({
        ...course,
        subjectName: subject.name,
        subjectIcon: subject.icon,
        score,
      });
    }
  });

  // เรียงตามคะแนน
  return recommended.sort((a, b) => b.score - a.score);
}

// =====================================================
// 🤖 AI EDUCATION PROMPTS - Prompt สำหรับ AI ตอบคำถามการศึกษา
// =====================================================

/**
 * สร้าง System Prompt สำหรับ AI Tutor ตามระดับการศึกษา
 */
function getEducationSystemPrompt(level, subject, mode = "general", grade = null) {
  const levelInfo = EDUCATION_LEVELS[level];
  const subjectInfo = SUBJECTS[subject];

  // 🌟 รองรับทุกระดับ: เด็ก, วัยรุ่น, วัยทำงาน
  // ✅ ตรวจจับ context พิเศษสำหรับคอมพิวเตอร์ที่รองรับทุกระดับ
  const isComputerTech = subject === "computerTech" || subject === "programming";
  
  const allowedLevels = ["primary", "secondary", "vocational", "university"];
  const effectiveLevel = allowedLevels.includes(level) ? level : (isComputerTech ? "general" : "secondary");

  // 🎯 Prompt เฉพาะระดับชั้น ป.1-ป.6 (ระดับความยากต่างกัน)
  const primaryGradePrompts = {
    "ป.1": `👶 **ระดับ ป.1 (อายุ 6-7 ปี) - เริ่มต้น**
- ใช้คำง่ายๆ ประโยคสั้นมาก (ไม่เกิน 10 คำ)
- ใช้รูปภาพ Emoji เยอะๆ 🎨🌈✨
- ยกตัวอย่างจากของเล่น สัตว์ ผลไม้
- ชมเชยทุกครั้ง "เก่งมาก!" "ดีมากเลย!"
- ทวนซ้ำเนื้อหาสำคัญ
- ใช้การนับ 1-20, ตัวอักษร ก-ฮ, A-Z`,

    "ป.2": `🧒 **ระดับ ป.2 (อายุ 7-8 ปี) - พื้นฐาน**
- ประโยคสั้น ชัดเจน เข้าใจง่าย
- ยกตัวอย่างจากบ้าน โรงเรียน ครอบครัว
- ใช้ Emoji ช่วยอธิบาย 📚✏️🎒
- สูตรคูณ 2-5, การอ่านเขียนคำง่าย
- ให้กำลังใจและชมเชย`,

    "ป.3": `📖 **ระดับ ป.3 (อายุ 8-9 ปี) - พื้นฐาน+**
- อธิบายเป็นขั้นตอน 1-2-3
- ยกตัวอย่างจากเรื่องรอบตัว
- สูตรคูณ 2-12, เศษส่วนง่ายๆ
- หลักภาษา: ตัวสะกด วรรณยุกต์
- เริ่มฝึกการคิดวิเคราะห์ง่ายๆ`,

    "ป.4": `📚 **ระดับ ป.4 (อายุ 9-10 ปี) - กลาง**
- อธิบายเนื้อหาพร้อมเหตุผล
- เริ่มใช้ศัพท์เฉพาะทาง พร้อมอธิบายความหมาย
- เศษส่วน ทศนิยม สมการง่ายๆ
- การอ่านจับใจความ เขียนเรียงความ
- ประวัติศาสตร์ ภูมิศาสตร์ไทย`,

    "ป.5": `🎓 **ระดับ ป.5 (อายุ 10-11 ปี) - กลาง+**
- อธิบายเชิงลึกขึ้น มีการเปรียบเทียบ
- ร้อยละ อัตราส่วน พื้นที่-ปริมาตร
- Tenses ภาษาอังกฤษ (Past, Future)
- วิทยาศาสตร์: พันธุกรรม ไฟฟ้า
- เริ่มฝึกการวิเคราะห์-สังเคราะห์`,

    "ป.6": `🏆 **ระดับ ป.6 (อายุ 11-12 ปี) - ท้าทาย**
- เตรียมสอบ O-NET เน้นเนื้อหาสำคัญ
- สมการ อสมการ สถิติเบื้องต้น
- Reading Comprehension, Paragraph Writing
- ระบบนิเวศ โลกและอวกาศ
- ประวัติศาสตร์สมัยใหม่ เศรษฐศาสตร์
- ฝึกคิดวิเคราะห์ แก้ปัญหา`,
  };

  const levelPrompts = {
    primary: grade && primaryGradePrompts[grade] ?
      primaryGradePrompts[grade] :
      `คุณเป็นครูประถมศึกษาที่ใจดีและอดทน สอนเด็กระดับ ป.1-ป.6 (อายุ 6-12 ปี)
- ใช้ภาษาง่ายๆ ประโยคสั้น ชัดเจน
- ยกตัวอย่างจากชีวิตประจำวัน สิ่งที่เด็กคุ้นเคย
- ใช้ Emoji และรูปภาพช่วยอธิบาย 🎨
- ชมเชยและให้กำลังใจเสมอ
- แบ่งเนื้อหาเป็นขั้นตอนง่ายๆ`,

    secondary: `คุณเป็นครูมัธยมศึกษาที่เชี่ยวชาญ สอนนักเรียน ม.1-ม.6 (อายุ 12-18 ปี)
- ม.1-ม.3: อธิบายทฤษฎี เชื่อมโยงกับ O-NET ม.3 เตรียมสอบเข้า ม.4
- ม.4-ม.6: เนื้อหาลึก เตรียมสอบเข้ามหาวิทยาลัย เน้นการคิดวิเคราะห์ขั้นสูง
- สอนเทคนิคการทำโจทย์ กระตุ้นให้คิดวิเคราะห์
- ยกตัวอย่างจากสถานการณ์จริง`,

    vocational: `🔧 คุณเป็นอาจารย์อาชีวศึกษาที่มีประสบการณ์ สอนนักเรียน ปวช./ปวส. (อายุ 15-20 ปี)
- เน้นทักษะปฏิบัติ (Hands-on) และการประยุกต์ใช้จริง
- อธิบายทฤษฎีร่วมกับการใช้งานในโลกอุตสาหกรรม
- สอนความปลอดภัย มาตรฐานการทำงาน
- เตรียมความพร้อมสู่โลกการทำงาน
- วิชาเทคนิค: คอมพิวเตอร์, อิเล็กทรอนิกส์, เทคโนโลยี`,

    university: `🎓 คุณเป็นอาจารย์มหาวิทยาลัยที่เชี่ยวชาญ สอนนักศึกษา ปริญญาตรี/โท (อายุ 18+ ปี)
- อธิบายแนวคิดเชิงลึก ทฤษฎีขั้นสูง
- เชื่อมโยงกับงานวิจัย อุตสาหกรรม เทคโนโลยีใหม่
- กระตุ้นการคิดวิเคราะห์ วิจารณ์ สังเคราะห์
- เน้นการเรียนรู้แบบ Active Learning
- วิชาวิศวกรรม วิทยาศาสตร์ คอมพิวเตอร์ ธุรกิจ`,

    general: `💼 คุณเป็นผู้เชี่ยวชาญที่ปรับการสอนให้เหมาะกับทุกวัย (Lifelong Learning)
- เด็ก (6-12 ปี): ภาษาง่าย emoji เยอะ ยกตัวอย่างจากชีวิตประจำวัน
- วัยรุ่น (12-18 ปี): ทฤษฎี+ปฏิบัติ เชื่อมโยงการสอบ เทคนิคการเรียน
- วัยทำงาน (18+ ปี): เชิงลึก อุตสาหกรรม upskilling/reskilling แนวคิดใหม่
- ปรับภาษาและเนื้อหาตามบริบทของผู้เรียน`,
  };

  const modePrompts = {
    explain: "โหมดอธิบายเนื้อหา: อธิบายละเอียด ยกตัวอย่าง ทำให้เข้าใจง่าย",
    practice: "โหมดฝึกทำโจทย์: สร้างโจทย์ฝึกหัด อธิบายวิธีทำทีละขั้นตอน",
    exam: "โหมดเตรียมสอบ: สรุปประเด็นสำคัญ ข้อสอบแนวข้อสอบ เทคนิคการทำข้อสอบ",
    homework: "โหมดช่วยการบ้าน: ช่วยแนะนำวิธีคิด ไม่ทำให้แต่สอนวิธี",
    project: "โหมดทำโครงงาน: แนะนำขั้นตอน แหล่งข้อมูล วิธีนำเสนอ",
    general: "โหมดทั่วไป: ตอบคำถามและช่วยเหลือตามที่ร้องขอ",
  };

  return `🎓 **WiT Tutor - ติวเตอร์สำหรับทุกวัย (Lifelong Learning)**

${levelPrompts[effectiveLevel] || levelPrompts.general}

${subjectInfo ? `📚 วิชา: ${subjectInfo.name} (${subjectInfo.nameEn})` : ""}
${grade ? `📊 ระดับชั้น: ${grade}` : ""}
${modePrompts[mode] || modePrompts.general}

📌 **หลักการตอบ:**
1. ตอบเป็นภาษาไทยที่เข้าใจง่าย เหมาะกับระดับและวัยของผู้เรียน
2. จัดรูปแบบให้อ่านง่าย ใช้หัวข้อ bullet points
3. ยกตัวอย่างประกอบเสมอ (เหมาะกับบริบทของผู้เรียน)
4. ถ้าไม่แน่ใจ ให้บอกตรงๆ และแนะนำแหล่งข้อมูลเพิ่มเติม
5. กระตุ้นให้ผู้เรียนคิดต่อยอดและลงมือปฏิบัติ
6. ใช้ Emoji ให้เหมาะสมกับระดับผู้เรียน

✅ **ขอบเขตการตอบ:**
- เด็ก (ป.1-ป.6): วิชาพื้นฐาน คณิต ไทย อังกฤษ วิทย์ สังคม
- วัยรุ่น (ม.1-ม.6): วิชาสามัญขั้นสูง ฟิสิกส์ เคมี ชีววิทยา เตรียมสอบ
- อาชีวะ (ปวช-ปวส): วิชาเทคนิค คอมพิวเตอร์ อิเล็กทรอนิกส์ เทคโนโลยี
- วัยทำงาน (มหาวิทยาลัย+): upskilling/reskilling การเขียนโปรแกรม วิศวกรรม ธุรกิจ

⚠️ **ข้อจำกัด:**
- ไม่ตอบเรื่องการฉีดพลาสติก หรืออุตสาหกรรมเฉพาะทางที่ไม่เกี่ยวกับการศึกษา`;
}

/**
 * สร้าง Prompt สำหรับ AI ตอบคำถามเฉพาะวิชา
 */
function createSubjectPrompt(subject, topic, userQuestion) {
  const subjectPrompts = {
    // วิชาสามัญ
    thai: `📜 วิชาภาษาไทย: เน้นหลักภาษา การอ่าน การเขียน วรรณคดี`,
    math: `🔢 วิชาคณิตศาสตร์: อธิบายสูตร วิธีคิด ทำโจทย์ทีละขั้นตอน`,
    science: `🔬 วิชาวิทยาศาสตร์: อธิบายหลักการ การทดลอง ปรากฏการณ์ธรรมชาติ`,
    social: `🌏 วิชาสังคมศึกษา: ประวัติศาสตร์ ภูมิศาสตร์ หน้าที่พลเมือง เศรษฐศาสตร์`,
    english: `🇬🇧 วิชาภาษาอังกฤษ: Grammar, Vocabulary, Reading, Writing`,

    // วิทยาศาสตร์เฉพาะทาง
    physics: `⚡ วิชาฟิสิกส์: กลศาสตร์ ไฟฟ้า แม่เหล็ก คลื่น อะตอม`,
    chemistry: `⚗️ วิชาเคมี: ธาตุ สารประกอบ ปฏิกิริยาเคมี สมดุล`,
    biology: `🧬 วิชาชีววิทยา: เซลล์ พันธุกรรม วิวัฒนาการ ระบบร่างกาย`,

    // สายอาชีวะ
    mechanical: `⚙️ ช่างกลโรงงาน: งานกลึง งานไส งานเชื่อม การอ่านแบบ`,
    electrical: `💡 ช่างไฟฟ้า: วงจรไฟฟ้า กฎของโอห์ม การเดินสาย ความปลอดภัย`,
    electronics: `📡 ช่างอิเล็กทรอนิกส์: วงจร IC ไมโครคอนโทรลเลอร์ เซนเซอร์`,
    automotive: `🚗 ช่างยนต์: เครื่องยนต์ ระบบส่งกำลัง เบรก ไฟฟ้ารถยนต์`,
    construction: `🏗️ ช่างก่อสร้าง: โครงสร้าง วัสดุก่อสร้าง การประมาณราคา`,
    computerTech: `💻 คอมพิวเตอร์: Hardware, Software, Network, Programming`,
    accounting: `📊 การบัญชี: บันทึกบัญชี งบการเงิน ภาษี ต้นทุน`,

    // ปริญญาตรี
    engineering: `👷 วิศวกรรมศาสตร์: Calculus, Physics, Engineering Drawing, Programming`,
    business: `💼 บริหารธุรกิจ: การจัดการ การตลาด การเงิน ทรัพยากรบุคคล`,
    programming: `👨‍💻 วิทยาการคอมพิวเตอร์: Data Structures, Algorithms, OOP, Web Dev`,
  };

  return `${subjectPrompts[subject] || "📚 วิชาทั่วไป"}

📖 หัวข้อ: ${topic || "ทั่วไป"}

❓ คำถาม: ${userQuestion}

กรุณาตอบคำถามอย่างละเอียด เข้าใจง่าย พร้อมยกตัวอย่างประกอบ`;
}

/**
 * ตรวจจับระดับการศึกษาและวิชาจากข้อความ
 */
function detectEducationContext(message) {
  const msgLower = message.toLowerCase();

  // 🌟 ตรวจจับระดับทุกวัย (เด็ก, วัยรุ่น, วัยทำงาน)
  let level = null;
  let grade = null;

  // 🎯 ตรวจจับระดับชั้นประถม (ป.1-ป.6) แบบละเอียด
  const primaryGrades = ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"];
  for (const g of primaryGrades) {
    if (msgLower.includes(g) || msgLower.includes(g.replace(".", ""))) {
      level = "primary";
      grade = g;
      break;
    }
  }

  // ถ้าพูดถึง "ประถม" หรือ "เด็ก" แต่ไม่ระบุชั้น
  if (!grade && (msgLower.includes("ประถม") || msgLower.includes("เด็ก"))) {
    level = "primary";
    grade = null; // ให้เลือกชั้นเอง
  }

  // 🎯 ตรวจจับระดับชั้นมัธยมต้น (ม.1-ม.3)
  const secondaryGrades = ["ม.1", "ม.2", "ม.3"];
  for (const g of secondaryGrades) {
    if (msgLower.includes(g) || msgLower.includes(g.replace(".", ""))) {
      level = "secondary";
      grade = g;
      break;
    }
  }

  // ถ้าพูดถึง "มัธยม" หรือ "มัธยมต้น" แต่ไม่ระบุชั้น
  if (!grade && (msgLower.includes("มัธยมต้น") || (msgLower.includes("มัธยม") && !msgLower.includes("มัธยมปลาย")))) {
    level = "secondary";
    grade = null;
  }

  // ✅ รองรับทุกระดับแล้ว - ไม่ต้อง filter ออก

  // ตรวจจับวิชา
  let subject = null;
  const subjectKeywords = {
    thai: ["ภาษาไทย", "ไวยากรณ์", "วรรณคดี", "การอ่าน", "เขียน", "พยัญชนะ", "สระ", "วรรณยุกต์"],
    math: ["คณิต", "เลข", "สมการ", "พีชคณิต", "เรขา", "แคลคูลัส", "สูตร", "บวก", "ลบ", "คูณ", "หาร", "เศษส่วน", "ทศนิยม", "ร้อยละ"],
    science: ["วิทย์", "วิทยาศาสตร์", "การทดลอง", "ร่างกาย", "พืช", "สัตว์", "พลังงาน", "วงจรชีวิต"],
    physics: ["ฟิสิกส์", "แรง", "ความเร็ว", "พลังงาน", "ไฟฟ้า", "คลื่น"],
    chemistry: ["เคมี", "ธาตุ", "สาร", "ปฏิกิริยา", "กรด", "เบส"],
    biology: ["ชีวะ", "เซลล์", "พันธุ", "ดีเอ็นเอ", "ระบบร่างกาย"],
    english: ["อังกฤษ", "english", "grammar", "vocab", "tense", "alphabet", "abc"],
    social: ["สังคม", "ประวัติ", "ภูมิศาสตร์", "เศรษฐ", "ครอบครัว", "ชุมชน", "พลเมือง"],
    mechanical: ["กลึง", "ไส", "เชื่อม", "กลโรงงาน", "cnc"],
    electrical: ["ไฟฟ้า", "วงจร", "โอห์ม", "เบรกเกอร์"],
    electronics: ["อิเล็ก", "ไอซี", "ไมโคร", "เซนเซอร์", "arduino"],
    automotive: ["รถยนต์", "เครื่องยนต์", "เกียร์", "เบรก", "ช่างยนต์"],
    computerTech: ["คอม", "โปรแกรม", "เขียนโค้ด", "python", "java", "web"],
    accounting: ["บัญชี", "งบ", "ภาษี", "ต้นทุน", "กำไร"],
    programming: ["coding", "algorithm", "data structure", "oop"],
  };

  for (const [subj, keywords] of Object.entries(subjectKeywords)) {
    if (keywords.some((kw) => msgLower.includes(kw))) {
      subject = subj;
      break;
    }
  }

  return {level, subject, grade}; // 🆕 เพิ่ม grade
}

/**
 * ตรวจสอบว่าเป็นคำถามเกี่ยวกับการศึกษาหรือไม่
 */
function isEducationQuestion(message) {
  const msgLower = message.toLowerCase();

  // ❌ กรองเฉพาะเรื่องที่ไม่เกี่ยวกับการศึกษา - ให้ไปตอบทาง AI อื่น
  const excludedKeywords = [
    "ฉีดพลาสติก", "พลาสติก", "โมลด์", "mold", "injection", "แม่พิมพ์",
    "defect", "short shot", "flash", "sink mark", "warpage",
  ];

  // ถ้ามีคำที่ห้าม ให้ return false
  if (excludedKeywords.some((kw) => msgLower.includes(kw))) {
    return false;
  }

  // 🔧 เพิ่ม: คำที่ไม่ใช่ education context (false positive) - กรองคำถามทั่วไป
  const falsePositivePatterns = [
    // คำทดสอบระบบ
    "ทดสอบ", "ทดสอบระบบ", "test", "testing", "ทดลอง",
    // คำทักทาย/สนทนาทั่วไป
    "สวัสดี", "hello", "hi", "หวัดดี", "ดีครับ", "ดีค่ะ",
    // คำถามทั่วไปไม่มีบริบทการศึกษา
    "อยากถามเพิ่ม", "ขอถามหน่อย", "ถามอะไรดี", "ถามได้ไหม",
    // คำถามเกี่ยวกับระบบ/บริการ
    "แก้ไข", "แก้บัค", "debug", "error", "ช่วยเหลือ",
    // คำถามภาษาต่างประเทศทั่วไป (ไม่ใช่วิชาภาษา)
    "ภาษาญี่ปุ่น", "ญี่ปุ่น", "ภาษาจีน", "จีน", "ภาษาเกาหลี", "เกาหลี",
    "ภาษาฝรั่งเศส", "ฝรั่งเศส", "ภาษาเยอรมัน", "เยอรมัน",
    // คำถามเกี่ยวกับเวลา/วันที่
    "วันนี้", "กี่โมง", "วันพระ", "วันหยุด",
    // คำทั่วไปที่ทำให้เข้าใจผิด
    "ตอบคำถาม", "พร้อมตอบ", "ตอบได้",
  ];

  if (falsePositivePatterns.some((kw) => msgLower.includes(kw))) {
    return false;
  }

  // ✅ ต้องมีคำที่บ่งชี้ระดับการศึกษาชัดเจน (ป.1-ม.6)
  const levelKeywords = [
    "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6", "ประถม",
    "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6", "มัธยมต้น", "มัธยมปลาย", "มัธยม",
    "ปวช", "ปวส", "อาชีวะ",
    "มหาลัย", "มหาวิทยาลัย", "university", "ปริญญา",
  ];

  // ถ้ามีระดับชั้นชัดเจน ให้ return true เลย
  if (levelKeywords.some((kw) => msgLower.includes(kw))) {
    return true;
  }

  // ✅ วิชาเรียนที่ชัดเจน (ต้องมีคำว่า "วิชา" หรือ "เรียน" + ชื่อวิชา)
  const subjectKeywords = [
    "วิชาคณิต", "วิชาเลข", "วิชาวิทย์", "วิชาวิทยาศาสตร์",
    "วิชาภาษาไทย", "วิชาภาษาอังกฤษ", "วิชาอังกฤษ",
    "วิชาสังคม", "วิชาประวัติศาสตร์", "วิชาภูมิศาสตร์",
    "วิชาพลศึกษา", "วิชาสุขศึกษา", "วิชาศิลปะ", "วิชาดนตรี", "วิชาการงาน",
    "เรียนคณิต", "เรียนเลข", "เรียนวิทย์", "เรียนวิทยาศาสตร์",
    "เรียนภาษาไทย", "เรียนภาษาอังกฤษ", "เรียนอังกฤษ",
  ];

  if (subjectKeywords.some((kw) => msgLower.includes(kw))) {
    return true;
  }

  // ✅ คำที่เกี่ยวกับการเรียนในโรงเรียนอย่างชัดเจน
  const schoolContextKeywords = [
    "ข้อสอบ", "การบ้าน", "โจทย์เลข", "โจทย์คณิต", "สูตรคณิต",
    "บทเรียน", "o-net", "gat", "pat", "เตรียมสอบ",
    "ติวเตอร์", "ติวสอบ", "ครูสอน",
  ];

  if (schoolContextKeywords.some((kw) => msgLower.includes(kw))) {
    return true;
  }

  // ❌ คำทั่วไปเช่น "คำถาม", "ถาม", "อธิบาย", "ช่วย" ไม่ถือว่าเป็น education context อีกต่อไป
  // เพื่อป้องกัน false positive
  return false;
}

/**
 * สร้าง Flex Message สำหรับ Study Tools แต่ละตัว
 * ออกแบบใหม่ให้มีขั้นตอน แนวทาง และตัวอย่างคำถามแบบหลอดไฟ 💡
 */
function createToolResponseFlex(toolId, userContext = {}) {
  // Map toolId ที่อาจเป็นชื่ออื่นให้ตรงกับ key ใน toolResponses
  const toolIdMap = {
    "flashcard": "flashcards", "aiflashcard": "flashcards", "aiFlashcard": "flashcards",
    "summary": "aiSummary", "aisummary": "aiSummary",
    "mindmap": "mindmap", "aiMindMap": "mindmap", "aimindmap": "mindmap",
    "quiz": "quiz", "aiQuizGen": "quiz", "aiquizgen": "quiz",
    "pomodoro": "pomodoro", "timer": "pomodoro",
    "studyPlanner": "studyPlanner", "planner": "studyPlanner",
    "goalTracker": "goalTracker", "goal": "goalTracker",
    "formulaHelper": "formulaHelper", "formula": "formulaHelper",
    "translator": "translator", "translate": "translator",
    "dictionary": "dictionary", "dict": "dictionary",
    "virtualLab": "virtualLab", "lab": "virtualLab",
    "calculator": "calculator", "calc": "calculator",
    "quizBattle": "quizBattle", "battle": "quizBattle",
  };

  const mappedToolId = toolIdMap[toolId] || toolId;

  const toolResponses = {
    flashcards: {
      type: "flex",
      altText: "🃏 Flashcards - บัตรคำช่วยจำ",
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
                {type: "text", text: "🃏", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Flashcards", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "บัตรคำช่วยจำ - เรียนรู้ได้ง่ายกว่า!", size: "sm", color: "#E9D5FF"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#8B5CF6",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            // ขั้นตอนการใช้งาน
            {type: "text", text: "📋 ขั้นตอนการใช้งาน", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "1️⃣ เลือกวิชาหรือหัวข้อที่ต้องการ", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "2️⃣ AI จะสร้างบัตรคำ 10-15 ใบ", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "3️⃣ ท่องจำด้านหน้า → ตอบด้านหลัง", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "4️⃣ ทบทวนบ่อยๆ จะจำได้แม่น!", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            // ไอเดียหลอดไฟ
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างคำถาม", weight: "bold", size: "md", color: "#8B5CF6", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"สร้างบัตรคำศัพท์อังกฤษ เรื่องสัตว์\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"บัตรคำสูตรคณิตศาสตร์ ม.2\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"Flashcard ตารางธาตุ 20 ธาตุแรก\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"สร้างบัตรคำ คำศัพท์วิทยาศาสตร์ ป.6\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#F5F3FF",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔥 หัวข้อยอดนิยม", weight: "bold", size: "sm", color: "#333", margin: "none"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "🔤 ศัพท์ Eng", text: "สร้างบัตรคำศัพท์อังกฤษ 15 คำ"},
                  style: "primary",
                  color: "#8B5CF6",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🔢 สูตรคณิต", text: "สร้างบัตรคำสูตรคณิตม.ต้น 10 สูตร"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "🧪 ธาตุเคมี", text: "สร้างบัตรคำตารางธาตุ 20 ธาตุ"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "📜 คำไทย", text: "สร้างบัตรคำราชาศัพท์ 15 คำ"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    quiz: {
      type: "flex",
      altText: "🎯 Quiz Generator - สร้างแบบทดสอบ",
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
                {type: "text", text: "🎯", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Quiz Generator", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "สร้างแบบทดสอบอัจฉริยะ!", size: "sm", color: "#D1FAE5"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#16A34A",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "📋 ขั้นตอนการใช้งาน", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "1️⃣ ระบุวิชา ระดับชั้น และจำนวนข้อ", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "2️⃣ AI จะออกข้อสอบปรนัย 4 ตัวเลือก", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "3️⃣ ทำข้อสอบ แล้วเช็คเฉลย", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "4️⃣ อ่านคำอธิบายเพื่อเข้าใจเพิ่ม!", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างคำถาม", weight: "bold", size: "md", color: "#16A34A", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"สร้างข้อสอบคณิต ม.3 เรื่องสมการ 5 ข้อ\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"ออกข้อสอบวิทย์ ป.6 เรื่องระบบสุริยะ\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"ทำแบบทดสอบภาษาอังกฤษ Tense 10 ข้อ\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"สร้างข้อสอบ O-NET วิชาสังคม\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#ECFDF5",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔥 สร้างข้อสอบเลย!", weight: "bold", size: "sm", color: "#333"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "🔢 คณิต", text: "สร้างข้อสอบคณิตศาสตร์ ม.ต้น 5 ข้อ พร้อมเฉลยและคำอธิบาย"},
                  style: "primary",
                  color: "#16A34A",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🔬 วิทย์", text: "สร้างข้อสอบวิทยาศาสตร์ ม.ต้น 5 ข้อ พร้อมเฉลยและคำอธิบาย"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "🇬🇧 อังกฤษ", text: "สร้างข้อสอบภาษาอังกฤษ Grammar 5 ข้อ พร้อมเฉลยและคำอธิบาย"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "📜 ภาษาไทย", text: "สร้างข้อสอบภาษาไทย เรื่องหลักภาษา 5 ข้อ พร้อมเฉลย"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    calculator: {
      type: "flex",
      altText: "🧮 Smart Calculator - เครื่องคิดเลขอัจฉริยะ",
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
                {type: "text", text: "🧮", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Smart Calculator", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "คำนวณพร้อมสอนวิธีทำ!", size: "sm", color: "#FEF3C7"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#F59E0B",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "📋 ขั้นตอนการใช้งาน", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "1️⃣ พิมพ์โจทย์หรือสมการที่ต้องการ", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "2️⃣ AI จะคำนวณให้พร้อมแสดงวิธีทำ", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "3️⃣ อ่านวิธีทำทีละขั้นตอน", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "4️⃣ ลองทำโจทย์คล้ายกันด้วยตัวเอง!", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างคำถาม", weight: "bold", size: "md", color: "#F59E0B", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"คำนวณ 15% ของ 2,500 บาท\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"แก้สมการ 2x + 5 = 15\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"หาพื้นที่วงกลมรัศมี 7 เซนติเมตร\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"คำนวณดอกเบี้ยทบต้น 10,000 บาท 5% 3 ปี\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#FFFBEB",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔥 ลองคำนวณเลย!", weight: "bold", size: "sm", color: "#333"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "📏 พื้นที่", text: "คำนวณพื้นที่สี่เหลี่ยม กว้าง 8 ยาว 12 เมตร พร้อมอธิบายสูตร"},
                  style: "primary",
                  color: "#F59E0B",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "💰 เปอร์เซ็นต์", text: "คำนวณ 20% ของ 1,500 บาท พร้อมอธิบายวิธีคิด"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "📊 สมการ", text: "แก้สมการ 3x - 7 = 14 พร้อมแสดงวิธีทำทีละขั้นตอน"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "⭕ วงกลม", text: "หาพื้นที่และเส้นรอบวงของวงกลมรัศมี 5 ซม. พร้อมสูตร"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    virtualLab: {
      type: "flex",
      altText: "🧪 Virtual Lab - ห้องทดลองเสมือน",
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
                {type: "text", text: "🧪", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Virtual Lab", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "ห้องทดลองเสมือนจริง!", size: "sm", color: "#CFFAFE"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#0891B2",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "📋 สิ่งที่ทำได้", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🧪 จำลองการทดลองวิทยาศาสตร์", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "⚗️ เรียนรู้ขั้นตอนปฏิบัติการ", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "🔍 สังเกตผลการทดลอง", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "📊 วิเคราะห์และสรุปผล", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างคำถาม", weight: "bold", size: "md", color: "#0891B2", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"จำลองการทดลองแยกสีด้วยกระดาษกรอง\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"ขั้นตอนทดลองการสังเคราะห์แสง\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"วิธีทำการทดลองเรื่องความหนาแน่น\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"จำลองปฏิกิริยากรด-เบส\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#ECFEFF",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔥 เริ่มทดลองเลย!", weight: "bold", size: "sm", color: "#333"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "🧪 เคมี", text: "จำลองการทดลองปฏิกิริยาระหว่างกรดกับเบส พร้อมอธิบายขั้นตอนและผลที่เกิดขึ้น"},
                  style: "primary",
                  color: "#0891B2",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🌱 ชีวะ", text: "จำลองการทดลองเรื่องการสังเคราะห์แสงของพืช พร้อมอธิบายขั้นตอน"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "⚡ ฟิสิกส์", text: "จำลองการทดลองเรื่องวงจรไฟฟ้าอย่างง่าย พร้อมอธิบายหลักการ"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🌏 โลก", text: "จำลองการทดลองเรื่องวัฏจักรน้ำ พร้อมอธิบายแต่ละขั้นตอน"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    mindmap: {
      type: "flex",
      altText: "🗺️ Mind Map - แผนผังความคิด",
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
                {type: "text", text: "🗺️", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Mind Map", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "สร้างแผนผังความคิดอัตโนมัติ!", size: "sm", color: "#FCE7F3"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#EC4899",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "📋 ประโยชน์ของ Mind Map", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🎯 จัดระเบียบความคิดได้ชัดเจน", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "📚 สรุปเนื้อหาบทเรียนง่ายขึ้น", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "🧠 จำได้แม่นยำกว่าเดิม", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "✨ เห็นความเชื่อมโยงของเนื้อหา", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างคำถาม", weight: "bold", size: "md", color: "#EC4899", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"สร้าง Mind Map เรื่องระบบสุริยะ\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"Mind Map สรุปสงครามโลกครั้งที่ 2\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"แผนผังความคิด เรื่องระบบนิเวศ\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"สร้าง Mind Map สรุป Tense ภาษาอังกฤษ\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#FDF2F8",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔥 สร้าง Mind Map เลย!", weight: "bold", size: "sm", color: "#333"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "🌏 ระบบสุริยะ", text: "สร้าง Mind Map เรื่องระบบสุริยะ แสดงโครงสร้างดาวเคราะห์ทั้ง 8 ดวง"},
                  style: "primary",
                  color: "#EC4899",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🌿 ระบบนิเวศ", text: "สร้าง Mind Map เรื่องระบบนิเวศ แสดงความสัมพันธ์ของสิ่งมีชีวิต"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "📜 ประวัติศาสตร์", text: "สร้าง Mind Map สรุปประวัติศาสตร์ไทยสมัยสุโขทัย"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🇬🇧 Tenses", text: "สร้าง Mind Map สรุป Tense ภาษาอังกฤษทั้ง 12 Tenses"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    studyPlanner: {
      type: "flex",
      altText: "📅 Study Planner - วางแผนการเรียน",
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
                {type: "text", text: "📅", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Study Planner", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "วางแผนการเรียนอัจฉริยะ!", size: "sm", color: "#E0E7FF"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#6366F1",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "📋 AI จะช่วยวางแผน", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🗓️ จัดตารางเรียนรายวัน/รายสัปดาห์", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "🎯 กำหนดเป้าหมายที่ชัดเจน", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "⏰ แบ่งเวลาเรียนอย่างเหมาะสม", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "📊 แนะนำเทคนิคการเรียนที่ดี", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างคำถาม", weight: "bold", size: "md", color: "#6366F1", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"วางแผนเตรียมสอบ O-NET ใน 30 วัน\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"ตารางเรียนคณิตศาสตร์ 1 สัปดาห์\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"แผนทบทวนก่อนสอบปลายภาค 7 วัน\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"วางแผนเรียนภาษาอังกฤษ 1 เดือน\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#EEF2FF",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔥 วางแผนเลย!", weight: "bold", size: "sm", color: "#333"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "📝 สอบปลายภาค", text: "วางแผนเตรียมสอบปลายภาค 7 วัน ครอบคลุม 5 วิชาหลัก พร้อมเทคนิคทบทวน"},
                  style: "primary",
                  color: "#6366F1",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🎯 O-NET", text: "วางแผนเตรียมสอบ O-NET ใน 30 วัน พร้อมแบ่งหัวข้อและเทคนิคการอ่าน"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "📚 รายวัน", text: "จัดตารางเรียนรายวันสำหรับนักเรียน ม.ต้น ให้สมดุลทั้งเรียนและพักผ่อน"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🌟 เทคนิค", text: "แนะนำเทคนิคการเรียนที่มีประสิทธิภาพสำหรับนักเรียน ม.ต้น"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    // 🆕 AI Summary Tool
    aiSummary: {
      type: "flex",
      altText: "📋 AI สรุปให้ - สรุปบทเรียนใน 3 นาที",
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
                {type: "text", text: "📋", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "AI สรุปให้", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "สรุปเนื้อหาให้เข้าใจง่ายใน 3 นาที!", size: "sm", color: "#D1FAE5"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#10B981",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "✨ AI จะช่วยสรุป", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "📌 จุดสำคัญ (Key Points)", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "📝 Bullet Points กระชับ", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "💡 Key Takeaways", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "🎯 สิ่งที่ต้องจำ", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างคำถาม", weight: "bold", size: "md", color: "#10B981", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"สรุปบทเรียน สมการเชิงเส้น ม.3\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"สรุปเรื่องระบบสุริยะให้หน่อย\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"สรุป Tenses ภาษาอังกฤษทั้งหมด\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"สรุปประวัติศาสตร์สมัยอยุธยา\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#ECFDF5",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔥 สรุปเลย!", weight: "bold", size: "sm", color: "#333"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "🔢 คณิต", text: "สรุปเนื้อหาคณิตศาสตร์ ม.ต้น เรื่องสมการ ให้เข้าใจง่าย พร้อมสูตรสำคัญ"},
                  style: "primary",
                  color: "#10B981",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "🔬 วิทย์", text: "สรุปเนื้อหาวิทยาศาสตร์ เรื่องระบบสุริยะ ให้เข้าใจง่าย"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    // 🆕 Pomodoro Timer
    pomodoro: {
      type: "flex",
      altText: "🍅 Pomodoro Timer - จับเวลาเรียน",
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
                {type: "text", text: "🍅", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Pomodoro Timer", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "เรียน 25 นาที พัก 5 นาที!", size: "sm", color: "#FEE2E2"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#EF4444",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "⏳ เทคนิค Pomodoro", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "1️⃣ เรียนอย่างจดจ่อ 25 นาที", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "2️⃣ พักสั้น 5 นาที", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "3️⃣ ทำซ้ำ 4 รอบ", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "4️⃣ พักยาว 15-30 นาที", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "💪 ประโยชน์:", weight: "bold", size: "sm", color: "#EF4444"},
                {type: "text", text: "• เพิ่มสมาธิและประสิทธิภาพ", size: "xs", color: "#666", margin: "sm"},
                {type: "text", text: "• ลดความเหนื่อยล้า", size: "xs", color: "#666", margin: "xs"},
                {type: "text", text: "• จัดการเวลาได้ดีขึ้น", size: "xs", color: "#666", margin: "xs"},
              ],
              margin: "md",
              backgroundColor: "#FEF2F2",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🚀 เริ่มจับเวลา!", weight: "bold", size: "sm", color: "#333"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "button",
                  action: {type: "message", label: "▶️ เริ่มเรียน", text: "เริ่มจับเวลา Pomodoro 25 นาที เรื่องคณิตศาสตร์ แจ้งเตือนเมื่อครบเวลา"},
                  style: "primary",
                  color: "#EF4444",
                  height: "sm",
                  flex: 1,
                },
                {
                  type: "button",
                  action: {type: "message", label: "📊 สถิติ", text: "แสดงสถิติการเรียนด้วย Pomodoro ของฉัน"},
                  style: "secondary",
                  height: "sm",
                  flex: 1,
                  margin: "sm",
                },
              ],
              margin: "md",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    // 🆕 Translator Tool
    translator: {
      type: "flex",
      altText: "🌏 แปลภาษา - Translation Tool",
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
                {type: "text", text: "🌏", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "แปลภาษา", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "แปลไทย-อังกฤษ พร้อมคำอ่าน!", size: "sm", color: "#FCE7F3"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#EC4899",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🔤 ฟีเจอร์", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🇹🇭 → 🇬🇧 แปลไทย-อังกฤษ", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "🔊 คำอ่าน IPA (สัทอักษร)", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "📝 ประโยคตัวอย่าง", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "📖 คำพ้อง/คำตรงข้าม", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่าง", weight: "bold", size: "md", color: "#EC4899", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"แปล beautiful เป็นไทย\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"แปล สวัสดี เป็นอังกฤษ\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"I love learning แปลว่าอะไร\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#FDF2F8",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "button",
              action: {type: "message", label: "🇬🇧 Eng→Thai", text: "แปลคำว่า beautiful, wonderful, amazing เป็นภาษาไทย พร้อมคำอ่านและตัวอย่างประโยค"},
              style: "primary",
              color: "#EC4899",
              height: "sm",
              flex: 1,
            },
            {
              type: "button",
              action: {type: "message", label: "🇹🇭 Thai→Eng", text: "แปลคำว่า รักษ์โลก, สิ่งแวดล้อม เป็นภาษาอังกฤษ พร้อมตัวอย่างประโยค"},
              style: "secondary",
              height: "sm",
              flex: 1,
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    // 🆕 Formula Helper
    formulaHelper: {
      type: "flex",
      altText: "🔢 สูตรคณิต/วิทย์ - Formula Helper",
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
                {type: "text", text: "🔢", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "สูตรคณิต/วิทย์", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "รวมสูตรทุกระดับ พร้อมตัวอย่าง!", size: "sm", color: "#DBEAFE"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#3B82F6",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "📚 หมวดหมู่สูตร", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🔢 คณิต: พีชคณิต, เรขา, ตรีโกณ, แคลคูลัส", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "⚡ ฟิสิกส์: กลศาสตร์, ไฟฟ้า, คลื่น", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "⚗️ เคมี: โมล, สมดุล, กรด-เบส", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "🧬 ชีวะ: พันธุศาสตร์, ระบบร่างกาย", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ค้นหาสูตร", weight: "bold", size: "md", color: "#3B82F6", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"สูตรพื้นที่วงกลม\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"สูตร F=ma คืออะไร\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"สูตรคำนวณโมล\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#EFF6FF",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "button",
              action: {type: "message", label: "🔢 คณิต", text: "รวมสูตรคณิตศาสตร์ ม.ต้น ที่ใช้บ่อย พร้อมตัวอย่างการใช้"},
              style: "primary",
              color: "#3B82F6",
              height: "sm",
              flex: 1,
            },
            {
              type: "button",
              action: {type: "message", label: "⚡ ฟิสิกส์", text: "รวมสูตรฟิสิกส์ ม.ต้น ที่ใช้บ่อย พร้อมตัวอย่างการใช้"},
              style: "secondary",
              height: "sm",
              flex: 1,
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    // 🆕 Dictionary Tool
    dictionary: {
      type: "flex",
      altText: "📖 พจนานุกรม - Dictionary",
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
                {type: "text", text: "📖", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "พจนานุกรม", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "ค้นหาความหมาย คำพ้อง คำตรงข้าม!", size: "sm", color: "#FEF3C7"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#F59E0B",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "📚 ข้อมูลที่ได้", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "📝 ความหมาย (Definition)", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "🔄 คำพ้อง (Synonyms)", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "↔️ คำตรงข้าม (Antonyms)", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "📖 ประโยคตัวอย่าง", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่าง", weight: "bold", size: "md", color: "#F59E0B", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"ความหมายคำว่า สันติภาพ\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"คำพ้องของ beautiful\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"คำตรงข้ามของ happy\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#FFFBEB",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "button",
              action: {type: "message", label: "🇹🇭 ไทย", text: "ค้นหาความหมายคำว่า สันติภาพ พร้อมคำพ้องและประโยคตัวอย่าง"},
              style: "primary",
              color: "#F59E0B",
              height: "sm",
              flex: 1,
            },
            {
              type: "button",
              action: {type: "message", label: "🇬🇧 Eng", text: "Define \"beautiful\" with synonyms, antonyms, and example sentences"},
              style: "secondary",
              height: "sm",
              flex: 1,
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    // 🆕 Goal Tracker
    goalTracker: {
      type: "flex",
      altText: "🎯 Goal Tracker - ติดตามเป้าหมาย",
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
                {type: "text", text: "🎯", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Goal Tracker", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "ตั้งเป้าหมาย ติดตามความก้าวหน้า!", size: "sm", color: "#D1FAE5"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#059669",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🚀 ฟีเจอร์", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "🎯 ตั้งเป้าหมายการเรียน", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "📊 ติดตามความก้าวหน้า", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "🏆 รับ Badge เมื่อทำสำเร็จ", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "🔔 แจ้งเตือนกำหนดส่ง", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {type: "text", text: "💡", size: "xl"},
                {type: "text", text: "ตัวอย่างเป้าหมาย", weight: "bold", size: "md", color: "#059669", margin: "sm"},
              ],
              margin: "lg",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "• \"ตั้งเป้าเรียนคณิต 30 นาที/วัน\"", size: "sm", color: "#666", wrap: true},
                {type: "text", text: "• \"เป้าหมาย: จำศัพท์ 10 คำ/วัน\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
                {type: "text", text: "• \"ตั้งเป้าทำ Quiz 5 ชุด/สัปดาห์\"", size: "sm", color: "#666", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "15px",
              backgroundColor: "#ECFDF5",
              paddingAll: "10px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "button",
              action: {type: "message", label: "➕ ตั้งเป้าหมาย", text: "ตั้งเป้าหมายการเรียน: เรียนคณิตวันละ 30 นาที เป็นเวลา 7 วัน"},
              style: "primary",
              color: "#059669",
              height: "sm",
              flex: 1,
            },
            {
              type: "button",
              action: {type: "message", label: "📊 ดูความก้าวหน้า", text: "แสดงความก้าวหน้าเป้าหมายการเรียนของฉัน"},
              style: "secondary",
              height: "sm",
              flex: 1,
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },

    // 🆕 Quiz Battle
    quizBattle: {
      type: "flex",
      altText: "⚔️ Quiz Battle - แข่งตอบคำถาม",
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
                {type: "text", text: "⚔️", size: "3xl"},
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "Quiz Battle", weight: "bold", size: "xl", color: "#FFFFFF"},
                    {type: "text", text: "แข่งตอบคำถามกับเพื่อน!", size: "sm", color: "#FEE2E2"},
                  ],
                  flex: 1,
                  margin: "md",
                },
              ],
            },
          ],
          backgroundColor: "#DC2626",
          paddingAll: "20px",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {type: "text", text: "🎮 วิธีเล่น", weight: "bold", size: "md", color: "#333"},
            {
              type: "box",
              layout: "vertical",
              contents: [
                {type: "text", text: "1️⃣ เลือกวิชาที่ต้องการแข่ง", size: "sm", color: "#555", wrap: true},
                {type: "text", text: "2️⃣ ตอบคำถามให้เร็วและถูกต้อง", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "3️⃣ ได้ XP และไต่อันดับ", size: "sm", color: "#555", wrap: true, margin: "sm"},
                {type: "text", text: "4️⃣ ท้าทายเพื่อนได้!", size: "sm", color: "#555", wrap: true, margin: "sm"},
              ],
              margin: "md",
              paddingStart: "10px",
            },
            {type: "separator", margin: "lg"},
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "🏆", size: "xxl", align: "center"},
                    {type: "text", text: "รางวัล XP", size: "xs", align: "center", color: "#666"},
                  ],
                  flex: 1,
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "⚡", size: "xxl", align: "center"},
                    {type: "text", text: "แข่งเร็ว", size: "xs", align: "center", color: "#666"},
                  ],
                  flex: 1,
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {type: "text", text: "📊", size: "xxl", align: "center"},
                    {type: "text", text: "Leaderboard", size: "xs", align: "center", color: "#666"},
                  ],
                  flex: 1,
                },
              ],
              margin: "lg",
              backgroundColor: "#FEF2F2",
              paddingAll: "15px",
              cornerRadius: "md",
            },
          ],
          paddingAll: "15px",
        },
        footer: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "button",
              action: {type: "message", label: "🎮 เริ่มแข่ง", text: "เริ่มแข่ง Quiz Battle วิชาคณิตศาสตร์ ระดับ ม.ต้น"},
              style: "primary",
              color: "#DC2626",
              height: "sm",
              flex: 1,
            },
            {
              type: "button",
              action: {type: "message", label: "🏆 Leaderboard", text: "/edu leaderboard"},
              style: "secondary",
              height: "sm",
              flex: 1,
              margin: "sm",
            },
          ],
          paddingAll: "15px",
          backgroundColor: "#FAFAFA",
        },
      },
    },
  };

  return toolResponses[mappedToolId] || null;
}

// =====================================================
// 📦 EXPORTS
// =====================================================

// =====================================================
// 🏆 GAMIFICATION SYSTEM - ระบบความสำเร็จและรางวัล
// =====================================================

const ACHIEVEMENT_BADGES = {
  first_lesson: {id: "first_lesson", name: "🌟 First Step", title: "เริ่มต้นการเรียนรู้", description: "เรียนบทเรียนแรกสำเร็จ", xp: 50},
  quiz_master: {id: "quiz_master", name: "🎯 Quiz Master", title: "นักตอบคำถาม", description: "ตอบถูก 10 ข้อติดต่อกัน", xp: 100},
  streak_3: {id: "streak_3", name: "🔥 On Fire", title: "เรียน 3 วันติด", description: "เข้าเรียนติดต่อกัน 3 วัน", xp: 75},
  streak_7: {id: "streak_7", name: "⚡ Unstoppable", title: "เรียน 7 วันติด", description: "เข้าเรียนติดต่อกัน 7 วัน", xp: 200},
  perfect_score: {id: "perfect_score", name: "💯 Perfect", title: "เต็ม 100", description: "ทำแบบทดสอบได้คะแนนเต็ม", xp: 150},
  speed_learner: {id: "speed_learner", name: "🚀 Speed Learner", title: "เรียนเร็วมาก", description: "จบบทเรียนใน 10 นาที", xp: 80},
  helper: {id: "helper", name: "🤝 Helper", title: "คนช่วยเหลือ", description: "ช่วยเพื่อนตอบคำถาม 5 ครั้ง", xp: 120},
  explorer: {id: "explorer", name: "🗺️ Explorer", title: "นักสำรวจ", description: "เรียนครบทุกวิชาในระดับ", xp: 300},
  daily_challenge: {id: "daily_challenge", name: "🏆 Champion", title: "แชมป์ประจำวัน", description: "ผ่าน Daily Challenge", xp: 100},
  night_owl: {id: "night_owl", name: "🦉 Night Owl", title: "นกฮูก", description: "เรียนหลัง 22:00", xp: 50},
  early_bird: {id: "early_bird", name: "🐦 Early Bird", title: "นกตื่นเช้า", description: "เรียนก่อน 07:00", xp: 50},
  complete_course: {id: "complete_course", name: "🎓 Graduate", title: "จบหลักสูตร", description: "เรียนจบหลักสูตรครบ", xp: 500},
};

const LEVEL_SYSTEM = {
  1: {min: 0, max: 100, title: "🌱 Beginner", color: "#9CA3AF"},
  2: {min: 100, max: 300, title: "📚 Learner", color: "#60A5FA"},
  3: {min: 300, max: 600, title: "⭐ Student", color: "#34D399"},
  4: {min: 600, max: 1000, title: "🌟 Scholar", color: "#FBBF24"},
  5: {min: 1000, max: 1500, title: "💎 Expert", color: "#A78BFA"},
  6: {min: 1500, max: 2500, title: "🏆 Master", color: "#F472B6"},
  7: {min: 2500, max: 4000, title: "👑 Grandmaster", color: "#F97316"},
  8: {min: 4000, max: 6000, title: "🔥 Legend", color: "#EF4444"},
  9: {min: 6000, max: 10000, title: "⚡ Champion", color: "#8B5CF6"},
  10: {min: 10000, max: Infinity, title: "🌈 Ultimate", color: "#EC4899"},
};

// =====================================================
// 📊 DAILY CHALLENGES - ชาเลนจ์ประจำวัน
// =====================================================

const DAILY_CHALLENGES = {
  math_speed: {
    id: "math_speed",
    type: "math",
    title: "⚡ Speed Math",
    description: "ตอบโจทย์คณิต 10 ข้อใน 2 นาที",
    reward: 100,
    difficulty: "medium",
  },
  vocab_master: {
    id: "vocab_master",
    type: "english",
    title: "📖 Vocab Master",
    description: "จำคำศัพท์ 20 คำ",
    reward: 80,
    difficulty: "easy",
  },
  science_quiz: {
    id: "science_quiz",
    type: "science",
    title: "🔬 Science Sprint",
    description: "ตอบคำถามวิทย์ 5 ข้อ",
    reward: 120,
    difficulty: "hard",
  },
  reading_challenge: {
    id: "reading_challenge",
    type: "thai",
    title: "📚 Reading Master",
    description: "อ่านจับใจความ 3 บทความ",
    reward: 90,
    difficulty: "medium",
  },
  coding_puzzle: {
    id: "coding_puzzle",
    type: "programming",
    title: "💻 Code Puzzle",
    description: "แก้โจทย์โปรแกรมมิ่ง 3 ข้อ",
    reward: 150,
    difficulty: "hard",
  },
};

// =====================================================
// 🎮 MINI-GAMES - เกมการศึกษา
// =====================================================

const MINI_GAMES = {
  word_scramble: {
    id: "word_scramble",
    name: "🔤 Word Scramble",
    description: "เรียงตัวอักษรให้เป็นคำ",
    subjects: ["thai", "english"],
    xpReward: 20,
  },
  math_race: {
    id: "math_race",
    name: "🏎️ Math Race",
    description: "แข่งคำนวณให้เร็วที่สุด",
    subjects: ["math"],
    xpReward: 25,
  },
  memory_match: {
    id: "memory_match",
    name: "🧠 Memory Match",
    description: "จับคู่บัตรความจำ",
    subjects: ["all"],
    xpReward: 15,
  },
  true_false: {
    id: "true_false",
    name: "✅ True or False",
    description: "ตอบจริงหรือเท็จให้เร็ว",
    subjects: ["science", "social"],
    xpReward: 18,
  },
  fill_blank: {
    id: "fill_blank",
    name: "📝 Fill the Blank",
    description: "เติมคำในช่องว่าง",
    subjects: ["thai", "english"],
    xpReward: 22,
  },
};

// =====================================================
// 🎨 ADVANCED FLEX CREATORS
// =====================================================

/**
 * สร้าง Progress Dashboard แบบ Visual
 */
function createProgressDashboardFlex(userData) {
  const {xp = 0, level = 1, streak = 0, badges = [], lessonsCompleted = 0, quizScore = 0} = userData;

  // คำนวณ Level
  const currentLevelInfo = LEVEL_SYSTEM[level] || LEVEL_SYSTEM[1];
  const nextLevelInfo = LEVEL_SYSTEM[level + 1] || LEVEL_SYSTEM[10];
  const progressPercent = Math.min(100, Math.round(((xp - currentLevelInfo.min) / (nextLevelInfo.min - currentLevelInfo.min)) * 100));

  // แสดง Badges ล่าสุด
  const recentBadges = badges.slice(-3).map((badgeId) => ACHIEVEMENT_BADGES[badgeId]?.name || "🎖️").join(" ");

  return {
    type: "flex",
    altText: "📊 Dashboard การเรียนรู้",
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
              {type: "text", text: "📊 Dashboard", weight: "bold", size: "xl", color: "#FFFFFF", flex: 3},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `🔥 ${streak}`, weight: "bold", size: "lg", color: "#FCD34D", align: "center"},
                ],
                backgroundColor: "#DC2626",
                cornerRadius: "xl",
                paddingAll: "8px",
                flex: 1,
              },
            ],
          },
          {type: "text", text: "ความก้าวหน้าของคุณ", size: "sm", color: "#DBEAFE", margin: "sm"},
        ],
        backgroundColor: "#1E40AF",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Level & XP Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: currentLevelInfo.title, weight: "bold", size: "lg", color: currentLevelInfo.color, flex: 3},
                  {type: "text", text: `${xp} XP`, weight: "bold", size: "md", color: "#6B7280", align: "end", flex: 2},
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [],
                    width: `${progressPercent}%`,
                    height: "8px",
                    backgroundColor: currentLevelInfo.color,
                  },
                ],
                backgroundColor: "#E5E7EB",
                height: "8px",
                margin: "md",
                cornerRadius: "md",
              },
              {type: "text", text: `${nextLevelInfo.min - xp} XP สู่ Level ${level + 1}`, size: "sm", color: "#9CA3AF", margin: "sm"},
            ],
            backgroundColor: "#F9FAFB",
            cornerRadius: "lg",
            paddingAll: "15px",
          },

          // Stats Grid
          {type: "separator", margin: "lg"},
          {
            type: "box",
            layout: "horizontal",
            contents: [
              createStatBox("📚", "บทเรียน", lessonsCompleted.toString(), "#3B82F6"),
              createStatBox("📝", "แบบทดสอบ", `${quizScore}%`, "#10B981"),
              createStatBox("🏆", "เหรียญ", badges.length.toString(), "#F59E0B"),
            ],
            margin: "lg",
            spacing: "md",
          },

          // Recent Badges
          {type: "separator", margin: "lg"},
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: "🏅 เหรียญล่าสุด", weight: "bold", size: "sm", color: "#374151"},
              {type: "text", text: recentBadges || "ยังไม่มีเหรียญ - มาสะสมกัน!", size: "md", color: "#6B7280", margin: "sm", wrap: true},
            ],
            margin: "md",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "🎯 Daily Challenge", text: "/edu challenge"},
                style: "primary",
                color: "#DC2626",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "📚 เรียนต่อ", text: "/edu"},
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

function createStatBox(icon, label, value, color) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {type: "text", text: icon, size: "xxl", align: "center"},
      {type: "text", text: value, weight: "bold", size: "xl", color: color, align: "center", margin: "sm"},
      {type: "text", text: label, size: "sm", color: "#6B7280", align: "center"},
    ],
    flex: 1,
    backgroundColor: "#FFFFFF",
    cornerRadius: "md",
    paddingAll: "10px",
  };
}

/**
 * สร้าง Daily Challenge Menu
 */
function createDailyChallengeMenuFlex(todayChallenge) {
  const challenge = todayChallenge || DAILY_CHALLENGES.math_speed;
  const difficultyColors = {easy: "#10B981", medium: "#F59E0B", hard: "#EF4444"};

  return {
    type: "flex",
    altText: "🎯 Daily Challenge",
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
              {type: "text", text: "🎯 DAILY CHALLENGE", weight: "bold", size: "lg", color: "#FFFFFF", flex: 3},
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {type: "text", text: `+${challenge.reward} XP`, weight: "bold", size: "sm", color: "#FCD34D", align: "center"},
                ],
                backgroundColor: "#7C3AED",
                cornerRadius: "xl",
                paddingAll: "5px",
                flex: 1,
              },
            ],
          },
          {type: "text", text: "ชาเลนจ์ประจำวันนี้!", size: "sm", color: "#FDE68A", margin: "sm"},
        ],
        backgroundColor: "#DC2626",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {type: "text", text: challenge.title, weight: "bold", size: "xl", color: "#1F2937", align: "center"},
              {type: "text", text: challenge.description, size: "md", color: "#6B7280", align: "center", margin: "md", wrap: true},
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "⏳ เวลา:", size: "sm", color: "#6B7280", flex: 1},
                  {type: "text", text: "5 นาที", weight: "bold", size: "sm", color: "#1F2937", flex: 1},
                ],
                margin: "lg",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {type: "text", text: "📊 ระดับ:", size: "sm", color: "#6B7280", flex: 1},
                  {
                    type: "text",
                    text: challenge.difficulty.toUpperCase(),
                    weight: "bold",
                    size: "sm",
                    color: difficultyColors[challenge.difficulty],
                    flex: 1,
                  },
                ],
                margin: "sm",
              },
            ],
            backgroundColor: "#FEF3C7",
            cornerRadius: "lg",
            paddingAll: "20px",
          },
          {type: "separator", margin: "lg"},
          {
            type: "text",
            text: "🏆 ผ่านชาเลนจ์รับ Badge พิเศษ!",
            size: "sm",
            color: "#7C3AED",
            align: "center",
            margin: "lg",
            weight: "bold",
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
            action: {type: "message", label: "🚀 เริ่มชาเลนจ์!", text: `/challenge start ${challenge.id}`},
            style: "primary",
            color: "#DC2626",
            height: "md",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "🎮 Mini Games", text: "/edu games"},
                style: "secondary",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "📊 Dashboard", text: "/edu dashboard"},
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

/**
 * สร้าง Mini Games Menu
 */
function createMiniGamesMenuFlex() {
  const gameButtons = Object.values(MINI_GAMES).map((game) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: game.name, weight: "bold", size: "md", color: "#1F2937"},
          {type: "text", text: game.description, size: "sm", color: "#6B7280", wrap: true},
        ],
        flex: 3,
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: `+${game.xpReward}`, weight: "bold", size: "sm", color: "#10B981", align: "center"},
          {type: "text", text: "XP", size: "sm", color: "#6B7280", align: "center"},
        ],
        flex: 1,
        justifyContent: "center",
      },
    ],
    paddingAll: "12px",
    backgroundColor: "#F0FDF4",
    cornerRadius: "lg",
    margin: "sm",
    action: {type: "message", text: `/game ${game.id}`},
  }));

  return {
    type: "flex",
    altText: "🎮 Mini Games",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🎮 Mini Games", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: "เรียนรู้ผ่านเกมสนุกๆ", size: "sm", color: "#D1FAE5"},
        ],
        backgroundColor: "#059669",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "เลือกเกมที่อยากเล่น:", weight: "bold", size: "sm", color: "#059669"},
          {type: "separator", margin: "md"},
          {
            type: "box",
            layout: "vertical",
            contents: gameButtons,
            margin: "md",
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
            action: {type: "message", label: "🏠 กลับเมนูหลัก", text: "/edu"},
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

/**
 * สร้าง Achievement/Badge Gallery
 */
function createBadgeGalleryFlex(userBadges = []) {
  const allBadges = Object.values(ACHIEVEMENT_BADGES);
  const badgeRows = [];

  for (let i = 0; i < allBadges.length; i += 3) {
    const row = allBadges.slice(i, i + 3).map((badge) => {
      const earned = userBadges.includes(badge.id);
      return {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: earned ? badge.name.split(" ")[0] : "🔒", size: "xxl", align: "center"},
          {type: "text", text: badge.title, size: "xxs", color: earned ? "#1F2937" : "#9CA3AF", align: "center", wrap: true},
          {type: "text", text: `+${badge.xp} XP`, size: "xxs", color: earned ? "#10B981" : "#D1D5DB", align: "center"},
        ],
        flex: 1,
        backgroundColor: earned ? "#FEF3C7" : "#F3F4F6",
        cornerRadius: "md",
        paddingAll: "8px",
        margin: "sm",
      };
    });

    badgeRows.push({
      type: "box",
      layout: "horizontal",
      contents: row,
      margin: "sm",
    });
  }

  return {
    type: "flex",
    altText: "🏆 Achievement Gallery",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🏆 Achievement Gallery", weight: "bold", size: "lg", color: "#FFFFFF"},
          {type: "text", text: `ปลดล็อคแล้ว ${userBadges.length}/${allBadges.length}`, size: "sm", color: "#FDE68A"},
        ],
        backgroundColor: "#B45309",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: badgeRows,
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "📊 Dashboard", text: "/edu dashboard"},
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

/**
 * สร้าง AI Lesson Generator Response
 */
function createAILessonFlex(topic, content, level) {
  const levelInfo = EDUCATION_LEVELS[level] || EDUCATION_LEVELS.secondary;

  return {
    type: "flex",
    altText: `📚 บทเรียน: ${topic}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: `📚 ${topic}`, weight: "bold", size: "lg", color: "#FFFFFF", wrap: true},
          {type: "text", text: `${levelInfo.icon} ${levelInfo.name}`, size: "sm", color: "#DBEAFE"},
        ],
        backgroundColor: levelInfo.color,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: content.substring(0, 800) + (content.length > 800 ? "..." : ""), size: "sm", color: "#374151", wrap: true},
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: {type: "message", label: "📝 แบบทดสอบ", text: `/quiz_ai ${topic}`},
                style: "primary",
                color: "#10B981",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: {type: "message", label: "💬 ถาม WiT", text: `/tutor explain ${topic}`},
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
          {
            type: "button",
            action: {type: "message", label: "🏠 กลับเมนูหลัก", text: "/edu"},
            style: "secondary",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

/**
 * สร้าง Leaderboard
 */
function createLeaderboardFlex(topUsers) {
  const medals = ["🥇", "🥈", "🥉"];

  const userRows = topUsers.slice(0, 10).map((user, idx) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: idx < 3 ? medals[idx] : `${idx + 1}`,
        size: "lg",
        weight: "bold",
        color: idx < 3 ? "#F59E0B" : "#6B7280",
        flex: 0,
        gravity: "center",
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: user.name || "นักเรียน", weight: "bold", size: "sm", color: "#1F2937"},
          {type: "text", text: `Level ${user.level || 1} ${LEVEL_SYSTEM[user.level || 1]?.title || ""}`, size: "sm", color: "#6B7280"},
        ],
        paddingStart: "12px",
        flex: 3,
      },
      {
        type: "text",
        text: `${user.xp || 0} XP`,
        weight: "bold",
        size: "sm",
        color: "#10B981",
        align: "end",
        flex: 1,
      },
    ],
    paddingAll: "10px",
    backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
    margin: "xs",
  }));

  return {
    type: "flex",
    altText: "🏆 Leaderboard",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {type: "text", text: "🏆 Leaderboard", weight: "bold", size: "xl", color: "#FFFFFF"},
          {type: "text", text: "ผู้นำสูงสุดประจำสัปดาห์", size: "sm", color: "#FDE68A"},
        ],
        backgroundColor: "#7C3AED",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: userRows,
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {type: "message", label: "📊 Dashboard ของฉัน", text: "/edu dashboard"},
            style: "primary",
            color: "#7C3AED",
            height: "sm",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F3F4F6",
      },
    },
  };
}

module.exports = {
  // Data
  EDUCATION_LEVELS,
  SUBJECTS,
  COURSES,
  SAMPLE_LESSONS,
  STUDY_TOOLS,
  AI_TUTOR_MODES,
  GRADE_DIFFICULTY,

  // NEW: Gamification Data
  ACHIEVEMENT_BADGES,
  LEVEL_SYSTEM,
  DAILY_CHALLENGES,
  MINI_GAMES,

  // Flex Message Creators
  createEducationHubMenuFlex,
  createSubjectsMenuFlex,
  createCourseUnitsFlex,
  createAITutorMenuFlex,
  createStudyToolsMenuFlex,
  createQuickToolsMenuFlex,
  createToolResponseFlex,

  // NEW: Primary Grade Menus
  createPrimaryGradeMenuFlex,
  createPrimarySubjectsMenuFlex,

  // NEW: Advanced Flex Creators
  createProgressDashboardFlex,
  createDailyChallengeMenuFlex,
  createMiniGamesMenuFlex,
  createBadgeGalleryFlex,
  createAILessonFlex,
  createLeaderboardFlex,

  // AI Prompt Functions
  getEducationSystemPrompt,
  createSubjectPrompt,
  detectEducationContext,
  isEducationQuestion,

  // Helper Functions
  searchCourses,
  recommendCourses,
};
