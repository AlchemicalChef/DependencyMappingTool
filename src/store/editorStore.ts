/**
 * @fileoverview Zustand store for editor modal and validation state.
 *
 * Manages the state for service editor, relationship editor, validation
 * panel, and delete confirmation modals. Provides a centralized place
 * to control all editor-related UI state.
 *
 * @module store/editorStore
 */

import { create } from "zustand";
import type { Service } from "@/types/service";
import type { Relationship } from "@/types/relationship";

/**
 * Mode for editor modals - either creating new or editing existing.
 */
export type EditorMode = "create" | "edit";

/**
 * Represents a validation issue found during environment validation.
 *
 * @property severity - How critical the issue is (error, warning, info)
 * @property issueType - Category of the validation issue
 * @property message - Human-readable description of the issue
 * @property affectedIds - IDs of services/relationships involved
 * @property suggestion - Optional fix recommendation
 */
export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  issueType:
    | "orphaned_relationship"
    | "duplicate_service_id"
    | "missing_required_field"
    | "invalid_relationship_type"
    | "circular_dependency"
    | "unreachable_service";
  message: string;
  affectedIds: string[];
  suggestion?: string;
}

/**
 * State for the service editor modal.
 */
interface ServiceEditorState {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Whether creating new or editing existing */
  mode: EditorMode;
  /** The service being edited (partial during creation) */
  service: Partial<Service> | null;
}

/**
 * State for the relationship editor modal.
 */
interface RelationshipEditorState {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Whether creating new or editing existing */
  mode: EditorMode;
  /** The relationship being edited (partial during creation) */
  relationship: Partial<Relationship> | null;
  /** Pre-selected source service ID (for quick creation) */
  preselectedSource?: string;
  /** Pre-selected target service ID (for quick creation) */
  preselectedTarget?: string;
}

/**
 * State for the validation panel.
 */
interface ValidationState {
  /** Whether the validation panel is open */
  isPanelOpen: boolean;
  /** Array of validation issues found */
  issues: ValidationIssue[];
  /** Whether validation is in progress */
  isValidating: boolean;
  /** When validation was last run */
  lastValidated: Date | null;
}

/**
 * Combined state interface for all editor-related functionality.
 *
 * Groups service editor, relationship editor, validation, and delete
 * confirmation state and actions into a single store.
 */
interface EditorState {
  // Service Editor
  /** Current state of the service editor modal */
  serviceEditor: ServiceEditorState;
  /** Opens the service editor in create or edit mode */
  openServiceEditor: (mode: EditorMode, service?: Service) => void;
  /** Closes the service editor modal */
  closeServiceEditor: () => void;
  /** Updates the service draft being edited */
  updateServiceDraft: (updates: Partial<Service>) => void;

  // Relationship Editor
  /** Current state of the relationship editor modal */
  relationshipEditor: RelationshipEditorState;
  /** Opens the relationship editor in create or edit mode */
  openRelationshipEditor: (
    mode: EditorMode,
    relationship?: Relationship,
    preselectedSource?: string,
    preselectedTarget?: string
  ) => void;
  /** Closes the relationship editor modal */
  closeRelationshipEditor: () => void;
  /** Updates the relationship draft being edited */
  updateRelationshipDraft: (updates: Partial<Relationship>) => void;

  // Validation
  /** Current state of the validation panel */
  validation: ValidationState;
  /** Opens or closes the validation panel */
  setValidationPanelOpen: (open: boolean) => void;
  /** Sets the validation issues array */
  setValidationIssues: (issues: ValidationIssue[]) => void;
  /** Sets whether validation is in progress */
  setValidating: (validating: boolean) => void;
  /** Clears all validation state */
  clearValidation: () => void;

  // Delete Confirmation
  /** Current state of the delete confirmation dialog */
  deleteConfirmation: {
    isOpen: boolean;
    type: "service" | "relationship" | null;
    id: string | null;
    name: string | null;
  };
  /** Opens the delete confirmation dialog */
  openDeleteConfirmation: (
    type: "service" | "relationship",
    id: string,
    name: string
  ) => void;
  /** Closes the delete confirmation dialog */
  closeDeleteConfirmation: () => void;
}

const initialServiceEditorState: ServiceEditorState = {
  isOpen: false,
  mode: "create",
  service: null,
};

const initialRelationshipEditorState: RelationshipEditorState = {
  isOpen: false,
  mode: "create",
  relationship: null,
};

const initialValidationState: ValidationState = {
  isPanelOpen: false,
  issues: [],
  isValidating: false,
  lastValidated: null,
};

export const useEditorStore = create<EditorState>((set) => ({
  // Service Editor
  serviceEditor: initialServiceEditorState,

  openServiceEditor: (mode, service) =>
    set({
      serviceEditor: {
        isOpen: true,
        mode,
        service: service
          ? { ...service }
          : {
              id: "",
              name: "",
              serviceType: "api",
              status: "unknown",
              tags: [],
              metadata: {},
            },
      },
    }),

  closeServiceEditor: () =>
    set({
      serviceEditor: initialServiceEditorState,
    }),

  updateServiceDraft: (updates) =>
    set((state) => ({
      serviceEditor: {
        ...state.serviceEditor,
        service: state.serviceEditor.service
          ? { ...state.serviceEditor.service, ...updates }
          : updates,
      },
    })),

  // Relationship Editor
  relationshipEditor: initialRelationshipEditorState,

  openRelationshipEditor: (
    mode,
    relationship,
    preselectedSource,
    preselectedTarget
  ) =>
    set({
      relationshipEditor: {
        isOpen: true,
        mode,
        relationship: relationship
          ? { ...relationship }
          : {
              id: "",
              source: preselectedSource || "",
              target: preselectedTarget || "",
              relationshipType: "depends_on",
            },
        preselectedSource,
        preselectedTarget,
      },
    }),

  closeRelationshipEditor: () =>
    set({
      relationshipEditor: initialRelationshipEditorState,
    }),

  updateRelationshipDraft: (updates) =>
    set((state) => ({
      relationshipEditor: {
        ...state.relationshipEditor,
        relationship: state.relationshipEditor.relationship
          ? { ...state.relationshipEditor.relationship, ...updates }
          : updates,
      },
    })),

  // Validation
  validation: initialValidationState,

  setValidationPanelOpen: (open) =>
    set((state) => ({
      validation: { ...state.validation, isPanelOpen: open },
    })),

  setValidationIssues: (issues) =>
    set((state) => ({
      validation: {
        ...state.validation,
        issues,
        isValidating: false,
        lastValidated: new Date(),
      },
    })),

  setValidating: (validating) =>
    set((state) => ({
      validation: { ...state.validation, isValidating: validating },
    })),

  clearValidation: () =>
    set({
      validation: initialValidationState,
    }),

  // Delete Confirmation
  deleteConfirmation: {
    isOpen: false,
    type: null,
    id: null,
    name: null,
  },

  openDeleteConfirmation: (type, id, name) =>
    set({
      deleteConfirmation: { isOpen: true, type, id, name },
    }),

  closeDeleteConfirmation: () =>
    set({
      deleteConfirmation: { isOpen: false, type: null, id: null, name: null },
    }),
}));
