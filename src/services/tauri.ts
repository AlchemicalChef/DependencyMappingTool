/**
 * @fileoverview Tauri IPC wrapper functions for backend communication.
 *
 * This module provides type-safe wrapper functions for all Tauri commands,
 * abstracting the low-level invoke calls and providing a clean API for
 * the frontend to interact with the Rust backend.
 *
 * @module services/tauri
 */

import { invoke } from "@tauri-apps/api/core";
import type { Service, GraphData, Relationship } from "@/types";
import type { ValidationIssue } from "@/store/editorStore";

// ============================================================================
// Service Commands
// ============================================================================

/**
 * Retrieves all services for a specified environment.
 *
 * @param environment - The name of the environment (e.g., "dev", "staging", "prod")
 * @returns Promise resolving to an array of all services in the environment
 * @throws Error if the backend fails to load services
 *
 * @example
 * ```typescript
 * const services = await getAllServices('dev');
 * console.log(`Found ${services.length} services`);
 * ```
 */
export async function getAllServices(environment: string): Promise<Service[]> {
  return invoke<Service[]>("get_all_services", { environment });
}

/**
 * Retrieves a single service by its unique identifier.
 *
 * @param environment - The name of the environment
 * @param serviceId - The unique identifier of the service to retrieve
 * @returns Promise resolving to the requested service
 * @throws Error if the service is not found or backend fails
 *
 * @example
 * ```typescript
 * const service = await getServiceById('dev', 'api-gateway');
 * console.log(service.name); // "API Gateway"
 * ```
 */
export async function getServiceById(
  environment: string,
  serviceId: string
): Promise<Service> {
  return invoke<Service>("get_service_by_id", { environment, serviceId });
}

/**
 * Searches for services matching a query string.
 *
 * Performs case-insensitive search across service name, ID, description,
 * owner, team, and tags.
 *
 * @param environment - The name of the environment to search within
 * @param query - The search query string
 * @returns Promise resolving to an array of matching services (may be empty)
 * @throws Error if the backend fails to perform the search
 *
 * @example
 * ```typescript
 * const results = await searchServices('dev', 'auth');
 * // Returns services with "auth" in name, description, or tags
 * ```
 */
export async function searchServices(
  environment: string,
  query: string
): Promise<Service[]> {
  return invoke<Service[]>("search_services", { environment, query });
}

/**
 * Saves a service to the specified environment (create or update).
 *
 * If a service with the same ID exists, it will be updated.
 * Otherwise, a new service will be created.
 *
 * @param environment - The name of the environment to save the service to
 * @param service - The complete service object to save
 * @returns Promise resolving when the save is complete
 * @throws Error if the backend fails to save the service
 *
 * @example
 * ```typescript
 * await saveService('dev', {
 *   id: 'new-service',
 *   name: 'New Service',
 *   serviceType: 'api',
 *   status: 'healthy',
 *   tags: ['api']
 * });
 * ```
 */
export async function saveService(
  environment: string,
  service: Service
): Promise<void> {
  return invoke<void>("save_service", { environment, service });
}

/**
 * Deletes a service from the specified environment.
 *
 * Note: This does NOT automatically delete relationships involving
 * the service. Use deleteRelationshipsForService separately if needed.
 *
 * @param environment - The name of the environment
 * @param serviceId - The unique identifier of the service to delete
 * @returns Promise resolving when the deletion is complete
 * @throws Error if the service is not found or deletion fails
 *
 * @example
 * ```typescript
 * // Delete service and its relationships
 * await deleteRelationshipsForService('dev', 'old-service');
 * await deleteService('dev', 'old-service');
 * ```
 */
export async function deleteService(
  environment: string,
  serviceId: string
): Promise<void> {
  return invoke<void>("delete_service", { environment, serviceId });
}

// ============================================================================
// Graph Commands
// ============================================================================

/**
 * Retrieves the dependency graph centered on a specific service.
 *
 * Performs a breadth-first traversal to find connected services up to
 * the specified depth. Returns the center service, connected services,
 * and all relationships between them.
 *
 * @param environment - The name of the environment
 * @param centerServiceId - The ID of the service to center the graph on
 * @param depth - Optional maximum traversal depth (default: 1)
 * @returns Promise resolving to the graph data for visualization
 * @throws Error if the center service is not found or backend fails
 *
 * @example
 * ```typescript
 * // Get immediate neighbors
 * const graph = await getServiceGraph('dev', 'api-gateway', 1);
 *
 * // Get extended graph (2 levels deep)
 * const extendedGraph = await getServiceGraph('dev', 'api-gateway', 2);
 * ```
 */
export async function getServiceGraph(
  environment: string,
  centerServiceId: string,
  depth?: number
): Promise<GraphData> {
  return invoke<GraphData>("get_service_graph", {
    environment,
    centerServiceId,
    depth,
  });
}

// ============================================================================
// Environment Commands
// ============================================================================

/**
 * Lists all available environments in the data directory.
 *
 * Returns environments sorted by priority: dev, staging, prod, then
 * alphabetically for others.
 *
 * @returns Promise resolving to an array of environment names
 * @throws Error if the backend fails to read the data directory
 *
 * @example
 * ```typescript
 * const environments = await listEnvironments();
 * // ['dev', 'staging', 'prod', 'feature-branch']
 * ```
 */
export async function listEnvironments(): Promise<string[]> {
  return invoke<string[]>("list_environments");
}

/**
 * Retrieves the currently active environment name.
 *
 * @returns Promise resolving to the current environment name
 * @throws Error if the backend fails to get the current environment
 *
 * @example
 * ```typescript
 * const current = await getCurrentEnvironment();
 * console.log(`Currently viewing: ${current}`);
 * ```
 */
