# Hot Runner Training Center - Project Documentation

## 📋 Project Overview

**Hot Runner Training Center** คือระบบ Learning Management System (LMS) สำหรับฝึกอบรมเรื่อง Hot Runner และ Injection Molding พัฒนาด้วย HTML, CSS, JavaScript และ PHP

---

## 🏗️ Project Structure

```
HotKCT/
├── 📄 index.html              # Main Dashboard - หน้าหลักของระบบ
├── 📄 my-learning.html        # Learning Path - ติดตามความคืบหน้า
├── 📄 quiz.html               # Quiz System - ระบบทำแบบทดสอบ
├── 📄 certificate.html        # Certificate - ใบประกาศนียบัตร
├── 📄 analytics.html          # Analytics Dashboard - สำหรับ Admin
│
├── 📁 css/
│   └── 📄 main.css            # CSS Framework กลาง
│
├── 📁 js/
│   └── 📄 components.js       # Shared Components (Navigation, Utilities)
│
├── 📁 Backend/
│   ├── 📄 config.php          # Database Configuration
│   ├── 📄 user_api.php        # User Management API
│   ├── 📄 quiz_api.php        # Quiz API
│   ├── 📄 database.sql        # Original DB Schema
│   └── 📄 database_v2.sql     # Enhanced DB Schema
│
├── 📁 Training Content/
│   ├── 📄 hottraining.html    # Hot Runner Training
│   ├── 📄 ppstraining.html    # PPS Training
│   ├── 📄 training_pro.html   # Pro Training
│   ├── 📄 pretest.html        # Pre-Test Page
│   ├── 📄 result.html         # Result Display
│   └── 📄 process.html        # Process Training
│
├── 📁 HtmlPro/
│   └── 📁 hotrunner/
│       ├── 📄 index.html              # Hot Runner Main
│       ├── 📄 basic-hotrunner.html    # Basics
│       ├── 📄 advancehot.html         # Advanced
│       ├── 📄 injection-learning.html  # Injection Learning
│       ├── 📄 injection-simulation.html # Simulation
│       ├── 📄 hot-runner-3d.js        # 3D Models
│       └── 📄 hot-runner-videos.js    # Video Content
│
└── 📁 logo/                   # Brand Assets
```

---

## 🎯 Features

### 1. User Management
- ✅ Registration & Login
- ✅ Role-based access (User/Admin)
- ✅ Profile management
- ✅ LocalStorage for offline capability

### 2. Learning Path System
- ✅ Progress tracking per module
- ✅ Visual timeline learning path
- ✅ Achievement system
- ✅ Activity logging

### 3. Quiz System
- ✅ Pre-test / Post-test
- ✅ Timer functionality
- ✅ Question navigation
- ✅ Flag questions for review
- ✅ Result analysis
- ✅ Review mode with explanations

### 4. Certificate System
- ✅ PDF generation (jsPDF + html2canvas)
- ✅ Professional template design
- ✅ Verification system
- ✅ Print and share options

### 5. Analytics Dashboard (Admin)
- ✅ Overview statistics
- ✅ Charts (Chart.js)
- ✅ Leaderboard
- ✅ Activity feed
- ✅ Module performance
- ✅ Export reports

### 6. Training Content
- ✅ Hot Runner basics
- ✅ Injection Molding
- ✅ 3D interactive models (Three.js)
- ✅ Video tutorials
- ✅ Simulations

---

## 🔧 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| UI Framework | Custom CSS with Variables |
| Fonts | Google Fonts (Sarabun, Prompt) |
| Icons | Font Awesome 6 |
| Charts | Chart.js |
| 3D | Three.js |
| Animation | GSAP, CSS Animations |
| PDF | jsPDF + html2canvas |
| Backend | PHP 7+ |
| Database | MySQL |
| Storage | LocalStorage (offline support) |

---

## 📦 Dependencies

### CDN Libraries
```html
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Prompt:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- Icons -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- jsPDF + html2canvas -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>

<!-- Three.js (for 3D models) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- GSAP (for animations) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js"></script>
```

