# Galaxy CLI - Wallet Commands

Manage Stellar wallets from the command line using the Galaxy DevKit CLI.

## Installation

```bash
cd tools/cli
npm install
npm run build
npm link  # Makes 'galaxy' command available globally
```

## Commands

### Create a New Wallet

Generate a new Stellar wallet with a random keypair.

```bash
galaxy wallet create <name> [--network testnet|mainnet]
```

**Options:**
- `name` - Unique wallet identifier (letters, numbers, hyphens, underscores, 1-32 characters)
- `--network` - Target network (default: testnet)
- `--json` - Output as JSON

**Examples:**
```bash
# Create a testnet wallet
galaxy wallet create my-wallet

# Create a mainnet wallet
galaxy wallet create production-wallet --network mainnet

# Create and output JSON
galaxy wallet create api-wallet --json
```

**Output:**
- Wallet name
- Public key (Stellar address starting with `G`)
- Secret key (⚠️  **Save this!** It will not be shown again)
- Network
- Testnet accounts are automatically funded via Friendbot

**Storage:**
- Metadata stored in `~/.galaxy/wallets/config.json`
- Secret keys stored in system keychain (macOS Keychain, GNOME libsecret, Windows Credential Manager)

---

### Import an Existing Wallet

Import a wallet using its secret key.

```bash
galaxy wallet import <secret-key> [--name <name>] [--network testnet|mainnet]
```

**Options:**
- `secret-key` - Stellar secret key (starts with `S`, 56 characters)
- `--name` - Wallet name (required if not interactive)
- `--network` - Target network (default: testnet)
- `--json` - Output as JSON

**Examples:**
```bash
# Import with interactive prompt for name
galaxy wallet import SBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Import with explicit name
galaxy wallet import SBXXX --name imported-wallet --network mainnet

# Import and output JSON
galaxy wallet import SBXXX --name api-wallet --json
```

---

### List All Wallets

Display all configured wallets.

```bash
galaxy wallet list [--json]
```

**Options:**
- `--json` - Output as JSON array

**Examples:**
```bash
# Table format
galaxy wallet list

# JSON format
galaxy wallet list --json
```

**Output:**
```
┌──────────────┬──────────────────┬──────────┬──────────┬────────────┐
│ Name         │ Public Key       │ Network  │ Type     │ Created    │
├──────────────┼──────────────────┼──────────┼──────────┼────────────┤
│ my-wallet    │ GCDPP...GEEYG    │ testnet  │ standard │ 2/22/2026  │
│ prod-wallet  │ GDABC...XYZ12    │ mainnet  │ standard │ 2/21/2026  │
└──────────────┴──────────────────┴──────────┴──────────┴────────────┘

2 wallet(s) total
```

---

### Show Wallet Details

Display detailed information about a specific wallet, including on-chain balances.

```bash
galaxy wallet show <name> [--json]
```

**Options:**
- `name` - Wallet name
- `--json` - Output as JSON

**Examples:**
```bash
# Show wallet details
galaxy wallet show my-wallet

# JSON output
galaxy wallet show my-wallet --json
```

**Output:**
```
  Name:       my-wallet
  Public Key: GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG
  Network:    testnet
  Type:       standard
  Created:    2026-02-22T10:30:00.000Z

┌───────────┬────────────────┐
│ Asset     │ Balance        │
├───────────┼────────────────┤
│ XLM       │ 10000.0000000  │
│ USDC:G... │ 500.0000000    │
└───────────┴────────────────┘
```

If the account is not funded on-chain, displays:
```
  Account not funded on testnet
```

---

### Backup Wallet Metadata

Export wallet metadata (public keys, names, networks) to a file. **Does not include secret keys.**

```bash
galaxy wallet backup create --output <file>
```

**Options:**
- `--output` - Output file path

**Examples:**
```bash
galaxy wallet backup create --output ~/backups/wallets-2026-02-22.json
```

**Output:**
```
✓ Backed up 3 wallet(s) to /Users/you/backups/wallets-2026-02-22.json
⚠ This backup does NOT include secret keys.
  Secret keys are stored in your system keychain.
```

**Backup format:**
```json
{
  "version": 1,
  "createdAt": "2026-02-22T10:30:00.000Z",
  "wallets": [
    {
      "name": "my-wallet",
      "publicKey": "GCDPP...",
      "type": "standard",
      "network": "testnet",
      "createdAt": "2026-02-22T08:00:00.000Z"
    }
  ]
}
```

