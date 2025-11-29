/**
 * @fileoverview Validation panel component for data integrity checking.
 *
 * Displays validation results for the current environment, showing
 * errors, warnings, and informational messages in a floating panel.
 * Supports clicking issues to highlight affected nodes in the graph.
 *
 * @module components/validation/ValidationPanel
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from "@chakra-ui/react";
import { RepeatIcon, WarningIcon, InfoIcon } from "@chakra-ui/icons";
import { useCallback, useEffect } from "react";
import { useEditorStore, ValidationIssue } from "@/store/editorStore";
import { useServicesStore } from "@/store/servicesStore";
import { useGraphStore } from "@/store/graphStore";
import { validateEnvironment } from "@/services/tauri";

/**
 * Color schemes for each severity level.
 */
const severityColors = {
  error: "red",
  warning: "orange",
  info: "blue",
};

/**
 * Icon components for each severity level.
 */
const severityIcons = {
  error: WarningIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

/**
 * Props for the ValidationIssueItem component.
 *
 * @property issue - The validation issue to display
 * @property onHighlight - Callback to highlight affected nodes
 */
interface ValidationIssueItemProps {
  issue: ValidationIssue;
  onHighlight: (ids: string[]) => void;
}

/**
 * Individual validation issue card component.
 *
 * Displays a single validation issue with:
 * - Severity icon and colored left border
 * - Issue type badge
 * - Description message
 * - Optional suggestion for fixing
 * - List of affected service/relationship IDs
 *
 * Clicking the card highlights affected nodes in the graph.
 *
 * @param props - Component props
 * @param props.issue - The validation issue data
 * @param props.onHighlight - Handler for highlighting affected items
 * @returns The validation issue card
 */
function ValidationIssueItem({ issue, onHighlight }: ValidationIssueItemProps) {
  const bgColor = useColorModeValue("white", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.600");
  const Icon = severityIcons[issue.severity];

  return (
    <Box
      p={3}
      bg={bgColor}
      borderRadius="md"
      borderLeft="4px solid"
      borderLeftColor={`${severityColors[issue.severity]}.400`}
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={() => onHighlight(issue.affectedIds)}
    >
      <HStack spacing={2} mb={1}>
        <Icon color={`${severityColors[issue.severity]}.500`} boxSize={4} />
        <Badge colorScheme={severityColors[issue.severity]} fontSize="xs">
          {issue.issueType.replace(/_/g, " ")}
        </Badge>
      </HStack>
      <Text fontSize="sm" mb={1}>
        {issue.message}
      </Text>
      {issue.suggestion && (
        <Text fontSize="xs" color="gray.500">
          Suggestion: {issue.suggestion}
        </Text>
      )}
      {issue.affectedIds.length > 0 && (
        <HStack spacing={1} mt={2} flexWrap="wrap">
          {issue.affectedIds.map((id) => (
            <Badge key={id} variant="outline" fontSize="xs">
              {id}
            </Badge>
          ))}
        </HStack>
      )}
    </Box>
  );
}

/**
 * Floating panel displaying validation results.
 *
 * Features:
 * - **Auto-validation**: Runs validation when panel is first opened
 * - **Manual refresh**: Button to re-run validation
 * - **Grouped display**: Issues organized by severity (error, warning, info)
 * - **Click-to-highlight**: Click an issue to select affected node in graph
 * - **Summary badges**: Shows count of errors, warnings, and info items
 *
 * The panel is positioned absolutely on the right side of the viewport
 * and only renders when `validation.isPanelOpen` is true.
 *
 * @returns The validation panel component, or null if panel is closed
 *
 * @example
 * ```tsx
 * <ValidationPanel />
 * ```
 */
export function ValidationPanel() {
  const { validation, setValidationIssues, setValidating } = useEditorStore();
  const { currentEnvironment } = useServicesStore();
  const { setSelectedNode } = useGraphStore();

  const bgColor = useColorModeValue("gray.50", "gray.800");

  /**
   * Runs the validation against the backend API.
   * Updates the store with the resulting issues.
   */
  const runValidation = useCallback(async () => {
    setValidating(true);
    try {
      const result = await validateEnvironment(currentEnvironment);
      setValidationIssues(result.issues);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  }, [currentEnvironment, setValidationIssues, setValidating]);

  /**
   * Effect to automatically run validation when the panel is opened
   * and no previous results exist.
   */
  useEffect(() => {
    if (validation.isPanelOpen && validation.issues.length === 0) {
      runValidation();
    }
  }, [validation.isPanelOpen, validation.issues.length, runValidation]);

  /**
   * Handles clicking on a validation issue to highlight affected nodes.
   * Selects the first affected node in the graph.
   *
   * @param ids - Array of affected service/relationship IDs
   */
  const handleHighlight = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        // Select the first affected node
        setSelectedNode(ids[0]);
      }
    },
    [setSelectedNode]
  );

  const errorIssues = validation.issues.filter((i) => i.severity === "error");
  const warningIssues = validation.issues.filter(
    (i) => i.severity === "warning"
  );
  const infoIssues = validation.issues.filter((i) => i.severity === "info");

  if (!validation.isPanelOpen) {
    return null;
  }

  return (
    <Box
      position="absolute"
      right={4}
      top={4}
      bottom={4}
      width="350px"
      bg={bgColor}
      borderRadius="lg"
      boxShadow="lg"
      overflow="hidden"
      zIndex={10}
    >
      <VStack spacing={0} h="full">
        {/* Header */}
        <HStack p={4} w="full" justify="space-between" borderBottomWidth={1}>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold">Data Validation</Text>
            <Text fontSize="xs" color="gray.500">
              {currentEnvironment} environment
            </Text>
          </VStack>
          <Button
            size="sm"
            leftIcon={<RepeatIcon />}
            onClick={runValidation}
            isLoading={validation.isValidating}
          >
            Refresh
          </Button>
        </HStack>

        {/* Summary */}
        <HStack p={4} w="full" justify="center" spacing={4}>
          <Badge colorScheme="red" fontSize="md" px={2} py={1}>
            {errorIssues.length} Errors
          </Badge>
          <Badge colorScheme="orange" fontSize="md" px={2} py={1}>
            {warningIssues.length} Warnings
          </Badge>
          <Badge colorScheme="blue" fontSize="md" px={2} py={1}>
            {infoIssues.length} Info
          </Badge>
        </HStack>

        {/* Loading State */}
        {validation.isValidating && (
          <VStack flex={1} justify="center">
            <Spinner size="lg" />
            <Text fontSize="sm" color="gray.500">
              Validating...
            </Text>
          </VStack>
        )}

        {/* Results */}
        {!validation.isValidating && validation.issues.length === 0 && (
          <VStack flex={1} justify="center" p={4}>
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              No issues found! Your data is valid.
            </Alert>
          </VStack>
        )}

        {!validation.isValidating && validation.issues.length > 0 && (
          <Box flex={1} overflowY="auto" w="full">
            <Accordion allowMultiple defaultIndex={[0, 1]}>
              {/* Errors Section */}
              {errorIssues.length > 0 && (
                <AccordionItem>
                  <AccordionButton>
                    <HStack flex={1}>
                      <WarningIcon color="red.500" />
                      <Text fontWeight="medium">Errors</Text>
                      <Badge colorScheme="red">{errorIssues.length}</Badge>
                    </HStack>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={2} align="stretch">
                      {errorIssues.map((issue, idx) => (
                        <ValidationIssueItem
                          key={`error-${idx}`}
                          issue={issue}
                          onHighlight={handleHighlight}
                        />
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              )}

              {/* Warnings Section */}
              {warningIssues.length > 0 && (
                <AccordionItem>
                  <AccordionButton>
                    <HStack flex={1}>
                      <WarningIcon color="orange.500" />
                      <Text fontWeight="medium">Warnings</Text>
                      <Badge colorScheme="orange">{warningIssues.length}</Badge>
                    </HStack>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={2} align="stretch">
                      {warningIssues.map((issue, idx) => (
                        <ValidationIssueItem
                          key={`warning-${idx}`}
                          issue={issue}
                          onHighlight={handleHighlight}
                        />
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              )}

              {/* Info Section */}
              {infoIssues.length > 0 && (
                <AccordionItem>
                  <AccordionButton>
                    <HStack flex={1}>
                      <InfoIcon color="blue.500" />
                      <Text fontWeight="medium">Info</Text>
                      <Badge colorScheme="blue">{infoIssues.length}</Badge>
                    </HStack>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={2} align="stretch">
                      {infoIssues.map((issue, idx) => (
                        <ValidationIssueItem
                          key={`info-${idx}`}
                          issue={issue}
                          onHighlight={handleHighlight}
                        />
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>
          </Box>
        )}

        {/* Last Validated */}
        {validation.lastValidated && (
          <Box p={2} w="full" borderTopWidth={1}>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Last validated: {validation.lastValidated.toLocaleTimeString()}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
