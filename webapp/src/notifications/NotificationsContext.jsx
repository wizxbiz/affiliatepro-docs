import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, getToken } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'

const NotificationsContext = createContext(null)

const POLL_INTERVAL_MS = 45_000 // 45 วินาที

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const intervalRef = useRef(null)

  const refresh = useCallback(async () => {
    if (!getToken()) { setUnread(0); return }
    try {
      const data = await api.notifications.unreadCount()
      setUnread(data.unread || 0)
    } catch {
      // silent — badge แค่จะไม่อัปเดต ไม่ควร crash แอป
    }
  }, [])

  const markAllRead = useCallback(async () => {
    if (!getToken()) return
    try {
      await api.notifications.markRead([]) // ids=[] → mark all
      setUnread(0)
    } catch {
      // silent
    }
  }, [])

  // เริ่ม poll เมื่อ user login; หยุดเมื่อ logout
  useEffect(() => {
    if (!user) {
      setUnread(0)
      clearInterval(intervalRef.current)
      return
    }
    refresh()
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [user, refresh])

  // refresh เมื่อ tab กลับมา focus
  useEffect(() => {
    if (!user) return
    function onVisible() {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, refresh])

  return (
    <NotificationsContext.Provider value={{ unread, refresh, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
