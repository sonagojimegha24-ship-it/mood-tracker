CREATE DATABASE mood_muse;
USE mood_muse;
CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(50),
email VARCHAR(100) UNIQUE,
password_hash VARCHAR(255)
);
CREATE TABLE moods (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
mood VARCHAR(20),
note TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- sample user
INSERT INTO users (name, email, password_hash)
VALUES ('demo user', 'demo@gmail.com', 'hashed_password_here');
-- sample mood
INSERT INTO moods (user_id, mood, note)
VALUES (1, 'Happy', 'First sample mood');