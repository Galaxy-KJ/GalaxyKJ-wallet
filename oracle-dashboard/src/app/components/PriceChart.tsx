'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface ChartDataPoint {
  timestamp: string;
  time: string;
  price: number;
  symbol: string;
  source?: string;
}

interface PriceChartProps {
  data: ChartDataPoint[];
  symbol: string;
  height?: number;
}

export function PriceChart({ data, symbol, height = 300 }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-transparent rounded-lg p-6" style={{ height }}>
        <div className="flex items-center justify-center h-full text-slate-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Syncing {symbol} feed...</p>
          </div>
        </div>
      </div>
    );
  }

  // Find min and max for Y-axis
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // Dynamic padding based on price range
  const range = maxPrice - minPrice;
  const padding = range === 0 ? minPrice * 0.001 : range * 0.2;

  // Color based on price direction
  const firstPrice = data[0]?.price;
  const lastPrice = data[data.length - 1]?.price;
  const isPositive = (lastPrice ?? 0) >= (firstPrice ?? 0);
  const accentColor = isPositive ? '#10b981' : '#ef4444';

  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(6)}`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Live Feed
            </h3>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {symbol} / <span className="text-slate-500 text-sm">USD</span>
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-bold text-white">
            {formatPrice(lastPrice)}
          </p>
          <p className={`text-[10px] font-bold ${isPositive ? 'text-green-400' : 'text-red-400'} mt-0.5`}>
            {isPositive ? '+' : ''}{((((lastPrice ?? 0) - (firstPrice ?? 0)) / (firstPrice ?? 1)) * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={(val) => val >= 1000 ? `$${(val/1000).toFixed(1)}k` : `$${val.toFixed(2)}`}
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f8fafc',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
              }}
              itemStyle={{ color: accentColor, fontWeight: 'bold' }}
              formatter={(value: any) => [formatPrice(value), 'Price']}
              labelFormatter={(label: any) => `Time: ${label}`}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accentColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={800}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'High', value: formatPrice(maxPrice), color: 'text-white' },
          { label: 'Low', value: formatPrice(minPrice), color: 'text-white' },
          { label: 'Avg Vol', value: '$45.2M', color: 'text-slate-500' },
          { label: 'Health', value: '100%', color: 'text-green-500' }
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.01] border border-white/[0.03] rounded-lg p-2">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{item.label}</p>
            <p className={`text-xs font-mono font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}