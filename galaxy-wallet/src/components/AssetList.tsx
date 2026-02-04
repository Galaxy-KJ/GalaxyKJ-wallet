'use client';

import { useBalance } from '@/hooks/useBalance';
import { useWallet } from '@/hooks/useWallet';
import { Coins, ChevronRight, Layers } from 'lucide-react';

export function AssetList() {
  const { address } = useWallet();
  const { balances, loading } = useBalance();

  if (!address) return null;

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
            <Coins size={20} />
          </div>
          <h3 className="text-xl font-bold text-white">Your Assets</h3>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">
          {balances.length} Total
        </span>
      </div>

      <div className="space-y-3">
        {loading && balances.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-800/50 animate-pulse rounded-2xl" />
          ))
        ) : balances.length > 0 ? (
          balances.map((asset) => (
            <div 
              key={`${asset.code}-${asset.issuer}`}
              className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-transparent hover:border-gray-700 rounded-2xl transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-tr from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-gray-400 font-bold group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300">
                  {asset.code[0]}
                </div>
                <div>
                  <h4 className="text-white font-bold">{asset.code}</h4>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {asset.issuer ? `${asset.issuer.slice(0, 4)}...${asset.issuer.slice(-4)}` : 'Stellar Native'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{asset.balance}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Available</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Layers className="mx-auto text-gray-700 mb-3" size={40} />
            <p className="text-gray-500">No assets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
