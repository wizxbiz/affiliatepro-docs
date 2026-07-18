import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { marketplaceRoutes } from './marketplace.js';
import { utilityRoutes } from './utility.js';
import { normalizeJsonResponse } from '../lib/api-response.js';
import { rewriteJsonRequest, rewriteRequest } from '../lib/request-rewrite.js';
import { normalizeV1ProductResponse, normalizeV1Product } from '../lib/v1-normalizers.js';
import { DB } from '../lib/db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
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

async function shouldCountView(c, kind, id) {
  if (!c.env.SESSIONS) return true;
  try {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const ua = c.req.header('user-agent') || 'unknown';
    const hash = await shortHash(`${ip}:${ua}`);
    const key = `view:${kind}:${id}:${hash}`;
    if (await c.env.SESSIONS.get(key)) return false;
    await c.env.SESSIONS.put(key, '1', { expirationTtl: 60 * 60 });
    return true;
  } catch (err) {
    console.warn('[v1 view tracking] Dedupe skipped:', err.message);
    return true;
  }
}

async function shortHash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function mediaForPost(row, extra = []) {
  const media = normalizeMediaUrls(row?.media_urls);
  const extras = normalizeMediaUrls([
    ...(Array.isArray(extra) ? extra : [extra]),
    row?.youtube_url,
    row?.video_embed,
  ].filter(Boolean));

  const seen = new Set(media.map((item) => `${item.type}:${item.youtubeId || item.playlistId || item.url}`));
  for (const item of extras) {
    const key = `${item.type}:${item.youtubeId || item.playlistId || item.url}`;
    if (!seen.has(key)) {
      media.unshift(item);
      seen.add(key);
    }
  }
  return media;
}

