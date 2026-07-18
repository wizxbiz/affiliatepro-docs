export function parseImages(raw) {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(arr) ? arr.filter(Boolean) : []
  } catch {
    return []
  }
}

export function formatPrice(price) {
  const n = Number(price)
  if (!Number.isFinite(n) || n <= 0) return 'สอบถามราคา'
  return `฿${n.toLocaleString('th-TH')}`
}

export function timeAgo(ts) {
  const t = Number(ts)
  if (!t) return ''
  const diff = Date.now() - t
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชม.ที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} วันที่แล้ว`
  return new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}
