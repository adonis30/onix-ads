// src/lib/form-builder/store.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FormSchema, FormField, LayoutContainer, BuilderState } from '@/types/form-builder';
import { ComponentRegistry } from './component-registry';

interface FormBuilderStore extends BuilderState {
  // Actions
  setSchema: (schema: FormSchema) => void;
  addField: (field: FormField | LayoutContainer, parentId?: string, index?: number) => void;
  updateField: (fieldId: string, updates: Partial<FormField | LayoutContainer>) => void;
  removeField: (fieldId: string) => void;
  moveField: (fieldId: string, newParentId?: string, newIndex?: number) => void;
  duplicateField: (fieldId: string) => void;
  selectField: (fieldId: string | null) => void;
  copyField: (fieldId: string) => void;
  pasteField: (parentId?: string, index?: number) => void;
  undo: () => void;
  redo: () => void;
  setMode: (mode: 'design' | 'preview' | 'logic') => void;
  updateSettings: (settings: Partial<FormSchema['settings']>) => void;
  updateTheme: (theme: Partial<FormSchema['theme']>) => void;
  saveState: () => void;
  setIsSaving: (isSaving: boolean) => void;
  reset: () => void;
}

const initialSchema: FormSchema = {
  version: '1.0',
  fields: [],
  settings: {
    submitButtonText: 'Submit',
    showRequiredIndicator: true,
    preventMultipleSubmissions: true,
  },
  theme: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    borderRadius: 8,
    spacing: 16,
  },
};

export const useFormBuilder = create<FormBuilderStore>()(
  devtools(
    (set, get) => ({
      schema: initialSchema,
      selectedField: null,
      copiedField: null,
      history: [initialSchema],
      historyIndex: 0,
      isDirty: false,
      isSaving: false,
      mode: 'design',

      setSchema: (schema) =>
        set((state) => {
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), schema];
          return {
            schema,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true,
          };
        }),

      addField: (field, parentId, index) =>
        set((state) => {
          const newSchema = { ...state.schema };
          const fieldToAdd = { ...field, id: field.id || generateId() };

          if (!parentId) {
            // Add to root
            if (index !== undefined) {
              newSchema.fields.splice(index, 0, fieldToAdd);
            } else {
              newSchema.fields.push(fieldToAdd);
            }
          } else {
            // Add to parent container
            const parent = findFieldById(newSchema.fields, parentId);
            if (parent && 'children' in parent) {
              if (index !== undefined) {
                parent.children.splice(index, 0, fieldToAdd);
              } else {
                parent.children.push(fieldToAdd);
              }
            }
          }

          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newSchema];
          return {
            schema: newSchema,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true,
          };
        }),

      updateField: (fieldId, updates) =>
        set((state) => {
          const newSchema = { ...state.schema };
          const field = findFieldById(newSchema.fields, fieldId);
          
          if (field) {
            Object.assign(field, updates);
          }

          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newSchema];
          return {
            schema: newSchema,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true,
          };
        }),

      removeField: (fieldId) =>
        set((state) => {
          const newSchema = { ...state.schema };
          removeFieldById(newSchema.fields, fieldId);

          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newSchema];
          return {
            schema: newSchema,
            selectedField: state.selectedField === fieldId ? null : state.selectedField,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true,
          };
        }),

      moveField: (fieldId, newParentId, newIndex) =>
        set((state) => {
          const newSchema = { ...state.schema };
          const field = findFieldById(newSchema.fields, fieldId);
          
          if (!field) return state;

          // Remove from current location
          removeFieldById(newSchema.fields, fieldId);

          // Add to new location
          if (!newParentId) {
            if (newIndex !== undefined) {
              newSchema.fields.splice(newIndex, 0, field);
            } else {
              newSchema.fields.push(field);
            }
          } else {
            const parent = findFieldById(newSchema.fields, newParentId);
            if (parent && 'children' in parent) {
              if (newIndex !== undefined) {
                parent.children.splice(newIndex, 0, field);
              } else {
                parent.children.push(field);
              }
            }
          }

          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newSchema];
          return {
            schema: newSchema,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true,
          };
        }),

      duplicateField: (fieldId) =>
        set((state) => {
          const field = findFieldById(state.schema.fields, fieldId);
          if (!field) return state;

          const duplicated = JSON.parse(JSON.stringify(field));
          duplicated.id = generateId();
          
          // Update IDs recursively
          if ('children' in duplicated) {
            updateIdsRecursively(duplicated.children);
          }

          const newSchema = { ...state.schema };
          const parentAndIndex = findParentAndIndex(newSchema.fields, fieldId);
          
          if (parentAndIndex) {
            const { parent, index } = parentAndIndex;
            if (parent) {
              parent.children.splice(index + 1, 0, duplicated);
            } else {
              newSchema.fields.splice(index + 1, 0, duplicated);
            }
          }

          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newSchema];
          return {
            schema: newSchema,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true,
          };
        }),

      selectField: (fieldId) => set({ selectedField: fieldId }),

      copyField: (fieldId) =>
        set((state) => {
          const field = findFieldById(state.schema.fields, fieldId);
          return { copiedField: field ? JSON.parse(JSON.stringify(field)) : null };
        }),

      pasteField: (parentId, index) =>
        set((state) => {
          if (!state.copiedField) return state;

          const pasted = JSON.parse(JSON.stringify(state.copiedField));
          pasted.id = generateId();
          
          if ('children' in pasted) {
            updateIdsRecursively(pasted.children);
          }

          const newSchema = { ...state.schema };
          
          if (!parentId) {
            if (index !== undefined) {
              newSchema.fields.splice(index, 0, pasted);
            } else {
              newSchema.fields.push(pasted);
            }
          } else {
            const parent = findFieldById(newSchema.fields, parentId);
            if (parent && 'children' in parent) {
              if (index !== undefined) {
                parent.children.splice(index, 0, pasted);
              } else {
                parent.children.push(pasted);
              }
            }
          }

          const newHistory = [...state.history.slice(0, state.historyIndex + 1), newSchema];
          return {
            schema: newSchema,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true,
          };
        }),

      undo: () =>
        set((state) => {
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            return {
              schema: state.history[newIndex],
              historyIndex: newIndex,
            };
          }
          return state;
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            return {
              schema: state.history[newIndex],
              historyIndex: newIndex,
            };
          }
          return state;
        }),

      setMode: (mode) => set({ mode }),

      updateSettings: (settings) =>
        set((state) => {
          const newSchema = {
            ...state.schema,
            settings: { ...state.schema.settings, ...settings },
          };
          return { schema: newSchema, isDirty: true };
        }),

      updateTheme: (theme) =>
        set((state) => {
          const newSchema = {
            ...state.schema,
            theme: { ...state.schema.theme, ...theme },
          };
          return { schema: newSchema, isDirty: true };
        }),

      saveState: () =>
        set((state) => ({
          isDirty: false,
          history: [state.schema], // Reset history after save
          historyIndex: 0,
        })),

      setIsSaving: (isSaving) => set({ isSaving }),

      reset: () =>
        set({
          schema: initialSchema,
          selectedField: null,
          copiedField: null,
          history: [initialSchema],
          historyIndex: 0,
          isDirty: false,
          isSaving: false,
          mode: 'design',
        }),
    }),
    { name: 'FormBuilder' }
  )
);

