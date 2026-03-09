/**
 * 📒 Memory Note System - ระบบสมุดบันทึกส่วนตัว
 * สำหรับ WiT AI LINE Bot
 *
 * Features:
 * - บันทึกข้อความ/เหตุการณ์/นัดหมาย
 * - เรียกดูตามวันที่
 * - Flex Message สวยงาม
 * - ค้นหาบันทึก
 * - แจ้งเตือน (future)
 */

const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {createModernNoteSavedFlex, createModernMemoryMenuFlex} = require("./memoryFlexEnhanced");

// =====================================================
// 📅 DATE/TIME UTILITIES
// =====================================================

/**
 * แปลงวันที่ไทย (12/12/2568) เป็น Date object
 */
function parseThaiDate(dateStr) {
  try {
    // รูปแบบ: DD/MM/YYYY (ปี พ.ศ.)
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // 12/12/2568
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // 12-12-2568
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/, // 12.12.2568
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
        let year = parseInt(match[3]);

        // แปลง พ.ศ. เป็น ค.ศ. ถ้าปี > 2400
        if (year > 2400) {
          year -= 543;
        }

        return new Date(year, month, day);
      }
    }

    // Try parsing as-is
    return new Date(dateStr);
  } catch (error) {
    console.error("Error parsing Thai date:", error);
    return null;
  }
}

/**
 * แปลง Date object เป็นวันที่ไทย
 */
function formatThaiDate(date, includeYear = true) {
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  const thaiMonthsFull = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear() + 543; // Convert to Buddhist Era
  const dayOfWeek = date.getDay();

  if (includeYear) {
    return `วัน${thaiDays[dayOfWeek]}ที่ ${day} ${thaiMonthsFull[month]} ${year}`;
  }
  return `${day} ${thaiMonths[month]}`;
}

/**
 * แปลงวันที่เป็น key สำหรับ Firestore (YYYY-MM-DD)
 */
function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * แยกวันที่และเวลาจากข้อความ
 */
function extractDateTime(text) {
  const dateTime = {
    date: new Date(),
    time: null,
    hasDate: false,
    hasTime: false,
  };

  // Extract time (HH:MM or HH.MM)
  const timePattern = /(\d{1,2})[:\.](\d{2})(?:\s*น\.?)?/;
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    dateTime.time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
    dateTime.hasTime = true;
  }

  // Extract date (various formats)
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // 12/12/2568
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // 12-12-2568
    /(\d{1,2})\/(\d{1,2})/, // 12/12 (current year)
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      let year = match[3] ? parseInt(match[3]) : new Date().getFullYear();

      // Convert Buddhist Era to Christian Era
      if (year > 2400) {
        year -= 543;
      }

      dateTime.date = new Date(year, month, day);
      dateTime.hasDate = true;
      break;
    }
  }

  // Check for relative dates
  const lowerText = text.toLowerCase();
  if (lowerText.includes("วันนี้") || lowerText.includes("today")) {
    dateTime.date = new Date();
    dateTime.hasDate = true;
  } else if (lowerText.includes("พรุ่งนี้") || lowerText.includes("tomorrow")) {
    dateTime.date = new Date();
    dateTime.date.setDate(dateTime.date.getDate() + 1);
    dateTime.hasDate = true;
  } else if (lowerText.includes("มะรืน")) {
    dateTime.date = new Date();
    dateTime.date.setDate(dateTime.date.getDate() + 2);
    dateTime.hasDate = true;
  } else if (lowerText.includes("เมื่อวาน") || lowerText.includes("yesterday")) {
    dateTime.date = new Date();
    dateTime.date.setDate(dateTime.date.getDate() - 1);
    dateTime.hasDate = true;
  }

  return dateTime;
}

// =====================================================
// 📝 NOTE CATEGORIES
// =====================================================

const NOTE_CATEGORIES = {
  meeting: {emoji: "📅", name: "นัดประชุม", color: "#3498db"},
  appointment: {emoji: "🗓️", name: "นัดหมาย", color: "#9b59b6"},
  reminder: {emoji: "⏰", name: "เตือนความจำ", color: "#e74c3c"},
  task: {emoji: "✅", name: "งานที่ต้องทำ", color: "#27ae60"},
  idea: {emoji: "💡", name: "ไอเดีย", color: "#f39c12"},
  note: {emoji: "📝", name: "บันทึก", color: "#1abc9c"},
  event: {emoji: "🎉", name: "กิจกรรม", color: "#e91e63"},
  shopping: {emoji: "🛒", name: "รายการซื้อ", color: "#ff9800"},
  health: {emoji: "💊", name: "สุขภาพ", color: "#00bcd4"},
  work: {emoji: "💼", name: "งาน", color: "#607d8b"},
  personal: {emoji: "👤", name: "ส่วนตัว", color: "#795548"},
  finance: {emoji: "💰", name: "การเงิน", color: "#4caf50"},
};

/**
 * ตรวจจับหมวดหมู่จากข้อความ
 */
function detectCategory(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("ประชุม") || lowerText.includes("meeting")) {
    return "meeting";
  }
  if (lowerText.includes("นัด") || lowerText.includes("พบ")) {
    return "appointment";
  }
  if (lowerText.includes("เตือน") || lowerText.includes("reminder") || lowerText.includes("อย่าลืม")) {
    return "reminder";
  }
  if (lowerText.includes("ทำ") || lowerText.includes("task") || lowerText.includes("งาน")) {
    return "task";
  }
  if (lowerText.includes("ไอเดีย") || lowerText.includes("idea") || lowerText.includes("คิด")) {
    return "idea";
  }
  if (lowerText.includes("กิจกรรม") || lowerText.includes("event") || lowerText.includes("งานเลี้ยง")) {
    return "event";
  }
  if (lowerText.includes("ซื้อ") || lowerText.includes("shopping") || lowerText.includes("รายการ")) {
    return "shopping";
  }
  if (lowerText.includes("หมอ") || lowerText.includes("ยา") || lowerText.includes("สุขภาพ")) {
    return "health";
  }
  if (lowerText.includes("เงิน") || lowerText.includes("จ่าย") || lowerText.includes("โอน")) {
    return "finance";
  }

  return "note"; // default
}

