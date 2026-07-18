import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkedProduct = searchParams.get('product')

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
        <input
          type="search"
          placeholder="ค้นหาสินค้า..."
          defaultValue={search}
          onKeyDown={(event) => { if (event.key === 'Enter') setSearch(event.target.value.trim()) }}
        />
      </div>

      <div className="market-cats">
        {CATEGORIES.map((item) => (
          <button
            key={item.key}
            className={category === item.key ? 'active' : ''}
            onClick={() => setCategory(item.key)}
          >
            {item.label}
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

      {state === 'ready' && (
        <>
          <div className="market-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onClick={openProduct} />
            ))}
          </div>
          {products.length === 0 && (
            <div className="feed-status"><p>ยังไม่มีสินค้าในหมวดนี้</p></div>
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
  const [imgIndex, setImgIndex] = useState(0)
  const phone = firstDefined(product.sellerPhone, product.seller_phone)
  const lineId = firstDefined(product.sellerLineId, product.seller_line_id)
  const facebook = firstDefined(product.sellerFacebook, product.seller_facebook)
  const location = firstDefined(product.sellerLocation, product.seller_location, product.province)
  const stock = Number(firstDefined(product.productStock, product.product_stock, 0) || 0)
  const unit = firstDefined(product.productUnit, product.product_unit)
  const sellerName = firstDefined(product.sellerName, product.seller_name, product.display_name, 'ผู้ขาย TukTuk')
  const hasContact = Boolean(phone || lineId || facebook)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet modal-product" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{product.title || product.productName}</h3>
          <button className="modal-close" onClick={onClose} aria-label="ปิด">×</button>
        </div>
        {images.length > 0 && (
          <div className="product-detail-media">
            <img src={images[Math.min(imgIndex, images.length - 1)]} alt="" />
            {images.length > 1 && (
              <div className="product-detail-thumbs">
                {images.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className={index === imgIndex ? 'active' : ''}
                    onClick={() => setImgIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <p className="product-detail-price">{formatPrice(product.price)}</p>
        <p className="product-detail-desc">{product.description}</p>

        <div className="product-detail-facts">
          {location && <span>{location}</span>}
          <span>{stock > 0 ? `พร้อมขาย ${stock.toLocaleString('th-TH')}${unit ? ` ${unit}` : ''}` : 'สอบถามสต็อก'}</span>
          {(product.isOTOP || product.isOtop || product.is_otop) && <span>OTOP</span>}
          {(product.isOrganic || product.is_organic) && <span>อินทรีย์</span>}
        </div>

        <div className="product-card-meta product-detail-seller">
          <span>{sellerName}</span>
          <span>{timeAgo(product.created_at || product.createdAt)}</span>
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
