use crate::merge::{merge_pack_into_bank, progress_for, questions_from_bank, MergeStats};
use crate::models::{
    hide_solution, now_iso, AttemptRecord, BankSnapshot, PackPayload, ProgressRecord,
    QuestionSummary, SqlQuestion, StorageStatus,
};
use crate::pack::read_sql_catalog;
use rusqlite::{params, Connection};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use uuid::Uuid;

pub struct BankState {
    inner: Mutex<Inner>,
}

struct Inner {
    bank: BankSnapshot,
    backend: String,
    sqlite_ready: bool,
    message: String,
    data_dir: PathBuf,
    resource_dir: PathBuf,
    conn: Option<Connection>,
}

impl BankState {
    pub fn init(data_dir: PathBuf, resource_dir: PathBuf) -> Result<Self, String> {
        fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
        let json_path = data_dir.join("question-bank.json");
        let sqlite_path = data_dir.join("portable-leetcode.sqlite");

        let mut bank = load_json_bank(&json_path)?;
        let mut backend = "json".to_string();
        let mut message = format!("Using local JSON bank at {}.", json_path.display());
        let mut sqlite_ready = false;
        let mut conn = None;

        let force_json = std::env::var("PORTABLE_LEETCODE_STORAGE")
            .map(|v| v.eq_ignore_ascii_case("json"))
            .unwrap_or(false)
            || std::env::var("MYSQL_DISABLED").ok().as_deref() == Some("1");

        match open_sqlite(&sqlite_path, &resource_dir) {
            Ok(db) => {
                sqlite_ready = true;
                if force_json {
                    backend = "json".into();
                    message = "JSON bank forced via PORTABLE_LEETCODE_STORAGE=json.".into();
                    conn = Some(db);
                } else {
                    match hydrate_from_sqlite(&db) {
                        Ok(from_db) => {
                            bank = prefer_sqlite_bank(bank, from_db);
                            backend = "sqlite".into();
                            message = format!("SQLite database at {}.", sqlite_path.display());
                            conn = Some(db);
                            let _ = save_json_bank(&json_path, &bank);
                        }
                        Err(err) => {
                            message = format!(
                                "SQLite unavailable ({err}). Using JSON bank at {}.",
                                json_path.display()
                            );
                            conn = Some(db);
                        }
                    }
                }
            }
            Err(err) => {
                message = format!(
                    "SQLite failed to load ({err}). Using JSON bank at {}.",
                    json_path.display()
                );
            }
        }

        let state = Self {
            inner: Mutex::new(Inner {
                bank,
                backend,
                sqlite_ready,
                message,
                data_dir,
                resource_dir,
                conn,
            }),
        };
        state.install_builtin_sql()?;
        Ok(state)
    }

    pub fn storage_status(&self) -> StorageStatus {
        let g = self.inner.lock().expect("bank lock");
        StorageStatus {
            backend: g.backend.clone(),
            sqlite_ready: g.sqlite_ready,
            message: g.message.clone(),
            question_count: g.bank.questions.len(),
        }
    }

    pub fn list_questions(&self) -> Vec<SqlQuestion> {
        let g = self.inner.lock().expect("bank lock");
        questions_from_bank(&g.bank)
            .into_iter()
            .map(hide_solution)
            .collect()
    }

    pub fn list_question_summaries(&self) -> Vec<QuestionSummary> {
        let g = self.inner.lock().expect("bank lock");
        questions_from_bank(&g.bank)
            .into_iter()
            .map(|question| {
                let progress = progress_for(&g.bank, &question.id);
                QuestionSummary {
                    question: hide_solution(question),
                    progress,
                }
            })
            .collect()
    }

    pub fn get_question(&self, id: &str) -> Option<SqlQuestion> {
        let g = self.inner.lock().expect("bank lock");
        g.bank.questions.get(id).cloned().map(hide_solution)
    }

    pub fn get_question_full(&self, id: &str) -> Option<SqlQuestion> {
        let g = self.inner.lock().expect("bank lock");
        g.bank.questions.get(id).cloned()
    }

    pub fn get_sql_asset(&self, schema_ref: &str) -> Option<String> {
        let g = self.inner.lock().expect("bank lock");
        g.bank.sql_assets.get(schema_ref).cloned()
    }

