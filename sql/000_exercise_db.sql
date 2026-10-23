-- Exercise sandbox DB for student SELECT runs (separate from app tables).
-- Mounted for Docker first-boot init. The app also tries CREATE DATABASE IF NOT EXISTS.

CREATE DATABASE IF NOT EXISTS pl_exercise
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- MYSQL_USER (portable) is created by the official image before these scripts run.
GRANT ALL PRIVILEGES ON pl_exercise.* TO 'portable'@'%';
FLUSH PRIVILEGES;
