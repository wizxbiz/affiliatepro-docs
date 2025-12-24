/**
 * 🏭 Injection Molding Learning - Main Application
 * ================================================
 * UI interactions, animations, and event handlers
 */

// ===========================================
// 🚀 Application State
// ===========================================
const AppState = {
    isLoggedIn: false,
    currentUser: null,
    currentLesson: null,
    currentQuiz: null,
    quizAnswers: [],
    quizStartTime: null,
    lessonStartTime: null
};

// ===========================================
// 📦 DOM Elements
// ===========================================
const DOM = {
    // Navigation
    navbar: document.getElementById('navbar'),
    loginBtn: document.getElementById('loginBtn'),
    userSection: document.getElementById('userSection'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userXP: document.getElementById('userXP'),
    
    // Modals
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    lessonModal: document.getElementById('lessonModal'),
    quizModal: document.getElementById('quizModal'),
    
    // Forms
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    
    // Learning Content
    learningPath: document.getElementById('learningPath'),
    leaderboardList: document.getElementById('leaderboardList'),
    badgesGrid: document.getElementById('badgesGrid'),
    
    // Stats
    statsCards: document.querySelectorAll('.stat-number'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ===========================================
// 🎬 Initialization
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏭 Injection Molding Learning System Starting...');
    
    // Initialize UI
    initializeNavbar();
    initializeModals();
    initializeAnimations();
    
    // Check Firebase
    if (typeof firebase !== 'undefined') {
        try {
            await learningService.initialize();
            
            if (learningService.currentUser) {
                updateUIForLoggedInUser();
            }
            
            // Load initial data
            loadLeaderboard();
            renderLearningPath();
            renderBadges();
            animateStats();
            
        } catch (error) {
            console.error('Firebase init error:', error);
            showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        }
    } else {
        console.log('Firebase not loaded - Running in demo mode');
        renderLearningPath();
        renderBadges();
        animateStats();
    }
});

// ===========================================
// 🧭 Navigation
// ===========================================
function initializeNavbar() {
    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            DOM.navbar?.classList.add('scrolled');
        } else {
            DOM.navbar?.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    menuToggle?.addEventListener('click', () => {
        navLinks?.classList.toggle('active');
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            target?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ===========================================
// 🪟 Modal Management
// ===========================================
function initializeModals() {
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Tab switching in auth modals
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Form submissions
    DOM.loginForm?.addEventListener('submit', handleLogin);
    DOM.registerForm?.addEventListener('submit', handleRegister);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function switchAuthTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}Tab`);
    });
}

// ===========================================
// 🔐 Authentication
// ===========================================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = e.target.querySelector('button[type="submit"]');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...';

    const result = await learningService.signIn(email, password);
    
    if (result.success) {
        showToast('เข้าสู่ระบบสำเร็จ! 🎉', 'success');
        closeModal('loginModal');
        updateUIForLoggedInUser();
        renderLearningPath();
    } else {
        showToast(result.error, 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = 'เข้าสู่ระบบ';
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = e.target.querySelector('button[type="submit"]');

    if (password !== confirmPassword) {
        showToast('รหัสผ่านไม่ตรงกัน', 'error');
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสมัครสมาชิก...';

    const result = await learningService.signUp(email, password, name);
    
    if (result.success) {
        showToast('สมัครสมาชิกสำเร็จ! 🎉', 'success');
        closeModal('loginModal');
        updateUIForLoggedInUser();
        renderLearningPath();
    } else {
        showToast(result.error, 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = 'สมัครสมาชิก';
}

async function handleLogout() {
    await learningService.signOut();
    showToast('ออกจากระบบแล้ว', 'info');
    updateUIForLoggedOutUser();
    renderLearningPath();
}

function updateUIForLoggedInUser() {
    AppState.isLoggedIn = true;
    AppState.currentUser = learningService.currentUser;
    
    // Update navbar
    if (DOM.loginBtn) DOM.loginBtn.style.display = 'none';
    if (DOM.userSection) DOM.userSection.style.display = 'flex';
    
    // Update user info
    const progress = learningService.userProgress;
    if (progress) {
        if (DOM.userName) DOM.userName.textContent = progress.displayName || 'Learner';
        if (DOM.userXP) DOM.userXP.textContent = `${progress.totalXP || 0} XP`;
        if (DOM.userAvatar) {
            DOM.userAvatar.textContent = (progress.displayName || 'L').charAt(0).toUpperCase();
        }
    }
}

function updateUIForLoggedOutUser() {
    AppState.isLoggedIn = false;
    AppState.currentUser = null;
    
    if (DOM.loginBtn) DOM.loginBtn.style.display = 'flex';
    if (DOM.userSection) DOM.userSection.style.display = 'none';
}

// ===========================================
// 📚 Learning Path Rendering
// ===========================================
function renderLearningPath() {
    const container = DOM.learningPath;
    if (!container || !CURRICULUM) return;

    container.innerHTML = '';

    Object.keys(CURRICULUM).forEach((levelKey, index) => {
        const level = CURRICULUM[levelKey];
        const progress = learningService.userProgress 
            ? learningService.getLevelProgress(level.id) 
            : { percentage: 0, lessonsCompleted: 0 };
        
        const isUnlocked = !level.requiredLevel || 
            (learningService.userProgress?.currentLevel >= level.requiredLevel);
        const isCompleted = learningService.userProgress?.quizzesCompleted?.includes(level.quiz?.id);

        const card = document.createElement('div');
        card.className = `level-card ${isUnlocked ? '' : 'locked'} ${isCompleted ? 'completed' : ''}`;
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="level-header" style="background: ${level.gradient}">
                <div class="level-icon">
                    <i class="fas ${level.icon}"></i>
                </div>
                <div class="level-info">
                    <span class="level-number">Level ${level.id}</span>
                    <h3 class="level-title">${level.title}</h3>
                </div>
                <div class="level-progress-ring">
                    <svg viewBox="0 0 36 36">
                        <path class="ring-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="ring-progress"
                            stroke-dasharray="${progress.percentage}, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span class="progress-text">${progress.percentage}%</span>
                </div>
            </div>
            <div class="level-body">
                <p class="level-description">${level.description}</p>
                <div class="lessons-list">
                    ${renderLessonsList(level, progress)}
                </div>
                ${level.quiz ? `
                    <div class="quiz-section">
                        <button class="btn-quiz ${isQuizAvailable(level) ? '' : 'disabled'}" 
                                onclick="startQuiz('${level.quiz.id}')"
                                ${isQuizAvailable(level) ? '' : 'disabled'}>
                            <i class="fas fa-clipboard-check"></i>
                            ${level.quiz.title}
                            ${isQuizCompleted(level) ? '<i class="fas fa-check-circle"></i>' : ''}
                        </button>
                    </div>
                ` : ''}
            </div>
            ${!isUnlocked ? `
                <div class="level-locked-overlay">
                    <i class="fas fa-lock"></i>
                    <span>จบ Level ${level.requiredLevel} เพื่อปลดล็อค</span>
                </div>
            ` : ''}
        `;

        container.appendChild(card);
    });
}

function renderLessonsList(level, progress) {
    if (!level.lessons) return '';

    return level.lessons.map((lesson, index) => {
        const isCompleted = learningService.userProgress?.lessonsCompleted?.includes(lesson.id);
        const isUnlocked = learningService.isLessonUnlocked?.(lesson.id) || index === 0;

        return `
            <div class="lesson-item ${isCompleted ? 'completed' : ''} ${isUnlocked ? '' : 'locked'}"
                 onclick="${isUnlocked ? `openLesson('${lesson.id}')` : ''}">
                <div class="lesson-status">
                    ${isCompleted 
                        ? '<i class="fas fa-check-circle"></i>' 
                        : isUnlocked 
                            ? `<span class="lesson-number">${index + 1}</span>`
                            : '<i class="fas fa-lock"></i>'}
                </div>
                <div class="lesson-info">
                    <span class="lesson-title">${lesson.title}</span>
                    <span class="lesson-meta">
                        <i class="fas fa-clock"></i> ${lesson.duration}
                        <i class="fas fa-star"></i> ${lesson.xp} XP
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function isQuizAvailable(level) {
    if (!level.lessons) return false;
    return level.lessons.every(lesson => 
        learningService.userProgress?.lessonsCompleted?.includes(lesson.id)
    );
}

function isQuizCompleted(level) {
    return learningService.userProgress?.quizzesCompleted?.includes(level.quiz?.id);
}

// ===========================================
// 📖 Lesson Modal
// ===========================================
function openLesson(lessonId) {
    if (!AppState.isLoggedIn) {
        showToast('กรุณาเข้าสู่ระบบก่อนเรียน', 'warning');
        openModal('loginModal');
        return;
    }

    const { lesson, level } = learningService.getLesson(lessonId) || {};
    if (!lesson) {
        showToast('ไม่พบบทเรียน', 'error');
        return;
    }

    AppState.currentLesson = lesson;
    AppState.lessonStartTime = Date.now();

    // Update modal content
    const modal = document.getElementById('lessonModal');
    modal.querySelector('.modal-title').textContent = lesson.title;
    
    const contentContainer = modal.querySelector('.lesson-content');
    contentContainer.innerHTML = renderLessonContent(lesson);

    openModal('lessonModal');
}

function renderLessonContent(lesson) {
    if (!lesson.content) {
        return `
            <div class="lesson-placeholder">
                <i class="fas fa-book-open"></i>
                <h3>${lesson.title}</h3>
                <p>เนื้อหาบทเรียนกำลังอยู่ในระหว่างการพัฒนา</p>
                <p><strong>วัตถุประสงค์:</strong></p>
                <ul>
                    ${lesson.objectives?.map(obj => `<li>${obj}</li>`).join('') || '<li>ไม่มีข้อมูล</li>'}
                </ul>
            </div>
        `;
    }

    let html = '<div class="lesson-sections">';
    
    lesson.content.sections?.forEach((section, index) => {
        html += `
            <div class="lesson-section" style="animation-delay: ${index * 0.1}s">
                <h3 class="section-title">${section.title}</h3>
                <div class="section-content">${formatContent(section.content)}</div>
            </div>
        `;
    });

    if (lesson.content.keyPoints) {
        html += `
            <div class="key-points">
                <h4><i class="fas fa-key"></i> Key Points</h4>
                <ul>
                    ${lesson.content.keyPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function formatContent(content) {
    // Convert markdown-like formatting to HTML
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n•/g, '<br>•')
        .replace(/\n❓/g, '<br>❓')
        .replace(/\n❌/g, '<br>❌')
        .replace(/\n✅/g, '<br>✅')
        .replace(/\n/g, '<br>');
}

async function completeLesson() {
    if (!AppState.currentLesson) return;

    const studyTime = Math.round((Date.now() - AppState.lessonStartTime) / 60000);
    const result = await learningService.completeLesson(AppState.currentLesson.id, studyTime);

    if (result.success && !result.alreadyCompleted) {
        showToast(`บทเรียนสำเร็จ! +${result.xpEarned} XP 🎉`, 'success');
        
        // Show badges earned
        result.badges?.forEach(badge => {
            setTimeout(() => {
                showBadgeNotification(badge);
            }, 500);
        });

        // Update UI
        renderLearningPath();
        updateUIForLoggedInUser();
    }

    closeModal('lessonModal');

    // Auto open next lesson
    if (result.nextLesson && !result.nextLesson.id?.startsWith('Q')) {
        setTimeout(() => {
            openLesson(result.nextLesson.id);
        }, 1000);
    }
}

// ===========================================
// 📝 Quiz Modal
// ===========================================
function startQuiz(quizId) {
    if (!AppState.isLoggedIn) {
        showToast('กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ', 'warning');
        openModal('loginModal');
        return;
    }

    const { quiz, level } = learningService.getQuiz(quizId) || {};
    if (!quiz) {
        showToast('ไม่พบแบบทดสอบ', 'error');
        return;
    }

    if (!quiz.questions || quiz.questions.length === 0) {
        showToast('แบบทดสอบกำลังอยู่ในระหว่างการพัฒนา', 'info');
        return;
    }

    AppState.currentQuiz = quiz;
    AppState.quizAnswers = new Array(quiz.questions.length).fill(null);
    AppState.quizStartTime = Date.now();

    renderQuiz(quiz);
    openModal('quizModal');
}

function renderQuiz(quiz) {
    const modal = document.getElementById('quizModal');
    modal.querySelector('.modal-title').textContent = quiz.title;
    
    const contentContainer = modal.querySelector('.quiz-content');
    
    let html = `
        <div class="quiz-info">
            <span><i class="fas fa-question-circle"></i> ${quiz.questions.length} ข้อ</span>
            <span><i class="fas fa-clock"></i> ${quiz.timeLimit} นาที</span>
            <span><i class="fas fa-check-circle"></i> ผ่าน ${quiz.passingScore}%</span>
        </div>
        <div class="quiz-questions">
    `;

    quiz.questions.forEach((q, index) => {
        html += `
            <div class="quiz-question" data-question="${index}">
                <div class="question-header">
                    <span class="question-number">ข้อ ${index + 1}</span>
                </div>
                <p class="question-text">${q.question}</p>
                <div class="question-options">
                    ${q.options.map((opt, optIndex) => `
                        <label class="option-label" onclick="selectAnswer(${index}, '${String.fromCharCode(65 + optIndex)}')">
                            <input type="radio" name="q${index}" value="${String.fromCharCode(65 + optIndex)}">
                            <span class="option-text">${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `
        </div>
        <div class="quiz-actions">
            <button class="btn btn-primary btn-lg" onclick="submitQuiz()">
                <i class="fas fa-paper-plane"></i> ส่งคำตอบ
            </button>
        </div>
    `;

    contentContainer.innerHTML = html;
}

function selectAnswer(questionIndex, answer) {
    AppState.quizAnswers[questionIndex] = answer;
    
    // Update UI
    const questionEl = document.querySelector(`[data-question="${questionIndex}"]`);
    questionEl.querySelectorAll('.option-label').forEach(label => {
        label.classList.remove('selected');
        if (label.querySelector('input').value === answer) {
            label.classList.add('selected');
        }
    });
}

async function submitQuiz() {
    if (!AppState.currentQuiz) return;

    // Check if all questions answered
    const unanswered = AppState.quizAnswers.filter(a => a === null).length;
    if (unanswered > 0) {
        showToast(`ยังเหลืออีก ${unanswered} ข้อ ที่ยังไม่ได้ตอบ`, 'warning');
        return;
    }

    const timeSpent = Math.round((Date.now() - AppState.quizStartTime) / 1000);
    const result = await learningService.submitQuiz(
        AppState.currentQuiz.id, 
        AppState.quizAnswers, 
        timeSpent
    );

    if (result.success) {
        showQuizResults(result);
    } else {
        showToast('เกิดข้อผิดพลาดในการส่งคำตอบ', 'error');
    }
}

function showQuizResults(result) {
    const contentContainer = document.querySelector('.quiz-content');
    
    let html = `
        <div class="quiz-results ${result.passed ? 'passed' : 'failed'}">
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas ${result.passed ? 'fa-trophy' : 'fa-times-circle'}"></i>
                </div>
                <h3>${result.passed ? 'ยินดีด้วย! 🎉' : 'เสียใจด้วย 😔'}</h3>
                <p>${result.passed ? 'คุณผ่านแบบทดสอบแล้ว!' : 'ลองทบทวนและทำใหม่อีกครั้ง'}</p>
            </div>
            
            <div class="result-score">
                <div class="score-circle ${result.passed ? 'passed' : 'failed'}">
                    <span class="score-value">${result.score}</span>
                    <span class="score-label">คะแนน</span>
                </div>
            </div>
            
            <div class="result-stats">
                <div class="stat">
                    <i class="fas fa-check text-success"></i>
                    <span>ถูก ${result.correctCount} ข้อ</span>
                </div>
                <div class="stat">
                    <i class="fas fa-times text-danger"></i>
                    <span>ผิด ${result.totalQuestions - result.correctCount} ข้อ</span>
                </div>
                ${result.xpEarned > 0 ? `
                    <div class="stat">
                        <i class="fas fa-star text-warning"></i>
                        <span>+${result.xpEarned} XP</span>
                    </div>
                ` : ''}
            </div>
            
            ${result.leveledUp ? `
                <div class="level-up-notification">
                    <i class="fas fa-arrow-up"></i>
                    <span>Level Up! คุณขึ้น Level ${result.newLevel} แล้ว!</span>
                </div>
            ` : ''}
            
            <div class="result-actions">
                ${result.passed ? `
                    <button class="btn btn-primary" onclick="closeModal('quizModal'); renderLearningPath();">
                        <i class="fas fa-arrow-right"></i> ไปต่อ
                    </button>
                ` : `
                    <button class="btn btn-secondary" onclick="closeModal('quizModal')">
                        <i class="fas fa-book"></i> ทบทวนบทเรียน
                    </button>
                    <button class="btn btn-primary" onclick="startQuiz('${AppState.currentQuiz.id}')">
                        <i class="fas fa-redo"></i> ทำใหม่
                    </button>
                `}
            </div>
        </div>
    `;

    contentContainer.innerHTML = html;

    // Show badges
    result.badges?.forEach((badge, i) => {
        setTimeout(() => showBadgeNotification(badge), 500 * (i + 1));
    });

    // Update UI
    if (result.passed) {
        renderLearningPath();
        updateUIForLoggedInUser();
    }
}

// ===========================================
// 🏆 Leaderboard
// ===========================================
async function loadLeaderboard() {
    const container = DOM.leaderboardList;
    if (!container) return;

    const leaders = await learningService.getLeaderboard(10);
    
    if (leaders.length === 0) {
        container.innerHTML = '<p class="no-data">ยังไม่มีข้อมูล</p>';
        return;
    }

    // Render podium (top 3)
    const podium = document.querySelector('.podium');
    if (podium && leaders.length >= 3) {
        podium.innerHTML = `
            <div class="podium-item second">
                <div class="podium-avatar">${(leaders[1].displayName || 'L').charAt(0)}</div>
                <span class="podium-name">${leaders[1].displayName || 'Learner'}</span>
                <span class="podium-xp">${leaders[1].totalXP || 0} XP</span>
                <div class="podium-stand">2</div>
            </div>
            <div class="podium-item first">
                <div class="podium-avatar">${(leaders[0].displayName || 'L').charAt(0)}</div>
                <span class="podium-name">${leaders[0].displayName || 'Learner'}</span>
                <span class="podium-xp">${leaders[0].totalXP || 0} XP</span>
                <div class="podium-stand">1</div>
            </div>
            <div class="podium-item third">
                <div class="podium-avatar">${(leaders[2].displayName || 'L').charAt(0)}</div>
                <span class="podium-name">${leaders[2].displayName || 'Learner'}</span>
                <span class="podium-xp">${leaders[2].totalXP || 0} XP</span>
                <div class="podium-stand">3</div>
            </div>
        `;
    }

    // Render full list
    container.innerHTML = leaders.slice(3).map((user, index) => `
        <div class="leaderboard-item">
            <span class="rank">${index + 4}</span>
            <div class="user-info">
                <div class="avatar">${(user.displayName || 'L').charAt(0)}</div>
                <span class="name">${user.displayName || 'Learner'}</span>
            </div>
            <span class="xp">${user.totalXP || 0} XP</span>
        </div>
    `).join('');
}

// ===========================================
// 🏅 Badges
// ===========================================
function renderBadges() {
    const container = DOM.badgesGrid;
    if (!container || !BADGES) return;

    const userBadges = learningService.userProgress?.badges || [];

    container.innerHTML = Object.values(BADGES).map(badge => {
        const isEarned = userBadges.includes(badge.id);
        return `
            <div class="badge-item ${isEarned ? 'earned' : 'locked'}">
                <div class="badge-icon" style="${isEarned ? `background: ${badge.color}` : ''}">
                    <i class="fas ${badge.icon}"></i>
                </div>
                <span class="badge-name">${badge.name}</span>
                <span class="badge-desc">${badge.description}</span>
            </div>
        `;
    }).join('');
}

function showBadgeNotification(badgeId) {
    const badge = BADGES[badgeId];
    if (!badge) return;

    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-notification-content">
            <div class="badge-notification-icon" style="background: ${badge.color}">
                <i class="fas ${badge.icon}"></i>
            </div>
            <div class="badge-notification-text">
                <span class="badge-notification-title">🏆 Badge Earned!</span>
                <span class="badge-notification-name">${badge.name}</span>
                <span class="badge-notification-desc">${badge.description}</span>
            </div>
        </div>
    `;

    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===========================================
// 📊 Stats Animation
// ===========================================
function animateStats() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(el => {
        observer.observe(el);
    });
}

function animateNumber(element) {
    const target = parseInt(element.dataset.target) || parseInt(element.textContent);
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * eased);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function initializeAnimations() {
    // Scroll reveal animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .level-card, .badge-item').forEach(el => {
        observer.observe(el);
    });
}

// ===========================================
// 🔔 Toast Notifications
// ===========================================
function showToast(message, type = 'info', duration = 3000) {
    const container = DOM.toastContainer || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ===========================================
// 🔧 Utility Functions
// ===========================================
function formatTime(minutes) {
    if (minutes < 60) return `${minutes} นาที`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ชม. ${mins} นาที`;
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ===========================================
// 🌐 Global Exports
// ===========================================
window.openModal = openModal;
window.closeModal = closeModal;
window.handleLogout = handleLogout;
window.openLesson = openLesson;
window.completeLesson = completeLesson;
window.startQuiz = startQuiz;
window.selectAnswer = selectAnswer;
window.submitQuiz = submitQuiz;
window.showToast = showToast;
