/**
 * Analytics Handler — Cloudflare Workers
 * แทน analyticsSystem.js Firebase functions:
 *   trackPageView, trackEvent, getAnalyticsStats
 *
 * Stores data in D1 (SQL) แทน Firestore
 */

import { Hono } from 'hono';
import { optionalAuth } from '../middleware/auth.js';
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


// ── GET /api/analytics/getStats (PUBLIC — visitor badge) ──────
// แสดงยอด visitors บนหน้าเว็บ ไม่ต้อง auth
analyticsRoutes.get('/getStats', async (c) => {
  const days = parseInt(c.req.query('days') || '1');
  const clampedDays = Math.min(Math.max(days, 1), 30);
  const now = Date.now();
  const fromTs = now - clampedDays * 86400000;

  try {
    // Count unique visitors in time range (from page_views table)
    const uniqueRow = await c.env.DB.prepare(
      `SELECT COUNT(DISTINCT COALESCE(user_id, user_agent)) as cnt FROM page_views WHERE timestamp >= ?`
    ).bind(fromTs).first().catch(() => ({ cnt: 0 }));

    // Count all-time page views as proxy for total visitors
    const totalRow = await c.env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM page_views`
    ).first().catch(() => ({ cnt: 0 }));

    // Approximate "online now" = views in last 5 minutes
    const onlineRow = await c.env.DB.prepare(
      `SELECT COUNT(DISTINCT COALESCE(user_id, user_agent)) as cnt FROM page_views WHERE timestamp >= ?`
    ).bind(now - 5 * 60 * 1000).first().catch(() => ({ cnt: 0 }));

    return c.json({
      success: true,
      data: {
        summary: {
          uniqueVisitors:       uniqueRow?.cnt || 0,
          allTimeUniqueVisitors: totalRow?.cnt || 0,
          allTimePageViews:     totalRow?.cnt || 0,
          onlineNow:            onlineRow?.cnt || 0,
          days:                 clampedDays,
        }
      }
    });
  } catch (err) {
    // Analytics must never break UX — return zeros instead of 401/500
    console.error('[Analytics] getStats error:', err.message);
    return c.json({
      success: true,
      data: { summary: { uniqueVisitors: 0, allTimeUniqueVisitors: 0, allTimePageViews: 0, onlineNow: 0 } }
    });
  }
});

// ── GET /api/analytics/adminStats (Admin only — detailed) ──────
analyticsRoutes.get('/adminStats', optionalAuth, async (c) => {
  const session = c.get('session');

  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return c.json({ error: 'Admin only' }, 403);
  }

  const { from, to, period = '7d' } = c.req.query();
  const now = Date.now();
  let fromTs;
  switch (period) {
    case '1d':  fromTs = now - 86400000;      break;
    case '7d':  fromTs = now - 7 * 86400000;  break;
    case '30d': fromTs = now - 30 * 86400000; break;
    default:    fromTs = from ? +from : now - 7 * 86400000;
  }
  const toTs = to ? +to : now;

  try {
    const db = new DB(c.env.DB);
    const stats = await db.getAnalyticsStats(fromTs, toTs);
    return c.json({ success: true, stats, period, from: fromTs, to: toTs });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

