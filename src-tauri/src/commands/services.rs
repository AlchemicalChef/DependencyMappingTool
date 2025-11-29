//! Service management commands for the Tauri application.
//!
//! This module provides CRUD operations for managing services within different
//! environments. All commands utilize a caching layer to minimize disk I/O and
//! improve performance on repeated queries.

use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::models::Service;
use crate::state::AppState;
use crate::storage;

/// Retrieves all services for a specified environment.
///
/// This command first checks the in-memory cache for the environment's services.
/// If not cached, it loads the services from disk and populates the cache for
/// future requests.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to retrieve services from (e.g., "dev", "staging", "prod")
///
/// # Returns
///
/// * `Ok(Vec<Service>)` - A vector containing all services in the environment
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error reading from the filesystem
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const services = await invoke('get_all_services', { environment: 'dev' });
/// ```
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

/// Retrieves a single service by its unique identifier.
///
/// This command looks up a service first in the cache, then falls back to loading
/// from disk if not found. When loaded from disk, the service is added to the cache
/// for future requests.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment containing the service
/// * `service_id` - The unique identifier of the service to retrieve
///
/// # Returns
///
/// * `Ok(Service)` - The requested service if found
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::ServiceNotFound)` - If no service exists with the given ID
/// * `Err(AppError::Io)` - If there's an error reading from the filesystem
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const service = await invoke('get_service_by_id', {
///     environment: 'dev',
///     serviceId: 'api-gateway'
/// });
/// ```
#[tauri::command(rename_all = "camelCase")]
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

/// Searches for services matching a query string within an environment.
///
/// Performs a case-insensitive search across service properties including
/// name, ID, description, and tags. Uses the `Service::matches_search` method
/// to determine matches.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to search within
/// * `query` - The search query string to match against service properties
///
/// # Returns
///
/// * `Ok(Vec<Service>)` - A vector of services matching the search query (may be empty)
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error reading from the filesystem
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const results = await invoke('search_services', {
///     environment: 'dev',
///     query: 'api'
/// });
/// // Returns all services with "api" in their name, description, or tags
/// ```
#[tauri::command]
pub fn search_services(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    query: String,
) -> Result<Vec<Service>, AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Check cache first
    let services = if let Some(services_map) = state.services_cache.get(&environment) {
        services_map.values().cloned().collect()
    } else {
        // Load from disk
        let loaded = storage::load_services(&state.data_path, &environment)?;
        // Update cache
        let services_map: std::collections::HashMap<String, Service> = loaded
            .iter()
            .map(|s| (s.id.clone(), s.clone()))
            .collect();
        state.services_cache.insert(environment, services_map);
        loaded
    };

    let results: Vec<Service> = services
        .into_iter()
        .filter(|s| s.matches_search(&query))
        .collect();

    Ok(results)
}

/// Saves a service to the specified environment (create or update).
///
/// This command persists a service to disk and updates the in-memory cache.
/// If a service with the same ID already exists, it will be overwritten.
/// For new services, ensure the service ID is unique within the environment.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to save the service to
/// * `service` - The complete service object to save
///
/// # Returns
///
/// * `Ok(())` - If the service was successfully saved
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error writing to the filesystem
///
/// # Side Effects
///
/// - Creates or updates a JSON file at `{data_path}/{environment}/services/{service.id}.json`
/// - Updates the in-memory services cache
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// await invoke('save_service', {
///     environment: 'dev',
///     service: {
///         id: 'new-service',
///         name: 'New Service',
///         serviceType: 'api',
///         description: 'A new API service',
///         tags: ['api', 'backend']
///     }
/// });
/// ```
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

/// Deletes a service from the specified environment.
///
/// This command removes the service file from disk and removes the service
/// from the in-memory cache. Note that this does NOT automatically delete
/// relationships involving this service - use `delete_relationships_for_service`
/// separately if needed.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment containing the service
/// * `service_id` - The unique identifier of the service to delete
///
/// # Returns
///
/// * `Ok(())` - If the service was successfully deleted
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::ServiceNotFound)` - If no service exists with the given ID
/// * `Err(AppError::Io)` - If there's an error deleting from the filesystem
///
/// # Side Effects
///
/// - Deletes the JSON file at `{data_path}/{environment}/services/{service_id}.json`
/// - Removes the service from the in-memory cache
///
/// # Warning
///
/// This operation is irreversible. Consider warning users before deletion
/// and handling orphaned relationships.
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// await invoke('delete_service', {
///     environment: 'dev',
///     serviceId: 'old-service'
/// });
/// ```
#[tauri::command(rename_all = "camelCase")]
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
