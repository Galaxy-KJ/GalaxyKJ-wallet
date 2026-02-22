# Galaxy DevKit CLI

Command-line interface for the Galaxy DevKit - Stellar blockchain development toolkit.

## Features

- ✅ **Wallet Management**: Create, import, list, and show Stellar wallets
- ✅ **Secure Storage**: Secret keys stored in system keychain (macOS Keychain, GNOME libsecret, Windows Credential Manager)
- ✅ **Network Support**: Testnet and mainnet
- ✅ **Backup/Restore**: Export and import wallet metadata
- ✅ **JSON Output**: Machine-readable output for all commands
- 🔄 **Coming Soon**: Multi-signature wallets, Ledger hardware wallet, biometric auth, social recovery

## Installation

### From Source

```bash
cd tools/cli
npm install
npm run build
npm link  # Makes 'galaxy' command available globally
```

### Verify Installation

```bash
galaxy --version
galaxy --help
```

## Quick Start

### 1. Create a New Wallet

```bash
galaxy wallet create my-wallet
```

Output:
```
✓ Wallet created successfully

  Name:       my-wallet
  Public Key: GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG
  Secret Key: SBD5K5R4P75TIOQ4HISTNQ7EOOF5RZVEBJT3PTY5CXAPN64B33TKBXU7
  Network:    testnet

⚠ Save your secret key! It will not be shown again.
  Secret key is stored in your system keychain.
```

### 2. List Wallets

```bash
galaxy wallet list
```

Output:
```
┌────────────┬──────────────────┬──────────┬──────────┬────────────┐
│ Name       │ Public Key       │ Network  │ Type     │ Created    │
├────────────┼──────────────────┼──────────┼──────────┼────────────┤
│ my-wallet  │ GCDPP...GEEYG    │ testnet  │ standard │ 2/22/2026  │
└────────────┴──────────────────┴──────────┴──────────┴────────────┘

1 wallet(s) total
```

### 3. Show Wallet Details

```bash
galaxy wallet show my-wallet
```

Output:
```
  Name:       my-wallet
  Public Key: GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG
  Network:    testnet
  Type:       standard
  Created:    2026-02-22T10:30:00.000Z

┌───────┬─────────────┐
│ Asset │ Balance     │
├───────┼─────────────┤
│ XLM   │ 10000.00000 │
└───────┴─────────────┘
```

### 4. Import an Existing Wallet

```bash
galaxy wallet import SBXXX... --name imported-wallet
```

### 5. Backup Wallets

```bash
galaxy wallet backup create --output ~/backups/wallets.json
```

### 6. Restore from Backup

```bash
galaxy wallet restore ~/backups/wallets.json
```

## Documentation

- [Wallet Commands](docs/cli/wallet.md) - Complete wallet command reference

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Development Mode

```bash
npm run dev -- wallet list
```

## Architecture

```
tools/cli/
├── src/
│   ├── index.ts                   # CLI entry point
│   ├── commands/wallet/
│   │   ├── index.ts               # Wallet command group
│   │   ├── create.ts              # Create/import commands
│   │   ├── list.ts                # List/show commands
│   │   ├── backup.ts              # Backup/restore commands
│   │   ├── multisig.ts            # Multi-sig (stub)
│   │   ├── ledger.ts              # Ledger (stub)
│   │   ├── biometric.ts           # Biometric (stub)
│   │   └── recovery.ts            # Social recovery (stub)
│   └── utils/
│       ├── wallet-storage.ts      # Config file + keytar wrapper
│       └── stellar-helpers.ts     # Network config + Horizon helpers
├── __tests__/
│   └── wallet/
│       └── wallet-commands.test.ts # 36 tests, all passing
└── docs/cli/
    └── wallet.md                   # Full command documentation
```

## Storage

- **Wallet Metadata**: `~/.galaxy/wallets/config.json`
- **Secret Keys**: System keychain
  - macOS: Keychain Access
  - Linux: GNOME Keyring (libsecret)
  - Windows: Credential Manager
- **Service Name**: `galaxy-devkit`

## Security

- Secret keys are **never** stored in plaintext
- AES-256-GCM encryption for wallet secrets
- System keychain integration via `keytar`
- Backup files contain **only** public keys and metadata (no secrets)
- Content Security Policy headers
- Input validation for all Stellar addresses and secret keys

## Dependencies

### Runtime

- `@stellar/stellar-sdk` - Stellar blockchain operations
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk` - Colored terminal output
- `ora` - Loading spinners
- `keytar` - System keychain access
- `cli-table3` - Table formatting

### Development

- `typescript` - Type safety
- `jest` - Testing framework
- `ts-jest` - TypeScript Jest integration

## System Requirements

- **Node.js**: >= 18.0.0
- **System Keychain**:
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Linux: libsecret (`sudo apt-get install libsecret-1-dev`)
  - Windows: Built-in Credential Manager

## Troubleshooting

### keytar Installation Fails

**Cause:** Missing native build tools.

**Solution:**
- **macOS**: `xcode-select --install`
- **Linux**: `sudo apt-get install build-essential libsecret-1-dev`
- **Windows**: Install Visual Studio Build Tools

### "System keychain not available"

**Cause:** keytar cannot access the system keychain.

**Solution:** Install system keychain dependencies (see System Requirements above).

## Roadmap

- [x] Wallet creation and import
- [x] Wallet listing and details
- [x] Backup and restore
- [x] Testnet funding via Friendbot
- [x] On-chain balance fetching
- [ ] Multi-signature wallet support (#73)
- [ ] Ledger hardware wallet integration (#74)
- [ ] Biometric authentication (#77)
- [ ] Social recovery system (#76)
- [ ] Transaction signing and broadcasting
- [ ] Asset management commands
- [ ] Payment path finding

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT

## Support

- [GitHub Issues](https://github.com/Galaxy-KJ/Galaxy-DevKit/issues)
- [Documentation](docs/cli/wallet.md)
- [Galaxy DevKit Main Repo](https://github.com/Galaxy-KJ/Galaxy-DevKit)
