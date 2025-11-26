use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RelationshipType {
    DependsOn,
    CommunicatesWith,
    AuthenticatesVia,
    ReadsFrom,
    WritesTo,
    Publishes,
    Subscribes,
    #[serde(untagged)]
    Custom(String),
}

impl Default for RelationshipType {
    fn default() -> Self {
        RelationshipType::DependsOn
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Relationship {
    pub id: String,
    pub source: String,
    pub target: String,
    #[serde(default)]
    pub relationship_type: RelationshipType,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationshipsFile {
    pub relationships: Vec<Relationship>,
}