export async function getCurrentEnvironment(): Promise<string> {
  return invoke<string>("get_current_environment");
}

/**
 * Switches the active environment to a different one.
 *
 * After switching, all subsequent service/relationship operations will
 * use the new environment.
 *
 * @param environment - The name of the environment to switch to
 * @returns Promise resolving when the switch is complete
 * @throws Error if the environment doesn't exist
 *
 * @example
 * ```typescript
 * await switchEnvironment('staging');
 * // All subsequent operations now use 'staging' environment
 * ```
 */
export async function switchEnvironment(environment: string): Promise<void> {
  return invoke<void>("switch_environment", { environment });
}

/**
 * Sets the root data directory path for all environment data.
 *
 * Use this to point the application at a different data location.
 * This clears all cached data.
 *
 * @param path - The absolute path to the new data directory
 * @returns Promise resolving when the path is updated
 * @throws Error if the path doesn't exist or isn't a directory
 *
 * @example
 * ```typescript
 * await setDataPath('/Users/user/projects/my-app/service-data');
 * ```
 */
export async function setDataPath(path: string): Promise<void> {
  return invoke<void>("set_data_path", { path });
}

// ============================================================================
// Relationship Commands
// ============================================================================

/**
 * Retrieves all relationships for a specified environment.
 *
 * @param environment - The name of the environment
 * @returns Promise resolving to an array of all relationships
 * @throws Error if the backend fails to load relationships
 *
 * @example
 * ```typescript
 * const relationships = await getAllRelationships('dev');
 * console.log(`Found ${relationships.length} relationships`);
 * ```
 */
export async function getAllRelationships(
  environment: string
): Promise<Relationship[]> {
  return invoke<Relationship[]>("get_all_relationships", { environment });
}

/**
 * Retrieves all relationships involving a specific service.
 *
 * Returns relationships where the service is either the source or target.
 *
 * @param environment - The name of the environment
 * @param serviceId - The ID of the service to find relationships for
 * @returns Promise resolving to an array of relationships (may be empty)
 * @throws Error if the backend fails to load relationships
 *
 * @example
 * ```typescript
 * const rels = await getRelationshipsForService('dev', 'api-gateway');
 * // Returns all relationships where api-gateway is source OR target
 * ```
 */
export async function getRelationshipsForService(
  environment: string,
  serviceId: string
): Promise<Relationship[]> {
  return invoke<Relationship[]>("get_relationships_for_service", {
    environment,
    serviceId,
  });
}

/**
 * Saves a relationship to the specified environment (create or update).
 *
 * If a relationship with the same ID exists, it will be updated.
 * For new relationships, validates that no duplicate exists with the
 * same source, target, and type.
 *
 * @param environment - The name of the environment
 * @param relationship - The complete relationship object to save
 * @returns Promise resolving when the save is complete
 * @throws Error if a duplicate relationship exists or save fails
 *
 * @example
 * ```typescript
 * await saveRelationship('dev', {
 *   id: 'rel-123',
 *   source: 'api-gateway',
 *   target: 'user-service',
 *   relationshipType: 'depends_on',
 *   description: 'API Gateway routes to User Service'
 * });
 * ```
 */
export async function saveRelationship(
  environment: string,
  relationship: Relationship
): Promise<void> {
  return invoke<void>("save_relationship", { environment, relationship });
}

/**
 * Deletes a single relationship by its unique identifier.
 *
 * @param environment - The name of the environment
 * @param relationshipId - The unique identifier of the relationship to delete
 * @returns Promise resolving when the deletion is complete
 * @throws Error if the relationship is not found or deletion fails
 *
 * @example
 * ```typescript
 * await deleteRelationship('dev', 'rel-123');
 * ```
 */
export async function deleteRelationship(
  environment: string,
  relationshipId: string
): Promise<void> {
  return invoke<void>("delete_relationship", {
    environment,
    relationshipId,
  });
}

/**
 * Deletes all relationships involving a specific service.
 *
 * Removes relationships where the service is either source or target.
 * Typically called before deleting a service to clean up orphaned relationships.
 *
 * @param environment - The name of the environment
 * @param serviceId - The ID of the service whose relationships to delete
 * @returns Promise resolving to the number of relationships deleted
 * @throws Error if the backend fails to delete relationships
 *
 * @example
 * ```typescript
 * const count = await deleteRelationshipsForService('dev', 'deprecated-service');
 * console.log(`Deleted ${count} relationships`);
 * ```
 */
export async function deleteRelationshipsForService(
  environment: string,
  serviceId: string
): Promise<number> {
  return invoke<number>("delete_relationships_for_service", {
    environment,
    serviceId,
  });
}

// ============================================================================
// Validation Commands
// ============================================================================

/**
 * Result of validating an environment's data integrity.
 *
 * @property issues - Array of validation issues found
 * @property errorCount - Number of critical errors
 * @property warningCount - Number of warnings
 * @property infoCount - Number of informational notices
 */
export interface ValidationResult {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Validates the entire environment for data integrity issues.
 *
 * Checks for:
 * - Duplicate service IDs (error)
 * - Missing required fields (error)
 * - Orphaned relationships (error)
 * - Invalid relationship types (warning)
 * - Circular dependencies (warning)
 * - Unreachable services (info)
 *
 * @param environment - The name of the environment to validate
 * @returns Promise resolving to the validation results
 * @throws Error if the backend fails to validate
 *
 * @example
 * ```typescript
 * const result = await validateEnvironment('dev');
 * if (result.errorCount > 0) {
 *   console.log('Environment has errors:', result.issues);
 * }
 * ```
 */
export async function validateEnvironment(
  environment: string
): Promise<ValidationResult> {
  return invoke<ValidationResult>("validate_environment", { environment });
}
