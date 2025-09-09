/**
 * Bundle Size Analysis and Optimization Utilities
 * 
 * This module provides tools for analyzing bundle sizes, tracking chunks,
 * and implementing optimization strategies specific to Galaxy Smart Wallet.
 */

import { BundleOptimizer } from './optimizations';

export interface BundleAnalysisReport {
  totalSize: number;
  compressedSize?: number;
  chunkSizes: Record<string, ChunkInfo>;
  recommendations: OptimizationRecommendation[];
  stellar: StellarBundleInfo;
  ui: UIBundleInfo;
  performance: PerformanceMetrics;
}

export interface ChunkInfo {
  name: string;
  size: number;
  compressedSize?: number;
  modules: ModuleInfo[];
  loadTime: number;
  priority: 'high' | 'medium' | 'low';
  critical: boolean;
}

export interface ModuleInfo {
  name: string;
  size: number;
  path: string;
  duplicated: boolean;
  treeShaken: boolean;
}

export interface OptimizationRecommendation {
  type: 'code-split' | 'lazy-load' | 'tree-shake' | 'externalize' | 'compress';
  severity: 'critical' | 'warning' | 'info';
  module: string;
  currentSize: number;
  potentialSaving: number;
  description: string;
  implementation: string;
}

export interface StellarBundleInfo {
  sdkSize: number;
  utilsSize: number;
  duplicates: string[];
  unusedExports: string[];
  optimizationPotential: number;
}

export interface UIBundleInfo {
  componentSize: number;
  iconsSize: number;
  animationsSize: number;
  lazyLoadableParts: string[];
  memoizableParts: string[];
}

export interface PerformanceMetrics {
  firstLoadJS: number;
  mainBundleSize: number;
  sharedBundleSize: number;
  asyncChunksSize: number;
  cssSize: number;
  fontSize: number;
}

/**
 * Galaxy Smart Wallet specific bundle analyzer
 */
export class GalaxyBundleAnalyzer {
  private static instance: GalaxyBundleAnalyzer;
  private bundleOptimizer: BundleOptimizer;
  private analysisData: Map<string, ChunkInfo> = new Map();

  constructor() {
    this.bundleOptimizer = BundleOptimizer.getInstance();
  }

  static getInstance(): GalaxyBundleAnalyzer {
    if (!GalaxyBundleAnalyzer.instance) {
      GalaxyBundleAnalyzer.instance = new GalaxyBundleAnalyzer();
    }
    return GalaxyBundleAnalyzer.instance;
  }

  /**
   * Analyze bundle composition and generate optimization report
   */
  async analyzeBundles(): Promise<BundleAnalysisReport> {
    const bundleReport = this.bundleOptimizer.getBundleReport();
    const stellar = await this.analyzeStellarDependencies();
    const ui = await this.analyzeUIComponents();
    const performance = await this.measurePerformanceMetrics();
    
    const chunkSizes = await this.analyzeChunks(bundleReport.chunkSizes);
    const recommendations = this.generateOptimizationRecommendations(
      chunkSizes,
      stellar,
      ui
    );

    return {
      totalSize: bundleReport.totalSize,
      chunkSizes,
      recommendations,
      stellar,
      ui,
      performance,
    };
  }

  /**
   * Analyze Stellar SDK usage and optimization opportunities
   */
  private async analyzeStellarDependencies(): Promise<StellarBundleInfo> {
    // In a real implementation, this would analyze the actual bundle
    // For now, we'll provide estimated values based on common patterns
    
    const estimatedSdkSize = 180 * 1024; // ~180KB for Stellar SDK
    const estimatedUtilsSize = 20 * 1024; // ~20KB for utilities
    
    const knownDuplicates = [
      'stellar-base (multiple versions)',
      'tweetnacl (from multiple sources)',
      'buffer polyfill',
    ];

    const unusedExports = await this.detectUnusedStellarExports();
    
    return {
      sdkSize: estimatedSdkSize,
      utilsSize: estimatedUtilsSize,
      duplicates: knownDuplicates,
      unusedExports,
      optimizationPotential: 45 * 1024, // Potential ~45KB savings
    };
  }

