/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { BalanceDisplay } from "@/components/dashboard/balance-display";
import { FinancialCharts } from "@/components/dashboard/financial-charts";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { WalletActions } from "@/components/dashboard/wallet-actions";
import { RightPanelTabs } from "@/components/dashboard/right-panel-tabs";
import { WidgetConfig, WidgetProps } from "@/lib/layout/types";

interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<WidgetProps>;
  defaultConfig: WidgetConfig;
  category: "trading" | "portfolio" | "market" | "utility" | "analytics";
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
  dependencies: string[];
}

interface WidgetRegistryType {
  [key: string]: WidgetDefinition;
}

const widgetsMap: WidgetRegistryType = {
  balance: {
    id: "balance",
    name: "Balance Display",
    description: "Shows total balance and asset details",
    component: BalanceDisplay,
    defaultConfig: {
      id: "balance",
      type: "balance",
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      config: {},
      visible: true,
    },
    category: "portfolio",
    minSize: { width: 1, height: 1 },
    maxSize: { width: 3, height: 3 },
    dependencies: [],
  },
  charts: {
    id: "charts",
    name: "Financial Charts",
    description: "Displays portfolio and allocation charts",
    component: FinancialCharts,
    defaultConfig: {
      id: "charts",
      type: "charts",
      position: { x: 2, y: 0 },
      size: { width: 4, height: 3 },
      config: {},
      visible: true,
    },
    category: "analytics",
    minSize: { width: 2, height: 2 },
    maxSize: { width: 6, height: 4 },
    dependencies: [],
  },
  transactions: {
    id: "transactions",
    name: "Transaction History",
    description: "Shows recent transactions",
    component: TransactionHistory,
    defaultConfig: {
      id: "transactions",
      type: "transactions",
      position: { x: 0, y: 3 },
      size: { width: 3, height: 2 },
      config: {},
      visible: true,
    },
    category: "utility",
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 3 },
    dependencies: [],
  },
  actions: {
    id: "actions",
    name: "Wallet Actions",
    description: "Quick action buttons for wallet",
    component: WalletActions,
    defaultConfig: {
      id: "actions",
      type: "actions",
      position: { x: 0, y: 2 },
      size: { width: 3, height: 1 },
      config: {},
      visible: true,
    },
    category: "utility",
    minSize: { width: 2, height: 1 },
    maxSize: { width: 6, height: 2 },
    dependencies: [],
  },
  rightPanel: {
    id: "rightPanel",
    name: "Right Panel Tabs",
    description: "AI insights and security options",
    component: RightPanelTabs,
    defaultConfig: {
      id: "rightPanel",
      type: "rightPanel",
      position: { x: 3, y: 0 },
      size: { width: 2, height: 5 },
      config: {},
      visible: true,
    },
    category: "utility",
    minSize: { width: 1, height: 2 },
    maxSize: { width: 3, height: 6 },
    dependencies: [],
  },
  orderBook: {
    id: "orderBook",
    name: "Order Book",
    description: "Displays order book data",
    component: (props: WidgetProps) => (
      <div className="p-4 text-gray-400">Order Book Widget</div>
    ),
    defaultConfig: {
      id: "orderBook",
      type: "orderBook",
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      config: {},
      visible: true,
    },
    category: "trading",
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 4 },
    dependencies: [],
  },

  marketDepth: {
    id: "marketDepth",
    name: "Market Depth",
    description: "Shows market depth",
    component: (props: WidgetProps) => (
      <div className="p-4 text-gray-400">Market Depth Widget</div>
    ),
    defaultConfig: {
      id: "marketDepth",
      type: "marketDepth",
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      config: {},
      visible: true,
    },
    category: "trading",
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 4 },
    dependencies: [],
  },
};

export const WidgetRegistry = {
  widgets: widgetsMap,

  getWidget: (id: string): WidgetDefinition | null => {
    const widget = widgetsMap[id];
    if (!widget) {
      console.warn(`Widget with id ${id} not found`);
      return null;
    }
    return widget;
  },

  getAllWidgets: (): WidgetDefinition[] => {
    return Object.values(widgetsMap);
  },
};
