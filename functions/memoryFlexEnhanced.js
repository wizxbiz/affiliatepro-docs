/**
 * 🎨 Enhanced Flex Messages for Memory Note System
 * Modern, Beautiful, and User-Friendly Designs
 */

const NOTE_CATEGORIES = {
  meeting: {emoji: "🤝", name: "ประชุม", color: "#3498db", gradient: "#3498db,#2980b9"},
  appointment: {emoji: "📅", name: "นัดหมาย", color: "#9b59b6", gradient: "#9b59b6,#8e44ad"},
  reminder: {emoji: "⏰", name: "เตือน", color: "#e74c3c", gradient: "#e74c3c,#c0392b"},
  task: {emoji: "📋", name: "งาน", color: "#27ae60", gradient: "#27ae60,#229954"},
  idea: {emoji: "💡", name: "ไอเดีย", color: "#f39c12", gradient: "#f39c12,#e67e22"},
  note: {emoji: "📝", name: "บันทึก", color: "#1abc9c", gradient: "#1abc9c,#16a085"},
  event: {emoji: "🎉", name: "กิจกรรม", color: "#e91e63", gradient: "#e91e63,#c2185b"},
  shopping: {emoji: "🛒", name: "ซื้อของ", color: "#ff9800", gradient: "#ff9800,#f57c00"},
  health: {emoji: "💊", name: "สุขภาพ", color: "#00bcd4", gradient: "#00bcd4,#0097a7"},
  work: {emoji: "💼", name: "ธุรกิจ", color: "#607d8b", gradient: "#607d8b,#546e7a"},
  personal: {emoji: "👤", name: "ส่วนตัว", color: "#795548", gradient: "#795548,#6d4c41"},
  finance: {emoji: "💰", name: "การเงิน", color: "#4caf50", gradient: "#4caf50,#43a047"},
};

/**
 * 🎉 Modern Note Saved Flex Message
 */
function createModernNoteSavedFlex(note, userName = "คุณ") {
  const category = NOTE_CATEGORIES[note.category] || NOTE_CATEGORIES.note;
  const timeStr = note.time ? `${note.time} น.` : "ไม่ระบุเวลา";

  return {
    type: "flex",
    altText: `✅ บันทึกสำเร็จ: ${note.content.substring(0, 40)}...`,
    contents: {
      type: "bubble",
      size: "mega",
      hero: {
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
                  {
                    type: "text",
                    text: "✨ บันทึกสำเร็จ!",
                    size: "xl",
                    weight: "bold",
                    color: "#ffffff",
                  },
                  {
                    type: "text",
                    text: "NOTE SAVED SUCCESSFULLY",
                    size: "xs",
                    color: "#ffffffcc",
                    margin: "sm",
                  },
                ],
              },
              {
                type: "text",
                text: "✓",
                size: "xxl",
                color: "#ffffff",
                flex: 0,
                align: "end",
                gravity: "center",
              },
            ],
          },
        ],
        backgroundColor: category.color,
        paddingAll: "25px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Category Badge
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "icon",
                url: "https://developers-resource.landpress.line.me/fx/clip/clip14.png",
                size: "sm",
              },
              {
                type: "text",
                text: `${category.emoji} ${category.name}`,
                size: "sm",
                color: category.color,
                weight: "bold",
                margin: "sm",
              },
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          // Content Card
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            backgroundColor: "#f7f7f7",
            cornerRadius: "12px",
            paddingAll: "16px",
            contents: [
              {
                type: "text",
                text: "📝 เนื้อหาที่บันทึก",
                size: "xs",
                color: "#999999",
                weight: "bold",
              },
              {
                type: "text",
                text: note.content,
                size: "md",
                color: "#111111",
                wrap: true,
                margin: "md",
                weight: "bold",
              },
            ],
          },
          // Date Time Info
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "📅",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "วันที่",
                    size: "xs",
                    color: "#aaaaaa",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: note.dateKey || "วันนี้",
                    size: "sm",
                    color: "#666666",
                    flex: 3,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "⏰",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "เวลา",
                    size: "xs",
                    color: "#aaaaaa",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: timeStr,
                    size: "sm",
                    color: "#666666",
                    flex: 3,
                    align: "end",
                  },
                ],
              },
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          // Quick Tips
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            backgroundColor: "#fff9e6",
            cornerRadius: "8px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "💡 คำแนะนำ",
                size: "xs",
                color: "#f39c12",
                weight: "bold",
              },
              {
                type: "text",
                text: "พิมพ์ /memory วันนี้ เพื่อดูบันทึกทั้งหมดของวันนี้",
                size: "xxs",
                color: "#999999",
                wrap: true,
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: category.color,
            action: {
              type: "message",
              label: "📋 ดูบันทึกวันนี้",
              text: "/memory วันนี้",
            },
            height: "sm",
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "link",
                action: {
                  type: "message",
                  label: "➕ เพิ่มอีก",
                  text: "บันทึก ",
                },
                height: "sm",
                color: "#999999",
              },
              {
                type: "button",
                style: "link",
                action: {
                  type: "message",
                  label: "🔍 ค้นหา",
                  text: "/memory ค้นหา ",
                },
                height: "sm",
                color: "#999999",
              },
            ],
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * 🎨 Modern Memory Menu Flex Message
 */
