import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { unlinkListingFromChannel, updateChannelListing } from '@/services/channels'
import { channelListingPatchSchema } from '@/validations'
import type { ChannelListing } from '@/types'

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

export async function PATCH(request: Request, props: { params: Promise<{ channelListingId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = channelListingPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const patch: Partial<ChannelListing> = {}
  if (parsed.data.overridePrice !== undefined) patch.override_price = parsed.data.overridePrice
  if (parsed.data.nightlyPrice !== undefined) patch.nightly_price = parsed.data.nightlyPrice
  if (parsed.data.currency !== undefined) patch.currency = parsed.data.currency

  const channelListing = await updateChannelListing(ctx.supabase, ctx.business.id, params.channelListingId, patch)
  return NextResponse.json({ channelListing })
}

export async function DELETE(_request: Request, props: { params: Promise<{ channelListingId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await unlinkListingFromChannel(ctx.supabase, ctx.business.id, params.channelListingId)
  return NextResponse.json({ ok: true })
}