  /**
   * Analyze UI components and optimization opportunities
   */
  private async analyzeUIComponents(): Promise<UIBundleInfo> {
    const componentSize = 85 * 1024; // Estimated component bundle size
    const iconsSize = 25 * 1024; // Lucide React icons
    const animationsSize = 15 * 1024; // Animation libraries

    const lazyLoadableParts = [
      'signature-tools',
      'privacy-consent-banner',
      'offline-status-toast',
      'analytics-provider',
      'feature-cards',
    ];

    const memoizableParts = [
      'star-background',
      'error-display',
      'success-banner',
      'validation-messages',
      'loading-states',
    ];

    return {
      componentSize,
      iconsSize,
      animationsSize,
      lazyLoadableParts,
      memoizableParts,
    };
  }

  /**
   * Measure current performance metrics
   */
  private async measurePerformanceMetrics(): Promise<PerformanceMetrics> {
    // This would integrate with actual build output in production
    return {
      firstLoadJS: 125 * 1024, // First load JS size
      mainBundleSize: 95 * 1024, // Main bundle
      sharedBundleSize: 180 * 1024, // Shared chunks
      asyncChunksSize: 65 * 1024, // Async chunks
      cssSize: 35 * 1024, // CSS bundle
      fontSize: 45 * 1024, // Font files
    };
  }

  /**
   * Analyze individual chunks and their composition
   */
  private async analyzeChunks(chunkSizes: Record<string, number>): Promise<Record<string, ChunkInfo>> {
    const result: Record<string, ChunkInfo> = {};

    for (const [chunkName, size] of Object.entries(chunkSizes)) {
      const chunkInfo = await this.analyzeChunk(chunkName, size);
      result[chunkName] = chunkInfo;
      this.analysisData.set(chunkName, chunkInfo);
    }

    return result;
  }

  /**
   * Analyze individual chunk composition
   */
  private async analyzeChunk(chunkName: string, size: number): Promise<ChunkInfo> {
    // Simulate chunk analysis - in production, this would use webpack stats
    const modules = this.getChunkModules(chunkName, size);
    const loadTime = this.estimateLoadTime(size);
    const priority = this.determineChunkPriority(chunkName);
    const critical = this.isChunkCritical(chunkName);

    return {
      name: chunkName,
      size,
      modules,
      loadTime,
      priority,
      critical,
    };
  }

  /**
   * Get modules contained in a chunk
   */
  private getChunkModules(chunkName: string, totalSize: number): ModuleInfo[] {
    // Simulate module analysis based on chunk name
    const modules: ModuleInfo[] = [];

    switch (chunkName) {
      case 'stellar-sdk':
        modules.push(
          { name: 'stellar-sdk', size: totalSize * 0.8, path: 'node_modules/@stellar/stellar-sdk', duplicated: false, treeShaken: true },
          { name: 'stellar-base', size: totalSize * 0.15, path: 'node_modules/stellar-base', duplicated: true, treeShaken: false },
          { name: 'tweetnacl', size: totalSize * 0.05, path: 'node_modules/tweetnacl', duplicated: true, treeShaken: true },
        );
        break;
      case 'ui-libs':
        modules.push(
          { name: 'lucide-react', size: totalSize * 0.4, path: 'node_modules/lucide-react', duplicated: false, treeShaken: true },
          { name: '@radix-ui/react-*', size: totalSize * 0.5, path: 'node_modules/@radix-ui', duplicated: false, treeShaken: false },
          { name: 'framer-motion', size: totalSize * 0.1, path: 'node_modules/framer-motion', duplicated: false, treeShaken: true },
        );
        break;
      case 'vendor':
        modules.push(
          { name: 'react', size: totalSize * 0.3, path: 'node_modules/react', duplicated: false, treeShaken: true },
          { name: 'react-dom', size: totalSize * 0.3, path: 'node_modules/react-dom', duplicated: false, treeShaken: true },
          { name: 'next', size: totalSize * 0.4, path: 'node_modules/next', duplicated: false, treeShaken: true },
        );
        break;
      default:
        modules.push(
          { name: chunkName, size: totalSize, path: `src/${chunkName}`, duplicated: false, treeShaken: false }
        );
    }

    return modules;
  }

