import { useEffect, useRef, useState } from 'react'
import { formatPrice } from '../lib/format.js'
import { parseYouTube } from '../lib/youtube.js'
import { api, getToken } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'

function parseList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value !== 'string') return [value].filter(Boolean)
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean)
  } catch {
    return [value].filter(Boolean)
  }
}

function entryUrl(entry) {
  return typeof entry === 'string' ? entry : entry?.url || entry?.embedUrl || ''
}

// Resolve media เดียวที่ active สำหรับ feed card
function resolveMedia(item) {
  const images = parseList(item.images)
  const media = parseList(item.media || item.mediaUrls)
  const imageMedia = media.find((entry) => {
    const type = typeof entry === 'object' ? entry?.type : ''
    const url = entryUrl(entry)
    return type === 'image' || (url && !parseYouTube(url) && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url))
  })
  const imgUrl = item.thumbnailUrl || item.imageUrl || item.productThumb || images[0] || entryUrl(imageMedia) || ''

  const youtubeEntry = [
    item.youtubeUrl,
    item.videoEmbed,
    item.videoUrl,
    ...media,
  ].find((entry) => {
    const url = entryUrl(entry) || entry
    return (typeof entry === 'object' && (entry?.youtubeId || entry?.playlistId || entry?.embedUrl)) || parseYouTube(url)
  })

  if (youtubeEntry) {
    const parsed = typeof youtubeEntry === 'object' && (youtubeEntry.youtubeId || youtubeEntry.playlistId || youtubeEntry.embedUrl)
      ? {
          youtubeId: youtubeEntry.youtubeId || '',
          playlistId: youtubeEntry.playlistId || '',
          embedUrl: youtubeEntry.embedUrl || '',
          thumbnailUrl: youtubeEntry.thumbnailUrl || '',
        }
      : parseYouTube(entryUrl(youtubeEntry) || youtubeEntry)
    if (parsed) {
      return {
        kind: 'youtube',
        ytId: parsed.youtubeId || '',
        playlistId: parsed.playlistId || '',
        embedUrl: parsed.embedUrl,
        poster: parsed.thumbnailUrl || imgUrl,
      }
    }
  }

  const directVideo = [item.videoUrl, ...media].find((entry) => {
    const type = typeof entry === 'object' ? entry?.type : ''
    const url = entryUrl(entry) || entry
    return url && (type === 'video' || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url))
  })
  if (directVideo) return { kind: 'video', src: entryUrl(directVideo) || directVideo, poster: imgUrl }

  if (imgUrl) return { kind: 'image', src: imgUrl }
  return null
}

function marketUrl(item) {
  if (item.ctaUrl) return item.ctaUrl
  const productId = item.productId || item.linkedProductId
  return productId ? `/app/market?product=${encodeURIComponent(productId)}` : ''
}

function FeedIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 4.6c-1.7-1.8-4.5-1.8-6.2 0L12 7.2 9.4 4.6c-1.7-1.8-4.5-1.8-6.2 0-1.8 1.9-1.8 4.9 0 6.7L12 20l8.8-8.7c1.8-1.8 1.8-4.8 0-6.7z" />
    </svg>
  )
}

function CommentIcon() {
  return <FeedIcon><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.8-.9L3 20l1.4-4.3A8 8 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" /></FeedIcon>
}

function ShareIcon() {
  return <FeedIcon><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v14" /></FeedIcon>
}

function BagIcon() {
  return <FeedIcon><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></FeedIcon>
}

function VolumeIcon({ muted = false }) {
  return muted
    ? <FeedIcon><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="m23 9-6 6" /><path d="m17 9 6 6" /></FeedIcon>
    : <FeedIcon><path d="M11 5 6 9H3v6h3l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></FeedIcon>
}

