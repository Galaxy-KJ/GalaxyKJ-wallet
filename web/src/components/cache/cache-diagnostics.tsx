"use client";

import { useState, useEffect } from 'react';
import { cacheValidator, type CacheValidationResult } from '@/utils/cache-validation';
import { globalCache, apiCache, balanceCache, type CacheStats } from '@/utils/cache-manager';

interface CacheStatsCollection {
  [key: string]: CacheStats;
}

export function CacheDiagnostics() {
  const [frontendResult, setFrontendResult] = useState<CacheValidationResult | null>(null);
  const [backendResult, setBackendResult] = useState<CacheValidationResult | null>(null);
  const [browserResult, setBrowserResult] = useState<CacheValidationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const [frontend, backend, browser] = await Promise.all([
        cacheValidator.validateFrontendCache(),
        cacheValidator.validateBackendCache(),
        cacheValidator.validateBrowserCache(),
      ]);

      setFrontendResult(frontend);
      setBackendResult(backend);
      setBrowserResult(browser);
    } catch (error) {
      console.error('Cache diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearAllCaches = () => {
    globalCache.clear();
    apiCache.clear();
    balanceCache.clear();
    
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    }
  };

  const getCacheStats = () => {
    return {
      global: globalCache.getStats(),
      api: apiCache.getStats(),
      balance: balanceCache.getStats(),
    };
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cache Diagnostics</h1>
        <div className="flex gap-2">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </button>
          <button
            onClick={clearAllCaches}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All Caches
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CacheResultCard title="Frontend Cache" result={frontendResult} />
        <CacheResultCard title="Backend Cache" result={backendResult} />
        <CacheResultCard title="Browser Cache" result={browserResult} />
      </div>

      <CacheStatsPanel stats={getCacheStats()} />
    </div>
  );
}

function CacheResultCard({ title, result }: { title: string; result: CacheValidationResult | null }) {
  if (!result) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="text-gray-500">Running validation...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${result.isValid ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="text-sm text-gray-600">Hit Rate:</span>
          <span className="ml-2 font-mono">{(result.performance.hitRate * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Avg Response:</span>
          <span className="ml-2 font-mono">{result.performance.avgResponseTime.toFixed(0)}ms</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Cache Size:</span>
          <span className="ml-2 font-mono">{(result.performance.cacheSize / 1024 / 1024).toFixed(1)}MB</span>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-red-600 mb-1">Errors:</h4>
          <ul className="text-xs text-red-600 space-y-1">
            {result.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-yellow-600 mb-1">Warnings:</h4>
          <ul className="text-xs text-yellow-600 space-y-1">
            {result.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CacheStatsPanel({ stats }: { stats: CacheStatsCollection }) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-4">Cache Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([cacheName, stat]: [string, CacheStats]) => (
          <div key={cacheName} className="p-3 bg-gray-50 rounded">
            <h4 className="font-medium capitalize mb-2">{cacheName} Cache</h4>
            <div className="space-y-1 text-sm">
              <div>Size: {stat.size} entries</div>
              <div>Hits: {stat.hits}</div>
              <div>Misses: {stat.misses}</div>
              <div>Hit Rate: {(stat.hitRate * 100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}