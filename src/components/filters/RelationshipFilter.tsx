/**
 * @fileoverview Relationship type filter checkbox list.
 *
 * Provides checkboxes for filtering graph edges by relationship type,
 * with color-coded badges matching the edge colors in the visualization.
 *
 * @module components/filters/RelationshipFilter
 */

import { VStack, Checkbox, Badge, HStack } from "@chakra-ui/react";
import { useFilterStore, ALL_RELATIONSHIP_TYPES } from "@/store";

/**
 * Checkbox filter for relationship (edge) types.
 *
 * Renders a vertical list of checkboxes for each relationship type
 * (depends_on, communicates_with, authenticates_via, reads_from,
 * writes_to, publishes, subscribes).
 *
 * Each checkbox has a color-coded badge matching the graph edge colors.
 * Checked types are shown in the graph; unchecked types are hidden.
 *
 * @returns The relationship filter component
 *
 * @example
 * ```tsx
 * <RelationshipFilter />
 * ```
 */
export function RelationshipFilter() {
  const { relationshipTypes, toggleRelationshipType } = useFilterStore();

  /**
   * Maps relationship types to Chakra UI color schemes.
   * Colors match those used in the graph edge visualization.
   *
   * @param type - The relationship type string
   * @returns A Chakra UI color scheme name
   */
  const getColorScheme = (type: string): string => {
    const schemes: Record<string, string> = {
      depends_on: "red",
      communicates_with: "blue",
      authenticates_via: "purple",
      reads_from: "green",
      writes_to: "orange",
      publishes: "yellow",
      subscribes: "cyan",
    };
    return schemes[type] || "gray";
  };

  /**
   * Formats a snake_case relationship type into Title Case with spaces.
   *
   * @param type - The relationship type (e.g., "depends_on")
   * @returns The formatted label (e.g., "Depends On")
   */
  const formatLabel = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <VStack align="stretch" spacing={2}>
      {ALL_RELATIONSHIP_TYPES.map((type) => (
        <Checkbox
          key={type}
          isChecked={relationshipTypes.includes(type)}
          onChange={() => toggleRelationshipType(type)}
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
