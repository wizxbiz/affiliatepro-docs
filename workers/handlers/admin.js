/**
 * Admin API Handlers — Cloudflare Workers
 * แทน Firebase adminApi functions: adminCreatePin, adminBroadcast, verifyWebPin
 */

import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';
import { DB } from '../lib/db.js';
import { moderateAndNotify, notifyAdminLine } from '../lib/ai-moderation.js';

export const adminRoutes = new Hono();

// All routes require admin
adminRoutes.use('*', requireAdmin);

// ── GET /stats ────────────────────────────────────────────────
adminRoutes.get('/stats', async (c) => {
  const db = new DB(c.env.DB);
  try {
    const stats = await db.getMarketplaceStats();
    return c.json({ success: true, stats });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /broadcast — LINE push ถึงทุก admin ─────────────────
adminRoutes.post('/broadcast', async (c) => {
  const { message, title = '📢 แจ้งเตือนจาก Admin', url } = await c.req.json().catch(() => ({}));
  if (!message) return c.json({ error: 'Missing message' }, 400);

  const token = c.env.TUKTUK_CHANNEL_ACCESS_TOKEN || c.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return c.json({ error: 'No LINE token configured' }, 500);

  const ADMIN_LINE_IDS = [
    'Ud9bec6d2ea945cf4330a69cb74ac93cf',
    'U9b40807cbcc8182928a12e3b6b73330e',
  ];

  const flex = {
    type: 'flex',
    altText: title,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#6366f1', paddingAll: 'lg',
        contents: [{ type: 'text', text: title, color: '#fff', weight: 'bold', size: 'lg', wrap: true }],
      },
      body: {
        type: 'box', layout: 'vertical', backgroundColor: '#0a0e21', paddingAll: 'lg',
        contents: [{ type: 'text', text: message, color: '#e5e7eb', size: 'sm', wrap: true }],
      },
      ...(url ? {
        footer: {
          type: 'box', layout: 'vertical', backgroundColor: '#0a0e21', paddingAll: 'lg', paddingTop: 'xs',
          contents: [{
            type: 'button', style: 'primary', color: '#6366f1', height: 'sm',
            action: { type: 'uri', label: '🔗 ดูรายละเอียด', uri: url },
          }],
        },
      } : {}),
    },
  };

  const results = await Promise.allSettled(
    ADMIN_LINE_IDS.map(adminId =>
      fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: adminId, messages: [flex] }),
      }).then(r => ({ id: adminId, ok: r.ok, status: r.status }))
    )
  );

  return c.json({ success: true, results: results.map(r => r.value || r.reason) });
});

// ── POST /moderate — trigger AI check ด้วยมือ ────────────────
adminRoutes.post('/moderate', async (c) => {
  const { type = 'post', item, userId, userName } = await c.req.json().catch(() => ({}));
  if (!item) return c.json({ error: 'Missing item' }, 400);

  try {
    const result = await moderateAndNotify(c.env, { type, item, userId, userName });
    return c.json({ success: true, ...result });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /notify-admin — push ข้อความหา admin ────────────────
// ใช้สำหรับ seller registration, รายงาน, alerts
adminRoutes.post('/notify-admin', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    await notifyAdminLine(c.env, {
      type: body.type || 'post',
      item: body.item || {},
      userId: body.userId || '',
      userName: body.userName || '',
      verdict: body.verdict || 'review',
      score: body.score || 5,
      reason: body.reason || '',
      tags: body.tags || [],
    });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /seller-request — notify admin เมื่อมีคนขอเปิดร้าน ─
// เรียกจาก super-admin หรือ seller-dashboard
adminRoutes.post('/seller-request', async (c) => {
  const { userId, userName, businessName, businessType, lineUserId, note } = await c.req.json().catch(() => ({}));
  if (!userId) return c.json({ error: 'Missing userId' }, 400);

  const item = {
    id: userId,
    title: businessName || 'ขอเปิดร้าน',
    content: `ประเภท: ${businessType || '-'}\nหมายเหตุ: ${note || '-'}`,
    name: businessName || '',
    description: `LINE: ${lineUserId || userId}`,
  };

  try {
    await notifyAdminLine(c.env, {
      type: 'seller',
      item,
      userId,
      userName: userName || businessName || '',
      verdict: 'review',
      score: 0,
      reason: 'คำขอเปิดร้านใหม่ — ต้องการการตรวจสอบ',
      tags: ['seller-request'],
    });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/admin/live/end/:id — force-stop a live stream ───
// แทนที่ client master key: ตรวจสิทธิ์ผ่าน requireAdmin (JWT role) แล้ว
// proxy ไป Go engine ฝั่ง server โดยแนบ master key จาก env (ไม่รั่วสู่ client)
adminRoutes.post('/live/end/:id', async (c) => {
  const sessionId = c.req.param('id');
  const goUrl = (c.env.GO_ENGINE_URL || c.env.TUKTUK_GO_ENGINE_URL || 'https://tuktuk-engine.fly.dev').replace(/\/+$/, '');
  const masterKey = c.env.GO_MASTER_KEY || c.env.TUKTUK_MASTER_KEY;

  // ยังไม่ตั้ง master key → คืน 501 ชัดเจน (ไม่ crash, ไม่รั่ว key)
  if (!masterKey) {
    return c.json({ error: 'Live termination not configured (GO_MASTER_KEY unset)', code: 'NOT_CONFIGURED' }, 501);
  }

  try {
    const res = await fetch(`${goUrl}/api/v1/live/end/${encodeURIComponent(sessionId)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${masterKey}` },
    });
    if (res.status === 404) {
      return c.json({ error: 'Go engine ยังไม่รองรับการปิด live', code: 'NOT_IMPLEMENTED' }, 501);
    }
    if (!res.ok) {
      return c.json({ error: `Go engine error ${res.status}` }, 502);
    }
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 502);
  }
});

// ── GET /api/admin/line/diagnostics — ตรวจสถานะ LINE webhook + token ───
// ถาม LINE ตรงๆ ว่า webhook URL ที่ตั้งไว้คืออะไร + token ใช้ได้ไหม (debug "ขอรหัสเงียบ")
adminRoutes.get('/line/diagnostics', async (c) => {
  const token = c.env.TUKTUK_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return c.json({ ok: false, error: 'TUKTUK_CHANNEL_ACCESS_TOKEN ไม่ได้ตั้งใน Worker env' }, 500);
  }
  const auth = { headers: { 'Authorization': `Bearer ${token}` } };
  const result = { ok: true };
  try {
    // 1. bot info — ยืนยัน token ใช้ได้
    const infoRes = await fetch('https://api.line.me/v2/bot/info', auth);
    result.tokenValid = infoRes.ok;
    result.botInfo = infoRes.ok ? await infoRes.json() : { status: infoRes.status, error: await infoRes.text() };

    // 2. webhook endpoint ที่ LINE ตั้งไว้
    const whRes = await fetch('https://api.line.me/v2/bot/channel/webhook/endpoint', auth);
    result.webhookEndpoint = whRes.ok ? await whRes.json() : { status: whRes.status, error: await whRes.text() };

    // 3. URL ที่ควรจะเป็น
    result.expectedWebhookUrl = 'https://tuktukfeed-api.imtthailand2019.workers.dev/api/line/webhook-tuktuk';
    result.match = result.webhookEndpoint?.endpoint === result.expectedWebhookUrl;
  } catch (err) {
    result.ok = false;
    result.error = err.message;
  }
  return c.json(result);
});
