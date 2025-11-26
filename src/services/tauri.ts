import { invoke } from "@tauri-apps/api/core";
import type { Service, GraphData } from "@/types";

// Service commands
export async function getAllServices(environment: string): Promise<Service[]> {
  return invoke<Service[]>("get_all_services", { environment });
}

export async function getServiceById(
  environment: string,
  serviceId: string
): Promise<Service> {
  return invoke<Service>("get_service_by_id", { environment, serviceId });
}

export async function searchServices(
  environment: string,
  query: string
): Promise<Service[]> {
  return invoke<Service[]>("search_services", { environment, query });
}

export async function saveService(
  environment: string,
  service: Service
): Promise<void> {
  return invoke<void>("save_service", { environment, service });
}

export async function deleteService(
  environment: string,
  serviceId: string
): Promise<void> {
  return invoke<void>("delete_service", { environment, serviceId });
}

// Graph commands
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

// Environment commands
export async function listEnvironments(): Promise<string[]> {
  return invoke<string[]>("list_environments");
}

export async function getCurrentEnvironment(): Promise<string> {
  return invoke<string>("get_current_environment");
}

export async function switchEnvironment(environment: string): Promise<void> {
  return invoke<void>("switch_environment", { environment });
}

export async function setDataPath(path: string): Promise<void> {
  return invoke<void>("set_data_path", { path });
}
