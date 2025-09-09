/**
 * Advanced Memoization Hooks for Galaxy Smart Wallet
 * 
 * This module provides comprehensive memoization utilities for optimizing
 * expensive computations, API calls, and component rendering in React.
 */

import { 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect, 
  useState,
  DependencyList,
  MutableRefObject
} from 'react';

// Types for memoization utilities
export interface MemoizationOptions {
  maxAge?: number; // Cache TTL in milliseconds
  maxSize?: number; // Maximum cache size
  serialize?: (args: any[]) => string; // Custom serialization
  onCacheHit?: (key: string) => void;
  onCacheMiss?: (key: string) => void;
  onEviction?: (key: string, value: any) => void;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface MemoCache<T> {
  [key: string]: CacheEntry<T>;
}

export interface AsyncMemoResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  clearCache: () => void;
}

export interface ComputeMetrics {
  computeTime: number;
  cacheHits: number;
  cacheMisses: number;
  totalCalls: number;
  averageComputeTime: number;
  cacheHitRatio: number;
}

/**
 * Enhanced useMemo with cache size limits and TTL
 */
export function useAdvancedMemo<T>(
  factory: () => T,
  deps: DependencyList,
  options: MemoizationOptions = {}
): T {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes default
    maxSize = 50,
    serialize = JSON.stringify,
    onCacheHit,
    onCacheMiss,
  } = options;

  const cacheRef = useRef<MemoCache<T>>({});
  const metricsRef = useRef<ComputeMetrics>({
    computeTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalCalls: 0,
    averageComputeTime: 0,
    cacheHitRatio: 0,
  });

  const key = serialize(deps);
  const now = Date.now();

  return useMemo(() => {
    const cache = cacheRef.current;
    const metrics = metricsRef.current;
    metrics.totalCalls++;

    // Check if cached value exists and is still valid
    if (cache[key]) {
      const entry = cache[key];
      const isExpired = now - entry.timestamp > maxAge;
      
      if (!isExpired) {
        entry.accessCount++;
        entry.lastAccessed = now;
        metrics.cacheHits++;
        metrics.cacheHitRatio = metrics.cacheHits / metrics.totalCalls;
        onCacheHit?.(key);
        return entry.value;
      } else {
        delete cache[key];
      }
    }

    // Cache miss - compute new value
    metrics.cacheMisses++;
    onCacheMiss?.(key);

    const startTime = performance.now();
    const value = factory();
    const computeTime = performance.now() - startTime;

    // Update metrics
    metrics.computeTime += computeTime;
    metrics.averageComputeTime = metrics.computeTime / metrics.cacheMisses;
    metrics.cacheHitRatio = metrics.cacheHits / metrics.totalCalls;

    // Store in cache
    cache[key] = {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    };

    // Evict old entries if cache is full
    if (Object.keys(cache).length > maxSize) {
      evictLeastRecentlyUsed(cache, maxSize * 0.8, options.onEviction); // Keep 80% of max size
    }

    return value;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Memoized callback with advanced options
 */
export function useAdvancedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  options: MemoizationOptions = {}
): T {
  const {
    maxAge = 60 * 1000, // 1 minute default for callbacks
    maxSize = 20,
    serialize = JSON.stringify,
  } = options;

  const cacheRef = useRef<MemoCache<ReturnType<T>>>({});

  const memoizedCallback = useCallback((...args: Parameters<T>) => {
    const key = serialize(args);
    const cache = cacheRef.current;
    const now = Date.now();

    // Check cache
    if (cache[key]) {
      const entry = cache[key];
      const isExpired = now - entry.timestamp > maxAge;
      
      if (!isExpired) {
        entry.accessCount++;
        entry.lastAccessed = now;
        return entry.value;
      } else {
        delete cache[key];
      }
    }

    // Compute and cache
    const result = callback(...args);
    cache[key] = {
      value: result,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    };

    // Evict if needed
    if (Object.keys(cache).length > maxSize) {
      evictLeastRecentlyUsed(cache, Math.floor(maxSize * 0.8));
    }

    return result;
  }, deps) as T; // eslint-disable-line react-hooks/exhaustive-deps

  return memoizedCallback;
}

/**
 * Memoized async operations with loading states
 */
export function useAsyncMemo<T>(
  asyncFactory: () => Promise<T>,
  deps: DependencyList,
  options: MemoizationOptions = {}
): AsyncMemoResult<T> {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes
    serialize = JSON.stringify,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const cacheRef = useRef<MemoCache<T>>({});
  const key = serialize(deps);

  const fetchData = useCallback(async (force = false) => {
    const cache = cacheRef.current;
    const now = Date.now();

    // Check cache if not forcing refresh
    if (!force && cache[key]) {
      const entry = cache[key];
      const isExpired = now - entry.timestamp > maxAge;
      
      if (!isExpired) {
        entry.accessCount++;
        entry.lastAccessed = now;
        setData(entry.value);
        setError(null);
        return;
      } else {
        delete cache[key];
      }
    }

    // Fetch new data
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFactory();
      
      // Cache the result
      cache[key] = {
        value: result,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now,
      };

      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [key, maxAge]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearCache = useCallback(() => {
    delete cacheRef.current[key];
    setData(null);
    setError(null);
  }, [key]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refresh, clearCache };
}

/**
 * Expensive computation memoization with performance metrics
 */
export function useExpensiveComputation<T, Args extends any[]>(
  computeFn: (...args: Args) => T,
  args: Args,
  options: MemoizationOptions & { 
    threshold?: number; // Minimum computation time to trigger memoization (ms)
    debug?: boolean;
  } = {}
): T & { metrics: ComputeMetrics } {
  const {
    threshold = 10, // Only memoize if computation takes > 10ms
    debug = false,
    maxAge = 10 * 60 * 1000, // 10 minutes
    serialize = JSON.stringify,
  } = options;

  const cacheRef = useRef<MemoCache<T>>({});
  const metricsRef = useRef<ComputeMetrics>({
    computeTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalCalls: 0,
    averageComputeTime: 0,
    cacheHitRatio: 0,
  });

  const result = useMemo(() => {
    const key = serialize(args);
    const cache = cacheRef.current;
    const metrics = metricsRef.current;
    const now = Date.now();

    metrics.totalCalls++;

    // Check cache
    if (cache[key]) {
      const entry = cache[key];
      const isExpired = now - entry.timestamp > maxAge;
      
      if (!isExpired) {
        entry.accessCount++;
        entry.lastAccessed = now;
        metrics.cacheHits++;
        metrics.cacheHitRatio = metrics.cacheHits / metrics.totalCalls;
        
        if (debug) {
          console.log(`Cache HIT for expensive computation: ${key}`);
        }
        
        return entry.value;
      } else {
        delete cache[key];
      }
    }

    // Cache miss - compute
    metrics.cacheMisses++;
    const startTime = performance.now();
    const value = computeFn(...args);
    const computeTime = performance.now() - startTime;

    metrics.computeTime += computeTime;
    metrics.averageComputeTime = metrics.computeTime / metrics.cacheMisses;
    metrics.cacheHitRatio = metrics.cacheHits / metrics.totalCalls;

    if (debug) {
      console.log(`Expensive computation took ${computeTime.toFixed(2)}ms for key: ${key}`);
    }

    // Only cache if computation was expensive enough
    if (computeTime >= threshold) {
      cache[key] = {
        value,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now,
      };

      if (debug) {
        console.log(`Cached expensive computation result for key: ${key}`);
      }
    }

    return value;
  }, args); // eslint-disable-line react-hooks/exhaustive-deps

  // Return result with metrics
  return Object.assign(result, { metrics: metricsRef.current });
}

/**
 * Memoization for Stellar SDK operations
 */
export function useStellarMemo<T>(
  operation: () => T,
  dependencies: DependencyList,
  options: { 
    cacheKey?: string;
    maxAge?: number;
    onError?: (error: Error) => void;
  } = {}
): { 
  data: T | null; 
  loading: boolean; 
  error: Error | null;
  clearCache: () => void;
} {
  const {
    cacheKey = 'stellar_operation',
    maxAge = 2 * 60 * 1000, // 2 minutes for Stellar operations
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const cacheRef = useRef<MemoCache<T>>({});

  const executeOperation = useCallback(async () => {
    const key = `${cacheKey}_${JSON.stringify(dependencies)}`;
    const cache = cacheRef.current;
    const now = Date.now();

    // Check cache
    if (cache[key]) {
      const entry = cache[key];
      const isExpired = now - entry.timestamp > maxAge;
      
      if (!isExpired) {
        entry.accessCount++;
        entry.lastAccessed = now;
        setData(entry.value);
        setError(null);
        return;
      } else {
        delete cache[key];
      }
    }

    // Execute operation
    setLoading(true);
    setError(null);

    try {
      const result = operation();
      
      // Cache result
      cache[key] = {
        value: result,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now,
      };

      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Stellar operation failed');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, maxAge, onError, operation]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearCache = useCallback(() => {
    const key = `${cacheKey}_${JSON.stringify(dependencies)}`;
    delete cacheRef.current[key];
    setData(null);
    setError(null);
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    executeOperation();
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, clearCache };
}

/**
 * Debounced memoization for search and input operations
 */
export function useDebouncedMemo<T>(
  factory: () => T,
  deps: DependencyList,
  delay: number = 300,
  options: MemoizationOptions = {}
): T | null {
  const [debouncedValue, setDebouncedValue] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const memoizedFactory = useAdvancedMemo(factory, deps, options);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(memoizedFactory);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [memoizedFactory, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

/**
 * Global cache hook for sharing memoized values across components
 */
export function useGlobalCache<T>(
  key: string,
  factory: () => T,
  options: MemoizationOptions = {}
): T {
  const globalCacheRef = useRef<MemoCache<T>>(
    typeof window !== 'undefined' 
      ? ((window as any).__GALAXY_GLOBAL_CACHE__ ||= {})
      : {}
  );

  const {
    maxAge = 10 * 60 * 1000, // 10 minutes
    onCacheHit,
    onCacheMiss,
  } = options;

  return useMemo(() => {
    const cache = globalCacheRef.current;
    const now = Date.now();

    // Check cache
    if (cache[key]) {
      const entry = cache[key];
      const isExpired = now - entry.timestamp > maxAge;
      
      if (!isExpired) {
        entry.accessCount++;
        entry.lastAccessed = now;
        onCacheHit?.(key);
        return entry.value;
      } else {
        delete cache[key];
      }
    }

    // Cache miss
    onCacheMiss?.(key);
    const value = factory();
    
    cache[key] = {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    };

    return value;
  }, [key, factory, maxAge, onCacheHit, onCacheMiss]);
}

// Utility functions
function evictLeastRecentlyUsed<T>(
  cache: MemoCache<T>, 
  targetSize: number, 
  onEviction?: (key: string, value: T) => void
): void {
  const entries = Object.entries(cache);
  
  if (entries.length <= targetSize) {
    return;
  }

  // Sort by last accessed time (least recent first)
  entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

  // Remove oldest entries
  const toRemove = entries.slice(0, entries.length - targetSize);
  
  for (const [key, entry] of toRemove) {
    delete cache[key];
    onEviction?.(key, entry.value);
  }
}

export default {
  useAdvancedMemo,
  useAdvancedCallback,
  useAsyncMemo,
  useExpensiveComputation,
  useStellarMemo,
  useDebouncedMemo,
  useGlobalCache,
};