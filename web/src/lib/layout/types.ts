/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  grid: {
    columns: number;
    rows: number;
    gap: number;
  };
  widgets: WidgetConfig[]; // ✅ use real widget configs, not just IDs
  breakpoints: {
    mobile?: LayoutConfig;   // ✅ optional, no recursion requirement
    tablet?: LayoutConfig;
    desktop?: LayoutConfig;
  };
}

export interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  visible: boolean;
}

export interface WidgetProps {
  config?: Record<string, any>;
}