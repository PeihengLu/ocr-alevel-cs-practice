use crate::bank::BankState;
use crate::compare::{evaluate_checks, to_grid};
use crate::models::{QueryRunResult, SqlQuestion};
use crate::sanitize::{assert_practice_statement, assert_safe_select};
use rusqlite::{types::ValueRef, Connection};
use serde_json::{Number, Value};
use std::collections::HashMap;
use std::sync::Arc;

pub fn run_student_query(
    bank: &Arc<BankState>,
    question_id: &str,
    raw_sql: &str,
) -> QueryRunResult {
    let Some(question) = bank.get_question_full(question_id) else {
        return QueryRunResult {
            ok: false,
            passed: false,
            message: format!("Unknown question \"{question_id}\""),
            question_id: question_id.to_string(),
            sql: raw_sql.to_string(),
            result: None,
            checks: None,
        };
    };

    let kind = question.statement.as_deref().unwrap_or("select");
    let safe_sql = match assert_practice_statement(raw_sql, kind) {
        Ok(sql) => sql,
        Err(message) => {
            let _ = bank.record_attempt(&question.id, raw_sql, Some(false));
            return fail(&question, raw_sql, message);
        }
    };

    if kind != "select" && question.effect_query.as_deref().unwrap_or("").trim().is_empty()
    {
        return fail(&question, &safe_sql, "This question is missing its check query.");
    }

    let Some(seed) = bank.get_sql_asset(&question.schema_ref) else {
        return fail(
            &question,
            raw_sql,
            format!(
                "Missing SQL schema asset \"{}\" for this question.",
                question.schema_ref
            ),
        );
    };

    let conn = match Connection::open_in_memory() {
        Ok(c) => c,
        Err(err) => {
            return fail(&question, raw_sql, format!("SQLite unavailable: {err}"));
        }
    };

    if let Err(err) = conn.execute_batch(&seed) {
        let _ = bank.record_attempt(&question.id, raw_sql, Some(false));
        return fail(&question, raw_sql, format!("Query failed: {err}"));
    }

    if kind != "select" {
        return run_write_and_grade(bank, &conn, &question, &safe_sql);
    }

    match query_grid(&conn, &safe_sql) {
        Ok(raw) => {
            if raw.columns.is_empty() {
                let _ = bank.record_attempt(&question.id, &safe_sql, Some(false));
                return fail(
                    &question,
                    &safe_sql,
                    "Query did not return a result set (SELECT required).",
                );
            }
            let grid = to_grid(raw.columns, raw.rows);
            let outcomes = evaluate_checks(&grid, &question.checks);
            let passed = outcomes.is_empty() || outcomes.iter().all(|c| c.passed);
            let _ = bank.record_attempt(&question.id, &safe_sql, Some(passed));
            QueryRunResult {
                ok: true,
                passed,
                question_id: question.id.clone(),
                sql: safe_sql,
                result: Some(grid),
                checks: Some(outcomes),
                message: if passed {
                    "Passed — your result matches the expected checks.".into()
                } else {
                    "Not yet — see check details below and try again.".into()
                },
            }
        }
        Err(err) => {
            let _ = bank.record_attempt(&question.id, raw_sql, Some(false));
            fail(&question, raw_sql, format!("Query failed: {err}"))
        }
    }
}

fn run_write_and_grade(
    bank: &Arc<BankState>,
    conn: &Connection,
    question: &SqlQuestion,
    safe_sql: &str,
) -> QueryRunResult {
    let effect = question.effect_query.clone().unwrap_or_default();
    let effect_sql = match assert_safe_select(&effect) {
        Ok(sql) => sql,
        Err(err) => {
            return fail(
                question,
                safe_sql,
                format!("Check query was rejected: {err}"),
            );
        }
    };

    if let Err(err) = conn.execute_batch(safe_sql) {
        let _ = bank.record_attempt(&question.id, safe_sql, Some(false));
        return fail(question, safe_sql, format!("Query failed: {err}"));
    }

    match query_grid(conn, &effect_sql) {
        Ok(raw) => {
            if raw.columns.is_empty() {
                let _ = bank.record_attempt(&question.id, safe_sql, Some(false));
                return fail(question, safe_sql, "Check query did not return a result set.");
            }
            let grid = to_grid(raw.columns, raw.rows);
            let outcomes = evaluate_checks(&grid, &question.checks);
            let passed = outcomes.is_empty() || outcomes.iter().all(|c| c.passed);
            let _ = bank.record_attempt(&question.id, safe_sql, Some(passed));
            QueryRunResult {
                ok: true,
                passed,
                question_id: question.id.clone(),
                sql: safe_sql.to_string(),
                result: Some(grid),
                checks: Some(outcomes),
                message: if passed {
                    "Passed — the database matches after your statement.".into()
                } else {
                    "Not yet — the database does not match. Look at the table below and try again."
                        .into()
                },
            }
        }
        Err(err) => {
            let _ = bank.record_attempt(&question.id, safe_sql, Some(false));
            fail(question, safe_sql, format!("Query failed: {err}"))
        }
    }
}

struct RawGrid {
    columns: Vec<String>,
    rows: Vec<HashMap<String, Value>>,
}

fn query_grid(conn: &Connection, sql: &str) -> Result<RawGrid, String> {
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let columns: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();
    if columns.is_empty() {
        // Non-SELECT may have no columns; treat as empty result.
        let _ = stmt.execute([]);
        return Ok(RawGrid {
            columns: vec![],
            rows: vec![],
        });
    }
    let col_count = columns.len();
    let mut rows = Vec::new();
    let mut rows_iter = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows_iter.next().map_err(|e| e.to_string())? {
        let mut map = HashMap::new();
        for i in 0..col_count {
            let key = columns[i].clone();
            map.insert(key, value_from_ref(row.get_ref(i).map_err(|e| e.to_string())?));
        }
        rows.push(map);
    }
    Ok(RawGrid { columns, rows })
}

fn value_from_ref(v: ValueRef<'_>) -> Value {
    match v {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(i) => Value::Number(Number::from(i)),
        ValueRef::Real(f) => Number::from_f64(f)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        ValueRef::Text(t) => Value::String(String::from_utf8_lossy(t).into_owned()),
        ValueRef::Blob(b) => Value::String(String::from_utf8_lossy(b).into_owned()),
    }
}

fn fail(question: &SqlQuestion, sql: &str, message: impl Into<String>) -> QueryRunResult {
    QueryRunResult {
        ok: false,
        passed: false,
        message: message.into(),
        question_id: question.id.clone(),
        sql: sql.to_string(),
        result: None,
        checks: None,
    }
}
