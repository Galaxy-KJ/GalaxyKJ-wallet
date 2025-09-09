/**
 * Robust IndexedDB Database Manager
 * 
 * Comprehensive database wrapper with error handling, versioning, 
 * backup/restore, and graceful degradation for Galaxy Smart Wallet
 */

import { openDB, deleteDB, DBSchema, IDBPDatabase, StoreNames } from 'idb';
import { DatabaseMigrationManager } from './migrations';
import { FallbackStorageManager } from './fallback-storage';

// Database configuration
export const DB_CONFIG = {
  name: 'galaxy-wallet-db',
  version: 2,
  stores: {
    wallets: 'wallets',
    settings: 'settings',
    backups: 'backups',
    metadata: 'metadata',
  },
} as const;

// Database schema interface
export interface GalaxyWalletDB extends DBSchema {
  wallets: {
    key: string;
    value: {
      id: string;
      encryptedData: string;
      keyHash: string; // Hash of the encryption key for validation
      version: number;
      createdAt: string;
      updatedAt: string;
      backupCount: number;
      checksumSHA256: string; // Data integrity validation
    };
    indexes: {
      'by-created': string;
      'by-updated': string;
      'by-version': number;
    };
  };
  settings: {
    key: string;
    value: {
      id: string;
      key: string;
      value: any;
      encrypted: boolean;
      version: number;
      createdAt: string;
      updatedAt: string;
    };
    indexes: {
      'by-key': string;
      'by-encrypted': boolean;
    };
  };
  backups: {
    key: string;
    value: {
      id: string;
      walletId: string;
      backupData: string;
      backupType: 'manual' | 'automatic' | 'rotation';
      createdAt: string;
      expiresAt?: string;
      checksumSHA256: string;
      compressionUsed: boolean;
    };
    indexes: {
      'by-wallet': string;
      'by-created': string;
      'by-type': string;
      'by-expires': string;
    };
  };
  metadata: {
    key: string;
    value: {
      id: string;
      key: string;
      value: any;
      version: number;
      createdAt: string;
      updatedAt: string;
    };
    indexes: {
      'by-key': string;
      'by-version': number;
    };
  };
}

// Error types for better error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseUnavailableError extends DatabaseError {
  constructor(originalError?: Error) {
    super(
      'IndexedDB is not available or has been disabled',
      'DB_UNAVAILABLE',
      'initialization',
      originalError
    );
  }
}

export class DatabaseCorruptedError extends DatabaseError {
  constructor(originalError?: Error) {
    super(
      'Database appears to be corrupted',
      'DB_CORRUPTED',
      'integrity_check',
      originalError
    );
  }
}

export class DatabaseVersionError extends DatabaseError {
  constructor(expectedVersion: number, actualVersion: number) {
    super(
      `Database version mismatch: expected ${expectedVersion}, got ${actualVersion}`,
      'DB_VERSION_MISMATCH',
      'version_check'
    );
  }
}

// Database manager class
export class GalaxyDatabaseManager {
  private db: IDBPDatabase<GalaxyWalletDB> | null = null;
  private migrationManager: DatabaseMigrationManager;
  private fallbackStorageManager: FallbackStorageManager;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  constructor() {
    this.migrationManager = new DatabaseMigrationManager();
    this.fallbackStorageManager = new FallbackStorageManager({
      enableSessionStorage: true,
      enableLocalStorage: false, // Disabled for security
      enableMemoryStorage: true,
      maxMemoryItems: 10,
    });
  }

