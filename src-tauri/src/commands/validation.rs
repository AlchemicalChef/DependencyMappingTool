//! Environment validation commands for the Tauri application.
//!
//! This module provides comprehensive data integrity validation for environments,
//! detecting issues such as orphaned relationships, circular dependencies,
//! duplicate IDs, and missing required fields.

use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use tauri::State;

use crate::error::AppError;
use crate::models::{RelationshipType, Service};
use crate::state::AppState;
use crate::storage::loader;

/// Severity levels for validation issues.
///
/// Determines how critical an issue is and how it should be displayed in the UI.
///
/// # Variants
///
/// * `Error` - Critical issues that indicate data corruption or invalid state
/// * `Warning` - Potential problems that may cause issues but don't break functionality
/// * `Info` - Informational notices about the data structure
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IssueSeverity {
    Error,
    Warning,
    Info,
}

/// Categories of validation issues that can be detected.
///
/// Each issue type corresponds to a specific kind of data integrity problem.
///
/// # Variants
///
/// * `OrphanedRelationship` - A relationship references a service that doesn't exist
/// * `DuplicateServiceId` - Multiple services share the same ID
/// * `MissingRequiredField` - A service is missing required fields (id, name)
/// * `InvalidRelationshipType` - A relationship uses an unknown type
/// * `CircularDependency` - Services form a dependency cycle (A -> B -> A)
/// * `UnreachableService` - A service has no relationships (informational)
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IssueType {
    OrphanedRelationship,
    DuplicateServiceId,
    MissingRequiredField,
    InvalidRelationshipType,
    CircularDependency,
    UnreachableService,
}

/// Represents a single validation issue found in the environment data.
///
/// Contains all information needed to display the issue in the UI and
/// help the user resolve it.
///
/// # Fields
///
/// * `severity` - How critical the issue is (error, warning, info)
/// * `issue_type` - The category of the issue
/// * `message` - Human-readable description of the problem
/// * `affected_ids` - IDs of services/relationships involved
/// * `suggestion` - Optional recommendation for fixing the issue
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationIssue {
    pub severity: IssueSeverity,
    pub issue_type: IssueType,
    pub message: String,
    pub affected_ids: Vec<String>,
    pub suggestion: Option<String>,
}

/// The complete result of validating an environment.
///
/// Contains all discovered issues along with summary counts for quick
/// assessment of the environment's health.
///
/// # Fields
///
/// * `issues` - All validation issues found
/// * `error_count` - Number of critical errors
/// * `warning_count` - Number of warnings
/// * `info_count` - Number of informational notices
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    pub issues: Vec<ValidationIssue>,
    pub error_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
}

