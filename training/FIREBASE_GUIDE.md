# 📚 Training System with Firebase - Developer Guide

## 🎯 ภาพรวมระบบ

Training System ของ WiT 365 เป็นระบบ LMS (Learning Management System) ที่ออกแบบมาสำหรับการเรียนรู้เกี่ยวกับ Hot Runner และ Injection Molding โดยใช้ Firebase เป็น Backend

## 📂 โครงสร้างไฟล์

```
training/
├── js/
│   ├── firebase-config.js     # Firebase Configuration
│   ├── auth-service.js        # Authentication Service
│   ├── training-firebase.js   # Main Training Service
│   └── quiz-firebase.js       # Quiz Service
├── css/
│   └── main.css               # Main Stylesheet
├── index-firebase.html        # Main Dashboard (Firebase version)
├── quiz.html                  # Quiz Page
├── certificate.html           # Certificate Page
├── firestore.rules            # Firestore Security Rules
├── hotrunner/                 # Hot Runner Training Content
└── HtmlPro/                   # Additional HTML Content
```

## 🔥 Firebase Setup

### 1. สร้าง Firebase Project

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. สร้าง Project ใหม่ หรือใช้ Project เดิม
3. เปิดใช้งาน Services ที่ต้องการ:
   - Authentication (Email/Password, Google, LINE)
   - Cloud Firestore
   - Cloud Storage
   - Analytics (optional)

### 2. Configure Firebase

แก้ไขไฟล์ `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID" // optional
};
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 📊 Firestore Collections

### training_users
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  firstName: string,
  lastName: string,
  position: string,
  department: string,
  company: string,
  phone: string,
  avatar: string,
  role: 'user' | 'instructor' | 'admin',
  status: 'active' | 'inactive',
  enrolledCourses: string[],
  completedCourses: string[],
  totalPoints: number,
  badges: string[],
  preferences: object,
  provider: 'email' | 'google' | 'line',
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp
}
```

### training_courses
```javascript
{
  title: string,
  titleTh: string,
  description: string,
  thumbnail: string,
  instructor: string,
  duration: number, // minutes
  level: 'beginner' | 'intermediate' | 'advanced',
  category: string,
  tags: string[],
  modules: string[],
  price: number,
  isFree: boolean,
  isPublished: boolean,
  enrolledCount: number,
  completedCount: number,
  rating: number,
  ratingCount: number,
  prerequisites: string[],
  objectives: string[],
  requirements: string[],
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string
}
```

### training_quizzes
```javascript
{
  title: string,
  titleTh: string,
  description: string,
  courseId: string | null,
  moduleId: string | null,
  lessonId: string | null,
  type: 'quiz' | 'pretest' | 'posttest' | 'exam',
  timeLimit: number, // minutes, 0 = no limit
  passingScore: number, // percentage
  maxAttempts: number, // 0 = unlimited
  shuffleQuestions: boolean,
  shuffleAnswers: boolean,
  showResults: boolean,
  showAnswers: boolean,
  questions: string[],
  totalQuestions: number,
  totalPoints: number,
  isPublished: boolean,
  createdAt: timestamp,
  createdBy: string
}
```

### training_questions
```javascript
{
  quizId: string,
  question: string,
  questionTh: string,
  type: 'multiple_choice' | 'true_false' | 'multiple_answer' | 'short_answer',
  options: string[],
  correctAnswer: number | number[] | string,
  explanation: string,
  explanationTh: string,
  points: number,
  category: string,
  difficulty: 'easy' | 'medium' | 'hard',
  image: string,
  order: number,
  createdAt: timestamp
}
```

### training_quiz_results
```javascript
{
  userId: string,
  userEmail: string,
  userName: string,
  quizId: string,
  quizTitle: string,
  totalQuestions: number,
  correctAnswers: number,
  score: number,
  percentage: number,
  passed: boolean,
  timeUsed: number, // seconds
  startTime: timestamp,
  endTime: timestamp,
  answers: array,
  categoryScores: object,
  createdAt: timestamp
}
```

### training_certificates
```javascript
{
  certificateNumber: string,
  userId: string,
  userEmail: string,
  userName: string,
  courseId: string,
  courseTitle: string,
  courseTitleTh: string,
  issueDate: timestamp,
  expiryDate: timestamp | null,
  status: 'issued' | 'revoked',
  verificationUrl: string,
  createdAt: timestamp
}
```

## 🔐 Authentication

