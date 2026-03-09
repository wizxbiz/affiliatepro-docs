/* 🛡️ WizmobizAuth V1.0.6 - Unified Marketplace Authentication */
console.log('🛡️ WizmobizAuth [V1.0.6] loaded.');

var WizmobizAuth = {
    // Session storage key
    SESSION_KEY: 'wizmobiz_session',

    // Check if user is logged in
    isLoggedIn() {
        const session = this.getSession();
        if (!session) return false;

        const loginAt = new Date(session.loginAt);
        const daysSinceLogin = (new Date() - loginAt) / (1000 * 60 * 60 * 24);

        if (daysSinceLogin >= 7) {
            const lineRaw = localStorage.getItem('tuktuk_line_session');
            if (lineRaw) {
                const lineSession = JSON.parse(lineRaw);
                if (lineSession.expiresAt && Date.now() < lineSession.expiresAt) {
                    return true;
                }
            }
            this.logout();
            return false;
        }

        return true;
    },

    // Check if user is Premium
    isPremium() {
        const session = this.getSession();
        return session?.isPremium === true;
    },

    // Standardize session data
    StandardizeSession(session) {
        if (!session) return null;

        let sellerStatus = session.sellerStatus || 'none';

        // Ensure we preserve existing lineUserId if it's there
        const lineUserId = session.lineUserId || session.uid;

        // 🔑 CRITICAL: Use LINE User ID as primary UID if available
        const primaryUid = session.lineUserId || session.uid;

        // ✅ Special condition: If Premium or has specific subscription, grant Verified Seller rights immediately
        // This solves conflicts for Google logins that should have access to the Marketplace
        if (session.isPremium === true || session.subscriptionType === 'premium' || session.role === 'premium') {
            sellerStatus = 'verified';
        }

        return {
            uid: primaryUid, // Use LINE User ID if exists, otherwise fallback to uid
            lineUserId: lineUserId,
            firebaseUid: session.firebaseUid, // Preserve Firebase UID if exists
            displayName: session.displayName || session.name || 'User',
            pictureUrl: session.pictureUrl || session.photoURL || session.picture || session.avatar,
            isPremium: session.isPremium === true || session.subscriptionType === 'premium' || session.role === 'premium',
            sellerStatus: sellerStatus,
            provider: session.provider || (session.lineUserId ? 'line' : 'unknown'),
            loginAt: session.loginAt || new Date().toISOString()
        };
    },

    // Get session data from multiple possible keys
    getSession() {
        try {
            // Priority 1: Primary wizmobiz session
            const wizmobizRaw = localStorage.getItem(this.SESSION_KEY);
            if (wizmobizRaw) {
                return this.StandardizeSession(JSON.parse(wizmobizRaw));
            }

            // Priority 2: Marketplace LINE session
            const lineRaw = localStorage.getItem('tuktuk_line_session');
            if (lineRaw) {
                const lineSession = JSON.parse(lineRaw);
                // Check expiry for line session if exists
                if (lineSession.expiresAt && Date.now() > lineSession.expiresAt) {
                    localStorage.removeItem('tuktuk_line_session');
                    return null;
                }
                return this.StandardizeSession(lineSession);
            }

            // Priority 3: Legacy lineUserId from sessionStorage
            const lineUserId = sessionStorage.getItem('lineUserId');
            if (lineUserId) {
                return this.StandardizeSession({ lineUserId: lineUserId });
            }

            return null;
        } catch (e) {
            console.warn('Auth: Error reading session', e);
            return null;
        }
    },

    // Get user data
    getUser() {
        return this.getSession();
    },

    // Get LINE User ID
    getLineUserId() {
        const session = this.getSession();
        return session?.lineUserId || null;
    },

    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    // Update session data dynamically
    updateSession(newData) {
        try {
            const current = this.getSession();
            if (!current) return;
            const updated = { ...current, ...newData };
            // Save to the primary session key
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(updated));
            // Also sync back to tuktuk_line_session if it exists for consistency
            const lineRaw = localStorage.getItem('tuktuk_line_session');
            if (lineRaw) {
                const lineSession = JSON.parse(lineRaw);
                localStorage.setItem('tuktuk_line_session', JSON.stringify({ ...lineSession, ...newData }));
            }
            return updated;
        } catch (e) {
            console.error('Auth: Error updating session', e);
            return null;
        }
    },

    // Redirect to login page
    redirectToLogin(returnUrl = null) {
        // Already on login page — don't redirect (prevents Safari redirect loop)
        if (window.location.pathname.includes('/login.html')) return;

        let url = returnUrl || window.location.href;
        // Strip ?source=pwa and nested redirectUrl params to keep the chain short
        try {
            const u = new URL(url);
            u.searchParams.delete('source');
            u.searchParams.delete('redirectUrl');
            url = u.pathname + (u.search && u.search !== '?' ? u.search : '');
        } catch (_) { url = '/'; }

        // Guard: if already redirecting (Safari signInWithRedirect), skip
        if (sessionStorage.getItem('_auth_redirect_in_progress')) return;
        sessionStorage.setItem('_auth_redirect_in_progress', '1');

        window.location.replace(`/login.html?redirectUrl=${encodeURIComponent(url)}`);
    },

    // Detect mobile browser (not LINE — handled separately)
    _isMobile() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    },

    // Sign in with Google — popup on desktop, redirect on mobile
    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');

        if (this._isMobile()) {
            // Mobile: use redirect flow (popup blocked by browsers/LINE)
            await firebase.auth().signInWithRedirect(provider);
            return { success: true, redirecting: true }; // page will reload
        }

        try {
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;

            // Enhanced Security & Identity Linking: 
            // Check if this user (via email or UID) already exists in our ecosystem
            let userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            let existingData = null;

            if (userDoc.exists) {
                existingData = userDoc.data();
            } else if (user.email) {
                // Try searching by email to link separate Google/Line accounts
                const emailQuery = await firebase.firestore().collection('users')
                    .where('email', '==', user.email)
                    .limit(1)
                    .get();
                if (!emailQuery.empty) {
                    userDoc = emailQuery.docs[0];
                    existingData = userDoc.data();
                    console.log('🔗 Linked Google account to existing user record:', userDoc.id);
                }
            }

            // 🔑 CRITICAL: Use LINE User ID as primary UID if available (for data consistency)
            const primaryUid = existingData?.lineUserId ||
                existingData?.uid ||
                user.uid;

            // Prepare session data
            const sessionData = {
                uid: primaryUid, // Use LINE User ID if exists, otherwise Firebase UID
                firebaseUid: user.uid, // Keep Firebase UID for auth purposes
                displayName: user.displayName,
                email: user.email,
                pictureUrl: user.photoURL,
                provider: 'google',
                role: 'user', // Default role
                loginAt: new Date().toISOString()
            };

            if (existingData) {
                sessionData.role = existingData.role || 'user';
                sessionData.sellerStatus = existingData.sellerStatus || 'none';
                sessionData.isPremium = existingData.isPremium || (existingData.subscriptionStatus === 'active') || false;

                // CRITICAL: Preserve the lineUserId if they have one (e.g. from previous LINE login)
                // This allows them to see their same shop/products
                if (existingData.lineUserId) {
                    sessionData.lineUserId = existingData.lineUserId;
                }
            } else {
                // Truly new user - Save to Firestore
                await firebase.firestore().collection('users').doc(user.uid).set({
                    displayName: user.displayName,
                    email: user.email,
                    pictureUrl: user.photoURL,
                    role: 'user',
                    sellerStatus: 'none',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Also check 'line_users' for backward compatibility check
            if (!sessionData.isPremium && (existingData?.lineUserId || sessionData.lineUserId)) {
                const lineUserDoc = await firebase.firestore().collection('line_users')
                    .doc(existingData?.lineUserId || sessionData.lineUserId || user.uid)
                    .get();
                if (lineUserDoc.exists) {
                    const lData = lineUserDoc.data();
                    if (lData.subscriptionStatus === 'active' || lData.isPremium) {
                        sessionData.isPremium = true;
                        sessionData.sellerStatus = 'verified'; // Premium users are verified
                    }
                }
            }

            // Update Firestore with both primary UID and Firebase UID documents
            await firebase.firestore().collection('users').doc(primaryUid).set({
                displayName: sessionData.displayName,
                email: sessionData.email,
                pictureUrl: sessionData.pictureUrl,
                lineUserId: sessionData.lineUserId,
                firebaseUid: user.uid,
                role: sessionData.role,
                sellerStatus: sessionData.sellerStatus,
                isPremium: sessionData.isPremium,
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                provider: 'google'
            }, { merge: true });

            // Also update Firebase UID document for cross-reference (if different from primary)
            if (primaryUid !== user.uid) {
                await firebase.firestore().collection('users').doc(user.uid).set({
                    linkedTo: primaryUid,
                    lineUserId: sessionData.lineUserId,
                    displayName: sessionData.displayName,
                    email: sessionData.email,
                    pictureUrl: sessionData.pictureUrl,
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                    provider: 'google'
                }, { merge: true });
            }

            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
            return { success: true, user: sessionData };
        } catch (error) {
            console.error('Google Sign-in Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Handle redirect result on page load (for mobile Google sign-in)
    async handleGoogleRedirectResult() {
        try {
            const result = await firebase.auth().getRedirectResult();
            if (!result || !result.user) return null;

            const user = result.user;
            let userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            let existingData = userDoc.exists ? userDoc.data() : null;

            if (!existingData && user.email) {
                const q = await firebase.firestore().collection('users').where('email', '==', user.email).limit(1).get();
                if (!q.empty) { existingData = q.docs[0].data(); }
            }

            const primaryUid = existingData?.lineUserId || existingData?.uid || user.uid;
            const sessionData = {
                uid: primaryUid,
                firebaseUid: user.uid,
                displayName: user.displayName,
                email: user.email,
                pictureUrl: user.photoURL,
                provider: 'google',
                role: existingData?.role || 'user',
                sellerStatus: existingData?.sellerStatus || 'none',
                isPremium: existingData?.isPremium || (existingData?.subscriptionStatus === 'active') || false,
                lineUserId: existingData?.lineUserId || null,
                loginAt: new Date().toISOString(),
            };

            if (!existingData) {
                await firebase.firestore().collection('users').doc(user.uid).set({
                    displayName: user.displayName,
                    email: user.email,
                    pictureUrl: user.photoURL,
                    role: 'user',
                    sellerStatus: 'none',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            } else {
                await firebase.firestore().collection('users').doc(primaryUid).set({
                    displayName: sessionData.displayName,
                    email: sessionData.email,
                    pictureUrl: sessionData.pictureUrl,
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                    provider: 'google',
                }, { merge: true });
            }

            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
            return { success: true, user: sessionData };
        } catch (error) {
            console.error('Google Redirect Result Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Show login required modal
    showLoginModal(featureName = 'ฟีเจอร์นี้') {
        // Create modal if not exists
        let modal = document.getElementById('authLoginModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'authLoginModal';
            modal.innerHTML = `
                <div class="auth-modal-overlay" onclick="WizmobizAuth.hideLoginModal()">
                    <div class="auth-modal-content" onclick="event.stopPropagation()">
                        <button class="auth-modal-close" onclick="WizmobizAuth.hideLoginModal()">&times;</button>
                        <div class="auth-modal-icon">🔐</div>
                        <h2>กรุณาเข้าสู่ระบบ</h2>
                        <p class="auth-modal-feature"></p>
                        <p class="auth-modal-desc">เข้าสู่ระบบผ่าน LINE OA เพื่อใช้งาน</p>
                        
                        <div class="auth-modal-steps">
                            <div class="auth-step">
                                <span class="step-num">1</span>
                                <span>เพิ่มเพื่อน LINE OA</span>
                            </div>
                            <div class="auth-step">
                                <span class="step-num">2</span>
                                <span>พิมพ์ "ขอรหัสผ่าน"</span>
                            </div>
                            <div class="auth-step">
                                <span class="step-num">3</span>
                                <span>กรอกรหัส PIN ที่ได้รับ</span>
                            </div>
                        </div>
                        
                        <div class="auth-modal-buttons">
                            <a href="/login.html" class="auth-btn auth-btn-primary">
                                🔑 เข้าสู่ระบบ
                            </a>
                            <a href="https://lin.ee/1YJsw47" target="_blank" class="auth-btn auth-btn-line">
                                💬 เพิ่มเพื่อน LINE OA
                            </a>
                        </div>
                        
                        <div class="auth-premium-promo">
                            <p>💎 สมัครสมาชิก Premium เริ่มต้น <strong>99 บาท/เดือน</strong></p>
                            <ul>
                                <li>✅ AI Chat ไม่จำกัด</li>
                                <li>✅ AI Post Generator 30 รูป/วัน</li>
                                <li>✅ บันทึกบัญชีไม่จำกัด</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add styles if not exists
            if (!document.getElementById('authModalStyles')) {
                const styles = document.createElement('style');
                styles.id = 'authModalStyles';
                styles.textContent = `
                    .auth-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                        opacity: 0;
                        visibility: hidden;
                        transition: all 0.3s;
                    }
                    .auth-modal-overlay.show {
                        opacity: 1;
                        visibility: visible;
                    }
                    .auth-modal-content {
                        background: white;
                        border-radius: 20px;
                        max-width: 420px;
                        width: 100%;
                        padding: 30px;
                        text-align: center;
                        position: relative;
                        transform: scale(0.9);
                        transition: transform 0.3s;
                    }
                    .auth-modal-overlay.show .auth-modal-content {
                        transform: scale(1);
                    }
                    .auth-modal-close {
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #999;
                    }
                    .auth-modal-icon {
                        font-size: 3rem;
                        margin-bottom: 15px;
                    }
                    .auth-modal-content h2 {
                        color: #333;
                        margin-bottom: 10px;
                    }
                    .auth-modal-feature {
                        color: #667eea;
                        font-weight: 600;
                        margin-bottom: 5px;
                    }
                    .auth-modal-desc {
                        color: #666;
                        font-size: 0.9rem;
                        margin-bottom: 20px;
                    }
                    .auth-modal-steps {
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    .auth-step {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 8px 0;
                        text-align: left;
                    }
                    .step-num {
                        width: 24px;
                        height: 24px;
                        background: #667eea;
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.8rem;
                        font-weight: bold;
                    }
                    .auth-modal-buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .auth-btn {
                        display: block;
                        padding: 12px 20px;
                        border-radius: 10px;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s;
                    }
                    .auth-btn-primary {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                    }
                    .auth-btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                    }
                    .auth-btn-line {
                        background: #00B900;
                        color: white;
                    }
                    .auth-btn-line:hover {
                        background: #009900;
                    }
                    .auth-premium-promo {
                        background: linear-gradient(135deg, #fef3c7, #fde68a);
                        border-radius: 12px;
                        padding: 15px;
                        border: 2px solid #f59e0b;
                    }
                    .auth-premium-promo p {
                        color: #92400e;
                        margin-bottom: 10px;
                    }
                    .auth-premium-promo ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                        text-align: left;
                    }
                    .auth-premium-promo li {
                        color: #78350f;
                        font-size: 0.85rem;
                        padding: 3px 0;
                    }
                `;
                document.head.appendChild(styles);
            }
        }

        // Update feature name
        modal.querySelector('.auth-modal-feature').textContent = `"${featureName}" ต้องเข้าสู่ระบบ`;

        // Show modal
        modal.querySelector('.auth-modal-overlay').classList.add('show');
    },

    // Hide login modal
    hideLoginModal() {
        const modal = document.getElementById('authLoginModal');
        if (modal) {
            modal.querySelector('.auth-modal-overlay').classList.remove('show');
        }
    },

    // Show premium required modal
    showPremiumModal(featureName = 'ฟีเจอร์นี้') {
        let modal = document.getElementById('authPremiumModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'authPremiumModal';
            modal.innerHTML = `
                <div class="auth-modal-overlay" onclick="WizmobizAuth.hidePremiumModal()">
                    <div class="auth-modal-content" onclick="event.stopPropagation()">
                        <button class="auth-modal-close" onclick="WizmobizAuth.hidePremiumModal()">&times;</button>
                        <div class="auth-modal-icon">💎</div>
                        <h2>ฟีเจอร์สำหรับ Premium</h2>
                        <p class="auth-modal-feature"></p>
                        
                        <div class="premium-packages">
                            <div class="premium-package">
                                <h4>รายเดือน</h4>
                                <div class="price">99฿</div>
                                <p>1 เดือน</p>
                            </div>
                            <div class="premium-package popular">
                                <span class="badge">ยอดนิยม</span>
                                <h4>3 เดือน</h4>
                                <div class="price">259฿</div>
                                <p>ประหยัด 12%</p>
                            </div>
                            <div class="premium-package">
                                <h4>รายปี</h4>
                                <div class="price">699฿</div>
                                <p>≈1.9฿/วัน</p>
                            </div>
                        </div>
                        
                        <a href="https://lin.ee/1YJsw47" target="_blank" class="auth-btn auth-btn-premium">
                            ⭐ สมัคร Premium ใน LINE OA
                        </a>
                        
                        <p style="margin-top: 15px; color: #666; font-size: 0.85rem;">
                            พิมพ์ "สมัครสมาชิก" ใน LINE OA
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add premium modal styles
            const styles = document.createElement('style');
            styles.textContent = `
                .premium-packages {
                    display: flex;
                    gap: 10px;
                    margin: 20px 0;
                }
                .premium-package {
                    flex: 1;
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 15px 10px;
                    position: relative;
                }
                .premium-package.popular {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }
                .premium-package .badge {
                    position: absolute;
                    top: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #f59e0b;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                }
                .premium-package h4 {
                    font-size: 0.85rem;
                    margin-bottom: 5px;
                }
                .premium-package .price {
                    font-size: 1.3rem;
                    font-weight: bold;
                }
                .premium-package p {
                    font-size: 0.75rem;
                    opacity: 0.8;
                    margin: 0;
                }
                .auth-btn-premium {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    display: block;
                    padding: 15px;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(styles);
        }

        modal.querySelector('.auth-modal-feature').textContent = `"${featureName}" สำหรับสมาชิก Premium เท่านั้น`;
        modal.querySelector('.auth-modal-overlay').classList.add('show');
    },

    hidePremiumModal() {
        const modal = document.getElementById('authPremiumModal');
        if (modal) {
            modal.querySelector('.auth-modal-overlay').classList.remove('show');
        }
    },

    // Require login - returns true if logged in, shows modal if not
    requireLogin(featureName) {
        if (this.isLoggedIn()) {
            return true;
        }
        this.showLoginModal(featureName);
        return false;
    },

    // Require premium - returns true if premium, shows modal if not
    requirePremium(featureName) {
        if (!this.isLoggedIn()) {
            this.showLoginModal(featureName);
            return false;
        }
        if (this.isPremium()) {
            return true;
        }
        this.showPremiumModal(featureName);
        return false;
    },

    // Create user status badge HTML
    getUserBadgeHTML() {
        const user = this.getUser();
        if (!user) {
            return `
                <a href="/login.html" class="user-badge guest" id="headerLoginBtn">
                    <span class="badge-icon">👤</span>
                    <span class="badge-text">เข้าสู่ระบบ</span>
                </a>
            `;
        }

        const statusClass = user.isPremium ? 'premium' : 'free';
        const roleText = user.sellerStatus === 'verified' ? '🏪 Seller' : (user.provider === 'google' ? '🎭 Fan' : '👤 Member');

        // Multi-Source Image Extraction (Maximum Ability)
        let pictureUrl = user.pictureUrl || user.photoURL || user.picture || user.avatar ||
            user.rawUser?.pictureUrl || user.rawUser?.photoURL || user.rawUser?.picture ||
            user.user?.pictureUrl || user.user?.photoURL;

        // Visual Fallback Logic
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=667eea&color=fff`;

        if (!pictureUrl || pictureUrl === 'undefined' || pictureUrl === 'null' || pictureUrl === '') {
            pictureUrl = fallbackAvatar;
        }

        return `
            <div class="user-badge ${statusClass}" id="userDropdown">
                <img src="${pictureUrl}" 
                     class="badge-avatar" 
                     alt="User" 
                     onerror="this.onerror=null; this.src='${fallbackAvatar}';"
                     style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);">
                <div class="badge-info">
                    <span class="badge-name" style="color: ${statusClass === 'premium' ? '#fbbf24' : '#fff'};">${user.displayName || user.name || 'User'}</span>
                    <span class="badge-status" style="color: rgba(255,255,255,0.6);">${roleText}</span>
                </div>
                <div class="badge-actions" style="display: flex; gap: 8px; margin-left: 10px; align-items: center;">
                    <a href="javascript:void(0)" onclick="WizmobizAuth.handleShopAccess()" class="badge-shop" title="ร้านของฉัน" style="text-decoration: none; font-size: 1.1rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">🏪</a>
                    <button onclick="WizmobizAuth.logout(); location.reload();" class="badge-logout" title="ออกจากระบบ" style="filter: grayscale(1); opacity: 0.5; background: none; border: none; cursor: pointer;">🚪</button>
                </div>
            </div>
        `;
    },

    // Internal helper for notifications
    _notify(msg, type = 'info') {
        console.log(`[WizmobizAuth] ${type.toUpperCase()}: ${msg}`);
        if (typeof showToast === 'function') {
            showToast(msg, type);
        } else {
            // Fallback: simple floating toast
            let toast = document.getElementById('tuktuk-auth-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'tuktuk-auth-toast';
                toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 24px;background:#333;color:white;border-radius:30px;z-index:10000;font-family:sans-serif;box-shadow:0 4px 15px rgba(0,0,0,0.3);transition:all 0.3s ease;opacity:0;';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';
            toast.style.opacity = '1';
            toast.style.top = '40px';
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.top = '20px';
            }, 3000);
        }
    },

    // Handle Shop Access - Requirement: Verified Seller via LINE
    async handleShopAccess(destination = null) {
        let user = this.getUser();
        if (!user) {
            this._notify('กรุณาเข้าสู่ระบบก่อนใช้งาน', 'info');
            this.showLoginModal('เข้าสู่ระบบเพื่อจัดการร้านค้า');
            return;
        }

        const userId = user.uid; // lineUserId or Firebase UID
        const API_BASE = 'https://us-central1-appinjproject.cloudfunctions.net';
        console.log('🔍 [V1.0.6] Checking shop access for:', user.displayName, 'ID:', userId, 'Status:', user.sellerStatus);

        // Try to refresh status from Firestore or API if not verified locally
        if (user.sellerStatus !== 'verified') {
            this._notify('กำลังตรวจสอบสิทธิ์ผู้ขาย...', 'info');

            let isVerified = false;

            // 1. Try Firestore first (if available and not already verified)
            if (typeof db !== 'undefined' && !isVerified) {
                try {
                    console.log('📡 Fetching status from Firestore...');
                    // 1.1 Check primary users collection
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        const data = userDoc.data();
                        if (data.sellerStatus === 'verified' || data.isSeller === true || data.isSeller === 'true' || data.subscriptionType === 'premium') {
                            isVerified = true;
                        }
                    }

                    // 1.2 Try searching users collection by lineUserId field
                    if (!isVerified && user.lineUserId) {
                        const userQuery = await db.collection('users')
                            .where('lineUserId', '==', user.lineUserId)
                            .limit(1)
                            .get();
                        if (!userQuery.empty) {
                            const data = userQuery.docs[0].data();
                            if (data.sellerStatus === 'verified' || data.isSeller === true || data.subscriptionType === 'premium') {
                                isVerified = true;
                            }
                        }
                    }

                    // 1.3 Check seller_profiles collection (sellers registered via Flutter app)
                    // seller_profiles uses lineUserId as doc ID
                    if (!isVerified) {
                        const lookupId = user.lineUserId || userId;
                        const profileDoc = await db.collection('seller_profiles').doc(lookupId).get();
                        if (profileDoc.exists) {
                            const data = profileDoc.data();
                            const plan = data.subscriptionPlan || {};
                            if (
                                data.sellerStatus === 'verified' ||
                                plan.paymentStatus === 'active' ||
                                plan.tier === 'trial' ||
                                plan.tier === 'starter'
                            ) {
                                isVerified = true;
                                console.log('✅ Verified via seller_profiles:', lookupId);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Firestore error (Offline or Permission):', e.message);
                }
            }

            // 2. API Fallback (Use fetch to bypass Firestore offline issues)
            if (!isVerified) {
                try {
                    console.log('🌐 Attempting API fallback for status check...');
                    const response = await fetch(`${API_BASE}/marketplaceLineAuth`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lineUserId: user.lineUserId || userId })
                    });
                    const result = await response.json();
                    if (result.success && result.user) {
                        const s = result.user.sellerStatus;
                        const p = result.user.isPremium || result.user.subscriptionType === 'premium';
                        if (s === 'verified' || result.user.isSeller === true || p) {
                            isVerified = true;
                        }
                    }
                } catch (apiErr) {
                    console.warn('❌ API fallback failed:', apiErr.message);
                }
            }

            // Sync status if verified
            if (isVerified) {
                console.log('✅ Seller verified successfully!');
                user.sellerStatus = 'verified';
                const sessionKeys = [this.SESSION_KEY, 'tuktuk_line_session', 'wizmobiz_session'];
                sessionKeys.forEach(key => {
                    const sessionRaw = localStorage.getItem(key);
                    if (sessionRaw) {
                        try {
                            const session = JSON.parse(sessionRaw);
                            if (session.lineUserId === user.lineUserId || session.uid === user.uid) {
                                session.sellerStatus = 'verified';
                                localStorage.setItem(key, JSON.stringify(session));
                            }
                        } catch (e) { }
                    }
                });
                this._notify('อนุมัติสิทธิ์ผู้ขายเรียบร้อย', 'success');
            } else {
                console.log('❌ Seller NOT verified through any channel');
            }
        }

        // Final decision
        if (user.sellerStatus === 'verified') {
            const defaultTarget = window.location.hostname === 'localhost' || window.location.pathname.includes('.html')
                ? 'seller-dashboard.html'
                : 'seller-dashboard';

            const target = destination || defaultTarget;
            console.log('🚀 Redirecting to:', target);
            window.location.href = target;
        } else {
            console.log('🔓 Showing verification modal');
            this.showVerificationModal();
        }
    },

    showVerificationModal() {
        let modal = document.getElementById('sellerVerifyModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sellerVerifyModal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="auth-modal-overlay show" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000;" onclick="this.parentElement.innerHTML=''">
                <div class="auth-modal-content" style="background: white; padding: 40px; border-radius: 30px; max-width: 450px; width: 90%; text-align: center; color: #333; position: relative;" onclick="event.stopPropagation()">
                    <button class="auth-modal-close" style="position: absolute; top: 20px; right: 20px; border: none; background: none; font-size: 1.5rem; cursor: pointer;" onclick="this.closest('.auth-modal-overlay').parentElement.innerHTML=''">&times;</button>
                    <div class="auth-modal-icon" style="font-size: 4rem; margin-bottom: 20px;">🎖️</div>
                    <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 10px;">ยกระดับเป็น Verified Seller</h2>
                    <p class="auth-modal-desc" style="color: #666; margin-bottom: 25px;">เชื่อมต่อบัญชี LINE เพื่อยืนยันตัวตนและเปิดใช้งานเมนูร้านค้า (My Shop)</p>
                    
                    <div class="benefits-grid" style="display: grid; grid-template-columns: 1fr; gap: 12px; text-align: left; margin-bottom: 30px;">
                        <div style="display: flex; gap: 10px; align-items: start;">
                            <span style="color: #059669;">✔️</span>
                            <div><strong>เปิดร้านค้าฟรี</strong><p style="font-size: 0.8rem; margin: 0; opacity: 0.7;">ลงสินค้าและจัดการสต็อกได้ทันที</p></div>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: start;">
                            <span style="color: #059669;">✔️</span>
                            <div><strong>ตราสัญลักษณ์สีทอง</strong><p style="font-size: 0.8rem; margin: 0; opacity: 0.7;">เพิ่มความน่าเชื่อถือให้ร้านค้าของคุณ</p></div>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: start;">
                            <span style="color: #059669;">✔️</span>
                            <div><strong>เชื่อมต่อ LINE OA</strong><p style="font-size: 0.8rem; margin: 0; opacity: 0.7;">รับการแจ้งเตือนคำสั่งซื้อผ่าน LINE</p></div>
                        </div>
                    </div>

                    <div class="auth-modal-buttons" style="display: flex; flex-direction: column; gap: 15px;">
                        <button onclick="WizmobizAuth.initLineLink()" class="auth-btn auth-btn-line" style="background: #00B900; color: white; border: none; padding: 18px; border-radius: 15px; font-weight: 700; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i class="fab fa-line"></i> เชื่อมต่อ LINE ทันที
                        </button>
                        <a href="https://lin.ee/1YJsw47" target="_blank" style="color: #666; font-size: 0.9rem; text-decoration: underline;">สอบถามขั้นตอนการยืนยัน</a>
                    </div>
                </div>
            </div>
        `;
    },

    // Initialize LINE Linking Flow
    async initLineLink() {
        const user = this.getUser();
        if (!user) {
            this.showLoginModal('ยืนยันตัวตน');
            return;
        }

        // Store target UID in session for linking back after redirect
        sessionStorage.setItem('linking_uid', user.uid);

        // Redirect to line login mock (or real one if configured)
        // In real app: window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&state=${user.uid}&scope=profile%20openid`;

        // For demonstration, we'll simulate the successful link
        console.log('🔗 Initiating LINE Linking for:', user.uid);

        alert('ระบบกำลังนำคุณไปยังหน้าเข้าสู่ระบบ LINE เพื่อยืนยันตัวตน...');

        // Redirecting to the login page with a specific mode could be one way
        window.location.href = 'login.html?mode=line_verify&uid=' + user.uid;
    },

    initHeaderUI(containerId = 'userBadgeContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            const user = this.getUser();
            container.innerHTML = this.getUserBadgeHTML();

            // Sync marketplace elements if present
            if (user) {
                const myShop = document.getElementById('headerMyShop');
                const sellBtn = document.getElementById('headerSellBtn');
                if (myShop) myShop.style.display = 'flex';
                if (sellBtn) sellBtn.style.display = 'flex';
            }

            // Sync mobile bottom nav if it exists
            this.syncBottomNav();

            // Add badge styles if not exists
            if (!document.getElementById('userBadgeStyles')) {
                const styles = document.createElement('style');
                styles.id = 'userBadgeStyles';
                styles.textContent = `
                    .user-badge {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 12px;
                        border-radius: 25px;
                        text-decoration: none;
                        transition: all 0.3s;
                    }
                    .user-badge.guest {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                    }
                    .user-badge.guest:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                    }
                    .user-badge.free {
                        background: rgba(30, 41, 59, 0.4);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        color: #fff;
                    }
                    .user-badge.premium {
                        background: rgba(30, 41, 59, 0.6);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(251, 191, 36, 0.5);
                        color: #fbbf24;
                        box-shadow: 0 0 15px rgba(251, 191, 36, 0.1);
                    }
                    .badge-avatar {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                    }
                    .badge-info {
                        display: flex;
                        flex-direction: column;
                        line-height: 1.2;
                    }
                    .badge-name {
                        font-weight: 600;
                        font-size: 0.85rem;
                    }
                    .badge-status {
                        font-size: 0.7rem;
                    }
                    .badge-logout {
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 1rem;
                        opacity: 0.6;
                        transition: opacity 0.3s;
                    }
                    .badge-logout:hover {
                        opacity: 1;
                    }
                    .badge-shop {
                        transition: transform 0.2s;
                    }
                    .badge-shop:hover {
                        transform: scale(1.2);
                    }
                `;
                document.head.appendChild(styles);
            }
        } else {
            // Even if header container not found, try to sync bottom nav
            this.syncBottomNav();
        }
    },

    syncBottomNav() {
        const profileBtn = document.getElementById('bottomProfile');
        if (!profileBtn) return;

        const user = this.getUser();
        if (user) {
            const pictureUrl = user.pictureUrl || user.photoURL || user.picture || user.avatar;
            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=667eea&color=fff`;

            profileBtn.innerHTML = `
                <img src="${pictureUrl || fallbackAvatar}" 
                     style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.3);"
                     onerror="this.onerror=null; this.src='${fallbackAvatar}';">
                <span>โปรไฟล์</span>
            `;
        } else {
            profileBtn.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>เข้าสู่ระบบ</span>
            `;
        }
    },

    handleProfileClick() {
        if (this.isLoggedIn()) {
            // If logged in, maybe show a logout confirm or go to a profile page
            if (confirm('ต้องการออกจากระบบหรือไม่?')) {
                this.logout();
                location.reload();
            }
        } else {
            window.location.href = '/login.html';
        }
    }
};

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    WizmobizAuth.initHeaderUI();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WizmobizAuth;
}
