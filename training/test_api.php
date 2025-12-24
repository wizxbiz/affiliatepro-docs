<?php
// ทดสอบการเชื่อมต่อฐานข้อมูล
$host = 'localhost';
$dbname = 'hot_runner_quiz';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    echo "เชื่อมต่อฐานข้อมูลสำเร็จ<br>";
    
    // ทดสอบดึงข้อมูล
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "ตารางในฐานข้อมูล: " . implode(", ", $tables) . "<br>";
    
} catch(PDOException $e) {
    echo "ข้อผิดพลาด: " . $e->getMessage();
}
?>