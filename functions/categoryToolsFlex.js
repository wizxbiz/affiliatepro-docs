/**
 * ====================================================================
 * 🎯 CATEGORY TOOLS FLEX MESSAGES
 * ====================================================================
 * สร้าง Flex Messages สำหรับแสดงเมนู 18 หมวดหมู่ AI Assistant
 * ในระบบ LINE WEBHOOK
 * ====================================================================
 */

/**
 * สร้าง Main Menu ของ Category Tools (แบบ Carousel)
 */
function createCategoryToolsMenuFlex() {
  const categories = [
    {emoji: "🧮", name: "การคำนวณ", key: "calculation", desc: "คำนวณค่าต่างๆ เช่น อุณหภูมิ ความดัน"},
    {emoji: "📚", name: "วิธีการ", key: "howto", desc: "แนะนำขั้นตอนและวิธีการทำงาน"},
    {emoji: "🎓", name: "การศึกษา", key: "education", desc: "เรียนรู้หลักการ ทฤษฎี แนวคิด"},
    {emoji: "🔧", name: "ด้านเทคนิค", key: "technical", desc: "รายละเอียดทางเทคนิค สเปค"},
    {emoji: "🔍", name: "แก้ปัญหา", key: "troubleshooting", desc: "วินิจฉัยและแก้ไขปัญหา"},
    {emoji: "⚖️", name: "เปรียบเทียบ", key: "comparison", desc: "เปรียบเทียบความแตกต่าง"},
  ];

  const bubbles = categories.map(cat => ({
    type: "bubble",
    size: "micro",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: cat.emoji,
          size: "xxl",
          align: "center",
        },
      ],
      paddingAll: "lg",
      backgroundColor: "#F7F8FA",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: cat.name,
          weight: "bold",
          size: "md",
          align: "center",
          wrap: true,
        },
        {
          type: "text",
          text: cat.desc,
          size: "xs",
          color: "#8B8B8B",
          align: "center",
          wrap: true,
          margin: "sm",
        },
      ],
      paddingAll: "lg",
      spacing: "sm",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "message",
            label: "เลือก",
            text: `/cat ${cat.key}`,
          },
        },
      ],
      paddingAll: "sm",
    },
  }));

  return {
    type: "flex",
    altText: "🎯 เมนู AI Assistant - 18 หมวดหมู่",
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

/**
 * สร้างเมนูหมวดหมู่เพิ่มเติม (หน้า 2)
 */
function createCategoryToolsMenuFlex2() {
  const categories = [
    {emoji: "⭐", name: "คำแนะนำ", key: "recommendation", desc: "แนะนำตัวเลือกที่ดีที่สุด"},
    {emoji: "📊", name: "วิเคราะห์", key: "analysis", desc: "วิเคราะห์สาเหตุและผลกระทบ"},
    {emoji: "💬", name: "อธิบาย", key: "explanation", desc: "อธิบายความหมายและหลักการ"},
    {emoji: "📖", name: "คำจำกัดความ", key: "definition", desc: "นิยามและความหมายคำศัพท์"},
    {emoji: "🛡️", name: "ความปลอดภัย", key: "safety", desc: "ข้อควรระวังและมาตรการ"},
    {emoji: "🔨", name: "บำรุงรักษา", key: "maintenance", desc: "การดูแลและบำรุงรักษา"},
  ];

  const bubbles = categories.map(cat => ({
    type: "bubble",
    size: "micro",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: cat.emoji,
          size: "xxl",
          align: "center",
        },
      ],
      paddingAll: "lg",
      backgroundColor: "#F7F8FA",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: cat.name,
          weight: "bold",
          size: "md",
          align: "center",
          wrap: true,
        },
        {
          type: "text",
          text: cat.desc,
          size: "xs",
          color: "#8B8B8B",
          align: "center",
          wrap: true,
          margin: "sm",
        },
      ],
      paddingAll: "lg",
      spacing: "sm",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "message",
            label: "เลือก",
            text: `/cat ${cat.key}`,
          },
        },
      ],
      paddingAll: "sm",
    },
  }));

  return {
    type: "flex",
    altText: "🎯 เมนู AI Assistant - หน้า 2",
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

/**
 * สร้างเมนูหมวดหมู่เพิ่มเติม (หน้า 3)
 */
function createCategoryToolsMenuFlex3() {
  const categories = [
    {emoji: "✅", name: "คุณภาพ", key: "quality", desc: "การควบคุมคุณภาพและมาตรฐาน"},
    {emoji: "💰", name: "ต้นทุน", key: "cost", desc: "การคำนวณต้นทุนและราคา"},
    {emoji: "🧪", name: "วัสดุ", key: "material", desc: "คุณสมบัติและชนิดวัสดุ"},
    {emoji: "⚙️", name: "กระบวนการ", key: "process", desc: "กระบวนการผลิตและขั้นตอน"},
    {emoji: "🏭", name: "เครื่องจักร", key: "machine", desc: "เครื่องจักรและอุปกรณ์"},
    {emoji: "🔩", name: "แม่พิมพ์", key: "mold", desc: "การออกแบบแม่พิมพ์"},
  ];

  const bubbles = categories.map(cat => ({
    type: "bubble",
    size: "micro",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: cat.emoji,
          size: "xxl",
          align: "center",
        },
      ],
      paddingAll: "lg",
      backgroundColor: "#F7F8FA",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: cat.name,
          weight: "bold",
          size: "md",
          align: "center",
          wrap: true,
        },
        {
          type: "text",
          text: cat.desc,
          size: "xs",
          color: "#8B8B8B",
          align: "center",
          wrap: true,
          margin: "sm",
        },
      ],
      paddingAll: "lg",
      spacing: "sm",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          action: {
            type: "message",
            label: "เลือก",
            text: `/cat ${cat.key}`,
          },
        },
      ],
      paddingAll: "sm",
    },
  }));

  return {
    type: "flex",
    altText: "🎯 เมนู AI Assistant - หน้า 3",
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

/**
 * สร้างเมนูรวม (Quick Reply) สำหรับการนำทาง
 */
function createCategoryNavigationQuickReply() {
  return {
    type: "text",
    text: "🎯 เลือกหมวดหมู่ที่ต้องการ หรือพิมพ์คำถามได้เลย!",
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "message",
            label: "📄 หน้า 1",
            text: "/categories",
          },
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "📄 หน้า 2",
            text: "/categories2",
          },
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "📄 หน้า 3",
            text: "/categories3",
          },
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "💡 ทั่วไป",
            text: "/cat general",
          },
        },
        {
          type: "action",
          action: {
            type: "message",
            label: "❓ ช่วยเหลือ",
            text: "/help",
          },
        },
      ],
    },
  };
}

