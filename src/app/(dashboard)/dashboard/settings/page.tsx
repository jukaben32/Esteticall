import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listAvailabilityForBusiness } from '@/services/schedule'
import { SettingsTabs } from '@/components/SettingsTabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const availability = await listAvailabilityForBusiness(supabase, business.id)

  return (
    <div className="card-surface p-4">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Configuración</h1>
        <p className="text-sm text-[var(--text-3)]">Perfil de la agencia y configuración operativa.</p>
      </div>
      <SettingsTabs business={business} availability={availability} />
    </div>
  )
}
