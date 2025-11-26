use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

#[tauri::command]
pub fn list_environments(state: State<'_, Mutex<AppState>>) -> Result<Vec<String>, AppError> {
    let state = state.lock().map_err(|_| AppError::StateLock)?;

    let mut environments = Vec::new();

    if state.data_path.exists() {
        for entry in fs::read_dir(&state.data_path)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    // Skip hidden directories
                    if !name.starts_with('.') {
                        environments.push(name.to_string());
                    }
                }
            }
        }
    }

    // Sort environments in a sensible order
    environments.sort_by(|a, b| {
        let order = |s: &str| match s {
            "dev" => 0,
            "development" => 0,
            "staging" => 1,
            "stage" => 1,
            "prod" => 2,
            "production" => 2,
            _ => 3,
        };
        order(a).cmp(&order(b)).then(a.cmp(b))
    });

    Ok(environments)
}

#[tauri::command]
pub fn get_current_environment(state: State<'_, Mutex<AppState>>) -> Result<String, AppError> {
    let state = state.lock().map_err(|_| AppError::StateLock)?;
    Ok(state.current_environment.clone())
}

#[tauri::command]
pub fn switch_environment(
    state: State<'_, Mutex<AppState>>,
    environment: String,
) -> Result<(), AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Verify environment exists
    let env_path = state.data_path.join(&environment);
    if !env_path.exists() {
        return Err(AppError::EnvironmentNotFound(environment));
    }

    state.current_environment = environment;

    Ok(())
}

#[tauri::command]
pub fn set_data_path(state: State<'_, Mutex<AppState>>, path: String) -> Result<(), AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(AppError::InvalidPath(path));
    }

    if !path_buf.is_dir() {
        return Err(AppError::InvalidPath(format!("{} is not a directory", path)));
    }

    // Clear caches when changing data path
    state.clear_cache();
    state.data_path = path_buf;

    Ok(())
}
