/**
 * Performance Metrics Types
 *
 * Centralized type definitions for performance metrics in the Galaxy Smart Wallet.
 * This file provides structured interfaces for all performance-related data.
 */

// Base performance metrics interface
export interface BasePerformanceMetrics {
  timestamp: number;
  duration: number;
  score: number;
  passed: boolean;
}

// Loading performance metrics (Web Vitals)
export interface LoadingPerformanceMetrics extends BasePerformanceMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte (ms)
  fcp: number; // First Contentful Paint (ms)
}

// Bundle size metrics
export interface BundleMetrics extends BasePerformanceMetrics {
  totalSize: number; // bytes
  largestChunkSize: number; // bytes
  stellarSdkSize: number; // bytes
  compressionRatio: number; // 0-1
  chunkCount: number;
}

// Memory usage metrics
export interface MemoryMetrics extends BasePerformanceMetrics {
  currentHeapSize: number; // bytes
  peakHeapSize: number; // bytes
  averageRenderMemory: number; // bytes
  memoryLeakRate: number; // bytes per second
}

// Rendering performance metrics
export interface RenderingMetrics extends BasePerformanceMetrics {
  averageRenderTime: number; // ms
  maxRenderTime: number; // ms
  minRenderTime: number; // ms
  reactUpdateRate: number; // updates per second
  cacheHitRate: number; // 0-1
  memoizationEfficiency: number; // 0-1
  totalRenders: number;
}

// Component-level performance metrics
export interface ComponentPerformanceMetrics extends BasePerformanceMetrics {
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  averageMemoryUsage: number;
  totalRenders: number;
  lastRenderTime: number;
  isHealthy: boolean;
}

// Performance thresholds configuration
export interface PerformanceThresholds {
  loading: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
    fcp: number;
  };
  bundle: {
    maxTotalSize: number;
    maxChunkSize: number;
    maxStellarSize: number;
    minCompressionRatio: number;
  };
  memory: {
    maxHeapSize: number;
    maxRenderMemory: number;
    maxLeakRate: number;
  };
  rendering: {
    maxRenderTime: number;
    maxReactUpdates: number;
    minCacheHitRate: number;
  };
}

// Performance test result with structured metrics
export interface PerformanceTestResult {
  passed: boolean;
  score: number; // 0-100
  results: {
    loading: {
      passed: boolean;
      metrics: LoadingPerformanceMetrics;
      issues: string[];
    };
    bundle: {
      passed: boolean;
      metrics: BundleMetrics;
      issues: string[];
    };
    memory: {
      passed: boolean;
      metrics: MemoryMetrics;
      issues: string[];
    };
    rendering: {
      passed: boolean;
      metrics: RenderingMetrics;
      issues: string[];
    };
  };
  recommendations: string[];
  timestamp: Date;
}

// Test run summary with environment info
export interface TestRunSummary {
  runId: string;
  timestamp: Date;
  duration: number; // ms
  overallPassed: boolean;
  overallScore: number;
  testResults: PerformanceTestResult;
  environment: {
    userAgent: string;
    platform: string;
    memory: number;
    connection: string;
    timestamp: string;
  };
}

// Performance monitoring options
export interface PerformanceMonitoringOptions {
  componentName?: string;
  enableAutoTesting?: boolean;
  testInterval?: number; // milliseconds
  thresholds?: Partial<PerformanceThresholds>;
  onTestComplete?: (result: TestRunSummary) => void;
  onThresholdExceeded?: (
    metric: string,
    value: number,
    threshold: number,
  ) => void;
}

// Performance issue classification
export interface PerformanceIssue {
  type: "component" | "application";
  severity: "warning" | "critical";
  message: string;
  metrics?: Record<string, unknown>;
}

// Performance metrics tracking options
export interface PerformanceTrackingOptions {
  trackRenderTime?: boolean;
  trackMemoryUsage?: boolean;
  trackBundleSize?: boolean;
  trackNetworkRequests?: boolean;
  sampleRate?: number; // 0-1, percentage of renders to measure
}

// Real-time performance metrics
export interface RealTimePerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  networkRequests: number;
  timestamp: number;
}

// Performance test configuration
export interface PerformanceTestConfig {
  loadingThresholds: PerformanceThresholds["loading"];
  bundleThresholds: PerformanceThresholds["bundle"];
  memoryThresholds: PerformanceThresholds["memory"];
  renderingThresholds: PerformanceThresholds["rendering"];
}

// Test run options
export interface TestRunOptions {
  config?: Partial<PerformanceTestConfig>;
  outputFormat?: "console" | "json" | "html" | "markdown";
  saveResults?: boolean;
  resultsPath?: string;
  includeDetailed?: boolean;
  runContinuous?: boolean;
  continuousInterval?: number; // minutes
}
