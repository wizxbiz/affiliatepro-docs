/**
 * TukTuk Push Notification Manager
 * ─────────────────────────────────
 * Handles:
 *  - Web Push subscription (VAPID)
 *  - App Badge API (unread count on PWA icon)
 *  - Web Share API (share products/posts)
 *
 * Usage:
 *   TukTukNotify.init()          → call after user is logged in
 *   TukTukNotify.badge(n)        → update icon badge
 *   TukTukNotify.share(obj)      → share via OS share sheet
 */

(function () {
  'use strict';

  const VAPID_PUBLIC = 'BB1PIY55wKXv37de8hWFkxxyE3SMRu1PXOBwYPVY1dA5Tz5O7n9FHPpQDihraJ_G7qjnLVF6EiPGxI3XsU5m--Q';
  
  // Point Push logic to Cloudflare Workers D1 subscription endpoint
  const CF_BASE = '/api/v1/push';

  // ── VAPID key helper ────────────────────────────────────────────────────────
  function _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  // ── Permission UI ───────────────────────────────────────────────────────────
  function _showPermissionPrompt(onAllow, onDeny) {
    // Non-intrusive banner — not browser native dialog
    const banner = document.createElement('div');
    banner.id = '_tuktuk_push_banner';
    banner.innerHTML = `
      <div style="
        position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
        width:calc(100% - 32px); max-width:400px; z-index:9999999;
        background:linear-gradient(135deg,#1e1b4b,#312e81);
        border:1px solid rgba(99,102,241,0.4);
        border-radius:20px; padding:18px 20px;
        box-shadow:0 16px 50px rgba(0,0,0,0.55);
        font-family:'Kanit',sans-serif; color:#fff;
        animation: _tuktukSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
      ">
        <style>
          @keyframes _tuktukSlideUp {
            from { opacity:0; transform:translateX(-50%) translateY(30px); }
            to   { opacity:1; transform:translateX(-50%) translateY(0); }
          }
        </style>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="font-size:28px;line-height:1;">🔔</div>
          <div>
            <div style="font-weight:700;font-size:15px;">รับการแจ้งเตือน</div>
            <div style="font-size:12px;opacity:0.8;margin-top:2px;">ออเดอร์ใหม่ ข้อความ และการอัปเดตจาก TukTuk</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <button id="_tuktukPushAllow" style="
            flex:1; padding:10px; border-radius:12px;
            background:linear-gradient(135deg,#6366f1,#a855f7);
            border:none; color:#fff; font-family:'Kanit',sans-serif;
            font-weight:700; font-size:14px; cursor:pointer;
          ">✅ อนุญาต</button>
          <button id="_tuktukPushDeny" style="
            padding:10px 18px; border-radius:12px;
            background:rgba(255,255,255,0.08);
            border:1px solid rgba(255,255,255,0.15);
            color:rgba(255,255,255,0.65); font-family:'Kanit',sans-serif;
            font-size:13px; cursor:pointer;
          ">ไม่ตอนนี้</button>
        </div>
      </div>`;
    document.body.appendChild(banner);

    document.getElementById('_tuktukPushAllow').onclick = () => {
      banner.remove();
      onAllow();
    };
    document.getElementById('_tuktukPushDeny').onclick = () => {
      banner.remove();
      localStorage.setItem('_tuktuk_push_denied_at', Date.now().toString());
      if (onDeny) onDeny();
    };

    // Auto-dismiss after 15s
    setTimeout(() => banner?.remove(), 15000);
  }

  // ── Subscribe ───────────────────────────────────────────────────────────────
  async function _subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }

  async function _saveSubscription(subscription, uid) {
    try {
      const body = {
        data: {
          subscription: (typeof subscription.toJSON === 'function') ? subscription.toJSON() : subscription,
          uid
        }
      };
      const resp = await fetch(`${CF_BASE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error('CF save failed');
      console.log('[Push] Subscription saved to server');
    } catch (e) {
      // Fallback: save directly to Firestore via REST if Firebase SDK available
      if (window.firebase?.firestore) {
        const db = window.firebase.firestore();
        const deviceId = btoa(subscription.endpoint).slice(-20);
        await db.collection('push_subscriptions').doc(uid)
          .collection('devices').doc(deviceId).set({
            subscription: subscription.toJSON(),
            userAgent: navigator.userAgent.slice(0, 120),
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        console.log('[Push] Subscription saved via Firestore SDK');
      }
    }
  }

  // ── App Badge API ───────────────────────────────────────────────────────────
  let _badgeCount = 0;

  function setBadge(count) {
    _badgeCount = Math.max(0, count);
    if ('setAppBadge' in navigator) {
      if (_badgeCount > 0) {
        navigator.setAppBadge(_badgeCount).catch(() => { });
      } else {
        navigator.clearAppBadge().catch(() => { });
      }
    }
    // Also update mobile header badge
    if (typeof window.updatePillNotifCount === 'function') {
      window.updatePillNotifCount(_badgeCount);
    }
  }

  function incrementBadge() { setBadge(_badgeCount + 1); }
  function clearBadge() { setBadge(0); }

  // ── Web Share API ───────────────────────────────────────────────────────────
  async function share({ title, text, url, files } = {}) {
    // Native share sheet (iOS Safari, Android Chrome, Desktop Chrome 89+)
    if (navigator.canShare && navigator.canShare({ title, text, url })) {
      try {
        await navigator.share({ title, text, url, files });
        return { success: true, method: 'native' };
      } catch (e) {
        if (e.name === 'AbortError') return { success: false, method: 'cancelled' };
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url || text || title || '');
      _showToast('📋 คัดลอกลิงก์แล้ว!');
      return { success: true, method: 'clipboard' };
    } catch (_) {
      // Last resort: prompt
      window.prompt('คัดลอกลิงก์:', url || text || '');
      return { success: true, method: 'prompt' };
    }
  }

  function _showToast(msg) {
    if (typeof showToast === 'function') { showToast(msg, 'success'); return; }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
      background:#10b981;color:#fff;padding:10px 20px;border-radius:12px;
      font-family:'Kanit',sans-serif;font-size:14px;font-weight:600;
      z-index:9999999;box-shadow:0 8px 24px rgba(0,0,0,0.3);
      animation:_tuktukSlideUp 0.3s ease;`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  async function init(uid) {
    if (!uid) return;
    if (!('Notification' in window)) return;

    // Already granted — subscribe silently
    if (Notification.permission === 'granted') {
      try {
        const sub = await _subscribe();
        if (sub) await _saveSubscription(sub, uid);
      } catch (e) {
        console.warn('[Push] Silent subscribe failed:', e.message);
      }
      return;
    }

    // Denied — don't ask again
    if (Notification.permission === 'denied') return;

    // Check cooldown (7 days after "ไม่ตอนนี้")
    const deniedAt = localStorage.getItem('_tuktuk_push_denied_at');
    if (deniedAt && Date.now() - parseInt(deniedAt) < 7 * 86400000) return;

    // Already asked this session
    if (sessionStorage.getItem('_tuktuk_push_asked')) return;
    sessionStorage.setItem('_tuktuk_push_asked', '1');

    // Show non-intrusive banner after 5s
    setTimeout(() => {
      _showPermissionPrompt(async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          try {
            const sub = await _subscribe();
            if (sub) {
              await _saveSubscription(sub, uid);
              _showToast('🔔 เปิดการแจ้งเตือนสำเร็จ!');
            }
          } catch (e) {
            console.warn('[Push] Subscribe failed:', e.message);
          }
        } else {
          localStorage.setItem('_tuktuk_push_denied_at', Date.now().toString());
        }
      });
    }, 5000);
  }

  // ── Share button helper ─────────────────────────────────────────────────────
  // Attach to any element: <button onclick="TukTukNotify.shareProduct(product)">แชร์</button>
  function shareProduct(product) {
    const id = product.id || product.productId;
    // URL for OG Tag preview handler
    const url = `${location.origin}/share?id=${id}`;
    const name = product.productName || product.name || 'สินค้า';
    const price = product.price ? ` ฿${product.price.toLocaleString()}` : '';
    return share({
      title: `${name}${price} — TukTuk Thailand`,
      text: `ดูสินค้า "${name}"${price} บน TukTuk Thailand 🛍️`,
      url,
    });
  }

  function sharePost(post) {
    const id = post.id || post.postId;
    // URL for OG Tag preview handler
    const url = `${location.origin}/community-share?id=${id}`;
    const text = post.description || post.caption || post.text || '';
    return share({
      title: 'TukTuk Thailand',
      text: text.slice(0, 120) + (text.length > 120 ? '...' : ''),
      url,
    });
  }

  // ── Expose ──────────────────────────────────────────────────────────────────
  window.TukTukNotify = { init, setBadge, incrementBadge, clearBadge, share, shareProduct, sharePost };

  // Auto-init when Firebase Auth state changes
  document.addEventListener('DOMContentLoaded', () => {
    // Hook into WizmobizAuth session
    const _pollSession = setInterval(() => {
      const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getSession() : null;
      if (session?.uid) {
        clearInterval(_pollSession);
        init(session.uid);
        // Clear badge when user opens the app
        clearBadge();
      }
    }, 1000);
    // Stop polling after 30s if no login
    setTimeout(() => clearInterval(_pollSession), 30000);
  });

})();
