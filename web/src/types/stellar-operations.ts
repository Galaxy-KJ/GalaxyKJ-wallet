/**
 * Type definitions for Stellar blockchain operations
 * 
 * This module provides comprehensive TypeScript interfaces for common Stellar operations
 * to ensure type safety and improve code maintainability when working with the Stellar SDK.
 * 
 * @module stellar-operations
 * @see {@link https://stellar.github.io/js-stellar-sdk/|Stellar SDK Documentation}
 */

import { Asset, Memo, MemoType, Operation, Transaction, Keypair } from '@stellar/stellar-sdk';
import type { Horizon } from '@stellar/stellar-sdk';

/**
 * Base interface for all Stellar operations
 * Contains common properties shared across all operation types
 */
export interface BaseOperation {
  /**
   * Optional source account public key for this operation
   * If not specified, the transaction's source account will be used
   * @example "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
   */
  source?: string;
}

/**
 * Payment operation parameters
 * Used to send assets from one account to another
 * 
 * @example
 * ```typescript
 * const payment: PaymentOperationParams = {
 *   destination: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
 *   asset: Asset.native(),
 *   amount: "100.50"
 * };
 * ```
 */
export interface PaymentOperationParams extends BaseOperation {
  /**
   * Destination account public key
   * Must be a valid Stellar public key (G... address)
   */
  destination: string;
  
  /**
   * Asset to send (native XLM or custom asset)
   * Use Asset.native() for XLM or new Asset(code, issuer) for custom assets
   */
  asset: Asset;
  
  /**
   * Amount to send as a string (supports up to 7 decimal places)
   * @example "100.5000000"
   */
  amount: string;
}

/**
 * Create account operation parameters
 * Used to create a new Stellar account with an initial balance
 * 
 * @example
 * ```typescript
 * const createAccount: CreateAccountOperationParams = {
 *   destination: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
 *   startingBalance: "2.0000000"
 * };
 * ```
 */
export interface CreateAccountOperationParams extends BaseOperation {
  /**
   * Public key of the new account to create
   * Must be a valid Stellar public key that doesn't already exist
   */
  destination: string;
  
  /**
   * Initial balance in XLM (minimum 1 XLM on mainnet, varies on testnet)
   * Must meet the minimum account reserve requirement
   * @example "2.0000000"
   */
  startingBalance: string;
}

/**
 * Change trust operation parameters
 * Used to establish or modify a trustline to an asset
 * 
 * @example
 * ```typescript
 * const changeTrust: ChangeTrustOperationParams = {
 *   asset: new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
 *   limit: "1000000"
 * };
 * ```
 */
export interface ChangeTrustOperationParams extends BaseOperation {
  /**
   * Asset to trust (cannot be native XLM)
   * Must be a custom asset with code and issuer
   */
  asset: Asset;
  
  /**
   * Maximum amount of the asset to trust
   * Set to "0" to remove the trustline
   * If undefined, defaults to maximum possible value
   * @example "1000000.0000000"
   */
  limit?: string;
}

/**
 * Path payment strict send operation parameters
 * Used for cross-asset payments where the send amount is fixed
 * 
 * @example
 * ```typescript
 * const pathPayment: PathPaymentStrictSendOperationParams = {
 *   sendAsset: Asset.native(),
 *   sendAmount: "100",
 *   destination: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
 *   destAsset: new Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
 *   destMin: "95",
 *   path: []
 * };
 * ```
 */
export interface PathPaymentStrictSendOperationParams extends BaseOperation {
  /**
   * Asset to send from source account
   */
  sendAsset: Asset;
  
  /**
   * Amount of sendAsset to send
   * This amount is fixed
   */
  sendAmount: string;
  
  /**
   * Destination account public key
   */
  destination: string;
  
  /**
   * Asset that destination will receive
   */
  destAsset: Asset;
  
  /**
   * Minimum amount of destAsset to receive
   * Transaction fails if this minimum cannot be met
   */
  destMin: string;
  
  /**
   * Optional array of assets to use as payment path
   * Stellar will find the best path if empty
   */
  path?: Asset[];
}

/**
 * Path payment strict receive operation parameters
 * Used for cross-asset payments where the receive amount is fixed
 */
export interface PathPaymentStrictReceiveOperationParams extends BaseOperation {
  /**
   * Asset to send from source account
   */
  sendAsset: Asset;
  
  /**
   * Maximum amount of sendAsset willing to send
   * Transaction fails if more is required
   */
  sendMax: string;
  
  /**
   * Destination account public key
   */
  destination: string;
  
  /**
   * Asset that destination will receive
   */
  destAsset: Asset;
  
