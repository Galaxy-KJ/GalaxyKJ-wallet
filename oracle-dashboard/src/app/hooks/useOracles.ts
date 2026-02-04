// src/hooks/useOracles.ts
import {
  OracleAggregator,
  MedianStrategy,
  WeightedAverageStrategy,
  TWAPStrategy,
  PriceCache,
} from '@galaxy-kj/core-oracles';
import { useState, useMemo, useCallback } from 'react';
import { ClientProxySource } from '@/app/lib/ClientProxySource';

type StrategyType = 'median' | 'weighted' | 'twap';

export function useOracles() {
  const [strategy, setStrategy] = useState<StrategyType>('median');
  const [config, setConfig] = useState({
    minSources: 1,
    maxDeviationPercent: 15,
    maxStalenessMs: 300000,
    enableOutlierDetection: true,
    outlierThreshold: 3.0,
  });

  const aggregator = useMemo(() => {
    const agg = new OracleAggregator(config);

    // Set strategy based on selection
    if (strategy === 'median') {
      agg.setStrategy(new MedianStrategy());
    } else if (strategy === 'weighted') {
      agg.setStrategy(new WeightedAverageStrategy());
    } else {
      // TWAP
      const cache = new PriceCache({ ttlMs: 300000 });
      agg.setStrategy(new TWAPStrategy(cache, 300000));
    }

    // Add client proxy source that calls our backend
    // The backend uses the real SDK CoinGeckoSource
    const source = new ClientProxySource();
    agg.addSource(source, 1.0);

    return agg;
  }, [strategy, config]);

  const updateStrategy = useCallback((newStrategy: StrategyType) => {
    setStrategy(newStrategy);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const supportedSymbols = useMemo(() => {
    // These are the symbols supported by CoinGeckoSource in the SDK
    return ['BTC', 'ETH', 'XLM', 'USDC'];
  }, []);

  return {
    aggregator,
    strategy,
    config,
    supportedSymbols,
    updateStrategy,
    updateConfig,
  };
}