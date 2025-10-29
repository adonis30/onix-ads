// src/components/form-builder/DragDropProvider.tsx
'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useFormBuilder } from '@/lib/form-builder/store';
import type { FormField, LayoutContainer } from '@/types/form-builder';

interface DragDropProviderProps {
  children: React.ReactNode;
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { schema, addField, moveField } = useFormBuilder();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a new component from sidebar
    if (activeId.startsWith('new-')) {
      const fieldType = activeId.replace('new-', '');
      // Will be handled by the specific drop zone
    } else {
      // Moving existing field
      if (activeId !== overId) {
        // Extract parent and index from overId if it contains metadata
        const [targetId, indexStr] = overId.split(':');
        const targetIndex = indexStr ? parseInt(indexStr) : undefined;
        
        moveField(activeId, targetId === 'root' ? undefined : targetId, targetIndex);
      }
    }

    setActiveId(null);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      {children}
      <DragOverlay>
        {activeId && (
          <div className="bg-white border-2 border-primary rounded-lg p-4 shadow-lg">
            Dragging: {activeId}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
