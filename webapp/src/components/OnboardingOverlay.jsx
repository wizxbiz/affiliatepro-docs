import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

// ── helpers ────────────────────────────────────────────────────
function getMediaUrl(mediaUrls) {
  if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) return ''
  const first = mediaUrls[0]
  // D1 API returns objects {url, type}; old path may return plain strings
  return typeof first === 'string' ? first : (first?.url || '')
}

function isVideoUrl(url) {
  return url ? /\.mp4|\/videos\/|youtu/i.test(url) : false
}

function isVideoEntry(mediaUrls) {
  if (!Array.isArray(mediaUrls)) return false
  const first = mediaUrls[0]
  if (typeof first === 'object') return first?.type === 'video' || isVideoUrl(first?.url || '')
  return isVideoUrl(first)
}

export default function OnboardingOverlay({ onClose }) {
  const [activeTab, setActiveTab] = useState('feed') // 'feed' | 'products'
  const [posts, setPosts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrending() {
      try {
        const [postsRes, productsRes] = await Promise.allSettled([
          api.posts.list({ limit: 6 }),
          api.products.list({ limit: 6 })
        ])
        if (postsRes.status === 'fulfilled') setPosts(postsRes.value.posts || [])
        if (productsRes.status === 'fulfilled') setProducts(productsRes.value.products || [])
      } catch (err) {
        console.warn('[OnboardingOverlay] failed to fetch previews:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTrending()
  }, [])

  // Use ?redirect= to match LoginPage's param name (was ?redirectUrl= — mismatch)
  const handleRedirect = () => {
    window.location.href = `/app/login?redirect=${encodeURIComponent(window.location.pathname)}`
  }

  return (
    <div className="onboarding-backdrop" onClick={onClose}>
      <div className="onboarding-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="onboarding-header">
          <div className="onboarding-logo-glow">✨</div>
          <h2>ยินดีต้อนรับสู่ TukTuk Thailand</h2>
          <p>เปิดประสบการณ์ความบันเทิงและสนับสนุนสินค้า OTOP จากคนในชุมชน</p>
        </div>

        <div className="onboarding-tabs">
          <button className={activeTab === 'feed' ? 'active' : ''} onClick={() => setActiveTab('feed')}>
            🔥 โพสต์ยอดนิยม
          </button>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            🛍️ สินค้าชุมชน
          </button>
        </div>

        <div className="onboarding-content">
          {loading ? (
            <div className="onboarding-loading"><div className="spinner" /></div>
          ) : activeTab === 'feed' ? (
            <div className="onboarding-grid">
              {posts.map((post) => {
                const mediaUrl = getMediaUrl(post.mediaUrls)
                const isVid = isVideoEntry(post.mediaUrls)
                const isYT = mediaUrl && /youtube\.com|youtu\.be/i.test(mediaUrl)
                const poster = post.imageUrl || post.thumbnailUrl || ''
                return (
                  <div key={post.id} className="onboarding-card" onClick={handleRedirect}>
                    <div className="onboarding-card-media">
                      {isVid && !isYT ? (
                        <video src={mediaUrl} poster={poster} muted loop autoPlay playsInline style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#000'}} />
                      ) : isYT && poster ? (
                        <img src={poster} alt="" loading="lazy" />
                      ) : mediaUrl && !isVid ? (
                        <img src={mediaUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="onboarding-text-fallback">📝 โพสต์</div>
                      )}
                      <div className="onboarding-card-lock"><span>🔒 ล็อกอินเพื่อดู</span></div>
                    </div>
                    <div className="onboarding-card-info">
                      <p className="onboarding-card-author">@{post.authorName || 'TukTuk User'}</p>
                      <p className="onboarding-card-text">{post.content}</p>
                    </div>
                  </div>
                )
              })}
              {posts.length === 0 && <p className="onboarding-empty">ไม่มีคลิปวิดีโอแนะนำในขณะนี้</p>}
            </div>
          ) : (
            <div className="onboarding-grid">
              {products.map((p) => {
                // images from D1 can be a JSON string or an array
                let images = []
                try { images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []) } catch { /**/ }
                const imageUrl = images[0] || p.imageUrl || p.image_url || ''
                return (
                  <div key={p.id} className="onboarding-card" onClick={handleRedirect}>
                    <div className="onboarding-card-media">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="onboarding-text-fallback">📦 สินค้า</div>
                      )}
                      <div className="onboarding-card-lock"><span>🛍️ สนใจสินค้า</span></div>
                    </div>
                    <div className="onboarding-card-info">
                      <p className="onboarding-card-title">{p.title || p.productName}</p>
                      <p className="onboarding-card-price">฿{Number(p.price || 0).toLocaleString('th-TH')}</p>
                    </div>
                  </div>
                )
              })}
              {products.length === 0 && <p className="onboarding-empty">ไม่มีสินค้าแนะนำในขณะนี้</p>}
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          <button className="onboarding-btn-primary" onClick={handleRedirect}>
            🟢 เข้าสู่ระบบ / สมัครสมาชิกด้วย LINE
          </button>
          <button className="onboarding-btn-secondary" onClick={onClose}>
            เข้าชมเว็บแบบผู้เยี่ยมชม
          </button>
        </div>

      </div>
    </div>
  )
}
