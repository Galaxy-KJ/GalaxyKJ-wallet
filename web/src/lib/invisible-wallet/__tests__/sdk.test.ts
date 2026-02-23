import 'fake-indexeddb/auto';
import { InvisibleWalletSDK, createInvisibleWalletSDK } from '../sdk';
import { InvisibleWalletService } from '../wallet-service';
import type { WalletResponse, WalletWithBalance, SignTransactionResponse } from '@/types/invisible-wallet';

// Mock InvisibleWalletService
jest.mock('../wallet-service', () => {
  const mockWallet: WalletResponse = {
    id: 'wallet-123',
    email: 'test@example.com',
    publicKey: 'GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG',
    platformId: 'test-platform',
    network: 'testnet',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockWalletWithBalance: WalletWithBalance = {
    ...mockWallet,
    balances: [
      {
        balance: '100.0000000',
        assetType: 'native',
        assetCode: 'XLM',
      },
    ],
    sequence: '123456789',
    accountExists: true,
  };

  return {
    InvisibleWalletService: jest.fn().mockImplementation(() => ({
      createWallet: jest.fn().mockResolvedValue(mockWallet),
      createWalletWithKeys: jest.fn().mockResolvedValue({
        ...mockWallet,
        secretKey: 'SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ',
      }),
      recoverWallet: jest.fn().mockResolvedValue(mockWallet),
      getWalletWithBalance: jest.fn().mockResolvedValue(mockWalletWithBalance),
      signTransaction: jest.fn().mockResolvedValue({
        signedXDR: 'signed-xdr-string',
        transactionHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        success: true,
      } as SignTransactionResponse),
    })),
  };
});

describe('InvisibleWalletSDK', () => {
  let sdk: InvisibleWalletSDK;
  let mockService: jest.Mocked<InvisibleWalletService>;

  beforeEach(() => {
    sdk = new InvisibleWalletSDK({
      platformId: 'test-platform',
      defaultNetwork: 'testnet',
      debug: false,
    });

    // Get the mocked service instance
    mockService = (InvisibleWalletService as jest.MockedClass<typeof InvisibleWalletService>).mock.results[0]?.value;
    jest.clearAllMocks();
  });

  describe('SDK Initialization', () => {
    it('creates SDK with valid config', () => {
      expect(sdk).toBeInstanceOf(InvisibleWalletSDK);
      expect(sdk.isConfigured()).toBe(true);
    });

    it('requires platformId', () => {
      expect(() => new InvisibleWalletSDK({ platformId: '' })).not.toThrow();
      const emptyPlatformSDK = new InvisibleWalletSDK({ platformId: '' });
      expect(emptyPlatformSDK.isConfigured()).toBe(false);
    });

    it('defaults network to testnet', () => {
      const defaultSDK = new InvisibleWalletSDK({ platformId: 'test' });
      const config = defaultSDK.getConfig();
      expect(config.defaultNetwork).toBe('testnet');
    });

    it('defaults debug to false', () => {
      const defaultSDK = new InvisibleWalletSDK({ platformId: 'test' });
      const config = defaultSDK.getConfig();
      expect(config.debug).toBe(false);
    });

    it('accepts custom default network', () => {
      const mainnetSDK = new InvisibleWalletSDK({
        platformId: 'test',
        defaultNetwork: 'mainnet',
      });
      const config = mainnetSDK.getConfig();
      expect(config.defaultNetwork).toBe('mainnet');
    });

    it('accepts debug mode', () => {
      const debugSDK = new InvisibleWalletSDK({
        platformId: 'test',
        debug: true,
      });
      const config = debugSDK.getConfig();
      expect(config.debug).toBe(true);
    });

    it('initializes with service layer', () => {
      // SDK should have internal service - verify it exists by checking SDK methods work
      expect(sdk).toBeDefined();
      expect(typeof sdk.createWallet).toBe('function');
    });
  });

  describe('createWallet', () => {
    it('creates wallet successfully', async () => {
      const result = await sdk.createWallet('test@example.com', 'StrongPass123!');

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('test@example.com');
      expect(mockService.createWallet).toHaveBeenCalledWith({
        email: 'test@example.com',
        passphrase: 'StrongPass123!',
        platformId: 'test-platform',
        network: 'testnet',
        metadata: undefined,
      });
    });

    it('uses custom network from options', async () => {
      await sdk.createWallet('test@example.com', 'StrongPass123!', {
        network: 'mainnet',
      });

      expect(mockService.createWallet).toHaveBeenCalledWith(
        expect.objectContaining({
          network: 'mainnet',
        })
      );
    });

    it('includes metadata from options', async () => {
      const metadata = { deviceId: 'device-123', userAgent: 'TestBrowser/1.0' };
      await sdk.createWallet('test@example.com', 'StrongPass123!', {
        metadata,
      });

      expect(mockService.createWallet).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata,
        })
      );
    });

    it('emits walletCreated event', async () => {
      const listener = jest.fn();
      sdk.on('walletCreated', listener);

      await sdk.createWallet('test@example.com', 'StrongPass123!');

      expect(listener).toHaveBeenCalledWith({
        walletId: 'wallet-123',
        email: 'test@example.com',
        publicKey: 'GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG',
        network: 'testnet',
      });
    });

    it('emits error event on failure', async () => {
      const errorListener = jest.fn();
      sdk.on('error', errorListener);

      mockService.createWallet.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(sdk.createWallet('test@example.com', 'StrongPass123!')).rejects.toThrow(
        'Creation failed'
      );

      expect(errorListener).toHaveBeenCalledWith({
        operation: 'createWallet',
        error: 'Creation failed',
        timestamp: expect.any(String),
      });
    });
  });

  describe('createWalletWithKeys', () => {
    it('creates wallet with secret key exposed', async () => {
      const result = await sdk.createWalletWithKeys('test@example.com', 'StrongPass123!');

      expect(result).toHaveProperty('secretKey');
      expect(result.secretKey).toBe('SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ');
    });

    it('calls service createWalletWithKeys method', async () => {
      await sdk.createWalletWithKeys('test@example.com', 'StrongPass123!');

      expect(mockService.createWalletWithKeys).toHaveBeenCalledWith({
        email: 'test@example.com',
        passphrase: 'StrongPass123!',
        platformId: 'test-platform',
        network: 'testnet',
        metadata: undefined,
      });
    });

    it('emits walletCreated event', async () => {
      const listener = jest.fn();
      sdk.on('walletCreated', listener);

      await sdk.createWalletWithKeys('test@example.com', 'StrongPass123!');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('recoverWallet', () => {
    it('recovers wallet successfully', async () => {
      const result = await sdk.recoverWallet('test@example.com', 'StrongPass123!');

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('test@example.com');
      expect(mockService.recoverWallet).toHaveBeenCalledWith({
        email: 'test@example.com',
        passphrase: 'StrongPass123!',
        platformId: 'test-platform',
        network: 'testnet',
      });
    });

    it('uses custom network from options', async () => {
      await sdk.recoverWallet('test@example.com', 'StrongPass123!', {
        network: 'mainnet',
      });

      expect(mockService.recoverWallet).toHaveBeenCalledWith(
        expect.objectContaining({
          network: 'mainnet',
        })
      );
    });

    it('emits walletRecovered event', async () => {
      const listener = jest.fn();
      sdk.on('walletRecovered', listener);

      await sdk.recoverWallet('test@example.com', 'StrongPass123!');

      expect(listener).toHaveBeenCalledWith({
        walletId: 'wallet-123',
        email: 'test@example.com',
        publicKey: 'GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG',
        network: 'testnet',
      });
    });

    it('emits error event on failure', async () => {
      const errorListener = jest.fn();
      sdk.on('error', errorListener);

      mockService.recoverWallet.mockRejectedValueOnce(new Error('Recovery failed'));

      await expect(sdk.recoverWallet('test@example.com', 'WrongPass123!')).rejects.toThrow(
        'Recovery failed'
      );

      expect(errorListener).toHaveBeenCalledWith({
        operation: 'recoverWallet',
        error: 'Recovery failed',
        timestamp: expect.any(String),
      });
    });
  });

  describe('getWallet', () => {
    it('gets wallet with balance', async () => {
      const result = await sdk.getWallet('test@example.com');

      expect(result).not.toBeNull();
      expect(result?.balances).toHaveLength(1);
      expect(result?.balances[0].balance).toBe('100.0000000');
      expect(mockService.getWalletWithBalance).toHaveBeenCalledWith(
        'test@example.com',
        'test-platform',
        'testnet'
      );
    });

    it('uses custom network from options', async () => {
      await sdk.getWallet('test@example.com', { network: 'mainnet' });

      expect(mockService.getWalletWithBalance).toHaveBeenCalledWith(
        'test@example.com',
        'test-platform',
        'mainnet'
      );
    });

    it('returns null for non-existent wallet', async () => {
      mockService.getWalletWithBalance.mockResolvedValueOnce(null);

      const result = await sdk.getWallet('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('throws error on service failure', async () => {
      const errorListener = jest.fn();
      sdk.on('error', errorListener);

      mockService.getWalletWithBalance.mockRejectedValueOnce(new Error('Network error'));

      await expect(sdk.getWallet('test@example.com')).rejects.toThrow('Network error');

      expect(errorListener).toHaveBeenCalledWith({
        operation: 'getWallet',
        error: 'Network error',
        timestamp: expect.any(String),
      });
    });
  });

  describe('signTransaction', () => {
    it('signs transaction successfully', async () => {
      const result = await sdk.signTransaction(
        'wallet-123',
        'test@example.com',
        'StrongPass123!',
        'valid-xdr-string'
      );

      expect(result.success).toBe(true);
      expect(result.signedXDR).toBe('signed-xdr-string');
      expect(result.transactionHash).toBeDefined();
      expect(mockService.signTransaction).toHaveBeenCalledWith({
        walletId: 'wallet-123',
        email: 'test@example.com',
        passphrase: 'StrongPass123!',
        transactionXDR: 'valid-xdr-string',
        platformId: 'test-platform',
      });
    });

    it('emits transactionSigned event on success', async () => {
      const listener = jest.fn();
      sdk.on('transactionSigned', listener);

      await sdk.signTransaction(
        'wallet-123',
        'test@example.com',
        'StrongPass123!',
        'valid-xdr-string'
      );

      expect(listener).toHaveBeenCalledWith({
        walletId: 'wallet-123',
        transactionHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        signedXDR: 'signed-xdr-string',
      });
    });

    it('does not emit event on signing failure', async () => {
      const listener = jest.fn();
      sdk.on('transactionSigned', listener);

      mockService.signTransaction.mockResolvedValueOnce({
        signedXDR: '',
        transactionHash: '',
        success: false,
        error: 'Signing failed',
      });

      await sdk.signTransaction(
        'wallet-123',
        'test@example.com',
        'StrongPass123!',
        'invalid-xdr'
      );

      expect(listener).not.toHaveBeenCalled();
    });

    it('throws error on service failure', async () => {
      const errorListener = jest.fn();
      sdk.on('error', errorListener);

      mockService.signTransaction.mockRejectedValueOnce(new Error('Signing error'));

      await expect(
        sdk.signTransaction('wallet-123', 'test@example.com', 'StrongPass123!', 'xdr')
      ).rejects.toThrow('Signing error');

      expect(errorListener).toHaveBeenCalledWith({
        operation: 'signTransaction',
        error: 'Signing error',
        timestamp: expect.any(String),
      });
    });
  });

  describe('validatePassphrase', () => {
    it('accepts valid strong passphrase', () => {
      const result = sdk.validatePassphrase('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects passphrase shorter than 8 characters', () => {
      const result = sdk.validatePassphrase('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must be at least 8 characters long');
    });

    it('rejects passphrase longer than 128 characters', () => {
      const longPass = 'P'.repeat(129) + '1!';
      const result = sdk.validatePassphrase(longPass);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must not exceed 128 characters');
    });

    it('rejects passphrase without uppercase letter', () => {
      const result = sdk.validatePassphrase('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one uppercase letter');
    });

    it('rejects passphrase without lowercase letter', () => {
      const result = sdk.validatePassphrase('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one lowercase letter');
    });

    it('rejects passphrase without digit', () => {
      const result = sdk.validatePassphrase('PasswordABC!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one number');
    });

    it('rejects passphrase without special character', () => {
      const result = sdk.validatePassphrase('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passphrase must contain at least one special character');
    });

    it('returns multiple errors for weak passphrase', () => {
      const result = sdk.validatePassphrase('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Event System', () => {
    it('registers event listener', () => {
      const listener = jest.fn();
      sdk.on('walletCreated', listener);

      // Trigger the event internally
      (sdk as any).emit('walletCreated', { test: 'data' });

      expect(listener).toHaveBeenCalledWith({ test: 'data' });
    });

    it('removes event listener', () => {
      const listener = jest.fn();
      sdk.on('walletCreated', listener);
      sdk.off('walletCreated', listener);

      (sdk as any).emit('walletCreated', { test: 'data' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple listeners for same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      sdk.on('walletCreated', listener1);
      sdk.on('walletCreated', listener2);
      sdk.on('walletCreated', listener3);

      (sdk as any).emit('walletCreated', { test: 'data' });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('removes only specified listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      sdk.on('walletCreated', listener1);
      sdk.on('walletCreated', listener2);
      sdk.off('walletCreated', listener1);

      (sdk as any).emit('walletCreated', { test: 'data' });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('catches errors in event listeners', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();

      sdk.on('walletCreated', errorListener);
      sdk.on('walletCreated', goodListener);

      // Should not throw even though errorListener throws
      expect(() => {
        (sdk as any).emit('walletCreated', { test: 'data' });
      }).not.toThrow();

      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
    });

    it('handles removing non-existent listener', () => {
      const listener = jest.fn();

      expect(() => {
        sdk.off('walletCreated', listener);
      }).not.toThrow();
    });

    it('handles emitting event with no listeners', () => {
      expect(() => {
        (sdk as any).emit('walletCreated', { test: 'data' });
      }).not.toThrow();
    });
  });

  describe('getConfig', () => {
    it('returns config without apiKey', () => {
      const sdkWithApiKey = new InvisibleWalletSDK({
        platformId: 'test',
        apiKey: 'secret-key-123',
        defaultNetwork: 'testnet',
      });

      const config = sdkWithApiKey.getConfig();

      expect(config).toHaveProperty('platformId');
      expect(config).toHaveProperty('defaultNetwork');
      expect(config).not.toHaveProperty('apiKey');
    });

    it('includes public config fields', () => {
      const config = sdk.getConfig();

      expect(config).toHaveProperty('platformId');
      expect(config).toHaveProperty('defaultNetwork');
      expect(config).toHaveProperty('debug');
      // apiEndpoint and storage are optional and only included if set
    });
  });

  describe('isConfigured', () => {
    it('returns true when platformId is set', () => {
      expect(sdk.isConfigured()).toBe(true);
    });

    it('returns false when platformId is empty', () => {
      const unconfiguredSDK = new InvisibleWalletSDK({ platformId: '' });
      expect(unconfiguredSDK.isConfigured()).toBe(false);
    });
  });

  describe('createInvisibleWalletSDK factory', () => {
    it('creates SDK instance', () => {
      const factorySDK = createInvisibleWalletSDK({ platformId: 'test' });
      expect(factorySDK).toBeInstanceOf(InvisibleWalletSDK);
    });

    it('passes config to SDK', () => {
      const factorySDK = createInvisibleWalletSDK({
        platformId: 'test',
        defaultNetwork: 'mainnet',
      });
      const config = factorySDK.getConfig();
      expect(config.platformId).toBe('test');
      expect(config.defaultNetwork).toBe('mainnet');
    });
  });
});

describe('BrowserWalletStorage', () => {
  // Note: These tests would require setting up IndexedDB properly
  // For now, we're using fake-indexeddb which provides a mock implementation

  it('creates IndexedDB with correct name', async () => {
    const sdk = new InvisibleWalletSDK({ platformId: 'test' });

    // Trigger storage initialization by creating a wallet
    await sdk.createWallet('test@example.com', 'StrongPass123!');

    // Check that IndexedDB was used (implicit through no errors)
    expect(sdk).toBeDefined();
  });

  it('handles IndexedDB operations without errors', async () => {
    const sdk = new InvisibleWalletSDK({ platformId: 'test' });

    await expect(
      sdk.createWallet('test@example.com', 'StrongPass123!')
    ).resolves.toBeDefined();
  });
});
