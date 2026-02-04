'use client';

import { useWallet } from '@/hooks/useWallet';
import { useBalance } from '@/hooks/useBalance';
import { Copy, Wallet, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function WalletInfo() {
  const { address } = useWallet();
  const { balances, loading, refresh } = useBalance();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const xlmBalance = balances.find(b => b.code === 'XLM')?.balance || '0.00';

  if (!address) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-2xl shadow-blue-900/40 text-white relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Wallet size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold tracking-tight">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `${xlmBalance} XLM`
              )}
            </h2>
          </div>
          <button 
            onClick={refresh}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div>
          <p className="text-blue-100 text-xs font-medium mb-2 uppercase tracking-wider">Wallet Address</p>
          <div 
            className="flex items-center gap-3 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/20 hover:border-white/30 transition-all cursor-pointer hover:bg-black/40" 
            onClick={copyAddress}
          >
            <code className="text-sm font-mono flex-1 break-all leading-relaxed text-white/90">
              {address}
            </code>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0">
              {copied ? (
                <span className="text-xs font-bold uppercase text-green-400">✓ Copied</span>
              ) : (
                <Copy size={16} className="text-blue-200" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
