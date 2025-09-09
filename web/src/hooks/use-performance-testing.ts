/**
 * Performance Testing React Hook
 * 
 * React hook for integrating performance testing capabilities
 * directly into Galaxy Smart Wallet components.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { ComponentPerformanceTester, PerformanceTestSuite, PerformanceTestResult } from '@/lib/performance/testing-utils';
import { PerformanceTestRunner, TestRunSummary } from '@/lib/performance/test-runner';

// Hook options interface
export interface UsePerformanceTestingOptions {
  componentName?: string;
  enableAutoTesting?: boolean;
  testInterval?: number; // milliseconds
  thresholds?: {
    renderTime?: number;
    memoryUsage?: number;
  };
  onTestComplete?: (result: TestRunSummary) => void;
  onThresholdExceeded?: (metric: string, value: number, threshold: number) => void;
}

// Performance metrics interface
export interface ComponentPerformanceMetrics {
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  averageMemoryUsage: number;
  totalRenders: number;
  lastRenderTime: number;
  isHealthy: boolean;
}

/**
 * Hook for component-level performance testing
 */
export function useComponentPerformanceTesting(options: UsePerformanceTestingOptions = {}) {
  const {
    componentName = 'UnnamedComponent',
    enableAutoTesting = false,
    testInterval = 30000, // 30 seconds
    thresholds = { renderTime: 16, memoryUsage: 5 * 1024 * 1024 }, // 16ms (60fps), 5MB
    onTestComplete,
    onThresholdExceeded,
  } = options;

  const testerRef = useRef<ComponentPerformanceTester>();
  const [metrics, setMetrics] = useState<ComponentPerformanceMetrics>({
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: 0,
    averageMemoryUsage: 0,
    totalRenders: 0,
    lastRenderTime: 0,
    isHealthy: true,
  });

  const [isTestingEnabled, setIsTestingEnabled] = useState(enableAutoTesting);

  // Initialize tester
  useEffect(() => {
    if (!testerRef.current) {
      testerRef.current = new ComponentPerformanceTester();
    }
  }, []);

  // Auto-testing interval
  useEffect(() => {
    if (!isTestingEnabled || !testerRef.current) return;

    const interval = setInterval(() => {
      updateMetrics();
    }, testInterval);

    return () => clearInterval(interval);
  }, [isTestingEnabled, testInterval]);

  // Update metrics and check thresholds
  const updateMetrics = useCallback(() => {
    if (!testerRef.current) return;

    const stats = testerRef.current.getStats();
    const newMetrics: ComponentPerformanceMetrics = {
      averageRenderTime: stats.averageRenderTime,
      maxRenderTime: stats.maxRenderTime,
      minRenderTime: stats.minRenderTime,
      averageMemoryUsage: stats.averageMemoryUsage,
      totalRenders: stats.totalRenders,
      lastRenderTime: stats.averageRenderTime, // Approximation
      isHealthy: 
        stats.averageRenderTime <= (thresholds.renderTime || 16) &&
        stats.averageMemoryUsage <= (thresholds.memoryUsage || 5 * 1024 * 1024),
    };

    // Check thresholds
    if (onThresholdExceeded) {
      if (stats.averageRenderTime > (thresholds.renderTime || 16)) {
        onThresholdExceeded('renderTime', stats.averageRenderTime, thresholds.renderTime || 16);
      }
      if (stats.averageMemoryUsage > (thresholds.memoryUsage || 5 * 1024 * 1024)) {
        onThresholdExceeded('memoryUsage', stats.averageMemoryUsage, thresholds.memoryUsage || 5 * 1024 * 1024);
      }
    }

    setMetrics(newMetrics);
  }, [thresholds, onThresholdExceeded]);

  // Measure a single render
  const measureRender = useCallback(() => {
    if (!testerRef.current) return () => {};
    
    const stopMeasurement = testerRef.current.startMeasurement(componentName);
    
    return () => {
      stopMeasurement();
      updateMetrics();
    };
  }, [componentName, updateMetrics]);

  // Reset all measurements
  const reset = useCallback(() => {
    if (testerRef.current) {
      testerRef.current.reset();
      setMetrics({
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: 0,
        averageMemoryUsage: 0,
        totalRenders: 0,
        lastRenderTime: 0,
        isHealthy: true,
      });
    }
  }, []);

  // Toggle testing
  const toggleTesting = useCallback((enabled?: boolean) => {
    setIsTestingEnabled(enabled ?? !isTestingEnabled);
  }, [isTestingEnabled]);

  // Get detailed stats
  const getDetailedStats = useCallback(() => {
    return testerRef.current?.getStats() || null;
  }, []);

  return {
    metrics,
    measureRender,
    reset,
    toggleTesting,
    isTestingEnabled,
    getDetailedStats,
    updateMetrics,
  };
}

/**
 * Hook for full application performance testing
 */
