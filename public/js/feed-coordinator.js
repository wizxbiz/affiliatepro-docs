/**
 * 🎬 TukTuk Feed Coordinator
 * ─────────────────────────────────────────────────────────────────────────────
 * ตัวกลางประสานงานระหว่าง PC Feed Engine และ Mobile (TikTok-style) Feed Engine
 * เพื่อป้องกัน:
 *   1. เสียงวิดีโอเล่นซ้อนกันจาก 2 Engine พร้อมกัน
 *   2. Active observer ที่ conflict กัน ตอน responsive resize
 *
 * วิธีใช้:
 *   window.TukTukFeedCoordinator.registerEngine('pc')    // บอกว่า PC engine เริ่มทำงาน
 *   window.TukTukFeedCoordinator.registerEngine('mobile') // บอกว่า Mobile engine เริ่มทำงาน
 *   window.TukTukFeedCoordinator.pauseAll()               // หยุดทุก video + iframe ใน DOM
 *   window.TukTukFeedCoordinator.onOverlayOpen()          // เรียกตอนเปิด overlay/modal ใดๆ
 *   window.TukTukFeedCoordinator.activeEngine             // อ่าน engine ที่กำลัง active อยู่
 */
;(function () {
  'use strict';

  // ── helpers ──────────────────────────────────────────────────────────────────

  /**
   * ส่งคำสั่ง pauseVideo ไปยัง YouTube iframe ผ่าน postMessage
   * (iframe ต้องมี ?enablejsapi=1 ใน src)
   */
  function _pauseYouTubeIframe(frame) {
    try {
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        'https://www.youtube.com'
      );
    } catch (_) { /* noop */ }
  }

  /**
   * หยุด <video> element
   */
  function _pauseVideo(el) {
    try {
      if (el && !el.paused) el.pause();
    } catch (_) { /* noop */ }
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  let _activeEngine = null; // 'pc' | 'mobile' | null

  const coordinator = {
    get activeEngine() { return _activeEngine; },

    /**
     * Engine ใดก็ตามเรียกตอนเริ่มทำงาน
     * ถ้า engine เดิมที่ active ต่างกัน → pause ทุกอย่างก่อน
     * @param {'pc'|'mobile'} engineName
     */
    registerEngine(engineName) {
      if (_activeEngine && _activeEngine !== engineName) {
        console.log(`[Coordinator] Switching from ${_activeEngine} → ${engineName}. Pausing all.`);
        this.pauseAll();
      }
      _activeEngine = engineName;
      console.log(`[Coordinator] Active engine: ${engineName}`);
    },

    /**
     * หยุดวิดีโอทุกตัวทั่ว DOM
     * - <video> ทุกตัว
     * - YouTube <iframe> ทุกตัว (ผ่าน postMessage)
     * - TukTuk custom video wrappers (.tuktuk-slide-video, .tuktuk-video-item)
     */
    pauseAll() {
      // 1. HTML5 video elements
      document.querySelectorAll('video').forEach(_pauseVideo);

      // 2. YouTube iframes (ต้องมี enablejsapi=1 ใน src)
      document.querySelectorAll('iframe[src*="youtube.com/embed"]').forEach(_pauseYouTubeIframe);

      // 3. ถ้า tuktuk_feed_logic มี public API ให้เรียก
      try {
        if (typeof window._pauseAllTukTukVideos === 'function') {
          window._pauseAllTukTukVideos();
        }
      } catch (_) { /* noop */ }

      // 4. ถ้า pc-feed-engine มี observer ที่สามารถ disable ได้
      try {
        if (typeof window._pcFeedPauseAll === 'function') {
          window._pcFeedPauseAll();
        }
      } catch (_) { /* noop */ }
    },

    /**
     * เรียกตอนเปิด overlay ใดๆ (comment sheet, image viewer, product modal)
     * เพื่อหยุดวิดีโอพื้นหลังทันที
     */
    onOverlayOpen() {
      this.pauseAll();
    },

    /**
     * เรียกตอนปิด overlay — ไม่ได้สั่ง resume อัตโนมัติ
     * ให้ engine นั้นๆ จัดการ resume เอง (ตาม IntersectionObserver)
     */
    onOverlayClose() {
      // Intentionally empty — engine จัดการ resume เอง
    },
  };

  window.TukTukFeedCoordinator = coordinator;
  console.log('[TukTukFeedCoordinator] Initialized ✅');
})();
