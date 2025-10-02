import EventEmitter from "events";
import { ReflectorPriceService } from "./reflector-price-service";

export class PriceMonitor extends EventEmitter {
  private cache: Map<string, number> = new Map();
  private pollingInterval: number;
  private intervalId?: NodeJS.Timeout;
  private reflector: ReflectorPriceService;

  constructor(pollingInterval: number = 300000) {
    super();
    this.pollingInterval = pollingInterval;
    this.reflector = new ReflectorPriceService();
  }

  async startMonitoring(assets: string[]) {
    console.log(`🔍 Starting to monitor: ${assets.join(", ")}`);

    await this.pollPrices(assets);

    this.intervalId = setInterval(async () => {
      await this.pollPrices(assets);
    }, this.pollingInterval);
  }

  private async pollPrices(assets: string[]) {
    console.log(`⏰ Polling prices at ${new Date().toISOString()}`);

    for (const asset of assets) {
      try {
        const result = await this.reflector.fetchAssetPrice(asset);

        if (!result || !result.priceUSD) {
          console.log(`⚠️  No price data for ${asset}`);
          continue;
        }

        const newPrice = Number(result.priceUSD);
        const oldPrice = this.cache.get(asset);

        console.log(
          `📊 ${asset}: $${newPrice} (cached: ${oldPrice || "none"})`
        );

        if (
          oldPrice !== undefined &&
          this.hasPriceChanged(oldPrice, newPrice)
        ) {
          console.log(`🔔 Price change detected for ${asset}!`);
          this.emit("priceChange", {
            asset,
            oldPrice,
            newPrice,
            timestamp: result.timestamp,
            timestampDate: result.timestamp,
            changePercent: ((newPrice - oldPrice) / oldPrice) * 100,
          });
        }

        this.cache.set(asset, newPrice);
      } catch (e) {
        console.error(`❌ Error fetching ${asset}:`, e);
        this.emit("error", {
          asset,
          error: e,
        });
      }
    }
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log("🛑 Monitoring stopped");
    }
  }

  private hasPriceChanged(
    oldPrice: number,
    newPrice: number,
    threshold = 0.0001
  ) {
    const change = Math.abs(newPrice - oldPrice) / oldPrice;
    return change > threshold;
  }

  getCachedPrices() {
    return Object.fromEntries(this.cache);
  }
}
