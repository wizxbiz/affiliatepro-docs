/**
 * LINE Bot Webhook Handler & Proxy — Cloudflare Workers
 * ───────────────────────────────────────────────────
 * ทำหน้าที่เป็น Gateway รับ Event จาก LINE Developers:
 * 1. ถ้าตรวจพบข้อความขอ PIN ("รหัส", "ขอรหัส") -> จะจัดการสุ่ม PIN บันทึกลง D1 และส่ง Flex Message ตอบกลับทันที
 * 2. ข้อความอื่นๆ -> ตอบกลับด้วย Worker handlers โดยตรง ไม่ proxy ไป Firebase
 */

import { Hono } from 'hono';
import { DB } from '../lib/db.js';
// [BUG FIX] Missing import was causing ReferenceError → global catch → silent failure
import { buildTuktukLineAiReply } from '../lib/tuktuk-line-ai.js';
export const lineWebhookRoutes = new Hono();

function getSuperAdminIds(env) {
  const envIds = env.SUPER_ADMIN_IDS
    ? env.SUPER_ADMIN_IDS.split(',').map((id) => id.trim()).filter(Boolean)
    : [];
  return envIds.length ? envIds : ['Ud9bec6d2ea945cf4330a69cb74ac93cf', 'U9b40807cbcc8182928a12e3b6b73330e'];
}

function getLineCredentialCandidates(env, isTuktuk) {
  const candidates = isTuktuk
    ? [
        { key: 'tuktuk', secret: env.TUKTUK_CHANNEL_SECRET, token: env.TUKTUK_CHANNEL_ACCESS_TOKEN },
        { key: 'line', secret: env.LINE_CHANNEL_SECRET, token: env.LINE_CHANNEL_ACCESS_TOKEN },
      ]
    : [
        { key: 'line', secret: env.LINE_CHANNEL_SECRET, token: env.LINE_CHANNEL_ACCESS_TOKEN },
        { key: 'tuktuk', secret: env.TUKTUK_CHANNEL_SECRET, token: env.TUKTUK_CHANNEL_ACCESS_TOKEN },
      ];

  const seen = new Set();
  return candidates.filter((candidate) => {
    const secret = candidate.secret?.trim();
    if (!secret || seen.has(secret)) return false;
    seen.add(secret);
    return true;
  });
}

function getLineAccessToken(env, isTuktuk, lineCredential = null) {
  if (lineCredential?.token) return lineCredential.token;
  return isTuktuk
    ? env.TUKTUK_CHANNEL_ACCESS_TOKEN
    : env.LINE_CHANNEL_ACCESS_TOKEN;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function shouldSoftFailLineSignature(env, isTuktuk) {
  if (env.LINE_WEBHOOK_SIGNATURE_SOFT_FAIL === 'true') return true;
  return isTuktuk && env.TUKTUK_LINE_WEBHOOK_SIGNATURE_SOFT_FAIL === 'true';
}

async function verifyLineSignature(rawBody, signature, channelSecret) {
  if (!rawBody || !signature || !channelSecret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret.trim()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  return safeEqual(arrayBufferToBase64(digest), signature.trim());
}

async function readVerifiedLineWebhook(c, isTuktuk) {
  const rawBody = await c.req.text();
  const signature = c.req.header('x-line-signature') || c.req.header('X-Line-Signature');
  const verificationDisabled =
    c.env.LINE_WEBHOOK_VERIFY_DISABLED === 'true' ||
    c.env.TUKTUK_LINE_WEBHOOK_VERIFY_DISABLED === 'true' ||
    c.env.LINE_SIGNATURE_VERIFY_DISABLED === 'true';

  if (!verificationDisabled) {
    const candidates = getLineCredentialCandidates(c.env, isTuktuk);
    if (!candidates.length) {
      console.error('[LINE Webhook] Missing channel secret');
      return { errorResponse: c.json({ success: false, error: 'LINE channel secret is not configured' }, 500) };
    }

    let matchedCredential = null;
    for (const candidate of candidates) {
      if (await verifyLineSignature(rawBody, signature, candidate.secret)) {
        matchedCredential = candidate;
        break;
      }
    }

    if (!matchedCredential) {
      const softFail = shouldSoftFailLineSignature(c.env, isTuktuk);
      console.warn('[LINE Webhook] Invalid signature', softFail ? '(soft-fail enabled)' : '');
      if (c.env.SESSIONS) {
        await c.env.SESSIONS.put('debug:last_webhook_error', JSON.stringify({
          message: 'Invalid LINE signature',
          isTuktuk,
          hasSignature: Boolean(signature),
          triedCredentials: candidates.map((candidate) => candidate.key),
          softFail,
          time: new Date().toISOString(),
        }));
      }
      if (!softFail) {
        return { errorResponse: c.json({ success: false, error: 'Invalid LINE signature' }, 401) };
      }
      c.set('lineSignatureWarning', 'invalid-signature-soft-fail');
    } else {
      c.set('lineCredential', matchedCredential);
    }
  }

  try {
    return { body: JSON.parse(rawBody || '{}'), lineCredential: c.get('lineCredential') || null };
  } catch (err) {
    return { errorResponse: c.json({ success: false, error: `Invalid JSON: ${err.message}` }, 400) };
  }
}

async function filterDuplicateEvents(c, events) {
  if (!c.env.SESSIONS) return events;
  try {
    const fresh = [];
    for (const event of events) {
      const id = event?.webhookEventId;
      if (!id) { fresh.push(event); continue; }
      const key = `line:webhook:${id}`;
      if (await c.env.SESSIONS.get(key)) continue;
      await c.env.SESSIONS.put(key, '1', { expirationTtl: 24 * 60 * 60 });
      fresh.push(event);
    }
    return fresh;
  } catch (err) {
    console.warn('[LINE Webhook] Duplicate filter skipped:', err.message);
    return events;
  }
}

// Atomically claim a single event by its webhookEventId.
// Returns true if this is the first time we've seen it (caller should process),
// false if it was already claimed (LINE redelivery — caller should skip).
// Shares the same marker key scheme as filterDuplicateEvents so the two paths
// never double-process the same event.
async function markEventOnce(c, event) {
  if (!c.env.SESSIONS) return true; // no KV → cannot dedup, process anyway
  const id = event?.webhookEventId;
  if (!id) return true; // no id → cannot dedup
  const key = `line:webhook:${id}`;
  try {
    if (await c.env.SESSIONS.get(key)) return false; // already claimed
    await c.env.SESSIONS.put(key, '1', { expirationTtl: 24 * 60 * 60 });
    return true;
  } catch (err) {
    console.warn('[LINE Webhook] markEventOnce skipped:', err.message);
    return true; // fail-open: better to risk a rare double than drop a reply
  }
}

async function releaseDuplicateEvents(c, events) {
  if (!c.env.SESSIONS || !Array.isArray(events)) return;
  try {
    const deletes = events
      .map((event) => event?.webhookEventId ? c.env.SESSIONS.delete(`line:webhook:${event.webhookEventId}`) : null)
      .filter(Boolean);
    if (deletes.length) await Promise.all(deletes);
  } catch (err) {
    console.warn('[LINE Webhook] Failed to release duplicate markers:', err.message);
  }
}

async function rememberTuktukFeatureDebug(c, event, command, status, extra = {}) {
  if (!c.env.SESSIONS) return;
  try {
    await c.env.SESSIONS.put('debug:last_tuktuk_feature', JSON.stringify({
      status,
      command: command?.type || null,
      text: event?.message?.type === 'text' ? normalizeLineText(event.message.text).slice(0, 120) : undefined,
      hasReplyToken: Boolean(event?.replyToken),
      webhookEventId: event?.webhookEventId || null,
      time: new Date().toISOString(),
      ...extra,
    }));
  } catch (err) {
    console.warn('[LINE Webhook] Failed to write TukTuk feature debug:', err.message);
  }
}

async function rememberLineEventDebug(c, status, events, extra = {}) {
  if (!c.env.SESSIONS) return;
  try {
    await c.env.SESSIONS.put('debug:last_line_event', JSON.stringify({
      status,
      count: Array.isArray(events) ? events.length : 0,
      events: (events || []).slice(0, 5).map((event) => {
        const text = event?.message?.type === 'text' ? normalizeLineText(event.message.text) : '';
        return {
          type: event?.type || null,
          messageType: event?.message?.type || null,
          text: text.slice(0, 160),
          pinMatch: text ? isPinRequestText(text) : false,
          hasReplyToken: Boolean(event?.replyToken),
          webhookEventId: event?.webhookEventId || null,
          isRedelivery: Boolean(event?.deliveryContext?.isRedelivery),
          sourceType: event?.source?.type || null,
          userId: event?.source?.userId || null,
          groupId: event?.source?.groupId || null,
          roomId: event?.source?.roomId || null,
        };
      }),
      time: new Date().toISOString(),
      ...extra,
    }), { expirationTtl: 24 * 60 * 60 });
  } catch (err) {
    console.warn('[LINE Webhook] Failed to write event debug:', err.message);
  }
}

async function rememberPinFlowDebug(c, status, event, extra = {}) {
  if (!c.env.SESSIONS) return;
  try {
    await c.env.SESSIONS.put('debug:last_pin_flow', JSON.stringify({
      status,
      text: event?.message?.type === 'text' ? normalizeLineText(event.message.text).slice(0, 160) : '',
      hasReplyToken: Boolean(event?.replyToken),
      webhookEventId: event?.webhookEventId || null,
      sourceType: event?.source?.type || null,
      userId: event?.source?.userId || null,
      time: new Date().toISOString(),
      ...extra,
    }), { expirationTtl: 24 * 60 * 60 });
  } catch (err) {
    console.warn('[LINE Webhook] Failed to write PIN debug:', err.message);
  }
}

async function replyToLine(lineAccessToken, replyToken, messages) {  return fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineAccessToken}`
    },
    body: JSON.stringify({ replyToken, messages })
  });
}

async function pushToLine(lineAccessToken, userId, messages) {  return fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineAccessToken}`
    },
    body: JSON.stringify({ to: userId, messages })
  });
}

function waitUntilIfAvailable(c, task) {
  try {
    const executionCtx = c.executionCtx || c.env?.executionCtx;
    if (executionCtx?.waitUntil) {
      executionCtx.waitUntil(task);
      return true;
    }
    // Fallback if no executionCtx found in Hono context (e.g. some middleware stripped it)
    if (c.env?.waitUntil) {
      c.env.waitUntil(task);
      return true;
    }
  } catch (err) {
    console.warn('[LINE Webhook] waitUntil unavailable:', err.message);
  }
  // If we can't background it, we must await it inline to prevent it from being killed!
  // Note: Since this function is sync, we can't await it here.
  return false;
}

