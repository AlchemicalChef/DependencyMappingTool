import { Box, Flex } from "@chakra-ui/react";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { DependencyGraph } from "../graph/DependencyGraph";

interface AppLayoutProps {
  onNodeClick: (serviceId: string) => void;
  onLoadGraph: (serviceId: string) => void;
}

export function AppLayout({ onNodeClick, onLoadGraph }: AppLayoutProps) {
  return (
    <Flex direction="column" h="100%" w="100%">
      <Toolbar onLoadGraph={onLoadGraph} />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Box flex="1" position="relative" overflow="hidden">
          <DependencyGraph onNodeClick={onNodeClick} />
        </Box>
      </Flex>
    </Flex>
  );
}
