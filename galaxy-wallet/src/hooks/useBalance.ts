import { useState, useEffect } from 'react';
import { getStellarService } from '../lib/galaxy-sdk';
import { AssetBalance } from '../types';
import { useWalletStore } from './use-wallet-store';

export function useBalance() {
    const { address, network } = useWalletStore();
    const [balances, setBalances] = useState<AssetBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBalances = async () => {
        if (!address) return;

        setLoading(true);
        setError(null);
        try {
            const stellarService = await getStellarService();
            const accountInfo = await stellarService.getAccountInfo(address);
            const formattedBalances: AssetBalance[] = accountInfo.balances.map((b: any) => ({
                code: b.asset === 'XLM' ? 'XLM' : b.asset,
                issuer: b.issuer,
                balance: b.balance,
            }));
            setBalances(formattedBalances);
            setError(null);
        } catch (err: any) {
            const errorMessage = err?.message || '';
            const isNotFunded = errorMessage.includes('Not Found') ||
                               errorMessage.includes('404') ||
                               errorMessage.includes('not funded');

            if (isNotFunded) {
                // Account not funded yet - show zero balance without error
                setBalances([{ code: 'XLM', balance: '0.00' }]);
                setError(null);
            } else {
                console.error('Error fetching balances:', err);
                setError('Could not fetch balances');
                if (address.startsWith('G')) {
                    setBalances([{ code: 'XLM', balance: '0.00' }]);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalances();
        const interval = setInterval(fetchBalances, 10000); // 10s refresh
        return () => clearInterval(interval);
    }, [address, network]);

    return { balances, loading, error, refresh: fetchBalances };
}
