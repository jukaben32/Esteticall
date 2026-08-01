import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listAvailabilityForBusiness } from '@/services/schedule'
import { ScheduleEditor } from '@/components/ScheduleEditor'

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const availability = await listAvailabilityForBusiness(supabase, business.id)

  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Horario</h1>
        <p className="text-sm text-[var(--text-3)]">
          Horario semanal que tu agente IA ofrece al agendar una cita. Desactiva un día para dejar de ofrecer turnos ese día.
        </p>
      </div>
      <ScheduleEditor initialAvailability={availability} />
    </div>
  )
}
