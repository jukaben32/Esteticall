import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Conversation, ConversationMessage } from '@/types'

type DB = SupabaseClient<Database>

export async function startConversation(
  supabase: DB,
  businessId: string,
  input: { agentId: string; listingId?: string; channel?: Conversation['channel'] }
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      business_id: businessId,
      agent_id: input.agentId,
      listing_id: input.listingId,
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
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('business_id', businessId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data ?? []
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
