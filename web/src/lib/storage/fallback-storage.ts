/**
 * Fallback Storage System
 * 
 * Graceful degradation for when IndexedDB is unavailable
 * Provides temporary storage and data persistence alternatives
 */

export interface FallbackStorageOptions {
  enableSessionStorage: boolean;
  enableLocalStorage: boolean;
  enableMemoryStorage: boolean;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  maxMemoryItems: number;
  maxStorageSize: number; // bytes
}

export interface StorageAdapterInterface {
  isAvailable(): boolean;
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
  getName(): string;
}

/**
 * Memory-based storage adapter
 */
class MemoryStorageAdapter implements StorageAdapterInterface {
  private storage = new Map<string, any>();
  private maxItems: number;

  constructor(maxItems: number = 100) {
    this.maxItems = maxItems;
  }

  isAvailable(): boolean {
    return true;
  }

  async set(key: string, value: any): Promise<void> {
    // Implement LRU eviction
    if (this.storage.size >= this.maxItems && !this.storage.has(key)) {
      const firstKey = this.storage.keys().next().value;
      this.storage.delete(firstKey);
    }
    
    this.storage.set(key, value);
  }

  async get(key: string): Promise<any> {
    return this.storage.get(key);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async size(): Promise<number> {
    return this.storage.size;
  }

  getName(): string {
    return 'Memory';
  }
}

/**
 * SessionStorage adapter
 */
class SessionStorageAdapter implements StorageAdapterInterface {
  private prefix = 'galaxy_wallet_';

  isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return false;
      
      const testKey = '__test_session_storage__';
      window.sessionStorage.setItem(testKey, 'test');
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.isAvailable()) throw new Error('SessionStorage not available');
    
    try {
      const serialized = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: 1,
      });
      window.sessionStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      if ((error as any).name === 'QuotaExceededError') {
        throw new Error('SessionStorage quota exceeded');
      }
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isAvailable()) throw new Error('SessionStorage not available');
    
    const item = window.sessionStorage.getItem(this.prefix + key);
    if (!item) return null;
    
    try {
      const parsed = JSON.parse(item);
      return parsed.data;
    } catch {
      // Clean up corrupted data
      window.sessionStorage.removeItem(this.prefix + key);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('SessionStorage not available');
    window.sessionStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) throw new Error('SessionStorage not available');
    
    const keys = await this.keys();
    for (const key of keys) {
      window.sessionStorage.removeItem(this.prefix + key);
    }
  }

  async keys(): Promise<string[]> {
    if (!this.isAvailable()) throw new Error('SessionStorage not available');
    
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }

  getName(): string {
    return 'SessionStorage';
  }
}

/**
 * LocalStorage adapter (with caution for sensitive data)
 */
class LocalStorageAdapter implements StorageAdapterInterface {
  private prefix = 'galaxy_wallet_';

  isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      
      const testKey = '__test_local_storage__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.isAvailable()) throw new Error('LocalStorage not available');
    
    try {
      const serialized = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: 1,
      });
      window.localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      if ((error as any).name === 'QuotaExceededError') {
        throw new Error('LocalStorage quota exceeded');
      }
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.isAvailable()) throw new Error('LocalStorage not available');
    
    const item = window.localStorage.getItem(this.prefix + key);
    if (!item) return null;
    
    try {
      const parsed = JSON.parse(item);
      return parsed.data;
    } catch {
      // Clean up corrupted data
      window.localStorage.removeItem(this.prefix + key);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.isAvailable()) throw new Error('LocalStorage not available');
    window.localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) throw new Error('LocalStorage not available');
    
    const keys = await this.keys();
    for (const key of keys) {
      window.localStorage.removeItem(this.prefix + key);
    }
  }

  async keys(): Promise<string[]> {
    if (!this.isAvailable()) throw new Error('LocalStorage not available');
    
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }

  getName(): string {
    return 'LocalStorage';
  }
}

/**
 * Fallback storage manager with cascading storage options
 */
