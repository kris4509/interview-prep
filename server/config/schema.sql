CREATE DATABASE IF NOT EXISTS interview_prep;
USE interview_prep;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text TEXT NOT NULL,
  category ENUM('behavioral', 'technical', 'system_design', 'curveball') NOT NULL,
  role_tag VARCHAR(50) DEFAULT 'general',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150),
  mode ENUM('online', 'in_person') DEFAULT 'online',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  question_id INT NOT NULL,
  audio_url VARCHAR(255),
  transcript_text TEXT,
  duration_seconds INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE feedback_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT NOT NULL,
  star_structure_score TINYINT,
  specificity_score TINYINT,
  filler_word_count INT,
  pacing_notes TEXT,
  content_gap_notes TEXT,
  suggested_rewrite TEXT,
  raw_llm_output JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE
);

INSERT INTO questions (text, category, role_tag, difficulty) VALUES
('Tell me about a time you disagreed with a teammate. How did you handle it?', 'behavioral', 'general', 'medium'),
('Walk me through how you would design a URL shortener.', 'system_design', 'backend', 'medium'),
('Describe a project where you had to learn a new technology quickly.', 'behavioral', 'general', 'easy'),
('How would you optimize a slow MySQL query?', 'technical', 'backend', 'medium'),
('Tell me about a mistake you made and what you learned from it.', 'behavioral', 'general', 'hard');