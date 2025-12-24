/**
 * 🔥 Firebase Configuration for Injection Molding Learning
 * ========================================================
 * Configure your Firebase project settings here
 */

// Firebase configuration - Replace with your own config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
    } else {
        firebase.app(); // Use existing app
        console.log('✅ Firebase already initialized');
    }

    // Initialize Firestore
    const db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Multiple tabs open, persistence only enabled in one tab');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Browser does not support offline persistence');
            }
        });

    // Export for use
    window.db = db;
} else {
    console.warn('⚠️ Firebase SDK not loaded - Running in demo mode');
}

/**
 * Demo mode service (when Firebase is not available)
 */
class DemoLearningService {
    constructor() {
        this.currentUser = null;
        this.userProgress = this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('iml_demo_progress');
        return saved ? JSON.parse(saved) : null;
    }

    saveToLocalStorage() {
        localStorage.setItem('iml_demo_progress', JSON.stringify(this.userProgress));
    }

    async initialize() {
        return this.currentUser;
    }

    async signIn(email, password) {
        // Demo sign in
        this.currentUser = { uid: 'demo_user', email, displayName: email.split('@')[0] };
        this.userProgress = this.userProgress || {
            userId: 'demo_user',
            displayName: this.currentUser.displayName,
            email,
            currentLevel: 0,
            totalXP: 0,
            lessonsCompleted: [],
            quizzesCompleted: [],
            badges: [],
            totalLessonsCompleted: 0,
            totalQuizzesCompleted: 0
        };
        this.saveToLocalStorage();
        return { success: true, user: this.currentUser };
    }

    async signUp(email, password, displayName) {
        this.currentUser = { uid: 'demo_user', email, displayName };
        this.userProgress = {
            userId: 'demo_user',
            displayName,
            email,
            currentLevel: 0,
            totalXP: 0,
            lessonsCompleted: [],
            quizzesCompleted: [],
            badges: [],
            totalLessonsCompleted: 0,
            totalQuizzesCompleted: 0
        };
        this.saveToLocalStorage();
        return { success: true, user: this.currentUser };
    }

    async signOut() {
        this.currentUser = null;
        return { success: true };
    }

    getLesson(lessonId) {
        for (const levelKey of Object.keys(CURRICULUM)) {
            const level = CURRICULUM[levelKey];
            const lesson = level.lessons?.find(l => l.id === lessonId);
            if (lesson) {
                return { lesson, level };
            }
        }
        return null;
    }

    isLessonUnlocked(lessonId) {
        const { lesson } = this.getLesson(lessonId) || {};
        if (!lesson || !this.userProgress) return false;

        if (lesson.unlockCondition === null) return true;

        const condition = lesson.unlockCondition;
        if (condition.startsWith('Q')) {
            return this.userProgress.quizzesCompleted?.includes(condition);
        }
        if (condition.startsWith('L')) {
            return this.userProgress.lessonsCompleted?.includes(condition);
        }
        return false;
    }

    async completeLesson(lessonId, studyTime = 0) {
        const { lesson } = this.getLesson(lessonId) || {};
        if (!lesson) return { success: false };

        if (this.userProgress.lessonsCompleted?.includes(lessonId)) {
            return { success: true, alreadyCompleted: true };
        }

        this.userProgress.lessonsCompleted.push(lessonId);
        this.userProgress.totalLessonsCompleted++;
        this.userProgress.totalXP += lesson.xp || 100;

        const badges = [];
        if (this.userProgress.totalLessonsCompleted === 1) {
            this.userProgress.badges.push('first_step');
            badges.push('first_step');
        }

        this.saveToLocalStorage();

        return {
            success: true,
            xpEarned: lesson.xp || 100,
            badges,
            nextLesson: this.getNextLesson(lessonId)
        };
    }

    getNextLesson(currentLessonId) {
        const { level } = this.getLesson(currentLessonId) || {};
        if (!level) return null;

        const currentIndex = level.lessons.findIndex(l => l.id === currentLessonId);
        if (currentIndex < level.lessons.length - 1) {
            return level.lessons[currentIndex + 1];
        }
        return level.quiz;
    }

    getQuiz(quizId) {
        for (const levelKey of Object.keys(CURRICULUM)) {
            const level = CURRICULUM[levelKey];
            if (level.quiz?.id === quizId) {
                return { quiz: level.quiz, level };
            }
        }
        return null;
    }

    async submitQuiz(quizId, answers, timeSpent) {
        const { quiz, level } = this.getQuiz(quizId) || {};
        if (!quiz) return { success: false };

        let correctCount = 0;
        const results = quiz.questions.map((q, index) => {
            const isCorrect = answers[index] === q.correctAnswer;
            if (isCorrect) correctCount++;
            return { isCorrect };
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        const passed = score >= quiz.passingScore;

        const badges = [];

        if (passed && !this.userProgress.quizzesCompleted?.includes(quizId)) {
            this.userProgress.quizzesCompleted.push(quizId);
            this.userProgress.totalQuizzesCompleted++;
            this.userProgress.totalXP += 200;

            if (this.userProgress.currentLevel === level.id) {
                this.userProgress.currentLevel = level.id + 1;
            }

            const levelBadges = {
                'Q0': 'beginner',
                'Q1': 'machine_operator',
                'Q2': 'material_expert',
                'Q3': 'process_master',
                'Q4': 'troubleshooter',
                'Q5': 'advanced_engineer'
            };

            if (levelBadges[quizId]) {
                this.userProgress.badges.push(levelBadges[quizId]);
                badges.push(levelBadges[quizId]);
            }

            if (quizId === 'Q5') {
                this.userProgress.badges.push('injection_master');
                badges.push('injection_master');
            }

            this.saveToLocalStorage();
        }

        return {
            success: true,
            score,
            passed,
            correctCount,
            totalQuestions: quiz.questions.length,
            results,
            xpEarned: passed ? 200 : 0,
            badges,
            leveledUp: passed
        };
    }

    async getLeaderboard() {
        return [];
    }

    getLevelProgress(levelId) {
        if (!this.userProgress) return { completed: 0, total: 0, percentage: 0 };

        const level = CURRICULUM[`level${levelId}`];
        if (!level) return { completed: 0, total: 0, percentage: 0 };

        const totalLessons = level.lessons?.length || 0;
        const completedLessons = level.lessons?.filter(
            l => this.userProgress.lessonsCompleted?.includes(l.id)
        ).length || 0;

        return {
            lessonsCompleted: completedLessons,
            totalLessons,
            percentage: Math.round((completedLessons / totalLessons) * 100)
        };
    }
}

// Use demo service if Firebase is not available
if (typeof firebase === 'undefined') {
    window.learningService = new DemoLearningService();
}
