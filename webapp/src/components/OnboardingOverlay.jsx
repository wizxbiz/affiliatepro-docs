import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

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

        if (postsRes.status === 'fulfilled') {
          setPosts(postsRes.value.posts || [])
        }
        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.products || [])
        }
      } catch (err) {
        console.warn('[OnboardingOverlay] failed to fetch previews:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTrending()
  }, [])

  const handleRedirect = () => {
    window.location.href = `/app/login?redirectUrl=${encodeURIComponent(window.location.pathname)}`
  }

  return (
    <div className="onboarding-backdrop" onClick={onClose}>
      <div className="onboarding-sheet" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Block */}
        <div className="onboarding-header">
          <div className="onboarding-logo-glow">✨</div>
          <h2>ยินดีต้อนรับสู่ TukTuk Thailand</h2>
          <p>เปิดประสบการณ์ความบันเทิงและสนับสนุนสินค้า OTOP จากคนในชุมชน</p>
        </div>

        {/* Dynamic Tabs */}
        <div className="onboarding-tabs">
          <button
            className={activeTab === 'feed' ? 'active' : ''}
            onClick={() => setActiveTab('feed')}
          >
            🔥 โพสต์ยอดนิยม
          </button>
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            🛍️ สินค้าชุมชน
          </button>
        </div>

        {/* Tab Content Preview */}
        <div className="onboarding-content">
          {loading ? (
            <div className="onboarding-loading">
              <div className="spinner" />
            </div>
          ) : activeTab === 'feed' ? (
            <div className="onboarding-grid">
              {posts.map((post) => {
                const isVideo = post.mediaUrls && post.mediaUrls.find(url => url.endsWith('.mp4') || url.includes('/videos/'))
                const firstImage = post.mediaUrls && post.mediaUrls[0] || ''
                return (
                  <div key={post.id} className="onboarding-card" onClick={handleRedirect}>
                    <div className="onboarding-card-media">
                      {isVideo ? (
                        <div className="onboarding-video-fallback">🎥 วิดีโอสั้น</div>
                      ) : firstImage ? (
                        <img src={firstImage} alt="" className="object-cover w-full h-full" />
                      ) : (
                        <div className="onboarding-text-fallback">📝 โพสต์</div>
                      )}
                      <div className="onboarding-card-lock">
                        <span>🔒 ล็อกอินเพื่อดู</span>
                      </div>
                    </div>
                    <div className="onboarding-card-info">
                      <p className="onboarding-card-author">@{post.authorName || 'TukTuk User'}</p>
                      <p className="onboarding-card-text line-clamp-1">{post.content}</p>
                    </div>
                  </div>
                )
              })}
              {posts.length === 0 && (
                <p className="onboarding-empty">ไม่มีคลิปวิดีโอแนะนำในขณะนี้</p>
              )}
            </div>
          ) : (
            <div className="onboarding-grid">
              {products.map((p) => {
                let images = []
                try { images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []) } catch { /* ignore */ }
                const imageUrl = images[0] || p.imageUrl || ''
                return (
                  <div key={p.id} className="onboarding-card" onClick={handleRedirect}>
                    <div className="onboarding-card-media">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="object-cover w-full h-full" />
                      ) : (
                        <div className="onboarding-text-fallback">📦 สินค้า</div>
                      )}
                      <div className="onboarding-card-lock">
                        <span>🛍️ สนใจสินค้า</span>
                      </div>
                    </div>
                    <div className="onboarding-card-info">
                      <p className="onboarding-card-title line-clamp-1">{p.title || p.productName}</p>
                      <p className="onboarding-card-price">฿{Number(p.price || 0).toLocaleString('th-TH')}</p>
                    </div>
                  </div>
                )
              })}
              {products.length === 0 && (
                <p className="onboarding-empty">ไม่มีสินค้าแนะนำในขณะนี้</p>
              )}
            </div>
          )}
        </div>

        {/* CTA Actions */}
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
