import { CalendarCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { listServicesForBusiness } from '@/services/businessServices'
import { listListingsForBusiness } from '@/services/listings'
import { ViewingsManager } from '@/components/ViewingsManager'

export default async function ViewingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [appointments, services, listings] = await Promise.all([
    listAppointmentsForBusiness(supabase, business.id),
    listServicesForBusiness(supabase, business.id),
    listListingsForBusiness(supabase, business.id),
  ])

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <CalendarCheck className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Citas</h1>
          <p className="text-sm text-[var(--text-3)]">
            {appointments.length} en total ·{' '}
            {appointments.filter((a) => a.status === 'scheduled').length} confirmadas ·{' '}
            {appointments.filter((a) => a.status === 'pending_confirmation').length} pendientes
          </p>
        </div>
      </div>
      <ViewingsManager
        initialAppointments={appointments}
        services={services.filter((s) => s.is_active)}
        listings={listings}
      />
    </div>
  )
}
