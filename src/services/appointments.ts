import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Appointment, AppointmentWithDetails, Client, BusinessService, Listing } from '@/types'
import { PLAN_LIMITS, isWithinLimit } from '@/constants'
import type { PlanId, AvailableSlot } from '@/types'
import { formatDateTime } from '@/lib/formatDate'

type DB = SupabaseClient<Database>

// The Dominican Republic stays on Atlantic Standard Time (UTC-4) year-round —
// it stopped observing DST in 1974 — so a fixed offset is safe here, unlike
// most timezones. business_availability.start_time/end_time are wall-clock
// hours in that timezone; the server's own clock (UTC on Vercel) has nothing
// to do with them.
const SANTO_DOMINGO_UTC_OFFSET_MS = 4 * 60 * 60 * 1000

// Reads a UTC instant's date/day-of-week as they'd show on a Santo Domingo
// wall clock, without depending on the server process's own timezone.
function toSantoDomingoParts(utcInstant: Date): { dayOfWeek: number; dateKey: string } {
  const shifted = new Date(utcInstant.getTime() - SANTO_DOMINGO_UTC_OFFSET_MS)
  return { dayOfWeek: shifted.getUTCDay(), dateKey: shifted.toISOString().slice(0, 10) }
}

// Turns a Santo Domingo wall-clock date + time into the exact UTC instant it
// represents — the explicit -04:00 offset makes this unambiguous regardless
// of what timezone the server itself is running in.
function santoDomingoInstant(dateKey: string, hours: number, minutes: number): Date {
  return new Date(`${dateKey}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000-04:00`)
}

type AppointmentJoinRow = Appointment & {
  clients: Pick<Client, 'id' | 'name' | 'phone' | 'email' | 'budget' | 'pre_approval_number'> | null
  business_services: Pick<BusinessService, 'id' | 'name' | 'price' | 'duration_minutes'> | null
  listings: Pick<Listing, 'id' | 'title' | 'listing_code'> | null
}

function mapAppointmentRow(row: AppointmentJoinRow): AppointmentWithDetails {
  return {
    ...row,
    client: row.clients ?? null,
    service: row.business_services ?? null,
    listing: row.listings ?? null,
  }
}

export async function listAppointmentsForBusiness(
  supabase: DB,
  businessId: string,
  filters?: { status?: Appointment['status'] | 'all' }
): Promise<AppointmentWithDetails[]> {
  let query = supabase
    .from('appointments')
    .select('*, clients(id, name, phone, email, budget, pre_approval_number), business_services(id, name, price, duration_minutes), listings(id, title, listing_code)')
    .eq('business_id', businessId)
    .order('scheduled_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as unknown as AppointmentJoinRow[]).map(mapAppointmentRow)
}

export async function getAppointmentWithDetails(
  supabase: DB,
  businessId: string,
  appointmentId: string
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clients(id, name, phone, email, budget, pre_approval_number), business_services(id, name, price, duration_minutes), listings(id, title, listing_code)')
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapAppointmentRow(data as unknown as AppointmentJoinRow)
}

// Public lookup by id only (no businessId, no auth) — the appointment UUID
// itself is the bearer token, same pattern as the "View in Client Portal"
// email link in the reference video. Only used from /portal/[appointmentId]
// via the admin client.
export async function getAppointmentPublic(
  supabase: DB,
  appointmentId: string
): Promise<(AppointmentWithDetails & { business: { name: string; phone: string | null; contact_email: string | null; address: string | null } | null }) | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      '*, clients(id, name, phone, email, budget, pre_approval_number), business_services(id, name, price, duration_minutes), listings(id, title, listing_code), businesses(name, phone, contact_email, address)'
    )
    .eq('id', appointmentId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const { businesses, ...row } = data as unknown as AppointmentJoinRow & {
    businesses: { name: string; phone: string | null; contact_email: string | null; address: string | null } | null
  }
  return { ...mapAppointmentRow(row as AppointmentJoinRow), business: businesses }
}

export class BookingLimitError extends Error {
  constructor(limit: number) {
    super(`Your plan allows a maximum of ${limit} bookings this month. Upgrade to book more.`)
    this.name = 'BookingLimitError'
  }
}

