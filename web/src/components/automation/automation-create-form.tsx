"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWalletStore } from "@/store/wallet-store"

interface Props {
  onClose: () => void
}

export function AutomationCreateForm({ onClose }: Props) {
  const publicKey = useWalletStore((s) => s.publicKey)

  type Frequency = 'once' | 'weekly' | 'monthly' | 'yearly'
  const [type] = useState<'payment' | 'swap' | 'rule'>('payment')
  const [recipient, setRecipient] = useState('')
  const [asset, setAsset] = useState('XLM')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [memo, setMemo] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFrequency = (v: string): v is Frequency => (
    v === 'once' || v === 'weekly' || v === 'monthly' || v === 'yearly'
  )

  const onSubmit = async () => {
    setError(null)
    if (!publicKey) {
      setError('Connect a wallet first')
      return
    }
    if (!recipient || !asset || !amount || !secretKey) {
      setError('Fill all required fields')
      return
    }
    setLoading(true)
    try {
      // Call the API directly with secretKey so server encrypts with ENCRYPTION_KEY
      await fetch('/api/automation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey,
          secretKey,
          type,
          recipient,
          asset,
          amount: Number(amount),
          frequency,
          memo,
        })
      })

      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-400">{error}</div>}
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient</Label>
        <Input id="recipient" placeholder="G..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className="bg-gray-800/50 border-gray-700" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="asset">Asset</Label>
          <Select value={asset} onValueChange={(v) => setAsset(v)}>
            <SelectTrigger id="asset" className="bg-gray-800/50 border-gray-700">
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="XLM">XLM</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-gray-800/50 border-gray-700" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select value={frequency} onValueChange={(v) => { if (isFrequency(v)) setFrequency(v) }}>
          <SelectTrigger id="frequency" className="bg-gray-800/50 border-gray-700">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="once">Once</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="memo">Memo (optional)</Label>
        <Input id="memo" placeholder="Memo" value={memo} onChange={(e) => setMemo(e.target.value)} className="bg-gray-800/50 border-gray-700" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="secretKey">Secret Key</Label>
        <Input id="secretKey" type="password" placeholder="S..." value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="bg-gray-800/50 border-gray-700 font-mono text-sm" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="border-gray-700 bg-gray-800/50">Cancel</Button>
        <Button onClick={onSubmit} disabled={loading} className="bg-gradient-to-r from-[#3B82F6] to-[#9333EA]">
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </div>
  )
}
