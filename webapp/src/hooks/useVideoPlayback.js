// useVideoPlayback.js — ผูก <video> เข้ากับ videoManager
// จัดการ: เล่นเมื่อ active, หยุดเมื่อไม่ active, แตะเพื่อหยุด/เล่น, จำว่า user กดหยุดเอง
import { useCallback, useEffect, useRef, useState } from 'react'
import { registerVideo, requestPlay, notifyPaused } from '../lib/videoManager.js'

/**
 * @param {boolean} active - การ์ดนี้อยู่ในจอ (จาก IntersectionObserver)
 * @returns { videoRef, playing, muted, userPaused, togglePlay, toggleMute, onVideoEvents }
 */
export function useVideoPlayback(active) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  // user กดหยุดเอง → ห้าม observer สั่งเล่นซ้ำจนกว่าจะเลื่อนออกแล้วกลับมา
  const userPausedRef = useRef(false)

  // pause จริง (เรียกได้จาก manager ตอนตัวอื่นเล่น)
  const doPause = useCallback(() => {
    const v = videoRef.current
    if (v && !v.paused) v.pause()
  }, [])

  // ลงทะเบียนกับ manager ครั้งเดียว
  const handleRef = useRef(null)
  if (!handleRef.current) handleRef.current = { pause: doPause }

  useEffect(() => {
    const reg = registerVideo(handleRef.current)
    return () => {
      reg.unregister()
    }
  }, [])

  // เล่น/หยุดตาม active — เคารพ userPaused
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      if (!userPausedRef.current) {
        requestPlay(handleRef.current) // หยุดตัวอื่นก่อน
        v.play().catch(() => {})
      }
    } else {
      // เลื่อนออกจากจอ → หยุด + รีเซ็ต + ล้าง userPaused (กลับมาใหม่ให้เล่นได้)
      v.pause()
      try { v.currentTime = 0 } catch { /* noop */ }
      userPausedRef.current = false
      notifyPaused(handleRef.current)
    }
  }, [active])

  // แตะวิดีโอ → สลับเล่น/หยุด (นี่คือ "กดหยุด" ที่ user ต้องการ)
  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      userPausedRef.current = false
      requestPlay(handleRef.current)
      v.play().catch(() => {})
    } else {
      userPausedRef.current = true // จำว่าหยุดเอง
      v.pause()
      notifyPaused(handleRef.current)
    }
  }, [])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  // sync state จาก event จริงของ <video> (กันหลุด sync)
  const onVideoEvents = {
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
  }

  return { videoRef, playing, muted, userPaused: userPausedRef, togglePlay, toggleMute, onVideoEvents }
}
