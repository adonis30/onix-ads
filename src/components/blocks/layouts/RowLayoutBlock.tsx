
"use client";

import ChildCanvasComponentWrapper from "@/components/ChildCanvasComponentWrapper";
import ChildFormComponentWrapper from "@/components/ChildFormComponentWrapper";
import ChildPropertiesComponentWrapper from "@/components/ChildPropertiesComponentWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { allBlockLayouts } from "@/constant";
import { useBuilder } from "@/context/builder-provider";
import { FormBlocks } from "@/lib/form-blocks";
import { generateUniqueId } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import {
  Active,
  DragEndEvent,
  useDndMonitor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Copy, GripHorizontal, Rows2, Trash2Icon, X } from "lucide-react";
import { useState } from "react";
import { FormBlockInstance, FormBlockType, FormCategoryType, FormErrorsType, HandleBlurFunc, ObjectBlockType } from "../../../../@types/form-block.type";

const blockCategory: FormCategoryType = "Layout";
const blockType: FormBlockType = "RowLayout";

export const RowLayoutBlock: ObjectBlockType = {
  blockCategory,
  blockType,

  createInstance: (id: string): FormBlockInstance => ({
    id: `layout-${id}`,
    blockType,
    isLocked: false,
    attributes: {},
    childblocks: [],
  }),

  blockBtnElement: {
    icon: Rows2,
    label: "Row Layout",
  },

  canvasComponent: RowLayoutCanvasComponent,
  formComponent: RowLayoutFormComponent,
  propertiesComponent: RowLayoutPropertiesComponent,
};

