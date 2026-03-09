/**
 * Admin Flex Messages Generator
 * สร้าง Flex Messages สำหรับคำสั่ง Admin ทั้งหมด
 * Version: 2.0.2 - Deploy: 2025-12-07T15:50 - Enhanced Unicode sanitization
 */

/**
 * Sanitize text for LINE Flex Messages
 * ลบตัวอักษร Unicode พิเศษที่ทำให้ LINE API error 400
 * รองรับ: Latin Extended, Mathematical symbols, Special chars
 * @param {string} text - Text to sanitize
 * @return {string} - Sanitized text safe for LINE API
 */
const sanitizeTextForLine = (text) => {
  if (!text || typeof text !== "string") return "Unknown";

  let sanitized = text
    // Replace mathematical bold/italic/script characters with normal ASCII
    .replace(/[\u{1D400}-\u{1D7FF}]/gu, (char) => {
      const code = char.codePointAt(0);
      // Mathematical bold A-Z (U+1D400-U+1D419)
      if (code >= 0x1D400 && code <= 0x1D419) return String.fromCharCode(65 + (code - 0x1D400));
      // Mathematical bold a-z (U+1D41A-U+1D433)
      if (code >= 0x1D41A && code <= 0x1D433) return String.fromCharCode(97 + (code - 0x1D41A));
      // Mathematical bold 0-9 (U+1D7CE-U+1D7D7)
      if (code >= 0x1D7CE && code <= 0x1D7D7) return String.fromCharCode(48 + (code - 0x1D7CE));
      // Mathematical double-struck A-Z (U+1D538-U+1D551)
      if (code >= 0x1D538 && code <= 0x1D551) return String.fromCharCode(65 + (code - 0x1D538));
      // Mathematical double-struck a-z (U+1D552-U+1D56B)
      if (code >= 0x1D552 && code <= 0x1D56B) return String.fromCharCode(97 + (code - 0x1D552));
      // Mathematical double-struck 0-9 (U+1D7D8-U+1D7E1)
      if (code >= 0x1D7D8 && code <= 0x1D7E1) return String.fromCharCode(48 + (code - 0x1D7D8));
      return "";
    })
    // Replace Latin Extended characters with basic ASCII equivalents
    .replace(/[àáâãäåæ]/gi, "a")
    .replace(/[çč]/gi, "c")
    .replace(/[ďð]/gi, "d")
    .replace(/[èéêë]/gi, "e")
    .replace(/[ìíîï]/gi, "i")
    .replace(/[ñň]/gi, "n")
    .replace(/[òóôõöø]/gi, "o")
    .replace(/[řŕ]/gi, "r")
    .replace(/[šś]/gi, "s")
    .replace(/[ťþ]/gi, "t")
    .replace(/[ùúûü]/gi, "u")
    .replace(/[ýÿ]/gi, "y")
    .replace(/[žźż]/gi, "z")
    .replace(/[ß]/gi, "ss")
    .replace(/[œ]/gi, "oe")
    // Remove combining diacritical marks
    .replace(/[\u0300-\u036F]/g, "")
    // Remove zero-width chars
    .replace(/[\u2000-\u200F]/g, "")
    // Remove variation selectors
    .replace(/[\uFE00-\uFE0F]/g, "")
    // Keep only safe characters: A-Z, a-z, 0-9, space, basic punctuation, Thai
    .replace(/[^\w\s\u0E00-\u0E7F._\-@]/g, "")
    .trim();

  // Fallback if completely empty
  if (!sanitized || sanitized.length === 0) {
    sanitized = "User";
  }

  // Limit length to prevent overflow
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20) + "...";
  }

  return sanitized;
};

/**
 * 📊 Create Admin Stats Flex Message (Premium Design)
 * @param {Object} stats - { totalUsers, premiumUsers, activeToday, totalMessages, avgMessages }
 */
const createAdminStatsMessage = (stats) => {
  if (!stats) return null;

  const { totalUsers = 0, premiumUsers = 0, activeToday = 0, totalMessages = 0, avgMessages = 0 } = stats;

  return {
    type: "flex",
    altText: `📊 สถิติรวมระบบ: ${totalUsers} ผู้ใช้ | ${premiumUsers} Premium`,
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
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🏢", size: "3xl", align: "center", margin: "xs" }
                ],
                width: "48px",
                height: "48px",
                backgroundColor: "#ffffff33",
                cornerRadius: "24px",
                justifyContent: "center"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "SYSTEM OVERVIEW", color: "#ffffffcc", size: "xxs", weight: "bold", margin: "sm" },
                  { type: "text", text: "สถิติภาพรวมระบบ", weight: "bold", color: "#ffffff", size: "xl", margin: "xs" },
                ],
                margin: "md",
                flex: 1
              }
            ],
            alignItems: "center"
          }
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#0f172a",
          endColor: "#334155",
        },
        paddingAll: "20px",
        paddingBottom: "25px"
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
                  { type: "text", text: "👥", size: "xxl", align: "center" }
                ],
                width: "40px",
                flex: 0,
                justifyContent: "center"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "ผู้ใช้ทั้งหมดในระบบ", size: "xs", color: "#64748b" },
                  { type: "text", text: `${totalUsers.toLocaleString()} คน`, weight: "bold", size: "3xl", color: "#0f172a", margin: "none" }
                ],
                margin: "md"
              }
            ],
            backgroundColor: "#f8fafc",
            cornerRadius: "12px",
            paddingAll: "15px",
            margin: "none"
          },
          {
            type: "separator",
            margin: "xl",
            color: "#e2e8f0"
          },
          {
            type: "text",
            text: "🔍 รายละเอียดผู้ใช้งาน",
            weight: "bold",
            size: "sm",
            color: "#334155",
            margin: "xl"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "lg",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💎 Premium Users", size: "sm", color: "#475569", flex: 2 },
                  { type: "text", text: `${premiumUsers.toLocaleString()} คน`, size: "sm", color: "#10b981", weight: "bold", align: "end", flex: 1 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🔥 ใช้งานวันนี้", size: "sm", color: "#475569", flex: 2 },
                  { type: "text", text: `${activeToday.toLocaleString()} คน`, size: "sm", color: "#0f172a", weight: "bold", align: "end", flex: 1 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💬 ข้อความรวม", size: "sm", color: "#475569", flex: 2 },
                  { type: "text", text: `${totalMessages.toLocaleString()}`, size: "sm", color: "#0f172a", weight: "bold", align: "end", flex: 1 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📊 เฉลี่ยต่อคน", size: "sm", color: "#475569", flex: 2 },
                  { type: "text", text: `${avgMessages} msg/user`, size: "sm", color: "#6366f1", weight: "bold", align: "end", flex: 1 }
                ]
              }
            ]
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "📄 ดูรายงานแบบละเอียด", text: "/analytics users" },
            style: "primary",
            color: "#334155",
            height: "sm"
          },
          {
            type: "text",
            text: "TukTuk Thailand • Admin Center",
            size: "xxs",
            color: "#94a3b8",
            align: "center",
            margin: "lg"
          }
        ],
        paddingAll: "20px"
      }
    }
  };
};

/**
 * 📅 Create Daily Summary Flex Message (Premium Design)
 */
const createDailySummaryMessage = (data) => {
  if (!data) return createSimpleMessage("ไม่พบข้อมูลสรุปยอดวันนี้", false);

  const { newUsers = 0, activeUsers = 0, messages = 0, revenue = 0, date = "" } = data;

  return {
    type: "flex",
    altText: `📅 สรุปยอดวันนี้: ${newUsers} ผู้ใช้ใหม่ | ${activeUsers} ใช้งาน`,
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
              {
                type: "text",
                text: "📆",
                size: "3xl",
                flex: 0,
                align: "center",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "LIVE REPORT", color: "#ffffffa3", size: "xxs", weight: "bold", margin: "sm" },
                  { type: "text", text: "สรุปยอดประจำวัน", weight: "bold", color: "#ffffff", size: "xl", margin: "xs" },
                  { type: "text", text: date, color: "#ffffffcc", size: "xs", margin: "xs" },
                ],
                margin: "md",
                flex: 1
              }
            ],
            alignItems: "center"
          }
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#00c6ff",
          endColor: "#0072ff",
        },
        paddingAll: "20px",
        paddingBottom: "25px"
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
                  { type: "text", text: "💰", size: "xxl", align: "center" }
                ],
                width: "48px",
                flex: 0,
                justifyContent: "center"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "รายได้รวมวันนี้", size: "xs", color: "#64748b" },
                  { type: "text", text: `฿${revenue.toLocaleString()}`, weight: "bold", size: "3xl", color: "#0072ff", margin: "none" }
                ],
                margin: "md"
              }
            ],
            backgroundColor: "#f0f9ff",
            cornerRadius: "12px",
            paddingAll: "15px",
            margin: "none"
          },
          {
            type: "separator",
            margin: "xl",
            color: "#e2e8f0"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "lg",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🆕 ผู้ใช้สมัครใหม่", size: "sm", color: "#475569", flex: 2 },
                  { type: "text", text: `+${newUsers} คน`, size: "sm", color: "#10b981", weight: "bold", align: "end", flex: 1 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "👥 ผู้ใช้งาน Active", size: "sm", color: "#475569", flex: 2 },
                  { type: "text", text: `${activeUsers.toLocaleString()} คน`, size: "sm", color: "#0f172a", weight: "bold", align: "end", flex: 1 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💬 จำนวนข้อความ", size: "sm", color: "#475569", flex: 2 },
                  { type: "text", text: `${messages.toLocaleString()}`, size: "sm", color: "#0f172a", weight: "bold", align: "end", flex: 1 }
                ]
              }
            ]
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "ดูสถิติรวม 7 วัน", text: "/analytics overall" },
            style: "secondary",
            color: "#e2e8f0",
            height: "sm"
          }
        ],
        paddingAll: "20px",
        paddingTop: "0px"
      }
    }
  };
};

/**
 * 🏆 Create Top Users Flex Message (Premium Design)
 */
const createTopUsersMessage = (users) => {
  if (!Array.isArray(users) || users.length === 0) {
    return createSimpleMessage("ไม่พบข้อมูลผู้ใช้งาน", false);
  }

  const userRows = users.map((user, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
    const isPremium = user.isPremium;

    const nameContents = [
      {
        type: "text",
        text: sanitizeTextForLine(user.name),
        size: "sm",
        color: "#1e293b",
        weight: "bold",
        flex: 0,
      }
    ];

    if (isPremium) {
      nameContents.push({
        type: "text",
        text: "💎",
        size: "sm",
        flex: 0,
        margin: "xs",
      });
    }

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: medal, size: "lg", align: "center" }
          ],
          width: "36px",
          justifyContent: "center",
          flex: 0
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: nameContents,
            },
            {
              type: "text",
              text: `💬 ${user.count.toLocaleString()} ข้อความ`,
              size: "xs",
              color: "#64748b",
              margin: "xs",
            }
          ],
          margin: "sm"
        }
      ],
      paddingAll: "12px",
      backgroundColor: index < 3 ? "#fffbeb" : "#f8fafc",
      borderWidth: "1px",
      borderColor: index < 3 ? "#fef3c7" : "#e2e8f0",
      cornerRadius: "10px",
      margin: index === 0 ? "none" : "sm"
    };
  });

  return {
    type: "flex",
    altText: `🏆 Top ${users.length} Users`,
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
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "🏆", size: "3xl", align: "center", margin: "xs" }
                ],
                width: "48px",
                height: "48px",
                backgroundColor: "#ffffff33",
                cornerRadius: "24px",
                justifyContent: "center"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "LEADERBOARD", color: "#ffffffa3", size: "xxs", weight: "bold", margin: "sm" },
                  { type: "text", text: `Top ${users.length} Users`, weight: "bold", color: "#ffffff", size: "xl", margin: "xs" },
                ],
                margin: "md",
                flex: 1
              }
            ],
            alignItems: "center"
          }
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#f59e0b",
          endColor: "#d97706",
        },
        paddingAll: "20px",
        paddingBottom: "25px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: userRows,
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "ดูผู้ใช้งานทั้งหมด", text: "/users all" },
            style: "secondary",
            color: "#e2e8f0",
            height: "sm"
          }
        ],
        paddingAll: "20px",
        paddingTop: "0px"
      }
    }
  };
};

/**
 * 💎 Create Premium Report Flex Message (Premium Design)
 */
const createPremiumReportMessage = (data) => {
  if (!data) return createSimpleMessage("ไม่พบข้อมูลรายงาน Premium", false);

  const { total = 0, monthly = 0, yearly = 0, team = 0, revenue = 0 } = data;

  const monthlyPercent = total > 0 ? Math.round((monthly / total) * 100) : 0;
  const yearlyPercent = total > 0 ? Math.round((yearly / total) * 100) : 0;
  const teamPercent = total > 0 ? Math.round((team / total) * 100) : 0;

  return {
    type: "flex",
    altText: `💎 Premium Report: ${total} users | ${revenue.toLocaleString()} บาท`,
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
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "💎", size: "3xl", align: "center", margin: "xs" }
                ],
                width: "48px",
                height: "48px",
                backgroundColor: "#ffffff33",
                cornerRadius: "24px",
                justifyContent: "center"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "SUBSCRIPTION REPORT", color: "#ffffffa3", size: "xxs", weight: "bold", margin: "sm" },
                  { type: "text", text: "สมาชิกระดับพรีเมียม", weight: "bold", color: "#ffffff", size: "xl", margin: "xs" },
                ],
                margin: "md",
                flex: 1
              }
            ],
            alignItems: "center"
          }
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#6366f1",
          endColor: "#8b5cf6",
        },
        paddingAll: "20px",
        paddingBottom: "25px"
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
                  { type: "text", text: "สมาชิก Premium", size: "sm", color: "#64748b", margin: "xs" },
                  { type: "text", text: `${total.toLocaleString()}`, weight: "bold", size: "3xl", color: "#4f46e5" }
                ],
                flex: 1,
                backgroundColor: "#e0e7ff",
                cornerRadius: "10px",
                paddingAll: "15px",
                alignItems: "center"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "รายได้รวม (บาท)", size: "sm", color: "#64748b", margin: "xs" },
                  { type: "text", text: `฿${revenue.toLocaleString()}`, weight: "bold", size: "3xl", color: "#10b981" }
                ],
                flex: 1,
                backgroundColor: "#d1fae5",
                cornerRadius: "10px",
                paddingAll: "15px",
                margin: "md",
                alignItems: "center"
              }
            ]
          },
          {
            type: "separator",
            margin: "xl",
            color: "#e2e8f0"
          },
          {
            type: "text",
            text: "📊 สัดส่วนแพ็คเกจ",
            weight: "bold",
            size: "sm",
            color: "#334155",
            margin: "xl"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "lg",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "รายเดือน (99฿)", size: "sm", color: "#475569", flex: 3 },
                      { type: "text", text: `${monthlyPercent}%`, size: "xs", color: "#3b82f6", align: "end", margin: "sm" },
                      { type: "text", text: `${monthly} คน`, size: "sm", color: "#0f172a", weight: "bold", align: "end", flex: 1 }
                    ]
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [],
                        width: `${monthlyPercent}%`,
                        height: "6px",
                        backgroundColor: "#3b82f6",
                        cornerRadius: "3px"
                      }
                    ],
                    backgroundColor: "#e2e8f0",
                    height: "6px",
                    cornerRadius: "3px"
                  }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "รายปี (699฿)", size: "sm", color: "#475569", flex: 3 },
                      { type: "text", text: `${yearlyPercent}%`, size: "xs", color: "#8b5cf6", align: "end", margin: "sm" },
                      { type: "text", text: `${yearly} คน`, size: "sm", color: "#0f172a", weight: "bold", align: "end", flex: 1 }
                    ]
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [],
                        width: `${yearlyPercent}%`,
                        height: "6px",
                        backgroundColor: "#8b5cf6",
                        cornerRadius: "3px"
                      }
                    ],
                    backgroundColor: "#e2e8f0",
                    height: "6px",
                    cornerRadius: "3px"
                  }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "แบบทีม (2490฿+)", size: "sm", color: "#475569", flex: 3 },
                      { type: "text", text: `${teamPercent}%`, size: "xs", color: "#f59e0b", align: "end", margin: "sm" },
                      { type: "text", text: `${team} กลุ่ม`, size: "sm", color: "#0f172a", weight: "bold", align: "end", flex: 1 }
                    ]
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "sm",
                    contents: [
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [],
                        width: `${teamPercent}%`,
                        height: "6px",
                        backgroundColor: "#f59e0b",
                        cornerRadius: "3px"
                      }
                    ],
                    backgroundColor: "#e2e8f0",
                    height: "6px",
                    cornerRadius: "3px"
                  }
                ]
              }
            ]
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "ดูสถิติแพ็คเกจล่าสุด", text: "/analytics premium" },
            style: "secondary",
            color: "#e2e8f0",
            height: "sm"
          }
        ],
        paddingAll: "20px",
        paddingTop: "0px"
      }
    }
  };
};

/**
 * Create User Info Flex Message
 */
