import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { incrementWidgetInteractions } from '@/services/widgets'

export const dynamic = 'force-dynamic'

// Fired once by the embed widget the moment a visitor starts a call — public,
// no auth, mirrors /config's impression tracking but for engaged sessions.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const widgetId = body?.widgetId as string | undefined
  if (!widgetId) {
    return NextResponse.json({ error: 'Missing widgetId' }, { status: 400 })
  }
  const supabase = createAdminClient()
  await incrementWidgetInteractions(supabase, widgetId)
  return NextResponse.json({ ok: true })
}
