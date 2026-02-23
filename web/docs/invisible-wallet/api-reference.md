# API Reference

## 🔧 Core Interfaces and Types

### NetworkType
```typescript
type NetworkType = 'testnet' | 'mainnet';
```

### WalletStatus
```typescript
type WalletStatus = 'active' | 'inactive' | 'locked';
```

### InvisibleWallet
```typescript
interface InvisibleWallet {
  id: string; // UUID
  email: string;
  publicKey: string; // Stellar public key
  encryptedSecret: number[]; // Encrypted private key
  salt: number[]; // Salt used for key derivation
  iv: number[]; // Initialization vector for encryption
  platformId: string; // Client platform identifier
  network: NetworkType;
  status: WalletStatus;
  createdAt: string; // ISO timestamp
  lastAccessedAt?: string; // ISO timestamp
  metadata?: Record<string, unknown>; // Additional platform-specific data
}
```

### WalletResponse
```typescript
interface WalletResponse {
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
```

### WalletCreationResponse
```typescript
interface WalletCreationResponse extends WalletResponse {
  secretKey: string; // Only for demo/development purposes
}
```

### WalletWithBalance
```typescript
interface WalletWithBalance extends WalletResponse {
  balance: {
    native: string; // XLM balance
    assets: StellarBalance[]; // Other asset balances
  };
}
```

### StellarBalance
```typescript
interface StellarBalance {
  assetType: string;
  assetCode?: string;
  assetIssuer?: string;
  balance: string;
  limit?: string;
  buyingLiabilities?: string;
  sellingLiabilities?: string;
}
```

## 🎣 React Hook: useInvisibleWallet

### Configuration

```typescript
interface SDKConfig {
  /** Unique platform identifier */
  platformId: string;
  /** Default network for operations */
  defaultNetwork?: NetworkType;
  /** API endpoint for server-side operations */
  apiEndpoint?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom storage implementation */
  storage?: WalletStorage;
  /** Additional platform configuration */
  metadata?: Record<string, unknown>;
}
```

### Hook Usage

```typescript
const {
  // State
  wallet,
  isLoading,
  error,
  isInitialized,
  sdk,
  
  // Operations
  createWallet,
  createWalletWithKeys,
  recoverWallet,
  getWallet,
  signTransaction,
  
  // Utilities
  validatePassphrase,
  clearError,
  refreshWallet,
} = useInvisibleWallet(config);
```

### State Properties

#### `wallet: WalletWithBalance | null`
Currently loaded wallet with balance information.

#### `isLoading: boolean`
Indicates if any wallet operation is in progress.

#### `error: string | null`
Current error message, if any.

#### `isInitialized: boolean`
Indicates if the SDK has been successfully initialized.

#### `sdk: InvisibleWalletSDK | null`
Direct access to the SDK instance for advanced usage.

### Core Operations

#### `createWallet(email, passphrase, options?)`

Creates a new invisible wallet (production-safe).

**Parameters:**
- `email: string` - User's email address
- `passphrase: string` - Secure passphrase for encryption
- `options?: CreateWalletOptions` - Additional options

**Options:**
```typescript
interface CreateWalletOptions {
  network?: NetworkType;
  metadata?: Record<string, unknown>;
}
```

**Returns:** `Promise<WalletResponse>`

**Example:**
```typescript
const wallet = await createWallet(
  'user@example.com',
  'secure-passphrase-123',
  {
    network: 'testnet',
    metadata: { source: 'mobile-app', version: '1.0' }
  }
);
```

#### `createWalletWithKeys(email, passphrase, options?)`

Creates a new invisible wallet and returns private key (demo only).

**⚠️ Warning:** This method exposes the private key and should only be used for demonstrations and development.

**Parameters:** Same as `createWallet`

**Returns:** `Promise<WalletCreationResponse>`

**Example:**
```typescript
const walletWithKeys = await createWalletWithKeys(
  'user@example.com',
  'secure-passphrase-123',
  { network: 'testnet' }
);

console.log('Public Key:', walletWithKeys.publicKey);
console.log('Private Key:', walletWithKeys.secretKey); // Demo only!
```

