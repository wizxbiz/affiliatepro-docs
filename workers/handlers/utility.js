/**
 * Utility Handler — Cloudflare Workers
 * แทน utility_functions.js Firebase functions:
 *   r2PresignedUrl, healthCheck, submitFeedback, manageMemory
 *
 * r2PresignedUrl ใช้ SigV4 เหมือนกับ Firebase Function เดิมทุกอย่าง
 * แต่ credentials อยู่ใน Workers Secrets (ไม่ hardcode)
 */

import { Hono } from 'hono';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { DB } from '../lib/db.js';

export const utilityRoutes = new Hono();

// ── GET /api/utility/health ───────────────────────────────────
utilityRoutes.get('/health', async (c) => {
  const checks = { worker: 'ok', timestamp: Date.now() };

  try {
    await c.env.DB.prepare('SELECT 1').first();
    checks.database = 'ok';
  } catch { checks.database = 'error'; }

  try {
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put('__health', '1', { expirationTtl: 60 });
      checks.kv = 'ok';
    } else { checks.kv = 'not_configured'; }
  } catch { checks.kv = 'error'; }

  checks.r2 = c.env.STORAGE ? 'ok' : 'not_configured';

  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'not_configured' || typeof v === 'number');
  return c.json(checks, allOk ? 200 : 503);
});

// ── POST /api/utility/r2-presigned-url ───────────────────────
// แทน r2PresignedUrl Firebase function — ใช้ SigV4 เหมือนเดิม 100%
utilityRoutes.post('/r2-presigned-url', optionalAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  const { folder, filename, contentType, lineUserId } = body;

  // ── 1. Validate ────────────────────────────────────────────
  if (!folder || !filename || !contentType) {
    return c.json({ error: 'Missing folder, filename, or contentType' }, 400);
  }

  const ALLOWED_FOLDERS = [
    'community_posts', 'community_posts/thumbs',
    'posts', 'posts/thumbs',
    'products', 'products/thumbs',
    'avatars', 'stories'
  ];
  if (!ALLOWED_FOLDERS.some(f => folder === f || folder.startsWith(f + '/'))) {
    return c.json({ error: 'Invalid upload folder' }, 400);
  }

  const ALLOWED_TYPES = [
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'
  ];
  if (!ALLOWED_TYPES.includes(contentType)) {
    return c.json({ error: 'Unsupported file type: ' + contentType }, 400);
  }

  // ── 2. R2 Credentials จาก Secrets ─────────────────────────
  const R2_ACCESS_KEY_ID     = c.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = c.env.R2_SECRET_ACCESS_KEY;
  const R2_ACCOUNT_ID        = c.env.R2_ACCOUNT_ID || '3936ddcbff711649ab56a10375e82b67';
  const R2_BUCKET            = c.env.R2_BUCKET_NAME || 'tuktuk-videos';
  const R2_PUBLIC_BASE       = c.env.R2_PUBLIC_BASE || 'https://pub-7e55074f08794361aaf305c1967f6ffa.r2.dev';
  const REGION               = 'auto';
  const EXPIRES_SECONDS      = '900'; // 15 minutes

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return c.json({ error: 'R2 credentials not configured. Run: npx wrangler@3 secret put R2_ACCESS_KEY_ID' }, 503);
  }

  // ── 3. Build SigV4 Pre-Signed URL (เหมือน Firebase Function) ─
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const amzDate = `${dateStr}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const safeFilename = filename.replace(/[^a-zA-Z0-9._\-]/g, '_');
  const key = `${folder}/${Date.now()}_${safeFilename}`;
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const credentialScope = `${dateStr}/${REGION}/s3/aws4_request`;
  const credential = `${R2_ACCESS_KEY_ID}/${credentialScope}`;

  const queryParams = [
    ['X-Amz-Algorithm',     'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',    credential],
    ['X-Amz-Date',          amzDate],
    ['X-Amz-Expires',       EXPIRES_SECONDS],
    ['X-Amz-SignedHeaders',  'host'],
  ];
  const canonicalQueryString = queryParams
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const canonicalRequest = [
    'PUT',
    `/${R2_BUCKET}/${encodedKey}`,
    canonicalQueryString,
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  // HMAC-SHA256 via Web Crypto API (Workers-native, no Node crypto needed)
  const enc = new TextEncoder();
  const hmac = async (key, data) => {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', typeof key === 'string' ? enc.encode(key) : key,
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  };
  const sha256hex = async (data) => {
    const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(data));
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const bufToHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

  const canonicalHash  = await sha256hex(canonicalRequest);
  const stringToSign   = ['AWS4-HMAC-SHA256', amzDate, credentialScope, canonicalHash].join('\n');

  const kDate    = await hmac(`AWS4${R2_SECRET_ACCESS_KEY}`, dateStr);
  const kRegion  = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = bufToHex(await hmac(kSigning, stringToSign));

  const uploadUrl = `https://${host}/${R2_BUCKET}/${encodedKey}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  const publicUrl = `${R2_PUBLIC_BASE}/${key}`;

  return c.json({ uploadUrl, publicUrl, key });
});

