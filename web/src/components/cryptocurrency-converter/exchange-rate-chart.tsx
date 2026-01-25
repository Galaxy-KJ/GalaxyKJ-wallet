"use client"
import { AreaChart, Area, Tooltip, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"
import { Square } from "lucide-react"
import type { TooltipProps } from "recharts"

const generateChartData = () => {
  const data = []
  const now = new Date()

  for (let i = 7; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const baseValue = 0.0000055 + i * 0.0000001
    const randomFactor = 1 + (Math.random() - 0.5) * 0.1
    const value = baseValue * randomFactor

    data.push({
      date: `Mar ${date.getDate()}`,
      value: value,
    })
  }

  return data
}

interface ExchangeRateChartProps {
  fromSymbol: string
  toSymbol: string
}

export default function ExchangeRateChart({ fromSymbol, toSymbol }: ExchangeRateChartProps) {
  const chartData = generateChartData()

  const formatYAxis = (value: number) => {
    if (value === 0) return '0';
    
    if (value < 0.001) {
      return value.toExponential(1);
    }
    
    return value.toFixed(6);
  };

  const CustomTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload } = props;
    
    if (active && payload && payload.length > 0) {
      const item = payload[0];
      const date = item?.payload?.date;
      const value = typeof item?.value === 'number' ? item.value.toFixed(8) : '0';
      
      return (
        <div className="bg-gray-800/50 border border-gray-700 p-2 rounded-md text-sm">
          <p className="text-gray-300">{date}</p>
          <p className="font-medium text-purple-400">
            1 {fromSymbol} = {value} {toSymbol}
          </p>
        </div>
      );
    }
    return null;
  };

  const getYDomain = () => {
    if (!chartData || chartData.length === 0) return [0, 0];
    
    const values = chartData.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const padding = (max - min) * 0.15;
    return [min - padding, max + padding];
  };

  return (
    <div className="w-full h-[270px]">
      <div className="mb-2 text-sm text-white text-center flex items-center justify-center gap-1.5">
        <Square className="h-4 w-4 text-[#8b5cf6] fill-[#8b5cf6]" />
        {fromSymbol} to {toSymbol} Rate
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 20, left: 0, bottom: 0 }}
            style={{ backgroundColor: "transparent" }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1a1f35" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis
              stroke="#6b7280"
              tickFormatter={formatYAxis}
              domain={getYDomain()}
              tickCount={5}
              tickLine={false}
              axisLine={false}
              dx={-5}
              width={70}
              orientation="left"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={{ fill: "#ffffff", r: 4, strokeWidth: 2, stroke: "#8b5cf6" }}
              activeDot={{ fill: "#ffffff", r: 6, stroke: "#8b5cf6", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
