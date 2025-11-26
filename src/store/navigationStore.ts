import { create } from "zustand";

interface NavigationState {
  history: string[];
  currentIndex: number;

  // Actions
  push: (serviceId: string) => void;
  goBack: () => string | null;
  goForward: () => string | null;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  getBreadcrumbs: () => string[];
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
