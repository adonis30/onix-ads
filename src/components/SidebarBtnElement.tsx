'use client';

import React from 'react';
import { useDrag } from 'react-dnd';
import { FormElement } from './FormElements';
import { Button } from './ui/button';

function SidebarBtnElement({ formElement }: { formElement: FormElement }) {
  const { label, icon: Icon } = formElement.designerBtnElement;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FORM_ELEMENT',
    item: { type: formElement.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <button
      ref={(instance: HTMLButtonElement | null) => {
        drag(instance);
      }}
      className={`group flex flex-col items-center gap-2 justify-center text-xs font-medium px-3 py-3 rounded-lg border-2 bg-card hover:bg-accent transition-all duration-200 cursor-move ${
        isDragging 
          ? 'opacity-40 scale-95 border-blue-400 shadow-lg' 
          : 'border-border hover:border-blue-400 hover:shadow-md'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all">
        <Icon className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
      </div>
      <span className="truncate text-center w-full text-foreground/80 group-hover:text-foreground">{label}</span>
    </button>
  );
}

export default SidebarBtnElement;
