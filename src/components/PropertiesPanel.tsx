'use client';

import React from 'react';
import { FormElementInstance, FormElements } from './FormElements';

interface PropertiesPanelProps {
  elementInstance: FormElementInstance;
  setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
}

export default function PropertiesPanel({
  elementInstance,
  setElements,
}: PropertiesPanelProps) {
  const elementDef = FormElements[elementInstance.type];
  const PropertiesComponent = elementDef?.propertiesComponent;

  if (!PropertiesComponent) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-dashed border-muted">
        <svg className="w-12 h-12 text-muted-foreground/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm text-muted-foreground text-center">No editable properties for this element</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-1 shadow-sm">
      <PropertiesComponent
        elementInstance={elementInstance}
        setElements={setElements}
      />
    </div>
  );
}
