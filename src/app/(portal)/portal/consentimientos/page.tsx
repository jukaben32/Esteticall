import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listConsentFormsForClientUser } from '@/services/clientPortal'
import { PortalNav } from '@/components/PortalNav'
import { PortalConsentFormsList } from '@/components/PortalConsentFormsList'

export default async function PortalConsentimientosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const forms = await listConsentFormsForClientUser(createAdminClient(), user.id)

  return (
    <div className="min-h-screen bg-[var(--bg-subtle)]">
      <PortalNav />
      <PortalConsentFormsList initialForms={forms} />
    </div>
  )
}
