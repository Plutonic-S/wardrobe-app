import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export interface DraggableItem {
  id: string;
  [key: string]: unknown;
}

interface UseDragAndDropOptions<T extends DraggableItem> {
  items: T[];
  onReorder?: (items: T[]) => void;
  onDrop?: (draggedItem: T, targetId: string | null) => void;
  onDragStart?: (item: T) => void;
  strategy?: typeof verticalListSortingStrategy;
  activationDistance?: number;
  activationDelay?: number;
}

export function useDragAndDrop<T extends DraggableItem>({
  items,
  onReorder,
  onDrop,
  onDragStart: onDragStartCallback,
  strategy = verticalListSortingStrategy,
  activationDistance = 8,
  activationDelay = 250,
}: UseDragAndDropOptions<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [localItems, setLocalItems] = useState<T[]>(items);

  // Sync local items with prop changes
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: activationDistance, // Configurable movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: activationDelay, // Configurable press duration required
        tolerance: 5, // 5px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle drag start event
   * Sets the currently dragged item and triggers callback
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const draggedItem = localItems.find((item) => item.id === active.id);

      if (draggedItem) {
        setActiveItem(draggedItem);
        // Call external callback if provided
        if (onDragStartCallback) {
          onDragStartCallback(draggedItem);
        }
      }
    },
    [localItems, onDragStartCallback]
  );

  /**
   * Handle drag over event
   * Updates the position of items as the user drags
   */
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      setLocalItems((items) => {
        const activeIndex = items.findIndex((item) => item.id === active.id);
        const overIndex = items.findIndex((item) => item.id === over.id);

        if (activeIndex !== -1 && overIndex !== -1) {
          return arrayMove(items, activeIndex, overIndex);
        }

        return items;
      });
    },
    []
  );

  /**
   * Handle drag end event
   * Finalizes the drag operation and triggers callbacks
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const draggedItem = localItems.find((item) => item.id === active.id);

      // Clear active item first
      setActiveItem(null);

      if (!draggedItem) {
        console.warn('[useDragAndDrop] Dragged item not found:', active.id);
        return;
      }

      if (!over) {
        // Dragged outside any drop zone
        if (onDrop) {
          onDrop(draggedItem, null);
        }
        return;
      }

      // If dropped on a different position
      if (active.id !== over.id) {
        const activeIndex = localItems.findIndex((item) => item.id === active.id);
        const overIndex = localItems.findIndex((item) => item.id === over.id);

        // Only reorder if both items exist in the list (sortable scenario)
        if (activeIndex !== -1 && overIndex !== -1) {
          const newItems = arrayMove(localItems, activeIndex, overIndex);
          setLocalItems(newItems);

          // Call onReorder callback with new order
          if (onReorder) {
            onReorder(newItems);
          }
        }

        // Call onDrop callback if provided (for canvas drop scenarios)
        if (onDrop) {
          onDrop(draggedItem, over.id as string);
        }
      } else if (onDrop) {
        // Dropped on the same position but onDrop exists (canvas scenario)
        onDrop(draggedItem, over.id as string);
      }
    },
    [localItems, onDrop, onReorder]
  );

  /**
   * Cancel drag operation
   * Resets active item and optionally reverts item positions
   */
  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    // Revert to original items if needed
    setLocalItems(items);
  }, [items]);

  /**
   * Manually update items (useful for external updates)
   */
  const updateItems = useCallback((newItems: T[]) => {
    setLocalItems(newItems);
  }, []);

  /**
   * Reset items to initial state
   */
  const resetItems = useCallback(() => {
    setLocalItems(items);
    setActiveItem(null);
  }, [items]);

  return {
    // DnD Context props
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,

    // State
    activeItem,
    items: localItems,
    isDragging: activeItem !== null,

    // Methods
    updateItems,
    resetItems,

    // Strategy
    strategy,

    // Components (for convenience)
    DndContext,
    DragOverlay,
    SortableContext,
    collisionDetection: closestCorners,
  };
}
