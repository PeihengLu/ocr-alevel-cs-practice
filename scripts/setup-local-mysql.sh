#!/usr/bin/env bash
# Dev-only helper: create PortableLeetcode DB + user on a local Homebrew MySQL/MariaDB.
# Shipped student/teacher builds must NOT require this — they will use a bundled mysqld.
set -euo pipefail

MYSQL_BIN="${MYSQL_BIN:-}"
if [[ -z "$MYSQL_BIN" ]]; then
  if command -v mysql >/dev/null 2>&1; then
    MYSQL_BIN="$(command -v mysql)"
  elif [[ -x /opt/homebrew/opt/mysql/bin/mysql ]]; then
    MYSQL_BIN=/opt/homebrew/opt/mysql/bin/mysql
  elif [[ -x /opt/homebrew/opt/mariadb/bin/mariadb ]]; then
    MYSQL_BIN=/opt/homebrew/opt/mariadb/bin/mariadb
  else
    echo "mysql client not found. Install with: brew install mysql   # or: brew install mariadb"
    exit 1
  fi
fi

ROOT_ARGS=(-u root)
# Homebrew MySQL often has an empty root password over socket auth.
if [[ -n "${MYSQL_ROOT_PASSWORD:-}" ]]; then
  ROOT_ARGS+=(-p"${MYSQL_ROOT_PASSWORD}")
fi

echo "Using client: $MYSQL_BIN"
"$MYSQL_BIN" "${ROOT_ARGS[@]}" <<'SQL'
CREATE DATABASE IF NOT EXISTS portable_leetcode
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS pl_exercise
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'portable'@'localhost' IDENTIFIED BY 'portable';
CREATE USER IF NOT EXISTS 'portable'@'127.0.0.1' IDENTIFIED BY 'portable';

GRANT ALL PRIVILEGES ON portable_leetcode.* TO 'portable'@'localhost';
GRANT ALL PRIVILEGES ON portable_leetcode.* TO 'portable'@'127.0.0.1';
GRANT ALL PRIVILEGES ON pl_exercise.* TO 'portable'@'localhost';
GRANT ALL PRIVILEGES ON pl_exercise.* TO 'portable'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/sql/001_app_schema.sql" ]]; then
  echo "Applying app schema…"
  "$MYSQL_BIN" "${ROOT_ARGS[@]}" portable_leetcode < "$ROOT/sql/001_app_schema.sql"
fi

echo "OK — app can connect with MYSQL_USER=portable MYSQL_PASSWORD=portable"
echo "Defaults match src/main/db/config.ts (.env.example)."
