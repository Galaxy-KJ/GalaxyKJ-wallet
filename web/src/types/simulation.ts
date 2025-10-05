

/**
 * Parameters for configuring a trading strategy simulation
 */
export interface SimulationParameters {
  asset: string;
  marketScenario: string;
  strategy: string;
  initialInvestment: number;
  timeHorizon: number;
  riskTolerance: number;
  reinvestDividends: boolean;
  assetAllocation: Record<string, number>;
}

/**
 * Time series data point for portfolio value tracking
 */
export interface TimeSeriesDataPoint {
  timestamp: number;
  date: string;
  value: number;
  return: number;
}

/**
 * Risk metrics for portfolio analysis
 */
export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  valueAtRisk: number;
  conditionalValueAtRisk: number;
}

/**
 * Performance metrics for strategy evaluation
 */
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  bestMonth: number;
  worstMonth: number;
  averageReturn: number;
  winRate: number;
  profitFactor: number;
}

/**
 * Asset allocation breakdown
 */
export interface AssetAllocationItem {
  asset: string;
  allocation: number;
  value: number;
  return: number;
}

/**
 * Main simulation result interface with comprehensive data
 */
export interface SimulationResult {
  // Final portfolio metrics
  finalValue: number;
  initialValue: number;
  totalContributions: number;
  
  // Performance metrics
  totalReturn: number;
  annualizedReturn: number;
  
  // Risk metrics
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  
  // Time series data
  monthlyReturns: number[];
  portfolioValueHistory: TimeSeriesDataPoint[];
  
  // Asset allocation
  assetAllocation: Record<string, number>;
  assetAllocationDetails: AssetAllocationItem[];
  
  // Additional metrics
  winningMonths: number;
  losingMonths: number;
  
  // Metadata
  simulationDate: string;
  parameters: SimulationParameters;
}

/**
 * Deprecated: Use SimulationResult instead
 * @deprecated - Kept for backwards compatibility
 */
export interface SimulationResults {
  finalPortfolioValue: number;
  totalContributions: number;
  totalReturns: number;
  annualizedReturn: number;
  maxDrawdown: number;
  monthlyReturns: number[];
  portfolioValueHistory: number[];
}

/**
 * Strategy insights and recommendations
 */
export interface StrategyInsights {
  riskMetrics: RiskMetrics;
  performanceMetrics: PerformanceMetrics;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  suitableFor: string[];
}

/**
 * Comparison data for benchmarking
 */
export interface ComparisonData {
  strategyReturn: number;
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  outperformance: number;
}

/**
 * Chart data point for visualization
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
}