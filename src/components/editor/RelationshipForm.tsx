/**
 * @fileoverview Form component for editing relationship details.
 *
 * Provides dropdowns for selecting source/target services and relationship
 * type, with a visual preview of the connection being created.
 *
 * @module components/editor/RelationshipForm
 */

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Textarea,
  VStack,
  Box,
  Text,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import type { Relationship, RelationshipType } from "@/types/relationship";
import type { Service } from "@/types/service";
import { RELATIONSHIP_COLORS } from "@/styles/cytoscape-theme";

/**
 * Available relationship type options with display labels.
 */
const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: "depends_on", label: "Depends On" },
  { value: "communicates_with", label: "Communicates With" },
  { value: "authenticates_via", label: "Authenticates Via" },
  { value: "reads_from", label: "Reads From" },
  { value: "writes_to", label: "Writes To" },
  { value: "publishes", label: "Publishes To" },
  { value: "subscribes", label: "Subscribes To" },
];

/**
 * Props for the RelationshipForm component.
 *
 * @property relationship - The relationship data being edited
 * @property onChange - Callback for field changes
 * @property errors - Map of field validation errors
 * @property isEditMode - Whether editing existing (true) or creating new (false)
 * @property services - Array of available services for source/target selection
 */
interface RelationshipFormProps {
  relationship: Partial<Relationship>;
  onChange: (updates: Partial<Relationship>) => void;
  errors: Record<string, string>;
  isEditMode: boolean;
  services: Service[];
}

/**
 * Form for creating and editing relationships between services.
 *
 * Contains fields for:
 * - **Visual Preview**: Shows the connection being created/edited
 * - **Source Service**: Dropdown of available services
 * - **Target Service**: Dropdown of available services (excludes source)
 * - **Relationship Type**: Type of dependency/connection
 * - **Description**: Optional description of the relationship
 *
 * Features:
 * - Live visual preview of the relationship
 * - Source/target dropdowns filter to prevent self-loops
 * - Color-coded preview based on relationship type
 * - Disabled source/target in edit mode (can only change type)
 *
 * @param props - Component props
 * @returns The relationship form component
 *
 * @example
 * ```tsx
 * <RelationshipForm
 *   relationship={{ source: 'api-1', target: '', relationshipType: 'depends_on' }}
 *   onChange={(updates) => setRelationship({ ...rel, ...updates })}
 *   errors={{}}
 *   isEditMode={false}
 *   services={allServices}
 * />
 * ```
 */
export function RelationshipForm({
  relationship,
  onChange,
  errors,
  isEditMode,
  services,
}: RelationshipFormProps) {
  const sourceService = services.find((s) => s.id === relationship.source);
  const targetService = services.find((s) => s.id === relationship.target);

  const relationshipColor =
    RELATIONSHIP_COLORS[
      relationship.relationshipType as keyof typeof RELATIONSHIP_COLORS
    ] || "#666";

  return (
    <VStack spacing={4} align="stretch">
      {/* Visual Preview */}
      <Box
        p={4}
        bg="gray.50"
        _dark={{ bg: "gray.700" }}
        borderRadius="md"
        textAlign="center"
      >
        <HStack justify="center" spacing={4}>
          <Box
            p={2}
            borderRadius="md"
            bg={sourceService ? "blue.100" : "gray.200"}
            _dark={{ bg: sourceService ? "blue.800" : "gray.600" }}
            minW="100px"
          >
            <Text fontWeight="medium" fontSize="sm">
              {sourceService?.name || "Select source..."}
            </Text>
          </Box>
          <VStack spacing={0}>
            <ArrowForwardIcon color={relationshipColor} boxSize={6} />
            <Badge
              colorScheme={
                relationship.relationshipType === "depends_on"
                  ? "purple"
                  : relationship.relationshipType === "communicates_with"
                    ? "blue"
                    : "gray"
              }
              fontSize="xs"
            >
              {relationship.relationshipType || "..."}
            </Badge>
          </VStack>
          <Box
            p={2}
            borderRadius="md"
            bg={targetService ? "green.100" : "gray.200"}
            _dark={{ bg: targetService ? "green.800" : "gray.600" }}
            minW="100px"
          >
            <Text fontWeight="medium" fontSize="sm">
              {targetService?.name || "Select target..."}
            </Text>
          </Box>
        </HStack>
      </Box>

      {/* Source Service */}
      <FormControl isInvalid={!!errors.source} isRequired>
        <FormLabel>Source Service</FormLabel>
        <Select
          value={relationship.source || ""}
          onChange={(e) => onChange({ source: e.target.value })}
          placeholder="Select source service..."
          isDisabled={isEditMode}
        >
          {services
            .filter((s) => s.id !== relationship.target)
            .map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.id})
              </option>
            ))}
        </Select>
        <FormErrorMessage>{errors.source}</FormErrorMessage>
      </FormControl>

      {/* Target Service */}
      <FormControl isInvalid={!!errors.target} isRequired>
        <FormLabel>Target Service</FormLabel>
        <Select
          value={relationship.target || ""}
          onChange={(e) => onChange({ target: e.target.value })}
          placeholder="Select target service..."
          isDisabled={isEditMode}
        >
          {services
            .filter((s) => s.id !== relationship.source)
            .map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.id})
              </option>
            ))}
        </Select>
        <FormErrorMessage>{errors.target}</FormErrorMessage>
      </FormControl>

      {/* Relationship Type */}
      <FormControl isInvalid={!!errors.relationshipType} isRequired>
        <FormLabel>Relationship Type</FormLabel>
        <Select
          value={relationship.relationshipType || "depends_on"}
          onChange={(e) =>
            onChange({ relationshipType: e.target.value as RelationshipType })
          }
        >
          {RELATIONSHIP_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
        <FormErrorMessage>{errors.relationshipType}</FormErrorMessage>
      </FormControl>

      {/* Description */}
      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          value={relationship.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe this relationship..."
          rows={2}
        />
      </FormControl>

      {/* Duplicate Warning */}
      {relationship.source && relationship.target && !isEditMode && (
        <Box>
          {services.length > 0 && (
            <Text fontSize="sm" color="gray.500">
              This will create a relationship from{" "}
              <Text as="span" fontWeight="medium">
                {sourceService?.name || relationship.source}
              </Text>{" "}
              to{" "}
              <Text as="span" fontWeight="medium">
                {targetService?.name || relationship.target}
              </Text>
              .
            </Text>
          )}
        </Box>
      )}
    </VStack>
  );
}
