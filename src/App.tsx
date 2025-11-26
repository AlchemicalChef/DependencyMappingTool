import { useEffect, useCallback } from "react";
import { Box, useToast } from "@chakra-ui/react";
import { AppLayout } from "./components/layout/AppLayout";
import { useServicesStore, useGraphStore, useNavigationStore } from "./store";
import * as api from "./services/tauri";
import { transformToGraphElements } from "./services/graphTransforms";

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

        const elements = transformToGraphElements(graphData, serviceId);
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
    </Box>
  );
}

export default App;
