/**
 * Performance Testing Utilities
 * 
 * Comprehensive testing framework for validating performance optimizations
 * in the Galaxy Smart Wallet application.
 */

import { PerformanceMonitor, BundleOptimizer } from './optimizations';
import { GalaxyBundleAnalyzer } from './bundle-analyzer';

export interface PerformanceTestConfig {
  loadingThresholds: {
    lcp: number; // Largest Contentful Paint (ms)
    fid: number; // First Input Delay (ms)
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte (ms)
    fcp: number; // First Contentful Paint (ms)
  };
  bundleThresholds: {
    maxTotalSize: number; // bytes
    maxChunkSize: number; // bytes
    maxStellarSize: number; // bytes
    minCompressionRatio: number; // 0-1
  };
  memoryThresholds: {
    maxHeapSize: number; // bytes
    maxRenderMemory: number; // bytes per render
    maxLeakRate: number; // bytes per second
  };
  renderingThresholds: {
    maxRenderTime: number; // ms
    maxReactUpdates: number; // per second
    minCacheHitRate: number; // 0-1
  };
}

export interface PerformanceTestResult {
  passed: boolean;
  score: number; // 0-100
  results: {
    loading: LoadingTestResult;
    bundle: BundleTestResult;
    memory: MemoryTestResult;
    rendering: RenderingTestResult;
  };
  recommendations: string[];
  timestamp: Date;
}

export interface LoadingTestResult {
  passed: boolean;
  metrics: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
    fcp: number;
  };
  issues: string[];
}

export interface BundleTestResult {
  passed: boolean;
  metrics: {
    totalSize: number;
    largestChunkSize: number;
    stellarSdkSize: number;
    compressionRatio: number;
    chunkCount: number;
  };
  issues: string[];
}

export interface MemoryTestResult {
  passed: boolean;
  metrics: {
    currentHeapSize: number;
    peakHeapSize: number;
    averageRenderMemory: number;
    memoryLeakRate: number;
  };
  issues: string[];
}

export interface RenderingTestResult {
  passed: boolean;
  metrics: {
    averageRenderTime: number;
    reactUpdateRate: number;
    cacheHitRate: number;
    memoizationEfficiency: number;
  };
  issues: string[];
}

export class PerformanceTestSuite {
  private monitor: PerformanceMonitor;
  private bundleAnalyzer: GalaxyBundleAnalyzer;
  private config: PerformanceTestConfig;

  constructor(config?: Partial<PerformanceTestConfig>) {
    this.monitor = PerformanceMonitor.getInstance();
    this.bundleAnalyzer = GalaxyBundleAnalyzer.getInstance();
    
    this.config = {
      loadingThresholds: {
        lcp: 2500, // Core Web Vitals good threshold
        fid: 100,
        cls: 0.1,
        ttfb: 600,
        fcp: 1800,
      },
      bundleThresholds: {
        maxTotalSize: 500 * 1024, // 500KB
        maxChunkSize: 250 * 1024, // 250KB
        maxStellarSize: 200 * 1024, // 200KB
        minCompressionRatio: 0.6,
      },
      memoryThresholds: {
        maxHeapSize: 100 * 1024 * 1024, // 100MB
        maxRenderMemory: 5 * 1024 * 1024, // 5MB per render
        maxLeakRate: 1024 * 10, // 10KB per second
      },
      renderingThresholds: {
        maxRenderTime: 16, // 60fps threshold
        maxReactUpdates: 10,
        minCacheHitRate: 0.8,
      },
      ...config,
    };
  }

