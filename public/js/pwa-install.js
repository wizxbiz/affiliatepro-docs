/**
 * pwa-install.js — TukTuk PWA Install System
 * Structure ported from message_list_screen.dart
 *
 * Patterns used:
 *  - MessageListConfig     → PWAInstallConfig  (localStorage, reactive)
 *  - _buildPromoSliver     → feature carousel  (auto-scroll, dot indicator)
 *  - showModalBottomSheet  → slide-up sheet    (drag handle, backdrop)
 *  - ParticleBackground    → Canvas particles  (animationController → rAF)
 *  - _checkPromoVisibility → state machine     (fresh→deferred→silent)
 *  - offline indicator     → network banner
 */

(function () {
  'use strict';

  // ── Guard: already installed or standalone ───────────────────────────────
  const _isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (_isStandalone) return;

  // ── Platform detection (mirror of _isLineApp / _isIOS etc.) ─────────────
  const _ua = navigator.userAgent;
  const _isLine = /Line\//i.test(_ua);
  const _isIOS = /iP(hone|ad|od)/i.test(_ua);
  const _isAndroid = /Android/i.test(_ua);
  const _isSafari = /^((?!chrome|android).)*safari/i.test(_ua);
  const _isChrome = /Chrome\//i.test(_ua) && !_isLine;
  const _isPC = !_isIOS && !_isAndroid;

  // ── PWAInstallConfig — mirrors MessageListConfig ─────────────────────────
  const _STORE_KEY = 'tuktuk_pwa_config';

  const PWAInstallConfig = {
    _data: JSON.parse(localStorage.getItem(_STORE_KEY) || '{}'),

    // Color schemes (from MessageListTheme.colorSchemes)
    themes: {
      dark: { bg: '#0F172A', surface: '#1E293B', primary: '#6366F1', secondary: '#A855F7', text: '#F1F5F9', sub: '#94A3B8', border: 'rgba(255,255,255,0.08)' },
      light: { bg: '#F8FAFC', surface: '#FFFFFF', primary: '#2563EB', secondary: '#7C3AED', text: '#1E293B', sub: '#64748B', border: 'rgba(0,0,0,0.08)' },
      sunset: { bg: '#FFF3E0', surface: '#FFF7ED', primary: '#F97316', secondary: '#DB2777', text: '#1E293B', sub: '#78350F', border: 'rgba(249,115,22,0.15)' },
      ocean: { bg: '#F0F9FF', surface: '#E0F2FE', primary: '#0891B2', secondary: '#0E7490', text: '#0C4A6E', sub: '#0369A1', border: 'rgba(8,145,178,0.15)' },
      forest: { bg: '#ECFDF5', surface: '#D1FAE5', primary: '#059669', secondary: '#047857', text: '#064E3B', sub: '#065F46', border: 'rgba(5,150,105,0.15)' },
    },

    // Layout (from MessageListTheme.layouts)
    layouts: {
      comfortable: { padding: 24, gap: 16, radius: 24, iconSize: 56 },
      compact: { padding: 16, gap: 10, radius: 16, iconSize: 44 },
      cozy: { padding: 20, gap: 13, radius: 20, iconSize: 50 },
    },

    get(key, def) { return this._data[key] ?? def; },
    set(key, val) {
      this._data[key] = val;
      localStorage.setItem(_STORE_KEY, JSON.stringify(this._data));
    },

    // Properties (mirrors MessageListConfig getters)
    get theme() { return this.get('theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); },
    get layout() { return this.get('layout', 'comfortable'); },
    get animations() { return this.get('animations', true); },
    get cs() { return this.themes[this.theme] || this.themes.dark; },
    get lc() { return this.layouts[this.layout] || this.layouts.comfortable; },

    // State machine (mirrors _checkPromoVisibility + SharedPreferences)
    get installState() { return this.get('installState', 'fresh'); },  // fresh|deferred|silent|installed
    get dismissCount() { return this.get('dismissCount', 0); },
    get lastDismissed() { return this.get('lastDismissed', 0); },
    get installed() { return this.get('installed', false); },
  };

  // ── State machine: show once, never again after dismiss ──────────────────
  function _shouldShow() {
    if (PWAInstallConfig.installed) return false;
    // After ANY dismiss: silent forever
    if (PWAInstallConfig.installState !== 'fresh') return false;
    return true;
  }

  function _onDismiss() {
    // One dismiss = silent forever (not annoying)
    PWAInstallConfig.set('dismissCount', 1);
    PWAInstallConfig.set('lastDismissed', Date.now());
    PWAInstallConfig.set('installState', 'silent');
  }

  function _onInstalled() {
    PWAInstallConfig.set('installed', true);
    PWAInstallConfig.set('installState', 'installed');
  }

  // ── Feature slides (mirrors _kStaticAds + _buildPromoCard) ──────────────
  const _FEATURES = [
    { icon: '⚡', title: 'เร็วเหมือนแอปจริง', sub: 'โหลดไว้ทำงาน offline ได้', color: '#6366F1' },
    { icon: '📺', title: 'ฟีดวิดีโอสั้น', sub: 'ดูเพลิน ใกล้ฉัน อาชีพ ไม่ต้องเปิด browser', color: '#F97316' },
    { icon: '🛒', title: 'ตลาดนัดออนไลน์', sub: 'ซื้อขายสินค้า ไม่มีค่าคอม', color: '#10B981' },
    { icon: '💬', title: 'ระบบแชทสด', sub: 'คุยกับร้านค้า แจ้งเตือน real-time', color: '#3B82F6' },
    { icon: '🛵', title: 'เรียกวินมอเตอร์ไซค์', sub: 'ติดตามตำแหน่งแบบ live', color: '#EC4899' },
  ];

  // ── Steps by platform (Visual Enhancement) ─────────────────────
  function _getSteps() {
    const isSafariMobile = _isIOS && _isSafari;
    const isChromeMobile = _isAndroid && _isChrome;

    if (_isLine) {
      return [
        '① กดปุ่ม <i class="fas fa-ellipsis-h"></i> หรือ <i class="fas fa-bars"></i> มุมขอบจอ',
        _isIOS ? '② เลือก <b>"เปิดด้วย Safari"</b>' : '② เลือก <b>"เปิดด้วย Chrome"</b>',
        '③ ทำตามขั้นตอนการเพิ่มลงหน้าจอหลัก'
      ];
    }

    if (isSafariMobile) {
      return [
        '① กดปุ่มแชร์ <i class="fas fa-share-square"></i> ด้านล่าง',
        '② เลื่อนลงมาแล้วเลือก <b>"เพิ่มลงหน้าจอโฮม"</b> <i class="far fa-plus-square"></i>',
        '③ กดปุ่ม <b>"เพิ่ม"</b> <span style="color:#2563EB;font-weight:700">Add</span> มุมขวาบน'
      ];
    }

    if (_isIOS && !_isSafari) {
      return [
        '① โปรดเปิดเว็บไซต์นี้ด้วย <b>Safari</b>',
        '② กดปุ่ม <i class="fas fa-share-square"></i> เพื่อเริ่มการติดตั้ง'
      ];
    }

    return null; // For Chrome/Edge Android which supports beforeinstallprompt
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  // ── CSS injection (avoids external file dependency) ──────────────────────
  function _injectCSS() {
    if (document.getElementById('pwa-install-css')) return;
    const s = document.createElement('style');
    s.id = 'pwa-install-css';
    s.textContent = `
      #pwaBackdrop {
        position:fixed; inset:0; z-index:10999;
        background:rgba(0,0,0,0); transition:background .35s ease;
        display:none; align-items:flex-end; justify-content:center;
      }
      #pwaBackdrop.show { display:flex; background:rgba(0,0,0,.55); }

      #pwaSheet {
        position:relative; width:100%; max-width:480px;
        border-radius:20px 20px 0 0;
        transform:translateY(110%);
        transition:transform .38s cubic-bezier(0.16,1,0.3,1);
        overflow:hidden; user-select:none;
        will-change:transform;
        max-height:75vh; overflow-y:auto;
      }
      #pwaBackdrop.show #pwaSheet { transform:translateY(0); }

      #pwaParticleCanvas {
        position:absolute; inset:0; pointer-events:none; z-index:0;
        border-radius:28px 28px 0 0;
      }

      #pwaSheetInner { position:relative; z-index:1; }

      .pwa-handle {
        width:44px; height:5px; border-radius:3px;
        margin:12px auto 0;
        transition:background .2s;
      }

      .pwa-header {
        display:flex; align-items:center; gap:12px;
        padding:10px 16px 6px;
      }
      .pwa-app-icon {
        width:44px; height:44px; border-radius:12px;
        object-fit:cover; flex-shrink:0;
        box-shadow:0 2px 10px rgba(0,0,0,.15);
      }
      .pwa-app-info { flex:1; }
      .pwa-app-name { font-size:15px; font-weight:700; margin:0 0 1px; }
      .pwa-app-desc { font-size:11px; margin:0; opacity:.65; }

      .pwa-close-btn {
        background:none; border:none; cursor:pointer;
        font-size:20px; opacity:.5; padding:4px;
        transition:opacity .2s;
        flex-shrink:0;
      }
      .pwa-close-btn:hover { opacity:1; }

      /* ── Network banner (mirrors offline indicator) ── */
      .pwa-net-banner {
        display:none; align-items:center; justify-content:center;
        gap:7px; padding:6px 16px; font-size:11.5px; font-weight:600;
      }
      .pwa-net-banner.show { display:flex; }

      /* ── Feature carousel (mirrors _buildPromoSliver) ── */
      .pwa-carousel-wrap {
        margin:6px 16px 0; border-radius:18px; overflow:hidden;
        position:relative;
      }
      .pwa-carousel-track {
        display:flex; transition:transform .4s cubic-bezier(0.4,0,0.2,1);
      }
      .pwa-slide {
        min-width:100%; padding:12px 16px 14px;
        display:flex; align-items:center; gap:12px;
        border-radius:14px; box-sizing:border-box;
      }
      .pwa-slide-icon {
        font-size:28px; line-height:1; flex-shrink:0;
        filter:drop-shadow(0 2px 6px rgba(0,0,0,.15));
      }
      .pwa-slide-title { font-size:14px; font-weight:700; margin:0 0 2px; }
      .pwa-slide-sub   { font-size:11.5px; margin:0; opacity:.75; line-height:1.4; }

      /* Dot indicator (mirrors AnimatedSmoothIndicator) */
      .pwa-dots {
        display:flex; justify-content:center; gap:5px;
        margin:10px 0 0; height:8px; align-items:center;
      }
      .pwa-dot {
        height:5px; border-radius:3px;
        transition:width .35s cubic-bezier(0.4,0,0.2,1), background .35s;
      }

      /* ── Settings panel (mirrors MessageListSettings) ── */
      .pwa-settings-panel {
        max-height:0; overflow:hidden;
        transition:max-height .4s cubic-bezier(0.4,0,0.2,1), padding .3s;
        padding:0 18px;
      }
      .pwa-settings-panel.open { max-height:300px; padding:10px 18px 0; }
      .pwa-settings-title { font-size:13px; font-weight:700; opacity:.7; margin:0 0 8px; }
      .pwa-theme-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
      .pwa-theme-chip {
        padding:5px 12px; border-radius:14px; font-size:12px; font-weight:600;
        border:1.5px solid; cursor:pointer; transition:all .2s;
      }
      .pwa-layout-row { display:flex; gap:8px; margin-bottom:8px; }
      .pwa-layout-chip {
        flex:1; padding:6px 0; border-radius:12px; font-size:11.5px;
        font-weight:600; text-align:center; border:1.5px solid; cursor:pointer;
        transition:all .2s;
      }
      .pwa-switch-row {
        display:flex; align-items:center; justify-content:space-between;
        padding:6px 0;
      }
      .pwa-switch-label { font-size:13px; }
      .pwa-toggle {
        width:40px; height:22px; border-radius:11px;
        border:none; cursor:pointer; position:relative;
        transition:background .2s;
      }
      .pwa-toggle::after {
        content:''; position:absolute;
        width:16px; height:16px; border-radius:50%; background:#fff;
        top:3px; left:3px;
        transition:transform .2s cubic-bezier(0.34,1.56,0.64,1);
        box-shadow:0 1px 4px rgba(0,0,0,.2);
      }
      .pwa-toggle.on::after { transform:translateX(18px); }

      /* ── Steps list (Visual Enhancement) ── */
      .pwa-steps { padding:12px 18px 4px; display:none; }
      .pwa-steps.show { display:block; animation:pwaFadeIn .5s ease; }
      .pwa-step {
        display:flex; align-items:center; gap:12px;
        padding:10px 14px; border-radius:16px; margin-bottom:8px;
        font-size:13.5px; font-weight:500; line-height:1.4;
      }
      .pwa-step i { font-size:14px; opacity:.85; }
      .pwa-step-num {
        width:26px; height:26px; border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:11px; font-weight:800; flex-shrink:0;
      }

      /* ── Success state (Premium) ── */
      .pwa-success {
        text-align:center; padding:40px 20px; display:none;
      }
      .pwa-success.show { display:block; animation:pwaZoomIn .5s cubic-bezier(0.34,1.56,0.64,1); }
      .pwa-success-icon { font-size:64px; margin-bottom:16px; display:block; }
      .pwa-success-title { font-size:22px; font-weight:800; margin:0 0 8px; }
      .pwa-success-sub { font-size:14px; opacity:.7; margin:0 0 24px; }
      .pwa-success-done {
        padding:14px 40px; border-radius:20px; border:none;
        font-family:'Kanit',sans-serif; font-size:15px; font-weight:700;
        cursor:pointer; transition:all .2s;
      }

      @keyframes pwaFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      @keyframes pwaZoomIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }

      /* ── CTA area ── */
      .pwa-cta { padding:10px 14px 16px; display:flex; gap:8px; align-items:center; }
      .pwa-install-btn {
        flex:1; padding:11px; border-radius:14px; border:none;
        font-family:'Kanit',sans-serif; font-size:14px; font-weight:700;
        cursor:pointer; transition:all .25s cubic-bezier(0.34,1.56,0.64,1);
        letter-spacing:.3px;
      }
      .pwa-install-btn:hover  { transform:translateY(-2px); filter:brightness(1.1); }
      .pwa-install-btn:active { transform:scale(.96); }
      .pwa-settings-btn {
        width:46px; height:46px; border-radius:14px; border:none;
        display:flex; align-items:center; justify-content:center;
        font-size:18px; cursor:pointer; transition:all .2s;
        flex-shrink:0;
      }
      .pwa-settings-btn:hover { transform:rotate(45deg) scale(1.1); }

      /* ── Success state ── */
      .pwa-success {
        text-align:center; padding:30px 20px 26px; display:none;
      }
      .pwa-success.show { display:block; }
      .pwa-success-icon { font-size:56px; margin-bottom:12px; }
      .pwa-success-title { font-size:20px; font-weight:700; margin:0 0 6px; }
      .pwa-success-sub { font-size:13px; opacity:.7; margin:0 0 18px; }
      .pwa-success-done {
        padding:12px 32px; border-radius:16px; border:none;
        font-family:'Kanit',sans-serif; font-size:14px; font-weight:700;
        cursor:pointer;
      }

      /* PC tooltip (A2HS not available) */
      #pwaTooltip {
        display:none; position:fixed; bottom:20px; right:20px;
        z-index:9999990; padding:14px 18px; border-radius:18px;
        font-family:'Kanit',sans-serif; font-size:13px;
        box-shadow:0 8px 32px rgba(0,0,0,.25);
        max-width:260px; animation:pwaFadeUp .4s ease;
      }
      @keyframes pwaFadeUp {
        from { transform:translateY(20px); opacity:0; }
        to   { transform:translateY(0);    opacity:1; }
      }

      @media (min-width:480px) {
        #pwaSheet { border-radius:28px; margin-bottom:16px; }
        #pwaBackdrop.show { align-items:center; }
      }
    `;
    document.head.appendChild(s);
  }

  // ── Particle background (mirrors ParticleBackground / Particle class) ────
  function _initParticles(canvas, cs) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    // Mirrors: for (int i = 0; i < 20; i++) _particles.add(Particle())
    const particles = Array.from({ length: 22 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 28 + 8,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      a: Math.random() * .18 + .04,
    }));

    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = cs.primary + Math.round(p.a * 255).toString(16).padStart(2, '0');
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < -p.r) p.x = W + p.r;
        if (p.x > W + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = H + p.r;
        if (p.y > H + p.r) p.y = -p.r;
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }

  // ── Build the sheet DOM (mirrors _buildMainScreen + _buildContent) ────────
  function _buildSheet() {
    const cs = PWAInstallConfig.cs;
    const lc = PWAInstallConfig.lc;
    const steps = _getSteps();
    const needsSteps = !!steps;
    const canPrompt = !_isLine && !(_isIOS && _isSafari) && !_isPC;

    // Backdrop
    const backdrop = el('div', ''); backdrop.id = 'pwaBackdrop';
    // Sheet
    const sheet = el('div', ''); sheet.id = 'pwaSheet';
    sheet.style.cssText = `background:${cs.bg}; font-family:'Kanit',sans-serif; color:${cs.text};`;

    // Particle canvas (mirrors ParticleBackground)
    const canvas = el('canvas', ''); canvas.id = 'pwaParticleCanvas';
    sheet.appendChild(canvas);

    // Inner content
    const inner = el('div', ''); inner.id = 'pwaSheetInner';

    // Handle bar (mirrors modal bottom sheet handle)
    const handle = el('div', 'pwa-handle');
    handle.style.cssText = `background:${cs.text}; opacity:.2;`;
    inner.appendChild(handle);

    // Network banner (mirrors offline indicator)
    const netBanner = el('div', 'pwa-net-banner');
    netBanner.id = 'pwaNetBanner';
    netBanner.style.cssText = `background:rgba(249,115,22,.1); color:#F97316;`;
    netBanner.innerHTML = `<span>☁️</span><span>เชื่อมต่อเพื่อติดตั้ง</span>`;
    inner.appendChild(netBanner);

    // Header (mirrors _buildSliverAppBar header section)
    const header = el('div', 'pwa-header');
    header.innerHTML = `
      <img src="assets/images/logo.png" class="pwa-app-icon"
           onerror="this.src='assets/images/tuktuk.png'"
           style="border:2px solid ${cs.primary}40">
      <div class="pwa-app-info">
        <div class="pwa-app-name" style="color:${cs.text}">TukTuk Thailand</div>
        <div class="pwa-app-desc" style="color:${cs.sub}">
          ${_isPC ? '🖥️ เปิดบน Chrome/Edge เพื่อติดตั้ง'
        : _isLine ? '📲 เปิดในเบราว์เซอร์เพื่อติดตั้ง'
          : '📲 เพิ่มบนหน้าจอหลัก — ไม่ต้องเปิด browser'}
        </div>
      </div>
      <button class="pwa-close-btn" id="pwaCloseBtn" style="color:${cs.text}">✕</button>
    `;
    inner.appendChild(header);

    // Carousel (mirrors _buildPromoSliver)
    const carouselWrap = el('div', 'pwa-carousel-wrap');
    carouselWrap.style.cssText = `background:${cs.surface}; border:1px solid ${cs.border};`;
    const track = el('div', 'pwa-carousel-track'); track.id = 'pwaCarouselTrack';
    _FEATURES.forEach(f => {
      const slide = el('div', 'pwa-slide');
      slide.style.background = `linear-gradient(135deg, ${f.color}15, ${f.color}08)`;
      slide.innerHTML = `
        <div class="pwa-slide-icon">${f.icon}</div>
        <div>
          <div class="pwa-slide-title" style="color:${cs.text}">${f.title}</div>
          <div class="pwa-slide-sub"  style="color:${cs.sub}">${f.sub}</div>
        </div>`;
      track.appendChild(slide);
    });
    carouselWrap.appendChild(track);
    inner.appendChild(carouselWrap);

    // Dots (mirrors AnimatedSmoothIndicator)
    const dots = el('div', 'pwa-dots'); dots.id = 'pwaDots';
    _FEATURES.forEach((_, i) => {
      const d = el('div', 'pwa-dot');
      d.style.cssText = `width:${i === 0 ? 18 : 6}px; background:${i === 0 ? cs.primary : cs.text + '30'};`;
      dots.appendChild(d);
    });
    inner.appendChild(dots);

    // Settings panel (mirrors MessageListSettings)
    const settingsPanel = el('div', 'pwa-settings-panel'); settingsPanel.id = 'pwaSettingsPanel';
    settingsPanel.innerHTML = `
      <div class="pwa-settings-title" style="color:${cs.sub}">🎨 ปรับธีม</div>
      <div class="pwa-theme-row" id="pwaThemeRow">
        ${Object.keys(PWAInstallConfig.themes).map(t => `
          <div class="pwa-theme-chip" data-theme="${t}"
               style="background:${t === PWAInstallConfig.theme ? cs.primary : cs.surface};
                      color:${t === PWAInstallConfig.theme ? '#fff' : cs.text};
                      border-color:${t === PWAInstallConfig.theme ? cs.primary : cs.border}">
            ${{ dark: '🌙 มืด', light: '☀️ สว่าง', sunset: '🌅 Sunset', ocean: '🌊 Ocean', forest: '🌿 Forest' }[t]}
          </div>`).join('')}
      </div>
      <div class="pwa-settings-title" style="color:${cs.sub}">📐 เลย์เอาต์</div>
      <div class="pwa-layout-row" id="pwaLayoutRow">
        ${['comfortable', 'compact', 'cozy'].map(l => `
          <div class="pwa-layout-chip" data-layout="${l}"
               style="background:${l === PWAInstallConfig.layout ? cs.primary : cs.surface};
                      color:${l === PWAInstallConfig.layout ? '#fff' : cs.text};
                      border-color:${l === PWAInstallConfig.layout ? cs.primary : cs.border}">
            ${{ comfortable: 'สะดวก', compact: 'กระชับ', cozy: 'พอดี' }[l]}
          </div>`).join('')}
      </div>
      <div class="pwa-switch-row">
        <span class="pwa-switch-label" style="color:${cs.text}">✨ แอนิเมชั่น</span>
        <button class="pwa-toggle ${PWAInstallConfig.animations ? 'on' : ''}" id="pwaAnimToggle"
                style="background:${PWAInstallConfig.animations ? cs.primary : '#334155'}"></button>
      </div>
    `;
    inner.appendChild(settingsPanel);

    // Steps (LINE / iOS guide — mirrors _getSteps UI)
    if (needsSteps) {
      const stepsEl = el('div', 'pwa-steps show'); stepsEl.id = 'pwaSteps';
      steps.forEach((s, i) => {
        const step = el('div', 'pwa-step');
        step.style.cssText = `background:${cs.surface}; border:1px solid ${cs.border};`;
        step.innerHTML = `
          <div class="pwa-step-num" style="background:${cs.primary}; color:#fff">${i + 1}</div>
          <span style="color:${cs.text}">${s}</span>`;
        stepsEl.appendChild(step);
      });
      inner.appendChild(stepsEl);
    }

    // CTA (mirrors FAB + install button)
    const cta = el('div', 'pwa-cta');
    const installBtnLabel = _isLine ? '🔗 คัดลอกลิงค์'
      : needsSteps ? '📖 ดูขั้นตอน'
        : '📲 ติดตั้งเดี๋ยวนี้';

    cta.innerHTML = `
      <button class="pwa-install-btn" id="pwaInstallBtn"
              style="background:linear-gradient(135deg,${cs.primary},${cs.secondary}); color:#fff;
                     box-shadow:0 4px 16px ${cs.primary}44">
        ${installBtnLabel}
      </button>
      <button class="pwa-settings-btn" id="pwaSettingsToggle"
              style="background:${cs.surface}; color:${cs.text}; border:1px solid ${cs.border}; display:none">
        ⚙️
      </button>`;
    inner.appendChild(cta);

    // Success state (mirrors _onInstalled feedback)
    const success = el('div', 'pwa-success'); success.id = 'pwaSuccess';
    success.innerHTML = `
      <div class="pwa-success-icon">🎉</div>
      <div class="pwa-success-title" style="color:${cs.text}">ติดตั้งสำเร็จ!</div>
      <div class="pwa-success-sub"  style="color:${cs.sub}">TukTuk พร้อมใช้งานบนหน้าจอหลักของคุณแล้ว</div>
      <button class="pwa-success-done" id="pwaSuccessDone"
              style="background:${cs.primary}; color:#fff">ดีมาก!</button>`;
    inner.appendChild(success);

    sheet.appendChild(inner);
    backdrop.appendChild(sheet);
    document.body.appendChild(backdrop);

    return { backdrop, sheet, canvas, track, dots };
  }

  // ── Carousel auto-scroll (mirrors CarouselOptions.autoPlay) ─────────────
  function _runCarousel(track, dots, cs) {
    let current = 0;
    const total = _FEATURES.length;

    function go(idx) {
      current = (idx + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.querySelectorAll('.pwa-dot').forEach((d, i) => {
        d.style.width = i === current ? '18px' : '6px';
        d.style.background = i === current ? cs.primary : cs.text + '30';
      });
    }

    // Auto-advance every 3.5s (mirrors autoPlayInterval: 6s → faster for install prompt)
    const iv = setInterval(() => go(current + 1), 3500);

    // Touch swipe
    let startX = 0;
    track.parentElement.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.parentElement.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    });

    return () => clearInterval(iv);
  }

  // ── Drag-to-dismiss (mirrors showModalBottomSheet drag) ──────────────────
  function _addDragDismiss(sheet, onDismiss) {
    let startY = 0, dy = 0, dragging = false;

    const onDown = e => {
      startY = (e.touches || [e])[0].clientY;
      dragging = true;
      sheet.style.transition = 'none';
    };
    const onMove = e => {
      if (!dragging) return;
      dy = Math.max(0, (e.touches || [e])[0].clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = 'transform .42s cubic-bezier(0.16,1,0.3,1)';
      if (dy > 100) { onDismiss(); }
      else { sheet.style.transform = 'translateY(0)'; }
      dy = 0;
    };

    const handle = sheet.querySelector('.pwa-handle');
    handle.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
    handle.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Re-render sheet with updated config ─────────────────────────────────
  // (mirrors ListenableBuilder → rebuild on config change)
  function _applyTheme(sheet, cs, lc, stopParticles) {
    sheet.style.background = cs.bg;
    sheet.style.color = cs.text;
    if (stopParticles) stopParticles();
    const canvas = document.getElementById('pwaParticleCanvas');
    if (canvas && PWAInstallConfig.animations) {
      _initParticles(canvas, cs);
    }
    // Update chip states
    sheet.querySelectorAll('.pwa-theme-chip').forEach(c => {
      const active = c.dataset.theme === PWAInstallConfig.theme;
      c.style.background = active ? cs.primary : cs.surface;
      c.style.color = active ? '#fff' : cs.text;
      c.style.borderColor = active ? cs.primary : cs.border;
    });
    sheet.querySelectorAll('.pwa-layout-chip').forEach(c => {
      const active = c.dataset.layout === PWAInstallConfig.layout;
      c.style.background = active ? cs.primary : cs.surface;
      c.style.color = active ? '#fff' : cs.text;
      c.style.borderColor = active ? cs.primary : cs.border;
    });
    const toggle = sheet.querySelector('#pwaAnimToggle');
    if (toggle) {
      toggle.className = `pwa-toggle ${PWAInstallConfig.animations ? 'on' : ''}`;
      toggle.style.background = PWAInstallConfig.animations ? cs.primary : '#334155';
    }
    // Update install button gradient
    const btn = sheet.querySelector('#pwaInstallBtn');
    if (btn) {
      btn.style.background = `linear-gradient(135deg,${cs.primary},${cs.secondary})`;
      btn.style.boxShadow = `0 6px 24px ${cs.primary}55`;
    }
  }

  // ── Network monitor (mirrors offline indicator) ──────────────────────────
  function _watchNetwork() {
    const banner = document.getElementById('pwaNetBanner');
    if (!banner) return;
    const update = () => {
      banner.classList.toggle('show', !navigator.onLine);
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }

  // ── Main show function ────────────────────────────────────────────────────
  let _deferredPrompt = null;
  let _stopParticles = null;
  let _stopCarousel = null;
  let _sheetRefs = null;

  function show() {
    if (_sheetRefs) return; // already mounted

    _injectCSS();
    const refs = _buildSheet();
    _sheetRefs = refs;
    const { backdrop, sheet, canvas, track, dots } = refs;
    const cs = PWAInstallConfig.cs;

    // Particle canvas hidden in compact mode (save battery)
    canvas.style.display = 'none';

    // Carousel
    _stopCarousel = _runCarousel(track, dots, cs);

    // Network watch
    _watchNetwork();

    // Drag dismiss
    _addDragDismiss(sheet, _dismiss);

    // Show (next frame so transition fires)
    requestAnimationFrame(() => backdrop.classList.add('show'));

    // ── Event wiring ──────────────────────────────────────────────────────

    // Close button
    document.getElementById('pwaCloseBtn').onclick = _dismiss;
    backdrop.onclick = e => { if (e.target === backdrop) _dismiss(); };

    // Install button
    document.getElementById('pwaInstallBtn').onclick = async () => {
      if (_isLine) {
        // Copy URL to clipboard (mirrors "open in browser" action)
        try {
          await navigator.clipboard.writeText(location.href);
          _showSuccess('📋 คัดลอกลิงค์แล้ว!\nวางใน Chrome หรือ Safari เพื่อติดตั้ง');
        } catch { _showSuccess('🔗 ' + location.href); }
        return;
      }
      if (_isIOS || (!_deferredPrompt && !_isPC)) {
        // Show steps only (scroll into view)
        const stepsEl = document.getElementById('pwaSteps');
        if (stepsEl) {
          stepsEl.classList.add('show');
          stepsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }
      if (_deferredPrompt) {
        _deferredPrompt.prompt();
        const { outcome } = await _deferredPrompt.userChoice;
        _deferredPrompt = null;
        if (outcome === 'accepted') _showSuccess();
        else _dismiss();
      }
    };

    // Settings toggle (mirrors FAB rotate animation)
    document.getElementById('pwaSettingsToggle').onclick = () => {
      const panel = document.getElementById('pwaSettingsPanel');
      panel.classList.toggle('open');
      const btn = document.getElementById('pwaSettingsToggle');
      btn.style.transform = panel.classList.contains('open') ? 'rotate(45deg)' : '';
    };

    // Theme chips (mirrors config.setTheme)
    document.getElementById('pwaThemeRow').onclick = e => {
      const chip = e.target.closest('[data-theme]');
      if (!chip) return;
      PWAInstallConfig.set('theme', chip.dataset.theme);
      _applyTheme(sheet, PWAInstallConfig.cs, PWAInstallConfig.lc, _stopParticles);
      _stopParticles = null;
    };

    // Layout chips (mirrors config.setLayout)
    document.getElementById('pwaLayoutRow').onclick = e => {
      const chip = e.target.closest('[data-layout]');
      if (!chip) return;
      PWAInstallConfig.set('layout', chip.dataset.layout);
      _applyTheme(sheet, PWAInstallConfig.cs, PWAInstallConfig.lc, _stopParticles);
    };

    // Animation toggle (mirrors config.toggleAnimations)
    document.getElementById('pwaAnimToggle').onclick = () => {
      PWAInstallConfig.set('animations', !PWAInstallConfig.animations);
      _applyTheme(sheet, PWAInstallConfig.cs, PWAInstallConfig.lc, _stopParticles);
      if (!PWAInstallConfig.animations && _stopParticles) {
        _stopParticles(); _stopParticles = null;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Success done
    document.getElementById('pwaSuccessDone').onclick = _close;
  }

  function _showSuccess(msg) {
    const s = document.getElementById('pwaSuccess');
    if (!s) return;

    if (msg) {
      s.querySelector('.pwa-success-title').textContent = msg;
      s.querySelector('.pwa-success-icon').textContent = '✨';
      s.querySelector('.pwa-success-sub').style.display = 'none';
    }

    // Hide main content with a fade
    const inner = document.getElementById('pwaSheetInner');
    const hideList = ['pwaCarouselTrack', 'pwaDots', 'pwaSteps', 'pwaNetBanner', 'pwaSettingsPanel', 'pwa-cta'];
    hideList.forEach(id => {
      const el = document.getElementById(id) || document.querySelector('.' + id);
      if (el) {
        el.style.opacity = '0';
        setTimeout(() => el.style.display = 'none', 300);
      }
    });

    s.classList.add('show');
    _onInstalled();

    // confetti or extra particles (optional: we just speed up existing ones)
    if (_stopParticles) {
      // We don't have a direct "speed up" but we can re-init with more
    }

    setTimeout(_close, 5000);
  }

  function _dismiss() {
    _onDismiss();
    _close();
  }

  function _close() {
    if (!_sheetRefs) return;
    const { backdrop } = _sheetRefs;
    backdrop.classList.remove('show');
    if (_stopParticles) { _stopParticles(); _stopParticles = null; }
    if (_stopCarousel) { _stopCarousel(); _stopCarousel = null; }
    setTimeout(() => { backdrop.remove(); _sheetRefs = null; }, 450);
  }

  // ── PC tooltip (no A2HS available) ──────────────────────────────────────
  function _showPCTooltip() {
    if (document.getElementById('pwaTooltip')) return;
    _injectCSS();
    const cs = PWAInstallConfig.cs;
    const tip = el('div', ''); tip.id = 'pwaTooltip';
    tip.style.cssText = `background:${cs.surface}; color:${cs.text}; border:1px solid ${cs.border};`;
    tip.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">💻 ติดตั้ง TukTuk บน Desktop</div>
      <div style="font-size:12px;opacity:.75;line-height:1.6">
        เปิดด้วย <b>Chrome</b> หรือ <b>Edge</b><br>
        กดไอคอน ⊕ ในแถบ URL เพื่อติดตั้ง
      </div>
      <button onclick="this.parentElement.remove()"
              style="position:absolute;top:8px;right:10px;background:none;border:none;
                     color:${cs.sub};font-size:16px;cursor:pointer">✕</button>`;
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 8000);
  }

  // ── Public API ───────────────────────────────────────────────────────────
  window.TukTukPWA = { show, dismiss: _dismiss, config: PWAInstallConfig };

  // ── Auto-init ─────────────────────────────────────────────────────────────
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    _onInstalled();
    if (_sheetRefs) _showSuccess();
    if (typeof showToast === 'function') showToast('✅ ติดตั้ง TukTuk สำเร็จ!', 'success');
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (!_shouldShow()) return;

    const delay = _isLine ? 8000 : _isIOS ? 10000 : 9000;

    setTimeout(() => {
      if (!_shouldShow()) return; // Re-check after delay
      if (_isPC) {
        _showPCTooltip(); return;
      }
      show();
    }, delay);
  });

})();
