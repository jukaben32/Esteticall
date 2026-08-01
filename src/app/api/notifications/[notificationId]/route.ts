import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { markNotificationRead } from '@/services/notifications'

export async function PATCH(_request: Request, { params }: { params: { notificationId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 404 })

  const notification = await markNotificationRead(supabase, business.id, params.notificationId)
  return NextResponse.json({ notification })
}
