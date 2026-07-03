/**
 * 🌩️ Cloudflare API Client — แทน Firebase SDK
 * ─────────────────────────────────────────────────────────────
 * Drop-in replacement สำหรับ Firebase SDK calls บน frontend
 * 
 * ใช้: window.cfApi.* แทน firebase.firestore().* 
 *      WizmobizAuth ยังทำงานเหมือนเดิม (ใช้ localStorage + JWT)
 *
 * WORKER_URL: ชี้ไปที่ Cloudflare Workers URL ของคุณ
 */

(function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  // Same-origin by default: /api/* ถูก proxy ไป Worker ผ่าน _worker.js บน Pages
  // fallback ยิงตรง Worker เฉพาะตอนเปิดนอกเว็บ (file:// หรือ localhost dev)
  const WORKER_URL = (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'https://tuktukfeed-api.imtthailand2019.workers.dev'
    : '';

  // ── Internal: get JWT token จาก session ───────────────────
  function _getToken() {
    try {
      const wizSession = JSON.parse(localStorage.getItem('wizmobiz_session') || '{}');
      const witSession = JSON.parse(localStorage.getItem('wit_line_session') || '{}');
      return localStorage.getItem('tuktuk_jwt') ||
             wizSession.token ||
             witSession.token ||
             witSession.sessionToken ||
             null;
    } catch { return null; }
  }

  // ── Internal: fetch wrapper ────────────────────────────────
  async function _fetch(path, options = {}) {
    const token = _getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${WORKER_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ══════════════════════════════════════════════════════════
  // window.cfApi — ใช้แทน firebase.firestore() calls
  // ══════════════════════════════════════════════════════════
  window.cfApi = {

    // ── AUTH ─────────────────────────────────────────────────

    async verifyPin(lineUserId, pin) {
      const data = await _fetch('/api/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ lineUserId, pin }),
      });
      if (data.token) {
        localStorage.setItem('tuktuk_jwt', data.token);
        // Sync กับ WizmobizAuth session format
        if (data.user) {
          const session = {
            ...data.user,
            loginAt: new Date().toISOString(),
            token: data.token,
          };
          localStorage.setItem('wizmobiz_session', JSON.stringify(session));
        }
      }
      return data;
    },

    async requestPhoneOtp(phone) {
      return _fetch('/api/auth/phone/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    },

    async verifyPhoneOtp(phone, code) {
      const data = await _fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      if (data.token) {
        localStorage.setItem('tuktuk_jwt', data.token);
        if (data.user) {
          localStorage.setItem('wizmobiz_session', JSON.stringify({
            ...data.user, loginAt: new Date().toISOString(), token: data.token,
          }));
        }
      }
      return data;
    },

    async lineCallback(lineUserId, displayName, pictureUrl) {
      const data = await _fetch('/api/auth/line-callback', {
        method: 'POST',
        body: JSON.stringify({ lineUserId, displayName, pictureUrl }),
      });
      if (data.token) {
        localStorage.setItem('tuktuk_jwt', data.token);
        if (data.user) {
          localStorage.setItem('wizmobiz_session', JSON.stringify({
            ...data.user, loginAt: new Date().toISOString(), token: data.token,
          }));
        }
      }
      return data;
    },

    async googleCallback(idToken) {
      const data = await _fetch('/api/auth/google-callback', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      if (data.token) {
        localStorage.setItem('tuktuk_jwt', data.token);
        if (data.user) {
          localStorage.setItem('wizmobiz_session', JSON.stringify({
            ...data.user, loginAt: new Date().toISOString(), token: data.token,
          }));
        }
      }
      return data;
    },

    async getMe() {
      return _fetch('/api/auth/me');
    },

    async logout() {
      try { await _fetch('/api/auth/logout', { method: 'POST' }); } catch {}
      localStorage.removeItem('tuktuk_jwt');
    },

    async checkFreeUsage() {
      return _fetch('/api/auth/check-usage', { method: 'POST' });
    },

    // ── POSTS ────────────────────────────────────────────────

    async getPosts({ category = 'all', limit = 20, offset = 0 } = {}) {
      const params = new URLSearchParams({ category, limit, offset });
      return _fetch(`/api/marketplace/posts?${params}`);
    },

    async createPost(postData) {
      return _fetch('/api/marketplace/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
    },

    async likePost(postId) {
      return _fetch(`/api/marketplace/posts/${postId}/like`, { method: 'POST' });
    },

    // ── PRODUCTS ─────────────────────────────────────────────

    async getProducts({ category, limit = 20, offset = 0, search } = {}) {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search)   params.set('search', search);
      params.set('limit', limit);
      params.set('offset', offset);
      return _fetch(`/api/marketplace/products?${params}`);
    },

    async getProduct(id) {
      return _fetch(`/api/marketplace/products/${id}`);
    },

    async createProduct(productData) {
      return _fetch('/api/marketplace/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    },

    async getMarketplaceStats() {
      return _fetch('/api/marketplace/stats');
    },

    async getRelatedProducts(id) {
      return _fetch(`/api/marketplace/related/${id}`);
    },

    async aiGeneratePost(productName, price, category) {
      return _fetch('/api/marketplace/ai-generate', {
        method: 'POST',
        body: JSON.stringify({ productName, price, category }),
      });
    },

    // ── ANALYTICS ────────────────────────────────────────────

    async trackPageView(page) {
      return _fetch('/api/analytics/trackPageView', {
        method: 'POST',
        body: JSON.stringify({ page }),
      }).catch(() => {}); // Silent fail — never break UX
    },

    async trackEvent(event, category, label, value) {
      return _fetch('/api/analytics/trackEvent', {
        method: 'POST',
        body: JSON.stringify({ event, category, label, value }),
      }).catch(() => {});
    },

    // ── UPLOADS (R2) ─────────────────────────────────────────

    async getUploadUrl(filename, contentType, folder = 'uploads') {
      return _fetch('/api/utility/r2-presigned-url', {
        method: 'POST',
        body: JSON.stringify({ filename, contentType, folder }),
      });
    },

    async uploadFile(file, folder = 'uploads') {
      // 1. รับ pre-signed url และ publicUrl จาก Worker
      const { uploadUrl, publicUrl } = await this.getUploadUrl(file.name, file.type, folder);

      // 2. PUT file binary ไปที่ pre-signed URL โดยตรง
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!res.ok) {
        throw new Error(`อัปโหลดไฟล์ล้มเหลว: ${res.statusText}`);
      }

      return { publicUrl, url: publicUrl };
    },

    // ── UTILITY ──────────────────────────────────────────────

    async healthCheck() {
      return _fetch('/api/utility/health');
    },

    async submitFeedback(type, message, page) {
      return _fetch('/api/utility/feedback', {
        method: 'POST',
        body: JSON.stringify({ type, message, page }),
      });
    },
  };

  // ── Helper to wrap timestamps with Firestore-like toDate() / toMillis() ──
  function _wrapDocData(data) {
    if (!data) return data;
    const wrapped = { ...data };
    for (const [key, val] of Object.entries(wrapped)) {
      if ((key.toLowerCase().endsWith('at') || key.toLowerCase().endsWith('timestamp') || key === 'sentAt') && typeof val === 'number') {
        wrapped[key] = {
          toDate: () => new Date(val),
          toMillis: () => val,
          seconds: Math.floor(val / 1000),
          nanoseconds: (val % 1000) * 1e6
        };
      }
    }
    return wrapped;
  }

  // ── Polling-based onSnapshot helper ──
  function _onSnapshot(queryOrDoc, callback) {
    let active = true;
    let lastJson = '';
    
    const poll = async () => {
      if (!active) return;
      try {
        const snap = await queryOrDoc.get();
        if (!active) return;
        const currentJson = JSON.stringify(snap);
        if (currentJson !== lastJson) {
          lastJson = currentJson;
          callback(snap);
        }
      } catch (err) {
        console.warn('[Snapshot Poll Error]', err);
      }
    };
    
    poll();
    const timer = setInterval(poll, 3000); // Poll every 3 seconds
    
    return () => {
      active = false;
      clearInterval(timer);
    };
  }

  // ══════════════════════════════════════════════════════════
  // window.db — Firestore-compatible shim
  // ให้โค้ดที่เขียน firebase.firestore() ยังใช้งานได้โดยไม่ต้องแก้
  // ══════════════════════════════════════════════════════════
  window.db = {
    collection(name) {
      return new CloudflareCollection(name);
    },
    batch() {
      return new CloudflareBatch();
    }
  };

  class CloudflareBatch {
    constructor() {
      this.ops = [];
    }
    set(docRef, data, options = {}) {
      this.ops.push({ ref: docRef, method: options.merge ? 'PATCH' : 'PUT', data });
      return this;
    }
    update(docRef, data) {
      this.ops.push({ ref: docRef, method: 'PATCH', data });
      return this;
    }
    delete(docRef) {
      this.ops.push({ ref: docRef, method: 'DELETE' });
      return this;
    }
    async commit() {
      const promises = this.ops.map(op => {
        if (op.method === 'DELETE') return op.ref.delete();
        return op.ref.set(op.data, { merge: op.method === 'PATCH' });
      });
      await Promise.all(promises);
      this.ops = [];
    }
  }

  class CloudflareCollection {
    constructor(name, parentPath = '') {
      this.name = name;
      this.parentPath = parentPath;
    }
    doc(id) { 
      return new CloudflareDoc(this.name, id || crypto.randomUUID(), this.parentPath); 
    }
    async add(data) {
      const ref = this.doc();
      await ref.set(data);
      return ref;
    }
    where(field, op, value) { 
      return new CloudflareQuery(this.name, [{ field, op, value }], [], null, this.parentPath); 
    }
    orderBy(field, dir = 'asc') { 
      return new CloudflareQuery(this.name, [], [{ field, dir }], null, this.parentPath); 
    }
    limit(n) { 
      return new CloudflareQuery(this.name, [], [], n, this.parentPath); 
    }
    async get() {
      const fullPath = this.parentPath ? `${this.parentPath}/${this.name}` : this.name;
      const data = await _fetch(`/api/db/${fullPath}`);
      return {
        docs: (data.results || []).map(d => {
          const wrapped = _wrapDocData(d);
          return { id: d.id, data: () => wrapped, exists: true };
        }),
        empty: !(data.results?.length),
      };
    }
    onSnapshot(callback, onError) {
      return _onSnapshot(this, callback);
    }
  }

  class CloudflareDoc {
    constructor(collection, id, parentPath = '') {
      this.collection = collection;
      this.id = id;
      this.parentPath = parentPath;
    }
    collection(name) {
      const nextParent = this.parentPath 
        ? `${this.parentPath}/${this.collection}/${this.id}`
        : `${this.collection}/${this.id}`;
      return new CloudflareCollection(name, nextParent);
    }
    async get() {
      const fullPath = this.parentPath 
        ? `${this.parentPath}/${this.collection}/${this.id}`
        : `${this.collection}/${this.id}`;
      try {
        const data = await _fetch(`/api/db/${fullPath}`);
        const wrapped = _wrapDocData(data.result);
        return { id: this.id, data: () => wrapped, exists: !!data.result };
      } catch {
        return { id: this.id, data: () => null, exists: false };
      }
    }
    async set(data, options = {}) {
      const fullPath = this.parentPath 
        ? `${this.parentPath}/${this.collection}/${this.id}`
        : `${this.collection}/${this.id}`;
      return _fetch(`/api/db/${fullPath}`, {
        method: options.merge ? 'PATCH' : 'PUT',
        body: JSON.stringify(data),
      });
    }
    async update(data) {
      const fullPath = this.parentPath 
        ? `${this.parentPath}/${this.collection}/${this.id}`
        : `${this.collection}/${this.id}`;
      return _fetch(`/api/db/${fullPath}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }
    async delete() {
      const fullPath = this.parentPath 
        ? `${this.parentPath}/${this.collection}/${this.id}`
        : `${this.collection}/${this.id}`;
      return _fetch(`/api/db/${fullPath}`, { method: 'DELETE' });
    }
    onSnapshot(callback, onError) {
      return _onSnapshot(this, callback);
    }
  }

  class CloudflareQuery {
    constructor(collection, filters = [], orders = [], limitN = null, parentPath = '') {
      this.collection = collection;
      this.filters = filters;
      this.orders = orders;
      this.limitN = limitN;
      this.parentPath = parentPath;
    }
    where(field, op, value) {
      return new CloudflareQuery(this.collection, [...this.filters, { field, op, value }], this.orders, this.limitN, this.parentPath);
    }
    orderBy(field, dir = 'asc') {
      return new CloudflareQuery(this.collection, this.filters, [...this.orders, { field, dir }], this.limitN, this.parentPath);
    }
    limit(n) {
      return new CloudflareQuery(this.collection, this.filters, this.orders, n, this.parentPath);
    }
    limitToLast(n) {
      return new CloudflareQuery(this.collection, this.filters, this.orders, n, this.parentPath);
    }
    async get() {
      const params = new URLSearchParams();
      this.filters.forEach(f => params.append('filter', `${f.field}:${f.op}:${f.value}`));
      this.orders.forEach(o => params.append('order', `${o.field}:${o.dir}`));
      if (this.limitN) params.set('limit', this.limitN);

      const fullPath = this.parentPath ? `${this.parentPath}/${this.collection}` : this.collection;
      const data = await _fetch(`/api/db/${fullPath}?${params}`);
      return {
        docs: (data.results || []).map(d => {
          const wrapped = _wrapDocData(d);
          return { id: d.id, data: () => wrapped, exists: true };
        }),
        empty: !(data.results?.length),
      };
    }
    onSnapshot(callback, onError) {
      return _onSnapshot(this, callback);
    }
  }

  // ══════════════════════════════════════════════════════════
  // window.storage — Firebase Storage shim → R2
  // ══════════════════════════════════════════════════════════
  window.storage = {
    ref(path) { return new R2Ref(path); },
  };

  class R2Ref {
    constructor(path) { this.path = path; this.uploadedUrl = null; }
    async put(file, metadata = {}) {
      const result = await window.cfApi.uploadFile(file, this.path.split('/')[0] || 'uploads');
      this.uploadedUrl = result.publicUrl;
      return { ref: this, metadata: result };
    }
    async getDownloadURL() {
      if (this.uploadedUrl) return this.uploadedUrl;
      // R2 public URL — ปรับ domain ตาม bucket ของคุณ
      const accountId = window.CF_R2_ACCOUNT_ID || '3936ddcbff711649ab56a10375e82b67';
      return `https://pub-7e55074f08794361aaf305c1967f6ffa.r2.dev/${this.path}`;
    }
  }

  // ══════════════════════════════════════════════════════════
  // window.auth — Firebase Auth shim → JWT
  // ══════════════════════════════════════════════════════════
  window.auth = {
    currentUser: null,
    _listeners: [],

    onAuthStateChanged(callback) {
      this._listeners.push(callback);
      // Immediate call with current state
      const session = window.WizmobizAuth?.getSession?.();
      callback(session ? { uid: session.uid, displayName: session.displayName } : null);
      return () => { this._listeners = this._listeners.filter(l => l !== callback); };
    },

    async signInWithPopup(provider) {
      // Google sign-in via Google Identity Services
      if (typeof google !== 'undefined' && google.accounts) {
        return new Promise((resolve, reject) => {
          google.accounts.id.initialize({
            client_id: window.GOOGLE_CLIENT_ID || '',
            callback: async (response) => {
              try {
                const result = await window.cfApi.googleCallback(response.credential);
                resolve({ user: result.user });
              } catch (err) { reject(err); }
            },
          });
          google.accounts.id.prompt();
        });
      }
      throw new Error('Google Identity Services not loaded');
    },

    async signOut() {
      await window.cfApi.logout();
      window.WizmobizAuth?.logout?.();
    },
  };

  // ══════════════════════════════════════════════════════════
  // window.firebase — Global compat shim replacing CDN SDKs
  // ══════════════════════════════════════════════════════════
  window.firebase = {
    apps: [{ name: '[DEFAULT]' }],
    initializeApp() { return this; },
    auth() { return window.auth; },
    firestore() {
      const db = window.db;
      db.settings = () => {};
      db.enablePersistence = () => Promise.resolve();
      return db;
    },
    storage() { return window.storage; },
    analytics() {
      return {
        logEvent(name, params) {
          window.cfApi?.trackEvent(name, 'analytics', params ? JSON.stringify(params) : null);
        }
      };
    },
    // Server Timestamp / Field Values compat
    FieldValue: {
      serverTimestamp() { return Date.now(); },
      increment(value = 1) { return { __type: 'increment', value }; },
      arrayUnion(...items) { return { __type: 'arrayUnion', items }; },
      arrayRemove(...items) { return { __type: 'arrayRemove', items }; },
      delete() { return { __type: 'delete' }; }
    },
    FieldPath: {
      documentId() { return 'id'; }
    },
    Timestamp: {
      now() {
        const ms = Date.now();
        return {
          seconds: Math.floor(ms / 1000),
          nanoseconds: (ms % 1000) * 1e6,
          toMillis: () => ms,
          toDate: () => new Date(ms)
        };
      },
      fromDate(date) {
        const ms = date instanceof Date ? date.getTime() : Date.now();
        return {
          seconds: Math.floor(ms / 1000),
          nanoseconds: (ms % 1000) * 1e6,
          toMillis: () => ms,
          toDate: () => new Date(ms)
        };
      }
    }
  };

  window.firebase.firestore.FieldValue = window.firebase.FieldValue;
  window.firebase.firestore.FieldPath = window.firebase.FieldPath;
  window.firebase.firestore.Timestamp = window.firebase.Timestamp;
  console.log('☁️ Cloudflare API Client loaded — Firebase SDK replaced');
})();
