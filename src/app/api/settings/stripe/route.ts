import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, updateBusiness } from '@/services/businesses'
import { stripeSettingsSchema } from '@/validations'

// Saves the business's OWN Stripe keys (used so their clients can pay
// viewing fees online) and flips stripe_connected on — separate from the
// platform's own Stripe account, which bills this business for its plan.
export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 404 })

  const body = await request.json()
  const parsed = stripeSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const hasKeys = Boolean(parsed.data.publishableKey && parsed.data.secretKey)

  const updated = await updateBusiness(supabase, business.id, {
    stripe_publishable_key: parsed.data.publishableKey || null,
    stripe_secret_key: parsed.data.secretKey || null,
    stripe_connected: hasKeys,
  })

  return NextResponse.json({ business: updated })
}
