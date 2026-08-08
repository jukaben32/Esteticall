import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getWhatsappConnection, refreshWhatsappStatus, updateWhatsappConnection } from '@/services/whatsapp'

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

  let connection = await getWhatsappConnection(ctx.supabase, ctx.business.id)
  if (connection && connection.status !== 'connected') {
    try {
      connection = await refreshWhatsappStatus(ctx.supabase, connection)
    } catch {
      // Evolution API unreachable (e.g. no VPS set up yet) — fall back to the
      // last known state instead of failing the whole request.
    }
  }
  return NextResponse.json({ connection })
}

export async function PATCH(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const connection = await updateWhatsappConnection(ctx.supabase, ctx.business.id, {
    agentId: body.agentId,
    isEnabled: body.isEnabled,
  })
  return NextResponse.json({ connection })
}
