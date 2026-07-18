import { Hono } from 'hono';
import { normalizeMediaUrls } from '../lib/media-normalizer.js';

export const nearmeRoutes = new Hono();

nearmeRoutes.get('/', async (c) => {
  const q = c.req.query();
  const mode = q.mode === 'near_me' ? 'near_me' : 'default';
  const province = normalizeProvinceText(q.provinceName || q.province || '');
  const category = q.category || '';
  const search = String(q.search || '').trim();
  const limit = clampLimit(q.limit, 40, 10, 80);
  const productLimit = clampLimit(q.productLimit, mode === 'near_me' ? 70 : 45, 10, 120);
  const postLimit = clampLimit(q.postLimit, mode === 'near_me' ? 20 : 35, 5, 80);

  try {
    let [products, posts] = await Promise.all([
      queryProducts(c.env.DB, { category, search, province: mode === 'near_me' ? province : '', limit: productLimit }),
      queryPosts(c.env.DB, { search, limit: postLimit }),
    ]);

    let fallback = false;
    if (mode === 'near_me' && province && products.length === 0) {
      products = await queryProducts(c.env.DB, { category, search, province: '', limit: productLimit });
      fallback = products.length > 0;
    }

    const rankedProducts = products
      .map((product) => productToNearMeItem(product, province))
      .sort((a, b) => b.buyScore - a.buyScore || Number(b.createdAt || 0) - Number(a.createdAt || 0));
    const rankedPosts = posts
      .map(postToNearMeItem)
      .sort((a, b) => b.buyScore - a.buyScore || Number(b.createdAt || 0) - Number(a.createdAt || 0));

    const items = interleaveNearMeItems(rankedProducts, rankedPosts, mode, limit);

    return c.json({
      status: 'success',
      items,
      products: rankedProducts.slice(0, limit),
      posts: rankedPosts.slice(0, limit),
      meta: {
        mode,
        province,
        fallback,
        productCount: rankedProducts.length,
        postCount: rankedPosts.length,
        ratio: mode === 'near_me' ? '5:1' : '2:1',
      },
    });
  } catch (err) {
    return c.json({
      status: 'error',
      error: { code: 'NEARME_ERROR', message: err.message || 'Unable to load Nearme feed' },
    }, 500);
  }
});

async function queryProducts(db, { category, search, province, limit }) {
  let sql = `
    SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
    FROM products p LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'active'
  `;
  const binds = [];

  if (category) {
    sql += ' AND p.category = ?';
    binds.push(category);
  }
  if (search) {
    const q = `%${String(search).trim()}%`;
    sql += ` AND (
      p.title LIKE ?
      OR COALESCE(p.description, '') LIKE ?
      OR COALESCE(p.category, '') LIKE ?
      OR COALESCE(p.seller_location, '') LIKE ?
    )`;
    binds.push(q, q, q, q);
  }

  sql += `
    ORDER BY
      CASE
        WHEN ? != '' AND COALESCE(p.seller_location, '') LIKE ? THEN 0
        WHEN COALESCE(p.seller_location, '') != '' THEN 1
        ELSE 2
      END,
      COALESCE(p.views_count, 0) DESC,
      p.created_at DESC
    LIMIT ?
  `;
  const provinceText = String(province || '').trim();
  binds.push(provinceText, `%${provinceText}%`, limit);

  const result = await db.prepare(sql).bind(...binds).all();
  return result.results || [];
}

