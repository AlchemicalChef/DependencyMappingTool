mod commands;
mod error;
mod models;
mod state;
mod storage;

use state::AppState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize application state
            let data_path = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            app.manage(Mutex::new(AppState::new(data_path)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::services::get_all_services,
            commands::services::get_service_by_id,
            commands::services::search_services,
            commands::services::save_service,
            commands::services::delete_service,
            commands::graph::get_service_graph,
            commands::environments::list_environments,
            commands::environments::get_current_environment,
            commands::environments::switch_environment,
            commands::environments::set_data_path,
            commands::relationships::get_all_relationships,
            commands::relationships::get_relationships_for_service,
            commands::relationships::save_relationship,
            commands::relationships::delete_relationship,
            commands::relationships::delete_relationships_for_service,
            commands::validation::validate_environment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
