import { useWalletStore } from './use-wallet-store';
import { useState } from 'react';

export function useWallet() {
    const { walletId, address, isConnected, network, connect, disconnect, setNetwork } = useWalletStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = async () => {
        setLoading(true);
        setError(null);
        try {
            // Generating a unique ID for the demo session
            const demoUserId = `user_${Date.now()}`;
            const demoEmail = `demo@galaxy.wallet`;
            const demoPassword = 'SecurePassword123!';

            // Call the API route to create the wallet server-side
            // This avoids bundling Node.js-only modules (argon2) on the client
            const response = await fetch('/api/wallet/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: demoUserId,
                    email: demoEmail,
                    network: network,
                    password: demoPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Wallet creation failed');
            }

            // Store walletId and publicKey from the SDK response
            connect(data.walletId, data.publicKey);

            console.log('✅ Wallet created via official SDK:', data.walletId, data.publicKey);
        } catch (err) {
            console.error('SDK Error:', err);
            setError(err instanceof Error ? err.message : 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const switchNetwork = (newNetwork: 'mainnet' | 'testnet') => {
        setNetwork(newNetwork);
    };

    return {
        walletId,
        address,
        isConnected,
        network,
        loading,
        error,
        connectWallet,
        disconnect,
        switchNetwork,
    };
}
