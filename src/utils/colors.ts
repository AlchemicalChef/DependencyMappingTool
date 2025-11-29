export const SERVICE_TYPE_COLORS: Record<string, string> = {
  gateway: "#805AD5",
  api: "#3182CE",
  backend: "#38A169",
  database: "#DD6B20",
  cache: "#E53E3E",
  queue: "#D69E2E",
  frontend: "#00B5D8",
  external: "#718096",
  "identity-provider": "#D53F8C",
};

export const STATUS_COLORS: Record<string, string> = {
  healthy: "#48BB78",
  degraded: "#ECC94B",
  unhealthy: "#F56565",
  unknown: "#A0AEC0",
  deprecated: "#718096",
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  depends_on: "#E53E3E",
  communicates_with: "#3182CE",
  authenticates_via: "#805AD5",
  reads_from: "#38A169",
  writes_to: "#DD6B20",
  publishes: "#D69E2E",
  subscribes: "#00B5D8",
};

export function getServiceTypeColor(type: string): string {
  return SERVICE_TYPE_COLORS[type] || "#4A5568";
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "#A0AEC0";
}

export function getRelationshipColor(type: string): string {
  return RELATIONSHIP_COLORS[type] || "#A0AEC0";
}
