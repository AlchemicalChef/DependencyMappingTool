import {
  Box,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FilterPanel } from "../filters/FilterPanel";
import { ServiceDetailPanel } from "../details/ServiceDetailPanel";

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
