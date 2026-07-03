/**
 * 🛠️ Core Utilities & Helper Functions
 */

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const PROFANITY_LIST = [
    "ไอ้เหี้ย", "ไอ้สัส", "ไอ้สัตว์", "ควย", "หี", "แตด", "เย็ด", "มึง", "กู", "ส้นตีน", "ตีน",
    "หัวควย", "กระหรี่", "ร่าน", "บ้า", "โง่", "ควาย", "เหี้ย", "สัส", "จัญไร", "ระยำ",
    "ชั่ว", "เลว", "กาก", "ขยะ", "ดอกทอง", "กะหรี่", "สันดาน", "อีควาย", "อีตัว",
    "112", "สถาบัน", "กษัตริย์", "ในหลวง", "ราชวงศ์", "เบื้องสูง", "มาตรา 112", "ปฏิรูปสถาบัน",
    "ล้มล้าง", "หมิ่น", "หมิ่นพระบรม", "ล้มเจ้า", "ปฏิวัติ",
    "การพนัน", "เว็บพนัน", "สล็อต", "บาคาร่า", "แทงบอล", "หวยออนไลน์", "UFA", "คาสิโนออนไลน์",
    "ยาบ้า", "ยาไอซ์", "กัญชา", "เฮโรอีน", "โคเคน", "ยาเค", "ยาเสพติด", "ขายบริการ", "ไซด์ไลน์",
    "โสเภณี", "ค้าประเวณี", "อาวุธปืน", "ปืนเถื่อน", "ระเบิด", "ฆ่า", "ข่มขืน", "รุมโทรม",
    "fuck", "shit", "asshole", "bitch", "cunt", "damn", "hell", "pussy", "dick", "bastard",
    "motherfucker", "fucker", "slut", "whore", "nigger", "faggot", "porn", "sex", "anal", "oral",
    "hee", "hum"
];

function containsProfanity(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    
    // Use word boundaries for English and special handling for Thai
    return PROFANITY_LIST.some(word => {
        // For English or alphanumeric words, use boundary check
        if (/^[a-z0-9]+$/i.test(word)) {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(lowerText);
        }
        // For Thai, check if the word exists as a part but try to avoid common false positives
        // This is a simplified approach, real Thai word segmentation would be better but 
        // for now we use the existing list with a safer check.
        if (word.length <= 2) {
            // Very short words must match exactly or be surrounded by non-Thai chars logic
            // for simplicity, we'll keep it as is but note the risk.
            return lowerText.includes(word);
        }
        return lowerText.includes(word);
    });
}

function filterProfanity(text) {
    if (!text) return '';
    let filtered = text;
    PROFANITY_LIST.forEach(word => {
        // Match English words with boundaries, Thai words as is
        const pattern = /^[a-z0-9]+$/i.test(word) ? `\\b${word}\\b` : word;
        const reg = new RegExp(pattern, 'gi');
        filtered = filtered.replace(reg, (match) => '*'.repeat(match.length));
    });
    return filtered;
}

function showToast(message, type = 'info') {
    // Check if a premium toast already exists to prevent stacking issues if preferred, 
    // but here we allow multiple.
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    // Icon mapping
    const icons = {
        success: '<i class="fas fa-check-circle me-2"></i>',
        error: '<i class="fas fa-times-circle me-2"></i>',
        warning: '<i class="fas fa-exclamation-triangle me-2"></i>',
        info: '<i class="fas fa-info-circle me-2"></i>'
    };

    // Use icon HTML + safe text node to prevent XSS
    toast.innerHTML = icons[type] || '';
    const msgNode = document.createTextNode(message);
    toast.appendChild(msgNode);

    // Premium style with glassmorphism
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : (type === 'error' ? 'rgba(239, 68, 68, 0.9)' : (type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)'))};
        backdrop-filter: blur(10px);
        color: white;
        border-radius: 50px;
        font-weight: 600;
        z-index: 100000;
        animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        max-width: 90vw;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'all 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000;
    const steps = 30;
    const stepValue = target / steps;
    let current = 0;

    const interval = setInterval(() => {
        current += stepValue;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, duration / steps);
}

function formatTimeAgo(date) {
    if (!date) return 'เมื่อสักครู่';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;

    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
