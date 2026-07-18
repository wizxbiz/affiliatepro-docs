import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Phase 3 shell — deploy ที่ /app/ บน Cloudflare Pages เพื่ออยู่ร่วมกับเว็บเดิมได้
// dev: /api/* proxy ไป production Worker ผ่านโดเมนหลัก
export default defineConfig({
  base: '/app/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://tuktukfeed.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
  },
})
