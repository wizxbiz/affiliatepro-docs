/**
 * 🏭 Injection Molding Learning - Learning Service
 * ================================================
 * Firebase integration and learning progress management
 */

class LearningService {
    constructor() {
        this.currentUser = null;
        this.userProgress = null;
        this.isInitialized = false;
    }

    // ===========================================
    // 🔐 Authentication Methods
    // ===========================================
    
    /**
     * Initialize Firebase and check auth state
     */
    async initialize() {
        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.loadUserProgress();
                } else {
                    this.currentUser = null;
                    this.userProgress = null;
                }
                this.isInitialized = true;
                resolve(user);
            });
        });
    }

    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.currentUser = result.user;
            await this.loadUserProgress();
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    /**
     * Sign up with email and password
     */
    async signUp(email, password, displayName) {
        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update display name
            await result.user.updateProfile({ displayName });
            
            // Initialize user progress in Firestore
            await this.initializeUserProgress(result.user.uid, displayName, email);
            
            this.currentUser = result.user;
            await this.loadUserProgress();
            
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        try {
            await firebase.auth().signOut();
            this.currentUser = null;
            this.userProgress = null;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get error message in Thai
     */
    getErrorMessage(errorCode) {
        const messages = {
            'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
            'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
            'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
            'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้นี้',
            'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
            'auth/too-many-requests': 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่'
        };
        return messages[errorCode] || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    }

    // ===========================================
    // 📊 User Progress Management
    // ===========================================

    /**
     * Initialize new user progress
     */
    async initializeUserProgress(userId, displayName, email) {
        const initialProgress = {
            // User info
            userId,
            displayName,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            
            // Progress
            currentLevel: 0,
            totalXP: 0,
            lessonsCompleted: [],
            quizzesCompleted: [],
            badges: [],
            
            // Stats
            totalLessonsCompleted: 0,
            totalQuizzesCompleted: 0,
            totalQuizzesAttempted: 0,
            averageQuizScore: 0,
            totalStudyTime: 0, // in minutes
            
            // Streak
            lastStudyDate: null,
            currentStreak: 0,
            longestStreak: 0,
            
            // Settings
            notifications: true,
            language: 'th'
        };

        await firebase.firestore()
            .collection('injectionMoldingLearners')
            .doc(userId)
            .set(initialProgress);

        return initialProgress;
    }

    /**
     * Load user progress from Firestore
     */
    async loadUserProgress() {
        if (!this.currentUser) return null;

        try {
            const doc = await firebase.firestore()
                .collection('injectionMoldingLearners')
                .doc(this.currentUser.uid)
                .get();

            if (doc.exists) {
                this.userProgress = { id: doc.id, ...doc.data() };
            } else {
                // Create progress if doesn't exist
                this.userProgress = await this.initializeUserProgress(
                    this.currentUser.uid,
                    this.currentUser.displayName || 'Learner',
                    this.currentUser.email
                );
            }

            return this.userProgress;
        } catch (error) {
            console.error('Error loading progress:', error);
            return null;
        }
    }

    /**
     * Update user progress
     */
    async updateProgress(updates) {
        if (!this.currentUser) return false;

        try {
            await firebase.firestore()
                .collection('injectionMoldingLearners')
                .doc(this.currentUser.uid)
                .update({
                    ...updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Update local copy
            this.userProgress = { ...this.userProgress, ...updates };
            return true;
        } catch (error) {
            console.error('Error updating progress:', error);
            return false;
        }
    }

    // ===========================================
    // 📚 Lesson Management
    // ===========================================

    /**
     * Get lesson by ID
     */
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

    /**
     * Check if lesson is unlocked
     */
    isLessonUnlocked(lessonId) {
        const { lesson, level } = this.getLesson(lessonId) || {};
        if (!lesson || !this.userProgress) return false;

        // First lesson of first level is always unlocked
        if (lesson.unlockCondition === null) return true;

        const condition = lesson.unlockCondition;
        
        // Check if it's a quiz condition
        if (condition.startsWith('Q')) {
            return this.userProgress.quizzesCompleted?.includes(condition);
        }
        
        // Check if it's a lesson condition
        if (condition.startsWith('L')) {
            return this.userProgress.lessonsCompleted?.includes(condition);
        }

        // Check level requirement
        if (level.requiredLevel !== null) {
            return this.userProgress.currentLevel >= level.requiredLevel;
        }

        return false;
    }

    /**
     * Complete a lesson
     */
    async completeLesson(lessonId, studyTimeMinutes = 0) {
        if (!this.currentUser || !this.userProgress) return { success: false };

        const { lesson, level } = this.getLesson(lessonId) || {};
        if (!lesson) return { success: false, error: 'Lesson not found' };

        // Check if already completed
        if (this.userProgress.lessonsCompleted?.includes(lessonId)) {
            return { success: true, alreadyCompleted: true };
        }

        const updates = {
            lessonsCompleted: firebase.firestore.FieldValue.arrayUnion(lessonId),
            totalLessonsCompleted: (this.userProgress.totalLessonsCompleted || 0) + 1,
            totalXP: (this.userProgress.totalXP || 0) + (lesson.xp || 100),
            totalStudyTime: (this.userProgress.totalStudyTime || 0) + studyTimeMinutes
        };

        // Check for first lesson badge
        const badges = [];
        if (this.userProgress.totalLessonsCompleted === 0) {
            badges.push('first_step');
            updates.badges = firebase.firestore.FieldValue.arrayUnion('first_step');
        }

        // Update streak
        const today = new Date().toDateString();
        const lastStudy = this.userProgress.lastStudyDate?.toDate?.().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastStudy !== today) {
            updates.lastStudyDate = firebase.firestore.FieldValue.serverTimestamp();
            
            if (lastStudy === yesterday) {
                updates.currentStreak = (this.userProgress.currentStreak || 0) + 1;
                if (updates.currentStreak > (this.userProgress.longestStreak || 0)) {
                    updates.longestStreak = updates.currentStreak;
                }
            } else if (lastStudy !== today) {
                updates.currentStreak = 1;
            }
        }

        const success = await this.updateProgress(updates);

        return {
            success,
            xpEarned: lesson.xp || 100,
            badges,
            nextLesson: this.getNextLesson(lessonId)
        };
    }

    /**
     * Get next lesson
     */
    getNextLesson(currentLessonId) {
        const { level } = this.getLesson(currentLessonId) || {};
        if (!level) return null;

        const currentIndex = level.lessons.findIndex(l => l.id === currentLessonId);
        
        // Check for next lesson in current level
        if (currentIndex < level.lessons.length - 1) {
            return level.lessons[currentIndex + 1];
        }

        // Return quiz for this level
        return level.quiz;
    }

    // ===========================================
    // 📝 Quiz Management
    // ===========================================

    /**
     * Get quiz by ID
     */
    getQuiz(quizId) {
        for (const levelKey of Object.keys(CURRICULUM)) {
            const level = CURRICULUM[levelKey];
            if (level.quiz?.id === quizId) {
                return { quiz: level.quiz, level };
            }
        }
        return null;
    }

    /**
     * Check if quiz is unlocked
     */
    isQuizUnlocked(quizId) {
        if (!this.userProgress) return false;

        const { level } = this.getQuiz(quizId) || {};
        if (!level) return false;

        // Check if all lessons in the level are completed
        return level.lessons.every(lesson => 
            this.userProgress.lessonsCompleted?.includes(lesson.id)
        );
    }

    /**
     * Submit quiz answers
     */
    async submitQuiz(quizId, answers, timeSpentSeconds) {
        if (!this.currentUser || !this.userProgress) {
            return { success: false, error: 'Not logged in' };
        }

        const { quiz, level } = this.getQuiz(quizId) || {};
        if (!quiz || !quiz.questions) {
            return { success: false, error: 'Quiz not found' };
        }

        // Calculate score
        let correctCount = 0;
        const results = quiz.questions.map((q, index) => {
            const isCorrect = answers[index] === q.correctAnswer;
            if (isCorrect) correctCount++;
            return {
                questionId: q.id,
                userAnswer: answers[index],
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation
            };
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        const passed = score >= quiz.passingScore;

        // Prepare updates
        const updates = {
            totalQuizzesAttempted: (this.userProgress.totalQuizzesAttempted || 0) + 1
        };

        const badges = [];

        if (passed) {
            // First time passing
            if (!this.userProgress.quizzesCompleted?.includes(quizId)) {
                updates.quizzesCompleted = firebase.firestore.FieldValue.arrayUnion(quizId);
                updates.totalQuizzesCompleted = (this.userProgress.totalQuizzesCompleted || 0) + 1;
                updates.totalXP = (this.userProgress.totalXP || 0) + 200; // Bonus XP for quiz

                // Level up check
                if (this.userProgress.currentLevel === level.id) {
                    updates.currentLevel = level.id + 1;
                }

                // Level completion badges
                const levelBadges = {
                    'Q0': 'beginner',
                    'Q1': 'machine_operator',
                    'Q2': 'material_expert',
                    'Q3': 'process_master',
                    'Q4': 'troubleshooter',
                    'Q5': 'advanced_engineer'
                };

                if (levelBadges[quizId] && !this.userProgress.badges?.includes(levelBadges[quizId])) {
                    badges.push(levelBadges[quizId]);
                    updates.badges = firebase.firestore.FieldValue.arrayUnion(levelBadges[quizId]);
                }

                // Master badge for completing all
                if (quizId === 'Q5' && !this.userProgress.badges?.includes('injection_master')) {
                    badges.push('injection_master');
                    if (!updates.badges) {
                        updates.badges = firebase.firestore.FieldValue.arrayUnion('injection_master');
                    } else {
                        // Need to add to existing array
                        updates.badges = firebase.firestore.FieldValue.arrayUnion(levelBadges[quizId], 'injection_master');
                    }
                }
            }

            // Perfect score badge
            if (score === 100 && !this.userProgress.badges?.includes('quiz_champion')) {
                badges.push('quiz_champion');
                updates.badges = updates.badges 
                    ? firebase.firestore.FieldValue.arrayUnion(...badges)
                    : firebase.firestore.FieldValue.arrayUnion('quiz_champion');
            }
        }

        // Update average score
        const previousTotal = (this.userProgress.averageQuizScore || 0) * (this.userProgress.totalQuizzesAttempted || 0);
        updates.averageQuizScore = Math.round((previousTotal + score) / (this.userProgress.totalQuizzesAttempted + 1));

        // Save quiz result
        await firebase.firestore()
            .collection('injectionMoldingLearners')
            .doc(this.currentUser.uid)
            .collection('quizResults')
            .add({
                quizId,
                score,
                passed,
                correctCount,
                totalQuestions: quiz.questions.length,
                results,
                timeSpentSeconds,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        // Update progress
        await this.updateProgress(updates);

        return {
            success: true,
            score,
            passed,
            correctCount,
            totalQuestions: quiz.questions.length,
            results,
            xpEarned: passed ? 200 : 0,
            badges,
            leveledUp: updates.currentLevel !== undefined,
            newLevel: updates.currentLevel
        };
    }

    // ===========================================
    // 🏆 Leaderboard
    // ===========================================

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 10) {
        try {
            const snapshot = await firebase.firestore()
                .collection('injectionMoldingLearners')
                .orderBy('totalXP', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map((doc, index) => ({
                rank: index + 1,
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    /**
     * Get user rank
     */
    async getUserRank() {
        if (!this.currentUser || !this.userProgress) return null;

        try {
            const snapshot = await firebase.firestore()
                .collection('injectionMoldingLearners')
                .where('totalXP', '>', this.userProgress.totalXP || 0)
                .get();

            return snapshot.size + 1;
        } catch (error) {
            console.error('Error getting rank:', error);
            return null;
        }
    }

    // ===========================================
    // 📈 Statistics
    // ===========================================

    /**
     * Get overall statistics
     */
    getOverallStats() {
        if (!this.userProgress) return null;

        const totalLessons = Object.values(CURRICULUM).reduce(
            (sum, level) => sum + (level.lessons?.length || 0), 0
        );
        const totalQuizzes = Object.keys(CURRICULUM).length;

        return {
            lessonsCompleted: this.userProgress.totalLessonsCompleted || 0,
            totalLessons,
            lessonProgress: Math.round(((this.userProgress.totalLessonsCompleted || 0) / totalLessons) * 100),
            quizzesCompleted: this.userProgress.totalQuizzesCompleted || 0,
            totalQuizzes,
            quizProgress: Math.round(((this.userProgress.totalQuizzesCompleted || 0) / totalQuizzes) * 100),
            totalXP: this.userProgress.totalXP || 0,
            currentLevel: this.userProgress.currentLevel || 0,
            badges: this.userProgress.badges || [],
            streak: this.userProgress.currentStreak || 0,
            averageQuizScore: this.userProgress.averageQuizScore || 0,
            studyTime: this.userProgress.totalStudyTime || 0
        };
    }

    /**
     * Get level progress
     */
    getLevelProgress(levelId) {
        if (!this.userProgress) return { completed: 0, total: 0, percentage: 0 };

        const level = CURRICULUM[`level${levelId}`];
        if (!level) return { completed: 0, total: 0, percentage: 0 };

        const totalLessons = level.lessons?.length || 0;
        const completedLessons = level.lessons?.filter(
            l => this.userProgress.lessonsCompleted?.includes(l.id)
        ).length || 0;

        const quizCompleted = this.userProgress.quizzesCompleted?.includes(level.quiz?.id) ? 1 : 0;

        return {
            lessonsCompleted: completedLessons,
            totalLessons,
            quizCompleted: !!quizCompleted,
            percentage: Math.round((completedLessons / totalLessons) * 100)
        };
    }
}

// Create global instance
window.learningService = new LearningService();
