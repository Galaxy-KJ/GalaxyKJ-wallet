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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Strategy
        </h2>
        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-mono">
          {STRATEGIES[current].label}
        </span>
      </div>
      <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 gap-1">
        {strategies.map(strategy => (
          <button
            key={strategy}
            onClick={() => onChange(strategy)}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 relative ${
              current === strategy
                ? 'bg-purple-600/20 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {current === strategy && (
              <div className="absolute inset-0 border border-purple-500/50 rounded-lg animate-pulse" />
            )}
            <span className="text-xl mb-1">{STRATEGIES[strategy].icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {STRATEGIES[strategy].label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 italic px-1">
        {STRATEGIES[current].description}
      </p>
    </div>
  );
}