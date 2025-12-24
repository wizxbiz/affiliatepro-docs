<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'hot_runner_quiz');
define('DB_USER', 'root');
define('DB_PASS', '');

// Admin Configuration
define('ADMIN_CODE', 'imt2019');

// Timezone
date_default_timezone_set('Asia/Bangkok');

// Error Reporting (ปิดในการใช้งานจริง)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
?>