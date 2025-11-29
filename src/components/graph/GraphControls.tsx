/**
 * @fileoverview Graph zoom and pan control buttons.
 *
 * Provides a floating control panel for interacting with the Cytoscape
 * graph visualization, including zoom in/out and fit-to-view actions.
 *
 * @module components/graph/GraphControls
 */

import { RefObject } from "react";
import { VStack, IconButton, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import type { Core } from "cytoscape";

/**
 * Props for the GraphControls component.
 *
 * @property cyRef - React ref to the Cytoscape instance
 */
interface GraphControlsProps {
  cyRef: RefObject<Core | null>;
}

/**
 * Floating control panel for graph navigation.
 *
 * Renders a vertical stack of icon buttons positioned in the bottom-right
 * corner of the graph container. Provides:
 * - **Zoom In**: Increases zoom level by 30%
 * - **Zoom Out**: Decreases zoom level by 30%
 * - **Fit to View**: Adjusts viewport to show all elements with padding
 *
 * All zoom operations are animated for smooth transitions.
 *
 * @param props - Component props
 * @param props.cyRef - Reference to the Cytoscape core instance
 * @returns The floating control panel component
 *
 * @example
 * ```tsx
 * const cyRef = useRef<Core | null>(null);
 * <GraphControls cyRef={cyRef} />
 * ```
 */
export function GraphControls({ cyRef }: GraphControlsProps) {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  /**
   * Increases the graph zoom level by 30%.
   * Animates the transition over 200ms for smooth visual feedback.
   */
  const handleZoomIn = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.animate({
        zoom: cy.zoom() * 1.3,
        duration: 200,
      });
    }
  };

  /**
   * Decreases the graph zoom level by 30%.
   * Animates the transition over 200ms for smooth visual feedback.
   */
  const handleZoomOut = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.animate({
        zoom: cy.zoom() / 1.3,
        duration: 200,
      });
    }
  };

  /**
   * Fits all graph elements within the viewport.
   * Adds 50px padding around the elements and animates over 300ms.
   */
  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.animate({
        fit: { eles: cyRef.current.elements(), padding: 50 },
        duration: 300,
      });
    }
  };

  return (
    <VStack
      position="absolute"
      bottom={4}
      right={4}
      spacing={2}
      bg={bgColor}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
      p={2}
      shadow="md"
    >
      <Tooltip label="Zoom in" placement="left">
        <IconButton
          aria-label="Zoom in"
          icon={<AddIcon />}
          size="sm"
          variant="ghost"
          onClick={handleZoomIn}
        />
      </Tooltip>
      <Tooltip label="Zoom out" placement="left">
        <IconButton
          aria-label="Zoom out"
          icon={<MinusIcon />}
          size="sm"
          variant="ghost"
          onClick={handleZoomOut}
        />
      </Tooltip>
      <Tooltip label="Fit to view" placement="left">
        <IconButton
          aria-label="Fit to view"
          icon={<FitIcon />}
          size="sm"
          variant="ghost"
          onClick={handleFit}
        />
      </Tooltip>
    </VStack>
  );
}

/**
 * Custom SVG icon representing a fit-to-view action.
 *
 * Renders corner brackets that visually suggest expanding content
 * to fill the available viewport.
 *
 * @returns An SVG element displaying corner bracket shapes
 */
function FitIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
