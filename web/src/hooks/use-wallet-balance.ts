import { useEffect, useState, useCallback, useRef } from "react";
import * as StellarSDK from "@stellar/stellar-sdk";
import { useWalletStore } from "@/store/wallet-store";
import {
  WalletBalance,
  BalanceSummary,
  UseWalletBalanceReturn,
  BalanceFetchOptions,
  TokenBalance,
  AssetBalance,
  NativeBalance,
  AssetInfo,
  ExtendedAssetInfo,
  MarketData,
} from "@/types/wallet-balance";

const DEFAULT_OPTIONS: Required<BalanceFetchOptions> = {
  includeMarketData: true,
  includeLocked: true,
  refreshInterval: 30000,
  maxRetries: 3,
  timeout: 10000,
};


// Use unknown types to avoid Stellar SDK version conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericBalance = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericAccount = Record<string, any>;
const KNOWN_ASSETS: Record<string, Partial<ExtendedAssetInfo>> = {
  XLM: {
    name: "Stellar Lumens",
    logo: "⭐",
    description: "Native Stellar network token",
    verified: true,
    decimals: 7,
  },
  USDC: {
    name: "USD Coin",
    logo: "💵",
    description: "USD-backed stablecoin",
    verified: true,
    decimals: 6,
  },
  USDT: {
    name: "Tether USD",
    logo: "₮",
    description: "USD-backed stablecoin",
    verified: true,
    decimals: 6,
  },
};

