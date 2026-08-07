import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listTicketsForClientUser, listBusinessesForClientUser } from '@/services/clientPortal'
import { PortalNav } from '@/components/PortalNav'
import { PortalSupportPanel } from '@/components/PortalSupportPanel'

export default async function PortalSupportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const [tickets, businesses] = await Promise.all([
    listTicketsForClientUser(admin, user.id),
    listBusinessesForClientUser(admin, user.id),
  ])

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)]">
      <PortalNav />
      <PortalSupportPanel initialTickets={tickets} businesses={businesses} />
    </div>
  )
}
