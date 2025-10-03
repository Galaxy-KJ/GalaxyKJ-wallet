/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect } from "react";
import { LayoutConfig, WidgetConfig } from "./types";
import { WidgetRegistry } from "@/lib/widgets/widget-registry";
import { DragDropSystem } from "@/lib/layout/drag-drop-system";

export const LayoutEngine = {
  renderLayout: (
    config: LayoutConfig,
    widgets: WidgetConfig[],
    breakpoint: "mobile" | "tablet" | "desktop" = "desktop",
    onWidgetDrop: (widgetId: string, newPosition: { x: number; y: number }) => void,
    onResize: (widgetId: string, newSize: { width: number; height: number }) => void
  ): React.ReactElement => {
    const layout = config.breakpoints?.[breakpoint] || config;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.grid.columns}, 1fr)`,
          gridTemplateRows: `repeat(${layout.grid.rows}, auto)`,
          gap: `${layout.grid.gap}px`,
          width: "100%",
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {widgets
          .filter((w) => w.visible)
          .map((widget: WidgetConfig) => (
            <WidgetWrapper
              key={widget.id}
              widget={widget}
              onResize={onResize}
              onWidgetDrop={onWidgetDrop}
            />
          ))}
      </div>
    );
  },

  validateLayout: (config: LayoutConfig, widgets: WidgetConfig[]): boolean => {
    if (!config || !widgets) return false;

    const { columns, rows } = config.grid;

    return widgets.every((w) => {
      const endX = w.position.x + w.size.width;
      const endY = w.position.y + w.size.height;

      if (w.position.x < 0 || w.position.y < 0 || endX > columns || endY > rows) {
        return false;
      }

      const hasOverlap = widgets.some((other) => {
        if (other.id === w.id) return false;

        const otherEndX = other.position.x + other.size.width;
        const otherEndY = other.position.y + other.size.height;

        return (
          w.position.x < otherEndX &&
          endX > other.position.x &&
          w.position.y < otherEndY &&
          endY > other.position.y
        );
      });

      return !hasOverlap;
    });
  },
};

// Separate component to handle refs and hooks properly
const WidgetWrapper: React.FC<{
  widget: WidgetConfig;
  onResize: (widgetId: string, newSize: { width: number; height: number }) => void;
  onWidgetDrop: (widgetId: string, newPosition: { x: number; y: number }) => void;
}> = ({ widget, onResize, onWidgetDrop }) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle drag
  const { isDragging, drag } = DragDropSystem.useWidgetDrag(
    widget.id,
    widgetRef as React.RefObject<HTMLDivElement>,
    () => {}
  );

  // Handle resize
  const { handleMouseDown } = DragDropSystem.useResizeHandle(
    widget,
    (newSize) => onResize(widget.id, newSize)
  );

  useEffect(() => {
    if (widgetRef.current) {
      drag(widgetRef.current);
    }
  }, [drag]);

  const widgetDef = WidgetRegistry.getWidget(widget.type);
  if (!widgetDef) return null;

  const { component: WidgetComponent } = widgetDef;

  return (
    <div
      ref={widgetRef}
      style={{
        gridColumn: `${widget.position.x + 1} / span ${widget.size.width}`,
        gridRow: `${widget.position.y + 1} / span ${widget.size.height}`,
        border: "1px solid #333",
        backgroundColor: "rgba(30, 30, 30, 0.8)",
        padding: "10px",
        overflow: "hidden",
        borderRadius: "4px",
        position: "relative",
        cursor: "move",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <WidgetComponent config={widget.config} />
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "15px",
          height: "15px",
          backgroundColor: "#666",
          cursor: "se-resize",
          borderRadius: "0 0 4px 0",
        }}
      />
    </div>
  );
};