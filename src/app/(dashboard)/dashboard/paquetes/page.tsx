import { Package as PackageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listPackagesForBusiness, listClientPackageCreditsForBusiness } from '@/services/packages'
import { listServicesForBusiness } from '@/services/businessServices'
import { listClientsForBusiness } from '@/services/clients'
import { PackagesManager } from '@/components/PackagesManager'

export default async function PaquetesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [packages, services, clients, credits] = await Promise.all([
    listPackagesForBusiness(supabase, business.id),
    listServicesForBusiness(supabase, business.id),
    listClientsForBusiness(supabase, business.id),
    listClientPackageCreditsForBusiness(supabase, business.id),
  ])

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <PackageIcon className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Paquetes</h1>
          <p className="text-sm text-[var(--text-3)]">
            Sesiones prepagadas y membresías que tus pacientes pueden comprar y canjear en sus citas.
          </p>
        </div>
      </div>
      <PackagesManager
        initialPackages={packages}
        services={services.filter((s) => s.is_active)}
        clients={clients}
        initialCredits={credits}
      />
    </div>
  )
}
