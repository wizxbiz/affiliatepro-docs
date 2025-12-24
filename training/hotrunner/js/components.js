/**
 * Hot Runner Training Center - Shared Components
 * For HtmlPro/hotrunner folder
 */

// ================================
// CONFIGURATION
// ================================
const CONFIG = {
    apiUrl: '../../user_api.php',
    quizApiUrl: '../../quiz_api.php',
    basePath: '../../',
    localStorageKeys: {
        user: 'hotrunner_user',
        progress: 'learning_progress_data',
        quizResults: 'quiz_results',
        certificates: 'certificates'
    }
};

// ================================
// USER MANAGEMENT
// ================================
const UserManager = {
    currentUser: null,

    init() {
        const stored = localStorage.getItem(CONFIG.localStorageKeys.user);
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
        return this.currentUser;
    },

    isLoggedIn() {
        return this.currentUser !== null;
    },

    getUser() {
        return this.currentUser;
    },

    async login(employeeId, password) {
        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', employee_id: employeeId, password })
            });
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem(CONFIG.localStorageKeys.user, JSON.stringify(data.user));
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            if (employeeId && password) {
                this.currentUser = {
                    id: Date.now(),
                    employee_id: employeeId,
                    name: employeeId,
                    department: 'Unknown',
                    role: 'user'
                };
                localStorage.setItem(CONFIG.localStorageKeys.user, JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            }
            return { success: false, message: 'Login failed' };
        }
    },

    async register(userData) {
        try {
            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'register', ...userData })
            });
            return await response.json();
        } catch (error) {
            console.error('Register error:', error);
            this.currentUser = {
                id: Date.now(),
                ...userData,
                role: 'user'
            };
            localStorage.setItem(CONFIG.localStorageKeys.user, JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        }
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem(CONFIG.localStorageKeys.user);
        window.location.href = CONFIG.basePath + 'index.html';
    }
};

// ================================
// PROGRESS TRACKING
// ================================
const ProgressTracker = {
    data: null,

    init() {
        const stored = localStorage.getItem(CONFIG.localStorageKeys.progress);
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            this.data = {
                overall: 0,
                modules: {},
                lastActivity: null
            };
        }
        return this.data;
    },

    getProgress() {
        return this.data;
    },

    updateModuleProgress(moduleId, progress) {
        this.data.modules[moduleId] = Math.min(100, progress);
        this.data.lastActivity = new Date().toISOString();
        this.calculateOverall();
        this.save();
    },

    completeModule(moduleId) {
        this.data.modules[moduleId] = 100;
        this.data.lastActivity = new Date().toISOString();
        this.calculateOverall();
        this.save();
        ActivityLogger.log('module_complete', { moduleId });
    },

    calculateOverall() {
        const modules = Object.values(this.data.modules);
        if (modules.length === 0) {
            this.data.overall = 0;
        } else {
            this.data.overall = Math.round(modules.reduce((a, b) => a + b, 0) / modules.length);
        }
    },

    save() {
        localStorage.setItem(CONFIG.localStorageKeys.progress, JSON.stringify(this.data));
        if (UserManager.isLoggedIn()) {
            this.syncToServer();
        }
    },

    async syncToServer() {
        try {
            await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_progress',
                    user_id: UserManager.getUser().id,
                    progress: this.data
                })
            });
        } catch (error) {
            console.error('Sync error:', error);
        }
    }
};

// ================================
// ACTIVITY LOGGER
// ================================
const ActivityLogger = {
    maxLogs: 50,

    log(type, data = {}) {
        const logs = this.getLogs();
        logs.unshift({
            type,
            data,
            timestamp: new Date().toISOString(),
            userId: UserManager.getUser()?.id
        });
        
        if (logs.length > this.maxLogs) {
            logs.length = this.maxLogs;
        }
        
        localStorage.setItem('activity_logs', JSON.stringify(logs));
    },

    getLogs() {
        return JSON.parse(localStorage.getItem('activity_logs') || '[]');
    },

    getRecentLogs(count = 10) {
        return this.getLogs().slice(0, count);
    }
};

