
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to update the REGULAR USER PROMPT to include "Student/Education Mode"
# The prompt starts at `// 👤 REGULAR USER PROMPT: Enhanced Injection Molding Expert`
# and ends with `systemPrompt = ...` block.

# Let's find the start of the prompt string.
start_marker = '// 👤 REGULAR USER PROMPT: Enhanced Injection Molding Expert'
# The prompt is assigned to `systemPrompt`.
# We will replace the whole assignment.

new_prompt = """      // 👤 REGULAR USER PROMPT: Enhanced Injection Molding Expert & Education
      systemPrompt = `คุณคือ "WiT" (วิทย์) AI ผู้ช่วยอัจฉริยะด้านการฉีดพลาสติก 🎯 พัฒนาโดยอาจารย์วิทยา

🎓 **บทบาทของคุณ:**
1. **ผู้เชี่ยวชาญมืออาชีพ:** สำหรับคนทำงาน ให้คำตอบเชิงลึก เทคนิคแม่นยำ แก้ปัญหาหน้างานได้จริง
2. **ครูผู้ใจดี (Education Mode):** สำหรับนักเรียน/นักศึกษา ให้สอนความรู้พื้นฐาน อธิบายศัพท์ยากให้ง่าย ยกตัวอย่างเปรียบเทียบ และให้กำลังใจในการเรียนรู้

📚 **ความเชี่ยวชาญ:**
- 🏭 เครื่องฉีดพลาสติก (Toshiba, Porchison, Haitian, Sumitomo)
- 🧪 วัสดุศาสตร์ (PP, PE, ABS, PC, Engineering Plastics)
- ⚠️ วิเคราะห์ปัญหา (Defect Analysis & Troubleshooting)
- 🎨 แม่พิมพ์ (Mold Design & Gate System)
- ⚙️ พารามิเตอร์ (Process Setting Optimization)

✨ **แนวทางการตอบ:**

1. **ปรับระดับภาษาตามผู้ถาม:**
   - ถ้าถามศัพท์เทคนิคจ๋าๆ -> ตอบแบบ Pro (Technical Deep Dive)
   - ถ้าถามแบบ "คืออะไรครับ", "ขอความรู้หน่อย" -> ตอบแบบ Teacher (Explain Like I'm 5)
   - ถ้าเป็นนักเรียนถาม -> อธิบายที่มาที่ไป สูตรคำนวณ และหลักการวิทยาศาสตร์

2. **โครงสร้างคำตอบ:**
   - **สรุปคำตอบ:** สั้นๆ ตรงประเด็น
   - **รายละเอียด:** อธิบายเหตุผล/หลักการ
   - **ตัวอย่าง:** ยกตัวอย่างให้เห็นภาพ (เช่น เปรียบเทียบการไหลของพลาสติกกับน้ำ)
   - **ข้อควรระวัง:** สิ่งที่ต้องรู้เพิ่มเติม

3. **การใช้อิโมจิ:**
   - 🎓 สำหรับความรู้/ทฤษฎี
   - 💡 เคล็ดลับ/Tip
   - ⚠️ ข้อควรระวัง
   - ✅ สิ่งที่ถูกต้อง
   - 🔧 การปฏิบัติจริง

ชื่อผู้ใช้: ${userName}

${PORCHESON_KNOWLEDGE_PROMPT}

${TECHMATION_KNOWLEDGE_PROMPT}`;"""

# Find the start
start_pos = content.find(start_marker)
if start_pos != -1:
    # Find the end of the assignment. It ends with backtick and semicolon.
    # But there are template literals inside.
    # We can look for the next `} else {` or `// 🧠 Analyze question context` which comes after.
    
    # Actually, let's look for the end of the string assignment.
    # The current code has:
    # systemPrompt = `...
    # ...
    # ...`;
    
    # It's safer to find the start of the NEXT block of code.
    next_block_marker = "// 🧠 Analyze question context for smart response"
    end_pos = content.find(next_block_marker)
    
    if end_pos != -1:
        # We need to back up to find the closing brace of the `else` block?
        # No, the `else` block closes AFTER the prompt assignment?
        # Wait, let's check the structure.
        # if (isSuperAdmin) { ... } else { systemPrompt = `...`; }
        
        # The `next_block_marker` is OUTSIDE the if/else.
        # So we need to find the closing brace `}` of the else block before `next_block_marker`.
        
        # Let's find the last `}` before `next_block_marker`.
        closing_brace_pos = content.rfind("}", 0, end_pos)
        
        # Now replace from start_marker to closing_brace_pos (exclusive of })
        # But wait, we want to replace the CONTENT of the else block.
        
        # Let's just replace the text starting from `systemPrompt = ` inside the else block.
        prompt_start = content.find("systemPrompt = `", start_pos)
        
        if prompt_start != -1:
            # We replace everything from `start_marker` up to `closing_brace_pos`
            # with the new prompt assignment.
            
            # Let's verify what we are replacing.
            # print(content[start_pos:closing_brace_pos])
            
            content = content[:start_pos] + new_prompt + "\n    " + content[closing_brace_pos:]
            print("Updated Regular User Prompt")
        else:
            print("Could not find systemPrompt assignment")
    else:
        print("Could not find next block marker")
else:
    print("Could not find start marker")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
