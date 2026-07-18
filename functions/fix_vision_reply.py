
import os

file_path = r'd:\Flutterapp\caculateapp\functions\index.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We will replace the entire image handling block.
# Key changes:
# 1. Remove the initial replyMessage ("กำลังวิเคราะห์ภาพ...")
# 2. Update prompt to include Agriculture.
# 3. Use replyMessage for the result instead of pushMessage.

start_marker = "  // Handle Image Messages (Auto Vision & Slip Detection)"
end_marker = "  // Handle Sticker Messages"

# Construct the new block
new_block = """  // Handle Image Messages (Auto Vision & Slip Detection)
  if (message.type === 'image') {
    console.log(`📸 Image received from ${userId}`);

    try {
      // 1. Notify user that analysis is starting (SKIPPED to save replyToken for result)
      // await lineClient.replyMessage(replyToken, { type: 'text', text: '...' });

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
         
      4. **ถ้าเป็น "พืช" หรือ "ใบไม้" (Agriculture):**
         - วินิจฉัยโรคพืช หรือความผิดปกติ
         - แนะนำวิธีรักษาหรือปุ๋ยที่เหมาะสม
      
      5. **อื่นๆ:**
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

        // Notify Super Admin (Push is OK here)
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

        // Reply to User (Use replyMessage instead of pushMessage)
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `✅ **ได้รับสลิปเรียบร้อยครับ**\\n\\n` +
                `ระบบบันทึกข้อมูลการโอนเงินแล้ว\\n` +
                `แอดมินจะตรวจสอบและอนุมัติสิทธิ์ให้เร็วที่สุดครับ ⏱️`
        });

      } else {
        // 7. Not a slip -> It's a Vision Diagnosis / General Image
        console.log('👁️ General image analysis');
        // Use replyMessage instead of pushMessage
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `👁️ **ผลการวิเคราะห์ภาพ:**\\n\\n${text}`
        });
      }

    } catch (error) {
      console.error('❌ Error handling image:', error);
      // Try to reply error if token not used (it shouldn't be used yet if we failed before replyMessage)
      try {
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `⚠️ เกิดข้อผิดพลาดในการประมวลผลภาพ\\nกรุณาลองใหม่อีกครั้ง`
        });
      } catch (e) {
        console.error('❌ Could not send error message:', e.message);
      }
    }
    return;
  }
"""

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos != -1 and end_pos != -1:
    # We need to be careful not to cut off the end_marker
    # The end_marker starts the next block.
    # We want to replace everything from start_marker up to (but not including) end_marker.
    
    # Check if there is a newline before end_marker
    content = content[:start_pos] + new_block + "\n\n" + content[end_pos:]
    print("Updated Image Handler logic")
else:
    print("Could not find image handler block")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
