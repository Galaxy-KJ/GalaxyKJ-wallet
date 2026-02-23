'use client';

import { useState, useRef } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { exportWallet, importWallet } from '@/lib/galaxy-sdk';
import {
    Download,
    Upload,
    ShieldCheck,
    AlertTriangle,
    FileJson,
    CheckCircle2,
    XCircle,
    Key,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export function WalletBackup() {
    const { walletId, address, isConnected, connectWallet } = useWallet();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassphrasePrompt, setShowPassphrasePrompt] = useState<'export' | 'import' | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportClick = () => {
        setError(null);
        setSuccess(null);
        setShowPassphrasePrompt('export');
    };

    const handleImportClick = () => {
        setError(null);
        setSuccess(null);
        fileInputRef.current?.click();
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.json')) {
                setError('Please select a valid .json keystore file');
                return;
            }
            setSelectedFile(file);
            setShowPassphrasePrompt('import');
        }
    };

    const handlePassphraseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (showPassphrasePrompt === 'export' && walletId) {
            setIsExporting(true);
            try {
                const blob = await exportWallet(walletId, passphrase);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const truncatedAddress = address ? address.slice(0, 8) : 'wallet';
                const date = new Date().toISOString().split('T')[0];
                a.href = url;
                a.download = `galaxy-wallet-${truncatedAddress}-${date}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                setSuccess('Wallet backup exported successfully!');
                setShowPassphrasePrompt(null);
                setPassphrase('');
            } catch (err: any) {
                setError(err.message || 'Export failed');
            } finally {
                setIsExporting(false);
            }
        } else if (showPassphrasePrompt === 'import' && selectedFile) {
            setIsImporting(true);
            try {
                const result = await importWallet(selectedFile, passphrase);
                setSuccess('Wallet imported successfully! Reconnecting...');

                // Re-connect with imported data
                // In a real app we'd trigger a reload of the wallet state
                setTimeout(() => window.location.reload(), 2000);

                setShowPassphrasePrompt(null);
                setPassphrase('');
                setSelectedFile(null);
            } catch (err: any) {
                setError(err.message || 'Import failed');
            } finally {
                setIsImporting(false);
            }
        }
    };

    if (!isConnected && showPassphrasePrompt !== 'import') {
        return (
            <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-center">
                <Info className="mx-auto text-blue-400 mb-3" size={32} />
                <p className="text-gray-400 text-sm mb-4">You need to connect a wallet before you can manage backups.</p>
                <button
                    onClick={handleImportClick}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl mx-auto transition-all"
                >
                    <Upload size={18} /> Import from Backup
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    className="hidden"
                    accept=".json"
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none" />

            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Security & Backup</h3>
                    <p className="text-xs text-gray-500 font-medium">Protect your assets with encrypted backups</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={handleExportClick}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-3 p-4 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded-2xl font-bold transition-all duration-300 group/btn shadow-lg shadow-blue-500/5"
                >
                    <Download size={20} className="group-hover/btn:-translate-y-1 transition-transform" />
                    {isExporting ? 'Exporting...' : 'Export Backup'}
                </button>

                <button
                    onClick={handleImportClick}
                    className="flex items-center justify-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/50 rounded-2xl font-bold transition-all duration-300 group/btn"
                >
                    <Upload size={20} className="group-hover/btn:-translate-y-1 transition-transform" />
                    Import Backup
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
                accept=".json"
            />

            <div className="mt-6 flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                    <strong>Warning:</strong> Losing your backup file AND forgetting your passphrase will result in permanent loss of your wallet. Galaxy stores these files encrypted; we cannot recover them for you.
                </p>
            </div>

            {/* Passphrase Prompt Modal */}
            <AnimatePresence>
                {showPassphrasePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-[2rem] p-8 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                                    <Key size={24} />
                                </div>
                                <h4 className="text-xl font-bold text-white">
                                    {showPassphrasePrompt === 'export' ? 'Confirm Export' : 'Decode Backup'}
                                </h4>
                            </div>

                            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                                {showPassphrasePrompt === 'export'
                                    ? 'Please enter your wallet passphrase to confirm the export of your encrypted keystore file.'
                                    : 'Enter the passphrase used to encrypt this backup file to restore your wallet.'}
                            </p>

                            <form onSubmit={handlePassphraseSubmit}>
                                <div className="space-y-4">
                                    <input
                                        type="password"
                                        placeholder="Enter Passphrase"
                                        autoFocus
                                        value={passphrase}
                                        onChange={(e) => setPassphrase(e.target.value)}
                                        className="w-full bg-black/40 border border-gray-800 rounded-2xl py-4 px-6 text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                                    />
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassphrasePrompt(null)}
                                            className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!passphrase || isExporting || isImporting}
                                            className="flex-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                                        >
                                            {isExporting ? 'Exporting...' : isImporting ? 'Importing...' : 'Confirm'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Feedback */}
            <div className="mt-4 space-y-2">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                        <XCircle size={14} /> {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 size={14} /> {success}
                    </div>
                )}
            </div>
        </div>
    );
}
