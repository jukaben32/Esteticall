import { Settings } from 'lucide-react'
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
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <Settings className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Configuración</h1>
          <p className="text-sm text-[var(--text-3)]">Perfil de la agencia y configuración operativa.</p>
        </div>
      </div>
      <SettingsTabs business={business} availability={availability} />
    </div>
  )
}
