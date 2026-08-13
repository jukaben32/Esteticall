import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getTicketForBusiness, listMessagesForTicket, updateTicketStatus } from '@/services/support'
import { supportTicketStatusSchema } from '@/validations'

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

export async function GET(_request: Request, props: { params: Promise<{ ticketId: string }> }) {
  const params = await props.params;
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const ticket = await getTicketForBusiness(ctx.supabase, ctx.business.id, params.ticketId)
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const messages = await listMessagesForTicket(ctx.supabase, ctx.business.id, params.ticketId)
  return NextResponse.json({ ticket, messages })
}

export async function PATCH(request: Request, props: { params: Promise<{ ticketId: string }> }) {
  const params = await props.params;
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = supportTicketStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const ticket = await updateTicketStatus(ctx.supabase, ctx.business.id, params.ticketId, parsed.data.status)
  return NextResponse.json({ ticket })
}
