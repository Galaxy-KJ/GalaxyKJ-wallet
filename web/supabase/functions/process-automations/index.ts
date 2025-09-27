import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  Keypair,
  Server,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
} from 'https://esm.sh/stellar-sdk@12.1.0'
import { AES, enc } from 'https://esm.sh/crypto-js@4.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await safeJson(req)
    const specificAutomationId = body?.automationId as string | undefined

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stellarNetwork = Deno.env.get('STELLAR_NETWORK') || 'testnet'
    const horizonUrl = stellarNetwork === 'mainnet'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org'
    const server = new Server(horizonUrl)
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY') ?? ''
    const networkPassphrase = stellarNetwork === 'mainnet'
      ? Networks.PUBLIC
      : Networks.TESTNET

    const nowIso = new Date().toISOString()

    let automations: any[] = []

    if (specificAutomationId) {
      const { data, error } = await supabaseClient
        .from('automations')
        .select('*')
        .eq('id', specificAutomationId)
        .eq('active', true)
        .limit(1)
      if (error) throw new Error(`Fetch automation failed: ${error.message}`)
      automations = data || []
    } else {
      // Due payment automations
      const { data, error } = await supabaseClient
        .from('automations')
        .select('*')
        .eq('active', true)
        .lte('next_execute_at', nowIso)
      if (error) throw new Error(`Fetch due automations failed: ${error.message}`)
      automations = data || []
    }

    const results: Array<Record<string, unknown>> = []

    for (const a of automations) {
      try {
        if (a.type === 'payment') {
          // Decrypt secret
          const decryptedSecret = AES.decrypt(a.encrypted_secret, encryptionKey).toString(enc.Utf8)
          if (!decryptedSecret) throw new Error('Failed to decrypt secret key')

          const keypair = Keypair.fromSecret(decryptedSecret)
          const account = await server.loadAccount(keypair.publicKey())

          // Build asset
          let asset
          if (a.asset === 'XLM' || a.asset === 'native') {
            asset = Asset.native()
          } else {
            const [code, issuer] = String(a.asset).split(':')
            if (!code || !issuer) throw new Error(`Invalid asset format: ${a.asset}`)
            asset = new Asset(code, issuer)
          }

          const fee = await server.fetchBaseFee().catch(() => 100)

          const txb = new TransactionBuilder(account, {
            fee: String(fee),
            networkPassphrase,
          })
            .addOperation(Operation.payment({
              destination: a.recipient,
              asset,
              amount: String(a.amount),
            }))

          if (a.memo && String(a.memo).trim()) {
            const memo = String(a.memo)
            const truncated = memo.length > 28 ? memo.substring(0, 28) : memo
            txb.addMemo(Memo.text(truncated))
          }

          const tx = txb.setTimeout(60).build()
          tx.sign(keypair)

          const submit = await server.submitTransaction(tx)

          // history
          await supabaseClient.from('automation_executions').insert({
            automation_id: a.id,
            status: 'executed',
            tx_hash: submit.hash,
            metadata: { ledger: submit.ledger },
          })

          // reschedule if frequency
          if (a.frequency && a.frequency !== 'once') {
            const next = calculateNextExecution(a.next_execute_at ?? nowIso, a.frequency)
            await supabaseClient
              .from('automations')
              .update({ next_execute_at: next })
              .eq('id', a.id)
          } else {
            // optional: deactivate one-time after execution
            await supabaseClient
              .from('automations')
              .update({ active: false, next_execute_at: null })
              .eq('id', a.id)
          }

          results.push({ id: a.id, type: a.type, status: 'success', hash: submit.hash })
        } else if (a.type === 'swap' || a.type === 'rule') {
          // TODO: implement swap/rule execution using pathPaymentStrictSend and condition evaluation
          await supabaseClient.from('automation_executions').insert({
            automation_id: a.id,
            status: 'skipped',
            error: 'Not implemented yet in Edge function',
            metadata: { type: a.type },
          })
          results.push({ id: a.id, type: a.type, status: 'skipped' })
        } else {
          results.push({ id: a.id, status: 'ignored' })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await supabaseClient.from('automation_executions').insert({
          automation_id: a.id,
          status: 'error',
          error: message,
        })
        results.push({ id: a.id, status: 'error', error: message })
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: message, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})

async function safeJson(req: Request): Promise<any | null> {
  try {
    if (req.method === 'GET') return null
    const text = await req.text()
    if (!text) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

function calculateNextExecution(currentExecution: string, frequency: string): string {
  const current = new Date(currentExecution)
  switch (frequency) {
    case 'weekly':
      current.setDate(current.getDate() + 7)
      break
    case 'monthly':
      current.setMonth(current.getMonth() + 1)
      break
    case 'yearly':
      current.setFullYear(current.getFullYear() + 1)
      break
    default:
      throw new Error(`Unsupported frequency: ${frequency}`)
  }
  return current.toISOString()
}
