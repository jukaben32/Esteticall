import { createClient } from '@/lib/supabase/server'
import { listPlatformKnowledgeDocuments } from '@/services/knowledge'
import { PlatformKnowledgeManager } from '@/components/PlatformKnowledgeManager'

export default async function AdminKnowledgePage() {
  const supabase = await createClient()
  const documents = await listPlatformKnowledgeDocuments(supabase)

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Conocimiento de plataforma</h1>
        <p className="text-sm text-[var(--text-3)]">
          Hechos de mercado (leyes, impuestos, procesos) que todo negocio afiliado a InmobilIACall hereda
          automáticamente en el prompt de su agente IA — no hace falta cargarlo negocio por negocio.
        </p>
      </div>
      <PlatformKnowledgeManager initialDocuments={documents} />
    </div>
  )
}
