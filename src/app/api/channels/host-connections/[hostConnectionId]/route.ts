import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { deleteHostConnection, updateHostConnection } from '@/services/channels'
import { channelHostConnectionPatchSchema } from '@/validations'
import type { ChannelHostConnection } from '@/types'

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

// Whitelisted patch — never forwards the raw request body to Supabase.
export async function PATCH(request: Request, props: { params: Promise<{ hostConnectionId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = channelHostConnectionPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const patch: Partial<ChannelHostConnection> = {}
  if (parsed.data.ownerName !== undefined) patch.owner_name = parsed.data.ownerName
  if (parsed.data.ownerPhone !== undefined) patch.owner_phone = parsed.data.ownerPhone || null
  if (parsed.data.ownerEmail !== undefined) patch.owner_email = parsed.data.ownerEmail || null
  if (parsed.data.commissionPct !== undefined) patch.commission_pct = parsed.data.commissionPct
  if (parsed.data.status !== undefined) patch.status = parsed.data.status

  const connection = await updateHostConnection(ctx.supabase, ctx.business.id, params.hostConnectionId, patch)
  return NextResponse.json({ connection })
}

export async function DELETE(_request: Request, props: { params: Promise<{ hostConnectionId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await deleteHostConnection(ctx.supabase, ctx.business.id, params.hostConnectionId)
  return NextResponse.json({ ok: true })
}
