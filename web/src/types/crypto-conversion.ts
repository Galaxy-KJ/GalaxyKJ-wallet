/**
 * Re-export types from conversion-service for centralized type management
 * These types are already defined in the service but exported here for easier imports
 */
export type {
    StellarAsset,
    ConversionRate,
    ConversionEstimate,
    ConversionResult,
    TrustlineInfo,
  } from "@/lib/stellar/conversion-service";
  
  /**
   * Map of asset IDs to their corresponding asset objects
   */
  export type StellarAssetsMap = Record<string, import("@/lib/stellar/conversion-service").StellarAsset>;
  
  /**
   * Represents an order book entry (bid or ask)
   */
  export interface OrderBookEntry {
    price: string;
    amount: string;
  }
  
  /**
   * Represents the complete order book for a trading pair
   */
  export interface OrderBook {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    baseAsset?: import("@/lib/stellar/conversion-service").StellarAsset;
    counterAsset?: import("@/lib/stellar/conversion-service").StellarAsset;
    timestamp?: number;
  }
  
  /**
   * Represents the current asset pair being traded
   */
  export interface AssetPair {
    fromAssetId: string | null;
    toAssetId: string | null;
  }
  
  /**
   * Represents trustline status for both source and destination assets
   */
  export interface TrustlineStatus {
    source: import("@/lib/stellar/conversion-service").TrustlineInfo | null;
    destination: import("@/lib/stellar/conversion-service").TrustlineInfo | null;
  }
  
  /**
   * Represents the state of a conversion operation in the hook
   */
  export interface ConversionState {
    loading: boolean;
    error: string | null;
    estimate: import("@/lib/stellar/conversion-service").ConversionEstimate | null;
    result: import("@/lib/stellar/conversion-service").ConversionResult | null;
    trustlines: TrustlineStatus;
    orderBook: OrderBook | null;
    currentAssetPair: AssetPair;
  }
  
  /**
   * Network connectivity status
   */
  export interface NetworkStatus {
    connected: boolean;
    error?: string;
    latency?: number;
    details?: any;
  }
  
  /**
   * Individual network diagnostic test result
   */
  export interface NetworkDiagnosticTest {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    duration: number;
    error?: string;
    message?: string;
  }
  
  /**
   * Complete network diagnostic report
   */
  export interface NetworkDiagnosticReport {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    tests: NetworkDiagnosticTest[];
    summary: string;
    timestamp?: number;
    browserInfo?: {
      userAgent: string;
      corsSupported: boolean;
      fetchSupported: boolean;
    };
  }
  
  /**
   * Parameters for executing a conversion
   */
  export interface ConversionParams {
    privateKey: string;
    fromAssetId: string;
    toAssetId: string;
    amount: string;
    destinationAddress?: string;
    memo?: string;
    slippageTolerance?: number;
  }
  
  /**
   * Parameters for getting a conversion estimate
   */
  export interface EstimateParams {
    fromAssetId: string;
    toAssetId: string;
    amount: string;
  }
  
  /**
   * Return type for the useStellarConversion hook
   */
  export interface UseStellarConversionReturn extends ConversionState {
    getEstimate: (fromAssetId: string, toAssetId: string, amount: string) => Promise<void>;
    checkTrustlines: (accountPublicKey: string, fromAssetId: string, toAssetId: string) => Promise<void>;
    fetchOrderBook: (fromAssetId: string, toAssetId: string) => Promise<void>;
    executeConversion: (
      privateKey: string,
      fromAssetId: string,
      toAssetId: string,
      amount: string,
      destinationAddress?: string,
      memo?: string
    ) => Promise<void>;
    checkNetworkStatus: () => Promise<NetworkStatus>;
    runNetworkDiagnostic: () => Promise<NetworkDiagnosticReport>;
    clearError: () => void;
    clearResult: () => void;
    assets: StellarAssetsMap;
  }
  
  /**
   * Configuration options for conversion operations
   */
  export interface ConversionConfig {
    slippageTolerance: number;
    maxPathLength?: number;
    refreshInterval?: number;
    timeout?: number;
  }