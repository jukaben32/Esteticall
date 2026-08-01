import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listNotificationsForBusiness } from '@/services/notifications'
import { NotificationsPanel } from '@/components/NotificationsPanel'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const notifications = await listNotificationsForBusiness(supabase, business.id)

  return (
    <div className="card-surface p-4">
      <div className="mb-4">
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Notificaciones</h1>
      </div>
      <NotificationsPanel initialNotifications={notifications} />
    </div>
  )
}
