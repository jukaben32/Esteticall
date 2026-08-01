import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { listAgentsForBusiness } from '@/services/aiAgents'
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

  const [agents, subscription] = await Promise.all([
    listAgentsForBusiness(supabase, business.id),
    getSubscription(supabase, business.id),
  ])

  const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Agentes IA</h1>
        <p className="text-sm text-[var(--text-3)]">
          {agents.length} / {PLAN_LIMITS[plan].agentLimit || '∞'} agentes en el plan {PLAN_LIMITS[plan].name}
        </p>
      </div>
      <AiAgentsManager initialAgents={agents} agentLimit={PLAN_LIMITS[plan].agentLimit} />
    </div>
  )
}
