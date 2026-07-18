// SafeStorage — localStorage อาจโดนบล็อกใน iOS WebView (LINE in-app browser)
// fallback เป็น in-memory เพื่อไม่ให้ throw DOMException กลาง flow login
const memory = {}

export const storage = {
  get(key) {
    try { return localStorage.getItem(key) } catch { return memory[key] ?? null }
  },
  set(key, value) {
    try { localStorage.setItem(key, value) } catch { memory[key] = value }
  },
  remove(key) {
    try { localStorage.removeItem(key) } catch { delete memory[key] }
  },
  getJSON(key) {
    try { return JSON.parse(this.get(key) || 'null') } catch { return null }
  },
  setJSON(key, value) {
    this.set(key, JSON.stringify(value))
  },
}
