/**
 * Invisible Wallet SDK for Web Applications
 * 
 * JavaScript/TypeScript SDK that provides a simple interface for web applications
 * to integrate with the Invisible Wallet system without handling Stellar complexity.
 */

import {
  CreateWalletRequest,
  RecoverWalletRequest,
  WalletResponse,
  WalletCreationResponse,
  WalletWithBalance,
  SignTransactionRequest,
  SignTransactionResponse,
  NetworkType
} from '@/types/invisible-wallet';
import { InvisibleWalletService, WalletStorage } from './wallet-service';

export interface SDKConfig {
  /** API endpoint for server-side operations */
  apiEndpoint?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Default network to use */
  defaultNetwork?: NetworkType;
  /** Platform ID for multi-tenant support */
  platformId: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom storage implementation */
  storage?: WalletStorage;
}

export interface WalletEventData {
  walletId: string;
  email: string;
  publicKey: string;
  network: NetworkType;
}

/**
 * Event types that can be emitted by the SDK
 */
export type WalletEventType =
  | 'walletCreated'
  | 'walletRecovered'
  | 'transactionSigned'
  | 'error';

/**
 * Event listener interface
 */
export type WalletEventListener = (data: unknown) => void;

/**
 * Browser-based storage implementation using IndexedDB
 */
