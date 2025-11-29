/**
 * @fileoverview Type definitions for deployment environments.
 *
 * Defines types and constants for the environment system that allows
 * managing services across different deployment contexts (dev, staging, prod).
 *
 * @module types/environment
 */

/**
 * Common environment name values.
 *
 * Standard environments:
 * - `dev`: Development/local environment
 * - `staging`: Pre-production testing environment
 * - `prod`: Production environment
 *
 * Also accepts arbitrary strings for custom environments.
 */
export type EnvironmentName = "dev" | "staging" | "prod" | string;

/**
 * Represents a deployment environment configuration.
 *
 * @property name - The short identifier used in file paths and APIs
 * @property displayName - Human-readable name for UI display
 */
export interface Environment {
  name: EnvironmentName;
  displayName: string;
}

/**
 * Default environment configurations provided out of the box.
 *
 * These represent the common three-tier deployment model:
 * development, staging, and production.
 */
export const DEFAULT_ENVIRONMENTS: Environment[] = [
  { name: "dev", displayName: "Development" },
  { name: "staging", displayName: "Staging" },
  { name: "prod", displayName: "Production" },
];
