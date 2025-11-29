/**
 * @fileoverview Type definitions for relationships between services.
 *
 * Defines the core Relationship interface and related types used to
 * represent connections and dependencies between services in the graph.
 *
 * @module types/relationship
 */

/**
 * Supported relationship type categories.
 *
 * Each type represents a common service interaction pattern:
 * - `depends_on`: Service requires another to function (hard dependency)
 * - `communicates_with`: Service makes HTTP/RPC calls to another
 * - `authenticates_via`: Service uses another for authentication
 * - `reads_from`: Service reads data from another (database, cache)
 * - `writes_to`: Service writes data to another (database, cache)
 * - `publishes`: Service publishes messages/events
 * - `subscribes`: Service subscribes to messages/events
 *
 * Also accepts arbitrary strings for custom relationship types.
 */
export type RelationshipType =
  | "depends_on"
  | "communicates_with"
  | "authenticates_via"
  | "reads_from"
  | "writes_to"
  | "publishes"
  | "subscribes"
  | string;

/**
 * Represents a directed relationship between two services.
 *
 * Relationships form the edges in the dependency graph, connecting
 * a source service to a target service with a specific type.
 *
 * @property id - Unique identifier for the relationship
 * @property source - ID of the source service (where the edge starts)
 * @property target - ID of the target service (where the edge points)
 * @property relationshipType - Type of relationship/dependency
 * @property description - Optional description of the relationship
 * @property metadata - Optional key-value pairs for custom properties
 *
 * @example
 * ```typescript
 * const relationship: Relationship = {
 *   id: "rel-user-api-auth-service",
 *   source: "user-api",
 *   target: "auth-service",
 *   relationshipType: "authenticates_via",
 *   description: "Validates JWT tokens",
 *   metadata: { protocol: "grpc" }
 * };
 * ```
 */
export interface Relationship {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  description?: string;
  metadata?: Record<string, unknown>;
}
