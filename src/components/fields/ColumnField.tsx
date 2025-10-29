'use client';

import React, { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import {
  ElementsType,
  FormElement,
  FormElementInstance,
  FormElements,
} from '../FormElements';
import { MdViewStream } from 'react-icons/md';
import { useReorderDnD } from '@/hooks/useReorderDnD';

/* ----------------------------- Helper Component ----------------------------- */
function ColumnChildItem({
  child,
  index,
  parentId,
  moveItem,
  setElements,
}: {
  child: FormElementInstance;
  index: number;
  parentId: string;
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceParentId: string,
    targetParentId: string
  ) => void;
  setElements: any;
}) {
  const ref = useReorderDnD('CHILD_ELEMENT', index, parentId, moveItem, 'vertical');
  const ChildComp = FormElements[child.type].designerComponent;

  return (
    <div
      ref={ref}
      className="border rounded p-2 bg-card shadow-sm cursor-move hover:border-blue-300 transition-all"
    >
      <ChildComp elementInstance={child} setElements={setElements} />
    </div>
  );
}

/* ------------------------------- Main Element ------------------------------- */
const type: ElementsType = 'ColumnField';

export const ColumnFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: { children: [], width: 6 },
  }),

  designerBtnElement: {
    icon: MdViewStream,
    label: 'Column',
  },

  designerComponent: ({ elementInstance, setElements }) => {
    const attrs = elementInstance.extraAttributes ?? { children: [], width: 6 };
    const children = attrs.children ?? [];

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

          const sourceChildren = sourceParent.extraAttributes.children ?? [];
          const [moved] = sourceChildren.splice(dragIndex, 1);
          const targetChildren = targetParent.extraAttributes.children ?? [];
          targetChildren.splice(hoverIndex, 0, moved);

          sourceParent.extraAttributes.children = sourceChildren;
          targetParent.extraAttributes.children = targetChildren;
          return updated;
        });
      },
      [setElements]
    );

    const [, drop] = useDrop<{ type: ElementsType }>({
      accept: 'FORM_ELEMENT',
      drop: (item) => {
        const newChild = FormElements[item.type].construct(crypto.randomUUID());
        setElements?.((prev) =>
          prev.map((el) =>
            el.id === elementInstance.id
              ? {
                  ...el,
                  extraAttributes: {
                    ...attrs,
                    children: [...children, newChild],
                  },
                }
              : el
          )
        );
      },
    });

    return (
      <div
        ref={drop as unknown as React.Ref<HTMLDivElement>}
        className={`rounded-lg border p-3 flex flex-col gap-2 bg-muted/5 min-h-[100px] transition-all ${
          children.length === 0 ? 'border-dashed' : ''
        }`}
      >
        {children.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center">
            Drop elements here
          </p>
        ) : (
          children.map((child: FormElementInstance, index: number) => (
            <ColumnChildItem
              key={child.id}
              child={child}
              index={index}
              parentId={elementInstance.id}
              moveItem={moveItem}
              setElements={setElements}
            />
          ))
        )}
      </div>
    );
  },

  formComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? { children: [], width: 6 };
    const width = attrs.width ?? 6;
    const widthPercent = (width / 12) * 100;

    return (
      <div style={{ flexBasis: `${widthPercent}%` }} className="px-2">
        {attrs.children?.map((child: FormElementInstance) => {
          const Comp = FormElements[child.type].formComponent;
          return <Comp key={child.id} elementInstance={child} />;
        })}
      </div>
    );
  },

  propertiesComponent: ({ elementInstance, setElements }) => {
    const attrs = elementInstance.extraAttributes ?? { width: 6 };
    const update = (key: string, value: any) =>
      setElements((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? { ...el, extraAttributes: { ...attrs, [key]: value } }
            : el
        )
      );

    return (
      <div className="flex flex-col gap-3">
        <label>
          Column Width (1–12)
          <input
            type="number"
            min={1}
            max={12}
            value={attrs.width}
            onChange={(e) => update('width', Number(e.target.value))}
            className="border rounded p-1 w-full"
          />
        </label>
      </div>
    );
  },
};
