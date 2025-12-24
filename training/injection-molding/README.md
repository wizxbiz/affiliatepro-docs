# 🏭 Injection Molding Learning Academy

> ศูนย์เรียนรู้การฉีดพลาสติกออนไลน์แบบครบวงจร

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Language](https://img.shields.io/badge/language-Thai-orange.svg)

## 📋 ภาพรวม

Injection Molding Learning Academy เป็นแพลตฟอร์มการเรียนรู้ออนไลน์สำหรับช่างเทคนิคและวิศวกรที่ต้องการพัฒนาความรู้ด้านการฉีดพลาสติก ตั้งแต่ระดับเริ่มต้นจนถึงขั้นสูง

## ✨ คุณสมบัติหลัก

### 📚 หลักสูตรเรียนรู้ 6 ระดับ
- **Level 0**: Mindset & Foundation - ปรับ Mindset และเรียนรู้พื้นฐาน
- **Level 1**: Machine Fundamentals - รู้จักเครื่องฉีดพลาสติก
- **Level 2**: Material Science - ความรู้เรื่องวัสดุพลาสติก
- **Level 3**: Process Parameters - การตั้งค่าพารามิเตอร์
- **Level 4**: Troubleshooting - การวิเคราะห์และแก้ปัญหา
- **Level 5**: Advanced Techniques - เทคนิคขั้นสูงและ Industry 4.0

### 🎮 ระบบ Gamification
- **XP System**: สะสมคะแนนประสบการณ์จากการเรียนและทำแบบทดสอบ
- **Badges**: 10 ตราความสำเร็จ
- **Leaderboard**: อันดับผู้เรียนทั้งหมด
- **Streak System**: ติดตามการเรียนต่อเนื่อง

### 🏅 ระบบ Badge
| Badge | ชื่อ | เงื่อนไข |
|-------|------|---------|
| 👟 | First Step | เรียนบทแรกสำเร็จ |
| 🌱 | Beginner | จบ Level 0 |
| ⚙️ | Machine Operator | จบ Level 1 |
| 🧪 | Material Expert | จบ Level 2 |
| 🎚️ | Process Master | จบ Level 3 |
| 🐛 | Problem Solver | จบ Level 4 |
| 🎓 | Advanced Engineer | จบ Level 5 |
| ⭐ | Quiz Champion | ได้คะแนน 100% ใน Quiz |
| ⚡ | Speed Learner | จบทั้งหมดใน 7 วัน |
| 👑 | Injection Master | จบหลักสูตรทั้งหมด |

## 🛠️ เทคโนโลยี

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase (Authentication, Firestore)
- **Fonts**: Google Fonts (Sarabun)
- **Icons**: Font Awesome 6.4

## 📁 โครงสร้างโปรเจค

```
training/injection-molding/
├── index.html              # หน้าหลัก
├── README.md               # เอกสารนี้
├── css/
│   ├── injection-molding.css   # สไตล์หลัก
│   └── animations.css          # แอนิเมชัน
└── js/
    ├── firebase-config.js      # การตั้งค่า Firebase
    ├── curriculum-data.js      # ข้อมูลหลักสูตร
    ├── learning-service.js     # บริการจัดการการเรียน
    └── app.js                  # แอปพลิเคชันหลัก
```

## 🚀 การติดตั้ง

### 1. ตั้งค่า Firebase

1. สร้างโปรเจค Firebase ใหม่ที่ [Firebase Console](https://console.firebase.google.com)
2. เปิดใช้งาน Authentication (Email/Password)
3. เปิดใช้งาน Firestore Database
4. คัดลอก Firebase config มาแทนที่ใน `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Firestore Rules

เพิ่ม Security Rules ใน Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /injectionMoldingLearners/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /quizResults/{resultId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Leaderboard - Allow read for all authenticated users
    match /injectionMoldingLearners/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

### 3. รันโปรเจค

เปิด `index.html` ในเบราว์เซอร์ หรือใช้ Live Server:

```bash
# ถ้าใช้ VS Code Live Server
# คลิกขวาที่ index.html -> Open with Live Server

# หรือใช้ Python
python -m http.server 8000
```

## 📱 การใช้งาน

### สำหรับผู้เรียน

1. **ลงทะเบียน/เข้าสู่ระบบ** - คลิกปุ่ม "เข้าสู่ระบบ" ที่มุมขวาบน
2. **เลือกบทเรียน** - เลือก Level และบทเรียนที่ต้องการเรียน
3. **อ่านเนื้อหา** - ศึกษาเนื้อหาในแต่ละบทเรียน
4. **ทำแบบทดสอบ** - ทำ Quiz เพื่อวัดความเข้าใจ
5. **สะสม XP และ Badge** - รับคะแนนและตราความสำเร็จ

### Demo Mode

หาก Firebase ไม่พร้อมใช้งาน ระบบจะทำงานใน Demo Mode:
- ข้อมูลจะเก็บใน localStorage
- สามารถทดสอบฟังก์ชันต่างๆ ได้
- ไม่มี Leaderboard

## 📊 โครงสร้างข้อมูล Firestore

### Collection: `injectionMoldingLearners`

```javascript
{
  userId: "user_uid",
  displayName: "ชื่อผู้เรียน",
  email: "email@example.com",
  createdAt: timestamp,
  
  // Progress
  currentLevel: 0,
  totalXP: 0,
  lessonsCompleted: ["L0_1", "L0_2"],
  quizzesCompleted: ["Q0"],
  badges: ["first_step", "beginner"],
  
  // Stats
  totalLessonsCompleted: 2,
  totalQuizzesCompleted: 1,
  totalQuizzesAttempted: 1,
  averageQuizScore: 85,
  totalStudyTime: 45,
  
  // Streak
  lastStudyDate: timestamp,
  currentStreak: 3,
  longestStreak: 7
}
```

### Sub-collection: `quizResults`

```javascript
{
  quizId: "Q0",
  score: 80,
  passed: true,
  correctCount: 4,
  totalQuestions: 5,
  timeSpentSeconds: 300,
  completedAt: timestamp,
  results: [...]
}
```

## 🤝 การมีส่วนร่วม

ยินดีรับ Pull Requests และ Issues:

1. Fork โปรเจค
2. สร้าง Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง Branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📝 การพัฒนาในอนาคต

- [ ] เพิ่มเนื้อหาบทเรียนครบทุกระดับ
- [ ] เพิ่มวิดีโอประกอบบทเรียน
- [ ] เพิ่มระบบ Certificate
- [ ] เพิ่ม Social Features (Comments, Discussion)
- [ ] เพิ่ม Mobile App (Flutter)
- [ ] เพิ่ม Multi-language Support

## 📄 License

MIT License - ดูไฟล์ [LICENSE](LICENSE) สำหรับรายละเอียด

## 👨‍💻 ผู้พัฒนา

สร้างด้วย ❤️ สำหรับอุตสาหกรรมพลาสติกไทย

---

**🏭 Injection Molding Learning Academy** - เรียนรู้การฉีดพลาสติกอย่างเป็นระบบ
