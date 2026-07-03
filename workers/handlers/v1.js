import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { marketplaceRoutes } from './marketplace.js';
import { utilityRoutes } from './utility.js';
import { normalizeJsonResponse } from '../lib/api-response.js';
import { rewriteJsonRequest, rewriteRequest } from '../lib/request-rewrite.js';
import { normalizeV1ProductResponse } from '../lib/v1-normalizers.js';
import { DB } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { normalizeMediaUrls } from '../lib/media-normalizer.js';

export const v1Routes = new Hono();

// v1 contract: ทุก error ต้องเป็น { status: 'error', error: { code, message } }
// requireAuth เดิมคืน legacy shape { error } เมื่อบล็อก — ห่อให้ normalize เป็น shape เดียวกัน
// วิธี: เรียก requireAuth ด้วย no-op next; ถ้าผ่าน session จะถูก set, ถ้าไม่ผ่าน session ยังว่าง
async function requireAuthV1(c, next) {
  await requireAuth(c, async () => {});
  if (!c.get('session')) {
    return c.json({
      status: 'error',
      error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' },
    }, 401);
  }
  return next();
}

async function proxyGoEngine(c, targetPath) {
  const baseUrl = (c.env.GO_ENGINE_URL || c.env.TUKTUK_GO_ENGINE_URL || 'https://tuktuk-engine.fly.dev').replace(/\/+$/, '');
  const sourceUrl = new URL(c.req.url);
  const targetUrl = new URL(`${baseUrl}${targetPath}`);
  targetUrl.search = sourceUrl.search;

  try {
    const response = await fetch(targetUrl.toString(), {
      method: c.req.method,
      headers: { Accept: 'application/json' },
    });
    return normalizeJsonResponse(c, response);
  } catch (err) {
    return c.json({
      status: 'error',
      error: {
        code: 'GO_ENGINE_UNAVAILABLE',
        message: err.message || 'Go Engine unavailable',
      },
    }, 502);
  }
}

v1Routes.get('/feed', (c) => proxyGoEngine(c, '/api/v1/feed'));
v1Routes.get('/feed/trending', (c) => proxyGoEngine(c, '/api/v1/feed/trending'));

v1Routes.get('/products', async (c) => {
  const response = await marketplaceRoutes.request(rewriteRequest(c, '/products'), undefined, c.env);
  return normalizeV1ProductResponse(c, response);
});

v1Routes.post('/products', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const requestBody = {
    ...body,
    title: body.title || body.productName,
  };
  const response = await marketplaceRoutes.request(rewriteJsonRequest(c, '/products', requestBody), undefined, c.env);
  return normalizeV1ProductResponse(c, response);
});

v1Routes.get('/products/:id', async (c) => {
  const response = await marketplaceRoutes.request(rewriteRequest(c, `/products/${c.req.param('id')}`), undefined, c.env);
  return normalizeV1ProductResponse(c, response);
});

v1Routes.get('/auth/session', async (c) => {
  const response = await authRoutes.request(rewriteRequest(c, '/me'), undefined, c.env);
  return normalizeJsonResponse(c, response);
});

v1Routes.post('/auth/session', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const provider = body.provider || (body.pin ? 'line_pin' : (body.phone && body.code ? 'phone_otp' : 'line'));

  let targetPath = null;
  if (provider === 'line') targetPath = '/marketplace-line-auth';
  if (provider === 'line_oauth') targetPath = '/line-callback';
  if (provider === 'line_pin') targetPath = '/verify-pin';
  if (provider === 'phone_otp') targetPath = '/phone/verify-otp';

  if (!targetPath) {
    return c.json({
      status: 'error',
      error: {
        code: 'UNSUPPORTED_PROVIDER',
        message: `Unsupported auth provider: ${provider}`,
      },
    }, 400);
  }

  const response = await authRoutes.request(rewriteJsonRequest(c, targetPath, body), undefined, c.env);
  return normalizeJsonResponse(c, response);
});