// =====================================================
// 💾 DATABASE OPERATIONS
// =====================================================

/**
 * บันทึก Note ลง Firestore
 */
async function saveNote(userId, noteData) {
  try {
    const db = getFirestore();
    const noteRef = db.collection("user_notes").doc(userId).collection("notes");

    const note = {
      content: noteData.content,
      category: noteData.category || "note",
      date: noteData.date,
      dateKey: dateToKey(noteData.date),
      time: noteData.time || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isCompleted: false,
      priority: noteData.priority || "normal", // low, normal, high
      tags: noteData.tags || [],
    };

    const docRef = await noteRef.add(note);
    return {success: true, noteId: docRef.id, note};
  } catch (error) {
    console.error("Error saving note:", error);
    return {success: false, error: error.message};
  }
}

/**
 * ดึง Notes ตามวันที่
 */
async function getNotesByDate(userId, date) {
  try {
    const db = getFirestore();
    const dateKey = dateToKey(date);

    const snapshot = await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .where("dateKey", "==", dateKey)
        .orderBy("createdAt", "asc")
        .get();

    const notes = [];
    snapshot.forEach((doc) => {
      notes.push({id: doc.id, ...doc.data()});
    });

    return {success: true, notes, date: dateKey};
  } catch (error) {
    console.error("Error getting notes:", error);
    return {success: false, error: error.message, notes: []};
  }
}

/**
 * ดึง Notes ตามช่วงวันที่
 */
async function getNotesByDateRange(userId, startDate, endDate) {
  try {
    const db = getFirestore();
    const startKey = dateToKey(startDate);
    const endKey = dateToKey(endDate);

    const snapshot = await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .where("dateKey", ">=", startKey)
        .where("dateKey", "<=", endKey)
        .orderBy("dateKey", "asc")
        .get();

    const notes = [];
    snapshot.forEach((doc) => {
      notes.push({id: doc.id, ...doc.data()});
    });

    return {success: true, notes};
  } catch (error) {
    console.error("Error getting notes by range:", error);
    return {success: false, error: error.message, notes: []};
  }
}

/**
 * ดึง Notes ล่าสุด
 */
async function getRecentNotes(userId, limit = 10) {
  try {
    const db = getFirestore();

    const snapshot = await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    const notes = [];
    snapshot.forEach((doc) => {
      notes.push({id: doc.id, ...doc.data()});
    });

    return {success: true, notes};
  } catch (error) {
    console.error("Error getting recent notes:", error);
    return {success: false, error: error.message, notes: []};
  }
}

/**
 * ค้นหา Notes
 */
async function searchNotes(userId, keyword) {
  try {
    const db = getFirestore();

    // Firestore doesn't support full-text search, so we get all and filter
    const snapshot = await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    const notes = [];
    const lowerKeyword = keyword.toLowerCase();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.content && data.content.toLowerCase().includes(lowerKeyword)) {
        notes.push({id: doc.id, ...data});
      }
    });

    return {success: true, notes};
  } catch (error) {
    console.error("Error searching notes:", error);
    return {success: false, error: error.message, notes: []};
  }
}

/**
 * ลบ Note
 */
async function deleteNote(userId, noteId) {
  try {
    const db = getFirestore();
    await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .doc(noteId)
        .delete();

    return {success: true};
  } catch (error) {
    console.error("Error deleting note:", error);
    return {success: false, error: error.message};
  }
}

/**
 * อัปเดต Note
 */
async function updateNote(userId, noteId, updates) {
  try {
    const db = getFirestore();
    await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .doc(noteId)
        .update({
          ...updates,
          updatedAt: FieldValue.serverTimestamp(),
        });

    return {success: true};
  } catch (error) {
    console.error("Error updating note:", error);
    return {success: false, error: error.message};
  }
}

/**
 * Toggle complete status
 */