### Email/Password Login
```javascript
// Register
const result = await AuthService.register(email, password, {
    displayName: 'ชื่อผู้ใช้',
    firstName: 'ชื่อ',
    lastName: 'นามสกุล'
});

// Login
const result = await AuthService.login(email, password);

// Logout
await AuthService.logout();
```

### Google Sign-In
```javascript
const result = await AuthService.loginWithGoogle();
```

### LINE Login (LIFF)
```javascript
// Initialize LIFF
await AuthService.initLineLiff('YOUR_LIFF_ID');

// Login with LINE
const result = await AuthService.loginWithLine();
```

## 🎯 Quiz System

### การโหลด Quiz
```javascript
// โหลด quiz พร้อมคำถาม
const result = await QuizService.loadQuiz('QUIZ_ID');

if (result.success) {
    console.log(result.quiz);      // ข้อมูล quiz
    console.log(result.questions); // คำถามทั้งหมด
}

// เริ่มทำ quiz
QuizService.startQuiz();
```

### การบันทึกคำตอบ
```javascript
// บันทึกคำตอบ
const progress = QuizService.saveAnswer('QUESTION_ID', answerIndex);
console.log(`ตอบแล้ว ${progress.answered}/${progress.total}`);
```

### การส่ง Quiz
```javascript
const result = await QuizService.submitQuiz();

if (result.success) {
    console.log(`คะแนน: ${result.result.percentage}%`);
    console.log(`ผ่าน: ${result.result.passed}`);
}
```

### Timer Events
```javascript
// Listen for timer updates
document.addEventListener('quizTimerUpdate', (e) => {
    console.log(`เหลือเวลา: ${e.detail.formattedTime}`);
});

// Listen for time up
document.addEventListener('quizTimeUp', () => {
    console.log('หมดเวลา!');
    QuizService.submitQuiz(); // Auto submit
});
```

## 📈 Progress Tracking

```javascript
// ลงทะเบียนเรียน
await TrainingService.enrollCourse('COURSE_ID');

// อัพเดทความคืบหน้า
await TrainingService.completeLesson('COURSE_ID', 'MODULE_ID', 'LESSON_ID', timeSpent);

// ดึงความคืบหน้า
const progress = await TrainingService.getProgress('COURSE_ID');
```

## 🏆 Certificates

```javascript
// สร้างใบประกาศนียบัตร
const result = await TrainingService.generateCertificate('COURSE_ID');
console.log(`Certificate Number: ${result.certNumber}`);

// ตรวจสอบใบประกาศนียบัตร
const verification = await TrainingService.verifyCertificate('CERT_NUMBER');
console.log(verification.valid ? 'Valid' : 'Invalid');
```

## 📊 Analytics & Stats

```javascript
// สถิติผู้ใช้
const userStats = await TrainingService.getUserStats();

// สถิติระบบ (Admin)
const systemStats = await TrainingService.getSystemStats();

// Leaderboard
const leaderboard = await TrainingService.getLeaderboard(10);
```

## 🛡️ Security Rules

Security Rules ถูกออกแบบมาตามหลักการ:

1. **ผู้ใช้ทั่วไป** - อ่านข้อมูล published, จัดการข้อมูลตัวเอง
2. **Instructor** - จัดการ courses, modules, lessons, quizzes
3. **Admin** - จัดการทุกอย่าง

## 🚀 Deployment

### Deploy to Firebase Hosting
```bash
# Build และ Deploy
firebase deploy

# Deploy เฉพาะ Hosting
firebase deploy --only hosting

# Deploy เฉพาะ Rules
firebase deploy --only firestore:rules
```

### Environment Variables
สร้างไฟล์ `.env` (ไม่ commit)
```
FIREBASE_API_KEY=xxx
FIREBASE_PROJECT_ID=xxx
LINE_LIFF_ID=xxx
```

## 📝 TODO & Future Improvements

- [ ] เพิ่ม Video Streaming สำหรับ Lessons
- [ ] เพิ่มระบบ Discussion Forum
- [ ] เพิ่ม Progress Sync แบบ Real-time
- [ ] เพิ่ม Offline Support (PWA)
- [ ] เพิ่ม LINE Notifications
- [ ] เพิ่ม Certificate PDF Generation
- [ ] เพิ่ม Admin Dashboard

## 📞 Support

- LINE OA: @wit365
- Email: contact@wit365.com
- Documentation: [docs/](./docs/)

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Author:** WiT 365 Team
