import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { createBillingPortalSession } from '@/services/billing'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business found for this user' }, { status: 404 })

  const subscription = await getSubscription(supabase, business.id)
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account yet — subscribe to a plan first' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await createBillingPortalSession({
    stripeCustomerId: subscription.stripe_customer_id,
    returnUrl: `${appUrl}/dashboard/plan`,
  })

  return NextResponse.json({ url: session.url })
}
