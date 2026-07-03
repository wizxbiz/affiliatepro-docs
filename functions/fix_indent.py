
import os
import re

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Use regex to fix the indentation of the recent line
# Look for the line with /recent and replace it with correct indentation
pattern = re.compile(r'\s+`🕒 \*\*/recent\*\* - Recent Users\\n` \+')
replacement = '                        `🕒 **/recent** - ใช้งานล่าสุด\\n` +'

content = re.sub(pattern, replacement, content)

# Update other descriptions
replacements = {
    '`📢 **/broadcast [ข้อความ]** - ประกาศถึงคน Active\\n`': '`📢 **/broadcast [ข้อความ]** - ประกาศ\\n`',
    '`📩 **/reply [ID] [ข้อความ]** - ตอบกลับส่วนตัว\\n`': '`📩 **/reply [ID] [ข้อความ]** - ตอบกลับ\\n`',
    '`👤 **/user [ID]** - ดูข้อมูลผู้ใช้\\n\\n`': '`👤 **/user [ID]** - ดูข้อมูล\\n\\n`'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
