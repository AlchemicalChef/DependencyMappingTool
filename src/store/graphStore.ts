import { create } from "zustand";
import type { GraphElements } from "@/types/graph";
import type { Service } from "@/types/service";

interface GraphState {
  elements: GraphElements;
  centerNodeId: string | null;
  centerService: Service | null;
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setElements: (elements: GraphElements) => void;
  setCenterNode: (nodeId: string, service: Service) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  elements: [],
  centerNodeId: null,
  centerService: null,
  selectedNodeId: null,
  isLoading: false,
  error: null,

  setElements: (elements) => set({ elements, error: null }),
  setCenterNode: (nodeId, service) =>
    set({ centerNodeId: nodeId, centerService: service }),
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () =>
    set({
      elements: [],
      centerNodeId: null,
      centerService: null,
      selectedNodeId: null,
      error: null,
    }),
}));
