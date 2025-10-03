import { AutomationRow } from '@/lib/supabase-types'
import { Scheduler } from './scheduler'
import { executionEngine } from './execution-engine'
import { priceMonitor } from './price-monitor'

/**
 * BackgroundProcessor (dev/local only)
 * - Periodically checks for due payment automations via Scheduler
 * - Listens to price updates and can trigger swap/rule automations once Edge supports them
 * - Delegates execution to Edge via /api/automation/execute
 */
export class BackgroundProcessor {
  private scheduler: Scheduler | null = null
  private unsubscribers: Array<() => void> = []

  start(getAutomations: () => Promise<AutomationRow[]>) {
    if (this.scheduler) return
    this.scheduler = new Scheduler(async (due) => {
      for (const a of due) {
        try {
          await executionEngine.triggerManualExecution(a.id, true)
        } catch {
          // best-effort
        }
      }
    }, 20_000)

    this.scheduler.start(getAutomations)

    // Price listeners (simple)
    const unsubXLM = priceMonitor.subscribe('XLM', async () => {
      await this.checkPriceTriggered(getAutomations)
    }, 15_000)

    const unsubUSDC = priceMonitor.subscribe('USDC', async () => {
      await this.checkPriceTriggered(getAutomations)
    }, 30_000)

    this.unsubscribers.push(unsubXLM, unsubUSDC)
  }

  stop() {
    if (this.scheduler) {
      this.scheduler.stop()
      this.scheduler = null
    }
    for (const u of this.unsubscribers) {
      try { u() } catch {}
    }
    this.unsubscribers = []
  }

  private async checkPriceTriggered(getAutomations: () => Promise<AutomationRow[]>) {
    const autos = await getAutomations()
    const priceMap: Record<string, number | undefined> = {
      XLM: priceMonitor.getLatest('XLM'),
      USDC: priceMonitor.getLatest('USDC'),
    }

    for (const a of autos) {
      if (!a.active) continue
      if (a.type === 'swap') {
        const from = (a.asset_from || '').split(':')[0] || a.asset_from || ''
        const to = (a.asset_to || '').split(':')[0] || a.asset_to || ''
        const fromPrice = priceMap[from as keyof typeof priceMap]
        const toPrice = priceMap[to as keyof typeof priceMap]
        if (typeof fromPrice !== 'number' || typeof toPrice !== 'number') continue

        // Basic trigger: price_increase/price_decrease percentage relative to toPrice
        if (a.condition === 'price_increase' && typeof a.condition_value === 'number') {
          // If from gains vs to by X%, trigger
          const ratio = fromPrice / toPrice
          if (ratio >= 1 + a.condition_value / 100) {
            await executionEngine.triggerManualExecution(a.id, true)
          }
        } else if (a.condition === 'price_decrease' && typeof a.condition_value === 'number') {
          const ratio = fromPrice / toPrice
          if (ratio <= 1 - a.condition_value / 100) {
            await executionEngine.triggerManualExecution(a.id, true)
          }
        } else if (a.condition === 'price_target' && typeof a.condition_value === 'number') {
          // Treat condition_value as target USD price for from asset
          if (fromPrice >= a.condition_value) {
            await executionEngine.triggerManualExecution(a.id, true)
          }
        }
      }
      // Rules: minimal placeholder for now. Balance thresholds can be added later.
    }
  }
}

export const backgroundProcessor = new BackgroundProcessor()
