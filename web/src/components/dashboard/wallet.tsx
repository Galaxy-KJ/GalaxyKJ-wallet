/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCallback } from "react";
import { StarBackground } from "@/components/effects/star-background";
import { Header } from "@/components/layout/header/header";
import { useWalletStore } from "@/store/wallet-store";
import { useWalletSync } from "@/hooks/use-wallet-sync";
import { Button } from "@/components/ui/button";
import { useCustomViewStore } from "@/store/custom-view-store";
import { LayoutEngine } from "@/lib/layout/layout-engine";
import { WidgetRegistry } from "@/lib/widgets/widget-registry";

export function Wallet() {
  const { publicKey, account, balance, transactions, connectionStatus, syncWallet, networkConfig } = useWalletStore();
  const walletSyncResult = useWalletSync();
  const { views, activeViewId } = useCustomViewStore();
  const activeView = views.find((v) => v.id === activeViewId);

  const onSyncSuccess = useCallback(() => {
    console.log("Wallet synced successfully");
  }, []);

  const onSyncError = useCallback((error: string) => {
    console.error("Wallet sync failed:", error);
  }, []);

  const { isSyncing, connectionStatus: syncStatus } = walletSyncResult;
  const { isLoading, isConnected, error } = syncStatus;

  const handleCreateWallet = () => {
    console.log("Create wallet clicked from dashboard");
  };

  const handleLogin = () => {
    console.log("Login clicked from dashboard");
  };

  if (!publicKey) {
    return (
      <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
        <StarBackground />
        <div className="relative z-10 container mx-auto px-4 py-6">
          <Header onCreateWallet={handleCreateWallet} onLogin={handleLogin} />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">No Wallet Loaded</h1>
              <p className="text-gray-400">Please create a wallet or login to continue.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
      <StarBackground />
      <div className="relative z-10 container mx-auto px-4 py-6">
        <Header onCreateWallet={handleCreateWallet} onLogin={handleLogin} />
        <div className="mb-4 flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : error ? "bg-red-500" : "bg-yellow-500"}`} />
            <span className="text-sm">
              {isLoading ? "Syncing..." : isConnected ? `Connected to ${networkConfig.type}` : error ? "Connection failed" : "Connecting..."}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {connectionStatus.lastSyncTime && (
              <span className="text-xs text-gray-400">Last sync: {connectionStatus.lastSyncTime.toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {activeView && (
          <div>
            {LayoutEngine.renderLayout(
              activeView.layoutConfig,
              activeView.widgetConfigs.map((wc) => ({
                ...wc,
                component: WidgetRegistry.getWidget(wc.type)?.component || (() => <div>Unknown Widget</div>),
              })),
              "desktop",
              (widgetId: string, newPosition: { x: number; y: number }) => {
                // Handle widget drop logic here
              },
              (widgetId: string, newSize: { width: number; height: number }) => {
                // Handle widget resize logic here
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}