class BrowserWalletStorage implements WalletStorage {
  private dbName = 'invisible-wallets';
  private version = 1;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('wallets')) {
          const walletStore = db.createObjectStore('wallets', { keyPath: 'id' });
          walletStore.createIndex('email-platform-network', ['email', 'platformId', 'network'], { unique: true });
        }

        if (!db.objectStoreNames.contains('auditLogs')) {
          db.createObjectStore('auditLogs', { keyPath: 'id' });
        }
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveWallet(wallet: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['wallets'], 'readwrite');
    const store = transaction.objectStore('wallets');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(wallet);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getWallet(email: string, platformId: string, network: NetworkType): Promise<any | null> {
    const db = await this.getDB();
    const transaction = db.transaction(['wallets'], 'readonly');
    const store = transaction.objectStore('wallets');
    const index = store.index('email-platform-network');

    return new Promise((resolve, reject) => {
      const request = index.get([email, platformId, network]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getWalletById(id: string): Promise<any | null> {
    const db = await this.getDB();
    const transaction = db.transaction(['wallets'], 'readonly');
    const store = transaction.objectStore('wallets');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateWalletAccess(id: string): Promise<void> {
    const wallet = await this.getWalletById(id);
    if (wallet) {
      wallet.lastAccessedAt = new Date().toISOString();
      await this.saveWallet(wallet);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveAuditLog(entry: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['auditLogs'], 'readwrite');
    const store = transaction.objectStore('auditLogs');
    await new Promise<void>((resolve, reject) => {
      const request = store.add(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWallet(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['wallets'], 'readwrite');
    const store = transaction.objectStore('wallets');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Main Invisible Wallet SDK class
 */
export class InvisibleWalletSDK {
  private config: SDKConfig;
  private service: InvisibleWalletService;
  private eventListeners: Map<WalletEventType, WalletEventListener[]> = new Map();

  constructor(config: SDKConfig) {
    this.config = {
      defaultNetwork: 'testnet',
      debug: false,
      ...config,
    };

    // Initialize storage
    const storage = config.storage || new BrowserWalletStorage();
    this.service = new InvisibleWalletService(storage);

    if (this.config.debug) {
      console.log('InvisibleWalletSDK initialized with config:', this.config);
    }
  }

  /**
   * Creates a new invisible wallet
   */
  async createWallet(
    email: string,
    passphrase: string,
    options?: {
      network?: NetworkType;
      metadata?: Record<string, unknown>;
    }
  ): Promise<WalletResponse> {
    try {
      const request: CreateWalletRequest = {
        email,
        passphrase,
        platformId: this.config.platformId,
        network: options?.network || this.config.defaultNetwork || 'testnet',
        metadata: options?.metadata,
      };

      const wallet = await this.service.createWallet(request);

      // Emit event
      this.emit('walletCreated', {
        walletId: wallet.id,
        email: wallet.email,
        publicKey: wallet.publicKey,
        network: wallet.network,
      });

      if (this.config.debug) {
        console.log('Wallet created successfully:', wallet.id);
      }

      return wallet;

    } catch (error) {
      this.handleError('createWallet', error);
      throw error;
    }
  }

  /**
   * Creates a new invisible wallet with keys (for demo purposes only)
   * WARNING: This method exposes the private key and should only be used for demos
   */
  async createWalletWithKeys(
    email: string,
    passphrase: string,
    options?: {
      network?: NetworkType;
      metadata?: Record<string, unknown>;
    }
  ): Promise<WalletCreationResponse> {
    try {
      const request: CreateWalletRequest = {
        email,
        passphrase,
        platformId: this.config.platformId,
        network: options?.network || this.config.defaultNetwork || 'testnet',
        metadata: options?.metadata,
      };

      const wallet = await this.service.createWalletWithKeys(request);

      // Emit event
      this.emit('walletCreated', {
        walletId: wallet.id,
        email: wallet.email,
        publicKey: wallet.publicKey,
        network: wallet.network,
      });

      if (this.config.debug) {
        console.log('Wallet created successfully with keys:', wallet.id);
      }

      return wallet;

    } catch (error) {
      this.handleError('createWalletWithKeys', error);
      throw error;
    }
  }

  /**
   * Recovers an existing invisible wallet
   */
  async recoverWallet(
    email: string,
    passphrase: string,
    options?: {
      network?: NetworkType;
    }
  ): Promise<WalletResponse> {
    try {
      const request: RecoverWalletRequest = {
        email,
        passphrase,
        platformId: this.config.platformId,
        network: options?.network || this.config.defaultNetwork || 'testnet',
      };

      const wallet = await this.service.recoverWallet(request);

      // Emit event
      this.emit('walletRecovered', {
        walletId: wallet.id,
        email: wallet.email,
        publicKey: wallet.publicKey,
        network: wallet.network,
      });

      if (this.config.debug) {
        console.log('Wallet recovered successfully:', wallet.id);
      }

      return wallet;

    } catch (error) {
      this.handleError('recoverWallet', error);
      throw error;
    }
  }

  /**
   * Gets wallet information with balance
   */
  async getWallet(
    email: string,
    options?: {
      network?: NetworkType;
    }
  ): Promise<WalletWithBalance | null> {
    try {
      const network = options?.network || this.config.defaultNetwork || 'testnet';

      const wallet = await this.service.getWalletWithBalance(
        email,
        this.config.platformId,
        network
      );

      if (this.config.debug && wallet) {
        console.log('Wallet retrieved:', wallet.id, 'Balance:', wallet.balances);
      }

      return wallet;

    } catch (error) {
      this.handleError('getWallet', error);
      throw error;
    }
  }

  /**
   * Signs a Stellar transaction
   */
  async signTransaction(
    walletId: string,
    email: string,
    passphrase: string,
    transactionXDR: string
  ): Promise<SignTransactionResponse> {
    try {
      const request: SignTransactionRequest = {
        walletId,
        email,
        passphrase,
        transactionXDR,
        platformId: this.config.platformId,
      };

      const result = await this.service.signTransaction(request);

      if (result.success) {
        // Emit event
        this.emit('transactionSigned', {
          walletId,
          transactionHash: result.transactionHash,
          signedXDR: result.signedXDR,
        });

        if (this.config.debug) {
          console.log('Transaction signed successfully:', result.transactionHash);
        }
      }

      return result;

    } catch (error) {
      this.handleError('signTransaction', error);
      throw error;
    }
  }

  /**
   * Validates passphrase strength
   */
  validatePassphrase(passphrase: string): { isValid: boolean; errors: string[] } {
    // Basic validation - mirrors crypto service validation
    const errors: string[] = [];

    if (passphrase.length < 8) {
      errors.push('Passphrase must be at least 8 characters long');
    }

    if (passphrase.length > 128) {
      errors.push('Passphrase must not exceed 128 characters');
    }

    if (!/[a-z]/.test(passphrase)) {
      errors.push('Passphrase must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(passphrase)) {
      errors.push('Passphrase must contain at least one uppercase letter');
    }

    if (!/\d/.test(passphrase)) {
      errors.push('Passphrase must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
      errors.push('Passphrase must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Adds an event listener
   */
  on(event: WalletEventType, listener: WalletEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Removes an event listener
   */
  off(event: WalletEventType, listener: WalletEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emits an event to all listeners
   */
  private emit(event: WalletEventType, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  /**
   * Handles and logs errors
   */
  private handleError(operation: string, error: unknown): void {
    const errorData = {
      operation,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    if (this.config.debug) {
      console.error(`InvisibleWalletSDK Error in ${operation}:`, error);
    }

    this.emit('error', errorData);
  }

  /**
   * Gets SDK configuration (without sensitive data)
   */
  getConfig(): Omit<SDKConfig, 'apiKey'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey, ...publicConfig } = this.config;
    return publicConfig;
  }

  /**
   * Checks if the SDK is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.platformId;
  }

  async establishUSDCTrustline(
    walletId: string,
    email: string,
    passphrase: string
  ): Promise<SignTransactionResponse> {
    return this.service.establishUSDCTrustline(walletId, email, passphrase, this.config.platformId)
  }

  async sendUSDC(params: {
    walletId: string
    email: string
    passphrase: string
    toAddress: string
    amount: string
  }): Promise<SignTransactionResponse> {
    return this.service.sendUSDC({ ...params, platformId: this.config.platformId })
  }
}

/**
 * Factory function to create SDK instance
 */
export function createInvisibleWalletSDK(config: SDKConfig): InvisibleWalletSDK {
  return new InvisibleWalletSDK(config);
}

/**
 * Default export for convenience
 */
export default InvisibleWalletSDK;
