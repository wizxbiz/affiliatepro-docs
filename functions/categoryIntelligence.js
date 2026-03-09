/**
 * ====================================================================
 * 🎯 CATEGORY INTELLIGENCE SYSTEM
 * ====================================================================
 * ระบบวิเคราะห์และจำแนกคำถามเข้าสู่หมวดหมู่ต่างๆ
 * เพื่อให้ AI สามารถช่วยคิดและทำงานได้แม่นยำตามประเภทของงาน
 * 
 * 18 Categories:
 * 🧮 calculation - การคำนวณ
 * 📚 howto - วิธีการทำ
 * 🎓 education - การศึกษา/สอน
 * 🔧 technical - ด้านเทคนิค
 * 🔍 troubleshooting - แก้ปัญหา
 * ⚖️ comparison - เปรียบเทียบ
 * ⭐ recommendation - คำแนะนำ
 * 📊 analysis - วิเคราะห์
 * 💬 explanation - อธิบาย
 * 📖 definition - คำจำกัดความ
 * 🛡️ safety - ความปลอดภัย
 * 🔨 maintenance - บำรุงรักษา
 * ✅ quality - คุณภาพ
 * 💰 cost - ต้นทุน
 * 🧪 material - วัสดุ
 * ⚙️ process - กระบวนการ
 * 🏭 machine - เครื่องจักร
 * 🔩 mold - แม่พิมพ์
 * 💡 general - ทั่วไป
 * ====================================================================
 */

