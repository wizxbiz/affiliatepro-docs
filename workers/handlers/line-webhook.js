/**
 * LINE Bot Webhook Handler & Proxy — Cloudflare Workers
 * ───────────────────────────────────────────────────
 * ทำหน้าที่เป็น Gateway รับ Event จาก LINE Developers:
 * 1. ถ้าตรวจพบข้อความขอ PIN ("รหัส", "ขอรหัส") -> จะจัดการสุ่ม PIN บันทึกลง D1 และส่ง Flex Message ตอบกลับทันที
 * 2. ข้อความอื่นๆ -> ตอบกลับด้วย Flex Carousel เมนูหลัก ไม่ proxy ไป Firebase
 */

import { Hono } from 'hono';
import { DB } from '../lib/db.js';
import { buildInjectionKnowledgeReply } from '../lib/injection-knowledge.js';
import { buildAiFallbackReply } from '../lib/ai-fallback.js';

export const lineWebhookRoutes = new Hono();

function getLineAccessToken(env, isTuktuk) {
  return isTuktuk
    ? env.TUKTUK_CHANNEL_ACCESS_TOKEN
    : (env.INJECTION_CHANNEL_ACCESS_TOKEN || env.LINE_CHANNEL_ACCESS_TOKEN);
}

async function replyToLine(lineAccessToken, replyToken, messages) {
  return fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineAccessToken}`
    },
    body: JSON.stringify({ replyToken, messages })
  });
}

// ── หัวใจ: จัดการ webhook event ────────────────────────────
async function handleWebhookEvent(c, isTuktuk = false) {
  try {
    const body = await c.req.json();
    const events = body.events || [];

    if (events.length === 0) {
      console.log('[LINE Webhook] Empty events array (Verify request). Returning 200 OK.');
      return c.text('OK', 200);
    }

    const workerFallback = async (reason = 'unsupported') => {
      const event = events.find(e => e?.type === 'message' && e.message?.type === 'text' && e.replyToken);
      const lineAccessToken = getLineAccessToken(c.env, isTuktuk);
      if (!event || !lineAccessToken) return c.json({ success: true, source: 'worker-no-reply', reason });

      const messages = buildTuktukFallbackMessages(event.message.text);
      const replyRes = await replyToLine(lineAccessToken, event.replyToken, messages);
      if (!replyRes.ok) {
        const errText = await replyRes.text();
        console.error('[LINE Webhook] Worker fallback reply failed:', errText);
        if (c.env.SESSIONS) {
          await c.env.SESSIONS.put('debug:last_reply_error', JSON.stringify({
            status: replyRes.status,
            responseText: errText.slice(0, 1000),
            time: new Date().toISOString(),
            isTuktuk,
            reason,
          }));
        }
        return c.json({ success: false, source: 'worker-fallback', reason, status: replyRes.status }, 200);
      }
      return c.json({ success: true, source: 'worker-fallback', reason });
    };

    // ── PIN Request Detection ──────────────────────────────
    const pinEvent = events.find(e =>
      e.type === 'message' &&
      e.message.type === 'text' &&
      /รหัส|pin|เข้าสู่ระบบ|login/i.test(e.message.text)
    );

    if (pinEvent) {
      const userId     = pinEvent.source.userId;
      const replyToken = pinEvent.replyToken;
      const lineAccessToken = getLineAccessToken(c.env, isTuktuk);

      if (!lineAccessToken) {
        console.warn('[LINE Webhook] Missing LINE Access Token.');
        return workerFallback('pin-error');
      }

      try {
        const pin       = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
        const db        = new DB(c.env.DB);

        // Fetch LINE profile
        let displayName = 'ผู้ใช้ LINE';
        let pictureUrl  = '';
        try {
          const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${lineAccessToken}` }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            displayName = profileData.displayName || displayName;
            pictureUrl  = profileData.pictureUrl  || pictureUrl;
          }
        } catch (e) {
          console.warn('[LINE Webhook] Failed to fetch LINE profile:', e.message);
        }

        // Upsert user in D1
        const user = await db.getUserById(userId);
        if (!user) {
          await db.createUser({
            id: userId, lineUserId: userId, displayName, pictureUrl,
            role: 'user', sellerStatus: 'none', isPremium: 0,
            createdAt: Date.now(), updatedAt: Date.now(),
          });
        } else {
          await db.updateUser(userId, { displayName, pictureUrl, updatedAt: Date.now() });
        }

        // Save PIN in D1
        await db.d1.prepare(
          `INSERT OR REPLACE INTO web_pins (line_user_id, pin, expires_at, created_at) VALUES (?, ?, ?, ?)`
        ).bind(userId, pin, expiresAt, Date.now()).run();

        console.log(`[LINE Webhook] Saved D1 web_pin for ${userId}`);

        // Send Flex PIN card
        const pinMessages = [{
          type: 'flex',
          altText: '🔑 รหัสเข้าใช้งานของคุณ',
          contents: {
            type: 'bubble',
            size: 'mega',
            header: {
              type: 'box', layout: 'vertical',
              contents: [
                { type: 'text', text: '🔑 รหัสเข้าใช้งาน', size: 'lg', weight: 'bold', color: '#ffffff' },
                { type: 'text', text: 'ใช้สำหรับเข้าสู่ระบบเว็บไซต์', size: 'xs', color: '#ffffffb3' }
              ],
              backgroundColor: '#8B5CF6'
            },
            body: {
              type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', backgroundColor: '#0A0E21',
              contents: [
                {
                  type: 'box', layout: 'vertical', paddingAll: '30px',
                  backgroundColor: '#8B5CF61A', cornerRadius: '16px',
                  borderWidth: '2px', borderColor: '#8B5CF64D',
                  contents: [{
                    type: 'text',
                    text: pin.slice(0, 3) + '  ' + pin.slice(3),
                    size: '3xl', weight: 'bold', color: '#8B5CF6', align: 'center',
                  }],
                },
                { type: 'text', text: `⏰ หมดอายุ: ${new Date(expiresAt).toLocaleTimeString('th-TH')} น.`, size: 'xs', color: '#FFFFFF80', align: 'center' },
                { type: 'separator', margin: 'md', color: '#FFFFFF1A' },
                { type: 'text', text: 'กรอกรหัสผ่านนี้ที่หน้าเว็บไซต์เพื่อเข้าสู่ระบบ', size: 'xs', color: '#FFFFFF80', align: 'center', wrap: true, margin: 'md' },
              ],
            },
            footer: {
              type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '20px', backgroundColor: '#0A0E21',
              contents: [
                { type: 'button', action: { type: 'uri', label: '🌐 ไปที่เว็บไซต์', uri: 'https://tuktukfeed.com' }, style: 'primary', color: '#8B5CF6' }
              ],
            },
          }
        }];

        const replyRes = await replyToLine(lineAccessToken, replyToken, pinMessages);

        if (!replyRes.ok) {
          const errText = await replyRes.text();
          console.error('[LINE Webhook] Failed to reply to LINE:', errText);
          if (c.env.SESSIONS) {
            await c.env.SESSIONS.put('debug:last_reply_error', JSON.stringify({
              status: replyRes.status, responseText: errText, time: new Date().toISOString(), isTuktuk
            }));
          }
          return c.json({ success: false, warning: 'LINE reply failed', status: replyRes.status }, 200);
        }

        return c.json({ success: true });
      } catch (err) {
        console.error('[LINE Webhook] Local D1 processing error:', err.message);
        return workerFallback('pin-error');
      }
    }

    // ── Injection channel: knowledge + AI replies ──────────
    if (!isTuktuk) {
      const lineAccessToken = getLineAccessToken(c.env, isTuktuk);

      const knowledgeReply = buildInjectionKnowledgeReply(events);
      if (knowledgeReply && lineAccessToken) {
        const replyRes = await replyToLine(lineAccessToken, knowledgeReply.replyToken, knowledgeReply.messages);
        if (replyRes.ok) {
          console.log(`[LINE Webhook] Replied from ${knowledgeReply.source}`);
          return c.json({ success: true, source: knowledgeReply.source });
        }
        const errText = await replyRes.text();
        console.error('[LINE Webhook] Knowledge reply failed:', errText);
      }

      const aiReply = await buildAiFallbackReply(c.env, events);
      if (aiReply && lineAccessToken) {
        const replyRes = await replyToLine(lineAccessToken, aiReply.replyToken, aiReply.messages);
        if (replyRes.ok) {
          console.log(`[LINE Webhook] Replied from ${aiReply.source}`);
          return c.json({ success: true, source: aiReply.source });
        }
        const errText = await replyRes.text();
        console.error('[LINE Webhook] AI fallback reply failed:', errText);
      }
    }

    // Default fallback
    return workerFallback('no-specific-handler');

  } catch (err) {
    console.error('[LINE Webhook Global Catch]', err);
    try {
      if (c.env.SESSIONS) {
        await c.env.SESSIONS.put('debug:last_webhook_error', JSON.stringify({
          message: err.message, stack: err.stack,
          time: new Date().toISOString(), isTuktuk
        }));
      }
    } catch (kvErr) {
      console.error('Failed to write error to KV:', kvErr);
    }
    return c.json({ error: err.message }, 200);
  }
}

