<?php
/**
 * User API - Hot Runner Training Center
 * ระบบจัดการผู้ใช้และติดตามความก้าวหน้า
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
require_once 'config.php';

class UserAPI {
    private $pdo;
    
    public function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch(PDOException $e) {
            $this->sendResponse(['error' => 'Database connection failed'], 500);
        }
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($method) {
            case 'GET':
                $this->handleGet($action);
                break;
            case 'POST':
                $this->handlePost($action);
                break;
            case 'PUT':
                $this->handlePut($action);
                break;
            case 'DELETE':
                $this->handleDelete($action);
                break;
            default:
                $this->sendResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function handleGet($action) {
        switch ($action) {
            case 'get_user':
                $this->getUser();
                break;
            case 'get_progress':
                $this->getProgress();
                break;
            case 'get_certificates':
                $this->getCertificates();
                break;
            case 'get_leaderboard':
                $this->getLeaderboard();
                break;
            case 'check_email':
                $this->checkEmail();
                break;
            default:
                $this->sendResponse(['error' => 'Invalid action'], 400);
        }
    }
    
    private function handlePost($action) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        switch ($action) {
            case 'register':
                $this->registerUser($data);
                break;
            case 'login':
                $this->loginUser($data);
                break;
            case 'update_progress':
                $this->updateProgress($data);
                break;
            case 'complete_module':
                $this->completeModule($data);
                break;
            case 'generate_certificate':
                $this->generateCertificate($data);
                break;
            default:
                $this->sendResponse(['error' => 'Invalid action'], 400);
        }
    }
    
    private function handlePut($action) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        switch ($action) {
            case 'update_user':
                $this->updateUser($data);
                break;
            default:
                $this->sendResponse(['error' => 'Invalid action'], 400);
        }
    }
    
    private function handleDelete($action) {
        // Reserved for future use
        $this->sendResponse(['error' => 'Not implemented'], 501);
    }
    
    // ==================== User Management ====================
    
    private function registerUser($data) {
        // Validate required fields
        $required = ['name', 'email', 'position', 'department'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                $this->sendResponse(['error' => "Missing required field: $field"], 400);
                return;
            }
        }
        
        // Check if email already exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            $this->sendResponse(['error' => 'Email already registered'], 409);
            return;
        }
        
        // Generate employee code
        $employeeCode = 'EMP' . date('Y') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        // Insert new user
        $stmt = $this->pdo->prepare("
            INSERT INTO users (name, email, position, department, employee_code, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['position'],
            $data['department'],
            $employeeCode
        ]);
        
        $userId = $this->pdo->lastInsertId();
        
        // Initialize learning progress
        $this->initializeLearningProgress($userId);
        
        // Get created user
        $user = $this->getUserById($userId);
        
        $this->sendResponse([
            'success' => true,
            'message' => 'Registration successful',
            'user' => $user,
            'employee_code' => $employeeCode
        ]);
    }
    
    private function loginUser($data) {
        if (empty($data['email'])) {
            $this->sendResponse(['error' => 'Email is required'], 400);
            return;
        }
        
        $stmt = $this->pdo->prepare("
            SELECT u.*, 
                   COALESCE(lp.overall_progress, 0) as overall_progress,
                   COALESCE(lp.completed_modules, 0) as completed_modules
            FROM users u
            LEFT JOIN learning_progress lp ON u.id = lp.user_id
            WHERE u.email = ?
        ");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            $this->sendResponse(['error' => 'User not found'], 404);
            return;
        }
        
        // Update last login
        $stmt = $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // Get module progress
        $user['modules'] = $this->getUserModules($user['id']);
        
        $this->sendResponse([
            'success' => true,
            'user' => $user
        ]);
    }
    
    private function getUser() {
        $email = $_GET['email'] ?? '';
        $id = $_GET['id'] ?? '';
        
        if ($email) {
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
        } elseif ($id) {
            $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
        } else {
            $this->sendResponse(['error' => 'Email or ID required'], 400);
            return;
        }
        
        $user = $stmt->fetch();
        
        if (!$user) {
            $this->sendResponse(['error' => 'User not found'], 404);
            return;
        }
        
        $user['modules'] = $this->getUserModules($user['id']);
        $user['progress'] = $this->getUserProgress($user['id']);
        
        $this->sendResponse(['user' => $user]);
    }
    
    private function updateUser($data) {
        if (empty($data['id'])) {
            $this->sendResponse(['error' => 'User ID required'], 400);
            return;
        }
        
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'position', 'department'];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            $this->sendResponse(['error' => 'No fields to update'], 400);
            return;
        }
        
        $values[] = $data['id'];
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($values);
        
        $this->sendResponse(['success' => true, 'message' => 'User updated']);
    }
    
    private function checkEmail() {
        $email = $_GET['email'] ?? '';
        
        if (empty($email)) {
            $this->sendResponse(['error' => 'Email required'], 400);
            return;
        }
        
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $exists = $stmt->fetch() ? true : false;
        
        $this->sendResponse(['exists' => $exists]);
    }
    
    // ==================== Learning Progress ====================
    
    private function initializeLearningProgress($userId) {
        // Create main progress record
        $stmt = $this->pdo->prepare("
            INSERT INTO learning_progress (user_id, overall_progress, completed_modules, created_at)
            VALUES (?, 0, 0, NOW())
        ");
        $stmt->execute([$userId]);
        
        // Initialize module progress
        $modules = [
            ['basic_hotrunner', 'ความรู้เบื้องต้น Hot Runner', 1],
            ['hot_runner_advanced', 'Hot Runner Open Gate System', 2],
            ['pps_training', 'เทคนิคการใช้งาน PPS', 3],
            ['injection_simulation', 'Injection Molding Simulator', 4],
            ['3d_interactive', 'โมเดล 3D แบบโต้ตอบ', 5],
            ['calculator_tools', 'เครื่องมือคำนวณ', 6]
        ];
        
        $stmt = $this->pdo->prepare("
            INSERT INTO module_progress (user_id, module_id, module_name, module_order, progress, status, created_at)
            VALUES (?, ?, ?, ?, 0, 'not_started', NOW())
        ");
        
        foreach ($modules as $module) {
            $stmt->execute([$userId, $module[0], $module[1], $module[2]]);
        }
    }
    
    private function getProgress() {
        $userId = $_GET['user_id'] ?? '';
        
        if (empty($userId)) {
            $this->sendResponse(['error' => 'User ID required'], 400);
            return;
        }
        
        $progress = $this->getUserProgress($userId);
        $modules = $this->getUserModules($userId);
        
        $this->sendResponse([
            'progress' => $progress,
            'modules' => $modules
        ]);
    }
    
    private function getUserProgress($userId) {
        $stmt = $this->pdo->prepare("SELECT * FROM learning_progress WHERE user_id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch() ?: [
            'overall_progress' => 0,
            'completed_modules' => 0,
            'total_time_spent' => 0
        ];
    }
    
    private function getUserModules($userId) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM module_progress 
            WHERE user_id = ? 
            ORDER BY module_order ASC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
    
    private function updateProgress($data) {
        $userId = $data['user_id'] ?? '';
        $moduleId = $data['module_id'] ?? '';
        $progress = $data['progress'] ?? 0;
        $timeSpent = $data['time_spent'] ?? 0;
        
        if (empty($userId) || empty($moduleId)) {
            $this->sendResponse(['error' => 'User ID and Module ID required'], 400);
            return;
        }
        
        // Update module progress
        $stmt = $this->pdo->prepare("
            UPDATE module_progress 
            SET progress = GREATEST(progress, ?),
                time_spent = time_spent + ?,
                status = CASE 
                    WHEN ? >= 100 THEN 'completed'
                    WHEN ? > 0 THEN 'in_progress'
                    ELSE status
                END,
                completed_at = CASE WHEN ? >= 100 THEN NOW() ELSE completed_at END,
                updated_at = NOW()
            WHERE user_id = ? AND module_id = ?
        ");
        $stmt->execute([$progress, $timeSpent, $progress, $progress, $progress, $userId, $moduleId]);
        
        // Recalculate overall progress
        $this->recalculateOverallProgress($userId);
        
        $this->sendResponse(['success' => true, 'message' => 'Progress updated']);
    }
    
    private function completeModule($data) {
        $userId = $data['user_id'] ?? '';
        $moduleId = $data['module_id'] ?? '';
        $score = $data['score'] ?? 0;
        
        if (empty($userId) || empty($moduleId)) {
            $this->sendResponse(['error' => 'User ID and Module ID required'], 400);
            return;
        }
        
        // Mark module as completed
        $stmt = $this->pdo->prepare("
            UPDATE module_progress 
            SET progress = 100,
                status = 'completed',
                score = ?,
                completed_at = NOW(),
                updated_at = NOW()
            WHERE user_id = ? AND module_id = ?
        ");
        $stmt->execute([$score, $userId, $moduleId]);
        
        // Recalculate overall progress
        $this->recalculateOverallProgress($userId);
        
        // Check if all modules completed for certificate
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM module_progress WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        $allCompleted = $result['total'] == $result['completed'];
        
        $this->sendResponse([
            'success' => true,
            'message' => 'Module completed',
            'all_modules_completed' => $allCompleted
        ]);
    }
    
    private function recalculateOverallProgress($userId) {
        // Calculate average progress across all modules
        $stmt = $this->pdo->prepare("
            SELECT AVG(progress) as avg_progress,
                   SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                   SUM(time_spent) as total_time
            FROM module_progress WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        // Update overall progress
        $stmt = $this->pdo->prepare("
            UPDATE learning_progress 
            SET overall_progress = ?,
                completed_modules = ?,
                total_time_spent = ?,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            round($result['avg_progress'], 2),
            $result['completed'],
            $result['total_time'],
            $userId
        ]);
    }
    
    // ==================== Certificates ====================
    
    private function generateCertificate($data) {
        $userId = $data['user_id'] ?? '';
        $courseTitle = $data['course_title'] ?? 'Hot Runner Training';
        $score = $data['score'] ?? 0;
        
        if (empty($userId)) {
            $this->sendResponse(['error' => 'User ID required'], 400);
            return;
        }
        
        // Get user info
        $user = $this->getUserById($userId);
        if (!$user) {
            $this->sendResponse(['error' => 'User not found'], 404);
            return;
        }
        
        // Generate certificate number
        $certNumber = 'CERT-' . date('Ymd') . '-' . str_pad($userId, 4, '0', STR_PAD_LEFT) . '-' . mt_rand(100, 999);
        
        // Save certificate
        $stmt = $this->pdo->prepare("
            INSERT INTO certificates (user_id, certificate_number, course_title, score, issued_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $certNumber, $courseTitle, $score]);
        
        $this->sendResponse([
            'success' => true,
            'certificate' => [
                'number' => $certNumber,
                'user_name' => $user['name'],
                'course_title' => $courseTitle,
                'score' => $score,
                'issued_date' => date('Y-m-d H:i:s')
            ]
        ]);
    }
    
    private function getCertificates() {
        $userId = $_GET['user_id'] ?? '';
        
        if (empty($userId)) {
            $this->sendResponse(['error' => 'User ID required'], 400);
            return;
        }
        
        $stmt = $this->pdo->prepare("
            SELECT c.*, u.name as user_name
            FROM certificates c
            JOIN users u ON c.user_id = u.id
            WHERE c.user_id = ?
            ORDER BY c.issued_at DESC
        ");
        $stmt->execute([$userId]);
        $certificates = $stmt->fetchAll();
        
        $this->sendResponse(['certificates' => $certificates]);
    }
    
    // ==================== Leaderboard ====================
    
    private function getLeaderboard() {
        $limit = $_GET['limit'] ?? 10;
        
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.name, u.department, u.position,
                   lp.overall_progress, lp.completed_modules,
                   (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as certificates_count,
                   (SELECT AVG(score) FROM module_progress WHERE user_id = u.id AND score > 0) as avg_score
            FROM users u
            LEFT JOIN learning_progress lp ON u.id = lp.user_id
            ORDER BY lp.overall_progress DESC, lp.completed_modules DESC
            LIMIT ?
        ");
        $stmt->execute([(int)$limit]);
        $leaderboard = $stmt->fetchAll();
        
        $this->sendResponse(['leaderboard' => $leaderboard]);
    }
    
    // ==================== Helper Methods ====================
    
    private function getUserById($userId) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    
    private function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Run API
$api = new UserAPI();
$api->handleRequest();
?>
