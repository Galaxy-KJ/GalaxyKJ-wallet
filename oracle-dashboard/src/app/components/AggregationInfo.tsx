'use client';

interface AggregationInfoProps {
  strategy: string;
  priceCount: number;
  sourceCount: number;
  confidence?: number;
}

export function AggregationInfo({ strategy, priceCount, sourceCount, confidence }: AggregationInfoProps) {
  const strategyLabels: Record<string, { label: string; description: string }> = {
    median: {
      label: 'Median Strategy',
      description: 'Taking the middle value from all sources - robust against outliers and manipulated prices',
    },
    weighted: {
      label: 'Weighted Average',
      description: 'Averaging prices based on source weights - prioritizes trusted, reliable sources',
    },
    twap: {
      label: 'Time-Weighted Average Price',
      description: 'Weighting recent prices higher - smooths volatility and prevents flash crashes',
    },
  };

  const info = strategyLabels[strategy as keyof typeof strategyLabels] || strategyLabels.median;
  const confidenceColor = confidence
    ? confidence >= 0.9
      ? 'text-green-600 dark:text-green-400'
      : confidence >= 0.7
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400'
    : 'text-slate-600 dark:text-slate-400';

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-4">
        <div className="text-3xl">ℹ️</div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 dark:text-white text-lg mb-2">
            {info.label}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            {info.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Assets
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {priceCount}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Sources
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {sourceCount}
              </p>
            </div>
            {confidence !== undefined && (
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Avg Confidence
                </p>
                <p className={`text-2xl font-bold ${confidenceColor}`}>
                  {(confidence * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}