/**
 * @fileoverview Zustand store for services data management.
 *
 * Manages the collection of services, environment state, and provides
 * methods for fetching and accessing service data. Uses a Map for
 * O(1) service lookups by ID.
 *
 * @module store/servicesStore
 */

import { create } from "zustand";
import type { Service } from "@/types/service";
import { getAllServices } from "@/services/tauri";

/**
 * State interface for the services store.
 *
 * @property services - Map of service ID to Service for O(1) lookup
 * @property currentEnvironment - Currently selected environment name
 * @property availableEnvironments - List of all available environments
 * @property isLoading - Whether services are being fetched
 * @property error - Error message if the last operation failed
 * @property allTags - Computed list of all unique tags across services
 */
interface ServicesState {
  services: Map<string, Service>;
  currentEnvironment: string;
  availableEnvironments: string[];
  isLoading: boolean;
  error: string | null;

  // Computed
  allTags: string[];

  // Actions
  /** Sets the services collection from an array */
  setServices: (services: Service[]) => void;
  /** Gets a service by ID (O(1) lookup) */
  getService: (id: string) => Service | undefined;
  /** Returns all services as an array */
  getAllServicesArray: () => Service[];
  /** Sets the current environment */
  setCurrentEnvironment: (env: string) => void;
  /** Sets the list of available environments */
  setAvailableEnvironments: (envs: string[]) => void;
  /** Sets the loading state */
  setLoading: (loading: boolean) => void;
  /** Sets an error message */
  setError: (error: string | null) => void;
  /** Refreshes services from the backend */
  refreshServices: (environment: string) => Promise<void>;
  /** Resets the store to initial state */
  reset: () => void;
}

/**
 * Extracts all unique tags from a services collection.
 *
 * @param services - Map of services to extract tags from
 * @returns Sorted array of unique tag strings
 */
function extractAllTags(services: Map<string, Service>): string[] {
  const tagSet = new Set<string>();
  services.forEach((service) => {
    service.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: new Map(),
  currentEnvironment: "dev",
  availableEnvironments: [],
  isLoading: false,
  error: null,
  allTags: [],

  setServices: (services) => {
    const servicesMap = new Map(services.map((s) => [s.id, s]));
    set({
      services: servicesMap,
      allTags: extractAllTags(servicesMap),
      error: null,
    });
  },

  getService: (id) => get().services.get(id),

  getAllServicesArray: () => Array.from(get().services.values()),

  setCurrentEnvironment: (env) => set({ currentEnvironment: env }),

  setAvailableEnvironments: (envs) => set({ availableEnvironments: envs }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  refreshServices: async (environment: string) => {
    set({ isLoading: true });
    try {
      const services = await getAllServices(environment);
      const servicesMap = new Map(services.map((s) => [s.id, s]));
      set({
        services: servicesMap,
        allTags: extractAllTags(servicesMap),
        error: null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  reset: () =>
    set({
      services: new Map(),
      allTags: [],
      error: null,
    }),
}));