// ========================================
// 📋 CATEGORY DEFINITIONS
// ========================================
const QUESTION_CATEGORIES = {
  CALCULATION: {
    key: 'calculation',
    emoji: '🧮',
    name: 'การคำนวณ',
    nameEn: 'Calculation',
    description: 'คำนวณค่าต่างๆ เช่น อุณหภูมิ ความดัน เวลา ต้นทุน',
    keywords: [
      // คำศัพท์การคำนวณ
      'คำนวณ', 'ค่า', 'หา', 'สูตร', 'ผลลัพธ์',
      'calculate', 'compute', 'formula', 'value', 'result',
      // หน่วยวัด
      'องศา', 'เซลเซียส', 'กิโลกรัม', 'ตัน', 'ลิตร', 'เมตร',
      'celsius', 'kg', 'ton', 'liter', 'meter', 'mm', 'cm',
      // การคำนวณเฉพาะ
      'ความดัน', 'อุณหภูมิ', 'น้ำหนัก', 'ปริมาตร', 'พื้นที่',
      'pressure', 'temperature', 'weight', 'volume', 'area',
      'cooling time', 'cycle time', 'injection speed',
      'tonnage', 'clamping force', 'shot size',
      // คณิตศาสตร์
      'บวก', 'ลบ', 'คูณ', 'หาร', 'เปอร์เซ็นต์', 'สัดส่วน', 'อัตรา',
      'plus', 'minus', 'multiply', 'divide', 'percent', 'ratio', 'rate',
      // ตัวเลขและหน่วย
      /\d+\s*(°C|°F|kg|MPa|bar|mm|cm|m|ton|sec|min|hr|%)/i,
    ],
    patterns: [
      /คำนวณ|ค่า.*เท่าไร|หา.*ค่า/i,
      /calculate|compute|find.*value/i,
      /\d+.*\+.*\d+|\d+.*-.*\d+|\d+.*×.*\d+|\d+.*÷.*\d+/,
      /สูตร.*คือ|formula.*for/i,
    ],
  },

  HOWTO: {
    key: 'howto',
    emoji: '📚',
    name: 'วิธีการ',
    nameEn: 'How-To Guide',
    description: 'คำแนะนำวิธีการทำงาน ขั้นตอน กระบวนการ',
    keywords: [
      'วิธี', 'ทำอย่างไร', 'ขั้นตอน', 'กระบวนการ', 'เริ่มต้น',
      'how to', 'how do', 'steps', 'procedure', 'process', 'guide',
      'tutorial', 'instruction', 'method', 'way to',
      'ตั้งค่า', 'ปรับ', 'แก้', 'ซ่อม', 'ติดตั้ง',
      'setup', 'adjust', 'fix', 'repair', 'install',
      'configure', 'optimize', 'improve',
    ],
    patterns: [
      /วิธี.*?(?:ทำ|ตั้ง|ปรับ|แก้|ซ่อม)/i,
      /ทำ(?:อย่างไร|ยังไง)/i,
      /how\s+(?:to|do|can)/i,
      /ขั้นตอน.*(?:การ|ใน)/i,
      /step.*by.*step/i,
    ],
  },

  EDUCATION: {
    key: 'education',
    emoji: '🎓',
    name: 'การศึกษา',
    nameEn: 'Education',
    description: 'การเรียนรู้ สอน อธิบายแนวคิด หลักการ ทฤษฎี',
    keywords: [
      'เรียน', 'สอน', 'อบรม', 'ฝึกอบรม', 'ความรู้', 'หลักสูตร',
      'learn', 'teach', 'training', 'course', 'knowledge', 'study',
      'education', 'lesson', 'class', 'workshop',
      'หลักการ', 'ทฤษฎี', 'แนวคิด', 'พื้นฐาน', 'เบื้องต้น',
      'principle', 'theory', 'concept', 'basic', 'fundamental',
      'beginner', 'intermediate', 'advanced',
    ],
    patterns: [
      /(?:เรียน|สอน).*(?:เกี่ยว|เรื่อง)/i,
      /(?:ความรู้|หลักการ).*(?:เกี่ยวกับ|คือ)/i,
      /learn.*about|teach.*about/i,
      /training.*(?:for|on)/i,
    ],
  },

  TECHNICAL: {
    key: 'technical',
    emoji: '🔧',
    name: 'ด้านเทคนิค',
    nameEn: 'Technical',
    description: 'รายละเอียดทางเทคนิค สเปค พารามิเตอร์',
    keywords: [
      'เทคนิค', 'สเปค', 'พารามิเตอร์', 'ค่าตั้ง', 'การตั้งค่า',
      'technical', 'spec', 'specification', 'parameter', 'setting',
      'configuration', 'detail', 'data',
      'injection pressure', 'screw speed', 'back pressure',
      'holding pressure', 'melt temperature', 'mold temperature',
    ],
    patterns: [
      /สเปค.*(?:ของ|คือ)/i,
      /พารามิเตอร์.*(?:การ|ที่)/i,
      /spec.*(?:for|of)/i,
      /technical.*(?:detail|data)/i,
    ],
  },

  TROUBLESHOOTING: {
    key: 'troubleshooting',
    emoji: '🔍',
    name: 'แก้ปัญหา',
    nameEn: 'Troubleshooting',
    description: 'วินิจฉัยและแก้ไขปัญหา ข้อบกพร่อง',
    keywords: [
      'ปัญหา', 'แก้', 'ซ่อม', 'บกพร่อง', 'ผิดพลาด', 'เสีย',
      'problem', 'issue', 'defect', 'error', 'fault', 'failure',
      'troubleshoot', 'diagnose', 'fix', 'repair', 'solve',
      // ปัญหาเฉพาะในการฉีดพลาสติก
      'short shot', 'flash', 'sink mark', 'warp', 'burn mark',
      'silver streak', 'weld line', 'jetting', 'delamination',
      'crack', 'brittle', 'discoloration', 'contamination',
      'รอยไหม้', 'รอยยุบ', 'รอยงอ', 'ไม่เต็มแบบ', 'ล้นแบบ',
    ],
    patterns: [
      /ปัญหา.*(?:คือ|เกี่ยวกับ|เรื่อง)/i,
      /แก้.*(?:ปัญหา|ได้อย่างไร)/i,
      /(?:เกิด|มี|พบ).*(?:ปัญหา|บกพร่อง)/i,
      /problem.*(?:with|in)/i,
      /how.*(?:fix|solve|repair)/i,
      /why.*(?:defect|error|fail)/i,
    ],
  },

  COMPARISON: {
    key: 'comparison',
    emoji: '⚖️',
    name: 'เปรียบเทียบ',
    nameEn: 'Comparison',
    description: 'เปรียบเทียบความแตกต่าง ข้อดี-ข้อเสีย',
    keywords: [
      'เปรียบเทียบ', 'ต่าง', 'ดีกว่า', 'แย่กว่า', 'ข้อดี', 'ข้อเสีย',
      'compare', 'comparison', 'difference', 'versus', 'vs',
      'better', 'worse', 'advantage', 'disadvantage',
      'pros', 'cons', 'benefit', 'drawback',
      'แตกต่าง', 'เหมือน', 'คล้าย',
      'different', 'similar', 'same', 'unlike',
    ],
    patterns: [
      /เปรียบเทียบ.*(?:กับ|และ|vs)/i,
      /(?:ข้อดี|ข้อเสีย).*(?:ของ|คือ)/i,
      /(?:ต่าง|แตกต่าง).*(?:กัน|อย่างไร)/i,
      /compare.*(?:with|to|between)/i,
      /(?:better|worse).*than/i,
      /\w+\s+vs\s+\w+/i,
    ],
  },

  RECOMMENDATION: {
    key: 'recommendation',
    emoji: '⭐',
    name: 'คำแนะนำ',
    nameEn: 'Recommendation',
    description: 'แนะนำตัวเลือก วิธีที่ดีที่สุด',
    keywords: [
      'แนะนำ', 'ควร', 'ดีที่สุด', 'เหมาะสม', 'ดีกว่า',
      'recommend', 'suggestion', 'advice', 'should',
      'best', 'optimal', 'ideal', 'suitable', 'prefer',
      'better', 'good', 'excellent',
      'เลือก', 'ใช้', 'ตัวไหน', 'อันไหน',
      'choose', 'select', 'which', 'what',
    ],
    patterns: [
      /(?:แนะนำ|ควร).*(?:ใช้|เลือก)/i,
      /(?:อันไหน|ตัวไหน|แบบไหน).*(?:ดี|เหมาะ)/i,
      /recommend.*(?:for|to)/i,
      /what.*(?:should|best)/i,
      /which.*(?:is better|recommended)/i,
    ],
  },

  ANALYSIS: {
    key: 'analysis',
    emoji: '📊',
    name: 'วิเคราะห์',
    nameEn: 'Analysis',
    description: 'วิเคราะห์ข้อมูล สาเหตุ ผลกระทบ',
    keywords: [
      'วิเคราะห์', 'สาเหตุ', 'เพราะ', 'ทำไม', 'ผล',
      'analyze', 'analysis', 'cause', 'reason', 'why',
      'effect', 'impact', 'result', 'consequence',
      'factor', 'influence', 'affect',
      'ประเมิน', 'ตรวจสอบ', 'พิจารณา',
      'evaluate', 'assess', 'review', 'examine',
    ],
    patterns: [
      /วิเคราะห์.*(?:สาเหตุ|ผล)/i,
      /(?:ทำไม|เพราะอะไร).*(?:ถึง|จึง)/i,
      /analyze.*(?:cause|reason|why)/i,
      /what.*(?:cause|reason)/i,
      /why.*(?:is|does|did)/i,
    ],
  },

  EXPLANATION: {
    key: 'explanation',
    emoji: '💬',
    name: 'อธิบาย',
    nameEn: 'Explanation',
    description: 'อธิบายความหมาย ที่มา ทำงานอย่างไร',
    keywords: [
      'อธิบาย', 'คือ', 'หมายถึง', 'ความหมาย',
      'explain', 'explanation', 'meaning', 'means',
      'what is', 'what does', 'describe', 'tell me about',
      'ทำงาน', 'ใช้งาน', 'หลักการ',
      'work', 'function', 'operate', 'principle',
    ],
    patterns: [
      /อธิบาย.*(?:เกี่ยวกับ|คือ)/i,
      /(?:คือ|หมายถึง).*(?:อะไร|อย่างไร)/i,
      /explain.*(?:what|how|why)/i,
      /what\s+is\s+\w+/i,
      /tell\s+me\s+about/i,
    ],
  },

  DEFINITION: {
    key: 'definition',
    emoji: '📖',
    name: 'คำจำกัดความ',
    nameEn: 'Definition',
    description: 'นิยาม ความหมาย คำศัพท์',
    keywords: [
      'คือ', 'หมายถึง', 'ความหมาย', 'นิยาม', 'คำจำกัดความ',
      'definition', 'define', 'meaning', 'term',
      'what is', 'what does mean', 'terminology',
      'คำศัพท์', 'ศัพท์', 'คำว่า',
      'vocabulary', 'glossary', 'term',
    ],
    patterns: [
      /(?:คือ|หมายถึง).*(?:อะไร|ไร)/i,
      /ความหมาย.*(?:ของ|คือ)/i,
      /what\s+is\s+(?:the\s+)?definition/i,
      /define.*\w+/i,
      /meaning\s+of/i,
    ],
  },

  SAFETY: {
    key: 'safety',
    emoji: '🛡️',
    name: 'ความปลอดภัย',
    nameEn: 'Safety',
    description: 'ข้อควรระวัง มาตรการความปลอดภัย',
    keywords: [
      'ปลอดภัย', 'อันตราย', 'ระวัง', 'ข้อควรระวัง', 'คำเตือน',
      'safety', 'danger', 'hazard', 'warning', 'caution',
      'risk', 'precaution', 'safe', 'unsafe',
      'PPE', 'protective', 'equipment',
      'บาดเจ็บ', 'เสี่ยง', 'ป้องกัน',
      'injury', 'accident', 'prevent', 'protection',
    ],
    patterns: [
      /(?:ปลอดภัย|อันตราย).*(?:หรือไม่|ไหม)/i,
      /ข้อควรระวัง.*(?:ใน|เมื่อ)/i,
      /safety.*(?:concern|issue|precaution)/i,
      /is.*(?:safe|dangerous)/i,
      /warning.*about/i,
    ],
  },

  MAINTENANCE: {
    key: 'maintenance',
    emoji: '🔨',
    name: 'บำรุงรักษา',
    nameEn: 'Maintenance',
    description: 'การดูแล บำรุงรักษา ซ่อมบำรุง',
    keywords: [
      'บำรุง', 'ดูแล', 'รักษา', 'ซ่อม', 'ตรวจเช็ค',
      'maintenance', 'maintain', 'care', 'service',
      'inspect', 'check', 'clean', 'lubricate',
      'repair', 'overhaul', 'preventive',
      'เปลี่ยน', 'ทำความสะอาด', 'หล่อลื่น',
      'replace', 'clean', 'oil', 'grease',
    ],
    patterns: [
      /(?:บำรุง|ดูแล).*(?:อย่างไร|ทำ)/i,
      /ต้อง.*(?:ตรวจ|เช็ค).*(?:ทุก|เมื่อไร)/i,
      /maintenance.*(?:schedule|plan|procedure)/i,
      /how.*(?:maintain|service|care)/i,
      /when.*(?:replace|change|clean)/i,
    ],
  },

  QUALITY: {
    key: 'quality',
    emoji: '✅',
    name: 'คุณภาพ',
    nameEn: 'Quality',
    description: 'การควบคุมคุณภาพ มาตรฐาน',
    keywords: [
      'คุณภาพ', 'มาตรฐาน', 'ควบคุม', 'ตรวจสอบ',
      'quality', 'standard', 'control', 'assurance',
      'QC', 'QA', 'inspection', 'test', 'measure',
      'tolerance', 'specification', 'criteria',
      'ผ่าน', 'ไม่ผ่าน', 'ยอมรับได้',
      'pass', 'fail', 'acceptable', 'reject',
    ],
    patterns: [
      /คุณภาพ.*(?:การ|ของ|ควบคุม)/i,
      /มาตรฐาน.*(?:คือ|อะไร)/i,
      /quality.*(?:control|assurance|standard)/i,
      /how.*(?:ensure|check|measure).*quality/i,
    ],
  },

  COST: {
    key: 'cost',
    emoji: '💰',
    name: 'ต้นทุน',
    nameEn: 'Cost',
    description: 'การคำนวณต้นทุน ราคา ค่าใช้จ่าย',
    keywords: [
      'ต้นทุน', 'ราคา', 'ค่าใช้จ่าย', 'งบ', 'บาท',
      'cost', 'price', 'expense', 'budget', 'money',
      'dollar', 'baht', 'payment', 'fee',
      'ถูก', 'แพง', 'คุ้มค่า', 'ประหยัด',
      'cheap', 'expensive', 'worth', 'save',
      'ROI', 'investment', 'return',
    ],
    patterns: [
      /ต้นทุน.*(?:การ|ใน|ของ)/i,
      /ราคา.*(?:เท่าไร|ประมาณ)/i,
      /cost.*(?:of|for|to)/i,
      /how\s+much.*(?:cost|price)/i,
      /\d+.*(?:บาท|baht|dollar|\$)/i,
    ],
  },

  MATERIAL: {
    key: 'material',
    emoji: '🧪',
    name: 'วัสดุ',
    nameEn: 'Material',
    description: 'วัสดุ พลาสติก คุณสมบัติวัสดุ',
    keywords: [
      'วัสดุ', 'พลาสติก', 'เรซิน', 'คุณสมบัติ',
      'material', 'plastic', 'resin', 'polymer', 'property',
      // ชนิดพลาสติก
      'ABS', 'PP', 'PE', 'PS', 'PC', 'PA', 'PVC', 'POM', 'PET',
      'nylon', 'acrylic', 'polypropylene', 'polyethylene',
      // คุณสมบัติ
      'shrinkage', 'melting', 'density', 'viscosity',
      'ความหดตัว', 'จุดหลอมเหลว', 'ความหนาแน่น', 'ความข้น',
    ],
    patterns: [
      /(?:วัสดุ|พลาสติก).*(?:ชนิด|ประเภท|คือ)/i,
      /คุณสมบัติ.*(?:ของ|คือ)/i,
      /material.*(?:property|characteristic)/i,
      /what.*(?:material|plastic|resin)/i,
    ],
  },

  PROCESS: {
    key: 'process',
    emoji: '⚙️',
    name: 'กระบวนการ',
    nameEn: 'Process',
    description: 'กระบวนการผลิต ขั้นตอนการทำงาน',
    keywords: [
      'กระบวนการ', 'ผลิต', 'ขั้นตอน', 'วิธีการ',
      'process', 'production', 'manufacturing', 'procedure',
      'cycle', 'operation', 'method', 'workflow',
      'injection', 'molding', 'cooling', 'ejection',
      'filling', 'packing', 'holding',
      'การฉีด', 'การหล่อเย็น', 'การดัน',
    ],
    patterns: [
      /กระบวนการ.*(?:การ|ของ|ใน)/i,
      /ขั้นตอน.*(?:การ|ใน)/i,
      /process.*(?:of|for|in)/i,
      /how.*(?:process|produce|manufacture)/i,
    ],
  },

  MACHINE: {
    key: 'machine',
    emoji: '🏭',
    name: 'เครื่องจักร',
    nameEn: 'Machine',
    description: 'เครื่องจักร อุปกรณ์ ส่วนประกอบ',
    keywords: [
      'เครื่อง', 'เครื่องจักร', 'อุปกรณ์', 'ส่วนประกอบ',
      'machine', 'equipment', 'device', 'component',
      'part', 'unit', 'system',
      'injection machine', 'press', 'clamp', 'screw',
      'barrel', 'nozzle', 'hopper',
      'เครื่องฉีด', 'หัวฉีด', 'สกรู', 'กระบอก',
    ],
    patterns: [
      /เครื่อง(?:จักร|ฉีด).*(?:ชนิด|ประเภท)/i,
      /อุปกรณ์.*(?:ที่|สำหรับ)/i,
      /machine.*(?:type|model|specification)/i,
      /equipment.*(?:for|to)/i,
    ],
  },

  MOLD: {
    key: 'mold',
    emoji: '🔩',
    name: 'แม่พิมพ์',
    nameEn: 'Mold',
    description: 'แม่พิมพ์ การออกแบบแม่พิมพ์',
    keywords: [
      'แม่พิมพ์', 'พิมพ์', 'cavity', 'gate', 'runner',
      'mold', 'die', 'tool', 'tooling',
      'mold design', 'core', 'insert',
      'ejector', 'cooling channel', 'venting',
      'ช่องระบายอากาศ', 'ช่องน้ำ', 'ตัวดัน',
      'sprue', 'gate location', 'parting line',
    ],
    patterns: [
      /แม่พิมพ์.*(?:การ|ของ|ประเภท)/i,
      /(?:gate|runner|cavity).*(?:position|design)/i,
      /mold.*(?:design|structure|type)/i,
      /tooling.*(?:for|design)/i,
    ],
  },

  GENERAL: {
    key: 'general',
    emoji: '💡',
    name: 'ทั่วไป',
    nameEn: 'General',
    description: 'คำถามทั่วไป ไม่ตรงหมวดหมู่ใด',
    keywords: [
      'สวัสดี', 'ทักทาย', 'ขอบคุณ', 'ช่วย',
      'hello', 'hi', 'thanks', 'thank you', 'help',
      'สอบถาม', 'อยากรู้', 'บอก',
      'ask', 'question', 'tell', 'want to know',
    ],
    patterns: [
      /^(?:สวัสดี|hello|hi)/i,
      /^(?:ขอบคุณ|thank)/i,
    ],
  },
};

