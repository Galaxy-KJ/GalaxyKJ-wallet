import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'
import { AutomationService } from '@/lib/automation/automation-service'
import CryptoJS from 'crypto-js'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const envKey = process.env.ENCRYPTION_KEY
    if (!envKey) {
      return NextResponse.json({ error: 'Server misconfigured: ENCRYPTION_KEY missing' }, { status: 500 })
    }

    // Accept either encryptedSecret or a raw secretKey and encrypt on the server.
    let encryptedSecret: string | undefined = body.encryptedSecret
    const secretKey: string | undefined = body.secretKey
    if (!encryptedSecret) {
      if (!secretKey || typeof secretKey !== 'string') {
        return NextResponse.json({ error: 'Missing encryptedSecret or secretKey' }, { status: 400 })
      }
      encryptedSecret = CryptoJS.AES.encrypt(secretKey, envKey).toString()
    }

    // Memo: truncate to 28 bytes (UTF-8)
    let memo: string | null = body.memo ?? null
    if (typeof memo === 'string') {
      const enc = new TextEncoder()
      while (enc.encode(memo).length > 28) {
        memo = memo.slice(0, -1)
      }
    }

    // If type is payment and frequency provided, compute a default nextExecuteAt if missing
    let nextExecuteAt: string | null = body.nextExecuteAt ?? null
    if (!nextExecuteAt && body.type === 'payment') {
      const now = new Date()
      const freq = body.frequency as 'once' | 'weekly' | 'monthly' | 'yearly' | undefined
      if (freq === 'weekly') now.setDate(now.getDate() + 7)
      else if (freq === 'monthly') now.setMonth(now.getMonth() + 1)
      else if (freq === 'yearly') now.setFullYear(now.getFullYear() + 1)
      else now.setDate(now.getDate() + 1) // default +1 day
      nextExecuteAt = now.toISOString()
    }

    const created = await AutomationService.create({
      userId: user.id,
      publicKey: body.publicKey,
      encryptedSecret: encryptedSecret,
      type: body.type,
      recipient: body.recipient ?? null,
      asset: body.asset ?? null,
      amount: body.amount ?? null,
      frequency: body.frequency ?? null,
      nextExecuteAt,
      assetFrom: body.assetFrom ?? null,
      assetTo: body.assetTo ?? null,
      amountFrom: body.amountFrom ?? null,
      condition: body.condition ?? null,
      conditionValue: body.conditionValue ?? null,
      slippage: body.slippage ?? null,
      ruleThreshold: body.ruleThreshold ?? null,
      ruleAction: body.ruleAction ?? null,
      ruleAmount: body.ruleAmount ?? null,
      memo,
      active: body.active ?? true,
    })

    if (!created) {
      return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 })
    }

    return NextResponse.json({ automation: created })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
