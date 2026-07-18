const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://tuktukfeed-api.imtthailand2019.workers.dev/api/v1';

async function fetchJson(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      next: { revalidate: 60, ...(options.next || {}) } // Cache for 60 seconds by default
    });

    if (!res.ok) {
      console.warn(`[API Client] fetch failed on ${path}: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json().catch(() => null);
    if (data && data.status === 'error') {
      console.warn(`[API Client] API error on ${path}:`, data.error);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[API Client] Network error on ${path}:`, err);
    return null;
  }
}

export const api = {
  // Get main feed (combines community posts and products)
  async getFeed(province = '') {
    const params = new URLSearchParams();
    if (province) params.set('province', province);
    params.set('limit', '20');

    // 1. Fetch D1 community posts
    const postsData = await fetchJson(`/posts?${params.toString()}`);
    let posts = postsData?.posts || [];

    // 2. Fetch products as fallback or to interleave
    const productsData = await fetchJson(`/products?${params.toString()}`);
    let products = productsData?.products || [];

    // Convert products to standard feed items
    const productFeedItems = products.map(p => ({
      id: p.id || p.productId,
      type: 'product',
      authorName: p.sellerName || 'TukTuk Seller',
      authorId: p.sellerId || p.lineUserId || null,
      avatarUrl: p.sellerAvatar || '',
      content: p.description || p.detail || '',
      title: p.title || p.productName || '',
      videoUrl: p.videoUrl || '',
      mediaUrls: Array.isArray(p.images) ? p.images : [p.imageUrl].filter(Boolean),
      price: p.price,
      province: p.province || '',
      createdAt: p.createdAt || null,
      likes: 0,
      commentsCount: 0,
      viewCount: 0
    }));

    // If we have no posts, return products. Otherwise, merge and return
    if (posts.length === 0) return productFeedItems;

    // Normalize posts to match client expectation
    const normalizedPosts = posts.map(p => {
      let urls = [];
      if (Array.isArray(p.media)) {
        urls = p.media.map(m => typeof m === 'string' ? m : m.url).filter(Boolean);
      } else if (p.media_urls) {
        try {
          const parsed = JSON.parse(p.media_urls);
          urls = parsed.map(m => typeof m === 'string' ? m : m.url).filter(Boolean);
        } catch (_) {}
      } else if (Array.isArray(p.mediaUrls)) {
        urls = p.mediaUrls.map(m => typeof m === 'string' ? m : m.url).filter(Boolean);
      }

      const videoUrl = urls.find(url => url.endsWith('.mp4') || url.includes('/videos/')) || '';

      return {
        id: p.id,
        type: 'post',
        authorName: p.authorName || p.display_name || 'TukTuk User',
        authorId: p.userId || p.user_id,
        avatarUrl: p.pictureUrl || p.picture_url || p.author_picture || '',
        content: p.content || '',
        videoUrl: videoUrl,
        mediaUrls: urls,
        province: p.province || '',
        createdAt: p.createdAt || p.created_at,
        likes: p.likes || p.likes_count || 0,
        commentsCount: p.commentsCount || p.comments_count || 0,
        viewCount: p.viewCount || p.views_count || 0
      };
    });

    // Interleave: insert a product every 4 posts
    const combined = [];
    let pIdx = 0;
    normalizedPosts.forEach((post, index) => {
      combined.push(post);
      if ((index + 1) % 4 === 0 && pIdx < productFeedItems.length) {
        combined.push(productFeedItems[pIdx]);
        pIdx++;
      }
    });

    // Append remaining products if any
    while (pIdx < productFeedItems.length) {
      combined.push(productFeedItems[pIdx]);
      pIdx++;
    }

    return combined;
  },

  // Get products grid
  async getProducts(province = '') {
    const params = new URLSearchParams();
    if (province) params.set('province', province);
    const data = await fetchJson(`/products?${params.toString()}`);
    return data?.products || [];
  },

  // Get single product details (for og:tags and detail view)
  async getProduct(id) {
    const data = await fetchJson(`/products/${encodeURIComponent(id)}`, {
      next: { revalidate: 10 } // Refresh more frequently for detail views
    });
    return data?.product || null;
  },

  // Get single post details (for og:tags and detail view)
  async getPost(id) {
    const data = await fetchJson(`/posts/${encodeURIComponent(id)}`, {
      next: { revalidate: 10 }
    });
    return data?.post || null;
  },

  // Get single user profile
  async getUser(id) {
    const data = await fetchJson(`/users/${encodeURIComponent(id)}`, {
      next: { revalidate: 30 }
    });
    return data?.user || null;
  },

  // Get posts by author/user for channel display
  async getUserPosts(userId) {
    const data = await fetchJson('/posts');
    const posts = data?.posts || [];
    return posts.filter(p => p.userId === userId).map(p => ({
      id: p.id,
      type: 'post',
      authorName: p.authorName || 'TukTuk User',
      authorId: p.userId,
      avatarUrl: p.pictureUrl || '',
      content: p.content || '',
      videoUrl: p.mediaUrls && p.mediaUrls.find(url => url.endsWith('.mp4')) || '',
      mediaUrls: p.mediaUrls || [],
      createdAt: p.createdAt,
      likes: p.likes || 0,
      commentsCount: p.commentsCount || 0,
      viewCount: p.viewCount || 0
    }));
  }
};