export class FallbackStorageManager {
  private adapters: StorageAdapterInterface[] = [];
  private primaryAdapter: StorageAdapterInterface | null = null;
  private options: FallbackStorageOptions;
  private warnings: string[] = [];

  constructor(options: Partial<FallbackStorageOptions> = {}) {
    this.options = {
      enableSessionStorage: true,
      enableLocalStorage: false, // Disabled by default for security
      enableMemoryStorage: true,
      compressionEnabled: false,
      encryptionEnabled: false,
      maxMemoryItems: 50,
      maxStorageSize: 5 * 1024 * 1024, // 5MB
      ...options,
    };

    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    // Initialize adapters in order of preference
    
    if (this.options.enableSessionStorage) {
      const sessionAdapter = new SessionStorageAdapter();
      if (sessionAdapter.isAvailable()) {
        this.adapters.push(sessionAdapter);
      } else {
        this.warnings.push('SessionStorage is not available');
      }
    }

    if (this.options.enableLocalStorage) {
      const localAdapter = new LocalStorageAdapter();
      if (localAdapter.isAvailable()) {
        this.adapters.push(localAdapter);
        this.warnings.push('LocalStorage enabled - sensitive data may persist across sessions');
      } else {
        this.warnings.push('LocalStorage is not available');
      }
    }

    if (this.options.enableMemoryStorage) {
      this.adapters.push(new MemoryStorageAdapter(this.options.maxMemoryItems));
    }

    // Set primary adapter to the first available one
    this.primaryAdapter = this.adapters.length > 0 ? this.adapters[0] : null;

    if (!this.primaryAdapter) {
      console.error('No storage adapters available - data will not persist');
    } else {
      console.warn(`Using fallback storage: ${this.primaryAdapter.getName()}`);
      this.warnings.forEach(warning => console.warn(`Storage warning: ${warning}`));
    }
  }

