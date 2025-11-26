import { VStack, Checkbox, Badge, HStack } from "@chakra-ui/react";
import { useFilterStore, ALL_RELATIONSHIP_TYPES } from "@/store";

export function RelationshipFilter() {
  const { relationshipTypes, toggleRelationshipType } = useFilterStore();

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
