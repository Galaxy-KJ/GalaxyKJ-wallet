'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { isBiometricAvailable, enableBiometricUnlock } from '@/lib/galaxy-sdk';
import { transactionCache } from '@/lib/cache';
import {
    Fingerprint,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export function BiometricSettings() {
    const { walletId, isConnected } = useWallet();
    const [isAvailable, setIsAvailable] = useState<boolean>(false);
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [showPassphrasePrompt, setShowPassphrasePrompt] = useState<boolean>(false);
    const [passphrase, setPassphrase] = useState<string>('');

    useEffect(() => {
        const checkAvailability = async () => {
            const available = await isBiometricAvailable();
            setIsAvailable(available);

            if (walletId) {
                const bioData = await transactionCache.getBiometricKey(walletId);
                setIsEnabled(!!bioData);
            }
            setLoading(false);
        };
        checkAvailability();
    }, [walletId]);

    const handleToggle = async () => {
        if (!isEnabled) {
            setShowPassphrasePrompt(true);
        } else {
            if (walletId) {
                await transactionCache.deleteBiometricKey(walletId);
                setIsEnabled(false);
            }
        }
    };

    const handleEnableSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletId) return;

        setError(null);
        setActionLoading(true);

        try {
            await enableBiometricUnlock(walletId, passphrase);
            setIsEnabled(true);
            setSuccess(true);
            setShowPassphrasePrompt(false);
            setPassphrase('');
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to enable biometric unlock');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return null;
    if (!isAvailable) return null;
    if (!isConnected) return null;

    return (
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "p-2.5 rounded-xl border transition-colors",
                        isEnabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-800 text-gray-400 border-gray-700"
                    )}>
                        <Fingerprint size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Biometric Unlock</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Use Face ID or Touch ID to unlock</p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        isEnabled ? "bg-emerald-500" : "bg-gray-700"
                    )}
                >
                    <span
                        className={clsx(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            isEnabled ? "translate-x-6" : "translate-x-1"
                        )}
                    />
                </button>
            </div>

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold"
                >
                    <CheckCircle2 size={12} />
                    Biometrics enabled successfully
                </motion.div>
            )}

            <AnimatePresence>
                {showPassphrasePrompt && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 mt-4 border-t border-white/5">
                            <form onSubmit={handleEnableSubmit}>
                                <div className="space-y-3">
                                    <p className="text-[11px] text-gray-400">Enter your passphrase to confirm biometric setup:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            placeholder="Passphrase"
                                            autoFocus
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            className="flex-1 bg-black/40 border border-gray-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!passphrase || actionLoading}
                                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                                            Setup
                                        </button>
                                    </div>
                                    {error && (
                                        <div className="flex items-center gap-2 text-[10px] text-red-400 font-bold">
                                            <AlertCircle size={12} /> {error}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassphrasePrompt(false)}
                                        className="text-[10px] text-gray-500 hover:text-gray-400 font-bold underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
