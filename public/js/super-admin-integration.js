/**
 * Super Admin Security Integration
 * Connect existing super-admin.html with enhanced security
 *
 * Add to super-admin.html:
 * <script src="/js/super-admin-enhanced.js"></script>
 * <link rel="stylesheet" href="/css/super-admin-security.css">
 */

// ══════════════════════════════════════════════════════════
// INTEGRATE WITH EXISTING SUPER ADMIN
// ══════════════════════════════════════════════════════════

(function() {
  'use strict';

  // Wait for DOM and SuperAdminAPI to be ready
  function init() {
    if (!window.SuperAdminAPI) {
      setTimeout(init, 100);
      return;
    }

    console.log('🔐 Integrating Super Admin Security...');

    // Add security badge
    addSecurityBadge();

    // Enhance existing functions
    enhanceUserManagement();
    enhancePostManagement();
    enhanceProductManagement();

    // Add audit log viewer
    addAuditLogViewer();

    console.log('✅ Super Admin Security Integration Complete');
  }

  // ── Security Badge ──
  function addSecurityBadge() {
    const badge = document.createElement('div');
    badge.className = 'security-badge';
    badge.innerHTML = '<i class="fas fa-shield-alt"></i> Security Active';
    document.body.appendChild(badge);
  }

  // ── Enhance User Management ──
  function enhanceUserManagement() {
    // Override existing deleteUser function
    const originalDeleteUser = window.deleteUser;
    window.deleteUser = async function(userId) {
      const confirmed = await window.AdminUI.confirmAction(
        'Are you sure you want to delete this user? This action cannot be undone.',
        'danger'
      );

      if (!confirmed) return;

      try {
        window.AdminUI.showLoading('Deleting user...');
        await window.SuperAdminAPI.deleteUser(userId);
        window.AdminUI.hideLoading();
        window.AdminUI.showToast('User deleted successfully', 'success');

        // Reload list
        if (typeof loadLineUsers === 'function') {
          loadLineUsers();
        }
      } catch (err) {
        window.AdminUI.hideLoading();
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };

    // Add promote to admin function
    window.promoteToAdmin = async function(userId) {
      const confirmed = await window.AdminUI.confirmAction(
        'Promote this user to Admin? They will have elevated privileges.',
        'warning'
      );

      if (!confirmed) return;

      try {
        window.AdminUI.showLoading('Updating user role...');
        await window.SuperAdminAPI.updateUser(userId, { role: 'admin' });
        window.AdminUI.hideLoading();
        window.AdminUI.showToast('User promoted to Admin', 'success');

        if (typeof loadLineUsers === 'function') {
          loadLineUsers();
        }
      } catch (err) {
        window.AdminUI.hideLoading();
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };

    // Add ban user function
    window.banUser = async function(userId) {
      const confirmed = await window.AdminUI.confirmAction(
        'Ban this user? They will no longer be able to access the platform.',
        'danger'
      );

      if (!confirmed) return;

      try {
        window.AdminUI.showLoading('Banning user...');
        await window.SuperAdminAPI.updateUser(userId, { role: 'banned' });
        window.AdminUI.hideLoading();
        window.AdminUI.showToast('User banned', 'success');

        if (typeof loadLineUsers === 'function') {
          loadLineUsers();
        }
      } catch (err) {
        window.AdminUI.hideLoading();
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };
  }

  // ── Enhance Post Management ──
  function enhancePostManagement() {
    // Override existing deletePost function
    const originalDeletePost = window.deletePost;
    window.deletePost = async function(postId) {
      const confirmed = await window.AdminUI.confirmAction(
        'Delete this post? This action cannot be undone.',
        'danger'
      );

      if (!confirmed) return;

      try {
        window.AdminUI.showLoading('Deleting post...');
        await window.SuperAdminAPI.deletePost(postId);
        window.AdminUI.hideLoading();
        window.AdminUI.showToast('Post deleted successfully', 'success');

        if (typeof loadCommunityPosts === 'function') {
          loadCommunityPosts();
        }
      } catch (err) {
        window.AdminUI.hideLoading();
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };

    // Add approve/reject functions
    window.approvePost = async function(postId) {
      try {
        await window.SuperAdminAPI.moderatePost(postId, 'active');
        window.AdminUI.showToast('Post approved', 'success');

        if (typeof loadCommunityPosts === 'function') {
          loadCommunityPosts();
        }
      } catch (err) {
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };

    window.rejectPost = async function(postId) {
      try {
        await window.SuperAdminAPI.moderatePost(postId, 'hidden');
        window.AdminUI.showToast('Post hidden', 'warning');

        if (typeof loadCommunityPosts === 'function') {
          loadCommunityPosts();
        }
      } catch (err) {
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };
  }

  // ── Enhance Product Management ──
  function enhanceProductManagement() {
    window.deleteProduct = async function(productId) {
      const confirmed = await window.AdminUI.confirmAction(
        'Delete this product? This action cannot be undone.',
        'danger'
      );

      if (!confirmed) return;

      try {
        window.AdminUI.showLoading('Deleting product...');
        await window.SuperAdminAPI.deleteProduct(productId);
        window.AdminUI.hideLoading();
        window.AdminUI.showToast('Product deleted successfully', 'success');

        if (typeof loadProducts === 'function') {
          loadProducts();
        }
      } catch (err) {
        window.AdminUI.hideLoading();
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };

    window.approveProduct = async function(productId) {
      try {
        await window.SuperAdminAPI.updateProduct(productId, { status: 'active' });
        window.AdminUI.showToast('Product approved', 'success');

        if (typeof loadProducts === 'function') {
          loadProducts();
        }
      } catch (err) {
        window.AdminUI.showToast(`Error: ${err.message}`, 'error');
      }
    };
  }

  // ── Audit Log Viewer ──
  function addAuditLogViewer() {
    // Add navigation item (if sidebar exists)
    const sidebar = document.querySelector('.sidebar nav');
    if (sidebar) {
      const logsLink = document.createElement('a');
      logsLink.href = '#';
      logsLink.innerHTML = '<i class="fas fa-clipboard-list"></i> Audit Logs';
      logsLink.onclick = (e) => {
        e.preventDefault();
        showAuditLogs();
      };
      sidebar.appendChild(logsLink);
    }
  }

  async function showAuditLogs() {
    const mainContent = document.getElementById('mainContent') || document.querySelector('main');
    if (!mainContent) return;

    try {
      window.AdminUI.showLoading('Loading audit logs...');
      const data = await window.SuperAdminAPI.getLogs({ limit: 100 });
      window.AdminUI.hideLoading();

      const logs = data.logs || [];

      mainContent.innerHTML = `
        <div class="admin-section">
          <h2><i class="fas fa-clipboard-list"></i> Audit Logs</h2>
          <p>Track all administrative actions</p>

          <table class="audit-log-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Result</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr>
                  <td>${new Date(log.timestamp).toLocaleString('th-TH')}</td>
                  <td>${log.admin_id}</td>
                  <td>${log.action}</td>
                  <td>${log.target || '-'}</td>
                  <td><span class="audit-log-action ${log.result.toLowerCase()}">${log.result}</span></td>
                  <td>${log.ip || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${logs.length === 0 ? '<p style="text-align:center; padding:40px; color:#6b7280;">No audit logs found</p>' : ''}
        </div>
      `;
    } catch (err) {
      window.AdminUI.hideLoading();
      window.AdminUI.showToast(`Error loading logs: ${err.message}`, 'error');
    }
  }

  // ── Initialize ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