function isPinRequestText(text) {
  const value = normalizeLineText(text).toLowerCase();
  if (!value) return false;

  const negativeWords = [
    'ปล่อยของ',
    'โพสต์',
    'ลงขาย',
    'ขายของ',
    'ทำไม',
    'ปัญหา',
    'เข้าแล้ว',
    'สำเร็จแล้ว',
    'แจ้ง',
    'bug',
    'ไม่ต้อง',
    'ไม่เอา',
  ];
  const hasNegative = negativeWords.some((word) => value.includes(word));
  if (value.length > 32 && hasNegative) return false;

  const commands = [
    'รหัส',
    'ขอรหัส',
    'ขอรหัสผ่าน',
    'รหัสผ่าน',
    'pin',
    'ขอ pin',
    'login',
    'เข้าสู่ระบบ',
    'รับรหัส',
  ];
  const suffixes = [
    '',
    'หน่อย',
    'ครับ',
    'ค่ะ',
    'คะ',
    'ด้วย',
  ];
  if (commands.some((command) => suffixes.some((suffix) => value === command + suffix))) return true;

  const looseWords = [
    'รหัส',
    'pin',
    'login',
    'เข้าสู่ระบบ',
  ];
  return value.length <= 24 && looseWords.some((word) => value.includes(word)) && !hasNegative;
}

