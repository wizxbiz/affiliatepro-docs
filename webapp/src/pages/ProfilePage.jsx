import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api, getToken } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import EditModal from '../components/EditModal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { parseImages } from '../lib/format.js'

function joinDate(ts) {
  const t = Number(ts)
  if (!t) return ''
  return new Date(t).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })
}

// การ์ดโพสต์สำหรับแสดงในหน้าโปรไฟล์ (2-column card layout)
function PostTile({ post, onClick, onOptionsClick, isSelf }) {
  const media = post.mediaUrls || post.media || []
  const ytUrl = post.youtubeUrl || post.videoEmbed || (typeof post.videoUrl === 'string' && post.videoUrl.includes('youtube') ? post.videoUrl : null)
  const ytMatch = ytUrl ? ytUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/) : null

  let thumb = null
  if (ytMatch) {
    thumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
  } else {
    const raw = post.thumbnailUrl
      || post.imageUrl
      || media.find((m) => m?.type === 'image')?.url
      || media.find((m) => m?.type === 'youtube')?.thumbnailUrl
      || parseImages(post.media_urls)[0]
      || ''
    
    if (raw && typeof raw === 'string' && !raw.endsWith('.mp4') && !raw.endsWith('.mov') && !raw.endsWith('.webm')) {
      thumb = raw
    }
  }

  const directVideo = (post.videoUrl && !ytMatch) ? post.videoUrl : null

  return (
    <div className="profile-tile-item" style={{ position: 'relative', width: '100%' }}>
      <button className="profile-tile" onClick={() => onClick?.(post)} style={{ width: '100%', aspectRatio: '3/4', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'block' }}>
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
        ) : directVideo ? (
          <video src={`${directVideo}#t=0.5`} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
        ) : (
          <div className="profile-tile-text">{post.content || post.title || 'โพสต์'}</div>
        )}

        {/* Gradient overlay on bottom for play icon & text */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {(ytMatch || directVideo) && (
              <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '12px', color: '#fff', fontWeight: 600 }}>▶ เล่นวิดีโอ</span>
            )}
            {post.status === 'private' && (
              <span style={{ fontSize: '0.65rem', background: 'rgba(255,193,7,0.9)', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>🔒 เฉพาะฉัน</span>
            )}
          </div>
          {post.content || post.title ? (
            <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {post.title || post.content}
            </div>
          ) : null}
        </div>
      </button>

      {/* Dedicated 3-Dots Button */}
      {isSelf && (
        <button
          type="button"
          className="profile-tile-menu-btn"
          title="ตัวเลือกโพสต์"
          onClick={(e) => { e.stopPropagation(); onOptionsClick?.(post); }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 20,
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(10, 14, 33, 0.8)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
          }}
        >
          ⋮
        </button>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isSelf = !id
  const targetId = id || user?.uid || user?.lineUserId

  const [profile, setProfile] = useState(isSelf ? user : null)
  const [tab, setTab] = useState('posts') // posts | products
  const [posts, setPosts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetPost, setSheetPost] = useState(null)  // own post tapped → action sheet
  const [editing, setEditing] = useState(null)       // post being edited
  const [deleting, setDeleting] = useState(null)      // post pending delete confirm
  const [delBusy, setDelBusy] = useState(false)

  // guest เปิด /profile ตัวเอง → ไป login
  useEffect(() => {
    if (isSelf && !getToken()) navigate('/login?redirect=/profile', { replace: true })
  }, [isSelf, navigate])

  const load = useCallback(async () => {
    if (!targetId) return
    setLoading(true)
    try {
      // public profile (คนอื่น) — ตัวเองใช้ข้อมูลจาก AuthContext
      if (!isSelf) {
        const data = await api.users.get(targetId).catch(() => null)
        if (data?.user) setProfile(data.user)
      }
      const [postRes, prodRes] = await Promise.all([
        api.users.posts(targetId, { limit: 30 }).catch(() => ({ posts: [] })),
        api.users.products(targetId, { limit: 30 }).catch(() => ({ items: [] })),
      ])
      setPosts(postRes.posts || [])
      setProducts(prodRes.items || [])
    } finally {
      setLoading(false)
    }
  }, [targetId, isSelf])

  useEffect(() => { load() }, [load])

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  // แตะการ์ดโพสต์ → เล่นวิดีโอทันที!
  function handleTilePress(post) {
    navigate(`/?post=${encodeURIComponent(post.id)}`)
  }

  // แตะปุ่มจุด 3 จุด (⋮) → เปิดเมนูตัวเลือกโพสต์ (แก้ไข / ความเป็นส่วนตัว / ลบ)
  function handleOptionsPress(post) {
    setSheetPost(post)
  }

  async function handleTogglePrivacy(post) {
    if (!post) return
    const nextStatus = post.status === 'private' ? 'active' : 'private'
    try {
      await api.posts.update(post.id, { status: nextStatus })
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)))
      setSheetPost(null)
    } catch (err) {
      alert(err.message || 'ไม่สามารถเปลี่ยนความเป็นส่วนตัวได้')
    }
  }

  function handlePostSaved(fields) {
    setPosts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...fields } : p)))
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleting) return
    setDelBusy(true)
    try {
      await api.posts.remove(deleting.id)
      setPosts((prev) => prev.filter((p) => p.id !== deleting.id))
      setDeleting(null)
    } catch (err) {
      console.warn('[Profile] delete', err)
      alert(err.httpStatus === 401 ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : (err.message || 'ลบไม่สำเร็จ'))
    } finally {
      setDelBusy(false)
    }
  }

  const displayName = profile?.displayName || profile?.display_name || 'ผู้ใช้ TukTuk'
  const avatar = profile?.pictureUrl || profile?.picture_url || ''
  const isSeller = (profile?.sellerStatus || profile?.seller_status) === 'verified'
  const isPremium = profile?.isPremium || profile?.is_premium === 1
  const joined = joinDate(profile?.createdAt || profile?.created_at)

  return (
    <div className="profile-page">
      <div className="profile-header">
        {avatar ? (
          <img className="profile-avatar" src={avatar} alt="" />
        ) : (
          <span className="profile-avatar profile-avatar-fallback">{displayName[0]}</span>
        )}
        <div className="profile-info">
          <h2 className="profile-name">
            {displayName}
            {isSeller && <span className="profile-badge seller">ร้านค้า</span>}
            {isPremium && <span className="profile-badge premium">พรีเมียม</span>}
          </h2>
          {joined && <p className="profile-joined">เข้าร่วมเมื่อ {joined}</p>}
          <div className="profile-counts">
            <span><strong>{posts.length}</strong> โพสต์</span>
            <span><strong>{products.length}</strong> สินค้า</span>
          </div>
        </div>
      </div>

      {isSelf && (
        <div className="profile-actions">
          {isSeller && (
            <Link className="profile-btn primary" to="/seller">แผงร้านค้า</Link>
          )}
          <button className="profile-btn" disabled title="เร็วๆ นี้">แก้ไขโปรไฟล์</button>
          <button className="profile-btn danger" onClick={handleLogout}>ออกจากระบบ</button>
        </div>
      )}

      <div className="profile-tabs">
        <button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
          โพสต์
        </button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          สินค้า
        </button>
      </div>

      {loading ? (
        <div className="profile-empty"><div className="spinner" /></div>
      ) : tab === 'posts' ? (
        posts.length === 0 ? (
          <div className="profile-empty">ยังไม่มีโพสต์</div>
        ) : (
          <div className="profile-grid">
            {posts.map((post) => (
              <PostTile
                key={post.id}
                post={post}
                onClick={handleTilePress}
                onOptionsClick={handleOptionsPress}
                isSelf={isSelf}
              />
            ))}
          </div>
        )
      ) : (
        products.length === 0 ? (
          <div className="profile-empty">ยังไม่มีสินค้า</div>
        ) : (
          <div className="profile-products">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={(p) => navigate(`/market?product=${encodeURIComponent(p.id)}`)}
              />
            ))}
          </div>
        )
      )}

      {sheetPost && (
        <div className="modal-backdrop" onClick={() => setSheetPost(null)}>
          <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-drag-close" onClick={() => setSheetPost(null)} aria-label="ปิด" />
            <button
              className="action-sheet-item"
              onClick={() => { const p = sheetPost; setSheetPost(null); navigate(`/?post=${encodeURIComponent(p.id)}`) }}
            >
              👁️ ดูโพสต์
            </button>
            <button
              className="action-sheet-item"
              onClick={() => { setEditing(sheetPost); setSheetPost(null) }}
            >
              ✏️ แก้ไขข้อความ
            </button>
            <button
              className="action-sheet-item"
              onClick={() => handleTogglePrivacy(sheetPost)}
            >
              {sheetPost.status === 'private' ? '🌐 เปลี่ยนเป็น สาธารณะ' : '🔒 เปลี่ยนเป็น เฉพาะฉัน (ส่วนตัว)'}
            </button>
            <button
              className="action-sheet-item danger"
              onClick={() => { setDeleting(sheetPost); setSheetPost(null) }}
            >
              🗑️ ลบโพสต์
            </button>
            <button className="action-sheet-item cancel" onClick={() => setSheetPost(null)}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {editing && (
        <EditModal
          kind="post"
          item={editing}
          onSaved={handlePostSaved}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="ลบโพสต์"
          message="ต้องการลบโพสต์นี้ใช่ไหม? การลบไม่สามารถย้อนกลับได้"
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