// ========================================
// 🤖 CATEGORY DETECTION ENGINE
// ========================================

/**
 * วิเคราะห์และจำแนกคำถามเข้าสู่หมวดหมู่
 * @param {string} query - คำถามจากผู้ใช้
 * @param {Array} chatHistory - ประวัติการสนทนา
 * @returns {Object} ผลการวิเคราะห์หมวดหมู่
 */
function detectQuestionCategory(query, chatHistory = []) {
  const queryLower = query.toLowerCase();
  const scores = {};

  // คำนวณคะแนนสำหรับแต่ละหมวดหมู่
  for (const [catKey, category] of Object.entries(QUESTION_CATEGORIES)) {
    let score = 0;

    // 1. ตรวจสอบ Keywords
    for (const keyword of category.keywords) {
      if (keyword instanceof RegExp) {
        if (keyword.test(queryLower)) {
          score += 2;
        }
      } else if (typeof keyword === 'string') {
        const keywordLower = keyword.toLowerCase();
        if (queryLower.includes(keywordLower)) {
          // คะแนนเพิ่มถ้าเป็นคำที่ยาวกว่า (มีความเฉพาะเจาะจงมากกว่า)
          score += keyword.length > 5 ? 2 : 1;
        }
      }
    }

    // 2. ตรวจสอบ Patterns
    if (category.patterns) {
      for (const pattern of category.patterns) {
        if (pattern.test(query)) {
          score += 3; // Pattern มีความสำคัญมากกว่า keyword
        }
      }
    }

    scores[catKey] = score;
  }

  // หาหมวดหมู่ที่มีคะแนนสูงสุด
  let maxScore = 0;
  let primaryCategory = 'GENERAL';
  const secondaryCategories = [];

  for (const [catKey, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryCategory = catKey;
    } else if (score > 0 && score >= maxScore * 0.6) {
      // หมวดหมู่รองคือหมวดที่มีคะแนนมากกว่า 60% ของหมวดหลัก
      secondaryCategories.push(catKey);
    }
  }

  // ถ้าไม่มีหมวดหมู่ไหนเด่นชัด ให้เป็น GENERAL
  if (maxScore === 0) {
    primaryCategory = 'GENERAL';
  }

  const categoryData = QUESTION_CATEGORIES[primaryCategory];

  return {
    primary: {
      key: primaryCategory,
      emoji: categoryData.emoji,
      name: categoryData.name,
      nameEn: categoryData.nameEn,
      description: categoryData.description,
      confidence: Math.min(maxScore / 10, 1.0), // Normalize to 0-1
    },
    secondary: secondaryCategories.map((key) => ({
      key,
      emoji: QUESTION_CATEGORIES[key].emoji,
      name: QUESTION_CATEGORIES[key].name,
    })),
    scores, // สำหรับ debug
    allCategories: QUESTION_CATEGORIES,
  };
}

