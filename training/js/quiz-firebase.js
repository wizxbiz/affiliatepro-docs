/**
 * 🎯 Quiz Firebase Service
 * =========================
 * Service สำหรับจัดการระบบ Quiz ทั้งหมด
 * รองรับ: Pretest, Posttest, Practice Quiz, Final Exam
 * 
 * @version 1.0.0
 * @author WiT 365 Team
 */

class QuizFirebaseService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.COLLECTIONS = null;
        this.initialized = false;
        
        // Quiz State
        this.currentQuiz = null;
        this.currentQuestions = [];
        this.userAnswers = {};
        this.startTime = null;
        this.timerInterval = null;
    }

    // ===========================================
    // 🚀 Initialization
    // ===========================================

    init() {
        if (window.FirebaseConfig) {
            this.db = window.FirebaseConfig.db || firebase.firestore();
            this.auth = window.FirebaseConfig.auth || firebase.auth();
            this.COLLECTIONS = window.FirebaseConfig.COLLECTIONS;
            this.initialized = true;
            console.log('✅ QuizFirebaseService initialized');
        } else {
            console.error('❌ FirebaseConfig not found');
        }
    }

    // ===========================================
    // 📋 Quiz Management
    // ===========================================

    /**
     * ดึงรายการ Quiz ทั้งหมด
     */
    async getQuizList(filters = {}) {
        try {
            let query = this.db.collection(this.COLLECTIONS.QUIZZES);

            // Apply filters
            if (filters.type) {
                query = query.where('type', '==', filters.type);
            }
            if (filters.courseId) {
                query = query.where('courseId', '==', filters.courseId);
            }
            if (filters.isPublished !== undefined) {
                query = query.where('isPublished', '==', filters.isPublished);
            }

            query = query.orderBy('createdAt', 'desc');

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const snapshot = await query.get();
            const quizzes = [];

            snapshot.forEach(doc => {
                quizzes.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: quizzes };
        } catch (error) {
            console.error('Get quiz list error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึง Quiz พร้อมคำถาม
     */
    async loadQuiz(quizId) {
        try {
            // Get quiz info
            const quizDoc = await this.db.collection(this.COLLECTIONS.QUIZZES).doc(quizId).get();
            
            if (!quizDoc.exists) {
                return { success: false, error: 'ไม่พบแบบทดสอบ' };
            }

            this.currentQuiz = { id: quizDoc.id, ...quizDoc.data() };

            // Get questions
            const questionsSnapshot = await this.db.collection(this.COLLECTIONS.QUESTIONS)
                .where('quizId', '==', quizId)
                .orderBy('order')
                .get();

            this.currentQuestions = [];
            questionsSnapshot.forEach(doc => {
                this.currentQuestions.push({ id: doc.id, ...doc.data() });
            });

            // Shuffle if needed
            if (this.currentQuiz.shuffleQuestions) {
                this.shuffleArray(this.currentQuestions);
            }

            // Shuffle answers if needed
            if (this.currentQuiz.shuffleAnswers) {
                this.currentQuestions.forEach(q => {
                    if (q.options && q.options.length > 0) {
                        // Keep track of correct answer
                        const correctIndex = q.correctAnswer;
                        const correctOption = q.options[correctIndex];
                        this.shuffleArray(q.options);
                        q.correctAnswer = q.options.indexOf(correctOption);
                    }
                });
            }

            // Initialize user answers
            this.userAnswers = {};
            this.currentQuestions.forEach(q => {
                this.userAnswers[q.id] = null;
            });

            return { 
                success: true, 
                quiz: this.currentQuiz,
                questions: this.currentQuestions
            };
        } catch (error) {
            console.error('Load quiz error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * เริ่มทำ Quiz
     */
    startQuiz() {
        this.startTime = new Date();
        
        // Start timer if time limit is set
        if (this.currentQuiz?.timeLimit > 0) {
            this.startTimer();
        }

        return {
            quiz: this.currentQuiz,
            questions: this.currentQuestions,
            startTime: this.startTime
        };
    }

    /**
     * เริ่มจับเวลา
     */
    startTimer() {
        const timeLimit = this.currentQuiz.timeLimit * 60; // Convert to seconds
        let remainingTime = timeLimit;

        this.timerInterval = setInterval(() => {
            remainingTime--;
            
            // Dispatch timer event
            const event = new CustomEvent('quizTimerUpdate', {
                detail: {
                    remainingTime,
                    formattedTime: this.formatTime(remainingTime)
                }
            });
            document.dispatchEvent(event);

            // Time's up
            if (remainingTime <= 0) {
                this.stopTimer();
                document.dispatchEvent(new CustomEvent('quizTimeUp'));
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * บันทึกคำตอบ
     */
    saveAnswer(questionId, answer) {
        this.userAnswers[questionId] = answer;
        
        // Calculate progress
        const answered = Object.values(this.userAnswers).filter(a => a !== null).length;
        const total = this.currentQuestions.length;
        
        return {
            answered,
            total,
            progress: Math.round((answered / total) * 100)
        };
    }

    /**
     * ส่งแบบทดสอบและคำนวณผล
     */
    async submitQuiz() {
        this.stopTimer();
        const endTime = new Date();
        
        if (!this.auth.currentUser) {
            return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
        }

        try {
            // Calculate results
            let correctAnswers = 0;
            let totalPoints = 0;
            let earnedPoints = 0;
            const categoryScores = {};
            const detailedAnswers = [];

            this.currentQuestions.forEach(question => {
                const userAnswer = this.userAnswers[question.id];
                const isCorrect = this.checkAnswer(question, userAnswer);
                const points = question.points || 1;
                
                totalPoints += points;
                
                if (isCorrect) {
                    correctAnswers++;
                    earnedPoints += points;
                }

                // Track category scores
                const category = question.category || 'general';
                if (!categoryScores[category]) {
                    categoryScores[category] = { correct: 0, total: 0, points: 0, maxPoints: 0 };
                }
                categoryScores[category].total++;
                categoryScores[category].maxPoints += points;
                if (isCorrect) {
                    categoryScores[category].correct++;
                    categoryScores[category].points += points;
                }

                // Store detailed answer
                detailedAnswers.push({
                    questionId: question.id,
                    question: question.question,
                    userAnswer: userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect: isCorrect,
                    points: isCorrect ? points : 0,
                    maxPoints: points,
                    category: category,
                    explanation: question.explanation || ''
                });
            });

            // Calculate percentage
            const percentage = Math.round((earnedPoints / totalPoints) * 100);
            const passed = percentage >= (this.currentQuiz.passingScore || 70);

            // Time used
            const timeUsed = Math.round((endTime - this.startTime) / 1000); // seconds

            // Prepare result data
            const resultData = {
                userId: this.auth.currentUser.uid,
                userEmail: this.auth.currentUser.email,
                quizId: this.currentQuiz.id,
                quizTitle: this.currentQuiz.title,
                quizTitleTh: this.currentQuiz.titleTh || '',
                type: this.currentQuiz.type,
                totalQuestions: this.currentQuestions.length,
                correctAnswers: correctAnswers,
                totalPoints: totalPoints,
                earnedPoints: earnedPoints,
                score: earnedPoints,
                percentage: percentage,
                passed: passed,
                passingScore: this.currentQuiz.passingScore || 70,
                timeUsed: timeUsed,
                timeLimit: this.currentQuiz.timeLimit || 0,
                startTime: firebase.firestore.Timestamp.fromDate(this.startTime),
                endTime: firebase.firestore.Timestamp.fromDate(endTime),
                answers: detailedAnswers,
                categoryScores: categoryScores,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save to Firestore
            const docRef = await this.db.collection(this.COLLECTIONS.QUIZ_RESULTS).add(resultData);

            // Update user points if passed
            if (passed) {
                await this.db.collection(this.COLLECTIONS.USERS).doc(this.auth.currentUser.uid).update({
                    totalPoints: firebase.firestore.FieldValue.increment(earnedPoints)
                });
            }

            // Log activity
            if (window.FirebaseConfig?.logActivity) {
                window.FirebaseConfig.logActivity('quiz_submitted', {
                    quizId: this.currentQuiz.id,
                    score: earnedPoints,
                    percentage: percentage,
                    passed: passed
                });
            }

            // Clean up
            this.currentQuiz = null;
            this.currentQuestions = [];
            this.userAnswers = {};
            this.startTime = null;

            return {
                success: true,
                resultId: docRef.id,
                result: {
                    totalQuestions: resultData.totalQuestions,
                    correctAnswers: correctAnswers,
                    score: earnedPoints,
                    totalPoints: totalPoints,
                    percentage: percentage,
                    passed: passed,
                    passingScore: resultData.passingScore,
                    timeUsed: timeUsed,
                    categoryScores: categoryScores,
                    answers: detailedAnswers
                }
            };

        } catch (error) {
            console.error('Submit quiz error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ตรวจคำตอบ
     */
    checkAnswer(question, userAnswer) {
        if (userAnswer === null || userAnswer === undefined) {
            return false;
        }

        switch (question.type) {
            case 'multiple_choice':
            case 'true_false':
                return userAnswer === question.correctAnswer;
            
            case 'multiple_answer':
                // Both arrays must have same elements
                if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
                    return false;
                }
                return userAnswer.length === question.correctAnswer.length &&
                    userAnswer.every(a => question.correctAnswer.includes(a));
            
            case 'short_answer':
                // Case-insensitive comparison
                const correct = String(question.correctAnswer).toLowerCase().trim();
                const user = String(userAnswer).toLowerCase().trim();
                return correct === user;
            
            default:
                return userAnswer === question.correctAnswer;
        }
    }

    // ===========================================
    // 📊 Quiz Results & History
    // ===========================================

    /**
     * ดึงประวัติการทำ Quiz
     */
    async getQuizHistory(options = {}) {
        if (!this.auth.currentUser) {
            return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
        }

        try {
            let query = this.db.collection(this.COLLECTIONS.QUIZ_RESULTS)
                .where('userId', '==', this.auth.currentUser.uid)
                .orderBy('createdAt', 'desc');

            if (options.quizId) {
                query = query.where('quizId', '==', options.quizId);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            const snapshot = await query.get();
            const results = [];

            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: results };
        } catch (error) {
            console.error('Get quiz history error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงผลการทดสอบ
     */
    async getQuizResult(resultId) {
        try {
            const doc = await this.db.collection(this.COLLECTIONS.QUIZ_RESULTS).doc(resultId).get();
            
            if (!doc.exists) {
                return { success: false, error: 'ไม่พบผลการทดสอบ' };
            }

            return { success: true, data: { id: doc.id, ...doc.data() } };
        } catch (error) {
            console.error('Get quiz result error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงคะแนนสูงสุดของ Quiz
     */
    async getBestScore(quizId) {
        if (!this.auth.currentUser) {
            return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' };
        }

        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.QUIZ_RESULTS)
                .where('userId', '==', this.auth.currentUser.uid)
                .where('quizId', '==', quizId)
                .orderBy('percentage', 'desc')
                .limit(1)
                .get();

            if (snapshot.empty) {
                return { success: true, data: null };
            }

            return { success: true, data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } };
        } catch (error) {
            console.error('Get best score error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * นับจำนวนครั้งที่ทำ Quiz
     */
    async getAttemptCount(quizId) {
        if (!this.auth.currentUser) {
            return { success: false, count: 0 };
        }

        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.QUIZ_RESULTS)
                .where('userId', '==', this.auth.currentUser.uid)
                .where('quizId', '==', quizId)
                .get();

            return { success: true, count: snapshot.size };
        } catch (error) {
            return { success: false, count: 0 };
        }
    }

    // ===========================================
    // 📈 Leaderboard
    // ===========================================

    /**
     * ดึง Leaderboard ของ Quiz
     */
    async getLeaderboard(quizId, limit = 10) {
        try {
            // Get top scores for this quiz
            const snapshot = await this.db.collection(this.COLLECTIONS.QUIZ_RESULTS)
                .where('quizId', '==', quizId)
                .orderBy('percentage', 'desc')
                .orderBy('timeUsed', 'asc')
                .limit(limit * 3) // Get more to filter unique users
                .get();

            const userScores = {};
            const leaderboard = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                // Keep only best score per user
                if (!userScores[data.userId] || data.percentage > userScores[data.userId].percentage) {
                    userScores[data.userId] = data;
                }
            });

            // Convert to array and sort
            Object.values(userScores)
                .sort((a, b) => {
                    if (b.percentage !== a.percentage) {
                        return b.percentage - a.percentage;
                    }
                    return a.timeUsed - b.timeUsed;
                })
                .slice(0, limit)
                .forEach((data, index) => {
                    leaderboard.push({
                        rank: index + 1,
                        userId: data.userId,
                        userEmail: data.userEmail,
                        userName: data.userName || data.userEmail?.split('@')[0],
                        score: data.score,
                        percentage: data.percentage,
                        timeUsed: data.timeUsed,
                        completedAt: data.createdAt
                    });
                });

            return { success: true, data: leaderboard };
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 🎲 Utility Functions
    // ===========================================

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Get current quiz state
     */
    getState() {
        return {
            quiz: this.currentQuiz,
            questions: this.currentQuestions,
            answers: this.userAnswers,
            startTime: this.startTime,
            answeredCount: Object.values(this.userAnswers).filter(a => a !== null).length,
            totalQuestions: this.currentQuestions.length
        };
    }

    /**
     * Reset quiz state
     */
    resetQuiz() {
        this.stopTimer();
        this.currentQuiz = null;
        this.currentQuestions = [];
        this.userAnswers = {};
        this.startTime = null;
    }
}

// ===========================================
// 🌐 Export Global Instance
// ===========================================
window.QuizService = new QuizFirebaseService();

// Auto-initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.QuizService.init();
    }, 150);
});

console.log('🎯 QuizFirebaseService loaded - WiT 365');
