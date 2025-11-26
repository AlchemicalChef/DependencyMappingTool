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

interface SearchBarProps {
  onSelectService: (serviceId: string) => void;
}

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

  // Search services when query changes
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

  const handleSelect = useCallback(
    (serviceId: string) => {
      onSelectService(serviceId);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    },
    [onSelectService]
  );

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
