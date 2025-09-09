/**
 * Storage React Hooks
 * 
 * React hooks for interacting with the Galaxy Smart Wallet database
 * Provides reactive access to wallet storage with error handling and loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { databaseManager, GalaxyWalletDB, DatabaseError, DatabaseUnavailableError } from '@/lib/storage/database';

// Hook return types
export interface UseWalletStorageResult {
  wallets: GalaxyWalletDB['wallets']['value'][];
  currentWallet: GalaxyWalletDB['wallets']['value'] | null;
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;
  storeWallet: (id: string, encryptedData: string, keyHash: string) => Promise<void>;
  getWallet: (id: string) => Promise<GalaxyWalletDB['wallets']['value'] | null>;
  updateWallet: (id: string, encryptedData: string, keyHash?: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  refreshWallets: () => Promise<void>;
  clearError: () => void;
}

export interface UseBackupStorageResult {
  backups: GalaxyWalletDB['backups']['value'][];
  isLoading: boolean;
  error: string | null;
  createBackup: (walletId: string, type?: 'manual' | 'automatic' | 'rotation') => Promise<string>;
  restoreFromBackup: (backupId: string) => Promise<void>;
  getWalletBackups: (walletId: string) => Promise<void>;
  cleanupExpiredBackups: () => Promise<number>;
  refreshBackups: () => Promise<void>;
  clearError: () => void;
}

export interface UseSettingsStorageResult {
  settings: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  getSetting: (key: string) => any;
  setSetting: (key: string, value: any, encrypted?: boolean) => Promise<void>;
  removeSetting: (key: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  clearError: () => void;
}

export interface UseDatabaseStatusResult {
  status: {
    isAvailable: boolean;
    isInitialized: boolean;
    version: number;
    storageUsed: number;
    storageQuota: number;
    walletCount: number;
    backupCount: number;
    lastHealthCheck: string;
  };
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for wallet storage operations
 */
