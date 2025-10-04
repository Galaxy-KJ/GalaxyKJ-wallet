
import React, { useState, useMemo } from 'react';
import { SimulationResult, ChartDataPoint } from '@/types/simulation';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface SimulationResultsProps {
  result?: SimulationResult | null;
  isSimulating?: boolean;
}

type TabName = 'Performance' | 'Comparison' | 'Risk Analysis' | 'Portfolio';

const TABS: readonly TabName[] = ['Performance', 'Comparison', 'Risk Analysis', 'Portfolio'] as const;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F97316', '#8B5CF6', '#EC4899'] as const;

export const SimulationResults: React.FC<SimulationResultsProps> = ({ 
  result, 
  isSimulating = false 
}) => {
  const [activeTab, setActiveTab] = useState<TabName>('Performance');

  // Memoized chart data generation
  const performanceData = useMemo(() => {
    if (!result?.portfolioValueHistory) return [];
    
    return result.portfolioValueHistory.map((point, index) => ({
      month: `Month ${index + 1}`,
      date: point.date,
      value: point.value,
      return: point.return,
    }));
  }, [result]);

  const comparisonData = useMemo((): ChartDataPoint[] => {
    if (!result) return [];
    
    // Mock benchmark data - replace with actual benchmark when available
    const benchmarkReturn = result.totalReturn * 0.8;
    
    return [
      { name: 'Strategy', value: result.totalReturn },
      { name: 'Benchmark', value: benchmarkReturn },
    ];
  }, [result]);

  const riskData = useMemo((): ChartDataPoint[] => {
    if (!result) return [];
    
    return [
      { name: 'Volatility', value: result.volatility },
      { name: 'Max Drawdown', value: Math.abs(result.maxDrawdown) },
      { name: 'Sharpe Ratio', value: result.sharpeRatio },
    ];
  }, [result]);

  const portfolioData = useMemo((): ChartDataPoint[] => {
    if (!result?.assetAllocation) return [];
    
    return Object.entries(result.assetAllocation).map(([name, value]) => ({
      name,
      value,
      label: `${name}: ${value}%`,
    }));
  }, [result]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number, decimals: number = 2): string => {
    return `${value.toFixed(decimals)}%`;
  };

  const renderTabContent = () => {
    if (isSimulating) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 text-sm">Running simulation...</p>
          </div>
        </div>
      );
    }

    if (!result) {
      return <EmptyState activeTab={activeTab} />;
    }

    switch (activeTab) {
      case 'Performance':
        return <PerformanceTab result={result} performanceData={performanceData} />;
      case 'Comparison':
        return <ComparisonTab result={result} comparisonData={comparisonData} />;
      case 'Risk Analysis':
        return <RiskAnalysisTab result={result} riskData={riskData} />;
      case 'Portfolio':
        return <PortfolioTab result={result} portfolioData={portfolioData} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 p-4 sm:p-6 shadow-lg">
      <nav className="flex flex-wrap justify-center -mb-px space-x-2 sm:space-x-4 md:space-x-8 border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              whitespace-nowrap py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors
              ${activeTab === tab
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-200'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab: React.FC<{
  result: SimulationResult;
  performanceData: any[];
}> = ({ result, performanceData }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <MetricCard
        label="Total Return"
        value={`${result.totalReturn.toFixed(2)}%`}
        trend={result.totalReturn >= 0 ? 'up' : 'down'}
      />
      <MetricCard
        label="Annualized Return"
        value={`${result.annualizedReturn.toFixed(2)}%`}
      />
      <MetricCard
        label="Final Value"
        value={`$${result.finalValue.toLocaleString()}`}
      />
      <MetricCard
        label="Initial Investment"
        value={`$${result.initialValue?.toLocaleString() || 'N/A'}`}
      />
    </div>
    
    <div className="h-64 sm:h-80 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={performanceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="month" 
            stroke="#9CA3AF" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none',
              borderRadius: '0.5rem',
              padding: '12px'
            }}
            labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Portfolio Value"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Comparison Tab Component
