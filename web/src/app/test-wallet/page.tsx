"use client"

import { useState, useEffect } from 'react'
import { openDB } from 'idb'

const DB_NAME = "wallet-db"
const STORE_NAME = "encrypted-wallet"

export default function TestWalletPage() {
  const [walletInfo, setWalletInfo] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const checkWallet = async () => {
    setIsLoading(true)
    setWalletInfo('')
    
    try {
      console.log("🔍 Checking wallet database...")
      
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
              keyPath: "id",
              autoIncrement: true
            })
            store.createIndex("wallet", "wallet", { unique: false })
          }
        },
      })
      
      console.log("✅ Database opened successfully")
      
      const wallets = await db.getAll(STORE_NAME)
      console.log(`📊 Found ${wallets.length} wallets in database`)
      
      let info = `Found ${wallets.length} wallet(s) in database:\n\n`
      
      if (wallets.length > 0) {
        wallets.forEach((wallet, index) => {
          info += `Wallet ${index + 1}:\n`
          info += `  ID: ${wallet.id}\n`
          info += `  Has encrypted data: ${!!wallet.wallet}\n`
          info += `  Created at: ${wallet.createdAt}\n`
          info += `  Encrypted data length: ${wallet.wallet ? wallet.wallet.length : 0}\n\n`
        })
      } else {
        info += "❌ No wallets found in database\n"
        info += "This means either:\n"
        info += "1. No wallet has been created yet\n"
        info += "2. There's a database name mismatch\n"
        info += "3. The wallet was created in a different database\n"
      }
      
      setWalletInfo(info)
      await db.close()
      
    } catch (error) {
      console.error("❌ Database check failed:", error)
      setWalletInfo(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Wallet Database Test</h1>
        
        <div className="bg-card border border-border p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Information</h2>
          <p className="text-muted-foreground mb-4">
            Database Name: <code className="bg-gray-700 px-2 py-1 rounded">{DB_NAME}</code>
          </p>
          <p className="text-muted-foreground mb-4">
            Store Name: <code className="bg-gray-700 px-2 py-1 rounded">{STORE_NAME}</code>
          </p>
          
          <button
            onClick={checkWallet}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            {isLoading ? 'Checking...' : 'Check Wallet Database'}
          </button>
        </div>
        
        {walletInfo && (
          <div className="bg-card border border-border p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-background p-4 rounded text-sm overflow-auto whitespace-pre-wrap border border-border">
              {walletInfo}
            </pre>
          </div>
        )}
        
        <div className="bg-card border border-border p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          <ul className="text-muted-foreground space-y-2">
            <li>• If no wallets are found, try creating a new wallet first</li>
            <li>• Check the browser console for detailed logs</li>
            <li>• Make sure you're using the same browser where you created the wallet</li>
            <li>• Clear browser data if you suspect database corruption</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
