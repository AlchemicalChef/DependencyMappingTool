//! Relationship data model definitions.
//!
//! This module defines the `Relationship` type and its associated enums
//! for representing connections between services in the dependency graph.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The type of relationship between two services.
///
/// Defines the nature of the connection from the source service to the
/// target service. Different relationship types may be visualized or
/// analyzed differently.
///
/// # Variants
///
/// * `DependsOn` - Source requires target to function (hard dependency)
/// * `CommunicatesWith` - Source sends/receives data to/from target
/// * `AuthenticatesVia` - Source uses target for authentication
/// * `ReadsFrom` - Source reads data from target (e.g., database reads)
/// * `WritesTo` - Source writes data to target (e.g., database writes)
/// * `Publishes` - Source publishes events/messages to target
/// * `Subscribes` - Source subscribes to events/messages from target
/// * `Custom(String)` - Custom relationship type for extensibility
///
/// # Serialization
///
/// Types are serialized as snake_case strings (e.g., `DependsOn` → `"depends_on"`).
///
/// # Directionality
///
/// Relationships are directional: source → target. The relationship type
/// describes what the source does in relation to the target.
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
    /// Returns the default relationship type: `DependsOn`.
    fn default() -> Self {
        RelationshipType::DependsOn
    }
}

/// Represents a directed relationship between two services.
///
/// A relationship defines a connection from a source service to a target
/// service, with a type that describes the nature of the connection.
///
/// # Required Fields
///
/// * `id` - Unique identifier for the relationship
/// * `source` - ID of the service where the relationship originates
/// * `target` - ID of the service where the relationship points to
///
/// # Directionality
///
/// Relationships are directional: `source` → `target`. For example, if
/// service A "depends_on" service B, then:
/// - `source` = "service-a"
/// - `target` = "service-b"
///
/// # Example JSON
///
/// ```json
/// {
///   "id": "rel-api-to-db",
///   "source": "api-service",
///   "target": "postgres-db",
///   "relationshipType": "depends_on",
///   "description": "API reads user data from PostgreSQL",
///   "metadata": {
///     "protocol": "tcp",
///     "port": 5432
///   }
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Relationship {
    /// Unique identifier for this relationship.
    pub id: String,
    /// ID of the source service (where the relationship originates).
    pub source: String,
    /// ID of the target service (where the relationship points to).
    pub target: String,
    /// The type/nature of the relationship (defaults to DependsOn).
    #[serde(default)]
    pub relationship_type: RelationshipType,
    /// Optional description explaining the relationship.
    #[serde(default)]
    pub description: Option<String>,
    /// Optional arbitrary metadata for extensibility.
    #[serde(default)]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

/// Container for the relationships JSON file format.
///
/// All relationships for an environment are stored in a single file
/// with this structure.
///
/// # File Format
///
/// ```json
/// {
///   "relationships": [
///     { "id": "rel-1", "source": "a", "target": "b", ... },
///     { "id": "rel-2", "source": "b", "target": "c", ... }
///   ]
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationshipsFile {
    /// The list of all relationships in the environment.
    pub relationships: Vec<Relationship>,
}
