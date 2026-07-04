import { useEffect, useRef, useState } from 'react'

// Resolve media เดียวที่ active สำหรับ feed card
// รองรับ 3 รูปแบบ:
//   1. Go engine:  item.videoUrl / item.thumbnailUrl (string)
//   2. /api/v1/posts normalized: item.media [{type,url}] array
//   3. product card: item.thumbnailUrl (ไม่มีวิดีโอ)
function resolveMedia(item) {
  // Go engine / product
  if (item.videoUrl || item.thumbnailUrl) {
    const vidUrl = item.videoUrl || ''
    const imgUrl = item.thumbnailUrl || ''
    const ytId = youtubeId(vidUrl)
    if (ytId) return { kind: 'youtube', ytId, poster: imgUrl }
    if (vidUrl) return { kind: 'video', src: vidUrl, poster: imgUrl }
    if (imgUrl) return { kind: 'image', src: imgUrl }
    return null
  }

  // /api/v1/posts normalized array
  if (Array.isArray(item.media) && item.media.length > 0) {
    const first = item.media[0]
    if (!first?.url) return null
    const ytId = youtubeId(first.url)
    if (ytId) return { kind: 'youtube', ytId, poster: '' }
    if (first.type === 'video') return { kind: 'video', src: first.url, poster: item.media[1]?.url || '' }
    return { kind: 'image', src: first.url }
  }

  return null
}

function youtubeId(url) {
  const m = (url || '').match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/)
  return m ? m[1] : null
}

function isVideoSrc(src) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src || '')
}

export default function FeedItem({ item, active }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const resolved = resolveMedia(item)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      v.play().catch(() => {})
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [active])

  const showMuteBtn = resolved?.kind === 'video' || (resolved?.kind === 'youtube' && active)

  return (
    <article className="feed-item" data-id={item.id}>
      <div className="feed-media">
        {!resolved && <div className="feed-media-placeholder">🎬</div>}

        {resolved?.kind === 'youtube' && active && (
          <iframe
            src={`https://www.youtube.com/embed/${resolved.ytId}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${resolved.ytId}`}
            title={item.content?.slice(0, 40) || 'video'}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        )}
        {resolved?.kind === 'youtube' && !active && resolved.poster && (
          <img src={resolved.poster} alt="" loading="lazy" />
        )}
        {resolved?.kind === 'youtube' && !active && !resolved.poster && (
          <div className="feed-media-placeholder">▶️</div>
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
            onClick={() => setMuted(m => !m)}
          />
        )}

        {resolved?.kind === 'image' && (
          <img src={resolved.src} alt="" loading="lazy" />
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
            {item.authorName || item.display_name || 'TukTuk'}
          </span>
          {item.type === 'product' && <span className="feed-badge">สินค้า</span>}
        </div>

        <p className="feed-content">{item.content}</p>

        {item.price != null && item.type === 'product' && (
          <p className="feed-price">฿{Number(item.price).toLocaleString('th-TH')}</p>
        )}

        <div className="feed-stats">
          <span>❤️ {item.likes ?? item.likes_count ?? 0}</span>
          <span>💬 {item.commentsCount ?? item.comments_count ?? 0}</span>
          <span>👁️ {item.viewCount ?? item.views_count ?? 0}</span>
        </div>
      </div>

      {showMuteBtn && (
        <button
          className="feed-mute-btn"
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </article>
  )
}
