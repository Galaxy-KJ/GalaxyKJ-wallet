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

// Helpers
type NativeBalance = { asset_type: 'native'; balance: string }
type CreditBalance = { asset_type: string; asset_code: string; asset_issuer: string; balance: string }
type AccountLike = { balances: Array<NativeBalance | CreditBalance> }
const isCreditBalance = (b: AccountLike['balances'][number]): b is CreditBalance => (
  'asset_code' in b && 'asset_issuer' in b
)
function parseAssetStrict(value: string | null): Asset {
  if (!value) throw new Error('Asset missing')
  const v = String(value)
  if (v === 'XLM' || v === 'native') return Asset.native()
  const [code, issuer] = v.split(':')
  if (!code || !issuer) throw new Error(`Non-native asset must be CODE:ISSUER, got ${v}`)
  return new Asset(code, issuer)
}

function hasTrustline(account: AccountLike, asset: Asset): boolean {
  if (asset.isNative()) return true
  const code = asset.getCode()
  const issuer = asset.getIssuer()
  return account.balances.some((b) => isCreditBalance(b) && b.asset_code === code && b.asset_issuer === issuer)
}

function getBalance(account: AccountLike, asset: Asset): number {
  if (asset.isNative()) {
    const b = account.balances.find((x) => x.asset_type === 'native')
    return b ? Number(b.balance) : 0
  }
  const code = asset.getCode()
  const issuer = asset.getIssuer()
  const b = account.balances.find((x) => isCreditBalance(x) && x.asset_code === code && x.asset_issuer === issuer)
  return b ? Number(b.balance) : 0
}

