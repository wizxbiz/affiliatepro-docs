
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Subscription Request (General)
# Search for: // 3. Handle General Subscription Request
# Replace the block with enhanced message about Team and Group Code

old_sub_req_start = "// 3. Handle General Subscription Request"
old_sub_req_end = '      return;\n    }'

# We need to find the exact block.
# Let's construct the new block first.

new_sub_req_block = """    // 3. Handle General Subscription Request
    if (message.text.includes('สนใจสมัคร') || message.text.includes('สมัครสมาชิก') || message.text.includes('ขอสมัคร') || message.text.toLowerCase().includes('upgrade') || message.text.includes('/upgrade')) {
      console.log(`💰 User ${userId} requested subscription info`);

      await userRef.set({
        subscriptionStatus: 'interested',
        lastRequestAt: FieldValue.serverTimestamp()
      }, { merge: true });

      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: `💎 **อัปเกรดเป็น Premium** 💎\\n` +
              `ปลดล็อคขีดจำกัด เพื่อการทำงานที่เหนือกว่า!\\n\\n` +
              `👤 **แพ็คเกจส่วนตัว (Individual):**\\n` +
              `• รายเดือน: **99฿** (เฉลี่ย 3฿/วัน)\\n` +
              `• 3 เดือน: **259฿** (ประหยัด 12%)\\n` +
              `• รายปี: **699฿** 🔥 (คุ้มที่สุด! เฉลี่ย 1.9฿/วัน)\\n\\n` +
              `🏢 **แพ็คเกจทีม (Team & Organization):**\\n` +
              `เหมาะสำหรับโรงงานหรือทีมงาน 5 ท่านขึ้นไป\\n` +
              `✅ **แชร์สิทธิ์:** จ่ายครั้งเดียว ใช้ได้ทั้งทีม\\n` +
              `✅ **Group Code:** ระบบรหัสกลุ่ม ดึงลูกน้องเข้าทีมง่ายๆ\\n` +
              `✅ **Dashboard:** หัวหน้าดูภาพรวมการใช้งานได้ (เร็วๆนี้)\\n\\n` +
              `💰 **ราคาเหมาทีม (5 Users):**\\n` +
              `• รายเดือน: **399฿** (ตกคนละ 80฿)\\n` +
              `• รายปี: **2,490฿** 🏆 (ตกคนละ 41฿/เดือน)\\n\\n` +
              `📝 **วิธีสมัคร:**\\n` +
              `พิมพ์ "เลือกรายเดือน", "เลือกรายปี" หรือ "เลือกทีมรายปี" ได้เลยครับ`,
        quickReply: {
          items: [
            { type: 'action', action: { type: 'message', label: '👤 รายเดือน (99฿)', text: 'เลือกรายเดือน' } },
            { type: 'action', action: { type: 'message', label: '🔥 รายปี (699฿)', text: 'เลือกรายปี' } },
            { type: 'action', action: { type: 'message', label: '🏢 ทีมรายเดือน (399฿)', text: 'เลือกทีมรายเดือน' } },
            { type: 'action', action: { type: 'message', label: '🏆 ทีมรายปี (2,490฿)', text: 'เลือกทีมรายปี' } }
          ]
        }
      });
      return;
    }"""

# Find and replace logic for Subscription Request
# I'll use a simpler replace if I can match a unique string inside the block
unique_sub_str = "`💎 สมัครสมาชิก Premium 💎\\n` +"
if unique_sub_str in content:
    # Find the start of the if block
    start_idx = content.rfind("if (message.text.includes('สนใจสมัคร')", 0, content.find(unique_sub_str))
    # Find the end of the block (return;)
    end_idx = content.find("return;", content.find(unique_sub_str)) + 7
    # Check for closing brace
    end_idx = content.find("}", end_idx) + 1
    
    # Replace
    # content = content[:start_idx] + new_sub_req_block + content[end_idx:] # This is risky if indices are wrong
    
    # Safer: Replace the text content inside the replyMessage
    # But I want to add QuickReply too.
    pass

# Let's use the replace_string_in_file tool logic via python script
# I will replace the whole block identified by the comment
start_marker = "// 3. Handle General Subscription Request"
end_marker = '// 2. Check User Status & Quota'

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos != -1 and end_pos != -1:
    # Extract the block to be replaced
    block_to_replace = content[start_pos:end_pos]
    # Construct new block (ensure it ends with newlines to match spacing)
    content = content.replace(block_to_replace, new_sub_req_block + "\n\n    ")
    print("Updated Subscription Request Block")

# 2. Update Quota Reached Message
# Search for: // Check Quota (If not Premium)
# And the message inside: `💎 **หมดโควต้าใช้งานฟรีแล้วครับ** 💎\n\n`