const createUserInfoMessage = (user) => {
  if (!user) return createSimpleMessage("ไม่พบข้อมูลผู้ใช้", false);

  const { name = "Unknown", id = "", isPremium = false, usageCount = 0, createdAt = "", lastActive = "", quota = 0 } = user;
  const safeName = sanitizeTextForLine(name);

  return {
    type: "flex",
    altText: `👤 ${safeName} | ${isPremium ? "Premium" : "Free"} | ${usageCount} ข้อความ`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "👤",
                size: "xl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "ข้อมูลผู้ใช้",
                    weight: "bold",
                    color: "#ffffff",
                    size: "md",
                  },
                  {
                    type: "text",
                    text: "USER PROFILE",
                    color: "#ffffff99",
                    size: "xs",
                  },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#3498db",
        paddingAll: "18px",
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
                  {
                    type: "text",
                    text: safeName,
                    weight: "bold",
                    size: "xl",
                    color: "#1a1a1a",
                  },
                  {
                    type: "text",
                    text: isPremium ? "💎 Premium User" : "Free User",
                    size: "sm",
                    color: isPremium ? "#9B59B6" : "#666666",
                    margin: "sm",
                  },
                ],
              },
            ],
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "xl",
            spacing: "md",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🆔 User ID",
                    size: "sm",
                    color: "#666666",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: id.substring(0, 20) + "...",
                    size: "xs",
                    color: "#1a1a1a",
                    align: "end",
                    flex: 2,
                    wrap: true,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📊 การใช้งาน",
                    size: "sm",
                    color: "#666666",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: `${usageCount.toLocaleString()} ข้อความ`,
                    size: "sm",
                    color: "#1a1a1a",
                    weight: "bold",
                    align: "end",
                    flex: 1,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📅 สมัครเมื่อ",
                    size: "sm",
                    color: "#666666",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: createdAt,
                    size: "sm",
                    color: "#1a1a1a",
                    align: "end",
                    flex: 1,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "⏰ ใช้งานล่าสุด",
                    size: "sm",
                    color: "#666666",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: lastActive,
                    size: "sm",
                    color: "#1a1a1a",
                    align: "end",
                    flex: 1,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🔢 โควต้าวันนี้",
                    size: "sm",
                    color: "#666666",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: isPremium ? "ไม่จำกัด" : `${quota}/15`,
                    size: "sm",
                    color: isPremium ? "#27ae60" : "#1a1a1a",
                    weight: "bold",
                    align: "end",
                    flex: 1,
                  },
                ],
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
            type: "separator",
          },
          {
            type: "text",
            text: "🔐 Admin Dashboard",
            size: "xs",
            color: "#999999",
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * Create Recent Users Flex Message
 */
/**
 * 👥 Enhanced Recent Users Management - Super Admin User Control Center
 * แสดงรายชื่อ users พร้อม Trial Status, Quick Actions, และ Filters
 * @param {Array} users - Array of user objects with enhanced data
 * @param {Object} stats - Summary stats for filtering
 */
const createRecentUsersMessage = (users, stats = {}) => {
  if (!Array.isArray(users) || users.length === 0) {
    return createSimpleMessage("ไม่พบข้อมูลผู้ใช้งาน", false);
  }

  // Debug log to check user data
  console.log("🔍 createRecentUsersMessage - Users data:", JSON.stringify(users.slice(0, 3).map(u => ({ id: u.id, name: u.name }))));

  // Build user cards with enhanced info
  const userCards = users.map((user, index) => {
    // Validate user data - generate fallback id if missing
    const userId = user.id || `user_${index}`;
    const userName = user.name || "Unknown";

    if (!user) {
      console.warn("⚠️ Null user data at index", index);
      return null;
    }

    // Determine user status badge
    let statusBadge = "";
    let statusColor = "#6b7280";

    if (user.isPremium) {
      statusBadge = "💎 Premium";
      statusColor = "#8b5cf6";
    } else if (user.trialStatus === "active") {
      statusBadge = `⏰ Trial ${user.trialDaysLeft || 0}d`;
      statusColor = (user.trialDaysLeft || 0) <= 2 ? "#ef4444" : (user.trialDaysLeft || 0) <= 4 ? "#f59e0b" : "#10b981";
    } else if (user.trialStatus === "expired") {
      statusBadge = "⏰ Expired";
      statusColor = "#ef4444";
    } else {
      statusBadge = "🆓 Free";
      statusColor = "#6b7280";
    }

    return {
      type: "box",
      layout: "vertical",
      contents: [
        // User Header Row
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
                  text: sanitizeTextForLine(userName),
                  size: "sm",
                  color: "#1f2937",
                  weight: "bold",
                  wrap: false,
                },
                {
                  type: "text",
                  text: `ID: ${userId.substring(0, 10)}...`,
                  size: "xxs",
                  color: "#9ca3af",
                  margin: "xs",
                },
              ],
              flex: 2,
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: statusBadge || "🆓 Free",
                  size: "xxs",
                  color: statusColor,
                  weight: "bold",
                  align: "end",
                },
              ],
              flex: 1,
            },
          ],
        },
        // Stats Row
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "baseline",
              contents: [
                { type: "text", text: "💬", size: "xxs", flex: 0 },
                { type: "text", text: `${user.count}`, size: "xxs", color: "#6b7280", margin: "xs" },
              ],
              flex: 1,
            },
            {
              type: "box",
              layout: "baseline",
              contents: [
                { type: "text", text: "⏰", size: "xxs", flex: 0 },
                { type: "text", text: user.timeAgo, size: "xxs", color: "#6b7280", margin: "xs" },
              ],
              flex: 2,
            },
          ],
          margin: "sm",
        },
        // Quick Actions Row
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "👁️", size: "sm", align: "center" },
              ],
              backgroundColor: "#eff6ff",
              cornerRadius: "6px",
              paddingAll: "6px",
              flex: 1,
              action: { type: "message", label: "View", text: `/user ${userId}` },
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: user.isPremium ? "⬇️" : "⬆️", size: "sm", align: "center" },
              ],
              backgroundColor: user.isPremium ? "#fef3c7" : "#f0fdf4",
              cornerRadius: "6px",
              paddingAll: "6px",
              flex: 1,
              margin: "sm",
              action: { type: "message", label: user.isPremium ? "Demote" : "Promote", text: user.isPremium ? `/demote ${userId}` : `/promote ${userId}` },
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: user.isBanned ? "✅" : "🚫", size: "sm", align: "center" },
              ],
              backgroundColor: user.isBanned ? "#f0fdf4" : "#fef2f2",
              cornerRadius: "6px",
              paddingAll: "6px",
              flex: 1,
              margin: "sm",
              action: { type: "message", label: user.isBanned ? "Unban" : "Ban", text: user.isBanned ? `/unban ${userId}` : `/ban ${userId}` },
            },
          ],
          margin: "md",
        },
      ],
      backgroundColor: index % 2 === 0 ? "#f9fafb" : "#ffffff",
      cornerRadius: "10px",
      paddingAll: "12px",
      margin: index === 0 ? "none" : "md",
    };
  }).filter(card => card !== null); // Filter out null/invalid cards

  // Build carousel with multiple bubbles if needed
  const bubbles = [];
  const usersPerBubble = 5;

  for (let i = 0; i < userCards.length; i += usersPerBubble) {
    const bubbleUsers = userCards.slice(i, i + usersPerBubble);
    const pageNum = Math.floor(i / usersPerBubble) + 1;
    const totalPages = Math.ceil(userCards.length / usersPerBubble);

    bubbles.push({
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
              { type: "text", text: "👥", size: "xxl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "User Management",
                    weight: "bold",
                    color: "#ffffff",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: `${users.length} Users • Page ${pageNum}/${totalPages}`,
                    color: "#ffffff99",
                    size: "xs",
                    margin: "xs",
                  },
                ],
                margin: "md",
              },
            ],
          },
          // Stats Summary Bar
          ...(stats && i === 0 ? [{
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "💎", size: "xs", flex: 0 },
                  { type: "text", text: `${stats.premium || 0}`, color: "#ffffff", size: "xxs", margin: "xs" },
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "⏰", size: "xs", flex: 0 },
                  { type: "text", text: `${stats.trial || 0}`, color: "#ffffff", size: "xxs", margin: "xs" },
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "🆓", size: "xs", flex: 0 },
                  { type: "text", text: `${stats.free || 0}`, color: "#ffffff", size: "xxs", margin: "xs" },
                ],
                flex: 1,
              },
            ],
            margin: "lg",
            spacing: "sm",
          }] : []),
        ],
        backgroundColor: "#6366f1",
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bubbleUsers,
        paddingAll: "16px",
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
                action: { type: "message", label: "🔄 Refresh", text: "/recent" },
                style: "secondary",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "🏠 Dashboard", text: "/super" },
                style: "primary",
                color: "#6366f1",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
          {
            type: "text",
            text: "👁️ View • ⬆️⬇️ Premium • 🚫 Ban",
            size: "xxs",
            color: "#9ca3af",
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "16px",
      },
    });
  }

  return {
    type: "flex",
    altText: `👥 User Management - ${users.length} Users`,
    contents: bubbles.length === 1 ? bubbles[0] : {
      type: "carousel",
      contents: bubbles,
    },
  };
};

/**
 * 👥 LEGACY: Simple Recent Users Message (kept for backwards compatibility)
 */
const createRecentUsersMessageSimple = (users) => {
  if (!Array.isArray(users) || users.length === 0) {
    return createSimpleMessage("ไม่พบข้อมูลผู้ใช้งานล่าสุด", false);
  }

  const userRows = users.map((user, index) => {
    const isPremium = user.isPremium;

    // Build name contents - only include premium badge if user is premium
    const nameContents = [
      {
        type: "text",
        text: sanitizeTextForLine(user.name),
        size: "sm",
        color: "#1a1a1a",
        weight: "bold",
        flex: 0,
      },
    ];

    // Only add premium badge if user is premium (avoid empty text)
    if (isPremium) {
      nameContents.push({
        type: "text",
        text: "💎",
        size: "sm",
        flex: 0,
        margin: "xs",
      });
    }

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: nameContents,
            },
            {
              type: "text",
              text: `⏰ ${user.timeAgo}`,
              size: "xs",
              color: "#666666",
              margin: "xs",
            },
          ],
          flex: 3,
        },
        {
          type: "text",
          text: `${user.count} ข้อความ`,
          size: "xs",
          color: "#1a1a1a",
          align: "end",
          gravity: "center",
          flex: 2,
        },
      ],
      paddingAll: "8px",
      backgroundColor: index % 2 === 0 ? "#F8F9FA" : "#ffffff",
      cornerRadius: "8px",
      margin: "sm",
    };
  });

  return {
    type: "flex",
    altText: `⏰ ผู้ใช้งานล่าสุด ${users.length} คน`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "⏰",
                size: "xl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "ผู้ใช้งานล่าสุด",
                    weight: "bold",
                    color: "#ffffff",
                    size: "md",
                  },
                  {
                    type: "text",
                    text: "RECENT ACTIVE USERS",
                    color: "#ffffff99",
                    size: "xs",
                  },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#FF9F43",
        paddingAll: "18px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: userRows,
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "separator",
          },
          {
            type: "text",
            text: "🔐 Admin Dashboard",
            size: "xs",
            color: "#999999",
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * Create Pending Items Flex Message
 */
const createPendingItemsMessage = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return createSimpleMessage("✅ ไม่มีรายการรออนุมัติ", true);
  }

  const itemRows = items.map((item, index) => {
    return {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `🆔 ${item.id}`,
              size: "xs",
              color: "#999999",
              flex: 1,
            },
            {
              type: "text",
              text: item.date,
              size: "xs",
              color: "#999999",
              align: "end",
              flex: 1,
            },
          ],
        },
        {
          type: "text",
          text: item.problem,
          size: "sm",
          color: "#1a1a1a",
          wrap: true,
          margin: "sm",
        },
        {
          type: "text",
          text: `👤 ${item.contributor}`,
          size: "xs",
          color: "#666666",
          margin: "sm",
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "message",
            label: "อนุมัติ",
            text: `/approve ${item.id}`,
          },
          margin: "md",
        },
      ],
      paddingAll: "12px",
      backgroundColor: "#F8F9FA",
      cornerRadius: "8px",
      margin: "md",
    };
  });

  return {
    type: "flex",
    altText: `⏳ รายการรออนุมัติ ${items.length} รายการ`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "⏳",
                size: "xl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "รายการรออนุมัติ",
                    weight: "bold",
                    color: "#ffffff",
                    size: "md",
                  },
                  {
                    type: "text",
                    text: "PENDING APPROVALS",
                    color: "#ffffff99",
                    size: "xs",
                  },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#FF6B6B",
        paddingAll: "18px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: itemRows,
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "separator",
          },
          {
            type: "text",
            text: "💡 กดปุ่มเพื่ออนุมัติรายการ",
            size: "xs",
            color: "#999999",
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * Create Simple Success/Error Message
 */
const createSimpleMessage = (message, isSuccess = true) => {
  return {
    type: "flex",
    altText: message,
    contents: {
      type: "bubble",
      size: "nano",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: isSuccess ? "✅" : "❌",
            size: "xxl",
            align: "center",
          },
          {
            type: "text",
            text: message,
            size: "sm",
            color: "#1a1a1a",
            align: "center",
            margin: "md",
            wrap: true,
          },
        ],
        paddingAll: "20px",
        backgroundColor: isSuccess ? "#E8F5E9" : "#FFEBEE",
      },
    },
  };
};

// =====================================================
// 👑 SUPER ADMIN UNIFIED DASHBOARD
// Single Page All-in-One Admin Control Center
// Version: 3.1 - Optimized for LINE API
// =====================================================

/**
 * 👑 Admin Super Dashboard - หน้าเดียวครบทุกฟังก์ชัน (ENHANCED v3.5)
 * รวมทุกเมนู Admin ไว้ในหน้าเดียว พร้อม Real-Time Data, Trial Countdown, Interactive Elements
 * ✨ Connected to Firestore for live stats
 * @param {Object} stats - Real-time system statistics from Firestore
 */
