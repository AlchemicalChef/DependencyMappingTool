/**
 * @fileoverview Environment switcher dropdown component.
 *
 * Allows users to switch between different deployment environments
 * (dev, staging, prod) with visual color coding for each environment.
 *
 * @module components/navigation/EnvironmentSwitch
 */

import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Badge,
  HStack,
  Text,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  useToast,
} from "@chakra-ui/react";
import { ChevronDownIcon, AddIcon } from "@chakra-ui/icons";
import { useState, useCallback } from "react";
import { useServicesStore, useGraphStore, useNavigationStore } from "@/store";
import { createEnvironment, listEnvironments } from "@/services/tauri";

/**
 * Dropdown for switching between deployment environments.
 *
 * Displays a button showing the current environment with a color-coded
 * badge. When clicked, shows a dropdown menu of all available environments.
 *
 * Color coding:
 * - **Green**: dev, development
 * - **Yellow**: staging, stage
 * - **Red**: prod, production
 * - **Gray**: other/unknown
 *
 * When switching environments:
 * 1. Resets the graph state
 * 2. Resets navigation history
 * 3. Updates the current environment
 *
 * @returns The environment switcher dropdown
 *
 * @example
 * ```tsx
 * <EnvironmentSwitch />
 * ```
 */
export function EnvironmentSwitch() {
  const { currentEnvironment, availableEnvironments, setCurrentEnvironment, setAvailableEnvironments } =
    useServicesStore();
  const { reset: resetGraph } = useGraphStore();
  const { reset: resetNavigation } = useNavigationStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newEnvName, setNewEnvName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.700");

  /**
   * Handles environment selection from the dropdown menu.
   * Resets all state before switching to ensure a clean slate.
   *
   * @param env - The environment name to switch to
   */
  const handleEnvironmentChange = (env: string) => {
    if (env !== currentEnvironment) {
      // Reset state when changing environments
      resetGraph();
      resetNavigation();
      setCurrentEnvironment(env);
    }
  };

  /**
   * Maps environment names to Chakra UI color schemes.
   * Uses semantic colors: green for dev (safe), yellow for staging (caution),
   * red for production (danger).
   *
   * @param env - The environment name
   * @returns A Chakra UI color scheme name
   */
  const getEnvColorScheme = (env: string): string => {
    switch (env.toLowerCase()) {
      case "dev":
      case "development":
        return "green";
      case "staging":
      case "stage":
        return "yellow";
      case "prod":
      case "production":
        return "red";
      default:
        return "gray";
    }
  };

  /**
   * Converts short environment names to display-friendly versions.
   *
   * @param env - The environment name (e.g., "dev", "prod")
   * @returns The full display name (e.g., "Development", "Production")
   */
  const getEnvDisplayName = (env: string): string => {
    const names: Record<string, string> = {
      dev: "Development",
      development: "Development",
      staging: "Staging",
      stage: "Staging",
      prod: "Production",
      production: "Production",
    };
    return names[env.toLowerCase()] || env;
  };

  /**
   * Handles closing the create environment modal.
   * Resets form state.
   */
  const handleCloseModal = useCallback(() => {
    setNewEnvName("");
    setError("");
    onClose();
  }, [onClose]);

  /**
   * Validates the environment name.
   *
   * @param name - The environment name to validate
   * @returns Error message if invalid, empty string if valid
   */
  const validateEnvName = (name: string): string => {
    if (!name.trim()) {
      return "Environment name is required";
    }
    if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(name)) {
      return "Name must start with a letter and contain only letters, numbers, hyphens, and underscores";
    }
    if (availableEnvironments.includes(name.toLowerCase())) {
      return "Environment already exists";
    }
    return "";
  };

  /**
   * Handles creating a new environment.
   * Creates the environment, refreshes the list, and switches to it.
   */
  const handleCreateEnvironment = useCallback(async () => {
    const validationError = validateEnvName(newEnvName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await createEnvironment(newEnvName.toLowerCase());
      const environments = await listEnvironments();
      setAvailableEnvironments(environments);

      // Switch to the new environment
      resetGraph();
      resetNavigation();
      setCurrentEnvironment(newEnvName.toLowerCase());

      toast({
        title: "Environment created",
        description: `Successfully created "${newEnvName}" environment`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      handleCloseModal();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsCreating(false);
    }
  }, [newEnvName, setAvailableEnvironments, resetGraph, resetNavigation, setCurrentEnvironment, toast, handleCloseModal]);

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="outline"
        size="sm"
        bg={bgColor}
      >
        <HStack spacing={2}>
          <Badge colorScheme={getEnvColorScheme(currentEnvironment)}>
            {currentEnvironment.toUpperCase()}
          </Badge>
          <Text display={{ base: "none", md: "inline" }}>
            {getEnvDisplayName(currentEnvironment)}
          </Text>
        </HStack>
      </MenuButton>
      <MenuList>
        {availableEnvironments.map((env) => (
          <MenuItem
            key={env}
            onClick={() => handleEnvironmentChange(env)}
            bg={env === currentEnvironment ? "blue.50" : undefined}
            _dark={{
              bg: env === currentEnvironment ? "blue.900" : undefined,
            }}
          >
            <HStack spacing={2}>
              <Badge colorScheme={getEnvColorScheme(env)}>{env.toUpperCase()}</Badge>
              <Text>{getEnvDisplayName(env)}</Text>
            </HStack>
          </MenuItem>
        ))}
        <MenuDivider />
        <MenuItem icon={<AddIcon />} onClick={onOpen}>
          Create New Environment
        </MenuItem>
      </MenuList>

      {/* Create Environment Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Environment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isInvalid={!!error}>
              <FormLabel>Environment Name</FormLabel>
              <Input
                placeholder="e.g., staging, production, feature-branch"
                value={newEnvName}
                onChange={(e) => {
                  setNewEnvName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateEnvironment();
                  }
                }}
              />
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateEnvironment}
              isLoading={isCreating}
              isDisabled={!newEnvName.trim()}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Menu>
  );
}
