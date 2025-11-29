//! Graph traversal commands for the Tauri application.
//!
//! This module provides functionality for building and traversing the service
//! dependency graph. It uses a breadth-first search (BFS) algorithm to discover
//! connected services up to a specified depth from a center service.

use serde::Serialize;
use std::collections::HashSet;
use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::models::{Relationship, Service};
use crate::state::AppState;
use crate::storage;

/// Represents the graph data for visualization centered on a specific service.
///
/// This structure contains all the information needed to render a dependency
/// graph in the UI, including the focal service, its connected neighbors,
/// and the relationships between them.
///
/// # Fields
///
/// * `center_service` - The service that is the focal point of the graph view
/// * `connected_services` - Services connected to the center service within the specified depth
/// * `relationships` - All relationships between the center service and connected services
///
/// # Serialization
///
/// Fields are serialized to camelCase for JavaScript/TypeScript compatibility:
/// - `center_service` → `centerService`
/// - `connected_services` → `connectedServices`
/// - `relationships` → `relationships`
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphData {
    pub center_service: Service,
    pub connected_services: Vec<Service>,
    pub relationships: Vec<Relationship>,
}

/// Retrieves the dependency graph centered on a specific service.
///
/// This command performs a breadth-first search (BFS) traversal from the center
/// service, discovering all connected services up to the specified depth. It
/// returns both the services and the relationships connecting them, suitable
/// for visualization in the graph UI.
///
/// # Algorithm
///
/// 1. Start with the center service at depth 0
/// 2. For each level up to the specified depth:
///    - Find all relationships where current level services are source or target
///    - Add newly discovered services to the next level
///    - Track visited services to avoid cycles
/// 3. Collect all unique relationships between discovered services
///
/// # Arguments
///
/// * `state` - The application state containing the cache and data path
/// * `environment` - The name of the environment to query
/// * `center_service_id` - The ID of the service to center the graph on
/// * `depth` - Optional maximum traversal depth (default: 1). Higher values
///   discover more distant dependencies but may result in larger graphs.
///
/// # Returns
///
/// * `Ok(GraphData)` - The graph data containing center service, connected
///   services, and relationships
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::EnvironmentNotFound)` - If the environment doesn't exist in cache
/// * `Err(AppError::ServiceNotFound)` - If the center service doesn't exist
/// * `Err(AppError::Io)` - If there's an error reading from the filesystem
///
/// # Performance
///
/// - Uses HashSet for O(1) lookup of visited services and seen relationships
/// - Caches services and relationships to minimize disk I/O
/// - Time complexity: O(V + E) where V is vertices and E is edges within depth
///
/// # Examples
///
/// ```typescript
/// // From the frontend - get immediate neighbors only:
/// const graph = await invoke('get_service_graph', {
///     environment: 'dev',
///     centerServiceId: 'api-gateway',
///     depth: 1
/// });
///
/// // Get extended dependency tree (2 levels deep):
/// const extendedGraph = await invoke('get_service_graph', {
///     environment: 'dev',
///     centerServiceId: 'api-gateway',
///     depth: 2
/// });
/// ```
#[tauri::command(rename_all = "camelCase")]
pub fn get_service_graph(
    state: State<'_, Mutex<AppState>>,
    environment: String,
    center_service_id: String,
    depth: Option<u32>,
) -> Result<GraphData, AppError> {
    let mut state = state.lock().map_err(|_| AppError::StateLock)?;
    let depth = depth.unwrap_or(1);

    // Load services if not cached
    if !state.services_cache.contains_key(&environment) {
        let services = storage::load_services(&state.data_path, &environment)?;
        let services_map: std::collections::HashMap<String, Service> = services
            .iter()
            .map(|s| (s.id.clone(), s.clone()))
            .collect();
        state.services_cache.insert(environment.clone(), services_map);
    }

    // Load relationships if not cached
    if !state.relationships_cache.contains_key(&environment) {
        let relationships = storage::load_relationships(&state.data_path, &environment)?;
        state
            .relationships_cache
            .insert(environment.clone(), relationships);
    }

    let services_map = state
        .services_cache
        .get(&environment)
        .ok_or_else(|| AppError::EnvironmentNotFound(environment.clone()))?;

    let all_relationships = state
        .relationships_cache
        .get(&environment)
        .ok_or_else(|| AppError::EnvironmentNotFound(environment.clone()))?;

    // Get center service
    let center_service = services_map
        .get(&center_service_id)
        .ok_or_else(|| AppError::ServiceNotFound(center_service_id.clone()))?
        .clone();

    // Find connected services up to the specified depth
    let mut visited: HashSet<String> = HashSet::new();
    let mut current_level: HashSet<String> = HashSet::new();
    current_level.insert(center_service_id.clone());
    visited.insert(center_service_id.clone());

    let mut connected_service_ids: HashSet<String> = HashSet::new();
    let mut relevant_relationships: Vec<Relationship> = Vec::new();
    let mut seen_relationship_ids: HashSet<String> = HashSet::new();

    for _ in 0..depth {
        let mut next_level: HashSet<String> = HashSet::new();

        for service_id in &current_level {
            // Find relationships where this service is source or target
            for rel in all_relationships {
                let connected_id = if rel.source == *service_id {
                    Some(&rel.target)
                } else if rel.target == *service_id {
                    Some(&rel.source)
                } else {
                    None
                };

                if let Some(connected_id) = connected_id {
                    // Add relationship if not already seen (O(1) lookup instead of O(n))
                    if !seen_relationship_ids.contains(&rel.id) {
                        // Only include if both services exist
                        if services_map.contains_key(&rel.source)
                            && services_map.contains_key(&rel.target)
                        {
                            seen_relationship_ids.insert(rel.id.clone());
                            relevant_relationships.push(rel.clone());
                        }
                    }

                    // Add to next level if not visited
                    if !visited.contains(connected_id) {
                        next_level.insert(connected_id.clone());
                        visited.insert(connected_id.clone());
                        connected_service_ids.insert(connected_id.clone());
                    }
                }
            }
        }

        current_level = next_level;
    }

    // Get the connected services
    let connected_services: Vec<Service> = connected_service_ids
        .iter()
        .filter_map(|id| services_map.get(id).cloned())
        .collect();

    Ok(GraphData {
        center_service,
        connected_services,
        relationships: relevant_relationships,
    })
}
