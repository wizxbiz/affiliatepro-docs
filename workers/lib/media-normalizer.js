/**
 * Media URL normalizer
 * ─────────────────────────────────────────────
 * โพสต์เดิมจาก Firestore มี media_urls หลาย format:
 *   - plain string:  "https://…"
 *   - object:        { url, type, isMain, overlays }
 *   - YouTube:       "https://youtu.be/…"
 * แปลงทั้งหมดเป็น shape มาตรฐาน { type, url } ให้ client ใช้ง่าย
 */

function youtubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function classify(url) {
  if (youtubeId(url)) return 'youtube';
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return 'video';
  return 'image';
}

export function normalizeMediaEntry(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return { type: classify(entry), url: entry };
  }
  if (typeof entry === 'object' && entry.url) {
    return { type: entry.type || classify(entry.url), url: entry.url };
  }
  return null;
}

export function normalizeMediaUrls(raw) {
  let arr = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { arr = raw ? [raw] : []; }
  }
  if (!Array.isArray(arr)) arr = arr ? [arr] : [];
  return arr.map(normalizeMediaEntry).filter(Boolean);
}
