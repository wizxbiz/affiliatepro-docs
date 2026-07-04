import { useCallback, useEffect, useRef, useState } from 'react'
import { api, productToFeedItem, getToken } from '../api/client.js'
import FeedItem from '../components/FeedItem.jsx'
import ProvincePicker from '../components/ProvincePicker.jsx'
import OnboardingOverlay from '../components/OnboardingOverlay.jsx'
import { useNearMe } from '../hooks/useNearMe.js'

export default function DuPlenFeed() {
  const [items, setItems] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [activeId, setActiveId] = useState(null)
  const [mode, setMode] = useState('all') // all | near_me
  const [notice, setNotice] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(!getToken() && !sessionStorage.getItem('tuktuk_onboarding_dismissed'))
  const containerRef = useRef(null)
  const nearMe = useNearMe()
  const modeRef = useRef(mode)

  // Keep modeRef in sync to prevent async race conditions
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const load = useCallback(async (feedMode, province) => {
    setState('loading')
    setNotice('')
    try {
      // ยิงคู่ขนาน: feed หลัก + products สำรอง (พฤติกรรมเดียวกับ tuktuk_feed_logic เดิม)
      const [feedRes, productsRes] = await Promise.allSettled([
        api.feed.list({ limit: 30, mode: feedMode === 'near_me' ? 'near_me' : 'default', province: province || '' }),
        api.products.list({ limit: 20 }),
      ])

      let posts = feedRes.status === 'fulfilled' ? feedRes.value.posts || [] : []
      const products = productsRes.status === 'fulfilled' ? productsRes.value.products || [] : []

      // near_me แล้วจังหวัดนั้นยังไม่มีโพสต์ → ถอยมาแสดงทั้งหมดพร้อมแจ้ง ไม่ปล่อยจอว่าง/ค้าง
      if (feedMode === 'near_me' && posts.length === 0) {
        const allRes = await api.feed.list({ limit: 30 }).catch(() => null)
        posts = allRes?.posts || []
        if (posts.length > 0) setNotice('ยังไม่มีโพสต์ในจังหวัดของคุณ — แสดงฟีดทั้งหมดแทน')
      }

      let merged = posts
      if (posts.length === 0 && products.length > 0) {
        merged = products.map(productToFeedItem)
      } else if (products.length > 0) {
        // สลับสินค้าแทรกทุกๆ 4 โพสต์
        merged = []
        let pi = 0
        posts.forEach((post, i) => {
          merged.push(post)
          if ((i + 1) % 4 === 0 && pi < products.length) {
            merged.push(productToFeedItem(products[pi++]))
          }
        })
      }

      if (merged.length === 0) throw new Error('ไม่มีข้อมูลฟีด')
      setItems(merged)
      setActiveId(merged[0]?.id ?? null)
      setState('ready')
    } catch (err) {
      console.warn('[DuPlenFeed]', err)
      setState('error')
    }
  }, [])

  useEffect(() => { load('all') }, [load])

  async function switchMode(next) {
    setMode(next)
    if (next === 'all') {
      load('all')
      return
    }
    // near_me: หา location แบบมีเพดานเวลา — ไม่มีทางค้าง
    if (nearMe.province) {
      load('near_me', nearMe.province.code)
      // อัปเดตตำแหน่งเบื้องหลังเผื่อผู้ใช้ย้ายจังหวัด
      nearMe.locate()
      return
    }
    const loc = await nearMe.locate()
    if (modeRef.current === 'near_me') {
      if (loc) {
        // locate สำเร็จ → province ถูก set ใน hook แล้ว แต่ state อาจยังไม่ flush; คำนวณผ่าน hook รอบหน้า
        load('near_me', nearMe.province?.code || '')
      } else {
        setShowPicker(true)
      }
    }
  }

  function pickProvince(prov) {
    nearMe.selectProvince(prov)
    setShowPicker(false)
    load('near_me', prov.code)
  }

  // IntersectionObserver ตัวเดียวคุมว่าการ์ดไหน active — ไม่มี loader ค้างแบบหน้าเดิม
  useEffect(() => {
    if (state !== 'ready' || !containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            setActiveId(e.target.dataset.id)
          }
        })
      },
      { root: containerRef.current, threshold: [0.6] }
    )
    containerRef.current.querySelectorAll('.feed-item').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [state, items])

  return (
    <div className="duplen-wrap">
      <div className="feed-mode-tabs">
        <button className={mode === 'all' ? 'active' : ''} onClick={() => switchMode('all')}>ทั้งหมด</button>
        <button className={mode === 'near_me' ? 'active' : ''} onClick={() => switchMode('near_me')}>
          📍 ใกล้ฉัน{nearMe.province ? ` · ${nearMe.province.nameTh}` : ''}
        </button>
        {mode === 'near_me' && (
          <button className="feed-mode-change" onClick={() => setShowPicker(true)}>เปลี่ยนจังหวัด</button>
        )}
      </div>

      {notice && <div className="feed-notice">{notice}</div>}

      {state === 'loading' && (
        <div className="feed-status">
          <div className="spinner" />
          <p>{nearMe.status === 'locating' ? 'กำลังหาตำแหน่งของคุณ… (ไม่เกิน 8 วินาที)' : 'กำลังโหลดฟีดดูเพลิน…'}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="feed-status">
          <p>โหลดฟีดไม่สำเร็จ</p>
          <button onClick={() => load(mode, nearMe.province?.code)}>ลองใหม่</button>
        </div>
      )}

      {state === 'ready' && (
        <div className="feed-scroll" ref={containerRef}>
          {items.map((item) => (
            <FeedItem key={item.id} item={item} active={item.id === activeId} />
          ))}
        </div>
      )}

      {showPicker && (
        <ProvincePicker
          onSelect={pickProvince}
          onClose={() => { setShowPicker(false); if (!nearMe.province) switchMode('all') }}
        />
      )}

      {showOnboarding && (
        <OnboardingOverlay
          onClose={() => {
            setShowOnboarding(false);
            sessionStorage.setItem('tuktuk_onboarding_dismissed', 'true');
          }}
        />
      )}
    </div>
  )
}
