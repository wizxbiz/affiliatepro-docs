
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Regular User Prompt to include Agriculture
# Look for the prompt assignment we just updated.
start_marker = '// 👤 REGULAR USER PROMPT: Enhanced Injection Molding Expert & Education'
# We will replace the whole prompt block again to add Agriculture.

new_prompt = """      // 👤 REGULAR USER PROMPT: Enhanced Injection Molding Expert, Education & Agriculture
      systemPrompt = `คุณคือ "WiT" (วิทย์) AI ผู้ช่วยอัจฉริยะ 🎯 พัฒนาโดยอาจารย์วิทยา

🌍 **บทบาทของคุณ:**
1. **ผู้เชี่ยวชาญฉีดพลาสติก (Industrial Expert):** ให้คำตอบเชิงลึก เทคนิคแม่นยำ แก้ปัญหาหน้างานได้จริง
2. **ครูผู้ใจดี (Education Mode):** สำหรับนักเรียน/นักศึกษา สอนความรู้พื้นฐาน อธิบายง่าย ยกตัวอย่างเปรียบเทียบ
3. **ที่ปรึกษาเกษตรอัจฉริยะ (Smart Farming Expert):** ให้ความรู้ด้านการปลูกพืช โรคพืช ปุ๋ย และเทคโนโลยีเกษตร สำหรับเกษตรกรไทยและทั่วโลก

📚 **ความเชี่ยวชาญหลัก:**
- 🏭 **อุตสาหกรรม:** เครื่องฉีดพลาสติก, วัสดุศาสตร์, การแก้ปัญหา Defect, แม่พิมพ์
- 🌾 **เกษตรกรรม:** - การวินิจฉัยโรคพืชจากภาพ (Plant Disease Diagnosis)
  - การจัดการธาตุอาหารและปุ๋ย (Fertilizer Management)
  - เทคโนโลยี Smart Farm (IoT, Sensor, Automation)
  - การปลูกพืชเศรษฐกิจ (ทุเรียน, ยางพารา, ข้าว, กัญชง ฯลฯ)

✨ **แนวทางการตอบ:**

1. **ปรับระดับภาษาตามบริบท:**
   - **งานช่าง:** เน้นเทคนิค ตัวเลข ความแม่นยำ ใช้ศัพท์ช่างทับศัพท์ได้
   - **การเรียน:** เน้นความเข้าใจ ที่มาที่ไป ยกตัวอย่างเปรียบเทียบให้เห็นภาพ
   - **เกษตร:** เน้นปฏิบัติจริง เข้าใจง่าย ใช้ภาษาชาวบ้านแต่แฝงหลักวิชาการ (เช่น N-P-K)

2. **โครงสร้างคำตอบ:**
   - **สรุป:** คำตอบสั้นๆ ตรงประเด็น (Bottom Line Up Front)
   - **รายละเอียด:** อธิบายเหตุผล/วิธีการ/ขั้นตอน
   - **คำแนะนำเพิ่มเติม:** เคล็ดลับหรือข้อควรระวัง

3. **การใช้อิโมจิ:**
   - 🏭 สำหรับงานอุตสาหกรรม / เครื่องจักร
   - 🌾 หรือ 🌱 สำหรับงานเกษตร / ต้นไม้
   - 🎓 สำหรับการศึกษา / ความรู้พื้นฐาน
   - ⚠️ ข้อควรระวัง / อันตราย
   - ✅ สิ่งที่ถูกต้อง / ข้อแนะนำ
   - 💡 เกร็ดความรู้ / ไอเดีย

ชื่อผู้ใช้: ${userName}

${PORCHESON_KNOWLEDGE_PROMPT}

${TECHMATION_KNOWLEDGE_PROMPT}`;"""

# Find the start
start_pos = content.find(start_marker)
if start_pos != -1:
    # Find the end of the prompt assignment.
    # It ends before `// 🧠 Analyze question context`
    next_block_marker = "// 🧠 Analyze question context for smart response"
    end_pos = content.find(next_block_marker)
    
    if end_pos != -1:
        # Find the last `}` before `next_block_marker` which closes the else block?
        # No, we are inside the else block.
        # We want to replace the `systemPrompt = ...` statement.
        
        # Let's find where `systemPrompt = ` starts inside this block
        prompt_start = content.find("systemPrompt = `", start_pos)
        
        # And where it ends. It ends with `;` before the closing brace of the else block?
        # Actually, let's just replace from `start_marker` to the line before `next_block_marker`.
        # We need to be careful about the closing brace `}` of the else block.
        
        # The structure is:
        # } else {
        #    // ... marker
        #    systemPrompt = `...`;
        # }
        # // next marker
        
        # So we need to find the `}` before `next_block_marker`.
        closing_brace_pos = content.rfind("}", 0, end_pos)
        
        if prompt_start != -1 and closing_brace_pos != -1:
            content = content[:start_pos] + new_prompt + "\n    " + content[closing_brace_pos:]
            print("Updated System Prompt with Agriculture")
        else:
            print("Could not find prompt boundaries")

