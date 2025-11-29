/**
 * @fileoverview Cytoscape.js graph styling and theme configuration.
 *
 * Provides color mappings and stylesheet generation for the dependency
 * graph visualization, with support for light and dark color modes.
 *
 * @module styles/cytoscape-theme
 */

import type { StylesheetStyle } from "cytoscape";

/**
 * Color mapping for relationship types.
 *
 * Used for edge (arrow) colors in the graph visualization.
 * Colors are chosen to be visually distinct and semantically meaningful:
 * - Red: dependencies (critical connections)
 * - Blue: communication
 * - Purple: authentication
 * - Green/Orange: data read/write
 * - Yellow/Cyan: pub/sub messaging
 */
export const RELATIONSHIP_COLORS: Record<string, string> = {
  depends_on: "#E53E3E",
  communicates_with: "#3182CE",
  authenticates_via: "#805AD5",
  reads_from: "#38A169",
  writes_to: "#DD6B20",
  publishes: "#D69E2E",
  subscribes: "#00B5D8",
};

/**
 * Color mapping for service types.
 *
 * Used for node (circle) background colors in the graph.
 * Each service type has a distinct color for easy identification:
 * - Purple: gateways (entry points)
 * - Blue: APIs
 * - Green: backend services
 * - Orange: databases
 * - Red: caches
 * - Yellow: queues
 * - Cyan: frontends
 * - Gray: external services
 */
export const SERVICE_TYPE_COLORS: Record<string, string> = {
  gateway: "#805AD5",
  api: "#3182CE",
  backend: "#38A169",
  database: "#DD6B20",
  cache: "#E53E3E",
  queue: "#D69E2E",
  frontend: "#00B5D8",
  external: "#718096",
};

/**
 * Generates a Cytoscape.js stylesheet for the dependency graph.
 *
 * Creates style rules for:
 * - **Base nodes**: Default appearance with label positioning
 * - **Center node**: Larger size with highlight color
 * - **Selected node**: Purple border highlight
 * - **Service type colors**: Background color based on type
 * - **Status indicators**: Border color/style based on health
 * - **Base edges**: Arrow styling with bezier curves
 * - **Relationship colors**: Edge color based on type
 *
 * @param isDark - Whether to use dark mode colors
 * @returns Array of Cytoscape StylesheetStyle objects
 *
 * @example
 * ```typescript
 * // In a component
 * const stylesheet = getCytoscapeStylesheet(colorMode === 'dark');
 *
 * <CytoscapeComponent
 *   stylesheet={stylesheet}
 *   elements={elements}
 * />
 * ```
 */
export const getCytoscapeStylesheet = (isDark: boolean): StylesheetStyle[] => {
  const textColor = isDark ? "#E2E8F0" : "#1A202C";
  const borderColor = isDark ? "#4A5568" : "#E2E8F0";

  return [
    // Base node styles
    {
      selector: "node",
      style: {
        "background-color": "#4A5568",
        label: "data(label)",
        "text-valign": "bottom",
        "text-halign": "center",
        "text-margin-y": 8,
        "font-size": "12px",
        color: textColor,
        width: 50,
        height: 50,
        "border-width": 3,
        "border-color": borderColor,
        "text-wrap": "ellipsis",
        "text-max-width": "100px",
      },
    },
    // Center node - larger and highlighted
    {
      selector: "node.center",
      style: {
        "background-color": "#3182CE",
        width: 70,
        height: 70,
        "border-width": 4,
        "border-color": "#2B6CB0",
        "font-weight": "bold",
        "font-size": "14px",
        "z-index": 10,
      },
    },
    // Selected node
    {
      selector: "node:selected",
      style: {
        "border-width": 4,
        "border-color": "#805AD5",
        "background-opacity": 1,
      },
    },
    // Hover state
    {
      selector: "node:active",
      style: {
        "overlay-opacity": 0.1,
        "overlay-color": "#3182CE",
      },
    },
    // Service type colors
    {
      selector: 'node[serviceType = "gateway"]',
      style: { "background-color": "#805AD5" },
    },
    {
      selector: 'node[serviceType = "api"]',
      style: { "background-color": "#3182CE" },
    },
    {
      selector: 'node[serviceType = "backend"]',
      style: { "background-color": "#38A169" },
    },
    {
      selector: 'node[serviceType = "database"]',
      style: { "background-color": "#DD6B20" },
    },
    {
      selector: 'node[serviceType = "cache"]',
      style: { "background-color": "#E53E3E" },
    },
    {
      selector: 'node[serviceType = "queue"]',
      style: { "background-color": "#D69E2E" },
    },
    {
      selector: 'node[serviceType = "frontend"]',
      style: { "background-color": "#00B5D8" },
    },
    {
      selector: 'node[serviceType = "external"]',
      style: { "background-color": "#718096" },
    },
    // Status indicators (border color)
    {
      selector: 'node[status = "healthy"]',
      style: { "border-color": "#48BB78" },
    },
    {
      selector: 'node[status = "degraded"]',
      style: { "border-color": "#ECC94B" },
    },
    {
      selector: 'node[status = "unhealthy"]',
      style: { "border-color": "#F56565" },
    },
    {
      selector: 'node[status = "deprecated"]',
      style: {
        "border-color": "#718096",
        "border-style": "dashed",
      },
    },
    // Base edge styles
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": "#A0AEC0",
        "target-arrow-color": "#A0AEC0",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "arrow-scale": 1.2,
      },
    },
    // Edge hover
    {
      selector: "edge:active",
      style: {
        width: 3,
        "overlay-opacity": 0,
      },
    },
    // Relationship type colors
    {
      selector: 'edge[relationshipType = "depends_on"]',
      style: {
        "line-color": "#E53E3E",
        "target-arrow-color": "#E53E3E",
      },
    },
    {
      selector: 'edge[relationshipType = "communicates_with"]',
      style: {
        "line-color": "#3182CE",
        "target-arrow-color": "#3182CE",
      },
    },
    {
      selector: 'edge[relationshipType = "authenticates_via"]',
      style: {
        "line-color": "#805AD5",
        "target-arrow-color": "#805AD5",
        "line-style": "dashed",
      },
    },
    {
      selector: 'edge[relationshipType = "reads_from"]',
      style: {
        "line-color": "#38A169",
        "target-arrow-color": "#38A169",
      },
    },
    {
      selector: 'edge[relationshipType = "writes_to"]',
      style: {
        "line-color": "#DD6B20",
        "target-arrow-color": "#DD6B20",
      },
    },
    {
      selector: 'edge[relationshipType = "publishes"]',
      style: {
        "line-color": "#D69E2E",
        "target-arrow-color": "#D69E2E",
        "line-style": "dotted",
      },
    },
    {
      selector: 'edge[relationshipType = "subscribes"]',
      style: {
        "line-color": "#00B5D8",
        "target-arrow-color": "#00B5D8",
        "line-style": "dotted",
      },
    },
  ];
};
