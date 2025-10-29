'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import {
  ElementsType,
  FormElement,
  FormElementInstance,
  FormElements,
} from '../FormElements';
import {
  MdViewColumn,
  MdDelete,
  MdFileCopy,
  MdOutlineDeleteOutline,
} from 'react-icons/md';
import { Button } from '../ui/button';
import { useReorderDnD } from '@/hooks/useReorderDnD';

const type: ElementsType = 'RowField';

/* ----------------------------- Helper Component ----------------------------- */
function RowColumnItem({
  col,
  index,
  parentId,
  moveItem,
  setElements,
  onDelete,
  onDuplicate,
}: {
  col: FormElementInstance;
  index: number;
  parentId: string;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceParentId: string,
    targetParentId: string
  ) => void;
  setElements: any;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const ref = useReorderDnD('COLUMN_ELEMENT', index, parentId, moveItem, 'horizontal');
  const Comp = FormElements['ColumnField'].designerComponent;

  return (
    <div
      ref={ref}
      className="relative min-w-[120px] flex-1 border rounded-lg p-2 bg-card hover:border-blue-300 transition-all"
    >
      <div className="absolute -top-3 right-2 flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDuplicate(col.id)}
          title="Duplicate column"
        >
          <MdFileCopy />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(col.id)}
          title="Delete column"
        >
          <MdOutlineDeleteOutline />
        </Button>
      </div>

      <Comp elementInstance={col} setElements={setElements} />
    </div>
  );
}

