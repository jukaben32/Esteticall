import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { KnowledgeDocument } from '@/types'
import type { KnowledgeDocumentInput } from '@/validations'

type DB = SupabaseClient<Database>

export async function listKnowledgeDocuments(
  supabase: DB,
  businessId: string
): Promise<KnowledgeDocument[]> {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createKnowledgeDocument(
  supabase: DB,
  businessId: string,
  input: KnowledgeDocumentInput
): Promise<KnowledgeDocument> {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert({
      business_id: businessId,
      title: input.title,
      content: input.content,
      source_url: input.sourceUrl || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateKnowledgeDocument(
  supabase: DB,
  businessId: string,
  documentId: string,
  patch: Partial<KnowledgeDocument>
): Promise<KnowledgeDocument> {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', documentId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteKnowledgeDocument(supabase: DB, businessId: string, documentId: string) {
  const { error } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('business_id', businessId)
    .eq('id', documentId)
  if (error) throw error
}

// Concatenated into the Realtime system prompt (see src/ai) so the agent can
// ground answers in business-specific facts beyond what's in `listings`.
export function formatKnowledgeForPrompt(docs: KnowledgeDocument[]): string {
  if (docs.length === 0) return ''
  return docs.map((d) => `### ${d.title}\n${d.content}`).join('\n\n')
}
