import {
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import type { Relationship } from "@/types";

interface RelationshipListProps {
  relationships: Relationship[];
  serviceId: string;
  onServiceClick?: (serviceId: string) => void;
}

export function RelationshipList({
  relationships,
  serviceId,
  onServiceClick,
}: RelationshipListProps) {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");

  const getRelationshipColorScheme = (type: string): string => {
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

  const formatLabel = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Group relationships by direction
  const incoming = relationships.filter((r) => r.target === serviceId);
  const outgoing = relationships.filter((r) => r.source === serviceId);

  if (relationships.length === 0) {
    return (
      <Text fontSize="sm" color="gray.500">
        No relationships
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={3}>
      {outgoing.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="medium" mb={2}>
            Outgoing ({outgoing.length})
          </Text>
          <VStack align="stretch" spacing={1}>
            {outgoing.map((rel) => (
              <HStack
                key={rel.id}
                p={2}
                borderRadius="md"
                border="1px"
                borderColor={borderColor}
                cursor={onServiceClick ? "pointer" : "default"}
                _hover={onServiceClick ? { bg: hoverBgColor } : undefined}
                onClick={() => onServiceClick?.(rel.target)}
              >
                <Badge
                  colorScheme={getRelationshipColorScheme(rel.relationshipType)}
                  size="sm"
                >
                  {formatLabel(rel.relationshipType)}
                </Badge>
                <Text fontSize="sm" fontWeight="medium">
                  {rel.target}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {incoming.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="medium" mb={2}>
            Incoming ({incoming.length})
          </Text>
          <VStack align="stretch" spacing={1}>
            {incoming.map((rel) => (
              <HStack
                key={rel.id}
                p={2}
                borderRadius="md"
                border="1px"
                borderColor={borderColor}
                cursor={onServiceClick ? "pointer" : "default"}
                _hover={onServiceClick ? { bg: hoverBgColor } : undefined}
                onClick={() => onServiceClick?.(rel.source)}
              >
                <Text fontSize="sm" fontWeight="medium">
                  {rel.source}
                </Text>
                <Badge
                  colorScheme={getRelationshipColorScheme(rel.relationshipType)}
                  size="sm"
                >
                  {formatLabel(rel.relationshipType)}
                </Badge>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
