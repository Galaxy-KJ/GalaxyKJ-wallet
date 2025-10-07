export interface CacheConfig {
  ttl: number;
  maxSize: number;
  enablePersistence: boolean;
  storageKey: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 300000,
  maxSize: 100,
  enablePersistence: false,
  storageKey: 'galaxy-cache',
};

export class CacheManager<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeCache();
    this.startCleanupInterval();
  }

  private initializeCache(): void {
    if (this.config.enablePersistence && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          data.forEach(([key, entry]: [string, CacheEntry<T>]) => {
            if (this.isValidEntry(entry)) {
              this.cache.set(key, entry);
            }
          });
        }
      } catch (error) {
        console.warn('Failed to load cache from storage:', error);
      }
    }
  }

  private isValidEntry(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    this.persistCache();
  }

  private persistCache(): void {
    if (this.config.enablePersistence && typeof window !== 'undefined') {
      try {
        const data = Array.from(this.cache.entries());
        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to persist cache:', error);
      }
    }
  }

  set(key: string, data: T, customTtl?: number): void {
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.config.ttl,
      hits: 0,
    };

    this.cache.set(key, entry);
    this.persistCache();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (!this.isValidEntry(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.persistCache();
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    if (this.config.enablePersistence && typeof window !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? this.isValidEntry(entry) : false;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.persistCache();
    return count;
  }

  refresh(key: string, fetcher: () => Promise<T>): Promise<T> {
    return fetcher().then(data => {
      this.set(key, data);
      return data;
    });
  }

  getOrSet(key: string, fetcher: () => Promise<T>, customTtl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return fetcher().then(data => {
      this.set(key, data, customTtl);
      return data;
    });
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const globalCache = new CacheManager({
  ttl: 300000,
  maxSize: 200,
  enablePersistence: true,
  storageKey: 'galaxy-global-cache',
});

export const apiCache = new CacheManager({
  ttl: 60000,
  maxSize: 50,
  enablePersistence: false,
  storageKey: 'galaxy-api-cache',
});

export const balanceCache = new CacheManager({
  ttl: 30000,
  maxSize: 20,
  enablePersistence: true,
  storageKey: 'galaxy-balance-cache',
});