function toFixed7(n: number): string {
  return (Math.floor(n * 1e7) / 1e7).toString()
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
            executed_at: new Date().toISOString(),
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
        } else if (a.type === 'swap') {
          // Only support price_target for now. Increase/decrease require a baseline not stored yet.
          if (a.condition !== 'price_target') {
            await supabaseClient.from('automation_executions').insert({
              automation_id: a.id,
              executed_at: new Date().toISOString(),
              status: 'skipped',
              error: 'swap condition not supported (only price_target)',
              metadata: { type: 'swap', condition: a.condition },
            })
            results.push({ id: a.id, type: a.type, status: 'skipped' })
            continue
          }

          // Decrypt secret and load account
          const decryptedSecret = AES.decrypt(a.encrypted_secret, encryptionKey).toString(enc.Utf8)
          if (!decryptedSecret) throw new Error('Failed to decrypt secret key')
          const keypair = Keypair.fromSecret(decryptedSecret)
          const account = await server.loadAccount(keypair.publicKey())

          // Build assets (require CODE:ISSUER for non-native)
          const sendAsset = parseAssetStrict(a.asset_from)
          const destAsset = parseAssetStrict(a.asset_to)
          const sendAmount = String(a.amount_from)
          const slippagePct = typeof a.slippage === 'number' && a.slippage > 0 ? a.slippage : 0.5

          // Quote using strict-send paths
          const pathsResp: any = await (server as any).strictSendPaths(sendAsset, sendAmount, [destAsset]).call()
          const records: any[] = pathsResp.records ?? pathsResp ?? []
          if (!records.length) {
            await supabaseClient.from('automation_executions').insert({
              automation_id: a.id,
              executed_at: new Date().toISOString(),
              status: 'skipped',
              error: 'No liquidity path for swap',
              metadata: { type: 'swap' },
            })
            results.push({ id: a.id, type: a.type, status: 'skipped' })
            continue
          }

          // Choose best path by max destination amount
          records.sort((x, y) => Number(y.destination_amount) - Number(x.destination_amount))
          const best = records[0]
          const destAmount = Number(best.destination_amount)

          // If a.condition_value exists, interpret as price target in dest units per 1 send unit when dest is USDC or similar.
          // Approximate unit price as destAmount / sendAmount
          if (typeof a.condition_value === 'number' && a.condition_value > 0) {
            const unitPrice = destAmount / Number(sendAmount)
            if (unitPrice < a.condition_value) {
              await supabaseClient.from('automation_executions').insert({
                automation_id: a.id,
                executed_at: new Date().toISOString(),
                status: 'skipped',
                error: 'Price target not reached',
                metadata: { type: 'swap', unitPrice, target: a.condition_value },
              })
              results.push({ id: a.id, type: a.type, status: 'skipped' })
              continue
            }
          }

          // Ensure trustline for destination if non-native
          const needsTrust = destAsset.getCode && destAsset.getIssuer ? !(hasTrustline(account, destAsset)) : false
          const fee = await server.fetchBaseFee().catch(() => 100)
          const txb = new TransactionBuilder(account, { fee: String(fee), networkPassphrase })

          if (needsTrust) {
            txb.addOperation(Operation.changeTrust({ asset: destAsset }))
          }

          const destMin = toFixed7(destAmount * (1 - slippagePct / 100))
          const pathAssets = (best.path ?? []).map((p: any) => p.asset_type === 'native' ? Asset.native() : new Asset(p.asset_code, p.asset_issuer))
          txb.addOperation(Operation.pathPaymentStrictSend({
            sendAsset,
            sendAmount,
            destination: keypair.publicKey(),
            destAsset,
            destMin: String(destMin),
            path: pathAssets,
          }))

          const tx = txb.setTimeout(60).build()
          tx.sign(keypair)

          const submit = await server.submitTransaction(tx)

          await supabaseClient.from('automation_executions').insert({
            automation_id: a.id,
            executed_at: new Date().toISOString(),
            status: 'executed',
            tx_hash: submit.hash,
            metadata: { type: 'swap', destAmount, ledger: submit.ledger },
          })
          results.push({ id: a.id, type: a.type, status: 'success', hash: submit.hash })
        } else if (a.type === 'rule') {
          // Implement balance-threshold + alert. Percent-drop and buy/sell are not yet supported.
          if (a.rule_threshold == null || a.asset == null) {
            await supabaseClient.from('automation_executions').insert({
              automation_id: a.id,
              executed_at: new Date().toISOString(),
              status: 'skipped',
              error: 'rule missing threshold or asset',
              metadata: { type: 'rule' },
            })
            results.push({ id: a.id, type: a.type, status: 'skipped' })
            continue
          }

          // If negative => percent drop not supported yet
          if (typeof a.rule_threshold === 'number' && a.rule_threshold < 0) {
            await supabaseClient.from('automation_executions').insert({
              automation_id: a.id,
              executed_at: new Date().toISOString(),
              status: 'skipped',
              error: 'percent-drop rules not supported yet',
              metadata: { type: 'rule' },
            })
            results.push({ id: a.id, type: a.type, status: 'skipped' })
            continue
          }

          const decryptedSecret = AES.decrypt(a.encrypted_secret, encryptionKey).toString(enc.Utf8)
          if (!decryptedSecret) throw new Error('Failed to decrypt secret key')
          const keypair = Keypair.fromSecret(decryptedSecret)
          const account = await server.loadAccount(keypair.publicKey())

          const targetAsset = parseAssetStrict(a.asset)
          const bal = getBalance(account, targetAsset)
          const threshold = Number(a.rule_threshold)

          if (bal <= threshold) {
            if (a.rule_action === 'alert' || !a.rule_action) {
              await supabaseClient.from('automation_executions').insert({
                automation_id: a.id,
                executed_at: new Date().toISOString(),
                status: 'executed',
                tx_hash: null,
                metadata: { type: 'rule', action: 'alert', balance: bal, threshold },
              })
              results.push({ id: a.id, type: a.type, status: 'success' })
            } else {
              await supabaseClient.from('automation_executions').insert({
                automation_id: a.id,
                executed_at: new Date().toISOString(),
                status: 'skipped',
                error: 'rule action not supported yet (buy/sell/custom)',
                metadata: { type: 'rule', action: a.rule_action },
              })
              results.push({ id: a.id, type: a.type, status: 'skipped' })
            }
          } else {
            await supabaseClient.from('automation_executions').insert({
              automation_id: a.id,
              executed_at: new Date().toISOString(),
              status: 'skipped',
              error: 'threshold not met',
              metadata: { type: 'rule', balance: bal, threshold },
            })
            results.push({ id: a.id, type: a.type, status: 'skipped' })
          }
        } else {
          results.push({ id: a.id, status: 'ignored' })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await supabaseClient.from('automation_executions').insert({
          automation_id: a.id,
          executed_at: new Date().toISOString(),
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
