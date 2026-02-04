import { NextResponse } from 'next/server';
import { CoinGeckoSource, PriceData } from '@galaxy-kj/core-oracles';

// Initialize the SDK source on the server side
const source = new CoinGeckoSource();

// Aggressive caching to avoid CoinGecko rate limits
interface CacheEntry {
    data: PriceData[];
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 seconds cache

function getCacheKey(symbols: string[]): string {
    return symbols.sort().join(',');
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
        return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim());
    const cacheKey = getCacheKey(symbols);
    const now = Date.now();

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
        console.log(`[CACHE HIT] Returning cached data for: ${cacheKey}`);
        return NextResponse.json(cached.data);
    }

    try {
        console.log(`[CACHE MISS] Fetching from CoinGecko via SDK for: ${symbols.join(', ')}`);

        // Use the SDK's CoinGeckoSource to fetch prices
        const priceData = await source.getPrices(symbols);

        // Update cache
        cache.set(cacheKey, {
            data: priceData,
            timestamp: now
        });

        // Clean old cache entries (simple cleanup)
        if (cache.size > 50) {
            const entries = Array.from(cache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            // Remove oldest 10 entries
            for (let i = 0; i < 10; i++) {
                cache.delete(entries[i][0]);
            }
        }

        return NextResponse.json(priceData);
    } catch (error) {
        console.error('SDK CoinGecko error:', error);

        // If we have stale cache data, return it as fallback
        const staleCache = cache.get(cacheKey);
        if (staleCache) {
            console.log(`[STALE CACHE] Returning stale data due to error for: ${cacheKey}`);
            return NextResponse.json(staleCache.data);
        }

        return NextResponse.json({
            error: 'Failed to fetch from CoinGecko via SDK',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
