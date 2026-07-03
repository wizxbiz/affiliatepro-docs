/**
 * 📰 Main Feed Engine (Social & News Feed)
 */

let _lastVisible = null;
let _loading = false;
let _noMorePosts = false;
let _feedType = 'all'; // 'all', 'near', 'trending', 'following'

async function loadPosts(isAppend = false) {
    // 🔥 PREVENT LEGACY RENDERER ON PC 🔥
    const PC_BREAKPOINT = 992;
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post') || urlParams.get('postId') || urlParams.get('id');
    const forceExplore = urlParams.get('category') === 'all' || urlParams.get('cat') === 'all';
    
    if (window.innerWidth >= PC_BREAKPOINT && !forceExplore && !targetPostId) {
        console.log('[MainFeed] Disabled on PC. Delegating to pcEngine.');
        return;
    }

    if (_loading || (_noMorePosts && isAppend)) return;
    _loading = true;

    const container = document.getElementById('postsContainer');
    if (!container) return;

    if (!isAppend) {
        _lastVisible = null;
        _noMorePosts = false;
        container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">กำลังโหลดฟีดของคุณ...</p></div>';
    } else {
        const loader = document.createElement('div');
        loader.id = 'feed-append-loader';
        loader.className = 'text-center py-4';
        loader.innerHTML = '<div class="spinner-border spinner-border-sm text-primary"></div>';
        container.appendChild(loader);
    }

    try {
        let query = db.collection('community_posts')
            .where('published', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(10);

        // Apply filters (simplified example)
        if (_feedType === 'trending') {
            query = db.collection('community_posts')
                .where('published', '==', true)
                .orderBy('likes', 'desc')
                .limit(10);
        }

        if (isAppend && _lastVisible) {
            query = query.startAfter(_lastVisible);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
            _noMorePosts = true;
            if (!isAppend) {
                container.innerHTML = '<div class="text-center py-5"><i class="fas fa-rss mb-3" style="font-size:3rem; opacity:0.1;"></i><p class="text-muted">ยังไม่มีโพสต์ในขณะนี้</p></div>';
            } else {
                const loader = document.getElementById('feed-append-loader');
                if (loader) loader.innerHTML = '<p class="text-muted small">หมดแล้วจ้า ✨</p>';
            }
            _loading = false;
            return;
        }

        _lastVisible = snapshot.docs[snapshot.docs.length - 1];

        if (!isAppend) container.innerHTML = '';
        else {
            const loader = document.getElementById('feed-append-loader');
            if (loader) loader.remove();
        }

        snapshot.docs.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            // renderPostCard returns an HTML string — use insertAdjacentHTML
            const html = UIHelpers.renderPostCard(post);
            container.insertAdjacentHTML('beforeend', html);
        });

        // Interleave some products or news
        if (typeof InterleavedEngine !== 'undefined') {
            InterleavedEngine.injectInterleavedContent(container);
        }

    } catch (error) {
        console.error('Error loading posts:', error);
        if (!isAppend) container.innerHTML = '<div class="alert alert-danger mx-3 mt-3">โหลดข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้ง</div>';
    } finally {
        _loading = false;
    }
}

function handlePostLike(postId, element) {
    if (!currentUserId) {
        showToast('⚠️ กรุณาเข้าสู่ระบบก่อน', 'warning');
        return;
    }

    const icon = element.querySelector('i');
    const countEl = element.querySelector('.count');
    const isLiked = icon.classList.contains('fas');

    icon.classList.toggle('fas');
    icon.classList.toggle('far');
    element.classList.toggle('liked');

    const increment = isLiked ? -1 : 1;
    const currentCount = parseInt(countEl.innerText) || 0;
    countEl.innerText = Math.max(0, currentCount + increment);

    db.collection('community_posts').doc(postId).update({
        likes: firebase.firestore.FieldValue.increment(increment)
    });
}

function initPullToRefresh() {
    // Delegate to app-init.js canonical implementation (guards against double-init)
    if (window._ptrInitialized) return;
    if (typeof window.initPullToRefresh === 'function' && window.initPullToRefresh !== initPullToRefresh) {
        window.initPullToRefresh();
    }
}

function setupInfiniteScroll() {
    // body has overflow:hidden — use IntersectionObserver on a sentinel element
    // instead of window scroll which never fires in this layout.
    const container = document.getElementById('postsContainer');
    if (!container) return;

    const sentinel = document.createElement('div');
    sentinel.id = 'feed-scroll-sentinel';
    sentinel.style.height = '1px';
    container.appendChild(sentinel);

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadPosts(true);
    }, { threshold: 0.1 });

    observer.observe(sentinel);
}
