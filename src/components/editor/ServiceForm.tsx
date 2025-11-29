/**
 * @fileoverview Form component for editing service details.
 *
 * Provides input fields for all service properties including ID, name,
 * type, status, description, metadata, and tags with autocomplete.
 *
 * @module components/editor/ServiceForm
 */

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  IconButton,
  Box,
  Text,
  Button,
  Divider,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState, useCallback } from "react";
import type { Service, ServiceType, ServiceStatus } from "@/types/service";

/**
 * Available service type options for the dropdown.
 */
const SERVICE_TYPES: ServiceType[] = [
  "api",
  "database",
  "cache",
  "queue",
  "gateway",
  "frontend",
  "backend",
  "external",
];

/**
 * Available service status options for the dropdown.
 */
const SERVICE_STATUSES: ServiceStatus[] = [
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
  "deprecated",
];

/**
 * Props for the ServiceForm component.
 *
 * @property service - The service data being edited
 * @property onChange - Callback for field changes
 * @property errors - Map of field validation errors
 * @property isEditMode - Whether editing existing (true) or creating new (false)
 * @property existingTags - Tags from other services for autocomplete suggestions
 */
interface ServiceFormProps {
  service: Partial<Service>;
  onChange: (updates: Partial<Service>) => void;
  errors: Record<string, string>;
  isEditMode: boolean;
  existingTags?: string[];
}

/**
 * Form for creating and editing service definitions.
 *
 * Contains fields for:
 * - **ID**: Unique identifier (disabled in edit mode)
 * - **Name**: Human-readable display name
 * - **Type**: Service category (api, database, etc.)
 * - **Status**: Health status
 * - **Description**: Optional detailed description
 * - **Version/Owner/Team**: Optional metadata fields
 * - **Tags**: Array of searchable tags with autocomplete
 * - **Metadata**: Key-value pairs for custom properties
 *
 * Features:
 * - Tag autocomplete from existing tags in the environment
 * - Dynamic metadata key-value pair management
 * - Real-time validation error display
 *
 * @param props - Component props
 * @returns The service form component
 *
 * @example
 * ```tsx
 * <ServiceForm
 *   service={serviceData}
 *   onChange={(updates) => setService({ ...service, ...updates })}
 *   errors={{ name: 'Name is required' }}
 *   isEditMode={false}
 *   existingTags={['backend', 'critical', 'v2']}
 * />
 * ```
 */
