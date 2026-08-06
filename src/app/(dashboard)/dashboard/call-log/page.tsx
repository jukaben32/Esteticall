import { PhoneCall } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listConversationsForBusiness } from '@/services/conversations'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { formatRelativeTime } from '@/lib/formatDate'
import { CallLogTable, type CallLogEntry } from '@/components/CallLogTable'

export default async function CallLogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [conversations, appointments] = await Promise.all([
    listConversationsForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id),
  ])

  // A "viewing" was booked for a call when some appointment references that
  // conversation — more reliable than the AI's self-reported outcome label.
  const conversationIdsWithAppointment = new Set(
    appointments.map((a) => a.conversation_id).filter((id): id is string => Boolean(id))
  )

  // Clients can also book straight through the widget's "Book" tab / public
  // form without ever talking to the AI agent — those appointments have no
  // conversation_id at all. The reference product folds both into one list
  // so the owner sees every contact event, marking the form ones as having
  // no transcript instead of hiding them.
  const formBookings = appointments.filter((a) => !a.conversation_id)

  const entries: CallLogEntry[] = [
    ...conversations.map(
      (conv): CallLogEntry => ({
        kind: 'call',
        id: conv.id,
        timestamp: conv.started_at,
        relativeTime: formatRelativeTime(conv.started_at),
        viewingBooked: conversationIdsWithAppointment.has(conv.id),
        conv,
      })
    ),
    ...formBookings.map(
      (appt): CallLogEntry => ({
        kind: 'form',
        id: appt.id,
        timestamp: appt.created_at,
        relativeTime: formatRelativeTime(appt.created_at),
        viewingBooked: true,
        appointment: appt,
      })
    ),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <PhoneCall className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Llamadas</h1>
          <p className="text-sm text-[var(--text-3)]">
            {entries.length} {entries.length === 1 ? 'contacto registrado' : 'contactos registrados'} · clic en
            cualquier fila para ver el detalle
          </p>
        </div>
      </div>
      <CallLogTable initialEntries={entries} />
    </div>
  )
}
