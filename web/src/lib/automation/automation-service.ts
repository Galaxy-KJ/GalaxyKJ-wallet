import { supabase } from '@/lib/supabase-client'
import type {
  AutomationInsert,
  AutomationRow,
  AutomationUpdate,
  AutomationExecutionInsert,
  AutomationExecutionRow,
} from '@/lib/supabase-types'

export type AutomationType = AutomationRow['type']

export interface CreateAutomationParams {
  userId: string
  publicKey: string
  encryptedSecret: string
  type: AutomationType
  // payment
  recipient?: string | null
  asset?: string | null
  amount?: number | null
  frequency?: 'once' | 'weekly' | 'monthly' | 'yearly' | null
  nextExecuteAt?: string | null
  // swap
  assetFrom?: string | null
  assetTo?: string | null
  amountFrom?: number | null
  condition?: 'price_increase' | 'price_decrease' | 'price_target' | null
  conditionValue?: number | null
  slippage?: number | null
  // rule
  ruleThreshold?: number | null
  ruleAction?: 'alert' | 'buy' | 'sell' | 'custom' | null
  ruleAmount?: number | null
  // common
  memo?: string | null
  active?: boolean
}

export class AutomationService {
  static async create(params: CreateAutomationParams): Promise<AutomationRow | null> {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    const payload: AutomationInsert = {
      user_id: params.userId,
      public_key: params.publicKey,
      encrypted_secret: params.encryptedSecret,
      type: params.type,
      active: params.active ?? true,
      // payment
      recipient: params.recipient ?? null,
      asset: params.asset ?? null,
      amount: params.amount ?? null,
      frequency: params.frequency ?? null,
      next_execute_at: params.nextExecuteAt ?? null,
      // swap
      asset_from: params.assetFrom ?? null,
      asset_to: params.assetTo ?? null,
      amount_from: params.amountFrom ?? null,
      condition: params.condition ?? null,
      condition_value: params.conditionValue ?? null,
      slippage: params.slippage ?? 0.02,
      // rule
      rule_threshold: params.ruleThreshold ?? null,
      rule_action: params.ruleAction ?? null,
      rule_amount: params.ruleAmount ?? null,
      // common
      memo: params.memo ?? null,
    }

    const { data, error } = await supabase
      .from('automations')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('create automation error', error)
      return null
    }
    return data
  }

  static async update(id: string, updates: Partial<AutomationUpdate>): Promise<AutomationRow | null> {
    const { data, error } = await supabase
      .from('automations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('update automation error', error)
      return null
    }
    return data
  }

  static async toggleActive(id: string, active: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('automations')
      .update({ active } satisfies Partial<AutomationUpdate>)
      .eq('id', id)
    if (error) {
      console.error('toggle automation error', error)
      return false
    }
    return true
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('delete automation error', error)
      return false
    }
    return true
  }

  static async getById(id: string): Promise<AutomationRow | null> {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      console.error('get automation error', error)
      return null
    }
    return data
  }

  static async listByUser(userId: string): Promise<AutomationRow[]> {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('list automations error', error)
      return []
    }
    return data ?? []
  }

  static async listByUserAndWallet(userId: string, publicKey: string): Promise<AutomationRow[]> {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', userId)
      .eq('public_key', publicKey)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('list automations by wallet error', error)
      return []
    }
    return data ?? []
  }

  static async recordExecution(input: Omit<AutomationExecutionInsert, 'executed_at'> & { executed_at?: string }): Promise<AutomationExecutionRow | null> {
    const payload: AutomationExecutionInsert = {
      automation_id: input.automation_id,
      executed_at: input.executed_at ?? new Date().toISOString(),
      status: input.status,
      tx_hash: input.tx_hash ?? null,
      error: input.error ?? null,
      metadata: input.metadata ?? null,
    }
    const { data, error } = await supabase
      .from('automation_executions')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('record execution error', error)
      return null
    }
    return data
  }

  static async listExecutionsByAutomation(automationId: string, limit: number = 50): Promise<AutomationExecutionRow[]> {
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('automation_id', automationId)
      .order('executed_at', { ascending: false })
      .limit(limit)
    if (error) {
      console.error('list executions error', error)
      return []
    }
    return data ?? []
  }

  static async listExecutionsByUser(userId: string, limit: number = 100): Promise<AutomationExecutionRow[]> {
    // join via RPC not available; fetch automations then executions
    const automations = await this.listByUser(userId)
    const ids = automations.map(a => a.id)
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .in('automation_id', ids)
      .order('executed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('list user executions error', error)
      return []
    }
    return data ?? []
  }
}