const createAdminSuperDashboard = (stats = {}) => {
  // 📊 Real-Time System Stats with fallback defaults
  const systemStats = {
    totalUsers: stats.totalUsers || 0,
    activeToday: stats.activeToday || 0,
    active7Days: stats.active7Days || 0,
    pendingUsers: stats.pendingUsers || 0,
    knowledgeItems: stats.knowledgeItems || 0,
    pendingKnowledge: stats.pendingKnowledge || 0,
    premiumUsers: stats.premiumUsers || 0,
    onlineNow: stats.onlineNow || 0,
    systemHealth: stats.systemHealth || "🟢 Online",
    trialActiveUsers: stats.trialActiveUsers || 0,
    trialExpiredUsers: stats.trialExpiredUsers || 0,
    trialCountdowns: stats.trialCountdowns || [],
    // Feature usage
    totalFeatureUsage: stats.totalFeatureUsage || 0,
    totalVisionUsage: stats.totalVisionUsage || 0,
    totalCalculatorUsage: stats.totalCalculatorUsage || 0,
    totalAgricultureUsage: stats.totalAgricultureUsage || 0,
    totalAccountingUsage: stats.totalAccountingUsage || 0,
    totalEducationUsage: stats.totalEducationUsage || 0,
    mostUsedFeature: stats.mostUsedFeature || { name: "ไม่มีข้อมูล", usage: 0 },
  };

  return {
    type: "flex",
    altText: "👑 Super Admin Dashboard v3.5 - Enhanced Control Center",
    contents: {
      type: "carousel",
      contents: [
        // ===== BUBBLE 1: MAIN CONTROL & OVERVIEW =====
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
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "👑", size: "3xl", flex: 0 },
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          { type: "text", text: "SUPER ADMIN", color: "#ffffff", weight: "bold", size: "xl" },
                          { type: "text", text: "Control Center v3.5", color: "#ffffff99", size: "sm", margin: "xs" },
                        ],
                        margin: "md",
                      },
                    ],
                  },
                  // 🔥 NEW: Live Status Bar
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          { type: "text", text: "🟢", size: "xs", flex: 0 },
                          { type: "text", text: `${systemStats.onlineNow} Online`, color: "#ffffff", size: "xxs", margin: "xs" },
                        ],
                        flex: 1,
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          { type: "text", text: "📊", size: "xs", flex: 0 },
                          { type: "text", text: `${systemStats.activeToday} Today`, color: "#ffffff", size: "xxs", margin: "xs" },
                        ],
                        flex: 1,
                      },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          { type: "text", text: "⚠️", size: "xs", flex: 0 },
                          { type: "text", text: `${systemStats.pendingUsers} Pending`, color: "#fbbf24", size: "xxs", margin: "xs", weight: "bold" },
                        ],
                        flex: 1,
                      },
                    ],
                    margin: "lg",
                    spacing: "sm",
                  },
                ],
                paddingAll: "20px",
              },
            ],
            backgroundColor: "#6366f1",
            paddingAll: "0px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // 📈 Stats Overview Cards with Counters
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: systemStats.totalUsers.toLocaleString(), size: "xl", weight: "bold", color: "#1f2937", align: "center" },
                      { type: "text", text: "Total Users", size: "xxs", color: "#6b7280", align: "center", margin: "xs" },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          { type: "text", text: "💎", size: "xs", flex: 0 },
                          { type: "text", text: `${systemStats.premiumUsers} Premium`, size: "xxs", color: "#8b5cf6", margin: "xs" },
                        ],
                        justifyContent: "center",
                        margin: "xs",
                      },
                    ],
                    backgroundColor: "#eff6ff",
                    cornerRadius: "10px",
                    paddingAll: "12px",
                    flex: 1,
                    action: { type: "message", label: "View Users", text: "/recent" },
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: systemStats.knowledgeItems.toString(), size: "xl", weight: "bold", color: "#1f2937", align: "center" },
                      { type: "text", text: "Knowledge", size: "xxs", color: "#6b7280", align: "center", margin: "xs" },
                      {
                        type: "box",
                        layout: "baseline",
                        contents: [
                          { type: "text", text: "✅", size: "xs", flex: 0 },
                          { type: "text", text: `${systemStats.pendingKnowledge} Need Review`, size: "xxs", color: "#ef4444", margin: "xs" },
                        ],
                        justifyContent: "center",
                        margin: "xs",
                      },
                    ],
                    backgroundColor: "#f0fdf4",
                    cornerRadius: "10px",
                    paddingAll: "12px",
                    margin: "md",
                    flex: 1,
                    action: { type: "message", label: "Knowledge", text: "/km" },
                  },
                ],
                margin: "md",
              },
              { type: "separator", margin: "lg" },

              // 🎯 Quick Access Grid with Visual Icons
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🎯 Quick Access", weight: "bold", size: "sm", color: "#374151", flex: 1 },
                  { type: "text", text: systemStats.systemHealth, size: "xxs", color: "#10b981", align: "end" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "📊", size: "xxl", align: "center" },
                      { type: "text", text: "Stats", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                    ],
                    flex: 1,
                    backgroundColor: "#f0f9ff",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    action: { type: "message", label: "Stats", text: "/stats" },
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "👥", size: "xxl", align: "center" },
                      { type: "text", text: "Users", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                    ],
                    flex: 1,
                    backgroundColor: "#fef3c7",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: { type: "message", label: "Users", text: "/recent" },
                  },
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "🧠", size: "xxl", align: "center" },
                      { type: "text", text: "Knowledge", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                    ],
                    flex: 1,
                    backgroundColor: "#f0fdf4",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    action: { type: "message", label: "Knowledge", text: "/km" },
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "🧪", size: "xxl", align: "center" },
                      { type: "text", text: "Test", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                    ],
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: { type: "message", label: "Test", text: "/qt" },
                  },
                ],
                margin: "sm",
              },

              { type: "separator", margin: "lg" },

              // 🔥 NEW: Trial Countdown Section
              ...(systemStats.trialActiveUsers > 0 ? [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "⏰ Trial Users Active", weight: "bold", size: "sm", color: "#374151", flex: 1 },
                    { type: "text", text: `${systemStats.trialActiveUsers}`, size: "sm", color: "#8b5cf6", weight: "bold", align: "end" },
                  ],
                  margin: "md",
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: systemStats.trialCountdowns.slice(0, 3).map((trial, idx) => ({
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: `${idx + 1}. ${trial.userId.substring(0, 10)}...`,
                        size: "xxs",
                        color: "#6b7280",
                        flex: 2,
                      },
                      {
                        type: "text",
                        text: `เหลือ ${trial.daysLeft} วัน`,
                        size: "xxs",
                        color: trial.daysLeft <= 2 ? "#ef4444" : trial.daysLeft <= 4 ? "#f59e0b" : "#10b981",
                        weight: "bold",
                        align: "end",
                        flex: 1,
                      },
                    ],
                    margin: idx === 0 ? "sm" : "xs",
                  })),
                  backgroundColor: "#faf5ff",
                  cornerRadius: "8px",
                  paddingAll: "10px",
                  margin: "sm",
                },
              ] : []),

              { type: "separator", margin: "lg" },

              // 🔥 NEW: Pending Actions Alert (Conditional Display)
              ...(systemStats.pendingUsers > 0 || systemStats.pendingKnowledge > 0 ? [{
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "⚠️", size: "lg", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "Pending Actions Required!", weight: "bold", size: "sm", color: "#dc2626" },
                      { type: "text", text: `${systemStats.pendingUsers} users • ${systemStats.pendingKnowledge} knowledge`, size: "xxs", color: "#6b7280", margin: "xs" },
                    ],
                    margin: "md",
                    flex: 1,
                  },
                  { type: "text", text: "→", size: "xl", color: "#dc2626", flex: 0 },
                ],
                backgroundColor: "#fef2f2",
                cornerRadius: "8px",
                paddingAll: "12px",
                margin: "md",
                action: { type: "message", label: "View Pending", text: "/pending" },
              }] : []),

              // 📣 Broadcast Quick Action
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📣", size: "lg", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "Broadcast Message", weight: "bold", size: "sm", color: "#1f2937" },
                      { type: "text", text: "ส่งข้อความถึงผู้ใช้ทั้งหมด", size: "xxs", color: "#6b7280", margin: "xs" },
                    ],
                    margin: "md",
                    flex: 1,
                  },
                  { type: "text", text: "→", size: "xl", color: "#6366f1", flex: 0 },
                ],
                backgroundColor: "#fef3c7",
                cornerRadius: "8px",
                paddingAll: "12px",
                margin: systemStats.pendingUsers > 0 || systemStats.pendingKnowledge > 0 ? "sm" : "md",
                action: { type: "message", label: "Broadcast", text: "/broadcast" },
              },
            ],
            paddingAll: "16px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "👉", size: "sm", flex: 0 },
                  { type: "text", text: "เลื่อนดูเมนูเพิ่มเติม →", size: "xxs", color: "#6b7280", margin: "sm" },
                ],
                flex: 1,
              },
              { type: "text", text: "1/3", size: "xxs", color: "#9ca3af", align: "end" },
            ],
            paddingAll: "10px",
          },
        },

        // ===== BUBBLE 2: KNOWLEDGE & TESTING (ENHANCED) =====
        {
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
                  { type: "text", text: "🧠", size: "xxl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "Knowledge & Testing", weight: "bold", size: "lg", color: "#ffffff" },
                      { type: "text", text: "จัดการความรู้และทดสอบระบบ", size: "xs", color: "#ffffff99", margin: "xs" },
                    ],
                    margin: "md",
                  },
                ],
              },
              // 🔥 NEW: Knowledge Stats Bar
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      { type: "text", text: "📚", size: "xs", flex: 0 },
                      { type: "text", text: `${systemStats.knowledgeItems} Items`, color: "#ffffff", size: "xxs", margin: "xs" },
                    ],
                    flex: 1,
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      { type: "text", text: "✅", size: "xs", flex: 0 },
                      { type: "text", text: "Verified", color: "#ffffff", size: "xxs", margin: "xs" },
                    ],
                    flex: 1,
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      { type: "text", text: "⚠️", size: "xs", flex: 0 },
                      { type: "text", text: `${systemStats.pendingKnowledge} Pending`, color: "#fbbf24", size: "xxs", margin: "xs", weight: "bold" },
                    ],
                    flex: 1,
                  },
                ],
                margin: "md",
                spacing: "sm",
              },
            ],
            backgroundColor: "#8b5cf6",
            paddingAll: "16px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // Knowledge Management Section with Icons
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📚 Knowledge Management", weight: "bold", size: "sm", color: "#374151", flex: 1 },
                  { type: "text", text: `${systemStats.knowledgeItems}`, size: "xs", color: "#8b5cf6", weight: "bold", align: "end" },
                ],
              },
              {
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
                          { type: "text", text: "📖", size: "xxl", align: "center" },
                          { type: "text", text: "ดูทั้งหมด", size: "xxs", color: "#6b7280", align: "center", margin: "xs" },
                        ],
                        flex: 1,
                        action: { type: "message", label: "View All", text: "ดูความรู้ทั้งหมด" },
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          { type: "text", text: "➕", size: "xxl", align: "center" },
                          { type: "text", text: "Add New", size: "xxs", color: "#10b981", align: "center", margin: "xs", weight: "bold" },
                        ],
                        flex: 1,
                        margin: "sm",
                        backgroundColor: "#ecfdf5",
                        cornerRadius: "8px",
                        paddingAll: "8px",
                        action: { type: "message", label: "Add Knowledge", text: "เพิ่มความรู้" },
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          { type: "text", text: "📝", size: "xxl", align: "center" },
                          { type: "text", text: "Examples", size: "xxs", color: "#3b82f6", align: "center", margin: "xs", weight: "bold" },
                        ],
                        flex: 1,
                        backgroundColor: "#eff6ff",
                        cornerRadius: "8px",
                        paddingAll: "8px",
                        action: { type: "message", label: "Examples", text: "ดูตัวอย่างการเพิ่มความรู้" },
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          { type: "text", text: "✅", size: "xxl", align: "center" },
                          { type: "text", text: "Verify", size: "xxs", color: "#6b7280", align: "center", margin: "xs" },
                        ],
                        flex: 1,
                        margin: "sm",
                        action: { type: "message", label: "Verify", text: "verify ความรู้" },
                      },
                    ],
                    margin: "sm",
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          { type: "text", text: "🧪", size: "xxl", align: "center" },
                          { type: "text", text: "Hybrid Test", size: "xxs", color: "#6b7280", align: "center", margin: "xs" },
                        ],
                        flex: 1,
                        action: { type: "message", label: "Test", text: "ทดสอบ hybrid ABS" },
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          { type: "text", text: "🔧", size: "xxl", align: "center" },
                          { type: "text", text: "Optimize", size: "xxs", color: "#6b7280", align: "center", margin: "xs" },
                        ],
                        flex: 1,
                        margin: "sm",
                        action: { type: "message", label: "Optimize", text: "ปรับปรุงคลัง" },
                      },
                    ],
                    margin: "sm",
                  },
                ],
                backgroundColor: "#faf5ff",
                cornerRadius: "10px",
                paddingAll: "12px",
                margin: "md",
              },

              { type: "separator", margin: "lg" },

              // 📊 NEW: Knowledge Categories Breakdown
              ...(systemStats.knowledgeByCategory && Object.keys(systemStats.knowledgeByCategory).length > 0 ? [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "📁 Categories", weight: "bold", size: "sm", color: "#374151", flex: 1 },
                    { type: "text", text: `${Object.keys(systemStats.knowledgeByCategory).length} types`, size: "xs", color: "#999999", align: "end" },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  contents: Object.entries(systemStats.knowledgeByCategory || {}).slice(0, 5).map(([category, count]) => {
                    const categoryMap = {
                      "real_world_solutions": { name: "วิธีแก้จริง", icon: "🔧", color: "#3b82f6" },
                      "proven_parameters": { name: "พารามิเตอร์", icon: "📊", color: "#10b981" },
                      "machine_specific": { name: "เฉพาะเครื่อง", icon: "🏭", color: "#f59e0b" },
                      "expert_tips": { name: "เคล็ดลับ", icon: "💡", color: "#8b5cf6" },
                      "local_terminology": { name: "คำศัพท์", icon: "📖", color: "#ef4444" },
                      "case_studies": { name: "กรณีศึกษา", icon: "📚", color: "#06b6d4" },
                      "local_materials": { name: "วัสดุท้องถิ่น", icon: "🧪", color: "#f97316" },
                      "supplier_info": { name: "ซัพพลายเออร์", icon: "🏪", color: "#84cc16" },
                    };
                    const catInfo = categoryMap[category] || { name: category, icon: "📁", color: "#6b7280" };

                    return {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: catInfo.icon, size: "md", flex: 0 },
                        { type: "text", text: catInfo.name, size: "xs", color: "#666666", margin: "sm", flex: 1 },
                        { type: "text", text: count.toString(), size: "xs", color: catInfo.color, weight: "bold", align: "end", flex: 0 },
                      ],
                      margin: "xs",
                      paddingAll: "6px",
                      backgroundColor: "#f9fafb",
                      cornerRadius: "6px",
                    };
                  }),
                  margin: "sm",
                },
                { type: "separator", margin: "md" },
              ] : []),

              // 🏆 NEW: Top Used Knowledge
              ...(systemStats.knowledgeTopUsed && systemStats.knowledgeTopUsed.length > 0 ? [
                { type: "text", text: "🏆 Top Used Knowledge", weight: "bold", size: "sm", color: "#374151" },
                {
                  type: "box",
                  layout: "vertical",
                  contents: systemStats.knowledgeTopUsed.map((item, index) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const problemText = item.problem || "ไม่มีชื่อ";
                    const displayText = problemText.length > 25 ? problemText.substring(0, 25) + "..." : problemText;
                    const useCount = item.useCount || 0;

                    return {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: medals[index] || "📌", size: "md", flex: 0 },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            { type: "text", text: displayText, size: "xs", color: "#333333", wrap: true },
                            { type: "text", text: `${useCount} uses`, size: "xxs", color: "#999999" },
                          ],
                          margin: "sm",
                          flex: 1,
                        },
                      ],
                      margin: "xs",
                      paddingAll: "8px",
                      backgroundColor: index === 0 ? "#fef3c7" : "#f0f9ff",
                      cornerRadius: "6px",
                    };
                  }),
                  margin: "sm",
                },
                { type: "separator", margin: "md" },
              ] : []),

              // Quick Tests with Material Badges
              { type: "text", text: "🧪 Quick Tests (Popular Materials)", weight: "bold", size: "sm", color: "#374151" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "button",
                        action: { type: "message", label: "ABS", text: "/wt ABS รอยยุบ" },
                        style: "primary",
                        color: "#3b82f6",
                        height: "sm",
                        flex: 1,
                      },
                      {
                        type: "button",
                        action: { type: "message", label: "PP", text: "/wt PP รอยแตก" },
                        style: "primary",
                        color: "#10b981",
                        height: "sm",
                        flex: 1,
                        margin: "sm",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "button",
                        action: { type: "message", label: "PC", text: "/wt PC ขุ่น" },
                        style: "primary",
                        color: "#8b5cf6",
                        height: "sm",
                        flex: 1,
                      },
                      {
                        type: "button",
                        action: { type: "message", label: "More →", text: "/qt" },
                        style: "secondary",
                        height: "sm",
                        flex: 1,
                        margin: "sm",
                      },
                    ],
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },

              { type: "separator", margin: "lg" },

              // Quick Access to Knowledge Menu
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📋", size: "lg", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "Knowledge Menu", weight: "bold", size: "sm", color: "#1f2937" },
                      { type: "text", text: "เข้าสู่เมนูความรู้ทั้งหมด", size: "xxs", color: "#6b7280", margin: "xs" },
                    ],
                    margin: "md",
                    flex: 1,
                  },
                  { type: "text", text: "→", size: "xl", color: "#8b5cf6", flex: 0 },
                ],
                backgroundColor: "#faf5ff",
                cornerRadius: "8px",
                paddingAll: "12px",
                margin: "md",
                action: { type: "message", label: "Knowledge Menu", text: "/km" },
              },
            ],
            paddingAll: "16px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "← Back", text: "/super" },
                style: "link",
                height: "sm",
                flex: 1,
              },
              { type: "text", text: "2/3", size: "xxs", color: "#9ca3af", align: "center", flex: 0, margin: "md" },
            ],
            paddingAll: "10px",
          },
        },

        // ===== BUBBLE 3: SYSTEM TOOLS & ANALYTICS (ENHANCED) =====
        {
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
                  { type: "text", text: "⚙️", size: "xxl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "System Tools", weight: "bold", size: "lg", color: "#ffffff" },
                      { type: "text", text: "เครื่องมือระบบและรายงาน", size: "xs", color: "#ffffff99", margin: "xs" },
                    ],
                    margin: "md",
                  },
                ],
              },
              // 🔥 NEW: System Status Indicator
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      { type: "text", text: "🟢", size: "xs", flex: 0 },
                      { type: "text", text: systemStats.systemHealth, color: "#ffffff", size: "xxs", margin: "xs" },
                    ],
                    flex: 1,
                  },
                  {
                    type: "box",
                    layout: "baseline",
                    contents: [
                      { type: "text", text: "👥", size: "xs", flex: 0 },
                      { type: "text", text: `${systemStats.totalUsers.toLocaleString()} Users`, color: "#ffffff", size: "xxs", margin: "xs" },
                    ],
                    flex: 1,
                  },
                ],
                margin: "md",
                spacing: "sm",
              },
            ],
            backgroundColor: "#ef4444",
            paddingAll: "16px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              // Reports & Analytics Grid
              { type: "text", text: "📊 Reports & Analytics", weight: "bold", size: "sm", color: "#374151" },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "📅", size: "xxl", align: "center" },
                      { type: "text", text: "Daily", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                      { type: "text", text: "สรุปวันนี้", size: "xxs", color: "#9ca3af", align: "center" },
                    ],
                    flex: 1,
                    backgroundColor: "#fff7ed",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    action: { type: "message", label: "Daily", text: "/daily" },
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "🏆", size: "xxl", align: "center" },
                      { type: "text", text: "Top 10", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                      { type: "text", text: "ผู้ใช้ Top", size: "xxs", color: "#9ca3af", align: "center" },
                    ],
                    flex: 1,
                    backgroundColor: "#fef3c7",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: { type: "message", label: "Top", text: "/top" },
                  },
                ],
                margin: "md",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "💎", size: "xxl", align: "center" },
                      { type: "text", text: "Premium", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                      { type: "text", text: `${systemStats.premiumUsers} Users`, size: "xxs", color: "#8b5cf6", align: "center" },
                    ],
                    flex: 1,
                    backgroundColor: "#faf5ff",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    action: { type: "message", label: "Premium", text: "/premium" },
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "🕐", size: "xxl", align: "center" },
                      { type: "text", text: "Recent", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                      { type: "text", text: "ล่าสุด", size: "xxs", color: "#9ca3af", align: "center" },
                    ],
                    flex: 1,
                    backgroundColor: "#eff6ff",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: { type: "message", label: "Recent", text: "/recent" },
                  },
                ],
                margin: "sm",
              },

              { type: "separator", margin: "lg" },

              // NEW: Feature Usage Analytics
              { type: "text", text: "🎯 Feature Usage Analytics", weight: "bold", size: "sm", color: "#374151", margin: "md" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "Total Usage:", size: "xs", color: "#6b7280", flex: 2 },
                      { type: "text", text: `${systemStats.totalFeatureUsage || 0} times`, size: "xs", color: "#3b82f6", weight: "bold", flex: 2, align: "end" },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "Most Used:", size: "xs", color: "#6b7280", flex: 2 },
                      { type: "text", text: `${systemStats.mostUsedFeature?.name || "N/A"}`, size: "xs", color: "#10b981", weight: "bold", flex: 2, align: "end" },
                    ],
                    margin: "sm",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "🔍 Vision:", size: "xxs", color: "#7f8c8d", flex: 3 },
                          { type: "text", text: `${systemStats.totalVisionUsage || 0}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                        ],
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "🧮 Calculator:", size: "xxs", color: "#7f8c8d", flex: 3 },
                          { type: "text", text: `${systemStats.totalCalculatorUsage || 0}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                        ],
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "🌾 Agriculture:", size: "xxs", color: "#7f8c8d", flex: 3 },
                          { type: "text", text: `${systemStats.totalAgricultureUsage || 0}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                        ],
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "💰 Accounting:", size: "xxs", color: "#7f8c8d", flex: 3 },
                          { type: "text", text: `${systemStats.totalAccountingUsage || 0}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                        ],
                      },
                      {
                        type: "box",
                        layout: "horizontal",
                        contents: [
                          { type: "text", text: "📚 Education:", size: "xxs", color: "#7f8c8d", flex: 3 },
                          { type: "text", text: `${systemStats.totalEducationUsage || 0}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                        ],
                      },
                    ],
                    margin: "sm",
                    spacing: "xs",
                  },
                ],
                backgroundColor: "#f0f9ff",
                cornerRadius: "8px",
                paddingAll: "12px",
                margin: "sm",
              },

              { type: "separator", margin: "lg" },

              // Admin Tools Section
              { type: "text", text: "🔧 Admin Management Tools", weight: "bold", size: "sm", color: "#374151", margin: "md" },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "👥", size: "xxl", align: "center" },
                      { type: "text", text: "User List", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                      { type: "text", text: "รายชื่อผู้ใช้", size: "xxs", color: "#9ca3af", align: "center" },
                    ],
                    flex: 1,
                    backgroundColor: "#f0fdf4",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    action: { type: "message", label: "User List", text: "/userlist 1" },
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "🔍", size: "xxl", align: "center" },
                      { type: "text", text: "Search", size: "xxs", color: "#6b7280", align: "center", margin: "xs", weight: "bold" },
                      { type: "text", text: "ค้นหา User", size: "xxs", color: "#9ca3af", align: "center" },
                    ],
                    flex: 1,
                    backgroundColor: "#ecfeff",
                    cornerRadius: "10px",
                    paddingAll: "10px",
                    margin: "sm",
                    action: { type: "message", label: "Search", text: "/user " },
                  },
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "button",
                    action: { type: "message", label: "📢 Broadcast Message", text: "/broadcast " },
                    style: "primary",
                    color: "#10b981",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: { type: "message", label: "📝 Knowledge Management", text: "/kb" },
                    style: "secondary",
                    height: "sm",
                  },
                  {
                    type: "button",
                    action: { type: "message", label: "🏢 Organization List", text: "/orglist" },
                    style: "secondary",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: { type: "message", label: "🚫 Ban List", text: "/banlist" },
                    style: "secondary",
                    height: "sm",
                    margin: "sm",
                  },
                  {
                    type: "button",
                    action: { type: "message", label: "📝 System Logs", text: "/logs" },
                    style: "secondary",
                    height: "sm",
                    margin: "sm",
                  },
                ],
                margin: "sm",
              },
            ],
            paddingAll: "16px",
          },
          footer: {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🏠 Home", text: "/super" },
                style: "link",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "ℹ️ Help", text: "/help" },
                style: "primary",
                color: "#6366f1",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
              { type: "text", text: "3/3", size: "xxs", color: "#9ca3af", align: "center", flex: 0, margin: "md" },
            ],
            paddingAll: "10px",
          },
        },
      ],
    },
  };
};

/**
 * 👑 Admin Control Panel - เมนูหลักสำหรับ Super Admin (Legacy Support)
 */
const createAdminControlPanelMessage = () => {
  return {
    type: "flex",
    altText: "👑 Admin Control Panel - เมนูควบคุมระบบ",
    contents: {
      type: "carousel",
      contents: [
        // Bubble 1: Dashboard & Stats
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "👑", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    flex: 1,
                    contents: [
                      { type: "text", text: "Admin Panel", weight: "bold", color: "#ffffff", size: "md" },
                      { type: "text", text: "Dashboard & Stats", color: "#ffffff99", size: "xxs" },
                    ],
                  },
                ],
              },
            ],
            backgroundColor: "#7c4dff",
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
                  { type: "text", text: "📊", size: "lg", flex: 0 },
                  { type: "text", text: "/stats", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "สถิติระบบ", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                action: { type: "message", text: "/stats" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📅", size: "lg", flex: 0 },
                  { type: "text", text: "/daily", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "สรุปวันนี้", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#f5f5f5",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/daily" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🏆", size: "lg", flex: 0 },
                  { type: "text", text: "/top", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ผู้ใช้ Top 10", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/top" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🕐", size: "lg", flex: 0 },
                  { type: "text", text: "/recent", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ผู้ใช้ล่าสุด", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#f5f5f5",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/recent" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💎", size: "lg", flex: 0 },
                  { type: "text", text: "/premium", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "Premium Report", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/premium" },
              },
            ],
            paddingAll: "12px",
          },
        },
        // Bubble 2: User Management
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "👥", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    flex: 1,
                    contents: [
                      { type: "text", text: "User Management", weight: "bold", color: "#ffffff", size: "md" },
                      { type: "text", text: "จัดการสมาชิก", color: "#ffffff99", size: "xxs" },
                    ],
                  },
                ],
              },
            ],
            backgroundColor: "#1e88e5",
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
                  { type: "text", text: "🔍", size: "lg", flex: 0 },
                  { type: "text", text: "/user [ID]", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ดูข้อมูลผู้ใช้", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                action: { type: "message", text: "/user " },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "lg", flex: 0 },
                  { type: "text", text: "/approve [ID]", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "อนุมัติ Premium", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#e8f5e9",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/approve " },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "⏰", size: "lg", flex: 0 },
                  { type: "text", text: "/extend [ID] [days]", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ต่ออายุ", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/extend " },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🚫", size: "lg", flex: 0 },
                  { type: "text", text: "/ban [ID] [reason]", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "แบนผู้ใช้", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#ffebee",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/ban " },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✨", size: "lg", flex: 0 },
                  { type: "text", text: "/unban [ID]", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ปลดแบน", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/unban " },
              },
            ],
            paddingAll: "12px",
          },
        },
        // Bubble 3: Test & Debug
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🧪", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    flex: 1,
                    contents: [
                      { type: "text", text: "Test & Debug", weight: "bold", color: "#ffffff", size: "md" },
                      { type: "text", text: "ทดสอบระบบ", color: "#ffffff99", size: "xxs" },
                    ],
                  },
                ],
              },
            ],
            backgroundColor: "#ff5722",
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
                  { type: "text", text: "🎭", size: "lg", flex: 0 },
                  { type: "text", text: "/test user", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "โหมดผู้ใช้ปกติ", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                action: { type: "message", text: "/test user" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💎", size: "lg", flex: 0 },
                  { type: "text", text: "/test premium", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "โหมด Premium", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#f3e5f5",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/test premium" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📊", size: "lg", flex: 0 },
                  { type: "text", text: "/test quota", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ทดสอบโควต้า", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/test quota" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📱", size: "lg", flex: 0 },
                  { type: "text", text: "/test report", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ทดสอบ Logbook", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#e3f2fd",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/test report" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🔄", size: "lg", flex: 0 },
                  { type: "text", text: "/test reset", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "รีเซ็ตโหมด", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/test reset" },
              },
            ],
            paddingAll: "12px",
          },
        },
        // Bubble 4: Broadcast & Communication
        {
          type: "bubble",
          size: "kilo",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📢", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    flex: 1,
                    contents: [
                      { type: "text", text: "Broadcast", weight: "bold", color: "#ffffff", size: "md" },
                      { type: "text", text: "ประกาศ & สื่อสาร", color: "#ffffff99", size: "xxs" },
                    ],
                  },
                ],
              },
            ],
            backgroundColor: "#43a047",
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
                  { type: "text", text: "📣", size: "lg", flex: 0 },
                  { type: "text", text: "/broadcast [msg]", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ส่งทุกคน", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                action: { type: "message", text: "/broadcast " },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💎", size: "lg", flex: 0 },
                  { type: "text", text: "/broadcast premium", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "เฉพาะ Premium", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#f3e5f5",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/broadcast premium " },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "⏰", size: "lg", flex: 0 },
                  { type: "text", text: "/broadcast expiring", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "ใกล้หมดอายุ", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/broadcast expiring" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📋", size: "lg", flex: 0 },
                  { type: "text", text: "/pending", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "รออนุมัติ", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                backgroundColor: "#fff3e0",
                cornerRadius: "4px",
                margin: "sm",
                action: { type: "message", text: "/pending" },
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🏢", size: "lg", flex: 0 },
                  { type: "text", text: "/orglist", weight: "bold", size: "sm", margin: "md", flex: 1 },
                  { type: "text", text: "รายการองค์กร", size: "xs", color: "#888888", align: "end" },
                ],
                paddingAll: "8px",
                margin: "sm",
                action: { type: "message", text: "/orglist" },
              },
            ],
            paddingAll: "12px",
          },
        },
      ],
    },
  };
};

/**
 * 🔍 User Detail Flex Message - แสดงข้อมูลผู้ใช้แบบละเอียด
 */
const createUserDetailMessage = (user) => {
  if (!user) return null;

  const {
    odUserId = "N/A",
    displayName = "Unknown",
    subscriptionStatus = "free",
    subscriptionExpiry = null,
    isBanned = false,
    banReason = "",
    usageCount = 0,
    orgCode = null,
  } = user;

  const odUserIdSafe = odUserId || "N/A";

  // Calculate days remaining
  let daysRemaining = 0;
  let expiryText = "ไม่มี";
  if (subscriptionExpiry) {
    const expDate = subscriptionExpiry.toDate ? subscriptionExpiry.toDate() : new Date(subscriptionExpiry);
    daysRemaining = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
    expiryText = expDate.toLocaleDateString("th-TH");
  }

  const statusColor = isBanned ? "#e74c3c" :
    subscriptionStatus === "premium" || subscriptionStatus === "approved" ? "#27ae60" :
      "#888888";
  const statusText = isBanned ? "🚫 ถูกแบน" :
    subscriptionStatus === "premium" || subscriptionStatus === "approved" ? "💎 Premium" :
      "👤 Free";

  return {
    type: "flex",
    altText: `👤 ข้อมูลผู้ใช้: ${sanitizeTextForLine(displayName)}`,
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
              { type: "text", text: "👤", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                flex: 1,
                contents: [
                  { type: "text", text: sanitizeTextForLine(displayName), weight: "bold", color: "#ffffff", size: "lg", wrap: true },
                  { type: "text", text: statusText, color: "#ffffff99", size: "xs" },
                ],
              },
            ],
          },
        ],
        backgroundColor: statusColor,
        paddingAll: "18px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // User ID
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🆔 User ID:", size: "xs", color: "#888888", flex: 1 },
              { type: "text", text: odUserIdSafe.length > 20 ? odUserIdSafe.substring(0, 20) + "..." : odUserIdSafe, size: "xs", color: "#333333", flex: 2, align: "end" },
            ],
            margin: "md",
          },
          // Status
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📊 สถานะ:", size: "xs", color: "#888888", flex: 1 },
              { type: "text", text: subscriptionStatus || "free", size: "xs", color: statusColor, weight: "bold", flex: 2, align: "end" },
            ],
            margin: "sm",
          },
          // Expiry
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "📅 หมดอายุ:", size: "xs", color: "#888888", flex: 1 },
              { type: "text", text: expiryText + (daysRemaining > 0 ? ` (${daysRemaining} วัน)` : ""), size: "xs", color: daysRemaining <= 7 ? "#e74c3c" : "#333333", flex: 2, align: "end" },
            ],
            margin: "sm",
          },
          // Usage
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "💬 ใช้งาน:", size: "xs", color: "#888888", flex: 1 },
              { type: "text", text: `${usageCount || 0} ครั้ง`, size: "xs", color: "#333333", flex: 2, align: "end" },
            ],
            margin: "sm",
          },
          // Org Code
          ...(orgCode ? [{
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🏢 องค์กร:", size: "xs", color: "#888888", flex: 1 },
              { type: "text", text: orgCode, size: "xs", color: "#5e35b1", weight: "bold", flex: 2, align: "end" },
            ],
            margin: "sm",
          }] : []),
          // Ban info
          ...(isBanned ? [{
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🚫 ถูกแบน", weight: "bold", size: "sm", color: "#e74c3c" },
              { type: "text", text: `เหตุผล: ${banReason || "ไม่ระบุ"}`, size: "xs", color: "#666666", wrap: true },
            ],
            margin: "lg",
            paddingAll: "10px",
            backgroundColor: "#ffebee",
            cornerRadius: "8px",
          }] : []),
          // Separator
          { type: "separator", color: "#eeeeee", margin: "lg" },
          // Quick Actions
          { type: "text", text: "⚡ Quick Actions", weight: "bold", size: "sm", margin: "lg" },
        ],
        paddingAll: "18px",
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
                action: { type: "message", text: `/approve ${odUserIdSafe}` },
                style: "primary",
                height: "sm",
                flex: 1,
                color: "#27ae60",
              },
              { type: "separator", color: "#ffffff00", margin: "sm" },
              {
                type: "button",
                action: { type: "message", text: `/extend ${odUserIdSafe} 30` },
                style: "secondary",
                height: "sm",
                flex: 1,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", text: isBanned ? `/unban ${odUserIdSafe}` : `/ban ${odUserIdSafe}` },
                style: isBanned ? "primary" : "secondary",
                height: "sm",
                flex: 1,
                color: isBanned ? "#27ae60" : "#e74c3c",
              },
              { type: "separator", color: "#ffffff00", margin: "sm" },
              {
                type: "button",
                action: { type: "message", text: `/resetquota ${odUserIdSafe}` },
                style: "secondary",
                height: "sm",
                flex: 1,
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

/**
 * 🚫 Ban Confirmation Message
 */
const createBanConfirmationMessage = (odUserId, displayName, reason, isBan = true) => {
  const action = isBan ? "แบน" : "ปลดแบน";
  const icon = isBan ? "🚫" : "✅";
  const odUserIdSafe = odUserId || "N/A";

  return {
    type: "flex",
    altText: `${icon} ${action}ผู้ใช้: ${sanitizeTextForLine(displayName)}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: icon, size: "4xl", align: "center" },
          { type: "text", text: `${action}ผู้ใช้สำเร็จ`, weight: "bold", size: "lg", align: "center", margin: "md" },
          { type: "separator", color: "#eeeeee", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "👤 ชื่อ:", size: "sm", color: "#888888", flex: 1 },
              { type: "text", text: sanitizeTextForLine(displayName), size: "sm", flex: 2, align: "end", wrap: true },
            ],
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🆔 ID:", size: "sm", color: "#888888", flex: 1 },
              { type: "text", text: odUserIdSafe.length > 15 ? odUserIdSafe.substring(0, 15) + "..." : odUserIdSafe, size: "xs", flex: 2, align: "end" },
            ],
            margin: "sm",
          },
          ...(isBan && reason ? [{
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "📝 เหตุผล:", size: "sm", color: "#888888" },
              { type: "text", text: reason, size: "sm", color: "#333333", wrap: true, margin: "xs" },
            ],
            margin: "md",
            paddingAll: "10px",
            backgroundColor: "#ffebee",
            cornerRadius: "6px",
          }] : []),
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", text: `/user ${odUserIdSafe}` },
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

