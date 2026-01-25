"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TransactionType = "receive" | "send" | "swap";
type TransactionStatus = "completed" | "pending" | "failed";

interface Transaction {
  id: number;
  type: TransactionType;
  asset?: string;
  assetFrom?: string;
  assetTo?: string;
  amount?: string;
  amountFrom?: number;
  amountTo?: number;
  from?: string;
  to?: string;
  date: string;
  status: TransactionStatus;
}

interface SearchResultsProps {
  transactions: Transaction[];
  isSearching: boolean;
  hasSearched: boolean;
  hasResults: boolean;
  searchQuery: string;
  onClose: () => void;
  isVisible: boolean;
}

export function SearchResults({
  transactions,
  isSearching,
  hasSearched,
  hasResults,
  searchQuery,
  onClose,
  isVisible,
}: SearchResultsProps) {
  const router = useRouter();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || (!hasSearched && !isSearching)) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "receive":
        return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
      case "send":
        return <ArrowUpRight className="h-4 w-4 text-blue-400" />;
      case "swap":
        return <RefreshCw className="h-4 w-4 text-purple-400" />;
    }
  };

  const getStatusBadgeColor = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-900/30 text-green-400 border-green-800";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "failed":
        return "bg-red-900/30 text-red-400 border-red-800";
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleViewAllTransactions = () => {
    router.push("/transactions");
    onClose();
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 z-50"
      ref={resultsRef}
    >
      <Card className="border-border bg-card/95 backdrop-blur-sm shadow-xl max-h-96 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Search results for &quot;{searchQuery}&quot;
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              <span className="ml-2 text-muted-foreground">
                Searching transactions...
              </span>
            </div>
          ) : hasResults ? (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      router.push("/transactions");
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {tx.type === "swap" ? (
                              <span>
                                {tx.assetFrom} → {tx.assetTo}
                              </span>
                            ) : (
                              <span>
                                {tx.type === "send" ? "Sent" : "Received"}{" "}
                                {tx.asset}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.from && (
                              <span>From: {truncateAddress(tx.from)} • </span>
                            )}
                            {formatDate(tx.date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-200">
                          {tx.type === "swap" ? (
                            <span className="text-sm">
                              {tx.amountFrom} → {tx.amountTo}
                            </span>
                          ) : (
                            <span
                              className={
                                tx.type === "receive"
                                  ? "text-green-400"
                                  : "text-blue-400"
                              }
                            >
                              {tx.type === "receive" ? "+" : "-"}
                              {tx.amount}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusBadgeColor(tx.status)}`}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {transactions.length > 5 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    onClick={handleViewAllTransactions}
                  >
                    View all {transactions.length} results
                  </Button>
                </div>
              )}
            </>
          ) : hasSearched ? (
            <div className="py-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                No transactions found
              </p>
              <p className="text-sm text-muted-foreground/70">
                Try searching for transaction types, amounts, assets, or
                addresses
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
