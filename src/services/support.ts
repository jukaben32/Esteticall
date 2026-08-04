import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { SupportTicket, SupportMessage, SupportTicketWithClient, Client } from '@/types'

type DB = SupabaseClient<Database>

type TicketJoinRow = SupportTicket & {
  clients: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
}

// Client requests come in as support_tickets rows; we join the client and the
// latest message so the list panel can show "who" + a preview without a
// second round trip per row.
export async function listTicketsForBusiness(
  supabase: DB,
  businessId: string
): Promise<SupportTicketWithClient[]> {
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*, clients(id, name, phone, email)')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  const ticketRows = (tickets ?? []) as unknown as TicketJoinRow[]
  if (ticketRows.length === 0) return []

  const { data: messages, error: msgError } = await supabase
    .from('support_messages')
    .select('ticket_id, body, created_at')
    .eq('business_id', businessId)
    .in(
      'ticket_id',
      ticketRows.map((t) => t.id)
    )
    .order('created_at', { ascending: false })
  if (msgError) throw msgError

  const lastByTicket = new Map<string, string>()
  for (const m of messages ?? []) {
    if (!lastByTicket.has(m.ticket_id)) lastByTicket.set(m.ticket_id, m.body)
  }

  return ticketRows.map((t) => ({
    ...t,
    client: t.clients ?? null,
    last_message: lastByTicket.get(t.id) ?? null,
  }))
}

export async function getTicketForBusiness(
  supabase: DB,
  businessId: string,
  ticketId: string
): Promise<SupportTicket | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', ticketId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listMessagesForTicket(
  supabase: DB,
  businessId: string,
  ticketId: string
): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('business_id', businessId)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

// The business owner replying to a client — bumps the ticket's updated_at
// (via the existing trigger) and moves it out of "open" into "in_progress"
// the first time someone answers, same as a typical helpdesk.
export async function replyToTicket(
  supabase: DB,
  businessId: string,
  ticketId: string,
  body: string
): Promise<SupportMessage> {
  const { data, error } = await supabase
    .from('support_messages')
    .insert({ ticket_id: ticketId, business_id: businessId, sender: 'business', body })
    .select('*')
    .single()
  if (error) throw error

  const ticket = await getTicketForBusiness(supabase, businessId, ticketId)
  if (ticket?.status === 'open') {
    await updateTicketStatus(supabase, businessId, ticketId, 'in_progress')
  } else {
    // Touch updated_at so the list re-sorts even when the status doesn't change.
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId)
  }

  return data
}

export async function updateTicketStatus(
  supabase: DB,
  businessId: string,
  ticketId: string,
  status: SupportTicket['status']
): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('business_id', businessId)
    .eq('id', ticketId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
