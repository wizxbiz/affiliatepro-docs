/**
 * 🧭 SPA NAVIGATION INTERCEPTOR (IndexedStack Mimic)
 * Prevents reloading the home feed when switching tabs or clicking internal links
 */
document.addEventListener('DOMContentLoaded', () => {
    const bottomNavs = document.querySelectorAll('#bottomNav a.bottom-nav-item');

    // 1. Check if we are inside an iframe
    const isEmbedded = window.self !== window.top || window.location.search.includes('embedded=true');
    if (isEmbedded) {
        const bNav = document.getElementById('bottomNav');
        const pNav = document.querySelector('.pc-top-nav');
        if (bNav) bNav.style.display = 'none';
        if (pNav) pNav.style.display = 'none';
        document.body.classList.add('is-embedded');
        return;
    }

    // 2. Check if we are the SPA shell (only index.html/root is the shell)
    const path = window.location.pathname.toLowerCase();
    const isShell = path === '/' || 
                    path.endsWith('/') || 
                    path.endsWith('/index') || 
                    path.endsWith('/index.html') ||
                    path.endsWith('/tuktuk') ||
                    path.endsWith('/tuktuk/');

    if (!isShell) {
        console.log('--- 🧭 SPA ROUTER: Standalone sub-page mode, routing disabled ---');
        return;
    }

    // 2. Create the SPA Container
    let iframeContainer = document.getElementById('spaIframeContainer');
    if (!iframeContainer) {
        iframeContainer = document.createElement('div');
        iframeContainer.id = 'spaIframeContainer';
        document.body.appendChild(iframeContainer);
    }

    function updateIframeContainerLayout() {
        // Check both innerWidth and pc-mode class (added by app-init.js)
        const isDesktop = window.innerWidth >= 992 || document.body.classList.contains('pc-mode');
        const topOffset = isDesktop ? 64 : 0;
        const isOpen = iframeContainer.style.display === 'block';
        // On mobile: leave room for bottom nav (70px) + safe-area-inset-bottom.
        // Use CSS calc with env() so it works on notched/gesture-nav devices.
        // z-index 10000009: just below bottom nav (10000011) so nav stays on top.
        const heightCalc = isDesktop
            ? `calc(100vh - ${topOffset}px)`
            : `calc(100vh - ${topOffset}px - var(--nav-height, 70px) - env(safe-area-inset-bottom, 0px))`;
        iframeContainer.style.cssText = `position:fixed; top:${topOffset}px; left:0; width:100%; height:${heightCalc}; z-index:10000009; background:#0a0a0f; display:${isOpen ? 'block' : 'none'};`;
    }
    updateIframeContainerLayout();
    window.addEventListener('resize', updateIframeContainerLayout);

    const stack = {};

    function isInternalLink(href) {
        if (!href || href.startsWith('javascript') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;

        // Handle root-relative or page-relative paths
        try {
            const url = new URL(href, window.location.origin);
            return url.origin === window.location.origin;
        } catch(e) {
            return false;
        }
    }

    function syncNavUI(href) {
        // Re-query in case it was dynamically injected
        const navItems = document.querySelectorAll('#bottomNav a.bottom-nav-item');
        if (navItems.length > 0) {
            navItems.forEach(n => {
                const navHref = n.getAttribute('href');
                if (navHref && href.includes(navHref.split('?')[0])) n.classList.add('active');
                else n.classList.remove('active');
            });
        }

        // Also tell PersistentUI to sync if it's there
        if (window.PersistentUI && typeof window.PersistentUI.setActiveTab === 'function') {
            window.PersistentUI.setActiveTab();
        }
    }

    function openInSPA(href, element = null) {
        const cleanHref = href.split('#')[0].split('?')[0];

        // If it's the home page, just hide the SPA container
        if (cleanHref === 'index.html' || cleanHref === '' || cleanHref === '/') {
            iframeContainer.style.display = 'none';
            document.body.classList.remove('spaIframeOpen');
            updateIframeContainerLayout();
            document.title = "TukTuk - ดูเพลิน";
            syncNavUI('index.html');
            // Sync pcTopNav active state back to home
            document.querySelectorAll('.pc-nav-icon').forEach(el => el.classList.remove('active'));
            const homeIcon = document.querySelector('.pc-nav-icon[data-pc-nav="home"]');
            if (homeIcon) homeIcon.classList.add('active');
            // Restore TukTuk feed visibility and feed-mode-active class
            const tf = document.getElementById('tuktukFeed');
            if (tf) {
                tf.style.display = tf._spaHiddenDisplay !== undefined ? tf._spaHiddenDisplay : ''; // restore
                delete tf._spaHiddenDisplay;
                if (tf.style.display !== 'none') {
                    document.body.classList.add('feed-mode-active');
                    document.documentElement.classList.add('feed-mode-active');
                }
            }
            return;
        }

        // Leaving home → exit feed mode so the host bottom nav becomes visible
        // below the SPA iframe (iframe height = 100vh - 75px, nav needs the remaining 75px)
        document.body.classList.remove('feed-mode-active');
        document.documentElement.classList.remove('feed-mode-active');

        // Physically hide the TukTuk feed so it cannot intercept touches or render
        // above the SPA iframe (visibility:hidden keeps it in stacking context; display:none removes it entirely)
        const feedEl = document.getElementById('tuktukFeed');
        if (feedEl) { feedEl._spaHiddenDisplay = feedEl.style.display; feedEl.style.display = 'none'; }

        iframeContainer.style.display = 'block';
        document.body.classList.add('spaIframeOpen');
        updateIframeContainerLayout();
        Object.values(stack).forEach(iframe => iframe.style.display = 'none');

        // Sync pcTopNav active icon
        const pageKey = cleanHref.replace('.html', '');
        document.querySelectorAll('.pc-nav-icon').forEach(el => el.classList.remove('active'));
        const matchIcon = document.querySelector(`.pc-nav-icon[data-pc-nav="${pageKey}"]`);
        if (matchIcon) matchIcon.classList.add('active');

        // Prepare target URL with embedded param (remove .html to prevent redirect loops under Cloudflare Clean URLs)
        let targetUrl = href.replace(/\.html/i, '');
        if (!targetUrl.includes('embedded=true')) {
            const sep = targetUrl.includes('?') ? '&' : '?';
            targetUrl += sep + 'embedded=true';
        }

        if (!stack[href]) {
            const iframe = document.createElement('iframe');
            iframe.src = targetUrl;
            iframe.style.cssText = 'width:100%; height:100%; border:none;';
            iframeContainer.appendChild(iframe);
            stack[href] = iframe;
        }

        stack[href].style.display = 'block';

        // If this iframe was previously loaded (cached), ping it to re-check auth
        // in case the user has logged in since the iframe was first created.
        try { stack[href].contentWindow.postMessage({ type: 'AUTH_REFRESH' }, '*'); } catch(_) {}

        // Auto-update title based on href
        const pageName = cleanHref.split('.')[0];
        document.title = "TukTuk - " + pageName.charAt(0).toUpperCase() + pageName.slice(1);

        syncNavUI(href);

        // Global Pause for real-page videos
        document.querySelectorAll('video').forEach(v => v.pause());
    }

    // Convert file.html → clean path (e.g. marketplace.html → /marketplace)
    function toCleanUrl(href) {
        if (!href) return '/';
        const clean = href.split('#')[0].split('?')[0];
        if (clean === 'index.html' || clean === '' || clean === '/') return '/';
        // Remove .html extension for clean URL
        return '/' + clean.replace(/\.html$/i, '');
    }

    // 3. Initial Route Check
    const initialPath = window.location.pathname.toLowerCase();
    
    // Push initial home state so Back button always has somewhere to land
    if (!history.state) {
        history.replaceState({ spa: false, href: 'index.html' }, '', '/');
    }

    // Auto-load subpages if refresh on non-root (e.g. /marketPlace)
    if (initialPath !== '/' && initialPath !== '/index' && initialPath !== '/index.html') {
        // Resolve the page name (e.g. /marketplace -> marketplace.html)
        const pathSegments = initialPath.split('/');
        let pageName = pathSegments[pathSegments.length - 1] || pathSegments[pathSegments.length - 2];
        
        // Final normalization: Marketplace uppercase Case
        if (pageName.toLowerCase() === 'marketplace') pageName = 'marketplace';
        
        if (pageName && pageName !== 'index') {
            const pageUrl = pageName + '.html';
            console.log('--- 🧭 SPA INITIAL ROUTE: Loading', pageUrl);
            // Delay slightly to ensure DOM is ready
            setTimeout(() => openInSPA(pageUrl), 100);
        }
    }

    // Double-check if we need to hide the feed on load
    if (initialPath.includes('market') || initialPath.includes('chat') || initialPath.includes('profile')) {
        const feedEl = document.getElementById('tuktukFeed');
        if (feedEl) feedEl.style.display = 'none';
        document.body.classList.remove('feed-mode-active');
        document.documentElement.classList.remove('feed-mode-active');
    }

    // Single global interceptor for ALL internal links (including bottom nav)
    document.addEventListener('click', (e) => {
        if (e.defaultPrevented) return;

        const link = e.target.closest('a');
        if (!link) return;

        if (link.id === 'centerBtn') return;

        const href = link.getAttribute('href');
        if (!href) return;

        const isInternal = isInternalLink(href) || link.classList.contains('spa-link');

        if (isInternal && !link.hasAttribute('target') && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const cleanHref = href.split('#')[0].split('?')[0];
            const isHome = cleanHref === 'index.html' || cleanHref === '' || cleanHref === '/';
            openInSPA(href, link);
            history.pushState(
                { spa: !isHome, href: href },
                '',
                toCleanUrl(href)
            );
        }
    });

    // Handle Back/Forward Browser Buttons
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.spa) {
            openInSPA(event.state.href);
        } else {
            openInSPA('index.html');
        }
    });

    // Expose globally for manual calls
    window.navigateToSPA = function(href) {
        if (!href) return;
        const cleanHref = (href || '').split('#')[0].split('?')[0];
        const isHome = cleanHref === 'index.html' || cleanHref === '' || cleanHref === '/';
        openInSPA(href);
        history.pushState(
            { spa: !isHome, href: href },
            '',
            toCleanUrl(href)
        );
    };

    // Post-message listener for content inside iframes
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NAVIGATE') {
            window.navigateToSPA(event.data.href);
        }
    });
});

