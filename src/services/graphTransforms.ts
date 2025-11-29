/**
 * @fileoverview Graph data transformation utilities for Cytoscape.js visualization.
 *
 * This module provides functions to transform backend data structures into
 * formats suitable for rendering with Cytoscape.js, as well as utility
 * functions for consistent color coding across the application.
 *
 * @module services/graphTransforms
 */

import type { GraphData, GraphElements, GraphNode, GraphEdge } from "@/types/graph";
import type { Service } from "@/types/service";
import type { Relationship } from "@/types/relationship";

/**
 * Transforms backend GraphData into Cytoscape.js compatible elements.
 *
 * Converts services to nodes and relationships to edges, marking the
 * center service for special styling.
 *
 * @param data - The graph data from the backend containing center service,
 *               connected services, and relationships
 * @returns Array of Cytoscape elements (nodes and edges) ready for rendering
 *
 * @example
 * ```typescript
 * const graphData = await getServiceGraph('dev', 'api-gateway', 1);
 * const elements = transformToGraphElements(graphData);
 * cy.add(elements);
 * ```
 */
export function transformToGraphElements(data: GraphData): GraphElements {
  const elements: GraphElements = [];

  // Add center service node
  elements.push(serviceToNode(data.centerService, true));

  // Add connected service nodes
  for (const service of data.connectedServices) {
    elements.push(serviceToNode(service, false));
  }

  // Add relationship edges
  for (const rel of data.relationships) {
    elements.push(relationshipToEdge(rel));
  }

  return elements;
}

/**
 * Converts a Service to a Cytoscape node element.
 *
 * @param service - The service to convert
 * @param isCenter - Whether this service is the center of the graph view
 * @returns A Cytoscape node element with service data
 */
function serviceToNode(service: Service, isCenter: boolean): GraphNode {
  return {
    data: {
      id: service.id,
      label: service.name,
      serviceType: service.serviceType,
      status: service.status,
      isCenter,
    },
  };
}

/**
 * Converts a Relationship to a Cytoscape edge element.
 *
 * @param relationship - The relationship to convert
 * @returns A Cytoscape edge element with relationship data
 */
function relationshipToEdge(relationship: Relationship): GraphEdge {
  return {
    data: {
      id: relationship.id,
      source: relationship.source,
      target: relationship.target,
      relationshipType: relationship.relationshipType,
      label: formatRelationshipLabel(relationship.relationshipType),
    },
  };
}

/**
 * Formats a relationship type for display as a label.
 *
 * Replaces underscores with spaces for readability.
 *
 * @param type - The relationship type (e.g., "depends_on")
 * @returns Human-readable label (e.g., "depends on")
 */
function formatRelationshipLabel(type: string): string {
  return type.replace(/_/g, " ");
}

/**
 * Returns the color associated with a service type.
 *
 * Used for consistent visual differentiation of service types
 * across the graph and UI.
 *
 * @param type - The service type (e.g., "api", "database")
 * @returns Hex color code for the service type
 *
 * @example
 * ```typescript
 * const color = getServiceTypeColor('api'); // "#3182CE" (blue)
 * ```
 */
export function getServiceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    gateway: "#805AD5", // purple
    api: "#3182CE", // blue
    backend: "#38A169", // green
    database: "#DD6B20", // orange
    cache: "#E53E3E", // red
    queue: "#D69E2E", // yellow
    frontend: "#00B5D8", // cyan
    external: "#718096", // gray
  };
  return colors[type] || "#4A5568";
}

/**
 * Returns the color associated with a service status.
 *
 * Used for visual health indicators in the graph and UI.
 *
 * @param status - The service status (e.g., "healthy", "degraded")
 * @returns Hex color code for the status
 *
 * @example
 * ```typescript
 * const color = getStatusColor('healthy'); // "#48BB78" (green)
 * ```
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    healthy: "#48BB78", // green
    degraded: "#ECC94B", // yellow
    unhealthy: "#F56565", // red
    unknown: "#A0AEC0", // gray
    deprecated: "#718096", // dark gray
  };
  return colors[status] || "#A0AEC0";
}

/**
 * Returns the color associated with a relationship type.
 *
 * Used for visual differentiation of edge types in the graph.
 *
 * @param type - The relationship type (e.g., "depends_on", "communicates_with")
 * @returns Hex color code for the relationship type
 *
 * @example
 * ```typescript
 * const color = getRelationshipColor('depends_on'); // "#E53E3E" (red)
 * ```
 */
export function getRelationshipColor(type: string): string {
  const colors: Record<string, string> = {
    depends_on: "#E53E3E", // red
    communicates_with: "#3182CE", // blue
    authenticates_via: "#805AD5", // purple
    reads_from: "#38A169", // green
    writes_to: "#DD6B20", // orange
    publishes: "#D69E2E", // yellow
    subscribes: "#00B5D8", // cyan
  };
  return colors[type] || "#A0AEC0";
}