/// Validates the entire environment for data integrity issues.
///
/// Performs comprehensive validation of all services and relationships in
/// the specified environment. This includes checking for:
///
/// 1. **Duplicate Service IDs** (Error) - Multiple services with the same ID
/// 2. **Missing Required Fields** (Error) - Services without id or name
/// 3. **Orphaned Relationships** (Error) - Relationships referencing non-existent services
/// 4. **Invalid Relationship Types** (Warning) - Unknown relationship types
/// 5. **Circular Dependencies** (Warning) - Dependency cycles in "depends_on" relationships
/// 6. **Unreachable Services** (Info) - Services with no relationships
///
/// # Arguments
///
/// * `state` - The application state containing the data path
/// * `environment` - The name of the environment to validate
///
/// # Returns
///
/// * `Ok(ValidationResult)` - The validation results with all issues and counts
/// * `Err(AppError::StateLock)` - If the application state mutex cannot be acquired
/// * `Err(AppError::Io)` - If there's an error reading the data files
///
/// # Algorithm Details
///
/// - Circular dependency detection uses DFS (Depth-First Search) on "depends_on" relationships
/// - Duplicate cycle detection normalizes cycles for comparison
/// - All checks are performed in a single pass where possible for efficiency
///
/// # Examples
///
/// ```typescript
/// // From the frontend:
/// const result = await invoke('validate_environment', { environment: 'dev' });
/// console.log(`Found ${result.errorCount} errors, ${result.warningCount} warnings`);
///
/// for (const issue of result.issues) {
///     console.log(`[${issue.severity}] ${issue.message}`);
///     if (issue.suggestion) {
///         console.log(`  Suggestion: ${issue.suggestion}`);
///     }
/// }
/// ```
#[tauri::command]
pub fn validate_environment(
    state: State<'_, Mutex<AppState>>,
    environment: String,
) -> Result<ValidationResult, AppError> {
    let state = state.lock().map_err(|_| AppError::StateLock)?;

    let services = loader::load_services(&state.data_path, &environment)?;
    let relationships = loader::load_relationships(&state.data_path, &environment)?;

    let mut issues = Vec::new();

    // Build service ID set for lookups
    let service_ids: HashSet<String> = services.iter().map(|s| s.id.clone()).collect();

    // Check for duplicate service IDs (shouldn't happen but check anyway)
    let mut seen_ids: HashMap<String, usize> = HashMap::new();
    for service in &services {
        *seen_ids.entry(service.id.clone()).or_insert(0) += 1;
    }
    for (id, count) in &seen_ids {
        if *count > 1 {
            issues.push(ValidationIssue {
                severity: IssueSeverity::Error,
                issue_type: IssueType::DuplicateServiceId,
                message: format!("Duplicate service ID '{}' found {} times", id, count),
                affected_ids: vec![id.clone()],
                suggestion: Some("Rename one of the duplicate services".to_string()),
            });
        }
    }

    // Check for missing required fields in services
    for service in &services {
        let missing_fields = check_required_fields(service);
        if !missing_fields.is_empty() {
            issues.push(ValidationIssue {
                severity: IssueSeverity::Error,
                issue_type: IssueType::MissingRequiredField,
                message: format!(
                    "Service '{}' is missing required fields: {}",
                    service.id,
                    missing_fields.join(", ")
                ),
                affected_ids: vec![service.id.clone()],
                suggestion: Some(format!("Add missing fields: {}", missing_fields.join(", "))),
            });
        }
    }

    // Check for orphaned relationships
    for relationship in &relationships {
        if !service_ids.contains(&relationship.source) {
            issues.push(ValidationIssue {
                severity: IssueSeverity::Error,
                issue_type: IssueType::OrphanedRelationship,
                message: format!(
                    "Relationship '{}' references non-existent source service '{}'",
                    relationship.id, relationship.source
                ),
                affected_ids: vec![relationship.id.clone(), relationship.source.clone()],
                suggestion: Some(format!(
                    "Create service '{}' or delete this relationship",
                    relationship.source
                )),
            });
        }

        if !service_ids.contains(&relationship.target) {
            issues.push(ValidationIssue {
                severity: IssueSeverity::Error,
                issue_type: IssueType::OrphanedRelationship,
                message: format!(
                    "Relationship '{}' references non-existent target service '{}'",
                    relationship.id, relationship.target
                ),
                affected_ids: vec![relationship.id.clone(), relationship.target.clone()],
                suggestion: Some(format!(
                    "Create service '{}' or delete this relationship",
                    relationship.target
                )),
            });
        }

        // Check for invalid relationship types
        if !is_valid_relationship_type(&relationship.relationship_type) {
            issues.push(ValidationIssue {
                severity: IssueSeverity::Warning,
                issue_type: IssueType::InvalidRelationshipType,
                message: format!(
                    "Relationship '{}' has unknown type '{:?}'",
                    relationship.id, relationship.relationship_type
                ),
                affected_ids: vec![relationship.id.clone()],
                suggestion: Some(
                    "Use a standard relationship type: depends_on, communicates_with, authenticates_via, reads_from, writes_to, publishes, subscribes".to_string()
                ),
            });
        }
    }

    // Check for unreachable services (no relationships at all)
    let connected_services: HashSet<String> = relationships
        .iter()
        .flat_map(|r| vec![r.source.clone(), r.target.clone()])
        .collect();

    for service in &services {
        if !connected_services.contains(&service.id) {
            issues.push(ValidationIssue {
                severity: IssueSeverity::Info,
                issue_type: IssueType::UnreachableService,
                message: format!(
                    "Service '{}' has no relationships (isolated)",
                    service.id
                ),
                affected_ids: vec![service.id.clone()],
                suggestion: Some("Add relationships or consider if this service is needed".to_string()),
            });
        }
    }

    // Check for circular dependencies (simple cycle detection using DFS)
    let cycles = detect_circular_dependencies(&relationships, &service_ids);
    for cycle in cycles {
        issues.push(ValidationIssue {
            severity: IssueSeverity::Warning,
            issue_type: IssueType::CircularDependency,
            message: format!("Circular dependency detected: {}", cycle.join(" -> ")),
            affected_ids: cycle.clone(),
            suggestion: Some("Consider breaking the circular dependency".to_string()),
        });
    }

    // Count issues by severity
    let error_count = issues
        .iter()
        .filter(|i| i.severity == IssueSeverity::Error)
        .count();
    let warning_count = issues
        .iter()
        .filter(|i| i.severity == IssueSeverity::Warning)
        .count();
    let info_count = issues
        .iter()
        .filter(|i| i.severity == IssueSeverity::Info)
        .count();

    Ok(ValidationResult {
        issues,
        error_count,
        warning_count,
        info_count,
    })
}

