// src/hooks/useSourceHealth.ts
import { OracleAggregator } from '@galaxy-kj/core-oracles';
import { useState, useEffect } from 'react';

export function useSourceHealth(aggregator: OracleAggregator) {
  const [health, setHealth] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      setLoading(true);
      try {
        const healthStatus = await aggregator.getSourceHealth();
        setHealth(healthStatus);
      } catch (err) {
        console.error('Health check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();

    // Check health every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [aggregator]);

  return { health, loading };
}