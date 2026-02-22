import * as path from 'path';
import * as os from 'os';

// --- Mocks ---

// In-memory keytar mock
const secretStore = new Map<string, string>();
jest.mock('keytar', () => ({
  setPassword: jest.fn(async (_service: string, account: string, password: string) => {
    secretStore.set(account, password);
  }),
  getPassword: jest.fn(async (_service: string, account: string) => {
    return secretStore.get(account) ?? null;
  }),
  deletePassword: jest.fn(async (_service: string, account: string) => {
    return secretStore.delete(account);
  }),
}));

// In-memory filesystem mock
let configFileContent: string | null = null;
jest.mock('fs/promises', () => ({
  readFile: jest.fn(async () => {
    if (configFileContent === null) {
      const err: any = new Error('ENOENT');
      err.code = 'ENOENT';
      throw err;
    }
    return configFileContent;
  }),
  writeFile: jest.fn(async (_path: string, content: string) => {
    // If writing to .tmp file, store it temporarily; rename will commit it
    if (_path.endsWith('.tmp')) {
      (global as any).__tmpContent = content;
    } else {
      configFileContent = content;
    }
  }),
  rename: jest.fn(async () => {
    // Commit the tmp write
    if ((global as any).__tmpContent !== undefined) {
      configFileContent = (global as any).__tmpContent;
      delete (global as any).__tmpContent;
    }
  }),
  mkdir: jest.fn(async () => {}),
}));

// Partial stellar-sdk mock - keep StrKey real, mock Keypair and Horizon
const MOCK_PUBLIC = 'GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG';
const MOCK_SECRET = 'SBD5K5R4P75TIOQ4HISTNQ7EOOF5RZVEBJT3PTY5CXAPN64B33TKBXU7';

jest.mock('@stellar/stellar-sdk', () => {
  const actual = jest.requireActual('@stellar/stellar-sdk');
  return {
    ...actual,
    Keypair: {
      random: jest.fn(() => ({
        publicKey: () => MOCK_PUBLIC,
        secret: () => MOCK_SECRET,
      })),
      fromSecret: jest.fn((secret: string) => {
        // Use real StrKey validation
        if (!actual.StrKey.isValidEd25519SecretSeed(secret)) {
          throw new Error('Invalid secret key');
        }
        return {
          publicKey: () => MOCK_PUBLIC,
          secret: () => secret,
        };
      }),
    },
    Horizon: {
      Server: jest.fn(() => ({
        loadAccount: jest.fn(async (publicKey: string) => ({
          balances: [
            { asset_type: 'native', balance: '100.0000000' },
          ],
        })),
      })),
    },
  };
});

// Mock ora
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  }));
});

// Mock fetch for friendbot
global.fetch = jest.fn(async () => ({ ok: true })) as any;

import {
  loadConfig,
  saveConfig,
  addWallet,
  getWallet,
  listWallets,
  removeWallet,
  storeSecret,
  getSecret,
  deleteSecret,
  WalletConfig,
} from '../../src/utils/wallet-storage';
import { fundTestnetAccount, fetchAccountBalances } from '../../src/utils/stellar-helpers';

