

export interface AssetInfo {
  code: string;
  issuer?: string;
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
}


export interface ExtendedAssetInfo extends AssetInfo {
  name: string;
  logo?: string;
  description?: string;
  homepage?: string;
  verified?: boolean;
  decimals?: number;
}


export interface AssetBalance {
  asset: AssetInfo;
  balance: string;
  available: string;
  buyingLiabilities: string;
  sellingLiabilities: string;
  authorized?: boolean;
  authorizedToMaintainLiabilities?: boolean;
  clawbackEnabled?: boolean;
  lastModifiedLedger?: number;
  limit?: string;
  sponsor?: string;
}

export interface NativeBalance {
  balance: string;
  available: string;
  buyingLiabilities: string;
  sellingLiabilities: string;
  minimumBalance: string;
  reserves: string;
  subentryCount: number;
}

export interface MarketData {
  price: number;
  priceUSD: number;
  change24h: number;
  change7d?: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface TokenBalance {
  asset: ExtendedAssetInfo;
  balance: string;
  balanceNumber: number;
  available: string;
  availableNumber: number;
  locked: string;
  lockedNumber: number;
  valueUSD?: number;
  marketData?: MarketData;
  displayDecimals?: number;
}

export interface WalletBalance {
  native: NativeBalance;
  assets: AssetBalance[];
  tokens: TokenBalance[];
  totalValueUSD: number;
  lastUpdated: Date;
  isLoading: boolean;
  hasError: boolean;
}

export interface BalanceSummary {
  totalValueUSD: number;
  xlmBalance: number;
  xlmValueUSD: number;
  assetsCount: number;
  topAssets: TokenBalance[];
  change24hUSD: number;
  change24hPercent: number;
}

export interface BalanceFetchOptions {
  includeMarketData?: boolean;
  includeLocked?: boolean;
  refreshInterval?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface UseWalletBalanceState {
  balance: WalletBalance | null;
  summary: BalanceSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetchTime: Date | null;
}

export interface UseWalletBalanceReturn extends UseWalletBalanceState {
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  getAssetBalance: (assetCode: string, assetIssuer?: string) => TokenBalance | null;
  getFormattedBalance: (assetCode: string, assetIssuer?: string) => string;
  getTotalValue: () => number;
  hasInsufficientBalance: (amount: string, assetCode?: string) => boolean;
}

export interface BalanceChangeEvent {
  type: 'balance_updated' | 'asset_added' | 'asset_removed' | 'market_data_updated';
  publicKey: string;
  previousBalance?: WalletBalance;
  currentBalance: WalletBalance;
  changedAssets?: string[];
  timestamp: Date;
}


export interface BalanceHistoryEntry {
  timestamp: Date;
  balance: WalletBalance;
  totalValueUSD: number;
  change: {
    value: number;
    percentage: number;
  };
}

export interface BalanceAnalytics {
  history: BalanceHistoryEntry[];
  performance: {
    day: number;
    week: number;
    month: number;
    year: number;
  };
  allocation: Array<{
    asset: ExtendedAssetInfo;
    percentage: number;
    valueUSD: number;
  }>;
  trends: {
    growthRate: number;
    volatility: number;
    bestPerformer: string;
    worstPerformer: string;
  };
}


export interface BalanceFormatter {
  formatBalance: (balance: string | number, decimals?: number) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercentage: (value: number) => string;
  formatCompact: (value: number) => string;
}


export interface BalanceValidators {
  isValidBalance: (balance: unknown) => balance is WalletBalance;
  isNativeAsset: (asset: AssetInfo) => boolean;
  hasMinimumBalance: (balance: NativeBalance) => boolean;
  canMakePayment: (balance: WalletBalance, amount: string, asset?: AssetInfo) => boolean;
}