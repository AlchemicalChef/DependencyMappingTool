//! Application state management for the Tauri backend.
//!
//! This module defines the shared application state that is accessible
//! to all Tauri commands through a Mutex-protected State wrapper.

use std::collections::HashMap;
use std::path::PathBuf;

use crate::models::{Relationship, Service};

/// Global application state shared across all Tauri commands.
///
/// This structure maintains the current session state including:
/// - The currently selected environment
/// - The data directory path
/// - In-memory caches for services and relationships
///
/// # Thread Safety
///
/// This state is wrapped in a `Mutex` when used with Tauri, ensuring
/// thread-safe access from concurrent command invocations.
///
/// # Caching Strategy
///
/// Both services and relationships are cached per-environment to minimize
/// disk I/O. Caches are invalidated when:
/// - Data is modified (write operations invalidate affected caches)
/// - The data path changes (all caches cleared)
/// - Explicitly cleared via `clear_cache()` methods
#[derive(Debug)]
pub struct AppState {
    /// The currently active environment name (e.g., "dev", "staging", "prod").
    pub current_environment: String,
    /// Root directory path where environment data is stored.
    pub data_path: PathBuf,
    /// Services cache: environment name → (service ID → Service).
    /// Nested HashMap allows O(1) lookup of individual services.
    pub services_cache: HashMap<String, HashMap<String, Service>>,
    /// Relationships cache: environment name → list of relationships.
    /// All relationships for an environment are cached together.
    pub relationships_cache: HashMap<String, Vec<Relationship>>,
}

impl AppState {
    /// Creates a new AppState with the specified data directory path.
    ///
    /// Initializes with:
    /// - Default environment: "dev"
    /// - Empty caches for services and relationships
    ///
    /// # Arguments
    ///
    /// * `data_path` - The root directory where environment data is stored
    ///
    /// # Returns
    ///
    /// A new AppState instance ready for use.
    ///
    /// # Example
    ///
    /// ```rust
    /// let state = AppState::new(PathBuf::from("/path/to/data"));
    /// assert_eq!(state.current_environment, "dev");
    /// ```
    pub fn new(data_path: PathBuf) -> Self {
        Self {
            current_environment: "dev".to_string(),
            data_path,
            services_cache: HashMap::new(),
            relationships_cache: HashMap::new(),
        }
    }

    /// Clears all cached data for all environments.
    ///
    /// Use this when the data path changes or when you need to force
    /// a complete cache refresh.
    ///
    /// # Side Effects
    ///
    /// - Removes all entries from `services_cache`
    /// - Removes all entries from `relationships_cache`
    pub fn clear_cache(&mut self) {
        self.services_cache.clear();
        self.relationships_cache.clear();
    }

    /// Clears cached data for a specific environment.
    ///
    /// Use this when you know only one environment's data has changed
    /// and you want to preserve caches for other environments.
    ///
    /// # Arguments
    ///
    /// * `environment` - The name of the environment to clear caches for
    ///
    /// # Side Effects
    ///
    /// - Removes the environment's entry from `services_cache`
    /// - Removes the environment's entry from `relationships_cache`
    pub fn clear_environment_cache(&mut self, environment: &str) {
        self.services_cache.remove(environment);
        self.relationships_cache.remove(environment);
    }
}