async function toggleNoteComplete(userId, noteId) {
  try {
    const db = getFirestore();
    const noteRef = db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .doc(noteId);

    const doc = await noteRef.get();
    if (!doc.exists) {
      return {success: false, error: "Note not found"};
    }

    const currentStatus = doc.data().isCompleted || false;
    await noteRef.update({
      isCompleted: !currentStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {success: true, isCompleted: !currentStatus};
  } catch (error) {
    console.error("Error toggling note:", error);
    return {success: false, error: error.message};
  }
}

// =====================================================
// 🎨 FLEX MESSAGE GENERATORS
// =====================================================

/**
 * สร้าง Flex Message สำหรับบันทึกสำเร็จ
 */
function createNoteSavedFlex(note, userName = "User") {
  const category = NOTE_CATEGORIES[note.category] || NOTE_CATEGORIES.note;
  const dateStr = formatThaiDate(note.date, true);
  const timeStr = note.time ? ` เวลา ${note.time} น.` : "";

  return {
    type: "flex",
    altText: `📒 บันทึกสำเร็จ: ${note.content.substring(0, 30)}...`,
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
                text: "📒",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "บันทึกสำเร็จ!",
                    weight: "bold",
                    color: "#ffffff",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: "NOTE SAVED",
                    color: "#ffffffaa",
                    size: "xs",
                  },
                ],
                margin: "lg",
              },
            ],
          },
        ],
        backgroundColor: "#2ecc71",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Category Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: category.emoji,
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: category.name,
                    size: "sm",
                    color: "#ffffff",
                    margin: "sm",
                    weight: "bold",
                  },
                ],
                backgroundColor: category.color,
                paddingAll: "8px",
                cornerRadius: "20px",
                width: "auto",
              },
              {
                type: "filler",
              },
            ],
          },
          // Content
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "📝 เนื้อหา",
                size: "xs",
                color: "#888888",
                weight: "bold",
              },
              {
                type: "text",
                text: note.content,
                size: "md",
                color: "#333333",
                wrap: true,
                margin: "sm",
              },
            ],
          },
          {
            type: "separator",
            margin: "lg",
          },
          // Date & Time
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📅",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: dateStr,
                    size: "sm",
                    color: "#555555",
                    margin: "md",
                  },
                ],
              },
              note.time ? {
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "⏰",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: `${note.time} น.`,
                    size: "sm",
                    color: "#555555",
                    margin: "md",
                  },
                ],
              } : {type: "filler", flex: 0},
            ].filter((item) => item.type !== "filler" || item.flex !== 0),
          },
          // Quick Actions Info
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            backgroundColor: "#f8f9fa",
            cornerRadius: "10px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "💡 คำสั่งเรียกดูบันทึก",
                size: "xs",
                color: "#666666",
                weight: "bold",
              },
              {
                type: "text",
                text: "/memory วันนี้",
                size: "xs",
                color: "#888888",
                margin: "sm",
              },
              {
                type: "text",
                text: "/memory 12/12/2568",
                size: "xs",
                color: "#888888",
              },
            ],
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#2ecc71",
            action: {
              type: "message",
              label: "📋 ดูบันทึกวันนี้",
              text: "/memory วันนี้",
            },
            height: "sm",
            flex: 1,
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "message",
              label: "➕ เพิ่มบันทึก",
              text: "/note",
            },
            height: "sm",
            flex: 1,
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับแสดงรายการบันทึก
 */
function createNotesListFlex(notes, dateStr, userName = "User") {
  if (!notes || notes.length === 0) {
    return createEmptyNotesFlex(dateStr);
  }

  // Group notes by category
  const noteItems = notes.map((note, index) => {
    const category = NOTE_CATEGORIES[note.category] || NOTE_CATEGORIES.note;
    const timeStr = note.time ? `${note.time} น.` : "";
    const completedIcon = note.isCompleted ? "✅" : "⬜";

    return {
      type: "box",
      layout: "horizontal",
      contents: [
        // Completion checkbox
        {
          type: "text",
          text: completedIcon,
          size: "lg",
          flex: 0,
          action: {
            type: "postback",
            label: "Toggle",
            data: `action=toggle_note&noteId=${note.id}`,
          },
        },
        // Note content - Tappable for details
        {
          type: "box",
          layout: "vertical",
          flex: 1,
          margin: "md",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: category.emoji,
                  size: "sm",
                  flex: 0,
                },
                {
                  type: "text",
                  text: note.content.length > 40 ? note.content.substring(0, 40) + "..." : note.content,
                  size: "sm",
                  color: note.isCompleted ? "#999999" : "#333333",
                  decoration: note.isCompleted ? "line-through" : "none",
                  flex: 1,
                  margin: "sm",
                  wrap: true,
                },
              ],
            },
            timeStr ? {
              type: "text",
              text: `⏰ ${timeStr}`,
              size: "xs",
              color: "#888888",
              margin: "sm",
            } : null,
          ].filter(Boolean),
          action: {
            type: "postback",
            label: "ดูรายละเอียด",
            data: `action=view_note&noteId=${note.id}`,
          },
        },
        // More actions button
        {
          type: "text",
          text: "⋮",
          size: "xl",
          flex: 0,
          color: "#999999",
          action: {
            type: "postback",
            label: "เพิ่มเติม",
            data: `action=note_actions&noteId=${note.id}`,
          },
        },
      ],
      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
      paddingAll: "12px",
      cornerRadius: "8px",
      margin: index === 0 ? "none" : "sm",
    };
  });

  // Calculate stats
  const completedCount = notes.filter((n) => n.isCompleted).length;
  const totalCount = notes.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return {
    type: "flex",
    altText: `📒 บันทึก ${dateStr} (${totalCount} รายการ)`,
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
                text: "📒",
                size: "xxl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "สมุดบันทึก",
                    weight: "bold",
                    color: "#ffffff",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: dateStr,
                    color: "#ffffffcc",
                    size: "sm",
                  },
                ],
                margin: "lg",
              },
            ],
          },
          // Progress bar
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: `เสร็จแล้ว ${completedCount}/${totalCount}`,
                    size: "xs",
                    color: "#ffffffcc",
                  },
                  {
                    type: "text",
                    text: `${progressPercent}%`,
                    size: "xs",
                    color: "#ffffff",
                    weight: "bold",
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [],
                    backgroundColor: "#ffffff",
                    height: "6px",
                    width: `${Math.max(5, progressPercent)}%`,
                    cornerRadius: "3px",
                  },
                ],
                backgroundColor: "#ffffff44",
                height: "6px",
                cornerRadius: "3px",
              },
            ],
          },
        ],
        backgroundColor: "#3498db",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: noteItems.slice(0, 8), // Limit to 8 items to fit
        paddingAll: "15px",
        spacing: "none",
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#3498db",
                action: {
                  type: "message",
                  label: "➕ เพิ่มบันทึก",
                  text: "บันทึก ",
                },
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "📆 วันอื่น",
                  text: "/memory",
                },
                height: "sm",
                flex: 1,
              },
            ],
          },
          notes.length > 8 ? {
            type: "text",
            text: `📌 แสดง 8 จาก ${notes.length} รายการ`,
            size: "xs",
            color: "#888888",
            align: "center",
            margin: "md",
          } : null,
        ].filter(Boolean),
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Flex Message เมื่อไม่มีบันทึก
 */
