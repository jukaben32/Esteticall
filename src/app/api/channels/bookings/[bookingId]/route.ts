import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateBookingCommissionStatus } from '@/services/channels'
import { channelBookingPatchSchema } from '@/validations'

export async function PATCH(request: Request, props: { params: Promise<{ bookingId: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 404 })

  const body = await request.json()
  const parsed = channelBookingPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const booking = await updateBookingCommissionStatus(supabase, business.id, params.bookingId, parsed.data.commissionStatus)
  return NextResponse.json({ booking })
}
