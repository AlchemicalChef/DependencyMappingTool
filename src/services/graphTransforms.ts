import type { GraphData, GraphElements, GraphNode, GraphEdge } from "@/types/graph";
import type { Service } from "@/types/service";
import type { Relationship } from "@/types/relationship";

export function transformToGraphElements(
  data: GraphData,
  _centerServiceId?: string
): GraphElements {
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

function formatRelationshipLabel(type: string): string {
  return type.replace(/_/g, " ");
}

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
