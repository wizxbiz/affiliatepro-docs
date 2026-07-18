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

// การ์ดโพสต์แบบเรียบ (ไม่ใช้ FeedItem เพราะนั่นเป็น full-screen reel)
function PostTile({ post, onClick }) {
  const media = post.mediaUrls || post.media || []
  const thumb = post.thumbnailUrl
    || media.find((m) => m?.type === 'image')?.url
    || media.find((m) => m?.type === 'youtube')?.thumbnailUrl
    || parseImages(post.media_urls)[0]
    || ''
  return (
    <button className="profile-tile" onClick={() => onClick?.(post)}>
      {thumb ? (
        <img src={thumb} alt="" loading="lazy" />
      ) : (
        <div className="profile-tile-text">{post.content || post.title || 'โพสต์'}</div>
      )}
      {media.some((m) => m?.type === 'youtube' || m?.type === 'video') && (
        <span className="profile-tile-play">▶</span>
      )}
    </button>
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

  // แตะโพสต์ตัวเอง → action sheet; โพสต์คนอื่น → ไปดูในฟีด
  function handleTilePress(post) {
    if (isSelf) setSheetPost(post)
    else navigate(`/?post=${encodeURIComponent(post.id)}`)
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
              ดูโพสต์
            </button>
            <button
              className="action-sheet-item"
              onClick={() => { setEditing(sheetPost); setSheetPost(null) }}
            >
              แก้ไข
            </button>
            <button
              className="action-sheet-item danger"
              onClick={() => { setDeleting(sheetPost); setSheetPost(null) }}
            >
              ลบ
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
