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
  Button,
  Badge,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useServicesStore, useGraphStore, useNavigationStore } from "@/store";

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
  const { currentEnvironment, availableEnvironments, setCurrentEnvironment } =
    useServicesStore();
  const { reset: resetGraph } = useGraphStore();
  const { reset: resetNavigation } = useNavigationStore();

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
      </MenuList>
    </Menu>
  );
}
