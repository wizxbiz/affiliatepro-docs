/**
 * TukTuk Social — Cloudflare Workers Entry Point
 * Phase 2: API Gateway replacing Firebase Cloud Functions
 *
 * Uses Hono.js for routing (lightweight, edge-optimized)
 * Install: npm install hono
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Route handlers (each maps to a Firebase function group)
import { marketplaceRoutes }  from './handlers/marketplace.js';
import { authRoutes }         from './handlers/auth.js';
import { lineWebhookRoutes }  from './handlers/line-webhook.js';
import { analyticsRoutes }    from './handlers/analytics.js';
import { adminRoutes }        from './handlers/admin.js';
import { utilityRoutes }      from './handlers/utility.js';
import { v1Routes }        from './handlers/v1.js';
import { rewriteRequest }   from './lib/request-rewrite.js';

const app = new Hono();


// ── Global Middleware ─────────────────────────────────────────
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (
      origin.endsWith('.pages.dev') ||
      origin.includes('tuktukfeed.pages.dev') ||
      origin === 'https://tuktukthailand.com' ||
      origin === 'https://appinjproject.web.app' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return origin;
    }
    return 'https://tuktukthailand.com';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token', 'X-Line-Signature'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// ── Welcome & Health Check ────────────────────────────────────
app.get('/', (c) => c.json({
  message: 'TukTuk Social API Gateway — Cloudflare Workers',
  status: 'online',
  timestamp: Date.now(),
  environment: c.env.ENVIRONMENT || 'development'
}));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// ── Route Groups ──────────────────────────────────────────────
app.route('/api/marketplace', marketplaceRoutes);
app.route('/api/auth',        authRoutes);
app.route('/api/line',        lineWebhookRoutes);
app.route('/api/analytics',   analyticsRoutes);
app.route('/api/admin',       adminRoutes);
app.route('/api/utility',     utilityRoutes);

// Phase 2 REST API contract aliases.
// These routes let new frontend code use /api/v1/* while legacy handlers stay intact.
app.route('/api/v1', v1Routes);

// ── Legacy Firebase Function URLs (backward-compat) ──────────
// These match the routes in firebase.json rewrites

// Marketplace share (OG preview)
app.get('/share',           (c) => marketplaceRoutes.request(rewriteRequest(c, '/share'), undefined, c.env));
app.get('/community-share', (c) => marketplaceRoutes.request(rewriteRequest(c, '/community-share'), undefined, c.env));

// Auth callbacks
app.all('/lineLoginCallback',    (c) => authRoutes.request(rewriteRequest(c, '/line-callback'), undefined, c.env));
app.post('/marketplaceLineAuth', (c) => authRoutes.request(rewriteRequest(c, '/marketplace-line-auth'), undefined, c.env));
app.post('/verifyWebPin',        (c) => authRoutes.request(rewriteRequest(c, '/verify-pin'), undefined, c.env));
app.post('/checkFreeUsage',      (c) => authRoutes.request(rewriteRequest(c, '/check-usage'), undefined, c.env));

// Analytics
app.post('/api/analytics/trackPageView', (c) => analyticsRoutes.request(rewriteRequest(c, '/trackPageView'), undefined, c.env));
app.post('/api/analytics/trackEvent',    (c) => analyticsRoutes.request(rewriteRequest(c, '/trackEvent'), undefined, c.env));
app.get('/api/analytics/getStats',       (c) => analyticsRoutes.request(rewriteRequest(c, '/getStats'), undefined, c.env));

// Utility
app.post('/api/r2PresignedUrl',            (c) => utilityRoutes.request(rewriteRequest(c, '/r2-presigned-url'), undefined, c.env));
app.post('/api/marketplaceAIGeneratePost', (c) => marketplaceRoutes.request(rewriteRequest(c, '/ai-generate'), undefined, c.env));
app.post('/r2PresignedUrl',                (c) => utilityRoutes.request(rewriteRequest(c, '/r2-presigned-url'), undefined, c.env));
app.post('/marketplaceAIGeneratePost',     (c) => marketplaceRoutes.request(rewriteRequest(c, '/ai-generate'), undefined, c.env));
// R2 file deletion (replaces TODO comments in frontend)
app.delete('/api/r2Delete',                (c) => utilityRoutes.request(rewriteRequest(c, '/r2-delete'), undefined, c.env, c.executionCtx));

// ── Firestore Database Compatibility Shim Endpoint (Phase 3) ────

// Get collections (support nested paths like /api/db/conversations/:id/messages)
app.get('/api/db/:collection', async (c) => {
  return handleDbQuery(c);
});
app.get('/api/db/:parent/:parentId/:collection', async (c) => {
  return handleDbQuery(c);
});

// Get/Modify documents (support nested paths)
app.all('/api/db/:collection/:id', async (c) => {
  return handleDbDoc(c);
});
app.all('/api/db/:parent/:parentId/:collection/:id', async (c) => {
  return handleDbDoc(c);
});

async function handleDbQuery(c) {
  const collection = c.req.param('collection');
  const parentId = c.req.param('parentId');
  const queries = c.req.query();
  const db = c.env.DB;

  let tableName = collection;
  if (collection === 'marketplace_items') tableName = 'products';
  else if (collection === 'community_products') tableName = 'products';
  else if (collection === 'line_users') tableName = 'users';
  else if (collection === 'seller_profiles') tableName = 'users'; // legacy Flutter collection
  else if (collection === 'ai_post_usage') tableName = 'user_usage';
  let sql = `SELECT * FROM ${tableName}`;
  let binds = [];
  let whereClauses = [];

  // If subcollection is messages
  if (collection === 'messages' && parentId) {
    tableName = 'chat_messages';
    sql = `SELECT * FROM chat_messages`;
    whereClauses.push('conversation_id = ?');
    binds.push(parentId);
  }

  // Parse filters: filter=status:==:active
  const filters = c.req.queries('filter') || [];
  for (const f of filters) {
    const parts = f.split(':');
    if (parts.length >= 3) {
      const field = parts[0];
      const op = parts[1];
      const val = parts.slice(2).join(':');

      let dbField = field.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
      if (dbField === 'created_at' && tableName === 'products') dbField = 'created_at';

      if (op === 'array-contains') {
        whereClauses.push(`${dbField} LIKE ?`);
        binds.push(`%"${val}"%`);
      } else {
        let dbOp = '=';
        if (op === '==') dbOp = '=';
        else if (op === '>') dbOp = '>';
        else if (op === '<') dbOp = '<';
        else if (op === '>=') dbOp = '>=';
        else if (op === '<=') dbOp = '<=';
        whereClauses.push(`${dbField} ${dbOp} ?`);
        binds.push(val);
      }
    }
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Parse orders
  const orders = c.req.queries('order') || [];
  let orderClauses = [];
  for (const o of orders) {
    const [field, dir] = o.split(':');
    let dbField = field.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    orderClauses.push(`${dbField} ${dir.toUpperCase()}`);
  }
  if (orderClauses.length > 0) {
    sql += ` ORDER BY ${orderClauses.join(', ')}`;
  }

  // Parse limit
  const limit = queries.limit;
  if (limit) {
    sql += ` LIMIT ?`;
    binds.push(parseInt(limit));
  }

  try {
    // Joint query for products table
    if (tableName === 'products') {
      sql = sql.replace('SELECT * FROM products', `
        SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
        FROM products p LEFT JOIN users u ON p.seller_id = u.id
      `);
    }

    const { results } = await db.prepare(sql).bind(...binds).all();

    // Map back to camelCase Firestore models
    const mapped = results.map(row => mapRowToClient(row, tableName));
    return c.json({ results: mapped });
  } catch (err) {
    console.error('Generic DB query error:', err.message, sql);
    return c.json({ results: [] });
  }
}

async function handleDbDoc(c) {
  const collection = c.req.param('collection');
  const id = c.req.param('id');
  const parentId = c.req.param('parentId');
  const method = c.req.method;
  const db = c.env.DB;

  let tableName = collection;
  if (collection === 'marketplace_items') tableName = 'products';
  else if (collection === 'community_products') tableName = 'products';
  else if (collection === 'line_users') tableName = 'users';
  else if (collection === 'seller_profiles') tableName = 'users'; // legacy Flutter collection
  else if (collection === 'ai_post_usage') tableName = 'user_usage';
  if (collection === 'messages' && parentId) {
    tableName = 'chat_messages';
  }

  if (method === 'GET') {
    try {
      let sql = `SELECT * FROM ${tableName} WHERE id = ?`;
      if (tableName === 'products') {
        sql = `
          SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
          FROM products p LEFT JOIN users u ON p.seller_id = u.id
          WHERE p.id = ?
        `;
      }
      const row = await db.prepare(sql).bind(id).first();
      return c.json({ result: row ? mapRowToClient(row, tableName) : null });
    } catch (err) {
      return c.json({ result: null });
    }
  }

  if (method === 'PATCH' || method === 'PUT') {
    const body = await c.req.json();
    const sets = [];
    const binds = [];

    // Check if document exists (important for Upserts/PUT)
    const existing = await db.prepare(`SELECT 1 FROM ${tableName} WHERE id = ?`).bind(id).first();
    const isInsert = !existing && method === 'PUT';

    // Normalize keys: collect unreadCount_ and typing. sub-keys into single objects
    const normalizedBody = {};
    const unreads = {};
    const typing = {};

    for (const [k, v] of Object.entries(body)) {
      if (k.startsWith('unreadCount_')) {
        unreads[k.replace('unreadCount_', '')] = v;
      } else if (k.startsWith('typing.')) {
        typing[k.replace('typing.', '')] = v;
      } else {
        normalizedBody[k] = v;
      }
    }

    if (isInsert) {
      if (Object.keys(unreads).length > 0) {
        normalizedBody.unread_counts = JSON.stringify(unreads);
      }
      if (Object.keys(typing).length > 0) {
        normalizedBody.typing = JSON.stringify(typing);
      }

      // Handle INSERT
      const fields = ['id'];
      const placeholders = ['?'];
      binds.push(id);


      const insertBody = mapDocumentForTable(tableName, normalizedBody, id, parentId);
      await ensureRelatedRows(db, tableName, insertBody);
      for (const [dbField, val] of Object.entries(insertBody)) {
        if (dbField === 'id') continue;
        fields.push(dbField);
        placeholders.push('?');
        binds.push(val);
      }

      const sql = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      try {
        await db.prepare(sql).bind(...binds).run();
        return c.json({ success: true });
      } catch (err) {
        console.error('Insert error:', err.message, sql);
        return c.json({ error: err.message }, 500);
      }
    } else {
      // Handle UPDATE / PATCH
      if (Object.keys(unreads).length > 0 && tableName === 'conversations') {
        const row = await db.prepare('SELECT unread_counts FROM conversations WHERE id = ?').bind(id).first();
        let currentUnreads = {};
        try { currentUnreads = JSON.parse(row?.unread_counts || '{}'); } catch(_) {}
        
        for (const [uid, countVal] of Object.entries(unreads)) {
          if (countVal && typeof countVal === 'object' && countVal.__type === 'increment') {
            currentUnreads[uid] = (currentUnreads[uid] || 0) + (countVal.value || 1);
          } else {
            currentUnreads[uid] = countVal;
          }
        }
        normalizedBody.unread_counts = JSON.stringify(currentUnreads);
      }
      
      if (Object.keys(typing).length > 0 && (tableName === 'conversations' || tableName === 'product_chats')) {
        const row = await db.prepare(`SELECT typing FROM ${tableName} WHERE id = ?`).bind(id).first();
        let currentTyping = {};
        try { currentTyping = JSON.parse(row?.typing || '{}'); } catch(_) {}
        
        for (const [uid, typingVal] of Object.entries(typing)) {
          currentTyping[uid] = typingVal;
        }
        normalizedBody.typing = JSON.stringify(currentTyping);
      }

      const updateBody = mapDocumentForTable(tableName, normalizedBody, id, parentId, true);
      await ensureRelatedRows(db, tableName, updateBody);
      for (const [dbField, v] of Object.entries(updateBody)) {
        if (dbField === 'id') continue;

        if (v && typeof v === 'object' && v.__type === 'arrayUnion') {
          const row = await db.prepare(`SELECT ${dbField} FROM ${tableName} WHERE id = ?`).bind(id).first();
          let arr = [];
          try { arr = JSON.parse(row?.[dbField] || '[]'); } catch(_) {}
          const newArr = [...new Set([...arr, ...v.items])];
          sets.push(`${dbField} = ?`);
          binds.push(JSON.stringify(newArr));
          continue;
        }

        if (v && typeof v === 'object' && v.__type === 'arrayRemove') {
          const row = await db.prepare(`SELECT ${dbField} FROM ${tableName} WHERE id = ?`).bind(id).first();
          let arr = [];
          try { arr = JSON.parse(row?.[dbField] || '[]'); } catch(_) {}
          const newArr = arr.filter(x => !v.items.includes(x));
          sets.push(`${dbField} = ?`);
          binds.push(JSON.stringify(newArr));
          continue;
        }

        if (v && typeof v === 'object' && v.__type === 'increment') {
          sets.push(`${dbField} = ${dbField} + ?`);
          binds.push(v.value);
          continue;
        }

        sets.push(`${dbField} = ?`);
        binds.push(v);

      }

      if (sets.length === 0) return c.json({ success: true });
      binds.push(id);
      const sql = `UPDATE ${tableName} SET ${sets.join(', ')} WHERE id = ?`;
      try {
        await db.prepare(sql).bind(...binds).run();
        return c.json({ success: true });
      } catch (err) {
        console.error('Update error:', err.message, sql);
        return c.json({ error: err.message }, 500);
      }
    }
  }

  if (method === 'DELETE') {
    try {
      await db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).bind(id).run();
      return c.json({ success: true });
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  }

  return c.json({ error: 'Method not allowed' }, 405);
}

async function ensureRelatedRows(db, tableName, body) {
  // Both products (seller_id) and posts (user_id) have a FK → users(id).
  // Inserting for a guest / not-yet-synced user would fail the FK constraint,
  // so upsert a minimal user row first.
  const ownerId = (tableName === 'products' && body.seller_id)
    ? body.seller_id
    : (tableName === 'posts' && body.user_id ? body.user_id : null);
  if (!ownerId) return;

  const existingUser = await db.prepare('SELECT 1 FROM users WHERE id = ?').bind(ownerId).first();
  if (existingUser) return;

  const displayName = tableName === 'products' ? 'ผู้ขาย' : 'สมาชิก';
  await db.prepare(`
    INSERT INTO users (id, line_user_id, display_name, role, seller_status, is_premium, provider, created_at, updated_at)
    VALUES (?, ?, ?, 'user', 'none', 0, 'line', ?, ?)
  `).bind(ownerId, ownerId, displayName, Date.now(), Date.now()).run();
}

function asJson(value, fallback) {
  if (value == null) return JSON.stringify(fallback);
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function normalizeTimestamp(value) {
  if (value == null) return Date.now();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1000000);
  }
  return Date.now();
}

function setIfPresent(target, key, value, include) {
  if (include) target[key] = value;
}

function mapDocumentForTable(tableName, body, id, parentId, partial = false) {
  if (tableName === 'products') {
    const mapped = {};
    const hasImages = Object.prototype.hasOwnProperty.call(body, 'images') ||
      Object.prototype.hasOwnProperty.call(body, 'imageUrl') ||
      Object.prototype.hasOwnProperty.call(body, 'additionalImages');
    const images = body.images || [body.imageUrl, ...(body.additionalImages || [])].filter(Boolean);

    setIfPresent(mapped, 'title', body.productName || body.title || 'สินค้า', !partial || body.productName !== undefined || body.title !== undefined);
    setIfPresent(mapped, 'seller_id', body.sellerId || body.lineUserId || body.userId || 'unknown', !partial || body.sellerId !== undefined || body.lineUserId !== undefined || body.userId !== undefined);
    setIfPresent(mapped, 'description', body.description || '', !partial || body.description !== undefined);
    setIfPresent(mapped, 'price', Number(body.price || 0), !partial || body.price !== undefined);
    setIfPresent(mapped, 'images', asJson(images, []), !partial || hasImages);
    setIfPresent(mapped, 'category', body.category || 'general', !partial || body.category !== undefined);
    setIfPresent(mapped, 'status', body.status || 'active', !partial || body.status !== undefined);
    setIfPresent(mapped, 'views_count', Number(body.viewCount || body.viewsCount || body.views_count || 0), !partial || body.viewCount !== undefined || body.viewsCount !== undefined || body.views_count !== undefined);
    
    // Additional seller fields
    setIfPresent(mapped, 'seller_phone', body.sellerPhone || '', !partial || body.sellerPhone !== undefined);
    setIfPresent(mapped, 'seller_line_id', body.sellerLineId || '', !partial || body.sellerLineId !== undefined);
    setIfPresent(mapped, 'seller_facebook', body.sellerFacebook || '', !partial || body.sellerFacebook !== undefined);
    setIfPresent(mapped, 'seller_location', body.sellerLocation || '', !partial || body.sellerLocation !== undefined);
    
    // Additional community fields
    setIfPresent(mapped, 'product_unit', body.productUnit || '', !partial || body.productUnit !== undefined);
    setIfPresent(mapped, 'product_stock', Number(body.productStock || 0), !partial || body.productStock !== undefined);
    setIfPresent(mapped, 'is_otop', body.isOTOP ? 1 : 0, !partial || body.isOTOP !== undefined);
    setIfPresent(mapped, 'is_organic', body.isOrganic ? 1 : 0, !partial || body.isOrganic !== undefined);
    
    // Other fields
    setIfPresent(mapped, 'video_url', body.videoUrl || '', !partial || body.videoUrl !== undefined);

    setIfPresent(mapped, 'created_at', normalizeTimestamp(body.createdAt), !partial || body.createdAt !== undefined);
    setIfPresent(mapped, 'updated_at', normalizeTimestamp(body.updatedAt), !partial || body.updatedAt !== undefined);
    return mapped;
  }

  if (tableName === 'users') {
    const mapped = {};
    setIfPresent(mapped, 'line_user_id', body.lineUserId || id, !partial || body.lineUserId !== undefined);
    setIfPresent(mapped, 'firebase_uid', body.firebaseUid || null, !partial || body.firebaseUid !== undefined);
    setIfPresent(mapped, 'display_name', body.displayName || body.name || '', !partial || body.displayName !== undefined || body.name !== undefined);
    setIfPresent(mapped, 'email', body.email || null, !partial || body.email !== undefined);
    setIfPresent(mapped, 'picture_url', body.pictureUrl || body.photoURL || null, !partial || body.pictureUrl !== undefined || body.photoURL !== undefined);
    setIfPresent(mapped, 'role', body.role || 'user', !partial || body.role !== undefined);
    setIfPresent(mapped, 'seller_status', body.sellerStatus || 'none', !partial || body.sellerStatus !== undefined);
    setIfPresent(mapped, 'is_premium', body.isPremium ? 1 : 0, !partial || body.isPremium !== undefined);
    setIfPresent(mapped, 'subscription_status', body.subscriptionStatus || null, !partial || body.subscriptionStatus !== undefined);
    setIfPresent(mapped, 'provider', body.provider || 'line', !partial || body.provider !== undefined);
    setIfPresent(mapped, 'phone', body.phone || body.phoneNumber || null, !partial || body.phone !== undefined || body.phoneNumber !== undefined);
    setIfPresent(mapped, 'created_at', normalizeTimestamp(body.createdAt), !partial || body.createdAt !== undefined);
    setIfPresent(mapped, 'updated_at', normalizeTimestamp(body.updatedAt), !partial || body.updatedAt !== undefined);
    return mapped;
  }

  if (tableName === 'conversations') {
    const mapped = {};
    setIfPresent(mapped, 'participants', asJson(body.participants, []), !partial || body.participants !== undefined);
    setIfPresent(mapped, 'last_message', body.lastMessage || '', !partial || body.lastMessage !== undefined);
    setIfPresent(mapped, 'last_message_at', normalizeTimestamp(body.lastMessageAt), !partial || body.lastMessageAt !== undefined);
    setIfPresent(mapped, 'last_sender_id', body.lastSenderId || null, !partial || body.lastSenderId !== undefined);
    setIfPresent(mapped, 'unread_counts', asJson(body.unread_counts || body.unreadCounts, {}), !partial || body.unread_counts !== undefined || body.unreadCounts !== undefined);
    setIfPresent(mapped, 'status', body.status || 'pending', !partial || body.status !== undefined);
    setIfPresent(mapped, 'request_by', body.requestBy || null, !partial || body.requestBy !== undefined);
    setIfPresent(mapped, 'created_at', normalizeTimestamp(body.createdAt), !partial || body.createdAt !== undefined);
    setIfPresent(mapped, 'platform', body.platform || 'web', !partial || body.platform !== undefined);
    setIfPresent(mapped, 'typing', asJson(body.typing, {}), !partial || body.typing !== undefined);
    return mapped;
  }

  if (tableName === 'product_chats') {
    const mapped = {};
    setIfPresent(mapped, 'buyer_id', body.buyerId || body.lineUserId || '', !partial || body.buyerId !== undefined || body.lineUserId !== undefined);
    setIfPresent(mapped, 'seller_id', body.sellerId || '', !partial || body.sellerId !== undefined);
    setIfPresent(mapped, 'line_user_id', body.lineUserId || null, !partial || body.lineUserId !== undefined);
    setIfPresent(mapped, 'product_id', body.productId || '', !partial || body.productId !== undefined);
    setIfPresent(mapped, 'product_name', body.productName || '', !partial || body.productName !== undefined);
    setIfPresent(mapped, 'product_image_url', body.productImageUrl || body.imageUrl || '', !partial || body.productImageUrl !== undefined || body.imageUrl !== undefined);
    setIfPresent(mapped, 'price', Number(body.price || 0), !partial || body.price !== undefined);
    setIfPresent(mapped, 'last_message', body.lastMessage || '', !partial || body.lastMessage !== undefined);
    setIfPresent(mapped, 'last_message_at', normalizeTimestamp(body.lastMessageAt), !partial || body.lastMessageAt !== undefined);
    setIfPresent(mapped, 'last_sender_id', body.lastSenderId || null, !partial || body.lastSenderId !== undefined);
    setIfPresent(mapped, 'unread_count_buyer', Number(body.unreadCountBuyer || 0), !partial || body.unreadCountBuyer !== undefined);
    setIfPresent(mapped, 'unread_count_seller', Number(body.unreadCountSeller || 0), !partial || body.unreadCountSeller !== undefined);
    setIfPresent(mapped, 'status', body.status || 'active', !partial || body.status !== undefined);
    setIfPresent(mapped, 'created_at', normalizeTimestamp(body.createdAt), !partial || body.createdAt !== undefined);
    setIfPresent(mapped, 'typing', asJson(body.typing, {}), !partial || body.typing !== undefined);
    return mapped;
  }

  if (tableName === 'chat_messages') {
    const mapped = {};
    setIfPresent(mapped, 'conversation_id', parentId || body.conversationId || '', !partial || parentId || body.conversationId !== undefined);
    setIfPresent(mapped, 'sender_id', body.senderId || '', !partial || body.senderId !== undefined);
    setIfPresent(mapped, 'sender_name', body.senderName || '', !partial || body.senderName !== undefined);
    setIfPresent(mapped, 'text', body.text || body.content || '', !partial || body.text !== undefined || body.content !== undefined);
    setIfPresent(mapped, 'timestamp', normalizeTimestamp(body.timestamp || body.createdAt), !partial || body.timestamp !== undefined || body.createdAt !== undefined);
    setIfPresent(mapped, 'type', body.type || (body.imageUrl ? 'image' : 'text'), !partial || body.type !== undefined || body.imageUrl !== undefined);
    setIfPresent(mapped, 'image_url', body.imageUrl || body.mediaUrl || null, !partial || body.imageUrl !== undefined || body.mediaUrl !== undefined);
    setIfPresent(mapped, 'status', body.status || 'sent', !partial || body.status !== undefined);
    return mapped;
  }

  if (tableName === 'user_chat_settings') {
    const mapped = {};
    setIfPresent(mapped, 'user_id', id, !partial);
    setIfPresent(mapped, 'pinned', asJson(body.pinned, []), !partial || body.pinned !== undefined);
    setIfPresent(mapped, 'archived', asJson(body.archived, []), !partial || body.archived !== undefined);
    return mapped;
  }

  if (tableName === 'posts') {
    const mapped = {};
    setIfPresent(mapped, 'user_id', body.authorId || body.userId || 'unknown', !partial || body.authorId !== undefined || body.userId !== undefined);
    setIfPresent(mapped, 'content', body.content || body.text || '', !partial || body.content !== undefined || body.text !== undefined);
    setIfPresent(mapped, 'media_urls', asJson(body.mediaUrls || body.images || body.media, []), !partial || body.mediaUrls !== undefined || body.images !== undefined || body.media !== undefined);
    setIfPresent(mapped, 'youtube_url', body.youtubeUrl || '', !partial || body.youtubeUrl !== undefined);
    setIfPresent(mapped, 'video_embed', body.videoEmbed || '', !partial || body.videoEmbed !== undefined);
    // NOTE: the posts table has NO `video_url` column — the video URL lives inside
    // media_urls (as {url, type:'video'}). Setting video_url here crashed every INSERT
    // with "table posts has no column named video_url". Do not re-add it.
    setIfPresent(mapped, 'title', body.title || '', !partial || body.title !== undefined);
    setIfPresent(mapped, 'category', body.category || 'general', !partial || body.category !== undefined);
    setIfPresent(mapped, 'status', body.status || 'active', !partial || body.status !== undefined);
    setIfPresent(mapped, 'likes_count', Number(body.likes || 0), !partial || body.likes !== undefined);
    setIfPresent(mapped, 'comments_count', Number(body.comments || body.commentsCount || 0), !partial || body.comments !== undefined || body.commentsCount !== undefined);
    setIfPresent(mapped, 'views_count', Number(body.viewCount || body.viewsCount || 0), !partial || body.viewCount !== undefined || body.viewsCount !== undefined);
    setIfPresent(mapped, 'linked_product_id', body.linkedProductId || '', !partial || body.linkedProductId !== undefined);
    setIfPresent(mapped, 'product_name', body.productName || '', !partial || body.productName !== undefined);
    setIfPresent(mapped, 'product_price', Number(body.productPrice || 0), !partial || body.productPrice !== undefined);
    setIfPresent(mapped, 'product_thumb', body.productThumb || '', !partial || body.productThumb !== undefined);
    setIfPresent(mapped, 'pinned', body.pinned ? 1 : 0, !partial || body.pinned !== undefined);
    setIfPresent(mapped, 'published', body.published === false ? 0 : 1, !partial || body.published !== undefined);
    setIfPresent(mapped, 'created_at', normalizeTimestamp(body.createdAt), !partial || body.createdAt !== undefined);
    setIfPresent(mapped, 'updated_at', normalizeTimestamp(body.updatedAt), !partial || body.updatedAt !== undefined);
    return mapped;
  }

  const mapped = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id') continue;
    const col = k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    mapped[col] = (v && typeof v === 'object' && !Array.isArray(v)) ? JSON.stringify(v) : v;
  }
  return mapped;
}

function mapRowToClient(row, tableName) {
  if (tableName === 'products') {
    let imgs = [];
    try { imgs = JSON.parse(row.images || '[]'); } catch(_) {}
    return {
      id: row.id,
      productName: row.title,
      title: row.title,
      description: row.description,
      price: row.price,
      imageUrl: imgs[0] || '',
      additionalImages: imgs.slice(1),
      images: imgs,
      sellerName: row.seller_name || 'ผู้ขาย',
      sellerId: row.seller_id,
      lineUserId: row.seller_id,
      sellerPictureUrl: row.seller_picture || '',
      category: row.category,
      status: row.status,
      viewCount: row.views_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  if (tableName === 'users') {
    return {
      id: row.id,
      lineUserId: row.line_user_id,
      displayName: row.display_name,
      pictureUrl: row.picture_url,
      role: row.role,
      sellerStatus: row.seller_status,
      isPremium: row.is_premium === 1,
      subscriptionStatus: row.subscription_status,
      createdAt: row.created_at,
    };
  }
  if (tableName === 'conversations') {
    let parts = [];
    try { parts = JSON.parse(row.participants || '[]'); } catch(_) {}
    let typing = {};
    try { typing = JSON.parse(row.typing || '{}'); } catch(_) {}
    
    const mapped = {
      id: row.id,
      participants: parts,
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      lastSenderId: row.last_sender_id,
      status: row.status,
      requestBy: row.request_by,
      createdAt: row.created_at,
      platform: row.platform,
      typing: typing,
    };

    // Unpack unread_counts
    let unreads = {};
    try { unreads = JSON.parse(row.unread_counts || '{}'); } catch(_) {}
    for (const [uid, count] of Object.entries(unreads)) {
      mapped[`unreadCount_${uid}`] = count;
    }
    return mapped;
  }
  if (tableName === 'product_chats') {
    let typing = {};
    try { typing = JSON.parse(row.typing || '{}'); } catch(_) {}
    return {
      id: row.id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      lineUserId: row.line_user_id,
      productId: row.product_id,
      productName: row.product_name,
      productImageUrl: row.product_image_url,
      price: row.price,
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      lastSenderId: row.last_sender_id,
      unreadCountBuyer: row.unread_count_buyer,
      unreadCountSeller: row.unread_count_seller,
      status: row.status,
      createdAt: row.created_at,
      typing: typing,
    };
  }
  if (tableName === 'chat_messages') {
    return {
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      text: row.content,
      timestamp: row.timestamp,
      type: row.type,
      imageUrl: row.image_url,
      status: row.status,
    };
  }
  if (tableName === 'user_chat_settings') {
    let pinned = [];
    let archived = [];
    try { pinned = JSON.parse(row.pinned || '[]'); } catch(_) {}
    try { archived = JSON.parse(row.archived || '[]'); } catch(_) {}
    return {
      pinned,
      archived
    };
  }
  if (tableName === 'posts') {
    let mediaUrls = [];
    try { mediaUrls = JSON.parse(row.media_urls || '[]'); } catch(_) {}
    if (!Array.isArray(mediaUrls)) mediaUrls = [];
    // There is no video_url column — derive the playable video URL from media_urls.
    const videoEntry = mediaUrls.find(m => m && typeof m === 'object' && m.type === 'video');
    const imageEntry = mediaUrls.find(m => m && typeof m === 'object' && m.type === 'image')
      || (typeof mediaUrls[0] === 'string' ? { url: mediaUrls[0] } : null);
    return {
      id: row.id,
      authorId: row.user_id || row.author_id,
      userId: row.user_id || row.author_id,
      // authorName/authorAvatar come from the LEFT JOIN with users in getPosts/getPostById
      authorName: row.display_name || row.author_name || 'TukTuk Member',
      authorAvatar: row.author_picture || row.picture_url || '',
      title: row.title || '',
      content: row.content,
      mediaUrls: mediaUrls,
      images: mediaUrls,
      media: mediaUrls,
      imageUrl: imageEntry?.url || '',
      thumbnailUrl: imageEntry?.url || '',
      youtubeUrl: row.youtube_url || '',
      videoEmbed: row.video_embed || '',
      videoUrl: videoEntry?.url || row.youtube_url || '',
      category: row.category || 'general',
      status: row.status || 'active',
      likes: row.likes_count || 0,
      comments: row.comments_count || 0,
      commentsCount: row.comments_count || 0,
      viewCount: row.views_count || 0,
      views: row.views_count || 0,
      linkedProductId: row.linked_product_id || '',
      productName: row.product_name || '',
      productPrice: row.product_price || 0,
      productThumb: row.product_thumb || '',
      pinned: row.pinned === 1 || row.pinned === true,
      published: row.published !== 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  return row;
}

// ── 404 Fallback ──────────────────────────────────────────────
app.notFound((c) => c.json({ error: 'Not Found', path: c.req.path }, 404));

// ── Error Handler ─────────────────────────────────────────────
app.onError((err, c) => {
  console.error(`[Worker Error] ${err.message}`, err.stack);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// ── Module Exports ───────────────────────────────────────────
export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    console.log(`[Cron Trigger] Executing scheduled task at ${new Date().toISOString()}: ${event.cron}`);
  }
};