  /**
   * Estimate load time based on chunk size
   */
  private estimateLoadTime(size: number): number {
    // Estimate based on average connection speed (assuming 4G - 10 Mbps)
    const bitsPerSecond = 10 * 1024 * 1024; // 10 Mbps
    const bytesPerSecond = bitsPerSecond / 8;
    const parseTime = size * 0.001; // Assume 1ms per KB for parsing
    
    return (size / bytesPerSecond) * 1000 + parseTime; // Return in milliseconds
  }

  /**
   * Determine chunk loading priority
   */
  private determineChunkPriority(chunkName: string): 'high' | 'medium' | 'low' {
    const highPriorityChunks = ['main', 'vendor', 'common'];
    const mediumPriorityChunks = ['stellar-sdk', 'ui-libs'];
    
    if (highPriorityChunks.includes(chunkName)) return 'high';
    if (mediumPriorityChunks.includes(chunkName)) return 'medium';
    return 'low';
  }

  /**
   * Check if chunk is critical for initial render
   */
  private isChunkCritical(chunkName: string): boolean {
    const criticalChunks = ['main', 'vendor', 'common'];
    return criticalChunks.includes(chunkName);
  }

  /**
   * Detect unused Stellar SDK exports
   */
  private async detectUnusedStellarExports(): Promise<string[]> {
    // This would analyze actual usage in a real implementation
    const potentiallyUnused = [
      'FederationServer',
      'StellarTomlResolver',
      'Config',
      'TimeoutInfinite',
      'BASE_FEE',
      'Networks',
    ];

    return potentiallyUnused;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    chunks: Record<string, ChunkInfo>,
    stellar: StellarBundleInfo,
    ui: UIBundleInfo
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for oversized chunks
    for (const [chunkName, chunkInfo] of Object.entries(chunks)) {
      if (chunkInfo.size > 250 * 1024 && !chunkInfo.critical) {
        recommendations.push({
          type: 'code-split',
          severity: 'critical',
          module: chunkName,
          currentSize: chunkInfo.size,
          potentialSaving: chunkInfo.size * 0.4,
          description: `Chunk '${chunkName}' is larger than 250KB and should be split`,
          implementation: `Split ${chunkName} into smaller chunks using dynamic imports`,
        });
      }
    }

    // Stellar SDK optimizations
    if (stellar.unusedExports.length > 0) {
      recommendations.push({
        type: 'tree-shake',
        severity: 'warning',
        module: 'stellar-sdk',
        currentSize: stellar.sdkSize,
        potentialSaving: 30 * 1024,
        description: 'Unused Stellar SDK exports detected',
        implementation: 'Use specific imports instead of importing entire SDK',
      });
    }

    // UI component optimizations
    ui.lazyLoadableParts.forEach((component) => {
      recommendations.push({
        type: 'lazy-load',
        severity: 'info',
        module: component,
        currentSize: 15 * 1024, // Estimated
        potentialSaving: 15 * 1024,
        description: `Component '${component}' can be lazy loaded`,
        implementation: `Use React.lazy() and Suspense for ${component}`,
      });
    });

    // Duplicate detection
    stellar.duplicates.forEach((duplicate) => {
      recommendations.push({
        type: 'externalize',
        severity: 'warning',
        module: duplicate,
        currentSize: 10 * 1024, // Estimated
        potentialSaving: 5 * 1024,
        description: `Duplicate dependency: ${duplicate}`,
        implementation: `Deduplicate ${duplicate} using webpack resolve.alias`,
      });
    });

    return recommendations;
  }

