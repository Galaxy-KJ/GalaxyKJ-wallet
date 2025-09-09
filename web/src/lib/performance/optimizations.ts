/**
 * Performance Optimization Utilities for Galaxy Smart Wallet
 * 
 * This module provides comprehensive performance optimization tools including:
 * - Code splitting utilities
 * - Bundle size optimization
 * - Resource loading strategies
 * - Performance monitoring
 * - Cache management
 * - Image optimization helpers
 */

import { ComponentType, lazy, LazyExoticComponent } from 'react';

// Performance monitoring types
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

export interface LoadingStrategy {
  type: 'eager' | 'lazy' | 'preload' | 'prefetch';
  priority: 'high' | 'medium' | 'low';
  condition?: () => boolean;
}

export interface OptimizationConfig {
  enableCodeSplitting: boolean;
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCaching: boolean;
  enablePerformanceMonitoring: boolean;
  maxBundleSize: number; // in KB
  maxImageSize: number; // in KB
  cacheMaxAge: number; // in seconds
}

// Default optimization configuration
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableCodeSplitting: true,
  enableLazyLoading: true,
  enableImageOptimization: true,
  enableCaching: true,
  enablePerformanceMonitoring: true,
  maxBundleSize: 250, // 250KB
  maxImageSize: 500, // 500KB
  cacheMaxAge: 3600, // 1 hour
};

/**
 * Enhanced lazy loading with error boundary and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: ComponentType;
    errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
    retryCount?: number;
    preload?: boolean;
    chunkName?: string;
  } = {}
): LazyExoticComponent<T> {
  const {
    retryCount = 3,
    preload = false,
    chunkName,
  } = options;

  let retries = 0;
  let preloadPromise: Promise<{ default: T }> | null = null;

  const enhancedImportFn = async (): Promise<{ default: T }> => {
    try {
      // Use preloaded module if available
      if (preloadPromise) {
        return await preloadPromise;
      }

      const startTime = performance.now();
      const module = await importFn();
      const loadTime = performance.now() - startTime;

      // Track chunk loading performance
      if (chunkName) {
        trackChunkPerformance(chunkName, loadTime);
      }

      return module;
    } catch (error) {
      console.error(`Failed to load component ${chunkName || 'unknown'}:`, error);
      
      if (retries < retryCount) {
        retries++;
        console.log(`Retrying component load (${retries}/${retryCount})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        return enhancedImportFn();
      }
      
      throw error;
    }
  };

  // Preload the component if requested
  if (preload) {
    preloadPromise = importFn().catch(error => {
      console.warn(`Preload failed for ${chunkName}:`, error);
      preloadPromise = null;
      throw error;
    });
  }

  return lazy(enhancedImportFn);
}

/**
 * Preload components that are likely to be needed
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  condition?: () => boolean
): Promise<{ default: T }> | null {
  if (condition && !condition()) {
    return null;
  }

  // Only preload if the user has a good connection
  if (navigator.connection?.effectiveType && 
      !['4g', 'unknown'].includes(navigator.connection.effectiveType)) {
    return null;
  }

  return importFn().catch(error => {
    console.warn('Component preload failed:', error);
    throw error;
  });
}

/**
 * Bundle size monitoring and optimization
 */
