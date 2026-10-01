CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id CHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_active (user_id, revoked_at, expires_at)
);

-- Lưu ý:
-- password_hash phải là bcrypt hash, không lưu mật khẩu dạng plain text.