// Helper functions
function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function findFieldById(
  fields: (FormField | LayoutContainer)[],
  id: string
): (FormField | LayoutContainer) | null {
  for (const field of fields) {
    if (field.id === id) return field;
    if ('children' in field) {
      const found = findFieldById(field.children, id);
      if (found) return found;
    }
    if ('tabs' in field) {
      for (const tab of field.tabs) {
        const found = findFieldById(tab.children, id);
        if (found) return found;
      }
    }
    if ('items' in field) {
      for (const item of field.items) {
        const found = findFieldById(item.children, id);
        if (found) return found;
      }
    }
    if ('steps' in field) {
      for (const step of field.steps) {
        const found = findFieldById(step.children, id);
        if (found) return found;
      }
    }
  }
  return null;
}

function removeFieldById(fields: (FormField | LayoutContainer)[], id: string): boolean {
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].id === id) {
      fields.splice(i, 1);
      return true;
    }
    const field = fields[i];
    if ('children' in field && removeFieldById(field.children, id)) {
      return true;
    }
    if ('tabs' in field) {
      for (const tab of field.tabs) {
        if (removeFieldById(tab.children, id)) return true;
      }
    }
    if ('items' in field) {
      for (const item of field.items) {
        if (removeFieldById(item.children, id)) return true;
      }
    }
    if ('steps' in field) {
      for (const step of field.steps) {
        if (removeFieldById(step.children, id)) return true;
      }
    }
  }
  return false;
}

function findParentAndIndex(
  fields: (FormField | LayoutContainer)[],
  id: string,
  parent: LayoutContainer | null = null
): { parent: LayoutContainer | null; index: number } | null {
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].id === id) {
      return { parent, index: i };
    }
    const field = fields[i];
    if ('children' in field) {
      const found = findParentAndIndex(field.children, id, field as LayoutContainer);
      if (found) return found;
    }
  }
  return null;
}

function updateIdsRecursively(fields: (FormField | LayoutContainer)[]): void {
  for (const field of fields) {
    field.id = generateId();
    if ('children' in field) {
      updateIdsRecursively(field.children);
    }
    if ('tabs' in field) {
      field.tabs.forEach((tab) => {
        tab.id = generateId();
        updateIdsRecursively(tab.children);
      });
    }
    if ('items' in field) {
      field.items.forEach((item) => {
        item.id = generateId();
        updateIdsRecursively(item.children);
      });
    }
    if ('steps' in field) {
      field.steps.forEach((step) => {
        step.id = generateId();
        updateIdsRecursively(step.children);
      });
    }
  }
}
