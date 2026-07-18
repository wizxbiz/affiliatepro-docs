/**
 * Teaching Flex Templates - Professional LINE Flex Messages
 * Version: 2.0.0
 * 
 * 🎨 Beautiful Flex Message templates for Teaching System
 * 📚 Features: Lesson cards, Quiz UI, Progress bars, Curriculum view
 */

// ========================================
// 🖼️ LESSON IMAGE DATABASE
// Professional injection molding images
// ========================================
const LESSON_IMAGES = {
  // Level 0: ผู้เริ่มต้น (พื้นฐานความคิด)
  1: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/mindset-technician.jpg",
    alt: "Mindset ช่างเทคนิคมืออาชีพ",
    fallback: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop"
  },
  2: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/6m-analysis.jpg",
    alt: "องค์ประกอบ 6M",
    fallback: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop"
  },
  3: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/heat-pressure-time.jpg",
    alt: "หลัก 3 สิ่งสำคัญ: ความร้อน แรงดัน เวลา",
    fallback: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=400&fit=crop"
  },
  4: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/plastic-types.jpg",
    alt: "ประเภทพลาสติก",
    fallback: "https://images.unsplash.com/photo-1567789884554-0b844b597180?w=800&h=400&fit=crop"
  },
  
  // Level 1: พื้นฐานเครื่องจักร
  5: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/injection-machine-structure.jpg",
    alt: "โครงสร้างเครื่องฉีดพลาสติก",
    fallback: "https://images.unsplash.com/photo-1581092162384-8987c1d64926?w=800&h=400&fit=crop"
  },
  6: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/clamping-unit.jpg",
    alt: "ระบบ Clamping Unit",
    fallback: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=400&fit=crop"
  },
  7: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/injection-unit.jpg",
    alt: "ระบบ Injection Unit",
    fallback: "https://images.unsplash.com/photo-1581093458791-9f3c3250a8b0?w=800&h=400&fit=crop"
  },
  8: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/controller-panel.jpg",
    alt: "Controller และระบบควบคุม",
    fallback: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop"
  },
  
  // Level 2: กระบวนการฉีด
  9: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/injection-cycle.jpg",
    alt: "ขั้นตอนการฉีด 4 ระยะ",
    fallback: "https://images.unsplash.com/photo-1581093804475-577d72e38aa0?w=800&h=400&fit=crop"
  },
  10: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/temperature-setting.jpg",
    alt: "การตั้งค่าอุณหภูมิ",
    fallback: "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=800&h=400&fit=crop"
  },
  11: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/pressure-speed-setting.jpg",
    alt: "การตั้งค่าแรงดันและความเร็ว",
    fallback: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=800&h=400&fit=crop"
  },
  12: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/drying-hopper.jpg",
    alt: "การอบเม็ดพลาสติก",
    fallback: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=400&fit=crop"
  },
  
  // Level 3: การแก้ปัญหา
  13: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/sink-mark.jpg",
    alt: "Sink Mark และ Shrinkage",
    fallback: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop"
  },
  14: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/flash-short-shot.jpg",
    alt: "Flash และ Short Shot",
    fallback: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=400&fit=crop"
  },
  15: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/weld-line.jpg",
    alt: "Weld Line และ Flow Mark",
    fallback: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop"
  },
  16: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/6m-problem-solving.jpg",
    alt: "การวิเคราะห์ปัญหาด้วย 6M",
    fallback: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
  },
  
  // Level 4: คุณภาพและมาตรฐาน
  17: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/iso-quality.jpg",
    alt: "ISO และมาตรฐานคุณภาพ",
    fallback: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=400&fit=crop"
  },
  18: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/measuring-tools.jpg",
    alt: "เครื่องมือวัดและตรวจสอบ",
    fallback: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop"
  },
  19: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/spc-chart.jpg",
    alt: "SPC และการควบคุมกระบวนการ",
    fallback: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
  },
  20: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/documentation.jpg",
    alt: "เอกสารและการรายงาน",
    fallback: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop"
  },
  
  // Level 5: เทคนิคขั้นสูง
  21: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/multi-shot-molding.jpg",
    alt: "Multi-Shot Molding",
    fallback: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop"
  },
  22: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/gas-injection.jpg",
    alt: "Gas Injection และ Water Injection",
    fallback: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&h=400&fit=crop"
  },
  23: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/industry-4-0.jpg",
    alt: "Industry 4.0 และ Smart Factory",
    fallback: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop"
  },
  24: {
    url: "https://raw.githubusercontent.com/nicepayth/images/main/iot-analytics.jpg",
    alt: "IoT และการวิเคราะห์ข้อมูล",
    fallback: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=400&fit=crop"
  },
  
  // Level cover images (ใช้ภาพที่สื่อถึงแต่ละ Level)
  level0: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  level1: "https://images.unsplash.com/photo-1581092162384-8987c1d64926?w=800&h=400&fit=crop",
  level2: "https://images.unsplash.com/photo-1581093804475-577d72e38aa0?w=800&h=400&fit=crop",
  level3: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop",
  level4: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=400&fit=crop",
  level5: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop",
  
  // General purpose images
  welcome: "https://images.unsplash.com/photo-1581093458791-9f3c3250a8b0?w=800&h=400&fit=crop",
  curriculum: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=400&fit=crop",
  quiz: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&h=400&fit=crop",
  progress: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
  reference: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
  certificate: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=800&h=400&fit=crop"
};