// ============================================
// wallet-storage.ts tests
// ============================================
describe('wallet-storage', () => {
  beforeEach(() => {
    configFileContent = null;
    secretStore.clear();
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('returns empty array when config file does not exist', async () => {
      const wallets = await loadConfig();
      expect(wallets).toEqual([]);
    });

    it('returns parsed wallets from valid config file', async () => {
      const wallet: WalletConfig = {
        name: 'test',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      configFileContent = JSON.stringify({ version: 1, wallets: [wallet] });
      const result = await loadConfig();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test');
    });

    it('throws on corrupt JSON', async () => {
      configFileContent = '{ not valid json';
      await expect(loadConfig()).rejects.toThrow('corrupted');
    });
  });

  describe('saveConfig', () => {
    it('writes valid JSON with version field', async () => {
      await saveConfig([]);
      expect(configFileContent).not.toBeNull();
      const parsed = JSON.parse(configFileContent!);
      expect(parsed.version).toBe(1);
      expect(parsed.wallets).toEqual([]);
    });
  });

  describe('addWallet', () => {
    it('appends a new wallet', async () => {
      const wallet: WalletConfig = {
        name: 'my-wallet',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      await addWallet(wallet);
      const wallets = await loadConfig();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].name).toBe('my-wallet');
    });

    it('throws on duplicate wallet name', async () => {
      const wallet: WalletConfig = {
        name: 'dupe',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      await addWallet(wallet);
      await expect(addWallet(wallet)).rejects.toThrow('already exists');
    });

    it('rejects invalid public key', async () => {
      const wallet: WalletConfig = {
        name: 'bad-key',
        publicKey: 'NOT_A_VALID_KEY',
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      await expect(addWallet(wallet)).rejects.toThrow('Invalid public key');
    });
  });

  describe('getWallet', () => {
    it('returns the wallet by name', async () => {
      const wallet: WalletConfig = {
        name: 'findme',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      await addWallet(wallet);
      const found = await getWallet('findme');
      expect(found).toBeDefined();
      expect(found!.publicKey).toBe(wallet.publicKey);
    });

    it('returns undefined for nonexistent wallet', async () => {
      const found = await getWallet('nope');
      expect(found).toBeUndefined();
    });
  });

  describe('removeWallet', () => {
    it('removes an existing wallet', async () => {
      const wallet: WalletConfig = {
        name: 'removeme',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      };
      await addWallet(wallet);
      const removed = await removeWallet('removeme');
      expect(removed).toBe(true);
      const wallets = await loadConfig();
      expect(wallets).toHaveLength(0);
    });

    it('returns false when wallet does not exist', async () => {
      const removed = await removeWallet('ghost');
      expect(removed).toBe(false);
    });
  });

  describe('keytar wrappers', () => {
    it('stores and retrieves a secret', async () => {
      await storeSecret('w1', 'mysecret');
      const s = await getSecret('w1');
      expect(s).toBe('mysecret');
    });

    it('returns null for missing secret', async () => {
      const s = await getSecret('nope');
      expect(s).toBeNull();
    });

    it('deletes a secret', async () => {
      await storeSecret('w2', 'todelete');
      const deleted = await deleteSecret('w2');
      expect(deleted).toBe(true);
      const s = await getSecret('w2');
      expect(s).toBeNull();
    });
  });
});

// ============================================
// stellar-helpers.ts tests
// ============================================
describe('stellar-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fundTestnetAccount', () => {
    it('returns true on successful funding', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
      const result = await fundTestnetAccount('GDTEST7EFYMJKIYSFLQUEKEP5QMHKWQDNKY3R6XM4YHFPFIAGWCVVBTO');
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('friendbot.stellar.org'),
        expect.any(Object),
      );
    });

    it('returns false on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('timeout'));
      const result = await fundTestnetAccount('GDTEST7EFYMJKIYSFLQUEKEP5QMHKWQDNKY3R6XM4YHFPFIAGWCVVBTO');
      expect(result).toBe(false);
    });
  });

  describe('fetchAccountBalances', () => {
    it('returns balances for funded account', async () => {
      const balances = await fetchAccountBalances(
        'GDTEST7EFYMJKIYSFLQUEKEP5QMHKWQDNKY3R6XM4YHFPFIAGWCVVBTO',
        'testnet',
      );
      expect(balances).toHaveLength(1);
      expect(balances[0].asset).toBe('XLM');
      expect(balances[0].balance).toBe('100.0000000');
    });

    it('returns empty array for unfunded account (404)', async () => {
      const { Horizon } = require('@stellar/stellar-sdk');
      Horizon.Server.mockImplementationOnce(() => ({
        loadAccount: jest.fn(async () => {
          const err: any = new Error('Not Found');
          err.response = { status: 404 };
          throw err;
        }),
      }));

      const balances = await fetchAccountBalances(
        'GDTEST7EFYMJKIYSFLQUEKEP5QMHKWQDNKY3R6XM4YHFPFIAGWCVVBTO',
        'testnet',
      );
      expect(balances).toEqual([]);
    });
  });
});

