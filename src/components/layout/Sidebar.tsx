/**
 * @fileoverview Sidebar component for the application.
 *
 * Contains filter controls and service detail panels in a fixed-width
 * collapsible sidebar on the left side of the main content area.
 *
 * @module components/layout/Sidebar
 */

import {
  Box,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FilterPanel } from "../filters/FilterPanel";
import { ServiceDetailPanel } from "../details/ServiceDetailPanel";

/**
 * Left sidebar containing filters and service details.
 *
 * Fixed at 300px width with a vertical layout:
 * - **Top section** (scrollable): Filter panel for service types, statuses,
 *   and relationship types
 * - **Bottom section**: Collapsible service detail panel showing info
 *   about the selected or center service
 *
 * Adapts colors based on the current color mode (light/dark).
 *
 * @returns The sidebar component with filters and details
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */
export function Sidebar() {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      w="300px"
      h="100%"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      overflow="hidden"
      display="flex"
      flexDirection="column"
      flexShrink={0}
    >
      <VStack spacing={0} align="stretch" h="100%">
        <Box flex="1" overflow="auto" p={4}>
          <FilterPanel />
        </Box>
        <ServiceDetailPanel />
      </VStack>
    </Box>
  );
}
