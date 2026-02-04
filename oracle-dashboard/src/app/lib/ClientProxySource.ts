import { IOracleSource, PriceData, SourceInfo } from '@galaxy-kj/core-oracles';

/**
 * Client-side wrapper that calls our backend API.
 * The backend uses the real SDK CoinGeckoSource.
 * This is necessary to avoid CORS issues in the browser.
 */
export class ClientProxySource implements IOracleSource {
    readonly name = 'coingecko';

    async getPrice(symbol: string): Promise<PriceData> {
        const prices = await this.getPrices([symbol]);
        if (prices.length === 0) {
            throw new Error(`No price data returned for ${symbol}`);
        }
        return prices[0];
    }

    async getPrices(symbols: string[]): Promise<PriceData[]> {
        const symbolsParam = symbols.join(',');
        const response = await fetch(`/api/prices?symbols=${symbolsParam}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || `API error: ${response.statusText}`);
        }

        const data: PriceData[] = await response.json();

        // Ensure dates are Date objects after JSON parsing
        return data.map(p => ({
            ...p,
            timestamp: new Date(p.timestamp)
        }));
    }

    getSourceInfo(): SourceInfo {
        return {
            name: this.name,
            description: 'CoinGecko via Server-Side SDK',
            version: '2.1.0',
            supportedSymbols: ['BTC', 'ETH', 'XLM', 'USDC', 'SOL', 'USDT'],
        };
    }

    async isHealthy(): Promise<boolean> {
        try {
            // Just check if the API endpoint is reachable
            // Don't actually fetch a price to avoid rate limiting
            const response = await fetch('/api/prices?symbols=BTC', {
                method: 'HEAD',
                cache: 'no-store'
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}
