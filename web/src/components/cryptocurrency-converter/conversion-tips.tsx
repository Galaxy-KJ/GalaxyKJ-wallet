"use client"

import { Info, Zap } from "lucide-react"

export default function ConversionTips() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(to bottom right, #1a2344, #2a1a4a)" }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-[#1e3a6a] rounded-full p-2.5 flex items-center justify-center">
            <Info className="h-5 w-5 text-[#4a9fff]" />
          </div>
          <h2 className="text-2xl font-normal text-white">Conversion Tips</h2>
        </div>

        <p className="text-gray-300 mb-4 ml-0">
          Always check the current market rates before making large conversions. Prices can fluctuate rapidly in
          cryptocurrency markets.
        </p>

        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <Zap className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-1" />
            <p className="text-gray-300">
              Network fees vary by blockchain. Bitcoin and Ethereum typically have higher fees than Stellar.
            </p>
          </div>

          <div className="flex gap-3 items-start">
            <Zap className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-1" />
            <p className="text-gray-300">
              Consider using stablecoins like USDC for temporary holdings during market volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