function createModernMemoryMenuFlex() {
  return {
    type: "flex",
    altText: "📒 เมนูสมุดบันทึก WiT",
    contents: {
      type: "carousel",
      contents: [
        // Main Menu Bubble
        {
          type: "bubble",
          size: "mega",
          hero: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "📒",
                    size: "xxl",
                    align: "center",
                  },
                  {
                    type: "text",
                    text: "MEMORY NOTE",
                    size: "xl",
                    weight: "bold",
                    color: "#ffffff",
                    align: "center",
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: "สมุดบันทึกอัจฉริยะ",
                    size: "sm",
                    color: "#ffffffcc",
                    align: "center",
                    margin: "sm",
                  },
                ],
              },
            ],
            backgroundColor: "#1abc9c",
            paddingAll: "30px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "⚡ คำสั่งยอดนิยม",
                size: "sm",
                weight: "bold",
                color: "#1abc9c",
                margin: "none",
              },
              {
                type: "separator",
                margin: "md",
              },
              // Quick Action Cards
              ...[
                {icon: "📅", title: "ดูบันทึกวันนี้", cmd: "/memory วันนี้", color: "#3498db"},
                {icon: "📋", title: "บันทึกล่าสุด", cmd: "/memory ล่าสุด", color: "#9b59b6"},
                {icon: "🔍", title: "ค้นหาบันทึก", cmd: "/memory ค้นหา ", color: "#e74c3c"},
                {icon: "➕", title: "เพิ่มบันทึกใหม่", cmd: "บันทึก ", color: "#27ae60"},
              ].map((item) => ({
                type: "box",
                layout: "horizontal",
                margin: "lg",
                backgroundColor: "#f7f7f7",
                cornerRadius: "10px",
                paddingAll: "14px",
                action: {
                  type: "message",
                  text: item.cmd,
                },
                contents: [
                  {
                    type: "text",
                    text: item.icon,
                    size: "xl",
                    flex: 0,
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    contents: [
                      {
                        type: "text",
                        text: item.title,
                        size: "sm",
                        weight: "bold",
                        color: "#111111",
                      },
                      {
                        type: "text",
                        text: item.cmd,
                        size: "xs",
                        color: item.color,
                        margin: "xs",
                      },
                    ],
                  },
                ],
              })),
            ],
            paddingAll: "20px",
          },
        },
        // Features Guide Bubble
        {
          type: "bubble",
          size: "mega",
          hero: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "✨",
                size: "xxl",
                align: "center",
              },
              {
                type: "text",
                text: "คู่มือการใช้งาน",
                size: "lg",
                weight: "bold",
                color: "#ffffff",
                align: "center",
                margin: "md",
              },
            ],
            backgroundColor: "#3498db",
            paddingAll: "25px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📝 วิธีใช้งาน",
                size: "md",
                weight: "bold",
                color: "#3498db",
              },
              {
                type: "separator",
                margin: "md",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                spacing: "md",
                contents: [
                  {
                    type: "text",
                    text: "1. บันทึกข้อความ",
                    size: "sm",
                    weight: "bold",
                    color: "#111111",
                  },
                  {
                    type: "text",
                    text: "พิมพ์: บันทึก [ข้อความ]\nตัวอย่าง: บันทึก ประชุมพรุ่งนี้ 14:00 น.",
                    size: "xs",
                    color: "#666666",
                    wrap: true,
                    margin: "sm",
                  },
                  {
                    type: "separator",
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: "2. ดูบันทึกตามวันที่",
                    size: "sm",
                    weight: "bold",
                    color: "#111111",
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: "พิมพ์: /memory วันนี้\nพิมพ์: /memory 12/12/2568",
                    size: "xs",
                    color: "#666666",
                    wrap: true,
                    margin: "sm",
                  },
                  {
                    type: "separator",
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: "3. ค้นหาบันทึก",
                    size: "sm",
                    weight: "bold",
                    color: "#111111",
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: "พิมพ์: /memory ค้นหา [คำค้น]\nตัวอย่าง: /memory ค้นหา ประชุม",
                    size: "xs",
                    color: "#666666",
                    wrap: true,
                    margin: "sm",
                  },
                ],
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
                style: "primary",
                color: "#3498db",
                action: {
                  type: "message",
                  label: "ลองใช้งานเลย!",
                  text: "บันทึก ทดสอบระบบ",
                },
                height: "sm",
              },
            ],
            paddingAll: "15px",
          },
        },
        // Categories Bubble
        {
          type: "bubble",
          size: "mega",
          hero: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🏷️",
                size: "xxl",
                align: "center",
              },
              {
                type: "text",
                text: "หมวดหมู่บันทึก",
                size: "lg",
                weight: "bold",
                color: "#ffffff",
                align: "center",
                margin: "md",
              },
            ],
            backgroundColor: "#9b59b6",
            paddingAll: "25px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ระบบจัดหมวดหมู่อัตโนมัติ",
                size: "sm",
                weight: "bold",
                color: "#9b59b6",
              },
              {
                type: "separator",
                margin: "md",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                spacing: "sm",
                contents: Object.entries(NOTE_CATEGORIES).map(([key, cat]) => ({
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: cat.emoji,
                      size: "md",
                      flex: 0,
                    },
                    {
                      type: "text",
                      text: cat.name,
                      size: "sm",
                      color: cat.color,
                      weight: "bold",
                      margin: "md",
                    },
                  ],
                })),
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                backgroundColor: "#f0f0f0",
                cornerRadius: "8px",
                paddingAll: "12px",
                contents: [
                  {
                    type: "text",
                    text: "💡 เคล็ดลับ",
                    size: "xs",
                    color: "#9b59b6",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: "ใส่คำสำคัญเช่น \"ประชุม\" \"ซื้อ\" \"จ่าย\" ระบบจะจัดหมวดหมู่ให้อัตโนมัติ!",
                    size: "xxs",
                    color: "#666666",
                    wrap: true,
                    margin: "sm",
                  },
                ],
              },
            ],
            paddingAll: "20px",
          },
        },
      ],
    },
  };
}

module.exports = {
  createModernNoteSavedFlex,
  createModernMemoryMenuFlex,
  NOTE_CATEGORIES,
};
