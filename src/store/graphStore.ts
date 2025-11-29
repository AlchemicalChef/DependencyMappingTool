/**
 * @fileoverview Zustand store for graph visualization state.
 *
 * Manages the state of the dependency graph including elements (nodes/edges),
 * the currently centered service, selection state, and loading/error states.
 *
 * @module store/graphStore
 */

import { create } from "zustand";
import type { GraphElements } from "@/types/graph";
import type { Service } from "@/types/service";
import { getServiceGraph } from "@/services/tauri";
import { transformToGraphElements } from "@/services/graphTransforms";

/**
 * State interface for the graph visualization store.
 *
 * @property elements - Cytoscape elements (nodes and edges) for rendering
 * @property centerNodeId - ID of the service at the center of the graph
 * @property centerService - Full service object for the center node
 * @property selectedNodeId - ID of the currently selected/highlighted node
 * @property isLoading - Whether graph data is being fetched
 * @property error - Error message if the last operation failed
 */
interface GraphState {
  elements: GraphElements;
  centerNodeId: string | null;
  centerService: Service | null;
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  /** Sets the graph elements for rendering */
  setElements: (elements: GraphElements) => void;
  /** Sets the center node of the graph */
  setCenterNode: (nodeId: string, service: Service) => void;
  /** Sets the currently selected node */
  setSelectedNode: (nodeId: string | null) => void;
  /** Sets the loading state */
  setLoading: (loading: boolean) => void;
  /** Sets an error message */
  setError: (error: string | null) => void;
  /** Refreshes graph data from the backend */
  refreshGraph: (environment: string) => Promise<void>;
  /** Resets the store to initial state */
  reset: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
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
  refreshGraph: async (environment: string) => {
    const { centerNodeId } = get();
    if (!centerNodeId) return;

    set({ isLoading: true });
    try {
      const graphData = await getServiceGraph(environment, centerNodeId, 1);
      const elements = transformToGraphElements(graphData);
      set({
        elements,
        centerService: graphData.centerService,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
  reset: () =>
    set({
      elements: [],
      centerNodeId: null,
      centerService: null,
      selectedNodeId: null,
      error: null,
    }),
}));
