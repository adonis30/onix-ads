'use client';

import React from 'react';
import { FormElements } from './FormElements';
import SidebarBtnElement from './SidebarBtnElement';
import PropertiesPanel from '@/components/PropertiesPanel';
import { useFormBuilder } from '@/context/FormBuilderContext';

export default function DesignerSidebar() {
  const { selectedElement, setElements, setHeaderElements, setFooterElements } = useFormBuilder();
  
  // Determine which setter to use based on element type
  const getSetterForElement = () => {
    if (!selectedElement) return setElements;
    if (selectedElement.type === 'HeaderField') return setHeaderElements;
    if (selectedElement.type === 'FooterField') return setFooterElements;
    return setElements;
  };
  return (
    <aside className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20 border-l-2 border-border w-full md:w-[400px] shadow-xl">
      {/* Elements Section */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </div>
          <h2 className="font-bold text-lg text-foreground">Form Elements</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Drag elements onto the canvas</p>
        
        {/* Form Elements Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
          {Object.values(FormElements).map((element) => (
            <SidebarBtnElement key={element.type} formElement={element} />
          ))}
        </div>
      </div>

      {/* Properties Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="font-bold text-base text-foreground">Properties</h3>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">
                  {FormElements[selectedElement.type]?.designerBtnElement.label || 'Element'}
                </span>
              </div>
              <PropertiesPanel
                elementInstance={selectedElement}
                setElements={getSetterForElement()}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">No Element Selected</p>
                <p className="text-xs text-muted-foreground/70">Click on an element to edit its properties</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </aside>
  );
}
