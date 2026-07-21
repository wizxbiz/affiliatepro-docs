console.log('📊 analytics.js script loaded');

(function () {
    'use strict';

    // =====================================================
    // 📌 CONFIGURATION
    // =====================================================

    const CONFIG = {
        // Google Analytics 4 Measurement ID (เปลี่ยนเป็น ID ของคุณ)
        GA4_ID: 'G-PK2GQ4HERC',

        // Cloudflare Worker endpoints (same-origin → ไม่มี CORS)
        TRACKING_URLS: {
            pageView: '/api/analytics/trackPageView',
            event: '/api/analytics/trackEvent',
            stats: '/api/analytics/getStats'
        },

        // Enable/Disable tracking
        enableGA4: true,
        enableCustom: true,

        // Debug mode
        debug: true
    };

    // =====================================================
    // 🔧 UTILITY FUNCTIONS
    // =====================================================

    function log(...args) {
        if (CONFIG.debug) {
            console.log('[Tuktuk Analytics]', ...args);
        }
    }

    function getSessionId() {
        let sessionId = sessionStorage.getItem('tuktuk_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('tuktuk_session_id', sessionId);
        }
        return sessionId;
    }

    function getVisitorId() {
        let visitorId = localStorage.getItem('tuktuk_visitor_id');
        if (!visitorId) {
            visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('tuktuk_visitor_id', visitorId);
        }
        return visitorId;
    }

    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    function getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('Opera')) return 'Opera';
        return 'Other';
    }

    // =====================================================
    // 📈 GOOGLE ANALYTICS 4
    // =====================================================

    function initGA4() {
        if (!CONFIG.enableGA4 || CONFIG.GA4_ID === '' || CONFIG.GA4_ID.includes('XXX')) {
            log('GA4 disabled or not configured');
            return;
        }

        // Load gtag.js
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`;
        document.head.appendChild(script);

        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', CONFIG.GA4_ID, {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });

        log('GA4 initialized with ID:', CONFIG.GA4_ID);
    }

    // =====================================================
    // 🔥 CUSTOM FIRESTORE TRACKING
    // =====================================================

    function trackPageView() {
        if (!CONFIG.enableCustom) {
            log('Custom tracking disabled');
            return;
        }

        const data = {
            // Page info
            page: window.location.pathname,
            pageTitle: document.title,
            pageUrl: window.location.href,
            referrer: document.referrer || 'direct',

            // Visitor info
            visitorId: getVisitorId(),
            sessionId: getSessionId(),

            // Device info
            deviceType: getDeviceType(),
            browser: getBrowser(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,

            // Time info
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // UTM parameters
            utmSource: new URLSearchParams(window.location.search).get('utm_source'),
            utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
            utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
        };

        log('Tracking page view:', data);

        // Send to Firebase Function
        fetch(CONFIG.TRACKING_URLS.pageView, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            keepalive: true
        }).then(response => {
            if (response.ok) {
                log('Page view tracked successfully');
            }
        }).catch(error => {
            log('Error tracking page view:', error);
        });
    }

    // =====================================================
    // 🎯 EVENT TRACKING
    // =====================================================

    window.tuktukTrackEvent = function (eventName, eventData = {}) {
        // GA4 Event
        if (CONFIG.enableGA4 && window.gtag && CONFIG.GA4_ID !== '' && !CONFIG.GA4_ID.includes('XXX')) {
            gtag('event', eventName, eventData);
        }

        // Custom Event
        if (CONFIG.enableCustom) {
            const data = {
                eventName: eventName,
                eventData: eventData,
                page: window.location.pathname,
                visitorId: getVisitorId(),
                sessionId: getSessionId(),
                timestamp: new Date().toISOString()
            };

            fetch(CONFIG.TRACKING_URLS.event, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(error => log('Error tracking event:', error));
        }

        log('Event tracked:', eventName, eventData);
    };
    // Backward compatibility
    window.witTrackEvent = window.tuktukTrackEvent;

    // =====================================================
    // 🚀 INITIALIZE
    // =====================================================

    function init() {
        log('Initializing Tuktuk Analytics...');

        // Initialize GA4
        initGA4();

        // Track page view
        trackPageView();

        // Track page visibility changes
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
                log('Page became visible');
            }
        });

        // Track time on page (when leaving)
        const startTime = Date.now();
        window.addEventListener('beforeunload', function () {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            if (timeOnPage > 1) {
                tuktukTrackEvent('time_on_page', { seconds: timeOnPage, page: window.location.pathname });
            }
        });

        // =====================================================
        // 📊 VISITOR STATS FETCHING (Global)
        // =====================================================

        let _statsStop = false; // หยุด poll ถ้าไม่มีสิทธิ์ (ไม่ใช่ admin)
        window.tuktukFetchVisitorStats = async function () {
            if (_statsStop) return;
            try {
                log('Fetching visitor stats...');
                const token = localStorage.getItem('tuktuk_jwt');
                if (!token) { _statsStop = true; return; } // ไม่ล็อกอิน → ไม่ต้องยิง (stats เป็น admin-only)
                const response = await fetch(`${CONFIG.TRACKING_URLS.stats}?days=1`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.status === 401 || response.status === 403) {
                    _statsStop = true; // ไม่ใช่ admin → เลิก poll ถาวร
                    if (_statsTimer) clearInterval(_statsTimer);
                    return;
                }
                const result = await response.json();

                if (result.success && result.data && result.data.summary) {
                    const summary = result.data.summary;
                    const uniqueVisitors = summary.uniqueVisitors || 0;
                    const totalVisitors = summary.allTimeUniqueVisitors || summary.allTimePageViews || 0;
                    const onlineNow = summary.onlineNow || 0;

                    log('Updating visitor stats:', { uniqueVisitors, totalVisitors, onlineNow });

                    // Update with animation if elements exist
                    window.tuktukAnimateStatsNumber('stats-online', onlineNow);
                    window.tuktukAnimateStatsNumber('stats-visitor', uniqueVisitors);
                    window.tuktukAnimateStatsNumber('stats-total-visitors', totalVisitors, true);
                }
            } catch (error) {
                log('Could not fetch visitor stats:', error);
            }
        };

        window.tuktukAnimateStatsNumber = function (elementId, target, isPlus = false) {
            const element = document.getElementById(elementId);
            if (!element) return;

            const startText = element.textContent.replace(/[^\d]/g, '');
            const start = parseInt(startText) || 0;
            const duration = 2000;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const easeOutQuad = t => t * (2 - t);
                const current = Math.floor(start + (target - start) * easeOutQuad(progress));

                element.textContent = current.toLocaleString() + (isPlus ? '+' : '');

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    element.textContent = target.toLocaleString() + (isPlus ? '+' : '');
                }
            }

            requestAnimationFrame(update);
        };

        // Initialize stats if banner or mini-stats exists
        let _statsTimer = null;
        if (document.querySelector('.stats-banner') || document.querySelector('.mini-stats')) {
            setTimeout(window.tuktukFetchVisitorStats, 1000);
            _statsTimer = setInterval(window.tuktukFetchVisitorStats, 120000); // 2 mins
        }

        log('Tuktuk Analytics initialized');
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
