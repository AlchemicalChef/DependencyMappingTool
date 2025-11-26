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

export function EnvironmentSwitch() {
  const { currentEnvironment, availableEnvironments, setCurrentEnvironment } =
    useServicesStore();
  const { reset: resetGraph } = useGraphStore();
  const { reset: resetNavigation } = useNavigationStore();

  const bgColor = useColorModeValue("white", "gray.700");

  const handleEnvironmentChange = (env: string) => {
    if (env !== currentEnvironment) {
      // Reset state when changing environments
      resetGraph();
      resetNavigation();
      setCurrentEnvironment(env);
    }
  };

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