export function useWalletStorage(autoLoad: boolean = true): UseWalletStorageResult {
  const [wallets, setWallets] = useState<GalaxyWalletDB['wallets']['value'][]>([]);
  const [currentWallet, setCurrentWallet] = useState<GalaxyWalletDB['wallets']['value'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // Load wallets from storage
  const refreshWallets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.initialize();
      const walletList = await databaseManager.listWallets();
      setWallets(walletList);
      setIsAvailable(true);
      
      // Set current wallet to the most recent one if none selected
      if (!currentWallet && walletList.length > 0) {
        setCurrentWallet(walletList[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to load wallets';
      setError(errorMessage);
      
      if (err instanceof DatabaseUnavailableError) {
        setIsAvailable(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentWallet]);

  // Store a new wallet
  const storeWallet = useCallback(async (
    id: string, 
    encryptedData: string, 
    keyHash: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.storeWallet(id, encryptedData, keyHash);
      await refreshWallets();
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to store wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWallets]);

  // Get a specific wallet
  const getWallet = useCallback(async (id: string) => {
    setError(null);

    try {
      const wallet = await databaseManager.getWallet(id);
      if (wallet && (!currentWallet || currentWallet.id !== id)) {
        setCurrentWallet(wallet);
      }
      return wallet;
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : `Failed to get wallet ${id}`;
      setError(errorMessage);
      throw err;
    }
  }, [currentWallet]);

  // Update an existing wallet
  const updateWallet = useCallback(async (
    id: string, 
    encryptedData: string, 
    keyHash?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.updateWallet(id, encryptedData, keyHash);
      await refreshWallets();
      
      // Update current wallet if it's the one being updated
      if (currentWallet && currentWallet.id === id) {
        const updatedWallet = await databaseManager.getWallet(id);
        setCurrentWallet(updatedWallet);
      }
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to update wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWallets, currentWallet]);

  // Delete a wallet
  const deleteWallet = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.deleteWallet(id);
      await refreshWallets();
      
      // Clear current wallet if it was deleted
      if (currentWallet && currentWallet.id === id) {
        setCurrentWallet(null);
      }
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to delete wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshWallets, currentWallet]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load wallets on mount
  useEffect(() => {
    if (autoLoad) {
      refreshWallets();
    }
  }, [autoLoad, refreshWallets]);

  return {
    wallets,
    currentWallet,
    isLoading,
    error,
    isAvailable,
    storeWallet,
    getWallet,
    updateWallet,
    deleteWallet,
    refreshWallets,
    clearError,
  };
}

/**
 * Hook for backup storage operations
 */
export function useBackupStorage(walletId?: string): UseBackupStorageResult {
  const [backups, setBackups] = useState<GalaxyWalletDB['backups']['value'][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load backups from storage
  const refreshBackups = useCallback(async () => {
    if (!walletId) return;

    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.initialize();
      const backupList = await databaseManager.getWalletBackups(walletId);
      setBackups(backupList);
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to load backups';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  // Create a backup
  const createBackup = useCallback(async (
    targetWalletId: string,
    type: 'manual' | 'automatic' | 'rotation' = 'manual'
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const backupId = await databaseManager.createBackup(targetWalletId, type);
      
      // Refresh backups if we're viewing this wallet's backups
      if (walletId === targetWalletId) {
        await refreshBackups();
      }
      
      return backupId;
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to create backup';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [walletId, refreshBackups]);

  // Restore from backup
  const restoreFromBackup = useCallback(async (backupId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.restoreFromBackup(backupId);
      await refreshBackups();
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to restore from backup';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBackups]);

  // Get backups for a specific wallet
  const getWalletBackups = useCallback(async (targetWalletId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const backupList = await databaseManager.getWalletBackups(targetWalletId);
      if (walletId === targetWalletId) {
        setBackups(backupList);
      }
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to get wallet backups';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  // Clean up expired backups
  const cleanupExpiredBackups = useCallback(async (): Promise<number> => {
    setIsLoading(true);
    setError(null);

    try {
      const deletedCount = await databaseManager.cleanupExpiredBackups();
      await refreshBackups();
      return deletedCount;
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to cleanup expired backups';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBackups]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load backups when walletId changes
  useEffect(() => {
    if (walletId) {
      refreshBackups();
    }
  }, [walletId, refreshBackups]);

  return {
    backups,
    isLoading,
    error,
    createBackup,
    restoreFromBackup,
    getWalletBackups,
    cleanupExpiredBackups,
    refreshBackups,
    clearError,
  };
}

/**
 * Hook for settings storage operations
 */
export function useSettingsStorage(autoLoad: boolean = true): UseSettingsStorageResult {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedSettings = useRef<Set<string>>(new Set());

  // Load all settings from storage
  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.initialize();
      // In a real implementation, we'd load all settings
      // For now, we'll load them on-demand via getSetting
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to load settings';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  // Get a specific setting
  const getSetting = useCallback((key: string): any => {
    return settings[key];
  }, [settings]);

  // Set a setting
  const setSetting = useCallback(async (
    key: string, 
    value: any, 
    encrypted: boolean = false
  ) => {
    setError(null);

    try {
      await databaseManager.storeSetting(key, value, encrypted);
      setSettings(prev => ({ ...prev, [key]: value }));
      loadedSettings.current.add(key);
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : `Failed to set setting ${key}`;
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Remove a setting
  const removeSetting = useCallback(async (key: string) => {
    setError(null);

    try {
      // In a real implementation, we'd have a delete method
      await databaseManager.storeSetting(key, null);
      setSettings(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      loadedSettings.current.delete(key);
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : `Failed to remove setting ${key}`;
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Load setting on demand
  const loadSetting = useCallback(async (key: string) => {
    if (loadedSettings.current.has(key)) return;

    try {
      const value = await databaseManager.getSetting(key);
      if (value !== null) {
        setSettings(prev => ({ ...prev, [key]: value }));
        loadedSettings.current.add(key);
      }
    } catch (err) {
      console.warn(`Failed to load setting ${key}:`, err);
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load settings on mount
  useEffect(() => {
    if (autoLoad) {
      refreshSettings();
    }
  }, [autoLoad, refreshSettings]);

  // Enhanced getSetting that loads on demand
  const getSettingWithLoad = useCallback(async (key: string): Promise<any> => {
    if (!loadedSettings.current.has(key)) {
      await loadSetting(key);
    }
    return settings[key];
  }, [settings, loadSetting]);

  return {
    settings,
    isLoading,
    error,
    getSetting: getSettingWithLoad,
    setSetting,
    removeSetting,
    refreshSettings,
    clearError,
  };
}

/**
 * Hook for database status monitoring
 */
export function useDatabaseStatus(): UseDatabaseStatusResult {
  const [status, setStatus] = useState({
    isAvailable: false,
    isInitialized: false,
    version: 0,
    storageUsed: 0,
    storageQuota: 0,
    walletCount: 0,
    backupCount: 0,
    lastHealthCheck: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh database status
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.initialize();
      const currentStatus = await databaseManager.getStatus();
      setStatus(currentStatus);
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to get database status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset database (use with caution)
  const resetDatabase = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await databaseManager.reset();
      await refreshStatus();
    } catch (err) {
      const errorMessage = err instanceof DatabaseError 
        ? err.message 
        : 'Failed to reset database';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load status on mount
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    error,
    refreshStatus,
    resetDatabase,
    clearError,
  };
}

/**
 * Comprehensive storage hook that combines all storage operations
 */
export function useStorage() {
  const walletStorage = useWalletStorage();
  const backupStorage = useBackupStorage(walletStorage.currentWallet?.id);
  const settingsStorage = useSettingsStorage();
  const databaseStatus = useDatabaseStatus();

  const isLoading = walletStorage.isLoading || 
                   backupStorage.isLoading || 
                   settingsStorage.isLoading || 
                   databaseStatus.isLoading;

  const hasError = !!(walletStorage.error || 
                     backupStorage.error || 
                     settingsStorage.error || 
                     databaseStatus.error);

  const clearAllErrors = useCallback(() => {
    walletStorage.clearError();
    backupStorage.clearError();
    settingsStorage.clearError();
    databaseStatus.clearError();
  }, [walletStorage, backupStorage, settingsStorage, databaseStatus]);

  return {
    wallets: walletStorage,
    backups: backupStorage,
    settings: settingsStorage,
    status: databaseStatus,
    isLoading,
    hasError,
    clearAllErrors,
  };
}