// ========================================
// 🎯 CATEGORY-SPECIFIC AI HELPERS
// ========================================

/**
 * สร้าง System Prompt เฉพาะสำหรับแต่ละหมวดหมู่
 * @param {Object} categoryInfo - ข้อมูลหมวดหมู่
 * @param {string} query - คำถามต้นฉบับ
 * @returns {string} Enhanced system prompt
 */
function getCategoryEnhancedPrompt(categoryInfo, query) {
  const {primary, secondary} = categoryInfo;

  let enhancedPrompt = `\n\n## 🎯 CATEGORY-ENHANCED RESPONSE SYSTEM\n`;
  enhancedPrompt += `**Primary Category:** ${primary.emoji} ${primary.name} (${primary.nameEn})\n`;
  enhancedPrompt += `**Confidence:** ${Math.round(primary.confidence * 100)}%\n`;
  
  if (secondary && secondary.length > 0) {
    enhancedPrompt += `**Related Categories:** ${secondary.map(s => s.emoji + ' ' + s.name).join(', ')}\n`;
  }

  enhancedPrompt += `\n### 📋 SPECIALIZED RESPONSE INSTRUCTIONS:\n`;

  switch (primary.key) {
    case 'CALCULATION':
      enhancedPrompt += `
1. **Show step-by-step calculation** with formulas
2. **Display units clearly** (e.g., °C, MPa, kg)
3. **Provide numerical results** with appropriate precision
4. **Include safety ranges** or acceptable tolerances
5. **Offer alternative calculation methods** if applicable

Example format:
📐 **Calculation Steps:**
- Formula: [equation]
- Input values: [list]
- Calculation: [step by step]
- **Result: [number] [unit]**
- Acceptable range: [min-max]
`;
      break;

    case 'HOWTO':
      enhancedPrompt += `
1. **Provide clear step-by-step instructions**
2. **Number each step** for easy following
3. **Include visual cues** or descriptions where helpful
4. **Mention tools/equipment needed**
5. **Add tips and warnings** for critical steps

Example format:
📚 **How-To Guide:**
🔧 **Tools Needed:** [list]
📝 **Steps:**
1. [First step with details]
2. [Second step with details]
...
💡 **Tips:** [helpful hints]
⚠️ **Warnings:** [safety notes]
`;
      break;

    case 'TROUBLESHOOTING':
      enhancedPrompt += `
1. **Diagnose the problem** clearly
2. **List possible causes** in order of likelihood
3. **Provide solutions** for each cause
4. **Include verification steps** to confirm the fix
5. **Prevent recurrence** with recommendations

Example format:
🔍 **Problem Analysis:**
- Symptom: [description]
- Likely causes:
  1. [Cause 1] → Solution: [steps]
  2. [Cause 2] → Solution: [steps]
- **Verification:** [how to check if fixed]
- **Prevention:** [avoid future issues]
`;
      break;

    case 'COMPARISON':
      enhancedPrompt += `
1. **Create side-by-side comparison**
2. **List advantages and disadvantages** clearly
3. **Use objective criteria** (cost, performance, etc.)
4. **Provide recommendation** based on use case
5. **Include decision factors**

Example format:
⚖️ **Comparison Analysis:**
| Feature | Option A | Option B |
|---------|----------|----------|
| Cost | [value] | [value] |
| Performance | [desc] | [desc] |
✅ **Advantages of A:** [list]
❌ **Disadvantages of A:** [list]
💡 **Recommendation:** [based on context]
`;
      break;

    case 'RECOMMENDATION':
      enhancedPrompt += `
1. **Provide clear recommendation** with reasoning
2. **Consider user's context** (budget, experience, etc.)
3. **Offer alternatives** with pros/cons
4. **Explain why this is best** for their situation
5. **Include implementation tips**

Example format:
⭐ **Recommendation:**
🎯 **Best Choice:** [option]
**Reasons:**
- [Reason 1]
- [Reason 2]
**Alternatives:**
- [Option B]: Good if [condition]
💡 **Implementation:** [how to proceed]
`;
      break;

    case 'ANALYSIS':
      enhancedPrompt += `
1. **Analyze root causes** systematically
2. **Present data and evidence**
3. **Explain relationships** between factors
4. **Draw logical conclusions**
5. **Suggest data-driven actions**

Example format:
📊 **Analysis Report:**
🔍 **Root Cause:** [primary cause]
📈 **Contributing Factors:**
- Factor 1: [impact]
- Factor 2: [impact]
🎯 **Conclusions:** [key findings]
💡 **Recommendations:** [action items]
`;
      break;

    case 'EDUCATION':
      enhancedPrompt += `
1. **Explain concepts clearly** from basics
2. **Use analogies** and examples
3. **Build knowledge progressively**
4. **Include visual descriptions** when helpful
5. **Provide learning resources** or next steps

Example format:
🎓 **Educational Content:**
📚 **Concept:** [main topic]
🔰 **Basics:** [fundamental explanation]
💡 **Key Points:**
- Point 1: [description]
- Point 2: [description]
📖 **Example:** [real-world case]
🎯 **Next Steps:** [how to learn more]
`;
      break;

    case 'SAFETY':
      enhancedPrompt += `
1. **Prioritize safety warnings** prominently
2. **List hazards** and risk levels
3. **Provide protective measures** clearly
4. **Include emergency procedures** if relevant
5. **Reference standards** or regulations

Example format:
🛡️ **Safety Information:**
⚠️ **WARNINGS:**
- [Critical hazard 1]
- [Critical hazard 2]
🔒 **Protective Measures:**
- [Required PPE]
- [Safety procedures]
🚨 **Emergency Response:** [what to do if...]
📋 **Standards:** [relevant regulations]
`;
      break;

    case 'QUALITY':
      enhancedPrompt += `
1. **Define quality criteria** clearly
2. **Provide measurement methods**
3. **Include acceptable tolerances**
4. **Describe inspection procedures**
5. **Reference quality standards**

Example format:
✅ **Quality Control:**
📏 **Criteria:** [specifications]
🔬 **Testing Method:** [procedure]
📊 **Acceptable Range:** [min-max values]
✔️ **Pass/Fail:** [decision criteria]
📋 **Standards:** [ISO, ASTM, etc.]
`;
      break;

    case 'COST':
      enhancedPrompt += `
1. **Break down cost components**
2. **Show calculations** transparently
3. **Include hidden costs** often overlooked
4. **Provide cost-saving tips**
5. **Compare alternatives** economically

Example format:
💰 **Cost Analysis:**
📊 **Breakdown:**
- Material: [amount]
- Labor: [amount]
- Equipment: [amount]
- Overhead: [amount]
**Total: [sum]**
💡 **Savings Tips:** [recommendations]
⚖️ **Alternatives:** [cheaper options if any]
`;
      break;

    default:
      enhancedPrompt += `
Provide a comprehensive, well-structured response that:
1. Directly answers the question
2. Includes relevant details and context
3. Uses clear formatting and examples
4. Offers practical insights or next steps
`;
  }

  enhancedPrompt += `\n### 🎯 USER QUERY:\n"${query}"\n`;
  enhancedPrompt += `\n**Remember:** Your response should be tailored specifically for the ${primary.name} category while being clear, accurate, and actionable.\n`;

  return enhancedPrompt;
}

