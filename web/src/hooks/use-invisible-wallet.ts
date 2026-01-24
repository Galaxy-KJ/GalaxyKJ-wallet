/**
 * React Hooks for Invisible Wallet Integration
 * 
 * Provides React hooks for easy integration with the Invisible Wallet system,
 * managing state and providing a clean API for React applications.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  InvisibleWalletSDK, 
  createInvisibleWalletSDK,
  SDKConfig
} from '@/lib/invisible-wallet/sdk';
import { 
  WalletResponse, 
  WalletCreationResponse,
  WalletWithBalance, 
  SignTransactionResponse, 
  NetworkType 
} from '@/types/invisible-wallet';
import {
  UseInvisibleWalletState,
  UseInvisibleWalletReturn,
  CreateWalletOptions,
  RecoverWalletOptions,
  GetWalletOptions,
  UseWalletBalanceReturn,
  UsePassphraseValidationReturn
} from '@/types/invisible-wallet-operations';

// Types are now imported from invisible-wallet-operations.ts

/**
 * Main hook for Invisible Wallet functionality
 */
export function useInvisibleWallet(config: SDKConfig): UseInvisibleWalletReturn {
  const [state, setState] = useState<UseInvisibleWalletState>({
    wallet: null,
    isLoading: false,
    error: null,
    isInitialized: false,
  });

  const sdkRef = useRef<InvisibleWalletSDK | null>(null);
  const currentWalletRef = useRef<{ email: string; network: NetworkType } | null>(null);

  // Initialize SDK
  useEffect(() => {
    try {
      sdkRef.current = createInvisibleWalletSDK(config);
      
      // Set up event listeners
      const handleWalletCreated = (data: unknown) => {
        console.log('Wallet created event:', data);
      };

      const handleWalletRecovered = (data: unknown) => {
        console.log('Wallet recovered event:', data);
      };

      const handleTransactionSigned = (data: unknown) => {
        console.log('Transaction signed event:', data);
      };

      const handleError = (data: unknown) => {
        const errorData = data as { error?: string };
        setState(prev => ({ ...prev, error: errorData.error || 'Unknown error', isLoading: false }));
      };

      sdkRef.current.on('walletCreated', handleWalletCreated);
      sdkRef.current.on('walletRecovered', handleWalletRecovered);
      sdkRef.current.on('transactionSigned', handleTransactionSigned);
      sdkRef.current.on('error', handleError);

      setState(prev => ({ ...prev, isInitialized: true }));

      // Cleanup function
      return () => {
        if (sdkRef.current) {
          sdkRef.current.off('walletCreated', handleWalletCreated);
          sdkRef.current.off('walletRecovered', handleWalletRecovered);
          sdkRef.current.off('transactionSigned', handleTransactionSigned);
          sdkRef.current.off('error', handleError);
        }
      };
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to initialize SDK',
        isInitialized: false 
      }));
    }
  }, [config]);

  // Create wallet function
  const createWallet = useCallback(async (
    email: string, 
    passphrase: string, 
    options?: CreateWalletOptions
  ): Promise<WalletResponse> => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const wallet = await sdkRef.current.createWallet(email, passphrase, options);
      
      // Store current wallet info for auto-refresh
      currentWalletRef.current = {
        email,
        network: options?.network || config.defaultNetwork || 'testnet'
      };

      // Refresh wallet data to get balance
      // Note: We'll refresh manually later to avoid circular dependencies

      setState(prev => ({ ...prev, isLoading: false }));
      return wallet;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create wallet',
        isLoading: false 
      }));
      throw error;
    }
  }, [config.defaultNetwork]);

  // Create wallet with keys function (for demo purposes)
  const createWalletWithKeys = useCallback(async (
    email: string, 
    passphrase: string, 
    options?: CreateWalletOptions
  ): Promise<WalletCreationResponse> => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const wallet = await sdkRef.current.createWalletWithKeys(email, passphrase, options);
      
      // Store current wallet info for auto-refresh
      currentWalletRef.current = {
        email,
        network: options?.network || config.defaultNetwork || 'testnet'
      };

      // Refresh wallet data to get balance
      // Note: We'll refresh manually later to avoid circular dependencies

      setState(prev => ({ ...prev, isLoading: false }));
      return wallet;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create wallet with keys',
        isLoading: false 
      }));
      throw error;
    }
  }, [config.defaultNetwork]);

  // Recover wallet function
  const recoverWallet = useCallback(async (
    email: string, 
    passphrase: string, 
    options?: RecoverWalletOptions
  ): Promise<WalletResponse> => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const wallet = await sdkRef.current.recoverWallet(email, passphrase, options);
      
      // Store current wallet info for auto-refresh
      currentWalletRef.current = {
        email,
        network: options?.network || config.defaultNetwork || 'testnet'
      };

      // Refresh wallet data to get balance
      // Note: We'll refresh manually later to avoid circular dependencies

      setState(prev => ({ ...prev, isLoading: false }));
      return wallet;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to recover wallet',
        isLoading: false 
      }));
      throw error;
    }
  }, [config.defaultNetwork]);

  // Get wallet function
  const getWallet = useCallback(async (
    email: string, 
    options?: GetWalletOptions
  ): Promise<WalletWithBalance | null> => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const wallet = await sdkRef.current.getWallet(email, options);
      
      setState(prev => ({ 
        ...prev, 
        wallet, 
        isLoading: false 
      }));

      // Store current wallet info for auto-refresh
      if (wallet) {
        currentWalletRef.current = {
          email,
          network: options?.network || config.defaultNetwork || 'testnet'
        };
      }

      return wallet;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to get wallet',
        isLoading: false 
      }));
      throw error;
    }
  }, [config.defaultNetwork]);

  // Sign transaction function
  const signTransaction = useCallback(async (
    walletId: string,
    email: string,
    passphrase: string,
    transactionXDR: string
  ): Promise<SignTransactionResponse> => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await sdkRef.current.signTransaction(
        walletId, 
        email, 
        passphrase, 
        transactionXDR
      );

      setState(prev => ({ ...prev, isLoading: false }));
      
      // Refresh wallet balance after successful transaction
      // Note: We'll refresh manually later to avoid circular dependencies

      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to sign transaction',
        isLoading: false 
      }));
      throw error;
    }
  }, []);

  // Validate passphrase function
  const validatePassphrase = useCallback((passphrase: string) => {
    if (!sdkRef.current) {
      return { isValid: false, errors: ['SDK not initialized'] };
    }
    return sdkRef.current.validatePassphrase(passphrase);
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Refresh wallet function
  const refreshWallet = useCallback(async () => {
    if (!sdkRef.current || !currentWalletRef.current) {
      return;
    }

    try {
      const wallet = await sdkRef.current.getWallet(
        currentWalletRef.current.email,
        { network: currentWalletRef.current.network }
      );
      
      setState(prev => ({ ...prev, wallet }));
    } catch (error) {
      console.warn('Failed to refresh wallet:', error);
    }
  }, []);

  return {
    ...state,
    createWallet,
    createWalletWithKeys,
    recoverWallet,
    getWallet,
    signTransaction,
    validatePassphrase,
    clearError,
    refreshWallet,
    sdk: sdkRef.current,
  };
}

/**
 * Hook for wallet balance monitoring
 */
export function useWalletBalance(
  email: string | null,
  network: NetworkType = 'testnet',
  refreshInterval: number = 30000 // 30 seconds
): UseWalletBalanceReturn {
  const [balance, setBalance] = useState<WalletWithBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sdkRef = useRef<InvisibleWalletSDK | null>(null);

  // Initialize SDK if not already initialized
  useEffect(() => {
    if (!sdkRef.current) {
      try {
        sdkRef.current = createInvisibleWalletSDK({
          platformId: 'default', // Should be configurable
          defaultNetwork: network,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to initialize SDK');
      }
    }
  }, [network]);

  // Fetch balance function
  const fetchBalance = useCallback(async () => {
    if (!email || !sdkRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const wallet = await sdkRef.current.getWallet(email, { network });
      setBalance(wallet);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [email, network]);

  // Auto-refresh balance
  useEffect(() => {
    if (!email) return;

    fetchBalance();

    const interval = setInterval(fetchBalance, refreshInterval);
    return () => clearInterval(interval);
  }, [email, fetchBalance, refreshInterval]);

  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
  };
}

/**
 * Hook for passphrase validation with real-time feedback
 */
export function usePassphraseValidation(): UsePassphraseValidationReturn {
  const [passphrase, setPassphrase] = useState('');
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });

  const sdkRef = useRef<InvisibleWalletSDK | null>(null);

  // Initialize SDK
  useEffect(() => {
    if (!sdkRef.current) {
      try {
        sdkRef.current = createInvisibleWalletSDK({
          platformId: 'default', // Should be configurable
        });
      } catch (error) {
        console.error('Failed to initialize SDK for passphrase validation:', error);
      }
    }
  }, []);

  // Validate passphrase when it changes
  useEffect(() => {
    if (!sdkRef.current) return;

    if (passphrase) {
      const result = sdkRef.current.validatePassphrase(passphrase);
      setValidation(result);
    } else {
      setValidation({ isValid: false, errors: [] });
    }
  }, [passphrase]);

  return {
    passphrase,
    setPassphrase,
    validation,
    isValid: validation.isValid,
    errors: validation.errors,
  };
}
