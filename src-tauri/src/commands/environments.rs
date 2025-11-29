//! Environment management commands for the Tauri application.
//!
//! This module provides functionality for managing different deployment environments
//! (e.g., dev, staging, production). Each environment has its own isolated set of
//! services and relationships stored in separate directories.

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

/// Lists all available environments in the data directory.
///
/// Scans the data directory for subdirectories, treating each as a separate
/// environment. Hidden directories (starting with '.') are excluded. Results
/// are sorted with common environment names (dev, staging, prod) appearing first.
///
/// # Arguments
///
/// * `state` - The application state containing the data path
///
/// # Returns
///
/// * `Ok(Vec<String>)` - A sorted list of environment names
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error reading the data directory
///
/// # Sorting Order
///
/// Environments are sorted by priority:
/// 1. `dev` / `development` (priority 0)
/// 2. `staging` / `stage` (priority 1)
/// 3. `prod` / `production` (priority 2)
/// 4. Other environments alphabetically (priority 3)
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const environments = await invoke('list_environments');
/// // Returns: ['dev', 'staging', 'prod', 'feature-branch']
/// ```
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

/// Retrieves the currently active environment name.
///
/// Returns the name of the environment that is currently selected for all
/// service and relationship operations. The current environment is stored
/// in the application state and persists during the session.
///
/// # Arguments
///
/// * `state` - The application state containing the current environment
///
/// # Returns
///
/// * `Ok(String)` - The name of the current environment
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const currentEnv = await invoke('get_current_environment');
/// console.log(`Currently viewing: ${currentEnv}`); // "dev"
/// ```
#[tauri::command]
pub fn get_current_environment(state: State<'_, Mutex<AppState>>) -> Result<String, AppError> {
    let state = state.lock().map_err(|_| AppError::StateLock)?;
    Ok(state.current_environment.clone())
}

/// Switches the active environment to a different one.
///
/// Changes the current environment context for all subsequent operations.
/// The target environment must already exist as a directory in the data path.
/// This does NOT clear caches - cached data from other environments remains
/// available for quick switching.
///
/// # Arguments
///
/// * `state` - The application state to update
/// * `environment` - The name of the environment to switch to
///
/// # Returns
///
/// * `Ok(())` - If the environment was successfully switched
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::EnvironmentNotFound)` - If the specified environment doesn't exist
///
/// # Side Effects
///
/// - Updates the `current_environment` field in the application state
/// - Does NOT clear the services or relationships cache
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// await invoke('switch_environment', { environment: 'staging' });
/// // All subsequent service/relationship queries will use 'staging'
/// ```
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

/// Creates a new environment with the required directory structure.
///
/// Creates a new environment directory with an empty services folder and
/// an empty relationships.json file. The environment name must be a valid
/// directory name and cannot already exist.
///
/// # Arguments
///
/// * `state` - The application state containing the data path
/// * `environment` - The name of the new environment to create
///
/// # Returns
///
/// * `Ok(())` - If the environment was successfully created
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::EnvironmentExists)` - If an environment with that name already exists
/// * `Err(AppError::Io)` - If there's an error creating directories or files
///
/// # Directory Structure Created
///
/// ```text
/// {data_path}/{environment}/
/// ├── services/
/// └── relationships.json
/// ```
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// await invoke('create_environment', { environment: 'staging' });
/// ```
#[tauri::command]
pub fn create_environment(
    state: State<'_, Mutex<AppState>>,
    environment: String,
) -> Result<(), AppError> {
    let state = state.lock().map_err(|_| AppError::StateLock)?;

    let env_path = state.data_path.join(&environment);

    // Check if environment already exists
    if env_path.exists() {
        return Err(AppError::EnvironmentExists(environment));
    }

    // Create the environment directory
    fs::create_dir_all(&env_path)?;

    // Create the services subdirectory
    let services_path = env_path.join("services");
    fs::create_dir_all(&services_path)?;

    // Create an empty relationships.json file
    let relationships_path = env_path.join("relationships.json");
    fs::write(&relationships_path, "[]")?;

    Ok(())
}

/// Sets the root data directory path for all environment data.
///
/// Changes the base directory where all environment folders are located.
/// This clears all cached data since the cache would be invalid for the new
/// location. The path must point to an existing directory.
///
/// # Arguments
///
/// * `state` - The application state to update
/// * `path` - The absolute path to the new data directory
///
/// # Returns
///
/// * `Ok(())` - If the data path was successfully updated
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::InvalidPath)` - If the path doesn't exist or isn't a directory
///
/// # Side Effects
///
/// - Clears all cached services and relationships
/// - Updates the `data_path` field in the application state
///
/// # Directory Structure Expected
///
/// ```text
/// {data_path}/
/// ├── dev/
/// │   ├── services/
/// │   └── relationships.json
/// ├── staging/
/// │   ├── services/
/// │   └── relationships.json
/// └── prod/
///     ├── services/
///     └── relationships.json
/// ```
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// await invoke('set_data_path', {
///     path: '/Users/user/projects/my-app/service-data'
/// });
/// ```
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
