
import os

file_path = r'd:\Flutterapp\caculateapp\LINE_BOT_MANUAL.md'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We will append the new features to the manual.
# Or better, insert them in relevant sections.

# 1. Update "AI Vision Diagnosis" in Premium Features
# It says "(New!) ถ่ายรูปชิ้นงานเสียส่งให้ AI ช่วยวิเคราะห์สาเหตุได้ทันที"
# We should update it to say "Auto-Detection" and "Slip Upload"

# 2. Add "Education Mode" section.

# 3. Update "Pricing" section with Group Code info.

# 4. Add "Admin Tools" section (maybe at the end or separate doc, but user asked to combine).

new_content = content + """

---

## 🚀 อัปเดตฟีเจอร์ใหม่ (New Features Update)

### 👁️ 1. ระบบวิเคราะห์ภาพอัตโนมัติ (Auto AI Vision)
ไม่ต้องพิมพ์คำสั่ง! แค่ส่งรูปภาพเข้ามา AI จะรู้เองว่าต้องทำอะไร:
*   **📸 ถ่ายรูปชิ้นงาน/เครื่องจักร:** AI จะวิเคราะห์ปัญหา (Defect) และแนะนำวิธีแก้ไขทันที
*   **💰 ส่งรูปสลิปโอนเงิน:** AI จะตรวจจับยอดเงินและแจ้ง Admin ให้อนุมัติสิทธิ์อัตโนมัติ
*   **📱 ส่งรูป QR Code:** AI จะอ่านข้อมูลใน QR ให้ทันที

### 🎓 2. โหมดการเรียนรู้ (Education Mode)
AI ปรับเปลี่ยนบทบาทตามผู้ใช้งาน:
*   **👨‍🔧 สำหรับช่างเทคนิค:** ตอบลึก ตรงประเด็น เน้นแก้ปัญหาหน้างาน
*   **👨‍🎓 สำหรับนักเรียน/นักศึกษา:** สวมบท "ครูผู้ใจดี" อธิบายศัพท์ยากให้ง่าย ยกตัวอย่างเปรียบเทียบ และสอนหลักการวิทยาศาสตร์

### 🏢 3. ระบบรหัสกลุ่ม (Group Code)
เข้าใช้งานแบบทีมได้ง่ายกว่าเดิม!
*   **สำหรับองค์กร:** ซื้อแพ็คเกจทีมครั้งเดียว ได้รับ "รหัสกลุ่ม" (เช่น `JOIN-KCT2024`)
*   **สำหรับพนักงาน:** พิมพ์รหัสกลุ่มในแชท (เช่น `JOIN-KCT2024`) เพื่อรับสิทธิ์ Premium ทันที ไม่ต้องรออนุมัติ

---

## 👑 คู่มือสำหรับผู้ดูแลระบบ (Admin Guide)

### ⚡ คำสั่งด่วน (Quick Commands)
พิมพ์ `/help` เพื่อเรียกเมนูคำสั่งพร้อมปุ่มกดด่วน:
*   📅 **/daily** - สรุปยอดผู้ใช้และสลิปประจำวัน
*   📋 **/pending** - ดูรายการรออนุมัติสลิป
*   ✅ **/approve [ID]** - อนุมัติสมาชิกด้วยตัวเอง
*   📢 **/broadcast** - ประกาศข่าวสารถึงสมาชิกทุกคน
*   📊 **/stats** - ดูสถิติภาพรวมระบบ
*   🧠 **/knowledge** - ตรวจสอบคลังความรู้เฉพาะถิ่น

### 🔔 การแจ้งเตือน (Notifications)
*   เมื่อมีสลิปโอนเงินเข้ามา Admin จะได้รับแจ้งเตือนทันที พร้อมผลวิเคราะห์จาก AI
*   สามารถกดดูรูปสลิปและอนุมัติได้จากมือถือ
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done.")
