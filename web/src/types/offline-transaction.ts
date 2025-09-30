/**
 * Types for offline transaction data
 * Centralized type definitions for offline transaction handling
 */

// Transaction data structure for offline transactions
export interface OfflineTransactionData {
  /** Destination address for the transaction */
  to: string;
  /** Amount to send */
  amount: string;
  /** Asset type (e.g., 'XLM', 'USDC') */
  asset: string;
  /** Optional memo for the transaction */
  memo?: string;
}

// Transaction status types
export type OfflineTransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

// Offline transaction structure stored in IndexedDB
export interface OfflineTransaction {
  /** Unique transaction identifier */
  id: string;
  /** Transaction data */
  data: OfflineTransactionData;
  /** Timestamp when transaction was created */
  timestamp: number;
  /** Current status of the transaction */
  status: OfflineTransactionStatus;
}

// Response structure for offline transaction operations
export interface OfflineTransactionResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Response message */
  message: string;
  /** Whether the transaction was queued for offline processing */
  queued?: boolean;
  /** Transaction ID if queued */
  transactionId?: string;
  /** Additional response data */
  data?: unknown;
}

// Offline transaction result for UI display
export interface OfflineTransactionResult {
  /** Whether the transaction was successful */
  success: boolean;
  /** Result message */
  message: string;
  /** Whether the transaction was queued */
  queued?: boolean;
  /** Transaction ID if queued */
  transactionId?: string;
}

// Database schema for offline transactions
export interface OfflineTransactionDB {
  /** Transaction ID as key */
  key: string;
  /** Transaction data as value */
  value: OfflineTransaction;
}

// Statistics for offline operations
export interface OfflineStats {
  /** Number of pending transactions */
  pendingTransactions: number;
  /** Number of cached items */
  cachedItems: number;
  /** Last sync timestamp */
  lastSync: number | null;
}
