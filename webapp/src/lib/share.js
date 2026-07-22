// share.js — helper แชร์มาตรฐานเดียวของ webapp
// ทุกการแชร์ → ลิงก์ /s/<type>/<id> ที่ Worker render OG preview แล้ว redirect ไปเนื้อหาจริง
const SHARE_BASE = 'https://tuktukfeed.com';

/**
 * สร้างลิงก์แชร์มาตรฐาน
 * @param {'post'|'video'|'product'|'community'|'profile'} type
 * @param {string} id
 */
export function buildShareUrl(type, id) {
  return `${SHARE_BASE}/s/${type}/${encodeURIComponent(id)}`;
}

/**
 * แชร์เนื้อหา — navigator.share → clipboard → prompt (fallback ครบ)
 * @returns {Promise<'shared'|'copied'|'cancelled'>}
 */
export async function shareContent({ type, id, title = 'TukTuk Thailand', text = '' }) {
  const url = buildShareUrl(type, id);
  const shareText = text ? String(text).slice(0, 160) : title;

  if (navigator.share) {
    try {
      await navigator.share({ title, text: shareText, url });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // ไม่รองรับ/ล้มเหลว → ตกไป clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    // eslint-disable-next-line no-alert
    window.prompt('คัดลอกลิงก์แชร์:', url);
    return 'copied';
  }
}
