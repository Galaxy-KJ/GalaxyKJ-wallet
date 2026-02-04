'use client';

import { useTransactions } from '@/hooks/useTransactions';
import { useWallet } from '@/hooks/useWallet';
import { History, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export function TransactionList() {
  const { address, network } = useWallet();
  const { transactions, loading } = useTransactions();

  if (!address) return null;

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
          <History size={20} />
        </div>
        <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
      </div>

      <div className="space-y-4">
        {loading && transactions.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-800/50 animate-pulse rounded-2xl" />
          ))
        ) : transactions.length > 0 ? (
          transactions.map((tx) => {
            const isReceived = tx.to === address;
            return (
              <div key={tx.id} className="group relative flex items-center justify-between p-4 bg-gray-800/20 hover:bg-gray-800/40 rounded-2xl border border-transparent hover:border-gray-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "p-3 rounded-xl",
                    isReceived ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {isReceived ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {isReceived ? 'Received Assets' : 'Sent Assets'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className={clsx(
                      "font-bold",
                      isReceived ? "text-green-500" : "text-white"
                    )}>
                      {isReceived ? '+' : '-'}{tx.amount} {tx.asset}
                    </p>
                    <a 
                      href={`https://stellar.expert/explorer/${network}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-400 transition-colors mt-1"
                    >
                      View on Explorer <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-600 text-sm font-medium">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