export function useApplicationPerformanceTesting(options: {
  autoStart?: boolean;
  testInterval?: number; // minutes
  onTestComplete?: (result: TestRunSummary) => void;
  onTestFailed?: (error: Error) => void;
} = {}) {
  const {
    autoStart = false,
    testInterval = 60, // 60 minutes default
    onTestComplete,
    onTestFailed,
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<TestRunSummary | null>(null);
  const [testHistory, setTestHistory] = useState<TestRunSummary[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const testRunnerRef = useRef<PerformanceTestRunner>();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize test runner
  useEffect(() => {
    testRunnerRef.current = new PerformanceTestRunner();
  }, []);

  // Auto-start testing
  useEffect(() => {
    if (autoStart) {
      startTesting();
    }

    return () => {
      stopTesting();
    };
  }, [autoStart]);

  // Run a single performance test
  const runTest = useCallback(async () => {
    if (!testRunnerRef.current || isRunning) return;

    setIsRunning(true);
    setError(null);

    try {
      const result = await testRunnerRef.current.runTest({
        outputFormat: 'console',
        saveResults: false,
        includeDetailed: true,
      });

      setLastResult(result);
      setTestHistory(prev => [...prev.slice(-9), result]); // Keep last 10 results

      if (onTestComplete) {
        onTestComplete(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Performance test failed');
      setError(error);
      
      if (onTestFailed) {
        onTestFailed(error);
      }
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, onTestComplete, onTestFailed]);

  // Start continuous testing
  const startTesting = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Run initial test
    runTest();

    // Set up recurring tests
    intervalRef.current = setInterval(() => {
      runTest();
    }, testInterval * 60 * 1000); // Convert minutes to milliseconds
  }, [runTest, testInterval]);

  // Stop continuous testing
  const stopTesting = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // Generate benchmark report
  const generateBenchmarkReport = useCallback(async () => {
    if (!testRunnerRef.current) return null;
    
    try {
      return await testRunnerRef.current.generateBenchmarkReport();
    } catch (err) {
      console.error('Failed to generate benchmark report:', err);
      return null;
    }
  }, []);

  // Clear test history
  const clearHistory = useCallback(() => {
    setTestHistory([]);
    setLastResult(null);
    setError(null);
    
    if (testRunnerRef.current) {
      testRunnerRef.current.clearHistory();
    }
  }, []);

  return {
    isRunning,
    lastResult,
    testHistory,
    error,
    runTest,
    startTesting,
    stopTesting,
    generateBenchmarkReport,
    clearHistory,
    isAutoTestingEnabled: !!intervalRef.current,
  };
}

/**
 * Hook for monitoring specific performance metrics
 */
export function usePerformanceMetrics(options: {
  trackRenderTime?: boolean;
  trackMemoryUsage?: boolean;
  trackBundleSize?: boolean;
  trackNetworkRequests?: boolean;
  sampleRate?: number; // 0-1, percentage of renders to measure
} = {}) {
  const {
    trackRenderTime = true,
    trackMemoryUsage = true,
    trackBundleSize = false,
    trackNetworkRequests = false,
    sampleRate = 0.1, // 10% of renders
  } = options;

  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    networkRequests: 0,
    timestamp: Date.now(),
  });

  const shouldSample = useCallback(() => {
    return Math.random() < sampleRate;
  }, [sampleRate]);

  // Track render time
  useEffect(() => {
    if (!trackRenderTime || !shouldSample()) return;

    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        renderTime: prev.renderTime === 0 ? renderTime : (prev.renderTime + renderTime) / 2,
        timestamp: Date.now(),
      }));
    };
  });

  // Track memory usage
  useEffect(() => {
    if (!trackMemoryUsage) return;

    const updateMemory = () => {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memoryInfo.usedJSHeapSize,
          timestamp: Date.now(),
        }));
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [trackMemoryUsage]);

  // Track network requests
  useEffect(() => {
    if (!trackNetworkRequests) return;

    let requestCount = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      requestCount += entries.length;
      
      setMetrics(prev => ({
        ...prev,
        networkRequests: requestCount,
        timestamp: Date.now(),
      }));
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, [trackNetworkRequests]);

  return {
    metrics,
    timestamp: metrics.timestamp,
  };
}

/**
 * Convenience hook that combines component and application testing
 */
export function usePerformanceTesting(options: {
  componentName?: string;
  enableComponentTesting?: boolean;
  enableApplicationTesting?: boolean;
  componentThresholds?: {
    renderTime?: number;
    memoryUsage?: number;
  };
  applicationTestInterval?: number; // minutes
  onPerformanceIssue?: (issue: {
    type: 'component' | 'application';
    severity: 'warning' | 'critical';
    message: string;
    metrics?: any;
  }) => void;
} = {}) {
  const {
    componentName,
    enableComponentTesting = true,
    enableApplicationTesting = false,
    componentThresholds,
    applicationTestInterval = 60,
    onPerformanceIssue,
  } = options;

  // Component-level testing
  const componentTesting = useComponentPerformanceTesting({
    componentName,
    enableAutoTesting: enableComponentTesting,
    thresholds: componentThresholds,
    onThresholdExceeded: (metric, value, threshold) => {
      if (onPerformanceIssue) {
        onPerformanceIssue({
          type: 'component',
          severity: value > threshold * 2 ? 'critical' : 'warning',
          message: `${metric} (${value.toFixed(2)}) exceeds threshold (${threshold})`,
          metrics: { metric, value, threshold },
        });
      }
    },
  });

  // Application-level testing
  const applicationTesting = useApplicationPerformanceTesting({
    autoStart: enableApplicationTesting,
    testInterval: applicationTestInterval,
    onTestComplete: (result) => {
      if (!result.overallPassed && onPerformanceIssue) {
        onPerformanceIssue({
          type: 'application',
          severity: result.overallScore < 50 ? 'critical' : 'warning',
          message: `Performance test failed with score ${result.overallScore}/100`,
          metrics: result.testResults.results,
        });
      }
    },
    onTestFailed: (error) => {
      if (onPerformanceIssue) {
        onPerformanceIssue({
          type: 'application',
          severity: 'critical',
          message: `Performance test failed: ${error.message}`,
        });
      }
    },
  });

  return {
    component: componentTesting,
    application: applicationTesting,
    runFullTest: applicationTesting.runTest,
    isHealthy: componentTesting.metrics.isHealthy && !applicationTesting.error,
  };
}