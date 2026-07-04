import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import DuPlenFeed from './pages/DuPlenFeed.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MarketplacePage from './pages/MarketplacePage.jsx'
import PostPage from './pages/PostPage.jsx'
import './App.css'

function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const titles = { '/': 'ดูเพลิน', '/market': 'ตลาด TukTuk', '/post': 'สร้างโพสต์', '/login': 'เข้าสู่ระบบ' }

  return (
    <header className="app-header">
      <a className="app-back" href="/" aria-label="กลับเว็บหลัก">‹</a>
      <h1>{titles[location.pathname] || 'TukTuk'}</h1>
      <div className="app-header-user">
        {user ? (
          <button className="user-chip" onClick={logout} title="แตะเพื่อออกจากระบบ">
            {user.pictureUrl
              ? <img src={user.pictureUrl} alt="" />
              : <span className="user-chip-initial">{(user.displayName || 'ผ')[0]}</span>}
          </button>
        ) : (
          <Link className="btn-login-mini" to="/login">เข้าสู่ระบบ</Link>
        )}
      </div>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end><span>📺</span>ดูเพลิน</NavLink>
      <NavLink to="/market"><span>🛍️</span>ตลาด</NavLink>
      <NavLink to="/post" className="nav-post"><span>➕</span>โพสต์</NavLink>
      <NavLink to="/login"><span>👤</span>ฉัน</NavLink>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <div className="app-shell">
          <Header />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<DuPlenFeed />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/market" element={<MarketplacePage />} />
              <Route path="/post" element={<PostPage />} />
              <Route path="*" element={<DuPlenFeed />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
