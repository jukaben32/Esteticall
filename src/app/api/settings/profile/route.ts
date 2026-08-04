import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, updateBusiness } from '@/services/businesses'
import { businessProfileSchema } from '@/validations'

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 404 })

  const body = await request.json()
  const parsed = businessProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const updated = await updateBusiness(supabase, business.id, {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    contact_email: parsed.data.contactEmail || null,
    website: parsed.data.website || null,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    zip_code: parsed.data.zipCode || null,
    timezone: parsed.data.timezone,
  })

  return NextResponse.json({ business: updated })
}
