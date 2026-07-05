/**
 * D1 Database Abstraction Layer
 * แทน Firestore admin.firestore() calls ใน Cloud Functions
 *
 * ใช้ Cloudflare D1 (SQLite) สำหรับ queries แทน Firestore
 */

export class DB {
  constructor(d1) {
    this.d1 = d1;
  }

  // ═══════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // POSTS
  // ═══════════════════════════════════════════════════════════

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

  async createPost(post) {
    return this.d1.prepare(`
      INSERT INTO posts (id, user_id, content, media_urls, category, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      post.id, post.userId, post.content,
      JSON.stringify(post.mediaUrls || []),
      post.category || 'general', post.status || 'active',
      post.createdAt || Date.now()
    ).run();
  }

  async deletePost(id, userId) {
    return this.d1.prepare(`UPDATE posts SET status = 'deleted' WHERE id = ? AND user_id = ?`)
      .bind(id, userId).run();
  }

  async incrementPostLikes(postId) {
    return this.d1.prepare(`UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?`)
      .bind(postId).run();
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCTS (Marketplace)
  // ═══════════════════════════════════════════════════════════

  async getProducts({ category, limit = 20, offset = 0, search } = {}) {
    let query = `
      SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
      FROM products p LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
    `;
    const binds = [];

    if (category) { query += ' AND p.category = ?'; binds.push(category); }
    if (search)   { query += " AND (p.title LIKE ? OR p.description LIKE ?)"; binds.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    binds.push(limit, offset);

    return this.d1.prepare(query).bind(...binds).all().then(r => r.results);
  }

  async getProductById(id) {
    return this.d1.prepare(`
      SELECT p.*, u.display_name as seller_name, u.picture_url as seller_picture
      FROM products p LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `).bind(id).first();
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
      INSERT INTO products (id, seller_id, title, description, price, images, category, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product.id, product.sellerId, product.title,
      product.description, product.price,
      typeof product.images === 'string' ? product.images : JSON.stringify(product.images || []),
      product.category || 'general', product.status || 'active',
      product.createdAt || Date.now()
    ).run();
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

  // ═══════════════════════════════════════════════════════════
  // WEB PINs (สำหรับ LINE Login flow)
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // USAGE TRACKING
  // ═══════════════════════════════════════════════════════════

  async getUserUsage(userId) {
    return this.d1.prepare('SELECT * FROM user_usage WHERE user_id = ?').bind(userId).first();
  }

  // ═══════════════════════════════════════════════════════════
  // FEEDBACK
  // ═══════════════════════════════════════════════════════════

  async createFeedback(fb) {
    return this.d1.prepare(`
      INSERT INTO feedbacks (id, user_id, type, message, page, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(fb.id, fb.userId, fb.type, fb.message, fb.page, fb.createdAt).run();
  }

  // ═══════════════════════════════════════════════════════════
  // WEB PUSH SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════

  /** camelCase → snake_case column name */
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