function shouldUseTuktukAi(events) {
  const event = events.find(e => e?.type === 'message' && e.message?.type === 'text' && e.replyToken);
  const text = normalizeLineText(event?.message?.text || '');
  if (!text) return false;
  if (/^(เมนู|menu|help|ช่วย|เริ่ม|ตลาด|market|ซื้อ|ขาย|วิน|win|มอเตอร์ไซค์)$/i.test(text)) return false;
  if (/^(ปล่อยของ|โพสต์|ลงขาย|ลงสินค้า|ขายของ)$/i.test(text)) return false;
  if (isPinRequestText(text)) return false;
  // มีเครื่องหมายคำถาม หรือคำบ่งบอกว่าเป็นคำถาม/ขอความช่วยเหลือ → เข้า AI แม้ข้อความสั้น
  const questionHints = /(ไหม|มั้ย|หรือเปล่า|ยังไง|อย่างไร|เท่าไหร่|เท่าไร|กี่|ที่ไหน|อะไร|ทำไม|แนะนำ|ช่วย|อยาก|ขอ|มี.*ไหม|ราคา|[?？])/;
  if (questionHints.test(text)) return true;
  return text.length >= 6;
}
// Helper: จัดการคัดกรองและส่งต่อ LINE Webhook Event
async function processPinRequest(c, { pinEvent, userId, replyToken, lineAccessToken, isTuktuk }) {
  try {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    // Magic link → /app/login?pin= auto-logs in immediately (1 tap, no typing)
    const appLoginUri = `https://tuktukfeed.com/app/login?pin=${pin}`;
    // Fallback for users who prefer the old web interface
    const loginUri = `https://tuktukfeed.com/login.html?redirectUrl=${encodeURIComponent('/profile.html')}&pin=${pin}`;
    const pinDisplay = `${pin.slice(0, 3)} ${pin.slice(3)}`;

    const pinMessages = [{
      type: 'flex',
      altText: `🔑 รหัสเข้าใช้งาน TukTuk: ${pin} (ใช้ได้ 24 ชม.)`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          paddingAll: 'xl',
          paddingBottom: 'lg',
          backgroundColor: '#8B5CF6',
          contents: [
            {
              type: 'text',
              text: '🔑 รหัสเข้าใช้งาน',
              size: 'xl',
              weight: 'bold',
              color: '#FFFFFF',
            },
            {
              type: 'text',
              text: 'ใช้สำหรับเข้าสู่ระบบเว็บไซต์',
              size: 'sm',
              color: '#EDE9FE',
              margin: 'sm',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: 'xl',
          backgroundColor: '#1E1B2E',
          spacing: 'lg',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#2A2440',
              cornerRadius: 'xxl',
              borderColor: '#8B5CF6',
              borderWidth: '2px',
              paddingAll: 'xxl',
              contents: [
                {
                  type: 'text',
                  text: pinDisplay,
                  size: '3xl',
                  weight: 'bold',
                  color: '#C4B5FD',
                  align: 'center',
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '⏰ หมดอายุใน',
                  size: 'sm',
                  color: '#A78BFA',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: '24 ชั่วโมง',
                  size: 'sm',
                  color: '#FDE68A',
                  weight: 'bold',
                  align: 'end',
                },
              ],
            },
            {
              type: 'text',
              text: 'กรอกรหัสผ่านนี้ที่หน้าเว็บไซต์เพื่อเข้าสู่ระบบ',
              size: 'xs',
              color: '#9CA3AF',
              wrap: true,
              align: 'center',
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          paddingAll: 'xl',
          paddingTop: 'md',
          backgroundColor: '#1E1B2E',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'md',
              color: '#8B5CF6',
              action: {
                type: 'uri',
                // Magic link: taps this → /app auto-submits the PIN → logged in instantly
                label: '⚡ เข้าสู่ระบบทันที (1 แตะ)',
                uri: appLoginUri,
              },
            },
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '🌐 เว็บไซต์หลัก',
                uri: loginUri,
              },
            },
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'clipboard',
                clipboardText: pin,
                label: '📋 คัดลอกรหัส',
              },
            },
          ],
        },
      },
    }];

    // [KEY FIX] ส่ง LINE reply ก่อน ขณะที่ reply token ยังสด
    // D1 จะถูก save ภายหลัง เพื่อไม่ให้ D1 latency ทำให้ token หมดอายุ
    await rememberPinFlowDebug(c, 'pre_reply', pinEvent, {
      isTuktuk,
      userId,
      hasToken: Boolean(lineAccessToken),
      hasReplyToken: Boolean(replyToken),
    });

    const replyRes = await replyToLine(lineAccessToken, replyToken, pinMessages);

    if (!replyRes.ok) {
      const errText = await replyRes.text();
      if (c.env.SESSIONS) {
        await c.env.SESSIONS.put('debug:last_reply_error', JSON.stringify({
          status: replyRes.status,
          responseText: errText.slice(0, 1000),
          time: new Date().toISOString(),
          isTuktuk,
          reason: 'pin-reply',
        }));
      }
      await rememberPinFlowDebug(c, 'reply_failed', pinEvent, {
        isTuktuk, userId,
        lineStatus: replyRes.status,
        responseText: errText.slice(0, 500),
      });

      // Fallback: ลอง push แทน reply
      try {
        const pushRes = await pushToLine(lineAccessToken, userId, pinMessages);
        if (pushRes.ok) {
          await rememberPinFlowDebug(c, 'pushed_after_reply_failed', pinEvent, { isTuktuk, userId, replyStatus: replyRes.status });
          // Push สำเร็จ — ยังต้อง save D1
        } else {
          const pushErrText = await pushRes.text();
          if (c.env.SESSIONS) {
            await c.env.SESSIONS.put('debug:last_reply_error', JSON.stringify({
              status: replyRes.status,
              responseText: errText.slice(0, 1000),
              pushStatus: pushRes.status,
              pushResponseText: pushErrText.slice(0, 1000),
              time: new Date().toISOString(),
              isTuktuk,
              reason: 'pin-push',
            }));
          }
          await rememberPinFlowDebug(c, 'push_failed', pinEvent, {
            isTuktuk, userId,
            replyStatus: replyRes.status,
            pushStatus: pushRes.status,
            pushResponseText: pushErrText.slice(0, 500),
          });
          return; // ทั้ง reply และ push ล้มเหลว ไม่ต้อง save D1
        }
      } catch (pushErr) {
        await rememberPinFlowDebug(c, 'push_error', pinEvent, {
          isTuktuk, userId,
          replyStatus: replyRes.status,
          message: pushErr.message,
        });
        return;
      }
    } else {
      await rememberPinFlowDebug(c, 'replied', pinEvent, { isTuktuk, userId });
    }

    // บันทึก PIN ลง D1 หลังจาก reply/push สำเร็จแล้ว
    try {
      const db = new DB(c.env.DB);
      const isSuperAdmin = getSuperAdminIds(c.env).includes(userId);
      await db.d1.prepare(`
        INSERT OR REPLACE INTO web_pins (line_user_id, pin, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(userId, pin, expiresAt, Date.now()).run();
      await rememberPinFlowDebug(c, 'pin_saved', pinEvent, {
        isTuktuk, userId,
        pinMasked: pin.slice(0, 2) + '****',
        expiresAt,
      });

      // Sync user in background
      const syncUser = (async () => {
        let user = await db.getUserById(userId);
        if (!user) {
          await db.createUser({
            id: userId,
            lineUserId: userId,
            displayName: 'LINE User',
            pictureUrl: '',
            role: isSuperAdmin ? 'super_admin' : 'user',
            sellerStatus: 'none',
            isPremium: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } else {
          const updates = { updatedAt: Date.now() };
          if (isSuperAdmin && user.role !== 'super_admin') updates.role = 'super_admin';
          await db.updateUser(userId, updates);
        }
      })().catch((err) => console.warn('[LINE Webhook] Background user sync failed:', err.message));
      waitUntilIfAvailable(c, syncUser);
    } catch (dbErr) {
      // D1 save ล้มเหลว แต่ user ได้รับ PIN ผ่าน LINE แล้ว — log เท่านั้น
      console.error('[LINE Webhook] PIN D1 save failed (user already received PIN):', dbErr.message);
      await rememberPinFlowDebug(c, 'pin_save_failed', pinEvent, {
        isTuktuk, userId,
        message: dbErr.message,
      });
    }
  } catch (err) {
    console.error('[LINE Webhook] PIN processing error:', err.message);
    await rememberPinFlowDebug(c, 'error', pinEvent, { isTuktuk, userId, message: err.message });
  }
}


async function handleTuktukAiReplyBackground(c, events, db, lineAccessToken, replyToken) {
  try {
    const aiReply = await buildTuktukLineAiReply(c.env, events, db, tuktukQuickReply());
    if (aiReply) {
      const messages = [...aiReply.messages];
      if (aiReply.intent?.products && aiReply.products?.length) {
        messages.push(...buildProductCarousel(aiReply.products.slice(0, 5), 'สินค้าแนะนำจาก AI'));
      } else if (aiReply.intent?.feed && aiReply.videos?.length) {
        messages.push(...buildVideoCarousel(aiReply.videos.slice(0, 5), 'คลิปที่น่าสนใจ'));
      }

      const finalMessages = messages.slice(0, 5);
      const replyRes = await replyToLine(lineAccessToken, replyToken, finalMessages);
      if (replyRes.ok) {
        console.log(`[LINE Webhook] Replied from ${aiReply.source}`);
        return true;
      }
      const errText = await replyRes.text();
      console.error('[LINE Webhook] TukTuk AI reply failed:', errText);

      // Reply token likely expired (AI/LLM latency can exceed LINE's ~60s window).
      // Fall back to push so the user still gets the answer instead of silence.
      const userId = events.find(e => e?.source?.userId)?.source?.userId;
      if (userId) {
        const pushRes = await pushToLine(lineAccessToken, userId, finalMessages);
        if (pushRes.ok) {
          console.log(`[LINE Webhook] AI reply delivered via push fallback (${aiReply.source})`);
          return true;
        }
        console.error('[LINE Webhook] TukTuk AI push fallback failed:', await pushRes.text());
      }
    }
  } catch (err) {
    console.warn('[LINE Webhook] TukTuk AI background reply failed:', err.message);
  }
  return false;
}

async function handleWorkerFallbackBackground(c, events, lineAccessToken, reason) {
  try {
    const event = events.find(e => e?.type === 'message' && e.message?.type === 'text' && e.replyToken);
    if (!event) return;

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
          isTuktuk: true,
          reason,
        })).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[LINE Webhook] Worker fallback background failed:', err.message);
  }
}

async function handleTuktukWebhookBackground(c, events, lineCredential, lineAccessToken) {
  try {
    // 0. ต้อนรับผู้ใช้ใหม่ (follow event)
    if (await handleFollowEventsBackground(c, events, lineAccessToken, true)) {
      return;
    }

    // 1. ลองประมวลผลผ่าน Feature Events (Menu, Search, Market, etc.)
    const featureReply = await handleTuktukFeatureEvents(c, events, lineCredential);
    if (featureReply !== null) {
      return; // จัดการเสร็จสิ้นแล้ว
    }

    const db = new DB(c.env.DB);
    const event = events.find(e => e?.replyToken && (
      (e.type === 'message' && e.message?.type === 'text') ||
      e.type === 'postback'
    ));
    if (!event) return;

    // 2. ถ้าไม่ตรง Feature และเข้าข่ายใช้งาน AI
    if (shouldUseTuktukAi(events)) {
      const replied = await handleTuktukAiReplyBackground(c, events, db, lineAccessToken, event.replyToken);
      if (replied) return;
    }

    // 3. Fallback ทั่วไป
    await handleWorkerFallbackBackground(c, events, lineAccessToken, 'no-specific-handler');
  } catch (err) {
    console.error('[LINE Webhook] handleTuktukWebhookBackground failed:', err.message);
  }
}



async function handleWebhookEvent(c, isTuktuk = false) {
  let events = [];
  try {
    const verified = await readVerifiedLineWebhook(c, isTuktuk);
    if (verified.errorResponse) return verified.errorResponse;
    const body = verified.body;
    const lineCredential = verified.lineCredential || null;
    events = body.events || [];
    await rememberLineEventDebug(c, 'received', events, {
      isTuktuk,
      credential: lineCredential?.key || null,
      signatureWarning: c.get('lineSignatureWarning') || null,
    });
    
    // หากเป็น Verification request (events ว่างเปล่า) ให้ตอบกลับ 200 OK ทันทีโดยไม่ต้องรันต่อ
    if (events.length === 0) {
      console.log('[LINE Webhook] Empty events array received (Verify request). Returning 200 OK.');
      return c.text('OK', 200);
    }
    
    const pinCandidateEvent = events.find(e =>
      e.type === 'message' &&
      e.message?.type === 'text' &&
      isPinRequestText(e.message.text)
    );

    if (pinCandidateEvent) {
      const userId = pinCandidateEvent.source.userId;
      const replyToken = pinCandidateEvent.replyToken;
      if (!userId) {
        await rememberPinFlowDebug(c, 'missing_user_id', pinCandidateEvent, { isTuktuk });
        return c.json({ success: true, source: 'pin-no-user-id' });
      }
      
      const lineAccessToken = getLineAccessToken(c.env, isTuktuk, lineCredential);
      await rememberPinFlowDebug(c, 'matched', pinCandidateEvent, {
        isTuktuk,
        hasAccessToken: Boolean(lineAccessToken),
        credential: lineCredential?.key || null,
      });

      if (!lineAccessToken) {
        console.warn('[LINE Webhook] Missing LINE Access Token in Worker env. Returning 200.');
        await rememberPinFlowDebug(c, 'missing_access_token', pinCandidateEvent, { isTuktuk });
        return c.json({ success: true, source: 'pin-no-token' });
      }

      // Dedup: a LINE redelivery of the same "รหัส" message must not mint a
      // second PIN (which would invalidate the first via INSERT OR REPLACE).
      if (!(await markEventOnce(c, pinCandidateEvent))) {
        console.log('[LINE Webhook] Duplicate PIN request skipped.');
        await rememberPinFlowDebug(c, 'duplicate_skipped', pinCandidateEvent, { isTuktuk });
        return c.json({ success: true, source: 'pin-duplicate-skipped' });
      }

      // [BUG FIX] ทำงานใน background ทันทีโดยใช้ waitUntilIfAvailable
      // เพื่อรีบส่ง HTTP 200 กลับไปให้ LINE Server ภายใน 1 วินาที ป้องกันการ Timeout (outcome: canceled)
      const bgTask = processPinRequest(c, {
        pinEvent: pinCandidateEvent,
        userId,
        replyToken,
        lineAccessToken,
        isTuktuk,
      }).catch(async (err) => {
        console.error('[LINE Webhook] processPinRequest failed:', err.message);
        await releaseDuplicateEvents(c, [pinCandidateEvent]);
      });

      if (!waitUntilIfAvailable(c, bgTask)) {
        await bgTask; // wait inline if background fails
      }

      return c.json({ success: true, source: 'pin-queued' });
    }

    // สำหรับ Event ทั่วไป
    const lineAccessToken = getLineAccessToken(c.env, isTuktuk, lineCredential);
    if (!lineAccessToken) {
      console.warn('[LINE Webhook] Missing LINE Access Token in Worker env. Returning 200.');
      return c.json({ success: true, source: 'no-token' });
    }

    // [BUG FIX] ยกยอดการทำงานหนักทั้งหมด (D1 query, KV lookup/write, Fetch call) ไปทำใน background
    // เพื่อให้ Worker ตอบกลับ LINE ภายใน 10-50ms ป้องกันปัญหา LINE Timeout/Aborted จากญี่ปุ่น
    const bgTask = (async () => {
      const incomingEvents = events;
      try {
        events = await filterDuplicateEvents(c, events);
        if (events.length === 0) {
          console.log('[LINE Webhook] All events skipped as duplicates.');
          await rememberLineEventDebug(c, 'duplicate_skipped', incomingEvents, { isTuktuk });
          return;
        }
        await rememberLineEventDebug(c, 'processing', events, { isTuktuk });

        if (isTuktuk) {
          await handleTuktukWebhookBackground(c, events, lineCredential, lineAccessToken);
        }
      } catch (err) {
        console.error('[LINE Webhook Background Global Catch] Error:', err.message);
        await releaseDuplicateEvents(c, incomingEvents);
        try {
          if (c.env.SESSIONS) {
            await c.env.SESSIONS.put('debug:last_webhook_error', JSON.stringify({
              message: err.message,
              errorType: err.constructor?.name || 'Error',
              time: new Date().toISOString(),
              isTuktuk
            }));
          }
        } catch (kvErr) {
          console.error('Failed to write error to KV SESSIONS:', kvErr);
        }
      }
    })();

    if (!waitUntilIfAvailable(c, bgTask)) {
      await bgTask;
    }

    return c.json({ success: true, source: 'event-queued' });
  } catch (err) {
    const isCodingError = err instanceof ReferenceError || err instanceof TypeError;
    console.error(`[LINE Webhook Global Catch] ${isCodingError ? 'CODING ERROR' : 'Error'}:`, err.message);
    try {
      if (c.env.SESSIONS) {
        await c.env.SESSIONS.put('debug:last_webhook_error', JSON.stringify({
          message: err.message,
          errorType: err.constructor?.name || 'Error',
          time: new Date().toISOString(),
          isTuktuk
        }));
      }
    } catch (kvErr) {
      console.error('Failed to write error to KV SESSIONS:', kvErr);
    }
    return c.json({ success: false, error: err.message }, 200);
  }
}


async function performRichProductSearch(db, keyword) {
  try {
    // 1. ค้นหาสินค้าตรงคำค้น (ตรงตัว)
    const matched = await db.searchProducts(keyword, 5);
    for (const p of matched) {
      p.customBadge = { text: '🔍 ค้นเจอ', bg: '#1E3A8A', color: '#60A5FA' };
    }

    // 2. ถ้าเจอสินค้า ให้ไปดึงสินค้าอื่นจากผู้ขายรายเดียวกันมาเสริม
    let sameSellerProducts = [];
    if (matched.length > 0) {
      const matchedIds = matched.map(p => p.id);
      const sellerIds = [...new Set(matched.map(p => p.seller_id).filter(Boolean))];

      if (sellerIds.length > 0) {
        try {
          const placeholders = sellerIds.map(() => '?').join(',');
          const idPlaceholders = matchedIds.map(() => '?').join(',');
          const query = `
            SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
            FROM products p LEFT JOIN users u ON p.seller_id = u.id
            WHERE p.status = 'active'
              AND p.seller_id IN (${placeholders})
              AND p.id NOT IN (${idPlaceholders})
            ORDER BY p.views_count DESC
            LIMIT 4
          `;
          const res = await db.d1.prepare(query).bind(...sellerIds, ...matchedIds).all();
          sameSellerProducts = res.results || [];
          for (const p of sameSellerProducts) {
            p.customBadge = { text: '🏪 ร้านเดียวกัน', bg: '#065F46', color: '#34D399' };
          }
        } catch (err) {
          console.warn('[Rich Search] Failed to fetch same-seller products:', err.message);
        }
      }
    }

    // 3. ถ้าของยังไม่ครบ 8 รายการ ให้ดึงสินค้ายอดฮิตอื่นๆ มาเติม
    let trendingProducts = [];
    const excludeIds = [...matched.map(p => p.id), ...sameSellerProducts.map(p => p.id)];
    const needed = 8 - (matched.length + sameSellerProducts.length);
    if (needed > 0) {
      try {
        const placeholders = excludeIds.length > 0 
          ? `AND p.id NOT IN (${excludeIds.map(() => '?').join(',')})` 
          : '';
        const query = `
          SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
          FROM products p LEFT JOIN users u ON p.seller_id = u.id
          WHERE p.status = 'active'
            ${placeholders}
          ORDER BY p.views_count DESC, p.created_at DESC
          LIMIT ?
        `;
        const bindArgs = excludeIds.length > 0 ? [...excludeIds, needed] : [needed];
        const res = await db.d1.prepare(query).bind(...bindArgs).all();
        trendingProducts = res.results || [];
        for (const p of trendingProducts) {
          p.customBadge = { text: '🔥 แนะนำเพิ่ม', bg: '#581C87', color: '#E9D5FF' };
        }
      } catch (err) {
        console.warn('[Rich Search] Failed to fetch trending products:', err.message);
      }
    }

    return [...matched, ...sameSellerProducts, ...trendingProducts];
  } catch (err) {
    console.error('[Rich Search] Error performing rich search:', err.message);
    return [];
  }
}

async function handleTuktukFeatureEvents(c, events, lineCredential = null) {
  const event = events.find(e => e?.replyToken && (
    (e.type === 'message' && e.message?.type === 'text') ||
    e.type === 'postback'
  ));
  if (!event) return null;

  const command = parseTuktukCommand(event);
  if (!command) return null;
  await rememberTuktukFeatureDebug(c, event, command, 'received');

  const lineAccessToken = getLineAccessToken(c.env, true, lineCredential);
  if (!lineAccessToken) {
    console.warn('[LINE Webhook] Missing TukTuk LINE access token');
    return c.json({ success: true, source: 'tuktuk-no-reply', reason: 'missing-token' });
  }

  const db = new DB(c.env.DB);
  let messages = null;

  if (command.type === 'menu') {
    messages = [buildTuktukMenuFlexMessage()];
  }

  if (command.type === 'market') {
    messages = buildTuktukFallbackMessages('ตลาด');
  }

  if (command.type === 'sell') {
    messages = buildTuktukFallbackMessages('ปล่อยของ');
  }

  if (command.type === 'win') {
    messages = buildTuktukFallbackMessages('วิน');
  }
  if (command.type === 'search_products') {
    const products = await performRichProductSearch(db, command.keyword);
    if (products.length > 0) {
      messages = buildProductCarousel(products, `ผลค้นหา: ${command.keyword}`);
    } else {
      if (command.isDirectSearch) {
        // ถ้าเป็นพิมพ์ค้นหาตรงๆ แล้วไม่เจอ ไม่ต้องตอบกล่องว่าง ให้ไปเข้า AI แทน
        return null;
      }
      messages = buildEmptyProductSearchReply(command.keyword);
    }
  }

  if (command.type === 'trending_products') {
    const products = await db.getTrendingProducts(8);
    messages = products.length
      ? buildProductCarousel(products, 'สินค้ายอดฮิต')
      : [{ type: 'text', text: 'ตอนนี้ยังไม่มีสินค้ายอดฮิตให้แสดงครับ', quickReply: tuktukQuickReply() }];
  }

  if (command.type === 'trending_videos') {
    const videos = await db.getTrendingVideos(8);
    messages = videos.length
      ? buildVideoCarousel(videos, 'คลิปยอดนิยม')
      : [{ type: 'text', text: 'ตอนนี้ยังไม่มีคลิปยอดนิยมให้แสดงครับ', quickReply: tuktukQuickReply() }];
  }

  // ── คำสั่งผู้ขาย: shop / stock / shop_stats ──
  if (command.type === 'shop' || command.type === 'stock' || command.type === 'shop_stats') {
    const userId = event.source?.userId;
    if (!userId) {
      messages = [{
        type: 'text',
        text: 'ขออภัยครับ ไม่สามารถระบุตัวตนของคุณได้ (คำสั่งนี้ใช้ได้เฉพาะแชทส่วนตัวกับบอทเท่านั้น)',
        quickReply: tuktukQuickReply(),
      }];
    } else {
      const user = await db.getUserById(userId).catch(() => null);
      const isSeller = user && (user.seller_status === 'verified' || user.role === 'super_admin');

      if (!isSeller) {
        messages = [buildBecomeSellerFlex()];
      } else if (command.type === 'stock') {
        const products = await db.getProductsBySeller(userId, 20).catch(() => []);
        messages = [buildStockFlex(products)];
      } else if (command.type === 'shop_stats') {
        const stats = await db.getSellerStats(userId).catch(() => null);
        messages = [buildShopStatsFlex(stats, user)];
      } else {
        const stats = await db.getSellerStats(userId).catch(() => null);
        messages = [buildShopMenuFlex(user, stats)];
      }
    }
  }

  if (!messages) return null;

  const replyRes = await replyToLine(lineAccessToken, event.replyToken, messages);
  if (!replyRes.ok) {
    const errText = await replyRes.text();
    console.error('[LINE Webhook] TukTuk feature reply failed:', errText);
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put('debug:last_reply_error', JSON.stringify({
        status: replyRes.status,
        responseText: errText.slice(0, 1000),
        time: new Date().toISOString(),
        isTuktuk: true,
        reason: `tuktuk-${command.type}`,
      }));
    }
    await rememberTuktukFeatureDebug(c, event, command, 'reply_failed', { lineStatus: replyRes.status, responseText: errText.slice(0, 300) });
    const fallbackText = tuktukFeatureFallbackText(command.type);
    if (fallbackText) {
      // The reply token was already consumed by the failed reply above and is
      // single-use — use push (not reply) so the fallback can actually deliver.
      const fallbackMsg = [{
        type: 'text',
        text: fallbackText,
        quickReply: tuktukQuickReply(),
      }];
      const userId = event.source?.userId;
      const fallbackRes = userId
        ? await pushToLine(lineAccessToken, userId, fallbackMsg)
        : await replyToLine(lineAccessToken, event.replyToken, fallbackMsg);
      if (fallbackRes.ok) return c.json({ success: true, source: `tuktuk-${command.type}-text-fallback` });
      console.error('[LINE Webhook] TukTuk text fallback failed:', await fallbackRes.text());
    }
    await releaseDuplicateEvents(c, events);
    return c.json({ success: false, source: 'tuktuk-feature', status: replyRes.status }, 200);
  }
  await rememberTuktukFeatureDebug(c, event, command, 'replied');
  return c.json({ success: true, source: `tuktuk-${command.type}` });
}

function parseTuktukCommand(event) {
  if (event.type === 'postback') {
    const data = event.postback?.data || '';
    const params = new URLSearchParams(data.startsWith('?') ? data.slice(1) : data);
    const action = params.get('action') || data;
    if (/trending_products|hot_products|popular_products/i.test(action)) return { type: 'trending_products' };
    if (/trending_videos|hot_videos|popular_videos/i.test(action)) return { type: 'trending_videos' };
    // Rich-menu buttons commonly use postback actions — decode the core commands
    // so a tap on the LINE rich menu works the same as typing the keyword.
    if (/^(menu|help)$/i.test(action)) return { type: 'menu' };
    if (/^(market|ตลาด)$/i.test(action)) return { type: 'market' };
    if (/^(sell|ปล่อยของ|post)$/i.test(action)) return { type: 'sell' };
    if (/^(win|วิน)$/i.test(action)) return { type: 'win' };
    if (/^(shop|myshop|store)$/i.test(action)) return { type: 'shop' };
    if (/^(stock|inventory)$/i.test(action)) return { type: 'stock' };
    if (/^(shop_stats|dashboard|stats)$/i.test(action)) return { type: 'shop_stats' };
    return null;
  }

  const text = normalizeLineText(event.message?.text || '');
  if (!text) return null;
  if (/^(เมนู|menu|help|ช่วย|เริ่ม)$/i.test(text)) return { type: 'menu' };
  // Note: bare "ขาย" routes to sell (below), not market — user intent is to sell.
  if (/^(ตลาด|market|ซื้อ)$/i.test(text)) return { type: 'market' };
  if (/^(ปล่อยของ|โพสต์|ลงขาย|ลงสินค้า|ขายของ|ขาย)$/i.test(text)) return { type: 'sell' };
  if (/^(วิน|win|มอเตอร์ไซค์)$/i.test(text)) return { type: 'win' };
  if (/^(สินค้ายอดฮิต|สินค้าแนะนำ|ของฮิต|trending products)$/i.test(text)) return { type: 'trending_products' };
  if (/^(คลิปยอดนิยม|วิดีโอยอดนิยม|คลิปยอดฮิต|ดูเพลิน|trending videos)$/i.test(text)) return { type: 'trending_videos' };
  // ── คำสั่งผู้ขาย ──
  if (/^(shop|ร้าน|ร้านฉัน|ร้านของฉัน|เข้าร้าน|จัดการร้าน|my ?shop|store)$/i.test(text)) return { type: 'shop' };
  if (/^(สต๊อก|สต็อก|สต๊อค|สต็อค|stock|เช็คสต๊อก|เช็คสต็อก|เช็คสต๊อค|คลัง|inventory)$/i.test(text)) return { type: 'stock' };
  if (/^(ยอดขาย|สรุปร้าน|สถิติร้าน|dashboard|แดชบอร์ด)$/i.test(text)) return { type: 'shop_stats' };

  const search = extractProductSearchKeyword(text);
  if (search) return { type: 'search_products', keyword: search };

  // [Joy of Trading] รองรับการพิมพ์ชื่อสินค้าตรงๆ โดยจำกัดความยาว
  // และเลี่ยงข้อความเชิงสนทนา/อารมณ์/คำถาม เพื่อให้ AI (อาจารย์วิทยา) รับช่วงแทน
  // ไม่ตีความเป็นการค้นหาสินค้า (ป้องกัน carousel ที่ไม่เกี่ยวข้อง)
  if (text.length >= 2 && text.length <= 35 && !/[?？]/.test(text)) {
    // คำ/วลีที่ควรส่งให้ AI ไม่ใช่ค้นหาสินค้า
    const conversationalPatterns = [
      /^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|ดีจ้า|hi|hello|hey| hola)/i,
      /^(บ๊ายบาย|บาย|ลาก่อน|bye|goodbye)/i,
      /^(ขอบคุณ|ขอบใจ|thank|thanks|ty)/i,
      /(ทำไม|อย่างไร|ยังไง|เท่าไหร่|เท่าไร|ที่ไหน|เมื่อไหร่|เมื่อไร|ใคร|อะไร|ไหม|หรือเปล่า|รึเปล่า|มั้ย)/i, // คำถาม
      /(เบื่อ|เหงา|เศร้า|ดีใจ|เสียใจ|รัก|เกลียด|โกรธ|ง่วง|หิว|เครียด|สบายดี|เป็นไง|เป็นยังไง)/i, // อารมณ์/สนทนา
      /(ช่วย|สอน|แนะนำ|อธิบาย|บอก|คือ|หมายถึง|แปลว่า)/i, // ขอความช่วยเหลือ/ความรู้ → AI
      /^(ok|โอเค|โอเคร|ครับ|ค่ะ|จ้า|555|อืม|เอ่อ|ha|lol)/i, // คำรับ/เสียงประกอบ
    ];
    const isConversational = conversationalPatterns.some((re) => re.test(text));
    if (!isConversational) {
      return { type: 'search_products', keyword: text, isDirectSearch: true };
    }
  }

  return null;
}

function normalizeLineText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function extractProductSearchKeyword(text) {
  const patterns = [
    /^(?:หา|ค้นหา|ซื้อ|อยากได้)\s+(.+)$/i,
    /^(?:search|market)\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const keyword = match?.[1]?.trim();
    if (keyword && keyword.length >= 2) return keyword;
  }
  return null;
}

function tuktukFeatureFallbackText(type) {
  const site = 'https://tuktukfeed.com';
  if (type === 'menu') return ['เมนู TukTuk Feed', '', '- พิมพ์ "รหัส" เพื่อรับ PIN', '- พิมพ์ "ตลาด" เพื่อเปิด Marketplace', '- พิมพ์ "หา เสื้อ" เพื่อค้นสินค้า', '- พิมพ์ "สินค้ายอดฮิต" หรือ "คลิปยอดนิยม"', '', site + '/app/'].join('\n');
  if (type === 'market') return 'เปิดตลาด TukTuk ได้ที่นี่ครับ\n' + site + '/app/market\n\nพิมพ์ "หา เสื้อ" หรือ "สินค้ายอดฮิต" เพื่อค้นต่อ';
  if (type === 'sell') return 'ลงขายหรือโพสต์บน TukTuk ได้ที่นี่ครับ\n' + site + '/app/post\n\nถ้าหน้าเว็บถามรหัส ให้พิมพ์ "รหัส" ใน LINE เพื่อรับ PIN';
  if (type === 'win') return 'บริการ WIN Rider เข้าใช้งานได้ที่\n' + site + '/win-service.html\n\nพิมพ์ "รหัส" เพื่อขอ PIN เข้าเว็บ';
  if (type === 'shop' || type === 'shop_stats') return 'จัดการร้านของคุณได้ที่\n' + site + '/seller-dashboard.html\n\nพิมพ์ "สต๊อก" เพื่อเช็คสินค้าคงเหลือ หรือ "รหัส" เพื่อขอ PIN เข้าเว็บ';
  if (type === 'stock') return 'เช็คและแก้ไขสต๊อกสินค้าได้ที่\n' + site + '/seller-dashboard.html\n\nพิมพ์ "รหัส" เพื่อขอ PIN เข้าเว็บ';
  return null;
}

function buildProductCarousel(products, title) {
  return [{
    type: 'flex',
    altText: title,
    contents: {
      type: 'carousel',
      contents: products.slice(0, 10).map(productBubble),
    },
  }];
}

function buildVideoCarousel(posts, title) {
  return [{
    type: 'flex',
    altText: title,
    contents: {
      type: 'carousel',
      contents: posts.slice(0, 10).map(videoBubble),
    },
  }];
}

function productBubble(product) {
  const imageUrl = firstHttpsUrl(product.images) || 'https://placehold.co/1200x900/0F172A/ffffff?text=TukTuk+Product';
  const url = `https://tuktukfeed.com/product.html?id=${encodeURIComponent(product.id)}`;
  const category = truncate(product.category || 'ทั่วไป', 16).toUpperCase();
  const location = product.seller_location || product.sellerLocation || product.province || 'ไม่ระบุจังหวัด';
  const sellerName = product.seller_name || product.sellerName || 'ร้านค้าสมาชิก';
  const views = formatCount(product.views_count || product.viewCount || 0);
  const isOtop = product.is_otop === 1 || product.is_otop === true || product.isOtop === 1 || product.isOtop === true || product.isOTOP === true;

  return compactObject({
    type: 'bubble',
    size: 'mega',
    hero: {
      type: 'image',
      url: imageUrl,
      size: 'full',
      aspectRatio: '4:3',
      aspectMode: 'cover',
      action: { type: 'uri', uri: url },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      backgroundColor: '#0F172A',
      paddingAll: '16px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: product.customBadge?.bg || '#1E3A8A',
              cornerRadius: '12px',
              paddingStart: '8px',
              paddingEnd: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
              flex: 0,
              contents: [{
                type: 'text',
                text: product.customBadge?.text 
                  ? `${product.customBadge.text} · ${category}`
                  : `# ${category}`,
                color: product.customBadge?.color || '#60A5FA',
                size: 'xxs',
                weight: 'bold',
                align: 'center',
              }],
            },
            ...(isOtop ? [{
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#78350F',
              cornerRadius: '12px',
              paddingStart: '8px',
              paddingEnd: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
              flex: 0,
              contents: [{
                type: 'text',
                text: 'OTOP',
                color: '#FBBF24',
                size: 'xxs',
                weight: 'bold',
                align: 'center',
              }],
            }] : []),
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#022C22',
              cornerRadius: '12px',
              paddingStart: '8px',
              paddingEnd: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
              flex: 0,
              contents: [{
                type: 'text',
                text: `👁 ${views} ผู้เข้าชม`,
                color: '#34D399',
                size: 'xxs',
                weight: 'bold',
                align: 'center',
              }],
            },
          ],
        },
        {
          type: 'text',
          text: truncate(product.title || product.productName || 'สินค้าคุณภาพ', 52),
          weight: 'bold',
          size: 'lg',
          color: '#FFFFFF',
          wrap: true,
          maxLines: 2,
        },
        {
          type: 'box',
          layout: 'baseline',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: formatPrice(product.price),
              color: '#34D399',
              weight: 'bold',
              size: 'xl',
            },
            ...(product.product_unit ? [{
              type: 'text',
              text: `/ ${product.product_unit}`,
              color: '#94A3B8',
              size: 'sm',
            }] : []),
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          margin: 'lg',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              spacing: 'sm',
              alignItems: 'flex-start',
              contents: [
                { type: 'text', text: '🏪', flex: 0, size: 'sm' },
                { type: 'text', text: truncate(sellerName, 28), size: 'sm', color: '#94A3B8', flex: 1, wrap: true },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              spacing: 'sm',
              alignItems: 'flex-start',
              contents: [
                { type: 'text', text: '📍', flex: 0, size: 'sm' },
                { type: 'text', text: truncate(location, 30), size: 'sm', color: '#F43F5E', weight: 'bold', flex: 1, wrap: true },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#0F172A',
      paddingAll: '16px',
      paddingTop: '0px',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          background: {
            type: 'linearGradient',
            angle: '90deg',
            startColor: '#06B6D4',
            endColor: '#3B82F6',
          },
          cornerRadius: '8px',
          paddingAll: '12px',
          action: {
            type: 'uri',
            label: 'ดูรายละเอียดสินค้า',
            uri: url,
          },
          contents: [
            {
              type: 'text',
              text: '🛍 ดูรายละเอียดสินค้า',
              color: '#FFFFFF',
              size: 'sm',
              weight: 'bold',
              align: 'center',
            }
          ]
        }
      ],
    },
  });
}

