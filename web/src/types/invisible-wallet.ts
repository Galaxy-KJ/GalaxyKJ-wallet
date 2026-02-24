/**
 * Invisible Wallet Types and Interfaces
 * 
 * Defines the core data structures for the Invisible Wallet system
 * that abstracts Stellar blockchain complexity for end users.
 */

export type NetworkType = 'testnet' | 'mainnet';
export type WalletStatus = 'active' | 'inactive' | 'locked' | 'recovered';
export type SupportedAsset = 'XLM' | 'USDC'

/**
 * Core Invisible Wallet structure
 */
export interface InvisibleWallet {
  /** Unique identifier for the wallet */
  id: string;
  /** User email identifier */
  email: string;
  /** SHA-256 hash of the email (server-side storage, no PII) */
  emailHash?: string;
  /** Stellar public key (G...) */
  publicKey: string;
  /** AES-256-GCM encrypted private key */
  encryptedSecret: string;
  /** Salt for PBKDF2 key derivation (32 bytes) */
  salt: string;
  /** IV/Nonce for AES encryption (16 bytes) */
  iv: string;
  /** Platform identifier for multi-tenant support */
  platformId: string;
  /** Stellar network (testnet/mainnet) */
  network: NetworkType;
  /** Wallet status */
  status: WalletStatus;
  /** Creation timestamp */
  createdAt: string;
  /** Last access timestamp */
  lastAccessedAt?: string;
  /** Additional metadata from platform */
  metadata?: Record<string, unknown>;
}

/**
 * Wallet creation request
 */
export interface CreateWalletRequest {
  email: string;
  passphrase: string;
  platformId: string;
  network: NetworkType;
  metadata?: Record<string, unknown>;
}

/**
 * Wallet recovery request
 */
export interface RecoverWalletRequest {
  email: string;
  passphrase: string;
  platformId: string;
  network: NetworkType;
}

/**
 * Wallet response (without sensitive data)
 */
export interface WalletResponse {
  id: string;
  email: string;
  publicKey: string;
  platformId: string;
  network: NetworkType;
  status: WalletStatus;
  createdAt: string;
  lastAccessedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Wallet creation response (includes private key for demo purposes only)
 */
export interface WalletCreationResponse extends WalletResponse {
  secretKey: string; // Only for demo/development purposes
}

/**
 * Transaction signing request
 */
export interface SignTransactionRequest {
  walletId: string;
  email: string;
  passphrase: string;
  transactionXDR: string;
  platformId: string;
}

/**
 * Transaction signing response
 */
export interface SignTransactionResponse {
  signedXDR: string;
  transactionHash: string;
  success: boolean;
  error?: string;
}

/**
 * Platform configuration for multi-tenant support
 */
export interface PlatformConfig {
  /** API key with prefix (ik_live_, ik_test_) */
  apiKey: string;
  /** Platform name */
  name: string;
  /** Allowed origins for CORS */
  allowedOrigins: string[];
  /** Webhook endpoints */
  webhookEndpoints: {
    walletCreated?: string;
    walletRecovered?: string;
    transactionSigned?: string;
  };
  /** Feature flags */
  features: {
    autoFunding: boolean;
    recoveryEmail: boolean;
    webhooks: boolean;
    analytics: boolean;
  };
  /** Rate limits per endpoint */
  rateLimits: {
    createWallet: number; // per hour
    recoverWallet: number; // per hour
    signTransaction: number; // per minute
  };
  /** Service tier */
  tier: 'free' | 'developer' | 'business' | 'enterprise';
  /** Custom branding */
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    brandName?: string;
  };
}

// API response wrapper - using centralized type from @/types/api-responses

/**
 * Encryption metadata
 */
