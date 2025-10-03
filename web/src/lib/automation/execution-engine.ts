import { AutomationRow } from '@/lib/supabase-types'

/**
 * ExecutionEngine
 *
 * Client-side helper that delegates real execution to Edge Functions.
 * It never decrypts or signs locally. All sensitive work happens on Edge
 * using the ENCRYPTION_KEY environment secret.
 */
export class ExecutionEngine {
  private processUrl: string | null

  constructor() {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    this.processUrl = base ? `${base}/functions/v1/process-automations` : null
  }

  /**
   * Enqueue and optionally trigger immediate processing on Edge (dev convenience).
   * - Always use the Next.js API `/api/automation/execute` so we have auth context.
   */
  async triggerManualExecution(automationId: string, immediate = false) {
    const res = await fetch('/api/automation/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: automationId, immediate }),
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Manual execute failed: ${res.status} ${txt}`)
    }
    return res.json() as Promise<{ enqueued: boolean; triggered: boolean; triggerError: string | null }>
  }

  /**
   * Best-effort direct trigger for a specific automation on Edge.
   * Typically used only in development/testing.
   */
  async directEdgeTrigger(automationId: string) {
    if (!this.processUrl) throw new Error('Edge Function URL not configured')
    const resp = await fetch(this.processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automationId }),
    })
    return resp
  }

  /**
   * Helper for UI to compute a short status summary.
   */
  getStatusSummary(a: AutomationRow): string {
    if (!a.active) return 'inactive'
    if (a.type === 'payment') {
      return a.next_execute_at ? `next: ${new Date(a.next_execute_at).toLocaleString()}` : 'scheduled'
    }
    if (a.type === 'swap') return 'waiting for price condition'
    if (a.type === 'rule') return 'monitoring rules'
    return 'active'
  }
}

export const executionEngine = new ExecutionEngine()
