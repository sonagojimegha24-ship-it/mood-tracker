<?php
require 'db.php';
header('Content-Type: application/json');

// ===== RATE LIMITING =====
$max_attempts = 5;
$lockout_time = 900; // 15 minutes
$ip = $_SERVER['REMOTE_ADDR'];
$attempt_key = "login_attempt_" . hash('sha256', $ip);

if (isset($_SESSION[$attempt_key])) {
    $attempts = $_SESSION[$attempt_key];
    if ($attempts['count'] >= $max_attempts && (time() - $attempts['time']) < $lockout_time) {
        http_response_code(429);
        die(json_encode(['success' => false, 'message' => 'Too many login attempts. Try again in 15 minutes.']));
    }
    if ((time() - $attempts['time']) >= $lockout_time) {
        unset($_SESSION[$attempt_key]);
    }
}

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
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$pass = $_POST['password'] ?? '';

if (!$email || !$pass) {
    die(json_encode(['success' => false, 'message' => 'Email and password required']));
}

if (strlen($pass) < 8) {
    die(json_encode(['success' => false, 'message' => 'Invalid credentials']));
}

// ===== CHECK USER =====
try {
    $stmt = $conn->prepare("SELECT id, username, password_hash FROM users WHERE email = ?");
    if (!$stmt) {
        throw new Exception('Prepare failed');
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    if (!$row) {
        // Increment failed attempts
        if (!isset($_SESSION[$attempt_key])) {
            $_SESSION[$attempt_key] = ['count' => 0, 'time' => time()];
        }
        $_SESSION[$attempt_key]['count']++;
        die(json_encode(['success' => false, 'message' => 'Invalid credentials']));
    }

    // ===== VERIFY PASSWORD =====
    if (!password_verify($pass, $row['password_hash'])) {
        // Increment failed attempts
        if (!isset($_SESSION[$attempt_key])) {
            $_SESSION[$attempt_key] = ['count' => 0, 'time' => time()];
        }
        $_SESSION[$attempt_key]['count']++;
        die(json_encode(['success' => false, 'message' => 'Invalid credentials']));
    }

    // ===== CLEAR FAILED ATTEMPTS & CREATE SESSION =====
    unset($_SESSION[$attempt_key]);
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['username'] = $row['username'];
    $_SESSION['login_time'] = time();
    $_SESSION['ip'] = $ip;
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
    $_SESSION['auth_token'] = bin2hex(random_bytes(32));

    echo json_encode(['success' => true, 'message' => 'Login successful', 'username' => $row['username']]);
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Login failed']));
}
?>
