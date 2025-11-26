use serde::Serialize;
use std::collections::HashSet;
use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::models::{Relationship, Service};
use crate::state::AppState;
use crate::storage;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphData {
    pub center_service: Service,
    pub connected_services: Vec<Service>,
    pub relationships: Vec<Relationship>,
}

#[tauri::command]
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
                    // Add relationship if it involves current level service
                    if !relevant_relationships.iter().any(|r| r.id == rel.id) {
                        // Only include if both services exist
                        if services_map.contains_key(&rel.source)
                            && services_map.contains_key(&rel.target)
                        {
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
