import { AutomationRow } from '@/lib/supabase-types'

/**
 * Scheduler (dev/local only)
 *
 * For production, use Supabase cron to call the Edge function periodically.
 * This client-side scheduler is optional to simulate cron in development.
 */
export class Scheduler {
  private timer: number | null = null
  private intervalMs: number
  private onDue: (due: AutomationRow[]) => void

  constructor(onDue: (due: AutomationRow[]) => void, intervalMs: number = 30_000) {
    this.onDue = onDue
    this.intervalMs = intervalMs
  }

  start(getAutomations: () => Promise<AutomationRow[]>) {
    if (this.timer) return
    const tick = async () => {
      try {
        const list = await getAutomations()
        const now = Date.now()
        const due = list.filter(a => a.active && a.type === 'payment' && a.next_execute_at && new Date(a.next_execute_at).getTime() <= now)
        if (due.length) this.onDue(due)
      } catch  {
        // swallow errors
      }
    }
    // immediate and interval
    tick()
    this.timer = setInterval(tick, this.intervalMs) as unknown as number
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
