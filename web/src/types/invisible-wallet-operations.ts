/**
 * Invisible Wallet Operations Types
 * 
 * Defines types for invisible wallet operations to ensure type safety
 * and better maintainability across the application.
 */

import { NetworkType, WalletResponse, WalletCreationResponse, SignTransactionResponse } from './invisible-wallet';

/**
 * Options for wallet creation operations
 */
export interface CreateWalletOptions {
  /** Network to use for wallet creation */
  network?: NetworkType;
  /** Additional metadata for the wallet */
  metadata?: Record<string, unknown>;
}

/**
 * Options for wallet recovery operations
 */
export interface RecoverWalletOptions {
  /** Network to use for wallet recovery */
  network?: NetworkType;
}

/**
 * Options for getting wallet information
 */
export interface GetWalletOptions {
  /** Network to use for wallet retrieval */
  network?: NetworkType;
}

/**
 * Options for signing transactions
 */
export interface SignTransactionOptions {
  /** Network to use for transaction signing */
  network?: NetworkType;
  /** Additional metadata for the transaction */
  metadata?: Record<string, unknown>;
}

/**
 * State interface for invisible wallet hook
 */
export interface UseInvisibleWalletState {
  /** Current wallet instance with balance information */
  wallet: WalletWithBalance | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Current error message if any */
  error: string | null;
  /** Whether the SDK has been initialized */
  isInitialized: boolean;
}

/**
 * Return interface for the main invisible wallet hook
 */
export interface UseInvisibleWalletReturn extends UseInvisibleWalletState {
  // Core operations
  /** Create a new invisible wallet */
  createWallet: (email: string, passphrase: string, options?: CreateWalletOptions) => Promise<WalletResponse>;
  /** Create a new invisible wallet with keys (for demo purposes) */
  createWalletWithKeys: (email: string, passphrase: string, options?: CreateWalletOptions) => Promise<WalletCreationResponse>;
  /** Recover an existing invisible wallet */
  recoverWallet: (email: string, passphrase: string, options?: RecoverWalletOptions) => Promise<WalletResponse>;
  /** Get wallet information and balance */
  getWallet: (email: string, options?: GetWalletOptions) => Promise<WalletWithBalance | null>;
  /** Sign a transaction with the wallet */
  signTransaction: (walletId: string, email: string, passphrase: string, transactionXDR: string) => Promise<SignTransactionResponse>;
  
  // Utility functions
  /** Validate passphrase strength and format */
  validatePassphrase: (passphrase: string) => { isValid: boolean; errors: string[] };
  /** Clear current error state */
  clearError: () => void;
  /** Refresh wallet data and balance */
  refreshWallet: () => Promise<void>;
  
  // SDK instance (for advanced usage)
  sdk: InvisibleWalletSDK | null;
}

/**
 * Return interface for wallet balance monitoring hook
 */
export interface UseWalletBalanceReturn {
  /** Current wallet balance information */
  balance: WalletWithBalance | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Current error message if any */
  error: string | null;
  /** Function to manually refresh balance */
  refresh: () => Promise<void>;
}

/**
 * Return interface for passphrase validation hook
 */
export interface UsePassphraseValidationReturn {
  /** Current passphrase value */
  passphrase: string;
  /** Function to update passphrase */
  setPassphrase: (passphrase: string) => void;
  /** Validation result object */
  validation: {
    isValid: boolean;
    errors: string[];
  };
  /** Whether the passphrase is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: string[];
}

/**
 * Event data for wallet operations
 */
export interface WalletEventData {
  /** Type of event */
  type: 'walletCreated' | 'walletRecovered' | 'transactionSigned' | 'error';
  /** Event payload data */
  data: unknown;
  /** Timestamp of the event */
  timestamp: string;
}

/**
 * SDK configuration for invisible wallet operations
 */
export interface SDKConfig {
  /** Platform identifier */
  platformId: string;
  /** Default network to use */
  defaultNetwork?: NetworkType;
  /** API configuration */
  api?: {
    baseUrl?: string;
    timeout?: number;
  };
  /** Storage configuration */
  storage?: WalletStorage;
}

/**
 * Wallet storage interface for persistence
 */
export interface WalletStorage {
  /** Save wallet data */
  saveWallet(id: string, data: unknown): Promise<void>;
  /** Get wallet data */
  getWallet(id: string): Promise<unknown>;
  /** Delete wallet data */
  deleteWallet(id: string): Promise<void>;
}

/**
 * SDK instance interface for invisible wallet operations
 */
export interface InvisibleWalletSDK {
  // Core operations
  createWallet(email: string, passphrase: string, options?: CreateWalletOptions): Promise<WalletResponse>;
  createWalletWithKeys(email: string, passphrase: string, options?: CreateWalletOptions): Promise<WalletCreationResponse>;
  recoverWallet(email: string, passphrase: string, options?: RecoverWalletOptions): Promise<WalletResponse>;
  getWallet(email: string, options?: GetWalletOptions): Promise<WalletWithBalance | null>;
  signTransaction(walletId: string, email: string, passphrase: string, transactionXDR: string): Promise<SignTransactionResponse>;
  
  // Utility methods
  validatePassphrase(passphrase: string): { isValid: boolean; errors: string[] };
  
  // Event handling
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string, callback: (data: unknown) => void): void;
}

// Re-export types from invisible-wallet.ts for convenience
export type { 
  NetworkType, 
  WalletResponse, 
  WalletCreationResponse, 
  SignTransactionResponse,
  WalletWithBalance 
} from './invisible-wallet';
