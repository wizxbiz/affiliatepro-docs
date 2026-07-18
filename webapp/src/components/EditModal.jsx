import { useState } from 'react'
import { api } from '../api/client.js'
import { PROVINCES } from '../lib/provinces.js'

const CATEGORIES = [
  { key: 'general', label: 'ทั่วไป' },
  { key: 'video', label: 'วิดีโอ' },
  { key: 'food', label: 'อาหาร' },
  { key: 'fashion', label: 'แฟชั่น' },
  { key: 'electronics', label: 'อิเล็กทรอนิกส์' },
  { key: 'otop', label: 'OTOP' },
  { key: 'services', label: 'บริการ' },
]

// แก้ไขเฉพาะข้อความ/ข้อมูล — ไม่แตะ media (Phase 3 scope)
export default function EditModal({ kind, item, onSaved, onClose }) {
  const isPost = kind === 'post'

  const [content, setContent] = useState(item.content || item.description || '')
  const [category, setCategory] = useState(item.category || 'general')
  // product-only
  const [title, setTitle] = useState(item.title || item.productName || '')
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '')
  const [sellerLocation, setSellerLocation] = useState(item.sellerLocation || '')
  const [sellerPhone, setSellerPhone] = useState(item.sellerPhone || '')
  const [sellerLineId, setSellerLineId] = useState(item.sellerLineId || '')
  const [sellerFacebook, setSellerFacebook] = useState(item.sellerFacebook || '')
  const [productStock, setProductStock] = useState(item.productStock != null ? String(item.productStock) : '')
  const [productUnit, setProductUnit] = useState(item.productUnit || '')
  const [isOtop, setIsOtop] = useState(Boolean(item.isOtop))
  const [isOrganic, setIsOrganic] = useState(Boolean(item.isOrganic))

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')

    if (isPost) {
      if (!content.trim()) { setError('กรุณาใส่ข้อความ'); return }
    } else {
      if (!title.trim()) { setError('กรุณาใส่ชื่อสินค้า'); return }
      const n = Number(price)
      if (!Number.isFinite(n) || n < 0) { setError('กรุณาใส่ราคาให้ถูกต้อง'); return }
      const stock = productStock === '' ? 0 : Number(productStock)
      if (!Number.isFinite(stock) || stock < 0) { setError('จำนวนสินค้าไม่ถูกต้อง'); return }
    }

    setBusy(true)
    try {
      if (isPost) {
        const fields = { content: content.trim(), category }
        await api.posts.update(item.id, fields)
        onSaved({ ...fields })
      } else {
        const fields = {
          title: title.trim(),
          description: content.trim(),
          price: Number(price),
          category,
          sellerLocation,
          sellerPhone: sellerPhone.trim(),
          sellerLineId: sellerLineId.trim(),
          sellerFacebook: sellerFacebook.trim(),
          productStock: productStock === '' ? 0 : Number(productStock),
          productUnit: productUnit.trim(),
          isOtop,
          isOrganic,
        }
        await api.products.update(item.id, fields)
        // sync local shape (normalizeV1Product uses productName + title)
        onSaved({ ...fields, productName: fields.title })
      }
      onClose()
    } catch (err) {
      setError(err.httpStatus === 401 ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : (err.message || 'บันทึกไม่สำเร็จ'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet edit-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-drag-close" onClick={onClose} aria-label="ปิด" />
        <div className="modal-header">
          <h3>{isPost ? 'แก้ไขโพสต์' : 'แก้ไขสินค้า'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        <form className="edit-form" onSubmit={submit}>
          {!isPost && (
            <>
              <input type="text" placeholder="ชื่อสินค้า" value={title} maxLength={120}
                onChange={(e) => setTitle(e.target.value)} />
              <input type="number" inputMode="decimal" placeholder="ราคา (บาท)" value={price} min="0"
                onChange={(e) => setPrice(e.target.value)} />
            </>
          )}

          <textarea
            placeholder={isPost ? 'ข้อความโพสต์...' : 'รายละเอียดสินค้า...'}
            value={content} rows={4} maxLength={5000}
            onChange={(e) => setContent(e.target.value)}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {!isPost && (
            <>
              <select value={sellerLocation} onChange={(e) => setSellerLocation(e.target.value)}>
                <option value="">เลือกจังหวัด/พื้นที่ขาย</option>
                {PROVINCES.map((p) => <option key={p.code} value={p.nameTh}>{p.nameTh}</option>)}
              </select>
              <input type="tel" placeholder="เบอร์โทรผู้ขาย" value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)} />
              <input type="text" placeholder="LINE ID" value={sellerLineId}
                onChange={(e) => setSellerLineId(e.target.value)} />
              <input type="text" placeholder="Facebook / Page" value={sellerFacebook}
                onChange={(e) => setSellerFacebook(e.target.value)} />
              <input type="number" inputMode="numeric" placeholder="จำนวนพร้อมขาย" value={productStock} min="0"
                onChange={(e) => setProductStock(e.target.value)} />
              <input type="text" placeholder="หน่วย เช่น ชิ้น กก. กล่อง" value={productUnit}
                onChange={(e) => setProductUnit(e.target.value)} />
              <div className="post-check-row">
                <label><input type="checkbox" checked={isOtop} onChange={(e) => setIsOtop(e.target.checked)} /> OTOP</label>
                <label><input type="checkbox" checked={isOrganic} onChange={(e) => setIsOrganic(e.target.checked)} /> อินทรีย์</label>
              </div>
            </>
          )}

          {error && <p className="login-error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </form>
      </div>
    </div>
  )
}
