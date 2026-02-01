/**
 * Oracle Configuration
 * Central setup for OracleAggregator, sources, and strategies
 */

import { OracleAggregator, MedianStrategy, WeightedAverageStrategy, TWAPStrategy } from '@galaxy-kj/core-oracles';
import { SimplePriceCache } from './price-cache';
import { MockOracleSource, createMockSources } from './mock-oracle-source';
import { CoinGeckoSource, CoinGeckoAdvancedSource } from './coingecko-source';

/**
 * Oracle Configuration Constants
 */
export const ORACLE_CONFIG = {
  // Aggregation settings
  minSources: 2,
  maxDeviationPercent: 10,
  maxStalenessMs: 60000, // 60 seconds
  enableOutlierDetection: true,
  outlierThreshold: 2.0, // Standard deviations

  // Refresh intervals
  priceRefreshInterval: 30000, // 30 seconds
  healthCheckInterval: 60000, // 60 seconds
  cacheTTL: 10000, // 10 seconds

  // Price cache window
  priceCacheWindow: 300000, // 5 minutes

  // Supported symbols
  supportedSymbols: ['XLM', 'BTC', 'ETH', 'USDC', 'AQUA', 'SOL', 'ADA', 'XRP'],

  // Default symbols to track
  defaultSymbols: ['XLM', 'BTC', 'ETH', 'USDC'],
} as const;

/**
 * Source Configurations
 */
export const SOURCES_CONFIG = {
  // Development: Use mock sources
  development: {
    useMock: true,
    mockCount: 3,
    mockVolatility: 0.02,
    mockFailureRate: 0.05,
  },

  // Production: Use real sources
  production: {
    useMock: false,
    sources: [
      {
        name: 'coingecko',
        weight: 1.0,
        enabled: true,
      },
      {
        name: 'coingecko-advanced',
        weight: 0.8,
        enabled: false, // Less frequent to avoid rate limits
      },
    ],
  },
} as const;

/**
 * Initialize Oracle Aggregator with configuration
 */
export function initializeOracle(): OracleAggregator {
  const aggregator = new OracleAggregator({
    minSources: ORACLE_CONFIG.minSources,
    maxDeviationPercent: ORACLE_CONFIG.maxDeviationPercent,
    maxStalenessMs: ORACLE_CONFIG.maxStalenessMs,
    enableOutlierDetection: ORACLE_CONFIG.enableOutlierDetection,
    outlierThreshold: ORACLE_CONFIG.outlierThreshold,
  });

  return aggregator;
}

/**
 * Add sources to aggregator
 * Handles both mock (development) and real (production) sources
 */
export function addSourcesToAggregator(
  aggregator: OracleAggregator,
  environment: 'development' | 'production' = 'development'
): void {
  const config = SOURCES_CONFIG[environment];

  if (config.useMock) {
    // Add mock sources for development/testing
    const mockSources = createMockSources(config.mockCount);
    mockSources.forEach((source, index) => {
      const weight = 1.0 - (index * 0.1); // Decrease weight for each source
      aggregator.addSource(source, weight);
    });
  } else {
    // Add real sources for production
    if (config.sources[0].enabled) {
      const coinGecko = new CoinGeckoSource();
      aggregator.addSource(coinGecko, config.sources[0].weight);
    }

    if (config.sources[1].enabled) {
      const coinGeckoAdvanced = new CoinGeckoAdvancedSource();
      aggregator.addSource(coinGeckoAdvanced, config.sources[1].weight);
    }
  }
}

/**
 * Set aggregation strategy
 */
export function setAggregationStrategy(
  aggregator: OracleAggregator,
  strategy: 'median' | 'weighted' | 'twap',
  priceCache?: SimplePriceCache
): void {
  switch (strategy) {
    case 'median':
      aggregator.setStrategy(new MedianStrategy());
      break;

    case 'weighted':
      aggregator.setStrategy(new WeightedAverageStrategy());
      break;

    case 'twap':
      if (!priceCache) {
        throw new Error('TWAP strategy requires a PriceCache instance');
      }
      aggregator.setStrategy(new TWAPStrategy(priceCache, ORACLE_CONFIG.priceCacheWindow));
      break;

    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }
}

/**
 * Create a fully configured oracle with specified strategy
 */
export function createConfiguredOracle(
  strategy: 'median' | 'weighted' | 'twap' = 'median',
  environment: 'development' | 'production' = 'development'
): {
  aggregator: OracleAggregator;
  priceCache: SimplePriceCache | null;
} {
  // Initialize aggregator
  const aggregator = initializeOracle();

  // Add sources
  addSourcesToAggregator(aggregator, environment);

  // Create price cache if needed for TWAP
  let priceCache: SimplePriceCache | null = null;
  if (strategy === 'twap') {
    priceCache = new SimplePriceCache(ORACLE_CONFIG.priceCacheWindow);
  }

  // Set strategy
  setAggregationStrategy(aggregator, strategy, priceCache ?? undefined);

  return { aggregator, priceCache };
}

/**
 * Validate symbol is supported
 */
export function isSymbolSupported(symbol: string): boolean {
  return ORACLE_CONFIG.supportedSymbols.includes(symbol.toUpperCase());
}

/**
 * Get all supported symbols
 */
export function getSupportedSymbols(): string[] {
  return [...ORACLE_CONFIG.supportedSymbols];
}

/**
 * Validate configuration
 */
export function validateOracleConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (ORACLE_CONFIG.minSources < 1) {
    errors.push('minSources must be at least 1');
  }

  if (ORACLE_CONFIG.maxDeviationPercent < 0) {
    errors.push('maxDeviationPercent must be non-negative');
  }

  if (ORACLE_CONFIG.outlierThreshold < 0) {
    errors.push('outlierThreshold must be non-negative');
  }

  if (ORACLE_CONFIG.supportedSymbols.length === 0) {
    errors.push('At least one supported symbol must be configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Pretty print oracle configuration for debugging
 */
export function logOracleConfig(): void {
  console.log('=== Oracle Configuration ===');
  console.log('Aggregation Settings:', {
    minSources: ORACLE_CONFIG.minSources,
    maxDeviation: `${ORACLE_CONFIG.maxDeviationPercent}%`,
    maxStaleness: `${ORACLE_CONFIG.maxStalenessMs}ms`,
    outlierDetection: ORACLE_CONFIG.enableOutlierDetection,
    outlierThreshold: `${ORACLE_CONFIG.outlierThreshold}σ`,
  });
  console.log('Intervals:', {
    priceRefresh: `${ORACLE_CONFIG.priceRefreshInterval}ms`,
    healthCheck: `${ORACLE_CONFIG.healthCheckInterval}ms`,
  });
  console.log('Supported Symbols:', ORACLE_CONFIG.supportedSymbols);
  console.log('Default Symbols:', ORACLE_CONFIG.defaultSymbols);
}

/**
 * Environment-specific configuration
 */
export const getEnvironmentConfig = (env: string = process.env.NODE_ENV) => {
  return {
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    environment: (env as 'development' | 'production') || 'development',
  };
};

export default {
  ORACLE_CONFIG,
  SOURCES_CONFIG,
  initializeOracle,
  addSourcesToAggregator,
  setAggregationStrategy,
  createConfiguredOracle,
  isSymbolSupported,
  getSupportedSymbols,
  validateOracleConfig,
  logOracleConfig,
  getEnvironmentConfig,
};