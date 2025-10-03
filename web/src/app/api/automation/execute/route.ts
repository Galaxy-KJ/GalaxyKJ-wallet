import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'
import { AutomationService } from '@/lib/automation/automation-service'

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-automations`
  : ''

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, immediate } = body as { id: string; immediate?: boolean }
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const automation = await AutomationService.getById(id)
    if (!automation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (automation.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Enqueue by creating a pending execution record
    await AutomationService.recordExecution({
      automation_id: id,
      status: 'pending',
      metadata: { trigger: 'manual' },
    })

    let triggered = false
    let triggerError: string | undefined

    // In development, optionally trigger the Edge function immediately for faster feedback
    if (immediate && process.env.NODE_ENV !== 'production' && EDGE_FUNCTION_URL) {
      try {
        const resp = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ automationId: id }),
        })
        triggered = resp.ok
        if (!resp.ok) {
          const txt = await resp.text()
          triggerError = `Edge trigger failed: ${resp.status} ${txt}`
        }
      } catch (e) {
        triggered = false
        triggerError = e instanceof Error ? e.message : 'Unknown error'
      }
    }

    return NextResponse.json({ enqueued: true, triggered, triggerError: triggerError ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
