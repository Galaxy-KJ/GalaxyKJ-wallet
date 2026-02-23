/**
 * useInvisibleWallet — USDC Tests
 * Tests for establishUSDCTrustline, sendUSDC, and usdcBalance
 */

import { renderHook, act } from '@testing-library/react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';
import { createInvisibleWalletSDK } from '@/lib/invisible-wallet/sdk';

// ─── Mock SDK ─────────────────────────────────────────────────────────────────

jest.mock('@/lib/invisible-wallet/sdk');

const mockEstablishUSDCTrustline = jest.fn();
const mockSendUSDC = jest.fn();
const mockGetWallet = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockValidatePassphrase = jest.fn(() => ({ isValid: true, errors: [] }));

const mockSDK = {
     on: mockOn,
     off: mockOff,
     establishUSDCTrustline: mockEstablishUSDCTrustline,
     sendUSDC: mockSendUSDC,
     getWallet: mockGetWallet,
     validatePassphrase: mockValidatePassphrase,
     createWallet: jest.fn(),
     createWalletWithKeys: jest.fn(),
     recoverWallet: jest.fn(),
     signTransaction: jest.fn(),
};

(createInvisibleWalletSDK as jest.Mock).mockReturnValue(mockSDK);

// ─── Config ───────────────────────────────────────────────────────────────────

