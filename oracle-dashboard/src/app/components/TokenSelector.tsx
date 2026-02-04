'use client';

import { formatPrice } from '@/lib/formatters';

interface TokenSelectorProps {
  tokens: { symbol: string; price: number }[];
  selected: string;
  onSelect: (symbol: string) => void;
}

export function TokenSelector({ tokens, selected, onSelect }: TokenSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
      {tokens.map((token) => (
        <button
          key={token.symbol}
          onClick={() => onSelect(token.symbol)}
          className={`px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${
            selected === token.symbol
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'hover:bg-white/5 text-slate-400'
          }`}
        >
          <div className={`w-1 h-1 rounded-full ${selected === token.symbol ? 'bg-white' : 'bg-slate-600'}`}></div>
          <span className="text-xs font-bold tracking-wider">{token.symbol}</span>
          <span className={`text-[10px] font-mono opacity-80 ${selected === token.symbol ? 'text-white' : 'text-slate-500'}`}>
            {formatPrice(token.price)}
          </span>
        </button>
      ))}
    </div>
  );
}