// ── POST /api/utility/feedback ────────────────────────────────
utilityRoutes.post('/feedback', optionalAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  const db = new DB(c.env.DB);

  try {
    await db.createFeedback({
      id: crypto.randomUUID(),
      userId: session?.uid || null,
      type: body.type || 'general',
      message: body.message || '',
      page: body.page || '',
      createdAt: Date.now(),
    });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── DELETE /api/utility/r2-delete ────────────────────────────
// ลบไฟล์จาก R2 bucket ผ่าน R2 binding โดยตรง (ไม่ต้องใช้ SigV4)
// Body: { key: "products/xxx.jpg" } หรือ { url: "https://pub-xxx.r2.dev/products/xxx.jpg" }
// ต้องการ auth (admin หรือ เจ้าของไฟล์)
utilityRoutes.delete('/r2-delete', requireAuth, async (c) => {
  if (!c.env.STORAGE) {
    return c.json({ error: 'R2 storage binding not configured' }, 503);
  }

  const session = c.get('session');
  const isAdmin = session?.role === 'super_admin' || session?.role === 'admin';

  const body = await c.req.json().catch(() => ({}));
  let key = body.key?.trim();

  // รองรับส่ง URL มาตรง — ดึง key ออกจาก URL
  if (!key && body.url) {
    try {
      const url = new URL(body.url);
      // https://pub-xxx.r2.dev/products/file.jpg → products/file.jpg
      // https://tuktukfeed.com/storage/products/file.jpg → products/file.jpg
      key = url.pathname.replace(/^\/storage\//, '').replace(/^\//, '');
    } catch (_) {
      key = null;
    }
  }

  if (!key) {
    return c.json({ error: 'Missing key or url' }, 400);
  }

  // Security: อนุญาตเฉพาะโฟลเดอร์ที่กำหนด
  const ALLOWED_PREFIXES = [
    'products/', 'posts/', 'community_posts/', 'avatars/',
    'stories/', 'news_images/', 'community_images/', 'videos/',
  ];
  const isAllowed = ALLOWED_PREFIXES.some(p => key.startsWith(p));
  if (!isAllowed) {
    return c.json({ error: `Key must start with one of: ${ALLOWED_PREFIXES.join(', ')}` }, 403);
  }

  // Non-admin: อนุญาตเฉพาะไฟล์ที่ชื่อ key มี userId ของตัวเองอยู่ด้วย
  if (!isAdmin) {
    const uid = session?.uid || session?.lineUserId;
    if (!uid || !key.includes(uid)) {
      return c.json({ error: 'Permission denied: you can only delete your own files' }, 403);
    }
  }

  try {
    await c.env.STORAGE.delete(key);
    console.log(`[R2 Delete] key="${key}" by uid=${session?.uid || 'unknown'}`);
    return c.json({ success: true, deleted: key });
  } catch (err) {
    console.error('[R2 Delete] Error:', err.message);
    return c.json({ error: err.message }, 500);
  }
});
utilityRoutes.post('/save-push-subscription', optionalAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const payload = body.data || {};
  const { subscription, uid } = payload;

  if (!subscription || !subscription.endpoint) {
    return c.json({ error: 'Missing subscription endpoint' }, 400);
  }

  const userId = uid || session?.uid || 'anonymous';
  const keysJson = JSON.stringify(subscription.keys || {});
  const id = crypto.randomUUID();

  try {
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (id, user_id, endpoint, keys, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, userId, subscription.endpoint, keysJson, Date.now()).run();
    
    return c.json({ data: { success: true } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});
