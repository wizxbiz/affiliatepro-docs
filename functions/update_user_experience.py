
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update handleFollowEvent
old_welcome = """    const welcomeMessage = {
      type: 'text',
      text: `สวัสดีครับคุณ ${profile.displayName}! 👋\\n\\n` +
            `ยินดีต้อนรับสู่ระบบ AI ที่ปรึกษาด้านการฉีดพลาสติก\\n\\n` +
            `ผมพร้อมช่วยเหลือคุณในเรื่อง:\\n` +
            `🔧 แก้ปัญหาข้อบกพร่อง\\n` +
            `📊 คำนวณค่าต่างๆ\\n` +
            `⚙️ ตั้งค่าพารามิเตอร์\\n` +
            `📐 ออกแบบแม่พิมพ์\\n` +
            `🧪 เลือกวัสดุ\\n\\n` +
            `เริ่มต้นด้วยการถามคำถามได้เลยครับ!`
    };"""

new_welcome = """    const welcomeMessage = {
      type: 'text',
      text: `สวัสดีครับคุณ ${profile.displayName}! 👋\\n\\n` +
            `ยินดีต้อนรับสู่ **WiT ผู้ช่วยอัจฉริยะด้านการฉีดพลาสติก** 🤖\\n\\n` +
            `ผมมีความสามารถรอบด้านเพื่อช่วยงานคุณ:\\n` +
            `👁️ **AI Vision:** ส่งรูปชิ้นงานเสียมาให้ผมวิเคราะห์\\n` +
            `🧠 **Knowledge:** ถามปัญหาเทคนิค ผมตอบได้ทันที\\n` +
            `📊 **Calculate:** คำนวณ Cooling Time, Clamping Force\\n` +
            `🗣️ **Consult:** ปรึกษาปัญหาหน้างานได้ตลอด 24 ชม.\\n\\n` +
            `👇 **ลองกดเมนูด้านล่าง หรือพิมพ์ถามได้เลยครับ!**`,
      quickReply: {
        items: [
          { type: 'action', action: { type: 'message', label: '👁️ วิเคราะห์ภาพ', text: 'วิเคราะห์ภาพ' } },
          { type: 'action', action: { type: 'message', label: '❓ ถามปัญหา', text: 'รอยไหม้เกิดจากอะไร' } },
          { type: 'action', action: { type: 'message', label: '📊 คำนวณ', text: 'คำนวณ Cooling Time' } },
          { type: 'action', action: { type: 'message', label: '💎 สมัคร Premium', text: 'สนใจสมัคร Premium' } }
        ]
      }
    };"""

if old_welcome in content:
    content = content.replace(old_welcome, new_welcome)
    print("Updated handleFollowEvent")
else:
    print("Could not find old welcome message")
    # Debug: print a snippet
    idx = content.find("const welcomeMessage = {")
    if idx != -1:
        print(content[idx:idx+200])

# 2. Add User Help Command (before Admin Check or inside non-admin flow)
# We need to find where to insert it.
# It should be before "Check Quota" or inside the main flow.
# Let's look for `// 2. Check User Status & Quota` which is around line 5680 in previous reads.
# But wait, the user might type /help and not be admin.
# Currently, the code checks for admin FIRST, then processes admin commands.
# If not admin, it falls through.
# So we should add a check for /help for regular users.

# Let's insert it right after `// 2. Check User Status & Quota` block starts, or before the Admin check.
# Actually, let's put it BEFORE the Admin check so everyone can use it, but if it's admin, the admin block might override or we handle it separately.
# The Admin check is:
#     // 👑 SUPER ADMIN CHECK
#     const SUPER_ADMIN_ID = 'Ud9bec6d2ea945cf4330a69cb74ac93cf';
#     const isSuperAdmin = (userId === SUPER_ADMIN_ID);

# We can add the User Help block right BEFORE this check.

insert_marker = "// 👑 SUPER ADMIN CHECK"
user_help_block = """    // ℹ️ USER HELP COMMAND
    if (message.text.toLowerCase() === '/help' || message.text.includes('วิธีใช้') || message.text.includes('ช่วยด้วย') || message.text === 'help') {
      const isSuperAdminCheck = (userId === 'Ud9bec6d2ea945cf4330a69cb74ac93cf');
      
      if (!isSuperAdminCheck) {
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `🤖 **คู่มือการใช้งาน AI อัจฉริยะ**\\n\\n` +
                `ผมสามารถช่วยคุณได้หลายด้านครับ:\\n\\n` +
                `1️⃣ **วิเคราะห์ภาพ (AI Vision)** 👁️\\n` +
                `   - พิมพ์ "วิเคราะห์ภาพ" หรือส่งรูปชิ้นงานมาได้เลย\\n\\n` +
                `2️⃣ **ถาม-ตอบ ปัญหาเทคนิค** 🧠\\n` +
                `   - พิมพ์คำถาม เช่น "รอยไหม้แก้ยังไง", "Short shot เกิดจากอะไร"\\n\\n` +
                `3️⃣ **เครื่องมือคำนวณ** 📊\\n` +
                `   - พิมพ์ "คำนวณ Cooling Time", "คำนวณ Clamping Force"\\n\\n` +
                `4️⃣ **แปลภาษาและสรุปงาน** 📝\\n` +
                `   - ส่งข้อความยาวๆ ให้สรุป หรือให้แปลภาษาได้เลย\\n\\n` +
                `💡 *เคล็ดลับ: พิมพ์เหมือนคุยกับเพื่อน ผมเข้าใจภาษาธรรมชาติครับ*`,
          quickReply: {
            items: [
              { type: 'action', action: { type: 'message', label: '👁️ วิเคราะห์ภาพ', text: 'วิเคราะห์ภาพ' } },
              { type: 'action', action: { type: 'message', label: '❓ ถามปัญหา', text: 'รอยไหม้เกิดจากอะไร' } },
              { type: 'action', action: { type: 'message', label: '📊 คำนวณ', text: 'เมนูคำนวณ' } },
              { type: 'action', action: { type: 'message', label: '💎 สมัคร Premium', text: 'สนใจสมัคร Premium' } }
            ]
          }
        });
        return;
      }
    }

"""

if insert_marker in content:
    content = content.replace(insert_marker, user_help_block + insert_marker)
    print("Inserted User Help Command")
else:
    print("Could not find SUPER ADMIN CHECK marker")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