// Helper function to get image URL (with fallback)
function getImageUrl(lessonId) {
  const lessonImage = LESSON_IMAGES[lessonId];
  if (typeof lessonImage === 'object') {
    return lessonImage.url || lessonImage.fallback;
  }
  return lessonImage || LESSON_IMAGES.welcome;
}

// ========================================
// 🎨 LEVEL COLOR SCHEME
// ========================================
const LEVEL_COLORS = {
  0: { primary: "#4CAF50", secondary: "#C8E6C9", icon: "🌱", name: "ผู้เริ่มต้น" },
  1: { primary: "#2196F3", secondary: "#BBDEFB", icon: "⚙️", name: "พื้นฐานเครื่องจักร" },
  2: { primary: "#9C27B0", secondary: "#E1BEE7", icon: "🔧", name: "กระบวนการฉีด" },
  3: { primary: "#FF9800", secondary: "#FFE0B2", icon: "🔍", name: "การแก้ปัญหา" },
  4: { primary: "#F44336", secondary: "#FFCDD2", icon: "📊", name: "คุณภาพและมาตรฐาน" },
  5: { primary: "#673AB7", secondary: "#D1C4E9", icon: "🚀", name: "เทคนิคขั้นสูง" }
};

// ========================================
// 📚 FLEX TEMPLATES
// ========================================

/**
 * สร้าง Flex Message สำหรับหน้าต้อนรับ
 */