const TEST_CONFIG = {
     platformId: 'test-platform',
     defaultNetwork: 'testnet' as const,
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockTrustlineResponse = {
     signedXDR: 'signed-xdr-trustline',
     transactionHash: 'trustline-tx-hash-abc123',
     success: true,
};

const mockSendUSDCResponse = {
     signedXDR: 'signed-xdr-send',
     transactionHash: 'send-tx-hash-def456',
     success: true,
};

const mockWalletWithUSDC = {
     id: 'wallet-1',
     email: 'test@example.com',
     publicKey: 'GABCDEF123',
     platformId: 'test-platform',
     network: 'testnet' as const,
     status: 'active' as const,
     createdAt: '2024-01-01T00:00:00Z',
     accountExists: true,
     sequence: '1',
     balances: [
          { balance: '100.00', assetCode: 'XLM', assetType: 'native' },
          {
               balance: '50.00',
               assetCode: 'USDC',
               assetType: 'credit_alphanum4',
               assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          },
     ],
};

const mockWalletWithoutUSDC = {
     ...mockWalletWithUSDC,
     balances: [
          { balance: '100.00', assetCode: 'XLM', assetType: 'native' },
     ],
};

const sendParams = {
     walletId: 'wallet-1',
     email: 'test@example.com',
     passphrase: 'StrongPass123!',
     toAddress: 'GDESTINATION123456789',
     amount: '10.00',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useInvisibleWallet — USDC', () => {

     beforeEach(() => {
          jest.clearAllMocks();
          (createInvisibleWalletSDK as jest.Mock).mockReturnValue(mockSDK);
     });

     // ── usdcBalance ─────────────────────────────────────────────────────────────

     describe('usdcBalance', () => {

          it('returns null when wallet is not loaded', () => {
               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));
               expect(result.current.usdcBalance).toBeNull();
          });

          it('returns null when wallet has no USDC balance', async () => {
               mockGetWallet.mockResolvedValue(mockWalletWithoutUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               expect(result.current.usdcBalance).toBeNull();
          });

          it('returns USDC balance string when wallet has USDC', async () => {
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               expect(result.current.usdcBalance).toBe('50.00');
          });

          it('updates usdcBalance when wallet is refreshed with new USDC amount', async () => {
               const updatedWallet = {
                    ...mockWalletWithUSDC,
                    balances: [
                         { balance: '100.00', assetCode: 'XLM', assetType: 'native' },
                         {
                              balance: '75.00',
                              assetCode: 'USDC',
                              assetType: 'credit_alphanum4',
                              assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
                         },
                    ],
               };

               mockGetWallet
                    .mockResolvedValueOnce(mockWalletWithUSDC)
                    .mockResolvedValueOnce(updatedWallet);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               expect(result.current.usdcBalance).toBe('50.00');

               await act(async () => {
                    await result.current.refreshWallet();
               });

               expect(result.current.usdcBalance).toBe('75.00');
          });

          it('returns null when USDC trustline is removed', async () => {
               mockGetWallet
                    .mockResolvedValueOnce(mockWalletWithUSDC)
                    .mockResolvedValueOnce(mockWalletWithoutUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               expect(result.current.usdcBalance).toBe('50.00');

               await act(async () => {
                    await result.current.refreshWallet();
               });

               expect(result.current.usdcBalance).toBeNull();
          });

     });

     // ── establishUSDCTrustline ───────────────────────────────────────────────────

     describe('establishUSDCTrustline', () => {

          it('calls SDK establishUSDCTrustline with correct params', async () => {
               mockEstablishUSDCTrustline.mockResolvedValue(mockTrustlineResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.establishUSDCTrustline(
                         'wallet-1',
                         'test@example.com',
                         'StrongPass123!'
                    );
               });

               expect(mockEstablishUSDCTrustline).toHaveBeenCalledWith(
                    'wallet-1',
                    'test@example.com',
                    'StrongPass123!'
               );
          });

          it('returns the signed transaction response on success', async () => {
               mockEstablishUSDCTrustline.mockResolvedValue(mockTrustlineResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               let response: typeof mockTrustlineResponse | undefined;

               await act(async () => {
                    response = await result.current.establishUSDCTrustline(
                         'wallet-1',
                         'test@example.com',
                         'StrongPass123!'
                    );
               });

               expect(response).toEqual(mockTrustlineResponse);
               expect(response?.transactionHash).toBe('trustline-tx-hash-abc123');
          });

          it('sets isLoading true during call then false after', async () => {
               let resolveCall!: (v: unknown) => void;
               mockEstablishUSDCTrustline.mockReturnValue(
                    new Promise(res => { resolveCall = res; })
               );
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               act(() => {
                    result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
               });

               expect(result.current.isLoading).toBe(true);

               await act(async () => {
                    resolveCall(mockTrustlineResponse);
               });

               expect(result.current.isLoading).toBe(false);
          });

          it('calls refreshWallet after successful trustline establishment', async () => {
               mockEstablishUSDCTrustline.mockResolvedValue(mockTrustlineResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               // load wallet first so currentWalletRef is set for refresh
               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               const callsBefore = mockGetWallet.mock.calls.length;

               await act(async () => {
                    await result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
               });

               expect(mockGetWallet.mock.calls.length).toBeGreaterThan(callsBefore);
          });

          it('sets error state and throws when SDK call fails', async () => {
               mockEstablishUSDCTrustline.mockRejectedValue(new Error('USDC_TRUSTLINE_NOT_FOUND'));

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
                    } catch {
                         // expected to throw
                    }
               });

               expect(result.current.error).toBe('USDC_TRUSTLINE_NOT_FOUND');
               expect(result.current.isLoading).toBe(false);
          });

          it('sets isLoading false on error', async () => {
               mockEstablishUSDCTrustline.mockRejectedValue(new Error('Network error'));

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
                    } catch {
                         // expected
                    }
               });

               expect(result.current.isLoading).toBe(false);
          });

          it('clears previous error before starting a new call', async () => {
               mockEstablishUSDCTrustline.mockRejectedValueOnce(new Error('First error'));

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.establishUSDCTrustline('w', 'e', 'p');
                    } catch {
                         // expected
                    }
               });

               expect(result.current.error).toBe('First error');

               mockEstablishUSDCTrustline.mockResolvedValueOnce(mockTrustlineResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               await act(async () => {
                    await result.current.establishUSDCTrustline('w', 'e', 'p');
               });

               expect(result.current.error).toBeNull();
          });

          it('throws when SDK is not initialized', async () => {
               (createInvisibleWalletSDK as jest.Mock).mockReturnValue(null);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
                    } catch (e) {
                         expect((e as Error).message).toBe('SDK not initialized');
                    }
               });
          });

     });

     // ── sendUSDC ─────────────────────────────────────────────────────────────────

     describe('sendUSDC', () => {

          it('calls SDK sendUSDC with correct params', async () => {
               mockSendUSDC.mockResolvedValue(mockSendUSDCResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.sendUSDC(sendParams);
               });

               expect(mockSendUSDC).toHaveBeenCalledWith(sendParams);
          });

          it('returns the transaction response on success', async () => {
               mockSendUSDC.mockResolvedValue(mockSendUSDCResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               let response: typeof mockSendUSDCResponse | undefined;

               await act(async () => {
                    response = await result.current.sendUSDC(sendParams);
               });

               expect(response).toEqual(mockSendUSDCResponse);
               expect(response?.transactionHash).toBe('send-tx-hash-def456');
          });

          it('sets isLoading true during call then false after', async () => {
               let resolveCall!: (v: unknown) => void;
               mockSendUSDC.mockReturnValue(
                    new Promise(res => { resolveCall = res; })
               );
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               act(() => {
                    result.current.sendUSDC(sendParams);
               });

               expect(result.current.isLoading).toBe(true);

               await act(async () => {
                    resolveCall(mockSendUSDCResponse);
               });

               expect(result.current.isLoading).toBe(false);
          });

          it('calls refreshWallet after successful send', async () => {
               mockSendUSDC.mockResolvedValue(mockSendUSDCResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               const callsBefore = mockGetWallet.mock.calls.length;

               await act(async () => {
                    await result.current.sendUSDC(sendParams);
               });

               expect(mockGetWallet.mock.calls.length).toBeGreaterThan(callsBefore);
          });

          it('sets error and throws when no trustline exists', async () => {
               mockSendUSDC.mockRejectedValue(new Error('USDC_TRUSTLINE_NOT_FOUND'));

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.sendUSDC(sendParams);
                    } catch {
                         // expected
                    }
               });

               expect(result.current.error).toBe('USDC_TRUSTLINE_NOT_FOUND');
          });

          it('sets error and throws when send fails on-chain', async () => {
               mockSendUSDC.mockRejectedValue(new Error('USDC_SEND_FAILED'));

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.sendUSDC(sendParams);
                    } catch {
                         // expected
                    }
               });

               expect(result.current.error).toBe('USDC_SEND_FAILED');
               expect(result.current.isLoading).toBe(false);
          });

          it('sets error and throws on invalid passphrase', async () => {
               mockSendUSDC.mockRejectedValue(new Error('INVALID_PASSPHRASE'));

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.sendUSDC({ ...sendParams, passphrase: 'wrong' });
                    } catch {
                         // expected
                    }
               });

               expect(result.current.error).toBe('INVALID_PASSPHRASE');
          });

          it('clears previous error before starting new send', async () => {
               mockSendUSDC.mockRejectedValueOnce(new Error('First error'));

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.sendUSDC(sendParams);
                    } catch {
                         // expected
                    }
               });

               expect(result.current.error).toBe('First error');

               mockSendUSDC.mockResolvedValueOnce(mockSendUSDCResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               await act(async () => {
                    await result.current.sendUSDC(sendParams);
               });

               expect(result.current.error).toBeNull();
          });

          it('throws when SDK is not initialized', async () => {
               (createInvisibleWalletSDK as jest.Mock).mockReturnValue(null);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.sendUSDC(sendParams);
                    } catch (e) {
                         expect((e as Error).message).toBe('SDK not initialized');
                    }
               });
          });

          it('passes all params correctly to SDK', async () => {
               mockSendUSDC.mockResolvedValue(mockSendUSDCResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.sendUSDC(sendParams);
               });

               const calledWith = mockSendUSDC.mock.calls[0][0];
               expect(calledWith.walletId).toBe('wallet-1');
               expect(calledWith.toAddress).toBe('GDESTINATION123456789');
               expect(calledWith.amount).toBe('10.00');
               expect(calledWith.email).toBe('test@example.com');
          });

     });

     // ── Integration ──────────────────────────────────────────────────────────────

     describe('Integration — trustline then send', () => {

          it('usdcBalance updates after trustline established and wallet refreshed', async () => {
               mockEstablishUSDCTrustline.mockResolvedValue(mockTrustlineResponse);
               mockGetWallet
                    .mockResolvedValueOnce(mockWalletWithoutUSDC)  // initial lookup
                    .mockResolvedValueOnce(mockWalletWithUSDC);    // after trustline refresh

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               expect(result.current.usdcBalance).toBeNull();

               await act(async () => {
                    await result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
               });

               expect(result.current.usdcBalance).toBe('50.00');
          });

          it('usdcBalance decreases after successful USDC send', async () => {
               const walletAfterSend = {
                    ...mockWalletWithUSDC,
                    balances: [
                         { balance: '100.00', assetCode: 'XLM', assetType: 'native' },
                         {
                              balance: '40.00',
                              assetCode: 'USDC',
                              assetType: 'credit_alphanum4',
                              assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
                         },
                    ],
               };

               mockSendUSDC.mockResolvedValue(mockSendUSDCResponse);
               mockGetWallet
                    .mockResolvedValueOnce(mockWalletWithUSDC)  // initial
                    .mockResolvedValueOnce(walletAfterSend);    // after send refresh

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.getWallet('test@example.com');
               });

               expect(result.current.usdcBalance).toBe('50.00');

               await act(async () => {
                    await result.current.sendUSDC(sendParams);
               });

               expect(result.current.usdcBalance).toBe('40.00');
          });

          it('error from trustline does not affect subsequent successful send', async () => {
               mockEstablishUSDCTrustline.mockRejectedValueOnce(new Error('Trustline failed'));
               mockSendUSDC.mockResolvedValue(mockSendUSDCResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    try {
                         await result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
                    } catch {
                         // expected
                    }
               });

               expect(result.current.error).toBe('Trustline failed');

               await act(async () => {
                    await result.current.sendUSDC(sendParams);
               });

               expect(result.current.error).toBeNull();
               expect(result.current.isLoading).toBe(false);
          });

          it('both trustline and send calls SDK exactly once each', async () => {
               mockEstablishUSDCTrustline.mockResolvedValue(mockTrustlineResponse);
               mockSendUSDC.mockResolvedValue(mockSendUSDCResponse);
               mockGetWallet.mockResolvedValue(mockWalletWithUSDC);

               const { result } = renderHook(() => useInvisibleWallet(TEST_CONFIG));

               await act(async () => {
                    await result.current.establishUSDCTrustline('wallet-1', 'test@example.com', 'pass');
               });

               await act(async () => {
                    await result.current.sendUSDC(sendParams);
               });

               expect(mockEstablishUSDCTrustline).toHaveBeenCalledTimes(1);
               expect(mockSendUSDC).toHaveBeenCalledTimes(1);
          });

     });

});