// ============================================
// Command integration tests
// ============================================
describe('wallet commands', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    configFileContent = null;
    secretStore.clear();
    process.exitCode = undefined;
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('create command', () => {
    it('creates a wallet and stores metadata + secret', async () => {
      const { Command } = require('commander');
      const { registerCreateCommands } = require('../../src/commands/wallet/create');

      const parent = new Command();
      registerCreateCommands(parent);

      await parent.parseAsync(['create', 'test-wallet', '--network', 'testnet'], { from: 'user' });

      // Wallet should exist in config
      const wallet = await getWallet('test-wallet');
      expect(wallet).toBeDefined();
      expect(wallet!.name).toBe('test-wallet');
      expect(wallet!.network).toBe('testnet');
      expect(wallet!.type).toBe('standard');

      // Secret should be in keytar
      const secret = await getSecret('test-wallet');
      expect(secret).not.toBeNull();
    });

    it('outputs JSON when --json flag is used', async () => {
      const { Command } = require('commander');
      const { registerCreateCommands } = require('../../src/commands/wallet/create');

      const parent = new Command();
      registerCreateCommands(parent);

      await parent.parseAsync(['create', 'json-wallet', '--json'], { from: 'user' });

      const jsonOutput = consoleSpy.mock.calls.find(
        (call: any[]) => {
          try { JSON.parse(call[0]); return true; } catch { return false; }
        }
      );
      expect(jsonOutput).toBeDefined();
      const parsed = JSON.parse(jsonOutput![0]);
      expect(parsed.name).toBe('json-wallet');
      expect(parsed.publicKey).toBeDefined();
      expect(parsed.secretKey).toBeDefined();
    });

    it('rejects duplicate wallet name', async () => {
      const { Command } = require('commander');
      const { registerCreateCommands } = require('../../src/commands/wallet/create');

      const parent = new Command();
      registerCreateCommands(parent);

      await parent.parseAsync(['create', 'dupe-wallet'], { from: 'user' });
      process.exitCode = undefined;

      const parent2 = new Command();
      registerCreateCommands(parent2);
      await parent2.parseAsync(['create', 'dupe-wallet'], { from: 'user' });

      expect(process.exitCode).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    });

    it('rejects invalid network', async () => {
      const { Command } = require('commander');
      const { registerCreateCommands } = require('../../src/commands/wallet/create');

      const parent = new Command();
      registerCreateCommands(parent);
      await parent.parseAsync(['create', 'bad-net', '--network', 'fakenet'], { from: 'user' });
      expect(process.exitCode).toBe(1);
    });
  });

  describe('import command', () => {
    it('imports a wallet from a valid secret key', async () => {
      const { Keypair } = require('@stellar/stellar-sdk');
      // Generate a real-looking key pair for the test
      const realKeypair = jest.requireActual('@stellar/stellar-sdk').Keypair.random();
      Keypair.fromSecret.mockReturnValueOnce({
        publicKey: () => realKeypair.publicKey(),
        secret: () => realKeypair.secret(),
      });

      const { Command } = require('commander');
      const { registerCreateCommands } = require('../../src/commands/wallet/create');

      const parent = new Command();
      registerCreateCommands(parent);
      await parent.parseAsync(['import', realKeypair.secret(), '--name', 'imported'], { from: 'user' });

      const wallet = await getWallet('imported');
      expect(wallet).toBeDefined();
      expect(wallet!.publicKey).toBe(realKeypair.publicKey());
    });

    it('rejects invalid secret key', async () => {
      const { Command } = require('commander');
      const { registerCreateCommands } = require('../../src/commands/wallet/create');

      const parent = new Command();
      registerCreateCommands(parent);
      await parent.parseAsync(['import', 'NOTAVALIDSECRETKEY', '--name', 'bad'], { from: 'user' });

      expect(process.exitCode).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid secret key'));
    });
  });

  describe('list command', () => {
    it('shows empty message when no wallets', async () => {
      const { Command } = require('commander');
      const { registerListCommands } = require('../../src/commands/wallet/list');

      const parent = new Command();
      registerListCommands(parent);
      await parent.parseAsync(['list'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No wallets found'));
    });

    it('lists wallets in table format', async () => {
      // Seed a wallet
      await addWallet({
        name: 'listed',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      });

      const { Command } = require('commander');
      const { registerListCommands } = require('../../src/commands/wallet/list');

      const parent = new Command();
      registerListCommands(parent);
      await parent.parseAsync(['list'], { from: 'user' });

      // Table output should contain the wallet name
      const output = consoleSpy.mock.calls.map((c: any[]) => c[0]).join('\n');
      expect(output).toContain('listed');
    });

    it('outputs JSON with --json flag', async () => {
      await addWallet({
        name: 'json-list',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      });

      const { Command } = require('commander');
      const { registerListCommands } = require('../../src/commands/wallet/list');

      const parent = new Command();
      registerListCommands(parent);
      await parent.parseAsync(['list', '--json'], { from: 'user' });

      const jsonOutput = consoleSpy.mock.calls.find(
        (call: any[]) => {
          try { JSON.parse(call[0]); return true; } catch { return false; }
        }
      );
      expect(jsonOutput).toBeDefined();
      const parsed = JSON.parse(jsonOutput![0]);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('show command', () => {
    it('shows wallet details with balances', async () => {
      await addWallet({
        name: 'show-me',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      });

      const { Command } = require('commander');
      const { registerListCommands } = require('../../src/commands/wallet/list');

      const parent = new Command();
      registerListCommands(parent);
      await parent.parseAsync(['show', 'show-me'], { from: 'user' });

      const output = consoleSpy.mock.calls.map((c: any[]) => c[0]).join('\n');
      expect(output).toContain('show-me');
      expect(output).toContain(MOCK_PUBLIC);
    });

    it('errors on nonexistent wallet', async () => {
      const { Command } = require('commander');
      const { registerListCommands } = require('../../src/commands/wallet/list');

      const parent = new Command();
      registerListCommands(parent);
      await parent.parseAsync(['show', 'ghost'], { from: 'user' });

      expect(process.exitCode).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
  });

  describe('backup commands', () => {
    it('creates a backup (no secrets)', async () => {
      await addWallet({
        name: 'backup-test',
        publicKey: MOCK_PUBLIC,
        type: 'standard',
        network: 'testnet',
        createdAt: '2025-01-01T00:00:00.000Z',
      });
      await storeSecret('backup-test', 'SUPERSECRET');

      const fs = require('fs/promises');
      const { Command } = require('commander');
      const { registerBackupCommands } = require('../../src/commands/wallet/backup');

      const parent = new Command();
      registerBackupCommands(parent);
      await parent.parseAsync(['backup', 'create', '--output', '/tmp/backup.json'], { from: 'user' });

      // Check that writeFile was called with backup data
      const writeCall = fs.writeFile.mock.calls.find(
        (call: any[]) => call[0] === '/tmp/backup.json'
      );
      expect(writeCall).toBeDefined();
      const backupData = JSON.parse(writeCall![1]);
      expect(backupData.wallets).toHaveLength(1);
      // Ensure no secret keys in backup
      expect(JSON.stringify(backupData)).not.toContain('SUPERSECRET');
    });

    it('restores wallets from a backup file', async () => {
      const backupData = JSON.stringify({
        version: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        wallets: [
          {
            name: 'restored-wallet',
            publicKey: MOCK_PUBLIC,
            type: 'standard',
            network: 'testnet',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      const fs = require('fs/promises');
      // Override readFile to return backup data for the restore file
      fs.readFile.mockImplementationOnce(async (filePath: string) => {
        if (filePath === '/tmp/restore.json') return backupData;
        if (configFileContent === null) {
          const err: any = new Error('ENOENT');
          err.code = 'ENOENT';
          throw err;
        }
        return configFileContent;
      });

      const { Command } = require('commander');
      const { registerBackupCommands } = require('../../src/commands/wallet/backup');

      const parent = new Command();
      registerBackupCommands(parent);
      await parent.parseAsync(['restore', '/tmp/restore.json'], { from: 'user' });

      const wallet = await getWallet('restored-wallet');
      expect(wallet).toBeDefined();
    });

    it('rejects invalid backup format', async () => {
      const fs = require('fs/promises');
      fs.readFile.mockImplementationOnce(async () => '{"not": "a backup"}');

      const { Command } = require('commander');
      const { registerBackupCommands } = require('../../src/commands/wallet/backup');

      const parent = new Command();
      registerBackupCommands(parent);
      await parent.parseAsync(['restore', '/tmp/bad.json'], { from: 'user' });

      expect(process.exitCode).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid backup format'));
    });
  });

  describe('stub commands', () => {
    it('multisig prints not-yet-implemented', async () => {
      const { Command } = require('commander');
      const { registerMultisigCommands } = require('../../src/commands/wallet/multisig');

      const parent = new Command();
      registerMultisigCommands(parent);
      await parent.parseAsync(['multisig', 'create'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Not yet implemented'));
    });

    it('ledger prints not-yet-implemented', async () => {
      const { Command } = require('commander');
      const { registerLedgerCommands } = require('../../src/commands/wallet/ledger');

      const parent = new Command();
      registerLedgerCommands(parent);
      await parent.parseAsync(['ledger', 'connect'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Not yet implemented'));
    });

    it('biometric prints not-yet-implemented', async () => {
      const { Command } = require('commander');
      const { registerBiometricCommands } = require('../../src/commands/wallet/biometric');

      const parent = new Command();
      registerBiometricCommands(parent);
      await parent.parseAsync(['biometric', 'setup'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Not yet implemented'));
    });

    it('recovery prints not-yet-implemented', async () => {
      const { Command } = require('commander');
      const { registerRecoveryCommands } = require('../../src/commands/wallet/recovery');

      const parent = new Command();
      registerRecoveryCommands(parent);
      await parent.parseAsync(['recovery', 'setup'], { from: 'user' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Not yet implemented'));
    });
  });
});
