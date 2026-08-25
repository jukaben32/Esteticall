import { FileSignature } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listConsentFormsForBusiness } from '@/services/consentForms'
import { listServicesForBusiness } from '@/services/businessServices'
import { listClientsForBusiness } from '@/services/clients'
import { ConsentFormsManager } from '@/components/ConsentFormsManager'

export default async function ConsentimientosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [consentForms, services, clients] = await Promise.all([
    listConsentFormsForBusiness(supabase, business.id),
    listServicesForBusiness(supabase, business.id),
    listClientsForBusiness(supabase, business.id),
  ])

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <FileSignature className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Consentimientos</h1>
          <p className="text-sm text-[var(--text-3)]">
            Consentimientos informados requeridos antes de tratamientos sensibles — el contenido se guarda cifrado.
          </p>
        </div>
      </div>
      <ConsentFormsManager
        initialConsentForms={consentForms}
        clients={clients}
        services={services.filter((s) => s.is_active)}
      />
    </div>
  )
}
