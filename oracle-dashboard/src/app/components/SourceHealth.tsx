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
    <div className="glass p-4 rounded-xl border border-white/5 bg-white/[0.02]">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Oracle Health
          </h2>
          <div className={`text-[10px] font-black ${healthPercentage >= 75 ? 'text-green-500' : 'text-yellow-500'}`}>
            {healthPercentage}%
          </div>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all ${
              healthPercentage >= 75
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${healthPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2">
        {healthy.map(([source, _]) => (
          <div
            key={source}
            className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white truncate capitalize">
                {source.replace(/-/g, ' ')}
              </p>
            </div>
            <span className="text-[8px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded uppercase">
              Ready
            </span>
          </div>
        ))}
        
        {unhealthy.map(([source, _]) => (
          <div
            key={source}
            className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.5)]"></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white truncate capitalize">
                {source.replace(/-/g, ' ')}
              </p>
            </div>
            <span className="text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">
              Down
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}