export function ServiceForm({
  service,
  onChange,
  errors,
  isEditMode,
  existingTags = [],
}: ServiceFormProps) {
  const [newTag, setNewTag] = useState("");
  const [newMetaKey, setNewMetaKey] = useState("");
  const [newMetaValue, setNewMetaValue] = useState("");

  /**
   * Adds a new tag to the service.
   * Trims whitespace and prevents duplicate tags.
   */
  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !service.tags?.includes(newTag.trim())) {
      onChange({ tags: [...(service.tags || []), newTag.trim()] });
      setNewTag("");
    }
  }, [newTag, service.tags, onChange]);

  /**
   * Removes a tag from the service by value.
   *
   * @param tagToRemove - The tag string to remove
   */
  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      onChange({ tags: (service.tags || []).filter((t) => t !== tagToRemove) });
    },
    [service.tags, onChange]
  );

  /**
   * Adds a new key-value pair to the service metadata.
   * Clears the input fields after adding.
   */
  const handleAddMetadata = useCallback(() => {
    if (newMetaKey.trim()) {
      const metadata = { ...(service.metadata || {}) };
      metadata[newMetaKey.trim()] = newMetaValue;
      onChange({ metadata });
      setNewMetaKey("");
      setNewMetaValue("");
    }
  }, [newMetaKey, newMetaValue, service.metadata, onChange]);

  /**
   * Removes a metadata entry by key.
   *
   * @param key - The metadata key to remove
   */
  const handleRemoveMetadata = useCallback(
    (key: string) => {
      const metadata = { ...(service.metadata || {}) };
      delete metadata[key];
      onChange({ metadata });
    },
    [service.metadata, onChange]
  );

  const suggestedTags = existingTags.filter(
    (tag) =>
      tag.toLowerCase().includes(newTag.toLowerCase()) &&
      !service.tags?.includes(tag)
  );

  return (
    <VStack spacing={4} align="stretch">
      {/* ID Field */}
      <FormControl isInvalid={!!errors.id} isRequired>
        <FormLabel>Service ID</FormLabel>
        <Input
          value={service.id || ""}
          onChange={(e) => onChange({ id: e.target.value })}
          placeholder="my-service-id"
          isDisabled={isEditMode}
        />
        <FormErrorMessage>{errors.id}</FormErrorMessage>
      </FormControl>

      {/* Name Field */}
      <FormControl isInvalid={!!errors.name} isRequired>
        <FormLabel>Name</FormLabel>
        <Input
          value={service.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="My Service"
        />
        <FormErrorMessage>{errors.name}</FormErrorMessage>
      </FormControl>

      {/* Type and Status Row */}
      <HStack spacing={4}>
        <FormControl isInvalid={!!errors.serviceType} isRequired>
          <FormLabel>Type</FormLabel>
          <Select
            value={service.serviceType || "api"}
            onChange={(e) =>
              onChange({ serviceType: e.target.value as ServiceType })
            }
          >
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.serviceType}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.status} isRequired>
          <FormLabel>Status</FormLabel>
          <Select
            value={service.status || "unknown"}
            onChange={(e) =>
              onChange({ status: e.target.value as ServiceStatus })
            }
          >
            {SERVICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.status}</FormErrorMessage>
        </FormControl>
      </HStack>

      {/* Description */}
      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          value={service.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what this service does..."
          rows={3}
        />
      </FormControl>

      {/* Version, Owner, Team Row */}
      <HStack spacing={4}>
        <FormControl>
          <FormLabel>Version</FormLabel>
          <Input
            value={service.version || ""}
            onChange={(e) => onChange({ version: e.target.value })}
            placeholder="1.0.0"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Owner</FormLabel>
          <Input
            value={service.owner || ""}
            onChange={(e) => onChange({ owner: e.target.value })}
            placeholder="john.doe"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Team</FormLabel>
          <Input
            value={service.team || ""}
            onChange={(e) => onChange({ team: e.target.value })}
            placeholder="Platform Team"
          />
        </FormControl>
      </HStack>

      <Divider />

      {/* Tags */}
      <FormControl>
        <FormLabel>Tags</FormLabel>
        <Wrap spacing={2} mb={2}>
          {(service.tags || []).map((tag) => (
            <WrapItem key={tag}>
              <Tag size="md" colorScheme="blue" borderRadius="full">
                <TagLabel>{tag}</TagLabel>
                <TagCloseButton onClick={() => handleRemoveTag(tag)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
        <HStack>
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            size="sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <IconButton
            aria-label="Add tag"
            icon={<AddIcon />}
            size="sm"
            onClick={handleAddTag}
            isDisabled={!newTag.trim()}
          />
        </HStack>
        {newTag && suggestedTags.length > 0 && (
          <Wrap spacing={1} mt={2}>
            {suggestedTags.slice(0, 5).map((tag) => (
              <WrapItem key={tag}>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    onChange({ tags: [...(service.tags || []), tag] });
                    setNewTag("");
                  }}
                >
                  {tag}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        )}
      </FormControl>

      <Divider />

      {/* Metadata */}
      <FormControl>
        <FormLabel>Metadata</FormLabel>
        <VStack align="stretch" spacing={2}>
          {Object.entries(service.metadata || {}).map(([key, value]) => (
            <HStack key={key}>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {key}
                </Text>
              </Box>
              <Box flex={2}>
                <Text fontSize="sm" color="gray.500">
                  {String(value)}
                </Text>
              </Box>
              <IconButton
                aria-label="Remove metadata"
                icon={<DeleteIcon />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => handleRemoveMetadata(key)}
              />
            </HStack>
          ))}
          <HStack>
            <Input
              value={newMetaKey}
              onChange={(e) => setNewMetaKey(e.target.value)}
              placeholder="Key"
              size="sm"
              flex={1}
            />
            <Input
              value={newMetaValue}
              onChange={(e) => setNewMetaValue(e.target.value)}
              placeholder="Value"
              size="sm"
              flex={2}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMetadata();
                }
              }}
            />
            <IconButton
              aria-label="Add metadata"
              icon={<AddIcon />}
              size="sm"
              onClick={handleAddMetadata}
              isDisabled={!newMetaKey.trim()}
            />
          </HStack>
        </VStack>
      </FormControl>
    </VStack>
  );
}
