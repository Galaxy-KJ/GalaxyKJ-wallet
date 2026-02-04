'use client';

import { useWallet } from '@/hooks/useWallet';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export function WalletConnect() {
  const { isConnected, address, loading, connectWallet, disconnect } = useWallet();

  if (isConnected && address) {
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
    <button
      onClick={connectWallet}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <LogIn size={18} />
      )}
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
