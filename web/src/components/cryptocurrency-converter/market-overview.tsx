"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { RefreshCw } from "lucide-react";

export default function MarketOverview() {
  const { prices, loading, error, refreshPrices, retryWithDelay, dataSource } =
    useCryptoPrices();

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(4);
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const sign = isPositive ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-3 bg-muted rounded w-12"></div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-yellow-400 mb-2">
              <p className="text-sm">💾 Using cached prices</p>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time APIs temporarily unavailable
              </p>
            </div>
            <button
              onClick={retryWithDelay}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Try Live Data
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Market Overview
          </CardTitle>
          {dataSource === "cache" && (
            <p className="text-xs text-yellow-400 mt-1">💾 Cached Data</p>
          )}
          {dataSource === "coingecko" && (
            <p className="text-xs text-green-400 mt-1">🟢 CoinGecko</p>
          )}
          {dataSource === "cryptocompare" && (
            <p className="text-xs text-blue-400 mt-1">🔵 CryptoCompare</p>
          )}
          {dataSource === "binance" && (
            <p className="text-xs text-orange-400 mt-1">🟠 Binance</p>
          )}
          {dataSource === "none" && (
            <p className="text-xs text-red-400 mt-1">❌ No Data</p>
          )}
        </div>
        <button
          onClick={refreshPrices}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Refresh prices"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prices.slice(0, 4).map((crypto) => (
            <div key={crypto.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${crypto.color}`}
                >
                  {crypto.letter}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {crypto.symbol}
                  </p>
                  <p className="text-xs text-muted-foreground">{crypto.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  ${formatPrice(crypto.price)}
                </p>
                <p
                  className={`text-xs ${
                    crypto.change24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatChange(crypto.change24h)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
