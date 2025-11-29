/**
 * @fileoverview Breadcrumb navigation component with back/forward buttons.
 *
 * Provides browser-like navigation through the history of viewed services,
 * with clickable breadcrumb trail showing recent navigation path.
 *
 * @module components/navigation/BreadcrumbNav
 */

import {
  HStack,
  IconButton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronRightIcon, ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { useNavigationStore, useServicesStore } from "@/store";

/**
 * Props for the BreadcrumbNav component.
 *
 * @property onNavigate - Callback to load graph for a service
 */
interface BreadcrumbNavProps {
  onNavigate: (serviceId: string) => void;
}

/**
 * Navigation breadcrumb with back/forward controls.
 *
 * Features:
 * - **Back/Forward buttons**: Navigate through service view history
 * - **Breadcrumb trail**: Shows last 4 visited services
 * - **Click navigation**: Click any breadcrumb to jump to that service
 * - **Ellipsis indicator**: Shows "..." when history is truncated
 *
 * Uses the navigation store to manage history state and provide
 * canGoBack/canGoForward functionality.
 *
 * @param props - Component props
 * @param props.onNavigate - Handler called when navigating to a service
 * @returns The breadcrumb navigation component
 *
 * @example
 * ```tsx
 * <BreadcrumbNav onNavigate={(id) => loadGraph(id)} />
 * ```
 */
export function BreadcrumbNav({ onNavigate }: BreadcrumbNavProps) {
  const {
    history,
    currentIndex,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useNavigationStore();

  const { services } = useServicesStore();
  const textColor = useColorModeValue("gray.600", "gray.400");

  /**
   * Navigates backward in the history stack.
   * Only navigates if there is history to go back to.
   */
  const handleGoBack = () => {
    const serviceId = goBack();
    if (serviceId) {
      onNavigate(serviceId);
    }
  };

  /**
   * Navigates forward in the history stack.
   * Only navigates if forward history exists.
   */
  const handleGoForward = () => {
    const serviceId = goForward();
    if (serviceId) {
      onNavigate(serviceId);
    }
  };

  /**
   * Handles clicking on a breadcrumb item to navigate directly.
   * Does nothing if clicking the current item.
   *
   * @param index - The index in the history array to navigate to
   */
  const handleBreadcrumbClick = (index: number) => {
    const serviceId = history[index];
    if (serviceId && index !== currentIndex) {
      onNavigate(serviceId);
    }
  };

  // Get last 4 items for breadcrumbs
  const displayedHistory = history.slice(
    Math.max(0, currentIndex - 3),
    currentIndex + 1
  );
  const startIndex = Math.max(0, currentIndex - 3);

  return (
    <HStack spacing={2}>
      <Tooltip label="Go back">
        <IconButton
          aria-label="Go back"
          icon={<ArrowBackIcon />}
          size="sm"
          variant="ghost"
          isDisabled={!canGoBack()}
          onClick={handleGoBack}
        />
      </Tooltip>
      <Tooltip label="Go forward">
        <IconButton
          aria-label="Go forward"
          icon={<ArrowForwardIcon />}
          size="sm"
          variant="ghost"
          isDisabled={!canGoForward()}
          onClick={handleGoForward}
        />
      </Tooltip>

      {displayedHistory.length > 0 && (
        <Breadcrumb
          separator={<ChevronRightIcon color="gray.400" />}
          spacing={2}
          ml={2}
        >
          {startIndex > 0 && (
            <BreadcrumbItem>
              <Text color={textColor}>...</Text>
            </BreadcrumbItem>
          )}
          {displayedHistory.map((serviceId, idx) => {
            const actualIndex = startIndex + idx;
            const service = services.get(serviceId);
            const isCurrentItem = actualIndex === currentIndex;

            return (
              <BreadcrumbItem key={serviceId} isCurrentPage={isCurrentItem}>
                <BreadcrumbLink
                  onClick={() => handleBreadcrumbClick(actualIndex)}
                  fontWeight={isCurrentItem ? "semibold" : "normal"}
                  color={isCurrentItem ? undefined : textColor}
                  _hover={
                    isCurrentItem
                      ? { textDecoration: "none", cursor: "default" }
                      : { textDecoration: "underline" }
                  }
                >
                  {service?.name || serviceId}
                </BreadcrumbLink>
              </BreadcrumbItem>
            );
          })}
        </Breadcrumb>
      )}
    </HStack>
  );
}