export function useWalletBalance(options: BalanceFetchOptions = {}): UseWalletBalanceReturn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  const publicKey = useWalletStore((state) => state.publicKey);
  const networkConfig = useWalletStore((state) => state.networkConfig);
  const retryCount = useRef(0);
  const refreshTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const createAssetInfo = useCallback((stellarBalance: GenericBalance): AssetInfo => {
    if (stellarBalance.asset_type === "native") {
      return {
        code: "XLM",
        type: "native",
      };
    }
    
    
    return {
      
      code: (stellarBalance as any).asset_code,
      
      issuer: (stellarBalance as any).asset_issuer,
      
      type: (stellarBalance as any).asset_type,
    };
  }, []);

  const createExtendedAssetInfo = (assetInfo: AssetInfo): ExtendedAssetInfo => {
    const knownAsset = KNOWN_ASSETS[assetInfo.code] || {};
    
    return {
      ...assetInfo,
      name: knownAsset.name || assetInfo.code,
      logo: knownAsset.logo,
      description: knownAsset.description,
      verified: knownAsset.verified || false,
      decimals: knownAsset.decimals || 7,
    };
  };

  const calculateAvailableBalance = (balance: string, buyingLiabilities: string, sellingLiabilities: string): string => {
    const total = parseFloat(balance);
    const buying = parseFloat(buyingLiabilities);
    const selling = parseFloat(sellingLiabilities);
    const available = total - buying - selling;
    return Math.max(0, available).toFixed(7);
  };

  const processNativeBalance = useCallback((stellarBalance: GenericBalance, account: GenericAccount): NativeBalance => {
    const balance = stellarBalance.balance;
    const buyingLiabilities = stellarBalance.buying_liabilities;
    const sellingLiabilities = stellarBalance.selling_liabilities;
    const available = calculateAvailableBalance(balance, buyingLiabilities, sellingLiabilities);
    
    
    const baseReserve = 0.5; 
    const reserves = (baseReserve * (2 + account.subentry_count)).toFixed(7);
    const minimumBalance = reserves;

    return {
      balance,
      available,
      buyingLiabilities,
      sellingLiabilities,
      minimumBalance,
      reserves,
      subentryCount: account.subentry_count,
    };
  }, []);

  const processAssetBalance = useCallback((stellarBalance: GenericBalance): AssetBalance => {
    const assetInfo = createAssetInfo(stellarBalance);
    const available = calculateAvailableBalance(
      stellarBalance.balance,
      stellarBalance.buying_liabilities,
      stellarBalance.selling_liabilities
    );

    return {
      asset: assetInfo,
      balance: stellarBalance.balance,
      available,
      buyingLiabilities: stellarBalance.buying_liabilities,
      sellingLiabilities: stellarBalance.selling_liabilities,
      authorized: stellarBalance.is_authorized,
      authorizedToMaintainLiabilities: stellarBalance.is_authorized_to_maintain_liabilities,
      clawbackEnabled: stellarBalance.is_clawback_enabled,
      lastModifiedLedger: stellarBalance.last_modified_ledger,
      limit: stellarBalance.limit,
      sponsor: stellarBalance.sponsor,
    };
  }, [createAssetInfo]);

  const createTokenBalance = useCallback((assetBalance: AssetBalance, marketData?: MarketData): TokenBalance => {
    const extendedAssetInfo = createExtendedAssetInfo(assetBalance.asset);
    const balanceNumber = parseFloat(assetBalance.balance);
    const availableNumber = parseFloat(assetBalance.available);
    const lockedNumber = balanceNumber - availableNumber;

    return {
      asset: extendedAssetInfo,
      balance: assetBalance.balance,
      balanceNumber,
      available: assetBalance.available,
      availableNumber,
      locked: lockedNumber.toFixed(7),
      lockedNumber,
      valueUSD: marketData ? balanceNumber * marketData.priceUSD : undefined,
      marketData,
      displayDecimals: extendedAssetInfo.decimals,
    };
  }, []);

  const fetchMarketData = useCallback(async (assetCode: string): Promise<MarketData | undefined> => {
    if (!mergedOptions.includeMarketData) return undefined;

    try {
      
      const mockPrices: Record<string, number> = {
        XLM: 0.12,
        USDC: 1.00,
        USDT: 1.00,
      };

      const price = mockPrices[assetCode] || 0;
      
      return {
        price,
        priceUSD: price,
        change24h: Math.random() * 10 - 5, 
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.warn(`Failed to fetch market data for ${assetCode}:`, error);
      return undefined;
    }
  }, [mergedOptions.includeMarketData]);

  const calculateSummary = (walletBalance: WalletBalance): BalanceSummary => {
    const xlmBalance = parseFloat(walletBalance.native.balance);
    const xlmMarketData = walletBalance.tokens.find(t => t.asset.code === "XLM")?.marketData;
    const xlmValueUSD = xlmMarketData ? xlmBalance * xlmMarketData.priceUSD : 0;

    const totalValueUSD = walletBalance.tokens.reduce((sum, token) => {
      return sum + (token.valueUSD || 0);
    }, 0);

    const topAssets = walletBalance.tokens
      .filter(t => (t.valueUSD || 0) > 0)
      .sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0))
      .slice(0, 5);

    return {
      totalValueUSD,
      xlmBalance,
      xlmValueUSD,
      assetsCount: walletBalance.assets.length,
      topAssets,
      change24hUSD: 0, 
      change24hPercent: 0,
    };
  };

  const fetchBalance = useCallback(async (isRefresh = false): Promise<void> => {
    if (!publicKey) {
      setBalance(null);
      setSummary(null);
      setError(null);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);

      try {
        const server = new StellarSDK.Horizon.Server(networkConfig.horizonUrl);
        const account = await server.accounts().accountId(publicKey).call();
        
        let nativeBalance: NativeBalance | undefined;
        const assetBalances: AssetBalance[] = [];

        
        for (const stellarBalance of account.balances) {
          if (stellarBalance.asset_type === "native") {
            nativeBalance = processNativeBalance(stellarBalance, account);
          } else if (stellarBalance.asset_type === "credit_alphanum4" || stellarBalance.asset_type === "credit_alphanum12") {
            const assetBalance = processAssetBalance(stellarBalance);
            assetBalances.push(assetBalance);
          }
          
        }      if (!nativeBalance) {
        throw new Error("Native balance not found");
      }

      
      const tokenBalances: TokenBalance[] = [];
      
      
      const xlmMarketData = await fetchMarketData("XLM");
      const xlmAssetInfo: AssetInfo = { code: "XLM", type: "native" };
      const xlmAssetBalance: AssetBalance = {
        asset: xlmAssetInfo,
        balance: nativeBalance.balance,
        available: nativeBalance.available,
        buyingLiabilities: nativeBalance.buyingLiabilities,
        sellingLiabilities: nativeBalance.sellingLiabilities,
      };
      tokenBalances.push(createTokenBalance(xlmAssetBalance, xlmMarketData));

      
      for (const assetBalance of assetBalances) {
        const marketData = await fetchMarketData(assetBalance.asset.code);
        tokenBalances.push(createTokenBalance(assetBalance, marketData));
      }

      const walletBalance: WalletBalance = {
        native: nativeBalance,
        assets: assetBalances,
        tokens: tokenBalances,
        totalValueUSD: tokenBalances.reduce((sum, token) => sum + (token.valueUSD || 0), 0),
        lastUpdated: new Date(),
        isLoading: false,
        hasError: false,
      };

      setBalance(walletBalance);
      setSummary(calculateSummary(walletBalance));
      setLastFetchTime(new Date());
      retryCount.current = 0;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        
        const emptyBalance: WalletBalance = {
          native: {
            balance: "0",
            available: "0",
            buyingLiabilities: "0",
            sellingLiabilities: "0",
            minimumBalance: "1",
            reserves: "1",
            subentryCount: 0,
          },
          assets: [],
          tokens: [],
          totalValueUSD: 0,
          lastUpdated: new Date(),
          isLoading: false,
          hasError: false,
        };
        
        setBalance(emptyBalance);
        setSummary(calculateSummary(emptyBalance));
        setError(null);
      } else if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
        setError('Network connection failed');
        
        
        if (retryCount.current < mergedOptions.maxRetries) {
          retryCount.current++;
          setTimeout(() => fetchBalance(isRefresh), 2000 * retryCount.current);
          return;
        }
      } else {
        setError(errorMessage);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.warn("Error fetching balance:", error);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [publicKey, networkConfig.horizonUrl, mergedOptions.maxRetries, createTokenBalance, fetchMarketData, processAssetBalance, processNativeBalance]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    await fetchBalance(true);
  }, [fetchBalance]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const getAssetBalance = useCallback((assetCode: string, assetIssuer?: string): TokenBalance | null => {
    if (!balance) return null;
    
    return balance.tokens.find(token => {
      const matchesCode = token.asset.code === assetCode;
      if (token.asset.type === "native") {
        return matchesCode;
      }
      return matchesCode && token.asset.issuer === assetIssuer;
    }) || null;
  }, [balance]);

  const getFormattedBalance = useCallback((assetCode: string, assetIssuer?: string): string => {
    const tokenBalance = getAssetBalance(assetCode, assetIssuer);
    if (!tokenBalance) return "0";
    
    const decimals = tokenBalance.displayDecimals || 7;
    return parseFloat(tokenBalance.balance).toFixed(decimals);
  }, [getAssetBalance]);

  const getTotalValue = useCallback((): number => {
    return balance?.totalValueUSD || 0;
  }, [balance]);

  const hasInsufficientBalance = useCallback((amount: string, assetCode = "XLM"): boolean => {
    const tokenBalance = getAssetBalance(assetCode);
    if (!tokenBalance) return true;
    
    const requiredAmount = parseFloat(amount);
    const availableAmount = tokenBalance.availableNumber;
    
    return availableAmount < requiredAmount;
  }, [getAssetBalance]);

  
  useEffect(() => {
    if (mergedOptions.refreshInterval > 0) {
      refreshTimer.current = setInterval(() => {
        fetchBalance(true);
      }, mergedOptions.refreshInterval);
      
      return () => {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
        }
      };
    }
  }, [fetchBalance, mergedOptions.refreshInterval]);

  
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  
  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, []);

  return {
    balance,
    summary,
    isLoading,
    isRefreshing,
    error,
    lastFetchTime,
    refreshBalance,
    clearError,
    getAssetBalance,
    getFormattedBalance,
    getTotalValue,
    hasInsufficientBalance,
  };
}