export class BundleOptimizer {
  private static instance: BundleOptimizer;
  private bundleSizes: Map<string, number> = new Map();
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
    this.config = config;
  }

  static getInstance(config?: OptimizationConfig): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer(config);
    }
    return BundleOptimizer.instance;
  }

  /**
   * Track bundle size for a given chunk
   */
  trackBundleSize(chunkName: string, size: number): void {
    this.bundleSizes.set(chunkName, size);
    
    if (size > this.config.maxBundleSize * 1024) {
      console.warn(
        `Bundle '${chunkName}' exceeds size limit: ${size}B > ${this.config.maxBundleSize}KB`
      );
    }

    this.analyzeBundle(chunkName, size);
  }

  /**
   * Get bundle analysis report
   */
  getBundleReport(): {
    totalSize: number;
    chunkSizes: Record<string, number>;
    oversizedChunks: string[];
    recommendations: string[];
  } {
    const chunkSizes = Object.fromEntries(this.bundleSizes.entries());
    const totalSize = Array.from(this.bundleSizes.values()).reduce((sum, size) => sum + size, 0);
    const maxSizeBytes = this.config.maxBundleSize * 1024;
    const oversizedChunks = Array.from(this.bundleSizes.entries())
      .filter(([, size]) => size > maxSizeBytes)
      .map(([name]) => name);

    const recommendations = this.generateRecommendations(oversizedChunks, totalSize);

    return {
      totalSize,
      chunkSizes,
      oversizedChunks,
      recommendations,
    };
  }

  private analyzeBundle(chunkName: string, size: number): void {
    // Analyze bundle composition and suggest optimizations
    if (size > this.config.maxBundleSize * 1024) {
      this.logOptimizationSuggestions(chunkName, size);
    }
  }

  private generateRecommendations(oversizedChunks: string[], totalSize: number): string[] {
    const recommendations: string[] = [];

    if (totalSize > 1024 * 1024) { // > 1MB
      recommendations.push('Consider implementing route-based code splitting');
    }

    if (oversizedChunks.length > 0) {
      recommendations.push(`Optimize large chunks: ${oversizedChunks.join(', ')}`);
    }

    if (this.bundleSizes.size > 20) {
      recommendations.push('Consider chunk consolidation for smaller chunks');
    }

    return recommendations;
  }

  private logOptimizationSuggestions(chunkName: string, size: number): void {
    console.group(`Bundle Optimization Suggestions for '${chunkName}'`);
    console.log(`Current size: ${(size / 1024).toFixed(2)}KB`);
    console.log('Suggestions:');
    console.log('- Split large components into smaller chunks');
    console.log('- Use tree shaking to eliminate unused code');
    console.log('- Consider lazy loading for non-critical components');
    console.log('- Optimize dependencies (check for unused imports)');
    console.groupEnd();
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  private static supportedFormats: string[] = [];

  static async initialize(): Promise<void> {
    this.supportedFormats = await this.detectSupportedFormats();
  }

  static async detectSupportedFormats(): Promise<string[]> {
    const formats = ['webp', 'avif', 'jpeg', 'png'];
    const supported: string[] = [];

    for (const format of formats) {
      if (await this.canDisplayFormat(format)) {
        supported.push(format);
      }
    }

    return supported;
  }

  static async canDisplayFormat(format: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      
      const testImages: Record<string, string> = {
        webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=',
        jpeg: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
        png: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
      };

      img.src = testImages[format] || '';
    });
  }

  static getOptimizedImageProps(
    src: string,
    alt: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      priority?: boolean;
      loading?: 'lazy' | 'eager';
    } = {}
  ): {
    src: string;
    alt: string;
    loading: 'lazy' | 'eager';
    decoding: 'async' | 'sync';
    width?: number;
    height?: number;
    sizes?: string;
  } {
    const {
      width,
      height,
      priority = false,
      loading = priority ? 'eager' : 'lazy',
    } = options;

    return {
      src,
      alt,
      loading,
      decoding: priority ? 'sync' : 'async',
      width,
      height,
      ...(width && { sizes: `${width}px` }),
    };
  }

  static generateResponsiveSizes(breakpoints: number[]): string {
    return breakpoints
      .map((bp, index) => {
        if (index === breakpoints.length - 1) {
          return `${bp}px`;
        }
        return `(max-width: ${bp}px) ${bp}px`;
      })
      .join(', ');
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.monitorWebVitals();
    this.monitorResourceLoading();
    this.monitorUserTiming();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.metrics.get(componentName);
    const updated: PerformanceMetrics = {
      ...existing,
      renderTime,
      loadTime: existing?.loadTime || 0,
      bundleSize: existing?.bundleSize || 0,
      memoryUsage: this.getMemoryUsage(),
      networkRequests: existing?.networkRequests || 0,
      cacheHitRate: existing?.cacheHitRate || 0,
      firstContentfulPaint: existing?.firstContentfulPaint || 0,
      largestContentfulPaint: existing?.largestContentfulPaint || 0,
      cumulativeLayoutShift: existing?.cumulativeLayoutShift || 0,
      firstInputDelay: existing?.firstInputDelay || 0,
      timeToInteractive: existing?.timeToInteractive || 0,
    };

    this.metrics.set(componentName, updated);
  }

  private monitorWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.updateMetric('lcp', 'largestContentfulPaint', entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Monitor First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.updateMetric('fid', 'firstInputDelay', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Monitor Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.updateMetric('cls', 'cumulativeLayoutShift', (entry as any).value);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }

    // Monitor First Contentful Paint
    if ('getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.updateMetric('fcp', 'firstContentfulPaint', fcpEntry.startTime);
      }
    }
  }

  private monitorResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.trackResourceLoad(resourceEntry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  private monitorUserTiming(): void {
    if ('PerformanceObserver' in window) {
      const userTimingObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.log(`User Timing: ${entry.name} - ${entry.duration}ms`);
        }
      });
      userTimingObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(userTimingObserver);
    }
  }

  private trackResourceLoad(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);
    const loadTime = entry.responseEnd - entry.requestStart;
    
    this.updateMetric(resourceType, 'loadTime', loadTime);
    
    // Track cache hit rate
    const fromCache = entry.transferSize === 0 && entry.decodedBodySize > 0;
    if (fromCache) {
      this.incrementCacheHit(resourceType);
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private updateMetric(key: string, metricType: keyof PerformanceMetrics, value: number): void {
    const existing = this.metrics.get(key) || this.createEmptyMetrics();
    existing[metricType] = value as never;
    this.metrics.set(key, existing);
  }

  private incrementCacheHit(resourceType: string): void {
    const existing = this.metrics.get(resourceType) || this.createEmptyMetrics();
    existing.cacheHitRate = (existing.cacheHitRate + 1) / (existing.networkRequests + 1);
    existing.networkRequests += 1;
    this.metrics.set(resourceType, existing);
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      loadTime: 0,
      renderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      networkRequests: 0,
      cacheHitRate: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      timeToInteractive: 0,
    };
  }
}

