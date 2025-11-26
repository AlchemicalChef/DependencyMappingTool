import { create } from "zustand";
import type { Service } from "@/types/service";

interface ServicesState {
  services: Map<string, Service>;
  currentEnvironment: string;
  availableEnvironments: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setServices: (services: Service[]) => void;
  getService: (id: string) => Service | undefined;
  setCurrentEnvironment: (env: string) => void;
  setAvailableEnvironments: (envs: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: new Map(),
  currentEnvironment: "dev",
  availableEnvironments: [],
  isLoading: false,
  error: null,

  setServices: (services) =>
    set({
      services: new Map(services.map((s) => [s.id, s])),
      error: null,
    }),

  getService: (id) => get().services.get(id),

  setCurrentEnvironment: (env) => set({ currentEnvironment: env }),

  setAvailableEnvironments: (envs) => set({ availableEnvironments: envs }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () =>
    set({
      services: new Map(),
      error: null,
    }),
}));
