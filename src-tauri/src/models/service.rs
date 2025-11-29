//! Service data model definitions.
//!
//! This module defines the core `Service` type and its associated enums
//! for representing services in the dependency graph.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The type/category of a service in the architecture.
///
/// Used to classify services for filtering and visual differentiation
/// in the dependency graph.
///
/// # Variants
///
/// * `Api` - REST API or GraphQL endpoint services
/// * `Database` - Database services (PostgreSQL, MySQL, MongoDB, etc.)
/// * `Cache` - Caching services (Redis, Memcached, etc.)
/// * `Queue` - Message queue services (RabbitMQ, Kafka, SQS, etc.)
/// * `Gateway` - API gateways or load balancers
/// * `Frontend` - Client-facing web applications
/// * `Backend` - Backend microservices or monolithic applications
/// * `External` - Third-party or external services
/// * `Custom(String)` - Custom type for extensibility (catch-all)
///
/// # Serialization
///
/// Types are serialized as snake_case strings (e.g., `ServiceType::Api` → `"api"`).
/// Custom types are serialized directly as their string value.
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
    /// Returns the default service type: `Backend`.
    fn default() -> Self {
        ServiceType::Backend
    }
}

/// The operational status of a service.
///
/// Used to indicate the current health state of a service for
/// monitoring and visualization purposes.
///
/// # Variants
///
/// * `Healthy` - Service is operating normally
/// * `Degraded` - Service is running but with reduced capacity or issues
/// * `Unhealthy` - Service is experiencing significant problems
/// * `Unknown` - Service status cannot be determined
/// * `Deprecated` - Service is marked for removal and should not be used
///
/// # Serialization
///
/// Statuses are serialized as snake_case strings.
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
    /// Returns the default service status: `Unknown`.
    fn default() -> Self {
        ServiceStatus::Unknown
    }
}

/// Represents a service in the dependency graph.
///
/// A service is any distinct component in the architecture that can have
/// dependencies on or from other services. This is the core data model
/// used throughout the application.
///
/// # Required Fields
///
/// * `id` - Unique identifier for the service (used as filename)
/// * `name` - Human-readable display name
///
/// # Optional Fields
///
/// All other fields have sensible defaults and are optional during creation.
///
/// # Serialization
///
/// Fields are serialized to camelCase for JavaScript/TypeScript compatibility:
/// - `service_type` → `serviceType`
/// - `description` → `description`
///
/// # Example JSON
///
/// ```json
/// {
///   "id": "user-service",
///   "name": "User Service",
///   "serviceType": "api",
///   "status": "healthy",
///   "description": "Handles user authentication and profile management",
///   "version": "2.1.0",
///   "owner": "auth-team@company.com",
///   "team": "Authentication Team",
///   "tags": ["auth", "users", "core"],
///   "metadata": {
///     "repository": "https://github.com/company/user-service",
///     "port": 8080
///   }
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Service {
    /// Unique identifier for the service. Used as the filename and for references.
    pub id: String,
    /// Human-readable display name for the service.
    pub name: String,
    /// The category/type of service (defaults to Backend).
    #[serde(default)]
    pub service_type: ServiceType,
    /// Current operational status (defaults to Unknown).
    #[serde(default)]
    pub status: ServiceStatus,
    /// Optional detailed description of the service's purpose.
    #[serde(default)]
    pub description: Option<String>,
    /// Optional version string (e.g., "1.2.3" or "v2.0.0").
    #[serde(default)]
    pub version: Option<String>,
    /// Optional owner email or identifier.
    #[serde(default)]
    pub owner: Option<String>,
    /// Optional team name responsible for the service.
    #[serde(default)]
    pub team: Option<String>,
    /// Tags for filtering and categorization.
    #[serde(default)]
    pub tags: Vec<String>,
    /// Arbitrary key-value metadata for extensibility.
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
}

impl Service {
    /// Checks if the service matches a search query.
    ///
    /// Performs a case-insensitive substring search across multiple fields
    /// of the service. Returns true if the query is found in any of:
    /// - `name`
    /// - `id`
    /// - `description`
    /// - `owner`
    /// - `team`
    /// - Any tag in `tags`
    ///
    /// # Arguments
    ///
    /// * `query` - The search string to match (case-insensitive)
    ///
    /// # Returns
    ///
    /// `true` if the query matches any searchable field, `false` otherwise.
    ///
    /// # Examples
    ///
    /// ```rust
    /// let service = Service {
    ///     id: "user-api".to_string(),
    ///     name: "User API Service".to_string(),
    ///     tags: vec!["auth".to_string(), "api".to_string()],
    ///     // ... other fields
    /// };
    ///
    /// assert!(service.matches_search("user"));   // matches id and name
    /// assert!(service.matches_search("AUTH"));   // matches tag (case-insensitive)
    /// assert!(!service.matches_search("orders")); // no match
    /// ```
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
