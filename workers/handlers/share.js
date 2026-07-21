// share.js — Share hub เดียวของทั้งระบบ
// GET /s/:type/:id → render OG meta (LINE/FB preview) แล้ว redirect ไปเนื้อหาจริง
// type: post | video | product | community | profile
import { Hono } from 'hono';
import { DB } from '../lib/db.js';

export const shareRoutes = new Hono();

const CANONICAL = 'https://tuktukfeed.com';
const DEFAULT_IMG = `${CANONICAL}/assets/images/logo.png`;

// escape ค่าที่ interpolate ลง HTML attribute (กัน XSS / tag พัง)
function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

// แปลง YouTube URL → thumbnail image (OG ต้องเป็นรูป ไม่ใช่ลิงก์วิดีโอ)
function ytThumb(url) {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : '';
}

// ดึงรูปแรกที่ใช้เป็น OG ได้ จาก media_urls / images (JSON string หรือ array)
function firstImage(raw) {
  if (!raw) return '';
  const pick = (url) => {
    if (!url) return '';
    const yt = ytThumb(url);
    if (yt) return yt; // YouTube → thumbnail
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return ''; // วิดีโอไฟล์ → ข้าม
    return /^https?:/.test(url) ? url : '';
  };
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const got = pick(typeof item === 'string' ? item : (item?.url || item?.src || item?.thumbnailUrl || ''));
        if (got) return got;
      }
    }
  } catch { return pick(raw); }
  return '';
}

// สร้างหน้า HTML ที่มี OG meta + redirect
function ogPage({ title, desc, image, url, redirect, type = 'website' }) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:type" content="${esc(type)}">
  <meta property="og:site_name" content="TukTuk Thailand">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(image)}">
  <meta http-equiv="refresh" content="0;url=${esc(redirect)}">
</head>
<body><script>window.location.replace(${JSON.stringify(redirect)})</script></body>
</html>`;
}

shareRoutes.get('/:type/:id', async (c) => {
  const { type, id } = c.req.param();
  const db = new DB(c.env.DB);
  const shareUrl = `${CANONICAL}/s/${type}/${id}`;

  try {
    if (type === 'product') {
      const p = await db.getProductById(id).catch(() => null);
      if (!p) return c.redirect('/marketplace.html', 302);
      const title = p.title || p.name || 'สินค้าบน TukTuk';
      const priceText = p.price ? ` — ฿${Number(p.price).toLocaleString('th-TH')}` : '';
      return c.html(ogPage({
        title: `${title}${priceText}`,
        desc: p.description || 'สินค้าและบริการบน TukTuk Thailand',
        image: firstImage(p.images) || DEFAULT_IMG,
        url: shareUrl,
        redirect: `/marketplace.html?product=${encodeURIComponent(id)}`,
        type: 'product',
      }));
    }

    if (type === 'post' || type === 'video' || type === 'community') {
      const post = await db.getPostById(id).catch(() => null);
      if (!post) return c.redirect('/app', 302);
      const content = post.content || '';
      const title = content.slice(0, 60) || 'โพสต์บน TukTuk';
      return c.html(ogPage({
        title,
        desc: content.slice(0, 150) || 'ดูโพสต์นี้บน TukTuk Thailand',
        image: firstImage(post.media_urls) || firstImage(post.images) || DEFAULT_IMG,
        url: shareUrl,
        redirect: `/app?post=${encodeURIComponent(id)}`,
        type: 'article',
      }));
    }

    if (type === 'profile') {
      const u = await db.getUserById(id).catch(() => null);
      const name = u?.display_name || u?.displayName || 'โปรไฟล์ TukTuk';
      return c.html(ogPage({
        title: name,
        desc: 'ดูโปรไฟล์และผลงานบน TukTuk Thailand',
        image: u?.picture_url || u?.pictureUrl || DEFAULT_IMG,
        url: shareUrl,
        redirect: `/app/profile/${encodeURIComponent(id)}`,
        type: 'profile',
      }));
    }

    // type ไม่รู้จัก → กลับหน้าแรก
    return c.redirect('/app', 302);
  } catch (err) {
    return c.redirect('/app', 302);
  }
});
