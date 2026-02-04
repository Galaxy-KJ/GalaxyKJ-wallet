export type Network = 'mainnet' | 'testnet';

export interface WalletState {
    walletId: string | null;
    address: string | null;
    publicKey: string | null;
    isConnected: boolean;
    network: Network;
}

export interface AssetBalance {
    code: string;
    issuer?: string;
    balance: string;
    name?: string;
}

export interface Transaction {
    id: string;
    type: 'payment' | 'create_account' | 'change_trust' | 'other';
    amount?: string;
    asset?: string;
    from?: string;
    to?: string;
    timestamp: string;
    status: 'success' | 'failed' | 'pending';
    hash: string;
}
