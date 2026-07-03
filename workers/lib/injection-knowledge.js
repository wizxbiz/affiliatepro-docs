const MATERIALS = {
  ABS: {
    name: 'ABS (Acrylonitrile Butadiene Styrene)',
    thai: 'เอบีเอส',
    category: 'Engineering plastic',
    melt: '200-260 C, แนะนำ 230 C',
    mold: '40-80 C, แนะนำ 60 C',
    drying: '80 C 2-4 ชั่วโมง',
    moisture: '< 0.1%',
    shrinkage: '0.4-0.7%',
    pressure: '50-100 MPa',
    backPressure: '2-5 MPa',
    speed: 'ปานกลางถึงเร็ว',
    properties: ['ทนแรงกระแทกดี', 'ผิวมันเงา', 'แข็งแรง', 'ทำสี/ชุบได้ดี'],
    warnings: ['ต้องอบแห้งก่อนใช้', 'อย่าให้ melt เกิน 280 C', 'ไวต่อ UV'],
    defects: ['Silver streak จากความชื้น', 'Burn mark จากความร้อนสูง', 'Weld line'],
  },
  PP: {
    name: 'PP (Polypropylene)',
    thai: 'โพลีโพรพิลีน',
    category: 'Commodity plastic',
    melt: '200-280 C, แนะนำ 230 C',
    mold: '20-80 C, แนะนำ 40 C',
    drying: 'โดยทั่วไปไม่จำเป็นต้องอบ',
    moisture: 'ดูดความชื้นต่ำ',
    shrinkage: '1.0-2.5%',
    pressure: '40-100 MPa',
    backPressure: '2-5 MPa',
    speed: 'เร็ว',
    properties: ['น้ำหนักเบา', 'ทนสารเคมี', 'ทน fatigue', 'ต้นทุนต่ำ'],
    warnings: ['หดตัวสูง', 'บิดงอง่ายถ้า cooling ไม่สมดุล', 'ติดกาว/พิมพ์สียาก'],
    defects: ['Warpage', 'Sink mark', 'Void'],
  },
  PC: {
    name: 'PC (Polycarbonate)',
    thai: 'โพลีคาร์บอเนต',
    category: 'Engineering plastic',
    melt: '280-320 C, แนะนำ 300 C',
    mold: '80-120 C, แนะนำ 100 C',
    drying: '120 C 4-6 ชั่วโมง',
    moisture: '< 0.02%',
    shrinkage: '0.5-0.7%',
    pressure: '80-150 MPa',
    backPressure: '5-10 MPa',
    speed: 'ปานกลาง',
    properties: ['ใส', 'ทนแรงกระแทกสูง', 'ทนความร้อน', 'แข็งแรง'],
    warnings: ['ต้องอบแห้งเข้มงวด', 'เกิด stress crack ได้', 'ต้องใช้แรงดันสูง'],
    defects: ['Silver streak', 'Stress crack', 'Burn mark'],
  },
  PA: {
    name: 'PA / Nylon (Polyamide)',
    thai: 'ไนลอน',
    category: 'Engineering plastic',
    melt: '260-290 C, แนะนำ 275 C',
    mold: '60-90 C, แนะนำ 80 C',
    drying: '80 C 4-6 ชั่วโมง',
    moisture: '< 0.1%',
    shrinkage: '0.8-2.0%',
    pressure: '60-120 MPa',
    backPressure: '3-8 MPa',
    speed: 'เร็ว',
    properties: ['ทนสึกหรอ', 'ลื่น', 'ทนแรงกระแทก', 'ทนสารเคมี'],
    warnings: ['ดูดความชื้นสูงมาก', 'ต้องอบก่อนใช้ทุกครั้ง', 'หดตัวสูง'],
    defects: ['ฟองจากความชื้น', 'Warpage', 'Sink mark'],
  },
  POM: {
    name: 'POM (Acetal)',
    thai: 'พอม / อะซีทัล',
    category: 'Engineering plastic',
    melt: '180-220 C, แนะนำ 200 C',
    mold: '60-120 C, แนะนำ 90 C',
    drying: '80 C 2-3 ชั่วโมง',
    moisture: '< 0.1%',
    shrinkage: '1.8-3.0%',
    pressure: '80-130 MPa',
    backPressure: '3-8 MPa',
    speed: 'เร็ว',
    properties: ['แข็งแรง', 'ทนสึกหรอ', 'มิติเสถียร', 'ลื่น'],
    warnings: ['อย่าให้ร้อนเกิน 230 C', 'ระบายอากาศให้ดี', 'หดตัวสูง'],
    defects: ['Void', 'Sink mark', 'Warpage'],
  },
  PET: {
    name: 'PET (Polyethylene Terephthalate)',
    thai: 'เพ็ท',
    category: 'Engineering plastic',
    melt: '260-290 C, แนะนำ 275 C',
    mold: '15-50 C, แนะนำ 30 C',
    drying: '160 C 4-6 ชั่วโมง',
    moisture: '< 0.02%',
    shrinkage: '0.2-0.8%',
    pressure: '80-140 MPa',
    backPressure: '3-8 MPa',
    speed: 'เร็วมาก',
    properties: ['ใส', 'ทนสารเคมี', 'รีไซเคิลได้', 'เหมาะกับ preform'],
    warnings: ['ต้องอบแห้งเข้มงวด', 'IV drop ถ้าอบไม่ดี', 'ต้อง cooling เร็ว'],
    defects: ['Crystallization', 'IV drop', 'Silver streak'],
  },
};