export interface EncryptionMetadata {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: number;
  saltLength: number;
  ivLength: number;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  walletId: string;
  operation: 'create' | 'recover' | 'sign' | 'access';
  timestamp: string;
  platformId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Stellar account asset balance (native XLM and trustline assets)
 */
export interface AssetBalance {
  balance: string;
  assetType: string;
  assetCode: string;
  assetIssuer?: string;
  buyingLiabilities?: string;
  sellingLiabilities?: string;
  authorized?: boolean;
  authorizedToMaintainLiabilities?: boolean;
  clawbackEnabled?: boolean;
  limit?: string;
}

// Backward compatible alias used by older call sites.
export type StellarBalance = AssetBalance;

/**
 * Enhanced wallet info with Stellar account data
 */
export interface WalletWithBalance extends WalletResponse {
  balances: AssetBalance[];
  sequence: string;
  accountExists: boolean;
}

export interface AssetBalance {
  asset: SupportedAsset
  balance: string
  issuer?: string
}

/**
 * Error codes for the Invisible Wallet system
 */
export enum InvisibleWalletError {
  // Authentication errors
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ORIGIN = 'UNAUTHORIZED_ORIGIN',

  // Wallet errors
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  WALLET_ALREADY_EXISTS = 'WALLET_ALREADY_EXISTS',
  INVALID_PASSPHRASE = 'INVALID_PASSPHRASE',
  WALLET_LOCKED = 'WALLET_LOCKED',

  // Encryption errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_ENCRYPTION_DATA = 'INVALID_ENCRYPTION_DATA',

  // Stellar network errors
  STELLAR_ACCOUNT_NOT_FOUND = 'STELLAR_ACCOUNT_NOT_FOUND',
  STELLAR_INSUFFICIENT_BALANCE = 'STELLAR_INSUFFICIENT_BALANCE',
  STELLAR_TRANSACTION_FAILED = 'STELLAR_TRANSACTION_FAILED',
  STELLAR_NETWORK_ERROR = 'STELLAR_NETWORK_ERROR',

  // Validation errors
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSPHRASE_STRENGTH = 'INVALID_PASSPHRASE_STRENGTH',
  INVALID_TRANSACTION_XDR = 'INVALID_TRANSACTION_XDR',
  INVALID_NETWORK = 'INVALID_NETWORK',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  USDC_TRUSTLINE_NOT_FOUND = 'USDC_TRUSTLINE_NOT_FOUND',
  USDC_SEND_FAILED = 'USDC_SEND_FAILED',

  // Soroban contract errors
  SOROBAN_SIMULATION_FAILED = 'SOROBAN_SIMULATION_FAILED',
  SOROBAN_INVOCATION_FAILED = 'SOROBAN_INVOCATION_FAILED',
  INVALID_CONTRACT_ID = 'INVALID_CONTRACT_ID',
  INVALID_CONTRACT_ARGS = 'INVALID_CONTRACT_ARGS',
}

/**
 * Soroban smart contract invocation request
 */
export interface InvokeContractRequest {
  /** Wallet ID to sign the transaction */
  walletId: string;
  /** User email for verification */
  email: string;
  /** Passphrase to decrypt private key */
  passphrase: string;
  /** Contract ID (C... address) */
  contractId: string;
  /** Function name to invoke */
  method: string;
  /** Function arguments as ScVal XDR */
  args: string[]; // Base64-encoded xdr.ScVal
  /** Network to execute on */
  network: NetworkType;
  /** Platform ID for verification */
  platformId: string;
  /** Only simulate, don't submit */
  simulateOnly?: boolean;
}

/**
 * Soroban contract invocation response
 */
export interface ContractInvocationResponse {
  /** Whether the invocation succeeded */
  success: boolean;
  /** Transaction hash if submitted */
  transactionHash?: string;
  /** Decoded return value */
  result?: unknown;
  /** Base64-encoded XDR result */
  resultXdr?: string;
  /** Error message if failed */
  error?: string;
  /** Transaction fee in stroops */
  fee: string;
  /** Simulation result if requested */
  simulationResult?: SorobanSimulationResponse;
  /** Signed XDR */
  signedXDR?: string;
}

/**
 * Soroban simulation response
 */
export interface SorobanSimulationResponse {
  /** Estimated cost */
  cost: {
    cpuInsns: string;
    memBytes: string;
  };
  /** Result XDR */
  resultXdr?: string;
  /** Events emitted */
  events?: unknown[];
  /** Footprint for transaction */
  transactionData?: string;
  /** Minimum resource fee */
  minResourceFee?: string;
}
