import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateClientPackageCredit } from '@/services/packages'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { supabase, business }
}

export async function PATCH(request: Request, props: { params: Promise<{ creditId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const body = await request.json()
  const patch: Record<string, unknown> = {}
  if (body.paymentStatus) patch.payment_status = body.paymentStatus
  if (typeof body.sessionsUsed === 'number') patch.sessions_used = body.sessionsUsed
  const credit = await updateClientPackageCredit(ctx.supabase, ctx.business.id, params.creditId, patch)
  return NextResponse.json({ credit })
}
