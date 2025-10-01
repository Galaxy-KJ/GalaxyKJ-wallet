# Stellar Operations Type Definitions

This document provides comprehensive documentation for the TypeScript type definitions used for Stellar blockchain operations in the Galaxy Smart Wallet.

## Overview

The `stellar-operations.ts` file contains type-safe interfaces for common Stellar operations, ensuring compile-time type checking and improved developer experience when working with the Stellar SDK.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Type Definitions](#type-definitions)
  - [Payment Operations](#payment-operations)
  - [Account Creation](#account-creation)
  - [Trust Line Management](#trust-line-management)
  - [Path Payments](#path-payments)
  - [DEX Operations](#dex-operations)
- [Integration with Stellar SDK](#integration-with-stellar-sdk)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Installation

The types are already included in the project. Simply import them:

```typescript
import type {
  PaymentOperationParams,
  CreateAccountOperationParams,
  ChangeTrustOperationParams,
  // ... other types
} from '@/types/stellar-operations';
```

## Basic Usage

### Using with StellarService

```typescript
import { stellarService } from '@/lib/stellar/stellar-service';
import { Asset } from '@stellar/stellar-sdk';
import type { PaymentOperationParams } from '@/types/stellar-operations';

// Initialize the service
await stellarService.initialize('https://horizon-testnet.stellar.org');

// Create a payment operation with type safety
const paymentParams: PaymentOperationParams = {
  destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  asset: Asset.native(),
  amount: '100.5000000',
};

const operation = stellarService.buildPaymentOperation(paymentParams);
```

## Type Definitions

### Payment Operations

**PaymentOperationParams**

Used to send assets from one account to another.

```typescript
interface PaymentOperationParams {
  destination: string;      // Destination public key (G... address)
  asset: Asset;            // Asset to send (native XLM or custom)
  amount: string;          // Amount as string (up to 7 decimal places)
  source?: string;         // Optional source account
}
```

**Example:**

```typescript
const payment: PaymentOperationParams = {
  destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  asset: Asset.native(),
  amount: '100.5000000',
};
```

### Account Creation

**CreateAccountOperationParams**

Used to create a new Stellar account with an initial balance.

```typescript
interface CreateAccountOperationParams {
  destination: string;      // Public key of new account
  startingBalance: string;  // Initial balance in XLM (min 1 XLM on mainnet)
  source?: string;         // Optional source account
}
```

**Example:**

```typescript
const createAccount: CreateAccountOperationParams = {
  destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  startingBalance: '2.0000000',
};
```

### Trust Line Management

**ChangeTrustOperationParams**

Used to establish or modify a trustline to an asset.

```typescript
interface ChangeTrustOperationParams {
  asset: Asset;      // Asset to trust (cannot be native XLM)
  limit?: string;    // Max amount to trust (undefined = max, "0" = remove)
  source?: string;   // Optional source account
}
```

**Example:**

```typescript
const changeTrust: ChangeTrustOperationParams = {
  asset: new Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  limit: '1000000.0000000',
};
```

### Path Payments

**PathPaymentStrictSendOperationParams**

Cross-asset payment where the send amount is fixed.

```typescript
interface PathPaymentStrictSendOperationParams {
  sendAsset: Asset;       // Asset to send
  sendAmount: string;     // Fixed amount to send
  destination: string;    // Destination public key
  destAsset: Asset;       // Asset to receive
  destMin: string;        // Minimum amount to receive
  path?: Asset[];         // Optional payment path
  source?: string;        // Optional source account
}
```

**PathPaymentStrictReceiveOperationParams**

Cross-asset payment where the receive amount is fixed.

```typescript
interface PathPaymentStrictReceiveOperationParams {
  sendAsset: Asset;       // Asset to send
  sendMax: string;        // Maximum amount willing to send
  destination: string;    // Destination public key
  destAsset: Asset;       // Asset to receive
  destAmount: string;     // Fixed amount to receive
  path?: Asset[];         // Optional payment path
  source?: string;        // Optional source account
}
```

### DEX Operations

**ManageSellOfferOperationParams**

Create, update, or delete sell offers on the Stellar DEX.

```typescript
interface ManageSellOfferOperationParams {
  selling: Asset;                           // Asset being sold
  buying: Asset;                            // Asset being bought
  amount: string;                           // Amount to sell ("0" = delete)
  price: string | { n: number; d: number }; // Price ratio
  offerId?: string | number;                // Offer ID (0 = new offer)
  source?: string;                          // Optional source account
}
```

## Integration with Stellar SDK

All type definitions are designed to be fully compatible with the Stellar SDK's `Operation` class:

```typescript
import { Operation, Asset } from '@stellar/stellar-sdk';
import type { PaymentOperationParams } from '@/types/stellar-operations';

const params: PaymentOperationParams = {
  destination: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  asset: Asset.native(),
  amount: '100.0000000',
};

// Direct usage with Stellar SDK
const operation = Operation.payment(params);
```

## Best Practices

### 1. Always Use String for Amounts

Stellar uses 7 decimal places for precision. Always use strings to avoid floating-point errors:

```typescript
//  Good
amount: '100.5000000'

// Bad
amount: 100.5  // May lose precision
```

### 2. Validate Public Keys

Ensure public keys are valid Stellar addresses (56 characters, starting with 'G'):

```typescript
import { Keypair } from '@stellar/stellar-sdk';

try {
  Keypair.fromPublicKey(destination);
  // Valid public key
} catch (error) {
  // Invalid public key
}
```

### 3. Handle Errors Properly

Use try-catch blocks when building operations:

```typescript
try {
  const operation = stellarService.buildPaymentOperation(params);
} catch (error) {
  console.error('Failed to build operation:', error);
}
```

### 4. Use Type Guards for Union Types

When working with `StellarOperationParams`, use type guards:

```typescript
function isPaymentOperation(
  op: StellarOperationParams
): op is PaymentOperationParams {
  return 'destination' in op && 'asset' in op && 'amount' in op;
}
```

## Examples

### Complete Payment Transaction

```typescript
import { stellarService } from '@/lib/stellar/stellar-service';
import { Asset, Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import type { PaymentOperationParams } from '@/types/stellar-operations';

async function sendPayment(
  sourceSecret: string,
  destination: string,
  amount: string
) {
  // Initialize service
  await stellarService.initialize('https://horizon-testnet.stellar.org');
  
  const sourceKeypair = Keypair.fromSecret(sourceSecret);
  const server = stellarService.getServer();
  
  // Load source account
  const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());
  
  // Build payment operation
  const paymentParams: PaymentOperationParams = {
    destination,
    asset: Asset.native(),
    amount,
  };
  
  const paymentOp = stellarService.buildPaymentOperation(paymentParams);
  
  // Build transaction
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(paymentOp)
    .setTimeout(180)
    .build();
  
  // Sign and submit
  transaction.sign(sourceKeypair);
  const result = await server.submitTransaction(transaction);
  
  return result;
}
```

### Creating a New Account

```typescript
import type { CreateAccountOperationParams } from '@/types/stellar-operations';

const createAccountParams: CreateAccountOperationParams = {
  destination: newAccountPublicKey,
  startingBalance: '2.0000000',
};

const operation = stellarService.buildCreateAccountOperation(createAccountParams);
```

### Establishing a Trustline

```typescript
import type { ChangeTrustOperationParams } from '@/types/stellar-operations';

const trustlineParams: ChangeTrustOperationParams = {
  asset: new Asset('USDC', issuerPublicKey),
  limit: '1000000.0000000',
};

const operation = stellarService.buildChangeTrustOperation(trustlineParams);
```

### Path Payment (Token Swap)

```typescript
import type { PathPaymentStrictSendOperationParams } from '@/types/stellar-operations';

const swapParams: PathPaymentStrictSendOperationParams = {
  sendAsset: Asset.native(),
  sendAmount: '100.0000000',
  destination: myPublicKey,
  destAsset: new Asset('USDC', issuerPublicKey),
  destMin: '95.0000000', // 5% slippage protection
};

const operation = stellarService.buildPathPaymentStrictSendOperation(swapParams);
```

## Testing

Comprehensive unit tests are available in:
- `web/src/types/__tests__/stellar-operations.test.ts`
- `web/src/lib/stellar/__tests__/stellar-service.test.ts`

Run tests with:
```bash
npm test
```

## Additional Resources

- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Operations Guide](https://developers.stellar.org/docs/fundamentals-and-concepts/list-of-operations)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Contributing

When adding new operation types:

1. Define the interface in `stellar-operations.ts`
2. Add JSDoc comments with examples
3. Create corresponding builder methods in `stellar-service.ts`
4. Add unit tests
5. Update this README

## License

This code is part of the Galaxy Smart Wallet project.

