<?php
require 'db.php';
header('Content-Type: application/json');

// ===== VALIDATE REQUEST METHOD =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Invalid request method']));
}

// ===== CSRF TOKEN VALIDATION =====
$csrf_token = $_POST['csrf_token'] ?? '';
if (empty($csrf_token) || $csrf_token !== $_SESSION['csrf_token']) {
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'CSRF token invalid']));
}

// ===== INPUT VALIDATION =====
$username = preg_replace('/[^a-zA-Z0-9_]/', '', $_POST['username'] ?? '');
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$pass = $_POST['password'] ?? '';
$pass_confirm = $_POST['password_confirm'] ?? '';

if (!$username || !$email || !$pass) {
    die(json_encode(['success' => false, 'message' => 'All fields required']));
}

if (strlen($pass) < 8) {
    die(json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']));
}

if ($pass !== $pass_confirm) {
    die(json_encode(['success' => false, 'message' => 'Passwords do not match']));
}

if (strlen($username) < 3 || strlen($username) > 50) {
    die(json_encode(['success' => false, 'message' => 'Username must be 3-50 characters']));
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die(json_encode(['success' => false, 'message' => 'Invalid email format']));
}

// ===== CHECK IF EMAIL EXISTS =====
try {
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()) {
        die(json_encode(['success' => false, 'message' => 'Email already registered']));
    }
    $stmt->close();

    // ===== CHECK IF USERNAME EXISTS =====
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()) {
        die(json_encode(['success' => false, 'message' => 'Username already taken']));
    }
    $stmt->close();

    // ===== HASH PASSWORD WITH BCRYPT =====
    $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);

    // ===== INSERT NEW USER =====
    $stmt = $conn->prepare("INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())");
    $stmt->bind_param("sss", $username, $email, $hash);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Registration successful! Please login.']);
    } else {
        throw new Exception('Insert failed');
    }
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Registration failed']));
}
?>