"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Info, AlertTriangle, Zap, Clock, DollarSign } from "lucide-react"
import { useCryptoPrices } from "@/hooks/use-crypto-prices"

export default function NetworkFeeCalculator() {
  const { getPrice } = useCryptoPrices()
  const [network, setNetwork] = useState("xlm")
  const [operations, setOperations] = useState("1")
  const [speed, setSpeed] = useState(1)

  const calculateFee = () => {
    const baseRate = network === "xlm" ? 0.00001 : network === "btc" ? 0.0001 : 0.0005
    const opMultiplier = Number.parseInt(operations) || 1
    const speedMultiplier = speed === 1 ? 1 : speed === 2 ? 1.5 : 2.5

    return (baseRate * opMultiplier * speedMultiplier).toExponential(5)
  }

  const fee = calculateFee()

  // Handle speed change
  // const handleSpeedChange = (newSpeed: number) => {
  //   if (newSpeed >= 1 && newSpeed <= 3) {
  //     setSpeed(newSpeed)
  //   }
  // }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
      <div className="p-6">
        <h2 className="text-2xl font-normal text-white mb-6">Network Fee Calculator</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-white">Blockchain Network</p>
              <div className="relative">
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full flex items-center justify-between bg-gray-800/30 border border-gray-700 rounded-lg p-2.5 text-white appearance-none"
                >
                  <option value="xlm">Stellar (XLM)</option>
                  <option value="btc">Bitcoin (BTC)</option>
                  <option value="eth">Ethereum (ETH)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-white">Number of Operations</p>
              <input
                type="number"
                value={operations}
                onChange={(e) => setOperations(e.target.value)}
                className="w-full bg-gray-800/30 border border-gray-700 rounded-lg p-2.5 text-white"
                min="1"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <p className="text-white">Transaction Speed</p>
              <p className="text-sm text-gray-400">{speed === 1 ? "Standard" : speed === 2 ? "Fast" : "Urgent"}</p>
            </div>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            <div
              className="relative h-2 w-full rounded-full bg-gray-800/30 my-4 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const width = rect.width
                const percentage = x / width

                if (percentage <= 0.33) {
                  setSpeed(1)
                } else if (percentage <= 0.66) {
                  setSpeed(2)
                } else {
                  setSpeed(3)
                }
              }}
            >
              <div className="absolute h-full bg-[#7e22ce] rounded-full" style={{ width: `${(speed - 1) * 50}%` }} />
              <div
                className="absolute h-5 w-5 rounded-full border-2 border-white bg-[#7e22ce] top-1/2 transform -translate-y-1/2 cursor-pointer"
                style={{ left: `${(speed - 1) * 50}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button onClick={() => setSpeed(1)} className="cursor-pointer">
                Standard
              </button>
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button onClick={() => setSpeed(2)} className="cursor-pointer">
                Fast
              </button>
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button onClick={() => setSpeed(3)} className="cursor-pointer">
                Urgent
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 rounded-lg bg-gray-800/30 border border-gray-700">
            <div>
              <p className="text-gray-400">Estimated Network Fee</p>
              <p className="text-xl font-bold text-white">
                {fee} {network.toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                ≈ $
                {(Number.parseFloat(fee) * (network === "xlm" ? getPrice("XLM") : network === "btc" ? getPrice("BTC") : getPrice("ETH"))).toFixed(
                  6,
                )}{" "}
                USD
              </p>
              <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                {/* biome-ignore lint/style/useSelfClosingElements: <explanation> */}
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <span>Network Normal</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs py-3 px-4 bg-gray-800/50 rounded-none">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#4a9fff]" />
            <p className="text-[#4a9fff]">
              Network fees are dynamic and can change based on network congestion. This calculator provides estimates
              based on current network conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
