import { useEffect, useRef, useState } from 'react'
import { api, getToken } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { timeAgo } from '../lib/format.js'

function commentTimestamp(createdAt) {
  if (!createdAt) return Date.now()
  if (typeof createdAt === 'number') return createdAt
  if (typeof createdAt === 'string') return Date.parse(createdAt) || Date.now()
  if (createdAt.seconds) return createdAt.seconds * 1000
  return Date.now()
}

export default function CommentSheet({ postId, onClose }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.posts.comments(postId)
      .then((data) => {
        if (!active) return
        setComments(data.comments || [])
        setLoading(false)
      })
      .catch((err) => {
        console.warn('[CommentSheet] Load error:', err)
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [postId])

  // เลื่อนลงล่างสุดเมื่อมีคอมเมนต์ใหม่เข้ามา
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [comments, loading])

  async function submit(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content || busy) return

    if (!getToken()) {
      window.location.href = '/app/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search)
      return
    }

    setBusy(true)
    try {
      const res = await api.posts.addComment(postId, content)
      // อัปเดต UI ทันที
      const newComment = {
        id: res.commentId || `comment-${Date.now()}`,
        authorName: user?.displayName || 'ผู้ใช้ TukTuk',
        authorAvatar: user?.pictureUrl || '',
        text: content,
        createdAt: Date.now(),
      }
      setComments((prev) => [...prev, newComment])
      setText('')
    } catch (err) {
      console.warn('[CommentSheet] Post error:', err)
      alert('ไม่สามารถส่งความคิดเห็นได้ในขณะนี้')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="comments-backdrop" onClick={onClose}>
      <div className="comments-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="comments-sheet-header">
          <h3>ความคิดเห็น ({comments.length})</h3>
          <button className="comments-sheet-close" onClick={onClose} aria-label="ปิด">×</button>
        </div>

        <div className="comments-sheet-list" ref={listRef}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div className="spinner" />
            </div>
          ) : comments.length === 0 ? (
            <div className="comments-empty-state">
              <div className="comments-empty-state-icon">💬</div>
              <p>ยังไม่มีความคิดเห็น</p>
              <p style={{ fontSize: '0.8rem', color: '#444' }}>ร่วมแสดงความคิดเห็นเป็นคนแรก!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const authorName = comment.authorName || comment.userName || 'ผู้ใช้ TukTuk'
              const authorAvatar = comment.authorAvatar || comment.userAvatar || ''
              return (
                <div key={comment.id} className="comment-card">
                  {authorAvatar ? (
                    <img className="comment-avatar-img" src={authorAvatar} alt="" />
                  ) : (
                    <div className="comment-avatar-fallback">{authorName[0]}</div>
                  )}
                  <div className="comment-card-content">
                    <div className="comment-card-user">
                      <span>{authorName}</span>
                      <span className="comment-card-time">{timeAgo(commentTimestamp(comment.createdAt))}</span>
                    </div>
                    <p className="comment-card-text">{comment.text}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form className="comments-sheet-footer" onSubmit={submit}>
          <div className="comments-input-row">
            {user?.pictureUrl ? (
              <img src={user.pictureUrl} alt="" />
            ) : (
              <div className="comment-avatar-fallback" style={{ width: '36px', height: '36px' }}>
                {(user?.displayName || 'ผ')[0]}
              </div>
            )}
            <div className="comments-input-wrapper">
              <input
                type="text"
                className="comments-input"
                placeholder={getToken() ? 'เขียนความคิดเห็น...' : 'เข้าสู่ระบบเพื่อแสดงความคิดเห็น...'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={busy}
              />
              <button
                type="submit"
                className="comments-send-btn"
                disabled={!text.trim() || busy}
                aria-label="ส่ง"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
