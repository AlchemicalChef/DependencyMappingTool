/**
 * @fileoverview Main toolbar component for the application header.
 *
 * Contains navigation controls, search, environment switching, and
 * action buttons. Displays validation status with issue counts.
 *
 * @module components/layout/Toolbar
 */

import {
  Flex,
  HStack,
  IconButton,
  Button,
  Badge,
  useColorMode,
  useColorModeValue,
  Tooltip,
  Box,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon, AddIcon, WarningIcon } from "@chakra-ui/icons";
import { SearchBar } from "../navigation/SearchBar";
import { BreadcrumbNav } from "../navigation/BreadcrumbNav";
import { EnvironmentSwitch } from "../navigation/EnvironmentSwitch";
import { useEditorStore } from "@/store/editorStore";

/**
 * Props for the Toolbar component.
 *
 * @property onLoadGraph - Callback to load graph centered on a service
 */
interface ToolbarProps {
  onLoadGraph: (serviceId: string) => void;
}

/**
 * Main application toolbar in the header area.
 *
 * Contains:
 * - Environment switcher (left)
 * - Breadcrumb navigation (left)
 * - Search bar (right)
 * - Add service button (right)
 * - Validation status badge (right)
 * - Dark mode toggle (right)
 *
 * @param props - Component props
 * @param props.onLoadGraph - Handler for service navigation
 * @returns The toolbar component
 */
export function Toolbar({ onLoadGraph }: ToolbarProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const { openServiceEditor, validation, setValidationPanelOpen } =
    useEditorStore();

  const errorCount = validation.issues.filter(
    (i) => i.severity === "error"
  ).length;
  const warningCount = validation.issues.filter(
    (i) => i.severity === "warning"
  ).length;
  const totalIssues = errorCount + warningCount;

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

      <HStack spacing={2}>
        <SearchBar onSelectService={onLoadGraph} />

        {/* Add Service Button */}
        <Tooltip label="Add new service">
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            size="sm"
            onClick={() => openServiceEditor("create")}
          >
            Service
          </Button>
        </Tooltip>

        {/* Validation Badge */}
        <Tooltip
          label={
            totalIssues > 0
              ? `${errorCount} errors, ${warningCount} warnings`
              : "No validation issues"
          }
        >
          <Box position="relative">
            <IconButton
              aria-label="Validation"
              icon={<WarningIcon />}
              variant={validation.isPanelOpen ? "solid" : "ghost"}
              colorScheme={totalIssues > 0 ? "orange" : "gray"}
              size="md"
              onClick={() => setValidationPanelOpen(!validation.isPanelOpen)}
            />
            {totalIssues > 0 && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                colorScheme="red"
                borderRadius="full"
                fontSize="xs"
                minW="18px"
                textAlign="center"
              >
                {totalIssues}
              </Badge>
            )}
          </Box>
        </Tooltip>

        {/* Color Mode Toggle */}
        <Tooltip
          label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
        >
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
