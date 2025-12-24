<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$host = 'localhost';
$dbname = 'hot_runner_quiz';
$username = 'root';
$password = '';

// Admin authentication
define('ADMIN_CODE', 'imt2019');

class QuizAPI {
    private $pdo;
    
    public function __construct($host, $dbname, $username, $password) {
        try {
            $this->pdo = new PDO(
                "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch(PDOException $e) {
            $this->sendError('Database connection failed: ' . $e->getMessage());
        }
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'OPTIONS') {
            exit(0);
        }
        
        if ($method === 'GET') {
            $this->handleGet();
        } elseif ($method === 'POST') {
            $this->handlePost();
        } else {
            $this->sendError('Method not allowed');
        }
    }
    
    private function handleGet() {
        $action = $_GET['action'] ?? '';
        $admin_code = $_GET['admin_code'] ?? '';
        
        if ($admin_code !== ADMIN_CODE) {
            $this->sendError('Unauthorized access');
            return;
        }
        
        switch ($action) {
            case 'get_results':
                $this->getResults();
                break;
            case 'get_statistics':
                $this->getStatistics();
                break;
            default:
                $this->sendError('Invalid action');
        }
    }
    
    private function handlePost() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            $this->sendError('Invalid JSON data');
            return;
        }
        
        $action = $data['action'] ?? '';
        
        switch ($action) {
            case 'submit_quiz':
                $this->submitQuiz($data['data']);
                break;
            default:
                $this->sendError('Invalid action');
        }
    }
    
    private function submitQuiz($quizData) {
        try {
            $this->pdo->beginTransaction();
            
            // Insert main quiz record
            $stmt = $this->pdo->prepare("
                INSERT INTO quiz_results (
                    user_name, user_position, user_email, user_department,
                    quiz_title, total_questions, time_limit, passing_score,
                    score, percentage, passed, time_used, start_time, end_time,
                    quiz_data, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $quizData['user_info']['name'],
                $quizData['user_info']['position'],
                $quizData['user_info']['email'],
                $quizData['user_info']['department'],
                $quizData['quiz_info']['title'],
                $quizData['quiz_info']['total_questions'],
                $quizData['quiz_info']['time_limit'],
                $quizData['quiz_info']['passing_score'],
                $quizData['results']['score'],
                $quizData['results']['percentage'],
                $quizData['results']['passed'] ? 1 : 0,
                $quizData['results']['time_used'],
                $quizData['results']['start_time'],
                $quizData['results']['end_time'],
                json_encode($quizData, JSON_UNESCAPED_UNICODE)
            ]);
            
            $quiz_id = $this->pdo->lastInsertId();
            
            // Insert detailed answers
            $stmt = $this->pdo->prepare("
                INSERT INTO quiz_answers (
                    quiz_result_id, question_id, question_category,
                    user_answer, correct_answer, is_correct
                ) VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($quizData['answers'] as $answer) {
                $stmt->execute([
                    $quiz_id,
                    $answer['question_id'],
                    $answer['question_category'],
                    $answer['user_answer'],
                    $answer['correct_answer'],
                    $answer['is_correct'] ? 1 : 0
                ]);
            }
            
            // Insert category scores
            $stmt = $this->pdo->prepare("
                INSERT INTO quiz_category_scores (
                    quiz_result_id, category_name, correct_answers, total_questions, percentage
                ) VALUES (?, ?, ?, ?, ?)
            ");
            
            foreach ($quizData['category_scores'] as $category => $scores) {
                $percentage = round(($scores['correct'] / $scores['total']) * 100);
                $stmt->execute([
                    $quiz_id,
                    $category,
                    $scores['correct'],
                    $scores['total'],
                    $percentage
                ]);
            }
            
            $this->pdo->commit();
            
            $this->sendSuccess([
                'message' => 'Quiz results saved successfully',
                'quiz_id' => $quiz_id
            ]);
            
        } catch(PDOException $e) {
            $this->pdo->rollback();
            $this->sendError('Failed to save quiz results: ' . $e->getMessage());
        }
    }
    
    private function getResults() {
        try {
            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $offset = ($page - 1) * $limit;
            
            $stmt = $this->pdo->prepare("
                SELECT 
                    id, user_name, user_position, user_email, user_department,
                    score, total_questions, percentage, passed, time_used,
                    created_at
                FROM quiz_results 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            ");
            
            $stmt->execute([$limit, $offset]);
            $results = $stmt->fetchAll();
            
            // Get total count
            $countStmt = $this->pdo->query("SELECT COUNT(*) as total FROM quiz_results");
            $total = $countStmt->fetch()['total'];
            
            $this->sendSuccess([
                'results' => $results,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch(PDOException $e) {
            $this->sendError('Failed to get results: ' . $e->getMessage());
        }
    }
    
    private function getStatistics() {
        try {
            // Overall statistics
            $overallStats = $this->pdo->query("
                SELECT 
                    COUNT(*) as total_attempts,
                    AVG(percentage) as avg_score,
                    MAX(percentage) as max_score,
                    MIN(percentage) as min_score,
                    SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_count,
                    COUNT(DISTINCT user_email) as unique_users
                FROM quiz_results
            ")->fetch();
            
            // Category performance
            $categoryStats = $this->pdo->query("
                SELECT 
                    category_name,
                    AVG(percentage) as avg_percentage,
                    COUNT(*) as attempts
                FROM quiz_category_scores 
                GROUP BY category_name
                ORDER BY avg_percentage DESC
            ")->fetchAll();
            
            // Recent results
            $recentResults = $this->pdo->query("
                SELECT 
                    user_name, percentage, passed, created_at
                FROM quiz_results 
                ORDER BY created_at DESC 
                LIMIT 10
            ")->fetchAll();
            
            // Department performance
            $departmentStats = $this->pdo->query("
                SELECT 
                    user_department,
                    COUNT(*) as attempts,
                    AVG(percentage) as avg_score,
                    SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_count
                FROM quiz_results 
                GROUP BY user_department
                ORDER BY avg_score DESC
            ")->fetchAll();
            
            $this->sendSuccess([
                'overall' => $overallStats,
                'categories' => $categoryStats,
                'recent_results' => $recentResults,
                'departments' => $departmentStats
            ]);
            
        } catch(PDOException $e) {
            $this->sendError('Failed to get statistics: ' . $e->getMessage());
        }
    }
    
    private function sendSuccess($data) {
        echo json_encode([
            'success' => true,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    private function sendError($message) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Initialize and handle request
try {
    $api = new QuizAPI($host, $dbname, $username, $password);
    $api->handleRequest();
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>