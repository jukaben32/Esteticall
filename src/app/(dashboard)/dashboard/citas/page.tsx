import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { listServicesForBusiness } from '@/services/businessServices'
import { AppointmentsManager } from '@/components/AppointmentsManager'

export default async function CitasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [appointments, services] = await Promise.all([
    listAppointmentsForBusiness(supabase, business.id),
    listServicesForBusiness(supabase, business.id),
  ])

  return (
    <div className="card-surface p-5">
      <AppointmentsManager initialAppointments={appointments} services={services.filter((s) => s.is_active)} />
    </div>
  )
}
