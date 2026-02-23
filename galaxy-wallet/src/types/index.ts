export type Network = 'mainnet' | 'testnet';

export interface WalletState {
    walletId: string | null;
    address: string | null;
    publicKey: string | null;
    email?: string | null;
    isConnected: boolean;
    network: Network;
}

export interface AssetBalance {
    code: string;
    issuer?: string;
    balance: string;
    name?: string;
}

export interface WalletTransaction {
    id: string;
    hash: string;
    type: 'payment' | 'receive' | 'trustline' | 'other';
    asset: string;        // 'XLM' | 'USDC' | ...
    amount: string;
    from: string;
    to: string;
    timestamp: Date;
    memo?: string;
    fee: string;          // in XLM stroops
    successful: boolean;
}

export interface Transaction extends Omit<WalletTransaction, 'timestamp'> {
    timestamp: string;
    status: 'success' | 'failed' | 'pending';
}

export interface GalaxyKeystore {
    version: string;
    email: string;
    platformId: string;
    network: Network;
    encryptedSecret: string;
    salt: string;
    iv: string;
    createdAt: string;
    checksum: string;
}

