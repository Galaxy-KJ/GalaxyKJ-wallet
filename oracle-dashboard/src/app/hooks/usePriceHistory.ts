
import { useState, useEffect, useRef } from 'react';
import { AggregatedPrice } from '@galaxy-kj/core-oracles';
import { ChartDataPoint } from '../components/PriceChart';

// Helper to generate mock entry with more "noise" for better visuals
const generateMockHistory = (currentPrice: number, points: number = 40): ChartDataPoint[] => {
    const history: ChartDataPoint[] = [];
    let price = currentPrice;
    const now = Date.now();

    // Create a more interesting walk
    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now - i * 15000); // 15 second intervals

        if (i > 0) {
            // Random walk with 0.2% max change and some bias
            const volatility = currentPrice * 0.002;
            const change = (Math.random() - 0.5) * volatility;
            price = price + change;
        }

        history.push({
            timestamp: time.toISOString(),
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            price: i === 0 ? currentPrice : price,
            symbol: '',
        });
    }
    return history;
};

export function usePriceHistory(prices: Map<string, AggregatedPrice>) {
    const [history, setHistory] = useState<Map<string, ChartDataPoint[]>>(new Map());
    const initialized = useRef<Set<string>>(new Set());

    useEffect(() => {
        setHistory(prev => {
            const next = new Map(prev);

            prices.forEach((data, symbol) => {
                const now = new Date();
                const currentPoint: ChartDataPoint = {
                    timestamp: now.toISOString(),
                    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    price: data.price,
                    symbol: symbol,
                    source: 'Aggregate'
                };

                if (!initialized.current.has(symbol)) {
                    // Initialize with mock history if empty
                    const mockData = generateMockHistory(data.price, 60);
                    // Fix symbols in mock data
                    mockData.forEach(d => d.symbol = symbol);
                    next.set(symbol, mockData);
                    initialized.current.add(symbol);
                } else {
                    // Append new real data
                    const existing = next.get(symbol) || [];
                    // Only add if price changed or time is significantly different
                    const lastPoint = existing[existing.length - 1];
                    if (!lastPoint || lastPoint.price !== data.price || lastPoint.time !== currentPoint.time) {
                        next.set(symbol, [...existing.slice(-100), currentPoint]); // Keep last 100 points
                    }
                }
            });

            return next;
        });
    }, [prices]);

    return history;
}
