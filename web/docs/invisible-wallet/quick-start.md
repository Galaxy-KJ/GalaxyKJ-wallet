# Quick Start Guide

## 🚀 Getting Started with Invisible Wallets

This guide will walk you through integrating Invisible Wallets into your application in just a few minutes.

## 📋 Prerequisites

- React 18+ application
- TypeScript support
- Modern browser with Web Crypto API support

## 🔧 Basic Setup

### 1. Import the Hook

```typescript
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';
import { NetworkType } from '@/types/invisible-wallet';
```

### 2. Configure the SDK

```typescript
const WALLET_CONFIG = {
  platformId: 'my-app-v1', // Unique identifier for your platform
  defaultNetwork: 'testnet' as NetworkType, // Start with testnet
  debug: true, // Enable console logging
  apiEndpoint: undefined, // Use local storage (no server required)
};
```

### 3. Create Your First Component

```typescript
'use client';

import React, { useState } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';
import { NetworkType } from '@/types/invisible-wallet';

const WALLET_CONFIG = {
  platformId: 'my-app-v1',
  defaultNetwork: 'testnet' as NetworkType,
  debug: true,
};

export function MyWalletComponent() {
  const {
    createWalletWithKeys,
    recoverWallet,
    getWallet,
    signTransaction,
    wallet,
    isLoading,
    error,
    clearError
  } = useInvisibleWallet(WALLET_CONFIG);

  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [createdWallet, setCreatedWallet] = useState(null);

  const handleCreateWallet = async () => {
    try {
      const result = await createWalletWithKeys(email, passphrase, {
        network: 'testnet',
        metadata: { source: 'my-app', timestamp: new Date().toISOString() }
      });
      
      setCreatedWallet(result);
      console.log('Wallet created successfully!', result);
    } catch (err) {
      console.error('Failed to create wallet:', err);
    }
  };

  const handleRecoverWallet = async () => {
    try {
      const result = await recoverWallet(email, passphrase, {
        network: 'testnet'
      });
      console.log('Wallet recovered successfully!', result);
    } catch (err) {
      console.error('Failed to recover wallet:', err);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Wallet App</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
          <p className="text-red-800">{error}</p>
          <button onClick={clearError} className="text-red-600 underline">
            Clear Error
          </button>
        </div>
      )}

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        
        <input
          type="password"
          placeholder="Enter a secure passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <div className="flex gap-2">
          <button
            onClick={handleCreateWallet}
            disabled={isLoading || !email || !passphrase}
            className="flex-1 bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Wallet'}
          </button>
          
          <button
            onClick={handleRecoverWallet}
            disabled={isLoading || !email || !passphrase}
            className="flex-1 bg-green-500 text-white p-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Recovering...' : 'Recover Wallet'}
          </button>
        </div>
      </div>

      {createdWallet && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-semibold text-green-800 mb-2">✅ Wallet Created!</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Public Key:</strong>
              <code className="block bg-white p-2 rounded mt-1 font-mono text-xs">
                {createdWallet.publicKey}
              </code>
            </div>
            <div>
              <strong>Wallet ID:</strong>
              <code className="block bg-white p-2 rounded mt-1 font-mono text-xs">
                {createdWallet.id}
              </code>
            </div>
          </div>
        </div>
      )}

      {wallet && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">Current Wallet</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Email:</strong> {wallet.email}</p>
            <p><strong>Network:</strong> {wallet.network}</p>
            <p><strong>Balance:</strong> {wallet.balance?.native || '0'} XLM</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 🎯 Core Operations

### Creating a Wallet

```typescript
// For production (secure)
const wallet = await createWallet(email, passphrase, {
  network: 'testnet',
  metadata: { source: 'my-app' }
});

// For demo/development (exposes private key)
const walletWithKeys = await createWalletWithKeys(email, passphrase, {
  network: 'testnet',
  metadata: { source: 'my-app' }
});
```

### Recovering a Wallet

```typescript
const wallet = await recoverWallet(email, passphrase, {
  network: 'testnet'
});
```

### Getting Wallet Info

```typescript
const walletWithBalance = await getWallet(email, {
  network: 'testnet'
});
```

### Signing Transactions

```typescript
// First, create a transaction XDR (example using Stellar SDK)
import { TransactionBuilder, Account, Operation, Networks } from '@stellar/stellar-sdk';