/**
 * สร้าง suggestions สำหรับแต่ละหมวดหมู่
 * @param {Object} categoryInfo - ข้อมูลหมวดหมู่
 * @returns {Array<string>} รายการคำแนะนำ
 */
function getCategorySuggestions(categoryInfo) {
  const {primary} = categoryInfo;
  const suggestions = [];

  const CATEGORY_SUGGESTIONS = {
    CALCULATION: [
      'คำนวณเวลาหล่อเย็น',
      'หาค่าความดันที่เหมาะสม',
      'คำนวณ shot size',
      'หา clamping force ที่ต้องใช้',
    ],
    HOWTO: [
      'วิธีตั้งค่าเครื่องฉีด',
      'วิธีแก้ปัญหาไม่เต็มแบบ',
      'วิธีอบแห้งวัสดุ',
      'วิธีบำรุงรักษาแม่พิมพ์',
    ],
    EDUCATION: [
      'เรียนรู้พื้นฐานการฉีดพลาสติก',
      'หลักการออกแบบแม่พิมพ์',
      'ทฤษฎีการไหลของพลาสติก',
      'เข้าใจ cycle time',
    ],
    TECHNICAL: [
      'สเปคเครื่องฉีดที่เหมาะสม',
      'พารามิเตอร์ของ ABS',
      'ค่า back pressure ที่ดี',
      'อุณหภูมิแม่พิมพ์ของ PP',
    ],
    TROUBLESHOOTING: [
      'แก้ปัญหารอยไหม้',
      'แก้ short shot',
      'แก้ weld line',
      'แก้ปัญหางอ',
    ],
    COMPARISON: [
      'เปรียบเทียบ ABS กับ PP',
      'Hot runner vs Cold runner',
      'Two-plate vs Three-plate mold',
      'Electric vs Hydraulic machine',
    ],
    RECOMMENDATION: [
      'แนะนำพลาสติกสำหรับชิ้นงานบาง',
      'แนะนำวิธีลด cycle time',
      'แนะนำเครื่องฉีดสำหรับ SME',
      'แนะนำวิธีประหยัดต้นทุน',
    ],
    ANALYSIS: [
      'วิเคราะห์สาเหตุสินค้าเสีย',
      'วิเคราะห์ต้นทุนการผลิต',
      'วิเคราะห์ผลกระทบของความชื้น',
      'วิเคราะห์ประสิทธิภาพการผลิต',
    ],
    EXPLANATION: [
      'อธิบาย injection molding',
      'อธิบาย gate system',
      'อธิบาย cooling system',
      'อธิบาย ejection system',
    ],
    DEFINITION: [
      'Flash คืออะไร',
      'Short shot คืออะไร',
      'Weld line คืออะไร',
      'Shrinkage คืออะไร',
    ],
    SAFETY: [
      'ข้อควรระวังเวลาใช้เครื่องฉีด',
      'อันตรายจากความร้อน',
      'PPE ที่ต้องใช้',
      'ป้องกันอุบัติเหตุ',
    ],
    MAINTENANCE: [
      'บำรุงรักษาสกรู',
      'ทำความสะอาดแม่พิมพ์',
      'ตรวจเช็คระบบไฮดรอลิก',
      'เปลี่ยนน้ำมันเครื่อง',
    ],
    QUALITY: [
      'ควบคุมคุณภาพชิ้นงาน',
      'ตรวจสอบมิติของชิ้นงาน',
      'วัดความแข็ง',
      'ทดสอบแรงดึง',
    ],
    COST: [
      'คำนวณต้นทุนต่อชิ้น',
      'ประมาณค่าแม่พิมพ์',
      'ต้นทุนวัตถุดิบ',
      'ลดต้นทุนการผลิต',
    ],
    MATERIAL: [
      'คุณสมบัติของ ABS',
      'ความแตกต่างระหว่าง HDPE กับ LDPE',
      'วัสดุที่ทนความร้อนสูง',
      'เลือกวัสดุสำหรับงานกลางแจ้ง',
    ],
    PROCESS: [
      'กระบวนการฉีดพลาสติก',
      'ขั้นตอนการตั้งเครื่อง',
      'วงจรการฉีด (cycle)',
      'เพิ่มประสิทธิภาพการผลิต',
    ],
    MACHINE: [
      'เลือกขนาดเครื่องฉีด',
      'ส่วนประกอบของเครื่องฉีด',
      'ความแตกต่างระหว่าง Hydraulic กับ Electric',
      'บำรุงรักษาเครื่องฉีด',
    ],
    MOLD: [
      'ออกแบบแม่พิมพ์',
      'ประเภทของ gate',
      'ระบบระบายอากาศ',
      'ช่องน้ำในแม่พิมพ์',
    ],
    GENERAL: [
      'ถามเกี่ยวกับการฉีดพลาสติก',
      'ต้องการความช่วยเหลือ',
      'มีคำถาม',
      'ปรึกษาปัญหา',
    ],
  };

  const categorySuggestions = CATEGORY_SUGGESTIONS[primary.key] || CATEGORY_SUGGESTIONS.GENERAL;
  
  // สุ่มเลือก 3 suggestions
  const shuffled = categorySuggestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

// ========================================
// 📤 EXPORTS
// ========================================
module.exports = {
  QUESTION_CATEGORIES,
  detectQuestionCategory,
  getCategoryEnhancedPrompt,
  getCategorySuggestions,
};
