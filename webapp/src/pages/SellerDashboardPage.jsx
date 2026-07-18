import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken } from '../api/client.js'
import ProductCard from '../components/ProductCard.jsx'
import EditModal from '../components/EditModal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

const STAT_CARDS = [
  { key: 'total', label: 'ทั้งหมด' },
  { key: 'active', label: 'กำลังขาย' },
  { key: 'outOfStock', label: 'ของหมด' },
  { key: 'totalViews', label: 'ยอดวิว' },
]

export default function SellerDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [editing, setEditing] = useState(null)   // product being edited
  const [deleting, setDeleting] = useState(null)  // product pending delete confirm
  const [delBusy, setDelBusy] = useState(false)

  // ต้อง login ก่อน
  useEffect(() => {
    if (!getToken()) navigate('/login?redirect=/seller', { replace: true })
  }, [navigate])

  const load = useCallback(async () => {
    setState('loading')
    try {
      const [statRes, prodRes] = await Promise.all([
        api.seller.stats().catch(() => ({ stats: null })),
        api.seller.products({ limit: 50 }),
      ])
      setStats(statRes.stats)
      setProducts(prodRes.items || [])
      setState('ready')
    } catch (err) {
      console.warn('[Seller]', err)
      setState('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleSaved(id, fields) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)))
    setEditing(null)
    // ยอด active/ของหมด อาจเปลี่ยนถ้าแก้ stock → refresh stats เงียบๆ
    api.seller.stats().then((r) => setStats(r.stats)).catch(() => {})
  }

  async function handleDelete() {
    if (!deleting) return
    setDelBusy(true)
    try {
      await api.products.remove(deleting.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleting.id))
      setDeleting(null)
      api.seller.stats().then((r) => setStats(r.stats)).catch(() => {})
    } catch (err) {
      console.warn('[Seller] delete', err)
      alert(err.httpStatus === 401 ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : (err.message || 'ลบไม่สำเร็จ'))
    } finally {
      setDelBusy(false)
    }
  }

  return (
    <div className="seller-page">
      <div className="seller-head">
        <h2>แผงร้านค้าของฉัน</h2>
        <button className="seller-add-btn" onClick={() => navigate('/post')}>➕ ลงสินค้าใหม่</button>
      </div>

      <div className="seller-stats">
        {STAT_CARDS.map((card) => (
          <div className="seller-stat-card" key={card.key}>
            <span className="seller-stat-value">
              {stats ? Number(stats[card.key] || 0).toLocaleString('th-TH') : '—'}
            </span>
            <span className="seller-stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      {state === 'loading' ? (
        <div className="profile-empty"><div className="spinner" /></div>
      ) : state === 'error' ? (
        <div className="profile-empty">
          โหลดข้อมูลไม่สำเร็จ
          <button className="profile-btn" onClick={load} style={{ marginTop: 12 }}>ลองใหม่</button>
        </div>
      ) : products.length === 0 ? (
        <div className="profile-empty">
          ยังไม่มีสินค้า
          <button className="profile-btn primary" onClick={() => navigate('/post')} style={{ marginTop: 12 }}>
            ลงสินค้าชิ้นแรก
          </button>
        </div>
      ) : (
        <div className="seller-products">
          {products.map((product) => (
            <div className="seller-product-wrap" key={product.id}>
              <ProductCard
                product={product}
                onClick={(p) => navigate(`/market?product=${encodeURIComponent(p.id)}`)}
              />
              {product.status && product.status !== 'active' && (
                <span className={`seller-product-status ${product.status}`}>
                  {product.status === 'sold' ? 'ขายแล้ว' : product.status === 'deleted' ? 'ลบแล้ว' : product.status}
                </span>
              )}
              <div className="seller-product-actions">
                <button className="seller-act-btn" onClick={() => setEditing(product)}>แก้ไข</button>
                <button className="seller-act-btn danger" onClick={() => setDeleting(product)}>ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          kind="product"
          item={editing}
          onSaved={(fields) => handleSaved(editing.id, fields)}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="ลบสินค้า"
          message={`ต้องการลบ "${deleting.title || deleting.productName || 'สินค้านี้'}" ใช่ไหม? การลบไม่สามารถย้อนกลับได้`}
          confirmLabel="ลบ"
          danger
          busy={delBusy}
          onConfirm={handleDelete}
          onClose={() => (delBusy ? null : setDeleting(null))}
        />
      )}
    </div>
  )
}
