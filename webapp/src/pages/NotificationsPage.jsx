import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken } from '../api/client.js'
import { useNotifications } from '../notifications/NotificationsContext.jsx'
import { timeAgo } from '../lib/format.js'

function NotifIcon({ type }) {
  if (type === 'like') {
    return (
      <span className="notif-icon like" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.8 4.6c-1.7-1.8-4.5-1.8-6.2 0L12 7.2 9.4 4.6c-1.7-1.8-4.5-1.8-6.2 0-1.8 1.9-1.8 4.9 0 6.7L12 20l8.8-8.7c1.8-1.8 1.8-4.8 0-6.7z" />
        </svg>
      </span>
    )
  }
  if (type === 'comment') {
    return (
      <span className="notif-icon comment" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.8-.9L3 20l1.4-4.3A8 8 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
        </svg>
      </span>
    )
  }
  return (
    <span className="notif-icon system" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    </span>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { markAllRead } = useNotifications()

  const [items, setItems] = useState([])
  const [state, setState] = useState('loading')

  useEffect(() => {
    if (!getToken()) {
      navigate('/login?redirect=/notifications', { replace: true })
      return
    }
    let cancelled = false
    api.notifications.list({ limit: 50 })
      .then((data) => {
        if (cancelled) return
        setItems(data.notifications || [])
        setState('ready')
        // mark all as read (เปิดหน้า → badge รีเซ็ต)
        markAllRead()
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('[Notifications]', err)
        setState('error')
      })
    return () => { cancelled = true }
  }, [navigate, markAllRead])

  function handleTap(notif) {
    const postId = notif.data?.postId
    if (!postId) return
    if (notif.type === 'comment') {
      navigate(`/?post=${encodeURIComponent(postId)}&comments=1`)
    } else {
      navigate(`/?post=${encodeURIComponent(postId)}`)
    }
  }

  if (state === 'loading') {
    return <div className="profile-empty"><div className="spinner" /></div>
  }

  if (state === 'error') {
    return (
      <div className="profile-empty">
        โหลดการแจ้งเตือนไม่สำเร็จ
      </div>
    )
  }

  return (
    <div className="notifications-page">
      {items.length === 0 ? (
        <div className="notif-empty">
          <span className="notif-empty-icon">🔔</span>
          <p>ยังไม่มีการแจ้งเตือน</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>เมื่อมีคนถูกใจหรือแสดงความคิดเห็นในโพสต์ของคุณ จะแสดงที่นี่</p>
        </div>
      ) : (
        <ul className="notif-list">
          {items.map((notif) => (
            <li
              key={notif.id}
              className={`notif-item${notif.isRead ? '' : ' unread'}`}
              onClick={() => handleTap(notif)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTap(notif)}
            >
              <NotifIcon type={notif.type} />
              <div className="notif-body">
                <p className="notif-title">{notif.title}</p>
                {notif.body && <p className="notif-text">{notif.body}</p>}
                <p className="notif-time">{timeAgo(notif.createdAt)}</p>
              </div>
              {!notif.isRead && <span className="notif-dot" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
