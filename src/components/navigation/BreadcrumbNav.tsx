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

interface BreadcrumbNavProps {
  onNavigate: (serviceId: string) => void;
}

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

  const handleGoBack = () => {
    const serviceId = goBack();
    if (serviceId) {
      onNavigate(serviceId);
    }
  };

  const handleGoForward = () => {
    const serviceId = goForward();
    if (serviceId) {
      onNavigate(serviceId);
    }
  };

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
