/**
 * 🔥 Firebase Training Service
 * ============================
 * Service Layer สำหรับจัดการข้อมูล Training ทั้งหมด
 * 
 * @version 1.0.0
 * @author WiT 365 Team
 */

class TrainingFirebaseService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.COLLECTIONS = null;
        this.initialized = false;
    }

    // ===========================================
    // 🚀 Initialization
    // ===========================================
    
    init() {
        if (window.FirebaseConfig) {
            this.db = window.FirebaseConfig.db || firebase.firestore();
            this.auth = window.FirebaseConfig.auth || firebase.auth();
            this.storage = window.FirebaseConfig.storage || firebase.storage();
            this.COLLECTIONS = window.FirebaseConfig.COLLECTIONS;
            this.initialized = true;
            console.log('✅ TrainingFirebaseService initialized');
        } else {
            console.error('❌ FirebaseConfig not found');
        }
    }

    // ===========================================
    // 👤 USER MANAGEMENT
    // ===========================================

    /**
     * สร้างผู้ใช้ใหม่ (Email/Password)
     */
    async registerUser(email, password, userData) {
        try {
            // Create auth user
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update display name
            if (userData.displayName) {
                await user.updateProfile({ displayName: userData.displayName });
            }

            // Create user document in Firestore
            await this.db.collection(this.COLLECTIONS.USERS).doc(user.uid).set({
                uid: user.uid,
                email: email,
                displayName: userData.displayName || '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                position: userData.position || '',
                department: userData.department || '',
                company: userData.company || '',
                phone: userData.phone || '',
                role: 'user', // user, instructor, admin
                status: 'active',
                enrolledCourses: [],
                completedCourses: [],
                totalPoints: 0,
                badges: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Log activity
            await this.logActivity('user_registered', { email });

            return { success: true, user };
        } catch (error) {
            console.error('❌ Register error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * เข้าสู่ระบบ
     */
    async loginUser(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            // Update last login
            await this.db.collection(this.COLLECTIONS.USERS).doc(userCredential.user.uid).update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ออกจากระบบ
     */
    async logoutUser() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงข้อมูลผู้ใช้
     */
    async getUser(userId) {
        try {
            const doc = await this.db.collection(this.COLLECTIONS.USERS).doc(userId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'User not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * อัพเดทข้อมูลผู้ใช้
     */
    async updateUser(userId, data) {
        try {
            await this.db.collection(this.COLLECTIONS.USERS).doc(userId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 📚 COURSE MANAGEMENT
    // ===========================================

    /**
     * สร้างคอร์สใหม่
     */
    async createCourse(courseData) {
        try {
            const docRef = await this.db.collection(this.COLLECTIONS.COURSES).add({
                title: courseData.title,
                titleTh: courseData.titleTh || '',
                description: courseData.description || '',
                thumbnail: courseData.thumbnail || '',
                instructor: courseData.instructor || '',
                duration: courseData.duration || 0, // minutes
                level: courseData.level || 'beginner', // beginner, intermediate, advanced
                category: courseData.category || 'general',
                tags: courseData.tags || [],
                modules: courseData.modules || [],
                price: courseData.price || 0,
                isFree: courseData.isFree !== false,
                isPublished: courseData.isPublished || false,
                enrolledCount: 0,
                completedCount: 0,
                rating: 0,
                ratingCount: 0,
                prerequisites: courseData.prerequisites || [],
                objectives: courseData.objectives || [],
                requirements: courseData.requirements || [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.auth.currentUser?.uid || 'system'
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงรายการคอร์สทั้งหมด
     */
    async getCourses(filters = {}) {
        try {
            let query = this.db.collection(this.COLLECTIONS.COURSES);

            // Apply filters
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.level) {
                query = query.where('level', '==', filters.level);
            }
            if (filters.isPublished !== undefined) {
                query = query.where('isPublished', '==', filters.isPublished);
            }
            if (filters.isFree !== undefined) {
                query = query.where('isFree', '==', filters.isFree);
            }

            // Order by
            query = query.orderBy('createdAt', 'desc');

            // Limit
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const snapshot = await query.get();
            const courses = [];
            snapshot.forEach(doc => {
                courses.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: courses };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงข้อมูลคอร์สตาม ID
     */
    async getCourse(courseId) {
        try {
            const doc = await this.db.collection(this.COLLECTIONS.COURSES).doc(courseId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'Course not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ลงทะเบียนเรียนคอร์ส
     */
    async enrollCourse(courseId) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const batch = this.db.batch();

            // Update user's enrolled courses
            const userRef = this.db.collection(this.COLLECTIONS.USERS).doc(userId);
            batch.update(userRef, {
                enrolledCourses: firebase.firestore.FieldValue.arrayUnion(courseId),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update course enrolled count
            const courseRef = this.db.collection(this.COLLECTIONS.COURSES).doc(courseId);
            batch.update(courseRef, {
                enrolledCount: firebase.firestore.FieldValue.increment(1)
            });

            // Create progress document
            const progressRef = this.db.collection(this.COLLECTIONS.PROGRESS).doc(`${userId}_${courseId}`);
            batch.set(progressRef, {
                userId: userId,
                courseId: courseId,
                status: 'enrolled', // enrolled, in_progress, completed
                progress: 0,
                completedModules: [],
                completedLessons: [],
                startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastAccessedAt: firebase.firestore.FieldValue.serverTimestamp(),
                completedAt: null,
                totalTimeSpent: 0 // minutes
            });

            await batch.commit();

            // Log activity
            await this.logActivity('course_enrolled', { courseId });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 📖 MODULE & LESSON MANAGEMENT
    // ===========================================

    /**
     * สร้าง Module
     */
    async createModule(courseId, moduleData) {
        try {
            const docRef = await this.db.collection(this.COLLECTIONS.MODULES).add({
                courseId: courseId,
                title: moduleData.title,
                titleTh: moduleData.titleTh || '',
                description: moduleData.description || '',
                order: moduleData.order || 0,
                duration: moduleData.duration || 0,
                lessons: moduleData.lessons || [],
                isPublished: moduleData.isPublished || false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update course modules array
            await this.db.collection(this.COLLECTIONS.COURSES).doc(courseId).update({
                modules: firebase.firestore.FieldValue.arrayUnion(docRef.id)
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * สร้าง Lesson
     */
    async createLesson(moduleId, lessonData) {
        try {
            const docRef = await this.db.collection(this.COLLECTIONS.LESSONS).add({
                moduleId: moduleId,
                title: lessonData.title,
                titleTh: lessonData.titleTh || '',
                description: lessonData.description || '',
                type: lessonData.type || 'video', // video, article, quiz, interactive
                content: lessonData.content || '',
                videoUrl: lessonData.videoUrl || '',
                duration: lessonData.duration || 0,
                order: lessonData.order || 0,
                resources: lessonData.resources || [], // attachments, links
                isPublished: lessonData.isPublished || false,
                isFree: lessonData.isFree || false, // preview lesson
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update module lessons array
            await this.db.collection(this.COLLECTIONS.MODULES).doc(moduleId).update({
                lessons: firebase.firestore.FieldValue.arrayUnion(docRef.id)
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึง Modules ของ Course
     */
    async getModules(courseId) {
        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.MODULES)
                .where('courseId', '==', courseId)
                .orderBy('order')
                .get();

            const modules = [];
            snapshot.forEach(doc => {
                modules.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: modules };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึง Lessons ของ Module
     */
    async getLessons(moduleId) {
        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.LESSONS)
                .where('moduleId', '==', moduleId)
                .orderBy('order')
                .get();

            const lessons = [];
            snapshot.forEach(doc => {
                lessons.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: lessons };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 📈 PROGRESS TRACKING
    // ===========================================

    /**
     * ดึงความคืบหน้าของผู้ใช้ในคอร์ส
     */
    async getProgress(courseId) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const doc = await this.db.collection(this.COLLECTIONS.PROGRESS)
                .doc(`${userId}_${courseId}`).get();

            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'Progress not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * อัพเดทความคืบหน้า
     */
    async updateProgress(courseId, progressData) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const progressRef = this.db.collection(this.COLLECTIONS.PROGRESS)
                .doc(`${userId}_${courseId}`);

            await progressRef.update({
                ...progressData,
                lastAccessedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * บันทึกเรียนจบ Lesson
     */
    async completeLesson(courseId, moduleId, lessonId, timeSpent = 0) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const progressRef = this.db.collection(this.COLLECTIONS.PROGRESS)
                .doc(`${userId}_${courseId}`);

            // Get current progress
            const progressDoc = await progressRef.get();
            const currentProgress = progressDoc.data() || {};

            // Update completed lessons
            const completedLessons = currentProgress.completedLessons || [];
            if (!completedLessons.includes(lessonId)) {
                completedLessons.push(lessonId);
            }

            // Calculate progress percentage
            const course = await this.getCourse(courseId);
            const totalLessons = await this.getTotalLessonsCount(courseId);
            const progressPercentage = Math.round((completedLessons.length / totalLessons) * 100);

            await progressRef.update({
                completedLessons: completedLessons,
                progress: progressPercentage,
                totalTimeSpent: firebase.firestore.FieldValue.increment(timeSpent),
                lastAccessedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: progressPercentage >= 100 ? 'completed' : 'in_progress'
            });

            // Log activity
            await this.logActivity('lesson_completed', { courseId, moduleId, lessonId });

            // Check if course is completed
            if (progressPercentage >= 100) {
                await this.completeCourse(courseId);
            }

            return { success: true, progress: progressPercentage };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * นับจำนวน Lessons ทั้งหมดในคอร์ส
     */
    async getTotalLessonsCount(courseId) {
        try {
            const modulesResult = await this.getModules(courseId);
            if (!modulesResult.success) return 0;

            let totalLessons = 0;
            for (const module of modulesResult.data) {
                const lessonsResult = await this.getLessons(module.id);
                if (lessonsResult.success) {
                    totalLessons += lessonsResult.data.length;
                }
            }
            return totalLessons;
        } catch (error) {
            return 0;
        }
    }

    /**
     * บันทึกเรียนจบคอร์ส
     */
    async completeCourse(courseId) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const batch = this.db.batch();

            // Update progress
            const progressRef = this.db.collection(this.COLLECTIONS.PROGRESS)
                .doc(`${userId}_${courseId}`);
            batch.update(progressRef, {
                status: 'completed',
                progress: 100,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update user
            const userRef = this.db.collection(this.COLLECTIONS.USERS).doc(userId);
            batch.update(userRef, {
                completedCourses: firebase.firestore.FieldValue.arrayUnion(courseId),
                totalPoints: firebase.firestore.FieldValue.increment(100)
            });

            // Update course completed count
            const courseRef = this.db.collection(this.COLLECTIONS.COURSES).doc(courseId);
            batch.update(courseRef, {
                completedCount: firebase.firestore.FieldValue.increment(1)
            });

            await batch.commit();

            // Log activity
            await this.logActivity('course_completed', { courseId });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 📝 QUIZ SYSTEM
    // ===========================================

    /**
     * สร้าง Quiz
     */
    async createQuiz(quizData) {
        try {
            const docRef = await this.db.collection(this.COLLECTIONS.QUIZZES).add({
                title: quizData.title,
                titleTh: quizData.titleTh || '',
                description: quizData.description || '',
                courseId: quizData.courseId || null,
                moduleId: quizData.moduleId || null,
                lessonId: quizData.lessonId || null,
                type: quizData.type || 'quiz', // quiz, pretest, posttest, exam
                timeLimit: quizData.timeLimit || 0, // minutes, 0 = no limit
                passingScore: quizData.passingScore || 70,
                maxAttempts: quizData.maxAttempts || 0, // 0 = unlimited
                shuffleQuestions: quizData.shuffleQuestions || false,
                shuffleAnswers: quizData.shuffleAnswers || false,
                showResults: quizData.showResults !== false,
                showAnswers: quizData.showAnswers || false,
                questions: quizData.questions || [],
                totalQuestions: quizData.questions?.length || 0,
                totalPoints: quizData.totalPoints || 0,
                isPublished: quizData.isPublished || false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.auth.currentUser?.uid || 'system'
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * สร้างคำถาม
     */
    async createQuestion(quizId, questionData) {
        try {
            const docRef = await this.db.collection(this.COLLECTIONS.QUESTIONS).add({
                quizId: quizId,
                question: questionData.question,
                questionTh: questionData.questionTh || '',
                type: questionData.type || 'multiple_choice', // multiple_choice, true_false, multiple_answer, short_answer
                options: questionData.options || [],
                correctAnswer: questionData.correctAnswer,
                explanation: questionData.explanation || '',
                explanationTh: questionData.explanationTh || '',
                points: questionData.points || 1,
                category: questionData.category || 'general',
                difficulty: questionData.difficulty || 'medium', // easy, medium, hard
                image: questionData.image || '',
                order: questionData.order || 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update quiz questions array
            await this.db.collection(this.COLLECTIONS.QUIZZES).doc(quizId).update({
                questions: firebase.firestore.FieldValue.arrayUnion(docRef.id),
                totalQuestions: firebase.firestore.FieldValue.increment(1),
                totalPoints: firebase.firestore.FieldValue.increment(questionData.points || 1)
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึง Quiz
     */
    async getQuiz(quizId) {
        try {
            const doc = await this.db.collection(this.COLLECTIONS.QUIZZES).doc(quizId).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            }
            return { success: false, error: 'Quiz not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงคำถามทั้งหมดของ Quiz
     */
    async getQuestions(quizId) {
        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.QUESTIONS)
                .where('quizId', '==', quizId)
                .orderBy('order')
                .get();

            const questions = [];
            snapshot.forEach(doc => {
                questions.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: questions };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * บันทึกผลการทดสอบ
     */
    async saveQuizResult(quizId, resultData) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const userDoc = await this.getUser(userId);
            const userData = userDoc.data || {};

            const docRef = await this.db.collection(this.COLLECTIONS.QUIZ_RESULTS).add({
                userId: userId,
                userEmail: this.auth.currentUser.email,
                userName: userData.displayName || this.auth.currentUser.displayName || '',
                userPosition: userData.position || '',
                userDepartment: userData.department || '',
                quizId: quizId,
                quizTitle: resultData.quizTitle,
                totalQuestions: resultData.totalQuestions,
                correctAnswers: resultData.correctAnswers,
                score: resultData.score,
                percentage: resultData.percentage,
                passed: resultData.passed,
                timeUsed: resultData.timeUsed || 0,
                startTime: resultData.startTime,
                endTime: resultData.endTime || firebase.firestore.FieldValue.serverTimestamp(),
                answers: resultData.answers || [],
                categoryScores: resultData.categoryScores || {},
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update user points if passed
            if (resultData.passed) {
                await this.db.collection(this.COLLECTIONS.USERS).doc(userId).update({
                    totalPoints: firebase.firestore.FieldValue.increment(resultData.score)
                });
            }

            // Log activity
            await this.logActivity('quiz_completed', {
                quizId,
                score: resultData.score,
                passed: resultData.passed
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงประวัติการทำ Quiz
     */
    async getQuizHistory(quizId = null) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            let query = this.db.collection(this.COLLECTIONS.QUIZ_RESULTS)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc');

            if (quizId) {
                query = query.where('quizId', '==', quizId);
            }

            const snapshot = await query.limit(50).get();
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 🏆 CERTIFICATE SYSTEM
    // ===========================================

    /**
     * สร้างใบประกาศนียบัตร
     */
    async generateCertificate(courseId) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            // Check if course is completed
            const progress = await this.getProgress(courseId);
            if (!progress.success || progress.data.status !== 'completed') {
                return { success: false, error: 'Course not completed' };
            }

            // Check if certificate already exists
            const existingCert = await this.db.collection(this.COLLECTIONS.CERTIFICATES)
                .where('userId', '==', userId)
                .where('courseId', '==', courseId)
                .get();

            if (!existingCert.empty) {
                const cert = existingCert.docs[0];
                return { success: true, id: cert.id, data: cert.data(), existing: true };
            }

            // Generate certificate number
            const certNumber = `WIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Get user and course data
            const userData = await this.getUser(userId);
            const courseData = await this.getCourse(courseId);

            const docRef = await this.db.collection(this.COLLECTIONS.CERTIFICATES).add({
                certificateNumber: certNumber,
                userId: userId,
                userEmail: this.auth.currentUser.email,
                userName: userData.data?.displayName || '',
                courseId: courseId,
                courseTitle: courseData.data?.title || '',
                courseTitleTh: courseData.data?.titleTh || '',
                issueDate: firebase.firestore.FieldValue.serverTimestamp(),
                expiryDate: null, // null = no expiry
                status: 'issued', // issued, revoked
                verificationUrl: `${window.location.origin}/certificate.html?verify=${certNumber}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Log activity
            await this.logActivity('certificate_generated', { courseId, certNumber });

            return { success: true, id: docRef.id, certNumber };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ตรวจสอบใบประกาศนียบัตร
     */
    async verifyCertificate(certNumber) {
        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.CERTIFICATES)
                .where('certificateNumber', '==', certNumber)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return { success: false, error: 'Certificate not found', valid: false };
            }

            const cert = snapshot.docs[0].data();
            const isValid = cert.status === 'issued';

            return {
                success: true,
                valid: isValid,
                data: {
                    certificateNumber: cert.certificateNumber,
                    userName: cert.userName,
                    courseTitle: cert.courseTitle,
                    courseTitleTh: cert.courseTitleTh,
                    issueDate: cert.issueDate,
                    status: cert.status
                }
            };
        } catch (error) {
            return { success: false, error: error.message, valid: false };
        }
    }

    /**
     * ดึงใบประกาศนียบัตรของผู้ใช้
     */
    async getUserCertificates() {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.CERTIFICATES)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            const certificates = [];
            snapshot.forEach(doc => {
                certificates.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: certificates };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 📊 ANALYTICS & LEADERBOARD
    // ===========================================

    /**
     * ดึง Leaderboard
     */
    async getLeaderboard(limit = 10) {
        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.USERS)
                .where('role', '==', 'user')
                .orderBy('totalPoints', 'desc')
                .limit(limit)
                .get();

            const leaderboard = [];
            let rank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                leaderboard.push({
                    rank: rank++,
                    userId: doc.id,
                    displayName: data.displayName,
                    totalPoints: data.totalPoints,
                    completedCourses: data.completedCourses?.length || 0,
                    badges: data.badges?.length || 0
                });
            });

            return { success: true, data: leaderboard };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงสถิติของผู้ใช้
     */
    async getUserStats() {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const user = await this.getUser(userId);
            if (!user.success) return user;

            const userData = user.data;

            // Get quiz results
            const quizResults = await this.db.collection(this.COLLECTIONS.QUIZ_RESULTS)
                .where('userId', '==', userId)
                .get();

            let totalQuizzes = quizResults.size;
            let passedQuizzes = 0;
            let totalScore = 0;

            quizResults.forEach(doc => {
                const data = doc.data();
                if (data.passed) passedQuizzes++;
                totalScore += data.percentage || 0;
            });

            const avgScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;

            return {
                success: true,
                data: {
                    totalPoints: userData.totalPoints || 0,
                    enrolledCourses: userData.enrolledCourses?.length || 0,
                    completedCourses: userData.completedCourses?.length || 0,
                    totalQuizzes: totalQuizzes,
                    passedQuizzes: passedQuizzes,
                    avgQuizScore: avgScore,
                    badges: userData.badges || [],
                    memberSince: userData.createdAt
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * ดึงสถิติรวมระบบ (Admin)
     */
    async getSystemStats() {
        try {
            const [usersSnapshot, coursesSnapshot, quizzesSnapshot, certsSnapshot] = await Promise.all([
                this.db.collection(this.COLLECTIONS.USERS).get(),
                this.db.collection(this.COLLECTIONS.COURSES).get(),
                this.db.collection(this.COLLECTIONS.QUIZ_RESULTS).get(),
                this.db.collection(this.COLLECTIONS.CERTIFICATES).get()
            ]);

            let totalScore = 0;
            let passedCount = 0;
            quizzesSnapshot.forEach(doc => {
                const data = doc.data();
                totalScore += data.percentage || 0;
                if (data.passed) passedCount++;
            });

            return {
                success: true,
                data: {
                    totalUsers: usersSnapshot.size,
                    totalCourses: coursesSnapshot.size,
                    totalQuizAttempts: quizzesSnapshot.size,
                    totalCertificates: certsSnapshot.size,
                    avgQuizScore: quizzesSnapshot.size > 0 ? Math.round(totalScore / quizzesSnapshot.size) : 0,
                    quizPassRate: quizzesSnapshot.size > 0 ? Math.round((passedCount / quizzesSnapshot.size) * 100) : 0
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // 📝 ACTIVITY LOG
    // ===========================================

    async logActivity(action, data = {}) {
        if (!this.auth.currentUser) return;

        try {
            await this.db.collection(this.COLLECTIONS.ACTIVITY_LOG).add({
                userId: this.auth.currentUser.uid,
                userEmail: this.auth.currentUser.email,
                action: action,
                data: data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            });
        } catch (error) {
            console.error('Activity log error:', error);
        }
    }

    /**
     * ดึง Activity Log
     */
    async getActivityLog(limit = 50) {
        const userId = this.auth.currentUser?.uid;
        if (!userId) return { success: false, error: 'Not authenticated' };

        try {
            const snapshot = await this.db.collection(this.COLLECTIONS.ACTIVITY_LOG)
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const activities = [];
            snapshot.forEach(doc => {
                activities.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, data: activities };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// ===========================================
// 🌐 Export Global Instance
// ===========================================
window.TrainingService = new TrainingFirebaseService();

// Auto-initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.TrainingService.init();
    }, 100);
});

console.log('📚 TrainingFirebaseService loaded - WiT 365');
