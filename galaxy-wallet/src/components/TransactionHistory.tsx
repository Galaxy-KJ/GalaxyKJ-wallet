'use client';

import { useState, useMemo, Fragment } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallet } from '@/hooks/useWallet';
import {
    History,
    ArrowUpRight,
    ArrowDownLeft,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    Link as LinkIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export function TransactionHistory() {
    const { address, network } = useWallet();
    const { transactions, loading, loadingMore, error, loadMore, nextCursor } = useTransactions();

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterAsset, setFilterAsset] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            const matchAsset = filterAsset === 'all' || tx.asset.toLowerCase() === filterAsset.toLowerCase();
            const matchType =
                filterType === 'all' ||
                (filterType === 'sent' && tx.type === 'payment') ||
                (filterType === 'received' && tx.type === 'receive') ||
                (filterType === 'trustline' && tx.type === 'trustline');
            const matchSearch =
                searchTerm === '' ||
                tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.to.toLowerCase().includes(searchTerm.toLowerCase());

            const matchFromDate = fromDate === '' || tx.timestamp >= new Date(`${fromDate}T00:00:00`);
            const matchToDate = toDate === '' || tx.timestamp <= new Date(`${toDate}T23:59:59`);

            return matchAsset && matchType && matchSearch && matchFromDate && matchToDate;
        });
    }, [transactions, filterAsset, filterType, searchTerm, fromDate, toDate]);

    const uniqueAssets = useMemo(() => {
        const assets = new Set<string>();
        transactions.forEach((tx) => assets.add(tx.asset));
        return Array.from(assets);
    }, [transactions]);

    const handleExportCSV = () => {
        const headers = ['ID', 'Hash', 'Type', 'Asset', 'Amount', 'From', 'To', 'Timestamp', 'Memo', 'Fee (stroops)', 'Status'];
        const rows = filteredTransactions.map((tx) => [
            tx.id,
            tx.hash,
            tx.type,
            tx.asset,
            tx.amount,
            tx.from,
            tx.to,
            tx.timestamp.toISOString(),
            tx.memo ?? '',
            tx.fee,
            tx.successful ? 'Success' : 'Failed',
        ]);

        const csvContent = [headers, ...rows].map((line) => line.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${address?.slice(0, 8)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!address) return null;

    const explorerNetwork = network === 'mainnet' ? 'public' : 'testnet';

    return (
        <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl text-purple-400 border border-purple-500/10 shadow-lg shadow-purple-500/5">
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
                            Transaction History
                        </h3>
                        <p className="text-xs text-gray-500 font-medium tracking-wide flex items-center gap-1.5 uppercase mt-0.5">
                            <Clock size={12} className="text-gray-600" /> Real-time activity
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 rounded-xl text-sm font-semibold text-gray-300 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8 relative z-10">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search hash or address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 appearance-none transition-all cursor-pointer"
                    >
                        <option value="all">All Types</option>
                        <option value="sent">Sent</option>
                        <option value="received">Received</option>
                        <option value="trustline">Trustlines</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px] uppercase">Asset</div>
                    <select
                        value={filterAsset}
                        onChange={(e) => setFilterAsset(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 pl-14 pr-4 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 appearance-none transition-all cursor-pointer"
                    >
                        <option value="all">All Assets</option>
                        {uniqueAssets.map((asset) => (
                            <option key={asset} value={asset}>
                                {asset}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                </div>

                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px] uppercase">From</div>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 pl-14 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>

                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px] uppercase">To</div>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl py-3 pl-14 pr-4 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="relative z-10">
                <div className="overflow-hidden bg-black/20 rounded-3xl border border-gray-800/50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-800/50 text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">
                                <th className="px-6 py-5">Type / Asset</th>
                                <th className="px-6 py-5">Amount</th>
                                <th className="px-6 py-5 hidden md:table-cell">From / To</th>
                                <th className="px-6 py-5 hidden sm:table-cell">Date</th>
                                <th className="px-6 py-5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                            {loading && transactions.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-6 bg-gray-800/40 rounded-lg w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => {
                                    const isReceived = tx.type === 'receive';
                                    const isTrustline = tx.type === 'trustline';
                                    const isExpanded = expandedId === tx.id;

                                    return (
                                        <Fragment key={tx.id}>
                                            <tr
                                                onClick={() => toggleExpand(tx.id)}
                                                className={clsx('group hover:bg-white/[0.03] transition-colors cursor-pointer relative', isExpanded && 'bg-white/[0.05]')}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={clsx(
                                                                'p-2.5 rounded-xl border',
                                                                isReceived
                                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                    : isTrustline
                                                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                                      : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                            )}
                                                        >
                                                            {isReceived ? <ArrowDownLeft size={18} /> : isTrustline ? <Search size={18} /> : <ArrowUpRight size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white capitalize">
                                                                {tx.type === 'payment' ? 'Sent' : tx.type === 'receive' ? 'Received' : tx.type}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-gray-500 mt-0.5">{tx.asset}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={clsx('text-sm font-black tracking-tight', isReceived ? 'text-emerald-500' : 'text-white')}>
                                                        {isReceived ? '+' : isTrustline ? '' : '-'}
                                                        {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 hidden md:table-cell">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-gray-600 font-bold w-8">FROM</span>
                                                            <span className="text-[11px] text-gray-400 font-mono">
                                                                {tx.from ? `${tx.from.slice(0, 6)}...${tx.from.slice(-6)}` : '-'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-gray-600 font-bold w-8">TO</span>
                                                            <span className="text-[11px] text-gray-400 font-mono">
                                                                {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-6)}` : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 hidden sm:table-cell">
                                                    <div className="text-xs text-gray-400 font-medium">{tx.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                                    <div className="text-[10px] text-gray-600 mt-1 uppercase font-bold tracking-wider">
                                                        {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {tx.successful ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                                                        <div className="text-gray-700">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={5} className="p-0">
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/[0.02]">
                                                                <div className="px-6 py-8 border-t border-gray-800/50">
                                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                                        <div className="space-y-6">
                                                                            <div>
                                                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Transaction Hash</h5>
                                                                                <div className="flex items-center gap-3 group/hash cursor-pointer" onClick={() => navigator.clipboard.writeText(tx.hash)}>
                                                                                    <code className="text-[11px] text-blue-400 font-mono break-all bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
                                                                                        {tx.hash}
                                                                                    </code>
                                                                                    <LinkIcon size={12} className="text-gray-600 group-hover/hash:text-blue-400 transition-colors" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Network Fee (stroops)</h5>
                                                                                    <p className="text-sm text-gray-300 font-bold">{tx.fee || '100'}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</h5>
                                                                                    <div
                                                                                        className={clsx(
                                                                                            'inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border',
                                                                                            tx.successful ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' : 'text-red-500 bg-red-500/5 border-red-500/10'
                                                                                        )}
                                                                                    >
                                                                                        <div className={clsx('w-1.5 h-1.5 rounded-full', tx.successful ? 'bg-emerald-500' : 'bg-red-500')} />
                                                                                        {tx.successful ? 'Completed' : 'Failed'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-6">
                                                                            <div>
                                                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Memo</h5>
                                                                                <div className="text-sm text-gray-400 italic bg-gray-800/30 p-3 rounded-xl border border-gray-800/50">{tx.memo || 'No memo attached'}</div>
                                                                            </div>
                                                                            <div className="flex justify-end pt-2">
                                                                                <a
                                                                                    href={`https://stellar.expert/explorer/${explorerNetwork}/tx/${tx.hash}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                                                                >
                                                                                    View on Stellar Expert <ExternalLink size={14} />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 text-center">
                                        <div className="max-w-[200px] mx-auto opacity-20 mb-6 drop-shadow-2xl">
                                            <History size={64} className="mx-auto" />
                                        </div>
                                        <p className="text-gray-500 text-sm font-black uppercase tracking-[0.2em] mb-2">No Transactions Found</p>
                                        <p className="text-gray-600 text-xs">Try adjusting your filters or search terms.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {nextCursor && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-12 py-4 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 rounded-2xl text-sm font-bold text-gray-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
                        >
                            {loadingMore ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span>Loading Data...</span>
                                </div>
                            ) : (
                                <span className="group-hover:text-white transition-colors">Load More Transactions</span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
                    <XCircle size={18} />
                    {error}
                </div>
            )}
        </div>
    );
}
