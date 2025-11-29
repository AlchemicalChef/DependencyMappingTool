/**
 * @fileoverview Modal dialog for creating and editing services.
 *
 * Provides a form-based interface for managing service definitions,
 * with validation and save functionality integrated with the backend.
 *
 * @module components/editor/ServiceEditorModal
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
import { ServiceForm } from "./ServiceForm";
import { useEditorStore } from "@/store/editorStore";
import { useServicesStore } from "@/store/servicesStore";
import { useGraphStore } from "@/store/graphStore";
import { saveService } from "@/services/tauri";
import type { Service } from "@/types/service";

/**
 * Map of field names to validation error messages.
 */
interface ValidationErrors {
  [key: string]: string;
}

/**
 * Modal for creating or editing service definitions.
 *
 * Features:
 * - **Dual mode**: Supports both creating new services and editing existing ones
 * - **Form validation**: Validates ID format, required fields before saving
 * - **Error feedback**: Shows inline validation errors for each field
 * - **Auto-refresh**: Updates services list and graph after successful save
 * - **Toast notifications**: Shows success/error messages
 *
 * Validation rules:
 * - ID: Required, lowercase alphanumeric with hyphens only
 * - Name: Required
 * - Service Type: Required
 * - Status: Required
 *
 * @returns The service editor modal component
 *
 * @example
 * ```tsx
 * // Include in your component tree
 * <ServiceEditorModal />
 *
 * // Open via the editor store
 * openServiceEditor('create');
 * openServiceEditor('edit', existingService);
 * ```
 */
export function ServiceEditorModal() {
  const toast = useToast();
  const { serviceEditor, closeServiceEditor, updateServiceDraft } =
    useEditorStore();
  const { refreshServices, allTags, currentEnvironment } = useServicesStore();
  const { refreshGraph } = useGraphStore();

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const { isOpen, mode, service } = serviceEditor;

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
   * Validates a service object and returns any validation errors.
   *
   * Checks:
   * - ID is required and matches pattern ^[a-z0-9-]+$
   * - Name is required
   * - ServiceType is required
   * - Status is required
   *
   * @param svc - The partial service object to validate
   * @returns Object mapping field names to error messages
   */
  const validateService = useCallback(
    (svc: Partial<Service>): ValidationErrors => {
      const newErrors: ValidationErrors = {};

      if (!svc.id?.trim()) {
        newErrors.id = "Service ID is required";
      } else if (!/^[a-z0-9-]+$/.test(svc.id)) {
        newErrors.id =
          "ID must be lowercase alphanumeric with hyphens only";
      }

      if (!svc.name?.trim()) {
        newErrors.name = "Service name is required";
      }

      if (!svc.serviceType) {
        newErrors.serviceType = "Service type is required";
      }

      if (!svc.status) {
        newErrors.status = "Service status is required";
      }

      return newErrors;
    },
    []
  );

  /**
   * Handles the save action for the service form.
   *
   * Validates the form, saves to backend, refreshes stores,
   * and shows appropriate toast notifications.
   */
  const handleSave = useCallback(async () => {
    if (!service) return;

    const validationErrors = validateService(service);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      await saveService(currentEnvironment, service as Service);
      await refreshServices(currentEnvironment);
      await refreshGraph(currentEnvironment);

      toast({
        title: mode === "create" ? "Service created" : "Service updated",
        description: `${service.name} has been ${mode === "create" ? "created" : "updated"} successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      closeServiceEditor();
    } catch (error) {
      toast({
        title: "Error saving service",
        description: String(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    service,
    validateService,
    currentEnvironment,
    refreshServices,
    refreshGraph,
    mode,
    toast,
    closeServiceEditor,
  ]);

  /**
   * Handles changes to the service form fields.
   * Updates the draft in the store and clears any validation errors
   * for the modified fields.
   *
   * @param updates - Partial service object with updated field values
   */
  const handleChange = useCallback(
    (updates: Partial<Service>) => {
      updateServiceDraft(updates);
      // Clear errors for updated fields
      const updatedFields = Object.keys(updates);
      setErrors((prev) => {
        const newErrors = { ...prev };
        updatedFields.forEach((field) => delete newErrors[field]);
        return newErrors;
      });
    },
    [updateServiceDraft]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeServiceEditor}
      size="xl"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {mode === "create" ? "Create New Service" : "Edit Service"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {service && (
            <ServiceForm
              service={service}
              onChange={handleChange}
              errors={errors}
              isEditMode={mode === "edit"}
              existingTags={allTags}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={closeServiceEditor}>
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
