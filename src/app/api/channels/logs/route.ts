import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listSyncLogs } from '@/services/channels'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const logs = await listSyncLogs(supabase, business.id, 30)
  return NextResponse.json({ logs })
}
