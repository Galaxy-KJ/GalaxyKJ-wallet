'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useBalance } from '@/hooks/useBalance';
import { useTransactions } from '@/hooks/useTransactions';
import { Send, AlertCircle, CheckCircle2, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

export function SendForm() {
  const { walletId, address } = useWallet();
  const { balances, refresh: refreshBalances } = useBalance();
  const { refresh: refreshTransactions } = useTransactions();
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('XLM');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !amount || !walletId) return;

    setLoading(true);
    setStatus('idle');
    setTxHash('');

    try {
      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId,
          destination,
          amount,
          asset: asset || 'XLM',
          password: 'SecurePassword123!', // Demo password - same as wallet creation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transaction failed');
      }

      setStatus('success');
      setMessage('Transaction sent successfully!');
      setTxHash(data.hash);
      setDestination('');
      setAmount('');

      // Refresh balances and transactions
      refreshBalances();
      refreshTransactions();

      setTimeout(() => setStatus('idle'), 10000);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!address) return null;

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
          <Send size={20} />
        </div>
        <h3 className="text-xl font-bold text-white">Send Assets</h3>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Destination Address</label>
          <input
            type="text"
            placeholder="G..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Asset</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all appearance-none"
            >
              {balances.map((b) => (
                <option key={b.code} value={b.code}>{b.code}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !destination || !amount}
          className="w-full group mt-4 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-400 py-4 rounded-2xl font-bold transition-all duration-300 transform active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Confirm & Send
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {status !== 'idle' && (
        <div className={clsx(
          "mt-6 p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2",
          status === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
        )}>
          <div className="flex items-center gap-3">
            {status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{message}</span>
          </div>
          {status === 'success' && txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              View on Explorer <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
