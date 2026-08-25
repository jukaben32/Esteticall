import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  Appointment,
  PortalAppointment,
  SupportTicket,
  SupportMessage,
  PortalSupportTicket,
  ClientPackageCredit,
  Package,
  PortalPackageCredit,
  ConsentForm,
  BusinessService,
  PortalConsentForm,
} from '@/types'
import { decryptSecret } from '@/lib/encryption'

type DB = SupabaseClient<Database>

// All Client Portal reads/writes run through the admin (service-role)
// client, same convention as the public widget-booking routes — a client
// can own rows across more than one business, which the "clients can view
// their own X" RLS policies support for reads, but there's no client UPDATE
// policy on appointments (deliberately: only specific fields — reschedule,
// cancel — should ever be client-writable, and RLS can't express that
// column-level restriction). Ownership is checked in application code instead.

type AppointmentJoinRow = Appointment & {
  clients: { id: string; name: string; phone: string | null; email: string | null } | null
  business_services: { id: string; name: string; price: number | null; duration_minutes: number } | null
  businesses: { id: string; name: string; phone: string | null; contact_email: string | null; stripe_connected: boolean } | null
}

function mapPortalAppointment(row: AppointmentJoinRow): PortalAppointment {
  const { clients, business_services, businesses, ...rest } = row
  return {
    ...rest,
    client: clients,
    service: business_services,
    business: businesses,
  }
}

const PORTAL_APPOINTMENT_SELECT =
  '*, clients(id, name, phone, email), business_services(id, name, price, duration_minutes), businesses(id, name, phone, contact_email, stripe_connected)'

