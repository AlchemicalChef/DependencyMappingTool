use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::models::Service;
use crate::state::AppState;
use crate::storage;

#[tauri::command]
pub fn get_all_services(
    state: State<'_, Mutex<AppState>>,
    environment: String,
) -> Result<Vec<Service>, AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Check cache first
    if let Some(services_map) = state.services_cache.get(&environment) {
        return Ok(services_map.values().cloned().collect());
    }

    // Load from disk
    let services = storage::load_services(&state.data_path, &environment)?;

    // Update cache
    let services_map: std::collections::HashMap<String, Service> = services
        .iter()
        .map(|s| (s.id.clone(), s.clone()))
        .collect();
    state.services_cache.insert(environment, services_map);

    Ok(services)
}

#[tauri::command]
pub fn get_service_by_id(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    service_id: String,
) -> Result<Service, AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Check cache first
    if let Some(services_map) = state.services_cache.get(&environment) {
        if let Some(service) = services_map.get(&service_id) {
            return Ok(service.clone());
        }
    }

    // Load from disk
    let service = storage::load_service(&state.data_path, &environment, &service_id)?;

    // Update cache
    state
        .services_cache
        .entry(environment)
        .or_default()
        .insert(service_id, service.clone());

    Ok(service)
}

#[tauri::command]
pub fn search_services(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    query: String,
) -> Result<Vec<Service>, AppError> {
    let services = get_all_services(state, environment)?;

    let results: Vec<Service> = services
        .into_iter()
        .filter(|s| s.matches_search(&query))
        .collect();

    Ok(results)
}

#[tauri::command]
pub fn save_service(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    service: Service,
) -> Result<(), AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Save to disk
    storage::save_service(&state.data_path, &environment, &service)?;

    // Update cache
    state
        .services_cache
        .entry(environment)
        .or_default()
        .insert(service.id.clone(), service);

    Ok(())
}

#[tauri::command]
pub fn delete_service(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    service_id: String,
) -> Result<(), AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Delete from disk
    storage::delete_service_file(&state.data_path, &environment, &service_id)?;

    // Update cache
    if let Some(services_map) = state.services_cache.get_mut(&environment) {
        services_map.remove(&service_id);
    }

    Ok(())
}
