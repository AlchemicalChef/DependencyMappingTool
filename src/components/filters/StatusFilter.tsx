import { VStack, Checkbox, Badge, HStack } from "@chakra-ui/react";
import { useFilterStore, ALL_STATUSES } from "@/store";

export function StatusFilter() {
  const { statuses, toggleStatus } = useFilterStore();

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
