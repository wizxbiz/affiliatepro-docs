-- =====================================================
-- Hot Runner Training Center - Database Schema v2.0
-- อัพเดทฐานข้อมูลให้รองรับระบบใหม่ทั้งหมด
-- =====================================================

-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS hot_runner_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hot_runner_quiz;

-- =====================================================
-- 1. ตาราง Users - เก็บข้อมูลผู้ใช้งาน
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'ชื่อ-นามสกุล',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'อีเมล',
    position VARCHAR(255) NOT NULL COMMENT 'ตำแหน่ง',
    department VARCHAR(255) NOT NULL COMMENT 'แผนก',
    employee_code VARCHAR(50) UNIQUE COMMENT 'รหัสพนักงาน',
    avatar_url VARCHAR(500) NULL COMMENT 'URL รูปโปรไฟล์',
    phone VARCHAR(20) NULL COMMENT 'เบอร์โทรศัพท์',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'สถานะใช้งาน',
    role ENUM('user', 'admin', 'instructor') DEFAULT 'user' COMMENT 'บทบาท',
    last_login DATETIME NULL COMMENT 'เข้าสู่ระบบล่าสุด',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_employee_code (employee_code),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. ตาราง Learning Progress - ความก้าวหน้าการเรียนรู้โดยรวม
-- =====================================================
CREATE TABLE IF NOT EXISTS learning_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    overall_progress DECIMAL(5,2) DEFAULT 0 COMMENT 'ความก้าวหน้าโดยรวม (%)',
    completed_modules INT DEFAULT 0 COMMENT 'จำนวนบทเรียนที่เรียนจบ',
    total_time_spent INT DEFAULT 0 COMMENT 'เวลาเรียนทั้งหมด (นาที)',
    pretest_score DECIMAL(5,2) NULL COMMENT 'คะแนน Pre-test',
    posttest_score DECIMAL(5,2) NULL COMMENT 'คะแนน Post-test',
    improvement_score DECIMAL(5,2) NULL COMMENT 'คะแนนพัฒนาการ',
    learning_streak INT DEFAULT 0 COMMENT 'จำนวนวันเรียนต่อเนื่อง',
    last_activity_date DATE NULL COMMENT 'วันที่เข้าเรียนล่าสุด',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_overall_progress (overall_progress)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. ตาราง Module Progress - ความก้าวหน้าแต่ละบทเรียน
