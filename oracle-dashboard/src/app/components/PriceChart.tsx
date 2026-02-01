'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-100 dark:border-slate-700" style={{ height }}>
        <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
          <p>No chart data available for {symbol}</p>
        </div>
      </div>
    );
  }

  // Find min and max for Y-axis
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  // Color based on price direction
  const firstPrice = data[0]?.price;
  const lastPrice = data[data.length - 1]?.price;
  const isPositive = (lastPrice ?? 0) >= (firstPrice ?? 0);
  const lineColor = isPositive ? '#16a34a' : '#dc2626';
  const fillColor = isPositive ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)';

  const formatPrice = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-100 dark:border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {symbol} Price History
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Last {data.length} updates
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#64748b', fontSize: 12 }}
            className="dark:text-slate-400"
          />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={formatPrice}
            tick={{ fill: '#64748b', fontSize: 12 }}
            className="dark:text-slate-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            formatter={(value: any) => [formatPrice(value), symbol]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            fill={fillColor}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
            strokeWidth={2}
            name={`${symbol} Price`}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase">High</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {formatPrice(maxPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase">Low</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {formatPrice(minPrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase">Current</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {formatPrice(lastPrice ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase">Change</p>
          <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{((((lastPrice ?? 0) - (firstPrice ?? 0)) / (firstPrice ?? 1)) * 100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}