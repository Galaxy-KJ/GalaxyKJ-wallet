import { renderHook, act, waitFor } from '@testing-library/react';
import { useInvisibleWallet, useWalletBalance, usePassphraseValidation } from '../use-invisible-wallet';
import { createInvisibleWalletSDK } from '@/lib/invisible-wallet/sdk';
import type { WalletResponse, WalletWithBalance, SignTransactionResponse } from '@/types/invisible-wallet';

// Mock the SDK
jest.mock('@/lib/invisible-wallet/sdk', () => {
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

  const mockSDK = {
    createWallet: jest.fn().mockResolvedValue(mockWallet),
    createWalletWithKeys: jest.fn().mockResolvedValue({
      ...mockWallet,
      secretKey: 'SBTEST6Z6MBKV3SYKFKQEDNPBWTCFMNXF4GQ4M7UNKETJLV74OQSZXYZ',
    }),
    recoverWallet: jest.fn().mockResolvedValue(mockWallet),
    getWallet: jest.fn().mockResolvedValue(mockWalletWithBalance),
    signTransaction: jest.fn().mockResolvedValue({
      signedXDR: 'signed-xdr-string',
      transactionHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      success: true,
    } as SignTransactionResponse),
    validatePassphrase: jest.fn((passphrase: string) => {
      const errors: string[] = [];
      if (passphrase.length < 8) {
        errors.push('Passphrase must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(passphrase)) {
        errors.push('Passphrase must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(passphrase)) {
        errors.push('Passphrase must contain at least one lowercase letter');
      }
      if (!/\d/.test(passphrase)) {
        errors.push('Passphrase must contain at least one number');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
        errors.push('Passphrase must contain at least one special character');
      }
      return { isValid: errors.length === 0, errors };
    }),
    on: jest.fn(),
    off: jest.fn(),
    getConfig: jest.fn(() => ({ platformId: 'test' })),
    isConfigured: jest.fn(() => true),
  };

  return {
    createInvisibleWalletSDK: jest.fn(() => mockSDK),
  };
});

describe('useInvisibleWallet', () => {
  const config = {
    platformId: 'test-platform',
    defaultNetwork: 'testnet' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes SDK on mount', () => {
      renderHook(() => useInvisibleWallet(config));

      expect(createInvisibleWalletSDK).toHaveBeenCalledWith(config);
    });

    it('sets isInitialized to true after successful init', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('registers event listeners on mount', () => {
      renderHook(() => useInvisibleWallet(config));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;

      expect(mockSDK.on).toHaveBeenCalledWith('walletCreated', expect.any(Function));
      expect(mockSDK.on).toHaveBeenCalledWith('walletRecovered', expect.any(Function));
      expect(mockSDK.on).toHaveBeenCalledWith('transactionSigned', expect.any(Function));
      expect(mockSDK.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('removes event listeners on unmount', () => {
      const { unmount } = renderHook(() => useInvisibleWallet(config));
      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;

      unmount();

      expect(mockSDK.off).toHaveBeenCalledWith('walletCreated', expect.any(Function));
      expect(mockSDK.off).toHaveBeenCalledWith('walletRecovered', expect.any(Function));
      expect(mockSDK.off).toHaveBeenCalledWith('transactionSigned', expect.any(Function));
      expect(mockSDK.off).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('exposes SDK instance', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => {
        expect(result.current.sdk).toBeDefined();
      });
    });
  });

  describe('createWallet', () => {
    it('creates wallet and updates state', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let walletResult: WalletResponse | undefined;

      await act(async () => {
        walletResult = await result.current.createWallet('test@example.com', 'StrongPass123!');
      });

      expect(walletResult).toBeDefined();
      expect(walletResult?.email).toBe('test@example.com');
    });

    it('sets loading state during creation', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      let resolveCreate: (value: WalletResponse) => void;
      const createPromise = new Promise<WalletResponse>((resolve) => {
        resolveCreate = resolve;
      });
      mockSDK.createWallet.mockReturnValueOnce(createPromise);

      act(() => {
        result.current.createWallet('test@example.com', 'StrongPass123!');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveCreate!({
          id: 'wallet-123',
          email: 'test@example.com',
          publicKey: 'GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG',
          platformId: 'test-platform',
          network: 'testnet',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
        });
        await createPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state on failure', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      mockSDK.createWallet.mockRejectedValueOnce(new Error('Creation failed'));

      await act(async () => {
        try {
          await result.current.createWallet('test@example.com', 'StrongPass123!');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Creation failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('clears error before new operation', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      mockSDK.createWallet.mockRejectedValueOnce(new Error('First error'));

      await act(async () => {
        try {
          await result.current.createWallet('test@example.com', 'StrongPass123!');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('First error');

      mockSDK.createWallet.mockResolvedValueOnce({
        id: 'wallet-123',
        email: 'test@example.com',
        publicKey: 'GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG',
        platformId: 'test-platform',
        network: 'testnet',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
      });

      await act(async () => {
        await result.current.createWallet('test2@example.com', 'StrongPass123!');
      });

      expect(result.current.error).toBeNull();
    });

    it('handles SDK initialization errors gracefully', async () => {
      // Mock SDK creation to fail
      (createInvisibleWalletSDK as jest.Mock).mockImplementationOnce(() => {
        throw new Error('SDK initialization failed');
      });

      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(false);
        expect(result.current.error).toBe('SDK initialization failed');
      });
    });
  });

  describe('createWalletWithKeys', () => {
    it('creates wallet with keys', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let walletResult;

      await act(async () => {
        walletResult = await result.current.createWalletWithKeys('test@example.com', 'StrongPass123!');
      });

      expect(walletResult).toHaveProperty('secretKey');
    });
  });

  describe('recoverWallet', () => {
    it('recovers wallet and updates state', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let walletResult: WalletResponse | undefined;

      await act(async () => {
        walletResult = await result.current.recoverWallet('test@example.com', 'StrongPass123!');
      });

      expect(walletResult).toBeDefined();
      expect(walletResult?.email).toBe('test@example.com');
    });

    it('sets loading state during recovery', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      let resolveRecover: (value: WalletResponse) => void;
      const recoverPromise = new Promise<WalletResponse>((resolve) => {
        resolveRecover = resolve;
      });
      mockSDK.recoverWallet.mockReturnValueOnce(recoverPromise);

      act(() => {
        result.current.recoverWallet('test@example.com', 'StrongPass123!');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveRecover!({
          id: 'wallet-123',
          email: 'test@example.com',
          publicKey: 'GCDPPFO4PXRNTTJTKPTFXSSUKJMMHA53S4H4FK4KHN2NUF5SICTGEEYG',
          platformId: 'test-platform',
          network: 'testnet',
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
        });
        await recoverPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state on failure', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      mockSDK.recoverWallet.mockRejectedValueOnce(new Error('Recovery failed'));

      await act(async () => {
        try {
          await result.current.recoverWallet('test@example.com', 'WrongPass123!');
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Recovery failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('getWallet', () => {
    it('gets wallet with balance', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let walletResult: WalletWithBalance | null = null;

      await act(async () => {
        walletResult = await result.current.getWallet('test@example.com');
      });

      expect(walletResult).not.toBeNull();
      expect(walletResult?.balances).toHaveLength(1);
      expect(result.current.wallet).toEqual(walletResult);
    });

    it('updates wallet state', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      expect(result.current.wallet).toBeNull();

      await act(async () => {
        await result.current.getWallet('test@example.com');
      });

      expect(result.current.wallet).not.toBeNull();
      expect(result.current.wallet?.email).toBe('test@example.com');
    });
  });

  describe('signTransaction', () => {
    it('signs transaction successfully', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      let signResult: SignTransactionResponse | undefined;

      await act(async () => {
        signResult = await result.current.signTransaction(
          'wallet-123',
          'test@example.com',
          'StrongPass123!',
          'valid-xdr'
        );
      });

      expect(signResult).toBeDefined();
      expect(signResult?.success).toBe(true);
      expect(signResult?.signedXDR).toBe('signed-xdr-string');
    });

    it('sets loading state during signing', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      let resolveSign: (value: SignTransactionResponse) => void;
      const signPromise = new Promise<SignTransactionResponse>((resolve) => {
        resolveSign = resolve;
      });
      mockSDK.signTransaction.mockReturnValueOnce(signPromise);

      act(() => {
        result.current.signTransaction('wallet-123', 'test@example.com', 'StrongPass123!', 'xdr');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSign!({
          signedXDR: 'signed-xdr-string',
          transactionHash: 'hash',
          success: true,
        });
        await signPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('validatePassphrase', () => {
    it('validates strong passphrase', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const validation = result.current.validatePassphrase('StrongPass123!');

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('validates weak passphrase', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const validation = result.current.validatePassphrase('weak');

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('clearError', () => {
    it('clears error state', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      mockSDK.createWallet.mockRejectedValueOnce(new Error('Test error'));

      await act(async () => {
        try {
          await result.current.createWallet('test@example.com', 'StrongPass123!');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('refreshWallet', () => {
    it('refreshes wallet data', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      // Create wallet first to set currentWalletRef
      await act(async () => {
        await result.current.createWallet('test@example.com', 'StrongPass123!');
      });

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      jest.clearAllMocks();

      await act(async () => {
        await result.current.refreshWallet();
      });

      expect(mockSDK.getWallet).toHaveBeenCalledWith('test@example.com', { network: 'testnet' });
    });

    it('does nothing when no wallet is set', async () => {
      const { result } = renderHook(() => useInvisibleWallet(config));

      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
      jest.clearAllMocks();

      await act(async () => {
        await result.current.refreshWallet();
      });

      expect(mockSDK.getWallet).not.toHaveBeenCalled();
    });
  });
});

describe('useWalletBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches balance on mount', async () => {
    const { result } = renderHook(() => useWalletBalance('test@example.com', 'testnet'));

    await waitFor(() => {
      expect(result.current.balance).not.toBeNull();
    });

    expect(result.current.balance?.balances).toHaveLength(1);
  });

  it('does not fetch when email is null', async () => {
    const { result } = renderHook(() => useWalletBalance(null, 'testnet'));

    const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0]?.value;

    expect(result.current.balance).toBeNull();
    expect(mockSDK?.getWallet).not.toHaveBeenCalled();
  });

  it('auto-refreshes at specified interval', async () => {
    renderHook(() => useWalletBalance('test@example.com', 'testnet', 10000));

    const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;

    await waitFor(() => {
      expect(mockSDK.getWallet).toHaveBeenCalled();
    });

    jest.clearAllMocks();

    // Fast-forward 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(mockSDK.getWallet).toHaveBeenCalled();
    });
  });

  it('provides manual refresh function', async () => {
    const { result } = renderHook(() => useWalletBalance('test@example.com', 'testnet'));

    await waitFor(() => {
      expect(result.current.balance).not.toBeNull();
    });

    const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0].value;
    jest.clearAllMocks();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockSDK.getWallet).toHaveBeenCalled();
  });

  it('handles fetch errors', async () => {
    // Mock getWallet to fail before rendering the hook
    const originalSDKCreator = (createInvisibleWalletSDK as jest.Mock).getMockImplementation();
    (createInvisibleWalletSDK as jest.Mock).mockImplementation((config) => {
      const sdk = originalSDKCreator?.(config) || {};
      return {
        ...sdk,
        getWallet: jest.fn().mockRejectedValue(new Error('Network error')),
      };
    });

    const { result } = renderHook(() => useWalletBalance('test@example.com', 'testnet'));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = renderHook(() => useWalletBalance('test@example.com', 'testnet', 10000));

    unmount();

    const mockSDK = (createInvisibleWalletSDK as jest.Mock).mock.results[0]?.value;
    jest.clearAllMocks();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockSDK?.getWallet || jest.fn()).not.toHaveBeenCalled();
  });
});

describe('usePassphraseValidation', () => {
  it('initializes with empty passphrase', () => {
    const { result } = renderHook(() => usePassphraseValidation());

    expect(result.current.passphrase).toBe('');
    expect(result.current.isValid).toBe(false);
    expect(result.current.errors).toHaveLength(0);
  });

  it('validates passphrase in real-time', async () => {
    const { result } = renderHook(() => usePassphraseValidation());

    act(() => {
      result.current.setPassphrase('weak');
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setPassphrase('StrongPass123!');
    });

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
      expect(result.current.errors).toHaveLength(0);
    });
  });

  it('shows specific validation errors', async () => {
    const { result } = renderHook(() => usePassphraseValidation());

    act(() => {
      result.current.setPassphrase('short');
    });

    await waitFor(() => {
      expect(result.current.errors).toContain('Passphrase must be at least 8 characters long');
    });
  });

  it('clears errors when passphrase is empty', async () => {
    const { result } = renderHook(() => usePassphraseValidation());

    act(() => {
      result.current.setPassphrase('weak');
    });

    await waitFor(() => {
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setPassphrase('');
    });

    await waitFor(() => {
      expect(result.current.errors).toHaveLength(0);
    });
  });
});
