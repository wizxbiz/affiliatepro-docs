/**
 * Super Admin Security Middleware
 * Multi-layer authentication & authorization
 *
 * Deploy: workers/middleware/super-admin-security.js
 */

export class SuperAdminSecurity {
  constructor(env) {
    this.env = env;
    this.SUPER_ADMIN_IDS = [
      'Ud9bec6d2ea945cf4330a69cb74ac93cf'
    ];
  }

  // Layer 1: JWT Token Verification
  async verifyToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    try {
      const session = await this.decodeJWT(token);
      return { valid: true, session };
    } catch (err) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  // Layer 2: Role-Based Access Control (RBAC)
  async checkPermissions(userId, action) {
    // Check hardcoded super admins
    if (this.SUPER_ADMIN_IDS.includes(userId)) {
      return { authorized: true, role: 'super_admin' };
    }

    // Check D1 database
    const user = await this.env.DB.prepare(
      'SELECT id, role FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return { authorized: false, error: 'User not found' };
    }

    const allowedRoles = this.getActionRoles(action);
    const authorized = allowedRoles.includes(user.role);

    return { authorized, role: user.role };
  }

  // Layer 3: Rate Limiting
  async checkRateLimit(userId, ip) {
    const key = `ratelimit:${userId}:${ip}`;
    const count = await this.env.CACHE?.get(key);

    if (count && parseInt(count) > 100) {
      return { limited: true, error: 'Too many requests' };
    }

    const newCount = count ? parseInt(count) + 1 : 1;
    await this.env.CACHE?.put(key, newCount.toString(), { expirationTtl: 60 });

    return { limited: false, count: newCount };
  }

  // Layer 4: IP Whitelist (Optional)
  checkIPWhitelist(ip) {
    const whitelist = [
      '127.0.0.1',
      '::1',
      // Add your office/home IPs here
    ];

    // Disable whitelist in production (comment out if needed)
    return { allowed: true };

    // Enable strict whitelist:
    // return { allowed: whitelist.includes(ip) };
  }

  // Layer 5: Audit Logging
  async logAdminAction(userId, action, target, result) {
    const log = {
      admin_id: userId,
      action,
      target,
      result,
      timestamp: Date.now(),
      ip: null, // Set from request
      user_agent: null
    };

    try {
      await this.env.DB.prepare(`
        INSERT INTO admin_logs (admin_id, action, target, result, timestamp, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        log.admin_id,
        log.action,
        log.target,
        log.result,
        log.timestamp,
        log.ip,
        log.user_agent
      ).run();
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }

    return log;
  }

  // Permission Mapping
  getActionRoles(action) {
    const permissions = {
      'read': ['user', 'admin', 'super_admin'],
      'write': ['admin', 'super_admin'],
      'delete': ['super_admin'],
      'ban_user': ['super_admin'],
      'promote_admin': ['super_admin'],
      'view_logs': ['super_admin'],
      'moderate_post': ['admin', 'super_admin'],
      'delete_post': ['admin', 'super_admin'],
      'approve_seller': ['admin', 'super_admin']
    };

    return permissions[action] || ['super_admin'];
  }

  // JWT Helpers
  async decodeJWT(token) {
    // Simplified - use proper JWT library in production
    try {
      const [header, payload, signature] = token.split('.');
      const decoded = JSON.parse(atob(payload));

      // Check expiry
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return decoded;
    } catch (err) {
      throw new Error('Invalid JWT');
    }
  }

  // Main middleware handler
  async handle(request, action) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Step 1: Verify token
    const tokenCheck = await this.verifyToken(request);
    if (!tokenCheck.valid) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { code: 'UNAUTHORIZED', message: tokenCheck.error }
      }), { status: 401 });
    }

    const { session } = tokenCheck;
    const userId = session.uid || session.id;

    // Step 2: Check permissions
    const permCheck = await this.checkPermissions(userId, action);
    if (!permCheck.authorized) {
      await this.logAdminAction(userId, action, null, 'FORBIDDEN');
      return new Response(JSON.stringify({
        status: 'error',
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      }), { status: 403 });
    }

    // Step 3: Rate limiting
    const rateCheck = await this.checkRateLimit(userId, ip);
    if (rateCheck.limited) {
      return new Response(JSON.stringify({
        status: 'error',
        error: { code: 'RATE_LIMIT', message: rateCheck.error }
      }), { status: 429 });
    }

    // Step 4: IP whitelist (optional)
    const ipCheck = this.checkIPWhitelist(ip);
    if (!ipCheck.allowed) {
      await this.logAdminAction(userId, action, null, 'IP_BLOCKED');
      return new Response(JSON.stringify({
        status: 'error',
        error: { code: 'FORBIDDEN', message: 'IP not whitelisted' }
      }), { status: 403 });
    }

    // All checks passed - attach session to request
    request.adminSession = {
      userId,
      role: permCheck.role,
      ip
    };

    return null; // Continue to handler
  }
}
