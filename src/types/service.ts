export type ServiceType =
  | "api"
  | "database"
  | "cache"
  | "queue"
  | "gateway"
  | "frontend"
  | "backend"
  | "external"
  | string;

export type ServiceStatus =
  | "healthy"
  | "degraded"
  | "unhealthy"
  | "unknown"
  | "deprecated";

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
