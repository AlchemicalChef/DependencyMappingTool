//! File system storage operations for services and relationships.
//!
//! This module provides low-level file I/O operations for persisting and loading
//! service and relationship data. Data is stored as JSON files in a directory
//! structure organized by environment.
//!
//! # Directory Structure
//!
//! ```text
//! {data_path}/
//! ├── {environment}/
//! │   ├── services/
//! │   │   ├── service-1.json
//! │   │   ├── service-2.json
//! │   │   └── ...
//! │   └── relationships.json
//! ```

use std::fs;
use std::path::Path;

use crate::error::AppError;
use crate::models::{Relationship, RelationshipsFile, Service};

/// Loads all services from an environment's services directory.
///
/// Reads all JSON files from the `{data_path}/{environment}/services/` directory
/// and deserializes them into Service objects. Files that are not valid JSON
/// or don't match the Service schema will cause an error.
///
/// # Arguments
///
/// * `data_path` - The root data directory path
/// * `environment` - The name of the environment to load services from
///
/// # Returns
///
/// * `Ok(Vec<Service>)` - All services in the environment (empty if directory doesn't exist)
/// * `Err(AppError::Io)` - If there's an error reading files
/// * `Err(AppError::Json)` - If a JSON file cannot be parsed
///
/// # File Format
///
/// Each service file should be named `{service_id}.json` and contain:
/// ```json
/// {
///   "id": "service-id",
///   "name": "Service Name",
///   "serviceType": "api",
///   "status": "healthy",
///   "description": "Optional description",
///   "tags": ["tag1", "tag2"]
/// }
/// ```
pub fn load_services(data_path: &Path, environment: &str) -> Result<Vec<Service>, AppError> {
    let services_dir = data_path.join(environment).join("services");

    if !services_dir.exists() {
        return Ok(Vec::new());
    }

    let mut services = Vec::new();

    for entry in fs::read_dir(&services_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)?;
            let service: Service = serde_json::from_str(&content)?;
            services.push(service);
        }
    }

    Ok(services)
}

/// Loads a single service by its unique identifier.
///
/// Reads and deserializes a specific service JSON file from the environment's
/// services directory.
///
/// # Arguments
///
/// * `data_path` - The root data directory path
/// * `environment` - The name of the environment containing the service
/// * `service_id` - The unique identifier of the service (matches filename without .json)
///
/// # Returns
///
/// * `Ok(Service)` - The requested service
/// * `Err(AppError::ServiceNotFound)` - If the service file doesn't exist
/// * `Err(AppError::Io)` - If there's an error reading the file
/// * `Err(AppError::Json)` - If the JSON file cannot be parsed
///
/// # File Path
///
/// Looks for file at: `{data_path}/{environment}/services/{service_id}.json`
pub fn load_service(
    data_path: &Path,
    environment: &str,
    service_id: &str,
) -> Result<Service, AppError> {
    let service_path = data_path
        .join(environment)
        .join("services")
        .join(format!("{}.json", service_id));

    if !service_path.exists() {
        return Err(AppError::ServiceNotFound(service_id.to_string()));
    }

    let content = fs::read_to_string(&service_path)?;
    let service: Service = serde_json::from_str(&content)?;

    Ok(service)
}

/// Saves a service to its JSON file.
///
/// Serializes the service to JSON and writes it to the appropriate file in
/// the environment's services directory. Creates the directory structure if
/// it doesn't exist.
///
/// # Arguments
///
/// * `data_path` - The root data directory path
/// * `environment` - The name of the environment to save the service to
/// * `service` - The service object to save
///
/// # Returns
///
/// * `Ok(())` - If the service was successfully saved
/// * `Err(AppError::Io)` - If there's an error creating directories or writing the file
/// * `Err(AppError::Json)` - If the service cannot be serialized
///
/// # Side Effects
///
/// - Creates `{data_path}/{environment}/services/` directory if it doesn't exist
/// - Creates or overwrites `{service.id}.json` in the services directory
/// - JSON is written with pretty formatting for readability
pub fn save_service(
    data_path: &Path,
    environment: &str,
    service: &Service,
) -> Result<(), AppError> {
    let services_dir = data_path.join(environment).join("services");

    // Create directory if it doesn't exist
    fs::create_dir_all(&services_dir)?;

    let service_path = services_dir.join(format!("{}.json", service.id));
    let content = serde_json::to_string_pretty(service)?;

    fs::write(&service_path, content)?;

    Ok(())
}

