import { storage } from '../lib/storage.js'

// REST client สำหรับ /api/v1/* — same-origin เสมอ (Pages _worker.js proxy ไป Worker ให้)
const BASE = '/api/v1'
const TIMEOUT_MS = 8000

// อ่าน token ให้เข้ากันได้กับ session เดิมของเว็บเก่า (wizmobiz/tuktuk_line/wit_line)
export function getToken() {
  const direct = storage.get('tuktuk_jwt')
  if (direct) return direct
  for (const key of ['wizmobiz_session', 'tuktuk_line_session', 'wit_line_session']) {
    const s = storage.getJSON(key)
    if (s?.token) return s.token
    if (s?.sessionToken) return s.sessionToken
  }
  return null
}

export function saveSession({ token, user }) {
  const session = { ...user, token, sessionToken: token, savedAt: Date.now() }
  storage.set('tuktuk_jwt', token)
  // เขียน key เดิมด้วยเพื่อให้หน้าเว็บเก่า (iframe SPA) เห็น session เดียวกัน
  storage.setJSON('wizmobiz_session', session)
  storage.setJSON('tuktuk_line_session', session)
  return session
}

export function clearSession() {
  storage.remove('tuktuk_jwt')
  storage.remove('wizmobiz_session')
  storage.remove('tuktuk_line_session')
  storage.remove('wit_line_session')
}

export function getSavedUser() {
  return storage.getJSON('wizmobiz_session')
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
  products: {
    list: ({ province = '', category = '', search = '', limit = 30, offset = 0 } = {}) =>
      request('/products', { params: { province, category, search, limit, offset } }),
    get: (id) => request(`/products/${id}`),
    create: (product) => request('/products', { method: 'POST', body: product }),
  },
  posts: {
    list: ({ category = '', limit = 20, offset = 0 } = {}) =>
      request('/posts', { params: { category, limit, offset } }),
    create: ({ content, mediaUrls, category }) =>
      request('/posts', { method: 'POST', body: { content, mediaUrls, category } }),
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
export function productToFeedItem(p) {
  let images = []
  try { images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []) } catch { /* ignore */ }
  return {
    id: `product-${p.id}`,
    type: 'product',
    productId: p.id,
    authorName: p.sellerName || p.display_name || 'TukTuk Marketplace',
    content: p.title || p.productName || '',
    description: p.description || '',
    price: p.price,
    thumbnailUrl: images[0] || null,
    videoUrl: null,
    likes: 0,
    createdAt: p.created_at || p.createdAt,
  }
}