#### `recoverWallet(email, passphrase, options?)`

Recovers an existing invisible wallet.

**Parameters:**
- `email: string` - User's email address
- `passphrase: string` - Original passphrase used during creation
- `options?: RecoverWalletOptions` - Additional options

**Options:**
```typescript
interface RecoverWalletOptions {
  network?: NetworkType;
}
```

**Returns:** `Promise<WalletResponse>`

**Example:**
```typescript
const wallet = await recoverWallet(
  'user@example.com',
  'secure-passphrase-123',
  { network: 'testnet' }
);
```

#### `getWallet(email, options?)`

Retrieves wallet information with current balance.

**Parameters:**
- `email: string` - User's email address
- `options?: GetWalletOptions` - Additional options

**Options:**
```typescript
interface GetWalletOptions {
  network?: NetworkType;
}
```

**Returns:** `Promise<WalletWithBalance | null>`

**Example:**
```typescript
const walletWithBalance = await getWallet('user@example.com', {
  network: 'testnet'
});

if (walletWithBalance) {
  console.log('XLM Balance:', walletWithBalance.balance.native);
  console.log('Other Assets:', walletWithBalance.balance.assets);
}
```

#### `signTransaction(walletId, email, passphrase, transactionXDR)`

Signs a Stellar transaction with the wallet's private key.

**Parameters:**
- `walletId: string` - Wallet ID
- `email: string` - User's email address
- `passphrase: string` - User's passphrase
- `transactionXDR: string` - Transaction in XDR format

**Returns:** `Promise<SignTransactionResponse>`

**Response:**
```typescript
interface SignTransactionResponse {
  success: boolean;
  signedXDR?: string;
  transactionHash?: string;
  error?: string;
  submittedToNetwork?: boolean;
  networkResponse?: any;
}
```

**Example:**
```typescript
const result = await signTransaction(
  walletId,
  'user@example.com',
  'secure-passphrase-123',
  'AAAAAgAAAAC...' // Transaction XDR
);

if (result.success) {
  console.log('Transaction signed:', result.signedXDR);
  console.log('Transaction hash:', result.transactionHash);
} else {
  console.error('Signing failed:', result.error);
}
```

### Utility Functions

#### `validatePassphrase(passphrase)`

Validates passphrase strength.

**Parameters:**
- `passphrase: string` - Passphrase to validate

**Returns:**
```typescript
{
  isValid: boolean;
  errors: string[];
}
```

**Example:**
```typescript
const validation = validatePassphrase('mypassword');
if (!validation.isValid) {
  console.log('Passphrase issues:', validation.errors);
}
```

#### `clearError()`

Clears the current error state.

**Example:**
```typescript
if (error) {
  clearError();
}
```

#### `refreshWallet()`

Refreshes the current wallet's balance information.

**Returns:** `Promise<void>`

**Example:**
```typescript
await refreshWallet();
```

## 🔧 Direct SDK Usage

For advanced use cases, you can use the SDK directly:

```typescript
import { createInvisibleWalletSDK } from '@/lib/invisible-wallet/sdk';

const sdk = createInvisibleWalletSDK({
  platformId: 'my-app',
  defaultNetwork: 'testnet',
  debug: true,
});

// Create wallet
const wallet = await sdk.createWallet('user@example.com', 'passphrase');

// Set up event listeners
sdk.on('walletCreated', (data) => {
  console.log('Wallet created:', data);
});

sdk.on('transactionSigned', (data) => {
  console.log('Transaction signed:', data);
});

sdk.on('error', (error) => {
  console.error('SDK error:', error);
});
```

### SDK Events

#### `walletCreated`
Emitted when a wallet is successfully created.
```typescript
{
  walletId: string;
  email: string;
  publicKey: string;
  network: NetworkType;
}
```

#### `walletRecovered`
Emitted when a wallet is successfully recovered.
```typescript
{
  walletId: string;
  email: string;
  publicKey: string;
  network: NetworkType;
}
```

