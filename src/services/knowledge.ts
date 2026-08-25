import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { KnowledgeDocument, PlatformKnowledgeDocument } from '@/types'
import type { KnowledgeDocumentInput, PlatformKnowledgeDocumentInput } from '@/validations'

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
      is_active: input.isActive ?? true,
      category: input.category || null,
      catalog_key: input.catalogKey || null,
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

// Shared across every business on the platform — country/market-level facts
// (e.g. CONFOTUR, Ley 108-05) that would otherwise have to be copied into
// every tenant's own knowledge_documents by hand. Managed from /admin/knowledge
// (platform-admin only — see src/lib/platformAdmin.ts).
export async function listPlatformKnowledgeDocuments(supabase: DB): Promise<PlatformKnowledgeDocument[]> {
  const { data, error } = await supabase
    .from('platform_knowledge_documents')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPlatformKnowledgeDocument(
  supabase: DB,
  input: PlatformKnowledgeDocumentInput
): Promise<PlatformKnowledgeDocument> {
  const { data, error } = await supabase
    .from('platform_knowledge_documents')
    .insert({
      title: input.title,
      content: input.content,
      source_url: input.sourceUrl || null,
      category: input.category || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updatePlatformKnowledgeDocument(
  supabase: DB,
  documentId: string,
  patch: Partial<PlatformKnowledgeDocument>
): Promise<PlatformKnowledgeDocument> {
  const { data, error } = await supabase
    .from('platform_knowledge_documents')
    .update(patch)
    .eq('id', documentId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deletePlatformKnowledgeDocument(supabase: DB, documentId: string) {
  const { error } = await supabase.from('platform_knowledge_documents').delete().eq('id', documentId)
  if (error) throw error
}

// Concatenated into the Realtime system prompt (see src/ai) so the agent can
// ground answers in business-specific facts beyond what's in `business_services`.
// PlatformKnowledgeDocument has no is_active toggle (always published), so
// only KnowledgeDocument rows get filtered here.
export function formatKnowledgeForPrompt(docs: (KnowledgeDocument | PlatformKnowledgeDocument)[]): string {
  const activeDocs = docs.filter((d) => !('is_active' in d) || d.is_active !== false)
  if (activeDocs.length === 0) return ''
  return activeDocs.map((d) => `### ${d.title}\n${d.content}`).join('\n\n')
}
