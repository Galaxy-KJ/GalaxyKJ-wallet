'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { transactionCache } from '@/lib/cache';
import { LogIn, LogOut, Loader2, Fingerprint } from 'lucide-react';

export function WalletConnect() {
  const { isConnected, address, walletId, loading, connectWallet, biometricUnlock, disconnect } = useWallet();
  const [hasBio, setHasBio] = useState(false);

  useEffect(() => {
    const checkBio = async () => {
      if (walletId) {
        const key = await transactionCache.getBiometricKey(walletId);
        setHasBio(!!key);
      }
    };
    checkBio();
  }, [walletId]);

  if (isConnected && address) {
    // ... connected state ...
    return (
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-gray-500 font-medium">Connected Wallet</span>
          <span className="text-sm font-mono text-gray-200">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all duration-300 border border-red-500/20"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {hasBio && !isConnected && (
        <button
          onClick={biometricUnlock}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-xl font-bold transition-all duration-300 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Fingerprint className="group-hover:scale-110 transition-transform" size={18} />
          )}
          {loading ? 'Unlocking...' : 'Biometric Unlock'}
        </button>
      )}

      <button
        onClick={connectWallet}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-50"
      >
        {loading && !hasBio ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <LogIn size={18} />
        )}
        {loading && !hasBio ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}
