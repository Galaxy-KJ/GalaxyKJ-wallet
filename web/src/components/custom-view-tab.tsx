"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChartColumn, Table2, Wallet, Plus } from "lucide-react";
import { useCustomViewStore, CustomView } from "@/store/custom-view-store";
import { WidgetRegistry } from "@/lib/widgets/widget-registry";
import { LayoutConfig, WidgetConfig } from "@/lib/layout/types";

const CustomViewTab: React.FC = () => {
  const { views, addView, setActiveView, updateView, syncWithDatabase } = useCustomViewStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveViewLocal] = useState<CustomView | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | undefined>(undefined);
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetConfig[]>([]);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeView) {
      setNewTitle(activeView.name);
      setNewDescription(activeView.description);
      setLayoutConfig(activeView.layoutConfig);
      setSelectedWidgets(activeView.widgetConfigs);
    }
  }, [activeView]);

  /** Utility: create a default layout with given widgets */
  const createDefaultLayout = useCallback((widgetTypes: string[]): LayoutConfig => {
    return {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      grid: { columns: 6, rows: 6, gap: 10 },
      widgets: widgetTypes
        .map((type) => {
          const widgetDef = WidgetRegistry.getWidget(type);
          return widgetDef
            ? { ...widgetDef.defaultConfig, id: crypto.randomUUID(), type }
            : null;
        })
        .filter((w): w is WidgetConfig => w !== null),
      breakpoints: {}, // ✅ no redundant recursion needed
    };
  }, []);

  const openModal = (view: CustomView | null) => {
    setActiveViewLocal(view);
    setNewTitle(view?.name || "");
    setNewDescription(view?.description || "");
    setLayoutConfig(
      view?.layoutConfig ||
        createDefaultLayout([]) // ✅ fallback to clean empty layout
    );
    setSelectedWidgets(view?.widgetConfigs || []);
    setIsModalOpen(true);
  };

  const handleSetDefault = (id: string) => {
    updateView(id, { isDefault: true });
    views.forEach((v) => v.id !== id && updateView(v.id, { isDefault: false }));
  };

  const handleEdit = (id: string) => openModal(views.find((v) => v.id === id) || null);

  const handleCreate = () => openModal(null);

  const handleSave = () => {
    if (activeView) {
      updateView(activeView.id, {
        name: newTitle,
        description: newDescription,
        layoutConfig: layoutConfig!,
        widgetConfigs: selectedWidgets,
        updatedAt: new Date(),
      });
    } else {
      addView({
        userId: "user-123", // Replace with actual user ID
        name: newTitle,
        description: newDescription,
        layoutConfig: layoutConfig!,
        widgetConfigs: selectedWidgets,
        isDefault: !views.some((v) => v.isDefault),
      });
    }
    syncWithDatabase();
    setIsModalOpen(false);
    setActiveViewLocal(null);
  };

  const handleAddWidget = (widgetId: string) => {
    const widgetDef = WidgetRegistry.getWidget(widgetId);
    if (widgetDef && !selectedWidgets.some((w) => w.type === widgetId)) {
      setSelectedWidgets([
        ...selectedWidgets,
        {
          ...widgetDef.defaultConfig,
          id: crypto.randomUUID(),
          type: widgetId,
        },
      ]);
    }
  };

  /** Default views to preload if no user views exist */
  const defaultViews = [
    {
      id: "trading",
      name: "Trading View",
      description: "Optimized for active trading",
      icon: <ChartColumn className="text-purple-500 w-10 h-10" />,
      layoutConfig: createDefaultLayout(["charts", "orderBook", "actions", "marketDepth"]),
      widgetConfigs: ["charts", "orderBook", "actions", "marketDepth"]
        .map((type) => {
          const widgetDef = WidgetRegistry.getWidget(type);
          return widgetDef
            ? { ...widgetDef.defaultConfig, id: crypto.randomUUID(), type }
            : null;
        })
        .filter((w): w is WidgetConfig => w !== null),
    },
    {
      id: "portfolio",
      name: "Portfolio View",
      description: "Focus on portfolio performance",
      icon: <Wallet className="text-purple-500 w-10 h-10" />,
      layoutConfig: createDefaultLayout(["balance", "charts", "transactions"]),
      widgetConfigs: ["balance", "charts", "transactions"]
        .map((type) => {
          const widgetDef = WidgetRegistry.getWidget(type);
          return widgetDef
            ? { ...widgetDef.defaultConfig, id: crypto.randomUUID(), type }
            : null;
        })
        .filter((w): w is WidgetConfig => w !== null),
    },
    {
      id: "minimal",
      name: "Minimal View",
      description: "Simplified dashboard with essentials",
      icon: <Table2 className="text-purple-500 w-10 h-10" />,
      layoutConfig: createDefaultLayout(["balance", "actions", "transactions"]),
      widgetConfigs: ["balance", "actions", "transactions"]
        .map((type) => {
          const widgetDef = WidgetRegistry.getWidget(type);
          return widgetDef
            ? { ...widgetDef.defaultConfig, id: crypto.randomUUID(), type }
            : null;
        })
        .filter((w): w is WidgetConfig => w !== null),
    },
  ];

  useEffect(() => {
    if (views.length === 0) {
      defaultViews.forEach((view) =>
        addView({
          ...view,
          userId: "user-123",
          isDefault: view.id === "portfolio",
        })
      );
      setActiveView(defaultViews[1].id);
      syncWithDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-medium text-white">Custom Views</h2>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4 mr-1" /> Create New View
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {views.map((view) => (
          <div
            key={view.id}
            className="backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-5 text-gray-200"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between mb-1">
                <h3 className="text-base font-medium text-white">{view.name}</h3>
                {view.isDefault && (
                  <span className="text-xs text-green-400 font-medium px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4">{view.description}</p>
              <div className="flex bg-gray-800/30 justify-center py-10 mb-4 text-center">
                {defaultViews.find((v) => v.id === view.id)?.icon}
              </div>
              <div className="flex justify-between mt-auto">
                <button
                  onClick={() => handleEdit(view.id)}
                  className="px-3 py-1 text-xs font-medium bg-gray-900 hover:bg-gray-700 rounded text-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleSetDefault(view.id)}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    view.isDefault
                      ? "bg-gray-700 text-gray-300 cursor-default"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                  }`}
                  disabled={view.isDefault}
                >
                  Set as Default
                </button>
              </div>
            </div>
          </div>
        ))}

        <div
          className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 border-dashed rounded-lg shadow-lg p-5 flex flex-col items-center justify-center hover:bg-gray-800/30 transition text-gray-400 h-full cursor-pointer"
          onClick={handleCreate}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-gray-500 text-4xl mb-3">+</div>
            <p className="text-sm mb-1">Create a new custom view</p>
            <button className="mt-4 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium text-white">
              Create View
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {activeView ? `Edit ${activeView.name}` : "Create New View"}
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <span className="text-gray-400 hover:text-white text-xl">×</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-4">
                <input
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                  placeholder="View Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <textarea
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                  rows={3}
                  placeholder="View Description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <div className="bg-gray-800/30 p-2 rounded max-h-96 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Widget Marketplace</h3>
                  {WidgetRegistry.getAllWidgets().map((widget) => (
                    <button
                      key={widget.id}
                      onClick={() => handleAddWidget(widget.id)}
                      className="w-full text-left p-2 mb-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200"
                      disabled={selectedWidgets.some((w) => w.type === widget.id)}
                    >
                      {widget.name}
                      {selectedWidgets.some((w) => w.type === widget.id) && (
                        <span className="ml-2 text-xs text-green-400">✓ Added</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-3 relative">
                <div
                  ref={dropZoneRef}
                  className="w-full rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/30 p-4"
                  style={{ height: "500px", position: "relative" }}
                >
                  {selectedWidgets.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Add widgets from the marketplace to start building your view</p>
                    </div>
                  ) : (
                    selectedWidgets.map((widget) => {
                      const widgetDef = WidgetRegistry.getWidget(widget.type);
                      const WidgetComponent = widgetDef?.component;

                      return (
                        <div
                          key={widget.id}
                          style={{
                            position: "absolute",
                            left: `${widget.position.x * 80}px`,
                            top: `${widget.position.y * 80}px`,
                            width: `${widget.size.width * 80}px`,
                            height: `${widget.size.height * 80}px`,
                            border: "1px solid #555",
                            backgroundColor: "rgba(40, 40, 40, 0.9)",
                            cursor: "move",
                            borderRadius: "4px",
                            padding: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <div className="text-xs text-gray-400 mb-2">{widgetDef?.name}</div>
                          {WidgetComponent ? <WidgetComponent /> : <div>Unknown Widget</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <button
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded text-white mt-4 disabled:bg-gray-700 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={!newTitle.trim() || !layoutConfig}
            >
              Save View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomViewTab;