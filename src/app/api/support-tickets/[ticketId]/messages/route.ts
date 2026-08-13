import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { replyToTicket } from '@/services/support'
import { supportMessageSchema } from '@/validations'

export async function POST(request: Request, props: { params: Promise<{ ticketId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 404 })

  const body = await request.json()
  const parsed = supportMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const message = await replyToTicket(supabase, business.id, params.ticketId, parsed.data.body)
  return NextResponse.json({ message })
}
