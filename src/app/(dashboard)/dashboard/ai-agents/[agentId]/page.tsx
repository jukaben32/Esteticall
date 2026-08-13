import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getAgentById } from '@/services/aiAgents'
import { listServiceIdsForAgent } from '@/services/agentServices'
import { listServicesForBusiness } from '@/services/businessServices'
import { AgentStudio } from '@/components/AgentStudio'

export default async function AgentStudioPage(props: { params: Promise<{ agentId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const agent = await getAgentById(supabase, business.id, params.agentId)
  if (!agent) notFound()

  const [services, serviceIds] = await Promise.all([
    listServicesForBusiness(supabase, business.id),
    listServiceIdsForAgent(supabase, agent.id),
  ])

  return <AgentStudio initialAgent={agent} services={services} initialServiceIds={serviceIds} />
}
