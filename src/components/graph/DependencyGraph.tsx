import { useRef, useCallback, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape, { Core, NodeSingular } from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import {
  Box,
  Center,
  Spinner,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { useGraphStore, useFilterStore } from "@/store";
import { getCytoscapeStylesheet } from "@/styles/cytoscape-theme";
import { GraphControls } from "./GraphControls";

// Register layout extension
cytoscape.use(coseBilkent);

interface DependencyGraphProps {
  onNodeClick: (serviceId: string) => void;
}

export function DependencyGraph({ onNodeClick }: DependencyGraphProps) {
  const cyRef = useRef<Core | null>(null);
  const { colorMode } = useColorMode();
  const bgColor = useColorModeValue("gray.50", "gray.900");

  const {
    elements,
    centerNodeId,
    isLoading,
    error,
    setSelectedNode,
  } = useGraphStore();

  const { serviceTypes, statuses, relationshipTypes } = useFilterStore();

  // Handle Cytoscape reference
  const handleCyRef = useCallback(
    (cy: Core) => {
      cyRef.current = cy;

      // Remove existing listeners
      cy.removeAllListeners();

      // Node click handler - recenter on clicked node
      cy.on("tap", "node", (event) => {
        const node = event.target as NodeSingular;
        const serviceId = node.data("id");

        // Double-click to recenter (or single click if not center node)
        if (!node.hasClass("center")) {
          onNodeClick(serviceId);
        }
      });

      // Node selection
      cy.on("select", "node", (event) => {
        const node = event.target as NodeSingular;
        setSelectedNode(node.data("id"));
      });

      // Node deselection
      cy.on("unselect", "node", () => {
        setSelectedNode(null);
      });

      // Click on background to deselect
      cy.on("tap", (event) => {
        if (event.target === cy) {
          cy.nodes().unselect();
          setSelectedNode(null);
        }
      });
    },
    [onNodeClick, setSelectedNode]
  );

  // Run layout when elements change
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      const cy = cyRef.current;

      // Apply layout
      cy.layout({
        name: "cose-bilkent",
        animate: true,
        animationDuration: 500,
        nodeRepulsion: 4500,
        idealEdgeLength: 120,
        edgeElasticity: 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        tile: true,
        fit: true,
        padding: 50,
      } as cytoscape.LayoutOptions).run();
    }
  }, [elements]);

  // Highlight center node when it changes
  useEffect(() => {
    if (cyRef.current && centerNodeId) {
      const cy = cyRef.current;

      // Remove center class from all nodes
      cy.nodes().removeClass("center");

      // Add center class to center node
      const centerNode = cy.$(`#${centerNodeId}`);
      if (centerNode.length > 0) {
        centerNode.addClass("center");

        // Center viewport on the center node with animation
        setTimeout(() => {
          cy.animate({
            center: { eles: centerNode },
            duration: 300,
          });
        }, 600); // Wait for layout to finish
      }
    }
  }, [centerNodeId, elements]);

  // Apply filters
  useEffect(() => {
    if (cyRef.current) {
      const cy = cyRef.current;

      // Show all elements first
      cy.elements().style("display", "element");

      // Filter nodes by service type
      cy.nodes().forEach((node) => {
        const type = node.data("serviceType");
        if (!serviceTypes.includes(type)) {
          node.style("display", "none");
        }
      });

      // Filter nodes by status
      cy.nodes().forEach((node) => {
        const status = node.data("status");
        if (!statuses.includes(status)) {
          node.style("display", "none");
        }
      });

      // Filter edges by relationship type
      cy.edges().forEach((edge) => {
        const type = edge.data("relationshipType");
        if (!relationshipTypes.includes(type)) {
          edge.style("display", "none");
        }
      });

      // Hide edges connected to hidden nodes
      cy.edges().forEach((edge) => {
        const source = edge.source();
        const target = edge.target();
        const sourceHidden = source.style("display") === "none";
        const targetHidden = target.style("display") === "none";
        if (sourceHidden || targetHidden) {
          edge.style("display", "none");
        }
      });
    }
  }, [serviceTypes, statuses, relationshipTypes, elements]);

  if (isLoading) {
    return (
      <Center h="100%" bg={bgColor}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100%" bg={bgColor}>
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }

  if (elements.length === 0) {
    return (
      <Center h="100%" bg={bgColor}>
        <Text color="gray.500">
          No services found. Add services to the data directory to get started.
        </Text>
      </Center>
    );
  }

  return (
    <Box position="relative" w="100%" h="100%" bg={bgColor}>
      <CytoscapeComponent
        elements={elements}
        stylesheet={getCytoscapeStylesheet(colorMode === "dark")}
        cy={handleCyRef}
        style={{ width: "100%", height: "100%" }}
        minZoom={0.2}
        maxZoom={3}
        boxSelectionEnabled={false}
        autounselectify={false}
        wheelSensitivity={0.3}
      />
      <GraphControls cyRef={cyRef} />
    </Box>
  );
}