function createWelcomeFlexMessage(userProgress = {}) {
  const currentLevel = userProgress.currentLevel || 0;
  const levelInfo = LEVEL_COLORS[currentLevel];
  
  return {
    type: "flex",
    altText: "🎓 ยินดีต้อนรับสู่หลักสูตรการฉีดพลาสติก",
    contents: {
      type: "bubble",
      size: "giga",
      hero: {
        type: "image",
        url: LESSON_IMAGES.welcome,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
        action: {
          type: "message",
          text: "หลักสูตรฉีด"
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎓 IMT THAILAND",
            weight: "bold",
            size: "xs",
            color: "#999999"
          },
          {
            type: "text",
            text: "หลักสูตรเทคนิคการฉีดพลาสติก",
            weight: "bold",
            size: "xl",
            margin: "md",
            wrap: true
          },
          {
            type: "text",
            text: "เรียนรู้ตั้งแต่พื้นฐานจนถึงระดับผู้เชี่ยวชาญ พร้อมแบบทดสอบและใบรับรอง",
            size: "sm",
            color: "#666666",
            margin: "lg",
            wrap: true
          },
          {
            type: "separator",
            margin: "xl"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "xl",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "📚 6 Levels",
                    size: "sm",
                    color: "#555555",
                    align: "center"
                  }
                ],
                flex: 1
              },
              {
                type: "separator"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "📖 24 บท",
                    size: "sm",
                    color: "#555555",
                    align: "center"
                  }
                ],
                flex: 1
              },
              {
                type: "separator"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "⏱️ 15 ชม.",
                    size: "sm",
                    color: "#555555",
                    align: "center"
                  }
                ],
                flex: 1
              }
            ]
          },
          {
            type: "separator",
            margin: "xl"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: `${levelInfo.icon} สถานะปัจจุบัน`,
                size: "sm",
                color: "#999999"
              },
              {
                type: "text",
                text: `Level ${currentLevel}: ${levelInfo.name}`,
                size: "lg",
                weight: "bold",
                color: levelInfo.primary,
                margin: "sm"
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: `💯 ${userProgress.totalPoints || 0} คะแนน`,
                    size: "sm",
                    color: "#666666",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: `✅ ${userProgress.completedLessons?.length || 0}/24 บท`,
                    size: "sm",
                    color: "#666666",
                    align: "end",
                    flex: 1
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "md",
            action: {
              type: "message",
              label: `📖 เริ่มเรียนบทที่ ${userProgress.currentLesson || 1}`,
              text: `บทที่ ${userProgress.currentLesson || 1}`
            },
            color: levelInfo.primary
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "message",
                  label: "📚 หลักสูตร",
                  text: "หลักสูตรฉีด"
                },
                flex: 1
              },
              {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "message",
                  label: "📊 ความก้าวหน้า",
                  text: "ความก้าวหน้า"
                },
                flex: 1
              }
            ]
          }
        ],
        flex: 0
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับบทเรียน
 */
