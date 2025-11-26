use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON parsing error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Service not found: {0}")]
    ServiceNotFound(String),

    #[error("Environment not found: {0}")]
    EnvironmentNotFound(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("State lock error")]
    StateLock,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