// ── Link Card Flex bubble ──────────────────────────────────
function linkCardFlex({ emoji, title, subtitle, desc, url, btnLabel, color }) {
  return {
    type: 'flex',
    altText: `${emoji} ${title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', paddingAll: '16px', backgroundColor: color,
        contents: [
          { type: 'text', text: `${emoji} ${title}`, size: 'lg', weight: 'bold', color: '#ffffff' },
          { type: 'text', text: subtitle, size: 'xs', color: '#ffffffcc', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px', backgroundColor: '#0A0E21',
        contents: [{ type: 'text', text: desc, size: 'sm', color: '#e2e8f0', wrap: true }],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '16px', backgroundColor: '#0A0E21',
        contents: [{
          type: 'button', style: 'primary', color, height: 'sm',
          action: { type: 'uri', label: btnLabel, uri: url },
        }],
      },
    },
  };
}

// ── Keyword-based fallback messages ────────────────────────
function buildTuktukFallbackMessages(text = '') {
  const lower = text.toLowerCase().trim();

  if (/ตลาด|market|ซื้อ/.test(lower)) {
    return [linkCardFlex({
      emoji: '🛍️', title: 'ตลาดนัด TukTuk', subtitle: 'Marketplace — ซื้อขายของดีชุมชน',
      desc: 'เลือกซื้อสินค้า OTOP และของดีท้องถิ่นได้เลย หากต้องการลงขายสินค้า พิมพ์ "ขอรหัส" เพื่อเข้าสู่ระบบก่อนนะครับ',
      url: 'https://tuktukfeed.com/marketplace.html', btnLabel: '🛒 เปิดตลาดนัด', color: '#10b981',
    })];
  }

  if (/ขาย|sell|ร้านค้า|shop/.test(lower)) {
    return [linkCardFlex({
      emoji: '💼', title: 'เปิดร้านกับ TukTuk', subtitle: 'Seller Onboarding — ขายสินค้าออนไลน์',
      desc: 'พิมพ์ "ขอรหัส" รับ PIN → เข้าเว็บ → ลงสินค้าได้ทันที ฟรี ไม่มีค่าธรรมเนียมรายเดือน',
      url: 'https://tuktukfeed.com/marketplace.html', btnLabel: '💼 เริ่มขายเลย', color: '#8B5CF6',
    })];
  }

  if (/วิน|win|มอเตอร์ไซค์|มอไซค์|เรียกรถ/.test(lower)) {
    return [linkCardFlex({
      emoji: '🏍️', title: 'WIN Rider', subtitle: 'บริการวินมอเตอร์ไซค์',
      desc: 'เรียกวินมอเตอร์ไซค์ หรือสมัครเป็นคนขับได้ที่นี่ พิมพ์ "ขอรหัส" เพื่อรับ PIN เข้าใช้งานเว็บ',
      url: 'https://tuktukfeed.com/win-service.html', btnLabel: '🏍️ เปิด WIN Rider', color: '#f59e0b',
    })];
  }

  if (/ดูเพลิน|ฟีด|feed|วิดีโอ|video|คลิป/.test(lower)) {
    return [linkCardFlex({
      emoji: '🎬', title: 'ดูเพลิน Feed', subtitle: 'TukTuk App — ฟีดวิดีโอชุมชน',
      desc: 'ดูวิดีโอ คลิปสั้น และโพสต์จากชุมชน TukTuk ได้ที่นี่ ประสบการณ์แบบ App เต็มรูปแบบ',
      url: 'https://tuktukfeed.com/app/', btnLabel: '🎬 เปิดดูเพลิน', color: '#ef4444',
    })];
  }

  if (/โพสต์|post|ลงโพสต์/.test(lower)) {
    return [linkCardFlex({
      emoji: '✍️', title: 'ลงโพสต์ใหม่', subtitle: 'Share — แบ่งปันกับชุมชน',
      desc: 'พิมพ์ "ขอรหัส" รับ PIN สำหรับเข้าสู่ระบบ แล้วลงโพสต์ ขายสินค้า หรือแชร์คลิปได้เลย',
      url: 'https://tuktukfeed.com/app/', btnLabel: '✍️ ไปลงโพสต์', color: '#6366f1',
    })];
  }

  if (/สินค้า|ของ|product/.test(lower)) {
    return [linkCardFlex({
      emoji: '📦', title: 'สินค้าทั้งหมด', subtitle: 'ดูสินค้าในตลาดนัด TukTuk',
      desc: 'เลือกดูสินค้าทั้งหมดในแพลตฟอร์ม ทั้ง OTOP สินค้าชุมชน และของดีบอกต่อ',
      url: 'https://tuktukfeed.com/marketplace.html', btnLabel: '📦 ดูสินค้าทั้งหมด', color: '#6366f1',
    })];
  }

  // default — Flex Carousel เมนูหลัก
  return [tuktukMenuCarousel()];
}

// ── เมนูหลักแบบ Flex Carousel (4 bubble) ─────────────────
function tuktukMenuCarousel() {
  const site = 'https://tuktukfeed.com';

  function heroBubble({ emoji, title, subtitle, desc, url, btnLabel, msgText, color }) {
    return {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical', paddingAll: '16px', backgroundColor: color,
        contents: [
          { type: 'text', text: emoji, size: '3xl', align: 'center' },
          { type: 'text', text: title, size: 'md', weight: 'bold', color: '#ffffff', align: 'center', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '14px', backgroundColor: '#0A0E21',
        contents: [
          { type: 'text', text: subtitle, size: 'xs', color: '#a78bfa', align: 'center' },
          { type: 'separator', margin: 'sm', color: '#ffffff1a' },
          { type: 'text', text: desc, size: 'xs', color: '#d1d5db', wrap: true, align: 'center', margin: 'sm' },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px', backgroundColor: '#0A0E21', spacing: 'sm',
        contents: [
          url ? { type: 'button', style: 'primary', height: 'sm', color, action: { type: 'uri', label: btnLabel, uri: url } } : null,
          msgText ? { type: 'button', style: 'link', height: 'sm', action: { type: 'message', label: btnLabel, text: msgText } } : null,
        ].filter(Boolean),
      },
    };
  }

  return {
    type: 'flex',
    altText: '📱 เมนู TukTuk Thailand — สไลด์เลือกบริการ',
    contents: {
      type: 'carousel',
      contents: [
        heroBubble({
          emoji: '🎬', title: 'ดูเพลิน', subtitle: 'TukTuk Feed App',
          desc: 'ฟีดวิดีโอและโพสต์ชุมชน ประสบการณ์แบบ App เต็มรูปแบบ',
          url: site + '/app/', btnLabel: '🎬 เปิดดูเพลิน', color: '#ef4444',
        }),
        heroBubble({
          emoji: '🛍️', title: 'ตลาดนัด', subtitle: 'TukTuk Marketplace',
          desc: 'ซื้อขายสินค้า OTOP และของดีชุมชน ฟรีค่าธรรมเนียม',
          url: site + '/marketplace.html', btnLabel: '🛒 เปิดตลาดนัด', color: '#10b981',
        }),
        heroBubble({
          emoji: '🏍️', title: 'WIN Rider', subtitle: 'วินมอเตอร์ไซค์',
          desc: 'เรียกรถรับส่ง หรือสมัครเป็นวินมอเตอร์ไซค์กับเรา',
          url: site + '/win-service.html', btnLabel: '🏍️ เรียกวิน', color: '#f59e0b',
        }),
        heroBubble({
          emoji: '🔑', title: 'ขอรหัส', subtitle: 'เข้าสู่ระบบเว็บ',
          desc: 'รับ PIN 6 หลัก เพื่อกรอกที่เว็บไซต์แทนการใช้รหัสผ่าน',
          url: null, btnLabel: '🔑 ขอรหัสเลย', msgText: 'ขอรหัส', color: '#8B5CF6',
        }),
      ],
    },
  };
}

// ── Routes ─────────────────────────────────────────────────
lineWebhookRoutes.post('/webhook', (c) => handleWebhookEvent(c, false));
lineWebhookRoutes.post('/webhook-tuktuk', (c) => handleWebhookEvent(c, true));

// ── LINE Debug Endpoint ────────────────────────────────────
lineWebhookRoutes.get('/debug', async (c) => {
  const token = c.env.TUKTUK_CHANNEL_ACCESS_TOKEN || c.env.INJECTION_CHANNEL_ACCESS_TOKEN;
  if (!token) return c.json({ error: 'No LINE token configured' }, 500);
  try {
    const [profileRes, webhookRes] = await Promise.all([
      fetch('https://api.line.me/v2/bot/info', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('https://api.line.me/v2/bot/channel/webhook/endpoint', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const profile = profileRes.ok ? await profileRes.json() : { error: profileRes.status };
    const webhook = webhookRes.ok ? await webhookRes.json() : { error: webhookRes.status };
    return c.json({ profile, webhook, hasToken: Boolean(token) });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});
