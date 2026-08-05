import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { createCheckoutSession, createWebsiteBuilderCheckoutSession } from '@/services/billing'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business found for this user' }, { status: 404 })

  const { plan, addon } = await request.json()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session =
    addon === 'website_builder'
      ? await createWebsiteBuilderCheckoutSession({
          businessId: business.id,
          ownerEmail: user.email!,
          successUrl: `${appUrl}/dashboard/website?checkout=success`,
          cancelUrl: `${appUrl}/dashboard/website?checkout=cancelled`,
        })
      : await createCheckoutSession({
          businessId: business.id,
          ownerEmail: user.email!,
          plan,
          successUrl: `${appUrl}/dashboard/plan?checkout=success`,
          cancelUrl: `${appUrl}/dashboard/plan?checkout=cancelled`,
        })

  return NextResponse.json({ url: session.url })
}
