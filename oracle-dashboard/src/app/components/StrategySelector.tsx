'use client';

type StrategyType = 'median' | 'weighted' | 'twap';

interface StrategySelectorProps {
  current: StrategyType;
  onChange: (strategy: StrategyType) => void;
}

const STRATEGIES: Record<StrategyType, { label: string; description: string; icon: string }> = {
  median: {
    label: 'Median',
    description: 'Uses middle value - robust against outliers',
    icon: '📊',
  },
  weighted: {
    label: 'Weighted Average',
    description: 'Prioritizes trusted sources',
    icon: '⚖️',
  },
  twap: {
    label: 'TWAP',
    description: 'Time-weighted average - smooths volatility',
    icon: '⏱️',
  },
};

export function StrategySelector({ current, onChange }: StrategySelectorProps) {
  const strategies: StrategyType[] = ['median', 'weighted', 'twap'];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Aggregation Strategy
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {strategies.map(strategy => (
          <button
            key={strategy}
            onClick={() => onChange(strategy)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              current === strategy
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{STRATEGIES[strategy].icon}</span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                current === strategy
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {current === strategy && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {STRATEGIES[strategy].label}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 ml-9">
              {STRATEGIES[strategy].description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}