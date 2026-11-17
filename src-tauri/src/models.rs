use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackManifest {
    pub format_version: u32,
    pub pack_id: String,
    pub version: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub created_at: String,
    pub min_app_version: String,
    pub question_ids: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub retired_ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checksum: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SqlCheck {
    #[serde(rename = "result_set")]
    ResultSet {
        expected: Vec<HashMap<String, Value>>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        ordered: Option<bool>,
    },
    #[serde(rename = "row_count")]
    RowCount { expected: i64 },
    #[serde(rename = "columns")]
    Columns { expected: Vec<String> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlQuestion {
    pub id: String,
    pub version: i64,
    pub title: String,
    pub prompt: String,
    pub starter_query: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub solution_query: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub statement: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effect_query: Option<String>,
    pub checks: Vec<SqlCheck>,
    pub tags: Vec<String>,
    pub difficulty: String,
    pub schema_ref: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackPayload {
    pub manifest: PackManifest,
    pub questions: Vec<SqlQuestion>,
    pub sql_assets: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptRecord {
    pub id: String,
    pub question_id: String,
    pub submitted_sql: String,
    pub passed: Option<bool>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressRecord {
    pub question_id: String,
    pub status: String,
    pub best_passed: bool,
    pub attempt_count: i64,
    pub last_attempt_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackMeta {
    pub pack_id: String,
    pub version: String,
    pub title: String,
    pub imported_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BankSnapshot {
    pub questions: HashMap<String, SqlQuestion>,
    pub packs: HashMap<String, PackMeta>,
    pub attempts: Vec<AttemptRecord>,
    pub progress: HashMap<String, ProgressRecord>,
    pub sql_assets: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageStatus {
    pub backend: String,
    pub sqlite_ready: bool,
    pub message: String,
    pub question_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionSummary {
    pub question: SqlQuestion,
    pub progress: ProgressRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryResultGrid {
    pub columns: Vec<String>,
    pub rows: Vec<HashMap<String, Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckOutcome {
    pub index: usize,
    #[serde(rename = "type")]
    pub check_type: String,
    pub passed: bool,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryRunResult {
    pub ok: bool,
    pub passed: bool,
    pub message: String,
    pub question_id: String,
    pub sql: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<QueryResultGrid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checks: Option<Vec<CheckOutcome>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackImportResultOk {
    pub ok: bool,
    pub pack: PackPayload,
    pub merged: usize,
    pub skipped: usize,
    pub retired: usize,
    pub storage: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackImportResultErr {
    pub ok: bool,
    pub error: String,
}

pub fn hide_solution(mut question: SqlQuestion) -> SqlQuestion {
    question.solution_query = None;
    question
}

pub fn hide_pack_solutions(mut pack: PackPayload) -> PackPayload {
    pack.questions = pack.questions.into_iter().map(hide_solution).collect();
    pack
}

pub fn default_progress(question_id: &str) -> ProgressRecord {
    ProgressRecord {
        question_id: question_id.to_string(),
        status: "unseen".into(),
        best_passed: false,
        attempt_count: 0,
        last_attempt_at: None,
    }
}

pub fn now_iso() -> String {
    chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()
}
