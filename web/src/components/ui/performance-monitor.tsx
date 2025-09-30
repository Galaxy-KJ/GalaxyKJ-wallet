/**
 * Performance Monitoring Component
 *
 * Real-time performance monitoring UI for Galaxy Smart Wallet
 * Shows bundle sizes, load times, and optimization recommendations
 */

"use client";

import { useEffect, useState, memo } from "react";
import {
  PerformanceMonitor,
  type PerformanceMetrics,
} from "@/lib/performance/optimizations";
import {
  GalaxyBundleAnalyzer,
  formatBundleSize,
  getBundleHealthScore,
} from "@/lib/performance/bundle-analyzer";
import type { BundleAnalysisReport } from "@/lib/performance/bundle-analyzer";
import {
  Activity,
  AlertTriangle,
  Clock,
  Package,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
} from "lucide-react";

interface PerformanceMonitorProps {
  show?: boolean;
  onClose?: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

interface MetricsDisplayProps {
  metrics: Record<string, PerformanceMetrics>;
  bundleReport?: BundleAnalysisReport;
}

const MetricsCard = memo(
  ({
    title,
    value,
    unit,
    trend,
    status,
    icon: Icon,
  }: {
    title: string;
    value: number;
    unit: string;
    trend?: "up" | "down" | "stable";
    status?: "good" | "warning" | "critical";
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }) => {
    const statusColors = {
      good: "text-green-400 bg-green-900/20 border-green-700",
      warning: "text-yellow-400 bg-yellow-900/20 border-yellow-700",
      critical: "text-red-400 bg-red-900/20 border-red-700",
    };

    const trendIcons = {
      up: TrendingUp,
      down: TrendingDown,
      stable: Minus,
    };

    const TrendIcon = trend ? trendIcons[trend] : null;

    return (
      <div
        className={`rounded-lg border p-3 backdrop-blur-sm ${
          status
            ? statusColors[status]
            : "text-gray-300 bg-gray-900/50 border-gray-700"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={16} />
            <span className="text-xs font-medium">{title}</span>
          </div>
          {TrendIcon && <TrendIcon size={12} />}
        </div>
        <div className="text-lg font-bold">
          {typeof value === "number" ? value.toFixed(1) : value}
          {unit}
        </div>
      </div>
    );
  }
);
MetricsCard.displayName = "MetricsCard";

const BundleHealthIndicator = memo(
  ({ report }: { report?: BundleAnalysisReport }) => {
    if (!report) return null;

    const health = getBundleHealthScore(report);

    const gradeColors = {
      A: "text-green-400",
      B: "text-blue-400",
      C: "text-yellow-400",
      D: "text-orange-400",
      F: "text-red-400",
    };

    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Bundle Health</h4>
          <div className={`text-xl font-bold ${gradeColors[health.grade]}`}>
            {health.grade}
          </div>
        </div>
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  health.score >= 80
                    ? "bg-green-500"
                    : health.score >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${health.score}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{health.score}/100</span>
          </div>
        </div>
        {health.issues.length > 0 && (
          <div className="space-y-1">
            {health.issues.slice(0, 2).map((issue, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-gray-400"
              >
                <AlertTriangle size={12} />
                <span>{issue}</span>
              </div>
            ))}
            {health.issues.length > 2 && (
              <div className="text-xs text-gray-500">
                +{health.issues.length - 2} more issues
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
BundleHealthIndicator.displayName = "BundleHealthIndicator";

const OptimizationRecommendations = memo(
  ({ report }: { report?: BundleAnalysisReport }) => {
    if (!report || report.recommendations.length === 0) return null;

    const criticalRecs = report.recommendations
      .filter((r) => r.severity === "critical")
      .slice(0, 3);

    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3 backdrop-blur-sm">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Top Optimizations
        </h4>
        <div className="space-y-2">
          {criticalRecs.map((rec, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              <AlertTriangle size={12} className="text-red-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-gray-300">{rec.description}</div>
                <div className="text-gray-500">
                  Save: {formatBundleSize(rec.potentialSaving)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
OptimizationRecommendations.displayName = "OptimizationRecommendations";

const MetricsDisplay = memo(({ metrics }: MetricsDisplayProps) => {
  // Calculate aggregate metrics
  const totalRenderTime = Object.values(metrics).reduce(
    (sum, m) => sum + m.renderTime,
    0
  );
  const totalLoadTime = Object.values(metrics).reduce(
    (sum, m) => sum + m.loadTime,
    0
  );
  const avgMemoryUsage =
    Object.values(metrics).reduce((sum, m) => sum + m.memoryUsage, 0) /
      Object.keys(metrics).length || 0;
  const avgCacheHitRate =
    Object.values(metrics).reduce((sum, m) => sum + m.cacheHitRate, 0) /
      Object.keys(metrics).length || 0;

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <MetricsCard
        title="Load Time"
        value={totalLoadTime}
        unit="ms"
        status={
          totalLoadTime < 1000
            ? "good"
            : totalLoadTime < 2000
            ? "warning"
            : "critical"
        }
        icon={Clock}
      />
      <MetricsCard
        title="Render Time"
        value={totalRenderTime}
        unit="ms"
        status={
          totalRenderTime < 16
            ? "good"
            : totalRenderTime < 32
            ? "warning"
            : "critical"
        }
        icon={Zap}
      />
      <MetricsCard
        title="Memory"
        value={avgMemoryUsage / (1024 * 1024)}
        unit="MB"
        status={
          avgMemoryUsage < 50 * 1024 * 1024
            ? "good"
            : avgMemoryUsage < 100 * 1024 * 1024
            ? "warning"
            : "critical"
        }
        icon={Activity}
      />
      <MetricsCard
        title="Cache Hit"
        value={avgCacheHitRate * 100}
        unit="%"
        status={
          avgCacheHitRate > 0.8
            ? "good"
            : avgCacheHitRate > 0.5
            ? "warning"
            : "critical"
        }
        icon={Package}
      />
    </div>
  );
});
MetricsDisplay.displayName = "MetricsDisplay";

export const PerformanceMonitorUI = memo(function PerformanceMonitorUI({
  show = false,
  onClose,
  position = "bottom-right",
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Record<string, PerformanceMetrics>>(
    {}
  );
  const [bundleReport, setBundleReport] = useState<BundleAnalysisReport>();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const performanceMonitor = PerformanceMonitor.getInstance();
  const bundleAnalyzer = GalaxyBundleAnalyzer.getInstance();

  useEffect(() => {
    if (!show) return;

    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    const updateBundleReport = async () => {
      setIsLoading(true);
      try {
        const report = await bundleAnalyzer.analyzeBundles();
        setBundleReport(report);
        bundleAnalyzer.trackBundleSizeHistory(report);
      } catch (error) {
        console.error("Failed to update bundle report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    updateMetrics();
    updateBundleReport();

    // Set up intervals
    const metricsInterval = setInterval(updateMetrics, 1000);
    const bundleInterval = setInterval(updateBundleReport, 30000); // Every 30 seconds

    return () => {
      clearInterval(metricsInterval);
      clearInterval(bundleInterval);
    };
  }, [show, bundleAnalyzer, performanceMonitor]);

  if (!show) return null;

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  return (
    <div
      className={`fixed ${
        positionClasses[position]
      } z-50 max-w-sm transition-all duration-300 ${
        isMinimized ? "w-12 h-12" : "w-80"
      }`}
    >
      <div className="rounded-lg border border-gray-700 bg-gray-900/95 backdrop-blur-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-purple-400" />
            {!isMinimized && (
              <span className="text-sm font-medium text-gray-300">
                Performance
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
            >
              <Minus size={12} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <>
                {/* Real-time metrics */}
                <MetricsDisplay metrics={metrics} bundleReport={bundleReport} />

                {/* Bundle health */}
                <div className="grid grid-cols-1 gap-2 mb-4">
                  <BundleHealthIndicator report={bundleReport} />
                </div>

                {/* Optimization recommendations */}
                <OptimizationRecommendations report={bundleReport} />

                {/* Bundle size summary */}
                {bundleReport && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Total Bundle</span>
                      <span className="font-mono">
                        {formatBundleSize(bundleReport.totalSize)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Stellar SDK</span>
                      <span className="font-mono">
                        {formatBundleSize(bundleReport.stellar.sdkSize)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// Hook for easy integration
export function usePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, PerformanceMetrics>>(
    {}
  );

  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();

    const updateMetrics = () => {
      setMetrics(monitor.getMetrics());
    };

    const interval = setInterval(updateMetrics, 5000); // Every 5 seconds
    updateMetrics(); // Initial load

    return () => clearInterval(interval);
  }, []);

  const toggle = () => setIsVisible(!isVisible);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return {
    isVisible,
    metrics,
    toggle,
    show,
    hide,
    PerformanceMonitor: (props: Omit<PerformanceMonitorProps, "show">) => (
      <PerformanceMonitorUI {...props} show={isVisible} onClose={hide} />
    ),
  };
}

export default PerformanceMonitorUI;
