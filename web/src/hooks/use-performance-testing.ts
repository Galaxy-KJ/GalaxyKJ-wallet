/**
 * Performance Testing React Hook
 *
 * React hook for integrating performance testing capabilities
 * directly into Galaxy Smart Wallet components.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { ComponentPerformanceTester } from "@/lib/performance/testing-utils";
import { PerformanceTestRunner } from "@/lib/performance/test-runner";
import {
  ComponentPerformanceMetrics,
  PerformanceMonitoringOptions,
  TestRunSummary as PerformanceTestRunSummary,
  PerformanceIssue,
  PerformanceTrackingOptions,
  RealTimePerformanceMetrics,
} from "@/types/performance-metrics";

// Hook options interface - now using centralized types
export type UsePerformanceTestingOptions = PerformanceMonitoringOptions;

/**
 * Hook for component-level performance testing
 */
export function useComponentPerformanceTesting(
  options: UsePerformanceTestingOptions = {},
) {
  const {
    componentName = "UnnamedComponent",
    enableAutoTesting = false,
    testInterval = 30000, // 30 seconds
    thresholds = {
      rendering: { maxRenderTime: 16 },
      memory: { maxRenderMemory: 5 * 1024 * 1024 },
    }, // 16ms (60fps), 5MB
    onThresholdExceeded,
  } = options;

  const testerRef = useRef<ComponentPerformanceTester | null>(null);
  const [metrics, setMetrics] = useState<ComponentPerformanceMetrics>({
    timestamp: Date.now(),
    duration: 0,
    score: 0,
    passed: true,
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: 0,
    averageMemoryUsage: 0,
    totalRenders: 0,
    lastRenderTime: 0,
    isHealthy: true,
  });

  const [isTestingEnabled, setIsTestingEnabled] = useState(enableAutoTesting);

  // Update metrics and check thresholds
  const updateMetrics = useCallback(() => {
    if (!testerRef.current) return;

    const stats = testerRef.current.getStats();
    const isHealthy =
      stats.averageRenderTime <= (thresholds?.rendering?.maxRenderTime || 16) &&
      stats.averageMemoryUsage <=
        (thresholds?.memory?.maxRenderMemory || 5 * 1024 * 1024);

    const newMetrics: ComponentPerformanceMetrics = {
      timestamp: Date.now(),
      duration: performance.now(),
      score: isHealthy
        ? 100
        : Math.max(0, 100 - (stats.averageRenderTime / 16) * 50),
      passed: isHealthy,
      averageRenderTime: stats.averageRenderTime,
      maxRenderTime: stats.maxRenderTime,
      minRenderTime: stats.minRenderTime,
      averageMemoryUsage: stats.averageMemoryUsage,
      totalRenders: stats.totalRenders,
      lastRenderTime: stats.averageRenderTime, // Approximation
      isHealthy,
    };

    // Check thresholds
    if (onThresholdExceeded) {
      if (
        stats.averageRenderTime > (thresholds?.rendering?.maxRenderTime || 16)
      ) {
        onThresholdExceeded(
          "renderTime",
          stats.averageRenderTime,
          thresholds?.rendering?.maxRenderTime || 16,
        );
      }
      if (
        stats.averageMemoryUsage >
        (thresholds?.memory?.maxRenderMemory || 5 * 1024 * 1024)
      ) {
        onThresholdExceeded(
          "memoryUsage",
          stats.averageMemoryUsage,
          thresholds?.memory?.maxRenderMemory || 5 * 1024 * 1024,
        );
      }
    }

    setMetrics(newMetrics);
  }, [thresholds, onThresholdExceeded]);

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
  }, [isTestingEnabled, testInterval, updateMetrics]);

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
        timestamp: Date.now(),
        duration: 0,
        score: 100,
        passed: true,
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
  const toggleTesting = useCallback(
    (enabled?: boolean) => {
      setIsTestingEnabled(enabled ?? !isTestingEnabled);
    },
    [isTestingEnabled],
  );

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
export function useApplicationPerformanceTesting(
  options: {
    autoStart?: boolean;
    testInterval?: number; // minutes
    onTestComplete?: (result: PerformanceTestRunSummary) => void;
    onTestFailed?: (error: Error) => void;
  } = {},
) {
  const {
    autoStart = false,
    testInterval = 60, // 60 minutes default
    onTestComplete,
    onTestFailed,
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] =
    useState<PerformanceTestRunSummary | null>(null);
  const [testHistory, setTestHistory] = useState<PerformanceTestRunSummary[]>(
    [],
  );
  const [error, setError] = useState<Error | null>(null);

  const testRunnerRef = useRef<PerformanceTestRunner | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize test runner
  useEffect(() => {
    testRunnerRef.current = new PerformanceTestRunner();
  }, []);

  // Run a single performance test
  const runTest = useCallback(async () => {
    if (!testRunnerRef.current || isRunning) return;

    setIsRunning(true);
    setError(null);

    try {
      const result = await testRunnerRef.current.runTest({
        outputFormat: "console",
        saveResults: false,
        includeDetailed: true,
      });

      // Convert the result to match our type
      const convertedResult: PerformanceTestRunSummary = {
        runId: result.runId,
        timestamp: result.timestamp,
        duration: result.duration,
        overallPassed: result.overallPassed,
        overallScore: result.overallScore,
        testResults: {
          passed: result.testResults.passed,
          score: result.testResults.score,
          results: {
            loading: {
              passed: result.testResults.results.loading.passed,
              metrics: {
                timestamp: Date.now(),
                duration: 0,
                score: result.testResults.results.loading.passed ? 100 : 0,
                passed: result.testResults.results.loading.passed,
                lcp: result.testResults.results.loading.metrics.lcp,
                fid: result.testResults.results.loading.metrics.fid,
                cls: result.testResults.results.loading.metrics.cls,
                ttfb: result.testResults.results.loading.metrics.ttfb,
                fcp: result.testResults.results.loading.metrics.fcp,
              },
              issues: result.testResults.results.loading.issues,
            },
            bundle: {
              passed: result.testResults.results.bundle.passed,
              metrics: {
                timestamp: Date.now(),
                duration: 0,
                score: result.testResults.results.bundle.passed ? 100 : 0,
                passed: result.testResults.results.bundle.passed,
                totalSize: result.testResults.results.bundle.metrics.totalSize,
                largestChunkSize:
                  result.testResults.results.bundle.metrics.largestChunkSize,
                stellarSdkSize:
                  result.testResults.results.bundle.metrics.stellarSdkSize,
                compressionRatio:
                  result.testResults.results.bundle.metrics.compressionRatio,
                chunkCount:
                  result.testResults.results.bundle.metrics.chunkCount,
              },
              issues: result.testResults.results.bundle.issues,
            },
            memory: {
              passed: result.testResults.results.memory.passed,
              metrics: {
                timestamp: Date.now(),
                duration: 0,
                score: result.testResults.results.memory.passed ? 100 : 0,
                passed: result.testResults.results.memory.passed,
                currentHeapSize:
                  result.testResults.results.memory.metrics.currentHeapSize,
                peakHeapSize:
                  result.testResults.results.memory.metrics.peakHeapSize,
                averageRenderMemory:
                  result.testResults.results.memory.metrics.averageRenderMemory,
                memoryLeakRate:
                  result.testResults.results.memory.metrics.memoryLeakRate,
              },
              issues: result.testResults.results.memory.issues,
            },
            rendering: {
              passed: result.testResults.results.rendering.passed,
              metrics: {
                timestamp: Date.now(),
                duration: 0,
                score: result.testResults.results.rendering.passed ? 100 : 0,
                passed: result.testResults.results.rendering.passed,
                averageRenderTime:
                  result.testResults.results.rendering.metrics
                    .averageRenderTime,
                maxRenderTime:
                  result.testResults.results.rendering.metrics
                    .averageRenderTime,
                minRenderTime:
                  result.testResults.results.rendering.metrics
                    .averageRenderTime,
                reactUpdateRate:
                  result.testResults.results.rendering.metrics.reactUpdateRate,
                cacheHitRate:
                  result.testResults.results.rendering.metrics.cacheHitRate,
                memoizationEfficiency:
                  result.testResults.results.rendering.metrics
                    .memoizationEfficiency,
                totalRenders: 0,
              },
              issues: result.testResults.results.rendering.issues,
            },
          },
          recommendations: result.testResults.recommendations,
          timestamp: result.testResults.timestamp,
        },
        environment: result.environment,
      };

      setLastResult(convertedResult);
      setTestHistory((prev) => [...prev.slice(-9), convertedResult]); // Keep last 10 results

      if (onTestComplete) {
        onTestComplete(convertedResult);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Performance test failed");
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
    intervalRef.current = setInterval(
      () => {
        runTest();
      },
      testInterval * 60 * 1000,
    ); // Convert minutes to milliseconds
  }, [runTest, testInterval]);

  // Stop continuous testing
  const stopTesting = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start testing
  useEffect(() => {
    if (autoStart) {
      startTesting();
    }

    return () => {
      stopTesting();
    };
  }, [autoStart, startTesting, stopTesting]);

  // Generate benchmark report
  const generateBenchmarkReport = useCallback(async () => {
    if (!testRunnerRef.current) return null;

    try {
      return await testRunnerRef.current.generateBenchmarkReport();
    } catch (err) {
      console.error("Failed to generate benchmark report:", err);
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
export function usePerformanceMetrics(
  options: PerformanceTrackingOptions = {},
) {
  const {
    trackRenderTime = true,
    trackMemoryUsage = true,
    trackNetworkRequests = false,
    sampleRate = 0.1, // 10% of renders
  } = options;

  const [metrics, setMetrics] = useState<RealTimePerformanceMetrics>({
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
      setMetrics((prev) => ({
        ...prev,
        renderTime:
          prev.renderTime === 0
            ? renderTime
            : (prev.renderTime + renderTime) / 2,
        timestamp: Date.now(),
      }));
    };
  });

  // Track memory usage
  useEffect(() => {
    if (!trackMemoryUsage) return;

    const updateMemory = () => {
      const memoryInfo = (
        performance as Performance & { memory?: { usedJSHeapSize: number } }
      ).memory;
      if (memoryInfo) {
        setMetrics((prev) => ({
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

      setMetrics((prev) => ({
        ...prev,
        networkRequests: requestCount,
        timestamp: Date.now(),
      }));
    });

    observer.observe({ entryTypes: ["resource"] });

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
export function usePerformanceTesting(
  options: {
    componentName?: string;
    enableComponentTesting?: boolean;
    enableApplicationTesting?: boolean;
    componentThresholds?: {
      renderTime?: number;
      memoryUsage?: number;
    };
    applicationTestInterval?: number; // minutes
    onPerformanceIssue?: (issue: PerformanceIssue) => void;
  } = {},
) {
  const {
    componentName,
    enableComponentTesting = true,
    enableApplicationTesting = false,
    componentThresholds,
    applicationTestInterval = 60,
    onPerformanceIssue,
  } = options;

  // Convert componentThresholds to the expected format
  const convertedThresholds = componentThresholds
    ? {
        rendering: { 
          maxRenderTime: componentThresholds.renderTime || 16,
          maxReactUpdates: 60, // Default value
          minCacheHitRate: 0.8 // Default value
        },
        memory: {
          maxHeapSize: 50 * 1024 * 1024, // 50MB default
          maxRenderMemory: componentThresholds.memoryUsage || 5 * 1024 * 1024,
          maxLeakRate: 1024 * 1024, // 1MB per second default
        },
      }
    : undefined;

  // Component-level testing
  const componentTesting = useComponentPerformanceTesting({
    componentName,
    enableAutoTesting: enableComponentTesting,
    thresholds: convertedThresholds,
    onThresholdExceeded: (metric, value, threshold) => {
      if (onPerformanceIssue) {
        onPerformanceIssue({
          type: "component",
          severity: value > threshold * 2 ? "critical" : "warning",
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
          type: "application",
          severity: result.overallScore < 50 ? "critical" : "warning",
          message: `Performance test failed with score ${result.overallScore}/100`,
          metrics: result.testResults.results,
        });
      }
    },
    onTestFailed: (error) => {
      if (onPerformanceIssue) {
        onPerformanceIssue({
          type: "application",
          severity: "critical",
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