/// Checks if a service has all required fields populated.
///
/// Validates that the service has non-empty values for required fields.
/// Currently checks for `id` and `name` fields.
///
/// # Arguments
///
/// * `service` - The service to validate
///
/// # Returns
///
/// A vector of field names that are missing or empty. Returns an empty
/// vector if all required fields are present.
///
/// # Example
///
/// ```rust
/// let missing = check_required_fields(&service);
/// if !missing.is_empty() {
///     println!("Missing fields: {}", missing.join(", "));
/// }
/// ```
fn check_required_fields(service: &Service) -> Vec<String> {
    let mut missing = Vec::new();

    if service.id.trim().is_empty() {
        missing.push("id".to_string());
    }
    if service.name.trim().is_empty() {
        missing.push("name".to_string());
    }

    missing
}

/// Checks if a relationship type is a known, valid type.
///
/// Validates that the relationship type is one of the predefined types
/// rather than a custom or unknown type.
///
/// # Arguments
///
/// * `rel_type` - The relationship type to validate
///
/// # Returns
///
/// `true` if the type is one of the known types:
/// - DependsOn
/// - CommunicatesWith
/// - AuthenticatesVia
/// - ReadsFrom
/// - WritesTo
/// - Publishes
/// - Subscribes
///
/// Returns `false` for custom or unknown types.
fn is_valid_relationship_type(rel_type: &RelationshipType) -> bool {
    matches!(
        rel_type,
        RelationshipType::DependsOn
            | RelationshipType::CommunicatesWith
            | RelationshipType::AuthenticatesVia
            | RelationshipType::ReadsFrom
            | RelationshipType::WritesTo
            | RelationshipType::Publishes
            | RelationshipType::Subscribes
    )
}