  /**
   * Exact amount of destAsset to receive
   * This amount is fixed
   */
  destAmount: string;
  
  /**
   * Optional array of assets to use as payment path
   */
  path?: Asset[];
}

/**
 * Manage sell offer operation parameters
 * Used to create, update, or delete sell offers on the Stellar DEX
 */
export interface ManageSellOfferOperationParams extends BaseOperation {
  /**
   * Asset being sold
   */
  selling: Asset;
  
  /**
   * Asset being bought
   */
  buying: Asset;
  
  /**
   * Amount of selling asset to sell
   * Set to "0" to delete the offer
   */
  amount: string;
  
  /**
   * Price of 1 unit of selling in terms of buying
   * Can be a string or an object with n (numerator) and d (denominator)
   */
  price: string | { n: number; d: number };
  
  /**
   * Offer ID for updating or deleting existing offers
   * Set to "0" or omit to create a new offer
   */
  offerId?: string | number;
}

/**
 * Manage buy offer operation parameters
 * Used to create, update, or delete buy offers on the Stellar DEX
 */
export interface ManageBuyOfferOperationParams extends BaseOperation {
  /**
   * Asset being sold
   */
  selling: Asset;
  
  /**
   * Asset being bought
   */
  buying: Asset;
  
  /**
   * Amount of buying asset to buy
   * Set to "0" to delete the offer
   */
  buyAmount: string;
  
  /**
   * Price of 1 unit of buying in terms of selling
   */
  price: string | { n: number; d: number };
  
  /**
   * Offer ID for updating or deleting existing offers
   */
  offerId?: string | number;
}

/**
 * Union type for all supported Stellar operation parameters
 * Use this for functions that can accept any operation type
 */
export type StellarOperationParams =
  | PaymentOperationParams
  | CreateAccountOperationParams
  | ChangeTrustOperationParams
  | PathPaymentStrictSendOperationParams
  | PathPaymentStrictReceiveOperationParams
  | ManageSellOfferOperationParams
  | ManageBuyOfferOperationParams;

/**
 * Transaction building parameters
 * Used when constructing Stellar transactions
 */
export interface TransactionBuilderParams {
  /**
   * Source account for the transaction
   * Can be an AccountResponse from Horizon or a public key string
   */
  sourceAccount: Horizon.AccountResponse | string;
  
  /**
   * Transaction fee in stroops (1 XLM = 10,000,000 stroops)
   * Can be a string or number
   * @example "100" for 0.00001 XLM
   */
  fee: string | number;
  
  /**
   * Network passphrase (testnet or mainnet)
   * Use Networks.TESTNET or Networks.PUBLIC from @stellar/stellar-sdk
   */
  networkPassphrase: string;
  
  /**
   * Optional memo for the transaction
   */
  memo?: Memo;
  
  /**
   * Transaction timeout in seconds
   * Default is 180 seconds (3 minutes)
   */
  timebounds?: {
    minTime?: number | string;
    maxTime?: number | string;
  };
}

/**
 * Transaction submission result
 * Returned after successfully submitting a transaction to the network
 */
export interface TransactionResult {
  /**
   * Whether the transaction was successful
   */
  successful: boolean;
  
  /**
   * Transaction hash
   */
  hash: string;
  
  /**
   * Ledger number where transaction was included
   */
  ledger: number;
  
  /**
   * Transaction envelope XDR
   */
  envelope_xdr: string;
  
  /**
   * Transaction result XDR
   */
  result_xdr: string;
  
  /**
   * Fee charged in stroops
   */
  fee_charged: string;
}

/**
 * Memo types supported by Stellar
 */
export type StellarMemoType = 'none' | 'text' | 'id' | 'hash' | 'return';

/**
 * Helper type for creating memos
 */
export interface MemoParams {
  type: StellarMemoType;
  value?: string | number | Buffer;
}

/**
 * Account creation result
 * Returned when creating a new Stellar account
 */
export interface AccountCreationResult {
  /**
   * Public key of the created account
   */
  publicKey: string;
  
  /**
   * Secret key of the created account (keep secure!)
   */
  secretKey: string;
  
  /**
   * Initial balances of the account
   */
  balances?: Horizon.HorizonApi.BalanceLine[];
}

/**
 * Error response from Horizon API
 */
export interface HorizonErrorResponse {
  /**
   * Error type
   */
  type: string;
  
  /**
   * Error title
   */
  title: string;
  
  /**
   * HTTP status code
   */
  status: number;
  
  /**
   * Detailed error message
   */
  detail: string;
  
  /**
   * Additional error data
   */
  extras?: {
    result_codes?: {
      transaction?: string;
      operations?: string[];
    };
    [key: string]: unknown;
  };
}

