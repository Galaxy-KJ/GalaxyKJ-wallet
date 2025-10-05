import { useCallback, useEffect, useRef } from 'react';
import { CacheManager } from '@/utils/cache-manager';

export interface UseCacheManagerOptions {
  ttl?: number;
  maxSize?: number;
  enablePersistence?: boolean;
  storageKey?: string;
}

export function useCacheManager<T>(options: UseCacheManagerOptions = {}) {
  const cacheRef = useRef<CacheManager<T> | undefined>(undefined);

  if (!cacheRef.current) {
    cacheRef.current = new CacheManager<T>(options);
  }

  const cache = cacheRef.current;

  const set = useCallback((key: string, data: T, customTtl?: number) => {
    cache.set(key, data, customTtl);
  }, [cache]);

  const get = useCallback((key: string): T | null => {
    return cache.get(key);
  }, [cache]);

  const remove = useCallback((key: string): boolean => {
    return cache.delete(key);
  }, [cache]);

  const clear = useCallback(() => {
    cache.clear();
  }, [cache]);

  const has = useCallback((key: string): boolean => {
    return cache.has(key);
  }, [cache]);

  const getStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  const invalidatePattern = useCallback((pattern: RegExp): number => {
    return cache.invalidatePattern(pattern);
  }, [cache]);

  const refresh = useCallback((key: string, fetcher: () => Promise<T>): Promise<T> => {
    return cache.refresh(key, fetcher);
  }, [cache]);

  const getOrSet = useCallback((key: string, fetcher: () => Promise<T>, customTtl?: number): Promise<T> => {
    return cache.getOrSet(key, fetcher, customTtl);
  }, [cache]);

  useEffect(() => {
    return () => {
      cache.destroy();
    };
  }, [cache]);

  return {
    set,
    get,
    remove,
    clear,
    has,
    getStats,
    invalidatePattern,
    refresh,
    getOrSet,
  };
}