import { RefObject } from "react";
import { VStack, IconButton, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import type { Core } from "cytoscape";

interface GraphControlsProps {
  cyRef: RefObject<Core | null>;
}

export function GraphControls({ cyRef }: GraphControlsProps) {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleZoomIn = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.animate({
        zoom: cy.zoom() * 1.3,
        duration: 200,
      });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.animate({
        zoom: cy.zoom() / 1.3,
        duration: 200,
      });
    }
  };

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

// Simple fit icon component
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