/// Deletes a service's JSON file from disk.
///
/// Removes the service file from the environment's services directory.
/// This operation is irreversible.
///
/// # Arguments
///
/// * `data_path` - The root data directory path
/// * `environment` - The name of the environment containing the service
/// * `service_id` - The unique identifier of the service to delete
///
/// # Returns
///
/// * `Ok(())` - If the file was successfully deleted
/// * `Err(AppError::ServiceNotFound)` - If the service file doesn't exist
/// * `Err(AppError::Io)` - If there's an error deleting the file
///
/// # Warning
///
/// This does NOT delete associated relationships. Call the appropriate
/// relationship cleanup function separately if needed.
pub fn delete_service_file(
    data_path: &Path,
    environment: &str,
    service_id: &str,
) -> Result<(), AppError> {
    let service_path = data_path
        .join(environment)
        .join("services")
        .join(format!("{}.json", service_id));

    if !service_path.exists() {
        return Err(AppError::ServiceNotFound(service_id.to_string()));
    }

    fs::remove_file(&service_path)?;

    Ok(())
}

/// Loads all relationships from an environment's relationships file.
///
/// Reads and deserializes the relationships.json file from the environment
/// directory. Unlike services, all relationships for an environment are
/// stored in a single file.
///
/// # Arguments
///
/// * `data_path` - The root data directory path
/// * `environment` - The name of the environment to load relationships from
///
/// # Returns
///
/// * `Ok(Vec<Relationship>)` - All relationships in the environment (empty if file doesn't exist)
/// * `Err(AppError::Io)` - If there's an error reading the file
/// * `Err(AppError::Json)` - If the JSON file cannot be parsed
///
/// # File Format
///
/// The relationships file should contain:
/// ```json
/// {
///   "relationships": [
///     {
///       "id": "rel-1",
///       "source": "service-a",
///       "target": "service-b",
///       "relationshipType": "depends_on",
///       "description": "Optional description"
///     }
///   ]
/// }
/// ```
pub fn load_relationships(data_path: &Path, environment: &str) -> Result<Vec<Relationship>, AppError> {
    let rel_path = data_path.join(environment).join("relationships.json");

    if !rel_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&rel_path)?;
    let file: RelationshipsFile = serde_json::from_str(&content)?;

    Ok(file.relationships)
}

/// Saves all relationships to an environment's relationships file.
///
/// Serializes all relationships to JSON and writes them to the environment's
/// relationships.json file. This operation replaces the entire file contents.
///
/// # Arguments
///
/// * `data_path` - The root data directory path
/// * `environment` - The name of the environment to save relationships to
/// * `relationships` - The complete list of relationships to save
///
/// # Returns
///
/// * `Ok(())` - If the relationships were successfully saved
/// * `Err(AppError::Io)` - If there's an error creating directories or writing the file
/// * `Err(AppError::Json)` - If the relationships cannot be serialized
///
/// # Side Effects
///
/// - Creates `{data_path}/{environment}/` directory if it doesn't exist
/// - Overwrites `relationships.json` with the new data
/// - JSON is written with pretty formatting for readability
///
/// # Note
///
/// This saves ALL relationships at once. To add or remove individual
/// relationships, load them first, modify the vector, then save.
pub fn save_relationships(
    data_path: &Path,
    environment: &str,
    relationships: &[Relationship],
) -> Result<(), AppError> {
    let env_dir = data_path.join(environment);

    // Create directory if it doesn't exist
    fs::create_dir_all(&env_dir)?;

    let rel_path = env_dir.join("relationships.json");
    let file = RelationshipsFile {
        relationships: relationships.to_vec(),
    };
    let content = serde_json::to_string_pretty(&file)?;

    fs::write(&rel_path, content)?;

    Ok(())
}
