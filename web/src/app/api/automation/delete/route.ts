import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase-client'
import { AutomationService } from '@/lib/automation/automation-service'

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const automation = await AutomationService.getById(id)
    if (!automation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (automation.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const ok = await AutomationService.delete(id)
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
