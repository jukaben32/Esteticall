import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { countUnreadNotifications } from '@/services/notifications'
import { isPlatformAdmin } from '@/lib/platformAdmin'
import { BusinessProvider } from '@/providers/BusinessProvider'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { DashboardTopBar } from '@/components/DashboardTopBar'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) redirect('/onboarding')

  const [subscription, unreadCount] = await Promise.all([
    getSubscription(supabase, business.id),
    countUnreadNotifications(supabase, business.id),
  ])

  return (
    <BusinessProvider business={business} subscription={subscription}>
      <div className="min-h-screen flex flex-col lg:flex-row">
        <DashboardSidebar
          businessName={business.name}
          planName={subscription?.plan ?? 'free'}
          showAdminLink={isPlatformAdmin(user.email)}
        />
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <DashboardTopBar
            businessName={business.name}
            planName={subscription?.plan ?? 'free'}
            unreadCount={unreadCount}
          />
          {children}
        </main>
      </div>
    </BusinessProvider>
  )
}
