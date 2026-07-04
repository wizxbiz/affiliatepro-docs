/**
 * Super Admin Frontend JavaScript
 * Enhanced security features + admin controls
 *
 * Deploy: public/js/super-admin-enhanced.js
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  // ENHANCED API CLIENT
  // ══════════════════════════════════════════════════════════

  class SuperAdminAPI {
    constructor() {
      this.baseUrl = window.location.origin.includes('localhost')
        ? 'https://tuktukfeed-api.imtthailand2019.workers.dev'
        : '';
    }

    async request(path, options = {}) {
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };

      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

      return res.json();
    }

    getToken() {
      return localStorage.getItem('tuktuk_jwt') ||
             JSON.parse(localStorage.getItem('wizmobiz_session') || '{}').token;
    }

    // ── Users ──
    async getUsers(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.request(`/api/admin/users?${query}`);
    }

    async getUser(userId) {
      return this.request(`/api/admin/users/${userId}`);
    }

    async updateUser(userId, updates) {
      return this.request(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }

    async deleteUser(userId) {
      return this.request(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    }

    // ── Posts ──
    async getPosts(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.request(`/api/admin/posts?${query}`);
    }

    async moderatePost(postId, status) {
      return this.request(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    }

    async deletePost(postId) {
      return this.request(`/api/admin/posts/${postId}`, {
        method: 'DELETE'
      });
    }

    // ── Products ──
    async getProducts(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.request(`/api/admin/products?${query}`);
    }

    async updateProduct(productId, updates) {
      return this.request(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    }

    async deleteProduct(productId) {
      return this.request(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });
    }

    // ── Stats ──
    async getStats(days = 30) {
      return this.request(`/api/admin/stats?days=${days}`);
    }

    // ── Audit Logs ──
    async getLogs(params = {}) {
      const query = new URLSearchParams(params).toString();
      return this.request(`/api/admin/logs?${query}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  // SECURITY FEATURES
  // ══════════════════════════════════════════════════════════

  class SecurityFeatures {
    constructor() {
      this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
      this.warningTimeout = 25 * 60 * 1000; // 25 minutes
      this.activityTimer = null;
      this.warningTimer = null;
    }

    // Session timeout with warning
    initSessionTimeout() {
      this.resetActivityTimer();

      // Track user activity
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => this.resetActivityTimer(), { passive: true });
      });
    }

    resetActivityTimer() {
      clearTimeout(this.activityTimer);
      clearTimeout(this.warningTimer);

      // Warning at 25 minutes
      this.warningTimer = setTimeout(() => {
        this.showTimeoutWarning();
      }, this.warningTimeout);

      // Logout at 30 minutes
      this.activityTimer = setTimeout(() => {
        this.forceLogout('Session expired');
      }, this.sessionTimeout);
    }

    showTimeoutWarning() {
      const warning = document.createElement('div');
      warning.className = 'timeout-warning';
      warning.innerHTML = `
        <div class="timeout-warning-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Session Expiring Soon</h4>
          <p>Your session will expire in 5 minutes due to inactivity.</p>
          <button onclick="this.closest('.timeout-warning').remove()">Continue Working</button>
        </div>
      `;
      document.body.appendChild(warning);

      // Auto-remove if user clicks
      warning.querySelector('button').addEventListener('click', () => {
        this.resetActivityTimer();
      });
    }

    forceLogout(reason) {
      alert(`Logged out: ${reason}`);
      localStorage.clear();
      window.location.reload();
    }

    // Detect suspicious activity
    detectSuspiciousActivity() {
      // Detect rapid clicks (possible automation)
      let clickCount = 0;
      let clickTimer = null;

      document.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);

        if (clickCount > 20) {
          console.warn('[Security] Suspicious activity detected: Rapid clicks');
          this.logSecurityEvent('suspicious_clicks', { count: clickCount });
        }

        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 1000);
      });
    }

    // CSRF Protection
    generateCSRFToken() {
      const token = crypto.randomUUID();
      sessionStorage.setItem('csrf_token', token);
      return token;
    }

    validateCSRFToken(token) {
      return token === sessionStorage.getItem('csrf_token');
    }

    // Log security events
    async logSecurityEvent(type, details) {
      try {
        await fetch('/api/admin/security-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, details, timestamp: Date.now() })
        });
      } catch (err) {
        console.error('Failed to log security event:', err);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // ADMIN UI ENHANCEMENTS
  // ══════════════════════════════════════════════════════════

  class AdminUI {
    // Confirm dangerous actions
    async confirmAction(message, type = 'danger') {
      return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
          <div class="confirm-modal-content ${type}">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Confirm Action</h4>
            <p>${message}</p>
            <div class="confirm-modal-actions">
              <button class="btn-cancel">Cancel</button>
              <button class="btn-confirm">Confirm</button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.btn-cancel').onclick = () => {
          modal.remove();
          resolve(false);
        };

        modal.querySelector('.btn-confirm').onclick = () => {
          modal.remove();
          resolve(true);
        };
      });
    }

    // Show toast notification
    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `admin-toast ${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => toast.classList.add('show'), 100);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    // Loading spinner
    showLoading(message = 'Loading...') {
      const spinner = document.createElement('div');
      spinner.id = 'admin-loading';
      spinner.innerHTML = `
        <div class="admin-loading-content">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      `;
      document.body.appendChild(spinner);
    }

    hideLoading() {
      document.getElementById('admin-loading')?.remove();
    }
  }

  // ══════════════════════════════════════════════════════════
  // INITIALIZE
  // ══════════════════════════════════════════════════════════

  window.SuperAdminAPI = new SuperAdminAPI();
  window.SecurityFeatures = new SecurityFeatures();
  window.AdminUI = new AdminUI();

  // Auto-initialize security features
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.SecurityFeatures.initSessionTimeout();
      window.SecurityFeatures.detectSuspiciousActivity();
    });
  } else {
    window.SecurityFeatures.initSessionTimeout();
    window.SecurityFeatures.detectSuspiciousActivity();
  }

  console.log('🔒 Super Admin Security Enhanced - Loaded');
})();
