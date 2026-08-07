import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listAppointmentsForClientUser } from '@/services/clientPortal'
import { PortalNav } from '@/components/PortalNav'
import { PortalAppointmentsList } from '@/components/PortalAppointmentsList'

export default async function PortalAppointmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const appointments = await listAppointmentsForClientUser(createAdminClient(), user.id)

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)]">
      <PortalNav />
      <PortalAppointmentsList initialAppointments={appointments} />
    </div>
  )
}
