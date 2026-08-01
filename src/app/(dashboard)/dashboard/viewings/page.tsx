import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { ViewingsManager } from '@/components/ViewingsManager'

export default async function ViewingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const appointments = await listAppointmentsForBusiness(supabase, business.id)

  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Citas</h1>
        <p className="text-sm text-[var(--text-3)]">
          {appointments.length} en total ·{' '}
          {appointments.filter((a) => a.status === 'scheduled').length} próximas
        </p>
      </div>
      <ViewingsManager initialAppointments={appointments} />
    </div>
  )
}
