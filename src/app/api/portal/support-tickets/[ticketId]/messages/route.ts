import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnedTicketForClientUser, listMessagesForOwnedTicket, addClientMessageToTicket } from '@/services/clientPortal'
import { supportMessageSchema } from '@/validations'

export async function GET(request: Request, { params }: { params: { ticketId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const ticket = await getOwnedTicketForClientUser(admin, user.id, params.ticketId)
  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

  const messages = await listMessagesForOwnedTicket(admin, params.ticketId)
  return NextResponse.json({ messages })
}

export async function POST(request: Request, { params }: { params: { ticketId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const parsed = supportMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const ticket = await getOwnedTicketForClientUser(admin, user.id, params.ticketId)
  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

  const message = await addClientMessageToTicket(admin, ticket.business_id, params.ticketId, parsed.data.body)
  return NextResponse.json({ message })
}
