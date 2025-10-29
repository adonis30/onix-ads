'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { FormElements, FormElementInstance, ElementsType } from './FormElements';
import DesignerSidebar from './DesignerSidebar';
import { Trash2, MoveUp, MoveDown } from 'lucide-react';
import clsx from 'clsx';
import { useFormBuilder } from '@/context/FormBuilderContext';

function Designer() {
  const {
    elements,
    setElements,
    headerElements,
    setHeaderElements,
    footerElements,
    setFooterElements,
    selectedElement,
    setSelectedElement,
  } = useFormBuilder();

  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const headerContainerRef = useRef<HTMLDivElement | null>(null);
  const footerContainerRef = useRef<HTMLDivElement | null>(null);

  // Header drop zone
  const [{ isOverHeader }, dropHeader] = useDrop<
    { type: ElementsType },
    void,
    { isOverHeader: boolean }
  >(() => ({
    accept: 'FORM_ELEMENT',
    drop: (item) => {
      if (item.type === 'HeaderField') {
        const newElement = FormElements[item.type].construct(crypto.randomUUID());
        setHeaderElements([newElement]); // Only one header allowed
        setHighlightedId(newElement.id);
      }
    },
    collect: (monitor) => ({
      isOverHeader: monitor.isOver(),
    }),
  }));

  // Main content drop zone
  const [{ isOverMain }, dropMain] = useDrop<
    { type: ElementsType },
    void,
    { isOverMain: boolean }
  >(() => ({
    accept: 'FORM_ELEMENT',
    drop: (item) => {
      // Don't allow header/footer in main area
      if (item.type !== 'HeaderField' && item.type !== 'FooterField') {
        const newElement = FormElements[item.type].construct(crypto.randomUUID());
        setElements((prev) => [...prev, newElement]);
        setHighlightedId(newElement.id);

        setTimeout(() => {
          mainContainerRef.current?.scrollTo({
            top: mainContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 50);
      }
    },
    collect: (monitor) => ({
      isOverMain: monitor.isOver(),
    }),
  }));

  // Footer drop zone
  const [{ isOverFooter }, dropFooter] = useDrop<
    { type: ElementsType },
    void,
    { isOverFooter: boolean }
  >(() => ({
    accept: 'FORM_ELEMENT',
    drop: (item) => {
      if (item.type === 'FooterField') {
        const newElement = FormElements[item.type].construct(crypto.randomUUID());
        setFooterElements([newElement]); // Only one footer allowed
        setHighlightedId(newElement.id);
      }
    },
    collect: (monitor) => ({
      isOverFooter: monitor.isOver(),
    }),
  }));

  dropHeader(headerContainerRef);
  dropMain(mainContainerRef);
  dropFooter(footerContainerRef);

  // remove element
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

  // move element up/down
  const moveElement = (id: string, direction: 'up' | 'down') => {
    setElements((prev) => {
      const index = prev.findIndex((el) => el.id === id);
      if (index === -1) return prev;

      const newElements = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newElements.length) return prev;

      [newElements[index], newElements[targetIndex]] = [
        newElements[targetIndex],
        newElements[index],
      ];
      return newElements;
    });
  };

  // reset highlight
  useEffect(() => {
    if (highlightedId) {
      const timeout = setTimeout(() => setHighlightedId(null), 1200);
      return () => clearTimeout(timeout);
    }
  }, [highlightedId]);

  const renderElement = (el: FormElementInstance, zone: 'header' | 'main' | 'footer', index?: number) => {
    const ElementDef = FormElements[el.type];
    const Comp = ElementDef?.designerComponent;
    if (!Comp) return null;

    const isHighlighted = highlightedId === el.id;
    const isSelected = selectedElement?.id === el.id;
    const setter = zone === 'header' ? setHeaderElements : zone === 'footer' ? setFooterElements : setElements;

    return (
      <div
        key={el.id}
        className={clsx(
          'relative rounded-xl p-4 cursor-pointer transition-all duration-200 group',
          'border-2 hover:shadow-lg',
          isSelected
            ? 'border-blue-500 bg-blue-500/5 shadow-md ring-2 ring-blue-500/20'
            : 'border-border hover:border-blue-300 bg-card',
          isHighlighted && 'animate-pulse border-green-500 shadow-lg ring-2 ring-green-500/30'
        )}
        onClick={() => setSelectedElement(el)}
      >
        {/* Toolbar */}
        <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all duration-200 z-10">
          {zone === 'main' && typeof index === 'number' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveElement(el.id, 'up');
                }}
                className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all"
                title="Move up"
              >
                <MoveUp size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveElement(el.id, 'down');
                }}
                className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all"
                title="Move down"
              >
                <MoveDown size={14} />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeElement(el.id, zone);
            }}
            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shadow-sm transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <Comp elementInstance={el} setElements={setter} />
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full gap-4">
      {/* 🎨 Form Canvas */}
      <div className="flex-1 p-6">
        <div className="bg-background max-w-[920px] m-auto rounded-2xl flex flex-col overflow-hidden transition-all duration-200 border-2 border-border shadow-xl">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">Form Canvas</p>
          </div>
          {/* Header Zone */}
          <div
            ref={headerContainerRef}
            className={clsx(
              'min-h-[120px] border-b-2 border-dashed p-6 transition-all duration-300',
              isOverHeader ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20' : 'border-muted/50',
              headerElements.length === 0 && 'bg-muted/5 hover:bg-muted/10'
            )}
          >
            {headerElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Header Section</p>
                <p className="text-xs text-muted-foreground/70">Drag & drop header element here</p>
              </div>
            ) : (
              <div className="w-full space-y-3">{headerElements.map((el) => renderElement(el, 'header'))}</div>
            )}
          </div>

          {/* Main Content Zone */}
          <div
            ref={mainContainerRef}
            className={clsx(
              'min-h-[55vh] p-6 transition-all duration-300 overflow-y-auto',
              isOverMain && 'ring-2 ring-blue-500/20 bg-blue-500/5'
            )}
          >
            {elements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground mb-2">Start Building Your Form</p>
                  <p className="text-sm text-muted-foreground">Drag elements from the sidebar to create your form</p>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                {elements.map((el, index) => renderElement(el, 'main', index))}
              </div>
            )}
          </div>

          {/* Footer Zone */}
          <div
            ref={footerContainerRef}
            className={clsx(
              'min-h-[120px] border-t-2 border-dashed p-6 transition-all duration-300',
              isOverFooter ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20' : 'border-muted/50',
              footerElements.length === 0 && 'bg-muted/5 hover:bg-muted/10'
            )}
          >
            {footerElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Footer Section</p>
                <p className="text-xs text-muted-foreground/70">Drag & drop footer element here</p>
              </div>
            ) : (
              <div className="w-full space-y-3">{footerElements.map((el) => renderElement(el, 'footer'))}</div>
            )}
          </div>
        </div>
      </div>

      {/* 🧩 Sidebar */}
      <DesignerSidebar />
    </div>
  );
}

export default Designer;
