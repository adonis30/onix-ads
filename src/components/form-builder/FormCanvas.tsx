// src/components/form-builder/FormCanvas.tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import { useFormBuilder } from '@/lib/form-builder/store';
import { ComponentRegistry } from '@/lib/form-builder/component-registry';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, GripVertical, Settings } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormField, LayoutContainer } from '@/types/form-builder';

function FieldWrapper({ field, onSelect, isSelected }: { 
  field: FormField | LayoutContainer; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const { removeField, duplicateField } = useFormBuilder();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative p-4 rounded-lg border-2 transition-all
        ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Drag Handle & Actions */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            duplicateField(field.id);
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            removeField(field.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Field Preview */}
      <div className="pointer-events-none">
        <FieldPreview field={field} />
      </div>
    </div>
  );
}

function FieldPreview({ field }: { field: FormField | LayoutContainer }) {
  if ('type' in field) {
    // Render field based on type
    const fieldType = field.type as string;
    
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        
        {fieldType === 'textarea' ? (
          <textarea
            placeholder={(field as any).placeholder}
            className="w-full p-2 border rounded-md resize-none"
            rows={(field as any).rows || 3}
            disabled
          />
        ) : fieldType === 'select' ? (
          <select className="w-full p-2 border rounded-md" disabled>
            <option>{(field as any).placeholder || 'Select an option'}</option>
            {(field as any).options?.map((opt: any, i: number) => (
              <option key={i}>{opt.label}</option>
            ))}
          </select>
        ) : fieldType === 'radio' ? (
          <div className="space-y-2">
            {(field as any).options?.map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" disabled />
                <label className="text-sm">{opt.label}</label>
              </div>
            ))}
          </div>
        ) : fieldType === 'checkbox' ? (
          <div className="space-y-2">
            {(field as any).options?.map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input type="checkbox" disabled />
                <label className="text-sm">{opt.label}</label>
              </div>
            ))}
          </div>
        ) : (
          <input
            type={fieldType}
            placeholder={(field as any).placeholder}
            className="w-full p-2 border rounded-md"
            disabled
          />
        )}
        
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  }

  // Render layout container
  return (
    <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
      <p className="text-sm font-medium text-muted-foreground">
        Layout: {(field as any).type}
      </p>
      {'children' in field && field.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {field.children.map(child => (
            <FieldPreview key={child.id} field={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function DropZone({ onDrop }: { onDrop: (component: any) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[200px] border-2 border-dashed rounded-lg p-8
        flex items-center justify-center transition-colors
        ${isOver ? 'border-primary bg-primary/5' : 'border-border'}
      `}
    >
      <div className="text-center text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Drop components here to start building</p>
        <p className="text-sm mt-1">or use AI to generate a form</p>
      </div>
    </div>
  );
}

export function FormCanvas() {
  const { schema, selectedField, selectField, addField } = useFormBuilder();
  const { setNodeRef } = useDroppable({ id: 'canvas' });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    if (componentType) {
      const newField = ComponentRegistry.createField(componentType as any);
      addField(newField);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="flex-1 p-6 overflow-auto bg-muted/30"
      onClick={() => selectField(null)}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="max-w-4xl mx-auto">
        {/* Form Header */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">Untitled Form</h1>
          <p className="text-muted-foreground">Add a description for your form</p>
        </div>

        {/* Form Fields */}
        <div className="bg-card rounded-lg border p-6 space-y-4">
          {schema.fields.length === 0 ? (
            <DropZone onDrop={(component) => {
              const newField = ComponentRegistry.createField(component.type);
              addField(newField);
            }} />
          ) : (
            schema.fields.map(field => (
              <FieldWrapper
                key={field.id}
                field={field}
                onSelect={() => selectField(field.id)}
                isSelected={selectedField === field.id}
              />
            ))
          )}
        </div>

        {/* Submit Button Preview */}
        <div className="bg-card rounded-lg border p-6 mt-6">
          <Button className="w-full" disabled>
            {schema.settings?.submitButtonText || 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
