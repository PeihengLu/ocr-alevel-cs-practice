use crate::bank::BankState;
use crate::models::{
    hide_pack_solutions, PackImportResultErr, PackImportResultOk, QueryRunResult, QuestionSummary,
    SqlQuestion, StorageStatus,
};
use crate::pack::{unpack_plpack_bytes, unpack_plpack_path};
use crate::practice::run_student_query;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub fn get_platform() -> String {
    if cfg!(target_os = "macos") {
        "darwin".into()
    } else if cfg!(target_os = "windows") {
        "win32".into()
    } else if cfg!(target_os = "linux") {
        "linux".into()
    } else {
        "unknown".into()
    }
}

#[tauri::command]
pub fn storage_status(bank: State<'_, Arc<BankState>>) -> StorageStatus {
    bank.storage_status()
}

#[tauri::command]
pub fn bank_list_questions(bank: State<'_, Arc<BankState>>) -> Vec<SqlQuestion> {
    bank.list_questions()
}

#[tauri::command]
pub fn bank_list_question_summaries(bank: State<'_, Arc<BankState>>) -> Vec<QuestionSummary> {
    bank.list_question_summaries()
}

#[tauri::command]
pub fn bank_get_question(bank: State<'_, Arc<BankState>>, id: String) -> Option<SqlQuestion> {
    bank.get_question(&id)
}

#[tauri::command]
pub fn bank_get_sql_asset(bank: State<'_, Arc<BankState>>, schema_ref: String) -> Option<String> {
    bank.get_sql_asset(&schema_ref)
}

#[tauri::command]
pub fn practice_run_query(
    bank: State<'_, Arc<BankState>>,
    question_id: String,
    sql: String,
) -> QueryRunResult {
    run_student_query(&bank, &question_id, &sql)
}

#[tauri::command]
pub async fn pack_import(
    app: AppHandle,
    bank: State<'_, Arc<BankState>>,
) -> Result<serde_json::Value, String> {
    let path = app
        .dialog()
        .file()
        .add_filter("PortableLeetcode pack", &["plpack"])
        .blocking_pick_file();

    let Some(file) = path else {
        return Ok(serde_json::to_value(PackImportResultErr {
            ok: false,
            error: "Import cancelled.".into(),
        })
        .unwrap());
    };

    let path_buf: PathBuf = file.into_path().map_err(|e| e.to_string())?;
    import_path(&bank, path_buf)
}

#[tauri::command]
pub fn pack_import_path(
    bank: State<'_, Arc<BankState>>,
    file_path: String,
) -> Result<serde_json::Value, String> {
    import_path(&bank, PathBuf::from(file_path))
}

fn import_path(bank: &Arc<BankState>, path: PathBuf) -> Result<serde_json::Value, String> {
    let pack = if path.extension().and_then(|e| e.to_str()) == Some("plpack")
        || path.extension().and_then(|e| e.to_str()) == Some("zip")
    {
        match std::fs::read(&path) {
            Ok(bytes) => unpack_plpack_bytes(&bytes),
            Err(_) => unpack_plpack_path(&path),
        }
    } else {
        unpack_plpack_path(&path)
    };

    match pack.and_then(|p| {
        let stats = bank.import_pack(p.clone())?;
        Ok((p, stats))
    }) {
        Ok((pack, stats)) => Ok(serde_json::to_value(PackImportResultOk {
            ok: true,
            pack: hide_pack_solutions(pack),
            merged: stats.merged,
            skipped: stats.skipped,
            retired: stats.retired,
            storage: bank.storage_status().backend,
        })
        .unwrap()),
        Err(error) => Ok(serde_json::to_value(PackImportResultErr { ok: false, error }).unwrap()),
    }
}

#[allow(dead_code)]
pub fn resource_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .resource_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
}
