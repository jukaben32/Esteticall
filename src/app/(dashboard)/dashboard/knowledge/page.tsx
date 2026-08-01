import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listKnowledgeDocuments } from '@/services/knowledge'
import { KnowledgeManager } from '@/components/KnowledgeManager'

export default async function KnowledgePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const documents = await listKnowledgeDocuments(supabase, business.id)

  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Base de conocimiento</h1>
        <p className="text-sm text-[var(--text-3)]">{documents.length} documentos que tu agente IA puede usar para responder</p>
      </div>
      <KnowledgeManager initialDocuments={documents} />
    </div>
  )
}
