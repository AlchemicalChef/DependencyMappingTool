/**
 * @fileoverview Service type filter checkbox list.
 *
 * Provides checkboxes for filtering graph nodes by service type,
 * with color-coded badges matching the graph visualization.
 *
 * @module components/filters/ServiceTypeFilter
 */

import { VStack, Checkbox, Badge, HStack } from "@chakra-ui/react";
import { useFilterStore, ALL_SERVICE_TYPES } from "@/store";

/**
 * Checkbox filter for service types.
 *
 * Renders a vertical list of checkboxes for each service type
 * (gateway, api, backend, database, cache, queue, frontend, external).
 * Each checkbox has a color-coded badge matching the graph node colors.
 *
 * Checked items are included in the graph; unchecked items are hidden.
 *
 * @returns The service type filter component
 *
 * @example
 * ```tsx
 * <ServiceTypeFilter />
 * ```
 */
export function ServiceTypeFilter() {
  const { serviceTypes, toggleServiceType } = useFilterStore();

  /**
   * Maps service types to Chakra UI color schemes.
   * Colors match those used in the graph visualization.
   *
   * @param type - The service type string
   * @returns A Chakra UI color scheme name
   */
  const getColorScheme = (type: string): string => {
    const schemes: Record<string, string> = {
      gateway: "purple",
      api: "blue",
      backend: "green",
      database: "orange",
      cache: "red",
      queue: "yellow",
      frontend: "cyan",
      external: "gray",
    };
    return schemes[type] || "gray";
  };

  /**
   * Formats a service type for display by capitalizing the first letter.
   *
   * @param type - The service type string (e.g., "api")
   * @returns The formatted label (e.g., "Api")
   */
  const formatLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <VStack align="stretch" spacing={2}>
      {ALL_SERVICE_TYPES.map((type) => (
        <Checkbox
          key={type}
          isChecked={serviceTypes.includes(type)}
          onChange={() => toggleServiceType(type)}
          size="sm"
        >
          <HStack spacing={2}>
            <Badge colorScheme={getColorScheme(type)} size="sm">
              {formatLabel(type)}
            </Badge>
          </HStack>
        </Checkbox>
      ))}
    </VStack>
  );
}