async function queryPosts(db, { search, limit }) {
  let sql = `
    SELECT p.*, u.display_name as author_name, u.picture_url as author_picture
    FROM posts p LEFT JOIN users u ON p.user_id = u.id
    WHERE p.status = 'active'
      AND COALESCE(p.published, 1) = 1
  `;
  const binds = [];

  if (search) {
    const q = `%${String(search).trim()}%`;
    sql += ` AND (
      COALESCE(p.title, '') LIKE ?
      OR COALESCE(p.content, '') LIKE ?
      OR COALESCE(p.product_name, '') LIKE ?
      OR COALESCE(p.category, '') LIKE ?
    )`;
    binds.push(q, q, q, q);
  }

  sql += `
    ORDER BY
      COALESCE(p.pinned, 0) DESC,
      COALESCE(p.views_count, 0) DESC,
      COALESCE(p.likes_count, 0) DESC,
      p.created_at DESC
    LIMIT ?
  `;
  binds.push(limit);

  const result = await db.prepare(sql).bind(...binds).all();
  return result.results || [];
}

function clampLimit(value, fallback, min = 1, max = 100) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeProvinceText(value) {
  return String(value || '').replace(/^จ\.?\s*/i, '').trim();
}

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string') return [value].filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
  } catch {
    return [value].filter(Boolean);
  }
}

function normalizePostMedia(post) {
  const media = normalizeMediaUrls(post?.media_urls);
  const extras = normalizeMediaUrls([post?.youtube_url, post?.video_embed, post?.video_url].filter(Boolean));
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

function firstImageUrl(value) {
  for (const item of Array.isArray(value) ? value : parseJsonList(value)) {
    if (typeof item === 'object' && item?.type === 'youtube') continue;
    const url = typeof item === 'string' ? item : item?.thumbnailUrl || item?.url;
    if (typeof url === 'string' && url && !/youtube\.com|youtu\.be/i.test(url) && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url)) return url;
  }
  return '';
}

function hasVideo(post) {
  return normalizePostMedia(post).some((item) => item.type === 'video' || item.type === 'youtube');
}

function recencyScore(createdAt) {
  const t = Number(createdAt || 0);
  if (!t) return 0;
  const days = Math.max(0, (Date.now() - t) / 86400000);
  return Math.max(0, 30 - days);
}

function provinceMatches(location, province) {
  const loc = normalizeProvinceText(location).toLowerCase();
  const prov = normalizeProvinceText(province).toLowerCase();
  if (!loc || !prov) return false;
  return loc.includes(prov) || (prov.length > 3 && prov.includes(loc));
}

function productBuySignals(product, province) {
  const images = parseJsonList(product.images);
  const hasContact = Boolean(product.seller_phone || product.seller_line_id || product.seller_facebook);
  const hasLocation = Boolean(product.seller_location);
  const matchedProvince = provinceMatches(product.seller_location, province);
  const hasPrice = Number(product.price || 0) > 0;
  const hasStock = Number(product.product_stock || 0) > 0;
  const score =
    (matchedProvince ? 90 : 0) +
    (hasLocation ? 30 : 0) +
    (hasContact ? 35 : 0) +
    (hasPrice ? 25 : 0) +
    (images.length > 0 ? 20 : 0) +
    (hasStock ? 12 : 0) +
    (product.is_otop ? 8 : 0) +
    (product.is_organic ? 6 : 0) +
    (Math.log10(Number(product.views_count || 0) + 1) * 10) +
    recencyScore(product.created_at);

  const reasons = [];
  if (matchedProvince) reasons.push('พื้นที่ตรงกัน');
  else if (hasLocation) reasons.push('มีข้อมูลพื้นที่');
  if (hasContact) reasons.push('ติดต่อผู้ขายได้');
  if (hasPrice) reasons.push('มีราคา');
  if (images.length > 0) reasons.push('มีรูปสินค้า');
  if (hasStock) reasons.push('มีสต็อก');
  return { score, reasons };
}

function postInterestSignals(post) {
  const score =
    (post.pinned ? 25 : 0) +
    (hasVideo(post) ? 20 : 0) +
    (post.linked_product_id ? 24 : 0) +
    (post.product_name ? 12 : 0) +
    (Math.log10(Number(post.views_count || 0) + 1) * 8) +
    (Math.log10(Number(post.likes_count || 0) + 1) * 8) +
    (Math.log10(Number(post.comments_count || 0) + 1) * 5) +
    recencyScore(post.created_at);
  const reasons = [];
  if (post.linked_product_id || post.product_name) reasons.push('มีสินค้าเกี่ยวข้อง');
  if (hasVideo(post)) reasons.push('คอนเทนต์วิดีโอ');
  if (Number(post.views_count || 0) > 0) reasons.push('มีคนดู');
  return { score, reasons };
}

