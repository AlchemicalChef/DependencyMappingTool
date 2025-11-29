/**
 * @fileoverview Zustand store for graph navigation history.
 *
 * Implements browser-like back/forward navigation for the dependency graph,
 * allowing users to navigate through previously viewed services.
 *
 * @module store/navigationStore
 */

import { create } from "zustand";

/**
 * State interface for the navigation store.
 *
 * @property history - Array of visited service IDs
 * @property currentIndex - Index of the current position in history
 */
interface NavigationState {
  history: string[];
  currentIndex: number;

  // Actions
  /** Navigates to a new service (truncates forward history) */
  push: (serviceId: string) => void;
  /** Goes back in history, returns the service ID or null */
  goBack: () => string | null;
  /** Goes forward in history, returns the service ID or null */
  goForward: () => string | null;
  /** Returns true if back navigation is available */
  canGoBack: () => boolean;
  /** Returns true if forward navigation is available */
  canGoForward: () => boolean;
  /** Gets the breadcrumb trail up to current position */
  getBreadcrumbs: () => string[];
  /** Resets navigation history */
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  history: [],
  currentIndex: -1,

  push: (serviceId) =>
    set((state) => {
      // Don't add if already at this service
      if (state.history[state.currentIndex] === serviceId) {
        return state;
      }

      // Truncate forward history when navigating to new node
      const newHistory = state.history.slice(0, state.currentIndex + 1);
      newHistory.push(serviceId);
      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    }),

  goBack: () => {
    const state = get();
    if (state.currentIndex > 0) {
      set({ currentIndex: state.currentIndex - 1 });
      return state.history[state.currentIndex - 1];
    }
    return null;
  },

  goForward: () => {
    const state = get();
    if (state.currentIndex < state.history.length - 1) {
      set({ currentIndex: state.currentIndex + 1 });
      return state.history[state.currentIndex + 1];
    }
    return null;
  },

  canGoBack: () => get().currentIndex > 0,
  canGoForward: () => get().currentIndex < get().history.length - 1,
  getBreadcrumbs: () => get().history.slice(0, get().currentIndex + 1),
  reset: () => set({ history: [], currentIndex: -1 }),
}));
