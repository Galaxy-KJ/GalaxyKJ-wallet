import { useState, useEffect, useCallback } from "react";
import {
  stellarConversionService,
  ConversionEstimate,
  ConversionResult,
  TrustlineInfo,
  STELLAR_ASSETS
} from "@/lib/stellar/conversion-service";
import type {
  ConversionState,
  UseStellarConversionReturn,
  NetworkStatus,
  NetworkDiagnosticReport
} from "@/types/crypto-conversion";

export function useStellarConversion(slippageTolerance: number = 0.05): UseStellarConversionReturn {
  const [state, setState] = useState<ConversionState>({
    loading: false,
    error: null,
    estimate: null,
    result: null,
    trustlines: {
      source: null,
      destination: null
    },
    orderBook: null,
    currentAssetPair: {
      fromAssetId: null,
      toAssetId: null
    }
  });

  const updateState = useCallback((updates: Partial<ConversionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearResult = useCallback(() => {
    updateState({ result: null });
  }, [updateState]);

  // Get exchange rate estimate
  const getEstimate = useCallback(async (
    fromAssetId: string,
    toAssetId: string,
    amount: string
  ): Promise<void> => {
    if (!amount || parseFloat(amount) <= 0) {
      updateState({ estimate: null, error: null });
      return;
    }

    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset) {
      updateState({ error: "Invalid asset selection" });
      return;
    }

    updateState({ 
      loading: true, 
      error: null,
      currentAssetPair: { fromAssetId, toAssetId }
    });

    try {
      const estimate = await stellarConversionService.estimateConversion(
        sourceAsset,
        destinationAsset,
        amount
      );

      updateState({ 
        loading: false, 
        estimate,
        error: estimate ? null : "No conversion path available"
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to get conversion estimate";
      updateState({ 
        loading: false, 
        error: message,
        estimate: null 
      });
    }
  }, [updateState]);

  // Check trustlines for both assets
  const checkTrustlines = useCallback(async (
    accountPublicKey: string,
    fromAssetId: string,
    toAssetId: string
  ): Promise<void> => {
    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset) {
      return;
    }

    updateState({ loading: true });

    try {
      const [sourceTrustline, destTrustline] = await Promise.all([
        stellarConversionService.checkTrustline(accountPublicKey, sourceAsset),
        stellarConversionService.checkTrustline(accountPublicKey, destinationAsset)
      ]);

      updateState({
        loading: false,
        trustlines: {
          source: sourceTrustline,
          destination: destTrustline
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to check trustlines";
      updateState({ 
        loading: false, 
        error: message
      });
    }
  }, [updateState]);

  // Get order book data for live rates
  const fetchOrderBook = useCallback(async (
    fromAssetId: string,
    toAssetId: string
  ): Promise<void> => {
    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset) {
      return;
    }

    // Update current asset pair when fetching order book
    updateState({ currentAssetPair: { fromAssetId, toAssetId } });

    try {
      // Check network connectivity first
      const networkStatus = await stellarConversionService.checkNetworkConnectivity();
      if (!networkStatus.connected) {
        console.warn("Network connectivity issue:", networkStatus.error);
        return;
      }

      const orderBook = await stellarConversionService.getOrderBook(
        sourceAsset,
        destinationAsset,
        10
      );

      updateState({ orderBook });
    } catch (error: unknown) {
      console.error("Failed to fetch order book:", error);
    }
  }, [updateState]);

  // Execute the conversion
  const executeConversion = useCallback(async (
    privateKey: string,
    fromAssetId: string,
    toAssetId: string,
    amount: string,
    destinationAddress?: string,
    memo?: string
  ): Promise<void> => {
    if (!privateKey) {
      updateState({ error: "Private key is required for conversion" });
      return;
    }

    const sourceAsset = STELLAR_ASSETS[fromAssetId];
    const destinationAsset = STELLAR_ASSETS[toAssetId];

    if (!sourceAsset || !destinationAsset || !state.estimate) {
      updateState({ error: "Invalid conversion parameters" });
      return;
    }

    updateState({ loading: true, error: null, result: null });

    try {
      // Calculate minimum destination amount based on configurable slippage tolerance
      const destinationMin = (parseFloat(state.estimate.destinationAmount) * (1 - slippageTolerance)).toFixed(7);

      const result = await stellarConversionService.executeConversion(
        privateKey,
        sourceAsset,
        destinationAsset,
        amount,
        destinationMin,
        destinationAddress,
        memo
      );

      updateState({ loading: false, result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Conversion failed";
      updateState({ 
        loading: false, 
        error: message,
        result: { success: false, error: message }
      });
    }
  }, [slippageTolerance, state.estimate, updateState]);

  // Auto-refresh order book data
  useEffect(() => {
    const refreshData = async () => {
      if (!state.loading && state.estimate && state.currentAssetPair.fromAssetId && state.currentAssetPair.toAssetId) {
        // Refresh order book data periodically using current asset pair
        await fetchOrderBook(state.currentAssetPair.fromAssetId, state.currentAssetPair.toAssetId);
      }
    };

    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [state.estimate, state.loading, state.currentAssetPair, fetchOrderBook]);

  // Check network connectivity
  const checkNetworkStatus = useCallback(async (): Promise<NetworkStatus> => {
    try {
      return await stellarConversionService.checkNetworkConnectivity();
    } catch (error) {
      return { 
        connected: false, 
        error: "Failed to check network status" 
      };
    }
  }, []);

  // Run comprehensive network diagnostic
  const runNetworkDiagnostic = useCallback(async (): Promise<NetworkDiagnosticReport> => {
    try {
      return await stellarConversionService.runNetworkDiagnostic();
    } catch (error) {
      console.error('Failed to run network diagnostic:', error);
      return {
        overallStatus: 'unhealthy' as const,
        tests: [],
        summary: 'Failed to run diagnostic'
      };
    }
  }, []);

  return {
    ...state,
    getEstimate,
    checkTrustlines,
    fetchOrderBook,
    executeConversion,
    checkNetworkStatus,
    runNetworkDiagnostic,
    clearError,
    clearResult,
    assets: STELLAR_ASSETS
  };
}