// src/hooks/useOracles.ts
import {
  OracleAggregator,
  MedianStrategy,
  WeightedAverageStrategy,
  TWAPStrategy,
} from '@galaxy-kj/core-oracles';
import { useState, useMemo, useCallback } from 'react';

type StrategyType = 'median' | 'weighted' | 'twap';

export function useOracles() {
  const [strategy, setStrategy] = useState<StrategyType>('median');
  const [config, setConfig] = useState({
    minSources: 2,
    maxDeviationPercent: 10,
    maxStalenessMs: 60000,
    enableOutlierDetection: true,
    outlierThreshold: 2.0,
  });

  const aggregator = useMemo(() => {
    const agg = new OracleAggregator(config);

    // Set strategy based on selection
    if (strategy === 'median') {
      agg.setStrategy(new MedianStrategy());
    } else if (strategy === 'weighted') {
      agg.setStrategy(new WeightedAverageStrategy());
    } else {
      // TWAP needs cache
      agg.setStrategy(new TWAPStrategy());
    }

    // Add oracle sources here (you'll need to implement these)
    // Example: agg.addSource(new CoinGeckoSource(), 1.0);
    // Example: agg.addSource(new CoinMarketCapSource(), 1.0);

    return agg;
  }, [strategy, config]);

  const updateStrategy = useCallback((newStrategy: StrategyType) => {
    setStrategy(newStrategy);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    aggregator,
    strategy,
    config,
    updateStrategy,
    updateConfig,
  };
}