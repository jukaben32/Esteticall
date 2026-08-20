import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listBookingsForBusiness } from '@/services/channels'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const bookings = await listBookingsForBusiness(supabase, business.id)
  return NextResponse.json({ bookings })
}
