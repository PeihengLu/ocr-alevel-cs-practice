-- PortableLeetcode question bank (SQLite).
-- Exercise schemas are separate in-memory databases, seeded per Run Query.

CREATE TABLE IF NOT EXISTS packs (
  pack_id TEXT NOT NULL PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  manifest_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_packs_imported_at ON packs (imported_at);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT NOT NULL PRIMARY KEY,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  starter_query TEXT NOT NULL,
  solution_query TEXT,
  effect_query TEXT,
  statement TEXT,
  checks_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  schema_ref TEXT NOT NULL,
  pack_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (pack_id) REFERENCES packs (pack_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_updated_at ON questions (updated_at);

CREATE TABLE IF NOT EXISTS sql_assets (
  schema_ref TEXT NOT NULL PRIMARY KEY,
  sql_text TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT NOT NULL PRIMARY KEY,
  question_id TEXT NOT NULL,
  submitted_sql TEXT NOT NULL,
  passed INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempts_question_created ON attempts (question_id, created_at);

CREATE TABLE IF NOT EXISTS progress (
  question_id TEXT NOT NULL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'unseen' CHECK (status IN ('unseen', 'attempted', 'passed')),
  best_passed INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);