  /**
   * Store data with fallback to alternative adapters
   */
  async set(key: string, value: any): Promise<void> {
    if (!this.primaryAdapter) {
      throw new Error('No storage adapters available');
    }

    let lastError: Error | null = null;

    for (const adapter of this.adapters) {
      try {
        await adapter.set(key, value);
        console.log(`Data stored using ${adapter.getName()}`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Storage failed with ${adapter.getName()}:`, error);
      }
    }

    throw lastError || new Error('All storage adapters failed');
  }

  /**
   * Retrieve data from available adapters
   */
  async get(key: string): Promise<any> {
    if (!this.primaryAdapter) {
      return null;
    }

    for (const adapter of this.adapters) {
      try {
        const value = await adapter.get(key);
        if (value !== null && value !== undefined) {
          return value;
        }
      } catch (error) {
        console.warn(`Retrieval failed with ${adapter.getName()}:`, error);
      }
    }

    return null;
  }

  /**
   * Remove data from all adapters
   */
  async remove(key: string): Promise<void> {
    const promises = this.adapters.map(async adapter => {
      try {
        await adapter.remove(key);
      } catch (error) {
        console.warn(`Removal failed with ${adapter.getName()}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear all data from all adapters
   */
  async clear(): Promise<void> {
    const promises = this.adapters.map(async adapter => {
      try {
        await adapter.clear();
      } catch (error) {
        console.warn(`Clear failed with ${adapter.getName()}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get all keys from primary adapter
   */
  async keys(): Promise<string[]> {
    if (!this.primaryAdapter) {
      return [];
    }

    try {
      return await this.primaryAdapter.keys();
    } catch (error) {
      console.warn('Failed to get keys from primary adapter:', error);
      return [];
    }
  }

  /**
   * Get storage status information
   */
  async getStatus(): Promise<{
    isAvailable: boolean;
    primaryAdapter: string;
    availableAdapters: string[];
    warnings: string[];
    itemCount: number;
    capabilities: {
      persistent: boolean;
      crossSession: boolean;
      quotaLimited: boolean;
    };
  }> {
    const availableAdapters = this.adapters.map(adapter => adapter.getName());
    const itemCount = await (this.primaryAdapter?.size() || 0);

    return {
      isAvailable: !!this.primaryAdapter,
      primaryAdapter: this.primaryAdapter?.getName() || 'None',
      availableAdapters,
      warnings: [...this.warnings],
      itemCount: await itemCount,
      capabilities: {
        persistent: availableAdapters.includes('LocalStorage'),
        crossSession: availableAdapters.includes('LocalStorage'),
        quotaLimited: availableAdapters.some(name => 
          name.includes('Storage') || name === 'IndexedDB'
        ),
      },
    };
  }

  /**
   * Export data for backup purposes
   */
  async exportData(): Promise<Record<string, any>> {
    const data: Record<string, any> = {};
    const keys = await this.keys();

    for (const key of keys) {
      try {
        const value = await this.get(key);
        if (value !== null) {
          data[key] = value;
        }
      } catch (error) {
        console.warn(`Failed to export key ${key}:`, error);
      }
    }

    return data;
  }

  /**
   * Import data from backup
   */
  async importData(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      try {
        await this.set(key, value);
      } catch (error) {
        console.warn(`Failed to import key ${key}:`, error);
      }
    }
  }

  /**
   * Show user-friendly warnings about storage limitations
   */
  getWarnings(): string[] {
    const warnings = [...this.warnings];

    if (this.primaryAdapter?.getName() === 'Memory') {
      warnings.push('Data is stored in memory only and will be lost when the page is refreshed');
    }

    if (this.primaryAdapter?.getName() === 'SessionStorage') {
      warnings.push('Data will be lost when the browser tab is closed');
    }

    if (this.adapters.length === 0) {
      warnings.push('No storage available - wallet functionality will be severely limited');
    }

    return warnings;
  }
}

/**
 * Storage capability detection utilities
 */
export const storageCapabilities = {
  /**
   * Check if IndexedDB is available
   */
  hasIndexedDB(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        'indexedDB' in window &&
        window.indexedDB !== null
      );
    } catch {
      return false;
    }
  },

  /**
   * Check if localStorage is available
   */
  hasLocalStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      
      const testKey = '__test_localStorage__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if sessionStorage is available
   */
  hasSessionStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return false;
      
      const testKey = '__test_sessionStorage__';
      window.sessionStorage.setItem(testKey, 'test');
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Estimate storage quota
   */
  async getStorageEstimate(): Promise<{
    quota: number;
    usage: number;
    available: number;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        
        return {
          quota,
          usage,
          available: quota - usage,
        };
      }
    } catch (error) {
      console.warn('Failed to get storage estimate:', error);
    }

    return { quota: 0, usage: 0, available: 0 };
  },

  /**
   * Get comprehensive storage environment info
   */
  async getEnvironmentInfo(): Promise<{
    indexedDB: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    storageEstimate: { quota: number; usage: number; available: number };
    isPrivateMode: boolean;
    userAgent: string;
  }> {
    const isPrivateMode = await this.detectPrivateMode();
    
    return {
      indexedDB: this.hasIndexedDB(),
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      storageEstimate: await this.getStorageEstimate(),
      isPrivateMode,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };
  },

  /**
   * Detect private/incognito mode
   */
  async detectPrivateMode(): Promise<boolean> {
    try {
      // Test IndexedDB in private mode
      if (this.hasIndexedDB()) {
        const db = window.indexedDB.open('__private_mode_test__');
        return new Promise((resolve) => {
          db.onsuccess = () => {
            resolve(false);
            db.result?.close();
          };
          db.onerror = () => resolve(true);
        });
      }

      // Fallback: Test localStorage quota
      if (this.hasLocalStorage()) {
        const testData = '0'.repeat(1024); // 1KB
        window.localStorage.setItem('__private_mode_test__', testData);
        window.localStorage.removeItem('__private_mode_test__');
        return false;
      }
    } catch {
      return true;
    }

    return false;
  },
};

// Export singleton instance
export const fallbackStorage = new FallbackStorageManager();