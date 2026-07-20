// videoManager.js — ตัวประสานการเล่นวิดีโอทั้งแอป (singleton)
// รับประกัน: เล่นได้ทีละตัวเดียวเท่านั้น ทุกบริบท (feed / post / profile / viewer)
// เมื่อวิดีโอตัวใหม่เริ่มเล่น → หยุดตัวเดิมทันที
// ป้องกันปัญหา "เล่นซ้อนกัน" ข้ามหน้า/ข้าม component

const registry = new Set() // ชุด callback ของทุก video ที่ลงทะเบียน (ใช้สั่งหยุดตัวอื่น)
let current = null // token ของวิดีโอที่กำลังเล่นอยู่

/**
 * ลงทะเบียน video instance
 * @param {object} handle - { pause: fn } เรียกเมื่อถูกสั่งให้หยุดโดยตัวอื่น
 * @returns {object} token + unregister
 */
export function registerVideo(handle) {
  registry.add(handle)
  return {
    unregister() {
      registry.delete(handle)
      if (current === handle) current = null
    },
  }
}

/**
 * ประกาศว่า handle นี้กำลังจะเล่น → หยุดตัวอื่นทั้งหมด
 */
export function requestPlay(handle) {
  if (current && current !== handle) {
    try { current.pause?.() } catch { /* noop */ }
  }
  current = handle
  // หยุดตัวอื่นที่อาจยังเล่นค้าง (กันเคส race)
  registry.forEach((h) => {
    if (h !== handle) {
      try { h.pause?.() } catch { /* noop */ }
    }
  })
}

/**
 * แจ้งว่า handle นี้หยุดแล้ว (ถ้าเป็นตัว current ให้เคลียร์)
 */
export function notifyPaused(handle) {
  if (current === handle) current = null
}

/**
 * หยุดทุกวิดีโอ (ใช้ตอนเปิด modal/viewer ทับ, หรือออกจากหน้า)
 * รวมถึง YouTube iframe ผ่าน postMessage (ต้องการ enablejsapi=1)
 */
export function pauseAll() {
  registry.forEach((h) => {
    try { h.pause?.() } catch { /* noop */ }
  })
  current = null
  // หยุด YouTube iframes ทั้งหมดที่อยู่ใน DOM
  document.querySelectorAll('iframe[src*="youtube.com/embed"]').forEach((frame) => {
    try {
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        'https://www.youtube.com'
      )
    } catch { /* noop */ }
  })
}
