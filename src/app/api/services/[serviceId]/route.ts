import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateService, deleteService } from '@/services/businessServices'

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

export async function PATCH(request: Request, { params }: { params: { serviceId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const patch = await request.json()
  const service = await updateService(ctx.supabase, ctx.business.id, params.serviceId, patch)
  return NextResponse.json({ service })
}

export async function DELETE(_request: Request, { params }: { params: { serviceId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await deleteService(ctx.supabase, ctx.business.id, params.serviceId)
  return NextResponse.json({ ok: true })
}
