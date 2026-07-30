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
    <div className="card-surface p-4">
      <div className="mb-4">
        <h1 className="font-semibold text-lg">AI Agents</h1>
        <p className="text-sm text-[var(--text-3)]">
          {agents.length} / {PLAN_LIMITS[plan].agentLimit || '∞'} agents on the {PLAN_LIMITS[plan].name} plan
        </p>
      </div>
      <AiAgentsManager initialAgents={agents} agentLimit={PLAN_LIMITS[plan].agentLimit} />
    </div>
  )
}
