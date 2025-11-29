//! Error types for the Tauri application.
//!
//! This module defines all error types that can occur during command execution.
//! Errors are serializable to allow them to be returned to the frontend.

use serde::Serialize;
use thiserror::Error;

/// Application error type for all command operations.
///
/// This enum represents all possible errors that can occur during command
/// execution. Each variant provides context about what went wrong.
///
/// # Serialization
///
/// Errors are serialized as strings (their display representation) when
/// returned to the frontend. This allows for consistent error handling
/// across the IPC boundary.
///
/// # Error Conversion
///
/// The `#[from]` attribute enables automatic conversion from standard
/// library errors (std::io::Error, serde_json::Error) using the `?` operator.
///
/// # Variants
///
/// * `Io` - File system operations failed (read, write, delete)
/// * `Json` - JSON parsing or serialization failed
/// * `ServiceNotFound` - Requested service ID doesn't exist
/// * `EnvironmentNotFound` - Requested environment doesn't exist
/// * `InvalidPath` - Provided file path is invalid or inaccessible
/// * `StateLock` - Failed to acquire the application state mutex
/// * `RelationshipNotFound` - Requested relationship ID doesn't exist
/// * `DuplicateRelationship` - Attempted to create a duplicate relationship
/// * `ValidationError` - Data validation failed
#[derive(Error, Debug)]
pub enum AppError {
    /// File system I/O operation failed.
    /// Contains the underlying std::io::Error.
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON parsing or serialization failed.
    /// Contains the underlying serde_json::Error.
    #[error("JSON parsing error: {0}")]
    Json(#[from] serde_json::Error),

    /// The requested service was not found.
    /// Contains the service ID that was not found.
    #[error("Service not found: {0}")]
    ServiceNotFound(String),

    /// The requested environment was not found.
    /// Contains the environment name that was not found.
    #[error("Environment not found: {0}")]
    EnvironmentNotFound(String),

    /// The provided file path is invalid.
    /// Contains a description of the path issue.
    #[error("Invalid path: {0}")]
    InvalidPath(String),

    /// Failed to acquire a lock on the application state.
    /// This typically indicates a deadlock or poisoned mutex.
    #[error("State lock error")]
    StateLock,

    /// The requested relationship was not found.
    /// Contains the relationship ID that was not found.
    #[error("Relationship not found: {0}")]
    RelationshipNotFound(String),

    /// Attempted to create a relationship that already exists.
    /// Contains the source and target service IDs.
    #[error("Duplicate relationship: {0} -> {1}")]
    DuplicateRelationship(String, String),

    /// Data validation failed.
    /// Contains a description of the validation error.
    #[error("Validation error: {0}")]
    ValidationError(String),
}

impl Serialize for AppError {
    /// Serializes the error as a string for transmission to the frontend.
    ///
    /// Uses the Display implementation to convert the error to a
    /// human-readable string that can be displayed to users.
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