/**
 * Cache management utilities
 */
export class CacheManager {
  private static instance: CacheManager;
  private config: OptimizationConfig;
  private cache: Map<string, { data: any; timestamp: number; expiry: number }> = new Map();

  constructor(config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG) {
    this.config = config;
  }

  static getInstance(config?: OptimizationConfig): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiry = now + (ttl || this.config.cacheMaxAge) * 1000;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry,
    });

    this.cleanupExpired();
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const size = this.cache.size;
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;
    
    return {
      size,
      hitRate: 0, // Would need to track hits/misses to calculate
      memoryUsage,
    };
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Utility functions
export function trackChunkPerformance(chunkName: string, loadTime: number): void {
  const bundleOptimizer = BundleOptimizer.getInstance();
  bundleOptimizer.trackBundleSize(chunkName, 0); // Size will be tracked elsewhere
  
  console.log(`Chunk '${chunkName}' loaded in ${loadTime.toFixed(2)}ms`);
}

export function measureRenderTime(componentName: string, renderFn: () => void): void {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  
  PerformanceMonitor.getInstance().trackComponentRender(componentName, end - start);
}

export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    console.log(`${name} executed in ${(end - start).toFixed(2)}ms`);
    return result;
  }) as T;
}

// Initialize optimizations
export async function initializeOptimizations(config?: Partial<OptimizationConfig>): Promise<void> {
  const finalConfig = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
  
  // Initialize image optimizer
  await ImageOptimizer.initialize();
  
  // Initialize performance monitoring
  if (finalConfig.enablePerformanceMonitoring) {
    PerformanceMonitor.getInstance().startMonitoring();
  }
  
  // Initialize cache manager
  CacheManager.getInstance(finalConfig);
  
  // Initialize bundle optimizer
  BundleOptimizer.getInstance(finalConfig);
  
  console.log('Performance optimizations initialized', finalConfig);
}

export default {
  createLazyComponent,
  preloadComponent,
  BundleOptimizer,
  ImageOptimizer,
  PerformanceMonitor,
  CacheManager,
  initializeOptimizations,
  measureRenderTime,
  withPerformanceTracking,
};