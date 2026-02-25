import type { AuditLogEntry, InvisibleWallet, NetworkType } from '@/types/invisible-wallet';
import { CryptoService } from '../crypto-service';
import type { WalletStorage } from '../wallet-service';

export interface PostgresWalletStorageOptions {
  apiEndpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

type StoredWalletRecord = {
  id: string;
  email_hash: string;
  platform_id: string;
  public_key: string;
  encrypted_secret: string;
  salt: string;
  iv: string;
  network: NetworkType;
  status: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown> | null;
};

export class PostgresWalletStorage implements WalletStorage {
  private apiEndpoint: string;
  private apiKey?: string;
  private headers?: Record<string, string>;

  constructor(options: PostgresWalletStorageOptions) {
    this.apiEndpoint = options.apiEndpoint.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.headers = options.headers;
  }

  async saveWallet(wallet: InvisibleWallet): Promise<void> {
    const emailHash = await CryptoService.hashString(wallet.email);
    const payload = this.toStoredWallet(wallet, emailHash);

    await this.request('/wallets', {
      method: 'POST',
      body: payload,
    });
  }

  async getWallet(email: string, platformId: string, network: NetworkType): Promise<InvisibleWallet | null> {
    const emailHash = await CryptoService.hashString(email);
    const query = new URLSearchParams({
      emailHash,
      platformId,
      network,
    });

    const response = await this.request(`/wallets?${query.toString()}`, { method: 'GET' });
    if (!response) {
      return null;
    }

    return this.fromStoredWallet(response as StoredWalletRecord, email, emailHash);
  }

  async getWalletById(id: string): Promise<InvisibleWallet | null> {
    const response = await this.request(`/wallets/${id}`, { method: 'GET' });
    if (!response) {
      return null;
    }

    const record = response as StoredWalletRecord;
    return this.fromStoredWallet(record, '', record.email_hash);
  }

  async updateWalletAccess(id: string): Promise<void> {
    await this.request(`/wallets/${id}`, {
      method: 'PUT',
      body: {
        last_accessed_at: new Date().toISOString(),
      },
    });
  }

  async saveAuditLog(_entry: AuditLogEntry): Promise<void> {
    return;
  }

  async deleteWallet(id: string): Promise<void> {
    await this.request(`/wallets/${id}`, { method: 'DELETE' });
  }

  private async request(
    path: string,
    options: { method: string; body?: Record<string, unknown> }
  ): Promise<unknown | null> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.apiEndpoint}${path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Wallet storage request failed (${response.status}): ${message}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  private toStoredWallet(wallet: InvisibleWallet, emailHash: string): StoredWalletRecord {
    return {
      id: wallet.id,
      email_hash: emailHash,
      platform_id: wallet.platformId,
      public_key: wallet.publicKey,
      encrypted_secret: wallet.encryptedSecret,
      salt: wallet.salt,
      iv: wallet.iv,
      network: wallet.network,
      status: wallet.status,
      created_at: wallet.createdAt,
      last_accessed_at: wallet.lastAccessedAt,
      metadata: wallet.metadata ?? null,
    };
  }

  private fromStoredWallet(
    record: StoredWalletRecord,
    email: string,
    emailHash: string
  ): InvisibleWallet {
    return {
      id: record.id,
      email,
      emailHash,
      publicKey: record.public_key,
      encryptedSecret: record.encrypted_secret,
      salt: record.salt,
      iv: record.iv,
      platformId: record.platform_id,
      network: record.network,
      status: record.status as InvisibleWallet['status'],
      createdAt: record.created_at || new Date().toISOString(),
      lastAccessedAt: record.last_accessed_at,
      metadata: record.metadata ?? undefined,
    };
  }
}
