import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { sendAppointmentReminderEmail } from '@/services/email'
import { sendWhatsappMessage } from '@/services/whatsapp'
import { formatDateTime } from '@/lib/formatDate'

type DB = SupabaseClient<Database>

// How far ahead of an appointment the reminder goes out. Runs on a cron that
// fires every 30 min (see vercel.json) — an appointment crosses into this
// window at some point and gets caught within that cadence, so there's no
// need for a matching upper/lower band, just "within N hours, not yet
// reminded" + the reminder_sent_at guard so it never fires twice.
const REMINDER_HOURS_BEFORE = Number(process.env.APPOINTMENT_REMINDER_HOURS_BEFORE ?? 24)

type ReminderCandidateRow = {
  id: string
  business_id: string
  scheduled_at: string
  clients: { name: string; phone: string | null; email: string | null } | null
  businesses: { name: string } | null
  business_services: { name: string } | null
}

export interface ReminderRunResult {
  candidates: number
  whatsappSent: number
  emailSent: number
  errors: string[]
}

// Called by the cron route (service-role client — this spans every business
// on the platform, not just one tenant). Best-effort per appointment: one
// failed send/update never stops the rest of the batch.
export async function sendDueAppointmentReminders(admin: DB): Promise<ReminderRunResult> {
  const now = new Date()
  const windowEnd = new Date(now.getTime() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000)

  const { data, error } = await admin
    .from('appointments')
    .select('id, business_id, scheduled_at, clients(name, phone, email), businesses(name), business_services(name)')
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())
  if (error) throw error

  const candidates = (data ?? []) as unknown as ReminderCandidateRow[]
  const result: ReminderRunResult = { candidates: candidates.length, whatsappSent: 0, emailSent: 0, errors: [] }
  if (candidates.length === 0) return result

  const businessIds = Array.from(new Set(candidates.map((c) => c.business_id)))
  const { data: connections } = await admin
    .from('whatsapp_connections')
    .select('*')
    .in('business_id', businessIds)
    .eq('status', 'connected')
    .eq('is_enabled', true)
  const connectionByBusiness = new Map((connections ?? []).map((c) => [c.business_id, c]))

  for (const appt of candidates) {
    const client = appt.clients
    const businessName = appt.businesses?.name ?? 'tu clínica'
    const serviceName = appt.business_services?.name
    const when = formatDateTime(appt.scheduled_at)
    const message =
      `Recordatorio: tienes una cita${serviceName ? ` de ${serviceName}` : ''} con ${businessName} el ${when}. ` +
      'Si necesitas reprogramar o cancelar, avísanos con anticipación.'

    try {
      const connection = connectionByBusiness.get(appt.business_id)
      if (connection && client?.phone) {
        await sendWhatsappMessage(connection, client.phone, message)
        result.whatsappSent++
      } else if (client?.email) {
        await sendAppointmentReminderEmail({
          to: client.email,
          clientName: client.name,
          businessName,
          scheduledAt: appt.scheduled_at,
          serviceName,
        })
        result.emailSent++
      }
      await admin.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', appt.id)
    } catch (err) {
      result.errors.push(`${appt.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}
