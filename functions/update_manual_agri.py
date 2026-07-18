
import os

file_path = r'd:\Flutterapp\caculateapp\LINE_BOT_MANUAL.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Smart Farming section
# We can add it after "Diagnostic AI" or "Digital Logbook".
# Let's add it after "Diagnostic AI" (Section 2).

new_section = """
---

## 🌱 3. เกษตรอัจฉริยะ (Smart Farming)
*ขยายขีดความสามารถสู่ภาคการเกษตร*

*   **วินิจฉัยโรคพืช:** ถ่ายรูปใบไม้ที่มีอาการผิดปกติ ส่งมาให้ AI วิเคราะห์
*   **ปรึกษาการเพาะปลูก:** ถามเรื่องปุ๋ย ดิน หรือเทคนิคการปลูกพืชเศรษฐกิจ
    *   ตัวอย่าง: "ทุเรียนใบเหลืองแก้ยังไง", "สูตรปุ๋ยยางพารา", "วิธีปลูกกัญชง"
*   **ครอบคลุม:** พืชเศรษฐกิจไทยและทั่วโลก (ทุเรียน, ข้าว, ยางพารา, ฯลฯ)
"""

# Find Section 2 end
section_2_marker = "## 🔍 2. นักวินิจฉัยปัญหา (Diagnostic AI)"
next_section_marker = "## 📱 3. Digital Logbook (ระบบบันทึกการผลิต)"

start_pos = content.find(section_2_marker)
end_pos = content.find(next_section_marker)

if start_pos != -1 and end_pos != -1:
    # Insert before Section 3
    # Also need to renumber Section 3 and subsequent sections if any.
    
    # Let's just replace "## 📱 3. Digital Logbook" with "## 📱 4. Digital Logbook"
    # and insert the new section before it.
    
    content = content.replace("## 📱 3. Digital Logbook", "## 📱 4. Digital Logbook")
    
    # Now insert new section before "## 📱 4. Digital Logbook"
    insert_pos = content.find("## 📱 4. Digital Logbook")
    content = content[:insert_pos] + new_section + "\n" + content[insert_pos:]
    
    # Check if there are more sections to renumber
    if "## 4. " in content: # Wait, I just renamed it to 4.
        pass
        
    # Check for Section 4 (Admin Tools) -> Renumber to 5
    if "## 👑 4. Admin Tools" in content:
        content = content.replace("## 👑 4. Admin Tools", "## 👑 5. Admin Tools")
        
    # Check for Section 5 (Education) -> Renumber to 6
    if "## 🎓 5. โหมดการศึกษา" in content:
        content = content.replace("## 🎓 5. โหมดการศึกษา", "## 🎓 6. โหมดการศึกษา")

    print("Updated Manual with Smart Farming section")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