const ComparisonTab: React.FC<{
  result: SimulationResult;
  comparisonData: ChartDataPoint[];
}> = ({ result, comparisonData }) => {
  const benchmarkReturn = result.totalReturn * 0.8;
  const outperformance = result.totalReturn - benchmarkReturn;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          label="Strategy Return"
          value={`${result.totalReturn.toFixed(2)}%`}
          trend={result.totalReturn >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="Benchmark Return"
          value={`${benchmarkReturn.toFixed(2)}%`}
        />
        <MetricCard
          label="Outperformance"
          value={`${outperformance.toFixed(2)}%`}
          trend={outperformance >= 0 ? 'up' : 'down'}
        />
      </div>
      
      <div className="h-64 sm:h-80 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none',
                borderRadius: '0.5rem',
                padding: '12px'
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
            />
            <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Risk Analysis Tab Component
const RiskAnalysisTab: React.FC<{
  result: SimulationResult;
  riskData: ChartDataPoint[];
}> = ({ result, riskData }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <MetricCard
        label="Volatility"
        value={`${result.volatility.toFixed(2)}%`}
      />
      <MetricCard
        label="Max Drawdown"
        value={`${result.maxDrawdown.toFixed(2)}%`}
        trend="down"
      />
      <MetricCard
        label="Sharpe Ratio"
        value={result.sharpeRatio.toFixed(2)}
        trend={result.sharpeRatio >= 1 ? 'up' : 'neutral'}
      />
    </div>
    
    <div className="h-64 sm:h-80 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={riskData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none',
              borderRadius: '0.5rem',
              padding: '12px'
            }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Portfolio Tab Component
const PortfolioTab: React.FC<{
  result: SimulationResult;
  portfolioData: ChartDataPoint[];
}> = ({ result, portfolioData }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Object.entries(result.assetAllocation).map(([asset, allocation]) => (
        <MetricCard
          key={asset}
          label={asset}
          value={`${allocation}%`}
        />
      ))}
    </div>
    
    <div className="h-64 sm:h-80 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-4 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={portfolioData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {portfolioData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none',
              borderRadius: '0.5rem',
              padding: '12px'
            }}
            labelStyle={{ color: '#9CA3AF' }}
            formatter={(value: number) => [`${value}%`, 'Allocation']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Empty State Component
const EmptyState: React.FC<{ activeTab: TabName }> = ({ activeTab }) => {
  const getEmptyStateContent = () => {
    switch (activeTab) {
      case 'Performance':
        return {
          metrics: ['Total Return', 'Annualized Return', 'Final Value', 'Initial Investment'],
          chart: 'Performance Chart'
        };
      case 'Comparison':
        return {
          metrics: ['Strategy Return', 'Benchmark Return', 'Outperformance'],
          chart: 'Comparison Chart'
        };
      case 'Risk Analysis':
        return {
          metrics: ['Volatility', 'Max Drawdown', 'Sharpe Ratio'],
          chart: 'Risk Analysis Chart'
        };
      case 'Portfolio':
        return {
          metrics: ['Asset Allocation'],
          chart: 'Portfolio Distribution'
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(content.metrics.length, 4)} gap-3 sm:gap-4`}>
        {content.metrics.map((metric) => (
          <div key={metric} className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
            <h3 className="text-sm text-gray-400">{metric}</h3>
            <p className="text-2xl font-semibold text-gray-600">--</p>
          </div>
        ))}
      </div>
      <div className="h-64 sm:h-80 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 flex flex-col items-center justify-center text-gray-400 p-4">
       <BarChart3 className="w-16 h-16 mb-4 text-gray-600" />

        <p className="text-sm font-medium">{content.chart}</p>
        <p className="text-xs text-gray-500 mt-2">Run a simulation to see results</p>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-200';
    }
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3 sm:p-4">
      <h3 className="text-xs sm:text-sm text-gray-400 mb-1">{label}</h3>
      <p className={`text-xl sm:text-2xl font-semibold ${getTrendColor()}`}>
        {value}
      </p>
    </div>
  );
};