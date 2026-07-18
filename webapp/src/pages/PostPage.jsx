import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, uploadToR2 } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { PROVINCES } from '../lib/provinces.js'
import { parseYouTube } from '../lib/youtube.js'

const MAX_FILES = 6
const MAX_FILE_MB = 100
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/quicktime,video/webm'

function mediaType(file) {
  return file?.type?.startsWith('video/') ? 'video' : 'image'
}

export default function PostPage() {
  const { user, checking } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('post') // post | product
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('general')
  const [sellerLocation, setSellerLocation] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [sellerLineId, setSellerLineId] = useState('')
  const [sellerFacebook, setSellerFacebook] = useState('')
  const [productStock, setProductStock] = useState('')
  const [productUnit, setProductUnit] = useState('')
  const [isOtop, setIsOtop] = useState(false)
  const [isOrganic, setIsOrganic] = useState(false)
  const [files, setFiles] = useState([]) // { file, preview, progress, url|null, error|null }
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const fileInput = useRef(null)
  const trimmedYoutubeUrl = youtubeUrl.trim()
  const youtubeMedia = parseYouTube(trimmedYoutubeUrl)
  const normalizedYoutubeUrl = youtubeMedia?.url || ''

  if (checking) {
    return <div className="feed-status"><div className="spinner" /><p>กำลังตรวจสอบสถานะ...</p></div>
  }

  if (!user) {
    return (
      <div className="feed-status">
        <p>ต้องเข้าสู่ระบบก่อนจึงจะโพสต์ได้</p>
        <Link className="btn-primary" to="/login?redirect=/post">เข้าสู่ระบบ</Link>
      </div>
    )
  }

  function pickFiles(event) {
    setError('')
    const picked = Array.from(event.target.files || [])
    event.target.value = ''
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

  function resetForm() {
    files.forEach((entry) => URL.revokeObjectURL(entry.preview))
    setContent('')
    setTitle('')
    setPrice('')
    setFiles([])
    setYoutubeUrl('')
    setSellerLocation('')
    setSellerPhone('')
    setSellerLineId('')
    setSellerFacebook('')
    setProductStock('')
    setProductUnit('')
    setIsOtop(false)
    setIsOrganic(false)
  }

  async function uploadAll() {
    const folder = mode === 'product' ? 'products' : 'community_posts'
    const results = []
    for (let index = 0; index < files.length; index++) {
      const entry = files[index]
      if (entry.url) {
        results.push({ url: entry.url, type: mediaType(entry.file) })
        continue
      }
      try {
        const url = await uploadToR2(entry.file, folder, (pct) => {
          setFiles((prev) => prev.map((file, j) => (j === index ? { ...file, progress: pct } : file)))
        })
        setFiles((prev) => prev.map((file, j) => (j === index ? { ...file, url, progress: 100 } : file)))
        results.push({ url, type: mediaType(entry.file) })
      } catch (err) {
        setFiles((prev) => prev.map((file, j) => (j === index ? { ...file, error: err.message } : file)))
        throw new Error(`อัปโหลด "${entry.file.name}" ไม่สำเร็จ: ${err.message}`)
      }
    }
    return results
  }

  async function submit(event) {
    event.preventDefault()
    setError('')

    // INVALID_YOUTUBE_LOCAL
    if (trimmedYoutubeUrl && !youtubeMedia) {
      setError('ลิงก์ YouTube ไม่ถูกต้อง')
      return
    }

    if (mode === 'post' && !content.trim() && files.length === 0 && !normalizedYoutubeUrl) {
      setError('กรุณาใส่ข้อความ เพิ่มรูป/วิดีโอ หรือวางลิงก์ YouTube')
      return
    }
    if (mode === 'product') {
      if (!title.trim()) { setError('กรุณาใส่ชื่อสินค้า'); return }
      if (!files.some((entry) => mediaType(entry.file) === 'image')) { setError('กรุณาเพิ่มรูปสินค้าอย่างน้อย 1 รูป'); return }
      const n = Number(price)
      if (!Number.isFinite(n) || n < 0) { setError('กรุณาใส่ราคาให้ถูกต้อง'); return }
      if (!sellerLocation) { setError('กรุณาเลือกจังหวัด/พื้นที่ขาย'); return }
      if (!sellerPhone.trim() && !sellerLineId.trim() && !sellerFacebook.trim()) {
        setError('กรุณาใส่ช่องทางติดต่ออย่างน้อย 1 ช่องทาง')
        return
      }
      const stock = productStock === '' ? 0 : Number(productStock)
      if (!Number.isFinite(stock) || stock < 0) { setError('กรุณาใส่จำนวนสินค้าให้ถูกต้อง'); return }
    }

    setBusy(true)
    try {
      const uploaded = await uploadAll()

      if (mode === 'post') {
        const mediaUrls = uploaded.map((item) => ({ type: item.type, url: item.url }))
        if (youtubeMedia) {
          mediaUrls.push({
            type: 'youtube',
            kind: youtubeMedia.type,
            url: youtubeMedia.url,
            youtubeId: youtubeMedia.youtubeId || '',
            playlistId: youtubeMedia.playlistId || '',
            embedUrl: youtubeMedia.embedUrl,
            thumbnailUrl: youtubeMedia.thumbnailUrl,
          })
        }
        const res = await api.posts.create({
          content: content.trim(),
          mediaUrls,
          youtubeUrl: normalizedYoutubeUrl,
          category: normalizedYoutubeUrl && category === 'general' ? 'video' : category,
        })
        setDone({ type: 'post', id: res.postId })
      } else {
        const imageUrls = uploaded.filter((item) => item.type === 'image').map((item) => item.url)
        const videoUrl = normalizedYoutubeUrl || uploaded.find((item) => item.type === 'video')?.url || ''
        const res = await api.products.create({
          title: title.trim(),
          description: content.trim(),
          price: Number(price),
          images: imageUrls,
          category,
          sellerLocation,
          sellerPhone: sellerPhone.trim(),
          sellerLineId: sellerLineId.trim(),
          sellerFacebook: sellerFacebook.trim(),
          productStock: productStock === '' ? 0 : Number(productStock),
          productUnit: productUnit.trim(),
          isOTOP: isOtop,
          isOtop,
          isOrganic,
          videoUrl,
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
        <p style={{ fontSize: '3rem', margin: 0 }}>สำเร็จ</p>
        <p>{done.type === 'post' ? 'โพสต์สำเร็จแล้ว' : 'ลงขายสินค้าสำเร็จแล้ว'}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={() => navigate(done.type === 'post' ? '/' : `/market?product=${done.id}`)}>
            {done.type === 'post' ? 'ดูฟีด' : 'ดูสินค้า'}
          </button>
          <button className="btn-ghost" onClick={() => { setDone(null); resetForm() }}>โพสต์ต่อ</button>
        </div>
      </div>
    )
  }

  return (
    <div className="post-page">
      <div className="login-tabs post-mode-tabs">
        <button className={mode === 'post' ? 'active' : ''} onClick={() => setMode('post')}>โพสต์ชุมชน</button>
        <button className={mode === 'product' ? 'active' : ''} onClick={() => setMode('product')}>ลงขายสินค้า</button>
      </div>

      <form className="post-form" onSubmit={submit}>
        {mode === 'product' && (
          <>
            <input
              type="text"
              placeholder="ชื่อสินค้า"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="ราคา (บาท)"
              value={price}
              min="0"
              onChange={(event) => setPrice(event.target.value)}
            />
          </>
        )}

        <textarea
          placeholder={mode === 'post' ? 'คุณกำลังคิดอะไรอยู่...' : 'รายละเอียดสินค้า...'}
          value={content}
          rows={5}
          maxLength={5000}
          onChange={(event) => setContent(event.target.value)}
        />

        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="general">ทั่วไป</option>
          <option value="video">วิดีโอ</option>
          <option value="food">อาหาร</option>
          <option value="fashion">แฟชั่น</option>
          <option value="electronics">อิเล็กทรอนิกส์</option>
          <option value="otop">OTOP</option>
          <option value="services">บริการ</option>
        </select>

        <input
          type="url"
          inputMode="url"
          placeholder="วางลิงก์ YouTube, Shorts หรือ Playlist"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
        />
        {trimmedYoutubeUrl && (
          <div className={`post-youtube-preview${youtubeMedia ? '' : ' invalid'}`}>
            {youtubeMedia ? (
              <>
                <img src={youtubeMedia.thumbnailUrl} alt="" />
                <div>
                  <strong>{youtubeMedia.type === 'playlist' ? 'YouTube Playlist' : 'YouTube'}</strong>
                  <span>{normalizedYoutubeUrl}</span>
                </div>
              </>
            ) : (
              <span>ลิงก์ YouTube ไม่ถูกต้อง</span>
            )}
          </div>
        )}
        {mode === 'product' && (
          <div className="post-commerce-fields">
            <select value={sellerLocation} onChange={(event) => setSellerLocation(event.target.value)}>
              <option value="">เลือกจังหวัด/พื้นที่ขาย</option>
              {PROVINCES.map((province) => (
                <option key={province.code} value={province.nameTh}>{province.nameTh}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="เบอร์โทรผู้ขาย"
              value={sellerPhone}
              onChange={(event) => setSellerPhone(event.target.value)}
            />
            <input
              type="text"
              placeholder="LINE ID"
              value={sellerLineId}
              onChange={(event) => setSellerLineId(event.target.value)}
            />
            <input
              type="text"
              placeholder="Facebook / Page"
              value={sellerFacebook}
              onChange={(event) => setSellerFacebook(event.target.value)}
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="จำนวนพร้อมขาย"
              value={productStock}
              min="0"
              onChange={(event) => setProductStock(event.target.value)}
            />
            <input
              type="text"
              placeholder="หน่วย เช่น ชิ้น กก. กล่อง"
              value={productUnit}
              onChange={(event) => setProductUnit(event.target.value)}
            />
            <div className="post-check-row">
              <label><input type="checkbox" checked={isOtop} onChange={(event) => setIsOtop(event.target.checked)} /> OTOP</label>
              <label><input type="checkbox" checked={isOrganic} onChange={(event) => setIsOrganic(event.target.checked)} /> อินทรีย์</label>
            </div>
          </div>
        )}

        <div className="post-media-grid">
          {files.map((file, index) => (
            <div key={file.preview} className="post-media-item">
              {file.file.type.startsWith('video/') ? (
                <video src={file.preview} muted />
              ) : (
                <img src={file.preview} alt="" />
              )}
              {busy && file.progress > 0 && file.progress < 100 && (
                <span className="post-media-progress">{file.progress}%</span>
              )}
              {file.url && <span className="post-media-ok">✓</span>}
              {file.error && <span className="post-media-err">!</span>}
              {!busy && (
                <button type="button" className="post-media-remove" onClick={() => removeFile(index)} aria-label="ลบ">×</button>
              )}
            </div>
          ))}
          {files.length < MAX_FILES && !busy && (
            <button type="button" className="post-media-add" onClick={() => fileInput.current?.click()}>
              +<br /><small>รูป/วิดีโอ</small>
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept={ACCEPT} multiple hidden onChange={pickFiles} />

        {error && <p className="login-error">{error}</p>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'กำลังโพสต์...' : mode === 'post' ? 'โพสต์เลย' : 'ลงขายสินค้า'}
        </button>
      </form>
    </div>
  )
}
