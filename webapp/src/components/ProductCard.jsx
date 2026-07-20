import { useEffect, useRef } from 'react'
import { parseImages, formatPrice, timeAgo } from '../lib/format.js'
import { api } from '../api/client.js'

export default function ProductCard({ product, onClick }) {
  const images = parseImages(product.images)
  const cover = images[0] || product.imageUrl || product.image_url
  const sellerName = product.display_name || product.sellerName || product.seller_name || 'ผู้ขาย TukTuk'
  const sellerAvatar = product.sellerPictureUrl || product.seller_picture || product.picture_url || ''
  const when = timeAgo(product.created_at || product.createdAt)
  const stock = Number(product.productStock || product.product_stock || 0)
  const viewCount = Number(product.viewCount || product.views_count || 0)
  const cardRef = useRef(null)
  const timerRef = useRef(null)
  const viewedRef = useRef(false)

  useEffect(() => {
    if (!product.id || viewedRef.current) return
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timerRef.current = setTimeout(() => {
            if (viewedRef.current) return
            viewedRef.current = true
            api.products.view(product.id).catch(() => {/* silent */})
          }, 1500)
        } else {
          clearTimeout(timerRef.current)
        }
      },
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timerRef.current)
    }
  }, [product.id])

  return (
    <button ref={cardRef} className="product-card" onClick={() => onClick?.(product)}>
      <div className="product-card-media">
        {cover ? (
          <img src={cover} alt={product.title || ''} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">🛍️</div>
        )}
        {images.length > 1 && <span className="product-card-count">📷 {images.length}</span>}
        {stock > 0
          ? <span className="product-stock-badge in-stock">พร้อมขาย</span>
          : <span className="product-stock-badge out-stock">สอบถาม</span>
        }
      </div>
      <div className="product-card-body">
        <p className="product-card-title">{product.title || product.productName}</p>
        <p className="product-card-price">{formatPrice(product.price)}</p>
        <div className="product-card-meta">
          {sellerAvatar ? (
            <img className="product-card-avatar" src={sellerAvatar} alt="" loading="lazy" />
          ) : (
            <span className="product-card-avatar product-card-avatar-fallback">{sellerName[0]}</span>
          )}
          <span className="product-card-seller">{sellerName}</span>
          {when && <span className="product-card-time">{when}</span>}
          {viewCount > 0 && (
            <span className="product-card-views">
              <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" aria-hidden="true"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
