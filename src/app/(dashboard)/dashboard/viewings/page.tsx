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
      <ViewingsManager
        initialAppointments={appointments}
        services={services.filter((s) => s.is_active)}
        listings={listings}
      />
    </div>
  )
}