function safeFlexText(str) {
  if (!str) return ' ';
  return String(str).replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim() || ' ';
}

function safeFlexUrl(str) {
  if (!str) return '';
  return String(str).replace(/\s/g, '%20').replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
}

function videoBubble(post) {
  let rawTitle = post.title || post.content || 'วิดีโอจาก TukTuk Feed';
  rawTitle = String(rawTitle).replace(/<[^>]*>?/gm, ''); // Simple stripHtml fallback
  
  const imageUrl = safeFlexUrl(firstPostImage(post) || 'https://placehold.co/800x1000/0F172A/ffffff?text=TukTuk+Video');
  const videoUrl = safeFlexUrl(firstVideoUrl(post));
  const title = safeFlexText(rawTitle);
  const url = `https://tuktukfeed.com/app/?post=${encodeURIComponent(post.id || '')}`;
  const views = formatCount(post.views_count || post.viewCount || 0);
  const likes = formatCount(post.likes_count || post.likesCount || 0);

  const hero = {
    type: 'image',
    url: imageUrl,
    size: 'full',
    aspectRatio: '4:5',
    aspectMode: 'cover',
    action: { type: 'uri', uri: url }
  };

  return compactObject({
    type: 'bubble',
    size: 'mega',
    hero: hero,
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      backgroundColor: '#0F172A',
      paddingAll: '16px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#831843',
              cornerRadius: '12px',
              paddingStart: '8px',
              paddingEnd: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
              flex: 0,
              contents: [{
                type: 'text',
                text: '▶ คลิปเด่น',
                color: '#F472B6',
                size: 'xxs',
                weight: 'bold',
                align: 'center',
              }],
            },
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#4C1D95',
              cornerRadius: '12px',
              paddingStart: '8px',
              paddingEnd: '8px',
              paddingTop: '4px',
              paddingBottom: '4px',
              flex: 0,
              contents: [{
                type: 'text',
                text: '🔥 TRENDING',
                color: '#A78BFA',
                size: 'xxs',
                weight: 'bold',
                align: 'center',
              }],
            },
          ],
        },
        {
          type: 'text',
          text: truncate(title, 60),
          weight: 'bold',
          size: 'lg',
          color: '#FFFFFF',
          wrap: true,
          maxLines: 2,
        },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          margin: 'lg',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              spacing: 'sm',
              alignItems: 'flex-start',
              contents: [
                { type: 'text', text: '👤', flex: 0, size: 'sm' },
                {
                  type: 'text',
                  text: truncate(safeFlexText(post.author_name || 'สมาชิก TukTuk'), 24),
                  size: 'sm',
                  color: '#94A3B8',
                  flex: 1,
                  wrap: true,
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              spacing: 'sm',
              alignItems: 'flex-start',
              contents: [
                { type: 'text', text: '📈', flex: 0, size: 'sm' },
                {
                  type: 'text',
                  text: `ผู้ชม ${views} • ถูกใจ ${likes}`,
                  size: 'sm',
                  color: '#F43F5E',
                  weight: 'bold',
                  flex: 1,
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#0F172A',
      paddingAll: '16px',
      paddingTop: '0px',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          background: {
            type: 'linearGradient',
            angle: '90deg',
            startColor: '#EC4899',
            endColor: '#8B5CF6',
          },
          cornerRadius: '8px',
          paddingAll: '12px',
          action: {
            type: 'uri',
            label: 'รับชมคลิปวิดีโอ',
            uri: url,
          },
          contents: [
            {
              type: 'text',
              text: '🎬 รับชมคลิปวิดีโอ',
              color: '#FFFFFF',
              size: 'sm',
              weight: 'bold',
              align: 'center',
            }
          ]
        }
      ],
    },
  });
}

