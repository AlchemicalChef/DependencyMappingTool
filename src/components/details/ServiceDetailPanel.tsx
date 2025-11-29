/**
 * @fileoverview Service detail panel component.
 *
 * Displays detailed information about the currently selected or center
 * service in a collapsible panel. Provides quick actions for editing,
 * adding relationships, and deleting services.
 *
 * @module components/details/ServiceDetailPanel
 */

import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Divider,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  useColorModeValue,
  IconButton,
  Collapse,
  ButtonGroup,
  Tooltip,
} from "@chakra-ui/react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EditIcon,
  DeleteIcon,
  LinkIcon,
} from "@chakra-ui/icons";
import { useState } from "react";
import { useGraphStore, useServicesStore } from "@/store";
import { useEditorStore } from "@/store/editorStore";

/**
 * Collapsible panel displaying service details.
 *
 * Shows information about either:
 * 1. The currently selected node in the graph, OR
 * 2. The center service if no node is selected
 *
 * Displays:
 * - Service name, type, and status
 * - Description
 * - Version, owner, and team
 * - Tags
 * - Custom metadata
 *
 * Provides action buttons for:
 * - Editing the service
 * - Creating a relationship from this service
 * - Deleting the service
 *
 * @returns The service detail panel component
 */
export function ServiceDetailPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { selectedNodeId, centerService } = useGraphStore();
  const { services } = useServicesStore();
  const {
    openServiceEditor,
    openRelationshipEditor,
    openDeleteConfirmation,
  } = useEditorStore();

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.500", "gray.400");

  // Show selected service or center service
  const serviceId = selectedNodeId || centerService?.id;
  const service = serviceId ? services.get(serviceId) || centerService : null;

  if (!service) {
    return null;
  }

  const getStatusColorScheme = (status: string): string => {
    const schemes: Record<string, string> = {
      healthy: "green",
      degraded: "yellow",
      unhealthy: "red",
      unknown: "gray",
      deprecated: "gray",
    };
    return schemes[status] || "gray";
  };

  const getTypeColorScheme = (type: string): string => {
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

  return (
    <Box
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      maxH={isExpanded ? "50%" : "40px"}
      overflow="hidden"
      transition="max-height 0.2s ease"
    >
      <HStack
        px={4}
        py={2}
        justify="space-between"
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
      >
        <Heading size="xs">{selectedNodeId ? "Selected" : "Center"} Service</Heading>
        <IconButton
          aria-label={isExpanded ? "Collapse" : "Expand"}
          icon={isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          size="xs"
          variant="ghost"
        />
      </HStack>

      <Collapse in={isExpanded}>
        <Box px={4} pb={4} overflow="auto" maxH="calc(50vh - 40px)">
          <VStack align="stretch" spacing={3}>
            <Box>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    {service.name}
                  </Text>
                  <HStack spacing={2} mt={1}>
                    <Badge colorScheme={getTypeColorScheme(service.serviceType)}>
                      {service.serviceType}
                    </Badge>
                    <Badge colorScheme={getStatusColorScheme(service.status)}>
                      {service.status}
                    </Badge>
                  </HStack>
                </Box>
                <ButtonGroup size="xs" spacing={1}>
                  <Tooltip label="Edit service">
                    <IconButton
                      aria-label="Edit service"
                      icon={<EditIcon />}
                      variant="ghost"
                      onClick={() => openServiceEditor("edit", service)}
                    />
                  </Tooltip>
                  <Tooltip label="Add relationship">
                    <IconButton
                      aria-label="Add relationship"
                      icon={<LinkIcon />}
                      variant="ghost"
                      onClick={() =>
                        openRelationshipEditor("create", undefined, service.id)
                      }
                    />
                  </Tooltip>
                  <Tooltip label="Delete service">
                    <IconButton
                      aria-label="Delete service"
                      icon={<DeleteIcon />}
                      variant="ghost"
                      colorScheme="red"
                      onClick={() =>
                        openDeleteConfirmation("service", service.id, service.name)
                      }
                    />
                  </Tooltip>
                </ButtonGroup>
              </HStack>
            </Box>

            {service.description && (
              <Box>
                <Text fontSize="xs" color={labelColor} textTransform="uppercase">
                  Description
                </Text>
                <Text fontSize="sm">{service.description}</Text>
              </Box>
            )}

            <Divider />

            <HStack spacing={4}>
              {service.version && (
                <Box>
                  <Text fontSize="xs" color={labelColor} textTransform="uppercase">
                    Version
                  </Text>
                  <Text fontSize="sm">{service.version}</Text>
                </Box>
              )}
              {service.owner && (
                <Box>
                  <Text fontSize="xs" color={labelColor} textTransform="uppercase">
                    Owner
                  </Text>
                  <Text fontSize="sm">{service.owner}</Text>
                </Box>
              )}
            </HStack>

            {service.team && (
              <Box>
                <Text fontSize="xs" color={labelColor} textTransform="uppercase">
                  Team
                </Text>
                <Text fontSize="sm">{service.team}</Text>
              </Box>
            )}

            {service.tags.length > 0 && (
              <Box>
                <Text fontSize="xs" color={labelColor} textTransform="uppercase" mb={1}>
                  Tags
                </Text>
                <Wrap spacing={1}>
                  {service.tags.map((tag) => (
                    <WrapItem key={tag}>
                      <Tag size="sm" variant="subtle" colorScheme="blue">
                        <TagLabel>{tag}</TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            {Object.keys(service.metadata).length > 0 && (
              <Box>
                <Text fontSize="xs" color={labelColor} textTransform="uppercase" mb={1}>
                  Metadata
                </Text>
                <VStack align="stretch" spacing={1}>
                  {Object.entries(service.metadata).map(([key, value]) => (
                    <HStack key={key} justify="space-between">
                      <Text fontSize="xs" color={labelColor}>
                        {key}
                      </Text>
                      <Text fontSize="xs" fontFamily="mono">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}
