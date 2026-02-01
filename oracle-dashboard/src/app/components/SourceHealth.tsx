'use client';

interface SourceHealthProps {
  health: Map<string, boolean>;
}

export function SourceHealth({ health }: SourceHealthProps) {
  const healthy = Array.from(health.entries()).filter(([_, isHealthy]) => isHealthy);
  const unhealthy = Array.from(health.entries()).filter(([_, isHealthy]) => !isHealthy);
  const totalSources = health.size;

  const healthPercentage = totalSources > 0 ? Math.round((healthy.length / totalSources) * 100) : 0;
  const healthColor = healthPercentage >= 75 ? 'text-green-600' : healthPercentage >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-100 dark:border-slate-700">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Oracle Sources
          </h2>
          <div className={`text-sm font-bold ${healthColor}`}>
            {healthPercentage}% Healthy
          </div>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              healthPercentage >= 75
                ? 'bg-green-600'
                : healthPercentage >= 50
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${healthPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        {healthy.length > 0 && (
          <>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Healthy ({healthy.length})
            </div>
            {healthy.map(([source, _]) => (
              <div
                key={source}
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <span className="text-2xl">🟢</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white capitalize">
                    {source.replace(/-/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Connected</p>
                </div>
                <span className="text-xs font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                  Ready
                </span>
              </div>
            ))}
          </>
        )}

        {unhealthy.length > 0 && (
          <>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mt-4">
              Unhealthy ({unhealthy.length})
            </div>
            {unhealthy.map(([source, _]) => (
              <div
                key={source}
                className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <span className="text-2xl">🔴</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white capitalize">
                    {source.replace(/-/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Connection failed</p>
                </div>
                <span className="text-xs font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">
                  Down
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-white">{healthy.length}</span> healthy •{' '}
        <span className="font-semibold text-slate-900 dark:text-white">{unhealthy.length}</span> unhealthy •{' '}
        <span className="font-semibold text-slate-900 dark:text-white">{totalSources}</span> total
      </div>
    </div>
  );
}