#### `transactionSigned`
Emitted when a transaction is successfully signed.
```typescript
{
  walletId: string;
  transactionHash: string;
  signedXDR: string;
}
```

#### `error`
Emitted when an error occurs.
```typescript
{
  operation: string;
  error: string;
  details?: any;
}
```

## 🚨 Error Codes

### Common Error Types

```typescript
enum InvisibleWalletError {
  // Wallet Management
  WALLET_ALREADY_EXISTS = 'WALLET_ALREADY_EXISTS',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSPHRASE = 'WEAK_PASSPHRASE',
  INVALID_NETWORK = 'INVALID_NETWORK',
  
  // Cryptography
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  KEY_DERIVATION_FAILED = 'KEY_DERIVATION_FAILED',
  
  // Stellar Network
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SEQUENCE_NUMBER_MISMATCH = 'SEQUENCE_NUMBER_MISMATCH',
  BAD_AUTH = 'BAD_AUTH',
  TX_FAILED = 'TX_FAILED',
  TX_TIMEOUT = 'TX_TIMEOUT',
  INVALID_TRANSACTION_XDR = 'INVALID_TRANSACTION_XDR',
  
  // Storage
  STORAGE_ERROR = 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  FUNDING_FAILED = 'FUNDING_FAILED',
}
```

### Error Handling Utilities

```typescript
import { InvisibleWalletErrorHandler } from '@/lib/invisible-wallet';

// Check specific error type
if (InvisibleWalletErrorHandler.isInvisibleWalletError(error, 'WALLET_ALREADY_EXISTS')) {
  console.log('Wallet already exists, try recovering instead');
}

// Get user-friendly message
const friendlyMessage = InvisibleWalletErrorHandler.getUserFriendlyMessage(error);
console.log(friendlyMessage);
```

## 🔒 Security Considerations

### Passphrase Requirements

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- No common dictionary words
- Not based on personal information

### Storage Security

- Private keys are encrypted with AES-256-GCM
- Salt and IV are unique per wallet
- PBKDF2 with 100,000 iterations
- IndexedDB for local storage (encrypted data only)

### Network Security

- All Stellar operations use HTTPS
- Transaction signing happens locally
- Private keys never transmitted over network
- CSP-compliant implementation

## 📊 Performance Notes

### Initialization Time
- SDK initialization: ~50ms
- IndexedDB setup: ~100ms
- First wallet creation: ~500ms (includes key derivation)

### Storage Limits
- IndexedDB: ~50MB per domain (browser-dependent)
- Estimated capacity: ~10,000 wallets per domain

### Network Calls
- Balance updates: ~200ms (Horizon API)
- Transaction submission: ~1-3s (network confirmation)
- Testnet funding: ~2-5s (Friendbot response)

## 💵 USDC (Stablecoin) — API

The SDK exposes high-level helpers to manage USDC operations (trustline and transfers).

### `establishUSDCTrustline(walletId: string, email: string, passphrase: string): Promise<void>`
- Purpose: Add the USDC trustline for the wallet so it can receive USDC.
- Usage: Call once per wallet (per network) before receiving USDC.

### `sendUSDC(params: { walletId: string; email: string; passphrase: string; toAddress: string; amount: string; }): Promise<{ transactionHash: string }>`
- Purpose: Send USDC from the wallet to `toAddress`.
- Returns: Object containing `transactionHash` when the transfer is accepted.

### `usdcBalance`
- Runtime property returned by the hook/SDK when available. `null` means no trustline present.

### Common errors
- `INSUFFICIENT_BALANCE` — not enough USDC to complete transfer.
- `ACCOUNT_NOT_FOUND` — destination account not funded / not found.
- `NO_TRUSTLINE` — caller wallet must add trustline before receiving USDC.

### Example (pseudo)
```
await establishUSDCTrustline(walletId, email, passphrase)
const res = await sendUSDC({ walletId, email, passphrase, toAddress: 'G...', amount: '2.50' })
console.log(res.transactionHash)
```