function RowLayoutCanvasComponent({
  blockInstance,
}: {
  blockInstance: FormBlockInstance;
}) {
  const {
    selectedBlockLayout,
    handleSeletedLayout,
    removeBlockLayout,
    duplicateBlockLayout,
    updateBlockLayout,
  } = useBuilder();

  const [activeBlock, setActiveBlock] = useState<Active | null>(null);
  const childBlocks = blockInstance.childblocks ?? [];
  const isSelected = selectedBlockLayout?.id === blockInstance.id;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: blockInstance.id,
    disabled: blockInstance.isLocked,
    data: { isLayoutDropArea: true },
  });

  const { setNodeRef: setDragRef, attributes, listeners, isDragging } =
    useDraggable({
      id: `${blockInstance.id}_drag-area`,
      disabled: blockInstance.isLocked,
      data: {
        blockType: blockInstance.blockType,
        blockId: blockInstance.id,
        isCanvasLayout: true,
      },
    });

  useDndMonitor({
    onDragStart: (event) => setActiveBlock(event.active),
    onDragEnd: (event: DragEndEvent) => {
      const { active, over } = event;
      if (!active || !over) return;
      setActiveBlock(null);

      const isBlockBtnElement = active.data?.current?.isBlockBtnElement;
      const activeBlockType = active.data?.current?.blockType;
      const overId = over.id;

      // Drop only if it's a child block (not a layout)
      if (
        isBlockBtnElement &&
        !allBlockLayouts.includes(activeBlockType) &&
        overId === blockInstance.id
      ) {
        const newBlock = FormBlocks[
          activeBlockType as FormBlockType
        ].createInstance(generateUniqueId());
        updateBlockLayout(blockInstance.id, [...childBlocks, newBlock]);
      }
    },
  });

  const removeChildBlock = (
    e: React.MouseEvent<HTMLButtonElement>,
    childId: string
  ) => {
    e.stopPropagation();
    const filtered = childBlocks.filter((c) => c.id !== childId);
    updateBlockLayout(blockInstance.id, filtered);
  };

  if (isDragging) return null;

  return (
    <div ref={setDragRef} className="max-w-full">
      {blockInstance.isLocked && <Border />}

      <Card
        ref={setDropRef}
        className={cn(
          "relative w-full max-w-[768px] min-h-[120px] rounded-md border bg-white shadow-sm p-0",
          blockInstance.isLocked && "!rounded-t-none"
        )}
        onClick={() => handleSeletedLayout(blockInstance)}
      >
        <CardContent className="px-2 pb-2">
          {isSelected && !blockInstance.isLocked && (
            <div className="absolute left-0 top-0 h-full w-[5px] rounded-l-md bg-primary" />
          )}

          {!blockInstance.isLocked && (
            <div
              {...listeners}
              {...attributes}
              className="flex h-[24px] w-full cursor-move items-center justify-center"
            >
              <GripHorizontal size={20} className="text-muted-foreground" />
            </div>
          )}

          <div className="flex w-full flex-wrap gap-2">
            {/* Placeholder drop indicator */}
            {!allBlockLayouts.includes(
              activeBlock?.data?.current?.blockType
            ) &&
              !blockInstance.isLocked &&
              activeBlock?.data?.current?.isBlockBtnElement &&
              isOver && <DropIndicator />}

            {/* Placeholder message if empty */}
            {!isOver && childBlocks.length === 0 ? (
              <PlaceHolder />
            ) : (
              <div className="flex w-full flex-col items-center gap-4 px-3 py-4">
                {childBlocks.map((childBlock) => (
                  <div
                    key={childBlock.id}
                    className="flex w-full items-center justify-center gap-1"
                  >
                    <ChildCanvasComponentWrapper
                      blockInstance={childBlock}
                    />
                    {isSelected && !blockInstance.isLocked && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-transparent"
                        onClick={(e) => removeChildBlock(e, childBlock.id)}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {isSelected && !blockInstance.isLocked && (
          <CardFooter className="flex items-center justify-end gap-3 border-t py-3">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                duplicateBlockLayout(blockInstance.id);
              }}
            >
              <Copy />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                removeBlockLayout(blockInstance.id);
              }}
            >
              <Trash2Icon />
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function RowLayoutFormComponent({
  blockInstance,
  handleBlur,
  formErrors,
}: {
  blockInstance: FormBlockInstance;
  handleBlur?: HandleBlurFunc;
  formErrors?: FormErrorsType;
}) {
  const childblocks = blockInstance.childblocks ?? [];

  return (
    <div className="max-w-full">
      {blockInstance.isLocked && <Border />}
      <Card className="relative w-full max-w-[768px] min-h-[120px] rounded-md border bg-white shadow-sm p-0">
        <CardContent className="px-2 pb-2">
          <div className="flex w-full flex-col items-center justify-center gap-4 px-3 py-4">
            {childblocks.map((childblock) => (
              <div key={childblock.id} className="flex w-full items-center gap-1">
                <ChildFormComponentWrapper
                  blockInstance={childblock}
                  handleBlur={handleBlur}
                  isError={!!formErrors?.[childblock.id]}
                  errorMessage={formErrors?.[childblock.id]}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RowLayoutPropertiesComponent({
  blockInstance,
}: {
  blockInstance: FormBlockInstance;
}) {
  const childblocks = blockInstance.childblocks ?? [];
  return (
    <div className="w-full pt-3">
      <div className="flex w-full flex-col items-center justify-start gap-0 px-0 py-0">
        {childblocks.map((childblock, index) => (
          <div
            key={childblock.id}
            className="flex w-full items-center justify-center gap-1"
          >
            <ChildPropertiesComponentWrapper
              index={index + 1}
              parentId={blockInstance.id}
              blockInstance={childblock}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceHolder() {
  return (
    <div className="flex h-28 w-full flex-col items-center justify-center gap-1 border border-dotted border-primary bg-primary/10 text-base font-medium text-primary hover:bg-primary/5">
      <p className="text-center text-primary/80">
        Drag and drop a block here to get started
      </p>
    </div>
  );
}

function DropIndicator() {
  return (
    <div className="relative h-28 w-full border border-dotted border-primary bg-primary/10">
      <div className="absolute left-1/2 top-0 w-28 -translate-x-1/2 rounded-b-full bg-primary p-1 text-center text-xs text-white shadow-md">
        Drop here
      </div>
    </div>
  );
}

function Border() {
  return <div className="min-h-[8px] w-full rounded-t-md bg-primary" />;
}