/**
 * 🧪 Test Mode Message
 */
const createTestModeMessage = (mode, isActive) => {
  const modes = {
    user: { icon: "👤", name: "User Mode", desc: "ทดสอบในฐานะผู้ใช้ทั่วไป (Free)", color: "#888888" },
    premium: { icon: "💎", name: "Premium Mode", desc: "ทดสอบในฐานะผู้ใช้ Premium", color: "#7c4dff" },
    quota: { icon: "📊", name: "Quota Test", desc: "ทดสอบระบบโควต้า (15 ครั้ง/วัน)", color: "#f39c12" },
    report: { icon: "📱", name: "Report Test", desc: "ทดสอบระบบ Digital Logbook", color: "#1e88e5" },
    reset: { icon: "🔄", name: "Reset Mode", desc: "กลับสู่โหมด Admin ปกติ", color: "#27ae60" },
  };

  const config = modes[mode] || modes.reset;

  return {
    type: "flex",
    altText: `🧪 Test Mode: ${config.name}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: config.icon, size: "4xl", align: "center" },
          { type: "text", text: config.name, weight: "bold", size: "lg", align: "center", margin: "md", color: config.color },
          { type: "text", text: isActive ? "✅ เปิดใช้งานแล้ว" : "❌ ปิดการใช้งาน", size: "sm", align: "center", color: isActive ? "#27ae60" : "#888888", margin: "sm" },
          { type: "separator", color: "#eeeeee", margin: "lg" },
          { type: "text", text: config.desc, size: "xs", color: "#666666", align: "center", wrap: true, margin: "md" },
          ...(isActive && mode !== "reset" ? [{
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "💡 พิมพ์ /test reset เพื่อกลับสู่โหมดปกติ", size: "xxs", color: "#888888", align: "center", wrap: true },
            ],
            margin: "lg",
            paddingAll: "10px",
            backgroundColor: "#f5f5f5",
            cornerRadius: "6px",
          }] : []),
        ],
        paddingAll: "20px",
      },
    },
  };
};

// =====================================================
// 🧪 ADMIN FEATURE TESTING DASHBOARD
// เครื่องมือทดสอบครบวงจรสำหรับ Admin
// =====================================================

/**
 * 🧪 Admin Feature Testing Dashboard - BUTTON VERSION
 * ใช้ button แทน box action เพื่อหลีกเลี่ยงปัญหา LINE API
 */
const createAdminTestDashboard = () => {
  return {
    type: "flex",
    altText: "🧪 Admin Testing Dashboard",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🧪 Admin Testing Dashboard", weight: "bold", color: "#ffffff", size: "md" },
          { type: "text", text: "กดปุ่มด้านล่างเพื่อทดสอบ", color: "#ffffffcc", size: "xs" },
        ],
        backgroundColor: "#667eea",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "📝 ทดสอบฟังก์ชันหลัก:", size: "sm", weight: "bold", color: "#333333" },
          { type: "text", text: "• 🏭 ฉีดพลาสติก • 🌾 เกษตร • 💰 บัญชี", size: "xs", color: "#666666", wrap: true },
        ],
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#2196F3",
            action: { type: "message", label: "🏭 ทดสอบ Plastic", text: "ปัญหา Short Shot แก้ยังไง" },
            height: "sm",
          },
          {
            type: "button",
            style: "primary",
            color: "#4CAF50",
            action: { type: "message", label: "🌾 ทดสอบ Farm", text: "คำนวณปุ๋ยสำหรับทุเรียน 5 ไร่" },
            height: "sm",
          },
          {
            type: "button",
            style: "primary",
            color: "#FF9800",
            action: { type: "message", label: "💰 ทดสอบ บัญชี", text: "ขายมะม่วง 50 กก. 1500 บาท" },
            height: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "📊 สรุปบัญชี", text: "สรุปบัญชีวันนี้" },
            height: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: { type: "message", label: "👑 Admin Panel", text: "/admin" },
            height: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * 🚀 Quick Test Menu - เมนูทดสอบด่วน
 */
const createQuickTestMenu = () => {
  return {
    type: "flex",
    altText: "🚀 Quick Test Menu",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🚀 Quick Test", weight: "bold", color: "#ffffff", size: "lg" },
          { type: "text", text: "ทดสอบด่วน", color: "#ffffffcc", size: "xs" },
        ],
        backgroundColor: "#00C851",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🏭 Plastic", text: "ปัญหา Short Shot แก้ยังไง" },
            style: "secondary",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "🌾 Farm", text: "คำนวณปุ๋ยสำหรับทุเรียน 5 ไร่" },
            style: "secondary",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "💰 Accounting", text: "ขายมะม่วง 50 กก. 1500 บาท" },
            style: "secondary",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "📊 Summary", text: "สรุปบัญชีวันนี้" },
            style: "secondary",
            height: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * 🏢 Organization List Message
 */
const createOrgListMessage = (orgs) => {
  if (!orgs || orgs.length === 0) {
    return createSimpleMessage(false, "❌ ไม่พบข้อมูลองค์กร");
  }

  const orgItems = orgs.slice(0, 10).map((org, idx) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: `${idx + 1}.`, size: "sm", color: "#888888", flex: 0 },
      { type: "text", text: org.orgCode || "N/A", weight: "bold", size: "sm", margin: "sm", flex: 2 },
      { type: "text", text: `${org.memberCount || 0} คน`, size: "xs", color: "#666666", align: "end", flex: 1 },
    ],
    paddingAll: "8px",
    backgroundColor: idx % 2 === 0 ? "#f5f5f5" : "#ffffff",
    cornerRadius: "4px",
    margin: idx > 0 ? "xs" : "none",
  }));

  return {
    type: "flex",
    altText: `🏢 รายการองค์กร (${orgs.length} รายการ)`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🏢", size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                flex: 1,
                contents: [
                  { type: "text", text: "รายการองค์กร", weight: "bold", color: "#ffffff", size: "md" },
                  { type: "text", text: `ทั้งหมด ${orgs.length} องค์กร`, color: "#ffffff99", size: "xxs" },
                ],
              },
            ],
          },
        ],
        backgroundColor: "#5e35b1",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: orgItems,
        paddingAll: "15px",
      },
    },
  };
};


/**
 * 1. Create Knowledge Menu Flex - เมนูหลักจัดการความรู้
 * คำสั่ง: /km หรือ เมนูความรู้
 */
const createKnowledgeMenuFlex = (stats = null) => {
  // Dynamic stats if provided
  const totalKnowledge = stats?.totalKnowledge || 0;
  const pendingVerification = stats?.pendingVerification || 0;
  const verifiedCount = totalKnowledge - pendingVerification;

  return {
    type: "flex",
    altText: "🧠 เมนูจัดการความรู้",
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
              { type: "text", text: "🧠", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Knowledge Management", weight: "bold", size: "xl", color: "#ffffff" },
                  { type: "text", text: "ระบบจัดการความรู้", size: "sm", color: "#ffffffcc", margin: "xs" },
                ],
                margin: "lg",
              },
            ],
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#8b5cf6",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Quick Stats
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "📊 สถิติรวม", weight: "bold", size: "md", color: "#374151" },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "📚", size: "xl", align: "center" },
                      { type: "text", text: "ความรู้ทั้งหมด", size: "xs", color: "#6b7280", align: "center", margin: "sm" },
                      { type: "text", text: totalKnowledge > 0 ? String(totalKnowledge) : "-", size: "lg", weight: "bold", color: "#8b5cf6", align: "center", margin: "xs" },
                    ],
                    flex: 1,
                    backgroundColor: "#f9fafb",
                    paddingAll: "12px",
                    cornerRadius: "8px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "✅", size: "xl", align: "center" },
                      { type: "text", text: "ยืนยันแล้ว", size: "xs", color: "#6b7280", align: "center", margin: "sm" },
                      { type: "text", text: verifiedCount > 0 ? String(verifiedCount) : "-", size: "lg", weight: "bold", color: "#10b981", align: "center", margin: "xs" },
                    ],
                    flex: 1,
                    backgroundColor: "#f0fdf4",
                    paddingAll: "12px",
                    cornerRadius: "8px",
                    margin: "sm",
                  },
                ],
                margin: "md",
              },
            ],
          },
          { type: "separator", margin: "lg" },
          // Menu Actions
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "🎯 เมนูการจัดการ", weight: "bold", size: "md", color: "#374151" },
              // Action 1: ดูความรู้ทั้งหมด
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📚", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "ดูความรู้ทั้งหมด", weight: "bold", size: "sm", color: "#1f2937" },
                      { type: "text", text: "แสดงรายการความรู้แบ่งตามหมวดหมู่", size: "xs", color: "#6b7280", wrap: true, margin: "xs" },
                    ],
                    margin: "md",
                  },
                ],
                backgroundColor: "#f9fafb",
                paddingAll: "12px",
                cornerRadius: "8px",
                margin: "md",
                action: { type: "message", label: "ดูความรู้", text: "ดูความรู้ทั้งหมด" },
              },
              // Action 2: ยืนยันความรู้
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "ยืนยันความรู้", weight: "bold", size: "sm", color: "#1f2937" },
                      { type: "text", text: "ตรวจสอบและยืนยันความถูกต้อง", size: "xs", color: "#6b7280", wrap: true, margin: "xs" },
                    ],
                    margin: "md",
                  },
                ],
                backgroundColor: "#f0fdf4",
                paddingAll: "12px",
                cornerRadius: "8px",
                margin: "sm",
                action: { type: "message", label: "ยืนยัน", text: "verify ความรู้" },
              },
              // Action 3: ทดสอบ Hybrid - Quick Tests
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "🧪", size: "xl", flex: 0 },
                      {
                        type: "box",
                        layout: "vertical",
                        contents: [
                          { type: "text", text: "ทดสอบ Hybrid System", weight: "bold", size: "sm", color: "#1f2937" },
                          { type: "text", text: "ทดสอบด่วนแบบเลือกวัสดุ", size: "xs", color: "#6b7280", wrap: true, margin: "xs" },
                        ],
                        margin: "md",
                      },
                    ],
                    paddingAll: "12px",
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "button",
                        action: { type: "message", label: "ABS", text: "ทดสอบ hybrid ABS รอยยุบ" },
                        style: "primary",
                        color: "#8b5cf6",
                        height: "sm",
                        flex: 1,
                      },
                      {
                        type: "button",
                        action: { type: "message", label: "PP", text: "ทดสอบ hybrid PP บิดงอ" },
                        style: "primary",
                        color: "#06b6d4",
                        height: "sm",
                        flex: 1,
                        margin: "xs",
                      },
                      {
                        type: "button",
                        action: { type: "message", label: "PC", text: "ทดสอบ hybrid PC ขุ่น" },
                        style: "primary",
                        color: "#10b981",
                        height: "sm",
                        flex: 1,
                        margin: "xs",
                      },
                    ],
                    paddingStart: "12px",
                    paddingEnd: "12px",
                    paddingBottom: "12px",
                  },
                ],
                backgroundColor: "#fef3c7",
                cornerRadius: "8px",
                margin: "sm",
              },
              // Action 4: ดูสถิติ Hybrid (Super Admin Only)
              ...(stats && stats.totalKnowledge > 0 ? [{
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📊", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "สถิติ Hybrid Performance", weight: "bold", size: "sm", color: "#1f2937" },
                      { type: "text", text: "ดูประสิทธิภาพระบบแบบละเอียด", size: "xs", color: "#6b7280", wrap: true, margin: "xs" },
                    ],
                    margin: "md",
                  },
                ],
                backgroundColor: "#e0e7ff",
                paddingAll: "12px",
                cornerRadius: "8px",
                margin: "sm",
                action: { type: "message", label: "สถิติ", text: "/hybridstats" },
              }] : []),
              // Action 5: ปรับปรุงคลัง
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🔧", size: "xl", flex: 0 },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      { type: "text", text: "ปรับปรุงคลังความรู้", weight: "bold", size: "sm", color: "#1f2937" },
                      { type: "text", text: "Optimize และจัดระเบียบ", size: "xs", color: "#6b7280", wrap: true, margin: "xs" },
                    ],
                    margin: "md",
                  },
                ],
                backgroundColor: "#dbeafe",
                paddingAll: "12px",
                cornerRadius: "8px",
                margin: "sm",
                action: { type: "message", label: "ปรับปรุง", text: "ปรับปรุงคลัง" },
              },
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
            type: "button",
            action: { type: "message", label: "🔙 กลับเมนูหลัก", text: "/admin" },
            style: "link",
            height: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * 2. Create Knowledge List Flex - แสดงรายการความรู้
 * คำสั่ง: ดูความรู้ทั้งหมด
 */
const createKnowledgeListFlex = (knowledgeData) => {
  const { items = [], total = 0, verified = 0, categories = [] } = knowledgeData || {};

  // Group by category
  const categoryContents = categories.slice(0, 5).map((cat, index) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: cat.icon || "📌", size: "lg", flex: 0 },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: cat.name || "Unknown", weight: "bold", size: "sm", color: "#1f2937" },
          { type: "text", text: `${cat.count || 0} รายการ`, size: "xs", color: "#6b7280", margin: "xs" },
        ],
        margin: "md",
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: cat.verified ? "✅" : "⏳", size: "lg", align: "end" },
        ],
        flex: 0,
      },
    ],
    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
    paddingAll: "12px",
    cornerRadius: "8px",
    margin: index === 0 ? "none" : "sm",
    action: { type: "message", label: cat.name, text: `ดูหมวด ${cat.name}` },
  }));

  return {
    type: "flex",
    altText: `📚 ความรู้ทั้งหมด ${total} รายการ`,
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
              { type: "text", text: "📚", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Knowledge Base", weight: "bold", size: "xl", color: "#ffffff" },
                  { type: "text", text: `${total} รายการ | ${verified} ยืนยัน`, size: "sm", color: "#ffffffcc", margin: "xs" },
                ],
                margin: "lg",
              },
            ],
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#3b82f6",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📂 หมวดหมู่ความรู้", weight: "bold", size: "md", color: "#374151" },
          ...categoryContents,
          categories.length > 5 ? {
            type: "text",
            text: `+${categories.length - 5} หมวดหมู่เพิ่มเติม`,
            size: "xs",
            color: "#6b7280",
            align: "center",
            margin: "md",
          } : null,
        ].filter(Boolean),
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🔄 รีเฟรช", text: "ดูความรู้ทั้งหมด" },
            style: "primary",
            color: "#3b82f6",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "🔙 กลับเมนู", text: "/km" },
            style: "link",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * 3. Create Knowledge Verify Flex - แสดงผลการยืนยันความรู้
 * คำสั่ง: verify ความรู้
 */
const createKnowledgeVerifyFlex = (verifyResult) => {
  const {
    verified = 0,
    pending = 0,
    total = 0,
    lastVerified = null,
    confidence = 0,
  } = verifyResult || {};

  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;
  const confidenceColor = confidence >= 80 ? "#10b981" : confidence >= 60 ? "#f59e0b" : "#ef4444";

  return {
    type: "flex",
    altText: `✅ ยืนยันความรู้: ${verified}/${total} (${percentage}%)`,
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
              { type: "text", text: "✅", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Knowledge Verification", weight: "bold", size: "lg", color: "#ffffff" },
                  { type: "text", text: "ระบบยืนยันความรู้", size: "sm", color: "#ffffffcc", margin: "xs" },
                ],
                margin: "lg",
              },
            ],
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#10b981",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Progress
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "สถานะการยืนยัน", size: "sm", color: "#6b7280", flex: 0 },
                  { type: "text", text: `${percentage}%`, size: "sm", weight: "bold", color: "#10b981", align: "end" },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [{ type: "filler" }],
                    backgroundColor: "#10b981",
                    height: "6px",
                    cornerRadius: "3px",
                    width: `${percentage}%`,
                  },
                ],
                backgroundColor: "#e5e7eb",
                height: "6px",
                cornerRadius: "3px",
                margin: "sm",
              },
            ],
          },
          // Stats
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: verified.toString(), size: "xxl", weight: "bold", color: "#10b981", align: "center" },
                  { type: "text", text: "ยืนยันแล้ว", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                flex: 1,
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: pending.toString(), size: "xxl", weight: "bold", color: "#f59e0b", align: "center" },
                  { type: "text", text: "รอตรวจสอบ", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                flex: 1,
              },
              { type: "separator" },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: total.toString(), size: "xxl", weight: "bold", color: "#3b82f6", align: "center" },
                  { type: "text", text: "ทั้งหมด", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                flex: 1,
              },
            ],
            margin: "lg",
            paddingAll: "12px",
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
          },
          // Confidence Score
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🎯", size: "lg", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Confidence Score", size: "sm", color: "#6b7280" },
                  { type: "text", text: `${confidence}%`, size: "lg", weight: "bold", color: confidenceColor, margin: "xs" },
                ],
                margin: "md",
              },
            ],
            paddingAll: "12px",
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
            margin: "md",
          },
          // Last Verified
          lastVerified ? {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "⏱️", size: "sm", flex: 0 },
              { type: "text", text: `ยืนยันล่าสุด: ${lastVerified}`, size: "xs", color: "#6b7280", margin: "sm" },
            ],
            margin: "md",
          } : null,
        ].filter(Boolean),
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🔄 ยืนยันอีกครั้ง", text: "verify ความรู้" },
            style: "primary",
            color: "#10b981",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "📚 ดูรายการ", text: "ดูความรู้ทั้งหมด" },
            style: "secondary",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * 4. Create Hybrid Test Flex - แสดงผลการทดสอบ Hybrid ABS
 * คำสั่ง: ทดสอบ hybrid ABS
 */
const createHybridTestFlex = (testResult) => {
  const {
    query = "",
    localKnowledge = [],
    aiResponse = "",
    injectedData = {},
    responseTime = 0,
    strategy = "balanced_hybrid",
    confidence = 0,
  } = testResult || {};

  // Determine strategy color and icon
  const strategyInfo = {
    local_primary: { icon: "📚", color: "#10b981", name: "Local Primary", desc: "ใช้ความรู้ท้องถิ่นเป็นหลัก" },
    balanced_hybrid: { icon: "⚖️", color: "#8b5cf6", name: "Balanced Hybrid", desc: "ผสมผสาน Local + AI" },
    ai_primary: { icon: "🤖", color: "#3b82f6", name: "AI Primary", desc: "ใช้ AI เป็นหลัก" },
    best_effort: { icon: "🎯", color: "#f59e0b", name: "Best Effort", desc: "ข้อมูลจำกัด ทำเต็มที่" },
  };

  const currentStrategy = strategyInfo[strategy] || strategyInfo.balanced_hybrid;

  // Local knowledge items
  const localKnowledgeContent = localKnowledge.slice(0, 5).map((item, index) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: "•", size: "sm", color: "#10b981", flex: 0 },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: item.name || "Knowledge Item", size: "xs", color: "#1f2937", wrap: true },
          { type: "text", text: `Relevance: ${(item.relevance * 100).toFixed(0)}%`, size: "xxs", color: "#6b7280", margin: "xs" },
        ],
        margin: "sm",
      },
    ],
    margin: index === 0 ? "sm" : "xs",
  }));

  return {
    type: "flex",
    altText: `🧪 Hybrid Test: "${query}"`,
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
              { type: "text", text: "🧪", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Hybrid Intelligence Test", size: "xl", weight: "bold", color: "#ffffff" },
                  { type: "text", text: "Testing System Performance", size: "xs", color: "#e0e7ff", margin: "xs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: currentStrategy.color,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Strategy Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: currentStrategy.icon, size: "xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: currentStrategy.name, size: "md", weight: "bold", color: "#1f2937" },
                  { type: "text", text: currentStrategy.desc, size: "xs", color: "#6b7280" },
                ],
                margin: "sm",
              },
            ],
            backgroundColor: currentStrategy.color + "20",
            cornerRadius: "10px",
            paddingAll: "12px",
          },
          // Query Section
          { type: "separator", margin: "lg" },
          { type: "text", text: "📋 Test Query", size: "sm", weight: "bold", color: "#1f2937", margin: "lg" },
          { type: "text", text: query || "No query provided", size: "xs", color: "#4b5563", wrap: true, margin: "xs" },
          // Performance Metrics
          { type: "separator", margin: "lg" },
          { type: "text", text: "📊 Performance", size: "sm", weight: "bold", color: "#1f2937", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: `${(confidence * 100).toFixed(0)}%`, size: "xxl", weight: "bold", color: currentStrategy.color, align: "center" },
                  { type: "text", text: "Confidence", size: "xs", color: "#6b7280", align: "center" },
                ],
                backgroundColor: "#f9fafb",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: `${responseTime}ms`, size: "lg", weight: "bold", color: "#3b82f6", align: "center" },
                  { type: "text", text: "Response", size: "xs", color: "#6b7280", align: "center" },
                ],
                backgroundColor: "#f9fafb",
                cornerRadius: "8px",
                paddingAll: "10px",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "sm",
          },
          // Local Knowledge
          ...(localKnowledge.length > 0 ? [
            { type: "separator", margin: "lg" },
            { type: "text", text: `📚 Local Knowledge (${localKnowledge.length})`, size: "sm", weight: "bold", color: "#1f2937", margin: "lg" },
            ...localKnowledgeContent,
          ] : []),
          // AI Response
          { type: "separator", margin: "lg" },
          { type: "text", text: "🤖 AI Analysis", size: "sm", weight: "bold", color: "#1f2937", margin: "lg" },
          { type: "text", text: aiResponse || "No AI response", size: "xs", color: "#4b5563", wrap: true, margin: "xs" },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "View Stats", text: "/hybridstats" },
            style: "primary",
            color: currentStrategy.color,
            height: "sm",
            flex: 1,
          },
          {
            type: "button",
            action: { type: "message", label: "Knowledge Menu", text: "/km" },
            style: "link",
            height: "sm",
            flex: 1,
          },
        ],
        paddingAll: "10px",
      },
    },
  };
};

// =================== 📊 HYBRID STATS FLEX MESSAGE ===================
const createHybridStatsFlexMessage = (statsData) => {
  const {
    totalKnowledge = 0,
    verifiedKnowledge = 0,
    pendingVerification = 0,
    strategyCount = { local_primary: 0, balanced_hybrid: 0, ai_primary: 0, best_effort: 0 },
    totalLogs = 0,
    avgConfidence = 0,
    successRate = 0,
  } = statsData || {};

  // Calculate percentages for each strategy
  const strategyPercentages = {
    local_primary: totalLogs > 0 ? ((strategyCount.local_primary / totalLogs) * 100).toFixed(1) : 0,
    balanced_hybrid: totalLogs > 0 ? ((strategyCount.balanced_hybrid / totalLogs) * 100).toFixed(1) : 0,
    ai_primary: totalLogs > 0 ? ((strategyCount.ai_primary / totalLogs) * 100).toFixed(1) : 0,
    best_effort: totalLogs > 0 ? ((strategyCount.best_effort / totalLogs) * 100).toFixed(1) : 0,
  };

  // Strategy colors
  const strategyColors = {
    local_primary: "#10b981",
    balanced_hybrid: "#8b5cf6",
    ai_primary: "#3b82f6",
    best_effort: "#f59e0b",
  };

  // Create strategy bars
  const createStrategyBar = (name, icon, count, percentage, color) => ({
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: icon, size: "sm", flex: 0 },
          { type: "text", text: name, size: "xs", color: "#4b5563", margin: "xs", flex: 1 },
          { type: "text", text: `${count}`, size: "xs", weight: "bold", color: color, align: "end" },
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
            width: `${percentage}%`,
            height: "6px",
            backgroundColor: color,
            cornerRadius: "3px",
          },
        ],
        backgroundColor: "#e5e7eb",
        height: "6px",
        cornerRadius: "3px",
        margin: "xs",
      },
      { type: "text", text: `${percentage}%`, size: "xxs", color: "#9ca3af", align: "end", margin: "xs" },
    ],
    margin: "md",
  });

  return {
    type: "flex",
    altText: "📊 Hybrid System Statistics",
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
              { type: "text", text: "📊", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Hybrid Intelligence", size: "xl", weight: "bold", color: "#ffffff" },
                  { type: "text", text: "System Performance Analytics", size: "xs", color: "#e0e7ff", margin: "xs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#6366f1",
          endColor: "#8b5cf6",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Knowledge Base Statistics Cards
          { type: "text", text: "🧠 Knowledge Base", size: "md", weight: "bold", color: "#1f2937" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: `${totalKnowledge}`, size: "xxl", weight: "bold", color: "#6366f1", align: "center" },
                  { type: "text", text: "Total", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                backgroundColor: "#eef2ff",
                cornerRadius: "12px",
                paddingAll: "15px",
                flex: 1,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: `${verifiedKnowledge}`, size: "xxl", weight: "bold", color: "#10b981", align: "center" },
                  { type: "text", text: "Verified", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                backgroundColor: "#d1fae5",
                cornerRadius: "12px",
                paddingAll: "15px",
                flex: 1,
                margin: "sm",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: `${pendingVerification}`, size: "xxl", weight: "bold", color: "#f59e0b", align: "center" },
                  { type: "text", text: "Pending", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                backgroundColor: "#fef3c7",
                cornerRadius: "12px",
                paddingAll: "15px",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "sm",
          },
          // Strategy Distribution
          { type: "separator", margin: "xl" },
          { type: "text", text: `🎯 Strategy Usage (${totalLogs} Tests)`, size: "md", weight: "bold", color: "#1f2937", margin: "lg" },
          createStrategyBar("Local Primary", "📚", strategyCount.local_primary, strategyPercentages.local_primary, strategyColors.local_primary),
          createStrategyBar("Balanced Hybrid", "⚖️", strategyCount.balanced_hybrid, strategyPercentages.balanced_hybrid, strategyColors.balanced_hybrid),
          createStrategyBar("AI Primary", "🤖", strategyCount.ai_primary, strategyPercentages.ai_primary, strategyColors.ai_primary),
          createStrategyBar("Best Effort", "🎯", strategyCount.best_effort, strategyPercentages.best_effort, strategyColors.best_effort),
          // Performance Metrics
          { type: "separator", margin: "xl" },
          { type: "text", text: "📈 Performance Metrics", size: "md", weight: "bold", color: "#1f2937", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: `${avgConfidence}`, size: "xxl", weight: "bold", color: "#8b5cf6", flex: 0 },
                      { type: "text", text: "%", size: "lg", color: "#8b5cf6", margin: "xs" },
                    ],
                    justifyContent: "center",
                  },
                  { type: "text", text: "Avg Confidence", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                backgroundColor: "#faf5ff",
                cornerRadius: "12px",
                paddingAll: "15px",
                flex: 1,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: `${successRate}`, size: "xxl", weight: "bold", color: "#10b981", flex: 0 },
                      { type: "text", text: "%", size: "lg", color: "#10b981", margin: "xs" },
                    ],
                    justifyContent: "center",
                  },
                  { type: "text", text: "Success Rate", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                backgroundColor: "#d1fae5",
                cornerRadius: "12px",
                paddingAll: "15px",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "Knowledge Menu", text: "/km" },
                style: "primary",
                color: "#6366f1",
                height: "sm",
                flex: 2,
              },
              {
                type: "button",
                action: { type: "message", label: "Test Hybrid", text: "ทดสอบ hybrid ABS รอยยุบ" },
                style: "link",
                height: "sm",
                flex: 1,
                margin: "xs",
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
};

/**
 * 5. Create Knowledge Optimize Flex - แสดงผลการปรับปรุงคลัง
 * คำสั่ง: ปรับปรุงคลัง
 */
const createKnowledgeOptimizeFlex = (optimizeResult) => {
  const {
    before = {},
    after = {},
    improvements = [],
    duration = 0,
    status = "completed",
  } = optimizeResult || {};

  const improvementsList = improvements.slice(0, 4).map((imp, index) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: imp.icon || "✨",
        size: "lg",
        flex: 0,
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: imp.title || "Improvement", weight: "bold", size: "sm", color: "#1f2937" },
          { type: "text", text: imp.description || "", size: "xs", color: "#6b7280", wrap: true, margin: "xs" },
          imp.value ? {
            type: "text",
            text: `→ ${imp.value}`,
            size: "xs",
            color: "#10b981",
            weight: "bold",
            margin: "xs",
          } : null,
        ].filter(Boolean),
        margin: "md",
      },
    ],
    backgroundColor: index % 2 === 0 ? "#f0fdf4" : "#ffffff",
    paddingAll: "10px",
    cornerRadius: "8px",
    margin: index === 0 ? "none" : "sm",
  }));

  return {
    type: "flex",
    altText: "🔧 ปรับปรุงคลังความรู้สำเร็จ",
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
              { type: "text", text: "🔧", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Knowledge Optimization", weight: "bold", size: "lg", color: "#ffffff" },
                  { type: "text", text: `${status === "completed" ? "✅ เสร็จสมบูรณ์" : "⏳ กำลังดำเนินการ"}`, size: "sm", color: "#ffffffcc", margin: "xs" },
                ],
                margin: "lg",
              },
            ],
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#0ea5e9",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Before/After Stats
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "ก่อนปรับปรุง", size: "xs", color: "#6b7280", align: "center" },
                  { type: "text", text: (before.total || 0).toString(), size: "xl", weight: "bold", color: "#ef4444", align: "center", margin: "sm" },
                  { type: "text", text: "รายการ", size: "xs", color: "#6b7280", align: "center" },
                ],
                flex: 1,
                paddingAll: "12px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "→", size: "xxl", color: "#0ea5e9", align: "center" },
                ],
                flex: 0,
                paddingAll: "12px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "หลังปรับปรุง", size: "xs", color: "#6b7280", align: "center" },
                  { type: "text", text: (after.total || 0).toString(), size: "xl", weight: "bold", color: "#10b981", align: "center", margin: "sm" },
                  { type: "text", text: "รายการ", size: "xs", color: "#6b7280", align: "center" },
                ],
                flex: 1,
                paddingAll: "12px",
              },
            ],
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
          },
          // Improvements
          { type: "text", text: "✨ การปรับปรุง", weight: "bold", size: "sm", color: "#374151", margin: "lg" },
          ...improvementsList,
          // Duration
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "⏱️", size: "sm", flex: 0 },
              { type: "text", text: `ใช้เวลา ${duration} วินาที`, size: "xs", color: "#6b7280", margin: "sm" },
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
            type: "button",
            action: { type: "message", label: "🔄 ปรับปรุงอีกครั้ง", text: "ปรับปรุงคลัง" },
            style: "primary",
            color: "#0ea5e9",
            height: "sm",
          },
          {
            type: "button",
            action: { type: "message", label: "📊 ตรวจสอบผล", text: "verify ความรู้" },
            style: "secondary",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * Empty Knowledge Flex - แสดงเมื่อไม่มีข้อมูล
 */
const createEmptyKnowledgeFlex = () => {
  return {
    type: "flex",
    altText: "ไม่พบข้อมูลความรู้",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📚", size: "3xl", align: "center" },
          { type: "text", text: "ไม่พบข้อมูล", weight: "bold", size: "lg", align: "center", color: "#374151", margin: "md" },
          { type: "text", text: "ยังไม่มีความรู้ในระบบ", size: "sm", color: "#6b7280", align: "center", wrap: true, margin: "sm" },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: { type: "message", label: "🔙 กลับเมนู", text: "/km" },
            style: "link",
            height: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

/**
 * 👤 ENHANCED: User Control Panel - Complete User Management
 * สำหรับควบคุม user ทุกมิติ: อนุมัติ, แบน, reset, ดูข้อมูล
 */
const createUserControlPanel = (userData) => {
  const {
    id,
    name = "Unknown User",
    email = "ไม่ระบุ",
    isPremium = false,
    isBanned = false,
    usageCount = 0,
    dailyUsage = 0,
    dailyLimit = 15,
    trialStatus = "none",
    trialDaysLeft = 0,
    createdAt = "ไม่ทราบ",
    lastActive = "ไม่ทราบ",
    subscriptionStatus = "none",
    selectedPackage = "ไม่มี",
    // Feature usage tracking
    visionUsage = 0,
    calculatorUsage = 0,
    agricultureUsage = 0,
    accountingUsage = 0,
    educationUsage = 0,
  } = userData;

  const safeName = sanitizeTextForLine(name);
  const safeEmail = sanitizeTextForLine(email);
  const idShort = id.substring(0, 16);

  // Status badge
  let statusBadge = "👤 Free";
  let statusColor = "#95a5a6";
  if (isBanned) {
    statusBadge = "🚫 Banned";
    statusColor = "#e74c3c";
  } else if (isPremium) {
    statusBadge = "💎 Premium";
    statusColor = "#9b59b6";
  } else if (trialStatus === "active") {
    statusBadge = `🎁 Trial (${trialDaysLeft}d)`;
    statusColor = "#f39c12";
  } else if (trialStatus === "expired") {
    statusBadge = "⏰ Trial Expired";
    statusColor = "#e67e22";
  }

  // Feature usage summary
  const totalFeatureUsage = visionUsage + calculatorUsage + agricultureUsage + accountingUsage + educationUsage;
  const mostUsedFeature =
    visionUsage >= Math.max(calculatorUsage, agricultureUsage, accountingUsage, educationUsage) ? "🔍 Vision AI" :
      calculatorUsage >= Math.max(agricultureUsage, accountingUsage, educationUsage) ? "🧮 Calculator" :
        agricultureUsage >= Math.max(accountingUsage, educationUsage) ? "🌾 Agriculture" :
          accountingUsage >= educationUsage ? "💰 Accounting" : "📚 Education";

  return {
    type: "flex",
    altText: `👤 User Control: ${safeName}`,
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
              {
                type: "text",
                text: "👤",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "User Control Panel",
                    weight: "bold",
                    color: "#ffffff",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "COMPLETE MANAGEMENT",
                    color: "#ffffff99",
                    size: "xs",
                  },
                ],
                margin: "md",
              },
            ],
          },
        ],
        backgroundColor: "#2c3e50",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // User Info Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: safeName,
                weight: "bold",
                size: "xl",
                color: "#1a1a1a",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: statusBadge,
                    size: "sm",
                    color: statusColor,
                    weight: "bold",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: isBanned ? "⚠️ ระงับการใช้งาน" : "",
                    size: "xs",
                    color: "#e74c3c",
                    margin: "sm",
                    flex: 0,
                  },
                ],
                margin: "sm",
              },
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          // Basic Info
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "📋 ข้อมูลพื้นฐาน",
                weight: "bold",
                color: "#34495e",
                size: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "🆔 ID:", size: "xs", color: "#7f8c8d", flex: 2 },
                  { type: "text", text: idShort + "...", size: "xs", color: "#2c3e50", flex: 3, wrap: true },
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📧 Email:", size: "xs", color: "#7f8c8d", flex: 2 },
                  { type: "text", text: safeEmail, size: "xs", color: "#2c3e50", flex: 3, wrap: true },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📦 แพ็คเกจ:", size: "xs", color: "#7f8c8d", flex: 2 },
                  { type: "text", text: selectedPackage, size: "xs", color: "#2c3e50", flex: 3, wrap: true },
                ],
              },
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          // Usage Stats
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "📊 สถิติการใช้งาน",
                weight: "bold",
                color: "#34495e",
                size: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "💬 ข้อความทั้งหมด:", size: "xs", color: "#7f8c8d", flex: 3 },
                  { type: "text", text: `${usageCount.toLocaleString()}`, size: "xs", color: "#27ae60", weight: "bold", flex: 2, align: "end" },
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📅 วันนี้:", size: "xs", color: "#7f8c8d", flex: 3 },
                  { type: "text", text: `${dailyUsage}/${isPremium ? "∞" : dailyLimit}`, size: "xs", color: dailyUsage >= dailyLimit ? "#e74c3c" : "#27ae60", weight: "bold", flex: 2, align: "end" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📅 สมัคร:", size: "xs", color: "#7f8c8d", flex: 3 },
                  { type: "text", text: createdAt, size: "xs", color: "#2c3e50", flex: 2, align: "end" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "⏰ ใช้ล่าสุด:", size: "xs", color: "#7f8c8d", flex: 3 },
                  { type: "text", text: lastActive, size: "xs", color: "#2c3e50", flex: 2, align: "end" },
                ],
              },
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          // Feature Usage
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: "🎯 การใช้ฟีเจอร์",
                weight: "bold",
                color: "#34495e",
                size: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ยอดรวม:", size: "xs", color: "#7f8c8d", flex: 2 },
                  { type: "text", text: `${totalFeatureUsage} ครั้ง`, size: "xs", color: "#3498db", weight: "bold", flex: 2, align: "end" },
                ],
                margin: "sm",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ใช้มากสุด:", size: "xs", color: "#7f8c8d", flex: 2 },
                  { type: "text", text: mostUsedFeature, size: "xs", color: "#2c3e50", flex: 2, align: "end" },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                margin: "sm",
                spacing: "xs",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "🔍 Vision", size: "xxs", color: "#7f8c8d", flex: 3 },
                      { type: "text", text: `${visionUsage}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "🧮 Calculator", size: "xxs", color: "#7f8c8d", flex: 3 },
                      { type: "text", text: `${calculatorUsage}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "🌾 Agriculture", size: "xxs", color: "#7f8c8d", flex: 3 },
                      { type: "text", text: `${agricultureUsage}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "💰 Accounting", size: "xxs", color: "#7f8c8d", flex: 3 },
                      { type: "text", text: `${accountingUsage}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      { type: "text", text: "📚 Education", size: "xxs", color: "#7f8c8d", flex: 3 },
                      { type: "text", text: `${educationUsage}`, size: "xxs", color: "#2c3e50", flex: 1, align: "end" },
                    ],
                  },
                ],
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
            type: "separator",
          },
          {
            type: "text",
            text: "⚡ Quick Actions",
            weight: "bold",
            size: "xs",
            color: "#34495e",
            margin: "md",
          },
          // Action Buttons Row 1
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            margin: "md",
            contents: [
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: { type: "message", label: "✅ อนุมัติ", text: `/approve ${id}` },
                color: "#27ae60",
              },
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: { type: "message", label: isBanned ? "✨ ปลดแบน" : "🚫 แบน", text: isBanned ? `/unban ${id}` : `/ban ${id}` },
                color: isBanned ? "#3498db" : "#e74c3c",
              },
            ],
          },
          // Action Buttons Row 2
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: { type: "message", label: "🔄 Reset", text: `/resetquota ${id}` },
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: { type: "message", label: "💬 ส่งข้อความ", text: `/reply ${id} ` },
              },
            ],
          },
          // Copy ID Button
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "link",
                height: "sm",
                action: { type: "message", label: "📋 Copy Full ID", text: `ID: ${id}` },
              },
            ],
          },
        ],
        paddingAll: "20px",
      },
    },
  };
};

/**
 * 👥 NEW: User List with Pagination and Quick Actions
 * แสดงรายการผู้ใช้ 10 คนต่อหน้า พร้อมปุ่มจัดการ (รูปแบบคล้าย /recent)
 */
const createUserListFlex = (users, currentPage = 1, totalUsers = 0) => {
  if (!Array.isArray(users) || users.length === 0) {
    return createSimpleMessage("ไม่พบรายการผู้ใช้", false);
  }

  const totalPages = Math.ceil(totalUsers / 10);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Create user rows with action buttons (คล้าย /recent แต่มีปุ่มจัดการ)
  const userRows = users.map((user, index) => {
    const {
      id,
      name = "Unknown",
      isPremium = false,
      isBanned = false,
      usageCount = 0,
      lastActive = "ไม่ทราบ",
      trialStatus = "none",
      email = "",
    } = user;

    const safeName = sanitizeTextForLine(name);

    // Status badge
    let statusBadge = "";
    if (isBanned) {
      statusBadge = "🚫";
    } else if (isPremium) {
      statusBadge = "💎";
    } else if (trialStatus === "active") {
      statusBadge = "🎁";
    }

    // Name with badge
    const nameContents = [
      {
        type: "text",
        text: safeName,
        size: "sm",
        color: isBanned ? "#e74c3c" : "#1a1a1a",
        weight: "bold",
        flex: 0,
      },
    ];

    if (statusBadge) {
      nameContents.push({
        type: "text",
        text: statusBadge,
        size: "sm",
        flex: 0,
        margin: "xs",
      });
    }

    return {
      type: "box",
      layout: "vertical",
      contents: [
        // User Info Row (คล้าย /recent)
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: nameContents,
                },
                {
                  type: "text",
                  text: `⏰ ${lastActive}`,
                  size: "xs",
                  color: "#666666",
                  margin: "xs",
                },
              ],
              flex: 3,
            },
            {
              type: "text",
              text: `${usageCount} ข้อความ`,
              size: "xs",
              color: "#1a1a1a",
              align: "end",
              gravity: "center",
              flex: 2,
            },
          ],
          paddingAll: "8px",
        },
        // Action Buttons Row (เพิ่มจากที่เดิม)
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "button",
              action: { type: "message", label: "👁️ ดูข้อมูล", text: `/user ${id}` },
              style: "link",
              height: "sm",
              flex: 1,
            },
            {
              type: "button",
              action: { type: "message", label: isBanned ? "✨ ปลดแบน" : "🚫 แบน", text: isBanned ? `/unban ${id}` : `/ban ${id}` },
              style: isBanned ? "primary" : "secondary",
              color: isBanned ? "#3498db" : undefined,
              height: "sm",
              flex: 1,
              margin: "xs",
            },
          ],
          margin: "xs",
        },
        // Separator
        {
          type: "separator",
          margin: "md",
        },
      ],
      margin: index === 0 ? "none" : "xs",
      backgroundColor: index % 2 === 0 ? "#F8F9FA" : "#ffffff",
      cornerRadius: "8px",
    };
  });

  // Pagination controls
  const paginationBox = {
    type: "box",
    layout: "horizontal",
    contents: [
      ...(hasPrevPage ? [{
        type: "button",
        action: { type: "message", label: "⬅️ หน้าก่อน", text: `/userlist ${currentPage - 1}` },
        style: "secondary",
        height: "sm",
        flex: 1,
      }] : [{
        type: "filler",
      }]),
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `หน้า ${currentPage}/${totalPages}`,
            size: "xs",
            color: "#95a5a6",
            align: "center",
            weight: "bold",
          },
          {
            type: "text",
            text: `ทั้งหมด ${totalUsers} คน`,
            size: "xxs",
            color: "#95a5a6",
            align: "center",
            margin: "xs",
          },
        ],
        flex: 1,
        justifyContent: "center",
      },
      ...(hasNextPage ? [{
        type: "button",
        action: { type: "message", label: "หน้าถัดไป ➡️", text: `/userlist ${currentPage + 1}` },
        style: "secondary",
        height: "sm",
        flex: 1,
      }] : [{
        type: "filler",
      }]),
    ],
    margin: "lg",
  };

  return {
    type: "flex",
    altText: `👥 รายการผู้ใช้ - หน้า ${currentPage}/${totalPages} (${totalUsers} คน)`,
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
              {
                type: "text",
                text: "👥",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "รายการผู้ใช้ทั้งหมด",
                    weight: "bold",
                    color: "#ffffff",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: `ALL USERS LIST | Page ${currentPage}/${totalPages}`,
                    color: "#ffffff99",
                    size: "xs",
                  },
                ],
                margin: "md",
              },
            ],
          },
          // Stats Bar
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "👤", size: "xs", flex: 0 },
                  { type: "text", text: `${totalUsers} Users`, color: "#ffffff", size: "xs", margin: "xs" },
                ],
                flex: 1,
              },
              {
                type: "box",
                layout: "baseline",
                contents: [
                  { type: "text", text: "📄", size: "xs", flex: 0 },
                  { type: "text", text: `${currentPage}/${totalPages}`, color: "#ffffff", size: "xs", margin: "xs" },
                ],
                flex: 1,
                justifyContent: "flex-end",
              },
            ],
            margin: "lg",
          },
        ],
        backgroundColor: "#3498db",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          ...userRows,
          paginationBox,
        ],
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "🔄 Refresh", text: `/userlist ${currentPage}` },
                style: "link",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "🏠 Dashboard", text: "/super" },
                style: "primary",
                color: "#2c3e50",
                height: "sm",
                flex: 1,
                margin: "xs",
              },
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

/**
 * 🧠 Knowledge Stats Flex Message
 * แสดงสถิติคลังความรู้แบบละเอียด
 */
const createKnowledgeStatsFlexMessage = (stats) => {
  // Validate and provide defaults
  const totalKnowledge = stats?.totalKnowledge || 0;
  const pendingVerification = stats?.pendingVerification || 0;
  const byCategory = stats?.byCategory || {};
  const topUsed = stats?.topUsed || [];

  // Calculate verified count
  const verifiedCount = totalKnowledge - pendingVerification;
  const verifiedPercentage = totalKnowledge > 0 ? Math.round((verifiedCount / totalKnowledge) * 100) : 0;

  // Category mapping with icons
  const categoryMap = {
    "real_world_solutions": { name: "วิธีแก้จริง", icon: "🔧" },
    "proven_parameters": { name: "พารามิเตอร์", icon: "📊" },
    "machine_specific": { name: "เฉพาะเครื่อง", icon: "🏭" },
    "expert_tips": { name: "เคล็ดลับ", icon: "💡" },
    "local_terminology": { name: "คำศัพท์", icon: "📖" },
  };

  // Build category boxes
  const categoryBoxes = Object.entries(byCategory)
    .filter(([_, count]) => count > 0)
    .map(([cat, count]) => {
      const catInfo = categoryMap[cat] || { name: cat, icon: "📁" };
      return {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: catInfo.icon,
            size: "xl",
            flex: 0,
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: catInfo.name,
                size: "sm",
                color: "#666666",
                weight: "bold",
              },
              {
                type: "text",
                text: `${count} รายการ`,
                size: "xs",
                color: "#999999",
              },
            ],
            margin: "md",
          },
          {
            type: "text",
            text: count.toString(),
            size: "xl",
            color: "#3b82f6",
            weight: "bold",
            align: "end",
            flex: 0,
          },
        ],
        margin: "md",
        paddingAll: "12px",
        backgroundColor: "#f9fafb",
        cornerRadius: "8px",
      };
    });

  // If no categories, show empty state
  if (categoryBoxes.length === 0) {
    categoryBoxes.push({
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ยังไม่มีข้อมูลในหมวดหมู่",
          size: "sm",
          color: "#999999",
          align: "center",
        },
      ],
      paddingAll: "20px",
      backgroundColor: "#f9fafb",
      cornerRadius: "8px",
    });
  }

  // Build top used items
  const topUsedBoxes = topUsed.slice(0, 3).map((item, index) => {
    const medals = ["🥇", "🥈", "🥉"];
    const problemText = item.problem || "ไม่มีชื่อ";
    const displayText = problemText.length > 30 ? problemText.substring(0, 30) + "..." : problemText;
    const useCount = item.useCount || 0;

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: medals[index],
          size: "xl",
          flex: 0,
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: displayText,
              size: "sm",
              color: "#333333",
              weight: "bold",
              wrap: true,
            },
            {
              type: "text",
              text: `ใช้งาน ${useCount} ครั้ง`,
              size: "xs",
              color: "#999999",
            },
          ],
          margin: "md",
        },
      ],
      margin: "md",
      paddingAll: "10px",
      backgroundColor: "#f0f9ff",
      cornerRadius: "6px",
    };
  });

  // If no top used, show empty state
  if (topUsedBoxes.length === 0) {
    topUsedBoxes.push({
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "ยังไม่มีข้อมูลการใช้งาน",
          size: "sm",
          color: "#999999",
          align: "center",
        },
      ],
      paddingAll: "20px",
      backgroundColor: "#f9fafb",
      cornerRadius: "8px",
    });
  }

  return {
    type: "flex",
    altText: "🧠 สถิติคลังความรู้",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🧠 คลังสมองเฉพาะถิ่น",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
          },
          {
            type: "text",
            text: "Knowledge Base Statistics",
            size: "xs",
            color: "#ffffff99",
            margin: "xs",
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#8b5cf6",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Summary Stats
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
                    text: totalKnowledge.toString(),
                    size: "xxl",
                    weight: "bold",
                    color: "#8b5cf6",
                  },
                  {
                    type: "text",
                    text: "ทั้งหมด",
                    size: "xs",
                    color: "#999999",
                  },
                ],
                flex: 1,
                backgroundColor: "#faf5ff",
                paddingAll: "15px",
                cornerRadius: "8px",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: verifiedCount.toString(),
                    size: "xxl",
                    weight: "bold",
                    color: "#10b981",
                  },
                  {
                    type: "text",
                    text: "ยืนยันแล้ว",
                    size: "xs",
                    color: "#999999",
                  },
                ],
                flex: 1,
                backgroundColor: "#f0fdf4",
                paddingAll: "15px",
                cornerRadius: "8px",
                margin: "md",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: pendingVerification.toString(),
                    size: "xxl",
                    weight: "bold",
                    color: "#f59e0b",
                  },
                  {
                    type: "text",
                    text: "รอตรวจสอบ",
                    size: "xs",
                    color: "#999999",
                  },
                ],
                flex: 1,
                backgroundColor: "#fffbeb",
                paddingAll: "15px",
                cornerRadius: "8px",
                margin: "md",
              },
            ],
          },
          // Progress Bar
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🎯 ความสมบูรณ์",
                size: "sm",
                weight: "bold",
                color: "#333333",
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [],
                    width: `${verifiedPercentage}%`,
                    backgroundColor: verifiedPercentage >= 80 ? "#10b981" : verifiedPercentage >= 50 ? "#f59e0b" : "#ef4444",
                    height: "8px",
                    cornerRadius: "4px",
                  },
                ],
                backgroundColor: "#e5e7eb",
                height: "8px",
                cornerRadius: "4px",
                margin: "sm",
              },
              {
                type: "text",
                text: `${verifiedPercentage}% ยืนยันแล้ว`,
                size: "xs",
                color: "#666666",
                align: "end",
                margin: "xs",
              },
            ],
            margin: "xl",
          },
          // Divider
          {
            type: "separator",
            margin: "xl",
          },
          // Categories Section
          {
            type: "text",
            text: "📁 แบ่งตามหมวด",
            size: "md",
            weight: "bold",
            color: "#333333",
            margin: "xl",
          },
          ...categoryBoxes,
          // Divider
          {
            type: "separator",
            margin: "xl",
          },
          // Top Used Section
          {
            type: "text",
            text: "🏆 ใช้บ่อยสุด",
            size: "md",
            weight: "bold",
            color: "#333333",
            margin: "xl",
          },
          ...topUsedBoxes,
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
                action: { type: "message", label: "🔄 รีเฟรช", text: "/knowledge" },
                style: "primary",
                color: "#8b5cf6",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "📚 จัดการ", text: "/km" },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "sm",
              },
            ],
          },
          {
            type: "button",
            action: { type: "message", label: "🏠 กลับ Dashboard", text: "/super" },
            style: "link",
            height: "sm",
            margin: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
};

/**
 * Create Knowledge Quick Add Form
 * ฟอร์มเพิ่มความรู้แบบเร็ว (Quick Form)
 */
const createKnowledgeQuickAddForm = () => {
  return {
    type: "flex",
    altText: "📝 เพิ่มความรู้ใหม่ (Quick Form)",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📝 เพิ่มความรู้ใหม่",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
          },
          {
            type: "text",
            text: "Quick Add Form - เพิ่มเร็ว",
            size: "sm",
            color: "#ffffff99",
          },
        ],
        backgroundColor: "#3b82f6",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📋 วิธีใช้งาน:",
            weight: "bold",
            size: "md",
            color: "#1f2937",
            margin: "none",
          },
          {
            type: "text",
            text: "ส่งข้อความในรูปแบบ:",
            size: "sm",
            color: "#6b7280",
            wrap: true,
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "เพิ่มความรู้",
                size: "sm",
                color: "#059669",
                weight: "bold",
              },
              {
                type: "text",
                text: "ปัญหา: [คำอธิบายปัญหา]",
                size: "xs",
                color: "#6b7280",
                margin: "sm",
              },
              {
                type: "text",
                text: "วิธีแก้: [วิธีแก้ไขปัญหา]",
                size: "xs",
                color: "#6b7280",
              },
              {
                type: "text",
                text: "หมวด: [หมวดหมู่]",
                size: "xs",
                color: "#9ca3af",
                margin: "sm",
              },
              {
                type: "text",
                text: "วัสดุ: [วัสดุ] (ถ้ามี)",
                size: "xs",
                color: "#9ca3af",
              },
              {
                type: "text",
                text: "แท็ก: [tag1, tag2] (ถ้ามี)",
                size: "xs",
                color: "#9ca3af",
              },
            ],
            backgroundColor: "#f3f4f6",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "md",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "text",
            text: "📚 หมวดหมู่ที่ใช้ได้:",
            weight: "bold",
            size: "sm",
            color: "#1f2937",
            margin: "xl",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🔧 วิธีแก้จริง",
                size: "xs",
                color: "#3b82f6",
              },
              {
                type: "text",
                text: "📊 พารามิเตอร์",
                size: "xs",
                color: "#10b981",
              },
              {
                type: "text",
                text: "🏭 เฉพาะเครื่อง",
                size: "xs",
                color: "#f59e0b",
              },
              {
                type: "text",
                text: "💡 เคล็ดลับ",
                size: "xs",
                color: "#8b5cf6",
              },
              {
                type: "text",
                text: "📖 คำศัพท์",
                size: "xs",
                color: "#ef4444",
              },
              {
                type: "text",
                text: "📚 กรณีศึกษา",
                size: "xs",
                color: "#06b6d4",
              },
              {
                type: "text",
                text: "🧪 วัสดุท้องถิ่น",
                size: "xs",
                color: "#f97316",
              },
              {
                type: "text",
                text: "🏪 ซัพพลายเออร์",
                size: "xs",
                color: "#84cc16",
              },
            ],
            spacing: "sm",
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
            action: {
              type: "message",
              label: "📋 ดูตัวอย่าง",
              text: "ดูตัวอย่างการเพิ่มความรู้",
            },
            style: "primary",
            color: "#10b981",
          },
          {
            type: "button",
            action: {
              type: "message",
              label: "📝 ฟอร์มแบบละเอียด",
              text: "/addknowledge advanced",
            },
            style: "link",
            margin: "sm",
          },
          {
            type: "text",
            text: "💡 ระบบจะตรวจสอบและจัดหมวดอัตโนมัติ",
            size: "xxs",
            color: "#9ca3af",
            align: "center",
            margin: "md",
          },
        ],
        paddingAll: "20px",
      },
    },
  };
};

/**
 * Create Knowledge Examples Flex
 * แสดงตัวอย่างการเพิ่มความรู้
 */
const createKnowledgeExamplesForm = () => {
  return {
    type: "flex",
    altText: "📋 ตัวอย่างการเพิ่มความรู้",
    contents: {
      type: "carousel",
      contents: [
        // Example 1: Plastic Problem
        {
          type: "bubble",
          size: "mega",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📋 ตัวอย่างที่ 1",
                weight: "bold",
                size: "lg",
                color: "#ffffff",
              },
              {
                type: "text",
                text: "ปัญหาพลาสติก",
                size: "sm",
                color: "#ffffff99",
              },
            ],
            backgroundColor: "#3b82f6",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "เพิ่มความรู้",
                weight: "bold",
                color: "#059669",
                size: "md",
              },
              {
                type: "text",
                text: "ปัญหา: ABS มีรอยยุบ (Sink Mark)",
                size: "sm",
                color: "#1f2937",
                wrap: true,
                margin: "md",
              },
              {
                type: "text",
                text: "วิธีแก้: เพิ่มความดัน Holding 10-20% และเพิ่มเวลา Holding 2-3 วินาที",
                size: "sm",
                color: "#1f2937",
                wrap: true,
                margin: "sm",
              },
              {
                type: "text",
                text: "หมวด: วิธีแก้จริง",
                size: "sm",
                color: "#6b7280",
                margin: "md",
              },
              {
                type: "text",
                text: "วัสดุ: ABS",
                size: "sm",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "แท็ก: sink_mark, holding_pressure",
                size: "sm",
                color: "#6b7280",
                margin: "xs",
              },
            ],
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
            paddingAll: "15px",
            margin: "md",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "clipboard",
                  clipboardText: "เพิ่มความรู้\nปัญหา: ABS มีรอยยุบ (Sink Mark)\nวิธีแก้: เพิ่มความดัน Holding 10-20% และเพิ่มเวลา Holding 2-3 วินาที\nหมวด: วิธีแก้จริง\nวัสดุ: ABS\nแท็ก: sink_mark, holding_pressure",
                  label: "📋 Copy",
                },
                style: "primary",
                color: "#10b981",
              },
            ],
            paddingAll: "15px",
          },
        },
        // Example 2: Agriculture
        {
          type: "bubble",
          size: "mega",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📋 ตัวอย่างที่ 2",
                weight: "bold",
                size: "lg",
                color: "#ffffff",
              },
              {
                type: "text",
                text: "เกษตรกรรม",
                size: "sm",
                color: "#ffffff99",
              },
            ],
            backgroundColor: "#10b981",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "เพิ่มความรู้",
                weight: "bold",
                color: "#059669",
                size: "md",
              },
              {
                type: "text",
                text: "ปัญหา: มะเขือเทศเน่าจากโรคใบจุด",
                size: "sm",
                color: "#1f2937",
                wrap: true,
                margin: "md",
              },
              {
                type: "text",
                text: "วิธีแก้: พ่นสาร Mancozeb ทุก 7 วัน ตอนเช้าหรือเย็น ขนาด 40 กรัม/น้ำ 20 ลิตร",
                size: "sm",
                color: "#1f2937",
                wrap: true,
                margin: "sm",
              },
              {
                type: "text",
                text: "หมวด: เคล็ดลับ",
                size: "sm",
                color: "#6b7280",
                margin: "md",
              },
              {
                type: "text",
                text: "แท็ก: มะเขือเทศ, โรคพืช, ใบจุด",
                size: "sm",
                color: "#6b7280",
                margin: "xs",
              },
            ],
            backgroundColor: "#f0fdf4",
            cornerRadius: "8px",
            paddingAll: "15px",
            margin: "md",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "clipboard",
                  clipboardText: "เพิ่มความรู้\nปัญหา: มะเขือเทศเน่าจากโรคใบจุด\nวิธีแก้: พ่นสาร Mancozeb ทุก 7 วัน ตอนเช้าหรือเย็น ขนาด 40 กรัม/น้ำ 20 ลิตร\nหมวด: เคล็ดลับ\nแท็ก: มะเขือเทศ, โรคพืช, ใบจุด",
                  label: "📋 Copy",
                },
                style: "primary",
                color: "#10b981",
              },
            ],
            paddingAll: "15px",
          },
        },
        // Example 3: Supplier
        {
          type: "bubble",
          size: "mega",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📋 ตัวอย่างที่ 3",
                weight: "bold",
                size: "lg",
                color: "#ffffff",
              },
              {
                type: "text",
                text: "ซัพพลายเออร์",
                size: "sm",
                color: "#ffffff99",
              },
            ],
            backgroundColor: "#f59e0b",
            paddingAll: "15px",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "เพิ่มความรู้",
                weight: "bold",
                color: "#059669",
                size: "md",
              },
              {
                type: "text",
                text: "ปัญหา: หาซื้อ ABS ราคาถูก ย่านลาดพร้าว",
                size: "sm",
                color: "#1f2937",
                wrap: true,
                margin: "md",
              },
              {
                type: "text",
                text: "วิธีแก้: ร้าน XYZ พลาสติก ราคา 65 บาท/กก. โทร 02-xxx-xxxx ส่งฟรีถ้าซื้อ > 100กก.",
                size: "sm",
                color: "#1f2937",
                wrap: true,
                margin: "sm",
              },
              {
                type: "text",
                text: "หมวด: ซัพพลายเออร์",
                size: "sm",
                color: "#6b7280",
                margin: "md",
              },
              {
                type: "text",
                text: "วัสดุ: ABS",
                size: "sm",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "แท็ก: ลาดพร้าว, กรุงเทพ, ราคาถูก",
                size: "sm",
                color: "#6b7280",
                margin: "xs",
              },
            ],
            backgroundColor: "#fffbeb",
            cornerRadius: "8px",
            paddingAll: "15px",
            margin: "md",
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "clipboard",
                  clipboardText: "เพิ่มความรู้\nปัญหา: หาซื้อ ABS ราคาถูก ย่านลาดพร้าว\nวิธีแก้: ร้าน XYZ พลาสติก ราคา 65 บาท/กก. โทร 02-xxx-xxxx ส่งฟรีถ้าซื้อ > 100กก.\nหมวด: ซัพพลายเออร์\nวัสดุ: ABS\nแท็ก: ลาดพร้าว, กรุงเทพ, ราคาถูก",
                  label: "📋 Copy",
                },
                style: "primary",
                color: "#10b981",
              },
            ],
            paddingAll: "15px",
          },
        },
      ],
    },
  };
};

/**
 * Create Detailed Knowledge Add Form
 * Shows comprehensive form with all available fields
 */
const createKnowledgeDetailedForm = () => {
  return {
    type: "flex",
    altText: "📋 ฟอร์มเพิ่มความรู้แบบละเอียด",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📋 ฟอร์มเพิ่มความรู้",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
          },
          {
            type: "text",
            text: "แบบละเอียด (รองรับทุกฟิลด์)",
            size: "sm",
            color: "#e0e7ff",
            margin: "xs",
          },
        ],
        backgroundColor: "#6366f1",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📝 รูปแบบการใช้งาน",
            weight: "bold",
            size: "lg",
            color: "#1f2937",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "เพิ่มความรู้",
                size: "sm",
                color: "#4b5563",
                weight: "bold",
              },
              {
                type: "text",
                text: "ปัญหา: [คำถาม/ปัญหาที่พบ]",
                size: "sm",
                color: "#4b5563",
                margin: "xs",
              },
              {
                type: "text",
                text: "วิธีแก้: [วิธีแก้ปัญหา/คำตอบ]",
                size: "sm",
                color: "#4b5563",
                margin: "xs",
              },
              {
                type: "text",
                text: "หมวด: [หมวดหมู่] (optional)",
                size: "sm",
                color: "#9ca3af",
                margin: "xs",
              },
              {
                type: "text",
                text: "วัสดุ: [วัสดุที่ใช้] (optional)",
                size: "sm",
                color: "#9ca3af",
                margin: "xs",
              },
              {
                type: "text",
                text: "แท็ก: [แท็ก1, แท็ก2] (optional)",
                size: "sm",
                color: "#9ca3af",
                margin: "xs",
              },
            ],
            backgroundColor: "#f3f4f6",
            cornerRadius: "8px",
            paddingAll: "15px",
            margin: "md",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "📁 หมวดหมู่ที่รองรับ",
            weight: "bold",
            size: "md",
            color: "#1f2937",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🔧 พลาสติก - วิธีแก้จริง",
                size: "xs",
                color: "#6b7280",
              },
              {
                type: "text",
                text: "⚙️ พารามิเตอร์ - proven_parameters",
                size: "xs",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "🏭 เฉพาะเครื่อง - machine_specific",
                size: "xs",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "💡 เคล็ดลับ - expert_tips",
                size: "xs",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "📖 คำศัพท์ - local_terminology",
                size: "xs",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "📚 กรณีศึกษา - case_studies",
                size: "xs",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "🧪 วัสดุท้องถิ่น - local_materials",
                size: "xs",
                color: "#6b7280",
                margin: "xs",
              },
              {
                type: "text",
                text: "🏪 ซัพพลายเออร์ - supplier_info",
                size: "xs",
                color: "#6b7280",
                margin: "xs",
              },
            ],
            backgroundColor: "#fef3c7",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "✅ Verify", text: "verify ความรู้" },
                style: "primary",
                color: "#10b981",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "📊 Stats", text: "/hybridstats" },
                style: "link",
                height: "sm",
                flex: 1,
                margin: "xs",
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "12px",
      },
    },
  };
};

// =================== 🛠️ SYSTEM MANAGEMENT FLEX MESSAGES ===================

/**
 * System Cleanup Result Flex
 * แสดงผลการทำความสะอาดระบบแบบละเอียด
 */
const createSystemCleanupFlex = (cleanupResult) => {
  const {
    deletedCount = 0,
    scope = "hybrid_usage_logs > 30 days",
    performedAt = new Date(),
    estimatedSpaceSaved = 0,
    categories = {},
  } = cleanupResult || {};

  // คำนวณขนาดโดยประมาณ (แต่ละ log ~1KB)
  const spaceSavedMB = (deletedCount * 1024 / 1024 / 1024).toFixed(2);

  return {
    type: "flex",
    altText: `🗑️ Cleanup Complete: ${deletedCount} items deleted`,
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
              { type: "text", text: "🗑️", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "System Cleanup", size: "xl", weight: "bold", color: "#ffffff" },
                  { type: "text", text: "ทำความสะอาดระบบสำเร็จ", size: "xs", color: "#e0e7ff", margin: "xs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#10b981",
          endColor: "#059669",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Summary Stats
          { type: "text", text: "📊 Cleanup Summary", size: "md", weight: "bold", color: "#1f2937" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: deletedCount.toString(), size: "xxl", weight: "bold", color: "#ef4444", align: "center" },
                  { type: "text", text: "Items Deleted", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                backgroundColor: "#fef2f2",
                cornerRadius: "12px",
                paddingAll: "15px",
                flex: 1,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: spaceSavedMB, size: "xxl", weight: "bold", color: "#10b981", align: "center" },
                  { type: "text", text: "MB Saved", size: "xs", color: "#6b7280", align: "center", margin: "xs" },
                ],
                backgroundColor: "#d1fae5",
                cornerRadius: "12px",
                paddingAll: "15px",
                flex: 1,
                margin: "sm",
              },
            ],
            margin: "sm",
          },
          // Cleanup Details
          { type: "separator", margin: "lg" },
          { type: "text", text: "🎯 Cleanup Scope", size: "md", weight: "bold", color: "#1f2937", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "📦", size: "sm", flex: 0 },
                  { type: "text", text: scope, size: "xs", color: "#4b5563", wrap: true, margin: "sm", flex: 1 },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "⏰", size: "sm", flex: 0 },
                  { type: "text", text: performedAt.toLocaleString("th-TH"), size: "xs", color: "#4b5563", margin: "sm", flex: 1 },
                ],
                margin: "sm",
              },
            ],
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm",
          },
          // Performance Impact
          { type: "separator", margin: "lg" },
          { type: "text", text: "⚡ Performance Impact", size: "md", weight: "bold", color: "#1f2937", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "sm", flex: 0 },
                  { type: "text", text: "Database size reduced", size: "xs", color: "#059669", margin: "sm" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "sm", flex: 0 },
                  { type: "text", text: "Query performance improved", size: "xs", color: "#059669", margin: "sm" },
                ],
                margin: "xs",
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "✅", size: "sm", flex: 0 },
                  { type: "text", text: "Backup time reduced", size: "xs", color: "#059669", margin: "sm" },
                ],
                margin: "xs",
              },
            ],
            backgroundColor: "#ecfdf5",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm",
          },
          // Next Cleanup
          {
            type: "box",
            layout: "baseline",
            contents: [
              { type: "text", text: "💡", size: "sm", flex: 0 },
              { type: "text", text: "แนะนำทำ Cleanup ทุก 30 วัน", size: "xs", color: "#6b7280", margin: "sm", wrap: true },
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
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "System Logs", text: "/system logs" },
                style: "primary",
                color: "#6366f1",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "Dashboard", text: "/superadmin enhanced" },
                style: "link",
                height: "sm",
                flex: 1,
                margin: "xs",
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
};

/**
 * System Logs Flex
 * แสดง System Logs แบบ Timeline พร้อมกรอง
 */
const createSystemLogsFlex = (logsData) => {
  const {
    logs = [],
    stats = { total: 0, byType: {} },
    showFull = false,
  } = logsData || {};

  // Group logs by type with icons
  const logTypeInfo = {
    cleanup: { icon: "🗑️", color: "#10b981", name: "Cleanup" },
    backup: { icon: "💾", color: "#3b82f6", name: "Backup" },
    deployment: { icon: "🚀", color: "#8b5cf6", name: "Deploy" },
    error: { icon: "❌", color: "#ef4444", name: "Error" },
    warning: { icon: "⚠️", color: "#f59e0b", name: "Warning" },
    info: { icon: "ℹ️", color: "#6b7280", name: "Info" },
    user_action: { icon: "👤", color: "#06b6d4", name: "User" },
  };

  // Create log items (limit to 8 for display)
  const displayLogs = showFull ? logs : logs.slice(0, 8);
  const logItems = displayLogs.map((log, index) => {
    const typeInfo = logTypeInfo[log.type] || logTypeInfo.info;
    const time = log.performedAt ? new Date(log.performedAt).toLocaleString("th-TH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) : "N/A";

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        // Timeline indicator
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [],
              width: "12px",
              height: "12px",
              backgroundColor: typeInfo.color,
              cornerRadius: "6px",
            },
            ...(index < displayLogs.length - 1 ? [{
              type: "box",
              layout: "vertical",
              contents: [],
              width: "2px",
              height: "40px",
              backgroundColor: "#e5e7eb",
              offsetStart: "5px",
            }] : []),
          ],
          flex: 0,
          paddingEnd: "12px",
        },
        // Log content
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: typeInfo.icon, size: "sm", flex: 0 },
                { type: "text", text: typeInfo.name, size: "sm", weight: "bold", color: "#1f2937", margin: "xs", flex: 0 },
                { type: "text", text: time, size: "xxs", color: "#9ca3af", align: "end" },
              ],
            },
            { type: "text", text: log.scope || log.description || "No details", size: "xs", color: "#6b7280", wrap: true, margin: "xs" },
            ...(log.itemsDeleted ? [{
              type: "text",
              text: `📊 ${log.itemsDeleted} items affected`,
              size: "xxs",
              color: "#6b7280",
              margin: "xs",
            }] : []),
          ],
          flex: 1,
          paddingBottom: "md",
        },
      ],
      margin: index === 0 ? "none" : "xs",
    };
  });

  // Stats by type
  const typeStats = Object.entries(stats.byType || {}).map(([type, count]) => {
    const typeInfo = logTypeInfo[type] || logTypeInfo.info;
    return {
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: typeInfo.icon, size: "sm", flex: 0 },
        { type: "text", text: typeInfo.name, size: "xs", color: "#6b7280", margin: "xs", flex: 1 },
        { type: "text", text: count.toString(), size: "xs", weight: "bold", color: typeInfo.color, align: "end" },
      ],
      margin: "xs",
    };
  });

  return {
    type: "flex",
    altText: `📋 System Logs (${logs.length} entries)`,
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
              { type: "text", text: "📋", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "System Logs", size: "xl", weight: "bold", color: "#ffffff" },
                  { type: "text", text: `${logs.length} entries tracked`, size: "xs", color: "#e0e7ff", margin: "xs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#6366f1",
          endColor: "#8b5cf6",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Stats Summary
          { type: "text", text: "📊 Activity Summary", size: "md", weight: "bold", color: "#1f2937" },
          {
            type: "box",
            layout: "vertical",
            contents: typeStats.length > 0 ? typeStats : [
              { type: "text", text: "No activity recorded", size: "xs", color: "#9ca3af", align: "center" },
            ],
            backgroundColor: "#f9fafb",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm",
          },
          // Timeline
          { type: "separator", margin: "lg" },
          { type: "text", text: "⏰ Timeline", size: "md", weight: "bold", color: "#1f2937", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: logItems.length > 0 ? logItems : [
              {
                type: "text",
                text: "📭 No logs available",
                size: "sm",
                color: "#9ca3af",
                align: "center",
                margin: "md",
              },
            ],
            margin: "sm",
          },
          // Show more indicator
          ...(logs.length > 8 && !showFull ? [{
            type: "box",
            layout: "baseline",
            contents: [
              { type: "text", text: "💡", size: "sm", flex: 0 },
              { type: "text", text: `แสดง 8/${logs.length} รายการ - พิมพ์ '/system logs full' เพื่อดูทั้งหมด`, size: "xs", color: "#6b7280", margin: "sm", wrap: true },
            ],
            margin: "lg",
          }] : []),
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "View Full Logs", text: "/system logs full" },
                style: "primary",
                color: "#6366f1",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "Cleanup Logs", text: "/system cleanup" },
                style: "link",
                height: "sm",
                flex: 1,
                margin: "xs",
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
};

/**
 * AI Prompts Flex
 * แสดง AI Prompts พร้อม Preview และ Management
 */
const createAIPromptsFlex = (promptsData) => {
  const {
    prompts = [],
    stats = { total: 0, byType: {}, avgLength: 0 },
  } = promptsData || {};

  // Create prompt cards
  const promptCards = prompts.slice(0, 5).map((prompt, index) => {
    const typeColors = {
      system: "#6366f1",
      user: "#10b981",
      assistant: "#f59e0b",
      general: "#6b7280",
    };

    const typeColor = typeColors[prompt.type] || typeColors.general;
    const preview = (prompt.prompt || "").substring(0, 100) + (prompt.prompt?.length > 100 ? "..." : "");
    const updatedDate = prompt.updatedAt ? new Date(prompt.updatedAt).toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
    }) : "N/A";

    return {
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
                { type: "text", text: prompt.id || `Prompt ${index + 1}`, size: "sm", weight: "bold", color: "#1f2937" },
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: prompt.type || "general",
                      size: "xxs",
                      color: "#ffffff",
                      backgroundColor: typeColor,
                      paddingAll: "4px",
                      cornerRadius: "4px",
                    },
                    { type: "text", text: `${(prompt.prompt || "").length} chars`, size: "xxs", color: "#9ca3af", margin: "sm" },
                  ],
                  margin: "xs",
                },
              ],
              flex: 1,
            },
            { type: "text", text: updatedDate, size: "xxs", color: "#9ca3af", align: "end", flex: 0 },
          ],
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: preview, size: "xs", color: "#6b7280", wrap: true },
          ],
          backgroundColor: "#f9fafb",
          cornerRadius: "4px",
          paddingAll: "8px",
          margin: "sm",
        },
      ],
      backgroundColor: "#ffffff",
      cornerRadius: "8px",
      paddingAll: "12px",
      borderWidth: "1px",
      borderColor: "#e5e7eb",
      margin: index === 0 ? "none" : "sm",
    };
  });

  // Type distribution
  const typeDistribution = Object.entries(stats.byType || {}).map(([type, count]) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: type, size: "xs", color: "#6b7280", flex: 1 },
      {
        type: "box",
        layout: "vertical",
        contents: [],
        width: `${Math.min((count / stats.total) * 100, 100)}%`,
        height: "6px",
        backgroundColor: "#6366f1",
        cornerRadius: "3px",
        flex: 0,
      },
      { type: "text", text: count.toString(), size: "xs", weight: "bold", color: "#1f2937", align: "end", flex: 0, margin: "sm" },
    ],
    margin: "xs",
  }));

  return {
    type: "flex",
    altText: `📝 AI Prompts (${prompts.length} prompts)`,
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
              { type: "text", text: "📝", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "AI Prompts", size: "xl", weight: "bold", color: "#ffffff" },
                  { type: "text", text: `${prompts.length} prompts • Avg ${stats.avgLength} chars`, size: "xs", color: "#e0e7ff", margin: "xs" },
                ],
                margin: "md",
              },
            ],
          },
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#f59e0b",
          endColor: "#d97706",
        },
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Stats
          { type: "text", text: "📊 Distribution by Type", size: "md", weight: "bold", color: "#1f2937" },
          {
            type: "box",
            layout: "vertical",
            contents: typeDistribution.length > 0 ? typeDistribution : [
              { type: "text", text: "No type data", size: "xs", color: "#9ca3af", align: "center" },
            ],
            backgroundColor: "#fef3c7",
            cornerRadius: "8px",
            paddingAll: "12px",
            margin: "sm",
          },
          // Prompts List
          { type: "separator", margin: "lg" },
          { type: "text", text: "📄 Recent Prompts", size: "md", weight: "bold", color: "#1f2937", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: promptCards.length > 0 ? promptCards : [
              {
                type: "text",
                text: "📭 No prompts available",
                size: "sm",
                color: "#9ca3af",
                align: "center",
                margin: "md",
              },
            ],
            margin: "sm",
          },
          // Tips
          {
            type: "box",
            layout: "baseline",
            contents: [
              { type: "text", text: "💡", size: "sm", flex: 0 },
              { type: "text", text: "พิมพ์ '/ai prompt view [id]' เพื่อดู prompt แบบเต็ม", size: "xs", color: "#6b7280", margin: "sm", wrap: true },
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
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "AI Config", text: "/ai config" },
                style: "primary",
                color: "#f59e0b",
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                action: { type: "message", label: "AI Strategy", text: "/ai strategy" },
                style: "link",
                height: "sm",
                flex: 1,
                margin: "xs",
              },
            ],
            margin: "sm",
          },
        ],
        paddingAll: "10px",
      },
    },
  };
};

/**
 * AI Analytics Flex
 * แสดงสถิติการทำงานของ AI และ Hybrid System
 */
const createAIAnalyticsFlex = (stats) => {
  const {
    total = 0,
    successRate = 0,
    avgConfidence = 0,
    avgResponseTime = 0,
    byStrategy = {
      local_primary: 0,
      balanced_hybrid: 0,
      ai_primary: 0,
      best_effort: 0,
    },
  } = stats || {};

  // Calculate percentages for bars
  const getPercent = (val) => total > 0 ? Math.round((val / total) * 100) : 0;

  const strategies = [
    { key: "local_primary", name: "Local First", color: "#10b981", icon: "⚡" },
    { key: "balanced_hybrid", name: "Balanced", color: "#3b82f6", icon: "⚖️" },
    { key: "ai_primary", name: "AI Primary", color: "#8b5cf6", icon: "🤖" },
    { key: "best_effort", name: "Best Effort", color: "#f59e0b", icon: "🤞" },
  ];

  const strategyBars = strategies.map(s => {
    const count = byStrategy[s.key] || 0;
    const percent = getPercent(count);

    return {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: `${s.icon} ${s.name}`, size: "xs", color: "#4b5563", flex: 1 },
            { type: "text", text: `${count} (${percent}%)`, size: "xs", color: "#1f2937", weight: "bold", align: "end" }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [],
              width: `${Math.max(percent, 1)}%`,
              height: "6px",
              backgroundColor: s.color,
              cornerRadius: "3px"
            }
          ],
          backgroundColor: "#f3f4f6",
          height: "6px",
          cornerRadius: "3px",
          margin: "xs"
        }
      ],
      margin: "sm"
    };
  });

  return {
    type: "flex",
    altText: `🤖 AI Analytics: ${successRate}% Success`,
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
              { type: "text", text: "🤖", size: "3xl", flex: 0 },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "AI Analytics", size: "xl", weight: "bold", color: "#ffffff" },
                  { type: "text", text: `Last 500 Queries Analysis`, size: "xs", color: "#e0e7ff", margin: "xs" }
                ],
                margin: "md"
              }
            ]
          }
        ],
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#8b5cf6",
          endColor: "#6366f1"
        },
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Key Metrics Grid
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Success Rate", size: "xs", color: "#6b7280", align: "center" },
                  { type: "text", text: `${successRate}%`, size: "xl", weight: "bold", color: "#10b981", align: "center" }
                ],
                flex: 1
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Avg Conf.", size: "xs", color: "#6b7280", align: "center" },
                  { type: "text", text: `${avgConfidence}%`, size: "xl", weight: "bold", color: "#3b82f6", align: "center" }
                ],
                flex: 1
              }
            ]
          },
          { type: "separator", margin: "lg" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Total Queries", size: "xs", color: "#6b7280", align: "center" },
                  { type: "text", text: `${total}`, size: "lg", weight: "bold", color: "#1f2937", align: "center" }
                ],
                flex: 1
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  { type: "text", text: "Avg Response", size: "xs", color: "#6b7280", align: "center" },
                  { type: "text", text: `${avgResponseTime}ms`, size: "lg", weight: "bold", color: "#f59e0b", align: "center" }
                ],
                flex: 1
              }
            ],
            margin: "lg"
          },
          // Strategy Distribution
          { type: "separator", margin: "lg" },
          { type: "text", text: "🎯 Strategy Distribution", size: "md", weight: "bold", color: "#1f2937", margin: "lg" },
          {
            type: "box",
            layout: "vertical",
            contents: strategyBars,
            margin: "md"
          }
        ],
        paddingAll: "20px"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "separator" },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                action: { type: "message", label: "AI Config", text: "/ai config" },
                style: "primary",
                color: "#8b5cf6",
                height: "sm",
                flex: 1
              },
              {
                type: "button",
                action: { type: "message", label: "Refresh", text: "/analytics ai" },
                style: "secondary",
                height: "sm",
                flex: 1,
                margin: "xs"
              }
            ],
            margin: "sm"
          }
        ],
        paddingAll: "10px"
      }
    }
  };
};

module.exports = {
  createAdminStatsMessage,
  createDailySummaryMessage,
  createTopUsersMessage,
  createPremiumReportMessage,
  createUserInfoMessage,
  createRecentUsersMessage,
  createRecentUsersMessageSimple,
  createPendingItemsMessage,
  createSimpleMessage,
  sanitizeTextForLine,
  // Admin Control Panel
  createAdminControlPanelMessage,
  createUserDetailMessage,
  createBanConfirmationMessage,
  createTestModeMessage,
  createOrgListMessage,
  // Admin Testing Dashboard
  createAdminTestDashboard,
  createQuickTestMenu,
  // Knowledge Management
  createKnowledgeListFlex,
  createKnowledgeVerifyFlex,
  createHybridTestFlex,
  createKnowledgeOptimizeFlex,
  createKnowledgeMenuFlex,
  createEmptyKnowledgeFlex,
  createKnowledgeStatsFlexMessage,
  createHybridStatsFlexMessage,
  // ⭐ NEW: Knowledge Input Forms
  createKnowledgeQuickAddForm,
  createKnowledgeDetailedForm,
  createKnowledgeExamplesForm,
  // ⭐ NEW: Admin Super Dashboard - All-in-One
  createAdminSuperDashboard,
  // ⭐ NEW: Enhanced User Control
  createUserControlPanel,
  createUserListFlex,
  // ⭐ NEW: System Management Flex
  createSystemCleanupFlex,
  createSystemLogsFlex,
  createAIPromptsFlex,
  createAIAnalyticsFlex,
};


