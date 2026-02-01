'use client';

export interface SourceInfo {
  name: string;
  healthy: boolean;
  weight: number;
  lastUpdate?: Date;
  pricesContributed?: number;
  accuracy?: number;
}

interface SourceListProps {
  sources: SourceInfo[];
  onSourceToggle?: (sourceName: string) => void;
}

export function SourceList({ sources, onSourceToggle }: SourceListProps) {
  const healthySources = sources.filter(s => s.healthy);
  const unhealthySources = sources.filter(s => !s.healthy);

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    if (accuracy >= 0.95) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (accuracy >= 0.85) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  };

  const renderSourceRow = (source: SourceInfo) => (
    <div
      key={source.name}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
        source.healthy
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
      } hover:shadow-md cursor-pointer`}
      onClick={() => onSourceToggle?.(source.name)}
    >
      {/* Status Indicator */}
      <div className="flex-shrink-0">
        <span className="text-2xl">{source.healthy ? '🟢' : '🔴'}</span>
      </div>

      {/* Source Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
            {source.name.replace(/-/g, ' ')}
          </h3>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {(source.weight * 100).toFixed(0)}% weight
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Last Update</p>
            <p className="text-slate-700 dark:text-slate-300">{formatDate(source.lastUpdate)}</p>
          </div>
          {source.pricesContributed !== undefined && (
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Prices Contributed</p>
              <p className="text-slate-700 dark:text-slate-300">{source.pricesContributed}</p>
            </div>
          )}
          {source.accuracy !== undefined && (
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Accuracy</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getAccuracyColor(source.accuracy)}`}>
                {(source.accuracy * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          source.healthy
            ? 'bg-green-200 text-green-700 dark:bg-green-900/50 dark:text-green-300'
            : 'bg-red-200 text-red-700 dark:bg-red-900/50 dark:text-red-300'
        }`}>
          {source.healthy ? 'Active' : 'Offline'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-100 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        Oracle Sources
      </h2>

      <div className="space-y-4">
        {/* Healthy Sources */}
        {healthySources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-3">
              ✓ Active Sources ({healthySources.length})
            </h3>
            <div className="space-y-2">
              {healthySources.map(renderSourceRow)}
            </div>
          </div>
        )}

        {/* Unhealthy Sources */}
        {unhealthySources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-3 mt-6">
              ✗ Offline Sources ({unhealthySources.length})
            </h3>
            <div className="space-y-2">
              {unhealthySources.map(renderSourceRow)}
            </div>
          </div>
        )}

        {sources.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <p>No oracle sources configured</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Sources</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{sources.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{healthySources.length}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Offline</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{unhealthySources.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}