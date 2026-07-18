const { DeepSeekAPI } = require('deepseek-api');

console.log("✅ ติดตั้ง deepseek-api สำเร็จแล้ว!");
console.log("📝 ขั้นตอนต่อไป:");
console.log("1. ไปที่ https://platform.deepseek.com/");
console.log("2. สมัครบัญชีและสร้าง API Key");
console.log("3. นำ API Key มาใส่ในโค้ด");
console.log("4. เริ่มใช้ DeepSeek ช่วยพัฒนาแอปคำนวณของคุณ!");

// โค้ดตัวอย่างเมื่อมี API Key
/*
const apiKey = 'ใส่_API_Key_ของคุณตรงนี้';
const deepseek = new DeepSeekAPI(apiKey);

async function askQuestion(question) {
    try {
        const response = await deepseek.chat({
            model: "deepseek-chat",
            messages: [{ role: "user", content: question }]
        });
        console.log("DeepSeek ตอบ:", response.choices[0].message.content);
    } catch (error) {
        console.error("Error:", error.message);
    }
}
*/