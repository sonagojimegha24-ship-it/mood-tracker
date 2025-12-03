<?php
require 'db.php';
header('Content-Type: application/json');

// ===== SESSION VERIFICATION =====
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Not authenticated']));
}

// ===== SESSION HIJACKING PREVENTION =====
if ($_SESSION['ip'] !== $_SERVER['REMOTE_ADDR'] || $_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
    session_destroy();
    http_response_code(403);
    die(json_encode(['success' => false, 'message' => 'Session invalid']));
}

// ===== SESSION TIMEOUT (1 hour) =====
if (time() - $_SESSION['login_time'] > 3600) {
    session_destroy();
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Session expired']));
}

// ===== REQUEST METHOD VALIDATION =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Invalid request method']));
}

// ===== INPUT VALIDATION =====
$valid_moods = ['happy', 'sad', 'angry', 'calm', 'anxious', 'excited', 'bored', 'tired', 'grateful', 'confused', 'motivated', 'stressed'];
$mood = preg_replace('/[^a-z]/', '', $_POST['mood'] ?? '');
$note = substr($_POST['note'] ?? '', 0, 500);

if (!in_array($mood, $valid_moods)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid mood']));
}

// ===== INSERT MOOD =====
try {
    $user_id = $_SESSION['user_id'];
    $stmt = $conn->prepare("INSERT INTO moods (user_id, mood, note, created_at) VALUES (?, ?, ?, NOW())");
    
    if (!$stmt) {
        throw new Exception('Prepare failed');
    }
    
    $stmt->bind_param("iss", $user_id, $mood, $note);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Mood saved successfully']);
    } else {
        throw new Exception('Insert failed');
    }
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to save mood']));
}
?>