// ================================
// NAVIGATION COMPONENT
// ================================
const Navigation = {
    render(containerId = 'navbar') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const user = UserManager.getUser();
        const isLoggedIn = UserManager.isLoggedIn();
        const basePath = CONFIG.basePath;

        container.innerHTML = `
            <nav class="main-navbar">
                <div class="nav-container">
                    <a href="${basePath}index.html" class="nav-logo">
                        <i class="fas fa-fire-flame-curved"></i>
                        <span>Hot Runner Training</span>
                    </a>
                    
                    <button class="nav-toggle" onclick="Navigation.toggleMenu()">
                        <i class="fas fa-bars"></i>
                    </button>
                    
                    <div class="nav-menu" id="navMenu">
                        <a href="${basePath}index.html" class="nav-link">
                            <i class="fas fa-home"></i> หน้าหลัก
                        </a>
                        <a href="index.html" class="nav-link active">
                            <i class="fas fa-fire"></i> Hot Runner
                        </a>
                        <a href="${basePath}my-learning.html" class="nav-link">
                            <i class="fas fa-book-open"></i> การเรียนของฉัน
                        </a>
                        <a href="${basePath}quiz.html?type=pretest" class="nav-link">
                            <i class="fas fa-clipboard-check"></i> ทำแบบทดสอบ
                        </a>
                        <a href="${basePath}certificate.html" class="nav-link">
                            <i class="fas fa-certificate"></i> ใบรับรอง
                        </a>
                    </div>
                    
                    <div class="nav-user">
                        ${isLoggedIn ? `
                            <div class="user-dropdown">
                                <button class="user-btn" onclick="Navigation.toggleUserMenu()">
                                    <div class="user-avatar">${user.name.charAt(0)}</div>
                                    <span class="user-name">${user.name}</span>
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <div class="user-menu" id="userMenu">
                                    <a href="${basePath}my-learning.html"><i class="fas fa-user"></i> โปรไฟล์</a>
                                    <a href="${basePath}certificate.html"><i class="fas fa-certificate"></i> ใบรับรอง</a>
                                    <hr>
                                    <a href="#" onclick="UserManager.logout(); return false;">
                                        <i class="fas fa-sign-out-alt"></i> ออกจากระบบ
                                    </a>
                                </div>
                            </div>
                        ` : `
                            <a href="${basePath}index.html?login=1" class="nav-btn-login">
                                <i class="fas fa-sign-in-alt"></i> เข้าสู่ระบบ
                            </a>
                        `}
                    </div>
                </div>
            </nav>
        `;

        this.addStyles();
    },

    toggleMenu() {
        document.getElementById('navMenu').classList.toggle('active');
    },

    toggleUserMenu() {
        document.getElementById('userMenu').classList.toggle('active');
    },

    addStyles() {
        if (document.getElementById('nav-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'nav-styles';
        style.textContent = `
            .main-navbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: rgba(15, 23, 36, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 1000;
                padding: 0 20px;
            }
            
            .nav-container {
                max-width: 1400px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 70px;
            }
            
            .nav-logo {
                display: flex;
                align-items: center;
                gap: 10px;
                text-decoration: none;
                color: #fff;
                font-family: 'Prompt', sans-serif;
                font-weight: 600;
                font-size: 1.2em;
            }
            
            .nav-logo i {
                font-size: 1.5em;
                color: #ff6b35;
            }
            
            .nav-menu {
                display: flex;
                gap: 5px;
            }
            
            .nav-link {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 18px;
                color: rgba(255, 255, 255, 0.7);
                text-decoration: none;
                border-radius: 8px;
                transition: all 0.3s ease;
            }
            
            .nav-link:hover,
            .nav-link.active {
                color: #00d9ff;
                background: rgba(0, 217, 255, 0.1);
            }
            
            .nav-toggle {
                display: none;
                background: none;
                border: none;
                color: #fff;
                font-size: 1.5em;
                cursor: pointer;
            }
            
            .nav-user {
                display: flex;
                align-items: center;
            }
            
            .user-dropdown {
                position: relative;
            }
            
            .user-btn {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 15px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 25px;
                color: #fff;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .user-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: linear-gradient(135deg, #00d9ff, #0066ff);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
            }
            
            .user-name {
                max-width: 100px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .user-menu {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 10px;
                background: #1e2a3d;
                border-radius: 10px;
                min-width: 200px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }
            
            .user-menu.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .user-menu a {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 18px;
                color: rgba(255, 255, 255, 0.8);
                text-decoration: none;
                transition: all 0.3s ease;
            }
            
            .user-menu a:hover {
                background: rgba(0, 217, 255, 0.1);
                color: #00d9ff;
            }
            
            .user-menu hr {
                border: none;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                margin: 5px 0;
            }
            
            .nav-btn-login {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 25px;
                background: linear-gradient(135deg, #00d9ff 0%, #0066ff 100%);
                border: none;
                border-radius: 25px;
                color: #fff;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s ease;
            }
            
            .nav-btn-login:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(0, 217, 255, 0.3);
            }
            
            @media (max-width: 992px) {
                .nav-toggle {
                    display: block;
                }
                
                .nav-menu {
                    position: fixed;
                    top: 70px;
                    left: 0;
                    right: 0;
                    background: rgba(15, 23, 36, 0.98);
                    flex-direction: column;
                    padding: 20px;
                    transform: translateY(-100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .nav-menu.active {
                    transform: translateY(0);
                    opacity: 1;
                }
                
                .user-name {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// ================================
// NOTIFICATION SYSTEM
// ================================
const Notify = {
    show(message, type = 'info', duration = 3000) {
        const container = this.getContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); },

    getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'times-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    getContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 90px;
                right: 20px;
                z-index: 2000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
            
            const style = document.createElement('style');
            style.textContent = `
                .notification {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    color: #fff;
                    animation: notifySlideIn 0.3s ease;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .notification-success { background: linear-gradient(135deg, #00c853, #00e676); }
                .notification-error { background: linear-gradient(135deg, #f44336, #ff8a80); }
                .notification-warning { background: linear-gradient(135deg, #ff9800, #ffc107); }
                .notification-info { background: linear-gradient(135deg, #00d9ff, #0066ff); }
                
                .notification button {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    cursor: pointer;
                    padding: 5px;
                }
                
                .notification.fade-out {
                    animation: notifySlideOut 0.3s ease forwards;
                }
                
                @keyframes notifySlideIn {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes notifySlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        return container;
    }
};

// ================================
// UTILITY FUNCTIONS
// ================================
const Utils = {
    formatDate(date, format = 'short') {
        const d = new Date(date);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                       'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const fullMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        
        if (format === 'full') {
            return `${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
        }
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    getGrade(score) {
        if (score >= 90) return { grade: 'A', label: 'ดีเยี่ยม', color: '#00c853' };
        if (score >= 80) return { grade: 'B', label: 'ดี', color: '#69f0ae' };
        if (score >= 70) return { grade: 'C', label: 'พอใช้', color: '#ffd740' };
        if (score >= 60) return { grade: 'D', label: 'ผ่าน', color: '#ff9800' };
        return { grade: 'F', label: 'ไม่ผ่าน', color: '#f44336' };
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ================================
// QUIZ TRACKER (For Module Quizzes)
// ================================
const QuizTracker = {
    startQuiz(moduleId) {
        const quizData = {
            moduleId,
            startTime: new Date().toISOString(),
            answers: {}
        };
        sessionStorage.setItem('current_quiz', JSON.stringify(quizData));
        ActivityLogger.log('quiz_start', { moduleId });
    },

    saveAnswer(questionId, answer) {
        const quizData = JSON.parse(sessionStorage.getItem('current_quiz') || '{}');
        if (quizData.answers) {
            quizData.answers[questionId] = answer;
            sessionStorage.setItem('current_quiz', JSON.stringify(quizData));
        }
    },

    endQuiz(score, total) {
        const quizData = JSON.parse(sessionStorage.getItem('current_quiz') || '{}');
        const result = {
            ...quizData,
            endTime: new Date().toISOString(),
            score,
            total,
            percentage: Math.round((score / total) * 100)
        };
        
        // Save to results
        const results = JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.quizResults) || '[]');
        results.push(result);
        localStorage.setItem(CONFIG.localStorageKeys.quizResults, JSON.stringify(results));
        
        // Log activity
        ActivityLogger.log('quiz_complete', { 
            moduleId: quizData.moduleId, 
            score: result.percentage 
        });
        
        sessionStorage.removeItem('current_quiz');
        return result;
    },

    getResults(moduleId = null) {
        const results = JSON.parse(localStorage.getItem(CONFIG.localStorageKeys.quizResults) || '[]');
        if (moduleId) {
            return results.filter(r => r.moduleId === moduleId);
        }
        return results;
    }
};

// ================================
// INITIALIZATION
// ================================
document.addEventListener('DOMContentLoaded', function() {
    UserManager.init();
    ProgressTracker.init();
    
    // Render navigation if container exists
    if (document.getElementById('navbar')) {
        Navigation.render('navbar');
    }
    
    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-dropdown')) {
            const userMenu = document.getElementById('userMenu');
            if (userMenu) userMenu.classList.remove('active');
        }
        if (!e.target.closest('.nav-toggle') && !e.target.closest('.nav-menu')) {
            const navMenu = document.getElementById('navMenu');
            if (navMenu) navMenu.classList.remove('active');
        }
    });
});

// Export for use in other files
window.UserManager = UserManager;
window.ProgressTracker = ProgressTracker;
window.ActivityLogger = ActivityLogger;
window.Navigation = Navigation;
window.Notify = Notify;
window.Utils = Utils;
window.QuizTracker = QuizTracker;
