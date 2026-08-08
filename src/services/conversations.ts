import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Client, Conversation, ConversationMessage, ConversationWithClient } from '@/types'

type DB = SupabaseClient<Database>

export async function startConversation(
  supabase: DB,
  businessId: string,
  input: { agentId: string; listingId?: string; channel?: Conversation['channel']; clientId?: string }
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      business_id: businessId,
      agent_id: input.agentId,
      listing_id: input.listingId,
      client_id: input.clientId,
      channel: input.channel ?? 'widget_voice',
      status: 'in_progress',
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function appendMessage(
  supabase: DB,
  businessId: string,
  conversationId: string,
  role: ConversationMessage['role'],
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('conversation_messages')
    .insert({ business_id: businessId, conversation_id: conversationId, role, content })
  if (error) throw error
}

export async function endConversation(
  supabase: DB,
  conversationId: string,
  patch: {
    clientId?: string
    outcome?: Conversation['outcome']
    durationSeconds?: number
  }
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      client_id: patch.clientId,
      outcome: patch.outcome,
      duration_seconds: patch.durationSeconds ?? 0,
    })
    .eq('id', conversationId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listConversationsForBusiness(
  supabase: DB,
  businessId: string
): Promise<ConversationWithClient[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, clients(id, name, phone, email)')
    .eq('business_id', businessId)
    .order('started_at', { ascending: false })
  if (error) throw error

  return ((data ?? []) as unknown as (Conversation & { clients: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null })[]).map(
    (row) => ({ ...row, client: row.clients ?? null })
  )
}

// Called mid-call by the tool relay as soon as a lead/booking happens, so the
// call log reflects who called and what happened even if the call itself
// never cleanly reaches endConversation() (dropped connection, closed tab).
// Never downgrades a stronger outcome already set earlier in the same call
// (e.g. a booked_viewing shouldn't be overwritten by a later qualified_lead).
const OUTCOME_RANK: Record<string, number> = { no_action: 0, qualified_lead: 1, escalated: 1, booked_viewing: 2 }

export async function recordConversationOutcome(
  supabase: DB,
  conversationId: string,
  patch: { clientId: string; outcome: NonNullable<Conversation['outcome']> }
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('conversations')
    .select('outcome')
    .eq('id', conversationId)
    .maybeSingle()
  if (fetchError) throw fetchError

  const currentRank = current?.outcome ? OUTCOME_RANK[current.outcome] ?? 0 : -1
  if (OUTCOME_RANK[patch.outcome] < currentRank) return

  const { error } = await supabase
    .from('conversations')
    .update({ client_id: patch.clientId, outcome: patch.outcome })
    .eq('id', conversationId)
  if (error) throw error
}

export async function setConversationSentiment(
  supabase: DB,
  conversationId: string,
  sentiment: Conversation['sentiment']
): Promise<void> {
  const { error } = await supabase.from('conversations').update({ sentiment }).eq('id', conversationId)
  if (error) throw error
}

export async function getConversationTranscript(
  supabase: DB,
  conversationId: string
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
