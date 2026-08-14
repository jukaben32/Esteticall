import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { createVoiceMinutesRechargeCheckoutSession } from '@/services/billing'

// Free never recharges — once its included minutes run out for the month,
// the widget falls back to WhatsApp until the business upgrades. Recharging
// is only offered to Pro/Business, which already pay a subscription.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business found for this user' }, { status: 404 })

  const subscription = await getSubscription(supabase, business.id)
  if (!subscription || subscription.plan === 'free') {
    return NextResponse.json(
      { error: 'Recharging voice minutes requires a Pro or Business plan.' },
      { status: 402 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await createVoiceMinutesRechargeCheckoutSession({
    businessId: business.id,
    ownerEmail: user.email!,
    successUrl: `${appUrl}/dashboard/plan?recharge=success`,
    cancelUrl: `${appUrl}/dashboard/plan?recharge=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
