/**
 * Marketplace API Handler โ€” Cloudflare Workers
 * เนเธ—เธ Firebase Functions: marketplaceWebAPI.js + marketplace_functions.js
 *
 * Bindings required (wrangler.toml):
 *   DB      โ€” D1 database
 *   STORAGE โ€” R2 bucket
 *   SESSIONS โ€” KV namespace
 */

import { Hono } from 'hono';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { DB } from '../lib/db.js';

export const marketplaceRoutes = new Hono();

// [SECURITY FIX H-4] HTML escape helper for OG preview template injection
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// โ”€โ”€ GET /api/marketplace/products โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ marketplaceGetProducts Firebase function
marketplaceRoutes.get('/products', optionalAuth, async (c) => {
  const { category, limit = 20, offset = 0, search, province } = c.req.query();
  const db = new DB(c.env.DB);

  try {
    const products = await db.getProducts({ category, limit: +limit, offset: +offset, search, province });
    return c.json({ success: true, products });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// โ”€โ”€ GET /api/marketplace/products/:id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ marketplaceGetProduct Firebase function
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

// โ”€โ”€ POST /api/marketplace/products โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ marketplacePostProduct Firebase function
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
      sellerPhone: body.sellerPhone || '',
      sellerLineId: body.sellerLineId || '',
      sellerFacebook: body.sellerFacebook || '',
      sellerLocation: body.sellerLocation || body.province || '',
      productUnit: body.productUnit || '',
      productStock: Number(body.productStock || 0),
      isOTOP: Boolean(body.isOTOP || body.isOtop),
      isOrganic: Boolean(body.isOrganic),
      videoUrl: body.videoUrl || '',
      createdAt: Date.now(),
    });
    return c.json({ success: true, productId }, 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// โ”€โ”€ GET /api/marketplace/stats โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ marketplaceGetStats Firebase function
marketplaceRoutes.get('/stats', async (c) => {
  const db = new DB(c.env.DB);
  try {
    const stats = await db.getMarketplaceStats();
    return c.json({ success: true, ...stats });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// โ”€โ”€ GET /api/marketplace/related/:id โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ marketplaceGetRelated Firebase function
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

// โ”€โ”€ POST /api/marketplace/contact โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ marketplaceRecordContact Firebase function
// ── POST /api/marketplace/contact ─────────────────────────
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

// ── POST /api/marketplace/external-product ────────────────
// Replacement for legacy fetchExternalProduct Cloud Function.
marketplaceRoutes.post('/external-product', optionalAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { url, platform = 'web' } = body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return c.json({ success: false, message: 'Invalid product URL' }, 400);
  }

  try {
    const product = await fetchExternalProductMetadata(url, platform);
    return c.json({
      success: true,
      product,
      source: product.source || 'worker_metadata',
    });
  } catch (err) {
    console.error('[Marketplace] external product fetch error:', err);
    return c.json({
      success: false,
      message: err.message || 'Unable to fetch product data',
    }, 502);
  }
});

// ── GET /api/marketplace/share — OG Preview ──────────────────
// แทน marketplaceShare Firebase function
marketplaceRoutes.get('/share', async (c) => {
  const { id } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const product = id ? await db.getProductById(id) : null;
    // [SECURITY FIX H-4] Escape all user-derived values before HTML injection
    const title   = escapeHtml(product?.title   || 'TukTuk Marketplace');
    const desc    = escapeHtml(product?.description || 'สินค้าและบริการใน TukTuk Thailand');
    const image   = escapeHtml(product?.images ? JSON.parse(product.images)[0] : 'https://tuktukthailand.com/assets/images/tuktuk.png');
    // encodeURIComponent prevents injection into URL redirect
    const safeId  = encodeURIComponent(id || '');

    return c.html(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${escapeHtml(c.req.url)}">
  <meta property="og:type" content="product">
  <meta http-equiv="refresh" content="0;url=/marketplace.html?id=${safeId}">
</head>
<body><script>window.location="/marketplace.html?id=${safeId}"<\/script></body>
</html>`);
  } catch (err) {
    return c.redirect('/marketplace.html', 302);
  }
});

// โ”€โ”€ GET /api/marketplace/community-share โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ communityShare Firebase function
marketplaceRoutes.get('/community-share', async (c) => {
  const { id } = c.req.query();
  const db = new DB(c.env.DB);
  try {
    const post  = id ? await db.getPostById(id) : null;
    const title = escapeHtml(post?.content?.replace(/<[^>]*>/g, '').substring(0, 60) || 'TukTuk Community');
    const desc  = escapeHtml('ชุมชน TukTuk Thailand');
    const image = escapeHtml('https://tuktukthailand.com/assets/images/tuktuk.png');
    const safeId = encodeURIComponent(id || '');

    return c.html(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${escapeHtml(c.req.url)}">
  <meta http-equiv="refresh" content="0;url=/community.html?post=${safeId}">
</head>
<body><script>window.location="/community.html?post=${safeId}"<\/script></body>
</html>`);
  } catch (err) {
    return c.redirect('/community.html', 302);
  }
});

// โ”€โ”€ POST /api/marketplace/ai-generate โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// เนเธ—เธ marketplaceAIGeneratePost Firebase function
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

// โ”€โ”€ POST /api/marketplace/ai-assist โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
marketplaceRoutes.post('/ai-assist', optionalAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { mode, title = '', content = '', category = '' } = body;

  if (!content && !title) {
    return c.json({ success: false, error: 'เธเธฃเธธเธ“เธฒเนเธชเนเธซเธฑเธงเธเนเธญเธซเธฃเธทเธญเน€เธเธทเนเธญเธซเธฒ' }, 400);
  }

  try {
    const prompt = buildContentAssistPrompt(body);
    const providers = [
      () => callWorkersAI(c.env, prompt),
      () => callForgeGateway(c.env, prompt),
      () => callMaxPlus(c.env, prompt),
      () => callGemini(c.env, prompt),
    ];

    let aiResult = null;
    for (const provider of providers) {
      try {
        const result = await provider();
        if (result?.text) {
          const parsed = parseContentAssistJson(result.text, mode, title, content);
          if (parsed) {
            aiResult = parsed;
            break;
          }
        }
      } catch (err) {
        console.warn('[AI Assist] provider failed:', err.message);
      }
    }

    if (!aiResult) {
      return c.json({
        success: true,
        title,
        content: content + '\n\n(เธเธนเนเธเนเธงเธข AI เนเธกเนเธ•เธญเธเธชเธเธญเธเนเธเธเธ“เธฐเธเธตเน เนเธเธฃเธ”เน€เธเธตเธขเธเน€เธเธทเนเธญเธซเธฒเธ”เนเธงเธขเธ•เธฑเธงเน€เธญเธเธเธฃเธฑเธ)',
      });
    }

    return c.json(aiResult);
  } catch (err) {
    console.error('[AI Assist] error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

function buildContentAssistPrompt(body) {
  const { mode, title, content, category } = body;
  
  const categoryName = {
    news: "๐“ฐ เธเนเธฒเธงเธชเธฒเธฃ",
    update: "๐” เธญเธฑเธเน€เธ”เธ•",
    tip: "๐’ก เน€เธเธฅเนเธ”เธฅเธฑเธ",
    event: "๐“… เธเธดเธเธเธฃเธฃเธก",
    promo: "๐ท๏ธ เนเธเธฃเนเธกเธเธฑเนเธ"
  }[category] || "เธ—เธฑเนเธงเนเธ";

  const inputText = title ? `เธซเธฑเธงเธเนเธญ: ${title}\n\n${content}` : content;

  const prompts = {
    summarize: `เธเธธเธ“เน€เธเนเธเธเธฑเธเน€เธเธตเธขเธเธกเธทเธญเธญเธฒเธเธตเธ เธเนเธงเธขเธชเธฃเธธเธเน€เธเธทเนเธญเธซเธฒเธ•เนเธญเนเธเธเธตเนเนเธซเนเธเธฃเธฐเธเธฑเธ เธเธฑเธ”เน€เธเธ เนเธฅเธฐเธเนเธฒเธชเธเนเธ เธฃเธฑเธเธฉเธฒเนเธเธเธงเธฒเธกเธชเธณเธเธฑเธเนเธงเน\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเธชเธฃเธธเธเนเธฅเนเธง (เธชเธฑเนเธเธเธฃเธฐเธเธฑเธ)", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเธชเธฃเธธเธเนเธฅเนเธง (เนเธกเนเน€เธเธดเธ 200 เธเธณ)"}`,
    expand: `เธเธธเธ“เน€เธเนเธเธเธฑเธเน€เธเธตเธขเธเธกเธทเธญเธญเธฒเธเธตเธ เธเนเธงเธขเธเธขเธฒเธขเธเธงเธฒเธกเน€เธเธทเนเธญเธซเธฒเธ•เนเธญเนเธเธเธตเนเนเธซเนเธฅเธฐเน€เธญเธตเธขเธ”เธเธถเนเธ เธกเธตเธ•เธฑเธงเธญเธขเนเธฒเธ เธกเธตเธเนเธญเธกเธนเธฅเน€เธเธดเนเธกเน€เธ•เธดเธก เนเธฅเธฐเธญเนเธฒเธเธเนเธฒเธชเธเนเธ\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเธเธฃเธฑเธเธเธฃเธธเธเนเธฅเนเธง", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเธเธขเธฒเธขเธเธงเธฒเธกเนเธฅเนเธง (เธญเธขเนเธฒเธเธเนเธญเธข 300 เธเธณ) เธกเธตเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ” เธ•เธฑเธงเธญเธขเนเธฒเธ เนเธฅเธฐเธเนเธญเธกเธนเธฅเน€เธเธดเนเธกเน€เธ•เธดเธก"}`,
    engaging: `เธเธธเธ“เน€เธเนเธเธเธฑเธเธเธฒเธฃเธ•เธฅเธฒเธ”เธ”เธดเธเธดเธ—เธฑเธฅเธกเธทเธญเธญเธฒเธเธตเธ เธเนเธงเธขเน€เธเธตเธขเธเน€เธเธทเนเธญเธซเธฒเนเธซเนเธเนเธฒเธชเธเนเธ เธ”เธถเธเธ”เธนเธ”เธเธนเนเธญเนเธฒเธ เธกเธต Call to Action เธ—เธตเนเธเธฑเธ”เน€เธเธ\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเธ”เธถเธเธ”เธนเธ”เธเธงเธฒเธกเธชเธเนเธ (เธกเธต Emoji)", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเธเนเธฒเธชเธเนเธ เนเธเนเธ เธฒเธฉเธฒเธ—เธตเนเธเธฃเธฐเธ•เธธเนเธเธญเธฒเธฃเธกเธ“เน เธกเธต emoji เนเธฅเธฐ Call to Action"}`,
    professional: `เธเธธเธ“เน€เธเนเธเธเธฑเธเน€เธเธตเธขเธเธเธธเธฃเธเธดเธเธกเธทเธญเธญเธฒเธเธตเธ เธเนเธงเธขเน€เธเธตเธขเธเน€เธเธทเนเธญเธซเธฒเนเธเนเธ—เธเธ—เธตเนเน€เธเนเธเธ—เธฒเธเธเธฒเธฃ เธเนเธฒเน€เธเธทเนเธญเธ–เธทเธญ เน€เธซเธกเธฒเธฐเธเธฑเธเธญเธเธเนเธเธฃ\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเน€เธเนเธเธกเธทเธญเธญเธฒเธเธตเธ", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเน€เธเธตเธขเธเธญเธขเนเธฒเธเน€เธเนเธเธ—เธฒเธเธเธฒเธฃ เธเธฑเธ”เน€เธเธ เธเนเธฒเน€เธเธทเนเธญเธ–เธทเธญ"}`,
    friendly: `เธเธธเธ“เน€เธเนเธเธเธเน€เธเธตเธขเธ Social Media เธ—เธตเนเธกเธตเธเธงเธฒเธกเน€เธเนเธเธเธฑเธเน€เธญเธ เธเนเธงเธขเน€เธเธตเธขเธเน€เธเธทเนเธญเธซเธฒเนเธซเนเน€เธเนเธเธกเธดเธ•เธฃ เธญเนเธฒเธเธเนเธฒเธข เธฃเธนเนเธชเธถเธเน€เธซเธกเธทเธญเธเธเธธเธขเธเธฑเธเน€เธเธทเนเธญเธ\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเน€เธเนเธเธเธฑเธเน€เธญเธ (เธกเธต Emoji)", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเน€เธเนเธเธเธฑเธเน€เธญเธ เธญเนเธฒเธเธเนเธฒเธข เธกเธต emoji เน€เธซเธกเธฒเธฐเธชเธก"}`,
    check: `เธเธธเธ“เน€เธเนเธเธเธฃเธฃเธ“เธฒเธเธดเธเธฒเธฃเธกเธทเธญเธญเธฒเธเธตเธ เธเนเธงเธขเน€เธฃเธตเธขเธเน€เธฃเธตเธขเธเน€เธเธทเนเธญเธซเธฒเธ•เนเธญเนเธเธเธตเนเนเธซเธกเนเนเธซเนเธญเนเธฒเธเธเนเธฒเธข เธ–เธนเธเธซเธฅเธฑเธเนเธงเธขเธฒเธเธฃเธ“เน เนเธฅเธฐเธชเธฅเธฐเธชเธฅเธงเธข\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเธเธฃเธฑเธเนเธเนเนเธฅเนเธง", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเน€เธฃเธตเธขเธเน€เธฃเธตเธขเธเนเธซเธกเน เธ–เธนเธเธซเธฅเธฑเธเธ เธฒเธฉเธฒ เธญเนเธฒเธเธเนเธฒเธข"}`,
    seo: `เธเธธเธ“เน€เธเนเธเธเธนเนเน€เธเธตเนเธขเธงเธเธฒเธ SEO เนเธฅเธฐ Social Media Marketing เธเนเธงเธขเธเธฃเธฑเธเธเธฃเธธเธเน€เธเธทเนเธญเธซเธฒเธ•เนเธญเนเธเธเธตเนเนเธซเนเธกเธต:\n1. Hashtag เธ—เธตเนเน€เธเธตเนเธขเธงเธเนเธญเธ (5-10 hashtag)\n2. Keywords เธ—เธตเนเธเนเธงเธขเนเธซเนเธเนเธเธซเธฒเน€เธเธญ\n3. เนเธเธฃเธเธชเธฃเนเธฒเธเธ—เธตเนเน€เธซเธกเธฒเธฐเธเธฑเธเธเธฒเธฃเนเธเธฃเนเธเธ Social Media\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเธกเธต Keywords (เนเธกเนเธกเธต Hashtag เนเธเธซเธฑเธงเธเนเธญ)", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเธเธฃเธฑเธเธเธฃเธธเธเนเธฅเนเธง\\n\\n#Hashtag1 #Hashtag2 #Hashtag3 ... (5-10 hashtags เธ—เนเธฒเธขเนเธเธชเธ•เน)"}`,
    emoji: `เธเธธเธ“เน€เธเนเธเธเธนเนเน€เธเธตเนเธขเธงเธเธฒเธ Social Media เธเนเธงเธขเน€เธเธดเนเธก Emoji เนเธซเนเน€เธเธทเนเธญเธซเธฒเธ•เนเธญเนเธเธเธตเนเนเธซเนเธ”เธนเธชเธ”เนเธช เธเนเธฒเธญเนเธฒเธ เนเธฅเธฐเธ”เธถเธเธ”เธนเธ”เนเธ เนเธ”เธขเนเธเน Emoji เธ—เธตเนเน€เธซเธกเธฒเธฐเธชเธกเธเธฑเธเธเธฃเธดเธเธ—\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธเธฃเนเธญเธก Emoji เธ—เธตเนเน€เธซเธกเธฒเธฐเธชเธก", "content": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเน€เธเธดเนเธก emoji เนเธซเนเธชเธ”เนเธช เธเนเธฒเธญเนเธฒเธ (เนเธเน emoji เธเธญเธชเธกเธเธงเธฃ เนเธกเนเธกเธฒเธเน€เธเธดเธเนเธ)"}`,
    headline: `เธเธธเธ“เน€เธเนเธเธเธฃเธฃเธ“เธฒเธเธดเธเธฒเธฃเธเนเธฒเธงเธกเธทเธญเธญเธฒเธเธตเธ เธเนเธงเธขเธชเธฃเนเธฒเธเธซเธฑเธงเธเนเธญเธ—เธตเนเธเนเธฒเธชเธเนเธ เธ”เธถเธเธ”เธนเธ”เธเธฅเธดเธ เธชเธณเธซเธฃเธฑเธเน€เธเธทเนเธญเธซเธฒเธ•เนเธญเนเธเธเธตเน\nเนเธซเนเน€เธชเธเธญ 3-5 เธซเธฑเธงเธเนเธญเธ—เธฒเธเน€เธฅเธทเธญเธ\n\nเธซเธกเธงเธ”เธซเธกเธนเน: ${categoryName}\n\nเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธก:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON:\n{"title": "เธซเธฑเธงเธเนเธญเธ—เธตเนเธ”เธตเธ—เธตเนเธชเธธเธ” (เน€เธฅเธทเธญเธ 1 เธเนเธญ)", "content": "เธซเธฑเธงเธเนเธญเธ—เธฒเธเน€เธฅเธทเธญเธ:\\n\\n1. [เธซเธฑเธงเธเนเธญ 1]\\n2. [เธซเธฑเธงเธเนเธญ 2]\\n3. [เธซเธฑเธงเธเนเธญ 3]\\n\\n---\\n\\n[เน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธกเธ—เธตเนเนเธเนเนเธเน€เธฅเนเธเธเนเธญเธข]"}`,
    moderate: `เธเธธเธ“เน€เธเนเธเธเธนเนเน€เธเธตเนเธขเธงเธเธฒเธเธ”เนเธฒเธเธเธฒเธฃเธ•เธฃเธงเธเธชเธญเธเน€เธเธทเนเธญเธซเธฒ (Content Moderator) เธเธญเธเธชเธฑเธเธเธกเธญเธญเธเนเธฅเธเนเนเธ—เธข\nเธเนเธงเธขเธ•เธฃเธงเธเธชเธญเธเน€เธเธทเนเธญเธซเธฒเธ•เนเธญเนเธเธเธตเนเธงเนเธฒเธกเธตเธชเธดเนเธเธ•เนเธญเนเธเธเธตเนเธซเธฃเธทเธญเนเธกเน:\n1. เธเธณเธซเธขเธฒเธเธเธฒเธข เธซเธฃเธทเธญเธ เธฒเธฉเธฒเธ—เธตเนเนเธกเนเน€เธซเธกเธฒเธฐเธชเธก\n2. เธเธฒเธฃเธเธธเธเธเธฒเธก เธเธฅเธฑเนเธเนเธเธฅเนเธ เธซเธฃเธทเธญเธชเธฃเนเธฒเธเธเธงเธฒเธกเน€เธเธฅเธตเธขเธ”เธเธฑเธ (Hate Speech)\n3. เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเธเธดเธ”เธเธเธซเธกเธฒเธข เธซเธฃเธทเธญเธชเนเธเน€เธชเธฃเธดเธกเธเธงเธฒเธกเธฃเธธเธเนเธฃเธ\n4. เธเนเธญเธกเธนเธฅเน€เธ—เนเธเธ—เธตเนเธกเธตเธญเธฑเธเธ•เธฃเธฒเธข\n\nเน€เธเธทเนเธญเธซเธฒเธ—เธตเนเธเธฐเธ•เธฃเธงเธเธชเธญเธ:\n${inputText}\n\nเธ•เธญเธเนเธเธฃเธนเธเนเธเธ JSON เน€เธ—เนเธฒเธเธฑเนเธ:\n{\n  "isSafe": true,\n  "reason": "เธชเธฃเธธเธเน€เธซเธ•เธธเธเธฅเธชเธฑเนเธเน เธ–เนเธฒเนเธกเนเธเธฅเธญเธ”เธ เธฑเธข (เธ เธฒเธฉเธฒเนเธ—เธข)",\n  "cleanedContent": "เน€เธเธทเนเธญเธซเธฒเธ—เธตเนเน€เธเนเธเน€เธเธญเธฃเนเธเธณเธซเธขเธฒเธเนเธฅเนเธง (เธ–เนเธฒเธกเธต) เธซเธฃเธทเธญเน€เธเธทเนเธญเธซเธฒเน€เธ”เธดเธกเธ—เธตเนเธเธฃเธฑเธเธเธฃเธธเธเนเธซเนเธชเธธเธ เธฒเธเธเธถเนเธ"\n}`
  };

  return prompts[mode] || prompts.engaging;
}

function parseContentAssistJson(text, mode, defaultTitle, defaultContent) {
  const cleaned = normalizeAiText(text);
  if (!cleaned) return null;

  try {
    const json = JSON.parse(cleaned);
    
    const responseData = {
      success: true,
      title: json.title || defaultTitle,
      content: json.content || defaultContent
    };
    
    if (mode === 'moderate') {
      responseData.isSafe = json.isSafe !== undefined ? json.isSafe : true;
      responseData.reason = json.reason || '';
      if (json.cleanedContent) {
        responseData.content = json.cleanedContent;
      }
    }
    
    return responseData;
  } catch (_) {
    return {
      success: true,
      title: defaultTitle,
      content: cleaned
    };
  }
}

function buildMarketplacePrompt(body) {
  const productName = body.productName || body.name || '';
  const price = body.price || body.suggestedPrice || '';
  const category = body.category || '';
  const additionalInfo = body.additionalInfo || body.description || '';
  const hasImage = Boolean(body.imageBase64);

  return [
    'เธเธธเธ“เธเธทเธญเธเธนเนเธเนเธงเธขเน€เธเธตเธขเธเนเธเธชเธ•เนเธเธฒเธขเธชเธดเธเธเนเธฒเนเธ TukTuk Marketplace',
    'เธ•เธญเธเน€เธเนเธ JSON เน€เธ—เนเธฒเธเธฑเนเธ เธซเนเธฒเธกเนเธชเน markdown',
    'schema: {"productName":"","title":"","description":"","suggestedPrice":"","category":"","hashtags":[""],"callToAction":""}',
    'เน€เธเธตเธขเธเธ เธฒเธฉเธฒเนเธ—เธข เธเธฃเธฐเธเธฑเธ เธเนเธฒเน€เธเธทเนเธญเธ–เธทเธญ เนเธกเนเธญเนเธฒเธเธเนเธญเธกเธนเธฅเธ—เธตเนเนเธกเนเธฃเธนเนเธเธฃเธดเธ',
    hasImage ? 'เธเธนเนเนเธเนเนเธเธเธฃเธนเธเธชเธดเธเธเนเธฒ เนเธ•เนเธ–เนเธฒเนเธกเน€เธ”เธฅเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธนเธฃเธนเธเนเธ”เน เนเธซเนเธชเธฃเนเธฒเธเธเนเธญเธเธงเธฒเธกเธเธฅเธฒเธเน เนเธฅเธฐเนเธเธฐเธเธณเนเธซเนเธเธนเนเนเธเนเน€เธ•เธดเธกเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธญเธ' : '',
    productName ? `เธเธทเนเธญเธชเธดเธเธเนเธฒ: ${productName}` : '',
    price ? `เธฃเธฒเธเธฒ: ${price}` : '',
    category ? `เธซเธกเธงเธ”เธซเธกเธนเน: ${category}` : '',
    additionalInfo ? `เธเนเธญเธกเธนเธฅเน€เธเธดเนเธกเน€เธ•เธดเธก: ${additionalInfo}` : '',
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
      title: body.productName || 'เนเธเธชเธ•เนเธเธฒเธขเธชเธดเธเธเนเธฒ',
      description: cleaned.slice(0, 1800),
      source,
    };
  }
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickMeta(html, names = []) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return '';
}

function pickTitle(html) {
  const metaTitle = pickMeta(html, ['og:title', 'twitter:title', 'title']);
  if (metaTitle) return metaTitle;
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1]) : '';
}

function getJsonLdProducts(html) {
  const products = [];
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRe.exec(html)) !== null) {
    const raw = decodeHtml(match[1]).trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== 'object') continue;
        if (Array.isArray(item)) {
          queue.push(...item);
          continue;
        }
        if (item['@graph']) queue.push(...item['@graph']);
        const type = Array.isArray(item['@type']) ? item['@type'].join(',') : item['@type'];
        if (String(type || '').toLowerCase().includes('product')) products.push(item);
      }
    } catch (_) {
      // Ignore malformed vendor JSON-LD.
    }
  }

  return products;
}

