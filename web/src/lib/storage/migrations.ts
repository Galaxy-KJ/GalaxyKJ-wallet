/**
 * Database Migration System
 * 
 * Handles database schema migrations and version management
 * for Galaxy Smart Wallet IndexedDB implementation
 */

import { IDBPDatabase, IDBPTransaction } from 'idb';
import { GalaxyWalletDB } from './database';

export interface MigrationDefinition {
  version: number;
  description: string;
  up: (
    db: IDBPDatabase<GalaxyWalletDB>,
    transaction: IDBPTransaction<GalaxyWalletDB, any[], 'versionchange'>
  ) => Promise<void>;
  down?: (
    db: IDBPDatabase<GalaxyWalletDB>,
    transaction: IDBPTransaction<GalaxyWalletDB, any[], 'versionchange'>
  ) => Promise<void>;
}

export class DatabaseMigrationManager {
  private migrations: MigrationDefinition[] = [];

  constructor() {
    this.registerMigrations();
  }

  /**
   * Register all migration definitions
   */
  private registerMigrations(): void {
    // Migration from version 0 to 1: Initial schema
    this.migrations.push({
      version: 1,
      description: 'Initial database schema with wallets store',
      up: async (db, transaction) => {
        console.log('Running migration v1: Initial schema');

        // Create wallets store
        const walletsStore = db.createObjectStore('wallets', {
          keyPath: 'id',
        });

        // Create indexes for wallets
        walletsStore.createIndex('by-created', 'createdAt');
        walletsStore.createIndex('by-updated', 'updatedAt');

        console.log('Migration v1 completed: wallets store created');
      },
    });

    // Migration from version 1 to 2: Add settings, backups, and metadata stores
    this.migrations.push({
      version: 2,
      description: 'Add settings, backups, and metadata stores with enhanced wallet schema',
      up: async (db, transaction) => {
        console.log('Running migration v2: Enhanced schema');

        // Create settings store
        const settingsStore = db.createObjectStore('settings', {
          keyPath: 'id',
        });
        settingsStore.createIndex('by-key', 'key', { unique: true });
        settingsStore.createIndex('by-encrypted', 'encrypted');

        // Create backups store
        const backupsStore = db.createObjectStore('backups', {
          keyPath: 'id',
        });
        backupsStore.createIndex('by-wallet', 'walletId');
        backupsStore.createIndex('by-created', 'createdAt');
        backupsStore.createIndex('by-type', 'backupType');
        backupsStore.createIndex('by-expires', 'expiresAt');

        // Create metadata store
        const metadataStore = db.createObjectStore('metadata', {
          keyPath: 'id',
        });
        metadataStore.createIndex('by-key', 'key', { unique: true });
        metadataStore.createIndex('by-version', 'version');

        // Enhance wallets store with new indexes
        const walletsStore = transaction.objectStore('wallets');
        
        // Check if index already exists to avoid errors
        if (!Array.from(walletsStore.indexNames).includes('by-version')) {
          walletsStore.createIndex('by-version', 'version');
        }

        // Migrate existing wallet data to new schema
        await this.migrateWalletDataV1toV2(walletsStore);

        console.log('Migration v2 completed: Enhanced schema with settings, backups, and metadata');
      },
      down: async (db, transaction) => {
        // Rollback migration v2
        console.log('Rolling back migration v2');

        // Delete new stores
        if (db.objectStoreNames.contains('settings')) {
          db.deleteObjectStore('settings');
        }
        if (db.objectStoreNames.contains('backups')) {
          db.deleteObjectStore('backups');
        }
        if (db.objectStoreNames.contains('metadata')) {
          db.deleteObjectStore('metadata');
        }

        // Remove new indexes from wallets store
        const walletsStore = transaction.objectStore('wallets');
        if (Array.from(walletsStore.indexNames).includes('by-version')) {
          walletsStore.deleteIndex('by-version');
        }

        console.log('Migration v2 rollback completed');
      },
    });

    // Future migration example (v3)
    /*
    this.migrations.push({
      version: 3,
      description: 'Add encryption key rotation support',
      up: async (db, transaction) => {
        console.log('Running migration v3: Key rotation support');

        // Add key rotation fields to wallets
        const walletsStore = transaction.objectStore('wallets');
        
        // This would be done by iterating existing records and updating them
        // with new fields for key rotation tracking
        
        console.log('Migration v3 completed: Key rotation support added');
      },
    });
    */

    // Sort migrations by version
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Execute migrations from oldVersion to newVersion
   */
  async migrate(
    db: IDBPDatabase<GalaxyWalletDB>,
    oldVersion: number,
    newVersion: number | null,
    transaction: IDBPTransaction<GalaxyWalletDB, any[], 'versionchange'>
  ): Promise<void> {
    if (newVersion === null) {
      console.warn('Database is being deleted');
      return;
    }

    console.log(`Migrating database from version ${oldVersion} to ${newVersion}`);

    // Find migrations to run
    const migrationsToRun = this.migrations.filter(
      migration => migration.version > oldVersion && migration.version <= newVersion
    );

    if (migrationsToRun.length === 0) {
      console.log('No migrations to run');
      return;
    }

    // Execute migrations in order
    for (const migration of migrationsToRun) {
      try {
        console.log(`Executing migration v${migration.version}: ${migration.description}`);
        await migration.up(db, transaction);
        
        // Store migration metadata
        await this.recordMigration(db, migration, transaction);
        
        console.log(`Migration v${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Migration v${migration.version} failed:`, error);
        
        // Attempt rollback if down migration is available
        if (migration.down) {
          try {
            console.log(`Attempting rollback of migration v${migration.version}`);
            await migration.down(db, transaction);
            console.log(`Rollback of migration v${migration.version} successful`);
          } catch (rollbackError) {
            console.error(`Rollback of migration v${migration.version} failed:`, rollbackError);
          }
        }
        
        throw new Error(`Migration v${migration.version} failed: ${error}`);
      }
    }

    // Update schema version in metadata
    await this.updateSchemaVersion(db, newVersion, transaction);
    
    console.log(`Database migration completed successfully: v${oldVersion} → v${newVersion}`);
  }

  /**
   * Migrate wallet data from v1 to v2 schema
   */
  private async migrateWalletDataV1toV2(
    walletsStore: any // Using any to avoid complex type casting
  ): Promise<void> {
    console.log('Migrating wallet data from v1 to v2 schema');

    // Get all existing wallets
    const cursor = await walletsStore.openCursor();
    const walletsToUpdate: any[] = [];
    
    if (cursor) {
      let currentCursor = cursor;
      do {
        const wallet = currentCursor.value;
        
        // Add new fields if they don't exist
        const updatedWallet = {
          ...wallet,
          // Add missing v2 fields with defaults
          keyHash: wallet.keyHash || '',
          version: wallet.version || 1,
          backupCount: wallet.backupCount || 0,
          checksumSHA256: wallet.checksumSHA256 || await this.calculateLegacyChecksum(wallet.wallet || wallet.encryptedData || ''),
          // Rename 'wallet' field to 'encryptedData' if needed
          encryptedData: wallet.encryptedData || wallet.wallet || '',
        };

        // Remove old field names if they exist
        if ('wallet' in updatedWallet && 'encryptedData' in updatedWallet) {
          delete updatedWallet.wallet;
        }

        walletsToUpdate.push(updatedWallet);
      } while (currentCursor = await currentCursor.continue());
    }

    // Update all wallets with new schema
    for (const wallet of walletsToUpdate) {
      await walletsStore.put(wallet);
    }

    console.log(`Migrated ${walletsToUpdate.length} wallets to v2 schema`);
  }

  /**
   * Calculate checksum for legacy wallet data
   */
  private async calculateLegacyChecksum(data: string): Promise<string> {
    if (!data) return '';
    
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Failed to calculate legacy checksum:', error);
      return '';
    }
  }

