import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Network, WalletState } from '../types';

interface WalletStore extends WalletState {
    setAddress: (address: string | null) => void;
    setNetwork: (network: Network) => void;
    connect: (walletId: string, address: string) => void;
    disconnect: () => void;
}

export const useWalletStore = create<WalletStore>()(
    persist(
        (set) => ({
            walletId: null,
            address: null,
            publicKey: null,
            isConnected: false,
            network: 'testnet',
            setAddress: (address) => set({ address, publicKey: address, isConnected: !!address }),
            setNetwork: (network) => set({ network }),
            connect: (walletId, address) => set({ walletId, address, publicKey: address, isConnected: true }),
            disconnect: () => set({ walletId: null, address: null, publicKey: null, isConnected: false }),
        }),
        {
            name: 'galaxy-wallet-storage',
        }
    )
);