    pub fn import_pack(&self, pack: PackPayload) -> Result<MergeStats, String> {
        let mut g = self.inner.lock().expect("bank lock");
        let (next, stats) = merge_pack_into_bank(&g.bank, &pack);
        g.bank = next;
        persist(&mut g, Some(&pack))?;
        Ok(stats)
    }

    pub fn record_attempt(
        &self,
        question_id: &str,
        submitted_sql: &str,
        passed: Option<bool>,
    ) -> Result<(), String> {
        let mut g = self.inner.lock().expect("bank lock");
        let attempt = AttemptRecord {
            id: Uuid::new_v4().to_string(),
            question_id: question_id.to_string(),
            submitted_sql: submitted_sql.to_string(),
            passed,
            created_at: now_iso(),
        };
        let prev = progress_for(&g.bank, question_id);
        let best_passed = prev.best_passed || passed == Some(true);
        let status = if best_passed { "passed" } else { "attempted" };
        let progress = ProgressRecord {
            question_id: question_id.to_string(),
            status: status.into(),
            best_passed,
            attempt_count: prev.attempt_count + 1,
            last_attempt_at: Some(attempt.created_at.clone()),
        };
        g.bank.attempts.push(attempt.clone());
        g.bank.progress.insert(question_id.to_string(), progress.clone());
        persist_attempt(&mut g, &attempt, &progress)
    }

    fn install_builtin_sql(&self) -> Result<(), String> {
        let catalog_root = {
            let g = self.inner.lock().expect("bank lock");
            resolve_catalog_root(&g.resource_dir)
        };
        match read_sql_catalog(&catalog_root) {
            Ok(pack) => {
                let stats = self.import_pack(pack)?;
                log::info!(
                    "SQL catalog: {} updated, {} unchanged, {} retired",
                    stats.merged,
                    stats.skipped,
                    stats.retired
                );
                Ok(())
            }
            Err(err) => {
                log::error!("SQL catalog failed ({}): {err}", catalog_root.display());
                Ok(())
            }
        }
    }
}

fn resolve_catalog_root(resource_dir: &Path) -> PathBuf {
    let candidates = [
        resource_dir.join("samples/sql-basics"),
        resource_dir.join("../samples/sql-basics"),
        PathBuf::from("samples/sql-basics"),
        PathBuf::from("../samples/sql-basics"),
    ];
    for c in candidates {
        if c.join("manifest.json").exists() {
            return c;
        }
    }
    resource_dir.join("samples/sql-basics")
}

fn open_sqlite(path: &Path, resource_dir: &Path) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| e.to_string())?;
    let schema = read_schema_sql(resource_dir)?;
    conn.execute_batch(&schema).map_err(|e| e.to_string())?;
    ensure_column(&conn, "questions", "effect_query", "TEXT")?;
    ensure_column(&conn, "questions", "statement", "TEXT")?;
    Ok(conn)
}

fn read_schema_sql(resource_dir: &Path) -> Result<String, String> {
    let candidates = [
        resource_dir.join("sql/001_app_schema.sql"),
        resource_dir.join("../sql/001_app_schema.sql"),
        PathBuf::from("sql/001_app_schema.sql"),
        PathBuf::from("../sql/001_app_schema.sql"),
    ];
    for c in candidates {
        if c.exists() {
            return fs::read_to_string(c).map_err(|e| e.to_string());
        }
    }
    Err("Could not find sql/001_app_schema.sql".into())
}

