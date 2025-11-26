export type EnvironmentName = "dev" | "staging" | "prod" | string;

export interface Environment {
  name: EnvironmentName;
  displayName: string;
}

export const DEFAULT_ENVIRONMENTS: Environment[] = [
  { name: "dev", displayName: "Development" },
  { name: "staging", displayName: "Staging" },
  { name: "prod", displayName: "Production" },
];
