/**
 * @fileoverview Service status filter checkbox list.
 *
 * Provides checkboxes for filtering graph nodes by health status,
 * with color-coded badges indicating severity.
 *
 * @module components/filters/StatusFilter
 */

import { VStack, Checkbox, Badge, HStack } from "@chakra-ui/react";
import { useFilterStore, ALL_STATUSES } from "@/store";

/**
 * Checkbox filter for service health statuses.
 *
 * Renders a vertical list of checkboxes for each status
 * (healthy, degraded, unhealthy, unknown, deprecated).
 * Each checkbox has a color-coded badge:
 * - **Green**: healthy
 * - **Yellow**: degraded
 * - **Red**: unhealthy
 * - **Gray**: unknown, deprecated
 *
 * Checked items are included in the graph; unchecked items are hidden.
 *
 * @returns The status filter component
 *
 * @example
 * ```tsx
 * <StatusFilter />
 * ```
 */
export function StatusFilter() {
  const { statuses, toggleStatus } = useFilterStore();

  /**
   * Maps service status to Chakra UI color schemes.
   * Uses semantic colors to indicate health severity.
   *
   * @param status - The service status string
   * @returns A Chakra UI color scheme name
   */
  const getColorScheme = (status: string): string => {
    const schemes: Record<string, string> = {
      healthy: "green",
      degraded: "yellow",
      unhealthy: "red",
      unknown: "gray",
      deprecated: "gray",
    };
    return schemes[status] || "gray";
  };

  /**
   * Formats a status for display by capitalizing the first letter.
   *
   * @param status - The status string (e.g., "healthy")
   * @returns The formatted label (e.g., "Healthy")
   */
  const formatLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <VStack align="stretch" spacing={2}>
      {ALL_STATUSES.map((status) => (
        <Checkbox
          key={status}
          isChecked={statuses.includes(status)}
          onChange={() => toggleStatus(status)}
          size="sm"
        >
          <HStack spacing={2}>
            <Badge colorScheme={getColorScheme(status)} size="sm">
              {formatLabel(status)}
            </Badge>
          </HStack>
        </Checkbox>
      ))}
    </VStack>
  );
}