fn ensure_column(conn: &Connection, table: &str, column: &str, definition: &str) -> Result<(), String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({table})"))
        .map_err(|e| e.to_string())?;
    let names = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    if names.iter().any(|n| n == column) {
        return Ok(());
    }
    conn.execute(
        &format!("ALTER TABLE {table} ADD COLUMN {column} {definition}"),
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn load_json_bank(path: &Path) -> Result<BankSnapshot, String> {
    match fs::read_to_string(path) {
        Ok(raw) => serde_json::from_str(&raw).map_err(|e| e.to_string()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(BankSnapshot::default()),
        Err(err) => Err(err.to_string()),
    }
}

fn save_json_bank(path: &Path, bank: &BankSnapshot) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let body = serde_json::to_string_pretty(bank).map_err(|e| e.to_string())?;
    fs::write(path, format!("{body}\n")).map_err(|e| e.to_string())
}

fn prefer_sqlite_bank(json: BankSnapshot, sqlite: BankSnapshot) -> BankSnapshot {
    if !sqlite.questions.is_empty() || json.questions.is_empty() {
        let mut next = sqlite;
        if next.progress.is_empty() && !json.progress.is_empty() {
            next.progress = json.progress;
        }
        if next.attempts.is_empty() && !json.attempts.is_empty() {
            next.attempts = json.attempts;
        }
        next
    } else if !sqlite.progress.is_empty() {
        let mut next = json;
        for (k, v) in sqlite.progress {
            next.progress.insert(k, v);
        }
        if !sqlite.attempts.is_empty() {
            next.attempts = sqlite.attempts;
        }
        next
    } else {
        json
    }
}

fn hydrate_from_sqlite(conn: &Connection) -> Result<BankSnapshot, String> {
    let mut bank = BankSnapshot::default();

    {
        let mut stmt = conn
            .prepare(
                "SELECT id, version, title, prompt, starter_query, solution_query,
                        effect_query, statement, checks_json, tags_json, difficulty, schema_ref
                 FROM questions",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, Option<String>>(6)?,
                    row.get::<_, Option<String>>(7)?,
                    row.get::<_, String>(8)?,
                    row.get::<_, String>(9)?,
                    row.get::<_, String>(10)?,
                    row.get::<_, String>(11)?,
                ))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (
                id,
                version,
                title,
                prompt,
                starter_query,
                solution_query,
                effect_query,
                statement,
                checks_json,
                tags_json,
                difficulty,
                schema_ref,
            ) = row.map_err(|e| e.to_string())?;
            let checks = serde_json::from_str(&checks_json).unwrap_or_default();
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let effect = effect_query.filter(|s| !s.trim().is_empty());
            let statement = match statement.as_deref() {
                Some("insert" | "delete" | "drop") => statement,
                _ => None,
            };
            bank.questions.insert(
                id.clone(),
                SqlQuestion {
                    id,
                    version,
                    title,
                    prompt,
                    starter_query,
                    solution_query,
                    statement,
                    effect_query: effect,
                    checks,
                    tags,
                    difficulty,
                    schema_ref,
                },
            );
        }
    }

    {
        let mut stmt = conn
            .prepare("SELECT schema_ref, sql_text FROM sql_assets")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (k, v) = row.map_err(|e| e.to_string())?;
            bank.sql_assets.insert(k, v);
        }
    }

    {
        let mut stmt = conn
            .prepare("SELECT pack_id, version, title, imported_at FROM packs")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(crate::models::PackMeta {
                    pack_id: row.get(0)?,
                    version: row.get(1)?,
                    title: row.get(2)?,
                    imported_at: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let meta = row.map_err(|e| e.to_string())?;
            bank.packs.insert(meta.pack_id.clone(), meta);
        }
    }

    {
        let mut stmt = conn
            .prepare(
                "SELECT id, question_id, submitted_sql, passed, created_at FROM attempts",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let passed: Option<i64> = row.get(3)?;
                Ok(AttemptRecord {
                    id: row.get(0)?,
                    question_id: row.get(1)?,
                    submitted_sql: row.get(2)?,
                    passed: passed.map(|v| v == 1),
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            bank.attempts.push(row.map_err(|e| e.to_string())?);
        }
    }

    {
        let mut stmt = conn
            .prepare(
                "SELECT question_id, status, best_passed, attempt_count, last_attempt_at FROM progress",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let best_passed: i64 = row.get(2)?;
                Ok(ProgressRecord {
                    question_id: row.get(0)?,
                    status: row.get(1)?,
                    best_passed: best_passed == 1,
                    attempt_count: row.get(3)?,
                    last_attempt_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let mut p = row.map_err(|e| e.to_string())?;
            if p.best_passed {
                p.status = "passed".into();
            }
            bank.progress.insert(p.question_id.clone(), p);
        }
    }

    Ok(bank)
}

fn persist(inner: &mut Inner, imported: Option<&PackPayload>) -> Result<(), String> {
    let json_path = inner.data_dir.join("question-bank.json");
    save_json_bank(&json_path, &inner.bank)?;
    if inner.backend != "sqlite" {
        return Ok(());
    }
    let Some(conn) = inner.conn.as_mut() else {
        return Ok(());
    };
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let now = now_iso();
    if let Some(pack) = imported {
        tx.execute(
            "INSERT INTO packs (pack_id, version, title, description, imported_at, manifest_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(pack_id) DO UPDATE SET
               version = excluded.version,
               title = excluded.title,
               description = excluded.description,
               imported_at = excluded.imported_at,
               manifest_json = excluded.manifest_json",
            params![
                pack.manifest.pack_id,
                pack.manifest.version,
                pack.manifest.title,
                pack.manifest.description,
                now,
                serde_json::to_string(&pack.manifest).unwrap_or_else(|_| "{}".into()),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for (ref_name, sql) in &inner.bank.sql_assets {
        tx.execute(
            "INSERT INTO sql_assets (schema_ref, sql_text, updated_at)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(schema_ref) DO UPDATE SET
               sql_text = excluded.sql_text,
               updated_at = excluded.updated_at",
            params![ref_name, sql, now],
        )
        .map_err(|e| e.to_string())?;
    }

    let pack_id = imported.map(|p| p.manifest.pack_id.as_str());
    for question in inner.bank.questions.values() {
        upsert_question(&tx, question, pack_id, &now)?;
    }

    if let Some(pack) = imported {
        if let Some(retired) = &pack.manifest.retired_ids {
            for id in retired {
                tx.execute("DELETE FROM questions WHERE id = ?1", params![id])
                    .map_err(|e| e.to_string())?;
                tx.execute("DELETE FROM progress WHERE question_id = ?1", params![id])
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn persist_attempt(
    inner: &mut Inner,
    attempt: &AttemptRecord,
    progress: &ProgressRecord,
) -> Result<(), String> {
    let json_path = inner.data_dir.join("question-bank.json");
    save_json_bank(&json_path, &inner.bank)?;
    if inner.backend != "sqlite" {
        return Ok(());
    }
    let Some(conn) = inner.conn.as_mut() else {
        return Ok(());
    };
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    if let Some(question) = inner.bank.questions.get(&attempt.question_id) {
        upsert_question(&tx, question, None, &now_iso())?;
    }
    tx.execute(
        "INSERT INTO attempts (id, question_id, submitted_sql, passed, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            attempt.id,
            attempt.question_id,
            attempt.submitted_sql,
            attempt.passed.map(|p| if p { 1 } else { 0 }),
            attempt.created_at,
        ],
    )
    .map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO progress (question_id, status, best_passed, attempt_count, last_attempt_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(question_id) DO UPDATE SET
           status = excluded.status,
           best_passed = excluded.best_passed,
           attempt_count = excluded.attempt_count,
           last_attempt_at = excluded.last_attempt_at",
        params![
            progress.question_id,
            progress.status,
            if progress.best_passed { 1 } else { 0 },
            progress.attempt_count,
            progress.last_attempt_at,
        ],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn upsert_question(
    tx: &rusqlite::Transaction<'_>,
    question: &SqlQuestion,
    pack_id: Option<&str>,
    now: &str,
) -> Result<(), String> {
    tx.execute(
        "INSERT INTO questions (
           id, version, title, prompt, starter_query, solution_query,
           effect_query, statement, checks_json, tags_json, difficulty, schema_ref, pack_id, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
         ON CONFLICT(id) DO UPDATE SET
           version = excluded.version,
           title = excluded.title,
           prompt = excluded.prompt,
           starter_query = excluded.starter_query,
           solution_query = excluded.solution_query,
           effect_query = excluded.effect_query,
           statement = excluded.statement,
           checks_json = excluded.checks_json,
           tags_json = excluded.tags_json,
           difficulty = excluded.difficulty,
           schema_ref = excluded.schema_ref,
           pack_id = COALESCE(excluded.pack_id, questions.pack_id),
           updated_at = excluded.updated_at",
        params![
            question.id,
            question.version,
            question.title,
            question.prompt,
            question.starter_query,
            question.solution_query,
            question.effect_query,
            question.statement,
            serde_json::to_string(&question.checks).unwrap_or_else(|_| "[]".into()),
            serde_json::to_string(&question.tags).unwrap_or_else(|_| "[]".into()),
            question.difficulty,
            question.schema_ref,
            pack_id,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
