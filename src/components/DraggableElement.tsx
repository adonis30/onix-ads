'use client';

import React, { ReactNode, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

interface Props {
  id: string;
  index: number;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  children: ReactNode;
}

function DraggableElement({ id, index, moveElement, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'DESIGNER_ELEMENT',
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY =
        (clientOffset as { y: number }).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveElement(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'DESIGNER_ELEMENT',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`p-4 rounded-lg border border-gray-700 bg-gray-900/50 hover:border-blue-400 transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {children}
    </div>
  );
}

export default DraggableElement;
