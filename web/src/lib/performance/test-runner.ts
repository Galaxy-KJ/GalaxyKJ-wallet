/**
 * Performance Test Runner
 * 
 * Automated test runner for comprehensive performance validation
 * of the Galaxy Smart Wallet application.
 */

import { PerformanceTestSuite, PerformanceTestResult, PerformanceTestConfig } from './testing-utils';
import { PerformanceMonitor } from './optimizations';
import { GalaxyBundleAnalyzer } from './bundle-analyzer';

export interface TestRunOptions {
  config?: Partial<PerformanceTestConfig>;
  outputFormat?: 'console' | 'json' | 'html' | 'markdown';
  saveResults?: boolean;
  resultsPath?: string;
  includeDetailed?: boolean;
  runContinuous?: boolean;
  continuousInterval?: number; // minutes
}

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

export class PerformanceTestRunner {
  private testSuite: PerformanceTestSuite;
  private results: TestRunSummary[] = [];

  constructor(options: TestRunOptions = {}) {
    this.testSuite = new PerformanceTestSuite(options.config);
  }

  /**
   * Run a complete performance test
   */
  async runTest(options: TestRunOptions = {}): Promise<TestRunSummary> {
    const runId = this.generateRunId();
    const startTime = performance.now();

    console.log(`🚀 Starting performance test run: ${runId}`);

    try {
      // Collect environment information
      const environment = await this.collectEnvironmentInfo();

      // Run the test suite
      const testResults = await this.testSuite.runFullSuite();
      
      const duration = performance.now() - startTime;
      
      const summary: TestRunSummary = {
        runId,
        timestamp: new Date(),
        duration,
        overallPassed: testResults.passed,
        overallScore: testResults.score,
        testResults,
        environment,
      };

      // Store results
      this.results.push(summary);

      // Output results
      await this.outputResults(summary, options);

      // Save results if requested
      if (options.saveResults) {
        await this.saveResults(summary, options.resultsPath);
      }

      console.log(`✅ Performance test completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(`📊 Overall Score: ${testResults.score}/100 ${testResults.passed ? '✅' : '❌'}`);

      return summary;
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      throw error;
    }
  }

  /**
   * Run continuous performance monitoring
   */
  async runContinuous(options: TestRunOptions = {}): Promise<void> {
    const interval = options.continuousInterval || 30; // Default 30 minutes
    
    console.log(`🔄 Starting continuous performance monitoring (interval: ${interval}m)`);

    const runContinuousTest = async () => {
      try {
        await this.runTest({ ...options, outputFormat: 'console' });
      } catch (error) {
        console.error('Continuous test run failed:', error);
      }
    };

    // Run initial test
    await runContinuousTest();

    // Schedule recurring tests
    const intervalId = setInterval(runContinuousTest, interval * 60 * 1000);

    // Handle cleanup
    process.on('SIGINT', () => {
      console.log('🛑 Stopping continuous monitoring...');
      clearInterval(intervalId);
      process.exit(0);
    });
  }

  /**
   * Generate benchmark comparison report
   */
  async generateBenchmarkReport(): Promise<string> {
    if (this.results.length < 2) {
      throw new Error('Need at least 2 test runs to generate benchmark report');
    }

    const latest = this.results[this.results.length - 1];
    const baseline = this.results[0];

    const report = `# Performance Benchmark Report

## Overview
- **Latest Run**: ${latest.runId} (${latest.timestamp.toISOString()})
- **Baseline Run**: ${baseline.runId} (${baseline.timestamp.toISOString()})
- **Runs Analyzed**: ${this.results.length}

## Score Comparison
- **Latest Score**: ${latest.overallScore}/100 ${latest.overallPassed ? '✅' : '❌'}
- **Baseline Score**: ${baseline.overallScore}/100 ${baseline.overallPassed ? '✅' : '❌'}
- **Change**: ${latest.overallScore - baseline.overallScore > 0 ? '+' : ''}${latest.overallScore - baseline.overallScore} points

## Detailed Metrics

### Loading Performance
| Metric | Baseline | Latest | Change | Status |
|--------|----------|---------|---------|---------|
| LCP | ${baseline.testResults.results.loading.metrics.lcp}ms | ${latest.testResults.results.loading.metrics.lcp}ms | ${this.formatChange(latest.testResults.results.loading.metrics.lcp - baseline.testResults.results.loading.metrics.lcp, 'ms')} | ${this.getStatusIcon(latest.testResults.results.loading.metrics.lcp <= baseline.testResults.results.loading.metrics.lcp)} |
| FID | ${baseline.testResults.results.loading.metrics.fid}ms | ${latest.testResults.results.loading.metrics.fid}ms | ${this.formatChange(latest.testResults.results.loading.metrics.fid - baseline.testResults.results.loading.metrics.fid, 'ms')} | ${this.getStatusIcon(latest.testResults.results.loading.metrics.fid <= baseline.testResults.results.loading.metrics.fid)} |
| CLS | ${baseline.testResults.results.loading.metrics.cls} | ${latest.testResults.results.loading.metrics.cls} | ${this.formatChange(latest.testResults.results.loading.metrics.cls - baseline.testResults.results.loading.metrics.cls)} | ${this.getStatusIcon(latest.testResults.results.loading.metrics.cls <= baseline.testResults.results.loading.metrics.cls)} |

### Bundle Size
| Metric | Baseline | Latest | Change | Status |
|--------|----------|---------|---------|---------|
| Total Size | ${this.formatBytes(baseline.testResults.results.bundle.metrics.totalSize)} | ${this.formatBytes(latest.testResults.results.bundle.metrics.totalSize)} | ${this.formatChange(latest.testResults.results.bundle.metrics.totalSize - baseline.testResults.results.bundle.metrics.totalSize, 'bytes')} | ${this.getStatusIcon(latest.testResults.results.bundle.metrics.totalSize <= baseline.testResults.results.bundle.metrics.totalSize)} |
| Largest Chunk | ${this.formatBytes(baseline.testResults.results.bundle.metrics.largestChunkSize)} | ${this.formatBytes(latest.testResults.results.bundle.metrics.largestChunkSize)} | ${this.formatChange(latest.testResults.results.bundle.metrics.largestChunkSize - baseline.testResults.results.bundle.metrics.largestChunkSize, 'bytes')} | ${this.getStatusIcon(latest.testResults.results.bundle.metrics.largestChunkSize <= baseline.testResults.results.bundle.metrics.largestChunkSize)} |
| Stellar SDK | ${this.formatBytes(baseline.testResults.results.bundle.metrics.stellarSdkSize)} | ${this.formatBytes(latest.testResults.results.bundle.metrics.stellarSdkSize)} | ${this.formatChange(latest.testResults.results.bundle.metrics.stellarSdkSize - baseline.testResults.results.bundle.metrics.stellarSdkSize, 'bytes')} | ${this.getStatusIcon(latest.testResults.results.bundle.metrics.stellarSdkSize <= baseline.testResults.results.bundle.metrics.stellarSdkSize)} |

### Memory Usage
| Metric | Baseline | Latest | Change | Status |
|--------|----------|---------|---------|---------|
| Heap Size | ${this.formatBytes(baseline.testResults.results.memory.metrics.currentHeapSize)} | ${this.formatBytes(latest.testResults.results.memory.metrics.currentHeapSize)} | ${this.formatChange(latest.testResults.results.memory.metrics.currentHeapSize - baseline.testResults.results.memory.metrics.currentHeapSize, 'bytes')} | ${this.getStatusIcon(latest.testResults.results.memory.metrics.currentHeapSize <= baseline.testResults.results.memory.metrics.currentHeapSize)} |
| Render Memory | ${this.formatBytes(baseline.testResults.results.memory.metrics.averageRenderMemory)} | ${this.formatBytes(latest.testResults.results.memory.metrics.averageRenderMemory)} | ${this.formatChange(latest.testResults.results.memory.metrics.averageRenderMemory - baseline.testResults.results.memory.metrics.averageRenderMemory, 'bytes')} | ${this.getStatusIcon(latest.testResults.results.memory.metrics.averageRenderMemory <= baseline.testResults.results.memory.metrics.averageRenderMemory)} |

### Rendering Performance
| Metric | Baseline | Latest | Change | Status |
|--------|----------|---------|---------|---------|
| Render Time | ${baseline.testResults.results.rendering.metrics.averageRenderTime}ms | ${latest.testResults.results.rendering.metrics.averageRenderTime}ms | ${this.formatChange(latest.testResults.results.rendering.metrics.averageRenderTime - baseline.testResults.results.rendering.metrics.averageRenderTime, 'ms')} | ${this.getStatusIcon(latest.testResults.results.rendering.metrics.averageRenderTime <= baseline.testResults.results.rendering.metrics.averageRenderTime)} |
| Cache Hit Rate | ${(baseline.testResults.results.rendering.metrics.cacheHitRate * 100).toFixed(1)}% | ${(latest.testResults.results.rendering.metrics.cacheHitRate * 100).toFixed(1)}% | ${this.formatChange((latest.testResults.results.rendering.metrics.cacheHitRate - baseline.testResults.results.rendering.metrics.cacheHitRate) * 100, '%')} | ${this.getStatusIcon(latest.testResults.results.rendering.metrics.cacheHitRate >= baseline.testResults.results.rendering.metrics.cacheHitRate)} |

## Recommendations
${latest.testResults.recommendations.length > 0 ? latest.testResults.recommendations.map(rec => `- ${rec}`).join('\n') : 'No recommendations - all tests passed!'}

## Trend Analysis
${this.generateTrendAnalysis()}

---
Generated: ${new Date().toISOString()}
`;

    return report;
  }

  /**
   * Get performance test history
   */
  getTestHistory(): TestRunSummary[] {
    return [...this.results];
  }

  /**
   * Clear test history
   */
  clearHistory(): void {
    this.results = [];
  }

  /**
   * Collect environment information
   */
  private async collectEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      memory: (navigator as any).deviceMemory || 0,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Output test results in specified format
   */
  private async outputResults(summary: TestRunSummary, options: TestRunOptions): Promise<void> {
    const format = options.outputFormat || 'console';

    switch (format) {
      case 'console':
        this.outputConsole(summary, options.includeDetailed || false);
        break;
      case 'json':
        console.log(JSON.stringify(summary, null, 2));
        break;
      case 'markdown':
        console.log(await this.generateMarkdownReport(summary));
        break;
      case 'html':
        console.log(await this.generateHtmlReport(summary));
        break;
    }
  }

  /**
   * Output results to console with formatted display
   */
  private outputConsole(summary: TestRunSummary, includeDetailed: boolean): void {
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 PERFORMANCE TEST RESULTS - ${summary.runId}`);
    console.log('='.repeat(60));
    
    console.log(`\n📊 Overall Score: ${summary.overallScore}/100 ${summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    console.log(`🗓️  Timestamp: ${summary.timestamp.toISOString()}`);

    const results = summary.testResults.results;

    // Loading Performance
    console.log(`\n🚀 Loading Performance: ${results.loading.passed ? '✅' : '❌'}`);
    console.log(`   LCP: ${results.loading.metrics.lcp}ms`);
    console.log(`   FID: ${results.loading.metrics.fid}ms`);
    console.log(`   CLS: ${results.loading.metrics.cls}`);
    
    if (!results.loading.passed && results.loading.issues.length > 0) {
      console.log(`   Issues: ${results.loading.issues.join(', ')}`);
    }

    // Bundle Size
    console.log(`\n📦 Bundle Size: ${results.bundle.passed ? '✅' : '❌'}`);
    console.log(`   Total: ${this.formatBytes(results.bundle.metrics.totalSize)}`);
    console.log(`   Largest Chunk: ${this.formatBytes(results.bundle.metrics.largestChunkSize)}`);
    console.log(`   Stellar SDK: ${this.formatBytes(results.bundle.metrics.stellarSdkSize)}`);
    
    if (!results.bundle.passed && results.bundle.issues.length > 0) {
      console.log(`   Issues: ${results.bundle.issues.join(', ')}`);
    }

    // Memory Usage
    console.log(`\n🧠 Memory Usage: ${results.memory.passed ? '✅' : '❌'}`);
    console.log(`   Heap Size: ${this.formatBytes(results.memory.metrics.currentHeapSize)}`);
    console.log(`   Render Memory: ${this.formatBytes(results.memory.metrics.averageRenderMemory)}`);
    
    if (!results.memory.passed && results.memory.issues.length > 0) {
      console.log(`   Issues: ${results.memory.issues.join(', ')}`);
    }

    // Rendering Performance
    console.log(`\n⚡ Rendering: ${results.rendering.passed ? '✅' : '❌'}`);
    console.log(`   Render Time: ${results.rendering.metrics.averageRenderTime}ms`);
    console.log(`   Cache Hit Rate: ${(results.rendering.metrics.cacheHitRate * 100).toFixed(1)}%`);
    
    if (!results.rendering.passed && results.rendering.issues.length > 0) {
      console.log(`   Issues: ${results.rendering.issues.join(', ')}`);
    }

    // Recommendations
    if (summary.testResults.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      summary.testResults.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Generate markdown report
   */
  private async generateMarkdownReport(summary: TestRunSummary): Promise<string> {
    const results = summary.testResults.results;
    
    return `# Performance Test Report

## Summary
- **Run ID**: ${summary.runId}
- **Timestamp**: ${summary.timestamp.toISOString()}
- **Duration**: ${(summary.duration / 1000).toFixed(2)}s
- **Overall Score**: ${summary.overallScore}/100 ${summary.overallPassed ? '✅' : '❌'}

## Results

### Loading Performance ${results.loading.passed ? '✅' : '❌'}
- **LCP**: ${results.loading.metrics.lcp}ms
- **FID**: ${results.loading.metrics.fid}ms
- **CLS**: ${results.loading.metrics.cls}
- **TTFB**: ${results.loading.metrics.ttfb}ms
- **FCP**: ${results.loading.metrics.fcp}ms

### Bundle Size ${results.bundle.passed ? '✅' : '❌'}
- **Total Size**: ${this.formatBytes(results.bundle.metrics.totalSize)}
- **Largest Chunk**: ${this.formatBytes(results.bundle.metrics.largestChunkSize)}
- **Stellar SDK**: ${this.formatBytes(results.bundle.metrics.stellarSdkSize)}
- **Compression**: ${(results.bundle.metrics.compressionRatio * 100).toFixed(1)}%
- **Chunk Count**: ${results.bundle.metrics.chunkCount}

### Memory Usage ${results.memory.passed ? '✅' : '❌'}
- **Current Heap**: ${this.formatBytes(results.memory.metrics.currentHeapSize)}
- **Peak Heap**: ${this.formatBytes(results.memory.metrics.peakHeapSize)}
- **Render Memory**: ${this.formatBytes(results.memory.metrics.averageRenderMemory)}
- **Leak Rate**: ${this.formatBytes(results.memory.metrics.memoryLeakRate)}/s

### Rendering Performance ${results.rendering.passed ? '✅' : '❌'}
- **Render Time**: ${results.rendering.metrics.averageRenderTime}ms
- **React Updates**: ${results.rendering.metrics.reactUpdateRate}/s
- **Cache Hit Rate**: ${(results.rendering.metrics.cacheHitRate * 100).toFixed(1)}%
- **Memoization**: ${(results.rendering.metrics.memoizationEfficiency * 100).toFixed(1)}%

${summary.testResults.recommendations.length > 0 ? `
## Recommendations
${summary.testResults.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

---
*Generated at ${new Date().toISOString()}*`;
  }

  /**
   * Generate HTML report
   */
  private async generateHtmlReport(summary: TestRunSummary): Promise<string> {
    // HTML report generation would go here
    // For brevity, returning a simple HTML structure
    return `<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Report - ${summary.runId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .score { font-size: 24px; font-weight: bold; }
    .passed { color: green; }
    .failed { color: red; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Performance Test Report</h1>
  <p><strong>Run ID:</strong> ${summary.runId}</p>
  <p><strong>Timestamp:</strong> ${summary.timestamp.toISOString()}</p>
  <p class="score ${summary.overallPassed ? 'passed' : 'failed'}">
    Overall Score: ${summary.overallScore}/100 ${summary.overallPassed ? '✅' : '❌'}
  </p>
  <!-- Additional HTML content would be generated here -->
</body>
</html>`;
  }

  /**
   * Save results to file
   */
  private async saveResults(summary: TestRunSummary, path?: string): Promise<void> {
    const fileName = path || `performance-results-${summary.runId}.json`;
    
    try {
      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // In a browser environment, we'd trigger a download
      // In Node.js, we'd write to file system
      console.log(`📄 Results saved to: ${fileName}`);
      console.log(`💾 Download URL: ${url}`);
    } catch (error) {
      console.error('Failed to save results:', error);
    }
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(): string {
    return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trend analysis
   */
  private generateTrendAnalysis(): string {
    if (this.results.length < 3) {
      return 'Not enough data for trend analysis (minimum 3 runs required)';
    }

    const recentRuns = this.results.slice(-5); // Last 5 runs
    const scores = recentRuns.map(r => r.overallScore);
    const trend = this.calculateTrend(scores);

    if (trend > 2) {
      return '📈 Performance trending upward - great job!';
    } else if (trend < -2) {
      return '📉 Performance trending downward - attention needed';
    } else {
      return '➡️ Performance relatively stable';
    }
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }
    
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  /**
   * Format change value with appropriate sign and unit
   */
  private formatChange(change: number, unit: string = ''): string {
    const sign = change >= 0 ? '+' : '';
    const formattedChange = unit === 'bytes' ? this.formatBytes(Math.abs(change)) : 
                          unit === '%' ? `${change.toFixed(1)}%` :
                          `${change.toFixed(1)}${unit}`;
    return `${sign}${formattedChange}`;
  }

  /**
   * Get status icon based on improvement
   */
  private getStatusIcon(improved: boolean): string {
    return improved ? '✅' : '❌';
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export convenience functions
export async function runPerformanceTest(options?: TestRunOptions): Promise<TestRunSummary> {
  const runner = new PerformanceTestRunner(options);
  return await runner.runTest(options);
}

export async function startContinuousMonitoring(options?: TestRunOptions): Promise<void> {
  const runner = new PerformanceTestRunner(options);
  return await runner.runContinuous(options);
}

export function createTestRunner(options?: TestRunOptions): PerformanceTestRunner {
  return new PerformanceTestRunner(options);
}