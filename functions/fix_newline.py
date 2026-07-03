
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "const helpText = `👑 **คำสั่ง Admin อัจฉริยะ**\\n\\n` +"
end_marker = '`• "ดูคลังความรู้"`;'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_marker)
    
    new_block = """const helpText = `👑 **คำสั่ง Admin อัจฉริยะ**\\n\\n` +
                        `📅 **/daily** - สรุปยอดวันนี้\\n` +
                        `📢 **/broadcast [ข้อความ]** - ประกาศ\\n` +
                        `📩 **/reply [ID] [ข้อความ]** - ตอบกลับ\\n` +
                        `💎 **/premium** - รายงานรายได้\\n` +
                        `📋 **/pending** - รายการรออนุมัติ\\n` +
                        `✅ **/approve [ID]** - อนุมัติ\\n` +
                        `📊 **/stats** - สถิติรวม\\n` +
                        `🏆 **/top** - Top 10 Users\\n` +
                        `🕒 **/recent** - ใช้งานล่าสุด\\n` +
                        `👤 **/user [ID]** - ดูข้อมูล\\n\\n` +
                        `🧠 **คลังสมองเฉพาะถิ่น:**\\n` +
                        `• **/knowledge** - สถิติคลังความรู้\\n` +
                        `• **/verify [ID]** - ยืนยันความรู้\\n\\n` +
                        `🗣️ **คำสั่งภาษาธรรมชาติ:**\\n` +
                        `• "สรุปปัญหาล่าสุด"\\n` +
                        `• "สถานะระบบ"\\n` +
                        `• "เคลียร์ cache"\\n` +
                        `• "ดูคลังความรู้"`;"""
                        
    content = content[:start_idx] + new_block + content[end_idx:]
    print("Replaced whole block")
else:
    print("Could not find block")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