function normalizeImage(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return normalizeImage(image[0]);
  if (typeof image === 'object') return image.url || image.contentUrl || '';
  return '';
}

function normalizePrice(offers) {
  if (!offers) return 0;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  const raw = offer?.price || offer?.lowPrice || offer?.highPrice || '';
  const parsed = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function fallbackNameFromUrl(productUrl) {
  try {
    const url = new URL(productUrl);
    const slug = url.pathname.split('/').filter(Boolean).pop() || url.hostname;
    return decodeURIComponent(slug).replace(/[-_]+/g, ' ').slice(0, 120);
  } catch (_) {
    return 'เธชเธดเธเธเนเธฒเธเธณเน€เธเนเธฒ';
  }
}

async function fetchExternalProductMetadata(productUrl, platform) {
  const response = await fetch(productUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TukTukFeedBot/1.0; +https://tuktukfeed.com)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    cf: { cacheTtl: 120, cacheEverything: false },
  });

  if (!response.ok) {
    throw new Error(`Source returned HTTP ${response.status}`);
  }

  const html = await response.text();
  const product = getJsonLdProducts(html)[0] || {};
  const title = decodeHtml(product.name || pickTitle(html) || fallbackNameFromUrl(productUrl));
  const description = decodeHtml(product.description || pickMeta(html, ['og:description', 'twitter:description', 'description']));
  const imageUrl = normalizeImage(product.image) || pickMeta(html, ['og:image', 'twitter:image']);
  const price = normalizePrice(product.offers) || normalizePrice({ price: pickMeta(html, ['product:price:amount', 'og:price:amount']) });

  return {
    productName: title || 'เธชเธดเธเธเนเธฒเธเธณเน€เธเนเธฒ',
    name: title || 'เธชเธดเธเธเนเธฒเธเธณเน€เธเนเธฒ',
    description: description || `เธเธณเน€เธเนเธฒเธเนเธญเธกเธนเธฅเธเธฒเธ ${platform}`,
    imageUrl,
    price,
    sourceUrl: productUrl,
    platform,
    source: 'worker_metadata',
  };
}