-- =====================================================
CREATE TABLE IF NOT EXISTS module_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    module_id VARCHAR(100) NOT NULL COMMENT 'รหัสบทเรียน',
    module_name VARCHAR(255) NOT NULL COMMENT 'ชื่อบทเรียน',
    module_order INT DEFAULT 0 COMMENT 'ลำดับบทเรียน',
    progress DECIMAL(5,2) DEFAULT 0 COMMENT 'ความก้าวหน้า (%)',
    status ENUM('not_started', 'in_progress', 'completed', 'locked') DEFAULT 'not_started' COMMENT 'สถานะ',
    score DECIMAL(5,2) NULL COMMENT 'คะแนนที่ได้',
    time_spent INT DEFAULT 0 COMMENT 'เวลาที่ใช้ (นาที)',
    attempts INT DEFAULT 0 COMMENT 'จำนวนครั้งที่พยายาม',
    started_at DATETIME NULL COMMENT 'เริ่มเรียน',
    completed_at DATETIME NULL COMMENT 'เรียนจบ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_module (user_id, module_id),
    INDEX idx_user_id (user_id),
    INDEX idx_module_id (module_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ตาราง Certificates - ใบประกาศนียบัตร
-- =====================================================
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    certificate_number VARCHAR(50) NOT NULL UNIQUE COMMENT 'หมายเลขใบรับรอง',
    course_title VARCHAR(255) NOT NULL COMMENT 'ชื่อหลักสูตร',
    score DECIMAL(5,2) NULL COMMENT 'คะแนนที่ได้',
    grade VARCHAR(10) NULL COMMENT 'เกรด (A, B, C, D)',
    issued_at DATETIME NOT NULL COMMENT 'วันที่ออกใบรับรอง',
    valid_until DATE NULL COMMENT 'ใช้ได้ถึงวันที่',
    verified BOOLEAN DEFAULT FALSE COMMENT 'ยืนยันแล้ว',
    pdf_url VARCHAR(500) NULL COMMENT 'URL ไฟล์ PDF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_certificate_number (certificate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. ตาราง Quiz Results - ผลการสอบ (ปรับปรุงจากเดิม)
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'รหัสผู้ใช้ (ถ้า login)',
    user_name VARCHAR(255) NOT NULL,
    user_position VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_department VARCHAR(255) NOT NULL,
    quiz_type ENUM('pretest', 'posttest', 'module_quiz', 'practice') DEFAULT 'module_quiz' COMMENT 'ประเภทการสอบ',
    quiz_title VARCHAR(500) NOT NULL,
    total_questions INT NOT NULL,
    time_limit INT NOT NULL COMMENT 'เวลาจำกัด (นาที)',
    passing_score INT NOT NULL COMMENT 'คะแนนผ่าน (%)',
    score INT NOT NULL COMMENT 'คะแนนที่ได้',
    percentage DECIMAL(5,2) NOT NULL COMMENT 'เปอร์เซ็นต์',
    passed BOOLEAN NOT NULL COMMENT 'ผ่าน/ไม่ผ่าน',
    time_used VARCHAR(10) NOT NULL COMMENT 'เวลาที่ใช้',
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    quiz_data JSON NOT NULL COMMENT 'ข้อมูล JSON ทั้งหมด',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_user_email (user_email),
    INDEX idx_quiz_type (quiz_type),
    INDEX idx_created_at (created_at),
    INDEX idx_passed (passed),
    INDEX idx_percentage (percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. ตาราง Quiz Answers - คำตอบแต่ละข้อ
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_result_id INT NOT NULL,
    question_id INT NOT NULL,
    question_category VARCHAR(255) NOT NULL,
    question_text TEXT NULL COMMENT 'ข้อความคำถาม',
    user_answer INT NULL,
    correct_answer INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent INT DEFAULT 0 COMMENT 'เวลาที่ใช้ต่อข้อ (วินาที)',
    FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
    INDEX idx_quiz_result_id (quiz_result_id),
    INDEX idx_question_category (question_category),
    INDEX idx_is_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. ตาราง Quiz Category Scores - คะแนนแยกหมวดหมู่
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_category_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_result_id INT NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    correct_answers INT NOT NULL,
    total_questions INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
    INDEX idx_quiz_result_id (quiz_result_id),
    INDEX idx_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. ตาราง Activity Log - บันทึกกิจกรรม
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    activity_type ENUM('login', 'logout', 'module_start', 'module_complete', 
                       'quiz_start', 'quiz_complete', 'certificate_issued', 
                       'profile_update', 'page_view') NOT NULL,
    activity_description TEXT NULL,
    module_id VARCHAR(100) NULL,
    quiz_id INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. ตาราง Course Modules - ข้อมูลบทเรียน
-- =====================================================
CREATE TABLE IF NOT EXISTS course_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id VARCHAR(100) NOT NULL UNIQUE,
    module_name VARCHAR(255) NOT NULL,
    module_description TEXT NULL,
    module_order INT NOT NULL,
    duration_minutes INT DEFAULT 60 COMMENT 'เวลาเรียนโดยประมาณ',
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    is_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    prerequisites JSON NULL COMMENT 'รหัสบทเรียนที่ต้องเรียนก่อน',
    learning_objectives JSON NULL COMMENT 'วัตถุประสงค์การเรียนรู้',
    content_url VARCHAR(500) NULL COMMENT 'URL เนื้อหา',
    thumbnail_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_module_order (module_order),
    INDEX idx_difficulty_level (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. Views สำหรับรายงาน
-- =====================================================

-- View: สถิติการสอบรวม
CREATE OR REPLACE VIEW quiz_statistics AS
SELECT 
    COUNT(*) as total_attempts,
    AVG(percentage) as avg_score,
    MAX(percentage) as max_score,
    MIN(percentage) as min_score,
    SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_count,
    SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) as failed_count,
    ROUND(SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pass_rate,
    COUNT(DISTINCT user_email) as unique_users,
    DATE(created_at) as quiz_date
FROM quiz_results
GROUP BY DATE(created_at);

-- View: สถิติผู้ใช้งาน
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.department,
    u.position,
    lp.overall_progress,
    lp.completed_modules,
    lp.total_time_spent,
    lp.pretest_score,
    lp.posttest_score,
    (lp.posttest_score - lp.pretest_score) as improvement,
    (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as certificates_count,
    (SELECT COUNT(*) FROM quiz_results WHERE user_email = u.email) as quiz_attempts,
    (SELECT AVG(percentage) FROM quiz_results WHERE user_email = u.email) as avg_quiz_score
FROM users u
LEFT JOIN learning_progress lp ON u.id = lp.user_id;

-- View: Leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.name,
    u.department,
    COALESCE(lp.overall_progress, 0) as progress,
    COALESCE(lp.completed_modules, 0) as completed_modules,
    (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as certificates,
    (SELECT AVG(percentage) FROM quiz_results WHERE user_email = u.email AND passed = 1) as avg_score,
    RANK() OVER (ORDER BY lp.overall_progress DESC, lp.completed_modules DESC) as rank_position
FROM users u
LEFT JOIN learning_progress lp ON u.id = lp.user_id
WHERE u.is_active = TRUE
ORDER BY lp.overall_progress DESC, lp.completed_modules DESC;

-- =====================================================
-- 11. ใส่ข้อมูลเริ่มต้น
-- =====================================================

-- ใส่ข้อมูลบทเรียน
INSERT INTO course_modules (module_id, module_name, module_description, module_order, duration_minutes, difficulty_level, content_url) VALUES
('basic_hotrunner', 'ความรู้เบื้องต้น Hot Runner', 'เรียนรู้หลักการทำงานพื้นฐานของระบบ Hot Runner, ประเภทต่างๆ และส่วนประกอบสำคัญ', 1, 120, 'beginner', 'HtmlPro/hotrunner/basic-hotrunner.html'),
('hot_runner_advanced', 'Hot Runner Open Gate System', 'เจาะลึกระบบ Open Gate สำหรับพลาสติก PPS พร้อมเทคนิคการตั้งค่าอุณหภูมิ', 2, 180, 'intermediate', 'hottraining.html'),
('pps_training', 'เทคนิคการใช้งาน PPS', 'หลักสูตรเฉพาะทางสำหรับพลาสติก PPS การตั้งค่าพารามิเตอร์และการแก้ปัญหา', 3, 150, 'advanced', 'ppstraining.html'),
('injection_simulation', 'Injection Molding Simulator', 'ฝึกปฏิบัติกับเครื่องจำลองการฉีดพลาสติกมืออาชีพ', 4, 90, 'intermediate', 'simulate_pro.html'),
('3d_interactive', 'โมเดล 3D แบบโต้ตอบ', 'สื่อการสอน 3D โต้ตอบได้ เรียนรู้ส่วนประกอบของ Hot Runner', 5, 60, 'beginner', 'HtmlPro/hotrunner/index.html'),
('calculator_tools', 'เครื่องมือคำนวณ', 'เครื่องคิดเลขสำหรับการฉีดพลาสติก', 6, 30, 'beginner', 'injection_pro.html')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ใส่ Admin เริ่มต้น
INSERT INTO users (name, email, position, department, employee_code, role) VALUES
('System Admin', 'admin@hotrunner.com', 'System Administrator', 'IT', 'ADMIN001', 'admin')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- =====================================================
-- 12. Stored Procedures
-- =====================================================

DELIMITER //

-- Procedure: คำนวณความก้าวหน้าใหม่
CREATE PROCEDURE IF NOT EXISTS RecalculateProgress(IN p_user_id INT)
BEGIN
    DECLARE v_avg_progress DECIMAL(5,2);
    DECLARE v_completed INT;
    DECLARE v_total_time INT;
    
    SELECT 
        AVG(progress),
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END),
        SUM(time_spent)
    INTO v_avg_progress, v_completed, v_total_time
    FROM module_progress
    WHERE user_id = p_user_id;
    
    UPDATE learning_progress
    SET 
        overall_progress = COALESCE(v_avg_progress, 0),
        completed_modules = COALESCE(v_completed, 0),
        total_time_spent = COALESCE(v_total_time, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id;
END //

-- Procedure: บันทึกกิจกรรม
CREATE PROCEDURE IF NOT EXISTS LogActivity(
    IN p_user_id INT,
    IN p_activity_type VARCHAR(50),
    IN p_description TEXT,
    IN p_module_id VARCHAR(100),
    IN p_ip_address VARCHAR(45)
)
BEGIN
    INSERT INTO activity_log (user_id, activity_type, activity_description, module_id, ip_address, created_at)
    VALUES (p_user_id, p_activity_type, p_description, p_module_id, p_ip_address, NOW());
END //

DELIMITER ;

-- =====================================================
-- เสร็จสิ้นการสร้างฐานข้อมูล
-- =====================================================
