
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the helpText
old_help_text_start = "const helpText = `👑 **คำสั่ง Admin อัจฉริยะ**\\n\\n` +"
old_help_text_end = '`• "ดูคลังความรู้"`;'

new_help_text = """const helpText = `👑 **คำสั่ง Admin อัจฉริยะ**\\n\\n` +
                        `📅 **/daily** - สรุปยอดวันนี้\\n` +
                        `📋 **/pending** - รายการรออนุมัติ\\n` +
                        `💎 **/premium** - รายงานรายได้\\n` +
                        `📊 **/stats** - สถิติรวม\\n` +
                        `🏆 **/top** - Top 10 Users\\n` +
                        `🕒 **/recent** - ใช้งานล่าสุด\\n` +
                        `🧠 **/knowledge** - คลังความรู้\\n\\n` +
                        `📢 **/broadcast [ข้อความ]** - ประกาศ\\n` +
                        `📩 **/reply [ID] [ข้อความ]** - ตอบกลับ\\n` +
                        `✅ **/approve [ID]** - อนุมัติ\\n` +
                        `👤 **/user [ID]** - ดูข้อมูล\\n` +
                        `🔍 **/verify [ID]** - ยืนยันความรู้`;"""

# Find the start and end indices
start_index = content.find(old_help_text_start)
if start_index == -1:
    print("Could not find start of helpText")
    # Try to print what we found around there to debug
    # print(content[5900:6000])
else:
    end_index = content.find(old_help_text_end, start_index)
    if end_index == -1:
        print("Could not find end of helpText")
    else:
        # Replace the text
        # We need to include the end string in the replacement or keep it?
        # The old_help_text_end is part of the string to be replaced.
        
        # Actually, let's just replace the whole block if we can find the boundaries.
        # It's safer to replace the exact string if we can construct it.
        
        # Let's try to construct the old string from the file content directly to be sure.
        pass

# Let's try a different approach: Replace by known unique substrings
# The duplicate line: `🏆 **/top** - รายงานผู้ใช้ล่าสุด\n` +
duplicate_line = "`🏆 **/top** - รายงานผู้ใช้ล่าสุด\\n` +"
if duplicate_line in content:
    print("Found duplicate line, removing it...")
    content = content.replace(duplicate_line + "\n", "") # Try with newline
    content = content.replace(duplicate_line, "") # Try without newline if above fails

# Now add Quick Reply
# Find: await lineClient.replyMessage(replyToken, {
#           type: 'text',
#           text: helpText
#         });
# Inside the help block.

search_str = """        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: helpText
        });"""

replace_str = """        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: helpText,
          quickReply: {
            items: [
              { type: 'action', action: { type: 'message', label: '📅 สรุปวันนี้', text: '/daily' } },
              { type: 'action', action: { type: 'message', label: '📋 รออนุมัติ', text: '/pending' } },
              { type: 'action', action: { type: 'message', label: '💎 รายได้', text: '/premium' } },
              { type: 'action', action: { type: 'message', label: '📊 สถิติ', text: '/stats' } },
              { type: 'action', action: { type: 'message', label: '🏆 Top 10', text: '/top' } },
              { type: 'action', action: { type: 'message', label: '🕒 ล่าสุด', text: '/recent' } },
              { type: 'action', action: { type: 'message', label: '🧠 คลังความรู้', text: '/knowledge' } },
              { type: 'action', action: { type: 'message', label: '📢 ประกาศ', text: '/broadcast ' } }
            ]
          }
        });"""

if search_str in content:
    print("Found replyMessage block, replacing...")
    content = content.replace(search_str, replace_str)
else:
    print("Could not find replyMessage block")
    # Debug: print surrounding
    idx = content.find("await lineClient.replyMessage(replyToken, {")
    if idx != -1:
        print("Found start of replyMessage at", idx)
        print(content[idx:idx+200])

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