  /**
   * Record migration execution in metadata
   */
  private async recordMigration(
    db: IDBPDatabase<GalaxyWalletDB>,
    migration: MigrationDefinition,
    transaction: IDBPTransaction<GalaxyWalletDB, any[], 'versionchange'>
  ): Promise<void> {
    try {
      // Only record if metadata store exists (v2+)
      if (db.objectStoreNames.contains('metadata')) {
        const metadataStore = transaction.objectStore('metadata');
        const migrationRecord = {
          id: `migration_v${migration.version}`,
          key: `migration_v${migration.version}`,
          value: {
            version: migration.version,
            description: migration.description,
            executedAt: new Date().toISOString(),
            success: true,
          },
          version: migration.version,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await metadataStore.put(migrationRecord);
      }
    } catch (error) {
      console.warn('Failed to record migration metadata:', error);
      // Don't fail the migration for metadata recording issues
    }
  }

  /**
   * Update schema version in metadata
   */
  private async updateSchemaVersion(
    db: IDBPDatabase<GalaxyWalletDB>,
    version: number,
    transaction: IDBPTransaction<GalaxyWalletDB, any[], 'versionchange'>
  ): Promise<void> {
    try {
      // Only update if metadata store exists (v2+)
      if (db.objectStoreNames.contains('metadata')) {
        const metadataStore = transaction.objectStore('metadata');
        const versionRecord = {
          id: 'schema_version',
          key: 'schema_version',
          value: {
            version,
            updatedAt: new Date().toISOString(),
          },
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await metadataStore.put(versionRecord);
      }
    } catch (error) {
      console.warn('Failed to update schema version metadata:', error);
      // Don't fail the migration for metadata recording issues
    }
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(db: IDBPDatabase<GalaxyWalletDB>): Promise<any[]> {
    try {
      if (!db.objectStoreNames.contains('metadata')) {
        return [];
      }

      const metadataStore = db.transaction('metadata', 'readonly').objectStore('metadata');
      const allRecords = await metadataStore.getAll();
      
      return allRecords
        .filter(record => record.key.startsWith('migration_v'))
        .map(record => record.value)
        .sort((a, b) => a.version - b.version);
    } catch (error) {
      console.error('Failed to get migration history:', error);
      return [];
    }
  }

  /**
   * Validate database schema version
   */
  async validateSchemaVersion(
    db: IDBPDatabase<GalaxyWalletDB>,
    expectedVersion: number
  ): Promise<boolean> {
    try {
      if (!db.objectStoreNames.contains('metadata')) {
        // For v1 databases without metadata store
        return expectedVersion === 1;
      }

      const metadataStore = db.transaction('metadata', 'readonly').objectStore('metadata');
      const versionRecord = await metadataStore.get('schema_version');
      
      if (!versionRecord) {
        console.warn('No schema version recorded in metadata');
        return false;
      }

      const actualVersion = versionRecord.value.version;
      if (actualVersion !== expectedVersion) {
        console.error(`Schema version mismatch: expected ${expectedVersion}, got ${actualVersion}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate schema version:', error);
      return false;
    }
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded(currentVersion: number, targetVersion: number): Promise<boolean> {
    const migrationsNeeded = this.migrations.filter(
      migration => migration.version > currentVersion && migration.version <= targetVersion
    );
    
    return migrationsNeeded.length > 0;
  }

  /**
   * Get available migrations
   */
  getAvailableMigrations(): MigrationDefinition[] {
    return [...this.migrations];
  }

  /**
   * Get next migration version
   */
  getNextMigrationVersion(currentVersion: number): number | null {
    const nextMigration = this.migrations.find(migration => migration.version > currentVersion);
    return nextMigration ? nextMigration.version : null;
  }

  /**
   * Prepare database rollback (if supported)
   */
  async prepareRollback(
    db: IDBPDatabase<GalaxyWalletDB>,
    fromVersion: number,
    toVersion: number
  ): Promise<void> {
    console.log(`Preparing rollback from v${fromVersion} to v${toVersion}`);
    
    const rollbackMigrations = this.migrations
      .filter(migration => migration.version > toVersion && migration.version <= fromVersion)
      .reverse(); // Execute rollbacks in reverse order

    for (const migration of rollbackMigrations) {
      if (!migration.down) {
        throw new Error(`Migration v${migration.version} does not support rollback`);
      }
    }

    console.log(`Rollback plan validated for ${rollbackMigrations.length} migrations`);
  }
}

// Export migration utilities
export const migrationUtils = {
  /**
   * Create a backup before migration
   */
  async createPreMigrationBackup(
    db: IDBPDatabase<GalaxyWalletDB>,
    version: number
  ): Promise<string> {
    const backup = {
      version,
      timestamp: new Date().toISOString(),
      stores: {} as any,
    };

    // Backup all stores
    for (const storeName of db.objectStoreNames) {
      const store = db.transaction(storeName as any, 'readonly').objectStore(storeName);
      backup.stores[storeName] = await store.getAll();
    }

    // In a real implementation, this would be saved to a more persistent location
    const backupId = `pre_migration_v${version}_${Date.now()}`;
    console.log(`Pre-migration backup created: ${backupId}`);
    
    return JSON.stringify(backup);
  },

  /**
   * Validate migration integrity
   */
  async validateMigrationIntegrity(
    db: IDBPDatabase<GalaxyWalletDB>,
    expectedStores: string[],
    expectedIndexes: Record<string, string[]>
  ): Promise<boolean> {
    try {
      // Check stores exist
      for (const storeName of expectedStores) {
        if (!db.objectStoreNames.contains(storeName)) {
          console.error(`Expected store '${storeName}' not found`);
          return false;
        }
      }

      // Check indexes exist
      for (const [storeName, indexes] of Object.entries(expectedIndexes)) {
        if (db.objectStoreNames.contains(storeName)) {
          const transaction = db.transaction(storeName as any, 'readonly');
          const store = transaction.objectStore(storeName);
          
          for (const indexName of indexes) {
            if (!Array.from(store.indexNames).includes(indexName)) {
              console.error(`Expected index '${indexName}' not found in store '${storeName}'`);
              return false;
            }
          }
        }
      }

      console.log('Migration integrity validation passed');
      return true;
    } catch (error) {
      console.error('Migration integrity validation failed:', error);
      return false;
    }
  },
};