// Create a simple payment transaction
const account = new Account(sourcePublicKey, sequenceNumber);
const transaction = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: Networks.TESTNET
})
.addOperation(Operation.payment({
  destination: 'GDESTINATION...',
  asset: Asset.native(),
  amount: '10'
}))
.setTimeout(300)
.build();

const transactionXDR = transaction.toXDR();

// Sign with Invisible Wallet
const result = await signTransaction(
  walletId,
  email,
  passphrase,
  transactionXDR
);

console.log('Signed transaction:', result.signedXDR);
console.log('Transaction hash:', result.transactionHash);
```

## USDC Quick Flow

1. Create or recover a wallet on the demo (home page).
2. Switch to the `USDC` tab in the demo UI.
3. Click `Add USDC Trustline` (this calls `establishUSDCTrustline`).
4. Enter a destination Stellar address and amount, then click `Send USDC` (this calls `sendUSDC`).
5. Confirm the transaction hash returned in the result.

Notes:
- On `testnet` the demo may fund test accounts automatically; on `mainnet` you must fund the account first.
- If `sendUSDC` fails with `NO_TRUSTLINE`, ensure the sender has an established trustline.

## 🔍 Validation

### Passphrase Validation

```typescript
const validation = validatePassphrase('my-passphrase');
console.log('Is valid:', validation.isValid);
console.log('Errors:', validation.errors);
```

## 📱 Error Handling

```typescript
try {
  const wallet = await createWallet(email, passphrase);
} catch (error) {
  if (error.message.includes('WALLET_ALREADY_EXISTS')) {
    console.log('Wallet already exists, try recovering instead');
  } else if (error.message.includes('WEAK_PASSPHRASE')) {
    console.log('Please use a stronger passphrase');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 🌐 Network Configuration

### Testnet (Development)

```typescript
const config = {
  platformId: 'my-app-dev',
  defaultNetwork: 'testnet' as NetworkType,
  debug: true,
};
```

### Mainnet (Production)

```typescript
const config = {
  platformId: 'my-app-prod',
  defaultNetwork: 'mainnet' as NetworkType,
  debug: false,
};
```

## 🔧 Advanced Configuration

### Custom Storage

```typescript
import { createInvisibleWalletSDK } from '@/lib/invisible-wallet/sdk';

// Use custom storage implementation
const sdk = createInvisibleWalletSDK({
  platformId: 'my-app',
  defaultNetwork: 'testnet',
  storage: myCustomStorage, // Implement WalletStorage interface
});
```

### Event Handling

```typescript
const { sdk } = useInvisibleWallet(config);

useEffect(() => {
  if (!sdk) return;

  const handleWalletCreated = (data) => {
    console.log('Wallet created event:', data);
  };

  const handleError = (error) => {
    console.error('Wallet error:', error);
  };

  sdk.on('walletCreated', handleWalletCreated);
  sdk.on('error', handleError);

  return () => {
    sdk.off('walletCreated', handleWalletCreated);
    sdk.off('error', handleError);
  };
}, [sdk]);
```

## 🚀 Next Steps

1. **Try the Demo**: Visit `/invisible-wallet` to see all features in action
2. **Read the API Reference**: Detailed documentation of all methods and types
3. **Explore Security**: Learn about the cryptographic design
4. **Production Setup**: Configure for production deployment

## ⚠️ Important Notes

- **Demo vs Production**: Use `createWalletWithKeys` only for demos. Use `createWallet` in production.
- **Passphrase Security**: Encourage users to use strong, unique passphrases
- **Network Selection**: Always specify the correct network (testnet vs mainnet)
- **Error Handling**: Always wrap wallet operations in try-catch blocks
- **Browser Compatibility**: Requires modern browsers with Web Crypto API support