quota_marker = "if (userData.usageCount >= 15) {"
quota_msg_start = "`💎 **หมดโควต้าใช้งานฟรีแล้วครับ** 💎\\n\\n` +"

new_quota_msg = """        await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: `💎 **หมดโควต้าใช้งานฟรีวันนี้แล้วครับ** 💎\\n\\n` +
              `คุณใช้งานครบ 15 ครั้งแล้วสำหรับวันนี้ 🛑\\n` +
              `เพื่อให้งานไม่สะดุด อัปเกรดเป็น Premium เลยไหมครับ?\\n\\n` +
              `🚀 **สิทธิพิเศษ Premium:**\\n` +
              `✅ ใช้งาน AI ได้ **ไม่จำกัด** ตลอด 24 ชม.\\n` +
              `✅ **วิเคราะห์ภาพ** ได้แม่นยำและรวดเร็วกว่า\\n` +
              `✅ **Group Code:** หากบริษัทมีแพ็คเกจทีมอยู่แล้ว พิมพ์รหัสกลุ่มเพื่อเข้าร่วมได้เลย!\\n\\n` +
              `👇 **เลือกแพ็คเกจคุ้มค่า:**`,
        quickReply: {
          items: [
            { type: 'action', action: { type: 'message', label: '👤 รายเดือน (99฿)', text: 'เลือกรายเดือน' } },
            { type: 'action', action: { type: 'message', label: '🔥 รายปี (699฿)', text: 'เลือกรายปี' } },
            { type: 'action', action: { type: 'message', label: '🏢 ทีมรายปี (2,490฿)', text: 'เลือกทีมรายปี' } },
            { type: 'action', action: { type: 'message', label: '🔑 ใส่รหัสกลุ่ม', text: 'ใส่รหัสกลุ่ม' } }
          ]
        }
      });"""

if quota_msg_start in content:
    # Find the start of replyMessage inside the quota block
    # It's inside `if (userData.usageCount >= 15) {`
    # Let's find the block
    q_start = content.find(quota_marker)
    if q_start != -1:
        msg_start = content.find("await lineClient.replyMessage(replyToken, {", q_start)
        msg_end = content.find("});", msg_start) + 3
        
        if msg_start != -1 and msg_end != -1:
            content = content[:msg_start] + new_quota_msg + content[msg_end:]
            print("Updated Quota Reached Message")

# 3. Implement Group Code Logic
# We need to handle "ใส่รหัสกลุ่ม" or "Join <Code>"
# Let's add this logic BEFORE "Handle Package Selection" or as part of it.
# Let's add it as a new block: // 0. Handle Group Code Joining

group_code_logic = """    // 0. Handle Group Code Joining
    if (message.text.startsWith('JOIN-') || message.text.startsWith('join-') || message.text === 'ใส่รหัสกลุ่ม') {
      if (message.text === 'ใส่รหัสกลุ่ม') {
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `🔑 **กรุณาพิมพ์รหัสกลุ่มของคุณ**\\n\\nเช่น: JOIN-KCT2024\\n(ขอรหัสได้จากหัวหน้าทีมหรือฝ่ายบุคคล)`
        });
        return;
      }

      const code = message.text.split('-')[1].toUpperCase().trim();
      // Check code in Firestore (Assuming we have a 'teams' collection or hardcoded for now)
      // For demo, let's support a demo code 'DEMO2024' or check 'teams' collection
      
      const teamsRef = db.collection('teams');
      const teamQuery = await teamsRef.where('code', '==', code).get();
      
      if (!teamQuery.empty || code === 'DEMO2024') { // Allow DEMO2024 for testing
        let teamName = 'Demo Team';
        let teamId = 'demo_team_id';
        
        if (!teamQuery.empty) {
          const teamDoc = teamQuery.docs[0];
          teamName = teamDoc.data().name;
          teamId = teamDoc.id;
        }

        await userRef.update({
          isPremium: true,
          subscriptionStatus: 'active_team',
          teamId: teamId,
          teamName: teamName,
          joinedTeamAt: FieldValue.serverTimestamp()
        });

        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `🎉 **ยินดีต้อนรับสู่ทีม ${teamName}!**\\n\\n` +
                `คุณได้รับสิทธิ์ Premium แบบทีมเรียบร้อยแล้ว ✅\\n` +
                `เริ่มใช้งานฟีเจอร์ทั้งหมดได้ทันทีครับ 🚀`
        });
      } else {
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `❌ **รหัสกลุ่มไม่ถูกต้อง**\\nกรุณาตรวจสอบรหัสอีกครั้ง หรือติดต่อหัวหน้าทีมครับ`
        });
      }
      return;
    }

"""

# Insert this before // 1. Handle Package Selection
insert_point = "// 1. Handle Package Selection"
if insert_point in content:
    content = content.replace(insert_point, group_code_logic + insert_point)
    print("Inserted Group Code Logic")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
