import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'
import { AutomationService } from '@/lib/automation/automation-service'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const publicKey = searchParams.get('publicKey')
    const includeHistory = searchParams.get('history') === '1'

    const automations = publicKey
      ? await AutomationService.listByUserAndWallet(user.id, publicKey)
      : await AutomationService.listByUser(user.id)

    let executions = [] as Awaited<ReturnType<typeof AutomationService.listExecutionsByUser>>
    if (includeHistory) {
      executions = await AutomationService.listExecutionsByUser(user.id)
    }

    return NextResponse.json({ automations, executions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
