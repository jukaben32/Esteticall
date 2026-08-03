import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type DB = SupabaseClient<Database>

export async function listServiceIdsForAgent(supabase: DB, agentId: string): Promise<string[]> {
  const { data, error } = await supabase.from('agent_services').select('service_id').eq('agent_id', agentId)
  if (error) throw error
  return (data ?? []).map((row) => row.service_id)
}

// Business-wide map, one query — used by the agents list so each row can show
// "N services" without a query per agent.
export async function listServiceIdsByAgent(
  supabase: DB,
  businessId: string
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('agent_services')
    .select('agent_id, service_id')
    .eq('business_id', businessId)
  if (error) throw error

  const map: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!map[row.agent_id]) map[row.agent_id] = []
    map[row.agent_id].push(row.service_id)
  }
  return map
}

// Replaces the full set of services an agent can discuss — the "Assign
// Services" step always sends the complete desired list, so a diff+delete+
// insert is simplest and matches how the modal's checkbox list works.
export async function setAgentServices(
  supabase: DB,
  businessId: string,
  agentId: string,
  serviceIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase.from('agent_services').delete().eq('agent_id', agentId)
  if (deleteError) throw deleteError

  if (serviceIds.length === 0) return

  const rows = serviceIds.map((serviceId) => ({ agent_id: agentId, service_id: serviceId, business_id: businessId }))
  const { error: insertError } = await supabase.from('agent_services').insert(rows)
  if (insertError) throw insertError
}
