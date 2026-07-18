import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, productToFeedItem, getToken } from '../api/client.js'
import FeedItem from '../components/FeedItem.jsx'
import ProvincePicker from '../components/ProvincePicker.jsx'
import OnboardingOverlay from '../components/OnboardingOverlay.jsx'
import CommentSheet from '../components/CommentSheet.jsx'
import { useNearMe } from '../hooks/useNearMe.js'

function provinceParams(province) {
  if (!province) return { code: '', name: '', label: '' }
  if (typeof province === 'string') return { code: province, name: province, label: province }
  const name = province.nameTh || province.nameEn || province.name || ''
  return { code: province.code || '', name, label: name || province.code || '' }
}

function mergeFallbackFeed(posts, products) {
  const normalizedProducts = products.map(productToFeedItem)
  if (posts.length === 0) return normalizedProducts
  if (normalizedProducts.length === 0) return posts

  const merged = []
  let pi = 0
  posts.forEach((post, i) => {
    merged.push(post)
    if ((i + 1) % 3 === 0 && pi < normalizedProducts.length) {
      merged.push(normalizedProducts[pi++])
    }
  })
  while (pi < normalizedProducts.length && merged.length < 36) {
    merged.push(normalizedProducts[pi++])
  }
  return merged
}

export default function DuPlenFeed() {
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [activeId, setActiveId] = useState(null)
  const [mode, setMode] = useState('all') // all | near_me
  const [notice, setNotice] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(!getToken() && !sessionStorage.getItem('tuktuk_onboarding_dismissed'))
  const [activeCommentPostId, setActiveCommentPostId] = useState(null)
  const containerRef = useRef(null)
  const nearMe = useNearMe()
  const modeRef = useRef(mode)
  const nearActionRef = useRef(0)

  const targetPostId = searchParams.get('post') || searchParams.get('postId')
  const showComments = searchParams.get('comments') === '1'

  // Deep link handler: Scroll to post and open comments sheet on mount
  useEffect(() => {
    if (state === 'ready' && targetPostId) {
      setTimeout(() => {
        const el = containerRef.current?.querySelector(`[data-id="${targetPostId}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'auto' })
          setActiveId(targetPostId)
          if (showComments) {
            setActiveCommentPostId(targetPostId)
          }
        }
      }, 500)
    }
  }, [state, targetPostId, showComments])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const loadFallback = useCallback(async (feedMode, selectedProvince) => {
    const province = provinceParams(selectedProvince)
    const [feedRes, productsRes] = await Promise.allSettled([
      api.feed.list({
        limit: 30,
        mode: feedMode === 'near_me' ? 'near_me' : 'default',
        province: province.code || province.name,
      }),
      api.products.list({
        limit: 24,
        province: feedMode === 'near_me' ? province.name : '',
      }),
    ])

    const feedData = feedRes.status === 'fulfilled' ? feedRes.value : {}
    const productData = productsRes.status === 'fulfilled' ? productsRes.value : {}
    const posts = feedData.posts || feedData.items || []
    const products = productData.products || []
    return mergeFallbackFeed(posts, products)
  }, [])

  const load = useCallback(async (feedMode, selectedProvince = null, actionId = null) => {
    const province = provinceParams(selectedProvince)
    const shouldApply = () => actionId == null || nearActionRef.current === actionId
    setState('loading')
    setNotice('')

    try {
      let merged = []
      let nearmeMeta = null

      try {
        const nearme = await api.nearme.list({
          mode: feedMode === 'near_me' ? 'near_me' : 'default',
          province: province.code,
          provinceName: province.name,
          limit: feedMode === 'near_me' ? 40 : 34,
        })
        merged = Array.isArray(nearme.items) ? nearme.items : []
        nearmeMeta = nearme.meta || null
      } catch (err) {
        console.warn('[DuPlenFeed] Nearme fallback', err)
      }

      if (merged.length === 0) {
        merged = await loadFallback(feedMode, selectedProvince)
        if (!shouldApply()) return
        if (feedMode === 'near_me' && merged.length > 0) {
          setNotice('ยังไม่มี Nearme feed จากระบบจัดอันดับ แสดงข้อมูลสำรองในพื้นที่แทน')
        }
      } else if (feedMode === 'near_me' && nearmeMeta?.fallback) {
        setNotice(`ยังไม่มีสินค้าตรงพื้นที่${province.label ? ` ${province.label}` : ''} แสดงสินค้าน่าสนใจทั้งหมดแทน`)
      }

      if (targetPostId && !merged.some((item) => String(item.id) === String(targetPostId))) {
        try {
          const data = await api.posts.get(targetPostId)
          const targetPost = data.post || data.item
          if (targetPost?.id) merged = [targetPost, ...merged]
        } catch (err) {
          console.warn('[DuPlenFeed] Deep link post fallback failed:', err)
        }
      }

      if (merged.length === 0) throw new Error('ไม่มีข้อมูลฟีด')
      if (!shouldApply()) return
      setItems(merged)
      setActiveId(merged[0]?.id ?? null)
      setState('ready')
    } catch (err) {
      if (!shouldApply()) return
      console.warn('[DuPlenFeed]', err)
      setState('error')
    }
  }, [loadFallback, targetPostId])

  useEffect(() => { load('all') }, [load])

  async function switchMode(next) {
    const actionId = ++nearActionRef.current
    setMode(next)
    if (next === 'all') {
      setShowPicker(false)
      load('all', null, actionId)
      return
    }

    if (nearMe.province) {
      load('near_me', nearMe.province, actionId)
      nearMe.locate().catch(() => {})
      return
    }

    const loc = await nearMe.locate()
    if (nearActionRef.current !== actionId || modeRef.current !== 'near_me') return

    if (loc?.province) {
      load('near_me', loc.province, actionId)
    } else {
      setShowPicker(true)
    }
  }

  function cancelNearMe() {
    const actionId = ++nearActionRef.current
    setShowPicker(false)
    setNotice('')
    setMode('all')
    load('all', null, actionId)
  }

  function pickProvince(prov) {
    nearMe.selectProvince(prov)
    setShowPicker(false)
    load('near_me', prov)
  }

  useEffect(() => {
    if (state !== 'ready' || !containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveId(entry.target.dataset.id)
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
          ใกล้ฉัน{nearMe.province ? ` · ${nearMe.province.nameTh}` : ''}
        </button>
        {mode === 'near_me' && (
          <button className="feed-mode-change" onClick={() => setShowPicker(true)}>เปลี่ยนจังหวัด</button>
        )}
      </div>

      {notice && <div className="feed-notice">{notice}</div>}

      {state === 'loading' && (
        <div className="feed-status">
          <div className="spinner" />
          <p>{mode === 'near_me' && nearMe.status === 'locating' ? 'กำลังหาตำแหน่งของคุณ... ไม่เกิน 8 วินาที' : 'กำลังโหลดฟีดน่าสนใจ...'}</p>
          {mode === 'near_me' && (
            <button type="button" onClick={cancelNearMe}>ยกเลิก</button>
          )}
        </div>
      )}

      {state === 'error' && (
        <div className="feed-status">
          <p>โหลดฟีดไม่สำเร็จ</p>
          <button onClick={() => load(mode, nearMe.province)}>ลองใหม่</button>
        </div>
      )}

      {state === 'ready' && (
        <div className="feed-scroll" ref={containerRef}>
          {items.map((item) => (
            <FeedItem
              key={item.id}
              item={item}
              active={item.id === activeId}
              onCommentClick={setActiveCommentPostId}
            />
          ))}
        </div>
      )}

      {showPicker && (
        <ProvincePicker
          onSelect={pickProvince}
          onClose={() => { setShowPicker(false); if (!nearMe.province) cancelNearMe() }}
        />
      )}

      {showOnboarding && (
        <OnboardingOverlay
          onClose={() => {
            setShowOnboarding(false)
            sessionStorage.setItem('tuktuk_onboarding_dismissed', 'true')
          }}
        />
      )}

      {activeCommentPostId && (
        <CommentSheet
          postId={activeCommentPostId}
          onClose={() => setActiveCommentPostId(null)}
        />
      )}
    </div>
  )
}
