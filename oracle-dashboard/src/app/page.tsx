// src/app/page.tsx
'use client';

import { useOracles } from '@/hooks/useOracles';
import { usePrices } from '@/hooks/usePrices';
import { useSourceHealth } from '@/hooks/useSourceHealth';
import { PriceGrid } from '@/components/PriceGrid';
import { SourceHealth } from '@/components/SourceHealth';
import { StrategySelector } from '@/components/StrategySelector';

export default function Dashboard() {
  const { aggregator, strategy, updateStrategy } = useOracles();
  const { prices, loading, error } = usePrices(aggregator);
  const { health } = useSourceHealth(aggregator);

  return (
    <main className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Galaxy Oracle Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time cryptocurrency prices from multiple oracle sources
        </p>
      </div>

      {/* Strategy Selector */}
      <div className="mb-8">
        <StrategySelector
          current={strategy}
          onChange={updateStrategy}
        />
      </div>

      {/* Source Health Status */}
      <div className="mb-8">
        <SourceHealth health={health} />
      </div>

      {/* Price Grid */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <PriceGrid
        prices={prices}
        loading={loading}
      />
    </main>
  );
}