function createEmptyNotesFlex(dateStr) {
  return {
    type: "flex",
    altText: `📒 ไม่มีบันทึกสำหรับ ${dateStr}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📒",
            size: "3xl",
            align: "center",
          },
          {
            type: "text",
            text: "ไม่มีบันทึก",
            weight: "bold",
            size: "lg",
            align: "center",
            margin: "lg",
            color: "#333333",
          },
          {
            type: "text",
            text: dateStr,
            size: "sm",
            align: "center",
            color: "#888888",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "xl",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            backgroundColor: "#f0f8ff",
            cornerRadius: "10px",
            paddingAll: "15px",
            contents: [
              {
                type: "text",
                text: "💡 ลองเพิ่มบันทึกใหม่",
                size: "sm",
                color: "#3498db",
                weight: "bold",
              },
              {
                type: "text",
                text: "ตัวอย่าง: บันทึก ประชุม 09.00",
                size: "xs",
                color: "#666666",
                margin: "sm",
              },
            ],
          },
        ],
        paddingAll: "25px",
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
              label: "➕ เพิ่มบันทึกใหม่",
              text: "บันทึก ",
            },
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับแสดงรายละเอียดบันทึก
 */
function createNoteDetailFlex(note) {
  // Get category with proper fallback
  const categoryKey = note.category || "note";
  const category = NOTE_CATEGORIES[categoryKey] || NOTE_CATEGORIES.note || {
    name: "บันทึกทั่วไป",
    emoji: "📝",
    color: "#1abc9c",
  };
  const completedIcon = note.isCompleted ? "✅" : "⬜";
  const completedLabel = note.isCompleted ? "เสร็จแล้ว" : "ยังไม่เสร็จ";

  return {
    type: "flex",
    altText: `📝 รายละเอียด: ${note.content.substring(0, 40)}...`,
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
                text: category.emoji,
                size: "3xl",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "รายละเอียดบันทึก",
                    weight: "bold",
                    color: "#ffffff",
                    size: "lg",
                  },
                  {
                    type: "text",
                    text: category.name || "บันทึก",
                    color: "#ffffffcc",
                    size: "sm",
                  },
                ],
                margin: "lg",
              },
            ],
          },
        ],
        paddingAll: "20px",
        backgroundColor: category.color,
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Status Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: completedIcon,
                size: "lg",
                flex: 0,
              },
              {
                type: "text",
                text: completedLabel,
                size: "md",
                color: note.isCompleted ? "#27ae60" : "#95a5a6",
                weight: "bold",
                margin: "md",
              },
            ],
            backgroundColor: note.isCompleted ? "#d4edda" : "#f8f9fa",
            cornerRadius: "8px",
            paddingAll: "12px",
          },
          // Content
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "md",
            contents: [
              {
                type: "text",
                text: "📄 เนื้อหา",
                size: "xs",
                color: "#888888",
                weight: "bold",
              },
              {
                type: "text",
                text: note.content,
                size: "md",
                color: "#333333",
                wrap: true,
                margin: "sm",
              },
            ],
            backgroundColor: "#f8f9fa",
            cornerRadius: "10px",
            paddingAll: "15px",
          },
          // Date and Time Info
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📅",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "วันที่:",
                    size: "sm",
                    color: "#888888",
                    flex: 0,
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: note.dateKey,
                    size: "sm",
                    color: "#333333",
                    margin: "md",
                  },
                ],
              },
              note.time ? {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "⏰",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "เวลา:",
                    size: "sm",
                    color: "#888888",
                    flex: 0,
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: `${note.time} น.`,
                    size: "sm",
                    color: "#333333",
                    margin: "md",
                  },
                ],
              } : null,
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "🆔",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "ID:",
                    size: "sm",
                    color: "#888888",
                    flex: 0,
                    margin: "md",
                  },
                  {
                    type: "text",
                    text: note.id.substring(0, 8) + "...",
                    size: "xs",
                    color: "#999999",
                    margin: "md",
                  },
                ],
              },
            ].filter(Boolean),
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
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                color: note.isCompleted ? "#95a5a6" : "#27ae60",
                action: {
                  type: "postback",
                  label: note.isCompleted ? "ทำงานอีกครั้ง" : "✓ เสร็จแล้ว",
                  data: `action=toggle_note&noteId=${note.id}`,
                },
                height: "sm",
                flex: 1,
              },
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "postback",
                  label: "✏️ แก้ไข",
                  data: `action=edit_note&noteId=${note.id}`,
                },
                height: "sm",
                flex: 1,
              },
            ],
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "🗑️ ลบบันทึก",
              data: `action=confirm_delete&noteId=${note.id}`,
            },
            height: "sm",
            color: "#e74c3c",
          },
          {
            type: "button",
            style: "link",
            action: {
              type: "message",
              label: "← กลับไปรายการ",
              text: "/memory วันนี้",
            },
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับยืนยันการลบ
 */
function createDeleteConfirmFlex(note) {
  const categoryKey = note.category || "note";
  const category = NOTE_CATEGORIES[categoryKey] || NOTE_CATEGORIES.note || {
    name: "บันทึกทั่วไป",
    emoji: "📝",
    color: "#1abc9c",
  };

  return {
    type: "flex",
    altText: "⚠️ ยืนยันการลบบันทึก",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "⚠️",
            size: "3xl",
            align: "center",
          },
          {
            type: "text",
            text: "ยืนยันการลบ",
            weight: "bold",
            size: "lg",
            align: "center",
            color: "#ffffff",
            margin: "md",
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#e74c3c",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "คุณต้องการลบบันทึกนี้หรือไม่?",
            size: "md",
            color: "#333333",
            wrap: true,
            align: "center",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: `${category.emoji} ${category.name}`,
                size: "xs",
                color: "#888888",
                align: "center",
              },
              {
                type: "text",
                text: note.content.length > 60 ? note.content.substring(0, 60) + "..." : note.content,
                size: "sm",
                color: "#555555",
                wrap: true,
                align: "center",
                margin: "sm",
              },
            ],
            backgroundColor: "#f8f9fa",
            cornerRadius: "8px",
            paddingAll: "12px",
          },
          {
            type: "text",
            text: "⚠️ การลบจะไม่สามารถย้อนกลับได้",
            size: "xs",
            color: "#e74c3c",
            align: "center",
            margin: "lg",
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
            color: "#e74c3c",
            action: {
              type: "postback",
              label: "🗑️ ยืนยันลบ",
              data: `action=delete_note_confirmed&noteId=${note.id}`,
            },
            height: "sm",
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "← ยกเลิก",
              data: `action=view_note&noteId=${note.id}`,
            },
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับเมนูการแก้ไข
 */
function createEditNoteFlex(note) {
  const categoryKey = note.category || "note";
  const category = NOTE_CATEGORIES[categoryKey] || NOTE_CATEGORIES.note || {
    name: "บันทึกทั่วไป",
    emoji: "📝",
    color: "#1abc9c",
  };

  return {
    type: "flex",
    altText: "✏️ แก้ไขบันทึก",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✏️",
            size: "3xl",
            align: "center",
          },
          {
            type: "text",
            text: "แก้ไขบันทึก",
            weight: "bold",
            size: "lg",
            align: "center",
            color: "#ffffff",
            margin: "md",
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#3498db",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "เนื้อหาปัจจุบัน:",
            size: "xs",
            color: "#888888",
            weight: "bold",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: `${category.emoji} ${note.content}`,
                size: "sm",
                color: "#333333",
                wrap: true,
              },
            ],
            backgroundColor: "#f8f9fa",
            cornerRadius: "8px",
            paddingAll: "12px",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: "💡 วิธีแก้ไข:",
            size: "sm",
            color: "#3498db",
            weight: "bold",
            margin: "lg",
          },
          {
            type: "text",
            text: "พิมพ์ข้อความใหม่ในรูปแบบ:",
            size: "xs",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: `แก้ไข ${note.id.substring(0, 8)} [เนื้อหาใหม่]`,
                size: "xs",
                color: "#3498db",
                wrap: true,
                weight: "bold",
              },
            ],
            backgroundColor: "#e3f2fd",
            cornerRadius: "8px",
            paddingAll: "10px",
          },
          {
            type: "text",
            text: "หรือ",
            size: "xs",
            color: "#888888",
            align: "center",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            contents: [
              {
                type: "text",
                text: "แก้ไข [เนื้อหาใหม่]",
                size: "xs",
                color: "#3498db",
                wrap: true,
                weight: "bold",
              },
              {
                type: "text",
                text: "(จะแก้ไขบันทึกล่าสุด)",
                size: "xxs",
                color: "#999999",
                margin: "xs",
              },
            ],
            backgroundColor: "#e3f2fd",
            cornerRadius: "8px",
            paddingAll: "10px",
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
            style: "link",
            action: {
              type: "postback",
              label: "← กลับไปรายละเอียด",
              data: `action=view_note&noteId=${note.id}`,
            },
            height: "sm",
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}

/**
 * สร้าง Flex Message สำหรับเมนูสมุดบันทึก
 */
function createMemoryMenuFlex() {
  const today = new Date();
  const todayStr = formatThaiDate(today, false);

  return {
    type: "flex",
    altText: "📒 สมุดบันทึก WiT",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "📒",
            size: "xxl",
            flex: 0,
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "สมุดบันทึก",
                weight: "bold",
                color: "#ffffff",
                size: "xl",
              },
              {
                type: "text",
                text: "MEMORY NOTE",
                color: "#ffffffaa",
                size: "xs",
              },
            ],
            margin: "lg",
          },
        ],
        backgroundColor: "#9b59b6",
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Quick actions
          {
            type: "text",
            text: "⚡ เรียกดูบันทึก",
            weight: "bold",
            size: "md",
            color: "#333333",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                backgroundColor: "#e8f5e9",
                cornerRadius: "10px",
                paddingAll: "15px",
                contents: [
                  {type: "text", text: "📅", size: "xl", align: "center"},
                  {type: "text", text: "วันนี้", size: "sm", align: "center", weight: "bold", color: "#2e7d32", margin: "sm"},
                  {type: "text", text: todayStr, size: "xs", align: "center", color: "#666666"},
                ],
                action: {type: "message", text: "/memory วันนี้"},
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                backgroundColor: "#fff3e0",
                cornerRadius: "10px",
                paddingAll: "15px",
                contents: [
                  {type: "text", text: "📆", size: "xl", align: "center"},
                  {type: "text", text: "เลือกวัน", size: "sm", align: "center", weight: "bold", color: "#e65100", margin: "sm"},
                  {type: "text", text: "ระบุวันที่", size: "xs", align: "center", color: "#666666"},
                ],
                action: {type: "message", text: "/memory "},
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                backgroundColor: "#e3f2fd",
                cornerRadius: "10px",
                paddingAll: "15px",
                contents: [
                  {type: "text", text: "🕐", size: "xl", align: "center"},
                  {type: "text", text: "ล่าสุด", size: "sm", align: "center", weight: "bold", color: "#1565c0", margin: "sm"},
                  {type: "text", text: "10 รายการ", size: "xs", align: "center", color: "#666666"},
                ],
                action: {type: "message", text: "/memory ล่าสุด"},
              },
            ],
          },
          {
            type: "separator",
            margin: "xl",
          },
          // How to use
          {
            type: "text",
            text: "📝 วิธีบันทึก",
            weight: "bold",
            size: "md",
            color: "#333333",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            backgroundColor: "#f8f9fa",
            cornerRadius: "10px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "💬 ตัวอย่างคำสั่ง:",
                size: "xs",
                color: "#666666",
                weight: "bold",
              },
              {
                type: "text",
                text: "• บันทึก ประชุม 09.00 12/12/2568",
                size: "xs",
                color: "#888888",
                margin: "sm",
              },
              {
                type: "text",
                text: "• บันทึก นัดหมอ พรุ่งนี้ 14.30",
                size: "xs",
                color: "#888888",
              },
              {
                type: "text",
                text: "• บันทึก อย่าลืมซื้อของ",
                size: "xs",
                color: "#888888",
              },
              {
                type: "text",
                text: "• /memory 12/12/2568",
                size: "xs",
                color: "#888888",
              },
            ],
          },
          // Categories
          {
            type: "text",
            text: "🏷️ หมวดหมู่อัตโนมัติ",
            weight: "bold",
            size: "sm",
            color: "#333333",
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "sm",
            spacing: "sm",
            wrap: true,
            contents: [
              {type: "text", text: "📅 ประชุม", size: "xxs", color: "#3498db"},
              {type: "text", text: "⏰ เตือน", size: "xxs", color: "#e74c3c"},
              {type: "text", text: "✅ งาน", size: "xxs", color: "#27ae60"},
              {type: "text", text: "💡 ไอเดีย", size: "xxs", color: "#f39c12"},
              {type: "text", text: "💊 สุขภาพ", size: "xxs", color: "#00bcd4"},
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
            color: "#9b59b6",
            action: {
              type: "message",
              label: "➕ เพิ่มบันทึกใหม่",
              text: "บันทึก ",
            },
          },
        ],
        paddingAll: "15px",
      },
    },
  };
}
// =====================================================
// 🎯 COMMAND HANDLERS
// =====================================================

/**
 * ตรวจสอบว่าเป็นคำสั่งบันทึกหรือไม่
 */
function isNoteCommand(text) {
  const lowerText = text.toLowerCase().trim();

  // Check if it's a memory command first (viewing notes)
  if (lowerText.startsWith("/memory") || lowerText.startsWith("ดูบันทึก") || lowerText.startsWith("เรียกดูบันทึก")) {
    return false;
  }

  const noteKeywords = [
    "บันทึก", "จดไว้", "จด", "note", "memo",
    "/note", "/memo", "/บันทึก",
  ];

  return noteKeywords.some((keyword) => lowerText.startsWith(keyword));
}

/**
 * ตรวจสอบว่าเป็นคำสั่งเรียกดูบันทึกหรือไม่
 */
function isMemoryCommand(text) {
  const lowerText = text.toLowerCase().trim();
  return lowerText.startsWith("/memory") || lowerText.startsWith("ดูบันทึก") || lowerText.startsWith("เรียกดูบันทึก");
}

/**
 * ตรวจสอบว่าเป็นคำสั่งแก้ไขบันทึกหรือไม่
 * หมายเหตุ: ต้องเฉพาะเจาะจง ไม่จับคำถามทั่วไปเช่น "แก้ไขปัญหา Short shot"
 */
function isEditCommand(text) {
  const lowerText = text.toLowerCase().trim();
  
  // คำสั่งแก้ไขที่เฉพาะเจาะจง - ต้องมีคำว่า "บันทึก" หรือ "note" ตามหลัง
  const specificEditPatterns = [
    /^แก้ไขบันทึก/,           // แก้ไขบันทึก...
    /^แก้ไข\s*note/i,         // แก้ไข note...
    /^แก้ไข\s*memo/i,         // แก้ไข memo...
    /^แก้ไข\s*#\d+/,          // แก้ไข #123
    /^edit\s*note/i,          // edit note...
    /^edit\s*memo/i,          // edit memo...
    /^\/edit/i,               // /edit...
  ];
  
  return specificEditPatterns.some((pattern) => pattern.test(lowerText));
}

/**
 * Parse คำสั่งบันทึก
 */
function parseNoteCommand(text) {
  // Remove command prefix
  let content = text
      .replace(/^(บันทึก|จดไว้|จด|note|memo|\/note|\/memo)/i, "")
      .trim();

  if (!content) {
    return null;
  }

  // Extract date/time
  const dateTime = extractDateTime(content);

  // Remove date/time from content for cleaner note
  content = content
      .replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/g, "")
      .replace(/\d{1,2}[\/\-\.]\d{1,2}/g, "")
      .replace(/\d{1,2}[:\.]?\d{2}\s*น\.?/g, "")
      .replace(/(วันนี้|พรุ่งนี้|มะรืน|เมื่อวาน)/g, "")
      .trim();

  // Detect category
  const category = detectCategory(text);

  return {
    content: content || text.replace(/^(บันทึก|จดไว้|จด|note|memo|\/note|\/memo)/i, "").trim(),
    date: dateTime.date,
    time: dateTime.time,
    category: category,
    hasDate: dateTime.hasDate,
    hasTime: dateTime.hasTime,
  };
}

/**
 * Parse คำสั่งเรียกดูบันทึก
 */
function parseMemoryCommand(text) {
  const lowerText = text.toLowerCase().trim();

  // Remove command prefix
  const params = lowerText
      .replace(/^(\/memory|ดูบันทึก|เรียกดูบันทึก)/i, "")
      .trim();

  // Check for special keywords
  if (!params || params === "วันนี้" || params === "today") {
    return {type: "date", date: new Date()};
  }

  if (params === "เมื่อวาน" || params === "yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {type: "date", date: yesterday};
  }

  if (params === "พรุ่งนี้" || params === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {type: "date", date: tomorrow};
  }

  if (params === "ล่าสุด" || params === "recent") {
    return {type: "recent", limit: 10};
  }

  if (params.startsWith("ค้นหา ") || params.startsWith("search ")) {
    const keyword = params.replace(/^(ค้นหา|search)\s*/i, "").trim();
    return {type: "search", keyword};
  }

  // Try to parse as date
  const dateTime = extractDateTime(params);
  if (dateTime.hasDate) {
    return {type: "date", date: dateTime.date};
  }

  // Default to menu if can't parse
  return {type: "menu"};
}

/**
 * Parse คำสั่งแก้ไขบันทึก
 * Format: "แก้ไข [noteId] [content]" หรือ "แก้ไข [content]" (แก้ล่าสุด)
 */
function parseEditCommand(text) {
  // Remove command prefix
  let content = text
      .replace(/^(แก้ไข|edit|\/edit)/i, "")
      .trim();

  if (!content) {
    return null;
  }

  // Check if starts with note ID (8 characters or more)
  const words = content.split(/\s+/);
  const firstWord = words[0];

  // If first word looks like a note ID, extract it
  if (firstWord && firstWord.length >= 8 && !firstWord.match(/[ก-๙]/)) {
    return {
      noteId: firstWord,
      content: words.slice(1).join(" ").trim(),
      isLatest: false,
    };
  }

  // Otherwise, edit latest note
  return {
    noteId: null,
    content: content,
    isLatest: true,
  };
}

/**
 * Handle คำสั่งแก้ไขบันทึก
 */
async function handleEditCommand(userId, text) {
  const editData = parseEditCommand(text);

  if (!editData || !editData.content) {
    return {
      handled: true,
      response: {
        type: "text",
        text: "❌ กรุณาระบุเนื้อหาที่ต้องการแก้ไข\n\nรูปแบบ:\n• แก้ไข [เนื้อหาใหม่] (แก้ล่าสุด)\n• แก้ไข [noteId] [เนื้อหาใหม่]",
      },
    };
  }

  let noteId = editData.noteId;

  // If no noteId specified, get latest note
  if (editData.isLatest) {
    const db = getFirestore();
    const latestNotes = await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

    if (latestNotes.empty) {
      return {
        handled: true,
        response: {
          type: "text",
          text: "❌ ไม่พบบันทึกที่จะแก้ไข",
        },
      };
    }

    noteId = latestNotes.docs[0].id;
  }

  // Update the note
  const result = await updateNote(userId, noteId, {content: editData.content});

  if (result.success) {
    return {
      handled: true,
      response: {
        type: "text",
        text: `✅ แก้ไขบันทึกเรียบร้อยแล้ว\n\n📝 ${editData.content}`,
        quickReply: {
          items: [
            {type: "action", action: {type: "postback", label: "👁️ ดูรายละเอียด", data: `action=view_note&noteId=${noteId}`}},
            {type: "action", action: {type: "message", label: "📋 ดูบันทึกวันนี้", text: "/memory วันนี้"}},
          ],
        },
      },
    };
  }

  return {
    handled: true,
    response: {type: "text", text: "❌ ไม่สามารถแก้ไขได้"},
  };
}

/**
 * Handle คำสั่งบันทึก
 */
async function handleNoteCommand(userId, text) {
  const noteData = parseNoteCommand(text);

  if (!noteData || !noteData.content) {
    return {
      handled: true,
      response: createModernMemoryMenuFlex(), // ✨ Use Enhanced Flex
    };
  }

  const result = await saveNote(userId, noteData);

  if (result.success) {
    return {
      handled: true,
      response: createModernNoteSavedFlex(result.note), // ✨ Use Enhanced Flex with actual saved note
    };
  } else {
    return {
      handled: true,
      response: {
        type: "text",
        text: `❌ ไม่สามารถบันทึกได้: ${result.error}`,
      },
    };
  }
}

/**
 * Handle คำสั่งเรียกดูบันทึก
 */
async function handleMemoryCommand(userId, text) {
  const params = parseMemoryCommand(text);

  switch (params.type) {
    case "date": {
      const result = await getNotesByDate(userId, params.date);
      const dateStr = formatThaiDate(params.date, true);
      return {
        handled: true,
        response: createNotesListFlex(result.notes, dateStr),
      };
    }

    case "recent": {
      const result = await getRecentNotes(userId, params.limit);
      return {
        handled: true,
        response: createNotesListFlex(result.notes, "บันทึกล่าสุด"),
      };
    }

    case "search": {
      const result = await searchNotes(userId, params.keyword);
      return {
        handled: true,
        response: createNotesListFlex(result.notes, `ค้นหา "${params.keyword}"`),
      };
    }

    case "menu":
    default:
      return {
        handled: true,
        response: createModernMemoryMenuFlex(), // ✨ Use Enhanced Flex
      };
  }
}

/**
 * Handle postback actions for notes
 */
async function handleNotePostback(userId, data) {
  const params = new URLSearchParams(data);
  const action = params.get("action");
  const noteId = params.get("noteId");

  // Helper to get note
  const getNote = async (userId, noteId) => {
    const db = getFirestore();
    const noteDoc = await db.collection("user_notes")
        .doc(userId)
        .collection("notes")
        .doc(noteId)
        .get();
    if (noteDoc.exists) {
      return {id: noteDoc.id, ...noteDoc.data()};
    }
    return null;
  };

  switch (action) {
    case "view_note": {
      // Show detailed view of the note
      const note = await getNote(userId, noteId);
      if (note) {
        return {
          handled: true,
          response: createNoteDetailFlex(note),
        };
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่พบบันทึกนี้"},
      };
    }

    case "note_actions": {
      // Same as view_note - show detail with actions
      const note = await getNote(userId, noteId);
      if (note) {
        return {
          handled: true,
          response: createNoteDetailFlex(note),
        };
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่พบบันทึกนี้"},
      };
    }

    case "toggle_note": {
      const result = await toggleNoteComplete(userId, noteId);
      if (result.success) {
        // Return to detail view with updated status
        const note = await getNote(userId, noteId);
        if (note) {
          return {
            handled: true,
            response: createNoteDetailFlex(note),
          };
        }
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่สามารถอัปเดตได้"},
      };
    }

    case "edit_note": {
      // Show edit instructions
      const note = await getNote(userId, noteId);
      if (note) {
        return {
          handled: true,
          response: createEditNoteFlex(note),
        };
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่พบบันทึกนี้"},
      };
    }

    case "confirm_delete": {
      // Show delete confirmation
      const note = await getNote(userId, noteId);
      if (note) {
        return {
          handled: true,
          response: createDeleteConfirmFlex(note),
        };
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่พบบันทึกนี้"},
      };
    }

    case "delete_note_confirmed": {
      // Actually delete the note
      const result = await deleteNote(userId, noteId);
      if (result.success) {
        return {
          handled: true,
          response: {
            type: "text",
            text: "✅ ลบบันทึกเรียบร้อยแล้ว",
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "📋 ดูบันทึกวันนี้", text: "/memory วันนี้"}},
                {type: "action", action: {type: "message", label: "➕ เพิ่มบันทึก", text: "บันทึก "}},
              ],
            },
          },
        };
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่สามารถลบได้"},
      };
    }

    // Legacy support for old action names
    case "delete_note": {
      // Redirect to confirm_delete
      const note = await getNote(userId, noteId);
      if (note) {
        return {
          handled: true,
          response: createDeleteConfirmFlex(note),
        };
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่พบบันทึกนี้"},
      };
    }

    case "confirm_delete_note": {
      // Redirect to delete_note_confirmed
      const result = await deleteNote(userId, noteId);
      if (result.success) {
        return {
          handled: true,
          response: {
            type: "text",
            text: "✅ ลบบันทึกเรียบร้อยแล้ว",
            quickReply: {
              items: [
                {type: "action", action: {type: "message", label: "📋 ดูบันทึกวันนี้", text: "/memory วันนี้"}},
                {type: "action", action: {type: "message", label: "➕ เพิ่มบันทึก", text: "บันทึก "}},
              ],
            },
          },
        };
      }
      return {
        handled: true,
        response: {type: "text", text: "❌ ไม่สามารถลบได้"},
      };
    }

    default:
      return {handled: false};
  }
}

// =====================================================
// 🌐 LINE WEBHOOK WRAPPER
// =====================================================

/**
 * Wrapper สำหรับ LINE webhook format
 * รับ format เดียวกับ marketplace: ({ lineClient, db }, event, userData)
 */
async function handleMemoryWebhook({lineClient, db}, event, userData) {
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const message = event.message;

  if (!message || message.type !== "text") {
    return false;
  }

  const text = message.text.trim();
  let result;

  // Check if it's an edit command (แก้ไข...)
  if (isEditCommand(text)) {
    result = await handleEditCommand(userId, text);
  }
  // Check if it's a note command (บันทึก...)
  else if (isNoteCommand(text)) {
    result = await handleNoteCommand(userId, text);
  }
  // Check if it's a memory command (/memory, ดูบันทึก...)
  else if (isMemoryCommand(text)) {
    result = await handleMemoryCommand(userId, text);
  } else {
    return false;
  }

  if (result && result.handled && result.response) {
    try {
      await lineClient.replyMessage(replyToken, result.response);
      console.log("📝 Memory command handled successfully");
      return true;
    } catch (error) {
      console.error("❌ Error sending memory response:", error);
      // Fallback to simple text
      try {
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: "📝 ระบบบันทึกพร้อมใช้งาน พิมพ์ \"บันทึก [ข้อความ]\" เพื่อสร้างบันทึก",
        });
        return true;
      } catch (e) {
        console.error("❌ Fallback also failed:", e);
        return false;
      }
    }
  }

  return false;
}

/**
 * Check if text is any memory-related command
 */
function isAnyMemoryCommand(text) {
  return isNoteCommand(text) || isMemoryCommand(text) || isEditCommand(text);
}

// =====================================================
// 📦 EXPORTS
// =====================================================

module.exports = {
  // Core functions
  saveNote,
  getNotesByDate,
  getNotesByDateRange,
  getRecentNotes,
  searchNotes,
  deleteNote,
  updateNote,
  toggleNoteComplete,

  // Flex Message generators
  createNoteSavedFlex,
  createNotesListFlex,
  createEmptyNotesFlex,
  createMemoryMenuFlex,
  createDeleteConfirmFlex,
  createNoteDetailFlex,
  createEditNoteFlex,

  // Command handlers
  isNoteCommand,
  isMemoryCommand,
  isAnyMemoryCommand,
  parseNoteCommand,
  parseMemoryCommand,
  handleNoteCommand,
  handleMemoryCommand,
  handleNotePostback,

  // LINE Webhook handler
  handleMemoryWebhook,

  // Utilities
  parseThaiDate,
  formatThaiDate,
  extractDateTime,
  detectCategory,
  NOTE_CATEGORIES,
};