function buildEmptyProductSearchReply(keyword) {
  return [tuktukActionFlexMessage({
    altText: `ยังไม่พบสินค้า ${keyword}`,
    eyebrow: 'SEARCH',
    title: 'ยังไม่พบสินค้าที่ตรงคำค้น',
    subtitle: `คำค้น: ${truncate(keyword, 42)}`,
    accent: '#F59E0B',
    bullets: [
      'ลองใช้คำที่สั้นลง เช่น "หา เสื้อ" หรือ "หา อาหาร"',
      'เปิดตลาดเพื่อดูสินค้าที่กำลังขายอยู่ทั้งหมด',
      'ถ้าอยากลงขายเอง กดปุ่มลงขายได้ทันที',
    ],
    primaryAction: { label: 'เปิดตลาด', uri: 'https://tuktukfeed.com/app/market' },
    secondaryActions: [
      { label: 'สินค้ายอดฮิต', text: 'สินค้ายอดฮิต' },
      { label: 'ลงขายสินค้า', uri: 'https://tuktukfeed.com/app/post' },
    ],
  })];
}
function firstHttpsUrl(value) {
  const items = parseJsonList(value);
  for (const item of items) {
    const url = typeof item === 'string' ? item : item?.url;
    if (typeof url === 'string' && url.startsWith('https://')) return url;
  }
  return null;
}