export default function FeedItem({ item, active, onCommentClick }) {
  const { user } = useAuth()
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [likeCount, setLikeCount] = useState(item.likes ?? item.likes_count ?? 0)
  const resolved = resolveMedia(item)
  const ctaUrl = marketUrl(item)
  const isProduct = item.type === 'product'
  const hasCommerce = isProduct || Boolean(item.linkedProductId || item.productName || ctaUrl)
  const commercePrice = isProduct ? item.price : item.productPrice
  const stockText = Number(item.productStock || 0) > 0
    ? `พร้อมขาย ${Number(item.productStock).toLocaleString('th-TH')}${item.productUnit ? ` ${item.productUnit}` : ''}`
    : ''

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (active) {
      video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [active])

  const currentUserId = user?.uid || user?.lineUserId

  // Fetch initial liked state on mount if logged in
  useEffect(() => {
    if (item.likedByMe !== undefined) {
      setLiked(item.likedByMe)
    } else if (item.likes_list && Array.isArray(item.likes_list) && currentUserId) {
      setLiked(item.likes_list.includes(currentUserId))
    }
  }, [item, currentUserId])

  function currentAppPath(extraParams = {}) {
    const url = new URL(window.location.href)
    Object.entries(extraParams).forEach(([key, value]) => url.searchParams.set(key, value))
    return `${url.pathname}${url.search}${url.hash}`
  }

  function loginRedirect(extraParams = {}) {
    const redirect = currentAppPath(extraParams).replace(/^\/app/, '') || '/'
    return `/app/login?redirect=${encodeURIComponent(redirect)}`
  }

  function handleLike() {
    if (!getToken()) {
      window.location.href = loginRedirect({ post: item.id })
      return
    }
    if (likeBusy) return

    const previousLiked = liked
    const previousCount = likeCount
    const next = !liked
    setLikeBusy(true)
    setLiked(next)
    setLikeCount((c) => next ? c + 1 : Math.max(0, c - 1))
    api.posts.like(item.id)
      .then((data) => {
        if (typeof data.liked === 'boolean') setLiked(data.liked)
        if (typeof data.likes === 'number') setLikeCount(data.likes)
      })
      .catch((err) => {
        console.warn('[FeedItem] Like failed:', err)
        setLiked(previousLiked)
        setLikeCount(previousCount)
      })
      .finally(() => setLikeBusy(false))
  }

  function handleShare() {
    const url = `${window.location.origin}/app?post=${encodeURIComponent(item.id)}&comments=1`
    const text = (item.content || item.title || item.productName || 'TukTuk Feed').slice(0, 120)
    if (navigator.share) {
      navigator.share({ title: 'TukTuk Feed', text, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        // brief visual feedback handled by button active state
      }).catch(() => {
        prompt('คัดลอกลิงก์:', url)
      })
    }
  }

  function handleComment() {
    if (!getToken()) {
      window.location.href = loginRedirect({ post: item.id, comments: '1' })
      return
    }
    if (onCommentClick) {
      onCommentClick(item.id)
    } else {
      // Fallback redirect
      window.location.href = `/app?post=${encodeURIComponent(item.id)}&comments=1`
    }
  }

  const showMuteBtn = resolved?.kind === 'video' || (resolved?.kind === 'youtube' && active)
  const commentCount = item.commentsCount ?? item.comments_count ?? 0

  return (
    <article className="feed-item" data-id={item.id}>
      <div className="feed-media" style={{ overflow: 'hidden' }}>
        {!resolved && <div className="feed-media-placeholder">TukTuk</div>}

        {resolved?.kind === 'youtube' && active && (
          <iframe
            src={`${resolved.embedUrl}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1${resolved.ytId ? `&loop=1&playlist=${resolved.ytId}` : ''}&rel=0&modestbranding=1`}
            title={item.content?.slice(0, 40) || 'video'}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{
              minWidth: '100%',
              minHeight: '100%',
              aspectRatio: '16/9',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              pointerEvents: 'none' // Prevent interactions from breaking scroll
            }}
          />
        )}
        {resolved?.kind === 'youtube' && !active && resolved.poster && (
          <img src={resolved.poster} alt="" loading="lazy" />
        )}
        {resolved?.kind === 'youtube' && !active && !resolved.poster && (
          <div className="feed-media-placeholder">วิดีโอ</div>
        )}

        {resolved?.kind === 'video' && (
          <video
            ref={videoRef}
            src={resolved.src}
            poster={resolved.poster || undefined}
            muted={muted}
            loop
            playsInline
            preload={active ? 'auto' : 'none'}
            onClick={() => setMuted((v) => !v)}
          />
        )}

        {resolved?.kind === 'image' && (
          <img src={resolved.src} alt="" loading="lazy" />
        )}
      </div>

      {/* ── Right-side action column (TikTok style) ── */}
      <div className="feed-actions">
        <button className={`feed-action-btn${liked ? ' liked' : ''}`} onClick={handleLike} aria-label="ถูกใจ">
          <div className="feed-action-icon"><HeartIcon filled={liked} /></div>
          <span className="feed-action-count">{likeCount > 999 ? `${(likeCount/1000).toFixed(1)}k` : likeCount}</span>
        </button>

        <button className="feed-action-btn" onClick={handleComment} aria-label="คอมเมนต์">
          <div className="feed-action-icon"><CommentIcon /></div>
          <span className="feed-action-count">{commentCount > 999 ? `${(commentCount/1000).toFixed(1)}k` : commentCount}</span>
        </button>

        <button className="feed-action-btn" onClick={handleShare} aria-label="แชร์">
          <div className="feed-action-icon"><ShareIcon /></div>
          <span className="feed-action-count">แชร์</span>
        </button>

        {ctaUrl && (
          <a className="feed-action-btn" href={ctaUrl} aria-label="ดูสินค้า">
            <div className="feed-action-icon"><BagIcon /></div>
            <span className="feed-action-count">ซื้อ</span>
          </a>
        )}
      </div>

      <div className="feed-overlay">
        <div className="feed-author">
          {item.authorAvatar ? (
            <img className="feed-avatar" src={item.authorAvatar} alt="" />
          ) : (
            <span className="feed-avatar feed-avatar-fallback">
              {(item.authorName || item.display_name || 'T')[0]}
            </span>
          )}
          <span className="feed-author-name">
            {item.authorName || item.display_name || item.sellerName || 'TukTuk'}
          </span>
          {isProduct && <span className="feed-badge">สินค้า</span>}
        </div>

        <p className="feed-content">{item.content || item.title || item.productName}</p>

        {commercePrice != null && Number(commercePrice) > 0 && (
          <p className="feed-price">{formatPrice(commercePrice)}</p>
        )}

        {hasCommerce && (
          <div className="feed-commerce">
            <div className="feed-commerce-chips">
              {item.sellerLocation && <span>{item.sellerLocation}</span>}
              {stockText && <span>{stockText}</span>}
              {item.nearmeReason && <span>{item.nearmeReason}</span>}
              {!isProduct && item.productName && <span>{item.productName}</span>}
            </div>
            {ctaUrl && (
              <a className="feed-cta" href={ctaUrl}>
                {isProduct ? 'ดูสินค้า / ติดต่อผู้ขาย' : 'ดูสินค้าที่เกี่ยวข้อง'}
              </a>
            )}
          </div>
        )}
      </div>

      {showMuteBtn && (
        <button
          className="feed-mute-btn"
          onClick={() => setMuted((v) => !v)}
          aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
        >
          <VolumeIcon muted={muted} />
        </button>
      )}
    </article>
  )
}