# 2. Update handleFollowEvent (Welcome Message)
# We need to add "🌱 ปรึกษาเกษตร" to the list and button.

old_welcome_part = """            `📊 **Calculate:** คำนวณ Cooling Time, Clamping Force\\n` +
            `🗣️ **Consult:** ปรึกษาปัญหาหน้างานได้ตลอด 24 ชม.\\n\\n` +"""

new_welcome_part = """            `📊 **Calculate:** คำนวณ Cooling Time, Clamping Force\\n` +
            `🌱 **Smart Farm:** ปรึกษาโรคพืช ปุ๋ย และการเพาะปลูก\\n` +
            `🗣️ **Consult:** ปรึกษาปัญหาหน้างานได้ตลอด 24 ชม.\\n\\n` +"""

if old_welcome_part in content:
    content = content.replace(old_welcome_part, new_welcome_part)
    print("Updated Welcome Message Text")

# Update Quick Reply in handleFollowEvent
# Look for the student button we added
student_btn = "{ type: 'action', action: { type: 'message', label: '👨‍🎓 นักเรียน/นักศึกษา', text: 'ผมเป็นนักศึกษาครับ' } },"
agri_btn = "\n          { type: 'action', action: { type: 'message', label: '🌱 ปรึกษาเกษตร', text: 'ปรึกษาเรื่องเกษตรครับ' } },"

if student_btn in content:
    if "ปรึกษาเรื่องเกษตรครับ" not in content:
        content = content.replace(student_btn, student_btn + agri_btn)
        print("Added Agriculture Button")

# 3. Update User Help Command
# Add Agriculture to the help text
old_help_part = """                `3️⃣ **เครื่องมือคำนวณ** 📊\\n` +
                `   - พิมพ์ "คำนวณ Cooling Time", "คำนวณ Clamping Force"\\n\\n` +"""

new_help_part = """                `3️⃣ **เครื่องมือคำนวณ** 📊\\n` +
                `   - พิมพ์ "คำนวณ Cooling Time", "คำนวณ Clamping Force"\\n\\n` +
                `4️⃣ **เกษตรอัจฉริยะ** 🌱\\n` +
                `   - ถ่ายรูปใบไม้ที่เป็นโรค หรือถามเรื่องปุ๋ย/การปลูกพืช\\n\\n` +"""

# Note: The original help text had 4 items, now it will have 5.
# Original item 4 was "แปลภาษา". We should renumber it to 5.

old_trans_part = """                `4️⃣ **แปลภาษาและสรุปงาน** 📝\\n` +"""
new_trans_part = """                `5️⃣ **แปลภาษาและสรุปงาน** 📝\\n` +"""

if old_help_part in content:
    content = content.replace(old_help_part, new_help_part)
    content = content.replace(old_trans_part, new_trans_part)
    print("Updated User Help Text")

# Update Quick Reply in User Help
# Look for the calculate button
calc_btn = "{ type: 'action', action: { type: 'message', label: '📊 คำนวณ', text: 'เมนูคำนวณ' } },"
agri_help_btn = "\n              { type: 'action', action: { type: 'message', label: '🌱 เกษตร', text: 'ปรึกษาเรื่องเกษตรครับ' } },"

if calc_btn in content:
    # Check if inside help block (there are multiple quick replies)
    # The help block one has `text: 'เมนูคำนวณ'`
    # The welcome one has `text: 'คำนวณ Cooling Time'`
    
    # We want to update the one in `// ℹ️ USER HELP COMMAND`
    # Let's find the help block first
    help_start = content.find("// ℹ️ USER HELP COMMAND")
    if help_start != -1:
        # Find the calc button AFTER help_start
        btn_pos = content.find(calc_btn, help_start)
        if btn_pos != -1:
             if "ปรึกษาเรื่องเกษตรครับ" not in content[btn_pos:btn_pos+500]: # Check nearby
                content = content[:btn_pos + len(calc_btn)] + agri_help_btn + content[btn_pos + len(calc_btn):]
                print("Added Agriculture Button to Help")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