function youtubeInfoFromUrl(url) {
  const value = String(url || '');
  const video = value.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/|\/v\/)([A-Za-z0-9_-]{11})/i);
  if (video) {
    const id = video[1];
    return { kind: 'video', id, url: `https://www.youtube.com/watch?v=${id}`, thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
  }
  const playlist = value.match(/[?&]list=([A-Za-z0-9_-]{10,})/i);
  if (playlist) {
    const id = playlist[1];
    return { kind: 'playlist', playlistId: id, url: `https://www.youtube.com/playlist?list=${id}`, thumbnailUrl: 'https://placehold.co/800x1000/0F172A/ffffff?text=YouTube+Playlist' };
  }
  return null;
}

function firstPostImage(post) {
  const direct = post.product_thumb || post.thumbnail_url || post.image_url;
  if (typeof direct === 'string' && direct.startsWith('https://')) return direct;
  const items = parseJsonList(post.media_urls);
  for (const item of items) {
    if (typeof item === 'object' && typeof item.thumbnailUrl === 'string' && item.thumbnailUrl.startsWith('https://')) return item.thumbnailUrl;
    const url = typeof item === 'string' ? item : item?.url;
    const yt = youtubeInfoFromUrl(url);
    if (yt) return yt.thumbnailUrl;
    if (typeof url === 'string' && url.startsWith('https://') && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return url;
  }
  return null;
}

function firstVideoUrl(post) {
  if (!post) return null;
  const direct = post.youtube_url || post.video_embed || post.video_url;
  if (typeof direct === 'string' && direct.startsWith('https://')) return direct;
  const items = parseJsonList(post.media_urls);
  for (const item of items) {
    const url = typeof item === 'string' ? item : item?.url;
    if (typeof url === 'string' && url.startsWith('https://') && (item?.type === 'youtube' || youtubeInfoFromUrl(url) || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || item?.type === 'video')) {
      return url;
    }
  }
  return null;
}

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [value];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [value];
  }
}

