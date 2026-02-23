import * as StellarSdk from '@stellar/stellar-sdk';
import { WalletTransaction, Network, GalaxyKeystore } from '../types';

export const GALAXY_CONFIG = {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
};



export async function exportWallet(walletId: string, passphrase: string): Promise<Blob> {
    const response = await fetch('/api/wallet/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, password: passphrase })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Export failed');

    const keystore: GalaxyKeystore = data.keystore;

    // Compute checksum (excluding the checksum field itself)
    const { checksum, ...rest } = keystore;
    const computedChecksum = await computeChecksum(rest);
    keystore.checksum = computedChecksum;

    const blob = new Blob([JSON.stringify(keystore, null, 2)], { type: 'application/json' });
    return blob;
}

export async function importWallet(file: File, passphrase: string): Promise<any> {
    const text = await file.text();
    const keystore: GalaxyKeystore = JSON.parse(text);

    // Validate checksum
    const { checksum, ...rest } = keystore;
    const computedChecksum = await computeChecksum(rest);
    if (computedChecksum !== checksum) {
        throw new Error('Checksum mismatch: File may be corrupted or tampered with');
    }

    // Call API to import/sync with backend
    const response = await fetch('/api/wallet/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keystore, password: passphrase })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Import failed');

    return data;
}

async function computeChecksum(data: any): Promise<string> {
    const s = JSON.stringify(data);
    const msgUint8 = new TextEncoder().encode(s);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface StellarAccountBalance {
    asset: string;
    issuer?: string;
    balance: string;
}

export interface StellarAccountInfo {
    balances: StellarAccountBalance[];
}

export interface StellarServiceClient {
    getAccountInfo(address: string): Promise<StellarAccountInfo>;
}

let stellarServiceInstance: StellarServiceClient | null = null;

export async function getStellarService(): Promise<StellarServiceClient> {
    if (!stellarServiceInstance) {
        const { StellarService } = await import('@galaxy-kj/core-stellar-sdk');
        stellarServiceInstance = new StellarService(GALAXY_CONFIG) as StellarServiceClient;
    }
    return stellarServiceInstance;
}

export interface GetTransactionHistoryOptions {
    walletId: string;
    limit?: number;
    cursor?: string;
    network?: Network;
}

interface HorizonOperationLike {
    id: string;
    type: string;
    created_at: string;
    source_account?: string;
    transaction_hash: string;
    transaction_successful?: boolean;
    paging_token: string;
    [key: string]: unknown;
}

interface HorizonTransactionLike {
    fee_charged?: string;
    memo?: string;
    memo_type?: string;
}

function readString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function readBool(value: unknown, fallback = false): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function mapOperationType(op: HorizonOperationLike, walletId: string): WalletTransaction['type'] {
    if (op.type === 'change_trust') return 'trustline';

    if (op.type === 'payment' || op.type === 'create_account' || op.type === 'path_payment_strict_receive' || op.type === 'path_payment_strict_send') {
        const to = readString(op.to) || readString(op.account);
        return to === walletId ? 'receive' : 'payment';
    }

    return 'other';
}

function mapOperationAsset(op: HorizonOperationLike): string {
    if (readString(op.asset_type) === 'native') return 'XLM';

    if (op.type === 'path_payment_strict_send') {
        return readString(op.source_asset_code) || (readString(op.source_asset_type) === 'native' ? 'XLM' : 'UNKNOWN');
    }

    if (op.type === 'path_payment_strict_receive') {
        return readString(op.asset_code) || readString(op.destination_asset_code) || (readString(op.asset_type) === 'native' ? 'XLM' : 'UNKNOWN');
    }

    return readString(op.asset_code) || 'XLM';
}

function mapOperationAmount(op: HorizonOperationLike): string {
    return readString(op.amount) || readString(op.starting_balance) || readString(op.limit) || '0';
}

function mapOperationTo(op: HorizonOperationLike): string {
    return readString(op.to) || readString(op.account);
}

function mapMemo(tx: HorizonTransactionLike | undefined): string | undefined {
    if (!tx) return undefined;
    if (tx.memo_type === 'none') return undefined;
    const memo = readString(tx.memo);
    return memo || undefined;
}

export async function getTransactionHistory(options: GetTransactionHistoryOptions): Promise<{ transactions: WalletTransaction[]; nextCursor: string }> {
    const { walletId, limit = 20, cursor, network = 'testnet' } = options;
    const horizonUrl = network === 'mainnet' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
    const server = new StellarSdk.Horizon.Server(horizonUrl);

    const [operationsResponse, paymentsResponse] = await Promise.all([
        server.operations().forAccount(walletId).limit(limit).cursor(cursor ?? '').order('desc').call(),
        server.payments().forAccount(walletId).limit(limit).cursor(cursor ?? '').order('desc').call(),
    ]);

    const mergedMap = new Map<string, HorizonOperationLike>();
    const operationRecords = operationsResponse.records as unknown as HorizonOperationLike[];
    const paymentRecords = paymentsResponse.records as unknown as HorizonOperationLike[];

    for (const record of operationRecords) {
        mergedMap.set(record.id, record);
    }
    for (const record of paymentRecords) {
        if (!mergedMap.has(record.id)) {
            mergedMap.set(record.id, record);
        }
    }

    const mergedRecords = Array.from(mergedMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

    const uniqueHashes = Array.from(
        new Set(
            mergedRecords
                .map((op) => readString(op.transaction_hash))
                .filter((hash) => hash.length > 0)
        )
    );

    const transactionDetails = new Map<string, { memo?: string; fee: string }>();
    await Promise.all(
        uniqueHashes.map(async (hash) => {
            try {
                const tx = (await server.transactions().transaction(hash).call()) as HorizonTransactionLike;
                transactionDetails.set(hash, {
                    memo: mapMemo(tx),
                    fee: readString(tx.fee_charged),
                });
            } catch {
                transactionDetails.set(hash, { memo: undefined, fee: '' });
            }
        })
    );

    const transactions: WalletTransaction[] = mergedRecords.map((op) => {
        const hash = readString(op.transaction_hash);
        const txDetail = transactionDetails.get(hash);

        return {
            id: op.id,
            hash,
            type: mapOperationType(op, walletId),
            asset: mapOperationAsset(op),
            amount: mapOperationAmount(op),
            from: readString(op.source_account),
            to: mapOperationTo(op),
            timestamp: new Date(op.created_at),
            memo: txDetail?.memo,
            fee: txDetail?.fee ?? '',
            successful: readBool(op.transaction_successful, true),
        };
    });

    return {
        transactions,
        nextCursor: operationRecords.length > 0 ? readString(operationRecords[operationRecords.length - 1].paging_token) : '',
    };
}
