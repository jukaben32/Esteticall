import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listAvailabilityForBusiness } from '@/services/schedule'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { ScheduleEditor } from '@/components/ScheduleEditor'
import { ScheduleCalendar } from '@/components/ScheduleCalendar'

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [availability, appointments] = await Promise.all([
    listAvailabilityForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id),
  ])

  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Horario</h1>
        <p className="text-sm text-[var(--text-3)]">Calendario de todas tus citas y visitas agendadas.</p>
      </div>

      <ScheduleCalendar initialAppointments={appointments} todayIso={new Date().toISOString()} />

      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-[var(--text-2)]">
          Configurar disponibilidad semanal del agente IA
        </summary>
        <p className="text-xs text-[var(--text-3)] mt-1 mb-3">
          Horario semanal que tu agente IA ofrece al agendar una cita. Desactiva un día para dejar de ofrecer turnos ese día.
        </p>
        <ScheduleEditor initialAvailability={availability} />
      </details>
    </div>
  )
}
