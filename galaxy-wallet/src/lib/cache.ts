import { WalletTransaction, Network } from '../types';

interface CachedTransaction {
    cacheId: string;
    walletId: string;
    network: Network;
    id: string;
    hash: string;
    type: WalletTransaction['type'];
    asset: string;
    amount: string;
    from: string;
    to: string;
    timestamp: string;
    memo?: string;
    fee: string;
    successful: boolean;
}

export class TransactionCache {
    private readonly dbName = 'galaxy-wallet-db';
    private readonly storeName = 'transactions';
    private readonly dbVersion = 2;
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (db.objectStoreNames.contains(this.storeName)) {
                    db.deleteObjectStore(this.storeName);
                }

                const store = db.createObjectStore(this.storeName, { keyPath: 'cacheId' });
                store.createIndex('walletNetwork', ['walletId', 'network'], { unique: false });
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onerror = () => {
                reject(request.error ?? new Error('Failed to open transaction cache'));
            };
        });
    }

    async saveTransactions(walletId: string, network: Network, transactions: WalletTransaction[]): Promise<void> {
        await this.init();
        if (!this.db) return;

        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);

        for (const transaction of transactions) {
            const cached: CachedTransaction = {
                cacheId: `${walletId}:${network}:${transaction.id}`,
                walletId,
                network,
                id: transaction.id,
                hash: transaction.hash,
                type: transaction.type,
                asset: transaction.asset,
                amount: transaction.amount,
                from: transaction.from,
                to: transaction.to,
                timestamp: transaction.timestamp.toISOString(),
                memo: transaction.memo,
                fee: transaction.fee,
                successful: transaction.successful,
            };
            store.put(cached);
        }

        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error ?? new Error('Failed saving transactions'));
        });
    }

    async getTransactions(walletId: string, network: Network): Promise<WalletTransaction[]> {
        await this.init();
        if (!this.db) return [];

        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const index = store.index('walletNetwork');
        const request = index.getAll(IDBKeyRange.only([walletId, network]));

        const cached = await new Promise<CachedTransaction[]>((resolve, reject) => {
            request.onsuccess = () => resolve((request.result as CachedTransaction[]) ?? []);
            request.onerror = () => reject(request.error ?? new Error('Failed loading transactions'));
        });

        return cached.map((item) => ({
            id: item.id,
            hash: item.hash,
            type: item.type,
            asset: item.asset,
            amount: item.amount,
            from: item.from,
            to: item.to,
            timestamp: new Date(item.timestamp),
            memo: item.memo,
            fee: item.fee,
            successful: item.successful,
        }));
    }
}

export const transactionCache = new TransactionCache();
