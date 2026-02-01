'use client';

import { formatPrice, formatConfidence, formatTimeAgo, getPriceChangeColor, getPriceChangeIcon } from '@/lib/formatters';

export interface PriceWithChange {
  symbol: string;
  price: number;
  confidence: number;
  sourcesUsed: number;
  timestamp: Date;
  change24h?: number;
  previousPrice?: number;
}

interface PriceCardProps {
  data: PriceWithChange;
}

export function PriceCard({ data }: PriceCardProps) {
  const priceChangeClass = data.change24h
    ? (data.change24h > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
    : 'text-gray-600 dark:text-gray-400';

  const confidenceClass = (conf: number) => {
    if (conf >= 0.9) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (conf >= 0.7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-slate-100 dark:border-slate-700">
      {/* Symbol and Price */}
      <div className="mb-4">
        <h3 className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">
          {data.symbol}
        </h3>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {formatPrice(data.price)}
          </p>
          {data.change24h !== undefined && (
            <span className={`text-lg font-semibold ${priceChangeClass}`}>
              {getPriceChangeIcon(data.change24h)} {data.change24h > 0 ? '+' : ''}{data.change24h.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Aggregation Info */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        {/* Confidence */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Confidence</span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${confidenceClass(data.confidence)}`}>
            {formatConfidence(data.confidence)}
          </span>
        </div>

        {/* Sources Used */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Sources Used</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {data.sourcesUsed}
          </span>
        </div>

        {/* Updated */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Updated</span>
          <span className="text-sm text-slate-500 dark:text-slate-500">
            {formatTimeAgo(data.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}