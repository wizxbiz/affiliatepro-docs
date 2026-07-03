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

function _getSecret(c) {
  const secret = c.env[JWT_SECRET_KEY] || 'dev-secret-change-me';
  return secret.trim();
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
      const channelId = c.env.LINE_CHANNEL_ID || '2009159046';
      const channelSecret = c.env.LINE_CHANNEL_SECRET || '13b4ba868f18a0733494a5fe539dcec6';
      
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

      // Fetch user profile using access token
      const profileResp = await fetch('https://api.line.me/v2/profile', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!profileResp.ok) {
        const errText = await profileResp.text();
        throw new Error(`LINE Profile Fetch failed: ${errText}`);
      }

      const profileData = await profileResp.json();
      lineUserId = profileData.userId;
      displayName = profileData.displayName;
      pictureUrl = profileData.pictureUrl;
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
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    };

    const token = await sign(payload, _getSecret(c));

    // บันทึก session ใน KV (optional — สำหรับ server-side session invalidation)
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${lineUserId}`, JSON.stringify({
        ...payload,
        token,
        loginAt: new Date().toISOString(),
      }), { expirationTtl: 30 * 24 * 60 * 60 });
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
  const { lineUserId, displayName = '', pictureUrl = '' } = body;

  if (!lineUserId) return c.json({ success: false, error: 'Missing lineUserId' }, 400);

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
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    };

    const token = await sign(payload, _getSecret(c));
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${payload.uid}`, JSON.stringify({ ...payload, token }), {
        expirationTtl: 30 * 24 * 60 * 60,
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
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
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

// ── Helper: Send SMS ──────────────────────────────────────────
async function sendSMS(phone, text, env) {
  const apiKey = env.SMS2PRO_API_KEY;
  if (!apiKey) {
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
    return await res.json();
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
    if (phone.length !== 10) {
      return c.json({ error: 'เบอร์โทรศัพท์ต้องมี 10 หลัก (เช่น 0812345678)' }, 400);
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 mins

    const db = new DB(c.env.DB);
    await db.saveOtpCode(phone, code, expiresAt);

    // Send SMS
    const smsText = `รหัส OTP สำหรับเข้าใช้งาน TukTukคือ ${code} (ใช้งานได้ใน 5 นาที)`;
    const smsRes = await sendSMS(phone, smsText, c.env);

    const isProd = c.env.ENVIRONMENT === 'production';
    return c.json({
      success: true,
      message: 'ส่งรหัส OTP เรียบร้อยแล้ว',
      // In non-production, return OTP directly in JSON for easy sandbox testing
      otp: !isProd || smsRes.mock ? code : undefined,
      sandbox: smsRes.mock || !isProd
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
    const { phone: rawPhone, code } = body;

    if (!rawPhone || !code) return c.json({ error: 'Missing phone or OTP code' }, 400);

    const phone = formatPhone(rawPhone);
    const db = new DB(c.env.DB);

    // Get OTP record
    const otpRecord = await db.getOtpCode(phone);
    if (!otpRecord) {
      return c.json({ success: false, message: 'ไม่พบรหัส OTP ของเบอร์โทรศัพท์นี้' }, 400);
    }

    // Check expiration
    if (Date.now() > otpRecord.expiresAt) {
      await db.deleteOtpCode(phone);
      return c.json({ success: false, message: 'รหัส OTP หมดอายุแล้ว' }, 401);
    }

    // Check code
    if (otpRecord.code !== code) {
      return c.json({ success: false, message: 'รหัส OTP ไม่ถูกต้อง' }, 401);
    }

    // OTP correct: delete it
    await db.deleteOtpCode(phone);

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
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    };

    const token = await sign(payload, _getSecret(c));

    // Save session in KV if configured
    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${user.id}`, JSON.stringify(payload), {
        expirationTtl: 30 * 24 * 60 * 60,
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
      role: mappedUser?.role || 'user',
      isPremium: mappedUser?.isPremium || false,
      sellerStatus: mappedUser?.sellerStatus || 'none',
      provider: 'line',
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    };

    const token = await sign(payload, _getSecret(c));

    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(`session:${targetLineUserId}`, JSON.stringify(payload), {
        expirationTtl: 30 * 24 * 60 * 60,
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
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    };
    const token = await sign(payload, _getSecret(c));
    return c.json({ success: true, token, sessionToken: token, user: payload });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});
