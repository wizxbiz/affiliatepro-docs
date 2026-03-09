/**
 * Cookie Consent - Minimal & Non-intrusive
 * PDPA & GDPR Compliant
 * Wizmobiz © 2026
 */

(function () {
    'use strict';

    const COOKIE_NAME = 'wizmobiz_consent';
    const COOKIE_EXPIRY = 365; // days

    // Check if consent already given
    function hasConsent() {
        return localStorage.getItem(COOKIE_NAME) !== null;
    }

    // Get consent status
    function getConsent() {
        const consent = localStorage.getItem(COOKIE_NAME);
        return consent ? JSON.parse(consent) : null;
    }

    // Save consent
    function saveConsent(analytics, marketing) {
        const consent = {
            analytics: analytics,
            marketing: marketing,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem(COOKIE_NAME, JSON.stringify(consent));

        // Apply consent settings
        applyConsent(consent);
    }

    // Apply consent settings
    function applyConsent(consent) {
        if (consent.analytics) {
            // Enable Analytics
            window['ga-disable-G-PK2GQ4HERC'] = false;
            console.log('📊 Analytics enabled');
        } else {
            // Disable Analytics
            window['ga-disable-G-PK2GQ4HERC'] = true;
            console.log('📊 Analytics disabled');
        }

        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('consentUpdated', { detail: consent }));
    }

    // Create cookie banner
    function createBanner() {
        // Don't show if consent already given
        if (hasConsent()) {
            const consent = getConsent();
            applyConsent(consent);
            return;
        }

        // Create banner element
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-icon">🍪</div>
                <div class="cookie-text">
                    <span class="cookie-title">เราใช้คุกกี้</span>
                    <span class="cookie-desc">เพื่อพัฒนาประสบการณ์การใช้งานของคุณ</span>
                </div>
                <div class="cookie-actions">
                    <button class="cookie-btn cookie-btn-settings" id="cookieSettings">ตั้งค่า</button>
                    <button class="cookie-btn cookie-btn-accept" id="cookieAccept">ยอมรับ</button>
                </div>
            </div>
        `;

        // Create settings modal
        const modal = document.createElement('div');
        modal.id = 'cookie-settings-modal';
        modal.innerHTML = `
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h3>🍪 ตั้งค่าคุกกี้</h3>
                    <button class="cookie-modal-close" id="cookieModalClose">&times;</button>
                </div>
                <div class="cookie-modal-body">
                    <p style="color: #666; margin-bottom: 20px; font-size: 0.95rem;">
                        เราใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งาน วิเคราะห์การเข้าชม และปรับปรุงบริการให้ดีขึ้น
                    </p>
                    
                    <div class="cookie-option">
                        <div class="cookie-option-info">
                            <strong>คุกกี้ที่จำเป็น</strong>
                            <span>จำเป็นสำหรับการทำงานของเว็บไซต์</span>
                        </div>
                        <label class="cookie-toggle disabled">
                            <input type="checkbox" checked disabled>
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                    
                    <div class="cookie-option">
                        <div class="cookie-option-info">
                            <strong>คุกกี้วิเคราะห์</strong>
                            <span>ช่วยให้เราเข้าใจการใช้งานเว็บไซต์</span>
                        </div>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="analyticsConsent" checked>
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                    
                    <div class="cookie-option">
                        <div class="cookie-option-info">
                            <strong>คุกกี้การตลาด</strong>
                            <span>แสดงโฆษณาที่เกี่ยวข้องกับคุณ</span>
                        </div>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="marketingConsent">
                            <span class="cookie-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button class="cookie-btn cookie-btn-secondary" id="cookieRejectAll">ปฏิเสธทั้งหมด</button>
                    <button class="cookie-btn cookie-btn-accept" id="cookieSaveSettings">บันทึกการตั้งค่า</button>
                </div>
                <div class="cookie-policy-link">
                    <a href="/privacy.html" target="_blank">นโยบายความเป็นส่วนตัว</a>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #cookie-consent-banner {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                max-width: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                z-index: 2000001; /* Higher than bottom-nav */
                font-family: 'Kanit', sans-serif;
                animation: slideUp 0.4s ease;
                border: 1px solid #e5e7eb;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .cookie-content {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 16px 20px;
            }
            
            .cookie-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            
            .cookie-text {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .cookie-title {
                font-weight: 600;
                font-size: 1rem;
                color: #1a1a2e;
            }
            
            .cookie-desc {
                font-size: 0.85rem;
                color: #666;
            }
            
            .cookie-actions {
                display: flex;
                gap: 10px;
                flex-shrink: 0;
            }
            
            .cookie-btn {
                padding: 10px 20px;
                border-radius: 25px;
                font-family: inherit;
                font-weight: 600;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
            }
            
            .cookie-btn-settings {
                background: #f3f4f6;
                color: #374151;
            }
            
            .cookie-btn-settings:hover {
                background: #e5e7eb;
            }
            
            .cookie-btn-accept {
                background: linear-gradient(135deg, #00B900, #06C755);
                color: white;
            }
            
            .cookie-btn-accept:hover {
                transform: scale(1.02);
                box-shadow: 0 5px 15px rgba(0, 185, 0, 0.3);
            }
            
            .cookie-btn-secondary {
                background: transparent;
                color: #666;
                border: 1px solid #ddd;
            }
            
            .cookie-btn-secondary:hover {
                background: #f9fafb;
            }
            
            /* Settings Modal */
            #cookie-settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 2000002;
                display: none;
                align-items: center;
                justify-content: center;
                font-family: 'Kanit', sans-serif;
            }
            
            #cookie-settings-modal.show {
                display: flex;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .cookie-modal-content {
                background: white;
                border-radius: 20px;
                max-width: 450px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: scaleIn 0.3s ease;
            }
            
            @keyframes scaleIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            
            .cookie-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .cookie-modal-header h3 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 700;
                color: #1a1a2e;
            }
            
            .cookie-modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #666;
                line-height: 1;
            }
            
            .cookie-modal-body {
                padding: 25px;
            }
            
            .cookie-option {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-bottom: 1px solid #f3f4f6;
            }
            
            .cookie-option:last-child {
                border-bottom: none;
            }
            
            .cookie-option-info {
                display: flex;
                flex-direction: column;
            }
            
            .cookie-option-info strong {
                font-weight: 600;
                color: #1a1a2e;
                font-size: 0.95rem;
            }
            
            .cookie-option-info span {
                font-size: 0.8rem;
                color: #888;
                margin-top: 2px;
            }
            
            /* Toggle Switch */
            .cookie-toggle {
                position: relative;
                width: 50px;
                height: 26px;
                flex-shrink: 0;
            }
            
            .cookie-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .cookie-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: 0.3s;
                border-radius: 26px;
            }
            
            .cookie-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
            }
            
            .cookie-toggle input:checked + .cookie-slider {
                background: linear-gradient(135deg, #00B900, #06C755);
            }
            
            .cookie-toggle input:checked + .cookie-slider:before {
                transform: translateX(24px);
            }
            
            .cookie-toggle.disabled .cookie-slider {
                cursor: not-allowed;
                opacity: 0.7;
            }
            
            .cookie-modal-footer {
                display: flex;
                gap: 10px;
                padding: 20px 25px;
                border-top: 1px solid #e5e7eb;
                justify-content: flex-end;
            }
            
            .cookie-policy-link {
                text-align: center;
                padding: 0 25px 20px;
            }
            
            .cookie-policy-link a {
                color: #667eea;
                font-size: 0.85rem;
                text-decoration: none;
            }
            
            .cookie-policy-link a:hover {
                text-decoration: underline;
            }
            
            /* Mobile responsive - Aggressive Fix */
            @media (max-width: 768px) {
                #cookie-consent-banner {
                    top: 0 !important;
                    bottom: auto !important;
                    left: 0 !important;
                    right: 0 !important;
                    max-width: 100% !important;
                    border-radius: 0 0 24px 24px !important;
                    z-index: 9999999 !important; 
                    animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
                    padding: env(safe-area-inset-top, 10px) 0 5px 0 !important;
                }
                
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .cookie-content {
                    flex-direction: column !important;
                    padding: 15px 20px !important;
                    gap: 10px !important;
                }
                
                .cookie-icon {
                    font-size: 1.5rem !important;
                }
                
                .cookie-text {
                    text-align: center !important;
                }
                
                .cookie-actions {
                    width: 100% !important;
                    gap: 8px !important;
                }
                
                .cookie-btn {
                    flex: 1 !important;
                    padding: 10px !important;
                    font-size: 0.8rem !important;
                }
            }
        `;

        // Append to document
        document.head.appendChild(styles);
        document.body.appendChild(banner);
        document.body.appendChild(modal);

        // Event Listeners
        document.getElementById('cookieAccept').addEventListener('click', function () {
            saveConsent(true, true);
            hideBanner();
        });

        document.getElementById('cookieSettings').addEventListener('click', function () {
            document.getElementById('cookie-settings-modal').classList.add('show');
        });

        document.getElementById('cookieModalClose').addEventListener('click', function () {
            document.getElementById('cookie-settings-modal').classList.remove('show');
        });

        document.getElementById('cookieRejectAll').addEventListener('click', function () {
            saveConsent(false, false);
            hideBanner();
            document.getElementById('cookie-settings-modal').classList.remove('show');
        });

        document.getElementById('cookieSaveSettings').addEventListener('click', function () {
            const analytics = document.getElementById('analyticsConsent').checked;
            const marketing = document.getElementById('marketingConsent').checked;
            saveConsent(analytics, marketing);
            hideBanner();
            document.getElementById('cookie-settings-modal').classList.remove('show');
        });

        // Close modal on outside click
        document.getElementById('cookie-settings-modal').addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    }

    // Hide banner with animation
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => banner.remove(), 300);
        }
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
    } else {
        // Small delay for better UX
        setTimeout(createBanner, 1000);
    }

    // Export functions for external use
    window.CookieConsent = {
        hasConsent: hasConsent,
        getConsent: getConsent,
        showSettings: function () {
            const modal = document.getElementById('cookie-settings-modal');
            if (modal) modal.classList.add('show');
        },
        revokeConsent: function () {
            localStorage.removeItem(COOKIE_NAME);
            location.reload();
        }
    };

})();