function createLessonFlexMessage(lesson, levelInfo, userProgress = {}) {
  const imageUrl = getImageUrl(lesson.id);
  const levelColor = LEVEL_COLORS[levelInfo.id] || LEVEL_COLORS[0];
  const isCompleted = userProgress.completedLessons?.includes(lesson.id);
  
  // สร้าง key points
  const keyPointsBoxes = lesson.content.keyPoints.slice(0, 4).map((point, index) => ({
    type: "box",
    layout: "horizontal",
    margin: "md",
    contents: [
      {
        type: "text",
        text: `${index + 1}`,
        size: "sm",
        color: "#FFFFFF",
        align: "center",
        flex: 0,
        gravity: "center"
      },
      {
        type: "text",
        text: point,
        size: "sm",
        color: "#444444",
        margin: "md",
        wrap: true,
        flex: 5
      }
    ]
  }));
  
  return {
    type: "flex",
    altText: `📖 บทที่ ${lesson.id}: ${lesson.title}`,
    contents: {
      type: "bubble",
      size: "giga",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: imageUrl,
            size: "full",
            aspectRatio: "20:10",
            aspectMode: "cover"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `บทที่ ${lesson.id}`,
                size: "xs",
                color: "#FFFFFF",
                weight: "bold"
              }
            ],
            position: "absolute",
            offsetTop: "10px",
            offsetStart: "10px",
            backgroundColor: levelColor.primary,
            cornerRadius: "xl",
            paddingAll: "8px"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `${levelColor.icon} Level ${levelInfo.id}`,
                size: "xs",
                color: "#FFFFFF"
              }
            ],
            position: "absolute",
            offsetTop: "10px",
            offsetEnd: "10px",
            backgroundColor: "#00000088",
            cornerRadius: "xl",
            paddingAll: "8px"
          },
          isCompleted ? {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "✅ เรียนแล้ว",
                size: "xs",
                color: "#FFFFFF"
              }
            ],
            position: "absolute",
            offsetBottom: "10px",
            offsetEnd: "10px",
            backgroundColor: "#4CAF50",
            cornerRadius: "xl",
            paddingAll: "8px"
          } : null
        ].filter(Boolean),
        paddingAll: "0px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: lesson.title,
            weight: "bold",
            size: "xl",
            wrap: true,
            color: "#333333"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: `⏱️ ${lesson.duration}`,
                size: "xs",
                color: "#888888"
              },
              {
                type: "text",
                text: `📍 ${levelInfo.name}`,
                size: "xs",
                color: levelColor.primary,
                align: "end"
              }
            ]
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "text",
            text: "📝 บทนำ",
            size: "sm",
            color: levelColor.primary,
            weight: "bold",
            margin: "lg"
          },
          {
            type: "text",
            text: lesson.content.introduction,
            size: "sm",
            color: "#555555",
            margin: "sm",
            wrap: true
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "text",
            text: "🎯 จุดสำคัญที่ต้องจำ",
            size: "sm",
            color: levelColor.primary,
            weight: "bold",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: keyPointsBoxes.map(box => ({
              ...box,
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: box.contents[0].text,
                      size: "xxs",
                      color: "#FFFFFF",
                      align: "center"
                    }
                  ],
                  width: "20px",
                  height: "20px",
                  backgroundColor: levelColor.primary,
                  cornerRadius: "50px",
                  justifyContent: "center",
                  alignItems: "center"
                },
                box.contents[1]
              ]
            }))
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            backgroundColor: "#FFF9E6",
            cornerRadius: "md",
            paddingAll: "md",
            contents: [
              {
                type: "text",
                text: "💡 เคล็ดลับ",
                size: "sm",
                color: "#FF9800",
                weight: "bold"
              },
              {
                type: "text",
                text: lesson.content.tip,
                size: "sm",
                color: "#666666",
                margin: "sm",
                wrap: true
              }
            ]
          }
        ]
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
              lesson.id > 1 ? {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "message",
                  label: `⬅️ บทที่ ${lesson.id - 1}`,
                  text: `บทที่ ${lesson.id - 1}`
                },
                flex: 1
              } : {
                type: "filler"
              },
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                  type: "message",
                  label: "📝 ทำ Quiz",
                  text: `quiz level ${levelInfo.id}`
                },
                color: levelColor.primary,
                flex: 1
              },
              lesson.id < 24 ? {
                type: "button",
                style: "secondary",
                height: "sm",
                action: {
                  type: "message",
                  label: `บทที่ ${lesson.id + 1} ➡️`,
                  text: `บทที่ ${lesson.id + 1}`
                },
                flex: 1
              } : {
                type: "filler"
              }
            ]
          },
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "message",
              label: "📚 ดูหลักสูตรทั้งหมด",
              text: "หลักสูตรฉีด"
            }
          }
        ],
        flex: 0
      }
    }
  };
}

/**
 * สร้าง Flex Message Carousel สำหรับหลักสูตร
 */
function createCurriculumFlexMessage(levelsData) {
  const bubbles = levelsData.map(level => {
    const levelColor = LEVEL_COLORS[level.id];
    const levelImage = LESSON_IMAGES[`level${level.id}`];
    
    return {
      type: "bubble",
      size: "kilo",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: levelImage,
            size: "full",
            aspectRatio: "16:9",
            aspectMode: "cover"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `${levelColor.icon}`,
                size: "3xl"
              }
            ],
            position: "absolute",
            offsetBottom: "10px",
            offsetEnd: "10px",
            backgroundColor: "#FFFFFF",
            cornerRadius: "50px",
            paddingAll: "10px"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `Level ${level.id}`,
                size: "sm",
                color: "#FFFFFF",
                weight: "bold"
              }
            ],
            position: "absolute",
            offsetTop: "10px",
            offsetStart: "10px",
            backgroundColor: levelColor.primary,
            cornerRadius: "md",
            paddingAll: "8px"
          }
        ],
        paddingAll: "0px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: level.name,
            weight: "bold",
            size: "lg",
            color: levelColor.primary
          },
          {
            type: "text",
            text: level.description,
            size: "xs",
            color: "#888888",
            margin: "sm",
            wrap: true
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: `📖 ${level.lessons.length} บท`,
                size: "xs",
                color: "#666666"
              },
              {
                type: "text",
                text: `🔓 ${level.requiredScore} คะแนน`,
                size: "xs",
                color: "#666666",
                align: "end"
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: level.lessons.slice(0, 3).map(lesson => ({
              type: "text",
              text: `• ${lesson.title}`,
              size: "xxs",
              color: "#888888",
              margin: "xs"
            }))
          },
          level.lessons.length > 3 ? {
            type: "text",
            text: `+${level.lessons.length - 3} บทเพิ่มเติม...`,
            size: "xxs",
            color: "#AAAAAA",
            margin: "xs"
          } : null
        ].filter(Boolean)
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "message",
              label: `ดู Level ${level.id}`,
              text: `Level ${level.id}`
            },
            color: levelColor.primary
          }
        ],
        flex: 0
      }
    };
  });
  
  return {
    type: "flex",
    altText: "📚 หลักสูตรเทคนิคการฉีดพลาสติก",
    contents: {
      type: "carousel",
      contents: bubbles
    }
  };
}

