import { ReflectorPriceService } from "./reflector-price-service";

export interface PriceData {
  price: string;
  priceUSD: string;
  timestamp: string;
  timestampDate?: string;
}

export interface AssetConfig {
  code: string;
  type: "Stellar" | "Other";
  contractAddress?: string;
  enabled: boolean;
}

export interface PriceHistory {
  asset: string;
  prices: Array<{
    price: number;
    timestamp: number;
  }>;
}

export interface PriceStats {
  current: number;
  min: number;
  max: number;
  avg: number;
  volatility: number;
  change24h: number;
}

export class AssetPriceManager {
  private reflectorService: ReflectorPriceService;
  private registeredAssets: Map<string, AssetConfig> = new Map();
  private priceCache: Map<string, PriceData> = new Map();
  private priceHistory: Map<string, PriceHistory> = new Map();
  private maxHistoryLength: number = 1000;

  constructor() {
    this.reflectorService = new ReflectorPriceService();
  }

  /**
   * Register an asset for price tracking
   */
  registerAsset(config: AssetConfig): void {
    this.registeredAssets.set(config.code, config);
    console.log(`✅ Registered asset: ${config.code} (${config.type})`);
  }

  /**
   * Register multiple assets
   */
  registerAssets(configs: AssetConfig[]): void {
    configs.forEach((config) => this.registerAsset(config));
  }

  /**
   * Unregister an asset
   */
  unregisterAsset(assetCode: string): void {
    this.registeredAssets.delete(assetCode);
    this.priceCache.delete(assetCode);
    this.priceHistory.delete(assetCode);
    console.log(`🗑️  Unregistered asset: ${assetCode}`);
  }

  /**
   * Get all registered assets
   */
  getRegisteredAssets(): AssetConfig[] {
    return Array.from(this.registeredAssets.values());
  }

  /**
   * Fetch price for a single asset
   */
  async fetchPrice(assetCode: string): Promise<PriceData | null> {
    const config = this.registeredAssets.get(assetCode);

    if (!config || !config.enabled) {
      console.warn(`⚠️  Asset ${assetCode} is not registered or disabled`);
      return null;
    }

    try {
      const priceData = await this.reflectorService.fetchAssetPrice(assetCode);

      if (priceData) {
        this.updateCache(assetCode, priceData);
        this.addToHistory(assetCode, priceData);
      }

      return priceData;
    } catch (error) {
      console.error(`❌ Error fetching price for ${assetCode}:`, error);
      return null;
    }
  }

  /**
   * Fetch prices for multiple assets in parallel
   */
  async fetchMultiplePrices(
    assetCodes?: string[]
  ): Promise<Map<string, PriceData | null>> {
    const codes = assetCodes || Array.from(this.registeredAssets.keys());
    const results = new Map<string, PriceData | null>();

    const prices = await this.reflectorService.fetchMultiplePrices(codes);

    prices.forEach((result) => {
      if (result && result.asset) {
        const { asset, ...priceData } = result;
        const data = priceData as PriceData;

        if (data.priceUSD) {
          this.updateCache(asset, data);
          this.addToHistory(asset, data);
          results.set(asset, data);
        } else {
          results.set(asset, null);
        }
      }
    });

    return results;
  }

  /**
   * Get cached price for an asset
   */
  getCachedPrice(assetCode: string): PriceData | null {
    return this.priceCache.get(assetCode) || null;
  }

  /**
   * Get all cached prices
   */
  getAllCachedPrices(): Map<string, PriceData> {
    return new Map(this.priceCache);
  }

  /**
   * Get price history for an asset
   */
  getPriceHistory(assetCode: string): PriceHistory | null {
    return this.priceHistory.get(assetCode) || null;
  }

  /**
   * Calculate price statistics
   */
  getPriceStats(assetCode: string): PriceStats | null {
    const history = this.priceHistory.get(assetCode);

    if (!history || history.prices.length === 0) {
      return null;
    }

    const prices = history.prices.map((p) => p.price);
    const current = prices[prices.length - 1];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Calculate volatility
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) /
      prices.length;
    const volatility = Math.sqrt(variance);

    // Calculate 24h change
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldPrices = history.prices.filter((p) => p.timestamp >= oneDayAgo);
    const change24h =
      oldPrices.length > 0
        ? ((current - oldPrices[0].price) / oldPrices[0].price) * 100
        : 0;

    return {
      current,
      min,
      max,
      avg,
      volatility,
      change24h,
    };
  }

  /**
   * Detect price outliers
   */
  isOutlier(assetCode: string, price: number, threshold: number = 2): boolean {
    const stats = this.getPriceStats(assetCode);

    if (!stats) {
      return false;
    }

    const zScore = Math.abs((price - stats.avg) / stats.volatility);
    return zScore > threshold;
  }

  /**
   * Validate price data
   */
  validatePrice(assetCode: string, priceData: PriceData): boolean {
    if (!priceData || !priceData.priceUSD) {
      return false;
    }

    const price = Number(priceData.priceUSD);

    // Check if price is a valid number
    if (isNaN(price) || price <= 0) {
      return false;
    }

    // Check for outliers
    if (this.isOutlier(assetCode, price)) {
      console.warn(`⚠️  Outlier detected for ${assetCode}: ${price}`);
      return false;
    }

    return true;
  }

  /**
   * Get price trend
   */
  getPriceTrend(
    assetCode: string,
    periods: number = 10
  ): "up" | "down" | "stable" {
    const history = this.priceHistory.get(assetCode);

    if (!history || history.prices.length < periods) {
      return "stable";
    }

    const recentPrices = history.prices.slice(-periods);
    const firstPrice = recentPrices[0].price;
    const lastPrice = recentPrices[recentPrices.length - 1].price;
    const change = (lastPrice - firstPrice) / firstPrice;

    if (change > 0.01) return "up"; // 1% increase
    if (change < -0.01) return "down"; // 1% decrease
    return "stable";
  }

  /**
   * Clear price history for an asset
   */
  clearHistory(assetCode: string): void {
    this.priceHistory.delete(assetCode);
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.priceCache.clear();
    this.priceHistory.clear();
  }

  // Private helper methods

  private updateCache(assetCode: string, priceData: PriceData): void {
    this.priceCache.set(assetCode, priceData);
  }

  private addToHistory(assetCode: string, priceData: PriceData): void {
    let history = this.priceHistory.get(assetCode);

    if (!history) {
      history = {
        asset: assetCode,
        prices: [],
      };
      this.priceHistory.set(assetCode, history);
    }

    const price = Number(priceData.priceUSD);
    const timestamp = Number(priceData.timestamp) * 1000; // Convert to ms

    history.prices.push({ price, timestamp });

    // Limit history length
    if (history.prices.length > this.maxHistoryLength) {
      history.prices.shift();
    }
  }
}
