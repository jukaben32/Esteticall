import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { linkListingToChannel, listChannelListingsForBusiness } from '@/services/channels'
import { channelListingLinkSchema } from '@/validations'

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

export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const channelListings = await listChannelListingsForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ channelListings })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = channelListingLinkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  try {
    const channelListing = await linkListingToChannel(ctx.supabase, ctx.business.id, parsed.data)
    return NextResponse.json({ channelListing })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo vincular la propiedad'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
