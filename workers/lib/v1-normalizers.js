import { normalizeJsonResponse } from './api-response.js';

function parseJsonArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (_) {
    return value ? [value] : [];
  }
}

export function normalizeV1Product(product) {
  if (!product || typeof product !== 'object') return product;
  const images = parseJsonArray(product.images);
  const imageUrl = product.imageUrl || product.image_url || images[0] || '';
  const sellerId = product.sellerId || product.seller_id || product.lineUserId || '';

  return {
    id: product.id,
    productName: product.productName || product.title || product.product_name || '',
    title: product.title || product.productName || product.product_name || '',
    description: product.description || '',
    price: Number(product.price || 0),
    imageUrl,
    additionalImages: product.additionalImages || images.slice(1),
    images: images.length > 0 ? images : [imageUrl].filter(Boolean),
    sellerId,
    lineUserId: product.lineUserId || sellerId,
    sellerName: product.sellerName || product.seller_name || 'Seller',
    sellerPictureUrl: product.sellerPictureUrl || product.seller_picture || product.picture_url || '',
    sellerPhone: product.sellerPhone || product.seller_phone || '',
    sellerLineId: product.sellerLineId || product.seller_line_id || '',
    sellerFacebook: product.sellerFacebook || product.seller_facebook || '',
    sellerLocation: product.sellerLocation || product.seller_location || product.province || '',
    province: product.province || product.sellerLocation || product.seller_location || '',
    provinceCode: product.provinceCode || product.province_code || '',
    category: product.category || 'general',
    productUnit: product.productUnit || product.product_unit || '',
    productStock: Number(product.productStock || product.product_stock || 0),
    isOtop: Boolean(product.isOtop || product.isOTOP || product.is_otop),
    isOrganic: Boolean(product.isOrganic || product.is_organic),
    videoUrl: product.videoUrl || product.video_url || '',
    status: product.status || 'active',
    viewCount: Number(product.viewCount || product.views_count || 0),
    buyScore: Number(product.buyScore || product.buy_score || 0),
    nearmeReason: product.nearmeReason || product.nearme_reason || '',
    createdAt: product.createdAt || product.created_at || null,
    updatedAt: product.updatedAt || product.updated_at || null,
  };
}

export async function normalizeV1ProductResponse(c, response) {
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) return response;

  const data = await response.json().catch(() => null);
  if (response.status >= 400) {
    return normalizeJsonResponse(c, new Response(JSON.stringify(data || {}), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  const status = data?.status || (data?.success === true ? 'success' : 'success');
  if (Array.isArray(data?.products)) {
    return c.json({
      status,
      products: data.products.map(normalizeV1Product),
      total: data.total ?? data.products.length,
      meta: data.meta,
    }, response.status);
  }

  if (data?.product) {
    return c.json({
      status,
      product: normalizeV1Product(data.product),
    }, response.status);
  }

  if (data?.productId) return c.json({ status, productId: data.productId }, response.status);
  return c.json({ status, ...data }, response.status);
}