/**
 * สร้างข้อความแสดงรายละเอียดหมวดหมู่
 */
function createCategoryDetailFlex(categoryKey) {
  const categoryData = {
    calculation: {
      emoji: "🧮",
      name: "การคำนวณ",
      desc: "AI จะช่วยคุณคำนวณค่าต่างๆ แบบละเอียด",
      examples: [
        "คำนวณเวลาหล่อเย็น",
        "หาค่าความดันที่เหมาะสม",
        "คำนวณ shot size",
        "หา clamping force",
      ],
    },
    howto: {
      emoji: "📚",
      name: "วิธีการ",
      desc: "AI จะแนะนำวิธีการทำงานแบบทีละขั้นตอน",
      examples: [
        "วิธีตั้งค่าเครื่องฉีด",
        "วิธีแก้ปัญหาไม่เต็มแบบ",
        "วิธีอบแห้งวัสดุ",
        "วิธีบำรุงรักษาแม่พิมพ์",
      ],
    },
    education: {
      emoji: "🎓",
      name: "การศึกษา",
      desc: "AI จะอธิบายหลักการและทฤษฎีให้เข้าใจ",
      examples: [
        "เรียนรู้พื้นฐานการฉีดพลาสติก",
        "หลักการออกแบบแม่พิมพ์",
        "ทฤษฎีการไหลของพลาสติก",
        "เข้าใจ cycle time",
      ],
    },
    technical: {
      emoji: "🔧",
      name: "ด้านเทคนิค",
      desc: "AI จะให้รายละเอียดทางเทคนิคและสเปค",
      examples: [
        "สเปคเครื่องฉีดที่เหมาะสม",
        "พารามิเตอร์ของ ABS",
        "ค่า back pressure ที่ดี",
        "อุณหภูมิแม่พิมพ์ของ PP",
      ],
    },
    troubleshooting: {
      emoji: "🔍",
      name: "แก้ปัญหา",
      desc: "AI จะวิเคราะห์และแนะนำวิธีแก้ไข",
      examples: [
        "แก้ปัญหารอยไหม้",
        "แก้ short shot",
        "แก้ weld line",
        "แก้ปัญหางอ",
      ],
    },
    comparison: {
      emoji: "⚖️",
      name: "เปรียบเทียบ",
      desc: "AI จะเปรียบเทียบข้อดี-ข้อเสียให้",
      examples: [
        "เปรียบเทียบ ABS กับ PP",
        "Hot runner vs Cold runner",
        "Two-plate vs Three-plate",
        "Electric vs Hydraulic",
      ],
    },
    recommendation: {
      emoji: "⭐",
      name: "คำแนะนำ",
      desc: "AI จะแนะนำตัวเลือกที่ดีที่สุด",
      examples: [
        "แนะนำพลาสติกสำหรับชิ้นงานบาง",
        "แนะนำวิธีลด cycle time",
        "แนะนำเครื่องฉีดสำหรับ SME",
        "แนะนำวิธีประหยัดต้นทุน",
      ],
    },
    analysis: {
      emoji: "📊",
      name: "วิเคราะห์",
      desc: "AI จะวิเคราะห์สาเหตุและผลกระทบ",
      examples: [
        "วิเคราะห์สาเหตุสินค้าเสีย",
        "วิเคราะห์ต้นทุนการผลิต",
        "วิเคราะห์ผลกระทบของความชื้น",
        "วิเคราะห์ประสิทธิภาพ",
      ],
    },
    // เพิ่มหมวดหมู่อื่นๆ ตามต้องการ
    general: {
      emoji: "💡",
      name: "ทั่วไป",
      desc: "คำถามทั่วไปและการสนทนา",
      examples: [
        "ถามเกี่ยวกับการฉีดพลาสติก",
        "ต้องการความช่วยเหลือ",
        "มีคำถาม",
        "ปรึกษาปัญหา",
      ],
    },
  };

  const data = categoryData[categoryKey] || categoryData.general;

  return {
    type: "flex",
    altText: `${data.emoji} ${data.name}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: data.emoji,
            size: "3xl",
            align: "center",
          },
          {
            type: "text",
            text: data.name,
            weight: "bold",
            size: "xl",
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "lg",
        backgroundColor: "#4A90E2",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: data.desc,
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "💡 ตัวอย่างคำถาม:",
            weight: "bold",
            size: "sm",
            margin: "lg",
          },
          ...data.examples.map((ex, index) => ({
            type: "button",
            style: "link",
            action: {
              type: "message",
              label: `${index + 1}. ${ex}`,
              text: ex,
            },
            margin: "sm",
          })),
        ],
        paddingAll: "lg",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "💬 หรือพิมพ์คำถามของคุณได้เลย!",
            size: "xs",
            color: "#8B8B8B",
            align: "center",
          },
        ],
        paddingAll: "md",
      },
    },
  };
}

// ========================================
// 📤 EXPORTS
// ========================================
module.exports = {
  createCategoryToolsMenuFlex,
  createCategoryToolsMenuFlex2,
  createCategoryToolsMenuFlex3,
  createCategoryNavigationQuickReply,
  createCategoryDetailFlex,
};
