/**
 * Auth Middleware — Cloudflare Workers
 * JWT-based session verification
 * แทน Firebase Admin auth.verifyIdToken()
 */

import { verify } from 'hono/jwt';

const JWT_SECRET_KEY = 'JWT_SECRET';

/**
 * requireAuth — block if not authenticated
 */
export async function requireAuth(c, next) {
  const session = await _extractSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized — please login' }, 401);
  }
  c.set('session', session);
  await next();
}

/**
 * optionalAuth — attach session if present, continue either way
 */
export async function optionalAuth(c, next) {
  const session = await _extractSession(c);
  c.set('session', session || null);
  await next();
}

/**
 * requireAdmin — block if not admin/super_admin
 */
export async function requireAdmin(c, next) {
  const session = await _extractSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (session.role !== 'admin' && session.role !== 'super_admin') {
    return c.json({ error: 'Forbidden — admin access required' }, 403);
  }
  c.set('session', session);
  await next();
}

/**
 * Internal: extract and verify JWT from Authorization header or cookie
 */
async function _extractSession(c) {
  // 1. Try Authorization: Bearer <token>
  const authHeader = c.req.header('Authorization');
  let token = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // 2. Try X-Auth-Token header (fallback)
  if (!token) {
    token = c.req.header('X-Auth-Token');
  }

  // 3. Try cookie (for browser requests)
  if (!token) {
    const cookieHeader = c.req.header('Cookie') || '';
    const match = cookieHeader.match(/tuktuk_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;

  try {
    const secret = (c.env?.[JWT_SECRET_KEY] || 'dev-secret-change-me').trim();
    const payload = await verify(token, secret);

    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
