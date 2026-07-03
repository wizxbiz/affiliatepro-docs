/**
 * 🔗 WiT AI Calculator Integrations
 * เชื่อมต่อกับ LINE Bot, Firebase, Marketplace, Vision AI
 */

// Wrap everything in IIFE to avoid global scope pollution
(function() {
'use strict';

// =====================================================
// 🔧 CONFIGURATION
// =====================================================

const CONFIG = {
  FIREBASE_API_URL: 'https://linewebhook-47mhcx3iqq-uc.a.run.app',
  LINE_LIFF_ID: 'YOUR_LIFF_ID', // Replace with actual LIFF ID
  MARKETPLACE_API: 'https://marketplacegetproducts-47mhcx3iqq-uc.a.run.app',
  VISION_AI_ENDPOINT: '/vision-analysis',
};

// =====================================================
// 👤 USER MANAGEMENT (LINE LIFF)
// =====================================================

class UserManager {
  constructor() {
    this.userId = null;
    this.profile = null;
    this.trialCount = 15;
    this.isPremium = false;
  }

  /**
   * Initialize LIFF and get user profile
   */
  async initialize() {
    try {
      // Check if running in LINE
      const urlParams = new URLSearchParams(window.location.search);
      this.userId = urlParams.get('userId') || localStorage.getItem('userId');

      if (this.userId) {
        await this.loadUserData();
      } else {
        // Use local trial mode
        this.loadLocalTrialData();
      }

      return true;
    } catch (error) {
      console.error('User initialization error:', error);
      this.loadLocalTrialData();
      return false;
    }
  }

  /**
   * Load user data from Firebase
   */
  async loadUserData() {
    try {
      const response = await fetch(`${CONFIG.FIREBASE_API_URL}/getUserData`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId: this.userId}),
      });

      const data = await response.json();

      if (data.success) {
        this.profile = data.user;
        this.trialCount = data.user.trialRemaining || 0;
        this.isPremium = data.user.isPremium || false;

        localStorage.setItem('userId', this.userId);
        localStorage.setItem('userProfile', JSON.stringify(this.profile));
      }
    } catch (error) {
      console.error('Load user data error:', error);
      this.loadLocalTrialData();
    }
  }

  /**
   * Load local trial data (offline mode)
   */
  loadLocalTrialData() {
    const stored = localStorage.getItem('localTrialCount');
    this.trialCount = stored ? parseInt(stored) : 15;
    this.userId = 'local_' + Date.now();
  }

  /**
   * Use trial credit
   */
  async useTrial() {
    if (this.isPremium) {
      return {success: true, unlimited: true};
    }

    if (this.trialCount <= 0) {
      return {
        success: false,
        message: 'ใช้งานครบ 15 ครั้งแล้ว กรุณาติดต่อ LINE OA',
      };
    }

    this.trialCount--;

    // Save to local
    localStorage.setItem('localTrialCount', this.trialCount);

    // Sync to server
    if (this.userId && !this.userId.startsWith('local_')) {
      try {
        await fetch(`${CONFIG.FIREBASE_API_URL}/useTrialCredit`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({userId: this.userId}),
        });
      } catch (error) {
        console.error('Sync trial error:', error);
      }
    }

    return {success: true, remaining: this.trialCount};
  }

  /**
   * Get trial status
   */
  getTrialStatus() {
    return {
      isPremium: this.isPremium,
      trialCount: this.trialCount,
      userId: this.userId,
    };
  }
}

// =====================================================
// 💾 FIREBASE SYNC MANAGER
// =====================================================

class FirebaseSync {
  /**
   * Save calculation history to Firestore
   * Falls back to localStorage if API fails
   */
  static async saveCalculation(userId, calcData) {
    // Always save to localStorage first
    this.saveToLocalStorage(calcData);
    
    // Try to sync with Firebase (non-blocking)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(`${CONFIG.FIREBASE_API_URL}/saveCalculation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userId,
          type: calcData.type,
          result: calcData.result,
          input: calcData.input,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (error) {
      // Silently fail - data is already saved locally
      console.log('Firebase sync skipped (offline or CORS):', error.message);
      return false;
    }
  }
  
  /**
   * Save to localStorage as backup
   */
  static saveToLocalStorage(calcData) {
    try {
      const history = JSON.parse(localStorage.getItem('calcHistory') || '[]');
      history.unshift({
        ...calcData,
        timestamp: new Date().toISOString()
      });
      // Keep only last 100 calculations
      if (history.length > 100) history.length = 100;
      localStorage.setItem('calcHistory', JSON.stringify(history));
    } catch (e) {
      console.log('LocalStorage save error:', e);
    }
  }

  /**
   * Load calculation history from Firestore
   */
  static async loadHistory(userId, limit = 50) {
    try {
      const response = await fetch(`${CONFIG.FIREBASE_API_URL}/getCalculationHistory`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, limit}),
      });

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Load history error:', error);
      return [];
    }
  }

  /**
   * Real-time sync with local storage
   * Note: saveCalculation already handles localStorage, this is for backwards compatibility
   */
  static syncWithLocal(calcData) {
    // Already handled in saveCalculation - just return current history
    return JSON.parse(localStorage.getItem('calcHistory')) || [];
  }
}

// =====================================================
// 🛒 MARKETPLACE INTEGRATION
// =====================================================

