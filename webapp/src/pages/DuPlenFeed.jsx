import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, productToFeedItem, getToken } from '../api/client.js'
import FeedItem from '../components/FeedItem.jsx'
import ProvincePicker from '../components/ProvincePicker.jsx'
import OnboardingOverlay from '../components/OnboardingOverlay.jsx'
import CommentSheet from '../components/CommentSheet.jsx'
import { useNearMe } from '../hooks/useNearMe.js'
import { pauseAll } from '../lib/videoManager.js'

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
  const viewedRef = useRef(new Set()) // dedupe view beacons per session

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
      let posts = []
      let products = []
      let nearmeMeta = null

      // Fetch social feed (videos/posts) and ranked products in parallel
      const [feedRes, nearmeRes] = await Promise.allSettled([
        api.feed.list({
          limit: 30,
          mode: feedMode === 'near_me' ? 'near_me' : 'default',
          province: province.code || province.name,
        }),
        api.nearme.list({
          mode: feedMode === 'near_me' ? 'near_me' : 'default',
          province: province.code,
          provinceName: province.name,
          limit: feedMode === 'near_me' ? 24 : 16,
        })
      ])

      if (feedRes.status === 'fulfilled') {
        const feedData = feedRes.value || {}
        posts = feedData.posts || feedData.items || []
      }

      if (nearmeRes.status === 'fulfilled') {
        const nearmeData = nearmeRes.value || {}
        products = nearmeData.items || []
        nearmeMeta = nearmeData.meta || null
      } else {
        // Fallback to basic products list if nearme endpoint failed
        try {
          const productsData = await api.products.list({
            limit: 20,
            province: feedMode === 'near_me' ? province.name : '',
          })
          products = productsData.products || []
        } catch (err) {
          console.warn('[DuPlenFeed] Products fallback failed:', err)
        }
      }

      // Merge posts (videos/images) and products (interleaving)
      let merged = mergeFallbackFeed(posts, products)

      if (feedMode === 'near_me') {
        if (posts.length === 0 && products.length === 0) {
          // If completely empty in near_me mode, load global fallback
          merged = await loadFallback('all', null)
          if (!shouldApply()) return
          setNotice('ยังไม่มีโพสต์และสินค้าในจังหวัดของคุณ แสดงฟีดทั้งหมดแทน')
        } else if (nearmeMeta?.fallback) {
          setNotice(`ยังไม่มีสินค้าตรงพื้นที่${province.label ? ` ${province.label}` : ''} แสดงสินค้าน่าสนใจทั้งหมดแทน`)
        }
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

  // Fire-and-forget view beacon, once per item per session.
  const countView = useCallback((id) => {
    if (!id || viewedRef.current.has(id)) return
    viewedRef.current.add(id)
    const item = items.find((it) => String(it.id) === String(id))
    if (!item) return
    if (item.type === 'product') {
      const productId = item.productId || String(item.id).replace(/^product-/, '')
      if (productId) api.products.view(productId).catch(() => {})
    } else {
      api.posts.view(id).catch(() => {})
    }
  }, [items])

  useEffect(() => {
    if (state !== 'ready' || !containerRef.current) return

    // รวบ ratio ของทุกการ์ดไว้ใน Map แล้วใช้ debounce 80ms
    // เพื่อให้ scroll เร็วๆ ก็ยังเลือก "ตัวที่อยู่กลางจอจริง" ได้ถูก
    const ratios = new Map()
    let rafId = null

    function pickBest() {
      let bestId = null
      let bestRatio = 0.35 // threshold ขั้นต่ำ (ต้องเห็นอย่างน้อย 35%)
      ratios.forEach((ratio, id) => {
        if (ratio > bestRatio) { bestRatio = ratio; bestId = id }
      })
      if (bestId) {
        setActiveId((prev) => {
          if (prev !== bestId) countView(bestId)
          return bestId
        })
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.dataset.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        })
        // debounce: รอให้ scroll หยุดสักครู่ก่อนตัดสินใจ
        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(pickBest)
      },
      {
        root: containerRef.current,
        // ใช้ threshold ละเอียดขึ้นเพื่อ track ว่ากี่เปอร์เซ็นต์ที่เห็น
        threshold: [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1],
      }
    )
    containerRef.current.querySelectorAll('.feed-item').forEach((el) => observer.observe(el))
    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [state, items, countView])

  // เปิด CommentSheet ทับ → หยุดวิดีโอทุกตัว (กันเสียงเล่นหลังชีต)
  useEffect(() => {
    if (activeCommentPostId) pauseAll()
  }, [activeCommentPostId])

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