// A person can be a `clients` row in more than one business (booked with
// two different agencies) — each is a separate row with its own id, all
// potentially sharing one auth_user_id once they've signed up for the portal.
export async function listClientRowsForUser(
  admin: DB,
  userId: string
): Promise<{ id: string; business_id: string }[]> {
  const { data, error } = await admin.from('clients').select('id, business_id').eq('auth_user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function listBusinessesForClientUser(
  admin: DB,
  userId: string
): Promise<{ id: string; name: string }[]> {
  const { data, error } = await admin
    .from('clients')
    .select('business_id, businesses(id, name)')
    .eq('auth_user_id', userId)
  if (error) throw error
  const seen = new Map<string, { id: string; name: string }>()
  for (const row of (data ?? []) as unknown as { businesses: { id: string; name: string } | null }[]) {
    if (row.businesses) seen.set(row.businesses.id, row.businesses)
  }
  return Array.from(seen.values())
}

export async function listAppointmentsForClientUser(admin: DB, userId: string): Promise<PortalAppointment[]> {
  const clientRows = await listClientRowsForUser(admin, userId)
  if (clientRows.length === 0) return []
  const { data, error } = await admin
    .from('appointments')
    .select(PORTAL_APPOINTMENT_SELECT)
    .in(
      'client_id',
      clientRows.map((c) => c.id)
    )
    .order('scheduled_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as AppointmentJoinRow[]).map(mapPortalAppointment)
}

// Ownership-checked single fetch — every portal mutation (reschedule,
// cancel) calls this first and 404s rather than trusting the appointmentId
// in the URL belongs to whoever is signed in.
export async function getOwnedAppointmentForClientUser(
  admin: DB,
  userId: string,
  appointmentId: string
): Promise<PortalAppointment | null> {
  const clientRows = await listClientRowsForUser(admin, userId)
  if (clientRows.length === 0) return null
  const { data, error } = await admin
    .from('appointments')
    .select(PORTAL_APPOINTMENT_SELECT)
    .eq('id', appointmentId)
    .in(
      'client_id',
      clientRows.map((c) => c.id)
    )
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapPortalAppointment(data as unknown as AppointmentJoinRow)
}

// clients rows with this email that aren't linked to an account yet — used
// both to validate signup ("did you actually book with us?") and to link
// every matching row to the new account in one shot.
export async function findUnlinkedClientsByEmail(admin: DB, email: string): Promise<{ id: string }[]> {
  const { data, error } = await admin
    .from('clients')
    .select('id')
    .ilike('email', email)
    .is('auth_user_id', null)
  if (error) throw error
  return data ?? []
}

export async function linkClientRowsToUser(admin: DB, clientIds: string[], userId: string): Promise<void> {
  if (clientIds.length === 0) return
  const { error } = await admin.from('clients').update({ auth_user_id: userId }).in('id', clientIds)
  if (error) throw error
}

// ─── Support tickets ──────────────────────────────────────────────────────

export async function listTicketsForClientUser(admin: DB, userId: string): Promise<PortalSupportTicket[]> {
  const clientRows = await listClientRowsForUser(admin, userId)
  if (clientRows.length === 0) return []
  const { data: tickets, error } = await admin
    .from('support_tickets')
    .select('*, clients(id, name, phone, email), businesses(name)')
    .in(
      'client_id',
      clientRows.map((c) => c.id)
    )
    .order('updated_at', { ascending: false })
  if (error) throw error
  const rows = (tickets ?? []) as unknown as (SupportTicket & {
    clients: { id: string; name: string; phone: string | null; email: string | null } | null
    businesses: { name: string } | null
  })[]
  if (rows.length === 0) return []

  const { data: messages, error: msgError } = await admin
    .from('support_messages')
    .select('ticket_id, body, created_at')
    .in(
      'ticket_id',
      rows.map((t) => t.id)
    )
    .order('created_at', { ascending: false })
  if (msgError) throw msgError
  const lastByTicket = new Map<string, string>()
  for (const m of messages ?? []) {
    if (!lastByTicket.has(m.ticket_id)) lastByTicket.set(m.ticket_id, m.body)
  }

  return rows.map((t) => {
    const { clients, businesses, ...rest } = t
    return {
      ...rest,
      client: clients,
      business_name: businesses?.name ?? null,
      last_message: lastByTicket.get(t.id) ?? null,
    }
  })
}

export async function getOwnedTicketForClientUser(
  admin: DB,
  userId: string,
  ticketId: string
): Promise<SupportTicket | null> {
  const clientRows = await listClientRowsForUser(admin, userId)
  if (clientRows.length === 0) return null
  const { data, error } = await admin
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .in(
      'client_id',
      clientRows.map((c) => c.id)
    )
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listMessagesForOwnedTicket(admin: DB, ticketId: string): Promise<SupportMessage[]> {
  const { data, error } = await admin
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

// The client_id passed in must be one of the caller's own clients rows for
// the target business — checked by the API route before calling this, same
// as everywhere else in this file.
export async function createTicketForClient(
  admin: DB,
  businessId: string,
  clientId: string,
  subject: string,
  firstMessage: string
): Promise<SupportTicket> {
  const { data: ticket, error } = await admin
    .from('support_tickets')
    .insert({ business_id: businessId, client_id: clientId, subject })
    .select('*')
    .single()
  if (error) throw error

  const { error: msgError } = await admin
    .from('support_messages')
    .insert({ ticket_id: ticket.id, business_id: businessId, sender: 'client', body: firstMessage })
  if (msgError) throw msgError

  await admin.from('notifications').insert({
    business_id: businessId,
    type: 'system',
    title: 'Nuevo ticket de soporte',
    body: subject,
  })

  return ticket
}

export async function addClientMessageToTicket(
  admin: DB,
  businessId: string,
  ticketId: string,
  body: string
): Promise<SupportMessage> {
  const { data, error } = await admin
    .from('support_messages')
    .insert({ ticket_id: ticketId, business_id: businessId, sender: 'client', body })
    .select('*')
    .single()
  if (error) throw error
  await admin.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId)
  return data
}

// ─── Paquetes / créditos de sesiones ──────────────────────────────────────

type PackageCreditJoinRow = ClientPackageCredit & {
  clients: { id: string; name: string; phone: string | null; email: string | null } | null
  packages: Pick<Package, 'id' | 'name' | 'session_count' | 'price'> | null
  businesses: { id: string; name: string } | null
}

export async function listPackageCreditsForClientUser(admin: DB, userId: string): Promise<PortalPackageCredit[]> {
  const clientRows = await listClientRowsForUser(admin, userId)
  if (clientRows.length === 0) return []
  const { data, error } = await admin
    .from('client_package_credits')
    .select('*, clients(id, name, phone, email), packages(id, name, session_count, price), businesses(id, name)')
    .in(
      'client_id',
      clientRows.map((c) => c.id)
    )
    .order('purchased_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as PackageCreditJoinRow[]).map((row) => {
    const { clients, packages, businesses, ...rest } = row
    return { ...rest, client: clients, package: packages, business: businesses }
  })
}

// ─── Consentimientos informados ────────────────────────────────────────────

type ConsentFormJoinRow = ConsentForm & {
  business_services: Pick<BusinessService, 'id' | 'name'> | null
  businesses: { id: string; name: string } | null
}

function mapPortalConsentForm(row: ConsentFormJoinRow): PortalConsentForm {
  const { business_services, businesses, content_encrypted, ...rest } = row
  return {
    ...rest,
    content: decryptSecret(content_encrypted),
    service: business_services,
    business: businesses,
  }
}

const PORTAL_CONSENT_FORM_SELECT = '*, business_services(id, name), businesses(id, name)'

export async function listConsentFormsForClientUser(admin: DB, userId: string): Promise<PortalConsentForm[]> {
  const clientRows = await listClientRowsForUser(admin, userId)
  if (clientRows.length === 0) return []
  const { data, error } = await admin
    .from('consent_forms')
    .select(PORTAL_CONSENT_FORM_SELECT)
    .in(
      'client_id',
      clientRows.map((c) => c.id)
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as ConsentFormJoinRow[]).map(mapPortalConsentForm)
}

// Ownership-checked single fetch — the sign route calls this first and 404s
// rather than trusting the consentFormId in the URL belongs to whoever is
// signed in, same pattern as getOwnedAppointmentForClientUser.
export async function getOwnedConsentFormForClientUser(
  admin: DB,
  userId: string,
  consentFormId: string
): Promise<PortalConsentForm | null> {
  const clientRows = await listClientRowsForUser(admin, userId)
  if (clientRows.length === 0) return null
  const { data, error } = await admin
    .from('consent_forms')
    .select(PORTAL_CONSENT_FORM_SELECT)
    .eq('id', consentFormId)
    .in(
      'client_id',
      clientRows.map((c) => c.id)
    )
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapPortalConsentForm(data as unknown as ConsentFormJoinRow)
}

export async function signOwnedConsentForm(
  admin: DB,
  consentFormId: string,
  signatureName: string
): Promise<void> {
  const { error } = await admin
    .from('consent_forms')
    .update({ status: 'signed', signature_name: signatureName, signed_at: new Date().toISOString() })
    .eq('id', consentFormId)
    .eq('status', 'pending')
  if (error) throw error
}
