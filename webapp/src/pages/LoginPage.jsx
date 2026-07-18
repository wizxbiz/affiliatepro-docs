import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { storage } from '../lib/storage.js'

const LINE_CID = '2009159046'
const LIFF_ID  = '2009159046-HPLHyRFm'  // TukTuk App (/app) — LINE Developers Console

function sanitizeRedirect(raw) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

function isLineApp() {
  return typeof navigator !== 'undefined' && /Line\/\d/i.test(navigator.userAgent)
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Accept both ?redirect= (internal links) and ?redirectUrl= (OnboardingOverlay)
  const redirectTo = sanitizeRedirect(params.get('redirect') || params.get('redirectUrl'))

  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [pin, setPin] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [tab, setTab] = useState('line')
  const handledCode = useRef(false)
  const handledPin = useRef(false)
  const handledLiff = useRef(false)

  // Already logged in → go to intended destination
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true })
  }, [user, navigate, redirectTo])

  // ── 1. Auto-login from ?pin= URL param ───────────────────────────
  // LINE OA sends a magic link: tuktukfeed.com/app/login?pin=XXXXXX
  // Silently submit the PIN so the tap on the LINE message = instant login.
  useEffect(() => {
    const pinParam = params.get('pin')
    if (!pinParam || pinParam.length < 6 || handledPin.current) return
    handledPin.current = true

    setBusy('กำลังเข้าสู่ระบบด้วยรหัส PIN…')
    api.auth.createSession({ provider: 'line_pin', pin: pinParam })
      .then((data) => {
        const token = data.token || data.sessionToken
        if (!token) throw new Error('ไม่ได้รับ token')
        login(token, data.user || {})
        const dest = sanitizeRedirect(storage.get('tuktuk_login_redirect') || redirectTo)
        storage.remove('tuktuk_login_redirect')
        navigate(dest, { replace: true })
      })
      .catch((err) => {
        setError(
          err.httpStatus === 404
            ? 'รหัส PIN หมดอายุหรือไม่ถูกต้อง — พิมพ์ "รหัส" ใน LINE OA เพื่อขอรหัสใหม่'
            : `เข้าสู่ระบบไม่สำเร็จ: ${err.message}`
        )
        setTab('pin')
        setPin(pinParam)  // pre-fill so user can just tap ยืนยัน
      })
      .finally(() => setBusy(''))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2. LIFF auto-login (LINE in-app browser) ─────────────────────
  // When opened inside LINE, lazy-load LIFF SDK and auto-provide profile.
  useEffect(() => {
    if (!isLineApp() || !LIFF_ID || handledLiff.current) return
    handledLiff.current = true

    const script = document.createElement('script')
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
    script.async = true
    script.onload = async () => {
      try {
        await window.liff.init({ liffId: LIFF_ID })
        if (!window.liff.isLoggedIn()) {
          window.liff.login({ redirectUri: window.location.href })
          return
        }
        setBusy('กำลังดึงข้อมูลโปรไฟล์ LINE…')
        const profile = await window.liff.getProfile()
        const data = await api.auth.createSession({
          provider: 'line',
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          accessToken: window.liff.getAccessToken(),
        })
        const token = data.token || data.sessionToken
        if (!token) throw new Error('ไม่ได้รับ token')
        login(token, data.user || {})
        navigate(redirectTo, { replace: true })
      } catch (err) {
        console.warn('[LIFF] auto-login failed:', err.message)
        setBusy('')
      }
    }
    document.head.appendChild(script)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 3. LINE OAuth callback: ?code=…&state=… ──────────────────────
  useEffect(() => {
    const code = params.get('code')
    const state = params.get('state')
    if (!code || handledCode.current) return
    handledCode.current = true

    const savedState = storage.get('tuktuk_line_state')
    storage.remove('tuktuk_line_state')
    if (!state || state !== savedState) {
      setError('การยืนยันตัวตนไม่ถูกต้อง (state mismatch) กรุณาลองใหม่')
      return
    }

    setBusy('กำลังยืนยันตัวตนกับ LINE…')
    api.auth.createSession({
      provider: 'line_oauth',
      code,
      redirectUri: window.location.origin + '/app/login',
    })
      .then((data) => {
        const token = data.token || data.sessionToken
        if (!token) throw new Error('ไม่ได้รับ token จากเซิร์ฟเวอร์')
        login(token, data.user || {})
        const dest = sanitizeRedirect(storage.get('tuktuk_login_redirect') || redirectTo)
        storage.remove('tuktuk_login_redirect')
        navigate(dest, { replace: true })
      })
      .catch((err) => setError(`เข้าสู่ระบบไม่สำเร็จ: ${err.message}`))
      .finally(() => setBusy(''))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startLineLogin() {
    const state = crypto.randomUUID()
    storage.set('tuktuk_line_state', state)
    storage.set('tuktuk_login_redirect', redirectTo)
    const p = new URLSearchParams({
      response_type: 'code',
      client_id: LINE_CID,
      redirect_uri: window.location.origin + '/app/login',
      state,
      scope: 'profile openid',
    })
    setBusy('กำลังพาไปที่ LINE…')
    window.location.href = 'https://access.line.me/oauth2/v2.1/authorize?' + p.toString()
  }

  async function submitPin(e) {
    e.preventDefault()
    if (pin.length < 6) { setError('กรุณากรอกรหัส PIN 6 หลัก'); return }
    setError('')
    setBusy('กำลังตรวจสอบรหัส…')
    try {
      const data = await api.auth.createSession({ provider: 'line_pin', pin })
      const token = data.token || data.sessionToken
      if (!token) throw new Error(data.message || 'รหัสไม่ถูกต้อง')
      login(token, data.user || {})
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.httpStatus === 404 ? 'ไม่พบรหัสนี้ — พิมพ์ "รหัส" ใน LINE OA เพื่อขอรหัสใหม่' : err.message)
    } finally {
      setBusy('')
    }
  }

  async function requestOtp(e) {
    e.preventDefault()
    const cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.length < 9) { setError('กรุณากรอกเบอร์โทรให้ถูกต้อง'); return }
    setError('')
    setBusy('กำลังส่งรหัส OTP…')
    try {
      await api.auth.requestOtp(cleaned)
      setOtpSent(true)
    } catch (err) {
      setError(`ส่ง OTP ไม่สำเร็จ: ${err.message}`)
    } finally {
      setBusy('')
    }
  }

  async function submitOtp(e) {
    e.preventDefault()
    setError('')
    setBusy('กำลังตรวจสอบ OTP…')
    try {
      const data = await api.auth.createSession({
        provider: 'phone_otp',
        phone: phone.replace(/[^0-9]/g, ''),
        code: otp,
      })
      const token = data.token || data.sessionToken
      if (!token) throw new Error(data.message || 'OTP ไม่ถูกต้อง')
      login(token, data.user || {})
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  // Full-screen spinner while PIN auto-login is running
  if (handledPin.current && busy && !error) {
    return (
      <div className="login-page">
        <div className="login-card login-card-center">
          <div className="spinner spinner-lg" />
          <p className="login-busy-lg">{busy}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>เข้าสู่ระบบ TukTuk</h2>

        <div className="login-tabs">
          <button className={tab === 'line' ? 'active' : ''} onClick={() => { setTab('line'); setError('') }}>LINE</button>
          <button className={tab === 'pin' ? 'active' : ''} onClick={() => { setTab('pin'); setError('') }}>รหัส PIN</button>
          <button className={tab === 'phone' ? 'active' : ''} onClick={() => { setTab('phone'); setError('') }}>เบอร์โทร</button>
        </div>

        {error && <p className="login-error">{error}</p>}
        {busy && <p className="login-busy"><span className="spinner spinner-sm" /> {busy}</p>}

        {tab === 'line' && !busy && (
          <div className="login-section">
            <button className="btn-line" onClick={startLineLogin}>
              เข้าสู่ระบบด้วย LINE
            </button>
            <p className="login-hint">ใช้บัญชี LINE ของคุณ ปลอดภัยและรวดเร็ว</p>
          </div>
        )}

        {tab === 'pin' && !busy && (
          <form className="login-section" onSubmit={submitPin}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="รหัส 6 หลักจาก LINE OA"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              autoComplete="one-time-code"
              autoFocus={pin.length > 0}
            />
            <button className="btn-primary" type="submit" disabled={pin.length < 6}>ยืนยันรหัส</button>
            <p className="login-hint">พิมพ์คำว่า "รหัส" ในแชท LINE OA ของ TukTuk เพื่อรับ PIN</p>
          </form>
        )}

        {tab === 'phone' && !busy && !otpSent && (
          <form className="login-section" onSubmit={requestOtp}>
            <input type="tel" inputMode="tel" placeholder="เบอร์โทรศัพท์"
              value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            <button className="btn-primary" type="submit">ขอรหัส OTP</button>
          </form>
        )}

        {tab === 'phone' && !busy && otpSent && (
          <form className="login-section" onSubmit={submitOtp}>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="รหัส OTP"
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              autoComplete="one-time-code" />
            <button className="btn-primary" type="submit" disabled={otp.length < 4}>ยืนยัน OTP</button>
            <button type="button" className="btn-ghost" onClick={() => setOtpSent(false)}>เปลี่ยนเบอร์</button>
          </form>
        )}
      </div>
    </div>
  )
}
