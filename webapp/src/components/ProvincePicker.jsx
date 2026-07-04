import { useMemo, useRef, useState } from 'react'
import { PROVINCES } from '../lib/provinces.js'

export default function ProvincePicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return PROVINCES
    return PROVINCES.filter(
      (p) => p.nameTh.includes(q) || p.nameEn.toLowerCase().includes(q)
    )
  }, [search])

  // ป้องกัน iOS Safari ไม่ fire click บน div — ใช้ pointer-events + role
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="เลือกจังหวัด"
      onClick={handleBackdrop}
      onTouchEnd={handleBackdrop}   // iOS Safari fallback
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* close bar ขนาดใหญ่ที่ด้านบน แตะได้ง่ายบนมือถือ */}
        <button className="modal-drag-close" onClick={onClose} aria-label="ปิด" />

        <div className="modal-header">
          <h3>📍 เลือกจังหวัด</h3>
          <button className="modal-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        <div className="modal-search-row">
          <input
            ref={inputRef}
            type="text"
            className="modal-search"
            placeholder="ค้นหาจังหวัด…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // ไม่ใช้ autoFocus — keyboard เปิดอัตโนมัติทำให้ close button หายออกนอกจอ
          />
          {search && (
            <button className="modal-search-clear" onClick={() => setSearch('')} aria-label="ล้าง">
              ✕
            </button>
          )}
        </div>

        <div className="province-list" role="listbox">
          {filtered.map((p) => (
            <button
              key={p.code}
              className="province-item"
              role="option"
              onClick={() => onSelect(p)}
            >
              {p.nameTh}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="login-hint" style={{ padding: '20px 0', textAlign: 'center' }}>
              ไม่พบจังหวัดที่ค้นหา
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