/**
 * สร้าง Flex Message สำหรับ Level Overview
 */
function createLevelOverviewFlexMessage(level, userProgress = {}) {
  const levelColor = LEVEL_COLORS[level.id];
  const levelImage = LESSON_IMAGES[`level${level.id}`];
  const isUnlocked = (userProgress.totalPoints || 0) >= level.requiredScore;
  
  const lessonBubbles = level.lessons.map(lesson => {
    const isCompleted = userProgress.completedLessons?.includes(lesson.id);
    const lessonImage = LESSON_IMAGES[lesson.id] || LESSON_IMAGES.welcome;
    
    return {
      type: "bubble",
      size: "kilo",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: lessonImage.url,
            size: "full",
            aspectRatio: "16:9",
            aspectMode: "cover"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `${lesson.id}`,
                size: "sm",
                color: "#FFFFFF",
                weight: "bold",
                align: "center"
              }
            ],
            position: "absolute",
            offsetTop: "10px",
            offsetStart: "10px",
            width: "30px",
            height: "30px",
            backgroundColor: levelColor.primary,
            cornerRadius: "50px",
            justifyContent: "center",
            alignItems: "center"
          },
          isCompleted ? {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "✅",
                size: "lg"
              }
            ],
            position: "absolute",
            offsetTop: "10px",
            offsetEnd: "10px",
            backgroundColor: "#FFFFFF",
            cornerRadius: "50px",
            paddingAll: "5px"
          } : null
        ].filter(Boolean),
        paddingAll: "0px",
        action: {
          type: "message",
          text: `บทที่ ${lesson.id}`
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: lesson.title,
            weight: "bold",
            size: "sm",
            wrap: true,
            color: "#333333"
          },
          {
            type: "text",
            text: `⏱️ ${lesson.duration}`,
            size: "xs",
            color: "#888888",
            margin: "sm"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: isCompleted ? "secondary" : "primary",
            height: "sm",
            action: {
              type: "message",
              label: isCompleted ? "📖 ทบทวน" : "📖 เริ่มเรียน",
              text: `บทที่ ${lesson.id}`
            },
            color: isCompleted ? "#888888" : levelColor.primary
          }
        ],
        flex: 0
      }
    };
  });
  
  // Add level header bubble
  const headerBubble = {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: levelImage,
      size: "full",
      aspectRatio: "16:9",
      aspectMode: "cover"
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `${levelColor.icon} Level ${level.id}`,
          size: "xs",
          color: levelColor.primary,
          weight: "bold"
        },
        {
          type: "text",
          text: level.name,
          weight: "bold",
          size: "xl",
          color: "#333333",
          margin: "sm"
        },
        {
          type: "text",
          text: level.description,
          size: "sm",
          color: "#666666",
          margin: "md",
          wrap: true
        },
        {
          type: "separator",
          margin: "lg"
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            {
              type: "text",
              text: `📖 ${level.lessons.length} บท`,
              size: "sm",
              color: "#666666"
            },
            {
              type: "text",
              text: isUnlocked ? "🔓 ปลดล็อค" : `🔒 ${level.requiredScore} คะแนน`,
              size: "sm",
              color: isUnlocked ? "#4CAF50" : "#F44336",
              align: "end"
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          height: "sm",
          action: {
            type: "message",
            label: `📝 Quiz Level ${level.id}`,
            text: `quiz level ${level.id}`
          },
          color: levelColor.primary
        }
      ],
      flex: 0
    }
  };
  
  return {
    type: "flex",
    altText: `${levelColor.icon} Level ${level.id}: ${level.name}`,
    contents: {
      type: "carousel",
      contents: [headerBubble, ...lessonBubbles]
    }
  };
}