class MarketplaceIntegration {
  /**
   * Get recommended products based on calculation
   */
  static async getRecommendedProducts(calcType, result) {
    try {
      // Map calculation type to product tags
      const tagMapping = {
        clamp: ['machine', 'mold'],
        temp: ['heater', 'temperature-controller'],
        shot: ['material', 'resin'],
        vision: ['inspection', 'camera'],
      };

      const tags = tagMapping[calcType] || [];

      const response = await fetch(`${CONFIG.MARKETPLACE_API}?tags=${tags.join(',')}&limit=5`);

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Get products error:', error);
      return [];
    }
  }

  /**
   * Display recommended products in UI
   */
  static displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container || products.length === 0) return;

    const html = `
      <div class="marketplace-section">
        <h5><i class="fas fa-shopping-cart"></i> สินค้าแนะนำที่เกี่ยวข้อง</h5>
        <div class="product-grid">
          ${products.map((product) => `
            <div class="product-card" onclick="window.open('product.html?id=${product.id}', '_blank')">
              <img src="${product.imageUrl || 'images/placeholder.png'}" alt="${product.title}">
              <div class="product-title">${product.title}</div>
              <div class="product-price">฿${product.price.toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}

// =====================================================
// 📸 VISION AI INTEGRATION
// =====================================================

class VisionAI {
  /**
   * Analyze defect from uploaded image
   */
  static async analyzeDefect(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${CONFIG.FIREBASE_API_URL}${CONFIG.VISION_AI_ENDPOINT}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      return {
        success: true,
        defectType: data.defectType,
        confidence: data.confidence,
        recommendations: data.recommendations,
        imageTags: data.tags,
      };
    } catch (error) {
      console.error('Vision AI error:', error);
      return {
        success: false,
        error: 'ไม่สามารถวิเคราะห์ภาพได้',
      };
    }
  }

  /**
   * Convert image to base64
   */
  static async imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Display vision results
   */
  static displayResults(results, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!results.success) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i> ${results.error}
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="vision-results">
        <h5><i class="fas fa-eye"></i> ผลการวิเคราะห์ด้วย Vision AI</h5>

        <div class="result-card">
          <div class="defect-type">
            <strong>ประเภทปัญหา:</strong> ${results.defectType}
          </div>
          <div class="confidence">
            <strong>ความมั่นใจ:</strong> ${(results.confidence * 100).toFixed(1)}%
          </div>
        </div>

        <div class="recommendations">
          <h6>💡 คำแนะนำการแก้ไข:</h6>
          <ul>
            ${results.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
          </ul>
        </div>

        <div class="tags">
          ${results.imageTags.map((tag) => `<span class="badge bg-secondary">${tag}</span>`).join(' ')}
        </div>
      </div>
    `;
  }
}

// =====================================================
// 📊 REAL-TIME SYNC
// =====================================================

class RealtimeSync {
  /**
   * Send calculation to LINE Bot
   */
  static async sendToLineBot(userId, calcData) {
    try {
      await fetch(`${CONFIG.FIREBASE_API_URL}/sendCalculationToLine`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId,
          calcType: calcData.type,
          result: calcData.result,
        }),
      });

      return true;
    } catch (error) {
      console.error('Send to LINE error:', error);
      return false;
    }
  }

  /**
   * Share result via LINE
   */
  static shareToLine(message, url) {
    if (typeof liff !== 'undefined') {
      liff.shareTargetPicker([
        {
          type: 'text',
          text: `${message}\n\n${url}`,
        },
      ]);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${message}\n\n${url}`);
      alert('คัดลอก Link แล้ว');
    }
  }

  /**
   * Export to PDF
   */
  static async exportToPDF(calcData) {
    try {
      const response = await fetch(`${CONFIG.FIREBASE_API_URL}/generatePDF`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(calcData),
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `calculation_${Date.now()}.pdf`;
      a.click();

      return true;
    } catch (error) {
      console.error('Export PDF error:', error);
      return false;
    }
  }
}

// =====================================================
// 🎨 UI HELPERS
// =====================================================

class UIHelpers {
  /**
   * Show toast notification
   */
  static showToast(message, type = 'success') {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const iconColor = type === 'success' ? 'var(--color-success)' : 'var(--color-danger)';

    toast.innerHTML = `
      <i class="fas ${icon} toast-icon" style="color: ${iconColor}"></i>
      <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Show loading overlay
   */
  static showLoading(show = true) {
    let overlay = document.getElementById('loading-overlay');

    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        `;
        overlay.innerHTML = '<div class="loading"></div>';
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'flex';
    } else {
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }

  /**
   * Update trial badge
   */
  static updateTrialBadge(count, isPremium = false) {
    const badge = document.getElementById('trial-badge');
    if (!badge) return;

    if (isPremium) {
      badge.className = 'trial-badge premium';
      badge.innerHTML = '<i class="fas fa-crown"></i> Premium';
    } else if (count <= 0) {
      badge.className = 'trial-badge exhausted';
      badge.innerHTML = '<i class="fas fa-ban"></i> ใช้งานครบแล้ว';
    } else if (count <= 5) {
      badge.className = 'trial-badge premium';
      badge.innerHTML = `<i class="fas fa-fire"></i> ${count} ครั้งเหลือ`;
    } else {
      badge.className = 'trial-badge';
      badge.innerHTML = `<i class="fas fa-fire"></i> ${count} ครั้งฟรี`;
    }
  }
}

// =====================================================
// EXPORT ALL INTEGRATIONS
// =====================================================

window.Integrations = {
  UserManager,
  FirebaseSync,
  MarketplaceIntegration,
  VisionAI,
  RealtimeSync,
  UIHelpers,
  CONFIG,
};

})(); // End of IIFE
