//! Relationship management commands for the Tauri application.
//!
//! This module provides CRUD operations for managing relationships (dependencies)
//! between services within different environments. Relationships define how services
//! connect to and depend on each other.

use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::models::Relationship;
use crate::state::AppState;
use crate::storage::loader;

/// Retrieves all relationships for a specified environment.
///
/// This command first checks the in-memory cache for the environment's relationships.
/// If not cached, it loads the relationships from disk and populates the cache for
/// future requests.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to retrieve relationships from
///
/// # Returns
///
/// * `Ok(Vec<Relationship>)` - A vector containing all relationships in the environment
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error reading from the filesystem
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const relationships = await invoke('get_all_relationships', { environment: 'dev' });
/// ```
#[tauri::command]
pub fn get_all_relationships(
    state: State<'_, Mutex<AppState>>,
    environment: String,
) -> Result<Vec<Relationship>, AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Check cache first
    if let Some(relationships) = state.relationships_cache.get(&environment) {
        return Ok(relationships.clone());
    }

    // Load from disk
    let relationships = loader::load_relationships(&state.data_path, &environment)?;

    // Update cache
    state
        .relationships_cache
        .insert(environment, relationships.clone());

    Ok(relationships)
}

/// Retrieves all relationships involving a specific service.
///
/// Returns relationships where the specified service is either the source
/// (depends on other services) or the target (other services depend on it).
/// This is useful for displaying a service's dependency graph in the UI.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to search within
/// * `service_id` - The unique identifier of the service to find relationships for
///
/// # Returns
///
/// * `Ok(Vec<Relationship>)` - A vector of relationships involving the service (may be empty)
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error reading from the filesystem
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const relationships = await invoke('get_relationships_for_service', {
///     environment: 'dev',
///     serviceId: 'api-gateway'
/// });
/// // Returns relationships where api-gateway is source OR target
/// ```
#[tauri::command(rename_all = "camelCase")]
pub fn get_relationships_for_service(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    service_id: String,
) -> Result<Vec<Relationship>, AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    // Check cache first
    let relationships = if let Some(cached) = state.relationships_cache.get(&environment) {
        cached.clone()
    } else {
        // Load from disk
        let loaded = loader::load_relationships(&state.data_path, &environment)?;
        // Update cache
        state
            .relationships_cache
            .insert(environment, loaded.clone());
        loaded
    };

    let filtered: Vec<Relationship> = relationships
        .into_iter()
        .filter(|r| r.source == service_id || r.target == service_id)
        .collect();

    Ok(filtered)
}

/// Saves a relationship to the specified environment (create or update).
///
/// This command handles both creating new relationships and updating existing ones.
/// If a relationship with the same ID exists, it will be updated. For new relationships,
/// the command validates that no duplicate relationship exists with the same
/// source, target, and type combination.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to save the relationship to
/// * `relationship` - The complete relationship object to save
///
/// # Returns
///
/// * `Ok(())` - If the relationship was successfully saved
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::DuplicateRelationship)` - If a relationship with the same source,
///   target, and type already exists (for new relationships only)
/// * `Err(AppError::Io)` - If there's an error writing to the filesystem
///
/// # Side Effects
///
/// - Updates the relationships JSON file at `{data_path}/{environment}/relationships.json`
/// - Invalidates the relationships cache to ensure consistency
///
/// # Validation
///
/// - Prevents duplicate relationships (same source + target + type)
/// - Does NOT validate that source and target services exist
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// await invoke('save_relationship', {
///     environment: 'dev',
///     relationship: {
///         id: 'rel-123',
///         source: 'api-gateway',
///         target: 'user-service',
///         relationshipType: 'depends_on',
///         description: 'API Gateway routes to User Service'
///     }
/// });
/// ```
#[tauri::command]
pub fn save_relationship(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    relationship: Relationship,
) -> Result<(), AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    let mut relationships = loader::load_relationships(&state.data_path, &environment)?;

    // Check if relationship already exists (by ID)
    if let Some(idx) = relationships.iter().position(|r| r.id == relationship.id) {
        // Update existing
        relationships[idx] = relationship;
    } else {
        // Check for duplicate source/target/type combination
        let duplicate = relationships.iter().any(|r| {
            r.source == relationship.source
                && r.target == relationship.target
                && r.relationship_type == relationship.relationship_type
                && r.id != relationship.id
        });

        if duplicate {
            return Err(AppError::DuplicateRelationship(
                relationship.source.clone(),
                relationship.target.clone(),
            ));
        }

        // Add new
        relationships.push(relationship);
    }

    loader::save_relationships(&state.data_path, &environment, &relationships)?;

    // Invalidate cache to ensure consistency
    state.relationships_cache.remove(&environment);

    Ok(())
}

/// Deletes a single relationship by its unique identifier.
///
/// This command removes a specific relationship from the environment.
/// The operation is atomic - if the relationship doesn't exist, an error
/// is returned and no changes are made.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment containing the relationship
/// * `relationship_id` - The unique identifier of the relationship to delete
///
/// # Returns
///
/// * `Ok(())` - If the relationship was successfully deleted
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::RelationshipNotFound)` - If no relationship exists with the given ID
/// * `Err(AppError::Io)` - If there's an error writing to the filesystem
///
/// # Side Effects
///
/// - Updates the relationships JSON file
/// - Invalidates the relationships cache
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// await invoke('delete_relationship', {
///     environment: 'dev',
///     relationshipId: 'rel-123'
/// });
/// ```
#[tauri::command(rename_all = "camelCase")]
pub fn delete_relationship(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    relationship_id: String,
) -> Result<(), AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    let mut relationships = loader::load_relationships(&state.data_path, &environment)?;
    let original_len = relationships.len();

    relationships.retain(|r| r.id != relationship_id);

    if relationships.len() == original_len {
        return Err(AppError::RelationshipNotFound(relationship_id));
    }

    loader::save_relationships(&state.data_path, &environment, &relationships)?;

    // Invalidate cache to ensure consistency
    state.relationships_cache.remove(&environment);

    Ok(())
}

/// Deletes all relationships involving a specific service.
///
/// This command removes all relationships where the specified service appears
/// as either the source or target. This is typically called when deleting a
/// service to clean up orphaned relationships.
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to clean up
/// * `service_id` - The unique identifier of the service whose relationships should be removed
///
/// # Returns
///
/// * `Ok(usize)` - The number of relationships that were deleted
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error writing to the filesystem
///
/// # Side Effects
///
/// - Updates the relationships JSON file
/// - Invalidates the relationships cache
///
/// # Note
///
/// This function does not fail if no relationships are found - it simply returns 0.
/// This allows for safe cleanup even when a service has no relationships.
///
/// # Examples
///
/// ```typescript
/// // From the frontend (typically called before deleting a service):
/// const deletedCount = await invoke('delete_relationships_for_service', {
///     environment: 'dev',
///     serviceId: 'deprecated-service'
/// });
/// console.log(`Deleted ${deletedCount} relationships`);
/// ```
#[tauri::command(rename_all = "camelCase")]
pub fn delete_relationships_for_service(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    service_id: String,
) -> Result<usize, AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;

    let mut relationships = loader::load_relationships(&state.data_path, &environment)?;
    let original_len = relationships.len();

    relationships.retain(|r| r.source != service_id && r.target != service_id);

    let deleted_count = original_len - relationships.len();

    loader::save_relationships(&state.data_path, &environment, &relationships)?;

    // Invalidate cache to ensure consistency
    state.relationships_cache.remove(&environment);

    Ok(deleted_count)
}
