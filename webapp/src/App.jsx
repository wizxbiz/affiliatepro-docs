import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import { NotificationsProvider, useNotifications } from './notifications/NotificationsContext.jsx'
import { CartProvider, useCart } from './cart/CartContext.jsx'
import DuPlenFeed from './pages/DuPlenFeed.jsx'
import LoginPage from './pages/LoginPage.jsx'
import './App.css'

// Lazy-load heavy pages — split at route level so the initial bundle is minimal.
// DuPlenFeed + LoginPage are eager (first-paint critical).
const MarketplacePage     = lazy(() => import('./pages/MarketplacePage.jsx'))
const PostPage            = lazy(() => import('./pages/PostPage.jsx'))
const ProfilePage         = lazy(() => import('./pages/ProfilePage.jsx'))
const SellerDashboardPage   = lazy(() => import('./pages/SellerDashboardPage.jsx'))
const NotificationsPage     = lazy(() => import('./pages/NotificationsPage.jsx'))
const CartPage            = lazy(() => import('./pages/CartPage.jsx'))

function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60dvh' }}>
      <div className="spinner" />
    </div>
  )
}

function Header() {
  const { user, logout } = useAuth()
  const { unread } = useNotifications()
  const { count: cartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const titles = {
    '/': 'ดูเพลิน',
    '/market': 'ตลาด TukTuk',
    '/post': 'สร้างโพสต์',
    '/login': 'เข้าสู่ระบบ',
    '/profile': 'โปรไฟล์',
    '/seller': 'แผงร้านค้า',
    '/notifications': 'การแจ้งเตือน',
    '/cart': 'ตะกร้าสินค้า',
  }

  return (
    <header className="app-header">
      <a className="app-back" href="/" aria-label="กลับเว็บหลัก">‹</a>
      <h1>{titles[location.pathname] || 'TukTuk'}</h1>
      <div className="app-header-user">
        {user && (
          <button
            className="header-bell"
            onClick={() => navigate('/notifications')}
            aria-label={`การแจ้งเตือน${unread > 0 ? ` (${unread} ใหม่)` : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            {unread > 0 && (
              <span className="header-bell-badge">{unread > 99 ? '99+' : unread}</span>
            )}
          </button>
        )}
        <button
          className="header-bell"
          onClick={() => navigate('/cart')}
          aria-label={`ตะกร้าสินค้า${cartCount > 0 ? ` (${cartCount})` : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M17 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-.6-5h11.2c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0 0 19.7 5H5.21L4.27 3H1v2h2l3.6 7.59L5.25 15c-.16.28-.25.61-.25.95C5 17.1 5.9 18 7 18h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63z"/>
          </svg>
          {cartCount > 0 && (
            <span className="header-bell-badge">{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </button>
        {user ? (
          <button className="user-chip" onClick={logout} title="แตะเพื่อออกจากระบบ">
            {user.pictureUrl
              ? <img src={user.pictureUrl} alt="" />
              : <span className="user-chip-initial">{(user.displayName || 'ผ')[0]}</span>}
          </button>
        ) : location.pathname !== '/login' ? (
          <Link className="btn-login-mini" to="/login">เข้าสู่ระบบ</Link>
        ) : null}
      </div>
    </header>
  )
}

function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()
  const [sp] = useSearchParams()
  // Hide app tabs on the login screen (guest auth wall)
  if (location.pathname === '/login') return null

  const isNearMe = location.pathname === '/market' && sp.get('mode') === 'nearme'
  const isMarket = location.pathname === '/market' && !isNearMe
  return (
    <nav className="bottom-nav">
      {/* ดูเพลิน */}
      <NavLink to="/" end className={({ isActive }) => isActive ? 'bn-item active' : 'bn-item'}>
        <svg className="bn-icon" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M7 4.5h4.5a8 8 0 0 1 0 15H7a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 7 4.5zm2.5 4.7v5.6a.6.6 0 0 0 .9.5l4.5-2.8a.6.6 0 0 0 0-1l-4.5-2.8a.6.6 0 0 0-.9.5z"/></svg>
        <span className="bn-label">ดูเพลิน</span>
      </NavLink>

      {/* ตลาด */}
      <NavLink to="/market" end className={() => isMarket ? 'bn-item active' : 'bn-item'}>
        <svg className="bn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V8q-2.67 2-5.33 0-2.67 2-5.33 0Q6.67 10 4 8z"/><path fillRule="evenodd" clipRule="evenodd" d="M6 9.4q1.75 1 3.5 0 1.75 1 3.5 0 1.4.8 2.8.3V19.5A1.5 1.5 0 0 1 14.3 21H9.7A1.5 1.5 0 0 1 8.2 19.5v-4.6h-.4a1 1 0 0 1-1-1V9.7q-.4.05-.8-.3zm3.7 5.5v4.4h4.6v-4.4z"/></svg>
        <span className="bn-label">ตลาด</span>
      </NavLink>

      {/* Center FAB — gradient ring matching main site */}
      <NavLink to="/post" className="bn-item bn-center" aria-label="สร้างโพสต์">
        <div className="bn-center-ring">
          <div className="bn-center-inner">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
          </div>
        </div>
        <span className="bn-label">โพสต์</span>
      </NavLink>

      {/* ใกล้ฉัน */}
      <NavLink to="/market?mode=nearme" className={() => isNearMe ? 'bn-item active' : 'bn-item'}>
        <svg className="bn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <span className="bn-label">ใกล้บ้าน</span>
      </NavLink>

      {/* ฉัน / เข้าสู่ระบบ */}
      <NavLink to={user ? '/profile' : '/login'} className={({ isActive }) => isActive ? 'bn-item active' : 'bn-item'}>
        {user?.pictureUrl
          ? <img className="bn-avatar" src={user.pictureUrl} alt="" />
          : <svg className="bn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
        }
        <span className="bn-label">{user ? (user.displayName?.split(' ')[0] || 'ฉัน') : 'เข้าสู่ระบบ'}</span>
      </NavLink>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <NotificationsProvider>
          <CartProvider>
            <div className="app-shell">
              <Header />
              <main className="app-main">
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/"              element={<DuPlenFeed />} />
                    <Route path="/login"         element={<LoginPage />} />
                    <Route path="/market"        element={<MarketplacePage />} />
                    <Route path="/post"          element={<PostPage />} />
                    <Route path="/profile"       element={<ProfilePage />} />
                    <Route path="/profile/:id"   element={<ProfilePage />} />
                    <Route path="/seller"        element={<SellerDashboardPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/cart"          element={<CartPage />} />
                    <Route path="*"              element={<DuPlenFeed />} />
                  </Routes>
                </Suspense>
              </main>
              <BottomNav />
            </div>
          </CartProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
