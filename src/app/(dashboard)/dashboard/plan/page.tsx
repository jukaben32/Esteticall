import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { PlanBilling } from '@/components/PlanBilling'

export default async function PlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const subscription = await getSubscription(supabase, business.id)

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Plan y Facturación</h1>
        <p className="text-sm text-[var(--text-3)]">Administra tu suscripción y método de pago.</p>
      </div>
      <PlanBilling subscription={subscription} />
    </div>
  )
}