function stripHtml(text) {
  return String(text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text, max) {
  const clean = stripHtml(text);
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function formatPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return 'สอบถามราคา';
  return `฿${n.toLocaleString('th-TH')}`;
}

function formatCount(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function compactObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

// ── Seller (ผู้ขาย) Flex Messages ──────────────────────────────
const SHOP_ACCENT = '#8B5CF6';
const SHOP_SITE = 'https://tuktukfeed.com';

// ชวนสมัครเป็นผู้ขายเมื่อยังไม่ verified
function buildBecomeSellerFlex() {
  return {
    type: 'flex',
    altText: 'เปิดร้านค้าบน TukTuk Feed',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: SHOP_ACCENT,
        contents: [
          { type: 'text', text: '🏪 เปิดร้านของคุณ', size: 'xl', weight: 'bold', color: '#FFFFFF' },
          { type: 'text', text: 'เริ่มขายบน TukTuk Feed ฟรี', size: 'sm', color: '#EDE9FE', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: '#1E1B2E', spacing: 'md',
        contents: [
          { type: 'text', text: 'คุณยังไม่ได้เป็นผู้ขายครับ', color: '#E5E7EB', weight: 'bold', wrap: true },
          { type: 'text', text: 'สมัครเปิดร้านเพื่อลงสินค้า จัดการสต๊อก และดูยอดขายผ่าน LINE ได้ทันที', size: 'sm', color: '#9CA3AF', wrap: true },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'xl', paddingTop: 'md', backgroundColor: '#1E1B2E',
        contents: [
          { type: 'button', style: 'primary', height: 'md', color: SHOP_ACCENT,
            action: { type: 'uri', label: '🚀 สมัครเปิดร้าน', uri: `${SHOP_SITE}/seller-dashboard.html` } },
          { type: 'button', style: 'link', height: 'sm',
            action: { type: 'message', label: 'ขอรหัสเข้าเว็บ', text: 'รหัส' } },
        ],
      },
    },
  };
}

// เมนูร้านค้าหลัก (verified sellers)
function buildShopMenuFlex(user, stats) {
  const name = user?.display_name || 'ร้านของคุณ';
  const active = Number(stats?.active || 0);
  const outOfStock = Number(stats?.out_of_stock || 0);
  return {
    type: 'flex',
    altText: `🏪 ร้านของ ${name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: SHOP_ACCENT,
        contents: [
          { type: 'text', text: '🏪 ร้านของฉัน', size: 'xl', weight: 'bold', color: '#FFFFFF' },
          { type: 'text', text: truncate(name, 30), size: 'sm', color: '#EDE9FE', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: '#1E1B2E', spacing: 'md',
        contents: [
          {
            type: 'box', layout: 'horizontal', spacing: 'md',
            contents: [
              shopStatBox('สินค้าที่ขาย', String(active), '#C4B5FD'),
              shopStatBox('สินค้าหมดสต๊อก', String(outOfStock), outOfStock > 0 ? '#FCA5A5' : '#86EFAC'),
            ],
          },
          { type: 'separator', margin: 'lg', color: '#312E4A' },
          { type: 'text', text: 'เลือกสิ่งที่ต้องการจัดการ', size: 'xs', color: '#9CA3AF', margin: 'md' },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'xl', paddingTop: 'md', backgroundColor: '#1E1B2E',
        contents: [
          { type: 'button', style: 'primary', height: 'md', color: SHOP_ACCENT,
            action: { type: 'uri', label: '📦 จัดการร้าน (เว็บ)', uri: `${SHOP_SITE}/seller-dashboard.html` } },
          { type: 'box', layout: 'horizontal', spacing: 'sm',
            contents: [
              { type: 'button', style: 'secondary', height: 'sm', flex: 1,
                action: { type: 'message', label: '📊 เช็คสต๊อก', text: 'สต๊อก' } },
              { type: 'button', style: 'secondary', height: 'sm', flex: 1,
                action: { type: 'message', label: '📈 ยอดขาย', text: 'ยอดขาย' } },
            ] },
          { type: 'button', style: 'link', height: 'sm',
            action: { type: 'uri', label: '➕ ลงสินค้าใหม่', uri: `${SHOP_SITE}/post-product.html` } },
        ],
      },
    },
  };
}

function shopStatBox(label, value, valueColor) {
  return {
    type: 'box', layout: 'vertical', flex: 1, backgroundColor: '#2A2440', cornerRadius: 'lg', paddingAll: 'lg', spacing: 'xs',
    contents: [
      { type: 'text', text: value, size: 'xxl', weight: 'bold', color: valueColor, align: 'center' },
      { type: 'text', text: label, size: 'xxs', color: '#9CA3AF', align: 'center', wrap: true },
    ],
  };
}

// เช็คสต๊อกสินค้า — carousel รายการสินค้าพร้อมจำนวนคงเหลือ
function buildStockFlex(products) {
  if (!products || products.length === 0) {
    return {
      type: 'flex',
      altText: 'ยังไม่มีสินค้าในร้าน',
      contents: {
        type: 'bubble', size: 'mega',
        header: { type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: SHOP_ACCENT,
          contents: [{ type: 'text', text: '📦 สต๊อกสินค้า', size: 'xl', weight: 'bold', color: '#FFFFFF' }] },
        body: { type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: '#1E1B2E',
          contents: [{ type: 'text', text: 'ยังไม่มีสินค้าในร้านครับ เริ่มลงสินค้าชิ้นแรกเลย!', color: '#E5E7EB', wrap: true }] },
        footer: { type: 'box', layout: 'vertical', paddingAll: 'xl', paddingTop: 'md', backgroundColor: '#1E1B2E',
          contents: [{ type: 'button', style: 'primary', height: 'md', color: SHOP_ACCENT,
            action: { type: 'uri', label: '➕ ลงสินค้าใหม่', uri: `${SHOP_SITE}/post-product.html` } }] },
      },
    };
  }

  const rows = products.slice(0, 10).map((p) => {
    const stock = Number(p.product_stock);
    const hasStock = Number.isFinite(stock);
    const isOut = hasStock && stock <= 0;
    const isLow = hasStock && stock > 0 && stock <= 5;
    const isInactive = p.status !== 'active';
    let stockText;
    let stockColor;
    if (isInactive) { stockText = 'ปิดขาย'; stockColor = '#6B7280'; }
    else if (!hasStock) { stockText = 'ไม่ระบุ'; stockColor = '#9CA3AF'; }
    else if (isOut) { stockText = 'หมด ⚠️'; stockColor = '#FCA5A5'; }
    else if (isLow) { stockText = `เหลือ ${stock} ⚡`; stockColor = '#FDE68A'; }
    else { stockText = `${stock} ชิ้น`; stockColor = '#86EFAC'; }

    return {
      type: 'box', layout: 'horizontal', spacing: 'sm', paddingAll: 'sm',
      contents: [
        { type: 'text', text: truncate(p.title || 'ไม่มีชื่อ', 22), size: 'sm', color: '#E5E7EB', flex: 5, wrap: true },
        { type: 'text', text: formatPrice(p.price), size: 'xs', color: '#C4B5FD', flex: 3, align: 'end', gravity: 'center' },
        { type: 'text', text: stockText, size: 'xs', color: stockColor, weight: 'bold', flex: 3, align: 'end', gravity: 'center' },
      ],
    };
  });

  const bodyContents = [];
  rows.forEach((row, i) => {
    bodyContents.push(row);
    if (i < rows.length - 1) bodyContents.push({ type: 'separator', color: '#312E4A' });
  });

  return {
    type: 'flex',
    altText: `📦 สต๊อกสินค้า ${products.length} รายการ`,
    contents: {
      type: 'bubble',
      size: 'giga',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: SHOP_ACCENT,
        contents: [
          { type: 'text', text: '📦 สต๊อกสินค้า', size: 'xl', weight: 'bold', color: '#FFFFFF' },
          { type: 'text', text: `ทั้งหมด ${products.length} รายการ (แสดงล่าสุด ${rows.length})`, size: 'xs', color: '#EDE9FE', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'lg', backgroundColor: '#1E1B2E', spacing: 'xs',
        contents: bodyContents,
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'lg', backgroundColor: '#1E1B2E',
        contents: [
          { type: 'button', style: 'primary', height: 'md', color: SHOP_ACCENT,
            action: { type: 'uri', label: '✏️ แก้ไขสต๊อก (เว็บ)', uri: `${SHOP_SITE}/seller-dashboard.html` } },
        ],
      },
    },
  };
}

// สรุปยอด/สถิติร้าน
function buildShopStatsFlex(stats, user) {
  const name = user?.display_name || 'ร้านของคุณ';
  const total = Number(stats?.total || 0);
  const active = Number(stats?.active || 0);
  const outOfStock = Number(stats?.out_of_stock || 0);
  const views = Number(stats?.total_views || 0);
  return {
    type: 'flex',
    altText: `📈 สรุปร้าน ${name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: SHOP_ACCENT,
        contents: [
          { type: 'text', text: '📈 สรุปร้านของฉัน', size: 'xl', weight: 'bold', color: '#FFFFFF' },
          { type: 'text', text: truncate(name, 30), size: 'sm', color: '#EDE9FE', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: '#1E1B2E', spacing: 'md',
        contents: [
          { type: 'box', layout: 'horizontal', spacing: 'md',
            contents: [
              shopStatBox('สินค้าทั้งหมด', String(total), '#C4B5FD'),
              shopStatBox('กำลังขาย', String(active), '#86EFAC'),
            ] },
          { type: 'box', layout: 'horizontal', spacing: 'md',
            contents: [
              shopStatBox('หมดสต๊อก', String(outOfStock), outOfStock > 0 ? '#FCA5A5' : '#86EFAC'),
              shopStatBox('ยอดเข้าชมรวม', formatCount(views), '#93C5FD'),
            ] },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'xl', paddingTop: 'md', backgroundColor: '#1E1B2E',
        contents: [
          { type: 'button', style: 'primary', height: 'md', color: SHOP_ACCENT,
            action: { type: 'uri', label: '📊 ดูแดชบอร์ดเต็ม (เว็บ)', uri: `${SHOP_SITE}/seller-dashboard.html` } },
          { type: 'button', style: 'link', height: 'sm',
            action: { type: 'message', label: '📦 เช็คสต๊อก', text: 'สต๊อก' } },
        ],
      },
    },
  };
}


function tuktukActionFlexMessage({
  altText,
  eyebrow = 'TUKTUK FEED',
  title,
  subtitle,
  bullets = [],
  accent = '#00E5FF',
  primaryAction,
  secondaryActions = [],
}) {
  const buttons = [primaryAction, ...secondaryActions].filter(Boolean).slice(0, 4);
  return {
    type: 'flex',
    altText: altText || title || 'TukTuk Feed',
    quickReply: tuktukQuickReply(),
    contents: compactObject({
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '18px',
        backgroundColor: '#0F172A',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            backgroundColor: accent,
            cornerRadius: '8px',
            paddingStart: '10px',
            paddingEnd: '10px',
            paddingTop: '4px',
            paddingBottom: '4px',
            contents: [{
              type: 'text',
              text: eyebrow,
              size: 'xxs',
              color: accent === '#F59E0B' ? '#111827' : '#FFFFFF',
              weight: 'bold',
            }],
          },
          {
            type: 'text',
            text: title,
            color: '#FFFFFF',
            size: 'xl',
            weight: 'bold',
            wrap: true,
            maxLines: 2,
            margin: 'md',
          },
          {
            type: 'text',
            text: subtitle,
            color: '#CBD5E1',
            size: 'sm',
            wrap: true,
            maxLines: 3,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '18px',
        backgroundColor: '#111827',
        contents: bullets.slice(0, 5).map((item) => ({
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            { type: 'text', text: '•', color: accent, size: 'sm', flex: 0 },
            { type: 'text', text: item, color: '#E5E7EB', size: 'sm', wrap: true, flex: 1 },
          ],
        })),
      },
      footer: buttons.length ? {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        backgroundColor: '#0F172A',
        contents: buttons.map((action, index) => tuktukActionButton(action, index, accent)),
      } : undefined,
    }),
  };
}

function tuktukActionButton(action, index, accent) {
  return compactObject({
    type: 'button',
    style: index === 0 ? 'primary' : 'secondary',
    color: index === 0 ? accent : undefined,
    height: 'sm',
    action: action.uri
      ? { type: 'uri', label: action.label, uri: action.uri }
      : { type: 'message', label: action.label, text: action.text || action.label },
  });
}

function buildTuktukMenuFlexMessage() {
  return tuktukActionFlexMessage({
    altText: 'เมนู TukTuk Feed',
    eyebrow: 'MENU',
    title: 'อยากซื้อ ขาย หรือดูของฮิต?',
    subtitle: 'เลือกคำสั่งด้านล่าง แล้วไปต่อได้ทันทีใน LINE หรือบนเว็บ TukTuk Feed',
    accent: '#00E5FF',
    bullets: [
      'พิมพ์ "หา เสื้อ" เพื่อค้นหาสินค้าจากตลาด',
      'ผู้ขาย: พิมพ์ "ร้าน" จัดการร้าน หรือ "สต๊อก" เช็คสินค้าคงเหลือ',
      'พิมพ์ "รหัส" เพื่อรับ PIN เข้าเว็บเมื่อต้องการ',
    ],
    primaryAction: { label: 'เปิดแอป TukTuk', uri: 'https://tuktukfeed.com/app/' },
    secondaryActions: [
      { label: '🏪 ร้านของฉัน', text: 'ร้าน' },
      { label: 'สินค้ายอดฮิต', text: 'สินค้ายอดฮิต' },
      { label: 'ขอรหัส', text: 'รหัส' },
    ],
  });
}
function buildTuktukFallbackMessages(text = '') {
  const lower = text.toLowerCase().trim();
  const site = 'https://tuktukfeed.com';

  if (/ปล่อยของ|โพสต์|ลงขาย/.test(lower)) {
    return [tuktukActionFlexMessage({
      altText: 'ลงขายบน TukTuk Feed',
      eyebrow: 'SELLER MODE',
      title: 'ปล่อยของให้พร้อมขายในไม่กี่ขั้นตอน',
      subtitle: 'เพิ่มรูป ราคา จังหวัด และช่องทางติดต่อ เพื่อให้คนซื้อทักได้จริง',
      accent: '#10B981',
      bullets: [
        'ลงรูปสินค้าอย่างน้อย 1 รูป เพื่อให้การ์ดน่าเชื่อถือ',
        'ใส่ราคา จังหวัด และ LINE/เบอร์โทรให้ครบ',
        'ถ้าหน้าเว็บถามรหัส ให้พิมพ์ "รหัส" ใน LINE เพื่อรับ PIN',
      ],
      primaryAction: { label: 'ลงขายสินค้า', uri: site + '/app/post' },
      secondaryActions: [
        { label: 'ขอรหัส PIN', text: 'รหัส' },
        { label: 'เปิดตลาด', uri: site + '/app/market' },
      ],
    })];
  }

  if (/ตลาด|market|ซื้อ|ขาย/.test(lower)) {
    return [tuktukActionFlexMessage({
      altText: 'ตลาด TukTuk Feed',
      eyebrow: 'MARKETPLACE',
      title: 'ตลาดของคนไทย ค้นหาและซื้อขายได้ทันที',
      subtitle: 'ดูสินค้าพร้อมขายจากฟีดจริง หรือพิมพ์คำค้นเพื่อให้ LINE ดึงรายการให้',
      accent: '#00E5FF',
      bullets: [
        'พิมพ์ "หา เสื้อ" หรือ "หา อาหาร" เพื่อค้นสินค้า',
        'ดูป้าย OTOP พื้นที่ขาย ราคา และยอดเข้าชมจากการ์ดสินค้า',
        'ถ้าจะลงขาย เปิดหน้าโพสต์หรือขอ PIN เมื่อเว็บถามรหัส',
      ],
      primaryAction: { label: 'เปิดตลาด', uri: site + '/app/market' },
      secondaryActions: [
        { label: 'สินค้ายอดฮิต', text: 'สินค้ายอดฮิต' },
        { label: 'ลงขายสินค้า', uri: site + '/app/post' },
        { label: 'ขอรหัส', text: 'รหัส' },
      ],
    })];
  }

  if (/วิน|win|มอเตอร์ไซค์/.test(lower)) {
    return [tuktukActionFlexMessage({
      altText: 'WIN Rider TukTuk',
      eyebrow: 'WIN RIDER',
      title: 'เรียกใช้หรือสมัครบริการ WIN Rider',
      subtitle: 'เปิดหน้าบริการวินเพื่อดูรายละเอียด สมัคร หรือเชื่อมต่อกับงานขนส่งในพื้นที่',
      accent: '#EC4899',
      bullets: [
        'เหมาะกับงานรับส่งใกล้พื้นที่และบริการชุมชน',
        'ใช้ LINE/เว็บเพื่อเชื่อมข้อมูลผู้ใช้และสถานะบริการ',
        'ถ้าเว็บถามรหัส ให้พิมพ์ "รหัส" เพื่อรับ PIN',
      ],
      primaryAction: { label: 'เปิด WIN Rider', uri: site + '/win-service.html' },
      secondaryActions: [
        { label: 'ขอรหัส PIN', text: 'รหัส' },
        { label: 'เมนู', text: 'เมนู' },
      ],
    })];
  }

  if (/เมนู|menu|help|ช่วย|เริ่ม/.test(lower)) {
    return [{
      type: 'text',
      text: tuktukMenuText(),
      quickReply: tuktukQuickReply(),
    }];
  }

  return [tuktukActionFlexMessage({
    altText: 'TukTuk Feed พร้อมใช้งาน',
    eyebrow: 'READY',
    title: 'ผมรับข้อความแล้วครับ',
    subtitle: 'เลือกคำสั่งเร็วด้านล่าง หรือพิมพ์เป็นประโยค เช่น "ช่วยหาเสื้อราคาดีใกล้ฉัน"',
    accent: '#8B5CF6',
    bullets: [
      'เมนู - ดูคำสั่งทั้งหมด',
      'ตลาด - เปิด Marketplace',
      'รหัส - รับ PIN เข้าเว็บ',
    ],
    primaryAction: { label: 'เปิดเมนู', text: 'เมนู' },
    secondaryActions: [
      { label: 'ตลาด', text: 'ตลาด' },
      { label: 'ขอรหัส', text: 'รหัส' },
      { label: 'สินค้ายอดฮิต', text: 'สินค้ายอดฮิต' },
    ],
  })];
}
function tuktukMenuText() {
  return [
    'เมนู TukTuk Social',
    '',
    '- พิมพ์ "รหัส" เพื่อรับ PIN เข้าเว็บไซต์',
    '- พิมพ์ "ตลาด" เพื่อเปิด Marketplace',
    '- พิมพ์ "หา เสื้อ" เพื่อค้นหาสินค้า',
    '- พิมพ์ "สินค้ายอดฮิต" หรือ "คลิปยอดนิยม"',
    '- พิมพ์ "วิน" เพื่อเปิดบริการ WIN Rider',
    '',
    'สำหรับผู้ขาย:',
    '- พิมพ์ "ร้าน" เพื่อจัดการร้านของคุณ',
    '- พิมพ์ "สต๊อก" เพื่อเช็คสินค้าคงเหลือ',
    '- พิมพ์ "ยอดขาย" เพื่อดูสรุปร้าน',
    '',
    'เว็บไซต์: https://tuktukfeed.com/app/',
  ].join('\n');
}

function tuktukQuickReply() {
  return {
    items: [
      { type: 'action', action: { type: 'message', label: 'รหัส', text: 'รหัส' } },
      { type: 'action', action: { type: 'message', label: 'ร้านของฉัน', text: 'ร้าน' } },
      { type: 'action', action: { type: 'message', label: 'สต๊อก', text: 'สต๊อก' } },
      { type: 'action', action: { type: 'message', label: 'ตลาด', text: 'ตลาด' } },
      { type: 'action', action: { type: 'message', label: 'สินค้า', text: 'สินค้ายอดฮิต' } },
      { type: 'action', action: { type: 'message', label: 'คลิปยอดนิยม', text: 'คลิปยอดนิยม' } },
      { type: 'action', action: { type: 'message', label: 'วิน', text: 'วิน' } },
      { type: 'action', action: { type: 'message', label: 'เมนู', text: 'เมนู' } },
    ],
  };
}

// ── Welcome message เมื่อผู้ใช้เพิ่มเพื่อน (follow event) ─────────
function buildWelcomeMessages(isTuktuk) {
  if (isTuktuk) {
    return [tuktukActionFlexMessage({
      altText: 'ยินดีต้อนรับสู่ TukTuk Feed',
      eyebrow: 'WELCOME',
      title: 'ยินดีต้อนรับสู่ TukTuk Feed ครับ',
      subtitle: 'ตลาดและโซเชียลของคนไทย ซื้อ-ขาย-หางานได้ในที่เดียว เริ่มจากคำสั่งเร็วด้านล่างได้เลย',
      accent: '#00E5FF',
      bullets: [
        'พิมพ์ "รหัส" เพื่อรับ PIN เข้าเว็บไซต์',
        'พิมพ์ "ตลาด" เพื่อเปิด Marketplace หรือ "หา เสื้อ" เพื่อค้นสินค้า',
        'พิมพ์เป็นประโยคได้เลย เช่น "ช่วยหาเสื้อราคาดีใกล้ฉัน"',
      ],
      primaryAction: { label: 'เปิดเมนู', text: 'เมนู' },
      secondaryActions: [
        { label: 'ขอรหัส PIN', text: 'รหัส' },
        { label: 'เปิดตลาด', text: 'ตลาด' },
        { label: 'สินค้ายอดฮิต', text: 'สินค้ายอดฮิต' },
      ],
    })];
  }
  return [{
    type: 'text',
    text: [
      'ยินดีต้อนรับสู่ WiT365 ผู้ช่วยงานฉีดพลาสติกครับ 👋',
      '',
      'ถามปัญหาหน้างานได้เลย เช่น',
      '- "ชิ้นงาน short shot แก้ยังไง"',
      '- "flash เกิดจากอะไร"',
      '- "ตั้งค่า ABS เบื้องต้น"',
      '',
      'หรือแตะคำสั่งเร็วด้านล่างเพื่อเริ่มได้ทันทีครับ',
    ].join('\n'),
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: 'เมนู', text: 'เมนู' } },
        { type: 'action', action: { type: 'message', label: 'Short Shot', text: 'short shot' } },
        { type: 'action', action: { type: 'message', label: 'Flash', text: 'flash' } },
        { type: 'action', action: { type: 'message', label: 'ABS', text: 'ABS' } },
        { type: 'action', action: { type: 'message', label: 'PP', text: 'PP' } },
      ],
    },
  }];
}

