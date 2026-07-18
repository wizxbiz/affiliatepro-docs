/**
 * Analytics Handler — Cloudflare Workers
 * แทน analyticsSystem.js Firebase functions:
 *   trackPageView, trackEvent, getAnalyticsStats
 *
 * Stores data in D1 (SQL) แทน Firestore
 */

import { Hono } from 'hono';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { DB } from '../lib/db.js';

export const analyticsRoutes = new Hono();

// ── POST /api/analytics/trackPageView ────────────────────────
analyticsRoutes.post('/trackPageView', optionalAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const session = c.get('session');
  const db = new DB(c.env.DB);

  try {
    await db.trackPageView({
      id: crypto.randomUUID(),
      page: body.page || c.req.header('Referer') || 'unknown',
      userId: session?.uid || null,
      userAgent: c.req.header('User-Agent') || '',
      country: c.req.header('CF-IPCountry') || 'unknown',
      timestamp: Date.now(),
    });
    return c.json({ success: true });
  } catch (err) {
    // Analytics should never break the UX — silently fail
    console.error('[Analytics] trackPageView error:', err);
    return c.json({ success: true }); // Return 200 anyway
  }
});

// ── POST /api/analytics/trackEvent ────────────────────────────
analyticsRoutes.post('/trackEvent', optionalAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const session = c.get('session');
  const db = new DB(c.env.DB);

  try {
    await db.trackEvent({
      id: crypto.randomUUID(),
      event: body.event || 'unknown',
      category: body.category || 'general',
      label: body.label || null,
      value: body.value || null,
      userId: session?.uid || null,
      timestamp: Date.now(),
    });
    return c.json({ success: true });
  } catch (err) {
    console.error('[Analytics] trackEvent error:', err);
    return c.json({ success: true });
  }
});

// ── GET /api/analytics/getStats ───────────────────────────────
// แทน getAnalyticsStats Firebase function (Admin only)
analyticsRoutes.get('/getStats', requireAuth, async (c) => {
  const session = c.get('session');
  if (session?.role !== 'admin' && session?.role !== 'super_admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const db = new DB(c.env.DB);
  const { from, to, period = '7d' } = c.req.query();

  try {
    const now = Date.now();
    let fromTs;
    switch (period) {
      case '1d': fromTs = now - 86400000;      break;
      case '7d': fromTs = now - 7 * 86400000;  break;
      case '30d': fromTs = now - 30 * 86400000; break;
      default:    fromTs = from ? +from : now - 7 * 86400000;
    }
    const toTs = to ? +to : now;

    const stats = await db.getAnalyticsStats(fromTs, toTs);
    return c.json({ success: true, stats, period, from: fromTs, to: toTs });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});
