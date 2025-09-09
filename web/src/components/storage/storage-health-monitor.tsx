/**
 * Storage Health Monitor Component
 * 
 * Displays database status, health metrics, and provides storage management tools
 * for the Galaxy Smart Wallet IndexedDB implementation
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useDatabaseStatus, useWalletStorage } from '@/hooks/use-storage';
import { cleanupExpiredBackups, getStorageStatus } from '@/lib/crypto';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  HardDrive,
  RefreshCw,
  Trash2,
  Shield,
  Activity,
  AlertCircle,
  Info,
  Settings,
} from 'lucide-react';

interface StorageHealthMonitorProps {
  onClose?: () => void;
  showDetails?: boolean;
}

export function StorageHealthMonitor({ 
  onClose, 
  showDetails = false 
}: StorageHealthMonitorProps) {
  const { status, isLoading, error, refreshStatus, resetDatabase } = useDatabaseStatus();
  const { wallets, refreshWallets } = useWalletStorage(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanupCount, setLastCleanupCount] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Health scoring
  const getHealthScore = useCallback(() => {
    let score = 100;
    
    if (!status.isAvailable) score -= 50;
    if (!status.isInitialized) score -= 30;
    if (status.storageQuota > 0 && status.storageUsed / status.storageQuota > 0.8) score -= 20;
    if (error) score -= 30;
    
    return Math.max(0, score);
  }, [status, error]);

  const getHealthStatus = useCallback(() => {
    const score = getHealthScore();
    if (score >= 80) return { status: 'healthy', color: 'text-green-400', icon: CheckCircle };
    if (score >= 50) return { status: 'warning', color: 'text-yellow-400', icon: AlertTriangle };
    return { status: 'critical', color: 'text-red-400', icon: AlertCircle };
  }, [getHealthScore]);

  // Cleanup expired backups
  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const cleanedCount = await cleanupExpiredBackups();
      setLastCleanupCount(cleanedCount);
      await refreshStatus();
    } catch (err) {
      console.error('Cleanup failed:', err);
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Reset database (with confirmation)
  const handleReset = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
      return;
    }

    try {
      await resetDatabase();
      setShowResetConfirm(false);
    } catch (err) {
      console.error('Database reset failed:', err);
    }
  };

  // Format storage size
  const formatSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  // Calculate storage percentage
  const getStoragePercentage = (): number => {
    if (status.storageQuota === 0) return 0;
    return (status.storageUsed / status.storageQuota) * 100;
  };

  const health = getHealthStatus();

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/95 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-200">Storage Health</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Health indicator */}
          <div className={`flex items-center gap-1 ${health.color}`}>
            <health.icon size={16} />
            <span className="text-sm font-medium capitalize">{health.status}</span>
            <span className="text-xs opacity-75">({getHealthScore()}/100)</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-red-200 text-sm">
              <p className="font-medium">Database Error</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Status Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Availability Status */}
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Database</span>
            {status.isAvailable ? (
              <CheckCircle size={16} className="text-green-400" />
            ) : (
              <AlertTriangle size={16} className="text-red-400" />
            )}
          </div>
          <div className="text-xs text-gray-400">
            {status.isAvailable ? 'Available' : 'Unavailable'}
          </div>
          <div className="text-xs text-gray-500">
            Version: {status.version}
          </div>
        </div>

        {/* Storage Usage */}
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Storage</span>
            <HardDrive size={16} className="text-blue-400" />
          </div>
          <div className="text-xs text-gray-400 mb-1">
            {formatSize(status.storageUsed)} / {formatSize(status.storageQuota)}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                getStoragePercentage() > 80 ? 'bg-red-500' :
                getStoragePercentage() > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, getStoragePercentage())}%` }}
            />
          </div>
        </div>

        {/* Wallet Count */}
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Wallets</span>
            <Shield size={16} className="text-purple-400" />
          </div>
          <div className="text-lg font-bold text-gray-200">
            {status.walletCount}
          </div>
          <div className="text-xs text-gray-500">
            Stored locally
          </div>
        </div>

        {/* Backup Count */}
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Backups</span>
            <Activity size={16} className="text-green-400" />
          </div>
          <div className="text-lg font-bold text-gray-200">
            {status.backupCount}
          </div>
          <div className="text-xs text-gray-500">
            Available restores
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mb-4 p-3 rounded-lg bg-gray-800/30 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Details</span>
          </div>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Initialized:</span>
              <span className={status.isInitialized ? 'text-green-400' : 'text-red-400'}>
                {status.isInitialized ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Health Check:</span>
              <span>{new Date(status.lastHealthCheck).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Usage:</span>
              <span>{getStoragePercentage().toFixed(1)}%</span>
            </div>
            {lastCleanupCount !== null && (
              <div className="flex justify-between">
                <span>Last Cleanup:</span>
                <span className="text-green-400">{lastCleanupCount} backups removed</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={refreshStatus}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>

        <button
          onClick={handleCleanup}
          disabled={isCleaningUp}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Trash2 size={14} className={isCleaningUp ? 'animate-pulse' : ''} />
          Cleanup
        </button>

        <button
          onClick={handleReset}
          className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
            showResetConfirm 
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
              : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
          }`}
        >
          <Settings size={14} />
          {showResetConfirm ? 'Confirm Reset?' : 'Reset DB'}
        </button>
      </div>

      {/* Warning Messages */}
      {getStoragePercentage() > 80 && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-900/30 border border-yellow-700">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-yellow-200 text-sm">
              <p className="font-medium">Storage Warning</p>
              <p className="opacity-90">
                Storage is {getStoragePercentage().toFixed(1)}% full. Consider cleaning up old backups.
              </p>
            </div>
          </div>
        </div>
      )}

      {!status.isAvailable && (
        <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-red-200 text-sm">
              <p className="font-medium">Database Unavailable</p>
              <p className="opacity-90">
                IndexedDB is not available. The application is running in fallback mode with limited functionality.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal storage health indicator component
 */
export function StorageHealthIndicator({ onClick }: { onClick?: () => void }) {
  const { status, error } = useDatabaseStatus();
  
  const getHealthStatus = () => {
    if (error || !status.isAvailable) return { color: 'text-red-400', icon: AlertCircle };
    if (!status.isInitialized) return { color: 'text-yellow-400', icon: AlertTriangle };
    return { color: 'text-green-400', icon: CheckCircle };
  };

  const health = getHealthStatus();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
      title="Storage Health"
    >
      <Database size={16} className="text-purple-400" />
      <health.icon size={14} className={health.color} />
      <span className="text-xs text-gray-400">
        {status.walletCount} wallets
      </span>
    </button>
  );
}