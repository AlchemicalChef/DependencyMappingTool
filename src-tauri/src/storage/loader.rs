use std::fs;
use std::path::Path;

use crate::error::AppError;
use crate::models::{Relationship, RelationshipsFile, Service};

/// Load all services from the environment's services directory
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

/// Load a single service by ID
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

/// Save a service to its JSON file
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

/// Delete a service file
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

/// Load relationships from the environment's relationships.json file
pub fn load_relationships(data_path: &Path, environment: &str) -> Result<Vec<Relationship>, AppError> {
    let rel_path = data_path.join(environment).join("relationships.json");

    if !rel_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&rel_path)?;
    let file: RelationshipsFile = serde_json::from_str(&content)?;

    Ok(file.relationships)
}

/// Save relationships to the environment's relationships.json file
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
