/**
 * @fileoverview Type definitions for the Cytoscape.js graph visualization.
 *
 * Defines interfaces for graph elements (nodes and edges) that are
 * compatible with Cytoscape.js ElementDefinition format.
 *
 * @module types/graph
 */

import type { ElementDefinition } from "cytoscape";
import type { Service } from "./service";
import type { Relationship } from "./relationship";

/**
 * Data properties for a graph node representing a service.
 *
 * @property id - Unique identifier matching the service ID
 * @property label - Display text (service name)
 * @property serviceType - Service category for styling
 * @property status - Health status for border color styling
 * @property isCenter - Whether this is the center/focus node
 */
export interface GraphNodeData {
  id: string;
  label: string;
  serviceType: string;
  status: string;
  isCenter: boolean;
}

/**
 * Data properties for a graph edge representing a relationship.
 *
 * @property id - Unique identifier for the edge
 * @property source - ID of the source node
 * @property target - ID of the target node
 * @property relationshipType - Type of relationship for styling
 * @property label - Optional display text on the edge
 */
export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  label?: string;
}

/**
 * A Cytoscape node element with typed data.
 */
export type GraphNode = ElementDefinition & { data: GraphNodeData };

/**
 * A Cytoscape edge element with typed data.
 */
export type GraphEdge = ElementDefinition & { data: GraphEdgeData };

/**
 * Array of graph elements (nodes and edges) for Cytoscape.
 */
export type GraphElements = (GraphNode | GraphEdge)[];

/**
 * Response data from the backend graph query.
 *
 * Contains all services and relationships within a certain depth
 * from a center service, used to build the visualization.
 *
 * @property centerService - The service at the center of the graph
 * @property connectedServices - All services connected within the depth
 * @property relationships - All relationships between the services
 *
 * @example
 * ```typescript
 * const graphData: GraphData = {
 *   centerService: { id: "api-gateway", name: "API Gateway", ... },
 *   connectedServices: [
 *     { id: "user-service", name: "User Service", ... },
 *     { id: "auth-service", name: "Auth Service", ... }
 *   ],
 *   relationships: [
 *     { id: "rel-1", source: "api-gateway", target: "user-service", ... }
 *   ]
 * };
 * ```
 */
export interface GraphData {
  centerService: Service;
  connectedServices: Service[];
  relationships: Relationship[];
}
