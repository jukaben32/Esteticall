import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listConversationsForBusiness } from '@/services/conversations'
import { CallLogTable } from '@/components/CallLogTable'

export default async function CallLogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const conversations = await listConversationsForBusiness(supabase, business.id)

  return (
    <div className="card-surface p-5">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Llamadas</h1>
        <p className="text-sm text-[var(--text-3)]">{conversations.length} conversaciones registradas</p>
      </div>
      <CallLogTable initialConversations={conversations} />
    </div>
  )
}
