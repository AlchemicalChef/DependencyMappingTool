/**
 * @fileoverview Search bar component with autocomplete.
 *
 * Provides real-time service search with keyboard navigation support.
 * Displays results in a dropdown with service type and status badges.
 *
 * @module components/navigation/SearchBar
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Text,
  Badge,
  useColorModeValue,
  Portal,
  useOutsideClick,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useServicesStore } from "@/store";
import * as api from "@/services/tauri";
import type { Service } from "@/types";

/**
 * Props for the SearchBar component.
 *
 * @property onSelectService - Callback when a service is selected from results
 */
interface SearchBarProps {
  onSelectService: (serviceId: string) => void;
}

/**
 * Autocomplete search bar for finding services.
 *
 * Features:
 * - **Debounced search**: Waits 200ms after typing before searching
 * - **Keyboard navigation**: Arrow keys to navigate, Enter to select, Escape to close
 * - **Result limiting**: Shows maximum of 10 results
 * - **Visual feedback**: Selected item is highlighted, badges show type/status
 * - **Click outside**: Closes dropdown when clicking outside
 *
 * Search is performed against the current environment via the backend API.
 * Minimum query length is 2 characters.
 *
 * @param props - Component props
 * @param props.onSelectService - Handler called with service ID when selected
 * @returns The search bar component with dropdown results
 *
 * @example
 * ```tsx
 * <SearchBar onSelectService={(id) => navigateToService(id)} />
 * ```
 */
export function SearchBar({ onSelectService }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Service[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { currentEnvironment } = useServicesStore();

  const bgColor = useColorModeValue("white", "gray.700");
  const hoverBgColor = useColorModeValue("gray.100", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useOutsideClick({
    ref: listRef,
    handler: () => setIsOpen(false),
  });

  /**
   * Effect to perform debounced search when query changes.
   * Waits 200ms after last keystroke before making API call.
   * Clears results if query is less than 2 characters.
   */
  useEffect(() => {
    const searchServices = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      try {
        const searchResults = await api.searchServices(currentEnvironment, query);
        setResults(searchResults.slice(0, 10)); // Limit to 10 results
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      }
    };

    const debounce = setTimeout(searchServices, 200);
    return () => clearTimeout(debounce);
  }, [query, currentEnvironment]);

  /**
   * Handles selection of a service from the results list.
   * Resets the search state and triggers the callback.
   *
   * @param serviceId - The ID of the selected service
   */
  const handleSelect = useCallback(
    (serviceId: string) => {
      onSelectService(serviceId);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    },
    [onSelectService]
  );

  /**
   * Handles keyboard navigation within the search results.
   * - ArrowDown: Move selection down
   * - ArrowUp: Move selection up
   * - Enter: Select current item
   * - Escape: Close dropdown
   *
   * @param e - The keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex].id);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <Box position="relative" w="300px" ref={listRef}>
      <InputGroup size="md">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          ref={inputRef}
          placeholder="Search services..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          bg={bgColor}
          borderColor={borderColor}
        />
      </InputGroup>

      {isOpen && results.length > 0 && (
        <Portal>
          <Box
            position="fixed"
            top={inputRef.current?.getBoundingClientRect().bottom ?? 0}
            left={inputRef.current?.getBoundingClientRect().left ?? 0}
            w={inputRef.current?.offsetWidth ?? 300}
            mt={1}
            bg={bgColor}
            borderRadius="md"
            border="1px"
            borderColor={borderColor}
            shadow="lg"
            zIndex={1000}
            maxH="300px"
            overflow="auto"
          >
            <List>
              {results.map((service, index) => (
                <ListItem
                  key={service.id}
                  px={4}
                  py={2}
                  cursor="pointer"
                  bg={index === selectedIndex ? hoverBgColor : "transparent"}
                  _hover={{ bg: hoverBgColor }}
                  onClick={() => handleSelect(service.id)}
                >
                  <Text fontWeight="medium" fontSize="sm">
                    {service.name}
                  </Text>
                  <Box mt={1}>
                    <Badge
                      size="sm"
                      colorScheme={getTypeColorScheme(service.serviceType)}
                      mr={2}
                    >
                      {service.serviceType}
                    </Badge>
                    <Badge
                      size="sm"
                      colorScheme={getStatusColorScheme(service.status)}
                    >
                      {service.status}
                    </Badge>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        </Portal>
      )}
    </Box>
  );
}

/**
 * Maps service type to Chakra UI color scheme for badges.
 *
 * @param type - The service type string
 * @returns A Chakra UI color scheme name
 *
 * @example
 * ```ts
 * getTypeColorScheme('api')      // => 'blue'
 * getTypeColorScheme('database') // => 'orange'
 * getTypeColorScheme('unknown')  // => 'gray'
 * ```
 */
function getTypeColorScheme(type: string): string {
  const schemes: Record<string, string> = {
    gateway: "purple",
    api: "blue",
    backend: "green",
    database: "orange",
    cache: "red",
    queue: "yellow",
    frontend: "cyan",
    external: "gray",
  };
  return schemes[type] || "gray";
}

/**
 * Maps service status to Chakra UI color scheme for badges.
 *
 * @param status - The service status string
 * @returns A Chakra UI color scheme name
 *
 * @example
 * ```ts
 * getStatusColorScheme('healthy')   // => 'green'
 * getStatusColorScheme('degraded')  // => 'yellow'
 * getStatusColorScheme('unhealthy') // => 'red'
 * ```
 */
function getStatusColorScheme(status: string): string {
  const schemes: Record<string, string> = {
    healthy: "green",
    degraded: "yellow",
    unhealthy: "red",
    unknown: "gray",
    deprecated: "gray",
  };
  return schemes[status] || "gray";
}
