
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Logic:
# Currently, the code checks `if (userData.imageMode === 'vision_diagnosis')` to process image with AI.
# If not in that mode, it assumes it's a slip upload.
# The user wants:
# 1. If user sends an image (slip or QR or anything), process it with AI Vision AUTOMATICALLY without needing /vision command.
# 2. If it's a slip (detected by AI), notify Admin immediately.
# 3. If it's a defect/QR/other, reply to user with analysis.

# So we need to REMOVE the `if (userData.imageMode === 'vision_diagnosis')` check and make it the DEFAULT behavior for ALL images.
# But we still need to distinguish between "Slip" (to notify admin) and "Other" (to reply to user).
# We can use the AI response to determine this!
# The prompt already has "กรณีที่ 4: เป็นสลิปโอนเงิน".
# We can parse the AI response. If it contains "สลิปโอนเงิน" or "ยอดเงิน", we treat it as a slip.

# Plan:
# 1. Remove the `if (userData.imageMode === 'vision_diagnosis')` check.
# 2. Move the AI processing logic to be the main handler for `message.type === 'image'`.
# 3. Inside the AI success block:
#    - Check if the `text` result indicates a Slip.
#    - If Slip: Save to Firestore, Notify Admin, Reply to User (Slip received).
#    - If Not Slip: Reply to User with AI Analysis (Defect/QR/etc).

# Let's construct the new `if (message.type === 'image')` block.

new_image_handler = """  // Handle Image Messages (Auto Vision & Slip Detection)
  if (message.type === 'image') {
    console.log(`📸 Image received from ${userId}`);

    try {
      // 1. Notify user that analysis is starting
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '👁️ **กำลังวิเคราะห์ภาพ...**\\nระบบกำลังตรวจสอบว่าเป็นสลิปโอนเงิน หรือชิ้นงาน ⏳'
      });

      // 2. Get Image Content from LINE
      const stream = await lineClient.getMessageContent(message.id);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      // 3. Initialize Gemini Vision
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

      // 4. Prepare Prompt
      const prompt = `
      คุณคือ "WiT" (วิทย์) AI ผู้ช่วยอัจฉริยะ
      
      ภารกิจ: วิเคราะห์ภาพนี้และระบุประเภทของภาพ:
      
      1. **ถ้าเป็น "สลิปโอนเงิน" (Bank Slip):**
         - ให้ขึ้นต้นด้วยคำว่า "SLIP_DETECTED"
         - ระบุยอดเงิน, ธนาคาร, วันที่, เวลา
      
      2. **ถ้าเป็น "QR Code" หรือ "Barcode":**
         - อ่านข้อมูลใน QR/Barcode ออกมาให้หมด
      
      3. **ถ้าเป็น "ชิ้นงานพลาสติก" หรือ "เครื่องจักร":**
         - วิเคราะห์ปัญหา (Defect) หรือสิ่งที่เห็น
         - แนะนำวิธีแก้ไข
      
      4. **อื่นๆ:**
         - อธิบายสิ่งที่เห็น
      
      ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย`;

      const imagePart = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      // 5. Generate Content
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      console.log(`👁️ AI Analysis Result: ${text.substring(0, 50)}...`);

      // 6. Check if it is a SLIP
      if (text.includes('SLIP_DETECTED') || text.includes('สลิปโอนเงิน') || (text.includes('โอนเงิน') && text.includes('บาท'))) {
        console.log('💰 Slip detected by AI');
        
        const db = getFirestore();
        const userRef = db.collection('line_users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // Get user profile
        let userName = 'ผู้ใช้ไม่ระบุชื่อ';
        try {
          const profile = await lineClient.getProfile(userId);
          userName = profile.displayName;
        } catch (err) { console.warn('Cannot get profile:', err.message); }

        // Save slip info
        await userRef.set({
          lastSlipUploadAt: FieldValue.serverTimestamp(),
          slipImageId: message.id,
          displayName: userName,
          subscriptionStatus: 'slip_uploaded',
          slipAnalysis: text // Save AI analysis of slip
        }, { merge: true });

        // Notify Super Admin
        const SUPER_ADMIN_ID = 'Ud9bec6d2ea945cf4330a69cb74ac93cf';
        await lineClient.pushMessage(SUPER_ADMIN_ID, {
          type: 'text',
          text: `🔔 **มีสลิปการชำระเงินใหม่!** (AI ตรวจจับ)\\n\\n` +
                `👤 ชื่อ: ${userName}\\n` +
                `🆔 ID: ${userId}\\n` +
                `📦 แพ็คเกจ: ${userData.selectedPackage || 'ไม่ระบุ'}\\n` +
                `📝 ผลวิเคราะห์: ${text}\\n\\n` +
                `📸 กรุณาตรวจสอบในแชท`
        });

        // Reply to User
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: `✅ **ได้รับสลิปเรียบร้อยครับ**\\n\\n` +
                `ระบบบันทึกข้อมูลการโอนเงินแล้ว\\n` +
                `แอดมินจะตรวจสอบและอนุมัติสิทธิ์ให้เร็วที่สุดครับ ⏱️`
        });

      } else {
        // 7. Not a slip -> It's a Vision Diagnosis / General Image
        console.log('👁️ General image analysis');
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: `👁️ **ผลการวิเคราะห์ภาพ:**\\n\\n${text}`
        });
      }

    } catch (error) {
      console.error('❌ Error handling image:', error);
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: `⚠️ เกิดข้อผิดพลาดในการประมวลผลภาพ\\nกรุณาลองใหม่อีกครั้ง`
      });
    }
    return;
  }"""

# We need to replace the ENTIRE existing `if (message.type === 'image')` block.
# It starts around line 5150 and ends around line 5300.

start_marker = "// Handle Image Messages (Slip Upload or Vision Diagnosis)"
# The end is harder to find because of nested braces.
# But we know the next block starts with `// Handle Sticker Messages`

end_marker = "// Handle Sticker Messages"

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos != -1 and end_pos != -1:
    # Replace the whole chunk
    # Be careful about the closing brace of the previous block? No, start_marker is inside the function.
    # We need to make sure we capture the closing brace of the image block.
    # The `end_pos` points to the start of the next comment.
    # The closing brace `  }` and `return;` should be just before `end_pos`.
    
    # Let's verify the content before replacing
    # print(content[start_pos:end_pos])
    
    content = content[:start_pos] + new_image_handler + "\n\n  " + content[end_pos:]
    print("Replaced Image Handler")
else:
    print("Could not find markers")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
