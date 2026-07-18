import { parseImages, formatPrice, timeAgo } from '../lib/format.js'

export default function ProductCard({ product, onClick }) {
  const images = parseImages(product.images)
  const cover = images[0] || product.imageUrl || product.image_url
  const sellerName = product.display_name || product.sellerName || product.seller_name || 'ผู้ขาย TukTuk'
  const sellerAvatar = product.sellerPictureUrl || product.seller_picture || product.picture_url || ''
  const when = timeAgo(product.created_at || product.createdAt)

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
          {sellerAvatar ? (
            <img className="product-card-avatar" src={sellerAvatar} alt="" loading="lazy" />
          ) : (
            <span className="product-card-avatar product-card-avatar-fallback">{sellerName[0]}</span>
          )}
          <span className="product-card-seller">{sellerName}</span>
          {when && <span className="product-card-time">{when}</span>}
        </div>
      </div>
    </button>
  )
}
