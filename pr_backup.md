## Description
Implement Wallet Export & Backup functionality allowing users to download their wallet as an encrypted `.galaxy-wallet.json` keystore file. This ensures wallet recovery even if local browser storage (IndexedDB/LocalStorage) is cleared.

Closes #197

## Changes proposed

### What were you told to do?
- Add "Export Wallet Backup" functionality with passphrase confirmation.
- Implement `.galaxy-wallet.json` file format with versioning and checksums.
- Add "Import from Backup File" functionality.
- Create SDK methods: `exportWallet` and `importWallet`.
- Implement security best practices (AES-256-GCM, SHA-256 integrity checks).

### What did I do?

#### SDK Enhancements (`src/lib/galaxy-sdk.ts`)
- Added `exportWallet(walletId, passphrase)`: Fetches encrypted data from the backend and wraps it in a checksummed JSON.
- Added `importWallet(file, passphrase)`: Validates file integrity via checksum and restores the wallet to the ecosystem.
- Implemented `computeChecksum` using Web Crypto API (`SHA-256`).

#### API Architecture
- Created `POST /api/wallet/export`: Verifies the wallet and provides the encrypted secret, salt, and IV.
- Created `POST /api/wallet/import`: Handles the registration of imported keystores.

#### UI/UX (`src/components/WalletBackup.tsx`)
- Designed a premium **Security & Backup** card for the dashboard.
- Includes clear warnings about data loss risks.
- Implemented interactive modals for passphrase entry during both export and import.
- Integrated file upload handling for `.json` keystore files.

#### Type Safety
- Defined `GalaxyKeystore` interface in `src/types/index.ts`.

## Check List
- [x] My code follows the code style of this project.
- [x] The exported file is encrypted (no plaintext secrets).
- [x] Checksum validation prevents tampered files from being imported.
- [x] UI provides clear feedback for success and error states.
