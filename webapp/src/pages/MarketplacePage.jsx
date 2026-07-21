import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, getToken } from '../api/client.js'
import ProductCard from '../components/ProductCard.jsx'
import ImageCarousel from '../components/ImageCarousel.jsx'
import OnboardingOverlay from '../components/OnboardingOverlay.jsx'
import { parseImages, formatPrice, timeAgo } from '../lib/format.js'
import { useCart } from '../cart/CartContext.jsx'

const PAGE_SIZE = 20

const CATEGORIES = [
  { key: '', label: 'ทั้งหมด', icon: '🏪' },
  { key: 'electronics', label: 'อิเล็กทรอนิกส์', icon: '📱' },
  { key: 'fashion', label: 'แฟชั่น', icon: '👗' },
  { key: 'food', label: 'อาหาร', icon: '🍜' },
  { key: 'otop', label: 'OTOP', icon: '🎨' },
  { key: 'services', label: 'บริการ', icon: '🛠️' },
  { key: 'general', label: 'อื่นๆ', icon: '📦' },
]

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '')
}

function lineUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const prefix = value.startsWith('@') ? '@' : '~'
  const id = value.replace(/^[@~]/, '')
  return `https://line.me/ti/p/${prefix}${encodeURIComponent(id)}`
}

function facebookUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://www.facebook.com/${encodeURIComponent(value.replace(/^@/, ''))}`
}

function productImages(product) {
  const images = parseImages(product.images)
  const imageUrl = product.imageUrl || product.image_url || product.thumbnailUrl
  return images.length > 0 ? images : [imageUrl].filter(Boolean)
}

