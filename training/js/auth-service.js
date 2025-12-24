/**
 * 🔐 Authentication Service
 * =========================
 * จัดการ Authentication flows ทั้งหมดสำหรับ Training System
 * 
 * Features:
 * - Email/Password Authentication
 * - Google Sign-In
 * - Line Login (LINE LIFF)
 * - Session Management
 * - Password Reset
 * - Role-based Access Control
 * 
 * @version 1.0.0
 * @author WiT 365 Team
 */

class AuthService {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.userData = null;
        this.authStateListeners = [];
        this.initialized = false;
    }

    // ===========================================
    // 🚀 Initialization
    // ===========================================

    init() {
        if (this.initialized) return;

        if (typeof firebase !== 'undefined') {
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Setup auth state observer
            this.auth.onAuthStateChanged(async (user) => {
                this.currentUser = user;
                if (user) {
                    await this.loadUserData(user.uid);
                } else {
                    this.userData = null;
                }
                this.notifyListeners(user);
            });

            this.initialized = true;
            console.log('✅ AuthService initialized');
        } else {
            console.error('❌ Firebase not loaded');
        }
    }

    // ===========================================
    // 📌 Auth State Listeners
    // ===========================================

    /**
     * ลงทะเบียน listener สำหรับการเปลี่ยนแปลงสถานะ auth
     */
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        // Immediately call with current state
        if (this.currentUser !== undefined) {
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
    // 📧 Email/Password Authentication
    // ===========================================

    /**
     * ลงทะเบียนด้วย Email/Password
     */
    async register(email, password, additionalData = {}) {
        try {
            // Validate inputs
            if (!email || !password) {
                return { success: false, error: 'กรุณากรอก Email และ Password' };
            }

            if (password.length < 6) {
                return { success: false, error: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร' };
            }

            // Create user
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update profile
            if (additionalData.displayName) {
                await user.updateProfile({
                    displayName: additionalData.displayName
                });
            }

            // Create user document
            const userData = {
                uid: user.uid,
                email: email,
                displayName: additionalData.displayName || email.split('@')[0],
                firstName: additionalData.firstName || '',
                lastName: additionalData.lastName || '',
                phone: additionalData.phone || '',
                position: additionalData.position || '',
                department: additionalData.department || '',
                company: additionalData.company || '',
                avatar: additionalData.avatar || '',
                role: 'user', // user, instructor, admin
                status: 'active',
                enrolledCourses: [],
                completedCourses: [],
                totalPoints: 0,
                badges: [],
                preferences: {
                    language: 'th',
                    notifications: true,
                    emailUpdates: true
                },
                provider: 'email',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('training_users').doc(user.uid).set(userData);

            // Send verification email (optional)
            // await user.sendEmailVerification();

            this.userData = userData;

            return { 
                success: true, 
                user: user,
                message: 'ลงทะเบียนสำเร็จ ยินดีต้อนรับสู่ WiT 365!'
            };

        } catch (error) {
            console.error('Register error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * เข้าสู่ระบบด้วย Email/Password
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                return { success: false, error: 'กรุณากรอก Email และ Password' };
            }

            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update last login
            await this.db.collection('training_users').doc(user.uid).update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await this.loadUserData(user.uid);

            return { 
                success: true, 
                user: user,
                message: 'เข้าสู่ระบบสำเร็จ'
            };

        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // ===========================================
    // 🔵 Google Sign-In
    // ===========================================

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;

            // Check if user exists
            const userDoc = await this.db.collection('training_users').doc(user.uid).get();

            if (!userDoc.exists) {
                // Create new user document
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || '',
                    avatar: user.photoURL || '',
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: user.phoneNumber || '',
                    position: '',
                    department: '',
                    company: '',
                    role: 'user',
                    status: 'active',
                    enrolledCourses: [],
                    completedCourses: [],
                    totalPoints: 0,
                    badges: [],
                    preferences: {
                        language: 'th',
                        notifications: true,
                        emailUpdates: true
                    },
                    provider: 'google',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await this.db.collection('training_users').doc(user.uid).set(userData);
                this.userData = userData;
            } else {
                await this.db.collection('training_users').doc(user.uid).update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await this.loadUserData(user.uid);
            }

            return { 
                success: true, 
                user: user,
                message: 'เข้าสู่ระบบด้วย Google สำเร็จ'
            };

        } catch (error) {
            console.error('Google login error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // ===========================================
    // 🟢 LINE Login (via LIFF)
    // ===========================================

    async initLineLiff(liffId) {
        if (!liffId) {
            console.warn('LIFF ID not provided');
            return { success: false, error: 'LIFF ID not configured' };
        }

        try {
            await liff.init({ liffId: liffId });
            
            if (!liff.isLoggedIn()) {
                return { success: true, loggedIn: false };
            }

            return { success: true, loggedIn: true };
        } catch (error) {
            console.error('LIFF init error:', error);
            return { success: false, error: error.message };
        }
    }

    async loginWithLine() {
        try {
            if (!liff.isLoggedIn()) {
                liff.login();
                return { success: true, message: 'Redirecting to LINE login...' };
            }

            const profile = await liff.getProfile();
            
            // Create custom token via Firebase Function (need to implement)
            // For now, use LINE userId as anonymous identifier
            const lineUserId = profile.userId;
            
            // Check if user exists
            const usersRef = this.db.collection('training_users');
            const snapshot = await usersRef.where('lineUserId', '==', lineUserId).get();

            if (snapshot.empty) {
                // Create new user with LINE data
                const userRef = usersRef.doc();
                const userData = {
                    uid: userRef.id,
                    lineUserId: lineUserId,
                    email: '', // LINE doesn't provide email
                    displayName: profile.displayName,
                    avatar: profile.pictureUrl || '',
                    firstName: profile.displayName?.split(' ')[0] || '',
                    lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: '',
                    position: '',
                    department: '',
                    company: '',
                    role: 'user',
                    status: 'active',
                    enrolledCourses: [],
                    completedCourses: [],
                    totalPoints: 0,
                    badges: [],
                    preferences: {
                        language: 'th',
                        notifications: true,
                        emailUpdates: true
                    },
                    provider: 'line',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                await userRef.set(userData);
                this.userData = userData;
            } else {
                const userDoc = snapshot.docs[0];
                await userDoc.ref.update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                    avatar: profile.pictureUrl || ''
                });
                this.userData = userDoc.data();
            }

            return {
                success: true,
                lineProfile: profile,
                message: 'เข้าสู่ระบบด้วย LINE สำเร็จ'
            };

        } catch (error) {
            console.error('LINE login error:', error);
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 🚪 Logout
    // ===========================================

    async logout() {
        try {
            // Logout from Firebase
            await this.auth.signOut();

            // Logout from LINE if using LIFF
            if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
                liff.logout();
            }

            this.currentUser = null;
            this.userData = null;

            return { success: true, message: 'ออกจากระบบสำเร็จ' };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 🔑 Password Management
    // ===========================================

    /**
     * ส่งอีเมลรีเซ็ตรหัสผ่าน
     */
    async sendPasswordResetEmail(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            return { 
                success: true, 
                message: 'ส่งอีเมลรีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ'
            };
        } catch (error) {
            return { 
                success: false, 
                error: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * เปลี่ยนรหัสผ่าน
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const user = this.auth.currentUser;
            if (!user) {
                return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
            }

            // Re-authenticate
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            await user.reauthenticateWithCredential(credential);

            // Update password
            await user.updatePassword(newPassword);

            return { 
                success: true, 
                message: 'เปลี่ยนรหัสผ่านสำเร็จ'
            };
        } catch (error) {
            return { 
                success: false, 
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // ===========================================
    // 👤 User Data Management
    // ===========================================

    async loadUserData(userId) {
        try {
            const doc = await this.db.collection('training_users').doc(userId).get();
            if (doc.exists) {
                this.userData = { id: doc.id, ...doc.data() };
            }
        } catch (error) {
            console.error('Load user data error:', error);
        }
    }

    async updateProfile(data) {
        if (!this.currentUser) {
            return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
        }

        try {
            // Update Firebase Auth profile
            if (data.displayName || data.avatar) {
                await this.currentUser.updateProfile({
                    displayName: data.displayName || this.currentUser.displayName,
                    photoURL: data.avatar || this.currentUser.photoURL
                });
            }

            // Update Firestore
            await this.db.collection('training_users').doc(this.currentUser.uid).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await this.loadUserData(this.currentUser.uid);

            return { success: true, message: 'อัพเดทโปรไฟล์สำเร็จ' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 🔒 Role-based Access Control
    // ===========================================

    isAuthenticated() {
        return !!this.currentUser;
    }

    isAdmin() {
        return this.userData?.role === 'admin';
    }

    isInstructor() {
        return this.userData?.role === 'instructor' || this.isAdmin();
    }

    hasRole(role) {
        if (!this.userData) return false;
        if (this.userData.role === 'admin') return true; // Admin has all roles
        return this.userData.role === role;
    }

    /**
     * Guard function for protected pages
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            const currentUrl = window.location.href;
            sessionStorage.setItem('redirectAfterLogin', currentUrl);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Guard function for admin pages
     */
    requireAdmin(redirectUrl = 'index.html') {
        if (!this.isAdmin()) {
            alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Redirect to saved URL after login
     */
    handleRedirectAfterLogin() {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        }
    }

    // ===========================================
    // 🛠️ Utility Functions
    // ===========================================

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
            'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
            'auth/operation-not-allowed': 'การดำเนินการนี้ไม่อนุญาต',
            'auth/weak-password': 'รหัสผ่านไม่ปลอดภัยเพียงพอ',
            'auth/user-disabled': 'บัญชีนี้ถูกระงับ',
            'auth/user-not-found': 'ไม่พบผู้ใช้นี้',
            'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
            'auth/too-many-requests': 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่',
            'auth/popup-closed-by-user': 'การเข้าสู่ระบบถูกยกเลิก',
            'auth/network-request-failed': 'ไม่สามารถเชื่อมต่อเครือข่ายได้',
            'auth/invalid-credential': 'ข้อมูลรับรองไม่ถูกต้อง กรุณาตรวจสอบอีเมลและรหัสผ่าน',
            'auth/requires-recent-login': 'กรุณาเข้าสู่ระบบอีกครั้ง'
        };

        return errorMessages[errorCode] || `เกิดข้อผิดพลาด: ${errorCode}`;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserData() {
        return this.userData;
    }
}

// ===========================================
// 🌐 Export Global Instance
// ===========================================
window.AuthService = new AuthService();

// Auto-initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.AuthService.init();
    }, 100);
});

console.log('🔐 AuthService loaded - WiT 365');