function productToNearMeItem(product, province) {
  const images = parseJsonList(product.images);
  const signals = productBuySignals(product, province);
  return {
    id: `product-${product.id}`,
    type: 'product',
    productId: product.id,
    title: product.title || product.productName || '',
    content: product.title || product.productName || '',
    description: product.description || '',
    price: Number(product.price || 0),
    images,
    thumbnailUrl: images[0] || '',
    videoUrl: product.video_url || '',
    authorName: product.seller_name || 'ผู้ขาย TukTuk',
    authorAvatar: product.seller_picture || '',
    sellerId: product.seller_id || '',
    sellerName: product.seller_name || '',
    sellerPhone: product.seller_phone || '',
    sellerLineId: product.seller_line_id || '',
    sellerFacebook: product.seller_facebook || '',
    sellerLocation: product.seller_location || '',
    productUnit: product.product_unit || '',
    productStock: Number(product.product_stock || 0),
    category: product.category || 'general',
    isOTOP: product.is_otop === 1,
    isOrganic: product.is_organic === 1,
    viewCount: Number(product.views_count || 0),
    createdAt: product.created_at,
    buyScore: Math.round(signals.score),
    nearmeReason: signals.reasons.slice(0, 3).join(' · '),
    ctaUrl: `/app/market?product=${encodeURIComponent(product.id)}`,
  };
}

function postToNearMeItem(post) {
  const media = normalizePostMedia(post);
  const primaryVideo = media.find((item) => item.type === 'youtube' || item.type === 'video');
  const signals = postInterestSignals(post);
  return {
    id: post.id,
    type: 'post',
    postId: post.id,
    title: post.title || '',
    content: post.title || post.content || post.product_name || 'TukTuk Feed',
    media,
    mediaUrls: media,
    thumbnailUrl: post.product_thumb || primaryVideo?.thumbnailUrl || firstImageUrl(media) || '',
    videoUrl: primaryVideo?.url || post.youtube_url || post.video_embed || '',
    videoEmbed: primaryVideo?.embedUrl || post.video_embed || '',
    youtubeId: primaryVideo?.youtubeId || '',
    playlistId: primaryVideo?.playlistId || '',
    authorName: post.author_name || post.display_name || 'TukTuk',
    authorAvatar: post.author_picture || '',
    likes: Number(post.likes_count || 0),
    commentsCount: Number(post.comments_count || 0),
    viewCount: Number(post.views_count || 0),
    linkedProductId: post.linked_product_id || '',
    productName: post.product_name || '',
    productPrice: Number(post.product_price || 0),
    productThumb: post.product_thumb || '',
    category: post.category || 'general',
    createdAt: post.created_at,
    buyScore: Math.round(signals.score),
    nearmeReason: signals.reasons.slice(0, 3).join(' · '),
    ctaUrl: post.linked_product_id ? `/app/market?product=${encodeURIComponent(post.linked_product_id)}` : '',
  };
}

function interleaveNearMeItems(products, posts, mode, limit) {
  const ratio = mode === 'near_me' ? 5 : 2;
  const items = [];
  let pi = 0;
  let fi = 0;
  while (items.length < limit && (pi < products.length || fi < posts.length)) {
    for (let i = 0; i < ratio && pi < products.length && items.length < limit; i++) {
      items.push(products[pi++]);
    }
    if (fi < posts.length && items.length < limit) items.push(posts[fi++]);
    if (pi >= products.length && fi < posts.length && items.length < limit) items.push(posts[fi++]);
  }
  return items.slice(0, limit);
}
