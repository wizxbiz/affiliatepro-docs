# ✅ Task #5 Complete: Unified API Client

## Status: เสร็จสมบูรณ์

### **API Clients ที่มี:**

1. ✅ **`webapp/src/api/client.js`** - React app API client
   - Modern fetch-based
   - JWT token management
   - Promise-based
   - Used by: OnboardingOverlay, DuPlenFeed, MarketplacePage

2. ✅ **`public/js/cloudflare-client.js`** - Legacy web API shim
   - Firebase-compatible API
   - Used by: index.html, super-admin.html
   - Provides: `window.db`, `window.cfApi`, `window.storage`

---

## **API Endpoints Coverage**

### ✅ Feed & Posts
```javascript
// webapp
api.posts.list({ category, limit, offset })
api.posts.create({ content, mediaUrls, category })

// legacy web
window.cfApi.getPosts({ category, limit, offset })
window.cfApi.createPost(postData)
window.db.collection('posts').get()
```

### ✅ Products
```javascript
// webapp
api.products.list({ province, category, search, limit, offset })
api.products.get(id)
api.products.create(product)

// legacy web
window.cfApi.getProducts({ category, limit, offset })
window.cfApi.createProduct(productData)
window.db.collection('products').get()
```

### ✅ Authentication
```javascript
// webapp
api.auth.getSession()
api.auth.createSession(payload)
api.auth.logout()

// legacy web
window.cfApi.verifyPin(lineUserId, pin)
window.cfApi.googleCallback(idToken)
window.auth.onAuthStateChanged(callback)
```

### ✅ File Upload (R2)
```javascript
// webapp
uploadToR2(file, folder, onProgress)
api.media.presign({ folder, filename, contentType })

// legacy web
window.cfApi.uploadFile(file, folder)
window.cfApi.getUploadUrl(filename, contentType, folder)
```

---

## **OnboardingOverlay Integration**

### ✅ Status: ทำงานได้ 100%

```jsx
// OnboardingOverlay.jsx (lines 10-31)
useEffect(() => {
  async function loadTrending() {
    const [postsRes, productsRes] = await Promise.allSettled([
      api.posts.list({ limit: 6 }),      // ✅ Cloudflare D1
      api.products.list({ limit: 6 })     // ✅ Cloudflare D1
    ])
    // ... handle results
  }
  loadTrending()
}, [])
```

### Features:
- ✅ แสดง 6 โพสต์ยอดนิยม
- ✅ แสดง 6 สินค้ายอดนิยม
- ✅ Tab switching
- ✅ Redirect to login
- ✅ Guest mode support

---

## **Token Management**

### ✅ Unified Session Storage
```javascript
// webapp/src/api/client.js
getToken() {
  // Check multiple session keys for compatibility
  - tuktuk_jwt
  - wizmobiz_session.token
  - tuktuk_line_session.token
  - wit_line_session.sessionToken
}

saveSession({ token, user }) {
  // Save to multiple keys for cross-compatibility
  storage.set('tuktuk_jwt', token)
  storage.setJSON('wizmobiz_session', session)
  storage.setJSON('tuktuk_line_session', session)
}
```

---

## **Error Handling**

### ✅ Consistent Error Structure
```javascript
// All API calls return:
{
  status: 'error',
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly message'
  }
}

// Client throws:
const err = new Error(data.error?.message || 'HTTP error')
err.httpStatus = res.status
```

---

## **Performance**

### ✅ Timeout Configuration
```javascript
const TIMEOUT_MS = 8000  // Default
api.auth.createSession() // 15000ms (longer for auth)
```

### ✅ Request Cancellation
```javascript
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), timeoutMs)
fetch(url, { signal: controller.signal })
```

---

## **Next Steps: Task #6 Testing**

1. ✅ OnboardingOverlay - tested and working
2. ⏳ Feed cards - need to test with real data
3. ⏳ Product cards - need to test
4. ⏳ Authentication flow
5. ⏳ File uploads

---

**Status:** ✅ Complete
**Updated:** 2026-07-03
