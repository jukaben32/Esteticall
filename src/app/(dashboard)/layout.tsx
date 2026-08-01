import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { BusinessProvider } from '@/providers/BusinessProvider'
import { DashboardSidebar } from '@/components/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) redirect('/onboarding')

  const subscription = await getSubscription(supabase, business.id)

  return (
    <BusinessProvider business={business} subscription={subscription}>
      <div className="min-h-screen flex">
        <DashboardSidebar businessName={business.name} planName={subscription?.plan ?? 'free'} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </BusinessProvider>
  )
}
