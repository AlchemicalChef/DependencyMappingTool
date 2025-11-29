/**
 * @fileoverview Main application component for the Dependency Mapping Tool.
 *
 * This is the root component that orchestrates the application's initialization,
 * data loading, and rendering. It manages:
 * - Initial loading of environments and services
 * - Graph data loading and navigation
 * - Rendering the main layout and modal components
 *
 * @module App
 */

import { useEffect, useCallback } from "react";
import { Box, useToast } from "@chakra-ui/react";
import { AppLayout } from "./components/layout/AppLayout";
import {
  ServiceEditorModal,
  RelationshipEditorModal,
  DeleteConfirmationModal,
} from "./components/editor";
import { ValidationPanel } from "./components/validation";
import { useServicesStore, useGraphStore, useNavigationStore } from "./store";
import * as api from "./services/tauri"
import { transformToGraphElements } from "./services/graphTransforms";

/**
 * Root application component.
 *
 * Handles initialization of the application state by:
 * 1. Loading available environments from the backend
 * 2. Loading services for the current environment
 * 3. Loading the initial graph centered on the first service
 *
 * Also provides callbacks for graph navigation (clicking nodes to recenter).
 *
 * @returns The complete application UI
 */
function App() {
  const toast = useToast();
  const {
    currentEnvironment,
    setServices,
    setAvailableEnvironments,
    setLoading: setServicesLoading,
    setError: setServicesError,
  } = useServicesStore();

  const {
    setElements,
    setCenterNode,
    setLoading: setGraphLoading,
    setError: setGraphError,
  } = useGraphStore();

  const { push: pushNavigation } = useNavigationStore();

  // Initialize app - load environments and services
  useEffect(() => {
    const init = async () => {
      try {
        setServicesLoading(true);

        // Load available environments
        const envs = await api.listEnvironments();
        setAvailableEnvironments(envs.length > 0 ? envs : ["dev"]);

        // Load services for current environment
        const services = await api.getAllServices(currentEnvironment);
        setServices(services);

        // If we have services, load graph for the first one
        if (services.length > 0) {
          await loadGraph(services[0].id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to initialize";
        setServicesError(message);
        toast({
          title: "Initialization Error",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setServicesLoading(false);
      }
    };

    init();
  }, [currentEnvironment]);

  // Load graph centered on a service
  const loadGraph = useCallback(
    async (serviceId: string) => {
      try {
        setGraphLoading(true);

        const graphData = await api.getServiceGraph(
          currentEnvironment,
          serviceId,
          1
        );

        const elements = transformToGraphElements(graphData);
        setElements(elements);
        setCenterNode(serviceId, graphData.centerService);
        pushNavigation(serviceId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load graph";
        setGraphError(message);
        toast({
          title: "Graph Error",
          description: message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setGraphLoading(false);
      }
    },
    [currentEnvironment]
  );

  // Handle node click - recenter graph
  const handleNodeClick = useCallback(
    (serviceId: string) => {
      loadGraph(serviceId);
    },
    [loadGraph]
  );

  return (
    <Box h="100vh" w="100vw" overflow="hidden">
      <AppLayout onNodeClick={handleNodeClick} onLoadGraph={loadGraph} />

      {/* Editor Modals */}
      <ServiceEditorModal />
      <RelationshipEditorModal />
      <DeleteConfirmationModal />

      {/* Validation Panel */}
      <ValidationPanel />
    </Box>
  );
}

export default App;
