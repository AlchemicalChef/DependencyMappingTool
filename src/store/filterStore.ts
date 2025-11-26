import { create } from "zustand";
import type { ServiceType, ServiceStatus, RelationshipType } from "@/types";

interface FilterState {
  serviceTypes: ServiceType[];
  statuses: ServiceStatus[];
  relationshipTypes: RelationshipType[];
  searchQuery: string;

  // Actions
  toggleServiceType: (type: ServiceType) => void;
  toggleStatus: (status: ServiceStatus) => void;
  toggleRelationshipType: (type: RelationshipType) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

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
