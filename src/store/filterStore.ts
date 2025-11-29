/**
 * @fileoverview Zustand store for filter state management.
 *
 * Manages filter settings for the graph and service list, including
 * service type filters, status filters, relationship type filters,
 * and search queries.
 *
 * @module store/filterStore
 */

import { create } from "zustand";
import type { ServiceType, ServiceStatus, RelationshipType } from "@/types";

/**
 * State interface for the filter store.
 *
 * @property serviceTypes - Array of enabled service types to show
 * @property statuses - Array of enabled statuses to show
 * @property relationshipTypes - Array of enabled relationship types to show
 * @property searchQuery - Current search query string
 */
interface FilterState {
  serviceTypes: ServiceType[];
  statuses: ServiceStatus[];
  relationshipTypes: RelationshipType[];
  searchQuery: string;

  // Actions
  /** Toggles a service type filter on/off */
  toggleServiceType: (type: ServiceType) => void;
  /** Toggles a status filter on/off */
  toggleStatus: (status: ServiceStatus) => void;
  /** Toggles a relationship type filter on/off */
  toggleRelationshipType: (type: RelationshipType) => void;
  /** Sets the search query */
  setSearchQuery: (query: string) => void;
  /** Resets all filters to default (all enabled) */
  clearFilters: () => void;
  /** Returns true if any filters are actively restricting results */
  hasActiveFilters: () => boolean;
}

/** All available service types for filtering */
const ALL_SERVICE_TYPES: ServiceType[] = [
  "api",
  "database",
  "cache",
  "queue",
  "gateway",
  "frontend",
  "backend",
  "external",
];

const ALL_STATUSES: ServiceStatus[] = [
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
  "deprecated",
];

const ALL_RELATIONSHIP_TYPES: RelationshipType[] = [
  "depends_on",
  "communicates_with",
  "authenticates_via",
  "reads_from",
  "writes_to",
  "publishes",
  "subscribes",
];

export const useFilterStore = create<FilterState>((set, get) => ({
  serviceTypes: [...ALL_SERVICE_TYPES],
  statuses: [...ALL_STATUSES],
  relationshipTypes: [...ALL_RELATIONSHIP_TYPES],
  searchQuery: "",

  toggleServiceType: (type) =>
    set((state) => {
      const types = state.serviceTypes.includes(type)
        ? state.serviceTypes.filter((t) => t !== type)
        : [...state.serviceTypes, type];
      return { serviceTypes: types };
    }),

  toggleStatus: (status) =>
    set((state) => {
      const statuses = state.statuses.includes(status)
        ? state.statuses.filter((s) => s !== status)
        : [...state.statuses, status];
      return { statuses };
    }),

  toggleRelationshipType: (type) =>
    set((state) => {
      const types = state.relationshipTypes.includes(type)
        ? state.relationshipTypes.filter((t) => t !== type)
        : [...state.relationshipTypes, type];
      return { relationshipTypes: types };
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearFilters: () =>
    set({
      serviceTypes: [...ALL_SERVICE_TYPES],
      statuses: [...ALL_STATUSES],
      relationshipTypes: [...ALL_RELATIONSHIP_TYPES],
      searchQuery: "",
    }),

  hasActiveFilters: () => {
    const state = get();
    return (
      state.searchQuery !== "" ||
      state.serviceTypes.length !== ALL_SERVICE_TYPES.length ||
      state.statuses.length !== ALL_STATUSES.length ||
      state.relationshipTypes.length !== ALL_RELATIONSHIP_TYPES.length
    );
  },
}));

export { ALL_SERVICE_TYPES, ALL_STATUSES, ALL_RELATIONSHIP_TYPES };