v1Routes.post('/auth/refresh', async (c) => {
  const response = await authRoutes.request(rewriteRequest(c, '/refresh'), undefined, c.env);
  return normalizeJsonResponse(c, response);
});

v1Routes.post('/auth/logout', async (c) => {
  const response = await authRoutes.request(rewriteRequest(c, '/logout'), undefined, c.env);
  return normalizeJsonResponse(c, response);
});

v1Routes.post('/auth/phone/request-otp', async (c) => {
  const response = await authRoutes.request(rewriteRequest(c, '/phone/request-otp'), undefined, c.env);
  return normalizeJsonResponse(c, response);
});

v1Routes.post('/auth/phone/verify-otp', async (c) => {
  const response = await authRoutes.request(rewriteRequest(c, '/phone/verify-otp'), undefined, c.env);
  return normalizeJsonResponse(c, response);
});

// ── Community posts (D1-backed, Phase 4) ────────────────────
v1Routes.get('/posts', async (c) => {
  const { category, limit = 20, offset = 0 } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const rows = await db.getPosts({ category, limit: +limit, offset: +offset });
    // normalize media_urls (string/object/youtube ปนกัน) → media: [{type,url}]
    const posts = rows.map((p) => ({ ...p, media: normalizeMediaUrls(p.media_urls) }));
    return c.json({ status: 'success', posts });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.get('/posts/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DB(c.env.DB);
  try {
    const post = await db.getPostById(id);
    if (!post || post.status === 'deleted') {
      return c.json({ status: 'error', error: { code: 'NOT_FOUND', message: 'ไม่พบโพสต์นี้' } }, 404);
    }
    let mediaUrls = [];
    try {
      mediaUrls = JSON.parse(post.media_urls || '[]');
    } catch (_) {}

    return c.json({
      status: 'success',
      post: {
        id: post.id,
        userId: post.user_id,
        content: post.content,
        mediaUrls,
        category: post.category,
        status: post.status,
        createdAt: post.created_at,
        likes: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        viewCount: post.view_count || 0,
        authorName: post.display_name || 'TukTuk User',
        avatarUrl: post.picture_url || ''
      }
    });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.post('/posts', requireAuthV1, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const content = (body.content || '').trim();
  const mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls : [];

  if (!content && mediaUrls.length === 0) {
    return c.json({ status: 'error', error: { code: 'EMPTY_POST', message: 'ต้องมีข้อความหรือสื่ออย่างน้อย 1 อย่าง' } }, 400);
  }
  if (content.length > 5000) {
    return c.json({ status: 'error', error: { code: 'CONTENT_TOO_LONG', message: 'ข้อความยาวเกิน 5,000 ตัวอักษร' } }, 400);
  }

  const db = new DB(c.env.DB);
  try {
    const postId = crypto.randomUUID();
    await db.createPost({
      id: postId,
      userId: session.uid,
      content,
      mediaUrls,
      category: body.category || 'general',
      status: 'active',
      createdAt: Date.now(),
    });
    return c.json({ status: 'success', postId }, 201);
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const db = new DB(c.env.DB);
  try {
    const user = await db.getUserById(id);
    if (!user) {
      return c.json({ status: 'error', error: { code: 'NOT_FOUND', message: 'ไม่พบผู้ใช้นี้' } }, 404);
    }
    return c.json({
      status: 'success',
      user: {
        id: user.id,
        displayName: user.display_name || 'TukTuk User',
        pictureUrl: user.picture_url || '',
        sellerStatus: user.seller_status || 'none',
        isPremium: user.is_premium === 1,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Media upload presign (R2) ────────────────────────────────
v1Routes.post('/media/presign', requireAuthV1, async (c) => {
  const response = await utilityRoutes.request(rewriteRequest(c, '/r2-presigned-url'), undefined, c.env);
  return normalizeJsonResponse(c, response);
});

// Fallback proxy to Go Engine for any unhandled /api/v1/* routes
v1Routes.all('*', (c) => {
  return proxyGoEngine(c, c.req.path);
});