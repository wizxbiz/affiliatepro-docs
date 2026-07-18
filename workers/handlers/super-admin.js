/**
 * Super Admin Routes Handler
 * Protected admin endpoints with full CRUD operations
 *
 * Deploy: workers/handlers/super-admin.js
 */

import { SuperAdminSecurity } from '../middleware/super-admin-security.js';
import { Hono } from 'hono';

export const superAdminRoutes = new Hono();

// Initialize security middleware
superAdminRoutes.use('*', async (c, next) => {
  const security = new SuperAdminSecurity(c.env);
  const action = c.req.method === 'GET' ? 'read' : c.req.method === 'DELETE' ? 'delete' : 'write';

  const securityCheck = await security.handle(c.req.raw, action);
  if (securityCheck) {
    return securityCheck; // Return error response
  }

  // Attach admin session to context
  c.set('adminSession', c.req.raw.adminSession);
  await next();
});

// ══════════════════════════════════════════════════════════
// USERS MANAGEMENT
// ══════════════════════════════════════════════════════════

superAdminRoutes.get('/users', async (c) => {
  const { limit = 50, offset = 0, search = '', role = '' } = c.req.query();

  let query = 'SELECT * FROM users WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (display_name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    status: 'success',
    users: result.results || [],
    total: result.results?.length || 0
  });
});

superAdminRoutes.get('/users/:id', async (c) => {
  const userId = c.req.param('id');

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ status: 'error', error: 'User not found' }, 404);
  }

  return c.json({ status: 'success', user });
});

superAdminRoutes.patch('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const updates = await c.req.json();
  const session = c.get('adminSession');

  // Build update query
  const allowed = ['role', 'is_premium', 'subscription_status', 'seller_status'];
  const fields = Object.keys(updates).filter(k => allowed.includes(k));

  if (fields.length === 0) {
    return c.json({ status: 'error', error: 'No valid fields to update' }, 400);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  await c.env.DB.prepare(
    `UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`
  ).bind(...values, Date.now(), userId).run();

  // Log action
  const security = new SuperAdminSecurity(c.env);
  await security.logAdminAction(session.userId, 'update_user', userId, 'SUCCESS');

  return c.json({ status: 'success', message: 'User updated' });
});

superAdminRoutes.delete('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const session = c.get('adminSession');

  // Prevent self-deletion
  if (userId === session.userId) {
    return c.json({ status: 'error', error: 'Cannot delete yourself' }, 400);
  }

  // Soft delete (set status to 'deleted')
  await c.env.DB.prepare(
    `UPDATE users SET role = 'deleted', updated_at = ? WHERE id = ?`
  ).bind(Date.now(), userId).run();

  // Log action
  const security = new SuperAdminSecurity(c.env);
  await security.logAdminAction(session.userId, 'delete_user', userId, 'SUCCESS');

  return c.json({ status: 'success', message: 'User deleted' });
});

// ══════════════════════════════════════════════════════════
// POSTS MANAGEMENT
// ══════════════════════════════════════════════════════════

superAdminRoutes.get('/posts', async (c) => {
  const { limit = 50, offset = 0, status = '', category = '' } = c.req.query();

  let query = 'SELECT * FROM posts WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    status: 'success',
    posts: result.results || [],
    total: result.results?.length || 0
  });
});

superAdminRoutes.patch('/posts/:id', async (c) => {
  const postId = c.req.param('id');
  const updates = await c.req.json();
  const session = c.get('adminSession');

  // Allowed fields
  const allowed = ['status', 'category'];
  const fields = Object.keys(updates).filter(k => allowed.includes(k));

  if (fields.length === 0) {
    return c.json({ status: 'error', error: 'No valid fields' }, 400);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  await c.env.DB.prepare(
    `UPDATE posts SET ${setClause}, updated_at = ? WHERE id = ?`
  ).bind(...values, Date.now(), postId).run();

  // Log action
  const security = new SuperAdminSecurity(c.env);
  await security.logAdminAction(session.userId, 'moderate_post', postId, 'SUCCESS');

  return c.json({ status: 'success', message: 'Post updated' });
});

superAdminRoutes.delete('/posts/:id', async (c) => {
  const postId = c.req.param('id');
  const session = c.get('adminSession');

  // Soft delete
  await c.env.DB.prepare(
    `UPDATE posts SET status = 'deleted', updated_at = ? WHERE id = ?`
  ).bind(Date.now(), postId).run();

  // Log action
  const security = new SuperAdminSecurity(c.env);
  await security.logAdminAction(session.userId, 'delete_post', postId, 'SUCCESS');

  return c.json({ status: 'success', message: 'Post deleted' });
});

// ══════════════════════════════════════════════════════════
// PRODUCTS MANAGEMENT
// ══════════════════════════════════════════════════════════

superAdminRoutes.get('/products', async (c) => {
  const { limit = 50, offset = 0, status = '', category = '' } = c.req.query();

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    status: 'success',
    products: result.results || [],
    total: result.results?.length || 0
  });
});

superAdminRoutes.patch('/products/:id', async (c) => {
  const productId = c.req.param('id');
  const updates = await c.req.json();
  const session = c.get('adminSession');

  const allowed = ['status', 'category', 'price'];
  const fields = Object.keys(updates).filter(k => allowed.includes(k));

  if (fields.length === 0) {
    return c.json({ status: 'error', error: 'No valid fields' }, 400);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);

  await c.env.DB.prepare(
    `UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?`
  ).bind(...values, Date.now(), productId).run();

  // Log action
  const security = new SuperAdminSecurity(c.env);
  await security.logAdminAction(session.userId, 'update_product', productId, 'SUCCESS');

  return c.json({ status: 'success', message: 'Product updated' });
});

superAdminRoutes.delete('/products/:id', async (c) => {
  const productId = c.req.param('id');
  const session = c.get('adminSession');

  await c.env.DB.prepare(
    `UPDATE products SET status = 'deleted', updated_at = ? WHERE id = ?`
  ).bind(Date.now(), productId).run();

  // Log action
  const security = new SuperAdminSecurity(c.env);
  await security.logAdminAction(session.userId, 'delete_product', productId, 'SUCCESS');

  return c.json({ status: 'success', message: 'Product deleted' });
});

// ══════════════════════════════════════════════════════════
// ANALYTICS & STATS
// ══════════════════════════════════════════════════════════

superAdminRoutes.get('/stats', async (c) => {
  const { days = 30 } = c.req.query();
  const since = Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000);

  // Get counts
  const [users, posts, products, orders] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').bind(since).first(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM posts WHERE created_at >= ?').bind(since).first(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE created_at >= ?').bind(since).first(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM orders WHERE created_at >= ?').bind(since).first()
  ]);

  return c.json({
    status: 'success',
    stats: {
      users: users?.count || 0,
      posts: posts?.count || 0,
      products: products?.count || 0,
      orders: orders?.count || 0,
      period: `${days} days`
    }
  });
});

// ══════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════

superAdminRoutes.get('/logs', async (c) => {
  const { limit = 100, offset = 0 } = c.req.query();

  const result = await c.env.DB.prepare(`
    SELECT * FROM admin_logs
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).bind(parseInt(limit), parseInt(offset)).all();

  return c.json({
    status: 'success',
    logs: result.results || []
  });
});

export default superAdminRoutes;
