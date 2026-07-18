/**
 * TukTuk LIFF Auto-Login v1.1
 * ─────────────────────────────────────────────────────────────────
 * Silently authenticates users who open the app inside LINE IAB.
 * - Loads LIFF SDK on demand (not bundled — avoids slowing external browsers)
 * - Uses window.TUKTUK_LIFF.main LIFF ID (register endpoint: https://tuktukfeed.com/)
 * - On success: stores 30-day session → fires 'tuktuk:autologin' event
 * - On failure: falls back gracefully, no error shown to user
 *
 * IMPORTANT: Does NOT call liff.login() — that would redirect to access.line.me
 * which LINE IAB blocks. If not logged in, redirects to /login instead.
 *
 * To enable:
 *   1. LINE Developers Console → Channel → LIFF → Add
 *      Name: TukTuk Main, Size: Full, Endpoint: https://tuktukfeed.com/
 *   2. Copy LIFF ID → liff-config.js → window.TUKTUK_LIFF.main = "2009159046-XXXXXXXX"
 */

(function () {
    'use strict';

    const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Only run inside LINE app
    if (!/Line\//i.test(navigator.userAgent)) return;

    // Skip on login.html — that page handles LIFF login itself via triggerLiffLogin()
    if (window.location.pathname.includes('login')) return;

    // Check if already logged in (valid session within 30 days)
    function hasValidSession() {
        try {
            const raw = localStorage.getItem('wizmobiz_session');
            if (!raw) return false;
            const s = JSON.parse(raw);
            if (!s.loginAt) return false;
            const age = Date.now() - new Date(s.loginAt).getTime();
            return age < TTL_MS;
        } catch (_) { return false; }
    }

    if (hasValidSession()) {
        console.log('[LiffAutoLogin] Valid session found — skip');
        return;
    }

    // User explicitly logged out — don't auto-reauth until they log in again
    if (localStorage.getItem('tuktuk_session_ended')) {
        console.log('[LiffAutoLogin] Manual logout detected — skip auto-login');
        return;
    }

    // Get LIFF ID for main app
    function getLiffId() {
        return window.TUKTUK_LIFF?.main || '';
    }

    // Load LIFF SDK dynamically
    function loadLiffSDK() {
        return new Promise((resolve, reject) => {
            if (window.liff) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // Store session from LIFF profile
    async function storeSession(profile, lineToken) {
        let token = null;
        try {
            const API_BASE = (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                ? 'https://tuktukfeed-api.imtthailand2019.workers.dev'
                : '';
            const r = await fetch(`${API_BASE}/api/auth/marketplace-line-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: lineToken,
                    lineUserId: profile.userId,
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl || ''
                })
            });
            const d = await r.json();
            if (d.success && d.token) {
                token = d.token;
            }
        } catch (e) {
            console.error('[LiffAutoLogin] Token exchange failed:', e);
        }

        const session = {
            lineUserId:  profile.userId,
            uid:         profile.userId, // Ensure uid property exists
            displayName: profile.displayName,
            pictureUrl:  profile.pictureUrl || null,
            provider:    'liff',
            loginAt:     new Date().toISOString(),
            expiresAt:   Date.now() + TTL_MS,
            liffToken:   lineToken || null,
            token:       token,
        };
        localStorage.setItem('wizmobiz_session', JSON.stringify(session));
        localStorage.setItem('tuktuk_line_session', JSON.stringify(session));
        if (token) {
            localStorage.setItem('tuktuk_jwt', token);
            localStorage.setItem('tuktuk_token', token);
        }
        sessionStorage.removeItem('_auth_redirect_in_progress');
        console.log('[LiffAutoLogin] Session stored for', profile.displayName, token ? 'with JWT' : 'without JWT');
        // Notify app that auth state changed
        window.dispatchEvent(new CustomEvent('tuktuk:autologin', { detail: session }));
    }

    // Main LIFF silent login flow
    async function tryLiffLogin() {
        const liffId = getLiffId();
        if (!liffId) {
            console.log('[LiffAutoLogin] No LIFF ID for main app — skip');
            return;
        }

        try {
            await loadLiffSDK();
            await liff.init({ liffId, withLoginOnExternalBrowser: false });

            if (!liff.isLoggedIn()) {
                // Truly silent: if not logged in, just stop. 
                // Don't redirect to /login here as it causes race conditions with other scripts.
                console.log('[LiffAutoLogin] Not logged in — silent exit');
                return;
            }

            const profile = await liff.getProfile();
            const lineToken = liff.getAccessToken();
            await storeSession(profile, lineToken);

            // Optionally sync with Firestore (fire-and-forget)
            syncWithFirestore(profile).catch(() => {});

            // If login.html stored a post-auth destination (e.g. /messages), go there now.
            const postRedirect = localStorage.getItem('tuktuk_liff_post_redirect');
            if (postRedirect) {
                localStorage.removeItem('tuktuk_liff_post_redirect');
                window.location.replace(postRedirect);
            }

        } catch (err) {
            console.log('[LiffAutoLogin] LIFF silent flow skipped:', err.message);
        }
    }

    // Background sync: upsert user in Firestore line_users collection
    async function syncWithFirestore(profile) {
        if (typeof firebase === 'undefined') return;
        try {
            const db = firebase.firestore();
            await db.collection('users').doc(profile.userId).set({
                lineUserId:   profile.userId,
                displayName:  profile.displayName,
                pictureUrl:   profile.pictureUrl || null,
                lastLoginAt:  firebase.firestore.FieldValue.serverTimestamp(),
                loginMethod:  'liff_auto',
            }, { merge: true });
        } catch (_) {}
    }

    // Run after page is ready (don't block initial render)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryLiffLogin);
    } else {
        setTimeout(tryLiffLogin, 200);
    }

})();
