import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { deletePreventaUnitType, updatePreventaUnitType } from '@/services/preventaProjects'

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

export async function PATCH(
  request: Request,
  props: { params: Promise<{ projectId: string; unitTypeId: string }> }
) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const patch = await request.json()
  const unitType = await updatePreventaUnitType(ctx.supabase, ctx.business.id, params.unitTypeId, patch)
  return NextResponse.json({ unitType })
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ projectId: string; unitTypeId: string }> }
) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await deletePreventaUnitType(ctx.supabase, ctx.business.id, params.unitTypeId)
  return NextResponse.json({ ok: true })
}
