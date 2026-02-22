-- =============================================================
-- IT-portalen Database Schema
-- =============================================================

-- 0. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS `IT-portalen` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `IT-portalen`;

-- 1. USERS (For Register/Login)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. GUIDES (Veiledninger, Kurs, Feilsøking, Sikkerhet, osv.)
CREATE TABLE IF NOT EXISTS guides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category ENUM(
        'guide', 'troubleshooting', 'security', 'conflict', 'communication',
        'qa', 'ethics', 'privacy', 'ai', 'workplace', 'operations', 'tools'
    ) NOT NULL,
    media_type ENUM('text', 'video', 'document') DEFAULT 'text',
    media_url VARCHAR(255),
    difficulty ENUM('beginner', 'intermediate', 'advanced'),
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. NEWS (Nyheter, Varslinger, Programvareoppdateringer)
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type ENUM('news', 'alert', 'update') DEFAULT 'news',
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. FAQ (Ofte Stilte Spørsmål)
CREATE TABLE IF NOT EXISTS faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50),
    display_order INT DEFAULT 0
);

-- 5. CONTACT MESSAGES (Kontakt oss)
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'resolved') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. FEEDBACK (Tilbakemeldinger på nettsiden)
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    rating TINYINT,
    comment TEXT,
    page_context VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. CHATBOT HISTORY (Sesjoner og Meldinger)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    sender ENUM('user', 'bot') NOT NULL,
    message_text TEXT NOT NULL,
    intent VARCHAR(100) DEFAULT NULL, -- Lagrer AI-klassifisering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- 8. TICKETS (Komplett Brukerstøtte System)
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    source_system VARCHAR(50) DEFAULT 'IT-portalen',
    received_via ENUM('form', 'phone', 'email', 'chat', 'other') DEFAULT 'form',
    incident_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(100),
    user_contact VARCHAR(100),
    user_department VARCHAR(100),
    user_location VARCHAR(100),
    pc_name VARCHAR(50),
    ip_address VARCHAR(45),
    title VARCHAR(255) NOT NULL,
    category ENUM(
        'access', 'hardware', 'software', 'email_teams', 'network', 
        'server', 'security', 'training', 'other'
    ) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    impact ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    description TEXT,
    error_message TEXT,
    expected_behavior TEXT,
    reproduction_steps TEXT,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    troubleshooting_log TEXT,
    solution_type ENUM('guidance', 'device_fix', 'system_fix', 'workaround', 'escalated'),
    solution_description TEXT,
    root_cause VARCHAR(255),
    time_spent VARCHAR(20),
    learning_points TEXT,
    sla_deadline DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. COURSE PROGRESS & QUIZ (VG1/VG2 Læring)
CREATE TABLE IF NOT EXISTS course_progress (
    user_id INT,
    course_slug VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    PRIMARY KEY (user_id, course_slug),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_slug VARCHAR(255),
    score INT,
    total_questions INT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
