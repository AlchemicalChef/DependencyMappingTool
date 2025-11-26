use std::collections::HashMap;
use std::path::PathBuf;

use crate::models::{Relationship, Service};

#[derive(Debug)]
pub struct AppState {
    pub current_environment: String,
    pub data_path: PathBuf,
    /// Cache: environment -> service_id -> Service
    pub services_cache: HashMap<String, HashMap<String, Service>>,
    /// Cache: environment -> relationships
    pub relationships_cache: HashMap<String, Vec<Relationship>>,
}

impl AppState {
    pub fn new(data_path: PathBuf) -> Self {
        Self {
            current_environment: "dev".to_string(),
            data_path,
            services_cache: HashMap::new(),
            relationships_cache: HashMap::new(),
        }
    }

    pub fn clear_cache(&mut self) {
        self.services_cache.clear();
        self.relationships_cache.clear();
    }

    pub fn clear_environment_cache(&mut self, environment: &str) {
        self.services_cache.remove(environment);
        self.relationships_cache.remove(environment);
    }
}
