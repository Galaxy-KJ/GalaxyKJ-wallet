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
type PriceSubscriber = (
  price: number,
  meta: { asset: string; ts: number }
) => void;

const ASSET_TO_COINGECKO_ID: Record<string, string> = {
  XLM: "stellar",
  USDC: "usd-coin",
};

interface Subscription {
  asset: string;
  intervalMs: number;
  timer?: number;
  lastPrice?: number;
  subs: Set<PriceSubscriber>;
}

export class PriceMonitor2 {
  private subs: Map<string, Subscription> = new Map();

  subscribe(
    asset: "XLM" | "USDC",
    cb: PriceSubscriber,
    intervalMs: number = 15000
  ) {
    const key = asset;
    let sub = this.subs.get(key);
    if (!sub) {
      sub = { asset, intervalMs, subs: new Set() };
      this.subs.set(key, sub);
      this.startPolling(sub);
    }
    sub.subs.add(cb);

    return () => {
      const s = this.subs.get(key);
      if (!s) return;
      s.subs.delete(cb);
      if (s.subs.size === 0) this.stopPolling(s);
    };
  }

  getLatest(asset: "XLM" | "USDC"): number | undefined {
    return this.subs.get(asset)?.lastPrice;
  }

  private async pollOnce(sub: Subscription) {
    const id = ASSET_TO_COINGECKO_ID[sub.asset];
    if (!id) return;
    try {
      const res = await fetch(
        `/api/crypto/coingecko?ids=${id}&vs_currencies=usd&include_24hr_change=true`
      );
      if (!res.ok) return;
      const data = await res.json();
      const price = data[id]?.usd;
      if (typeof price === "number") {
        sub.lastPrice = price;
        const ts = Date.now();
        for (const fn of sub.subs) fn(price, { asset: sub.asset, ts });
      }
    } catch {
      // swallow errors; caller may implement retries
    }
  }

  private startPolling(sub: Subscription) {
    // immediate
    this.pollOnce(sub);
    // interval
    sub.timer = setInterval(
      () => this.pollOnce(sub),
      sub.intervalMs
    ) as unknown as number;
  }

  private stopPolling(sub: Subscription) {
    if (sub.timer) {
      clearInterval(sub.timer);
      sub.timer = undefined;
    }
    this.subs.delete(sub.asset);
  }
}

// NOTE: `priceMonitor` is used by `BackgroundProcessor` (client-side/dev helper) which expects
// `subscribe()` + `getLatest()` methods. Those are implemented by `PriceMonitor2`.
export const priceMonitor = new PriceMonitor2();
