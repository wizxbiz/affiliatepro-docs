/**
 * Auth Handler — Cloudflare Workers
 * แทน Firebase Auth + admin_api_handlers.js (verifyWebPin, lineLoginCallback, etc.)
 *
 * Flow:
 *   LINE Login  → /api/auth/line-callback → JWT issued → KV session
 *   Google Login → /api/auth/google-callback → JWT issued → KV session
 *   Web PIN     → /api/auth/verify-pin
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { requireAuth } from '../middleware/auth.js';
import { DB } from '../lib/db.js';

export const authRoutes = new Hono();

const JWT_SECRET_KEY = 'JWT_SECRET'; // env binding name
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const OTP_REQUEST_IP_LIMIT = 5;
const OTP_REQUEST_PHONE_LIMIT = 3;
const OTP_REQUEST_WINDOW_SECONDS = 15 * 60;
const OTP_VERIFY_LIMIT = 5;
const OTP_ATTEMPT_WINDOW_SECONDS = 5 * 60;
const OTP_LOCK_SECONDS = 15 * 60;

// [SECURITY FIX H-2] Never fall back to a known string — fail fast instead.
// Run: npx wrangler secret put JWT_SECRET
function _getSecret(c) {
  const secret = c.env[JWT_SECRET_KEY];
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Run: npx wrangler secret put JWT_SECRET');
  }
  return secret.trim();
}

function clientIp(c) {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}

async function consumeKvLimit(kv, key, limit, windowSeconds) {
  const now = Date.now();
  let state = { count: 0, resetAt: now + (windowSeconds * 1000) };
  const raw = await kv.get(key);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Number.isFinite(parsed?.count) && Number.isFinite(parsed?.resetAt)) state = parsed;
    } catch {
      const legacyCount = Number.parseInt(raw, 10);
      if (Number.isFinite(legacyCount)) state.count = legacyCount;
    }
  }

  if (state.resetAt <= now) state = { count: 0, resetAt: now + (windowSeconds * 1000) };
  const retryAfter = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
  if (state.count >= limit) return { allowed: false, retryAfter, remaining: 0 };

  state.count += 1;
  await kv.put(key, JSON.stringify(state), { expirationTtl: Math.max(60, retryAfter) });
  return { allowed: true, retryAfter, remaining: Math.max(0, limit - state.count) };
}

async function incrementKvCounter(kv, key, ttlSeconds) {
  const current = Number.parseInt(await kv.get(key) || '0', 10);
  const next = (Number.isFinite(current) ? current : 0) + 1;
  await kv.put(key, String(next), { expirationTtl: ttlSeconds });
  return next;
}

async function resetKvCounter(kv, key) {
  await kv.delete(key);
}

async function getLockRetryAfter(kv, key) {
  const lockedUntil = Number(await kv.get(key));
  if (!Number.isFinite(lockedUntil) || lockedUntil <= Date.now()) {
    if (lockedUntil) await kv.delete(key);
    return 0;
  }
  return Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
}

async function setTemporaryLock(kv, key, ttlSeconds) {
  const lockedUntil = Date.now() + (ttlSeconds * 1000);
  await kv.put(key, String(lockedUntil), { expirationTtl: ttlSeconds });
}

function rateLimited(c, message, retryAfter) {
  c.header('Retry-After', String(retryAfter));
  return c.json({ success: false, error: message, retryAfter }, 429);
}

// Push a "Verified Seller" confirmation to the seller's LINE after successful verify.
// Best-effort: swallows errors, uses the TukTuk channel token (same env names as line-webhook.js).
async function pushSellerVerifiedConfirmation(env, lineUserId, user, lineOaId) {
  const token = env.TUKTUK_CHANNEL_ACCESS_TOKEN
    || env.LINE_CHANNEL_ACCESS_TOKEN
    || env.INJECTION_CHANNEL_ACCESS_TOKEN;
  if (!token || !lineUserId) return;

  const name = user?.display_name || 'ร้านของคุณ';
  const ACCENT = '#8B5CF6';
  const flex = {
    type: 'flex',
    altText: '🎖️ ยืนยันเป็น Verified Seller สำเร็จ',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: ACCENT,
        contents: [
          { type: 'text', text: '🎖️ Verified Seller', size: 'xl', weight: 'bold', color: '#FFFFFF' },
          { type: 'text', text: 'ยืนยันตัวตนสำเร็จแล้ว', size: 'sm', color: '#EDE9FE', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: 'xl', backgroundColor: '#1E1B2E', spacing: 'md',
        contents: [
          { type: 'text', text: `ยินดีด้วยครับ ${name}`, color: '#E5E7EB', weight: 'bold', wrap: true },
          { type: 'text', text: 'ร้านค้าของคุณได้รับตราสัญลักษณ์สีทองและเปิดใช้งานเมนูร้านค้า (My Shop) แล้ว', size: 'sm', color: '#9CA3AF', wrap: true },
          { type: 'separator', margin: 'lg', color: '#312E4A' },
          {
            type: 'box', layout: 'baseline', spacing: 'sm', margin: 'md',
            contents: [
              { type: 'text', text: 'LINE OA', size: 'xs', color: '#9CA3AF', flex: 2 },
              { type: 'text', text: String(lineOaId || '-'), size: 'xs', color: '#C4B5FD', flex: 5, wrap: true },
            ],
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: 'xl', paddingTop: 'md', backgroundColor: '#1E1B2E',
        contents: [
          { type: 'button', style: 'primary', height: 'md', color: ACCENT,
            action: { type: 'uri', label: '📦 จัดการร้าน', uri: 'https://tuktukfeed.com/seller-dashboard.html' } },
          { type: 'button', style: 'link', height: 'sm',
            action: { type: 'message', label: 'ดูร้านของฉัน', text: 'ร้าน' } },
        ],
      },
    },
  };

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: lineUserId, messages: [flex] }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LINE push ${res.status}: ${errText.slice(0, 200)}`);
  }
}

async function verifyLineAccessToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) return null;

  try {
    const profileResp = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken.trim()}` },
    });
    if (!profileResp.ok) return null;

    const profile = await profileResp.json();
    if (!/^U[0-9a-f]{32}$/i.test(profile?.userId || '')) return null;
    return {
      userId: profile.userId,
      displayName: typeof profile.displayName === 'string' ? profile.displayName : '',
      pictureUrl: typeof profile.pictureUrl === 'string' ? profile.pictureUrl : '',
    };
  } catch {
    return null;
  }
}

async function verifySessionBoundLineUser(c, requestedLineUserId) {
  if (!requestedLineUserId) return null;
  const authHeader = c.req.header('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : c.req.header('X-Auth-Token');
  if (!token) return null;
  try {
    const payload = await verify(token, _getSecret(c));
    const ids = [payload?.uid, payload?.lineUserId, payload?.id, payload?.firebaseUid].filter(Boolean);
    if (!ids.includes(requestedLineUserId)) return null;
    return {
      userId: requestedLineUserId,
      displayName: payload.displayName || '',
      pictureUrl: payload.pictureUrl || '',
    };
  } catch {
    return null;
  }
}

function getSuperAdminIds(env) {
  const envIds = env.SUPER_ADMIN_IDS
    ? env.SUPER_ADMIN_IDS.split(',').map((id) => id.trim()).filter(Boolean)
    : [];
  return envIds.length ? envIds : ['Ud9bec6d2ea945cf4330a69cb74ac93cf', 'U9b40807cbcc8182928a12e3b6b73330e'];
}

function mapUserRowToClient(user) {
  if (!user) return null;
  return {
    uid: user.id,
    id: user.id,
    lineUserId: user.line_user_id || null,
    firebaseUid: user.firebase_uid || null,
    displayName: user.display_name || '',
    email: user.email || null,
    pictureUrl: user.picture_url || '',
    role: user.role || 'user',
    sellerStatus: user.seller_status || 'none',
    isPremium: user.is_premium === 1,
    subscriptionStatus: user.subscription_status || null,
    provider: user.provider || 'line',
    phone: user.phone || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

// ── POST /api/auth/line-callback ─────────────────────────────
// แทน lineLoginCallback Firebase function
authRoutes.post('/line-callback', async (c) => {
  const body = await c.req.json();
  let { lineUserId, displayName, pictureUrl, accessToken, code, redirectUri } = body;

  const db = new DB(c.env.DB);

  try {
    // If authorization code is provided, perform OAuth exchange (web login redirect flow)
    if (code) {
      console.log('[Auth] Exchanging LINE authorization code...');
      // LINE Login OAuth must use the LINE Login channel secret only.
      // Do not fall back to Messaging API LINE_CHANNEL_SECRET; LINE rejects that as invalid_client.
      // Run: npx wrangler@3 secret put LINE_LOGIN_CHANNEL_SECRET
      const channelId = c.env.LINE_CHANNEL_ID;
      const channelSecret = c.env.LINE_LOGIN_CHANNEL_SECRET;
      if (!channelId || !channelSecret) {
        return c.json({ error: 'LINE Login channel credentials are not configured on this server' }, 503);
      }
      
      const tokenParams = new URLSearchParams();
      tokenParams.append('grant_type', 'authorization_code');
      tokenParams.append('code', code);
      tokenParams.append('redirect_uri', redirectUri || `${new URL(c.req.url).origin}/login`);
      tokenParams.append('client_id', channelId);
      tokenParams.append('client_secret', channelSecret);

      const tokenResp = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
      });

      if (!tokenResp.ok) {
        const errText = await tokenResp.text();
        throw new Error(`LINE Token Exchange failed: ${errText}`);
      }

      const tokenData = await tokenResp.json();
      accessToken = tokenData.access_token;

      // Verify the access token against LINE and trust only the returned profile.
      const profileData = await verifyLineAccessToken(accessToken);
      if (!profileData) return c.json({ error: 'LINE profile verification failed' }, 401);
      lineUserId = profileData.userId;
      displayName = profileData.displayName;
      pictureUrl = profileData.pictureUrl;
    } else if (accessToken) {
      const profileData = await verifyLineAccessToken(accessToken);
      if (!profileData?.userId) return c.json({ error: 'Invalid LINE access token' }, 401);
      lineUserId = profileData.userId;
      displayName = profileData.displayName || displayName;
      pictureUrl = profileData.pictureUrl || pictureUrl;
    } else {
      return c.json({ error: 'Missing LINE authorization code or access token' }, 400);
    }

    if (!lineUserId) return c.json({ error: 'Missing lineUserId' }, 400);

    // Upsert user ใน D1
    let user = await db.getUserById(lineUserId);
    if (!user) {
      await db.createUser({
        id: lineUserId,
        lineUserId,
        displayName,
        pictureUrl,
        role: 'user',
        sellerStatus: 'none',
        isPremium: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      user = await db.getUserById(lineUserId);
    } else {
      await db.updateUser(lineUserId, {
        displayName,
        pictureUrl,
        updatedAt: Date.now(),
      });
      user = await db.getUserById(lineUserId);
    }

    const mappedUser = mapUserRowToClient(user);

    // ออก JWT token
    const payload = {
      uid: mappedUser.id,
      lineUserId: mappedUser.lineUserId,
      displayName: mappedUser.displayName,
      pictureUrl: mappedUser.pictureUrl,
      role: mappedUser.role,
      isPremium: mappedUser.isPremium,
      sellerStatus: mappedUser.sellerStatus,
      provider: 'line',
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, // 7 days
    };

    const token = await sign(payload, _getSecret(c));

    // บันทึก session ใน KV (optional — สำหรับ server-side session invalidation)
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${lineUserId}`, JSON.stringify({
        ...payload,
        token,
        loginAt: new Date().toISOString(),
      }), { expirationTtl: SESSION_TTL_SECONDS });
    }

    return c.json({ success: true, token, sessionToken: token, user: payload });
  } catch (err) {
    console.error('[Auth] LINE callback error:', err);
    return c.json({ error: err.message }, 500);
  }
});


// ── POST /api/auth/marketplace-line-auth ─────────────────────
// Backward-compatible replacement for Firebase marketplaceLineAuth.
authRoutes.post('/marketplace-line-auth', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { accessToken, lineUserId: requestedLineUserId } = body;

  const profile = await verifyLineAccessToken(accessToken) ||
    await verifySessionBoundLineUser(c, requestedLineUserId);
  if (!profile?.userId) {
    return c.json({ success: false, error: 'Invalid LINE access token' }, 401);
  }

  const lineUserId = profile.userId;
  const displayName = profile.displayName || body.displayName || '';
  const pictureUrl = profile.pictureUrl || body.pictureUrl || '';
  const db = new DB(c.env.DB);

  try {
    let user = await db.getUserById(lineUserId) || await db.getUserByLineId(lineUserId);
    if (!user) {
      await db.createUser({
        id: lineUserId,
        lineUserId,
        displayName: displayName || 'LINE User',
        pictureUrl,
        role: 'user',
        sellerStatus: 'none',
        isPremium: 0,
        provider: 'line',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      user = await db.getUserById(lineUserId);
    } else if (displayName || pictureUrl) {
      await db.updateUser(user.id, {
        displayName: displayName || user.display_name || '',
        pictureUrl: pictureUrl || user.picture_url || '',
        updatedAt: Date.now(),
      });
      user = await db.getUserById(user.id);
    }

    const mappedUser = mapUserRowToClient(user);

    const payload = {
      uid: mappedUser.id,
      lineUserId: mappedUser.lineUserId || lineUserId,
      displayName: mappedUser.displayName || displayName || '',
      pictureUrl: mappedUser.pictureUrl || pictureUrl || '',
      role: mappedUser.role || 'user',
      isPremium: mappedUser.isPremium,
      sellerStatus: mappedUser.sellerStatus || 'none',
      provider: 'line',
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };

    const token = await sign(payload, _getSecret(c));
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${payload.uid}`, JSON.stringify({ ...payload, token }), {
        expirationTtl: SESSION_TTL_SECONDS,
      });
    }

    return c.json({ success: true, token, sessionToken: token, user: payload });
  } catch (err) {
    console.error('[Auth] marketplace-line-auth error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});
// ── POST /api/auth/google-callback ───────────────────────────
// แทน Google signInWithRedirect result handler
authRoutes.post('/google-callback', async (c) => {
  const body = await c.req.json();
  const { idToken } = body; // Google ID Token from client

  try {
    // ตรวจสอบ Google ID Token
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const googleData = await googleResponse.json();

    if (!googleData.sub) return c.json({ error: 'Invalid Google token' }, 401);

    const db = new DB(c.env.DB);
    const googleUid = `google:${googleData.sub}`;

    let user = await db.getUserByEmail(googleData.email);
    if (!user) {
      await db.createUser({
        id: googleUid,
        firebaseUid: googleUid,
        displayName: googleData.name,
        email: googleData.email,
        pictureUrl: googleData.picture,
        role: 'user',
        sellerStatus: 'none',
        isPremium: 0,
        provider: 'google',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      user = await db.getUserById(googleUid);
    }

    const mappedUser = mapUserRowToClient(user);
    const primaryUid = mappedUser?.lineUserId || mappedUser?.id || googleUid;
    const payload = {
      uid: primaryUid,
      firebaseUid: googleUid,
      lineUserId: mappedUser?.lineUserId,
      displayName: googleData.name,
      email: googleData.email,
      pictureUrl: googleData.picture,
      role: mappedUser?.role || 'user',
      isPremium: mappedUser?.isPremium || false,
      sellerStatus: mappedUser?.sellerStatus || 'none',
      provider: 'google',
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };

    const token = await sign(payload, _getSecret(c));
    return c.json({ success: true, token, sessionToken: token, user: payload });
  } catch (err) {
    console.error('[Auth] Google callback error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ── Helper: Clean & format phone number ───────────────────────
function formatPhone(phone) {
  if (!phone) return '';
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  // If it starts with 66, keep it or prepend 0 if needed.
  // Standard format: 10 digits starting with 0 (e.g. 0812345678)
  if (digits.startsWith('66') && digits.length === 11) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

function generateOtpCode() {
  const values = new Uint32Array(1);
  const unbiasedLimit = 0x100000000 - (0x100000000 % 1000000);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= unbiasedLimit);
  return String(values[0] % 1000000).padStart(6, '0');
}

// ── Helper: Send SMS ──────────────────────────────────────────
async function sendSMS(phone, text, env) {
  const apiKey = env.SMS2PRO_API_KEY;
  if (!apiKey) {
    if (env.ENVIRONMENT === 'production') {
      return { error: 'SMS provider is not configured' };
    }
    console.log(`[SMS MOCK] Send to ${phone}: ${text}`);
    return { success: true, mock: true };
  }
  
  try {
    const res = await fetch('https://api.sms2pro.com/v1/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        sender: env.SMS_SENDER || 'TukTukFeed',
        phone: phone,
        message: text
      })
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) return { error: 'SMS provider rejected the request', status: res.status };
    return result;
  } catch (err) {
    console.error('[SMS] Send SMS error:', err);
    return { error: err.message };
  }
}

// ── POST /api/auth/phone/request-otp ──────────────────────────
authRoutes.post('/phone/request-otp', async (c) => {
  try {
    const body = await c.req.json();
    const rawPhone = body.phone;
    if (!rawPhone) return c.json({ error: 'Missing phone number' }, 400);

    const phone = formatPhone(rawPhone);
    if (!/^0\d{9}$/.test(phone)) {
      return c.json({ error: 'เบอร์โทรศัพท์ต้องมี 10 หลัก (เช่น 0812345678)' }, 400);
    }

    const securityKv = c.env.SESSIONS;
    if (!securityKv) return c.json({ error: 'OTP security service is unavailable' }, 503);

    const lockRetryAfter = await getLockRetryAfter(securityKv, `otp:lock:${phone}`);
    if (lockRetryAfter) {
      return rateLimited(c, 'การตรวจสอบ OTP ถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง', lockRetryAfter);
    }

    const ipLimit = await consumeKvLimit(
      securityKv, `otp:req:ip:${clientIp(c)}`, OTP_REQUEST_IP_LIMIT, OTP_REQUEST_WINDOW_SECONDS
    );
    if (!ipLimit.allowed) {
      return rateLimited(c, 'ขอ OTP จากเครือข่ายนี้บ่อยเกินไป กรุณาลองใหม่ภายหลัง', ipLimit.retryAfter);
    }

    const phoneLimit = await consumeKvLimit(
      securityKv, `otp:req:phone:${phone}`, OTP_REQUEST_PHONE_LIMIT, OTP_REQUEST_WINDOW_SECONDS
    );
    if (!phoneLimit.allowed) {
      return rateLimited(c, 'ขอ OTP สำหรับเบอร์นี้บ่อยเกินไป กรุณาลองใหม่ภายหลัง', phoneLimit.retryAfter);
    }

    // Generate 6-digit OTP
    const code = generateOtpCode();
    const expires_at = Date.now() + (5 * 60 * 1000); // 5 mins

    const db = new DB(c.env.DB);
    await db.saveOtpCode(phone, code, expires_at);

    // Send SMS
    const smsText = `รหัส OTP สำหรับเข้าใช้งาน TukTukคือ ${code} (ใช้งานได้ใน 5 นาที)`;
    const smsRes = await sendSMS(phone, smsText, c.env);
    if (smsRes.error) {
      await db.deleteOtpCode(phone);
      console.error('[SMS] OTP delivery failed:', smsRes.error);
      return c.json({ error: 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่ภายหลัง' }, 503);
    }

    const isProd = c.env.ENVIRONMENT === 'production';
    return c.json({
      success: true,
      message: 'ส่งรหัส OTP เรียบร้อยแล้ว',
      // Return OTP only in an explicitly non-production environment.
      otp: !isProd ? code : undefined,
      sandbox: !isProd
    });
  } catch (err) {
    console.error('[Auth] Request OTP error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/auth/phone/verify-otp ───────────────────────────
authRoutes.post('/phone/verify-otp', async (c) => {
  try {
    const body = await c.req.json();
    const { phone: rawPhone, code: rawCode } = body;

    if (!rawPhone || rawCode === undefined || rawCode === null) {
      return c.json({ error: 'Missing phone or OTP code' }, 400);
    }

    const phone = formatPhone(rawPhone);
    const code = String(rawCode).trim();
    if (!/^0\d{9}$/.test(phone) || !/^\d{6}$/.test(code)) {
      return c.json({ error: 'Invalid phone or OTP code format' }, 400);
    }

    const securityKv = c.env.SESSIONS;
    if (!securityKv) return c.json({ error: 'OTP security service is unavailable' }, 503);

    const lockKey = `otp:lock:${phone}`;
    const attemptKey = `otp:verify:${phone}`;
    const lockRetryAfter = await getLockRetryAfter(securityKv, lockKey);
    if (lockRetryAfter) {
      return rateLimited(c, 'การตรวจสอบ OTP ถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง', lockRetryAfter);
    }

    const db = new DB(c.env.DB);

    // Get OTP record
    const otpRecord = await db.getOtpCode(phone);
    if (!otpRecord) {
      return c.json({ success: false, message: 'ไม่พบรหัส OTP ของเบอร์โทรศัพท์นี้' }, 400);
    }

    // Check expiration
    if (Date.now() > Number(otpRecord.expires_at)) {
      await db.deleteOtpCode(phone);
      await resetKvCounter(securityKv, attemptKey);
      return c.json({ success: false, message: 'รหัส OTP หมดอายุแล้ว' }, 401);
    }

    // Count every incorrect OTP and create an explicit temporary lock at the limit.
    if (String(otpRecord.code) !== code) {
      const nextAttempts = await incrementKvCounter(
        securityKv, attemptKey, OTP_ATTEMPT_WINDOW_SECONDS
      );
      const attemptsRemaining = Math.max(0, OTP_VERIFY_LIMIT - nextAttempts);

      if (nextAttempts >= OTP_VERIFY_LIMIT) {
        await setTemporaryLock(securityKv, lockKey, OTP_LOCK_SECONDS);
        await resetKvCounter(securityKv, attemptKey);
        await db.deleteOtpCode(phone);
        return rateLimited(
          c,
          'ใส่ OTP ผิดเกินกำหนด การตรวจสอบถูกล็อกชั่วคราว',
          OTP_LOCK_SECONDS
        );
      }

      return c.json({
        success: false,
        message: 'รหัส OTP ไม่ถูกต้อง',
        attemptsRemaining
      }, 401);
    }

    // OTP correct: consume it and clear all brute-force state.
    await db.deleteOtpCode(phone);
    await resetKvCounter(securityKv, attemptKey);
    await resetKvCounter(securityKv, lockKey);

    // Retrieve or register user
    let user = await db.getUserByPhone(phone);
    const isNewUser = !user;

    if (isNewUser) {
      const uid = `phone:${phone}`;
      await db.createUser({
        id: uid,
        displayName: `ผู้ใช้ ${phone.slice(-4)}`,
        phone,
        role: 'user',
        sellerStatus: 'none',
        isPremium: 0,
        provider: 'phone',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      user = await db.getUserById(uid);
    }

    const mappedUser = mapUserRowToClient(user);

    // Issue JWT Token
    const payload = {
      uid: mappedUser.id,
      displayName: mappedUser.displayName || `ผู้ใช้ ${phone.slice(-4)}`,
      pictureUrl: mappedUser.pictureUrl || '',
      role: mappedUser.role || 'user',
      isPremium: mappedUser.isPremium,
      sellerStatus: mappedUser.sellerStatus || 'none',
      provider: 'phone',
      phone: mappedUser.phone,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, // 7 days
    };

    const token = await sign(payload, _getSecret(c));

    // Save session in KV if configured
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${user.id}`, JSON.stringify(payload), {
        expirationTtl: SESSION_TTL_SECONDS,
      });
    }

    return c.json({
      success: true,
      token,
      sessionToken: token,
      user: payload,
      isNewUser
    });
  } catch (err) {
    console.error('[Auth] Verify OTP error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/auth/verify-pin ────────────────────────────────
// แทน verifyWebPin Firebase function
authRoutes.post('/verify-pin', async (c) => {
  const body = await c.req.json();
  const { lineUserId, pin } = body;

  if (!pin) return c.json({ error: 'Missing pin' }, 400);

  const db = new DB(c.env.DB);

  try {
    let pinRecord;
    let targetLineUserId = lineUserId;

    if (targetLineUserId) {
      pinRecord = await db.getWebPin(targetLineUserId);
    } else {
      // ค้นหาจากรหัส PIN ตรงๆ เพื่อหา lineUserId
      pinRecord = await db.d1.prepare('SELECT * FROM web_pins WHERE pin = ?').bind(pin).first();
      if (pinRecord) {
        targetLineUserId = pinRecord.line_user_id;
      }
    }

    if (!pinRecord) return c.json({ success: false, message: 'PIN not found' }, 404);

    // ตรวจสอบ PIN expired
    if (Date.now() > pinRecord.expires_at) {
      return c.json({ success: false, message: 'PIN expired' }, 401);
    }

    // ตรวจสอบ PIN ถูกต้อง
    if (pinRecord.pin !== pin) {
      return c.json({ success: false, message: 'Invalid PIN' }, 401);
    }

    // ลบ PIN หลังใช้งาน (one-time)
    await db.deleteWebPin(targetLineUserId);

    // สร้าง session token
    const user = await db.getUserById(targetLineUserId);
    const mappedUser = mapUserRowToClient(user);
    const payload = {
      uid: targetLineUserId,
      lineUserId: targetLineUserId,
      displayName: mappedUser?.displayName || '',
      pictureUrl: mappedUser?.pictureUrl || '',
      role: getSuperAdminIds(c.env).includes(targetLineUserId) ? 'super_admin' : (mappedUser?.role || 'user'),
      isPremium: mappedUser?.isPremium || false,
      sellerStatus: mappedUser?.sellerStatus || 'none',
      provider: 'line',
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };

    const token = await sign(payload, _getSecret(c));

    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${targetLineUserId}`, JSON.stringify(payload), {
        expirationTtl: SESSION_TTL_SECONDS,
      });
    }

    return c.json({ success: true, token, sessionToken: token, user: payload });
  } catch (err) {
    console.error('[Auth] verify-pin error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/auth/check-usage ────────────────────────────────
// แทน checkFreeUsage Firebase function
authRoutes.post('/check-usage', requireAuth, async (c) => {
  const session = c.get('session');
  const db = new DB(c.env.DB);

  try {
    const usage = await db.getUserUsage(session.uid);
    const limits = session.isPremium
      ? { aiChat: -1, aiGenerate: 30, saveRecords: -1 }
      : { aiChat: 10, aiGenerate: 5, saveRecords: 50 };

    return c.json({
      success: true,
      usage: usage || { aiChat: 0, aiGenerate: 0, saveRecords: 0 },
      limits,
      isPremium: session.isPremium,
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────
authRoutes.post('/logout', requireAuth, async (c) => {
  const session = c.get('session');
  if (c.env.SESSIONS && session?.uid) {
    await c.env.SESSIONS.delete(`session:${session.uid}`);
  }
  return c.json({ success: true });
});

// ── GET /api/auth/me ──────────────────────────────────────────
authRoutes.get('/me', requireAuth, async (c) => {
  const session = c.get('session');
  const db = new DB(c.env.DB);
  try {
    const user = await db.getUserById(session.uid);
    const mappedUser = mapUserRowToClient(user);
    return c.json({ success: true, user: { ...session, ...mappedUser } });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────
// แทน refreshWebSession Firebase function
authRoutes.post('/refresh', requireAuth, async (c) => {
  const session = c.get('session');
  const db = new DB(c.env.DB);
  try {
    const user = await db.getUserById(session.uid);
    const mappedUser = mapUserRowToClient(user);
    const payload = {
      ...session,
      role: mappedUser?.role || session.role,
      isPremium: mappedUser?.isPremium || false,
      sellerStatus: mappedUser?.sellerStatus || session.sellerStatus,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
    const token = await sign(payload, _getSecret(c));
    return c.json({ success: true, token, sessionToken: token, user: payload });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/auth/seller/verify ───────────────────────────────
authRoutes.post('/seller/verify', requireAuth, async (c) => {
  const session = c.get('session');
  const db = new DB(c.env.DB);
  try {
    const body = await c.req.json();
    const { lineOaId } = body;

    if (!lineOaId) {
      return c.json({ error: 'Missing LINE OA ID' }, 400);
    }

    await db.updateSellerVerification(session.uid, lineOaId);

    // Push a confirmation Flex back to the seller's LINE (non-blocking, best-effort)
    const user = await db.getUserById(session.uid);
    const lineUserId = user?.line_user_id || (session.provider === 'line' ? session.uid : null);
    if (lineUserId) {
      const pushTask = pushSellerVerifiedConfirmation(c.env, lineUserId, user, lineOaId)
        .catch((err) => console.warn('[Auth] seller verify push failed:', err.message));
      // Fire-and-forget so the API responds fast even if LINE is slow
      if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(pushTask);
      else await pushTask;
    }

    // Update session token to reflect verified status
    const mappedUser = mapUserRowToClient(user);
    const payload = {
      ...session,
      sellerStatus: 'verified',
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
    const token = await sign(payload, _getSecret(c));

    return c.json({ success: true, message: 'Verified Successfully', token, user: payload });
  } catch (err) {
    console.error('[Auth] seller/verify error:', err);
    return c.json({ error: err.message }, 500);
  }
});