const MATERIAL_ALIASES = {
  abs: 'ABS',
  'เอบีเอส': 'ABS',
  pp: 'PP',
  'พีพี': 'PP',
  polypropylene: 'PP',
  pc: 'PC',
  'พีซี': 'PC',
  polycarbonate: 'PC',
  pa: 'PA',
  nylon: 'PA',
  pa6: 'PA',
  pa66: 'PA',
  'ไนลอน': 'PA',
  pom: 'POM',
  acetal: 'POM',
  delrin: 'POM',
  'พอม': 'POM',
  pet: 'PET',
  petg: 'PET',
  'เพ็ท': 'PET',
};

const DEFECTS = {
  SHORT_SHOT: {
    name: 'Short shot',
    thai: 'ฉีดไม่เต็ม / ชิ้นงานไม่เต็ม',
    description: 'พลาสติกไหลเติม cavity ไม่ครบ ทำให้ชิ้นงานขาดบางส่วนหรือปลายทางไหลไม่เต็ม',
    quickFix: 'เพิ่ม shot size/holding, เพิ่ม melt หรือ mold temp ทีละน้อย, ตรวจ gate/runner/vent และลดความต้านทานการไหล',
    causes: [
      'ปริมาณฉีดหรือ cushion ไม่พอ',
      'melt temperature หรือ mold temperature ต่ำเกินไป',
      'injection pressure/speed ต่ำ หรือสลับเป็น holding เร็วเกิน',
      'gate/runner เล็ก อุดตัน หรือ vent ระบายอากาศไม่ดี',
    ],
    solutions: [
      'เพิ่ม shot size และตรวจ cushion ให้เหลือสม่ำเสมอ',
      'เพิ่ม injection pressure/speed ทีละ step แล้วดู flash ประกอบ',
      'เพิ่ม melt temp หรือ mold temp แบบคุมไม่ให้ไหม้',
      'ตรวจ gate, runner, cold slug, vent และทางไหลปลาย cavity',
    ],
    prevention: ['ตั้ง process window จาก short shot study', 'ทำความสะอาด gate/vent ตามรอบ', 'บันทึกค่า cushion และ fill time ทุก lot'],
  },
  FLASH: {
    name: 'Flash',
    thai: 'ครีบ / เนื้อเกิน',
    description: 'พลาสติกไหลออกตาม parting line, insert, slide หรือ pin เพราะแรงปิด/ผิวประกบไม่พอ',
    quickFix: 'ลด pressure/speed/shot ทีละน้อย และตรวจ clamping force กับ parting line',
    causes: [
      'clamping force ไม่พอ',
      'injection/holding pressure สูงเกิน',
      'แม่พิมพ์สึกหรือมีสิ่งสกปรกที่ parting line',
      'melt temperature สูงทำให้ viscosity ต่ำ',
    ],
    solutions: [
      'ลด holding pressure หรือ holding time ก่อนถ้าครีบช่วง pack',
      'ตรวจ clamp tonnage และ mold parallel',
      'ทำความสะอาด/ซ่อม parting line, slide, ejector pin',
      'ลด melt temp หรือ injection speed ถ้าเกิดช่วง fill',
    ],
    prevention: ['ตรวจ wear ของแม่พิมพ์', 'ตั้ง tonnage เผื่อ pressure peak', 'เก็บค่า peak pressure เทียบกับ lot ดี'],
  },
  SINK_MARK: {
    name: 'Sink mark',
    thai: 'รอยยุบ',
    description: 'ผิวด้านนอกยุบจากการหดตัวในบริเวณเนื้อหนา rib หรือ boss',
    quickFix: 'เพิ่ม holding pressure/time และปรับ cooling ให้พอ',
    causes: ['holding pressure/time ไม่พอ', 'gate freeze เร็ว', 'เนื้อหนาเกิน', 'mold temperature สูงหรือ cooling ไม่พอ'],
    solutions: [
      'เพิ่ม holding pressure และ holding time จน gate freeze',
      'ลด melt temp ถ้า cycle ยังรับได้',
      'เพิ่ม cooling time หรือปรับน้ำหล่อเย็นบริเวณเนื้อหนา',
      'ถ้าแก้ที่ process ไม่จบ ให้ปรับ rib/boss ลดความหนา',
    ],
    prevention: ['ทำ gate freeze study', 'ออกแบบ rib ไม่หนาเกิน 50-60% ของ wall', 'ตรวจ cooling channel'],
  },
  WARPAGE: {
    name: 'Warpage',
    thai: 'บิดงอ / โก่ง',
    description: 'ชิ้นงานเสียรูปหลังปลดจากแม่พิมพ์เพราะการหดตัวหรือ cooling ไม่สมดุล',
    quickFix: 'ปรับ mold temp/cooling ให้สมดุล และลด packing stress',
    causes: ['cooling สองฝั่งไม่เท่ากัน', 'packing มากหรือน้อยเกิน', 'ทิศทาง flow ทำให้ orientation สูง', 'ความหนาชิ้นงานไม่สม่ำเสมอ'],
    solutions: [
      'ตรวจอุณหภูมิผิวแม่พิมพ์จริงทั้ง core/cavity',
      'ปรับ cooling time และ flow น้ำหล่อเย็น',
      'ลด injection speed หรือ holding pressure ถ้า stress สูง',
      'ทวน gate location และความหนาผนังถ้า process แก้ไม่พอ',
    ],
    prevention: ['ทำ mold temperature balance', 'ออกแบบ wall thickness สม่ำเสมอ', 'ใช้ fixture cooling เมื่อต้องคุมทรง'],
  },
  SILVER_STREAK: {
    name: 'Silver streak',
    thai: 'เส้นเงิน / รอยความชื้น',
    description: 'เส้นสีเงินตามทิศทางการไหล มักมาจากความชื้น แก๊ส หรือการเสื่อมสภาพของพลาสติก',
    quickFix: 'อบเม็ดใหม่ตาม spec และลด shear/ความร้อนเกิน',
    causes: ['เม็ดพลาสติกชื้น', 'melt temp สูงจนวัสดุเสื่อม', 'back pressure หรือ screw speed สูงเกิน', 'มีอากาศ/แก๊สค้างในกระบอกหรือแม่พิมพ์'],
    solutions: [
      'ยืนยันเวลาและอุณหภูมิอบ พร้อมตรวจ dew point ถ้ามี',
      'ลด melt temp, screw speed หรือ back pressure',
      'purge วัสดุค้างและตรวจ hopper dryer',
      'เพิ่มหรือทำความสะอาด vent',
    ],
    prevention: ['ล็อกมาตรฐานการอบตามวัสดุ', 'ปิดถุง/ถังเม็ดกันชื้น', 'ตรวจ dryer filter และ airflow'],
  },
};