  /**
   * Initialize the database with proper error handling and migrations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._initialize();
    await this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // Check if IndexedDB is available
      if (!this._isIndexedDBAvailable()) {
        console.warn('IndexedDB not available, falling back to memory storage');
        this.isInitialized = true;
        return;
      }

      // Attempt to open database with retries
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          this.db = await openDB<GalaxyWalletDB>(
            DB_CONFIG.name,
            DB_CONFIG.version,
            {
              upgrade: async (db, oldVersion, newVersion, transaction) => {
                console.log(`Upgrading database from v${oldVersion} to v${newVersion}`);
                await this.migrationManager.migrate(db, oldVersion, newVersion, transaction);
              },
              blocked: () => {
                console.warn('Database upgrade blocked by another tab');
              },
              blocking: () => {
                console.warn('Database is blocking another tab upgrade');
              },
              terminated: () => {
                console.error('Database connection was terminated');
                this.db = null;
                this.isInitialized = false;
              },
            }
          );

          // Validate database integrity
          await this._validateDatabaseIntegrity();
          
          this.isInitialized = true;
          console.log('Database initialized successfully');
          return;
        } catch (error) {
          lastError = error as Error;
          console.warn(`Database initialization attempt ${attempt} failed:`, error);
          
          if (attempt < this.maxRetries) {
            await this._delay(this.retryDelayMs * attempt);
          }
        }
      }

      // If all retries failed, handle the error appropriately
      if (lastError) {
        if (this._isQuotaExceededError(lastError)) {
          throw new DatabaseError(
            'Storage quota exceeded. Please free up space.',
            'QUOTA_EXCEEDED',
            'initialization',
            lastError
          );
        } else if (this._isCorruptionError(lastError)) {
          console.warn('Database appears corrupted, attempting recovery...');
          await this._attemptDatabaseRecovery();
        } else {
          throw new DatabaseUnavailableError(lastError);
        }
      }
    } catch (error) {
      console.error('Critical database initialization error:', error);
      // Fall back to memory storage
      this.db = null;
      this.isInitialized = true;
    }
  }

  /**
   * Execute database operations with retry logic and error handling
   */
  private async _executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    useTransaction = true
  ): Promise<T> {
    await this.initialize();

    if (!this.db) {
      throw new DatabaseUnavailableError();
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${operationName} attempt ${attempt} failed:`, error);

        if (this._isTransientError(error as Error) && attempt < this.maxRetries) {
          await this._delay(this.retryDelayMs * attempt);
          continue;
        }

        // If it's a non-transient error, don't retry
        break;
      }
    }

    throw new DatabaseError(
      `${operationName} failed after ${this.maxRetries} attempts`,
      'OPERATION_FAILED',
      operationName.toLowerCase().replace(' ', '_'),
      lastError || undefined
    );
  }

  /**
   * Store wallet data with integrity checks
   */
  async storeWallet(
    id: string,
    encryptedData: string,
    keyHash: string,
    version: number = 1
  ): Promise<void> {
    const checksumSHA256 = await this._calculateSHA256(encryptedData);
    const now = new Date().toISOString();

    const walletData = {
      id,
      encryptedData,
      keyHash,
      version,
      createdAt: now,
      updatedAt: now,
      backupCount: 0,
      checksumSHA256,
    };

    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Use fallback storage manager
        await this.fallbackStorageManager.set(`wallet_${id}`, walletData);
        return;
      }

      const tx = this.db.transaction('wallets', 'readwrite');
      await tx.store.put(walletData);
      await tx.done;
      
      console.log(`Wallet ${id} stored successfully`);
    }, 'Store Wallet');
  }

  /**
   * Retrieve wallet data with integrity validation
   */
  async getWallet(id: string): Promise<GalaxyWalletDB['wallets']['value'] | null> {
    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Use fallback storage manager
        return await this.fallbackStorageManager.get(`wallet_${id}`) || null;
      }

      const wallet = await this.db.get('wallets', id);
      if (!wallet) return null;

      // Validate data integrity
      const calculatedChecksum = await this._calculateSHA256(wallet.encryptedData);
      if (calculatedChecksum !== wallet.checksumSHA256) {
        throw new DatabaseCorruptedError(
          new Error(`Checksum mismatch for wallet ${id}`)
        );
      }

      return wallet;
    }, 'Get Wallet');
  }

  /**
   * Update wallet data
   */
  async updateWallet(
    id: string,
    encryptedData: string,
    keyHash?: string
  ): Promise<void> {
    return this._executeWithRetry(async () => {
      const existingWallet = await this.getWallet(id);
      if (!existingWallet) {
        throw new DatabaseError(
          `Wallet ${id} not found`,
          'WALLET_NOT_FOUND',
          'update_wallet'
        );
      }

      const checksumSHA256 = await this._calculateSHA256(encryptedData);
      const updatedWallet = {
        ...existingWallet,
        encryptedData,
        keyHash: keyHash || existingWallet.keyHash,
        updatedAt: new Date().toISOString(),
        version: existingWallet.version + 1,
        checksumSHA256,
      };

      if (!this.db) {
        // Fallback storage
        this.fallbackStorage.set(`wallet_${id}`, updatedWallet);
        return;
      }

      const tx = this.db.transaction('wallets', 'readwrite');
      await tx.store.put(updatedWallet);
      await tx.done;
      
      console.log(`Wallet ${id} updated successfully`);
    }, 'Update Wallet');
  }

  /**
   * Delete wallet data
   */
  async deleteWallet(id: string): Promise<void> {
    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Fallback storage
        this.fallbackStorage.delete(`wallet_${id}`);
        return;
      }

      const tx = this.db.transaction('wallets', 'readwrite');
      await tx.store.delete(id);
      await tx.done;
      
      console.log(`Wallet ${id} deleted successfully`);
    }, 'Delete Wallet');
  }

  /**
   * List all wallets
   */
  async listWallets(): Promise<GalaxyWalletDB['wallets']['value'][]> {
    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Fallback storage
        const wallets: GalaxyWalletDB['wallets']['value'][] = [];
        for (const [key, value] of this.fallbackStorage.entries()) {
          if (key.startsWith('wallet_')) {
            wallets.push(value);
          }
        }
        return wallets.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return await this.db.getAll('wallets');
    }, 'List Wallets');
  }

  /**
   * Store application settings
   */
  async storeSetting(key: string, value: any, encrypted = false): Promise<void> {
    const now = new Date().toISOString();
    const settingData = {
      id: `setting_${key}`,
      key,
      value: encrypted ? value : JSON.stringify(value),
      encrypted,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Fallback storage
        this.fallbackStorage.set(`setting_${key}`, settingData);
        return;
      }

      const tx = this.db.transaction('settings', 'readwrite');
      await tx.store.put(settingData);
      await tx.done;
    }, 'Store Setting');
  }

  /**
   * Retrieve application settings
   */
  async getSetting(key: string): Promise<any> {
    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Fallback storage
        const setting = this.fallbackStorage.get(`setting_${key}`);
        if (!setting) return null;
        return setting.encrypted ? setting.value : JSON.parse(setting.value);
      }

      const setting = await this.db.get('settings', `setting_${key}`);
      if (!setting) return null;
      
      return setting.encrypted ? setting.value : JSON.parse(setting.value);
    }, 'Get Setting');
  }

  /**
   * Create backup of wallet data
   */
  async createBackup(
    walletId: string,
    backupType: 'manual' | 'automatic' | 'rotation' = 'manual',
    compressionUsed = false
  ): Promise<string> {
    const wallet = await this.getWallet(walletId);
    if (!wallet) {
      throw new DatabaseError(
        `Wallet ${walletId} not found for backup`,
        'WALLET_NOT_FOUND',
        'create_backup'
      );
    }

    const backupId = `backup_${walletId}_${Date.now()}`;
    const backupData = JSON.stringify(wallet);
    const checksumSHA256 = await this._calculateSHA256(backupData);
    const now = new Date().toISOString();

    // Set expiration for automatic backups (30 days)
    let expiresAt: string | undefined;
    if (backupType === 'automatic') {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      expiresAt = expirationDate.toISOString();
    }

    const backup = {
      id: backupId,
      walletId,
      backupData,
      backupType,
      createdAt: now,
      expiresAt,
      checksumSHA256,
      compressionUsed,
    };

    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Fallback storage
        this.fallbackStorage.set(`backup_${backupId}`, backup);
        return backupId;
      }

      const tx = this.db.transaction(['backups', 'wallets'], 'readwrite');
      
      // Store backup
      await tx.objectStore('backups').put(backup);
      
      // Update wallet backup count
      const updatedWallet = { ...wallet, backupCount: wallet.backupCount + 1 };
      await tx.objectStore('wallets').put(updatedWallet);
      
      await tx.done;
      
      console.log(`Backup ${backupId} created for wallet ${walletId}`);
      return backupId;
    }, 'Create Backup');
  }

  /**
   * Restore wallet from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Fallback storage
        const backup = this.fallbackStorage.get(`backup_${backupId}`);
        if (!backup) {
          throw new DatabaseError(
            `Backup ${backupId} not found`,
            'BACKUP_NOT_FOUND',
            'restore_backup'
          );
        }

        const walletData = JSON.parse(backup.backupData);
        this.fallbackStorage.set(`wallet_${walletData.id}`, walletData);
        return;
      }

      const backup = await this.db.get('backups', backupId);
      if (!backup) {
        throw new DatabaseError(
          `Backup ${backupId} not found`,
          'BACKUP_NOT_FOUND',
          'restore_backup'
        );
      }

      // Validate backup integrity
      const calculatedChecksum = await this._calculateSHA256(backup.backupData);
      if (calculatedChecksum !== backup.checksumSHA256) {
        throw new DatabaseCorruptedError(
          new Error(`Backup ${backupId} checksum validation failed`)
        );
      }

      // Restore wallet data
      const walletData = JSON.parse(backup.backupData);
      walletData.updatedAt = new Date().toISOString();
      
      const tx = this.db.transaction('wallets', 'readwrite');
      await tx.store.put(walletData);
      await tx.done;
      
      console.log(`Wallet restored from backup ${backupId}`);
    }, 'Restore From Backup');
  }

  /**
   * Get all backups for a wallet
   */
  async getWalletBackups(walletId: string): Promise<GalaxyWalletDB['backups']['value'][]> {
    return this._executeWithRetry(async () => {
      if (!this.db) {
        // Fallback storage
        const backups: GalaxyWalletDB['backups']['value'][] = [];
        for (const [key, value] of this.fallbackStorage.entries()) {
          if (key.startsWith('backup_') && value.walletId === walletId) {
            backups.push(value);
          }
        }
        return backups.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return await this.db.getAllFromIndex('backups', 'by-wallet', walletId);
    }, 'Get Wallet Backups');
  }

  /**
   * Clean up expired backups
   */
  async cleanupExpiredBackups(): Promise<number> {
    return this._executeWithRetry(async () => {
      const now = new Date().toISOString();
      let deletedCount = 0;

      if (!this.db) {
        // Fallback storage cleanup
        const toDelete: string[] = [];
        for (const [key, value] of this.fallbackStorage.entries()) {
          if (key.startsWith('backup_') && value.expiresAt && value.expiresAt < now) {
            toDelete.push(key);
          }
        }
        for (const key of toDelete) {
          this.fallbackStorage.delete(key);
          deletedCount++;
        }
        return deletedCount;
      }

      const tx = this.db.transaction('backups', 'readwrite');
      const index = tx.store.index('by-expires');
      
      for await (const cursor of index.iterate(IDBKeyRange.upperBound(now))) {
        if (cursor.value.expiresAt && cursor.value.expiresAt < now) {
          await cursor.delete();
          deletedCount++;
        }
      }
      
      await tx.done;
      console.log(`Cleaned up ${deletedCount} expired backups`);
      return deletedCount;
    }, 'Cleanup Expired Backups');
  }

  /**
   * Get database status and health information
   */
  async getStatus(): Promise<{
    isAvailable: boolean;
    isInitialized: boolean;
    version: number;
    storageUsed: number;
    storageQuota: number;
    walletCount: number;
    backupCount: number;
    lastHealthCheck: string;
  }> {
    const status = {
      isAvailable: !!this.db,
      isInitialized: this.isInitialized,
      version: DB_CONFIG.version,
      storageUsed: 0,
      storageQuota: 0,
      walletCount: 0,
      backupCount: 0,
      lastHealthCheck: new Date().toISOString(),
    };

    try {
      if (this.db) {
        const wallets = await this.listWallets();
        status.walletCount = wallets.length;

        // Get storage usage estimate
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          status.storageUsed = estimate.usage || 0;
          status.storageQuota = estimate.quota || 0;
        }

        // Count backups
        const allBackups = await this.db.getAll('backups');
        status.backupCount = allBackups.length;
      } else {
        // Fallback storage status
        let walletCount = 0;
        let backupCount = 0;
        for (const [key] of this.fallbackStorage.entries()) {
          if (key.startsWith('wallet_')) walletCount++;
          if (key.startsWith('backup_')) backupCount++;
        }
        status.walletCount = walletCount;
        status.backupCount = backupCount;
      }
    } catch (error) {
      console.error('Error getting database status:', error);
    }

    return status;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Completely reset the database (use with caution)
   */
  async reset(): Promise<void> {
    try {
      await this.close();
      await deleteDB(DB_CONFIG.name);
      this.fallbackStorage.clear();
      console.log('Database reset completed');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw new DatabaseError(
        'Failed to reset database',
        'RESET_FAILED',
        'reset',
        error as Error
      );
    }
  }

  // Private helper methods

  private _isIndexedDBAvailable(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        'indexedDB' in window &&
        window.indexedDB !== null
      );
    } catch {
      return false;
    }
  }

  private async _validateDatabaseIntegrity(): Promise<void> {
    if (!this.db) return;

    try {
      // Test basic operations
      await this.db.transaction('metadata', 'readonly');
      console.log('Database integrity check passed');
    } catch (error) {
      throw new DatabaseCorruptedError(error as Error);
    }
  }

  private _isQuotaExceededError(error: Error): boolean {
    return (
      error.name === 'QuotaExceededError' ||
      (error as any).code === 22 ||
      error.message.toLowerCase().includes('quota')
    );
  }

  private _isCorruptionError(error: Error): boolean {
    return (
      error.message.toLowerCase().includes('corrupt') ||
      error.message.toLowerCase().includes('damaged') ||
      (error as any).code === 11 // InvalidStateError
    );
  }

  private _isTransientError(error: Error): boolean {
    return (
      error.name === 'TransactionInactiveError' ||
      error.name === 'InvalidStateError' ||
      error.message.toLowerCase().includes('transaction') ||
      error.message.toLowerCase().includes('connection')
    );
  }

  private async _attemptDatabaseRecovery(): Promise<void> {
    console.log('Attempting database recovery...');
    try {
      await this.close();
      await deleteDB(DB_CONFIG.name);
      
      // Try to reinitialize
      await this._initialize();
      console.log('Database recovery successful');
    } catch (error) {
      console.error('Database recovery failed:', error);
      throw new DatabaseCorruptedError(error as Error);
    }
  }

  private async _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async _calculateSHA256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const databaseManager = new GalaxyDatabaseManager();