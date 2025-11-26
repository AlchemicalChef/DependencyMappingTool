import {
  Flex,
  HStack,
  IconButton,
  useColorMode,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { SearchBar } from "../navigation/SearchBar";
import { BreadcrumbNav } from "../navigation/BreadcrumbNav";
import { EnvironmentSwitch } from "../navigation/EnvironmentSwitch";

interface ToolbarProps {
  onLoadGraph: (serviceId: string) => void;
}

export function Toolbar({ onLoadGraph }: ToolbarProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Flex
      as="header"
      h="60px"
      px={4}
      align="center"
      justify="space-between"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      flexShrink={0}
    >
      <HStack spacing={4} flex="1">
        <EnvironmentSwitch />
        <BreadcrumbNav onNavigate={onLoadGraph} />
      </HStack>

      <HStack spacing={4}>
        <SearchBar onSelectService={onLoadGraph} />
        <Tooltip label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
          />
        </Tooltip>
      </HStack>
    </Flex>
  );
}
