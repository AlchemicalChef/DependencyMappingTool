use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ServiceType {
    Api,
    Database,
    Cache,
    Queue,
    Gateway,
    Frontend,
    Backend,
    External,
    #[serde(untagged)]
    Custom(String),
}

impl Default for ServiceType {
    fn default() -> Self {
        ServiceType::Backend
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ServiceStatus {
    Healthy,
    Degraded,
    Unhealthy,
    Unknown,
    Deprecated,
}

impl Default for ServiceStatus {
    fn default() -> Self {
        ServiceStatus::Unknown
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Service {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub service_type: ServiceType,
    #[serde(default)]
    pub status: ServiceStatus,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub owner: Option<String>,
    #[serde(default)]
    pub team: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
}

impl Service {
    pub fn matches_search(&self, query: &str) -> bool {
        let query_lower = query.to_lowercase();

        self.name.to_lowercase().contains(&query_lower)
            || self.id.to_lowercase().contains(&query_lower)
            || self.description
                .as_ref()
                .map(|d| d.to_lowercase().contains(&query_lower))
                .unwrap_or(false)
            || self.owner
                .as_ref()
                .map(|o| o.to_lowercase().contains(&query_lower))
                .unwrap_or(false)
            || self.team
                .as_ref()
                .map(|t| t.to_lowercase().contains(&query_lower))
                .unwrap_or(false)
            || self.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
    }
}