function injectionMenuText() {
  return [
    'เมนู WiT365 — ผู้ช่วยงานฉีดพลาสติก',
    '',
    'พิมพ์ปัญหาหรือคำถามได้เลย เช่น',
    '- "short shot แก้ยังไง"',
    '- "flash / ครีบ เกิดจากอะไร"',
    '- "sink mark ลดยังไง"',
    '- "ตั้งค่า ABS / PP เบื้องต้น"',
    '',
    'ระบบจะช่วยไล่สาเหตุและวิธีแก้ทีละขั้นให้ครับ',
  ].join('\n');
}

// ตอบ welcome เมื่อมี follow event; คืน true ถ้าจัดการแล้ว
async function handleFollowEventsBackground(c, events, lineAccessToken, isTuktuk) {
  const followEvent = events.find((e) => e?.type === 'follow' && e.replyToken);
  if (!followEvent) return false;
  try {
    const replyRes = await replyToLine(lineAccessToken, followEvent.replyToken, buildWelcomeMessages(isTuktuk));
    if (!replyRes.ok) {
      const errText = await replyRes.text();
      console.error('[LINE Webhook] Welcome reply failed:', errText);
      if (c.env.SESSIONS) {
        await c.env.SESSIONS.put('debug:last_reply_error', JSON.stringify({
          status: replyRes.status,
          responseText: errText.slice(0, 1000),
          time: new Date().toISOString(),
          isTuktuk,
          reason: 'follow-welcome',
        })).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[LINE Webhook] handleFollowEventsBackground failed:', err.message);
  }
  return true;
}
// ── GET/POST LINE Webhook Routes ─────────────────────────────
lineWebhookRoutes.post('/webhook', async (c) => {
  return handleWebhookEvent(c, false);
});
lineWebhookRoutes.post('/webhook-tuktuk', async (c) => {
  return handleWebhookEvent(c, true);
});

// ── GET /api/line/debug ── ตรวจสอบสถานะ LINE bot post-deploy ──
lineWebhookRoutes.get('/debug', async (c) => {
  const env = c.env;
  const sessions = env.SESSIONS;

  // Token health (ไม่เปิดเผย token จริง)
  const tokenStatus = {
    tuktuk_access_token: Boolean(env.TUKTUK_CHANNEL_ACCESS_TOKEN),
    tuktuk_channel_secret: Boolean(env.TUKTUK_CHANNEL_SECRET),
    injection_access_token: Boolean(env.INJECTION_CHANNEL_ACCESS_TOKEN),
    injection_channel_secret: Boolean(env.INJECTION_CHANNEL_SECRET),
    line_access_token: Boolean(env.LINE_CHANNEL_ACCESS_TOKEN),
    line_channel_secret: Boolean(env.LINE_CHANNEL_SECRET),
    jwt_secret: Boolean(env.JWT_SECRET),
    verify_disabled_tuktuk: env.TUKTUK_LINE_WEBHOOK_VERIFY_DISABLED,
    verify_disabled_line: env.LINE_WEBHOOK_VERIFY_DISABLED,
    soft_fail_tuktuk: env.TUKTUK_LINE_WEBHOOK_SIGNATURE_SOFT_FAIL,
    soft_fail_line: env.LINE_WEBHOOK_SIGNATURE_SOFT_FAIL,
  };

  // ดึง debug KV keys
  let lastWebhookError = null;
  let lastReplyError = null;
  let lastPinFlow = null;
  let lastLineEvent = null;
  let lastTuktukFeature = null;

  if (sessions) {
    try {
      const [we, re, pf, le, tf] = await Promise.all([
        sessions.get('debug:last_webhook_error'),
        sessions.get('debug:last_reply_error'),
        sessions.get('debug:last_pin_flow'),
        sessions.get('debug:last_line_event'),
        sessions.get('debug:last_tuktuk_feature'),
      ]);
      lastWebhookError = we ? JSON.parse(we) : null;
      lastReplyError = re ? JSON.parse(re) : null;
      lastPinFlow = pf ? JSON.parse(pf) : null;
      lastLineEvent = le ? JSON.parse(le) : null;
      lastTuktukFeature = tf ? JSON.parse(tf) : null;
    } catch (err) {
      console.warn('[LINE Debug] KV read error:', err.message);
    }
  }

  return c.json({
    ok: true,
    time: new Date().toISOString(),
    tokens: tokenStatus,
    lastWebhookError,
    lastReplyError,
    lastPinFlow,
    lastLineEvent,
    lastTuktukFeature,
  });
});
