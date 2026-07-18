/**
 * LINE Bot Webhook Handler & Proxy — Cloudflare Workers
 * ───────────────────────────────────────────────────
 * ทำหน้าที่เป็น Gateway รับ Event จาก LINE Developers:
 * 1. ถ้าตรวจพบข้อความขอ PIN ("รหัส", "ขอรหัส") -> จะจัดการสุ่ม PIN บันทึกลง D1 และส่ง Flex Message ตอบกลับทันที
 * 2. ข้อความอื่นๆ -> ตอบกลับด้วย Worker handlers โดยตรง ไม่ proxy ไป Firebase
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

// Helper: จัดการคัดกรองและส่งต่อ LINE Webhook Event
async function handleWebhookEvent(c, isTuktuk = false) {
  try {
    const body = await c.req.json();
    const events = body.events || [];
    
    // หากเป็น Verification request (events ว่างเปล่า) ให้ตอบกลับ 200 OK ทันทีโดยไม่ต้องรันต่อ
    if (events.length === 0) {
      console.log('[LINE Webhook] Empty events array received (Verify request). Returning 200 OK.');
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

    // ตรวจหาคำสั่งขอรหัส PIN ใน Event (ปรับใช้ Regex ให้ยืดหยุ่น เช่น "ขอรหัสครับ", "ขอรหัสผ่านค่ะ")
    const pinEvent = events.find(e => 
      e.type === 'message' && 
      e.message.type === 'text' && 
      /รหัส|pin|เข้าสู่ระบบ|login/i.test(e.message.text)
    );

    if (pinEvent) {
      const userId = pinEvent.source.userId;
      const replyToken = pinEvent.replyToken;
      
      // ดึง LINE Token จากตัวแปรสภาพแวดล้อม
      const lineAccessToken = getLineAccessToken(c.env, isTuktuk);

      if (!lineAccessToken) {
        console.warn('[LINE Webhook] Missing LINE Access Token in Worker env. Returning 200 without Firebase proxy.');
        return workerFallback('pin-error');
      }

      try {
        // 1. สุ่มรหัส PIN 6 หลัก
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // มีอายุ 24 ชั่วโมง
        
        const db = new DB(c.env.DB);

        // ดึงโปรไฟล์ LINE ของผู้ใช้เพื่อนำมาสร้าง/อัปเดตข้อมูลใน D1 users
        let displayName = 'ผู้ใช้ LINE';
        let pictureUrl = '';
        try {
          const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${lineAccessToken}` }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            displayName = profileData.displayName || displayName;
            pictureUrl = profileData.pictureUrl || pictureUrl;
          }
        } catch (e) {
          console.warn('[LINE Webhook] Failed to fetch bot profile:', e.message);
        }

        // สร้างหรืออัปเดตผู้ใช้ในตาราง users ใน D1
        let user = await db.getUserById(userId);
        if (!user) {
          await db.createUser({
            id: userId,
            lineUserId: userId,
            displayName,
            pictureUrl,
            role: 'user',
            sellerStatus: 'none',
            isPremium: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else {
          await db.updateUser(userId, {
            displayName,
            pictureUrl,
            updatedAt: Date.now(),
          });
        }

        // 2. บันทึกลงตาราง D1 web_pins
        await db.d1.prepare(`
          INSERT OR REPLACE INTO web_pins (line_user_id, pin, expires_at, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(userId, pin, expiresAt, Date.now()).run();

        console.log(`[LINE Webhook] Saved D1 web_pin & upserted user for ${userId}: ${pin}`);

        // 3. ส่ง Flex Message ตอบกลับผ่าน LINE Messaging API
        const messageData = {
          replyToken: replyToken,
          messages: [
            {
              type: 'flex',
              altText: '🔑 รหัสเข้าใช้งานของคุณ',
              contents: {
                type: 'bubble',
                size: 'mega',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    { type: 'text', text: '🔑 รหัสเข้าใช้งาน', size: 'lg', weight: 'bold', color: '#ffffff' },
                    { type: 'text', text: 'ใช้สำหรับเข้าสู่ระบบเว็บไซต์', size: 'xs', color: '#ffffffb3' }
                  ],
                  backgroundColor: '#8B5CF6'
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  paddingAll: '20px',
                  backgroundColor: '#0A0E21',
                  contents: [
                    {
                      type: 'box',
                      layout: 'vertical',
                      paddingAll: '30px',
                      backgroundColor: '#8B5CF61A',
                      cornerRadius: '16px',
                      borderWidth: '2px',
                      borderColor: '#8B5CF64D',
                      contents: [{
                        type: 'text',
                        text: pin.slice(0, 3) + '  ' + pin.slice(3),
                        size: '3xl',
                        weight: 'bold',
                        color: '#8B5CF6',
                        align: 'center',
                      }],
                    },
                    {
                      type: 'text',
                      text: `⏰ หมดอายุ: ${new Date(expiresAt).toLocaleTimeString('th-TH')} น.`,
                      size: 'xs',
                      color: '#FFFFFF80',
                      align: 'center',
                    },
                    {
                      type: 'separator',
                      margin: 'md',
                      color: '#FFFFFF1A',
                    },
                    {
                      type: 'text',
                      text: 'กรอกรหัสผ่านนี้ที่หน้าเว็บไซต์เพื่อเข้าสู่ระบบ',
                      size: 'xs',
                      color: '#FFFFFF80',
                      align: 'center',
                      wrap: true,
                      margin: 'md',
                    },
                  ],
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'sm',
                  paddingAll: '20px',
                  backgroundColor: '#0A0E21',
                  contents: [
                    {
                      type: 'button',
                      action: { type: 'uri', label: '🌐 ไปที่เว็บไซต์', uri: 'https://tuktukfeed.com' },
                      style: 'primary',
                      color: '#8B5CF6'
                    }
                  ],
                },
              }
            }
          ]
        };

        const replyRes = await replyToLine(lineAccessToken, replyToken, messageData.messages);


        if (!replyRes.ok) {
          const errText = await replyRes.text();
          console.error('[LINE Webhook] Failed to reply to LINE:', errText);
          if (c.env.SESSIONS) {
            await c.env.SESSIONS.put('debug:last_reply_error', JSON.stringify({
              status: replyRes.status,
              responseText: errText,
              time: new Date().toISOString(),
              isTuktuk
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
        console.error('[LINE Webhook] Worker knowledge reply failed:', errText);
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

    // Event อื่นๆ: ตอบจาก Worker แทนการส่งต่อ Firebase
    return workerFallback('no-specific-handler');
  } catch (err) {
    console.error('[LINE Webhook Global Catch] Error:', err);
    try {
      if (c.env.SESSIONS) {
        await c.env.SESSIONS.put('debug:last_webhook_error', JSON.stringify({
          message: err.message,
          stack: err.stack,
          time: new Date().toISOString(),
          isTuktuk
        }));
      }
    } catch (kvErr) {
      console.error('Failed to write error to KV SESSIONS:', kvErr);
    }
    return c.json({ error: err.message, stack: err.stack }, 200); // คืนค่า 200 ป้องกัน Verify ล้มเหลว
  }
}


function buildTuktukFallbackMessages(text = '') {
  const lower = text.toLowerCase().trim();
  const site = 'https://tuktukfeed.com';

  if (/ตลาด|market|ซื้อ|ขาย/.test(lower)) {
    return [{
      type: 'text',
      text: 'เปิดตลาด TukTuk ได้ที่นี่ครับ\n' + site + '/marketplace.html\n\nถ้าต้องการลงขาย พิมพ์ "รหัส" เพื่อเข้าสู่ระบบก่อน',
      quickReply: tuktukQuickReply(),
    }];
  }

  if (/วิน|win|มอเตอร์ไซค์/.test(lower)) {
    return [{
      type: 'text',
      text: 'บริการ WIN Rider เข้าใช้งานได้ที่\n' + site + '/win-service.html\n\nพิมพ์ "รหัส" เพื่อขอ PIN เข้าเว็บ',
      quickReply: tuktukQuickReply(),
    }];
  }

  if (/เมนู|menu|help|ช่วย|เริ่ม/.test(lower)) {
    return [{ type: 'text', text: tuktukMenuText(), quickReply: tuktukQuickReply() }];
  }

  return [{
    type: 'text',
    text: 'Worker รับข้อความแล้วครับ\n\nตอนนี้รองรับคำสั่งหลัก: เมนู, ตลาด, วิน, รหัส\nถ้าต้องการเข้าเว็บไซต์ให้พิมพ์ "รหัส" เพื่อรับ PIN',
    quickReply: tuktukQuickReply(),
  }];
}

function tuktukMenuText() {
  return [
    'เมนู TukTuk Social',
    '',
    '- พิมพ์ "รหัส" เพื่อรับ PIN เข้าเว็บไซต์',
    '- พิมพ์ "ตลาด" เพื่อเปิด Marketplace',
    '- พิมพ์ "วิน" เพื่อเปิดบริการ WIN Rider',
    '',
    'เว็บไซต์: https://tuktukfeed.com',
  ].join('\n');
}

function tuktukQuickReply() {
  return {
    items: [
      { type: 'action', action: { type: 'message', label: 'รหัส', text: 'รหัส' } },
      { type: 'action', action: { type: 'message', label: 'ตลาด', text: 'ตลาด' } },
      { type: 'action', action: { type: 'message', label: 'วิน', text: 'วิน' } },
      { type: 'action', action: { type: 'message', label: 'เมนู', text: 'เมนู' } },
    ],
  };
}
// ── GET/POST LINE Webhook Routes ─────────────────────────────
lineWebhookRoutes.post('/webhook', async (c) => {
  return handleWebhookEvent(c, false);
});

lineWebhookRoutes.post('/webhook-tuktuk', async (c) => {
  return handleWebhookEvent(c, true);
});

