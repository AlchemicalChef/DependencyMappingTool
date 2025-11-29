/**
 * @fileoverview Main filter panel container component.
 *
 * Organizes all filter controls in an accordion layout with
 * collapsible sections for service type, status, and relationship filters.
 *
 * @module components/filters/FilterPanel
 */

import {
  VStack,
  Heading,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { useFilterStore } from "@/store";
import { ServiceTypeFilter } from "./ServiceTypeFilter";
import { StatusFilter } from "./StatusFilter";
import { RelationshipFilter } from "./RelationshipFilter";

/**
 * Accordion-based filter panel for graph filtering.
 *
 * Contains three collapsible filter sections:
 * 1. **Service Type**: Filter nodes by type (api, database, etc.)
 * 2. **Status**: Filter nodes by health status
 * 3. **Relationship Type**: Filter edges by dependency type
 *
 * Shows a "Clear all" button when any filters are active.
 * All sections are expanded by default.
 *
 * @returns The filter panel component
 *
 * @example
 * ```tsx
 * <FilterPanel />
 * ```
 */
export function FilterPanel() {
  const { clearFilters, hasActiveFilters } = useFilterStore();
  const headingColor = useColorModeValue("gray.700", "gray.200");

  return (
    <VStack spacing={4} align="stretch">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="sm" color={headingColor}>
          Filters
        </Heading>
        {hasActiveFilters() && (
          <Button size="xs" variant="ghost" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </Box>

      <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
        <AccordionItem border="none">
          <AccordionButton px={0}>
            <Box flex="1" textAlign="left" fontWeight="medium" fontSize="sm">
              Service Type
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0} pb={4}>
            <ServiceTypeFilter />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem border="none">
          <AccordionButton px={0}>
            <Box flex="1" textAlign="left" fontWeight="medium" fontSize="sm">
              Status
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0} pb={4}>
            <StatusFilter />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem border="none">
          <AccordionButton px={0}>
            <Box flex="1" textAlign="left" fontWeight="medium" fontSize="sm">
              Relationship Type
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0} pb={4}>
            <RelationshipFilter />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </VStack>
  );
}
