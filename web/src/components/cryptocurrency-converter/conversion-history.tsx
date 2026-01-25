import { Clock, Loader2 } from "lucide-react"
import { useWalletStore } from "@/store/wallet-store"
import { useEffect, useState } from "react"

interface ConversionTransaction {
  id: string
  fromSymbol: string
  toSymbol: string
  fromAmount: string
  toAmount: string
  date: string
  type: 'payment' | 'path_payment' | 'manage_offer' | 'create_passive_offer'
}

export default function ConversionHistory() {
  const { transactions, connectionStatus } = useWalletStore()
  const [conversionHistory, setConversionHistory] = useState<ConversionTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const conversions = processTransactions(transactions)
      setConversionHistory(conversions)
    } else {
      setConversionHistory([])
    }
    setLoading(false)
  }, [transactions])

  const processTransactions = (transactions: any[]): ConversionTransaction[] => {
    const conversions: ConversionTransaction[] = []
    
    transactions.forEach((tx: any) => {
      if (!tx.successful) return

      // Process payment operations
      if (tx.operations) {
        tx.operations.forEach((op: any) => {
          if (op.type === 'payment') {
            const fromAsset = getAssetSymbol(op.from)
            const toAsset = getAssetSymbol(op.to || tx.source_account)
            
            if (fromAsset !== toAsset) {
              conversions.push({
                id: `${tx.id}-${op.id}`,
                fromSymbol: fromAsset,
                toSymbol: toAsset,
                fromAmount: formatAmount(op.amount, fromAsset),
                toAmount: formatAmount(op.amount, toAsset),
                date: formatDate(tx.created_at),
                type: 'payment'
              })
            }
          } else if (op.type === 'path_payment_strict_send' || op.type === 'path_payment_strict_receive') {
            const fromAsset = getAssetSymbol(op.from)
            const toAsset = getAssetSymbol(op.to)
            
            conversions.push({
              id: `${tx.id}-${op.id}`,
              fromSymbol: fromAsset,
              toSymbol: toAsset,
              fromAmount: formatAmount(op.source_amount || op.source_max, fromAsset),
              toAmount: formatAmount(op.destination_amount || op.destination_min, toAsset),
              date: formatDate(tx.created_at),
              type: 'path_payment'
            })
          } else if (op.type === 'manage_offer' || op.type === 'create_passive_offer') {
            const sellingAsset = getAssetSymbol(op.selling)
            const buyingAsset = getAssetSymbol(op.buying)
            
            if (op.amount !== '0') {
              conversions.push({
                id: `${tx.id}-${op.id}`,
                fromSymbol: sellingAsset,
                toSymbol: buyingAsset,
                fromAmount: formatAmount(op.amount, sellingAsset),
                toAmount: formatAmount((parseFloat(op.amount) * parseFloat(op.price)).toString(), buyingAsset),
                date: formatDate(tx.created_at),
                type: op.type as 'manage_offer' | 'create_passive_offer'
              })
            }
          }
        })
      }
    })

    // Sort by date (newest first) and limit to 10
    return conversions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
  }

  const getAssetSymbol = (asset: any): string => {
    if (!asset || asset.asset_type === 'native') {
      return 'XLM'
    }
    return asset.asset_code || 'Unknown'
  }

  const formatAmount = (amount: string, asset: string): string => {
    const numAmount = parseFloat(amount)
    if (asset === 'XLM') {
      return (numAmount / 10000000).toFixed(6) // XLM has 7 decimal places
    }
    return numAmount.toFixed(6)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="p-5">
          <h2 className="text-2xl font-normal text-white mb-5">Conversion History</h2>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
            <span className="text-gray-400 ml-2">Loading transactions...</span>
          </div>
        </div>
      </div>
    )
  }

  if (connectionStatus.error || !transactions || transactions.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="p-5">
          <h2 className="text-2xl font-normal text-white mb-5">Conversion History</h2>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <p className="text-sm">No conversion history available</p>
              <p className="text-xs text-gray-500 mt-1">
                {connectionStatus.error ? 'Wallet connection error' : 'No transactions found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
      <div className="p-5">
        <h2 className="text-2xl font-normal text-white mb-5">Conversion History</h2>
        {conversionHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400">
              <p className="text-sm">No conversions found</p>
              <p className="text-xs text-gray-500 mt-1">Your conversion history will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {conversionHistory.map((conversion) => (
              <div key={conversion.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span className="text-white text-lg">
                      {conversion.fromSymbol} → {conversion.toSymbol}
                    </span>
                  </div>
                  <div className="text-gray-500 text-sm pl-0">
                    {conversion.fromAmount} {conversion.fromSymbol}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end text-white text-xs mb-0.5 bg-gray-800/50 px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3 mr-1 text-white" />
                    <span>{conversion.date}</span>
                  </div>
                  <div className="text-white text-base">
                    {conversion.toAmount} {conversion.toSymbol}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
