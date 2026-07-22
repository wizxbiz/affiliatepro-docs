import { useRef, useState } from 'react'
import './ImageCarousel.css'

// ImageCarousel — เฟรมเลื่อนดูรูปหลายรูปแบบมืออาชีพ
// รองรับ: ปัด (touch), ลากเมาส์, ปุ่มลูกศร, จุดบอกตำแหน่ง, ตัวนับรูป
// ใช้ได้ทั้งฟีดหลักและการ์ดรายละเอียดสินค้า
export default function ImageCarousel({ images = [], alt = '', fit = 'cover', className = '' }) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0) // px ที่กำลังลากอยู่ (ตอนปัด)
  const startX = useRef(null)
  const trackRef = useRef(null)

  const count = images.length
  const clamp = (i) => Math.max(0, Math.min(count - 1, i))
  const go = (i) => setIndex(clamp(i))

  if (count === 0) return null
  if (count === 1) {
    return (
      <div className={`carousel carousel-single ${className}`}>
        <img src={images[0]} alt={alt} loading="lazy" style={{ objectFit: fit }} />
      </div>
    )
  }

  // ── gesture: ปัด/ลาก ──────────────────────────────
  const onStart = (x) => { startX.current = x; setDrag(0) }
  const onMove = (x) => {
    if (startX.current == null) return
    setDrag(x - startX.current)
  }
  const onEnd = () => {
    if (startX.current == null) return
    const width = trackRef.current?.offsetWidth || 1
    const threshold = Math.min(60, width * 0.15) // ปัดเกิน 15% หรือ 60px → เปลี่ยนรูป
    if (drag <= -threshold) go(index + 1)
    else if (drag >= threshold) go(index - 1)
    startX.current = null
    setDrag(0)
  }

  const trackStyle = {
    transform: `translate3d(calc(${-index * 100}% + ${drag}px), 0, 0)`,
    transition: startX.current == null ? 'transform 0.3s cubic-bezier(0.22,0.61,0.36,1)' : 'none',
  }

  return (
    <div className={`carousel ${className}`}>
      <div
        ref={trackRef}
        className="carousel-track"
        style={trackStyle}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => { e.preventDefault(); onStart(e.clientX) }}
        onMouseMove={(e) => startX.current != null && onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => startX.current != null && onEnd()}
      >
        {images.map((src, i) => (
          <div className="carousel-slide" key={src + i}>
            <img
              src={src}
              alt={alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
              style={{ objectFit: fit }}
            />
          </div>
        ))}
      </div>

      {/* ปุ่มลูกศร (ซ่อนที่ขอบ) */}
      {index > 0 && (
        <button className="carousel-arrow carousel-arrow-prev" onClick={() => go(index - 1)} aria-label="รูปก่อนหน้า">‹</button>
      )}
      {index < count - 1 && (
        <button className="carousel-arrow carousel-arrow-next" onClick={() => go(index + 1)} aria-label="รูปถัดไป">›</button>
      )}

      {/* ตัวนับรูป */}
      <div className="carousel-counter">{index + 1}/{count}</div>

      {/* จุดบอกตำแหน่ง */}
      <div className="carousel-dots">
        {images.map((src, i) => (
          <button
            key={src + i}
            className={`carousel-dot${i === index ? ' active' : ''}`}
            onClick={() => go(i)}
            aria-label={`ไปรูปที่ ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
