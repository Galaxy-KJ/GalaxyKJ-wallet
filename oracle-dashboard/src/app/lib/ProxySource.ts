import { IOracleSource, PriceData, SourceInfo } from '@galaxy-kj/core-oracles';

/**
 * A proxy source that delegates to the backend API.
 * Implements batching to prevent parallel getPrice calls from 
 * triggering multiple redundant network requests.
 */
export class DashboardProxySource implements IOracleSource {
    readonly name = 'coingecko';

    private batchTimeout: NodeJS.Timeout | null = null;
    private pendingSymbols: Set<string> = new Set();
    private pendingPromises: Map<string, { resolve: (val: PriceData) => void, reject: (err: any) => void }[]> = new Map();

    async getPrice(symbol: string): Promise<PriceData> {
        return new Promise((resolve, reject) => {
            const list = this.pendingPromises.get(symbol) || [];
            list.push({ resolve, reject });
            this.pendingPromises.set(symbol, list);
            this.pendingSymbols.add(symbol);

            if (!this.batchTimeout) {
                this.batchTimeout = setTimeout(() => this.flushBatch(), 50);
            }
        });
    }

    private async flushBatch() {
        const symbols = Array.from(this.pendingSymbols);
        const promises = new Map(this.pendingPromises);

        this.batchTimeout = null;
        this.pendingSymbols.clear();
        this.pendingPromises.clear();

        try {
            const results = await this.getPrices(symbols);
            results.forEach(price => {
                const handlers = promises.get(price.symbol);
                if (handlers) {
                    handlers.forEach(h => h.resolve(price));
                    promises.delete(price.symbol);
                }
            });

            // Any remaining symbols failed or were not returned
            promises.forEach((handlers, symbol) => {
                handlers.forEach(h => h.reject(new Error(`No price data returned for ${symbol}`)));
            });
        } catch (error) {
            promises.forEach((handlers) => {
                handlers.forEach(h => h.reject(error));
            });
        }
    }

    async getPrices(symbols: string[]): Promise<PriceData[]> {
        const ids = symbols.join(',');
        const response = await fetch(`/api/prices?ids=${ids}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || `API error: ${response.statusText}`);
        }

        const data: PriceData[] = await response.json();

        return data.map(p => ({
            ...p,
            timestamp: new Date(p.timestamp)
        }));
    }

    getSourceInfo(): SourceInfo {
        return {
            name: this.name,
            description: 'SDK Integration via Batching Proxy',
            version: '2.2.0',
            supportedSymbols: ['BTC', 'ETH', 'XLM', 'USDC', 'SOL', 'USDT'],
        };
    }

    async isHealthy(): Promise<boolean> {
        try {
            // Health check also goes through batching
            const price = await this.getPrice('BTC');
            return !!price;
        } catch {
            return false;
        }
    }
}
