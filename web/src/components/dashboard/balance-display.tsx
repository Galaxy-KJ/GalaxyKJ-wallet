"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Send,
  Download,
  History,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet-store";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useOffline } from "@/hooks/use-offline";

export function BalanceDisplay() {
  const [hideBalance, setHideBalance] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const router = useRouter();
  const { isOnline } = useOffline();

  const { balance, publicKey, connectionStatus, networkConfig } =
    useWalletStore();
  const { getPrice, getChange24h } = useCryptoPrices();

  // Get real balance data
  const xlmBalance = balance?.xlm?.balance
    ? parseFloat(balance.xlm.balance)
    : 0;
  const assetBalances = balance?.assets || [];

  // Create tokens array from real data with live prices
  const tokens = [
    {
      name: "XLM",
      balance: xlmBalance,
      value: xlmBalance * getPrice("XLM"),
      change: getChange24h("XLM"),
      isNative: true,
    },
    // Add other assets from the wallet
    ...assetBalances.map((asset) => ({
      name: asset.asset.code,
      balance: parseFloat(asset.balance),
      value: parseFloat(asset.balance) * getPrice(asset.asset.code),
      change: getChange24h(asset.asset.code),
      isNative: false,
      issuer: asset.asset.issuer,
    })),
  ];

  const totalBalance = tokens.reduce((acc, token) => acc + token.value, 0);
  const isLoading = connectionStatus.isLoading;
  const isConnected = connectionStatus.isConnected;

  const shortenedKey = publicKey
    ? `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}`
    : "";

  return (
    <Card className="border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-black overflow-hidden relative group">
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all duration-700" />

      <CardContent className="p-6 relative z-10">
        {/* Top Section: Wallet Name and Key */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Primary Wallet
              </h2>
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline && isConnected
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    : "bg-red-500 shadow-[0_0_8px_rgba(239,44,44,0.6)]",
                )}
                title={isOnline && isConnected ? "Online" : "Offline"}
              />
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                isOnline && isConnected
                  ? "text-green-300 bg-green-500/10 border border-green-500/20"
                  : "text-red-300 bg-red-500/10 border border-red-500/20"
              )}>
                {isOnline && isConnected ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-400 font-mono">
              <span>{shortenedKey}</span>
              <CopyButton
                value={publicKey || ""}
                className="h-6 w-6"
                aria-label="Copy public key"
                title="Copy public key"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHideBalance(!hideBalance)}
            className="h-9 w-9 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
          >
            {hideBalance ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Balance Section */}
        <div className="mb-8">
          <div className="text-sm font-medium text-gray-400 mb-1">
            Total Estimated Balance
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {hideBalance
                ? "••••••"
                : isLoading
                  ? "..."
                  : `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </h1>
            {!hideBalance && !isLoading && (
              <span className="text-lg font-medium text-gray-400">USD</span>
            )}
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-green-400 font-semibold bg-green-500/10 px-2 py-0.5 rounded-full mr-2">
              +1.8%
            </span>
            <span className="text-gray-500">vs 24h ago</span>
          </div>
          {connectionStatus.error && (
            <div className="mt-3 text-xs text-red-500 flex items-center gap-1 bg-red-500/10 p-2 rounded-md border border-red-500/20">
              <Info className="h-3 w-3" />
              {connectionStatus.error}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Button
            className="w-full flex flex-row sm:flex-col h-14 sm:h-20 bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-2xl gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => router.push("/send-receive?tab=send")}
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Send</span>
          </Button>
          <Button
            variant="secondary"
            className="w-full flex flex-row sm:flex-col h-14 sm:h-20 bg-gray-800 hover:bg-gray-700 text-white border-0 rounded-2xl gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => router.push("/send-receive?tab=receive")}
            aria-label="Receive"
          >
            <Download className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Receive</span>
          </Button>
          <Button
            variant="secondary"
            className="w-full flex flex-row sm:flex-col h-14 sm:h-20 bg-gray-800 hover:bg-gray-700 text-white border-0 rounded-2xl gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => router.push("/transactions")}
            aria-label="Transactions"
          >
            <History className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Transactions</span>
          </Button>
        </div>

        {/* Assets Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Portfolio Assets
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTokens(!showTokens)}
              className="h-8 text-xs font-semibold hover:bg-gray-800 rounded-lg flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showTokens ? "Minimize" : "View All"}
              {showTokens ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {tokens.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm italic">
                {isLoading ? "Fetching assets..." : "No assets discovered"}
              </div>
            ) : (
              tokens
                .slice(0, showTokens ? tokens.length : 2)
                .map((token, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 rounded-2xl bg-gray-800/20 border border-gray-800/40 hover:bg-gray-800/40 hover:border-gray-700/60 transition-all cursor-pointer group/asset"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5 group-hover/asset:scale-110 transition-transform">
                        <span className="text-sm font-black text-blue-400">
                          {token.name.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-white">{token.name}</div>
                        <div className="text-xs text-gray-500 font-medium">
                          {hideBalance
                            ? "•••••"
                            : `${token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.name}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        {hideBalance
                          ? "•••••"
                          : `$${token.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                      <div
                        className={cn(
                          "text-xs font-bold flex items-center justify-end gap-0.5",
                          token.change >= 0 ? "text-green-400" : "text-red-400",
                        )}
                      >
                        {token.change >= 0 ? "+" : ""}
                        {token.change}%
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
