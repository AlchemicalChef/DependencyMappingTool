/**
 * @fileoverview Confirmation modal for delete operations.
 *
 * Displays a confirmation dialog before deleting services or relationships,
 * with cascade delete support for services (removes all related relationships).
 *
 * @module components/editor/DeleteConfirmationModal
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useState, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { useServicesStore } from "@/store/servicesStore";
import { useGraphStore } from "@/store/graphStore";
import { deleteService, deleteRelationship, deleteRelationshipsForService } from "@/services/tauri";

/**
 * Confirmation modal for deleting services or relationships.
 *
 * Features:
 * - **Universal delete**: Handles both services and relationships
 * - **Cascade delete**: When deleting a service, removes all connected relationships first
 * - **Warning message**: Shows warning for service deletion about cascade effect
 * - **Auto-refresh**: Updates services list and graph after deletion
 * - **Toast notifications**: Shows success/error feedback
 *
 * The modal displays the name of the item being deleted and requires
 * explicit confirmation before proceeding with the destructive action.
 *
 * @returns The delete confirmation modal component
 *
 * @example
 * ```tsx
 * // Include in your component tree
 * <DeleteConfirmationModal />
 *
 * // Open via the editor store
 * openDeleteConfirmation('service', 'service-id', 'Service Name');
 * openDeleteConfirmation('relationship', 'rel-123', 'api-gateway -> auth-service');
 * ```
 */
export function DeleteConfirmationModal() {
  const toast = useToast();
  const { deleteConfirmation, closeDeleteConfirmation } = useEditorStore();
  const { refreshServices, currentEnvironment } = useServicesStore();
  const { refreshGraph } = useGraphStore();

  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, type, id, name } = deleteConfirmation;

  /**
   * Handles the confirmed delete action.
   *
   * For services:
   * 1. First deletes all relationships involving the service
   * 2. Then deletes the service itself
   * 3. Refreshes services list
   *
   * For relationships:
   * 1. Deletes the relationship
   *
   * Both operations refresh the graph and show toast notifications.
   */
  const handleDelete = useCallback(async () => {
    if (!id || !type) return;

    setIsDeleting(true);
    try {
      if (type === "service") {
        // Delete all relationships involving this service first (cascade delete)
        await deleteRelationshipsForService(currentEnvironment, id);
        await deleteService(currentEnvironment, id);
        await refreshServices(currentEnvironment);
      } else {
        await deleteRelationship(currentEnvironment, id);
      }

      // Refresh graph to reflect the deletion
      await refreshGraph(currentEnvironment);

      toast({
        title: `${type === "service" ? "Service" : "Relationship"} deleted`,
        description: `${name || id} has been deleted successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      closeDeleteConfirmation();
    } catch (error) {
      toast({
        title: `Error deleting ${type}`,
        description: String(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [
    id,
    type,
    name,
    currentEnvironment,
    refreshServices,
    refreshGraph,
    toast,
    closeDeleteConfirmation,
  ]);

  return (
    <Modal isOpen={isOpen} onClose={closeDeleteConfirmation} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Are you sure you want to delete{" "}
            <Text as="span" fontWeight="bold">
              {name || id}
            </Text>
            ?
          </Text>
          {type === "service" && (
            <Text mt={2} fontSize="sm" color="orange.500">
              Warning: This will also remove all relationships involving this
              service.
            </Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={closeDeleteConfirmation}>
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