/// Detects circular dependencies in the service dependency graph.
///
/// Uses depth-first search (DFS) to find cycles in "depends_on" relationships.
/// Only considers `DependsOn` relationship types, as other relationship types
/// (like `CommunicatesWith`) don't typically create problematic dependencies.
///
/// # Algorithm
///
/// 1. Build an adjacency list from "depends_on" relationships
/// 2. For each service, perform DFS to find cycles that return to it
/// 3. Normalize discovered cycles to eliminate duplicates
/// 4. Return unique cycles
///
/// # Arguments
///
/// * `relationships` - All relationships in the environment
/// * `service_ids` - Set of all valid service IDs
///
/// # Returns
///
/// A vector of cycles, where each cycle is a vector of service IDs
/// representing the path (e.g., `["A", "B", "C", "A"]` for A -> B -> C -> A).
///
/// # Performance
///
/// Time complexity: O(V * (V + E)) in the worst case, where V is the number
/// of services and E is the number of relationships. In practice, cycles
/// are rare and the algorithm terminates early.
fn detect_circular_dependencies(
    relationships: &[crate::models::Relationship],
    service_ids: &HashSet<String>,
) -> Vec<Vec<String>> {
    let mut cycles = Vec::new();

    // Build adjacency list for "depends_on" relationships only
    let mut graph: HashMap<String, Vec<String>> = HashMap::new();
    for service_id in service_ids {
        graph.insert(service_id.clone(), Vec::new());
    }

    for rel in relationships {
        if matches!(rel.relationship_type, RelationshipType::DependsOn) {
            if let Some(targets) = graph.get_mut(&rel.source) {
                targets.push(rel.target.clone());
            }
        }
    }

    // DFS from each node to find cycles
    for start in service_ids {
        let mut visited = HashSet::new();
        let mut path = Vec::new();
        find_cycles(&graph, start, &mut visited, &mut path, &mut cycles, start);
    }

    // Remove duplicate cycles (keep only unique ones)
    let mut unique_cycles: Vec<Vec<String>> = Vec::new();
    for cycle in cycles {
        let normalized = normalize_cycle(&cycle);
        if !unique_cycles.iter().any(|c| normalize_cycle(c) == normalized) {
            unique_cycles.push(cycle);
        }
    }

    unique_cycles
}

/// Recursive DFS helper function to find cycles starting from a specific node.
///
/// Explores the dependency graph depth-first, tracking the current path.
/// When it encounters a node that leads back to the start node, it records
/// the cycle.
///
/// # Arguments
///
/// * `graph` - Adjacency list representation of the dependency graph
/// * `current` - The current node being visited
/// * `visited` - Set of nodes visited in the current DFS path
/// * `path` - The current path from start to current node
/// * `cycles` - Accumulator for discovered cycles
/// * `start` - The starting node (cycle target)
fn find_cycles(
    graph: &HashMap<String, Vec<String>>,
    current: &str,
    visited: &mut HashSet<String>,
    path: &mut Vec<String>,
    cycles: &mut Vec<Vec<String>>,
    start: &str,
) {
    if visited.contains(current) {
        if current == start && path.len() > 1 {
            let mut cycle = path.clone();
            cycle.push(start.to_string());
            cycles.push(cycle);
        }
        return;
    }

    visited.insert(current.to_string());
    path.push(current.to_string());

    if let Some(neighbors) = graph.get(current) {
        for neighbor in neighbors {
            find_cycles(graph, neighbor, visited, path, cycles, start);
        }
    }

    path.pop();
    visited.remove(current);
}

/// Normalizes a cycle for consistent comparison and deduplication.
///
/// Cycles can be represented starting from different nodes (e.g., A->B->C->A
/// is the same cycle as B->C->A->B). This function normalizes cycles by:
///
/// 1. Removing the duplicate end node (which equals the start)
/// 2. Rotating the cycle so the lexicographically smallest node is first
///
/// # Arguments
///
/// * `cycle` - The cycle to normalize, represented as a path ending at the start node
///
/// # Returns
///
/// A normalized representation of the cycle for comparison purposes.
///
/// # Example
///
/// ```rust
/// let cycle = vec!["B", "C", "A", "B"];
/// let normalized = normalize_cycle(&cycle);
/// assert_eq!(normalized, vec!["A", "B", "C"]);
/// ```
fn normalize_cycle(cycle: &[String]) -> Vec<String> {
    if cycle.is_empty() {
        return Vec::new();
    }

    // Remove the last element (which is duplicate of first in cycle representation)
    let mut nodes: Vec<String> = cycle.iter().take(cycle.len() - 1).cloned().collect();

    // Find minimum element and rotate to start from it
    if let Some(min_pos) = nodes.iter().enumerate().min_by_key(|(_, s)| *s).map(|(i, _)| i) {
        nodes.rotate_left(min_pos);
    }

    nodes
}