  /**
   * Run comprehensive performance test suite
   */
  async runFullSuite(): Promise<PerformanceTestResult> {
    const startTime = performance.now();

    const [loading, bundle, memory, rendering] = await Promise.all([
      this.testLoadingPerformance(),
      this.testBundleSize(),
      this.testMemoryUsage(),
      this.testRenderingPerformance(),
    ]);

    const results = { loading, bundle, memory, rendering };
    const passed = Object.values(results).every(result => result.passed);
    const score = this.calculateOverallScore(results);
    const recommendations = this.generateRecommendations(results);

    console.log(`Performance test suite completed in ${performance.now() - startTime}ms`);

    return {
      passed,
      score,
      results,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Test loading performance using Web Vitals
   */
  async testLoadingPerformance(): Promise<LoadingTestResult> {
    const metrics = await this.measureWebVitals();
    const { loadingThresholds } = this.config;
    const issues: string[] = [];

    if (metrics.lcp > loadingThresholds.lcp) {
      issues.push(`LCP ${metrics.lcp}ms exceeds threshold ${loadingThresholds.lcp}ms`);
    }

    if (metrics.fid > loadingThresholds.fid) {
      issues.push(`FID ${metrics.fid}ms exceeds threshold ${loadingThresholds.fid}ms`);
    }

    if (metrics.cls > loadingThresholds.cls) {
      issues.push(`CLS ${metrics.cls} exceeds threshold ${loadingThresholds.cls}`);
    }

    if (metrics.ttfb > loadingThresholds.ttfb) {
      issues.push(`TTFB ${metrics.ttfb}ms exceeds threshold ${loadingThresholds.ttfb}ms`);
    }

    if (metrics.fcp > loadingThresholds.fcp) {
      issues.push(`FCP ${metrics.fcp}ms exceeds threshold ${loadingThresholds.fcp}ms`);
    }

    return {
      passed: issues.length === 0,
      metrics,
      issues,
    };
  }

  /**
   * Test bundle size optimization
   */
  async testBundleSize(): Promise<BundleTestResult> {
    const bundleReport = await this.bundleAnalyzer.analyzeBundles();
    const { bundleThresholds } = this.config;
    const issues: string[] = [];

    const totalSize = bundleReport.totalSize;
    const largestChunk = Math.max(...bundleReport.chunks.map(c => c.size));
    const stellarSize = bundleReport.stellar.sdkSize;
    const compressionRatio = bundleReport.compressionRatio || 0;

    if (totalSize > bundleThresholds.maxTotalSize) {
      issues.push(`Total bundle size ${this.formatBytes(totalSize)} exceeds ${this.formatBytes(bundleThresholds.maxTotalSize)}`);
    }

    if (largestChunk > bundleThresholds.maxChunkSize) {
      issues.push(`Largest chunk ${this.formatBytes(largestChunk)} exceeds ${this.formatBytes(bundleThresholds.maxChunkSize)}`);
    }

    if (stellarSize > bundleThresholds.maxStellarSize) {
      issues.push(`Stellar SDK size ${this.formatBytes(stellarSize)} exceeds ${this.formatBytes(bundleThresholds.maxStellarSize)}`);
    }

    if (compressionRatio < bundleThresholds.minCompressionRatio) {
      issues.push(`Compression ratio ${(compressionRatio * 100).toFixed(1)}% below minimum ${(bundleThresholds.minCompressionRatio * 100).toFixed(1)}%`);
    }

    return {
      passed: issues.length === 0,
      metrics: {
        totalSize,
        largestChunkSize: largestChunk,
        stellarSdkSize: stellarSize,
        compressionRatio,
        chunkCount: bundleReport.chunks.length,
      },
      issues,
    };
  }

  /**
   * Test memory usage patterns
   */
  async testMemoryUsage(): Promise<MemoryTestResult> {
    const memoryInfo = await this.measureMemoryUsage();
    const { memoryThresholds } = this.config;
    const issues: string[] = [];

    if (memoryInfo.currentHeapSize > memoryThresholds.maxHeapSize) {
      issues.push(`Current heap size ${this.formatBytes(memoryInfo.currentHeapSize)} exceeds ${this.formatBytes(memoryThresholds.maxHeapSize)}`);
    }

    if (memoryInfo.averageRenderMemory > memoryThresholds.maxRenderMemory) {
      issues.push(`Average render memory ${this.formatBytes(memoryInfo.averageRenderMemory)} exceeds ${this.formatBytes(memoryThresholds.maxRenderMemory)}`);
    }

    if (memoryInfo.memoryLeakRate > memoryThresholds.maxLeakRate) {
      issues.push(`Memory leak rate ${this.formatBytes(memoryInfo.memoryLeakRate)}/s exceeds ${this.formatBytes(memoryThresholds.maxLeakRate)}/s`);
    }

    return {
      passed: issues.length === 0,
      metrics: memoryInfo,
      issues,
    };
  }

  /**
   * Test rendering performance
   */
  async testRenderingPerformance(): Promise<RenderingTestResult> {
    const renderMetrics = await this.measureRenderingMetrics();
    const { renderingThresholds } = this.config;
    const issues: string[] = [];

    if (renderMetrics.averageRenderTime > renderingThresholds.maxRenderTime) {
      issues.push(`Average render time ${renderMetrics.averageRenderTime}ms exceeds ${renderingThresholds.maxRenderTime}ms`);
    }

    if (renderMetrics.reactUpdateRate > renderingThresholds.maxReactUpdates) {
      issues.push(`React update rate ${renderMetrics.reactUpdateRate}/s exceeds ${renderingThresholds.maxReactUpdates}/s`);
    }

    if (renderMetrics.cacheHitRate < renderingThresholds.minCacheHitRate) {
      issues.push(`Cache hit rate ${(renderMetrics.cacheHitRate * 100).toFixed(1)}% below minimum ${(renderingThresholds.minCacheHitRate * 100).toFixed(1)}%`);
    }

    return {
      passed: issues.length === 0,
      metrics: renderMetrics,
      issues,
    };
  }

  /**
   * Measure Web Vitals metrics
   */
  private async measureWebVitals(): Promise<LoadingTestResult['metrics']> {
    return new Promise((resolve) => {
      const metrics = {
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
        fcp: 0,
      };

      // Measure LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        metrics.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Measure FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        metrics.fid = entries[0]?.processingStart - entries[0]?.startTime || 0;
      }).observe({ entryTypes: ['first-input'] });

      // Measure CLS
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        metrics.cls = entries.reduce((sum: number, entry: any) => sum + entry.value, 0);
      }).observe({ entryTypes: ['layout-shift'] });

      // Measure Navigation Timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.ttfb = navigation.responseStart - navigation.fetchStart;
        metrics.fcp = navigation.loadEventEnd - navigation.fetchStart;
      }