/**
 * สร้าง Flex Message สำหรับ Quiz
 */
function createQuizFlexMessage(question, levelId, questionNumber = 1, totalQuestions = 5) {
  const levelColor = LEVEL_COLORS[levelId] || LEVEL_COLORS[0];
  
  return {
    type: "flex",
    altText: `📝 Quiz Level ${levelId} - คำถามที่ ${questionNumber}`,
    contents: {
      type: "bubble",
      size: "giga",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: LESSON_IMAGES.quiz,
            size: "full",
            aspectRatio: "20:8",
            aspectMode: "cover"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: `📝 Quiz Level ${levelId}`,
                color: "#FFFFFF",
                size: "lg",
                weight: "bold"
              },
              {
                type: "text",
                text: `คำถามที่ ${questionNumber}/${totalQuestions}`,
                color: "#FFFFFF",
                size: "xs",
                margin: "sm"
              }
            ],
            position: "absolute",
            offsetTop: "0px",
            offsetStart: "0px",
            offsetEnd: "0px",
            offsetBottom: "0px",
            backgroundColor: "#00000077",
            justifyContent: "center",
            alignItems: "center"
          }
        ],
        paddingAll: "0px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "❓ คำถาม",
            size: "sm",
            color: levelColor.primary,
            weight: "bold"
          },
          {
            type: "text",
            text: question.question,
            size: "md",
            color: "#333333",
            margin: "md",
            wrap: true,
            weight: "bold"
          },
          {
            type: "separator",
            margin: "xl"
          },
          {
            type: "text",
            text: "📋 เลือกคำตอบ",
            size: "sm",
            color: "#888888",
            margin: "lg"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index); // A, B, C
          return {
            type: "button",
            style: "secondary",
            height: "md",
            action: {
              type: "message",
              label: option,
              text: `ตอบ ${letter}`
            }
          };
        }),
        flex: 0
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับผลลัพธ์ Quiz
 */
function createQuizResultFlexMessage(isCorrect, explanation, points, levelId) {
  const levelColor = LEVEL_COLORS[levelId] || LEVEL_COLORS[0];
  
  return {
    type: "flex",
    altText: isCorrect ? "✅ ถูกต้อง!" : "❌ ไม่ถูกต้อง",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: isCorrect ? "✅" : "❌",
                size: "4xl",
                align: "center"
              },
              {
                type: "text",
                text: isCorrect ? "ถูกต้อง!" : "ไม่ถูกต้อง",
                size: "xl",
                weight: "bold",
                align: "center",
                color: isCorrect ? "#4CAF50" : "#F44336",
                margin: "md"
              },
              isCorrect ? {
                type: "text",
                text: `+${points} คะแนน`,
                size: "lg",
                color: "#FF9800",
                align: "center",
                weight: "bold",
                margin: "sm"
              } : null
            ].filter(Boolean),
            backgroundColor: isCorrect ? "#E8F5E9" : "#FFEBEE",
            cornerRadius: "lg",
            paddingAll: "xl"
          },
          {
            type: "separator",
            margin: "xl"
          },
          {
            type: "text",
            text: "💡 คำอธิบาย",
            size: "sm",
            color: levelColor.primary,
            weight: "bold",
            margin: "xl"
          },
          {
            type: "text",
            text: explanation,
            size: "sm",
            color: "#555555",
            margin: "md",
            wrap: true
          }
        ]
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "message",
              label: "📝 คำถามถัดไป",
              text: `quiz level ${levelId}`
            },
            color: levelColor.primary,
            flex: 1
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "📊 ดูคะแนน",
              text: "ความก้าวหน้า"
            },
            flex: 1
          }
        ],
        flex: 0
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับ Progress
 */
