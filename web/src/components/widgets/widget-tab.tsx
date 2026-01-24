"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  Grip,
  Save,
  Proportions,
  Bell,
  Plus,
  Eye,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomSelect } from "@/components/ui/custom-select";

interface Widget {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
}

const defaultWidgets: Widget[] = [
  {
    id: "portfolio",
    name: "Portfolio Overview",
    description:
      "Shows your portfolio value, distribution, and performance metrics.",
    status: "active",
  },
  {
    id: "quick-actions",
    name: "Quick Actions",
    description:
      "Provides quick access to common actions like send, receive, and swap.",
    status: "active",
  },
  {
    id: "market",
    name: "Market Overview",
    description:
      "Shows current market trends and prices for your favorite assets.",
    status: "active",
  },
  {
    id: "transactions",
    name: "Recent Transactions",
    description: "Lists your most recent transaction activity.",
    status: "active",
  },
  {
    id: "alerts",
    name: "Price Alerts",
    description: "Shows your active price alerts and notifications.",
    status: "active",
  },
];

const marketplaceWidgets: Widget[] = [
  {
    id: "nft-gallery",
    name: "NFT Gallery",
    description: "Display and manage your NFT collection.",
    status: "inactive",
  },
  {
    id: "defi-yield",
    name: "DeFi Yield Tracker",
    description: "Monitor your DeFi investments and yields.",
    status: "inactive",
  },
  {
    id: "gas-tracker",
    name: "Gas Tracker",
    description: "Real-time gas fees and predictions.",
    status: "inactive",
  },
  {
    id: "token-swap",
    name: "Quick Swap",
    description: "Instantly swap tokens at best rates.",
    status: "inactive",
  },
];

