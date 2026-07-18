import { storage } from '../lib/storage.js'

// REST client สำหรับ /api/v1/* — same-origin เสมอ (Pages _worker.js proxy ไป Worker ให้)
const BASE = '/api/v1'
const SESSION_KEYS = ['wizmobiz_session', 'tuktuk_line_session', 'wit_line_session']

const TIMEOUT_MS = 8000

// อ่าน token ให้เข้ากันได้กับ session เดิมของเว็บเก่า (wizmobiz/tuktuk_line/wit_line)
export function getToken() {
  const direct = storage.get('tuktuk_jwt') || storage.get('tuktuk_token')
  if (direct) return direct
  for (const key of SESSION_KEYS) {
    const s = storage.getJSON(key)
    if (s?.token) return s.token
    if (s?.sessionToken) return s.sessionToken
  }
  return null
}

export function saveSession({ token, user }) {
  const session = { ...user, token, sessionToken: token, savedAt: Date.now() }
  storage.set('tuktuk_jwt', token)
  storage.set('tuktuk_token', token)
  // เขียน key เดิมด้วยเพื่อให้หน้าเว็บเก่า (iframe SPA) เห็น session เดียวกัน
  storage.setJSON('wizmobiz_session', session)
  storage.setJSON('tuktuk_line_session', session)
  return session
}

export function clearSession() {
  storage.remove('tuktuk_jwt')
  storage.remove('wizmobiz_session')
  storage.remove('tuktuk_token')
  storage.remove('tuktuk_line_session')
  storage.remove('wit_line_session')
}

export function getSavedUser() {
  for (const key of SESSION_KEYS) {
    const session = storage.getJSON(key)
    if (session?.uid || session?.lineUserId || session?.token || session?.sessionToken) {
      const uid = session.uid || session.lineUserId
      return { ...session, uid, lineUserId: session.lineUserId || uid }
    }
  }
  return null
}

async function request(path, { method = 'GET', params = {}, body, timeoutMs = TIMEOUT_MS } = {}) {
  const url = new URL(BASE + path, window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })

  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.status === 'error') {
      const err = new Error(data.error?.message || data.message || data.error || `HTTP ${res.status}`)
      err.httpStatus = res.status
      throw err
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  feed: {
    list: ({ userId = 'guest', province = '', mode = 'default', limit = 20 } = {}) =>
      request('/feed', { params: { userId, province, mode, limit } }),
  },
  nearme: {
    list: ({ mode = 'default', province = '', provinceName = '', category = '', search = '', limit = 36 } = {}) =>
      request('/nearme', { params: { mode, province, provinceName, category, search, limit }, timeoutMs: 10000 }),
  },
  products: {
    list: ({ province = '', category = '', search = '', limit = 30, offset = 0 } = {}) =>
      request('/products', { params: { province, category, search, limit, offset } }),
    get: (id) => request(`/products/${id}`),
    create: (product) => request('/products', { method: 'POST', body: product }),
    update: (id, fields) => request(`/products/${id}`, { method: 'PUT', body: fields }),
    remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
    view: (id) => request(`/products/${id}/view`, { method: 'POST' }),
  },
  posts: {
    list: ({ category = '', limit = 20, offset = 0 } = {}) =>
      request('/posts', { params: { category, limit, offset } }),
    get: (postId) => request(`/posts/${postId}`),
    create: ({ content, mediaUrls, category, youtubeUrl = '', videoEmbed = '', videoUrl = '' }) =>
      request('/posts', { method: 'POST', body: { content, mediaUrls, category, youtubeUrl, videoEmbed, videoUrl } }),
    like: (postId) =>
      request(`/posts/${postId}/like`, { method: 'POST' }),
    view: (postId) =>
      request(`/posts/${postId}/view`, { method: 'POST' }),
    comments: (postId, { limit = 20, cursor } = {}) =>
      request(`/posts/${postId}/comments`, { params: { limit, ...(cursor ? { cursor } : {}) } }),
    addComment: (postId, content) =>
      request(`/posts/${postId}/comments`, { method: 'POST', body: { content } }),
    update: (postId, { content, category }) =>
      request(`/posts/${postId}`, { method: 'PUT', body: { content, category } }),
    remove: (postId) =>
      request(`/posts/${postId}`, { method: 'DELETE' }),
  },
  users: {
    get: (id) => request(`/users/${id}`),
    posts: (id, { limit = 30, offset = 0 } = {}) =>
      request(`/users/${id}/posts`, { params: { limit, offset } }),
    products: (id, { limit = 30 } = {}) =>
      request(`/users/${id}/products`, { params: { limit } }),
  },
  seller: {
    products: ({ limit = 50 } = {}) =>
      request('/seller/products', { params: { limit } }),
    stats: () => request('/seller/stats'),
  },
  notifications: {
    list: ({ limit = 30 } = {}) =>
      request('/notifications', { params: { limit } }),
    unreadCount: () => request('/notifications/unread-count'),
    markRead: (ids) =>
      request('/notifications/read', { method: 'POST', body: { ids: ids || [] } }),
  },
  auth: {
    getSession: () => request('/auth/session'),
    // provider: 'line_oauth' (code exchange) | 'line_pin' | 'phone_otp' | 'line' (LIFF profile)
    createSession: (payload) => request('/auth/session', { method: 'POST', body: payload, timeoutMs: 15000 }),
    requestOtp: (phone) => request('/auth/phone/request-otp', { method: 'POST', body: { phone } }),
    refresh: () => request('/auth/refresh', { method: 'POST' }),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },
  media: {
    presign: ({ folder, filename, contentType }) =>
      request('/media/presign', { method: 'POST', body: { folder, filename, contentType } }),
  },
}

// อัปโหลดไฟล์ตรงเข้า R2 ผ่าน presigned URL — คืน public URL
export async function uploadToR2(file, folder, onProgress) {
  const presign = await api.media.presign({
    folder,
    filename: file.name || `upload_${Date.now()}`,
    contentType: file.type,
  })
  const uploadUrl = presign.uploadUrl || presign.data?.uploadUrl
  const publicUrl = presign.publicUrl || presign.data?.publicUrl
  if (!uploadUrl) throw new Error('ไม่ได้รับ URL สำหรับอัปโหลด')

  // ใช้ XHR เพื่อรายงาน progress ได้ (fetch ยังไม่มี upload progress ทุกเบราว์เซอร์)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`อัปโหลดล้มเหลว (${xhr.status})`)))
    xhr.onerror = () => reject(new Error('อัปโหลดล้มเหลว — เครือข่ายขัดข้อง'))
    xhr.send(file)
  })
  return publicUrl
}

// แปลง product ให้เป็น feed item รูปแบบเดียวกับโพสต์ (ใช้ตอน feed ว่าง)
function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
}

function normalizeImages(raw, fallback = '') {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    const images = Array.isArray(arr) ? arr.filter(Boolean) : []
    return images.length > 0 ? images : [fallback].filter(Boolean)
  } catch {
    return [fallback].filter(Boolean)
  }
}

// แปลง product ให้เป็น feed item รูปแบบเดียวกับโพสต์ เพื่อใช้เป็น fallback และ reuse ในหน้า Nearme
export function productToFeedItem(p) {
  const images = normalizeImages(p.images, p.imageUrl || p.image_url)
  const productId = firstDefined(p.id, p.productId, p.product_id)
  const sellerName = firstDefined(p.sellerName, p.seller_name, p.display_name, 'TukTuk Marketplace')
  const sellerLocation = firstDefined(p.sellerLocation, p.seller_location, p.province)
  const productStock = Number(firstDefined(p.productStock, p.product_stock, 0) || 0)
  const productUnit = firstDefined(p.productUnit, p.product_unit)
  return {
    id: String(p.id || p.productId || `product-${productId}`).startsWith('product-') ? String(p.id || p.productId) : `product-${productId}`,
    type: 'product',
    productId,
    authorName: sellerName,
    authorAvatar: firstDefined(p.sellerPictureUrl, p.seller_picture, p.picture_url),
    content: firstDefined(p.title, p.productName, p.product_name),
    title: firstDefined(p.title, p.productName, p.product_name),
    description: p.description || '',
    price: Number(firstDefined(p.price, 0) || 0),
    images,
    thumbnailUrl: firstDefined(p.thumbnailUrl, p.imageUrl, p.image_url, images[0]),
    videoUrl: firstDefined(p.videoUrl, p.video_url),
    sellerId: firstDefined(p.sellerId, p.seller_id, p.lineUserId),
    sellerName,
    sellerPhone: firstDefined(p.sellerPhone, p.seller_phone),
    sellerLineId: firstDefined(p.sellerLineId, p.seller_line_id),
    sellerFacebook: firstDefined(p.sellerFacebook, p.seller_facebook),
    sellerLocation,
    productStock,
    productUnit,
    isOTOP: Boolean(p.isOTOP || p.isOtop || p.is_otop),
    isOrganic: Boolean(p.isOrganic || p.is_organic),
    buyScore: Number(firstDefined(p.buyScore, p.buy_score, 0) || 0),
    nearmeReason: firstDefined(p.nearmeReason, p.nearme_reason),
    likes: 0,
    viewCount: Number(firstDefined(p.viewCount, p.views_count, 0) || 0),
    createdAt: firstDefined(p.created_at, p.createdAt),
    ctaUrl: firstDefined(p.ctaUrl, productId ? `/app/market?product=${encodeURIComponent(productId)}` : ''),
  }
}
