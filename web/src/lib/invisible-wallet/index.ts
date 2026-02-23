/**
 * Invisible Wallet System - Main Export File
 * 
 * This file exports all the components of the Invisible Wallet system
 * for easy importing and integration into applications.
 */

// Core types and interfaces
export * from '@/types/invisible-wallet';

// Cryptographic service
export { CryptoService } from './crypto-service';
export type { EncryptionResult, DecryptionInput } from './crypto-service';

// Wallet service
export { InvisibleWalletService } from './wallet-service';
export type { WalletStorage } from './wallet-service';

// SDK
export { 
  InvisibleWalletSDK, 
  createInvisibleWalletSDK 
} from './sdk';
export type { 
  SDKConfig, 
  WalletEventData, 
  WalletEventType, 
  WalletEventListener 
} from './sdk';

// React hooks
export { 
  useInvisibleWallet, 
  useWalletBalance, 
  usePassphraseValidation 
} from '@/hooks/use-invisible-wallet';

// Demo component
export { InvisibleWalletDemo } from '@/components/invisible-wallet/invisible-wallet-demo';
export { WalletDashboard } from '@/components/wallet-dashboard';

/**
 * Quick start configuration for common use cases
 */
export const INVISIBLE_WALLET_PRESETS = {
  /**
   * Development preset for testing
   */
  development: {
    platformId: 'dev-platform',
    defaultNetwork: 'testnet' as const,
    debug: true,
  },
  
  /**
   * Production preset for live applications
   */
  production: {
    platformId: 'prod-platform', // Should be replaced with actual platform ID
    defaultNetwork: 'mainnet' as const,
    debug: false,
  },
  
  /**
   * Demo preset for showcasing features
   */
  demo: {
    platformId: 'demo-platform',
    defaultNetwork: 'testnet' as const,
    debug: true,
  },
} as const;

/**
 * Utility functions for common operations
 */
export const InvisibleWalletUtils = {
  /**
   * Validates if a string is a valid Stellar public key
   */
  isValidPublicKey(publicKey: string): boolean {
    return /^G[A-Z2-7]{55}$/.test(publicKey);
  },
  
  /**
   * Validates if a string is a valid Stellar secret key
   */
  isValidSecretKey(secretKey: string): boolean {
    return /^S[A-Z2-7]{55}$/.test(secretKey);
  },
  
  /**
   * Formats a public key for display (truncated)
   */
  formatPublicKey(publicKey: string, length: number = 8): string {
    if (!this.isValidPublicKey(publicKey)) return publicKey;
    return `${publicKey.slice(0, length)}...${publicKey.slice(-length)}`;
  },
  
  /**
   * Validates email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Generates a platform ID with proper formatting
   */
  generatePlatformId(name: string, environment: 'dev' | 'prod' | 'test' = 'prod'): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${sanitized}-${environment}`;
  },
  
  /**
   * Converts Stellar stroops to XLM
   */
  stroopsToXLM(stroops: string): string {
    const num = parseFloat(stroops) / 10000000; // 1 XLM = 10^7 stroops
    return num.toFixed(7);
  },
  
  /**
   * Converts XLM to Stellar stroops
   */
  xlmToStroops(xlm: string | number): string {
    const num = typeof xlm === 'string' ? parseFloat(xlm) : xlm;
    return (num * 10000000).toString();
  },
};

/**
 * Error handling utilities
 */
export const InvisibleWalletErrorHandler = {
  /**
   * Checks if an error is a specific Invisible Wallet error
   */
  isInvisibleWalletError(error: unknown, errorType: string): boolean {
    return error instanceof Error && error.message.includes(errorType);
  },
  
  /**
   * Extracts user-friendly error messages
   */
  getUserFriendlyMessage(error: unknown): string {
    if (!error) return 'Unknown error occurred';
    
    const message = error instanceof Error ? error.message : String(error);
    
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'INVALID_PASSPHRASE': 'The passphrase you entered is incorrect.',
      'WALLET_NOT_FOUND': 'No wallet found with the provided email and network.',
      'WALLET_ALREADY_EXISTS': 'A wallet already exists for this email and network.',
      'INVALID_EMAIL': 'Please enter a valid email address.',
      'INVALID_PASSPHRASE_STRENGTH': 'Your passphrase does not meet security requirements.',
      'ENCRYPTION_FAILED': 'Failed to encrypt wallet data. Please try again.',
      'DECRYPTION_FAILED': 'Failed to decrypt wallet data. Please check your passphrase.',
      'STELLAR_NETWORK_ERROR': 'Unable to connect to Stellar network. Please try again later.',
      'STELLAR_ACCOUNT_NOT_FOUND': 'Stellar account not found. It may not be funded yet.',
      'INVALID_TRANSACTION_XDR': 'The transaction data is invalid or corrupted.',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait and try again.',
    };
    
    for (const [errorCode, userMessage] of Object.entries(errorMap)) {
      if (message.includes(errorCode)) {
        return userMessage;
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  },
};

/**
 * Version information
 */
export const INVISIBLE_WALLET_VERSION = {
  version: '1.0.0',
  build: Date.now(),
  features: [
    'AES-256-GCM Encryption',
    'PBKDF2 Key Derivation',
    'Stellar SDK Integration',
    'Multi-tenant Support',
    'React Hooks',
    'TypeScript Support',
    'IndexedDB Storage',
    'Event System',
  ],
} as const;