const DEFECT_ALIASES = {
  'short shot': 'SHORT_SHOT',
  shortshot: 'SHORT_SHOT',
  'ฉีดไม่เต็ม': 'SHORT_SHOT',
  'ชิ้นงานไม่เต็ม': 'SHORT_SHOT',
  'ไหลไม่เต็ม': 'SHORT_SHOT',
  flash: 'FLASH',
  burr: 'FLASH',
  'ครีบ': 'FLASH',
  'เนื้อเกิน': 'FLASH',
  'sink mark': 'SINK_MARK',
  sink: 'SINK_MARK',
  'รอยยุบ': 'SINK_MARK',
  'ยุบ': 'SINK_MARK',
  warpage: 'WARPAGE',
  warp: 'WARPAGE',
  'บิดงอ': 'WARPAGE',
  'โก่ง': 'WARPAGE',
  'บิด': 'WARPAGE',
  'งอ': 'WARPAGE',
  'silver streak': 'SILVER_STREAK',
  silver: 'SILVER_STREAK',
  splay: 'SILVER_STREAK',
  'เส้นเงิน': 'SILVER_STREAK',
  'ความชื้น': 'SILVER_STREAK',
};

function hasTextMessage(event) {
  return event?.type === 'message' && event.message?.type === 'text' && event.message.text;
}

