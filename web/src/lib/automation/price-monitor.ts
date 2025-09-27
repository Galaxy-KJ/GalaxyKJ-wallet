type PriceSubscriber = (price: number, meta: { asset: string; ts: number }) => void

const ASSET_TO_COINGECKO_ID: Record<string, string> = {
  XLM: 'stellar',
  USDC: 'usd-coin',
}

interface Subscription {
  asset: string
  intervalMs: number
  timer?: number
  lastPrice?: number
  subs: Set<PriceSubscriber>
}

export class PriceMonitor {
  private subs: Map<string, Subscription> = new Map()

  subscribe(asset: 'XLM' | 'USDC', cb: PriceSubscriber, intervalMs: number = 15000) {
    const key = asset
    let sub = this.subs.get(key)
    if (!sub) {
      sub = { asset, intervalMs, subs: new Set() }
      this.subs.set(key, sub)
      this.startPolling(sub)
    }
    sub.subs.add(cb)

    return () => {
      const s = this.subs.get(key)
      if (!s) return
      s.subs.delete(cb)
      if (s.subs.size === 0) this.stopPolling(s)
    }
  }

  getLatest(asset: 'XLM' | 'USDC'): number | undefined {
    return this.subs.get(asset)?.lastPrice
  }

  private async pollOnce(sub: Subscription) {
    const id = ASSET_TO_COINGECKO_ID[sub.asset]
    if (!id) return
    try {
      const res = await fetch(`/api/crypto/coingecko?ids=${id}&vs_currencies=usd&include_24hr_change=true`)
      if (!res.ok) return
      const data = await res.json()
      const price = data[id]?.usd
      if (typeof price === 'number') {
        sub.lastPrice = price
        const ts = Date.now()
        for (const fn of sub.subs) fn(price, { asset: sub.asset, ts })
      }
    } catch {
      // swallow errors; caller may implement retries
    }
  }

  private startPolling(sub: Subscription) {
    // immediate
    this.pollOnce(sub)
    // interval
    sub.timer = setInterval(() => this.pollOnce(sub), sub.intervalMs) as unknown as number
  }

  private stopPolling(sub: Subscription) {
    if (sub.timer) {
      clearInterval(sub.timer)
      sub.timer = undefined
    }
    this.subs.delete(sub.asset)
  }
}

export const priceMonitor = new PriceMonitor()