---

## 🗄️ Database Schema

### Main Tables

1. **users** - ข้อมูลผู้ใช้งาน
2. **learning_progress** - ความคืบหน้าการเรียน
3. **module_progress** - ความคืบหน้าแต่ละบทเรียน
4. **certificates** - ใบประกาศนียบัตร
5. **quiz_results** - ผลการทดสอบ
6. **quiz_answers** - คำตอบแบบละเอียด
7. **activity_log** - Log กิจกรรมต่างๆ
8. **course_modules** - ข้อมูลบทเรียน

### Views
- `quiz_statistics` - สถิติการทดสอบ
- `user_statistics` - สถิติผู้ใช้
- `leaderboard` - ตารางคะแนน

---

## 🚀 Getting Started

### Prerequisites
- Web Server (Apache/Nginx)
- PHP 7.4+
- MySQL 5.7+
- Modern web browser

### Installation

1. **Clone/Copy files to web server**
   ```bash
   cp -r HotKCT/ /var/www/html/
   ```

2. **Create Database**
   ```bash
   mysql -u root -p < database_v2.sql
   ```

3. **Configure Database Connection**
   Edit `config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'hot_runner_quiz');
   ```

4. **Access the application**
   ```
   http://localhost/HotKCT/index.html
   ```

---

## 📱 Responsive Design

ระบบรองรับทุกขนาดหน้าจอ:
- 📱 Mobile (< 576px)
- 📱 Tablet (576px - 992px)
- 💻 Desktop (> 992px)

---

## 🔐 Security Features

- Password hashing (PHP password_hash)
- SQL Injection prevention (Prepared Statements)
- XSS Prevention
- CSRF Token (implemented in forms)
- Input validation

---

## 📊 API Endpoints

### User API (user_api.php)

| Method | Action | Description |
|--------|--------|-------------|
| POST | register | ลงทะเบียนผู้ใช้ใหม่ |
| POST | login | เข้าสู่ระบบ |
| GET | get_user | ดึงข้อมูลผู้ใช้ |
| POST | update_progress | อัพเดทความคืบหน้า |
| POST | complete_module | บันทึกเรียนจบบท |
| POST | generate_certificate | สร้างใบรับรอง |
| GET | get_leaderboard | ดึง Leaderboard |

### Quiz API (quiz_api.php)

| Method | Action | Description |
|--------|--------|-------------|
| GET | get_questions | ดึงข้อสอบ |
| POST | submit_answer | บันทึกคำตอบ |
| POST | save_result | บันทึกผลทดสอบ |
| GET | get_results | ดึงผลทดสอบ |

---

## 🎨 Design System

### Colors
```css
:root {
    --primary: #00d9ff;
    --secondary: #0066ff;
    --success: #00c853;
    --warning: #ff9800;
    --danger: #f44336;
    --dark: #0f1724;
    --card-bg: rgba(30, 42, 61, 0.9);
}
```

### Typography
- **Headings**: Prompt (Thai-friendly)
- **Body**: Sarabun (Thai-friendly)

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration
- [ ] User login/logout
- [ ] Learning path navigation
- [ ] Quiz completion
- [ ] Certificate generation
- [ ] Admin analytics

---

## 📈 Future Improvements

1. **Phase 2**
   - [ ] Real-time notifications (WebSocket)
   - [ ] Discussion forums
   - [ ] Video progress tracking
   - [ ] Mobile app (PWA)

2. **Phase 3**
   - [ ] AI-powered recommendations
   - [ ] Virtual classroom
   - [ ] Multi-language support
   - [ ] Advanced reporting

---

## 👥 Contributors

- Development Team: Hot Runner Training Center

---

## 📄 License

Copyright © 2024 Hot Runner Training Center. All rights reserved.

---

## 📞 Support

For technical support, please contact:
- Email: support@hotrunner-training.com
- Tel: xxx-xxx-xxxx