function fallbackMarketplacePost(body = {}, source = 'fallback') {
  const productName = body.productName || body.name || 'เธชเธดเธเธเนเธฒเธเธฃเนเธญเธกเธเธฒเธข';
  const priceText = body.price ? ` เธฃเธฒเธเธฒ ${body.price} เธเธฒเธ—` : '';
  const category = body.category || 'other';
  return {
    productName,
    title: `เธเธฒเธข ${productName}`,
    description: `เธเธฒเธข ${productName}${priceText}\nเธชเธดเธเธเนเธฒเธญเธขเธนเนเนเธเธชเธ เธฒเธเธเธฃเนเธญเธกเนเธเนเธเธฒเธ เธชเธเนเธเธชเธญเธเธ–เธฒเธกเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธกเนเธ”เนเธ—เธฒเธเนเธเธ—`,
    suggestedPrice: body.price ? String(body.price) : '',
    category,
    hashtags: ['TukTukMarketplace', 'เธชเธดเธเธเนเธฒเธเธฃเนเธญเธกเธเธฒเธข', category].filter(Boolean),
    callToAction: 'เธชเธเนเธเธ—เธฑเธเนเธเธ—เน€เธเธทเนเธญเธชเธญเธเธ–เธฒเธกเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธกเนเธ”เนเน€เธฅเธขเธเธฃเธฑเธ',
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