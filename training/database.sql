-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS hot_runner_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hot_runner_quiz;

-- ตารางหลักเก็บผลการสอบ
CREATE TABLE quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_position VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_department VARCHAR(255) NOT NULL,
    quiz_title VARCHAR(500) NOT NULL,
    total_questions INT NOT NULL,
    time_limit INT NOT NULL,
    passing_score INT NOT NULL,
    score INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    time_used VARCHAR(10) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    quiz_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (user_email),
    INDEX idx_created_at (created_at),
    INDEX idx_passed (passed),
    INDEX idx_percentage (percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตารางเก็บคำตอบแต่ละข้อ
CREATE TABLE quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_result_id INT NOT NULL,
    question_id INT NOT NULL,
    question_category VARCHAR(255) NOT NULL,
    user_answer INT NULL,
    correct_answer INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE,
    INDEX idx_quiz_result_id (quiz_result_id),
    INDEX idx_question_category (question_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตารางเก็บคะแนนแยกตามหมวดหมู่
CREATE TABLE quiz_category_scores (
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

-- สร้าง View สำหรับสถิติรวม
CREATE VIEW quiz_statistics AS
SELECT 
    COUNT(*) as total_attempts,
    AVG(percentage) as avg_score,
    MAX(percentage) as max_score,
    MIN(percentage) as min_score,
    SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_count,
    COUNT(DISTINCT user_email) as unique_users,
    DATE(created_at) as quiz_date
FROM quiz_results
GROUP BY DATE(created_at);

-- ใส่ข้อมูลตัวอย่าง (ถ้าต้องการ)
INSERT INTO quiz_results (
    user_name, user_position, user_email, user_department,
    quiz_title, total_questions, time_limit, passing_score,
    score, percentage, passed, time_used, start_time, end_time, quiz_data
) VALUES (
    'John Doe', 'Production Engineer', 'john@company.com', 'Production',
    'Hot Runner & Open Gate Systems สำหรับพลาสติก PPS', 25, 50, 75,
    20, 80.00, TRUE, '35:22', '2024-01-01 09:00:00', '2024-01-01 09:35:22',
    '{"example": "data"}'
);