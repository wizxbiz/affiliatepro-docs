import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, getSavedUser, saveSession, clearSession } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // เริ่มจาก session ที่เก็บไว้ทันที (ไม่ต้องรอ network) แล้วค่อย validate เบื้องหลัง
  const [user, setUser] = useState(() => (getToken() ? getSavedUser() : null))
  const [checking, setChecking] = useState(!!getToken())

  useEffect(() => {
    if (!getToken()) return
    let cancelled = false
    api.auth.getSession()
      .then((data) => {
        if (cancelled) return
        const fresh = data.user || data
        if (fresh?.uid || fresh?.lineUserId) setUser((prev) => ({ ...prev, ...fresh }))
      })
      .catch((err) => {
        // token หมดอายุ/ใช้ไม่ได้ → ล้างทิ้งเงียบๆ; network error → คงไว้ใช้ offline ได้
        if (!cancelled && (err.httpStatus === 401 || err.httpStatus === 403)) {
          clearSession()
          setUser(null)
        }
      })
      .finally(() => { if (!cancelled) setChecking(false) })
    return () => { cancelled = true }
  }, [])

  const login = useCallback((token, userData) => {
    setUser(saveSession({ token, user: userData }))
  }, [])

  const logout = useCallback(async () => {
    try { await api.auth.logout() } catch { /* token อาจตายแล้ว — ล้าง local ต่อไป */ }
    clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
