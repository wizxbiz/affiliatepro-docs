import { normalizeMediaUrls } from './media-normalizer.js';

/**
 * D1 Database Abstraction Layer
 * เนเธ—เธ Firestore admin.firestore() calls เนเธ Cloud Functions
 *
 * เนเธเน Cloudflare D1 (SQLite) เธชเธณเธซเธฃเธฑเธ queries เนเธ—เธ Firestore
 */

export class DB {
  constructor(d1) {
    this.d1 = d1;
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // USERS
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async getUserById(id) {
    return this.d1.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  }

  async getUserByEmail(email) {
    return this.d1.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  }

  async getUserByLineId(lineUserId) {
    return this.d1.prepare('SELECT * FROM users WHERE line_user_id = ?').bind(lineUserId).first();
  }

  async getUserByPhone(phone) {
    return this.d1.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first();
  }

  async saveOtpCode(phone, code, expiresAt) {
    return this.d1.prepare(`
      INSERT OR REPLACE INTO otp_codes (phone, code, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(phone, code, expiresAt, Date.now()).run();
  }

  async getOtpCode(phone) {
    return this.d1.prepare('SELECT * FROM otp_codes WHERE phone = ?').bind(phone).first();
  }

  async deleteOtpCode(phone) {
    return this.d1.prepare('DELETE FROM otp_codes WHERE phone = ?').bind(phone).run();
  }

  async createUser(user) {
    return this.d1.prepare(`
      INSERT INTO users (id, line_user_id, firebase_uid, display_name, email, picture_url,
                         role, seller_status, is_premium, subscription_status, provider, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id, user.lineUserId || null, user.firebaseUid || null,
      user.displayName, user.email || null, user.pictureUrl || null,
      user.role || 'user', user.sellerStatus || 'none', user.isPremium || 0,
      user.subscriptionStatus || null, user.provider || 'line', user.phone || null,
      user.createdAt || Date.now(), user.updatedAt || Date.now()
    ).run();
  }

  async updateUser(id, fields) {
    const sets = Object.keys(fields).map(k => `${this._col(k)} = ?`).join(', ');
    const values = Object.values(fields);
    return this.d1.prepare(`UPDATE users SET ${sets} WHERE id = ?`)
      .bind(...values, id).run();
  }

  async updateSellerVerification(userId, lineOaId) {
    return this.d1.prepare(`
      UPDATE users 
      SET seller_status = 'verified', line_oa_id = ?, updated_at = ?
      WHERE id = ?
    `).bind(lineOaId, Date.now(), userId).run();
  }

  // ─────────────────────────────────────────────────────────────
  // FOLLOWS
  // ─────────────────────────────────────────────────────────────

  async ensureFollowsTable() {
    return this.d1.prepare(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (follower_id, following_id)
      )
    `).run().catch(() => {});
  }

  async followUser(followerId, followingId) {
    await this.ensureFollowsTable();
    return this.d1.prepare(`
      INSERT OR IGNORE INTO follows (follower_id, following_id, created_at)
      VALUES (?, ?, ?)
    `).bind(followerId, followingId, Date.now()).run();
  }

  async unfollowUser(followerId, followingId) {
    await this.ensureFollowsTable();
    return this.d1.prepare(`
      DELETE FROM follows WHERE follower_id = ? AND following_id = ?
    `).bind(followerId, followingId).run();
  }

  async isFollowing(followerId, followingId) {
    await this.ensureFollowsTable();
    const row = await this.d1.prepare(`
      SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1
    `).bind(followerId, followingId).first();
    return Boolean(row);
  }

  async getFollowers(userId, { limit = 30, offset = 0 } = {}) {
    await this.ensureFollowsTable();
    return this.d1.prepare(`
      SELECT u.id, u.display_name, u.picture_url, u.role, u.seller_status
      FROM follows f JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all().then(r => r.results || []);
  }

  async getFollowing(userId, { limit = 30, offset = 0 } = {}) {
    await this.ensureFollowsTable();
    return this.d1.prepare(`
      SELECT u.id, u.display_name, u.picture_url, u.role, u.seller_status
      FROM follows f JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all().then(r => r.results || []);
  }

  async getFollowCounts(userId) {
    await this.ensureFollowsTable();
    const [followers, following] = await Promise.all([
      this.d1.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').bind(userId).first(),
      this.d1.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').bind(userId).first(),
    ]);
    return {
      followerCount: followers?.count || 0,
      followingCount: following?.count || 0,
    };
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // POSTS
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async getPosts({ category, limit = 20, offset = 0 } = {}) {
    if (category && category !== 'all') {
      return this.d1.prepare(`
        SELECT p.*, u.display_name, u.picture_url as author_picture
        FROM posts p LEFT JOIN users u ON p.user_id = u.id
        WHERE p.category = ? AND p.status = 'active'
        ORDER BY p.created_at DESC LIMIT ? OFFSET ?
      `).bind(category, limit, offset).all().then(r => r.results);
    }
    return this.d1.prepare(`
      SELECT p.*, u.display_name, u.picture_url as author_picture
      FROM posts p LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).bind(limit, offset).all().then(r => r.results);
  }

  async getPostById(id) {
    return this.d1.prepare(`
      SELECT p.*, u.display_name, u.picture_url as author_picture
      FROM posts p LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).bind(id).first();
  }

  async getPostsByUser(userId, { limit = 30, offset = 0 } = {}) {
    return this.d1.prepare(`
      SELECT p.*, u.display_name, u.picture_url as author_picture
      FROM posts p LEFT JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? AND p.status = 'active'
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all().then(r => r.results);
  }

  async createPost(post) {
    const mediaUrls = normalizeMediaUrls(post.mediaUrls || []);
    const youtube = mediaUrls.find((item) => item.type === 'youtube');
    const now = post.createdAt || Date.now();
    return this.d1.prepare(`
      INSERT INTO posts (id, user_id, title, content, media_urls, category, status, youtube_url, video_embed, linked_product_id, pinned, published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      post.id, post.userId, post.title || '', post.content,
      JSON.stringify(mediaUrls),
      post.category || (youtube ? 'video' : 'general'), post.status || 'active',
      post.youtubeUrl || youtube?.url || '', post.videoEmbed || youtube?.embedUrl || '',
      post.linkedProductId || null,
      post.pinned ? 1 : 0,
      post.published !== false ? 1 : 0,
      now, post.updatedAt || now
    ).run();
  }

  async deletePost(id, userId) {
    return this.d1.prepare(`UPDATE posts SET status = 'deleted' WHERE id = ? AND user_id = ?`)
      .bind(id, userId).run();
  }

  // Owner-scoped edit. `fields` keys are camelCase; only whitelisted columns
  // should be passed in by the caller (the route enforces the whitelist).
  async updatePost(id, userId, fields, isAdmin = false) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return { meta: { changes: 0 } };
    const sets = keys.map(k => `${this._col(k)} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    if (isAdmin) {
      return this.d1.prepare(`UPDATE posts SET ${sets}, updated_at = ? WHERE id = ?`)
        .bind(...values, Date.now(), id).run();
    }
    return this.d1.prepare(`UPDATE posts SET ${sets}, updated_at = ? WHERE id = ? AND user_id = ?`)
      .bind(...values, Date.now(), id, userId).run();
  }

  async incrementPostLikes(postId) {
    return this.d1.prepare(`UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?`)
      .bind(postId).run();
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // PRODUCTS (Marketplace)
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async getProducts({ category, limit = 20, offset = 0, search, province } = {}) {
    let query = `
      SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
      FROM products p LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
    `;
    const binds = [];

    if (category) { query += ' AND p.category = ?'; binds.push(category); }

    if (search) {
      // แยก search เป็นคำๆ แล้ว AND ทุกคำ — แม่นยำกว่า phrase LIKE
      const terms = String(search).trim().split(/\s+/).filter(Boolean).slice(0, 6);
      if (terms.length === 1) {
        // คำเดียว: ค้นหาใน title, description, seller name, category
        const q = `%${terms[0]}%`;
        query += ` AND (p.title LIKE ? OR COALESCE(p.description,'') LIKE ? OR COALESCE(u.display_name,'') LIKE ? OR COALESCE(p.category,'') LIKE ?)`;
        binds.push(q, q, q, q);
      } else {
        // หลายคำ: ทุกคำต้องตรงใน title+description+seller
        for (const term of terms) {
          const q = `%${term}%`;
          query += ` AND (p.title LIKE ? OR COALESCE(p.description,'') LIKE ? OR COALESCE(u.display_name,'') LIKE ?)`;
          binds.push(q, q, q);
        }
      }
    }

    if (province) { query += " AND COALESCE(p.seller_location, '') LIKE ?"; binds.push(`%${province}%`); }

    // เรียงลำดับ: ถ้า search ให้ title match ก่อน ตามด้วย views_count
    if (search) {
      const q1 = `%${String(search).trim().split(/\s+/)[0]}%`;
      query += ` ORDER BY CASE WHEN p.title LIKE ? THEN 0 ELSE 1 END, p.views_count DESC, p.created_at DESC`;
      binds.push(q1);
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    binds.push(limit, offset);

    return this.d1.prepare(query).bind(...binds).all().then(r => r.results);
  }

  async searchProducts(keyword, limit = 8) {
    const q = `%${String(keyword || '').trim()}%`;
    return this.d1.prepare(`
      SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
      FROM products p LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
        AND (
          p.title LIKE ?
          OR COALESCE(p.description, '') LIKE ?
          OR COALESCE(p.category, '') LIKE ?
        )
      ORDER BY p.views_count DESC, p.created_at DESC
      LIMIT ?
    `).bind(q, q, q, limit).all().then(r => r.results);
  }

  async getTrendingProducts(limit = 8) {
    return this.d1.prepare(`
      SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
      FROM products p LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
      ORDER BY p.views_count DESC, p.created_at DESC
      LIMIT ?
    `).bind(limit).all().then(r => r.results);
  }

  async getTrendingVideos(limit = 8) {
    return this.d1.prepare(`
      SELECT p.*, u.display_name as author_name, u.picture_url as author_picture
      FROM posts p LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active'
        AND COALESCE(p.published, 1) = 1
        AND (
          COALESCE(p.media_urls, '') LIKE '%"type":"video"%'
          OR COALESCE(p.media_urls, '') LIKE '%"type": "video"%'
          OR COALESCE(p.media_urls, '') LIKE '%"type":"youtube"%'
          OR COALESCE(p.media_urls, '') LIKE '%"type": "youtube"%'
          OR COALESCE(p.media_urls, '') LIKE '%.mp4%'
          OR COALESCE(p.media_urls, '') LIKE '%.webm%'
          OR COALESCE(p.media_urls, '') LIKE '%youtube.com%'
          OR COALESCE(p.media_urls, '') LIKE '%youtu.be%'
          OR COALESCE(p.video_embed, '') != ''
          OR COALESCE(p.youtube_url, '') != ''
        )
      ORDER BY p.views_count DESC, p.likes_count DESC, p.created_at DESC
      LIMIT ?
    `).bind(limit).all().then(r => r.results);
  }

  async incrementProductViews(productId) {
    return this.d1.prepare(`
      UPDATE products SET views_count = COALESCE(views_count, 0) + 1
      WHERE id = ? AND status = 'active'
    `).bind(productId).run();
  }

  async incrementPostViews(postId) {
    return this.d1.prepare(`
      UPDATE posts SET views_count = COALESCE(views_count, 0) + 1
      WHERE id = ? AND status = 'active'
    `).bind(postId).run();
  }

  async getProductById(id) {
    return this.d1.prepare(`
      SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
      FROM products p LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `).bind(id).first();
  }

  async getProductsBySeller(sellerId, limit = 20) {
    return this.d1.prepare(`
      SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
      FROM products p LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `).bind(sellerId, limit).all().then(r => r.results);
  }

  async getSellerStats(sellerId) {
    return this.d1.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN COALESCE(product_stock, 0) <= 0 AND status = 'active' THEN 1 ELSE 0 END) as out_of_stock,
        COALESCE(SUM(views_count), 0) as total_views
      FROM products
      WHERE seller_id = ?
    `).bind(sellerId).first();
  }

  async getRelatedProducts(productId, limit = 4) {
    const product = await this.getProductById(productId);
    if (!product) return [];
    return this.d1.prepare(`
      SELECT * FROM products
      WHERE category = ? AND id != ? AND status = 'active'
      ORDER BY created_at DESC LIMIT ?
    `).bind(product.category, productId, limit).all().then(r => r.results);
  }

  async createProduct(product) {
    return this.d1.prepare(`
      INSERT INTO products (
        id, seller_id, title, description, price, images, category, status,
        seller_phone, seller_line_id, seller_facebook, seller_location,
        product_unit, product_stock, is_otop, is_organic, video_url,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product.id, product.sellerId, product.title,
      product.description, product.price,
      typeof product.images === 'string' ? product.images : JSON.stringify(product.images || []),
      product.category || 'general', product.status || 'active',
      product.sellerPhone || '', product.sellerLineId || '', product.sellerFacebook || '',
      product.sellerLocation || '', product.productUnit || '', Number(product.productStock || 0),
      product.isOTOP ? 1 : 0, product.isOrganic ? 1 : 0, product.videoUrl || '',
      product.createdAt || Date.now()
    ).run();
  }

  async updateProduct(id, sellerId, fields) {
    const cols = Object.keys(fields);
    if (cols.length === 0) return { meta: { changes: 0 } };
    const sets = cols.map(k => `${this._col(k)} = ?`).join(', ');
    const values = Object.values(fields);
    return this.d1.prepare(
      `UPDATE products SET ${sets}, updated_at = ? WHERE id = ? AND seller_id = ?`
    ).bind(...values, Date.now(), id, sellerId).run();
  }

  async deleteProduct(id, sellerId) {
    return this.d1.prepare(
      `UPDATE products SET status = 'deleted', updated_at = ? WHERE id = ? AND seller_id = ?`
    ).bind(Date.now(), id, sellerId).run();
  }

  async getMarketplaceStats() {
    const [products, users, posts] = await Promise.all([
      this.d1.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'").first(),
      this.d1.prepare("SELECT COUNT(*) as count FROM users").first(),
      this.d1.prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'active'").first(),
    ]);
    return {
      totalProducts: products?.count || 0,
      totalUsers:    users?.count || 0,
      totalPosts:    posts?.count || 0,
    };
  }

  async recordContact(contact) {
    return this.d1.prepare(`
      INSERT INTO contacts (id, buyer_id, seller_id, product_id, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      contact.id, contact.buyerId, contact.sellerId,
      contact.productId, contact.message, contact.createdAt || Date.now()
    ).run();
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // WEB PINs (เธชเธณเธซเธฃเธฑเธ LINE Login flow)
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async getWebPin(lineUserId) {
    return this.d1.prepare('SELECT * FROM web_pins WHERE line_user_id = ?').bind(lineUserId).first();
  }

  async saveWebPin(lineUserId, pin, expiresAt) {
    return this.d1.prepare(`
      INSERT OR REPLACE INTO web_pins (line_user_id, pin, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(lineUserId, pin, expiresAt, Date.now()).run();
  }

  async deleteWebPin(lineUserId) {
    return this.d1.prepare('DELETE FROM web_pins WHERE line_user_id = ?').bind(lineUserId).run();
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // ANALYTICS
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async trackPageView(pv) {
    return this.d1.prepare(`
      INSERT INTO page_views (id, page, user_id, user_agent, country, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(pv.id, pv.page, pv.userId, pv.userAgent, pv.country, pv.timestamp).run();
  }

  async trackEvent(ev) {
    return this.d1.prepare(`
      INSERT INTO events (id, event, category, label, value, user_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(ev.id, ev.event, ev.category, ev.label, ev.value, ev.userId, ev.timestamp).run();
  }

  async getAnalyticsStats(fromTs, toTs) {
    const [views, events, uniqueUsers] = await Promise.all([
      this.d1.prepare('SELECT COUNT(*) as count FROM page_views WHERE timestamp BETWEEN ? AND ?')
        .bind(fromTs, toTs).first(),
      this.d1.prepare('SELECT COUNT(*) as count FROM events WHERE timestamp BETWEEN ? AND ?')
        .bind(fromTs, toTs).first(),
      this.d1.prepare('SELECT COUNT(DISTINCT user_id) as count FROM page_views WHERE timestamp BETWEEN ? AND ? AND user_id IS NOT NULL')
        .bind(fromTs, toTs).first(),
    ]);
    return {
      pageViews:   views?.count || 0,
      events:      events?.count || 0,
      uniqueUsers: uniqueUsers?.count || 0,
    };
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // USAGE TRACKING
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async getUserUsage(userId) {
    return this.d1.prepare('SELECT * FROM user_usage WHERE user_id = ?').bind(userId).first();
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // FEEDBACK
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async createFeedback(fb) {
    return this.d1.prepare(`
      INSERT INTO feedbacks (id, user_id, type, message, page, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(fb.id, fb.userId, fb.type, fb.message, fb.page, fb.createdAt).run();
  }

  // ══════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════

  async createNotification({ id, userId, type, title, body, data }) {
    return this.d1.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, is_read, data, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(
      id, userId, type, title || '', body || '',
      data ? JSON.stringify(data) : null,
      Date.now()
    ).run();
  }

  async getNotifications(userId, { limit = 30 } = {}) {
    return this.d1.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(userId, limit).all().then(r => r.results);
  }

  async getUnreadCount(userId) {
    const row = await this.d1.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).first();
    return row?.count || 0;
  }

  // ids=[] or omitted → mark ALL of this user's unread notifications read
  async markNotificationsRead(userId, ids = []) {
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(', ');
      return this.d1.prepare(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${placeholders})`
      ).bind(userId, ...ids).run();
    }
    return this.d1.prepare(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`
    ).bind(userId).run();
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // WEB PUSH SUBSCRIPTIONS
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  async savePushSubscription(sub) {
    // Table schema: id, user_id, endpoint, keys, created_at
    return this.d1.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (id, user_id, endpoint, keys, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(sub.id, sub.userId, sub.endpoint, JSON.stringify({ p256dh: sub.p256dh, auth: sub.auth }), sub.createdAt).run();
  }

  async getUserPushSubscriptions(userId) {
    return this.d1.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').bind(userId).all().then(r => r.results);
  }

  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•
  // Helpers
  // โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•โ•

  /** camelCase โ’ snake_case column name */
  _col(name) {
    return name.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  }

  /** Wrap result with Firestore-compatible toDate()/toMillis() */
  _wrapDocData(data) {
    if (!data) return data;
    const wrapped = { ...data };
    for (const [key, val] of Object.entries(wrapped)) {
      if ((key.toLowerCase().endsWith('at') || key.toLowerCase().endsWith('timestamp') || key === 'sentAt') && typeof val === 'number') {
        wrapped[key] = {
          toDate: () => new Date(val),
          toMillis: () => val,
          seconds: Math.floor(val / 1000),
          nanoseconds: (val % 1000) * 1e6
        };
      }
    }
    return wrapped;
  }
}
