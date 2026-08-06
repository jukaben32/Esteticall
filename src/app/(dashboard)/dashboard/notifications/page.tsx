import { BellRing } from 'lucide-react'
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
      <div className="mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
          <BellRing className="w-4 h-4" />
        </span>
        <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Notificaciones</h1>
      </div>
      <NotificationsPanel initialNotifications={notifications} />
    </div>
  )
}
