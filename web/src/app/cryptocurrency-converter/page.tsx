'use client'

import dynamic from 'next/dynamic'
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { StarBackground } from "@/components/effects/star-background"

// Dynamic import to prevent SSR issues with SecureKeyProvider
const CryptoConverter = dynamic(
  () => import("@/components/cryptocurrency-converter/crypto-converter"),
  { ssr: false }
)

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black">
      <StarBackground />
      
      <main className="relative z-10 min-h-screen pt-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6 flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-400 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Cryptocurrency Converter
              </h1>
              <p className="text-gray-500">Convert between cryptocurrencies and fiat currencies</p>
            </div>
          </header>

          <CryptoConverter />
        </div>
      </main>
    </div>
  )
} 