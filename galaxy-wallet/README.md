# Galaxy Wallet

A demo wallet application built with Next.js showcasing the **Galaxy SDK** (`@galaxy-kj/core-invisible-wallet` and `@galaxy-kj/core-stellar-sdk`) for Stellar blockchain integration.

## SDK Packages Used

```bash
npm install @galaxy-kj/core-invisible-wallet @galaxy-kj/core-stellar-sdk
```

- **`@galaxy-kj/core-invisible-wallet`** - Invisible wallet management with encrypted key storage
- **`@galaxy-kj/core-stellar-sdk`** - Stellar blockchain operations (payments, balances, transactions)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ useWallet   │  │ useBalance  │  │ useTransactions     │  │
│  │ Hook        │  │ Hook        │  │ Hook                │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         ▼                ▼                     ▼             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    API Routes                            ││
│  │  /api/wallet/create    /api/wallet/send                  ││
│  └──────────────────────────┬──────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Galaxy SDK                              │
│  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │ InvisibleWalletService  │  │ StellarService            │ │
│  │ • createWallet()        │  │ • sendPayment()           │ │
│  │ • getWalletById()       │  │ • getAccountInfo()        │ │
│  │ • unlockWallet()        │  │ • getTransactionHistory() │ │
│  └─────────────────────────┘  └───────────────────────────┘ │
│  ┌─────────────────────────┐                                │
│  │ NetworkUtils            │                                │
│  │ • fundTestnetAccount()  │                                │
│  └─────────────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Stellar Network                           │
│              (Testnet / Mainnet via Horizon)                 │
└─────────────────────────────────────────────────────────────┘
```

## SDK Usage Examples

### 1. Configuration

```typescript
// lib/galaxy-sdk.ts
export const GALAXY_CONFIG = {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
};
```

### 2. Create Wallet

```typescript
// api/wallet/create/route.ts
import { InvisibleWalletService, NetworkUtils } from '@galaxy-kj/core-invisible-wallet';

const invisibleWalletService = new InvisibleWalletService(GALAXY_CONFIG);
const networkUtils = new NetworkUtils();

// Create wallet with SDK
const result = await invisibleWalletService.createWallet(
    { userId, email, network: 'testnet' },
    password
);

// Fund on testnet using SDK
await networkUtils.fundTestnetAccount(result.wallet.publicKey);

// Returns: { wallet: { id, publicKey, ... }, session }
```

### 3. Get Wallet by ID

```typescript
// api/wallet/send/route.ts
const wallet = await invisibleWalletService.getWalletById(walletId);
// Returns wallet object with encryptedPrivateKey
```

### 4. Send Payment

```typescript
import { StellarService } from '@galaxy-kj/core-stellar-sdk';

const stellarService = new StellarService(GALAXY_CONFIG);

const result = await stellarService.sendPayment(
    wallet,  // { publicKey, privateKey (encrypted), ... }
    {
        destination: 'GXXX...',
        amount: '10.5',
        asset: 'XLM',
        memo: 'Optional memo',
    },
    password  // To decrypt the private key
);

// Returns: { hash, status, ledger }
```

### 5. Get Account Info & Balance

```typescript
const stellarService = new StellarService(GALAXY_CONFIG);

const accountInfo = await stellarService.getAccountInfo(publicKey);
// Returns: { accountId, sequence, balances: [{ asset, balance }], ... }

const balance = await stellarService.getBalance(publicKey, 'XLM');
// Returns: { asset: 'XLM', balance: '9999.99', ... }
```

### 6. Get Transaction History

```typescript
const history = await stellarService.getTransactionHistory(publicKey, 10);
// Returns: [{ hash, source, destination, amount, asset, status, createdAt }, ...]
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── wallet/
│   │       ├── create/route.ts   # Uses InvisibleWalletService.createWallet()
│   │       └── send/route.ts     # Uses StellarService.sendPayment()
│   └── page.tsx
├── components/
│   ├── WalletConnect.tsx         # Connect wallet UI
│   ├── SendForm.tsx              # Send payment form
│   ├── AssetList.tsx             # Display balances
│   └── TransactionList.tsx       # Display transaction history
├── hooks/
│   ├── useWallet.ts              # Wallet connection state
│   ├── useBalance.ts             # Uses StellarService.getAccountInfo()
│   ├── useTransactions.ts        # Uses StellarService.getTransactionHistory()
│   └── use-wallet-store.ts       # Zustand store for wallet state
├── lib/
│   └── galaxy-sdk.ts             # SDK configuration and lazy initialization
└── types/
    └── index.ts                  # TypeScript interfaces
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Tables

The SDK requires these tables in your Supabase database. Run this SQL in the Supabase SQL Editor:

```sql
-- Main wallet storage
CREATE TABLE invisible_wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    encrypted_seed TEXT,
    network TEXT NOT NULL DEFAULT 'testnet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    backup_status JSONB DEFAULT '{"isBackedUp": false, "backupMethod": "none"}'
);

-- Session management (optional, for unlock/lock features)
CREATE TABLE wallet_sessions (
    id SERIAL PRIMARY KEY,
    wallet_id TEXT NOT NULL REFERENCES invisible_wallets(id),
    user_id TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    device_info JSONB
);

-- Event logging (optional, for audit trail)
CREATE TABLE wallet_events (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL REFERENCES invisible_wallets(id),
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_wallets_user_id ON invisible_wallets(user_id);
CREATE INDEX idx_wallets_public_key ON invisible_wallets(public_key);
CREATE INDEX idx_sessions_wallet_id ON wallet_sessions(wallet_id);
CREATE INDEX idx_sessions_token ON wallet_sessions(session_token);
CREATE INDEX idx_events_wallet_id ON wallet_events(wallet_id);
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the wallet.

## Features

- **Wallet Creation** - Create invisible wallets with encrypted private keys
- **Testnet Funding** - Automatic funding via Friendbot
- **Send Payments** - Send XLM and custom assets
- **Transaction History** - View real transactions from the blockchain
- **Balance Display** - Real-time balance updates

## SDK Documentation

For more details on the Galaxy SDK:
- [@galaxy-kj/core-invisible-wallet](https://www.npmjs.com/package/@galaxy-kj/core-invisible-wallet)
- [@galaxy-kj/core-stellar-sdk](https://www.npmjs.com/package/@galaxy-kj/core-stellar-sdk)
