/**
 * @fileoverview Type definitions for services in the dependency mapping system.
 *
 * Defines the core Service interface and related types used throughout
 * the application for representing microservices and their metadata.
 *
 * @module types/service
 */

/**
 * Supported service type categories.
 *
 * Each type represents a common architectural component:
 * - `api`: REST or GraphQL API service
 * - `database`: Persistent data storage (PostgreSQL, MongoDB, etc.)
 * - `cache`: In-memory cache (Redis, Memcached)
 * - `queue`: Message queue (RabbitMQ, Kafka, SQS)
 * - `gateway`: API gateway or load balancer
 * - `frontend`: Web or mobile frontend application
 * - `backend`: Backend processing service
 * - `external`: Third-party or external service
 *
 * Also accepts arbitrary strings for custom types.
 */
export type ServiceType =
  | "api"
  | "database"
  | "cache"
  | "queue"
  | "gateway"
  | "frontend"
  | "backend"
  | "external"
  | "identity-provider"
  | string;

/**
 * Health status indicators for services.
 *
 * - `healthy`: Service is operating normally
 * - `degraded`: Service is operational but experiencing issues
 * - `unhealthy`: Service is not functioning correctly
 * - `unknown`: Health status cannot be determined
 * - `deprecated`: Service is scheduled for removal
 */
export type ServiceStatus =
  | "healthy"
  | "degraded"
  | "unhealthy"
  | "unknown"
  | "deprecated";

/**
 * Represents a service/microservice in the dependency graph.
 *
 * This is the core data structure for services, containing all metadata
 * needed for visualization, filtering, and documentation.
 *
 * @property id - Unique identifier (lowercase alphanumeric with hyphens)
 * @property name - Human-readable display name
 * @property serviceType - Category of service (api, database, etc.)
 * @property status - Current health status
 * @property description - Optional detailed description
 * @property version - Optional version string (e.g., "1.0.0")
 * @property owner - Optional individual owner identifier
 * @property team - Optional team responsible for the service
 * @property tags - Array of searchable tags for categorization
 * @property metadata - Key-value pairs for custom properties
 *
 * @example
 * ```typescript
 * const service: Service = {
 *   id: "user-api",
 *   name: "User API",
 *   serviceType: "api",
 *   status: "healthy",
 *   description: "Handles user authentication and profiles",
 *   version: "2.1.0",
 *   owner: "john.doe",
 *   team: "Platform",
 *   tags: ["auth", "critical", "public-facing"],
 *   metadata: { port: 8080, replicas: 3 }
 * };
 * ```
 */
export interface Service {
  id: string;
  name: string;
  serviceType: ServiceType;
  status: ServiceStatus;
  description?: string;
  version?: string;
  owner?: string;
  team?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}
