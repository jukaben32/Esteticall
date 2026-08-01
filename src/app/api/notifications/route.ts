import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listNotificationsForBusiness, markAllNotificationsRead } from '@/services/notifications'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { supabase, business }
}

export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const notifications = await listNotificationsForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ notifications })
}

// Marks every unread notification read — the "mark all as read" action.
export async function PATCH() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await markAllNotificationsRead(ctx.supabase, ctx.business.id)
  return NextResponse.json({ ok: true })
}
