/**
 * 🎨 WiT Loading Skeleton & UX Utilities
 * @version 1.0.0
 */

(function() {
    'use strict';

    // =====================================================
    // 📌 LOADING SKELETON
    // =====================================================
    
    const WitSkeleton = {
        /**
         * Create skeleton loading element
         * @param {string} type - 'text', 'card', 'image', 'avatar', 'button'
         * @param {object} options - width, height, count
         */
        create: function(type = 'text', options = {}) {
            const { width = '100%', height = '20px', count = 1, className = '' } = options;
            
            const skeletons = [];
            for (let i = 0; i < count; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = `wit-skeleton wit-skeleton-${type} ${className}`;
                
                switch (type) {
                    case 'text':
                        skeleton.style.width = width;
                        skeleton.style.height = height;
                        break;
                    case 'card':
                        skeleton.innerHTML = `
                            <div class="wit-skeleton-image"></div>
                            <div class="wit-skeleton-content">
                                <div class="wit-skeleton-line" style="width: 80%"></div>
                                <div class="wit-skeleton-line" style="width: 60%"></div>
                                <div class="wit-skeleton-line" style="width: 40%"></div>
                            </div>
                        `;
                        break;
                    case 'image':
                        skeleton.style.width = width;
                        skeleton.style.height = height;
                        skeleton.style.borderRadius = '12px';
                        break;
                    case 'avatar':
                        skeleton.style.width = options.size || '50px';
                        skeleton.style.height = options.size || '50px';
                        skeleton.style.borderRadius = '50%';
                        break;
                    case 'button':
                        skeleton.style.width = width;
                        skeleton.style.height = '40px';
                        skeleton.style.borderRadius = '8px';
                        break;
                    case 'product':
                        skeleton.innerHTML = `
                            <div class="wit-skeleton-product-image"></div>
                            <div class="wit-skeleton-product-content">
                                <div class="wit-skeleton-line" style="width: 70%; height: 16px;"></div>
                                <div class="wit-skeleton-line" style="width: 40%; height: 20px;"></div>
                                <div class="wit-skeleton-line" style="width: 50%; height: 14px;"></div>
                            </div>
                        `;
                        break;
                }
                
                skeletons.push(skeleton);
            }
            
            return count === 1 ? skeletons[0] : skeletons;
        },
        
        /**
         * Show skeleton in container
         */
        show: function(container, type, options = {}) {
            if (typeof container === 'string') {
                container = document.querySelector(container);
            }
            if (!container) return;
            
            container.innerHTML = '';
            const skeletons = this.create(type, options);
            
            if (Array.isArray(skeletons)) {
                skeletons.forEach(s => container.appendChild(s));
            } else {
                container.appendChild(skeletons);
            }
        },
        
        /**
         * Hide skeleton
         */
        hide: function(container) {
            if (typeof container === 'string') {
                container = document.querySelector(container);
            }
            if (!container) return;
            
            const skeletons = container.querySelectorAll('.wit-skeleton');
            skeletons.forEach(s => s.remove());
        }
    };

    // =====================================================
    // 📌 LAZY LOADING IMAGES
    // =====================================================
    
    const WitLazyLoad = {
        observer: null,
        
        init: function() {
            if (!('IntersectionObserver' in window)) {
                // Fallback for old browsers
                this.loadAllImages();
                return;
            }
            
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            // Observe all lazy images
            document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => {
                if (img.dataset.src) {
                    this.observer.observe(img);
                }
            });
        },
        
        loadImage: function(img) {
            const src = img.dataset.src;
            if (!src) return;
            
            // Add loading class
            img.classList.add('wit-img-loading');
            
            // Create temp image to preload
            const tempImg = new Image();
            tempImg.onload = () => {
                img.src = src;
                img.classList.remove('wit-img-loading');
                img.classList.add('wit-img-loaded');
                img.removeAttribute('data-src');
            };
            tempImg.onerror = () => {
                img.classList.remove('wit-img-loading');
                img.classList.add('wit-img-error');
                // Set placeholder
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';
            };
            tempImg.src = src;
        },
        
        loadAllImages: function() {
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.loadImage(img);
            });
        }
    };

    // =====================================================
    // 📌 TOAST NOTIFICATIONS
    // =====================================================
    
    const WitToast = {
        container: null,
        
        init: function() {
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'wit-toast-container';
                document.body.appendChild(this.container);
            }
        },
        
        show: function(message, type = 'info', duration = 3000) {
            this.init();
            
            const toast = document.createElement('div');
            toast.className = `wit-toast wit-toast-${type}`;
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            toast.innerHTML = `
                <span class="wit-toast-icon">${icons[type] || icons.info}</span>
                <span class="wit-toast-message">${message}</span>
                <button class="wit-toast-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            this.container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => toast.classList.add('wit-toast-show'), 10);
            
            // Auto remove
            if (duration > 0) {
                setTimeout(() => {
                    toast.classList.remove('wit-toast-show');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }
            
            return toast;
        },
        
        success: function(message, duration) {
            return this.show(message, 'success', duration);
        },
        
        error: function(message, duration) {
            return this.show(message, 'error', duration);
        },
        
        warning: function(message, duration) {
            return this.show(message, 'warning', duration);
        },
        
        info: function(message, duration) {
            return this.show(message, 'info', duration);
        }
    };

    // =====================================================
    // 📌 PAGE LOADING INDICATOR
    // =====================================================
    
    const WitPageLoader = {
        element: null,
        
        show: function(message = 'กำลังโหลด...') {
            if (!this.element) {
                this.element = document.createElement('div');
                this.element.className = 'wit-page-loader';
                this.element.innerHTML = `
                    <div class="wit-page-loader-content">
                        <div class="wit-page-loader-spinner"></div>
                        <p class="wit-page-loader-message">${message}</p>
                    </div>
                `;
                document.body.appendChild(this.element);
            } else {
                this.element.querySelector('.wit-page-loader-message').textContent = message;
                this.element.style.display = 'flex';
            }
        },
        
        hide: function() {
            if (this.element) {
                this.element.style.display = 'none';
            }
        },
        
        updateMessage: function(message) {
            if (this.element) {
                this.element.querySelector('.wit-page-loader-message').textContent = message;
            }
        }
    };

    // =====================================================
    // 📌 INJECT CSS
    // =====================================================
    
    const injectStyles = function() {
        const styles = `
            /* Skeleton Loading */
            .wit-skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: wit-skeleton-loading 1.5s infinite;
                border-radius: 4px;
            }
            
            @keyframes wit-skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .wit-skeleton-card {
                padding: 15px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }
            
            .wit-skeleton-image {
                width: 100%;
                height: 150px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: wit-skeleton-loading 1.5s infinite;
                border-radius: 8px;
                margin-bottom: 15px;
            }
            
            .wit-skeleton-line {
                height: 12px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: wit-skeleton-loading 1.5s infinite;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .wit-skeleton-product {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }
            
            .wit-skeleton-product-image {
                width: 100%;
                height: 180px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: wit-skeleton-loading 1.5s infinite;
            }
            
            .wit-skeleton-product-content {
                padding: 15px;
            }
            
            /* Lazy Load Images */
            .wit-img-loading {
                opacity: 0.5;
                filter: blur(5px);
                transition: all 0.3s;
            }
            
            .wit-img-loaded {
                opacity: 1;
                filter: blur(0);
            }
            
            .wit-img-error {
                opacity: 0.7;
            }
            
            /* Toast Notifications */
            .wit-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            }
            
            .wit-toast {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 15px 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                transform: translateX(120%);
                transition: transform 0.3s ease;
            }
            
            .wit-toast-show {
                transform: translateX(0);
            }
            
            .wit-toast-success { border-left: 4px solid #22c55e; }
            .wit-toast-error { border-left: 4px solid #ef4444; }
            .wit-toast-warning { border-left: 4px solid #f59e0b; }
            .wit-toast-info { border-left: 4px solid #3b82f6; }
            
            .wit-toast-icon { font-size: 1.2rem; }
            .wit-toast-message { flex: 1; font-size: 0.95rem; color: #333; }
            .wit-toast-close {
                background: none;
                border: none;
                font-size: 1.3rem;
                color: #999;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .wit-toast-close:hover { color: #333; }
            
            /* Page Loader */
            .wit-page-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }
            
            .wit-page-loader-content {
                text-align: center;
            }
            
            .wit-page-loader-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f0f0f0;
                border-top-color: #667eea;
                border-radius: 50%;
                animation: wit-spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes wit-spin {
                to { transform: rotate(360deg); }
            }
            
            .wit-page-loader-message {
                color: #666;
                font-size: 1rem;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .wit-skeleton {
                    background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
                }
                
                .wit-toast {
                    background: #2d2d2d;
                }
                
                .wit-toast-message {
                    color: #eee;
                }
                
                .wit-page-loader {
                    background: rgba(30,30,30,0.95);
                }
                
                .wit-page-loader-message {
                    color: #ccc;
                }
            }
            
            /* Mobile responsive */
            @media (max-width: 576px) {
                .wit-toast-container {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    };

    // =====================================================
    // 📌 INIT
    // =====================================================
    
    // Inject styles on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles);
    } else {
        injectStyles();
    }
    
    // Init lazy loading
    document.addEventListener('DOMContentLoaded', () => {
        WitLazyLoad.init();
    });

    // Export to global
    window.WitSkeleton = WitSkeleton;
    window.WitLazyLoad = WitLazyLoad;
    window.WitToast = WitToast;
    window.WitPageLoader = WitPageLoader;

})();
