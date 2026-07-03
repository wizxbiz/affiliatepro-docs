/**
 * Marketplace API Handler — Cloudflare Workers
 * แทน Firebase Functions: marketplaceWebAPI.js + marketplace_functions.js
 *
 * Bindings required (wrangler.toml):
 *   DB      — D1 database
 *   STORAGE — R2 bucket
 *   SESSIONS — KV namespace
 */

import { Hono } from 'hono';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { DB } from '../lib/db.js';

export const marketplaceRoutes = new Hono();

// ── GET /api/marketplace/products ─────────────────────────────
// แทน marketplaceGetProducts Firebase function
marketplaceRoutes.get('/products', optionalAuth, async (c) => {
  const { category, limit = 20, offset = 0, search } = c.req.query();
  const db = new DB(c.env.DB);

  try {
    const products = await db.getProducts({ category, limit: +limit, offset: +offset, search });
    return c.json({ success: true, products });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /api/marketplace/products/:id ────────────────────────
// แทน marketplaceGetProduct Firebase function
marketplaceRoutes.get('/products/:id', async (c) => {
  const { id } = c.req.param();
  const db = new DB(c.env.DB);

  try {
    const product = await db.getProductById(id);
    if (!product) return c.json({ error: 'Product not found' }, 404);
    return c.json({ success: true, product });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/marketplace/products ────────────────────────────
// แทน marketplacePostProduct Firebase function
marketplaceRoutes.post('/products', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  const db = new DB(c.env.DB);

  try {
    const productId = crypto.randomUUID();
    await db.createProduct({
      id: productId,
      sellerId: session.uid,
      title: body.title,
      description: body.description,
      price: body.price,
      images: JSON.stringify(body.images || []),
      category: body.category || 'general',
      status: 'active',
      createdAt: Date.now(),
    });
    return c.json({ success: true, productId }, 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /api/marketplace/stats ────────────────────────────────
// แทน marketplaceGetStats Firebase function
marketplaceRoutes.get('/stats', async (c) => {
  const db = new DB(c.env.DB);
  try {
    const stats = await db.getMarketplaceStats();
    return c.json({ success: true, ...stats });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /api/marketplace/related/:id ─────────────────────────
// แทน marketplaceGetRelated Firebase function
marketplaceRoutes.get('/related/:id', async (c) => {
  const { id } = c.req.param();
  const db = new DB(c.env.DB);
  try {
    const related = await db.getRelatedProducts(id);
    return c.json({ success: true, products: related });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /api/marketplace/contact ────────────────────────────
// แทน marketplaceRecordContact Firebase function
marketplaceRoutes.post('/contact', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  const db = new DB(c.env.DB);
  try {
    await db.recordContact({
      id: crypto.randomUUID(),
      buyerId: session.uid,
      sellerId: body.sellerId,
      productId: body.productId,
      message: body.message,
      createdAt: Date.now(),
    });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /api/marketplace/share — OG Preview ──────────────────
// แทน marketplaceShare Firebase function
marketplaceRoutes.get('/share', async (c) => {
  const { id } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const product = id ? await db.getProductById(id) : null;
    const title   = product?.title   || 'TukTuk Marketplace';
    const desc    = product?.description || 'สินค้าและบริการบน TukTuk Thailand';
    const image   = product?.images ? JSON.parse(product.images)[0] : 'https://tuktukthailand.com/assets/images/tuktuk.png';

    return c.html(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${c.req.url}">
  <meta property="og:type" content="product">
  <meta http-equiv="refresh" content="0;url=/marketplace.html?id=${id || ''}">
</head>
<body><script>window.location="/marketplace.html?id=${id || ''}"</script></body>
</html>`);
  } catch (err) {
    return c.redirect('/marketplace.html', 302);
  }
});

// ── GET /api/marketplace/community-share ─────────────────────
// แทน communityShare Firebase function
marketplaceRoutes.get('/community-share', async (c) => {
  const { id } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const post  = id ? await db.getPostById(id) : null;
    const title = post?.content?.substring(0, 60) || 'TukTuk Community';
    const desc  = 'ชุมชน TukTuk Thailand — แบ่งปัน แลกเปลี่ยน';
    const image = 'https://tuktukthailand.com/assets/images/tuktuk.png';

    return c.html(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${c.req.url}">
  <meta http-equiv="refresh" content="0;url=/community.html?post=${id || ''}">
</head>
<body><script>window.location="/community.html?post=${id || ''}"</script></body>
</html>`);
  } catch (err) {
    return c.redirect('/community.html', 302);
  }
});

// ── POST /api/marketplace/ai-generate ────────────────────────
// แทน marketplaceAIGeneratePost Firebase function
marketplaceRoutes.post('/ai-generate', optionalAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));

  try {
    const data = await generateMarketplacePost(c.env, body);
    return c.json({
      success: true,
      data,
      generatedText: data.description || data.title || '',
      source: data.source,
    });
  } catch (err) {
    console.error('[Marketplace AI] generate error:', err);
    return c.json({
      success: true,
      data: fallbackMarketplacePost(body, 'fallback'),
      generatedText: fallbackMarketplacePost(body, 'fallback').description,
      warning: err.message,
    });
  }
});

function buildMarketplacePrompt(body) {
  const productName = body.productName || body.name || '';
  const price = body.price || body.suggestedPrice || '';
  const category = body.category || '';
  const additionalInfo = body.additionalInfo || body.description || '';
  const hasImage = Boolean(body.imageBase64);

  return [
    'คุณคือผู้ช่วยเขียนโพสต์ขายสินค้าใน TukTuk Marketplace',
    'ตอบเป็น JSON เท่านั้น ห้ามใส่ markdown',
    'schema: {"productName":"","title":"","description":"","suggestedPrice":"","category":"","hashtags":[""],"callToAction":""}',
    'เขียนภาษาไทย กระชับ น่าเชื่อถือ ไม่อ้างข้อมูลที่ไม่รู้จริง',
    hasImage ? 'ผู้ใช้แนบรูปสินค้า แต่ถ้าโมเดลไม่สามารถดูรูปได้ ให้สร้างข้อความกลางๆ และแนะนำให้ผู้ใช้เติมรายละเอียดเอง' : '',
    productName ? `ชื่อสินค้า: ${productName}` : '',
    price ? `ราคา: ${price}` : '',
    category ? `หมวดหมู่: ${category}` : '',
    additionalInfo ? `ข้อมูลเพิ่มเติม: ${additionalInfo}` : '',
  ].filter(Boolean).join('\n');
}

function normalizeAiText(text) {
  if (!text || typeof text !== 'string') return null;
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
}

function parseMarketplaceJson(text, body, source) {
  const cleaned = normalizeAiText(text);
  if (!cleaned) return null;

  try {
    const json = JSON.parse(cleaned);
    return {
      ...fallbackMarketplacePost(body, source),
      ...json,
      hashtags: Array.isArray(json.hashtags) ? json.hashtags.slice(0, 8) : fallbackMarketplacePost(body, source).hashtags,
      source,
    };
  } catch (_) {
    return {
      ...fallbackMarketplacePost(body, source),
      title: body.productName || 'โพสต์ขายสินค้า',
      description: cleaned.slice(0, 1800),
      source,
    };
  }
}

function fallbackMarketplacePost(body = {}, source = 'fallback') {
  const productName = body.productName || body.name || 'สินค้าพร้อมขาย';
  const priceText = body.price ? ` ราคา ${body.price} บาท` : '';
  const category = body.category || 'other';
  return {
    productName,
    title: `ขาย ${productName}`,
    description: `ขาย ${productName}${priceText}\nสินค้าอยู่ในสภาพพร้อมใช้งาน สนใจสอบถามรายละเอียดเพิ่มเติมได้ทางแชท`,
    suggestedPrice: body.price ? String(body.price) : '',
    category,
    hashtags: ['TukTukMarketplace', 'สินค้าพร้อมขาย', category].filter(Boolean),
    callToAction: 'สนใจทักแชทเพื่อสอบถามรายละเอียดเพิ่มเติมได้เลยครับ',
    source,
  };
}

async function generateMarketplacePost(env, body) {
  const prompt = buildMarketplacePrompt(body);

  const providers = [
    () => callWorkersAI(env, prompt),
    () => callForgeGateway(env, prompt),
    () => callMaxPlus(env, prompt),
    () => callGemini(env, prompt),
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result?.text) {
        const parsed = parseMarketplaceJson(result.text, body, result.source);
        if (parsed) return parsed;
      }
    } catch (err) {
      console.warn('[Marketplace AI] provider failed:', err.message);
    }
  }

  return fallbackMarketplacePost(body, 'fallback');
}

async function callWorkersAI(env, prompt) {
  if (!env.AI) return null;
  const result = await env.AI.run(env.WORKERS_AI_MODEL || '@cf/openai/gpt-oss-20b', {
    messages: [
      { role: 'system', content: 'You generate Thai marketplace listings. Return JSON only.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 900,
  });
  return { source: 'workers-ai', text: result?.response || result?.text || result?.content || '' };
}

async function callForgeGateway(env, prompt) {
  if (!env.FORGE_GATEWAY_TOKEN) return null;
  const baseUrl = (env.FORGE_GATEWAY_URL || 'https://api.forgework.app').replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.FORGE_GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
      'X-FORGE-Client': 'tuktukfeed-worker',
    },
    body: JSON.stringify({
      model: env.FORGE_GATEWAY_MODEL || env.MAXPLUS_MODEL || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: 'You generate Thai marketplace listings. Return JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 900,
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`Forge gateway ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const data = await response.json();
  return { source: 'forge-gateway', text: data?.choices?.[0]?.message?.content || data?.output_text || data?.response || '' };
}

async function callMaxPlus(env, prompt) {
  if (!env.MAXPLUS_API_KEY) return null;
  const response = await fetch('https://api.maxplus-ai.cc/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MAXPLUS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.MAXPLUS_MODEL || 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: 'You generate Thai marketplace listings. Return JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`MaxPlus ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const data = await response.json();
  return { source: 'maxplus', text: data?.choices?.[0]?.message?.content || '' };
}

async function callGemini(env, prompt) {
  if (!env.GEMINI_API_KEY) return null;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 240)}`);
  const data = await response.json();
  return { source: 'gemini', text: data?.candidates?.[0]?.content?.parts?.[0]?.text || '' };
}