export async function createAppointment(
  supabase: DB,
  businessId: string,
  plan: PlanId,
  input: {
    listingId?: string
    serviceId?: string
    clientId?: string
    conversationId?: string
    scheduledAt: string
    status?: Appointment['status']
    notes?: string
  }
): Promise<Appointment> {
  const { bookingLimit } = PLAN_LIMITS[plan]
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error: countError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth.toISOString())
  if (countError) throw countError

  if (!isWithinLimit(count ?? 0, bookingLimit)) {
    throw new BookingLimitError(bookingLimit)
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      business_id: businessId,
      listing_id: input.listingId,
      service_id: input.serviceId,
      client_id: input.clientId,
      conversation_id: input.conversationId,
      scheduled_at: input.scheduledAt,
      status: input.status,
      notes: input.notes,
    })
    .select('*')
    .single()
  if (error) throw error

  await supabase.from('notifications').insert({
    business_id: businessId,
    type: 'appointment_booked',
    title: 'New viewing booked',
    body: `Se agendó una visita para el ${formatDateTime(input.scheduledAt)}`,
  })

  return data
}

export async function updateAppointmentStatus(
  supabase: DB,
  businessId: string,
  appointmentId: string,
  status: Appointment['status'],
  opts?: { cancellationReason?: string; cancelledBy?: Appointment['cancelled_by'] }
): Promise<Appointment> {
  const patch: Record<string, unknown> = { status }
  if (status === 'scheduled') patch.confirmed_by_agent_at = new Date().toISOString()
  if (status === 'cancelled') {
    patch.cancelled_at = new Date().toISOString()
    patch.cancellation_reason = opts?.cancellationReason ?? null
    patch.cancelled_by = opts?.cancelledBy ?? 'business'
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateAppointmentPayment(
  supabase: DB,
  businessId: string,
  appointmentId: string,
  paymentStatus: Appointment['payment_status']
): Promise<Appointment> {
  const patch: Record<string, unknown> = { payment_status: paymentStatus }
  if (paymentStatus === 'cash' || paymentStatus === 'paid') patch.paid_at = new Date().toISOString()
  if (paymentStatus === 'refunded' || paymentStatus === 'pending') patch.paid_at = null

  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateAppointment(
  supabase: DB,
  businessId: string,
  appointmentId: string,
  patch: Partial<Appointment>
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', appointmentId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Walks the business's weekly availability, minus already-booked slots, to
// produce the next N bookable windows — this is what the AI agent's
// `book_viewing` tool calls before offering a time to the caller.
export async function getAvailableSlots(
  supabase: DB,
  businessId: string,
  opts: { fromDate?: Date; daysAhead?: number } = {}
): Promise<AvailableSlot[]> {
  // An invalid Date's .toISOString() throws inside the loop below (in
  // toSantoDomingoParts) — fall back to "now" instead of crashing the whole
  // request over a caller-supplied fromDate that didn't parse.
  const fromDate = opts.fromDate && !isNaN(opts.fromDate.getTime()) ? opts.fromDate : new Date()
  const daysAhead = opts.daysAhead ?? 7

  const { data: availability, error: availError } = await supabase
    .from('business_availability')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
  if (availError) throw availError
  if (!availability || availability.length === 0) return []

  const rangeEnd = new Date(fromDate.getTime() + daysAhead * 86_400_000)
  const { data: booked, error: bookedError } = await supabase
    .from('appointments')
    .select('scheduled_at')
    .eq('business_id', businessId)
    .neq('status', 'cancelled')
    .gte('scheduled_at', fromDate.toISOString())
    .lte('scheduled_at', rangeEnd.toISOString())
  if (bookedError) throw bookedError

  const bookedTimes = new Set((booked ?? []).map((b) => new Date(b.scheduled_at).getTime()))
  const slots: AvailableSlot[] = []

  for (let day = 0; day < daysAhead; day++) {
    const { dayOfWeek, dateKey } = toSantoDomingoParts(new Date(fromDate.getTime() + day * 86_400_000))
    const dayAvailability = availability.filter((a) => a.day_of_week === dayOfWeek)

    for (const window of dayAvailability) {
      // A zero/negative slot_minutes would never advance `minutes` past
      // `endMinutes` below — infinite loop, which on a serverless function
      // means it hangs until Vercel kills it on timeout. Nothing in the DB
      // schema currently rules this value out, so guard it here too.
      if (!(window.slot_minutes > 0)) continue

      const [startH, startM] = window.start_time.split(':').map(Number)
      const [endH, endM] = window.end_time.split(':').map(Number)
      let minutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      while (minutes < endMinutes) {
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        const instant = santoDomingoInstant(dateKey, h, m)
        if (instant > fromDate && !bookedTimes.has(instant.getTime())) {
          slots.push({
            date: dateKey,
            time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            datetime: instant.toISOString(),
          })
        }
        minutes += window.slot_minutes
      }
    }
  }

  return slots
}
