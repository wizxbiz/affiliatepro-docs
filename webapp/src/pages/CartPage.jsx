import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../cart/CartContext.jsx'
import { formatPrice } from '../lib/format.js'

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '')
}

function lineUrl(raw) {
  const val = String(raw || '').trim()
  if (!val) return ''
  if (/^https?:\/\//i.test(val)) return val
  const id = val.replace(/^[@~]/, '')
  return `https://line.me/ti/p/${val.startsWith('@') ? '@' : '~'}${encodeURIComponent(id)}`
}

// Group cart items by sellerId
function groupBySeller(items) {
  const map = new Map()
  for (const item of items) {
    if (!map.has(item.sellerId)) {
      map.set(item.sellerId, {
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerPhone: item.sellerPhone,
        sellerLineId: item.sellerLineId,
        sellerFacebook: item.sellerFacebook,
        items: [],
      })
    }
    map.get(item.sellerId).items.push(item)
  }
  return [...map.values()]
}

function CartItem({ item, onQty, onRemove }) {
  return (
    <div className="cart-item">
      {item.image
        ? <img className="cart-item-img" src={item.image} alt="" />
        : <div className="cart-item-img cart-item-img-placeholder" aria-hidden="true" />
      }
      <div className="cart-item-info">
        <p className="cart-item-title">{item.title}</p>
        <p className="cart-item-price">{formatPrice(item.price)}</p>
        <div className="cart-item-qty-row">
          <button
            className="cart-qty-btn"
            onClick={() => onQty(item.id, item.qty - 1)}
            aria-label="ลดจำนวน"
          >−</button>
          <span className="cart-qty-val">{item.qty}</span>
          <button
            className="cart-qty-btn"
            onClick={() => onQty(item.id, item.qty + 1)}
            aria-label="เพิ่มจำนวน"
          >+</button>
          <button
            className="cart-remove-btn"
            onClick={() => onRemove(item.id)}
            aria-label="ลบสินค้า"
          >ลบ</button>
        </div>
      </div>
      <p className="cart-item-subtotal">{formatPrice(item.price * item.qty)}</p>
    </div>
  )
}

function SellerGroup({ group, onQty, onRemove }) {
  const [open, setOpen] = useState(false)
  const total = group.items.reduce((s, it) => s + it.price * it.qty, 0)
  const hasPhone = Boolean(group.sellerPhone)
  const hasLine = Boolean(group.sellerLineId)

  const orderText = group.items
    .map((it) => `${it.title} x${it.qty} (${formatPrice(it.price * it.qty)})`)
    .join('\n') + `\n\nรวมทั้งหมด: ${formatPrice(total)}`

  return (
    <div className="cart-shop-group">
      <div className="cart-shop-header">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V8q-2.67 2-5.33 0-2.67 2-5.33 0Q6.67 10 4 8z"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M6 9.4q1.75 1 3.5 0 1.75 1 3.5 0 1.4.8 2.8.3V19.5A1.5 1.5 0 0 1 14.3 21H9.7A1.5 1.5 0 0 1 8.2 19.5v-4.6h-.4a1 1 0 0 1-1-1V9.7q-.4.05-.8-.3zm3.7 5.5v4.4h4.6v-4.4z"/>
        </svg>
        <span className="cart-shop-name">{group.sellerName}</span>
      </div>

      <div className="cart-items-list">
        {group.items.map((item) => (
          <CartItem key={item.id} item={item} onQty={onQty} onRemove={onRemove} />
        ))}
      </div>

      <div className="cart-shop-footer">
        <span className="cart-shop-total">รวมร้านนี้ {formatPrice(total)}</span>
        <button className="cart-checkout-btn" onClick={() => setOpen(true)}>
          ติดต่อสั่งซื้อ
        </button>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-sheet cart-contact-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="modal-drag-close" onClick={() => setOpen(false)} aria-label="ปิด" />
            <div className="modal-header">
              <h3>สั่งซื้อจาก {group.sellerName}</h3>
              <button className="modal-close" onClick={() => setOpen(false)} aria-label="ปิด">×</button>
            </div>
            <p className="cart-contact-summary">{orderText}</p>
            <div className="cart-contact-actions">
              {hasPhone && (
                <a
                  className="product-contact-btn"
                  href={`sms:${normalizePhone(group.sellerPhone)}?body=${encodeURIComponent('สนใจสั่งซื้อครับ/ค่ะ:\n' + orderText)}`}
                >
                  โทร / SMS
                </a>
              )}
              {hasLine && (
                <a
                  className="product-contact-btn line"
                  href={lineUrl(group.sellerLineId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  LINE
                </a>
              )}
              {!hasPhone && !hasLine && (
                <p className="product-contact-empty">ผู้ขายยังไม่ได้เพิ่มช่องทางติดต่อ</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CartPage() {
  const { items, subtotal, setQty, removeItem, clear } = useCart()
  const navigate = useNavigate()
  const groups = groupBySeller(items)

  if (items.length === 0) {
    return (
      <div className="cart-page cart-empty">
        <div className="cart-empty-icon" aria-hidden="true">🛒</div>
        <p className="cart-empty-text">ตะกร้าของคุณว่างเปล่า</p>
        <button className="btn-primary" onClick={() => navigate('/market')}>
          ดูสินค้าในตลาด
        </button>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-body">
        {groups.map((group) => (
          <SellerGroup
            key={group.sellerId}
            group={group}
            onQty={setQty}
            onRemove={removeItem}
          />
        ))}
      </div>
      <div className="cart-summary-bar">
        <div className="cart-summary-row">
          <span>รวมทั้งหมด</span>
          <span className="cart-grand-total">{formatPrice(subtotal)}</span>
        </div>
        <button
          className="cart-clear-btn"
          onClick={clear}
          aria-label="ล้างตะกร้าทั้งหมด"
        >
          ล้างตะกร้า
        </button>
      </div>
    </div>
  )
}