function createProgressFlexMessage(userProgress, levelsData) {
  const currentLevelInfo = LEVEL_COLORS[userProgress.currentLevel || 0];
  const completedCount = userProgress.completedLessons?.length || 0;
  const totalLessons = 24;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);
  
  // Create level progress boxes
  const levelProgressBoxes = Object.keys(LEVEL_COLORS).map(levelId => {
    const level = parseInt(levelId);
    const levelColor = LEVEL_COLORS[level];
    const isUnlocked = (userProgress.totalPoints || 0) >= (levelsData[level]?.requiredScore || 0);
    const levelLessons = levelsData[level]?.lessons || [];
    const completedInLevel = userProgress.completedLessons?.filter(
      id => levelLessons.some(l => l.id === id)
    ).length || 0;
    
    return {
      type: "box",
      layout: "horizontal",
      margin: "md",
      contents: [
        {
          type: "text",
          text: levelColor.icon,
          size: "lg",
          flex: 0
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          flex: 4,
          contents: [
            {
              type: "text",
              text: `Level ${level}: ${levelColor.name}`,
              size: "sm",
              color: isUnlocked ? "#333333" : "#999999"
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
                  width: `${(completedInLevel / levelLessons.length) * 100}%`,
                  height: "6px",
                  backgroundColor: levelColor.primary
                }
              ],
              backgroundColor: "#EEEEEE",
              cornerRadius: "md"
            }
          ]
        },
        {
          type: "text",
          text: `${completedInLevel}/${levelLessons.length}`,
          size: "xs",
          color: "#888888",
          align: "end",
          flex: 1
        }
      ]
    };
  });
  
  return {
    type: "flex",
    altText: `📊 ความก้าวหน้า: ${progressPercent}%`,
    contents: {
      type: "bubble",
      size: "giga",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "image",
            url: LESSON_IMAGES.progress,
            size: "full",
            aspectRatio: "20:8",
            aspectMode: "cover"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "📊 ความก้าวหน้าของคุณ",
                color: "#FFFFFF",
                size: "xl",
                weight: "bold"
              }
            ],
            position: "absolute",
            offsetTop: "0px",
            offsetStart: "0px",
            offsetEnd: "0px",
            offsetBottom: "0px",
            backgroundColor: "#00000066",
            justifyContent: "center",
            alignItems: "center"
          }
        ],
        paddingAll: "0px"
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
                    text: `${progressPercent}%`,
                    size: "3xl",
                    weight: "bold",
                    color: currentLevelInfo.primary,
                    align: "center"
                  },
                  {
                    type: "text",
                    text: "เสร็จสิ้น",
                    size: "sm",
                    color: "#888888",
                    align: "center"
                  }
                ],
                flex: 1
              },
              {
                type: "separator"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: `${userProgress.totalPoints || 0}`,
                    size: "3xl",
                    weight: "bold",
                    color: "#FF9800",
                    align: "center"
                  },
                  {
                    type: "text",
                    text: "คะแนน",
                    size: "sm",
                    color: "#888888",
                    align: "center"
                  }
                ],
                flex: 1
              },
              {
                type: "separator"
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: `${completedCount}/24`,
                    size: "3xl",
                    weight: "bold",
                    color: "#4CAF50",
                    align: "center"
                  },
                  {
                    type: "text",
                    text: "บทเรียน",
                    size: "sm",
                    color: "#888888",
                    align: "center"
                  }
                ],
                flex: 1
              }
            ]
          },
          {
            type: "separator",
            margin: "xl"
          },
          {
            type: "text",
            text: `${currentLevelInfo.icon} Level ปัจจุบัน`,
            size: "sm",
            color: "#888888",
            margin: "lg"
          },
          {
            type: "text",
            text: `Level ${userProgress.currentLevel || 0}: ${currentLevelInfo.name}`,
            size: "lg",
            weight: "bold",
            color: currentLevelInfo.primary,
            margin: "sm"
          },
          {
            type: "separator",
            margin: "xl"
          },
          {
            type: "text",
            text: "📈 ความก้าวหน้าแต่ละ Level",
            size: "sm",
            color: "#888888",
            margin: "lg"
          },
          ...levelProgressBoxes
        ]
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "message",
              label: "📖 เรียนต่อ",
              text: `บทที่ ${userProgress.currentLesson || 1}`
            },
            color: currentLevelInfo.primary,
            flex: 1
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "📝 ทำ Quiz",
              text: `quiz level ${userProgress.currentLevel || 0}`
            },
            flex: 1
          }
        ],
        flex: 0
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับตารางอ้างอิง
 */
