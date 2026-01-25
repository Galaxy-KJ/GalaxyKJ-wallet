/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { stellarService } from "../lib/stellar/stellar-service";
import { 
  WalletStore, 
  WalletAccount, 
  WalletBalance, 
  WalletTransaction, 
  NetworkConfig, 
  ConnectionStatus,
  TransactionRecord,
  AssetBalance
} from "@/types/wallet";

// Check if Stellar SDK is properly loaded
const isStellarSDKAvailable = () => {
  return typeof stellarService !== 'undefined' && stellarService;
};

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  type: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  passphrase: 'Test SDF Network ; September 2015'
};

const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
  isConnected: false,
  isLoading: false,
  lastSyncTime: null,
  error: null
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => {
      
      return {
        // State
        publicKey: null,
        account: null,
        balance: null,
        transactions: [],
        networkConfig: DEFAULT_NETWORK_CONFIG,
        connectionStatus: DEFAULT_CONNECTION_STATUS,
        isInitialized: false,

        // Actions
        setPublicKey: (key: string | null) => {
          set({ publicKey: key });
          if (!key) {
            get().reset();
          }
        },

        setAccount: (account: WalletAccount | null) => {
          set({ account });
        },

        setBalance: (balance: WalletBalance | null) => {
          set({ balance });
        },

        setTransactions: (transactions: WalletTransaction[]) => {
          set({ transactions });
        },

        addTransaction: (transaction: WalletTransaction) => {
          set((state) => ({
            transactions: [transaction, ...state.transactions].slice(0, 100) // Keep only latest 100
          }));
        },

        setNetworkConfig: (config: NetworkConfig) => {
          set({ networkConfig: config });
          // Reset connection status when network changes
          set({ connectionStatus: DEFAULT_CONNECTION_STATUS });
        },

        setConnectionStatus: (status: Partial<ConnectionStatus>) => {
          set((state) => ({
            connectionStatus: { ...state.connectionStatus, ...status }
          }));
        },

        syncWallet: async () => {
          const { publicKey, networkConfig, setConnectionStatus, setAccount, setBalance, setTransactions } = get();
          
          if (!publicKey) {
            setConnectionStatus({ error: 'No public key set' });
            return;
          }

          setConnectionStatus({ isLoading: true, error: null });

          try {
            // Initialize the stellar service
            await stellarService.initialize(networkConfig.horizonUrl);
            
            // Load account
            const account = await stellarService.loadAccount(publicKey);
            setAccount(account);

            // Load balance - we need to get the raw account response for balance processing
            const accountResponse = await stellarService.getAccountResponse(publicKey);
            const balance = await stellarService.loadBalance(accountResponse);
            setBalance(balance);

            // Load transactions
            const transactions = await stellarService.loadTransactions(publicKey);
            setTransactions(transactions);

            const successStatus = {
              isConnected: true,
              isLoading: false,
              lastSyncTime: new Date(),
              error: null
            };
            
            setConnectionStatus(successStatus);

          } catch (error) {
            
            // Handle specific error cases
            let errorMessage = 'Failed to sync wallet';
            let shouldRetry = true;

            if (error instanceof Error) {
              if (error.message.includes('404') || error.message.includes('not found')) {
                errorMessage = 'Account not found - may be a new wallet that needs funding';
                shouldRetry = false; // Don't retry for non-existent accounts
              } else if (error.message.includes('Network Error') || error.message.includes('timeout')) {
                errorMessage = 'Network connection failed - please check your internet connection';
              } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
                errorMessage = 'Network access blocked - check browser security settings';
              } else {
                errorMessage = error.message;
              }
            }

            const errorStatus = {
              isConnected: false,
              isLoading: false,
              error: errorMessage
            };
            
            setConnectionStatus(errorStatus);

            // Clear account data if account doesn't exist
            if (!shouldRetry) {
              setAccount(null);
              setBalance(null);
              setTransactions([]);
            }
          }
        },

        initialize: async () => {
          set({ isInitialized: true });
        },

        reset: () => {
          set({
            account: null,
            balance: null,
            transactions: [],
            connectionStatus: DEFAULT_CONNECTION_STATUS,
          });
        },
      };
    },
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        publicKey: state.publicKey,
        networkConfig: state.networkConfig,
        // Don't persist dynamic data like balance, transactions, etc.
      }),
    }
  )
);
