"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { allBlockLayouts } from "@/constant";
import { useBuilder } from "@/context/builder-provider";
import { generateUniqueId } from "@/lib/helpers";
import { FormBlocks } from "@/lib/form-blocks";
import { cn } from "@/lib/utils";
import {
  Active,
  DragEndEvent,
  useDndMonitor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Copy, GripHorizontal, LayoutPanelTop, Trash2Icon, X } from "lucide-react";
import { useState } from "react";
import { FormBlockInstance, FormBlockType, FormCategoryType, FormErrorsType, HandleBlurFunc, ObjectBlockType } from "../../../@types/form-block.type";
import ChildCanvasComponentWrapper from "../ChildCanvasComponentWrapper";
import ChildFormComponentWrapper from "../ChildFormComponentWrapper";
import ChildPropertiesComponentWrapper from "../ChildPropertiesComponentWrapper";

const blockCategory: FormCategoryType = "Layout";
const blockType: FormBlockType = "ColumnLayout";

export const ColumnLayoutBlock: ObjectBlockType = {
  blockCategory,
  blockType,

  createInstance: (id: string): FormBlockInstance => ({
    id: `column-${id}`,
    blockType,
    isLocked: false,
    attributes: {
      width: 6, // half-width by default
    },
    childblocks: [],
  }),

  blockBtnElement: {
    icon: LayoutPanelTop,
    label: "Column Layout",
  },

  canvasComponent: ColumnLayoutCanvasComponent,
  formComponent: ColumnLayoutFormComponent,
  propertiesComponent: ColumnLayoutPropertiesComponent,
};

function ColumnLayoutCanvasComponent({
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
    data: { isColumnDropArea: true },
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
    <div
      ref={setDragRef}
      className="relative flex-1 min-w-[200px] max-w-[600px]"
      style={{
        flexBasis: `${((blockInstance.attributes?.width ?? 6) / 12) * 100}%`,
      }}
    >
      {blockInstance.isLocked && <Border />}

      <Card
        ref={setDropRef}
        className={cn(
          "relative w-full min-h-[120px] border bg-white shadow-sm rounded-md p-0",
          blockInstance.isLocked && "!rounded-t-none"
        )}
        onClick={() => handleSeletedLayout(blockInstance)}
      >
        <CardContent className="px-2 pb-2">
          {isSelected && !blockInstance.isLocked && (
            <div className="absolute left-0 top-0 h-full w-[4px] rounded-l-md bg-primary" />
          )}

          {!blockInstance.isLocked && (
            <div
              {...listeners}
              {...attributes}
              className="flex h-[24px] w-full cursor-move items-center justify-center"
            >
              <GripHorizontal size={18} className="text-muted-foreground" />
            </div>
          )}

          <div className="flex w-full flex-col gap-2">
            {/* Drop zone indicator */}
            {!allBlockLayouts.includes(
              activeBlock?.data?.current?.blockType
            ) &&
              !blockInstance.isLocked &&
              activeBlock?.data?.current?.isBlockBtnElement &&
              isOver && <DropIndicator />}

            {!isOver && childBlocks.length === 0 ? (
              <PlaceHolder />
            ) : (
              <div className="flex w-full flex-col items-center gap-3 px-3 py-4">
                {childBlocks.map((childBlock) => (
                  <div
                    key={childBlock.id}
                    className="flex w-full items-center justify-center gap-1"
                  >
                    <ChildCanvasComponentWrapper blockInstance={childBlock} />
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

function ColumnLayoutFormComponent({
  blockInstance,
  handleBlur,
  formErrors,
}: {
  blockInstance: FormBlockInstance;
  handleBlur?: HandleBlurFunc;
  formErrors?: FormErrorsType;
}) {
  const childblocks = blockInstance.childblocks ?? [];
  const widthPercent = ((blockInstance.attributes?.width ?? 6) / 12) * 100;

  return (
    <div
      className="relative min-w-[200px] max-w-[600px] px-2"
      style={{ flexBasis: `${widthPercent}%` }}
    >
      {blockInstance.isLocked && <Border />}
      <Card className="w-full min-h-[120px] rounded-md border bg-white shadow-sm p-0">
        <CardContent className="px-2 pb-2">
          <div className="flex flex-col items-center justify-center gap-4 px-3 py-4">
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

function ColumnLayoutPropertiesComponent({
  blockInstance,
}: {
  blockInstance: FormBlockInstance;
}) {
  const { updateBlockLayout } = useBuilder();
  const childblocks = blockInstance.childblocks ?? [];
  const width = blockInstance.attributes?.width ?? 6;

  const updateWidth = (value: number) => {
    const updated = {
      ...blockInstance,
      attributes: { ...blockInstance.attributes, width: value },
    };
    updateBlockLayout(blockInstance.id, updated.childblocks ?? []);
  };

  return (
    <div className="pt-3 w-full">
      <label className="block text-sm font-medium mb-1">Column Width (1–12)</label>
      <input
        type="number"
        min={1}
        max={12}
        value={width}
        onChange={(e) => updateWidth(Number(e.target.value))}
        className="mb-4 w-full rounded border p-1"
      />

      <div className="flex w-full flex-col items-center justify-start gap-0 px-0 py-0">
        {childblocks.map((childblock, index) => (
          <div key={childblock.id} className="flex w-full items-center justify-center gap-1">
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
        Drop a field block here
      </p>
    </div>
  );
}

function DropIndicator() {
  return (
    <div className="relative h-28 w-full border border-dotted border-primary bg-primary/10">
      <div className="absolute left-1/2 top-0 w-24 -translate-x-1/2 rounded-b-full bg-primary p-1 text-center text-xs text-white shadow-md">
        Drop here
      </div>
    </div>
  );
}

function Border() {
  return <div className="min-h-[8px] w-full rounded-t-md bg-primary" />;
}