function findByAliases(text, aliases) {
  const lower = text.toLowerCase();
  const aliasesByLength = Object.keys(aliases).sort((a, b) => b.length - a.length);
  for (const alias of aliasesByLength) {
    if (lower.includes(alias.toLowerCase())) return aliases[alias];
  }
  return null;
}

function buildMaterialText(key) {
  const material = MATERIALS[key];
  if (!material) return null;

  return [
    `ข้อมูลวัสดุ ${material.name} (${material.thai})`,
    `ประเภท: ${material.category}`,
    '',
    'อุณหภูมิแนะนำ',
    `- Melt: ${material.melt}`,
    `- Mold: ${material.mold}`,
    '',
    `การอบแห้ง: ${material.drying}`,
    `ความชื้นสูงสุด: ${material.moisture}`,
    `การหดตัว: ${material.shrinkage}`,
    '',
    'ค่าตั้งต้นที่ใช้เช็คหน้างาน',
    `- Injection pressure: ${material.pressure}`,
    `- Back pressure: ${material.backPressure}`,
    `- Injection speed: ${material.speed}`,
    '',
    `จุดเด่น: ${material.properties.join(', ')}`,
    `ข้อควรระวัง: ${material.warnings.join(', ')}`,
    `ปัญหาที่พบบ่อย: ${material.defects.join(', ')}`,
  ].join('\n');
}

function buildDefectText(key) {
  const defect = DEFECTS[key];
  if (!defect) return null;

  return [
    `ปัญหา ${defect.name} (${defect.thai})`,
    defect.description,
    '',
    `Quick fix: ${defect.quickFix}`,
    '',
    'สาเหตุที่ควรเช็ค',
    ...defect.causes.map((cause, index) => `${index + 1}. ${cause}`),
    '',
    'วิธีแก้ทีละขั้น',
    ...defect.solutions.map((solution, index) => `${index + 1}. ${solution}`),
    '',
    'การป้องกัน',
    ...defect.prevention.map((item) => `- ${item}`),
  ].join('\n');
}

function quickReplyFor(type, key) {
  if (type === 'material') {
    return [
      { label: 'Short Shot', text: 'short shot' },
      { label: 'Flash', text: 'flash' },
      { label: 'รอยยุบ', text: 'รอยยุบ' },
      { label: 'PP', text: 'PP' },
    ];
  }

  if (type === 'defect') {
    return [
      { label: 'ABS', text: 'ABS' },
      { label: 'PP', text: 'PP' },
      { label: 'Warpage', text: 'warpage' },
      { label: 'เส้นเงิน', text: 'silver streak' },
    ];
  }

  return [
    { label: 'ABS', text: 'ABS' },
    { label: 'PP', text: 'PP' },
    { label: 'Short Shot', text: 'short shot' },
    { label: 'Flash', text: 'flash' },
  ];
}

function toLineQuickReply(items) {
  return {
    items: items.slice(0, 13).map((item) => ({
      type: 'action',
      action: {
        type: 'message',
        label: item.label,
        text: item.text,
      },
    })),
  };
}

export function buildInjectionKnowledgeReply(events) {
  const event = events.find(hasTextMessage);
  if (!event) return null;

  const text = event.message.text.trim();
  if (!text) return null;

  const materialKey = findByAliases(text, MATERIAL_ALIASES);
  if (materialKey && MATERIALS[materialKey]) {
    return {
      replyToken: event.replyToken,
      source: 'worker-material-db',
      messages: [{
        type: 'text',
        text: buildMaterialText(materialKey),
        quickReply: toLineQuickReply(quickReplyFor('material', materialKey)),
      }],
    };
  }

  const defectKey = findByAliases(text, DEFECT_ALIASES);
  if (defectKey && DEFECTS[defectKey]) {
    return {
      replyToken: event.replyToken,
      source: 'worker-defect-db',
      messages: [{
        type: 'text',
        text: buildDefectText(defectKey),
        quickReply: toLineQuickReply(quickReplyFor('defect', defectKey)),
      }],
    };
  }

  if (/^\/?help$/i.test(text) || /^(เมนู|ช่วยเหลือ|help)$/i.test(text)) {
    return {
      replyToken: event.replyToken,
      source: 'worker-help',
      messages: [{
        type: 'text',
        text: buildFallbackText(),
        quickReply: toLineQuickReply(quickReplyFor('fallback')),
      }],
    };
  }

  return null;
}
