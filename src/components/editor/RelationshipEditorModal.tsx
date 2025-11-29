/**
 * @fileoverview Modal dialog for creating and editing relationships.
 *
 * Provides a form-based interface for managing service relationships,
 * with validation and save functionality integrated with the backend.
 *
 * @module components/editor/RelationshipEditorModal
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
  useToast,
} from "@chakra-ui/react";
import { useState, useCallback, useEffect } from "react";
import { RelationshipForm } from "./RelationshipForm";
import { useEditorStore } from "@/store/editorStore";
import { useServicesStore } from "@/store/servicesStore";
import { useGraphStore } from "@/store/graphStore";
import { saveRelationship } from "@/services/tauri";
import type { Relationship } from "@/types/relationship";

/**
 * Map of field names to validation error messages.
 */
interface ValidationErrors {
  [key: string]: string;
}

/**
 * Modal for creating or editing relationship definitions.
 *
 * Features:
 * - **Dual mode**: Supports both creating new relationships and editing existing ones
 * - **Form validation**: Validates source, target, type, and prevents self-loops
 * - **Auto-generated IDs**: Creates IDs automatically for new relationships
 * - **Error feedback**: Shows inline validation errors for each field
 * - **Auto-refresh**: Updates graph after successful save
 * - **Toast notifications**: Shows success/error messages
 *
 * Validation rules:
 * - Source: Required, must be a valid service ID
 * - Target: Required, must be a valid service ID, cannot equal source
 * - Relationship Type: Required
 *
 * @returns The relationship editor modal component
 *
 * @example
 * ```tsx
 * // Include in your component tree
 * <RelationshipEditorModal />
 *
 * // Open via the editor store
 * openRelationshipEditor('create', undefined, 'source-service-id');
 * openRelationshipEditor('edit', existingRelationship);
 * ```
 */
export function RelationshipEditorModal() {
  const toast = useToast();
  const { relationshipEditor, closeRelationshipEditor, updateRelationshipDraft } =
    useEditorStore();
  const { getAllServicesArray, currentEnvironment } = useServicesStore();
  const { refreshGraph } = useGraphStore();

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const { isOpen, mode, relationship } = relationshipEditor;
  const services = getAllServicesArray();

  /**
   * Effect to clear validation errors when the modal opens.
   * Ensures a clean slate for new editing sessions.
   */
  useEffect(() => {
    if (isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  /**
   * Validates a relationship object and returns any validation errors.
   *
   * Checks:
   * - Source service is required
   * - Target service is required
   * - Source and target cannot be the same (no self-loops)
   * - Relationship type is required
   *
   * @param rel - The partial relationship object to validate
   * @returns Object mapping field names to error messages
   */
  const validateRelationship = useCallback(
    (rel: Partial<Relationship>): ValidationErrors => {
      const newErrors: ValidationErrors = {};

      if (!rel.source?.trim()) {
        newErrors.source = "Source service is required";
      }

      if (!rel.target?.trim()) {
        newErrors.target = "Target service is required";
      }

      if (rel.source && rel.target && rel.source === rel.target) {
        newErrors.target = "Source and target cannot be the same service";
      }

      if (!rel.relationshipType) {
        newErrors.relationshipType = "Relationship type is required";
      }

      return newErrors;
    },
    []
  );

  /**
   * Handles the save action for the relationship form.
   *
   * Generates an ID for new relationships, validates the form,
   * saves to backend, refreshes the graph, and shows notifications.
   */
  const handleSave = useCallback(async () => {
    if (!relationship) return;

    const validationErrors = validateRelationship(relationship);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Generate ID if creating new relationship
    const relationshipToSave: Relationship = {
      ...relationship,
      id:
        relationship.id ||
        `rel-${relationship.source}-${relationship.target}-${Date.now()}`,
    } as Relationship;

    setIsSaving(true);
    try {
      await saveRelationship(currentEnvironment, relationshipToSave);
      await refreshGraph(currentEnvironment);

      toast({
        title: mode === "create" ? "Relationship created" : "Relationship updated",
        description: `Connection from ${relationship.source} to ${relationship.target} has been ${mode === "create" ? "created" : "updated"}.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      closeRelationshipEditor();
    } catch (error) {
      toast({
        title: "Error saving relationship",
        description: String(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    relationship,
    validateRelationship,
    currentEnvironment,
    refreshGraph,
    mode,
    toast,
    closeRelationshipEditor,
  ]);

  /**
   * Handles changes to the relationship form fields.
   * Updates the draft in the store and clears any validation errors
   * for the modified fields.
   *
   * @param updates - Partial relationship object with updated field values
   */
  const handleChange = useCallback(
    (updates: Partial<Relationship>) => {
      updateRelationshipDraft(updates);
      // Clear errors for updated fields
      const updatedFields = Object.keys(updates);
      setErrors((prev) => {
        const newErrors = { ...prev };
        updatedFields.forEach((field) => delete newErrors[field]);
        return newErrors;
      });
    },
    [updateRelationshipDraft]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeRelationshipEditor}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {mode === "create" ? "Create New Relationship" : "Edit Relationship"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {relationship && (
            <RelationshipForm
              relationship={relationship}
              onChange={handleChange}
              errors={errors}
              isEditMode={mode === "edit"}
              services={services}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={closeRelationshipEditor}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
