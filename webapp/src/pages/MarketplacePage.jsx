import { useCallback, useEffect, useState } from 'react'
import { api, getToken } from '../api/client.js'
import ProductCard from '../components/ProductCard.jsx'
import OnboardingOverlay from '../components/OnboardingOverlay.jsx'
import { parseImages, formatPrice, timeAgo } from '../lib/format.js'

const PAGE_SIZE = 20

const CATEGORIES = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'electronics', label: 'อิเล็กทรอนิกส์' },
  { key: 'fashion', label: 'แฟชั่น' },
  { key: 'food', label: 'อาหาร' },
  { key: 'otop', label: 'OTOP' },
  { key: 'services', label: 'บริการ' },
  { key: 'general', label: 'อื่นๆ' },
]

export default function MarketplacePage() {
  const [products, setProducts] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(!getToken() && !sessionStorage.getItem('tuktuk_onboarding_dismissed'))

  const load = useCallback(async ({ reset = true, nextOffset = 0 } = {}) => {
    if (reset) setState('loading')
    else setLoadingMore(true)
    try {
      const data = await api.products.list({ category, search, limit: PAGE_SIZE, offset: nextOffset })
      const batch = data.products || []
      setProducts((prev) => (reset ? batch : [...prev, ...batch]))
      setOffset(nextOffset + batch.length)
      setHasMore(batch.length === PAGE_SIZE)
      setState('ready')
    } catch (err) {
      console.warn('[Marketplace]', err)
      if (reset) setState('error')
    } finally {
      setLoadingMore(false)
    }
  }, [category, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="market-page">
      <div className="market-toolbar">
        <input
          type="search"
          placeholder="ค้นหาสินค้า…"
          defaultValue={search}
          onKeyDown={(e) => { if (e.key === 'Enter') setSearch(e.target.value.trim()) }}
        />
      </div>

      <div className="market-cats">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={category === c.key ? 'active' : ''}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {state === 'loading' && (
        <div className="feed-status"><div className="spinner" /><p>กำลังโหลดสินค้า…</p></div>
      )}
      {state === 'error' && (
        <div className="feed-status">
          <p>โหลดสินค้าไม่สำเร็จ</p>
          <button onClick={() => load()}>ลองใหม่</button>
        </div>
      )}

      {state === 'ready' && (
        <>
          <div className="market-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={setSelected} />
            ))}
          </div>
          {products.length === 0 && (
            <div className="feed-status"><p>ยังไม่มีสินค้าในหมวดนี้</p></div>
          )}
          {hasMore && products.length > 0 && (
            <button className="btn-load-more" disabled={loadingMore} onClick={() => load({ reset: false, nextOffset: offset })}>
              {loadingMore ? 'กำลังโหลด…' : 'โหลดเพิ่มเติม'}
            </button>
          )}
        </>
      )}

      {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}

      {showOnboarding && (
        <OnboardingOverlay
          onClose={() => {
            setShowOnboarding(false)
            sessionStorage.setItem('tuktuk_onboarding_dismissed', 'true')
          }}
        />
      )}
    </div>
  )
}

function ProductDetail({ product, onClose }) {
  const images = parseImages(product.images)
  const [imgIndex, setImgIndex] = useState(0)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet modal-product" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product.title || product.productName}</h3>
          <button className="modal-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>
        {images.length > 0 && (
          <div className="product-detail-media">
            <img src={images[imgIndex]} alt="" />
            {images.length > 1 && (
              <div className="product-detail-thumbs">
                {images.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className={i === imgIndex ? 'active' : ''}
                    onClick={() => setImgIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <p className="product-detail-price">{formatPrice(product.price)}</p>
        <p className="product-detail-desc">{product.description}</p>
        <div className="product-card-meta">
          <span>{product.display_name || 'ผู้ขาย TukTuk'}</span>
          <span>{timeAgo(product.created_at)}</span>
        </div>
        <a className="btn-primary btn-contact" href={`/marketplace?product=${product.id}`}>
          ดูในหน้าตลาด / ติดต่อผู้ขาย
        </a>
      </div>
    </div>
  )
}
