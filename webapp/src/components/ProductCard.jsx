import { parseImages, formatPrice, timeAgo } from '../lib/format.js'

export default function ProductCard({ product, onClick }) {
  const images = parseImages(product.images)
  const cover = images[0]

  return (
    <button className="product-card" onClick={() => onClick?.(product)}>
      <div className="product-card-media">
        {cover ? (
          <img src={cover} alt={product.title || ''} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">🛍️</div>
        )}
        {images.length > 1 && <span className="product-card-count">📷 {images.length}</span>}
      </div>
      <div className="product-card-body">
        <p className="product-card-title">{product.title || product.productName}</p>
        <p className="product-card-price">{formatPrice(product.price)}</p>
        <div className="product-card-meta">
          <span className="product-card-seller">{product.display_name || product.sellerName || 'ผู้ขาย TukTuk'}</span>
          <span className="product-card-time">{timeAgo(product.created_at || product.createdAt)}</span>
        </div>
      </div>
    </button>
  )
}
