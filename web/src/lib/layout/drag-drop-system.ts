// web/src/lib/layout/drag-drop-system.ts
import { useDrag, useDrop, DragSourceMonitor, DropTargetMonitor } from "react-dnd";
import { WidgetConfig } from "./types";

const ItemTypes = {
  WIDGET: "widget",
  RESIZE: "resize",
};

export const DragDropSystem = {
  // Dragging logic for widgets - Updated to accept nullable ref
  useWidgetDrag: (
    id: string,
    ref: React.RefObject<HTMLDivElement | null>,  // Changed to accept nullable ref
    onDrag: (isDragging: boolean) => void
  ) => {
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.WIDGET,
      item: { id },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    // Only attach drag if ref.current exists
    if (ref.current) {
      drag(ref);
    }
    
    onDrag(isDragging);
    return { isDragging, drag };
  },

  // Drop zone logic for placing widgets
  useDropZone: (
    ref: React.RefObject<HTMLDivElement | null>,  // Changed to accept nullable ref
    onDrop: (item: { id: string }, position: { x: number; y: number }) => void
  ) => {
    const [, drop] = useDrop({
      accept: ItemTypes.WIDGET,
      drop: (item: { id: string }, monitor: DropTargetMonitor) => {
        const offset = monitor.getClientOffset();
        if (offset && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const x = Math.floor((offset.x - rect.left) / 200); // 200px per grid cell
          const y = Math.floor((offset.y - rect.top) / 200);
          onDrop(item, { x, y });
        }
      },
    });
    
    if (ref.current) {
      drop(ref);
    }
  },

  // Resizing logic for widgets
  useResizeHandle: (
    widget: WidgetConfig,
    onResize: (newSize: { width: number; height: number }) => void
  ) => {
    const [, drag] = useDrag({
      type: ItemTypes.RESIZE,
      item: { id: widget.id, type: "resize" },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const handleResize = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent triggering drag on parent
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = widget.size.width;
      const startHeight = widget.size.height;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = Math.round((moveEvent.clientX - startX) / 200); // 200px per grid cell
        const dy = Math.round((moveEvent.clientY - startY) / 200);
        
        const newWidth = Math.max(1, Math.min(startWidth + dx, 6)); // Max 6 columns
        const newHeight = Math.max(1, Math.min(startHeight + dy, 6)); // Max 6 rows
        
        onResize({
          width: newWidth,
          height: newHeight,
        });
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    return { drag, handleMouseDown: handleResize };
  },
};