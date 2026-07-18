/* 🛡️ WizmobizAuth V1.1.0 - Unified Marketplace Authentication (30-day persistent session) */
console.log('🛡️ WizmobizAuth [V1.1.0] loaded.');

var WizmobizAuth = {
    // Session storage key
    SESSION_KEY: 'wizmobiz_session',

    // Session TTL constants
    SESSION_TTL_DAYS: 30,            // primary session duration
    SESSION_REFRESH_DAYS: 25,        // silently extend when this many days have passed

    // Check if user is logged in
    isLoggedIn() {
        const session = this.getSession();
        if (!session) return false;

        const loginAt = new Date(session.loginAt);
        const daysSinceLogin = (new Date() - loginAt) / (1000 * 60 * 60 * 24);

        // Hard expiry: 30 days
        if (daysSinceLogin >= this.SESSION_TTL_DAYS) {
            // Last chance: check tuktuk_line_session with expiresAt
            const lineRaw = localStorage.getItem('tuktuk_line_session');
            if (lineRaw) {
                try {
                    const lineSession = JSON.parse(lineRaw);
                    if (lineSession.expiresAt && Date.now() < lineSession.expiresAt) {
                        // Restore primary session from line session
                        lineSession.loginAt = new Date().toISOString();
                        localStorage.setItem(this.SESSION_KEY, JSON.stringify(lineSession));
                        return true;
                    }
                } catch (_) {}
            }
            this.logout();
            return false;
        }

        // Soft refresh: extend loginAt when session is 25+ days (silent, no UX)
        if (daysSinceLogin >= this.SESSION_REFRESH_DAYS) {
            this._silentRefreshSession(session);
        }

        return true;
    },

    // Silently extend session when approaching expiry
    _silentRefreshSession(session) {
        try {
            const extended = { ...session, loginAt: new Date().toISOString() };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(extended));
            const lineRaw = localStorage.getItem('tuktuk_line_session');
            if (lineRaw) {
                const ls = JSON.parse(lineRaw);
                ls.loginAt = extended.loginAt;
                ls.expiresAt = Date.now() + this.SESSION_TTL_DAYS * 86400000;
                localStorage.setItem('tuktuk_line_session', JSON.stringify(ls));
            }
        } catch (_) {}
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

        // ✅ Admins are always sellers (mirror backend line-webhook.js: role === 'super_admin')
        if (session.role === 'super_admin' || session.role === 'admin') {
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
            role: session.role || 'user',
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

    // Logout — clears all session keys + sets a flag to block LIFF auto-re-login
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem('tuktuk_line_session');
        localStorage.setItem('tuktuk_session_ended', '1');
        sessionStorage.removeItem('_liff_login_triggered');
        // Redirect to login instead of letting caller reload (avoids LIFF auto-reauth)
        const p = window.location.pathname;
        if (!p.includes('/login')) {
            window.location.replace('/login.html');
        }
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
        const p = window.location.pathname;
        if (p.includes('/login.html') || p.includes('/login')) return;

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

        // Use clean URL for best compatibility with registered LINE callback URIs
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
                const lineUserDoc = await firebase.firestore().collection('users')
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
                            <a href="/login" class="auth-btn auth-btn-primary">
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
                    <button onclick="WizmobizAuth.logout();" class="badge-logout" title="ออกจากระบบ" style="filter: grayscale(1); opacity: 0.5; background: none; border: none; cursor: pointer;">🚪</button>
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
            this.showShopAccessModal();
            return;
        }

        const userId = user.uid; // lineUserId or Firebase UID
        const API_BASE = '';
        console.log('🔍 [V1.0.6] Checking shop access for:', user.displayName, 'ID:', userId, 'Status:', user.sellerStatus);

        // Try to refresh status from Firestore or API if not verified locally
        if (user.sellerStatus !== 'verified') {
            this._notify('กำลังตรวจสอบสิทธิ์ผู้ขาย...', 'info');

            let isVerified = false;

            // 1. Try the D1 shim (via db.collection) — skip entirely if storage is
            //    blocked by Tracking Prevention (Edge/Safari), which makes all db
            //    reads fail with 401 Unauthorized before even reaching the server.
            let storageAvailable = false;
            try {
                localStorage.getItem('__tp_test__');
                storageAvailable = true;
            } catch (_) {
                console.warn('⚠️ localStorage blocked (Tracking Prevention) — skipping Firestore, using API fallback');
            }

            if (storageAvailable && typeof db !== 'undefined' && !isVerified) {
                try {
                    console.log('📡 Fetching seller status from users collection...');
                    // 1.1 Check primary users collection by document ID
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
                    // Note: seller_profiles is not queried here — that collection is not
                    // registered in the D1 shim allowlist. All seller data lives in `users`.
                } catch (e) {
                    console.warn('⚠️ Firestore/DB error (Offline or Permission):', e.message);
                }
            }

            // 2. API Fallback (Use fetch to bypass Firestore offline issues)
            if (!isVerified) {
                try {
                    console.log('🌐 Attempting API fallback for status check...');
                    const statusToken = localStorage.getItem('tuktuk_jwt') ||
                        localStorage.getItem('tuktuk_token') ||
                        (() => {
                            try {
                                const keys = [this.SESSION_KEY, 'tuktuk_line_session', 'wizmobiz_session', 'wit_line_session'];
                                for (const key of keys) {
                                    const session = JSON.parse(localStorage.getItem(key) || 'null');
                                    if (session?.token || session?.sessionToken) return session.token || session.sessionToken;
                                }
                            } catch (_) {}
                            return null;
                        })();
                    const response = await fetch(`${API_BASE}/marketplaceLineAuth`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(statusToken ? { Authorization: `Bearer ${statusToken}` } : {}) },
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

        // Final decision: ALL logged-in users can access the shop. 
        // Verification is an optional upgrade inside the dashboard.
        const defaultTarget = window.location.hostname === 'localhost' || window.location.pathname.includes('.html')
            ? 'seller-dashboard.html'
            : 'seller-dashboard';

        const target = destination || defaultTarget;
        console.log('🚀 Redirecting to:', target);
        // SPA-aware navigation: if inside iframe, tell parent to navigate
        if (window.self !== window.top) {
            window.top.postMessage({ type: 'NAVIGATE', href: target }, window.location.origin);
        } else if (typeof window.navigateToSPA === 'function') {
            window.navigateToSPA(target);
        } else {
            window.location.href = target;
        }
    },

    // Shop Access Modal — for non-logged-in users
    showShopAccessModal() {
        const existing = document.getElementById('shopAccessModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'shopAccessModal';
        modal.innerHTML = `
            <div id="shopAccessOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);" onclick="document.getElementById('shopAccessModal').remove()">
                <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border:1px solid rgba(249,115,22,0.3);border-radius:24px;max-width:440px;width:100%;padding:36px;text-align:center;position:relative;box-shadow:0 25px 60px rgba(0,0,0,0.6);" onclick="event.stopPropagation()">
                    <button onclick="document.getElementById('shopAccessModal').remove()" style="position:absolute;top:16px;right:20px;background:none;border:none;color:rgba(255,255,255,0.5);font-size:1.4rem;cursor:pointer;line-height:1;">&times;</button>
                    <div style="font-size:3.5rem;margin-bottom:16px;">🏪</div>
                    <h2 style="color:#fff;font-size:1.6rem;font-weight:800;margin:0 0 8px;">ร้านค้าของฉัน</h2>
                    <p style="color:rgba(255,255,255,0.65);font-size:0.95rem;margin:0 0 28px;line-height:1.5;">เข้าสู่ระบบเพื่อจัดการร้านค้า หรือเปิดร้านใหม่ฟรี ไม่มีค่าคอมมิชชั่น</p>

                    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
                        <button onclick="document.getElementById('shopAccessModal').remove();if(typeof showPinLoginModal==='function'){showPinLoginModal()}else{window.location.href='/login'}" style="background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;border:none;padding:16px 24px;border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
                            <i class="fas fa-key"></i> เข้าสู่ระบบด้วย PIN
                        </button>
                        <button onclick="document.getElementById('shopAccessModal').remove();window.open('https://lin.ee/1YJsw47','_blank')" style="background:#00B900;color:#fff;border:none;padding:16px 24px;border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
                            <i class="fab fa-line"></i> เพิ่มเพื่อน LINE OA เพื่อรับ PIN
                        </button>
                    </div>

                    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;">
                        <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin:0 0 14px;">ยังไม่มีร้านค้า?</p>
                        <button onclick="document.getElementById('shopAccessModal').remove();if(window.self!==window.top){window.top.postMessage({type:'NAVIGATE',href:'seller-dashboard.html'},window.location.origin)}else if(typeof window.navigateToSPA==='function'){window.navigateToSPA('seller-dashboard.html')}else{window.location.href='seller-dashboard.html'}" style="background:rgba(249,115,22,0.15);color:#f97316;border:1px solid rgba(249,115,22,0.4);padding:14px 24px;border-radius:14px;font-size:1rem;font-weight:700;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:10px;">
                            <i class="fas fa-store-alt"></i> เปิดร้านค้าฟรีกับเรา
                        </button>
                        <p style="color:rgba(255,255,255,0.35);font-size:0.78rem;margin:12px 0 0;">ทดลองฟรี 30 วัน · ไม่มีค่าคอมมิชชั่น · AI ช่วยลงสินค้า</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
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
                        <div id="sellerVerifyStep1">
                            <button onclick="WizmobizAuth.showLineOaInput()" class="auth-btn auth-btn-line" style="width: 100%; background: #00B900; color: white; border: none; padding: 18px; border-radius: 15px; font-weight: 700; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <i class="fab fa-line"></i> เชื่อมต่อ LINE ทันที
                            </button>
                        </div>
                        <div id="sellerVerifyStep2" style="display: none; text-align: left;">
                            <label style="font-size: 0.85rem; color: #666; margin-bottom: 6px; display: block;">ระบุ LINE OA ID ของร้านค้า (เช่น @tuktukshop)</label>
                            <input type="text" id="sellerLineOaInput" placeholder="@yourshop" style="width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 12px; font-size: 1rem;">
                            <button onclick="WizmobizAuth.submitLineLink()" id="sellerVerifySubmitBtn" class="auth-btn" style="width: 100%; background: #059669; color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer;">
                                ยืนยันตัวตน
                            </button>
                            <div id="sellerVerifyError" style="color: #dc2626; font-size: 0.85rem; margin-top: 10px; display: none;"></div>
                        </div>
                        <a href="javascript:void(0)" onclick="window.open('https://lin.ee/1YJsw47', '_blank'); return false;" style="color: #666; font-size: 0.9rem; text-decoration: underline; cursor: pointer;">สอบถามขั้นตอนการยืนยัน</a>
                    </div>
                </div>
            </div>
        `;
    },

    // Step 1 → Step 2: reveal LINE OA ID input inside the verify modal
    showLineOaInput() {
        const user = this.getUser();
        if (!user) {
            this.showLoginModal('ยืนยันตัวตน');
            return;
        }

        const isLineLinked = user.provider === 'line' || !!user.lineUserId;
        if (!isLineLinked) {
            alert("ระบบกำลังพาทุกท่านไปยังหน้าเข้าสู่ระบบ LINE เพื่อยืนยันตัวตน...");
            const currentPath = window.location.pathname + window.location.search;
            const redirectUrl = currentPath.includes('seller-dashboard') ? '/seller-dashboard.html?action=verify_seller' : currentPath;
            window.location.href = '/login.html?mode=line_verify&redirectUrl=' + encodeURIComponent(redirectUrl);
            return;
        }

        const step1 = document.getElementById('sellerVerifyStep1');
        const step2 = document.getElementById('sellerVerifyStep2');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        const input = document.getElementById('sellerLineOaInput');
        if (input) input.focus();
    },

    // Step 2: submit LINE OA ID to the real verification API
    async submitLineLink() {
        const user = this.getUser();
        if (!user) {
            this.showLoginModal('ยืนยันตัวตน');
            return;
        }

        const input = document.getElementById('sellerLineOaInput');
        const errEl = document.getElementById('sellerVerifyError');
        const btn = document.getElementById('sellerVerifySubmitBtn');
        const showErr = (msg) => {
            if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
            else { this._notify(msg, 'error'); }
        };

        let lineOaId = (input?.value || '').trim();
        if (!lineOaId) { showErr('กรุณาระบุ LINE OA ID'); return; }
        if (!lineOaId.startsWith('@')) lineOaId = '@' + lineOaId;

        const token = localStorage.getItem('tuktuk_session_token') ||
            localStorage.getItem('tuktuk_jwt') ||
            localStorage.getItem('tuktuk_token');
        if (!token) { showErr('ไม่พบ session — กรุณาเข้าสู่ระบบใหม่'); return; }

        if (errEl) errEl.style.display = 'none';
        const originalText = btn ? btn.innerHTML : '';
        if (btn) { btn.innerHTML = 'กำลังตรวจสอบ...'; btn.disabled = true; }

        try {
            const res = await fetch('/api/auth/seller/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ lineOaId }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'ยืนยันไม่สำเร็จ');
            }

            // Persist new verified session across all known keys
            if (data.token) {
                localStorage.setItem('tuktuk_session_token', data.token);
            }
            this._markSessionVerified(user, data.user);
            this._notify('ยืนยันตัวตนสำเร็จ! ร้านค้าของคุณได้รับตราสัญลักษณ์สีทองแล้ว', 'success');

            // Close modal then route to shop
            const modal = document.getElementById('sellerVerifyModal');
            if (modal) modal.innerHTML = '';
            this.handleShopAccess();
        } catch (err) {
            showErr(err.message || 'เกิดข้อผิดพลาด');
        } finally {
            if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
        }
    },

    // Write sellerStatus: 'verified' back into every stored session key
    _markSessionVerified(user, apiUser) {
        const keys = [this.SESSION_KEY, 'tuktuk_line_session', 'wizmobiz_session', 'wit_line_session'];
        keys.forEach(key => {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            try {
                const session = JSON.parse(raw);
                session.sellerStatus = 'verified';
                if (apiUser && apiUser.token) session.token = apiUser.token;
                localStorage.setItem(key, JSON.stringify(session));
            } catch (_) {}
        });
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
