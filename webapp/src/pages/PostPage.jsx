import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, uploadToR2 } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'

const MAX_FILES = 6
const MAX_FILE_MB = 100
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/quicktime,video/webm'

export default function PostPage() {
  const { user, checking } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('post') // post | product
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('general')
  const [files, setFiles] = useState([]) // { file, preview, progress, url|null, error|null }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const fileInput = useRef(null)

  if (checking) {
    return <div className="feed-status"><div className="spinner" /><p>กำลังตรวจสอบสถานะ…</p></div>
  }

  if (!user) {
    return (
      <div className="feed-status">
        <p>ต้องเข้าสู่ระบบก่อนจึงจะโพสต์ได้</p>
        <Link className="btn-primary" to="/login?redirect=/post">เข้าสู่ระบบ</Link>
      </div>
    )
  }

  function pickFiles(e) {
    setError('')
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    const room = MAX_FILES - files.length
    if (picked.length > room) setError(`เพิ่มได้อีก ${room} ไฟล์ (สูงสุด ${MAX_FILES})`)

    const accepted = picked.slice(0, room).flatMap((file) => {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`"${file.name}" ใหญ่เกิน ${MAX_FILE_MB}MB`)
        return []
      }
      return [{ file, preview: URL.createObjectURL(file), progress: 0, url: null, error: null }]
    })
    setFiles((prev) => [...prev, ...accepted])
  }

  function removeFile(index) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index]?.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function uploadAll() {
    const folder = mode === 'product' ? 'products' : 'community_posts'
    const results = []
    for (let i = 0; i < files.length; i++) {
      const entry = files[i]
      if (entry.url) { results.push(entry.url); continue } // อัปโหลดแล้ว (retry รอบก่อน)
      try {
        const url = await uploadToR2(entry.file, folder, (pct) => {
          setFiles((prev) => prev.map((f, j) => (j === i ? { ...f, progress: pct } : f)))
        })
        setFiles((prev) => prev.map((f, j) => (j === i ? { ...f, url, progress: 100 } : f)))
        results.push(url)
      } catch (err) {
        setFiles((prev) => prev.map((f, j) => (j === i ? { ...f, error: err.message } : f)))
        throw new Error(`อัปโหลด "${entry.file.name}" ไม่สำเร็จ: ${err.message}`)
      }
    }
    return results
  }

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'post' && !content.trim() && files.length === 0) {
      setError('กรุณาใส่ข้อความหรือเพิ่มรูป/วิดีโอ')
      return
    }
    if (mode === 'product') {
      if (!title.trim()) { setError('กรุณาใส่ชื่อสินค้า'); return }
      if (files.length === 0) { setError('กรุณาเพิ่มรูปสินค้าอย่างน้อย 1 รูป'); return }
      const n = Number(price)
      if (!Number.isFinite(n) || n < 0) { setError('กรุณาใส่ราคาให้ถูกต้อง'); return }
    }

    setBusy(true)
    try {
      const mediaUrls = await uploadAll()

      if (mode === 'post') {
        const res = await api.posts.create({ content: content.trim(), mediaUrls, category })
        setDone({ type: 'post', id: res.postId })
      } else {
        const res = await api.products.create({
          title: title.trim(),
          description: content.trim(),
          price: Number(price),
          images: mediaUrls,
          category,
        })
        setDone({ type: 'product', id: res.productId })
      }
    } catch (err) {
      setError(err.httpStatus === 401 ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : err.message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="feed-status">
        <p style={{ fontSize: '3rem', margin: 0 }}>🎉</p>
        <p>{done.type === 'post' ? 'โพสต์สำเร็จแล้ว!' : 'ลงขายสินค้าสำเร็จแล้ว!'}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={() => navigate(done.type === 'post' ? '/' : '/market')}>
            {done.type === 'post' ? 'ดูฟีด' : 'ดูตลาด'}
          </button>
          <button className="btn-ghost" onClick={() => {
            setDone(null); setContent(''); setTitle(''); setPrice(''); setFiles([])
          }}>โพสต์ต่อ</button>
        </div>
      </div>
    )
  }

  return (
    <div className="post-page">
      <div className="login-tabs post-mode-tabs">
        <button className={mode === 'post' ? 'active' : ''} onClick={() => setMode('post')}>📝 โพสต์ชุมชน</button>
        <button className={mode === 'product' ? 'active' : ''} onClick={() => setMode('product')}>🛍️ ลงขายสินค้า</button>
      </div>

      <form className="post-form" onSubmit={submit}>
        {mode === 'product' && (
          <>
            <input
              type="text"
              placeholder="ชื่อสินค้า"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="ราคา (บาท)"
              value={price}
              min="0"
              onChange={(e) => setPrice(e.target.value)}
            />
          </>
        )}

        <textarea
          placeholder={mode === 'post' ? 'คุณกำลังคิดอะไรอยู่…' : 'รายละเอียดสินค้า…'}
          value={content}
          rows={5}
          maxLength={5000}
          onChange={(e) => setContent(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="general">ทั่วไป</option>
          <option value="video">วิดีโอ</option>
          <option value="food">อาหาร</option>
          <option value="fashion">แฟชั่น</option>
          <option value="electronics">อิเล็กทรอนิกส์</option>
          <option value="otop">OTOP</option>
          <option value="services">บริการ</option>
        </select>

        <div className="post-media-grid">
          {files.map((f, i) => (
            <div key={f.preview} className="post-media-item">
              {f.file.type.startsWith('video/') ? (
                <video src={f.preview} muted />
              ) : (
                <img src={f.preview} alt="" />
              )}
              {busy && f.progress > 0 && f.progress < 100 && (
                <span className="post-media-progress">{f.progress}%</span>
              )}
              {f.url && <span className="post-media-ok">✓</span>}
              {f.error && <span className="post-media-err">!</span>}
              {!busy && (
                <button type="button" className="post-media-remove" onClick={() => removeFile(i)} aria-label="ลบ">✕</button>
              )}
            </div>
          ))}
          {files.length < MAX_FILES && !busy && (
            <button type="button" className="post-media-add" onClick={() => fileInput.current?.click()}>
              ＋<br /><small>รูป/วิดีโอ</small>
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept={ACCEPT} multiple hidden onChange={pickFiles} />

        {error && <p className="login-error">{error}</p>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'กำลังโพสต์…' : mode === 'post' ? 'โพสต์เลย' : 'ลงขายสินค้า'}
        </button>
      </form>
    </div>
  )
}
