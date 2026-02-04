import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { useWalletStore } from './use-wallet-store';
import { getStellarService } from '../lib/galaxy-sdk';

export function useTransactions() {
    const { address, network } = useWalletStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async () => {
        if (!address) return;

        setLoading(true);
        setError(null);
        try {
            const stellarService = await getStellarService();
            const history = await stellarService.getTransactionHistory(address, 10);

            const formattedTransactions: Transaction[] = history.map((tx: any) => ({
                id: tx.hash,
                type: tx.destination ? 'payment' : 'other',
                amount: tx.amount || '0',
                asset: tx.asset || 'XLM',
                from: tx.source,
                to: tx.destination,
                timestamp: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
                status: tx.status === 'success' ? 'success' : 'failed',
                hash: tx.hash,
            }));

            setTransactions(formattedTransactions);
            setError(null);
        } catch (err: any) {
            const errorMessage = err?.message || '';
            const isNotFunded = errorMessage.includes('Not Found') ||
                               errorMessage.includes('404') ||
                               errorMessage.includes('not funded');

            if (isNotFunded) {
                setTransactions([]);
                setError(null);
            } else {
                console.error('Error fetching transactions:', err);
                setError('Failed to fetch transaction history');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        const interval = setInterval(fetchTransactions, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, [address, network]);

    return { transactions, loading, error, refresh: fetchTransactions };
}
