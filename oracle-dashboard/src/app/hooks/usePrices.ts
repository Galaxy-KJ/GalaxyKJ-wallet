import { OracleAggregator, AggregatedPrice } from '@galaxy-kj/core-oracles';
import { useState, useEffect } from 'react';

const DEFAULT_SYMBOLS = ['XLM', 'BTC', 'ETH', 'USDC'];

export function usePrices(aggregator: OracleAggregator, symbols: string[] = DEFAULT_SYMBOLS) {
  const [prices, setPrices] = useState<Map<string, AggregatedPrice>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await aggregator.getAggregatedPrices(symbols);
        const priceMap = new Map(
          results.map(r => [r.symbol, r])
        );
        setPrices(priceMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
        console.error('Price fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [aggregator, symbols]);

  return { prices, loading, error };
}