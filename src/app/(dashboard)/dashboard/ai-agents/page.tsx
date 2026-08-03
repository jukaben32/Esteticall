import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { listServiceIdsByAgent } from '@/services/agentServices'
import { listServicesForBusiness } from '@/services/businessServices'
import { AiAgentsManager } from '@/components/AiAgentsManager'
import { PLAN_LIMITS } from '@/constants'
import type { PlanId } from '@/types'

export default async function AiAgentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [agents, subscription, services, serviceIdsByAgent] = await Promise.all([
    listAgentsForBusiness(supabase, business.id),
    getSubscription(supabase, business.id),
    listServicesForBusiness(supabase, business.id),
    listServiceIdsByAgent(supabase, business.id),
  ])

  const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Agentes IA</h1>
        <p className="text-sm text-[var(--text-3)]">Configura las personalidades de tus agentes de voz</p>
      </div>
      <AiAgentsManager
        initialAgents={agents}
        agentLimit={PLAN_LIMITS[plan].agentLimit}
        services={services}
        initialServiceIdsByAgent={serviceIdsByAgent}
      />
    </div>
  )
}
