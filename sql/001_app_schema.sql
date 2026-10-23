-- PortableLeetcode app schema (MySQL 8+)
-- Database name defaults to portable_leetcode (see MYSQL_DATABASE / .env).
-- Exercise practice schemas are separate DBs created per question at runtime (later slice).

CREATE TABLE IF NOT EXISTS packs (
  pack_id VARCHAR(128) NOT NULL PRIMARY KEY,
  version VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  imported_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  manifest_json JSON NOT NULL,
  INDEX idx_packs_imported_at (imported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(128) NOT NULL PRIMARY KEY,
  version INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  starter_query TEXT NOT NULL,
  solution_query TEXT NULL,
  checks_json JSON NOT NULL,
  tags_json JSON NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  schema_ref VARCHAR(128) NOT NULL,
  pack_id VARCHAR(128) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_questions_pack
    FOREIGN KEY (pack_id) REFERENCES packs (pack_id)
    ON DELETE SET NULL,
  INDEX idx_questions_difficulty (difficulty),
  INDEX idx_questions_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sql_assets (
  schema_ref VARCHAR(128) NOT NULL PRIMARY KEY,
  sql_text LONGTEXT NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attempts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  question_id VARCHAR(128) NOT NULL,
  submitted_sql TEXT NOT NULL,
  passed TINYINT(1) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_attempts_question
    FOREIGN KEY (question_id) REFERENCES questions (id)
    ON DELETE CASCADE,
  INDEX idx_attempts_question_created (question_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progress (
  question_id VARCHAR(128) NOT NULL PRIMARY KEY,
  status ENUM('unseen', 'attempted', 'passed') NOT NULL DEFAULT 'unseen',
  best_passed TINYINT(1) NOT NULL DEFAULT 0,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_attempt_at DATETIME(3) NULL,
  CONSTRAINT fk_progress_question
    FOREIGN KEY (question_id) REFERENCES questions (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
