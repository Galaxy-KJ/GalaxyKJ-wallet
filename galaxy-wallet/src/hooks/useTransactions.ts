import { useState, useEffect, useCallback } from 'react';
import { WalletTransaction } from '../types';
import { useWalletStore } from './use-wallet-store';
import { getTransactionHistory } from '../lib/galaxy-sdk';
import { transactionCache } from '../lib/cache';

function mergeTransactions(existing: WalletTransaction[], incoming: WalletTransaction[]): WalletTransaction[] {
    const byId = new Map<string, WalletTransaction>();
    for (const tx of existing) byId.set(tx.id, tx);
    for (const tx of incoming) byId.set(tx.id, tx);

    return Array.from(byId.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '';
}

export function useTransactions() {
    const { address, network } = useWalletStore();
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    useEffect(() => {
        const loadCache = async () => {
            if (!address) {
                setTransactions([]);
                setNextCursor(null);
                return;
            }

            try {
                const cached = await transactionCache.getTransactions(address, network);
                setTransactions(cached.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
            } catch (cacheError) {
                console.error('Failed to load transaction cache', cacheError);
            }
        };

        loadCache();
    }, [address, network]);

    const fetchTransactions = useCallback(
        async (isLoadMore = false) => {
            if (!address) return;

            if (isLoadMore) {
                if (!nextCursor) return;
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const result = await getTransactionHistory({
                    walletId: address,
                    limit: 20,
                    cursor: isLoadMore ? nextCursor ?? undefined : undefined,
                    network,
                });

                let merged: WalletTransaction[] = [];
                setTransactions((prev) => {
                    merged = isLoadMore ? mergeTransactions(prev, result.transactions) : result.transactions;
                    return merged;
                });
                await transactionCache.saveTransactions(address, network, merged);

                setNextCursor(result.nextCursor || null);
                setError(null);
            } catch (fetchError) {
                const errorMessage = toErrorMessage(fetchError).toLowerCase();
                const isNotFunded = errorMessage.includes('not found') || errorMessage.includes('404') || errorMessage.includes('not funded');

                if (isNotFunded && !isLoadMore) {
                    setTransactions([]);
                    setError(null);
                    setNextCursor(null);
                } else {
                    console.error('Error fetching transactions:', fetchError);
                    setError('Failed to fetch transaction history');
                }
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [address, network, nextCursor]
    );

    useEffect(() => {
        if (!address) return;

        void fetchTransactions(false);
        const interval = setInterval(() => {
            void fetchTransactions(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [address, network, fetchTransactions]);

    return {
        transactions,
        loading,
        loadingMore,
        error,
        nextCursor,
        refresh: () => fetchTransactions(false),
        loadMore: () => fetchTransactions(true),
    };
}
