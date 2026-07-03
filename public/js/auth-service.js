/**
 * 🔐 Authentication Service
 * =========================
 * จัดการ Authentication flows ทั้งหมดสำหรับ Training System
 * 
 * Features:
 * - Session Persistence (Local & Firebase)
 * - Email/Password Authentication
 * - Google Sign-In
 * - Line Login (LINE OA PIN Integration)
 * - Session Management
 * - Role-based Access Control
 * 
 * @version 1.1.0
 * @author WiT 365 Team
 */

if (typeof window.AuthService === 'undefined') {

class AuthService {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.userData = null;
        this.authStateListeners = [];
        this.initialized = false;

        // Local Sessions from Wizmobiz Main Site
        this.localSession = null;
    }

    // ===========================================
    // 🚀 Initialization
    // ===========================================

    init() {
        if (this.initialized) return;

        // Check local sessions FIRST (Academy/Marketplace sync)
        this.checkLocalSessions();

        const doInit = () => {
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                this.auth = firebase.auth();
                this.db = firebase.firestore();

                // Setup auth state observer
                this.auth.onAuthStateChanged(async (user) => {
                    this.currentUser = user;
                    if (user) {
                        await this.loadUserData(user.uid);
                    } else if (!this.localSession) {
                        this.userData = null;
                    }
                    this.notifyListeners(user);
                });

                this.initialized = true;
                console.log('✅ AuthService [V1.2.0] initialized');
            } else {
                // If firebase is loaded but not initialized yet, wait a bit
                if (typeof firebase !== 'undefined') {
                    console.log('⏳ AuthService: Waiting for Firebase initialization...');
                    setTimeout(doInit, 100);
                } else {
                    console.error('❌ Firebase not loaded');
                }
            }
        };

        doInit();
    }

    async loadUserData(uid) {
        try {
            const userDoc = await this.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                this.userData = {
                    uid: uid,
                    displayName: data.displayName || data.name || 'User',
                    avatar: data.pictureUrl || data.photoURL || data.avatar,
                    role: data.role || 'user',
                    isPremium: data.isPremium || (data.subscriptionType === 'premium') || false,
                    sellerStatus: data.sellerStatus || 'none'
                };
            }
        } catch (e) {
            console.error('Failed to load user data from Firestore:', e);
        }
    }

    /**
     * Check for legacy sessions (wizmobiz_session, wit_line_session)
     */
    checkLocalSessions() {
        try {
            // Check wizmobiz_session (Main Site)
            const wizmobizSaved = localStorage.getItem('wizmobiz_session');
            if (wizmobizSaved) {
                const session = JSON.parse(wizmobizSaved);
                if (session.loginAt) {
                    const loginAt = new Date(session.loginAt);
                    const daysSinceLogin = (Date.now() - loginAt) / (1000 * 60 * 60 * 24);
                    if (daysSinceLogin < 7) {
                        console.log('🔍 Raw Session Data:', session); // DEBUG: Inspection
                        this.localSession = session;
                        this.userData = {
                            uid: session.uid || session.lineUserId,
                            displayName: session.displayName || session.name || session.user?.displayName || session.user?.name,
                            avatar: session.pictureUrl || session.picture || session.avatar || session.user?.pictureUrl || session.user?.picture || session.user?.avatar,
                            role: 'user',
                            isPremium: session.isPremium,
                            sellerStatus: session.sellerStatus || 'none'
                        };
                        console.log('✅ Found active wizmobiz_session');
                    }
                }
            }
        } catch (e) {
            console.error('Local session check failed:', e);
        }
    }

    // ===========================================
    // 📌 Auth State Listeners
    // ===========================================

    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // Immediately call with current state
        if (this.currentUser !== undefined || this.localSession) {
            callback(this.currentUser, this.userData);
        }
        return () => {
            this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners(user) {
        this.authStateListeners.forEach(callback => {
            callback(user, this.userData);
        });
    }

    // ===========================================
    // 📧 Standard Authentication
    // ===========================================

    async login(email, password) {
        try {
            if (!email || !password) return { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async logout() {
        try {
            if (this.auth) await this.auth.signOut();
            localStorage.removeItem('wizmobiz_session');
            localStorage.removeItem('wit_line_session');
            this.currentUser = null;
            this.userData = null;
            this.localSession = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 🔑 PIN Authentication (LINE OA)
    // ===========================================

    async loginWithPin(pin) {
        try {
            const functions = firebase.functions();
            const verifyPin = functions.httpsCallable('verifyPin');
            const result = await verifyPin({ pin: pin });

            if (result.data.error) throw new Error(result.data.error);

            const userCredential = await this.auth.signInWithCustomToken(result.data.token);
            const user = userCredential.user;

            // Fetch and cache session
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            const data = userDoc.data() || {};

            const sessionData = {
                lineUserId: data.lineUserId || null,
                displayName: data.name || user.displayName,
                pictureUrl: data.pictureUrl || null,
                isPremium: data.subscriptionType === 'premium',
                loginAt: new Date().toISOString()
            };
            localStorage.setItem('wizmobiz_session', JSON.stringify(sessionData));
            this.localSession = sessionData;

            return { success: true, user: user };
        } catch (error) {
            console.error('PIN Login failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 🔒 Guards & Permissions
    // ===========================================

    async getIDToken() {
        if (this.currentUser) {
            return await this.currentUser.getIdToken();
        }
        // Fallback for local session (if any token was saved there, though usually it's just user data)
        return null;
    }

    getBackendUrl() {
        // Fly.io Go Engine URL
        return "https://tuktuk-engine.fly.dev/api/v1";
    }

    isAuthenticated() {
        return !!(this.currentUser || this.localSession);
    }

    getUserData() {
        return this.userData;
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'ไม่พบผู้ใช้งาน',
            'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
            'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง'
        };
        return errorMessages[errorCode] || errorCode;
    }
}

// Export instance
window.AuthService = new AuthService();

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.AuthService.init();
    }, 100);
});

console.log('🔐 AuthService [V1.2.0] Loaded - IAM & Backend Support');

} // End of AuthService guard
