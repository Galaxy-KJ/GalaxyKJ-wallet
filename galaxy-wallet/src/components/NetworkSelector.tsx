'use client';

import { useWallet } from '@/hooks/useWallet';
import { Globe, Check } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export function NetworkSelector() {
  const { network, switchNetwork } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const networks = [
    { id: 'mainnet', name: 'Mainnet', color: 'bg-green-500' },
    { id: 'testnet', name: 'Testnet', color: 'bg-yellow-500' },
  ] as const;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50 text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        <Globe size={14} className="text-blue-400" />
        <span className="capitalize">{network}</span>
        <div className={clsx(
          "w-2 h-2 rounded-full",
          network === 'mainnet' ? 'bg-green-500' : 'bg-yellow-500'
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
            {networks.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  switchNetwork(n.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={clsx("w-2 h-2 rounded-full", n.color)} />
                  <span className={clsx(network === n.id ? "text-white" : "text-gray-400")}>
                    {n.name}
                  </span>
                </div>
                {network === n.id && (
                  <Check size={14} className="text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