function PromoSection({ products, onOpen }) {
  const popular = [...products]
    .sort((a, b) => (b.viewCount || b.views_count || 0) - (a.viewCount || a.views_count || 0))
    .slice(0, 8)

  return (
    <div className="market-promo-section">
      <div className="market-promo-banner">
        <div className="promo-banner-content">
          <div className="promo-badge">🔥 HOT DEAL</div>
          <div className="promo-title">สินค้าคัดพิเศษ</div>
          <div className="promo-sub">ช้อปสินค้าพรีเมียมจากผู้ขายในชุมชน</div>
        </div>
        <div className="promo-banner-deco">🛍️</div>
      </div>

      {popular.length > 0 && (
        <div className="market-popular-row">
          <div className="market-popular-header">
            <span>🏆 ยอดนิยม</span>
          </div>
          <div className="market-popular-scroll">
            {popular.map((product) => {
              const imgs = product.images ? JSON.parse(typeof product.images === 'string' ? product.images : JSON.stringify(product.images)).filter(Boolean) : []
              const img = imgs[0] || product.imageUrl || product.image_url || product.thumbnailUrl
              const views = product.viewCount || product.views_count || 0
              return (
                <button key={product.id} className="popular-card" onClick={() => onOpen(product)}>
                  <div className="popular-card-img">
                    {img ? <img src={img} alt={product.title} loading="lazy" /> : <div className="popular-card-placeholder">📦</div>}
                  </div>
                  <div className="popular-card-body">
                    <div className="popular-card-title">{product.title}</div>
                    <div className="popular-card-price">฿{Number(product.price || 0).toLocaleString()}</div>
                    {views > 0 && <div className="popular-card-views">👁 {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MarketplacePage() {
  const [products, setProducts] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')       // live input value
  const [search, setSearch] = useState('')      // debounced value that drives the API
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(!getToken() && !sessionStorage.getItem('tuktuk_onboarding_dismissed'))
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkedProduct = searchParams.get('product')
  const loadSeq = useRef(0)          // guards against out-of-order responses
  const debounceRef = useRef(null)

  // Debounce live query → search (also apply immediately on Enter/clear via setSearch)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const load = useCallback(async ({ reset = true, nextOffset = 0 } = {}) => {
    const seq = ++loadSeq.current
    if (reset) setState('loading')
    else setLoadingMore(true)
    try {
      const data = await api.products.list({ category, search, limit: PAGE_SIZE, offset: nextOffset })
      if (seq !== loadSeq.current) return   // a newer request superseded this one
      const batch = data.products || []
      setProducts((prev) => (reset ? batch : [...prev, ...batch]))
      setOffset(nextOffset + batch.length)
      setHasMore(batch.length === PAGE_SIZE)
      setState('ready')
    } catch (err) {
      if (seq !== loadSeq.current) return
      console.warn('[Marketplace]', err)
      if (reset) setState('error')
    } finally {
      if (seq === loadSeq.current) setLoadingMore(false)
    }
  }, [category, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!deepLinkedProduct) return
    const found = products.find((product) => String(product.id) === String(deepLinkedProduct))
    if (found) {
      setSelected((current) => (String(current?.id) === String(found.id) ? current : found))
      return
    }

    let cancelled = false
    api.products.get(deepLinkedProduct)
      .then((data) => {
        if (!cancelled && data?.product) setSelected(data.product)
      })
      .catch((err) => console.warn('[Marketplace] deep link product', err))
    return () => { cancelled = true }
  }, [deepLinkedProduct, products])

  function openProduct(product) {
    setSelected(product)
    const next = new URLSearchParams(searchParams)
    next.set('product', product.id)
    setSearchParams(next)
  }

  function closeProduct() {
    setSelected(null)
    const next = new URLSearchParams(searchParams)
    next.delete('product')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="market-page">
      <div className="market-toolbar">
        <div className="market-search-wrap">
          <input
            type="search"
            placeholder="ค้นหาสินค้า หรือชื่อร้าน..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') setSearch(query.trim()) }}
          />
          {query && (
            <button
              type="button"
              className="market-search-clear"
              onClick={() => { setQuery(''); setSearch('') }}
              aria-label="ล้างการค้นหา"
            >×</button>
          )}
        </div>
      </div>

      <div className="market-cats">
        {CATEGORIES.map((item) => (
          <button
            key={item.key}
            className={`cat-chip${category === item.key ? ' active' : ''}`}
            onClick={() => setCategory(item.key)}
          >
            <span className="cat-chip-icon">{item.icon}</span>
            <span className="cat-chip-label">{item.label}</span>
          </button>
        ))}
      </div>

      {state === 'loading' && (
        <div className="feed-status"><div className="spinner" /><p>กำลังโหลดสินค้า...</p></div>
      )}
      {state === 'error' && (
        <div className="feed-status">
          <p>โหลดสินค้าไม่สำเร็จ</p>
          <button onClick={() => load()}>ลองใหม่</button>
        </div>
      )}

      {state === 'ready' && !search && !category && (
        <PromoSection products={products} onOpen={openProduct} />
      )}

      {state === 'ready' && (
        <>
          <div className="market-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onClick={openProduct} />
            ))}
          </div>
          {products.length === 0 && (
            <div className="feed-status">
              <p>{search ? `ไม่พบสินค้าสำหรับ "${search}"` : 'ยังไม่มีสินค้าในหมวดนี้'}</p>
            </div>
          )}
          {hasMore && products.length > 0 && (
            <button className="btn-load-more" disabled={loadingMore} onClick={() => load({ reset: false, nextOffset: offset })}>
              {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
            </button>
          )}
        </>
      )}

      {selected && <ProductDetail product={selected} onClose={closeProduct} />}

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
  const images = productImages(product)
  const [qty, setQty] = useState(1)
  const [viewCount, setViewCount] = useState(Number(firstDefined(product.viewCount, product.views_count, 0) || 0))
  const { addItem } = useCart()
  const phone = firstDefined(product.sellerPhone, product.seller_phone)
  const lineId = firstDefined(product.sellerLineId, product.seller_line_id)
  const facebook = firstDefined(product.sellerFacebook, product.seller_facebook)
  const location = firstDefined(product.sellerLocation, product.seller_location, product.province)
  const stock = Number(firstDefined(product.productStock, product.product_stock, 0) || 0)
  const unit = firstDefined(product.productUnit, product.product_unit)
  const sellerName = firstDefined(product.sellerName, product.seller_name, product.display_name, 'ผู้ขาย TukTuk')
  const hasContact = Boolean(phone || lineId || facebook)

  useEffect(() => {
    api.products.view(product.id)
      .then((res) => { if (res?.viewCount) setViewCount(res.viewCount) })
      .catch(() => {/* silent */})
  }, [product.id])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet modal-product" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{product.title || product.productName}</h3>
          <button className="modal-close" onClick={onClose} aria-label="ปิด">×</button>
        </div>
        {images.length > 0 && (
          <div className="product-detail-media">
            <ImageCarousel images={images} alt={product.title || product.productName || ''} fit="contain" className="product-carousel" />
          </div>
        )}
        <p className="product-detail-price">{formatPrice(product.price)}</p>
        <p className="product-detail-desc">{product.description}</p>

        <div className="product-detail-facts">
          {location && <span>{location}</span>}
          <span className={stock > 0 ? 'fact-in-stock' : 'fact-out-stock'}>
            {stock > 0
              ? `พร้อมขาย ${stock.toLocaleString('th-TH')}${unit ? ` ${unit}` : ''}`
              : 'สอบถามสต็อก'}
          </span>
          {(product.isOTOP || product.isOtop || product.is_otop) && <span>OTOP</span>}
          {(product.isOrganic || product.is_organic) && <span>อินทรีย์</span>}
          {viewCount > 0 && (
            <span className="fact-views">
              <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              {viewCount.toLocaleString('th-TH')} ครั้ง
            </span>
          )}
        </div>

        <div className="product-card-meta product-detail-seller">
          <span className="product-card-seller">{sellerName}</span>
          {timeAgo(product.created_at || product.createdAt) && (
            <span className="product-card-time">{timeAgo(product.created_at || product.createdAt)}</span>
          )}
        </div>

        <div className="product-add-cart-row">
          <button className="cart-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="ลด">−</button>
          <span className="cart-qty-val">{qty}</span>
          <button className="cart-qty-btn" onClick={() => setQty((q) => q + 1)} aria-label="เพิ่ม">+</button>
          <button
            className="btn-add-cart"
            onClick={() => { addItem(product, qty); onClose() }}
          >
            เพิ่มลงตะกร้า
          </button>
        </div>

        <div className="product-contact-grid">
          {phone && <a className="product-contact-btn" href={`tel:${normalizePhone(phone)}`}>โทร</a>}
          {lineId && <a className="product-contact-btn line" href={lineUrl(lineId)} target="_blank" rel="noreferrer">LINE</a>}
          {facebook && <a className="product-contact-btn facebook" href={facebookUrl(facebook)} target="_blank" rel="noreferrer">Facebook</a>}
        </div>
        {!hasContact && (
          <p className="product-contact-empty">ผู้ขายยังไม่ได้เพิ่มช่องทางติดต่อ</p>
        )}
      </div>
    </div>
  )
}
