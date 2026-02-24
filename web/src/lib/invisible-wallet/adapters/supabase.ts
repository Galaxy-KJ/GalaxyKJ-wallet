import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditLogEntry, InvisibleWallet, NetworkType } from '@/types/invisible-wallet';
import { CryptoService } from '../crypto-service';
import type { WalletStorage } from '../wallet-service';

export interface SupabaseWalletStorageOptions {
  client: SupabaseClient;
  table?: string;
  auditTable?: string;
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

export class SupabaseWalletStorage implements WalletStorage {
  private client: SupabaseClient;
  private table: string;
  private auditTable?: string;

  constructor(options: SupabaseWalletStorageOptions) {
    this.client = options.client;
    this.table = options.table || 'wallets';
    this.auditTable = options.auditTable;
  }

  async saveWallet(wallet: InvisibleWallet): Promise<void> {
    const emailHash = await CryptoService.hashString(wallet.email);
    const record = this.toStoredWallet(wallet, emailHash);

    const { error } = await this.client
      .from(this.table)
      .upsert(record, {
        onConflict: 'email_hash,platform_id,network',
      });

    if (error) {
      throw new Error(`Supabase wallet save failed: ${error.message}`);
    }
  }

  async getWallet(email: string, platformId: string, network: NetworkType): Promise<InvisibleWallet | null> {
    const emailHash = await CryptoService.hashString(email);
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('email_hash', emailHash)
      .eq('platform_id', platformId)
      .eq('network', network)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.fromStoredWallet(data as StoredWalletRecord, email, emailHash);
  }

  async getWalletById(id: string): Promise<InvisibleWallet | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const record = data as StoredWalletRecord;
    return this.fromStoredWallet(record, '', record.email_hash);
  }

  async updateWalletAccess(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.table)
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase wallet access update failed: ${error.message}`);
    }
  }

  async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    if (!this.auditTable) {
      return;
    }

    const record = {
      id: entry.id,
      wallet_id: entry.walletId,
      operation: entry.operation,
      timestamp: entry.timestamp,
      platform_id: entry.platformId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      success: entry.success,
      error: entry.error ?? null,
      metadata: entry.metadata ?? null,
    };

    const { error } = await this.client.from(this.auditTable).insert(record);
    if (error) {
      throw new Error(`Supabase audit log save failed: ${error.message}`);
    }
  }

  async deleteWallet(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase wallet delete failed: ${error.message}`);
    }
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
