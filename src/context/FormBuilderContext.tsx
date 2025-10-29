'use client';

import { DynamicForm } from '@prisma/client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FormElementInstance } from '@/components/FormElements';

interface FormBuilderContextType {
  form: DynamicForm;
  elements: FormElementInstance[];
  setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
  headerElements: FormElementInstance[];
  setHeaderElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
  footerElements: FormElementInstance[];
  setFooterElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
  selectedElement: FormElementInstance | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<FormElementInstance | null>>;
  previewMode: boolean;
  setPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Layout management methods
  updateElement: (id: string, updates: Partial<FormElementInstance>) => void;
  updateChildElement: (parentId: string, childId: string, updates: Partial<FormElementInstance>) => void;
  removeElement: (id: string, zone?: 'header' | 'main' | 'footer') => void;
}

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(undefined);

export function FormBuilderProvider({
  children,
  form,
  initialElements = [],
  initialHeader = [],
  initialFooter = [],
}: {
  children: ReactNode;
  form: DynamicForm;
  initialElements?: FormElementInstance[];
  initialHeader?: FormElementInstance[];
  initialFooter?: FormElementInstance[];
}) {
  const [elements, setElements] = useState<FormElementInstance[]>(initialElements);
  const [headerElements, setHeaderElements] = useState<FormElementInstance[]>(initialHeader);
  const [footerElements, setFooterElements] = useState<FormElementInstance[]>(initialFooter);
  const [selectedElement, setSelectedElement] = useState<FormElementInstance | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Update a single element by ID
  const updateElement = (id: string, updates: Partial<FormElementInstance>) => {
    const updateInZone = (prev: FormElementInstance[]) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el));
    
    setElements(updateInZone);
    setHeaderElements(updateInZone);
    setFooterElements(updateInZone);
  };

  // Update a child element within a parent (for layouts)
  const updateChildElement = (
    parentId: string,
    childId: string,
    updates: Partial<FormElementInstance>
  ) => {
    const updateChildren = (prev: FormElementInstance[]) =>
      prev.map((el) => {
        if (el.id === parentId && el.extraAttributes?.children) {
          return {
            ...el,
            extraAttributes: {
              ...el.extraAttributes,
              children: el.extraAttributes.children.map((child: FormElementInstance) =>
                child.id === childId ? { ...child, ...updates } : child
              ),
            },
          };
        }
        return el;
      });
    
    setElements(updateChildren);
  };

  // Remove element from specified zone
  const removeElement = (id: string, zone: 'header' | 'main' | 'footer' = 'main') => {
    if (zone === 'header') {
      setHeaderElements([]);
    } else if (zone === 'footer') {
      setFooterElements([]);
    } else {
      setElements((prev) => prev.filter((el) => el.id !== id));
    }
    if (selectedElement?.id === id) setSelectedElement(null);
  };

  return (
    <FormBuilderContext.Provider
      value={{
        form,
        elements,
        setElements,
        headerElements,
        setHeaderElements,
        footerElements,
        setFooterElements,
        selectedElement,
        setSelectedElement,
        previewMode,
        setPreviewMode,
        updateElement,
        updateChildElement,
        removeElement,
      }}
    >
      {children}
    </FormBuilderContext.Provider>
  );
}

export function useFormBuilder() {
  const context = useContext(FormBuilderContext);
  if (!context) {
    throw new Error('useFormBuilder must be used within FormBuilderProvider');
  }
  return context;
}
