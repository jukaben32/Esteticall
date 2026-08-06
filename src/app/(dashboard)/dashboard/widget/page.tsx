import { MessagesSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listWidgetsForBusiness } from '@/services/widgets'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { WidgetsManager } from '@/components/WidgetsManager'

export default async function WidgetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [widgets, agents] = await Promise.all([
    listWidgetsForBusiness(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
  ])
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <MessagesSquare className="w-4 h-4" />
        </span>
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Widget</h1>
          <p className="text-sm text-[var(--text-3)]">Embebe tu asistente de voz IA en tu sitio web.</p>
        </div>
      </div>
      <WidgetsManager
        businessId={business.id}
        initialWidgets={widgets}
        agents={agents}
        appUrl={appUrl}
      />
    </div>
  )
}
