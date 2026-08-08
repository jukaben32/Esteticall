import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getWhatsappConnection } from '@/services/whatsapp'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { WhatsappManager } from '@/components/WhatsappManager'

export default async function WhatsappPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [connection, agents] = await Promise.all([
    getWhatsappConnection(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
  ])

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">WhatsApp</h1>
        <p className="text-sm text-[var(--text-3)]">
          Conecta tu WhatsApp para que tu agente IA responda, cualifique y agende por el canal que más usan tus
          clientes.
        </p>
      </div>
      <WhatsappManager initialConnection={connection} agents={agents} />
    </div>
  )
}
