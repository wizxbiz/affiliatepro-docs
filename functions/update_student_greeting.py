
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update handleFollowEvent to include Student button
old_quick_reply = """          { type: 'action', action: { type: 'message', label: '📊 คำนวณ', text: 'คำนวณ Cooling Time' } },
          { type: 'action', action: { type: 'message', label: '💎 สมัคร Premium', text: 'สนใจสมัคร Premium' } }
        ]
      }
    };"""

new_quick_reply = """          { type: 'action', action: { type: 'message', label: '📊 คำนวณ', text: 'คำนวณ Cooling Time' } },
          { type: 'action', action: { type: 'message', label: '👨‍🎓 นักเรียน/นักศึกษา', text: 'ผมเป็นนักศึกษาครับ' } },
          { type: 'action', action: { type: 'message', label: '💎 สมัคร Premium', text: 'สนใจสมัคร Premium' } }
        ]
      }
    };"""

# We need to be careful with matching. The text might have changed in previous edits.
# Let's look for the quickReply items in handleFollowEvent.
# It's near the end of the file.

# Let's try to find the specific block in handleFollowEvent
# It has `text: 'คำนวณ Cooling Time'`

start_qr = "text: 'คำนวณ Cooling Time' } },"
end_qr = "text: 'สนใจสมัคร Premium' } }"

if start_qr in content and end_qr in content:
    # We can insert the student button between them
    # But wait, I should check if I can replace the whole items array to be safe.
    pass

# Let's use a unique string from handleFollowEvent
unique_follow_str = "text: 'คำนวณ Cooling Time' } },"
student_btn = "\n          { type: 'action', action: { type: 'message', label: '👨‍🎓 นักเรียน/นักศึกษา', text: 'ผมเป็นนักศึกษาครับ' } },"

if unique_follow_str in content:
    # Check if already added
    if "ผมเป็นนักศึกษาครับ" not in content:
        # Find the last occurrence (handleFollowEvent is at the end)
        idx = content.rfind(unique_follow_str)
        if idx != -1:
            content = content[:idx + len(unique_follow_str)] + student_btn + content[idx + len(unique_follow_str):]
            print("Added Student button to handleFollowEvent")
    else:
        print("Student button already exists")

# 2. Add Student Greeting Handler
# Insert after User Help Command
help_marker = "// ℹ️ USER HELP COMMAND"
# Find the end of the help block. It ends with `return;` and `}` inside the if.
# The help block starts with `if (message.text.toLowerCase() === '/help' ...`

# Let's find the start of the help block
help_start = content.find(help_marker)
if help_start != -1:
    # Find the closing brace of the if block.
    # It has a nested if (!isSuperAdminCheck).
    # So we need to be careful.
    
    # Let's look for the next block marker or just append after the help block.
    # The next block is `// 👑 SUPER ADMIN CHECK` (line 5540 approx)
    
    next_marker = "// 👑 SUPER ADMIN CHECK"
    next_pos = content.find(next_marker, help_start)
    
    if next_pos != -1:
        student_handler = """    // 🎓 STUDENT GREETING
    if (message.text.includes('นักเรียน') || message.text.includes('นักศึกษา') || message.text.includes('student')) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: `สวัสดีครับน้องนักศึกษา 😊 มีอะไรให้พี่วิทย์ช่วยเหลือเกี่ยวกับการฉีดพลาสติกรึเปล่าครับ? ไม่ว่าจะเป็นเรื่องพื้นฐาน, เทคนิคขั้นสูง หรือการแก้ปัญหาหน้างาน พี่วิทย์ยินดีให้คำแนะนำเต็มที่เลยครับ! 📚\\n\\n` +
              `บอกมาได้เลยว่าน้องอยากรู้เรื่องอะไรเป็นพิเศษ หรือมีโจทย์อะไรที่กำลังทำอยู่ พี่วิทย์จะพยายามอธิบายให้เข้าใจง่ายที่สุด เหมือนมีติวเตอร์ส่วนตัวเลยครับ! 💪\\n\\n` +
              `---\\n` +
              `✨ พัฒนาโดย อาจารย์ วิทยา เทคนิคฉีดพลาสติก`
      });
      return;
    }

"""
        content = content[:next_pos] + student_handler + content[next_pos:]
        print("Added Student Greeting Handler")
    else:
        print("Could not find SUPER ADMIN CHECK marker")
else:
    print("Could not find USER HELP COMMAND marker")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
