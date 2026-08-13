import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateListing, deleteListing, assignAgentToListing, unassignAgentFromListing } from '@/services/listings'

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

export async function PATCH(request: Request, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const { agentId, ...patch } = body as { agentId?: string | null; [key: string]: unknown }

  if (agentId !== undefined) {
    if (agentId) {
      await assignAgentToListing(ctx.supabase, ctx.business.id, params.listingId, agentId)
    } else {
      await unassignAgentFromListing(ctx.supabase, ctx.business.id, params.listingId)
    }
  }

  const listing = Object.keys(patch).length
    ? await updateListing(ctx.supabase, ctx.business.id, params.listingId, patch)
    : await getListingByIdPlain(ctx.supabase, ctx.business.id, params.listingId)

  return NextResponse.json({ listing, agentId: agentId ?? null })
}

async function getListingByIdPlain(supabase: Awaited<ReturnType<typeof createClient>>, businessId: string, listingId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', listingId)
    .single()
  if (error) throw error
  return data
}

export async function DELETE(_request: Request, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await deleteListing(ctx.supabase, ctx.business.id, params.listingId)
  return NextResponse.json({ ok: true })
}