function createReferenceTableFlexMessage(tableType, data) {
  let title, headerCols, rows;
  
  if (tableType === 'drying') {
    title = "📊 ตารางอุณหภูมิอบเม็ดพลาสติก";
    headerCols = ["พลาสติก", "อุณหภูมิ (°C)", "เวลา (ชม.)"];
    rows = Object.entries(data).map(([plastic, info]) => [plastic, info.temp, info.time]);
  } else if (tableType === 'cooling') {
    title = "❄️ ตารางเวลาหล่อเย็น";
    headerCols = ["พลาสติก", "เวลา (วินาที)"];
    rows = Object.entries(data).map(([plastic, time]) => [plastic, time]);
  } else if (tableType === 'pressure') {
    title = "💪 ตารางแรงดันฉีด";
    headerCols = ["พลาสติก", "แรงดัน (kg/cm²)"];
    rows = Object.entries(data).map(([plastic, pressure]) => [plastic, pressure]);
  }
  
  const headerBox = {
    type: "box",
    layout: "horizontal",
    contents: headerCols.map((col, i) => ({
      type: "text",
      text: col,
      size: "xs",
      color: "#FFFFFF",
      weight: "bold",
      align: i === 0 ? "start" : "center",
      flex: i === 0 ? 2 : 1
    })),
    backgroundColor: "#2196F3",
    paddingAll: "md",
    cornerRadius: "md"
  };
  
  const rowBoxes = rows.map((row, rowIndex) => ({
    type: "box",
    layout: "horizontal",
    contents: row.map((cell, i) => ({
      type: "text",
      text: cell,
      size: "xs",
      color: "#555555",
      align: i === 0 ? "start" : "center",
      flex: i === 0 ? 2 : 1
    })),
    backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#F5F5F5",
    paddingAll: "md"
  }));
  
  return {
    type: "flex",
    altText: title,
    contents: {
      type: "bubble",
      size: "mega",
      hero: {
        type: "image",
        url: LESSON_IMAGES.reference,
        size: "full",
        aspectRatio: "20:8",
        aspectMode: "cover"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            size: "lg",
            weight: "bold",
            color: "#333333"
          },
          {
            type: "text",
            text: "ข้อมูลอ้างอิงจาก IMT THAILAND",
            size: "xs",
            color: "#888888",
            margin: "sm"
          },
          {
            type: "separator",
            margin: "lg"
          },
          headerBox,
          ...rowBoxes
        ]
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "🌡️ ตารางอบ",
              text: "ตารางอบ"
            },
            flex: 1
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "❄️ ตารางเย็น",
              text: "ตารางเย็น"
            },
            flex: 1
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "message",
              label: "💪 แรงดัน",
              text: "ตารางแรงดัน"
            },
            flex: 1
          }
        ],
        flex: 0
      }
    }
  };
}

module.exports = {
  LESSON_IMAGES,
  LEVEL_COLORS,
  getImageUrl,
  createWelcomeFlexMessage,
  createLessonFlexMessage,
  createCurriculumFlexMessage,
  createLevelOverviewFlexMessage,
  createQuizFlexMessage,
  createQuizResultFlexMessage,
  createProgressFlexMessage,
  createReferenceTableFlexMessage
};
