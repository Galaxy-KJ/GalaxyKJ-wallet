import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { AutomationRow, AutomationExecutionRow } from '@/lib/supabase-types'

interface State {
  automations: AutomationRow[]
  executions: AutomationExecutionRow[]
  loading: boolean
  error: string | null
}

export function useAutomationExecution(publicKey?: string | null) {
  const [state, setState] = useState<State>({ automations: [], executions: [], loading: false, error: null })
  const userIdRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!userIdRef.current) return
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const params = new URLSearchParams()
      if (publicKey) params.set('publicKey', publicKey)
      params.set('history', '1')
      const res = await fetch(`/api/automation/status?${params.toString()}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setState(s => ({ ...s, automations: data.automations ?? [], executions: data.executions ?? [], loading: false }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load automations'
      setState(s => ({ ...s, loading: false, error: msg }))
    }
  }, [publicKey])

  // current user
  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      userIdRef.current = user?.id ?? null
      load()
    })
    return () => { mounted = false }
  }, [load])

  // realtime
  useEffect(() => {
    if (!userIdRef.current) return
    const uid = userIdRef.current

    const channel = supabase
      .channel(`automations-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automations', filter: `user_id=eq.${uid}` }, () => {
        load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_executions' }, (payload) => {
        // Lightweight merge to avoid full reload on execution insert
        if (payload.eventType === 'INSERT') {
          setState(s => ({ ...s, executions: [payload.new as AutomationExecutionRow, ...s.executions].slice(0, 200) }))
        } else {
          // fallback to reload
          load()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [load])

  const create = useCallback(async (payload: Partial<AutomationRow> & { public_key: string; encrypted_secret: string; type: AutomationRow['type'] }) => {
    const res = await fetch('/api/automation/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      publicKey: payload.public_key,
      encryptedSecret: payload.encrypted_secret,
      type: payload.type,
      recipient: payload.recipient ?? null,
      asset: payload.asset ?? null,
      amount: payload.amount ?? null,
      frequency: payload.frequency ?? null,
      nextExecuteAt: payload.next_execute_at ?? null,
      assetFrom: payload.asset_from ?? null,
      assetTo: payload.asset_to ?? null,
      amountFrom: payload.amount_from ?? null,
      condition: payload.condition ?? null,
      conditionValue: payload.condition_value ?? null,
      slippage: payload.slippage ?? null,
      ruleThreshold: payload.rule_threshold ?? null,
      ruleAction: payload.rule_action ?? null,
      ruleAmount: payload.rule_amount ?? null,
      memo: payload.memo ?? null,
      active: payload.active ?? true,
    }) })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    setState(s => ({ ...s, automations: [data.automation as AutomationRow, ...s.automations] }))
    return data.automation as AutomationRow
  }, [])

  const update = useCallback(async (id: string, updates: Partial<AutomationRow>) => {
    const res = await fetch('/api/automation/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, updates }) })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    setState(s => ({ ...s, automations: s.automations.map(a => a.id === id ? data.automation as AutomationRow : a) }))
    return data.automation as AutomationRow
  }, [])

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/automation/delete?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())
    setState(s => ({ ...s, automations: s.automations.filter(a => a.id !== id) }))
    return true
  }, [])

  const toggleActive = useCallback(async (id: string, active: boolean) => {
    return update(id, { active })
  }, [update])

  const manualExecute = useCallback(async (id: string, immediate = false) => {
    const res = await fetch('/api/automation/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, immediate }) })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<{ enqueued: boolean; triggered: boolean; triggerError: string | null }>
  }, [])

  const metrics = useMemo(() => {
    const total = state.executions.length
    const success = state.executions.filter(e => e.status === 'executed').length
    const error = state.executions.filter(e => e.status === 'error').length
    const rate = total ? success / total : 0
    return { total, success, error, successRate: rate }
  }, [state.executions])

  return {
    ...state,
    refresh: load,
    create,
    update,
    remove,
    toggleActive,
    manualExecute,
    metrics,
  }
}