---

### Restore Wallet Metadata

Restore wallet metadata from a backup file.

```bash
galaxy wallet restore <file>
```

**Options:**
- `file` - Backup file path

**Examples:**
```bash
galaxy wallet restore ~/backups/wallets-2026-02-22.json
```

**Output:**
```
✓ Restored 3 wallet(s).
  Skipped 1 wallet(s).

  Note: Restored wallets do not have secret keys.
  Use "galaxy wallet import" to add secret keys.
```

**Behavior:**
- Skips wallets that already exist (by name)
- Validates public keys before importing
- Does NOT restore secret keys (use `galaxy wallet import` to add them manually)

---

## Advanced Commands (Coming Soon)

The following commands are planned but not yet implemented. They depend on underlying wallet libraries currently in development.

### Multi-Signature Wallets

```bash
# Create multi-sig wallet
galaxy wallet multisig create --threshold <n> --signers <addresses>

# Sign a multi-sig transaction
galaxy wallet multisig sign <tx-id>
```

**Status:** Not yet implemented. Depends on [@galaxy/wallet/multisig](https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/73) (#73)

---

### Ledger Hardware Wallet

```bash
# Connect to Ledger device
galaxy wallet ledger connect

# List accounts on Ledger
galaxy wallet ledger accounts [--start-index 0] [--count 5]
```

**Status:** Not yet implemented. Depends on [@galaxy/wallet/auth/hardware](https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/74) (#74)

---

### Biometric Authentication

```bash
# Set up biometric authentication
galaxy wallet biometric setup

# Sign with biometric auth
galaxy wallet biometric sign <transaction>
```

**Status:** Not yet implemented. Depends on [@galaxy/wallet/auth](https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/77) (#77)

---

### Social Recovery

```bash
# Configure social recovery with guardians
galaxy wallet recovery setup --guardians <addresses> [--threshold n]

# Initiate wallet recovery
galaxy wallet recovery initiate
```

**Status:** Not yet implemented. Depends on [@galaxy/wallet/recovery](https://github.com/Galaxy-KJ/Galaxy-DevKit/issues/76) (#76)

---

## Security Best Practices

1. **Secret Keys**: Never share your secret key. It grants full access to your wallet.
2. **Backups**: Regularly back up your wallet metadata with `galaxy wallet backup create`.
3. **System Keychain**: Secret keys are stored in your system keychain (macOS Keychain, GNOME libsecret, Windows Credential Manager). Ensure your system keychain is protected with a password.
4. **Networks**: Use testnet for development/testing. Switch to mainnet only for production.
5. **Verification**: Before sending real funds, verify the recipient's public key and network.

---

## Troubleshooting

### "System keychain not available"

**Cause:** keytar cannot access the system keychain.

**Solution:**
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Install libsecret: `sudo apt-get install libsecret-1-dev` (Ubuntu/Debian) or `sudo yum install libsecret-devel` (Red Hat/Fedora)
- **Windows**: Should work out of the box with Credential Manager

### "Wallet config file is corrupted"

**Cause:** `~/.galaxy/wallets/config.json` contains invalid JSON.

**Solution:**
1. Back up the file (if possible)
2. Delete `~/.galaxy/wallets/config.json`
3. Restore from a backup using `galaxy wallet restore`, or recreate/import wallets manually

### "Invalid public key" or "Invalid secret key"

**Cause:** The key format is incorrect.

**Solution:**
- Public keys start with `G` and are 56 characters long
- Secret keys start with `S` and are 56 characters long
- Ensure no extra whitespace or typos

---

## Configuration Files

- **Config File**: `~/.galaxy/wallets/config.json` - Stores wallet metadata (public keys, names, networks)
- **Secret Storage**: System keychain (platform-specific) - Stores encrypted secret keys
- **Service Name**: `galaxy-devkit` (used in keychain lookups)

---

## JSON Output Format

All commands support `--json` for machine-readable output.

**Example:**
```json
{
  "name": "my-wallet",
  "publicKey": "GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG",
  "secretKey": "SBXXX...",
  "network": "testnet",
  "createdAt": "2026-02-22T10:30:00.000Z"
}
```

---

## Getting Help

```bash
galaxy wallet --help
galaxy wallet create --help
galaxy wallet import --help
# ... etc
```

For issues or feature requests, visit: [GitHub Issues](https://github.com/Galaxy-KJ/Galaxy-DevKit/issues)
