"use client";

import { Suspense } from "react";
import { TransactionHistory } from "@/components/transactions/transaction-list";
import { ActivitySummary } from "@/components/transactions/activity-summary";
import { TransactionStats } from "@/components/transactions/transaction-stats";
import { SearchBar } from "@/components/ui/search-bar";
import { StarBackground } from "@/components/effects/star-background";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function Transactions() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarBackground />
      <div className="relative z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:text-purple-400">
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
                Transaction History
              </h1>
            </div>
            <Suspense fallback={<div className="w-64 h-10 bg-gray-800 rounded animate-pulse" />}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <TransactionHistory />
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <ActivitySummary />
              <TransactionStats />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
