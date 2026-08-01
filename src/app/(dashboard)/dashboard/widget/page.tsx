import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getWidgetForBusiness } from '@/services/widgets'
import { WidgetConfigForm } from '@/components/WidgetConfigForm'

export default async function WidgetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const widget = await getWidgetForBusiness(supabase, business.id)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Widget</h1>
        <p className="text-sm text-[var(--text-3)]">Configura y embebe tu asistente de voz IA.</p>
      </div>
      <WidgetConfigForm businessId={business.id} initialWidget={widget} appUrl={appUrl} />
    </div>
  )
}
