/**
 * Injection Molding Training Portal - Main JavaScript Framework
 * Version: 2.0.0
 * Description: Unified components for all training modules
 */

// ==================== Configuration ====================
const CONFIG = {
    appName: 'Injection Molding Training Portal',
    version: '2.0.0',
    basePath: '',
    storagePrefix: 'imtp_',
    levels: ['basic', 'advanced', 'expert'],
    passingScore: 70
};

// ==================== Utility Functions ====================
const Utils = {
    // Generate unique ID
    generateId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    
    // Format date
    formatDate: (date, locale = 'th-TH') => {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Format time ago
    formatTimeAgo: (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'เมื่อสักครู่';
        if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        if (days < 7) return `${days} วันที่แล้ว`;
        return Utils.formatDate(date);
    },
    
    // Shuffle array
    shuffleArray: (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    // Deep clone object
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    
    // Get query params
    getQueryParams: () => {
        const params = {};
        new URLSearchParams(window.location.search).forEach((value, key) => {
            params[key] = value;
        });
        return params;
    }
};

// ==================== Storage Manager ====================
const Storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(CONFIG.storagePrefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(CONFIG.storagePrefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    remove: (key) => {
        localStorage.removeItem(CONFIG.storagePrefix + key);
    },
    
    clear: () => {
        Object.keys(localStorage)
            .filter(key => key.startsWith(CONFIG.storagePrefix))
            .forEach(key => localStorage.removeItem(key));
    }
};

// ==================== User Manager ====================
const UserManager = {
    currentUser: null,
    
    init: () => {
        UserManager.currentUser = Storage.get('user', null);
        UserManager.updateUI();
    },
    
    login: (userData) => {
        UserManager.currentUser = {
            ...userData,
            loginTime: new Date().toISOString()
        };
        Storage.set('user', UserManager.currentUser);
        UserManager.updateUI();
        Toast.success('เข้าสู่ระบบสำเร็จ');
        return true;
    },
    
    logout: () => {
        UserManager.currentUser = null;
        Storage.remove('user');
        UserManager.updateUI();
        Toast.info('ออกจากระบบแล้ว');
    },
    
    isLoggedIn: () => UserManager.currentUser !== null,
    
    getUser: () => UserManager.currentUser,
    
    updateUI: () => {
        const userArea = document.getElementById('userArea');
        if (!userArea) return;
        
        if (UserManager.isLoggedIn()) {
            const user = UserManager.currentUser;
            userArea.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${user.name?.charAt(0) || 'U'}</div>
                    <span class="user-name">${user.name || 'ผู้ใช้'}</span>
                    <button class="btn btn-sm btn-outline" onclick="UserManager.logout()">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            userArea.innerHTML = `
                <button class="btn btn-primary" onclick="showLoginModal()">
                    <i class="fas fa-sign-in-alt"></i> เข้าสู่ระบบ
                </button>
            `;
        }
    }
};

// ==================== Progress Tracker ====================
const ProgressTracker = {
    getProgress: () => Storage.get('progress', {}),
    
    getCourseProgress: (courseId) => {
        const progress = ProgressTracker.getProgress();
        return progress[courseId] || { completed: false, score: 0, modules: {} };
    },
    
    updateModuleProgress: (courseId, moduleId, data) => {
        const progress = ProgressTracker.getProgress();
        
        if (!progress[courseId]) {
            progress[courseId] = { completed: false, score: 0, modules: {} };
        }
        
        progress[courseId].modules[moduleId] = {
            ...progress[courseId].modules[moduleId],
            ...data,
            lastUpdated: new Date().toISOString()
        };
        
        // Calculate course completion
        const modules = progress[courseId].modules;
        const moduleCount = Object.keys(modules).length;
        const completedCount = Object.values(modules).filter(m => m.completed).length;
        
        progress[courseId].score = Math.round((completedCount / moduleCount) * 100);
        progress[courseId].completed = progress[courseId].score === 100;
        
        Storage.set('progress', progress);
        
        // Log activity
        ActivityLogger.log('progress', courseId, `อัปเดตความก้าวหน้า: ${moduleId}`);
        
        return progress[courseId];
    },
    
    completeModule: (courseId, moduleId, score = 100) => {
        return ProgressTracker.updateModuleProgress(courseId, moduleId, {
            completed: true,
            score: score,
            completedAt: new Date().toISOString()
        });
    },
    
    getLevelProgress: (level) => {
        const progress = ProgressTracker.getProgress();
        const levelCourses = Object.keys(progress).filter(key => key.startsWith(level));
        
        if (levelCourses.length === 0) return 0;
        
        const totalScore = levelCourses.reduce((sum, key) => sum + (progress[key].score || 0), 0);
        return Math.round(totalScore / levelCourses.length);
    },
    
    getOverallProgress: () => {
        const progress = ProgressTracker.getProgress();
        const courses = Object.values(progress);
        
        if (courses.length === 0) return { total: 0, completed: 0, percentage: 0 };
        
        const completed = courses.filter(c => c.completed).length;
        return {
            total: courses.length,
            completed: completed,
            percentage: Math.round((completed / courses.length) * 100)
        };
    }
};

// ==================== Activity Logger ====================
const ActivityLogger = {
    log: (type, module, description) => {
        const activities = Storage.get('activities', []);
        
        activities.unshift({
            id: Utils.generateId(),
            type: type,
            module: module,
            description: description,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.pop();
        }
        
        Storage.set('activities', activities);
    },
    
    getActivities: (limit = 20) => {
        const activities = Storage.get('activities', []);
        return activities.slice(0, limit);
    },
    
    clear: () => Storage.remove('activities')
};

// ==================== Quiz Tracker ====================
const QuizTracker = {
    currentQuiz: null,
    startTime: null,
    
    startQuiz: (quizId, totalQuestions) => {
        QuizTracker.currentQuiz = {
            id: quizId,
            totalQuestions: totalQuestions,
            answers: {},
            startTime: new Date().toISOString()
        };
        QuizTracker.startTime = Date.now();
        ActivityLogger.log('quiz_start', quizId, 'เริ่มทำแบบทดสอบ');
    },
    
    submitAnswer: (questionIndex, answer) => {
        if (!QuizTracker.currentQuiz) return;
        QuizTracker.currentQuiz.answers[questionIndex] = answer;
    },
    
    endQuiz: (correctAnswers, totalQuestions) => {
        if (!QuizTracker.currentQuiz) return null;
        
        const duration = Math.round((Date.now() - QuizTracker.startTime) / 1000);
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const passed = score >= CONFIG.passingScore;
        
        const result = {
            ...QuizTracker.currentQuiz,
            correctAnswers: correctAnswers,
            score: score,
            passed: passed,
            duration: duration,
            endTime: new Date().toISOString()
        };
        
        // Save to history
        const history = Storage.get('quiz_history', []);
        history.unshift(result);
        Storage.set('quiz_history', history.slice(0, 50));
        
        // Update progress
        ProgressTracker.completeModule(
            QuizTracker.currentQuiz.id.split('_')[0],
            QuizTracker.currentQuiz.id,
            score
        );
        
        ActivityLogger.log('quiz_complete', QuizTracker.currentQuiz.id, 
            `ทำแบบทดสอบเสร็จ: ${score}%`);
        
        QuizTracker.currentQuiz = null;
        return result;
    },
    
    getHistory: (quizId = null) => {
        const history = Storage.get('quiz_history', []);
        return quizId ? history.filter(q => q.id === quizId) : history;
    }
};

// ==================== Toast Notifications ====================
const Toast = {
    container: null,
    
    init: () => {
        if (Toast.container) return;
        
        Toast.container = document.createElement('div');
        Toast.container.className = 'toast-container';
        document.body.appendChild(Toast.container);
    },
    
    show: (message, type = 'info', duration = 3000) => {
        Toast.init();
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: '#00c853',
            error: '#f44336',
            warning: '#ff9800',
            info: '#00d9ff'
        };
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.2em;"></i>
            <span>${message}</span>
        `;
        
        Toast.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success: (msg) => Toast.show(msg, 'success'),
    error: (msg) => Toast.show(msg, 'error'),
    warning: (msg) => Toast.show(msg, 'warning'),
    info: (msg) => Toast.show(msg, 'info')
};

// ==================== Navigation Builder ====================
const Navigation = {
    build: () => {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        
        const currentPath = window.location.pathname;
        
        navbar.innerHTML = `
            <nav class="navbar">
                <a href="${CONFIG.basePath}/index.html" class="navbar-brand">
                    <i class="fas fa-industry"></i>
                    <span>Injection Molding Training</span>
                </a>
                <div class="navbar-menu">
                    <a href="${CONFIG.basePath}/index.html" class="navbar-item ${currentPath.endsWith('index.html') ? 'active' : ''}">
                        <i class="fas fa-home"></i> หน้าแรก
                    </a>
                    <a href="${CONFIG.basePath}/courses/basic/index.html" class="navbar-item ${currentPath.includes('/basic/') ? 'active' : ''}">
                        <i class="fas fa-seedling"></i> Basic
                    </a>
                    <a href="${CONFIG.basePath}/courses/advanced/index.html" class="navbar-item ${currentPath.includes('/advanced/') ? 'active' : ''}">
                        <i class="fas fa-fire-alt"></i> Advanced
                    </a>
                    <a href="${CONFIG.basePath}/courses/expert/index.html" class="navbar-item ${currentPath.includes('/expert/') ? 'active' : ''}">
                        <i class="fas fa-crown"></i> Expert
                    </a>
                    <a href="${CONFIG.basePath}/learning-path.html" class="navbar-item">
                        <i class="fas fa-route"></i> เส้นทาง
                    </a>
                </div>
                <div id="userArea"></div>
            </nav>
        `;
        
        UserManager.init();
    }
};

// ==================== Course Data ====================
const CourseData = {
    basic: {
        id: 'basic',
        title: 'Basic Level',
        titleTh: 'ระดับพื้นฐาน',
        description: 'พื้นฐานการฉีดพลาสติกและระบบ Hot Runner',
        icon: 'fa-seedling',
        color: 'primary',
        modules: [
            { id: 'intro', title: 'รู้จักกับ Injection Molding', duration: 30, type: 'theory' },
            { id: 'machine', title: 'เครื่องฉีดพลาสติก', duration: 45, type: 'theory' },
            { id: 'material', title: 'วัสดุพลาสติก', duration: 40, type: 'theory' },
            { id: 'hotrunner_basic', title: 'Hot Runner เบื้องต้น', duration: 45, type: 'theory' },
            { id: 'safety', title: 'ความปลอดภัย', duration: 30, type: 'practice' },
            { id: 'quiz_basic', title: 'แบบทดสอบพื้นฐาน', duration: 20, type: 'quiz' }
        ]
    },
    advanced: {
        id: 'advanced',
        title: 'Advanced Level',
        titleTh: 'ระดับกลาง',
        description: 'การควบคุมขั้นสูงและการแก้ปัญหา',
        icon: 'fa-fire-alt',
        color: 'secondary',
        modules: [
            { id: 'pid_control', title: 'PID Temperature Control', duration: 60, type: 'theory' },
            { id: 'troubleshooting', title: 'การวิเคราะห์ปัญหา', duration: 60, type: 'practice' },
            { id: 'optimization', title: 'การเพิ่มประสิทธิภาพ', duration: 45, type: 'practice' },
            { id: 'maintenance', title: 'การบำรุงรักษา', duration: 45, type: 'practice' },
            { id: 'quality', title: 'การควบคุมคุณภาพ', duration: 50, type: 'theory' },
            { id: 'quiz_advanced', title: 'แบบทดสอบขั้นกลาง', duration: 25, type: 'quiz' }
        ]
    },
    expert: {
        id: 'expert',
        title: 'Expert Level',
        titleTh: 'ระดับผู้เชี่ยวชาญ',
        description: 'การจำลองและวิเคราะห์ขั้นสูง',
        icon: 'fa-crown',
        color: 'expert',
        modules: [
            { id: 'simulation_3d', title: '3D Simulation', duration: 90, type: 'simulation' },
            { id: 'roi_analysis', title: 'ROI Analysis', duration: 60, type: 'practice' },
            { id: 'advanced_design', title: 'Hot Runner Design', duration: 75, type: 'theory' },
            { id: 'case_study', title: 'กรณีศึกษา', duration: 60, type: 'practice' },
            { id: 'certification', title: 'ประกาศนียบัตร', duration: 30, type: 'certificate' }
        ]
    }
};

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    Navigation.build();
    
    // Track page view
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    ActivityLogger.log('view', currentPage, `เข้าชมหน้า ${document.title}`);
});

// Export for use in other files
window.CONFIG = CONFIG;
window.Utils = Utils;
window.Storage = Storage;
window.UserManager = UserManager;
window.ProgressTracker = ProgressTracker;
window.ActivityLogger = ActivityLogger;
window.QuizTracker = QuizTracker;
window.Toast = Toast;
window.Navigation = Navigation;
window.CourseData = CourseData;
