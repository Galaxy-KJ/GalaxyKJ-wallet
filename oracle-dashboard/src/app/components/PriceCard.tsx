'use client';

import { formatPrice, formatConfidence, formatTimeAgo, getPriceChangeColor, getPriceChangeIcon } from '@/lib/formatters';

export interface PriceWithChange {
  symbol: string;
  price: number;
  confidence: number;
  sourcesUsed: number | string[];
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
    <div className="glass rounded-xl p-3 hover:bg-white/5 transition-all duration-300 group cursor-pointer border border-white/5">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mb-0.5">
            {data.symbol} / USD
          </h3>
          <p className="text-lg font-mono font-bold text-white tracking-tight group-hover:text-purple-400 transition-colors">
            {formatPrice(data.price)}
          </p>
        </div>
        {data.change24h !== undefined && (
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${priceChangeClass} bg-current/10`}>
            {getPriceChangeIcon(data.change24h)} {data.change24h.toFixed(2)}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Confidence</span>
            <span className={`font-bold ${data.confidence > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
              {(data.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full ${data.confidence > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`}
               style={{ width: `${data.confidence * 100}%` }}
             ></div>
          </div>
        </div>
        <div className="text-right">
           <span className="block text-[10px] text-slate-500 leading-none mb-1">
             {formatTimeAgo(data.timestamp)}
           </span>
            <span className="text-xs font-mono text-slate-500">
              {Array.isArray(data.sourcesUsed) ? data.sourcesUsed.length : data.sourcesUsed} sources
            </span>
        </div>
      </div>
    </div>
  );
}