'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useDrag, useDrop, XYCoord } from 'react-dnd';

/** Common DnD item definition */
export interface DragItem {
  id: string;
  index: number;
  type: string;
  parentId: string;
}

/**
 * Stable and memo-safe DnD reorder hook
 *
 * Supports:
 * - Same-container reordering
 * - Cross-container movement
 * - Vertical and horizontal axis detection
 */
export function useReorderDnD(
  itemType: string,
  index: number,
  parentId: string,
  moveItem: (
    dragIndex: number,
    hoverIndex: number,
    sourceParentId: string,
    targetParentId: string
  ) => void,
  axis: 'vertical' | 'horizontal' = 'vertical'
) {
  const ref = useRef<HTMLDivElement>(null);

  // Memoize static identifiers for the item
  const dragItemData = useMemo<DragItem>(
    () => ({
      id: `${parentId}-${index}-${itemType}`,
      index,
      type: itemType,
      parentId,
    }),
    [parentId, index, itemType]
  );

  const [, drag] = useDrag({
    type: itemType,
    item: dragItemData,
    collect: () => ({}),
  });

  const [, drop] = useDrop<DragItem>({
    accept: itemType,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      const sourceParent = item.parentId;
      const targetParent = parentId;

      // Skip if identical
      if (dragIndex === hoverIndex && sourceParent === targetParent) return;

      const rect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset() as XYCoord | null;
      if (!clientOffset) return;

      let shouldMove = false;

      if (axis === 'vertical') {
        const middleY = (rect.bottom - rect.top) / 2;
        const offsetY = clientOffset.y - rect.top;
        shouldMove =
          (dragIndex < hoverIndex && offsetY > middleY) ||
          (dragIndex > hoverIndex && offsetY < middleY);
      } else {
        const middleX = (rect.right - rect.left) / 2;
        const offsetX = clientOffset.x - rect.left;
        shouldMove =
          (dragIndex < hoverIndex && offsetX > middleX) ||
          (dragIndex > hoverIndex && offsetX < middleX);
      }

      if (shouldMove) {
        moveItem(dragIndex, hoverIndex, sourceParent, targetParent);
        // update mutable drag data so future hover() calls stay consistent
        item.index = hoverIndex;
        item.parentId = targetParent;
      }
    },
  });

  // attach drag + drop once (prevent multiple rebindings)
  useEffect(() => {
    if (ref.current) drag(drop(ref));
  }, [drag, drop]);

  return ref;
}
