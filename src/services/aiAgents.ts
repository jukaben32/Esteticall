import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AiAgent } from '@/types'
import type { AiAgentInput } from '@/validations'
import { PLAN_LIMITS, isWithinLimit } from '@/constants'
import type { PlanId } from '@/types'
import { setAgentServices, listServiceIdsForAgent } from './agentServices'

type DB = SupabaseClient<Database>

export async function listAgentsForBusiness(supabase: DB, businessId: string): Promise<AiAgent[]> {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAgentById(
  supabase: DB,
  businessId: string,
  agentId: string
): Promise<AiAgent | null> {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', agentId)
    .maybeSingle()
  if (error) throw error
  return data
}

export class AgentLimitError extends Error {
  constructor(limit: number) {
    super(`Your plan allows a maximum of ${limit} AI agent(s). Upgrade to add more.`)
    this.name = 'AgentLimitError'
  }
}

export async function createAgent(
  supabase: DB,
  businessId: string,
  plan: PlanId,
  input: AiAgentInput
): Promise<AiAgent> {
  const { agentLimit } = PLAN_LIMITS[plan]
  const { count, error: countError } = await supabase
    .from('ai_agents')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
  if (countError) throw countError

  if (!isWithinLimit(count ?? 0, agentLimit)) {
    throw new AgentLimitError(agentLimit)
  }

  const { data, error } = await supabase
    .from('ai_agents')
    .insert({
      business_id: businessId,
      name: input.name,
      specialty: input.specialty,
      voice: input.voice,
      personality: input.personality,
      sensitivity: input.sensitivity,
      language: input.language,
      greeting_message: input.greetingMessage,
      system_prompt: input.systemPrompt ?? '',
      status: input.status,
    })
    .select('*')
    .single()
  if (error) throw error

  if (input.serviceIds) {
    await setAgentServices(supabase, businessId, data.id, input.serviceIds)
  }

  return data
}

export async function updateAgent(
  supabase: DB,
  businessId: string,
  agentId: string,
  patch: Partial<AiAgent>
): Promise<AiAgent> {
  const { data, error } = await supabase
    .from('ai_agents')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', agentId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteAgent(supabase: DB, businessId: string, agentId: string) {
  const { error } = await supabase
    .from('ai_agents')
    .delete()
    .eq('business_id', businessId)
    .eq('id', agentId)
  if (error) throw error
}

// "Duplicate" icon action in the agents list — copies settings + assigned
// services into a new draft agent, respecting the plan's agent limit.
export async function duplicateAgent(
  supabase: DB,
  businessId: string,
  plan: PlanId,
  agentId: string
): Promise<AiAgent> {
  const source = await getAgentById(supabase, businessId, agentId)
  if (!source) throw new Error('Agent not found')

  const serviceIds = await listServiceIdsForAgent(supabase, agentId)

  return createAgent(supabase, businessId, plan, {
    name: `${source.name} (copia)`,
    specialty: source.specialty,
    voice: source.voice,
    personality: source.personality,
    sensitivity: source.sensitivity,
    language: source.language,
    greetingMessage: source.greeting_message,
    systemPrompt: source.system_prompt,
    status: 'draft',
    serviceIds,
  })
}

export async function incrementCallsHandled(supabase: DB, agentId: string) {
  const { error } = await supabase.rpc('increment_agent_calls_handled' as never, {
    agent_id: agentId,
  } as never)
  // Fallback for environments where the RPC hasn't been created — best-effort,
  // never block the call flow on this counter.
  if (error) {
    const { data } = await supabase.from('ai_agents').select('calls_handled').eq('id', agentId).single()
    if (data) {
      await supabase
        .from('ai_agents')
        .update({ calls_handled: (data.calls_handled ?? 0) + 1 })
        .eq('id', agentId)
    }
  }
}
