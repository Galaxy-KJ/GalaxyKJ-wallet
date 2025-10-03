import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LayoutConfig, WidgetConfig } from "@/lib/layout/types";

export interface CustomView {
  id: string;
  userId: string;
  name: string;
  description: string;
  layoutConfig: LayoutConfig;
  widgetConfigs: WidgetConfig[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomViewState {
  views: CustomView[];
  activeViewId: string | null;
  widgetConfigs: Record<string, WidgetConfig>;
  addView: (view: Omit<CustomView, "id" | "createdAt" | "updatedAt">) => void;
  setActiveView: (id: string) => void;
  updateView: (id: string, updates: Partial<CustomView>) => void;
  deleteView: (id: string) => void;
  syncWithDatabase: () => Promise<void>;
}

export const useCustomViewStore = create<CustomViewState>()(
  persist(
    (set, get) => ({
      views: [],
      activeViewId: null,
      widgetConfigs: {},
      addView: (view) =>
        set((state) => {
          const newView = {
            ...view,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return { views: [...state.views, newView] };
        }),
      setActiveView: (id) => set({ activeViewId: id }),
      updateView: (id, updates) =>
        set((state) => ({
          views: state.views.map((v) =>
            v.id === id ? { ...v, ...updates, updatedAt: new Date() } : v
          ),
        })),
      deleteView: (id) =>
        set((state) => ({
          views: state.views.filter((v) => v.id !== id),
        })),
      syncWithDatabase: async () => {
        const state = get();
        await fetch("/api/views/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ views: state.views, activeViewId: state.activeViewId }),
        });
      },
    }),
    { name: "custom-views" }
  )
);