function postResponse(row) {
  const media = mediaForPost(row);
  const youtube = media.find((item) => item.type === 'youtube');
  const firstImage = media.find((item) => item.type === 'image');
  return {
    ...row,
    media,
    mediaUrls: media,
    youtubeUrl: youtube?.url || row?.youtube_url || '',
    videoEmbed: youtube?.embedUrl || row?.video_embed || '',
    videoUrl: youtube?.url || row?.video_url || '',
    thumbnailUrl: row?.product_thumb || youtube?.thumbnailUrl || firstImage?.url || '',
  };
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

v1Routes.get('/feed', async (c) => {
  // Primary: Go Engine (real-time trending, personalisation).
  // Fallback: D1 posts table — used when Go Engine is cold-starting / unavailable.
  // Shape returned to app: { status:'success', posts:[...] }
  const goResult = await proxyGoEngine(c, '/api/v1/feed');
  if (goResult.status !== 502) return goResult;          // 502 = Go Engine down

  // D1 fallback — build the same shape the app consumes
  const { category, limit = 20, offset = 0, province, mode } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const rows = await db.getPosts({ category, limit: +limit, offset: +offset });
    const posts = rows.map((row) => {
      // Reuse the same mapRowToClient path used by GET /posts/:id
      // (import not needed — call normalisation inline for this shape)
      let mediaUrls = [];
      try { mediaUrls = JSON.parse(row.media_urls || '[]'); } catch (_) {}
      const video = mediaUrls.find(m => m?.type === 'video');
      const image = mediaUrls.find(m => m?.type === 'image') || (typeof mediaUrls[0] === 'string' ? { url: mediaUrls[0] } : null);
      return {
        id: row.id,
        authorId: row.user_id,
        authorName: row.display_name || 'TukTuk Member',
        authorAvatar: row.author_picture || '',
        content: row.content || '',
        videoUrl: video?.url || row.youtube_url || '',
        thumbnailUrl: image?.url || row.product_thumb || '',
        mediaUrls,
        category: row.category || 'general',
        type: video ? 'video' : 'post',
        likes: row.likes_count || 0,
        commentsCount: row.comments_count || 0,
        viewCount: row.views_count || 0,
        createdAt: row.created_at,
      };
    });
    return c.json({ status: 'success', posts, source: 'd1-fallback' });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});
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

// ── Nearme feed (/app DuPlenFeed) ────────────────────────────
// The /app SPA calls GET /api/v1/nearme for the marketplace "near me" rail.
// Returns ranked active products as { status, items, meta } — items already
// carry buyScore / nearmeReason / isOrganic / sellerLocation that the app reads.
v1Routes.get('/nearme', optionalAuth, async (c) => {
  const { mode = 'default', province = '', provinceName = '', category = '', search = '', limit = 24 } = c.req.query();
  const db = new DB(c.env.DB);
  const wantLocal = mode === 'near_me' && (province || provinceName);
  const provinceKey = province || provinceName;

  try {
    // Local-first: try province-matched products, then top up with the rest.
    let rows = [];
    if (wantLocal) {
      rows = await db.getProducts({ category, search, province: provinceKey, limit: +limit, offset: 0 });
    }
    const localIds = new Set(rows.map((r) => r.id));
    if (rows.length < +limit) {
      const fill = await db.getProducts({ category, search, limit: +limit - rows.length, offset: 0 });
      for (const r of fill) if (!localIds.has(r.id)) rows.push(r);
    }

    const items = rows.map((row) => {
      const p = normalizeV1Product(row);
      const isLocal = wantLocal && localIds.has(row.id);
      // Rank: local + organic + popularity. Give a human "why it's here" reason.
      p.buyScore = (isLocal ? 100 : 0) + (p.isOrganic ? 20 : 0) + Math.min(p.viewCount, 50);
      if (!p.nearmeReason) {
        p.nearmeReason = isLocal && p.sellerLocation
          ? `ใกล้คุณใน ${p.sellerLocation}`
          : (p.isOrganic ? 'สินค้าออร์แกนิกยอดนิยม' : (p.viewCount > 0 ? 'กำลังมาแรง' : 'แนะนำสำหรับคุณ'));
      }
      return p;
    }).sort((a, b) => b.buyScore - a.buyScore);

    return c.json({
      status: 'success',
      items,
      meta: { mode, province: provinceKey, count: items.length, local: Boolean(wantLocal) },
    });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.post('/products/:id/view', async (c) => {
  const productId = c.req.param('id');
  const db = new DB(c.env.DB);
  try {
    const counted = await shouldCountView(c, 'product', productId);
    if (counted) await db.incrementProductViews(productId);
    return c.json({ status: 'success', productId, counted });
  } catch (err) {
    return c.json({
      status: 'error',
      error: { code: 'DB_ERROR', message: err.message },
    }, 500);
  }
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
    const posts = rows.map(postResponse);
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
    const mediaUrls = mediaForPost(post);
    const youtube = mediaUrls.find((item) => item.type === 'youtube');
    const firstImage = mediaUrls.find((item) => item.type === 'image');

    return c.json({
      status: 'success',
      post: {
        id: post.id,
        userId: post.user_id,
        content: post.content,
        media: mediaUrls,
        mediaUrls,
        youtubeUrl: youtube?.url || post.youtube_url || '',
        videoEmbed: youtube?.embedUrl || post.video_embed || '',
        videoUrl: youtube?.url || post.video_url || '',
        thumbnailUrl: post.product_thumb || youtube?.thumbnailUrl || firstImage?.url || '',
        category: post.category,
        status: post.status,
        createdAt: post.created_at,
        likes: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        viewCount: post.views_count || 0,
        authorName: post.display_name || 'TukTuk User',
        avatarUrl: post.picture_url || ''
      }
    });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.post('/posts/:id/view', async (c) => {
  const postId = c.req.param('id');
  const db = new DB(c.env.DB);
  try {
    const counted = await shouldCountView(c, 'post', postId);
    if (counted) await db.incrementPostViews(postId);
    return c.json({ status: 'success', postId, counted });
  } catch (err) {
    return c.json({
      status: 'error',
      error: { code: 'DB_ERROR', message: err.message },
    }, 500);
  }
});

// ── Like toggle ─────────────────────────────────────────────
// optionalAuth so LINE/web users (and body.userId fallback) can like.
// Toggles a row in post_likes and keeps posts.likes_count in sync.
v1Routes.post('/posts/:id/like', optionalAuth, async (c) => {
  const postId = c.req.param('id');
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const userId = session?.uid || body.userId || body.authorId;
  if (!userId) {
    return c.json({ status: 'error', error: { code: 'NO_USER', message: 'ต้องเข้าสู่ระบบก่อนกดถูกใจ' } }, 401);
  }

  try {
    // Fetch user_id too so we can notify the post author (Phase 4)
    const post = await c.env.DB.prepare(`SELECT id, user_id FROM posts WHERE id = ?`).bind(postId).first();
    if (!post) {
      return c.json({ status: 'error', error: { code: 'NOT_FOUND', message: 'ไม่พบโพสต์นี้' } }, 404);
    }

    const existing = await c.env.DB.prepare(
      `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`
    ).bind(postId, userId).first();

    let liked;
    if (existing) {
      await c.env.DB.prepare(`DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`).bind(postId, userId).run();
      await c.env.DB.prepare(`UPDATE posts SET likes_count = MAX(COALESCE(likes_count,0) - 1, 0) WHERE id = ?`).bind(postId).run();
      liked = false;
    } else {
      await c.env.DB.prepare(
        `INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`
      ).bind(postId, userId, Date.now()).run();
      await c.env.DB.prepare(`UPDATE posts SET likes_count = COALESCE(likes_count,0) + 1 WHERE id = ?`).bind(postId).run();
      liked = true;
    }

    const row = await c.env.DB.prepare(`SELECT likes_count FROM posts WHERE id = ?`).bind(postId).first();

    // Phase 4 — fire-and-forget: notify the post author on new like (never on unlike, never self)
    if (liked && post.user_id && post.user_id !== userId) {
      const actorName = session?.displayName || 'มีคน';
      const db = new DB(c.env.DB);
      const notifTask = db.createNotification({
        id: crypto.randomUUID(),
        userId: post.user_id,
        type: 'like',
        title: `${actorName} ถูกใจโพสต์ของคุณ`,
        body: '',
        data: { postId, actorId: userId },
      }).catch(() => {});
      if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(notifTask);
    }

    return c.json({ status: 'success', postId, liked, likes: row?.likes_count || 0 });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Like status for a user (which of these posts they liked) ──
v1Routes.get('/posts/:id/like', optionalAuth, async (c) => {
  const postId = c.req.param('id');
  const session = c.get('session');
  const userId = session?.uid || c.req.query('userId');
  if (!userId) return c.json({ status: 'success', liked: false });
  try {
    const existing = await c.env.DB.prepare(
      `SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?`
    ).bind(postId, userId).first();
    return c.json({ status: 'success', liked: Boolean(existing) });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.post('/posts', requireAuthV1, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const content = (body.content || '').trim();
  const youtubeInputs = [body.youtubeUrl, body.videoEmbed, body.videoUrl].filter(Boolean);
  const mediaUrls = normalizeMediaUrls([
    ...(Array.isArray(body.mediaUrls) ? body.mediaUrls : []),
    ...youtubeInputs,
  ]);
  const primaryYoutube = mediaUrls.find((item) => item.type === 'youtube');

  if (youtubeInputs.length > 0 && !primaryYoutube) {
    return c.json({ status: 'error', error: { code: 'INVALID_YOUTUBE_URL', message: 'ลิงก์ YouTube ไม่ถูกต้อง' } }, 400);
  }

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
      youtubeUrl: primaryYoutube?.url || '',
      videoEmbed: primaryYoutube?.embedUrl || '',
      category: body.category || (mediaUrls.some((item) => item.type === 'youtube' || item.type === 'video') ? 'video' : 'general'),
      status: 'active',
      createdAt: Date.now(),
    });

    // ── P3: Push LINE OA confirmation back to the poster ─────────────────
    // Non-blocking: fire-and-forget so the API responds fast regardless.
    // Uses the TukTuk LINE channel token (same channel as the PIN/shop bots).
    const lineUserId = session?.lineUserId || (session?.provider === 'line' ? session?.uid : null);
    const lineToken  = c.env.TUKTUK_CHANNEL_ACCESS_TOKEN || c.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (lineUserId && lineToken) {
      const postUrl = `https://tuktukfeed.com/app/market?product=${postId}`;
      const push = fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{
            type: 'flex',
            altText: '✅ โพสต์ของคุณเผยแพร่แล้ว!',
            contents: {
              type: 'bubble', size: 'kilo',
              header: {
                type: 'box', layout: 'vertical', backgroundColor: '#7c3aed', paddingAll: 'lg',
                contents: [{ type: 'text', text: '✅ โพสต์สำเร็จ!', color: '#fff', weight: 'bold', size: 'lg' }],
              },
              body: {
                type: 'box', layout: 'vertical', backgroundColor: '#1e1b2e', paddingAll: 'lg', spacing: 'sm',
                contents: [
                  { type: 'text', text: (content || 'โพสต์ใหม่').slice(0, 60) + (content.length > 60 ? '…' : ''), color: '#e5e7eb', wrap: true, size: 'sm' },
                  { type: 'text', text: '⏱️ เผยแพร่แล้วสู่ชุมชน TukTuk', color: '#a78bfa', size: 'xs', margin: 'sm' },
                ],
              },
              footer: {
                type: 'box', layout: 'vertical', backgroundColor: '#1e1b2e', paddingAll: 'lg', paddingTop: 'md', spacing: 'sm',
                contents: [
                  { type: 'button', style: 'primary', height: 'sm', color: '#7c3aed',
                    action: { type: 'uri', label: '👁️ ดูโพสต์', uri: postUrl } },
                  { type: 'button', style: 'link', height: 'sm',
                    action: { type: 'message', label: '➕ โพสต์อีกครั้ง', text: 'โพสต์' } },
                ],
              },
            },
          }],
        }),
      }).catch(() => {}); // silent — never blocks the response
      if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(push);
    }

    return c.json({ status: 'success', postId }, 201);
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Comments (sub-resource under posts) ─────────────────────
v1Routes.get('/posts/:id/comments', async (c) => {
  const postId = c.req.param('id');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  try {
    const rows = await c.env.DB.prepare(
      `SELECT pc.id, pc.post_id, pc.user_id, pc.content, pc.created_at,
              u.display_name, u.picture_url
       FROM post_comments pc LEFT JOIN users u ON u.id = pc.user_id
       WHERE pc.post_id = ? ORDER BY pc.created_at ASC LIMIT ?`
    ).bind(postId, limit).all();
    const comments = (rows.results || []).map(r => ({
      id: r.id,
      text: r.content || '',
      authorId: r.user_id,
      authorName: r.display_name || 'สมาชิก',
      authorAvatar: r.picture_url || '',
      createdAt: { seconds: Math.floor((r.created_at || Date.now()) / 1000), nanoseconds: 0 },
    }));
    return c.json({ status: 'success', comments, size: comments.length });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.post('/posts/:id/comments', optionalAuth, async (c) => {
  const postId = c.req.param('id');
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  // Fix: accept both body.text (legacy) and body.content (React /app client)
  const text = (body.text || body.content || '').trim();
  if (!text) return c.json({ status: 'error', error: { code: 'EMPTY', message: 'Comment cannot be empty' } }, 400);

  const commentId = crypto.randomUUID();
  const now = Date.now();
  const userId = session?.uid || body.authorId || 'guest';
  try {
    // 1) Post must exist; fetch user_id too for Phase 4 notification
    const post = await c.env.DB.prepare(`SELECT id, user_id FROM posts WHERE id = ?`).bind(postId).first();
    if (!post) {
      return c.json({ status: 'error', error: { code: 'NOT_FOUND', message: 'Post not found' } }, 404);
    }

    // 2) Ensure commenter exists in users (FK guard)
    await c.env.DB.prepare(
      `INSERT INTO users (id, display_name, picture_url, role, seller_status, is_premium, provider, created_at, updated_at)
       VALUES (?, ?, ?, 'user', 'none', 0, 'line', ?, ?)
       ON CONFLICT(id) DO NOTHING`
    ).bind(
      userId,
      (body.authorName || 'สมาชิก').slice(0, 100),
      body.authorAvatar || '',
      now, now
    ).run();

    // 3) Insert the comment.
    await c.env.DB.prepare(
      `INSERT INTO post_comments (id, post_id, user_id, content, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(commentId, postId, userId, text, now).run();

    // Increment commentsCount on the post (fire-and-forget)
    c.env.DB.prepare(`UPDATE posts SET comments_count = COALESCE(comments_count,0)+1 WHERE id=?`).bind(postId).run().catch(() => {});

    // Phase 4 — notify post author on new comment (never self)
    if (post.user_id && post.user_id !== userId) {
      const actorName = body.authorName || session?.displayName || 'มีคน';
      const snippet = text.slice(0, 60) + (text.length > 60 ? '…' : '');
      const db = new DB(c.env.DB);
      const notifTask = db.createNotification({
        id: crypto.randomUUID(),
        userId: post.user_id,
        type: 'comment',
        title: `${actorName} แสดงความคิดเห็นในโพสต์ของคุณ`,
        body: snippet,
        data: { postId, actorId: userId },
      }).catch(() => {});
      if (c.executionCtx?.waitUntil) c.executionCtx.waitUntil(notifTask);
    }

    return c.json({ status: 'success', commentId }, 201);
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

// ── Public: a user's posts ──────────────────────────────────
v1Routes.get('/users/:id/posts', async (c) => {
  const id = c.req.param('id');
  const { limit = 30, offset = 0 } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const rows = await db.getPostsByUser(id, { limit: +limit, offset: +offset });
    const posts = rows.map(postResponse);
    return c.json({ status: 'success', posts });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Public: a user's active products ────────────────────────
v1Routes.get('/users/:id/products', async (c) => {
  const id = c.req.param('id');
  const { limit = 30 } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const rows = await db.getProductsBySeller(id, +limit);
    const items = rows
      .filter((row) => row.status === 'active')
      .map((row) => normalizeV1Product(row));
    return c.json({ status: 'success', items });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Seller dashboard: my products (all statuses) ────────────
v1Routes.get('/seller/products', requireAuthV1, async (c) => {
  const session = c.get('session');
  const { limit = 50 } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const rows = await db.getProductsBySeller(session.uid, +limit);
    const items = rows.map((row) => ({ ...normalizeV1Product(row), status: row.status }));
    return c.json({ status: 'success', items });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Seller dashboard: my stats ──────────────────────────────
v1Routes.get('/seller/stats', requireAuthV1, async (c) => {
  const session = c.get('session');
  const db = new DB(c.env.DB);
  try {
    const row = await db.getSellerStats(session.uid);
    return c.json({
      status: 'success',
      stats: {
        total: row?.total || 0,
        active: row?.active || 0,
        outOfStock: row?.out_of_stock || 0,
        totalViews: row?.total_views || 0,
      },
    });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Notifications (Phase 4) ─────────────────────────────────
v1Routes.get('/notifications', requireAuthV1, async (c) => {
  const session = c.get('session');
  const { limit = 30 } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const [rows, unread] = await Promise.all([
      db.getNotifications(session.uid, { limit: +limit }),
      db.getUnreadCount(session.uid),
    ]);
    const notifications = rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      isRead: row.is_read === 1,
      data: (() => { try { return row.data ? JSON.parse(row.data) : {} } catch { return {} } })(),
      createdAt: row.created_at,
    }));
    return c.json({ status: 'success', notifications, unread });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.get('/notifications/unread-count', requireAuthV1, async (c) => {
  const session = c.get('session');
  const db = new DB(c.env.DB);
  try {
    const unread = await db.getUnreadCount(session.uid);
    return c.json({ status: 'success', unread });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.post('/notifications/read', requireAuthV1, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.filter(id => typeof id === 'string') : [];
  const db = new DB(c.env.DB);
  try {
    await db.markNotificationsRead(session.uid, ids);
    return c.json({ status: 'success' });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Edit / delete own post (Phase 3) ────────────────────────
// Owner-scoped via WHERE user_id = session.uid; meta.changes === 0 means
// the row doesn't exist OR isn't owned by the caller → 403 (never reveal which).
// Field whitelist is hardcoded — the raw body never reaches _col, so a caller
// cannot touch status / user_id / likes_count / etc.
v1Routes.put('/posts/:id', requireAuthV1, async (c) => {
  const id = c.req.param('id');
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const fields = {};

  if (body.content !== undefined) {
    const content = String(body.content || '').trim();
    if (content.length > 5000) {
      return c.json({ status: 'error', error: { code: 'CONTENT_TOO_LONG', message: 'ข้อความยาวเกิน 5,000 ตัวอักษร' } }, 400);
    }
    fields.content = content;
  }
  if (body.category !== undefined) {
    fields.category = String(body.category || 'general').trim() || 'general';
  }

  if (Object.keys(fields).length === 0) {
    return c.json({ status: 'error', error: { code: 'NO_FIELDS', message: 'ไม่มีข้อมูลที่จะแก้ไข' } }, 400);
  }

  const db = new DB(c.env.DB);
  try {
    const result = await db.updatePost(id, session.uid, fields);
    if ((result?.meta?.changes || 0) === 0) {
      return c.json({ status: 'error', error: { code: 'FORBIDDEN', message: 'ไม่พบโพสต์นี้ หรือไม่ใช่โพสต์ของคุณ' } }, 403);
    }
    return c.json({ status: 'success', postId: id });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.delete('/posts/:id', requireAuthV1, async (c) => {
  const id = c.req.param('id');
  const session = c.get('session');
  const db = new DB(c.env.DB);
  try {
    const result = await db.deletePost(id, session.uid);
    if ((result?.meta?.changes || 0) === 0) {
      return c.json({ status: 'error', error: { code: 'FORBIDDEN', message: 'ไม่พบโพสต์นี้ หรือไม่ใช่โพสต์ของคุณ' } }, 403);
    }
    return c.json({ status: 'success', postId: id });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Edit / delete own product (Phase 3) ─────────────────────
v1Routes.put('/products/:id', requireAuthV1, async (c) => {
  const id = c.req.param('id');
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const fields = {};

  if (body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) return c.json({ status: 'error', error: { code: 'EMPTY_TITLE', message: 'กรุณาใส่ชื่อสินค้า' } }, 400);
    fields.title = title;
  }
  if (body.description !== undefined) fields.description = String(body.description || '').trim();
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) return c.json({ status: 'error', error: { code: 'INVALID_PRICE', message: 'ราคาไม่ถูกต้อง' } }, 400);
    fields.price = price;
  }
  if (body.category !== undefined) fields.category = String(body.category || 'general').trim() || 'general';
  if (body.sellerPhone !== undefined) fields.sellerPhone = String(body.sellerPhone || '').trim();
  if (body.sellerLineId !== undefined) fields.sellerLineId = String(body.sellerLineId || '').trim();
  if (body.sellerFacebook !== undefined) fields.sellerFacebook = String(body.sellerFacebook || '').trim();
  if (body.sellerLocation !== undefined) fields.sellerLocation = String(body.sellerLocation || '').trim();
  if (body.productUnit !== undefined) fields.productUnit = String(body.productUnit || '').trim();
  if (body.productStock !== undefined) {
    const stock = Number(body.productStock);
    if (!Number.isFinite(stock) || stock < 0) return c.json({ status: 'error', error: { code: 'INVALID_STOCK', message: 'จำนวนสินค้าไม่ถูกต้อง' } }, 400);
    fields.productStock = stock;
  }
  if (body.isOtop !== undefined || body.isOTOP !== undefined) fields.isOtop = (body.isOtop || body.isOTOP) ? 1 : 0;
  if (body.isOrganic !== undefined) fields.isOrganic = body.isOrganic ? 1 : 0;

  if (Object.keys(fields).length === 0) {
    return c.json({ status: 'error', error: { code: 'NO_FIELDS', message: 'ไม่มีข้อมูลที่จะแก้ไข' } }, 400);
  }

  const db = new DB(c.env.DB);
  try {
    const result = await db.updateProduct(id, session.uid, fields);
    if ((result?.meta?.changes || 0) === 0) {
      return c.json({ status: 'error', error: { code: 'FORBIDDEN', message: 'ไม่พบสินค้านี้ หรือไม่ใช่สินค้าของคุณ' } }, 403);
    }
    return c.json({ status: 'success', productId: id });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

v1Routes.delete('/products/:id', requireAuthV1, async (c) => {
  const id = c.req.param('id');
  const session = c.get('session');
  const db = new DB(c.env.DB);
  try {
    const result = await db.deleteProduct(id, session.uid);
    if ((result?.meta?.changes || 0) === 0) {
      return c.json({ status: 'error', error: { code: 'FORBIDDEN', message: 'ไม่พบสินค้านี้ หรือไม่ใช่สินค้าของคุณ' } }, 403);
    }
    return c.json({ status: 'success', productId: id });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// ── Media upload presign (R2) — optionalAuth (allows guests and LINE users) ─
v1Routes.post('/media/presign', optionalAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const { folder = 'uploads', filename = 'file', contentType = 'application/octet-stream' } = body;

  if (!folder || !filename || !contentType) {
    return c.json({ status: 'error', error: { code: 'MISSING_PARAMS', message: 'Missing folder, filename, or contentType' } }, 400);
  }

  // Validate allowed folders
  const ALLOWED_FOLDERS = [
    'community_posts', 'community_posts/thumbs',
    'posts', 'posts/thumbs',
    'products', 'products/thumbs',
    'avatars', 'stories'
  ];
  if (!ALLOWED_FOLDERS.some(f => folder === f || folder.startsWith(f + '/'))) {
    return c.json({ status: 'error', error: { code: 'INVALID_FOLDER', message: 'Upload folder not allowed' } }, 400);
  }

  try {
    const response = await utilityRoutes.request(rewriteJsonRequest(c, '/r2-presigned-url', { folder, filename, contentType, lineUserId: session?.uid || null }), undefined, c.env);
    const result = await normalizeJsonResponse(c, response);
    return result;
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'PRESIGN_FAILED', message: err.message || 'Failed to generate upload URL' } }, 500);
  }
});

// ── Web Push Subscriptions (optional auth) ───────────────────
v1Routes.post('/push/subscribe', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  // Client sends: { data: { subscription, uid } }  OR  { subscription, uid }
  const payload = body.data || body;
  const { subscription, uid } = payload;

  if (!subscription || !subscription.endpoint) {
    return c.json({ status: 'error', error: { code: 'MISSING_SUBSCRIPTION', message: 'Missing subscription endpoint' } }, 400);
  }

  const userId = uid || 'anonymous';
  const keysJson = JSON.stringify(subscription.keys || {});
  const id = crypto.randomUUID();

  try {
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (id, user_id, endpoint, keys, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, userId, subscription.endpoint, keysJson, Date.now()).run();
    return c.json({ data: { success: true } });
  } catch (err) {
    return c.json({ status: 'error', error: { code: 'DB_ERROR', message: err.message } }, 500);
  }
});

// Fallback proxy to Go Engine for any unhandled /api/v1/* routes
v1Routes.all('*', (c) => {
  return proxyGoEngine(c, c.req.path);
});