'use client';

import { PriceCard, PriceWithChange } from './PriceCard';

interface PriceGridProps {
  prices: Map<string, PriceWithChange>;
  loading: boolean;
}

export function PriceGrid({ prices, loading }: PriceGridProps) {
  if (loading && prices.size === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-4"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-6"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (prices.size === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-semibold">No prices available</p>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Check your oracle configuration and sources</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from(prices.values()).map(price => (
        <PriceCard key={price.symbol} data={price} />
      ))}
    </div>
  );
}