      // Resolve after collecting initial metrics
      setTimeout(() => resolve(metrics), 1000);
    });
  }

  /**
   * Measure memory usage patterns
   */
  private async measureMemoryUsage(): Promise<MemoryTestResult['metrics']> {
    const memoryInfo = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };

    const metrics = this.monitor.getMetrics();
    const avgMemory = Object.values(metrics).reduce((sum, m) => sum + m.memoryUsage, 0) / Object.keys(metrics).length || 0;

    return {
      currentHeapSize: memoryInfo.usedJSHeapSize,
      peakHeapSize: memoryInfo.totalJSHeapSize,
      averageRenderMemory: avgMemory,
      memoryLeakRate: this.calculateMemoryLeakRate(),
    };
  }

  /**
   * Measure rendering performance metrics
   */
  private async measureRenderingMetrics(): Promise<RenderingTestResult['metrics']> {
    const metrics = this.monitor.getMetrics();
    const avgRenderTime = Object.values(metrics).reduce((sum, m) => sum + m.renderTime, 0) / Object.keys(metrics).length || 0;
    const avgCacheHit = Object.values(metrics).reduce((sum, m) => sum + m.cacheHitRatio, 0) / Object.keys(metrics).length || 0;

    return {
      averageRenderTime: avgRenderTime,
      reactUpdateRate: this.calculateReactUpdateRate(),
      cacheHitRate: avgCacheHit,
      memoizationEfficiency: this.calculateMemoizationEfficiency(),
    };
  }

  /**
   * Calculate memory leak rate
   */
  private calculateMemoryLeakRate(): number {
    const memoryHistory = this.monitor.getMemoryHistory();
    if (memoryHistory.length < 2) return 0;

    const recent = memoryHistory.slice(-10);
    const slope = this.calculateSlope(recent.map((entry, index) => [index, entry.memoryUsage]));
    return Math.max(0, slope); // Only positive slope indicates leak
  }

  /**
   * Calculate React update rate
   */
  private calculateReactUpdateRate(): number {
    const updateHistory = this.monitor.getUpdateHistory();
    if (updateHistory.length < 2) return 0;

    const recent = updateHistory.slice(-60); // Last 60 updates
    const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000; // seconds
    return recent.length / timeSpan;
  }

  /**
   * Calculate memoization efficiency
   */
  private calculateMemoizationEfficiency(): number {
    const cacheStats = this.monitor.getCacheStats();
    const totalRequests = cacheStats.hits + cacheStats.misses;
    return totalRequests > 0 ? cacheStats.hits / totalRequests : 0;
  }

  /**
   * Calculate slope for trend analysis
   */
  private calculateSlope(points: number[][]): number {
    if (points.length < 2) return 0;

    const n = points.length;
    const sumX = points.reduce((sum, [x]) => sum + x, 0);
    const sumY = points.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = points.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = points.reduce((sum, [x]) => sum + x * x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(results: PerformanceTestResult['results']): number {
    const weights = {
      loading: 0.3,
      bundle: 0.25,
      memory: 0.25,
      rendering: 0.2,
    };

    const scores = {
      loading: this.calculateLoadingScore(results.loading),
      bundle: this.calculateBundleScore(results.bundle),
      memory: this.calculateMemoryScore(results.memory),
      rendering: this.calculateRenderingScore(results.rendering),
    };

    return Math.round(
      Object.entries(scores).reduce(
        (total, [category, score]) => total + score * weights[category as keyof typeof weights],
        0
      )
    );
  }

  /**
   * Calculate loading performance score
   */
  private calculateLoadingScore(result: LoadingTestResult): number {
    if (result.passed) return 100;
    
    const penalties = result.issues.length * 15;
    return Math.max(0, 100 - penalties);
  }

  /**
   * Calculate bundle size score
   */
  private calculateBundleScore(result: BundleTestResult): number {
    if (result.passed) return 100;
    
    const penalties = result.issues.length * 20;
    return Math.max(0, 100 - penalties);
  }

  /**
   * Calculate memory usage score
   */
  private calculateMemoryScore(result: MemoryTestResult): number {
    if (result.passed) return 100;
    
    const penalties = result.issues.length * 25;
    return Math.max(0, 100 - penalties);
  }

  /**
   * Calculate rendering performance score
   */
  private calculateRenderingScore(result: RenderingTestResult): number {
    if (result.passed) return 100;
    
    const penalties = result.issues.length * 20;
    return Math.max(0, 100 - penalties);
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(results: PerformanceTestResult['results']): string[] {
    const recommendations: string[] = [];

    // Loading performance recommendations
    if (!results.loading.passed) {
      if (results.loading.metrics.lcp > this.config.loadingThresholds.lcp) {
        recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and enabling lazy loading');
      }
      if (results.loading.metrics.fid > this.config.loadingThresholds.fid) {
        recommendations.push('Improve First Input Delay by reducing JavaScript execution time and using code splitting');
      }
      if (results.loading.metrics.cls > this.config.loadingThresholds.cls) {
        recommendations.push('Reduce Cumulative Layout Shift by setting explicit dimensions for media elements');
      }
    }

    // Bundle size recommendations
    if (!results.bundle.passed) {
      if (results.bundle.metrics.totalSize > this.config.bundleThresholds.maxTotalSize) {
        recommendations.push('Reduce total bundle size by implementing tree shaking and removing unused dependencies');
      }
      if (results.bundle.metrics.stellarSdkSize > this.config.bundleThresholds.maxStellarSize) {
        recommendations.push('Optimize Stellar SDK usage by importing only required modules');
      }
    }

    // Memory recommendations
    if (!results.memory.passed) {
      if (results.memory.metrics.memoryLeakRate > this.config.memoryThresholds.maxLeakRate) {
        recommendations.push('Fix memory leaks by properly cleaning up event listeners and subscriptions');
      }
      if (results.memory.metrics.currentHeapSize > this.config.memoryThresholds.maxHeapSize) {
        recommendations.push('Reduce memory usage by optimizing data structures and implementing object pooling');
      }
    }

    // Rendering recommendations
    if (!results.rendering.passed) {
      if (results.rendering.metrics.averageRenderTime > this.config.renderingThresholds.maxRenderTime) {
        recommendations.push('Optimize rendering performance by using React.memo and useMemo more effectively');
      }
      if (results.rendering.metrics.cacheHitRate < this.config.renderingThresholds.minCacheHitRate) {
        recommendations.push('Improve cache hit rate by optimizing memoization strategies');
      }
    }

    return recommendations;
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Performance testing utilities for component-level testing
 */
export class ComponentPerformanceTester {
  private renderTimes: number[] = [];
  private memorySnapshots: number[] = [];

  /**
   * Start measuring component performance
   */
  startMeasurement(componentName: string): () => void {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    return () => {
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      this.renderTimes.push(endTime - startTime);
      this.memorySnapshots.push(endMemory - startMemory);
      
      console.log(`${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
    };
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    averageRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
    averageMemoryUsage: number;
    totalRenders: number;
  } {
    return {
      averageRenderTime: this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length || 0,
      maxRenderTime: Math.max(...this.renderTimes, 0),
      minRenderTime: Math.min(...this.renderTimes, 0),
      averageMemoryUsage: this.memorySnapshots.reduce((a, b) => a + b, 0) / this.memorySnapshots.length || 0,
      totalRenders: this.renderTimes.length,
    };
  }

  /**
   * Reset measurements
   */
  reset(): void {
    this.renderTimes = [];
    this.memorySnapshots = [];
  }
}

/**
 * Hook for testing component performance
 */
export function usePerformanceTesting(componentName: string) {
  const tester = new ComponentPerformanceTester();
  
  return {
    measureRender: () => tester.startMeasurement(componentName),
    getStats: () => tester.getStats(),
    reset: () => tester.reset(),
  };
}

// Export default performance test suite instance
export const performanceTestSuite = new PerformanceTestSuite();