/* ------------------------------- Main Element ------------------------------- */
export const RowFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      columns: [],
      gap: 12,
      layoutPreset: 'custom',
    },
  }),

  designerBtnElement: {
    icon: MdViewColumn,
    label: 'Row Layout',
  },

  designerComponent: ({ elementInstance, setElements }) => {
    const attrs = elementInstance.extraAttributes ?? {
      columns: [],
      gap: 12,
      layoutPreset: 'custom',
    };

    const columns: FormElementInstance[] = attrs.columns ?? [];
    const [isActive, setIsActive] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [, drop] = useDrop<{ type: ElementsType }, void, { isOver: boolean }>(() => ({
      accept: 'FORM_ELEMENT',
      hover: () => setIsActive(true),
      drop: (item) => {
        setIsActive(false);
        if (item.type === 'ColumnField') {
          const newCol = FormElements['ColumnField'].construct(crypto.randomUUID());
          setElements?.((prev) =>
            prev.map((el) =>
              el.id === elementInstance.id
                ? {
                    ...el,
                    extraAttributes: {
                      ...attrs,
                      columns: [...(attrs.columns ?? []), newCol],
                    },
                  }
                : el
            )
          );
        }
      },
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }));

    useEffect(() => {
      if (containerRef.current) {
        (drop as any)(containerRef.current);
      }
    }, [drop]);

    const moveItem = useCallback(
      (
        dragIndex: number,
        hoverIndex: number,
        sourceParentId: string,
        targetParentId: string
      ) => {
        setElements?.((prev) => {
          const updated = structuredClone(prev);
          const sourceParent = updated.find((el) => el.id === sourceParentId);
          const targetParent = updated.find((el) => el.id === targetParentId);
          if (!sourceParent?.extraAttributes || !targetParent?.extraAttributes) return prev;

          const sourceCols: FormElementInstance[] = sourceParent.extraAttributes.columns ?? [];
          const [moved] = sourceCols.splice(dragIndex, 1);
          const targetCols: FormElementInstance[] = targetParent.extraAttributes.columns ?? [];
          targetCols.splice(hoverIndex, 0, moved);

          sourceParent.extraAttributes.columns = sourceCols;
          targetParent.extraAttributes.columns = targetCols;
          return updated;
        });
      },
      [setElements]
    );

    const duplicateRow = () => {
      setElements?.((prev) => {
        const copy = structuredClone(prev);
        const index = copy.findIndex((el) => el.id === elementInstance.id);
        if (index === -1) return prev;

        const clone = copy[index];
        const newClone = {
          ...clone,
          id: crypto.randomUUID(),
          extraAttributes: {
            ...clone.extraAttributes,
            columns: (clone.extraAttributes?.columns ?? []).map((c: any) => ({
              ...c,
              id: crypto.randomUUID(),
              extraAttributes: {
                ...(c.extraAttributes ?? {}),
                children: (c.extraAttributes?.children ?? []).map((ch: any) => ({
                  ...ch,
                  id: crypto.randomUUID(),
                })),
              },
            })),
          },
        };
        copy.splice(index + 1, 0, newClone);
        return copy;
      });
    };

    const deleteRow = () =>
      setElements?.((prev) => prev.filter((el) => el.id !== elementInstance.id));

    const deleteColumn = (colId: string) =>
      setElements?.((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? {
                ...el,
                extraAttributes: {
                  ...attrs,
                  columns: (attrs.columns ?? []).filter((c: any) => c.id !== colId),
                },
              }
            : el
        )
      );

    const duplicateColumn = (colId: string) =>
      setElements?.((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? {
                ...el,
                extraAttributes: {
                  ...attrs,
                  columns: (attrs.columns ?? []).reduce((acc: any[], c: any) => {
                    acc.push(c);
                    if (c.id === colId) {
                      const clone = structuredClone(c);
                      clone.id = crypto.randomUUID();
                      clone.extraAttributes = {
                        ...(clone.extraAttributes ?? {}),
                        children: (clone.extraAttributes?.children ?? []).map((ch: any) => ({
                          ...ch,
                          id: crypto.randomUUID(),
                        })),
                      };
                      acc.push(clone);
                    }
                    return acc;
                  }, []),
                },
              }
            : el
        )
      );

    return (
      <div
        ref={containerRef}
        className={`rounded-xl border-2 p-3 bg-muted/5 flex flex-col gap-3 transition-all duration-200 ${
          isActive ? 'border-blue-400 bg-blue-50/10 shadow-inner' : 'border-muted'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdViewColumn className="text-lg text-muted-foreground" />
            <div className="text-xs text-muted-foreground font-semibold">Row Layout</div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={duplicateRow} title="Duplicate row">
              <MdFileCopy />
            </Button>
            <Button size="sm" variant="destructive" onClick={deleteRow} title="Delete row">
              <MdDelete />
            </Button>
          </div>
        </div>

        <div className="flex w-full gap-3" style={{ gap: `${attrs.gap}px` }}>
          {columns.length === 0 ? (
            <div className="flex-1 p-6 text-center">
              <p className="text-xs text-muted-foreground italic py-3 w-full">
                Drop columns here or add a preset layout from properties
              </p>
            </div>
          ) : (
            columns.map((col, index) => (
              <RowColumnItem
                key={col.id}
                col={col}
                index={index}
                parentId={elementInstance.id}
                moveItem={moveItem}
                setElements={setElements}
                onDelete={deleteColumn}
                onDuplicate={duplicateColumn}
              />
            ))
          )}
        </div>
      </div>
    );
  },

  formComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? { columns: [], gap: 12 };
    return (
      <div className="flex w-full" style={{ gap: `${attrs.gap}px` }}>
        {attrs.columns?.map((col: FormElementInstance) => {
          const Comp = FormElements['ColumnField'].formComponent;
          return <Comp key={col.id} elementInstance={col} />;
        })}
      </div>
    );
  },

  propertiesComponent: ({ elementInstance, setElements }) => {
    const attrs = elementInstance.extraAttributes ?? {
      columns: [],
      gap: 12,
      layoutPreset: 'custom',
    };

    const update = (key: string, value: any) =>
      setElements?.((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? { ...el, extraAttributes: { ...attrs, [key]: value } }
            : el
        )
      );

    const applyPreset = (cols: number) => {
      setElements?.((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? {
                ...el,
                extraAttributes: {
                  ...attrs,
                  layoutPreset: `${cols}-col`,
                  columns: Array.from({ length: cols }, () =>
                    FormElements['ColumnField'].construct(crypto.randomUUID())
                  ),
                },
              }
            : el
        )
      );
    };

    return (
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Column Gap (px)</label>
          <input
            type="number"
            min={0}
            value={attrs.gap}
            onChange={(e) => update('gap', Number(e.target.value))}
            className="border rounded p-1 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Layout Presets</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((n) => (
              <Button
                key={n}
                size="sm"
                variant={attrs.layoutPreset === `${n}-col` ? 'default' : 'outline'}
                onClick={() => applyPreset(n)}
              >
                {n}-Column
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