  /**
   * Generate optimization implementation guide
   */
  generateImplementationGuide(recommendations: OptimizationRecommendation[]): string {
    let guide = '# Bundle Optimization Implementation Guide\n\n';

    const criticalRecommendations = recommendations.filter(r => r.severity === 'critical');
    const warningRecommendations = recommendations.filter(r => r.severity === 'warning');
    const infoRecommendations = recommendations.filter(r => r.severity === 'info');

    if (criticalRecommendations.length > 0) {
      guide += '## 🔴 Critical Optimizations\n\n';
      criticalRecommendations.forEach((rec, index) => {
        guide += `### ${index + 1}. ${rec.description}\n`;
        guide += `**Module:** ${rec.module}\n`;
        guide += `**Current Size:** ${(rec.currentSize / 1024).toFixed(1)}KB\n`;
        guide += `**Potential Saving:** ${(rec.potentialSaving / 1024).toFixed(1)}KB\n`;
        guide += `**Implementation:** ${rec.implementation}\n\n`;
      });
    }

    if (warningRecommendations.length > 0) {
      guide += '## 🟡 Warning Level Optimizations\n\n';
      warningRecommendations.forEach((rec, index) => {
        guide += `### ${index + 1}. ${rec.description}\n`;
        guide += `**Implementation:** ${rec.implementation}\n\n`;
      });
    }

    if (infoRecommendations.length > 0) {
      guide += '## 🟢 Optimization Opportunities\n\n';
      infoRecommendations.forEach((rec, index) => {
        guide += `- ${rec.description}: ${rec.implementation}\n`;
      });
    }

    return guide;
  }

  /**
   * Track bundle size over time
   */
  trackBundleSizeHistory(report: BundleAnalysisReport): void {
    const timestamp = Date.now();
    const historyKey = 'bundle_size_history';
    
    try {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.push({
        timestamp,
        totalSize: report.totalSize,
        stellar: report.stellar.sdkSize,
        ui: report.ui.componentSize,
        performance: report.performance,
      });

      // Keep last 30 entries
      if (history.length > 30) {
        history.splice(0, history.length - 30);
      }

      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save bundle size history:', error);
    }
  }

  /**
   * Get bundle size trends
   */
  getBundleSizeTrends(): {
    totalSize: number[];
    timestamps: number[];
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    try {
      const history = JSON.parse(localStorage.getItem('bundle_size_history') || '[]');
      
      if (history.length < 2) {
        return { totalSize: [], timestamps: [], trend: 'stable' };
      }

      const totalSize = history.map((entry: any) => entry.totalSize);
      const timestamps = history.map((entry: any) => entry.timestamp);
      
      // Calculate trend
      const recent = totalSize.slice(-5); // Last 5 measurements
      const average = recent.reduce((sum, size) => sum + size, 0) / recent.length;
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, size) => sum + size, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, size) => sum + size, 0) / secondHalf.length;
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      const threshold = average * 0.05; // 5% threshold
      
      if (secondAvg - firstAvg > threshold) {
        trend = 'increasing';
      } else if (firstAvg - secondAvg > threshold) {
        trend = 'decreasing';
      }

      return { totalSize, timestamps, trend };
    } catch (error) {
      console.warn('Failed to get bundle size trends:', error);
      return { totalSize: [], timestamps: [], trend: 'stable' };
    }
  }
}

// Utility functions
export function formatBundleSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function calculateCompressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0;
  return ((original - compressed) / original) * 100;
}

export function getBundleHealthScore(report: BundleAnalysisReport): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: string[];
} {
  let score = 100;
  const issues: string[] = [];

  // Total size penalty
  if (report.totalSize > 500 * 1024) {
    score -= 20;
    issues.push('Total bundle size exceeds 500KB');
  }

  // Critical chunk penalty
  const criticalRecommendations = report.recommendations.filter(r => r.severity === 'critical');
  score -= criticalRecommendations.length * 15;
  
  if (criticalRecommendations.length > 0) {
    issues.push(`${criticalRecommendations.length} critical optimization issues`);
  }

  // Performance penalty
  if (report.performance.firstLoadJS > 150 * 1024) {
    score -= 10;
    issues.push('First load JS exceeds 150KB');
  }

  // Stellar SDK optimization
  if (report.stellar.unusedExports.length > 3) {
    score -= 10;
    issues.push('Multiple unused Stellar SDK exports');
  }

  score = Math.max(0, score);

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade, issues };
}

export default GalaxyBundleAnalyzer;