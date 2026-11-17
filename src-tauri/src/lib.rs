mod bank;
mod commands;
mod compare;
mod merge;
mod models;
mod pack;
mod practice;
mod sanitize;

use bank::BankState;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Match Electron userData folder naming so bank files stay familiar.
            let data_dir = portable_data_dir(app.handle());
            let resource_dir = app
                .path()
                .resource_dir()
                .unwrap_or_else(|_| PathBuf::from("."));

            // In `tauri dev`, resources are not always copied; fall back to repo root.
            let resource_dir = if resource_dir.join("samples/sql-basics/manifest.json").exists()
                || resource_dir.join("sql/001_app_schema.sql").exists()
            {
                resource_dir
            } else {
                PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..")
            };

            let bank = BankState::init(data_dir, resource_dir)
                .map_err(|e| std::io::Error::other(e))?;
            app.manage(Arc::new(bank));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_platform,
            commands::storage_status,
            commands::bank_list_questions,
            commands::bank_list_question_summaries,
            commands::bank_get_question,
            commands::bank_get_sql_asset,
            commands::practice_run_query,
            commands::pack_import,
            commands::pack_import_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PortableLeetcode");
}

fn portable_data_dir(app: &tauri::AppHandle) -> PathBuf {
    let fallback = || PathBuf::from(".").join("PortableLeetcode-data");
    #[cfg(target_os = "macos")]
    {
        app.path()
            .home_dir()
            .map(|h| h.join("Library/Application Support/PortableLeetcode"))
            .unwrap_or_else(|_| fallback())
    }
    #[cfg(target_os = "windows")]
    {
        app.path()
            .data_dir()
            .map(|d| d.join("PortableLeetcode"))
            .unwrap_or_else(|_| fallback())
    }
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        app.path()
            .data_dir()
            .map(|d| d.join("PortableLeetcode"))
            .unwrap_or_else(|_| fallback())
    }
}
