'use client';

import { useState, useMemo } from 'react';
import { useOracles } from '@/app/hooks/useOracles';
import { usePrices } from '@/app/hooks/usePrices';
import { useSourceHealth } from '@/app/hooks/useSourceHealth';
import { usePriceHistory } from '@/app/hooks/usePriceHistory';
import { PriceCard } from '@/app/components/PriceCard';
import { SourceHealth } from '@/app/components/SourceHealth';
import { PriceChart } from '@/app/components/PriceChart';
import { TokenSelector } from '@/app/components/TokenSelector';

export default function Dashboard() {
  const { aggregator, strategy, updateStrategy, supportedSymbols } = useOracles();
  const { prices, loading, error } = usePrices(aggregator, supportedSymbols);
  const { health } = useSourceHealth(aggregator);
  const history = usePriceHistory(prices);
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');

  // Get sorted prices for consistent display
  const sortedPrices = useMemo(() => {
    return Array.from(prices.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [prices]);

  const selectedHistory = history.get(selectedSymbol) || [];

  return (
    <main className="min-h-screen pb-12 bg-gradient-to-br from-[#0c0c0e] via-[#050505] to-[#0c0c0e] text-white">
      {/* Header */}
      <header className="px-8 py-4 mb-2">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="p-1.5 bg-purple-600 rounded-lg shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
              </div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Galaxy <span className="text-purple-500">Oracle</span></h1>
            </div>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">Real-Time Price Engine</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Health</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-green-400">100% OPERATIONAL</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 space-y-5">
        {/* Row 1: Chart & Hero area */}
        <section className="space-y-4">
           {/* Selector Bar */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TokenSelector 
                tokens={sortedPrices.map(p => ({ symbol: p.symbol, price: p.price }))}
                selected={selectedSymbol}
                onSelect={setSelectedSymbol}
              />
              
              <div className="glass px-4 py-2 rounded-xl flex items-center gap-4 border border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Strategy</span>
                <div className="flex gap-2">
                  {(['median', 'weighted', 'twap'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStrategy(s)}
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded transition-colors ${strategy === s ? 'bg-purple-500 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
           </div>

           {/* Main Chart Section */}
           <div className="glass p-5 rounded-[1.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent shadow-2xl">
              <PriceChart 
                data={selectedHistory} 
                symbol={selectedSymbol} 
                height={300}
              />
           </div>
        </section>

        {/* Row 2: Grid of stats and details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
           
           {/* Active Assets Feed */}
           <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-bold text-white tracking-tight">Market Overview</h2>
                 <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 transition-opacity hover:opacity-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                    LIVE UPDATE
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedPrices.map((price) => (
                  <div 
                    key={price.symbol} 
                    onClick={() => setSelectedSymbol(price.symbol)}
                    className={`cursor-pointer transition-all duration-300 ${selectedSymbol === price.symbol ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'}`}
                  >
                    <PriceCard data={price} />
                  </div>
                ))}
              </div>
           </div>

           {/* Side Details: Health & Info */}
           <div className="space-y-6">
              <SourceHealth health={health} />
              
              <div className="glass p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Architecture</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-[10px] text-slate-500">Aggregation</span>
                    <span className="text-[10px] font-mono font-bold text-white">On-Chain</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-[10px] text-slate-500">Refresh</span>
                    <span className="text-[10px] font-mono font-bold text-white">15s</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-[10px] text-slate-500">Model</span>
                    <span className="text-[10px] font-mono font-bold text-green-500">Standard</span>
                  </div>
                </div>
              </div>
           </div>

        </div>
      </div>
    </main>
  );
}