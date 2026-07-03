/**
 * Admin API Handlers — Cloudflare Workers stub
 * แทน Firebase adminApi functions: adminCreatePin, adminBroadcast, verifyWebPin
 */

import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';
import { DB } from '../lib/db.js';

export const adminRoutes = new Hono();

// All routes require admin
adminRoutes.use('*', requireAdmin);

adminRoutes.get('/stats', async (c) => {
  const db = new DB(c.env.DB);
  try {
    const stats = await db.getMarketplaceStats();
    return c.json({ success: true, stats });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

adminRoutes.post('/broadcast', async (c) => {
  return c.json({ success: true, message: 'Broadcast stub' });
});
