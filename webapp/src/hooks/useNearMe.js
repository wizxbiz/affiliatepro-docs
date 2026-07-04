import { useCallback, useState } from 'react'
import { storage } from '../lib/storage.js'
import { PROVINCES } from '../lib/provinces.js'

const LOC_KEY = 'tuktuk_last_location'
const PROV_KEY = 'tuktuk_selected_province'
const LOC_MAX_AGE = 10 * 60 * 1000 // ใช้ตำแหน่งเดิมได้ 10 นาที

// จุดกึ่งกลางจังหวัด (ตัวแทน) — ใช้หา province จากพิกัดแบบ nearest-centroid
// พอสำหรับระดับจังหวัด ไม่ต้องพึ่ง reverse-geocoding API ภายนอก
const CENTROIDS = {
  10: [13.7563, 100.5018], 11: [13.5991, 100.5998], 12: [13.8591, 100.5217],
  13: [14.0208, 100.525], 14: [14.3692, 100.5877], 15: [14.5896, 100.455],
  16: [14.7995, 100.6534], 17: [14.8907, 100.3968], 18: [15.1851, 100.125],
  19: [14.5289, 100.9101], 20: [13.3611, 100.9847], 21: [12.6814, 101.2789],
  22: [12.6113, 102.1039], 23: [12.2428, 102.5175], 24: [13.6904, 101.0772],
  25: [14.0421, 101.3686], 26: [14.2069, 101.2131], 27: [13.824, 102.0645],
  30: [14.9799, 102.0978], 31: [14.9930, 103.1029], 32: [14.8818, 103.4936],
  33: [15.1186, 104.3221], 34: [15.2287, 104.8564], 35: [15.7922, 104.1451],
  36: [15.8068, 102.0317], 37: [15.8656, 104.6258], 38: [18.3609, 103.6466],
  39: [17.2216, 102.4262], 40: [16.4419, 102.8360], 41: [17.4138, 102.7870],
  42: [17.4860, 101.7223], 43: [17.8783, 102.7413], 44: [16.1851, 103.3027],
  45: [16.0538, 103.6520], 46: [16.4315, 103.5059], 47: [17.1546, 104.1348],
  48: [17.3920, 104.7695], 49: [16.5426, 104.7024], 50: [18.7883, 98.9853],
  51: [18.5744, 99.0087], 52: [18.2888, 99.4909], 53: [17.6200, 100.0993],
  54: [18.1446, 100.1403], 55: [18.7756, 100.7730], 56: [19.1664, 99.9019],
  57: [19.9105, 99.8406], 58: [19.3020, 97.9654], 60: [15.7047, 100.1372],
  61: [15.3835, 100.0245], 62: [16.4828, 99.5227], 63: [16.8840, 99.1259],
  64: [17.0078, 99.8237], 65: [16.8211, 100.2659], 66: [16.4429, 100.3487],
  67: [16.4190, 101.1591], 70: [13.5282, 99.8134], 71: [14.0227, 99.5328],
  72: [14.4745, 100.1177], 73: [13.8199, 100.0622], 74: [13.5475, 100.2745],
  75: [13.4098, 100.0023], 76: [13.1119, 99.9399], 77: [11.8126, 99.7957],
  80: [8.4304, 99.9631], 81: [8.0863, 98.9063], 82: [8.4510, 98.5150],
  83: [7.8804, 98.3923], 84: [9.1382, 99.3215], 85: [9.9529, 98.6085],
  86: [10.4930, 99.1800], 90: [7.1898, 100.5954], 91: [6.6238, 100.0674],
  92: [7.5645, 99.6239], 93: [7.6167, 100.0740], 94: [6.8698, 101.2501],
  95: [6.5411, 101.2803], 96: [6.4265, 101.8231],
}

function nearestProvince(lat, lng) {
  let best = null
  let bestDist = Infinity
  for (const [code, [clat, clng]] of Object.entries(CENTROIDS)) {
    const d = (lat - clat) ** 2 + (lng - clng) ** 2
    if (d < bestDist) { bestDist = d; best = code }
  }
  return PROVINCES.find((p) => p.code === best) || null
}

function getPositionOnce(options, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('JS_TIMEOUT'))
    }, timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve(pos)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
      options
    )
  })
}

/**
 * useNearMe — geolocation ที่ "จบเสมอ" ภายใน ~8 วินาที ไม่มีทางค้าง:
 * 1. cache 10 นาที → คืนทันที
 * 2. ยิง low-accuracy (เร็ว, พอสำหรับระดับจังหวัด) timeout 8s
 * 3. ทุกทางล้มเหลว → คืน fallback ให้ UI เปิด province picker (จำจังหวัดล่าสุดไว้)
 */
export function useNearMe() {
  const [status, setStatus] = useState('idle') // idle | locating | ready | need-province
  const [location, setLocation] = useState(() => {
    const saved = storage.getJSON(LOC_KEY)
    return saved && Date.now() - saved.timestamp < LOC_MAX_AGE ? saved : null
  })
  const [province, setProvince] = useState(() => storage.getJSON(PROV_KEY))

  const selectProvince = useCallback((prov) => {
    storage.setJSON(PROV_KEY, prov)
    setProvince(prov)
    setStatus('ready')
  }, [])

  const locate = useCallback(async () => {
    // cache ยังสด → ใช้เลย
    const cached = storage.getJSON(LOC_KEY)
    if (cached && Date.now() - cached.timestamp < LOC_MAX_AGE) {
      setLocation(cached)
      const prov = nearestProvince(cached.lat, cached.lng)
      if (prov) selectProvince(prov)
      setStatus('ready')
      return cached
    }

    if (!navigator.geolocation) {
      setStatus('need-province')
      return null
    }

    setStatus('locating')
    try {
      // low accuracy ก่อน — เร็วกว่ามากและพอสำหรับหาจังหวัด
      const pos = await getPositionOnce({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      }, 8000)
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        timestamp: Date.now(),
      }
      storage.setJSON(LOC_KEY, loc)
      setLocation(loc)
      const prov = nearestProvince(loc.lat, loc.lng)
      if (prov) selectProvince(prov)
      setStatus('ready')
      return loc
    } catch {
      // denied/timeout/unavailable — ไม่ retry ให้ค้าง: เปิด picker ทันที
      setStatus('need-province')
      return null
    }
  }, [selectProvince])

  return { status, location, province, locate, selectProvince }
}
