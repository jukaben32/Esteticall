import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listServicesForBusiness } from '@/services/businessServices'
import { ServicesManager } from '@/components/ServicesManager'

export default async function ServicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const services = await listServicesForBusiness(supabase, business.id)

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <Briefcase className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Servicios</h1>
          <p className="text-sm text-[var(--text-3)]">
            Lo que tus agentes IA pueden ofrecer a quien llama, sin depender de una sola propiedad.
          </p>
        </div>
      </div>
      <ServicesManager initialServices={services} />
    </div>
  )
}
