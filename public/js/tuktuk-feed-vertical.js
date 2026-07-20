/**
 * TukTuk Vertical Feed Controller
 * TikTok-style vertical scrolling feed for mobile PWA
 */

const TukTukFeed = (function () {
  'use strict';

  // ===== Private Variables =====
  let feedContainer = null;
  let currentItems = [];
  let isMuted = localStorage.getItem('tuktuk_muted') !== 'false';
  let autoScrollEnabled = localStorage.getItem('tuktuk_autoscroll') !== 'false';
  let isDragging = false;
  let startY = 0;
  let currentScrollTop = 0;
  let lastVideoTime = 0;
  let videoPlayers = {};
  let viewTrackedItems = new Set();
  let productTimers = {};
  let sidebarHideTimers = {};
  let scrollTimeout = null;
  let isLoadingMore = false;
  let lastVisibleDoc = null;
  let pullToRefreshElement = null;
  let touchStartY = 0;
  let touchEndY = 0;
  let isPulling = false;
  let autoScrollTimer = null;

  // Observer for video autoplay
  let intersectionObserver = null;

  // ===== Constants =====
  const PAGE_SIZE = 10;
  const PRODUCT_DELAY = 15000; // 15 seconds
  const AUTO_SCROLL_DELAY = 20000; // 20 seconds for product cards
  const VIEW_TRACK_THRESHOLD = 3000; // 3 seconds view counts as view

  // ===== Initialize Feed =====
  function init(containerId = 'tuktukFeed') {
    feedContainer = document.getElementById(containerId);
    if (!feedContainer) {
      console.error('Feed container not found');
      return;
    }

    // Add vertical feed class
    feedContainer.classList.add('tuktuk-feed-vertical');

    // Setup observers
    setupIntersectionObserver();

    // Setup event listeners
    setupEventListeners();

    // Create pull-to-refresh element
    createPullToRefresh();

    // Initial load
    loadFeedItems();

    console.log('✅ TukTuk Vertical Feed initialized');
  }

  // ===== Setup Intersection Observer =====
  function setupIntersectionObserver() {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const item = entry.target;
        const postId = item.dataset.postId;

        if (entry.isIntersecting) {
          // Item became visible
          onItemVisible(item, postId);
        } else {
          // Item hidden
          onItemHidden(item, postId);
        }
      });
    }, {
      threshold: 0.4, // Lower threshold for earlier start (matching Engine Config)
      rootMargin: '100px 0px' // Observe slightly outside viewport for earlier pre-playback
    });
  }

  // ===== Handle Item Visible =====
  function onItemVisible(item, postId) {
    // Start video playback
    playVideo(postId);

    // Track view after threshold
    setTimeout(() => {
      if (isItemVisible(item)) {
        trackView(postId);
      }
    }, VIEW_TRACK_THRESHOLD);

    // Start product card timer
    startProductTimer(postId);

    // Preload next items
    preloadAdjacentItems(item);

    // Add active class
    item.classList.add('active');

    // Start sidebar hide timer (8 seconds)
    startSidebarTimer(postId);

    // Auto-scroll for non-video items
    setupAutoScrollTimer(item, postId);
  }

  // ===== Handle Item Hidden =====
  function onItemHidden(item, postId) {
    // Pause video
    pauseVideo(postId);

    // Clear product timer
    clearProductTimer(postId);

    // Clear and reset sidebar
    clearSidebarTimer(postId);
    const sidebar = item.querySelector('.right-sidebar');
    if (sidebar) sidebar.classList.remove('actions-hidden');

    // Remove active class
    item.classList.remove('active');
  }

  // ===== Check if Item is Visible =====
  function isItemVisible(item) {
    const rect = item.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const threshold = windowHeight * 0.5; // 50% of viewport

    return rect.top < windowHeight - threshold && rect.bottom > threshold;
  }

  // ===== Play Video =====
  function playVideo(postId) {
    const item = document.querySelector(`[data-post-id="${postId}"]`);
    if (!item) return;

    const video = item.querySelector('video');
    const ytPlayer = videoPlayers[postId];

    if (video) {
      video.muted = isMuted;
      video.play().catch(e => {
        if (e.name === 'NotAllowedError' || video.muted) {
          showUnmuteGuide(postId);
        }
      });
    } else if (ytPlayer && ytPlayer.playVideo) {
      if (isMuted) ytPlayer.mute();
      else ytPlayer.unMute();
      ytPlayer.playVideo();
    }
  }

  // ===== Pause Video =====
  function pauseVideo(postId) {
    const item = document.querySelector(`[data-post-id="${postId}"]`);
    if (!item) return;

    const video = item.querySelector('video');
    const ytPlayer = videoPlayers[postId];

    if (video) {
      video.pause();
    } else if (ytPlayer && ytPlayer.pauseVideo) {
      ytPlayer.pauseVideo();
    }
  }

  // ===== Track View =====
  function trackView(postId) {
    if (viewTrackedItems.has(postId)) return;

    viewTrackedItems.add(postId);

    // Update UI counter
    const counter = document.querySelector(`.view-count-${postId}`);
    if (counter) {
      const current = parseInt(counter.textContent.replace(/,/g, '')) || 0;
      counter.textContent = (current + 1).toLocaleString();
    }

    // Track in database (if logged in)
    if (window.db && window.currentUserId) {
      try {
        window.db.collection('posts').doc(postId).update({
          views: firebase.firestore.FieldValue.increment(1)
        }).catch(() => { });
      } catch (e) { }
    }
  }

  // ===== Start Product Timer =====
  function startProductTimer(postId) {
    clearProductTimer(postId);

    const item = document.querySelector(`[data-post-id="${postId}"]`);
    if (!item) return;

    const productCard = item.querySelector('.feed-product-card');
    if (!productCard) return;

    productTimers[postId] = setTimeout(() => {
      productCard.classList.add('show');
    }, PRODUCT_DELAY);
  }

  // ===== Clear Product Timer =====
  function clearProductTimer(postId) {
    if (productTimers[postId]) {
      clearTimeout(productTimers[postId]);
      delete productTimers[postId];
    }
  }

  // ===== Start Sidebar Timer (Hide after 8s) =====
  function startSidebarTimer(postId) {
    clearSidebarTimer(postId);

    const item = document.querySelector(`[data-post-id="${postId}"]`);
    if (!item) return;

    const sidebar = item.querySelector('.right-sidebar');
    if (!sidebar) return;

    sidebarHideTimers[postId] = setTimeout(() => {
      sidebar.classList.add('actions-hidden');
    }, 8000); // 8 seconds as requested
  }

  // ===== Clear Sidebar Timer =====
  function clearSidebarTimer(postId) {
    if (sidebarHideTimers[postId]) {
      clearTimeout(sidebarHideTimers[postId]);
      delete sidebarHideTimers[postId];
    }
  }

  // ===== Preload Adjacent Items =====
  function preloadAdjacentItems(currentItem) {
    // Preload more items ahead (Next 3 items)
    let next = currentItem;
    for (let i = 0; i < 3; i++) {
      next = next ? next.nextElementSibling : null;
      if (next) preloadItem(next);
    }

    // Preload previous 1 item
    const prev = currentItem.previousElementSibling;
    if (prev) preloadItem(prev);
  }

  function preloadItem(item) {
    if (!item || !item.classList.contains('tuktuk-feed-item')) return;

    const video = item.querySelector('video');
    const ytPlaceholder = item.querySelector('.yt-placeholder');

    if (video && video.dataset.src) {
      if (window.TukTukEngine?.metrics) TukTukEngine.metrics.preloads = (TukTukEngine.metrics.preloads || 0) + 1;

      video.preload = "auto"; // Critical for preloading
      video.src = video.dataset.src;
      video.load();
      delete video.dataset.src;

      // Hardware acceleration hint
      video.style.willChange = 'transform';
    }

    if (ytPlaceholder && !videoPlayers[item.dataset.postId]) {
      const postId = item.dataset.postId;
      initYouTubePlayer(postId, ytPlaceholder);
    }
  }

  // ===== Setup Event Listeners =====
  function setupEventListeners() {
    // Scroll end detection for loading more
    feedContainer.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isNearBottom()) {
          loadMoreItems();
        }
      }, 200);
    });

    // Touch events for double-tap like
    feedContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    feedContainer.addEventListener('touchend', handleTouchEnd);

    // Volume change listener
    window.addEventListener('tuktukVolumeChange', (e) => {
      isMuted = e.detail.muted;
      syncAllVolumes();
    });

    // Auto-scroll change listener
    window.addEventListener('tuktukAutoScrollChange', (e) => {
      autoScrollEnabled = e.detail.enabled;
      if (autoScrollEnabled) {
        // Find current active item and setup timer
        const activeItem = feedContainer.querySelector('.tuktuk-feed-item.active');
        if (activeItem) {
          setupAutoScrollTimer(activeItem, activeItem.dataset.postId);
        }
      } else {
        clearAutoScrollTimer();
      }
    });
  }

  // ===== Handle Touch Start =====
  function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
    touchEndY = touchStartY;

    // Check for pull-to-refresh at top
    if (feedContainer.scrollTop === 0) {
      isPulling = true;
    }
  }

  // ===== Handle Touch End =====
  function handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    touchEndY = touch.clientY;

    // Check for double-tap like
    const now = Date.now();
    if (now - lastVideoTime < 300) {
      handleDoubleTap(e);
    }
    lastVideoTime = now;

    // Check for pull-to-refresh
    if (isPulling && touchEndY - touchStartY > 120) {
      refreshFeed();
    }
    isPulling = false;

    // Toggle sidebar if hidden
    const item = touch.target.closest('.tuktuk-feed-item');
    if (item && now - lastVideoTime >= 300) { // Only if not a double tap
      // Single tap: toggle play/pause or sidebar
      const sidebar = item.querySelector('.right-sidebar');
      if (sidebar && sidebar.classList.contains('actions-hidden')) {
        sidebar.classList.remove('actions-hidden');
        startSidebarTimer(item.dataset.postId);
      } else {
        // Toggle video play/pause on tap
        togglePlayPause(item.dataset.postId);
      }
    }
  }

  // ===== Handle Double Tap =====
  function handleDoubleTap(e) {
    const item = e.target.closest('.tuktuk-feed-item');
    if (!item) return;

    const postId = item.dataset.postId;
    const rect = item.getBoundingClientRect();
    const x = e.changedTouches[0].clientX - rect.left;
    const y = e.changedTouches[0].clientY - rect.top;

    showHeartAnimation(item, x, y);
    likePost(postId);
  }

  // ===== Show Heart Animation =====
  function showHeartAnimation(container, x, y) {
    const heart = document.createElement('i');
    heart.className = 'fas fa-heart heart-pop-animation';
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    container.appendChild(heart);

    setTimeout(() => heart.remove(), 800);
  }

  // ===== Like Post =====
  async function likePost(postId) {
    const btn = document.querySelector(`.like-btn-${postId}`);
    if (btn) {
      btn.classList.add('liked');
      const count = btn.querySelector('span');
      if (count) {
        const current = parseInt(count.textContent.replace(/,/g, '')) || 0;
        count.textContent = (current + 1).toLocaleString();
      }
    }

    // Update database
    if (window.db) {
      try {
        await window.db.collection('posts').doc(postId).update({
          likes: firebase.firestore.FieldValue.increment(1)
        });
      } catch (e) { }
    }
  }

  // ===== Check if Near Bottom =====
  function isNearBottom() {
    const threshold = 200;
    const scrollTop = feedContainer.scrollTop;
    const scrollHeight = feedContainer.scrollHeight;
    const clientHeight = feedContainer.clientHeight;

    return scrollHeight - scrollTop - clientHeight < threshold;
  }

  // ===== Load More Items =====
  async function loadMoreItems() {
    if (isLoadingMore || !lastVisibleDoc) return;

    isLoadingMore = true;

    try {
      const snapshot = await window.db.collection('posts')
        .where('published', '==', true)
        .orderBy('createdAt', 'desc')
        .startAfter(lastVisibleDoc)
        .limit(PAGE_SIZE)
        .get();

      if (snapshot.empty) {
        isLoadingMore = false;
        return;
      }

      lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

      const newPosts = [];
      snapshot.forEach(doc => {
        newPosts.push({ id: doc.id, ...doc.data() });
      });

      renderItems(newPosts, true);

    } catch (e) {
      console.error('Error loading more items:', e);
    } finally {
      isLoadingMore = false;
    }
  }

  // ===== Setup Auto-scroll Timer =====
  function setupAutoScrollTimer(item, postId) {
    clearAutoScrollTimer();

    if (!autoScrollEnabled) return;

    const mediaType = getMediaType({
      youtubeUrl: item.querySelector('#yt-player-' + postId),
      videoUrl: item.querySelector('video')
    });

    // For images or product cards, scroll after delay
    if (mediaType === 'image' || mediaType === 'placeholder' || item.querySelector('.feed-product-card')) {
      const delay = item.querySelector('.feed-product-card') ? AUTO_SCROLL_DELAY : 10000;
      autoScrollTimer = setTimeout(() => {
        if (isItemVisible(item)) {
          scrollToNext(postId);
        }
      }, delay);
    }
  }

  function clearAutoScrollTimer() {
    if (autoScrollTimer) {
      clearTimeout(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  function scrollToNext(currentId) {
    if (!autoScrollEnabled) return;
    const current = document.querySelector(`[data-post-id="${currentId}"]`);
    if (!current) return;

    const next = current.nextElementSibling;
    if (next && next.classList.contains('tuktuk-feed-item')) {
      next.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function togglePlayPause(postId) {
    const item = document.querySelector(`[data-post-id="${postId}"]`);
    if (!item) return;

    const video = item.querySelector('video');
    if (video) {
      if (video.paused) {
        video.muted = false; // Unmute on manual play
        isMuted = false;
        syncAllVolumes();
        video.play();
      } else {
        video.pause();
      }
      return;
    }

    const ytPlayer = videoPlayers[postId];
    if (ytPlayer && ytPlayer.getPlayerState) {
      const state = ytPlayer.getPlayerState();
      if (state === 1) ytPlayer.pauseVideo();
      else ytPlayer.playVideo();
    }
  }

  // Define global handlers inside module to access state
  window.onVideoEnded = function (postId) {
    if (autoScrollEnabled) {
      scrollToNext(postId);
    }
  };

  window.updateVideoProgress = function (video, postId) {
    if (!video.duration) return;
    const progress = (video.currentTime / video.duration) * 100;
    const bar = document.getElementById(`progress-${postId}`);
    if (bar) bar.style.width = progress + '%';

    const timeEl = document.getElementById(`time-${postId}`);
    if (timeEl) {
      const current = formatTime(video.currentTime);
      const duration = formatTime(video.duration);
      timeEl.textContent = `${current} / ${duration}`;
    }
  };

  window.onVideoError = function (postId) {
    const errorEl = document.getElementById(`error-${postId}`);
    if (errorEl) errorEl.classList.add('show');
  };

  window.retryVideo = function (postId) {
    const errorEl = document.getElementById(`error-${postId}`);
    if (errorEl) errorEl.classList.remove('show');

    const video = document.querySelector(`[data-post-id="${postId}"] video`);
    if (video) {
      video.load();
      video.play().catch(() => { });
    }
  };

  window.seekVideo = function (event, postId) {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;

    const video = document.querySelector(`[data-post-id="${postId}"] video`);
    if (video && video.duration) {
      video.currentTime = pos * video.duration;
    }
  };

  // ===== Render Feed Items =====
  function renderItems(posts, append = false) {
    posts.forEach(post => {
      const item = createFeedItem(post);
      feedContainer.appendChild(item);
      intersectionObserver.observe(item);
    });

    // Trigger AOS refresh if available
    if (window.AOS) {
      setTimeout(() => AOS.refresh(), 100);
    }
  }

  // ===== Create Feed Item =====
  function createFeedItem(post) {
    const item = document.createElement('div');
    item.className = 'tuktuk-feed-item';
    item.dataset.postId = post.id;

    const mediaType = getMediaType(post);
    let mediaHtml = '';

    switch (mediaType) {
      case 'youtube':
        mediaHtml = createYouTubeHtml(post);
        break;
      case 'video':
        mediaHtml = createVideoHtml(post);
        break;
      case 'image':
        mediaHtml = createImageHtml(post);
        break;
      default:
        mediaHtml = createPlaceholderHtml(post);
    }

    item.innerHTML = `
      <div class="feed-media-container">
        ${mediaHtml}
      </div>
      
      <div class="feed-content-overlay">
        <div class="feed-author" onclick="window.location.href='channel.html?userId=${post.authorId}'">
          <img src="${post.authorAvatar || 'assets/images/logo.png'}" class="feed-author-avatar">
          <span class="feed-author-name">${escapeHtml(post.authorName || 'ผู้ใช้')}</span>
          ${post.authorVerified ? '<span class="feed-author-badge"><i class="fas fa-check"></i></span>' : ''}
        </div>
        
        <div class="feed-caption">
          <strong>${escapeHtml(post.title || '')}</strong>
          <div>${escapeHtml(post.content || '').substring(0, 100)}</div>
        </div>
        
        ${post.music ? `
          <div class="feed-music">
            <i class="fas fa-compact-disc"></i>
            <span>${escapeHtml(post.music)}</span>
          </div>
        ` : ''}
        
        ${post.location ? `
          <div class="feed-location">
            <i class="fas fa-map-marker-alt"></i>
            <span>${escapeHtml(post.location)}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="right-sidebar">
        <div class="avatar-wrapper">
          <img src="${post.authorAvatar || 'assets/images/logo.png'}" 
               class="avatar-img"
               onclick="window.location.href='channel.html?userId=${post.authorId}'">
          <div class="follow-plus-badge" onclick="followUser('${post.authorId}')">
            <i class="fas fa-plus"></i>
          </div>
        </div>
        
        <div class="action-btn like-btn-${post.id}" onclick="likePost('${post.id}')">
          <div class="action-icon-wrapper">
             <i class="fas fa-heart action-icon"></i>
          </div>
          <span class="action-text">${(post.likes || 0).toLocaleString()}</span>
        </div>
        
        <div class="action-btn" onclick="openComments('${post.id}')">
          <div class="action-icon-wrapper">
            <i class="fas fa-comment-dots action-icon"></i>
          </div>
          <span class="action-text">${(post.commentsCount || 0).toLocaleString()}</span>
        </div>
        
        <div class="action-btn" onclick="sharePost('${post.id}')">
          <div class="action-icon-wrapper">
            <i class="fas fa-share action-icon"></i>
          </div>
          <span class="action-text">แชร์</span>
        </div>

        <div class="action-btn" onclick="openOptions('${post.id}')">
          <div class="action-icon-wrapper">
            <i class="fas fa-ellipsis-h action-icon"></i>
          </div>
          <span class="action-text">เพิ่มเติม</span>
        </div>
      </div>
      
      ${post.linkedProductId ? createProductHtml(post) : ''}
      
      <div class="feed-progress-container" onclick="seekVideo(event, '${post.id}')">
        <div class="feed-progress-bar" id="progress-${post.id}">
          <div class="feed-progress-thumb"></div>
        </div>
      </div>
      
      <div class="feed-time-indicator" id="time-${post.id}">0:00 / 0:00</div>
      
      <div class="feed-unmute-guide" id="unmute-${post.id}">
        <i class="fas fa-volume-up"></i>
        แตะเพื่อเปิดเสียง
      </div>
      
      <div class="feed-product-countdown"></div>
    `;

    return item;
  }

  // ===== Helper: Get Media Type =====
  function getMediaType(post) {
    if (post.youtubeUrl || (post.videoEmbed && post.videoEmbed.includes('youtube'))) {
      return 'youtube';
    }
    if (post.videoUrl || (post.images && post.images.some(img => img.type === 'video'))) {
      return 'video';
    }
    if (post.images && post.images.length > 0) {
      return 'image';
    }
    return 'placeholder';
  }

  // ===== Helper: Create YouTube HTML =====
  function createYouTubeHtml(post) {
    const videoId = extractYouTubeId(post.youtubeUrl || post.videoEmbed);
    return `
      <div id="yt-player-${post.id}" class="yt-placeholder" data-video-id="${videoId}"></div>
      <div class="feed-loading-placeholder">
        <div class="spinner-border text-light"></div>
      </div>
      <div class="feed-error-overlay" id="error-${post.id}">
        <img src="assets/images/tuknet.png" class="feed-error-img">
        <div class="feed-error-title">เน็ตช้าเหมือนตุ๊กตุ๊กไม่มีน้ำมัน</div>
        <button class="feed-retry-btn" onclick="retryVideo('${post.id}')">
          <i class="fas fa-redo-alt"></i> ลองใหม่
        </button>
      </div>
    `;
  }

  // ===== Helper: Create Video HTML =====
  function createVideoHtml(post) {
    const videoUrl = post.videoUrl || (post.images?.find(img => img.type === 'video')?.url || '');
    let poster = post.displayImage || post.images?.[0]?.url || 'assets/images/logo.png';
    const isDirectVideoUrl = (url) => /\.(mp4|webm|mov|m4v|m3u8|avi|mkv)(\?|$)/i.test(url || '') || /youtube\.com|youtu\.be/i.test(url || '');
    if (poster && isDirectVideoUrl(poster)) {
      poster = 'assets/images/logo.png';
    }

    return `
      <video class="tuktuk-video-player" 
             preload="auto" 
             playsinline 
             webkit-playsinline
             data-src="${videoUrl}"
             ${isMuted ? 'muted' : ''}
             poster="${poster}"
             ontimeupdate="updateVideoProgress(this, '${post.id}')"
             onended="onVideoEnded('${post.id}')"
             onerror="onVideoError('${post.id}')"
             style="will-change: transform; backface-visibility: hidden;">
      </video>
      <div class="feed-loading-placeholder">
        <div class="spinner-border text-light"></div>
      </div>
      <div class="feed-error-overlay" id="error-${post.id}">
        <img src="assets/images/tuknet.png" class="feed-error-img">
        <div class="feed-error-title">เน็ตช้าเหมือนตุ๊กตุ๊กไม่มีน้ำมัน</div>
        <button class="feed-retry-btn" onclick="retryVideo('${post.id}')">
          <i class="fas fa-redo-alt"></i> ลองใหม่
        </button>
      </div>
    `;
  }

  // ===== Helper: Create Image HTML =====
  function createImageHtml(post) {
    const imageUrl = post.images[0]?.url || post.imageUrl;
    return `<img src="${imageUrl}" class="feed-image" loading="lazy">`;
  }

  // ===== Helper: Create Placeholder HTML =====
  function createPlaceholderHtml(post) {
    return `
      <div class="d-flex align-items-center justify-content-center h-100 bg-dark">
        <i class="fas fa-file-alt text-white-50" style="font-size: 3rem;"></i>
      </div>
    `;
  }

  // ===== Helper: Create Product HTML =====
  function createProductHtml(post) {
    return `
      <div class="feed-product-card" onclick="window.location.href='product.html?id=${post.linkedProductId}'">
        <img src="${post.productThumb || 'assets/images/logo.png'}" class="feed-product-img">
        <div class="feed-product-info">
          <div class="feed-product-name">${escapeHtml(post.productName || 'สินค้า')}</div>
          <div class="feed-product-price">฿${(post.productPrice || 0).toLocaleString()}</div>
        </div>
      </div>
    `;
  }

  // ===== Show Unmute Guide =====
  function showUnmuteGuide(postId) {
    const guide = document.getElementById(`unmute-${postId}`);
    if (guide) {
      guide.classList.add('show');
      setTimeout(() => guide.classList.remove('show'), 3000);
    }
  }

  // ===== Create Pull to Refresh =====
  function createPullToRefresh() {
    pullToRefreshElement = document.createElement('div');
    pullToRefreshElement.className = 'feed-ptr';
    pullToRefreshElement.innerHTML = '<div class="spinner-border text-primary"></div>';
    document.body.appendChild(pullToRefreshElement);
  }

  // ===== Refresh Feed =====
  async function refreshFeed() {
    pullToRefreshElement.classList.add('visible');
    await loadFeedItems(true);
    pullToRefreshElement.classList.remove('visible');
  }

  // ===== Show Empty State =====
  function showEmptyState() {
    feedContainer.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center h-100 text-white-50">
        <i class="fas fa-inbox" style="font-size: 4rem; margin-bottom: 20px;"></i>
        <h5>ยังไม่มีโพสต์</h5>
        <p class="text-center">เป็นคนแรกที่โพสต์วิดีโอ</p>
        <button class="btn btn-primary mt-3" onclick="openPostModal()">สร้างโพสต์</button>
      </div>
    `;
  }

  // ===== Show Error State =====
  function showErrorState() {
    feedContainer.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center h-100 text-white-50">
        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 20px;"></i>
        <h5>เกิดข้อผิดพลาด</h5>
        <p>ไม่สามารถโหลดฟีดได้</p>
        <button class="btn btn-primary mt-3" onclick="loadFeedItems(true)">ลองอีกครั้ง</button>
      </div>
    `;
  }

  // ===== Sync All Volumes =====
  function syncAllVolumes() {
    document.querySelectorAll('video').forEach(video => {
      video.muted = isMuted;
    });

    Object.values(videoPlayers).forEach(player => {
      if (player && player.mute && player.unMute) {
        if (isMuted) player.mute();
        else player.unMute();
      }
    });
  }

  // ===== Toggle Mute =====
  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('tuktuk_muted', isMuted);

    window.dispatchEvent(new CustomEvent('tuktukVolumeChange', {
      detail: { muted: isMuted }
    }));

    return isMuted;
  }

  // ===== Toggle Auto Scroll =====
  function toggleAutoScroll() {
    autoScrollEnabled = !autoScrollEnabled;
    localStorage.setItem('tuktuk_autoscroll', autoScrollEnabled);

    const icon = document.getElementById('mhPillMuteIcon');
    if (icon) {
      icon.style.color = autoScrollEnabled ? '#00F2EA' : 'rgba(255,255,255,0.35)';
    }

    return autoScrollEnabled;
  }

  // ===== Public API =====
  return {
    init,
    toggleMute,
    toggleAutoScroll,
    refresh: refreshFeed,
    loadMore: loadMoreItems,
    likePost,
    trackView,
    playVideo,
    pauseVideo,
    syncVolumes: syncAllVolumes
  };
})();

// ===== Global Functions =====
window.likePost = function (postId) {
  TukTukFeed.likePost(postId);
};

window.openComments = window.openComments || function (postId) {
  if (!window.commentModal && document.getElementById('commentModal')) {
    window.commentModal = new bootstrap.Modal(document.getElementById('commentModal'));
  }

  if (window.commentModal) {
    window.commentModal.show();
    if (typeof loadComments === 'function') {
      loadComments(postId);
    } else {
      console.warn('loadComments not found');
    }
  } else {
    console.error('commentModal not found');
  }
};

window.sharePost = function (postId) {
  const url = `${window.location.origin}/post.html?id=${postId}`;
  if (navigator.share) {
    navigator.share({
      title: 'แชร์โพสต์จาก TukTuk',
      url: url
    }).catch(() => { });
  } else {
    navigator.clipboard.writeText(url);
    alert('คัดลอกลิงก์แล้ว');
  }
};

window.followUser = function (userId) {
  // Follow logic
  console.log('Follow user:', userId);
  if (window.PWA?.haptic) window.PWA.haptic(10);
};

// Using global openOptions from ui-helpers.js

// Removed redundant window move

window.seekVideo = function (event, postId) {
  const container = event.currentTarget;
  const rect = container.getBoundingClientRect();
  const pos = (event.clientX - rect.left) / rect.width;

  const video = document.querySelector(`[data-post-id="${postId}"] video`);
  if (video && video.duration) {
    video.currentTime = pos * video.duration;
  }
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([\w-]{11})/);
  return match ? match[1] : null;
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.innerWidth < 992) { // Mobile only
    TukTukFeed.init('tuktukFeed');
  }
});