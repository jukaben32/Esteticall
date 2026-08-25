import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listPackageCreditsForClientUser } from '@/services/clientPortal'
import { PortalNav } from '@/components/PortalNav'
import { PortalPackagesList } from '@/components/PortalPackagesList'

export default async function PortalPaquetesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const packageCredits = await listPackageCreditsForClientUser(createAdminClient(), user.id)

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)]">
      <PortalNav />
      <PortalPackagesList packageCredits={packageCredits} />
    </div>
  )
}
