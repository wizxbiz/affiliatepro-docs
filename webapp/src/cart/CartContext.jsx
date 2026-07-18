import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'tuktuk_cart'

function firstDefined(...values) {
  return values.find((v) => v !== undefined && v !== null && v !== '') ?? ''
}

// Snapshot a product into a self-contained cart item (survives without re-fetch)
function toCartItem(product, qty) {
  const images = (() => {
    try {
      const raw = product.images
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(arr) ? arr.filter(Boolean) : []
    } catch { return [] }
  })()
  return {
    id: String(product.id),
    title: firstDefined(product.title, product.productName, product.product_name, 'สินค้า'),
    price: Number(product.price || 0),
    image: firstDefined(product.imageUrl, product.image_url, product.thumbnailUrl, images[0]),
    sellerId: firstDefined(product.sellerId, product.seller_id, product.lineUserId, 'unknown'),
    sellerName: firstDefined(product.sellerName, product.seller_name, product.display_name, 'ร้านค้า TukTuk'),
    sellerPhone: firstDefined(product.sellerPhone, product.seller_phone),
    sellerLineId: firstDefined(product.sellerLineId, product.seller_line_id),
    sellerFacebook: firstDefined(product.sellerFacebook, product.seller_facebook),
    qty: Math.max(1, qty || 1),
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch { return [] }
  })
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* quota/full — ignore */ }
  }, [items])

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }, [])

  const addItem = useCallback((product, qty = 1) => {
    const next = toCartItem(product, qty)
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === next.id)
      if (idx === -1) return [...prev, next]
      const copy = [...prev]
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + next.qty }
      return copy
    })
    showToast('เพิ่มลงตะกร้าแล้ว')
  }, [showToast])

  const setQty = useCallback((id, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((it) => it.id !== id)
      return prev.map((it) => (it.id === id ? { ...it, qty } : it))
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.reduce((n, it) => n + it.qty, 0), [items])
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items])

  const value = { items, count, subtotal, addItem, setQty, removeItem, clear, showToast }

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && <div className="app-toast" role="status">{toast}</div>}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