export const WidgetTab = () => {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutConfig, setLayoutConfig] = useState({
    type: "grid",
    columns: 3,
    spacing: "medium",
    animation: "fade",
    refreshInterval: 30,
    autoArrange: true,
  });
  const [widgetSettings, setWidgetSettings] = useState({
    refreshInterval: 30,
    showBorder: true,
    enableAnimations: true,
    notifications: true,
  });

  const handleConfigure = (widget: Widget) => {
    setSelectedWidget(widget);
    setIsConfigOpen(true);
  };

  const handleRemove = (widgetId: string) => {
    setWidgets(
      widgets.map((w) =>
        w.id === widgetId ? { ...w, status: "inactive" } : w,
      ),
    );
  };

  const handleAddWidget = () => {
    setIsMarketplaceOpen(true);
  };

  const handleSaveSettings = () => {
    if (selectedWidget) {
      setWidgets(
        widgets.map((w) =>
          w.id === selectedWidget.id ? { ...w, ...widgetSettings } : w,
        ),
      );
      setIsConfigOpen(false);
    }
  };

  const handleAddFromMarketplace = (widget: Widget) => {
    const existingWidget = widgets.find((w) => w.id === widget.id);
    if (existingWidget) {
      setWidgets(
        widgets.map((w) =>
          w.id === widget.id ? { ...w, status: "active" } : w,
        ),
      );
    } else {
      setWidgets([...widgets, { ...widget, status: "active" }]);
    }
  };

  const filteredMarketplaceWidgets = marketplaceWidgets.filter(
    (widget) =>
      widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const layoutTypeOptions = [
    { value: "grid", label: "Grid Layout" },
    { value: "list", label: "List Layout" },
    { value: "custom", label: "Custom Layout" },
  ];

  const columnOptions = [
    { value: "1", label: "1 Column" },
    { value: "2", label: "2 Columns" },
    { value: "3", label: "3 Columns" },
    { value: "4", label: "4 Columns" },
  ];

  const spacingOptions = [
    { value: "compact", label: "Compact" },
    { value: "medium", label: "Medium" },
    { value: "spacious", label: "Spacious" },
  ];

  const animationOptions = [
    { value: "fade", label: "Fade" },
    { value: "slide", label: "Slide" },
    { value: "scale", label: "Scale" },
    { value: "none", label: "None" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-[#5298e8] to-[#7C3AED] bg-clip-text text-transparent">
            Widget Configuration
          </h1>
          <p className="text-gray-400 text-sm">
            Customize your dashboard with widgets and personalized views
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="text-foreground bg-card hover:bg-accent"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button className="bg-gradient-to-r from-[#7C3AED] to-[#3a72ea] hover:opacity-90">
            <span>
              <Save className="w-4 h-4 mr-2" />
            </span>
            Save Layout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="widgets" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-transparent">
          <TabsTrigger
            value="widgets"
            className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500 text-muted-foreground"
          >
            <Proportions className="w-4 h-4 mr-2" />
            Widgets
          </TabsTrigger>
          <TabsTrigger
            value="custom-views"
            className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500 text-muted-foreground"
          >
            <Eye className="w-4 h-4 mr-2" />
            Custom Views
          </TabsTrigger>
          <TabsTrigger
            value="price-alerts"
            className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500 text-muted-foreground"
          >
            <Bell className="w-4 h-4 mr-2" />
            Price Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="widgets">
          {/* Available Widgets Section */}
          <div className="flex justify-between mb-4 mt-4 items-center">
            <h2 className="text-xl font-semibold">Available Widgets</h2>
            <Button
              onClick={handleAddWidget}
              className="bg-gradient-to-r from-[#7C3AED] to-[#3a72ea]  hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <Card
                key={widget.id}
                className="bg-card/40 border border-border rounded-xl shadow-lg transition-all hover:bg-accent/40 p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <span className="text-gray-400">
                        <Grip className="w-4 h-4" />
                      </span>
                      <h3 className="text-lg font-medium">{widget.name}</h3>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          widget.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {widget.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{widget.description}</p>
                  <div className="flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleConfigure(widget)}
                      className="bg-black/50 font-semibold hover:bg-black flex items-center gap-2"
                    >
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(widget.id)}
                      className="text-red-400 flex items-center gap-1 hover:bg-red-950/30"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add Widget Card */}
            <Card className="bg-card/10 border-2 border-dashed border-border rounded-xl shadow-lg transition-all hover:border-purple-500/50 hover:bg-card/20 p-6 flex flex-col items-center justify-center text-center min-h-[200px] cursor-pointer group">
              <div className="w-12 h-12 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Plus className="w-10 h-10 text-gray-500 group-hover:text-purple-400" />
              </div>
              <p className="text-gray-400 mb-4 group-hover:text-gray-300">
                Add more widgets from the marketplace
              </p>
              <Button
                variant="ghost"
                className="text-gray-200 bg-black/50 hover:bg-black group-hover:bg-purple-900/20"
                onClick={handleAddWidget}
              >
                Browse Marketplace
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom-views">
          {/* Custom Views Content */}
        </TabsContent>

        <TabsContent value="price-alerts">
          {/* Price Alerts Content */}
        </TabsContent>
      </Tabs>

      {/* Layout Configuration Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Layout Configuration</h2>
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Layout Type"
              value={layoutConfig.type}
              options={layoutTypeOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, type: value })
              }
            />

            <CustomSelect
              label="Column Count (Desktop)"
              value={layoutConfig.columns.toString()}
              options={columnOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, columns: parseInt(value) })
              }
            />

            <CustomSelect
              label="Widget Spacing"
              value={layoutConfig.spacing}
              options={spacingOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, spacing: value })
              }
            />

            <CustomSelect
              label="Animation Style"
              value={layoutConfig.animation}
              options={animationOptions}
              onChange={(value) =>
                setLayoutConfig({ ...layoutConfig, animation: value })
              }
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Auto-refresh Interval: {layoutConfig.refreshInterval}s
            </label>
            <Slider
              value={[layoutConfig.refreshInterval]}
              onValueChange={(value) =>
                setLayoutConfig({ ...layoutConfig, refreshInterval: value[0] })
              }
              min={5}
              max={300}
              step={5}
              className="py-4"
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <Switch
              checked={layoutConfig.autoArrange}
              onCheckedChange={(checked) =>
                setLayoutConfig({ ...layoutConfig, autoArrange: checked })
              }
              className="data-[state=checked]:bg-[#7C3AED]  data-[state=unchecked]:bg-gray-700"
            />
            <label className="text-sm text-gray-400">
              Auto-arrange widgets based on usage frequency
            </label>
          </div>
        </div>
      </section>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              Configure {selectedWidget?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Customize how this widget appears and behaves
            </DialogDescription>
          </DialogHeader>
          {selectedWidget && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="refresh">Refresh Interval (seconds)</Label>
                <Input
                  id="refresh"
                  type="number"
                  value={widgetSettings.refreshInterval}
                  onChange={(e) =>
                    setWidgetSettings({
                      ...widgetSettings,
                      refreshInterval: parseInt(e.target.value),
                    })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="border">Show Border</Label>
                <Switch
                  id="border"
                  checked={widgetSettings.showBorder}
                  onCheckedChange={(checked) =>
                    setWidgetSettings({
                      ...widgetSettings,
                      showBorder: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="animations">Enable Animations</Label>
                <Switch
                  id="animations"
                  checked={widgetSettings.enableAnimations}
                  onCheckedChange={(checked) =>
                    setWidgetSettings({
                      ...widgetSettings,
                      enableAnimations: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <Switch
                  id="notifications"
                  checked={widgetSettings.notifications}
                  onCheckedChange={(checked) =>
                    setWidgetSettings({
                      ...widgetSettings,
                      notifications: checked,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsConfigOpen(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="bg-gradient-to-r from-[#7C3AED] to-[#3a72ea] hover:opacity-90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marketplace Dialog */}
      <Dialog open={isMarketplaceOpen} onOpenChange={setIsMarketplaceOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              Widget Marketplace
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Browse and add new widgets to your dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700"
            />
          </div>
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMarketplaceWidgets.map((widget) => (
                <Card
                  key={widget.id}
                  className="bg-gray-900/40 border border-gray-800 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-200">{widget.name}</h3>
                    <Button
                      size="sm"
                      onClick={() => handleAddFromMarketplace(widget)}
                      className="bg-gradient-to-r from-[#7C3AED] to-[#3a72ea] hover:opacity-90"
                    >
                      Add Widget
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">{widget.description}</p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
