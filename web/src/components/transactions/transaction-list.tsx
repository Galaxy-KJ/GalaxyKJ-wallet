"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Filter } from "lucide-react";
import { fetchTransactions } from "@/lib/stellar/transactions";
import { useWalletStore } from "@/store/wallet-store";

type TransactionType = "receive" | "send" | "swap";
type TransactionStatus = "completed" | "pending" | "failed";

type Transaction = {
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
};

// Helper function to validate Stellar public key
const isValidStellarPublicKey = (key: string): boolean => {
  return Boolean(key && key.length === 56 && key.startsWith('G'));
};

export function TransactionHistory() {
  const publicKey = useWalletStore((state) => state.publicKey);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const router = useRouter();

  useEffect(() => {
    const loadTransactions = async () => {
      // Validate public key before making API calls
      if (!publicKey || !isValidStellarPublicKey(publicKey)) {
        console.log('No valid public key available, skipping transaction fetch');
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedTransactions = await fetchTransactions({
          account: publicKey,
          limit: 10,
        });

        setTransactions(fetchedTransactions);
      } catch (err) {
        console.error("Failed to load transactions:", err);
        setError("Failed to load transactions. Please try again.");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(loadTransactions, 100);
    return () => clearTimeout(timeoutId);
  }, [publicKey]);

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const viewAllTransactions = () => {
    router.push("/transactions");
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "receive":
        return <ArrowDownLeft className="h-4 w-4 text-[#10B981]" />;
      case "send":
        return <ArrowUpRight className="h-4 w-4 text-[#60A5FA]" />;
      case "swap":
        return <RefreshCw className="h-4 w-4 text-[#A78BFA]" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return "bg-[#059669] bg-opacity-20 text-[#34D399]";
      case "pending":
        return "bg-[#D97706] bg-opacity-20 text-[#FBBF24]";
      case "failed":
        return "bg-[#DC2626] bg-opacity-20 text-[#F87171]";
      default:
        return "bg-gray-600 bg-opacity-20 text-gray-400";
    }
  };

  // Show message when no wallet is connected
  if (!publicKey || !isValidStellarPublicKey(publicKey)) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-muted-foreground">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Connect a wallet to view transaction history
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-muted-foreground">
          Transaction History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
        >
          <Filter className="h-3.5 w-3.5 mr-1" />
          Filter
        </Button>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
          {["all", "receive", "send", "swap"].map((type) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 py-1 text-xs ${
                filter === type
                  ? "bg-purple-500/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
              onClick={() => setFilter(type as "all" | TransactionType)}
            >
              {type === "all"
                ? "All"
                : type === "receive"
                ? "Received"
                : type === "send"
                ? "Sent"
                : "Swaps"}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-lg bg-accent/30 hover:bg-accent/40 transition-all duration-200 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/60 flex items-center justify-center">
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {tx.type === "swap" ? (
                      <span>
                        {tx.assetFrom} → {tx.assetTo}
                      </span>
                    ) : (
                      <span>
                        {tx.type === "send" ? "Sent" : "Received"} {tx.asset}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(tx.date)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium text-foreground">
                  {tx.type === "swap" ? (
                    <span>
                      {tx.amountFrom} → {tx.amountTo}
                    </span>
                  ) : (
                    <span
                      className={
                        tx.type === "receive"
                          ? "text-[#10B981]"
                          : "text-[#60A5FA]"
                      }
                    >
                      {tx.type === "receive" ? "+" : "-"}
                      {tx.amount}
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(
                    tx.status
                  )}`}
                >
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            variant="ghost"
            className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            onClick={viewAllTransactions}
          >
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
