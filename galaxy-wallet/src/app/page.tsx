'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { WalletInfo } from '@/components/WalletInfo';
import { AssetList } from '@/components/AssetList';
import { SendForm } from '@/components/SendForm';
import { TransactionList } from '@/components/TransactionList';
import { NetworkSelector } from '@/components/NetworkSelector';
import { useWallet } from '@/hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react'; 


export default function Home() {
  const { isConnected, address } = useWallet();

  return (
    <main className="min-h-screen bg-[#050510] text-white selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl font-black italic tracking-tighter">GKJ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">Galaxy Wallet</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">Verified by Galaxy SDK v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NetworkSelector />
            <WalletConnect />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div 
              key="connect-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto mt-20 text-center"
            >
              <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-gray-800 shadow-2xl">
                <Sparkles className="text-blue-500" size={40} />
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                Seamless Stellar Management
              </h2>
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                Connect your wallet to experience the next generation of Stellar transactions powered by the Galaxy SDK.
              </p>
              <div className="flex justify-center scale-110">
                <WalletConnect />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="wallet-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Wallet Info & Send */}
              <div className="lg:col-span-4 space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <WalletInfo />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SendForm />
                </motion.div>
              </div>

              {/* Right Column: Assets & Transactions */}
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <AssetList />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <TransactionList />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="relative z-10 py-12 text-center text-gray-600 text-sm">
        <p>© 2026 GalaxyKJ ecosystem. Built with SDK v2.0.0-beta</p>
      </footer>
    </main>
  );
}
