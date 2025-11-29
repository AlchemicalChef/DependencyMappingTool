/**
 * @fileoverview Main application layout component.
 *
 * Provides the overall page structure with a header toolbar, sidebar
 * for filters and details, and main content area for the graph.
 *
 * @module components/layout/AppLayout
 */

import { Box, Flex } from "@chakra-ui/react";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { DependencyGraph } from "../graph/DependencyGraph";

/**
 * Props for the AppLayout component.
 *
 * @property onNodeClick - Callback when a graph node is clicked
 * @property onLoadGraph - Callback to load graph centered on a service
 */
interface AppLayoutProps {
  onNodeClick: (serviceId: string) => void;
  onLoadGraph: (serviceId: string) => void;
}

/**
 * Main application layout container.
 *
 * Organizes the UI into three main sections:
 * - **Toolbar** (top): Navigation, search, and action buttons
 * - **Sidebar** (left): Filter controls and service details
 * - **Main Area** (center): Interactive dependency graph
 *
 * Uses flexbox layout to ensure proper sizing and overflow handling.
 *
 * @param props - Component props
 * @param props.onNodeClick - Handler for graph node click events
 * @param props.onLoadGraph - Handler for loading a new graph view
 * @returns The main application layout structure
 *
 * @example
 * ```tsx
 * <AppLayout
 *   onNodeClick={(id) => console.log('Clicked:', id)}
 *   onLoadGraph={(id) => loadGraphForService(id)}
 * />
 * ```
 */
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
